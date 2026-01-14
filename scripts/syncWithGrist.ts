import db from "@/db";
import { Database } from "@/db/types";
import { getGristTableData } from "@/data/grist";

import { type Insertable } from "kysely";

// We're converting some values that are numeric in Grist to strings in our DB
const safeString = (val: any) => (val === null || val === undefined) ? null : String(val);

async function syncTable<TN extends keyof Database>(
    tableName: TN,
    gristTableId: string,
    gristColumns: string[],
    mapper: (record: any) => Insertable<Database[TN]>
) {
    console.log(`Fetching ${gristTableId} from Grist document ${process.env.GRIST_DOC_ID}...`);
    const gristData = await getGristTableData(gristTableId, gristColumns);

    if (!gristData.length) {
        console.warn(`⚠️ No data found for ${gristTableId}`);
        return;
    }

    // Mapping Grist records to our DB schema
    const rows = gristData.map((r, index) => {
        try {
            return mapper(r);
        } catch (e) {
            console.error(`❌ Error mapping line ${index} of table ${gristTableId}`, r);
            throw e;
        }
    });

    console.log(`Updating ${tableName} (${rows.length} rows)...`);

    await db.transaction().execute(async (trx) => {
        // Emptying table before inserting new data
        await trx.deleteFrom(tableName).execute();

        // Insert new data
        await trx.insertInto(tableName).values(rows).execute();
    });
}

async function main() {
    console.log("🚀 Starting Grist synchronization...");

    try {
        // 1. GLOSSAIRE
        await syncTable('ref_glossaire', 'Glossaire', ['Nom_glossaire', 'Definition_glossaire', 'Source'], (r) => ({
            nom: r.fields.Nom_glossaire,
            definition: r.fields.Definition_glossaire,
            source: r.fields.Source || null,
        }));

        // 2. ARTICLES
        await syncTable('ref_articles', 'Articles',
            ['Titre', 'Source', 'Contenu', 'Theme', 'Lien', 'Homepage', 'Image', 'Metadescription'],
            (r) => ({
                titre: r.fields.Titre,
                source: r.fields.Source,
                contenu: r.fields.Contenu,
                theme: r.fields.Theme,
                lien: r.fields.Lien,
                metadescription: r.fields.Metadescription,
                homepage: Boolean(r.fields.Homepage),
                image: r.fields.Image, // for now, an internal ID in Grist
            })
        );

        // 3. MARR (CIS & PDF)
        await syncTable('ref_marr_url_cis', 'MARR_URL_CIS', ['URL', 'CIS'], (r) => ({
            url: r.fields.URL,
            cis: safeString(r.fields.CIS),
        }));

        await syncTable('ref_marr_url_pdf', 'MARR_URL_PDF', ['URL', 'Nom_document', 'URL_document', 'Type'], (r) => ({
            url: safeString(r.fields.URL), // This is a ref to ref_marr_url_cis, so it will be an ID
            nom_document: r.fields.Nom_document,
            url_document: r.fields.URL_document,
            type: r.fields.Type,
        }));

        // 4. PATHOLOGIES
        await syncTable('ref_pathologies', 'Pathologies', ['codePatho', 'Definition_pathologie'], (r) => ({
            code_patho: safeString(r.fields.codePatho),
            definition: r.fields.Definition_pathologie,
        }));

        // 5. PEDIATRIE
        await syncTable('ref_pediatrie', 'Pediatrie',
            ['CIS', 'indication', 'contre_indication', 'avis', 'mention'],
            (r) => ({
                cis: safeString(r.fields.CIS),
                indication: r.fields.indication,
                contre_indication: r.fields.contre_indication,
                avis: r.fields.avis,
                mention: r.fields.mention,
            })
        );

        // 6. GROSSESSE
        await syncTable('ref_grossesse_substances_contre_indiquees', 'Grossesse_substances_contre_indiquees',
            ['SubsId', 'Lien_site_ANSM'],
            (r) => ({
                subs_id: safeString(r.fields.SubsId),
                lien_site_ansm: r.fields.Lien_site_ANSM,
            })
        );

        await syncTable('ref_grossesse_mention', 'Grossesse_mention', ['CIS'], (r) => ({
            cis: safeString(r.fields.CIS),
        }));

        // 7. SUBSTANCES ACTIVES
        await syncTable('ref_substance_active_definitions', 'Definitions_Substances_Actives',
            ['SubsId', 'NomId', 'SA', 'Definition'],
            (r) => ({
                subs_id: safeString(r.fields.SubsId),
                nom_id: safeString(r.fields.NomId),
                sa: r.fields.SA,
                definition: r.fields.Definition,
            })
        );

        // 8. ATC Friendly
        await syncTable('ref_atc_friendly_niveau_1', 'Table_Niveau_1',
            ['Lettre_1_ATC_1', 'Libelles_niveau_1', 'Definition_Classe'],
            (r) => ({
                code: r.fields.Lettre_1_ATC_1,
                libelle: r.fields.Libelles_niveau_1,
                definition_classe: r.fields.Definition_Classe,
            })
        );

        await syncTable('ref_atc_friendly_niveau_2', 'Table_Niveau_2',
            ['Lettre_2_ATC2', 'Libelles_niveau_2', 'Libelles_niveau_2_Definition_sous_classe'],
            (r) => ({
                code: r.fields.Lettre_2_ATC2,
                libelle: r.fields.Libelles_niveau_2,
                definition_sous_classe: r.fields.Libelles_niveau_2_Definition_sous_classe,
            })
        );

        console.log("✅ Synchronization complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Sync failed:", error);
        process.exit(1);
    }
}

main();