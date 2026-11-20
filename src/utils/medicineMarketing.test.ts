import { expect, it } from "vitest";
import { getMedicineMarketingStatus } from "./medicineMarketing";
import type { AnsmPresentation } from "@/db/types";

const now = new Date("2026-11-20T12:00:00Z");
const pack = (
  status: AnsmPresentation["statut_commercialisation"],
  end: string | null = null,
) => ({
  statut_commercialisation: status,
  date_commercialisation: null,
  date_arret_commercialisation: end ? new Date(end) : null,
});

it("distinguishes upcoming stops from completed stops", () => {
  expect(
    getMedicineMarketingStatus([pack("COMMERCIALISEE", "2026-12-01")], now),
  ).toBe("stopping");
  expect(
    getMedicineMarketingStatus([pack("COMMERCIALISEE", "2026-11-01")], now),
  ).toBe("stopped");
  expect(getMedicineMarketingStatus([pack("ARRETEE")], now)).toBe("stopped");
});

it("does not announce a medicine's withdrawal when a pack remains marketed", () => {
  expect(
    getMedicineMarketingStatus([pack("ARRETEE"), pack("COMMERCIALISEE")], now),
  ).toBe("marketed");
  expect(
    getMedicineMarketingStatus(
      [pack("COMMERCIALISEE", "2026-12-01"), pack("COMMERCIALISEE")],
      now,
    ),
  ).toBe("marketed");
});

it("keeps missing data and suspended commercialization separate from a stop", () => {
  expect(getMedicineMarketingStatus([], now)).toBe("unknown");
  expect(
    getMedicineMarketingStatus([pack("ARRETEE"), pack("INCONNUE")], now),
  ).toBe("unknown");
  expect(getMedicineMarketingStatus([pack("SUSPENDUE")], now)).toBe(
    "not-marketed",
  );
});

it("uses a future declared stop date even after the pack is marked stopped", () => {
  expect(getMedicineMarketingStatus([pack("ARRETEE", "2026-12-01")], now)).toBe(
    "stopping",
  );
});

it("does not infer a complete upcoming stop from an unknown pack", () => {
  expect(
    getMedicineMarketingStatus(
      [pack("COMMERCIALISEE", "2026-12-01"), pack("NON_COMMUNIQUEE")],
      now,
    ),
  ).toBe("marketed");
});

it("does not treat a future market launch as current commercialization", () => {
  expect(
    getMedicineMarketingStatus(
      [
        {
          ...pack("COMMERCIALISEE"),
          date_commercialisation: new Date("2026-12-01"),
        },
      ],
      now,
    ),
  ).toBe("not-marketed");
});
