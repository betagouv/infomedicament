import type { PregnancyAlert } from "@/types/PregancyTypes";

function normalizeSubstanceId(value: string): string | undefined {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const normalized = trimmed.replace(/^0+/, "");
  return normalized || undefined;
}

export function findPregnancyPlanAlert(
  substanceIds: string[],
  alerts: PregnancyAlert[],
): PregnancyAlert | undefined {
  const normalizedIds = new Set(
    substanceIds.flatMap((id) => normalizeSubstanceId(id) ?? []),
  );

  return alerts.find((alert) => {
    const id = normalizeSubstanceId(alert.id);
    return id !== undefined && normalizedIds.has(id);
  });
}
