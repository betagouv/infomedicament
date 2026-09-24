import db from "@/db";

export async function getEenLabelsByCis(
  cisList: readonly string[],
): Promise<Map<string, string>> {
  const uniqueCis = [...new Set(cisList)];
  if (uniqueCis.length === 0) return new Map();

  const rows = await db
    .selectFrom("ansm_specialite_excipient_effet_notoire")
    .innerJoin(
      "ansm_excipient_effet_notoire",
      "ansm_excipient_effet_notoire.code",
      "ansm_specialite_excipient_effet_notoire.code_excipient",
    )
    .where("ansm_specialite_excipient_effet_notoire.cis", "in", uniqueCis)
    .where("ansm_excipient_effet_notoire.libelle", "is not", null)
    .select([
      "ansm_specialite_excipient_effet_notoire.cis",
      "ansm_specialite_excipient_effet_notoire.code_excipient",
      "ansm_excipient_effet_notoire.libelle",
    ])
    .orderBy("ansm_specialite_excipient_effet_notoire.cis")
    .orderBy("ansm_specialite_excipient_effet_notoire.code_excipient")
    .execute();

  const labelsByCis = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.libelle) continue;
    const labels = labelsByCis.get(row.cis) ?? [];
    labels.push(row.libelle);
    labelsByCis.set(row.cis, labels);
  }

  return new Map(
    [...labelsByCis].map(([cis, labels]) => [cis, labels.join(", ")]),
  );
}

export async function getEenLabel(cis: string): Promise<string | null> {
  const labelsByCis = await getEenLabelsByCis([cis]);
  return labelsByCis.get(cis) ?? null;
}
