<script lang="ts">
  import {
    Section,
    HeroHeader,
    FeatureDefault,
    FeatureItem,
  } from "flowbite-svelte-blocks";
  import {
    RocketSolid,
    FlowbiteSolid,
    ImageOutline,
    RectangleListSolid,
    EyeSolid,
    MoonSolid,
    MobilePhoneSolid,
    WindowSolid,
  } from "flowbite-svelte-icons";
  import { List, Li, Heading } from 'flowbite-svelte';
  // import HyperDarkControls from "../../components/HyperDark/HyperDarkControls.svelte";
</script>
<Section name="feature">
    <HeroHeader
    h2Class="mb-10 text-2xl font-bold tracking-tight !leading-[1.05] md:text-3xl xl:text-4xl dark:text-white">
    <svelte:fragment slot="h2">
      What can I do for you?
    </svelte:fragment>
  </HeroHeader>
  <FeatureDefault>
    <FeatureItem>
      <svelte:fragment slot="icon">
        <EyeSolid class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">AI Consulting & Implementation</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Strategy development for AI integration</li>
          <li>Custom AI agent platform development</li>
          <li>Enhancing user experiences with AI solutions</li>
        </ul>
      </svelte:fragment>

    </FeatureItem>
    <FeatureItem>
      <svelte:fragment slot="icon"
        ><WindowSolid
          class="text-white dark:text-primary-50"
        /></svelte:fragment
      >
      <svelte:fragment slot="h3">Drupal Development</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Consulting and Strategy</li>
          <li>Theming & Site Building</li>
          <li>Multi-site platform implementation</li>
          <li>E-commerce platform development</li>
          <li>Upgrades & Maintenance</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>
    <FeatureItem>
      <svelte:fragment slot="icon"
        ><WindowSolid
          class="text-white dark:text-primary-50"
        /></svelte:fragment
      >
      <svelte:fragment slot="h3">Front End Development</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Interface building with React and JavaScript</li>
          <li>UX/UI design using Figma and Framer</li>
          <li>Responsive and mobile-first design</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>
    <FeatureItem>
      <svelte:fragment slot="icon">
        <RectangleListSolid class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">Design & Animation</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Branding and identity design</li>
          <li>Website style tiles & design systems</li>
          <li>Motion graphics for broadcast and web</li>
          <li>Expertise in Adobe Creative Suite</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>

    <FeatureItem>
      <svelte:fragment slot="icon">
        <FlowbiteSolid class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3"
        >Project Management</svelte:fragment
      >
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Planning and strategizing scalable web projects</li>
          <li>Agile infrastructure and implementaion</li>
          <li>Team leadership and cross-functional coordination</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>

    <FeatureItem>
      <svelte:fragment slot="icon">
        <RocketSolid class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">Entrepreneurial Ventures</svelte:fragment>
       <svelte:fragment slot="paragraph">
        <ul>
          <li>Product design and development</li>
          <li>Software tools for creative makers</li>
          <li>Startup consulting and team building</li>
        </ul>
      </svelte:fragment>
      
    </FeatureItem>

    <FeatureItem>
      <svelte:fragment slot="icon">
        <ImageOutline class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">Deployment & Hosting</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>AWS infrastructure setup and management</li>
          <li>Continuous integration and automation</li>
          <li>Deployment and hosting</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>
    <FeatureItem>
      <svelte:fragment slot="icon">
        <ImageOutline class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">Support & Maintenance</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Troubleshooting issues</li>
          <li>Updating/Upgrading codebases</li>
          <li>Evaluating alternative options</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>
    <FeatureItem>
      <svelte:fragment slot="icon">
        <ImageOutline class="text-white dark:text-primary-50" />
      </svelte:fragment>
      <svelte:fragment slot="h3">Education & Training</svelte:fragment>
      <svelte:fragment slot="paragraph">
        <ul>
          <li>Troubleshooting issues</li>
          <li>Updating/Upgrading codebases</li>
          <li>Supporting decisionmaking</li>
        </ul>
      </svelte:fragment>
    </FeatureItem>
  </FeatureDefault>

</Section>
