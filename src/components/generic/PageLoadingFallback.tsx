import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "./ContentContainer";

export default function PageLoadingFallback() {
  return (
    <ContentContainer>
      <p className={fr.cx("fr-my-4w")} role="status" aria-live="polite">
        Chargement de la page…
      </p>
    </ContentContainer>
  );
}
