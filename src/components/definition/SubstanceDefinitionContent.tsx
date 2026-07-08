"use client";

import React, { HTMLAttributes } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import { SubstanceNom } from "@/db/pdbmMySQL/types";
import PageDefinitionContent from "./PageDefinitionContent";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";

interface SubstanceDefinitionContentProps extends HTMLAttributes<HTMLDivElement> {
  ids: string[];
  substances: SubstanceNom[];
  articles: ArticleCardResume[];
  definition: string | { title: string; desc: string }[];
  dataList: ResumeSpecGroup[];
}

function SubstanceDefinitionContent({ ids, substances, articles, definition, dataList }: SubstanceDefinitionContentProps) {
  const title = `${dataList.length} ${dataList.length > 1 ? "médicaments" : "médicament"} contenant ${
    substances.length < 2
      ? `uniquement la substance « ${substances[0].NomLib} »`
      : `les substances « ${substances.map((s) => s.NomLib).join(", ")} »`
  }`;

  return (
    <PageDefinitionContent
      title={title}
      definition={definition}
      definitionType={`Substance${ids.length > 1 ? "s" : ""} active${ids.length > 1 ? "s" : ""}`}
      definitionTitle={substances.map((s) => s.NomLib).join(", ")}
      definitionDisclaimer={"Les définitions proposées sont fournies à titre informatif. Elles n'ont pas de valeur d'avis médical ou d’indication clinique. En cas de doute ou pour toute décision liée à votre santé, consultez un professionnel de santé."}
      dataList={dataList}
      dataType={DataTypeEnum.MEDICAMENT}
      articles={articles}
      articleTrackingFrom="Page substance"
    />
  );
};

export default SubstanceDefinitionContent;
