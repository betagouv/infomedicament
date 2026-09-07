import { beforeEach, describe, expect, it, vi } from "vitest";
import { Presentation } from "@/types/PresentationTypes";
import { deriveCommercialFact, presentationIsComm } from "./presentation";

vi.mock("server-cli-only", () => ({}));

const NOW = new Date("2026-09-01T12:00:00Z");

function makePresentation(
  overrides: Partial<Presentation> = {},
): Presentation {
  return {
    cis: "60000000",
    cip13: "3400900000000",
    cip7: null,
    name: "Une présentation",
    commercializationStatus: "commercialized",
    commercializationDate: new Date("2020-01-01T00:00:00Z"),
    commercializationEndDate: null,
    authorizationStatus: "active",
    abrogationDate: null,
    displayOrder: 1,
    price: null,
    publicPriceExcludingDispensingFee: null,
    dispensingFee: null,
    reimbursementRate: null,
    reimbursementStatus: "unknown",
    agreementStatus: "unknown",
    retrocessionStatus: "unknown",
    listeSusStatus: "unknown",
    ivgStatus: "unknown",
    ...overrides,
  };
}

describe("presentationIsComm", () => {
  beforeEach(() => vi.useRealTimers());

  it("keeps a commercialized presentation visible", () => {
    expect(presentationIsComm(makePresentation(), NOW)).toBe(true);
  });

  it.each(["stopped", "suspended", "withdrawn"] as const)(
    "keeps a recent %s presentation visible using its end date",
    (commercializationStatus) => {
      expect(
        presentationIsComm(
          makePresentation({
            commercializationStatus,
            commercializationEndDate: new Date("2025-03-01T00:00:00Z"),
          }),
          NOW,
        ),
      ).toBe(true);
    },
  );

  it("does not reuse the commercialization start date for the 730-day window", () => {
    expect(
      presentationIsComm(
        makePresentation({
          commercializationStatus: "stopped",
          commercializationDate: new Date("2026-08-01T00:00:00Z"),
          commercializationEndDate: new Date("2023-08-01T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it("hides a stopped presentation older than 730 days", () => {
    expect(
      presentationIsComm(
        makePresentation({
          commercializationStatus: "stopped",
          commercializationEndDate: new Date("2024-08-01T00:00:00Z"),
        }),
        NOW,
      ),
    ).toBe(false);
  });

  it("keeps a recently abrogated presentation and hides an old one", () => {
    const recent = makePresentation({
      authorizationStatus: "abrogated",
      abrogationDate: new Date("2025-01-01T00:00:00Z"),
    });
    const old = makePresentation({
      authorizationStatus: "abrogated",
      abrogationDate: new Date("2020-01-01T00:00:00Z"),
    });

    expect(presentationIsComm(recent, NOW)).toBe(true);
    expect(presentationIsComm(old, NOW)).toBe(false);
  });
});

describe("deriveCommercialFact", () => {
  it("uses the latest relevant event and preserves an explicit unknown", () => {
    const positive = new Set([10, 11]);
    const negative = new Set([12, 13, 14]);

    expect(
      deriveCommercialFact(
        [
          {
            code_evenement: 10,
            num_evenement: 1,
            date_evenement: new Date("2020-01-01"),
          },
          {
            code_evenement: 12,
            num_evenement: 2,
            date_evenement: new Date("2022-01-01"),
          },
        ],
        positive,
        negative,
      ),
    ).toBe("no");
    expect(deriveCommercialFact([], positive, negative)).toBe("unknown");
  });
});
