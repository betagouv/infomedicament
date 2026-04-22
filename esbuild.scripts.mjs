import { build } from "esbuild";

await build({
  entryPoints: [
    "scripts/importNoticeRCP.ts",
    "scripts/seedReviewApp.ts",
    "scripts/seed-search-index.ts",
    "scripts/syncWithGrist.ts",
    "scripts/updateResumeData.ts",
  ],
  bundle: true,
  platform: "node",
  outdir: ".next/standalone/scripts",
  tsconfig: "tsconfig.json",
  loader: { ".txt": "text" },
});
