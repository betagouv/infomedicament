"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import Link from "next/link";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import DataBlockGenericIcons from "./DataBlockGenericIcons";
import { formatSpecName } from "@/displayUtils";
import { MatchReason, SearchFilter, SearchResultItem } from "@/types/SearchTypes";

const DataBlockSpecResultContainer = styled.div`
  border-bottom: 2px solid var(--border-open-blue-france);
  .spec-result-link{
    background-image: none;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  .spec-result-link:hover{
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
  indicationsFilters
}: DataBlockSpecResultProps) {

  const [prefixName, setPrefixName] = useState<string>("");
  const [suffixName, setSuffixName] = useState<string>("");
  const [subsNames, setSubsNames] = useState<string>("");
  const [atcNames, setAtcName] = useState<string>("");
  const [indicationsNames, setIndicationsNames] = useState<string[]>([]);

  useEffect(() => {
    const indexGroupName = specialite.specName.indexOf(specialite.groupName);
    if(indexGroupName === 0){
      setPrefixName(formatSpecName(specialite.groupName));
      const suffixName:string = formatSpecName(specialite.specName.substring(indexGroupName + specialite.groupName.length));
      setSuffixName(suffixName);
    }
    else {
      const specName: string = formatSpecName(specialite.specName);
      setPrefixName(specName);
      setSuffixName(specName);
    }
  }, [specialite, setPrefixName, setSuffixName]);

  useEffect(() => {
    const findSubs = subsFilters.find((filter) => filter.id === specialite.composants.trim());
    if(findSubs)
      setSubsNames(findSubs.name);
    else
      setSubsNames("");
  }, [specialite, subsFilters, setSubsNames]);

  useEffect(() => {
    const findATC = atcsFilters.find((filter: SearchFilter) => {
      if(filter.id === specialite.atc1Code?.trim() && filter.children) {
        return filter.children.find((childrenFilter) => childrenFilter.selected && childrenFilter.id === specialite.atc2Code?.trim());
      } else return false;
    });
    if(findATC) {
      const findATC2 = findATC.children
        ? findATC.children.find((childrenFilter) => childrenFilter.selected && childrenFilter.id === specialite.atc2Code?.trim())
        : undefined;
      if(findATC2)
        setAtcName(`${findATC.name} > ${findATC2.name}`)
      else
        setAtcName(findATC.name);
    } else
      setAtcName("");
  }, [specialite, atcsFilters, setAtcName]);

  useEffect(() => {
    if(specialite.indicationsDetails && specialite.indicationsDetails.length > 0){
      const names: string[] = indicationsFilters
        .filter((filter: SearchFilter) => 
          specialite.indicationsDetails?.findIndex((indication) => 
            indication.idIndication.toString() === filter.id && indication.nomIndication.trim() === filter.name
          ) !== -1
        )
        .map((filter: SearchFilter) => filter.name);
      setIndicationsNames(names);
    } else setIndicationsNames([]);
  }, [specialite, indicationsFilters, setIndicationsNames]);

  return specialite.specName && (
    <DataBlockSpecResultContainer>
      <Link
        href={`medicaments/${specialite.specId}`}
        className={["spec-result-link", fr.cx("fr-px-1w", "fr-py-2w")].join(" ")}
      >
        <span>
          <strong>{prefixName}</strong>
          {suffixName}
          {subsNames && (
            <span className={fr.cx("fr-text--sm")}>
              <br/>
              <FilterTitle>
                Substance active{' '}
              </FilterTitle>
              {subsNames}
            </span>
          )}
          {atcNames && (
            <span className={fr.cx("fr-text--sm")}>
              <br/>
              <FilterTitle>
                Classe de médicament{' '}
              </FilterTitle>
              {atcNames}
            </span>
          )}
          {indicationsNames.length > 0 && (
            <span className={fr.cx("fr-text--sm")}>
              <br/>
              <FilterTitle>
                Indication{indicationsNames.length > 1 && 's'}{' '}
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
      </Link>
    </DataBlockSpecResultContainer>
  );
};

export default DataBlockSpecResult;
