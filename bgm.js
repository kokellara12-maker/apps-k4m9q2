/* Música de fondo + pulido de efectos para los juegos de "Mis Apps".
   Música: pistas CC0 (Komiku, FreePD). Se carga una vez y queda guardada para jugar sin internet. */
(function () {
  'use strict';
  var W = window, D = document;
  var SET = { master: 1, music: 1, fx: 1, eng: 1 }, CH = [];
  try { var sv = JSON.parse(localStorage.getItem('mis_snd') || 'null'); if (sv) for (var k0 in SET) if (typeof sv[k0] === 'number') SET[k0] = Math.max(0, Math.min(1, sv[k0])); } catch (e) {}
  var saveSet = function () { try { localStorage.setItem('mis_snd', JSON.stringify(SET)); } catch (e) {} };
  var applyVol = function () { CH.forEach(function (c) { c.inp.gain.value = SET.fx; c.out.gain.value = 2.1 * SET.master; }); if (W.__engApply) W.__engApply(); };

  // ---- 1) Pulido de los efectos sintetizados: filtro suave + compresor + un pelín de reverb ----
  try {
    var AN = W.AudioNode && W.AudioNode.prototype;
    if (AN && !AN.__mis) {
      var oc = AN.connect, chains = new WeakMap();
      var chain = function (ctx) {
        var c = chains.get(ctx);
        if (c) return c;
        var inp = ctx.createGain(), lp = ctx.createBiquadFilter(), comp = ctx.createDynamicsCompressor(),
          wet = ctx.createGain(), conv = ctx.createConvolver(), out = ctx.createGain();
        lp.type = 'lowpass'; lp.frequency.value = 9500; lp.Q.value = 0.4;
        comp.threshold.value = -20; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
        wet.gain.value = 0.13; out.gain.value = 2.1 * SET.master; inp.gain.value = SET.fx;
        var len = Math.floor(ctx.sampleRate * 0.55), buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
        conv.buffer = buf;
        oc.call(inp, lp); oc.call(lp, comp); oc.call(comp, out);
        oc.call(lp, conv); oc.call(conv, wet); oc.call(wet, out);
        oc.call(out, ctx.destination);
        c = { inp: inp, out: out }; chains.set(ctx, c); CH.push(c); return c;
      };
      AN.connect = function (dst) {
        try {
          if (dst && dst.context && dst === dst.context.destination) {
            oc.call(this, chain(dst.context).inp);
            return dst;
          }
        } catch (e) {}
        return oc.apply(this, arguments);
      };
      AN.__mis = 1;
      W.__chain = chain;
    }
  } catch (e) {}

  // ---- 1b) Efectos reales: cada "bip" sintetizado se cambia por una grabación parecida (CC0) ----
  try {
    var BANK = {}, bankLoad = 0, bbase = ((D.currentScript && D.currentScript.src) || '').replace(/[^\/]*$/, '') + 'audio/s/';
    var NAMES = ['shot1','shot2','shot3','shot4','boom','punch1','punch2','punch3','metal1','metal2','metal3','metal4','soft1','glass','step1','step2','step3','step4','hitmark','dry','reload','coin','cash','coins','click','ok','err','tick','swoosh','win','ugh','camera','splash'];
    var loadBank = function (ctx) {
      if (bankLoad) return; bankLoad = 1;
      NAMES.forEach(function (n) {
        fetch(bbase + n + '.mp3').then(function (r) { return r.arrayBuffer(); }).then(function (ab) {
          return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); });
        }).then(function (b) { BANK[n] = b; }).catch(function () {});
      });
    };
    var ready = function () { return !!BANK.click && !!BANK.boom && !!BANK.coin; };
    var AP = W.AudioParam && W.AudioParam.prototype;
    ['setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime'].forEach(function (fn) {
      var o = AP[fn]; if (!o) return;
      AP[fn] = function (v) {
        var m = this.__m;
        if (m) { if (m.first == null) m.first = v; m.last = v; if (v > m.max) m.max = v; }
        return o.apply(this, arguments);
      };
    });
    var vd = Object.getOwnPropertyDescriptor(AP, 'value');
    if (vd && vd.set) Object.defineProperty(AP, 'value', { get: vd.get, set: function (v) { var m = this.__m; if (m) { if (m.first == null) m.first = v; m.last = v; if (v > m.max) m.max = v; } vd.set.call(this, v); }, configurable: true });
    var cc = AN.connect; // ya parcheado arriba
    var oc2 = AN.connect;
    AN.connect = function (dst) {
      if (this.__io) { (this.__conn = this.__conn || []).push(arguments); }
      this.__dst = dst;
      return oc2.apply(this, arguments);
    };
    var odis = AN.disconnect;
    var CTXS = [];
    [W.AudioContext && W.AudioContext.prototype, W.webkitAudioContext && W.webkitAudioContext.prototype, W.BaseAudioContext && W.BaseAudioContext.prototype].forEach(function (P) {
      if (!P || CTXS.indexOf(P) >= 0) return; CTXS.push(P);
      if (P.hasOwnProperty('createOscillator')) { var a = P.createOscillator; P.createOscillator = function () { var o = a.apply(this, arguments); o.__io = 1; o.__kind = 'osc'; o.frequency.__m = {max: 0}; loadBank(this); return o; }; }
      if (P.hasOwnProperty('createBufferSource')) { var b = P.createBufferSource; P.createBufferSource = function () { var o = b.apply(this, arguments); o.__io = 1; o.__kind = 'buf'; loadBank(this); return o; }; }
      if (P.hasOwnProperty('createGain')) { var g = P.createGain; P.createGain = function () { var o = g.apply(this, arguments); o.gain.__m = {max: 0}; loadBank(this); return o; }; }
      if (P.hasOwnProperty('createBiquadFilter')) { var f = P.createBiquadFilter; P.createBiquadFilter = function () { var o = f.apply(this, arguments); o.frequency.__m = {max: 0}; return o; }; }
    });
    var isNoise = function (buf) {
      if (!buf) return false; if (buf.__noise != null) return buf.__noise;
      var d = buf.getChannelData(0), n = Math.min(d.length, 600), c = 0;
      for (var i = 1; i < n; i++) if ((d[i] >= 0) !== (d[i - 1] >= 0)) c++;
      return (buf.__noise = (c / n > 0.3 && d.length > 2000));
    };
    var batch = [], pending = 0, lastPlay = {}, cues = 0;
    var chainInfo = function (node) {
      var ff = null, pk = null, n = node, i = 0;
      while (n && i < 4) {
        var d = n.__dst; if (!d) break;
        if (d.frequency && d.frequency.__m && d.type && ff == null) { var fm = d.frequency.__m; ff = fm.first != null ? fm.first : d.frequency.value; }
        if (d.gain && d.gain.__m && d.gain.__m.max > 0 && pk == null) pk = d.gain.__m.max;
        n = d; i++;
      }
      return { ff: ff, pk: pk };
    };
    var flush = function () {
      pending = 0; var evs = batch; batch = [];
      if (!evs.length) return;
      var ctx = evs[0].n.context, now = ctx.currentTime, use = [];
      evs.forEach(function (e) {
        var dur = e.stop != null ? e.stop - e.t : e.dur;
        if (e.n.loop || dur == null || dur > 1.6 || dur <= 0 || e.t - now > 3) { // no es un efecto corto: se queda como estaba
          if (e.n.__conn) e.n.__conn.forEach(function (a) { try { oc2.apply(e.n, a); } catch (x) {} });
          return;
        }
        e.dur2 = dur; use.push(e);
      });
      if (!use.length) return;
      var t0 = Math.max(now, Math.min.apply(null, use.map(function (e) { return e.t; })));
      var noises = use.filter(function (e) { return e.n.__kind === 'buf'; }), oscs = use.filter(function (e) { return e.n.__kind === 'osc'; });
      var pk = 0, pc = 0; use.forEach(function (e) { var ci = chainInfo(e.n); if (ci.pk) { pk += ci.pk; pc++; } e.ff = ci.ff; });
      var vol = Math.max(0.22, Math.min(0.85, (pc ? pk / pc : 0.12) * 5.5));
      var pick = null, rate = 1, r = function (n) { return 1 + Math.floor(Math.random() * n); };
      if (noises.length) {
        var nz = noises.reduce(function (a, b) { return b.dur2 > a.dur2 ? b : a; }), ff = nz.ff == null ? 1500 : nz.ff;
        if (nz.dur2 >= 0.4) { pick = 'boom'; rate = ff < 700 ? 0.8 : 1; }
        else if (nz.dur2 >= 0.16) { pick = ff >= 2200 ? 'shot' + r(4) : (ff >= 1100 ? 'punch' + r(3) : 'metal' + r(4)); }
        else { pick = ff >= 2500 ? 'tick' : 'step' + r(4); if (pick.indexOf('step') === 0) vol *= 0.9; }
      } else {
        oscs.sort(function (a, b) { return a.t - b.t; });
        var starts = []; oscs.forEach(function (e) { if (!starts.length || e.t - starts[starts.length - 1].t > 0.015) starts.push(e); });
        var fr = function (e) { var m = e.n.frequency.__m; return (m.first != null ? m.first : e.n.frequency.value) || 440; };
        var up = 0, down = 0; for (var i = 1; i < starts.length; i++) { var d = fr(starts[i]) - fr(starts[i - 1]); if (d > 0) up++; else if (d < 0) down++; }
        var o = starts[0], f0 = fr(o), m = o.n.frequency.__m, f1 = m.last != null ? m.last : f0;
        if (starts.length >= 3) { pick = up >= down ? 'win' : 'ugh'; vol = Math.min(vol, 0.7); }
        else if (starts.length === 2) { pick = up >= down ? 'coin' : 'err'; }
        else if (f1 > f0 * 1.25) { pick = o.dur2 > 0.12 ? 'swoosh' : 'tick'; vol *= 0.8; }
        else if (f1 < f0 * 0.8) { pick = f0 < 350 ? 'punch' + r(3) : (f0 < 800 ? 'soft1' : 'err'); }
        else if (f0 > 900 && o.dur2 < 0.12) { pick = 'tick'; }
        else if (o.dur2 < 0.2) { pick = f0 < 300 ? 'soft1' : 'click'; }
        else { pick = f0 < 300 ? 'punch' + r(3) : 'ok'; }
      }
      var b = BANK[pick]; if (!b) { use.forEach(function (e) { if (e.n.__conn) e.n.__conn.forEach(function (a) { try { oc2.apply(e.n, a); } catch (x) {} }); }); return; }
      var key = pick.replace(/\d$/, ''), tm = performance.now();
      if (lastPlay[key] && tm - lastPlay[key] < 40) return;
      lastPlay[key] = tm;
      var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = b; s.playbackRate.value = rate * (0.96 + Math.random() * 0.08); g.gain.value = vol;
      s.connect(g); g.connect(ctx.destination); s.start(t0); cues++;
    };
    var wrap = function (P) {
      if (!P) return; var os = P.start, ot = P.stop;
      P.start = function (t) {
        if (!this.__io || this.loop || W.__noSfx || !ready()) return os.apply(this, arguments);
        if (this.__kind === 'buf' && !isNoise(this.buffer)) return os.apply(this, arguments);
        var ev = { n: this, t: (t && t > 0) ? t : this.context.currentTime, dur: this.__kind === 'buf' && arguments[2] != null ? arguments[2] : null };
        this.__ev = ev; batch.push(ev);
        try { odis.call(this); } catch (x) {}
        if (!pending) { pending = 1; Promise.resolve().then(flush); }
        return os.apply(this, arguments);
      };
      P.stop = function (t) { if (this.__ev) this.__ev.stop = t; return ot.apply(this, arguments); };
    };
    wrap(W.OscillatorNode && W.OscillatorNode.prototype); wrap(W.AudioBufferSourceNode && W.AudioBufferSourceNode.prototype);
    W.__sfx = { get cues() { return cues; }, get ready() { return ready(); } };
  } catch (e) { try { console.warn('sfx shim', e); } catch (x) {} }

  // ---- 2) Motores reales (grabaciones de coche por vueltas del motor) ----
  var scr = D.currentScript, base = ((scr && scr.src) || '').replace(/[^\/]*$/, '');
  var RP = [1169, 2080, 3169, 4403, 5768, 7347, 8752], EB = {}, ES = new WeakMap(), ELOAD = 0, ESTATES = [];
  var engLoad = function (ctx) {
    if (ELOAD) return; ELOAD = 1;
    RP.forEach(function (r) {
      fetch(base + 'audio/e/' + r + '.wav').then(function (x) { return x.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (ok, no) { ctx.decodeAudioData(ab, ok, no); }); })
        .then(function (b) { EB[r] = b; }).catch(function () {});
    });
  };
  W.__eng = {
    // ctx: AudioContext del juego, rpm: vueltas, thr: acelerador 0..1, on: motor encendido
    drive: function (ctx, rpm, thr, on) {
      try {
        engLoad(ctx);
        var st = ES.get(ctx);
        if (!st) {
          if (!EB[RP[0]] || !EB[RP[RP.length - 1]]) return false;
          var ok = RP.every(function (r) { return EB[r]; }); if (!ok) return false;
          var out = ctx.createGain(); out.gain.value = 0;
          var dst = (W.__chain && W.__chain(ctx)) ? W.__chain(ctx).out : ctx.destination;
          out.connect(dst);
          st = { out: out, l: [] };
          RP.forEach(function (r) {
            var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = EB[r]; s.loop = true; g.gain.value = 0;
            s.connect(g); g.connect(out); s.start(0, Math.random() * 0.5); st.l.push({ r: r, s: s, g: g });
          });
          ES.set(ctx, st); ESTATES.push(st);
        }
        var t = ctx.currentTime, x = Math.max(RP[0], Math.min(RP[RP.length - 1], rpm)), i = 0;
        while (i < RP.length - 2 && x > RP[i + 1]) i++;
        var f = (x - RP[i]) / (RP[i + 1] - RP[i]); f = Math.max(0, Math.min(1, f));
        st.l.forEach(function (o, k) {
          var w = k === i ? Math.cos(f * Math.PI / 2) : (k === i + 1 ? Math.sin(f * Math.PI / 2) : 0);
          o.g.gain.setTargetAtTime(w, t, 0.04);
          if (k === i || k === i + 1) o.s.playbackRate.setTargetAtTime(Math.max(0.8, Math.min(1.25, rpm / o.r)), t, 0.04);
        });
        var v = on ? (0.3 + 0.7 * Math.max(0, Math.min(1, thr))) * 0.7 : 0;
        st.v = v; st.out.gain.setTargetAtTime(v * SET.eng, t, 0.05);
        return true;
      } catch (e) { return false; }
    }
  };
  W.__engApply = function () { ESTATES.forEach(function (st) { try { st.out.gain.value = (st.v || 0) * SET.eng; } catch (e) {} }); };
  applyVol();

  // ---- 3) Música de fondo ----
  var track = scr && scr.getAttribute('data-track');
  var off = false, el = null, vol = 0, started = false, loading = false, cur = '', want = track || '', blobs = {}, btn = null, last = 0;

  var load = function (k) {
    if (blobs[k]) return Promise.resolve(blobs[k]);
    return fetch(base + 'audio/m_' + k + '.mp3').then(function (r) { if (!r.ok) throw 0; return r.blob(); })
      .then(function (b) { blobs[k] = URL.createObjectURL(b); return blobs[k]; });
  };
  var swap = function (k) {
    if (loading) return; loading = true;
    load(k).then(function (u) {
      el.src = u; cur = k;
      var p = el.play(); if (p && p.catch) p.catch(function () { cur = ''; });
    }).catch(function () { cur = k; }).then(function () { loading = false; });
  };
  var kick = function () {
    if (started) return; started = true;
    try {
      el = new Audio(); el.loop = true; el.preload = 'auto'; el.volume = 0;
      el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      var p = el.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    last = performance.now(); requestAnimationFrame(tick);
  };
  var tick = function (t) {
    var dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (el) {
      var tg = (D.hidden || !want) ? 0 : 0.5 * SET.music * SET.master;
      if (want && want !== cur && !loading) {
        if (!D.hidden && tg > 0) { if (vol < 0.02 || !cur) swap(want); else vol = Math.max(0, vol - dt * 1.6); }
      } else vol += (tg - vol) * Math.min(1, dt * (tg > vol ? 0.7 : 2.5));
      el.volume = Math.max(0, Math.min(1, vol));
      if ((D.hidden || tg === 0 && vol < 0.005) && !el.paused) el.pause();
      else if (!D.hidden && tg > 0 && el.paused && cur && !loading) { var q = el.play(); if (q && q.catch) q.catch(function () {}); }
    }
    requestAnimationFrame(tick);
  };

  // ---- 4) Panel de sonido (en todos los juegos) ----
  var panel = null;
  var ROWS = [['master', '🔊', 'General'], ['music', '🎵', 'Música'], ['fx', '💥', 'Efectos'], ['eng', '🏎️', 'Motores']];
  var closePanel = function () { if (panel) { panel.remove(); panel = null; } };
  var openPanel = function () {
    if (panel) { closePanel(); return; }
    kick();
    panel = D.createElement('div');
    panel.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;font-family:-apple-system,system-ui,sans-serif;touch-action:manipulation';
    var card = D.createElement('div');
    card.style.cssText = 'width:min(88vw,360px);max-height:92vh;overflow:auto;background:#1c1b2e;color:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.15)';
    var h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:17px">🎚️ Sonido</b><span id=mx style="font-size:20px;padding:4px 8px;cursor:pointer">✖</span></div>';
    ROWS.forEach(function (r) {
      h += '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><span>' + r[1] + ' ' + r[2] + '</span><span id="v_' + r[0] + '">' + Math.round(SET[r[0]] * 100) + '%</span></div><input type=range min=0 max=100 value="' + Math.round(SET[r[0]] * 100) + '" data-k="' + r[0] + '" style="width:100%;height:30px;accent-color:#7c4dff"></div>';
    });
    h += '<div style="display:flex;gap:8px;margin-top:10px"><div id=mmute style="flex:1;text-align:center;padding:10px;border-radius:12px;background:#3b3560;font-size:14px;cursor:pointer">🔇 Silenciar todo</div><div id=mrst style="flex:1;text-align:center;padding:10px;border-radius:12px;background:#3b3560;font-size:14px;cursor:pointer">↺ Normal</div></div>';
    card.innerHTML = h; panel.appendChild(card); D.body.appendChild(panel);
    ['pointerdown', 'pointerup', 'touchstart', 'touchend', 'touchmove', 'mousedown', 'click', 'keydown'].forEach(function (ev) { panel.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
    card.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', function () { var k = inp.getAttribute('data-k'); SET[k] = inp.value / 100; card.querySelector('#v_' + k).textContent = inp.value + '%'; saveSet(); applyVol(); });
    });
    var sync = function () { card.querySelectorAll('input').forEach(function (inp) { var k = inp.getAttribute('data-k'); inp.value = Math.round(SET[k] * 100); card.querySelector('#v_' + k).textContent = inp.value + '%'; }); };
    card.querySelector('#mx').addEventListener('click', closePanel);
    panel.addEventListener('click', function (e) { if (e.target === panel) closePanel(); });
    card.querySelector('#mmute').addEventListener('click', function () { SET.master = SET.master > 0 ? 0 : 1; saveSet(); applyVol(); sync(); });
    card.querySelector('#mrst').addEventListener('click', function () { SET.master = 1; SET.music = 1; SET.fx = 1; SET.eng = 1; saveSet(); applyVol(); sync(); });
  };
  var mkBtn = function () {
    if (btn || !D.body) return;
    btn = D.createElement('div');
    btn.setAttribute('aria-label', 'Sonido');
    btn.style.cssText = 'position:fixed;left:calc(6px + env(safe-area-inset-left,0px));bottom:calc(6px + env(safe-area-inset-bottom,0px));width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:16px;line-height:32px;text-align:center;z-index:99999;opacity:.6;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation';
    btn.textContent = '🎚️';
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    btn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    btn.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); openPanel(); });
    D.body.appendChild(btn);
  };
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) { W.addEventListener(ev, kick, { passive: true }); });
  if (D.body) mkBtn(); else D.addEventListener('DOMContentLoaded', mkBtn);
  W.__bgm = { set: function (k) { want = k; }, panel: openPanel, get on() { return SET.music > 0 && SET.master > 0; } };
})();
