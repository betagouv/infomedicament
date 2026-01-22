"use server";

import "server-only";
import db from '@/db';
import { PregnancyAlert } from "@/types/PregancyTypes";

export async function getAllPregnancyPlanAlerts(): Promise<PregnancyAlert[]> {
    const rows = await db.selectFrom("ref_grossesse_substances_contre_indiquees")
        .select(["subs_id", "lien_site_ansm"])
        .execute();

    return rows.map((row) => ({
        id: row.subs_id?.trim() || "",
        link: row.lien_site_ansm?.trim() || "",
    }));
}

export async function getAllPregnancyMentionAlerts(): Promise<string[]> {
    const rows = await db.selectFrom("ref_grossesse_mention")
        .select(["cis"])
        .execute();

    return rows.map((row) => row.cis?.trim() || "");
}

export async function getPregnancyMentionAlert(CIS: string): Promise<boolean> {
    const rows = await db.selectFrom("ref_grossesse_mention")
        .select(["cis"])
        .where("cis", "=", CIS)
        .execute();

    return rows.length > 0;
}
