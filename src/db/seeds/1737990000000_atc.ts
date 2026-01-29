import type { Kysely } from "kysely";
import { parse as csvParse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import path from "node:path";

const BATCH_SIZE = 500;

export async function seed(db: Kysely<any>): Promise<void> {
  // Load JSON data (ATC codes and labels)
  const atcJsonPath = path.join(__dirname, "data", "ATC 2024 02 15.json");
  const atcLabels: Record<string, string> = JSON.parse(
    readFileSync(atcJsonPath, "utf-8")
  );

  // Load CSV data (CIS to ATC mapping)
  const cisCsvPath = path.join(__dirname, "data", "CIS-ATC_2024-04-07.csv");
  const cisAtcRows = csvParse(readFileSync(cisCsvPath), {
    columns: true,
    skip_empty_lines: true,
  }) as Array<{ "Code CIS": string; "Code ATC": string; "Libellé ATC": string }>;

  // Seed `atc` postgre table
  console.log(`Seeding atc table with ${Object.keys(atcLabels).length} entries...`);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("atc").execute();

    const atcEntries = Object.entries(atcLabels).map(([code, label]) => ({
      code,
      label,
    }));

    for (let i = 0; i < atcEntries.length; i += BATCH_SIZE) {
      const batch = atcEntries.slice(i, i + BATCH_SIZE);
      await trx.insertInto("atc").values(batch).execute();
    }
  });
  console.log("Done seeding atc table.");

  // Seed `cis_atc` postgre table
  console.log(`Seeding cis_atc table with ${cisAtcRows.length} entries...`);
  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("cis_atc").execute();

    const cisAtcEntries = cisAtcRows.map((row) => ({
      code_cis: row["Code CIS"],
      code_atc: row["Code ATC"],
      label_atc: row["Libellé ATC"],
    }));

    for (let i = 0; i < cisAtcEntries.length; i += BATCH_SIZE) {
      const batch = cisAtcEntries.slice(i, i + BATCH_SIZE);
      await trx.insertInto("cis_atc").values(batch).execute();
    }
  });
  console.log("Done seeding cis_atc table.");
}
