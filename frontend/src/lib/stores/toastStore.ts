/*
/ toastStore.ts
/
/ Store for managing toast notifications across the application
/
/ Summary:
/ - Provides methods to show and dismiss toast notifications
/ - Supports multiple toast types (success, error, info, warning)
/ - Auto-generates unique IDs for each toast
*/

import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
    dismissible: boolean;
}

// Create a writable store for toasts
const toasts = writable<Toast[]>([]);

// Generate a unique ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Add a new toast
function addToast(toast: Omit<Toast, 'id'>): string {
    const id = generateId();
    const newToast: Toast = { ...toast, id };
    
    toasts.update(all => [...all, newToast]);
    
    return id;
}

// Remove a toast by ID
function dismissToast(id: string): void {
    toasts.update(all => all.filter(toast => toast.id !== id));
}

// Remove all toasts
function dismissAll(): void {
    toasts.set([]);
}

// Helper methods for specific toast types
function success(message: string, duration: number = 5000): string {
    return addToast({
        type: 'success',
        message,
        duration,
        dismissible: true
    });
}

function error(message: string, duration: number = 0): string {
    return addToast({
        type: 'error',
        message,
        duration,
        dismissible: true
    });
}

function info(message: string, duration: number = 5000): string {
    return addToast({
        type: 'info',
        message,
        duration,
        dismissible: true
    });
}

function warning(message: string, duration: number = 8000): string {
    return addToast({
        type: 'warning',
        message,
        duration,
        dismissible: true
    });
}

// Export the store and methods
export const toastStore = {
    subscribe: toasts.subscribe,
    success,
    error,
    info,
    warning,
    dismiss: dismissToast,
    dismissAll
}; 