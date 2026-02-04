import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Page from "./page";

// Cleanly intercept the notFound function from next/navigation
vi.mock("next/navigation", () => ({
    notFound: () => {
        throw new Error("NEXT_NOT_FOUND");
    },
}));

// Mock the dark mode hook to always return light mode for consistent snapshots
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
    useIsDark: () => ({ isDark: false }),
}));

// Disable server-only for tests
vi.mock("server-only", () => ({}));

// Disable cache for testing
vi.mock("next/cache", () => ({ unstable_cache: (fn: any) => fn }));

describe("Medicaments Page (Integration with DB)", () => {
    it("should render the correct content for CIS code 61959735 (Snapshot)", async () => {
        // Call the server component page with code '61959735'
        const jsx = await Page({
            params: Promise.resolve({ CIS: "61959735" }) // Advilcaps 400 mg, capsule molle
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Basic check on content
        expect(container.textContent).toContain('Advilcaps');

        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should render the correct content for CIS code 62764332 (Snapshot)", async () => {
        // Call the server component page with code '62764332'
        const jsx = await Page({
            params: Promise.resolve({ CIS: "62764332" }) // Oralair 300 Ir, comprimés sublinguaux
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Basic check on content
        expect(container.textContent).toContain('Oralair');

        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should return a page even with invalid code", async () => {
        const jsx = await Page({
            params: Promise.resolve({ CIS: "00000000" })
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        expect(container).toMatchSnapshot();
    });
});