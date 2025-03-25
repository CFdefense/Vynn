/*
/ Drive.ts
/
/ File containing functions and logic required for frontend handling of a drive
/ Will provide the communication with the backend and pass necessary information to API calls
/
/ Summary:
/ Class Project: Class responsible for holding project information
/ load_projects: Function to load all projects for a user
/ get_project: Function to get a specific project by ID
/ create_project: Function to create a new project
/ update_project: Function to update an existing project
/ delete_project: Function to delete a project
/ get_project_documents: Function to get all documents for a project
*/

// Class for holding project information
export class Project {
    id: number;
    name: string;
    description: string | null;
    owner_id: number;
    created_at: string;
    updated_at: string;

    constructor(
        id: number,
        name: string,
        description: string | null,
        owner_id: number,
        created_at: string,
        updated_at: string
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.owner_id = owner_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}

// Payload for creating a new project
export class CreateProjectPayload {
    name: string;
    description: string | null;

    constructor(name: string, description: string | null = null) {
        this.name = name;
        this.description = description;
    }
}

// Payload for updating a project
export class UpdateProjectPayload {
    name?: string;
    description?: string | null;

    constructor(name?: string, description?: string | null) {
        this.name = name;
        this.description = description;
    }
}

// Function to load all projects for the current user
export async function load_projects(): Promise<Project[]> {
    try {
        console.log('Loading projects');
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects`;
        
        // Call GET API
        const response = await fetch(apiUrl, {
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to load projects: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const projects: Project[] = await response.json();
        console.log(`Loaded ${projects.length} projects`);
        
        return projects;
    } catch (error) {
        console.error('Error loading projects:', error);
        return [];
    }
}

// Function to get a specific project by ID
export async function get_project(projectId: number): Promise<Project | null> {
    try {
        console.log(`Loading project with ID: ${projectId}`);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects/${projectId}`;
        
        // Call GET API
        const response = await fetch(apiUrl, {
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to load project: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const project: Project = await response.json();
        return project;
    } catch (error) {
        console.error('Error loading project:', error);
        return null;
    }
}

// Function to create a new project
export async function create_project(payload: CreateProjectPayload): Promise<Project | null> {
    try {
        console.log('Creating new project:', payload.name);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects`;
        
        // Call POST API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to create project: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const project: Project = await response.json();
        console.log(`Created project with ID: ${project.id}`);
        
        return project;
    } catch (error) {
        console.error('Error creating project:', error);
        return null;
    }
}

// Function to update an existing project
export async function update_project(projectId: number, payload: UpdateProjectPayload): Promise<Project | null> {
    try {
        console.log(`Updating project with ID: ${projectId}`);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects/${projectId}`;
        
        // Call PUT API
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to update project: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const project: Project = await response.json();
        console.log(`Updated project: ${project.name}`);
        
        return project;
    } catch (error) {
        console.error('Error updating project:', error);
        return null;
    }
}

// Function to delete a project
export async function delete_project(projectId: number): Promise<boolean> {
    try {
        console.log(`Deleting project with ID: ${projectId}`);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects/${projectId}`;
        
        // Call DELETE API
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to delete project: ${response.statusText}`);
        }
        
        console.log(`Project ${projectId} deleted successfully`);
        return true;
    } catch (error) {
        console.error('Error deleting project:', error);
        return false;
    }
}

// Function to get all documents for a project
export async function get_project_documents(projectId: number): Promise<Document[]> {
    try {
        console.log(`Loading documents for project ID: ${projectId}`);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects/${projectId}/documents`;
        
        // Call GET API
        const response = await fetch(apiUrl, {
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to load project documents: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const documents: Document[] = await response.json();
        console.log(`Loaded ${documents.length} documents for project ${projectId}`);
        
        return documents;
    } catch (error) {
        console.error('Error loading project documents:', error);
        return [];
    }
}

// Function to create a new document within a project
export async function create_project_document(
    projectId: number,
    documentName: string,
    initialContent: string = ""
): Promise<Document | null> {
    try {
        console.log(`Creating new document "${documentName}" in project ${projectId}`);
        
        // Use the correct backend API URL
        const apiUrl = `http://localhost:3001/api/projects/${projectId}/documents`;
        
        // Call POST API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: documentName,
                content: initialContent
            }),
            credentials: 'include'
        });
        
        // Check response status
        if (!response.ok) {
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error(`Failed to create document: ${response.statusText}`);
        }
        
        // Parse the response JSON
        const document: Document = await response.json();
        console.log(`Created document with ID: ${document.id}`);
        
        return document;
    } catch (error) {
        console.error('Error creating document:', error);
        return null;
    }
}

// Import Document class from document.ts for type usage
import { Document } from './document';
