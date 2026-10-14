import { authorizationStatusLabels } from "@/types/SpecialiteTypes";
import { presentationCommercialStatusLabels } from "@/types/PresentationTypes";

export type MatchMode = "contains" | "startsWith";
export type AdvancedSearchCriteria = {
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
export const MAX_ADVANCED_SEARCH_RESULTS = 500;

// Opening the mode is distinct from submitting an unrestricted search.
// Criteria URLs remain directly shareable without a submission marker.
export function hasAdvancedSearchRequest(
  params: URLSearchParams,
  criteria: AdvancedSearchCriteria,
): boolean {
  return (
    params.get("submitted") === "1" ||
    Object.entries(criteria).some(
      ([key, value]) => !key.endsWith("Match") && Boolean(value),
    )
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
