import { AnsmComposant, AnsmSpecialite } from "@/db/types";
import { Specialite } from "@/db/pdbmMySQL/types";

export type MedicamentGroup<T extends Specialite | AnsmSpecialite = Specialite> = [string, T[]];

export const formatSpecName = (name: string): string =>
  name && name
    .split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

export function displaySimpleComposants(composants: AnsmComposant[]): AnsmComposant[] {
  const groups = new Map<number, AnsmComposant[]>();
  for (const composant of composants) {
    if (groups.has(composant.numero_composant)) {
      groups.get(composant.numero_composant)?.push(composant);
    } else {
      groups.set(composant.numero_composant, [composant]);
    }
  }

  return Array.from(groups.values())
    .map((group) =>
      group.filter((c) => c.nature === "Fraction active").length
        ? group.filter((c) => c.nature === "Fraction active")
        : group,
    )
    .flat();
}

export function displayCompleteComposants(composants: AnsmComposant[]): string {
  const groups = new Map<number, AnsmComposant[]>();
  for (const composant of composants) {
    if (groups.has(composant.numero_composant)) {
      groups.get(composant.numero_composant)?.push(composant);
    } else {
      groups.set(composant.numero_composant, [composant]);
    }
  }

  const displayGroups = Array.from(groups.values()).map((group) => {
    const substances = group.filter((c) => c.nature === "Substance active");
    const fractions = group.filter((c) => c.nature === "Fraction active");

    // When nature is null for all composants in the group (gap #13: ansm_composant.nature
    // unpopulated), fall back to displaying the whole group rather than an empty list.
    if (substances.length === 0 && fractions.length === 0) {
      return { primary: group, secondary: [] as AnsmComposant[], isFractionFirst: false };
    }

    let displayListAs: "Substance active" | "Fraction active";
    if (substances.length - fractions.length >= 1 && fractions.length <= 1) {
      displayListAs = "Substance active";
    } else if (fractions.length - substances.length >= 1 && substances.length <= 1) {
      displayListAs = "Fraction active";
    } else if (fractions.length === substances.length) {
      displayListAs = "Fraction active";
    } else {
      displayListAs = "Substance active";
    }

    const isFractionFirst = displayListAs === "Fraction active";
    return {
      primary: isFractionFirst ? fractions : substances,
      secondary: isFractionFirst ? substances : fractions,
      isFractionFirst,
    };
  });

  return displayGroups
    .map(({ primary, secondary, isFractionFirst }) =>
      primary.map(
        (c) =>
          `${c.substance} (${(c.dosage ?? '').trim()})${
            secondary.length > 0
              ? `${isFractionFirst ? " sous forme de" : "correspondant à"} ${secondary
                  .map((c) => `${c.substance}${c.dosage ? `(${c.dosage})` : ""}`)
                  .join(" et ")}.`
              : ""
          }`,
      ),
    )
    .flat()
    .join("; ");
}

export function dateShortFormat(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
