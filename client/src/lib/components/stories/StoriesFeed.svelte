<!-- src/lib/components/StoriesFeed.svelte -->
<script lang="ts">
	import StoryViewer from './StoryViewer.svelte';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { usersWithStories } from '$lib/stores/stories';
	import type { User } from '$lib/types';
	import StoryRecorder from './StoryRecorder.svelte';

	let selectedUser: User | null;
	let recordingStories: boolean;
	function openUserStories(user: User) {
		selectedUser = user;
	}
	function toggleRecording() {
		recordingStories = !recordingStories;
	}

	function closeViewer() {
		selectedUser = null;
	}
</script>

<div class="flex gap-1 overflow-x-auto p-[12px]">
	<div class="flex w-[70px] cursor-pointer flex-col items-center text-ellipsis text-center">
		<button
			class="leading-12 variant-ghost-surface btn h-12 w-12 rounded-full p-[2px]"
			on:click={toggleRecording}
		>
			<div class="text-[45px] {recordingStories && 'rotate-45'} h-12 w-12 leading-[40px]">+</div>
		</button>
	</div>
	{#each $usersWithStories as user (user.id)}
		<div
			class="flex w-[70px] cursor-pointer flex-col items-center text-ellipsis text-center"
			on:click={() => openUserStories(user)}
		>
			<div class="rounded-full bg-gradient-to-r from-red-600 to-orange-500 p-[2px]">
				<Avatar src="https://i.pravatar.cc/?img={user.username}" width="w-7" />
			</div>
			<span class="w-full truncate text-xs">{user.username}</span>
		</div>
	{/each}
</div>

{#if selectedUser}
	<StoryViewer {selectedUser} onClose={closeViewer} />
{/if}

{#if recordingStories}
	<StoryRecorder />
{/if}
