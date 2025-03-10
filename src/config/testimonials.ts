export interface Testimonial {
  name: string;
  title: string;
  company: string;
  quote: string;
  avatar?: string; // Optional path to avatar image
}

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    title: "CEO",
    company: "TechInnovate",
    quote: "Gregg's expertise in web development transformed our online presence. His ability to blend technical excellence with creative design resulted in a platform that not only looks stunning but performs exceptionally well."
  },
  {
    name: "Michael Chen",
    title: "Marketing Director",
    company: "Global Solutions",
    quote: "Working with Gregg was a game-changer for our digital strategy. His deep understanding of both design principles and technical implementation helped us create a seamless user experience that has significantly increased our conversion rates."
  },
  {
    name: "Emily Rodriguez",
    title: "Founder",
    company: "Startup Ventures",
    quote: "As a startup founder, finding someone who understands both the technical and business aspects of web development is crucial. Gregg exceeded our expectations, delivering a scalable solution that has grown with our business."
  },
  {
    name: "David Thompson",
    title: "CTO",
    company: "Enterprise Systems",
    quote: "Gregg's technical expertise is unmatched. He helped us modernize our legacy systems with a forward-thinking approach that has made our platforms more robust, secure, and user-friendly."
  },
  {
    name: "Lisa Wong",
    title: "Product Manager",
    company: "Digital Innovations",
    quote: "The attention to detail and commitment to quality that Gregg brings to every project is remarkable. He doesn't just build websites; he creates digital experiences that engage and delight users."
  },
  {
    name: "James Wilson",
    title: "E-commerce Director",
    company: "Retail Solutions",
    quote: "Our e-commerce platform needed a complete overhaul, and Gregg delivered beyond our expectations. His strategic approach to UX design and technical implementation has resulted in a 40% increase in online sales."
  }
];
