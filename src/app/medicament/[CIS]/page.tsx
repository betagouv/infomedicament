import { cache } from "react";
import { fr } from "@codegouvfr/react-dsfr";

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
import Tag from "@codegouvfr/react-dsfr/Tag";
import fs from "node:fs/promises";
import path from "node:path";
import JSZIP from "jszip";

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

async function getNotice(CIS: string): Promise<string | undefined> {
  let zipData;
  if (process.env.NOTICES_URL) {
    const response = await fetch(process.env.NOTICES_URL);
    zipData = await response.arrayBuffer();
  } else {
    zipData = await fs.readFile(
      path.join(
        process.cwd(),
        "src",
        "app",
        "medicament",
        "[CIS]",
        "Notices_RCP_html.zip",
      ),
    );
  }

  const zip = new JSZIP();
  await zip.loadAsync(zipData);
  const data = await zip
    .file(`Notices_RCP_html/${CIS}_notice.htm`)
    ?.async("nodebuffer");
  return data?.toString("latin1");
}

export default async function Home({
  params: { CIS },
}: {
  params: { CIS: string };
}) {
  const { specialite, composants, prix, delivrance } = await getSpecialite(CIS);
  const notice = await getNotice(CIS);

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
      <h2 className={fr.cx("fr-h2")}>Notice</h2>
      {notice ? (
        <div
          dangerouslySetInnerHTML={{
            __html: notice,
          }}
        />
      ) : null}
    </>
  );
}
