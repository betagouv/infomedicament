import ClientHeader from "@/components/ClientHeader";
import { getAtcMenuItems } from "@/db/utils/atc";

// Dedicated slot without `dynamic = "error"` (see [...all]), which would conflict with the
// dynamic rendering of the extraction page
export default async function InfoMedicamentHeader() {
  const atcs = await getAtcMenuItems();

  return <ClientHeader atcs={atcs} />;
}
