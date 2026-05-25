import { describe, expect, it } from "vitest";
import { formatNoticeDateNotif } from "./notices";

describe("utils notices", () => {
  it("replacePluralSingular", async () => {
    expect(formatNoticeDateNotif("ANSM - Mis à jour le : 19/02/2026"), "ANSM - Mis à jour le : 19/02/2026");
    expect(formatNoticeDateNotif("Mis à jour : 28/10/2008"), "ANSM - Mis à jour le : 28/10/2008");
  });
});