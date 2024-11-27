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
import { getAtc } from "@/data/grist/atc";
import { StartHotjar } from "@/app/StartHotjar";
import GlossaryModals from "@/components/glossary/GlossaryModals";
import GlossaryContextProvider from "@/components/glossary/GlossaryContextProvider";
import GreetingModal from "@/components/GreetingModal";
import Matomo from "@/components/Matomo";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Info Médicament",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const atcs = await getAtc();
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        {process.env.NEXT_PUBLIC_HOTJAR_SITE_ID && <StartHotjar />}
        <StartDsfr />
        <DsfrHead Link={Link} />
      </head>
      <body>
        {!process.env.NEXT_PUBLIC_DISABLE_WARNING && (
          <Notice
            title={
              <>
                Ceci est un environnement de test. Consultez{" "}
                <a href={"https://base-donnees-publique.medicaments.gouv.fr/"}>
                  la base de données publique des médicaments
                </a>{" "}
                pour les informations officielles.
              </>
            }
          />
        )}
        <DsfrProvider lang={lang}>
          <MuiDsfrThemeProvider>
            <GlossaryContextProvider>
              <Header atcs={atcs} />
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
