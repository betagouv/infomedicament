"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import styled from 'styled-components';

const TitleContainer = styled.div`
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  align-items: flex-start;
`;
const Title = styled.h2`
  font-weight: normal !important;
`;
interface SearchFiltersTitleProps extends HTMLAttributes<HTMLDivElement> {}

function SearchFiltersTitle({
  ...props
}: SearchFiltersTitleProps) {

  return (
    <TitleContainer {...props}>
      <Title className={fr.cx("fr-h6")}>
        <span 
          className={fr.cx("fr-icon-filter-fill", "fr-mr-1w")}
          style={{color: "var(--text-default-info)"}}
        />
        Filtres
      </Title>
    </TitleContainer>
  );
};

export default SearchFiltersTitle;
