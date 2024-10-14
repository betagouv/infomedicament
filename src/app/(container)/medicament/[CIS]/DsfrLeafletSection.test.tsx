import { afterEach, describe, expect, test } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import HTMLParser from "node-html-parser";

import DsfrLeafletSection from "@/app/(container)/medicament/[CIS]/DsfrLeafletSection";
import { renderServerComponent } from "@/testsUtils/renderServerComponent";

describe("DsfrLeafletSection", () => {
  afterEach(cleanup);

  test("should render a paragraph", async () => {
    const dom = HTMLParser.parse(`
        <p>Text</p>
  `);
    expect(dom.childNodes.length).toBe(3);
    await renderServerComponent(<DsfrLeafletSection data={dom.childNodes} />);
    expect(await screen.findByRole("paragraph")).toBeDefined();
  });

  test("should render headings and list and formatting", async () => {
    const dom = HTMLParser.parse(`
      <p class="AmmNoticeTitre1">Titre 1</p>
      <p class=AmmCorpsTexteGras style='margin-top:6.0pt'>Texte gras</p>
      <p class=AmmCorpsTexte>Paragraphe 1</p>
      <p class=AmmListePuces1>Liste niveau 1 item 1</p>
      <p class=AmmListePuces1>Liste niveau 1 item 2 </p>
      <p class=AmmListePuces2>Liste niveau 2 item 2.1</p>
      <p class=AmmListePuces2>Liste niveau 2 item 2.2</p>
      <p class=AmmListePuces1>Liste niveau 1 item 3</p>
      <p class="AmmNoticeTitre1">Titre 2</p>
      <p class=AmmCorpsTexte>Paragraphe 2</p>
    `);
    await renderServerComponent(<DsfrLeafletSection data={dom.childNodes} />);
    expect(await screen.findAllByRole("list")).toHaveLength(2); // list and sublist
    const [topLvlList, lvlTwoList] = await screen.findAllByRole("list");
    expect(await within(topLvlList).findAllByRole("listitem")).toHaveLength(5);
    expect(await within(lvlTwoList).findAllByRole("listitem")).toHaveLength(2);
    expect(await screen.findAllByRole("heading")).toHaveLength(2);
    expect(await screen.findAllByRole("paragraph")).toHaveLength(3);
  });
});
