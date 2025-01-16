"use client";

import { createConsentManagement } from "@codegouvfr/react-dsfr/consentManagement";

export const {
  ConsentBannerAndConsentManagement,
  FooterConsentManagementItem,
  FooterPersonalDataPolicyItem,
  useConsent,
} = createConsentManagement({
  finalityDescription: () => ({
    analytics: {
      title: "Amélioration du service",
      description:
        "Nous utilisons des cookies pour mesurer l’audience de notre site, recueillir les retours des utilisateurs, et améliorer son contenu.",
    },
  }),
  personalDataPolicyLinkProps: {
    href: "/politique-de-confidentialite",
  },
  consentCallback: async ({ finalityConsent, finalityConsent_prev }) => {
    if (finalityConsent.analytics) {
    } else if (finalityConsent_prev?.analytics && !finalityConsent.analytics) {
      location.reload();
    }
  },
});
