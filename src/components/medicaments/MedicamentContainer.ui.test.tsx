import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MedicamentContainer from "@/components/medicaments/MedicamentContainer";
const { getSpecialite } = await import("@/db/utils");
const { getAtc1, getAtc2 } = await import("@/data/grist/atc");
const { getAtcCode } = await import("@/utils/atc");

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

describe("Medicament Container component(UI Integration)", () => {
    // Vizamyl 400 Mbq/ml, solution injectable
    const TEST_CIS = "67652999";
    // NB: the MARR section is not shown by default, so we don't expect it to appear in this test
    it("should render the correct content for medicament container", async () => {
        const { specialite, composants, presentations, delivrance } = await getSpecialite(TEST_CIS);

        const atcCode = getAtcCode(TEST_CIS);
        const atc1 = atcCode ? await getAtc1(atcCode) : undefined;
        const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

        const atcList = [];
        if (atc1) atcList.push(atc1.code.trim());
        if (atc2) atcList.push(atc2.code.trim());

        // Render with real data
        const { container } = render(
            <MedicamentContainer
                atcList={atcList}
                atc2={atc2}
                atcCode={atcCode}
                specialite={specialite}
                composants={composants}
                isPrinceps={true}
                delivrance={delivrance}
                presentations={presentations}
            />
        );

        // Wait for data to load
        await waitFor(() => {
            expect(container).toBeDefined();
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });
});