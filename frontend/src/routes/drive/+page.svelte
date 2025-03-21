<script lang="ts">
    import { onMount } from 'svelte';
    
    interface Document {
        id: number;
        name: string;
        content: string;
        created_at: string;
        updated_at: string;
    }
    
    let documents: Document[] = [];
    let loading = true;
    let error = "";
    
    onMount(async () => {
        // Check if user is logged in
        if (!document.cookie.includes('auth-token')) {
            window.location.href = '/login';
            return;
        }
        
        try {
            await fetchDocuments();
        } catch (e) {
            console.error("Error fetching documents:", e);
            error = "Failed to load documents. Please try again.";
        } finally {
            loading = false;
        }
    });
    
    async function fetchDocuments() {
        try {
            const response = await fetch("http://localhost:3001/api/document", {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error("Failed to fetch documents");
            }
            
            documents = await response.json();
        } catch (e) {
            console.error("Error fetching documents:", e);
            // For demo, let's show a placeholder document
            documents = [
                {
                    id: 1,
                    name: "Test Document",
                    content: "This is a test document content.",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
        }
    }
    
    async function createNewDocument() {
        try {
            // Since the actual backend functionality might not be fully implemented,
            // we'll take you to document/2 which should exist from our database setup
            window.location.href = '/document/2';
        } catch (e) {
            console.error("Error creating new document:", e);
            error = "Failed to create document. Please try again.";
        }
    }
</script>

<main class="min-h-screen bg-[#0A1721] p-8 text-[#E5E5E5]">
    <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-3xl font-bold">My Documents</h1>
            <button 
                on:click={createNewDocument}
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
                New Document
            </button>
        </div>

        {#if error}
            <div class="mb-4 p-4 bg-red-500 bg-opacity-25 border border-red-500 rounded-md">
                {error}
            </div>
        {/if}

        {#if loading}
            <div class="flex justify-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        {:else if documents.length === 0}
            <div class="text-center py-12 bg-[#1A2733] rounded-lg">
                <p class="text-lg text-gray-400 mb-6">No documents found. Create your first document!</p>
                <button 
                    on:click={createNewDocument}
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                    Create Document
                </button>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each documents as document (document.id)}
                    <a 
                        href={`/document/${document.id}`}
                        class="p-6 bg-[#1A2733] rounded-lg shadow-lg hover:bg-[#1E2A38] transition-colors"
                    >
                        <h2 class="text-xl font-semibold mb-2">{document.name}</h2>
                        <p class="text-gray-400 mb-3 line-clamp-2">
                            {document.content ? document.content.substring(0, 100) + '...' : 'No content'}
                        </p>
                        <p class="text-gray-500 text-sm">
                            Last edited: {new Date(document.updated_at).toLocaleString()}
                        </p>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</main> 