import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MedicamentContent from "./MedicamentContent";
import type { MedicamentData } from "./MedicamentData";
import type { DetailedSpecialite } from "@/types/SpecialiteTypes";

afterEach(() => vi.unstubAllGlobals());

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
vi.mock("@/services/tracking", () => ({ trackEvent: vi.fn() }));
vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false }),
}));

const specialite: DetailedSpecialite = {
  SpecId: "60234100",
  SpecDenom01: "DOLIPRANE 1000 mg, comprimé",
  ProcId: "NATIONALE",
  StatutBdm: 1,
  Een: null,
  StatId: null,
  SpecDateAMM: null,
  SpecStatDate: null,
  statutAutorisation: null,
  statutComm: null,
  titulairesList: null,
  genericGroupCode: null,
  genericGroupName: null,
  referenceSpecialite: null,
};

describe("medicine loading", () => {
  it.each([
    ["description", /À quoi sert-il/],
    ["combienPrendre", /Combien en prendre/],
    ["contenu", /Composition/],
  ] as const)(
    "shows the %s answer in the result block without scrolling even when leaflet anchors exist",
    async (questionId, label) => {
      Element.prototype.scrollIntoView = vi.fn();
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            status: "supported",
            sourceVersion: "source",
            passages: [
              {
                id: "p",
                html: "",
                headingPath: ["Rubrique officielle"],
                target: { anchor: "Ann3bQuestceque" },
                quotes: [
                  {
                    id: "q",
                    html: "<p>Réponse officielle du picto.</p>",
                    headingPath: ["Rubrique officielle"],
                  },
                ],
              },
            ],
          }),
        ),
      );
      vi.stubGlobal("fetch", fetchMock);
      const specialite: DetailedSpecialite = {
        SpecId: "60234100",
        SpecDenom01: "Médicament de test",
        ProcId: "NATIONALE",
        StatutBdm: 1,
        Een: null,
        StatId: null,
        SpecDateAMM: null,
        SpecStatDate: null,
        statutAutorisation: null,
        statutComm: null,
        titulairesList: null,
        genericGroupCode: null,
        genericGroupName: null,
        referenceSpecialite: null,
      };
      const data = Promise.resolve<MedicamentData>({
        notice: {
          codeCIS: 60234100,
          contentHtml:
            '<h2 id="Ann3bQuestceque">Indication</h2><p>Texte de la notice.</p><h2 id="Ann3bEmballage">Contenu officiel</h2><p>Composition officielle.</p>',
        },
        definitions: [],
        indications: [],
        articles: [],
        stocks: [],
        isPrinceps: false,
        isGeneric: false,
        isPregnancyMentionAlert: false,
      });
      await act(async () => {
        render(
          <MedicamentContent
            title="Médicament de test"
            data={data}
            specialite={specialite}
            atcList={[]}
            composants={[]}
            delivrance={[]}
            presentations={[]}
            isAdvanced={false}
          />,
        );
      });
      expect(document.getElementById("Ann3bQuestceque")).not.toBeNull();
      await act(async () => {
        fireEvent.click(screen.getAllByRole("button", { name: label })[0]);
      });
      for (const block of screen.getAllByRole("region", {
        name: "Extraits de la notice",
      })) {
        expect(
          within(block).getByText("Réponse officielle du picto."),
        ).not.toBeNull();
        expect(
          within(block)
            .getByRole("link", { name: /Source/ })
            .getAttribute("href"),
        ).toBe("#Ann3bQuestceque");
      }
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toContain(
        `notice-search?question=${questionId}`,
      );
      expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
      expect(screen.queryByLabelText("Rechercher dans la notice")).toBeNull();
    },
  );

  it("keeps the title and preset controls mounted while details resolve without a custom search field", async () => {
    let resolveData!: (value: MedicamentData) => void;
    const data = new Promise<MedicamentData>((resolve) => {
      resolveData = resolve;
    });

    await act(async () => {
      render(
        <MedicamentContent
          specialite={specialite}
          isAdvanced={false}
          title="Médicament de test"
          data={data}
          atcList={[]}
          composants={[]}
          delivrance={[]}
          presentations={[]}
        />,
      );
    });

    expect(
      screen.getByRole("heading", { name: "Médicament de test" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Notice complète" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("status", { name: "Chargement de la notice" }),
    ).not.toBeNull();
    expect(
      screen.getAllByRole("button", { pressed: false }).length,
    ).toBeGreaterThan(0);
    const picto = screen.getAllByRole("button", { name: /À quoi sert-il/ })[0];
    expect(screen.queryByLabelText("Rechercher dans la notice")).toBeNull();

    await act(async () => {
      resolveData({
        definitions: [],
        indications: [],
        articles: [],
        stocks: [],
        isPrinceps: false,
        isGeneric: false,
        isPregnancyMentionAlert: false,
      });
    });

    expect(
      screen.queryByRole("status", { name: "Chargement de la notice" }),
    ).toBeNull();
    expect(screen.getAllByRole("button", { name: /À quoi sert-il/ })[0]).toBe(
      picto,
    );
    expect(screen.queryByLabelText("Rechercher dans la notice")).toBeNull();
    expect(
      screen.getByText("La notice n’est pas disponible pour ce médicament."),
    ).not.toBeNull();
  });

  it("opens the detailed version on its own page when switching", async () => {
    mockPush.mockClear();
    await act(async () => {
      render(
        <MedicamentContent
          specialite={specialite}
          isAdvanced={false}
          title="Médicament de test"
          data={new Promise<MedicamentData>(() => {})}
          atcList={[]}
          composants={[]}
          delivrance={[]}
          presentations={[]}
        />,
      );
    });

    fireEvent.click(screen.getAllByLabelText("Version détaillée")[0]);

    expect(mockPush).toHaveBeenCalledWith(
      "/medicaments/doliprane-1000-mg-comprime-60234100/details",
    );
  });
});
