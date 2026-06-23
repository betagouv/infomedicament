"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useState } from "react";
import { formatSpecName } from "@/displayUtils";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { trackSearchEvent } from "@/services/tracking";
import { SearchResultItem } from "@/types/SearchTypes";

type AutocompleteOption = {
  label: string;
  type: "group" | "specialite";
  specId?: string;
  score: number;
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

  // Build a mixed list: each spécialité (→ medicament page) plus its generic group
  // (→ full search page). The group entry is kept so users can still browse all variants.
  const options: AutocompleteOption[] = (() => {
    if (!searchResults) return [];
    const specOptions: AutocompleteOption[] = [];
    const groupScores = new Map<string, number>();
    for (const result of searchResults) {
      if (result.specName && result.specId) {
        specOptions.push({
          label: formatSpecName(result.specName),
          type: "specialite",
          specId: result.specId,
          score: result.score,
        });
      }
      if (result.groupName) {
        const groupLabel = formatSpecName(result.groupName);
        groupScores.set(groupLabel, Math.max(groupScores.get(groupLabel) ?? 0, result.score));
      }
    }
    const groupOptions: AutocompleteOption[] = [...groupScores.entries()].map(
      ([label, score]) => ({ label, type: "group", score }),
    );
    return [...groupOptions, ...specOptions]
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // on a tie, surface the group entry above its variants
        if (a.type !== b.type) return a.type === "group" ? -1 : 1;
        return a.label.localeCompare(b.label, "fr");
      })
      .filter((opt, i, arr) => arr.findIndex((o) => o.type === opt.type && o.label === opt.label) === i)
      .slice(0, 10);
  })();

  function selectOption(option: AutocompleteOption) {
    setInputValue(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
    if (option.type === "specialite") {
      trackSearchEvent(option.label);
      router.push(`/medicaments/${option.specId}`);
      return;
    }
    if (onSearch) {
      onSearch(option.label);
    } else {
      trackSearchEvent(option.label);
      router.push(`/rechercher?s=${option.label}`);
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
              key={`${option.type}-${option.label}-${index}`}
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
              {option.label}
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
}: {
  inputName: string;
  initialValue?: string;
  className?: string;
}) {

  const router = useRouter();

  const onButtonClick = (search: string) => {
    search && trackSearchEvent(search);
    router.push(`/rechercher?s=${search}`);
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
    </>
  );
}
