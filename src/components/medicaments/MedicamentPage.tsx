import { fr } from "@codegouvfr/react-dsfr";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getAtcSlug } from "@/utils/atc";
import { getSubstanceSlug } from "@/utils/substances";
import { getSpecialiteName } from "@/db/utils/specialities";
import MedicamentContent from "@/components/medicaments/MedicamentContent";
import ShareButtons from "@/components/generic/ShareButtons";
import { getMedicamentPageData } from "@/db/utils/medicamentPage";

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

  return (
    <>
      <ContentContainer frContainer>
        <Breadcrumb
          segments={breadcrumb}
          currentPageLabel={
            specialite
              ? formatSpecName(specialite.SpecDenom01).trim()
              : ""
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
