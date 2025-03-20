<script>
  import { onMount } from 'svelte';
  import { Button } from "flowbite-svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
  import {
    BookOpenOutline,
    LightbulbOutline,
    SearchOutline,
    PenOutline,
    ChartOutline,
    CodeOutline,
    ClipboardListOutline,
    BugOutline,
    CloudArrowUpOutline,
    RocketOutline
  } from "flowbite-svelte-icons";

  // Props
  export let services = [];
  export let categories = { hierarchy: [] };
  export let source = "CONFIG";

  // Icon mapping
  const iconMap = {
    BookOpenOutline,
    LightbulbOutline,
    SearchOutline,
    PenOutline,
    ChartOutline,
    ClipboardListOutline,
    RocketOutline,
    CodeOutline,
    BugOutline,
    CloudArrowUpOutline
  };

  // Get description based on source
  function getDescription(item) {
    return item.description;
  }

  // Get URL based on source
  function getUrl(item) {
    return item.url || "#";
  }

  // Set active tab to AI Consulting or first category
  $: activeTab = services.find(c => c.name === "AI Consulting")?.name || services[0]?.name;

  // Get active category
  $: activeCategory = services.find(c => c.name === activeTab);
</script>

<section class="relative py-6 sm:py-10">
  <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
    <h2 class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
      My Services
    </h2>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700">
      {#each services as category}
        <button
          class="py-4 px-6 block hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none {activeTab === category.name ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-500 dark:border-primary-500' : 'text-gray-500 dark:text-gray-400'}"
          on:click={() => activeTab = category.name}
        >
          {category.name}
        </button>
      {/each}
    </div>

    <!-- Tab Content -->
    {#if activeCategory}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        {#each activeCategory.children as subcategory}
          <div class="flex flex-col h-full">
            <!-- Subcategory Header -->
            <div class="flex items-center mb-6">
              <h3 class="text-xl font-bold dark:text-white">{subcategory.name}</h3>
            </div>
            <div class="mb-4 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{subcategory.intro}</div>

            <!-- Service Cards -->
            <div class="space-y-6 flex-grow">
              {#each subcategory.items as item}
                <div class="p-6 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                  <div class="flex items-center mb-4">
                    <div class="flex justify-center items-center mr-3 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900">
                      {#if item.icon && iconMap[item.icon]}
                        <svelte:component this={iconMap[item.icon]} class="w-4 h-4 text-primary-600 dark:text-primary-300" />
                      {:else}
                        <svelte:component this={LightbulbOutline} class="w-4 h-4 text-primary-600 dark:text-primary-300" />
                      {/if}
                    </div>
                    <h4 class="text-lg font-semibold dark:text-white">{item.title}</h4>
                  </div>
                  <p class="mb-4 text-gray-500 dark:text-gray-400 flex-grow">
                    {getDescription(item)}
                  </p>
                  <div class="mt-auto">
                    <Button href={getUrl(item)} size="sm" color="light" class="inline-flex items-center">
                      Find out more
                      <ArrowRightOutline class="ml-1 -mr-1 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
            <div class="mt-4 text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{subcategory.footnotes}</div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>
