<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { clearRecordingStore, initCamera } from '$lib/stores/stories';
	import CameraPreview from './CameraPreview.svelte';
	import RecordingControls from './RecordingControls.svelte';

	onMount(() => {
		initCamera();
	});

	onDestroy(() => {
		clearRecordingStore();
	});
</script>

<div class="mx-auto max-w-md rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
	<CameraPreview />
	<RecordingControls />
</div>
