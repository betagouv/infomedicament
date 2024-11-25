import Image from "next/image";
import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import Link from "next/link";
import Card from "@codegouvfr/react-dsfr/Card";
import { getArticles } from "@/data/grist/articles";

export default async function Page() {
  const articles = (await getArticles()).filter(({ homepage }) => homepage);

  return (
    <>
      <div className={fr.cx("fr-container", "fr-pt-4w", "fr-pb-4w")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <form action="/rechercher">
              <h1 className={fr.cx("fr-h4")}>
                Comprenez tout sur vos médicaments
              </h1>
              <AutocompleteSearch inputName="s" className={fr.cx("fr-mb-2w")} />
              <p className="fr-text--xs">
                <em>
                  Vous pouvez chercher un médicament, une molécule (ex&nbsp;:
                  paracétamol), une pathologie (ex&nbsp;: anxiété) ou un type de
                  médicaments (ex&nbsp;: antibiotique, contraceptif...)
                </em>
              </p>
            </form>
          </div>
          <div
            className={fr.cx(
              "fr-col-12",
              "fr-col-sm-9",
              "fr-col-md-6",
              "fr-mt-4w",
            )}
          >
            <h2 className={fr.cx("fr-h4")}>
              Vos questions sur les médicaments
            </h2>
            <Image
              src="/homepage_illu.svg"
              alt="Un dessin d'une personne regardant une boîte de médicaments."
              className={fr.cx(
                "fr-responsive-img",
                "fr-hidden-xl",
                "fr-hidden-lg",
                "fr-hidden-md",
                "fr-hidden-sm",
                "fr-mb-2w",
              )}
              width={2000}
              height={2000}
            />
            <ul role="nav" className={fr.cx("fr-raw-list")}>
              {articles.map(({ title, slug }) => (
                <li key={slug} className={fr.cx("fr-mb-3w")}>
                  <Link
                    href={`/articles/${slug}`}
                    className={fr.cx(
                      "fr-link",
                      "fr-link--icon-left",
                      "fr-icon-arrow-right-line",
                    )}
                  >
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div
            className={fr.cx(
              "fr-col-sm-3",
              "fr-hidden",
              "fr-unhidden-xl",
              "fr-unhidden-lg",
              "fr-unhidden-md",
              "fr-unhidden-sm",
            )}
          >
            <Image
              src="/homepage_illu.svg"
              alt="Un dessin d'une personne regardant une boîte de médicaments."
              className={fr.cx("fr-responsive-img")}
              width={2000}
              height={2000}
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-mt-4w")}>
            <h2 className={fr.cx("fr-h4")}>Nos missions</h2>
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <Card
              title="Rendre claires les notices"
              titleAs="h3"
              desc="Simplifier la compréhension des notices de médicaments"
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <Card
              title="Mieux informer"
              titleAs="h3"
              desc="Informer sur les médicaments pour améliorer le suivi des traitements par les patient⋅es"
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
            <Card
              title="Partager les données"
              titleAs="h3"
              desc="Faciliter l’accès à aux données sur les médicaments notamment via une API publique"
            />
          </div>
        </div>
      </div>
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
            </div>
            <div className={fr.cx("fr-col-md-8", "fr-mt-4w")}>
              <h2 className={fr.cx("fr-h5")}>L&apos;équipe</h2>
              <ul>
                <li>
                  ANSM&nbsp;:{" "}
                  <Link href="https://infomedicament.beta.gouv.fr">
                    Info Médicament
                  </Link>{" "}
                  est porté par l’Agence Nationale de Sécurité du Médicament et
                  des produits de santé.
                </li>
                <li>
                  <Link href="https://beta.gouv.fr">beta.gouv.fr</Link>&nbsp;:{" "}
                  <Link href="https://infomedicament.beta.gouv.fr">
                    Info Médicament
                  </Link>{" "}
                  est une start-up d’État du programme Beta.gouv.fr de la
                  Direction interministérielle du numérique (DINUM), qui
                  accompagne les administrations dans la construction de
                  services numériques.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
