import type { AnsmPresentation } from "@/db/types";
import {
  presentationCommercialStatusLabels,
  type PresentationCommercialStatus,
} from "@/types/PresentationTypes";

type CommercialSourceStatus = NonNullable<
  AnsmPresentation["statut_commercialisation"]
>;

const commercialStatusMap: Record<
  CommercialSourceStatus,
  PresentationCommercialStatus
> = {
  COMMERCIALISEE: "commercialised",
  ARRETEE: "stopped",
  SUSPENDUE: "suspended",
  RETIREE: "withdrawn",
  INCONNUE: "unknown",
  NON_COMMUNIQUEE: "unknown",
};

export function mapCommercialStatus(
  status: string | null,
): PresentationCommercialStatus {
  return status === null
    ? "unknown"
    : (commercialStatusMap[status as CommercialSourceStatus] ?? "unknown");
}

export function commercialStatusToDisplayStatus(
  status: AnsmPresentation["statut_commercialisation"],
): string {
  const mapped = mapCommercialStatus(status);
  if (mapped !== "unknown") return presentationCommercialStatusLabels[mapped];
  if (status === "INCONNUE") return "Inconnue";
  if (status === "NON_COMMUNIQUEE") return "Non communiquée";
  return "Non renseignée";
}

export function getPresentationSourceStatuses(
  label: string,
): CommercialSourceStatus[] {
  return (Object.keys(commercialStatusMap) as CommercialSourceStatus[]).filter(
    (status) => commercialStatusToDisplayStatus(status) === label,
  );
}
