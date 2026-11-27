import { Metadata } from "next";
import React from "react";
import { DsfrProvider } from "@/dsfr-bootstrap";
import {
  getHtmlAttributes,
  DsfrHead,
} from "../dsfr-bootstrap/server-only-index";

import "@/customIcons/customIcons.css";
import ThemeProvider from "@/components/ThemeProvider";
import StyledComponentsRegistry from "@/components/StyledComponentsRegistry";

export const metadata: Metadata = {
  // Makes relative metadata URLs (e.g. canonical) absolute.
  // No hardcoded fallback: without the env var, URLs stay relative rather than pointing to localhost.
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(process.env.NEXT_PUBLIC_BASE_URL)
    : undefined,
  title: {
    default: "Info Médicament",
    template: "%s | Info Médicament",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <DsfrHead
          preloadFonts={[
            "Marianne-Regular",
            "Marianne-Regular_Italic",
            "Marianne-Medium",
            "Marianne-Bold",
          ]}
        />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <StyledComponentsRegistry>
            <ThemeProvider>{children}</ThemeProvider>
          </StyledComponentsRegistry>
        </DsfrProvider>
      </body>
    </html>
  );
}
