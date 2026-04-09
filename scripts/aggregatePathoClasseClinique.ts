import db from "@/db";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Pathology } from "@/db/types";

//Usage: npx tsx scripts/aggregatePathoClasseClinique.ts 

async function aggregatePathoClasseClinique(): Promise<string[]> {
  const oldPathos: Pathology[] = await db
    .selectFrom("pathologies")
    .selectAll()
    .execute(); 
  const insertedPathos: Pathology[] = [];
  const updatedPathos: Pathology[] = [];

  const allDefinition = await db
    .selectFrom("ref_pathologies")
    .select(["code_patho", "code_classe_clinique", "definition"])
    .execute();

  // Pathologies
  const allPathos = await pdbmMySQL
    .selectFrom("Patho")
    .select(["codePatho", "NomPatho"])
    .execute();
  const allPathosCIS = await pdbmMySQL
    .selectFrom("Spec_Patho")
    .innerJoin("Specialite", "Spec_Patho.SpecId", "Specialite.SpecId")
    .where("Specialite.IsBdm", "=", 1)
    .select(["Spec_Patho.SpecId", "Spec_Patho.codePatho"])
    .execute();
  await Promise.all(
    allPathos.map(async (patho) => {
      const oldValues = oldPathos.find((oldPatho: Pathology) => oldPatho.codePatho && oldPatho.codePatho.toString() === patho.codePatho && oldPatho.nom === patho.NomPatho.trim());
      const CISList = allPathosCIS.filter((pathoCIS) => pathoCIS.codePatho === patho.codePatho);
      const newValues: Pathology = {
        codePatho: Number(patho.codePatho.trim()),
        codeClasseClinique: undefined,
        nom: patho.NomPatho.trim(),
        definition: undefined,
        CIS: CISList.map((pathoCIS) => pathoCIS.SpecId),
      }
      const definition = allDefinition.find((def) => def.code_patho && def.code_patho.toString() === patho.codePatho.trim());
      if(definition) {
        if(oldValues) {
          //Update previous values
          updatedPathos.push({
            id: oldValues.id,
            ...newValues,
            codeClasseClinique: definition.code_classe_clinique || undefined,
            definition: definition.definition || undefined,
          });
        } else {
          insertedPathos.push({
            ...newValues,
            codeClasseClinique: definition.code_classe_clinique || undefined,
            definition: definition.definition || undefined,
          });
        }
      } else {
        //Definition is not available but we the classe is displayed
        if(oldValues) {
          //Update previous values
          updatedPathos.push({
            id: oldValues.id,
            ...newValues,
          });
        } else {
          insertedPathos.push(newValues);
        }
      }
    })
  );

  // Classes cliniques
  const allClassesCliniques = await db
    .selectFrom("classes_cliniques")
    .select(["codeTerme", "libCourt"])
    .execute();
  const allActiveCIS = await pdbmMySQL
    .selectFrom("Specialite")
    .where("IsBdm", "=", 1)
    .select("SpecId")
    .execute();
  const allClassesCliniquesCIS = await db
    .selectFrom("vu_classes_cliniques")
    .where("codeVU", "in", allActiveCIS.map((CIS) => CIS.SpecId))
    .select(["codeClasClinique", "codeVU"])
    .execute();
  allClassesCliniques.forEach((classeClinique) => {
    const oldValues = oldPathos.find((oldPatho: Pathology) => oldPatho.codeClasseClinique === classeClinique.codeTerme);
    const nom = classeClinique.libCourt ? (/[A-Z]/.test(classeClinique.libCourt.trim()[0]) ? classeClinique.libCourt.trim()[0] + classeClinique.libCourt.trim().slice(1).toLowerCase() : classeClinique.libCourt.trim()) : "";
    const CISList = allClassesCliniquesCIS.filter((classeCliniqueCIS) => classeCliniqueCIS.codeClasClinique === classeClinique.codeTerme);
    const newValues: Pathology = {
      codePatho: undefined,
      codeClasseClinique: classeClinique.codeTerme,
      nom: nom,
      definition: undefined,
      CIS: CISList.map((classeCliniqueCIS) => classeCliniqueCIS.codeVU.trim()),
    }
    const definition = allDefinition.find((def) => def.code_classe_clinique && def.code_classe_clinique === classeClinique.codeTerme);
    if(definition) {
      if(!definition.code_patho) {
        if(oldValues) {
          //Update previous values
          updatedPathos.push({
            id: oldValues.id,
            ...newValues,
            definition: definition.definition,
          });
        } else {
          insertedPathos.push({
            ...newValues,
            definition: definition.definition,
          });
        }
      }
    } else {
      //Definition is not available but we the classe is displayed
      if(oldValues) {
        //Update previous values
        updatedPathos.push({
          id: oldValues.id,
          ...newValues,
        });
      } else {
        insertedPathos.push(newValues);
      }
    }
  });

  // Update previous values
  if(updatedPathos.length > 0){
    await Promise.all(
      updatedPathos.map(async (patho: Pathology) => {
        await db
          .updateTable('pathologies')
          .set(patho)
          .where('id', '=', patho.id)
          .executeTakeFirstOrThrow();
      })
    );
  }
  // Insert new values
  if(insertedPathos.length > 0){
    await db
      .insertInto('pathologies')
      .values(insertedPathos)
      .execute();
  }
  // Deleted old values
  const deletedPathos: number[] = oldPathos.filter((oldPatho) => {
    const indexUpdated = updatedPathos.findIndex((updatedPatho: Pathology) => updatedPatho.id === oldPatho.id);
    if(indexUpdated === -1) return true;
  }).map((oldPathos) => oldPathos.id);
  if(deletedPathos.length > 0) {
    await db
      .deleteFrom('pathologies')
      .where("id", "in", deletedPathos)
      .execute();
  }

  console.log(`Nombre de pathologies ajoutées: ${insertedPathos.length}`);
  console.log(`Nombre de pathologies mises à jour: ${updatedPathos.length}`);
  console.log(`Nombre de pathologies supprimées: ${deletedPathos.length}`);

  process.exit(0);
}

aggregatePathoClasseClinique().finally(async () => {
  await db.destroy();
  await pdbmMySQL.destroy();
});