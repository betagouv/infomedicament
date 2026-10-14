import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DataBlockGenericIcons from "./DataBlockGenericIcons";
import MedicamentContentHeaderBlock from "../medicaments/blocks/MedicamentContentHeaderBlock";
import type { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { getAvailabilityWarning } from "@/utils/specialites";

vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children }: React.PropsWithChildren) => (
    <section>{children}</section>
  ),
}));

const specialite: DetailedSpecialite = {
  SpecId: "99999111",
  SpecDenom01: "TEST",
  ProcId: "NATIONALE",
  StatutBdm: 2,
  Een: null,
  StatId: null,
  SpecDateAMM: null,
  SpecStatDate: null,
  statutAutorisation: null,
  statutComm: null,
  titulairesList: null,
  genericGroupCode: null,
  referenceSpecialite: null,
};

it.each([
  [
    "INDISPONIBLE",
    "Ce médicament n'est plus disponible sur le marché.",
    "error",
    "var(--text-default-error)",
  ],
  [
    "PARTIELLE",
    "Ce médicament ne sera bientôt plus disponible sur le marché.",
    "info",
    "var(--text-action-high-blue-france)",
  ],
] as const)(
  "uses consistent icons and page alerts for %s",
  (availability, title, severity, color) => {
    const medicine = { ...specialite, availability };
    const { container } = render(
      <>
        <DataBlockGenericIcons specialite={medicine} />
        <MedicamentContentHeaderBlock
          specialite={medicine}
          pregnancyPlanAlert={undefined}
          isPregnancyMentionAlert={false}
          pediatrics={undefined}
        />
      </>,
    );
    expect(screen.getAllByText(title)).toHaveLength(2);
    expect(
      (container.querySelector(".fr-icon-close-circle-line") as HTMLElement)
        .style.color,
    ).toBe(color);
    expect(container.querySelector(`.fr-alert--${severity}`)).not.toBeNull();
  },
);

it("preserves legacy summary warnings and does not confuse safety alerts with unavailability", () => {
  expect(getAvailabilityWarning(specialite)?.severity).toBe("info");
  expect(
    getAvailabilityWarning({
      ...specialite,
      availability: "DISPONIBLE",
      StatutBdm: 1,
    }),
  ).toBeNull();
  expect(
    getAvailabilityWarning({
      ...specialite,
      availability: "ALERTE",
      StatutBdm: 3,
    }),
  ).toBeNull();
  expect(
    getAvailabilityWarning({ ...specialite, availability: null, StatutBdm: 1 }),
  ).toBeNull();
});
