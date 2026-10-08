import { getFullPresentations, getPresentations, getPresentationsDetails } from "@/db/utils/presentation";
import { Presentation } from "@/types/PresentationTypes";
import { describe, it, expect } from "vitest";
import { formatPresentationCip, getPresentationName, isAbrogee, isAgree, isArret, isIVG, isListeRetrocession, isListeSus, isNotAuthorized } from "./presentations";

describe("utils presentations", () => {

  it("selects commercialised and recently stopped presentations", async () => {
    expect(await getPresentations("66338465")).toEqual(
      expect.arrayContaining([expect.objectContaining({ cip13: "3400955097891", commercialStatus: "commercialised" })]),
    );
    expect(await getPresentations("60528073")).toEqual(
      expect.arrayContaining([expect.objectContaining({ cip13: "3400930254028", commercialStatus: "stopped" })]),
    );
  });

  it("excludes presentations stopped outside the 730-day window", async () => {
    expect((await getPresentations("67066018")).some(({ cip13 }) => cip13 === "3400926978730")).toBe(false);
  });

  it("keeps recently suspended and withdrawn presentations", async () => {
    expect(await getPresentations("65198334")).toEqual(
      expect.arrayContaining([expect.objectContaining({ cip13: "3400930117583", commercialStatus: "suspended" })]),
    );
    expect(await getPresentations("66321989")).toEqual(
      expect.arrayContaining([expect.objectContaining({ cip13: "3400949004935", commercialStatus: "withdrawn" })]),
    );
  });

  it("uses PostgreSQL presentation events for the abrogation window", async () => {
    expect(await getPresentations("65133315")).toEqual(
      expect.arrayContaining([expect.objectContaining({
        cip13: "3400956286775",
        administrativeStatus: "abrogated",
        administrativeStatusDate: expect.any(Date),
      })]),
    );
    expect((await getPresentations("60011072")).some(({ cip13 }) => cip13 === "3400955746744")).toBe(false);
  });

  it("getPresentationName - when PVC-Alumunium + PVC in the details only display PVC-Aluminium", async () => {
    const presentations: Presentation[] = await getFullPresentations("66150367");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("plaquette PVC-Aluminium de 30 gélules");
    expect(shortPresentationName).toBe("Plaquette de 30 gélules");
  });

  it("getPresentationName - quantity with comma", async () => {
    const presentations: Presentation[] = await getFullPresentations("66663761");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("1 seringue préremplie en verre de 0,5 ml");
    expect(shortPresentationName).toBe("Seringue préremplie de 0,5 ml");
  });

  it("getPresentationName - uses normalized ANSM packaging when no legacy detail exists", async () => {
    const presentations: Presentation[] = await getFullPresentations("61183406");
    const presentation = presentations.find(({ cip13 }) => cip13 === "3400927721786");

    expect(presentation).toBeDefined();
    expect(getPresentationName(presentation!)).toBe("1 flacon aluminium de 100 g");
    expect(getPresentationName(presentation!, true)).toBe("Flacon de 100 g");
  });

  it("getPresentationName - preserves a device count carried by the ANSM presentation name", async () => {
    const presentations: Presentation[] = await getFullPresentations("60007565");
    const presentation = presentations.find(({ cip13 }) => cip13 === "3400930323731");

    expect(presentation).toBeDefined();
    expect(getPresentationName(presentation!)).toBe(
      "1 seringue préremplie en verre de 0,25 mL avec 2 aiguilles",
    );
    expect(getPresentationName(presentation!, true)).toBe("Seringue préremplie de 0,25 ml");
  });

  it("getPresentationName - plural", async () => {
    const presentations: Presentation[] = await getFullPresentations("64783769");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("2 stylos préremplis de 0,4 ml avec 2 tampons alcoolisés dans une plaquette thermoformée");
    expect(shortPresentationName).toBe("2 stylos préremplis de 0,4 ml");
  });

  it("getPresentationName - only display recipients details if on the original name", async () => {
    const presentations: Presentation[] = await getFullPresentations("60184188");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("tube polypropylène de 40 comprimés");
    expect(shortPresentationName).toBe("Tube de 40 comprimés");
  });

  it("getPresentationName - recipients details list must be unique", async () => {
    const presentations: Presentation[] = await getFullPresentations("60018444");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("30 plaquettes prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé");
    expect(shortPresentationName).toBe("30 plaquettes de 1 comprimé");
  });

  it("getPresentationName - preserves recipient materials and all accessory counts", async () => {
    const presentations: Presentation[] = await getFullPresentations("63886766");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("4 flacons en verre - 4 seringues préremplies en verre avec 4 aiguilles avec 4 adaptateurs pour flacon avec 8 tampons alcoolisés");
    expect(shortPresentationName).toBe("4 flacons - 4 seringues préremplies");
  });

  it("getPresentationName - multiple presentations", async () => {
    const presentations: Presentation[] = await getFullPresentations("60052222");

    const fullPresentationNameA: string = getPresentationName(presentations[0]);
    const shortPresentationNameA: string = getPresentationName(presentations[0], true);
    expect(fullPresentationNameA).toBe("1 flacon en verre brun de 13,2 mL (150 pulvérisations) avec pompe pour pulvérisation PEBD polypropylène");
    expect(shortPresentationNameA).toBe("Flacon de 13,2 ml");

    const fullPresentationNameB: string = getPresentationName(presentations[1]);
    const shortPresentationNameB: string = getPresentationName(presentations[1], true);
    expect(fullPresentationNameB).toBe("2 flacons en verre brun de 13,2 mL (150 pulvérisations) avec pompe pour pulvérisation PEBD polypropylène");
    expect(shortPresentationNameB).toBe("2 flacons de 13,2 ml");
  });

  it("getPresentationName - multiple recipients", async () => {
    const presentations: Presentation[] = await getFullPresentations("60206332");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("plaquette PVC-Aluminium PVDC de 12 comprimés - plaquette PVC-Aluminium de 4 comprimés");
    expect(shortPresentationName).toBe("Plaquette de 12 comprimés - Plaquette de 4 comprimés");
  });

  it("uses the ANSM name to keep the device on the correct recipient", async () => {
    const [presentation] = await getFullPresentations("64460075");
    expect(getPresentationName(presentation)).toBe(
      "1 flacon en verre de 4 ml - 1 ampoule en verre avec seringue avec aiguille de 2 ml",
    );
  });

  it.each([
    ["63169946", "3400930258637", "1 cartouche en verre de 1,5 mL dans stylo prérempli + 4 aiguilles"],
    ["63169946", "3400930317815", "1 cartouche en verre de 3 mL dans stylo prérempli + 4 aiguilles"],
  ])("preserves Wegovy packaging for CIS %s / CIP %s", async (cis, cip, expected) => {
    const rows = await getFullPresentations(cis);
    const presentation = rows.find(({ cip13 }) => cip13 === cip);
    expect(presentation).toBeDefined();
    expect(getPresentationName(presentation!)).toBe(expected);
  });

  it("preserves twelve needles on a non-commercialised three-cartridge pack", async () => {
    const details = await getPresentationsDetails(["3400955090724"]);
    expect(details.length).toBeGreaterThan(0);
    const presentation = { name: details[0].nom_presentation, details } as Presentation;
    expect(getPresentationName(presentation)).toBe("3 cartouches en verre de 3 mL dans stylos préremplis + 12 aiguilles");
  });

  it("preserves Ponvory initiation-pack materials and tablet strengths", async () => {
    const rows = await getFullPresentations("61715282");
    const presentation = rows.find(({ cip13 }) => cip13 === "3400930232231");
    expect(presentation).toBeDefined();
    const name = getPresentationName(presentation!);
    expect(name).toContain("polytéréphtalate (PET)");
    expect(name).toContain("Pack d’initiation 14 comprimés");
    expect(name).toContain("1 x 5 mg");
    expect(name).toContain("3 x 10 mg");
  });

  it("keeps CIP7 availability and separate start and stop dates", async () => {
    const [withCip7] = await getFullPresentations("65089833");
    const [withoutCip7] = await getFullPresentations("60928110");
    expect(formatPresentationCip(withCip7)).toBe("341 255-9 ou 34009 341 255 9 1");
    expect(formatPresentationCip(withoutCip7)).toBe("34009 490 047 5 1");
    expect(withCip7.commercialisationDate?.getUTCFullYear()).toBe(1998);
    expect(withCip7.commercialisationEndDate?.getUTCFullYear()).toBe(2024);
  });

  it("getFullPresentations - abrogée status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("69174918");
    expect(isAbrogee(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isAbrogee(presentationsB[0])).toBe(false);
  });

  it("getFullPresentations - arrêtée status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("65089833");
    expect(isArret(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isArret(presentationsB[0])).toBe(false);
  });

  it("getFullPresentations - not authorized status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("64460075");
    expect(isNotAuthorized(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isNotAuthorized(presentationsB[0])).toBe(false);
  });

  it("getFullPresentations - agréée status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("66296030");
    expect(isArret(presentationsA[0])).toBe(false);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isAgree(presentationsB[0])).toBe(true);
  });

  it("getFullPresentations - liste sus status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("60199966");
    expect(isListeSus(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isListeSus(presentationsB[0])).toBe(false);
  });

  it("getFullPresentations - liste retrocession status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("60018444");
    expect(isListeRetrocession(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isListeRetrocession(presentationsB[0])).toBe(false);
  });

  it("getFullPresentations - IVG status", async () => {
    const presentationsA: Presentation[] = await getFullPresentations("69981979");
    expect(isIVG(presentationsA[0])).toBe(true);
    const presentationsB: Presentation[] = await getFullPresentations("62772966");
    expect(isIVG(presentationsB[0])).toBe(false);
  });
});
