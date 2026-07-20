import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import NoticeBlock from "./NoticeBlock";

const { getContent } = vi.hoisted(() => ({
  getContent: vi.fn(() => <div>Legacy notice</div>),
}));

vi.mock("@/utils/notices", () => ({ getContent }));
vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
}));
vi.mock("@/utils/specialites", () => ({ isCentralisee: () => false }));

describe("NoticeBlock", () => {
  it("renders contentHtml instead of the legacy notice tree", () => {
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
          children: [{ type: "AmmCorpsTexte", content: ["Legacy notice"] }],
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
    expect(getContent).not.toHaveBeenCalled();
  });

  it("keeps rendering legacy notice children when contentHtml is empty", () => {
    render(
      <NoticeBlock
        notice={{
          codeCIS: 123,
          contentHtml: "",
          children: [{ type: "AmmCorpsTexte", content: ["Legacy notice"] }],
        }}
      />,
    );

    expect(screen.getByText("Legacy notice")).not.toBeNull();
    expect(getContent).toHaveBeenCalledOnce();
  });
});
