import db from "@/db";
import { Database } from "@/db/types";
import path from "node:path";

type ImportType = "notice" | "rcp";
type ImportData = {
  filename: string,
  mainTable: keyof Database,
  contentTable: keyof Database,
};

type ContentBlock = {
  type?: string,
  styles?: string[],
  anchor?: string,
  content?: string[],
  html?: string,
  children?: number[],
  tag?: string,
  rowspan?: number,
  colspan?: number,
}
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

const readline = require('readline');
const fs = require('fs');

const type = process.argv[2] as ImportType;
const importData:ImportData = (type === "notice") 
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
const poolNumber:number = parseInt(process.argv[3]);
const poolBegin:number = pool[poolNumber][0];
const poolEnd:number = pool[poolNumber][1];

function getCleanHTML(htmlToClean: string): string{
  let cleanHTML: string = htmlToClean;
  let indexAEmpty:number = cleanHTML.indexOf("<a name=");
  while(indexAEmpty !== -1){
    var indexAEmptyEnd:number = cleanHTML.indexOf(">", indexAEmpty);
    if(indexAEmptyEnd === -1) break; 
    var indexAEmptyClose:number = cleanHTML.indexOf("</a>", indexAEmptyEnd);
    if(indexAEmptyClose === -1) break; 
    const newCleanHTML = cleanHTML.slice(0, indexAEmpty - 1) + cleanHTML.slice(indexAEmptyEnd + 1, indexAEmptyClose - 1) + cleanHTML.slice(indexAEmptyClose + 4);
    cleanHTML = newCleanHTML;
    indexAEmpty = cleanHTML.indexOf("<a name=");
  }
  return cleanHTML;
}

async function getContentFromData(data: any, isTable?: boolean): Promise<ContentBlock>{
  const contentBlock:ContentBlock = {
    type: "",
    styles: [],
    anchor: "",
    content: [],
    html: "",
    children: [],
    tag: "",
    rowspan: undefined,
    colspan: undefined,
  }

  if(data.type) contentBlock.type = data.type;
  if(data.anchor) contentBlock.anchor = data.anchor;
  if(data.styles) contentBlock.styles = !Array.isArray(data.styles) ? [data.styles] : data.styles;

  if((data.type && data.type === "table") || isTable){
    if(data.tag) contentBlock.tag = data.tag;
    if(data.attributes){ 
      if(data.attributes.class && (data.type === "table" || !data.type)) contentBlock.type = data.attributes.class;
      if(data.attributes.colspan) contentBlock.colspan = parseInt(data.attributes.colspan);
      if(data.attributes.rowspan) contentBlock.rowspan = parseInt(data.attributes.rowspan);
    }
    if(data.html) contentBlock.html = data.html;
    // if(data.children && data.children.length > 0) contentBlock.children = await addContent(data.children, true);
  } else {
    if(data.content) contentBlock.content = !Array.isArray(data.content) ? [data.content] : data.content;
    if(data.html){
      contentBlock.html = getCleanHTML(data.html);
    }
    if(data.children) contentBlock.children = await addContent(data.children);
  }
  return contentBlock;
}

async function addContent(childrenData: any, isTable?: boolean): Promise<number[]>{
  const childrenToInsert:(ContentBlock | boolean)[] =  await Promise.all(
    childrenData.map(async(data: any) => {
      if(data.content || data.children || data.text){
        return await getContentFromData(data, isTable);
      }
      else return false;
    })
  );
  const ids:number[] = [];
  if(childrenToInsert.length > 0) {
    const filteredChildren = childrenToInsert.filter((child) => child !== false);
    if(filteredChildren.length > 0) {
      try {
        const rawIds = await db.insertInto(importData.contentTable)
          .values(filteredChildren)
          .returning('id')
          .execute();
        rawIds.forEach((id) => (id && id.id !== undefined) && ids.push(parseInt(id.id as string)) );
      } catch(e){
        console.log("childrenToInsert");
        console.log(childrenToInsert);
        console.log(e);
      }
    }
  }
  return ids;
}

async function importNoticeRcp(){
  
  const pathfile = path.join(process.cwd(), "scripts", importData.filename);

  // create a readline interface for reading the file line by line
  const rl = readline.createInterface({
    input: fs.createReadStream(pathfile),
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  // read each line of the file and parse it as JSON
  await rl.on('line', async (line: any) => {
    lineNumber++;
    if(poolBegin > lineNumber) return;
    if(poolEnd < lineNumber) return;
    console.log(lineNumber);

    const rawLine = JSON.parse(line);
    if(rawLine.source) {
      const codeCIS = rawLine.source.cis;
      if(!codeCIS){
        console.log("Code CIS error : " + rawLine.source);
        return;
      }

      const RCP:Rcp = {
        codeCIS: codeCIS,
        title: "",
        dateNotif: "",
        children: [],
      }
      if(rawLine.content && Array.isArray(rawLine.content)) {
        const childrenToInsert:(ContentBlock | boolean)[] = await Promise.all(
          rawLine.content.map(async (data: any) => {
            if(data.type === "DateNotif") RCP.dateNotif = data.content;
            else if(data.type === "AmmAnnexeTitre") RCP.title = data.content;
            else {
              //Blocs de contenu
              if(data.content || data.children){
                return await getContentFromData(data);
              }
            }
            return false;
          })
        );

        if(childrenToInsert.length > 0) {
          const filteredChildren = childrenToInsert.filter((child) => child !== false);
          if(filteredChildren.length > 0) {
            const ids = await db.insertInto(importData.contentTable)
              .values(filteredChildren)
              .returning('id')
              .execute();
            ids.forEach((id) => (id && id.id !== undefined) && RCP.children?.push(parseInt(id.id as string)) );
          }
        }
      }

      //Même si RCP vide, j'insert
      const result = await db.insertInto(importData.mainTable)
        .values(RCP)
        .execute();

    }
  });

  // log the parsed JSON objects once the file has been fully read
  rl.on('close', () => {
  });
}

importNoticeRcp();
