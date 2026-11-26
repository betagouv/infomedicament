import { fr } from "@codegouvfr/react-dsfr";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import BreadcrumbJsonLd from "@/components/generic/BreadcrumbJsonLd";
import { getSpecSlug, hasGenericGroup, isAIP } from "@/utils/specialites";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getAtcSlug } from "@/utils/atc";
import { getSubstanceSlug } from "@/utils/substances";
import {
  getSpecialiteMetadata,
  getSpecialiteName,
} from "@/db/utils/specialities";
import MedicamentContent from "@/components/medicaments/MedicamentContent";
import ShareButtons from "@/components/generic/ShareButtons";
import { getMedicamentPageData } from "@/db/utils/medicamentPage";
import { getElements } from "@/db/utils/elements";
import { getEvents } from "@/db/utils/safety";
import { getArticlesFromFilters } from "@/db/utils/articles";
import { getSpecialitePathologies } from "@/db/utils/indications";
import { isSurveillanceRenforcee } from "@/utils/specialites";
import JsonLd from "@/components/generic/JsonLd";
import { getDrugStructuredData } from "@/utils/structuredData/drug";
import { getMedicamentFaqStructuredData } from "@/utils/structuredData/faq";
import { getNotice } from "@/db/utils/notice";
import { getRCP } from "@/db/utils/rcp";
import { getIndicationsBlock } from "@/utils/noticeHtml";
import { getBaseUrl } from "@/utils/baseUrl";

/**
 * Medicament page, shared by the notice (/medicaments/[slug])
 * and the detailed version (/medicaments/[slug]/details).
 */
export default async function MedicamentPage({
  CIS,
  isAdvanced,
}: {
  CIS: string;
  isAdvanced: boolean;
}) {
  const {
    specialite,
    composants,
    presentations,
    delivrance,
    atcCode,
    atc1,
    atc2,
    atcList,
    medData,
  } = await getMedicamentPageData(CIS);
  const breadcrumb = [{ label: "Accueil", linkProps: { href: "/" } }];
  if (atc1) {
    breadcrumb.push({
      label: atc1.label,
      linkProps: { href: `/atc/${getAtcSlug(atc1.code, atc1.label)}` },
    });
  }
  if (atc2) {
    breadcrumb.push({
      label: atc2.label,
      linkProps: { href: `/atc/${getAtcSlug(atc2.code, atc2.label)}` },
    });
  }

  if (composants.length > 0) {
    breadcrumb.push({
      label: displaySimpleComposants(composants)
        .map((s) => s.NomLib.trim())
        .join(", "),
      linkProps: {
        href: `/substances/${getSubstanceSlug(displaySimpleComposants(composants))}`,
      },
    });
  }

  const pageLabel = specialite
    ? formatSpecName(specialite.SpecDenom01)
    : await getSpecialiteName(CIS);

  // Structured data of the breadcrumb: from the URL of the page (the medicament, or its detailed version)
  const medicamentPath = specialite
    ? `/medicaments/${getSpecSlug(CIS, specialite.SpecDenom01)}`
    : undefined;

  // Structured data of the medicament (Drug), on the medicament page and its detailed version
  const currentAtc = atc2 ?? atc1;
  const [elements, metadata, events, articles, notice, rcp] = specialite
    ? await Promise.all([
        getElements(CIS),
        getSpecialiteMetadata(Number(CIS)),
        getEvents(CIS),
        // Articles of the page (see fetchMedicamentData): by composition, ATC, pathologies and specialité
        getSpecialitePathologies(CIS).then((pathologies) =>
          getArticlesFromFilters({
            ATCList: atcList,
            substancesList: composants.map((composant) =>
              composant.SubsId.trim(),
            ),
            specialitesList: [CIS],
            pathologiesList: pathologies,
          }),
        ),
        // Notice: only on the medicament page (FAQ, date of the notice), not its detailed version
        isAdvanced ? undefined : getNotice(CIS),
        // RCP: only on the detailed version (date of the RCP)
        isAdvanced ? getRCP(CIS) : undefined,
      ])
    : [[], undefined, [], [], undefined, undefined];
  const drugStructuredData =
    specialite && medicamentPath
      ? getDrugStructuredData(
          {
            path: medicamentPath,
            name: pageLabel,
            pagePath: isAdvanced ? `${medicamentPath}/details` : medicamentPath,
            description: metadata?.description,
            // Date of the content of the page: the notice on the medicament page, the RCP on its detailed version
            pageDateModified:
              (isAdvanced ? rcp?.dateNotif : notice?.isoDateNotif) ?? undefined,
            cis: CIS,
            substances: displaySimpleComposants(composants).map(
              (composant) => ({
                name: composant.NomLib.trim(),
                dosage: composant.CompDosage,
              }),
            ),
            dosageForms: elements.map((element) => element.denomination ?? ""),
            atcClass: currentAtc
              ? {
                  name: currentAtc.label,
                  path: `/atc/${getAtcSlug(currentAtc.code, currentAtc.label)}`,
                }
              : undefined,
            atcCode: atcCode ?? undefined,
            isPrescriptionOnly: delivrance.length > 0,
            isAvailableGenerically:
              hasGenericGroup(specialite) && !isAIP(specialite),
            authorizationStatus: specialite.statutAutorisation ?? undefined,
            isSurveillanceRenforcee: isSurveillanceRenforcee(events),
            reimbursementRates: presentations.flatMap(
              (presentation) => presentation.reimbursementRate ?? [],
            ),
            referenceSpecialite: specialite.referenceSpecialite
              ? {
                  name: formatSpecName(specialite.referenceSpecialite.name),
                  path: `/medicaments/${getSpecSlug(specialite.referenceSpecialite.cis, specialite.referenceSpecialite.name)}`,
                }
              : undefined,
            articles: articles.map((article) => ({
              name: article.title,
              path: `/articles/${article.slug}`,
            })),
          },
          getBaseUrl(),
        )
      : undefined;

  // Structured data of the questions (FAQPage): only on the medicament page, where the questions box is (not its detailed version)
  const faqStructuredData =
    notice && medicamentPath
      ? getMedicamentFaqStructuredData(
          medicamentPath,
          getIndicationsBlock(notice.contentHtml),
          getBaseUrl(),
        )
      : undefined;

  return (
    <>
      <ContentContainer frContainer>
        {drugStructuredData && <JsonLd data={drugStructuredData} />}
        {faqStructuredData && <JsonLd data={faqStructuredData} />}
        {medicamentPath &&
          (isAdvanced ? (
            <BreadcrumbJsonLd
              path={`${medicamentPath}/details`}
              name="Version détaillée"
              parents={[{ path: medicamentPath, name: pageLabel }]}
            />
          ) : (
            <BreadcrumbJsonLd path={medicamentPath} name={pageLabel} />
          ))}
        <Breadcrumb
          segments={breadcrumb}
          currentPageLabel={
            specialite ? formatSpecName(specialite.SpecDenom01).trim() : ""
          }
          className={fr.cx("fr-mb-2w")}
        />
        <h1 className={fr.cx("fr-h2", "fr-hidden-md")}>{pageLabel}</h1>
        <ShareButtons
          pageName={pageLabel}
          alignRight
          className={fr.cx("fr-hidden-md")}
        />
      </ContentContainer>
      <ContentContainer
        className={fr.cx("fr-pt-1w", "fr-pb-2w")}
        style={{
          backgroundColor: fr.colors.decisions.background.alt.grey.default,
        }}
      >
        {!specialite ? (
          <ContentContainer frContainer>
            Le médicament demandé n'existe pas ou il n'entre pas dans le
            périmètre d'Info Médicament.
          </ContentContainer>
        ) : (
          <MedicamentContent
            isAdvanced={isAdvanced}
            data={medData!}
            atcList={atcList}
            atc2={atc2}
            atcCode={atcCode}
            specialite={specialite}
            composants={composants}
            delivrance={delivrance}
            presentations={presentations}
            title={pageLabel}
          />
        )}
      </ContentContainer>
      <RatingToaster pageId={pageLabel} />
    </>
  );
}
