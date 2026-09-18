import type { Asmr, Smr } from "@/types/FicheInfoTypes";

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
    opinionDate: row.date_avis_definitif,
    value: row.valeur_smr ?? "",
    evaluationReason: row.motif_demande ?? "",
    opinionSummary: row.libelle_smr ?? "",
    hasUrl: row.url,
  };
}

export function mapAsmr(row: AsmrSourceRow): Asmr {
  return {
    opinionDate: row.date_avis_definitif,
    value: row.valeur_asmr ?? "",
    evaluationReason: row.motif_demande ?? "",
    opinionSummary: row.libelle_asmr ?? "",
    hasUrl: row.url,
  };
}
