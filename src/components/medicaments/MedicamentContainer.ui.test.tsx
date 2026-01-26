import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import MedicamentContainer from "@/components/medicaments/MedicamentContainer";
const { getSpecialite } = await import("@/db/utils");
const { getAtc1, getAtc2 } = await import("@/db/utils/atc");
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

    it("should render the correct content for medicament with pediatric indication", async () => {
        // Augmentin 1 g/125 mg, poudre pour suspension buvable en sachet-dose (rapport amoxicilline/acide clavulanique : 8/1)
        const TEST_CIS = "66053338";
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
            expect(container.textContent).toContain("Peut être utilisé chez l'enfant selon l'âge");
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });

    it("should render the correct content for medicament with pediatric 'sur avis d'un médecin'", async () => {
        // Atepadene 30 mg, gélule
        const TEST_CIS = "60453083";
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
            expect(container.textContent).toContain("Utilisation chez l'enfant sur avis d'un professionnel de santé");
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });

    it("should render the correct content for medicament with pediatric contre-indication", async () => {
        // Bactrim, suspension buvable
        const TEST_CIS = "65880598";
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

        // Wait for alert AND pediatric tags to appear
        await waitFor(() => {
            expect(container.textContent).toContain("Il existe une contre-indication pédiatrique");
            expect(container.textContent).toContain("Contre-indication chez l'enfant selon l'âge");
            expect(container.textContent).toContain("Mention contre-indication enfant");
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });

    it("should render pregnancy plan alert for medicament with pregnancy plan", async () => {
        // Anastrozole Accord 1 mg, comprimé pelliculé
        const TEST_CIS = "60002283";
        const { specialite, composants, presentations, delivrance } = await getSpecialite(TEST_CIS);

        const atcCode = getAtcCode(TEST_CIS);
        const atc1 = atcCode ? await getAtc1(atcCode) : undefined;
        const atc2 = atcCode ? await getAtc2(atcCode) : undefined;

        const atcList = [];
        if (atc1) atcList.push(atc1.code.trim());
        if (atc2) atcList.push(atc2.code.trim());

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

        // Wait for pregnancy plan alert to appear
        await waitFor(() => {
            expect(container.textContent).toContain("Mention contre-indication grossesse");
            expect(container.textContent).toContain("Ce médicament peut présenter des précautions d’usage pendant la grossesse ou l’allaitement.");
        });

        // Snapshot
        expect(container).toMatchSnapshot();
    });
});