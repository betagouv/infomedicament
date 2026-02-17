import { describe, it, expect } from "vitest";
import { isAIP, isAlerteSecurite, isCentralisee, isCommercialisee, isHomeopathie, isSurveillanceRenforcee } from "./specialites";
import { getEvents } from "@/db/utils/ficheInfos";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { SpecialiteComm, SpecialiteStat, VUEvnts } from "@/db/pdbmMySQL/types";

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
  })

});