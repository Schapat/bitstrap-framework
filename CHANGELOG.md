# Changelog

Format nach [Keep a Changelog](https://keepachangelog.com/de/1.1.0/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [1.0.0] – 2026-08-15

Erste Veröffentlichung.

### Enthalten

**Layout** — Container in vier Breiten, 12-Spalten-Grid mit vier
Breakpoints, Stack, Cluster, Split, Tiles, App-Shell mit fester
Seitenleiste.

**Komponenten** — Buttons (acht Varianten, fünf Größen, Gruppen,
Split-Button), Badges, Karten, Avatare, Alerts, Tabellen, Listen,
Fortschrittsbalken, Meter, Spinner, Pagination, Breadcrumb, Toolbar,
Trenner, Dialogboxen.

**Navigation & Overlays** — Navbar, Tabs, Accordion, Dropdown, Modal,
Drawer (links/rechts/unten), Popover mit berechneter Position, Stepper,
Carousel, Toast, Tooltip.

**Formulare** — Input, Select, Textarea, Checkbox, Radio, Switch,
Range, File, Fieldset, Eingabegruppe, Segmented Control,
Validierungszustände.

**Formular-Widgets** — Datepicker (vier Datumsformate, `min`/`max`),
Combobox mit Tastaturbedienung, Tag-Eingabe, Zahlenfeld, Dropzone,
Code-Eingabe, Bewertung, Passwortstärke, Formularvalidierung auf Basis
der Constraint-Validation des Browsers.

**Daten** — sortier- und filterbare Tabellen, Kennzahlen, Zeitleiste,
Baumansicht, Skeleton, Leerzustand, Begriffsliste, Codeblock.

**Icons** — 26 Pixel-Icons als CSS-Masken, färbbar über `color`, ohne
Schriftdatei und ohne zusätzlichen Request.

**Themes** — hell, dunkel, Arcade, Handheld, Terminal, Candy; dazu drei
Dichtestufen und eine RTL-Ebene.

**Mehrsprachigkeit** — alle Widget-Texte laufen über `Bitstrap.i18n`.
Englisch und Deutsch sind im Kern enthalten, neun weitere Sprachen in
`bitstrap-locales.js`. Eigene Sprachen lassen sich zur Laufzeit
registrieren, ohne Build.

**Spiel-UI** *(optional)* — Inventar mit Seltenheitsstufen, HUD,
Zählwerk, Tastenhinweise, Banner, Portrait, Ladebildschirm.

### Aufbau

- Kein Build-Schritt nötig: eine CSS-Datei und optional eine JS-Datei.
- JavaScript in vier ladbare Ebenen geteilt — Kern (4,5 KB gzip),
  UI (+3,6 KB), Forms (+5,2 KB), Sprachen (+1,5 KB) — plus ein Bundle.
- CSS wahlweise mit oder ohne eingebettete Icons
  (`bitstrap.no-icons.css`).
- Alle Klassen tragen das Präfix `bit-` und kollidieren daher mit
  keinem anderen Framework.
- Barrierefreiheit: sichtbarer Fokusring, Fokusfalle in Dialogen,
  Tastaturbedienung für Tabs und Combobox, `prefers-reduced-motion`,
  automatisch ergänzte ARIA-Rollen. Checkbox, Radio und Switch behalten
  ihr natives `<input>`.

### Bekannte Grenzen

Siehe [README](README.md#bekannte-grenzen) — insbesondere: keine
automatisierte Testsuite, der Datepicker hat keine Pfeilnavigation im
Tagesraster, und die Kontraste der Themes sind nicht durchgemessen.

---

> Vor dieser Veröffentlichung entstand das Framework in vier internen
> Entwicklungsschritten (Grundgerüst, Web-Komponenten, Mehrsprachigkeit,
> Aufräumen). Diese Zwischenstände waren nie öffentlich; die
> Versionsgeschichte beginnt daher hier.
