"use client";

import { Autocomplete } from "@mui/material";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useState } from "react";
import { formatSpecName } from "@/displayUtils";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import useSWR from "swr";
import { SearchResultItem } from "@/db/search";
import { useRouter } from "next/navigation";

type SearchInputProps = {
  name: string;
  initialValue?: string;
  className?: string;
  id: string;
  placeholder: string;
  type: "search";
};

function SearchInput({
  name,
  initialValue,
  className,
  id,
  placeholder,
  type,
}: SearchInputProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialValue ?? "");

  const { data: searchResults } = useSWR(
    inputValue ?? null,
    async (search) =>
      fetch(`/rechercher/results?s=${encodeURIComponent(search)}`).then((res) =>
        res.json(),
      ),
    {
      keepPreviousData: true,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      fallbackData: [],
    },
  ) as { data: SearchResultItem[] };

  const options = searchResults
    ? searchResults.map((result) =>
        formatSpecName("NomLib" in result ? result.NomLib : result.groupName),
      )
    : [];

  return (
    <Autocomplete
      freeSolo
      id={id}
      options={options}
      filterOptions={(x) => x}
      autoComplete
      inputValue={inputValue}
      onInputChange={(_, value) => {
        setInputValue(value);
      }}
      onChange={(_, value, reason) => {
        if (reason === "selectOption") {
          router.push(`/rechercher?s=${value}`);
        }
      }}
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
}: {
  inputName: string;
  initialValue?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <SearchBar
      label={"Quel médicament cherchez-vous ?"}
      onButtonClick={(search: string) => router.push(`/rechercher?s=${search}`)}
      renderInput={({ className, ...props }) => (
        <SearchInput
          {...props}
          className={cx(className, parentClassName)}
          name={inputName}
          initialValue={initialValue}
        />
      )}
    />
  );
}
