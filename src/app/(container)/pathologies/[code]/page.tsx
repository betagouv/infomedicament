import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import { Patho } from "@/db/pdbmMySQL/types";
import { groupSpecialites } from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { getPathologyDefinition } from "@/data/pathologies";
import ContentContainer from "@/components/generic/ContentContainer";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";
import { DataTypeEnum } from "@/types/DataTypes";
import { getPathoSpecialites } from "@/db/utils/pathologies";
import { getArticlesFromPatho } from "@/data/grist/articles";
import PageDefinitionContent from "@/components/generic/PageDefinitionContent";
import RatingToaster from "@/components/rating/RatingToaster";

export const dynamic = "error";
export const dynamicParams = true;

async function getPatho(code: string): Promise<Patho> {
  const patho = await pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .where("codePatho", "=", code)
    .executeTakeFirst();

  if (!patho) return notFound();

  return patho;
}

export default async function Page(props: {
  params: Promise<{ code: `${number}` }>;
}) {
  const { code } = await props.params;

  const patho = await getPatho(code);
  const definition = await getPathologyDefinition(code);
  const specialites = await getPathoSpecialites(code);
  const medicaments = specialites && (groupSpecialites(specialites, true));
  const detailedMedicaments = medicaments && (await getAdvancedMedicamentFromGroup(medicaments));

  const articles = await getArticlesFromPatho(code);
  
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
      <PageDefinitionContent 
        definitionType="Pathologie"
        definitionTitle={patho.NomPatho}
        definition={definition}
        title={`${medicaments.length} ${medicaments.length > 1 ? "médicaments" : "médicament"} traitant la pathologie « 
            ${patho.NomPatho} »`}
        dataList={detailedMedicaments}
        dataType={DataTypeEnum.MEDGROUP}
        articles={articles}
      />
      <RatingToaster
        pageId={patho.NomPatho}
      />
    </ContentContainer>
  );
}
