"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { getPathologiesResumeWithLetter } from "@/db/utils/pathologies";
import { ResumePatho } from "@/db/types";
import { getLetters } from "@/db/utils/letters";

interface PathologiesListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function PathologiesListContent({
  title,
  letter,
}: PathologiesListContentProps ) {

  const [filteredPathos, setFilteredPathos] = useState<ResumePatho[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredPathos = useCallback(
    async (letter: string) => {
      try {
        const newAllPathos = await getPathologiesResumeWithLetter(letter);
        setFilteredPathos(newAllPathos.sort((a,b) => a.NomPatho.localeCompare(b.NomPatho)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredPathos]
  );

  const getPathosLetters = useCallback(
    async () => {
      try {
        const newLetters = await getLetters("pathos");
        setLetters(newLetters);
      } catch(e) {
        Sentry.captureException(e);
      }
    }, [setLetters]
  );

  useEffect(() => {
    getPathosLetters();
    getFilteredPathos(letter);
  }, [letter, getFilteredPathos]);

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