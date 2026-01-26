"use server"

import { unstable_cache } from "next/cache";
import db from '@/db/'
import { AllPediatricsInfo, PediatricsInfo } from "@/types/PediatricTypes";
import { isOuiOrNon } from "@/utils/pediatrics";

// Cache for 1 hour - this data rarely changes
export const getAllPediatrics = unstable_cache(
    async function (): Promise<AllPediatricsInfo[]> {
        const rows = await db.selectFrom("ref_pediatrie")
            .select(["cis", "indication", "contre_indication", "avis", "mention"])
            .execute();

        return rows.map((row) => (
            {
                CIS: row.cis ? row.cis.toString().trim() : "",
                indication: row.indication ? row.indication.toString().trim() === "oui" : false,
                contraindication: row.contre_indication ? row.contre_indication.toString().trim() === "oui" : false,
                doctorAdvice: row.avis ? row.avis.toString().trim() === "oui" : false,
                mention: row.mention ? row.mention.toString().trim() === "oui" : false,
            }));
    },
    ["all-pediatrics"],
    { revalidate: 3600 }
);

export async function getPediatrics(
    CIS: string,
): Promise<PediatricsInfo | undefined> {
    const rows = await db.selectFrom("ref_pediatrie")
        .select(["cis", "indication", "contre_indication", "avis", "mention"])
        .where("cis", "=", CIS)
        .execute();

    if (!rows || rows.length === 0) {
        return;
    }

    if (rows.length > 1) {
        console.warn(`Multiple pediatrics records found for CIS ${CIS}. Keeping the first one.`);
    }
    const record = rows[0];

    if (
        !isOuiOrNon(record.indication) ||
        !isOuiOrNon(record.contre_indication) ||
        !isOuiOrNon(record.avis) ||
        !isOuiOrNon(record.mention)
    ) {
        throw new Error(
            `Unexpected value in pediatrics data for CIS ${CIS}: ${JSON.stringify(
                record,
            )}`,
        );
    }

    if (record)
        return {
            indication: record.indication.trim() === "oui",
            contraindication: record.contre_indication.trim() === "oui",
            doctorAdvice: record.avis.trim() === "oui",
            mention: record.mention.trim() === "oui",
        };
};