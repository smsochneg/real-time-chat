<script lang="ts">
	import { ChatSidebar, ChatConversation, MessageInput } from '$lib/components/chat';
	import { page } from '$app/stores';
	import { chats, selectedChatId } from '$lib/stores/chats';
	import { onMount, onDestroy } from 'svelte';
	import { connectSocket, disconnectSocket } from '$lib/service/websocket';
	import { usersWithStories } from '$lib/stores/stories';
	import StoriesFeed from '$lib/components/stories/StoriesFeed.svelte';

	$: if ($page.data) {
		chats.set($page.data.chatsList);
		usersWithStories.set($page.data.usersWithStories);
	}

	onMount(() => {
		connectSocket();
	});

	onDestroy(() => {
		disconnectSocket();
	});
</script>

<div class="chat grid h-full w-full grid-cols-[auto_1fr]">
	<ChatSidebar />
	<div class="grid h-screen grid-rows-[auto_1fr_auto] border-r border-surface-500/30">
		<header class="border-b border-surface-500/30">
			<StoriesFeed />
		</header>
		{#if $selectedChatId}
			<ChatConversation />
			<MessageInput />
		{/if}
	</div>
</div>
