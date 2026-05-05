import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import styled, { css } from 'styled-components';
import { ArticleCardResume, ArticleTrackingFromType } from "@/types/ArticlesTypes";
import Link from "next/link";
import { trackEvent } from "@/services/tracking";

const ArticlesListContainer = styled.div`
  @media (max-width: 48em) {
    display: inline-flex;
    width: 100%;
  }
`;

const ArticleBlockContainer = styled.div<{ $isDark: boolean }>`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
  margin-bottom: 1rem;
  ${props => css`
    background-color: ${props.$isDark ? 'var(--background-default-grey)' : '#FFF'};
  `}
  @media (max-width: 48em) {
    margin-right: 1rem;
    min-width: 200px;
    margin-bottom: 0rem;
  }
`;
const ArticlesTitle = styled.h2`
  margin-bottom: 0.5rem;
  @media (max-width: 48em) {
    margin-bottom: 1rem;
  }
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

  return (
    articles.length > 0 && (
      <div>
        <ArticlesTitle className={fr.cx("fr-h6")}>
          En savoir plus
        </ArticlesTitle>
        <ArticlesListContainer>
          {articles.map((article:ArticleCardResume, index) => {
            return (
              <ArticleBlockContainer $isDark={isDark} key={index}>
                <Link 
                  className={fr.cx("fr-text--sm", "fr-link")}
                  href={`/articles/${article.slug}`}
                  target="_blank"
                  onClick={() => trackEvent("Article", trackingFrom)}
                >
                  {article.title}
                </Link>
              </ArticleBlockContainer>
            );
          })}
        </ArticlesListContainer>
      </div>
    )
  );
};

export default ArticlesResumeList;
