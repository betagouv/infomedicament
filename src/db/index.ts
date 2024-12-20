import "server-cli-only";

import { Kysely, NoResultError, PostgresDialect, Selectable } from "kysely";
import { Pool } from "pg";

interface Database {
  search_index: SearchIndexTable;
  leaflet_images: LeafletImagesTable;
  presentations: PresentationTable;
}

interface SearchIndexTable {
  token: string;
  table_name: "Specialite" | "Subs_Nom" | "Patho" | "ATC";
  id: string;
}

interface LeafletImagesTable {
  path: string;
  image: Buffer;
}

interface PresentationTable {
  codecip13: string;
  nomelement: string;
  nbrrecipient: number;
  recipient: string;
  caraccomplrecip: string;
  qtecontenance: number;
  unitecontenance: string;
}

export const getLeafletImage = async ({ src }: { src: string }) => {
  src = src.replace("../images/", "");

  const extension = src.split(".").pop();
  try {
    const { image } = await db
      .selectFrom("leaflet_images")
      .where("path", "=", src)
      .select("image")
      .executeTakeFirstOrThrow();
    return `data:image/${extension};base64,${image.toString("base64")}`;
  } catch (e) {
    if (e instanceof NoResultError) {
      console.warn("Image not found in database:", src);
      return;
    }

    throw e;
  }
};

export type LeafletImage = Selectable<LeafletImagesTable>;
export type SearchResult = Selectable<SearchIndexTable>;
export type PresentationDetail = Selectable<PresentationTable>;

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      ...(process.env.APP_DB_URL
        ? {
            connectionString: process.env.APP_DB_URL,
          }
        : {
            // .devcontainer config
            database: "postgres",
            host: "db-postgres",
            user: "postgres",
            password: "postgres",
            port: 5432,
          }),
      max: 3,
      connectionTimeoutMillis: 5000,
    }),
  }),
});

export default db;
