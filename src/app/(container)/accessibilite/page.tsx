import { Metadata } from "next";
import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";

const PAGE_LABEL = "Déclaration d’accessibilité";

export const metadata: Metadata = {
  title: `${PAGE_LABEL} | Info Médicament`,
  description:
    "Déclaration d’accessibilité : état de conformité au RGAA, contact et voies de recours.",
};

export default function Page() {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1>{PAGE_LABEL}</h1>
          <p>Établie le 19 octobre 2026.</p>
          <p>
            L’Agence Nationale de Sécurité du Médicament et des produits de
            santé (ANSM) s’engage à rendre son service accessible, conformément
            à l’article 47 de la loi n° 2005-102 du 11 février 2005.
          </p>
          <p>
            Cette déclaration d’accessibilité s’applique à{" "}
            <strong>Info Médicament</strong> (https://infomedicament.beta.gouv.fr/).
          </p>

          <h2>État de conformité</h2>
          <p>
            <strong>Info Médicament</strong> est <strong>non conforme</strong>{" "}
            avec le{" "}
            <abbr title="Référentiel général d’amélioration de l’accessibilité">
              RGAA
            </abbr>
            . Le site n’a pas encore été audité.
          </p>

          <h2>Amélioration et contact</h2>
          <p>
            Si vous n’arrivez pas à accéder à un contenu ou à un service, vous
            pouvez contacter le responsable d’Info Médicament pour être orienté
            vers une alternative accessible ou obtenir le contenu sous une autre
            forme.
          </p>
          <ul>
            <li>
              E-mail&nbsp;:{" "}
              <a href="mailto:infomedicament-team@beta.gouv.fr">
                infomedicament-team@beta.gouv.fr
              </a>
            </li>
            <li>Adresse&nbsp;: Agence Nationale de Sécurité du Médicament et des produits de santé (ANSM), 143 Bd Anatole France, 93200 Saint-Denis</li>
          </ul>
          <p>Nous essayons de répondre dans les 5 jours ouvrés.</p>

          <h2>Voie de recours</h2>
          <p>
            Cette procédure est à utiliser dans le cas suivant&nbsp;: vous avez
            signalé au responsable du site internet un défaut d’accessibilité
            qui vous empêche d’accéder à un contenu ou à un des services du
            portail et vous n’avez pas obtenu de réponse satisfaisante.
          </p>
          <p>Vous pouvez&nbsp;:</p>
          <ul>
            <li>
              Écrire un message au{" "}
              <a href="https://formulaire.defenseurdesdroits.fr/">
                Défenseur des droits
              </a>
            </li>
            <li>
              Contacter{" "}
              <a href="https://www.defenseurdesdroits.fr/saisir/delegues">
                le délégué du Défenseur des droits dans votre région
              </a>
            </li>
            <li>
              Envoyer un courrier par la poste (gratuit, ne pas mettre de
              timbre)&nbsp;:
              <br />
              Défenseur des droits
              <br />
              Libre réponse 71120 75342 Paris CEDEX 07
            </li>
          </ul>

          <hr />
          <p className={fr.cx("fr-text--sm")}>
            Cette déclaration d’accessibilité a été créée le 19 octobre 2026
            grâce au{" "}
            <a href="https://betagouv.github.io/a11y-generateur-declaration/#create">
              Générateur de Déclaration d’Accessibilité
            </a>
            .
          </p>
        </div>
      </div>
    </ContentContainer>
  );
}
