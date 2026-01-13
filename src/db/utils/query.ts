import { Expression, expressionBuilder, SqlBool } from "kysely";
import { PdbmMySQL } from "../pdbmMySQL/types";

export function withSubstances(
  specId: Expression<string>,
  nomIds: string[],
): Expression<SqlBool> {
  const eb = expressionBuilder<PdbmMySQL, never>();

  return eb.exists(
    eb
      .selectFrom("Composant")
      .select("Composant.SpecId")
      .where("Composant.NomId", "in", nomIds)
      .where("Composant.SpecId", "=", specId)
      .where(({ eb, selectFrom }) =>
        eb(
          "Composant.SpecId",
          "not in",
          selectFrom("Composant as subquery")
            .select("SpecId")
            .where("subquery.NomId", "not in", nomIds)
            .whereRef(
              "subquery.CompNum",
              "not in",
              selectFrom("Composant as subquery2")
                .select("CompNum")
                .where("subquery2.SpecId", "=", specId)
                .where("subquery2.NomId", "in", nomIds),
            ),
        ),
      )
      .groupBy("Composant.SpecId")
      .having((eb) =>
        eb(
          eb.fn.count("Composant.CompNum").distinct(),
          "=",
          eb.val(nomIds.length),
        ),
      ),
  );
}

export function withOneSubstance(
  specId: Expression<string>,
  nomId: Expression<string>,
): Expression<SqlBool> {
  const eb = expressionBuilder<PdbmMySQL, never>();

  return eb.exists(
    eb
      .selectFrom("Composant as Comp1")
      .select("Comp1.SpecId")
      .where("Comp1.NomId", "=", nomId)
      .where("Comp1.SpecId", "=", specId)
      .where(({ eb, selectFrom }) =>
        eb(
          "Comp1.SpecId",
          "not in",
          selectFrom("Composant as Comp2")
            .select("SpecId")
            .where("Comp2.NomId", "<>", nomId)
            .whereRef(
              "Comp2.CompNum",
              "not in",
              selectFrom("Composant as Comp3")
                .select("CompNum")
                .where("Comp3.SpecId", "=", specId)
                .where("Comp3.NomId", "=", nomId),
            ),
        ),
      )
      .groupBy("Comp1.SpecId")
      .having((eb) =>
        eb(
          eb.fn.count("Comp1.CompNum").distinct(),
          "=",
          1,
        ),
      ),
  );
}
