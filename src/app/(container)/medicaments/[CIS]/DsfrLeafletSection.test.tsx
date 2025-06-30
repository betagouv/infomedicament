import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, screen, within } from "@testing-library/react";
import HTMLParser from "node-html-parser";

import { renderServerComponent } from "@/testsUtils/renderServerComponent";
import nock from "nock";

// Otherwise it tries to import ./db and connect to the database
vi.mock("@/db/utils", () => ({ getLeafletImage: vi.fn() }));

describe("DsfrLeafletSection", () => {
  beforeEach(() => {
    nock("https://grist.numerique.gouv.fr/")
      .get(
        `/api/docs/${process.env.GRIST_DOC_ID}/tables/Glossaire/records?sort=manualSort`,
      )
      .reply(200, {
        records: [
          {
            id: 1,
            fields: {
              Nom_glossaire: "Glossary expression",
              Definition_glossaire: "Definition",
              Source: "",
              A_publier: true,
            },
          },
        ],
      });
  });

  //TEMP Empty

  afterEach(() => {
    cleanup();
    nock.cleanAll();
  });

});