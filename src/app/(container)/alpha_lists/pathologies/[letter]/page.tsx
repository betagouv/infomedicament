import { Patho } from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import { AdvancedPatho, DataTypeEnum } from "@/types/DataTypes";
import { getPathoSpecialites } from "@/db/utils/pathologies";
import { groupSpecialites } from "@/db/utils";
import PageListContent from "@/components/generic/PageListContent";

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

  let detailedPathos: AdvancedPatho[] = await Promise.all(
    pathos
      .map(async (patho) => {
        const specialites = await getPathoSpecialites(patho.codePatho);
        const medicaments = specialites && (groupSpecialites(specialites));
        return {
          nbSpecs: medicaments.length,
          ...patho
        };
      })
  );
  detailedPathos = detailedPathos.filter((patho) => patho.nbSpecs > 0);
  
  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Liste des pathologies"
      />
      <PageListContent
        title="Liste des pathologies"
        letters={letters}
        urlPrefix="/pathologies/"
        dataList={detailedPathos}
        type={DataTypeEnum.PATHOLOGY}
      />
    </ContentContainer>
  );
}
