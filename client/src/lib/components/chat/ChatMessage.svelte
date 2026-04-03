<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import type { Message } from '$lib/types';
	import { currentUser } from '$lib/stores/auth';
	import Time from 'svelte-time/Time.svelte';

	export let message: Message;

	$: isOwnMessage = message.sender.id === $currentUser?.id;

	$: gridClass = isOwnMessage ? 'grid-cols-[1fr_auto]' : 'grid-cols-[auto_1fr]';
	$: cardClass = isOwnMessage
		? 'variant-soft-primary rounded-tr-none'
		: 'variant-soft rounded-tl-none';
</script>

<div class="grid {gridClass} gap-2">
	{#if !isOwnMessage}
		<Avatar src="https://i.pravatar.cc/?img={message.sender.username}" width="w-12" />
	{/if}

	<div class="card space-y-2 p-4 {cardClass}">
		<header class="flex items-center justify-between gap-4">
			<p class="font-bold">{message.sender.username}</p>
			<small class="opacity-50"
				><Time timestamp={message.createdAt} format="MMM DD, YYYY hh:mm" /></small
			>
		</header>
		<p>{message.message}</p>
	</div>

	{#if isOwnMessage}
		<Avatar src="https://i.pravatar.cc/?img={message.sender.username}" width="w-12" />
	{/if}
</div>
