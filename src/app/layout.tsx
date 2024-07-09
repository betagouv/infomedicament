import Link from "next/link";
import { getHtmlAttributes } from "@codegouvfr/react-dsfr/next-appdir/getHtmlAttributes";
import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { Header } from "@codegouvfr/react-dsfr/Header";

import { defaultColorScheme } from "@/app/defaultColorScheme";
import { StartDsfr } from "@/app/StartDsfr";
import { fr } from "@codegouvfr/react-dsfr";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = "fr";
  return (
    <html {...getHtmlAttributes({ defaultColorScheme, lang })}>
      <head>
        <StartDsfr />
        <DsfrHead Link={Link} />
      </head>
      <body>
        <DsfrProvider lang={lang}>
          <Header
            brandTop={
              <>
                MINISTÈRE
                <br />
                DU TRAVAIL
                <br />
                DE LA SANTÉ
                <br />
                ET DES SOLIDARITÉS
              </>
            }
            homeLinkProps={{
              href: "/",
              title:
                "Accueil - Ministère du travail de la santé et des solidarités",
            }}
            navigation={
              <p className={fr.cx("fr-my-3v")}>
                La référence officielle sur les données des médicaments
              </p>
            }
          />
          {children}
        </DsfrProvider>
      </body>
    </html>
  );
}
