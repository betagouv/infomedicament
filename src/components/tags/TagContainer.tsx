"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, ReactNode, useEffect, useState } from "react";
import styled, { css } from 'styled-components';

interface TagContainerProps extends HTMLAttributes<HTMLDivElement> {
  category?: string;
  hideSeparator?: boolean;
  inLine?: boolean;
}

const CategoryContainer = styled.div`
  color: var(--text-mention-grey);
`;

const ContentContainer = styled.div<{ $inLine?: boolean; }>`
  ${props => props.$inLine && css`  
    display: inline-flex;
    align-items: center;
    column-gap: 0.5rem;
  `}
`;

function TagContainer({
  category,
  hideSeparator,
  inLine,
  ...props
}: PropsWithChildren<TagContainerProps>) {

  const [currentChildren, setCurrentChildren] = useState<ReactNode>();

  useEffect(() => {
    if(props.children) setCurrentChildren(props.children);
  }, [props, setCurrentChildren]);

  return currentChildren && (
    <div {...props}>
      <ContentContainer $inLine={inLine}>
        {category && 
          <CategoryContainer className={fr.cx("fr-text--sm", "fr-mb-0")}>
            {category}
          </CategoryContainer>
        }
        {currentChildren}
      </ContentContainer>
      {!hideSeparator && <hr className={fr.cx("fr-pb-1w", "fr-mt-1w")}/>}
    </div>
  );
};

export default TagContainer;
