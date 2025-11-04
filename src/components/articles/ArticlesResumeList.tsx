import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import styled, { css } from 'styled-components';
import { ArticleCardResume, ArticleTrackingFromType } from "@/types/ArticlesTypes";
import Link from "next/link";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { trackEvent } from "@/services/tracking";


const ArticleContainer = styled.div<{ $isDark: boolean }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
  ${props => css`
    background-color: ${props.$isDark ? 'var(--background-default-grey)' : '#FFF'};
  `}
`;
interface ArticlesResumeListProps extends HTMLAttributes<HTMLDivElement> {
  articles: ArticleCardResume[];
  trackingFrom: ArticleTrackingFromType;
}

function ArticlesResumeList({
  articles,
  trackingFrom,
}: ArticlesResumeListProps) {

  const { isDark } = useIsDark();

  const [articlesList, setArticlesList] = useState<ArticleCardResume[]>([]);

  useEffect(() => {
    if(articles)
      setArticlesList(articles);
  },[articles, setArticlesList]);  

  return (
    articlesList.length > 0 && (
      <>
        <h3 className={fr.cx("fr-h6", "fr-mb-1w")}>
          En savoir plus
        </h3>
        <div>
          {articlesList.map((article:ArticleCardResume, index) => {
            return (
              <ArticleContainer $isDark={isDark} key={index} className={fr.cx("fr-mb-2w")}>
                <Link 
                  className={fr.cx("fr-text--sm", "fr-link")}
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  onClick={() => trackEvent("Article", trackingFrom)}
                >
                  {article.title}
                </Link>
                <div className={fr.cx("fr-mt-1w")}>
                  <Badge severity="info" noIcon={true}>ARTICLE</Badge>
                </div>
              </ArticleContainer>
            );
          })}
        </div>
      </>
    )
  );
};

export default ArticlesResumeList;
