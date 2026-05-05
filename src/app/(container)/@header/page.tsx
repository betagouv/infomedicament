import ClientHeader from "@/components/ClientHeader";
import { getAtc } from "@/db/utils/atc";

export const dynamic = "error";
export const dynamicParams = true;

export default async function InfoMedicamentHeader() {
  const atcs = (await getAtc()).map(({ code, label }) => ({ code, label }));

  return <ClientHeader atcs={atcs} hasSearch={false} />;
}
