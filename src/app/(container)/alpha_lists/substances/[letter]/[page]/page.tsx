import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import { fr } from "@codegouvfr/react-dsfr";
import AlphabeticNav from "@/components/AlphabeticNav";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import ContentContainer from "@/components/generic/ContentContainer";
import { getSubstanceSpecialites } from "@/db/utils/search";
import { groupSpecialites } from "@/db/utils";
import { AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";

export const dynamic = "error";
export const dynamicParams = true;

async function getSubstances(letter: string): Promise<SubstanceNom[]> {
  return await pdbmMySQL
    .selectFrom("Subs_Nom")
    .selectAll("Subs_Nom")
    .where("NomLib", "like", `${letter.toLowerCase()}%`)
    // filter the 500 list
    .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
    .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
    .groupBy(["Subs_Nom.NomLib", "Subs_Nom.NomId", "Subs_Nom.SubsId"])
    .where("Specialite.SpecId", "in", liste_CIS_MVP)
    .orderBy("Subs_Nom.NomLib")
    .execute();
}

async function getLetters() {
  return (
    (
      await pdbmMySQL
        .selectFrom("Subs_Nom")
        .select(({ fn, val }) =>
          fn<string>("substr", ["Subs_Nom.NomLib", val(1), val(1)]).as(
            "letter",
          ),
        )

        // Filter the 500 list
        .leftJoin("Composant", "Subs_Nom.NomId", "Composant.NomId")
        .leftJoin("Specialite", "Composant.SpecId", "Specialite.SpecId")
        .where("Specialite.SpecId", "in", liste_CIS_MVP)
        .orderBy("letter")
        .groupBy("letter")
        .execute()
    ).map((r) => r.letter)
  );
}

export default async function Page(props: {
  params: Promise<{ letter: string; page: `${number}` }>;
}) {
  const { letter, page } = await props.params;

  if (!Number.isInteger(Number(page))) return notFound();
  const pageNumber = Number(page);
  const letters = await getLetters();
  const substances = await getSubstances(letter);
  const PAGE_LENGTH = 40;

  if (!substances || !substances.length) return notFound();
  
  let detailedSubstances: AdvancedSubstanceNom[] = await Promise.all(
    substances.map(async (substance) => {
      const specialites = await getSubstanceSpecialites(substance.NomId);
      const specialitiesGroups = groupSpecialites(specialites);
      return {
        nbSpecs: specialitiesGroups.length,
        ...substance
      };
    })
  );
  detailedSubstances = detailedSubstances.filter((substance) => substance.nbSpecs > 0);

  const pageCount =
    Math.trunc(detailedSubstances.length / PAGE_LENGTH) +
    (detailedSubstances.length % PAGE_LENGTH ? 1 : 0);

  if (pageNumber < 1 || pageNumber > pageCount) return notFound();

  return (
    <ContentContainer frContainer>
      {" "}
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Liste des substances"
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>Liste des substances</h1>
          <AlphabeticNav
            letters={letters}
            url={(letter) => `/substances/${letter}/1`}
          />
          <DataList 
            dataList={detailedSubstances.slice(
                (pageNumber - 1) * PAGE_LENGTH,
                pageNumber * PAGE_LENGTH,
              )}
            type={DataTypeEnum.SUBSTANCE}
          />
        </div>
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            defaultPage={pageNumber}
            getPageLinkProps={(number: number) => ({
              href: `/substances/${letter}/${number}`,
            })}
          />
        )}
      </div>
    </ContentContainer>
  );
}
