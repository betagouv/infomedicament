import ClientHeader from "@/components/ClientHeader";
import { getAtcMenuItems } from "@/db/utils/atc";

export const dynamic = "error";
export const dynamicParams = true;

export default async function InfoMedicamentHeader() {
  const atcs = await getAtcMenuItems();

  return <ClientHeader atcs={atcs} hasSearch={false} />;
}
