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
