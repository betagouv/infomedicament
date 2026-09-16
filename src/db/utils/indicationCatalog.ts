import type { Indication, RefPathologies } from "@/db/types";

export type IndicationSource = {
  pathologies: { code: number; nom: string }[];
  clinicalClasses: { code: number; name: string }[];
  specialiteClasses: { cis: string; classCode: number }[];
  classPathologies: { classCode: number; pathologyCode: number }[];
  definitions: RefPathologies[];
};

export type IndicationRefreshRow = Omit<Indication, "id"> & { id?: number };

function formatClinicalClassName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return /[A-Z]/.test(trimmed[0])
    ? trimmed[0] + trimmed.slice(1).toLocaleLowerCase("fr-FR")
    : trimmed;
}

export function buildIndications(
  source: IndicationSource,
  existing: Indication[],
): IndicationRefreshRow[] {
  const cisByClass = new Map<number, Set<string>>();
  for (const link of source.specialiteClasses) {
    const values = cisByClass.get(link.classCode) ?? new Set<string>();
    values.add(link.cis.trim());
    cisByClass.set(link.classCode, values);
  }

  const classesByPathology = new Map<number, Set<number>>();
  for (const link of source.classPathologies) {
    const values = classesByPathology.get(link.pathologyCode) ?? new Set<number>();
    values.add(link.classCode);
    classesByPathology.set(link.pathologyCode, values);
  }

  const rows: IndicationRefreshRow[] = source.pathologies.map((pathology) => {
    const definition = source.definitions.find((row) => row.code_patho === pathology.code);
    const cis = [...(classesByPathology.get(pathology.code) ?? [])]
      .flatMap((classCode) => [...(cisByClass.get(classCode) ?? [])]);
    const current = existing.find((row) =>
      row.codePatho === pathology.code && row.nom === pathology.nom.trim(),
    );

    return {
      ...(current ? { id: current.id } : {}),
      codePatho: pathology.code,
      codeClasseClinique: definition?.code_classe_clinique ?? undefined,
      nom: pathology.nom.trim(),
      definition: definition?.definition ?? undefined,
      CIS: [...new Set(cis)].sort(),
    };
  });

  for (const clinicalClass of source.clinicalClasses) {
    const definition = source.definitions.find((row) =>
      row.code_classe_clinique === clinicalClass.code,
    );
    if (definition?.code_patho) continue;

    const current = existing.find((row) =>
      row.codePatho == null && row.codeClasseClinique === clinicalClass.code,
    );
    rows.push({
      ...(current ? { id: current.id } : {}),
      codePatho: undefined,
      codeClasseClinique: clinicalClass.code,
      nom: formatClinicalClassName(clinicalClass.name),
      definition: definition?.definition ?? undefined,
      CIS: [...(cisByClass.get(clinicalClass.code) ?? [])].sort(),
    });
  }

  return rows;
}
