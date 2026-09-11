import {
  CompositionNature,
  type CompositionComponent,
  type Substance,
} from "@/types/SubstanceTypes";
import { Specialite } from "@/types/SpecialiteTypes";

export type MedicamentGroup<T extends Specialite = Specialite> = [string, T[]];

export const formatSpecName = (name: string): string =>
  name && name
    .split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

export function displaySimpleComposants(
  composants: CompositionComponent[],
): Substance[] {
  const groups = new Map<number, CompositionComponent[]>();
  for (const composant of composants) {
    if (groups.has(composant.CompNum)) {
      groups.get(composant.CompNum)?.push(composant);
    } else {
      groups.set(composant.CompNum, [composant]);
    }
  }

  return Array.from(groups.values())
    .map((composants: CompositionComponent[]) =>
      composants.filter(
        (composant) => composant.NatuId === CompositionNature.Fraction,
      ).length
        ? composants.filter(
            (composant) => composant.NatuId === CompositionNature.Fraction,
          )
        : composants,
    )
    .flat();
}

export function displayCompleteComposants(
  composants: CompositionComponent[],
): string {
  const groups = new Map<number, CompositionComponent[]>();
  for (const composant of composants) {
    if (groups.has(composant.CompNum)) {
      groups.get(composant.CompNum)?.push(composant);
    } else {
      groups.set(composant.CompNum, [composant]);
    }
  }

  const displayGroups = Array.from(groups.values()).map(
    (composants: CompositionComponent[]) => {
      const substances = composants.filter(
        (composant) => composant.NatuId === CompositionNature.Substance,
      );
      const fractions = composants.filter(
        (composant) => composant.NatuId === CompositionNature.Fraction,
      );

      let displayListAs;
      // This is copied from the original PDBM code
      if (
        // If there is many substances or just a substance without therapeutic fraction,
        // we will just display a list of substances
        substances.length - fractions.length >= 1 &&
        fractions.length <= 1
      ) {
        displayListAs = CompositionNature.Substance;
      } else if (
        // If there is many fractions in a substance or just a fraction without the substance
        // we will display a list of fractions
        // with maybe the precision "under the form of [name of the substance]"
        fractions.length - substances.length >= 1 &&
        substances.length <= 1
      ) {
        displayListAs = CompositionNature.Fraction;
      } else if (fractions.length === substances.length) {
        // Same
        displayListAs = CompositionNature.Fraction;
      } else {
        // If there is many substances and fractions, we will display a list of substances
        displayListAs = CompositionNature.Substance;
      }

      return { displayListAs, substances, fractions };
    },
  );

  return displayGroups
    .map(({ displayListAs, substances, fractions }) =>
      (displayListAs === CompositionNature.Fraction
        ? fractions
        : substances
      ).map(
        (c) =>
          `${c.NomLib} (${c.CompDosage.trim()})${
            (displayListAs === CompositionNature.Fraction
              ? substances
              : fractions
            ).length > 0
              ? `${displayListAs === CompositionNature.Fraction ? " sous forme de" : "correspondant à"} ${(displayListAs ===
                CompositionNature.Fraction
                  ? substances
                  : fractions
                )
                  .map(
                    (c) =>
                      `${c.NomLib}${c.CompDosage ? `(${c.CompDosage})` : ""}`,
                  )
                  .join(" et ")}.`
              : ""
          }`,
      ),
    )
    .flat()
    .join("; ");
}

export function groupGeneNameToDCI(name: string): string {
  const regexMatch = name.match(/^[^\-]+/);
  return regexMatch ? regexMatch[0].trim() : name;
}

export function dateShortFormat(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
