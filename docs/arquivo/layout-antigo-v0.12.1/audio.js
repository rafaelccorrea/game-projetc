/* Eonbound — GameAudio (WebAudio, sem dependências)
 * Contrato: window.GameAudio = { init(), unlock(), setEnabled(bool), music(key), sfx(name, opts), stopMusic() }
 * Extras (opcionais): isEnabled(), preload(names), setVolume({master,music,sfx}), state()
 *
 * - Carrega assets/audio/manifest.json; decodifica sob demanda, com cache.
 * - Qualquer som sem arquivo (ou cujo arquivo falhe) toca uma versão SINTETIZADA coerente com o nome.
 * - Música em loop com crossfade; se não houver arquivo, toca uma trilha procedural simples da era.
 * - Destrava no primeiro gesto (iOS/Android), pausa com a aba oculta, limita vozes, persiste liga/desliga.
 * Uso: GameAudio.init(); GameAudio.music('era3'); GameAudio.sfx('era3_s2'); GameAudio.sfx('hit', {volume:.8});
 */
(function () {
  'use strict';
  if (window.GameAudio && window.GameAudio.__eonbound) return;

  var LS_KEY = 'eonbound.audio.enabled';
  var MAX_VOICES = 10;          // sons simultâneos (sfx)
  var MAX_SAME = 3;             // cópias simultâneas do mesmo som
  var MIN_GAP = 0.045;          // s entre disparos do mesmo som
  var XFADE = 1.2;              // s de crossfade de música
  var VOL = { master: 1, music: 0.5, sfx: 0.9 };
  // sons repetitivos: variação leve de tom/volume para não cansar
  var VARY = /(_s1$|^hit$|^crit$|^coin$|^gem$|^ui_tap$|^enemy_die$|^hero_hurt$)/;
  var DUCK = /(_s3$|^boss_appear$|^legendary$|^era_change$|^defeat$)/;

  var BASE = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s && /js\/audio\.js/.test(s)) return new URL('../assets/audio/', s).href;
    } catch (e) {}
    return 'assets/audio/';
  })();

  var ctx = null, master = null, musicBus = null, sfxBus = null, comp = null;
  var enabled = true, unlocked = false, inited = false, initPromise = null;
  var manifest = { music: {}, sfx: {} };
  var cache = {};               // url -> {buf, promise, failed}
  var voices = [];              // {name, end, stop}
  var lastPlay = {};            // name -> ctx time
  var wantMusic = null;         // chave pedida
  var curMusic = null;          // {key, gain, stop}
  var musicToken = 0;
  var noiseBuf = null;

  try { var v = localStorage.getItem(LS_KEY); if (v === '0') enabled = false; } catch (e) {}

  // ---------- infra ----------
  function now() { return ctx ? ctx.currentTime : 0; }
  function canPlay() { return !!ctx && enabled && unlocked && !document.hidden && ctx.state === 'running'; }

  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    master = ctx.createGain(); master.gain.value = enabled ? VOL.master : 0;
    try {
      comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.18;
      master.connect(comp); comp.connect(ctx.destination);
    } catch (e) { master.connect(ctx.destination); }
    musicBus = ctx.createGain(); musicBus.gain.value = VOL.music; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = VOL.sfx; sfxBus.connect(master);
    return ctx;
  }

  function entry(kind, name) {
    var e = manifest[kind] && manifest[kind][name];
    if (!e) return null;
    if (typeof e === 'string') return { file: e, volume: 1 };
    if (!e.file) return null;
    return { file: e.file, volume: typeof e.volume === 'number' ? e.volume : 1 };
  }

  function loadBuffer(file) {
    var url = BASE + file;
    var c = cache[url];
    if (c) return c.promise;
    c = cache[url] = { buf: null, failed: false, promise: null };
    c.promise = fetch(url).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.arrayBuffer();
    }).then(function (ab) {
      return new Promise(function (res, rej) {
        if (!ensureCtx()) return rej(new Error('no ctx'));
        var p;
        try { p = ctx.decodeAudioData(ab, res, rej); } catch (e) { return rej(e); }
        if (p && p.then) p.then(res, rej);
      });
    }).then(function (buf) { c.buf = buf; return buf; })
      .catch(function () { c.failed = true; return null; });   // falha silenciosa -> fallback sintetizado
    return c.promise;
  }
  function cached(file) { var c = cache[BASE + file]; return c ? c : null; }

  function pruneVoices() {
    var t = now();
    voices = voices.filter(function (v) { return v.end > t; });
  }
  function addVoice(name, dur, stop) {
    voices.push({ name: name, end: now() + dur, stop: stop });
  }
  function makeRoom(name) {
    pruneVoices();
    var same = voices.filter(function (v) { return v.name === name; });
    if (same.length >= MAX_SAME) { kill(same[0]); }
    if (voices.length >= MAX_VOICES) { kill(voices[0]); }
  }
  function kill(v) {
    try { v.stop(); } catch (e) {}
    var i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
  }

  function duck(dur) {
    if (!musicBus) return;
    var t = now(), g = musicBus.gain;
    try {
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(VOL.music * 0.45, t + 0.08);
      g.setValueAtTime(VOL.music * 0.45, t + Math.max(0.2, dur));
      g.linearRampToValueAtTime(VOL.music, t + Math.max(0.2, dur) + 0.6);
    } catch (e) {}
  }

  // ---------- sintetizador (fallback) ----------
  function getNoise() {
    if (noiseBuf) return noiseBuf;
    var n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuf = b);
  }
  // S: contexto de síntese {out, t, nodes[], rate}
  function tone(S, o) {
    var t = S.t + (o.at || 0), d = o.dur || 0.15, r = S.rate || 1;
    var osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(Math.max(20, o.f * r), t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2 * r), t + d);
    var v = o.vol == null ? 0.3 : o.vol, a = o.attack == null ? 0.004 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(S.out);
    osc.start(t); osc.stop(t + d + 0.03);
    S.nodes.push(osc); S.end = Math.max(S.end, (o.at || 0) + d);
  }
  function noise(S, o) {
    var t = S.t + (o.at || 0), d = o.dur || 0.15;
    var src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = getNoise(); src.loop = true;
    f.type = o.type || 'lowpass'; f.Q.value = o.q || 0.8;
    f.frequency.setValueAtTime(o.f || 2000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    var v = o.vol == null ? 0.3 : o.vol, a = o.attack == null ? 0.003 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f); f.connect(g); g.connect(S.out);
    src.start(t, Math.random() * 1.5); src.stop(t + d + 0.03);
    S.nodes.push(src); S.end = Math.max(S.end, (o.at || 0) + d);
  }
  function notes(S, list, o) {            // sequência de notas (jingles)
    o = o || {};
    var step = o.step || 0.09, at = o.at || 0;
    for (var i = 0; i < list.length; i++) {
      tone(S, { type: o.type || 'triangle', f: list[i], dur: (i === list.length - 1 ? (o.last || 0.35) : (o.len || step * 1.6)), vol: o.vol || 0.22, at: at + i * step });
      if (o.shine) tone(S, { type: 'sine', f: list[i] * 2, dur: 0.12, vol: (o.vol || 0.22) * 0.35, at: at + i * step });
    }
  }
  function boom(S, at, size) {            // explosão/impacto grande
    size = size || 1;
    tone(S, { type: 'sine', f: 110, f2: 30, dur: 0.7 * size, vol: 0.55, at: at });
    noise(S, { type: 'lowpass', f: 1800, f2: 120, dur: 0.9 * size, vol: 0.5, at: at });
    noise(S, { type: 'highpass', f: 2500, dur: 0.08, vol: 0.25, at: at });
  }
  // golpes por era: 0 clava, 1 bronze, 2 aço, 3 pederneira, 4 vapor/tesla, 5 fuzil, 6 plasma
  function strike(S, era, at, k) {
    k = k || 1;
    switch (era) {
      case 0:
        noise(S, { type: 'bandpass', f: 500, f2: 250, q: 0.7, dur: 0.09, vol: 0.2 * k, at: at });
        tone(S, { type: 'sine', f: 150, f2: 48, dur: 0.2, vol: 0.5 * k, at: at + 0.03 });
        noise(S, { type: 'lowpass', f: 700, f2: 150, dur: 0.14, vol: 0.4 * k, at: at + 0.03 });
        break;
      case 1:
        noise(S, { type: 'bandpass', f: 1400, f2: 4200, q: 1.4, dur: 0.11, vol: 0.28 * k, at: at });
        tone(S, { type: 'triangle', f: 1480, f2: 1380, dur: 0.16, vol: 0.14 * k, at: at + 0.06 });
        tone(S, { type: 'sine', f: 2210, dur: 0.12, vol: 0.07 * k, at: at + 0.06 });
        break;
      case 2:
        noise(S, { type: 'bandpass', f: 1800, f2: 6000, q: 1.6, dur: 0.12, vol: 0.3 * k, at: at });
        tone(S, { type: 'square', f: 2350, f2: 2250, dur: 0.22, vol: 0.07 * k, at: at + 0.07 });
        tone(S, { type: 'sine', f: 3520, dur: 0.25, vol: 0.08 * k, at: at + 0.07 });
        tone(S, { type: 'sine', f: 5270, dur: 0.14, vol: 0.04 * k, at: at + 0.07 });
        break;
      case 3:
        noise(S, { type: 'lowpass', f: 3200, f2: 260, dur: 0.26, vol: 0.55 * k, at: at });
        tone(S, { type: 'sine', f: 170, f2: 42, dur: 0.2, vol: 0.45 * k, at: at });
        noise(S, { type: 'highpass', f: 3000, dur: 0.05, vol: 0.2 * k, at: at });
        break;
      case 4:
        noise(S, { type: 'lowpass', f: 2600, f2: 300, dur: 0.16, vol: 0.5 * k, at: at });
        tone(S, { type: 'sine', f: 190, f2: 55, dur: 0.15, vol: 0.4 * k, at: at });
        noise(S, { type: 'highpass', f: 4500, f2: 7000, dur: 0.3, vol: 0.12 * k, at: at + 0.05, attack: 0.03 });
        tone(S, { type: 'sawtooth', f: 900, f2: 2600, dur: 0.07, vol: 0.06 * k, at: at + 0.02 });
        break;
      case 5:
        noise(S, { type: 'lowpass', f: 5000, f2: 500, dur: 0.11, vol: 0.55 * k, at: at });
        tone(S, { type: 'square', f: 210, f2: 60, dur: 0.09, vol: 0.25 * k, at: at });
        noise(S, { type: 'bandpass', f: 900, q: 0.6, dur: 0.22, vol: 0.1 * k, at: at + 0.04 });
        break;
      default:
        tone(S, { type: 'sawtooth', f: 2100, f2: 320, dur: 0.17, vol: 0.16 * k, at: at });
        tone(S, { type: 'square', f: 1050, f2: 160, dur: 0.17, vol: 0.09 * k, at: at });
        noise(S, { type: 'bandpass', f: 5000, f2: 1500, q: 2, dur: 0.1, vol: 0.08 * k, at: at });
    }
  }
  function special(S, era) {              // s2
    var i;
    if (era === 0) {
      strike(S, 0, 0, 1.1);
      tone(S, { type: 'sine', f: 70, f2: 30, dur: 0.8, vol: 0.5, at: 0.08 });
      noise(S, { type: 'lowpass', f: 400, f2: 90, dur: 0.9, vol: 0.4, at: 0.08 });
      for (i = 0; i < 5; i++) noise(S, { type: 'bandpass', f: 600 + Math.random() * 900, q: 3, dur: 0.06, vol: 0.14, at: 0.2 + i * 0.11 });
    } else if (era === 2 || era === 6) {
      for (i = 0; i < 4; i++) strike(S, era, i * 0.13, 0.85 + i * 0.07);
      noise(S, { type: 'bandpass', f: 700, f2: 2400, q: 0.8, dur: 0.6, vol: 0.12, attack: 0.2 });
    } else if (era === 3) {
      strike(S, 3, 0); strike(S, 3, 0.2, 1.05);
    } else {
      var n = era === 1 ? 3 : 4, gap = era === 1 ? 0.14 : 0.085;
      for (i = 0; i < n; i++) strike(S, era, i * gap, 0.9 + i * 0.05);
    }
  }
  function ultimate(S, era) {             // s3 (grandiosa)
    var i;
    switch (era) {
      case 0:   // Fúria do Mamute: barrido + estouro
        tone(S, { type: 'sawtooth', f: 180, f2: 420, dur: 0.5, vol: 0.16, attack: 0.08 });
        tone(S, { type: 'sawtooth', f: 420, f2: 230, dur: 0.5, vol: 0.16, at: 0.45 });
        for (i = 0; i < 6; i++) tone(S, { type: 'sine', f: 90, f2: 40, dur: 0.12, vol: 0.35, at: 0.3 + i * 0.13 });
        boom(S, 1.15, 1.6);
        break;
      case 1:   // Ira do Olimpo: raio + trovão
        for (i = 0; i < 5; i++) noise(S, { type: 'highpass', f: 3500, dur: 0.05, vol: 0.3, at: i * 0.06 + Math.random() * 0.03 });
        noise(S, { type: 'highpass', f: 2000, f2: 600, dur: 0.35, vol: 0.45, at: 0.3 });
        boom(S, 0.38, 1.9);
        notes(S, [523, 784, 1047], { at: 0.5, step: 0.12, type: 'sine', vol: 0.1, last: 1.2 });
        break;
      case 2:   // Lâmina do Dragão: rugido + fogo + corte
        tone(S, { type: 'sawtooth', f: 95, f2: 60, dur: 0.9, vol: 0.3, attack: 0.1 });
        tone(S, { type: 'sawtooth', f: 143, f2: 85, dur: 0.9, vol: 0.18, attack: 0.1 });
        noise(S, { type: 'bandpass', f: 500, f2: 2200, q: 0.6, dur: 1.4, vol: 0.4, at: 0.4, attack: 0.25 });
        strike(S, 2, 1.25, 1.4);
        boom(S, 1.4, 1.3);
        break;
      case 3:   // Salva de Canhões
        for (i = 0; i < 4; i++) boom(S, i * 0.38, i === 3 ? 1.5 : 0.8);
        break;
      case 4:   // Tempestade Tesla
        for (i = 0; i < 14; i++) tone(S, { type: 'sawtooth', f: 400 + Math.random() * 2600, f2: 200 + Math.random() * 3000, dur: 0.06, vol: 0.12, at: i * 0.085 });
        tone(S, { type: 'square', f: 55, f2: 110, dur: 1.2, vol: 0.14, attack: 0.3 });
        noise(S, { type: 'highpass', f: 5000, dur: 1.2, vol: 0.1, attack: 0.5 });
        boom(S, 1.25, 1.3);
        tone(S, { type: 'sawtooth', f: 3000, f2: 150, dur: 0.5, vol: 0.14, at: 1.25 });
        break;
      case 5:   // Ataque Aéreo
        noise(S, { type: 'bandpass', f: 400, f2: 2600, q: 1.2, dur: 0.9, vol: 0.4, attack: 0.5 });
        noise(S, { type: 'bandpass', f: 2600, f2: 500, q: 1.2, dur: 0.6, vol: 0.3, at: 0.85 });
        for (i = 0; i < 4; i++) boom(S, 1.0 + i * 0.3, i === 3 ? 1.4 : 0.8);
        break;
      default:  // Colapso do Vazio: implosão + onda de choque
        tone(S, { type: 'sine', f: 40, f2: 160, dur: 1.1, vol: 0.4, attack: 0.5 });
        tone(S, { type: 'sawtooth', f: 200, f2: 3200, dur: 1.1, vol: 0.1, attack: 0.6 });
        noise(S, { type: 'bandpass', f: 300, f2: 6000, q: 2, dur: 1.1, vol: 0.2, attack: 0.7 });
        boom(S, 1.15, 1.8);
        tone(S, { type: 'sawtooth', f: 1600, f2: 60, dur: 1.0, vol: 0.18, at: 1.15 });
        notes(S, [1568, 2093, 3136], { at: 1.3, step: 0.1, type: 'sine', vol: 0.06, last: 0.9 });
    }
  }
  var RECIPES = {
    hit: function (S) { noise(S, { type: 'bandpass', f: 1100, q: 0.9, dur: 0.07, vol: 0.4 }); tone(S, { f: 230, f2: 105, dur: 0.09, vol: 0.4 }); },
    crit: function (S) { RECIPES.hit(S); noise(S, { type: 'lowpass', f: 2500, f2: 300, dur: 0.16, vol: 0.4 }); tone(S, { type: 'triangle', f: 1760, dur: 0.3, vol: 0.14, at: 0.02 }); tone(S, { type: 'sine', f: 2637, dur: 0.35, vol: 0.1, at: 0.04 }); },
    hero_hurt: function (S) { tone(S, { type: 'sawtooth', f: 310, f2: 130, dur: 0.22, vol: 0.2 }); noise(S, { type: 'lowpass', f: 900, dur: 0.12, vol: 0.35 }); tone(S, { f: 120, f2: 60, dur: 0.15, vol: 0.35 }); },
    enemy_die: function (S) { tone(S, { type: 'square', f: 520, f2: 70, dur: 0.28, vol: 0.14 }); noise(S, { type: 'bandpass', f: 1500, f2: 400, dur: 0.22, vol: 0.2, at: 0.05 }); tone(S, { f: 900, f2: 1500, dur: 0.08, vol: 0.12, at: 0.2 }); },
    boss_appear: function (S) { tone(S, { type: 'sawtooth', f: 55, dur: 1.9, vol: 0.28, attack: 0.25 }); tone(S, { type: 'sawtooth', f: 58.3, dur: 1.9, vol: 0.22, attack: 0.25 }); tone(S, { type: 'sawtooth', f: 82.4, f2: 77.8, dur: 1.9, vol: 0.16, attack: 0.4 }); noise(S, { type: 'lowpass', f: 300, f2: 900, dur: 1.8, vol: 0.2, attack: 0.8 }); boom(S, 0, 0.9); },
    defeat: function (S) { notes(S, [392, 330, 262, 196], { step: 0.22, len: 0.3, last: 0.9, vol: 0.2 }); tone(S, { f: 98, f2: 49, dur: 0.9, vol: 0.3, at: 0.66 }); },
    coin: function (S) { tone(S, { type: 'square', f: 988, dur: 0.07, vol: 0.1 }); tone(S, { type: 'square', f: 1319, dur: 0.28, vol: 0.1, at: 0.065 }); tone(S, { f: 2637, dur: 0.2, vol: 0.05, at: 0.065 }); },
    gem: function (S) { notes(S, [1319, 1568, 2093, 2637], { step: 0.055, type: 'sine', vol: 0.14, last: 0.4, shine: true }); },
    ui_tap: function (S) { tone(S, { f: 700, f2: 420, dur: 0.05, vol: 0.22 }); noise(S, { type: 'highpass', f: 3000, dur: 0.015, vol: 0.08 }); },
    upgrade: function (S) { notes(S, [523, 659, 784, 1047], { step: 0.075, vol: 0.18, last: 0.4, shine: true }); },
    summon: function (S) { tone(S, { f: 180, f2: 1300, dur: 0.7, vol: 0.2, attack: 0.2 }); noise(S, { type: 'bandpass', f: 400, f2: 5000, q: 2, dur: 0.7, vol: 0.2, attack: 0.35 }); notes(S, [1047, 1319, 1568, 2093], { at: 0.65, step: 0.06, type: 'sine', vol: 0.14, last: 0.6, shine: true }); },
    legendary: function (S) { [262, 330, 392, 523].forEach(function (f, i) { tone(S, { type: 'sawtooth', f: f, dur: 1.7, vol: 0.09, attack: 0.03, at: i * 0.07 }); tone(S, { type: 'triangle', f: f * 2, dur: 1.7, vol: 0.08, at: i * 0.07 }); }); notes(S, [1047, 1319, 1568, 2093, 2637, 3136], { at: 0.35, step: 0.08, type: 'sine', vol: 0.09, last: 0.9 }); boom(S, 0, 0.7); },
    era_change: function (S) { noise(S, { type: 'bandpass', f: 200, f2: 5000, q: 1.5, dur: 1.2, vol: 0.35, attack: 0.8 }); tone(S, { f: 80, f2: 640, dur: 1.2, vol: 0.2, attack: 0.6 }); boom(S, 1.2, 0.9); notes(S, [784, 1175, 1568], { at: 1.25, step: 0.1, type: 'sine', vol: 0.14, last: 1.0, shine: true }); },
    ult_ready: function (S) { tone(S, { type: 'sawtooth', f: 220, f2: 880, dur: 0.3, vol: 0.1, attack: 0.15 }); notes(S, [784, 1175, 1568], { at: 0.28, step: 0.08, vol: 0.18, last: 0.5, shine: true }); },
    claim: function (S) { notes(S, [1047, 1319, 1568, 2093], { step: 0.06, type: 'square', vol: 0.08, last: 0.3 }); noise(S, { type: 'highpass', f: 6000, dur: 0.25, vol: 0.06, at: 0.15 }); }
  };
  function recipeFor(name) {
    var m = /^era(\d)_s([123])$/.exec(name);
    if (m) {
      var era = +m[1], s = +m[2];
      if (s === 1) return function (S) { strike(S, era, 0); };
      if (s === 2) return function (S) { special(S, era); };
      return function (S) { ultimate(S, era); };
    }
    if (RECIPES[name]) return RECIPES[name];
    // nomes desconhecidos: aproxima pelo significado do nome
    var n = String(name).toLowerCase();
    if (/laser|plasma|beam|zap/.test(n)) return function (S) { strike(S, 6, 0); };
    if (/shot|gun|tiro|fire|rifle|pistol/.test(n)) return function (S) { strike(S, 5, 0); };
    if (/slash|sword|blade|corte|lamina/.test(n)) return function (S) { strike(S, 2, 0); };
    if (/explo|boom|cannon|bomb/.test(n)) return function (S) { boom(S, 0, 1.2); };
    if (/coin|gold|moeda/.test(n)) return RECIPES.coin;
    if (/gem|diamond|crystal/.test(n)) return RECIPES.gem;
    if (/crit/.test(n)) return RECIPES.crit;
    if (/hurt|damage|dano/.test(n)) return RECIPES.hero_hurt;
    if (/die|death|kill/.test(n)) return RECIPES.enemy_die;
    if (/hit|punch|golpe|impact/.test(n)) return RECIPES.hit;
    if (/win|victory|reward|claim|level|up/.test(n)) return RECIPES.upgrade;
    if (/lose|fail|defeat|error/.test(n)) return RECIPES.defeat;
    return RECIPES.ui_tap;
  }
  function playSynth(name, vol, rate, delay) {
    var g = ctx.createGain(); g.gain.value = vol; g.connect(sfxBus);
    var S = { out: g, t: now() + 0.005 + (delay || 0), nodes: [], rate: rate, end: 0 };
    try { recipeFor(name)(S); } catch (e) { return 0; }
    var dur = S.end + (delay || 0) + 0.1;
    addVoice(name, dur, function () {
      var t = now();
      try { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.03); } catch (e) {}
      S.nodes.forEach(function (n) { try { n.stop(t + 0.04); } catch (e) {} });
    });
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, (dur + 0.3) * 1000);
    return dur;
  }
  function playBuffer(name, buf, vol, rate, delay) {
    var src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.playbackRate.value = rate;
    g.gain.value = vol; src.connect(g); g.connect(sfxBus);
    var t = now() + (delay || 0);
    src.start(t);
    var dur = buf.duration / rate + (delay || 0);
    var v = { name: name, end: now() + dur, stop: function () {
      var tt = now();
      try { g.gain.setValueAtTime(g.gain.value, tt); g.gain.linearRampToValueAtTime(0, tt + 0.03); src.stop(tt + 0.04); } catch (e) {}
    } };
    voices.push(v);
    src.onended = function () { try { g.disconnect(); } catch (e) {} var i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); };
    return dur;
  }

  // ---------- sfx ----------
  function sfx(name, opts) {
    try {
      if (!name || !canPlay()) return false;
      name = String(name);
      opts = opts || {};
      var t = now();
      if (lastPlay[name] != null && t - lastPlay[name] < MIN_GAP) return false;
      lastPlay[name] = t;
      makeRoom(name);

      var e = entry('sfx', name);
      var vol = (opts.volume == null ? 1 : +opts.volume) * (e ? e.volume : 0.8);
      var rate = opts.rate == null ? 1 : +opts.rate;
      if (opts.detune) rate *= Math.pow(2, opts.detune / 1200);
      if (opts.vary !== false && (opts.vary || VARY.test(name))) {
        rate *= 1 + (Math.random() * 2 - 1) * 0.06;
        vol *= 1 - Math.random() * 0.14;
      }
      if (!(vol > 0) || !(rate > 0)) return false;
      var dur = 0, c = e && cached(e.file);
      if (c && c.buf) dur = playBuffer(name, c.buf, vol, rate, opts.delay);
      else {
        if (e && !c) loadBuffer(e.file);            // carrega para a próxima vez
        dur = playSynth(name, vol * 0.9, rate, opts.delay);
      }
      if (DUCK.test(name)) duck(Math.min(dur, 2.5));
      return true;
    } catch (err) { return false; }
  }

  function preload(names) {
    if (!ctx) return Promise.resolve();
    var list = (names || Object.keys(manifest.sfx || {})).map(function (n) { return entry('sfx', n); }).filter(Boolean);
    var i = 0;
    function next() { if (i >= list.length) return Promise.resolve(); return loadBuffer(list[i++].file).then(next); }
    return Promise.all([next(), next(), next()]);    // 3 downloads em paralelo
  }

  // ---------- música ----------
  function normKey(key) {
    if (key == null) return null;
    if (typeof key === 'number') return 'era' + key;
    key = String(key);
    return /^\d$/.test(key) ? 'era' + key : key;
  }
  function loopBounds(buf) {     // ignora o silêncio de preenchimento do mp3 no início/fim -> loop sem "buraco"
    var d = buf.getChannelData(0), n = d.length, th = 0.003, a = 0, b = n - 1;
    var lim = Math.min(n, Math.floor(buf.sampleRate * 0.25));
    while (a < lim && Math.abs(d[a]) < th) a++;
    while (b > n - lim && Math.abs(d[b]) < th) b--;
    if (a >= lim) a = 0;
    if (b <= n - lim) b = n - 1;
    if (!buf.__seamFixed) {        // alinha o último trecho com a primeira amostra (rampa de ~6 ms) -> sem clique na emenda
      buf.__seamFixed = true;
      var M = Math.min(256, b - a);
      for (var c = 0; c < buf.numberOfChannels; c++) {
        var ch = buf.getChannelData(c), delta = ch[a] - ch[b];
        for (var i = 1; i <= M; i++) ch[b - M + i] += delta * (i / M);
      }
    }
    return [a / buf.sampleRate, (b + 1) / buf.sampleRate];
  }
  function fadeOutMusic(m, secs) {
    if (!m) return;
    var t = now();
    try { m.gain.gain.cancelScheduledValues(t); m.gain.gain.setValueAtTime(m.gain.gain.value, t); m.gain.gain.linearRampToValueAtTime(0.0001, t + secs); } catch (e) {}
    setTimeout(function () { try { m.stop(); } catch (e) {} try { m.gain.disconnect(); } catch (e) {} }, secs * 1000 + 80);
  }
  function startMusic(key) {
    if (!ctx || !enabled || !unlocked) return;
    if (curMusic && curMusic.key === key) return;
    var token = ++musicToken;
    var e = entry('music', key);
    var go = function (buf) {
      if (token !== musicToken || wantMusic !== key || !enabled) return;
      var old = curMusic, g = ctx.createGain(), t = now(), stop;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(e ? e.volume : 0.8, t + (old ? XFADE : 0.5));
      g.connect(musicBus);
      if (buf) {
        var src = ctx.createBufferSource(), lb = loopBounds(buf);
        src.buffer = buf; src.loop = true; src.loopStart = lb[0]; src.loopEnd = lb[1];
        src.connect(g); src.start(t, lb[0]);
        stop = function () { try { src.stop(); } catch (x) {} };
      } else {
        stop = synthMusic(key, g);
      }
      curMusic = { key: key, gain: g, stop: stop, synth: !buf };
      fadeOutMusic(old, XFADE);
    };
    if (e) loadBuffer(e.file).then(go); else go(null);
  }
  function music(key) {
    try {
      key = normKey(key);
      if (!key) return stopMusic();
      wantMusic = key;
      startMusic(key);
    } catch (err) {}
  }
  function stopMusic() {
    wantMusic = null; musicToken++;
    var m = curMusic; curMusic = null;
    if (m && ctx) fadeOutMusic(m, 0.6);
  }

  // trilha procedural (fallback quando não há arquivo de música)
  var SYNTH_ERAS = {
    era0: { bpm: 104, root: 45, scale: [0, 3, 5, 7, 10], lead: 'triangle', drum: 'x..x.xx.x..x.x..', hat: 0 },
    era1: { bpm: 92, root: 50, scale: [0, 2, 3, 7, 8], lead: 'triangle', drum: 'x...x.x.x...x.x.', hat: 0 },
    era2: { bpm: 112, root: 48, scale: [0, 2, 4, 5, 7, 9], lead: 'sawtooth', drum: 'x.x.x.xxx.x.x.xx', hat: 0 },
    era3: { bpm: 126, root: 50, scale: [0, 2, 3, 5, 7, 10], lead: 'square', drum: 'x..xx.x.x..xx.xx', hat: 1 },
    era4: { bpm: 100, root: 46, scale: [0, 2, 3, 6, 7, 9], lead: 'square', drum: 'x.xxx.x.x.xxx.x.', hat: 1 },
    era5: { bpm: 132, root: 40, scale: [0, 3, 5, 6, 7, 10], lead: 'sawtooth', drum: 'x..x..x.x..x.xx.', hat: 1 },
    era6: { bpm: 110, root: 45, scale: [0, 3, 5, 7, 10], lead: 'sawtooth', drum: 'x...x...x...x.x.', hat: 1 },
    title: { bpm: 96, root: 48, scale: [0, 2, 4, 7, 9], lead: 'sawtooth', drum: 'x...x...x..xx...', hat: 0 }
  };
  function synthMusic(key, out) {
    var P = SYNTH_ERAS[key] || SYNTH_ERAS.title;
    var step = 60 / P.bpm / 4, i = 0, nextT = now() + 0.1, alive = true;
    var seed = 0; for (var k = 0; k < key.length; k++) seed = (seed * 31 + key.charCodeAt(k)) >>> 0;
    function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
    var pat = []; for (var s = 0; s < 32; s++) pat.push(rnd() < 0.55 ? Math.floor(rnd() * P.scale.length * 2) : -1);
    var bass = [0, 0, 3, 4]; if (P.scale.length < 6) bass = [0, 0, 2, 3];
    function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
    function deg(d) { return P.root + 12 * Math.floor(d / P.scale.length) + P.scale[d % P.scale.length]; }
    function tick() {
      if (!alive || !ctx) return;
      while (nextT < now() + 0.35) {
        var S = { out: out, t: nextT, nodes: [], rate: 1, end: 0 }, st = i % 16, bar = Math.floor(i / 16) % 4;
        if (P.drum.charAt(st) === 'x') {
          tone(S, { f: st % 8 === 0 ? 120 : 170, f2: 50, dur: 0.16, vol: st % 8 === 0 ? 0.5 : 0.28 });
          if (st % 8 === 4) noise(S, { type: 'bandpass', f: 1800, q: 0.7, dur: 0.09, vol: 0.16 });
        }
        if (P.hat && st % 2 === 0) noise(S, { type: 'highpass', f: 7000, dur: 0.03, vol: 0.05 });
        if (st % 4 === 0) tone(S, { type: 'triangle', f: hz(deg(bass[bar]) - 12), dur: step * 3.6, vol: 0.3 });
        var n = pat[i % 32];
        if (n >= 0) tone(S, { type: P.lead, f: hz(deg(n + bass[bar]) + 12), dur: step * 1.9, vol: P.lead === 'triangle' ? 0.16 : 0.07, attack: 0.01 });
        nextT += step; i++;
      }
    }
    var timer = setInterval(tick, 120); tick();
    return function () { alive = false; clearInterval(timer); };
  }

  // ---------- ciclo de vida ----------
  function unlock() {
    try {
      if (!ensureCtx()) return false;
      var resume = function () {
        if (!enabled || document.hidden) return;
        if (ctx.state !== 'running' && ctx.resume) { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
      };
      resume();
      if (!unlocked) {
        try {      // iOS: tocar um buffer silencioso dentro do gesto
          var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
          s.buffer = b; s.connect(ctx.destination); s.start(0);
        } catch (e) {}
        unlocked = true;
        var after = function () { if (wantMusic) startMusic(wantMusic); preload(); };
        if (initPromise) initPromise.then(after); else after();
      } else if (wantMusic && !curMusic) startMusic(wantMusic);
      return true;
    } catch (err) { return false; }
  }
  function onGesture() { if (!unlocked || (ctx && ctx.state !== 'running')) unlock(); }

  function onVisibility() {
    if (!ctx) return;
    try {
      if (document.hidden) { if (ctx.state === 'running' && ctx.suspend) ctx.suspend(); }
      else if (enabled && unlocked && ctx.resume) { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
    } catch (e) {}
  }

  function setEnabled(on) {
    enabled = !!on;
    try { localStorage.setItem(LS_KEY, enabled ? '1' : '0'); } catch (e) {}
    if (!ctx) return enabled;
    var t = now();
    try {
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(enabled ? VOL.master : 0, t + 0.15);
    } catch (e) {}
    if (enabled) {
      if (!document.hidden && ctx.resume) { var p = ctx.resume(); if (p && p.catch) p.catch(function () {}); }
      if (unlocked && wantMusic && !curMusic) startMusic(wantMusic);
    } else {
      voices.slice().forEach(kill);
      var m = curMusic; curMusic = null; musicToken++;
      if (m) fadeOutMusic(m, 0.2);                 // wantMusic é mantido para voltar ao religar
      setTimeout(function () { if (!enabled && ctx && ctx.state === 'running' && ctx.suspend) ctx.suspend(); }, 400);
    }
    return enabled;
  }

  function init(opts) {
    if (initPromise) return initPromise;
    inited = true;
    if (opts && opts.base) BASE = opts.base;
    var ev = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown', 'click'];
    ev.forEach(function (n) { window.addEventListener(n, onGesture, { capture: true, passive: true }); });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onVisibility);
    window.addEventListener('pageshow', onVisibility);
    initPromise = fetch(BASE + 'manifest.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (m) { manifest = { music: (m && m.music) || {}, sfx: (m && m.sfx) || {} }; return true; })
      .catch(function () { manifest = { music: {}, sfx: {} }; return false; });   // sem manifest: tudo sintetizado
    return initPromise;
  }

  window.GameAudio = {
    __eonbound: true,
    init: init,
    unlock: unlock,
    setEnabled: setEnabled,
    music: music,
    sfx: sfx,
    stopMusic: stopMusic,
    // extras
    isEnabled: function () { return enabled; },
    preload: preload,
    setVolume: function (v) {
      v = v || {};
      ['master', 'music', 'sfx'].forEach(function (k) { if (typeof v[k] === 'number') VOL[k] = Math.max(0, Math.min(1, v[k])); });
      if (ctx) { if (enabled) master.gain.value = VOL.master; musicBus.gain.value = VOL.music; sfxBus.gain.value = VOL.sfx; }
    },
    state: function () {
      pruneVoices();
      var loaded = 0, failed = 0;
      Object.keys(cache).forEach(function (k) { if (cache[k].buf) loaded++; if (cache[k].failed) failed++; });
      return {
        inited: inited, enabled: enabled, unlocked: unlocked, ctx: ctx ? ctx.state : 'none',
        music: curMusic ? curMusic.key : null, musicSynth: curMusic ? !!curMusic.synth : null, wantMusic: wantMusic,
        voices: voices.length, loaded: loaded, failed: failed,
        manifest: { music: Object.keys(manifest.music), sfx: Object.keys(manifest.sfx) }
      };
    }
  };
})();
