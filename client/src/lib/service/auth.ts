import { apiFetch } from '$lib/api/client';

export async function logout() {
	await apiFetch('/auth/logout');
	if (typeof window !== 'undefined') {
		window.location.href = '/login';
	}
}
