import type { SpecialiteProcedure } from "@/types/SpecialiteTypes";
import { authorizationStatusLabels } from "@/types/SpecialiteTypes";
import { presentationCommercialStatusLabels } from "@/types/PresentationTypes";

export type MatchMode = "contains" | "startsWith";
export type AdvancedSearchCriteria = {
  procedure: string;
  specialty: string;
  substance: string;
  holder: string;
  specialtyMatch: MatchMode;
  substanceMatch: MatchMode;
  holderMatch: MatchMode;
  authorizationStatus: string;
  marketingStatus: string;
  authorizationFrom: string;
  authorizationTo: string;
  documentType: string;
  documentFrom: string;
  documentTo: string;
};
export const initialAdvancedCriteria: AdvancedSearchCriteria = {
  procedure: "",
  specialty: "",
  substance: "",
  holder: "",
  specialtyMatch: "startsWith",
  substanceMatch: "startsWith",
  holderMatch: "startsWith",
  authorizationStatus: "",
  marketingStatus: "",
  authorizationFrom: "",
  authorizationTo: "",
  documentType: "",
  documentFrom: "",
  documentTo: "",
};
// Legacy array API default. The UI uses server-side pages of 50.
export const MAX_ADVANCED_SEARCH_RESULTS = 500;
export const ADVANCED_PAGE_SIZE = 50;
export const procedures: SpecialiteProcedure[] = [
  "NATIONALE",
  "CENTRALISEE",
  "RECONNAISSANCE_MUTUELLE",
  "DECENTRALISEE",
  "IMPORTATION_PARALLELE",
  "HOMEOPATHIQUE_NATIONALE",
  "PHYTOTHERAPIE_NATIONALE",
  "PHYTOTHERAPIE_DECENTRALISEE",
  "NON_COMMUNIQUEE",
];

export type AdvancedResultOptions = {
  page: number;
  substances: string[];
  atcs: string[];
  indications: string[];
  descending: boolean;
};
export function parseAdvancedResultOptions(
  params: URLSearchParams,
): AdvancedResultOptions {
  const page = params.get("page") ?? "1";
  if (params.getAll("page").length > 1 || !/^[1-9]\d{0,6}$/.test(page))
    throw new Error("Numéro de page invalide.");
  const read = (key: string) => {
    const values = params.getAll(key);
    if (
      values.length > 100 ||
      values.some((value) => !value || value.length > 200)
    )
      throw new Error("Filtre de résultats invalide.");
    return [...new Set(values)];
  };
  const atcs = read("filterAtc");
  const indications = read("filterIndication");
  if (
    atcs.some((value) => !/^[A-Z][0-9]{2}$/.test(value)) ||
    indications.some((value) => !/^[0-9]+$/.test(value))
  )
    throw new Error("Filtre de résultats invalide.");
  if (
    params.getAll("order").length > 1 ||
    (params.has("order") && !["asc", "desc"].includes(params.get("order")!))
  )
    throw new Error("Ordre de tri invalide.");
  return {
    page: Number(page),
    substances: read("filterSubstance"),
    atcs,
    indications,
    descending: params.get("order") === "desc",
  };
}
export function advancedResultParams(
  criteria: AdvancedSearchCriteria,
  options: AdvancedResultOptions,
): URLSearchParams {
  const params = advancedSearchParams("", criteria);
  if (options.page > 1) params.set("page", String(options.page));
  if (options.descending) params.set("order", "desc");
  for (const value of options.substances)
    params.append("filterSubstance", value);
  for (const value of options.atcs) params.append("filterAtc", value);
  for (const value of options.indications)
    params.append("filterIndication", value);
  return params;
}

// Only populated criteria launch a search; navigation options do not.
export function hasAdvancedSearchCriteria(
  criteria: AdvancedSearchCriteria,
): boolean {
  return Object.entries(criteria).some(
    ([key, value]) => !key.endsWith("Match") && Boolean(value.trim()),
  );
}
export const authorizationStatuses = authorizationStatusLabels;
export const marketingStatuses = Object.values(
  presentationCommercialStatusLabels,
);

// Restore editable form values even when the URL fails search validation.
// Invalid matching modes fall back to a supported select option.
export function getAdvancedSearchDraft(
  params: URLSearchParams,
): AdvancedSearchCriteria | undefined {
  const keys = Object.keys(
    initialAdvancedCriteria,
  ) as (keyof AdvancedSearchCriteria)[];
  if (!params.has("advanced") && !keys.some((key) => params.has(key)))
    return undefined;
  const criteria = { ...initialAdvancedCriteria };
  for (const key of keys) {
    const value = params.get(key);
    if (value === null) continue;
    if (key.endsWith("Match") && value !== "contains" && value !== "startsWith")
      continue;
    Object.assign(criteria, { [key]: value });
  }
  return criteria;
}

export function parseAdvancedSearch(
  params: URLSearchParams,
): AdvancedSearchCriteria | undefined {
  const keys = Object.keys(
    initialAdvancedCriteria,
  ) as (keyof AdvancedSearchCriteria)[];
  if (!params.has("advanced") && !keys.some((key) => params.has(key)))
    return undefined;
  if (params.has("advanced") && params.get("advanced") !== "1")
    throw new Error("Mode de recherche avancée invalide.");
  const criteria = { ...initialAdvancedCriteria };
  for (const key of keys) {
    if (params.getAll(key).length > 1)
      throw new Error(`Critère répété : ${key}.`);
    const value = params.get(key)?.trim();
    if (value === undefined) continue;
    if (value.length > 200)
      throw new Error("Chaque critère est limité à 200 caractères.");
    if (key.endsWith("Match") && value !== "contains" && value !== "startsWith")
      throw new Error("Mode de correspondance invalide.");
    Object.assign(criteria, { [key]: value });
  }
  if (
    criteria.procedure &&
    !procedures.includes(criteria.procedure as SpecialiteProcedure)
  )
    throw new Error("Type de procédure invalide.");
  if (
    criteria.authorizationStatus &&
    !authorizationStatuses.includes(criteria.authorizationStatus)
  )
    throw new Error("État de l’autorisation invalide.");
  if (
    criteria.marketingStatus &&
    !marketingStatuses.includes(criteria.marketingStatus)
  )
    throw new Error("Statut de commercialisation invalide.");
  if (
    criteria.documentType &&
    !["rcp", "notice"].includes(criteria.documentType)
  )
    throw new Error("Type de document invalide.");
  for (const prefix of ["authorization", "document"] as const) {
    for (const suffix of ["From", "To"] as const) {
      const date = criteria[`${prefix}${suffix}`];
      if (
        date &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          date.startsWith("0000-") ||
          !Number.isFinite(Date.parse(date)) ||
          new Date(date).toISOString().slice(0, 10) !== date)
      )
        throw new Error("Date invalide : utilisez le format AAAA-MM-JJ.");
    }
    if (
      criteria[`${prefix}From`] &&
      criteria[`${prefix}To`] &&
      criteria[`${prefix}From`] > criteria[`${prefix}To`]
    )
      throw new Error("La date de début doit précéder la date de fin.");
  }
  return criteria;
}

export function advancedSearchParams(
  search: string,
  criteria?: AdvancedSearchCriteria | null,
): URLSearchParams {
  const params = new URLSearchParams();
  if (search.trim()) params.set("s", search.trim());
  if (criteria) {
    params.set("advanced", "1");
    for (const key of Object.keys(
      initialAdvancedCriteria,
    ) as (keyof AdvancedSearchCriteria)[]) {
      if (criteria[key] && criteria[key] !== initialAdvancedCriteria[key])
        params.set(key, criteria[key]);
    }
  }
  return params;
}
