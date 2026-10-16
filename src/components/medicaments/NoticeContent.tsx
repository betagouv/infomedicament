"use client";

import ContentContainer from "../generic/ContentContainer";
import { WithMedicamentData, type MedicamentData } from "./MedicamentData";
import {
  IndicationsLoading,
  DetailsLoading,
  NoticeTextLoading,
} from "./MedicamentSectionLoading";
import { SkeletonLine } from "../generic/Skeleton";
import TagContainer from "../tags/TagContainer";
import ClassTag from "../tags/ClassTag";
import { fr } from "@codegouvfr/react-dsfr";
import SubstanceTag from "../tags/SubstanceTag";
import type { CompositionComponent } from "@/types/SubstanceTypes";
import PrescriptionTag from "../tags/PrescriptionTag";
import PediatricsTags from "../tags/PediatricsTags";
import { PresentationsList } from "./notice/PresentationsList";
import { HTMLAttributes, Suspense, useState } from "react";
import styled from "styled-components";
import ArticlesResumeList from "../articles/ArticlesResumeList";
import { DelivranceCondition, SpecialiteStat } from "@/types/SpecialiteTypes";
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
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import {
  isAIP,
  isCentralisee,
  isHospitalDelivrance,
} from "@/utils/specialites";
import { Presentation } from "@/types/PresentationTypes";
import MedicamentContentHeaderBlock from "./blocks/MedicamentContentHeaderBlock";
import SwitchNoticeAdvancedBlock from "./blocks/SwitchNoticeAdvancedBlock";
import MarrNotice from "../marr/MarrNotice";
import { AnchorMenu } from "./advanced/DetailedSubMenu";
import IndicationsBlock from "./blocks/IndicationsBlock";
import GenericPrincepsTag from "../tags/GenericPrincepsTag";
import DesktopTitleBlock from "./blocks/DesktopTitleBlock";
import HospitalTag from "../tags/HospitalTag";
import { isReimbursable } from "@/utils/presentations";
import ReimbursableTag from "../tags/ReimbursableTag";
import { VideosBlock } from "./notice/VideosBlock";

const NoticeContentContainer = styled.div`
  flex-direction: row-reverse;
  @media (max-width: 48em) {
    display: contents;
    & .fr-mb-4w {
      margin-bottom: 1rem !important;
    }
  }
`;

const NoticeColumn = styled(ContentContainer)`
  @media (max-width: 48em) {
    display: contents;
  }
`;

const DetailsContentContainer = styled.div`
  width: 100%;
  & > div {
    width: 100%;
  }
  @media (max-width: 48em) {
    display: contents;
  }
`;

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const NoticeContainer = styled.div`
  padding: 2rem;
  @media (max-width: 48em) {
    padding: 1rem;
  }
`;

interface NoticeContentProps extends HTMLAttributes<HTMLDivElement> {
  atcList: string[];
  atc2?: ATC;
  specialite?: DetailedSpecialite;
  composants: CompositionComponent[];
  delivrance: DelivranceCondition[];
  presentations: Presentation[];
  title: string;
  data: Promise<MedicamentData>;
  onGoToAdvanced: (advanced: boolean) => void;
  onGoToAdvancedAnchor: (anchor?: AnchorMenu) => void;
}

function NoticeContent({
  atcList,
  atc2,
  specialite,
  composants,
  delivrance,
  presentations,
  title,
  data,
  onGoToAdvanced,
  onGoToAdvancedAnchor,
  ...props
}: NoticeContentProps) {
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [noticeHits, setNoticeHits] = useState<NoticeChunkHit[] | null>(null);
  const [hitsLoading, setHitsLoading] = useState<boolean>(false);
  const [activeQuestion, setActiveQuestion] = useState<QuestionAnchors | null>(
    null,
  );

  const updateCurrentQuestion = async (questionId: string) => {
    const question = questionsList[questionId];
    setCurrentQuestion(questionId);
    const anchorEl = question.headerId
      ? document.getElementById(question.headerId)
      : null;
    if (anchorEl) {
      setActiveQuestion(question);
      setNoticeHits([
        {
          section_anchor: question.headerId!,
          section_title: "",
          sub_header: null,
        },
      ]);
      return;
    }
    setActiveQuestion(question);
    setHitsLoading(true);
    setNoticeHits(null);
    if (question.queryText && specialite) {
      const res = await fetch(
        `/medicaments/${specialite.SpecId}/notice-search?q=${encodeURIComponent(question.queryText)}`,
      );
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
    const res = await fetch(
      `/medicaments/${specialite.SpecId}/notice-search?q=${encodeURIComponent(query)}`,
    );
    const data = await res.json();
    setNoticeHits(data.hits ?? []);
    setHitsLoading(false);
  };
  const onCloseResults = () => {
    setNoticeHits(null);
    setActiveQuestion(null);
    setCurrentQuestion("");
    setHitsLoading(false);
  };
  return (
    <NoticeContentContainer
      {...props}
      className={[fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ")}
    >
      <NoticeColumn className={[fr.cx("fr-col-12", "fr-col-md-5")].join(" ")}>
        <DetailsContentContainer className={[fr.cx("fr-mb-2w")].join(" ")}>
          <DesktopTitleBlock
            title={title}
            isAdvanced={false}
            onGoToAdvanced={onGoToAdvanced}
          />
          <Suspense fallback={null}>
            <WithMedicamentData data={data}>
              {({
                ficheInfos,
                definitions,
                pregnancyPlanAlert,
                isPregnancyMentionAlert,
                pediatrics,
              }) => (
                <MedicamentContentHeaderBlock
                  className={fr.cx("fr-hidden-md")}
                  specialite={specialite}
                  ficheInfos={ficheInfos}
                  definitions={definitions}
                  pregnancyPlanAlert={pregnancyPlanAlert}
                  isPregnancyMentionAlert={isPregnancyMentionAlert}
                  pediatrics={pediatrics}
                />
              )}
            </WithMedicamentData>
          </Suspense>
          <SwitchNoticeAdvancedBlock
            isAdvanced={false}
            onGoToAdvanced={onGoToAdvanced}
            className={fr.cx("fr-mb-2w", "fr-hidden-md")}
          />
          <Suspense fallback={<IndicationsLoading />}>
            <WithMedicamentData data={data}>
              {({ indications, indicationsBlock, definitions }) => (
                <IndicationsBlock
                  specialite={specialite}
                  title="À quoi sert-il ?"
                  small
                  resizable
                  indications={indications}
                  indicationsBlock={indicationsBlock}
                  definitions={definitions}
                />
              )}
            </WithMedicamentData>
          </Suspense>
          <ContentContainer
            whiteContainer
            className={fr.cx(
              "fr-mb-2w",
              "fr-pt-1w",
              "fr-px-1w",
              "fr-hidden-md",
            )}
            mobileOverflowX
          >
            <QuestionsBox
              currentQuestion={currentQuestion}
              updateCurrentQuestion={updateCurrentQuestion}
              onSearch={handleSearch}
            />
          </ContentContainer>
          {(hitsLoading || noticeHits !== null) && (
            <NoticeChunkResultsBox
              className={fr.cx("fr-hidden-md", "fr-mb-2w", "fr-px-1w")}
              hits={noticeHits ?? []}
              loading={hitsLoading}
              questionLabel={activeQuestion?.question}
              onClose={onCloseResults}
            />
          )}
          <Suspense fallback={<DetailsLoading />}>
            <WithMedicamentData data={data}>
              {({
                isPrinceps,
                pregnancyPlanAlert,
                isPregnancyMentionAlert,
                pediatrics,
                articles,
                videos,
                marr,
              }) => (
                <>
                  <ContentContainer
                    whiteContainer
                    className={fr.cx("fr-mb-2w", "fr-p-2w")}
                  >
                    {(atc2 ||
                      (specialite &&
                        !isAIP(specialite) &&
                        (isPrinceps || specialite.genericGroupCode !== null)) ||
                      !!delivrance.length) && (
                      <TagContainer>
                        <DetailsContainer>
                          {atc2 && <ClassTag atc2={atc2} fromMedicament />}
                          {!!delivrance.length && <PrescriptionTag hideIcon />}
                          {isReimbursable(presentations) && (
                            <ReimbursableTag hideIcon />
                          )}
                          {isHospitalDelivrance(delivrance) && (
                            <HospitalTag hideIcon />
                          )}
                          {specialite &&
                            isPrinceps &&
                            specialite.genericGroupCode !== null &&
                            !isAIP(specialite) && (
                              <GenericPrincepsTag
                                genericGroupCode={specialite.genericGroupCode}
                                type="princeps"
                                fromMedicament
                                hideIcon
                                noLink
                              />
                            )}
                          {specialite &&
                            specialite.genericGroupCode !== null &&
                            !isPrinceps &&
                            !isAIP(specialite) && (
                              <GenericPrincepsTag
                                genericGroupCode={specialite.genericGroupCode}
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
                        <SubstanceTag composants={composants} fromMedicament />
                      </TagContainer>
                    )}
                    {(pregnancyPlanAlert ||
                      isPregnancyMentionAlert ||
                      pediatrics) && (
                      <TagContainer className="notice-content-tag-container">
                        {pregnancyPlanAlert && (
                          <PregnancyPlanTag fromMedicament />
                        )}
                        {!pregnancyPlanAlert && isPregnancyMentionAlert && (
                          <PregnancyMentionTag fromMedicament />
                        )}
                        {pediatrics && (
                          <PediatricsTags info={pediatrics} fromMedicament />
                        )}
                      </TagContainer>
                    )}
                    <TagContainer
                      category="Statut d'autorisation"
                      hideSeparator
                      inLine
                    >
                      {specialite && specialite.statutAutorisation ? (
                        <span>
                          <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                            {specialite.statutAutorisation}
                          </span>
                          {specialite.StatId &&
                            Number(specialite.StatId) ===
                              SpecialiteStat.Abrogée &&
                            specialite.SpecStatDate && (
                              <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                                {" "}
                                le{" "}
                                {specialite.SpecStatDate.toLocaleDateString(
                                  "fr-FR",
                                )}
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
                      {specialite && specialite.SpecDateAMM ? (
                        <span className={fr.cx("fr-text--sm", "fr-mb-0")}>
                          {specialite.SpecDateAMM.toLocaleDateString("fr-FR")}
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
                  {articles && articles.length > 0 && (
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
                  {videos && videos.length > 0 && (
                    <ContentContainer
                      whiteContainer
                      className={fr.cx("fr-mb-2w", "fr-p-2w")}
                    >
                      <VideosBlock videos={videos} />
                    </ContentContainer>
                  )}
                  {marr &&
                    marr.pdf.some(
                      (document) => document.type === "Patients",
                    ) && (
                      <ContentContainer
                        whiteContainer
                        className={fr.cx("fr-mb-2w", "fr-p-2w")}
                      >
                        <MarrNotice
                          marr={{
                            ...marr!,
                            pdf: marr!.pdf.filter(
                              (document) => document.type === "Patients",
                            ),
                          }}
                          onGoToAdvanced={onGoToAdvancedAnchor}
                          hiddenTag
                        />
                      </ContentContainer>
                    )}
                </>
              )}
            </WithMedicamentData>
          </Suspense>
        </DetailsContentContainer>
      </NoticeColumn>
      <NoticeColumn className={[fr.cx("fr-col-12", "fr-col-md-7")].join(" ")}>
        <Suspense fallback={null}>
          <WithMedicamentData data={data}>
            {({
              ficheInfos,
              definitions,
              pregnancyPlanAlert,
              isPregnancyMentionAlert,
              pediatrics,
            }) => (
              <MedicamentContentHeaderBlock
                className={fr.cx("fr-hidden", "fr-unhidden-md")}
                specialite={specialite}
                ficheInfos={ficheInfos}
                definitions={definitions}
                pregnancyPlanAlert={pregnancyPlanAlert}
                isPregnancyMentionAlert={isPregnancyMentionAlert}
                pediatrics={pediatrics}
              />
            )}
          </WithMedicamentData>
        </Suspense>
        <ContentContainer
          whiteContainer
          className={fr.cx("fr-mb-2w", "fr-hidden", "fr-unhidden-md")}
        >
          <QuestionsBox
            currentQuestion={currentQuestion}
            updateCurrentQuestion={updateCurrentQuestion}
            onSearch={handleSearch}
          />
        </ContentContainer>
        {(hitsLoading || noticeHits !== null) && (
          <NoticeChunkResultsBox
            className={fr.cx(
              "fr-hidden",
              "fr-unhidden-md",
              "fr-mb-2w",
              "fr-px-1w",
            )}
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
                <span
                  className={[
                    "fr-icon--custom-notice",
                    fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md"),
                  ].join(" ")}
                />
                <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>Notice complète</h2>
              </div>
              <ContentContainer>
                <Suspense
                  fallback={<SkeletonLine width="7rem" height="1.5rem" />}
                >
                  <WithMedicamentData data={data}>
                    {({ notice }) =>
                      notice?.dateNotif ? (
                        <Badge severity="info">{notice.dateNotif}</Badge>
                      ) : null
                    }
                  </WithMedicamentData>
                </Suspense>
              </ContentContainer>
            </div>
            <Suspense fallback={<NoticeTextLoading />}>
              <WithMedicamentData data={data}>
                {({ notice, definitions }) =>
                  specialite && (notice || isCentralisee(specialite)) ? (
                    <NoticeBlock
                      notice={notice}
                      specialite={specialite}
                      definitions={definitions}
                    />
                  ) : (
                    <span>
                      La notice n&rsquo;est pas disponible pour ce médicament.
                    </span>
                  )
                }
              </WithMedicamentData>
            </Suspense>
          </NoticeContainer>
        </ContentContainer>
      </NoticeColumn>
    </NoticeContentContainer>
  );
}

export default NoticeContent;
