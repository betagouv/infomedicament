import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";
import { fr } from "@codegouvfr/react-dsfr";
import {
  getAtc1,
  getAtc2,
  getAtc1DefinitionData,
  getResumeSubstancesByAtc,
} from "@/db/utils/atc";
import { ATC, ATC1, ATCSubstances } from "@/types/ATCTypes";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import BreadcrumbJsonLd from "@/components/generic/BreadcrumbJsonLd";
import JsonLd from "@/components/generic/JsonLd";
import { getDrugClassStructuredData } from "@/utils/structuredData/drugClass";
import { getSubstanceSlug } from "@/utils/substances";
import { getBaseUrl } from "@/utils/baseUrl";
import { notFound } from "next/navigation";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ATC1DefinitionContent from "@/components/definition/ATC1DefinitionContent";
import ATC2DefinitionContent from "@/components/definition/ATC2DefinitionContent";
import { Metadata } from "next";
import { getArticlesFromATC } from "@/db/utils/articles";
import { AdvancedATCClass } from "@/types/DataTypes";
import { ResumeSubstance } from "@/db/types";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { getAtcCodeFromSlug, getAtcSlug } from "@/utils/atc";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const code = getAtcCodeFromSlug((await props.params).slug);

  const atc1 = await getAtc1(code);
  const atc2 = code.length === 3 ? await getAtc2(code) : undefined;

  if (!atc1 && !atc2) {
    return {
      title: `Classe de médicaments ${code}`,
    };
  }
  let title = "";
  if (atc2) {
    title += atc2.label + (atc1 && " - ");
  }
  if (atc1) {
    title += atc1.label;
  }

  const currentAtc = atc2 || atc1;
  return {
    title: `${title}`,
    description: atc2 ? atc2.description : atc1 ? atc1.description : "",
    alternates: {
      canonical: `/atc/${getAtcSlug(currentAtc.code, currentAtc.label)}`,
    },
  };
}

async function fetchATC1Data(
  atc1: ATC1,
): Promise<{ articles: ArticleCardResume[]; dataList: AdvancedATCClass[] }> {
  const [articles, allATC] = await Promise.all([
    getArticlesFromATC(atc1.code),
    getAtc1DefinitionData(atc1),
  ]);
  const dataList = (allATC as ATCSubstances[])
    .map((atcSubsSpecs) => ({
      class: {
        nbSubstances: atcSubsSpecs.substances.length,
        ...atcSubsSpecs.atc,
        children: atcSubsSpecs.atc.children ?? [],
      },
      subclasses: [],
    }))
    .filter((data) => data.class.nbSubstances > 0);
  return { articles, dataList };
}

async function fetchATC2Data(
  atc2: ATC,
): Promise<{ articles: ArticleCardResume[]; dataList: ResumeSubstance[] }> {
  const [articles, dataList] = await Promise.all([
    getArticlesFromATC(atc2.code),
    getResumeSubstancesByAtc(atc2),
  ]);
  return { articles, dataList };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ResolvedATCPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedATCPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CachedATCPage slug={slug} />;
}

async function CachedATCPage({ slug }: { slug: string }) {
  "use cache: remote";

  const code = getAtcCodeFromSlug(slug);
  const atc1 = await getAtc1(code);
  const atc2 = code.length === 3 ? await getAtc2(code) : undefined;
  const currentAtc = atc2 || atc1 || undefined;

  if (!currentAtc || !atc1) notFound();

  const atc2Data = atc2 ? await fetchATC2Data(atc2) : undefined;
  const atc1Data = atc2 ? undefined : await fetchATC1Data(atc1);
  // Structured data of the class (DrugClass): its substances (level 2) and its articles
  const drugClassStructuredData = getDrugClassStructuredData(
    {
      path: `/atc/${getAtcSlug(currentAtc.code, currentAtc.label)}`,
      name: currentAtc.label,
      code: currentAtc.code,
      description: currentAtc.description,
      drugs: (atc2Data?.dataList ?? [])
        .filter(
          (substance, index, all) =>
            all.findIndex(
              (other) => other.SubsId.trim() === substance.SubsId.trim(),
            ) === index,
        )
        .map((substance) => ({
          name: substance.title ?? substance.NomLib,
          path: `/substances/${getSubstanceSlug([substance])}`,
        })),
      articles: (atc2Data ?? atc1Data)!.articles.map((article) => ({
        name: article.title,
        path: `/articles/${article.slug}`,
      })),
    },
    getBaseUrl(),
  );

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <JsonLd data={drugClassStructuredData} />
          {/* Structured data of the breadcrumb: from the URL of the page */}
          <BreadcrumbJsonLd
            path={`/atc/${getAtcSlug(currentAtc.code, currentAtc.label)}`}
            name={currentAtc.label}
            // Class of level 2: its class of level 1 before
            parents={
              atc2
                ? [
                    {
                      path: `/atc/${getAtcSlug(atc1.code, atc1.label)}`,
                      name: atc1.label,
                    },
                  ]
                : []
            }
          />
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
                      linkProps: {
                        href: `/atc/${getAtcSlug(atc1.code, atc1.label)}`,
                      },
                    },
                  ]
                : []),
            ]}
            currentPageLabel={currentAtc.label}
          />
        </div>
      </div>
      {atc2 ? (
        <ATC2DefinitionContent atc={atc2} {...atc2Data!} />
      ) : (
        <ATC1DefinitionContent atc={atc1} {...atc1Data!} />
      )}
      <RatingToaster pageId={currentAtc.label} />
    </ContentContainer>
  );
}
