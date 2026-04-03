import { derived, get, writable } from 'svelte/store';
import { selectedChatId } from './chats';
import { apiFetch } from '$lib/api/client';
import type { Message } from '$lib/types';
import type { Unsubscriber } from 'svelte/motion';

export const messagesMap = writable<Record<string, { items: Message[] }>>({});
export const messagesLoadingPerChat = writable<Record<string, boolean>>({});
const pendingMessages = writable<Record<string, Message[]>>({});

export const currentMessages = derived([messagesMap, selectedChatId], ([map, chatId]) => {
	return chatId && map[chatId] ? map[chatId].items : [];
});

export const currentChatLoading = derived(
	[messagesLoadingPerChat, selectedChatId],
	([loading, chatId]) => loading[chatId]
);

// Мы нажали на чат, начали грузить сообщения - а сокет уже подключился и принимает новые сообщения.
// Соответственно пока чат грузится - то, что пришло по сокету пишем в pending, а после окончания загрузки - выливаем оттуда.
export function addIncomingMessage(message: Message) {
	if (isChatLoading(message.chatId)) {
		pendingMessages.update((p) => ({
			...p,
			[message.chatId]: [...(p[message.chatId] || []), message]
		}));
	} else {
		addMessage(message);
	}
}

export function addMessage(message: Message) {
	messagesMap.update((map) => {
		const entry = map[message.chatId];
		if (!entry) return map;
		const merged = deduplicateMessages([...entry.items, message]);
		return { ...map, [message.chatId]: { ...entry, items: merged } };
	});
}

function setChatLoading(chatId: string, value: boolean) {
	messagesLoadingPerChat.update((m) => ({ ...m, [chatId]: value }));
}

function isChatLoading(chatId: string) {
	return get(messagesLoadingPerChat)[chatId] || false;
}

function deduplicateMessages(messages: Message[]): Message[] {
	const seen = new Set<string>();
	return messages.filter((msg) => {
		if (seen.has(msg.id)) return false;
		seen.add(msg.id);
		return true;
	});
}

function flushPending(chatId: string) {
	const pending = get(pendingMessages)[chatId] || [];
	if (!pending.length) return;
	messagesMap.update((map) => {
		const entry = map[chatId];
		if (!entry) return map;
		const merged = deduplicateMessages([...entry.items, ...pending]);
		return { ...map, [chatId]: { ...entry, items: merged } };
	});
	pendingMessages.update((p) => ({ ...p, [chatId]: [] }));
}

export async function loadMessages(chatId: string) {
	if (!chatId) return;
	const entry = get(messagesMap)[chatId];
	if (entry?.items?.length) {
		const lastId = entry.items[entry.items.length - 1]?.id;
		if (lastId) {
			await loadNewMessages(chatId, lastId);
			return;
		}
	}
	await loadInitialMessages(chatId);
}

async function loadInitialMessages(chatId: string) {
	try {
		setChatLoading(chatId, true);
		const messages = await apiFetch<Message[]>(`/messages/${chatId}`);
		messagesMap.update((map) => ({
			...map,
			[chatId]: { items: messages, lastMessageId: messages[messages.length - 1]?.id }
		}));
		flushPending(chatId);
	} catch (err) {
		console.error(err);
	} finally {
		setChatLoading(chatId, false);
	}
}

async function loadNewMessages(chatId: string, afterMessageId: string) {
	try {
		setChatLoading(chatId, true);
		const newMessages = await apiFetch<Message[]>(`/messages/${chatId}/from/${afterMessageId}`);
		messagesMap.update((map) => {
			const entry = map[chatId];
			if (!entry) return map;
			const merged = deduplicateMessages([...entry.items, ...newMessages]);
			return { ...map, [chatId]: { ...entry, items: merged } };
		});
		flushPending(chatId);
	} catch (err) {
		console.error(err);
	} finally {
		setChatLoading(chatId, false);
	}
}

let unsubscribe: Unsubscriber;
if (typeof window !== 'undefined') {
	unsubscribe = selectedChatId.subscribe(async (chatId) => {
		if (chatId) {
			await loadMessages(chatId);
		}
	});
}

export function cleanup() {
	if (unsubscribe) unsubscribe();
}
