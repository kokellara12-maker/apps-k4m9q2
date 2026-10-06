/* Sonido global de "Mis Apps": si está silenciado desde el menú principal, ningún juego suena.
   Se carga al principio de cada juego. La clave 'mis_mute' la pone el botón del menú (y el de Koke City). */
(function () {
  var M = false;
  try { M = localStorage.getItem('mis_mute') === '1'; } catch (e) {}
  window.__misMute = M;
  if (!M) return;
  try {
    // todo lo que iría a los altavoces pasa por una ganancia 0
    var oc = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (t) {
      try {
        if (typeof AudioDestinationNode !== 'undefined' && t instanceof AudioDestinationNode) {
          var c = t.context;
          if (!c.__mz) { c.__mz = c.createGain(); c.__mz.gain.value = 0; oc.call(c.__mz, t); }
          arguments[0] = c.__mz;
          return oc.apply(this, arguments);
        }
      } catch (e) {}
      return oc.apply(this, arguments);
    };
  } catch (e) {}
  try {
    // los contextos de audio se quedan suspendidos
    ['AudioContext', 'webkitAudioContext'].forEach(function (n) {
      var A = window[n]; if (!A || !A.prototype) return;
      A.prototype.resume = function () { return Promise.resolve(); };
    });
  } catch (e) {}
  try {
    // <audio> / <video>: no reproducen
    var op = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { try { this.muted = true; this.volume = 0; } catch (e) {} return Promise.resolve(); };
    Object.defineProperty(HTMLMediaElement.prototype, 'muted', { configurable: true, get: function () { return true; }, set: function () {} });
  } catch (e) {}
  try { if (window.speechSynthesis) window.speechSynthesis.speak = function () {}; } catch (e) {}
})();
