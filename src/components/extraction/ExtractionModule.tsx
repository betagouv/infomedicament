"use client";

import { useMemo, useState } from "react";
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
  DEFAULT_EXTRACTION_FIELD_KEYS,
  EXTRACTION_FIELDS,
  ExtractionFieldKey,
  ExtractionRow,
  SubstanceOption,
} from "@/types/ExtractionTypes";

const SelectedTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${fr.spacing("1w")};
  margin: ${fr.spacing("2w")} 0;
`;

const SuggestionsList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 16rem;
  overflow-y: auto;
  border: 1px solid var(--border-default-grey);
`;

const SuggestionItem = styled.li`
  padding: ${fr.spacing("1w")} ${fr.spacing("2w")};
  cursor: pointer;
  &:hover {
    background-color: var(--background-alt-blue-france);
  }
`;

const MAX_SUGGESTIONS = 30;

export default function ExtractionModule({
  substanceOptions,
  atcOptions,
}: {
  substanceOptions: SubstanceOption[];
  atcOptions: AtcOption[];
}) {
  const [substanceQuery, setSubstanceQuery] = useState("");
  const [selectedSubstances, setSelectedSubstances] = useState<SubstanceOption[]>([]);
  const [selectedAtc2Codes, setSelectedAtc2Codes] = useState<string[]>([]);
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<ExtractionFieldKey[]>(
    DEFAULT_EXTRACTION_FIELD_KEYS,
  );
  const [results, setResults] = useState<ExtractionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atc1Groups = useMemo(() => {
    const map = new Map<string, { atc1Label: string; children: AtcOption[] }>();
    for (const option of atcOptions) {
      if (!map.has(option.atc1Code)) {
        map.set(option.atc1Code, { atc1Label: option.atc1Label, children: [] });
      }
      map.get(option.atc1Code)!.children.push(option);
    }
    return Array.from(map.entries()).map(([atc1Code, group]) => ({ atc1Code, ...group }));
  }, [atcOptions]);

  const suggestions = useMemo(() => {
    const query = normalizeString(substanceQuery.trim());
    if (query.length < 2) return [];
    return substanceOptions
      .filter((option) => normalizeString(option.nomLib).includes(query))
      .slice(0, MAX_SUGGESTIONS);
  }, [substanceQuery, substanceOptions]);

  function addSubstance(option: SubstanceOption) {
    setSelectedSubstances((current) =>
      current.some((s) => s.subsId === option.subsId && s.nomLib === option.nomLib)
        ? current
        : [...current, option],
    );
    setSubstanceQuery("");
  }

  function removeSubstance(option: SubstanceOption) {
    setSelectedSubstances((current) =>
      current.filter((s) => !(s.subsId === option.subsId && s.nomLib === option.nomLib)),
    );
  }

  function toggleAtc2(code: string, checked: boolean) {
    setSelectedAtc2Codes((current) =>
      checked ? [...current, code] : current.filter((c) => c !== code),
    );
  }

  function toggleField(key: ExtractionFieldKey, checked: boolean) {
    setSelectedFieldKeys((current) =>
      checked ? [...current, key] : current.filter((k) => k !== key),
    );
  }

  async function handleExtract() {
    setLoading(true);
    setError(null);
    try {
      const subsIds = [...new Set(selectedSubstances.map((s) => s.subsId))];
      const res = await fetch("/extraction/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subsIds,
          atc2Codes: selectedAtc2Codes,
          fieldKeys: selectedFieldKeys,
        }),
      });
      if (!res.ok) throw new Error("La requête a échoué");
      setResults(await res.json());
    } catch {
      setError("Une erreur est survenue pendant l'extraction. Merci de réessayer.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleDownloadCSV() {
    if (!results) return;
    const fields = EXTRACTION_FIELDS.filter((f) => selectedFieldKeys.includes(f.key));
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const header = fields.map((f) => escape(f.label)).join(";");
    const rows = results.map((spec) => fields.map((f) => escape(f.format(spec))).join(";"));
    const csv = [header, ...rows].join("\n");

    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "extraction-medicaments.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeFields = EXTRACTION_FIELDS.filter((f) => selectedFieldKeys.includes(f.key));

  return (
    <div>
      <h2 className={fr.cx("fr-text--lg", "fr-mt-4w")}>Substances actives</h2>
      <div className={fr.cx("fr-search-bar")} role="search">
        <label className={fr.cx("fr-label")} htmlFor="extraction-substance-search">
          Rechercher une substance
        </label>
        <input
          id="extraction-substance-search"
          className={fr.cx("fr-input")}
          type="text"
          value={substanceQuery}
          onChange={(e) => setSubstanceQuery(e.target.value)}
          placeholder="Ex : paracétamol"
          autoComplete="off"
        />
      </div>
      {suggestions.length > 0 && (
        <SuggestionsList>
          {suggestions.map((option) => (
            <SuggestionItem
              key={`${option.subsId}-${option.nomLib}`}
              onClick={() => addSubstance(option)}
            >
              {option.nomLib}
            </SuggestionItem>
          ))}
        </SuggestionsList>
      )}
      {selectedSubstances.length > 0 && (
        <SelectedTags>
          {selectedSubstances.map((option) => (
            <Tag
              key={`${option.subsId}-${option.nomLib}`}
              dismissible
              nativeButtonProps={{
                onClick: () => removeSubstance(option),
                "aria-label": `Retirer ${option.nomLib}`,
              }}
            >
              {option.nomLib}
            </Tag>
          ))}
        </SelectedTags>
      )}

      <h2 className={fr.cx("fr-text--lg", "fr-mt-4w")}>Classes ATC</h2>
      {atc1Groups.map((group) => (
        <Accordion key={group.atc1Code} label={group.atc1Label}>
          <Checkbox
            options={group.children.map((atc2) => ({
              label: atc2.atc2Label,
              nativeInputProps: {
                checked: selectedAtc2Codes.includes(atc2.atc2Code),
                onChange: (e) => toggleAtc2(atc2.atc2Code, e.target.checked),
              },
            }))}
            small
          />
        </Accordion>
      ))}

      <h2 className={fr.cx("fr-text--lg", "fr-mt-4w")}>Données à extraire</h2>
      <Checkbox
        options={EXTRACTION_FIELDS.map((field) => ({
          label: field.label,
          nativeInputProps: {
            checked: selectedFieldKeys.includes(field.key),
            onChange: (e) => toggleField(field.key, e.target.checked),
          },
        }))}
        orientation="horizontal"
        small
      />

      <Button className={fr.cx("fr-mt-4w")} onClick={handleExtract} disabled={loading}>
        {loading ? "Extraction en cours…" : "Extraire"}
      </Button>

      {error && <p className={fr.cx("fr-error-text", "fr-mt-2w")}>{error}</p>}

      {results && (
        <div className={fr.cx("fr-mt-4w")}>
          <div
            className={fr.cx("fr-mb-2w")}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <p>
              {results.length} spécialité{results.length > 1 ? "s" : ""} trouvée{results.length > 1 ? "s" : ""}
            </p>
            <Button priority="secondary" onClick={handleDownloadCSV} disabled={results.length === 0}>
              Télécharger en CSV
            </Button>
          </div>
          {results.length > 0 && (
            <Table
              bordered
              headers={activeFields.map((f) => f.label)}
              data={results.map((spec) => activeFields.map((f) => f.format(spec)))}
            />
          )}
        </div>
      )}
    </div>
  );
}
