// Vice City Nights — a make.fun entry for gta6-cover-art-01 (Node 22, stdlib only).
//
// What it hands in: app/ (the cover maker — plain static files, no build step,
// no network request) and screenshots/ (four JPEGs taken with Playwright), plus
// dossier.json, the summary the judge reads, written by the vendored make.fun
// library (vendor/makefun-app.ts, unchanged from the kit).
//
// Try it first: `node serve.ts`, then open http://localhost:8080.
// Hand it in: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`
// (outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The caps the scorer enforces: at most 4 screenshots of 256 KiB each, at most
// 993 files / 48 MiB under app/, and no app/ path over 1000 bytes. buildDossier
// refuses anything over them, so a dossier it writes is one the gate accepts.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copies a directory tree when it exists; the screenshots folder is optional. */
function copyTree(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outDir, name), { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
copyTree('screenshots');

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
