"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getSpecialiteGroupName } from "@/utils/specialites";
import { getAllSubsWithSpecialites } from "@/db/utils/substances";
import { SubstanceResume } from "@/types/SubstanceTypes";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

interface SubstancesListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function SubstancesListContent({
  title,
  letter,
}: SubstancesListContentProps ) {

  const [allSubs, setAllSubs] = useState<any[]>([]);

  const getFilteredSubstances = useCallback(
    async () => {
      try {
        const newAllSubs = await getAllSubsWithSpecialites();
        setAllSubs(newAllSubs);
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setAllSubs]
  );

  const letters: string[] = useMemo(() => {
    const newLetters: string[] = [];
    allSubs.forEach((sub) => {
      const subLetter = getNormalizeLetter(sub.NomLib.substring(0,1));
      if(!newLetters.includes(subLetter)) newLetters.push(subLetter);
    })
    return newLetters;
  }, [allSubs]);

  const filteredSubs: SubstanceResume[] = useMemo(() => {
    const newFilteredSubs: SubstanceResume[] = [];
    allSubs.forEach((sub) => {
      const subLetter = getNormalizeLetter(sub.NomLib.substring(0,1));
      if(subLetter !== letter) return;

      const index = newFilteredSubs.findIndex((filteredSub) => filteredSub.SubsId === sub.SubsId);
      if(index !== -1) {
        const specGroupName = getSpecialiteGroupName(sub.SpecDenom01);
        if(!newFilteredSubs[index].medicaments.includes(specGroupName)){
          newFilteredSubs[index].medicaments.push(specGroupName);
        }
      } else newFilteredSubs.push({
        SubsId: sub.SubsId,
        NomId: sub.NomId,
        NomLib: sub.NomLib,
        medicaments: [
          getSpecialiteGroupName(sub.SpecDenom01),
        ],
      });
    });
    return newFilteredSubs;
  }, [allSubs, letter]);

  useEffect(() => {
    getFilteredSubstances();
  }, [getFilteredSubstances]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/substances/"
      dataList={filteredSubs}
      type={DataTypeEnum.SUBSTANCE}
      currentLetter={letter}
    />
  );
}

export default SubstancesListContent;
