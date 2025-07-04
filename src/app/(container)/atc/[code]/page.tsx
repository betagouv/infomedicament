import { fr } from "@codegouvfr/react-dsfr";
import { ATC, ATC1, getAtc1, getAtc2, getSubstancesByAtc } from "@/data/grist/atc";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { notFound } from "next/navigation";
import React from "react";
import Link from "next/link";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import DefinitionBanner from "@/components/DefinitionBanner";
import ContentContainer from "@/components/generic/ContentContainer";
import { getSubstanceSpecialites } from "@/db/utils/search";
import { groupSpecialites } from "@/db/utils";
import { AdvancedATCClass, AdvancedSubstanceNom, DataTypeEnum } from "@/types/DataTypes";
import DataList from "@/components/data/DataList";

export const dynamic = "error";
export const dynamicParams = true;

const SubstanceItem = ({ item }: { item: SubstanceNom }) => (
  <li key={item.NomId} className={fr.cx("fr-mb-1w")}>
    <Link className={fr.cx("fr-link")} href={`/substances/${item.NomId}`}>
      {item.NomLib}
    </Link>
  </li>
);

const SubClassItem = ({ item }: { item: ATC }) => (
  <li key={item.code} className={fr.cx("fr-mb-1w")}>
    <Link className={fr.cx("fr-link")} href={`/atc/${item.code}`}>
      {item.label}
    </Link>
  </li>
);

export default async function Page(props: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await props.params;

  const atc1 = code ? await getAtc1(code) : undefined;
  const atc2 = (code && code.length === 3) ? (await getAtc2(code)) : undefined;
  const currentAtc = atc2 || atc1 || undefined;

  if (!currentAtc || !atc1) notFound();

  //If atc2 --> subtances list else subclass list
  const items = atc2
    ? await getSubstancesByAtc(atc2)
    : (
        await Promise.all(
          atc1.children.map(
            async (atc2): Promise<[ATC, SubstanceNom[] | undefined]> => [
              atc2,
              await getSubstancesByAtc(atc2),
            ],
          ),
        )
      )
        .filter(([_, substances]) => !!substances)
        .map(([atc2]) => atc2);
  if (!items) notFound();

  let detailedSubClass: (AdvancedATCClass | AdvancedSubstanceNom)[] = [];
  detailedSubClass = await Promise.all(
    items.map(async (item:ATC | SubstanceNom) => {
      if(atc2) {
        const specialites = await getSubstanceSpecialites((item as SubstanceNom).NomId);
        const specialitiesGroups = groupSpecialites(specialites);
        return {
          nbSpecs: specialitiesGroups.length,
          ...item,
        } as AdvancedSubstanceNom;
      } else {
        return {
          class: (item as ATC),
          subclasses:[],
        } as AdvancedATCClass
      }
    })
  );

  const ItemComponent = (atc2 ? SubstanceItem : SubClassItem) as ({
    item,
  }: {
    item: SubstanceNom | ATC;
  }) => React.JSX.Element;

  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
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
          <DefinitionBanner
            type={`${atc2 ? "Sous-classe" : "Classe"} de médicament`}
            title={currentAtc.label}
            definition={currentAtc.description}
          />

          <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
            {items.length}{" "}
            {atc2 ? (
              items.length > 1 ? "substances actives" : "substance active"
            ) : (
              items.length > 1 ? "sous-classes de médicament" : "sous-classe de médicament"
            )}
          </h2>

          <DataList
            dataList={detailedSubClass as AdvancedSubstanceNom[] | AdvancedATCClass[]}
            type={atc2 ? DataTypeEnum.SUBSTANCE : DataTypeEnum.ATCCLASS}
          />

        </div>
      </div>
    </ContentContainer>
  );
}
