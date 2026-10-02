"use server";

import db from "..";
import { getGenericGroupsLabelsByCIS } from "./generics";
import { getRcpSectionText } from "@/utils/rcpHtml";
import {
  ExtractionFieldKey,
  ExtractionRow,
  RCP_ANCHOR_BY_FIELD_KEY,
  RCP_EXTRACTION_FIELD_KEYS,
  RCP_SECTION_NUMBER_BY_FIELD_KEY,
} from "@/types/ExtractionTypes";

export interface ExtractionFilters {
  subsIds?: string[];
  atc2Codes?: string[];
}

export async function getMedicamentsExtract(
  filters: ExtractionFilters,
  fieldKeys: ExtractionFieldKey[] = [],
): Promise<ExtractionRow[]> {
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

  const rows: ExtractionRow[] = await query.orderBy("specName").execute();
  if (rows.length === 0) return rows;

  const specIds = rows.map((row) => row.specId.trim());

  if (fieldKeys.includes("genericGroup")) {
    const genericGroupByCIS = await getGenericGroupsLabelsByCIS(specIds);
    for (const row of rows) {
      row.genericGroup = genericGroupByCIS[row.specId.trim()] ?? "";
    }
  }

  if (fieldKeys.includes("ammActiveFrance")) {
    const statuses = await db
      .selectFrom("ansm_specialite")
      .select(["cis", "statut_amm"])
      .where("cis", "in", specIds)
      .execute();
    const statusByCIS = new Map(statuses.map((s) => [s.cis.trim(), s.statut_amm]));

    for (const row of rows) {
      row.ammActiveFrance = statusByCIS.get(row.specId.trim()) === "ACTIVE";
    }
  }

  const rcpFieldKeys = RCP_EXTRACTION_FIELD_KEYS.filter((key) => fieldKeys.includes(key));
  if (rcpFieldKeys.length > 0) {
    const cisNumbers = rows.map((row) => Number(row.specId.trim()));
    const rcpRows = await db
      .selectFrom("rcp")
      .select(["codeCIS", "content_html"])
      .where("codeCIS", "in", cisNumbers)
      .execute();
    const contentHtmlByCIS = new Map(rcpRows.map((r) => [r.codeCIS, r.content_html]));

    for (const row of rows) {
      const contentHtml = contentHtmlByCIS.get(Number(row.specId.trim()));
      if (!contentHtml) continue;
      for (const key of rcpFieldKeys) {
        const anchor = RCP_ANCHOR_BY_FIELD_KEY[key];
        if (anchor) row[key] = getRcpSectionText(contentHtml, anchor, RCP_SECTION_NUMBER_BY_FIELD_KEY[key]);
      }
    }
  }

  return rows;
}
