"use client";

import React from 'react';
import { createGlobalStyle } from 'styled-components';

export const AppGlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
  @media only screen and (max-width: 768px) {
    html {
      scroll-behavior: auto;
    }
  }
`;

function ThemeProvider({ children }: { children: React.ReactNode }) {

  return (
    <>
      <AppGlobalStyle />
      {children}
    </>
  );
}
export default ThemeProvider;
