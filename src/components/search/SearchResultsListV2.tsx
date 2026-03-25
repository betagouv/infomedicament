"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Link from "next/link";
import styled from "styled-components";
import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { SearchResultItemV2 } from "@/db/utils/searchOpenSearch";
import { formatSpecName } from "@/displayUtils";
import PregnancyPediatricFilters from "./PregnancyPediatricFilters";
import PregnancyPlanTag from "@/components/tags/PregnancyPlanTag";
import PregnancyMentionTag from "@/components/tags/PregnancyMentionTag";
import PediatricsTags from "@/components/tags/PediatricsTags";

const SearchTitle = styled.h1`
  display: inline;
  span {
    font-weight: normal !important;
  }
  i {
    font-weight: bold;
  }
`;

const ResultCard = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
`;

const GreyText = styled.span`
  color: var(--text-mention-grey);
`;

const DarkGreyText = styled.span`
  color: var(--text-title-grey);
`;

const FiltersTagContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  a {
    margin-right: 0.5rem;
    margin-top: 0.2rem;
  }
`;

const ResultsListBlockContainer = styled.div`
  column-gap: 2rem;
`;

interface SearchResultsListV2Props extends HTMLAttributes<HTMLDivElement> {
  resultsList: SearchResultItemV2[];
  totalResults: number;
  searchTerms?: string | boolean;
  setFilterPregnancy: (value: boolean) => void;
  setFilterPediatric: (value: boolean) => void;
  filterPregnancy: boolean;
  filterPediatric: boolean;
}

function SearchResultsListV2({
  resultsList,
  totalResults,
  searchTerms,
  setFilterPregnancy,
  setFilterPediatric,
  filterPregnancy,
  filterPediatric,
}: SearchResultsListV2Props) {
  return (
    <div>
      <div className={fr.cx("fr-grid-row", "fr-mb-2w")}>
        <PregnancyPediatricFilters
          setFilterPregnancy={setFilterPregnancy}
          setFilterPediatric={setFilterPediatric}
          filterPregnancy={filterPregnancy}
          filterPediatric={filterPediatric}
        />
      </div>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-2w")}>
          <SearchTitle className={fr.cx("fr-text--md")}>
            <span className={fr.cx("fr-mr-2w")}>{totalResults} résultats pour :</span>
            <i>&quot;{searchTerms}&quot;</i>
          </SearchTitle>
        </div>
      </div>
      <ResultsListBlockContainer className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-12", "fr-col-md-8")}>
          {resultsList.map((item) => {
            const showPregnancyPlan =
              filterPregnancy && !!item.alerts?.pregnancyPlanAlert;
            const showPregnancyMention =
              filterPregnancy &&
              !item.alerts?.pregnancyPlanAlert &&
              !!item.alerts?.pregnancyMentionAlert;
            const showPediatrics = filterPediatric && !!item.alerts?.pediatrics;

            return (
              <ResultCard key={item.cisCode} className={fr.cx("fr-p-1w", "fr-mb-1w")}>
                <div>
                  <Link
                    href={`/medicaments/${item.cisCode}`}
                    className={fr.cx("fr-text--md", "fr-link")}
                    style={{ fontWeight: "bold" }}
                  >
                    {formatSpecName(item.specName)}
                  </Link>
                  {item.ProcId === "50" && (
                    <Tooltip
                      title="Ce médicament est en Autorisation d'Importation parallèle."
                      kind="hover"
                    >
                      <b className={fr.cx("fr-ml-1v", "fr-text--sm")} style={{ color: "#89BA12" }}>
                        AIP
                      </b>
                    </Tooltip>
                  )}
                  {item.StatutBdm === "2" && (
                    <Tooltip
                      title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
                      kind="hover"
                    >
                      <i
                        className={fr.cx("fr-icon-close-circle-line", "fr-ml-1v")}
                        style={{ color: "var(--text-action-high-blue-france)" }}
                      />
                    </Tooltip>
                  )}
                  {item.StatutBdm === "3" && (
                    <Tooltip
                      title="Alerte de sécurité sanitaire sur ce médicament, veuillez consulter la notice pour en savoir plus."
                      kind="hover"
                    >
                      <i
                        className={fr.cx("fr-icon-alert-line", "fr-ml-1v")}
                        style={{ color: "var(--red-marianne-main-472)" }}
                      />
                    </Tooltip>
                  )}
                  {item.isSurveillanceRenforcee && (
                    <Tooltip
                      title="Ce médicament fait l'objet d'une information importante ou il est sous surveillance renforcée."
                      kind="hover"
                    >
                      <i
                        className={fr.cx("fr-icon-information-line", "fr-ml-1v")}
                        style={{ color: "var(--warning-425-625)" }}
                      />
                    </Tooltip>
                  )}
                </div>
                <div>
                  {(item.atc1Label || item.atc2Label) && (
                    <span className={fr.cx("fr-text--sm", "fr-mr-2w")}>
                      <GreyText>Classe</GreyText>&nbsp;
                      <DarkGreyText>
                        {item.atc1Label}
                        {item.atc1Label && item.atc2Label && " > "}
                        {item.atc2Label}
                      </DarkGreyText>
                    </span>
                  )}
                  <span className={fr.cx("fr-text--sm")}>
                    <GreyText>Substance active</GreyText>&nbsp;
                    <DarkGreyText>{item.composants}</DarkGreyText>
                  </span>
                </div>
                {(showPregnancyPlan || showPregnancyMention || showPediatrics) && (
                  <FiltersTagContainer>
                    {showPregnancyPlan && <PregnancyPlanTag />}
                    {showPregnancyMention && <PregnancyMentionTag />}
                    {showPediatrics && item.alerts?.pediatrics && (
                      <PediatricsTags info={item.alerts.pediatrics} />
                    )}
                  </FiltersTagContainer>
                )}
              </ResultCard>
            );
          })}
        </div>
      </ResultsListBlockContainer>
    </div>
  );
}

export default SearchResultsListV2;
