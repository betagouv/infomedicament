"use client";

import Tag from "@codegouvfr/react-dsfr/Tag";
import { HTMLAttributes } from "react";
import "./dsfr-custom-tags.css";
import { StockStatusID } from "@/types/StockTypes";

interface StockTagProps extends HTMLAttributes<HTMLDivElement> {
  statusId: StockStatusID;
}

function StockTag({ 
  statusId
}: StockTagProps) {

  return (
    <Tag
      style={{
        backgroundColor: 
          statusId === StockStatusID.RUPTURE 
            ? "var(--pink-tuile-sun-425-moon-750)"
            : statusId === StockStatusID.TENSION
              ? "var(--orange-terre-battue-925-125-active)"
              : statusId === StockStatusID.ARRET
                ? "var(--green-tilleul-verveine-850-200)"
                : "var(--yellow-tournesol-925-125)"
        ,
        color: statusId === StockStatusID.RUPTURE ? "#ffffff" : undefined
      }}
    >
      {statusId === StockStatusID.RUPTURE && (
        <>Rupture de stock</>
      )}
      {statusId === StockStatusID.TENSION && (
        <>Tension d'approvisionnement</>
      )}
      {statusId === StockStatusID.ARRET && (
        <>Arrêt de commercialisation</>
      )}
      {statusId === StockStatusID.DISPO && (
        <>Remise à disposition</>
      )}
    </Tag>
  );
}

export default StockTag;
