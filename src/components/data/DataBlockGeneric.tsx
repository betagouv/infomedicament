"use client";
import Link from "next/link";
import { HTMLAttributes, useEffect, useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { AdvancedATC, AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { ResumeGeneric, ResumePatho, ResumeSubstance } from "@/db/types";

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
  type: DataTypeEnum;
  item: ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric;
}

function DataBlockGeneric({
  type,
  item,
}: DataBlockGenericProps) {

  const [currentType, setCurrentType] = useState<DataTypeEnum>();
  const [currentLink, setCurrentLink] = useState<string>("#");
  const [currentFormatSpecName, setCurrentFormatSpecName] = useState<string>("");
  const [currentDetails, setCurrentDetails] = useState<string>("");
  const [currentSubClasses, setCurrentSubClasses] = useState<AdvancedATC[]>([]); //Only for type === DataTypeEnum.ATCCLASS

  useEffect(() => {
    function getLink(
      dataType: DataTypeEnum, 
      data: ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric
    ){
      if(dataType === DataTypeEnum.SUBSTANCE){
        setCurrentLink(`/substances/${(data as ResumeSubstance).NomId}`);
      } else if(dataType === DataTypeEnum.PATHOLOGY){
        setCurrentLink(`/pathologies/${(data as ResumePatho).codePatho}`);
      } else if(dataType === DataTypeEnum.ATCCLASS){
        setCurrentLink(`/atc/${(data as AdvancedATCClass).class.code}`);
      } else if(dataType === DataTypeEnum.GENERIC){
        setCurrentLink(`/generiques/${(data as ResumeGeneric).SpecId}`);
      } else 
        setCurrentLink("#");
    };

    function getFormatSpecName(
      dataType: DataTypeEnum, 
      data: ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric
    ){
      if(dataType === DataTypeEnum.SUBSTANCE){
        setCurrentFormatSpecName(formatSpecName((data as ResumeSubstance).NomLib));
      } else if(dataType === DataTypeEnum.PATHOLOGY){
        setCurrentFormatSpecName(formatSpecName((data as ResumePatho).NomPatho));
      } else if(dataType === DataTypeEnum.ATCCLASS){
        setCurrentFormatSpecName(formatSpecName((data as AdvancedATCClass).class.label));
      } else if(dataType === DataTypeEnum.GENERIC){
        setCurrentFormatSpecName((data as ResumeGeneric).SpecName);
      }  else 
        setCurrentFormatSpecName("Autre");
    };

    function getDetails(
      dataType: DataTypeEnum, 
      data: ResumeSubstance | ResumePatho | AdvancedATCClass | ResumeGeneric
    ){
      if(dataType === DataTypeEnum.SUBSTANCE){
        setCurrentDetails(`${(data as ResumeSubstance).specialites} ${(data as ResumeSubstance).specialites > 1 ? "médicaments" : "médicament"}`);
      } else if(dataType === DataTypeEnum.PATHOLOGY){
        setCurrentDetails(`${(data as ResumePatho).specialites} ${(data as ResumePatho).specialites > 1 ? "médicaments" : "médicament"}`);
      } else if(dataType === DataTypeEnum.ATCCLASS){
        setCurrentDetails(`${(data as AdvancedATCClass).class.nbSubstances} ${(data as AdvancedATCClass).class.nbSubstances > 1 ? "substances actives" : "substance active"}`);
      } else 
        setCurrentDetails("");
    }

    if(type){
      setCurrentType(type);
      if(item){
        getLink(type, item);
        getFormatSpecName(type, item);
        getDetails(type, item);
        if(type === DataTypeEnum.ATCCLASS){
          setCurrentSubClasses((item as AdvancedATCClass).subclasses);
        }
      }
    }
  }, [item, setCurrentType, setCurrentSubClasses]);
  
  return (
    <>
      <Container className={fr.cx("fr-mb-1w")}>
        <Link
          href={currentLink}
          className={["result-link", fr.cx("fr-p-1w")].join(" ")}
        >
          <Title className={fr.cx("fr-text--md", "fr-mr-2w")}>{currentFormatSpecName}</Title>
          {currentDetails && (<Details className={fr.cx("fr-text--sm")}>{currentDetails}</Details>)}
        </Link>
      </Container>
      {(currentType === DataTypeEnum.ATCCLASS && currentSubClasses.length > 0) && (
          currentSubClasses.map((subclass: AdvancedATC, index) => (
          <Container 
            className={fr.cx("fr-mb-1w")}
            key={index}
          >
            <Link
              href={`/atc/${subclass.code}`}
              className={["result-link", fr.cx("fr-p-1w")].join(" ")}
            >
              <ClassTitle className={fr.cx("fr-text--md")}>{currentFormatSpecName}{" > "}</ClassTitle>
              <Title className={fr.cx("fr-text--md", "fr-mr-2w")}>{formatSpecName(subclass.label)}</Title>
              {subclass.children && (
                <Details className={fr.cx("fr-text--sm")}>
                  {`${subclass.nbSubstances} ${subclass.nbSubstances > 1 ? "substances actives" : "substance active"}`}
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
