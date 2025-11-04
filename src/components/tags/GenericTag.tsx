import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";

interface GenericTagProps extends HTMLAttributes<HTMLDivElement> {
  specGeneId: string;
  hideIcon?: boolean;
  fromMedicament?: boolean;
}

function GenericTag({ 
  specGeneId,
  hideIcon,
  fromMedicament,
} : GenericTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Generic");
  };

  return (
    <div>
      <Tag
        iconId={!hideIcon ? "fr-icon-capsule-fill" : undefined}
        linkProps={{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${specGeneId}`,
          target: "_blank",
          onClick: () => onTrackEvent(),
        }}
      >
        Voir les Génériques
      </Tag>{" "}
    </div>
  );
}

export default GenericTag;
