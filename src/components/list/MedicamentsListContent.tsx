"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getResumeSpecsGroupsWithLetter } from "@/db/utils/specialities";
import { getLetters } from "@/db/utils/letters";
import { ResumeSpecGroup } from "@/types/SpecialiteTypes";
import { getResumeSpecsGroupsATCLabels } from "@/data/grist/atc";

interface MedicamentsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function MedicamentsListContent({
  title,
  letter,
}: MedicamentsListContentProps ) {

  const [filteredSpecsGroups, setFilteredSpecsGroups] = useState<ResumeSpecGroup[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredMedicaments = useCallback(
    async (letter: string) => {
      try {
        const newAllSpecsGroups = await getResumeSpecsGroupsWithLetter(letter);
        const allSpecsGroupsWithATC: ResumeSpecGroup[] = await getResumeSpecsGroupsATCLabels(newAllSpecsGroups);
        setFilteredSpecsGroups(allSpecsGroupsWithATC.sort((a,b) => a.groupName.localeCompare(b.groupName)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredSpecsGroups]
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
  }, [letter, getSpecialitesLetters, getFilteredMedicaments]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/medicaments/"
      dataList={filteredSpecsGroups}
      type={DataTypeEnum.MEDICAMENT}
      currentLetter={letter}
    />
  );
}

export default MedicamentsListContent;
