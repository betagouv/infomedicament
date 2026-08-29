"use client";
import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { Specialite } from "@/db/pdbmMySQL/types";
import DataBlockGenericIcons from "./DataBlockGenericIcons";

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
const GenericMain = styled.div`
  display: flex;
`;
//from DSFR
const GenericName = styled.span`
  background-image: var(--underline-img), var(--underline-img);
  background-position: var(--underline-x) 100%, var(--underline-x) calc(100% - var(--underline-thickness));
  background-repeat: no-repeat, no-repeat;
  background-size: var(--underline-hover-width) calc(var(--underline-thickness) * 2), var(--underline-idle-width) var(--underline-thickness);
  transition: background-size;
`;
const GenericDetails = styled.div`
  color: var(--text-mention-grey);
  font-style: italic;
`;

interface DataBlockSpecGeneriqueProps extends HTMLAttributes<HTMLDivElement> {
  specialite: Specialite;
  isSurveillanceRenforcee?: boolean;
}

function DataBlockSpecGenerique({
  specialite,
  isSurveillanceRenforcee,
}: DataBlockSpecGeneriqueProps) {
  
  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <Link
        href={`/medicaments/${specialite.SpecId}`}
        className={["result-link", "fr-link", fr.cx("fr-p-1w")].join(" ")}
      >
        <GenericMain>
          <GenericName
            className={fr.cx("fr-link")}
          >
            {formatSpecName(specialite.SpecDenom01)}
          </GenericName>
          <DataBlockGenericIcons
            specialite={specialite}
            isSurveillanceRenforcee={isSurveillanceRenforcee}
          />
        </GenericMain>
        {specialite.Een && (
          <GenericDetails className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-1-5v")}>
            Excipient(s) à effet notoire : {specialite.Een}
          </GenericDetails>
        )}
      </Link>
    </Container>
  );
};

export default DataBlockSpecGenerique;
