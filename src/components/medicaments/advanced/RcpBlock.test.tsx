import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import RcpBlock from "./RcpBlock";

const { getContent, getRCP } = vi.hoisted(() => ({
  getContent: vi.fn(() => <div>Legacy RCP</div>),
  getRCP: vi.fn(),
}));

vi.mock("@/db/utils/rcp", () => ({ getRCP }));
vi.mock("@/utils/notices", () => ({ getContent }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@codegouvfr/react-dsfr/Badge", () => ({
  default: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
vi.mock("@/utils/specialites", () => ({ isCentralisee: () => false }));
vi.mock("../blocks/CentraliseBlock", () => ({ default: () => null }));
vi.mock("@/components/generic/GoTopButton", () => ({ default: () => null }));

const specialite = { SpecId: "123" } as DetailedSpecialite;

describe("RcpBlock", () => {
  beforeEach(() => {
    getContent.mockClear();
    getRCP.mockReset();
  });

  it("renders contentHtml instead of the legacy RCP tree", async () => {
    getRCP.mockResolvedValue({
      codeCIS: 123,
      contentHtml: "<h2>Raw RCP section</h2><p>Rendered from HTML</p>",
      children: [{ type: "AmmCorpsTexte", content: ["Legacy RCP"] }],
    });

    render(<RcpBlock specialite={specialite} />);

    expect(await screen.findByRole("heading", { name: "Raw RCP section" })).not.toBeNull();
    expect(document.querySelector(".rcp-notice-html-content")).not.toBeNull();
    expect(getContent).not.toHaveBeenCalled();
  });

  it("keeps rendering legacy RCP children when contentHtml is empty", async () => {
    getRCP.mockResolvedValue({
      codeCIS: 123,
      contentHtml: "",
      children: [{ type: "AmmCorpsTexte", content: ["Legacy RCP"] }],
    });

    render(<RcpBlock specialite={specialite} />);

    expect(await screen.findByText("Legacy RCP")).not.toBeNull();
    await waitFor(() => expect(getContent).toHaveBeenCalledOnce());
  });
});
