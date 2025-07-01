import Image from "next/image";
import { fr } from "@codegouvfr/react-dsfr";
import AutocompleteSearch from "@/components/AutocompleteSearch";
import Link from "next/link";
import { getArticles } from "@/data/grist/articles";

export default async function Page() {
  const articles = (await getArticles()).filter(({ homepage }) => homepage);

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
              Trouvez instantanément les informations claires, précises et officielles sur vos médicaments, en toute simplicité !
            </h1>
            <AutocompleteSearch inputName="s" className={fr.cx("fr-mb-2w")} />
            <p className="fr-text--sm">
              Cherchez un <b>médicament</b>, une <b>substance active</b> (ex : paracétamol), une <b>pathologie</b> (ex : diabète), ou une <b>classe de médicaments</b> (ex : antibiotiques).
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
            <h2 className={fr.cx("fr-h4")}>
              Articles
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
              <li key={"all"}>
                <Link href="/articles" className={fr.cx("fr-link")}>
                  Voir tous les articles
                </Link>
              </li>
            </ul>
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
              src="/homepage_illu.svg"
              alt="Un dessin d'une personne regardant une boîte de médicaments."
              className={fr.cx("fr-responsive-img")}
              width={2000}
              height={2000}
            />
          </div>
        </div>
      </div>
    </>
  );
}
