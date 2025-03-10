<script>
  import { onMount } from 'svelte';
  import { fetchSocialLinks } from "../helpers/notion.js";
  
  // Import Flowbite icons
  import {
    FacebookSolid,
    GithubSolid,
    DiscordSolid,
    TwitterSolid,
    InstagramSolid,
    LinkedinSolid,
    YoutubeSolid,
    TiktokSolid,
    DribbbleSolid,
    BehanceSolid,
    MediumSolid
  } from "flowbite-svelte-icons";
  
  // Import social links from config file as fallback
  import { aboutContent } from "../config/about";
  
  // Props
  export let size = "md"; // sm, md, lg
  export let color = "default"; // default, primary, white, gray
  export let showLabels = false;
  export let horizontal = true;
  export let className = "";
  
  // Size classes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };
  
  // Color classes
  const colorClasses = {
    default: "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
    primary: "text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300",
    white: "text-white hover:text-gray-200",
    gray: "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
  };
  
  // Container classes
  const containerClass = horizontal 
    ? `flex flex-row items-center space-x-4 ${className}` 
    : `flex flex-col space-y-4 ${className}`;
  
  // Icon component mapping
  const iconComponents = {
    FacebookSolid,
    GithubSolid,
    DiscordSolid,
    TwitterSolid,
    InstagramSolid,
    LinkedinSolid,
    YoutubeSolid,
    TiktokSolid,
    DribbbleSolid,
    BehanceSolid,
    MediumSolid
  };
  
  // Use config social links as initial value
  let socialLinks = aboutContent.socialLinks;
  
  // Fetch social links from Notion if available
  onMount(async () => {
    try {
      // Check if we should fetch from Notion
      const socialLinksDbId = import.meta.env.VITE_SOCIAL_LINKS_DB_ID;
      const shouldFetchFromNotion = socialLinksDbId && 
                                   socialLinksDbId !== 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      
      if (shouldFetchFromNotion) {
        const notionSocialLinks = await fetchSocialLinks();
        if (notionSocialLinks && notionSocialLinks.length > 0) {
          socialLinks = notionSocialLinks;
        }
      }
    } catch (error) {
      console.error("Error fetching social links from Notion:", error);
      // Fallback to config social links
      socialLinks = aboutContent.socialLinks;
    }
  });
</script>

<div class={containerClass}>
  {#each socialLinks as link}
    <a 
      href={link.url} 
      target="_blank" 
      rel="noopener noreferrer"
      class={`transition-transform hover:scale-110 ${showLabels ? 'flex items-center gap-2' : ''}`}
      aria-label={link.name}
    >
      {#if link.iconType === 'component' && iconComponents[link.icon]}
        <svelte:component 
          this={iconComponents[link.icon]} 
          class={`${sizeClasses[size]} ${colorClasses[color]}`} 
        />
      {:else}
        <svg 
          viewBox="0 0 24 24" 
          aria-hidden="true" 
          class={`${sizeClasses[size]} ${colorClasses[color]} fill-current`}
        >
          <path d={link.icon}></path>
        </svg>
      {/if}
      
      {#if showLabels}
        <span class={colorClasses[color]}>{link.name}</span>
      {/if}
    </a>
  {/each}
</div>
