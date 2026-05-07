import ClientHeader from "@/components/ClientHeader";
import { getAtcMenuItems } from "@/db/utils/atc";

export default async function InfoMedicamentHeader(props: {
  searchParams?: Promise<Record<string, string>>;
}) {
  const searchParams = await props.searchParams;
  const atcs = await getAtcMenuItems();
  const search = searchParams && "s" in searchParams && searchParams["s"];

  return <ClientHeader atcs={atcs} hasSearch={false} />;
}
