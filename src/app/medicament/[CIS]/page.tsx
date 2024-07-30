import { cache } from "react";
import { Metadata, ResolvingMetadata } from "next";
import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import fs from "node:fs/promises";
import path from "node:path";
import JSZIP from "jszip";
// @ts-ignore
import * as windows1252 from "windows-1252";
import HTMLParser, { HTMLElement } from "node-html-parser";

import {
  db,
  PresInfoTarif,
  SpecComposant,
  SpecDelivrance,
  SpecElement,
  Specialite,
  SubstanceNom,
} from "@/database";

import liste_CIS_MVP from "./liste_CIS_MVP.json";
import DsfrLeafletSection from "@/app/medicament/[CIS]/DsfrLeafletSection";
import { isHtmlElement } from "@/app/medicament/[CIS]/leafletUtils";
import { formatSpecName } from "@/formatUtils";

export async function generateMetadata(
  { params: { CIS } }: { params: { CIS: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const name = formatSpecName(
    (await getSpecialite(CIS)).specialite.SpecDenom01,
  );
  return {
    title: `${name} - ${(await parent).title?.absolute}`,
  };
}

export async function generateStaticParams(): Promise<{ CIS: string }[]> {
  return liste_CIS_MVP.map((CIS) => ({
    CIS,
  }));
}

const getSpecialite = cache(async (CIS: string) => {
  const specialite: Specialite = await db
    .selectFrom("Specialite")
    .where("SpecId", "=", CIS)
    .selectAll()
    .executeTakeFirstOrThrow();

  const elements: SpecElement[] = await db
    .selectFrom("Element")
    .where("SpecId", "=", CIS)
    .selectAll()
    .execute();

  const composants: Array<SpecComposant & SubstanceNom> = (
    await Promise.all(
      elements.map((el) =>
        db
          .selectFrom("Composant")
          .where((eb) =>
            eb.and([eb("SpecId", "=", CIS), eb("ElmtNum", "=", el.ElmtNum)]),
          )
          .innerJoin("Subs_Nom", "Composant.NomId", "Subs_Nom.NomId")
          .selectAll()
          .execute(),
      ),
    )
  ).flat();

  const prix: PresInfoTarif[] = await db
    .selectFrom("Presentation")
    .where("SpecId", "=", CIS)
    .innerJoin(
      "CNAM_InfoTarif",
      "Presentation.codeCIP13",
      "CNAM_InfoTarif.Cip13",
    )
    .selectAll("CNAM_InfoTarif")
    .execute();

  const delivrance: SpecDelivrance[] = await db
    .selectFrom("Spec_Delivrance")
    .where("SpecId", "=", CIS)
    .innerJoin(
      "DicoDelivrance",
      "Spec_Delivrance.DelivId",
      "DicoDelivrance.DelivId",
    )
    .selectAll()
    .execute();

  return {
    specialite,
    composants,
    prix,
    delivrance,
  };
});

/**
 * Returns the sections from leaflets based on a list of CSS selector
 *
 * A leaflet is a long series of p tags at the top level of the body.
 * Most of the time sections are separate <a name="Ann3bDenomination">
 * tags inside one of top level <p> tags
 *
 * @param bodyNode
 * @param sectionsSelectors - list of CSS selectors applied to each <p> tag to find sections limits
 *
 * @example
 ```ts
 * const bodyNode = HTMLParser.parse(`<body>
 *     <p>Content before section 1</p>
 *     <p><a name="Section1"></a>Section 1</p>
 *     <p>Content before section 2</p>
 *     <p><a name="Section2"></a>Section 2</p>
 *     <p>Content of section 2</p>
 *     <p>Content of section 2</p>
 * </body>`).getElementsByTagName("body")[0]
 *
 * const [section1, section2] = getLeafletSections(bodyNode, ["[name=Section1]", "[name=Section2]"])
 * ```
 */
function getLeafletSections(
  bodyNode: HTMLElement,
  sectionsSelectors: string[],
) {
  const topLevelPTags = Array.from(bodyNode.childNodes);

  let i = 0;
  const sections = sectionsSelectors.map((selector) => {
    const nextSection = topLevelPTags
      .slice(i)
      .findIndex((el) => isHtmlElement(el) && el.querySelector(selector));

    if (nextSection === -1) {
      throw new Error(`No tag found with name ${name}`);
    }

    return topLevelPTags.slice(i, (i += nextSection));
  });

  // The first element is the content before the first section class name
  return [...sections, topLevelPTags.slice(i)];
}

const getLeaflet = cache(async (CIS: string) => {
  let zipData = await fs.readFile(
    path.join(
      process.cwd(),
      "src",
      "app",
      "medicament",
      "[CIS]",
      "Notices_RCP_html.zip",
    ),
  );

  const zip = new JSZIP();
  await zip.loadAsync(zipData);
  const data = await zip
    .file(`Notices_RCP_html/${CIS}_notice.htm`)
    ?.async("nodebuffer");

  if (!data) return;

  const html = windows1252.decode(data);
  // Parse the html to get the sections we want
  const dom = HTMLParser.parse(html);

  const majNode = dom.querySelector(".DateNotif");

  if (!majNode) {
    console.warn(`${CIS} : could not find leaflet update node`);
    return;
  }

  let bodyNode = dom.getElementsByTagName("body")[0];

  if (!bodyNode) {
    if (
      dom
        .getElementsByTagName("html")[0]
        .childNodes.find(
          (el) => isHtmlElement(el) && el.classList.contains("AmmAnnexeTitre"),
        )
    ) {
      // body element is not buddy but the content is there at top level
      bodyNode = dom.getElementsByTagName("html")[0];
    } else {
      console.warn(`${CIS} : could not find body node`);
      return;
    }
  }

  try {
    const [
      ,
      generalities,
      usage,
      warnings,
      howTo,
      sideEffects,
      storage,
      composition,
    ] = getLeafletSections(bodyNode, [
      "[name=Ann3bDenomination]",
      "[name=Ann3bQuestceque]",
      "[name=Ann3bInfoNecessaires]",
      "[name=Ann3bCommentPrendre]",
      "[name=Ann3bEffetsIndesirables]",
      "[name=Ann3bConservation]",
      "[name=Ann3bEmballage]",
    ]);

    return {
      maj: majNode.innerText,
      generalities,
      usage,
      warnings,
      howTo,
      sideEffects,
      storage,
      composition,
    };
  } catch (error) {
    console.warn(`${CIS}: could not parse leaflet`, error);
    return;
  }
});

export default async function Home({
  params: { CIS },
}: {
  params: { CIS: string };
}) {
  const { specialite, composants, prix, delivrance } = await getSpecialite(CIS);
  const leaflet = await getLeaflet(CIS);

  return (
    <>
      <h1 className={fr.cx("fr-h2")}>
        {formatSpecName(specialite.SpecDenom01)}
      </h1>
      <p>
        {specialite.SpecGeneId ? (
          <Tag
            small
            iconId="fr-icon-capsule-fill"
            nativeButtonProps={{
              className: fr.cx("fr-tag--green-emeraude"),
            }}
          >
            Générique
          </Tag>
        ) : null}{" "}
        {delivrance.length ? (
          <Tag
            small
            iconId="fr-icon-file-text-fill"
            nativeButtonProps={{
              className: fr.cx("fr-tag--green-archipel"),
            }}
          >
            Sur ordonnance
          </Tag>
        ) : null}
      </p>
      {prix.length ? (
        <p>
          <b>Prix</b> <Tag small>{prix[0]?.Prix} €</Tag>{" "}
          <Tag small>{prix[0].Taux}</Tag>
        </p>
      ) : null}
      <p>
        <b>Substance active</b> {composants.map((c) => c.NomLib).join(", ")}
      </p>
      {leaflet ? (
        <>
          <div className={fr.cx("fr-mb-4w")}>
            <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice</h2>
            <Badge severity={"info"}>{leaflet.maj}</Badge>
          </div>

          <Accordion label={"Généralités"}>
            <DsfrLeafletSection data={leaflet.generalities} />
          </Accordion>

          <Accordion label={"A quoi sert-il"}>
            <DsfrLeafletSection data={leaflet.usage} />
          </Accordion>

          <Accordion label={"Précautions"}>
            <DsfrLeafletSection data={leaflet.warnings} />
          </Accordion>

          <Accordion label={"Comment le prendre ?"}>
            <DsfrLeafletSection data={leaflet.howTo} />
          </Accordion>

          <Accordion label={"Effets indésirables"}>
            <DsfrLeafletSection data={leaflet.sideEffects} />
          </Accordion>

          <Accordion label={"Conservation"}>
            <DsfrLeafletSection data={leaflet.storage} />
          </Accordion>

          <Accordion label={"Composition"}>
            <DsfrLeafletSection data={leaflet.composition} />
          </Accordion>
        </>
      ) : null}
    </>
  );
}
