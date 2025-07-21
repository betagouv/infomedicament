import { Fragment } from "react";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import { groupSpecialites } from "@/db/utils";
import ContentContainer from "@/components/generic/ContentContainer";
import { getAdvancedMedicamentGroupListFromMedicamentGroupList } from "@/db/utils/medicaments";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/generic/PageListContent";

export const dynamic = "error";
export const dynamicParams = true;

const getLetters = unstable_cache(async function () {
  return (
    await pdbmMySQL
      .selectFrom("Specialite")
      .select(({ fn, val }) =>
        fn<string>("substr", ["SpecDenom01", val(1), val(1)]).as("letter"),
      )
      .where("Specialite.SpecId", "in", liste_CIS_MVP)
      .orderBy("letter")
      .groupBy("letter")
      .execute()
  ).map((r) => r.letter);
});

const getSpecialites = unstable_cache(async function (letter: string) {
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .where("SpecDenom01", "like", `${letter}%`)
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .orderBy("SpecDenom01")
    .execute();
});

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const letters = await getLetters();
  const specialites = await getSpecialites(letter);

  if (!specialites || !specialites.length) return notFound();

  const medicaments = groupSpecialites(specialites);
  const detailedMedicaments = await getAdvancedMedicamentGroupListFromMedicamentGroupList(medicaments);

  return (
    <ContentContainer frContainer>
      <Fragment>
        <Breadcrumb
          segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
          currentPageLabel="Liste des médicaments"
        />
        <PageListContent
          title="Liste des médicaments"
          letters={letters}
          urlPrefix="/medicaments/"
          dataList={detailedMedicaments}
          type={DataTypeEnum.MEDGROUP}
        />
      </Fragment>
    </ContentContainer>
  );
}
