import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchTypeEnum, SearchATCClass, SearchResultData, SearchPatho, SearchSubstanceNom } from "@/types/SearchType";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';

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
interface GenericResultBlockProps extends HTMLAttributes<HTMLDivElement> {
  item: SearchResultData;
  type: SearchTypeEnum;
}

function GenericResultBlock({
  item,
  type,
}: GenericResultBlockProps) {

 console.log(item);

  function getFormatSpecName(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return formatSpecName((item as SearchSubstanceNom).NomLib);
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return formatSpecName((item as SearchPatho).NomPatho)
    } else if(type === SearchTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }
    return "Autre";
  }

  function getLink(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return `/substances/${(item as SearchSubstanceNom).NomId}`;
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return `/pathologies/${(item as SearchPatho).codePatho}`;
    } /*else if(type === SearchTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }*/
    return "#";
  }

  function getDetails(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return `${(item as SearchSubstanceNom).nbSpecs} ${(item as SearchSubstanceNom).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return `${(item as SearchPatho).nbSpecs} ${(item as SearchPatho).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } /*else if(type === SearchTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }*/
    return "#";
  }

  return (
    <Container className={fr.cx("fr-mb-3w")}>
      <Link
        href={getLink()}
        className={["result-link", fr.cx("fr-p-2w")].join(" ")}
      >
        <ResultTitle className={fr.cx("fr-h5", "fr-mr-2w")}>{getFormatSpecName()}</ResultTitle>
        <ResultDetails>{getDetails()}</ResultDetails>
      </Link>
      
    </Container>
  );
};

export default GenericResultBlock;
