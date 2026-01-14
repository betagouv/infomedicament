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

describe("Glossaire Page (Integration with DB)", () => {
    it("should render the correct content for letter A (Snapshot)", async () => {
        // Call the server component page with letter 'A'
        const jsx = await Page({
            params: Promise.resolve({ letter: "A" })
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);
        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();
    });

    it("should return a 404 for an invalid letter (Z)", async () => {
        const callPage = async () => {
            await Page({
                params: Promise.resolve({ letter: "Z" })
            });
        };

        await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    });
});