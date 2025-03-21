/**
 * Authentication utility functions
 */

/**
 * Check if the user is authenticated 
 */
export function isAuthenticated(): boolean {
    try {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return false;
        }
        
        // Check for auth token in cookies
        if (document.cookie.includes('auth-token')) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking authentication status:', error);
        return false;
    }
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth(redirectTo: string = '/login'): boolean {
    if (!isAuthenticated()) {
        // Only redirect if in browser context
        if (typeof window !== 'undefined') {
            window.location.href = redirectTo;
        }
        return false;
    }
    return true;
}

/**
 * Generate a demo token for development/testing
 */
export function createDemoAuth(): void {
    document.cookie = "auth-token=demo-user.token; path=/; max-age=259200";
}

/**
 * Get the user ID from the authentication token
 * In a real application, this would decode the JWT token
 */
export function getUserId(): string | null {
    try {
        if (!isAuthenticated()) {
            return null;
        }
        
        // For demo, return a fixed user ID
        return "user-1";
    } catch {
        return null;
    }
} 