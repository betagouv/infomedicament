import db from "@/db";
import { Database } from "@/db/types";
import path from "node:path";
import { createAddContent } from "./utils/contentParser"
import readline from "node:readline";
import fs from "node:fs";

type ImportType = "notice" | "rcp";
type ImportData = {
  filename: string,
  mainTable: keyof Database,
  contentTable: keyof Database,
};

type Rcp = {
  codeCIS: number;
  title?: string;
  dateNotif?: string;
  children?: number[];
}

if (process.argv.length !== 4) {
  console.info('Usage: npx tsx scripts/importNoticeRcp.ts importType poolNumber');
  process.exit(1);
}

const type = process.argv[2] as ImportType;
const importData: ImportData = (type === "notice")
  ? {
    filename: "notices_5000.jsonl",
    mainTable: "notices",
    contentTable: "notices_content",

  } : {
    filename: "rcp_5000.jsonl",
    mainTable: "rcp",
    contentTable: "rcp_content",
  };

const pool: number[][] = [
  [1, 200], //0
  [201, 400], //1
  [401, 600], //2
  [601, 800], //3
  [801, 1000], //4
  [1001, 1200], //5
  [1201, 1400], //6
  [1401, 1600], //7
  [1601, 1800], //8
  [1801, 2000], //9
  [2001, 2200], //10
  [2201, 2400], //11
  [2401, 2600], //12
  [2601, 2800], //13
  [2801, 3000], //14
  [3001, 3200], //15
  [3201, 3400], //16
  [3401, 3600], //17
  [3601, 3800], //18
  [3801, 4000], //19
  [4001, 4200], //20
  [4201, 4400], //21
  [4401, 4600], //22
  [4601, 4800], //23
  [4801, 5000], //24
];
const poolNumber: number = parseInt(process.argv[3]);
const poolBegin: number = pool[poolNumber][0];
const poolEnd: number = pool[poolNumber][1];

async function importNoticeRcp() {
  const addContent = createAddContent(db, importData.contentTable);
  const pathfile = path.join(process.cwd(), "scripts", importData.filename);

  // create a readline interface for reading the file line by line
  const rl = readline.createInterface({
    input: fs.createReadStream(pathfile),
    crlfDelay: Infinity
  });

  let lineNumber = 0;

  // Read lines sequentially
  for await (const line of rl) {
    lineNumber++;
    if (poolBegin > lineNumber) continue;
    if (poolEnd < lineNumber) continue;
    console.debug(lineNumber);

    const rawLine = JSON.parse(line);
    if (!rawLine.source) continue;

    const codeCIS = rawLine.source.cis;
    if (!codeCIS) {
      console.log("Code CIS error : " + rawLine.source);
      continue;
    }

    const RCP: Rcp = {
      codeCIS: codeCIS,
      title: "",
      dateNotif: "",
      children: [],
    }
    if (rawLine.content && Array.isArray(rawLine.content)) {
      // Extract metadata
      for (const data of rawLine.content) {
        if (data.type === "DateNotif") RCP.dateNotif = data.content;
        else if (data.type === "AmmAnnexeTitre") RCP.title = data.content;
      }

      // Filter and process content blocks
      const contentBlocks = rawLine.content.filter(
        (data: any) => data.type !== "DateNotif" && data.type !== "AmmAnnexeTitre" && (data.content || data.children)
      );

      if (contentBlocks.length > 0) {
        RCP.children = await addContent(contentBlocks);
      }
    }

    //Même si RCP vide, j'insert
    const result = await db.insertInto(importData.mainTable)
      .values(RCP)
      .execute();

  }
};

console.log("Import terminé")

importNoticeRcp();
