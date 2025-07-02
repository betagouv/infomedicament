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
import NoticeBlock from "./NoticeBlock";
import DetailedNotice from "./DetailedNotice";
import ShareButtons from "../generic/ShareButtons";
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

  const [currentMarr, setCurrentMarr] = useState<Marr>();

  const [currentPart, setcurrentPart] = useState<DetailsNoticePartsEnum>(DetailsNoticePartsEnum.INFORMATIONS_GENERALES);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const [indicationBlock, setIndicationBlock] = useState<NoticeRCPContentBlock>();

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

  useEffect(() => {
    if(notice && notice.children){
      notice.children.forEach((child: NoticeRCPContentBlock) => {
        if(child.anchor === "Ann3bQuestceque"){
          setIndicationBlock(child);
        }
      })
    }
  }, [notice]);

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
    <>
      <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")}>
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
          : <section className={fr.cx("fr-mb-4w")}>
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
              {(presentations && presentations.length > 0) && (
                <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                  <PresentationsList presentations={presentations} />
                </ContentContainer>
              )}
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
        <NoticeBlock 
          notice={notice}
        />
      )}
    </>
  );
};

export default SwitchNotice;
