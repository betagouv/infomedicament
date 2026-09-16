import db from "@/db";
import type { Transaction } from "kysely";
import type {
  AnsmComposant,
  AnsmSubstanceNom,
  Indication,
  LetterType,
  ResumeGeneric,
  ResumeIndication,
  ResumeSpecialiteDB,
  ResumeSpecGroupDB,
  ResumeSubstance,
  Database,
} from "@/db/types";
import { getReinforcedSurveillanceEvents } from "@/db/utils/safety";
import { requireNonEmpty } from "@/db/utils/refreshGuard";
import {
  mapCatalogSpecialite,
  VISIBLE_SPECIALITE_AVAILABILITIES,
} from "@/db/utils/specialiteCatalog";
import { groupGeneNameToDCI } from "@/displayUtils";
import { getNormalizeLetter } from "@/utils/alphabeticNav";
import { getAtc1Code, getAtc2Code } from "@/utils/atc";
import {
  getSpecialiteGroupName,
  groupSpecialites,
  isSurveillanceRenforcee,
} from "@/utils/specialites";
import type { Specialite } from "@/types/SpecialiteTypes";

type DataToResumeType = LetterType | "specialites";
type ComponentRow = Pick<
  AnsmComposant,
  | "cis"
  | "numero_element"
  | "numero_composant"
  | "ordre"
  | "nature"
  | "code_substance"
  | "substance"
>;

const INSERT_CHUNK_SIZE = 500;

function normalizeName(value: string | null): string {
  return (value ?? "").trim().toLocaleLowerCase("fr-FR");
}

function componentKey(row: ComponentRow): string {
  return `${row.numero_element}:${row.ordre ?? row.numero_composant}`;
}

function preferredName(
  component: ComponentRow,
  namesByCode: Map<string, AnsmSubstanceNom[]>,
): { id: string; label: string } {
  const code = component.code_substance?.trim() ?? "";
  const names = namesByCode.get(code) ?? [];
  const exact = names.filter(
    (name) => normalizeName(name.nom) === normalizeName(component.substance),
  );
  const selected =
    exact.find((name) => name.type === "CANONIQUE") ??
    exact.sort((left, right) =>
      left.code_nom.localeCompare(right.code_nom),
    )[0] ??
    names.find((name) => name.type === "CANONIQUE") ??
    [...names].sort((left, right) =>
      left.code_nom.localeCompare(right.code_nom),
    )[0];
  return {
    id: selected?.code_nom.trim() ?? code,
    label: component.substance?.trim() || selected?.nom?.trim() || "",
  };
}

function displayComponentNames(rows: ComponentRow[]): string {
  const grouped = new Map<string, ComponentRow[]>();
  for (const row of rows) {
    const values = grouped.get(componentKey(row)) ?? [];
    values.push(row);
    grouped.set(componentKey(row), values);
  }
  return [...grouped.values()]
    .flatMap((values) => {
      const fractions = values.filter(
        (row) => row.nature === "Fraction active",
      );
      return fractions.length > 0 ? fractions : values;
    })
    .map((row) => row.substance?.trim() ?? "")
    .filter(Boolean)
    .join(", ");
}

function collectLetters(values: string[]): string[] {
  return [
    ...new Set(
      values.map((value) => getNormalizeLetter(value.substring(0, 1))),
    ),
  ]
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

async function replaceLetters(
  trx: Transaction<Database>,
  type: LetterType,
  letters: string[],
): Promise<void> {
  requireNonEmpty(`${type} letters`, letters);
  await trx.deleteFrom("letters").where("type", "=", type).execute();
  await trx.insertInto("letters").values({ type, letters }).execute();
}

async function getVisibleSpecialities(): Promise<Specialite[]> {
  const rows = await db
    .selectFrom("ansm_specialite")
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .orderBy("denomination")
    .execute();
  return rows.map(mapCatalogSpecialite);
}

async function createResumeIndications(): Promise<void> {
  const [indications, specialites] = await Promise.all([
    db.selectFrom("indications").selectAll().execute(),
    getVisibleSpecialities(),
  ]);
  requireNonEmpty("indications", indications);
  requireNonEmpty("visible specialities", specialites);

  const specialiteByCis = new Map(specialites.map((row) => [row.SpecId, row]));
  const rows: ResumeIndication[] = indications.flatMap((indication) => {
    const groups = indication.CIS.flatMap((cis) => {
      const specialite = specialiteByCis.get(cis);
      return specialite ? [getSpecialiteGroupName(specialite)] : [];
    });
    return groups.length === 0
      ? []
      : [
          {
            idIndication: indication.id,
            nomIndication: indication.nom,
            specialites: groups.length,
          },
        ];
  });
  requireNonEmpty("resume indications", rows);
  const letters = collectLetters(indications.map((row) => row.nom));

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("resume_indications").execute();
    await trx.insertInto("resume_indications").values(rows).execute();
    await replaceLetters(trx, "indications", letters);
  });
  console.log(
    `resume_indications: ${rows.length} rows; letters: ${letters.length}`,
  );
}

async function createResumeSubstances(): Promise<void> {
  const [components, names] = await Promise.all([
    db
      .selectFrom("ansm_composant")
      .innerJoin("ansm_specialite", "ansm_specialite.cis", "ansm_composant.cis")
      .where(
        "ansm_specialite.disponibilite",
        "in",
        VISIBLE_SPECIALITE_AVAILABILITIES,
      )
      .select([
        "ansm_composant.cis",
        "ansm_composant.numero_element",
        "ansm_composant.numero_composant",
        "ansm_composant.ordre",
        "ansm_composant.nature",
        "ansm_composant.code_substance",
        "ansm_composant.substance",
        "ansm_specialite.denomination",
      ])
      .execute(),
    db.selectFrom("ansm_substance_nom").selectAll().execute(),
  ]);
  requireNonEmpty("visible speciality components", components);
  requireNonEmpty("substance names", names);

  const namesByCode = new Map<string, AnsmSubstanceNom[]>();
  for (const name of names) {
    const values = namesByCode.get(name.code_substance) ?? [];
    values.push(name);
    namesByCode.set(name.code_substance, values);
  }
  const byCis = new Map<string, typeof components>();
  for (const component of components) {
    const values = byCis.get(component.cis) ?? [];
    values.push(component);
    byCis.set(component.cis, values);
  }

  const grouped = new Map<
    string,
    { SubsId: string; NomId: string; NomLib: string; groups: Set<string> }
  >();
  for (const rows of byCis.values()) {
    if (new Set(rows.map(componentKey)).size !== 1) continue;
    const component =
      rows.find((row) => row.nature === "Fraction active") ?? rows[0];
    const name = preferredName(component, namesByCode);
    if (!name.id || !name.label) continue;
    const current = grouped.get(name.id) ?? {
      SubsId: component.code_substance?.trim() ?? "",
      NomId: name.id,
      NomLib: name.label,
      groups: new Set<string>(),
    };
    current.groups.add(getSpecialiteGroupName(component.denomination ?? ""));
    grouped.set(name.id, current);
  }

  const rows: ResumeSubstance[] = [...grouped.values()].map((row) => ({
    SubsId: row.SubsId,
    NomId: row.NomId,
    NomLib: row.NomLib,
    specialites: row.groups.size,
  }));
  requireNonEmpty("resume substances", rows);
  const letters = collectLetters(rows.map((row) => row.NomLib));

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("resume_substances").execute();
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
      await trx
        .insertInto("resume_substances")
        .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
        .execute();
    }
    await replaceLetters(trx, "substances", letters);
  });
  console.log(
    `resume_substances: ${rows.length} rows; letters: ${letters.length}`,
  );
}

async function loadSpecialityResumeSources() {
  const specialites = await getVisibleSpecialities();
  requireNonEmpty("visible specialities", specialites);
  const cis = specialites.map((row) => row.SpecId);
  const [
    components,
    atcs,
    indications,
    events,
    pregnancyPlans,
    pregnancyMentions,
    pediatrics,
  ] = await Promise.all([
    db
      .selectFrom("ansm_composant")
      .where("cis", "in", cis)
      .select([
        "cis",
        "numero_element",
        "numero_composant",
        "ordre",
        "nature",
        "code_substance",
        "substance",
      ])
      .execute(),
    db
      .selectFrom("cis_atc")
      .innerJoin("atc", "atc.code_terme", "cis_atc.code_terme_atc")
      .where("cis_atc.code_cis", "in", cis)
      .select(["cis_atc.code_cis", "atc.code"])
      .execute(),
    db.selectFrom("indications").selectAll().execute(),
    getReinforcedSurveillanceEvents(cis),
    db
      .selectFrom("ref_grossesse_substances_contre_indiquees")
      .select("subs_id")
      .execute(),
    db.selectFrom("ref_grossesse_mention").select("cis").execute(),
    db
      .selectFrom("ref_pediatrie")
      .select(["cis", "contre_indication"])
      .execute(),
  ]);
  requireNonEmpty("visible speciality components", components);
  requireNonEmpty("ATC relationships", atcs);
  requireNonEmpty("indications", indications);
  requireNonEmpty("reinforced-surveillance events", events);

  const componentsByCis = new Map<string, ComponentRow[]>();
  for (const component of components) {
    const values = componentsByCis.get(component.cis) ?? [];
    values.push(component);
    componentsByCis.set(component.cis, values);
  }
  const atcByCis = new Map(
    atcs.flatMap((row) =>
      row.code_cis && row.code ? [[row.code_cis, row.code] as const] : [],
    ),
  );
  const eventsByCis = new Map<string, typeof events>();
  for (const event of events) {
    const values = eventsByCis.get(event.specialiteId) ?? [];
    values.push(event);
    eventsByCis.set(event.specialiteId, values);
  }

  return {
    specialites,
    componentsByCis,
    atcByCis,
    indications,
    eventsByCis,
    pregnancyPlanIds: new Set(
      pregnancyPlans.flatMap((row) =>
        row.subs_id ? [String(Number(row.subs_id.trim()))] : [],
      ),
    ),
    pregnancyMentionCis: new Set(
      pregnancyMentions.flatMap((row) => (row.cis ? [row.cis.trim()] : [])),
    ),
    pediatricCis: new Set(
      pediatrics.flatMap((row) =>
        row.cis && row.contre_indication ? [row.cis.trim()] : [],
      ),
    ),
  };
}

function indicationsForCis(indications: Indication[], cis: string[]) {
  const cisSet = new Set(cis);
  return indications.filter((indication) =>
    indication.CIS.some((value: string) => cisSet.has(value)),
  );
}

function atcValues(code: string | undefined) {
  return {
    atc1Code: code ? getAtc1Code(code) : undefined,
    atc2Code: code ? getAtc2Code(code) : undefined,
    atc5Code: code,
  };
}

async function createResumeMedicaments(): Promise<void> {
  const source = await loadSpecialityResumeSources();
  const rows: ResumeSpecGroupDB[] = groupSpecialites(source.specialites).map(
    ([groupName, specialites]) => {
      const cis = specialites.map((row) => row.SpecId.trim());
      const components =
        source.componentsByCis.get(specialites[0].SpecId) ?? [];
      const indications = indicationsForCis(source.indications, cis);
      const atc = source.atcByCis.get(specialites[0].SpecId);
      return {
        groupName,
        composants: displayComponentNames(components),
        specialites: specialites.map((specialite) => [
          specialite.SpecId,
          specialite.SpecDenom01,
          specialite.StatutBdm.toString(),
          specialite.ProcId,
          isSurveillanceRenforcee(
            source.eventsByCis.get(specialite.SpecId) ?? [],
          ).toString(),
        ]),
        indicationsIds: indications.map((row) => row.id),
        ...atcValues(atc),
        CISList: cis,
        subsIds: [
          ...new Set(
            components.flatMap((row) =>
              row.code_substance ? [row.code_substance.trim()] : [],
            ),
          ),
        ],
        indicationsIdsNames: indications.map((row) => [
          row.id.toString(),
          row.nom,
        ]),
      };
    },
  );
  requireNonEmpty("resume medicines", rows);
  const letters = collectLetters(rows.map((row) => row.groupName));

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("resume_medicaments").execute();
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
      await trx
        .insertInto("resume_medicaments")
        .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
        .execute();
    }
    await replaceLetters(trx, "medicaments", letters);
  });
  console.log(
    `resume_medicaments: ${rows.length} rows; letters: ${letters.length}`,
  );
}

async function createResumeGeneriques(): Promise<void> {
  const generics = await db
    .selectFrom("ansm_groupe_generique")
    .innerJoin(
      "ansm_specialite_groupe_generique",
      "ansm_specialite_groupe_generique.code_groupe",
      "ansm_groupe_generique.code_groupe",
    )
    .innerJoin(
      "ansm_specialite",
      "ansm_specialite.cis",
      "ansm_specialite_groupe_generique.cis",
    )
    .where(
      "ansm_specialite.disponibilite",
      "in",
      VISIBLE_SPECIALITE_AVAILABILITIES,
    )
    .where((eb) =>
      eb.or([
        eb("ansm_specialite.procedure", "is", null),
        eb("ansm_specialite.procedure", "!=", "IMPORTATION_PARALLELE"),
      ]),
    )
    .select([
      "ansm_groupe_generique.code_groupe",
      "ansm_groupe_generique.libelle",
    ])
    .distinct()
    .execute();
  requireNonEmpty("visible generic groups", generics);

  const rows: ResumeGeneric[] = generics.map((row) => ({
    SpecId: row.code_groupe.toString(),
    SpecName: groupGeneNameToDCI(row.libelle ?? "")
      .split(" ")
      .map((word) =>
        /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
      )
      .join(" "),
  }));
  const letters = collectLetters(rows.map((row) => row.SpecName));

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("resume_generiques").execute();
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
      await trx
        .insertInto("resume_generiques")
        .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
        .execute();
    }
    await replaceLetters(trx, "generiques", letters);
  });
  console.log(
    `resume_generiques: ${rows.length} rows; letters: ${letters.length}`,
  );
}

async function createResumeSpecialites(): Promise<void> {
  const source = await loadSpecialityResumeSources();
  const rows: ResumeSpecialiteDB[] = source.specialites.map(
    (specialite: Specialite) => {
      const components = source.componentsByCis.get(specialite.SpecId) ?? [];
      const indications = indicationsForCis(source.indications, [
        specialite.SpecId,
      ]);
      const atc = source.atcByCis.get(specialite.SpecId);
      return {
        specId: specialite.SpecId.trim(),
        specName: specialite.SpecDenom01.trim(),
        groupName: getSpecialiteGroupName(specialite),
        composants: displayComponentNames(components),
        subsIds: [
          ...new Set(
            components.flatMap((row) =>
              row.code_substance ? [row.code_substance.trim()] : [],
            ),
          ),
        ],
        indicationsIds: indications.map((row) => row.id),
        indicationsIdsNames: indications.map((row) => [
          row.id.toString(),
          row.nom,
        ]),
        ...atcValues(atc),
        ProcId: specialite.ProcId,
        isSurveillanceRenforcee: isSurveillanceRenforcee(
          source.eventsByCis.get(specialite.SpecId) ?? [],
        ),
        StatutBdm: specialite.StatutBdm,
        isAlertPregnancyPlan: components.some(
          (row) =>
            row.code_substance &&
            source.pregnancyPlanIds.has(
              String(Number(row.code_substance.trim())),
            ),
        ),
        isAlertPregnancyMention: source.pregnancyMentionCis.has(
          specialite.SpecId,
        ),
        isAlertPediatricContraindication: source.pediatricCis.has(
          specialite.SpecId,
        ),
      };
    },
  );
  requireNonEmpty("resume specialities", rows);

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("resume_specialites").execute();
    for (let i = 0; i < rows.length; i += INSERT_CHUNK_SIZE) {
      await trx
        .insertInto("resume_specialites")
        .values(rows.slice(i, i + INSERT_CHUNK_SIZE))
        .execute();
    }
  });
  console.log(`resume_specialites: ${rows.length} rows`);
}

async function run(target: DataToResumeType): Promise<void> {
  if (target === "indications") return createResumeIndications();
  if (target === "substances") return createResumeSubstances();
  if (target === "medicaments") return createResumeMedicaments();
  if (target === "generiques") return createResumeGeneriques();
  return createResumeSpecialites();
}

const target = process.argv[2];
const validTargets: DataToResumeType[] = [
  "indications",
  "substances",
  "medicaments",
  "generiques",
  "specialites",
];
if (!validTargets.includes(target as DataToResumeType)) {
  console.error(
    `Usage: npx tsx scripts/updateResumeData.ts ${validTargets.join("|")}`,
  );
  process.exitCode = 1;
} else {
  run(target as DataToResumeType)
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(`updateResumeData ${target} failed:`, error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.destroy();
    });
}
