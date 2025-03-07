import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren } from "react";

interface TagContainerProps extends HTMLAttributes<HTMLDivElement> {
  category?: string;
  hideSeparator?: boolean;
}

async function TagContainer({category, hideSeparator, ...props}: PropsWithChildren<TagContainerProps>) {
  return (
    <div {...props}>
      {category && 
        <div style={{
          color: "var(--text-title-blue-france)",
          fontWeight: "bold",
          fontSize: "14px",
          textTransform: "uppercase",
        }}>
          {category}
        </div>
      }
      {props.children}
      {!hideSeparator && <hr className={fr.cx("fr-pb-1w", "fr-mt-1w")}/>}
    </div>
  );
};

export default TagContainer;
