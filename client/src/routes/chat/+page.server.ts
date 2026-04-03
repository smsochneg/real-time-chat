import { serverApiFetch } from '$lib/api/server';
import { type User, type ChatList } from '$lib/types';
import type { LayoutServerLoad } from '../$types';

export const load: LayoutServerLoad = async ({ fetch, request }) => {
	const cookie = request.headers.get('cookie') || '';

	const [chatsList, usersWithStories] = await Promise.all([
		serverApiFetch<ChatList>(fetch, cookie, '/chats'),
		serverApiFetch<User[]>(fetch, cookie, '/stories')
	]);

	return { chatsList, usersWithStories };
};
