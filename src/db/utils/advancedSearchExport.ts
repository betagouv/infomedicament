import "server-cli-only";
import { sql, type Kysely } from "kysely";
import db from "@/db";
import type { Database } from "@/db/types";
import { advancedSearchQuery } from "./advancedSearch";
import type {
  AdvancedSearchCriteria,
  AdvancedResultOptions,
} from "@/utils/advancedSearch";

// Aggregate each source once. Correlated scans per specialty make full exports slow.
// Export catalogue fields without hydrating safety indicators for the entire catalogue.
export function getAdvancedSearchExport(
  criteria: AdvancedSearchCriteria,
  options: AdvancedResultOptions,
  database: Kysely<Database> = db,
) {
  const substances = database
    .selectFrom("ansm_composant")
    .select("cis")
    .select(
      sql<
        string[]
      >`array_agg(distinct substance order by substance) filter (where substance is not null)`.as(
        "labels",
      ),
    )
    .groupBy("cis");
  const holders = database
    .selectFrom("ansm_specialite_titulaire")
    .select("cis")
    .select(
      sql<
        string[]
      >`array_agg(distinct coalesce(raison_sociale_longue, raison_sociale) order by coalesce(raison_sociale_longue, raison_sociale)) filter (where coalesce(raison_sociale_longue, raison_sociale) is not null)`.as(
        "labels",
      ),
    )
    .groupBy("cis");
  const atcs = database
    .selectFrom("ansm_specialite_atc as sa")
    .innerJoin("ansm_atc as a", "a.code", "sa.code_atc")
    .select("sa.cis")
    .select(
      sql<
        { code: string; label: string }[]
      >`jsonb_agg(jsonb_build_object('code', a.libelle_abr, 'label', coalesce(a.libelle_long, a.libelle_court, 'Libellé non renseigné')) order by a.libelle_abr) filter (where a.libelle_abr is not null)`.as(
        "labels",
      ),
    )
    .groupBy("sa.cis");
  const marketing = database
    .selectFrom("ansm_presentation")
    .select("cis")
    .select(
      sql<string[]>`array_agg(distinct statut_commercialisation)`.as(
        "statuses",
      ),
    )
    .groupBy("cis");
  const rcp = database
    .selectFrom("ansm_document")
    .where("type", "=", "rcp")
    .select("cis")
    .select(
      sql<string | null>`to_char(max(date_modification), 'YYYY-MM-DD')`.as(
        "updatedAt",
      ),
    )
    .groupBy("cis");
  return advancedSearchQuery("", criteria, database, options)
    .clearSelect()
    .leftJoin(substances.as("substances"), "substances.cis", "s.cis")
    .leftJoin(holders.as("holders"), "holders.cis", "s.cis")
    .leftJoin(atcs.as("atcs"), "atcs.cis", "s.cis")
    .leftJoin(marketing.as("marketing"), "marketing.cis", "s.cis")
    .leftJoin(rcp.as("rcp"), "rcp.cis", "s.cis")
    .select([
      "s.cis",
      "s.denomination",
      "s.procedure",
      "s.statut_amm",
      "atcs.labels as atcs",
      "rcp.updatedAt as rcpUpdatedAt",
    ])
    .select([
      sql<string | null>`to_char(s.date_amm, 'YYYY-MM-DD')`.as(
        "authorizationDate",
      ),
      sql<string[]>`coalesce(substances.labels, '{}'::text[])`.as("substances"),
      sql<string[]>`coalesce(holders.labels, '{}'::text[])`.as("holders"),
      sql<string[]>`coalesce(marketing.statuses, '{}'::text[])`.as(
        "marketingStatuses",
      ),
    ])
    .orderBy("s.denomination", options.descending ? "desc" : "asc")
    .orderBy("s.cis", options.descending ? "desc" : "asc")
    .execute();
}
