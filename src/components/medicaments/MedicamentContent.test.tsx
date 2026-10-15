import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MedicamentContent from "./MedicamentContent";
import type { MedicamentData } from "./MedicamentData";

vi.mock("@/services/tracking", () => ({ trackEvent: vi.fn() }));
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false }),
}));

describe("medicine loading", () => {
  it("keeps the title, question controls and typed query mounted while details resolve", async () => {
    let resolveData!: (value: MedicamentData) => void;
    const data = new Promise<MedicamentData>((resolve) => {
      resolveData = resolve;
    });

    await act(async () => {
      render(
        <MedicamentContent
          title="Médicament de test"
          data={data}
          atcList={[]}
          composants={[]}
          delivrance={[]}
          presentations={[]}
        />,
      );
    });

    expect(
      screen.getByRole("heading", { name: "Médicament de test" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Notice complète" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("status", { name: "Chargement de la notice" }),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("button", { pressed: false }).length,
    ).toBeGreaterThan(0);
    const input = screen.getAllByLabelText(
      "Rechercher dans la notice",
    )[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: "effets indésirables" } });

    await act(async () => {
      resolveData({
        definitions: [],
        indications: [],
        articles: [],
        stocks: [],
        isPrinceps: false,
        isGeneric: false,
        isPregnancyMentionAlert: false,
      });
    });

    expect(
      screen.queryByRole("status", { name: "Chargement de la notice" }),
    ).toBeNull();
    expect(screen.getAllByLabelText("Rechercher dans la notice")[0]).toBe(
      input,
    );
    expect(input.value).toBe("effets indésirables");
    expect(
      screen.getByText("La notice n’est pas disponible pour ce médicament."),
    ).not.toBeNull();
  });
});
