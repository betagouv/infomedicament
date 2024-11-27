import ClientHeader from "@/components/ClientHeader";
import { getAtc } from "@/data/grist/atc";

export default async function InfoMedicamentHeader() {
  const atcs = await getAtc();

  return <ClientHeader atcs={atcs} />;
}
