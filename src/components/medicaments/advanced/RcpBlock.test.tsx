import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import RcpBlock from "./RcpBlock";

const { getRCP } = vi.hoisted(() => ({
  getRCP: vi.fn(),
}));

vi.mock("@/db/utils/rcp", () => ({ getRCP }));
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
    getRCP.mockReset();
  });

  it("renders the RCP HTML with document styles", async () => {
    getRCP.mockResolvedValue({
      codeCIS: 123,
      contentHtml: `<h2>Raw RCP section</h2><p>Rendered from HTML</p>
        <span data-definition="Pharmacovigilance">RCP term</span>`,
    });

    render(<RcpBlock specialite={specialite} />);

    expect(await screen.findByRole("heading", { name: "Raw RCP section" })).not.toBeNull();
    expect(document.querySelector(".rcp-notice-html-content")).not.toBeNull();
    expect(document.querySelector(".document-html--definitions")).toBeNull();
    expect(screen.getByText("RCP term").getAttribute("role")).toBeNull();
  });

  it("does not display an invalid notification date", async () => {
    getRCP.mockResolvedValue({
      codeCIS: 123,
      contentHtml: "<p>RCP content</p>",
      dateNotif: "not-a-date",
    });

    render(<RcpBlock specialite={specialite} />);

    expect(await screen.findByText("RCP content")).not.toBeNull();
    expect(screen.queryByText(/Invalid Date/)).toBeNull();
    expect(screen.queryByText(/RCP mis à jour le/)).toBeNull();
  });
});
