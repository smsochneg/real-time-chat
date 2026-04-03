<script lang="ts">
	import { apiFetch } from '$lib/api/client';
	import { selectedChatId } from '$lib/stores/chats';
	import { LoadingButton } from '$lib/components/ui';

	export let currentMessage = '';

	let loading = false;
	async function handleSend() {
		if (currentMessage.trim()) {
			loading = true;
			await apiFetch('/messages', 'POST', {
				chatId: $selectedChatId,
				message: currentMessage
			});
			loading = false;
			currentMessage = '';
		}
	}

	async function onPromptKeydown(event: KeyboardEvent) {
		if (['Enter'].includes(event.code)) {
			event.preventDefault();
			await handleSend();
		}
	}
</script>

<section class="border-t border-surface-500/30 p-4">
	<div class="input-group input-group-divider grid-cols-[1fr_auto] rounded-container-token">
		<input
			bind:value={currentMessage}
			class="border-0 bg-transparent ring-0"
			name="prompt"
			id="prompt"
			placeholder="Write a message..."
			on:keydown={onPromptKeydown}
		/>
		<LoadingButton
			{loading}
			disabled={!currentMessage}
			extraClass="max-w-15 min-w-15 max-h-10"
			spinnerWidth="w-9"
			on:click={handleSend}
		>
			Send
		</LoadingButton>
	</div>
</section>
