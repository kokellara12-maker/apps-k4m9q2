/* gk.js: mini motor compartido por los juegos nuevos (canvas a pantalla completa, toque, marcador, menu y fin de partida). */
(function () {
  var GK = window.GK = {};
  GK.id = (location.pathname.split('/').pop() || 'x').replace(/\.html$/, '');
  GK.rnd = function (a, b) { return a + Math.random() * (b - a); };
  GK.ri = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  GK.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  GK.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  GK.dist = function (a, b, c, d) { return Math.hypot(c - a, d - b); };
  GK.store = {
    get: function (k, d) { try { var v = localStorage.getItem(GK.id + '-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(GK.id + '-' + k, JSON.stringify(v)); } catch (e) {} }
  };
  GK.best = +(localStorage.getItem(GK.id + '-best') || 0);
  var G, cv, c, W = 0, H = 0, dpr = 1, state = 'menu', last = 0, sc = 0, shk = 0, parts = [], floats = [], ac = null, ui = {};
  GK.W = function () { return W; }; GK.H = function () { return H; };
  GK.state = function () { return state; };
  GK.keys = {};
  GK.ptr = { x: 0, y: 0, down: false };
  var CSS = '*{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
    'html,body{margin:0;height:100%;overflow:hidden;background:#0d0a1f;color:#fff;font-family:"Avenir Next","Trebuchet MS",-apple-system,system-ui,sans-serif;touch-action:none;overscroll-behavior:none}' +
    'canvas{position:fixed;inset:0;display:block}' +
    '.top{position:fixed;left:0;right:0;top:0;z-index:5;padding:calc(10px + env(safe-area-inset-top,0px)) calc(12px + env(safe-area-inset-right,0px)) 0 calc(12px + env(safe-area-inset-left,0px));display:flex;align-items:center;gap:8px;pointer-events:none}' +
    '.top>*{pointer-events:auto}.sp{flex:1}' +
    '.pill{background:rgba(20,14,40,.62);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-radius:999px;padding:7px 14px;font-weight:800;font-size:15px;color:#fff;text-decoration:none;white-space:nowrap;border:1px solid rgba(255,255,255,.14)}' +
    '.ov{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:rgba(5,5,15,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:18px}' +
    '.card{background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.2);border-radius:26px;padding:24px 22px;text-align:center;max-width:340px;width:100%;display:flex;flex-direction:column;gap:12px;align-items:center;animation:pp .25s ease-out}' +
    '.card h1{margin:0;font-size:32px;line-height:1.05}.card p{margin:0;font-size:15px;opacity:.9;line-height:1.35}.card .ic{font-size:54px;line-height:1}' +
    '.btn{font:inherit;font-weight:900;font-size:19px;color:#1a1530;background:var(--acc,#ffd23a);border:0;border-radius:18px;padding:14px 30px;box-shadow:0 5px 0 rgba(0,0,0,.28);cursor:pointer;touch-action:manipulation}' +
    '.btn:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.28)}.btn.g{background:rgba(255,255,255,.16);color:#fff;box-shadow:none;font-size:16px;padding:11px 22px;text-decoration:none}' +
    '@keyframes pp{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}';
  function el(t, cls, html) { var e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  GK.start = function (g) {
    G = g;
    var st = el('style', null, CSS); document.head.appendChild(st);
    document.title = g.title; document.documentElement.style.setProperty('--acc', g.color || '#ffd23a');
    document.body.style.background = g.bg || '#0d0a1f';
    cv = el('canvas'); document.body.appendChild(cv); c = cv.getContext('2d');
    var top = el('div', 'top'); var back = el('a', 'pill', '‹ Menú'); back.href = 'index.html';
    ui.sc = el('div', 'pill', '0'); ui.bs = el('div', 'pill', '🏆 ' + GK.best);
    top.appendChild(back); top.appendChild(el('div', 'sp')); if (!g.noScore) { top.appendChild(ui.sc); top.appendChild(ui.bs); }
    document.body.appendChild(top);
    function resize() { dpr = Math.min(2.5, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; if (G.resize) G.resize(W, H); }
    window.addEventListener('resize', resize); resize();
    function pt(e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
    window.addEventListener('pointerdown', function (e) { if (state !== 'play' || e.target.closest && e.target.closest('.top,.ov')) return; var p = pt(e); GK.ptr.x = p[0]; GK.ptr.y = p[1]; GK.ptr.down = true; G.down && G.down(p[0], p[1], e); e.preventDefault(); }, { passive: false });
    window.addEventListener('pointermove', function (e) { var p = pt(e); GK.ptr.x = p[0]; GK.ptr.y = p[1]; if (state === 'play') G.move && G.move(p[0], p[1], e); }, { passive: true });
    function up(e) { var p = pt(e); GK.ptr.down = false; if (state === 'play') G.up && G.up(p[0], p[1], e); }
    window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', function (e) { GK.keys[e.code] = 1; if (state === 'play') G.key && G.key(e.code, e); });
    window.addEventListener('keyup', function (e) { GK.keys[e.code] = 0; });
    document.addEventListener('visibilitychange', function () { last = 0; });
    menu(true); requestAnimationFrame(loop);
  };
  function card(icon, title, html, btn, fn) {
    var o = el('div', 'ov'), cd = el('div', 'card');
    cd.appendChild(el('div', 'ic', icon)); cd.appendChild(el('h1', null, title)); cd.appendChild(el('p', null, html)); if (G.extra) { var ex = G.extra(state); if (ex) cd.appendChild(ex); }
    var b = el('button', 'btn', btn); b.onclick = function () { o.remove(); fn(); }; cd.appendChild(b); o.appendChild(cd); document.body.appendChild(o); return o;
  }
  function menu() { state = 'menu'; card(G.icon || '🎮', G.title, G.help || '', 'JUGAR', GK.play); }
  GK.play = function () { sc = 0; parts = []; floats = []; GK.setScore(0); state = 'play'; G.reset && G.reset(); try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {} };
  GK.setScore = function (v) { sc = Math.floor(v); if (ui.sc) ui.sc.textContent = sc; };
  GK.add = function (v) { GK.setScore(sc + v); };
  GK.score = function () { return sc; };
  GK.commit = function () { if (sc > GK.best) { GK.best = sc; try { localStorage.setItem(GK.id + '-best', sc); } catch (e) {} if (ui.bs) ui.bs.textContent = '🏆 ' + GK.best; } };
  GK.over = function (msg) {
    if (state !== 'play') return; state = 'over';
    var nb = sc > GK.best; if (nb) { GK.best = sc; try { localStorage.setItem(GK.id + '-best', sc); } catch (e) {} if (ui.bs) ui.bs.textContent = '🏆 ' + GK.best; }
    GK.beep(180, .4, 'sawtooth', .12, -120); GK.vib(60);
    setTimeout(function () { card(nb ? '🏆' : (G.icon || '💥'), msg || '¡Fin!', (G.noScore ? '' : 'Puntos: <b>' + sc + '</b><br>' + (nb ? '¡Nuevo récord!' : 'Récord: ' + GK.best)), 'OTRA VEZ', GK.play); }, 500);
  };
  GK.beep = function (f, d, type, v, slide) {
    if (!ac || window.__misMute) return;
    try { var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v || .08, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02); } catch (e) {}
  };
  GK.vib = function (ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  GK.shake = function (n) { shk = Math.max(shk, n); };
  GK.burst = function (x, y, n, col, sp, life) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = (sp || 160) * (.3 + Math.random()); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: life || .6, m: life || .6, c: col || '#fff', r: 2 + Math.random() * 3 }); } };
  GK.float = function (x, y, txt, col, size) { floats.push({ x: x, y: y, txt: txt, c: col || '#fff', t: 1, s: size || 22 }); };
  GK.text = function (txt, x, y, size, col, align, stroke) { c.font = '900 ' + size + 'px "Avenir Next","Trebuchet MS",system-ui,sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; if (stroke !== false) { c.lineWidth = Math.max(3, size / 5); c.strokeStyle = 'rgba(10,5,40,.8)'; c.lineJoin = 'round'; c.strokeText(txt, x, y); } c.fillStyle = col || '#fff'; c.fillText(txt, x, y); };
  GK.rr = function (x, y, w, h, r, fill, stroke, lw) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); } };
  GK.btn = function (x, y, w, h, label, col, on, size) { GK.rr(x, y + 3, w, h, 12, 'rgba(0,0,0,.35)'); GK.rr(x, y, w, h, 12, on === false ? '#4a4660' : (col || '#ffd23a')); GK.text(label, x + w / 2, y + h / 2, size || 16, on === false ? '#999' : '#1a1530', 'center', false); };
  GK.hit = function (px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; };
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(.033, (now - last) / 1000) : 0; last = now;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.save(); if (shk > .2) { c.translate((Math.random() - .5) * shk, (Math.random() - .5) * shk); shk *= .86; } else shk = 0;
    if (state === 'play') G.update && G.update(dt);
    G.draw && G.draw(c, W, H);
    for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; c.globalAlpha = Math.max(0, p.t / p.m); c.fillStyle = p.c; c.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); }
    c.globalAlpha = 1;
    for (i = floats.length - 1; i >= 0; i--) { var f = floats[i]; f.t -= dt * 1.1; if (f.t <= 0) { floats.splice(i, 1); continue; } c.globalAlpha = Math.min(1, f.t * 2); GK.text(f.txt, f.x, f.y - (1 - f.t) * 40, f.s, f.c); }
    c.globalAlpha = 1; c.restore();
  }
})();
