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

describe("ATC Page (Integration with DB)", () => {
    it("should render the correct content for ATC code G (Snapshot)", async () => {
        // Call the server component page with code 'G'
        const jsx = await Page({
            params: Promise.resolve({ code: "G" }) // Système génital, urinaire et hormones sexuelles
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Basic check on content
        expect(container.textContent).toContain('urinaire');

        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should render the correct content for ATC2 code A10 (Snapshot)", async () => {
        // Call the server component page with code 'A10' (sous-classe)
        const jsx = await Page({
            params: Promise.resolve({ code: "A10" }) // Diabète
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Basic check on content
        expect(container.textContent).toContain('Diabète');

        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should return a 404 for an invalid letter (Z)", async () => {
        const callPage = async () => {
            await Page({
                params: Promise.resolve({ code: "Z" })
            });
        };

        await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    });
});