import { pdbmMySQL } from "@/db/pdbmMySQL";
import DefinitionBanner from "@/components/DefinitionBanner";
import { notFound } from "next/navigation";
import { Patho, Specialite } from "@/db/pdbmMySQL/types";
import { groupSpecialites } from "@/displayUtils";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import { fr } from "@codegouvfr/react-dsfr";
import { MedGroupSpecListList } from "@/components/MedGroupSpecList";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";

export async function generateStaticParams(): Promise<{ code: string }[]> {
  return pdbmMySQL.selectFrom("Patho").select("codePatho as code").execute();
}

async function getPatho(code: string): Promise<Patho> {
  const patho = await pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .where("codePatho", "=", code)
    .executeTakeFirst();

  if (!patho) notFound();

  return patho;
}

async function getSpecialite(code: string): Promise<Specialite[]> {
  return pdbmMySQL
    .selectFrom("Specialite")
    .selectAll("Specialite")
    .leftJoin("Spec_Patho", "Specialite.SpecId", "Spec_Patho.SpecId")
    .where("Spec_Patho.codePatho", "=", code)
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .execute();
}

export default async function Page({
  params: { code },
}: {
  params: { code: string };
}) {
  const patho = await getPatho(code);
  const specialites = await getSpecialite(code);
  const medicaments = groupSpecialites(specialites);
  return (
    <>
      <Breadcrumb
        segments={[
          { label: "Accueil", linkProps: { href: "/" } },
          {
            label: "Listes des pathologies",
            linkProps: {
              href: `/parcourir/pathologies/${patho.NomPatho.slice(0, 1)}`,
            },
          },
        ]}
        currentPageLabel={patho.NomPatho}
      />
      <DefinitionBanner
        type="Pathologie"
        title={patho.NomPatho}
        definition="Définition de la pathologie"
      />

      <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
        {medicaments.length} médicaments traitant la pathologie « anxiété »
      </h2>
      <MedGroupSpecListList items={medicaments} />
    </>
  );
}
