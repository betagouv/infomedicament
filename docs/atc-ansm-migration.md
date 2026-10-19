# ATC migration to ANSM

The application and data pipeline now use `ansm_atc` and `ansm_specialite_atc`. Public ATC strings such as `G03AA07` come from `ansm_atc.libelle_abr`; `ansm_atc.code` is a numeric key used only for joins.

## Changed consumers

- ATC navigation, descendants and medicine-to-class memberships: `src/db/utils/atc.ts`.
- Medicine primary ATC: `src/utils/atc.ts`.
- Search-index technical labels: `src/db/seeds/1725439927263_searchIndex.ts`.
- Review-app seeding and database types no longer include the legacy tables.
- In the adjacent `infomedicament-dataeng` repository, `resume/common.py::load_atc_by_cis` and `db.py::iter_pediatric_rcps` use the ANSM join. The old manual `sql/import_atc.sql` loader is removed.

Membership lists retain all mappings. Where one primary ATC is required (medicine page, medicine/specialty summaries and pediatric reader), select the first nonempty `libelle_abr` in alphabetical order, with numeric key as a tie-breaker. This makes the choice consistent across consumers and independent of import row order. Grist-friendly names and definitions remain in `ref_atc_friendly_niveau_1` and `ref_atc_friendly_niveau_2`.

## Deployment order

1. Back up `atc` and `cis_atc` before the cleanup migration. Ensure both ANSM tables are populated. The existing temporary disablement of the daily ATC import in dataeng is intentionally preserved; re-enable it through the existing maintenance plan.
2. Deploy the changed **dataeng repository first** and allow any old pipeline/pediatric processes to finish. Rebuild ATC-bearing summaries with `infomedicament-dataeng build-resume --target medicaments` and `infomedicament-dataeng build-resume --target specialites`.
3. Deploy the app with migration `20261019000001_drop_legacy_atc`. The app's prebuild automatically runs migrations, so this deployment must follow dataeng. The migration drops only `cis_atc` and `atc`, without `CASCADE`. The earlier cleanup migration separately drops the three approved presentation/clinical tables.
4. Run `npm run db:seed-search-index` in the app's configured environment after rebuilding summaries. Restart app instances so cached ATC values are refreshed.

The migration has been tested but not applied to existing local or deployed databases. `down` restores the preceding table schemas/indexes only; restoring historical data requires the backup. Reverting to old readers requires restoring that data too.

## Validation

- 48 focused app unit tests passed.
- All three ATC integration tests passed against local PostgreSQL.
- All 43 visible specialties whose mapping sets differ between the sources resolve to the expected ANSM primary public code in a scratch-schema check with both legacy tables absent.
- Search seeding produced public ATC tokens and technical labels with both legacy tables absent; migration up/down succeeded. The entire scratch-schema verification transaction was rolled back.
- 50 dataeng summary/document/pediatric tests passed, including actual SQL fixtures covering numeric keys, empty mappings, multiple mappings and the contraceptive rule.
- App lint and type-check excluding the existing report snapshots passed. The full type-check remains blocked by pre-existing report snapshots importing missing `./test-data` files.
- Of 12 broader search integration tests, 11 passed. The existing one-character `a` expectation fails because `a` is filtered as a connector in `searchTerms.ts`; neither that search behavior nor the test was changed here.

The pre-existing dataeng `data_sources/ansm.yml` edit was preserved; its trailing-whitespace warning remains outside this change.
