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
    return rows.map((row) => (mapDataBaseToDefinition(row)));
};

export async function getGlossaryDefinitionsByFirstLetter(firstLetter: string): Promise<Definition[]> {
    const rows = await db.selectFrom("ref_glossaire")
        .select(["nom", "definition", "source", "a_souligner"])
        .where("nom", "ilike", `${firstLetter}%`)
        .execute();

    // Map database fields to Definition interface which does not allow nulls
    return rows.map((row) => (mapDataBaseToDefinition(row)));
};

export async function getGlossaryLetters() {
    const letters = await db.selectFrom("ref_glossaire")
        .select(sql<string>`upper(substring(nom, 1, 1))`.as("letter"))
        .distinct()
        .orderBy("letter")
        .execute();

    return letters.map((row) => row.letter);
}

function mapDataBaseToDefinition(row: any): Definition {
    return {
        nom: row.nom || "",
        definition: row.definition || "",
        source: row.source || "",
        a_souligner: row.a_souligner || false,
    };
}