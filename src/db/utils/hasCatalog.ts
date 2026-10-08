import type { Asmr, DocBonUsage, Smr } from "@/types/FicheInfoTypes";

// HAS exports calendar dates as DD/MM/YYYY. Never let Date infer their format.
// Also accept normalized ISO dates for callers already using that representation.
export function parseHasDate(value: string | null): Date | null {
  if (!value) return null;
  const source = value.trim();
  const french = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(source);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source);
  if (!french && !iso) return null;
  const [year, month, day] = french
    ? [Number(french[3]), Number(french[2]), Number(french[1])]
    : [Number(iso![1]), Number(iso![2]), Number(iso![3])];
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  // Reject impossible dates rather than silently rolling into another month.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return date;
}

function normalizeHasDate(value: string | null): string | null {
  return parseHasDate(value)?.toISOString().slice(0, 10) ?? null;
}

export function sortHasHistory<T extends { opinionDate: string | null }>(history: T[]): T[] {
  // Normalized YYYY-MM-DD dates sort chronologically; undated entries stay last.
  return history.sort((a, b) => (b.opinionDate ?? "").localeCompare(a.opinionDate ?? ""));
}

export function mapDocBonUsage(row: {
  date_mise_a_jour: string | null;
  url: string | null;
  type_document: string | null;
  titre: string | null;
}): DocBonUsage {
  return {
    url: row.url,
    updatedAt: parseHasDate(row.date_mise_a_jour),
    type: row.type_document,
    title: row.titre,
  };
}

export type SmrSourceRow = {
  date_avis_definitif: string | null;
  valeur_smr: string | null;
  motif_demande: string | null;
  libelle_smr: string | null;
  url: string | null;
};

export type AsmrSourceRow = {
  date_avis_definitif: string | null;
  valeur_asmr: string | null;
  motif_demande: string | null;
  libelle_asmr: string | null;
  url: string | null;
};

export function mapSmr(row: SmrSourceRow): Smr {
  return {
    opinionDate: normalizeHasDate(row.date_avis_definitif),
    value: row.valeur_smr ?? "",
    evaluationReason: row.motif_demande ?? "",
    opinionSummary: row.libelle_smr ?? "",
    hasUrl: row.url,
  };
}

export function mapAsmr(row: AsmrSourceRow): Asmr {
  return {
    opinionDate: normalizeHasDate(row.date_avis_definitif),
    value: row.valeur_asmr ?? "",
    evaluationReason: row.motif_demande ?? "",
    opinionSummary: row.libelle_asmr ?? "",
    hasUrl: row.url,
  };
}
