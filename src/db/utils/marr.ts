"use server";

import "server-only";
import db from '@/db'
import { Marr, MarrPdf } from "@/types/MarrTypes";

export async function getMarr(CIS: string): Promise<Marr> {

    // Get list of MARR matching CIS
    // By assumption, only 1 MARR can be returned for each CIS code
    const rowsMarrCis = await db.selectFrom('ref_marr_url_cis')
        .select(['id', 'url', 'cis'])
        .where('cis', 'like', `%${CIS}%`)
        .execute();

    // Check if no MARR found
    if (rowsMarrCis.length === 0) {
        return {
            CIS: CIS,
            ansmUrl: "",
            pdf: [],
        };
    };

    // Check only one MARR is found
    if (rowsMarrCis.length > 1) {
        console.warn(`Multiple MARR entries found for CIS: ${CIS}. Returning the first one.`);
    };

    // Get all PDFs for all matching MARR URLs
    const matchingURLIds = rowsMarrCis.map((row) => String(row.url));
    const rowsMarrPdf = await db.selectFrom('ref_marr_url_pdf')
        .select(['url', 'nom_document', 'url_document', 'type'])
        .where('url', 'in', matchingURLIds)
        .execute();

    // Map PDFs to MarrPdf type
    const allPdfs = rowsMarrPdf.map((row) => mapDataBaseToMarrPdf(row));

    // Transform to Marr type
    // NB: By assumption, only 1 MAAR can be returned for each code CIS.
    return mapDataBaseToMarr(rowsMarrCis[0], allPdfs);
};

function mapDataBaseToMarr(row: any, pdfs?: MarrPdf[]): Marr {
    return {
        CIS: row.cis.trim() || "",
        ansmUrl: row.url.trim() || "",
        pdf: pdfs || [],
    };
};

function mapDataBaseToMarrPdf(row: any): MarrPdf {
    return {
        filename: row.nom_document.trim() || "",
        fileUrl: row.url_document ? `https://ansm.sante.fr${(row.url_document.trim() as string).trim()}` : "",
        type: row.type.trim() || "",
    };
};