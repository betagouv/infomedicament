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

const mockAutocompleteSections = [
  {
    type: "substance",
    title: "Substances actives",
    items: [
      {
        type: "substance",
        label: "Paracétamol",
        href: "/substances/123",
        score: 300,
      },
    ],
  },
  {
    type: "specialite",
    title: "Médicaments",
    items: [
      {
        type: "specialite",
        label: "Doliprane 1000 mg",
        href: "/medicaments/61234567",
        matchReasons: [{ type: "substance", label: "Paracétamol" }],
        score: 5,
      },
    ],
  },
];

// Mock SWR to return our mock autocomplete sections
vi.mock("swr", () => ({
  default: () => ({ data: mockAutocompleteSections }),
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

  it("should navigate to the suggestion href", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "para" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Paracétamol")!;
    fireEvent.mouseDown(option);

    expect(mockPush).toHaveBeenCalledWith("/substances/123");
  });

  it("should navigate to the suggestion href even when onSearch is provided", () => {
    const onSearch = vi.fn();
    renderAutocomplete(onSearch);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "para" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent === "Paracétamol")!;
    fireEvent.mouseDown(option);

    expect(mockPush).toHaveBeenCalledWith("/substances/123");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("should not show dropdown before user types", () => {
    renderAutocomplete();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("should show dropdown options when user types", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    vi.spyOn(input, "getBoundingClientRect").mockReturnValue({
      top: 100,
      bottom: 140,
      left: 30,
      right: 430,
      width: 400,
      height: 40,
      x: 30,
      y: 100,
      toJSON: () => ({}),
    });

    fireEvent.change(input, {
      target: { value: "doli" },
    });
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();
    expect(listbox.parentElement).toBe(document.body);
    expect(listbox.style.position).toBe("fixed");
    expect(listbox.style.top).toBe("140px");
    expect(listbox.style.left).toBe("30px");
    expect(listbox.style.width).toBe("400px");
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("should highlight first option on ArrowDown", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[0].getAttribute("aria-selected")).toBe(
      "true",
    );
  });

  it("should select highlighted option on Enter", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "para" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/substances/123");
  });

  it("should close dropdown on Escape", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });
    expect(screen.getByRole("listbox")).toBeDefined();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("should navigate to the medicament page when selecting a spécialité", () => {
    renderAutocomplete();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent?.includes("Doliprane 1000 mg"))!;
    fireEvent.mouseDown(option);

    expect(mockPush).toHaveBeenCalledWith("/medicaments/61234567");
  });

  it("should navigate to the medicament page for a spécialité even when onSearch is provided", () => {
    const onSearch = vi.fn();
    renderAutocomplete(onSearch);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "doli" } });

    const option = screen
      .getAllByRole("option")
      .find((o) => o.textContent?.includes("Doliprane 1000 mg"))!;
    fireEvent.mouseDown(option);

    expect(mockPush).toHaveBeenCalledWith("/medicaments/61234567");
    expect(onSearch).not.toHaveBeenCalled();
  });

  it("should display sections and match reasons", () => {
    renderAutocomplete();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "para" },
    });

    expect(screen.getByText("Substances actives")).toBeDefined();
    expect(screen.getByText("Médicaments")).toBeDefined();
    expect(screen.getByText("contient Paracétamol")).toBeDefined();
  });
});
