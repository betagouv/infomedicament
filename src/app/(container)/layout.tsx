import React, { Suspense } from "react";
import { DsfrProvider } from "@codegouvfr/react-dsfr/next-appdir/DsfrProvider";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import GlossaryModals from "@/components/glossary/GlossaryModals";
import GlossaryContextProvider from "@/components/glossary/GlossaryContextProvider";
import GreetingModal from "@/components/GreetingModal";
import InfoMedicamentHeader from "@/components/InfoMedicamentHeader";
import { getNoticeRcpLastUpdated } from "@/db/utils/specialities";
export default function ContainerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Start DSFR in this layout's hydration boundary, once the header is ready.
  // Starting it in the root can decorate this HTML before React hydrates it.
  return (
    <DsfrProvider lang="fr">
      <GlossaryContextProvider>
        <Notice
          title={
            <>
              {process.env.NEXT_PUBLIC_ENVIRONMENT == "production"
                ? "Ce site est actuellement en version bêta."
                : "Ceci est un environnement de test."}{" "}
              Pour les informations officielles et complètes, consultez{" "}
              <a href="https://base-donnees-publique.medicaments.gouv.fr/">
                la Base de données publique des médicaments.
              </a>
            </>
          }
        />
        <InfoMedicamentHeader />
        <main>
          {children}
        </main>
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
          accessibility="non compliant"
          accessibilityLinkProps={{
            href: "/accessibilite",
            title: "Accessibilité : non conforme",
          }}
          termsLinkProps={{
            href: "/mentions-legales",
            title: "Mentions légales",
          }}
          bottomItems={[
            {
              text: "Données",
              linkProps: {
                href: "/donnees",
              },
            },
            {
              text: "À propos",
              linkProps: {
                href: "/a-propos",
              },
            },
            {
              text: "Politique de confidentialité",
              linkProps: {
                href: "/politique-de-confidentialite",
              },
            },
            {
              text: "Statistiques",
              linkProps: {
                href: "/statistiques",
              },
            },
            headerFooterDisplayItem,
            {
              text: "Code source",
              linkProps: {
                href: `https://github.com/betagouv/infomedicament/${process.env.SOURCE_VERSION ? `commit/${process.env.SOURCE_VERSION}` : ""}`,
              },
            },
          ]}
        />
        <GlossaryModals />
        <Suspense fallback={null}>
          <GreetingWithData />
        </Suspense>
      </GlossaryContextProvider>
    </DsfrProvider>
  );
}

async function GreetingWithData() {
  const dataLastUpdated = await getNoticeRcpLastUpdated();
  return <GreetingModal dataLastUpdated={dataLastUpdated} />;
}
