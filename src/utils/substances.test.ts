import { describe, it, expect } from "vitest";
import { cleanSubstanceName } from "./substances";

describe("utils/substance - cleanSubstanceName", () => {
  it("decodes named HTML entities", () => {
    expect(cleanSubstanceName("codant pour l&rsquo;arylsulfatase A")).toBe("codant pour l’arylsulfatase A");
    expect(cleanSubstanceName("&Delta;9-tétrahydrocannabinol")).toBe("Δ9-tétrahydrocannabinol");
  });

  it("decodes numeric HTML entities", () => {
    expect(cleanSubstanceName("l&#8217;acide")).toBe("l’acide");
    expect(cleanSubstanceName("l&#x2019;acide")).toBe("l’acide");
  });

  it("keeps unknown entities", () => {
    expect(cleanSubstanceName("a &unknown; b")).toBe("a &unknown; b");
  });

  it("removes double spaces", () => {
    expect(cleanSubstanceName("pixantrone  (dimaléate de)")).toBe("pixantrone (dimaléate de)");
    expect(cleanSubstanceName(" antigène  de surface ")).toBe("antigène de surface");
  });

  it("keeps a clean name unchanged", () => {
    expect(cleanSubstanceName("VALERIANE (RHIZOME DE) (POUDRE DE)")).toBe("VALERIANE (RHIZOME DE) (POUDRE DE)");
  });
});
