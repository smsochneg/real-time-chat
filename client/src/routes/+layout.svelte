<script lang="ts">
	import '../app.postcss';
	import { navigating, page } from '$app/stores';
	import { onDestroy } from 'svelte';
	import { currentUser } from '$lib/stores/auth';
	import { initializeStores, Toast, ProgressBar, getToastStore } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { toastBus } from '$lib/stores/utility';

	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
	initializeStores();
	const toastStore = getToastStore();

	let loading = true;

	$: if ($page.data?.user) {
		currentUser.set($page.data.user);
	} else {
		currentUser.set(null);
	}

	const unsub = toastBus.subscribe((data) => {
		if (!data) return;
		console[data.level](data.message);
		const classNames = {
			info: 'variant-filled-success',
			error: 'variant-filled-error',
			warn: 'variant-filled-warning'
		};
		toastStore.trigger({
			message: data.message,
			classes: classNames[data.level] || classNames.info
		});
	});

	import { onMount } from 'svelte';

	onMount(() => {
		// Гидратация завершилась -> приложение интерактивно
		loading = false;
	});

	onDestroy(unsub);
</script>

{#if $navigating || loading}
	<div class="absolute top-0 w-full">
		<ProgressBar />
	</div>
{/if}

<slot />

<Toast />
