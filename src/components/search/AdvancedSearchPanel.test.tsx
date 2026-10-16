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
