/* gk.js: mini motor compartido por los juegos nuevos (canvas a pantalla completa, toque, marcador, menu y fin de partida). */
(function () {
  var GK = window.GK = {}; GK.PX = 2;
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
  var vigC, G, cv, mc, cb, PX = 3, tq = [], c, W = 0, H = 0, dpr = 1, state = 'menu', last = 0, sc = 0, shk = 0, parts = [], floats = [], ac = null, ui = {};
  GK.W = function () { return W; }; GK.H = function () { return H; };
  GK.state = function () { return state; };
  GK.keys = {};
  GK.ptr = { x: 0, y: 0, down: false };
  var CSS = '*{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}' +
    'html,body{margin:0;height:100%;overflow:hidden;background:#0d0a1f;color:#fff;font-family:"Avenir Next","Trebuchet MS",-apple-system,system-ui,sans-serif;touch-action:none;overscroll-behavior:none}' +
    'canvas{position:fixed;inset:0;display:block;animation:fi .5s ease-out}@keyframes fi{from{opacity:0}to{opacity:1}}' +
    '.top{position:fixed;left:0;right:0;top:0;z-index:5;padding:calc(10px + env(safe-area-inset-top,0px)) calc(12px + env(safe-area-inset-right,0px)) 0 calc(12px + env(safe-area-inset-left,0px));display:flex;align-items:center;gap:8px;pointer-events:none}' +
    '.top>*{pointer-events:auto}.sp{flex:1}' +
    '.pill{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.06)),rgba(18,12,38,.66);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:999px;padding:7px 15px;font-weight:900;font-size:15px;color:#fff;text-decoration:none;white-space:nowrap;border:1px solid rgba(255,255,255,.22);box-shadow:0 3px 10px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.3);text-shadow:0 1px 2px rgba(0,0,0,.5);transition:transform .12s}' +
    '.pill.bump{transform:scale(1.22)}.pill.sc{min-width:54px;text-align:center;border-color:var(--acc,#ffd23a);color:#fff}' +
    '.ov{position:fixed;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 40%,rgba(10,8,30,.45),rgba(3,3,12,.82));backdrop-filter:blur(7px);-webkit-backdrop-filter:blur(7px);padding:18px;animation:fi .25s}' +
    '.card{position:relative;background:linear-gradient(160deg,rgba(255,255,255,.2),rgba(255,255,255,.05));border:1px solid rgba(255,255,255,.28);border-radius:28px;padding:26px 22px 22px;text-align:center;max-width:340px;width:100%;display:flex;flex-direction:column;gap:12px;align-items:center;animation:pp .35s cubic-bezier(.2,1.5,.4,1);box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.06),0 0 60px -10px var(--acc,#ffd23a),inset 0 1px 0 rgba(255,255,255,.35)}' +
    '.card h1{margin:0;font-size:30px;line-height:1.05;text-shadow:0 3px 0 rgba(0,0,0,.35),0 0 24px var(--acc,#ffd23a)}.card p{margin:0;font-size:15px;opacity:.92;line-height:1.4}' +
    '.card .ic{font-size:64px;line-height:1;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5)) drop-shadow(0 0 18px var(--acc,#ffd23a));animation:fl 2.4s ease-in-out infinite}' +
    '@keyframes fl{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-8px) rotate(4deg)}}' +
    '.btn{font:inherit;font-weight:900;font-size:19px;letter-spacing:.5px;color:#1a1530;background:linear-gradient(180deg,#fff7c4,var(--acc,#ffd23a) 45%,var(--acc,#ffd23a));border:0;border-radius:18px;padding:14px 32px;box-shadow:0 6px 0 rgba(0,0,0,.32),0 10px 22px rgba(0,0,0,.35),inset 0 2px 0 rgba(255,255,255,.7);cursor:pointer;touch-action:manipulation;animation:pu 1.6s ease-in-out infinite}' +
    '@keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}' +
    '.btn:active{transform:translateY(3px);box-shadow:0 2px 0 rgba(0,0,0,.32);animation:none}.btn.g{background:rgba(255,255,255,.16);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3);font-size:16px;padding:11px 22px;text-decoration:none;animation:none}' +
    '@keyframes pp{from{transform:scale(.8) translateY(20px);opacity:0}to{transform:scale(1);opacity:1}}';
  function el(t, cls, html) { var e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  GK.start = function (g) {
    G = g;
    var st = el('style', null, CSS); document.head.appendChild(st);
    document.title = g.title; document.documentElement.style.setProperty('--acc', g.color || '#ffd23a');
    document.body.style.background = g.bg || '#0d0a1f';
    if (g.three) { g.real = true; g.dither = false; var c3 = el('canvas'); c3.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block'; document.body.appendChild(c3); var T = window.THREE; GK.T = T; GK.rd = new T.WebGLRenderer({ canvas: c3, antialias: true, powerPreference: 'high-performance' }); GK.rd.shadowMap.enabled = true; GK.rd.shadowMap.type = T.PCFSoftShadowMap; GK.rd.toneMapping = T.ACESFilmicToneMapping; GK.rd.toneMappingExposure = g.exposure || 1.05; GK.rd.outputColorSpace = T.SRGBColorSpace; GK.scene = new T.Scene(); GK.cam = new T.PerspectiveCamera(g.fov || 50, 1, .1, 400); GK.proj = function (v) { var p = v.clone().project(GK.cam); return [(p.x + 1) / 2 * W, (1 - p.y) / 2 * H]; }; g.init && g.init(T, GK.scene, GK.cam, GK.rd); }
    cv = el('canvas'); cv.style.background = 'transparent'; document.body.appendChild(cv); mc = cv.getContext('2d'); cb = document.createElement('canvas'); c = cb.getContext('2d'); hookText();
    var top = el('div', 'top'); var back = el('a', 'pill', '‹ Menú'); back.href = 'index.html';
    ui.sc = el('div', 'pill sc', '0'); ui.bs = el('div', 'pill', '🏆 ' + GK.best);
    top.appendChild(back); top.appendChild(el('div', 'sp')); if (!g.noScore) { top.appendChild(ui.sc); top.appendChild(ui.bs); }
    document.body.appendChild(top);
    function resize() { dpr = Math.min(2.5, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; PX = g.real ? 1 / dpr : (g.px || GK.PX); GK.pxs = PX; cb.width = Math.ceil(W / PX); cb.height = Math.ceil(H / PX); vigC = document.createElement('canvas'); vigC.width = 160; vigC.height = Math.max(2, Math.round(160 * H / W)); var vx = vigC.getContext('2d'), vg = vx.createRadialGradient(80, vigC.height / 2, 30, 80, vigC.height / 2, Math.max(80, vigC.height * .85)); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); vx.fillStyle = vg; vx.fillRect(0, 0, 160, vigC.height); if (G.resize) G.resize(W, H); }
    window.addEventListener('resize', resize); resize(); if (g.three) { GK.rd.setPixelRatio(Math.min(dpr, 2)); GK.rd.setSize(W, H, false); GK.cam.aspect = W / H; GK.cam.updateProjectionMatrix(); window.addEventListener('resize', function () { GK.rd.setPixelRatio(Math.min(dpr, 2)); GK.rd.setSize(W, H, false); GK.cam.aspect = W / H; GK.cam.updateProjectionMatrix(); }); }
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
  function SE(t) { return G && G.real ? String(t).replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/ {2,}/g, ' ').trim() : t; }
  function card(icon, title, html, btn, fn) {
    var o = el('div', 'ov'), cd = el('div', 'card');
    if (G.real) { var im = el('img', 'cov'); im.src = 'img/' + GK.id + '.webp'; im.style.cssText = 'width:120px;height:120px;border-radius:22px;object-fit:cover;margin:0 auto 10px;display:block;box-shadow:0 6px 20px rgba(0,0,0,.5)'; cd.appendChild(im); } else cd.appendChild(el('div', 'ic', icon)); cd.appendChild(el('h1', null, SE(title))); cd.appendChild(el('p', null, SE(html))); if (G.extra) { var ex = G.extra(state); if (ex) cd.appendChild(ex); }
    var b = el('button', 'btn', btn); b.onclick = function () { o.remove(); fn(); }; cd.appendChild(b); o.appendChild(cd); document.body.appendChild(o); return o;
  }
  function menu() { state = 'menu'; card(G.icon || '🎮', G.title, SE(G.help || ''), 'JUGAR', GK.play); }
  GK.play = function () { sc = 0; parts = []; floats = []; GK.setScore(0); state = 'play'; G.reset && G.reset(); try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); GK.preload(); } catch (e) {} };
  GK.setScore = function (v) { var o = sc; sc = Math.floor(v); if (ui.sc) { ui.sc.textContent = sc; if (sc > o) { ui.sc.classList.add('bump'); clearTimeout(GK._bt); GK._bt = setTimeout(function () { ui.sc.classList.remove('bump'); }, 110); } } };
  GK.add = function (v) { GK.setScore(sc + v); };
  GK.score = function () { return sc; };
  GK.commit = function () { if (sc > GK.best) { GK.best = sc; try { localStorage.setItem(GK.id + '-best', sc); } catch (e) {} if (ui.bs) ui.bs.textContent = '🏆 ' + GK.best; } };
  GK.over = function (msg) {
    if (state !== 'play') return; state = 'over';
    var nb = sc > GK.best; if (nb) { GK.best = sc; try { localStorage.setItem(GK.id + '-best', sc); } catch (e) {} if (ui.bs) ui.bs.textContent = '🏆 ' + GK.best; }
    GK.beep(180, .4, 'sawtooth', .12, -120); GK.vib(60);
    setTimeout(function () { card(nb ? '🏆' : (G.icon || '💥'), msg || '¡Fin!', (G.noScore ? '' : 'Puntos: <b>' + sc + '</b><br>' + (nb ? '¡Nuevo récord!' : 'Récord: ' + GK.best)), 'OTRA VEZ', GK.play); }, 500);
  };
  var SB = {}, SL = {};
  GK.snd = function (name, vol, rate) {
    if (!ac || window.__misMute) return false;
    var b = SB[name];
    if (!b) { if (!SL[name]) { SL[name] = 1; try { fetch('audio/s/' + name + '.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (a) { ac.decodeAudioData(a, function (buf) { SB[name] = buf; }, function () {}); }).catch(function () {}); } catch (e) {} } return false; }
    try { var s = ac.createBufferSource(); s.buffer = b; s.playbackRate.value = rate || 1; var g = ac.createGain(); g.gain.value = vol == null ? .5 : vol; s.connect(g); g.connect(ac.destination); s.start(); return true; } catch (e) { return false; }
  };
  GK.preload = function () { ['coin', 'click', 'punch1', 'punch2', 'punch3', 'boom', 'win', 'err', 'jump', 'swoosh', 'ok', 'tick', 'ugh', 'splash', 'cash', 'glass', 'metal1', 'hitmark', 'shot1'].forEach(function (n) { GK.snd(n, 0); }); };
  function pick(f, d, type, slide) {
    var r = Math.random();
    if (type === 'sawtooth' && slide < 0) return d >= .3 ? ['boom', .5, 1] : (f <= 200 ? ['punch' + (1 + Math.floor(r * 3)), .6, .9 + r * .2] : ['ugh', .4, 1]);
    if (type === 'triangle' && slide > 0) { if (f >= 800) return d <= .12 ? ['coin', .45, 1 + r * .15] : (d >= .25 ? ['win', .45, 1] : ['ok', .45, 1]); return ['ok', .4, 1]; }
    if (type === 'triangle' && f >= 500) return ['ok', .3, .85 + f / 3500];
    if (type === 'square' && slide > 0) return ['jump', .4, 1 + r * .1];
    if (type === 'square' && d <= .07) return ['tick', .4, .85 + r * .35];
    if (type === 'sawtooth' && slide > 0) return ['swoosh', .35, 1];
    return null;
  }
  GK.beep = function (f, d, type, v, slide) {
    if (!ac || window.__misMute) return;
    var p = pick(f, d, type || 'square', slide || 0);
    if (p && GK.snd(p[0], p[1], p[2])) return;
    try { var t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 3200; o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
      g.gain.setValueAtTime(v || .08, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(fl); fl.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02); } catch (e) {}
  };
  GK.vib = function (ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  GK.shake = function (n) { shk = Math.max(shk, n); };
  GK.burst = function (x, y, n, col, sp, life) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, s = (sp || 160) * (.3 + Math.random()); parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: life || .6, m: life || .6, c: col || '#fff', r: 2 + Math.random() * 3 }); } };
  GK.float = function (x, y, txt, col, size) { floats.push({ x: x, y: y, txt: txt, c: col || '#fff', t: 1, s: size || 22 }); };
  GK.text = function (txt, x, y, size, col, align, stroke) { txt = SE(txt); if (txt === '') return; tq.push({ t: txt, x: x, y: y, s: size, c: col, a: align, k: stroke, g: c.globalAlpha }); };
  function flushText() { mc.setTransform(dpr, 0, 0, dpr, 0, 0); for (var i = 0; i < tq.length; i++) { var q = tq[i]; mc.globalAlpha = q.g; if (q.e) { mc.save(); mc.translate(q.x, q.y); if (q.r) mc.rotate(q.r); if (q.f) mc.scale(-1, 1); mc.font = q.s + 'px serif'; mc.textAlign = 'center'; mc.textBaseline = 'middle'; mc.fillText(q.t, 0, 0); mc.restore(); continue; } mc.font = '900 ' + q.s + 'px "Avenir Next","Trebuchet MS",system-ui,sans-serif'; mc.textAlign = q.a || 'center'; mc.textBaseline = 'middle'; if (q.k !== false) { mc.lineWidth = Math.max(3, q.s / 4); mc.strokeStyle = 'rgba(10,5,40,.85)'; mc.lineJoin = 'round'; mc.strokeText(q.t, q.x, q.y); } mc.fillStyle = q.c || '#fff'; mc.fillText(q.t, q.x, q.y); } mc.globalAlpha = 1; tq.length = 0; }
  GK.rr = function (x, y, w, h, r, fill, stroke, lw) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); } };
  GK.btn = function (x, y, w, h, label, col, on, size) { GK.rr(x, y + 4, w, h, 13, 'rgba(0,0,0,.4)'); GK.rr(x, y, w, h, 13, on === false ? '#4a4660' : (col || '#ffd23a')); if (on !== false) GK.shine(c, x, y, w, h, 13); GK.text(label, x + w / 2, y + h / 2, size || 16, on === false ? '#999' : '#1a1530', 'center', false); };
  GK.hit = function (px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; };


  // ---- pixel art ----
  GK.PAL = { k: '#16121f', w: '#fff6e8', W: '#d0cadb', g: '#7bd35a', G: '#2f8a3c', d: '#1d5a2c', r: '#ff4a5a', R: '#b02040', o: '#ff9a3a', O: '#c4601c', y: '#ffe14a', Y: '#d4a020', b: '#4a9aff', B: '#2a58c0', n: '#9a6a3a', N: '#5a3a1c', s: '#ffcfa0', S: '#d49a6a', p: '#ff7ac8', P: '#b04a90', v: '#9a6aff', V: '#5a3aa8', c: '#5ae6e0', C: '#2a9aa8', e: '#a8acb8', E: '#6a6e80', l: '#c8f0ff', m: '#e8e0f4', t: '#e8c890', T: '#a88850', x: '#3a3a4a', z: '#8a1a1a' };
  function h2rgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function rgb2h(r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  GK.shade = function (col, k) { var r = h2rgb(col); return k > 0 ? rgb2h(r.map(function (v) { return v + (255 - v) * k; })) : rgb2h(r.map(function (v) { return v * (1 + k); })); };
  function finish(src, opt) {
    opt = opt || {}; var w = src.width, h = src.height, id = src.getContext('2d').getImageData(0, 0, w, h), d = id.data;
    var out = document.createElement('canvas'), pd = opt.out === false ? 0 : 1; out.width = w + pd * 2; out.height = h + pd * 2; var o = out.getContext('2d'), od = o.createImageData(out.width, out.height), q = od.data, ow = out.width;
    function A(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]; }
    var oc = h2rgb(opt.oc || '#16121f');
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var i = (y * w + x) * 4; if (d[i + 3] < 128) continue; var r = d[i], g = d[i + 1], b = d[i + 2], k = 0;
      if (opt.sh !== false) { if (!A(x, y - 1) || !A(x - 1, y)) k = .32; if (!A(x, y + 1) || !A(x + 1, y)) k = -.28; if ((!A(x, y - 1) || !A(x - 1, y)) && (!A(x, y + 1) || !A(x + 1, y))) k = 0; }
      if (k > 0) { r += (255 - r) * k; g += (255 - g) * k; b += (255 - b) * k; } else if (k < 0) { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
      var j = ((y + pd) * ow + x + pd) * 4; q[j] = r; q[j + 1] = g; q[j + 2] = b; q[j + 3] = 255; }
    if (pd) for (y = -1; y <= h; y++) for (x = -1; x <= w; x++) { if (A(x, y)) continue; if (A(x - 1, y) || A(x + 1, y) || A(x, y - 1) || A(x, y + 1)) { var j2 = ((y + pd) * ow + x + pd) * 4; q[j2] = oc[0]; q[j2 + 1] = oc[1]; q[j2 + 2] = oc[2]; q[j2 + 3] = 255; } }
    o.putImageData(od, 0, 0); return out;
  }
  GK.mk = function (rows, pal, opt) { var h = rows.length, w = 0; rows.forEach(function (r) { w = Math.max(w, r.length); }); var cn = document.createElement('canvas'); cn.width = w; cn.height = h; var x = cn.getContext('2d'); for (var j = 0; j < h; j++) for (var i = 0; i < rows[j].length; i++) { var ch = rows[j][i]; if (ch === '.' || ch === ' ') continue; var col = (pal && pal[ch]) || GK.PAL[ch]; if (!col) continue; x.fillStyle = col; x.fillRect(i, j, 1, 1); } return finish(cn, opt); };
  GK.mkd = function (w, h, fn, opt) { var cn = document.createElement('canvas'); cn.width = w; cn.height = h; var x = cn.getContext('2d'); x.imageSmoothingEnabled = false; fn(x, w, h); return finish(cn, opt); };
  GK.flipX = function (s) { var cn = document.createElement('canvas'); cn.width = s.width; cn.height = s.height; var x = cn.getContext('2d'); x.translate(s.width, 0); x.scale(-1, 1); x.drawImage(s, 0, 0); return cn; };
  GK.spr = function (cc, s, x, y, o) { o = o || {}; var sc = (o.s || 1) * PX, w = s.width * sc, h = s.height * sc, ox = o.ox == null ? .5 : o.ox, oy = o.oy == null ? 1 : o.oy; cc.save(); cc.imageSmoothingEnabled = false; if (o.a != null) cc.globalAlpha *= o.a; cc.translate(x, y); if (o.r) cc.rotate(o.r); if (o.f) cc.scale(-1, 1); if (o.sx) cc.scale(o.sx, o.sy || o.sx); cc.drawImage(s, -w * ox, -h * oy, w, h); cc.restore(); };
  GK.tileFill = function (cc, t, x, y, w, h, sc) { var tw = t.width * PX * (sc || 1), th = t.height * PX * (sc || 1); cc.save(); cc.beginPath(); cc.rect(x, y, w, h); cc.clip(); cc.imageSmoothingEnabled = false; for (var j = y; j < y + h; j += th) for (var i = x; i < x + w; i += tw) cc.drawImage(t, Math.round(i), Math.round(j), tw, th); cc.restore(); };
  // formas por pixel: elipse, rect, punto
  GK.px = { e: function (x, cx, cy, rx, ry, col) { x.fillStyle = col; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, 7); x.fill(); }, r: function (x, a, b, w, h, col) { x.fillStyle = col; x.fillRect(a, b, w, h); }, p: function (x, a, b, col) { x.fillStyle = col; x.fillRect(a, b, 1, 1); }, t: function (x, pts, col) { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); x.closePath(); x.fill(); }, l: function (x, a, b, c2, d, col, w) { x.strokeStyle = col; x.lineWidth = w || 1; x.lineCap = 'butt'; x.beginPath(); x.moveTo(a, b); x.lineTo(c2, d); x.stroke(); } };

  var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function dither() { var w = cb.width, h = cb.height, id = c.getImageData(0, 0, w, h), d = id.data, L = 7, k = 255 / L; for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var i = (y * w + x) * 4, t = BAY[(y & 3) * 4 + (x & 3)] / 16 - .47; d[i] = Math.round(d[i] / k + t * .6) * k; d[i + 1] = Math.round(d[i + 1] / k + t * .6) * k; d[i + 2] = Math.round(d[i + 2] / k + t * .6) * k; } c.putImageData(id, 0, 0); }
  // texturas de pixel art (16x16, se repiten)
  var seed = 7; function rn() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  function tex(base, fn, n) { n = n || 16; return GK.mkd(n, n, function (x) { x.fillStyle = base; x.fillRect(0, 0, n, n); fn(x, n); }, { out: false, sh: false }); }
  function speck(x, n, cols, cnt) { for (var i = 0; i < cnt; i++) { x.fillStyle = cols[(rn() * cols.length) | 0]; x.fillRect((rn() * n) | 0, (rn() * n) | 0, 1, 1); } }
  var TX = {};
  GK.tex = function (name, a, b) { var k = name + (a || '') + (b || ''); if (TX[k]) return TX[k]; seed = 11 + k.length * 7; var P = GK.px, r;
    if (name === 'grass') r = tex(a || '#3f9a3c', function (x, n) { speck(x, n, [GK.shade(a || '#3f9a3c', -.18), GK.shade(a || '#3f9a3c', .18), GK.shade(a || '#3f9a3c', -.08)], 46); for (var i = 0; i < 6; i++) { var gx = (rn() * n) | 0, gy = 1 + ((rn() * (n - 2)) | 0); x.fillStyle = GK.shade(a || '#3f9a3c', .3); x.fillRect(gx, gy, 1, 2); } });
    else if (name === 'dirt') r = tex(a || '#8a5a32', function (x, n) { speck(x, n, ['#6a4020', '#a87040', '#7a4c28', '#5a3418'], 50); for (var i = 0; i < 3; i++) { x.fillStyle = '#b0a090'; x.fillRect((rn() * 14) | 0, (rn() * 14) | 0, 2, 1); } });
    else if (name === 'sand') r = tex(a || '#e8c878', function (x, n) { speck(x, n, ['#d4b060', '#f4dc98', '#c8a050'], 40); x.fillStyle = 'rgba(160,110,40,.35)'; for (var i = 0; i < 3; i++) x.fillRect(((i * 5 + 1) % 14), 3 + i * 5, 6, 1); });
    else if (name === 'wood') { var wc = a || '#9a6234', wd = GK.shade(wc, -.22), wl = GK.shade(wc, .16); r = GK.mkd(32, 16, function (x) { x.fillStyle = wc; x.fillRect(0, 0, 32, 16); for (var j = 0; j < 2; j++) { var y0 = j * 8; x.fillStyle = j ? GK.shade(wc, .07) : GK.shade(wc, -.05); x.fillRect(0, y0, 32, 8); x.fillStyle = wl; x.fillRect(0, y0, 32, 1); x.fillStyle = wd; x.fillRect(0, y0 + 7, 32, 1); x.fillRect(j ? 26 : 10, y0, 1, 8); for (var g = 0; g < 5; g++) { x.fillStyle = GK.shade(wc, rn() > .5 ? -.12 : .1); x.fillRect((rn() * 28) | 0, y0 + 2 + ((rn() * 4) | 0), 3 + ((rn() * 6) | 0), 1); } if (j === 0) { x.fillStyle = wd; x.fillRect(20, y0 + 3, 2, 2); } } }, { out: false, sh: false }); }
    else if (name === 'tile') r = tex(a || '#f4eadc', function (x, n) { var c1 = a || '#f4eadc', c2 = b || '#c8442c'; x.fillStyle = c1; x.fillRect(0, 0, n, n); x.fillStyle = c2; x.fillRect(0, 0, n / 2, n / 2); x.fillRect(n / 2, n / 2, n / 2, n / 2); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, n / 2 - 1, n, 1); x.fillRect(n / 2 - 1, 0, 1, n); x.fillRect(0, n - 1, n, 1); x.fillRect(n - 1, 0, 1, n); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(1, 1, 3, 1); x.fillRect(1, 1, 1, 3); x.fillRect(9, 9, 3, 1); x.fillRect(9, 9, 1, 3); });
    else if (name === 'stone') r = tex(a || '#6a6a78', function (x, n) { x.fillStyle = '#3a3a48'; x.fillRect(0, 7, n, 1); x.fillRect(0, 15, n, 1); x.fillRect(5, 0, 1, 7); x.fillRect(11, 8, 1, 7); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 0, n, 1); x.fillRect(0, 8, n, 1); speck(x, n, ['#585866', '#7c7c8a'], 26); });
    else if (name === 'brick') r = tex(a || '#9a4a3a', function (x, n) { x.fillStyle = '#3a1c18'; x.fillRect(0, 3, n, 1); x.fillRect(0, 7, n, 1); x.fillRect(0, 11, n, 1); x.fillRect(0, 15, n, 1); for (var j = 0; j < 4; j++) { var o = (j & 1) ? 2 : 6; x.fillRect(o, j * 4, 1, 4); x.fillRect(o + 8, j * 4, 1, 4); } x.fillStyle = 'rgba(255,255,255,.14)'; for (j = 0; j < 4; j++) x.fillRect(0, j * 4, n, 1); speck(x, n, ['#b05a48', '#7a3a2c'], 22); });
    else if (name === 'carpet') r = tex(a || '#a02838', function (x, n) { x.fillStyle = GK.shade(a || '#a02838', -.25); for (var i = 0; i < n; i += 4) for (var j = 0; j < n; j += 4) { x.fillRect(i + 1, j + 1, 2, 2); } x.fillStyle = GK.shade(a || '#a02838', .2); for (i = 0; i < n; i += 4) for (j = 0; j < n; j += 4) x.fillRect(i + 2, j + 2, 1, 1); });
    else if (name === 'metal') r = tex(a || '#7a8294', function (x, n) { x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(0, 0, n, 1); x.fillRect(0, 0, 1, n); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(0, n - 1, n, 1); x.fillRect(n - 1, 0, 1, n); x.fillStyle = '#4a5060'; x.fillRect(2, 2, 2, 2); x.fillRect(12, 2, 2, 2); x.fillRect(2, 12, 2, 2); x.fillRect(12, 12, 2, 2); speck(x, n, ['#8a92a4', '#6a7284'], 18); });
    else if (name === 'water') r = tex(a || '#2a78c8', function (x, n) { x.fillStyle = GK.shade(a || '#2a78c8', .22); x.fillRect(1, 3, 5, 1); x.fillRect(9, 9, 5, 1); x.fillRect(3, 13, 3, 1); x.fillStyle = GK.shade(a || '#2a78c8', -.2); x.fillRect(8, 2, 4, 1); x.fillRect(2, 8, 4, 1); x.fillRect(10, 14, 4, 1); });
    else if (name === 'lava') r = tex('#c22a0a', function (x, n) { speck(x, n, ['#ff7a1a', '#8a1404', '#ff9a30'], 40); x.fillStyle = '#ffb040'; x.fillRect(2, 4, 4, 1); x.fillRect(10, 11, 4, 1); x.fillRect(5, 12, 2, 1); x.fillStyle = '#7a1000'; x.fillRect(9, 3, 4, 1); x.fillRect(1, 9, 3, 1); });
    else if (name === 'floor') r = tex(a || '#3a3452', function (x, n) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, n - 1, n, 1); x.fillRect(n - 1, 0, 1, n); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(0, 0, n, 1); x.fillRect(0, 0, 1, n); speck(x, n, ['rgba(255,255,255,.06)', 'rgba(0,0,0,.14)'], 22); });
    else r = tex(a || '#777', function () {});
    return TX[k] = r; };
  var IMC = {};
  GK.R = function (n) { if (IMC[n]) return IMC[n]; var i = new Image(); i.src = 'img/r/' + n + '.webp'; return IMC[n] = i; };
  GK.im = function (cc, i, x, y, w, o) { if (!i || !i.complete || !i.naturalWidth) return; o = o || {}; var h = o.h || w * i.naturalHeight / i.naturalWidth, ox = o.ox == null ? .5 : o.ox, oy = o.oy == null ? 1 : o.oy; cc.save(); cc.imageSmoothingEnabled = true; cc.imageSmoothingQuality = 'high'; if (o.a != null) cc.globalAlpha *= o.a; cc.translate(x, y); if (o.r) cc.rotate(o.r); if (o.f) cc.scale(-1, 1); cc.drawImage(i, -w * ox, -h * oy, w, h); cc.restore(); };
  GK.cover = function (cc, i, x, y, w, h) { if (!i || !i.complete || !i.naturalWidth) return; var r = Math.max(w / i.naturalWidth, h / i.naturalHeight), sw = w / r, sh = h / r; cc.save(); cc.imageSmoothingQuality = 'high'; cc.drawImage(i, (i.naturalWidth - sw) / 2, (i.naturalHeight - sh) / 2, sw, sh, x, y, w, h); cc.restore(); };
  GK.sprW = function (s, k) { return s.width * PX * (k || 1); };

  // ---- ayudantes visuales ----
  GK.sky = function (c, W, H, stops, y0, y1) { var g = c.createLinearGradient(0, y0 || 0, 0, y1 || H); stops.forEach(function (s, i) { g.addColorStop(i / (stops.length - 1), s); }); c.fillStyle = g; c.fillRect(0, y0 || 0, W, (y1 || H) - (y0 || 0)); };
  GK.stars = function (c, W, H, t, n, hmax) { for (var i = 0; i < n; i++) { var x = (i * 97.3) % W, y = (i * 53.7) % (hmax || H), a = .35 + .65 * Math.abs(Math.sin(t * (.6 + (i % 5) * .3) + i)); c.globalAlpha = a; c.fillStyle = '#fff'; var r = 1 + (i % 3 === 0 ? 1 : 0); c.fillRect(x, y, r, r); } c.globalAlpha = 1; };
  GK.cloud = function (c, x, y, s, a) { c.save(); c.globalAlpha = a == null ? .85 : a; c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 18 * s, 0, 7); c.arc(x + 20 * s, y - 8 * s, 22 * s, 0, 7); c.arc(x + 44 * s, y, 18 * s, 0, 7); c.arc(x + 22 * s, y + 6 * s, 20 * s, 0, 7); c.fill(); c.restore(); };
  GK.hills = function (c, W, y, amp, col, off, step) { step = step || 40; c.fillStyle = col; c.beginPath(); c.moveTo(0, y + amp * 2 + 800); for (var x = -step; x <= W + step; x += step) { var h = Math.sin((x + off) * .012) * amp + Math.sin((x + off) * .031) * amp * .45; c.lineTo(x, y + h); } c.lineTo(W + step, y + amp * 2 + 800); c.fill(); };
  GK.shadow = function (c, x, y, rx, ry, a) { c.fillStyle = 'rgba(0,0,0,' + (a == null ? .3 : a) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };
  GK.glow = function (c, x, y, r, col, a) { c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a == null ? .6 : a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
  GK.checker = function (c, x, y, w, h, s, c1, c2) { for (var j = 0; j < h; j += s) for (var i = 0; i < w; i += s) { c.fillStyle = ((i / s + j / s) & 1) ? c1 : c2; c.fillRect(x + i, y + j, s, s); } };
  GK.planks = function (c, x, y, w, h, ph, col, line) { c.fillStyle = col; c.fillRect(x, y, w, h); c.strokeStyle = line || 'rgba(0,0,0,.22)'; c.lineWidth = 2; for (var j = 0; j < h; j += ph) { c.beginPath(); c.moveTo(x, y + j); c.lineTo(x + w, y + j); c.stroke(); for (var i = ((j / ph) % 2) * ph * 2; i < w; i += ph * 4) { c.beginPath(); c.moveTo(x + i, y + j); c.lineTo(x + i, y + j + ph); c.stroke(); } } };
  GK.shine = function (c, x, y, w, h, r) { var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(0,0,0,.2)'); GK.rr(x, y, w, h, r, g); };
  GK.ground = function (c, W, y, H, top, bot, edge) { GK.sky(c, W, H, [top, bot], y, H); c.fillStyle = edge || 'rgba(255,255,255,.25)'; c.fillRect(0, y, W, 3); };
  var pec = {};
  function pemoji(e, n) {
    var key = e + '|' + n; if (pec[key]) return pec[key];
    var B = n * 4, a = document.createElement('canvas'); a.width = a.height = B; var x = a.getContext('2d'); x.font = (B * .82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, B / 2, B / 2 + B * .05);
    var m = document.createElement('canvas'); m.width = m.height = n; var y = m.getContext('2d'); y.imageSmoothingEnabled = true; y.imageSmoothingQuality = 'high'; y.drawImage(a, 0, 0, n, n);
    var id = y.getImageData(0, 0, n, n), d = id.data, L = 6;
    for (var i = 0; i < d.length; i += 4) { if (d[i + 3] < 110) { d[i + 3] = 0; continue; } var al = d[i + 3] / 255; for (var k = 0; k < 3; k++) { var v = d[i + k] / al; v = (v - 128) * 1.12 + 128; d[i + k] = Math.round(Math.max(0, Math.min(255, v)) / 255 * L) / L * 255; } d[i + 3] = 255; }
    y.putImageData(id, 0, 0); return pec[key] = finish(m, { oc: '#120c1c' });
  }
  GK.emoji = function (cc, e, x, y, size, rot, flip) { var n = Math.max(12, Math.round(size / PX)), s = pemoji(e, n); GK.spr(cc, s, x, y, { s: size / (n * PX), oy: .5, r: rot, f: flip }); };
  var EMO = /\p{Extended_Pictographic}/u, ALN = /[A-Za-z0-9]/;
  function hookText() { var o = c.fillText; c.fillText = function (t, x, y) { if (typeof t === 'string' && EMO.test(t) && !ALN.test(t)) { if (G && G.real) return; var m = /(\d+(?:\.\d+)?)px/.exec(c.font); GK.emoji(c, t, x, y, m ? +m[1] * 1.05 : 24); return; } return o.apply(c, arguments); }; }
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(.033, (now - last) / 1000) : 0; last = now;
    c.setTransform(1 / PX, 0, 0, 1 / PX, 0, 0); c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H);
    c.save(); if (shk > .2) { c.translate((Math.random() - .5) * shk, (Math.random() - .5) * shk); shk *= .86; } else shk = 0;
    if (state === 'play') G.update && G.update(dt);
    if (G.three) { G.frame && G.frame(dt); GK.rd.render(GK.scene, GK.cam); }
    G.draw && G.draw(c, W, H);
    c.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= .99; var k = p.t / p.m; c.globalAlpha = Math.max(0, k) * .9; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, Math.max(.6, p.r * (.4 + k * .8)), 0, 6.283); c.fill(); c.globalAlpha = Math.max(0, k) * .18; c.beginPath(); c.arc(p.x, p.y, p.r * 2.6 * (.4 + k), 0, 6.283); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    for (i = floats.length - 1; i >= 0; i--) { var f = floats[i]; f.t -= dt * 1.1; if (f.t <= 0) { floats.splice(i, 1); continue; } c.globalAlpha = Math.min(1, f.t * 2); GK.text(f.txt, f.x, f.y - (1 - f.t) * 40, f.s, f.c); }
    c.globalAlpha = 1; c.restore();
    if (!(G && (G.dither === false || G.real))) dither();
    mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, cv.width, cv.height); mc.imageSmoothingEnabled = !!G.real; mc.drawImage(cb, 0, 0, cb.width, cb.height, 0, 0, cb.width * PX * dpr, cb.height * PX * dpr);
    mc.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (G.vig !== false && vigC) mc.drawImage(vigC, 0, 0, W, H);
    flushText();
  }
})();
