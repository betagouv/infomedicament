import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SWRConfig } from "swr";
import { AutocompleteSearchInput } from "./AutocompleteSearch";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/services/tracking", () => ({ trackSearchEvent: vi.fn() }));

const suggestions = [{
  type: "substance",
  title: "Substances actives",
  highestScore: 1,
  items: [{ type: "substance", label: "Paracétamol", href: "/substances/123", score: 1 }],
}];

describe("autocomplete requests", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(suggestions)));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function renderInput() {
    return render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <AutocompleteSearchInput id="search" name="s" placeholder="Rechercher" type="search" />
      </SWRConfig>,
    );
  }

  function type(value: string) {
    fireEvent.change(screen.getByRole("combobox"), { target: { value } });
  }

  async function advance(milliseconds: number) {
    await act(async () => { await vi.advanceTimersByTimeAsync(milliseconds); });
  }

  it("waits until typing stops and only requests the final query", async () => {
    renderInput();
    expect(fetchMock).not.toHaveBeenCalled();
    type("p");
    await advance(200);
    type("pa");
    await advance(200);
    type("para");
    expect((screen.getByRole("combobox") as HTMLInputElement).value).toBe("para");
    await advance(299);
    expect(fetchMock).not.toHaveBeenCalled();
    await advance(1);
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/rechercher/autocomplete?s=para");
    expect(screen.getByRole("option").textContent).toBe("Paracétamol");
  });

  it("does not request a cleared or whitespace-only query", async () => {
    renderInput();
    type("para");
    await advance(100);
    type("   ");
    await advance(500);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("cancels pending debounce work on unmount", async () => {
    const view = renderInput();
    type("para");
    view.unmount();
    await advance(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["JSON HTTP error", () => new Response(JSON.stringify({ error: "Unavailable" }), { status: 500 })],
    ["plain-text rate limit", () => new Response("Too Many Requests", { status: 429 })],
    ["invalid JSON", () => new Response("invalid")],
    ["invalid payload", () => new Response(JSON.stringify({ error: "Unavailable" }))],
    ["invalid section", () => new Response(JSON.stringify([{ title: "Invalid", items: null }]))],
    ["missing score", () => new Response(JSON.stringify([{
      ...suggestions[0],
      items: [{ type: "substance", label: "Paracétamol", href: "/substances/123" }],
    }]))],
    ["invalid category", () => new Response(JSON.stringify([{
      ...suggestions[0], type: "unknown",
    }]))],
  ])("handles %s without breaking search and recovers on a new query", async (_, response) => {
    fetchMock.mockImplementationOnce(async () => response());
    renderInput();
    type("para");
    await advance(300);
    expect(screen.getByRole("status").textContent).toContain("Vous pouvez lancer votre recherche");
    expect(screen.queryByRole("listbox")).toBeNull();
    // Empty suggestions must not turn keyboard selection into a crash.
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    await advance(60_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    type("paracetamol");
    await advance(300);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("option").textContent).toBe("Paracétamol");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
