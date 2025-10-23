"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getResumeSpecialitesWithLetter } from "@/db/utils/specialities";
import { getLetters } from "@/db/utils/letters";
import { ResumeSpecialite } from "@/types/SpecialiteTypes";
import { getResumeSpecsATCLabels } from "@/data/grist/atc";

interface MedicamentsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function MedicamentsListContent({
  title,
  letter,
}: MedicamentsListContentProps ) {

  const [filteredMedicaments, setFilteredMedicaments] = useState<ResumeSpecialite[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredMedicaments = useCallback(
    async (letter: string) => {
      try {
        const newAllSpecs = await getResumeSpecialitesWithLetter(letter);
        const allSpecsWithATC: ResumeSpecialite[] = await getResumeSpecsATCLabels(newAllSpecs);
        setFilteredMedicaments(allSpecsWithATC.sort((a,b) => a.groupName.localeCompare(b.groupName)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredMedicaments]
  );

  const getSpecialitesLetters = useCallback(
    async () => {
      try {
        const newLetters = await getLetters("specialites");
        setLetters(newLetters);
      } catch(e) {
        Sentry.captureException(e);
      }
    }, [setLetters]
  );

  useEffect(() => {
    getSpecialitesLetters();
    getFilteredMedicaments(letter);
  }, [letter, getFilteredMedicaments]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/medicaments/"
      dataList={filteredMedicaments}
      type={DataTypeEnum.MEDGROUP}
      currentLetter={letter}
    />
  );
}

export default MedicamentsListContent;
