<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { requireAuth } from '$lib/ts/auth';
    
    onMount(() => {
        // Check authentication first
        if (!requireAuth()) {
            return;
        }
        
        // Get parameters from URL
        const searchParams = $page.url.searchParams;
        const projectId = searchParams.get('project');
        const name = searchParams.get('name') || 'Untitled Document';
        
        // Generate a random ID for demo purposes
        const documentId = Math.floor(Math.random() * 10000) + 100;
        
        // Build the redirect URL
        let redirectUrl = `/document/${documentId}?newDoc=true&name=${encodeURIComponent(name)}`;
        if (projectId) {
            redirectUrl += `&project=${projectId}`;
        }
        
        // Redirect to the document page
        window.location.href = redirectUrl;
    });
</script>

<div class="min-h-screen flex items-center justify-center bg-white">
    <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-700">Creating new document...</p>
    </div>
</div> 