import { fireEvent, render, screen } from "@testing-library/react";
import { Services } from "./Services";

const servicesResponse = {
  success: true,
  data: {
    hero: { title: "Our Services", description: "Care for every child." },
    services: [
      { id: "pediatric-physiotherapy", title: "Pediatric Physiotherapy", description: "Movement support.", color: "teal" },
      { id: "gait-training", title: "Gait Training", description: "Walking support.", color: "purple" },
    ],
  },
};

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => servicesResponse,
  });
});

test("loads and renders services from the API", async () => {
  render(<Services />);

  expect(await screen.findByRole("heading", { name: "Our Services" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Pediatric Physiotherapy" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Gait Training" })).toBeInTheDocument();
  const serviceButton = screen.getByRole("button", { name: /Pediatric Physiotherapy\. Show details/i });
  const serviceCard = serviceButton.closest("article");
  expect(serviceCard).not.toHaveClass("is-flipped");
  fireEvent.mouseEnter(serviceCard as HTMLElement);
  expect(serviceCard).toHaveClass("is-flipped");
  fireEvent.mouseLeave(serviceCard as HTMLElement);
  expect(serviceCard).not.toHaveClass("is-flipped");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/services");
});
