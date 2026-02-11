"use client";

import { Autocomplete } from "@mui/material";
import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useEffect, useState } from "react";
import { formatSpecName } from "@/displayUtils";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import useSWR from "swr";
import { SearchResultItem } from "@/db/utils/search";
import { useRouter } from "next/navigation";
import { trackSearchEvent } from "@/services/tracking";
import PregnancyPediatricFilters from "./search/PregnancyPediatricFilters";

type AutocompleteOption = {
  label: string;
  CIS?: string;
};

type SearchInputProps = {
  name: string;
  initialValue?: string;
  className?: string;
  id: string;
  placeholder: string;
  type: "search";
  onSearch?: (search: string) => void;
};

export function AutocompleteSearchInput({
  name,
  initialValue,
  className,
  id,
  placeholder,
  type,
  onSearch,
}: SearchInputProps) {

  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue ?? "");

  const { data: searchResults } = useSWR(
    inputValue ?? null,
    async (search) =>
      fetch(`/rechercher/results?s=${encodeURIComponent(search)}`, {
        cache: "force-cache",
      }).then((res) => res.json()),
    {
      keepPreviousData: true,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      fallbackData: [],
    },
  ) as { data: SearchResultItem[] };

  // Build options with dedup by label, preferring specialites (which carry a CIS)
  const options: AutocompleteOption[] = [];
  if (searchResults) {
    const seen = new Set<string>();
    searchResults.forEach((result) => {
      // Group name first (no CIS — navigates to search page)
      const groupLabel = formatSpecName(result.groupName);
      if (groupLabel && !seen.has(groupLabel)) {
        seen.add(groupLabel);
        options.push({ label: groupLabel });
      }
      // Then individual specialites (with CIS — navigates to /medicaments/{CIS})
      result.resumeSpecialites?.forEach((s) => {
        const specLabel = formatSpecName(s.SpecDenom01);
        if (specLabel && !seen.has(specLabel)) {
          seen.add(specLabel);
          options.push({ label: specLabel, CIS: s.SpecId });
        }
      });
    });
  }

  return (
    // Autocomplete<Value, Multiple, DisableClearable, FreeSolo>
    <Autocomplete<AutocompleteOption, false, false, true>
      freeSolo
      id={id}
      options={options}
      getOptionLabel={(option) => typeof option === "string" ? option : option.label}
      isOptionEqualToValue={(option, value) => option.label === value.label}
      filterOptions={(x) => x}
      autoComplete
      inputValue={inputValue}
      onInputChange={(_, value) => {
        setInputValue(value);
      }}
      onChange={(_, value, reason) => {
        if (reason === "selectOption" && value) {
          // value can be a string (freeSolo) or an AutocompleteOption object
          const label = typeof value === "string" ? value : value.label;
          const CIS = typeof value === "string"
            ? options.find((o) => o.label === value)?.CIS
            : value.CIS;

          if (CIS) {
            router.push(`/medicaments/${CIS}`);
          } else if (onSearch) {
            onSearch(label);
          } else {
            trackSearchEvent(label);
            router.push(`/rechercher?s=${label}`);
          }
        }
      }}
      slotProps={{ popper: { style: { zIndex: 1300 } } }}
      style={{ width: "100%" }}
      renderInput={(params) => (
        <div ref={params.InputProps.ref}>
          <input
            {...params.inputProps}
            name={name}
            className={cx(params.InputProps.className, className)}
            placeholder={placeholder}
            type={type}
          />
        </div>
      )}
    />
  );
}

export default function AutocompleteSearch({
  inputName,
  initialValue,
  className: parentClassName,
  hideFilters,
  filterPediatric,
  filterPregnancy,
}: {
  inputName: string;
  initialValue?: string;
  className?: string;
  hideFilters?: boolean;
  filterPediatric?: boolean;
  filterPregnancy?: boolean;
}) {

  const router = useRouter();
  const [currentFilterPregnancy, setFilterPregnancy] = useState<boolean>(false);
  const [currentFilterPediatric, setFilterPediatric] = useState<boolean>(false);

  useEffect(() => {
    if (filterPediatric)
      setFilterPediatric(filterPediatric)
    else setFilterPediatric(false);
  }, [filterPediatric, setFilterPediatric]);

  useEffect(() => {
    if (filterPregnancy)
      setFilterPregnancy(filterPregnancy)
    else setFilterPregnancy(false);
  }, [filterPregnancy, setFilterPregnancy]);

  const onButtonClick = (search: string) => {
    search && trackSearchEvent(search);
    router.push(`/rechercher?g=${currentFilterPregnancy}&p=${currentFilterPediatric}&s=${search}`);
  };

  return (
    <>
      <SearchBar
        label={"Que cherchez-vous ?"}
        onButtonClick={(search: string) => onButtonClick(search)}
        renderInput={({ className, ...props }) => (
          <AutocompleteSearchInput
            {...props}
            className={cx(className, parentClassName)}
            name={inputName}
            initialValue={initialValue}
            onSearch={onButtonClick}
          />
        )}
        className={fr.cx("fr-mb-2w")}
      />
      {!hideFilters && (
        <PregnancyPediatricFilters
          setFilterPregnancy={setFilterPregnancy}
          setFilterPediatric={setFilterPediatric}
          filterPregnancy={currentFilterPregnancy}
          filterPediatric={currentFilterPediatric}
        />
      )}
    </>
  );
}
