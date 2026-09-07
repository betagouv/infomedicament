import "server-cli-only";

import { cache } from "react";
import db from "..";
import {
  AnsmPresentation,
  AnsmPresentationEvenement,
  PresentationDetail,
} from "../types";
import {
  KnownFact,
  Presentation,
  PresentationAuthorizationStatus,
  PresentationCommercializationStatus,
} from "@/types/PresentationTypes";

const COMMERCIALIZATION_WINDOW_DAYS = 730;
const ABROGATION_EVENT_CODES = new Set([18, 90]);
const REIMBURSEMENT_POSITIVE_EVENT_CODES = new Set([2, 3, 4]);
const REIMBURSEMENT_NEGATIVE_EVENT_CODES = new Set([5, 6, 7]);
const AGREEMENT_POSITIVE_EVENT_CODES = new Set([10, 11]);
const AGREEMENT_NEGATIVE_EVENT_CODES = new Set([12, 13, 14]);
const RETROCESSION_EVENT_CODES = new Set([54]);

type CommercialEvent = Pick<
  AnsmPresentationEvenement,
  "code_evenement" | "num_evenement" | "date_evenement"
>;

function mapCommercializationStatus(
  status: AnsmPresentation["statut_commercialisation"],
): PresentationCommercializationStatus {
  switch (status) {
    case "COMMERCIALISEE":
      return "commercialized";
    case "ARRETEE":
      return "stopped";
    case "SUSPENDUE":
      return "suspended";
    case "RETIREE":
      return "withdrawn";
    case "NON_COMMUNIQUEE":
      return "not-reported";
    default:
      return "unknown";
  }
}

function mapAuthorizationStatus(
  status: AnsmPresentation["statut"],
): PresentationAuthorizationStatus {
  if (status === "ACTIVE") return "active";
  if (status === "ABROGEE") return "abrogated";
  return "unknown";
}

function eventTimestamp(event: CommercialEvent): number {
  return event.date_evenement?.getTime() ?? Number.NEGATIVE_INFINITY;
}

function latestEvent(
  events: CommercialEvent[],
  codes: Set<number>,
): CommercialEvent | undefined {
  return events
    .filter((event) => codes.has(event.code_evenement))
    .sort(
      (a, b) =>
        eventTimestamp(b) - eventTimestamp(a) ||
        b.num_evenement - a.num_evenement,
    )[0];
}

export function deriveCommercialFact(
  events: CommercialEvent[],
  positiveCodes: Set<number>,
  negativeCodes: Set<number>,
): KnownFact {
  const relevantCodes = new Set([...positiveCodes, ...negativeCodes]);
  const event = latestEvent(events, relevantCodes);
  if (!event) return "unknown";
  return positiveCodes.has(event.code_evenement) ? "yes" : "no";
}

function getAbrogationDate(events: CommercialEvent[]): Date | null {
  return latestEvent(events, ABROGATION_EVENT_CODES)?.date_evenement ?? null;
}

export function presentationIsComm(
  presentation: Presentation,
  now = new Date(),
): boolean {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - COMMERCIALIZATION_WINDOW_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  const hasRecentEndStatus =
    presentation.commercializationStatus === "stopped" ||
    presentation.commercializationStatus === "suspended" ||
    presentation.commercializationStatus === "withdrawn";
  const isCommerciallyVisible =
    presentation.commercializationStatus === "commercialized" ||
    (hasRecentEndStatus &&
      presentation.commercializationEndDate !== null &&
      presentation.commercializationEndDate >= cutoff);

  if (!isCommerciallyVisible) return false;

  // A missing event date is kept visible instead of silently discarding a
  // presentation whose explicit ANSM status says it is abrogated.
  return !(
    presentation.authorizationStatus === "abrogated" &&
    presentation.abrogationDate !== null &&
    presentation.abrogationDate < cutoff
  );
}

function mapPresentation(
  row: AnsmPresentation,
  events: CommercialEvent[],
): Presentation {
  return {
    cis: row.cis,
    cip13: row.cip.trim(),
    cip7: row.cip7?.trim() || null,
    name: row.denomination?.trim() || "Présentation non communiquée",
    commercializationStatus: mapCommercializationStatus(
      row.statut_commercialisation,
    ),
    commercializationDate: row.date_commercialisation,
    commercializationEndDate: row.date_arret_commercialisation,
    authorizationStatus: mapAuthorizationStatus(row.statut),
    abrogationDate: getAbrogationDate(events),
    displayOrder: null,
    // The current PostgreSQL datapackage contains no CEPS amount/rate fields.
    price: null,
    publicPriceExcludingDispensingFee: null,
    dispensingFee: null,
    reimbursementRate: null,
    reimbursementStatus: deriveCommercialFact(
      events,
      REIMBURSEMENT_POSITIVE_EVENT_CODES,
      REIMBURSEMENT_NEGATIVE_EVENT_CODES,
    ),
    agreementStatus: deriveCommercialFact(
      events,
      AGREEMENT_POSITIVE_EVENT_CODES,
      AGREEMENT_NEGATIVE_EVENT_CODES,
    ),
    retrocessionStatus: events.some((event) =>
      RETROCESSION_EVENT_CODES.has(event.code_evenement),
    )
      ? "yes"
      : "unknown",
    // No authoritative fields for these CNAM facts are present locally.
    listeSusStatus: "unknown",
    ivgStatus: "unknown",
  };
}

async function getPresentationEvents(
  codeCIP13List: string[],
): Promise<Map<string, CommercialEvent[]>> {
  if (codeCIP13List.length === 0) return new Map();

  const rows = await db
    .selectFrom("ansm_presentation_evenement")
    .where("cip", "in", codeCIP13List)
    .select(["cip", "code_evenement", "num_evenement", "date_evenement"])
    .execute();

  const eventsByCip = new Map<string, CommercialEvent[]>();
  rows.forEach(({ cip, ...event }) => {
    const normalizedCip = cip.trim();
    eventsByCip.set(normalizedCip, [
      ...(eventsByCip.get(normalizedCip) ?? []),
      event,
    ]);
  });
  return eventsByCip;
}

export const getPresentations = cache(
  async (CIS: string): Promise<Presentation[]> => {
    const rows = await db
      .selectFrom("ansm_presentation")
      .where("cis", "=", CIS)
      .selectAll()
      .execute();
    const eventsByCip = await getPresentationEvents(
      rows.map((row) => row.cip),
    );

    return rows
      .map((row) =>
        mapPresentation(row, eventsByCip.get(row.cip.trim()) ?? []),
      )
      .filter((presentation) => presentationIsComm(presentation))
      .sort((a, b) => a.cip13.localeCompare(b.cip13));
  },
);

export const getPresentationsDetails = cache(
  async (codeCIP13List: string[]): Promise<PresentationDetail[]> =>
    codeCIP13List.length
      ? db
          .selectFrom("presentations")
          .selectAll()
          .where("presentations.codecip13", "in", codeCIP13List)
          .distinct()
          .execute()
      : [],
);

export const getFullPresentations = cache(
  async (CIS: string): Promise<Presentation[]> => {
    const presentations = await getPresentations(CIS);
    const details = await getPresentationsDetails(
      presentations.map((presentation) => presentation.cip13),
    );

    presentations.forEach((presentation) => {
      presentation.details = details.filter(
        (detail) => detail.codecip13.trim() === presentation.cip13,
      );
      presentation.displayOrder = presentation.details.reduce<number | null>(
        (current, detail) => {
          if (detail.numpresentation === undefined) return current;
          return current === null
            ? detail.numpresentation
            : Math.min(current, detail.numpresentation);
        },
        null,
      );
    });

    return presentations.sort(
      (a, b) =>
        (a.displayOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.displayOrder ?? Number.MAX_SAFE_INTEGER) ||
        a.cip13.localeCompare(b.cip13),
    );
  },
);
