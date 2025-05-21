import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren } from "react";
import styled from 'styled-components';

interface TagContainerProps extends HTMLAttributes<HTMLDivElement> {
  category?: string;
  hideSeparator?: boolean;
}

const CategoryContainer = styled.div `
  color: var(--text-title-blue-france);
  font-weight: bold;
  font-size: 14px;
  text-transform: uppercase;
`;


function TagContainer({category, hideSeparator, ...props}: PropsWithChildren<TagContainerProps>) {
  return (
    <div {...props}>
      {category && 
        <CategoryContainer style={{
        }}>
          {category}
        </CategoryContainer>
      }
      {props.children}
      {!hideSeparator && <hr className={fr.cx("fr-pb-1w", "fr-mt-1w")}/>}
    </div>
  );
};

export default TagContainer;
