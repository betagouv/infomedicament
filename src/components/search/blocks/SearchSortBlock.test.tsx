import { useState } from "react";
import { SortType } from "@/types/SearchTypes";
import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchSortBlock from "./SearchSortBlock";

function ControlledSort({
  advanced = false,
  onUpdateSortType,
  onUpdateIsSortAsc,
}: {
  advanced?: boolean;
  onUpdateSortType: (value: SortType) => void;
  onUpdateIsSortAsc: (value: boolean) => void;
}) {
  const [sortType, setSortType] = useState<SortType>(
    advanced ? "alphabetic" : "score",
  );
  const [isSortAsc, setIsSortAsc] = useState(true);
  return (
    <SearchSortBlock
      advanced={advanced}
      sortType={sortType}
      isSortAsc={isSortAsc}
      onUpdateSortType={(value) => {
        setSortType(value);
        onUpdateSortType(value);
      }}
      onUpdateIsSortAsc={(value) => {
        setIsSortAsc(value);
        onUpdateIsSortAsc(value);
      }}
    />
  );
}

it("allows only alphabetical sorting in both advanced controls, with reversal", () => {
  const onUpdateSortType = vi.fn();
  const onUpdateIsSortAsc = vi.fn();
  render(
    <ControlledSort
      advanced
      onUpdateSortType={onUpdateSortType}
      onUpdateIsSortAsc={onUpdateIsSortAsc}
    />,
  );
  expect(onUpdateSortType).not.toHaveBeenCalled();
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
    <ControlledSort
      onUpdateSortType={onUpdateSortType}
      onUpdateIsSortAsc={vi.fn()}
    />,
  );
  expect(onUpdateSortType).not.toHaveBeenCalled();
  expect(screen.getByText("pertinence")).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Trier par" }));
  expect(screen.getAllByRole("radio")).toHaveLength(4);
});
