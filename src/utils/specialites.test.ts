import { describe, it, expect } from "vitest";
import { isAIP, isAlerteSecurite, isCentralisee, isCommercialisee, isHomeopathie, isSurveillanceRenforcee } from "./specialites";
import { getDetailedSpecialite } from "@/db/utils/specialities";
import { getEvents } from "@/db/utils/ficheInfos";

describe("utils specialities", () => {

  it("isCentralisee", async () => {
    const specCentralise = await getDetailedSpecialite("60035714");
    if(specCentralise)
      expect(isCentralisee(specCentralise)).toBe(true);
    
    const specNotCentralise = await getDetailedSpecialite("60004487");
    if(specNotCentralise)
      expect(isCentralisee(specNotCentralise)).toBe(false);
  })

  it("isCommercialisee", async () => {
    const specComm = await getDetailedSpecialite("60004277");
    if(specComm)
      expect(isCommercialisee(specComm)).toBe(true);
    
    const specNotComm = await getDetailedSpecialite("60010084");
    if(specNotComm)
      expect(isCommercialisee(specNotComm)).toBe(false);
  })

  it("isAIP", async () => {
    const specAIP = await getDetailedSpecialite("60064527");
    if(specAIP)
      expect(isAIP(specAIP)).toBe(true);
    
    const specNotAIP = await getDetailedSpecialite("60008845");
    if(specNotAIP)
      expect(isAIP(specNotAIP)).toBe(false);
  })

  it("isAlerteSecurite", async () => {
    const specAlerte = await getDetailedSpecialite("60046529");
    if(specAlerte)
      expect(isAlerteSecurite(specAlerte)).toBe(true);
    
    const specNotAlerte = await getDetailedSpecialite("60007960");
    if(specNotAlerte)
      expect(isAlerteSecurite(specNotAlerte)).toBe(false);
  })

  it("isSurveillanceRenforcee", async () => {
    const specSurveillance = await getEvents("60039171");
    if(specSurveillance)
      expect(isSurveillanceRenforcee(specSurveillance)).toBe(true);
    
    const specNotSurveillance = await getEvents("60002504");
    if(specNotSurveillance)
      expect(isSurveillanceRenforcee(specNotSurveillance)).toBe(false);
  })

  it("isHomeopathie", async () => {
    const specHomeo = await getDetailedSpecialite("60002746");
    if(specHomeo)
      expect(isHomeopathie(specHomeo)).toBe(true);
    
    const specNotHomeo = await getDetailedSpecialite("60007960");
    if(specNotHomeo)
      expect(isHomeopathie(specNotHomeo)).toBe(false);
  })

});