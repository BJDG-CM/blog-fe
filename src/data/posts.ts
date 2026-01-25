export type Post = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  imageAlt: string;
  content: string[];
};

export const posts: Post[] = [
  {
    id: "01",
    title: "Designing a slower, softer internet",
    excerpt:
      "How intentional typography and white space can reshape the way we read online.",
    category: "Design",
    date: "Sep 16, 2024",
    readTime: "6 min read",
    image: "/reading.svg",
    imageAlt: "Abstract line drawing of a person reading",
    content: [
      "I want the internet to feel more like a quiet studio than a flashing billboard. That means using generous margins, purposeful typography, and a single accent tone to guide attention.",
      "When every element competes for attention, nothing stands out. I prefer to let the story breathe, with consistent rhythms for headings, pull quotes, and notes.",
      "Start with a neutral background, layer in a soft highlight color, and use a serif to slow the reader down. The goal is calm, not clutter.",
    ],
  },
  {
    id: "02",
    title: "A simple system for thoughtful newsletters",
    excerpt:
      "Build a sustainable writing cadence with a repeatable workflow and an editor's mindset.",
    category: "Writing",
    date: "Aug 28, 2024",
    readTime: "5 min read",
    image: "/journal.svg",
    imageAlt: "Minimal journal icon with a bookmark",
    content: [
      "Consistency comes from making writing small enough to be daily. I keep a running list of ideas and batch edit on Fridays.",
      "An editorial checklist keeps the voice steady: open with context, share one insight, close with an invitation.",
      "Readers return when they trust the rhythm. Keep the structure familiar and the insights fresh.",
    ],
  },
  {
    id: "03",
    title: "Designing spaces for deep work",
    excerpt:
      "How to shape a focused workspace with light, texture, and intentional tools.",
    category: "Lifestyle",
    date: "Jul 10, 2024",
    readTime: "7 min read",
    image: "/desk.svg",
    imageAlt: "Minimal desk setup with a lamp",
    content: [
      "Deep work thrives on rituals. I start by clearing my desk, softening the light, and setting one objective for the session.",
      "Analog tools help me slow down. A notebook nearby keeps the digital sprawl in check.",
      "Design your space like a gallery: only the objects that support the work deserve a place.",
    ],
  },
  {
    id: "04",
    title: "Moodboards as a daily practice",
    excerpt:
      "Collecting visual references can help you make sharper creative decisions.",
    category: "Design",
    date: "Jun 18, 2024",
    readTime: "4 min read",
    image: "/gallery.svg",
    imageAlt: "Stack of minimal picture frames",
    content: [
      "A daily moodboard keeps me aware of visual patterns I love. It could be a color pairing, a layout, or a single photograph.",
      "The key is to keep it lightweight: one board, one week, and a short note on why each image matters.",
      "Over time the collection becomes a personal compass for creative direction.",
    ],
  },
];
