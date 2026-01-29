import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import {
  getContentFromData,
  createAddContent,
} from "./utils/contentParser";
import { Kysely } from "kysely";
import { Database } from "@/db/types";

const SAMPLE_NOTICES_PATH = path.join(__dirname, "test_data", "sample_notices.jsonl");
const SAMPLE_RCP_PATH = path.join(__dirname, "test_data", "sample_rcp.jsonl");

async function readJsonlFile(filepath: string): Promise<any[]> {
  const lines: any[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filepath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lines.push(JSON.parse(line));
  }

  return lines;
}

describe("Integration: Parse sample JSONL files", () => {
  describe("sample_notices.jsonl", () => {
    it("should parse all lines without throwing", async () => {
      const lines = await readJsonlFile(SAMPLE_NOTICES_PATH);

      expect(lines.length).toBeGreaterThan(0);

      for (const line of lines) {
        expect(line).toHaveProperty("source");
        expect(line).toHaveProperty("content");
        expect(line.source).toHaveProperty("cis");
        expect(line.source).toHaveProperty("filename");
      }
    });

    it("should extract valid ContentBlocks from each notice", async () => {
      const lines = await readJsonlFile(SAMPLE_NOTICES_PATH);

      for (const line of lines) {
        for (const contentItem of line.content) {
          if (contentItem.content || contentItem.children) {
            const block = await getContentFromData(contentItem);

            // Verify structure
            expect(block).toHaveProperty("type");
            expect(block).toHaveProperty("html");
            expect(block).toHaveProperty("content");
            expect(block).toHaveProperty("children");

            // HTML should be cleaned of <a name=> tags
            if (block.html && block.html.includes("<a")) {
              expect(block.html).not.toMatch(/<a\s+name=/);
            }
          }
        }
      }
    });

    it("should correctly extract metadata (DateNotif, AmmAnnexeTitre)", async () => {
      const lines = await readJsonlFile(SAMPLE_NOTICES_PATH);

      for (const line of lines) {
        const dateNotif = line.content.find(
          (c: any) => c.type === "DateNotif",
        );
        const titre = line.content.find(
          (c: any) => c.type === "AmmAnnexeTitre",
        );

        // Each notice should have these metadata fields
        expect(dateNotif).toBeDefined();
        expect(dateNotif.content).toMatch(/ANSM/);

        expect(titre).toBeDefined();
      }
    });
  });

  describe("sample_rcp.jsonl", () => {
    it("should parse all lines without throwing", async () => {
      const lines = await readJsonlFile(SAMPLE_RCP_PATH);

      expect(lines.length).toBeGreaterThan(0);

      for (const line of lines) {
        expect(line).toHaveProperty("source");
        expect(line).toHaveProperty("content");
      }
    });

    it("should extract valid ContentBlocks from each RCP", async () => {
      const lines = await readJsonlFile(SAMPLE_RCP_PATH);

      for (const line of lines) {
        for (const contentItem of line.content) {
          if (contentItem.content || contentItem.children) {
            const block = await getContentFromData(contentItem);

            expect(block).toHaveProperty("type");
            expect(block).toHaveProperty("html");
          }
        }
      }
    });
  });

  describe("Full pipeline with mocked DB", () => {
    it("should process a notice and capture all DB insertions", async () => {
      const lines = await readJsonlFile(SAMPLE_NOTICES_PATH);
      const firstNotice = lines[0];

      // Track all insertions
      const insertedData: any[] = [];
      const mockExecute = vi.fn().mockImplementation(() => {
        const ids = insertedData.length;
        return Promise.resolve(
          Array.from({ length: insertedData[insertedData.length - 1]?.length || 1 }, (_, i) => ({
            id: ids * 100 + i + 1,
          })),
        );
      });
      const mockValues = vi.fn().mockImplementation((data) => {
        insertedData.push(data);
        return {
          returning: vi.fn().mockReturnValue({
            execute: mockExecute,
          }),
        };
      });
      const mockDb = {
        insertInto: vi.fn().mockReturnValue({
          values: mockValues,
        }),
      };

      const addContent = createAddContent(mockDb as unknown as Kysely<Database>, "notices_content");

      // Process content blocks (excluding metadata)
      const contentBlocks = firstNotice.content.filter(
        (c: any) =>
          c.type !== "DateNotif" &&
          c.type !== "AmmAnnexeTitre" &&
          (c.content || c.children),
      );

      const results = await addContent(contentBlocks);

      // Verify insertions happened
      expect(mockDb.insertInto).toHaveBeenCalledWith("notices_content");
      expect(insertedData.length).toBeGreaterThan(0);

      // Verify all inserted blocks have valid structure
      for (const batch of insertedData) {
        for (const block of batch) {
          expect(block).toHaveProperty("type");
          expect(block).toHaveProperty("html");
        }
      }

      console.log(
        `Processed notice CIS ${firstNotice.source.cis}: ${insertedData.flat().length} content blocks`,
      );
    });
  });
});
