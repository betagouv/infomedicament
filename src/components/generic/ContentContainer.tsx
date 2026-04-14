"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { HTMLAttributes, PropsWithChildren, ReactNode, useEffect, useState } from "react";
import styled, { css } from 'styled-components';

const Container = styled.div<{ 
  $isDark: boolean;
  $whiteContainer?: boolean;
  $mobileOverflowX?: boolean;
}> `
  ${props => props.$whiteContainer && css`
    background-color: ${props.$isDark ? 'var(--background-default-grey)' : '#FFF'};
    border: var(--border-open-blue-france) 1px solid;
    border-radius: 8px;
  `}
  ${props => props.$mobileOverflowX && css`
    @media (max-width: 48em) {
      overflow-x: auto;
    }
  `}
`;

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  frContainer?: boolean;
  whiteContainer?: boolean; //With white background and border
  mobileOverflowX?: boolean; //Add overflow-x: auto; on mobile mode
}

function ContentContainer({
  frContainer,
  whiteContainer,
  mobileOverflowX,
  children,
  ...props
}: PropsWithChildren<ContentContainerProps>) {
  
  const { isDark } = useIsDark();
  const [currentFrContainer, setCurrentFrContainer] = useState<boolean>(false);
  const [currentWhiteContainer, setCurrentWhiteContainer] = useState<boolean>(false);
  const [currentChildren, setCurrentChildren] = useState<ReactNode>();
  const [currentClassName, setCurrentClassName] = useState<string>();

  useEffect(() => {
    if(frContainer) setCurrentFrContainer(frContainer);
  }, [frContainer, setCurrentFrContainer]);
  useEffect(() => {
    if(whiteContainer) setCurrentWhiteContainer(whiteContainer);
  }, [whiteContainer, setCurrentWhiteContainer]);
  useEffect(() => {
    if(children) setCurrentChildren(children);
  }, [children, setCurrentChildren]);

  useEffect(() => {
    let className = props.className || "";
    if(currentFrContainer){
      className+= " "+fr.cx("fr-container", "fr-pt-1w", "fr-pb-2w");
    }
    setCurrentClassName(className);
  }, [props, currentFrContainer, setCurrentClassName]);

  return (
    <Container 
      {...props} 
      $isDark={isDark} 
      $whiteContainer={currentWhiteContainer} 
      $mobileOverflowX={mobileOverflowX} 
      className={currentClassName}
    >
      {currentChildren}
    </Container>
  );
};

export default ContentContainer;
