import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MarrNotice from "./MarrNotice";
import MarrNoticeAdvanced from "./MarrNoticeAdvanced";
import { getMarr } from "@/data/grist/marr"; // Will be replaced with DB version

// Mock the dark mode hook to always return light mode for consistent snapshots
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
    useIsDark: () => ({ isDark: false }),
}));

// Disable server-only for tests
vi.mock("server-only", () => ({}));

describe("MARR Components (UI Integration)", () => {
    // Vizamyl 400 Mbq/ml, solution injectable
    const TEST_CIS = "67652999";

    it("should render the correct MarrNotice content", async () => {
        const marrData = await getMarr(TEST_CIS);

        // Mock callback for the "go to advanced" link
        const mockOnGoToAdvanced = vi.fn();

        // Render component
        const { container } = render(
            <MarrNotice marr={marrData} onGoToAdvanced={mockOnGoToAdvanced} />
        );

        // Wait for component to fully render
        await waitFor(() => {
            expect(container).toBeDefined();
            // Verify that MARR data is present
            if (marrData.pdf.length > 0) {
                expect(container.textContent).toContain("Mesures additionnelles");
            }
        }, { timeout: 5000 });

        // Snapshot test
        expect(container).toMatchSnapshot();
    });

    it("should render the correct MarrNoticeAdvanced content", async () => {
        // Fetch real MARR data
        const marrData = await getMarr(TEST_CIS);

        // Render component
        const { container } = render(
            <MarrNoticeAdvanced marr={marrData} />
        );

        // Wait for component to fully render
        await waitFor(() => {
            expect(container).toBeDefined();
            // Verify that MARR data is present
            if (marrData.pdf.length > 0) {
                expect(container.textContent).toContain("Mesures additionnelles");
            }
        }, { timeout: 5000 });

        // Snapshot test
        expect(container).toMatchSnapshot();
    });

    it("should handle empty MARR data gracefully", async () => {
        // No MARR data
        const marrData = await getMarr("00000000");

        const mockOnGoToAdvanced = vi.fn();

        const { container: noticeContainer } = render(
            <MarrNotice marr={marrData} onGoToAdvanced={mockOnGoToAdvanced} />
        );

        const { container: advancedContainer } = render(
            <MarrNoticeAdvanced marr={marrData} />
        );

        // Both should render nothing (empty fragment) when pdf.length === 0
        expect(noticeContainer.innerHTML).toBe("");
        expect(advancedContainer.innerHTML).toBe("");
    });
});