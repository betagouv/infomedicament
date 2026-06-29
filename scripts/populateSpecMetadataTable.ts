import db from "@/db";
import { AnsmSpecialite, NoticeDB, SpecialiteMetadata } from "@/db/types";
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

  const allSpecialites: AnsmSpecialite[] = await getAllSpecialites();
  const allNotices: NoticeDB[] = await getAllNoticesWithoutChildren();

  // Notices carry their top-level children ids but no content text, so this map
  // is cheap to keep around.
  const noticeByCIS = new Map<string, NoticeDB>(
    allNotices.map((notice) => [notice.codeCIS.toString(), notice]),
  );

  // Only the specialites that have a matching notice get a metadata row.
  const specsWithNotice = allSpecialites.flatMap((spec) => {
    const noticeDB = noticeByCIS.get(spec.cis.trim());
    return noticeDB ? [{ spec, noticeDB }] : [];
  });

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

  for (let i = 0; i < specsWithNotice.length; i += NOTICE_BATCH_SIZE) {
    const batch = specsWithNotice.slice(i, i + NOTICE_BATCH_SIZE);

    const metadatas = await Promise.all(
      batch.map(async ({ spec, noticeDB }) => {
        const description =
          noticeDB.children && noticeDB.children.length > 0
            ? await getIndicationsText(noticeDB.children)
            : "";
        return {
          CIS: noticeDB.codeCIS,
          title: spec.denomination ?? '',
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
