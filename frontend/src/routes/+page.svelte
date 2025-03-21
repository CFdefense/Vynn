<!-- frontend/src/routes/+page.svelte -->

<!--
    This is our root main page. It's the first page that loads when we go to the root URL.
    Svelte is a framework that allows us to build web applications using HTML, CSS, and Typescript.
    In a Svelte file we can have HTML, CSS, and Typescript code.
-->
<script lang="ts">
    import { onMount } from 'svelte';
    import { logout } from "$lib/ts/login";
    
    // Don't auto-redirect - let user choose
    
    async function handleLogout() {
        try {
            await logout();
            // Refresh the page after logout
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
            alert("Failed to logout. Please try again.");
        }
    }
</script>

<main class="min-h-screen bg-[#0A1721] flex flex-col items-center justify-center text-[#E5E5E5]">
    <h1 class="text-4xl mb-4">Welcome to Neovim for Writers</h1>
    <p class="text-lg max-w-2xl text-center mb-8">
        A text editor with Vim-style keyboard shortcuts
    </p>
    
    <div class="flex flex-col space-y-4 items-center">
        <a href="/login" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors w-64 text-center">
            Login
        </a>
        <a href="/signup" class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] text-white rounded-md transition-colors w-64 text-center">
            Sign Up
        </a>
        
        <div class="border-t border-gray-700 my-4 w-64"></div>
        
        <p class="text-gray-400">Skip login and go directly to:</p>
        
        <a href="/document/2" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors w-64 text-center">
            Open Text Editor Directly
        </a>
        
        <a href="/projects" class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] text-white rounded-md transition-colors w-64 text-center">
            View Projects
        </a>
    </div>
</main> 