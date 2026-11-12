import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentHtml from "./DocumentHtml";

import { GlossaryContext } from "@/components/glossary/GlossaryContextProvider";
import { prepareGlossaryHtml } from "@/utils/glossaryHtml";

const openDefinition = vi.fn();

const definition = {
  nom: "Pharmacovigilance",
  definition: "Surveillance des effets indésirables.",
  source: "BDPM",
  a_souligner: true,
};

describe("DocumentHtml", () => {
  it("opens a definition modal through delegated pointer and keyboard events", async () => {
    render(
      <GlossaryContext.Provider value={{ openDefinition }}>
        <DocumentHtml
          contentHtml={prepareGlossaryHtml(
            `<p><span data-definition="Pharmacovigilance"><em>pharmacovigilance</em></span></p>`,
            [definition],
          )}
          definitions={[definition]}
        />
      </GlossaryContext.Provider>,
    );

    const term = screen
      .getByText("pharmacovigilance")
      .closest<HTMLElement>("[data-definition]");
    expect(term).not.toBeNull();
    expect(term?.getAttribute("role")).toBe("button");
    expect(term?.getAttribute("tabindex")).toBe("0");
    expect(term?.getAttribute("aria-haspopup")).toBe("dialog");
    fireEvent.click(screen.getByText("pharmacovigilance"));
    expect(openDefinition).toHaveBeenCalledOnce();

    fireEvent.keyDown(term!, { key: "Enter" });
    expect(openDefinition).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(term!, { key: " " });
    expect(openDefinition).toHaveBeenCalledTimes(3);
    expect(openDefinition).toHaveBeenLastCalledWith(definition, term);
  });
});
