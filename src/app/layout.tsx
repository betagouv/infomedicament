import Link from "next/link";
import { Metadata } from "next";
import React from "react";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";

import { defaultColorScheme } from "@/app/defaultColorScheme";
import { StartDsfr } from "@/app/StartDsfr";

import "@/customIcons/customIcons.css";
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Info Médicament",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = "fr";
  return (
    <ThemeProvider>
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead
          Link={Link}
          preloadFonts={[
            "Marianne-Regular",
            "Marianne-Medium",
            "Marianne-Bold",
          ]}
        />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <MuiDsfrThemeProvider>
            {children}
          </MuiDsfrThemeProvider>
        </DsfrProvider>
      </body>
    </html></ThemeProvider>
  );
}
