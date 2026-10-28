import InteractionsPage from "@/components/interactions/InteractionsBlock";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";

export default function Page() {
  return (
    <DsfrProvider lang="fr">
      <InteractionsPage />
    </DsfrProvider>
  );
}
