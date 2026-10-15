"use client";

import { SkeletonLine } from "../generic/Skeleton";
import styled from "styled-components";

const LoadingResults = styled.div`
  padding-bottom: 2rem;
`;

const LoadingCount = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ResultsLayout = styled.div`
  display: flex;
  gap: 2rem;
  @media (max-width: 48em) {
    display: block;
  }
`;

const LoadingFilters = styled.aside`
  flex: 0 0 260px;
  @media (max-width: 48em) {
    display: none;
  }
`;

const FilterTitle = styled.p`
  border-bottom: 2px solid var(--border-open-blue-france);
  padding-bottom: 0.75rem;
  font-size: 1.125rem;
`;

const FilterGroup = styled.div`
  margin-bottom: 2rem;
  & p {
    font-weight: bold;
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
`;

const LoadingCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  & > :last-child {
    flex-shrink: 1;
  }
`;

const ResultsColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

const MobileFilters = styled.div`
  display: none;
  @media (max-width: 48em) {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-action-high-blue-france);
    padding-block: 0.5rem;
    margin-bottom: 1rem;
  }
`;

const LoadingSort = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  @media (max-width: 48em) {
    display: none;
  }
`;

const LoadingResult = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem 0.5rem;
  border-bottom: 2px solid var(--border-open-blue-france);
`;

const ResultText = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 1.5rem;
  justify-content: center;
`;

export default function SearchResultsLoading({ search }: { search?: string }) {
  return (
    <LoadingResults
      role="status"
      aria-live="polite"
      aria-label="Chargement des résultats"
    >
      <LoadingCount aria-hidden="true">
        <SkeletonLine width={search ? "3rem" : "15rem"} height="1.25rem" />
        {search ? (
          <>
            résultats pour : <strong>“{search}”</strong>
          </>
        ) : null}
      </LoadingCount>
      <ResultsLayout>
        <LoadingFilters aria-hidden="true">
          <FilterTitle>
            <span className="fr-icon--custom-filters" /> Filtres
          </FilterTitle>
          {["Substance active", "Classe de médicament", "Indication"].map(
            (label) => (
              <FilterGroup key={label}>
                <p>{label}</p>
                {["80%", "65%", "75%"].map((width) => (
                  <LoadingCheckbox key={width}>
                    <SkeletonLine width="1.25rem" height="1.25rem" />
                    <SkeletonLine width={width} height="0.875rem" />
                  </LoadingCheckbox>
                ))}
              </FilterGroup>
            ),
          )}
        </LoadingFilters>
        <ResultsColumn>
          <MobileFilters aria-hidden="true">
            <span className="fr-icon--custom-filters" /> Filtres
          </MobileFilters>
          <LoadingSort aria-hidden="true">
            Trier par <SkeletonLine width="13rem" height="0.875rem" />
          </LoadingSort>
          {Array.from({ length: 6 }, (_, index) => (
            <LoadingResult key={index}>
              <ResultText>
                <SkeletonLine width={index % 2 ? "66%" : "80%"} height="1rem" />
                {index % 3 === 1 ? (
                  <SkeletonLine width="48%" height="1rem" />
                ) : null}
              </ResultText>
            </LoadingResult>
          ))}
        </ResultsColumn>
      </ResultsLayout>
    </LoadingResults>
  );
}
