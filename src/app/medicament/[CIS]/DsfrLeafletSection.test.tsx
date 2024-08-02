import { Suspense } from "react";
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import HTMLParser from "node-html-parser";
import DsfrLeafletSection from "@/app/medicament/[CIS]/DsfrLeafletSection";

test("DsfrLeafletSection", async () => {
  const dom = HTMLParser.parse(`
    <html>
        <p>Text</p>
    </html>
  `);
  expect(dom.childNodes.length).toBe(3);
  render(
    <Suspense>
      <DsfrLeafletSection data={dom.childNodes} />
    </Suspense>,
  );
  expect(await screen.findByRole("paragraph", { level: 1 })).toBeDefined();
});
