import Image from "next/image";
import Button from "@codegouvfr/react-dsfr/Button";
import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import { getArticles } from "@/db/utils/articles";
import { getMarketedMedicamentCount } from "@/db/utils/specialities";
import { getLastSuccessfulPipelineRunDate } from "@/db/utils/pipeline";
import ArticlesSimpleList from "@/components/articles/ArticlesSimpleList";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: "Info Médicament" },
    description: "Accédez aux informations officielles sur les médicaments : notices, RCP, interactions médicamenteuses et ressources pour les professionnels de santé.",
  }
}

export default async function Page() {
  const [articles, marketedCount, lastUpdated] = await Promise.all([
    getArticles().then((a) => a.filter(({ homepage }) => homepage)),
    getMarketedMedicamentCount(),
    getLastSuccessfulPipelineRunDate(),
  ]);

  return (
    <>
      <div className={fr.cx("fr-container", "fr-pt-4w", "fr-pb-4w")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10")}>
            <h1
              className={fr.cx("fr-h2")}
              style={{
                /* Forces 'les' to be on second line */
                maxWidth: "47rem",
              }}
            >
              Trouvez instantanément les informations claires, précises et
              officielles sur vos médicaments, en toute simplicité !
            </h1>
            <p className="fr-text--sm">
              Info Médicament comprend tous les médicaments dont les{" "}
              {marketedCount.toLocaleString("fr-FR")} actuellement
              commercialisés ou ayant été commercialisés durant les trois
              dernières années en France.
            </p>
            {lastUpdated ? (
              <p className="fr-text--sm">
                Les données ont été mises à jour le {new Date(lastUpdated).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "Europe/Paris",
                })}.
              </p>
            ) : null}
            <AutocompleteSearch inputName="s" />
            <p className={fr.cx("fr-text--sm", "fr-mt-1w", "fr-mb-2w")}>
              <Button
                priority="tertiary"
                size="small"
                iconId="fr-icon-equalizer-line"
                linkProps={{ href: "/rechercher?advanced=1" }}
              >
                Recherche avancée
              </Button>
            </p>
            <p className="fr-text--sm">
              Cherchez un <b>médicament</b>, une <b>substance active</b> (ex :
              paracétamol), une <b>indication</b> (ex : diabète), ou une{" "}
              <b>classe de médicaments</b> (ex : antibiotiques).
            </p>
          </div>
          <div
            className={fr.cx(
              "fr-col-12",
              "fr-col-sm-8",
              "fr-col-md-6",
              "fr-mt-4w",
            )}
          >
            <h2 className={fr.cx("fr-h4")}>Vos questions</h2>
            <Image
              src="/img/homepage_illu.svg"
              alt="Un dessin d'une personne regardant une boîte de médicaments."
              className={fr.cx(
                "fr-hidden-xl",
                "fr-hidden-lg",
                "fr-hidden-md",
                "fr-hidden-sm",
                "fr-mb-2w",
              )}
              width={2000}
              height={2000}
              style={{ width: "100%", height: "auto" }}
              priority
            />
            <ArticlesSimpleList
              listRole="nav"
              articles={articles}
              trackingFrom="Page d'accueil"
              articleClassName={fr.cx("fr-mb-3w")}
              linkAll
            />
          </div>
          <div
            className={fr.cx(
              "fr-col-md-5",
              "fr-col-sm-4",
              "fr-hidden",
              "fr-unhidden-xl",
              "fr-unhidden-lg",
              "fr-unhidden-md",
              "fr-unhidden-sm",
            )}
          >
            <Image
              src="/img/homepage_illu.svg"
              alt="Un dessin d'une personne regardant une boîte de médicaments."
              style={{ width: "100%", height: "auto" }}
              width={2000}
              height={2000}
              priority
            />
          </div>
          <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mt-2w")}>
            <hr className={fr.cx("fr-pb-4w", "fr-mt-1w")}/>
            <h2 className={fr.cx("fr-h4")}>Pour les pros</h2>
            <p className="fr-text--sm">En janvier 2027, Info Médicament devient le site officiel de référence sur les médicaments.</p>
            <Link href="/files/dossier-de-presse.pdf" className={fr.cx("fr-btn", "fr-btn--secondary", "fr-mb-3w")}>
              Télécharger notre dossier de presse 
            </Link>
            <br/>
            <p className="fr-text--sm">Pour toutes questions supplémentaires, vous pouvez vous connecter à un de nos webinaires : </p>
            <ul className="fr-text--sm">
              <li><b>28 OCTOBRE</b> à 13h</li>
              <li><b>18 NOVEMBRE</b> à 13h</li>
              <li><b>09 DECEMBRE</b> à 13h</li>
            </ul>
            <p className="fr-text--sm">Retrouvez le lien de visio sur notre dossier de presse.</p>
          </div>
        </div>
      </div>
    </>
  );
}
