import type { Kysely } from "kysely";
import fs from "node:fs/promises";
import { Dir } from "node:fs";
import path from "node:path";
import db from "@/db";

async function loadDir(dir: Dir, subDirName?: string) {
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      const dbPath = subDirName
        ? path.join(subDirName, dirent.name)
        : dirent.name;
      const image = await fs.readFile(path.join(dir.path, dirent.name));
      await db
        .insertInto("leaflet_images")
        .values({ path: dbPath, image })
        .execute();
    } else if (dirent.isDirectory()) {
      const subDir = await fs.opendir(path.join(dir.path, dirent.name));
      await loadDir(subDir, dirent.name);
    }
  }
}

export async function seed(db: Kysely<any>): Promise<void> {
  if (!process.env.LEAFLET_IMAGES) {
    console.error("To load images into database, set LEAFLET_IMAGES env var");
    return;
  }

  let dir;
  try {
    dir = await fs.opendir(process.env.LEAFLET_IMAGES);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(
        "To load images into database, you must place images folder " +
          "exported from PDBM in $LEAFLET_IMAGES directory",
      );
    }

    throw error;
  }

  await loadDir(dir);
}
