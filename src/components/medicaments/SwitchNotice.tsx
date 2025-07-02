"use client";

import ContentContainer from "../generic/ContentContainer";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { ATC } from "@/data/grist/atc";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import { Presentation, PresInfoTarif, SpecComposant, SpecDelivrance, SubstanceNom } from "@/db/pdbmMySQL/types";
import { TagTypeEnum } from "@/types/TagType";
import PrincepsTag from "../tags/PrincepsTag";
import GenericTag from "../tags/GenericTag";
import PrescriptionTag from "../tags/PrescriptionTag";
import { PediatricsInfo } from "@/data/grist/pediatrics";
import PediatricsTags from "../tags/PediatricsTags";
import { PresentationsList } from "../PresentationsList";
import { Nullable } from "kysely";
import { PresentationDetail } from "@/db/types";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import styled from 'styled-components';
import DetailedSubMenu from "./DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesResumeList from "../articles/ArticlesResumeList";
import MarrNotice from "../marr/MarrNotice";
import { Marr } from "@/types/MarrTypes";
import useSWR from "swr";
import { Notice, NoticeRCPContentBlock, Rcp } from "@/types/MedicamentTypes";
import { fetchJSON } from "@/utils/network";
import DetailedNotice from "./DetailedNotice";
import ShareButtons from "../generic/ShareButtons";
import QuestionsBox from "./QuestionsBox";
import QuestionKeywordsBox from "./QuestionKeywordsBox";
import GoTopButton from "../generic/GoTopButton";
import { RcpNoticeContainer } from "./Blocks/GenericBlocks";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { getContent } from "@/utils/notices/noticesUtils";
import { questionsList } from "@/data/pages/notices_anchors";
import { Definition } from "@/types/GlossaireTypes";
import NoticeContainer from "./NoticeContainer";
import PregnancySubsTag from "../tags/PregnancySubsTag";
import PregnancyCISTag from "../tags/PregnancyCISTag";

const ToggleSwitchContainer = styled.div `
  background-color: var(--background-contrast-info);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  .medicament-toggle-switch .fr-hint-text{
    margin-top: 0rem;
    font-style: italic;
  }
`;

const Container = styled.div `
  margin-top: 1rem;
  @media (max-width: 48em) {
    margin-top: 0rem;
    .fr-mb-4w{
      margin-bottom: 1rem !important;
    }
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
  name: string;
  atc2?: ATC;
  atcCode?: string;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  SpecGeneId?: string;
  delivrance: SpecDelivrance[];
  isPregnancySubsAlert: boolean;
  isPregnancyCISAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: (Presentation & Nullable<PresInfoTarif> & { details?: PresentationDetail })[];
  articles?: ArticleCardResume[];
  marr?: Marr;
}

function SwitchNotice({
  CIS,
  name,
  atc2,
  atcCode,
  composants,
  isPrinceps,
  SpecGeneId,
  delivrance,
  isPregnancySubsAlert,
  isPregnancyCISAlert,
  pediatrics,
  presentations,
  articles,
  marr,
  ...props
}: SwitchNoticeProps) {

  const [currentNotice, setCurrentNotice] = useState<Notice>();
  const [loaded, setLoaded] = useState<boolean>(false);
  const [currentMarr, setCurrentMarr] = useState<Marr>();

  const [currentPart, setcurrentPart] = useState<DetailsNoticePartsEnum>(DetailsNoticePartsEnum.INFORMATIONS_GENERALES);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [indicationBlock, setIndicationBlock] = useState<NoticeRCPContentBlock>();

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);

  useEffect(() => {
    if(marr){
      if(!isAdvanced){
        //Que des patients
        const newMarr: Marr = {
          CIS: marr.CIS,
          ansmUrl: marr.ansmUrl,
          pdf: [],
        };
        marr.pdf.forEach((marrLine) => {
          if(marrLine.type === "Patients") newMarr.pdf.push(marrLine);
        })
        setCurrentMarr(newMarr);
      } else {
        setCurrentMarr(marr);
      }
    }
  }, [isAdvanced, marr, setCurrentMarr]);
  
  const onSwitchAdvanced = useCallback(
    (enabled: boolean) => {
      setIsAdvanced(enabled);
    },
    [setIsAdvanced]
  );

  const onGoToAdvanced = useCallback(
    (ancre: string) => {
      setIsAdvanced(true);
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
    const noticeContainer = document.getElementById('noticeContainer');
    if(noticeContainer){
      noticeContainer.className = "";
      setShowKeywordsBox(false);
      setCurrentQuestion("");
    }
  };

  const { data: rcp } = useSWR<Rcp>(
    `/medicaments/notices/rcp?cis=${CIS}`,
    fetchJSON,
    { onError: (err) => console.warn('errorRCP >>', err), }
  );

  const { data: notice } = useSWR<Notice>(
    `/medicaments/notices?cis=${CIS}`,
    fetchJSON,
    { onError: (err) => console.warn('errorNotice >>', err), }
  );

  const { data: definitions } = useSWR<Definition[]>(
    `/glossaire/definitions`,
    fetchJSON,
    { onError: (err) => console.warn('errorDefinitions >>', err), }
  );

  useEffect(() => {
    if(notice) {
      setCurrentNotice(notice);
      setLoaded(true);
      if(notice.children){
        notice.children.forEach((child: NoticeRCPContentBlock) => {
          if(child.anchor === "Ann3bQuestceque"){
            setIndicationBlock(child);
          }
        })
      }
    }
  }, [notice, setIndicationBlock, setCurrentNotice, setLoaded]);

  // Use to display or not the separator after a tag (left column)
  const lastTagElement: TagTypeEnum = (
    pediatrics && pediatrics.mention
      ? TagTypeEnum.PEDIATRIC_MENTION 
      : (pediatrics && pediatrics.doctorAdvice
        ? TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE 
        : (pediatrics && pediatrics.contraindication
          ? TagTypeEnum.PEDIATRIC_CONTRAINDICATION
          : (pediatrics && pediatrics.indication
            ? TagTypeEnum.PEDIATRIC_INDICATION
            : (isPregnancySubsAlert 
              ? TagTypeEnum.PREGNANCY_SUBS 
              : (isPregnancyCISAlert 
                ? TagTypeEnum.PREGNANCY_CIS 
                : (!!delivrance.length 
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
      )
    )
  );

  return (
    <Container className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ",)}>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")].join(" ",)}>
        <ShareButtons 
          pageName={name}
        />
        <ToggleSwitchContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
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
        {isAdvanced 
          ? <DetailedSubMenu updateVisiblePart={setcurrentPart} isMarr={(currentMarr && currentMarr.pdf.length > 0)}/>
          : <section className={["mobile-display-contents", fr.cx("fr-mb-4w")].join(" ",)}>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                {atc2 && (
                  <TagContainer category="Sous-classe">
                    <ClassTag atc2={atc2} />
                  </TagContainer>
                )}
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
                {!!delivrance.length && (
                  <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PRESCRIPTION}>
                    <PrescriptionTag />
                  </TagContainer>
                )}
                {isPregnancyCISAlert && (
                  <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PREGNANCY_CIS}>
                    <PregnancyCISTag />
                  </TagContainer>
                )}
                {isPregnancySubsAlert && (
                  <TagContainer hideSeparator={lastTagElement === TagTypeEnum.PREGNANCY_SUBS}>
                    <PregnancySubsTag />
                  </TagContainer>
                )}
                {pediatrics && <PediatricsTags info={pediatrics} lastTagElement={lastTagElement}/>}
              </ContentContainer>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-pt-1w", "fr-px-1w", "fr-hidden-md")}>
                <QuestionsBox 
                  noBorder
                  currentQuestion={currentQuestion}
                  updateCurrentQuestion={updateCurrentQuestion}
                />
              </ContentContainer>
              {showKeywordsBox && currentQuestion && (
                <QuestionKeywordsBox
                  className={fr.cx("fr-hidden-md", "fr-mb-4w", "fr-px-1w")}
                  onClose={() => onCloseQuestionKeywordsBox()}
                  questionID={currentQuestion}/>
              )}
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                <PresentationsList presentations={presentations} />
              </ContentContainer>
              {articles && articles.length > 0 && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  <ArticlesResumeList articles={articles} />
                </ContentContainer>
              )}
              {(currentMarr && currentMarr.pdf.length > 0) && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  <MarrNotice 
                    marr={currentMarr}
                    onGoToAdvanced={onGoToAdvanced}
                  />
                </ContentContainer>
              )}
            </section>
          }
      </ContentContainer>
      {isAdvanced ? (
        <DetailedNotice 
          currentVisiblePart={currentPart}
          CIS={CIS}
          atcCode={atcCode}
          composants={composants}
          isPrinceps={isPrinceps}
          SpecGeneId={SpecGeneId}
          isPregnancySubsAlert={isPregnancySubsAlert}
          isPregnancyCISAlert={isPregnancyCISAlert}
          pediatrics={pediatrics}
          presentations={presentations}
          marr={currentMarr}
          rcp={rcp}
          indicationBlock={indicationBlock}
        />
      ) : (
        <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")].join(" ",)}>
          <article>
            <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
              <NoticeTitle className={fr.cx("fr-mb-4w")}>
                <div style={{display: "flex"}}>
                  <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
                  <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
                </div>
                <ContentContainer>
                  {(currentNotice && currentNotice.dateNotif) && (
                    <Badge severity={"info"}>{currentNotice.dateNotif}</Badge>
                  )}
                </ContentContainer>
              </NoticeTitle>
              {(currentNotice && currentNotice.children) ? (
                <>
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
                      questionID={currentQuestion}
                    />
                  )}
                  <NoticeContainer className={fr.cx("fr-mt-3w")}>
                    <ContentContainer id="noticeContainer">
                      <RcpNoticeContainer>{getContent(currentNotice.children, definitions)}</RcpNoticeContainer>
                    </ContentContainer>
                  </NoticeContainer>
                </>
              ) : (
                loaded && (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
              )}
            </ContentContainer>
          </article>
          <GoTopButton />
        </ContentContainer>
      )}
    </Container>
  );
};

export default SwitchNotice;
