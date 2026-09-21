import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DetailedSpecialite } from "@/types/SpecialiteTypes";
import NoticeBlock from "./NoticeBlock";

const { isCentralisee } = vi.hoisted(() => ({
  isCentralisee: vi.fn(),
}));

vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));
vi.mock("@/utils/specialites", () => ({ isCentralisee }));

describe("NoticeBlock", () => {
  beforeEach(() => {
    isCentralisee.mockReturnValue(false);
  });

  it("renders the notice HTML with document styles", () => {
    render(
      <NoticeBlock
        notice={{
          codeCIS: 123,
          contentHtml: `
            <h2>New notice</h2>
            <p>Rendered from HTML</p>
            <p data-document-role="holder-name">Holder name</p>
            <p data-document-role="holder-address">Holder address</p>
            <span data-document-role="composition">Composition</span>
          `,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "New notice" })).not.toBeNull();
    expect(screen.getByText("Rendered from HTML")).not.toBeNull();
    expect(document.querySelector(".rcp-notice-html-content")).not.toBeNull();
    expect(getComputedStyle(screen.getByText("Holder name"))).toMatchObject({
      fontWeight: "bold",
      marginBottom: "0px",
      textDecoration: "underline",
    });
    expect(getComputedStyle(screen.getByText("Holder address")).marginBottom).toBe("0px");
    expect(getComputedStyle(screen.getByText("Composition"))).toMatchObject({
      display: "block",
      fontSize: "1rem",
      lineHeight: "1.5rem",
    });
  });

  it("links to EMA only when a centralized medicine has no local notice", () => {
    isCentralisee.mockReturnValue(true);

    render(
      <NoticeBlock specialite={{ SpecId: "123" } as DetailedSpecialite} />,
    );

    expect(screen.getByRole("link", { name: /EMA/ }).getAttribute("href")).toBe(
      "https://www.ema.europa.eu/en/search",
    );
  });
});
