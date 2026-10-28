import { getArticles } from "@/db/utils/articles";
import { fr } from "@codegouvfr/react-dsfr";
import { Fragment } from "react";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ArticlesSimpleList from "@/components/articles/ArticlesSimpleList";
import { Metadata } from "next";

const PAGE_LABEL: string = "Liste des articles";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: PAGE_LABEL,
    description: "Retrouvez nos articles sur les médicaments et leur utilisation : grossesse, allaitement, génériques, interactions, précautions et autres sujets de santé.",
  }
}

export default async function Page() {
  "use cache: remote";

  const articles = await getArticles();

  const categories = Array.from(
    articles
      .reduce((acc, article) => {
        return acc.add(article.category);
      }, new Set<string>())
      .values(),
  );

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1>Vos questions</h1>
          {categories.map((category) => (
            <Fragment key={category}>
              <h2 className={fr.cx("fr-h4", "fr-mb-1w")}>{category}</h2>

              <ArticlesSimpleList
                articles={articles.filter(({ category: articleCategory }) => articleCategory === category)}
                trackingFrom="Liste articles"
                listClassName={fr.cx("fr-mb-5w")}
                articleClassName={fr.cx("fr-mb-1w")}
              />
            </Fragment>
          ))}
        </div>
      </div>
      <RatingToaster
        pageId={PAGE_LABEL}
      />
    </ContentContainer>
  );
}
