/**
 * BITSTRAP · Watch
 * Baut bei jeder Aenderung in src/ neu. Entprellt, damit Editoren,
 * die beim Speichern mehrfach schreiben, nicht drei Builds ausloesen.
 *
 * Aufruf:  node build/watch.mjs
 */

import { watch } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

let timer = null;

function build() {
  const res = spawnSync(process.execPath, [join(ROOT, "build", "build.mjs")], {
    stdio: "inherit",
  });
  if (res.status !== 0) console.error("Build fehlgeschlagen.");
}

build();
console.log("\nBeobachte src/ ... (Strg+C zum Beenden)\n");

watch(SRC, { recursive: true }, (_event, file) => {
  // Die generierte Icon-Datei wuerde sich sonst selbst triggern.
  if (file && file.includes("generated")) return;
  clearTimeout(timer);
  timer = setTimeout(build, 80);
});
