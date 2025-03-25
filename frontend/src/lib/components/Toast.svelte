<script lang="ts">
    import { fly, fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    
    export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
    export let message: string;
    export let duration: number = 5000; // Auto-dismiss after 5 seconds by default
    export let dismissible: boolean = true;
    
    const dispatch = createEventDispatcher();
    
    // Set up auto-dismiss
    let timeoutId: number | null = null;
    
    // Background colors based on type
    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    };
    
    // Icons based on type
    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };
    
    function dismiss() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        dispatch('dismiss');
    }
    
    // Start auto-dismiss timer if duration is positive
    if (duration > 0) {
        timeoutId = window.setTimeout(dismiss, duration);
    }
</script>

<div 
    class="fixed top-4 right-4 z-50 max-w-md shadow-lg rounded-lg overflow-hidden"
    in:fly={{ y: -20, duration: 300 }}
    out:fade={{ duration: 200 }}
>
    <div class={`${bgColors[type]} px-4 py-3 text-white flex items-center justify-between`}>
        <div class="flex items-center space-x-2">
            <span class="text-xl">{icons[type]}</span>
            <span>{message}</span>
        </div>
        {#if dismissible}
            <button 
                on:click={dismiss}
                class="text-white hover:text-gray-200 focus:outline-none"
                aria-label="Dismiss"
            >
                ✕
            </button>
        {/if}
    </div>
</div> 