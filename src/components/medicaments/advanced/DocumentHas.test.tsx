import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentHas from "./DocumentHas";
import { mapAsmr, mapDocBonUsage, mapSmr, sortHasHistory } from "@/db/utils/hasCatalog";

vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children }: React.PropsWithChildren) => <section>{children}</section>,
}));
vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@codegouvfr/react-dsfr/Badge", () => ({
  default: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
vi.mock("@codegouvfr/react-dsfr/Table", () => ({
  Table: ({ data }: { data: React.ReactNode[][] }) => (
    <table><tbody>{data.map((row, index) => (
      <tr key={index}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>
    ))}</tbody></table>
  ),
}));
vi.mock("@/components/glossary/WithDefinition", () => ({
  default: ({ word }: { word: string }) => <span>{word}</span>,
}));

const ficheInfos = {
  listeElements: [],
  listeSMR: [],
  listeASMR: [],
  isSurveillanceRenforcee: false,
};

describe("DocumentHas", () => {
  it("displays French opinion dates in chronological order and good-use months after serialization", () => {
    const opinions = ["23/05/2012", "29/04/2015", "03/10/2018", "24/06/2020"].map((date) => ({
      date_avis_definitif: date,
      valeur_smr: "Important",
      valeur_asmr: "V",
      motif_demande: "Réévaluation",
      libelle_smr: "Résumé SMR",
      libelle_asmr: "Résumé ASMR",
      url: `https://www.has-sante.fr/avis/${date}`,
    }));
    const documents = ["12/10/2016", "24/02/2016", "19/04/2023", "12/02/2015", "19/10/2022", "28/05/2025"]
      .map((date) => mapDocBonUsage({
        date_mise_a_jour: date,
        titre: `Document ${date}`,
        type_document: "Bon usage",
        url: "https://www.has-sante.fr/document",
      }));
    const serializedFiche = JSON.parse(JSON.stringify({
      ...ficheInfos,
      listeSMR: sortHasHistory(opinions.map(mapSmr)),
      listeASMR: sortHasHistory(opinions.map(mapAsmr)),
      listeDocumentsBonUsage: documents,
    }));
    const { container } = render(<DocumentHas ficheInfos={serializedFiche} isGeneric={false} />);

    for (const table of container.querySelectorAll("table")) {
      expect(Array.from(table.querySelectorAll("a"), (link) => link.textContent?.replace(/\s/g, " "))).toEqual([
        "Avis du 24/06/2020", "Avis du 03/10/2018", "Avis du 29/04/2015", "Avis du 23/05/2012",
      ]);
      expect(table.querySelectorAll("a")[1].getAttribute("href")).toBe("https://www.has-sante.fr/avis/03/10/2018");
    }
    for (const month of ["octobre 2016", "février 2016", "avril 2023", "février 2015", "octobre 2022", "mai 2025"]) {
      expect(screen.getByText(month)).not.toBeNull();
    }
    expect(container.textContent).not.toContain("Invalid Date");
  });

  it("does not present a princeps as a generic when HAS evaluations are absent", () => {
    render(
      <DocumentHas
        ficheInfos={ficheInfos}
        genericGroupCode={123}
        isGeneric={false}
      />,
    );

    expect(screen.queryByText(/Ce médicament étant un générique/)).toBeNull();
    expect(screen.getByText("Il n’y a pas d’ASMR disponible pour ce médicament.")).not.toBeNull();
  });

  it("shows generic guidance for a generic without HAS evaluations", () => {
    render(
      <DocumentHas
        ficheInfos={ficheInfos}
        genericGroupCode={123}
        isGeneric
      />,
    );

    const guidance = screen.getAllByText(/Ce médicament étant un générique/);
    expect(guidance).toHaveLength(2);
    expect(guidance[0].querySelector("a")?.getAttribute("href")).toBe("/generiques/123");
  });
});
