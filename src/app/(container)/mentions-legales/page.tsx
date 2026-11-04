import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { Metadata } from "next";

const PAGE_LABEL: string = "Mentions légales";

export const metadata: Metadata = {
  title: PAGE_LABEL,
};

export default async function Page() {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1>{PAGE_LABEL} de Info Médicament</h1>
          <h2>Éditeur de la Plateforme</h2>
          <p>
            La Plateforme Info Médicament est éditée par la Direction
            Interministérielle du Numérique (DINUM) :
            <br />
            20 avenue de Ségur, 75007 Paris
            <br />
            01 71 21 11 33
          </p>
          <p>
            En collaboration avec l&apos;Agence Nationale de Sécurité du
            Médicament et des produits de santé (ANSM) :<br />
            143 Bd Anatole France, 93200 Saint-Denis
            <br />
            01 55 87 30 00
          </p>
          <p>
            Pour tout contact, vous pouvez écrire à{" "}
            <a href="mailto:infomedicament-team@beta.gouv.fr">
              infomedicament-team@beta.gouv.fr
            </a>
            .
          </p>
          <h2>Directeur de publication</h2>
          <p>Nicolas Delemer - Directeur des Systèmes d&apos;Information, ANSM</p>
          <h2>Code source</h2>
          <p>
            Le code source du site est{" "}
            <a href="https://github.com/betagouv/infomedicament">
              disponible sur Github
            </a>
            .
          </p>
          <h2>Hébergement de la Plateforme</h2>
          <p>
            Ce site est hébergé en propre par Scalingo SAS, 15 avenue du Rhin,
            67100 Strasbourg, France.
          </p>
          <h2>Sécurité</h2>
          <p>
            Le site est protégé par un certificat électronique, matérialisé pour
            la grande majorité des navigateurs par un cadenas. Cette protection
            participe à la confidentialité des échanges. En aucun cas les services
            associés à la plateforme ne seront à l’origine d’envoi de courriels
            pour demander la saisie d’informations personnelles.
          </p>
        </div>
      </div>
    </ContentContainer>
  );
}
