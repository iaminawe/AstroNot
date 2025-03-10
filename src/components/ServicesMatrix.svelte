<script>
  import { onMount } from 'svelte';
  import { Button } from "flowbite-svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
  import { fetchServices } from "../helpers/notion.js";
  
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
  
  // Import services from config file as fallback
  import { services as configServices } from "../config/services";
  
  // Use config services as initial value
  let services = configServices;
  
  // Fetch services from Notion only if SERVICES_DB_ID is provided
  onMount(async () => {
    try {
      // Check if we should fetch from Notion
      const servicesDbId = import.meta.env.VITE_SERVICES_DB_ID;
      const shouldFetchFromNotion = servicesDbId && 
                                   servicesDbId !== 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      
      if (shouldFetchFromNotion) {
        const notionServices = await fetchServices();
        if (notionServices && notionServices.length > 0) {
          services = notionServices;
        }
      }
    } catch (error) {
      console.error("Error fetching services from Notion:", error);
      // Fallback to config services
      services = configServices;
    }
  });
</script>

<section class="relative py-6 sm:py-10">
  <div class="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
    <h2 class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
      My Services
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each services as phase}
        <div class="flex flex-col">
          <!-- Phase Header -->
          <div class="flex items-center mb-6">
            <div class="flex justify-center items-center mr-3 w-10 h-10 rounded-full bg-primary-100 lg:h-12 lg:w-12 dark:bg-primary-900">
              <svelte:component this={iconMap[phase.phase === 'Learn' ? 'BookOpenOutline' : phase.phase === 'Strategize' ? 'ChartOutline' : 'RocketOutline']} 
                class="w-5 h-5 text-primary-600 dark:text-primary-300" />
            </div>
            <h3 class="text-xl font-bold dark:text-white">{phase.phase}</h3>
          </div>
          
          <!-- Service Cards -->
          <div class="space-y-6">
            {#each phase.items as item}
              <div class="p-6 bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700 flex flex-col">
                <div class="flex items-center mb-4">
                  <div class="flex justify-center items-center mr-3 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900">
                    <svelte:component this={iconMap[item.icon]} 
                      class="w-4 h-4 text-primary-600 dark:text-primary-300" />
                  </div>
                  <h4 class="text-lg font-semibold dark:text-white">{item.title}</h4>
                </div>
                <p class="mb-4 text-gray-500 dark:text-gray-400 flex-grow">{item.desc}</p>
                <div class="mt-auto">
                  <Button href={item.link} size="sm" color="light" class="inline-flex items-center">
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
