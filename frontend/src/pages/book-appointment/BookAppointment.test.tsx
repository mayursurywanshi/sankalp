import { fireEvent, render, screen } from "@testing-library/react";
import { BookAppointment } from "./BookAppointment";

const response = { success: true, data: {
  hero: { title: "Book an Appointment", tagline: "A brighter tomorrow." },
  help: { title: "We’re Here to Help", steps: [{ title: "Share Basic Details", description: "Tell us about you." }] },
  clinicHours: { weekdays: "Monday–Saturday", sunday: "Sunday: Closed" },
  phone: "+91 76201 49613", email: "info@sankalp.com", timeSlots: ["10:00 AM"],
  consentLabel: "I consent to be contacted.", successMessage: "Request received.",
} };

beforeEach(() => { global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => response } as Response); });

test("loads appointment content and renders the request form without service or message fields", async () => {
  render(<BookAppointment />);
  expect(await screen.findByRole("heading", { name: "Book an Appointment" })).toBeInTheDocument();
  expect(screen.getByLabelText("Parent Name")).toBeInTheDocument();
  const timeTrigger = screen.getByRole("button", { name: /Preferred Time Select time slot/i });
  expect(timeTrigger).toBeInTheDocument();
  expect(screen.queryByLabelText(/service/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Parent Name"), { target: { value: "Mayur Patil" } });
  expect(screen.getByLabelText("Parent Name")).toHaveValue("Mayur Patil");
  fireEvent.click(timeTrigger);
  fireEvent.click(screen.getByRole("button", { name: "10 o'clock" }));
  fireEvent.click(screen.getByRole("button", { name: "00 minutes" }));
  fireEvent.click(screen.getByRole("button", { name: "Select" }));
  expect(screen.getByRole("button", { name: /Preferred Time 10:00 AM/i })).toBeInTheDocument();
  expect(global.fetch).toHaveBeenCalledWith("http://localhost:5000/api/appointments-request");
});
