import { notFound } from "next/navigation";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getIndications } from "@/db/utils/indications";
import IndicationDefinitionContent from "@/components/definition/IndicationDefinitionContent";
import { Indication } from "@/db/types";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ code: `${number}` }>;
}) {
  const { code } = await props.params;
  const indication: Indication | undefined = await getIndications(Number(code));
  if (!indication) return notFound();

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
      />
      <RatingToaster
        pageId={indication.nom}
      />
    </ContentContainer>
  );
}
