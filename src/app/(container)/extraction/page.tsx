import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import ExportBlock from "@/components/export/ExportBlock";
import { getAtc } from "@/db/utils/atc";
import { AtcOption, SubstanceOption } from "@/types/ExportTypes";
import { getAllSubstancesResumes } from "@/db/utils/substances";

export const ensureStatic = "navigation";

const PAGE_LABEL = "Export des données des spécialités";

export default async function Page() {

  const [substances, atc1List] = await Promise.all([
    getAllSubstancesResumes(),
    getAtc(),
  ]);

  const substancesOptions: SubstanceOption[] = substances
    .map((subs) => ({ subsId: subs.SubsId.trim(), nomLib: subs.NomLib.trim() }));

  const atcsOptions: AtcOption[] = atc1List.map((atc1) => ({
    atc1Code: atc1.code,
    atc1Label: atc1.label,
    atc2: atc1.children.map((atc2) => ({
      atc2Code: atc2.code,
      atc2Label: atc2.label,
    })),
  }));

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
      <ExportBlock
        substancesOptions={substancesOptions}
        atcsOptions={atcsOptions}
      />
    </ContentContainer>
  );
}
