<script lang="ts">
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let loading = false;
	export let disabled = false;
	export let variant: 'filled' | 'outline' = 'filled';
	export let spinnerWidth = 'w-6';
	export let extraClass = '';

	// Без этого PurgeCss не добавит стили для этих классов
	const variantClasses = {
		filled: 'variant-filled-primary',
		outline: 'variant-outline-primary'
	} as const;

	$: isDisabled = loading || disabled;
	$: variantClass = isDisabled ? 'input-group-shim' : variantClasses[variant];
</script>

<button type="button" class="btn {variantClass} {extraClass || ''}" disabled={isDisabled} on:click>
	{#if loading}
		<ProgressRadial width={spinnerWidth} />
	{:else}
		<slot />
	{/if}
</button>
