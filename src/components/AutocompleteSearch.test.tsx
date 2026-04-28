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
    indicationsIds: [],
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
    fireEvent.change(input, { target: { value: "dolip" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Doliprane")!;
    fireEvent.mouseDown(option);

    expect(mockPush).toHaveBeenCalledWith("/rechercher?s=Doliprane");
  });

  it("should call onSearch for group name when onSearch is provided", () => {
    const onSearch = vi.fn();
    renderAutocomplete(onSearch);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "dolip" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Doliprane")!;
    fireEvent.mouseDown(option);

    expect(onSearch).toHaveBeenCalledWith("Doliprane");
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should not show dropdown before user types", () => {
    renderAutocomplete();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("should show dropdown options when user types", () => {
    renderAutocomplete();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "doli" } });
    expect(screen.getByRole("listbox")).toBeDefined();
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("should highlight first option on ArrowDown", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe("true");
  });

  it("should select highlighted option on Enter", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/rechercher?s=Doliprane");
  });

  it("should close dropdown on Escape", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });
    expect(screen.getByRole("listbox")).toBeDefined();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
