"use client";

import * as Sentry from "@sentry/nextjs";
import { HTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { DataTypeEnum } from "@/types/DataTypes";
import PageListContent from "@/components/list/PageListContent";
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";
import { Specialite } from "@/db/pdbmMySQL/types";
import { getSpecialitesWithLetter } from "@/db/utils/specialities";
import { MedicamentGroup } from "@/displayUtils";
import { groupSpecialites } from "@/utils/specialites";
import { getAdvancedMedicamentFromGroup } from "@/db/utils/medicaments";

interface MedicamentsListContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  letter: string;
  letters: string[];
}

function MedicamentsListContent({
  title,
  letter,
  letters,
}: MedicamentsListContentProps ) {

  const [detailedMedicaments, setDetailedMedicaments] = useState<AdvancedMedicamentGroup[]>([]);

  const getDetailedMedicaments = useCallback(
    async (letter: string) => {
      try {
        const allSpecialites: Specialite[] = await getSpecialitesWithLetter(letter);
        const medicaments: MedicamentGroup[] = groupSpecialites(allSpecialites);
        const detailedMedicaments = await getAdvancedMedicamentFromGroup(medicaments);
        setDetailedMedicaments(detailedMedicaments);
      } catch(e) {
        Sentry.captureException(e);
      }
    },
    [setDetailedMedicaments]
  );

  useEffect(() => {
    getDetailedMedicaments(letter);
  }, [letter, getDetailedMedicaments]);

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
