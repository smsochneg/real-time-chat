<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { currentUser } from '$lib/stores/auth';
	import { logout } from '$lib/service/auth';
</script>

<div class="flex items-center gap-3">
	{#if $currentUser}
		<Avatar src="https://i.pravatar.cc/?img={$currentUser.username}" width="w-10" />
		<div class="min-w-0 flex-1">
			<p class="truncate font-medium">{$currentUser.username}</p>
		</div>
		<button
			on:click={logout}
			class="variant-ghost-surface btn btn-sm hover:variant-soft-error"
			title="Logout"
		>
			Logout
		</button>
	{/if}
</div>
