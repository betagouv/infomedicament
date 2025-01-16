"use client";
import Hotjar from "@hotjar/browser";
import { useEffect } from "react";
import { useConsent } from "@/consentManagement";

const siteId: `${number}` | undefined = process.env
  .NEXT_PUBLIC_HOTJAR_SITE_ID as `${number}` | undefined;
const hotjarVersion = 6;

export function StartHotjar() {
  const { finalityConsent } = useConsent({
    consentCallback: async ({ finalityConsent, finalityConsent_prev }) => {
      if (!finalityConsent_prev?.analytics && finalityConsent.analytics) {
        Hotjar.init(Number(siteId), hotjarVersion);
      }
    },
  });

  useEffect(() => {
    if (siteId && finalityConsent?.analytics) {
      Hotjar.init(Number(siteId), hotjarVersion);
    }
  }, [finalityConsent]);

  return null;
}
