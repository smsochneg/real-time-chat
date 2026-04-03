<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { chatsWithOnlyrecievers, selectedChatId } from '$lib/stores/chats';

	function selectChat(id: string) {
		selectedChatId.set(id);
	}
</script>

<small class="opacity-50">Contacts</small>
<div class="flex flex-col space-y-1">
	{#each $chatsWithOnlyrecievers as chat (chat.id)}
		<button
			type="button"
			class="btn flex w-full items-center space-x-4 {chat.id === $selectedChatId
				? 'variant-filled-primary'
				: 'bg-surface-hover-token'}"
			on:click={() => selectChat(chat.id)}
		>
			<Avatar src="https://i.pravatar.cc/?img={chat.receiver.username}" width="w-8" />
			<span class="flex-1 text-start">
				{chat.receiver.username}
			</span>
		</button>
	{/each}
</div>
