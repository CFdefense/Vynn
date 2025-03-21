<script lang="ts">
    import { onMount } from "svelte";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';

    interface Project {
        id: number;
        name: string;
        description: string | null;
        owner_id: number;
        created_at: string;
        updated_at: string;
    }

    let project: Project | null = null;
    let loading = true;
    let error = "";
    let editMode = false;
    
    // Form data
    let projectName = "";
    let projectDescription = "";

    const projectId = parseInt($page.params.id);

    onMount(async () => {
        if (isNaN(projectId)) {
            error = "Invalid project ID";
            loading = false;
            return;
        }

        try {
            await fetchProject(projectId);
        } catch (e) {
            console.error("Error fetching project:", e);
            error = "Failed to load project. Please try again.";
        } finally {
            loading = false;
        }
    });

    async function fetchProject(id: number) {
        const response = await fetch(`http://localhost:3001/api/projects/${id}`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error("Project not found");
            }
            const errorText = await response.text();
            console.warn("API request failed:", response.status, response.statusText, errorText);
            throw new Error("Failed to fetch project");
        }
        
        project = await response.json();
        // Initialize form data with project values
        projectName = project!.name;
        projectDescription = project!.description || "";
    }

    async function updateProject() {
        if (!project) return;
        
        if (!projectName.trim()) {
            error = "Project name is required";
            return;
        }

        try {
            loading = true;
            error = "";
            
            const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: projectName,
                    description: projectDescription || null,
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn("API request failed:", response.status, response.statusText, errorText);
                throw new Error("Failed to update project");
            }

            project = await response.json();
            editMode = false;
        } catch (e) {
            console.error("Error updating project:", e);
            error = "Failed to update project. Please try again.";
        } finally {
            loading = false;
        }
    }

    async function deleteProject() {
        if (!project) return;
        
        if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) {
            return;
        }

        try {
            loading = true;
            
            const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
                method: "DELETE",
                credentials: 'include'
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn("API request failed:", response.status, response.statusText, errorText);
                throw new Error("Failed to delete project");
            }

            // Redirect back to projects list
            await goto("/projects");
        } catch (e) {
            console.error("Error deleting project:", e);
            error = "Failed to delete project. Please try again.";
        } finally {
            loading = false;
        }
    }
</script>

<main class="container mx-auto p-8 text-[#E5E5E5]">
    <div class="max-w-3xl mx-auto">
        <div class="mb-6">
            <a href="/projects" class="text-blue-400 hover:text-blue-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
                Back to Projects
            </a>
        </div>

        {#if error}
            <div class="mb-6 p-4 bg-red-500 bg-opacity-25 border border-red-500 rounded-md">
                {error}
            </div>
        {/if}

        {#if loading}
            <div class="flex justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        {:else if !project}
            <div class="p-8 bg-[#1A2733] rounded-lg text-center">
                <h1 class="text-2xl font-bold mb-4">Project Not Found</h1>
                <p class="text-gray-400 mb-6">The project you're looking for doesn't exist or may have been deleted.</p>
                <a href="/projects" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                    Go to Projects
                </a>
            </div>
        {:else}
            <div class="bg-[#1A2733] rounded-lg shadow-lg p-8">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        {#if !editMode}
                            <h1 class="text-3xl font-bold">{project.name}</h1>
                        {:else}
                            <h2 class="text-xl font-semibold mb-4">Edit Project</h2>
                        {/if}
                        <p class="text-gray-500 text-sm mt-1">
                            Last updated: {new Date(project.updated_at).toLocaleString()}
                        </p>
                    </div>

                    <div class="flex space-x-2">
                        {#if !editMode}
                            <button 
                                on:click={() => editMode = true}
                                class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
                            >
                                Edit
                            </button>
                            <button 
                                on:click={deleteProject}
                                class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm transition-colors"
                            >
                                Delete
                            </button>
                        {:else}
                            <button 
                                on:click={() => {
                                    editMode = false;
                                    projectName = project?.name || "";
                                    projectDescription = project?.description || "";
                                }}
                                class="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                on:click={updateProject}
                                disabled={loading}
                                class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save
                            </button>
                        {/if}
                    </div>
                </div>

                {#if editMode}
                    <form on:submit|preventDefault={updateProject} class="space-y-4">
                        <div>
                            <label for="projectName" class="block text-sm font-medium mb-1">Project Name</label>
                            <input
                                type="text"
                                id="projectName"
                                bind:value={projectName}
                                required
                                class="w-full px-4 py-2 bg-[#2A3743] border border-[#3A4753] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter project name"
                            />
                        </div>
                        
                        <div>
                            <label for="projectDescription" class="block text-sm font-medium mb-1">Description (Optional)</label>
                            <textarea
                                id="projectDescription"
                                bind:value={projectDescription}
                                rows="4"
                                class="w-full px-4 py-2 bg-[#2A3743] border border-[#3A4753] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter project description"
                            ></textarea>
                        </div>
                    </form>
                {:else}
                    <div class="prose prose-invert max-w-none mt-6">
                        {#if project.description}
                            <p class="text-gray-300">{project.description}</p>
                        {:else}
                            <p class="text-gray-500 italic">No description provided</p>
                        {/if}
                    </div>
                
                    <div class="mt-10">
                        <h2 class="text-xl font-semibold mb-4">Project Documents</h2>
                        <div class="p-6 bg-[#0A1721] rounded-lg text-center">
                            <p class="text-gray-400 mb-4">No documents in this project yet.</p>
                            <button 
                                on:click={() => window.location.href = '/document/2'} 
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                            >
                                Create Document
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {/if}
    </div>
</main> 