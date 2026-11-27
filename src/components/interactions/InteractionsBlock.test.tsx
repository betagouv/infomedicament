import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import InteractionsBlock from "./InteractionsBlock";
import type { InteractionsSearchEntry } from "@/db/types";

const navigation = vi.hoisted(() => ({ push: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigation.push }),
  usePathname: () => "/interactions",
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("@codegouvfr/react-dsfr/Accordion", () => ({ default: () => null }));
vi.mock("@/components/InteractionSubstanceInput", () => ({
  default: ({
    id,
    value,
    onSelect,
    onClear,
  }: {
    id: string;
    value: InteractionsSearchEntry | null;
    onSelect: (entry: InteractionsSearchEntry) => void;
    onClear: () => void;
  }) => (
    <div>
      <span data-testid={id}>{value?.label}</span>
      <button
        onClick={() =>
          onSelect({
            id: 3,
            label: "C + D",
            type: "medicament",
            subst_ids: ["c"],
            class_ids: [],
          })
        }
      >
        Select {id}
      </button>
      <button onClick={onClear}>Clear {id}</button>
    </div>
  ),
}));

const slot1: InteractionsSearchEntry = {
  id: 1,
  type: "medicament",
  label: "A",
  subst_ids: ["a"],
  class_ids: [],
};
const slot2: InteractionsSearchEntry = {
  id: 2,
  type: "substance",
  label: "B",
  subst_ids: ["b"],
  class_ids: [],
};

beforeEach(() => {
  navigation.push.mockReset();
  navigation.query =
    "medicament1=medicament%3AA&medicament2=substance%3AB&verifier=1&source=test";
});

it("updates a selected medicine in the URL and invalidates the previous checked result", async () => {
  render(<InteractionsBlock slot1={slot1} slot2={slot2} results={[]} />);
  fireEvent.click(screen.getByText("Select interaction-slot-1"));
  await waitFor(() => expect(navigation.push).toHaveBeenCalled());
  const [url, options] = navigation.push.mock.calls[0];
  const params = new URL(url, "https://example.test").searchParams;
  expect(params.get("medicament1")).toBe("medicament:C + D");
  expect(params.get("medicament2")).toBe("substance:B");
  expect(params.has("verifier")).toBe(false);
  expect(params.get("source")).toBe("test");
  expect(options).toEqual({ scroll: false });
});

it("records verification and clears both selections from the URL", async () => {
  navigation.query =
    "medicament1=medicament%3AA&medicament2=substance%3AB&source=test";
  render(<InteractionsBlock slot1={slot1} slot2={slot2} results={null} />);
  fireEvent.click(screen.getByText("Vérifier"));
  await waitFor(() => expect(navigation.push).toHaveBeenCalled());
  expect(
    new URL(
      navigation.push.mock.calls[0][0],
      "https://example.test",
    ).searchParams.get("verifier"),
  ).toBe("1");
  fireEvent.click(screen.getByText("Tout effacer"));
  await waitFor(() =>
    expect(navigation.push).toHaveBeenLastCalledWith(
      "/interactions?source=test",
      { scroll: false },
    ),
  );
});

it("restores selections from updated server props after Back/Forward navigation", () => {
  const { rerender } = render(
    <InteractionsBlock slot1={slot1} slot2={slot2} results={null} />,
  );
  rerender(<InteractionsBlock slot1={null} slot2={slot2} results={null} />);
  expect(screen.getByTestId("interaction-slot-1").textContent).toBe("");
  expect(screen.getByTestId("interaction-slot-2").textContent).toBe("B");
});
