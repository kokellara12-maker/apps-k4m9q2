/* Música de fondo + pulido de efectos para los juegos de "Mis Apps".
   Música: pistas CC0 (Komiku, FreePD). Se carga una vez y queda guardada para jugar sin internet. */
(function () {
  'use strict';
  var W = window, D = document;

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
        wet.gain.value = 0.13; out.gain.value = 1.1;
        var len = Math.floor(ctx.sampleRate * 0.55), buf = ctx.createBuffer(2, len, ctx.sampleRate);
        for (var ch = 0; ch < 2; ch++) { var d = buf.getChannelData(ch); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
        conv.buffer = buf;
        oc.call(inp, lp); oc.call(lp, comp); oc.call(comp, out);
        oc.call(lp, conv); oc.call(conv, wet); oc.call(wet, out);
        oc.call(out, ctx.destination);
        c = { inp: inp }; chains.set(ctx, c); return c;
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
        if (!this.__io || this.loop || !ready()) return os.apply(this, arguments);
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

  // ---- 2) Música de fondo ----
  var sc = D.currentScript, track = sc && sc.getAttribute('data-track');
  if (!track) return;
  var base = (sc.src || '').replace(/[^\/]*$/, '');
  var off = false, el = null, vol = 0, started = false, loading = false, cur = '', want = track, blobs = {}, btn = null;
  try { off = localStorage.getItem('bgm_off') === '1'; } catch (e) {}

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
  var last = 0;
  var tick = function (t) {
    var dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (el) {
      var tg = (off || D.hidden) ? 0 : 0.3;
      if (want !== cur && !loading) {
        if (!off && !D.hidden) { if (vol < 0.02 || !cur) swap(want); else vol = Math.max(0, vol - dt * 1.6); }
      } else vol += (tg - vol) * Math.min(1, dt * (tg > vol ? 0.7 : 2.5));
      el.volume = Math.max(0, Math.min(1, vol));
      if (D.hidden && !el.paused) el.pause();
      else if (!D.hidden && !off && el.paused && cur && !loading) { var q = el.play(); if (q && q.catch) q.catch(function () {}); }
    }
    requestAnimationFrame(tick);
  };

  var mkBtn = function () {
    if (btn || !D.body) return;
    btn = D.createElement('div');
    btn.setAttribute('aria-label', 'Música');
    btn.style.cssText = 'position:fixed;left:calc(6px + env(safe-area-inset-left,0px));bottom:calc(6px + env(safe-area-inset-bottom,0px));width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;font-size:15px;line-height:30px;text-align:center;z-index:99999;opacity:.55;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;touch-action:manipulation';
    var paint = function () { btn.textContent = off ? '🔇' : '🎵'; };
    paint();
    var tog = function (e) {
      e.stopPropagation(); e.preventDefault();
      off = !off; try { localStorage.setItem('bgm_off', off ? '1' : '0'); } catch (x) {}
      paint(); kick();
    };
    btn.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    btn.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true });
    btn.addEventListener('click', tog);
    D.body.appendChild(btn);
  };

  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) { W.addEventListener(ev, kick, { passive: true, once: false }); });
  if (D.body) mkBtn(); else D.addEventListener('DOMContentLoaded', mkBtn);
  W.__bgm = { set: function (k) { want = k; }, get on() { return !off; } };
})();
