import { toastBus } from '$lib/stores/utility';
import { env } from '$env/dynamic/public';

const PUBLIC_PATHS = ['/auth/login'];

export async function apiFetch<T = unknown>(
	url: string,
	method = 'GET',
	body?: object
): Promise<T> {
	const res = await fetch(env.PUBLIC_API_URL + url, {
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		method,
		body: JSON.stringify(body)
	});

	if (res.status === 401 && !PUBLIC_PATHS.includes(url)) {
		toastBus.set({ message: 'Unauthorized', level: 'error' });
		if (typeof window !== 'undefined') {
			window.location.href = '/login';
		}
		throw new Error('Unauthorized');
	}

	if (!res.ok) {
		const err = await res.json();
		toastBus.set({ message: err.message, level: 'error' });
		throw new Error(err.message);
	}

	return res.json();
}
