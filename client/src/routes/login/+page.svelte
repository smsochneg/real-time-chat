<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/client';
	import { currentUser } from '$lib/stores/auth';
	import type { User } from '$lib/types';
	import { resolve } from '$app/paths';
	import { LoadingButton } from '$lib/components/ui';

	let email = '';
	let password = '';
	let loading = false;

	async function handleLogin() {
		loading = true;
		try {
			const userData = await apiFetch<User>('/auth/login', 'POST', { email, password });
			currentUser.set(userData);
			goto(resolve('/chat'));
		} finally {
			loading = false;
		}
	}

	async function onRegister() {
		goto(resolve('/register'));
	}
</script>

<div class="mx-auto mt-20 flex max-w-md flex-col gap-4">
	<input bind:value={email} class="input" placeholder="Email" />
	<input bind:value={password} class="input" placeholder="Password" type="password" />
	<LoadingButton {loading} on:click={handleLogin}>Login</LoadingButton>
	<LoadingButton variant="outline" on:click={onRegister}>Register</LoadingButton>
</div>
