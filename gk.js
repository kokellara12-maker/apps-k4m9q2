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
  var vigC, G, cv, c, W = 0, H = 0, dpr = 1, state = 'menu', last = 0, sc = 0, shk = 0, parts = [], floats = [], ac = null, ui = {};
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
    cv = el('canvas'); document.body.appendChild(cv); c = cv.getContext('2d');
    var top = el('div', 'top'); var back = el('a', 'pill', '‹ Menú'); back.href = 'index.html';
    ui.sc = el('div', 'pill sc', '0'); ui.bs = el('div', 'pill', '🏆 ' + GK.best);
    top.appendChild(back); top.appendChild(el('div', 'sp')); if (!g.noScore) { top.appendChild(ui.sc); top.appendChild(ui.bs); }
    document.body.appendChild(top);
    function resize() { dpr = Math.min(2.5, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; vigC = document.createElement('canvas'); vigC.width = 160; vigC.height = Math.max(2, Math.round(160 * H / W)); var vx = vigC.getContext('2d'), vg = vx.createRadialGradient(80, vigC.height / 2, 30, 80, vigC.height / 2, Math.max(80, vigC.height * .85)); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); vx.fillStyle = vg; vx.fillRect(0, 0, 160, vigC.height); if (G.resize) G.resize(W, H); }
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
  GK.text = function (txt, x, y, size, col, align, stroke) { c.font = '900 ' + size + 'px "Avenir Next","Trebuchet MS",system-ui,sans-serif'; c.textAlign = align || 'center'; c.textBaseline = 'middle'; if (stroke !== false) { c.lineWidth = Math.max(3, size / 5); c.strokeStyle = 'rgba(10,5,40,.8)'; c.lineJoin = 'round'; c.strokeText(txt, x, y); } c.fillStyle = col || '#fff'; c.fillText(txt, x, y); };
  GK.rr = function (x, y, w, h, r, fill, stroke, lw) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw || 2; c.strokeStyle = stroke; c.stroke(); } };
  GK.btn = function (x, y, w, h, label, col, on, size) { GK.rr(x, y + 4, w, h, 13, 'rgba(0,0,0,.4)'); GK.rr(x, y, w, h, 13, on === false ? '#4a4660' : (col || '#ffd23a')); if (on !== false) GK.shine(c, x, y, w, h, 13); GK.text(label, x + w / 2, y + h / 2, size || 16, on === false ? '#999' : '#1a1530', 'center', false); };
  GK.hit = function (px, py, x, y, w, h) { return px >= x && px <= x + w && py >= y && py <= y + h; };

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
  GK.emoji = function (c, e, x, y, size, rot, flip, sh) { c.save(); c.translate(x, y); if (rot) c.rotate(rot); if (flip) c.scale(-1, 1); c.font = size + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; if (sh !== false) { c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = size * .22; c.shadowOffsetY = size * .08; } c.fillText(e, 0, 0); c.restore(); };
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(.033, (now - last) / 1000) : 0; last = now;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.save(); if (shk > .2) { c.translate((Math.random() - .5) * shk, (Math.random() - .5) * shk); shk *= .86; } else shk = 0;
    if (state === 'play') G.update && G.update(dt);
    G.draw && G.draw(c, W, H);
    c.globalCompositeOperation = 'lighter';
    for (var i = parts.length - 1; i >= 0; i--) { var p = parts[i]; p.t -= dt; if (p.t <= 0) { parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.vx *= .99; var k = p.t / p.m; c.globalAlpha = Math.max(0, k) * .9; c.fillStyle = p.c; c.beginPath(); c.arc(p.x, p.y, Math.max(.6, p.r * (.4 + k * .8)), 0, 6.283); c.fill(); c.globalAlpha = Math.max(0, k) * .18; c.beginPath(); c.arc(p.x, p.y, p.r * 2.6 * (.4 + k), 0, 6.283); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    for (i = floats.length - 1; i >= 0; i--) { var f = floats[i]; f.t -= dt * 1.1; if (f.t <= 0) { floats.splice(i, 1); continue; } c.globalAlpha = Math.min(1, f.t * 2); GK.text(f.txt, f.x, f.y - (1 - f.t) * 40, f.s, f.c); }
    c.globalAlpha = 1; c.restore();
    if (G.vig !== false && vigC) c.drawImage(vigC, 0, 0, W, H);
  }
})();
