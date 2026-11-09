import { Suspense } from "react";
import MedicamentPageLoading from "@/components/medicaments/MedicamentPageLoading";
import { Metadata } from "next";
import { formatSpecName } from "@/displayUtils";
import { withStaticParamFallback } from "@/utils/staticParams";
import { getWarmupSpecsSlugs } from "@/db/utils/warmup";
import { getSpecSlug } from "@/utils/specialites";
import { getSpecialiteMetadata } from "@/db/utils/specialities";
import { getIdFromSlug, getNumericIdFromSlug } from "@/utils/slug";
import MedicamentPage from "@/components/medicaments/MedicamentPage";

// Prerender the top ~500 medicaments at build time so they are served as static
// HTML before the first request. Other CIS are still rendered on-demand
// Cache Components also validates one fallback path on unseeded review-app builds.
export async function generateStaticParams() {
  const slugs = await getWarmupSpecsSlugs();
  return withStaticParamFallback(
    slugs.map((slug) => ({ slug })),
    { slug: "" },
  );
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const CIS = getNumericIdFromSlug(slug);

  const metadata = CIS ? await getSpecialiteMetadata(CIS) : undefined;

  if (!metadata) {
    return {
      title: `Médicament ${getIdFromSlug(slug)}`,
    };
  }

  const name = formatSpecName(metadata.title);
  return {
    title: `${name}`,
    description: metadata.description,
    alternates: {
      canonical: `/medicaments/${getSpecSlug(metadata.CIS.toString(), metadata.title)}`,
    },
  };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<MedicamentPageLoading />}>
      <ResolvedMedicamentPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedMedicamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MedicamentPage CIS={getIdFromSlug(slug)} isAdvanced={false} />;
}