import { Suspense } from "react";
import InteractionsWithSelection, {
  interactionsMetadata,
  type InteractionsPageProps,
} from "@/components/interactions/InteractionsWithSelection";
import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";

const PAGE_LABEL: string = "Interactions médicamenteuses";

export const generateMetadata = interactionsMetadata;

export default function Page({ searchParams }: InteractionsPageProps) {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-8", "fr-mt-4w")}>
          <h1 className={fr.cx("fr-h2")}>{PAGE_LABEL}</h1>
          <p>
            Vérifier en 1 clic si vous pouvez prendre un médicament avec un
            autre.{" "}
            <Link
              href="https://ansm.sante.fr/documents/reference/thesaurus-des-interactions-medicamenteuses-1"
              target="_blank"
              rel="noopener noreferrer"
            >
              Source ANSM
            </Link>
          </p>
          <p>
            <i>Dernière date de mise à jour : 07/06/2024</i>
          </p>
          <p>
            Demandez toujours conseil à votre médecin avant de prendre un
            médicament.
          </p>

          <Suspense
            fallback={<p role="status">Chargement des interactions…</p>}
          >
            <InteractionsWithSelection searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </ContentContainer>
  );
}
