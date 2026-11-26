import type { AnsmPresentation } from "@/db/types";

export type MedicineMarketingStatus =
  | "marketed"
  | "stopping"
  | "stopped"
  | "not-marketed"
  | "unknown";

type MarketingPresentation = Pick<
  AnsmPresentation,
  | "statut_commercialisation"
  | "date_commercialisation"
  | "date_arret_commercialisation"
>;

export function getMedicineMarketingStatus(
  presentations: MarketingPresentation[],
  now = new Date(),
): MedicineMarketingStatus {
  if (presentations.length === 0) return "unknown";
  const hasUnknownStatus = presentations.some(
    (presentation) =>
      presentation.statut_commercialisation === null ||
      presentation.statut_commercialisation === "INCONNUE" ||
      presentation.statut_commercialisation === "NON_COMMUNIQUEE",
  );
  const current = presentations.filter(
    (presentation) =>
      (!presentation.date_commercialisation ||
        presentation.date_commercialisation <= now) &&
      (presentation.statut_commercialisation === "COMMERCIALISEE" ||
        presentation.statut_commercialisation === "ARRETEE") &&
      (presentation.date_arret_commercialisation
        ? presentation.date_arret_commercialisation > now
        : presentation.statut_commercialisation === "COMMERCIALISEE"),
  );
  if (current.length > 0) {
    // An unknown pack prevents us from asserting a complete market exit.
    return !hasUnknownStatus &&
      current.every((presentation) => presentation.date_arret_commercialisation)
      ? "stopping"
      : "marketed";
  }
  if (hasUnknownStatus) return "unknown";
  if (
    presentations.every(
      (presentation) =>
        presentation.statut_commercialisation === "ARRETEE" ||
        presentation.statut_commercialisation === "RETIREE" ||
        (presentation.date_arret_commercialisation !== null &&
          presentation.date_arret_commercialisation <= now),
    )
  )
    return "stopped";
  return "not-marketed";
}
