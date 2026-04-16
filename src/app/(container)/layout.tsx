import React, { Suspense } from "react";
import { Footer } from "@codegouvfr/react-dsfr/Footer";
import { Notice } from "@codegouvfr/react-dsfr/Notice";
import { headerFooterDisplayItem } from "@codegouvfr/react-dsfr/Display";
import { StartHotjar } from "@/app/StartHotjar";
import GlossaryModals from "@/components/glossary/GlossaryModals";
import GlossaryContextProvider from "@/components/glossary/GlossaryContextProvider";
import GreetingModal from "@/components/GreetingModal";
import { getNoticeRcpLastUpdated } from "@/db/utils/specialities";
import Matomo from "@/components/Matomo";
import {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
} from "@/consentManagement";

export default async function ContainerLayout({
  children,
  header,
}: Readonly<{
  children: React.ReactNode;
  header: React.ReactNode;
}>) {
  const dataLastUpdated = await getNoticeRcpLastUpdated();
  return (
    <GlossaryContextProvider>
      {process.env.NEXT_PUBLIC_HOTJAR_SITE_ID && <StartHotjar />}
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
      <ConsentBannerAndConsentManagement />
      {header}
      <main>
        {children}
        <div className="hotjar-feedback" />
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
        accessibility={"non compliant"}
        termsLinkProps={{
          href: "/mentions-legales",
          title: "Mentions légales",
        }}
        bottomItems={[
          <FooterPersonalDataPolicyItem key={"dp"} />,
          <FooterConsentManagementItem key={"fc"} />,
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
        <Matomo />
      </Suspense>
      <GreetingModal dataLastUpdated={dataLastUpdated} />
    </GlossaryContextProvider>
  );
}
