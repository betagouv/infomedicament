"use server";

import { Asmr, ComposantComposition, DocBonUsage, ElementComposition, FicheInfos, InfosImportantes, Smr } from '@/types/SpecialiteTypes';
import { pdbmMySQL } from '../pdbmMySQL';
import { ComposantNatureId, SpecComposant, SpecElement } from '../pdbmMySQL/types';

export async function getFicheInfos(CIS: string): Promise<FicheInfos | undefined> {
  const infosImportantes: InfosImportantes[] = await pdbmMySQL
    .selectFrom("VUEvnts")
    .where("VUEvnts.SpecId", "=", CIS)
    .where("VUEvnts.remCommentaire", 'is not', null)
    .where("VUEvnts.remCommentaire", '!=', '')
    .select(["VUEvnts.remCommentaire", "VUEvnts.dateEvnt"])
    .execute();

  const hasSMR: Smr[] = await pdbmMySQL
    .selectFrom("HAS_SMR")
    .leftJoin("HAS_LiensPageCT", "HAS_LiensPageCT.CodeEvamed", "HAS_SMR.CodeEvamed")
    .where("HAS_SMR.SpecId", "=", CIS)
    .select(["HAS_SMR.DateAvis", "HAS_SMR.ValeurSmr", "HAS_SMR.MotifEval", "HAS_SMR.LibelleSmr"])
    .select(["HAS_LiensPageCT.HASLiensPageCT"])
    .distinct()
    .execute();

  const hasASMR: Asmr[] = await pdbmMySQL
    .selectFrom("HAS_ASMR")
    .leftJoin("HAS_LiensPageCT", "HAS_LiensPageCT.CodeEvamed", "HAS_ASMR.CodeEvamed")
    .where("HAS_ASMR.SpecId", "=", CIS)
    .select(["HAS_ASMR.DateAvis", "HAS_ASMR.ValeurAsmr", "HAS_ASMR.MotifEval", "HAS_ASMR.LibelleAsmr"])
    .select(["HAS_LiensPageCT.HASLiensPageCT"])
    .distinct()
    .execute();

  const hasDocsBU: DocBonUsage[] = await pdbmMySQL
    .selectFrom("HAS_DocsBonUsage")
    .where("HAS_DocsBonUsage.SpecId", "=", CIS)
    .select(["HAS_DocsBonUsage.TypeDoc", "HAS_DocsBonUsage.DateMAJ", "HAS_DocsBonUsage.TitreDoc", "HAS_DocsBonUsage.Url"])
    .distinct()
    .execute();

  const elementsRaw: SpecElement[] = await pdbmMySQL
    .selectFrom("Element")
    .where("Element.SpecId", "=", CIS)
    .selectAll()
    .distinct()
    .execute();
  const composantsRaw: any[] = await pdbmMySQL
    .selectFrom("Composant")
    .leftJoin(
      "Subs_Nom", 
      (join) => join
        .onRef('Subs_Nom.NomId', '=', 'Composant.NomId')
        .onRef('Subs_Nom.SubsId', '=', 'Composant.SubsId')
    )
    .where("Composant.SpecId", "=", CIS)
    .selectAll()
    .distinct()
    .orderBy("CompNum asc")
    .execute();
  const elementsComposition: ElementComposition[] = [];
  elementsRaw.forEach((element: SpecElement) => {
    const composantsList = composantsRaw.filter((composantRaw: SpecComposant) => composantRaw.ElmtNum === element.ElmtNum && composantRaw.NatuId === ComposantNatureId.Substance);
    const fractionsList = composantsRaw.filter((composantRaw: SpecComposant) => composantRaw.ElmtNum === element.ElmtNum && composantRaw.NatuId === ComposantNatureId.Fraction);
    const composantsComposition: ComposantComposition[] = [];
    if(fractionsList && fractionsList.length > 0){
      fractionsList.forEach((fraction) => {
        const composantsFractionList = composantsList.filter((composantRaw: SpecComposant) => composantRaw.CompNum === fraction.CompNum);
        composantsComposition.push({
          NomLib: fraction.NomLib,
          dosage: fraction.CompDosage,
          composants: composantsFractionList.map((composant) => { 
            return {
              NomLib: composant.NomLib,
              dosage: composant.CompDosage
            }
          })
        })
      });
    } else {
      composantsList.forEach((composant) => 
        composantsComposition.push({
          NomLib: composant.NomLib,
          dosage: composant.CompDosage
        }),
      );
    }
    elementsComposition.push({
      referenceDosage: element.ElmtRefDosage ? element.ElmtRefDosage : element.ElmtNom,
      composants: composantsComposition,
    })
  })
  
  const ficheInfos:FicheInfos = {
    listeInformationsImportantes: infosImportantes,
    listeDocumentsBonUsage: hasDocsBU,
    listeASMR: hasASMR,
    listeSMR: hasSMR,
    listeElements: elementsComposition,
  }

  return ficheInfos;
};
