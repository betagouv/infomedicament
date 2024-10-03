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
  className?: string;
  id: string;
  placeholder: string;
  type: "search";
};

function SearchInput({ className, id, placeholder, type }: SearchInputProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");

  const { data: searchResults } = useSWR(
    search === inputValue ? search : null, // if search then input value has changed
    async (search) =>
      fetch(`/rechercher/results?s=${encodeURIComponent(search)}`).then((res) =>
        res.json(),
      ),
    {
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
      onInputChange={(_, value) => {
        setInputValue(value);
        setTimeout(
          () => setSearch(value),
          200, // Wait for user to stop typing to launch search
        );
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
            className={cx(params.InputProps.className, className)}
            placeholder={placeholder}
            type={type}
          />
        </div>
      )}
    />
  );
}

export default function AutocompleteSearch() {
  const router = useRouter();
  return (
    <SearchBar
      label={"Quel médicament cherchez-vous ?"}
      onButtonClick={(search: string) => router.push(`/rechercher?s=${search}`)}
      renderInput={(props: SearchInputProps) => <SearchInput {...props} />}
    />
  );
}
