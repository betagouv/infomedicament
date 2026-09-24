import { describe, expect, it } from "vitest";
import { getEvents } from "./safety";
import { isSurveillanceRenforcee } from "@/utils/specialites";

describe("PostgreSQL safety events", () => {
  it("detects a medicine under reinforced surveillance", async () => {
    const events = await getEvents("68852725");
    const surveillanceEvent = events.find((event) => event.code === 83);

    expect(surveillanceEvent).toMatchObject({
      specialiteId: "68852725",
      typeLabel: "Médicament soumis à une surveillance renforcée (triangle noir)",
    });
    expect(surveillanceEvent?.eventDate).toBeInstanceOf(Date);
    expect(surveillanceEvent?.expiryDate).toBeInstanceOf(Date);
    expect(isSurveillanceRenforcee(events, new Date("2026-09-15"))).toBe(true);
  });
});
