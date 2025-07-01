"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useEffect, useState } from "react";
import { Rcp } from "@/types/MedicamentTypes";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { getContent } from "@/utils/notices/noticesUtils";
import { RcpNoticeContainer } from "../Blocks/GenericBlocks";

interface RCPProps extends HTMLAttributes<HTMLDivElement> {
  rcp?: Rcp;
}

function RcpBlock({
  rcp,
  ...props 
}: RCPProps) {

  const [currentRcp, setCurrentRcp] = useState<Rcp>();
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if(rcp) {
      setCurrentRcp(rcp);
      setLoaded(true);
    }
  }, [rcp, setCurrentRcp, setLoaded]);

  return (
    <>
      <h2>Résumé des caractéristiques du produit</h2>
      {currentRcp ? (
        <>
          {currentRcp.dateNotif && (
            <Badge severity={"info"} className={fr.cx("fr-mb-4w")}>{currentRcp.dateNotif}</Badge>
          )}
          {currentRcp.children && (
            <RcpNoticeContainer>{getContent(currentRcp.children)}</RcpNoticeContainer>
          )}
        </>
      ) : (
        loaded && (<span>Le résumé des caractéristiques du produit n&rsquo;est pas disponible pour ce médicament.</span>)
      )}
    </>
  );
};

export default RcpBlock;
