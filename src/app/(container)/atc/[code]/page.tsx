import { fr } from "@codegouvfr/react-dsfr";
import { getAtc1, getAtc2 } from "@/data/grist/atc";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { notFound } from "next/navigation";
import React from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ATC1DefinitionContent from "@/components/definition/ATC1DefinitionContent";
import ATC2DefinitionContent from "@/components/definition/ATC2DefinitionContent";

export const dynamic = "error";
export const dynamicParams = true;

export default async function Page(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;

  const atc1 = code ? await getAtc1(code) : undefined;
  const atc2 = (code && code.length === 3) ? (await getAtc2(code)) : undefined;
  const currentAtc = atc2 || atc1 || undefined;

  if (!currentAtc || !atc1) notFound();

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <Breadcrumb
            segments={[
              {
                label: "Accueil",
                linkProps: { href: "/" },
              },
              ...(atc2
                ? [
                    {
                      label: atc1.label,
                      linkProps: { href: `/atc/${atc1.code}` },
                    },
                  ]
                : []),
            ]}
            currentPageLabel={currentAtc.label}
          />
        </div>
      </div>
      {atc2 ? (
        <ATC2DefinitionContent
          atc={atc2}
        />
      ) : (
        <ATC1DefinitionContent
          atc={atc1}
        />
      )}
      <RatingToaster
        pageId={currentAtc.label}
      />
    </ContentContainer>
  );
}
