import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminDoctors } from "./AdminDoctors";

const doctor = {
  doctorId: "DOC000001",
  loginId: "MAYSU3008",
  firstName: "Mayuri",
  lastName: "Suryawanshi",
  phone: "7620149613",
  email: "dr.mayuri@example.com",
  designation: "Pediatric Physiotherapist",
  joiningDate: "15-09-2026",
  dateOfBirth: "30-08-1999",
  credentialStatus: "PENDING",
  isActive: true,
  createdAt: "2026-09-02T10:48:56.471Z",
};

beforeEach(() => {
  sessionStorage.setItem("sankalp_access_token", "test-bearer-token");
  global.fetch = vi.fn()
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, data: [] }) } as Response)
    .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ success: true, message: "Doctor details saved.", data: doctor }) } as Response)
    .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ success: true, message: "Doctor Login ID and password were created successfully.", data: { ...doctor, credentialStatus: "ACTIVE" } }) } as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, data: [{ ...doctor, credentialStatus: "ACTIVE" }] }) } as Response)
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ success: true, message: "Doctor DOC000001 was deleted successfully.", data: { doctorId: "DOC000001" } }) } as Response);
});

test("creates Doctor details, reviews generated IDs, and confirms credentials", async () => {
  render(<MemoryRouter><AdminDoctors /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: /add first doctor/i }));

  fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Mayuri" } });
  fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Suryawanshi" } });
  fireEvent.change(screen.getByLabelText("Phone Number"), { target: { value: "7620149613" } });
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "dr.mayuri@example.com" } });
  fireEvent.change(screen.getByLabelText("Designation"), { target: { value: "Pediatric Physiotherapist" } });
  fireEvent.change(screen.getByLabelText("Joining Date"), { target: { value: "2026-09-15" } });
  fireEvent.change(screen.getByLabelText("Date of Birth"), { target: { value: "1999-08-30" } });
  fireEvent.change(screen.getByLabelText(/Temporary Password/), { target: { value: "Doctor@123" } });
  fireEvent.click(screen.getByRole("button", { name: /create doctor details/i }));

  expect(await screen.findByText("DOC000001")).toBeInTheDocument();
  expect(screen.getByText("MAYSU3008")).toBeInTheDocument();
  expect(global.fetch).toHaveBeenNthCalledWith(2, "http://localhost:5000/api/admin/doctors", expect.objectContaining({
    method: "POST",
    body: expect.stringContaining('"joiningDate":"15-09-2026"'),
  }));

  fireEvent.click(screen.getByRole("button", { name: /confirm & create login/i }));
  await waitFor(() => expect(global.fetch).toHaveBeenNthCalledWith(3, "http://localhost:5000/api/admin/doctors/DOC000001/credentials", expect.objectContaining({
    method: "POST",
    body: JSON.stringify({ password: "Doctor@123", confirm: true }),
  })));
  expect(await screen.findByText("ACTIVE")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
  expect(screen.getByRole("dialog", { name: /delete dr\. mayuri suryawanshi/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Delete Doctor" }));
  await waitFor(() => expect(global.fetch).toHaveBeenNthCalledWith(5, "http://localhost:5000/api/admin/doctors/DOC000001", expect.objectContaining({ method: "DELETE" })));
  expect(await screen.findByText(/deleted successfully/i)).toBeInTheDocument();
}, 10000);
