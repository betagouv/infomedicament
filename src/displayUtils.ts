import { Specialite } from "@/db/pdbmMySQL";

export const formatSpecName = (name: string): string =>
  name
    .split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

export function groupSpecialites(
  specialites: Specialite[],
): Map<string, Specialite[]> {
  const groups = new Map<string, Specialite[]>();
  for (const specialite of specialites) {
    const regexMatch = specialite.SpecDenom01.match(/^[^0-9]+/);
    const groupName = regexMatch ? regexMatch[0] : specialite.SpecDenom01;
    if (groups.has(groupName)) {
      groups.get(groupName)?.push(specialite);
    } else {
      groups.set(groupName, [specialite]);
    }
  }
  return groups;
}
