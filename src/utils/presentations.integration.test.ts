import { getFullPresentations } from "@/db/utils/presentation";
import { Presentation } from "@/types/PresentationTypes";
import { describe, it, expect } from "vitest";
import { getPresentationName, isAbrogee, isAgree, isArret, isIVG, isListeRetrocession, isListeSus, isNotAuthorized } from "./presentations";

describe("utils presentations", () => {

  it("getPresentationName - when PVC-Alumunium + PVC in the details only display PVC-Aluminium", async () => {
    const presentations: Presentation[] = await getFullPresentations("66150367");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("1 plaquette PVC-Aluminium de 30 gélules");
    expect(shortPresentationName).toBe("Plaquette de 30 gélules");
  });

  it("getPresentationName - quantity with comma", async () => {
    const presentations: Presentation[] = await getFullPresentations("66663761");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("1 seringue préremplie en verre de 0,5 ml");
    expect(shortPresentationName).toBe("Seringue préremplie de 0,5 ml");
  });

  it("getPresentationName - plural", async () => {
    const presentations: Presentation[] = await getFullPresentations("64783769");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("2 stylos préremplis de 0,4 ml avec tampon alcoolisé");
    expect(shortPresentationName).toBe("2 stylos préremplis de 0,4 ml");
  });

  it("getPresentationName - only display recipients details if on the original name", async () => {
    const presentations: Presentation[] = await getFullPresentations("60184188");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("1 tube polypropylène de 40 comprimés");
    expect(shortPresentationName).toBe("Tube de 40 comprimés");
  });

  it("getPresentationName - recipients details list must be unique", async () => {
    const presentations: Presentation[] = await getFullPresentations("60018444");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("30 plaquettes aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé");
    expect(shortPresentationName).toBe("30 plaquettes de 1 comprimé");
  });

  it("getPresentationName - dispositif is displayed at the end of everything", async () => {
    const presentations: Presentation[] = await getFullPresentations("63886766");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("4 flacons - 4 seringues préremplies avec aiguille avec adaptateur pour flacon avec tampon alcoolisé");
    expect(shortPresentationName).toBe("4 flacons - 4 seringues préremplies");
  });

  it("getPresentationName - multiple presentations", async () => {
    const presentations: Presentation[] = await getFullPresentations("60052222");

    const fullPresentationNameA: string = getPresentationName(presentations[0]);
    const shortPresentationNameA: string = getPresentationName(presentations[0], true);
    expect(fullPresentationNameA).toBe("1 flacon en verre brun de 13,2 ml avec dispositif pulvérisateur");
    expect(shortPresentationNameA).toBe("Flacon de 13,2 ml");

    const fullPresentationNameB: string = getPresentationName(presentations[1]);
    const shortPresentationNameB: string = getPresentationName(presentations[1], true);
    expect(fullPresentationNameB).toBe("2 flacons en verre brun de 13,2 ml avec dispositif pulvérisateur");
    expect(shortPresentationNameB).toBe("2 flacons de 13,2 ml");
  });

  it("getPresentationName - multiple recipients", async () => {
    const presentations: Presentation[] = await getFullPresentations("60206332");
    const fullPresentationName: string = getPresentationName(presentations[0]);
    const shortPresentationName: string = getPresentationName(presentations[0], true);
    expect(fullPresentationName).toBe("1 plaquette PVC-Aluminium PVDC de 12 comprimés - 1 plaquette PVC-Aluminium PVDC de 4 comprimés");
    expect(shortPresentationName).toBe("Plaquette de 12 comprimés - Plaquette de 4 comprimés");
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