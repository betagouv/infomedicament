import { describe, expect, it } from "vitest";
import { parse } from "csv-parse/sync";
import { csvLine } from "./searchCsv";

describe("search CSV", () => {
  it("round-trips quotes, delimiters, Unicode, newlines and empty values", () => {
    const values = [
      "État; actif",
      'Un "libellé"',
      "sur\ndeux lignes",
      "",
      "65198099",
    ];
    expect(parse(csvLine(values), { delimiter: ";" })[0]).toEqual(values);
  });
  it.each(['=HYPERLINK("test")', " +1", "-1", "@SUM(1)", "\t=1", "\r=1"])(
    "neutralizes spreadsheet formulas: %s",
    (value) => {
      expect(parse(csvLine([value]), { delimiter: ";" })[0][0]).toBe(
        `'${value}`,
      );
    },
  );
});
