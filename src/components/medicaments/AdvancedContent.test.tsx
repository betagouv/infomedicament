import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import AdvancedContent from "./AdvancedContent";
import { DetailsNoticePartsEnum } from "@/types/NoticeTypes";

vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: { cx: (...names: string[]) => names.join(" ") },
}));
vi.mock("@/utils/notices", () => ({ displayInfosImportantes: () => false }));
vi.mock("./blocks/DesktopTitleBlock", () => ({ default: () => null }));
vi.mock("./blocks/SwitchNoticeAdvancedBlock", () => ({ default: () => null }));
vi.mock("./blocks/MedicamentContentHeaderBlock", () => ({
  default: () => null,
}));
vi.mock("./advanced/GeneralInformations", () => ({
  default: () => <div id="informations-resume">General content</div>,
}));
vi.mock("./advanced/DocumentHas", () => ({
  default: () => <div id="document-has-smr">HAS content</div>,
}));
vi.mock("./advanced/RcpBlock", () => ({
  default: () => <div>RCP content</div>,
}));
vi.mock("./advanced/DetailedSubMenu", () => ({
  default: ({
    navigation,
    onNavigate,
  }: {
    navigation: { menuPart: DetailsNoticePartsEnum; anchor?: string };
    onNavigate: (value: {
      menuPart: DetailsNoticePartsEnum;
      anchor?: string;
    }) => void;
  }) => (
    <>
      <span data-testid="selected-section">{navigation.menuPart}</span>
      <button
        onClick={() => onNavigate({ menuPart: DetailsNoticePartsEnum.RCP })}
      >
        RCP
      </button>
    </>
  ),
}));

const props = {
  composants: [],
  isPrinceps: false,
  isGeneric: false,
  delivrance: [],
  pregnancyPlanAlert: undefined,
  isPregnancyMentionAlert: false,
  pediatrics: undefined,
  presentations: [],
  indications: [],
  title: "Medicine",
  stocks: [],
  onGoToAdvanced: vi.fn(),
};
const scrollIntoView = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

it("uses the requested section immediately and synchronizes subsequent navigation", () => {
  const { rerender } = render(
    <AdvancedContent
      {...props}
      advancedAnchor={{
        menuPart: DetailsNoticePartsEnum.HAS,
        anchor: "document-has-smr",
      }}
    />,
  );
  expect(screen.getByTestId("selected-section").textContent).toBe(
    String(DetailsNoticePartsEnum.HAS),
  );
  expect(
    window.getComputedStyle(document.getElementById("document-has")!).display,
  ).not.toBe("none");
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "RCP" }));
  expect(screen.getByTestId("selected-section").textContent).toBe(
    String(DetailsNoticePartsEnum.RCP),
  );
  expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  expect(
    window.getComputedStyle(document.getElementById("document-has")!).display,
  ).toBe("none");
  rerender(
    <AdvancedContent
      {...props}
      advancedAnchor={{
        menuPart: DetailsNoticePartsEnum.INFORMATIONS_GENERALES,
        anchor: "informations-resume",
      }}
    />,
  );
  expect(screen.getByTestId("selected-section").textContent).toBe(
    String(DetailsNoticePartsEnum.INFORMATIONS_GENERALES),
  );
  expect(scrollIntoView).toHaveBeenCalledTimes(2);
});

it("waits for an anchor in asynchronously loaded RCP HTML", async () => {
  render(
    <AdvancedContent
      {...props}
      advancedAnchor={{
        menuPart: DetailsNoticePartsEnum.RCP,
        anchor: "RcpPosoAdmin",
      }}
    />,
  );
  expect(scrollIntoView).not.toHaveBeenCalled();
  const anchor = document.createElement("h3");
  anchor.id = "RcpPosoAdmin";
  document.getElementById("rcp-denomiation")!.appendChild(anchor);
  await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
});
