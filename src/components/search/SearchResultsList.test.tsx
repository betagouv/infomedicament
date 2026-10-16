import { fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import SearchResultsList from "./SearchResultsList";
import SearchResultsPagination from "./blocks/SearchResultsPagination";
import type { SearchResultItem } from "@/types/SearchTypes";

vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false }),
}));

function result(index: number): SearchResultItem {
  return {
    specId: String(index),
    specName: `TEST ${index}, comprimé`,
    groupName: `TEST ${index}`,
    composants: "substance",
    subsIds: [],
    subsMainNames: null,
    indicationsIds: [],
    indicationsIdsNames: [],
    atc1Code: undefined,
    atc2Code: undefined,
    atc5Code: undefined,
    ProcId: "NATIONALE",
    StatutBdm: 1,
    isSurveillanceRenforcee: false,
    isAlertPregnancyPlan: false,
    isAlertPregnancyMention: false,
    isAlertPediatricContraindication: false,
    matchReasons: [],
    score: 1,
  };
}

describe("search result rendering", () => {
  it("includes the count and named results in server HTML before effects run", () => {
    const html = renderToString(
      <SearchResultsList resultsList={[result(1)]} search="test" />,
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("h1")?.textContent).toContain("1 résultat");
    expect(
      container.querySelector('a[href="medicaments/1"]')?.textContent,
    ).toContain("Test 1, comprimé");
  });

  it("supports pagination and resets to the first page when filters replace the list", () => {
    const list = Array.from({ length: 51 }, (_, index) => result(index + 1));
    const props = {
      allSubsFilters: [],
      allAtcFilters: [],
      allIndicationsFilters: [],
    };
    const { rerender } = render(
      <SearchResultsPagination {...props} resultsList={list} />,
    );
    expect(
      screen.getByRole("link", { name: /^Test 1\s*, comprimé$/ }),
    ).not.toBeNull();
    fireEvent.click(screen.getByTitle("Page 2"));
    expect(
      screen.getByRole("link", { name: /^Test 51\s*, comprimé$/ }),
    ).not.toBeNull();
    expect(
      screen.queryByRole("link", { name: /^Test 1\s*, comprimé$/ }),
    ).toBeNull();
    rerender(<SearchResultsPagination {...props} resultsList={[result(2)]} />);
    expect(
      screen.getByRole("link", { name: /^Test 2\s*, comprimé$/ }),
    ).not.toBeNull();
  });
});

it("sorts advanced results by full name and reverses them", () => {
  const results = [
    { ...result(2), groupName: "TEST", specName: "TEST B", score: 100 },
    { ...result(1), groupName: "TEST", specName: "TEST A", score: 0 },
  ];
  render(<SearchResultsList advanced resultsList={results} />);
  const names = () =>
    screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("medicaments/"))
      .map((link) => link.textContent?.trim());
  expect(names()).toEqual(["Test A", "Test B"]);
  fireEvent.click(screen.getAllByTitle("Trier par ordre décroissant").at(-1)!);
  expect(names()).toEqual(["Test B", "Test A"]);
});

it("preserves the selected substance and matching medicines when changing sort", () => {
  const results = [
    { ...result(2), composants: "included", subsIds: ["1"], score: 10 },
    { ...result(1), composants: "included", subsIds: ["1"], score: 1 },
    { ...result(3), composants: "excluded", subsIds: ["2"], score: 20 },
  ];
  render(<SearchResultsList resultsList={results} search="test" />);
  const substanceFilters = () =>
    screen.getAllByRole("checkbox", { name: "included (2)" });
  fireEvent.click(substanceFilters().at(-1)!);
  const medicineLinks = () =>
    screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href) => href?.startsWith("medicaments/"));
  expect(medicineLinks()).toEqual(["medicaments/2", "medicaments/1"]);

  fireEvent.click(
    screen.getAllByRole("button", { name: "ordre alphabétique" }).at(-1)!,
  );
  expect(medicineLinks()).toEqual(["medicaments/1", "medicaments/2"]);
  expect(
    substanceFilters().every((input) => (input as HTMLInputElement).checked),
  ).toBe(true);
  expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
    "2 résultats",
  );

  fireEvent.click(
    screen.getAllByRole("button", { name: "pertinence" }).at(-1)!,
  );
  expect(medicineLinks()).toEqual(["medicaments/2", "medicaments/1"]);
  expect(
    substanceFilters().every((input) => (input as HTMLInputElement).checked),
  ).toBe(true);
});
