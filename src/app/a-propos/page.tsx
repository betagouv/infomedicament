import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import Card from "@codegouvfr/react-dsfr/Card";
import ContentContainer from "@/components/generic/ContentContainer";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ShareButtons from "@/components/generic/ShareButtons";
import Image from "next/image";

export default async function Page() {

  return (
    <>
      <ContentContainer frContainer>
        {" "}
        <Breadcrumb
          segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
          currentPageLabel="À propos"
        />
        <h1 className={fr.cx("fr-h2")}>
          À propos
        </h1>
        <ShareButtons 
          pageName="À propos"
          className={fr.cx("fr-mb-3w")}
        />
        <div
          className={fr.cx(
            "fr-col-md-8",
            "fr-col-sm-9",
            "fr-hidden",
            "fr-unhidden-xl",
            "fr-unhidden-lg",
            "fr-unhidden-md",
            "fr-unhidden-sm",
          )}
        >
          <Image
            src="/apropos_illu.webp"
            alt="Un dessin d'une personne examinant une notice de médicament."
            className={fr.cx("fr-responsive-img", "fr-col-12")}
            width={1236}
            height={687}
          />
        </div>
      </ContentContainer>

      <ContentContainer frContainer>
        <div className={fr.cx("fr-pb-4w")}>
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            <div className={fr.cx("fr-col-12", "fr-mt-4w")}>
              <h2 className={fr.cx("fr-h4")}>Nos missions</h2>
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
              <Card
                title="Rendre claires les notices"
                titleAs="h3"
                desc="Simplifier la compréhension des notices de médicaments"
              />
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
              <Card
                title="Mieux informer"
                titleAs="h3"
                desc="Informer sur les médicaments pour améliorer le suivi des traitements par les patient⋅es"
              />
            </div>
            <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
              <Card
                title="Partager les données"
                titleAs="h3"
                desc="Faciliter l’accès aux données sur les médicaments notamment via une API publique"
              />
            </div>
          </div>
        </div>
      </ContentContainer>

      <ContentContainer>
        <div
          style={{
            backgroundColor:
              fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <div className={fr.cx("fr-container", "fr-pt-2w", "fr-pb-4w")}>
            <div
              className={fr.cx(
                "fr-grid-row",
                "fr-mt-4w",
                "fr-pb-8w",
                "fr-mb-n8v",
              )}
            >
              <div className={fr.cx("fr-col-md-8")}>
                <h2 className={fr.cx("fr-h5")}>Qui sommes-nous&nbsp;?</h2>
                <p>
                  <b>
                    <Link href="https://infomedicament.beta.gouv.fr">
                      Info Médicament
                    </Link>
                  </b>{" "}
                  est un service public gratuit proposé par l’État qui vise à
                  améliorer l’accès à des informations fiables et compréhensibles
                  sur les médicaments.
                </p>
                <p>
                  Ce service répond à plusieurs enjeux cruciaux : la lutte contre
                  la désinformation, la réduction du mésusage des médicaments et
                  la responsabilisation des patient·es dans la gestion de leur
                  santé.
                </p>
                <p>
                  <b>
                    <Link href="https://infomedicament.beta.gouv.fr">
                      Info Médicament
                    </Link>
                  </b>{" "}
                  est le service numérique de référence d’informations sur les
                  médicaments et fournit aux patient·es et aux professionnel·les
                  de santé des données actualisées et validées sur les
                  médicaments.
                </p>
                <p>
                  Les données d’Info Médicament proviennent de la{" "}
                  <Link 
                    href="https://base-donnees-publique.medicaments.gouv.fr/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Base de données publique des médicaments
                  </Link>, elle même alimentée par les données de la Haute autorité de santé (HAS), la Caisse nationale d'assurance maladie des travailleurs salariés (CNAMTS), le Comité Economique des Produits de Santé (CEPS) et l'Agence nationale de sécurité des médicaments et des produits de santé (ANSM).
                </p>
              </div>
              <div className={fr.cx("fr-col-md-8", "fr-mt-4w")}>
                <h2 className={fr.cx("fr-h5")}>L&apos;équipe</h2>
                <ul>
                  <li>
                    <Link 
                      href="https://ansm.sante.fr/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ANSM
                    </Link>&nbsp;:{" "}
                    <Link href="https://infomedicament.beta.gouv.fr">
                      Info Médicament
                    </Link>{" "}
                    est porté par l’Agence Nationale de Sécurité du Médicament et
                    des produits de santé.
                  </li>
                  <li>
                    <Link 
                      href="https://beta.gouv.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      BETA.GOUV.FR
                    </Link>&nbsp;:{" "}
                    <Link href="https://infomedicament.beta.gouv.fr">
                      Info Médicament
                    </Link>{" "}
                    est une start-up d’État du programme{" "}
                    <Link 
                      href="https://beta.gouv.fr"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Beta.gouv.fr
                    </Link>
                    &nbsp;:{" "}de la
                    Direction interministérielle du numérique (
                      <Link 
                        href="https://www.numerique.gouv.fr/numerique-etat/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        DINUM
                      </Link>
                    ), qui accompagne les administrations dans la construction de
                    services numériques.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </ContentContainer>
    </>
  );
}
