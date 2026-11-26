import { describe, expect, it } from "vitest";
import { toJsonLd } from "./index";

describe("utils/structuredData - toJsonLd", () => {
  it("escapes '<' so the content cannot close the script tag", () => {
    const jsonLd = toJsonLd({ headline: "</script><script>alert(1)</script>" });

    expect(jsonLd).not.toContain("<");
    expect(JSON.parse(jsonLd)).toEqual({
      headline: "</script><script>alert(1)</script>",
    });
  });
});
