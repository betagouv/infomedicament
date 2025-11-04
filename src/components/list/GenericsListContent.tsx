"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import { ResumeGeneric } from "@/db/types";
import { getGenericsResumeWithLetter } from "@/db/utils/generics";
import { getLetters } from "@/db/utils/letters";
import PageListContent from "./PageListContent";
import { DataTypeEnum } from "@/types/DataTypes";

interface GenericsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function GenericsListContent({
  title,
  letter,
}: GenericsListContentProps) {

  const [filteredGenerics, setFilteredGenerics] = useState<ResumeGeneric[]>([]);
  const [letters, setLetters] = useState<string[]>([]);

  const getFilteredGenerics = useCallback(
    async (letter: string) => {
      try {
        const newAllGenerics = await getGenericsResumeWithLetter(letter);
        setFilteredGenerics(newAllGenerics.sort((a,b) => a.SpecName.localeCompare(b.SpecName)));
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setFilteredGenerics]
  );

  const getGenericsLetters = useCallback(
    async () => {
      try {
        const newLetters = await getLetters("generiques");
        setLetters(newLetters);
      } catch(e) {
        Sentry.captureException(e);
      }
    }, [setLetters]
  );

  useEffect(() => {
    getGenericsLetters();
    getFilteredGenerics(letter);
  }, [letter, getGenericsLetters, getFilteredGenerics]);

  return (
    <>
      <PageListContent
        title={title}
        letters={letters}
        urlPrefix="/generiques/"
        dataList={filteredGenerics}
        type={DataTypeEnum.GENERIC}
        currentLetter={letter}
      />
    </>
  );
}

export default GenericsListContent;