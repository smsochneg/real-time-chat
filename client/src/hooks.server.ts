import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (!['/login', '/register', '/chat'].includes(pathname)) {
		throw redirect(303, '/chat');
	}
	return await resolve(event);
};
