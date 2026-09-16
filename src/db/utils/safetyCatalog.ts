import type { AnsmSpecialiteEvenement } from "@/db/types";
import type { SafetyEvent } from "@/types/FicheInfoTypes";

export const REINFORCED_SURVEILLANCE_EVENT_CODE = 83;

function toDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

export function mapAnsmSafetyEvent(
  row: AnsmSpecialiteEvenement,
): SafetyEvent {
  return {
    specialiteId: row.cis,
    code: row.code_evenement,
    sequence: row.num_evenement,
    typeLabel: row.evenement,
    eventDate: toDate(row.date_evenement),
    expiryDate: toDate(row.date_echeance),
    comment: row.commentaire,
    modifiedAt: toDate(row.date_modification),
  };
}
