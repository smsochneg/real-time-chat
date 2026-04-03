import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';

export async function serverApiFetch<T = unknown>(
	fetchFn: typeof fetch,
	cookie: string,
	url: string,
	method = 'GET',
	body?: object
): Promise<T> {
	const res = await fetchFn(env.PRIVATE_API_URL + url, {
		method,
		headers: {
			Cookie: cookie,
			'Content-Type': 'application/json'
		},
		body: body ? JSON.stringify(body) : undefined
	});

	if (!res.ok) {
		let message;
		try {
			const err = await res.json();
			message = err.message;
		} catch {
			message = res.statusText;
		}
		throw error(res.status, message);
	}

	return res.json();
}
