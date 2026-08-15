/**
 * BITSTRAP · Verifikation
 *
 * Prueft die Doku-Website gegen das gebaute Framework:
 *   1. Loesen alle lokalen Verweise (href/src) auf existierende Dateien auf?
 *   2. Existiert jede benutzte bit-Klasse im gebauten CSS?
 *   3. Zeigen alle Sprungziele (#anker) auf vorhandene IDs?
 *   4. Sind die data-bit-target-Ziele vorhanden?
 *
 * Aufruf:  node build/verify.mjs
 */

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CSS = readFileSync(join(ROOT, "dist", "bitstrap.css"), "utf8");
const DOCS_CSS = readFileSync(join(ROOT, "site", "assets", "docs.css"), "utf8");

/* Alle im CSS definierten Klassennamen einsammeln. */
const defined = new Set();
for (const source of [CSS, DOCS_CSS]) {
  for (const m of source.matchAll(/\.([a-zA-Z][\w-]*)/g)) defined.add(m[1]);
}

/* Klassen, die erst zur Laufzeit von JavaScript erzeugt werden. */
const RUNTIME_OK = new Set(["is-empty", "is-loading", "is-active", "is-open", "is-valid", "is-invalid", "is-leaving", "is-done", "is-disabled"]);

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

let errors = 0;
let checkedClasses = 0;
let checkedLinks = 0;

/**
 * Entfernt <pre>-Bloecke. Deren Inhalt ist abgedruckter Beispielcode:
 * dort stehen href-Angaben und data-bit-target-Werte, die absichtlich
 * ins Leere zeigen - sie sind Dokumentation, keine echten Verweise.
 */
function stripCodeBlocks(html) {
  return html.replace(/<pre[\s\S]*?<\/pre>/g, "").replace(/<code[\s\S]*?<\/code>/g, "");
}

for (const file of htmlFiles(join(ROOT, "site"))) {
  const raw = readFileSync(file, "utf8");
  const html = stripCodeBlocks(raw);
  const rel = file.slice(ROOT.length + 1);
  const dir = dirname(file);
  const problems = [];

  /* ---- 1. Lokale Dateiverweise ---------------------------------------- */
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (ref.startsWith("http") || ref.startsWith("#") || ref.startsWith("data:")) continue;
    checkedLinks++;
    const target = resolve(dir, ref.split("#")[0]);
    if (!existsSync(target)) problems.push(`fehlende Datei: ${ref}`);
  }

  /* ---- 2. Benutzte Klassen -------------------------------------------- */
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const cls of m[1].split(/\s+/)) {
      if (!cls) continue;
      if (!cls.startsWith("bit-") && !cls.startsWith("is-")) continue;
      checkedClasses++;
      if (!defined.has(cls) && !RUNTIME_OK.has(cls)) {
        problems.push(`unbekannte Klasse: .${cls}`);
      }
    }
  }

  /* ---- 3. Interne Sprungziele ----------------------------------------- */
  const ids = new Set(Array.from(html.matchAll(/id="([^"]+)"/g), (m) => m[1]));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (!ids.has(m[1])) problems.push(`toter Anker: #${m[1]}`);
  }

  /* ---- 4. JS-Ziele ----------------------------------------------------- */
  for (const m of html.matchAll(/data-bit-target="#([^"]+)"/g)) {
    if (!ids.has(m[1])) problems.push(`data-bit-target ohne Ziel: #${m[1]}`);
  }

  const unique = [...new Set(problems)];
  if (unique.length) {
    errors += unique.length;
    console.log(`\n${rel}`);
    unique.forEach((p) => console.log("  x " + p));
  }
}

console.log(
  `\nGeprueft: ${checkedLinks} Verweise, ${checkedClasses} Klassenangaben.`
);
console.log(errors === 0 ? "Keine Probleme gefunden." : `${errors} Problem(e).`);
process.exit(errors === 0 ? 0 : 1);
