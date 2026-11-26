import { notFound } from "next/navigation";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import BreadcrumbJsonLd from "@/components/generic/BreadcrumbJsonLd";
import JsonLd from "@/components/generic/JsonLd";
import { getMedicalConditionStructuredData } from "@/utils/structuredData/medicalCondition";
import { getBaseUrl } from "@/utils/baseUrl";
import { formatSpecName } from "@/displayUtils";
import { getSpecSlug } from "@/utils/specialites";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getIndications } from "@/db/utils/indications";
import { getResumeSpecsGroupsWithIndication } from "@/db/utils/specialities";
import IndicationDefinitionContent from "@/components/definition/IndicationDefinitionContent";
import { Indication } from "@/db/types";
import { Metadata } from "next";
import { getArticlesFromPatho } from "@/db/utils/articles";
import { getResumeSpecsGroupsATCLabels } from "@/db/utils/atc";
import { Suspense } from "react";
import PageLoadingFallback from "@/components/generic/PageLoadingFallback";
import { getIdFromSlug, getNumericIdFromSlug } from "@/utils/slug";
import { getIndicationSlug } from "@/utils/indications";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const code = getNumericIdFromSlug(slug);
  const indication: Indication | undefined = code
    ? await getIndications(code)
    : undefined;
  if (!indication) {
    return {
      title: `Indication ${getIdFromSlug(slug)}`,
    };
  }

  return {
    title: `${indication.nom}`,
    // Fallback when the indication has no definition
    description:
      indication.definition ||
      `Retrouvez les médicaments associés à l'indication : ${indication.nom}.`,
    alternates: {
      canonical: `/indications/${getIndicationSlug(indication.id, indication.nom)}`,
    },
  };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <ResolvedIndicationPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedIndicationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CachedIndicationPage slug={slug} />;
}

async function CachedIndicationPage({ slug }: { slug: string }) {
  "use cache: remote";

  const code = getNumericIdFromSlug(slug);
  if (!code) return notFound();
  const indication: Indication | undefined = await getIndications(code);
  if (!indication) return notFound();

  const [articles, allSpecsGroups] = await Promise.all([
    indication.codePatho
      ? getArticlesFromPatho(indication.codePatho)
      : Promise.resolve([]),
    getResumeSpecsGroupsWithIndication(indication.id),
  ]);

  const dataList =
    allSpecsGroups.length > 0
      ? await getResumeSpecsGroupsATCLabels(allSpecsGroups)
      : [];
  // Structured data of the indication (MedicalCondition): its medicaments (first specialité of each group) and articles
  const medicalConditionStructuredData = getMedicalConditionStructuredData({
    path: `/indications/${getIndicationSlug(indication.id, indication.nom)}`,
    name: indication.nom,
    definition: indication.definition,
    treatments: dataList.flatMap((group) => {
      const [specId, specName] = group.specialites[0] ?? [];
      return specId && specName ? [{ name: formatSpecName(specName), path: `/medicaments/${getSpecSlug(specId, specName)}` }] : [];
    }),
    articles: articles.map((article) => ({ name: article.title, path: `/articles/${article.slug}` })),
  }, getBaseUrl());

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12")}>
          <JsonLd data={medicalConditionStructuredData} />
          {/* Structured data of the breadcrumb: from the URL of the page */}
          <BreadcrumbJsonLd path={`/indications/${getIndicationSlug(indication.id, indication.nom)}`} name={indication.nom} />
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
        articles={articles}
        dataList={dataList}
      />
      <RatingToaster pageId={indication.nom} />
    </ContentContainer>
  );
}
