import { fr } from "@codegouvfr/react-dsfr";
import { Patho } from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import AlphabeticNav from "@/components/AlphabeticNav";
import ContentContainer from "@/components/generic/ContentContainer";
import { getPathoSpecialites } from "@/db/utils/search";
import { AdvancedPatho, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";

export const dynamic = "error";
export const dynamicParams = true;

async function getPathologyPage(letter: string): Promise<Patho[]> {
  return pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .where("NomPatho", "like", `${letter}%`)
    .orderBy("NomPatho")
    .execute();
}

async function getLetters(): Promise<string[]> {
  return (
    await pdbmMySQL
      .selectFrom("Patho")
      .select(({ fn, val }) =>
        fn<string>("substr", ["NomPatho", val(1), val(1)]).as("letter"),
      )
      .orderBy("letter")
      .groupBy("letter")
      .execute()
  ).map((r) => r.letter);
}

export default async function Page(props: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await props.params;

  const letters = await getLetters();
  const pathos = await getPathologyPage(letter);

  if (!pathos || !pathos.length) return notFound();

  const detailedPathos: AdvancedPatho[] = await Promise.all(
    pathos.map(async (patho) => {
      const specialites = await getPathoSpecialites(patho.codePatho);
      return {
        nbSpecs: specialites.length,
        ...patho
      };
    })
  );

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Liste des pathologies"
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>Liste des pathologies</h1>
          <AlphabeticNav
            letters={letters}
            url={(letter) => `/pathologies/${letter}`}
          />
          <DataList 
            dataList={detailedPathos}
            type={DataTypeEnum.PATHOLOGY}
          />
        </div>
      </div>
    </ContentContainer>
  );
}
