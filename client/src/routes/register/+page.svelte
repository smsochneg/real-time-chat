<script lang="ts">
	import { goto } from '$app/navigation';
	import { apiFetch } from '$lib/api/client';
	import { resolve } from '$app/paths';
	import { LoadingButton } from '$lib/components/ui';

	let username = '';
	let email = '';
	let password = '';
	let loading = false;

	async function handleRegister() {
		loading = true;
		try {
			await apiFetch('/auth/register', 'POST', { email, username, password });
			goto(resolve('/login'));
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto mt-20 flex max-w-md flex-col gap-4">
	<input bind:value={username} class="input" placeholder="Username" />
	<input bind:value={email} class="input" placeholder="Email" />
	<input bind:value={password} class="input" placeholder="Password" type="password" />
	<LoadingButton
		{loading}
		disabled={!username || !email || !password}
		variant="outline"
		on:click={handleRegister}
	>
		Register
	</LoadingButton>
</div>
