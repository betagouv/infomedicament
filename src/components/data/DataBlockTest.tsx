"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { formatSpecName } from "@/displayUtils";
import styled from 'styled-components';
import { AdvancedMedicamentGroup } from "@/types/MedicamentTypes";


const Container = styled.div`
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
`;

const SpecName = styled.span`
  color: var(--grey-200-850);
  font-weight: bold;
`;

interface DataBlockTestProps extends HTMLAttributes<HTMLDivElement> {
  item: AdvancedMedicamentGroup;
}

//For now only for type === DataTypeEnum.MEDGROUP
function DataBlockTest({
  item,
}: DataBlockTestProps) {

  return (
    <Container className={fr.cx("fr-mb-1w")}>
      <div>
        <SpecName className={fr.cx("fr-text--md", "fr-mr-2w")}>{formatSpecName(item.groupName)}</SpecName>
        {/* <SpecLength className={fr.cx("fr-text--sm")}>{specialites.length} {specialites.length > 1 ? "médicaments" : "médicament"}</SpecLength> */}
      </div>
    </Container>
  );
};

export default DataBlockTest;
