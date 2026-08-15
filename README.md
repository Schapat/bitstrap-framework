# Bitstrap

**Das 8-Bit-CSS-Framework.** Grid, Komponenten, Formulare, Icons und JavaScript
im Pixel-Art-Stil — ohne Abhängigkeiten, ohne Build-Zwang, ~17 KB gzip.

### → [Website & Dokumentation ansehen](https://schapat.github.io/bitstrap/)

Dort findest du fertige Blöcke zum Kopieren (Anmeldung, Dashboard, Preise,
Einstellungen, Bestellvorgang, Profil), alle Komponenten zum Ausprobieren und
sechs Themes zum Durchschalten. Der Quelltext der Seite liegt in
[Schapat/bitstrap](https://github.com/Schapat/bitstrap).

```html
<link rel="stylesheet" href="bitstrap.min.css">
<script src="bitstrap.min.js" defer></script>

<button class="bit-btn bit-btn--primary">Start</button>
```

Das JavaScript ist in drei Ebenen geteilt, damit niemand lädt, was er
nicht braucht:

| Datei | Größe (min) | Inhalt |
|---|---|---|
| `bitstrap.min.js` | 14 KB | Kern: Modal, Tabs, Accordion, Dropdown, Toast, Theme, Typewriter, i18n |
| `bitstrap-ui.min.js` | 12 KB | Drawer, Popover, Stepper, Carousel, Tabellen-Sortierung, Baum, Zähler |
| `bitstrap-forms.min.js` | 20 KB | Datepicker, Combobox, Tags, Zahlenfeld, Dropzone, OTP, Validierung |
| `bitstrap-locales.min.js` | 4 KB | neun weitere Sprachen (en/de sind im Kern) |
| `bitstrap.bundle.min.js` | 53 KB | alle vier zusammen |

Die Zusatzmodule setzen den Kern voraus und werden nach ihm geladen.

---

## Was drin ist

| Bereich | Inhalt |
|---|---|
| **Layout** | Container, 12-Spalten-Grid mit 4 Breakpoints, Stack, Cluster, Split, Tiles, App-Shell mit Sidebar |
| **Komponenten** | Buttons, Karten, Alerts, Badges, Tabellen, Listen, Avatare, Fortschrittsbalken, Spinner, Pagination, Breadcrumb, Divider, Toolbar, Split-Button |
| **Navigation** | Navbar, Tabs, Accordion, Dropdown, Modal, Drawer, Popover, Stepper, Carousel, Toast, Tooltip |
| **Formulare** | Inputs, Select, Textarea, Checkbox, Radio, Switch, Range, File, Fieldset, Segmented Control |
| **Formular-Widgets** | **Datepicker**, **Combobox**, Tag-Eingabe, Zahlenfeld, Dropzone, Code-Eingabe, Bewertung, Passwortstärke, Validierung |
| **Daten** | Sortier- und filterbare Tabellen, Kennzahlen, Meter, Zeitleiste, Baumansicht, Skeleton, Leerzustand, Beschreibungsliste |
| **Icons** | 26 Pixel-Icons als CSS-Masken, färbbar über `color` |
| **Effekte** | CRT-Scanlines, Vignette, Dither-Muster, Sternenhimmel, Float/Shake/Blink |
| **Themes** | Light, Dark, Arcade, Handheld, Terminal, Candy + 3 Dichtestufen + RTL |
| **Spiel-UI** *(optional)* | Inventar, HUD, Tastenhinweise, Seltenheitsstufen, Banner, Ladebildschirm |

## Installation

```bash
npm install bitstrap
```

```js
import "bitstrap/css";
import "bitstrap";
```

Oder die zwei Dateien aus `dist/` herunterladen und direkt einbinden. Kein
Bundler nötig.

### Schrift

Bitstrap liefert bewusst **keine** Schriftdatei mit — das hält das Paket klein
und vermeidet Lizenzfragen. Ohne Pixelschrift fällt das Framework sauber auf
Monospace zurück und funktioniert vollständig. Empfohlen ist
*Press Start 2P* (SIL Open Font License):

```html
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
      rel="stylesheet">
```

Eigene Schrift? Eine Variable:

```css
:root { --bit-font: "Silkscreen", monospace; }
```

## Die Idee dahinter

**Eine Variable skaliert alles.** Rahmenstärke, Abstände, Icongrößen und
Komponentenmaße hängen an `--bit-px`. Von 4px auf 6px umgestellt, und aus der
Webseite wird ein Arcade-Automat:

```css
:root { --bit-px: 6px; }
```

**Die Pixelkanten sind echt.** Die abgetreppten Ecken entstehen aus vier
versetzten `box-shadow`-Kanten, deren Eckpixel ausgespart bleiben — nicht aus
Bildern. Beliebig groß, beliebig färbbar, immer scharf:

```css
box-shadow:
  0  -4px 0 0 var(--bit-border),   /* oben   */
  0   4px 0 0 var(--bit-border),   /* unten  */
  -4px  0 0 0 var(--bit-border),   /* links  */
   4px  0 0 0 var(--bit-border);   /* rechts */
```

**Animationen springen, sie gleiten nicht.** Statt Easing kommt überall
`steps()` zum Einsatz — 8-Bit-Hardware kannte keine Zwischenbilder.

**Barrierefreiheit ist nicht optional.** Sichtbarer Fokusring, Pfeiltasten für
Tabs, Escape für Dialoge, `prefers-reduced-motion` wird respektiert, ARIA wird
automatisch ergänzt. Bei Checkbox, Radio und Switch bleibt das native
`<input>` im DOM — nur unsichtbar. Tastatur, Screenreader, Autofill und
Formularabsendung funktionieren dadurch unverändert.

## Namensschema

| Muster | Bedeutung | Beispiel |
|---|---|---|
| `.bit-block` | Komponente | `.bit-card` |
| `.bit-block__teil` | Bestandteil | `.bit-card__header` |
| `.bit-block--art` | Variante | `.bit-btn--primary` |
| `.is-zustand` | Zustand | `.is-open` |
| `--bit-name` | Design-Token | `--bit-primary` |

Alles trägt das Präfix `bit-`. Bitstrap kollidiert daher mit keinem anderen
Framework und lässt sich auch nur für einen Teilbereich einer bestehenden
Seite einsetzen.

## JavaScript

Alles läuft über Attribute, die an `document` delegiert werden — nachgeladene
Elemente funktionieren ohne erneutes `init()`:

```html
<button data-bit-toggle="modal" data-bit-target="#dialog">Öffnen</button>
<button data-bit-toggle="theme">Hell/Dunkel</button>
<p data-bit-typewriter data-bit-speed="40">Zeichen für Zeichen.</p>
```

Programmatisch:

```js
Bitstrap.modal("#dialog").show();
Bitstrap.toast({ title: "Gespeichert", variant: "success", icon: "check" });
Bitstrap.progress("#bar", 60);
Bitstrap.theme.toggle();

// mit bitstrap-ui.js
Bitstrap.drawer("#menu").show();
Bitstrap.stepper("#wizard").next();
Bitstrap.countTo("#score", 8420);

// mit bitstrap-forms.js
Bitstrap.datepicker("#datum").select(new Date());
Bitstrap.validate(document.querySelector("form"));
```

Alle öffentlichen Helfer nehmen wahlweise einen Selektor oder ein
DOM-Element entgegen.

Ohne die JS-Datei funktionieren Layout, Grid, alle Formularelemente, Karten,
Tabellen, Badges, Fortschrittsbalken, Dialogboxen und Tooltips vollständig.

## Icons

26 Icons, jedes als 8×8-Zeichenraster gezeichnet und zur Bauzeit in eine
CSS-Maske übersetzt. Keine Schriftdatei, kein Sprite-Sheet, kein zusätzlicher
Request:

```html
<span class="bit-icon bit-icon--heart bit-text-danger"></span>
<span class="bit-icon bit-icon--lg bit-icon--coin"></span>
```

Ein eigenes Icon sind acht Zeilen Text in `build/icons.mjs`:

```js
krone: [
  "........",
  "#..##..#",
  "#.####.#",
  "########",
  "########",
  ".######.",
  "........",
  "........",
],
```

Danach `node build/build.mjs` — fertig ist `.bit-icon--krone`.

## Entwicklung

```bash
node build/build.mjs    # einmal bauen
node build/watch.mjs    # bei Änderungen neu bauen
npm run verify          # Klassennamen und Verweise pruefen
```

Der Build hat **keine Abhängigkeiten** — nur Node ≥ 18. Er generiert die
Icon- und Utility-Regeln, hängt die Quelldateien in fester Reihenfolge
aneinander und minifiziert.

```
src/          Quelldateien, nummeriert in Ladereihenfolge
build/        Build-Script, Icon-Generator, Watcher
dist/         Gebautes CSS und JS
```

> `src/_icons.generated.css` wird vom Build erzeugt — nicht von Hand ändern.
>
> Die Website liegt in einem eigenen Repository:
> [Schapat/bitstrap](https://github.com/Schapat/bitstrap).

## Browser

Alle aktuellen Browser. Bitstrap nutzt Custom Properties, CSS Grid und
`mask-image` — alles seit 2023 flächendeckend verfügbar.

## Progressive Enhancement

Jedes Widget baut auf einem echten Formularelement auf. Der Datepicker ist
ein normales `<input>` mit zusätzlichem Kalender, die Bewertung sind
Radio-Buttons, die Tag-Eingabe schreibt in ein `<input type="hidden">`.
Ohne JavaScript bleibt in allen Fällen ein bedienbares, absendbares
Formular übrig.

Die Validierung erfindet keine eigenen Regeln, sondern nutzt die
Constraint-Validation des Browsers (`required`, `type`, `pattern`,
`minlength`) und übersetzt sie nur in Bitstrap-Klassen.

## Barrierefreiheit

- Sichtbarer Fokusring auf allen interaktiven Elementen
- Modal und Drawer fangen den Fokus und geben ihn beim Schließen an den
  Auslöser zurück
- Tabs mit Pfeiltasten, Dialoge mit Escape, Combobox mit Pfeil/Enter/Escape
- `prefers-reduced-motion` legt sämtliche Animationen still
- ARIA-Rollen und -Zustände werden beim Init automatisch ergänzt
- Checkbox, Radio und Switch behalten ihr natives `<input>`

## Sprachen

Alle sichtbaren Widget-Texte laufen über `Bitstrap.i18n`. Die Sprache kommt
aus `<html lang>` und lässt sich zur Laufzeit umschalten:

```html
<button data-bit-locale="en">English</button>
<!-- oder -->
<select data-bit-locale>
  <option value="de">Deutsch</option>
  <option value="en">English</option>
</select>
```

```js
Bitstrap.i18n.set("fr");
Bitstrap.i18n.locale;        // "fr"
Bitstrap.i18n.available();   // ["en","de","fr", …]
Bitstrap.t("datepicker.today");
```

Englisch und Deutsch stecken im Kern. `bitstrap-locales.js` ergänzt
Französisch, Spanisch, Italienisch, Niederländisch, Portugiesisch,
Polnisch, Türkisch, Japanisch und Arabisch. Eine eigene Sprache braucht
keinen Build:

```js
Bitstrap.i18n.add("sv", {
  dateFormat: "iso",
  "datepicker.today": "Idag",
  "datepicker.clear": "Rensa",
  "combobox.empty": "Inga träffar"
});
```

Beim Umschalten passiert dreierlei automatisch: `<html lang>` wird
mitgesetzt (davon hängen Intl-Formate und Screenreader ab), bereits
erzeugte Widgets werden neu aufgebaut, und der Datepicker wechselt sein
Anzeigeformat — ein bereits gewähltes Datum wird dabei erhalten und neu
geschrieben (`14.08.2026` → `2026-08-14`). Ein `data-bit-format` am Feld
hat immer Vorrang.

Formate: `iso` (2026-08-14), `de` (14.08.2026), `eu` (14/08/2026),
`us` (08/14/2026).

Der Wechsel auf eine RTL-Sprache setzt zusätzlich `dir="rtl"`.

## RTL

`15-rtl.css` kippt die Stellen, an denen bewusst physische Richtungen
verwendet werden (Akzentkanten, Sprechzipfel, Pfeile, Sidebar). Es genügt:

```html
<html dir="rtl">
```

## Bekannte Grenzen

- **Pixelschriften sind breit.** Rechne mit etwa der doppelten Textbreite
  gegenüber einer normalen Schrift. Für längere Fließtexte gibt es
  `--bit-font-body`, das du getrennt setzen kannst.
- **Retro-Paletten sind kontrastarm.** Prüfe bei eigenen Themes jedes
  `*-fg`-Paar auf mindestens 4,5:1 gegenüber seiner Fläche.
- **Das ungebaute CSS ist groß** (~183 KB), weil die Icon-Data-URIs
  hineingehören. Sie komprimieren sehr gut; wer sie gar nicht braucht,
  nimmt `bitstrap.no-icons.min.css` (~92 KB roh).
- **Keine automatisierten Tests.** Verifiziert wird bisher über
  `build/verify.mjs` (Verweise und Klassennamen der Doku-Website gegen das
  gebaute CSS) und manuelle Browserprüfung. Eine Testsuite fehlt.
- **Die Kontraste der Themes sind nicht durchgemessen.** Arcade, Terminal
  und Handheld sind bewusst plakativ; prüfe sie, bevor du sie in einem
  Produkt mit Barrierefreiheitsanforderungen einsetzt.
- **Noch nicht auf npm oder einem CDN veröffentlicht.** Die
  Installationsanleitung beschreibt den Zielzustand.
- **Die ausführliche Dokumentation liegt nur auf Deutsch vor.** Die
  Website-Oberfläche und sämtliche Widget-Texte folgen der Sprachwahl,
  die langen Erklärtexte der Doku-Seiten nicht. Auf Doku-Seiten weist ein
  Hinweis darauf hin, sobald eine andere Sprache gewählt ist.
- **Der Datepicker ist nicht voll tastaturbedienbar.** Öffnen mit
  `Alt`+`↓`, Schließen mit `Esc` — aber keine Pfeilnavigation im
  Tagesraster.
- **Die mitgelieferten Übersetzungen sind ungeprüft.** Sie decken neun
  Sprachen ab, sind aber nicht von Muttersprachlern gegengelesen und
  verzichten teils auf diakritische Zeichen. Für den Produktiveinsatz
  eigene Werte per `Bitstrap.i18n.add()` setzen.

## Lizenz

MIT — siehe [LICENSE](LICENSE).

Ein eigenständiges Projekt. Nicht mit Nintendo oder anderen Herstellern
verbunden; es werden keine fremden Marken, Grafiken oder Schriften
mitgeliefert.
