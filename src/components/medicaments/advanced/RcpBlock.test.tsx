import { SWRConfig } from "swr";
import { act, render as renderComponent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DetailedSpecialite, RcpData } from "@/types/SpecialiteTypes";
import RcpBlock from "./RcpBlock";

const { getRCP, isCentralisee } = vi.hoisted(() => ({
  getRCP: vi.fn(),
  isCentralisee: vi.fn(),
}));

vi.mock("@/db/utils/rcp", () => ({ getRCP }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@codegouvfr/react-dsfr/Badge", () => ({
  default: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
vi.mock("@/utils/specialites", () => ({ isCentralisee }));
vi.mock("@/components/generic/GoTopButton", () => ({ default: () => null }));

function render(component: React.ReactNode) {
  return renderComponent(component, {
    wrapper: ({ children }) => <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{children}</SWRConfig>,
  });
}

const specialite = { SpecId: "123" } as DetailedSpecialite;

describe("RcpBlock", () => {
  beforeEach(() => {
    getRCP.mockReset();
    isCentralisee.mockReturnValue(false);
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

  it("links to EMA only after finding no local RCP for a centralized medicine", async () => {
    getRCP.mockResolvedValue(undefined);
    isCentralisee.mockReturnValue(true);

    render(<RcpBlock specialite={specialite} />);

    expect(screen.queryByRole("link", { name: /EMA/ })).toBeNull();
    expect(
      (await screen.findByRole("link", { name: /EMA/ })).getAttribute("href"),
    ).toBe("https://www.ema.europa.eu/en/search");
  });
});

it("does not replace the current RCP with a slower response for the previous medicine", async () => {
  let resolveFirst!: (value: RcpData) => void;
  const first = new Promise<RcpData>((resolve) => { resolveFirst = resolve; });
  getRCP.mockImplementation((id: string) => id === "123" ? first : Promise.resolve({ codeCIS: 456, contentHtml: "<p>Second medicine RCP</p>" }));
  const { rerender } = render(<RcpBlock specialite={specialite} />);
  rerender(<RcpBlock specialite={{ ...specialite, SpecId: "456" }} />);
  expect(await screen.findByText("Second medicine RCP")).not.toBeNull();
  await act(async () => {
    resolveFirst({ codeCIS: 123, contentHtml: "<p>First medicine RCP</p>" });
  });
  expect(screen.getByText("Second medicine RCP")).not.toBeNull();
  expect(screen.queryByText("First medicine RCP")).toBeNull();
});
