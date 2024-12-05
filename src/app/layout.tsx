import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Notice } from "@codegouvfr/react-dsfr/Notice";

import { defaultColorScheme } from "@/app/defaultColorScheme";
import { StartDsfr } from "@/app/StartDsfr";

import "@/customIcons/customIcons.css";
import "@/components/dsfr-custom-alt.css";
import MuiDsfrThemeProvider from "@codegouvfr/react-dsfr/mui";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { StartHotjar } from "@/app/StartHotjar";
import GlossaryModals from "@/components/glossary/GlossaryModals";
import GlossaryContextProvider from "@/components/glossary/GlossaryContextProvider";
import GreetingModal from "@/components/GreetingModal";
import Matomo from "@/components/Matomo";

export const metadata: Metadata = {
  title: "Info Médicament",
};

export default async function RootLayout({
  children,
  header,
}: Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
}>) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        {process.env.NEXT_PUBLIC_HOTJAR_SITE_ID && <StartHotjar />}
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
        <Notice
          title={
            <>
              {process.env.NEXT_PUBLIC_ENVIRONMENT == "production"
                ? "Ce site est actuellement en version bêta et contient les données de 500 médicaments."
                : "Ceci est un environnement de test."}{" "}
              Pour les informations officielles et complètes, consultez{" "}
              <a href="https://base-donnees-publique.medicaments.gouv.fr/">
                la Base de données publique des médicaments.
              </a>
            </>
          }
        />
        <DsfrProvider lang={lang}>
          <MuiDsfrThemeProvider>
            <GlossaryContextProvider>
              {header}
              {children}
              <Footer
                brandTop={
                  <>
                    RÉPUBLIQUE
                    <br />
                    FRANÇAISE
                  </>
                }
                homeLinkProps={{
                  href: "/",
                  title: "Accueil",
                }}
                accessibility={"non compliant"}
                bottomItems={[headerFooterDisplayItem]}
              />
              <Suspense fallback={null}>
                <GlossaryModals />
              </Suspense>
              <Suspense fallback={null}>
                <Matomo />
              </Suspense>
              <GreetingModal />
            </GlossaryContextProvider>
          </MuiDsfrThemeProvider>
        </DsfrProvider>
      </body>
    </html>
  );
}
