"use server";

import db from "..";
import { getGenericGroupsLabelsByCIS } from "./generics";
import { getRcpSectionText } from "@/utils/rcpHtml";
import {
  ExportFieldKey,
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

export async function getSpecialitesExport(
  filters: ExportFilters,
  fieldKeys: ExportFieldKey[] = [],
): Promise<ExportSpecs[]> {
  const subsIds = filters.subsIds ?? [];
  const atc2Codes = filters.atc2Codes ?? [];

  // All the filters are "or": one of the substances or one of the ATC classes
  let query = db.selectFrom("resume_specialites").selectAll();
  if (subsIds.length > 0 || atc2Codes.length > 0) {
    query = query.where((eb) => eb.or([
      ...(subsIds.length > 0 ? [eb("subsIds", "&&", Array(subsIds))] : []),
      ...(atc2Codes.length > 0 ? [eb("atc2Code", "in", atc2Codes)] : []),
    ]));
  }

  const specialites: ExportSpecs[] = await query.orderBy("specName").execute();
  if (specialites.length === 0) return specialites;

  //Generic group name
  const notAIPSpecIds = specialites
    .filter((spec) => !isAIP(spec))
    .map((spec) => spec.specId.trim());
  if (fieldKeys.includes("genericGroup")) {
    const genericGroupsByCIS = await getGenericGroupsLabelsByCIS(notAIPSpecIds);
    for (const spec of specialites) {
      spec.genericGroup = genericGroupsByCIS[spec.specId.trim()] ?? "";
    }
  }

  const specIds = specialites.map((spec) => spec.specId.trim());

  //AMM Status
  if (fieldKeys.includes("ammActiveFrance")) {
    const statutsAMM = await db
      .selectFrom("ansm_specialite")
      .select(["cis", "statut_amm"])
      .where("cis", "in", specIds)
      .execute();
    const statusByCIS = new Map(statutsAMM.map((s) => [s.cis.trim(), s.statut_amm]));

    for (const spec of specialites) {
      spec.ammActiveFrance = statusByCIS.get(spec.specId.trim()) === "ACTIVE";
    }
  }

  //RCP data
  const rcpFielsdKeys = RCP_EXPORT_FIELD_KEYS.filter((key) => fieldKeys.includes(key));
  if (rcpFielsdKeys.length > 0) {
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
      for (const key of rcpFielsdKeys) {
        const anchor = RCP_ANCHOR_BY_FIELD_KEY[key];
        if (anchor) spec[key] = getRcpSectionText(contentHtml, anchor, RCP_SECTION_NUMBER_BY_FIELD_KEY[key]);
      }
    }
  }

  return specialites;
}
