import db from "@/db";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Indication } from "@/db/types";

//Usage: npx tsx scripts/aggregatePathoClasseClinique.ts 

async function aggregatePathoClasseClinique(): Promise<void> {
  const oldIndications: Indication[] = await db
    .selectFrom("indications")
    .selectAll()
    .execute(); 
  const insertedIndications: Indication[] = [];
  const updatedIndications: Indication[] = [];

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
      const oldValues = oldIndications.find((oldPatho: Indication) => oldPatho.codePatho && oldPatho.codePatho.toString() === patho.codePatho && oldPatho.nom === patho.NomPatho.trim());
      const CISList = allPathosCIS.filter((pathoCIS) => pathoCIS.codePatho === patho.codePatho);
      const newValues: Indication = {
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
          updatedIndications.push({
            id: oldValues.id,
            ...newValues,
            codeClasseClinique: definition.code_classe_clinique || undefined,
            definition: definition.definition || undefined,
          });
        } else {
          insertedIndications.push({
            ...newValues,
            codeClasseClinique: definition.code_classe_clinique || undefined,
            definition: definition.definition || undefined,
          });
        }
      } else {
        //Definition is not available but we the classe is displayed
        if(oldValues) {
          //Update previous values
          updatedIndications.push({
            id: oldValues.id,
            ...newValues,
          });
        } else {
          insertedIndications.push(newValues);
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
    const oldValues = oldIndications.find((oldPatho: Indication) => oldPatho.codeClasseClinique === classeClinique.codeTerme);
    const nom = classeClinique.libCourt ? (/[A-Z]/.test(classeClinique.libCourt.trim()[0]) ? classeClinique.libCourt.trim()[0] + classeClinique.libCourt.trim().slice(1).toLowerCase() : classeClinique.libCourt.trim()) : "";
    const CISList = allClassesCliniquesCIS.filter((classeCliniqueCIS) => classeCliniqueCIS.codeClasClinique === classeClinique.codeTerme);
    const newValues: Indication = {
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
          updatedIndications.push({
            id: oldValues.id,
            ...newValues,
            definition: definition.definition,
          });
        } else {
          insertedIndications.push({
            ...newValues,
            definition: definition.definition,
          });
        }
      }
    } else {
      //Definition is not available but we the classe is displayed
      if(oldValues) {
        //Update previous values
        updatedIndications.push({
          id: oldValues.id,
          ...newValues,
        });
      } else {
        insertedIndications.push(newValues);
      }
    }
  });

  // Update previous values
  if(updatedIndications.length > 0){
    await Promise.all(
      updatedIndications.map(async (indication: Indication) => {
        await db
          .updateTable('indications')
          .set(indication)
          .where('id', '=', indication.id)
          .executeTakeFirstOrThrow();
      })
    );
  }
  // Insert new values
  if(insertedIndications.length > 0){
    await db
      .insertInto('indications')
      .values(insertedIndications)
      .execute();
  }
  // Deleted old values
  const deletedIndications: number[] = oldIndications.filter((oldIndication) => {
    const indexUpdated = updatedIndications.findIndex((updatedIndication: Indication) => updatedIndication.id === oldIndication.id);
    if(indexUpdated === -1) return true;
  }).map((oldIndication) => oldIndication.id);
  if(deletedIndications.length > 0) {
    await db
      .deleteFrom('indications')
      .where("id", "in", deletedIndications)
      .execute();
  }

  console.log(`Nombre d'indications ajoutées: ${insertedIndications.length}`);
  console.log(`Nombre d'indications mises à jour: ${updatedIndications.length}`);
  console.log(`Nombre d'indications supprimées: ${deletedIndications.length}`);

  process.exit(0);
}

aggregatePathoClasseClinique().finally(async () => {
  await db.destroy();
  await pdbmMySQL.destroy();
});