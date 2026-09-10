import { fireEvent, render, screen } from "@testing-library/react";
import { OurImpact } from "./OurImpact";

const response = { success: true, data: {
  hero: { title: "Our Impact", tagline: "Real Journeys. Meaningful Progress.", description: "Every journey matters." },
  statistics: [{ id: "children-supported", value: "1,250+", label: "Children Supported", description: "Across diverse needs" }],
  featuredStory: { id: "aarav", imageKey: "featured-aarav", childName: "Aarav", age: "3 years", title: "From First Steps to Confident Walking", summary: "Progress story.", fullStory: ["Aarav's complete progress story."], highlights: ["Independent walking"], buttonLabel: "Read Story", buttonHref: "/story" },
  successStories: [{ id: "vihaan", imageKey: "vihaan", childName: "Vihaan", age: "5 years", title: "Motor Skills", summary: "Progress.", fullStory: ["Vihaan's complete progress story."], buttonLabel: "Read Story", buttonHref: "/story" }],
  testimonials: { title: "What Parents Say", subtitle: "Their words", items: [{ id: "parent", rating: 5, quote: "Wonderful support.", parentName: "Parent", relation: "Mother" }] },
  videoTestimonials: { title: "Video Testimonials", items: [{ id: "video", title: "Family Experience", thumbnailKey: "anaya-family", videoUrl: "#video" }] },
  communityPosts: [
    { id: "new-story", postType: "SUCCESS_STORY", title: "A New Progress Story", story: "Meaningful progress through regular care.", mediaType: "IMAGE", mediaUrl: "http://127.0.0.1:5000/uploads/our-impact/story.webp", publishedAt: "2026-09-10T10:00:00.000Z" },
    { id: "duplicate-story", postType: "SUCCESS_STORY", title: "  A NEW PROGRESS STORY  ", story: "Meaningful   progress through regular care.", mediaType: "IMAGE", mediaUrl: "http://127.0.0.1:5000/uploads/our-impact/duplicate.webp", publishedAt: "2026-09-09T10:00:00.000Z" },
    { id: "new-feedback", postType: "PARENT_FEEDBACK", title: "Family Feedback", story: "We are grateful for the thoughtful support.", mediaType: "VIDEO", mediaUrl: "http://127.0.0.1:5000/uploads/our-impact/feedback.mp4", publishedAt: "2026-09-10T10:00:00.000Z" },
  ],
} };

beforeEach(() => { global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => response } as Response); });

test("loads and renders the Our Impact API content", async () => {
  render(<OurImpact />);
  expect(await screen.findByRole("heading", { name: "Our Impact" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "From First Steps to Confident Walking" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What Parents Say" })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { name: /A New Progress Story/i })).toHaveLength(1);
  expect(screen.getByRole("heading", { name: "Family Feedback" })).toBeInTheDocument();
  expect(screen.getByLabelText("Family Feedback video")).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Read Story" })[0]);
  expect(screen.getByRole("dialog", { name: "From First Steps to Confident Walking" })).toBeInTheDocument();
  expect(screen.getByText("Aarav's complete progress story.")).toBeInTheDocument();
  expect(document.body.style.overflow).toBe("hidden");
  expect(document.documentElement.style.overflow).toBe("hidden");
  fireEvent.keyDown(document, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).toBe("");
  expect(document.documentElement.style.overflow).toBe("");
  expect(global.fetch).toHaveBeenCalledWith("http://127.0.0.1:5000/api/our-impact");
});
