import db from "@/db";
import { Specialite } from "@/db/pdbmMySQL/types";
import { SpecialiteMetadata } from "@/db/types";
import { getNoticesByCIS } from "@/db/utils/notice";
import { getAllSpecialites } from "@/db/utils/specialities";
import { getIndicationsBlock } from "@/utils/noticeHtml";
import { parse } from "node-html-parser";

//npx tsx scripts/populateSpecMetadataTable.ts

const NOTICE_BATCH_SIZE = 50;
const INSERT_CHUNK_SIZE = 500;

function getIndicationsText(contentHtml: string): string {
  const indicationsBlock = getIndicationsBlock(contentHtml);
  if (!indicationsBlock) return "";

  return parse(indicationsBlock)
    .childNodes
    .map((node) => node.textContent.trim())
    .filter(Boolean)
    .join(" ");
}

export async function populateSpecMetadataTable(): Promise<void> {
  await db
    .deleteFrom('specialites_metadata')
    .execute();

  const allSpecialites: Specialite[] = await getAllSpecialites();

  let buffer: SpecialiteMetadata[] = [];
  let totalInserted = 0;

  const flush = async () => {
    if (buffer.length === 0) return;
    await db
      .insertInto('specialites_metadata')
      .values(buffer)
      .execute();
    totalInserted += buffer.length;
    buffer = [];
  };

  // Add metadata informations for all notices even if no indications text
  for (let i = 0; i < allSpecialites.length; i += NOTICE_BATCH_SIZE) {
    const batch = allSpecialites.slice(i, i + NOTICE_BATCH_SIZE);
    const batchCIS = batch.map((spec) => Number(spec.SpecId.trim()));
    const notices = await getNoticesByCIS(batchCIS);
    const noticeByCIS = new Map(
      notices.map((notice) => [notice.codeCIS, notice]),
    );

    const metadatas = await Promise.all(
      batch.map(async (spec) => {
        const noticeDB = noticeByCIS.get(Number(spec.SpecId.trim()));
        const description = noticeDB?.content_html
          ? getIndicationsText(noticeDB.content_html)
          : "";
        return {
          CIS: Number(spec.SpecId.trim()),
          title: spec.SpecDenom01,
          description,
        };
      }),
    );

    buffer.push(...metadatas);
    if (buffer.length >= INSERT_CHUNK_SIZE) await flush();
  }

  await flush();

  console.log(`Nombre de specialites ajoutées: ${totalInserted}`);
}

populateSpecMetadataTable()
  .then(() => process.exitCode = 0)
  .catch((err) => {
    console.error("populateSpecMetadataTable failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
    process.exit(process.exitCode ?? 0);
  });
