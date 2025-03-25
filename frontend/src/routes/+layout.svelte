<!----
    This is our layout file. It's the parent of all our pages.
    It's used to define the layout of our pages.
    We can have global CSS, scripts, and other things here.
-->

<script lang="ts">
	// Import the global CSS file
	// Can import other global components here such as a Navbar, Footer, etc, 
	// things we want to be on every page
	import '../app.css';
	import Navbar from '../components/Navbar.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
</script>

<Navbar />
<ToastContainer />

<!-- Renders the current page -->
<div class="min-h-screen bg-[#0A1721]">
	<slot></slot>
</div>
