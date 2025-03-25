<script lang="ts">
    export let message: string = 'Loading...';
    export let isLoading: boolean = false;
</script>

{#if isLoading}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-[#1A2733] p-8 rounded-lg shadow-xl">
            <div class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p class="text-[#E5E5E5]">{message}</p>
            </div>
        </div>
    </div>
{/if} 