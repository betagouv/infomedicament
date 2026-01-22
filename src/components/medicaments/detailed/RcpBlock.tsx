"use client";

import * as Sentry from "@sentry/nextjs";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { RcpData } from "@/types/SpecialiteTypes";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { getContent } from "@/utils/notices/noticesUtils";
import { RcpNoticeContainer } from "../blocks/GenericBlocks";
import { getRCP } from "@/db/utils/rcp";
import { isCentralisee } from "@/utils/specialites";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import CentraliseBlock from "../blocks/CentraliseBlock";

interface RCPProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
}

function RcpBlock({
  specialite,
  ...props 
}: RCPProps) {

  const [currentSpec, setCurrentSpec] = useState<DetailedSpecialite>();
  const [currentRcp, setCurrentRcp] = useState<RcpData>();
  const [loaded, setLoaded] = useState<boolean>(false);

  const loadRCP = useCallback(
    async (
      spec: DetailedSpecialite,
    ) => {
      try {
        if(!isCentralisee(spec)) {
          const newNotice = await getRCP(spec.SpecId);
          setCurrentRcp(newNotice);
        }
        setLoaded(true);
      } catch (e) {
        Sentry.captureException(e);
      }
    }, [setCurrentRcp]
  );

  useEffect(() => {
    if(specialite) {
      setCurrentSpec(specialite)
      loadRCP(specialite);
    }
  }, [specialite, setCurrentSpec, loadRCP]);

  return (
    <>
      <h2>Résumé des caractéristiques du produit</h2>
      {(currentSpec && isCentralisee(currentSpec)) ? (
          <CentraliseBlock
            pdfURL={currentSpec.urlCentralise ? currentSpec.urlCentralise : undefined}
          />
        ) : currentRcp ? (
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
