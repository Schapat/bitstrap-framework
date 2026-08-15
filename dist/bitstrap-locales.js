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
