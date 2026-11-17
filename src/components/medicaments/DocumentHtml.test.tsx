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
  it("materializes the unique source anchors without changing the first legacy anchor", () => {
    const { container } = render(<DocumentHtml contentHtml={'<h2 id="legacy" data-block-id="first">Première rubrique</h2><p>Premier texte.</p><h2 id="legacy" data-block-id="second">Deuxième rubrique</h2><p>Deuxième texte.</p><h2 data-block-id="third">Sans ancre</h2><p>Troisième texte.</p>'} />);
    expect(container.querySelector('[data-block-id="first"]')?.id).toBe("legacy");
    expect(container.querySelector('[data-block-id="second"]')?.id).toBe("notice-block-second");
    expect(container.querySelector('[data-block-id="third"]')?.id).toBe("notice-block-third");
    expect(container.querySelectorAll("#legacy")).toHaveLength(1);
  });
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
