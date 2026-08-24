import { fireEvent, render, screen } from "@testing-library/react";
import { About } from "./About";

const aboutData = {
  hero: { title: "About Sankalp", tagline: "Compassion. Care. Commitment.", description: ["Every child deserves the opportunity to reach their full potential."] },
  story: { title: "Our Story", description: ["Supporting families at every step."] },
  mission: { title: "Our Mission", description: "Empower children and support families." },
  vision: { title: "Our Vision", description: "A trusted center of excellence." },
  values: { title: "Our Values", items: ["Compassion", "Excellence"] },
  specialist: { sectionTitle: "Meet Our Specialist", name: "Dr. Priyanka Sharnat", designation: "Pediatric Physiotherapist", qualifications: ["MPT (Pediatrics)"] },
  approach: { title: "Our Approach", steps: [{ title: "Assessment", description: "Understanding your child's needs" }], summary: "A step-by-step approach for meaningful progress." },
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: aboutData }),
  } as Response);
});

test("renders the About page content returned by the API", async () => {
  render(<About />);

  expect(await screen.findByRole("heading", { name: "About Sankalp" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Our Story" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Meet Our Specialist" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Our Approach" })).toBeInTheDocument();
  const purposeButton = screen.getByRole("button", { name: "Show Our Mission details" });
  const purposeCard = purposeButton.closest("article");
  fireEvent.mouseEnter(purposeCard as HTMLElement);
  expect(purposeCard).toHaveClass("is-flipped");
  fireEvent.mouseLeave(purposeCard as HTMLElement);
  expect(purposeCard).not.toHaveClass("is-flipped");
});
