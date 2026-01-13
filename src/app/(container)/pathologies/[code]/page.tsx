import { notFound } from "next/navigation";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getPatho } from "@/db/utils/pathologies";
import PathologyDefinitionContent from "@/components/definition/PathologyDefinitionContent";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ code: `${number}` }>;
}) {
  const { code } = await props.params;
  const patho = await getPatho(code);
  if (!patho) return notFound();

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <Breadcrumb
            segments={[
              { label: "Accueil", linkProps: { href: "/" } },
              {
                label: "Listes des pathologies",
                linkProps: {
                  href: `/pathologies/${patho.NomPatho.slice(0, 1)}`,
                },
              },
            ]}
            currentPageLabel={patho.NomPatho}
          />
        </div>
      </div>
      <PathologyDefinitionContent
        patho={patho}
      />
      <RatingToaster
        pageId={patho.NomPatho}
      />
    </ContentContainer>
  );
}
