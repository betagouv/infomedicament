import Tag from "@codegouvfr/react-dsfr/Tag";
import React, { HTMLAttributes } from "react";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import "./dsfr-custom-tags.css";
import { trackEvent } from "@/services/tracking";

interface GenericTagProps extends HTMLAttributes<HTMLDivElement> {
  specGeneId: string;
  hideIcon?: boolean;
  withLink?: boolean;
  fromMedicament?: boolean;
}

function GenericTag({ 
  specGeneId,
  hideIcon,
  withLink,
  fromMedicament,
  ...props
} : GenericTagProps) {

  const onTrackEvent = () => {
    if(fromMedicament)
      trackEvent("Page médicament", "Tag Generic");
  };

  return (
    <div {...props}>
      <Tag
        iconId={!hideIcon ? "fr-icon-capsule-fill" : undefined}
        {...(withLink ? {linkProps:{
          className: cx("fr-tag--custom-alt-blue"),
          href: `/generiques/${specGeneId}`,
          target: "_blank",
          onClick: () => onTrackEvent(),
        }} : {
          nativeButtonProps: {
            className: cx("fr-tag--custom-alt-blue"),
          }
        })}
      >
        {withLink ? (
          <span>Voir les Generiques</span>
        ) : (
          <span>Generique</span>
        )}
      </Tag>
    </div>
  );
}

export default GenericTag;
