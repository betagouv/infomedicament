import db from "@/db";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Letters, LetterType, ResumeGeneric, ResumePatho, ResumeSubstance } from "@/db/types";
import { groupGeneNameToDCI } from "@/db/utils";
import { getComposants } from "@/db/utils/composants";
import { getEvents } from "@/db/utils/ficheInfos";
import { getAllPathoWithSpecialites, getSpecialitesPatho } from "@/db/utils/pathologies";
import { getAllSpecialites } from "@/db/utils/specialities";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { displaySimpleComposants, formatSpecName, MedicamentGroup } from "@/displayUtils";
import { getNormalizeLetter } from "@/utils/alphabeticNav";
import { getAtc1Code, getAtc2Code, getAtcCode } from "@/utils/atc";
import { getSpecialiteGroupName, groupSpecialites, isSurveillanceRenforcee } from "@/utils/specialites";

type DataToResumeType = "pathos" | "substances" | "specialites" | "atc1" | "atc2" | "generiques";

type RawResumePatho = {
  codePatho: string;
  NomPatho: string;
  specialites: string[];
}

type RawResumeSubstance = {
  SubsId: string;
  NomId: string;
  NomLib: string;
  specialites: string[];
}

if (process.argv.length !== 3) {
  console.info('Usage: npx tsx scripts/updateResumeData.ts dataToResume');
  process.exit(1);
}
const dataToResume:DataToResumeType = process.argv[2] as DataToResumeType;

async function createResumePathologies(): Promise<string[]>{
  await db
    .deleteFrom('resume_pathologies')
    .execute();

  const allPathos = await getAllPathoWithSpecialites();
  const rawResumeData: RawResumePatho[] = [];
  const letters: string[] = [];
  allPathos.forEach((patho) => {
    const index = rawResumeData.findIndex((resumePatho) => resumePatho.codePatho === patho.codePatho);
    if(index !== -1) {
      const specGroupName = getSpecialiteGroupName(patho.SpecDenom01);
      if(!rawResumeData[index].specialites.includes(specGroupName)){
        rawResumeData[index].specialites.push(specGroupName);
      }
    } else rawResumeData.push({
      codePatho: patho.codePatho,
      NomPatho: patho.NomPatho,
      specialites: [
        getSpecialiteGroupName(patho.SpecDenom01),
      ]
    });
    const pathoLetter = getNormalizeLetter(patho.NomPatho.substring(0,1));
    if(!letters.includes(pathoLetter)) letters.push(pathoLetter);
  });

  const resumeData: ResumePatho[] = rawResumeData
    .map((resumePatho) => {
      return {
        codePatho: resumePatho.codePatho,
        NomPatho: resumePatho.NomPatho,
        specialites: resumePatho.specialites.length,
      }
    })
    .filter((resumePatho) => resumePatho.specialites > 0);
  
  const result = await db
    .insertInto('resume_pathologies')
    .values(resumeData)
    .execute();
  console.log(`Nombre de pathologies ajoutées: ${result[0].numInsertedOrUpdatedRows}`);
  
  return letters;
}

async function createResumeSubstances(): Promise<string[]>{
  await db
    .deleteFrom('resume_substances')
    .execute();

  const allSubs = await getAllSubsWithSpecialites();

  const rawResumeData: RawResumeSubstance[] = [];
  const letters: string[] = [];
  allSubs.forEach((sub) => {
    const index = rawResumeData.findIndex((resumeData) => resumeData.NomId.trim() === sub.NomId.trim());
    const specGroupName = getSpecialiteGroupName(sub.SpecDenom01);
    if(index !== -1) {
      if(!rawResumeData[index].specialites.includes(specGroupName)){
        rawResumeData[index].specialites.push(specGroupName);
      }
    } else rawResumeData.push({
      SubsId: sub.SubsId.trim(),
      NomId: sub.NomId.trim(),
      NomLib: sub.NomLib,
      specialites: [
        specGroupName,
      ],
    });
    const subLetter = getNormalizeLetter(sub.NomLib.substring(0,1));
    if(!letters.includes(subLetter)) letters.push(subLetter);
  });
  const resumeData: ResumeSubstance[] = rawResumeData
    .map((resumeSub) => {
      return {
        SubsId: resumeSub.SubsId,
        NomId: resumeSub.NomId,
        NomLib: resumeSub.NomLib,
        specialites: resumeSub.specialites.length,
      }
    })
    .filter((resumeSub) => resumeSub.specialites > 0);
  const result = await db
    .insertInto('resume_substances')
    .values(resumeData)
    .execute();
  console.log(`Nombre de substances ajoutées: ${result[0].numInsertedOrUpdatedRows}`);

  return letters;
}

async function createResumeSpecialites(): Promise<string[]>{
  await db
    .deleteFrom('resume_medicaments')
    .execute();

  const allSpecialites = await getAllSpecialites();
  const medicaments: MedicamentGroup[] = groupSpecialites(allSpecialites);
  const letters: string[] = [];
  const results = await Promise.all(
    medicaments.map(async (medGroup) => {
      const [groupName, rawSpecialites] = medGroup;
      const rawComposants = await getComposants(rawSpecialites[0].SpecId);
      const composants: string = displaySimpleComposants(rawComposants)
        .map((s) => s.NomLib.trim())
        .join(", ");
      const subsIds: string[] = rawComposants.map((subs) => subs.SubsId.trim());
      const specialites: string[][] = await Promise.all(
        rawSpecialites.map(async (spec) => {
          const events = await getEvents(spec.SpecId);
          const surveillanceRenforcee: string = isSurveillanceRenforcee(events) ? "true" : "false";
          return [
            spec.SpecId, 
            spec.SpecDenom01, 
            spec.StatutBdm.toString(), 
            spec.ProcId, 
            surveillanceRenforcee,
          ];
        })
      );
      const CISList: string[] = rawSpecialites.map((spec) => spec.SpecId.trim());
      const pathosCodes: string[] = await getSpecialitesPatho(CISList);
      const atc = getAtcCode(rawSpecialites[0].SpecId);
      const atc1: string | undefined = atc ? getAtc1Code(atc) : undefined;
      const atc2: string | undefined = atc ? getAtc2Code(atc) : undefined;
        
      const subLetter = getNormalizeLetter(groupName.substring(0,1));
      if(!letters.includes(subLetter)) letters.push(subLetter);

      await db
        .insertInto('resume_medicaments')
        .values({
          groupName: groupName,
          composants: composants,
          pathosCodes: pathosCodes,
          specialites: specialites,
          atc1Code: atc1,
          atc2Code: atc2,
          CISList: CISList,
          subsIds: subsIds,
        })
        .execute();
      return true;
    })
  );
  console.log(`Nombre de médicaments ajoutés: ${results.length}`);

  return letters;
}

async function createResumeGeneriques(): Promise<string[]>{
  await db
    .deleteFrom('resume_generiques')
    .execute();

  const allGenerics = await pdbmMySQL
    .selectFrom("Specialite")
    .innerJoin("GroupeGene", "Specialite.SpecGeneId", "GroupeGene.SpecId")
    .where("Specialite.ProcId", "!=", "50")
    .where("Specialite.IsBdm", "=", 1)
    .select(["Specialite.SpecGeneId", "GroupeGene.LibLong"])
    .groupBy(["GroupeGene.LibLong", "GroupeGene.SpecId"])
    .orderBy("GroupeGene.LibLong")
    .execute();

  const letters: string[] = [];
  const resumeData: ResumeGeneric[] = allGenerics
    .map((generic) => {
      const genericName:string = formatSpecName(groupGeneNameToDCI(generic.LibLong));
      const subLetter = getNormalizeLetter(genericName.substring(0,1));
      if(!letters.includes(subLetter)) letters.push(subLetter);
      return {
          SpecId: generic.SpecGeneId,
          SpecName: genericName,
      }
    });
  const result = await db
    .insertInto('resume_generiques')
    .values(resumeData)
    .execute();
  console.log(`Nombre de génériques ajoutées: ${result[0].numInsertedOrUpdatedRows}`);

  return letters;
}

async function saveResumeLetters(
  dataToResume: LetterType,
  letters: string[]
): Promise<boolean>{
  console.log("Ajout des letters");
  const lettersValue: Letters = {
    type: dataToResume,
    letters: letters,
  }
  await db
    .deleteFrom('letters')
    .where("type", "=", dataToResume)
    .execute();
  await db
    .insertInto('letters')
    .values(lettersValue)
    .execute();

  return true;
}

async function createResumeDataFromBDPM(){
  if(dataToResume === "pathos" || dataToResume === "substances" || dataToResume === "specialites" || dataToResume === "generiques") {
    let letters: string[] = [];
    if(dataToResume === "pathos") {
      const letters = await createResumePathologies(); 
    } else if(dataToResume === "substances"){
      letters = await createResumeSubstances();
    } else if(dataToResume === "specialites"){
      letters = await createResumeSpecialites();
    } else if(dataToResume === "generiques"){
      letters = await createResumeGeneriques();
    }
    saveResumeLetters(dataToResume, letters);
  } else {
    
  }/* else if(dataToResume === "atc1"){
    await createResumeATC1Definition();
  }*/
  process.exit(0);
}

createResumeDataFromBDPM();
