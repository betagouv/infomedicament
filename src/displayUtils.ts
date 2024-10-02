import { parse as csvParse } from "csv-parse/sync";
import path from "node:path";
import { readFileSync } from "node:fs";

import {
  ComposantNatureId,
  SpecComposant,
  Specialite,
  SubstanceNom,
} from "@/db/pdbmMySQL";

export const formatSpecName = (name: string): string =>
  name
    .split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

export function getSpecialiteGroupName(specialite: Specialite): string {
  const regexMatch = specialite.SpecDenom01.match(/^[^0-9,]+/);
  return regexMatch ? regexMatch[0] : specialite.SpecDenom01;
}

export function groupSpecialites<T extends Specialite>(
  specialites: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const specialite of specialites) {
    const groupName = getSpecialiteGroupName(specialite);
    if (groups.has(groupName)) {
      groups.get(groupName)?.push(specialite);
    } else {
      groups.set(groupName, [specialite]);
    }
  }
  return groups;
}

export function displayComposants(
  composants: (SpecComposant & SubstanceNom)[],
): string {
  const groups = new Map<number, (SpecComposant & SubstanceNom)[]>();
  for (const composant of composants) {
    if (groups.has(composant.CompNum)) {
      groups.get(composant.CompNum)?.push(composant);
    } else {
      groups.set(composant.CompNum, [composant]);
    }
  }

  const displayGroups = Array.from(groups.values()).map(
    (composants: (SpecComposant & SubstanceNom)[]) => {
      const substances = composants.filter(
        (composant) => composant.NatuId === ComposantNatureId.Substance,
      );
      const fractions = composants.filter(
        (composant) => composant.NatuId === ComposantNatureId.Fraction,
      );

      let displayListAs;
      // This is copied from the original PDBM code
      if (
        // If there is many substances or just a substance without therapeutic fraction,
        // we will just display a list of substances
        substances.length - fractions.length >= 1 &&
        fractions.length <= 1
      ) {
        displayListAs = ComposantNatureId.Substance;
      } else if (
        // If there is many fractions in a substance or just a fraction without the substance
        // we will display a list of fractions
        // with maybe the precision "under the form of [name of the substance]"
        fractions.length - substances.length >= 1 &&
        substances.length <= 1
      ) {
        displayListAs = ComposantNatureId.Fraction;
      } else if (fractions.length === substances.length) {
        // Same
        displayListAs = ComposantNatureId.Fraction;
      } else {
        // If there is many substances and fractions, we will display a list of substances
        displayListAs = ComposantNatureId.Substance;
      }

      return { displayListAs, substances, fractions };
    },
  );

  return displayGroups
    .map(({ displayListAs, substances, fractions }) =>
      (displayListAs === ComposantNatureId.Fraction
        ? fractions
        : substances
      ).map(
        (c) =>
          `${c.NomLib} (${c.CompDosage.trim()})${
            (displayListAs === ComposantNatureId.Fraction
              ? substances
              : fractions
            ).length > 0
              ? `${displayListAs === ComposantNatureId.Fraction ? " sous forme de" : "correspondant à"} ${(displayListAs ===
                ComposantNatureId.Fraction
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

const atcLabels1 = csvParse(
  readFileSync(path.join(process.cwd(), "src", "data", "ATC-labels-1.csv")),
) as string[][];
const atcLabels2 = csvParse(
  readFileSync(path.join(process.cwd(), "src", "data", "ATC-labels-2.csv")),
) as string[][];

const atcOfficialLabels = csvParse(
  readFileSync(path.join(process.cwd(), "src", "data", "ATC 2024 02 15.csv")),
) as string[][];

export function atcToBreadcrumbs(atc: string): string[] {
  return [
    [1, atcLabels1] as [number, string[][]],
    [3, atcLabels2] as [number, string[][]],
    [7, atcOfficialLabels] as [number, string[][]],
  ].map(([i, labels]) => {
    const row = labels.find((row) => row[0] === atc.slice(0, i));
    if (!row) {
      throw new Error(`ATC code not found: ${atc.slice(0, i)}`);
    }
    return row[1];
  });
}

export function dateShortFormat(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
