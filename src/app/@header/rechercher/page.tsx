import ClientHeader from "@/components/ClientHeader";
import { getAtc } from "@/data/grist/atc";

export default async function InfoMedicamentHeader(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const atcs = await getAtc();
  const search = searchParams && "s" in searchParams && searchParams["s"];

  return <ClientHeader atcs={atcs} searchInitial={search || undefined} />;
}
