import { describe, it, expect } from "vitest";
import { formatIndicationsDetails, formatSpecialitesResume, getProcedureLibLong, getSpecSlug, isAIP, isAlerteSecurite, isCentralisee, isCommercialisee, isHomeopathie, isHospitalDelivrance, isSurveillanceRenforcee } from "./specialites";
import { DelivranceCondition, DetailedSpecialite, SpecialiteStat } from "@/types/SpecialiteTypes";
import type { SafetyEvent } from "@/types/FicheInfoTypes";
import { ShortIndication } from "@/types/IndicationsTypes";
import { ResumeSpecialiteDB } from "@/db/types";

const detailedSpec: DetailedSpecialite = {
  SpecId: "60035714",
  StatId: SpecialiteStat.Valide,
  ProcId: "CENTRALISEE",
  SpecDenom01: "SIMPONI 50 mg, solution injectable en seringue préremplie",
  SpecDateAMM: new Date("2009-10-01"),
  SpecStatDate: new Date("2009-10-01"),
  StatutBdm: 1,
  Een: "Latex caoutchouc naturel, Sorbitol",
  statutAutorisation: "Valide",
  statutComm: "Commercialisée",
  titulairesList: 'JANSSEN BIOLOGICS BV',
  genericGroupCode: null,
  referenceSpecialite: null,
}

describe("utils specialities", () => {

  it("isCentralisee", async () => {
    //Centralisée
    detailedSpec.ProcId = "CENTRALISEE";
    expect(isCentralisee(detailedSpec)).toBe(true);
    //Not centralisée
    detailedSpec.ProcId = "IMPORTATION_PARALLELE";
    expect(isCentralisee(detailedSpec)).toBe(false);
  })

  it("isCommercialisee", async () => {
    //Commercialisée
    expect(isCommercialisee(detailedSpec)).toBe(true);
    //Not Commercialisée
    detailedSpec.StatutBdm = 2;
    expect(isCommercialisee(detailedSpec)).toBe(false);
  })

  it("isAIP", async () => {
    //AIP
    detailedSpec.ProcId = "IMPORTATION_PARALLELE";
    expect(isAIP(detailedSpec)).toBe(true);
    //Not AIP
    detailedSpec.ProcId = "CENTRALISEE";
    expect(isAIP(detailedSpec)).toBe(false);
  })

  it("isAlerteSecurite", async () => {
    //Not Alerte Sécurité
    expect(isAlerteSecurite(detailedSpec)).toBe(false);
    //Alerte Sécurité
    detailedSpec.StatutBdm = 3;
    expect(isAlerteSecurite(detailedSpec)).toBe(true);
  })

  it("isHomeopathie", async () => {
    //Not Homéopathie
    detailedSpec.ProcId = "CENTRALISEE";
    expect(isHomeopathie(detailedSpec)).toBe(false);
    //Homéopathie
    detailedSpec.ProcId = "HOMEOPATHIQUE_NATIONALE";
    expect(isHomeopathie(detailedSpec)).toBe(true);
  })

  it("formats textual procedures", () => {
    expect(getProcedureLibLong("NATIONALE")).toBe("Procédure nationale");
    expect(getProcedureLibLong("CENTRALISEE")).toBe("Procédure centralisée");
    expect(getProcedureLibLong("IMPORTATION_PARALLELE")).toBe("Autorisation d'Importation Parallèle");
    expect(getProcedureLibLong("HOMEOPATHIQUE_NATIONALE")).toBe("Enregistrement homéopathique en procédure nationale");
  });

  it("isSurveillanceRenforcee", async () => {
    const event = (code: number, expiryDate: string): SafetyEvent => ({
      specialiteId: "60035714",
      code,
      sequence: 1,
      typeLabel: code === 83 ? "Médicament soumis à une surveillance renforcée" : "Autre",
      eventDate: new Date("2021-10-01"),
      expiryDate: new Date(expiryDate),
      comment: "Commentaire 1",
      modifiedAt: null,
    });
    const now = new Date("2026-01-01");
    const eventsSurveillance = [event(84, "2029-10-01"), event(83, "2029-10-01")];
    const eventsNotSurveillance = [event(84, "2029-10-01")];
    const eventsNotSurveillanceBis = [event(84, "2029-10-01"), event(83, "2025-10-01")];
    //Surveillance Renforcée
    expect(isSurveillanceRenforcee(eventsSurveillance, now)).toBe(true);
    //Not Surveillance Renforcé : zéro event
    expect(isSurveillanceRenforcee(eventsNotSurveillance, now)).toBe(false);
    //Not Surveillance Renforcé : not between the two dates
    expect(isSurveillanceRenforcee(eventsNotSurveillanceBis, now)).toBe(false);
  });

  it("formatIndicationsDetails", async () => {
    //GroupName : ACECLOFENAC ACCORD
    const indicationssList: string[][] = [
      ["99", "Arthrose"],
      ["76","Polyarthrite rhumatoïde"],
      ["225","Inflammation"],
      ["213","Douleur"],
      ["236","Rhumatismes inflammatoires"]
    ];
    const expectedIndicationsList: ShortIndication[] = [
      {
        idIndication: 99,
        nomIndication: "Arthrose",
      },
      {
        idIndication: 76,
        nomIndication: "Polyarthrite rhumatoïde",
      },
      {
        idIndication: 225,
        nomIndication: "Inflammation",
      },
      {
        idIndication: 213,
        nomIndication: "Douleur",
      },
      {
        idIndication: 236,
        nomIndication: "Rhumatismes inflammatoires",
      },
    ];
    expect(formatIndicationsDetails(indicationssList)).toStrictEqual(expectedIndicationsList);
  });

  it("formatSpecialitesResume", async () => {
    const specs:ResumeSpecialiteDB[] = [{
      ProcId: "10",
      StatutBdm: 1,
      atc1Code: "N",
      atc2Code: "N03",
      atc5Code: "N03AG01",
      composants: "sodium (valproate de)",
      groupName: "DEPAKINE",
      indicationsIds: [36, 162],
      indicationsIdsNames: [
        ['36', 'Epilepsie'],
        ['162', 'Convulsions']
      ],
      isAlertPediatricContraindication: false,
      isAlertPregnancyMention: true,
      isAlertPregnancyPlan: true,
      isSurveillanceRenforcee: true,
      specId: "67623734",
      specName: "DEPAKINE 200 mg, comprimé gastro-résistant",
      subsIds: ['05562'],
    }]
    const formattedSpecs = formatSpecialitesResume(specs);
    const expectedIndicationsDetails = [{
      idIndication: 36,
      nomIndication: "Epilepsie",
    },
    {
      idIndication: 162,
      nomIndication: "Convulsions",
    }];
    
    expect(formattedSpecs[0].indicationsDetails).toStrictEqual(expectedIndicationsDetails);
  });

});

describe("utils specialities - delivrance", () => {

  it("isHospitalDelivrance", async () => {
    //Usage hospitalier
    const delivrances_1: DelivranceCondition[] = [{
      shortLabel: "liste I",
      code: 120,
      longLabel: "liste I",
    },
    {
      shortLabel:"nécessitant surveillance particulière pendant traitement",
      code: 13,
      longLabel: "médicament nécessitant une surveillance particulière pendant le traitement",
    },
    {
      shortLabel: "médecins compétents en CANCEROLOGIE",
      code: 211,
      longLabel: "prescription réservée aux médecins compétents en CANCEROLOGIE",
    },
    {
      shortLabel: "spécialistes et services ONCOLOGIE MEDICALE",
      code: 15,
      longLabel: "prescription réservée aux spécialistes et services ONCOLOGIE MEDICALE",
    },
    {
      shortLabel: "réservé à l'usage HOSPITALIER",
      code: 3,
      longLabel: "réservé à l'usage HOSPITALIER",
    }];
    expect(isHospitalDelivrance(delivrances_1)).toBe(true);

    //Not "Usage hospitalier"
    const delivrances_2: DelivranceCondition[] = [{
      shortLabel: "hors ETS : prescr. par médecins, sages-femmes et centres habilités art L.2212-2",
      code: 199,
      longLabel: "hors établissement de santé : prescription réservée aux médecins, sages-femmes et centres habilités conformément à l'article L.2212-2 du code de la santé publique",
    },
    {
      shortLabel: "liste I",
      code: 120,
      longLabel: "liste I",
    }];
    
    expect(isHospitalDelivrance(delivrances_2)).toBe(false);
  });
});

describe("specialities slugs", () => {
  it("builds a slug from the name and the CIS code", () => {
    expect(getSpecSlug("60234100", "DOLIPRANE 1000 mg, comprimé")).toBe(
      "doliprane-1000-mg-comprime-60234100",
    );
  });

  it("replaces slashes with dashes", () => {
    expect(getSpecSlug("67613291", "IZALGI 500 mg/25 mg, gélule")).toBe(
      "izalgi-500-mg-25-mg-gelule-67613291",
    );
    expect(getSpecSlug("64976070", "TRIZIVIR 300 mg / 150 mg / 300 mg, comprimé pelliculé")).toBe(
      "trizivir-300-mg-150-mg-300-mg-comprime-pellicule-64976070",
    );
  });

  it("replaces parentheses with dashes", () => {
    expect(getSpecSlug("69174918", "COMIRNATY, dispersion injectable(vaccin à ARNm)")).toBe(
      "comirnaty-dispersion-injectable-vaccin-a-arnm-69174918",
    );
  });

  it("keeps decimal commas as separators", () => {
    expect(getSpecSlug("64460075", "DECAPEPTYL L.P. 11,25 mg, poudre")).toBe(
      "decapeptyl-lp-11-25-mg-poudre-64460075",
    );
  });

  it("replaces periods with dashes, except in uppercase abbreviations", () => {
    expect(getSpecSlug("1", "COMIRNATY OMICRON XBB.1.5, dispersion injectable.Vaccin")).toBe(
      "comirnaty-omicron-xbb-1-5-dispersion-injectable-vaccin-1",
    );
    expect(getSpecSlug("2", "DUTASTERIDE BIOGARAN 0.5 mg, capsule molle")).toBe(
      "dutasteride-biogaran-0-5-mg-capsule-molle-2",
    );
    expect(getSpecSlug("3", "TRAMADOL ARROW L.P. 200 mg, gélule")).toBe(
      "tramadol-arrow-lp-200-mg-gelule-3",
    );
  });

  it("falls back to the CIS code when the name is empty", () => {
    expect(getSpecSlug("60234100", "")).toBe("60234100");
  });
});