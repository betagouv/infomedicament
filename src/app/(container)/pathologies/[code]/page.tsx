import { pdbmMySQL } from "@/db/pdbmMySQL";
import DefinitionBanner from "@/components/DefinitionBanner";
import { notFound } from "next/navigation";
import { Patho, Specialite } from "@/db/pdbmMySQL/types";
import { groupSpecialites } from "@/db/utils";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { getPathologyDefinition } from "@/data/pathologies";
import ContentContainer from "@/components/generic/ContentContainer";
import { getAdvancedMedicamentGroupListFromMedicamentGroupList } from "@/db/utils/medicaments";
import DataList from "@/components/data/DataList";
import { DataTypeEnum } from "@/types/DataTypes";

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

async function getPathoSpecialites(code: `${number}`): Promise<Specialite[]> {
  const specs = await pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .leftJoin("Spec_Patho", "Specialite.SpecId", "Spec_Patho.SpecId")
    .where("Spec_Patho.codePatho", "=", code)
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .execute();
  return specs;
}

export default async function Page(props: {
  params: Promise<{ code: `${number}` }>;
}) {
  const { code } = await props.params;

  const patho = await getPatho(code);
  const definition = await getPathologyDefinition(code);
  const specialites = await getPathoSpecialites(code);
  const medicaments = specialites && (groupSpecialites(specialites));
  const detailedMedicaments = medicaments && (await getAdvancedMedicamentGroupListFromMedicamentGroupList(medicaments));
  
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
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
          <DefinitionBanner
            type="Pathologie"
            title={patho.NomPatho}
            definition={definition}
          />

          <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
            {medicaments.length} {medicaments.length > 1 ? "médicaments" : "médicament"} traitant la pathologie «&nbsp;
            {patho.NomPatho}&nbsp;»
          </h2>

          <DataList
            dataList={detailedMedicaments}
            type={DataTypeEnum.MEDGROUP} 
          />
        </div>
      </div>
    </ContentContainer>
  );
}
