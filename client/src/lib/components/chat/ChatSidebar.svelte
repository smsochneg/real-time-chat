<script lang="ts">
	import ChatSidebarList from './ChatSidebarList.svelte';

	import ChatSidebarFooter from './ChatSidebarFooter.svelte';

	import SearchInput from './SearchInput.svelte';
</script>

<div class="grid grid-rows-[auto_1fr_auto] border-r border-surface-500/30">
	<header class="border-b border-surface-500/30 p-4">
		<SearchInput />
	</header>
	<div class="space-y-4 overflow-y-auto p-4">
		<ChatSidebarList />
	</div>
	<footer class="border-t border-surface-500/30 p-4">
		<ChatSidebarFooter />
	</footer>
</div>
