import { Suspense } from "react";
import InteractionsWithSelection, {
  interactionsMetadata,
  type InteractionsPageProps,
} from "@/components/interactions/InteractionsWithSelection";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";

export const generateMetadata = interactionsMetadata;

export default function Page({ searchParams }: InteractionsPageProps) {
  return (
    <DsfrProvider lang="fr">
      <Suspense fallback={<p role="status">Chargement des interactions…</p>}>
        <InteractionsWithSelection searchParams={searchParams} />
      </Suspense>
    </DsfrProvider>
  );
}
