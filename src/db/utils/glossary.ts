"use server";

import db from '@/db';
import { Definition } from "@/types/GlossaireTypes";
import { sql } from "kysely";

export default async function getGlossaryDefinitions(): Promise<Definition[]> {
    const rows = await db.
        selectFrom("ref_glossaire").
        select(["nom", "definition", "source", "a_souligner"])
        .distinct()
        .execute();

    // Map database fields to Definition interface which does not allow nulls
    return rows.map((row) => ({
        nom: row.nom || "",
        definition: row.definition || "",
        source: row.source || "",
        a_souligner: row.a_souligner || false,
    }));
}
