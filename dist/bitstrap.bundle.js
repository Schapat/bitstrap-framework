/*!
 * Bitstrap JS - Kern des 8-Bit-CSS-Frameworks
 * Vanilla JS, keine Abhaengigkeiten, ~4 KB gzip.
 *
 * Alles laeuft ueber Event-Delegation an document: Elemente, die spaeter
 * per JS nachgeladen werden, funktionieren ohne erneutes init().
 *
 * Steuerung per Attribut:
 *   data-bit-toggle="modal|dropdown|tab|accordion|navbar|theme"
 *   data-bit-target="#selektor"
 *   data-bit-dismiss="modal|alert|toast"
 *   data-bit-typewriter        (optional data-bit-speed="40")
 *   data-bit-locale="en"       (auch als <select data-bit-locale>)
 *
 * Programmatisch:
 *   Bitstrap.modal("#dialog").show()
 *   Bitstrap.toast({ title: "Gespeichert", variant: "success" })
 *   Bitstrap.theme.toggle()
 *   Bitstrap.i18n.set("en")
 *
 * Optionale Zusatzmodule, jeweils nach dieser Datei zu laden:
 *   bitstrap-ui.js       Drawer, Popover, Stepper, Carousel, Tabellen
 *   bitstrap-forms.js    Datepicker, Combobox, Tags, Validierung
 *   bitstrap-locales.js  neun weitere Sprachen
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Bitstrap = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var doc = document;

  /* ---------------------------------------------------------------------
     Helfer
     --------------------------------------------------------------------- */
  function qs(sel, ctx) {
    return (ctx || doc).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /** Findet das Zielelement eines Triggers: data-bit-target, sonst href. */
  function targetOf(el) {
    var sel = el.getAttribute("data-bit-target");
    if (!sel) {
      var href = el.getAttribute("href");
      if (href && href.charAt(0) === "#" && href.length > 1) sel = href;
    }
    return sel ? qs(sel) : null;
  }

  /** Naechster Vorfahre mit der Klasse - inklusive des Elements selbst. */
  function closest(el, cls) {
    while (el && el !== doc) {
      if (el.classList && el.classList.contains(cls)) return el;
      el = el.parentNode;
    }
    return null;
  }

  function emit(el, name, detail) {
    var ev;
    try {
      ev = new CustomEvent(name, { bubbles: true, cancelable: true, detail: detail });
    } catch (e) {
      ev = doc.createEvent("CustomEvent");
      ev.initCustomEvent(name, true, true, detail);
    }
    return el.dispatchEvent(ev);
  }

  /* =====================================================================
     I18N

     Alle sichtbaren Texte der Widgets laufen hierueber. Die Sprache
     kommt aus <html lang>, laesst sich zur Laufzeit umschalten und
     beliebig erweitern:

       Bitstrap.i18n.add("fr", { "datepicker.today": "Aujourd'hui" });
       Bitstrap.i18n.set("fr");

     dateFormat legt fest, wie der Datepicker Datumsangaben anzeigt:
     "iso" (2026-08-14), "de" (14.08.2026), "eu" (14/08/2026),
     "us" (08/14/2026). Der Wert am Feld hat Vorrang.
     ===================================================================== */
  var DICTS = {
    en: {
      dateFormat: "iso",
      "close": "Close",
      "datepicker.label": "Choose date",
      "datepicker.prev": "Previous month",
      "datepicker.next": "Next month",
      "datepicker.today": "Today",
      "datepicker.clear": "Clear",
      "combobox.empty": "No matches",
      "tag.remove": "Remove {name}",
      "dropzone.hint": "Drag files here or click to browse"
    },
    de: {
      dateFormat: "de",
      "close": "Schliessen",
      "datepicker.label": "Datum waehlen",
      "datepicker.prev": "Vorheriger Monat",
      "datepicker.next": "Naechster Monat",
      "datepicker.today": "Heute",
      "datepicker.clear": "Leeren",
      "combobox.empty": "Keine Treffer",
      "tag.remove": "{name} entfernen",
      "dropzone.hint": "Dateien hierher ziehen oder klicken"
    }
  };

  /* "de-AT" und "de" sollen dasselbe Woerterbuch treffen. */
  function baseLang(code) {
    return String(code || "").toLowerCase().split("-")[0];
  }

  var currentLocale = (function () {
    var tag = doc.documentElement.getAttribute("lang");
    var base = baseLang(tag);
    return DICTS[base] ? base : "en";
  })();

  var i18n = {
    get locale() {
      return currentLocale;
    },

    /** Alle registrierten Sprachcodes. */
    available: function () {
      return Object.keys(DICTS);
    },

    /** Eintraege ergaenzen oder ueberschreiben. */
    add: function (code, dict) {
      var key = baseLang(code);
      if (!DICTS[key]) DICTS[key] = {};
      for (var k in dict) {
        if (Object.prototype.hasOwnProperty.call(dict, k)) DICTS[key][k] = dict[k];
      }
      return i18n;
    },

    set: function (code) {
      var key = baseLang(code);
      if (!DICTS[key]) return currentLocale;

      currentLocale = key;
      /* lang mitziehen: davon haengen Intl-Formate, Silbentrennung
         und die Aussprache von Screenreadern ab. */
      doc.documentElement.setAttribute("lang", key);

      try {
        localStorage.setItem("bitstrap-locale", key);
      } catch (e) { /* ohne Persistenz weiter */ }

      emit(doc.documentElement, "bit:locale:change", { locale: key });
      return key;
    },

    /** Uebersetzt einen Schluessel. {platzhalter} werden ersetzt. */
    t: function (key, vars) {
      var dict = DICTS[currentLocale] || {};
      var text = dict[key];
      if (text === undefined) text = (DICTS.en || {})[key];
      if (text === undefined) return key;

      if (vars) {
        for (var name in vars) {
          if (Object.prototype.hasOwnProperty.call(vars, name)) {
            text = text.split("{" + name + "}").join(vars[name]);
          }
        }
      }
      return text;
    },

    /** Bevorzugtes Datumsformat der aktuellen Sprache. */
    dateFormat: function () {
      var dict = DICTS[currentLocale] || {};
      return dict.dateFormat || "iso";
    },

    restore: function () {
      var saved = null;
      try {
        saved = localStorage.getItem("bitstrap-locale");
      } catch (e) { /* ignorieren */ }
      if (saved && DICTS[baseLang(saved)]) {
        currentLocale = baseLang(saved);
        doc.documentElement.setAttribute("lang", currentLocale);
      }
      return currentLocale;
    }
  };

  function t(key, vars) {
    return i18n.t(key, vars);
  }

  /* =====================================================================
     FOKUSFALLE
     Solange ein Dialog offen ist, darf die Tabulatortaste nicht hinter
     das Overlay fuehren - dort ist nichts bedienbar, aber der Fokus
     waere unsichtbar verschwunden.
     ===================================================================== */
  var FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), ' +
    'select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

  function focusableIn(el) {
    return qsa(FOCUSABLE, el).filter(function (node) {
      /* offsetParent faellt bei display:none weg - so fallen versteckte
         Felder heraus, ohne teure Stilabfragen. */
      return node.offsetParent !== null || node === doc.activeElement;
    });
  }

  function trapFocus(container, e) {
    if (e.key !== "Tab") return;

    var items = focusableIn(container);
    if (!items.length) {
      e.preventDefault();
      return;
    }

    var first = items[0];
    var last = items[items.length - 1];

    if (e.shiftKey && doc.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && doc.activeElement === last) {
      first.focus();
      e.preventDefault();
    } else if (!container.contains(doc.activeElement)) {
      first.focus();
      e.preventDefault();
    }
  }

  /* =====================================================================
     MODAL
     ===================================================================== */
  var openModals = [];

  function Modal(el) {
    if (typeof el === "string") el = qs(el);
    this.el = el;
  }

  Modal.prototype.show = function () {
    if (!this.el || this.el.classList.contains("is-open")) return this;
    if (!emit(this.el, "bit:modal:show")) return this;

    /* Merken, wohin der Fokus nach dem Schliessen zurueckkehrt.
       Der Merker haengt am Element, nicht an der Instanz: show() und
       hide() werden oft ueber zwei verschiedene Modal-Objekte aufgerufen. */
    this.el.__bitOpener = doc.activeElement;

    this.el.classList.add("is-open");
    this.el.setAttribute("aria-hidden", "false");
    doc.documentElement.classList.add("bit-scroll-lock");
    openModals.push(this.el);

    var items = focusableIn(this.el);
    if (items.length) items[0].focus();

    emit(this.el, "bit:modal:shown");
    return this;
  };

  Modal.prototype.hide = function () {
    if (!this.el || !this.el.classList.contains("is-open")) return this;
    if (!emit(this.el, "bit:modal:hide")) return this;

    this.el.classList.remove("is-open");
    this.el.setAttribute("aria-hidden", "true");

    var idx = openModals.indexOf(this.el);
    if (idx > -1) openModals.splice(idx, 1);
    if (openModals.length === 0) {
      doc.documentElement.classList.remove("bit-scroll-lock");
    }

    /* Fokus dorthin zurueckgeben, wo er herkam. Ohne das landet er
       am Seitenanfang und der Kontext geht verloren. */
    var opener = this.el.__bitOpener;
    if (opener && opener.focus) opener.focus();
    this.el.__bitOpener = null;

    emit(this.el, "bit:modal:hidden");
    return this;
  };

  Modal.prototype.toggle = function () {
    return this.el && this.el.classList.contains("is-open")
      ? this.hide()
      : this.show();
  };

  /* =====================================================================
     TOAST
     ===================================================================== */
  function toastContainer(position) {
    var pos = position || "top-right";
    var el = qs('.bit-toast-container[data-position="' + pos + '"]');
    if (!el) {
      el = doc.createElement("div");
      el.className = "bit-toast-container";
      el.setAttribute("data-position", pos);
      el.setAttribute("role", "status");
      el.setAttribute("aria-live", "polite");
      doc.body.appendChild(el);
    }
    return el;
  }

  function toast(options) {
    var opts = options || {};
    var el = doc.createElement("div");
    el.className = "bit-toast bit-shadow";
    if (opts.variant) el.className += " bit-toast--" + opts.variant;

    var html = '<div class="bit-toast__body">';
    if (opts.icon) {
      html = '<span class="bit-icon bit-icon--sm bit-icon--' + opts.icon + '"></span>' + html;
    }
    if (opts.title) {
      html += '<p class="bit-toast__title">' + escapeHtml(opts.title) + "</p>";
    }
    if (opts.message) {
      html += '<p class="bit-toast__message">' + escapeHtml(opts.message) + "</p>";
    }
    html += "</div>";
    html += '<button class="bit-btn bit-btn--bare bit-btn--xs" data-bit-dismiss="toast" aria-label="' +
      escapeHtml(t("close")) + '">x</button>';

    el.innerHTML = html;
    toastContainer(opts.position).appendChild(el);

    var timeout = opts.timeout === undefined ? 4000 : opts.timeout;
    if (timeout > 0) {
      setTimeout(function () { dismissToast(el); }, timeout);
    }

    return el;
  }

  function dismissToast(el) {
    if (!el || el.classList.contains("is-leaving")) return;
    el.classList.add("is-leaving");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 200);
  }

  function escapeHtml(str) {
    var d = doc.createElement("div");
    d.textContent = String(str);
    return d.innerHTML;
  }

  /* =====================================================================
     TABS
     ===================================================================== */
  function activateTab(trigger) {
    var panel = targetOf(trigger);
    if (!panel) return;

    var group = closest(trigger, "bit-tabs");
    if (!group) return;

    qsa(".bit-tabs__tab", group).forEach(function (t) {
      var isMe = t === trigger;
      t.classList.toggle("is-active", isMe);
      t.setAttribute("aria-selected", isMe ? "true" : "false");
      t.setAttribute("tabindex", isMe ? "0" : "-1");
    });

    qsa(".bit-tabs__panel", group).forEach(function (p) {
      p.hidden = p !== panel;
    });

    emit(group, "bit:tab:change", { panel: panel });
  }

  /* Pfeiltasten zwischen den Reitern - erwartetes Verhalten fuer Tabs. */
  function tabKeydown(e) {
    var tab = closest(e.target, "bit-tabs__tab");
    if (!tab) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    var group = closest(tab, "bit-tabs");
    if (!group) return;

    var tabs = qsa(".bit-tabs__tab", group);
    var i = tabs.indexOf(tab);
    var next = e.key === "ArrowRight" ? i + 1 : i - 1;
    if (next < 0) next = tabs.length - 1;
    if (next >= tabs.length) next = 0;

    tabs[next].focus();
    activateTab(tabs[next]);
    e.preventDefault();
  }

  /* =====================================================================
     ACCORDION
     ===================================================================== */
  function toggleAccordion(trigger) {
    var item = closest(trigger, "bit-accordion__item");
    if (!item) return;

    var acc = closest(item, "bit-accordion");
    var panel = qs(".bit-accordion__panel", item);
    var willOpen = !item.classList.contains("is-open");

    /* Im Einzelmodus schliesst sich alles andere. */
    if (willOpen && acc && acc.hasAttribute("data-bit-single")) {
      qsa(".bit-accordion__item.is-open", acc).forEach(function (other) {
        other.classList.remove("is-open");
        var p = qs(".bit-accordion__panel", other);
        if (p) p.hidden = true;
        var t = qs(".bit-accordion__trigger", other);
        if (t) t.setAttribute("aria-expanded", "false");
      });
    }

    item.classList.toggle("is-open", willOpen);
    if (panel) panel.hidden = !willOpen;
    trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
  }

  /* =====================================================================
     THEME
     ===================================================================== */
  var STORAGE_KEY = "bitstrap-theme";

  var theme = {
    get: function () {
      return doc.documentElement.getAttribute("data-bit-theme") || "light";
    },

    set: function (name) {
      doc.documentElement.setAttribute("data-bit-theme", name);
      try {
        localStorage.setItem(STORAGE_KEY, name);
      } catch (e) {
        /* Privater Modus o.ae. - dann eben ohne Persistenz. */
      }
      emit(doc.documentElement, "bit:theme:change", { theme: name });
      return name;
    },

    toggle: function () {
      return theme.set(theme.get() === "dark" ? "light" : "dark");
    },

    restore: function () {
      var saved = null;
      try {
        saved = localStorage.getItem(STORAGE_KEY);
      } catch (e) { /* ignorieren */ }
      if (saved) doc.documentElement.setAttribute("data-bit-theme", saved);
      return saved;
    }
  };

  /* =====================================================================
     TYPEWRITER
     Text erscheint zeichenweise wie in einer Dialogbox. Startet erst,
     wenn das Element sichtbar wird.
     ===================================================================== */
  function typewrite(el) {
    if (el.hasAttribute("data-bit-typed")) return;
    el.setAttribute("data-bit-typed", "");

    var full = el.textContent;
    var speed = parseInt(el.getAttribute("data-bit-speed"), 10) || 35;
    var i = 0;

    el.textContent = "";
    el.classList.add("bit-typewriter");

    var timer = setInterval(function () {
      el.textContent = full.slice(0, ++i);
      if (i >= full.length) {
        clearInterval(timer);
        el.classList.add("is-done");
        emit(el, "bit:typewriter:done");
      }
    }, speed);
  }

  function initTypewriters(ctx) {
    var els = qsa("[data-bit-typewriter]", ctx);
    if (!els.length) return;

    if (!window.IntersectionObserver) {
      els.forEach(typewrite);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          typewrite(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* =====================================================================
     PROGRESS
     ===================================================================== */
  function setProgress(el, value) {
    if (typeof el === "string") el = qs(el);
    if (!el) return;
    var bar = el.classList.contains("bit-progress__bar")
      ? el
      : qs(".bit-progress__bar", el);
    if (!bar) return;
    var v = Math.max(0, Math.min(100, Number(value)));
    bar.style.width = v + "%";
    var wrap = closest(bar, "bit-progress");
    if (wrap) wrap.setAttribute("aria-valuenow", String(v));
  }

  /* =====================================================================
     GLOBALE EVENTS
     ===================================================================== */
  function onClick(e) {
    var el = e.target;

    /* Toggle-Trigger --------------------------------------------------- */
    var trigger = null;
    var node = el;
    while (node && node !== doc) {
      if (node.getAttribute && node.getAttribute("data-bit-toggle")) {
        trigger = node;
        break;
      }
      node = node.parentNode;
    }

    if (trigger) {
      var kind = trigger.getAttribute("data-bit-toggle");

      if (kind === "modal") {
        var m = targetOf(trigger);
        if (m) {
          e.preventDefault();
          new Modal(m).show();
        }
      } else if (kind === "dropdown") {
        var dd = closest(trigger, "bit-dropdown");
        if (dd) {
          e.preventDefault();
          var wasOpen = dd.classList.contains("is-open");
          closeDropdowns();
          if (!wasOpen) {
            dd.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
          }
        }
      } else if (kind === "tab") {
        e.preventDefault();
        activateTab(trigger);
      } else if (kind === "accordion") {
        e.preventDefault();
        toggleAccordion(trigger);
      } else if (kind === "navbar") {
        var nav = targetOf(trigger) || closest(trigger, "bit-navbar");
        if (nav) {
          e.preventDefault();
          nav.classList.toggle("is-open");
          trigger.setAttribute(
            "aria-expanded",
            nav.classList.contains("is-open") ? "true" : "false"
          );
        }
      } else if (kind === "theme") {
        e.preventDefault();
        theme.toggle();
      }
    }

    /* Sprachumschalter: <button data-bit-locale="en"> */
    var langBtn = null;
    node = el;
    while (node && node !== doc) {
      if (node.getAttribute && node.getAttribute("data-bit-locale") !== null) {
        langBtn = node;
        break;
      }
      node = node.parentNode;
    }

    if (langBtn && langBtn.tagName !== "SELECT") {
      e.preventDefault();
      i18n.set(langBtn.getAttribute("data-bit-locale"));
    }

    /* Dismiss-Trigger -------------------------------------------------- */
    var dismisser = null;
    node = el;
    while (node && node !== doc) {
      if (node.getAttribute && node.getAttribute("data-bit-dismiss")) {
        dismisser = node;
        break;
      }
      node = node.parentNode;
    }

    if (dismisser) {
      var what = dismisser.getAttribute("data-bit-dismiss");
      e.preventDefault();
      if (what === "modal") {
        var mm = targetOf(dismisser) || closest(dismisser, "bit-modal");
        if (mm) new Modal(mm).hide();
      } else if (what === "toast") {
        dismissToast(closest(dismisser, "bit-toast"));
      } else if (what === "alert") {
        var a = closest(dismisser, "bit-alert");
        if (a && a.parentNode) a.parentNode.removeChild(a);
      }
    }

    /* Klick auf den Backdrop schliesst das Modal. */
    if (el.classList && el.classList.contains("bit-modal__backdrop")) {
      var parentModal = closest(el, "bit-modal");
      if (parentModal && !parentModal.hasAttribute("data-bit-static")) {
        new Modal(parentModal).hide();
      }
    }

    /* Dropdowns schliessen, sobald daneben geklickt wird. */
    if (!closest(el, "bit-dropdown")) closeDropdowns();
  }

  function closeDropdowns() {
    qsa(".bit-dropdown.is-open").forEach(function (dd) {
      dd.classList.remove("is-open");
      var t = qs('[data-bit-toggle="dropdown"]', dd);
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      closeDropdowns();
      if (openModals.length) {
        var top = openModals[openModals.length - 1];
        if (!top.hasAttribute("data-bit-static")) new Modal(top).hide();
      }
    }

    /* Beim obersten offenen Dialog bleibt der Fokus gefangen. */
    if (openModals.length) {
      trapFocus(openModals[openModals.length - 1], e);
    }

    tabKeydown(e);
  }

  /* =====================================================================
     INIT
     ===================================================================== */
  var booted = false;

  function init(ctx) {
    if (!booted) {
      doc.addEventListener("click", onClick, false);
      doc.addEventListener("keydown", onKeydown, false);
      /* Sprachumschalter als <select data-bit-locale> */
      doc.addEventListener("change", function (e) {
        if (e.target.tagName === "SELECT" && e.target.hasAttribute("data-bit-locale")) {
          i18n.set(e.target.value);
        }
      }, false);
      booted = true;
    }

    /* ARIA-Grundgeruest fuer Tabs nachruesten. */
    qsa(".bit-tabs", ctx).forEach(function (group) {
      var list = qs(".bit-tabs__list", group);
      if (list) list.setAttribute("role", "tablist");
      qsa(".bit-tabs__tab", group).forEach(function (t) {
        t.setAttribute("role", "tab");
        if (!t.hasAttribute("aria-selected")) {
          var active = t.classList.contains("is-active");
          t.setAttribute("aria-selected", active ? "true" : "false");
          t.setAttribute("tabindex", active ? "0" : "-1");
        }
      });
      qsa(".bit-tabs__panel", group).forEach(function (p) {
        p.setAttribute("role", "tabpanel");
      });
    });

    qsa(".bit-accordion__trigger", ctx).forEach(function (t) {
      var item = closest(t, "bit-accordion__item");
      var open = item && item.classList.contains("is-open");
      t.setAttribute("aria-expanded", open ? "true" : "false");
      var panel = item && qs(".bit-accordion__panel", item);
      if (panel) panel.hidden = !open;
    });

    qsa(".bit-modal", ctx).forEach(function (m) {
      m.setAttribute("role", "dialog");
      m.setAttribute("aria-modal", "true");
      if (!m.classList.contains("is-open")) m.setAttribute("aria-hidden", "true");
    });

    qsa(".bit-progress", ctx).forEach(function (p) {
      p.setAttribute("role", "progressbar");
      p.setAttribute("aria-valuemin", "0");
      p.setAttribute("aria-valuemax", "100");
    });

    initTypewriters(ctx);
  }

  theme.restore();
  i18n.restore();

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }

  /* =====================================================================
     Oeffentliche API
     ===================================================================== */
  return {
    init: init,
    modal: function (el) { return new Modal(el); },
    Modal: Modal,
    toast: toast,
    dismissToast: dismissToast,
    tab: activateTab,
    progress: setProgress,
    theme: theme,
    i18n: i18n,
    t: t,
    typewrite: typewrite,

    /* Intern, aber bewusst offengelegt: die Zusatzmodule
       (bitstrap-ui.js, bitstrap-forms.js) bauen darauf auf. */
    util: {
      qs: qs,
      qsa: qsa,
      closest: closest,
      targetOf: targetOf,
      emit: emit,
      escapeHtml: escapeHtml,
      focusableIn: focusableIn,
      trapFocus: trapFocus
    },

    version: "1.1.0"
  };
});

;
/*!
 * Bitstrap UI - optionales Zusatzmodul
 * Drawer, Popover, Stepper, Carousel, sortierbare Tabellen, Baumansicht,
 * Zaehlwerk.
 *
 * Setzt bitstrap.js voraus und muss danach geladen werden:
 *   <script src="bitstrap.js"></script>
 *   <script src="bitstrap-ui.js"></script>
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./bitstrap.js"));
  } else {
    factory(root.Bitstrap);
  }
})(typeof self !== "undefined" ? self : this, function (Bitstrap) {
  "use strict";

  if (!Bitstrap) {
    console.error("Bitstrap UI: bitstrap.js muss zuerst geladen werden.");
    return;
  }

  var doc = document;
  var u = Bitstrap.util;
  var qs = u.qs;
  var qsa = u.qsa;
  var closest = u.closest;
  var targetOf = u.targetOf;
  var emit = u.emit;

  /* =====================================================================
     DRAWER
     ===================================================================== */
  var openDrawers = [];

  function Drawer(el) {
    if (typeof el === "string") el = qs(el);
    this.el = el;
  }

  Drawer.prototype.show = function () {
    if (!this.el || this.el.classList.contains("is-open")) return this;
    if (!emit(this.el, "bit:drawer:show")) return this;

    this.el.__bitOpener = doc.activeElement;
    this.el.classList.add("is-open");
    this.el.setAttribute("aria-hidden", "false");
    doc.documentElement.classList.add("bit-scroll-lock");
    openDrawers.push(this.el);

    var items = u.focusableIn(this.el);
    if (items.length) items[0].focus();

    emit(this.el, "bit:drawer:shown");
    return this;
  };

  Drawer.prototype.hide = function () {
    if (!this.el || !this.el.classList.contains("is-open")) return this;
    if (!emit(this.el, "bit:drawer:hide")) return this;

    this.el.classList.remove("is-open");
    this.el.setAttribute("aria-hidden", "true");

    var i = openDrawers.indexOf(this.el);
    if (i > -1) openDrawers.splice(i, 1);
    if (!openDrawers.length) doc.documentElement.classList.remove("bit-scroll-lock");

    var opener = this.el.__bitOpener;
    if (opener && opener.focus) opener.focus();
    this.el.__bitOpener = null;

    emit(this.el, "bit:drawer:hidden");
    return this;
  };

  Drawer.prototype.toggle = function () {
    return this.el && this.el.classList.contains("is-open") ? this.hide() : this.show();
  };

  /* =====================================================================
     POPOVER
     Anders als der CSS-Tooltip wird die Position berechnet, damit der
     Kasten am Bildschirmrand nicht abgeschnitten wird.
     ===================================================================== */
  function placePopover(pop, anchor) {
    var a = anchor.getBoundingClientRect();

    /* Erst einblenden, sonst ist die Groesse null. */
    pop.style.visibility = "hidden";
    pop.classList.add("is-open");
    var p = pop.getBoundingClientRect();

    var gap = 8;
    var top = a.bottom + window.scrollY + gap;
    var left = a.left + window.scrollX + a.width / 2 - p.width / 2;

    /* Kein Platz nach unten? Dann darueber setzen. */
    if (a.bottom + p.height + gap > window.innerHeight && a.top - p.height - gap > 0) {
      top = a.top + window.scrollY - p.height - gap;
    }

    /* Seitlich im sichtbaren Bereich halten. */
    var maxLeft = window.scrollX + document.documentElement.clientWidth - p.width - gap;
    var minLeft = window.scrollX + gap;
    if (left > maxLeft) left = maxLeft;
    if (left < minLeft) left = minLeft;

    pop.style.top = Math.round(top) + "px";
    pop.style.left = Math.round(left) + "px";
    pop.style.visibility = "";
  }

  function closePopovers(except) {
    qsa(".bit-popover.is-open").forEach(function (p) {
      if (p === except) return;
      p.classList.remove("is-open");
      if (p.__bitAnchor) p.__bitAnchor.setAttribute("aria-expanded", "false");
    });
  }

  /* =====================================================================
     STEPPER
     ===================================================================== */
  function Stepper(el) {
    if (typeof el === "string") el = qs(el);
    this.el = el;
    this.index = 0;
    this.steps = qsa(".bit-stepper__step", el);
    this.panels = qsa(".bit-step-panel", el);
    this.go(0);
  }

  Stepper.prototype.go = function (n) {
    if (!this.panels.length) return this;

    var max = this.panels.length - 1;
    this.index = Math.max(0, Math.min(max, n));

    var self = this;
    this.steps.forEach(function (s, i) {
      s.classList.toggle("is-active", i === self.index);
      s.classList.toggle("is-done", i < self.index);
    });
    this.panels.forEach(function (p, i) {
      p.hidden = i !== self.index;
    });

    emit(this.el, "bit:stepper:change", { index: this.index, last: this.index === max });
    return this;
  };

  Stepper.prototype.next = function () {
    /* Vor dem Weitergehen die Felder des aktuellen Schritts pruefen -
       sonst sammelt man Fehler bis zum Absenden an. */
    var panel = this.panels[this.index];
    if (panel && panel.hasAttribute("data-bit-validate")) {
      var fields = qsa("input, select, textarea", panel);
      for (var i = 0; i < fields.length; i++) {
        if (fields[i].checkValidity && !fields[i].checkValidity()) {
          fields[i].classList.add("is-invalid");
          fields[i].reportValidity();
          return this;
        }
        fields[i].classList.remove("is-invalid");
      }
    }
    return this.go(this.index + 1);
  };

  Stepper.prototype.prev = function () {
    return this.go(this.index - 1);
  };

  var steppers = [];

  function stepperFor(el) {
    var host = closest(el, "bit-stepper-host");
    if (!host) return null;
    for (var i = 0; i < steppers.length; i++) {
      if (steppers[i].el === host) return steppers[i];
    }
    var s = new Stepper(host);
    steppers.push(s);
    return s;
  }

  /* =====================================================================
     CAROUSEL
     Bewegt wird ueber scrollLeft - Scroll-Snap uebernimmt das Einrasten.
     ===================================================================== */
  function Carousel(el) {
    if (typeof el === "string") el = qs(el);
    this.el = el;
    this.track = qs(".bit-carousel__track", el);
    this.slides = qsa(".bit-carousel__slide", el);
    this.dots = qsa(".bit-carousel__dot", el);

    var self = this;
    if (this.track) {
      this.track.addEventListener("scroll", function () {
        /* Aus der Scrollposition den aktiven Slide ableiten, statt
           einen eigenen Zaehler zu fuehren - so bleibt Wischen synchron. */
        clearTimeout(self.__t);
        self.__t = setTimeout(function () { self.sync(); }, 60);
      });
    }
    this.sync();
  }

  Carousel.prototype.current = function () {
    if (!this.track || !this.slides.length) return 0;
    var w = this.slides[0].offsetWidth + 1;
    return Math.round(this.track.scrollLeft / w);
  };

  Carousel.prototype.go = function (n) {
    if (!this.track || !this.slides.length) return this;
    var i = Math.max(0, Math.min(this.slides.length - 1, n));
    this.track.scrollTo({ left: this.slides[i].offsetLeft - this.track.offsetLeft, behavior: "smooth" });
    return this;
  };

  Carousel.prototype.next = function () { return this.go(this.current() + 1); };
  Carousel.prototype.prev = function () { return this.go(this.current() - 1); };

  Carousel.prototype.sync = function () {
    var i = this.current();
    this.dots.forEach(function (d, n) {
      d.classList.toggle("is-active", n === i);
      d.setAttribute("aria-current", n === i ? "true" : "false");
    });
    emit(this.el, "bit:carousel:change", { index: i });
  };

  var carousels = [];

  function carouselFor(el) {
    var host = closest(el, "bit-carousel");
    if (!host) return null;
    for (var i = 0; i < carousels.length; i++) {
      if (carousels[i].el === host) return carousels[i];
    }
    var c = new Carousel(host);
    carousels.push(c);
    return c;
  }

  /* =====================================================================
     TABELLE SORTIEREN
     ===================================================================== */
  function sortTable(th) {
    var table = closest(th, "bit-table");
    if (!table) return;

    var tbody = qs("tbody", table);
    if (!tbody) return;

    var headers = qsa("th", th.parentNode);
    var col = headers.indexOf(th);
    if (col < 0) return;

    var type = th.getAttribute("data-bit-sort") || "text";
    var asc = !th.classList.contains("is-asc");

    headers.forEach(function (h) {
      h.classList.remove("is-asc", "is-desc");
      h.removeAttribute("aria-sort");
    });
    th.classList.add(asc ? "is-asc" : "is-desc");
    th.setAttribute("aria-sort", asc ? "ascending" : "descending");

    function key(row) {
      var cell = row.children[col];
      if (!cell) return "";
      /* data-bit-value erlaubt eine Sortierung, die vom Anzeigetext
         abweicht - etwa ISO-Datum unter formatiertem Datum. */
      return cell.getAttribute("data-bit-value") || cell.textContent.trim();
    }

    var rows = qsa("tr", tbody);
    rows.sort(function (a, b) {
      var x = key(a);
      var y = key(b);
      var r;
      if (type === "number") {
        r = (parseFloat(x.replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0) -
            (parseFloat(y.replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0);
      } else if (type === "date") {
        r = new Date(x) - new Date(y);
      } else {
        r = x.localeCompare(y, undefined, { numeric: true, sensitivity: "base" });
      }
      return asc ? r : -r;
    });

    rows.forEach(function (r) { tbody.appendChild(r); });
    emit(table, "bit:table:sort", { column: col, ascending: asc });
  }

  /* Freitextfilter ueber einer Tabelle. */
  function filterTable(input) {
    var table = qs(input.getAttribute("data-bit-filter"));
    if (!table) return;

    var needle = input.value.trim().toLowerCase();
    var shown = 0;

    qsa("tbody tr", table).forEach(function (row) {
      var hit = !needle || row.textContent.toLowerCase().indexOf(needle) > -1;
      row.hidden = !hit;
      if (hit) shown++;
    });

    var empty = qs(input.getAttribute("data-bit-filter-empty") || " none");
    if (empty) empty.hidden = shown > 0;
  }

  /* =====================================================================
     BAUMANSICHT
     ===================================================================== */
  function toggleTreeItem(row) {
    var item = closest(row, "bit-tree__item");
    if (!item || item.classList.contains("bit-tree__item--leaf")) return;

    var open = !item.classList.contains("is-open");
    item.classList.toggle("is-open", open);
    row.setAttribute("aria-expanded", open ? "true" : "false");

    var kids = qs(".bit-tree__children", item);
    if (kids) kids.hidden = !open;
  }

  /* =====================================================================
     ZAEHLWERK
     Zaehlt in Stufen hoch statt linear - passt zum Rest der Animationen.
     ===================================================================== */
  function countTo(el, target, duration) {
    if (typeof el === "string") el = qs(el);
    if (!el) return;

    var from = parseInt(el.textContent.replace(/\D/g, ""), 10) || 0;
    var to = Number(target);
    var dur = duration || 600;
    var frames = 20;
    var step = 0;
    var pad = el.getAttribute("data-bit-pad");

    var timer = setInterval(function () {
      step++;
      var value = Math.round(from + (to - from) * (step / frames));
      el.textContent = pad ? String(value).padStart(Number(pad), "0") : String(value);
      if (step >= frames) {
        clearInterval(timer);
        el.textContent = pad ? String(to).padStart(Number(pad), "0") : String(to);
      }
    }, dur / frames);
  }

  /* =====================================================================
     EREIGNISSE
     ===================================================================== */
  doc.addEventListener("click", function (e) {
    var t = e.target;

    /* Naechster Vorfahre, der ein bestimmtes Attribut traegt. */
    function withAttr(name, value) {
      var n = t;
      while (n && n !== doc) {
        if (n.getAttribute) {
          var v = n.getAttribute(name);
          if (v !== null && (value === undefined || v === value)) return n;
        }
        n = n.parentNode;
      }
      return null;
    }

    var trigger = withAttr("data-bit-toggle");

    if (trigger) {
      var kind = trigger.getAttribute("data-bit-toggle");

      if (kind === "drawer") {
        var d = targetOf(trigger);
        if (d) { e.preventDefault(); new Drawer(d).toggle(); }
      } else if (kind === "popover") {
        e.preventDefault();
        var pop = targetOf(trigger);
        if (pop) {
          var wasOpen = pop.classList.contains("is-open");
          closePopovers();
          if (!wasOpen) {
            pop.__bitAnchor = trigger;
            placePopover(pop, trigger);
            trigger.setAttribute("aria-expanded", "true");
          }
        }
      }
    }

    /* Dismiss fuer Drawer. */
    var closer = withAttr("data-bit-dismiss", "drawer");
    if (closer) {
      e.preventDefault();
      var dd = targetOf(closer) || closest(closer, "bit-drawer");
      if (dd) new Drawer(dd).hide();
    }

    if (t.classList && t.classList.contains("bit-drawer__backdrop")) {
      var parent = closest(t, "bit-drawer");
      if (parent && !parent.hasAttribute("data-bit-static")) new Drawer(parent).hide();
    }

    /* Popover schliessen, wenn daneben geklickt wird. */
    if (!closest(t, "bit-popover") && !(trigger && trigger.getAttribute("data-bit-toggle") === "popover")) {
      closePopovers();
    }

    /* Stepper-Knoepfe. */
    var stepBtn = withAttr("data-bit-step");
    if (stepBtn) {
      e.preventDefault();
      var st = stepperFor(stepBtn);
      if (st) {
        var dir = stepBtn.getAttribute("data-bit-step");
        if (dir === "next") st.next();
        else if (dir === "prev") st.prev();
        else st.go(parseInt(dir, 10));
      }
    }

    /* Carousel-Knoepfe und Punkte. */
    var carBtn = withAttr("data-bit-slide");
    if (carBtn) {
      e.preventDefault();
      var c = carouselFor(carBtn);
      if (c) {
        var v = carBtn.getAttribute("data-bit-slide");
        if (v === "next") c.next();
        else if (v === "prev") c.prev();
        else c.go(parseInt(v, 10));
      }
    }

    /* Tabellenkopf sortieren. */
    var th = withAttr("data-bit-sort");
    if (th && th.tagName === "TH") sortTable(th);

    /* Baumzeile. */
    var row = closest(t, "bit-tree__row");
    if (row) toggleTreeItem(row);
  });

  doc.addEventListener("input", function (e) {
    if (e.target.hasAttribute && e.target.hasAttribute("data-bit-filter")) {
      filterTable(e.target);
    }
  });

  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closePopovers();
      if (openDrawers.length) {
        var top = openDrawers[openDrawers.length - 1];
        if (!top.hasAttribute("data-bit-static")) new Drawer(top).hide();
      }
    }
    if (openDrawers.length) {
      u.trapFocus(openDrawers[openDrawers.length - 1], e);
    }
  });

  /* Position der offenen Popover bei Groessenaenderung nachfuehren. */
  window.addEventListener("resize", function () {
    qsa(".bit-popover.is-open").forEach(function (p) {
      if (p.__bitAnchor) placePopover(p, p.__bitAnchor);
    });
  });

  /* =====================================================================
     INIT
     ===================================================================== */
  function init(ctx) {
    qsa(".bit-drawer", ctx).forEach(function (d) {
      d.setAttribute("role", "dialog");
      d.setAttribute("aria-modal", "false");
      if (!d.classList.contains("is-open")) d.setAttribute("aria-hidden", "true");
    });

    qsa(".bit-stepper-host", ctx).forEach(function (host) {
      var known = steppers.some(function (s) { return s.el === host; });
      if (!known) steppers.push(new Stepper(host));
    });

    qsa(".bit-carousel", ctx).forEach(function (el) {
      var known = carousels.some(function (c) { return c.el === el; });
      if (!known) carousels.push(new Carousel(el));
    });

    qsa(".bit-tree__row", ctx).forEach(function (row) {
      var item = closest(row, "bit-tree__item");
      if (item && !item.classList.contains("bit-tree__item--leaf")) {
        row.setAttribute("aria-expanded", item.classList.contains("is-open") ? "true" : "false");
        var kids = qs(".bit-tree__children", item);
        if (kids) kids.hidden = !item.classList.contains("is-open");
      }
    });

    qsa("[data-bit-count]", ctx).forEach(function (el) {
      countTo(el, el.getAttribute("data-bit-count"));
    });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }

  /* Oeffentliche Erweiterung von Bitstrap. */
  /* Alle oeffentlichen Helfer akzeptieren Selektor ODER Element. */
  function resolve(el) {
    return typeof el === "string" ? qs(el) : el;
  }

  Bitstrap.drawer = function (el) { return new Drawer(resolve(el)); };
  Bitstrap.Drawer = Drawer;
  Bitstrap.stepper = function (el) { return stepperFor(resolve(el)); };
  Bitstrap.Stepper = Stepper;
  Bitstrap.carousel = function (el) { return carouselFor(resolve(el)); };
  Bitstrap.Carousel = Carousel;
  Bitstrap.sortTable = sortTable;
  Bitstrap.countTo = countTo;
  Bitstrap.initUI = init;

  return Bitstrap;
});

;
/*!
 * Bitstrap Forms - optionales Zusatzmodul
 * Datepicker, Combobox, Tag-Eingabe, Zahlenfeld, Dropzone, Code-Eingabe,
 * Passwortstaerke, Formularvalidierung.
 *
 * Setzt bitstrap.js voraus und muss danach geladen werden.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./bitstrap.js"));
  } else {
    factory(root.Bitstrap);
  }
})(typeof self !== "undefined" ? self : this, function (Bitstrap) {
  "use strict";

  if (!Bitstrap) {
    console.error("Bitstrap Forms: bitstrap.js muss zuerst geladen werden.");
    return;
  }

  var doc = document;
  var u = Bitstrap.util;
  var qs = u.qs;
  var qsa = u.qsa;
  var closest = u.closest;
  var emit = u.emit;
  var escapeHtml = u.escapeHtml;

  /* =====================================================================
     DATEPICKER

     Das <input> bleibt ein echtes Textfeld. Der Kalender ist eine
     Zusatzhilfe - Tippen, Einfuegen und Autofill funktionieren weiter,
     und ohne JavaScript bleibt ein normales Feld uebrig.
     ===================================================================== */

  var t = Bitstrap.t;

  /* Monats- und Wochentagsnamen kommen aus dem Browser, damit der
     Kalender der eingestellten Sprache folgt. */
  function locale() {
    return Bitstrap.i18n.locale;
  }

  function monthNames() {
    var fmt = new Intl.DateTimeFormat(locale(), { month: "long" });
    var out = [];
    for (var m = 0; m < 12; m++) out.push(fmt.format(new Date(2021, m, 1)));
    return out;
  }

  function weekdayNames() {
    /* 2021-03-01 war ein Montag - so beginnt die Woche am Montag. */
    var fmt = new Intl.DateTimeFormat(locale(), { weekday: "short" });
    var out = [];
    for (var d = 0; d < 7; d++) out.push(fmt.format(new Date(2021, 2, 1 + d)));
    return out;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /* Vier Anzeigeformate. Intern wird immer mit echten Date-Objekten
     gerechnet; ISO ist zusaetzlich das Austauschformat fuer min/max
     und data-bit-day. */
  function formatDate(date, format) {
    var y = date.getFullYear();
    var m = pad2(date.getMonth() + 1);
    var d = pad2(date.getDate());

    if (format === "de") return d + "." + m + "." + y;
    if (format === "eu") return d + "/" + m + "/" + y;
    if (format === "us") return m + "/" + d + "/" + y;
    return y + "-" + m + "-" + d;
  }

  function makeDate(y, m, d) {
    var date = new Date(y, m - 1, d);
    /* Rueckfrage gegen Ueberlaeufe: der 31.02. wuerde sonst stillschweigend
       zum 03.03. werden. */
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
      return null;
    }
    return date;
  }

  function parseDate(value, format) {
    if (!value) return null;
    var v = String(value).trim();
    var p;

    if (format === "de") {
      p = v.split(".");
      return p.length === 3 ? makeDate(+p[2], +p[1], +p[0]) : null;
    }
    if (format === "eu") {
      p = v.split("/");
      return p.length === 3 ? makeDate(+p[2], +p[1], +p[0]) : null;
    }
    if (format === "us") {
      p = v.split("/");
      return p.length === 3 ? makeDate(+p[2], +p[0], +p[1]) : null;
    }
    p = v.split("-");
    return p.length === 3 ? makeDate(+p[0], +p[1], +p[2]) : null;
  }

  function sameDay(a, b) {
    return a && b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function Datepicker(input) {
    if (typeof input === "string") input = qs(input);
    this.input = input;
    /* Ein Format am Feld gewinnt; sonst entscheidet die Sprache. */
    this.fixedFormat = input.getAttribute("data-bit-format");
    this.format = this.fixedFormat || Bitstrap.i18n.dateFormat();
    this.min = parseDate(input.getAttribute("min"), "iso");
    this.max = parseDate(input.getAttribute("max"), "iso");

    this.wrap = closest(input, "bit-datepicker");
    if (!this.wrap) {
      /* Fehlt die Huelle, wird sie ergaenzt - so genuegt im Markup
         das Attribut am Feld. */
      this.wrap = doc.createElement("div");
      this.wrap.className = "bit-datepicker";
      input.parentNode.insertBefore(this.wrap, input);
      this.wrap.appendChild(input);
    }

    this.cal = doc.createElement("div");
    this.cal.className = "bit-calendar";
    this.cal.setAttribute("role", "dialog");
    this.cal.setAttribute("aria-label", t("datepicker.label"));
    this.wrap.appendChild(this.cal);

    var selected = parseDate(input.value, this.format);
    this.view = selected || new Date();
    this.selected = selected;

    input.setAttribute("autocomplete", "off");
    input.__bitDatepicker = this;

    this.render();
  }

  Datepicker.prototype.render = function () {
    var months = monthNames();
    var year = this.view.getFullYear();
    var month = this.view.getMonth();

    var first = new Date(year, month, 1);
    /* getDay(): 0 = Sonntag. Auf Montag als Wochenstart umrechnen. */
    var lead = (first.getDay() + 6) % 7;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysPrev = new Date(year, month, 0).getDate();
    var today = new Date();

    var html =
      '<div class="bit-calendar__head">' +
      '<button type="button" class="bit-btn bit-btn--xs bit-btn--ghost" data-bit-cal="prev" aria-label="' +
      escapeHtml(t("datepicker.prev")) + '">&lt;</button>' +
      '<strong class="bit-calendar__title">' + escapeHtml(months[month] + " " + year) + "</strong>" +
      '<button type="button" class="bit-btn bit-btn--xs bit-btn--ghost" data-bit-cal="next" aria-label="' +
      escapeHtml(t("datepicker.next")) + '">&gt;</button>' +
      "</div><div class=\"bit-calendar__grid\">";

    weekdayNames().forEach(function (w) {
      html += '<span class="bit-calendar__dow">' + escapeHtml(w) + "</span>";
    });

    var self = this;

    function cell(date, outside) {
      var disabled =
        (self.min && date < self.min && !sameDay(date, self.min)) ||
        (self.max && date > self.max && !sameDay(date, self.max));

      var cls = "bit-calendar__day";
      if (outside) cls += " is-outside";
      if (sameDay(date, today)) cls += " is-today";
      if (sameDay(date, self.selected)) cls += " is-selected";

      return '<button type="button" class="' + cls + '"' +
        (disabled ? " disabled" : "") +
        ' data-bit-day="' + formatDate(date, "iso") + '"' +
        (sameDay(date, self.selected) ? ' aria-current="date"' : "") +
        ">" + date.getDate() + "</button>";
    }

    for (var i = lead; i > 0; i--) {
      html += cell(new Date(year, month - 1, daysPrev - i + 1), true);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      html += cell(new Date(year, month, d), false);
    }
    /* Auf volle Wochen auffuellen, damit das Raster nicht ausfranst. */
    var used = lead + daysInMonth;
    var trail = (7 - (used % 7)) % 7;
    for (var n = 1; n <= trail; n++) {
      html += cell(new Date(year, month + 1, n), true);
    }

    html += "</div>" +
      '<div class="bit-calendar__foot">' +
      '<button type="button" class="bit-btn bit-btn--xs" data-bit-cal="today">' +
      escapeHtml(t("datepicker.today")) + "</button>" +
      '<button type="button" class="bit-btn bit-btn--xs bit-btn--ghost" data-bit-cal="clear">' +
      escapeHtml(t("datepicker.clear")) + "</button>" +
      "</div>";

    this.cal.innerHTML = html;
  };

  Datepicker.prototype.open = function () {
    closeAllCalendars();
    this.cal.classList.add("is-open");
    this.input.setAttribute("aria-expanded", "true");
    return this;
  };

  Datepicker.prototype.close = function () {
    this.cal.classList.remove("is-open");
    this.input.setAttribute("aria-expanded", "false");
    return this;
  };

  Datepicker.prototype.select = function (date) {
    this.selected = date;
    this.view = date ? new Date(date) : new Date();
    this.input.value = date ? formatDate(date, this.format) : "";
    this.render();
    emit(this.input, "bit:date:change", { date: date });
    /* Change ausloesen, damit Frameworks und Validierung mitbekommen,
       dass sich der Wert geaendert hat. */
    emit(this.input, "change");
    return this;
  };

  Datepicker.prototype.shift = function (months) {
    this.view = new Date(this.view.getFullYear(), this.view.getMonth() + months, 1);
    this.render();
    return this;
  };

  function closeAllCalendars() {
    qsa(".bit-calendar.is-open").forEach(function (c) {
      c.classList.remove("is-open");
      var i = qs(".bit-input", c.parentNode);
      if (i) i.setAttribute("aria-expanded", "false");
    });
  }

  function datepickerOf(el) {
    var wrap = closest(el, "bit-datepicker");
    if (!wrap) return null;
    var input = qs("[data-bit-datepicker]", wrap);
    return input ? input.__bitDatepicker : null;
  }

  /* =====================================================================
     COMBOBOX
     ===================================================================== */
  function Combobox(input) {
    if (typeof input === "string") input = qs(input);
    this.input = input;
    this.wrap = closest(input, "bit-combobox");
    this.list = qs(".bit-combobox__list", this.wrap);
    this.index = -1;

    /* Quelle: entweder eine <datalist>-artige Liste im Markup oder
       ein JSON-Array im Attribut. */
    var raw = input.getAttribute("data-bit-options");
    if (raw) {
      try {
        this.options = JSON.parse(raw);
      } catch (e) {
        this.options = raw.split(",").map(function (s) { return s.trim(); });
      }
    } else {
      this.options = qsa(".bit-combobox__option", this.list).map(function (o) {
        return o.textContent.trim();
      });
    }

    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");
    input.__bitCombobox = this;
  }

  Combobox.prototype.filter = function () {
    var needle = this.input.value.trim().toLowerCase();
    this.matches = this.options.filter(function (o) {
      return !needle || String(o).toLowerCase().indexOf(needle) > -1;
    });

    if (!this.matches.length) {
      this.list.innerHTML = '<li class="bit-combobox__empty">' +
        escapeHtml(t("combobox.empty")) + "</li>";
    } else {
      this.list.innerHTML = this.matches
        .map(function (o, i) {
          return '<li class="bit-combobox__option" role="option" data-bit-option="' +
            i + '">' + escapeHtml(o) + "</li>";
        })
        .join("");
    }

    this.index = -1;
    return this;
  };

  Combobox.prototype.open = function () {
    this.filter();
    this.wrap.classList.add("is-open");
    this.input.setAttribute("aria-expanded", "true");
    return this;
  };

  Combobox.prototype.close = function () {
    this.wrap.classList.remove("is-open");
    this.input.setAttribute("aria-expanded", "false");
    this.index = -1;
    return this;
  };

  Combobox.prototype.move = function (delta) {
    var items = qsa(".bit-combobox__option", this.list);
    if (!items.length) return this;

    this.index += delta;
    if (this.index < 0) this.index = items.length - 1;
    if (this.index >= items.length) this.index = 0;

    items.forEach(function (it, i) {
      it.classList.toggle("is-active", i === this.index);
    }, this);

    items[this.index].scrollIntoView({ block: "nearest" });
    return this;
  };

  Combobox.prototype.choose = function (i) {
    var value = this.matches[i];
    if (value === undefined) return this;
    this.input.value = value;
    this.close();
    emit(this.input, "bit:combobox:select", { value: value });
    emit(this.input, "change");
    return this;
  };

  /* =====================================================================
     TAG-EINGABE
     ===================================================================== */
  function TagInput(wrap) {
    if (typeof wrap === "string") wrap = qs(wrap);
    this.wrap = wrap;
    this.input = qs(".bit-tags__input", wrap);
    /* Verstecktes Feld traegt die Werte ins Formular. */
    this.store = qs('input[type="hidden"]', wrap);
    this.tags = [];

    if (this.store && this.store.value) {
      this.tags = this.store.value.split(",").filter(Boolean);
    }
    wrap.__bitTags = this;
    this.render();
  }

  TagInput.prototype.render = function () {
    qsa(".bit-tag", this.wrap).forEach(function (t) { t.remove(); });

    var self = this;
    this.tags.forEach(function (tag, i) {
      var el = doc.createElement("span");
      el.className = "bit-tag";
      el.innerHTML = escapeHtml(tag) +
        '<button type="button" class="bit-tag__remove" data-bit-tag-remove="' + i +
        '" aria-label="' + escapeHtml(t("tag.remove", { name: tag })) + '">x</button>';
      self.wrap.insertBefore(el, self.input);
    });

    if (this.store) this.store.value = this.tags.join(",");
  };

  TagInput.prototype.add = function (value) {
    var v = String(value).trim().replace(/,$/, "");
    if (!v || this.tags.indexOf(v) > -1) return this;
    this.tags.push(v);
    this.input.value = "";
    this.render();
    emit(this.wrap, "bit:tags:change", { tags: this.tags.slice() });
    return this;
  };

  TagInput.prototype.remove = function (i) {
    this.tags.splice(i, 1);
    this.render();
    emit(this.wrap, "bit:tags:change", { tags: this.tags.slice() });
    return this;
  };

  /* =====================================================================
     ZAHLENFELD
     ===================================================================== */
  function stepNumber(btn, dir) {
    var wrap = closest(btn, "bit-number");
    var input = qs("input", wrap);
    if (!input) return;

    var step = parseFloat(input.step) || 1;
    var value = parseFloat(input.value) || 0;
    var next = value + dir * step;

    if (input.min !== "" && next < parseFloat(input.min)) next = parseFloat(input.min);
    if (input.max !== "" && next > parseFloat(input.max)) next = parseFloat(input.max);

    /* Gleitkommareste vermeiden: 0.1 + 0.2 soll 0.3 ergeben. */
    var decimals = (String(step).split(".")[1] || "").length;
    input.value = decimals ? next.toFixed(decimals) : String(next);

    emit(input, "input");
    emit(input, "change");
  }

  /* =====================================================================
     DROPZONE
     ===================================================================== */
  function describeFiles(zone) {
    var input = qs('input[type="file"]', zone);
    var list = qs(".bit-dropzone__files", zone);
    if (!input || !list) return;

    if (!input.files || !input.files.length) {
      list.innerHTML = "";
      return;
    }

    list.innerHTML = Array.prototype.map
      .call(input.files, function (f) {
        var kb = (f.size / 1024).toFixed(1);
        return "<li><span>" + escapeHtml(f.name) + "</span><span>" + kb + " KB</span></li>";
      })
      .join("");
  }

  /* =====================================================================
     CODE-EINGABE
     ===================================================================== */
  function otpKey(e) {
    var input = e.target;
    var wrap = closest(input, "bit-otp");
    if (!wrap) return;

    var fields = qsa("input", wrap);
    var i = fields.indexOf(input);

    if (e.key === "Backspace" && !input.value && i > 0) {
      fields[i - 1].focus();
      fields[i - 1].value = "";
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      fields[i - 1].focus();
    } else if (e.key === "ArrowRight" && i < fields.length - 1) {
      fields[i + 1].focus();
    }
  }

  function otpInput(e) {
    var input = e.target;
    var wrap = closest(input, "bit-otp");
    if (!wrap) return;

    var fields = qsa("input", wrap);
    var i = fields.indexOf(input);

    /* Beim Einfuegen eines kompletten Codes auf die Felder verteilen. */
    if (input.value.length > 1) {
      var chars = input.value.split("");
      for (var n = 0; n < chars.length && i + n < fields.length; n++) {
        fields[i + n].value = chars[n];
      }
      var last = Math.min(i + chars.length, fields.length - 1);
      fields[last].focus();
    } else if (input.value && i < fields.length - 1) {
      fields[i + 1].focus();
    }

    var code = fields.map(function (f) { return f.value; }).join("");
    if (code.length === fields.length) emit(wrap, "bit:otp:complete", { code: code });
  }

  /* =====================================================================
     PASSWORTSTAERKE
     Bewusst simpel und nachvollziehbar: Laenge plus Zeichenvielfalt.
     Keine Sicherheitsaussage, nur eine Rueckmeldung beim Tippen.
     ===================================================================== */
  function strength(value) {
    if (!value) return 0;
    var score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(4, score);
  }

  function updateStrength(input) {
    var meter = qs(input.getAttribute("data-bit-strength"));
    if (!meter) return;

    var level = strength(input.value);
    meter.setAttribute("data-level", String(level));
    qsa(".bit-strength__bar", meter).forEach(function (bar, i) {
      bar.classList.toggle("is-on", i < level);
    });
  }

  /* =====================================================================
     VALIDIERUNG
     Nutzt die eingebaute Constraint-Validation des Browsers und
     uebersetzt sie nur in die Bitstrap-Klassen.
     ===================================================================== */
  function messageFor(field) {
    var custom = field.getAttribute("data-bit-message");
    return custom || field.validationMessage;
  }

  function showError(field) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");

    var box = field.parentNode ? qs(".bit-error", field.parentNode) : null;
    if (!box) {
      box = doc.createElement("span");
      box.className = "bit-error";
      if (field.parentNode) field.parentNode.appendChild(box);
    }
    box.textContent = messageFor(field);
    field.setAttribute("aria-invalid", "true");
  }

  function clearError(field) {
    field.classList.remove("is-invalid");
    field.removeAttribute("aria-invalid");
    var box = field.parentNode ? qs(".bit-error", field.parentNode) : null;
    if (box && !box.hasAttribute("data-bit-keep")) box.textContent = "";
  }

  function validateForm(form) {
    var fields = qsa("input, select, textarea", form);
    var firstBad = null;

    fields.forEach(function (f) {
      if (!f.checkValidity) return;
      if (f.checkValidity()) {
        clearError(f);
      } else {
        showError(f);
        if (!firstBad) firstBad = f;
      }
    });

    if (firstBad) {
      firstBad.focus();
    }
    return !firstBad;
  }

  /* =====================================================================
     EREIGNISSE
     ===================================================================== */
  doc.addEventListener("click", function (e) {
    var t = e.target;

    /* -- Datepicker -- */
    if (t.hasAttribute && t.hasAttribute("data-bit-datepicker")) {
      var dp = t.__bitDatepicker;
      if (dp) dp.open();
    }

    var calBtn = t.closest ? t.closest("[data-bit-cal]") : null;
    if (calBtn) {
      e.preventDefault();
      var picker = datepickerOf(calBtn);
      if (picker) {
        var what = calBtn.getAttribute("data-bit-cal");
        if (what === "prev") picker.shift(-1);
        else if (what === "next") picker.shift(1);
        else if (what === "today") { picker.select(new Date()); picker.close(); }
        else if (what === "clear") { picker.select(null); picker.close(); }
      }
    }

    var dayBtn = t.closest ? t.closest("[data-bit-day]") : null;
    if (dayBtn && !dayBtn.disabled) {
      e.preventDefault();
      var p2 = datepickerOf(dayBtn);
      if (p2) {
        p2.select(parseDate(dayBtn.getAttribute("data-bit-day"), "iso"));
        p2.close();
      }
    }

    if (!closest(t, "bit-datepicker")) closeAllCalendars();

    /* -- Combobox -- */
    var opt = t.closest ? t.closest("[data-bit-option]") : null;
    if (opt) {
      var cbWrap = closest(opt, "bit-combobox");
      var cbInput = cbWrap && qs("[data-bit-combobox]", cbWrap);
      if (cbInput && cbInput.__bitCombobox) {
        cbInput.__bitCombobox.choose(Number(opt.getAttribute("data-bit-option")));
      }
    }

    if (!closest(t, "bit-combobox")) {
      qsa(".bit-combobox.is-open").forEach(function (w) {
        var i = qs("[data-bit-combobox]", w);
        if (i && i.__bitCombobox) i.__bitCombobox.close();
      });
    }

    /* -- Tags -- */
    var rm = t.closest ? t.closest("[data-bit-tag-remove]") : null;
    if (rm) {
      e.preventDefault();
      var tagWrap = closest(rm, "bit-tags");
      if (tagWrap && tagWrap.__bitTags) {
        tagWrap.__bitTags.remove(Number(rm.getAttribute("data-bit-tag-remove")));
      }
    }

    if (t.classList && t.classList.contains("bit-tags")) {
      var ti = qs(".bit-tags__input", t);
      if (ti) ti.focus();
    }

    /* -- Zahlenfeld -- */
    var numBtn = t.closest ? t.closest("[data-bit-number]") : null;
    if (numBtn) {
      e.preventDefault();
      stepNumber(numBtn, numBtn.getAttribute("data-bit-number") === "up" ? 1 : -1);
    }
  });

  doc.addEventListener("input", function (e) {
    var t = e.target;

    if (t.hasAttribute && t.hasAttribute("data-bit-combobox") && t.__bitCombobox) {
      t.__bitCombobox.open();
    }

    if (t.hasAttribute && t.hasAttribute("data-bit-strength")) {
      updateStrength(t);
    }

    if (closest(t, "bit-otp")) otpInput(e);

    /* Ein bereits als fehlerhaft markiertes Feld wird beim Korrigieren
       sofort wieder freigegeben - nicht erst beim naechsten Absenden. */
    if (t.classList && t.classList.contains("is-invalid") && t.checkValidity && t.checkValidity()) {
      clearError(t);
    }
  });

  doc.addEventListener("change", function (e) {
    if (closest(e.target, "bit-dropzone")) {
      describeFiles(closest(e.target, "bit-dropzone"));
    }
  });

  doc.addEventListener("keydown", function (e) {
    var t = e.target;

    /* -- Combobox-Tastatur -- */
    if (t.hasAttribute && t.hasAttribute("data-bit-combobox") && t.__bitCombobox) {
      var cb = t.__bitCombobox;
      if (e.key === "ArrowDown") { cb.open(); cb.move(1); e.preventDefault(); }
      else if (e.key === "ArrowUp") { cb.move(-1); e.preventDefault(); }
      else if (e.key === "Enter" && cb.index > -1) { cb.choose(cb.index); e.preventDefault(); }
      else if (e.key === "Escape") cb.close();
    }

    /* -- Datepicker-Tastatur -- */
    if (t.hasAttribute && t.hasAttribute("data-bit-datepicker") && t.__bitDatepicker) {
      if (e.key === "Escape") t.__bitDatepicker.close();
      if (e.key === "ArrowDown" && e.altKey) { t.__bitDatepicker.open(); e.preventDefault(); }
    }

    /* -- Tags -- */
    if (t.classList && t.classList.contains("bit-tags__input")) {
      var wrap = closest(t, "bit-tags");
      var inst = wrap && wrap.__bitTags;
      if (!inst) return;

      if (e.key === "Enter" || e.key === ",") {
        if (t.value.trim()) { inst.add(t.value); e.preventDefault(); }
      } else if (e.key === "Backspace" && !t.value && inst.tags.length) {
        inst.remove(inst.tags.length - 1);
      }
    }

    if (closest(t, "bit-otp")) otpKey(e);
  });

  /* Dragover-Zustand der Dropzone. */
  ["dragenter", "dragover"].forEach(function (name) {
    doc.addEventListener(name, function (e) {
      var zone = closest(e.target, "bit-dropzone");
      if (zone) { e.preventDefault(); zone.classList.add("is-dragover"); }
    });
  });

  ["dragleave", "drop"].forEach(function (name) {
    doc.addEventListener(name, function (e) {
      var zone = closest(e.target, "bit-dropzone");
      if (zone) zone.classList.remove("is-dragover");
    });
  });

  doc.addEventListener("drop", function (e) {
    var zone = closest(e.target, "bit-dropzone");
    if (!zone) return;
    e.preventDefault();
    var input = qs('input[type="file"]', zone);
    if (input && e.dataTransfer && e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      describeFiles(zone);
      emit(input, "change");
    }
  });

  /* Validierung beim Absenden. */
  doc.addEventListener(
    "submit",
    function (e) {
      var form = e.target;
      if (!form.hasAttribute || !form.hasAttribute("data-bit-validate")) return;
      /* novalidate setzen wir selbst, damit die eigenen Meldungen
         erscheinen statt der Browser-Blasen. */
      if (!validateForm(form)) e.preventDefault();
    },
    true
  );

  /* =====================================================================
     INIT
     ===================================================================== */
  function init(ctx) {
    qsa("[data-bit-datepicker]", ctx).forEach(function (i) {
      if (!i.__bitDatepicker) new Datepicker(i);
    });

    qsa("[data-bit-combobox]", ctx).forEach(function (i) {
      if (!i.__bitCombobox) new Combobox(i);
    });

    qsa(".bit-tags", ctx).forEach(function (w) {
      if (!w.__bitTags) new TagInput(w);
    });

    qsa("[data-bit-strength]", ctx).forEach(updateStrength);

    qsa("form[data-bit-validate]", ctx).forEach(function (f) {
      f.setAttribute("novalidate", "");
    });
  }

  /* =====================================================================
     SPRACHWECHSEL

     Bereits erzeugte Widgets tragen ihre Beschriftungen im DOM - beim
     Umschalten muessen sie neu aufgebaut werden. Beim Datepicker
     wechselt zusaetzlich das Anzeigeformat, sofern am Feld keins fest
     gesetzt ist: der gemerkte Datumswert wird dann neu geschrieben.
     ===================================================================== */
  function relocalize() {
    qsa("[data-bit-datepicker]").forEach(function (input) {
      var dp = input.__bitDatepicker;
      if (!dp) return;

      if (!dp.fixedFormat) {
        var next = Bitstrap.i18n.dateFormat();
        if (next !== dp.format) {
          dp.format = next;
          if (dp.selected) input.value = formatDate(dp.selected, next);
        }
      }

      dp.cal.setAttribute("aria-label", t("datepicker.label"));
      dp.render();
    });

    qsa("[data-bit-combobox]").forEach(function (input) {
      if (input.__bitCombobox && input.__bitCombobox.wrap.classList.contains("is-open")) {
        input.__bitCombobox.filter();
      }
    });

    qsa(".bit-tags").forEach(function (w) {
      if (w.__bitTags) w.__bitTags.render();
    });
  }

  doc.documentElement.addEventListener("bit:locale:change", relocalize);

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () { init(); });
  } else {
    init();
  }

  Bitstrap.relocalizeForms = relocalize;
  Bitstrap.datepicker = function (el) {
    var i = typeof el === "string" ? qs(el) : el;
    return i && (i.__bitDatepicker || new Datepicker(i));
  };
  Bitstrap.Datepicker = Datepicker;
  Bitstrap.combobox = function (el) {
    var i = typeof el === "string" ? qs(el) : el;
    return i && (i.__bitCombobox || new Combobox(i));
  };
  Bitstrap.tags = function (el) {
    var w = typeof el === "string" ? qs(el) : el;
    return w && (w.__bitTags || new TagInput(w));
  };
  Bitstrap.validate = validateForm;
  Bitstrap.initForms = init;

  return Bitstrap;
});

;
/*!
 * Bitstrap Locales - optionale Sprachpakete
 *
 * Englisch und Deutsch stecken bereits im Kern. Diese Datei ergaenzt
 * weitere Sprachen. Nach bitstrap.js laden:
 *
 *   <script src="bitstrap.js"></script>
 *   <script src="bitstrap-locales.js"></script>
 *
 * Eigene Sprache hinzufuegen - dieselbe Form, kein Build noetig:
 *
 *   Bitstrap.i18n.add("sv", {
 *     dateFormat: "iso",
 *     "datepicker.today": "Idag"
 *   });
 *
 * dateFormat: "iso" (2026-08-14) | "de" (14.08.2026)
 *           | "eu" (14/08/2026)  | "us" (08/14/2026)
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./bitstrap.js"));
  } else {
    factory(root.Bitstrap);
  }
})(typeof self !== "undefined" ? self : this, function (Bitstrap) {
  "use strict";

  if (!Bitstrap) {
    console.error("Bitstrap Locales: bitstrap.js muss zuerst geladen werden.");
    return;
  }

  var PACKS = {
    fr: {
      dateFormat: "eu",
      "close": "Fermer",
      "datepicker.label": "Choisir une date",
      "datepicker.prev": "Mois precedent",
      "datepicker.next": "Mois suivant",
      "datepicker.today": "Aujourd'hui",
      "datepicker.clear": "Effacer",
      "combobox.empty": "Aucun resultat",
      "tag.remove": "Supprimer {name}",
      "dropzone.hint": "Deposez les fichiers ici ou cliquez"
    },

    es: {
      dateFormat: "eu",
      "close": "Cerrar",
      "datepicker.label": "Elegir fecha",
      "datepicker.prev": "Mes anterior",
      "datepicker.next": "Mes siguiente",
      "datepicker.today": "Hoy",
      "datepicker.clear": "Borrar",
      "combobox.empty": "Sin resultados",
      "tag.remove": "Eliminar {name}",
      "dropzone.hint": "Arrastra archivos aqui o haz clic"
    },

    it: {
      dateFormat: "eu",
      "close": "Chiudi",
      "datepicker.label": "Scegli una data",
      "datepicker.prev": "Mese precedente",
      "datepicker.next": "Mese successivo",
      "datepicker.today": "Oggi",
      "datepicker.clear": "Cancella",
      "combobox.empty": "Nessun risultato",
      "tag.remove": "Rimuovi {name}",
      "dropzone.hint": "Trascina i file qui o fai clic"
    },

    nl: {
      dateFormat: "de",
      "close": "Sluiten",
      "datepicker.label": "Datum kiezen",
      "datepicker.prev": "Vorige maand",
      "datepicker.next": "Volgende maand",
      "datepicker.today": "Vandaag",
      "datepicker.clear": "Wissen",
      "combobox.empty": "Geen resultaten",
      "tag.remove": "{name} verwijderen",
      "dropzone.hint": "Sleep bestanden hierheen of klik"
    },

    pt: {
      dateFormat: "eu",
      "close": "Fechar",
      "datepicker.label": "Escolher data",
      "datepicker.prev": "Mes anterior",
      "datepicker.next": "Proximo mes",
      "datepicker.today": "Hoje",
      "datepicker.clear": "Limpar",
      "combobox.empty": "Nenhum resultado",
      "tag.remove": "Remover {name}",
      "dropzone.hint": "Arraste ficheiros para aqui ou clique"
    },

    pl: {
      dateFormat: "de",
      "close": "Zamknij",
      "datepicker.label": "Wybierz date",
      "datepicker.prev": "Poprzedni miesiac",
      "datepicker.next": "Nastepny miesiac",
      "datepicker.today": "Dzis",
      "datepicker.clear": "Wyczysc",
      "combobox.empty": "Brak wynikow",
      "tag.remove": "Usun {name}",
      "dropzone.hint": "Przeciagnij pliki tutaj lub kliknij"
    },

    tr: {
      dateFormat: "de",
      "close": "Kapat",
      "datepicker.label": "Tarih sec",
      "datepicker.prev": "Onceki ay",
      "datepicker.next": "Sonraki ay",
      "datepicker.today": "Bugun",
      "datepicker.clear": "Temizle",
      "combobox.empty": "Sonuc yok",
      "tag.remove": "{name} kaldir",
      "dropzone.hint": "Dosyalari buraya surukleyin veya tiklayin"
    },

    ja: {
      dateFormat: "iso",
      "close": "閉じる",
      "datepicker.label": "日付を選択",
      "datepicker.prev": "前の月",
      "datepicker.next": "次の月",
      "datepicker.today": "今日",
      "datepicker.clear": "クリア",
      "combobox.empty": "該当なし",
      "tag.remove": "{name} を削除",
      "dropzone.hint": "ファイルをドロップまたはクリック"
    },

    ar: {
      dateFormat: "eu",
      "close": "اغلاق",
      "datepicker.label": "اختر تاريخا",
      "datepicker.prev": "الشهر السابق",
      "datepicker.next": "الشهر التالي",
      "datepicker.today": "اليوم",
      "datepicker.clear": "مسح",
      "combobox.empty": "لا نتائج",
      "tag.remove": "ازالة {name}",
      "dropzone.hint": "اسحب الملفات هنا او انقر"
    }
  };

  for (var code in PACKS) {
    if (Object.prototype.hasOwnProperty.call(PACKS, code)) {
      Bitstrap.i18n.add(code, PACKS[code]);
    }
  }

  /* Arabisch laeuft von rechts nach links - beim Wechsel dorthin wird
     die Leserichtung mitgesetzt, sonst greift 15-rtl.css nicht. */
  var RTL = ["ar", "he", "fa", "ur"];

  document.documentElement.addEventListener("bit:locale:change", function (e) {
    var lang = e.detail && e.detail.locale;
    document.documentElement.setAttribute(
      "dir",
      RTL.indexOf(lang) > -1 ? "rtl" : "ltr"
    );
  });

  return Bitstrap;
});
