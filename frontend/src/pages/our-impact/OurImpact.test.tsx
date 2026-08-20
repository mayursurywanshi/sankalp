import { render, screen } from "@testing-library/react";
import { OurImpact } from "./OurImpact";

const response = { success: true, data: {
  hero: { title: "Our Impact", tagline: "Real Journeys. Meaningful Progress.", description: "Every journey matters." },
  statistics: [{ id: "children-supported", value: "1,250+", label: "Children Supported", description: "Across diverse needs" }],
  featuredStory: { id: "aarav", imageKey: "featured-aarav", childName: "Aarav", age: "3 years", title: "From First Steps to Confident Walking", summary: "Progress story.", highlights: ["Independent walking"], buttonLabel: "Read Story", buttonHref: "/story" },
  successStories: [{ id: "vihaan", imageKey: "vihaan", childName: "Vihaan", age: "5 years", title: "Motor Skills", summary: "Progress.", buttonLabel: "Read Story", buttonHref: "/story" }],
  testimonials: { title: "What Parents Say", subtitle: "Their words", items: [{ id: "parent", rating: 5, quote: "Wonderful support.", parentName: "Parent", relation: "Mother" }] },
  videoTestimonials: { title: "Video Testimonials", items: [{ id: "video", title: "Family Experience", thumbnailKey: "anaya-family", videoUrl: "#video" }] },
} };

beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response } as Response); });

test("loads and renders the Our Impact API content", async () => {
  render(<OurImpact />);
  expect(await screen.findByRole("heading", { name: "Our Impact" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "From First Steps to Confident Walking" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "What Parents Say" })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/our-impact");
});
