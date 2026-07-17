import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db/utils", () => ({
  getSearchResults: vi.fn().mockResolvedValue([]),
  getSynonymSuggestion: vi.fn().mockResolvedValue(["Céphalées"]),
}));

vi.mock("@/components/search/SearchPage", () => ({
  default: ({ synonymTerms }: { synonymTerms: string[] }) => (
    <div>Suggestions : {synonymTerms.join(", ")}</div>
  ),
}));

vi.mock("@/components/rating/RatingToaster", () => ({
  default: () => null,
}));

import { getSynonymSuggestion } from "@/db/utils";
import Page from "./page";

describe("search page", () => {
  it("loads synonym suggestions and passes them to the results page", async () => {
    render(await Page({ searchParams: Promise.resolve({ s: "mal de tête" }) }));

    expect(getSynonymSuggestion).toHaveBeenCalledWith("mal de tête");
    expect(screen.getByText("Suggestions : Céphalées")).not.toBeNull();
  });
});
