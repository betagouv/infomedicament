"use server"

import { cacheLife } from "next/cache";
import db from '@/db/'
import { AllPediatricsInfo, PediatricsInfo } from "@/types/PediatricTypes";
import { isOuiOrNon } from "@/utils/pediatrics";

// Cache for 1 hour - this data rarely changes
export async function getAllPediatrics(): Promise<AllPediatricsInfo[]> {
  "use cache: remote";
        cacheLife("hourly");

        const rows = await db.selectFrom("ref_pediatrie")
            .select(["cis", "contre_indication"])
            .execute();

        return rows.map((row) => (
            {
                CIS: row.cis ? row.cis.toString().trim() : "",
                contraindication: row.contre_indication ? row.contre_indication : false,
            }));
}

export async function getPediatrics(
    CIS: string,
): Promise<PediatricsInfo | undefined> {
    const rows = await db.selectFrom("ref_pediatrie")
        .select(["cis", "contre_indication"])
        .where("cis", "=", CIS)
        .execute();

    if (!rows || rows.length === 0) {
        return;
    }

    if (rows.length > 1) {
        console.warn(`Multiple pediatrics records found for CIS ${CIS}. Keeping the first one.`);
    }
    const record = rows[0];

    if (record)
        return {
            contraindication: record.contre_indication ? record.contre_indication : false,
        };
};
