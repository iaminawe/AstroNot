<script>
  import { onMount } from 'svelte';
  import { Button } from "flowbite-svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
  
  // Accept props from parent
  export let heroContent = {};
  export let source = "CONFIG";
  
  // Log for debugging
  onMount(() => {
    console.log("FeatureHero component mounted");
    console.log(`Hero content source: ${source}`);
    console.log("Hero content:", heroContent);
  });
</script>

<section class="relative py-6 sm:py-10">
  <div class="max-w-screen-xl px-4 py-8 mx-auto lg:py-16">
    <div class="mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-12">
    <!-- Text content (2/3 width on large screens) -->
    <div class="lg:w-2/3">
      <h1 class="mb-4 text-4xl font-extrabold tracking-tight !leading-[1.05] md:text-5xl xl:text-6xl dark:text-white">
        {heroContent.title}
      </h1>

      <h2 class="mb-4 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
        {heroContent.subtitle}
      </h2>

      <div class="mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-200">
        <p>
          {heroContent.description}
        </p>
      </div>

      <div class="mt-8 flex flex-col gap-2 sm:flex-row sm:gap-0">
        <a
          href={heroContent.ctaButton.url}
          target={heroContent.ctaButton.target}
        >
          <Button
            size="xl"
            color="blue"
            class="mr-3 inline-flex items-center justify-center"
          >
            {heroContent.ctaButton.text}
            <ArrowRightOutline size="md" class="-mr-1 ml-2" />
          </Button>
        </a>
        
        {#if heroContent.secondaryCtaButton && heroContent.secondaryCtaButton.text}
          <a
            href={heroContent.secondaryCtaButton.url}
            target={heroContent.secondaryCtaButton.target}
          >
            <Button
              size="xl"
              color="alternative"
              class="inline-flex items-center justify-center"
            >
              {heroContent.secondaryCtaButton.text}
            </Button>
          </a>
        {/if}
      </div>
    </div>

    <!-- Profile image (1/3 width on large screens) -->
    <div class="mt-8 lg:mt-0 lg:w-1/3">
      <div class="relative mx-auto max-w-full lg:max-w-none">
        <img
          src={heroContent.profileImage.src}
          alt={heroContent.profileImage.alt}
          class="rounded-lg shadow-xl dark:shadow-gray-700/80"
        />
      </div>
    </div>
    </div>
  </div>
  
  {#if heroContent.content}
    <div class="max-w-screen-xl px-4 mx-auto">
      <div class="prose dark:prose-invert mt-12 format format-sm sm:format-base lg:format-lg format-blue dark:format-invert max-w-none">
        {@html heroContent.content}
      </div>
    </div>
  {/if}
</section>
