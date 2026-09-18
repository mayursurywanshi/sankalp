import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { FeedbackForm } from "./FeedbackForm";

const renderFeedbackPage = () =>
  render(
    <MemoryRouter initialEntries={["/f/AbCdEf123456"]}>
      <Routes>
        <Route path="/f/:token" element={<FeedbackForm />} />
      </Routes>
    </MemoryRouter>,
  );

test("shows the feedback form for an unused link", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      data: {
        status: "AVAILABLE",
        parentName: "Mayur Patil",
        childName: "Aarav Patil",
        expiresAt: "2026-09-19T06:15:00.000Z",
      },
    }),
  } as Response);

  renderFeedbackPage();

  expect(
    await screen.findByRole("heading", { name: /Hello, Mayur Patil/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit Feedback" }),
  ).toBeInTheDocument();
});

test("shows an already-submitted confirmation instead of the form", async () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      message: "Your feedback is already submitted.",
      data: { status: "SUBMITTED" },
    }),
  } as Response);

  renderFeedbackPage();

  expect(
    await screen.findByRole("heading", {
      name: "Your feedback is already submitted",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Submit Feedback" }),
  ).not.toBeInTheDocument();
});
