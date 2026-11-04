import { Suspense } from "react";
import MedicamentPageLoading from "@/components/medicaments/MedicamentPageLoading";
import { Metadata, ResolvingMetadata } from "next";
import { formatSpecName } from "@/displayUtils";
import { getSpecialiteMetadata } from "@/db/utils/specialities";
import MedicamentPage from "../../../../../components/medicaments/MedicamentPage";

export async function generateMetadata(
  props: { params: Promise<{ CIS: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { CIS } = await props.params;

  const metadata = await getSpecialiteMetadata(Number(CIS.trim()));

  if (!metadata) {
    return {
      title: `Médicament ${CIS} - Version détaillée`,
    };
  }

  const name = formatSpecName(metadata.title);
  return {
    title: `${name} - Version détaillée (RCP) - ${(await parent).title?.absolute}`,
    description: `Informations détaillées sur ${name} : résumé des caractéristiques du produit (RCP), documents HAS et données avancées.`,
  };
}

export default function Page(props: { params: Promise<{ CIS: string }> }) {
  return (
    <Suspense fallback={<MedicamentPageLoading isAdvanced />}>
      <ResolvedMedicamentAdvancedPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedMedicamentAdvancedPage({
  params,
}: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await params;
  return <MedicamentPage CIS={CIS} isAdvanced />;
}
