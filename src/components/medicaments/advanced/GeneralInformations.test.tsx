import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FicheInfos } from "@/types/FicheInfoTypes";
import type { DetailedSpecialite } from "@/types/SpecialiteTypes";
import GeneralInformations from "./GeneralInformations";

vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children, id }: React.PropsWithChildren<{ id?: string }>) => (
    <section id={id}>{children}</section>
  ),
}));
vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("../blocks/IndicationsBlock", () => ({ default: () => null }));

const specialite: DetailedSpecialite = {
  SpecId: "63886766",
  SpecDenom01: "ENBREL 10 mg",
  ProcId: "CENTRALISEE",
  StatutBdm: 1,
  Een: null,
  StatId: null,
  SpecDateAMM: null,
  SpecStatDate: null,
  urlCentralise: null,
  statutAutorisation: null,
  statutComm: null,
  titulairesList: null,
  genericGroupCode: null,
  referenceSpecialite: null,
};

const ficheInfos: FicheInfos = {
  listeElements: [
    {
      referenceDosage: "Pour un flacon de poudre",
      composants: [
        {
          NomLib: "étanercept ((MAMMIFERE/HAMSTER/CELLULES CHO))",
          dosage: "10 mg",
          CompNum: 1,
        },
      ],
    },
    { referenceDosage: "Solvant", composants: [] },
  ],
  isSurveillanceRenforcee: false,
};

describe("GeneralInformations composition", () => {
  it("shows a fallback for an element without an active substance", () => {
    render(
      <GeneralInformations
        updateVisiblePart={vi.fn()}
        specialite={specialite}
        composants={[]}
        isPrinceps={false}
        isPregnancyPlanAlert={false}
        isPregnancyMentionAlert={false}
        pediatrics={undefined}
        presentations={[]}
        ficheInfos={ficheInfos}
        delivrance={[]}
        definitions={[]}
        indications={[]}
        stocks={[]}
      />,
    );

    const composition = document.querySelector("#informations-composition");
    expect(composition).not.toBeNull();
    expect(
      within(composition as HTMLElement).getByText("Solvant"),
    ).not.toBeNull();
    expect(
      within(composition as HTMLElement).getByText(/Pas de substance active$/),
    ).not.toBeNull();
    expect(
      screen.queryByText("La composition n'est pas communiquée"),
    ).toBeNull();
  });
});
