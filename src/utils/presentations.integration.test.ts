import { getFullPresentations } from "@/db/utils/presentation";
import { Presentation } from "@/types/PresentationTypes";
import { describe, it, expect } from "vitest";
import { getPresentationFullPriceText, getPresentationName, isAbrogee, isAgree, isIVG, isListeRetrocession, isListeSus, isNotAuthorized } from "./presentations";

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
    const recent: Presentation[] = await getFullPresentations("64460075");
    expect(isNotAuthorized(recent[0])).toBe(true);
    expect(recent[0].commercializationEndDate?.toLocaleDateString("fr-FR")).toBe("27/02/2025");

    const old: Presentation[] = await getFullPresentations("65701038");
    expect(old).toHaveLength(0);
  });

  it("getFullPresentations - suspended status", async () => {
    const presentations = await getFullPresentations("65198334");
    expect(presentations[0].commercializationStatus).toBe("suspended");
  });

  it("getFullPresentations - collectivités status is tri-state", async () => {
    const agreed = await getFullPresentations("62772966");
    const notAgreed = await getFullPresentations("66296030");
    const unknown = await getFullPresentations("69981979");

    expect(isAgree(agreed[0])).toBe(true);
    expect(notAgreed[0].agreementStatus).toBe("no");
    expect(unknown[0].agreementStatus).toBe("unknown");
  });

  it("getFullPresentations - reimbursement event status is tri-state", async () => {
    const reimbursable = await getFullPresentations("62772966");
    const notReimbursable = await getFullPresentations("66296030");
    const unknown = await getFullPresentations("69981979");

    expect(reimbursable[0].reimbursementStatus).toBe("yes");
    expect(notReimbursable[0].reimbursementStatus).toBe("no");
    expect(unknown[0].reimbursementStatus).toBe("unknown");
  });

  it("getFullPresentations - liste retrocession status", async () => {
    const presentations = await getFullPresentations("64520985");
    expect(isListeRetrocession(presentations[0])).toBe(true);
  });

  it("does not turn unavailable CEPS/CNAM fields into false claims", async () => {
    const presentations = await getFullPresentations("69981979");
    const presentation = presentations[0];

    expect(getPresentationFullPriceText(presentation)).toBe(
      "Prix non disponible - remboursement non disponible",
    );
    expect(presentation.listeSusStatus).toBe("unknown");
    expect(presentation.ivgStatus).toBe("unknown");
    expect(isListeSus(presentation)).toBe(false);
    expect(isIVG(presentation)).toBe(false);
  });
});
