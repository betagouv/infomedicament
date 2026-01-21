import { getArticles } from "@/db/utils/articles";
import { fr } from "@codegouvfr/react-dsfr";
import { Fragment } from "react";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import ArticlesSimpleList from "@/components/articles/ArticlesSimpleList";

export const dynamic = "error";
const PAGE_LABEL: string = "Liste des articles";

export default async function Page() {
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
          <h1>Articles</h1>
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
