import db from "@/db";
import { FichesInfosDB, DocBUDB, GroupeGeneriqueDB } from "@/db/types";
import path from "node:path";

if (process.argv.length !== 3) {
  console.info('Usage: npx tsx scripts/importFichesInfos.ts poolNumber');
  process.exit(1);
}

const pool: number[][] = [
  [1, 1000], //0
  [1001, 2000], //1
  [2001, 3000], //2
  [3001, 4000], //3
  [4001, 5000], //4
  [5001, 6000], //5
  [6001, 7000], //6
  [7001, 8000], //7
  [8001, 9000], //8
  [9001, 10000], //9
  [10001, 11000], //10
  [11001, 12000], //11
  [12001, 13000], //12
  [13001, 14000], //13
  [14001, 15000], //14
  [15001, 16000], //15
  [16001, 17000], //16
  [17001, 18000], //17
  [18001, 19000], //18
  [19001, 20000], //19
  [20001, 21000], //20
  [21001, 22000], //21
  [22001, 23000], //22
  [23001, 24000], //23
  [24001, 25000], //24
  [25001, 26000], //25
  [26001, 27000], //26
  [27001, 28000], //27
  [28001, 29000], //28
  [29001, 30000], //29
  [30001, 31000], //30
  [31001, 32000], //31
  [32001, 33000], //32
  [33001, 34000], //33
  [34001, 35000], //34
  [35001, 38000], //35
];
const poolNumber:number = parseInt(process.argv[2]);
const poolBegin:number = pool[poolNumber][0];
const poolEnd:number = pool[poolNumber][1];

const readline = require('readline');
const fs = require('fs');

async function importFichesInfos(){

  const pathfile = path.join(process.cwd(), "scripts", "fiches_infos.jsonl");

  // create a readline interface for reading the file line by line
  const rl = readline.createInterface({
    input: fs.createReadStream(pathfile),
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  // // read each line of the file and parse it as JSON
  await rl.on('line', async (line: any) => {
    lineNumber++;
    if(poolBegin > lineNumber) return;
    if(poolEnd < lineNumber) return;
    //console.log(lineNumber);
    const ficheInfoRaw = JSON.parse(line);

    if(ficheInfoRaw.Specialite.SpecId) {
      //Groupe générique
      const groupesGeneriquesIds:number[] = [];
      if(ficheInfoRaw.GroupesGeneriques.listeGroupesGeneriques){
        const groupesGeneriques = ficheInfoRaw.GroupesGeneriques.listeGroupesGeneriques;
        groupesGeneriques.forEach((group: any) => {
            groupesGeneriquesIds.push(group.idGroupeGenerique);
        });
        if(groupesGeneriquesIds){  
          try {
            const groupesGeneriquesFromDB = await db
              .selectFrom("groupes_generiques")
              .select("idGroupeGenerique")
              .where("idGroupeGenerique", "in", groupesGeneriquesIds)
              .execute();
              await Promise.all(
                groupesGeneriques.map(async (group: GroupeGeneriqueDB) => {
                  if(groupesGeneriquesFromDB.findIndex((groupFromDB) => parseInt(groupFromDB.idGroupeGenerique.toString()) === group.idGroupeGenerique) === -1){
                    await db.insertInto("groupes_generiques")
                      .values(group)
                      .execute();
                  }
                })
              );
          } catch(e){
            console.log("ERROR");
            console.log(ficheInfoRaw.Specialite.SpecId);
            console.log(e);
          }
        };
      }

      //Documents bon usage
      const docsBUIDs: number[] = [];
      if(ficheInfoRaw.DocumentsBonUsage.listeDocumentsBonUsage) {
        const docsBU = ficheInfoRaw.DocumentsBonUsage.listeDocumentsBonUsage;
        const ids = await db.insertInto("documents_bon_usage")
          .values(docsBU)
          .returning('id')
          .execute();
        ids.forEach((id) => (id && id.id !== undefined) && docsBUIDs.push(id.id));
      }

      //SMR
      const smrIDs: number[] = [];
      if(ficheInfoRaw.SMR.listeSMR) {
        const listeSMR = ficheInfoRaw.SMR.listeSMR;
        const ids = await db.insertInto("smr")
          .values(listeSMR)
          .returning('id')
          .execute();
        ids.forEach((id) => (id && id.id !== undefined) && smrIDs.push(id.id));
      }
      //ASMR
      const asmrIDs: number[] = [];
      if(ficheInfoRaw.ASMR.listeASMR) {
        const listeASMR = ficheInfoRaw.ASMR.listeASMR;
        const ids = await db.insertInto("asmr")
          .values(listeASMR)
          .returning('id')
          .execute();
        ids.forEach((id) => (id && id.id !== undefined) && asmrIDs.push(id.id));
      }

      //Composants
      const composantsIDs: number[] = [];
      if(ficheInfoRaw.Composants.listeComposants){
        const listeComposants = ficheInfoRaw.Composants.listeComposants;
        if(listeComposants){
          const ids = await db.insertInto("composants")
            .values(listeComposants)
            .returning('id')
            .execute()
          ids.forEach((id) => (id && id.id !== undefined) && composantsIDs.push(id.id));
        };
      }

      const presentations: string[] = [];
      if(ficheInfoRaw.Presentations.presentations){
        (ficheInfoRaw.Presentations.presentations).forEach((pres: any) => {
          if(pres && pres.codeCIP13) presentations.push(pres.codeCIP13);
        })
      }

      //Fiche info
      const ficheInfo: FichesInfosDB = {
        specId: ficheInfoRaw.Specialite.SpecId,
        listeInformationsImportantes: ficheInfoRaw.InformationsImportantes.listeInformationsImportantes ? ficheInfoRaw.InformationsImportantes.listeInformationsImportantes : undefined,
        listeGroupesGeneriquesIds: groupesGeneriquesIds,
        listeComposants: composantsIDs,
        listeTitulaires: ficheInfoRaw.Titulaires.listeTitulaires ? ficheInfoRaw.Titulaires.listeTitulaires : undefined,
        listeDocumentsBonUsageIds: docsBUIDs,
        listeASMR: asmrIDs,
        listeSMR: smrIDs,
        listeConditionsDelivrance: ficheInfoRaw.ConditionsDelivrancePrescription.listeConditionsDelivrance ? ficheInfoRaw.ConditionsDelivrancePrescription.listeConditionsDelivrance : undefined,
        libelleCourtAutorisation: ficheInfoRaw.StatutAutorisation.libelleCourtAutorisation ? ficheInfoRaw.StatutAutorisation.libelleCourtAutorisation : undefined,
        libelleCourtProcedure: ficheInfoRaw.TypeProcedure.libelleCourtProcedure ? ficheInfoRaw.TypeProcedure.libelleCourtProcedure : undefined,
        presentations: presentations,
      };
      
      db.insertInto("fiches_infos")
        .values(ficheInfo)
        .execute();

      //console.log(ficheInfoRaw.Specialite.SpecId);
    }
  });

  // // log the parsed JSON objects once the file has been fully read
  rl.on('close', () => {
    //console.log(fichesInfosRaw);
  });
};

importFichesInfos();
