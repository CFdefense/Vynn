/*
/ ProjectStore.ts
/
/ State management for projects in the application
/ Uses the API functions from drive.ts to manage project data
/
/ Summary:
/ - Provides a store for managing project state
/ - Handles loading, creating, updating, and deleting projects
/ - Manages loading states and errors
*/

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import {
    Project,
    CreateProjectPayload,
    UpdateProjectPayload,
    load_projects,
    get_project,
    create_project,
    update_project,
    delete_project,
    get_recent_projects,
    search_projects,
    duplicate_project,
    LoadingStatus,
    ApiResponse
} from './drive';

// Store interface for projects
interface ProjectStore {
    projects: Project[];
    selectedProjectId: number | null;
    status: LoadingStatus;
    error: string | null;
}

// Create the writable store with initial values
const createProjectStore = () => {
    // Initial state
    const initialState: ProjectStore = {
        projects: [],
        selectedProjectId: null,
        status: 'idle',
        error: null
    };

    // Create the writable store
    const { subscribe, set, update } = writable<ProjectStore>(initialState);

    return {
        subscribe,
        
        // Load all projects
        loadProjects: async () => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const projects = await load_projects();
                update(state => ({ 
                    ...state, 
                    projects, 
                    status: 'success' 
                }));
                return projects;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to load projects';
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                return [];
            }
        },
        
        // Set the selected project
        selectProject: (projectId: number | null) => {
            update(state => ({ ...state, selectedProjectId: projectId }));
        },
        
        // Load a specific project by ID
        loadProject: async (projectId: number) => {
            update(state => ({ 
                ...state, 
                status: 'loading', 
                error: null,
                selectedProjectId: projectId
            }));
            
            try {
                const project = await get_project(projectId);
                
                if (!project) {
                    throw new Error('Project not found');
                }
                
                update(state => {
                    // Find the project in the existing array
                    const index = state.projects.findIndex(p => p.id === projectId);
                    
                    // Create a new array with the updated project
                    const updatedProjects = [...state.projects];
                    
                    if (index >= 0) {
                        // Replace the existing project
                        updatedProjects[index] = project;
                    } else {
                        // Add the new project
                        updatedProjects.push(project);
                    }
                    
                    return {
                        ...state,
                        projects: updatedProjects,
                        status: 'success'
                    };
                });
                
                return project;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to load project with ID ${projectId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Create a new project
        createProject: async (payload: CreateProjectPayload) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const newProject = await create_project(payload);
                
                if (!newProject) {
                    throw new Error('Failed to create project');
                }
                
                update(state => ({
                    ...state,
                    projects: [...state.projects, newProject],
                    selectedProjectId: newProject.id,
                    status: 'success'
                }));
                
                return newProject;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to create project';
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Update an existing project
        updateProject: async (projectId: number, payload: UpdateProjectPayload) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const updatedProject = await update_project(projectId, payload);
                
                if (!updatedProject) {
                    throw new Error('Failed to update project');
                }
                
                update(state => {
                    // Find the project in the existing array
                    const index = state.projects.findIndex(p => p.id === projectId);
                    
                    if (index < 0) {
                        return state;
                    }
                    
                    // Create a new array with the updated project
                    const updatedProjects = [...state.projects];
                    updatedProjects[index] = updatedProject;
                    
                    return {
                        ...state,
                        projects: updatedProjects,
                        status: 'success'
                    };
                });
                
                return updatedProject;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to update project with ID ${projectId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Delete a project
        deleteProject: async (projectId: number) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const success = await delete_project(projectId);
                
                if (!success) {
                    throw new Error('Failed to delete project');
                }
                
                update(state => {
                    // Remove the project from the array
                    const updatedProjects = state.projects.filter(p => p.id !== projectId);
                    
                    // Clear the selected project if it was selected
                    const updatedSelectedId = state.selectedProjectId === projectId
                        ? null
                        : state.selectedProjectId;
                    
                    return {
                        ...state,
                        projects: updatedProjects,
                        selectedProjectId: updatedSelectedId,
                        status: 'success'
                    };
                });
                
                return true;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to delete project with ID ${projectId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return false;
            }
        },
        
        // Search for projects
        searchProjects: async (searchTerm: string) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const response = await search_projects(searchTerm);
                
                if (response.status === 'error' || !response.data) {
                    throw new Error(response.error || 'Failed to search projects');
                }
                
                // We don't update the main projects array since this is just a search
                update(state => ({ 
                    ...state, 
                    status: 'success' 
                }));
                
                return response.data;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : 'Failed to search projects';
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return [];
            }
        },
        
        // Duplicate a project
        duplicateProject: async (projectId: number, newName?: string) => {
            update(state => ({ ...state, status: 'loading', error: null }));
            
            try {
                const response = await duplicate_project(projectId, newName);
                
                if (response.status === 'error' || !response.data) {
                    throw new Error(response.error || 'Failed to duplicate project');
                }
                
                const newProject = response.data;
                
                update(state => ({
                    ...state,
                    projects: [...state.projects, newProject],
                    selectedProjectId: newProject.id,
                    status: 'success'
                }));
                
                return newProject;
            } catch (error) {
                const errorMessage = error instanceof Error 
                    ? error.message 
                    : `Failed to duplicate project with ID ${projectId}`;
                    
                update(state => ({ 
                    ...state, 
                    status: 'error', 
                    error: errorMessage 
                }));
                
                return null;
            }
        },
        
        // Reset store to initial state
        reset: () => {
            set(initialState);
        }
    };
};

// Create and export the store
export const projectStore = createProjectStore();

// Derived store for the currently selected project
export const selectedProject: Readable<Project | null> = derived(
    projectStore,
    $store => {
        if (!$store.selectedProjectId) return null;
        return $store.projects.find(p => p.id === $store.selectedProjectId) || null;
    }
);

// Derived store for loading state
export const isLoading: Readable<boolean> = derived(
    projectStore,
    $store => $store.status === 'loading'
);

// Derived store for error state
export const hasError: Readable<boolean> = derived(
    projectStore,
    $store => $store.status === 'error'
);

// Derived store for error message
export const errorMessage: Readable<string | null> = derived(
    projectStore,
    $store => $store.error
); 