import { Expression, expressionBuilder, SqlBool } from "kysely";
import { PdbmMySQL } from "../pdbmMySQL/types";

export function withSubstances(
  specId: Expression<string>,
  subsIds: string[],
): Expression<SqlBool> {
  const eb = expressionBuilder<PdbmMySQL, never>();

  return eb.exists(
    eb
      .selectFrom("Composant")
      .select("Composant.SpecId")
      .where("Composant.SubsId", "in", subsIds)
      .where("Composant.SpecId", "=", specId)
      .where(({ eb, selectFrom }) =>
        eb(
          "Composant.SpecId",
          "not in",
          selectFrom("Composant as subquery")
            .select("SpecId")
            .where("subquery.SubsId", "not in", subsIds)
            .whereRef(
              "subquery.CompNum",
              "not in",
              selectFrom("Composant as subquery2")
                .select("CompNum")
                .where("subquery2.SpecId", "=", specId)
                .where("subquery2.SubsId", "in", subsIds),
            ),
        ),
      )
      .groupBy("Composant.SpecId")
      .having((eb) =>
        eb(
          eb.fn.count("Composant.CompNum").distinct(),
          "=",
          eb.val(subsIds.length),
        ),
      ),
  );
}

export function withOneSubstance(
  specId: Expression<string>,
  subsId: Expression<string>,
): Expression<SqlBool> {
  const eb = expressionBuilder<PdbmMySQL, never>();

  return eb.exists(
    eb
      .selectFrom("Composant as Comp1")
      .select("Comp1.SpecId")
      .where("Comp1.SubsId", "=", subsId)
      .where("Comp1.SpecId", "=", specId)
      .where(({ eb, selectFrom }) =>
        eb(
          "Comp1.SpecId",
          "not in",
          selectFrom("Composant as Comp2")
            .select("SpecId")
            .where("Comp2.SubsId", "<>", subsId)
            .whereRef(
              "Comp2.CompNum",
              "not in",
              selectFrom("Composant as Comp3")
                .select("CompNum")
                .where("Comp3.SpecId", "=", specId)
                .where("Comp3.SubsId", "=", subsId),
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
