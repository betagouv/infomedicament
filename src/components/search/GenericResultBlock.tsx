"use client";
import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchTypeEnum, SearchPatho, SearchSubstanceNom, SearchResultData, SearchATCClass } from "@/types/SearchTypes";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { ATC } from "@/data/grist/atc";

const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  
  .result-link{
    display: block;
    background-image: none;
  }
  .result-link:hover{
    background-color: var(--background-alt-grey);
    border-radius: 8px;
  }
`;
const ResultTitle = styled.span`
  color: var(--grey-200-850);
`;
const ResultDetails = styled.span`
  color: var(--text-mention-grey);
  font-style: italic;
`;
const ClassTitle = styled.span`
  font-weight: normal !important;
  color: var(--grey-200-850);
`;

interface ResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  specName: string;
  link: string;
  details?: string;
  className?: string;
}

function ResultBlock({
  specName,
  link,
  details,
  className,
}: ResultBlockProps) {
  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <Link
        href={link}
        className={["result-link", fr.cx("fr-p-1w")].join(" ")}
      >
        {className && (<ClassTitle className={fr.cx("fr-text--md")}>{className}{" > "}</ClassTitle>)}
        <ResultTitle className={fr.cx("fr-text--md", "fr-mr-2w")}>{specName}</ResultTitle>
        {details && (<ResultDetails className={fr.cx("fr-text--sm")}>{details}</ResultDetails>)}
      </Link>
    </Container>
  );
}

interface GenericResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchResultData;
  type: SearchTypeEnum;
}

function GenericResultBlock({
  item,
  type,
}: GenericResultBlockProps) {

  const classSpecName:string = type === SearchTypeEnum.ATCCLASS ? formatSpecName((item as SearchATCClass).class.label) : "";

  function getFormatSpecName(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return formatSpecName((item as SearchSubstanceNom).NomLib);
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return formatSpecName((item as SearchPatho).NomPatho);
    } else if(type === SearchTypeEnum.ATCCLASS){
      return classSpecName;
    }
    return "Autre";
  }

  function getLink(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return `/substances/${(item as SearchSubstanceNom).NomId}`;
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return `/pathologies/${(item as SearchPatho).codePatho}`;
    } else if(type === SearchTypeEnum.ATCCLASS){
      return `/atc/${(item as SearchATCClass).class.code}`;
    }
    return "#";
  }

  function getDetails(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return `${(item as SearchSubstanceNom).nbSpecs} ${(item as SearchSubstanceNom).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return `${(item as SearchPatho).nbSpecs} ${(item as SearchPatho).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } else if(type === SearchTypeEnum.ATCCLASS){
      return `${(item as SearchATCClass).class.children.length} ${(item as SearchATCClass).class.children.length > 1 ? "substances actives" : "substance active"}`;
    }
    return "";
  }

  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <Link
        href={getLink()}
        className={["result-link", fr.cx("fr-p-1w")].join(" ")}
      >
        <ResultTitle className={fr.cx("fr-text--md", "fr-mr-2w")}>{getFormatSpecName()}</ResultTitle>
        {getDetails() && (<ResultDetails className={fr.cx("fr-text--sm")}>{getDetails()}</ResultDetails>)}
      </Link>
    </Container>
  );
};

export default GenericResultBlock;
