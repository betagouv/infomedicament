import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import KeyboardSkipLinks from "./KeyboardSkipLinks";

it("offers content first and focuses the page search field", () => {
  render(
    <>
      <KeyboardSkipLinks />
      <main id="main-content" tabIndex={-1}>
        <div id="search">
          <input aria-label="Recherche" />
        </div>
      </main>
    </>,
  );

  expect(screen.getAllByRole("link")[0].getAttribute("href")).toBe(
    "#main-content",
  );
  fireEvent.click(screen.getByRole("link", { name: "Accéder à la recherche" }));
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
});

it("focuses the first advanced search criterion", () => {
  render(
    <>
      <KeyboardSkipLinks />
      <input id="search" aria-label="Nom de la spécialité" />
    </>,
  );

  fireEvent.click(screen.getByRole("link", { name: "Accéder à la recherche" }));
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
});

it("opens the mobile header search before focusing its field", () => {
  const openSearch = vi.fn();
  render(
    <>
      <KeyboardSkipLinks />
      <button id="fr-header-search-button" onClick={openSearch}>
        Ouvrir la recherche
      </button>
      <div className="fr-header__search">
        <div id="search">
          <input aria-label="Recherche" />
        </div>
      </div>
    </>,
  );
  const button = screen.getByRole("button");
  vi.spyOn(button, "getClientRects").mockReturnValue([
    new DOMRect(),
  ] as unknown as DOMRectList);
  const frames: FrameRequestCallback[] = [];
  const animationFrame = vi
    .spyOn(window, "requestAnimationFrame")
    .mockImplementation((callback) => frames.push(callback));

  fireEvent.click(screen.getByRole("link", { name: "Accéder à la recherche" }));
  expect(openSearch).toHaveBeenCalledOnce();
  frames.forEach((callback) => callback(0));
  expect(document.activeElement).toBe(screen.getByRole("textbox"));
  animationFrame.mockRestore();
});
