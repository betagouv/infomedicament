import { fr } from "@codegouvfr/react-dsfr";
import { Patho } from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { notFound } from "next/navigation";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import Pagination from "@codegouvfr/react-dsfr/Pagination";
import AlphabeticNav from "@/components/AlphabeticNav";
import ContentContainer from "@/components/generic/ContentContainer";
import { AdvancedPatho, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";
import { getPathoSpecialites } from "@/db/utils/pathologies";
import { groupSpecialites } from "@/db/utils";

export const dynamic = "error";
export const dynamicParams = true;

async function getPathologyPage(letter: string): Promise<Patho[]> {
  return pdbmMySQL
    .selectFrom("Patho")
    .selectAll()
    .where("NomPatho", "like", `${letter}%`)
    .orderBy("NomPatho")
    .execute();
}

async function getLetters(): Promise<string[]> {
  return (
    await pdbmMySQL
      .selectFrom("Patho")
      .select(({ fn, val }) =>
        fn<string>("substr", ["NomPatho", val(1), val(1)]).as("letter"),
      )
      .orderBy("letter")
      .groupBy("letter")
      .execute()
  ).map((r) => r.letter);
}

export default async function Page(props: {
  params: Promise<{ letter: string; page: `${number}` }>;
}) {
  const { letter, page } = await props.params;

  if (!Number.isInteger(Number(page))) return notFound();
  const pageNumber = Number(page);
  const letters = await getLetters();
  const pathos = await getPathologyPage(letter);
  const PAGE_LENGTH = 20;

  if (!pathos || !pathos.length) return notFound();

  let detailedPathos: AdvancedPatho[] = await Promise.all(
    pathos
      .map(async (patho) => {
        const specialites = await getPathoSpecialites(patho.codePatho);
        const medicaments = specialites && (groupSpecialites(specialites));
        return {
          nbSpecs: medicaments.length,
          ...patho
        };
      })
  );
  detailedPathos = detailedPathos.filter((patho) => patho.nbSpecs > 0);

  const pageCount =
    Math.trunc(detailedPathos.length / PAGE_LENGTH) +
    (detailedPathos.length % PAGE_LENGTH ? 1 : 0);

  if (pageNumber < 1 || pageNumber > pageCount) return notFound();
  
  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Liste des pathologies"
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1 className={fr.cx("fr-h1", "fr-mb-8w")}>Liste des pathologies</h1>
          <AlphabeticNav
            letters={letters}
            url={(letter) => `/pathologies/${letter}/1`}
          />
          <DataList 
            dataList={detailedPathos.slice(
                (pageNumber - 1) * PAGE_LENGTH,
                pageNumber * PAGE_LENGTH,
              )}
            type={DataTypeEnum.PATHOLOGY}
          />
        </div>
        {pageCount > 1 && (
          <Pagination
            count={pageCount}
            defaultPage={pageNumber}
            getPageLinkProps={(number: number) => ({
              href: `/pathologies/${letter}/${number}`,
            })}
          />
        )}
      </div>
    </ContentContainer>
  );
}
