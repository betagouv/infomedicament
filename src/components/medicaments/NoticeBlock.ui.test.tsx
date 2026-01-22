import { render, waitFor, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NoticeBlock from "./NoticeBlock";
import { NoticeData } from "@/types/SpecialiteTypes";

// Mock the dark mode hook to always return light mode for consistent snapshots
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
    useIsDark: () => ({ isDark: false }),
}));

describe("NoticeBlock (UI Integration)", () => {
    it("should render the correct content for effet indésirable (Snapshot)", async () => {
        const GLOSSARY_WORD = "effet indésirable";
        // NB: 'content' is an array of strings
        const NOTICE_TEXT_ARRAY = [`Si vous ressentez un quelconque ${GLOSSARY_WORD}, parlez-en à votre médecin.`];

        // 2. DONNÉES DE TEST ADAPTÉES À noticesUtils.ts
        const mockNotice: NoticeData = {
            children: [
                {
                    id: "test-block-1",
                    type: "AmmCorpsTexte", // Pretend we're in an AmmCorpsTexte block
                    content: NOTICE_TEXT_ARRAY,
                    styles: [],
                    children: []
                }
            ]
        } as any;

        // Render container
        const { container } = render(<NoticeBlock notice={mockNotice} />);

        // Wait for async data load
        await waitFor(() => {
            // Check that container is in the document
            expect(container).toBeDefined();
            // And that the glossary word was detected and highlighted
            const button = screen.getByRole("button", { name: new RegExp(GLOSSARY_WORD, "i") });
            expect(button).toBeTruthy();
        }, { timeout: 5000 }); // A bit of extra time for API/DB calls

        // Snapshot test
        expect(container).toMatchSnapshot();
    });
});