import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Login } from "./Login";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      message: "Welcome back!",
      data: {
        accessToken: "a".repeat(64),
        tokenType: "Bearer",
        expiresAt: "2026-09-02T10:30:00.000Z",
        user: { id: "admin-id", loginId: "Admin.Sankalp", fullName: "Sankalp Administrator", role: "ADMIN" },
      },
    }),
  } as Response);
});

test("submits the Admin login form and stores a session Bearer token", async () => {
  render(<MemoryRouter><Login /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText("Select Role"), { target: { value: "ADMIN" } });
  fireEvent.change(screen.getByLabelText("Login ID"), { target: { value: "Admin.Sankalp" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Admin@Sankalp" } });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:5000/api/auth/login",
    expect.objectContaining({ method: "POST" }),
  ));
  expect(await screen.findByText("Welcome back! Sankalp Administrator")).toBeInTheDocument();
  expect(sessionStorage.getItem("sankalp_access_token")).toBe("a".repeat(64));
  expect(localStorage.getItem("sankalp_access_token")).toBeNull();
});
