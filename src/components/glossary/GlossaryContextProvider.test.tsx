import { StrictMode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import GlossaryContextProvider from "./GlossaryContextProvider";
import WithDefinition from "./WithDefinition";
import DocumentHtml from "@/components/medicaments/DocumentHtml";
import { prepareGlossaryHtml } from "@/utils/glossaryHtml";

const first = {
  nom: "Excipient",
  definition: "<p>First definition</p>",
  source: "BDPM",
  a_souligner: true,
};
const second = {
  ...first,
  nom: "Pharmacovigilance",
  definition: "<p>Second definition</p>",
};
const openedContent = vi.fn();

beforeEach(() => {
  openedContent.mockClear();
  vi.stubGlobal("dsfr", (element: HTMLElement) => ({
    modal: {
      disclose: () => {
        openedContent(element.textContent);
        element.setAttribute("open", "");
        element.dispatchEvent(new Event("dsfr.disclose"));
      },
    },
  }));
});
afterEach(() => vi.unstubAllGlobals());

async function closeDialog() {
  const dialog = screen.getByRole("dialog");
  act(() => {
    dialog.removeAttribute("open");
    dialog.dispatchEvent(new Event("dsfr.conceal"));
  });
  // DSFR's conceal callback is delivered asynchronously, before its CSS fade ends.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(screen.queryByRole("dialog")).toBeNull();
}

it("reuses one dialog, commits the correct content before opening, and preserves the URL", async () => {
  const originalUrl = window.location.href;
  render(
    <StrictMode>
      <GlossaryContextProvider>
        <WithDefinition definition={first} word="first term" />
        <WithDefinition definition={second} word="second term" />
      </GlossaryContextProvider>
    </StrictMode>,
  );
  expect(document.querySelectorAll("dialog")).toHaveLength(1);
  expect(screen.queryByRole("dialog")).toBeNull();
  const trigger = screen.getByRole("button", { name: "first term" });
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Excipient" })).not.toBeNull();
  expect(openedContent).toHaveBeenLastCalledWith(
    expect.stringContaining("First definition"),
  );
  await closeDialog();
  expect(document.activeElement).toBe(trigger);
  fireEvent.click(screen.getByRole("button", { name: "second term" }));
  expect(
    screen.getByRole("dialog", { name: "Pharmacovigilance" }),
  ).not.toBeNull();
  expect(openedContent).toHaveBeenLastCalledWith(
    expect.stringContaining("Second definition"),
  );
  expect(screen.queryByText("First definition")).toBeNull();
  expect(document.querySelectorAll("dialog")).toHaveLength(1);
  expect(window.location.href).toBe(originalUrl);
});

it("can reopen the same definition after closing", async () => {
  render(
    <GlossaryContextProvider>
      <WithDefinition definition={first} word="term" />
    </GlossaryContextProvider>,
  );
  const trigger = screen.getByRole("button", { name: "term" });
  fireEvent.click(trigger);
  await closeDialog();
  fireEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Excipient" })).not.toBeNull();
  expect(openedContent).toHaveBeenCalledTimes(2);
});

it("opens terms from injected HTML with the keyboard and returns focus on close", async () => {
  render(
    <GlossaryContextProvider>
      <DocumentHtml
        contentHtml={prepareGlossaryHtml(
          '<span data-definition="Excipient"><em>injected term</em></span>',
          [first],
        )}
        definitions={[first]}
      />
    </GlossaryContextProvider>,
  );
  const trigger = screen.getByRole("button", {
    name: "Voir la définition de injected term",
  });
  fireEvent.keyDown(trigger, { key: " " });
  expect(screen.getByRole("dialog", { name: "Excipient" })).not.toBeNull();
  await closeDialog();
  expect(document.activeElement).toBe(trigger);
});

it("retains the title and content throughout the closing animation", async () => {
  render(
    <GlossaryContextProvider>
      <WithDefinition definition={first} word="term" />
    </GlossaryContextProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "term" }));
  await closeDialog();
  const dialog = document.getElementById("GlossaryDefinition")!;
  expect(dialog.querySelector("h1")?.textContent).toBe("Excipient");
  expect(dialog.textContent).toContain("First definition");
  expect(openedContent).toHaveBeenCalledTimes(1);
});
