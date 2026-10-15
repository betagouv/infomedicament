"use client";

import { HTMLAttributes } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import styled from "styled-components";
import DataBlockGenericIcons from "./DataBlockGenericIcons";
import { formatSpecName } from "@/displayUtils";
import {
  MatchReason,
  SearchFilter,
  SearchResultItem,
} from "@/types/SearchTypes";

const DataBlockSpecResultContainer = styled.div`
  border-bottom: 2px solid var(--border-open-blue-france);
`;

const ResultLink = styled(Link)`
  background-image: none;
  width: 100%;
  display: flex;
  justify-content: space-between;
  &:hover {
    background-color: var(--background-alt-grey);
  }
`;

const FilterTitle = styled.span`
  color: var(--text-mention-grey);
`;

interface DataBlockSpecResultProps extends HTMLAttributes<HTMLDivElement> {
  specialite: SearchResultItem;
  matchReasons?: MatchReason[];
  subsFilters: SearchFilter[];
  atcsFilters: SearchFilter[];
  indicationsFilters: SearchFilter[];
}

function DataBlockSpecResult({
  specialite,
  subsFilters,
  atcsFilters,
  indicationsFilters,
}: DataBlockSpecResultProps) {
  const indexGroupName = specialite.specName.indexOf(specialite.groupName);
  const prefixName = formatSpecName(
    indexGroupName === 0 ? specialite.groupName : specialite.specName,
  );
  const suffixName =
    indexGroupName === 0
      ? formatSpecName(
          specialite.specName.substring(specialite.groupName.length),
        )
      : "";
  const subsNames = subsFilters.find(
    (filter) => filter.id === specialite.composants.trim(),
  )?.name;
  const atc = atcsFilters.find(
    (filter) =>
      filter.id === specialite.atc1Code?.trim() &&
      filter.children?.some(
        (child) => child.selected && child.id === specialite.atc2Code?.trim(),
      ),
  );
  const atc2 = atc?.children?.find(
    (child) => child.selected && child.id === specialite.atc2Code?.trim(),
  );
  const atcNames = atc2 ? `${atc!.name} > ${atc2.name}` : atc?.name;
  const indicationsNames = indicationsFilters
    .filter((filter) =>
      specialite.indicationsDetails?.some(
        (indication) =>
          indication.idIndication.toString() === filter.id &&
          indication.nomIndication.trim() === filter.name,
      ),
    )
    .map((filter) => filter.name);

  return (
    specialite.specName && (
      <DataBlockSpecResultContainer>
        <ResultLink
          href={`medicaments/${specialite.specId}`}
          className={[fr.cx("fr-px-1w", "fr-py-2w")].join(" ")}
        >
          <span>
            <strong>{prefixName}</strong>
            {suffixName}
            {subsNames && (
              <span className={fr.cx("fr-text--sm")}>
                <br />
                <FilterTitle>Substance active </FilterTitle>
                {subsNames}
              </span>
            )}
            {atcNames && (
              <span className={fr.cx("fr-text--sm")}>
                <br />
                <FilterTitle>Classe de médicament </FilterTitle>
                {atcNames}
              </span>
            )}
            {indicationsNames.length > 0 && (
              <span className={fr.cx("fr-text--sm")}>
                <br />
                <FilterTitle>
                  Indication{indicationsNames.length > 1 && "s"}{" "}
                </FilterTitle>
                {indicationsNames.join(", ")}
              </span>
            )}
          </span>
          <DataBlockGenericIcons
            specialite={specialite}
            isSurveillanceRenforcee={specialite.isSurveillanceRenforcee}
            withAlerts
          />
        </ResultLink>
      </DataBlockSpecResultContainer>
    )
  );
}

export default DataBlockSpecResult;
