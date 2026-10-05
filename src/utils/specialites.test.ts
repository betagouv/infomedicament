import { describe, it, expect } from "vitest";
import type { VUEvnts } from "@/db/pdbmMySQL/types";
import type { ResumeSpecialiteDB } from "@/db/types";
import type { ShortIndication } from "@/types/IndicationsTypes";
import {
  type DelivranceCondition,
  type DetailedSpecialite,
  type ResumeSpecGroup,
  SpecialiteStat,
} from "@/types/SpecialiteTypes";
import {
  filterSpecsGroupsByCIS,
  formatIndicationsDetails,
  formatSpecialitesResume,
  getProcedureLibLong,
  isAIP,
  isAlerteSecurite,
  isCentralisee,
  isCommercialisee,
  isHomeopathie,
  isHospitalDelivrance,
  isSurveillanceRenforcee,
} from "./specialites";

const detailedSpec: DetailedSpecialite = {
  SpecId: "60035714",
  StatId: SpecialiteStat.Valide,
  ProcId: "CENTRALISEE",
  SpecDenom01: "SIMPONI 50 mg, solution injectable en seringue préremplie",
  SpecDateAMM: new Date("2009-10-01"),
  SpecStatDate: new Date("2009-10-01"),
  StatutBdm: 1,
  Een: "Latex caoutchouc naturel, Sorbitol",
  urlCentralise: "https://www.ema.europa.eu/fr/documents/product-information/simponi-epar-product-information_fr.pdf",
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
    const eventsSurveillance: VUEvnts[] = [
      {
        SpecId: "60035714",
        codeEvnt: "84",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2025-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      },
      {
        SpecId: "60035714",
        codeEvnt: "83",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2029-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      }
    ];
    const eventsNotSurveillance: VUEvnts[] = [
      {
        SpecId: "60035714",
        codeEvnt: "84",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2025-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      },
      {
        SpecId: "60035714",
        codeEvnt: "84",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2025-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      }
    ];
    const eventsNotSurveillanceBis: VUEvnts[] = [
      {
        SpecId: "60035714",
        codeEvnt: "84",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2025-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      },
      {
        SpecId: "60035714",
        codeEvnt: "83",
        dateEvnt: new Date("2021-10-01"),
        dateEcheance: new Date("2025-10-01"),
        remCommentaire: "Commentaire 1",
        codeTypeInfo: 1,
      }
    ];
    //Surveillance Renforcée
    expect(isSurveillanceRenforcee(eventsSurveillance)).toBe(true);
    //Not Surveillance Renforcé : zéro event
    expect(isSurveillanceRenforcee(eventsNotSurveillance)).toBe(false);
    //Not Surveillance Renforcé : not between the two dates
    expect(isSurveillanceRenforcee(eventsNotSurveillanceBis)).toBe(false);
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
      subsMainNames: null,
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

describe("filterSpecsGroupsByCIS", () => {
  const fucidine: ResumeSpecGroup = {
    groupName: "FUCIDINE",
    composants: "fusidate de sodium",
    subsIds: ["04913"],
    subsNamesIds: ["04913"],
    specialites: [
      ["65070886", "FUCIDINE 250 mg, comprimé pelliculé", "1", "NATIONALE", "false"],
      ["60330586", "FUCIDINE 2 POUR CENT, crème", "1", "NATIONALE", "false"],
    ],
    shortSpecialites: [
      { SpecId: "65070886", SpecDenom01: "FUCIDINE 250 mg, comprimé pelliculé", StatutBdm: "1", ProcId: "NATIONALE", isSurveillanceRenforcee: false },
      { SpecId: "60330586", SpecDenom01: "FUCIDINE 2 POUR CENT, crème", StatutBdm: "1", ProcId: "NATIONALE", isSurveillanceRenforcee: false },
    ],
    indicationsIds: [],
    atc1Code: "D",
    atc2Code: "D06",
    atc5Code: "D06AX01",
    CISList: ["65070886", "60330586"],
    indicationsIdsNames: [],
  };

  it("keeps only the specialites of the CIS list in each medicamentgroup", () => {
    const [group] = filterSpecsGroupsByCIS([fucidine], ["60330586"]);

    expect(group.CISList).toEqual(["60330586"]);
    expect(group.specialites.map((spec) => spec[0])).toEqual(["60330586"]);
    expect(group.shortSpecialites.map((spec) => spec.SpecId)).toEqual(["60330586"]);
  });

  it("removes the medicaments groups without specialite of the CIS list", () => {
    expect(filterSpecsGroupsByCIS([fucidine], ["60009573"])).toEqual([]);
  });

  it("takes the medicament group substances from the first specialite kept", () => {
    const claradol: ResumeSpecGroup = {
      ...fucidine,
      groupName: "CLARADOL",
      composants: "caféine, paracétamol",
      subsIds: ["00420", "02202"],
      subsNamesIds: ["00420", "02202"],
      specialites: [
        ["60166467", "CLARADOL 500 mg CAFEINE, comprimé", "1", "NATIONALE", "false", "caféine, paracétamol", "00420,02202", "00420,02202"],
        ["67458001", "CLARADOL 500 mg, comprimé sécable", "1", "NATIONALE", "false", "paracétamol", "02202", "02202"],
      ],
      shortSpecialites: [],
      CISList: ["60166467", "67458001"],
    };
    const [group] = filterSpecsGroupsByCIS([claradol], ["67458001"]);

    expect(group.composants).toBe("paracétamol");
    expect(group.subsIds).toEqual(["02202"]);
    expect(group.subsNamesIds).toEqual(["02202"]);
  });

  it("keeps a medicamentgroup unchanged when all its specialites are in the CIS list", () => {
    expect(filterSpecsGroupsByCIS([fucidine], ["65070886", "60330586"])).toEqual([fucidine]);
  });
});
