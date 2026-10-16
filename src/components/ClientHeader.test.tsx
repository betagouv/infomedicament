import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ClientHeader from "./ClientHeader";
import Link from "next/link";
import { setLink } from "@codegouvfr/react-dsfr/link";

const route = vi.hoisted(() => ({
  segment: null as string | null,
  pending: false,
}));
const pendingRoute = new Promise<never>(() => {});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSelectedLayoutSegment: () => {
    if (route.pending) throw pendingRoute;
    return route.segment;
  },
}));
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false }),
}));
vi.mock("@/services/tracking", () => ({
  useTracking: vi.fn(),
  trackSearchEvent: vi.fn(),
}));

beforeEach(() => {
  setLink({ Link });
  route.segment = null;
  route.pending = false;
});

describe("header route-dependent search", () => {
  it("prerenders the header when the selected segment is unavailable", () => {
    route.pending = true;
    let html = "";
    expect(() => {
      html = renderToString(<ClientHeader atcs={[]} />);
    }).not.toThrow();
    expect(html).toContain('id="fr-header"');
    expect(html).toContain("Info Médicament");
  });

  it("updates search visibility when navigating between routes", () => {
    route.segment = "substances";
    const { rerender } = render(<ClientHeader atcs={[]} />);
    expect(screen.getByRole("combobox")).not.toBeNull();

    route.segment = "rechercher";
    rerender(<ClientHeader atcs={[]} />);
    expect(screen.queryByRole("combobox")).toBeNull();

    route.segment = "medicaments";
    rerender(<ClientHeader atcs={[]} />);
    expect(screen.getByRole("combobox")).not.toBeNull();

    route.segment = null;
    rerender(<ClientHeader atcs={[]} />);
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});
