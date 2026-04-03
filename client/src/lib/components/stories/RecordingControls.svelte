<script lang="ts">
	import {
		mediaRecorderStore,
		usersWithStories,
		startRecording,
		stopRecording,
		resetRecording
	} from '$lib/stores/stories';
	import { uploadStory } from '$lib/service/stories';
	import { toastBus } from '$lib/stores/utility';
	import { ProgressBar } from '@skeletonlabs/skeleton';
	import { currentUser } from '$lib/stores/auth';
	import { LoadingButton } from '$lib/components/ui';

	$: isRecording = $mediaRecorderStore.isRecording;
	$: recordingTime = $mediaRecorderStore.recordingTime;
	$: previewBlob = $mediaRecorderStore.previewBlob;
	$: maxDuration = $mediaRecorderStore.maxDuration;

	let loading = false;
	async function handleUpload() {
		if (!previewBlob) return;

		try {
			const file = new File([previewBlob], 'story.webm', { type: 'video/webm' });
			loading = true;
			await uploadStory(file);
			if ($currentUser && !$usersWithStories.some((user) => user.id === $currentUser?.id)) {
				usersWithStories.update((s) => [...s, $currentUser]);
			}
			resetRecording();
		} catch (err) {
			if (err instanceof Error) {
				toastBus.set({
					message: `Error while uploading story: ${err.message}`,
					level: 'error'
				});
			} else {
				console.error(err);
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="mb-4 flex flex-col justify-center gap-2">
	{#if !isRecording && !previewBlob}
		<LoadingButton on:click={startRecording}>Start recording</LoadingButton>
	{:else if isRecording}
		<ProgressBar min={0} max={maxDuration} value={recordingTime} />
		<LoadingButton on:click={stopRecording}>Stop</LoadingButton>
	{:else if previewBlob}
		<LoadingButton {loading} on:click={handleUpload}>Send</LoadingButton>
		<LoadingButton variant="outline" on:click={resetRecording}>Record again</LoadingButton>
	{/if}
</div>
