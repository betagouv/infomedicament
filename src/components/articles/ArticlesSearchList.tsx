"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import styled from 'styled-components';
import { ArticleCardResume, ArticleTrackingFromType } from "@/types/ArticlesTypes";
import ArticlesResumeList from "./ArticlesResumeList";

const Container = styled.div`
  background-color: var(--background-alt-blue-france);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  padding: 0.5rem;
`;

interface ArticlesSearchListProps extends HTMLAttributes<HTMLDivElement> {
  articles: ArticleCardResume[];
  trackingFrom: ArticleTrackingFromType;
}

function ArticlesSearchList({
  articles,
  trackingFrom,
}: ArticlesSearchListProps) {

  const [articlesList, setArticlesList] = useState<ArticleCardResume[]>([]);

  useEffect(() => {
    if(articles)
      setArticlesList(articles);
  },[articles, setArticlesList]);  

  return (
    articlesList.length > 0 && (
      <Container>
        <ArticlesResumeList 
          articles={articlesList} 
          trackingFrom={trackingFrom}
        />
      </Container>
    )
  );
};

export default ArticlesSearchList;
