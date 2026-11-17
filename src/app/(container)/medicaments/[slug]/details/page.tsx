import { Suspense } from "react";
import MedicamentPageLoading from "@/components/medicaments/MedicamentPageLoading";
import { Metadata } from "next";
import { formatSpecName } from "@/displayUtils";
import { getSpecialiteMetadata } from "@/db/utils/specialities";
import MedicamentPage from "@/components/medicaments/MedicamentPage";
import { getIdFromSlug, getNumericIdFromSlug } from "@/utils/slug";
import { getSpecSlug } from "@/utils/specialites";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await props.params;
  const CIS = getNumericIdFromSlug(slug);

  const metadata = CIS ? await getSpecialiteMetadata(CIS) : undefined;

  if (!metadata) {
    return {
      title: `Médicament ${getIdFromSlug(slug)} - Version détaillée`,
    };
  }

  const name = formatSpecName(metadata.title);
  return {
    title: `${name} - Version détaillée`,
    description: `Informations détaillées sur ${name} : résumé des caractéristiques du produit (RCP), documents HAS et données avancées.`,
    alternates: {
      canonical: `/medicaments/${getSpecSlug(metadata.CIS.toString(), metadata.title)}/details`,
    },
  };
}

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<MedicamentPageLoading isAdvanced />}>
      <ResolvedMedicamentAdvancedPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedMedicamentAdvancedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MedicamentPage CIS={getIdFromSlug(slug)} isAdvanced />;
}
