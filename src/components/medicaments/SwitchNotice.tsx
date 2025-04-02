"use client";

import ContentContainer from "../genericContent/ContentContainer";
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
import { HTMLAttributes, PropsWithChildren, useCallback, useState } from "react";
import styled, { css } from 'styled-components';
import Badge from "@codegouvfr/react-dsfr/Badge";

const ToggleSwitchContainer = styled.div `
  .medicament-toggle-switch .fr-hint-text{
    margin-top: 0rem;
    font-style: italic;
  }
`;

interface OwnProps extends HTMLAttributes<HTMLDivElement> {
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
  children,
  ...props
}: PropsWithChildren<OwnProps>) {

  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);
  const onSwitchAdvanced = useCallback(
    (enabled: boolean) => {
      setIsAdvanced(enabled);
    },
    [setIsAdvanced]
  );

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
      <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-3", "fr-col-md-3")}>
        <ToggleSwitchContainer className={fr.cx("fr-mb-4w")}>
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
          ? <span>Infos avancées</span>
          : <section className={fr.cx("fr-mb-4w")}>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
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
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-2w")}>
                <PresentationsList presentations={presentations} />
              </ContentContainer>
            </section>
          }
      </ContentContainer>
      {isAdvanced 
        ? <span>Infos avancées</span>
        : leaflet && 
          <ContentContainer className={fr.cx("fr-col-12", "fr-col-lg-9", "fr-col-md-9")}>
            <article>
              <ContentContainer whiteContainer className={fr.cx("fr-mb-4w", "fr-p-4w")}>
                <div className={fr.cx("fr-mb-4w")} style={{display: "flex", justifyContent: "space-between", alignItems: "center", }}>
                  <div style={{display: "flex"}}>
                    <span className={["fr-icon--custom-notice", fr.cx("fr-mr-1w", "fr-hidden", "fr-unhidden-md")].join(" ")}/>
                    <h2 className={fr.cx("fr-h3", "fr-mb-1w")}>
                      <span className={fr.cx("fr-hidden-md")}>Notice</span>
                      <span className={fr.cx("fr-hidden", "fr-unhidden-md")}>Notice complète</span>
                    </h2>
                  </div>
                  {leafletMaj && <Badge severity={"info"}>{leafletMaj}</Badge>}
                </div>
                {leaflet}
              </ContentContainer>
            </article>
          </ContentContainer>
      }
    </>
  );
};

export default SwitchNotice;
