<script>
  import { onMount } from 'svelte';
  import { Button } from "flowbite-svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
  
  // Import all the icons we need
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

  // Icon mapping
  const iconMap = {
    'BookOpenOutline': BookOpenOutline,
    'LightbulbOutline': LightbulbOutline,
    'SearchOutline': SearchOutline,
    'PenOutline': PenOutline,
    'ChartOutline': ChartOutline,
    'ClipboardListOutline': ClipboardListOutline,
    'RocketOutline': RocketOutline,
    'CodeOutline': CodeOutline,
    'BugOutline': BugOutline,
    'CloudArrowUpOutline': CloudArrowUpOutline
  };
  
  // Accept props from parent
  export let services = [];
  export let source = "CONFIG";
  
  // Debug variables to display in UI
  let debugLogs = [
    "Debug logs initialized",
    `Current time: ${new Date().toLocaleTimeString()}`,
    `Services source: ${source}`,
    `Services count: ${services.length}`
  ];
  
  if (services.length > 0 && services[0].items) {
    debugLogs.push(`First service category: ${services[0].name || services[0].phase || "Unknown"}`);
    debugLogs.push(`First service item: ${services[0].items[0]?.title || "Unknown"}`);
  }
  
  // Helper function to add debug logs
  function addLog(message) {
    debugLogs = [...debugLogs, message];
    console.log(message);
  }
  
  onMount(() => {
    addLog("ServicesMatrix component mounted");
    addLog(`Props received: services (${services.length}), source (${source})`);
  });
</script>

<section class="relative py-6 sm:py-10">
  <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
    <h2 class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
      My Services
    </h2>
    <!-- Debug information removed as requested -->
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each services as serviceCategory}
        <div class="flex flex-col">
          <!-- Category Header -->
          <div class="flex items-center mb-6">
            <div class="flex justify-center items-center mr-3 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
              {#if serviceCategory.icon && iconMap[serviceCategory.icon]}
                <svelte:component this={iconMap[serviceCategory.icon]} class="w-5 h-5 text-primary-600 dark:text-primary-300" />
              {:else if serviceCategory.phase === 'Learn'}
                <svelte:component this={BookOpenOutline} class="w-5 h-5 text-primary-600 dark:text-primary-300" />
              {:else if serviceCategory.phase === 'Strategize'}
                <svelte:component this={ChartOutline} class="w-5 h-5 text-primary-600 dark:text-primary-300" />
              {:else}
                <svelte:component this={RocketOutline} class="w-5 h-5 text-primary-600 dark:text-primary-300" />
              {/if}
            </div>
            <h3 class="text-xl font-bold dark:text-white">{serviceCategory.name || serviceCategory.phase}</h3>
          </div>
          
          <!-- Service Cards -->
          <div class="space-y-6">
            {#each serviceCategory.items as item}
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
                  {item.desc || item.description}
                </p>
                <div class="mt-auto">
                  <Button href={item.link || item.url || "#"} size="sm" color="light" class="inline-flex items-center">
                    Find out more
                    <ArrowRightOutline class="ml-1 -mr-1 w-4 h-4" />
                  </Button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
