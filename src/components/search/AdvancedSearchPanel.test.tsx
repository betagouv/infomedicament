import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AdvancedSearchPanel from "./AdvancedSearchPanel";
import { initialAdvancedCriteria } from "@/utils/advancedSearch";

it("clears the criteria without submitting the previous draft", () => {
  const onSearch = vi.fn();
  render(
    <AdvancedSearchPanel
      initialCriteria={{ ...initialAdvancedCriteria, specialty: "Doliprane" }}
      onSearch={onSearch}
    />,
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Effacer les critères avancés" }),
  );

  expect(onSearch.mock.calls).toEqual([[initialAdvancedCriteria]]);
  expect(
    screen
      .getAllByRole("textbox")
      .every((input) => (input as HTMLInputElement).value === ""),
  ).toBe(true);
});

it("validates an empty submission locally without navigating", () => {
  const onSearch = vi.fn();
  render(
    <AdvancedSearchPanel
      initialCriteria={initialAdvancedCriteria}
      onSearch={onSearch}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Rechercher" }),
  );
  expect(screen.getByRole("alert").textContent).toContain(
    "au moins un critère",
  );
  expect(onSearch).not.toHaveBeenCalled();
});

it("submits only the criteria, without a submission marker", () => {
  const onSearch = vi.fn();
  const criteria = { ...initialAdvancedCriteria, specialty: "Doliprane" };
  render(
    <AdvancedSearchPanel initialCriteria={criteria} onSearch={onSearch} />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Rechercher" }),
  );
  expect(onSearch.mock.calls).toEqual([[criteria]]);
});
