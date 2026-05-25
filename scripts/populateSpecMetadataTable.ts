import db from "@/db";
import { Specialite } from "@/db/pdbmMySQL/types";
import { NoticeContentDB, NoticeDB, SpecialiteMetadata } from "@/db/types";
import { getAllNoticesContent, getAllNoticesWithoutChildren, getNotice } from "@/db/utils/notice";
import { getAllSpecialites } from "@/db/utils/specialities";
import { NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import { formatNoticeDateNotif, getIndicationsBlock } from "@/utils/notices";

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

function getNoticeChildren(children: number[], noticeContent: NoticeContentDB[]): NoticeRCPContentBlock[] {
  const childrenContent: NoticeRCPContentBlock[] = [];
  children.forEach((child) => {
    const contentData = noticeContent.find((content) => content.id === child);
    if(contentData) {
      childrenContent.push({
        id: contentData.id,
        type: contentData.type,
        styles: contentData.styles,
        anchor: contentData.anchor,
        content: contentData.content,
        children: (contentData.children && contentData.children.length > 0) 
          ? getNoticeChildren(contentData.children, noticeContent) : [],
        tag: contentData.tag,
        rowspan: contentData.rowspan,
        colspan: contentData.colspan,
      });
    }
  });
  return childrenContent;
}

export async function populateSpecMetadataTable(): Promise<void> {
  await db
    .deleteFrom('specialites_metadata')
    .execute();

  const allSpecialites: Specialite[] = await getAllSpecialites();
  const allNotices: NoticeDB[] = await getAllNoticesWithoutChildren();
  const allNoticesContent: NoticeContentDB[] = await getAllNoticesContent();

  const specMetadata: SpecialiteMetadata[] = [];
  allSpecialites.forEach((spec: Specialite) => {
    const noticeDB = allNotices.find((notice: NoticeDB) => notice.codeCIS.toString() === spec.SpecId.trim());
    
    if(noticeDB) {
      //We don't really need of the formatted notice date but trying to keep it right for the future
      const noticeData: NoticeData = {
        codeCIS: noticeDB.codeCIS,
        title: noticeDB.title,
        dateNotif: formatNoticeDateNotif(noticeDB.dateNotif),
        children: (noticeDB.children && noticeDB.children.length > 0) 
          ? getNoticeChildren(noticeDB.children, allNoticesContent) : [],
      }
      let desc = "";
      const indicationsBlock = getIndicationsBlock(noticeData);
      if(indicationsBlock && indicationsBlock.children){
        desc = getChildrenText(indicationsBlock.children);
      }
      const metadata = {
        CIS: noticeData.codeCIS,
        title: spec.SpecDenom01,
        description: desc,
      };
      specMetadata.push(metadata);
    }
  });

  const result = await db
    .insertInto('specialites_metadata')
    .values(specMetadata)
    .execute();
  console.log(`Nombre de specialites ajoutées: ${result[0].numInsertedOrUpdatedRows}`);
}

populateSpecMetadataTable().finally(async () => {
  await db.destroy();
  process.exit(0);
});