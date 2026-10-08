import { Suspense } from "react";
import ClientHeader from "@/components/ClientHeader";
import { getAtcMenuItems } from "@/db/utils/atc";
import { cacheLife } from "next/cache";

export default async function InfoMedicamentHeader() {
  "use cache: remote";
  cacheLife("daily");

  const atcs = await getAtcMenuItems();

  return (
    <Suspense fallback={null}>
      <ClientHeader atcs={atcs} />
    </Suspense>
  );
}
