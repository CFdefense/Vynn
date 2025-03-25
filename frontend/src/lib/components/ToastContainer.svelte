<script lang="ts">
    import { toastStore } from '$lib/stores/toastStore';
    import ToastComponent from './Toast.svelte';
</script>

<div class="fixed top-4 right-4 z-50 space-y-4">
    {#each $toastStore as toast (toast.id)}
        <ToastComponent 
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            dismissible={toast.dismissible}
            on:dismiss={() => toastStore.dismiss(toast.id)}
        />
    {/each}
</div> 