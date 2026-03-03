"use client";

import ContentContainer from "../generic/ContentContainer";
import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import { SpecComposant, SpecDelivrance, SpecialiteStat, SubstanceNom } from "@/db/pdbmMySQL/types";
import { TagTypeEnum } from "@/types/TagType";
import PrincepsTag from "../tags/PrincepsTag";
import GenericTag from "../tags/GenericTag";
import PrescriptionTag from "../tags/PrescriptionTag";
import PediatricsTags from "../tags/PediatricsTags";
import { PresentationsList } from "../PresentationsList";
import { HTMLAttributes, lazy, Suspense, useCallback, useEffect, useState } from "react";
import styled from 'styled-components';
import type { AnchorMenu } from "./detailed/DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesResumeList from "../articles/ArticlesResumeList";
import MarrNotice from "../marr/MarrNotice";
import { Marr } from "@/types/MarrTypes";
import { NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import ShareButtons from "../generic/ShareButtons";

const DetailedSubMenu = lazy(() => import("./detailed/DetailedSubMenu"));
const DetailedNotice = lazy(() => import("./DetailedNotice"));
import QuestionsBox from "./QuestionsBox";
import QuestionKeywordsBox from "./QuestionKeywordsBox";
import GoTopButton from "../generic/GoTopButton";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { displayInfosImportantes } from "@/utils/notices/noticesUtils";
import { questionsList } from "@/data/pages/notices_anchors";
import NoticeBlock from "./NoticeBlock";
import PregnancyMentionTag from "../tags/PregnancyMentionTag";
import PregnancyPlanTag from "../tags/PregnancyPlanTag";
import { ATC } from "@/types/ATCTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { formatSpecName } from "@/displayUtils";
import { isAIP, isCentralisee } from "@/utils/specialites";
import { Presentation } from "@/types/PresentationTypes";
import { trackEvent } from "@/services/tracking";
import MedicamentContentHeader from "./MedicamentContentHeader";
import { FicheInfos } from "@/types/FicheInfoTypes";

const ToggleSwitchContainer = styled.div`
  background-color: var(--background-contrast-info);
  border: var(--border-open-blue-france) 1px solid;
  border-radius: 8px;
  filter: drop-shadow(var(--raised-shadow));
  .medicament-toggle-switch .fr-toggle__label {
    font-size: 1.125rem;
    @media (min-width: 48em){
      font-size: 1.25rem;
    }
    font-weight: 700;
  }
  .medicament-toggle-switch .fr-hint-text{
    color: var(--text-default-grey);
    margin-top: 0.3rem;
    font-style: italic;
    font-size: 0.9rem;
  }
`;

const Container = styled.div`
  @media (max-width: 48em) {
    margin-top: 0rem;
    .fr-mb-4w{
      margin-bottom: 1rem !important;
    }
  }
`;

const NoticeContainer = styled.div`
  padding: 2rem;
  @media (max-width: 48em) {
    padding: 1rem;
  }
`;

const NoticeTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 48em) {
    flex-direction: column;
    align-items: start;
  }
`;

interface MedicamentContentProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
  atcCode?: string;
  specialite?: DetailedSpecialite;
  composants: Array<SpecComposant & SubstanceNom>;
  isPrinceps: boolean;
  delivrance: SpecDelivrance[];
  isPregnancyPlanAlert: boolean;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: Presentation[];
  marr?: Marr;
  notice?: NoticeData;
  ficheInfos?: FicheInfos;
  articles: ArticleCardResume[];
}

function MedicamentContent({
  atcList,
  atc2,
  atcCode,
  specialite,
  composants,
  isPrinceps,
  delivrance,
  isPregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  notice,
  ficheInfos,
  articles,
  ...props
}: MedicamentContentProps) {

  const [currentMarr, setCurrentMarr] = useState<Marr>();

  const [currentPart, setcurrentPart] = useState<DetailsNoticePartsEnum>(DetailsNoticePartsEnum.INFORMATIONS_GENERALES);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [advancedAnchor, setAdvancedAnchor] = useState<AnchorMenu>();

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);

  const [lastLeftTagElement, setLastLeftTagElement] = useState<TagTypeEnum>(TagTypeEnum.SUBSTANCE);

  useEffect(() => {
    if (marr) {
      if (!isAdvanced) {
        //Que des patients
        const newMarr: Marr = {
          CIS: marr.CIS,
          ansmUrl: marr.ansmUrl,
          pdf: [],
        };
        marr.pdf.forEach((marrLine) => {
          if (marrLine.type === "Patients") newMarr.pdf.push(marrLine);
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
      if (enabled) trackEvent("Page médicament", "Version avancée");
    },
    [setIsAdvanced]
  );

  const onGoToAdvanced = useCallback(
    (anchor?: AnchorMenu) => {
      if (anchor) {
        setAdvancedAnchor(anchor);
      }
      setIsAdvanced(true);
    },
    [setAdvancedAnchor, setIsAdvanced]
  );

  const updateCurrentQuestion = (questionId: string) => {
    setCurrentQuestion(questionId);
    const question = questionsList[questionId];
    if (question.keywords || question.headerId) {
      setShowKeywordsBox(true);
    } else {
      setShowKeywordsBox(false);
    }
  };
  const onCloseQuestionKeywordsBox = () => {
    const noticeContainer = document.getElementById('noticeContainer');
    if (noticeContainer) {
      noticeContainer.className = "";
      setShowKeywordsBox(false);
      setCurrentQuestion("");
    }
  };
  const indicationBlock = notice?.children?.find(
    (child) => child.anchor === "Ann3bQuestceque"
  );

  const onScrollEvent = useCallback(() => {
    if (window.pageYOffset > window.innerHeight) {
      trackEvent("Page médicament", "Scroll");
      window.removeEventListener("scroll", onScrollEvent);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScrollEvent);
    }
    // Cleanup: remove listener on unmount to prevent memory leaks
    return () => {
      window.removeEventListener("scroll", onScrollEvent);
    };
  }, [onScrollEvent]);

  useEffect(() => {
    // Use to display or not the separator after a tag (left column)
    const lastTagElement: TagTypeEnum =
      (pediatrics && pediatrics.mention
        ? TagTypeEnum.PEDIATRIC_MENTION
        : (pediatrics && pediatrics.doctorAdvice
          ? TagTypeEnum.PEDIATRIC_DOCTOR_ADVICE
          : (pediatrics && pediatrics.contraindication
            ? TagTypeEnum.PEDIATRIC_CONTRAINDICATION
            : (pediatrics && pediatrics.indication
              ? TagTypeEnum.PEDIATRIC_INDICATION
              : (isPregnancyPlanAlert
                ? TagTypeEnum.PREGNANCY_PLAN
                : (isPregnancyMentionAlert
                  ? TagTypeEnum.PREGNANCY_MENTION
                  : (!!delivrance.length
                    ? TagTypeEnum.PRESCRIPTION
                    : ((specialite && !!specialite.SpecGeneId)
                      ? TagTypeEnum.GENERIC
                      : (isPrinceps
                        ? TagTypeEnum.PRINCEPS
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
    setLastLeftTagElement(lastTagElement);
  }, [pediatrics, isPregnancyPlanAlert, isPregnancyMentionAlert, delivrance, specialite, isPrinceps]);

  return (
    <Container className={fr.cx("fr-col-12", 'fr-mt-2w')}>
      <Container className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ",)}>
        <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")].join(" ",)}>
          <ShareButtons
            pageName={specialite ? formatSpecName(specialite.SpecDenom01) : ''}
          />
          <ToggleSwitchContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
            <ToggleSwitch
              label="Version détaillée"
              labelPosition="left"
              inputTitle="Version détaillée"
              helperText="Afficher RCP, données HAS, CNAM..."
              showCheckedHint={false}
              checked={isAdvanced}
              onChange={(enabled) => {
                onSwitchAdvanced(enabled);
              }}
              className="medicament-toggle-switch"
            />
          </ToggleSwitchContainer>
          {isAdvanced
            ? <Suspense fallback={null}>
                <DetailedSubMenu
                  updateVisiblePart={setcurrentPart}
                  isMarr={(currentMarr && currentMarr.pdf.length > 0)}
                  isInfosImportantes={displayInfosImportantes(ficheInfos)}
                  anchor={advancedAnchor}
                />
              </Suspense>
            : <section className={["mobile-display-contents", fr.cx("fr-mb-4w")].join(" ",)}>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                {atc2 && (
                  <TagContainer category="Sous-classe">
                    <ClassTag atc2={atc2} fromMedicament />
                  </TagContainer>
                )}
                {composants && (
                  <TagContainer category="Substance active" hideSeparator={lastLeftTagElement === TagTypeEnum.SUBSTANCE}>
                    <SubstanceTag composants={composants} fromMedicament />
                  </TagContainer>
                )}
                {(specialite && isPrinceps && !isAIP(specialite)) &&
                  <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PRINCEPS}>
                    <PrincepsTag
                      CIS={specialite.SpecId}
                      fromMedicament
                    />
                  </TagContainer>
                }
                {(specialite && !!specialite.SpecGeneId && !isAIP(specialite)) && (
                  <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.GENERIC}>
                    <GenericTag
                      specGeneId={specialite.SpecGeneId}
                      fromMedicament
                    />
                  </TagContainer>
                )}
                {!!delivrance.length && (
                  <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PRESCRIPTION}>
                    <PrescriptionTag />
                  </TagContainer>
                )}
                {isPregnancyPlanAlert && (
                  <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PREGNANCY_PLAN}>
                    <PregnancyPlanTag fromMedicament />
                  </TagContainer>
                )}
                {(!isPregnancyPlanAlert && isPregnancyMentionAlert) && (
                  <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PREGNANCY_MENTION}>
                    <PregnancyMentionTag fromMedicament />
                  </TagContainer>
                )}
                {pediatrics && (
                  <PediatricsTags
                    info={pediatrics}
                    fromMedicament
                    withSeparator
                    hideLast
                  />
                )}
              </ContentContainer>
              {(specialite && (specialite.StatId || specialite.SpecDateAMM)) && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  {specialite.statutAutorisation && (
                    <TagContainer category="Statut de l'autorisation" hideSeparator={!specialite.SpecDateAMM}>
                      <span className={fr.cx("fr-text--sm", 'fr-ml-1w')}>{specialite.statutAutorisation}</span>
                      {(specialite.StatId && Number(specialite.StatId) === SpecialiteStat.Abrogée && specialite.SpecStatDate) && (
                        <span className={fr.cx("fr-text--sm")}>{" "}le {(specialite.SpecStatDate).toLocaleDateString('fr-FR')}</span>
                      )}
                    </TagContainer>
                  )}
                  {specialite.SpecDateAMM && (
                    <TagContainer category="Date d'autorisation de mise sur le marché" hideSeparator>
                      <span className={fr.cx("fr-text--sm", 'fr-ml-1w')}>{(specialite.SpecDateAMM).toLocaleDateString('fr-FR')}</span>
                    </TagContainer>
                  )}
                </ContentContainer>
              )}
              {(notice && notice.children) && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-pt-1w", "fr-px-1w", "fr-hidden-md")}>
                  <QuestionsBox
                    noBorder
                    currentQuestion={currentQuestion}
                    updateCurrentQuestion={updateCurrentQuestion}
                  />
                </ContentContainer>
              )}
              {showKeywordsBox && currentQuestion && (
                <QuestionKeywordsBox
                  className={fr.cx("fr-hidden-md", "fr-mb-4w", "fr-px-1w")}
                  onClose={() => onCloseQuestionKeywordsBox()}
                  questionID={currentQuestion} />
              )}
              {presentations && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  <PresentationsList presentations={presentations} />
                </ContentContainer>
              )}
              {articles && articles.length > 0 && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  <ArticlesResumeList
                    articles={articles}
                    trackingFrom="Page médicament"
                  />
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
        <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")].join(" ",)}>
          <MedicamentContentHeader
            specialite={specialite}
            ficheInfos={ficheInfos}
          />
          {isAdvanced ? (
            <Suspense fallback={null}>
              <DetailedNotice
                currentVisiblePart={currentPart}
                atcCode={atcCode}
                specialite={specialite}
                composants={composants}
                isPrinceps={isPrinceps}
                isPregnancyPlanAlert={isPregnancyPlanAlert}
                isPregnancyMentionAlert={isPregnancyMentionAlert}
                pediatrics={pediatrics}
                presentations={presentations}
                marr={currentMarr}
                ficheInfos={ficheInfos}
                indicationBlock={indicationBlock}
                delivrance={delivrance}
              />
            </Suspense>
          ) : (
            <>
              <article>
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
                  <NoticeContainer>
                    <NoticeTitle className={fr.cx("fr-mb-4w")}>
                      <div style={{ display: "flex" }}>
                        <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")} />
                        <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
                      </div>
                      <ContentContainer>
                        {(notice && notice.dateNotif) && (
                          <Badge severity={"info"}>{notice.dateNotif}</Badge>
                        )}
                      </ContentContainer>
                    </NoticeTitle>
                    {(specialite && (notice || isCentralisee(specialite))) ? (
                      <>
                        {(notice && notice.children && notice.children.length > 0) && (
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
                          </>
                        )}
                        <NoticeBlock
                          notice={notice}
                          specialite={specialite}
                        />
                      </>
                    ) :
                      (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
                    }
                  </NoticeContainer>
                </ContentContainer>
              </article>
              <GoTopButton />
            </>
          )}
        </ContentContainer>
      </Container>
    </Container>
  );
};

export default MedicamentContent;
