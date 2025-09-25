import { TotalPagesMessageProps } from "../src/types";

const fewPagesMessages = [
  "Looks like you prefer books with more pictures, huh?",
  "Blink and it’s over, your books were short and sweet.",
  "Seems like you enjoyed the appetizer, not the full meal.",
  "A quick taste of stories, maybe next year the full course?",
  "Tiny page counts, but maybe big vibes?",
  "You like it short and snappy, nothing wrong with that!",
  "Your books were lighter than a coffee break.",
  "Seems like you had time for covers... but not many chapters.",
];

export function getTotalPagesMessage(totalPages: number): TotalPagesMessageProps {
  if (totalPages < 100) {
    const message = fewPagesMessages[Math.floor(Math.random() * fewPagesMessages.length)];
    return {
      title: "you",
      highlight: "read",
      subtitle: `pages. ${message}`,
    };
  }
  if (totalPages < 500)
    return {
      title: "you",
      highlight: "read",
      subtitle: " pages, a light warm-up",
    };
  if (totalPages < 2000)
    return {
      title: "you",
      highlight: "made it through",
      subtitle: "pages. Steady and solid",
    };
  if (totalPages < 5000) {
    return {
      title: "you",
      highlight: "devoured",
      subtitle: "pages. That’s some serious reading",
    };
  }
  return {
    title: "you",
    highlight: "conquered",
    subtitle: "pages. Legendary status unlocked",
  };
}
