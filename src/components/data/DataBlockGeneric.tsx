"use client";
import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { ATC } from "@/data/grist/atc";
import { AdvancedATCClass, AdvancedData, AdvancedPatho, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";

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
const Title = styled.span`
  color: var(--grey-200-850);
`;
const Details = styled.span`
  color: var(--text-mention-grey);
  font-style: italic;
`;
const ClassTitle = styled.span`
  font-weight: normal !important;
  color: var(--grey-200-850);
`;

interface DataBlockGenericProps extends HTMLAttributes<HTMLDivElement> {
  item: AdvancedData;
}

function DataBlockGeneric({
  item,
}: DataBlockGenericProps) {

  const type = item.type;
  const data = item.result;
  const classSpecName:string = type === DataTypeEnum.ATCCLASS ? formatSpecName((data as AdvancedATCClass).class.label) : "";

  function getFormatSpecName(){
    if(type === DataTypeEnum.SUBSTANCE){
      return formatSpecName((data as AdvancedSubstanceNom).NomLib);
    } else if(type === DataTypeEnum.PATHOLOGY){
      return formatSpecName((data as AdvancedPatho).NomPatho);
    } else if(type === DataTypeEnum.ATCCLASS){
      return classSpecName;
    }
    return "Autre";
  }

  function getLink(){
    if(type === DataTypeEnum.SUBSTANCE){
      return `/substances/${(data as AdvancedSubstanceNom).NomId}`;
    } else if(type === DataTypeEnum.PATHOLOGY){
      return `/pathologies/${(data as AdvancedPatho).codePatho}`;
    } else if(type === DataTypeEnum.ATCCLASS){
      return `/atc/${(data as AdvancedATCClass).class.code}`;
    }
    return "#";
  }

  function getDetails(){
    if(type === DataTypeEnum.SUBSTANCE){
      return `${(data as AdvancedSubstanceNom).nbSpecs} ${(data as AdvancedSubstanceNom).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } else if(type === DataTypeEnum.PATHOLOGY){
      return `${(data as AdvancedPatho).nbSpecs} ${(data as AdvancedPatho).nbSpecs > 1 ? "médicaments" : "médicament"}`;
    } else if(type === DataTypeEnum.ATCCLASS){
      return `${(data as AdvancedATCClass).class.children.length} ${(data as AdvancedATCClass).class.children.length > 1 ? "substances actives" : "substance active"}`;
    }
    return "";
  }

  return (
    <>
      <Container className={fr.cx("fr-mb-1w")}>
        <Link
          href={getLink()}
          className={["result-link", fr.cx("fr-p-1w")].join(" ")}
        >
          <Title className={fr.cx("fr-text--md", "fr-mr-2w")}>{getFormatSpecName()}</Title>
          {getDetails() && (<Details className={fr.cx("fr-text--sm")}>{getDetails()}</Details>)}
        </Link>
      </Container>
      {(type === DataTypeEnum.ATCCLASS && (data as AdvancedATCClass).subclasses.length > 0) && (
        (data as AdvancedATCClass).subclasses.map((subclass: ATC, index) => (
          <Container 
            className={fr.cx("fr-mb-1w")}
            key={index}
          >
            <Link
              href={`/atc/${subclass.code}`}
              className={["result-link", fr.cx("fr-p-1w")].join(" ")}
            >
              <ClassTitle className={fr.cx("fr-text--md")}>{classSpecName}{" > "}</ClassTitle>
              <Title className={fr.cx("fr-text--md", "fr-mr-2w")}>{formatSpecName(subclass.label)}</Title>
              {subclass.children && (
                <Details className={fr.cx("fr-text--sm")}>
                  {`${subclass.children.length} ${subclass.children.length > 1 ? "substances actives" : "substance active"}`}
                </Details>
              )}
            </Link>
          </Container>
        ))
      )}
    </>
  );
};

export default DataBlockGeneric;
