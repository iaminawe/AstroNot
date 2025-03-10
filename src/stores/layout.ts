import { map } from "nanostores";

export const navbar = map({
  transluscent: false,
});

export const layoutStore = map({
  darkMode: false,
  authorData: {
    name: "Gregg Coppen",
    bio: "Consultant, Designer, Developer",
    avatar: "/images/portrait.webp"
  }
});
