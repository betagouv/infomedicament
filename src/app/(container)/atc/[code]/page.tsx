import { fr } from "@codegouvfr/react-dsfr";
import { getAtc1, getAtc2 } from "@/db/utils/atc";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ATC1DefinitionContent from "@/components/definition/ATC1DefinitionContent";
import ATC2DefinitionContent from "@/components/definition/ATC2DefinitionContent";
import { ATCError } from "@/utils/atc";
import { Metadata, ResolvingMetadata } from "next";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ code: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  
  const { code } = await props.params;

  let atc1, atc2;
  atc1 = code ? await getAtc1(code) : undefined;
  atc2 = code && code.length === 3 ? await getAtc2(code) : undefined;

  if (!atc1 && !atc2) notFound();
  let title = "";
  if(atc2) {
    title += atc2.label + (atc1 && ' - ');
  } 
  if(atc1) {
    title += atc1.label;
  }

  return {
    title: `${title} - ${(await parent).title?.absolute}`,
    description: atc2 ? atc2.description : atc1 ? atc1.description : "",
  };
}

export default async function Page(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;

  let atc1, atc2;
  try {
    atc1 = code ? await getAtc1(code) : undefined;
    atc2 = code && code.length === 3 ? await getAtc2(code) : undefined;
  } catch (e) {
    if (e instanceof ATCError) notFound();
    throw e;
  }
  const currentAtc = atc2 || atc1 || undefined;

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
