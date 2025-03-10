<script>
  import { Badge } from "flowbite-svelte";
  
  export let items = [];
  export let title = "";
  export let icon = "";
</script>

<div class="mb-8">
  {#if title}
    <h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
  {/if}
  
  <ol class="relative border-l border-gray-200 dark:border-gray-700">
    {#each items as item, index}
      <li class="mb-10 ml-6">
        <span class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
          <svg class="w-2.5 h-2.5 text-blue-800 dark:text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
          </svg>
        </span>
        <h3 class="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {item.title}
          {#if index === 0}
            <span class="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3">Latest</span>
          {/if}
        </h3>
        <div class="mb-2 text-base font-normal">
          <span class="text-gray-500 dark:text-gray-400">{item.company}</span>
          <span class="mx-2 text-gray-400">•</span>
          <span class="text-gray-500 dark:text-gray-400">{item.location}</span>
        </div>
        <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{item.period}</time>
        
        {#if item.description && item.description.length > 0}
          <ul class="mb-4 space-y-2 text-base font-normal text-gray-500 dark:text-gray-400 list-disc list-inside">
            {#each item.description as desc}
              <li>{desc}</li>
            {/each}
          </ul>
        {/if}
        
        {#if item.skills && item.skills.length > 0}
          <div class="flex flex-wrap gap-2 mt-3">
            {#each item.skills as skill}
              <Badge color="indigo" class="font-normal">{skill}</Badge>
            {/each}
          </div>
        {/if}
      </li>
    {/each}
  </ol>
</div>
