import { notFound } from "next/navigation";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getIndications } from "@/db/utils/indications";
import { getResumeSpecsGroupsWithIndication } from "@/db/utils/specialities";
import IndicationDefinitionContent from "@/components/definition/IndicationDefinitionContent";
import { Indication } from "@/db/types";
import { Metadata, ResolvingMetadata } from "next";
import { getArticlesFromPatho } from "@/db/utils/articles";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ code: `${number}` }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {

  const { code } = await props.params;
  const indication: Indication | undefined = await getIndications(Number(code));
  if (!indication){
    return {
      title: `Indication ${code}- ${(await parent).title?.absolute}`,
    };
  }

  return {
    title: `${indication.nom} - ${(await parent).title?.absolute}`,
    description: indication.definition || "",
  };
}

export default async function Page(props: {
  params: Promise<{ code: `${number}` }>;
}) {
  const { code } = await props.params;
  const indication: Indication | undefined = await getIndications(Number(code));
  if (!indication) return notFound();

  const [articles, allSpecsGroups] = await Promise.all([
    indication.codePatho ? getArticlesFromPatho(indication.codePatho) : Promise.resolve([]),
    getResumeSpecsGroupsWithIndication(indication.id),
  ]);

  const dataList = allSpecsGroups.length > 0
    ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
    : [];

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <Breadcrumb
            segments={[
              { label: "Accueil", linkProps: { href: "/" } },
              {
                label: "Listes des indications",
                linkProps: {
                  href: `/indications/${indication.nom.slice(0, 1)}`,
                },
              },
            ]}
            currentPageLabel={indication.nom}
          />
        </div>
      </div>
      <IndicationDefinitionContent
        indication={indication}
        articles={articles}
        dataList={dataList}
      />
      <RatingToaster
        pageId={indication.nom}
      />
    </ContentContainer>
  );
}
