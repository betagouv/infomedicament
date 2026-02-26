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
const Details = styled.div`
  color: var(--text-mention-grey);
  font-style: italic;
`;

interface DataBlockSpecGeneriqueProps extends HTMLAttributes<HTMLDivElement> {
  generique: Specialite;
  isSurveillanceRenforcee?: boolean;
}

function DataBlockSpecGenerique({
  generique,
  isSurveillanceRenforcee,
}: DataBlockSpecGeneriqueProps) {
  
  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <Link
        href={`/medicaments/${generique.SpecId}`}
        className={["result-link", fr.cx("fr-p-1w")].join(" ")}
      >
        <Link
          href={`/medicaments/${generique.SpecId}`}
          className={fr.cx("fr-link")}
        >
          {formatSpecName(generique.SpecDenom01)}
        </Link>
        <DataBlockGenericIcons
          specialite={generique}
          isSurveillanceRenforcee={isSurveillanceRenforcee}
        />
        {generique.Een && (
          <Details className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-1-5v")}>
            Excipient(s) à effet notoire : {generique.Een}
          </Details>
        )}
      </Link>
    </Container>
  );
};

export default DataBlockSpecGenerique;
