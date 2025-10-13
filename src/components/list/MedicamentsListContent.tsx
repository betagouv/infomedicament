"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { Specialite } from "@/db/pdbmMySQL/types";
import { getSpecialites } from "@/db/utils/specialities";
import { MedicamentGroup } from "@/displayUtils";
import { groupSpecialites } from "@/utils/specialites";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";
import { getNormalizeLetter } from "@/utils/alphabeticNav";

interface MedicamentsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
}

function MedicamentsListContent({
  title,
  letter,
}: MedicamentsListContentProps ) {

  const [allSpecialites, setAllSpecialites] = useState<Specialite[]>([]);
  const [detailedMedicaments, setDetailedMedicaments] = useState<AdvancedMedicamentGroup[]>([]);

  const getDetailedMedicaments = useCallback(
    async (letter: string) => {
      try {
        const newAllSpecialites: Specialite[] = await getSpecialites();
        setAllSpecialites(newAllSpecialites);
        const filteredSpecialites: Specialite[] = [];

        newAllSpecialites.forEach((spec) => {
          const specLetter = spec.SpecDenom01.substring(0,1).toUpperCase();
          if(specLetter !== letter) return;

          const index = filteredSpecialites.findIndex((filteredSpec) => filteredSpec.SpecId === spec.SpecId);
          if(index === -1) filteredSpecialites.push(spec);
        })

        const medicaments: MedicamentGroup[] = groupSpecialites(filteredSpecialites);
        const detailedMedicaments = await getAdvancedMedicamentFromGroup(medicaments);
        setDetailedMedicaments(detailedMedicaments);
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setDetailedMedicaments, setAllSpecialites]
  );

  const letters: string[] = useMemo(() => {
    const newLetters: string[] = [];
    allSpecialites.forEach((spec) => {
      const specLetter = getNormalizeLetter(spec.SpecDenom01.substring(0,1));
      if(!newLetters.includes(specLetter)) newLetters.push(specLetter);
    })
    return newLetters;
  }, [allSpecialites]);

  useEffect(() => {
    getDetailedMedicaments(letter);
  }, [letter]);

  return (
    <PageListContent
      title={title}
      letters={letters}
      urlPrefix="/medicaments/"
      dataList={detailedMedicaments}
      type={DataTypeEnum.MEDGROUP}
      currentLetter={letter}
    />
  );
}

export default MedicamentsListContent;
