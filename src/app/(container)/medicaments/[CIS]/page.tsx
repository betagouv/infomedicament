import { Suspense } from "react";
import MedicamentPageLoading from "@/components/medicaments/MedicamentPageLoading";
import { Metadata, ResolvingMetadata } from "next";
import { fr } from "@codegouvfr/react-dsfr";
import { displaySimpleComposants, formatSpecName } from "@/displayUtils";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { withStaticParamFallback } from "@/utils/staticParams";
import { getWarmupCISCodes } from "@/db/utils/warmup";
import ContentContainer from "@/components/generic/ContentContainer";
import RatingToaster from "@/components/rating/RatingToaster";
import { getSpecialiteGroupName } from "@/utils/specialites";
import {
  getSpecialiteMetadata,
  getSpecialiteName,
} from "@/db/utils/specialities";
import MedicamentContent from "@/components/medicaments/MedicamentContent";
import ShareButtons from "@/components/generic/ShareButtons";
import { getMedicamentPageData } from "@/db/utils/medicamentPage";

// Prerender the top ~500 medicaments at build time so they are served as static
// HTML before the first request. Other CIS are still rendered on-demand
// Cache Components also validates one fallback path on unseeded review-app builds.
export async function generateStaticParams() {
  const cisCodes = await getWarmupCISCodes();
  return withStaticParamFallback(
    cisCodes.map((CIS) => ({ CIS })),
    { CIS: "60234100" },
  );
}

export async function generateMetadata(
  props: { params: Promise<{ CIS: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { CIS } = await props.params;

  const metadata = await getSpecialiteMetadata(Number(CIS.trim()));

  if (!metadata) {
    return {
      title: `Médicament ${CIS}`,
    };
  }

  const name = formatSpecName(metadata.title);
  return {
    title: `${name} - ${(await parent).title?.absolute}`,
    description: metadata.description,
  };
}

export default function Page(props: { params: Promise<{ CIS: string }> }) {
  return (
    <Suspense fallback={<MedicamentPageLoading />}>
      <ResolvedMedicamentPage params={props.params} />
    </Suspense>
  );
}

async function ResolvedMedicamentPage({
  params,
}: {
  params: Promise<{ CIS: string }>;
}) {
  const { CIS } = await params;
  return <MedicamentPage CIS={CIS} />;
}

async function MedicamentPage({ CIS }: { CIS: string }) {
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
      linkProps: { href: `/atc/${atc1.code}` },
    });
  }
  if (atc2) {
    breadcrumb.push({
      label: atc2.label,
      linkProps: { href: `/atc/${atc2.code}` },
    });
  }

  if (composants.length > 0) {
    breadcrumb.push({
      label: displaySimpleComposants(composants)
        .map((s) => s.NomLib.trim())
        .join(", "),
      linkProps: {
        href: `/substances/${displaySimpleComposants(composants)
          .map((s) => s.SubsId.trim())
          .join(",")}`,
      },
    });
  }
  if (specialite) {
    breadcrumb.push({
      label: formatSpecName(getSpecialiteGroupName(specialite)),
      linkProps: {
        href: `/rechercher?s=${formatSpecName(getSpecialiteGroupName(specialite))}`,
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
              ? formatSpecName(specialite.SpecDenom01).replace(
                  formatSpecName(getSpecialiteGroupName(specialite)),
                  "",
                )
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
