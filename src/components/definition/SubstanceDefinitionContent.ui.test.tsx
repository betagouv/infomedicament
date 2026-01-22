import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SubstanceDefinitionContent from "./SubstanceDefinitionContent";
const { getSubstances } = await import("@/db/utils/substances");

// Mock the dark mode hook
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
    useIsDark: () => ({ isDark: false }),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
    captureException: vi.fn(),
}));

// Disable server-only for tests
vi.mock("server-only", () => ({}));

describe("SubstanceDefinitionContent (UI Integration)", () => {
    it("should render substance definition with correct content", async () => {
        // Acétylleucine
        const TEST_NOM_ID = "04129";
        const substances = await getSubstances([TEST_NOM_ID]);

        if (!substances) {
            throw new Error(`Could not get substance for id ${TEST_NOM_ID}`)
        }
        expect(substances).toBeDefined();
        expect(substances.length).toBeGreaterThan(0);

        const { container } = render(
            <SubstanceDefinitionContent
                ids={[TEST_NOM_ID]}
                substances={substances}
            />
        );

        // Wait for definition to load
        await waitFor(() => {
            // Should show the substance name
            expect(container.textContent).toContain("acétylleucine");
            // Should show definition section
            expect(container.textContent).toContain("signes des vertiges");
            expect(container.textContent).toContain("Les définitions proposées sont fournies à titre informatif.");
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });
});
