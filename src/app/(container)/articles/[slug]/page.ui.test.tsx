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

// Mock MDXRemote: this async Server Component compiles MDX during render using await.
// In jsdom, this causes React to suspend without completing, leaving the container empty.
// Mocking it renders raw content directly, which is enough for testing purposes.
vi.mock("next-mdx-remote/rsc", () => ({
    MDXRemote: ({ source }: { source: string }) => <div data-testid="mdx-content">{source}</div>,
}));

describe("Article Page (UI Integration)", () => {
    it("should render article 'medicaments-et-chaleur-preserver-leur-efficacite' with correct content (Snapshot)", async () => {
        // Call the server component page with the article slug
        const jsx = await Page({
            params: Promise.resolve({ slug: "medicaments-et-chaleur-preserver-leur-efficacite" })
        });

        // Render JSX and take snapshot
        const { container } = render(jsx);

        // Verify key content is present
        expect(container.textContent).toContain("la température de conservation idéale");
        expect(container.textContent).toContain("À retenir :");

        // Snapshot test
        expect(container).toMatchSnapshot();
    });

    it("should return a 404 for an invalid slug", async () => {
        const callPage = async () => {
            await Page({
                params: Promise.resolve({ slug: "non-existent-article-slug-12345" })
            });
        };

        await expect(callPage()).rejects.toThrow("NEXT_NOT_FOUND");
    });
});
