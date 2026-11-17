import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { parse } from "csv-parse/sync";
import { GET } from "./route";
import { getAdvancedSearchExport } from "@/db/utils/advancedSearchExport";

vi.mock("@/db/utils/advancedSearchExport", () => ({
  getAdvancedSearchExport: vi.fn(),
}));
beforeEach(() => vi.clearAllMocks());

it("downloads a complete Excel-compatible CSV with official ATC labels and active filters", async () => {
  vi.mocked(getAdvancedSearchExport).mockResolvedValue([
    {
      cis: "65198099",
      denomination: 'État; "test"',
      procedure: "CENTRALISEE",
      statut_amm: "ACTIVE",
      substances: ["Substance A", "Substance B"],
      holders: ["Titulaire"],
      atcs: [
        { code: "N05AX12", label: "Aripiprazole" },
        { code: "N05ZZ99", label: "Autre classe" },
      ],
      authorizationDate: "2004-06-04",
      marketingStatuses: ["ARRETEE", "COMMERCIALISEE"],
      rcpUpdatedAt: null,
    },
  ]);
  const response = await GET(
    new NextRequest(
      "http://localhost:3000/rechercher/advanced/export?procedure=CENTRALISEE&filterSubstance=Substance+A&page=11",
    ),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Disposition")).toContain("attachment");
  expect(response.headers.get("X-Search-Total-Count")).toBe("1");
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const text = await response.text();
  const [row] = parse(text, { bom: true, delimiter: ";", columns: true });
  expect(row["Dénomination"]).toBe('État; "test"');
  expect(row["Codes ATC"]).toBe("N05AX12 | N05ZZ99");
  expect(row["Libellés ATC"]).toBe("Aripiprazole | Autre classe");
  expect(row["Statut de commercialisation"]).toBe("Commercialisée");
  expect(row["Lien vers la fiche"]).toContain(
    "http://localhost:3000/medicaments/",
  );
  expect(getAdvancedSearchExport).toHaveBeenCalledWith(
    expect.objectContaining({ procedure: "CENTRALISEE" }),
    expect.objectContaining({ page: 11, substances: ["Substance A"] }),
  );
});

it.each([
  "",
  "submitted=1&page=11",
  "specialty=%20%20",
  "filterAtc=N05",
  "procedure=invalid",
  "page=0",
  "filterIndication=oops",
  "s=hidden",
  "authorizationFrom=2024-02-30",
])("rejects invalid export criteria before querying: %s", async (query) => {
  const response = await GET(
    new NextRequest(`http://localhost/rechercher/advanced/export?${query}`),
  );
  expect(response.status).toBe(400);
  expect(getAdvancedSearchExport).not.toHaveBeenCalled();
});

it("returns a valid header-only CSV for zero matches", async () => {
  vi.mocked(getAdvancedSearchExport).mockResolvedValue([]);
  const response = await GET(
    new NextRequest(
      "http://localhost/rechercher/advanced/export?specialty=NO_MATCH",
    ),
  );
  expect(response.headers.get("X-Search-Total-Count")).toBe("0");
  const records = parse(await response.text(), { bom: true, delimiter: ";" });
  expect(records).toHaveLength(1);
  expect(records[0]).toHaveLength(12);
});
