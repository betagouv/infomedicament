import { fr } from "@codegouvfr/react-dsfr";

export default function PageLoadingFallback() {
  return (
    <p className={fr.cx("fr-my-4w")} role="status" aria-live="polite">
      Chargement de la page…
    </p>
  );
}
