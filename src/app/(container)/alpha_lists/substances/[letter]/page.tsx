import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import AlphabeticNav from "@/components/AlphabeticNav";

import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import ContentContainer from "@/components/generic/ContentContainer";
import { getSubstanceSpecialites } from "@/db/utils/search";
import { groupSpecialites } from "@/db/utils";
import { AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";

export const dynamic = "error";
export const dynamicParams = true;

async function getSubstances(letter: string): Promise<SubstanceNom[]> {
  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .selectAll("Subs_Nom")
    .where("NomLib", "like", `${letter.toLowerCase()}%`)
    // filter the 500 list
    .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .groupBy(["Subs_Nom.NomLib", "Subs_Nom.NomId", "Subs_Nom.SubsId"])
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .orderBy("Subs_Nom.NomLib")
    .execute();
}

async function getLetters() {
  return (
    (
      await pdbmMySQL
        .selectFrom("Subs_Nom")
        .select(({ fn, val }) =>
          fn<string>("substr", ["Subs_Nom.NomLib", val(1), val(1)]).as(
            "letter",
          ),
        )

        // Filter the 500 list
        .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
        .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
        .where("Specialite.SpecId", "in", liste_CIS_MVP)
        .orderBy("letter")
        .groupBy("letter")
        .execute()
    ).map((r) => r.letter)
  );
}

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const letters = await getLetters();
  const substances = await getSubstances(letter);

  if (!substances || !substances.length) return notFound();
  
  const detailedSubstances: AdvancedSubstanceNom[] = await Promise.all(
    substances.map(async (substance) => {
      const specialites = await getSubstanceSpecialites(substance.NomId);
      const specialitiesGroups = groupSpecialites(specialites);
      return {
        nbSpecs: specialitiesGroups.length,
        ...substance
      };
    })
  );

  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Liste des substances"
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>Liste des substances</h1>
          <AlphabeticNav
            letters={letters}
            url={(letter) => `/substances/${letter}`}
          />
          <DataList 
            dataList={detailedSubstances}
            type={DataTypeEnum.SUBSTANCE}
          />
        </div>
      </div>
    </ContentContainer>
  );
}
