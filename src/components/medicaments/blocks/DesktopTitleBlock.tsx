"use client";

import { HTMLAttributes } from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import ShareButtons from "@/components/generic/ShareButtons";
import SwitchNoticeAdvancedBlock from "./SwitchNoticeAdvancedBlock";
import { SkeletonLine } from "@/components/generic/Skeleton";

interface DesktopTitleBlockProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  loading?: boolean;
  isAdvanced: boolean;
  onGoToAdvanced: (advanced: boolean) => void;
}

function DesktopTitleBlock({
  title,
  loading = false,
  isAdvanced,
  onGoToAdvanced,
  ...props
}: DesktopTitleBlockProps) {
  return (
    <ContentContainer
      whiteContainer
      className={[
        props.className,
        fr.cx("fr-mb-2w", "fr-p-2w", "fr-hidden", "fr-unhidden-md"),
      ].join(" ")}
    >
      <h1 className={fr.cx("fr-h2")}>
        {title ?? (
          <>
            <SkeletonLine height="2rem" />
            <span className={fr.cx("fr-mt-1w")} style={{ display: "block" }}>
              <SkeletonLine width="70%" height="2rem" />
            </span>
          </>
        )}
      </h1>
      <ShareButtons pageName={title} alignRight disabled={loading || !title} />
      <SwitchNoticeAdvancedBlock
        isAdvanced={isAdvanced}
        disabled={loading}
        onGoToAdvanced={onGoToAdvanced}
      />
    </ContentContainer>
  );
}

export default DesktopTitleBlock;
