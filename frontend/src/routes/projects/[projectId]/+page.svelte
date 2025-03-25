<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { projectStore, selectedProject } from '$lib/ts/projectStore';
    import { documentStore, selectedDocument, isLoading, hasError, errorMessage } from '$lib/ts/documentStore';
    
    let newDocumentName = '';
    let isCreatingDocument = false;
    
    // Load project and its documents on mount
    onMount(async () => {
        const projectId = parseInt($page.params.projectId);
        if (isNaN(projectId)) return;
        
        // Load project details
        await projectStore.loadProject(projectId);
        
        // Set current project in document store and load documents
        documentStore.setCurrentProject(projectId);
        await documentStore.loadDocuments(projectId);
    });
    
    // Handle document creation
    async function handleCreateDocument() {
        if (!newDocumentName.trim()) {
            alert('Document name cannot be empty');
            return;
        }
        
        isCreatingDocument = true;
        
        try {
            const document = await documentStore.createDocument(
                newDocumentName,
                '' // Empty initial content
            );
            
            if (document) {
                newDocumentName = '';
            }
        } finally {
            isCreatingDocument = false;
        }
    }
    
    // Handle document deletion
    async function handleDeleteDocument(documentId: number) {
        if (confirm('Are you sure you want to delete this document?')) {
            await documentStore.deleteDocument(documentId);
        }
    }
    
    // Function to navigate to document editor
    function navigateToDocument(documentId: number) {
        // This will be handled by Svelte routing
        // The anchor tag will navigate to /document/[id]
    }
</script>

<div class="container mx-auto p-4">
    {#if $selectedProject}
        <div class="mb-6">
            <h1 class="text-2xl font-bold">{$selectedProject.name}</h1>
            {#if $selectedProject.description}
                <p class="text-gray-600 mt-2">{$selectedProject.description}</p>
            {/if}
            <p class="text-sm text-gray-500 mt-2">
                Created: {new Date($selectedProject.created_at).toLocaleDateString()}
                | Last updated: {new Date($selectedProject.updated_at).toLocaleDateString()}
            </p>
        </div>
    {:else}
        <div class="animate-pulse mb-6">
            <div class="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-1/4"></div>
        </div>
    {/if}
    
    <!-- Error display -->
    {#if $hasError}
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{$errorMessage || 'An error occurred'}</p>
        </div>
    {/if}
    
    <!-- Loading indicator -->
    {#if $isLoading}
        <div class="flex justify-center my-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    {/if}
    
    <!-- Create document form -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
        <h2 class="text-xl font-semibold mb-4">Create New Document</h2>
        <div class="flex">
            <input 
                type="text" 
                bind:value={newDocumentName} 
                placeholder="Document name"
                class="flex-grow p-2 border border-gray-300 rounded-l-md"
                disabled={isCreatingDocument || $isLoading}
            />
            <button 
                on:click={handleCreateDocument}
                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md"
                disabled={isCreatingDocument || $isLoading}
            >
                Create
            </button>
        </div>
    </div>
    
    <!-- Documents list -->
    <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-4">Documents in this Project</h2>
        
        {#if $documentStore.documents.length === 0 && !$isLoading}
            <p class="text-gray-500 italic">No documents found. Create your first document above.</p>
        {:else}
            <ul class="divide-y divide-gray-200">
                {#each $documentStore.documents as document (document.id)}
                    <li class="py-4">
                        <div class="flex justify-between">
                            <div>
                                <h3 class="text-lg font-semibold">
                                    {document.name}
                                    {#if $selectedDocument && $selectedDocument.id === document.id}
                                        <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Selected
                                        </span>
                                    {/if}
                                </h3>
                                <p class="text-xs text-gray-500 mt-1">
                                    Created: {new Date(document.created_at).toLocaleDateString()}
                                    | Last updated: {new Date(document.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div class="flex space-x-2">
                                <a 
                                    href={`/document/${document.id}`}
                                    class="text-blue-500 hover:text-blue-700"
                                    title="Open document"
                                >
                                    Open
                                </a>
                                <button 
                                    on:click={() => handleDeleteDocument(document.id)}
                                    class="text-red-500 hover:text-red-700"
                                    title="Delete document"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
    
    <!-- Back to projects link -->
    <div class="mt-6">
        <a href="/projects" class="text-blue-500 hover:text-blue-700">
            &larr; Back to Projects
        </a>
    </div>
</div>

<style>
    /* Add any additional component-specific styles here */
</style> 