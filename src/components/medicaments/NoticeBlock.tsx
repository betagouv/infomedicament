"use client";

import ContentContainer from "../generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, useState, useEffect } from "react";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { Notice } from "@/types/MedicamentTypes";
import useSWR from "swr";
import { Definition } from "@/types/GlossaireTypes";
import { fetchJSON } from "@/utils/network";
import { getContent } from "@/utils/notices/noticesUtils";
import { RcpNoticeContainer } from "./Blocks/GenericBlocks";

interface NoticeProps extends HTMLAttributes<HTMLDivElement> {
  notice?: Notice;
}

function NoticeBlock({
  notice,
  ...props
}: PropsWithChildren<NoticeProps>) {

  const [currentNotice, setCurrentNotice] = useState<Notice>();
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if(notice) {
      setCurrentNotice(notice);
      setLoaded(true);
    }
  }, [notice, setCurrentNotice, setLoaded]);

  const { data: definitions } = useSWR<Definition[]>(
    `/glossaire/definitions`,
    fetchJSON,
    { onError: (err) => console.warn('errorDefinitions >>', err), }
  );

  return (
    <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")}>
      <article>
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
          <div className={fr.cx("fr-mb-4w")} style={{display: "flex", justifyContent: "space-between", alignItems: "center", }}>
            <div style={{display: "flex"}}>
              <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
              <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>
                <span className={fr.cx("fr-hidden-md")}>Notice</span>
                <span className={fr.cx("fr-hidden", "fr-unhidden-md")}>Notice complète</span>
              </h2>
            </div>
            {(currentNotice && currentNotice.dateNotif) && (
              <Badge severity={"info"}>{currentNotice.dateNotif}</Badge>
            )}
          </div>
          {(currentNotice && currentNotice.children) ? (
            <RcpNoticeContainer>{getContent(currentNotice.children, definitions)}</RcpNoticeContainer>
          ) : (
            loaded && (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
          )}
        </ContentContainer>
      </article>
    </ContentContainer>
  );
};

export default NoticeBlock;
