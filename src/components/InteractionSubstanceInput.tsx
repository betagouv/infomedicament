"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import styled from "styled-components";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { InteractionsSearchEntry } from "@/db/types";
import { fetchJSON } from "@/utils/network";

const Container = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
`;

const StyledInput = styled.input<{ $hasValue: boolean }>`
  width: 100%;
  text-align: left;
  padding-right: ${(p) => (p.$hasValue ? "2.5rem" : undefined)};
  ${(p) =>
    p.$hasValue &&
    `
    font-weight: bold;
    background-color: var(--background-alt-blue-france);
    border-color: var(--border-action-high-blue-france) !important;
    outline: none;
  `}
`;

const ClearButton = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
`;

const Listbox = styled.ul`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1300;
  margin: 0;
  padding: 0;
  list-style: none;
  background-color: var(--background-default-grey);
  border: 1px solid var(--border-default-grey);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const ListboxOption = styled.li<{ $active: boolean }>`
  padding: ${fr.spacing("1w")} ${fr.spacing("2w")};
  cursor: pointer;
  background-color: ${(p) =>
    p.$active ? "var(--background-alt-blue-france)" : "transparent"};
`;

type Props = {
  id: string;
  value: InteractionsSearchEntry | null;
  onSelect: (entry: InteractionsSearchEntry) => void;
  onClear: () => void;
};

export default function InteractionSubstanceInput({
  id,
  value,
  onSelect,
  onClear,
}: Props) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: options } = useSWR(
    inputValue.length >= 2 ? inputValue : null,
    (q) => fetchJSON<InteractionsSearchEntry[]>(`/interactions/search?q=${encodeURIComponent(q)}`),
    { keepPreviousData: true, fallbackData: [] }
  );

  function selectOption(entry: InteractionsSearchEntry) {
    setInputValue("");
    setIsOpen(false);
    setActiveIndex(-1);
    onSelect(entry);
  }

  function handleFocus() {
    if (value) {
      inputRef.current?.select();
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (value) {
      onClear();
    }
    setInputValue(e.target.value);
    setIsOpen(true);
    setActiveIndex(-1);
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
  const displayValue = value ? value.label : inputValue;

  return (
    <Container>
      <StyledInput
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={isOpen && options.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Nom de médicament ou de substance active"
          type="text"
          value={displayValue}
          $hasValue={!!value}
          className={fr.cx("fr-input")}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
            setActiveIndex(-1);
          }}
        />
        {value && (
          <ClearButton>
            <Button
              type="button"
              priority="tertiary no outline"
              iconId="fr-icon-close-line"
              title="Effacer"
              size="small"
              onClick={() => {
                onClear();
                setInputValue("");
                inputRef.current?.focus();
              }}
            />
          </ClearButton>
        )}
      {isOpen && options.length > 0 && (
        <Listbox id={listboxId} role="listbox">
          {options.map((option, index) => (
            <ListboxOption
              key={option.id}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              $active={index === activeIndex}
              onMouseEnter={() => index !== activeIndex && setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(option);
              }}
            >
              {option.label}
            </ListboxOption>
          ))}
        </Listbox>
      )}
    </Container>
  );
}
