/* =============================================================================
   TEST SAYTI MANTIG'I  (bu faylni tahrirlashingiz shart emas)
   Imtihon rejimi: fanlar ketma-ket, har fandan N ta savol + fan bo'yicha mashq.
   ============================================================================= */
(function () {
  "use strict";

  var TEST   = Array.isArray(window.TEST_SAVOLLAR)   ? window.TEST_SAVOLLAR   : [];
  var SUHBAT = Array.isArray(window.SUHBAT_SAVOLLAR) ? window.SUHBAT_SAVOLLAR : [];
  var SOZ = Object.assign({
    testNomi: "Ishga kirish testi",
    fanlar: [], mashqFanlari: [], savollarPerFan: 10, otishBali: 60,
    savollarniAralashtirish: true, variantlarniAralashtirish: false, vaqtniKorsatish: true
  }, window.TEST_SOZLAMALAR || {});

  var FAN_IKON = { "Davlat tili": "🗣️", "Milliy qonunchilik": "⚖️", "IKT": "💻", "Mantiqiy fikrlash": "🧩", "Kasbiy ko'nikmalar": "🧰" };

  var $ = function (id) { return document.getElementById(id); };
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function vaqtStr(s) { var m = Math.floor(s / 60); s = s % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function harf(i) { return String.fromCharCode(65 + i); }
  function esc(t) { var d = document.createElement("div"); d.textContent = t == null ? "" : String(t); return d.innerHTML; }
  function ikon(f) { return FAN_IKON[f] || "📘"; }

  // Fanlar ro'yxati (sozlamadagi tartibda + qolganlari)
  function fanlar() {
    var bor = {}; TEST.forEach(function (q) { if (q.fan) bor[q.fan] = true; });
    var list = SOZ.fanlar.filter(function (f) { return bor[f]; });
    Object.keys(bor).forEach(function (f) { if (list.indexOf(f) < 0) list.push(f); });
    if (!list.length && TEST.length) list = ["Test"];
    return list;
  }
  // To'liq imtihonga kiradigan fanlar (faqat mashq uchun fanlar chiqarib tashlanadi)
  function imtihonFanlari() {
    return fanlar().filter(function (f) { return SOZ.mashqFanlari.indexOf(f) < 0; });
  }
  function fanSavollari(f) { return f === "Test" ? TEST.slice() : TEST.filter(function (q) { return q.fan === f; }); }

  // Holat
  var savollar = [], idx = 0, javoblar = [], togriSoni = 0;
  var boshVaqt = 0, timerId = null, holat = "idle", rejim = null;

  /* --------------------------------------------------------- Ekran almashtirish */
  function korsat(nom) {
    ["home", "test", "natija", "suhbat"].forEach(function (n) {
      var el = $(n); if (el) el.classList.toggle("active", n === nom);
    });
    document.querySelectorAll("nav button[data-go]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-go") === nom);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function temaQoy(t) {
    document.documentElement.setAttribute("data-theme", t);
    var b = $("btn-theme"); if (b) b.textContent = t === "dark" ? "☀️" : "🌙";
    lsSet("ikt_tema", t);
  }

  /* --------------------------------------------------------- Bosh sahifa */
  function homeYangila() {
    $("brand-title").textContent = SOZ.testNomi;
    $("home-title").textContent = SOZ.testNomi;
    $("home-per-fan").textContent = SOZ.savollarPerFan;

    var fl = fanlar(), jami = 0;
    imtihonFanlari().forEach(function (f) { jami += Math.min(SOZ.savollarPerFan, fanSavollari(f).length); });
    $("home-exam-count").textContent = jami;
    $("btn-exam").disabled = jami === 0;

    var box = $("home-fanlar"); box.innerHTML = "";
    if (!fl.length) { box.innerHTML = '<div class="empty">Savollar qo\'shilmagan.</div>'; }
    fl.forEach(function (f) {
      var n = fanSavollari(f).length;
      var row = document.createElement("div");
      row.className = "fan-row";
      row.innerHTML = '<span class="ic">' + ikon(f) + '</span>' +
        '<div><div class="nm">' + esc(f) + '</div><div class="ct">' + n + ' ta savol</div></div>' +
        '<div class="spacer"></div><button class="btn ghost sm">Mashq</button>';
      row.querySelector("button").addEventListener("click", function () { mashqBoshla(f); });
      box.appendChild(row);
    });

    var tarix = tarixOl(), card = $("home-history-card"), hb = $("home-history");
    if (tarix.length) {
      card.style.display = "";
      var best = Math.max.apply(null, tarix.map(function (r) { return r.foiz; }));
      $("home-best").textContent = "🏆 Eng yaxshi natija: " + best + "%";
      hb.innerHTML = tarix.slice().reverse().slice(0, 5).map(function (r) {
        return '<div class="review-line"><span class="tag ' + (r.foiz >= SOZ.otishBali ? "ok" : "no") + '">' +
          r.foiz + '%</span><span class="muted">' + esc(r.nomi) + " · " + esc(r.sana) + " · " + r.togri + "/" + r.jami + "</span></div>";
      }).join("");
    } else { card.style.display = "none"; $("home-best").textContent = ""; }
  }
  function tarixOl() { try { return JSON.parse(lsGet("ikt_natijalar", "[]")) || []; } catch (e) { return []; } }
  function tarixSaqla(r) { var t = tarixOl(); t.push(r); if (t.length > 20) t = t.slice(t.length - 20); lsSet("ikt_natijalar", JSON.stringify(t)); }

  /* --------------------------------------------------------- Test oqimi */
  function tayyorlaSavol(s) {
    var v = (s.variantlar || []).slice(), t = s.togri;
    if (SOZ.variantlarniAralashtirish) {
      var p = v.map(function (x, i) { return { x: x, i: i }; }); shuffle(p);
      v = p.map(function (o) { return o.x; }); t = p.findIndex(function (o) { return o.i === s.togri; });
    }
    return { fan: s.fan || "Test", savol: s.savol, variantlar: v, togri: t, izoh: s.izoh || "" };
  }

  function imtihonBoshla() {
    var aralash = $("chk-shuffle").checked, list = [];
    imtihonFanlari().forEach(function (f) {
      var pool = fanSavollari(f); if (aralash) shuffle(pool);
      list = list.concat(pool.slice(0, SOZ.savollarPerFan));  // fanlar ketma-ket
    });
    boshla(list, { type: "exam", nomi: "To'liq imtihon" });
  }
  function mashqBoshla(f) {
    var pool = fanSavollari(f); if ($("chk-shuffle").checked) shuffle(pool);
    boshla(pool, { type: "mashq", fan: f, nomi: "Mashq: " + f });
  }

  function boshla(list, r) {
    if (!list || !list.length) return;
    savollar = list.map(tayyorlaSavol);
    rejim = r; idx = 0; togriSoni = 0; javoblar = savollar.map(function () { return null; });
    boshVaqt = Date.now(); timerBoshla(); holat = "faol";
    renderSavol(); korsat("test");
  }

  function timerBoshla() {
    timerStop();
    $("test-timer").style.display = SOZ.vaqtniKorsatish ? "" : "none";
    $("test-timer").textContent = "00:00";
    timerId = setInterval(function () { $("test-timer").textContent = vaqtStr(Math.floor((Date.now() - boshVaqt) / 1000)); }, 1000);
  }
  function timerStop() { if (timerId) { clearInterval(timerId); timerId = null; } }

  function renderSavol() {
    var s = savollar[idx], jami = savollar.length;
    $("test-fan").textContent = s.fan;
    $("test-counter").textContent = "Savol " + (idx + 1) + " / " + jami;
    $("test-bar").style.width = (idx / jami * 100) + "%";
    $("test-question").textContent = s.savol;

    var box = $("test-options"); box.innerHTML = "";
    s.variantlar.forEach(function (v, i) {
      var b = document.createElement("button");
      b.className = "opt";
      b.innerHTML = '<span class="mark">' + harf(i) + "</span><span>" + esc(v) + "</span>";
      b.addEventListener("click", function () { javobTanla(i); });
      box.appendChild(b);
    });
    $("test-izoh").className = "izoh"; $("test-izoh").innerHTML = "";
    var nx = $("btn-next"); nx.disabled = true; nx.textContent = (idx === jami - 1) ? "Yakunlash" : "Keyingi";
  }

  function javobTanla(t) {
    if (javoblar[idx] !== null) return;
    var s = savollar[idx]; javoblar[idx] = t;
    if (t === s.togri) togriSoni++;
    var btns = $("test-options").children;
    for (var i = 0; i < btns.length; i++) {
      btns[i].disabled = true;
      if (i === s.togri) btns[i].classList.add("correct");
      else if (i === t) btns[i].classList.add("wrong");
    }
    if (s.izoh) { var iz = $("test-izoh"); iz.innerHTML = "<b>Izoh:</b> " + esc(s.izoh); iz.classList.add("show"); }
    $("btn-next").disabled = false;
  }

  function keyingi() {
    if (javoblar[idx] === null) return;
    if (idx < savollar.length - 1) { idx++; renderSavol(); korsat("test"); }
    else natijaKorsat();
  }

  /* --------------------------------------------------------- Natija */
  function natijaKorsat() {
    timerStop(); holat = "tugadi";
    var jami = savollar.length, foiz = jami ? Math.round(togriSoni / jami * 100) : 0;
    var sek = Math.floor((Date.now() - boshVaqt) / 1000), otdi = foiz >= SOZ.otishBali;

    $("natija-ring").style.setProperty("--p", foiz);
    $("natija-percent").textContent = foiz + "%";
    var v = $("natija-verdict");
    v.textContent = otdi ? "✅ Tabriklaymiz — o'tdingiz!" : "❌ O'tish chegarasiga yetmadi";
    v.className = "verdict " + (otdi ? "pass" : "fail");
    $("natija-correct").textContent = togriSoni;
    $("natija-wrong").textContent = jami - togriSoni;
    $("natija-total").textContent = jami;
    $("natija-time").textContent = vaqtStr(sek);

    // Fanlar bo'yicha
    var order = [], agg = {};
    savollar.forEach(function (s, i) {
      if (!agg[s.fan]) { agg[s.fan] = { t: 0, n: 0 }; order.push(s.fan); }
      agg[s.fan].n++; if (javoblar[i] === s.togri) agg[s.fan].t++;
    });
    var tb = $("natija-fanlar"); tb.innerHTML = "";
    order.forEach(function (f) {
      var a = agg[f], p = Math.round(a.t / a.n * 100);
      tb.insertAdjacentHTML("beforeend",
        "<tr><td>" + ikon(f) + " " + esc(f) + '</td><td class="r">' + a.t + "/" + a.n +
        '</td><td class="r" style="color:' + (p >= SOZ.otishBali ? "var(--ok)" : "var(--err)") + '">' + p + "%</td></tr>");
    });
    $("natija-fanlar-card").style.display = order.length > 1 ? "" : "none";

    // Ko'rib chiqish
    var rev = $("natija-review"); rev.innerHTML = "";
    savollar.forEach(function (s, i) {
      var t = javoblar[i], ok = t === s.togri;
      var h = '<div class="review-item"><div class="q">' + (i + 1) + ". " + esc(s.savol) + "</div>";
      h += '<div class="review-line"><span class="tag ' + (ok ? "ok" : "no") + '">' + (ok ? "To'g'ri" : "Xato") +
        '</span><span>Sizning javobingiz: <b>' + (t === null ? "—" : harf(t) + ") " + esc(s.variantlar[t])) + "</b></span></div>";
      if (!ok) h += '<div class="review-line"><span class="tag ok">Javob</span><span>To\'g\'ri javob: <b>' +
        harf(s.togri) + ") " + esc(s.variantlar[s.togri]) + "</b></span></div>";
      rev.insertAdjacentHTML("beforeend", h + "</div>");
    });

    var d = new Date();
    tarixSaqla({
      nomi: (rejim && rejim.nomi) || "Test",
      sana: d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2) +
        " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2),
      foiz: foiz, togri: togriSoni, jami: jami, vaqt: vaqtStr(sek)
    });
    homeYangila(); korsat("natija");
  }

  function qaytaBoshla() {
    if (rejim && rejim.type === "mashq") mashqBoshla(rejim.fan);
    else imtihonBoshla();
  }

  /* --------------------------------------------------------- Suhbat */
  function suhbatRender() {
    var box = $("suhbat-list"); box.innerHTML = "";
    if (!SUHBAT.length) { box.innerHTML = '<div class="empty">Suhbat savollari qo\'shilmagan.</div>'; return; }
    SUHBAT.forEach(function (item, i) {
      var acc = document.createElement("div"); acc.className = "acc";
      acc.innerHTML = '<div class="acc-head"><span class="num">' + (i + 1) + '</span><span>' + esc(item.savol) +
        '</span><span class="chev">▾</span></div><div class="acc-body">' +
        '<textarea placeholder="Bu yerga o\'z javobingizni yozing...">' + esc(lsGet("ikt_suhbat_" + i, "")) + '</textarea>' +
        (item.namunaJavob ? '<div class="namuna"><div class="lbl">NAMUNA JAVOB</div>' + esc(item.namunaJavob) + '</div>' : '') + '</div>';
      acc.querySelector(".acc-head").addEventListener("click", function () { acc.classList.toggle("open"); });
      var ta = acc.querySelector("textarea");
      ta.addEventListener("click", function (e) { e.stopPropagation(); });
      ta.addEventListener("input", function () { lsSet("ikt_suhbat_" + i, ta.value); });
      box.appendChild(acc);
    });
  }

  /* --------------------------------------------------------- Boshlash */
  function init() {
    temaQoy(lsGet("ikt_tema", "light"));
    homeYangila(); suhbatRender();

    document.querySelectorAll("nav button[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { korsat(b.getAttribute("data-go")); });
    });
    $("btn-theme").addEventListener("click", function () {
      temaQoy(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    });
    $("btn-exam").addEventListener("click", imtihonBoshla);
    $("btn-next").addEventListener("click", keyingi);
    $("btn-quit").addEventListener("click", function () {
      if (confirm("Testdan chiqasizmi? Joriy natija saqlanmaydi.")) { timerStop(); holat = "idle"; korsat("home"); }
    });
    $("btn-retry").addEventListener("click", qaytaBoshla);
    $("btn-home2").addEventListener("click", function () { holat = "idle"; korsat("home"); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.__APP__ = {
    get holat() { return holat; }, get idx() { return idx; }, get togriSoni() { return togriSoni; },
    get savollar() { return savollar; }, get rejim() { return rejim; },
    imtihonBoshla: imtihonBoshla, mashqBoshla: mashqBoshla, javobTanla: javobTanla, keyingi: keyingi, fanlar: fanlar
  };
})();
