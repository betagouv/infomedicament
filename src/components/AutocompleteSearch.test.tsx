import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AutocompleteSearchInput } from "./AutocompleteSearch";

// mock router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// mock tracker
vi.mock("@/services/tracking", () => ({
  trackSearchEvent: vi.fn(),
}));

const mockSearchResults = [
  {
    groupName: "DOLIPRANE",
    composants: "paracetamol",
    specialites: [],
    pathosCodes: [],
    CISList: [],
    subsIds: [],
    matchReasons: [],
    resumeSpecialites: [],
  },
];

// Mock SWR to return our mock search results
vi.mock("swr", () => ({
  default: () => ({ data: mockSearchResults }),
}));

describe("AutocompleteSearchInput", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  function renderAutocomplete(onSearch?: (s: string) => void) {
    return render(
      <AutocompleteSearchInput
        id="test-search"
        name="s"
        placeholder="Rechercher"
        type="search"
        onSearch={onSearch}
      />,
    );
  }

  it("should navigate to search page when selecting a group name", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "dolip" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Doliprane")!;
    fireEvent.click(option);

    expect(mockPush).toHaveBeenCalledWith("/rechercher?s=Doliprane");
  });

  it("should call onSearch for group name when onSearch is provided", () => {
    const onSearch = vi.fn();
    renderAutocomplete(onSearch);
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "dolip" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Doliprane")!;
    fireEvent.click(option);

    expect(onSearch).toHaveBeenCalledWith("Doliprane");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
