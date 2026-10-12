import { build } from "esbuild";

await build({
  entryPoints: [
    "scripts/seedInteractionsSearch.ts",
    "scripts/seedReviewApp.ts",
    "scripts/seedSearchIndex.ts",
  ],
  bundle: true,
  platform: "node",
  outdir: ".next/standalone/scripts",
  tsconfig: "tsconfig.json",
  loader: { ".txt": "text" },
});
