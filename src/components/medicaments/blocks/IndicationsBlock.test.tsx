import { fireEvent, render, screen } from "@testing-library/react";
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

  it("lets users expand and collapse long notice indications", () => {
    render(
      <IndicationsBlock
        specialite={specialite}
        indicationsBlock="<p>Une indication longue et complète</p>"
        indicationsBlockPreview="<p>Une indication…</p>"
        resizable
      />,
    );

    const expandButton = screen.getByRole("button", { name: "Lire plus" });
    expect(expandButton.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByText("Une indication…")).not.toBeNull();

    fireEvent.click(expandButton);

    const collapseButton = screen.getByRole("button", { name: "Lire moins" });
    expect(collapseButton.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("Une indication longue et complète")).not.toBeNull();
  });

  it("shows short indications in full without a toggle", () => {
    render(
      <IndicationsBlock
        specialite={specialite}
        indicationsBlock="<p>Une indication courte</p>"
        resizable
      />,
    );

    expect(screen.getByText("Une indication courte")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Lire plus" })).toBeNull();
  });
});
