<script lang="ts">
	import { onMount } from 'svelte';
	import ChatMessage from './ChatMessage.svelte';
	import { currentMessages, currentChatLoading } from '$lib/stores/messages';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	let elemChat: HTMLElement;

	export function scrollChatBottom(): void {
		if (elemChat) {
			elemChat.scrollTo({ top: elemChat.scrollHeight });
		}
	}

	onMount(() => {
		scrollChatBottom();
	});

	$: if ($currentMessages.length) {
		setTimeout(() => {
			scrollChatBottom();
		}, 0);
	}
</script>

<section bind:this={elemChat} class="overflow-y-auto p-4">
	{#if $currentChatLoading}
		<div class="flex h-full w-full items-center justify-center">
			<ProgressRadial meter="stroke-primary-500" track="stroke-primary-500/30" />
		</div>
	{:else}
		<div class="flex min-h-full w-full flex-col justify-end space-y-4">
			{#each $currentMessages as message (message.id)}
				<ChatMessage {message} />
			{/each}
		</div>
	{/if}
</section>
