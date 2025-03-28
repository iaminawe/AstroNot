<script lang="ts">
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
    DarkMode,
  } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { throttle } from "../helpers/throttle";
  import { navbar } from "../stores/layout";

  $: transluscent = $navbar.transluscent;

  const HAMBURGER_BREAKPOINT = 768; // in px, pixel size where the menu changes from hamburger to a full menu. TODO: Extract this
  const THROTTLE_DELAY = 1000; // ms, prevent the hamburger menu from re-triggering during animations

  let activeUrl: string = "";
  let innerWidth: number;
  const name = "Gregg Coppen"; // TODO: Make this a param, site config

  $: isHamburgerMenu = innerWidth < HAMBURGER_BREAKPOINT;

  // Ensure links are properly formatted
  const getUrl = (path: string) => {
    // Remove any leading slashes and ensure single slash at start
    return '/' + path.replace(/^\/+/, '');
  };

  const handleClickOutside = throttle((event) => {
    // Since Flowbite-Svelte doesn't export any way to control the nav menu, we have to do it ourselves via DOM
    // TODO: Submit a patch to Flowbite-Svelte to allow us to control the nav menu programmatically by including this function
    if (!isHamburgerMenu) return; // Discard outside clicks when hamburger menu is not shown

    const navEl = document.getElementsByClassName("navbar")[0];

    if (navEl.contains(event.srcElement)) {
      return;
    }

    const navElement = document.querySelector("nav > div > div") as HTMLElement;
    const isHidden = navElement?.hidden;
    if (!isHidden) {
      const hamburgerEl = document.querySelector("nav > div > button") as HTMLElement;
      hamburgerEl?.click(); // Hide Nav
    }
  }, THROTTLE_DELAY);

  // Event Listeners
  onMount(() => {
    function setActiveUrl() {
      activeUrl = window.location.pathname.includes("/posts/")
        ? "/blog"
        : window.location.pathname;
    }

    window.addEventListener("click", handleClickOutside);
    setActiveUrl();

    document.addEventListener("astro:after-swap", () => {
      setActiveUrl();
      window.addEventListener("click", handleClickOutside);
    });
  });
</script>

<svelte:window bind:innerWidth />

{#key $navbar}
  <Navbar
    color="primary"
    class={`text-white ${
      transluscent ? "dark:bg-primary-50 dark:bg-opacity-20" : ""
    }`}
  >
    <NavBrand href={getUrl('/')}>
      <img
        src={getUrl('/images/astronot-logo.webp')}
        width="40"
        height="40"
        class="mr-3 aspect-square h-8 w-8 rounded-full sm:h-10 sm:w-10"
        alt="Logo"
      />
      <span
        class="self-center whitespace-nowrap text-xl font-semibold dark:text-white"
        >{name}</span
      >
    </NavBrand>

    {#if !isHamburgerMenu}
      <div class="flex">
        <NavUl
          {activeUrl}
          activeClass="text-white bg-primary-200 md:bg-transparent text-[14px] font-bold hover:scale-105"
          nonActiveClass="md:text-secondary-200 text-[14px] hover:scale-105"
        >
          <NavLi href={getUrl('/')}>Home</NavLi>
          <NavLi href={getUrl('/about')}>About</NavLi>
          <NavLi href={getUrl('/projects')}>Projects</NavLi>
          <NavLi href={getUrl('/blog')}>Blog</NavLi>
          <NavLi href={getUrl('/contact')}>Contact</NavLi>

        </NavUl>
        <DarkMode btnClass="ml-4 text-white" size="lg" />
      </div>
    {:else}
      <div>
        <DarkMode btnClass="ml-4 text-white" size="lg" />
        <NavHamburger menuClass="text-white" />
      </div>
      <NavUl
        {activeUrl}
        activeClass="text-white bg-primary-200 md:bg-transparent text-[14px] font-bold hover:scale-105"
        nonActiveClass="md:text-secondary-200 text-[14px] hover:scale-105"
      >
        <NavLi href={getUrl('/')}>Home</NavLi>
        <NavLi href={getUrl('/about')}>About</NavLi>
        <NavLi href={getUrl('/projects')}>Projects</NavLi>
        <NavLi class="cursor-pointer" href={getUrl('/blog')}>Blog</NavLi>
        <NavLi href={getUrl('/contact')}>Contact</NavLi>
      </NavUl>
    {/if}
  </Navbar>
{/key}
