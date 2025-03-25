<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { authStore, requireAuth } from '$lib/stores/authStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingOverlay from './LoadingOverlay.svelte';

    export let redirectTo: string = '/login';
    
    let isChecking = true;
    let isAuthorized = false;
    
    onMount(() => {
        if (!browser) return;
        
        // Initialize auth store if needed
        authStore.initialize();
        
        // Check authentication
        isAuthorized = requireAuth(() => {
            // Custom redirect handler
            goto(redirectTo);
        });
        
        isChecking = false;
    });
</script>

{#if isChecking}
    <LoadingOverlay isLoading={true} message="Checking authentication..." />
{:else if isAuthorized}
    <slot></slot>
{:else}
    <!-- This should never be visible, as requireAuth will redirect -->
    <div class="min-h-screen flex items-center justify-center bg-[#0A1721] text-[#E5E5E5]">
        <div class="bg-[#1A2733] rounded-lg shadow-lg p-8 max-w-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2M9 9h2M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
            </svg>
            <h2 class="text-xl font-bold mb-2">Authentication Required</h2>
            <p class="text-gray-400 mb-6">Please log in to access this page.</p>
            <div class="flex justify-center">
                <a href={redirectTo} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    Go to Login
                </a>
            </div>
        </div>
    </div>
{/if} 