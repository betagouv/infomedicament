"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getSubstancesResumeWithLetter } from "@/db/utils/substances";
import { getLetters } from "@/db/utils/letters";
import { ResumeSubstance } from "@/db/types";

interface SubstancesListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function SubstancesListContent({
  title,
  letter,
}: SubstancesListContentProps ) {

  const [filteredSubs, setFilteredSubs] = useState<ResumeSubstance[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredSubstances = useCallback(
    async (letter: string) => {
      try {
        const newAllSubs = await getSubstancesResumeWithLetter(letter);
        setFilteredSubs(newAllSubs.sort((a,b) => a.NomLib.localeCompare(b.NomLib)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredSubs]
  );

  const getSubstancesLetters = useCallback(
    async () => {
      try {
        const newLetters = await getLetters("substances");
        setLetters(newLetters);
      } catch(e) {
        Sentry.captureException(e);
      }
    }, [setLetters]
  );

  useEffect(() => {
    getSubstancesLetters();
    getFilteredSubstances(letter);
  }, [letter, getFilteredSubstances]);

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
