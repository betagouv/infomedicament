"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import init, { push } from "@socialgouv/matomo-next";

//github.com/SocialGouv/mda/pull/286/commits/04490c0f0cdcf1c73079e1de81ab4b1ef107ae25
export default function Matomo() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [inited, setInited] = useState(false);
  const [previousPath, setPreviousPath] = useState("");

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_MATOMO_ENVIRONMENT === "production" &&
      !inited
    ) {
      init({
        url: process.env.NEXT_PUBLIC_MATOMO_URL as string,
        siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID as string,
        onInitialization: () => {
          push(["enableHeartBeatTimer"]);
          push(["disableQueueRequest"]);
        },
      });
      setInited(true);
    }
  }, [inited]);

  /**
   * The @socialgouv/matomo-next does not work with next 13
   */
  useEffect(() => {
    if (!pathname) {
      return;
    }

    if (!previousPath) {
      return setPreviousPath(pathname);
    }

    push(["setReferrerUrl", `${previousPath}`]);
    push(["setCustomUrl", pathname]);
    push(["deleteCustomVariables", "page"]);
    setPreviousPath(pathname);
    // In order to ensure that the page title had been updated,
    // we delayed pushing the tracking to the next tick.
    setTimeout(() => {
      push(["setDocumentTitle", document.title]);
      if (pathname.startsWith("/recherche")) {
        push(["trackSiteSearch", searchParams?.get("keyword") ?? ""]);
      } else {
        push(["trackPageView"]);
      }
    });
    /**
     * This is because we don't want to track previousPath
     * could be a if (previousPath === pathname) return; instead
     * But be sure to not send the tracking twice
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return <></>;
}
