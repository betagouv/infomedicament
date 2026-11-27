import { StartDsfrOnHydration } from "@/dsfr-bootstrap";
import InteractionsPage from "@/components/interactions/InteractionsBlock";

export default function Page() {
  return (
    <>
      <StartDsfrOnHydration />
      <InteractionsPage />
    </>
  );
}
