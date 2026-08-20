import { fireEvent, render, screen } from "@testing-library/react";
import { Contact } from "./Contact";

const response = { success: true, data: {
  hero: { title: "Get in Touch", description: "We are here to help you." },
  details: [{ id: "phone", label: "Phone", value: "+91 76201 49613", href: "tel:+917620149613" }],
  form: { title: "Send us a Message", successMessage: "Thank you." },
  map: { embedUrl: "https://www.google.com/maps/embed?pb=test", label: "Sankalp Clinic", directionsUrl: "https://www.google.com/maps/search/?api=1&query=Sankalp" },
} };

beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response } as Response); });

test("loads Contact content and displays its message form and map", async () => {
  render(<Contact />);
  expect(await screen.findByRole("heading", { name: "Get in Touch" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send Message" })).toBeInTheDocument();
  expect(screen.getByText("0/900 characters")).toBeInTheDocument();
  expect(screen.getByTitle("Location of Sankalp Clinic")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "See On Map" })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=Sankalp");
  fireEvent.change(screen.getByLabelText("Your Name"), { target: { value: "Mayur Patil" } });
  expect(screen.getByLabelText("Your Name")).toHaveValue("Mayur Patil");
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/contact");
});
