import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { SearchTypeEnum, SearchATCClass, SearchResultData } from "@/types/SearchType";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { Patho, SubstanceNom } from "@/db/pdbmMySQL/types";

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
      return formatSpecName((item as SubstanceNom).NomLib);
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return formatSpecName((item as Patho).NomPatho)
    } else if(type === SearchTypeEnum.ATCCLASS){
      return formatSpecName((item as SearchATCClass).class.label)
    }
    return "Autre";
  }

  function getLink(){
    if(type === SearchTypeEnum.SUBSTANCE){
      return `/substances/${(item as SubstanceNom).NomId}`;
    } else if(type === SearchTypeEnum.PATHOLOGY){
      return `/pathologies/${(item as Patho).codePatho}`;
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
      </Link>
      
    </Container>
  );
};

export default GenericResultBlock;
