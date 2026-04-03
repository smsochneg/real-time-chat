import { io, Socket } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import { addNewChat, selectedChatId } from '$lib/stores/chats';
import { addIncomingMessage } from '$lib/stores/messages';
import { env } from '$env/dynamic/public';
import { toastBus } from '$lib/stores/utility';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { Unsubscriber } from 'svelte/store';

export type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export const socketStatus = writable<SocketStatus>('disconnected');

class WebSocketService {
	private socket: Socket | null = null;
	private chatSubscription: Unsubscriber | null = null;
	private previousChatId: string | null = null;

	connect(): void {
		if (this.socket?.connected) {
			return;
		}

		socketStatus.set('connecting');

		this.socket = io(env.PUBLIC_API_URL, {
			transports: ['websocket'],
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			withCredentials: true
		});

		this.setupEventListeners();
		this.setupChatSubscription();
	}

	disconnect(): void {
		this.cleanup();
	}

	emit(event: string, data: unknown): void {
		if (!this.socket?.connected) {
			console.warn(`WebSocketService: Cannot emit '${event}' - not connected`);
			return;
		}
		this.socket.emit(event, data);
	}

	private setupEventListeners(): void {
		if (!this.socket) return;

		this.socket.on('connect', () => {
			console.log('Socket.IO connected');
			socketStatus.set('connected');

			const currentChatId = get(selectedChatId);
			if (currentChatId) {
				this.socket?.emit('chat:join', { chatId: currentChatId });
				this.previousChatId = currentChatId;
			}
		});

		this.socket.on('disconnect', (reason) => {
			console.log('Socket.IO disconnected:', reason);
			socketStatus.set('disconnected');
		});

		this.socket.on('connect_error', (err) => {
			console.error('Socket.IO connection error:', err);
			socketStatus.set('error');
			toastBus.set({
				message: 'Connection error. Retrying...',
				level: 'warn'
			});
		});

		this.socket.on('message:broadcast', (data) => {
			addIncomingMessage(data);
		});

		this.socket.on('chat:created', (data) => {
			addNewChat(data);
		});

		this.socket.on('error', (data: { code?: string; message?: string }) => {
			this.handleServerError(data);
		});
	}

	private handleServerError(data: { code?: string; message?: string }): void {
		switch (data.code) {
			case 'UNAUTHORIZED':
				toastBus.set({
					message: 'Session expired. Please login again.',
					level: 'error'
				});
				this.disconnect();
				goto(resolve('/login'));
				break;

			case 'FORBIDDEN':
				toastBus.set({
					message: 'Access to this chat is forbidden',
					level: 'error'
				});
				break;

			default:
				toastBus.set({
					message: data.message || 'WebSocket error occurred',
					level: 'error'
				});
		}
	}

	private setupChatSubscription(): void {
		if (this.chatSubscription) {
			return;
		}

		this.chatSubscription = selectedChatId.subscribe((newChatId) => {
			if (!this.socket?.connected) return;

			if (this.previousChatId !== null) {
				this.socket.emit('chat:leave', { chatId: this.previousChatId });
			}

			if (newChatId) {
				this.socket.emit('chat:join', { chatId: newChatId });
				this.previousChatId = newChatId;
			} else {
				this.previousChatId = null;
			}
		});
	}

	private cleanup(): void {
		if (this.chatSubscription) {
			this.chatSubscription();
			this.chatSubscription = null;
		}

		if (this.socket) {
			this.socket.removeAllListeners();
			this.socket.disconnect();
			this.socket = null;
		}

		this.previousChatId = null;
		socketStatus.set('disconnected');
	}
}

let serviceInstance: WebSocketService | null = null;

export function getWebSocketService(): WebSocketService {
	if (!serviceInstance) {
		serviceInstance = new WebSocketService();
	}
	return serviceInstance;
}

export function connectSocket(): void {
	getWebSocketService().connect();
}

export function disconnectSocket(): void {
	if (serviceInstance) {
		serviceInstance.disconnect();
	}
}
