"use client";

import { HTMLAttributes, useMemo, useState } from "react";
import styled from "styled-components";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Tag from "@codegouvfr/react-dsfr/Tag";
import Table from "@codegouvfr/react-dsfr/Table";
import { normalizeString } from "@/utils/alphabeticNav";
import {
  AtcOption,
  DEFAULT_EXPORT_FIELD_KEYS,
  EXPORT_FIELDS,
  ExportFieldKey,
  ExportSpecs,
  SubstanceOption,
} from "@/types/ExportTypes";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { buildExportCsv } from "@/utils/export";

const SubstancesSearchContainer = styled.div`
  width: 100%;
  flex-direction: column;
`;

const SubstancesSuggestionsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
  border: 1px solid var(--border-default-grey);
`;

const SubstanceSuggestion = styled.li`
  padding: ${fr.spacing("1w")} ${fr.spacing("2w")};
  cursor: pointer;
  &:hover {
    background-color: var(--background-alt-blue-france);
  }
`;

const SubstancesTagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${fr.spacing("1w")};
  margin: ${fr.spacing("2w")} 0;
`;

const ResultsBlock = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ResultsTable = styled.div`
  .fr-table > table td {
    vertical-align: top;
  }
`;

const MAX_SUGGESTIONS = 30;

interface ExportBlockProps extends HTMLAttributes<HTMLDivElement> {
  substancesOptions: SubstanceOption[];
  atcsOptions: AtcOption[];
}

export default function ExportBlock({
  substancesOptions,
  atcsOptions,
}: ExportBlockProps) {

  const [substancesList, setSubstancesList] = useState("");
  const [selectedSubstances, setSelectedSubstances] = useState<SubstanceOption[]>([]);
  const [selectedAtc2Codes, setSelectedAtc2Codes] = useState<string[]>([]);
  const [selectedFields, setSelectedField] = useState<ExportFieldKey[]>(
    DEFAULT_EXPORT_FIELD_KEYS,
  );
  const [results, setResults] = useState<ExportSpecs[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const substancesSuggestions = useMemo(() => {
    const substances = normalizeString(substancesList.trim());
    if (substances.length < 2) return [];
    return substancesOptions
      .filter((option) => normalizeString(option.nomLib).includes(substances))
      .slice(0, MAX_SUGGESTIONS);
  }, [substancesList, substancesOptions]);

  function addSubstance(subsOption: SubstanceOption) {
    setSelectedSubstances((substances) =>
      substances.some((subs) => subs.subsId === subsOption.subsId && subs.nomLib === subsOption.nomLib)
        ? substances
        : [...substances, subsOption],
    );
    setSubstancesList("");
  }

  function removeSubstance(subsOption: SubstanceOption) {
    setSelectedSubstances((substances) =>
      substances.filter((subs) => !(subs.subsId === subsOption.subsId && subs.nomLib === subsOption.nomLib)),
    );
  }

  function onChangeAtc2(atc2Code: string, checked: boolean) {
    setSelectedAtc2Codes((current) =>
      checked ? [...current, atc2Code] : current.filter((c) => c !== atc2Code),
    );
  }

  function onChangeSelectedFields(fieldKey: ExportFieldKey, checked: boolean) {
    setSelectedField((current) =>
      checked ? [...current, fieldKey] : current.filter((k) => k !== fieldKey),
    );
  }

  async function onExtractData() {
    setLoading(true);
    setError(null);
    try {
      const subsIds = [...new Set(selectedSubstances.map((s) => s.subsId))];
      const results = await fetch("/extraction/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subsIds,
          atc2Codes: selectedAtc2Codes,
          fieldKeys: selectedFields,
        }),
      });
      if (!results.ok) throw new Error("La requête a échoué");
      setResults(await results.json());
    } catch {
      setError("Une erreur est survenue pendant l'extraction. Merci de réessayer.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function onDownloadCSV() {
    if (!results) return;
    const csv = buildExportCsv(results, selectedFields);

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extraction-medicaments.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeFields = EXPORT_FIELDS.filter((f) => selectedFields.includes(f.key));

  return (
    <div>
      <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Substances actives</h2>
      <SubstancesSearchContainer className={fr.cx("fr-search-bar")} role="search">
        <Input
          id="extraction-substance-search"
          label="Rechercher une substance"
          nativeInputProps={{
            type: "text",
            onChange: (e) => setSubstancesList(e.target.value),
            placeholder: "Ex : paracétamol",
            autoComplete: "off",
          }}
        />
      </SubstancesSearchContainer>
      {substancesSuggestions.length > 0 && (
        <SubstancesSuggestionsList>
          {substancesSuggestions.map((subs) => (
            <SubstanceSuggestion
              key={`${subs.subsId}-${subs.nomLib}`}
              onClick={() => addSubstance(subs)}
            >
              {subs.nomLib}
            </SubstanceSuggestion>
          ))}
        </SubstancesSuggestionsList>
      )}
      {selectedSubstances.length > 0 && (
        <SubstancesTagsList>
          {selectedSubstances.map((subs) => (
            <Tag
              key={`${subs.subsId}-${subs.nomLib}`}
              dismissible
              nativeButtonProps={{
                onClick: () => removeSubstance(subs),
                "aria-label": `Retirer ${subs.nomLib}`,
              }}
            >
              {subs.nomLib}
            </Tag>
          ))}
        </SubstancesTagsList>
      )}

      <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Classes ATC</h2>
      {atcsOptions.map((atc1) => (
        <Accordion key={atc1.atc1Code} label={atc1.atc1Label}>
          <Checkbox
            options={atc1.atc2.map((atc2) => ({
              label: atc2.atc2Label,
              nativeInputProps: {
                checked: selectedAtc2Codes.includes(atc2.atc2Code),
                onChange: (e) => onChangeAtc2(atc2.atc2Code, e.target.checked),
              },
            }))}
            small
          />
        </Accordion>
      ))}

      <h2 className={fr.cx("fr-h4", "fr-mt-4w")}>Données à extraire</h2>
      <Checkbox
        options={EXPORT_FIELDS.map((field) => ({
          label: field.label,
          nativeInputProps: {
            checked: selectedFields.includes(field.key),
            onChange: (e) => onChangeSelectedFields(field.key, e.target.checked),
          },
        }))}
        orientation="horizontal"
        small
      />

      <Button className={fr.cx("fr-mt-4w")} onClick={onExtractData} disabled={loading}>
        {loading ? "Extraction en cours…" : "Extraire"}
      </Button>

      {error && <p className={fr.cx("fr-error-text", "fr-mt-2w")}>{error}</p>}

      {results && (
        <div className={fr.cx("fr-mt-4w")}>
          <ResultsBlock
            className={fr.cx("fr-mb-2w")}
          >
            <p>
              {results.length} spécialité{results.length > 1 ? "s" : ""} trouvée{results.length > 1 ? "s" : ""}
            </p>
            <Button priority="secondary" onClick={onDownloadCSV} disabled={results.length === 0}>
              Télécharger en CSV
            </Button>
          </ResultsBlock>
          {results.length > 0 && (
            <ResultsTable>
              <Table
                bordered
                headers={activeFields.map((f) => f.label)}
                data={results.map((spec) => activeFields.map((f) => f.format(spec)))}
              />
            </ResultsTable>
          )}
        </div>
      )}
    </div>
  );
}
