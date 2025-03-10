<script>
  let scrollY = 0;
  let innerWidth = 0;
  let imageLoaded = false;

  export let imgClass =
    "w-full h-[256px] sm:h-[256px] md:h-[384px] lg:h-[512px] 2xl:h-[640px] object-cover";

  export let scrollMax = -150; // To control the maximum amount of scrolling in px
  export let scrollRate = -0.75; // Adjust negative scroll rate for image to slide off top of screen positive scroll rate for body to slide over image
  export let mobileImage = "";
  export let desktopImage = "";

  const WIDTH_THRESHOLD = 1280;
  $: scrollPosition = Math.max(
    scrollY * scrollRate,
    scrollMax *
      (innerWidth < WIDTH_THRESHOLD
        ? 1 - (WIDTH_THRESHOLD - innerWidth) / WIDTH_THRESHOLD
        : 1)
  );
  $: imgStyle = `object-position: 50% calc(50% + ${scrollPosition}px); transition: opacity 0.5s ease-in-out; ${imageLoaded ? 'opacity: 1;' : 'opacity: 0;'}`;

  function handleImageLoad() {
    setTimeout(() => {
      imageLoaded = true;
    }, 50);
  }
</script>

<svelte:window bind:scrollY bind:innerWidth />

<div>
  <div class="w-full h-[256px] sm:h-[256px] md:h-[384px] lg:h-[512px] 2xl:h-[640px] bg-gray-200 dark:bg-gray-700"></div>
  {#if innerWidth <= 640}
    <img 
      src={mobileImage} 
      class={`${imgClass} absolute top-0 left-0`} 
      alt="parallax" 
      style={imgStyle} 
      loading="eager" 
      fetchpriority="high"
      on:load={handleImageLoad}
    />
  {:else}
    <img 
      src={desktopImage} 
      class={`${imgClass} absolute top-0 left-0`} 
      alt="parallax" 
      style={imgStyle} 
      loading="eager" 
      fetchpriority="high"
      on:load={handleImageLoad}
    />
  {/if}
</div>
