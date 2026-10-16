"use client";

import { useId, useState, type FormEvent } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import styled from "styled-components";
import {
  initialAdvancedCriteria as defaultCriteria,
  authorizationStatuses,
  marketingStatuses,
  type AdvancedSearchCriteria as Criteria,
  type MatchMode,
} from "@/utils/advancedSearch";

const Container = styled.section<{ $advanced: boolean }>`
  margin: ${({ $advanced }) => ($advanced ? "1rem" : "0")} 0 1.5rem;
`;
const Panel = styled.form`
  background: var(--background-alt-grey);
  border-top: 3px solid var(--border-action-high-blue-france);
  padding: 1.5rem;
  margin-top: 1rem;
  .fr-input-group,
  .fr-select-group {
    margin-bottom: 1rem;
  }
  @media (max-width: 48em) {
    padding: 1rem;
  }
`;
const CriteriaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  legend {
    font-weight: 700;
    margin-bottom: 1rem;
    padding: 0;
  }
  @media (max-width: 62em) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;
const TextRow = styled.div`
  display: grid;
  grid-template-columns: 9rem minmax(0, 1fr);
  gap: 0.5rem;
  align-items: end;
  .fr-select {
    font-size: 0.875rem;
  }
  @media (max-width: 36em) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;
const DateRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  input {
    min-width: 0;
    width: 100%;
  }
  @media (max-width: 36em) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`;
const Actions = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
`;
type TextKey = "specialty" | "substance" | "holder";
type DateKey = "authorization" | "document";
const textCriteria: { key: TextKey; label: string }[] = [
  { key: "specialty", label: "Nom de la spécialité" },
  { key: "substance", label: "Substance active" },
  { key: "holder", label: "Laboratoire / titulaire" },
];
function TextCriterion({
  label,
  value,
  mode,
  onChange,
  onModeChange,
}: {
  label: string;
  value: string;
  mode: MatchMode;
  onChange: (value: string) => void;
  onModeChange: (mode: MatchMode) => void;
}) {
  return (
    <div>
      <p className={fr.cx("fr-mb-1w")}>{label}</p>
      <TextRow>
        <Select
          label={
            <span className={fr.cx("fr-sr-only")}>
              Correspondance pour {label.toLowerCase()}
            </span>
          }
          nativeSelectProps={{
            value: mode,
            onChange: (event) => onModeChange(event.target.value as MatchMode),
          }}
        >
          <option value="contains">Contenant</option>
          <option value="startsWith">Commençant par</option>
        </Select>
        <Input
          label={<span className={fr.cx("fr-sr-only")}>{label}</span>}
          nativeInputProps={{
            value,
            placeholder: "Indifférent",
            onChange: (event) => onChange(event.target.value),
          }}
        />
      </TextRow>
    </div>
  );
}

function DateCriterion({
  label,
  from,
  to,
  error,
  onFromChange,
  onToChange,
}: {
  label: string;
  from: string;
  to: string;
  error: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}) {
  return (
    <div>
      <p className={fr.cx("fr-mb-1w")}>{label}</p>
      <DateRow>
        <Input
          label="Du"
          state={error ? "error" : "default"}
          stateRelatedMessage={
            error ? "La date de début doit précéder la date de fin." : undefined
          }
          nativeInputProps={{
            type: "date",
            value: from,
            "aria-label": `${label} : du`,
            onChange: (event) => onFromChange(event.target.value),
          }}
        />
        <Input
          label="Au"
          nativeInputProps={{
            type: "date",
            value: to,
            "aria-label": `${label} : au`,
            onChange: (event) => onToChange(event.target.value),
          }}
        />
      </DateRow>
    </div>
  );
}

export default function AdvancedSearchPanel({
  initialCriteria,
  onSearch,
  isSearching = false,
}: {
  initialCriteria?: Criteria;
  onSearch: (criteria: Criteria | null, submitted?: boolean) => void;
  isSearching?: boolean;
}) {
  const panelId = useId();
  const titleId = useId();
  const isAdvancedMode = Boolean(initialCriteria);
  const [draft, setDraft] = useState(initialCriteria ?? defaultCriteria);
  const [dateErrors, setDateErrors] = useState<DateKey[]>([]);

  function update<Key extends keyof Criteria>(key: Key, value: Criteria[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
    if (key.startsWith("authorization") || key.startsWith("document")) {
      setDateErrors((current) =>
        current.filter((prefix) => !key.startsWith(prefix)),
      );
    }
  }

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = (["authorization", "document"] as const).filter(
      (key) =>
        draft[`${key}From`] &&
        draft[`${key}To`] &&
        draft[`${key}From`] > draft[`${key}To`],
    );
    setDateErrors(errors);
    if (errors.length > 0) return;
    const trimmed = { ...draft };
    (["specialty", "substance", "holder"] as const).forEach((key) => {
      trimmed[key] = trimmed[key].trim();
    });
    setDraft(trimmed);
    onSearch(trimmed, true);
  }

  function reset() {
    setDraft(defaultCriteria);
    setDateErrors([]);
    onSearch(defaultCriteria);
  }

  return (
    <Container $advanced={isAdvancedMode} aria-label="Recherche avancée">
      <Button
        priority="tertiary"
        size="small"
        iconId={
          isAdvancedMode ? "fr-icon-search-line" : "fr-icon-equalizer-line"
        }
        onClick={() => onSearch(isAdvancedMode ? null : defaultCriteria)}
        disabled={isSearching}
        nativeButtonProps={{
          "aria-expanded": isAdvancedMode,
          "aria-controls": panelId,
        }}
      >
        {isAdvancedMode ? "Recherche simple" : "Recherche avancée"}
      </Button>
      <Panel
        id={panelId}
        hidden={!isAdvancedMode}
        onSubmit={prepare}
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={fr.cx("fr-h6", "fr-mb-1w")}>
          Recherche avancée
        </h2>
        <p className={fr.cx("fr-text--sm", "fr-mb-2w")}>
          Les critères se combinent : une spécialité devra correspondre à chacun
          des critères renseignés.
        </p>
        <CriteriaGrid>
          <fieldset>
            <legend>Identité</legend>
            {textCriteria.map(({ key, label }) => (
              <TextCriterion
                key={key}
                label={label}
                value={draft[key]}
                mode={draft[`${key}Match`]}
                onChange={(value) => update(key, value)}
                onModeChange={(value) => update(`${key}Match`, value)}
              />
            ))}
          </fieldset>
          <fieldset>
            <legend>Autorisation et commercialisation</legend>
            <Select
              label="Commercialisation"
              hint="Inclut par défaut les anciennes spécialités. Un statut doit correspondre à au moins une présentation."
              nativeSelectProps={{
                value: draft.marketingStatus,
                onChange: (event) =>
                  update("marketingStatus", event.target.value),
              }}
            >
              <option value="">Tous les médicaments</option>
              {marketingStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <Select
              label="État de l’autorisation"
              nativeSelectProps={{
                value: draft.authorizationStatus,
                onChange: (event) =>
                  update("authorizationStatus", event.target.value),
              }}
            >
              <option value="">Toutes</option>
              {authorizationStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
            <DateCriterion
              label="Autorisation octroyée"
              from={draft.authorizationFrom}
              to={draft.authorizationTo}
              error={dateErrors.includes("authorization")}
              onFromChange={(value) => update("authorizationFrom", value)}
              onToChange={(value) => update("authorizationTo", value)}
            />
          </fieldset>
          <fieldset>
            <legend>Documents de référence</legend>
            <Select
              label="Type de document"
              nativeSelectProps={{
                value: draft.documentType,
                onChange: (event) => update("documentType", event.target.value),
              }}
            >
              <option value="">Tous</option>
              <option value="rcp">RCP</option>
              <option value="notice">Notice</option>
            </Select>
            <DateCriterion
              label="Document mis à jour"
              from={draft.documentFrom}
              to={draft.documentTo}
              error={dateErrors.includes("document")}
              onFromChange={(value) => update("documentFrom", value)}
              onToChange={(value) => update("documentTo", value)}
            />
            <p className={fr.cx("fr-text--xs", "fr-mb-0")}>
              Les dates concernent le document sélectionné. Sans type de
              document, elles concernent un RCP ou une notice.
            </p>
          </fieldset>
        </CriteriaGrid>
        <Actions>
          <Button type="submit" disabled={isSearching}>
            Rechercher
          </Button>
          <Button
            type="button"
            priority="tertiary no outline"
            onClick={reset}
            disabled={isSearching}
          >
            Effacer les critères avancés
          </Button>
        </Actions>
        {dateErrors.length > 0 && (
          <p role="alert" className={fr.cx("fr-error-text")}>
            Vérifiez les périodes : la date de début doit précéder la date de
            fin.
          </p>
        )}
      </Panel>
    </Container>
  );
}
