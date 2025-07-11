"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, PropsWithChildren, ReactNode, useEffect, useState } from "react";
import styled from 'styled-components';

interface TagContainerProps extends HTMLAttributes<HTMLDivElement> {
  category?: string;
  hideSeparator?: boolean;
}

const CategoryContainer = styled.div `
  color: var(--text-mention-grey);
  font-size: 14px;
`;


function TagContainer({
  category, 
  hideSeparator, 
  ...props}: PropsWithChildren<TagContainerProps>
) {

  const [currentCategory, setCurrentCategory] = useState<string>("");
  const [currentHideSeparator, setCurrentHideSeparator] = useState<boolean>(false);
  const [currentChildren, setCurrentChildren] = useState<ReactNode>();

  useEffect(() => {
    if(category) setCurrentCategory(category);
  }, [category, setCurrentCategory]);

  useEffect(() => {
    if(hideSeparator) setCurrentHideSeparator(hideSeparator);
  }, [hideSeparator, setCurrentHideSeparator]);

  useEffect(() => {
    if(props.children) setCurrentChildren(props.children);
  }, [props, setCurrentChildren]);

  return currentChildren && (
    <div {...props}>
      {currentCategory && 
        <CategoryContainer>
          {currentCategory}
        </CategoryContainer>
      }
      {currentChildren}
      {!currentHideSeparator && <hr className={fr.cx("fr-pb-1w", "fr-mt-1w")}/>}
    </div>
  );
};

export default TagContainer;
