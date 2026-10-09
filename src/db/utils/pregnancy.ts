"use server";
import "server-cli-only";


import db from '@/db';
import { PregnancyAlert } from "@/types/PregancyTypes";

// Cache for 1 hour - this data rarely changes
export async function getAllPregnancyPlanAlerts(): Promise<PregnancyAlert[]> {
  "use cache: remote";
        const rows = await db.selectFrom("ref_grossesse_substances_contre_indiquees")
            .select(["subs_id", "lien_site_ansm"])
            .execute();

        return rows.flatMap((row) => {
            const id = row.subs_id?.trim();
            return id ? [{ id, link: row.lien_site_ansm?.trim() || "" }] : [];
        });
    }

export async function getAllPregnancyMentionAlerts(): Promise<string[]> {
  "use cache: remote";
        const rows = await db.selectFrom("ref_grossesse_mention")
            .select(["cis"])
            .execute();

        return rows.map((row) => row.cis?.trim() || "");
    }

export async function getPregnancyMentionAlert(CIS: string): Promise<boolean> {
  "use cache: remote";

    const rows = await db.selectFrom("ref_grossesse_mention")
        .select(["cis"])
        .where("cis", "=", CIS)
        .execute();

    return rows.length > 0;
};
