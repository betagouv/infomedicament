"use client";
import Hotjar from "@hotjar/browser";

const siteId: `${number}` | undefined = process.env
  .NEXT_PUBLIC_HOTJAR_SITE_ID as `${number}` | undefined;
const hotjarVersion = 6;

if (siteId) {
  Hotjar.init(Number(siteId), hotjarVersion);
}

export function StartHotjar() {
  return null;
}
