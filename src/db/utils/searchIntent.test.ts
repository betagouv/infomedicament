import { describe, it, expect } from "vitest";
import { detectQueryIntent, stripIntentFromQuery, stripSpecialiteFromQuery } from "./searchIntent";

describe("detectQueryIntent", () => {
  it("detects grossesse from 'femmes enceintes'", () => {
    const result = detectQueryIntent("Doliprane femmes enceintes");
    expect(result?.sectionTitleQuery).toBe("grossesse allaitement");
  });

  it("detects grossesse without accents", () => {
    const result = detectQueryIntent("doliprane enceinte");
    expect(result?.sectionTitleQuery).toBe("grossesse allaitement");
  });

  it("detects effets indésirables and returns anchorId", () => {
    const result = detectQueryIntent("Xanax effets indésirables");
    expect(result?.anchorId).toBe("Ann3bEffetsIndesirables");
  });

  it("detects effets indésirables with varied phrasing", () => {
    expect(detectQueryIntent("doliprane effets secondaires")?.anchorId).toBe("Ann3bEffetsIndesirables");
    expect(detectQueryIntent("quels sont les effets du xanax")?.anchorId).toBe("Ann3bEffetsIndesirables");
    expect(detectQueryIntent("Xanax effet indésirable")?.anchorId).toBe("Ann3bEffetsIndesirables");
  });

  it("detects posologie", () => {
    const result = detectQueryIntent("paracétamol posologie adulte");
    expect(result?.sectionTitleQuery).toBe("posologie dose");
  });

  it("detects conservation and returns anchorId", () => {
    const result = detectQueryIntent("comment conserver le doliprane");
    expect(result?.anchorId).toBe("Ann3bConservation");
  });

  it("detects enfant / pédiatrie", () => {
    expect(detectQueryIntent("doliprane bébé")?.sectionTitleQuery).toBe("enfants adolescents");
    expect(detectQueryIntent("doliprane nourrisson")?.sectionTitleQuery).toBe("enfants adolescents");
  });

  it("returns null for a plain medication name with no intent", () => {
    expect(detectQueryIntent("doliprane")).toBeNull();
    expect(detectQueryIntent("Xanax")).toBeNull();
    expect(detectQueryIntent("paracétamol")).toBeNull();
  });

  it("is case-insensitive", () => {
    expect(detectQueryIntent("Doliprane POSOLOGIE")).not.toBeNull();
  });
});

describe("stripIntentFromQuery", () => {
  it("removes intent words, keeps medication name", () => {
    const intent = detectQueryIntent("Xanax effets indésirables")!;
    expect(stripIntentFromQuery("Xanax effets indésirables", intent)).toBe("Xanax");
  });

  it("removes posologie from query", () => {
    const intent = detectQueryIntent("doliprane posologie")!;
    expect(stripIntentFromQuery("doliprane posologie", intent)).toBe("doliprane");
  });

  it("strips plural forms of intent words", () => {
    const intent = detectQueryIntent("Doliprane enceintes")!;
    expect(stripIntentFromQuery("Doliprane enceintes", intent)).toBe("Doliprane");
  });

  it("strips plural effets (user types plural, trigger is singular)", () => {
    const intent = detectQueryIntent("Xanax effets indésirables")!;
    expect(stripIntentFromQuery("Xanax effets indésirables", intent)).toBe("Xanax");
  });

  it("strips singular effet (user types singular, trigger is plural)", () => {
    const intent = detectQueryIntent("Xanax effet indésirable")!;
    expect(stripIntentFromQuery("Xanax effet indésirable", intent)).toBe("Xanax");
  });

  it("strips plural allergies", () => {
    const intent = detectQueryIntent("Xanax allergies")!;
    expect(stripIntentFromQuery("Xanax allergies", intent)).toBe("Xanax");
  });

  it("falls back to original query if all words are intent keywords", () => {
    const intent = detectQueryIntent("posologie")!;
    expect(stripIntentFromQuery("posologie", intent)).toBe("posologie");
  });
});

describe("stripSpecialiteFromQuery", () => {
  it("removes medication name, keeps intent words", () => {
    expect(stripSpecialiteFromQuery("Xanax effets indésirables", "Xanax")).toBe("effets indésirables");
  });

  it("removes multi-word medication name", () => {
    expect(stripSpecialiteFromQuery("Doliprane 1000mg posologie", "Doliprane 1000mg")).toBe("posologie");
  });

  it("is case-insensitive for medication words", () => {
    expect(stripSpecialiteFromQuery("XANAX effets indésirables", "Xanax")).toBe("effets indésirables");
  });

  it("falls back to original query if medication query is empty string", () => {
    expect(stripSpecialiteFromQuery("effets indésirables", "")).toBe("effets indésirables");
  });
});
