import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ShareButtons from "./ShareButtons";

vi.mock("@/services/tracking", () => ({ trackEvent: vi.fn() }));
afterEach(() => vi.restoreAllMocks());

it("copies the current URL after navigation, including query and hash", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  window.history.replaceState({}, "", "/first");
  render(<ShareButtons pageName="Page" />);
  window.history.replaceState({}, "", "/second?search=a%26b#section");
  fireEvent.click(
    screen.getByRole("button", { name: "Copier dans le presse-papier" }),
  );
  expect(writeText).toHaveBeenCalledWith(window.location.href);
  expect(await screen.findByText("Lien copié")).not.toBeNull();
});
