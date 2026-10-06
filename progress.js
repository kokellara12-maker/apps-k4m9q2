/* Progreso global de "Mis Apps": tiempo jugado, partidas, récords, nivel, logros y rachas.
   Se carga en el menú y en cada juego. Todo se guarda en localStorage ('koke_prog'). */
(function () {
  var K = 'koke_prog', IGN = { koke_prog: 1, mis_mute: 1, hub_f: 1 };
  var id = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
  var IS_HUB = id === 'index';
  function load() { try { var d = JSON.parse(localStorage.getItem(K)); if (d && d.g) return d; } catch (e) {} return { v: 1, g: {}, days: [], ach: {}, ms: 0 }; }
  function save(d) { try { localStorage.setItem(K, JSON.stringify(d)); } catch (e) {} }
  function ymd(t) { var d = new Date(t || Date.now()); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
  function dayNum(y) { return Math.floor(Date.UTC(Math.floor(y / 10000), Math.floor(y / 100) % 100 - 1, y % 100) / 864e5); }

  var ACH = [
    ['first', '🎮', 'Primera partida', 'Abre tu primer juego', function (T) { return T.plays >= 1; }],
    ['g5', '🧭', 'Explorador', 'Prueba 5 juegos distintos', function (T) { return T.games >= 5; }],
    ['g15', '🗺️', 'Aventurero', 'Prueba 15 juegos distintos', function (T) { return T.games >= 15; }],
    ['g30', '🚀', 'Trotamundos', 'Prueba 30 juegos distintos', function (T) { return T.games >= 30; }],
    ['g50', '👑', 'Lo has probado todo', 'Prueba 50 juegos distintos', function (T) { return T.games >= 50; }],
    ['t10', '⏱️', 'Calentando', 'Juega 10 minutos en total', function (T) { return T.sec >= 600; }],
    ['t60', '🕐', 'Enganchado', 'Juega 1 hora en total', function (T) { return T.sec >= 3600; }],
    ['t300', '🔥', 'Muy enganchado', 'Juega 5 horas en total', function (T) { return T.sec >= 18000; }],
    ['t1200', '💎', 'Leyenda', 'Juega 20 horas en total', function (T) { return T.sec >= 72000; }],
    ['s3', '📅', 'Constante', 'Juega 3 días seguidos', function (T) { return T.streak >= 3; }],
    ['s7', '🗓️', 'Imparable', 'Juega 7 días seguidos', function (T) { return T.streak >= 7; }],
    ['s14', '🏅', 'Vicio total', 'Juega 14 días seguidos', function (T) { return T.streak >= 14; }],
    ['night', '🌙', 'Noctámbulo', 'Juega entre las 00:00 y las 05:00', function (T, d) { return !!d.night; }],
    ['mar', '🏃', 'Maratón', 'Una sesión de 30 minutos seguidos', function (T, d) { return (d.ms || 0) >= 1800; }],
    ['fav', '❤️', 'Tu favorito', '60 minutos en un mismo juego', function (T) { return T.maxGame >= 3600; }],
    ['rec', '🏆', 'Cazarrécords', 'Consigue récord en 10 juegos', function (T) { return T.records >= 10; }]
  ];

  function streak(days) {
    if (!days.length) return 0;
    var s = days.slice().sort(function (a, b) { return b - a; }), today = dayNum(ymd());
    var cur = dayNum(s[0]); if (today - cur > 1) return 0;
    var n = 1; for (var i = 1; i < s.length; i++) { var x = dayNum(s[i]); if (cur - x === 1) { n++; cur = x; } else if (cur - x > 1) break; }
    return n;
  }
  function recordOf(g) {
    if (!g) return null;
    var best = null, ks = g.k || {};
    for (var k in ks) {
      var raw; try { raw = localStorage.getItem(k); } catch (e) { continue; }
      if (raw == null || raw.length > 4000) continue;
      var v; try { v = JSON.parse(raw); } catch (e) { v = raw; }
      var kn = /best|high|record|rec$|max|mejor|hi$|hs/i.test(k), cand = null;
      if (typeof v === 'number') { if (kn || /score|punt|pts|level|nivel|wave|oleada/i.test(k)) cand = v; }
      else if (typeof v === 'string' && /^\d+$/.test(v) && (kn || /score|punt|level|nivel/i.test(k))) cand = +v;
      else if (v && typeof v === 'object' && !Array.isArray(v)) {
        for (var p in v) if (typeof v[p] === 'number' && /best|high|record|score|max|mejor/i.test(p)) { if (cand == null || v[p] > cand) cand = v[p]; }
      }
      if (cand != null && cand > 0 && (!best || (kn && !best.kn) || (kn === best.kn && cand > best.v))) best = { v: cand, kn: kn };
    }
    var m = Math.max(best ? best.v : 0, g.a || 0);
    return m > 0 ? m : null;
  }
  function totals(d) {
    var T = { plays: 0, sec: 0, games: 0, maxGame: 0, records: 0, streak: streak(d.days || []) };
    for (var k in d.g) { var g = d.g[k]; T.plays += g.n || 0; T.sec += g.s || 0; if ((g.n || 0) > 0) T.games++; if ((g.s || 0) > T.maxGame) T.maxGame = g.s; if (recordOf(g)) T.records++; }
    return T;
  }
  function stats() {
    var d = load(), T = totals(d), n = 0, list = [];
    ACH.forEach(function (a) { var on = !!d.ach[a[0]]; if (on) n++; list.push({ id: a[0], ico: a[1], name: a[2], desc: a[3], on: on, at: d.ach[a[0]] || 0 }); });
    var xp = Math.floor(T.sec / 6) + T.games * 50 + n * 100;
    var lvl = Math.floor(Math.sqrt(xp / 120)) + 1, base = 120 * (lvl - 1) * (lvl - 1), next = 120 * lvl * lvl;
    return { T: T, xp: xp, lvl: lvl, pct: Math.max(0, Math.min(1, (xp - base) / (next - base))), toNext: next - xp, ach: list, achOn: n, data: d };
  }
  function check(d, quiet) {
    var T = totals(d), fresh = [], oldLvl = d.lvl || 1;
    ACH.forEach(function (a) { if (!d.ach[a[0]] && a[4](T, d)) { d.ach[a[0]] = Date.now(); fresh.push(a); } });
    var s = stats0(d, T);
    d.lvl = s;
    if (!quiet) {
      fresh.forEach(function (a, i) { setTimeout(function () { toast(a[1] + ' Logro: ' + a[2]); }, i * 3200); });
      if (s > oldLvl && oldLvl) setTimeout(function () { toast('⭐ ¡Nivel ' + s + '!'); }, fresh.length * 3200);
    }
    return fresh;
  }
  function stats0(d, T) { var n = 0; for (var k in d.ach) n++; var xp = Math.floor(T.sec / 6) + T.games * 50 + n * 100; return Math.floor(Math.sqrt(xp / 120)) + 1; }

  var tEl, tQ = [], tBusy = 0;
  function toast(msg) {
    tQ.push(msg); if (tBusy) return; tBusy = 1;
    (function next() {
      var m = tQ.shift(); if (!m) { tBusy = 0; return; }
      if (!document.body) { tQ.unshift(m); setTimeout(next, 500); return; }
      if (!tEl) {
        tEl = document.createElement('div');
        tEl.style.cssText = 'position:fixed;z-index:2147483000;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);transition:transform .35s cubic-bezier(.2,1.3,.4,1);background:rgba(20,12,40,.94);color:#fff;border:2px solid #ffd23f;border-radius:14px;padding:9px 16px;font:800 14px/1.2 -apple-system,system-ui,sans-serif;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.5);max-width:86vw;text-align:center';
        document.body.appendChild(tEl);
      }
      tEl.textContent = m; tEl.style.transform = 'translate(-50%,0)';
      setTimeout(function () { tEl.style.transform = 'translate(-50%,-140%)'; setTimeout(next, 450); }, 2800);
    })();
  }

  var api = { stats: stats, record: function (gid) { var d = load(); return recordOf(d.g[gid]); }, game: function (gid) { return load().g[gid] || null; }, ACH: ACH, load: load, save: save, toast: toast };
  window.KokeProg = api;

  // copias de seguridad de todo lo guardado (partidas, récords, ajustes)
  api.backup = function () {
    var o = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); o[k] = localStorage.getItem(k); } } catch (e) {}
    return JSON.stringify({ koke: 1, at: Date.now(), data: o });
  };
  api.restore = function (txt) {
    var j = JSON.parse(txt); if (!j || !j.koke || !j.data) throw new Error('no es una copia');
    var n = 0; for (var k in j.data) { try { localStorage.setItem(k, j.data[k]); n++; } catch (e) {} }
    return n;
  };

  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  if (IS_HUB) { try { var dh = load(); check(dh, true); save(dh); } catch (e) {} return; }

  // ---- seguimiento dentro de un juego ----
  var d0 = load(), g = d0.g[id] || (d0.g[id] = { n: 0, s: 0, f: Date.now(), k: {} });
  var now = Date.now();
  if (!g.l || now - g.l > 20000) g.n = (g.n || 0) + 1;
  g.l = now; g.k = g.k || {};
  var td = ymd(); if (d0.days.indexOf(td) < 0) { d0.days.push(td); if (d0.days.length > 400) d0.days.shift(); }
  var hr = new Date().getHours(); if (hr < 5) d0.night = 1;
  check(d0); save(d0);

  var snap = {};
  try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (!IGN[k]) snap[k] = localStorage.getItem(k); } } catch (e) {}
  var sess = 0, last = Date.now();

  function autoScore() {
    var best = 0;
    try {
      var els = document.querySelectorAll('[id*="score" i],[id*="puntos" i],[id*="pts" i],[class*="score" i]');
      for (var j = 0; j < els.length && j < 12; j++) {
        var t = (els[j].textContent || '').trim();
        if (t.length > 14) continue;
        var m = t.match(/^\D{0,3}(\d{1,9})\b/); if (m && +m[1] > best) best = +m[1];
      }
    } catch (e) {}
    return best;
  }
  function tick(final) {
    var t = Date.now(), dt = (t - last) / 1000; last = t;
    var vis = document.visibilityState === 'visible';
    var d = load(), gg = d.g[id] || (d.g[id] = { n: 1, s: 0, f: t, k: {} });
    if (vis && dt > 0 && dt < 15) { gg.s = (gg.s || 0) + dt; sess += dt; if (sess > (d.ms || 0)) d.ms = sess; }
    gg.l = t; gg.k = gg.k || {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (IGN[k]) continue;
        var v = localStorage.getItem(k);
        if (snap[k] !== v) { snap[k] = v; gg.k[k] = 1; }
      }
    } catch (e) {}
    var a = autoScore(); if (a > (gg.a || 0)) gg.a = a;
    var rv = recordOf(gg); if (rv > (gg.a || 0)) gg.a = rv;
    check(d); save(d);
  }
  setInterval(function () { tick(); }, 5000);
  document.addEventListener('visibilitychange', function () { tick(true); last = Date.now(); });
  window.addEventListener('pagehide', function () { tick(true); });

  // la pantalla no se apaga mientras juegas
  var wl = null;
  function wake() { try { if (!wl && navigator.wakeLock && document.visibilityState === 'visible') navigator.wakeLock.request('screen').then(function (s) { wl = s; s.addEventListener('release', function () { wl = null; }); }).catch(function () {}); } catch (e) {} }
  window.addEventListener('pointerdown', wake, { once: false, passive: true });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') wake(); });
})();
