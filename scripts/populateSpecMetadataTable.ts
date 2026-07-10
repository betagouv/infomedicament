import db from "@/db";
import { Specialite } from "@/db/pdbmMySQL/types";
import { NoticeDB, SpecialiteMetadata } from "@/db/types";
import { getAllNoticesWithoutChildren, getIndicationsText } from "@/db/utils/notice";
import { getAllSpecialites } from "@/db/utils/specialities";

//npx tsx scripts/populateSpecMetadataTable.ts

// Process notices in batches so we never hold the whole notices_content table
// in memory (that load was the source of the OOM on Scalingo).
const NOTICE_BATCH_SIZE = 50;
const INSERT_CHUNK_SIZE = 500;

export async function populateSpecMetadataTable(): Promise<void> {
  await db
    .deleteFrom('specialites_metadata')
    .execute();

  const allSpecialites: Specialite[] = await getAllSpecialites();
  const allNotices: NoticeDB[] = await getAllNoticesWithoutChildren();

  // Notices carry their top-level children ids but no content text, so this map
  // is cheap to keep around.
  const noticeByCIS = new Map<string, NoticeDB>(
    allNotices.map((notice) => [notice.codeCIS.toString(), notice]),
  );

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

    const metadatas = await Promise.all(
      batch.map(async (spec) => {
        const noticeDB = noticeByCIS.get(spec.SpecId.trim());
        const description =
          noticeDB && noticeDB.children && noticeDB.children.length > 0
            ? await getIndicationsText(noticeDB.children)
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
