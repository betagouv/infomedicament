import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QuestionPage from "./QuestionPage";
import type { SmartSearchResponse } from "@/types/SmartSearchTypes";

vi.mock("@/components/search/QuestionSearchForm", () => ({
  default: () => <div>Formulaire de question</div>,
}));

vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@codegouvfr/react-dsfr/Badge", () => ({
  default: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const candidate = {
  specId: "1",
  specName: "DOLIPRANE 500 mg",
  groupName: "DOLIPRANE",
  score: 4,
  matchReasons: [],
};

const extraction = {
  intent: "specific_medicine_question" as const,
  specialites: ["Doliprane"],
  substances: [],
  indications: [],
  searchTerms: [],
  question: "Comment prendre du Doliprane ?",
};

describe("QuestionPage", () => {
  it("renders emergency guidance when question analysis is unavailable", () => {
    const response: SmartSearchResponse = {
      status: "unavailable",
      extraction: {
        ...extraction,
        intent: "generic_medicine_search",
        question: "",
      },
      searchQuery: "J’ai pris trop de Doliprane",
      candidates: [],
      searchResults: [],
      hits: [],
      topBlock: {
        kind: "unavailable",
        title: "Service momentanément indisponible",
        message: "Si votre situation est urgente, appelez le 15 ou le 112.",
      },
    };

    render(<QuestionPage query="J’ai pris trop de Doliprane" smartSearch={response} />);

    expect(screen.getByRole("heading", { name: "Service momentanément indisponible" })).not.toBeNull();
    expect(screen.getByText(/appelez le 15 ou le 112/)).not.toBeNull();
  });

  it("asks the user to choose a notice when the medicine is ambiguous", () => {
    const response: SmartSearchResponse = {
      status: "needs_confirmation",
      extraction,
      searchQuery: "Doliprane",
      candidates: [candidate, { ...candidate, specId: "2", specName: "DOLIPRANE 1000 mg" }],
      searchResults: [],
      hits: [],
      topBlock: {
        kind: "confirmation",
        title: "Plusieurs notices possibles",
        message: "Choisissez une notice.",
      },
    };

    render(<QuestionPage query="Comment prendre du Doliprane ?" smartSearch={response} />);

    expect(screen.getByText("Question comprise")).not.toBeNull();
    expect(screen.getByRole("heading", { name: /De quel médicament parlez-vous/ })).not.toBeNull();
    expect(screen.getByRole("link", { name: "Doliprane 500 mg" }).getAttribute("href")).toContain("/question?");
  });

  it("places the selected medicine before the notice answer", () => {
    const response: SmartSearchResponse = {
      status: "answered",
      extraction,
      searchQuery: "Doliprane",
      selectedCandidate: candidate,
      candidates: [candidate],
      searchResults: [],
      hits: [{
        section_anchor: "Ann3bCommentPrendre",
        section_title: "",
        sub_header: "Posologie",
        answer: "Prenez le comprimé avec un verre d’eau.",
      }],
      topBlock: {
        kind: "notice_answer",
        title: "Extrait de la notice",
        message: "Réponse trouvée.",
      },
    };

    const { container } = render(<QuestionPage query="Comment prendre du Doliprane ?" smartSearch={response} />);
    const medicine = screen.getByRole("heading", { name: "Doliprane 500 mg" });
    const answer = screen.getByText("Prenez le comprimé avec un verre d’eau.");
    const position = medicine.compareDocumentPosition(answer);

    expect(position & container.ownerDocument.defaultView!.Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
