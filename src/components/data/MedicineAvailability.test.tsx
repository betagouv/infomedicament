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
  genericGroupName: null,
  referenceSpecialite: null,
};

it.each([
  [
    "INDISPONIBLE",
    "Ce médicament n'est pas disponible actuellement.",
    "info",
    "var(--text-action-high-blue-france)",
  ],
  [
    "PARTIELLE",
    "La disponibilité de ce médicament est limitée.",
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
    expect(
      screen
        .getAllByText(title)
        .filter((element) => !element.closest('[aria-hidden="true"]')),
    ).toHaveLength(2);
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

it("does not describe ambiguous legacy data as an upcoming withdrawal", () => {
  expect(getAvailabilityWarning(specialite)?.title).toBe(
    "La disponibilité de ce médicament est limitée ou interrompue.",
  );
});

it.each([
  ["stopping", "Ce médicament ne sera bientôt plus disponible sur le marché."],
  ["stopped", "Ce médicament n'est plus disponible sur le marché."],
  ["not-marketed", "Ce médicament n'est pas commercialisé actuellement."],
  ["unknown", "Ce médicament n'est pas disponible actuellement."],
] as const)(
  "distinguishes %s from other unavailable medicines",
  (marketingStatus, title) => {
    const medicine = {
      ...specialite,
      availability: "INDISPONIBLE" as const,
      marketingStatus,
    };
    render(
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
    expect(
      screen
        .getAllByText(title)
        .filter((element) => !element.closest('[aria-hidden="true"]')),
    ).toHaveLength(2);
    expect(
      Boolean(
        screen.queryByText(/qui pourra vous orienter vers un autre traitement/),
      ),
    ).toBe(marketingStatus === "stopped" || marketingStatus === "stopping");
  },
);

it("distinguishes an already authorized medicine from one with unknown authorization", () => {
  expect(
    getAvailabilityWarning({
      ...specialite,
      availability: "INDISPONIBLE",
      statutAutorisation: "Valide",
    } as DetailedSpecialite)?.title,
  ).toBe(
    "Ce médicament dispose d'une autorisation, mais n'est pas disponible actuellement.",
  );
});
