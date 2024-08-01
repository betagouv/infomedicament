import { defineConfig, getKnexTimestampPrefix } from "kysely-ctl";
import db from "./src/db";

export default defineConfig({
  kysely: db,
  migrations: {
    migrationFolder: "src/db/migrations",
    getMigrationPrefix: getKnexTimestampPrefix,
  },
  seeds: {
    seedFolder: "src/db/seeds",
  },
});
