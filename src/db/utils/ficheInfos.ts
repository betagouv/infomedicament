"use server";

import {
  Asmr,
  ComposantComposition,
  DocBonUsage,
  ElementComposition,
  FicheInfos,
  ImportantInformation,
  Smr,
} from "@/types/FicheInfoTypes";
import { pdbmMySQL } from "../pdbmMySQL";
import { ComposantNatureId, SpecElement } from "../pdbmMySQL/types";
import { isSurveillanceRenforcee } from "@/utils/specialites";
import db from "@/db";
import { splitDosageReference } from "./substanceCatalog";
import {
  getImportantInformationEvents,
  getReinforcedSurveillanceEvents,
} from "./safety";
import { mapImportantInformation } from "./safetyCatalog";
import { mapAsmr, mapSmr } from "./hasCatalog";
import { CompositionNature } from "@/types/SubstanceTypes";
import { getComposants } from "./composants";

async function getImportantInformation(
  CIS: string,
): Promise<ImportantInformation[]> {
  const events = await getImportantInformationEvents([CIS]);
  return events
    .map(mapImportantInformation)
    .filter((info): info is ImportantInformation => info !== null);
}

function formatElementName(name: string): string {
  return name.replaceAll("un seringue préremplie", "une seringue préremplie");
}

export async function getFicheInfos(
  CIS: string,
): Promise<FicheInfos | undefined> {
  const eventsPromise = getReinforcedSurveillanceEvents([CIS]);
  const infosImportantesPromise = getImportantInformation(CIS);

  const hasSMRPromise: Promise<Smr[]> = db
    .selectFrom("has_smr")
    .leftJoin("url_has", "url_has.code_ct", "has_smr.code_evamed")
    .where("has_smr.code_cis", "=", CIS)
    .select([
      "has_smr.date_avis_definitif",
      "has_smr.valeur_smr",
      "has_smr.motif_demande",
      "has_smr.libelle_smr",
      "url_has.url",
    ])
    .distinct()
    .orderBy("has_smr.date_avis_definitif", "desc")
    .execute()
    .then((rows) => rows.map(mapSmr));

  const hasASMRPromise: Promise<Asmr[]> = db
    .selectFrom("has_asmr")
    .leftJoin("url_has", "url_has.code_ct", "has_asmr.code_evamed")
    .where("has_asmr.code_cis", "=", CIS)
    .select([
      "has_asmr.date_avis_definitif",
      "has_asmr.valeur_asmr",
      "has_asmr.motif_demande",
      "has_asmr.libelle_asmr",
      "url_has.url",
    ])
    .distinct()
    .orderBy("has_asmr.date_avis_definitif", "desc")
    .execute()
    .then((rows) => rows.map(mapAsmr));

  const hasDocsBUPromise: Promise<DocBonUsage[]> = pdbmMySQL
    .selectFrom("HAS_DocsBonUsage")
    .where("HAS_DocsBonUsage.SpecId", "=", CIS)
    .select([
      "HAS_DocsBonUsage.TypeDoc",
      "HAS_DocsBonUsage.DateMAJ",
      "HAS_DocsBonUsage.TitreDoc",
      "HAS_DocsBonUsage.Url",
    ])
    .distinct()
    .execute()
    .then((rows) =>
      rows.map((row) => ({
        url: row.Url ?? null,
        updatedAt: row.DateMAJ,
        type: row.TypeDoc ?? null,
        title: row.TitreDoc ?? null,
      })),
    );

  const elementsRaw = await db
    .selectFrom("ansm_element")
    .where("cis", "=", CIS)
    .selectAll()
    .execute();
  elementsRaw.sort(
    (left, right) =>
      (left.ordre ?? left.numero_element) -
        (right.ordre ?? right.numero_element) ||
      left.numero_element - right.numero_element,
  );

  const composantsRaw = await getComposants(CIS);

  const elementsComposition: ElementComposition[] = [];
  elementsRaw.forEach((element) => {
    const composantsList = composantsRaw.filter(
      (component) =>
        component.ElmtNum === element.numero_element &&
        component.NatuId === CompositionNature.Substance,
    );
    const fractionsList = composantsRaw.filter(
      (component) =>
        component.ElmtNum === element.numero_element &&
        component.NatuId === CompositionNature.Fraction,
    );
    const referenceDosage = composantsList
      .concat(fractionsList)
      .map(
        (component) =>
          splitDosageReference(component.CompDosage).referenceDosage,
      )
      .find((reference): reference is string => Boolean(reference));
    const composantsComposition: ComposantComposition[] = [];
    if (fractionsList && fractionsList.length > 0) {
      fractionsList.forEach((fraction) => {
        const composantsFractionList = composantsList.filter(
          (component) => component.CompNum === fraction.CompNum,
        );
        composantsComposition.push({
          NomLib: fraction.NomLib,
          dosage: splitDosageReference(fraction.CompDosage).dosage,
          CompNum: fraction.CompNum,
          composants: composantsFractionList
            .map((composant) => {
              return {
                NomLib: composant.NomLib,
                dosage: splitDosageReference(composant.CompDosage).dosage,
                CompNum: composant.CompNum,
              };
            })
            .sort((a, b) => a.CompNum - b.CompNum),
        });
      });
    }
    if (composantsList && composantsList.length > 0) {
      composantsList.forEach((composant) => {
        const isFraction = fractionsList.findIndex(
          (fraction) => fraction.CompNum === composant.CompNum,
        );
        if (isFraction === -1) {
          composantsComposition.push({
            NomLib: composant.NomLib,
            dosage: splitDosageReference(composant.CompDosage).dosage,
            CompNum: composant.CompNum,
          });
        }
      });
    }
    elementsComposition.push({
      referenceDosage: formatElementName(
        referenceDosage ?? element.denomination ?? "",
      ),
      composants: composantsComposition.sort((a, b) => a.CompNum - b.CompNum),
    });
  });

  const [events, infosImportantes, hasSMR, hasASMR, hasDocsBU] =
    await Promise.all([
      eventsPromise,
      infosImportantesPromise,
      hasSMRPromise,
      hasASMRPromise,
      hasDocsBUPromise,
    ]);

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
