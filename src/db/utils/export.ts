"use server";

import db from "..";
import { getGenericGroupsLabelsByCIS } from "./generics";
import { getRcpSectionText } from "@/utils/rcpHtml";
import {
  ExportSpecs,
  RCP_ANCHOR_BY_FIELD_KEY,
  RCP_EXPORT_FIELD_KEYS,
  RCP_SECTION_NUMBER_BY_FIELD_KEY,
} from "@/types/ExportTypes";
import { isAIP } from "@/utils/specialites";

export interface ExportFilters {
  subsIds?: string[];
  atc2Codes?: string[];
}

export async function getSpecialitesExport(filters: ExportFilters): Promise<ExportSpecs[]> {
  const subsIds = filters.subsIds ?? [];
  const atc2Codes = filters.atc2Codes ?? [];

  // No filter: do not export the whole table
  if (subsIds.length === 0 && atc2Codes.length === 0) return [];

  // All the filters are "or": one of the substances or one of the ATC classes
  const specialites: ExportSpecs[] = await db
    .selectFrom("resume_specialites")
    .selectAll()
    .where((eb) => eb.or([
      ...(subsIds.length > 0 ? [eb("subsIds", "&&", Array(subsIds))] : []),
      ...(atc2Codes.length > 0 ? [eb("atc2Code", "in", atc2Codes)] : []),
    ]))
    .orderBy("specName")
    .execute();
  if (specialites.length === 0) return specialites;

  //Generic group name
  const notAIPSpecIds = specialites
    .filter((spec) => !isAIP(spec))
    .map((spec) => spec.specId.trim());
  const genericGroupsByCIS = await getGenericGroupsLabelsByCIS(notAIPSpecIds);
  for (const spec of specialites) {
    spec.genericGroup = genericGroupsByCIS[spec.specId.trim()] ?? "";
  }

  const specIds = specialites.map((spec) => spec.specId.trim());

  //AMM Status
  const statutsAMM = await db
    .selectFrom("ansm_specialite")
    .select(["cis", "statut_amm"])
    .where("cis", "in", specIds)
    .execute();
  const statusByCIS = new Map(statutsAMM.map((s) => [s.cis.trim(), s.statut_amm]));
  for (const spec of specialites) {
    spec.ammActiveFrance = statusByCIS.get(spec.specId.trim()) === "ACTIVE";
  }

  //RCP data
  const codesCIS = specialites.map((spec) => Number(spec.specId.trim()));
  const rcpRows = await db
    .selectFrom("rcp")
    .select(["codeCIS", "content_html"])
    .where("codeCIS", "in", codesCIS)
    .execute();
  const contentHtmlByCIS = new Map(rcpRows.map((r) => [String(r.codeCIS), r.content_html]));
  for (const spec of specialites) {
    const contentHtml = contentHtmlByCIS.get(String(Number(spec.specId.trim())));
    if (!contentHtml) continue;
    for (const key of RCP_EXPORT_FIELD_KEYS) {
      spec[key] = getRcpSectionText(contentHtml, RCP_ANCHOR_BY_FIELD_KEY[key], RCP_SECTION_NUMBER_BY_FIELD_KEY[key]);
    }
  }

  return specialites;
}
