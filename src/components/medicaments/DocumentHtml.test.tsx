import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentHtml from "./DocumentHtml";

const { getDefinitionModalAndUpdateGlossary, open } = vi.hoisted(() => {
  const open = vi.fn();
  return {
    open,
    getDefinitionModalAndUpdateGlossary: vi.fn(() => ({ open })),
  };
});

vi.mock("@/components/glossary/GlossaryContextProvider", async () => {
  const { createContext } = await import("react");
  return {
    GlossaryContext: createContext({
      definitions: [],
      getDefinitionModalAndUpdateGlossary,
    }),
  };
});

const definition = {
  nom: "Pharmacovigilance",
  definition: "Surveillance des effets indésirables.",
  source: "BDPM",
  a_souligner: true,
};

describe("DocumentHtml", () => {
  it("opens a definition modal through delegated pointer and keyboard events", async () => {
    render(
      <DocumentHtml
        contentHtml={`<p><span data-definition="Pharmacovigilance"><em>pharmacovigilance</em></span></p>`}
        definitions={[definition]}
      />,
    );

    const term = screen.getByText("pharmacovigilance").closest<HTMLElement>("[data-definition]");
    expect(term).not.toBeNull();
    await waitFor(() => expect(term?.getAttribute("role")).toBe("button"));
    expect(term?.getAttribute("tabindex")).toBe("0");
    expect(term?.getAttribute("aria-haspopup")).toBe("dialog");
    fireEvent.click(screen.getByText("pharmacovigilance"));
    expect(open).toHaveBeenCalledOnce();

    fireEvent.keyDown(term!, { key: "Enter" });
    expect(open).toHaveBeenCalledTimes(2);
  });
});
