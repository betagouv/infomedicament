import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { Header } from "@codegouvfr/react-dsfr/Header";
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
              <Header
                brandTop={
                  <>
                    RÉPUBLIQUE
                    <br />
                    FRANÇAISE
                  </>
                }
                homeLinkProps={{
                  href: "/",
                  title:
                    "Accueil - Ministère du travail de la santé et des solidarités",
                }}
                operatorLogo={{
                  alt: "Info Médicament",
                  imgUrl: "/logo.svg",
                  orientation: "horizontal",
                }}
                serviceTitle="" // hack pour que la tagline soit bien affichée
                serviceTagline="La référence officielle sur les données des médicaments"
                quickAccessItems={[headerFooterDisplayItem]}
                navigation={[
                  { text: "Accueil", linkProps: { href: "/" } },
                  {
                    text: "Glossaire",
                    linkProps: { href: "/glossaire/A" },
                  },
                  {
                    text: "Parcourir",
                    menuLinks: atcs.map((atc) => ({
                      linkProps: { href: `/atc/${atc.code}` },
                      text: atc.label,
                    })),
                  },
                  {
                    text: "Par ordre alphabétique",
                    menuLinks: [
                      {
                        text: "Tous les médicaments",
                        linkProps: { href: "/medicaments/A/1" },
                      },
                      {
                        text: "Toutes les substances",
                        linkProps: { href: "/substances/A" },
                      },
                      {
                        text: "Toutes les pathologies",
                        linkProps: { href: "/pathologies/A" },
                      },
                      {
                        text: "Tous les groupes génériques",
                        linkProps: { href: "/generiques/A" },
                      },
                    ],
                  },
                  {
                    text: "Articles",
                    linkProps: { href: "/articles" },
                  },
                ]}
              />
              {children}
              <Footer
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
