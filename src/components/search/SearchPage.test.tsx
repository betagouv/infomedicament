import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "./SearchPage";

vi.mock("@/components/search/autocomplete/AutocompleteSearch", () => ({
  default: () => <div>Recherche</div>,
}));

vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/components/search/SearchResultsList", () => ({
  default: () => <div>Résultats</div>,
}));

describe("SearchPage", () => {
  it("shows canonical terms suggested for a synonym search", () => {
    render(
      <SearchPage
        search="mal de tête"
        searchResults={[]}
        synonymTerms={["Céphalées"]}
      />,
    );

    expect(screen.getByText(/Vouliez-vous dire/).textContent).toContain("Céphalées");
  });
});
