"use server";

import db from '@/db';
import { PresentationDetail } from '@/db/types';
import { Asmr, Composant, ComposantElement, DocBonUsage, FicheInfos, GroupeGenerique, Smr } from '@/types/SpecialiteTypes';
import { pdbmMySQL } from '../pdbmMySQL';

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

async function getListeComposants(ids: number[]): Promise<Composant[]>{
  const data = await db
    .selectFrom("composants")
    .selectAll()
    .where("id", "in", ids)
    .execute();
  
  if(data && data.length > 0) {
    return await Promise.all(
      data.map(async (child) => {
        const data:Composant = {
          dosage: child.dosage,
          nom: child.nomComposant,
        }
        return data;
      })
    );
  }
  return [];
}

async function getListeDocuments(ids: number[]): Promise<DocBonUsage[]>{
  const data = await db
    .selectFrom("documents_bon_usage")
    .selectAll()
    .where("id", "in", ids)
    .execute();
  
  if(data && data.length > 0) {
    return await Promise.all(
      data.map(async (child) => {
        const data:DocBonUsage = {
          url: child.urlBU,
          auteur: child.auteurBU,
          dateMaj: child.dateMajBU,
          typeDoc: child.typeDocBU,
          titreDoc: child.titreDocBU,
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

async function getListeElements(ids: number[]): Promise<ComposantElement[]>{
  const data = await db
    .selectFrom("elements")
    .selectAll()
    .where("id", "in", ids)
    .execute();
  
  if(data && data.length > 0) {
    return await Promise.all(
      data.map(async (child) => {
        const data:ComposantElement = {
          nom: child.nomElement,
          referenceDosage: child.referenceDosage,
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

  const ficheInfos:FicheInfos = {
    specId: ficheInfoRaw.specId,
    listeInformationsImportantes: ficheInfoRaw.listeInformationsImportantes,
    listeGroupesGeneriques: [], 
    listeComposants: [],
    listeTitulaires: ficheInfoRaw.listeTitulaires,
    listeDocumentsBonUsage: [],
    listeConditionsDelivrance: ficheInfoRaw.listeConditionsDelivrance,
    libelleCourtAutorisation: ficheInfoRaw.libelleCourtAutorisation, 
    libelleCourtProcedure: ficheInfoRaw.libelleCourtProcedure,
    listeASMR: hasASMR,
    listeSMR: hasSMR,
    presentations: [],
    listeElements: [],
  }
  
  if(ficheInfoRaw.listeGroupesGeneriquesIds && ficheInfoRaw.listeGroupesGeneriquesIds.length > 0) 
    ficheInfos.listeGroupesGeneriques = await getListeGroupesGeneriques(ficheInfoRaw.listeGroupesGeneriquesIds);

  if(ficheInfoRaw.listeComposants && ficheInfoRaw.listeComposants.length > 0) 
    ficheInfos.listeComposants = await getListeComposants(ficheInfoRaw.listeComposants);

  if(ficheInfoRaw.listeDocumentsBonUsageIds && ficheInfoRaw.listeDocumentsBonUsageIds.length > 0) 
    ficheInfos.listeDocumentsBonUsage = await getListeDocuments(ficheInfoRaw.listeDocumentsBonUsageIds);

  if(ficheInfoRaw.presentations && ficheInfoRaw.presentations.length > 0) 
    ficheInfos.presentations = await getListePresentations(ficheInfoRaw.presentations);

  if(ficheInfoRaw.listeElements && ficheInfoRaw.listeElements.length > 0) 
    ficheInfos.listeElements = await getListeElements(ficheInfoRaw.listeElements);

  return ficheInfos;
};
