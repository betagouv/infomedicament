"use client";

import { Autocomplete } from "@mui/material";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useState } from "react";
import { formatSpecName } from "@/displayUtils";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import useSWR from "swr";
import { SearchResultItem } from "@/db/utils/search";
import { useRouter } from "next/navigation";
import { trackSearchEvent } from "@/services/tracking";

type SearchInputProps = {
  name: string;
  initialValue?: string;
  className?: string;
  id: string;
  placeholder: string;
  type: "search";
};

export function AutocompleteSearchInput({
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

  const options = searchResults
    ? searchResults
        .map((result): string | string[] =>
          "NomLib" in result
            ? result.NomLib
            : "groupName" in result
              ? result.groupName
              : "NomPatho" in result
                ? result.NomPatho
                : [
                    result.class.label,
                    ...result.subclasses.map((x) => x.label),
                  ],
        )
        .flat()
        .map(formatSpecName)
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
          value && trackSearchEvent(value);
          //console.log("search -- Matomo - 3");
          router.push(`/rechercher?s=${value}`);
        }
      }}
      disablePortal
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

  const onButtonClick = (search: string) => {
    search && trackSearchEvent(search);
    //console.log("search -- Matomo - 4");
    router.push(`/rechercher?s=${search}`);
  };

  return (
    <SearchBar
      label={"Que cherchez-vous ?"}
      onButtonClick={(search: string) => onButtonClick(search)}
      renderInput={({ className, ...props }) => (
        <AutocompleteSearchInput
          {...props}
          className={cx(className, parentClassName)}
          name={inputName}
          initialValue={initialValue}
        />
      )}
    />
  );
}
