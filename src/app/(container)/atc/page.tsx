import { Metadata } from "next";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import BreadcrumbJsonLd from "@/components/generic/BreadcrumbJsonLd";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getAtc, getAtc1DefinitionData } from "@/db/utils/atc";
import { AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";

const PAGE_LABEL: string = "Liste des classes de médicaments";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_LABEL,
    description:
      "Retrouvez toutes les classes de médicaments classées par ordre alphabétique.",
  };
}

// List of the ATC classes of level 1, without letters (few classes), in blocks as the other lists
export default async function Page() {
  "use cache: remote";

  const atcList = (await getAtc()).sort((a, b) => a.label.localeCompare(b.label, "fr"));
  // Number of subclasses of each class, as on the class page: the subclasses with substances
  const dataList: AdvancedATCClass[] = await Promise.all(
    atcList.map(async (atc1) => {
      const subclasses = (await getAtc1DefinitionData(atc1)).filter(({ substances }) => substances.length > 0);
      // nbSubstances not displayed when nbSubclasses is defined
      return { class: { ...atc1, nbSubstances: 0, nbSubclasses: subclasses.length }, subclasses: [] };
    }),
  );

  return (
    <ContentContainer frContainer>
      {/* Structured data of the breadcrumb: from the URL of the page */}
      <BreadcrumbJsonLd path="/atc" name={PAGE_LABEL} />
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      {/* All the classes on one page: no letters, no pagination */}
      <PageListContent
        title={PAGE_LABEL}
        urlPrefix="/atc/"
        dataList={dataList}
        type={DataTypeEnum.ATCCLASS}
        withoutPagination
      />
      <RatingToaster pageId={PAGE_LABEL} />
    </ContentContainer>
  );
}
