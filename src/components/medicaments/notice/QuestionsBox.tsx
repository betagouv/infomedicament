"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HTMLAttributes, useState } from "react";
import styled from "styled-components";
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";

const QuestionsBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const QuestionsRow = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: space-between;
  @media (max-width: 48em) {
    width: 100%;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;

const QuestionButton = styled.button`
  cursor: pointer;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    cursor: wait;
  }
  &[aria-pressed="true"] {
    background-color: var(--background-alt-blue-france);
  }
  @media (max-width: 48em) {
    flex-shrink: 0;
    margin-bottom: 0.5rem !important;
  }
`;

const QuestionLink = styled.span`
  display: block;
  text-align: center;
  padding-top: 4px;
  & img {
    width: 50px;
    height: 50px;
  }
  @media (max-width: 48em) {
    & img {
      width: 70px;
      height: 70px;
    }
  }
`;

const SearchRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  width: 100%;
  & input {
    min-width: 0;
  }
  & button {
    flex-shrink: 0;
  }
`;

interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {
  currentQuestion: string | undefined;
  updateCurrentQuestion: (question: string) => void;
  onSearch: (query: string) => void;
  disabled?: boolean;
}

function QuestionsBox({
  currentQuestion,
  updateCurrentQuestion,
  onSearch,
  disabled = false,
  ...props
}: QuestionsBoxProps) {
  const [searchValue, setSearchValue] = useState("");

  const onClick = (anchorData: QuestionAnchors) => {
    updateCurrentQuestion(anchorData.id);
    trackEvent("Boîte questions", anchorData.tracking);
  };

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) onSearch(trimmed);
  };

  //href on the question is the first element of the anchors list
  return (
    <QuestionsBoxContainer
      {...props}
      className={[props.className, fr.cx("fr-p-1w")].join(" ")}
    >
      <QuestionsRow>
        {questionKeys.map((key: string, index) => (
          <QuestionButton
            type="button"
            disabled={disabled}
            aria-pressed={currentQuestion === key}
            key={index}
            onClick={() => onClick(questionsList[key])}
          >
            <QuestionLink
              className={[
                fr.cx("fr-mr-2w", "fr-mb-1w"),
                currentQuestion && currentQuestion === key ? "active" : "",
              ].join(" ")}
            >
              <Image
                src={`/icons/${questionsList[key].icon}`}
                alt={`Icone ${questionsList[key].id}`}
                width={70}
                height={70}
              />
              <br />
              <span className={fr.cx("fr-link", "fr-link--sm")}>
                {questionsList[key].question}
              </span>
            </QuestionLink>
          </QuestionButton>
        ))}
      </QuestionsRow>
      <SearchRow className={[fr.cx("fr-mt-2w")].join(" ")}>
        <input
          aria-label="Rechercher dans la notice"
          disabled={disabled}
          className={fr.cx("fr-input")}
          placeholder="Posez votre question..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <Button
          disabled={disabled}
          iconId="fr-icon-search-line"
          onClick={handleSearch}
          priority="tertiary"
          size="small"
          title="Rechercher"
        />
      </SearchRow>
    </QuestionsBoxContainer>
  );
}

export default QuestionsBox;
