/*
/ authFetch.ts
/
/ Utility for making authenticated API requests
/ Intercepts unauthorized responses and handles token refresh/logout
/
/ Summary:
/ - Wraps the native fetch API with authentication handling
/ - Automatically handles 401/403 responses
/ - Provides consistent error handling
*/

import { browser } from '$app/environment';
import { authStore } from '$lib/stores/authStore';
import { toastStore } from '$lib/stores/toastStore';

// Base URL for backend API
const API_BASE_URL = 'http://localhost:3001/api';

// Types for request options
interface RequestOptions extends RequestInit {
    // Add any additional options here
}

/**
 * Makes an authenticated API request and handles auth errors
 * 
 * @param endpoint - The API endpoint (without the base URL)
 * @param options - Fetch options
 * @returns Promise with the response data
 */
export async function authFetch<T = any>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> {
    if (!browser) {
        throw new Error('authFetch can only be used in the browser');
    }
    
    // Ensure credentials are included for cookies
    const fetchOptions: RequestOptions = {
        ...options,
        credentials: 'include'
    };
    
    // Add headers if not provided
    if (!fetchOptions.headers) {
        fetchOptions.headers = {
            'Content-Type': 'application/json'
        };
    }
    
    try {
        // Make the request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
        
        // Handle auth errors
        if (response.status === 401 || response.status === 403) {
            // Handle unauthorized - clear auth state and redirect
            authStore.handleAuthError({
                status: response.status,
                message: 'Authentication failed'
            });
            
            throw new Error('Authentication failed. Please log in again.');
        }
        
        // Check for other errors
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage: string;
            
            try {
                // Try to parse error as JSON
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorJson.message || 'An error occurred';
            } catch {
                // If not JSON, use the text
                errorMessage = errorText || `Error ${response.status}: ${response.statusText}`;
            }
            
            const error = new Error(errorMessage);
            (error as any).status = response.status;
            (error as any).statusText = response.statusText;
            throw error;
        }
        
        // Check if response is empty
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            return null as T;
        }
    } catch (error) {
        // Log the error and rethrow
        console.error('API request failed:', error);
        
        // If error is authorization related, handle it
        if (error.status === 401 || error.status === 403) {
            authStore.handleAuthError(error);
        }
        
        throw error;
    }
}

/**
 * Authenticated GET request
 */
export function get<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return authFetch<T>(endpoint, {
        ...options,
        method: 'GET'
    });
}

/**
 * Authenticated POST request
 */
export function post<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return authFetch<T>(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data)
    });
}

/**
 * Authenticated PUT request
 */
export function put<T = any>(endpoint: string, data: any, options: RequestOptions = {}): Promise<T> {
    return authFetch<T>(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

/**
 * Authenticated DELETE request
 */
export function del<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return authFetch<T>(endpoint, {
        ...options,
        method: 'DELETE'
    });
} 