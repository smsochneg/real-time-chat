<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mediaRecorderStore } from '$lib/stores/stories';

	let videoElement: HTMLVideoElement;
	let previewUrl: string | null = null;
	let stream: MediaStream | null = null;
	let unsubscribe: () => void;

	onMount(() => {
		unsubscribe = mediaRecorderStore.subscribe((state) => {
			if (state.stream !== stream) {
				stream = state.stream;
				if (videoElement) {
					videoElement.srcObject = stream;
				}
			}
			if (state.previewBlob) {
				if (previewUrl) URL.revokeObjectURL(previewUrl);
				previewUrl = URL.createObjectURL(state.previewBlob);
			} else if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
				previewUrl = null;
			}
		});
	});

	onDestroy(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
		if (unsubscribe) unsubscribe();
	});
</script>

<div class="relative w-full overflow-hidden rounded-lg bg-black">
	<video bind:this={videoElement} autoplay muted playsinline class="h-auto max-h-96 w-full"></video>
	{#if previewUrl}
		<video controls src={previewUrl} class="absolute inset-0 h-full w-full object-cover"></video>
	{/if}
</div>
