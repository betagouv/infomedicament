"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { HTMLAttributes, PropsWithChildren } from "react";
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
  whiteContainer?: boolean; // White background + border
  mobileOverflowX?: boolean; //Add overflow-x: auto; on mobile mode
}

function ContentContainer({
  frContainer,
  whiteContainer,
  mobileOverflowX,
  children,
  className,
  ...props
}: PropsWithChildren<ContentContainerProps>) {
  const { isDark } = useIsDark();

  const combinedClassName = [
    frContainer ? fr.cx("fr-container", "fr-pt-1w", "fr-pb-2w") : "",
    className ?? "",
  ].filter(Boolean).join(" ");

  return (
    <Container 
      {...props} 
      $isDark={isDark} 
      $whiteContainer={whiteContainer} 
      $mobileOverflowX={mobileOverflowX} 
      className={combinedClassName}
    >
      {children}
    </Container>
  );
};

export default ContentContainer;
