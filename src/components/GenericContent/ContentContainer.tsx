import { fr } from "@codegouvfr/react-dsfr";
import React, { HTMLAttributes, PropsWithChildren } from "react";

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean;
}

async function ContentContainer(props: PropsWithChildren<ContentContainerProps>) {
  const {fullWidth, ...rest} = props;
  return (
    <div className={!fullWidth ? fr.cx("fr-container", "fr-pt-4w", "fr-pb-8w") : ''} {...props}>
      {props.children}
    </div>
  );
};

export default ContentContainer;
