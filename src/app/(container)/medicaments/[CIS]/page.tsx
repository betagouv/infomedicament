import React from "react";
import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import { fr } from "@codegouvfr/react-dsfr";
import {
  displaySimpleComposants,
  formatSpecName,
} from "@/displayUtils";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { getAtc1, getAtc2, getAtcCode } from "@/data/grist/atc";
import { getSpecialite, getSpecialiteGroupName } from "@/db/utils";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import liste_CIS_MVP from "@/liste_CIS_MVP.json";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { getPregnancyCISAlert, getPregnancySubsAlerts } from "@/data/grist/pregnancy";
import { getPediatrics } from "@/data/grist/pediatrics";
import ContentContainer from "@/components/generic/ContentContainer";
import SwitchNotice from "@/components/medicaments/SwitchNotice";
import { SearchArticlesFilters } from "@/types/SearchTypes";
import { getArticlesFromFilters } from "@/data/grist/articles";
import { getMarr } from "@/data/grist/marr";
import { Marr } from "@/types/MarrTypes";
import Link from "next/link";

export const dynamic = "error";
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ CIS: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { CIS } = await props.params;

  const { specialite } = await getSpecialite(CIS);
  if (!specialite) return notFound();

  const name = formatSpecName(specialite.SpecDenom01);
  return {
    title: `${name} - ${(await parent).title?.absolute}`,
  };
}

export default async function Page(props: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await props.params;

  if (!liste_CIS_MVP.includes(CIS)) notFound();

  const { specialite, composants, presentations, delivrance } =
    await getSpecialite(CIS);

  //if (!specialite) return notFound();
  //if (!presentations.length) return notFound();

  const atcCode = getAtcCode(CIS);
  const atc1 = atcCode ? await getAtc1(atcCode) : undefined;
  const atc2 = atcCode ? await getAtc2(atcCode) : undefined;
  const isPrinceps =
    !!(await pdbmMySQL
      .selectFrom("Specialite")
      .select("Specialite.SpecId")
      .where("Specialite.SpecGeneId", "=", CIS)
      .executeTakeFirst()) &&
    !!(await pdbmMySQL
      .selectFrom("GroupeGene")
      .select("GroupeGene.SpecId")
      .where("GroupeGene.SpecId", "=", CIS)
      .executeTakeFirst());

  const pregnancySubsAlert = (await getPregnancySubsAlerts()).find((s) =>
    composants.find((c) => Number(c.SubsId.trim()) === Number(s.id)),
  );
  const pregnancyCISAlert = await getPregnancyCISAlert(CIS);

  const pediatrics = await getPediatrics(CIS);

  const atcList = [];
  const breadcrumb = [
    { label: "Accueil", linkProps: { href: "/" } },
  ];
  if(atc1){
    atcList.push(atc1.code.trim());
    breadcrumb.push({ label: atc1.label, linkProps: { href: `/atc/${atc1.code}` } });
  }
  if(atc2){
    atcList.push(atc2.code.trim());
    breadcrumb.push({ label: atc2.label, linkProps: { href: `/atc/${atc2.code}` } });
  }
  if(composants){
    breadcrumb.push({
      label: displaySimpleComposants(composants)
        .map((s) => s.NomLib.trim())
        .join(", "),
      linkProps: {
        href: `/substances/${displaySimpleComposants(composants)
          .map((s) => s.NomId.trim())
          .join(",")}`,
      },
    });
  }
  if(specialite){
    breadcrumb.push({
      label: formatSpecName(getSpecialiteGroupName(specialite)),
      linkProps: {
        href: `/rechercher?s=${formatSpecName(getSpecialiteGroupName(specialite))}`,
      },
    });
  }

  const articlesFilters:SearchArticlesFilters = {
    ATCList: atcList,
    substancesList: composants.map((compo) => compo.SubsId.trim()),
    specialitesList: [CIS],
    pathologiesList: []
  };
  const articles = await getArticlesFromFilters(articlesFilters);
  const marr: Marr = await getMarr(CIS);

  return (
    <>
      <ContentContainer frContainer>
        <Breadcrumb
          segments={breadcrumb}
          currentPageLabel={
            specialite ? formatSpecName(specialite.SpecDenom01).replace(
              formatSpecName(getSpecialiteGroupName(specialite)),
              "",
            ) : ""}
          className={fr.cx("fr-mb-2w")}
        />
        <h1 className={fr.cx("fr-h2")}>
          {specialite ? formatSpecName(specialite.SpecDenom01) : ''}
        </h1>
      </ContentContainer>
      <ContentContainer className={fr.cx("fr-pt-1w", "fr-pb-2w")} style={{
            backgroundColor:
              fr.colors.decisions.background.alt.grey.default,
          }}>

        <ContentContainer frContainer>              
          <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
            {(pregnancySubsAlert || pregnancyCISAlert || pediatrics?.contraindication )&& (
              <ContentContainer className={fr.cx("fr-col-12", "fr-mb-2w")}>
                {pregnancySubsAlert && (
                  <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
                    <Alert
                      severity={"warning"}
                      title={"Plan de prévention grossesse"}
                      description={
                        <p>
                          Ce médicament est concerné par un{" "}
                          <Link href="https://ansm.sante.fr/dossiers-thematiques/medicaments-et-grossesse/les-programmes-de-prevention-des-grossesses" target="_blank" rel="noopener noreferrer">
                            plan de prévention grossesse
                          </Link>.<br/>
                          Il peut présenter des risques pour le fœtus (malformations, effets toxiques).<br/>
                          Lisez attentivement la notice et parlez-en à un professionnel de santé avant toute utilisation.
                          <br />
                          <a target="_blank" href={pregnancySubsAlert.link} rel="noopener noreferrer">
                            En savoir plus sur le site de l’ANSM
                          </a>
                        </p>
                      }
                    />
                  </ContentContainer>
                )}
                {pregnancyCISAlert && (
                  <ContentContainer whiteContainer className={fr.cx("fr-mb-2w")}>
                    <Alert
                      severity={"warning"}
                      title={"Mention contre-indication grossesse"}
                      description={
                        <p>
                          Ce médicament peut présenter des précautions d’usage pendant la grossesse ou l’allaitement. Il peut être autorisé, déconseillé ou contre-indiqué selon les cas.<br/>
                          Lisez la notice et demandez l’avis d’un professionnel de santé avant toute prise.
                        </p>
                      }
                    />
                  </ContentContainer>
                )}
                {pediatrics?.contraindication && (
                  <ContentContainer whiteContainer>
                    <Alert
                      severity={"warning"}
                      title={
                        "Il existe une contre-indication pédiatrique (vérifier selon l’âge)."
                      }
                    />
                  </ContentContainer>
                )}
              </ContentContainer>
            )}
            <SwitchNotice 
              CIS={CIS}
              name={specialite ? formatSpecName(specialite.SpecDenom01) : ''}
              atc2={atc2}
              atcCode={atcCode}
              composants={composants}
              isPrinceps={isPrinceps}
              SpecGeneId={specialite ? specialite.SpecGeneId : ""}
              delivrance={delivrance}
              isPregnancySubsAlert={!!pregnancySubsAlert}
              isPregnancyCISAlert={pregnancyCISAlert}
              pediatrics={pediatrics}
              presentations={presentations}
              articles={articles}
              marr={marr}
            />
          </div>
        </ContentContainer>
      </ContentContainer>
    </>
  );
}
