"use server";
import "server-cli-only";

import db from "@/db";
import type { SafetyEvent } from "@/types/FicheInfoTypes";
import {
  IMPORTANT_INFORMATION_EVENT_CODE,
  mapAnsmSafetyEvent,
  REINFORCED_SURVEILLANCE_EVENT_CODE,
} from "./safetyCatalog";

async function queryEvents(CISList: string[], code?: number): Promise<SafetyEvent[]> {
  if (CISList.length === 0) return [];

  let query = db
    .selectFrom("ansm_specialite_evenement")
    .where("cis", "in", CISList)
    .selectAll();
  if (code !== undefined) query = query.where("code_evenement", "=", code);

  return (await query.execute()).map(mapAnsmSafetyEvent);
}

export async function getEvents(CISList: string | string[]): Promise<SafetyEvent[]> {
  return queryEvents(Array.isArray(CISList) ? CISList : [CISList]);
}

export async function getReinforcedSurveillanceEvents(
  CISList: string[],
): Promise<SafetyEvent[]> {
  return queryEvents(CISList, REINFORCED_SURVEILLANCE_EVENT_CODE);
}

export async function getImportantInformationEvents(
  CISList: string[],
): Promise<SafetyEvent[]> {
  return queryEvents(CISList, IMPORTANT_INFORMATION_EVENT_CODE);
}
