import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomepageSearchTabs from "./HomepageSearchTabs";

vi.mock("@/components/search/autocomplete/AutocompleteSearch", () => ({
  default: () => <div>Recherche déterministe</div>,
}));

vi.mock("@/components/search/QuestionSearchForm", () => ({
  default: () => <div>Formulaire de question</div>,
}));

describe("HomepageSearchTabs", () => {
  it("starts with deterministic search and switches to the question form", () => {
    render(<HomepageSearchTabs />);

    const searchTab = screen.getByRole("tab", { name: "Rechercher" });
    const questionTab = screen.getByRole("tab", { name: "Poser une question" });
    expect(searchTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(questionTab);

    expect(questionTab.getAttribute("aria-selected")).toBe("true");
    expect(searchTab.getAttribute("aria-selected")).toBe("false");
    expect(screen.getByText("Formulaire de question").closest("[role=tabpanel]")?.className).toContain("fr-tabs__panel--selected");
  });
});
