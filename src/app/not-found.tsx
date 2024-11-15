import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className={fr.cx("fr-container", "fr-pt-4w", "fr-pb-8w")}>
      <div className={fr.cx("fr-grid-row", "fr-grid-row--center", "fr-mb-3w")}>
        <div className={fr.cx("fr-col-md-6", "fr-col-md")}>
          <h1 className={fr.cx("fr-h1")}>Page non trouvée</h1>
          <p
            className={fr.cx("fr-text--sm")}
            style={{ color: fr.colors.decisions.text.mention.grey.default }}
          >
            Erreur 404
          </p>
          <p className={fr.cx("fr-text--xl")}>
            La page que vous cherchez est introuvable. Excusez-nous pour la gêne
            occasionnée.
          </p>
          <p>
            Si vous avez tapé l&apos;adresse web dans le navigateur, vérifiez
            qu&apos;elle est correcte. La page n&apos;est peut-être plus
            disponible.
            <br />
            Dans ce cas, pour continuer votre visite vous pouvez consulter notre
            page d&apos;accueil, ou effectuer une recherche avec notre moteur de
            recherche en haut de la page.
          </p>
          <Link
            className={fr.cx(
              "fr-link",
              "fr-link--lg",
              "fr-link--icon-right",
              "fr-icon-arrow-right-line",
            )}
            href="/"
          >
            Page d&apos;accueil
          </Link>
        </div>
      </div>
      <div className="hotjar-feedback" />
    </main>
  );
}
