/*
/ DocumentStore.ts
/
/ State management for documents in the application
/ Uses the API functions from drive.ts and document.ts to manage document data
/
/ Summary:
/ - Provides a store for managing document state within projects
/ - Handles loading, creating, updating, and deleting documents
/ - Manages loading states and errors
*/

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { LoadingStatus, ApiResponse } from './drive';
import { Document, load_document, update_document } from './document';
import { get_project_documents, create_project_document } from './drive';

// Store interface for documents
interface DocumentStore {
    documents: Document[];
    selectedDocumentId: number | null;
    currentProjectId: number | null;
    status: LoadingStatus;
    error: string | null;
}

// Create the writable store with initial values
const createDocumentStore = () => {
    // Initial state
    const initialState: DocumentStore = {
        documents: [],
        selectedDocumentId: null,
        currentProjectId: null,
        status: 'idle',
        error: null
    };

    // Create the writable store
    const { subscribe, set, update } = writable<DocumentStore>(initialState);

    return {
        subscribe,
        
        // Set the current project
        setCurrentProject: (projectId: number | null) => {
            update(state => ({ 
                ...state, 
                currentProjectId: projectId,
                // Clear documents when changing projects
                documents: projectId !== state.currentProjectId ? [] : state.documents,
                selectedDocumentId: null
            }));
        },
        
        // Load all documents for the current project
        loadDocuments: async (projectId?: number) => {
            // Use provided projectId or the one from state
            update(state => ({ ...state, status: 'loading', error: null }));
            
            const targetProjectId = projectId !== undefined 
                ? projectId 
                : get(documentStore).currentProjectId;
                
            if (!targetProjectId) {
                update(state => ({ 
                    ...state, 
                    error: 'No project selected',
                    status: 'error'
                }));
                return [];
            }
            
            update(state => ({ 
                ...state, 
                currentProjectId: targetProjectId
            }));
            
            try {
                const documents = await get_project_documents(targetProjectId);
                
                update(state => ({ 
                    ...state, 
                    documents, 
                    status: 'success' 
                }));
                
                return documents;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to load documents';
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return [];
            }
        },
        
        // Set the selected document
        selectDocument: (documentId: number | null) => {
            update(state => ({ ...state, selectedDocumentId: documentId }));
        },
        
        // Load a specific document by ID
        loadDocument: async (documentId: number) => {
            update(state => ({ 
                ...state, 
                status: 'loading', 
                error: null,
                selectedDocumentId: documentId
            }));
            
            try {
                const document = await load_document(documentId);
                
                if (!document) {
                    throw new Error('Document not found');
                }
                
                update(state => {
                    // Find the document in the existing array
                    const index = state.documents.findIndex(d => d.id === documentId);
                    
                    // Create a new array with the updated document
                    const updatedDocuments = [...state.documents];
                    
                    if (index >= 0) {
                        // Replace the existing document
                        updatedDocuments[index] = document;
                    } else {
                        // Add the new document
                        updatedDocuments.push(document);
                    }
                    
                    return {
                        ...state,
                        documents: updatedDocuments,
                        status: 'success'
                    };
                });
                
                return document;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to load document with ID ${documentId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Create a new document within the current project
        createDocument: async (name: string, content: string = '') => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            if (!state.currentProjectId) {
                update(state => ({ 
                    ...state, 
                    error: 'No project selected',
                    status: 'error'
                }));
                return null;
            }
            
            try {
                const newDocument = await create_project_document(
                    state.currentProjectId,
                    name,
                    content
                );
                
                if (!newDocument) {
                    throw new Error('Failed to create document');
                }
                
                update(state => ({
                    ...state,
                    documents: [...state.documents, newDocument],
                    selectedDocumentId: newDocument.id,
                    status: 'success'
                }));
                
                return newDocument;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to create document';
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Update an existing document
        updateDocument: async (documentId: number, name: string, content: string) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                // Create a document object with the updated data
                const documentToUpdate = state.documents.find(d => d.id === documentId);
                
                if (!documentToUpdate) {
                    throw new Error('Document not found in store');
                }
                
                const updatedDocument = {
                    ...documentToUpdate,
                    name,
                    content,
                    updated_at: new Date().toISOString()
                };
                
                const success = await update_document(updatedDocument);
                
                if (!success) {
                    throw new Error('Failed to update document');
                }
                
                update(state => {
                    // Find the document in the existing array
                    const index = state.documents.findIndex(d => d.id === documentId);
                    
                    if (index < 0) {
                        return state;
                    }
                    
                    // Create a new array with the updated document
                    const updatedDocuments = [...state.documents];
                    updatedDocuments[index] = updatedDocument;
                    
                    return {
                        ...state,
                        documents: updatedDocuments,
                        status: 'success'
                    };
                });
                
                return updatedDocument;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to update document with ID ${documentId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Delete a document
        deleteDocument: async (documentId: number) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                // Implementation depends on having a delete document API
                // For now, we'll simulate success and just update the store
                
                // Normally you would make an API call here:
                // const success = await delete_document(documentId);
                const success = true; // Simulated success
                
                if (!success) {
                    throw new Error('Failed to delete document');
                }
                
                update(state => {
                    // Remove the document from the array
                    const updatedDocuments = state.documents.filter(d => d.id !== documentId);
                    
                    // Clear the selected document if it was selected
                    const updatedSelectedId = state.selectedDocumentId === documentId
                        ? null
                        : state.selectedDocumentId;
                    
                    return {
                        ...state,
                        documents: updatedDocuments,
                        selectedDocumentId: updatedSelectedId,
                        status: 'success'
                    };
                });
                
                return true;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to delete document with ID ${documentId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return false;
            }
        },
        
        // Reset store to initial state
        reset: () => {
            set(initialState);
        }
    };
};

// Create and export the store
export const documentStore = createDocumentStore();

// Derived store for the currently selected document
export const selectedDocument: Readable<Document | null> = derived(
    documentStore,
    $store => {
        if (!$store.selectedDocumentId) return null;
        return $store.documents.find(d => d.id === $store.selectedDocumentId) || null;
    }
);

// Derived store for loading state
export const isLoading: Readable<boolean> = derived(
    documentStore,
    $store => $store.status === 'loading'
);

// Derived store for error state
export const hasError: Readable<boolean> = derived(
    documentStore,
    $store => $store.status === 'error'
);

// Derived store for error message
export const errorMessage: Readable<string | null> = derived(
    documentStore,
    $store => $store.error
); 