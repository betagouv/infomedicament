// Maps raw DB codes to French labels
export const CODE_LABELS: Record<string, string> = {
  ci: "Contre-indication",
  asdec: "Association déconseillée",
  dcn: "Association déconseillée",
  dnc: "Association déconseillée",
  pe: "Précaution d'emploi",
  apec: "A prendre en compte",
  neg: "Négligeable",
  texte: "Voir texte",
};

export const CODE_COLORS: Record<string, string> = {
  ci: "#8B1A2B",
  asdec: "#E8836A",
  dcn: "#E8836A",
  dnc: "#E8836A",
  pe: "#C8A020",
  apec: "#F0D040",
  neg: "#9e9e9e",
  texte: "#9e9e9e",
};

// Light backgrounds need dark text
export const LIGHT_CODES = new Set(["pe", "apec", "neg", "texte"]);

export type NiveauBadgeData = { label: string; color: string; textColor: string };

export function getNiveauBadges(niveau: string): NiveauBadgeData[] {
  const seen = new Set<string>();
  return niveau
    .split("/")
    .map((code) => ({
      label: CODE_LABELS[code] ?? code,
      color: CODE_COLORS[code] ?? "#9e9e9e",
      textColor: LIGHT_CODES.has(code) ? "#1e1e1e" : "#fff",
    }))
    .filter(({ label }) => {
      if (seen.has(label)) return false;
      seen.add(label);
      return true;
    });
}
