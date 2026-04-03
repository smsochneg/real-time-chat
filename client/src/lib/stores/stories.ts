import { writable } from 'svelte/store';
import { toastBus } from './utility';
import type { User } from '$lib/types';

interface MediaRecorderState {
	stream: MediaStream | null;
	recorder: MediaRecorder | null;
	isRecording: boolean;
	recordingTime: number;
	previewBlob: Blob | null;
	cameraReady: boolean;
	maxDuration: number;
}

const initialState: MediaRecorderState = {
	stream: null,
	recorder: null,
	isRecording: false,
	recordingTime: 0,
	previewBlob: null,
	cameraReady: false,
	maxDuration: 15
};

export const mediaRecorderStore = writable<MediaRecorderState>(initialState);
export const usersWithStories = writable<User[]>([]);

let timer: ReturnType<typeof setInterval> | null = null;

export async function initCamera() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

		mediaRecorderStore.update((s) => ({
			...s,
			stream,
			cameraReady: true
		}));
	} catch (err) {
		if (err instanceof Error) {
			toastBus.set({
				message: `Error while connecting to camera: ${err.message}`,
				level: 'error'
			});
		} else {
			console.error(err);
		}
	}
}

export async function startRecording() {
	mediaRecorderStore.update((s) => {
		if (!s.stream) return s;

		const chunks: Blob[] = [];
		const recorder = new MediaRecorder(s.stream, { mimeType: 'video/webm' });

		recorder.ondataavailable = (event) => {
			if (event.data.size > 0) chunks.push(event.data);
		};

		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: 'video/webm' });

			mediaRecorderStore.update((st) => ({
				...st,
				previewBlob: blob,
				recorder: null,
				isRecording: false
			}));

			if (timer) clearInterval(timer);
			timer = null;
		};

		recorder.start();

		if (timer) clearInterval(timer);
		let time = 0;

		timer = setInterval(() => {
			mediaRecorderStore.update((st) => {
				time = st.recordingTime + 0.1;

				if (time >= st.maxDuration) {
					recorder.stop();
					return { ...st, recordingTime: time };
				}

				return { ...st, recordingTime: time };
			});
		}, 100);

		return {
			...s,
			recorder,
			isRecording: true,
			recordingTime: 0
		};
	});
}

export async function stopRecording() {
	mediaRecorderStore.update((s) => {
		if (s.isRecording && s.recorder) {
			s.recorder.stop();
		}
		return s;
	});
}

export async function resetRecording() {
	mediaRecorderStore.update((s) => ({
		...s,
		previewBlob: null,
		isRecording: false,
		recordingTime: 0
	}));
}

export async function clearRecordingStore() {
	if (timer) clearInterval(timer);
	timer = null;

	mediaRecorderStore.update((s) => {
		if (s.stream) s.stream.getTracks().forEach((t) => t.stop());
		return { ...initialState };
	});
}
