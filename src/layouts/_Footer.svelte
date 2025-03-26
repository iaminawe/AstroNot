<script lang="ts">
  // Ensure links are properly formatted
  const getUrl = (path: string) => {
    // Remove any leading slashes and ensure single slash at start
    return '/' + path.replace(/^\/+/, '');
  };
  import {
    Footer,
    FooterCopyright,
    FooterLinkGroup,
    FooterLink,
    FooterBrand,
    FooterIcon
  } from "flowbite-svelte";
  import { navbar } from "../stores/layout";
  import SocialLinks from "../components/SocialLinks.svelte";

  $: transluscent = $navbar.transluscent;
  $: footerClass = `text-white navbar bg-primary-50 ${
    transluscent ? "dark:bg-primary-50 dark:bg-opacity-20" : ""
  }`;
</script>

{#key $navbar}
  <footer>
    <Footer footerType="socialmedia" class={footerClass}>
      <div
        class="m-auto max-w-screen-2xl sm:flex sm:items-center sm:justify-between"
      >
        <div class="flex items-center justify-center">
          <img
            src={getUrl('/images/astronot-logo.webp')}
            class="mr-3 h-8 w-8 rounded-full sm:h-10 sm:w-10"
            width="40"
            height="40"
            alt="Flowbite Logo"
          />
          <a
            class="flex-none text-xl font-semibold text-gray-100"
            href={getUrl('/')}
            aria-label="Brand">Gregg Coppen</a
          >
        </div>
        <div
          class="align-center flex flex-col items-center !text-gray-300 dark:!text-primary-200"
        >
          <FooterLinkGroup
            ulClass="flex flex-row justify-center items-center my-2 text-secondary-200 font-semibold"
          >
            <FooterLink href={getUrl('/')}>Home</FooterLink>
            <FooterLink href={getUrl('/blog')}>Blog</FooterLink>
            <FooterLink href={getUrl('/about')}>About</FooterLink>
            <FooterLink href={getUrl('/contact')}>Contact</FooterLink>
          </FooterLinkGroup>
          <!-- <FooterCopyright
            href="https://opensource.org/license/mit/"
            by="AstroNot 🚀🌚&nbsp;"
            copyrightMessage="Open Source & Free Forever ❤️"
            spanClass="text-xs text-grey-900"
          /> -->
        </div>

        <div class="mt-4 flex items-center justify-center sm:mt-0">
          <SocialLinks size="sm" color="white" />
        </div>
      </div>
    </Footer>
  </footer>
{/key}
