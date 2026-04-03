<script lang="ts">
	import { apiFetch } from '$lib/api/client';
	import { createChat } from '$lib/stores/chats';
	import { toastBus } from '$lib/stores/utility';
	import type { User } from '$lib/types';
	import {
		Autocomplete,
		type AutocompleteOption,
		type PopupSettings,
		popup,
		ProgressRadial
	} from '@skeletonlabs/skeleton';
	import { onDestroy, onMount } from 'svelte';

	const DEBOUNCE_MS = 300;

	let popupSettings: PopupSettings = {
		event: 'focus-click',
		target: 'popupAutocomplete',
		placement: 'bottom'
	};

	let searchValue = '';
	let options: AutocompleteOption[] = [];
	let loading = false;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(async () => await fetchOptions());
	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
	});

	async function fetchOptions() {
		loading = true;
		try {
			const users = await apiFetch<User[]>(
				`/users/search?username=${encodeURIComponent(searchValue)}`
			);

			options = users.map((user) => ({
				label: user.username,
				value: user.id
			}));
		} catch (_error) {
			toastBus.set({
				message: 'Failed to search users',
				level: 'error'
			});
			options = [];
		} finally {
			loading = false;
		}
	}

	function handleInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fetchOptions, DEBOUNCE_MS);
	}

	async function handleSelection(event: CustomEvent<AutocompleteOption>) {
		const participantId = event.detail.value as string;
		try {
			await createChat(participantId);
		} catch (_error) {
			toastBus.set({
				message: 'Failed to create chat',
				level: 'error'
			});
		}
	}
</script>

<div class="text-token w-full max-w-sm space-y-2">
	<div class="relative">
		<input
			class="autocomplete input pr-10"
			type="search"
			name="autocomplete-search"
			bind:value={searchValue}
			on:input={handleInput}
			placeholder="Search..."
			use:popup={popupSettings}
		/>
		{#if loading}
			<div class="absolute right-3 top-1/2 -translate-y-1/2">
				<ProgressRadial width="w-5" />
			</div>
		{/if}
	</div>
	<div
		data-popup="popupAutocomplete"
		class="card z-10 max-h-48 w-full max-w-sm overflow-y-auto p-4"
		tabindex="-1"
	>
		<Autocomplete
			transitions={false}
			bind:input={searchValue}
			{options}
			on:selection={handleSelection}
		/>
	</div>
</div>
