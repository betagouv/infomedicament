"use client";

import * as Sentry from "@sentry/nextjs";
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
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import styled from 'styled-components';
import DetailedSubMenu from "./detailed/DetailedSubMenu";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesResumeList from "../articles/ArticlesResumeList";
import MarrNotice from "../marr/MarrNotice";
import { Marr } from "@/types/MarrTypes";
import { FicheInfos, NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import DetailedNotice from "./DetailedNotice";
import ShareButtons from "../generic/ShareButtons";
import QuestionsBox from "./QuestionsBox";
import QuestionKeywordsBox from "./QuestionKeywordsBox";
import GoTopButton from "../generic/GoTopButton";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { displayInfosImportantes } from "@/utils/notices/noticesUtils";
import { questionsList } from "@/data/pages/notices_anchors";
import NoticeBlock from "./NoticeBlock";
import PregnancyMentionTag from "../tags/PregnancyMentionTag";
import PregnancyPlanTag from "../tags/PregnancyPlanTag";
import Link from "next/link";
import { ATC } from "@/types/ATCTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { getNotice } from "@/db/utils/notice";
import { SearchArticlesFilters } from "@/types/SearchTypes";
import { getSpecialitePatho } from "@/db/utils/pathologies";
import { getArticlesFromFilters } from "@/data/grist/articles";
import { getFicheInfos } from "@/db/utils/ficheInfos";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { formatSpecName } from "@/displayUtils";
import { isAIP, isCentralisee, isCommercialisee } from "@/utils/specialites";
import { Presentation } from "@/types/PresentationTypes";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { trackEvent } from "@/services/tracking";
import Image from "next/image";

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
  ...props
}: MedicamentContentProps) {

  const [currentSpec, setCurrentSpec] = useState<DetailedSpecialite>();
  const [currentPresentations, setCurrentPresentations] = useState<Presentation[]>([]);

  const [notice, setNotice] = useState<NoticeData>();
  const [indicationBlock, setIndicationBlock] = useState<NoticeRCPContentBlock>();
  const [ficheInfos, setFicheInfos] = useState<FicheInfos>();
  const [articles, setArticles] = useState<ArticleCardResume[]>([]);
  const [currentMarr, setCurrentMarr] = useState<Marr>();
  const [loaded, setLoaded] = useState<boolean>(false);

  const [currentPart, setcurrentPart] = useState<DetailsNoticePartsEnum>(DetailsNoticePartsEnum.INFORMATIONS_GENERALES);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);

  const [lastLeftTagElement, setLastLeftTagElement] = useState<TagTypeEnum>(TagTypeEnum.SUBSTANCE);

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
      if(enabled) trackEvent("Page médicament", "Version avancée");
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
    if(question.keywords || question.headerId) {
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
  const loadData = useCallback(
    async (
      spec: DetailedSpecialite,
      composants: Array<SpecComposant & SubstanceNom>
    ) => {
      try {
        const articlesFilters:SearchArticlesFilters = {
          ATCList: atcList,
          substancesList: composants.map((compo) => compo.SubsId.trim()),
          specialitesList: [spec.SpecId],
          pathologiesList: await getSpecialitePatho(spec.SpecId),
        };
        const articles = await getArticlesFromFilters(articlesFilters);
        setArticles(articles);

        if(!isCentralisee(spec)) {
          const newNotice = await getNotice(spec.SpecId);
          setNotice(newNotice);
          if(newNotice) {
            if(newNotice.children){
              newNotice.children.forEach((child: NoticeRCPContentBlock) => {
                if(child.anchor === "Ann3bQuestceque"){
                  setIndicationBlock(child);
                }
              })
            }
          }
        }
        const newFicheInfos = await getFicheInfos(spec.SpecId);
        setFicheInfos(newFicheInfos);
        setLoaded(true);
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [atcList, setArticles, setNotice, setIndicationBlock, setFicheInfos, setLoaded]
  );

  useEffect(() => {
    if(specialite && composants) {
      setCurrentSpec(specialite);
      loadData(specialite, composants);
    }
  }, [specialite, composants, setCurrentSpec, loadData]);

  useEffect(() => {
    if(presentations) 
      setCurrentPresentations(presentations);
  }, [presentations, setCurrentPresentations]);

 const onScrollEvent = useCallback(() => {
    if(window.pageYOffset > window.innerHeight){
      trackEvent("Page médicament", "Scroll");
      window.removeEventListener("scroll", onScrollEvent);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScrollEvent);
    }
  });

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
                    : ((currentSpec && !!currentSpec.SpecGeneId)
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
    setLastLeftTagElement(lastTagElement);
  }, [pediatrics, isPregnancyPlanAlert, isPregnancyMentionAlert, delivrance, currentSpec, isPrinceps])

  return (
    <Container className={fr.cx("fr-col-12", 'fr-mt-2w')}>
      <Container className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ",)}>
        <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")].join(" ",)}>
          <ShareButtons 
            pageName={currentSpec ? formatSpecName(currentSpec.SpecDenom01) : ''}
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
            ? <DetailedSubMenu 
                updateVisiblePart={setcurrentPart} 
                isMarr={(currentMarr && currentMarr.pdf.length > 0)}
                isInfosImportantes={displayInfosImportantes(ficheInfos)}
              />
            : <section className={["mobile-display-contents", fr.cx("fr-mb-4w")].join(" ",)}>
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  {atc2 && (
                    <TagContainer category="Sous-classe">
                      <ClassTag atc2={atc2} fromMedicament/>
                    </TagContainer>
                  )}
                  {composants && (
                    <TagContainer category="Substance active" hideSeparator={lastLeftTagElement === TagTypeEnum.SUBSTANCE}>
                      <SubstanceTag composants={composants} fromMedicament/>
                    </TagContainer>
                  )}
                  {(currentSpec && isPrinceps && !isAIP(currentSpec)) && 
                    <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PRINCEPS}>
                      <PrincepsTag CIS={currentSpec.SpecId} fromMedicament/>
                    </TagContainer>
                  }
                  {(currentSpec && !!currentSpec.SpecGeneId && !isAIP(currentSpec)) && (
                    <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.GENERIC}>
                      <GenericTag specGeneId={currentSpec.SpecGeneId} fromMedicament/>
                    </TagContainer>
                  )}
                  {!!delivrance.length && (
                    <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PRESCRIPTION}>
                      <PrescriptionTag />
                    </TagContainer>
                  )}
                  {isPregnancyPlanAlert && (
                    <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PREGNANCY_PLAN}>
                      <PregnancyPlanTag fromMedicament/>
                    </TagContainer>
                  )}
                  {(!isPregnancyPlanAlert && isPregnancyMentionAlert) && (
                    <TagContainer hideSeparator={lastLeftTagElement === TagTypeEnum.PREGNANCY_MENTION}>
                      <PregnancyMentionTag fromMedicament/>
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
                {(currentSpec && (currentSpec.StatId || currentSpec.SpecDateAMM)) && (
                  <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                    {currentSpec.statutAutorisation && (
                      <TagContainer category="Statut de l'autorisation" hideSeparator={!currentSpec.SpecDateAMM}>
                        <span className={fr.cx("fr-text--sm", 'fr-ml-1w')}>{currentSpec.statutAutorisation}</span>
                        {(currentSpec.StatId && currentSpec.StatId.toString() === SpecialiteStat.Abrogée.toString() && currentSpec.SpecStatDate) && (
                          <span className={fr.cx("fr-text--sm")}>{" "}le {(currentSpec.SpecStatDate).toLocaleDateString('fr-FR')}</span>
                        )}
                      </TagContainer>
                    )}
                    {currentSpec.SpecDateAMM && (
                      <TagContainer category="Date d'autorisation de mise sur le marché" hideSeparator>
                        <span className={fr.cx("fr-text--sm", 'fr-ml-1w')}>{(currentSpec.SpecDateAMM).toLocaleDateString('fr-FR')}</span>
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
                    questionID={currentQuestion}/>
                )}
                {currentPresentations && (
                  <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                    <PresentationsList presentations={currentPresentations} />
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
          {(currentPresentations && !isCommercialisee(currentPresentations)) && (
            <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
            <Alert
              description="Si vous prenez actuellement ce médicament, il vous est recommandé d'en parler avec votre médecin ou avec votre pharmacien qui pourra vous orienter vers un autre traitement."
              severity="info"
              title="Ce médicament n'est ou ne sera bientôt plus disponible sur le marché."
              small
            />
            </ContentContainer>
          )}
          {(currentSpec && isAIP(currentSpec)) && (
            <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")} style={{display: "flex"}}>
              <Image
                src="/icons/aip_aide.png"
                alt="AIP"
                width={32}
                height={17}
                className={fr.cx("fr-mr-1w", "fr-mt-1v")}
              />
              <div>
                Ce médicament est mis sur le marché en France en tant qu'importation parallèle
                {(currentSpec.generiqueName && currentSpec.SpecGeneId) && (
                  <>
                    {" "}du médicament{" "}
                    <Link
                      href={`/medicaments/${currentSpec.SpecGeneId}`}
                      aria-description="Lien vers le médicament"
                    >
                      {currentSpec.generiqueName}
                    </Link>
                  </>
                )}
                .<br/>
                L'importateur est{" "}
                {currentSpec.titulairesList 
                  ? (<span>{currentSpec.titulairesList}</span>)
                  : "nconnu"
                }.
              </div>
            </ContentContainer>
          )}
          {isAdvanced ? (
            <DetailedNotice 
              currentVisiblePart={currentPart}
              atcCode={atcCode}
              specialite={currentSpec}
              composants={composants}
              isPrinceps={isPrinceps}
              isPregnancyPlanAlert={isPregnancyPlanAlert}
              isPregnancyMentionAlert={isPregnancyMentionAlert}
              pediatrics={pediatrics}
              presentations={currentPresentations}
              marr={currentMarr}
              ficheInfos={ficheInfos}
              indicationBlock={indicationBlock}
            />
          ) : (
            <>
              <article>
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
                  <NoticeContainer>
                    <NoticeTitle className={fr.cx("fr-mb-4w")}>
                      <div style={{display: "flex"}}>
                        <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
                        <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
                      </div>
                      <ContentContainer>
                        {(notice && notice.dateNotif) && (
                          <Badge severity={"info"}>{notice.dateNotif}</Badge>
                        )}
                      </ContentContainer>
                    </NoticeTitle>
                    {loaded && (
                      <>
                        {(currentSpec && (notice || isCentralisee(currentSpec))) ? (
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
                              specialite={currentSpec}
                            />
                          </>
                        ) : 
                          (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
                        }
                      </>
                    )}
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
