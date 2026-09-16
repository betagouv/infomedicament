import db from "@/db";
import { SpecialiteMetadata } from "@/db/types";
import { getNoticesByCIS } from "@/db/utils/notice";
import { mapCatalogSpecialite, VISIBLE_SPECIALITE_AVAILABILITIES } from "@/db/utils/specialiteCatalog";
import { requireNonEmpty } from "@/db/utils/refreshGuard";
import { getIndicationsBlock } from "@/utils/noticeHtml";
import { Specialite } from "@/types/SpecialiteTypes";
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
  const allSpecialites: Specialite[] = await db
    .selectFrom("ansm_specialite")
    .where("disponibilite", "in", VISIBLE_SPECIALITE_AVAILABILITIES)
    .selectAll()
    .orderBy("denomination")
    .execute()
    .then((rows) => rows.map(mapCatalogSpecialite));
  requireNonEmpty("visible specialities", allSpecialites);

  const metadatas: SpecialiteMetadata[] = [];

  // Add metadata informations for all notices even if no indications text
  for (let i = 0; i < allSpecialites.length; i += NOTICE_BATCH_SIZE) {
    const batch = allSpecialites.slice(i, i + NOTICE_BATCH_SIZE);
    const batchCIS = batch.map((spec) => Number(spec.SpecId.trim()));
    const notices = await getNoticesByCIS(batchCIS);
    const noticeByCIS = new Map(
      notices.map((notice) => [notice.codeCIS, notice]),
    );

    const batchMetadatas = await Promise.all(
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

    metadatas.push(...batchMetadatas);
  }

  requireNonEmpty("speciality metadata", metadatas);

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("specialites_metadata").execute();
    for (let i = 0; i < metadatas.length; i += INSERT_CHUNK_SIZE) {
      await trx
        .insertInto("specialites_metadata")
        .values(metadatas.slice(i, i + INSERT_CHUNK_SIZE))
        .execute();
    }
  });

  console.log(`Speciality metadata: ${metadatas.length} rows inserted`);
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
