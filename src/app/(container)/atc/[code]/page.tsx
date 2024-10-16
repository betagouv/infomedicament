import Badge from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr";
import { getAtc1, getAtc2 } from "@/data/atc";
import Card from "@codegouvfr/react-dsfr/Card";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import React from "react";
import Link from "next/link";

export default async function Page({
  params: { code },
}: {
  params: { code: string };
}) {
  const atc1 = await getAtc1(code);
  const atc2 = code.length === 3 && (await getAtc2(code));
  const currentAtc = atc2 || atc1;

  return (
    <>
      <Breadcrumb
        segments={[
          {
            label: "Accueil",
            linkProps: { href: "/" },
          },
          ...(atc2
            ? [
                {
                  label: atc1.label,
                  linkProps: { href: `/atc/${atc1.code}` },
                },
              ]
            : []),
        ]}
        currentPageLabel={currentAtc.label}
      />
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <Badge className={fr.cx("fr-badge--purple-glycine")}>
            Classe de médicament
          </Badge>

          <h1 className={fr.cx("fr-h2", "fr-mt-2w")}>{currentAtc.label}</h1>

          <div className={fr.cx("fr-grid-row")}>
            <Card
              title="Définition"
              titleAs={"h6"}
              desc={currentAtc.description}
            />
          </div>
          <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
            {currentAtc.children?.length}
            {atc2 ? "substances actives" : "sous-classes de médicament"}
          </h2>

          <ul className={fr.cx("fr-raw-list")}>
            {currentAtc.children?.map((child) => (
              <li key={child.code} className={fr.cx("fr-mb-1w")}>
                <Link className={fr.cx("fr-link")} href={`/atc/${child.code}`}>
                  {child.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
