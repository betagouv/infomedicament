import db from "@/db";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Specialite } from "@/db/pdbmMySQL/types";
import { SpecialiteMetadata } from "@/db/types";
import { getNotice } from "@/db/utils/notice";
import { getAllSpecialites } from "@/db/utils/specialities";
import { NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { getIndicationsBlock } from "@/utils/notices";

//npx tsx scripts/populateSpecMetadataTable.ts

function getChildrenText(children: NoticeRCPContentBlock[]): string {
  let desc: string = "";
  children.forEach((block: NoticeRCPContentBlock) => {
    if(block.content) {
      desc += (desc !== "" ? " " : "") + block.content.join(" ");
    }
    if(block.children) {
      desc += (desc !== "" ? " " : "") + getChildrenText(block.children);
    }
  });
  return desc;
}

async function populateSpecMetadataTable(): Promise<void> {
  await db
    .deleteFrom('specialites_metadata')
    .execute();

  const allSpecialites: Specialite[] = await getAllSpecialites();
  const specMetadata: SpecialiteMetadata[] = await Promise.all(
    allSpecialites.map(async (spec: Specialite) => {
      const notice = await getNotice(spec.SpecId);
      let desc = "";
      if(notice) {
        const indicationsBlock = getIndicationsBlock(notice);
        if(indicationsBlock && indicationsBlock.children){
          desc = getChildrenText(indicationsBlock.children);
        }
      }
      return {
        CIS: Number(spec.SpecId.trim()),
        title: spec.SpecDenom01,
        description: desc,
      }
    }
  ));

  const result = await db
    .insertInto('specialites_metadata')
    .values(specMetadata)
    .execute();
  console.log(`Nombre de specialites ajoutées: ${result[0].numInsertedOrUpdatedRows}`);
}

populateSpecMetadataTable().finally(async () => {
  await db.destroy();
  await pdbmMySQL.destroy();
  process.exit(0);
});