import { describe, it, expect } from "vitest";
import { getGenericSlug } from "./generics";

describe("utils generics - slug", () => {
  it("builds a slug from the DCI part of the group name and the group code", () => {
    expect(getGenericSlug(2, "CIMETIDINE 200 mg - TAGAMET 200 mg, comprimé effervescent")).toBe(
      "cimetidine-200-mg-2",
    );
  });

  it("gives the same slug for the group label and the formatted list name", () => {
    expect(getGenericSlug(10, "SPIRAMYCINE 3 M.U.I. - ROVAMYCINE 3 MILLIONS U I, comprimé pelliculé.")).toBe(
      getGenericSlug(10, "Spiramycine 3 M.u.i."),
    );
  });
});
