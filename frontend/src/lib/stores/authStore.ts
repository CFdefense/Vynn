/*
/ authStore.ts
/
/ Store for managing authentication state across the application
/
/ Summary:
/ - Provides methods to check authentication status
/ - Handles authentication errors
/ - Manages user session
/ - Provides login and logout functionality
*/

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { toastStore } from './toastStore';
import { attempt_login, logout } from '../ts/login';
import type { Login } from '../ts/login';

// User interface
export interface User {
    id: number;
    name: string;
    email: string;
}

// Auth store state interface
interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

// Initial state
const initialState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
    error: null
};

// Create the auth store
function createAuthStore() {
    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,
        
        // Initialize auth state from cookies on app start
        initialize: () => {
            if (!browser) return; // Only run in browser
            
            update(state => ({ ...state, loading: true }));
            
            // Check if there's an auth cookie
            const isLoggedIn = checkAuthCookie();
            
            if (isLoggedIn) {
                // If there's a valid auth cookie, set authenticated state
                update(state => ({
                    ...state,
                    isAuthenticated: true, 
                    loading: false
                }));
            } else {
                // Otherwise reset to initial state
                update(state => ({ 
                    ...initialState,
                    loading: false
                }));
            }
        },
        
        // Login user
        login: async (loginData: Login) => {
            update(state => ({ ...state, loading: true, error: null }));
            
            try {
                const success = await attempt_login(loginData);
                
                if (success) {
                    update(state => ({
                        ...state,
                        isAuthenticated: true,
                        loading: false
                    }));
                    
                    return true;
                } else {
                    throw new Error('Login failed');
                }
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Authentication failed';
                    
                update(state => ({
                    ...state,
                    isAuthenticated: false,
                    loading: false,
                    error: errorMessage
                }));
                
                return false;
            }
        },
        
        // Logout user
        logout: async () => {
            update(state => ({ ...state, loading: true }));
            
            try {
                await logout();
                
                update(state => ({
                    ...initialState,
                    loading: false
                }));
                
                return true;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Logout failed';
                    
                update(state => ({
                    ...state,
                    loading: false,
                    error: errorMessage
                }));
                
                return false;
            }
        },
        
        // Check if the user is authenticated
        checkAuth: () => {
            if (!browser) return false;
            
            const state = get(authStore);
            
            // First check store state
            if (state.isAuthenticated) return true;
            
            // If not authenticated in state, check cookie
            const isLoggedIn = checkAuthCookie();
            
            // Update state if cookie exists but state doesn't reflect it
            if (isLoggedIn && !state.isAuthenticated) {
                update(s => ({ ...s, isAuthenticated: true }));
            }
            
            return isLoggedIn;
        },
        
        // Handle auth errors - redirects to login page if unauthorized
        handleAuthError: (error: any) => {
            const status = error?.status || 0;
            
            if (status === 401 || status === 403) {
                update(state => ({
                    ...initialState
                }));
                
                toastStore.error('Session expired. Please log in again.');
                
                if (browser) {
                    goto('/login');
                }
            }
            
            return error;
        },
        
        // Reset auth state
        reset: () => {
            set(initialState);
        }
    };
}

// Helper function to check if auth cookie exists
function checkAuthCookie(): boolean {
    if (!browser) return false;
    
    try {
        // Check for auth token cookie
        return document.cookie.includes('auth-token');
    } catch (e) {
        console.error("Error checking auth cookie:", e);
        return false;
    }
}

// Create and export the store
export const authStore = createAuthStore();

// Derived store for loading state
export const isLoading = derived(
    authStore,
    $store => $store.loading
);

// Derived store for authentication state
export const isAuthenticated = derived(
    authStore,
    $store => $store.isAuthenticated
);

// Derived store for error state
export const authError = derived(
    authStore,
    $store => $store.error
);

// Auth guard function to protect routes
export function requireAuth(onNoAuth: () => void = () => goto('/login')): boolean {
    if (!browser) return false;
    
    const isAuthed = authStore.checkAuth();
    
    if (!isAuthed) {
        toastStore.error('Authentication required');
        onNoAuth();
    }
    
    return isAuthed;
} 