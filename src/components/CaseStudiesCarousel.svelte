<script>
  import { onMount } from 'svelte';
  import { ArrowLeftOutline, ArrowRightOutline } from 'flowbite-svelte-icons';

  // This will be populated from the Astro component
  export let projectPosts = [];
  
  let currentIndex = 0;

  function next() {
    currentIndex = (currentIndex + 1) % projectPosts.length;
  }

  function prev() {
    currentIndex = (currentIndex - 1 + projectPosts.length) % projectPosts.length;
  }

  onMount(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  });
</script>

<section class="relative py-6 sm:py-10">
  <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
    <h2 class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
      Case Studies
    </h2>
    
    {#if projectPosts.length > 0}
      <div class="relative">
        {#each projectPosts as post, index}
          {#if index === currentIndex}
          <div class="relative w-full h-64 md:h-96 transition-opacity duration-500" style="opacity: 1;">
            <div class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg" style="aspect-ratio: 2/1;"></div>
            <img 
              src={post.coverImage} 
              alt={post.title} 
              class="w-full h-full object-cover rounded-lg absolute top-0 left-0"
              style="opacity: 0; transition: opacity 0.5s ease-in-out;"
              loading="eager"
              on:load={(e) => setTimeout(() => e.target.style.opacity = '1', 50)}
              fetchpriority="high"
            />
              <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div class="text-center text-white p-4">
                  <h3 class="text-2xl font-bold">{post.title}</h3>
                  <p class="mt-2">{post.description}</p>
                  <a href={post.url} class="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">View Project</a>
                </div>
              </div>
            </div>
          {/if}
        {/each}
        
        {#if projectPosts.length > 1}
          <div class="absolute inset-y-0 left-0 flex items-center">
            <button on:click={prev} class="bg-black bg-opacity-50 p-2 rounded-r-lg hover:bg-opacity-75">
              <ArrowLeftOutline class="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div class="absolute inset-y-0 right-0 flex items-center">
            <button on:click={next} class="bg-black bg-opacity-50 p-2 rounded-l-lg hover:bg-opacity-75">
              <ArrowRightOutline class="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div class="flex justify-center mt-4">
            {#each projectPosts as _, index}
              <button 
                on:click={() => currentIndex = index}
                class="mx-1 w-3 h-3 rounded-full {index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}"
              ></button>
            {/each}
          </div>
        {/if}
      </div>
    {:else}
      <p class="text-center text-gray-500 dark:text-gray-400">No project case studies found.</p>
    {/if}
  </div>
</section>
