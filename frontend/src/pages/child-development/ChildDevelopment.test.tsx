import { fireEvent, render, screen } from "@testing-library/react";
import { ChildDevelopment } from "./ChildDevelopment";

const response = {
  success: true,
  data: {
    hero: { title: "Child Development", tagline: "Support. Nurture. Grow.", description: "Development support for every child." },
    milestones: {
      title: "Developmental Milestones",
      description: "Select an age group.",
      ageGroups: [
        { id: "0-2-years", label: "0–2 Years", title: "0–2 Years", milestones: ["Develops head and trunk control"], guidance: "Early movement provides an important foundation." },
        { id: "2-4-years", label: "2–4 Years", title: "2–4 Years", milestones: ["Runs and climbs with improving coordination"], guidance: "Play builds confidence." },
        { id: "4-6-years", label: "4–6 Years", title: "4–6 Years", milestones: ["Hops and balances on one foot"], guidance: "School-readiness develops through play." },
      ],
    },
  },
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => response } as Response);
});

test("loads milestones and changes the selected age group", async () => {
  render(<ChildDevelopment />);
  expect(await screen.findByRole("heading", { name: "Child Development" })).toBeInTheDocument();
  expect(screen.getByText("Develops head and trunk control")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "2–4 Years" }));
  expect(screen.getByText("Runs and climbs with improving coordination")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/child-development");
});
