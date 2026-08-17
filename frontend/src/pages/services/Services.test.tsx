import { render, screen } from "@testing-library/react";
import { Services } from "./Services";

const servicesResponse = {
  success: true,
  data: {
    hero: { title: "Our Services", description: "Care for every child." },
    services: [
      { id: "pediatric-physiotherapy", title: "Pediatric Physiotherapy", description: "Movement support.", color: "teal" },
      { id: "gait-training", title: "Gait Training", description: "Walking support.", color: "purple" },
    ],
    callToAction: {
      title: "Need help choosing?",
      description: "Talk to our specialist.",
      buttonLabel: "Book an Appointment",
      buttonHref: "/appointment",
    },
  },
};

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => servicesResponse,
  });
});

test("loads and renders services from the API", async () => {
  render(<Services />);

  expect(await screen.findByRole("heading", { name: "Our Services" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Pediatric Physiotherapy" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Gait Training" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Book an Appointment" })).toHaveAttribute("href", "/appointment");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/services");
});
