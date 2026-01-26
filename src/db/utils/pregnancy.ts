"use server";
import "server-cli-only";
import "server-only";

import { unstable_cache } from "next/cache";
import db from '@/db';
import { PregnancyAlert } from "@/types/PregancyTypes";

// Cache for 1 hour - this data rarely changes
export const getAllPregnancyPlanAlerts = unstable_cache(
    async function (): Promise<PregnancyAlert[]> {
        const rows = await db.selectFrom("ref_grossesse_substances_contre_indiquees")
            .select(["subs_id", "lien_site_ansm"])
            .execute();

        return rows.map((row) => ({
            id: row.subs_id?.trim() || "",
            link: row.lien_site_ansm?.trim() || "",
        }));
    },
    ["all-pregnancy-plan-alerts"],
    { revalidate: 3600 }
);

export const getAllPregnancyMentionAlerts = unstable_cache(
    async function (): Promise<string[]> {
        const rows = await db.selectFrom("ref_grossesse_mention")
            .select(["cis"])
            .execute();

        return rows.map((row) => row.cis?.trim() || "");
    },
    ["all-pregnancy-mention-alerts"],
    { revalidate: 3600 }
);

export async function getPregnancyMentionAlert(CIS: string): Promise<boolean> {
    const rows = await db.selectFrom("ref_grossesse_mention")
        .select(["cis"])
        .where("cis", "=", CIS)
        .execute();

    return rows.length > 0;
};
