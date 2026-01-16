import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import WithGlossary from "./WithGlossary";

// Mock the WithDefinition component
// if called, it means the word was detected by the regex
vi.mock("@/components/glossary/WithDefinition", () => ({
    default: ({ word }: { word: string }) => <mark data-testid="detected-word">{word}</mark>,
}));

// Mock anchors data to avoid dependency on external data
vi.mock("@/data/pages/notices_anchors", () => ({
    questionKeys: [],
    questionsList: {}
}));

describe("WithGlossary Regex Logic", () => {
    it("should detect a word followed immediately by a comma", () => {
        const TERM = "effet secondaire";

        const content = [`Attention, en cas d'effet secondaire, contactez votre médecin traitant.`];

        const mockDefinitions = [{
            id: "1",
            fields: { Nom_glossaire: TERM }
        }] as any;

        render(<WithGlossary text={content} definitions={mockDefinitions} />);

        const detected = screen.getByTestId("detected-word");
        expect(detected.textContent).toBe(TERM);
    });

    it("should detect a plural word followed by a dot", () => {
        const TERM = "Excipient";
        const content = ["Ce médicament contient des excipients."];

        const mockDefinitions = [{
            id: "2",
            fields: { Nom_glossaire: TERM }
        }] as any;

        render(<WithGlossary text={content} definitions={mockDefinitions} />);

        const detected = screen.getByTestId("detected-word");
        expect(detected.textContent).toBe("excipients"); // plural form
    });
});