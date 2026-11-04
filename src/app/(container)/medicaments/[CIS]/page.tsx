import { Suspense } from "react";
import MedicamentPageLoading from "@/components/medicaments/MedicamentPageLoading";
import { Metadata, ResolvingMetadata } from "next";
import { formatSpecName } from "@/displayUtils";
import { withStaticParamFallback } from "@/utils/staticParams";
import { getWarmupCISCodes } from "@/db/utils/warmup";
import { getSpecialiteMetadata } from "@/db/utils/specialities";
import MedicamentPage from "../../../../components/medicaments/MedicamentPage";

// Prerender the top ~500 medicaments at build time so they are served as static
// HTML before the first request. Other CIS are still rendered on-demand
// Cache Components also validates one fallback path on unseeded review-app builds.
export async function generateStaticParams() {
  const cisCodes = await getWarmupCISCodes();
  return withStaticParamFallback(
    cisCodes.map((CIS) => ({ CIS })),
    { CIS: "60234100" },
  );
}

export async function generateMetadata(
  props: { params: Promise<{ CIS: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { CIS } = await props.params;

  const metadata = await getSpecialiteMetadata(Number(CIS.trim()));

  if (!metadata) {
    return {
      title: `Médicament ${CIS}`,
    };
  }

  const name = formatSpecName(metadata.title);
  return {
    title: `${name} - ${(await parent).title?.absolute}`,
    description: metadata.description,
  };
}

export default function Page(props: { params: Promise<{ CIS: string }> }) {
  return (
    <Suspense fallback={<MedicamentPageLoading />}>
      <ResolvedMedicamentPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedMedicamentPage({
  params,
}: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await params;
  return <MedicamentPage CIS={CIS} isAdvanced={false} />;
}
