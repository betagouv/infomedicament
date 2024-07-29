import { cache } from "react";
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

function getLeafletSections(body: HTMLElement, sectionsNames: string[]) {
  const topLevelPTags = Array.from(body.childNodes);

  let i = 0;
  const sections = sectionsNames.map((name) => {
    // Section names are in <a name="Ann3bDenomination"> tags inside top level <p> tags
    const nextSection = topLevelPTags
      .slice(i)
      .findIndex(
        (el) => isHtmlElement(el) && el.querySelector(`[name=${name}]`),
      );

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

  const bodyNode = dom.getElementsByTagName("body")[0];

  if (!bodyNode) {
    console.warn(`${CIS} : could not find body node`);
    return;
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
      "Ann3bDenomination",
      "Ann3bQuestceque",
      "Ann3bInfoNecessaires",
      "Ann3bCommentPrendre",
      "Ann3bEffetsIndesirables",
      "Ann3bConservation",
      "Ann3bEmballage",
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

  const denom = specialite.SpecDenom01.split(" ")
    .map((word) =>
      /[A-Z]/.test(word[0]) ? word[0] + word.slice(1).toLowerCase() : word,
    )
    .join(" ");

  return (
    <>
      <h1 className={fr.cx("fr-h2")}>{denom}</h1>
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
        {delivrance.find((d) => d.DelivCourt.startsWith("liste")) ? (
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
