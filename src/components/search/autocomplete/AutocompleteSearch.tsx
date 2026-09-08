"use client";

import { fr } from "@codegouvfr/react-dsfr";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useMemo, useState } from "react";
import { SearchBar } from "@codegouvfr/react-dsfr/SearchBar";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { trackSearchEvent } from "@/services/tracking";
import { AutocompleteSection, AutocompleteSuggestion, MatchReason } from "@/types/SearchTypes";

type SearchInputProps = {
  name: string;
  initialValue?: string;
  className?: string;
  id: string;
  placeholder: string;
  type: "search";
  onSearch?: (search: string) => void;
};

function formatMatchReason(matchReasons?: MatchReason[]): string | undefined {
  const substanceReason = matchReasons?.find((reason) => reason.type === "substance");
  if (substanceReason) return `contient ${substanceReason.label}`;

  const indicationReason = matchReasons?.find((reason) => reason.type === "indication");
  if (indicationReason) return `lié à ${indicationReason.label}`;

  return undefined;
}

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
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { data: autocompleteSections } = useSWR(
    inputValue ?? null,
    async (search) =>
      fetch(`/rechercher/autocomplete?s=${encodeURIComponent(search)}`, {
        cache: "force-cache",
      }).then((res) => res.json()),
    {
      keepPreviousData: true,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      fallbackData: [],
    },
  ) as { data: AutocompleteSection[] };

  const options = useMemo(
    () => (autocompleteSections ?? []).flatMap((section) => (
      section.items
    )),
    [autocompleteSections],
  );

  function optionIndex(sectionIndex: number, itemIndex: number) {
    return (autocompleteSections ?? [])
      .slice(0, sectionIndex)
      .reduce((count, section) => count + section.items.length, 0) + itemIndex;
  }

  function selectOption(option: AutocompleteSuggestion) {
    setInputValue(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
    trackSearchEvent(option.label);
    router.push(option.href);
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
          {(autocompleteSections ?? []).map((section, sectionIndex) => (
            <li key={section.type} role="presentation">
              <div
                style={{
                  padding: "8px 16px 4px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--text-mention-grey, #666)",
                  textTransform: "uppercase",
                }}
              >
                {section.title}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {section.items.map((option, itemIndex) => {
                  const index = optionIndex(sectionIndex, itemIndex);
                  const matchReason = formatMatchReason(option.matchReasons);
                  return (
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
                      <span>{option.label}</span>
                      {matchReason && (
                        <span
                          style={{
                            display: "block",
                            color: "var(--text-mention-grey, #666)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {matchReason}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
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
