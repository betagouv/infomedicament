import "server-cli-only";
import { sql, type Kysely } from "kysely";
import defaultDatabase from "@/db";
import type { Database } from "@/db/types";
import type { SearchFilter, SearchResultItem } from "@/types/SearchTypes";
import type { ResumeSpecialite } from "@/types/SpecialiteTypes";
import {
  type AdvancedSearchCriteria,
  type MatchMode,
  MAX_ADVANCED_SEARCH_RESULTS,
  ADVANCED_PAGE_SIZE,
  hasAdvancedSearchCriteria,
  type AdvancedResultOptions,
} from "@/utils/advancedSearch";
import { normalizeString } from "@/utils/alphabeticNav";
import {
  getSpecialiteGroupName,
  isSurveillanceRenforcee,
} from "@/utils/specialites";
import { getResumeSpecsATCLabels } from "./atc";
import {
  disponibiliteToStatutBdm,
  statutAmmToDisplayStatus,
  getAuthorizationSourceStatuses,
} from "./specialiteCatalog";
import {
  commercialStatusToDisplayStatus,
  getPresentationSourceStatuses,
} from "./presentationCatalog";
import {
  getAllPregnancyPlanAlerts,
  getAllPregnancyMentionAlerts,
} from "./pregnancy";
import { getAllPediatrics } from "./pediatrics";
import { findPregnancyPlanAlert } from "./pregnancyCatalog";
import {
  mapAnsmSafetyEvent,
  REINFORCED_SURVEILLANCE_EVENT_CODE,
} from "./safetyCatalog";

function normalized(column: string) {
  return sql<string>`lower(unaccent(coalesce(${sql.ref(column)}, '')))`;
}

// Bind patterns as values, and escape LIKE wildcards so user text stays literal.
function textMatches(
  column: string,
  value: string,
  mode: MatchMode = "contains",
) {
  const escaped = normalizeString(value).replace(/[\\%_]/g, "\\$&");
  return sql<boolean>`${normalized(column)} like ${`${mode === "contains" ? "%" : ""}${escaped}%`}`;
}

export function advancedSearchQuery(
  search: string,
  criteria: AdvancedSearchCriteria,
  db: Kysely<Database> = defaultDatabase,
  options?: AdvancedResultOptions,
) {
  let query = db
    .selectFrom("ansm_specialite as s")
    .selectAll("s")
    .select(
      sql<string | null>`to_char(s.date_amm, 'YYYY-MM-DD')`.as(
        "authorizationDate",
      ),
    );
  if (!search.trim() && !hasAdvancedSearchCriteria(criteria))
    query = query.where(sql<boolean>`false`);
  if (criteria.procedure)
    query =
      criteria.procedure === "NON_COMMUNIQUEE"
        ? query.where("s.procedure", "is", null)
        : query.where(sql<boolean>`s.procedure = ${criteria.procedure}`);
  if (options?.substances.length)
    query = query.where(
      sql<boolean>`exists (select 1 from ansm_composant c where c.cis = s.cis and c.substance = any(${options.substances}::text[]))`,
    );
  if (options?.atcs.length)
    query = query.where(
      sql<boolean>`exists (select 1 from ansm_specialite_atc a join ansm_atc atc on atc.code = a.code_atc where a.cis = s.cis and left(atc.libelle_abr, 3) = any(${options.atcs}::text[]))`,
    );
  if (options?.indications.length)
    query = query.where(
      sql<boolean>`s.cis in (select unnest(i."CIS") from indications i where i.id::text = any(${options.indications}::text[]))`,
    );
  if (criteria.specialty)
    query = query.where(
      textMatches(
        "s.denomination",
        criteria.specialty,
        criteria.specialtyMatch,
      ),
    );
  if (criteria.substance)
    query = query.where(sql<boolean>`exists (
    select 1 from ansm_composant c where c.cis = s.cis and
    ${textMatches("c.substance", criteria.substance, criteria.substanceMatch)}
  )`);
  if (criteria.holder)
    query = query.where(sql<boolean>`exists (
    select 1 from ansm_specialite_titulaire t where t.cis = s.cis and
    (${textMatches("t.raison_sociale", criteria.holder, criteria.holderMatch)} or ${textMatches("t.raison_sociale_longue", criteria.holder, criteria.holderMatch)})
  )`);
  if (criteria.authorizationStatus)
    query = query.where(
      sql<boolean>`s.statut_amm = any(${getAuthorizationSourceStatuses(criteria.authorizationStatus)}::text[])`,
    );
  if (criteria.authorizationFrom)
    query = query.where(
      sql<boolean>`s.date_amm >= ${criteria.authorizationFrom}::date`,
    );
  if (criteria.authorizationTo)
    query = query.where(
      sql<boolean>`s.date_amm < ${criteria.authorizationTo}::date + interval '1 day'`,
    );
  if (criteria.marketingStatus)
    query = query.where(sql<boolean>`exists (
    select 1 from ansm_presentation p where p.cis = s.cis
    and p.statut_commercialisation = any(${getPresentationSourceStatuses(criteria.marketingStatus)}::text[])
  )`);
  // All document constraints must match one document, including its update date.
  if (criteria.documentType || criteria.documentFrom || criteria.documentTo)
    query = query.where(sql<boolean>`exists (
    select 1 from ansm_document d where d.cis = s.cis
    ${criteria.documentType ? sql`and d.type = ${criteria.documentType}` : sql``}
    ${criteria.documentFrom ? sql`and d.date_modification >= ${criteria.documentFrom}::date` : sql``}
    ${criteria.documentTo ? sql`and d.date_modification < ${criteria.documentTo}::date + interval '1 day'` : sql``}
  )`);
  if (search.trim()) {
    const literalSearch = search.trim();
    // Build matching CIS sets once. Correlating indication arrays against every
    // catalogue row turns one scan into tens of thousands of repeated scans.
    query = query.where(sql<boolean>`s.cis in (
      select sx.cis from ansm_specialite sx where
        ${textMatches("sx.denomination", literalSearch)} or ${textMatches("sx.cis", literalSearch)}
      union select c.cis from ansm_composant c where ${textMatches("c.substance", literalSearch)}
      union select unnest(i."CIS") from indications i where ${textMatches("i.nom", literalSearch)}
      union select a.cis from ansm_specialite_atc a join ansm_atc atc on atc.code = a.code_atc where
        ${textMatches("atc.libelle_abr", literalSearch)} or ${textMatches("atc.libelle_court", literalSearch)} or ${textMatches("atc.libelle_long", literalSearch)}
    )`);
  }
  return query;
}

export async function getAdvancedSearchResults(
  search: string,
  criteria: AdvancedSearchCriteria,
  database: Kysely<Database> = defaultDatabase,
  options?: AdvancedResultOptions,
): Promise<SearchResultItem[]> {
  const db = database;
  const rows = await advancedSearchQuery(search, criteria, db, options)
    .orderBy("s.denomination", options?.descending ? "desc" : "asc")
    .orderBy("s.cis", options?.descending ? "desc" : "asc")
    .limit(options ? ADVANCED_PAGE_SIZE : MAX_ADVANCED_SEARCH_RESULTS)
    .offset(options ? (options.page - 1) * ADVANCED_PAGE_SIZE : 0)
    .execute();
  if (!rows.length) return [];
  const ids = rows.map((row) => row.cis);
  const [
    components,
    indications,
    atcs,
    events,
    pregnancyPlans,
    pregnancyMentions,
    pediatrics,
    presentations,
    rcpDocuments,
  ] = await Promise.all([
    db
      .selectFrom("ansm_composant")
      .where("cis", "in", ids)
      .select(["cis", "substance", "code_substance"])
      .execute(),
    db
      .selectFrom("indications")
      .where("CIS", "&&", sql<string[]>`${ids}::varchar[]`)
      .select(["id", "nom", "CIS"])
      .execute(),
    db
      .selectFrom("ansm_specialite_atc as a")
      .innerJoin("ansm_atc as atc", "atc.code", "a.code_atc")
      .where("a.cis", "in", ids)
      .select([
        "a.cis",
        "atc.libelle_abr",
        "atc.libelle_long",
        "atc.libelle_court",
      ])
      .execute(),
    db
      .selectFrom("ansm_specialite_evenement")
      .where("cis", "in", ids)
      .where("code_evenement", "=", REINFORCED_SURVEILLANCE_EVENT_CODE)
      .selectAll()
      .execute(),
    getAllPregnancyPlanAlerts(),
    getAllPregnancyMentionAlerts(),
    getAllPediatrics(),
    db
      .selectFrom("ansm_presentation")
      .where("cis", "in", ids)
      .select(["cis", "statut_commercialisation"])
      .execute(),
    db
      .selectFrom("ansm_document")
      .where("cis", "in", ids)
      .where("type", "=", "rcp")
      .select("cis")
      .select(
        sql<string | null>`to_char(max(date_modification), 'YYYY-MM-DD')`.as(
          "updatedAt",
        ),
      )
      .groupBy("cis")
      .execute(),
  ]);
  const records: ResumeSpecialite[] = rows.map((row) => {
    const composition = components.filter((c) => c.cis === row.cis);
    const uses = indications.filter((i) => i.CIS.includes(row.cis));
    const atc = atcs.find((a) => a.cis === row.cis)?.libelle_abr ?? undefined;
    return {
      specId: row.cis,
      specName: row.denomination ?? "",
      groupName: getSpecialiteGroupName(row.denomination ?? ""),
      composants: [
        ...new Set(composition.map((c) => c.substance).filter(Boolean)),
      ].join(", "),
      subsIds: [
        ...new Set(
          composition.flatMap((c) =>
            c.code_substance ? [c.code_substance] : [],
          ),
        ),
      ],
      indicationsIds: uses.map((i) => i.id),
      indicationsIdsNames: uses.map((i) => [String(i.id), i.nom]),
      indicationsDetails: uses.map((i) => ({
        idIndication: i.id,
        nomIndication: i.nom,
      })),
      atc1Code: atc?.slice(0, 1),
      atc2Code: atc?.slice(0, 3),
      atc5Code: atc,
      ProcId: row.procedure ?? "NON_COMMUNIQUEE",
      StatutBdm: disponibiliteToStatutBdm(row.disponibilite),
      isSurveillanceRenforcee: isSurveillanceRenforcee(
        events.filter((event) => event.cis === row.cis).map(mapAnsmSafetyEvent),
      ),
      isAlertPregnancyPlan: Boolean(
        findPregnancyPlanAlert(
          composition.flatMap((c) =>
            c.code_substance ? [c.code_substance] : [],
          ),
          pregnancyPlans,
        ),
      ),
      isAlertPregnancyMention: pregnancyMentions.includes(row.cis),
      isAlertPediatricContraindication: pediatrics.some(
        (info) => info.CIS === row.cis && info.contraindication,
      ),
    };
  });
  // This display helper loads friendly ATC reference labels, not summary rows.
  const formatted = await getResumeSpecsATCLabels(records);
  return formatted.map((spec, index) => {
    const row = rows[index];
    const statuses = [
      ...new Set(
        presentations
          .filter((p) => p.cis === row.cis)
          .map((p) => p.statut_commercialisation),
      ),
    ];
    const commercialisation = statuses.includes("COMMERCIALISEE")
      ? commercialStatusToDisplayStatus("COMMERCIALISEE")
      : [...new Set(statuses.map(commercialStatusToDisplayStatus))]
          .sort()
          .join(" / ") || "Non renseignée";
    const rcp = rcpDocuments.find((document) => document.cis === row.cis);
    return {
      ...spec,
      score: 0,
      matchReasons: [],
      authorizationStatus: statutAmmToDisplayStatus(rows[index].statut_amm),
      officialAtcs: atcs
        .filter((a) => a.cis === row.cis)
        .map((a) => ({
          code: a.libelle_abr ?? "",
          label: a.libelle_long ?? a.libelle_court ?? "Libellé non renseigné",
        }))
        .filter((a) => a.code)
        .sort((a, b) => a.code.localeCompare(b.code)),
      availability: row.disponibilite,
      isHistorical: row.disponibilite === "INDISPONIBLE",
      advancedDetails: {
        authorizationStatus: statutAmmToDisplayStatus(row.statut_amm),
        authorizationDate: row.authorizationDate,
        commercialisation,
        hasRcp: Boolean(rcp),
        rcpUpdatedAt: rcp?.updatedAt ?? null,
      },
    };
  });
}

export async function getCachedAdvancedSearchResults(
  search: string,
  criteria: AdvancedSearchCriteria,
): Promise<SearchResultItem[]> {
  "use cache: remote";

  return getAdvancedSearchResults(search, criteria);
}

export type AdvancedSearchPage = {
  results: SearchResultItem[];
  total: number;
  page: number;
  facets: {
    substances: SearchFilter[];
    atcs: SearchFilter[];
    indications: SearchFilter[];
  };
};

export async function getAdvancedSearchPage(
  search: string,
  criteria: AdvancedSearchCriteria,
  options: AdvancedResultOptions,
  db: Kysely<Database> = defaultDatabase,
): Promise<AdvancedSearchPage> {
  // Facets span the complete matching catalogue, before side-filter selections.
  const matchingIds = advancedSearchQuery(search, criteria, db)
    .clearSelect()
    .select("s.cis");
  const countQuery = advancedSearchQuery(search, criteria, db, options)
    .clearSelect()
    .select(sql<string>`count(*)`.as("total"));
  const [count, substances, atcs, indications] = await Promise.all([
    countQuery.executeTakeFirstOrThrow(),
    db
      .selectFrom("ansm_composant as c")
      .where("c.cis", "in", matchingIds)
      .where("c.substance", "is not", null)
      .where("c.substance", "!=", "")
      .select([
        "c.substance as name",
        sql<number>`count(distinct c.cis)::int`.as("count"),
      ])
      .groupBy("c.substance")
      .execute(),
    db
      .selectFrom("ansm_specialite_atc as a")
      .innerJoin("ansm_atc as atc", "atc.code", "a.code_atc")
      .where("a.cis", "in", matchingIds)
      .where("atc.libelle_abr", "is not", null)
      .select([
        sql<string>`case when grouping(left(atc.libelle_abr, 1)) = 0 then left(atc.libelle_abr, 1) else left(atc.libelle_abr, 3) end`.as(
          "code",
        ),
        sql<number>`count(distinct a.cis)::int`.as("count"),
      ])
      .groupBy(
        sql`grouping sets ((left(atc.libelle_abr, 1)), (left(atc.libelle_abr, 3)))`,
      )
      .execute(),
    db
      .selectFrom("indications as i")
      .where(sql<boolean>`i."CIS" && array(${matchingIds})::varchar[]`)
      .select([
        "i.id",
        "i.nom as name",
        sql<number>`(select count(distinct cis)::int from unnest(i."CIS") cis where cis in (${matchingIds}))`.as(
          "count",
        ),
      ])
      .execute(),
  ]);
  const total = Number(count.total);
  const page = Math.min(
    options.page,
    Math.max(1, Math.ceil(total / ADVANCED_PAGE_SIZE)),
  );
  const [results, atcLabels, atcParents] = await Promise.all([
    getAdvancedSearchResults(search, criteria, db, { ...options, page }),
    db
      .selectFrom("ref_atc_friendly_niveau_2")
      .select(["code", "libelle"])
      .execute(),
    db
      .selectFrom("ref_atc_friendly_niveau_1")
      .select(["code", "libelle"])
      .execute(),
  ]);
  const atcChildren = atcs
    .filter((row) => /^[A-Z][0-9]{2}$/.test(row.code))
    .map((row) => ({
      id: row.code,
      name: `${row.code} — ${atcLabels.find((a) => a.code === row.code)?.libelle ?? row.code}`,
      count: row.count,
      selected: options.atcs.includes(row.code),
    }));
  return {
    total,
    page,
    results,
    facets: {
      substances: substances.map((row) => ({
        id: row.name!,
        name: row.name!,
        count: row.count,
        selected: options.substances.includes(row.name!),
      })),
      atcs: atcs
        .filter((row) => /^[A-Z]$/.test(row.code))
        .map((row) => {
          const children = atcChildren.filter((child) =>
            child.id.startsWith(row.code),
          );
          return {
            id: row.code,
            name: `${row.code} — ${atcParents.find((a) => a.code === row.code)?.libelle ?? row.code}`,
            count: row.count,
            selected: children.some((child) => child.selected),
            children,
          };
        }),
      indications: indications.map((row) => ({
        id: String(row.id),
        name: row.name,
        count: row.count,
        selected: options.indications.includes(String(row.id)),
      })),
    },
  };
}

export async function getCachedAdvancedSearchPage(
  search: string,
  criteria: AdvancedSearchCriteria,
  options: AdvancedResultOptions,
) {
  "use cache: remote";
  return getAdvancedSearchPage(search, criteria, options);
}
