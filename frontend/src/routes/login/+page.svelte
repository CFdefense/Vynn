<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { Login } from '$lib/ts/login';
    import { authStore, isAuthenticated, isLoading, authError } from '$lib/stores/authStore';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingOverlay from '$lib/components/LoadingOverlay.svelte';
    
    // Variables for form inputs
    let email = '';
    let password = '';
    
    // Subscribe to auth state
    const unsubscribe = isAuthenticated.subscribe(value => {
        if (value) {
            goto('/projects');
        }
    });
    
    // Check if already logged in on mount
    onMount(() => {
        authStore.initialize();
        
        // If already authenticated, redirect
        if ($isAuthenticated) {
            goto('/projects');
        }
    });
    
    // Clean up subscription
    onDestroy(() => {
        unsubscribe();
    });
    
    // Handle login form submission
    async function handleLogin() {
        // Basic validation
        if (!email.trim() || !password.trim()) {
            toastStore.error('Please enter email and password');
            return;
        }
        
        // Create login payload
        const loginPayload = new Login(email, password);
        
        // Attempt login
        const success = await authStore.login(loginPayload);
        
        if (success) {
            toastStore.success('Login successful');
            goto('/projects');
        } else if ($authError) {
            toastStore.error($authError);
        }
    }
</script>

<div class="min-h-screen bg-[#0A1721] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <LoadingOverlay isLoading={$isLoading} message="Logging in..." />
    
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 class="mt-6 text-center text-3xl font-extrabold text-[#E5E5E5]">
            Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-[#A0AEC0]">
            Or
            <a href="/signup" class="font-medium text-blue-500 hover:text-blue-400">
                create a new account
            </a>
        </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-[#1A2733] py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form class="space-y-6" on:submit|preventDefault={handleLogin}>
                <div>
                    <label for="email" class="block text-sm font-medium text-[#E5E5E5]">
                        Email address
                    </label>
                    <div class="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autocomplete="email"
                            required
                            bind:value={email}
                            class="appearance-none block w-full px-3 py-2 border border-[#3A4753] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#2A3743] text-[#E5E5E5]"
                            disabled={$isLoading}
                        />
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-sm font-medium text-[#E5E5E5]">
                        Password
                    </label>
                    <div class="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            required
                            bind:value={password}
                            class="appearance-none block w-full px-3 py-2 border border-[#3A4753] rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-[#2A3743] text-[#E5E5E5]"
                            disabled={$isLoading}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={$isLoading}
                    >
                        {#if $isLoading}
                            <span class="animate-spin mr-2">↻</span>
                        {/if}
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    </div>
</div> 