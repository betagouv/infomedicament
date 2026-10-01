import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DocumentHas from "./DocumentHas";

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
  Table: () => <table />,
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
