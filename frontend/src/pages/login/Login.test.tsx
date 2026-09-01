import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      message: "Welcome back!",
      data: { id: "admin-id", loginId: "Admin.Sankalp", fullName: "Sankalp Administrator", role: "ADMIN" },
    }),
  } as Response);
});

test("submits the Admin login form using secure cookie credentials", async () => {
  render(<MemoryRouter><Login /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText("Select Role"), { target: { value: "ADMIN" } });
  fireEvent.change(screen.getByLabelText("Login ID"), { target: { value: "Admin.Sankalp" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Admin@Sankalp" } });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:5000/api/auth/login",
    expect.objectContaining({ method: "POST", credentials: "include" }),
  ));
  expect(await screen.findByText("Welcome back! Sankalp Administrator")).toBeInTheDocument();
});
