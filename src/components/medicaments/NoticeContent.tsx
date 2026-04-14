"use client";

import * as Sentry from "@sentry/nextjs";
import ContentContainer from "../generic/ContentContainer";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import { SpecComposant, SpecDelivrance, SpecialiteStat, SubstanceNom } from "@/db/pdbmMySQL/types";
import PrincepsTag from "../tags/PrincepsTag";
import GenericTag from "../tags/GenericTag";
import PrescriptionTag from "../tags/PrescriptionTag";
import PediatricsTags from "../tags/PediatricsTags";
import { PresentationsList } from "./notice/PresentationsList";
import { HTMLAttributes, useCallback, useEffect, useState } from "react";
import styled from 'styled-components';
import { ArticleCardResume } from "@/types/ArticlesTypes";
import ArticlesResumeList from "../articles/ArticlesResumeList";
import { Marr } from "@/types/MarrTypes";
import { NoticeData, NoticeRCPContentBlock } from "@/types/SpecialiteTypes";
import QuestionsBox from "./notice/QuestionsBox";
import QuestionKeywordsBox from "./notice/QuestionKeywordsBox";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { questionsList } from "@/data/pages/notices_anchors";
import NoticeBlock from "./notice/NoticeBlock";
import PregnancyMentionTag from "../tags/PregnancyMentionTag";
import PregnancyPlanTag from "../tags/PregnancyPlanTag";
import { ATC } from "@/types/ATCTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { SearchArticlesFilters } from "@/types/SearchTypes";
import { getSpecialitePatho } from "@/db/utils/pathologies";
import { getArticlesFromFilters } from "@/db/utils/articles";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import { isAIP, isCentralisee } from "@/utils/specialites";
import { Presentation } from "@/types/PresentationTypes";
import MedicamentContentHeaderBlock from "./blocks/MedicamentContentHeaderBlock";
import { FicheInfos } from "@/types/FicheInfoTypes";
import { Definition } from "@/types/GlossaireTypes";
import SwitchNoticeAdvancedBlock from "./blocks/SwitchNoticeAdvancedBlock";
import MarrNotice from "../marr/MarrNotice";
import { AnchorMenu } from "./advanced/DetailedSubMenu";
import IndicationsBlock from "./blocks/IndicationsBlock";

const NoticeContentContainer = styled.div`
  @media (max-width: 48em) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column-reverse;
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

const DetailsContentContainer = styled.div`
  @media (max-width: 48em) {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`;

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

interface NoticeContentProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
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
  definitions?: Definition[];
  indicationBlock?: NoticeRCPContentBlock;
  onGoToAdvanced: (advanced: boolean) => void;
  onGoToAdvancedAnchor: (anchor?: AnchorMenu) => void;
}

function NoticeContent({
  atcList,
  atc2,
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
  definitions,
  indicationBlock,
  onGoToAdvanced,
  onGoToAdvancedAnchor,
  ...props
}: NoticeContentProps) {

  const [articles, setArticles] = useState<ArticleCardResume[]>([]);
  const [currentMarr, setCurrentMarr] = useState<Marr>();

  const [currentQuestion, setCurrentQuestion] = useState<string>();
  const [showKeywordsBox, setShowKeywordsBox] = useState<boolean>(false);

  useEffect(() => {
    if (marr) {
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
    }
  }, [marr, setCurrentMarr]);

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
  const loadData = useCallback(
    async (
      spec: DetailedSpecialite,
      composants: Array<SpecComposant & SubstanceNom>
    ) => {
      try {
        const articlesFilters: SearchArticlesFilters = {
          ATCList: atcList,
          substancesList: composants.map((compo) => compo.SubsId.trim()),
          specialitesList: [spec.SpecId],
          pathologiesList: await getSpecialitePatho(spec.SpecId),
        };
        const articles = await getArticlesFromFilters(articlesFilters);
        setArticles(articles);
      } catch (e) {
        Sentry.captureException(e);
      }
    },
    [atcList, setArticles]
  );

  useEffect(() => {
    if (specialite && composants) {
      loadData(specialite, composants);
    }
  }, [specialite, composants, loadData]);

  return (
    <NoticeContentContainer {...props} className={["mobile-display-contents", fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ")}>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-8", "fr-col-md-9")].join(" ")}>
        <MedicamentContentHeaderBlock
          specialite={specialite}
          ficheInfos={ficheInfos}
          definitions={definitions}
          className={fr.cx("fr-hidden", "fr-unhidden-md")}
        />
        <ContentContainer whiteContainer className={fr.cx("fr-mb-4w")}>
          <NoticeContainer>
            <div className={fr.cx("fr-mb-4w")}>
              <div style={{ display: "flex" }}>
                <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")} />
                <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
              </div>
              <ContentContainer>
                {(notice && notice.dateNotif) && (
                  <Badge severity={"info"}>{notice.dateNotif}</Badge>
                )}
              </ContentContainer>
            </div>
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
                  definitions={definitions}
                />
              </>
            ) :
              (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
            }
          </NoticeContainer>
        </ContentContainer>
      </ContentContainer>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-lg-4", "fr-col-md-3")].join(" ")}>
        <DetailsContentContainer className={fr.cx("fr-mb-4w")}>
          <MedicamentContentHeaderBlock
            specialite={specialite}
            ficheInfos={ficheInfos}
            definitions={definitions}
            className={fr.cx("fr-hidden-md")}
          />
          <SwitchNoticeAdvancedBlock
            isAdvanced={false}
            onGoToAdvanced={onGoToAdvanced}
            className={fr.cx("fr-hidden-md", "fr-mb-4w")}
          />
          <IndicationsBlock
            specialite={specialite}
            indicationBlock={indicationBlock}
            className={fr.cx("fr-hidden-md")}
          />
          <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
            {atc2 && (
              <TagContainer 
                hideSeparator={specialite && !isAIP(specialite) && (isPrinceps || !!specialite.SpecGeneId)}
                className={fr.cx("fr-mb-1w")}
              >
                <ClassTag atc2={atc2} fromMedicament/>
              </TagContainer>
            )}
            {((specialite && !isAIP(specialite) && (isPrinceps || !!specialite.SpecGeneId)) 
              || !!delivrance.length) && (
              <TagContainer>
                <DetailsContainer>
                  {!!delivrance.length && (
                    <PrescriptionTag hideIcon/>
                  )}
                  {(specialite && isPrinceps && !isAIP(specialite)) && 
                    <PrincepsTag 
                      CIS={specialite.SpecId} 
                      fromMedicament
                      hideIcon
                    />
                  }
                  {(specialite && !!specialite.SpecGeneId && !isAIP(specialite)) && (
                    <GenericTag 
                      specGeneId={specialite.SpecGeneId} 
                      fromMedicament
                      hideIcon
                    />
                  )}
                </DetailsContainer>
              </TagContainer>
            )}
            {composants && (
              <TagContainer 
                category="Substance active" 
                hideSeparator={specialite && (!!specialite.statutAutorisation || !!specialite.SpecDateAMM)}
                inLine
              >
                <SubstanceTag composants={composants} fromMedicament/>
              </TagContainer>
            )}
            {(specialite && specialite.statutAutorisation) && (
              <TagContainer 
                category="Statut de l'autorisation" 
                hideSeparator={!!specialite.SpecDateAMM}
                inLine
              >
                <span className={fr.cx("fr-text--sm", "fr-mb-0")}> 
                  {specialite.statutAutorisation}
                </span>
                {(specialite.StatId && Number(specialite.StatId) === SpecialiteStat.Abrogée && specialite.SpecStatDate) && (
                  <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                    {" "}le {(specialite.SpecStatDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </TagContainer>
            )}
            {(specialite && specialite.SpecDateAMM) && (
              <TagContainer 
                category="Date d'AMM"
                inLine
              >
                <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                  {(specialite.SpecDateAMM).toLocaleDateString('fr-FR')}
                </span>
              </TagContainer>
            )}
            <TagContainer>
              {(isPregnancyPlanAlert || isPregnancyMentionAlert || pediatrics) && (
                <>
                  {isPregnancyPlanAlert && (
                    <PregnancyPlanTag fromMedicament/>
                  )}
                  {(!isPregnancyPlanAlert && isPregnancyMentionAlert) && (
                    <PregnancyMentionTag fromMedicament/>
                  )}
                  {pediatrics && (
                    <PediatricsTags 
                      info={pediatrics} 
                      fromMedicament
                      hideLast
                    />
                  )}
                </>
              )}
            </TagContainer>
            <SwitchNoticeAdvancedBlock
              isAdvanced={false}
              onGoToAdvanced={onGoToAdvanced}
              className={fr.cx("fr-hidden", "fr-unhidden-md")}
            />
          </ContentContainer>
          {presentations && (
            <ContentContainer 
              whiteContainer 
              className={fr.cx("fr-mb-4w", "fr-p-2w")}
              mobileOverflowX
            >
              <PresentationsList presentations={presentations} />
            </ContentContainer>
          )}
          {articles && articles.length > 0 && (
            <ContentContainer 
              whiteContainer 
              className={fr.cx("fr-mb-4w", "fr-p-2w")} 
              mobileOverflowX
            >
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
                onGoToAdvanced={onGoToAdvancedAnchor}
              />
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
        </DetailsContentContainer>
      </ContentContainer>
    </NoticeContentContainer>
  );
};

export default NoticeContent;
