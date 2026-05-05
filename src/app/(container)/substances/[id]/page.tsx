import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getAllSubstanceIds, getSubstances } from "@/db/utils/substances";
import SubstanceDefinitionContent from "@/components/definition/SubstanceDefinitionContent";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await getAllSubstanceIds();
  return ids.map((id) => ({ id }));
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const ids = decodeURIComponent(id).split(",");

  const substances: SubstanceNom[] = await getSubstances(ids)?? [];
  if (!substances || substances.length < ids.length) return notFound();
  if (substances.some((s) => !s.NomLib)) return notFound();

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <Breadcrumb
            segments={[
              { label: "Accueil", linkProps: { href: "/" } },
              {
                label: "Listes des substances",
                linkProps: {
                  href: `/substances/${substances[0].NomLib.slice(0, 1)}`,
                },
              },
            ]}
            currentPageLabel={substances.map((s) => s.NomLib).join(", ")}
          />
        </div>
      </div>
      <SubstanceDefinitionContent 
        ids={ids}
        substances={substances}
      />
      <RatingToaster
        pageId={substances.map((s) => s.NomLib).join(", ")}
      />
    </ContentContainer>
  );
}
