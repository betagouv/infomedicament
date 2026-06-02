"use client";

import { HTMLAttributes } from "react";
import ContentContainer from "@/components/generic/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import ShareButtons from "@/components/generic/ShareButtons";
import SwitchNoticeAdvancedBlock from "./SwitchNoticeAdvancedBlock";

interface DesktopTitleBlockProps extends HTMLAttributes<HTMLDivElement> {
  title: string,
  isAdvanced: boolean,
  onGoToAdvanced: (advanced: boolean) => void;
}

function DesktopTitleBlock({
  title,
  isAdvanced,
  onGoToAdvanced,
  ...props
}: DesktopTitleBlockProps ) {

  return (
    <ContentContainer whiteContainer className={[props.className, fr.cx("fr-mb-2w", "fr-p-2w", "fr-hidden", "fr-unhidden-md")].join(" ")}>
      <h1 className={fr.cx("fr-h2")}>
        {title}
      </h1>
      <ShareButtons
        pageName={title}
        alignRight
      />
      <SwitchNoticeAdvancedBlock
        isAdvanced={isAdvanced}
        onGoToAdvanced={onGoToAdvanced}
      />
    </ContentContainer>
  );
};

export default DesktopTitleBlock;
