"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { Article, ArticleTrackingFromType } from "@/types/ArticlesTypes";
import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import { trackEvent } from "@/services/tracking";

interface ArticlesSimpleListProps extends HTMLAttributes<HTMLDivElement> {
  listRole?: string;
  articles: Article[];
  trackingFrom: ArticleTrackingFromType;
  linkAll?: boolean;
  listClassName?: string;
  articleClassName?: string;
}

function ArticlesSimpleList({
  listRole,
  articles,
  trackingFrom,
  linkAll,
  listClassName,
  articleClassName
}: ArticlesSimpleListProps) {

  const [articlesList, setArticlesList] = useState<Article[]>([]);

  useEffect(() => {
    if(articles)
      setArticlesList(articles);
  },[articles, setArticlesList]); 

  return articles.length > 0 && (
    <ul 
      role={listRole ? listRole : ""} 
      className={
        listClassName 
          ? [fr.cx("fr-raw-list"), listClassName].join(" ")
          : fr.cx("fr-raw-list")
      }
    >
      {articlesList.map(({ title, slug }) => (
        <li key={slug} className={articleClassName}>
          <Link
            href={`/articles/${slug}`}
            className={fr.cx(
              "fr-link",
              "fr-link--icon-left",
              "fr-icon-arrow-right-line",
            )}
            onClick={() => trackEvent("Article", trackingFrom)}
          >
            {title}
          </Link>
        </li>
      ))}   
      {linkAll && (           
        <li key={"all"}>
          <Link href="/articles" className={fr.cx("fr-link")}>
            Voir tous les articles
          </Link>
        </li>
      )}
    </ul>
  );
};

export default ArticlesSimpleList;
