import { Suspense } from "react";
import ClientHeader from "@/components/ClientHeader";
import { getAtcMenuItems } from "@/db/utils/atc";

export default async function InfoMedicamentHeader() {
  "use cache: remote";

  const atcs = await getAtcMenuItems();

  return (
    <Suspense fallback={null}>
      <ClientHeader atcs={atcs} />
    </Suspense>
  );
}
