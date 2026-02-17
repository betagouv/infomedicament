import { pdbmMySQL } from "@/db/pdbmMySQL";

/**
 * ANSM's PDBM export does not have primary keys on all tables
 * which is a problem with MySQL when sql_require_primary_key=1
 * We add a primary key on very table so the database can be
 * re-exported locally before importation in production
 */

async function upgradePdbm() {
  // Those tables do not have pimary key
  // which is a problem when sql_require_primary_key=1
  const missingPkTables = [
    "CNAM_Retro",
    "HAS_ASMR",
    "HAS_DocsBonUsage",
    "HAS_LiensPageCT",
    "HAS_SMR",
    "Patho",
    "Spec_DtePubli",
    "Spec_Patho",
    "VUEmaEpar",
    "VUEvnts",
  ];

  await pdbmMySQL.transaction().execute(async (transaction) => {
    // Loop over tables
    for (let i = 0; i < missingPkTables.length; i++) {
      console.log(`Migrate ${missingPkTables[i]}`);
      await transaction.schema
        .alterTable(missingPkTables[i])
        .addColumn("pk", "integer", (col) => col.autoIncrement().primaryKey())
        .execute();
    }
  });
}

upgradePdbm()
  .catch((e) => console.log(e))
  .finally(() => pdbmMySQL.destroy());
