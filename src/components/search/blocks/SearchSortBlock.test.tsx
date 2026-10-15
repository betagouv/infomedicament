import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchSortBlock from "./SearchSortBlock";

it("allows only alphabetical sorting in both advanced controls, with reversal", () => {
  const onUpdateSortType = vi.fn();
  const onUpdateIsSortAsc = vi.fn();
  render(
    <SearchSortBlock
      advanced
      onUpdateSortType={onUpdateSortType}
      onUpdateIsSortAsc={onUpdateIsSortAsc}
    />,
  );
  expect(onUpdateSortType).toHaveBeenLastCalledWith("alphabetic");
  expect(screen.queryByText("pertinence")).toBeNull();
  expect(screen.queryByText(/pertinent d'abord/)).toBeNull();
  fireEvent.click(screen.getByTitle("Trier par ordre décroissant"));
  expect(onUpdateIsSortAsc).toHaveBeenLastCalledWith(false);
  fireEvent.click(screen.getByRole("button", { name: "Trier par" }));
  expect(screen.getAllByRole("radio")).toHaveLength(2);
  fireEvent.click(
    screen.getByRole("radio", { name: "Ordre alphabétique de A à Z" }),
  );
  expect(onUpdateIsSortAsc).toHaveBeenLastCalledWith(true);
});

it("retains relevance sorting in simple search", () => {
  const onUpdateSortType = vi.fn();
  render(
    <SearchSortBlock
      onUpdateSortType={onUpdateSortType}
      onUpdateIsSortAsc={vi.fn()}
    />,
  );
  expect(onUpdateSortType).toHaveBeenLastCalledWith("score");
  expect(screen.getByText("pertinence")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Trier par" }));
  expect(screen.getAllByRole("radio")).toHaveLength(4);
});
