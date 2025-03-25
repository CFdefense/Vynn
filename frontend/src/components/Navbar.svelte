<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { authStore, isAuthenticated } from '$lib/stores/authStore';
    import { toastStore } from '$lib/stores/toastStore';
    
    // Initialize auth state when component mounts
    if (browser) {
        authStore.initialize();
    }

    const handleLogout = async () => {
        if (browser) {
            const success = await authStore.logout();
            
            if (success) {
                toastStore.success('Successfully logged out');
                goto('/');
            } else {
                toastStore.error('Logout failed');
            }
        }
    };
</script>

<nav class="bg-[#1A2733] p-4 shadow-md">
    <div class="container mx-auto flex justify-between items-center">
        <div>
            <a href="/" class="text-2xl font-bold text-[#E5E5E5]">Neovim for Writers</a>
        </div>
        <div class="flex space-x-3">
            {#if browser && $isAuthenticated}
                <a 
                    href="/drive" 
                    class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] rounded-md text-[#E5E5E5] transition-colors {$page.url.pathname === '/drive' ? 'bg-blue-600' : ''}"
                >
                    Drive
                </a>
                <a 
                    href="/projects" 
                    class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] rounded-md text-[#E5E5E5] transition-colors {$page.url.pathname === '/projects' ? 'bg-blue-600' : ''}"
                >
                    Projects
                </a>
                <button 
                    on:click={handleLogout}
                    class="px-4 py-2 bg-[#2A3743] hover:bg-red-600 rounded-md text-[#E5E5E5] transition-colors"
                >
                    Logout
                </button>
            {:else}
                <a 
                    href="/login" 
                    class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] rounded-md text-[#E5E5E5] transition-colors {$page.url.pathname === '/login' ? 'bg-blue-600' : ''}"
                >
                    Login
                </a>
                <a 
                    href="/signup" 
                    class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] rounded-md text-[#E5E5E5] transition-colors {$page.url.pathname === '/signup' ? 'bg-blue-600' : ''}"
                >
                    Sign Up
                </a>
            {/if}
        </div>
    </div>
</nav> 