"use client";

import * as Sentry from "@sentry/nextjs";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes } from "react";
import useSWR from "swr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { RcpNoticeHtmlContainer } from "../blocks/GenericBlocks";
import { getRCP } from "@/db/utils/rcp";
import { isCentralisee } from "@/utils/specialites";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import CentraliseBlock from "../blocks/CentraliseBlock";
import GoTopButton from "@/components/generic/GoTopButton";
import { formatDateNotif } from "@/utils/notices";

interface RCPProps extends HTMLAttributes<HTMLDivElement> {
  specialite?: DetailedSpecialite;
}

function RcpBlock({ specialite, ...props }: RCPProps) {
  const { data: currentRcp, isLoading } = useSWR(
    specialite ? ["rcp", specialite.SpecId] : null,
    ([, id]) => getRCP(id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      onError: (error) => Sentry.captureException(error),
    },
  );
  const loaded = Boolean(specialite) && !isLoading;

  const formattedDateNotif = formatDateNotif(currentRcp?.dateNotif);

  return (
    <>
      <h2>Résumé des caractéristiques du produit</h2>
      {currentRcp ? (
        <>
          {formattedDateNotif && (
            <Badge severity={"info"} className={fr.cx("fr-mb-4w")}>
              RCP mis à jour le {formattedDateNotif}
            </Badge>
          )}
          <RcpNoticeHtmlContainer
            dangerouslySetInnerHTML={{ __html: currentRcp.contentHtml }}
          />
        </>
      ) : loaded && specialite && isCentralisee(specialite) ? (
        <CentraliseBlock />
      ) : (
        loaded && (
          <span>
            Le résumé des caractéristiques du produit n&rsquo;est pas disponible
            pour ce médicament.
          </span>
        )
      )}
      <GoTopButton />
    </>
  );
}

export default RcpBlock;
