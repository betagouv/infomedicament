"use client";

import { fr } from "@codegouvfr/react-dsfr";
import React, { HTMLAttributes, PropsWithChildren } from "react";
import styled, { css } from 'styled-components';

const Container = styled.div<{ whiteContainer?: boolean }>`
  ${({ whiteContainer }) => whiteContainer && css`
    background-color: #FFF;
    border: var(--border-open-blue-france) 1px solid;
    border-radius: 8px;
  `}
`;

interface ContentContainerProps extends HTMLAttributes<HTMLDivElement> {
  fullWidth?: boolean;
  whiteContainer?: boolean; //With white background and border
}

function ContentContainer(
  {fullWidth, whiteContainer, children, ...props}: PropsWithChildren<ContentContainerProps>
) {
  let className = props.className || "";
  if(!fullWidth){
    className+= " "+fr.cx("fr-container", "fr-pt-4w", "fr-pb-8w");
  }

  return (
    <Container {...props} whiteContainer={whiteContainer} className={className}>
      {children}
    </Container>
  );
};

export default ContentContainer;
