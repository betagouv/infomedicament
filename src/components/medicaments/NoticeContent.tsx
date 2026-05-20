"use client";

import * as Sentry from "@sentry/nextjs";
import ContentContainer from "../generic/ContentContainer";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import { SpecComposant, SpecDelivrance, SpecialiteStat, SubstanceNom } from "@/db/pdbmMySQL/types";
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
import NoticeChunkResultsBox from "./notice/NoticeChunkResultsBox";
import Badge from "@codegouvfr/react-dsfr/Badge";
import { questionsList } from "@/data/pages/notices_anchors";
import { NoticeChunkHit } from "@/app/(container)/medicaments/[CIS]/notice-search/route";
import { QuestionAnchors } from "@/types/NoticesAnchors";
import NoticeBlock from "./notice/NoticeBlock";
import PregnancyMentionTag from "../tags/PregnancyMentionTag";
import PregnancyPlanTag from "../tags/PregnancyPlanTag";
import { ATC } from "@/types/ATCTypes";
import { PediatricsInfo } from "@/types/PediatricTypes";
import { SearchArticlesFilters } from "@/types/SearchTypes";
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
import GenericPrincepsTag from "../tags/GenericPrincepsTag";
import { getSpecialitePathologies } from "@/db/utils/indications";
import { PregnancyAlert } from "@/types/PregancyTypes";
import DesktopTitleBlock from "./blocks/DesktopTitleBlock";
import { ShortIndication } from "@/types/IndicationsTypes";

const NoticeContentContainer = styled.div`
  @media (max-width: 48em) {
    margin-top: 0rem;
    .fr-mb-4w{
      margin-bottom: 1rem !important;
    }
  }
  @media (min-width: 48em) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row-reverse;
  }
`;

const NoticeContainer = styled.div`
  padding: 2rem;
  @media (max-width: 48em) {
    padding: 1rem;
  }
`;

const DetailsContentContainer = styled.div`
  width: 100%;
  > div {
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
  pregnancyPlanAlert: PregnancyAlert | undefined;
  isPregnancyMentionAlert: boolean;
  pediatrics: PediatricsInfo | undefined;
  presentations: Presentation[];
  marr?: Marr;
  notice?: NoticeData;
  ficheInfos?: FicheInfos;
  definitions?: Definition[];
  indicationBlock?: NoticeRCPContentBlock;
  title: string;
  indications: ShortIndication[];
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
  pregnancyPlanAlert,
  isPregnancyMentionAlert,
  pediatrics,
  presentations,
  marr,
  notice,
  ficheInfos,
  definitions,
  indicationBlock,
  title,
  indications,
  onGoToAdvanced,
  onGoToAdvancedAnchor,
  ...props
}: NoticeContentProps) {

  const [articles, setArticles] = useState<ArticleCardResume[]>([]);
  const [currentMarr, setCurrentMarr] = useState<Marr>();

  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [noticeContainerClassName, setNoticeContainerClassName] = useState<string>("");
  const [noticeHits, setNoticeHits] = useState<NoticeChunkHit[] | null>(null);
  const [hitsLoading, setHitsLoading] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<QuestionAnchors | null>(null);

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

  const updateCurrentQuestion = async (questionId: string) => {
    const question = questionsList[questionId];
    setCurrentQuestion(questionId);
    const anchorEl = question.headerId ? document.getElementById(question.headerId) : null;
    if (anchorEl) {
      setActiveQuestion(question);
      setNoticeHits([{ section_anchor: question.headerId!, section_title: "", sub_header: null }]);
      return;
    }
    setActiveQuestion(question);
    setHitsLoading(true);
    setNoticeHits(null);
    if (question.queryText && specialite) {
      const res = await fetch(`/medicaments/${specialite.SpecId}/notice-search?q=${encodeURIComponent(question.queryText)}`);
      const data = await res.json();
      setNoticeHits(data.hits ?? []);
    }
    setHitsLoading(false);
  };
  const handleSearch = async (query: string) => {
    if (!specialite) return;
    setCurrentQuestion("");
    setActiveQuestion(null);
    setHitsLoading(true);
    setNoticeHits(null);
    const res = await fetch(`/medicaments/${specialite.SpecId}/notice-search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setNoticeHits(data.hits ?? []);
    setHitsLoading(false);
  };
  const onCloseResults = () => {
    setNoticeHits(null);
    setActiveQuestion(null);
    setCurrentQuestion("");
    setHitsLoading(false);
    setNoticeContainerClassName("");
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
          pathologiesList: await getSpecialitePathologies(spec.SpecId),
        };
        const newArticles = await getArticlesFromFilters(articlesFilters);
        setArticles(newArticles);
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
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-md-5")].join(" ")}>
        <DetailsContentContainer className={["mobile-display-contents", fr.cx("fr-mb-2w")].join(" ")}>
          <DesktopTitleBlock
            title={title}
            isAdvanced={false}
            onGoToAdvanced={onGoToAdvanced}
          />
          <MedicamentContentHeaderBlock
            className={fr.cx("fr-hidden-md")}
            specialite={specialite}
            ficheInfos={ficheInfos}
            definitions={definitions}
            pregnancyPlanAlert={pregnancyPlanAlert}
            isPregnancyMentionAlert={isPregnancyMentionAlert}
            pediatrics={pediatrics}
          />
          <SwitchNoticeAdvancedBlock
            isAdvanced={false}
            onGoToAdvanced={onGoToAdvanced}
            className={fr.cx("fr-mb-2w", "fr-hidden-md")}
          />
          <IndicationsBlock
            specialite={specialite}
            indicationBlock={indicationBlock}
            title="À quoi sert-il ?"
            resizable
            small
            indications={indications}
          />
          {(notice && notice.children) && (
            <ContentContainer 
              whiteContainer 
              className={fr.cx("fr-mb-2w", "fr-pt-1w", "fr-px-1w", "fr-hidden-md")}
              mobileOverflowX
            >
              <QuestionsBox
                currentQuestion={currentQuestion}
                updateCurrentQuestion={updateCurrentQuestion}
                updateNoticeContainerClassName={setNoticeContainerClassName}
                onSearch={handleSearch}
              />
            </ContentContainer>
          )}
          {(hitsLoading || noticeHits !== null) && (
            <NoticeChunkResultsBox
              className={fr.cx("fr-hidden-md", "fr-mb-2w", "fr-px-1w")}
              hits={noticeHits ?? []}
              loading={hitsLoading}
              questionLabel={activeQuestion?.question}
              onClose={onCloseResults}/>
          )}
          <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
            {(atc2 || 
              (specialite && !isAIP(specialite) && (isPrinceps || !!specialite.SpecGeneId)) 
              || !!delivrance.length) && (
              <TagContainer>
                <DetailsContainer>
                  {atc2 && (
                    <ClassTag atc2={atc2} fromMedicament/>
                  )}
                  {!!delivrance.length && (
                    <PrescriptionTag hideIcon/>
                  )}
                  {(specialite && isPrinceps && !isAIP(specialite)) && (
                    <GenericPrincepsTag
                      id={specialite.SpecId}
                      type="princeps"
                      fromMedicament
                      hideIcon
                      noLink
                    />
                  )}
                  {(specialite && !!specialite.SpecGeneId && !isAIP(specialite)) && (
                    <GenericPrincepsTag
                      id={specialite.SpecGeneId}
                      type="generic"
                      fromMedicament
                      hideIcon
                      noLink
                    />
                  )}
                </DetailsContainer>
                
              </TagContainer>
            )}
            {composants && (
              <TagContainer 
                category="Substance active" 
                inLine
                className="notice-content-tag-container"
              >
                <SubstanceTag composants={composants} fromMedicament/>
              </TagContainer>
            )}
            {(pregnancyPlanAlert || isPregnancyMentionAlert || pediatrics) && (
              <TagContainer
                className="notice-content-tag-container"
              >
                  {pregnancyPlanAlert && (
                    <PregnancyPlanTag fromMedicament/>
                  )}
                  {(!pregnancyPlanAlert && isPregnancyMentionAlert) && (
                    <PregnancyMentionTag fromMedicament/>
                  )}
                  {pediatrics && (
                    <PediatricsTags 
                      info={pediatrics} 
                      fromMedicament
                      hideLast
                    />
                  )}
              </TagContainer>
            )}
            <TagContainer 
              category="Statut d'autorisation" 
              hideSeparator
              inLine
            >
              {(specialite && specialite.statutAutorisation) ? (
                <span>
                  <span className={fr.cx("fr-text--sm", "fr-mb-0")}> 
                    {specialite.statutAutorisation}
                  </span>
                  {(specialite.StatId && Number(specialite.StatId) === SpecialiteStat.Abrogée && specialite.SpecStatDate) && (
                    <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                      {" "}le {(specialite.SpecStatDate).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </span>
              ) : (
                <span>Non communiqué</span>
              )}
            </TagContainer>
            <TagContainer 
              category="Date d'autorisation de mise sur le marché"
              inLine
              hideSeparator
            >
              {(specialite && specialite.SpecDateAMM) ? (
                <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                  {(specialite.SpecDateAMM).toLocaleDateString('fr-FR')}
                </span>
              ) : (
                <span>Non communiquée</span>
              )}
            </TagContainer>
          </ContentContainer>
          {presentations && (
            <ContentContainer 
              whiteContainer 
              className={fr.cx("fr-mb-2w", "fr-p-2w")}
              mobileOverflowX
            >
              <PresentationsList presentations={presentations} />
            </ContentContainer>
          )}
          {(articles && articles.length > 0) && (
            <ContentContainer 
              whiteContainer 
              className={fr.cx("fr-mb-2w", "fr-p-2w")} 
              mobileOverflowX
            >
              <ArticlesResumeList 
                articles={articles} 
                trackingFrom="Page médicament"
              />
            </ContentContainer>
          )}
          {(currentMarr && currentMarr.pdf.length > 0) && (
            <ContentContainer whiteContainer className={fr.cx("fr-mb-2w", "fr-p-2w")}>
              <MarrNotice 
                marr={currentMarr}
                onGoToAdvanced={onGoToAdvancedAnchor}
                hiddenTag
              />
            </ContentContainer>
          )}
        </DetailsContentContainer>
      </ContentContainer>
      <ContentContainer className={["mobile-display-contents", fr.cx("fr-col-12", "fr-col-md-7")].join(" ")}>
        <MedicamentContentHeaderBlock
          className={fr.cx("fr-hidden", "fr-unhidden-md")}
          specialite={specialite}
          ficheInfos={ficheInfos}
          definitions={definitions}
          pregnancyPlanAlert={pregnancyPlanAlert}
          isPregnancyMentionAlert={isPregnancyMentionAlert}
          pediatrics={pediatrics}
        />              
        {(notice && notice.children && notice.children.length > 0) && (
          <ContentContainer 
            whiteContainer
            className={fr.cx("fr-mb-2w", "fr-hidden", "fr-unhidden-md")}
          >
            <QuestionsBox
              currentQuestion={currentQuestion}
              updateCurrentQuestion={updateCurrentQuestion}
              updateNoticeContainerClassName={setNoticeContainerClassName}
              onSearch={handleSearch}
            />
          </ContentContainer>
        )}
        {(hitsLoading || noticeHits !== null) && (
          <NoticeChunkResultsBox
            className={fr.cx("fr-hidden", "fr-unhidden-md", "fr-mb-2w", "fr-px-1w")}
            hits={noticeHits ?? []}
            loading={hitsLoading}
            questionLabel={activeQuestion?.question}
            onClose={onCloseResults}
          />
        )}
        <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
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
              <NoticeBlock
                notice={notice}
                specialite={specialite}
                definitions={definitions}
                noticeContainerClassName={noticeContainerClassName}
              />
            ) :
              (<span>La notice n&rsquo;est pas disponible pour ce médicament.</span>)
            }
          </NoticeContainer>
        </ContentContainer>
      </ContentContainer>
    </NoticeContentContainer>
  );
};

export default NoticeContent;
