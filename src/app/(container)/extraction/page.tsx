import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import ExtractionModule from "@/components/extraction/ExtractionModule";
import db from "@/db";
import { getAtc } from "@/db/utils/atc";
import { AtcOption, SubstanceOption } from "@/types/ExtractionTypes";
import { connection } from "next/server";

const PAGE_LABEL = "Extraction des données de spécialités";

export default async function Page() {
  // Rendered at request time: the lists come from the DB, which isn't populated at build time
  // (e.g. on review apps, seeded after the build)
  await connection();
  const [substanceRows, atc1List] = await Promise.all([
    db
      .selectFrom("resume_substances")
      .select(["SubsId", "NomLib"])
      .orderBy("NomLib")
      .execute(),
    getAtc(),
  ]);

  const substanceOptions: SubstanceOption[] = substanceRows
    .filter((row) => row.NomLib.trim().length > 0)
    .map((row) => ({ subsId: row.SubsId.trim(), nomLib: row.NomLib.trim() }));

  const atcOptions: AtcOption[] = atc1List.flatMap((atc1) =>
    atc1.children.map((atc2) => ({
      atc1Code: atc1.code,
      atc1Label: atc1.label,
      atc2Code: atc2.code,
      atc2Label: atc2.label,
    })),
  );

  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel={PAGE_LABEL}
      />
      <h1 className={fr.cx("fr-h2")}>{PAGE_LABEL}</h1>
      <p>
        Filtrez les spécialités par substance active et/ou classe ATC, puis
        choisissez les données à extraire.
      </p>
      <ExtractionModule
        substanceOptions={substanceOptions}
        atcOptions={atcOptions}
      />
    </ContentContainer>
  );
}
