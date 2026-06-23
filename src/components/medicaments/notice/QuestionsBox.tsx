"use client";

import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { HTMLAttributes, useState } from "react";
import styled from 'styled-components';
import { questionsList, questionKeys } from "@/data/pages/notices_anchors";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";
import Link from "next/link";

const QuestionsBoxContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const QuestionsRow = styled.div`
  display: inline-flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  @media (max-width: 48em) {
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    overflow-x: auto;
  }
`;

const QuestionLinkContainer = styled.div `
  cursor: pointer;
  :hover {
    text-decoration: underline;
  }
  .active {
    background-color: var(--background-alt-blue-france);
  }
  @media (max-width: 48em) {
    margin-bottom: 0.5rem !important;
  }
`;

const QuestionLink = styled.div `
  text-align: center;
  padding-top: 4px;
  img{
    width: 50px;
    height: 50px;
    @media (max-width: 48em) {
      width: 70px;
      height: 70px;
    }
  }
`;

const SearchRow = styled.div`
  display: flex;
  gap: ${fr.spacing("1w")};
  align-items: center;
  width: 100%;
`;

interface QuestionsBoxProps extends HTMLAttributes<HTMLDivElement> {
  currentQuestion: string | undefined;
  updateCurrentQuestion: (question: string) => void;
  updateNoticeContainerClassName: (className: string) => void;
  onSearch: (query: string) => void;
}

function QuestionsBox({
  currentQuestion,
  updateCurrentQuestion,
  updateNoticeContainerClassName,
  onSearch,
  ...props
}: QuestionsBoxProps) {
  const [searchValue, setSearchValue] = useState("");

  const onClick = (anchorData: QuestionAnchors) => {
    updateNoticeContainerClassName("highlight-" + anchorData.id);
    updateCurrentQuestion(anchorData.id);
    trackEvent("Boîte questions", anchorData.tracking);
  };

  const handleSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) onSearch(trimmed);
  };

  //href on the question is the first element of the anchors list
  return (
    <QuestionsBoxContainer {...props} className={[props.className, fr.cx("fr-p-1w")].join(" ")}>
      <QuestionsRow>
        {questionKeys.map((key: string, index) => (
          <QuestionLinkContainer
            key={index}
            className={currentQuestion && currentQuestion === key ? "active" : ""}
            onClick={() => onClick(questionsList[key])}
          >
            <QuestionLink
              className={[fr.cx("fr-mr-2w", "fr-mb-1w"), currentQuestion && currentQuestion === key ? "active" : ""].join(" ")}
            >
              <Image
                src={`/icons/${questionsList[key].icon}`}
                alt={`Icone ${questionsList[key].id}`}
                width={70}
                height={70}
              />
              <br/>
              <span className={fr.cx("fr-link", "fr-link--sm")}>
                {questionsList[key].question}
              </span>
            </QuestionLink>
          </QuestionLinkContainer>
        ))}
      </QuestionsRow>
      <SearchRow className={fr.cx("fr-mt-2w")}>
        <input
          className={fr.cx("fr-input")}
          placeholder="Posez votre question..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
        />
        <Button
          iconId="fr-icon-search-line"
          onClick={handleSearch}
          priority="tertiary"
          size="small"
          title="Rechercher"
        />
      </SearchRow>
    </QuestionsBoxContainer>
  );
};

export default QuestionsBox;
