"use client";

import React from 'react';
import { createGlobalStyle } from 'styled-components';

export const AppGlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }
  @media (max-width: 48em) {
    html {
      scroll-behavior: auto;
    }
    .mobile-display-contents{
      display: contents;
    }
  }

  .go-top-button{
    float: right;
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 20;
  }
  .scroll-m-150 {
    scroll-margin: 150px !important;
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
