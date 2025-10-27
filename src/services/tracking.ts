"use client";

import { init, push } from '@socialgouv/matomo-next';
import { useEffect } from 'react';
import * as Sentry from "@sentry/nextjs";

const trackingConfig = {
  matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
  matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
};

// prevent the double init effect due to strict mode
let hookInitialized = false;

// Register tracking tool - only Matomo for now
export const useTracking = () => {
  useEffect(() => {
    if (!hookInitialized && trackingConfig.matomoServerURL && trackingConfig.matomoSiteId) {
      hookInitialized = true;

      init({
        url: trackingConfig.matomoServerURL,
        siteId: trackingConfig.matomoSiteId,
        disableCookies: true,
        onScriptLoadingError() {
          Sentry.captureException('Error loading Matomo');
          console.log('Error loading Matomo');
        },
      });
    }
  }, []);
};

export const trackSearchEvent = (keyword: string) => {
  if (!keyword) {
    return;
  }
  push(['trackSiteSearch', keyword]);
};

export const trackEvent = (category: string, action: string) => {
  push(['trackSiteSearch', category, action]);
};
