/**
 * BITSTRAP · Website mit dem gebauten Framework versorgen
 *
 * Kopiert dist/ nach site/vendor/. Dadurch ist der Ordner site/
 * vollstaendig eigenstaendig: er laesst sich in ein eigenes Repository
 * heben und auf jedem statischen Hoster ausliefern, ohne dass daneben
 * das Framework liegen muss.
 *
 * Im getrennten Website-Repo uebernimmt spaeter derselbe Schritt das
 * Kopieren aus node_modules/bitstrap/dist - siehe SPLIT.md.
 *
 * Aufruf:  node build/sync-site.mjs
 */

import {
  readdirSync, readFileSync, mkdirSync, copyFileSync, statSync, writeFileSync
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FROM = join(ROOT, "dist");
const TO = join(ROOT, "site", "vendor");

const VERSION = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).version;

mkdirSync(TO, { recursive: true });

let copied = 0;
let bytes = 0;

for (const name of readdirSync(FROM)) {
  const src = join(FROM, name);
  if (!statSync(src).isFile()) continue;
  copyFileSync(src, join(TO, name));
  bytes += statSync(src).size;
  copied++;
}

/* Merkzettel im Zielordner: damit niemand dort von Hand editiert. */
writeFileSync(
  join(TO, "README.md"),
  `# vendor/\n\n` +
    `Diese Dateien sind **Kopien** aus dem Bitstrap-Framework (v${VERSION}).\n` +
    `Nicht von Hand aendern - sie werden bei jedem \`npm run sync\`\n` +
    `ueberschrieben.\n\n` +
    `Quelle: https://github.com/Schapat/bitstrap\n`
);

console.log(
  `site/vendor/: ${copied} Dateien (${(bytes / 1024).toFixed(1)} KB) aktualisiert.`
);
