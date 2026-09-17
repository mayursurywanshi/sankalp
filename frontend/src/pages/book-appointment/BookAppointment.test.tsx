import { fireEvent, render, screen } from "@testing-library/react";
import { BookAppointment } from "./BookAppointment";

const response = {
  success: true,
  data: {
    hero: { title: "Book an Appointment", tagline: "A brighter tomorrow." },
    help: {
      title: "We’re Here to Help",
      steps: [
        { title: "Share Basic Details", description: "Tell us about you." },
      ],
    },
    clinicHours: { weekdays: "Monday–Saturday", sunday: "Sunday: Closed" },
    phone: "+91 76201 49613",
    email: "info@sankalp.com",
    timeSlots: ["10:00 AM"],
    consentLabel: "I consent to be contacted.",
    successMessage: "Request received.",
  },
};

beforeEach(() => {
  global.fetch = vi
    .fn()
    .mockResolvedValue({ ok: true, json: async () => response } as Response);
});

test("loads appointment content and renders the request form without service or message fields", async () => {
  render(<BookAppointment />);
  expect(
    await screen.findByRole("heading", { name: "Book an Appointment" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Parent Name")).toBeInTheDocument();
  expect(screen.queryByText("Preferred Time")).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/service/i)).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/message/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Parent Name"), {
    target: { value: "Mayur Patil" },
  });
  expect(screen.getByLabelText("Parent Name")).toHaveValue("Mayur Patil");
  expect(global.fetch).toHaveBeenCalledWith(
    "http://127.0.0.1:5000/api/appointments-request",
  );
});
