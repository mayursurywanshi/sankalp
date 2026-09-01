import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { title: "Welcome to Sankalp", description: "Compassionate care for every child." } }),
  } as Response);
});

test("renders the Sankalp home page", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /reach their full potential/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /why choose sankalp/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /is your child facing these challenges/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /when should parents seek guidance/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /what happens during the first visit/i })).toBeInTheDocument();
  const firstVisitButton = screen.getByRole("button", { name: /Friendly Conversation\. Show details/i });
  const firstVisitCard = firstVisitButton.closest("article");
  fireEvent.mouseEnter(firstVisitCard as HTMLElement);
  expect(firstVisitCard).toHaveClass("is-flipped");
  fireEvent.mouseLeave(firstVisitCard as HTMLElement);
  expect(firstVisitCard).not.toHaveClass("is-flipped");
  expect(screen.getAllByRole("link", { name: /book appointment/i })).toHaveLength(2);
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  expect(screen.getByText("Empowering little minds. Enriching young lives.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "info@sankalp.com" })).toHaveAttribute("href", "mailto:info@sankalp.com");
  const featureButton = screen.getByRole("button", { name: /Expert Care\. Show more/i });
  const featureCard = featureButton.closest("article");
  fireEvent.mouseEnter(featureCard as HTMLElement);
  expect(featureCard).toHaveClass("is-flipped");
  fireEvent.mouseLeave(featureCard as HTMLElement);
  expect(featureCard).not.toHaveClass("is-flipped");
  expect(await screen.findByText("Compassionate care for every child.")).toBeInTheDocument();
});
