import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { getArticles } from "@/db/utils/articles";
import Page from "./page";

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

describe("Articles (UI Integration)", () => {
    it("should fetch all articles with correct content format", async () => {
        const articles = await getArticles();

        expect(articles).toBeDefined();
        expect(articles.length).toBeGreaterThan(0);

        // Check first article has expected structure
        const firstArticle = articles[0];
        expect(firstArticle.slug).toBeDefined();
        expect(firstArticle.title).toBeDefined();
        expect(firstArticle.content).toBeDefined();
        expect(firstArticle.category).toBeDefined();
    });

    it("should fetch article 'medicaments-et-chaleur-preserver-leur-efficacite' with correct content", async () => {
        const articles = await getArticles();
        const article = articles.find(a => a.slug === "medicaments-et-chaleur-preserver-leur-efficacite");

        expect(article).toBeDefined();
        if (!article) {
            throw new Error("Article not found");
        }
        expect(article.title).toContain("chaleur");
        expect(article.content).toBeDefined();
        expect(article.content.length).toBeGreaterThan(0);
    });

    it("Should render the page with expected content", async () => {
        // Call the server component page to list all articles
        const jsx = await Page();

        // Render JSX and take snapshot
        const { container } = render(jsx);
        // This will create a snapshot file on first run, and compare on subsequent runs
        // They are stored in a .snap file next to this test file
        expect(container).toMatchSnapshot();

    })
});
