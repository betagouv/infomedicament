"use client";
import Hotjar from "@hotjar/browser";
import { useEffect } from "react";

const siteId: `${number}` | undefined = process.env
  .NEXT_PUBLIC_HOTJAR_SITE_ID as `${number}` | undefined;
const hotjarVersion = 6;

export function StartHotjar() {
  useEffect(() => {
    if (siteId) {
      Hotjar.init(Number(siteId), hotjarVersion);
    }
  });

  return null;
}
