"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getIndicationsResumeWithLetter } from "@/db/utils/indications";
import { ResumeIndication } from "@/db/types";
import { getLetters } from "@/db/utils/letters";

interface IndicationsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function IndicationsListContent({
  title,
  letter,
}: IndicationsListContentProps ) {

  const [filteredIndications, setFilteredIndications] = useState<ResumeIndication[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredIndications = useCallback(
    async (letter: string) => {
      try {
        const newAllIndications = await getIndicationsResumeWithLetter(letter);
        setFilteredIndications(newAllIndications.sort((a,b) => a.nomIndication.localeCompare(b.nomIndication)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredIndications]
  );

  const getIndicationsLetters = useCallback(
    async () => {
      try {
        const newLetters = await getLetters("indications");
        setLetters(newLetters);
      } catch(e) {
        Sentry.captureException(e);
      }
    }, [setLetters]
  );

  useEffect(() => {
    getIndicationsLetters();
    getFilteredIndications(letter);
  }, [letter, getIndicationsLetters, getFilteredIndications]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/indications/"
      dataList={filteredIndications}
      type={DataTypeEnum.INDICATION}
      currentLetter={letter}
    />
  );
}

export default IndicationsListContent;