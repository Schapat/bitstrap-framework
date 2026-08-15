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
