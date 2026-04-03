import type { User } from '$lib/types';
import { writable } from 'svelte/store';

export const currentUser = writable<User | null>();
