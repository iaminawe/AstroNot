<script>
  import { onMount } from 'svelte';
  import { UserCircleSolid } from "flowbite-svelte-icons";
  
  // Accept props from parent
  export let testimonials = [];
  export let source = "CONFIG";
  export let limit = testimonials.length;
  
  // Reactive variable for displayed testimonials
  $: displayedTestimonials = testimonials.slice(0, limit);
  
  // Log for debugging
  onMount(() => {
    console.log("Testimonials component mounted");
    console.log(`Testimonials source: ${source}`);
    console.log(`Testimonials count: ${testimonials.length}`);
    console.log(`Displaying ${displayedTestimonials.length} testimonials`);
  });
</script>

<section class="relative py-6 sm:py-10">
  <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
    <h2 class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
      Client Testimonials
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each displayedTestimonials as testimonial}
        <div class="p-6 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 flex flex-col">
          <div class="flex items-center mb-4">
            {#if testimonial.avatar}
              <img 
                src={testimonial.avatar} 
                alt={testimonial.name} 
                class="w-12 h-12 rounded-full mr-4 object-cover"
                loading="lazy"
              />
            {:else}
              <div class="w-12 h-12 rounded-full mr-4 bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <UserCircleSolid class="w-8 h-8 text-primary-600 dark:text-primary-300" />
              </div>
            {/if}
            <div>
              <h3 class="text-lg font-semibold dark:text-white">{testimonial.name}</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}, {testimonial.company}</p>
            </div>
          </div>
          
          <div class="flex-grow">
            <p class="mb-4 text-gray-500 dark:text-gray-400 italic">"{testimonial.quote}"</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
