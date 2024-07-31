import { Kysely, PostgresDialect, Selectable } from "kysely";
import { Pool } from "pg";

interface Database {
  leaflet_images: LeafletImagesTable;
}

interface LeafletImagesTable {
  path: string;
  image: Buffer;
}

export const getLeafletImage = async ({ src }: { src: string }) => {
  const extension = src.split(".").pop();
  const { image } = await db
    .selectFrom("leaflet_images")
    .where("path", "=", src)
    .select("image")
    .executeTakeFirstOrThrow();
  return `data:image/${extension};base64,${image.toString("base64")}`;
};

export type LeafletImage = Selectable<LeafletImagesTable>;

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: process.env.DATABASE_URL
      ? new Pool({ connectionString: process.env.DATABASE_URL })
      : new Pool({
          // .devcontainer config
          database: "postgres",
          host: "db-postgres",
          user: "postgres",
          password: "postgres",
          port: 5432,
        }),
  }),
});

export default db;
