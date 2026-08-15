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

    version: "1.0.0"
  };
});
