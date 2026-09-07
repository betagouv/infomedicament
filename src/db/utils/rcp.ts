"use server";

import db from "@/db";
import { RcpData } from "@/types/SpecialiteTypes";

export async function getRCP(CIS: string): Promise<RcpData | undefined> {
  const rcpRaw = await db
    .selectFrom("rcp")
    .selectAll()
    .where("codeCIS", "=", parseInt(CIS))
    .executeTakeFirst();

  if (!rcpRaw) return undefined;

  const rcp: RcpData = {
    codeCIS: rcpRaw.codeCIS,
    title: rcpRaw.title,
    dateNotif: rcpRaw.dateNotif,
    contentHtml: rcpRaw.content_html ?? "",
  };

  return rcp;
}
