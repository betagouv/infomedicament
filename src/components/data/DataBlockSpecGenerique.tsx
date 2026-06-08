"use client";
import Link from "next/link";
import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { Specialite } from "@/db/pdbmMySQL/types";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
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
  specialite: Specialite | DetailedSpecialite;
  isSurveillanceRenforcee?: boolean;
}

function DataBlockSpecGenerique({
  specialite,
  isSurveillanceRenforcee,
}: DataBlockSpecGeneriqueProps) {
  const id = 'cis' in specialite ? specialite.cis : specialite.SpecId;
  const name = 'denomination' in specialite ? (specialite.denomination ?? '') : specialite.SpecDenom01;
  const een = 'Een' in specialite ? specialite.Een : undefined;

  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <Link
        href={`/medicaments/${id}`}
        className={["result-link", fr.cx("fr-p-1w")].join(" ")}
      >
        <Link
          href={`/medicaments/${id}`}
          className={fr.cx("fr-link")}
        >
          {formatSpecName(name)}
        </Link>
        <DataBlockGenericIcons
          specialite={specialite}
          isSurveillanceRenforcee={isSurveillanceRenforcee}
        />
        {een && (
          <Details className={fr.cx("fr-text--sm", "fr-mb-0", "fr-mt-1-5v")}>
            Excipient(s) à effet notoire : {een}
          </Details>
        )}
      </Link>
    </Container>
  );
};

export default DataBlockSpecGenerique;
