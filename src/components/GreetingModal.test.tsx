import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import GreetingModal from "./GreetingModal";

const readiness = vi.hoisted(() => ({
  promise: Promise.resolve(),
  resolve: () => {},
}));
vi.mock("@codegouvfr/react-dsfr/start", () => ({
  get prDsfrLoaded() {
    return readiness.promise;
  },
}));
const open = vi.fn();
const close = vi.fn();
const now = new Date("2026-11-12T12:00:00Z").getTime();
const interval = 30 * 24 * 60 * 60 * 1000;

beforeEach(() => {
  readiness.promise = new Promise<void>((resolve) => {
    readiness.resolve = resolve;
  });
  window.localStorage.clear();
  open.mockClear();
  close.mockClear();
  vi.spyOn(Date, "now").mockReturnValue(now);
  vi.stubGlobal("dsfr", (element: HTMLElement) => ({
    modal: {
      disclose: () => {
        open();
        element.setAttribute("open", "");
      },
      conceal: () => {
        close();
        element.removeAttribute("open");
      },
    },
  }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});
async function ready() {
  await act(async () => readiness.resolve());
}

it("waits for DSFR before opening on a first visit, including Strict Mode", async () => {
  render(
    <StrictMode>
      <GreetingModal dataLastUpdated={null} />
    </StrictMode>,
  );
  expect(open).not.toHaveBeenCalled();
  await ready();
  expect(open).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole("dialog", { name: "Bienvenue sur Info Médicament" }),
  ).not.toBeNull();
});

it.each([now - 1000, now - interval])(
  "does not reopen for a recent acceptance (%s)",
  async (timestamp) => {
    window.localStorage.setItem("greetingModal", JSON.stringify(timestamp));
    render(<GreetingModal dataLastUpdated={null} />);
    await ready();
    expect(open).not.toHaveBeenCalled();
  },
);

it("opens again after more than thirty days", async () => {
  window.localStorage.setItem(
    "greetingModal",
    JSON.stringify(now - interval - 1),
  );
  render(<GreetingModal dataLastUpdated={null} />);
  await ready();
  expect(open).toHaveBeenCalledOnce();
});

it("reads the latest acceptance when DSFR finishes loading", async () => {
  render(<GreetingModal dataLastUpdated={null} />);
  window.localStorage.setItem("greetingModal", JSON.stringify(now));
  await ready();
  expect(open).not.toHaveBeenCalled();
});

it("does not open after unmount while DSFR is still loading", async () => {
  const { unmount } = render(<GreetingModal dataLastUpdated={null} />);
  unmount();
  await ready();
  expect(open).not.toHaveBeenCalled();
});

it("preserves the dialog through rerenders and saves acceptance before closing", async () => {
  const { rerender } = render(<GreetingModal dataLastUpdated={null} />);
  await ready();
  const dialog = screen.getByRole("dialog");
  rerender(
    <GreetingModal dataLastUpdated={new Date("2026-10-01T00:00:00Z")} />,
  );
  expect(screen.getByRole("dialog")).toBe(dialog);
  expect(open).toHaveBeenCalledTimes(1);
  fireEvent.click(
    screen.getByRole("button", { name: "Accepter et entrer sur le site" }),
  );
  expect(window.localStorage.getItem("greetingModal")).toBe(
    JSON.stringify(now),
  );
  expect(close).toHaveBeenCalledOnce();
  expect(document.getElementById("GreetingModal")).toBe(dialog);
});
