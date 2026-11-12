"use client";
import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { AdvancedATC, AdvancedATCClass, DataTypeEnum } from "@/types/DataTypes";
import { ResumeGeneric, ResumeIndication, ResumeSubstance } from "@/db/types";
import { getIndicationSlug } from "@/utils/indications";
import { getGenericSlug } from "@/utils/generics";
import { getAtcSlug } from "@/utils/atc";
import { getSubstanceSlug } from "@/utils/substances";

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
  item: ResumeSubstance | ResumeIndication | AdvancedATCClass | ResumeGeneric;
}

function getDisplayData(type: DataTypeEnum, item: DataBlockGenericProps["item"]): {
  link: string;
  name: string;
  details: string;
  subClasses: AdvancedATC[];
} {
  if (type === DataTypeEnum.SUBSTANCE) {
    const substance = item as ResumeSubstance;
    return {
      link: `/substances/${getSubstanceSlug([substance])}`,
      name: formatSpecName(substance.NomLib),
      details: `${substance.specialites} ${substance.specialites > 1 ? "médicaments" : "médicament"}`,
      subClasses: [],
    };
  }
  if (type === DataTypeEnum.INDICATION) {
    const indication = item as ResumeIndication;
    return {
      link: `/indications/${getIndicationSlug(indication.idIndication, indication.nomIndication)}`,
      name: formatSpecName(indication.nomIndication),
      details: `${indication.specialites} ${indication.specialites > 1 ? "médicaments" : "médicament"}`,
      subClasses: [],
    };
  }
  if (type === DataTypeEnum.ATCCLASS) {
    const atc = item as AdvancedATCClass;
    return {
      link: `/atc/${getAtcSlug(atc.class.code, atc.class.label)}`,
      name: formatSpecName(atc.class.label),
      details: `${atc.class.nbSubstances} ${atc.class.nbSubstances > 1 ? "substances actives" : "substance active"}`,
      subClasses: atc.subclasses,
    };
  }
  if (type === DataTypeEnum.MEDICAMENT) {
    const generic = item as ResumeGeneric;
    const genericGroupCode = Number(generic.SpecId);
    return {
      link: Number.isSafeInteger(genericGroupCode) && genericGroupCode > 0
        ? `/generiques/${getGenericSlug(genericGroupCode, generic.SpecName)}`
        : "#",
      name: generic.SpecName,
      details: "",
      subClasses: [],
    };
  }
  return { link: "#", name: "Autre", details: "", subClasses: [] };
}

function DataBlockGeneric({
  type,
  item,
}: DataBlockGenericProps) {

  const {
    link: currentLink,
    name: currentFormatSpecName,
    details: currentDetails,
    subClasses: currentSubClasses,
  } = getDisplayData(type, item);

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
      {(type === DataTypeEnum.ATCCLASS && currentSubClasses.length > 0) && (
          currentSubClasses.map((subclass: AdvancedATC, index) => (
          <Container 
            className={fr.cx("fr-mb-1w")}
            key={index}
          >
            <Link
              href={`/atc/${getAtcSlug(subclass.code, subclass.label)}`}
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
