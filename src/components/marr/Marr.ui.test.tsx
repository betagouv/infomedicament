import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MarrNotice from "./MarrNotice";
import MarrNoticeAdvanced from "./MarrNoticeAdvanced";
import MarrResumeList from "./MarrResumeList";
import { getMarr } from "@/db/utils/marr"; // Will be replaced with DB version

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

        expect(marrData.pdf.length).toBeGreaterThan(0);

        // Wait for component to fully render
        await waitFor(() => {
            expect(container).toBeDefined();
            // Verify that MARR data is present

            expect(container.textContent).toContain("Mesures additionnelles");
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

        expect(marrData.pdf.length).toBeGreaterThan(0);

        // Wait for component to fully render
        await waitFor(() => {
            expect(container).toBeDefined();
            // Verify that MARR data is present
            expect(container.textContent).toContain("Mesures additionnelles");
        }, { timeout: 5000 });

        // Snapshot test
        expect(container).toMatchSnapshot();
    });

    it("should render the correct list of MARR documents", async () => {
        const marrData = await getMarr(TEST_CIS);

        const { container } = render(
            <MarrResumeList marr={marrData} />
        );

        expect(marrData.pdf.length).toBeGreaterThan(0);

        await waitFor(() => {
            expect(container).toBeDefined();

            // Verify that PDF documents are rendered

            const links = container.querySelectorAll('a');
            expect(links.length).toBe(marrData.pdf.length);

            // Check for badges (document types)
            const badges = container.querySelectorAll('.fr-badge--purple-glycine');
            expect(badges.length).toBe(marrData.pdf.length);

        }, { timeout: 5000 });

        expect(container).toMatchSnapshot();
    });

    it("should render inline layout when inLine prop is true", async () => {
        const marrData = await getMarr(TEST_CIS);

        const { container } = render(
            <MarrResumeList marr={marrData} inLine={true} />
        );

        await waitFor(() => {
            expect(container).toBeDefined();
        }, { timeout: 5000 });

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

        const { container: resumeListContainer } = render(
            <MarrResumeList marr={marrData} />
        );

        // All should render nothing (empty fragment) when pdf.length === 0
        expect(noticeContainer.innerHTML).toBe("");
        expect(advancedContainer.innerHTML).toBe("");
        expect(resumeListContainer.innerHTML).toBe("");
    });
});