"use server";

import { Asmr, ComposantComposition, DocBonUsage, ElementComposition, FicheInfos, InfosImportantes, Smr } from '@/types/FicheInfoTypes';
import { pdbmMySQL } from '../pdbmMySQL';
import { VUEvnts } from '../pdbmMySQL/types';
import { isSurveillanceRenforcee } from '@/utils/specialites';
import db from '@/db';
import { AnsmComposant } from '@/db/types';

export async function getEvents(CISList: string | string[]): Promise<VUEvnts[]> {
  const allCIS: string[] = !Array.isArray(CISList) ? [CISList] : CISList;
  const events: VUEvnts[] = await pdbmMySQL
    .selectFrom("VUEvnts")
    .where("VUEvnts.SpecId", "in", allCIS)
    .selectAll()
    .execute();
  return events;
}

function formatElementName(name: string): string {
  return name.replaceAll("un seringue préremplie", "une seringue préremplie");
}

export async function getFicheInfos(CIS: string): Promise<FicheInfos | undefined> {
  const events = await getEvents(CIS);
  const infosImportantes: InfosImportantes[] = [];
  events.forEach((event: VUEvnts) => {
    if (event.codeEvnt === '84' && event.remCommentaire) {
      infosImportantes.push({
        remCommentaire: event.remCommentaire,
        dateEvnt: event.dateEvnt,
        codeTypeInfo: event.codeTypeInfo,
      });
    }
  });

  const hasSMR: Smr[] = await db
    .selectFrom("smr")
    .leftJoin("url_has", "url_has.code_ct", "smr.code_evamed")
    .where("smr.code_cis", "=", CIS)
    .select(["smr.date_avis_definitif", "smr.valeur_smr", "smr.motif_demande", "smr.libelle_smr", "url_has.url"])
    .distinct()
    .execute()
    .then((rows) => rows.map((r) => ({
      DateAvis: r.date_avis_definitif,
      ValeurSmr: r.valeur_smr ?? '',
      MotifEval: r.motif_demande ?? '',
      LibelleSmr: r.libelle_smr ?? '',
      HASLiensPageCT: r.url ?? null,
    })));

  const hasASMR: Asmr[] = await db
    .selectFrom("asmr")
    .leftJoin("url_has", "url_has.code_ct", "asmr.code_evamed")
    .where("asmr.code_cis", "=", CIS)
    .select(["asmr.date_avis_definitif", "asmr.valeur_asmr", "asmr.motif_demande", "asmr.libelle_asmr", "url_has.url"])
    .distinct()
    .execute()
    .then((rows) => rows.map((r) => ({
      DateAvis: r.date_avis_definitif,
      ValeurAsmr: r.valeur_asmr ?? '',
      MotifEval: r.motif_demande ?? '',
      LibelleAsmr: r.libelle_asmr ?? '',
      HASLiensPageCT: r.url ?? null,
    })));

  const hasDocsBU: DocBonUsage[] = await pdbmMySQL
    .selectFrom("HAS_DocsBonUsage")
    .where("HAS_DocsBonUsage.SpecId", "=", CIS)
    .select(["HAS_DocsBonUsage.TypeDoc", "HAS_DocsBonUsage.DateMAJ", "HAS_DocsBonUsage.TitreDoc", "HAS_DocsBonUsage.Url"])
    .distinct()
    .execute();

  const elementsRaw = await db
    .selectFrom("ansm_element")
    .where("cis", "=", CIS)
    .selectAll()
    .orderBy("numero_element")
    .execute();

  const composantsRaw: AnsmComposant[] = await db
    .selectFrom("ansm_composant")
    .where("cis", "=", CIS)
    .selectAll()
    .execute();

  const elementsComposition: ElementComposition[] = [];
  elementsRaw.forEach((element) => {
    const composantsList = composantsRaw.filter(
      (c) => c.numero_element === element.numero_element && c.nature === "Substance active"
    );
    const fractionsList = composantsRaw.filter(
      (c) => c.numero_element === element.numero_element && c.nature === "Fraction active"
    );
    const composantsComposition: ComposantComposition[] = [];

    if (fractionsList.length > 0) {
      fractionsList.forEach((fraction) => {
        const composantsFractionList = composantsList.filter(
          (c) => c.numero_composant === fraction.numero_composant
        );
        composantsComposition.push({
          NomLib: fraction.substance ?? '',
          dosage: fraction.dosage ?? '',
          CompNum: fraction.numero_composant,
          composants: composantsFractionList
            .map((composant) => ({
              NomLib: composant.substance ?? '',
              dosage: composant.dosage ?? '',
              CompNum: composant.numero_composant,
            }))
            .sort((a, b) => a.CompNum - b.CompNum),
        });
      });
    }

    composantsList.forEach((composant) => {
      const isFraction = fractionsList.findIndex((f) => f.numero_composant === composant.numero_composant);
      if (isFraction === -1) {
        composantsComposition.push({
          NomLib: composant.substance ?? '',
          dosage: composant.dosage ?? '',
          CompNum: composant.numero_composant,
        });
      }
    });

    elementsComposition.push({
      referenceDosage: formatElementName(element.denomination ?? ''),
      composants: composantsComposition.sort((a, b) => a.CompNum - b.CompNum),
    });
  });

  const ficheInfos: FicheInfos = {
    listeInformationsImportantes: infosImportantes,
    listeDocumentsBonUsage: hasDocsBU,
    listeASMR: hasASMR,
    listeSMR: hasSMR,
    listeElements: elementsComposition,
    isSurveillanceRenforcee: isSurveillanceRenforcee(events),
  };

  return ficheInfos;
}
