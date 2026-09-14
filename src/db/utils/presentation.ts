import "server-cli-only";
import { cache } from "react";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import {
  Presentation,
  PresentationAdministrativeStatus,
  PresentationCommercialStatus,
} from "@/types/PresentationTypes";
import { PresentationDetail } from "../types";
import { isPresentationVisible } from "@/utils/presentations";
import db from "..";

const PRESENTATION_VISIBILITY_DAYS = 730;

function mapCommercialStatus(status: string | null): PresentationCommercialStatus {
  switch (status) {
    case "COMMERCIALISEE": return "commercialised";
    case "ARRETEE": return "stopped";
    case "SUSPENDUE": return "suspended";
    case "RETIREE": return "withdrawn";
    default: return "unknown";
  }
}

function mapAdministrativeStatus(status: string | null): PresentationAdministrativeStatus {
  switch (status) {
    case "ACTIVE": return "active";
    case "ABROGEE": return "abrogated";
    default: return "unknown";
  }
}

function mapYesNo(value: string | undefined): boolean | null {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "oui") return true;
  if (normalized === "non") return false;
  return null;
}

export const getPresentations = cache(async (CIS: string): Promise<Presentation[]> => {
  const rows = await db
    .selectFrom("ansm_presentation")
    .where("cis", "=", CIS)
    .selectAll()
    .execute();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PRESENTATION_VISIBILITY_DAYS);

  const abrogatedCips = rows
    .filter((row) => row.statut === "ABROGEE")
    .map((row) => row.cip);
  const abrogationEvents = abrogatedCips.length > 0
    ? await db
      .selectFrom("ansm_presentation_evenement")
      .where("cip", "in", abrogatedCips)
      .where("code_evenement", "in", [18, 90])
      .where("date_evenement", "is not", null)
      .select(["cip", "date_evenement"])
      .orderBy("date_evenement", "desc")
      .execute()
    : [];
  const administrativeStatusDateByCip = new Map<string, Date>();
  for (const event of abrogationEvents) {
    if (event.date_evenement && !administrativeStatusDateByCip.has(event.cip)) {
      administrativeStatusDateByCip.set(event.cip, event.date_evenement);
    }
  }

  const visibleRows = rows.filter((row) => isPresentationVisible({
    commercialStatus: mapCommercialStatus(row.statut_commercialisation),
    commercialisationEndDate: row.date_arret_commercialisation,
    administrativeStatus: mapAdministrativeStatus(row.statut),
    administrativeStatusDate: administrativeStatusDateByCip.get(row.cip) ?? null,
  }, cutoff));
  const cips = visibleRows.map((row) => row.cip.trim());

  const [prices, approvals] = cips.length > 0
    ? await Promise.all([
      pdbmMySQL
        .selectFrom("CEPS_Prix")
        .where("Cip13", "in", cips)
        .selectAll()
        .execute(),
      pdbmMySQL
        .selectFrom("CNAM_AgreColl")
        .where("Cip13", "in", cips)
        .selectAll()
        .execute(),
    ])
    : [[], []];

  const priceByCip = new Map(prices.map((price) => [price.Cip13.trim(), price]));
  const approvalByCip = new Map(approvals.map((approval) => [approval.Cip13.trim(), approval]));

  return visibleRows
    .map((row): Presentation => {
      const cip13 = row.cip.trim();
      const price = priceByCip.get(cip13);
      const approval = approvalByCip.get(cip13);

      return {
        cis: row.cis,
        cip13,
        cip7: row.cip7,
        name: row.denomination,
        commercialStatus: mapCommercialStatus(row.statut_commercialisation),
        commercialisationDate: row.date_commercialisation,
        commercialisationEndDate: row.date_arret_commercialisation,
        administrativeStatus: mapAdministrativeStatus(row.statut),
        administrativeStatusDate: administrativeStatusDateByCip.get(row.cip) ?? null,
        pricingKnown: price !== undefined,
        retailPrice: price?.PPF ?? null,
        priceExcludingDispensingFee: price?.Ppttc ?? null,
        dispensingFee: price?.HonoDisp ?? null,
        reimbursementRate: price?.TauxPriseEnCharge ?? null,
        communityApproval: approval
          ? approval.AgreColl === 1 ? true : approval.AgreColl === 0 ? false : null
          : null,
        communityApprovalDate: approval?.DateJO ?? null,
        additionalList: null,
        retrocessionList: null,
        ivgPricing: null,
      };
    })
    .sort((a, b) => a.retailPrice !== null && b.retailPrice !== null
      ? a.retailPrice - b.retailPrice
      : a.retailPrice !== null ? -1 : b.retailPrice !== null ? 1 : a.cip13.localeCompare(b.cip13));
});

export const getPresentationsDetails = cache(async (
  codeCIP13List: string[],
): Promise<PresentationDetail[]> => codeCIP13List.length > 0
  ? db
    .selectFrom("presentations")
    .selectAll()
    .where("presentations.codecip13", "in", codeCIP13List)
    .distinct()
    .execute()
  : []);

export const getFullPresentations = cache(async (CIS: string): Promise<Presentation[]> => {
  const presentations = await getPresentations(CIS);
  const cips = presentations.map((presentation) => presentation.cip13);
  const [details, retroRows] = cips.length > 0
    ? await Promise.all([
      getPresentationsDetails(cips),
      pdbmMySQL
        .selectFrom("CNAM_Retro")
        .where("Cip13", "in", cips)
        .selectAll()
        .execute(),
    ])
    : [[], []];
  const retroByCip = new Map(retroRows.map((retro) => [retro.Cip13.trim(), retro]));

  return presentations.map((presentation) => {
    const retro = retroByCip.get(presentation.cip13);
    return {
      ...presentation,
      details: details.filter((detail) => detail.codecip13.trim() === presentation.cip13),
      additionalList: mapYesNo(retro?.ListSus),
      retrocessionList: mapYesNo(retro?.Retro),
      ivgPricing: mapYesNo(retro?.IVG),
    };
  });
});
