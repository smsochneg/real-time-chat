import { derived, writable } from 'svelte/store';
import type { Chat, ChatList, ChatWithOnlyReciever, User } from '$lib/types';
import { apiFetch } from '$lib/api/client';
import { currentUser } from './auth';

export const chats = writable<ChatList>([]);
export const selectedChatId = writable<string>();
export const chatsWithOnlyrecievers = derived([chats, currentUser], ([chatsList, curUser]) => {
	if (!curUser || !chatsList.length) return [];

	return chatsList.map<ChatWithOnlyReciever>((chat) => ({
		id: chat.id,
		receiver: chat.participants.find((u) => u.id !== curUser.id) as User
	}));
});

export async function createChat(participantId: string) {
	if (!participantId) return;
	try {
		const chat = await apiFetch<Chat>(`/chats/create`, 'POST', { participantId });
		addNewChat(chat);
		selectedChatId.set(chat.id);
	} catch (err) {
		console.error(err);
	}
}

export function addNewChat(chat: Chat) {
	chats.update((list) => (list.some((v) => v.id === chat.id) ? list : [...list, chat]));
}
