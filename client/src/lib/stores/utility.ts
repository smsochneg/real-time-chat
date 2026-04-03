import { writable } from 'svelte/store';

export const toastBus = writable<{ level: 'info' | 'error' | 'warn'; message: string } | null>(
	null
);
