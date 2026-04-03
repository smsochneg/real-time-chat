import { env } from '$env/dynamic/public';

export async function uploadStory(videoFile: File) {
	const formData = new FormData();
	formData.append('video', videoFile);

	const response = await fetch(env.PUBLIC_API_URL + `/stories`, {
		credentials: 'include',
		method: 'POST',
		body: formData
	});

	return response;
}

export function getVideoUrl(storyId: string) {
	return env.PUBLIC_API_URL + `/stories/${storyId}/video`;
}
