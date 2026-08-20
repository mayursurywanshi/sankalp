import { render, screen } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: { title: "Welcome to Sankalp", description: "Compassionate care for every child." } }),
  } as Response);
});

test("renders the Sankalp home page", async () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /reach their full potential/i })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /why choose sankalp/i })).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /book appointment/i })).toHaveLength(2);
  expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  expect(screen.getByText("Empowering little minds. Enriching young lives.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "info@sankalp.com" })).toHaveAttribute("href", "mailto:info@sankalp.com");
  expect(await screen.findByText("Compassionate care for every child.")).toBeInTheDocument();
});
