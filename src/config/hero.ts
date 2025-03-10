export interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  ctaButton: {
    text: string;
    url: string;
    target?: string;
  };
  profileImage: {
    src: string;
    alt: string;
  };
}

export const heroContent: HeroContent = {
  title: "Hi I'm Gregg Coppen",
  subtitle: "Transforming ideas into powerful scalable digital solutions by blending creativity with technical expertise.",
  description: "A creative professional with over two decades of experience in web development design and animation. I specialize in crafting powerful scalable platforms that not only meet technical demands but also captivate users through intuitive design and engaging experiences. From e-commerce and AI platforms to community-focused websites my passion lies in turning complex challenges into elegant solutions.",
  ctaButton: {
    text: "Book a 30 minute call",
    url: "https://tidycal.com/growagent/30-minute-meeting",
    target: "_blank"
  },
  profileImage: {
    src: "/images/portrait.webp",
    alt: "Gregg Coppen"
  }
};
