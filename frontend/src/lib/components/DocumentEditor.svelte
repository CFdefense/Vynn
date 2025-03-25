<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { onMount, onDestroy } from 'svelte';
    import type { Document } from '$lib/ts/document';
    import { toastStore } from '$lib/stores/toastStore';
    import LoadingOverlay from './LoadingOverlay.svelte';
    
    export let document: Document;
    export let autoSave: boolean = true;
    export let readOnly: boolean = false;
    
    let name = document.name;
    let content = document.content;
    let isSaving = false;
    let lastSavedAt = new Date(document.updated_at);
    
    const dispatch = createEventDispatcher();
    
    // Handle save - emits save event to parent
    async function handleSave() {
        if (readOnly) return;
        
        // Simple validation
        if (!name.trim()) {
            toastStore.error('Document name cannot be empty');
            return;
        }
        
        isSaving = true;
        
        try {
            // We emit the event and let the parent handle the actual save
            dispatch('save', {
                id: document.id,
                name,
                content
            });
            
            // Update last saved time - parent should update this with actual time from server
            lastSavedAt = new Date();
            
            toastStore.success('Document saved');
        } catch (error) {
            console.error('Error in save handler:', error);
            toastStore.error('Failed to save document');
        } finally {
            isSaving = false;
        }
    }
    
    // Handle keyboard shortcuts
    function handleKeyDown(event: KeyboardEvent) {
        if (readOnly) return;
        
        // Ctrl+S to save
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            handleSave();
        }
        
        // Add other shortcuts as needed (bold, italic, etc.)
    }
    
    // Format date for display
    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(date);
    }
</script>

<div class="bg-[#1A2733] rounded-lg shadow-lg p-6 text-[#E5E5E5]">
    <LoadingOverlay isLoading={isSaving} message="Saving document..." />
    
    <div class="mb-4">
        <input 
            type="text"
            bind:value={name}
            placeholder="Document Title"
            class="w-full text-2xl font-bold p-2 bg-[#2A3743] border-b border-[#3A4753] focus:outline-none focus:border-blue-500 text-[#E5E5E5]"
            disabled={readOnly || isSaving}
        />
    </div>
    
    <div class="mb-4">
        <textarea 
            bind:value={content}
            placeholder="Start writing here..."
            class="w-full h-96 p-3 bg-[#2A3743] border border-[#3A4753] rounded focus:outline-none focus:border-blue-500 text-[#E5E5E5] resize-none"
            disabled={readOnly || isSaving}
            on:keydown={handleKeyDown}
        ></textarea>
    </div>
    
    <div class="flex justify-between items-center">
        <div>
            <p class="text-sm text-[#A0AEC0]">
                Last saved: {formatDate(lastSavedAt)}
            </p>
        </div>
        <div class="flex space-x-2">
            <button 
                on:click={() => dispatch('back')}
                class="px-4 py-2 bg-[#2A3743] hover:bg-[#3A4753] rounded transition-colors"
                disabled={isSaving}
            >
                Back
            </button>
            {#if !readOnly}
                <button 
                    on:click={handleSave}
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center transition-colors"
                    disabled={isSaving}
                >
                    {#if isSaving}
                        <span class="animate-spin mr-2">↻</span>
                    {/if}
                    Save
                </button>
            {/if}
        </div>
    </div>
</div> 