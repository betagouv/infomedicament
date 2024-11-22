import Badge from "@codegouvfr/react-dsfr/Badge";
import { getSpecialite } from "@/db/pdbmMySQL/utils";
import { fr } from "@codegouvfr/react-dsfr";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React, { Fragment } from "react";
import Link from "next/link";

import { pdbmMySQL } from "@/db/pdbmMySQL";
import {
  displayCompleteComposants,
  displaySimpleComposants,
  formatSpecName,
  getSpecialiteGroupName,
  groupGeneNameToDCI,
} from "@/displayUtils";
import { getAtc2, getAtcCode } from "@/data/grist/atc";
import { notFound } from "next/navigation";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import { PresentationsList } from "@/components/PresentationsList";
import {
  Presentation,
  PresentationComm,
  PresentationStat,
  PresInfoTarif,
} from "@/db/pdbmMySQL/types";
import { Nullable, sql } from "kysely";
import GenericAccordion from "@/components/GenericAccordion";

async function getGroupeGene(CIS: string) {
  return pdbmMySQL
    .selectFrom("GroupeGene")
    .selectAll()
    .where("SpecId", "=", CIS)
    .executeTakeFirst();
}

async function getGeneriques(CIS: string) {
  return Promise.all(
    (
      await pdbmMySQL
        .selectFrom("Specialite")
        .selectAll()
        .where("SpecGeneId", "=", CIS)
        .where("SpecId", "!=", CIS)
        // Limit to 500 results
        .where("SpecId", "in", liste_CIS_MVP)
        .execute()
    ).map(async (specialite) => ({
      specialite,
      presentations: (
        await pdbmMySQL
          .selectFrom("Presentation")
          .where("SpecId", "=", CIS)
          .where(({ eb }) =>
            eb.or([
              eb("CommId", "=", PresentationComm.Commercialisation),
              eb.and([
                eb("CommId", "in", [
                  PresentationComm["Arrêt"],
                  PresentationComm.Suspension,
                  PresentationComm["Plus d'autorisation"],
                ]),
                eb(
                  "PresCommDate",
                  ">=",
                  sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
                ),
              ]),
            ]),
          )
          .where(({ eb }) =>
            eb.or([
              eb("StatId", "is", null),
              eb("StatId", "!=", PresentationStat.Abrogation),
              eb(
                "PresStatDate",
                ">=",
                sql<Date>`DATE_ADD(NOW(),INTERVAL -730 DAY)`,
              ),
            ]),
          )
          .leftJoin(
            "CNAM_InfoTarif",
            "Presentation.codeCIP13",
            "CNAM_InfoTarif.Cip13",
          )
          .selectAll()
          .execute()
      ).sort((a, b) =>
        a.Prix && b.Prix
          ? parseFloat(a.Prix.replace(",", ".")) -
            parseFloat(b.Prix.replace(",", "."))
          : a.Prix
            ? -1
            : b.Prix
              ? 1
              : 0,
      ) as (Presentation & Nullable<PresInfoTarif>)[],
    })),
  );
}

export default async function Page({
  params: { CIS },
}: {
  params: { CIS: string };
}) {
  const group = await getGroupeGene(CIS);
  if (!group) notFound();

  const { specialite, composants, presentations } = await getSpecialite(
    group.SpecId,
  );
  const atcCode = getAtcCode(CIS);
  const atc2 = await getAtc2(atcCode);

  const generiques = await getGeneriques(CIS);

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
          <Tag
            small
            linkProps={{
              href: `/atc/${atc2.code}`,
              className: cx("fr-tag--custom-alt-class"),
            }}
          >
            {atc2.label}
          </Tag>
          <Tag
            small
            linkProps={{
              href: `/substances/${displaySimpleComposants(composants)
                .map((s) => s.NomId.trim())
                .join(",")}`,
              className: cx("fr-tag--custom-alt-substance"),
            }}
          >
            {displaySimpleComposants(composants)
              .map((s) => s.NomLib.trim())
              .join(", ")}
          </Tag>
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
          <Link
            className={fr.cx("fr-link")}
            href={`/medicaments/${specialite.SpecId}`}
          >
            {formatSpecName(specialite.SpecDenom01)}
          </Link>
        </p>
        <PresentationsList presentations={presentations} />
        <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
          {generiques.length} médicament{generiques.length > 1 && "s"}{" "}
          génériques
        </h2>
        {generiques.map(({ specialite, presentations }) => (
          <Fragment key={specialite.SpecId}>
            <p className={fr.cx("fr-mb-1v")}>
              <Link
                className={fr.cx("fr-link")}
                href={`/medicaments/${specialite.SpecId}`}
              >
                {formatSpecName(specialite.SpecDenom01)}
              </Link>
            </p>
            <PresentationsList presentations={presentations} />
          </Fragment>
        ))}
      </div>
    </div>
  );
}
