import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DetailedSpecialite } from "@/types/SpecialiteTypes";
import IndicationsBlock from "./IndicationsBlock";

vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...classNames: string[]) => classNames.join(" ") },
}));
vi.mock("@codegouvfr/react-dsfr/Tag", () => ({
  default: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
}));
vi.mock("@codegouvfr/react-dsfr/tools/cx", () => ({
  cx: (...classNames: string[]) => classNames.join(" "),
}));
vi.mock("@/components/generic/ContentContainer", () => ({
  default: ({ children, whiteContainer: _whiteContainer, ...props }: React.HTMLAttributes<HTMLDivElement> & { whiteContainer?: boolean }) => (
    <div {...props}>{children}</div>
  ),
}));
vi.mock("@/utils/specialites", () => ({
  isAIP: () => false,
  isCentralisee: () => false,
}));

const specialite = { SpecId: "12345678" } as DetailedSpecialite;

describe("IndicationsBlock", () => {
  it("renders the indication HTML extracted from the notice", () => {
    render(
      <IndicationsBlock
        specialite={specialite}
        indicationsBlock="<p>Ce médicament est indiqué pour :</p><ul><li><strong>la douleur</strong></li></ul>"
      />,
    );

    expect(screen.getByText("Ce médicament est indiqué pour :")).not.toBeNull();
    expect(screen.getByRole("list")).not.toBeNull();
    expect(screen.getByText("la douleur").tagName).toBe("STRONG");
    expect(
      screen.queryByText("Les indications thérapeutiques ne sont pas disponibles."),
    ).toBeNull();
  });
});
