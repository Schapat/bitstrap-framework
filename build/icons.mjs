/**
 * BITSTRAP · Icon-Generator
 *
 * Icons werden als 8x8-Zeichenraster notiert ("#" = Pixel, "." = leer).
 * Daraus entsteht ein SVG mit zusammengefassten Rechtecken pro Zeile,
 * das als CSS-Maske eingebettet wird. Ergebnis: eine Icon-Familie ohne
 * Font, ohne Sprite-Sheet, ohne HTTP-Request - und faerbbar per color.
 */

export const ICONS = {
  heart: [
    ".##..##.",
    "########",
    "########",
    "########",
    ".######.",
    "..####..",
    "...##...",
    "........",
  ],
  star: [
    "...##...",
    "...##...",
    "########",
    ".######.",
    "..####..",
    ".##..##.",
    "##....##",
    "........",
  ],
  coin: [
    "..####..",
    ".######.",
    ".##..##.",
    ".##..##.",
    ".##..##.",
    ".######.",
    "..####..",
    "........",
  ],
  gem: [
    "........",
    ".######.",
    "########",
    "########",
    ".######.",
    "..####..",
    "...##...",
    "........",
  ],
  sword: [
    "...##...",
    "...##...",
    "...##...",
    "...##...",
    ".######.",
    "...##...",
    "...##...",
    "...##...",
  ],
  shield: [
    "########",
    "########",
    ".######.",
    ".######.",
    "..####..",
    "..####..",
    "...##...",
    "........",
  ],
  key: [
    ".####...",
    ".#..#...",
    ".####...",
    "..##....",
    "..###...",
    "..##....",
    "..###...",
    "..##....",
  ],
  potion: [
    "..####..",
    "...##...",
    "...##...",
    "..####..",
    ".######.",
    ".######.",
    "..####..",
    "........",
  ],
  skull: [
    ".######.",
    "########",
    "##.##.##",
    "##.##.##",
    "########",
    ".######.",
    ".##.##..",
    "........",
  ],
  ghost: [
    "..####..",
    ".######.",
    "##.##.##",
    "########",
    "########",
    "########",
    "########",
    "##.##.##",
  ],
  invader: [
    "..#..#..",
    "...##...",
    "..####..",
    ".######.",
    "########",
    "#.####.#",
    "#.#..#.#",
    "..#..#..",
  ],
  user: [
    "..####..",
    "..####..",
    "..####..",
    "........",
    ".######.",
    "########",
    "########",
    "########",
  ],
  pad: [
    "........",
    "........",
    ".######.",
    "########",
    "#.####.#",
    ".######.",
    "........",
    "........",
  ],
  bolt: [
    "....##..",
    "...##...",
    "..###...",
    ".#####..",
    "...###..",
    "..##....",
    ".##.....",
    "##......",
  ],
  power: [
    "...##...",
    ".#.##.#.",
    "#..##..#",
    "#..##..#",
    "#......#",
    "#......#",
    ".#....#.",
    "..####..",
  ],
  check: [
    "........",
    "......##",
    ".....##.",
    "#...##..",
    "##.##...",
    ".####...",
    "..##....",
    "........",
  ],
  cross: [
    "##....##",
    "###..###",
    ".######.",
    "..####..",
    "..####..",
    ".######.",
    "###..###",
    "##....##",
  ],
  plus: [
    "...##...",
    "...##...",
    "...##...",
    "########",
    "########",
    "...##...",
    "...##...",
    "...##...",
  ],
  minus: [
    "........",
    "........",
    "........",
    "########",
    "########",
    "........",
    "........",
    "........",
  ],
  menu: [
    "........",
    "########",
    "........",
    "########",
    "........",
    "########",
    "........",
    "........",
  ],
  search: [
    ".#####..",
    "#.....#.",
    "#.....#.",
    "#.....#.",
    ".#####..",
    "....###.",
    ".....###",
    "......##",
  ],
  lock: [
    "..####..",
    ".##..##.",
    ".##..##.",
    "########",
    "###..###",
    "########",
    "########",
    "........",
  ],
  arrow: [
    "...##...",
    "..####..",
    ".######.",
    "########",
    "...##...",
    "...##...",
    "...##...",
    "........",
  ],
};

/** Dreht ein Raster um 90 Grad im Uhrzeigersinn. */
function rotate(grid) {
  const size = grid.length;
  const out = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      row += grid[size - 1 - x][y];
    }
    out.push(row);
  }
  return out;
}

/**
 * Fasst pro Zeile zusammenhaengende Pixel zu einem Rechteck zusammen.
 * Aus 64 Einzelpixeln werden so typischerweise 8-14 Rects - das haelt
 * die Data-URI kurz.
 */
function gridToRects(grid) {
  const rects = [];
  grid.forEach((row, y) => {
    let start = -1;
    for (let x = 0; x <= row.length; x++) {
      const filled = row[x] === "#";
      if (filled && start === -1) start = x;
      if (!filled && start !== -1) {
        rects.push(`<rect x="${start}" y="${y}" width="${x - start}" height="1"/>`);
        start = -1;
      }
    }
  });
  return rects.join("");
}

function gridToDataUri(grid) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" ` +
    `shape-rendering="crispEdges" fill="#000">${gridToRects(grid)}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function buildIconCss() {
  // Pfeile werden aus einem einzigen Raster abgeleitet, statt vier Mal
  // dasselbe Icon von Hand zu zeichnen.
  const arrowUp = ICONS.arrow;
  const arrowRight = rotate(arrowUp);
  const arrowDown = rotate(arrowRight);
  const arrowLeft = rotate(arrowDown);

  const all = { ...ICONS };
  delete all.arrow;
  all["arrow-up"] = arrowUp;
  all["arrow-right"] = arrowRight;
  all["arrow-down"] = arrowDown;
  all["arrow-left"] = arrowLeft;

  const head = `/* ==========================================================================
   BITSTRAP · Icons  (generiert von build/icons.mjs - nicht von Hand aendern)
   Faerbung ueber \`color\`, Groesse ueber --bit-icon-size.
   ========================================================================== */

.bit-icon {
  display: inline-block;
  flex: 0 0 auto;
  width: var(--bit-icon-size, var(--bit-px-8));
  height: var(--bit-icon-size, var(--bit-px-8));
  background-color: currentColor;
  vertical-align: middle;
  -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
  -webkit-mask-position: center;
          mask-position: center;
  -webkit-mask-size: 100% 100%;
          mask-size: 100% 100%;
}

.bit-icon--xs { --bit-icon-size: var(--bit-px-4); }
.bit-icon--sm { --bit-icon-size: var(--bit-px-6); }
.bit-icon--lg { --bit-icon-size: calc(var(--bit-px) * 12); }
.bit-icon--xl { --bit-icon-size: calc(var(--bit-px) * 20); }
`;

  const rules = Object.keys(all)
    .sort()
    .map((name) => {
      const uri = gridToDataUri(all[name]);
      return (
        `\n.bit-icon--${name} {\n` +
        `  -webkit-mask-image: url("${uri}");\n` +
        `          mask-image: url("${uri}");\n` +
        `}\n`
      );
    })
    .join("");

  return head + rules;
}

export const ICON_NAMES = (() => {
  const names = Object.keys(ICONS).filter((n) => n !== "arrow");
  return names.concat(["arrow-up", "arrow-right", "arrow-down", "arrow-left"]).sort();
})();
