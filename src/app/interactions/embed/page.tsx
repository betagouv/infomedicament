import InteractionsPage from "@/app/(container)/interactions/InteractionsPage";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";

export default function Page() {
  return (
    <DsfrProvider lang="fr">
      <InteractionsPage />
    </DsfrProvider>
  );
}
