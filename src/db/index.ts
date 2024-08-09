import "server-cli-only";

import { Kysely, NoResultError, PostgresDialect, Selectable } from "kysely";
import { Pool } from "pg";

interface Database {
  leaflet_images: LeafletImagesTable;
}

interface LeafletImagesTable {
  path: string;
  image: Buffer;
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

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      ...(process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
          }
        : {
            // .devcontainer config
            database: "postgres",
            host: "db-postgres",
            user: "postgres",
            password: "postgres",
            port: 5432,
          }),
      max: 5,
      connectionTimeoutMillis: 5000,
    }),
  }),
});

export default db;
