import Badge from "@codegouvfr/react-dsfr/Badge";
import {
  getSpecialite,
  getSpecialiteGroupName,
  groupGeneNameToDCI,
} from "@/db/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React, { Fragment } from "react";
import Link from "next/link";

import { pdbmMySQL } from "@/db/pdbmMySQL";
import { displayCompleteComposants, formatSpecName } from "@/displayUtils";
import { ATCError, getAtc2, getAtcCode } from "@/data/grist/atc";
import { notFound } from "next/navigation";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import GenericAccordion from "@/components/GenericAccordion";
import ClassTag from "@/components/tags/ClassTag";
import SubstanceTag from "@/components/tags/SubstanceTag";

export const dynamic = "error";
export const dynamicParams = true;

async function getGroupeGene(CIS: string) {
  return pdbmMySQL
    .selectFrom("GroupeGene")
    .selectAll()
    .where("SpecId", "=", CIS)
    .executeTakeFirst();
}

async function getGeneriques(CIS: string) {
  return (
    pdbmMySQL
      .selectFrom("Specialite")
      .selectAll()
      .where("SpecGeneId", "=", CIS)
      .where("SpecId", "!=", CIS)
      // Limit to 500 results
      .where("SpecId", "in", liste_CIS_MVP)
      .execute()
  );
}

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await props.params;

  const group = await getGroupeGene(CIS);
  if (!group) notFound();

  const { specialite, composants } = await getSpecialite(group.SpecId);

  if (!specialite) notFound();

  const generiques = await getGeneriques(CIS);

  let atcCode;
  try {
    atcCode = getAtcCode(CIS);
  } catch (e) {
    if (!(e instanceof ATCError)) throw e;
    for (const specialite of generiques) {
      try {
        atcCode = getAtcCode(specialite.SpecId);
        break;
      } catch (e) {
        if (!(e instanceof ATCError)) throw e;
      }
    }
  }
  if (!atcCode) throw new ATCError(CIS);
  const atc2 = await getAtc2(atcCode);

  return (
    <div className={fr.cx("fr-grid-row")}>
      <div className={fr.cx("fr-col-md-8")}>
        <Breadcrumb
          segments={[
            { label: "Accueil", linkProps: { href: "/" } },
            {
              label: "Liste des groupes génériques",
              linkProps: { href: "/generiques/A" },
            },
          ]}
          currentPageLabel={formatSpecName(groupGeneNameToDCI(group.LibLong))}
        />
        <Badge className="fr-badge--purple-glycine">Groupe générique</Badge>
        <h1 className={fr.cx("fr-h1", "fr-mt-1w", "fr-mb-6w")}>
          {formatSpecName(groupGeneNameToDCI(group.LibLong))}
        </h1>
        <ul className={fr.cx("fr-tags-group", "fr-mb-1v")}>
          <ClassTag atc2={atc2} />
          <SubstanceTag composants={composants} />
        </ul>
        <div className={"fr-mb-1w"}>
          <span
            className={["fr-icon--custom-molecule", fr.cx("fr-mr-1w")].join(
              " ",
            )}
          />
          <b>Substance active</b>
          <br />
          {displayCompleteComposants(composants)}
        </div>
        <div className={"fr-mb-2w"}>
          <b>Dénomination commune internationale (DCI)</b>
          <br />
          {formatSpecName(
            getSpecialiteGroupName(groupGeneNameToDCI(group.LibLong)),
          )}
        </div>
        <GenericAccordion />
        <h2 className={fr.cx("fr-h6", "fr-mt-2w", "fr-mb-1w")}>
          Médicament princeps
        </h2>
        <p className={fr.cx("fr-mb-1v")}>
          {liste_CIS_MVP.includes(specialite.SpecId.trim()) ? (
            <Link
              className={fr.cx("fr-link")}
              href={`/medicaments/${specialite.SpecId}`}
            >
              {formatSpecName(specialite.SpecDenom01)}
            </Link>
          ) : (
            <b>{formatSpecName(specialite.SpecDenom01)}</b>
          )}
        </p>
        <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
          {generiques.length} médicament{generiques.length > 1 && "s"} générique
          {generiques.length > 1 && "s"}
        </h2>
        {generiques.map((specialite) => (
          <Fragment key={specialite.SpecId}>
            <p className={fr.cx("fr-mb-1v")}>
              {liste_CIS_MVP.includes(specialite.SpecId.trim()) ? (
                <Link
                  className={fr.cx("fr-link")}
                  href={`/medicaments/${specialite.SpecId}`}
                >
                  {formatSpecName(specialite.SpecDenom01)}
                </Link>
              ) : (
                <b>{formatSpecName(specialite.SpecDenom01)}</b>
              )}
            </p>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
