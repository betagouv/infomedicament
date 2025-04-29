"use client";

import ContentContainer from "../generic/ContentContainer";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { ATC } from "@/data/grist/atc";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import { Presentation, PresInfoTarif, SpecComposant, SubstanceNom } from "@/db/pdbmMySQL/types";
import { TagTypeEnum } from "@/types/TagType";
import PrincepsTag from "../tags/PrincepsTag";
import GenericTag from "../tags/GenericTag";
import PrescriptionTag from "../tags/PrescriptionTag";
import PregnancyTag from "../tags/PregnancyTag";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import PediatricsTags from "../tags/PediatricsTags";
import { PresentationsList } from "../PresentationsList";
import { Nullable } from "kysely";
import { PresentationDetail } from "@/db/types";
import { HTMLAttributes, useCallback, useState } from "react";
import styled, { css } from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";
import QuestionsBox from "./QuestionsBox";
import LeafletContainer from "./LeafletContainer";
import QuestionKeywordsBox from "./QuestionKeywordsBox";
import { questionsList } from "@/data/pages/notices_anchors";

const ToggleSwitchContainer = styled.div `
  background-color: var(--background-contrast-info);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  .medicament-toggle-switch .fr-hint-text{
    margin-top: 0rem;
    font-style: italic;
  }
`;

const Container  = styled.div `
  margin-bottom: 2rem;
  @media (max-width: 48em) {
    margin-bottom: 1rem;
  }
`;

const NoticeTitle = styled.div `
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 48em) {
    flex-direction: column;
    align-items: start;
  }
`;

interface SwitchNoticeProps extends HTMLAttributes<HTMLDivElement> {
  CIS: string;
  atc2: ATC;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId: string;
  isDelivrance: boolean;
  isPregnancyAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  leaflet?: any;
  leafletMaj?: string;
}

function SwitchNotice({
  CIS,
  atc2,
  composants,
  isPrinceps,
  SpecGeneId,
  isDelivrance,
  isPregnancyAlert,
  pediatrics,
  presentations,
  leaflet,
  leafletMaj,
  ...props
}: SwitchNoticeProps) {

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const onSwitchAdvanced = useCallback(
    (enabled: boolean) => {
      setIsAdvanced(enabled);
    },
    [setIsAdvanced]
  );

  const updateCurrentQuestion = (questionId: string) => {
    setCurrentQuestion(questionId);
    const question = questionsList[questionId];
    if(question.keywords || question.anchors) {
      setShowKeywordsBox(true);
    } else {
      setShowKeywordsBox(false);
    }
  };

  const onCloseQuestionKeywordsBox = () => {
    const leafletContainer = document.getElementById('leafletContainer');
    if(leafletContainer){
      leafletContainer.className = "";
      setShowKeywordsBox(false);
      setCurrentQuestion("");
    }
  };

  // Use to display or not the separator after a tag (left column)
  const lastTagElement: TagTypeEnum = (
    pediatrics && pediatrics.doctorAdvice
      ? TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE 
      : (pediatrics && pediatrics.contraindication
        ? TagTypeEnum.PEDIATRIC_CONTRAINDICATION 
        : (pediatrics && pediatrics.indication
          ? TagTypeEnum.PEDIATRIC_INDICATION
          : (isPregnancyAlert 
            ? TagTypeEnum.PREGNANCY 
            : (isDelivrance 
              ? TagTypeEnum.PRESCRIPTION 
              : (!!SpecGeneId 
                ? TagTypeEnum.GENERIC 
                : (isPrinceps
                  ? TagTypeEnum. PRINCEPS
                  : TagTypeEnum.SUBSTANCE
              )
            )
          )
        )
      )
    )
  );

  return (
    <>
      <ContentContainer className={["mobile-display-unset", fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")].join(" ",)}>
        <Container>
          <ToggleSwitchContainer className={fr.cx("fr-p-2w")}>
            <ToggleSwitch 
              label="Version détaillée"
              labelPosition="left"
              inputTitle="Version détaillée"
              helperText="(Afficher RCP, données HAS, CNAM...)"
              showCheckedHint={false}
              checked={isAdvanced}
              onChange={(enabled) => {
                onSwitchAdvanced(enabled);
              }}
              className="medicament-toggle-switch"
            />
          </ToggleSwitchContainer>
        </Container>
        {isAdvanced 
          ? <span>Infos avancées</span>
          : <section className="mobile-display-unset">
              <Container>
                <ContentContainer whiteContainer className={fr.cx("fr-p-2w")}>
                  <TagContainer category="Sous-classe">
                    <ClassTag atc2={atc2} />
                  </TagContainer>
                  <TagContainer category="Substance active" hideSeparator={lastTagElement === TagTypeEnum.SUBSTANCE}>
                    <SubstanceTag composants={composants} />
                  </TagContainer>
                  {isPrinceps && 
                    <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PRINCEPS}>
                      <PrincepsTag CIS={CIS} />
                    </TagContainer>
                  }
                  {!!SpecGeneId && (
                    <TagContainer hideSeparator={lastTagElement === TagTypeEnum.GENERIC}>
                      <GenericTag specGeneId={SpecGeneId} />
                    </TagContainer>
                  )}
                  {isDelivrance && (
                    <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PRESCRIPTION}>
                      <PrescriptionTag />
                    </TagContainer>
                  )}
                  {isPregnancyAlert && (
                    <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PREGNANCY}>
                      <PregnancyTag />
                    </TagContainer>
                  )}
                  {pediatrics && <PediatricsTags info={pediatrics} lastTagElement={lastTagElement}/>}
                </ContentContainer>
              </Container>
              <Container className={fr.cx("fr-hidden-md")}>
                <ContentContainer whiteContainer className={fr.cx("fr-pt-1w", "fr-px-1w")}>
                  <QuestionsBox 
                    noBorder
                    currentQuestion={currentQuestion}
                    updateCurrentQuestion={updateCurrentQuestion}
                  />
                </ContentContainer>
              </Container>
              {showKeywordsBox && currentQuestion && (
                <Container className={fr.cx("fr-hidden-md")}>
                  <QuestionKeywordsBox
                    className={fr.cx("fr-px-1w")}
                    onClose={() => onCloseQuestionKeywordsBox()}
                    questionID={currentQuestion}/>
                </Container>
              )}
              <ContentContainer whiteContainer className={fr.cx("fr-p-2w")}>
                <PresentationsList presentations={presentations} />
              </ContentContainer>
            </section>
          }
      </ContentContainer>
      {isAdvanced 
        ? <span>Infos avancées</span>
        : leaflet && 
          <ContentContainer className={["mobile-display-unset", fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")].join(" ",)}>
            <article>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
                <NoticeTitle className={fr.cx("fr-mb-3w")}>
                  <div style={{display: "flex"}}>
                    <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
                    <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
                  </div>
                  <ContentContainer>
                    {leafletMaj && <Badge severity={"info"}>{leafletMaj}</Badge>}
                  </ContentContainer>
                </NoticeTitle>
                <ContentContainer className={fr.cx("fr-hidden", "fr-unhidden-md")}>
                  <QuestionsBox 
                    currentQuestion={currentQuestion}
                    updateCurrentQuestion={updateCurrentQuestion}
                  />
                </ContentContainer>
                {showKeywordsBox && currentQuestion && (
                  <QuestionKeywordsBox
                    className={fr.cx("fr-hidden", "fr-unhidden-md")}
                    onClose={() => onCloseQuestionKeywordsBox()}
                    questionID={currentQuestion}/>
                )}
                <LeafletContainer className={fr.cx("fr-mt-3w")}>
                  <ContentContainer id="leafletContainer">
                    {leaflet}
                  </ContentContainer>
                </LeafletContainer>
              </ContentContainer>
            </article>
          </ContentContainer>
      }
    </>
  );
};

export default SwitchNotice;
