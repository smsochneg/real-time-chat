import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { serverApiFetch } from '$lib/api/server';

export const load: LayoutServerLoad = async ({ fetch, url, request }) => {
	const cookie = request.headers.get('cookie') || '';
	if (!['/login', '/register'].includes(url.pathname)) {
		try {
			const user = await serverApiFetch(fetch, cookie, '/users/current');

			return { user };
		} catch (e) {
			console.error(e);
			redirect(302, '/login');
		}
	}
};
