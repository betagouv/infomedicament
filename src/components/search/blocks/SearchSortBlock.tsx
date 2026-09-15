"use client";

import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import styled from 'styled-components';
import Link from "next/link";
import Button from "@codegouvfr/react-dsfr/Button";
import { SortType } from "@/types/SearchTypes";
import SearchFilterLabel from "./SearchFilterLabel";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Accordion from "@codegouvfr/react-dsfr/Accordion";

const SortContainerDesktop = styled.div`
  text-align: right;
`;

interface SearchSortBlockProps extends HTMLAttributes<HTMLDivElement> {
  onUpdateSortType: (sortType: SortType) => void;
  onUpdateIsSortAsc: (isSortAsc: boolean) => void;
}

function SearchSortBlock({
  onUpdateSortType,
  onUpdateIsSortAsc,
  ...props
}: SearchSortBlockProps) {

  const [sortType, setSortType] = useState<SortType>("score");
  const [isSortAsc, setIsSortAsc] = useState<boolean>(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  useEffect(() => {
    onUpdateSortType(sortType);
  }, [sortType, onUpdateSortType]);

  useEffect(() => {
    onUpdateIsSortAsc(isSortAsc);
  }, [isSortAsc, onUpdateIsSortAsc]);

  return (
    <div {...props} className={props.className}>
      <SortContainerDesktop 
        className={fr.cx("fr-hidden", "fr-unhidden-md", "fr-mb-3w")}
      >
        Trier par{" "}
        {sortType !== "alphabetic" 
          ? (
            <Link
              href=""
              onClick={() => setSortType("alphabetic")}
            >
              ordre alphabétique
            </Link>
          )
          : (<span className={fr.cx("fr-text--bold")}>ordre alphabétique</span>)
        }{" / "}
        {sortType !== "score" 
          ? (
            <Link
              href=""
              onClick={() => setSortType("score")}
            >
              pertinence
            </Link>
          )
          : (<span className={fr.cx("fr-text--bold")}>pertinence</span>)
        }
        <Button
          iconId={isSortAsc ? "fr-icon-arrow-down-line" : "fr-icon-arrow-up-line"}
          onClick={() => setIsSortAsc(!isSortAsc)}
          priority="tertiary no outline"
          title={`Trier par ordre ${isSortAsc ? "décroissant" : "croissant"}`}
          size="small"
        />
      </SortContainerDesktop>
      <Accordion
        label="Trier par"
        onExpandedChange={() => setIsFiltersOpen(!isFiltersOpen)} 
        expanded={false}
        className={fr.cx("fr-hidden-md")}
      >
        <RadioButtons
          options={[{
            label: (
              <SearchFilterLabel
                name="Plus pertinent d'abord"
              />
            ),
            nativeInputProps: {
              checked: sortType === "score" && isSortAsc,
              onChange: (e) => {
                setSortType("score");
                setIsSortAsc(true);
              },
            },
          },
          {
            label: (
              <SearchFilterLabel
                name="Moins pertinent d'abord"
              />
            ),
            nativeInputProps: {
              checked: sortType === "score" && !isSortAsc,
              onChange: (e) => {
                setSortType("score");
                setIsSortAsc(false);
              },
            },
          },
          {
            label: (
              <SearchFilterLabel
                name="Ordre alphabétique de A à Z"
              />
            ),
            nativeInputProps: {
              checked: sortType === "alphabetic" && isSortAsc,
              onChange: (e) => {
                setSortType("alphabetic");
                setIsSortAsc(true);
              },
            },
          },
          {
            label: (
              <SearchFilterLabel
                name="Ordre alphabétique de Z à A"
              />
            ),
            nativeInputProps: {
              checked: sortType === "alphabetic" && !isSortAsc,
              onChange: (e) => {
                setSortType("alphabetic");
                setIsSortAsc(false);
              },
            },
          }]}
        />
      </Accordion>
    </div>
  );
};

export default SearchSortBlock;
