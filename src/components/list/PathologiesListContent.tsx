"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { getNormalizeLetter } from "@/utils/alphabeticNav";
import { getAllPathoWithSpecialites } from "@/db/utils/pathologies";
import { PathologyResume } from "@/types/PathologyTypes";

interface PathologiesListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function PathologiesListContent({
  title,
  letter,
}: PathologiesListContentProps ) {

  const [allPathos, setAllPathos] = useState<any[]>([]);

  const getFilteredPathos = useCallback(
    async () => {
      try {
        const newAllPathos = await getAllPathoWithSpecialites();
        setAllPathos(newAllPathos);
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setAllPathos]
  );

  const letters: string[] = useMemo(() => {
    const newLetters: string[] = [];
    allPathos.forEach((patho) => {
      const pathoLetter = getNormalizeLetter(patho.NomPatho.substring(0,1));
      if(!newLetters.includes(pathoLetter)) newLetters.push(pathoLetter);
    })
    return newLetters;
  }, [allPathos]);

  const filteredPathos: PathologyResume[] = useMemo(() => {
    const newFilteredPathos:PathologyResume[] = [];
    allPathos.forEach((patho) => {
      const pathoLetter = getNormalizeLetter(patho.NomPatho.substring(0,1));
      if(pathoLetter !== letter) return;

      const index = newFilteredPathos.findIndex((filteredPatho) => filteredPatho.codePatho === patho.codePatho);
      if(index !== -1) {
        const specGroupName = getSpecialiteGroupName(patho.SpecDenom01);
        if(!newFilteredPathos[index].medicaments.includes(specGroupName)){
          newFilteredPathos[index].medicaments.push(specGroupName);
        }
      } else newFilteredPathos.push({
        codePatho: patho.codePatho,
        NomPatho: patho.NomPatho,
        medicaments: [
          getSpecialiteGroupName(patho.SpecDenom01),
        ],
      });
    })
    return newFilteredPathos;
  }, [allPathos, letter]);

  useEffect(() => {
    getFilteredPathos();
  }, [getFilteredPathos]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/pathologies/"
      dataList={filteredPathos}
      type={DataTypeEnum.PATHOLOGY}
      currentLetter={letter}
    />
  );
}

export default PathologiesListContent;