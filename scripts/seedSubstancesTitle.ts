/**
 * Fills the title of the substances pages:
 * - resume_substances.title: title of the page of the substance
 * - resume_specialites.subsTitle: title of the page of the substances of the specialite
 */

import db from "@/db";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { getSubstancesNames } from "@/db/utils/substances";
import { getSubstanceSpecsGroups } from "@/db/utils/specialities";
import { getSubstancesPageNames, hasAllSubstances } from "@/utils/substances";

// Number of pages titles computed at the same time
const BATCH_SIZE = 10;

// Title of the substances page, null if a substance is not found
async function getPageTitle(subsIds: string[]): Promise<string | null> {
  const substances = await getSubstancesNames(subsIds) ?? [];
  if (!hasAllSubstances(subsIds, substances)) return null;
  const specsGroups = await getSubstanceSpecsGroups(subsIds);
  return getSubstancesPageNames(subsIds, substances, specsGroups).title;
}

// Titles by the substances ids joined by ","
async function getPagesTitles(subsIdsList: string[][]): Promise<Map<string, string | null>> {
  const titles = new Map<string, string | null>();
  for (let index = 0; index < subsIdsList.length; index += BATCH_SIZE) {
    const batch = subsIdsList.slice(index, index + BATCH_SIZE);
    const batchTitles = await Promise.all(batch.map((subsIds) => getPageTitle(subsIds)));
    batch.forEach((subsIds, batchIndex) => titles.set(subsIds.join(","), batchTitles[batchIndex]));
  }
  return titles;
}

export async function seedTitles(): Promise<void> {
  // Substances
  const substancesRows = await db
    .selectFrom("resume_substances")
    .select("SubsId")
    .distinct()
    .execute();
  const subsIds = [...new Set(substancesRows.map((row) => row.SubsId.trim()))];
  const substancesTitles = await getPagesTitles(subsIds.map((subsId) => [subsId]));
  for (const [subsId, title] of substancesTitles) {
    await db
      .updateTable("resume_substances")
      .set({ title })
      .where((eb) => eb.fn("trim", ["SubsId"]), "=", subsId)
      .execute();
  }
  console.log(`resume_substances: ${substancesTitles.size} substances titles`);

  // Specialites, grouped by their substances (in the order of the specialite)
  const specialitesRows = await db
    .selectFrom("resume_specialites")
    .select(["specId", "subsIds"])
    .execute();
  const specIdsBySubsIds = new Map<string, { subsIds: string[], specIds: string[] }>();
  specialitesRows.forEach((row) => {
    const rowSubsIds = (row.subsIds ?? []).map((subsId) => subsId.trim());
    if (rowSubsIds.length === 0) return;
    const key = rowSubsIds.join(",");
    const current = specIdsBySubsIds.get(key) ?? { subsIds: rowSubsIds, specIds: [] };
    current.specIds.push(row.specId);
    specIdsBySubsIds.set(key, current);
  });
  const specialitesTitles = await getPagesTitles([...specIdsBySubsIds.values()].map(({ subsIds }) => subsIds));
  for (const [key, { specIds }] of specIdsBySubsIds) {
    await db
      .updateTable("resume_specialites")
      .set({ subsTitle: specialitesTitles.get(key) ?? null })
      .where("specId", "in", specIds)
      .execute();
  }
  console.log(`resume_specialites: ${specialitesTitles.size} substances titles for ${specialitesRows.length} specialites`);
}

seedTitles()
  // The MySQL pool is opened by the specialites utils import
  .then(() => Promise.all([db.destroy(), pdbmMySQL.destroy()]))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
