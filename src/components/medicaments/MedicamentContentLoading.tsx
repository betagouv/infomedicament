"use client";

import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "../generic/ContentContainer";
import DesktopTitleBlock from "./blocks/DesktopTitleBlock";
import SwitchNoticeAdvancedBlock from "./blocks/SwitchNoticeAdvancedBlock";
import QuestionsBox from "./notice/QuestionsBox";
import {
  DetailsLoading,
  IndicationsLoading,
  NoticeTextLoading,
} from "./MedicamentSectionLoading";
import { SkeletonLine } from "../generic/Skeleton";
import styled from "styled-components";

const LoadingLayout = styled.div`
  flex-direction: row-reverse;
`;

const NoticeContainer = styled.div`
  padding: 2rem;
  @media (max-width: 48em) {
    padding: 1rem;
  }
`;

const NoticeTitle = styled.div`
  display: flex;
`;

const noop = () => {};

export default function MedicamentContentLoading({
  title,
  contained = false,
}: {
  title?: string;
  contained?: boolean;
}) {
  return (
    <ContentContainer frContainer={!contained}>
      <LoadingLayout
        className={[fr.cx("fr-grid-row", "fr-grid-row--gutters")].join(" ")}
      >
        <div className={fr.cx("fr-col-12", "fr-col-md-5")}>
          <DesktopTitleBlock
            title={title}
            isAdvanced={false}
            onGoToAdvanced={noop}
            loading
          />
          <SwitchNoticeAdvancedBlock
            isAdvanced={false}
            onGoToAdvanced={noop}
            disabled
            className={fr.cx("fr-hidden-md", "fr-mb-2w")}
          />
          <IndicationsLoading />
          <ContentContainer
            whiteContainer
            className={fr.cx("fr-mb-2w", "fr-hidden-md")}
          >
            <QuestionsBox
              currentQuestion=""
              updateCurrentQuestion={noop}
              onSearch={noop}
              disabled
            />
          </ContentContainer>
          <DetailsLoading />
        </div>
        <div className={fr.cx("fr-col-12", "fr-col-md-7")}>
          <ContentContainer
            whiteContainer
            className={fr.cx("fr-mb-2w", "fr-hidden", "fr-unhidden-md")}
          >
            <QuestionsBox
              currentQuestion=""
              updateCurrentQuestion={noop}
              onSearch={noop}
              disabled
            />
          </ContentContainer>
          <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
            <NoticeContainer>
              <div className={fr.cx("fr-mb-4w")}>
                <NoticeTitle>
                  <span
                    className={[
                      "fr-icon--custom-notice",
                      fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md"),
                    ].join(" ")}
                    aria-hidden="true"
                  />
                  <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>
                    Notice complète
                  </h2>
                </NoticeTitle>
                <SkeletonLine width="7rem" height="1.5rem" />
              </div>
              <NoticeTextLoading />
            </NoticeContainer>
          </ContentContainer>
        </div>
      </LoadingLayout>
    </ContentContainer>
  );
}
