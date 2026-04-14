"use client";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import { fr } from "@codegouvfr/react-dsfr";
import { HTMLAttributes, useCallback, useState } from "react";
import styled from 'styled-components';
import { trackEvent } from "@/services/tracking";

const ToggleSwitchContainer = styled.div`
  background-color: var(--background-contrast-info);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  .medicament-toggle-switch .fr-toggle__label {
    font-size: 0.875rem;
    font-weight: bold;
    align-items: center;
  }
  .medicament-toggle-switch .fr-hint-text{
    color: var(--text-default-grey);
    margin-top: 0.3rem;
    font-size: 0.875rem;
  }
`;

interface SwitchNoticeAdvancedBlockProps extends HTMLAttributes<HTMLDivElement> {
  isAdvanced: boolean;
  onGoToAdvanced: (advanced: boolean) => void;
}

function SwitchNoticeAdvancedBlock({
  isAdvanced,
  onGoToAdvanced,
  ...props
}: SwitchNoticeAdvancedBlockProps) {

  const [isCurrentAdvanced, setIsAdvanced] = useState<boolean>(isAdvanced);

  const onSwitchAdvanced = useCallback(
    (enabled: boolean) => {
      setIsAdvanced(enabled);
      if (enabled) trackEvent("Page médicament", "Version avancée");
      onGoToAdvanced(enabled);
    },
    [setIsAdvanced]
  );

  return (
    <ToggleSwitchContainer {...props} className={[props.className, fr.cx("fr-p-2w")].join(" ")}>
      <ToggleSwitch
        label="Version détaillée"
        labelPosition="left"
        inputTitle="Version détaillée"
        helperText="(RCP, toutes les données...)"
        showCheckedHint={false}
        checked={isCurrentAdvanced}
        onChange={(enabled) => {
          onSwitchAdvanced(enabled);
        }}
        className="medicament-toggle-switch"
      />
    </ToggleSwitchContainer>
  );
};

export default SwitchNoticeAdvancedBlock;
