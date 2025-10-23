import db from "@/db";
import { Letters, ResumePatho, ResumeSubstance } from "@/db/types";
import { getComposants } from "@/db/utils/composants";
import { getAllPathoWithSpecialites, getSpecialitesPatho } from "@/db/utils/pathologies";
import { getAllSpecialites } from "@/db/utils/specialities";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { displaySimpleComposants, MedicamentGroup } from "@/displayUtils";
import { getNormalizeLetter } from "@/utils/alphabeticNav";
import { getAtc1Code, getAtc2Code, getAtcCode } from "@/utils/atc";
import { getSpecialiteGroupName, groupSpecialites } from "@/utils/specialites";

type DataToResumeType = "pathos" | "substances" | "specialites" | "atc1" | "atc2";

type RawResumePatho = {
  codePatho: string;
  NomPatho: string;
  medicaments: string[];
}

type RawResumeSubstance = {
  SubsId: string;
  NomId: string;
  NomLib: string;
  medicaments: string[];
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
      if(!rawResumeData[index].medicaments.includes(specGroupName)){
        rawResumeData[index].medicaments.push(specGroupName);
      }
    } else rawResumeData.push({
      codePatho: patho.codePatho,
      NomPatho: patho.NomPatho,
      medicaments: [
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
        medicaments: resumePatho.medicaments.length,
      }
    })
    .filter((resumePatho) => resumePatho.medicaments > 0);
  
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
      if(!rawResumeData[index].medicaments.includes(specGroupName)){
        rawResumeData[index].medicaments.push(specGroupName);
      }
    } else rawResumeData.push({
      SubsId: sub.SubsId.trim(),
      NomId: sub.NomId.trim(),
      NomLib: sub.NomLib,
      medicaments: [
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
        medicaments: resumeSub.medicaments.length,
      }
    })
    .filter((resumeSub) => resumeSub.medicaments > 0);
  const result = await db
    .insertInto('resume_substances')
    .values(resumeData)
    .execute();
  console.log(`Nombre de substances ajoutées: ${result[0].numInsertedOrUpdatedRows}`);

  return letters;
}

async function createResumeSpecialites(): Promise<string[]>{
  await db
    .deleteFrom('resume_specialites')
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
      const specialites: string[][] = rawSpecialites.map((spec) => [spec.SpecId, spec.SpecDenom01]);
      const CISList: string[] = rawSpecialites.map((spec) => spec.SpecId.trim());
      const pathosCodes: string[] = await getSpecialitesPatho(CISList);
      const atc = getAtcCode(rawSpecialites[0].SpecId);
      const atc1: string | undefined = atc ? getAtc1Code(atc) : undefined;
      const atc2: string | undefined = atc ? getAtc2Code(atc) : undefined;
        
      const subLetter = getNormalizeLetter(groupName.substring(0,1));
      if(!letters.includes(subLetter)) letters.push(subLetter);

      await db
        .insertInto('resume_specialites')
        .values({
          groupName: groupName,
          composants: composants,
          pathosCodes: pathosCodes,
          specialites: specialites,
          atc1Code: atc1,
          atc2Code: atc2,
          CISList: CISList,
        })
        .execute();
      return true;
    })
  );
  console.log(`Nombre de médicaments ajoutées: ${results.length}`);

  return letters;
}

async function createResumeDataFromBDPM(){
  if(dataToResume === "pathos" || dataToResume === "substances" || dataToResume === "specialites") {
    let letters: string[] = [];
    if(dataToResume === "pathos") {
      letters = await createResumePathologies(); 
    } else if(dataToResume === "substances"){
      letters = await createResumeSubstances();
    } else if(dataToResume === "specialites"){
      letters = await createResumeSpecialites();
    }

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
  } else {
    
  }/* else if(dataToResume === "atc1"){
    await createResumeATC1Definition();
  }*/
  return true;
}

createResumeDataFromBDPM();
