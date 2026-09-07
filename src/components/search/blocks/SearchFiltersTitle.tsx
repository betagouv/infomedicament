"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
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
interface SearchFiltersTitleProps extends HTMLAttributes<HTMLDivElement> {
  selectedFiltersCount?: number;
}

function SearchFiltersTitle({
  selectedFiltersCount,
  ...props
}: SearchFiltersTitleProps) {

  const [filtersCount, setFiltersCount] = useState<number>(0);
  useEffect(() => {
    if(selectedFiltersCount)
      setFiltersCount(selectedFiltersCount);
    else setFiltersCount(0);
  }, [selectedFiltersCount, setFiltersCount])

  return (
    <TitleContainer {...props}>
      <Title className={fr.cx("fr-h6")}>
        <span 
          className={["fr-icon--custom-filters", fr.cx("fr-mr-1w")].join(" ")}
        />
        Filtres
        {filtersCount > 0 && 
          <span>{` (${filtersCount})`}</span>
        }
      </Title>
    </TitleContainer>
  );
};

export default SearchFiltersTitle;
