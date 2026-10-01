import { describe, expect, it } from "vitest";
import { formatDateNotif, formatNoticeDateNotif } from "./notices";

describe("utils notices", () => {
  it("formats a valid notification date", () => {
    expect(formatDateNotif("2026-02-19T12:00:00.000Z")).toBe("19/02/2026");
    expect(formatNoticeDateNotif("2026-02-19T12:00:00.000Z")).toBe(
      "Notice mise à jour le 19/02/2026",
    );
  });

  it("returns an empty string when the date cannot be parsed", () => {
    expect(formatDateNotif("not-a-date")).toBe("");
    expect(formatNoticeDateNotif("not-a-date")).toBe("");
    expect(formatDateNotif(undefined)).toBe("");
  });
});
