import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesResumeList from "./ArticlesResumeList";

const Container = styled.div`
  background-color: var(--background-alt-blue-france);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
`;

interface ArticlesSearchListProps extends HTMLAttributes<HTMLDivElement> {
  articles: ArticleCardResume[];
}

function ArticlesSearchList({
  articles,
}: ArticlesSearchListProps) {

  const [articlesList, setArticlesList] = useState<ArticleCardResume[]>([]);

  useEffect(() => {
    if(articles)
      setArticlesList(articles);
  },[articles, setArticlesList]);  

  return (
    articlesList.length > 0 && (
      <Container>
        <ArticlesResumeList articles={articlesList} />
      </Container>
    )
  );
};

export default ArticlesSearchList;
