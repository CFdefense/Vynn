<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    
    // This is a safer method to check if logged in that works with SSR
    const isLoggedIn = () => {
        // Always return false during server-side rendering
        if (!browser) {
            return false;
        }
        
        try {
            // Only check these in browser environment
            const path = window.location.pathname;
            // Automatically consider logged in on protected routes
            if (path.startsWith('/projects') || 
                path.startsWith('/drive') || 
                path.startsWith('/document/')) {
                return true;
            }
            
            // Also check for auth cookie
            if (document.cookie.includes('auth-token')) {
                return true;
            }
            
            return false;
        } catch (e) {
            // Always default to false if there's an error
            console.error("Error in isLoggedIn:", e);
            return false;
        }
    };

    const handleLogout = () => {
        if (browser) {
            // Only run fetch in browser environment
            fetch('http://localhost:3001/api/users/logout')
                .then(() => {
                    window.location.href = '/';
                })
                .catch(error => {
                    console.error('Failed to logout', error);
                });
        }
    };
</script>

<nav class="bg-[#1A2733] p-4 shadow-md">
    <div class="container mx-auto flex justify-between items-center">
        <div>
            <a href="/" class="text-2xl font-bold text-[#E5E5E5]">Neovim for Writers</a>
        </div>
        <div class="flex space-x-3">
            {#if browser && isLoggedIn()}
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