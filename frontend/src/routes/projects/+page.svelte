<script lang="ts">
    import { onMount } from 'svelte';
    import { projectStore, selectedProject, isLoading, hasError, errorMessage } from '$lib/ts/projectStore';
    import { CreateProjectPayload, UpdateProjectPayload } from '$lib/ts/drive';
    
    let searchTerm = '';
    let searchResults: any[] = [];
    let isSearching = false;
    let newProjectName = '';
    let newProjectDescription = '';
    let editingProject = false;
    
    // Load projects on mount
    onMount(async () => {
        await projectStore.loadProjects();
    });
    
    // Handle search
    async function handleSearch() {
        isSearching = true;
        searchResults = await projectStore.searchProjects(searchTerm);
        isSearching = false;
    }
    
    // Handle create project
    async function handleCreateProject() {
        if (!newProjectName.trim()) {
            alert('Project name cannot be empty');
            return;
        }
        
        const payload = new CreateProjectPayload(
            newProjectName,
            newProjectDescription.trim() || null
        );
        
        const project = await projectStore.createProject(payload);
        
        if (project) {
            newProjectName = '';
            newProjectDescription = '';
        }
    }
    
    // Handle delete project
    async function handleDeleteProject(projectId: number) {
        if (confirm('Are you sure you want to delete this project?')) {
            await projectStore.deleteProject(projectId);
        }
    }
    
    // Handle edit project
    async function handleUpdateProject(projectId: number, name: string, description: string | null) {
        const payload = new UpdateProjectPayload(
            name.trim() ? name : undefined,
            description
        );
        
        await projectStore.updateProject(projectId, payload);
        editingProject = false;
    }
    
    // Handle duplicate project
    async function handleDuplicateProject(projectId: number) {
        await projectStore.duplicateProject(projectId);
    }
</script>

<div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Projects</h1>
    
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
    
    <!-- Create project form -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
        <h2 class="text-xl font-semibold mb-4">Create New Project</h2>
        <div class="mb-4">
            <label for="projectName" class="block text-sm font-medium text-gray-700">Name</label>
            <input 
                type="text" 
                id="projectName" 
                bind:value={newProjectName} 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Project name" 
            />
        </div>
        <div class="mb-4">
            <label for="projectDescription" class="block text-sm font-medium text-gray-700">Description</label>
            <textarea 
                id="projectDescription" 
                bind:value={newProjectDescription} 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                placeholder="Project description (optional)" 
                rows="3"
            ></textarea>
        </div>
        <button 
            on:click={handleCreateProject}
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={$isLoading}
        >
            Create Project
        </button>
    </div>
    
    <!-- Search projects -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
        <h2 class="text-xl font-semibold mb-4">Search Projects</h2>
        <div class="flex">
            <input 
                type="text" 
                bind:value={searchTerm} 
                placeholder="Search by name or description"
                class="flex-grow p-2 border border-gray-300 rounded-l-md"
            />
            <button 
                on:click={handleSearch}
                class="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-r-md"
                disabled={isSearching}
            >
                Search
            </button>
        </div>
        
        {#if searchResults.length > 0}
            <div class="mt-4">
                <h3 class="text-lg font-medium mb-2">Search Results</h3>
                <ul class="divide-y divide-gray-200">
                    {#each searchResults as project}
                        <li class="py-3">
                            <div class="flex justify-between">
                                <div>
                                    <h4 class="text-lg font-semibold">{project.name}</h4>
                                    {#if project.description}
                                        <p class="text-gray-600">{project.description}</p>
                                    {/if}
                                </div>
                                <div>
                                    <button 
                                        on:click={() => projectStore.selectProject(project.id)}
                                        class="text-blue-500 hover:text-blue-700 mr-2"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>
        {/if}
    </div>
    
    <!-- Projects list -->
    <div class="bg-white shadow rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-4">Your Projects</h2>
        
        {#if $projectStore.projects.length === 0 && !$isLoading}
            <p class="text-gray-500 italic">No projects found. Create your first project above.</p>
        {:else}
            <ul class="divide-y divide-gray-200">
                {#each $projectStore.projects as project (project.id)}
                    <li class="py-4">
                        {#if editingProject && $selectedProject && $selectedProject.id === project.id}
                            <!-- Edit mode -->
                            <div class="space-y-3">
                                <input 
                                    type="text" 
                                    bind:value={$selectedProject.name} 
                                    class="block w-full p-2 border border-gray-300 rounded-md"
                                />
                                <textarea 
                                    bind:value={$selectedProject.description} 
                                    class="block w-full p-2 border border-gray-300 rounded-md"
                                    rows="2"
                                ></textarea>
                                <div class="flex space-x-2">
                                    <button 
                                        on:click={() => handleUpdateProject(
                                            $selectedProject.id, 
                                            $selectedProject.name, 
                                            $selectedProject.description
                                        )}
                                        class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                                    >
                                        Save
                                    </button>
                                    <button 
                                        on:click={() => { editingProject = false; }}
                                        class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        {:else}
                            <!-- View mode -->
                            <div class="flex justify-between">
                                <div>
                                    <h3 class="text-lg font-semibold">
                                        {project.name}
                                        {#if $selectedProject && $selectedProject.id === project.id}
                                            <span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                Selected
                                            </span>
                                        {/if}
                                    </h3>
                                    {#if project.description}
                                        <p class="text-gray-600">{project.description}</p>
                                    {/if}
                                    <p class="text-xs text-gray-500 mt-1">
                                        Created: {new Date(project.created_at).toLocaleDateString()}
                                        | Last updated: {new Date(project.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div class="flex space-x-2">
                                    <button 
                                        on:click={() => projectStore.selectProject(project.id)}
                                        class="text-blue-500 hover:text-blue-700"
                                        title="Select project"
                                    >
                                        Select
                                    </button>
                                    <button 
                                        on:click={() => { 
                                            projectStore.selectProject(project.id);
                                            editingProject = true;
                                        }}
                                        class="text-yellow-500 hover:text-yellow-700"
                                        title="Edit project"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        on:click={() => handleDuplicateProject(project.id)}
                                        class="text-purple-500 hover:text-purple-700"
                                        title="Duplicate project"
                                    >
                                        Duplicate
                                    </button>
                                    <button 
                                        on:click={() => handleDeleteProject(project.id)}
                                        class="text-red-500 hover:text-red-700"
                                        title="Delete project"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        {/if}
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>

<style>
    /* Add any additional component-specific styles here */
</style> 