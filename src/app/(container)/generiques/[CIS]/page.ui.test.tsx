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

describe("Generics Page (Integration with DB)", () => {
    it("should render the correct content for CIS code 64404112 (Snapshot)", async () => {
        // Call the server component page with code '64404112'
        const jsx = await Page({
            params: Promise.resolve({ CIS: "64404112" }) // Cetirizine (DICHLORHYDRATE De) 10 mg
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Basic check on content
        expect(container.textContent).toContain('Groupe générique');
        expect(container.textContent).toContain('Cetirizine');

        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should return a 404 for an invalid code", async () => {
        const callPage = async () => {
            await Page({
                params: Promise.resolve({ CIS: "00000000" })
            });
        };

        await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    });
});