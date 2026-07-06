import { describe, it, expect } from "vitest";
import { formatIndicationsDetails, formatSpecialitesResume, isAIP, isAlerteSecurite, isCentralisee, isCommercialisee, isHomeopathie, isHospitalDelivrance, isSurveillanceRenforcee } from "./specialites";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { SpecDelivrance, SpecialiteComm, SpecialiteStat, VUEvnts } from "@/db/pdbmMySQL/types";
import { ShortIndication } from "@/types/IndicationsTypes";
import { ResumeSpecialiteDB } from "@/db/types";

const detailedSpec: DetailedSpecialite = {
  SpecId: "60035714",
  StatId: SpecialiteStat.Valide,
  CommId: SpecialiteComm.Commercialisée,
  ProcId: "20",
  SpecGeneId: "",
  SpecDenom01: "SIMPONI 50 mg, solution injectable en seringue préremplie",
  SpecDenom02: "",
  SpecAbrev: "",
  SpecDateAMM: new Date("2009-10-01"),
  SpecRem: "",
  SpecStatDate: new Date("2009-10-01"),
  SpecDC01: "",
  SpecDC02: "",
  SpecFormPh: "",
  SpecVoie: "",
  StatutBdm: 1,
  IsBdm: 1,
  NumAuthEurope: "EU/1/09/546",
  Een: "Latex caoutchouc naturel, Sorbitol",
  urlCentralise: "https://www.ema.europa.eu/fr/documents/product-information/simponi-epar-product-information_fr.pdf",
  statutAutorisation: "Valide",
  statutComm: "Commercialisée",
  titulairesList: 'JANSSEN BIOLOGICS BV',
  generiqueName: null,
}

describe("utils specialities", () => {

  it("isCentralisee", async () => {
    //Centralisée
    expect(isCentralisee(detailedSpec)).toBe(true);
    //Not centralisée
    detailedSpec.ProcId = "50";
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
    expect(isAIP(detailedSpec)).toBe(true);
    //Not AIP
    detailedSpec.ProcId = "20";
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
    expect(isHomeopathie(detailedSpec)).toBe(false);
    //Homéopathie
    detailedSpec.ProcId = "60";
    expect(isHomeopathie(detailedSpec)).toBe(true);
  })

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
    const delivrances_1: SpecDelivrance[] = [{
      DelivCourt: "liste I",
      DelivId: "120",
      DelivLong: "liste I",
      SpecId: "60199966",
    },
    {
      DelivCourt:"nécessitant surveillance particulière pendant traitement",
      DelivId: "13",
      DelivLong: "médicament nécessitant une surveillance particulière pendant le traitement",
      SpecId: "60199966",
    },
    {
      DelivCourt: "médecins compétents en CANCEROLOGIE",
      DelivId: "211",
      DelivLong: "prescription réservée aux médecins compétents en CANCEROLOGIE",
      SpecId: "60199966",
    },
    {
      DelivCourt: "spécialistes et services ONCOLOGIE MEDICALE",
      DelivId: "15",
      DelivLong: "prescription réservée aux spécialistes et services ONCOLOGIE MEDICALE",
      SpecId: "60199966",
    },
    {
      DelivCourt: "réservé à l'usage HOSPITALIER",
      DelivId: "3",
      DelivLong: "réservé à l'usage HOSPITALIER",
      SpecId: "60199966",
    }];
    expect(isHospitalDelivrance(delivrances_1)).toBe(true);

    //Not "Usage hospitalier"
    const delivrances_2: SpecDelivrance[] = [{
      DelivCourt: "hors ETS : prescr. par médecins, sages-femmes et centres habilités art L.2212-2",
      DelivId: "199",
      DelivLong: "hors établissement de santé : prescription réservée aux médecins, sages-femmes et centres habilités conformément à l'article L.2212-2 du code de la santé publique",
      SpecId: "69981979",
    },
    {
      DelivCourt: "liste I",
      DelivId: "120",
      DelivLong: "liste I",
      SpecId: "69981979",
    }];
    
    expect(isHospitalDelivrance(delivrances_2)).toBe(false);
  });
});