"use client";

import { HTMLAttributes } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import styled from 'styled-components';

const CheckboxContainer = styled.div`
  @media (max-width: 48em) {
    .fr-fieldset{
      padding: 0px;
      flex-direction: column;
      margin: 0;
    }
    .fr-fieldset__content{
      margin: 0;
    }
    .fr-fieldset__content .fr-checkbox-group label {
      padding-bottom: 0px;
    }
  }
`;

interface PregnancyPediatricFiltersProps extends HTMLAttributes<HTMLDivElement> {
  setFilterPregnancy: (value:boolean) => void;
  setFilterPediatric: (value:boolean) => void;
  filterPregnancy: boolean;
  filterPediatric: boolean;
}

function PregnancyPediatricFilters({
  setFilterPregnancy,
  setFilterPediatric,
  filterPregnancy,
  filterPediatric,
}: PregnancyPediatricFiltersProps) {

  return (
    <CheckboxContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-10", "fr-mb-1w")}>
      <Checkbox
        small
        options={[
          {
            label: 'Pour un enfant',
            nativeInputProps: {
              checked: filterPediatric,
              onChange: () => setFilterPediatric(!filterPediatric),
            }
          },
          {
            label: 'Contre-indication femme enceinte',
            nativeInputProps: {
              checked: filterPregnancy,
              onChange: () => setFilterPregnancy(!filterPregnancy),
            }
          },
        ]}
        orientation="horizontal"
      />
    </CheckboxContainer>
  );
};

export default PregnancyPediatricFilters;
