import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PathologyDefinitionContent from "@/components/definition/PathologyDefinitionContent";
import { getPatho } from "@/db/utils/pathologies";

// Mock the dark mode hook to always return light mode for consistent snapshots
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
    useIsDark: () => ({ isDark: false }),
}));

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
    captureException: vi.fn(),
}));

// Disable server-only and server-cli-only for tests
vi.mock("server-only", () => ({}));
vi.mock("server-cli-only", () => ({}));

describe("PathologyDefinitionContent (UI Integration)", () => {
    // Test with "Diabète" pathology
    const TEST_PATHO_CODE = "100";

    it("should render pathology definition with correct content", async () => {
        const patho = await getPatho(TEST_PATHO_CODE);

        if (!patho) {
            throw new Error(`Test pathology ${TEST_PATHO_CODE} not found in database`);
        }

        expect(patho.NomPatho).toBe("Diabète");

        const { container } = render(
            <PathologyDefinitionContent patho={patho} />
        );

        // The component fetches: definition (Grist), articles (Grist), specialites (DB)
        await waitFor(() => {
            expect(container).toBeDefined();
            // Should display the pathology name
            expect(container.textContent).toContain(patho.NomPatho);
            // The definition content
            expect(container.textContent).toMatch("Maladie chronique où le corps ne produit pas assez d'insuline ou devient résistant à l'insuline, entraînant une élévation du taux de sucre dans le sang.");
            // Should show articles section
            expect(container.textContent).toMatch(("En savoir plus"));
            // Should show some specialities treating the pathology (not 0)
            expect(container.textContent).toMatch(/\d+ médicaments traitant la pathologie/);
            // Wait for actual medications to load (check for a known medication name)
            expect(container.textContent).toContain("Abasaglar");
        });

        // Snapshot test - captures the full rendered UI with real data
        expect(container).toMatchSnapshot();
    });
});
