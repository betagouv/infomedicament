"use server";

import db from '@/db';
import { PresentationDetail } from '@/db/types';
import { Asmr, ComposantComposition, DocBonUsage, ElementComposition, FicheInfos, GroupeGenerique, Smr } from '@/types/SpecialiteTypes';
import { pdbmMySQL } from '../pdbmMySQL';
import { ComposantNatureId, SpecComposant, SpecElement } from '../pdbmMySQL/types';

async function getListeGroupesGeneriques(ids: number[]): Promise<GroupeGenerique[]>{
  const data = await db
    .selectFrom("groupes_generiques")
    .selectAll()
    .where("idGroupeGenerique", "in", ids)
    .execute();
  
  if(data && data.length > 0) {
    return await Promise.all(
      data.map(async (child) => {
        const data:GroupeGenerique = {
          id: child.idGroupeGenerique,
          libelle: child.libelleGroupeGenerique,
        }
        return data;
      })
    );
  }
  return [];
}

async function getListePresentations(ids: string[]): Promise<PresentationDetail[]>{
  const data = await db
    .selectFrom("presentations")
    .selectAll()
    .where("codecip13", "in", ids)
    .execute();
  
  if(data && data.length > 0) {
    return await Promise.all(
      data.map(async (child) => {
        const data:PresentationDetail = {
          codecip13: child.codecip13,
          nomelement: child.nomelement,
          nbrrecipient: child.nbrrecipient,
          recipient: child.recipient,
          caraccomplrecip: child.caraccomplrecip,
          qtecontenance: child.qtecontenance,
          unitecontenance: child.unitecontenance,
        }
        return data;
      })
    );
  }
  return [];
}

export async function getFicheInfos(CIS: string): Promise<FicheInfos | undefined> {
  const ficheInfoRaw = await db
    .selectFrom("fiches_infos")
    .selectAll()
    .where("specId", "=", CIS)
    .executeTakeFirst();

  if(!ficheInfoRaw) return undefined;

  const infosImportantesRaw = await pdbmMySQL
    .selectFrom("VUEvnts")
    .where("VUEvnts.SpecId", "=", CIS)
    .select("VUEvnts.remCommentaire")
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
        composantsComposition.push({
          NomLib: fraction.NomLib,
          dosage: fraction.CompDosage,
          composants: composantsList.map((composant) => { 
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
    specId: ficheInfoRaw.specId,
    listeInformationsImportantes: infosImportantesRaw.map((row) => row.remCommentaire),
    listeGroupesGeneriques: [], 
    listeDocumentsBonUsage: hasDocsBU,
    listeASMR: hasASMR,
    listeSMR: hasSMR,
    presentations: [],
    listeElements: elementsComposition,
  }
  
  if(ficheInfoRaw.listeGroupesGeneriquesIds && ficheInfoRaw.listeGroupesGeneriquesIds.length > 0) 
    ficheInfos.listeGroupesGeneriques = await getListeGroupesGeneriques(ficheInfoRaw.listeGroupesGeneriquesIds);

  if(ficheInfoRaw.presentations && ficheInfoRaw.presentations.length > 0) 
    ficheInfos.presentations = await getListePresentations(ficheInfoRaw.presentations);

  return ficheInfos;
};
