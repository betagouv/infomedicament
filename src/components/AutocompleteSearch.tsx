"use client";

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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

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
    ? searchResults.map((result) => formatSpecName(result.groupName)).filter(Boolean)
    : [];

  function selectOption(value: string) {
    setInputValue(value);
    setIsOpen(false);
    setActiveIndex(-1);
    if (onSearch) {
      onSearch(value);
    } else {
      trackSearchEvent(value);
      router.push(`/rechercher?s=${value}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && e.key === "ArrowDown") {
      setIsOpen(true);
      setActiveIndex(0);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectOption(options[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const listboxId = `${id}-listbox`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        id={id}
        role="combobox"
        aria-expanded={isOpen && options.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
        name={name}
        className={className}
        placeholder={placeholder}
        type={type}
        value={inputValue}
        autoComplete="off"
        style={{ textAlign: "left" }}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setIsOpen(false);
          setActiveIndex(-1);
        }}
      />
      {isOpen && options.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1300,
            textAlign: "left",
            margin: 0,
            padding: 0,
            listStyle: "none",
            backgroundColor: "var(--background-default-grey, #fff)",
            border: "1px solid var(--border-default-grey, #ccc)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          }}
        >
          {options.map((option, index) => (
            <li
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent input blur before selection
                selectOption(option);
              }}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                backgroundColor: index === activeIndex
                  ? "var(--background-alt-blue-france, #f0f0fb)"
                  : undefined,
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
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
