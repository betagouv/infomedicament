import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled, { css } from 'styled-components';
import { ArticleCardResume } from "@/types/ArticlesTypes";
import Link from "next/link";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { SearchArticlesFilters } from "@/types/SearchTypes";
import { DataTypeEnum } from "@/types/DataTypes";

const Container = styled.div<{ $whiteContainer?: boolean; }> `
  ${props => props.$whiteContainer 
    ? css`background-color: #FFF;`
    : css`background-color: var(--background-alt-blue-france);`
  }
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
`;
const ArticleContainer = styled.div `
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  background-color: #FFF;
  padding: 0.5rem;
`;
interface ArticlesResumeListProps extends HTMLAttributes<HTMLDivElement> {
  articles: ArticleCardResume[];
  filterCategory?: DataTypeEnum | boolean;
  articlesFilters?: SearchArticlesFilters;
  whiteContainer?: boolean;
}

function ArticlesResumeList({
  articles,
  filterCategory,
  articlesFilters,
  whiteContainer,
}: ArticlesResumeListProps) {

  const [articlesList, setArticlesList] = useState<ArticleCardResume[]>(articles);

  useEffect(() => {
    if(!filterCategory || !articlesFilters) return;
    const newArticlesList:ArticleCardResume[] = [];
    articles.forEach((article:ArticleCardResume) => {
      if(filterCategory === DataTypeEnum.MEDGROUP){
        const index = (article.specialites).find((articleCodeCIS: string) => articlesFilters.specialitesList.find((codeCIS: string) => codeCIS === articleCodeCIS));
        if(index) newArticlesList.push(article);
      }
      if(filterCategory === DataTypeEnum.PATHOLOGY){
        const index = (article.pathologies).find((articleCodePatho: number) => articlesFilters.pathologiesList.find((codePatho: string) => parseInt(codePatho) === articleCodePatho));
        if(index) newArticlesList.push(article);
      }
      if(filterCategory === DataTypeEnum.SUBSTANCE){
        const index = (article.substances).find((articleSubsId: string) => articlesFilters.substancesList.find((subsId: string) => subsId === articleSubsId));
        if(index) newArticlesList.push(article);
      }
      if(filterCategory === DataTypeEnum.ATCCLASS){
        const index = (article.atc).find((articleAtcCode: number) => articlesFilters.ATCList.find((atcCode: string) => parseInt(atcCode) === articleAtcCode));
        if(index) newArticlesList.push(article);
      }
    })
    setArticlesList(newArticlesList);
  },[filterCategory, setArticlesList]);  

  return (
    articlesList.length > 0 && (
      <Container $whiteContainer={whiteContainer}>
        <div className={fr.cx("fr-h6", "fr-mb-1w")}>
          En savoir plus
        </div>
        <div>
          {articlesList.map((article:ArticleCardResume, index) => {
            return (
              <ArticleContainer key={index}>
                <Link 
                  className={fr.cx("fr-text--sm", "fr-link")}
                  href={article.canonicalUrl}>
                    {article.title}
                </Link>
                <div className={fr.cx("fr-mt-1w")}>
                  <Badge severity="info" noIcon={true}>ARTICLE</Badge>
                </div>
              </ArticleContainer>
            );
          })}
        </div>
      </Container>
    )
  );
};

export default ArticlesResumeList;
