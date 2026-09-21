import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_CIS_CODES = [
  "65701038",
  "69174918",
  "60928110",
  "64460075",
  "66663761",
  "64783769",
  "60657189",
  "64460075",
  "60928110",
  "60123598",
];

const productionOrigin =
  process.env.PRODUCTION_URL ?? "https://infomedicament.beta.gouv.fr";
const localOrigin = process.env.LOCAL_URL ?? "http://localhost:3000";
const reportDirectory = path.resolve(
  process.env.REPORT_DIR ?? "medicine-comparison-report",
);

type PageSnapshot = {
  url: string;
  status: number | null;
  tree: string;
  screenshot: string | null;
  error: string | null;
};

type DiffLine = {
  kind: "same" | "removed" | "added";
  text: string;
  productionLine: number | null;
  localLine: number | null;
};

type Comparison = {
  cis: string;
  production: PageSnapshot;
  local: PageSnapshot;
  diff: DiffLine[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeTree(tree: string) {
  return tree
    .replaceAll(productionOrigin.replace(/\/$/, ""), "<origin>")
    .replaceAll(localOrigin.replace(/\/$/, ""), "<origin>")
    .replaceAll(/blob:[^\s"']+/g, "<blob-url>")
    .trim();
}

function diffLines(productionText: string, localText: string): DiffLine[] {
  const production = productionText ? productionText.split("\n") : [];
  const local = localText ? localText.split("\n") : [];
  const width = local.length + 1;
  const lcs = new Uint32Array((production.length + 1) * width);

  for (
    let productionIndex = production.length - 1;
    productionIndex >= 0;
    productionIndex--
  ) {
    for (let localIndex = local.length - 1; localIndex >= 0; localIndex--) {
      const index = productionIndex * width + localIndex;
      lcs[index] =
        production[productionIndex] === local[localIndex]
          ? lcs[(productionIndex + 1) * width + localIndex + 1] + 1
          : Math.max(
              lcs[(productionIndex + 1) * width + localIndex],
              lcs[index + 1],
            );
    }
  }

  const result: DiffLine[] = [];
  let productionIndex = 0;
  let localIndex = 0;

  while (productionIndex < production.length || localIndex < local.length) {
    if (
      productionIndex < production.length &&
      localIndex < local.length &&
      production[productionIndex] === local[localIndex]
    ) {
      result.push({
        kind: "same",
        text: production[productionIndex],
        productionLine: productionIndex + 1,
        localLine: localIndex + 1,
      });
      productionIndex++;
      localIndex++;
    } else if (
      localIndex >= local.length ||
      (productionIndex < production.length &&
        lcs[(productionIndex + 1) * width + localIndex] >=
          lcs[productionIndex * width + localIndex + 1])
    ) {
      result.push({
        kind: "removed",
        text: production[productionIndex],
        productionLine: productionIndex + 1,
        localLine: null,
      });
      productionIndex++;
    } else {
      result.push({
        kind: "added",
        text: local[localIndex],
        productionLine: null,
        localLine: localIndex + 1,
      });
      localIndex++;
    }
  }

  return result;
}

async function settlePage(page: Page) {
  await page.locator("body").waitFor({ state: "visible", timeout: 15_000 });
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready);
}

async function snapshotPage(
  context: BrowserContext,
  origin: string,
  cis: string,
  environment: "production" | "local",
): Promise<PageSnapshot> {
  const page = await context.newPage();
  const screenshotName = `${cis}-${environment}.png`;
  let status: number | null = null;

  try {
    await page.addInitScript(() => {
      window.localStorage.setItem("greetingModal", String(Date.now()));
    });
    const response = await page.goto(
      `${origin.replace(/\/$/, "")}/medicaments/${cis}`,
      {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      },
    );
    status = response?.status() ?? null;
    await settlePage(page);
    const tree = normalizeTree(
      await page.locator("body").ariaSnapshot({ timeout: 15_000 }),
    );
    await page.screenshot({
      path: path.join(reportDirectory, screenshotName),
      fullPage: true,
      animations: "disabled",
    });

    return {
      url: page.url(),
      status,
      tree,
      screenshot: screenshotName,
      error: status !== null && status >= 400 ? `HTTP ${status}` : null,
    };
  } catch (error) {
    return {
      url: page.url() || `${origin.replace(/\/$/, "")}/medicaments/${cis}`,
      status,
      tree: "",
      screenshot: null,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await page.close();
  }
}

function renderDiffRows(diff: DiffLine[]) {
  const changedIndexes = diff.flatMap((line, index) =>
    line.kind === "same" ? [] : [index],
  );
  if (changedIndexes.length === 0) {
    return '<p class="identical">No rendered accessibility differences found.</p>';
  }

  const visible = new Set<number>();
  for (const index of changedIndexes) {
    for (
      let contextIndex = Math.max(0, index - 2);
      contextIndex <= Math.min(diff.length - 1, index + 2);
      contextIndex++
    ) {
      visible.add(contextIndex);
    }
  }

  let previousIndex = -1;
  const rows: string[] = [];
  for (const index of [...visible].sort((a, b) => a - b)) {
    if (previousIndex !== -1 && index > previousIndex + 1) {
      rows.push(
        '<tr class="omitted"><td colspan="4">Unchanged lines omitted</td></tr>',
      );
    }
    const line = diff[index];
    const marker =
      line.kind === "removed" ? "-" : line.kind === "added" ? "+" : " ";
    rows.push(`<tr class="${line.kind}">
      <td>${line.productionLine ?? ""}</td>
      <td>${line.localLine ?? ""}</td>
      <td>${marker}</td>
      <td><pre>${escapeHtml(line.text)}</pre></td>
    </tr>`);
    previousIndex = index;
  }

  return `<table class="diff">
    <thead><tr><th>Prod</th><th>Local</th><th></th><th>Rendered accessibility tree</th></tr></thead>
    <tbody>${rows.join("\n")}</tbody>
  </table>`;
}

function renderSnapshotSummary(label: string, snapshot: PageSnapshot) {
  const status =
    snapshot.status === null ? "No response" : `HTTP ${snapshot.status}`;
  return `<div>
    <strong>${label}</strong>
    <span class="status">${status}</span>
    <a href="${escapeHtml(snapshot.url)}">${escapeHtml(snapshot.url)}</a>
    ${snapshot.error ? `<p class="error">${escapeHtml(snapshot.error)}</p>` : ""}
  </div>`;
}

function renderReport(comparisons: Comparison[]) {
  const differentCount = comparisons.filter(
    ({ diff, production, local }) =>
      diff.some((line) => line.kind !== "same") ||
      production.error ||
      local.error,
  ).length;
  const generatedAt = new Date().toISOString();

  const sections = comparisons
    .map(({ cis, production, local, diff }) => {
      const differenceCount = diff.filter(
        (line) => line.kind !== "same",
      ).length;
      const hasDifference =
        differenceCount > 0 || production.error || local.error;
      return `<section>
        <header class="comparison-header">
          <h2>CIS ${cis}</h2>
          <span class="badge ${hasDifference ? "different" : "identical-badge"}">
            ${hasDifference ? `${differenceCount} changed lines` : "Identical"}
          </span>
        </header>
        <div class="summaries">
          ${renderSnapshotSummary("Production", production)}
          ${renderSnapshotSummary("Local", local)}
        </div>
        <details open>
          <summary>Differences</summary>
          ${renderDiffRows(diff)}
        </details>
        <details>
          <summary>Screenshots</summary>
          <div class="screenshots">
            ${production.screenshot ? `<figure><figcaption>Production</figcaption><a href="${production.screenshot}"><img loading="lazy" src="${production.screenshot}" alt="Production screenshot for CIS ${cis}"></a></figure>` : ""}
            ${local.screenshot ? `<figure><figcaption>Local</figcaption><a href="${local.screenshot}"><img loading="lazy" src="${local.screenshot}" alt="Local screenshot for CIS ${cis}"></a></figure>` : ""}
          </div>
        </details>
      </section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Medicine page comparison</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; color: #1e1e2a; background: #f4f4f8; }
    body { margin: 0 auto; max-width: 1600px; padding: 2rem; }
    h1, h2 { margin: 0; }
    .report-summary { margin: .75rem 0 2rem; color: #555568; }
    section { margin: 0 0 2rem; padding: 1.25rem; border: 1px solid #d8d8e2; border-radius: .5rem; background: white; box-shadow: 0 2px 8px #1e1e2a0d; }
    .comparison-header, .summaries, .screenshots { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .comparison-header { display: flex; align-items: center; justify-content: space-between; }
    .badge, .status { display: inline-block; padding: .2rem .5rem; border-radius: 999px; font-size: .8rem; font-weight: 650; }
    .different { color: #8a1c12; background: #ffe9e6; }
    .identical-badge, .identical { color: #176b3a; background: #e8f7ed; }
    .summaries { margin: 1rem 0; }
    .summaries > div { min-width: 0; padding: .8rem; border-radius: .3rem; background: #f5f5fa; }
    .summaries strong, .summaries a { display: block; margin-bottom: .35rem; overflow-wrap: anywhere; }
    .status { width: fit-content; margin-bottom: .35rem; background: #e7e7ef; }
    .error { max-height: 8rem; overflow: auto; color: #a21c12; white-space: pre-wrap; }
    details { margin-top: 1rem; }
    summary { cursor: pointer; font-weight: 700; }
    .identical { padding: .75rem; border-radius: .3rem; }
    .diff { width: 100%; margin-top: .75rem; border-collapse: collapse; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .82rem; }
    .diff th { position: sticky; top: 0; text-align: left; background: #ededf3; }
    .diff td, .diff th { padding: .25rem .5rem; border: 1px solid #dddde6; vertical-align: top; }
    .diff td:first-child, .diff td:nth-child(2), .diff td:nth-child(3) { width: 1%; color: #737386; text-align: right; user-select: none; }
    .diff pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .removed { background: #ffebe9; }
    .added { background: #e6ffec; }
    .omitted { color: #737386; text-align: center; background: #f5f5f8; }
    figure { min-width: 0; margin: 1rem 0 0; }
    figcaption { margin-bottom: .5rem; font-weight: 700; }
    img { display: block; width: 100%; border: 1px solid #dddde6; }
    @media (max-width: 760px) { body { padding: 1rem; } .summaries, .screenshots { grid-template-columns: 1fr; } .diff { font-size: .72rem; } }
  </style>
</head>
<body>
  <h1>Medicine page comparison</h1>
  <p class="report-summary">Generated ${generatedAt}. Compared ${comparisons.length} unique CIS codes; ${differentCount} with differences or errors.</p>
  ${sections}
</body>
</html>`;
}

async function main() {
  const requestedCodes = process.argv.slice(2);
  const invalidCodes = requestedCodes.filter((code) => !/^\d{8}$/.test(code));
  if (invalidCodes.length > 0) {
    throw new Error(
      `Invalid CIS code(s): ${invalidCodes.join(", ")}. Expected 8 digits.`,
    );
  }
  const cisCodes = [
    ...new Set(requestedCodes.length > 0 ? requestedCodes : DEFAULT_CIS_CODES),
  ];

  await mkdir(reportDirectory, { recursive: true });
  const browser = await chromium.launch();
  const productionContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const localContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const comparisons: Comparison[] = [];

  try {
    for (const cis of cisCodes) {
      console.info(`Comparing CIS ${cis}...`);
      const [production, local] = await Promise.all([
        snapshotPage(productionContext, productionOrigin, cis, "production"),
        snapshotPage(localContext, localOrigin, cis, "local"),
      ]);
      comparisons.push({
        cis,
        production,
        local,
        diff: diffLines(production.tree, local.tree),
      });
    }
  } finally {
    await browser.close();
  }

  const reportPath = path.join(reportDirectory, "index.html");
  await writeFile(reportPath, renderReport(comparisons), "utf8");
  console.info(`HTML report: file://${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
