<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	export let documentData: {
		id: number;
		name: string;
		content: string;
		created_at: string;
		updated_at: string;
	};

	// Editor state
	let editorContent = documentData.content || '';
	let undoStack: string[] = [];
	let redoStack: string[] = [];
	let isBold = false;
	let isItalic = false;
	let isUnderline = false;
	let textArea: HTMLTextAreaElement;
	let lastSavedContent = '';
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;
    let documentName = documentData.name;
    let editingName = false;
    let saveStatus = 'Saved';

	// Save current state for undo with debouncing
	function saveState() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(() => {
			if (editorContent !== lastSavedContent) {
				undoStack.push(lastSavedContent);
				undoStack = undoStack; // Trigger reactivity
				redoStack = []; // Clear redo stack on new changes
				lastSavedContent = editorContent;
				
				// Update the document content
				documentData.content = editorContent;
                saveStatus = 'Saving...';
                
                // Simulate saving to backend
                setTimeout(() => {
                    saveStatus = 'Saved';
                }, 500);
			}
		}, 500);
	}

	// Handle undo
	function undo() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
			if (editorContent !== lastSavedContent) {
				undoStack.push(lastSavedContent);
				lastSavedContent = editorContent;
			}
		}

		if (undoStack.length > 0) {
			redoStack.push(editorContent);
			editorContent = undoStack.pop() || '';
			lastSavedContent = editorContent;
			undoStack = undoStack;
			redoStack = redoStack;
		}
	}

	// Handle redo
	function redo() {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
			saveTimeout = null;
		}

		if (redoStack.length > 0) {
			undoStack.push(editorContent);
			editorContent = redoStack.pop() || '';
			lastSavedContent = editorContent;
			undoStack = undoStack;
			redoStack = redoStack;
		}
	}

	// Handle keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		if (event.ctrlKey || event.metaKey) {
			switch (event.key.toLowerCase()) {
				case 'z':
					if (event.shiftKey) {
						event.preventDefault();
						redo();
					} else {
						event.preventDefault();
						undo();
					}
					break;
				case 'b':
					event.preventDefault();
					isBold = !isBold;
					break;
				case 'i':
					event.preventDefault();
					isItalic = !isItalic;
					break;
				case 'u':
					event.preventDefault();
					isUnderline = !isUnderline;
					break;
			}
		}
	}

	// Handle content changes
	function handleInput() {
		saveState();
	}
    
    function saveDocumentName() {
        // In a real app, this would save to the backend
        documentData.name = documentName;
        editingName = false;
    }

	// Keep documentData in sync with editorContent
	afterUpdate(() => {
		documentData.content = editorContent;
	});

	onMount(() => {
		if (textArea) {
			textArea.focus();
		}
	});
    
    function toggleFormatting(type: 'bold' | 'italic' | 'underline') {
        switch(type) {
            case 'bold':
                isBold = !isBold;
                break;
            case 'italic':
                isItalic = !isItalic;
                break;
            case 'underline':
                isUnderline = !isUnderline;
                break;
        }
        if (textArea) {
            textArea.focus();
        }
    }
</script>

<div class="flex flex-col h-screen w-full bg-[#0A1721] text-[#E5E5E5]">
    <!-- Navigation Bar -->
    <header class="bg-[#1A2733] p-4 shadow-md">
        <div class="container mx-auto flex items-center justify-between">
            <div class="flex items-center space-x-4">
                <a href="/" class="text-lg font-bold mr-6">Neovim for Writers</a>
                
                <a href="/drive" class="px-3 py-1 bg-[#2A3743] hover:bg-[#3A4753] rounded-md transition-colors">
                    My Drive
                </a>
                
                <a href="/projects" class="px-3 py-1 bg-[#2A3743] hover:bg-[#3A4753] rounded-md transition-colors">
                    Projects
                </a>
            </div>
            
            <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-400">{saveStatus}</span>
                <button 
                    on:click={() => undo()}
                    class="p-2 rounded hover:bg-[#2A3743] transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
                <button 
                    on:click={() => redo()}
                    class="p-2 rounded hover:bg-[#2A3743] transition-colors"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    </header>
    
    <!-- Document Title Bar -->
    <div class="bg-[#1E293B] p-4 border-b border-[#2A3743]">
        <div class="container mx-auto flex items-center justify-between">
            {#if editingName}
                <form on:submit|preventDefault={saveDocumentName} class="flex items-center">
                    <input 
                        bind:value={documentName}
                        class="bg-[#2A3743] text-white border border-blue-500 px-2 py-1 rounded focus:outline-none"
                        style="color: white !important;"
                    />
                    <button 
                        type="submit"
                        class="ml-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                        Save
                    </button>
                </form>
            {:else}
                <h1 
                    class="text-xl font-semibold cursor-pointer hover:text-blue-400" 
                    on:click={() => editingName = true}
                    title="Click to edit document name"
                >
                    {documentName}
                </h1>
            {/if}
            
            <div class="flex space-x-2">
                <button 
                    on:click={() => toggleFormatting('bold')}
                    class={"p-2 rounded transition-colors " + (isBold ? "bg-blue-600" : "hover:bg-[#2A3743]")}
                    title="Bold (Ctrl+B)"
                >
                    <span class="font-bold">B</span>
                </button>
                <button 
                    on:click={() => toggleFormatting('italic')}
                    class={"p-2 rounded transition-colors " + (isItalic ? "bg-blue-600" : "hover:bg-[#2A3743]")}
                    title="Italic (Ctrl+I)"
                >
                    <span class="italic">I</span>
                </button>
                <button 
                    on:click={() => toggleFormatting('underline')}
                    class={"p-2 rounded transition-colors " + (isUnderline ? "bg-blue-600" : "hover:bg-[#2A3743]")}
                    title="Underline (Ctrl+U)"
                >
                    <span class="underline">U</span>
                </button>
            </div>
        </div>
    </div>

    <!-- Editor Area -->
	<div class="flex-1 overflow-auto p-4">
        <div class="container mx-auto bg-[#1A2733] rounded-lg shadow-lg p-4 min-h-full">
            <textarea
                class="w-full h-full bg-transparent border-0 focus:outline-none resize-none"
                bind:this={textArea}
                bind:value={editorContent}
                on:input={handleInput}
                on:keydown={handleKeydown}
                placeholder="Start writing..."
                style="font-weight: {isBold ? 'bold' : 'normal'};
                    font-style: {isItalic ? 'italic' : 'normal'};
                    text-decoration: {isUnderline ? 'underline' : 'none'};
                    color: white;"
            ></textarea>
        </div>
    </div>
</div>

<style>
    textarea {
        font-family: 'Courier New', Courier, monospace;
        font-size: 1rem;
        line-height: 1.5;
    }
</style>
