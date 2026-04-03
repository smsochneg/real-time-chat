<!-- src/lib/components/StoryViewer.svelte -->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import Time from 'svelte-time';
	import type { Story, User } from '$lib/types';
	import { getVideoUrl } from '$lib/service/stories';
	import { apiFetch } from '$lib/api/client';

	export let selectedUser: User;
	export let onClose: () => void;

	let stories: Story[] = [];
	let currentIndex = 0;
	let videoElement: HTMLVideoElement | null = null;

	let timer: ReturnType<typeof setTimeout> | null = null;

	$: if (selectedUser) {
		load();
	}

	async function load() {
		stories = await apiFetch<Story[]>(`/stories/${selectedUser.id}`);
	}

	function nextStory() {
		if (currentIndex + 1 < stories.length) {
			currentIndex++;
		} else {
			closeViewer();
		}
	}

	function prevStory() {
		if (currentIndex - 1 >= 0) {
			currentIndex--;
		}
	}

	function closeViewer() {
		if (onClose) onClose();
	}

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

<div
	class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90"
	on:click={closeViewer}
>
	{#if currentIndex > 0}
		<button
			class="variant-filled-surface btn z-10 h-7 w-7 rounded-full p-[2px] text-xl"
			on:click|stopPropagation={prevStory}
		>
			&lt;
		</button>
	{/if}
	<div
		class="relative w-[90%] max-w-[400px] overflow-hidden rounded-lg bg-black"
		on:click|stopPropagation
	>
		<button
			class="variant-filled-surface btn absolute right-2 top-2 z-10 h-7 w-7 rounded-full p-[2px] text-xl"
			on:click={closeViewer}
		>
			×
		</button>

		{#if stories.length > 0}
			<div class="relative">
				{#each stories as story, i (i)}
					{#if i === currentIndex}
						<video
							bind:this={videoElement}
							src={getVideoUrl(story.id)}
							controls
							autoplay
							on:ended={nextStory}
							class="max-h-[80vh] w-full"
						></video>

						<div class="rounded bg-black/50 px-2 py-1 text-sm text-white">
							<Time relative timestamp={story.createdAt} />
						</div>
					{/if}
				{/each}

				<div class="flex gap-1 bg-black/50 p-2">
					{#each stories as _, i (i)}
						<div
							class="h-1 flex-1 rounded-full transition-colors"
							class:bg-white={i === currentIndex}
							class:bg-gray-500={i !== currentIndex}
						></div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
	<button
		class="variant-filled-surface btn z-10 h-7 w-7 rounded-full p-[2px] text-xl"
		on:click|stopPropagation={nextStory}
	>
		&gt;
	</button>
</div>
