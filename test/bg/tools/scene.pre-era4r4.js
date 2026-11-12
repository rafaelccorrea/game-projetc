/* Eonbound — cena de cenário em camadas animadas (módulo único, sem dependências).
   Tudo é guiado por meta.json (assets/bg/v2/era<N>/meta.json). Medidas em fração da altura da cena (SH).
   Blocos opcionais do meta: mill, midAnchors (towerFlags/chimneys/forgeGlow), smoke, sunRays (era 2) e
   fx[] (flow | glow | plume | embers presos a uma camada), roadside fire/critter/vent/sway (era 0 em diante),
   props[] (sprites soltos presos a uma camada, com bob/tilt/kick/flags; era 3 em diante),
   rotors[] (sprites girando presos a uma camada), actors[] (sprites que cruzam a cena com pecas girando), roadside.sameTypeGap e
   folhas de quadros em objetos da beira (era 4 em diante).
   Quem não está no meta não é desenhado: a era 2 roda exatamente como foi aprovada.

   Uso:
     const cena = await EonScene.create(canvas, { base: 'assets/bg/v2/era2/' });
   A promessa resolve assim que o meta.json chega: a cena já está desenhando (fundo provisório + barra fina de
   carregamento) e cada camada/sprite entra no quadro assim que decodifica. cena.ready resolve com tudo carregado.
   Opções:
     base      pasta das imagens (com / no fim)
     meta      objeto meta já carregado (senão busca base + 'meta.json')
     resolve   função (arquivo) => URL (ex.: data URIs ou URLs de assets hospedados); padrão base + arquivo
     width, height   tamanho da cena em px CSS (padrão: tamanho do canvas na página)
     dpr       densidade (padrão devicePixelRatio, máx. 3)
     running   começa correndo (padrão true);  hero: false esconde o herói;  line: true mostra a linha dos pés
     autoStart padrão true
   Retorno: { start(), stop(), setRunning(bool), set(segundos, congelar), resize(w,h), state, meta, ready,
              loaded, progress, firstPaintMs, readyMs }                                                            */
(function (root) {
  'use strict';
  var imul = Math.imul, PI2 = Math.PI * 2;
  function rnd(i, seed, k) { var x = imul(i | 0, 0x9E3779B1) ^ imul(seed * 31 + k + 1, 0x85EBCA6B); x ^= x >>> 15; x = imul(x, 0x2C1B3C6D); x ^= x >>> 12; x = imul(x, 0x297A2D39); x ^= x >>> 15; return (x >>> 0) / 4294967296; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function lerp(r, t) { return r[0] + (r[1] - r[0]) * t; }
  function loadImg(u) { return new Promise(function (ok, er) { var i = new Image(); i.decoding = 'async'; i.onerror = function () { er(new Error('imagem não carregou: ' + u)); }; i.src = u;
    if (i.decode) i.decode().then(function () { ok(i); }, function () { if (i.complete && i.naturalWidth) ok(i); else i.onload = function () { ok(i); }; }); else i.onload = function () { ok(i); }; }); }
  function pick(pool, r) { var tot = 0, i; for (i = 0; i < pool.length; i++) tot += (pool[i].weight || pool[i][1] || 1); r *= tot; for (i = 0; i < pool.length; i++) { r -= (pool[i].weight || pool[i][1] || 1); if (r <= 0) return pool[i]; } return pool[pool.length - 1]; }

  function create(cv, o) {
    o = o || {};
    var t0 = performance.now(), base = o.base || '', url = o.resolve || function (f) { return base + f; };
    var getMeta = o.meta ? Promise.resolve(o.meta) : fetch(url('meta.json')).then(function (r) { if (!r.ok) throw new Error('meta.json não carregou'); return r.json(); });
    return getMeta.then(function (M) {
      var S = {}, LAY = {}, jobs = [], done = 0, heroImg = null, decalImg = null, millBody = null, millBlade = null;
      M.layers.forEach(function (L) { LAY[L.id] = L; L.imgs = []; L.hi = []; });
      var api = build();
      function job(file, fn) { var p = loadImg(url(file)).then(function (i) { done++; api.progress = done / jobs.length; fn(i); }); jobs.push(p); return p; }
      // leves primeiro (pedidos na frente), pesadas depois
      M.layers.forEach(function (L) { (L.filesLow || []).forEach(function (f, k) { job(f, function (i) { if (!L.hi[k]) L.imgs[k] = i; }); }); });
      M.layers.forEach(function (L) { if (!L.filesLow) (L.files || [L.file]).forEach(function (f, k) { job(f, function (i) { L.imgs[k] = i; L.hi[k] = 1; }); }); });
      job(M.hero.file, function (i) { heroImg = i; });
      Object.keys(M.sprites).forEach(function (k) { var v = M.sprites[k], f = typeof v === 'string' ? v : v.file; job(f, function (i) { S[k] = { img: i, frames: v.frames || 1, fps: v.fps || 0 }; }); });
      job(M.decals.file, function (i) { decalImg = i; });
      if (M.mill) { job(M.mill.body.file, function (i) { millBody = i; }); job(M.mill.blade.file, function (i) { millBlade = i; }); }
      M.layers.forEach(function (L) { if (L.filesLow) (L.files || [L.file]).forEach(function (f, k) { job(f, function (i) { L.imgs[k] = i; L.hi[k] = 1; }); }); });
      api.ready = Promise.all(jobs).then(function () { api.loaded = true; api.progress = 1; api.readyMs = Math.round(performance.now() - t0); api.draw(); return api; });   // redesenha na hora: a barra de carregamento nunca fica parada na tela (aba em segundo plano)
      return api;

      function build() {
        var g = cv.getContext('2d'), W, SH, DPR, T = 0, scroll = 0, runT = 0, running = o.running !== false, raf = 0, last = 0, frozen = false;
        var SMOKE = [], smokeAcc = 0, PUFF = [], lastStep = -1, FOG = null, self;
        function resize(w, h) { W = w || cv.clientWidth || M.scene.refWidth; SH = h || cv.clientHeight || M.scene.refHeight; DPR = Math.min(3, Math.max(1, o.dpr || root.devicePixelRatio || 1)); cv.width = Math.round(W * DPR); cv.height = Math.round(SH * DPR); }
        resize(o.width, o.height);
        function px(v) { return Math.round(v * DPR) / DPR; }
        function sp(k) { return S[k] ? S[k].img : null; }

        /* ---- fundo provisório (aparece no primeiro quadro, antes de qualquer imagem) ---- */
        function drawBackdrop() { var P = M.placeholder, gt = LAY.ground.top * SH, i, gr = g.createLinearGradient(0, 0, 0, gt);
          for (i = 0; i < P.sky.length; i++) gr.addColorStop(i / (P.sky.length - 1), P.sky[i]); g.fillStyle = gr; g.fillRect(0, 0, W, gt + 1);
          var y = gt; P.ground.forEach(function (b) { var y1 = b[0] * SH; g.fillStyle = b[1]; g.fillRect(0, y, W, y1 - y + 1); y = y1; }); }
        function drawLoading() { if (self.loaded || self.progress >= 1) return; var p = self.progress || 0, w = W * 0.28, x = (W - w) / 2, y = SH * 0.5; g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, y, w, 3); g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(x, y, w * p, 3); }

        /* ---- camadas ladrilhadas ---- */
        function geom(L) { var h = L.height * SH, w = h * L.px[0] / L.px[1], y = (L.top != null) ? L.top * SH : L.bottom * SH - h; return { h: h, w: w, y: y, off: (scroll * L.parallax + T * (L.drift || 0) + (L.offset || 0)) * SH }; }
        function tiles(L, fn) { var G = geom(L), n = (L.files || [L.file]).length, i0 = Math.floor(G.off / G.w); for (var i = i0; i * G.w - G.off < W; i++) fn(i, px(i * G.w - G.off), L.tile === 'mirror' && mod(i, 2) === 1, G, mod(i, n)); }
        function drawLayer(L) { tiles(L, function (i, x, flip, G, k) { var w = G.w + 1 / DPR, im = L.imgs[k]; if (!im) return; if (flip) { g.save(); g.translate(x + w, 0); g.scale(-1, 1); g.drawImage(im, 0, G.y, w, G.h); g.restore(); } else g.drawImage(im, x, G.y, w, G.h); }); }
        function midAnchors(lists, fn) { tiles(LAY.mid, function (i, x, flip, G, k) { if (!LAY.mid.imgs[k]) return; (lists[mod(i, lists.length)] || []).forEach(function (a, j) { fn(x + a.x * G.w, G.y + a.y * G.h, i * 10 + j, G, a); }); }); }

        /* ---- bandeira deformada em fatias (presa à direita, voa para a esquerda) ---- */
        function drawFlag(img, ax, ay, w, ph, amp) {
          var F = M.flagWave, h = w * img.height / img.width, n = Math.max(8, Math.ceil(w / F.sliceCss)), sw = img.width / n, dw = w / n;
          for (var s = 0; s < n; s++) { var u = (s + 0.5) / n;
            var wave = Math.sin(u * F.k1 - T * F.w1 + ph) * amp * h * (0.15 + u) + Math.sin(u * F.k2 - T * F.w2 + ph * 1.7) * amp * h * 0.7 * u;
            var sq = 1 + 0.07 * Math.cos(u * F.k1 - T * F.w1 + ph) * u;
            g.drawImage(img, img.width - (s + 1) * sw, 0, sw, img.height, ax - (s + 1) * dw - 0.25, ay + wave + u * u * h * F.droop, dw + 0.6, h * sq); }
        }
        function stick(x, y0, y1, t) { g.lineCap = 'round'; g.strokeStyle = '#2a1a12'; g.lineWidth = t + 1.6; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); g.strokeStyle = '#9a6a3c'; g.lineWidth = t; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
        function glow(x, y, r, a) { g.save(); g.globalCompositeOperation = 'lighter'; var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,190,90,' + a + ')'); gr.addColorStop(0.5, 'rgba(255,150,50,' + (a * 0.35) + ')'); gr.addColorStop(1, 'rgba(255,120,30,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }

        /* ---- efeitos presos a uma camada: meta.fx[] (ausente na era 2) ----
           flow: máscara (sprite) + faixas de brilho descendo (lava, cachoeira); glow: brilho pulsando;
           plume: coluna de fumaça/vapor sem estado (depende só de T); embers: fagulhas em arco.           */
        function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
        function mix(a, b, t) { var A = hex(a), B = hex(b); return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')'; }
        function disc(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
        function layerAnchors(L, list, fn) { tiles(L, function (i, x, flip, G, k) { if (!L.imgs[k]) return; (list[k] || []).forEach(function (a, j) { fn(x + (flip ? 1 - a.x : a.x) * G.w, G.y + a.y * G.h, i * 10 + j, G, a, flip); }); }); }
        function glowC(x, y, r, a, c) { g.save(); g.globalCompositeOperation = 'lighter'; var gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + c[0] + ',' + a + ')'); gr.addColorStop(0.5, 'rgba(' + c[1] + ',' + (a * 0.35) + ')'); gr.addColorStop(1, 'rgba(' + c[2] + ',0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore(); }
        function plume(P, x, y, id, str) { var n = P.n, arr = [], k, sd = P.seed || 70; str = str == null ? 1 : str;
          for (k = 0; k < n; k++) { var u = T / P.life + k / n + id * 0.37, c = Math.floor(u), s = c * 131 + k + id * 977; arr.push({ p: u - c, a: rnd(s, sd, 0), b: rnd(s, sd, 1), c: rnd(s, sd, 2) }); }
          arr.sort(function (a, b) { return b.p - a.p; });
          arr.forEach(function (q) { var p = q.p, fade = P.fade || 0.6, hu = P.hotUntil || 0, fi = P.fadeIn || 0.08;
            var x1 = x + (P.wind * Math.pow(p, 1.5) + (q.a - 0.5) * P.spread * p) * SH + Math.sin(p * 7 + q.b * 6.28) * (P.wobble || 0) * SH * p, y1 = y - P.rise * SH * Math.pow(p, 0.85) * (0.4 + 0.6 * str);
            var r = (P.r0 + P.grow * p) * SH * (0.75 + 0.5 * q.c), al = (p < fi ? p / fi : p > fade ? (1 - p) / (1 - fade) : 1) * P.alpha * str; if (al <= 0.003) return;
            g.globalAlpha = al; g.fillStyle = p < hu ? mix(P.hotDark, P.dark, p / hu) : P.dark; disc(x1 + r * 0.12, y1 + r * 0.14, r); g.fillStyle = p < hu ? mix(P.hot, P.light, p / hu) : P.light; disc(x1 - r * 0.10, y1 - r * 0.12, r * 0.84); });
          g.globalAlpha = 1; }
        function embers(E, x, y, id) { var n = E.n, sd = E.seed || 90; g.save(); g.globalCompositeOperation = 'lighter';
          for (var k = 0; k < n; k++) { var u = T / E.life + k / n + id * 0.21, c = Math.floor(u), p = u - c, s = c * 173 + k + id * 911, t = p * E.life;
            var ang = -Math.PI / 2 + (rnd(s, sd, 0) - 0.5) * E.angle, v = E.speed * (0.5 + rnd(s, sd, 1));
            var x1 = x + (Math.cos(ang) * v * t + (E.wind || 0) * t + Math.sin(t * 5 + k) * (E.wobble || 0) * p) * SH, y1 = y + (Math.sin(ang) * v * t + 0.5 * E.gravity * t * t) * SH;
            var r = lerp(E.radius, rnd(s, sd, 2)) * SH, a = Math.pow(1 - p, 0.6) * (0.65 + 0.35 * Math.sin(T * 19 + k * 2.1)) * (p < 0.05 ? p / 0.05 : 1);
            g.fillStyle = 'rgba(' + E.glowRgb + ',' + (a * 0.3).toFixed(3) + ')'; disc(x1, y1, r * 2.6); g.fillStyle = 'rgba(' + E.rgb + ',' + a.toFixed(3) + ')'; disc(x1, y1, r); }
          g.restore(); }
        /* flow: o laço tem F.loop segundos e F.frames quadros; cada quadro (máscara x faixas) é montado uma única vez
           num canvas pequeno e guardado, depois é só um drawImage por quadro (nada de upload de textura a cada frame). */
        function flowFrame(F, m, cw, ch, k) { var key = cw + 'x' + ch; if (F._k !== key) { F._k = key; F._f = []; } if (F._f[k]) return F._f[k];
          var c = document.createElement('canvas'), q = c.getContext('2d'), ph = k / F.frames, sc = ch / (F._h || 1); c.width = cw; c.height = ch;
          F.bands.forEach(function (B) { var per = B.len * sc, off = mod(ph * B.cycles, 1) * per; for (var y = off - per; y < ch; y += per) { var gr = q.createLinearGradient(0, y, 0, y + per); gr.addColorStop(0, 'rgba(' + F.rgb + ',0)'); gr.addColorStop(B.peak || 0.5, 'rgba(' + F.rgb + ',' + B.alpha + ')'); gr.addColorStop(1, 'rgba(' + F.rgb + ',0)'); q.fillStyle = gr; q.fillRect(0, y, cw, per + 1); } });
          if (F.base) { q.fillStyle = 'rgba(' + F.rgb + ',' + (F.base * (1 + (F.pulse || 0) * Math.sin(PI2 * ph * (F.pulseCycles || 1)))).toFixed(3) + ')'; q.fillRect(0, 0, cw, ch); }
          q.globalCompositeOperation = 'destination-in'; q.drawImage(m, 0, 0, cw, ch); F._f[k] = c; return c; }
        function flow(F, L) { var m = sp(F.mask); if (!m) return; tiles(L, function (i, x, flip, G, k) { if (k !== (F.tile || 0) || !L.imgs[k]) return; var r = F.rect, w = r[2] * G.w, h = r[3] * G.h, fx = x + (flip ? 1 - r[0] - r[2] : r[0]) * G.w, fy = G.y + r[1] * G.h; if (fx > W || fx + w < 0) return;
            var q = Math.min(DPR, F.maxScale || 1.5), cw = Math.max(1, Math.round(w * q)), ch = Math.max(1, Math.round(h * q)); F._h = r[3] * L.height;   // _h: altura do retângulo em SH (len das faixas está em SH)
            var c = flowFrame(F, m, cw, ch, Math.floor(mod(T / F.loop, 1) * F.frames) % F.frames);
            g.save(); g.globalCompositeOperation = F.blend || 'lighter'; if (flip) { g.translate(fx + w, 0); g.scale(-1, 1); g.drawImage(c, 0, fy, w, h); } else g.drawImage(c, fx, fy, w, h); g.restore(); }); }
        function drawFx(id) { if (!M.fx) return; var L = LAY[id]; M.fx.forEach(function (F) { if (F.layer !== id) return;
            if (F.type === 'flow') flow(F, L);
            else layerAnchors(L, F.anchors, function (x, y, n, G, a) { var m = F.margin || 0.3; if (x < -m * SH || x > W + m * SH) return;
              if (F.type === 'glow') glowC(x, y, F.radius * SH * (1 + 0.15 * Math.sin(T * F.pulse + n) + 0.08 * Math.sin(T * F.pulse * 2.7)), F.alpha * (1 + 0.3 * Math.sin(T * F.pulse * 1.37 + n)), F.rgb);
              else if (F.type === 'plume') plume(F, x, y, n);
              else if (F.type === 'embers') embers(F, x, y, n); }); }); }
        /* bicho da beira da trilha: cauda e cabeça mexem por fatias verticais (sem quadros) */
        function fN(it) { return (it.sprite && S[it.sprite] && S[it.sprite].frames) || 1; }                                   // quadros da folha de um objeto da beira (1 nas eras 0 a 3)
        function fX(it, s, ph) { var F = fN(it); return F > 1 ? (Math.floor(T * S[it.sprite].fps + ph) % F) * s.width / F : 0; }
        function critter(s, it, x, by, w, h, ph) { var f0 = fX(it, s, ph), n = Math.max(8, Math.ceil(w / 1.5)), sw = s.width / fN(it) / n, dw = w / n, A = it.tail, H = it.head;
          for (var i = 0; i < n; i++) { var u = (i + 0.5) / n, dy = 0, v; if (A && u < A.x) { v = (A.x - u) / A.x; dy = Math.sin(T * A.f - v * A.k + ph) * A.amp * h * v * v; } else if (H && u > H.x) { v = (u - H.x) / (1 - H.x); dy = (Math.sin(T * H.f + ph) * 0.7 + Math.sin(T * H.f * 2.3 + ph * 2) * 0.3) * H.amp * h * v * v; }
            g.drawImage(s, f0 + i * sw, 0, sw, s.height, x - w / 2 + i * dw - 0.25, by - h + dy, dw + 0.6, h); } }
        function sparks(Q, x, y, sz, ph) { g.save(); g.globalCompositeOperation = 'lighter'; for (var k = 0; k < Q.n; k++) { var u = T / Q.life + k / Q.n + ph * 0.13, c = Math.floor(u), p = u - c, s = c * 97 + k;
            var x1 = x + ((rnd(s, 95, 0) - 0.5) * Q.spread + Math.sin(p * 9 + rnd(s, 95, 1) * 6.28) * Q.wobble * p - Q.wind * p * p) * sz, y1 = y - p * Q.rise * sz * (0.6 + 0.6 * rnd(s, 95, 2)), a = (1 - p) * (0.6 + 0.4 * Math.sin(T * 23 + k)), r = Q.radius * sz * (1 - 0.5 * p);
            g.fillStyle = 'rgba(255,150,50,' + (a * 0.3).toFixed(3) + ')'; disc(x1, y1, r * 2.4); g.fillStyle = 'rgba(255,225,130,' + a.toFixed(3) + ')'; disc(x1, y1, r); } g.restore(); }

        /* ---- props: sprites soltos presos a uma camada (meta.props[]; ausente nas eras 0, 1 e 2: nada muda nelas) ----
           sprite (chave de meta.sprites), layer (far|mid|ground), tile (indice em files), rect [x,y,w,h] em fracao do arquivo da camada,
           front (true = desenha depois da camada; senao antes). Movimentos opcionais:
           bob {amp (SH), period (s), phase}  sobe-desce em seno;
           tilt {deg, period, phase, pivot [x,y] em fracao do rect}  inclinacao em seno em torno do pivo;
           kick {dx, dy (SH), period, index, phase, attack, release (s)}  pulso: fase = frac(T/period + (i*10+index)*0.37 + phase),
             a mesma de um fx plume com n=1 e life=period na ancora de indice index (recuo de canhao no disparo);
           flags [{flag, x, y (fracao do rect), w (SH), amp}]  panos que acompanham o sprite (usam drawFlag).            */
        function drawProps(id, front) { if (!M.props) return; var L = LAY[id]; M.props.forEach(function (P) { if (P.layer !== id || !!P.front !== front) return; var s = sp(P.sprite); if (!s) return;
            tiles(L, function (i, x, flip, G, k) { if (k !== (P.tile || 0) || !L.imgs[k]) return; var r = P.rect, w = r[2] * G.w, h = r[3] * G.h, x0 = x + (flip ? 1 - r[0] - r[2] : r[0]) * G.w, y0 = G.y + r[1] * G.h; if (x0 > W + w * 0.2 || x0 + w < -w * 0.2) return;
              var dx = 0, dy = 0, ang = 0, B = P.bob, R = P.tilt, K = P.kick, pv = (R && R.pivot) || [0.5, 1];
              if (B) dy += Math.sin(PI2 * (T / B.period + (B.phase || 0))) * B.amp * SH;
              if (R) ang = Math.sin(PI2 * (T / R.period + (R.phase || 0))) * R.deg * Math.PI / 180;
              if (K) { var tt = mod(T / K.period + (i * 10 + (K.index || 0)) * 0.37 + (K.phase || 0), 1) * K.period, a = tt < K.attack ? tt / K.attack : tt < K.attack + K.release ? 1 - (tt - K.attack) / K.release : 0; a = a * a * (3 - 2 * a); dx += K.dx * a * SH; dy += K.dy * a * SH; }
              g.save(); g.translate(x0 + (flip ? 1 - pv[0] : pv[0]) * w + (flip ? -dx : dx), y0 + pv[1] * h + dy); if (flip) g.scale(-1, 1); g.rotate(ang);
              g.drawImage(s, -pv[0] * w, -pv[1] * h, w, h);
              (P.flags || []).forEach(function (f, j) { var im = sp(f.flag); if (im) drawFlag(im, (f.x - pv[0]) * w, (f.y - pv[1]) * h, f.w * SH, (i * 10 + j) * 1.3, f.amp); });
              g.restore(); }); }); }

        /* ---- rotors e actors (meta.rotors[] / meta.actors[]; ausentes nas eras 0 a 3: nada muda nelas) ----
           rotors: sprite girando em torno do proprio centro, preso a uma camada: layer, tile, x, y (fracao do arquivo), w (fracao da largura
             do arquivo), period (s por volta; negativo = sentido anti-horario), phase (rad), front (true = depois da camada).
           actors: sprite que cruza a cena como um item de clouds (x, y, w em SH; parallax, drift, loop = periodo em SH; bob, bobF), desenhado
             em slot 'sky' (depois das nuvens) ou 'mid' (antes da camada mid), com pecas presas: parts [{sprite, x, y (fracao do corpo, centro),
             w (fracao da largura do corpo), period, phase, flap (true = helice vista de lado: achata em cos), back (true = atras do corpo)}]. */
        function spinImg(im, cx, cy, w, ang, sy) { var h = w * im.height / im.width; g.save(); g.translate(cx, cy); g.rotate(ang); if (sy != null) g.scale(1, sy); g.drawImage(im, -w / 2, -h / 2, w, h); g.restore(); }
        function drawRotors(id, front) { if (!M.rotors) return; var L = LAY[id]; M.rotors.forEach(function (R) { if (R.layer !== id || !!R.front !== front) return; var im = sp(R.sprite); if (!im) return;
            tiles(L, function (i, x, flip, G, k) { if (k !== (R.tile || 0) || !L.imgs[k]) return; var w = R.w * G.w, cx = x + (flip ? 1 - R.x : R.x) * G.w, cy = G.y + R.y * G.h; if (cx < -w || cx > W + w) return; spinImg(im, cx, cy, w, (flip ? -1 : 1) * (PI2 * T / R.period + (R.phase || 0))); }); }); }
        function drawActors(slot) { if (!M.actors) return; M.actors.forEach(function (A) { if (A.slot !== slot) return; var im = sp(A.sprite); if (!im) return;
            var w = A.w * SH, h = w * im.height / im.width, x = mod((A.x - scroll * A.parallax - T * A.drift) * SH + w, A.loop * SH) - w, y = A.y * SH + Math.sin(T * (A.bobF || 0) + A.x * 7) * (A.bob || 0) * SH; if (x > W || x + w < 0) return;
            if (A.tile) { for (var xx = x; xx < W; xx += A.loop * SH) g.drawImage(im, xx, y, w + 0.6, h); return; }   /* tile: faixa repetida a cada loop (ex.: trilho sob o trem; era 4 em diante) */
            function part(P) { var pi = sp(P.sprite); if (!pi) return; var a = PI2 * T / P.period + (P.phase || 0); if (P.flap) spinImg(pi, x + P.x * w, y + P.y * h, P.w * w, 0, Math.cos(a)); else spinImg(pi, x + P.x * w, y + P.y * h, P.w * w, a); }
            (A.parts || []).forEach(function (P) { if (P.back) part(P); }); g.drawImage(im, x, y, w, h); (A.parts || []).forEach(function (P) { if (!P.back) part(P); }); }); }

        /* ---- céu: nuvens, pássaros, raios ---- */
        function drawClouds() { M.clouds.groups.forEach(function (G) { g.globalAlpha = G.alpha; G.items.forEach(function (c) { var im = sp(c.s); if (!im) return; var w = c.w * SH, h = w * im.height / im.width, per = G.period * SH; var x = mod((c.x - scroll * G.parallax - T * G.drift) * SH + w, per) - w; g.drawImage(im, x, c.y * SH + Math.sin(T * 0.25 + c.x * 7) * 0.004 * SH, w, h); }); }); g.globalAlpha = 1; }
        function drawBirds() { var b = S[M.birds.sprite]; if (!b) return; var fw = b.img.width / b.frames; M.birds.flocks.forEach(function (f) { var tt = mod(T + f.phase, f.period); if (tt > f.duration) return; var p = tt / f.duration, sz = f.size * SH;
            for (var i = 0; i < f.n; i++) { var x = -sz * 1.5 + p * (W + sz * 6) - i * sz * 1.25 - (i % 2) * 4, y = f.y * SH + (i % 2 ? 1 : -1) * i * sz * 0.32 + Math.sin(T * 1.6 + i * 1.4) * sz * 0.22 + p * SH * 0.03; var fr = Math.floor(T * b.fps + i * 1.7) % b.frames; g.globalAlpha = f.alpha; g.drawImage(b.img, fr * fw, 0, fw, b.img.height, x, y, sz, sz); } }); g.globalAlpha = 1; }
        function drawRays() { var R = M.sunRays; if (!R) return; g.save(); g.globalCompositeOperation = R.blend; var ox = R.origin[0] * SH, oy = R.origin[1] * SH, len = R.length * SH;
          for (var i = 0; i < R.count; i++) { var a0 = R.angle0 + i * R.angleStep + Math.sin(T * 0.13 + i) * 0.03, wd = lerp(R.halfWidth, rnd(i, 40, 0)), al = lerp(R.alpha, 0.5 + 0.5 * Math.sin(T * R.pulse + i * 1.9));
            var gr = g.createLinearGradient(ox, oy, ox + Math.cos(a0) * len, oy + Math.sin(a0) * len); gr.addColorStop(0, 'rgba(' + R.rgb + ',' + (al * 1.6).toFixed(3) + ')'); gr.addColorStop(0.6, 'rgba(' + R.rgb + ',' + al.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + R.rgb + ',0)');
            g.fillStyle = gr; g.beginPath(); g.moveTo(ox, oy); g.lineTo(ox + Math.cos(a0 - wd) * len, oy + Math.sin(a0 - wd) * len); g.lineTo(ox + Math.cos(a0 + wd) * len, oy + Math.sin(a0 + wd) * len); g.closePath(); g.fill(); }
          g.restore(); }

        /* ---- névoa procedural ---- */
        function fogTex() { if (FOG) return FOG; var F = M.fogTexture; FOG = document.createElement('canvas'); FOG.width = F.w; FOG.height = F.h; var c = FOG.getContext('2d');
          for (var i = 0; i < F.blobs; i++) { var x = rnd(i, 60, 0) * F.w, y = F.h * (0.3 + rnd(i, 60, 1) * 0.5), r = F.h * (0.3 + rnd(i, 60, 2) * 0.45);
            [-F.w, 0, F.w].forEach(function (dx) { var gr = c.createRadialGradient(x + dx, y, 0, x + dx, y, r); gr.addColorStop(0, 'rgba(' + F.rgb + ',' + F.alpha + ')'); gr.addColorStop(1, 'rgba(' + F.rgb + ',0)'); c.fillStyle = gr; c.save(); c.translate(x + dx, y); c.scale(1.9, 0.42); c.translate(-(x + dx), -y); c.beginPath(); c.arc(x + dx, y, r, 0, 7); c.fill(); c.restore(); }); }
          return FOG; }
        function drawFog(f) { var t = fogTex(), h = f.height * SH, w = h * t.width / t.height, off = mod((scroll * f.parallax + T * f.drift) * SH, w); g.globalAlpha = f.alpha; for (var x = -off; x < W; x += w) g.drawImage(t, px(x), f.y * SH, w + 1 / DPR, h); g.globalAlpha = 1; }
        function drawHaze() { var H = M.haze, gr = g.createLinearGradient(0, H.y[0] * SH, 0, H.y[1] * SH); gr.addColorStop(0, 'rgba(' + H.rgb + ',0)'); gr.addColorStop(1, 'rgba(' + H.rgb + ',' + H.alpha + ')'); g.fillStyle = gr; g.fillRect(0, H.y[0] * SH, W, (H.y[1] - H.y[0]) * SH); }

        /* ---- vila: moinho, bandeiras das torres, forja, fumaça ---- */
        function drawMill() { var Q = M.mill; if (!Q || !millBody || !millBlade) return; tiles(LAY.mid, function (i, x, flip, G, k) { if (k !== Q.tile || !LAY.mid.imgs[k]) return; var r = Q.body.rect, hx = x + Q.hub[0] * G.w, hy = G.y + Q.hub[1] * G.h; if (hx < -G.w * 0.2 || hx > W + G.w * 0.2) return;
            g.drawImage(millBody, x + r[0] * G.w, G.y + r[1] * G.h, r[2] * G.w, r[3] * G.h);
            var B = Q.blade, s = B.widthFrac * G.w / millBlade.width, ang = T * PI2 / Q.secondsPerTurn, j;
            g.save(); g.translate(hx, hy); g.rotate(ang); g.lineCap = 'round';
            for (j = 0; j < B.count; j++) { g.rotate(PI2 / B.count); g.strokeStyle = '#2b1c16'; g.lineWidth = 11 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(B.axis[0] * (B.sparLenPx + 6) * s, B.axis[1] * (B.sparLenPx + 6) * s); g.stroke(); g.strokeStyle = '#8a5a3a'; g.lineWidth = 6 * s; g.stroke(); g.drawImage(millBlade, -B.pivotPx[0] * s, -B.pivotPx[1] * s, millBlade.width * s, millBlade.height * s); }
            g.fillStyle = '#2b1c16'; g.beginPath(); g.arc(0, 0, 17 * s, 0, 7); g.fill(); g.fillStyle = '#a9713f'; g.beginPath(); g.arc(0, 0, 12 * s, 0, 7); g.fill(); g.fillStyle = '#d9a25c'; g.beginPath(); g.arc(-2 * s, -2 * s, 5 * s, 0, 7); g.fill();
            g.restore(); }); }
        function drawTowerFlags() { var F = M.towerFlags; if (!F) return; midAnchors(M.midAnchors.towerFlags, function (x, y, id, G, a) { var im = sp(a.flag); if (!im || x < -F.width * SH || x > W + F.width * SH) return; var ph = F.pole * SH; stick(x, y + 2, y - ph, 0.003 * SH); drawFlag(im, x - 0.6, y - ph, F.width * SH, id * 1.3, F.amp); }); }
        function drawForge() { var F = M.forgeGlow; if (!F) return; midAnchors(M.midAnchors.forgeGlow, function (x, y, id) { if (x < -60 || x > W + 60) return; glow(x, y, F.radius * SH * (1 + 0.15 * Math.sin(T * 6 + id) + 0.1 * Math.sin(T * 17)), F.alpha + 0.2 * Math.sin(T * 8.3 + id)); }); }
        function stepSmoke(dt) { var Q = M.smoke; if (!Q) return; smokeAcc += dt; if (smokeAcc > Q.interval) { smokeAcc = 0; midAnchors(M.midAnchors.chimneys, function (x, y, id, G) { if (x < -60 || x > W + 80) return; SMOKE.push({ wx: x + G.off + (Math.random() - 0.5) * 3, y: y, age: 0, life: lerp(Q.life, Math.random()), vx: -Q.wind * SH * (0.5 + Math.random() * 0.5), vy: -Q.rise * SH * (0.8 + Math.random() * 0.4), r: Q.r0 * SH * (0.8 + Math.random() * 0.4), sd: Math.random() * 6 }); }); }
          for (var i = SMOKE.length - 1; i >= 0; i--) { var p = SMOKE[i]; p.age += dt; if (p.age > p.life) { SMOKE.splice(i, 1); continue; } p.vx -= Q.wind * SH * dt; p.vy *= (1 - 0.18 * dt); p.wx += p.vx * dt + Math.sin(p.age * 2 + p.sd) * 4 * dt; p.y += p.vy * dt; } }
        function drawSmoke() { var Q = M.smoke; if (!Q) return; var off = geom(LAY.mid).off; SMOKE.forEach(function (p) { var k = p.age / p.life, r = p.r + k * Q.grow * SH, x = p.wx - off, a = (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88) * Q.alpha; g.globalAlpha = a; g.fillStyle = Q.dark; g.beginPath(); g.arc(x + r * 0.12, p.y + r * 0.14, r, 0, 7); g.fill(); g.fillStyle = Q.light; g.beginPath(); g.arc(x - r * 0.10, p.y - r * 0.12, r * 0.84, 0, 7); g.fill(); }); g.globalAlpha = 1; }

        /* ---- espalhamento pseudoaleatório por célula, com distância mínima ----
           specs: grupos que disputam o mesmo espaço. box(spec,cand) devolve [x0,x1,y0,y1] em SH (x no mundo).
           Regra: candidato da célula i só é desenhado se nenhum outro candidato (de qualquer grupo) cuja caixa,
           aumentada de minGap, encoste na dele tiver prioridade maior (prioridade = rnd(i,seed,6)). É local e
           determinístico: depende só dos índices de célula, nunca da rolagem.                                   */
        function scatter(specs, minGap, reach, box, fn, same) { var all = [], vis = [];
          specs.forEach(function (spec, si) { var off = scroll * spec.parallax, i0 = Math.floor((off - reach) / spec.cell), i1 = Math.floor((off + W / SH + reach) / spec.cell);
            for (var i = i0; i <= i1; i++) { if (rnd(i, spec.seed, 0) >= spec.prob) continue; var yr = spec.yRange || spec.baseY;
              var c = { spec: spec, it: pick(spec.pool, rnd(i, spec.seed, 1)), i: i, wx: (i + 0.15 + 0.7 * rnd(i, spec.seed, 2)) * spec.cell, wy: lerp(yr, rnd(i, spec.seed, 3)), k: rnd(i, spec.seed, 4), flip: !!spec.flip && rnd(i, spec.seed, 5) < 0.5, p: rnd(i, spec.seed, 6) + si * 1e-7 };
              c.b = box(spec, c); if (!c.b) continue; c.x = (c.wx - off) * SH; c.y = c.wy * SH; all.push(c); } });
          all.forEach(function (c) { for (var j = 0; j < all.length; j++) { var d = all[j]; if (d === c || d.p <= c.p) continue; if (same && (d.it[0] || d.it.sprite || d.it.flag || d.it.type) === (c.it[0] || c.it.sprite || c.it.flag || c.it.type) && Math.abs(d.wx - c.wx) < same) return; if (c.b[0] - minGap < d.b[1] && d.b[0] - minGap < c.b[1] && c.b[2] - minGap < d.b[3] && d.b[2] - minGap < c.b[3]) return; } vis.push(c); });
          vis.sort(function (a, b) { return a.wy - b.wy; }); vis.forEach(fn); }
        function drawDecals() { var D = M.decals; if (!decalImg) return;
          scatter(D.groups, D.minGap, D.reach, function (G, c) { var r = D.atlas[c.it[0]], sc = D.pxScale * lerp(G.scale, c.k), w = r[2] * sc, h = r[3] * sc; c.w = w * SH; c.h = h * SH; return [c.wx - w / 2, c.wx + w / 2, c.wy - h, c.wy]; },
            function (d) { var r = D.atlas[d.it[0]]; if (d.flip) { g.save(); g.translate(d.x, 0); g.scale(-1, 1); g.drawImage(decalImg, r[0], r[1], r[2], r[3], -d.w / 2, d.y - d.h, d.w, d.h); g.restore(); } else g.drawImage(decalImg, r[0], r[1], r[2], r[3], d.x - d.w / 2, d.y - d.h, d.w, d.h); }, D.sameTypeGap); }
        function drawFlame(x, y, sz, ph) { var f = S.flame; if (!f) return; var fw = f.img.width / f.frames, fr = Math.floor(T * f.fps + ph) % f.frames, sy = 1 + 0.08 * Math.sin(T * 17 + ph * 3), Q = M.torch; glow(x, y - sz * 0.45, sz * (Q.glowRadius + 0.25 * Math.sin(T * 11 + ph)), Q.glowAlpha + 0.1 * Math.sin(T * 13 + ph * 2)); g.drawImage(f.img, fr * fw, 0, fw, f.img.height, x - sz / 2, y - sz * sy, sz, sz * sy); }
        function sprOf(it) { return sp(it.type === 'banner' ? 'pole' : it.type === 'torch' ? 'torch' : it.type === 'lantern' ? 'lantern' : it.sprite); }
        function rowBox(spec, c) { var it = c.it, s = sprOf(it); if (!s) return null; var h = lerp(it.h, c.k), w = h * s.width / fN(it) / s.height, l = it.type === 'banner' ? it.flagW : w / 2; c.h = h * SH; c.w = w * SH; return [c.wx - l, c.wx + w / 2, 0, 1]; }
        function drawRoadside() { var R = M.roadside; scatter([R], R.minGap, R.reach, rowBox, function (d) { var it = d.it, h = d.h, w = d.w, x = d.x, by = d.y, ph = d.i * 1.7, s = sprOf(it);
            if (it.type === 'banner') { var fl = sp(it.flag); if (fl) drawFlag(fl, x - w * 0.1, by - h + h * 0.085, it.flagW * SH, ph, it.amp); g.drawImage(s, x - w / 2, by - h, w, h); }
            else if (it.type === 'torch') { var Q = M.torch; drawFlame(x, by - h * Q.flameY, h * Q.flameSize, ph); g.drawImage(s, x - w / 2, by - h, w, h); drawFlame(x, by - h * (Q.flameY + 0.04), h * Q.flameSize * 0.7, ph + 2); }
            else if (it.type === 'lantern') { var N = M.lantern; g.drawImage(s, x - w / 2, by - h, w, h); glow(x, by - h * N.glowY, h * (N.glowRadius + 0.06 * Math.sin(T * 9 + ph)), N.glowAlpha + 0.12 * Math.sin(T * 7 + ph)); }
            else if (it.type === 'fire') { var C = it.fire, fz = h * C.size; glow(x, by - h * C.y - fz * 0.35, fz * (C.glow + 0.2 * Math.sin(T * 11 + ph)), C.glowAlpha + 0.08 * Math.sin(T * 13 + ph * 2)); drawFlame(x - fz * 0.16, by - h * C.y + fz * 0.04, fz * 0.72, ph + 1.3); g.drawImage(s, x - w / 2, by - h, w, h); drawFlame(x, by - h * C.y, fz, ph); drawFlame(x + fz * 0.2, by - h * C.y + fz * 0.06, fz * 0.6, ph + 2.6); if (C.sparks) sparks(C.sparks, x, by - h * C.y - fz * 0.5, fz, ph); }
            else if (it.type === 'critter') critter(s, it, x, by, w, h, ph);
            else if (it.type === 'vent') { var V = it.vent, e = mod(T + ph * 3.1, V.period), st = e < V.duration ? Math.pow(Math.sin(Math.PI * e / V.duration), 0.6) : 0; plume(V, x + (V.dx || 0) * w, by - h * V.y, d.i, V.idle + (1 - V.idle) * st); g.drawImage(s, x - w / 2, by - h, w, h); }
            else if (it.sway) { var Y = M.sway, kk = (Math.sin(T * Y.f1 + d.i * 1.3) * Y.a1 + Math.sin(T * Y.f2 + d.i * 2.9) * Y.a2 + Y.bias) * (it.swayAmp || 1); g.save(); g.translate(x, by); g.transform(1, 0, kk, 1, 0, 0); g.drawImage(s, fX(it, s, ph), 0, s.width / fN(it), s.height, -w / 2, -h, w, h); g.restore(); }
            else g.drawImage(s, fX(it, s, ph), 0, s.width / fN(it), s.height, x - w / 2, by - h, w, h); }, R.sameTypeGap); }
        function drawFg() { var F = M.fg, Y = M.sway; scatter([F], F.minGap, F.reach, rowBox, function (d) { var it = d.it, s = sp(it.sprite), h = d.h, w = d.w;
            if (it.sway) { var k = Math.sin(T * Y.f1 + d.i * 1.3) * Y.a1 + Math.sin(T * Y.f2 + d.i * 2.9) * Y.a2 + Y.bias; g.save(); g.translate(d.x, d.y); g.transform(1, 0, k, 1, 0, 0); g.drawImage(s, -w / 2, -h, w, h); g.restore(); } else g.drawImage(s, d.x - w / 2, d.y - h, w, h); }); }

        /* ---- poeira dourada ---- */
        function drawMotes() { var Q = M.motes; g.save(); g.globalCompositeOperation = Q.blend; for (var i = 0; i < Q.count; i++) { var sv = 0.4 + rnd(i, 100, 0) * 0.8, x = mod(rnd(i, 100, 1) * (W + 60) - (scroll * Q.parallax + T * Q.drift) * SH * sv, W + 60) - 30;
            var y = lerp(Q.yRange, rnd(i, 100, 2)) * SH + Math.sin(T * 0.8 * sv + i) * 0.013 * SH - mod(T * 0.006 * SH * sv, 0.045 * SH), r = lerp(Q.radius, rnd(i, 100, 3)) * SH, a = 0.15 + 0.5 * Math.pow(Math.sin(T * 1.4 * sv + i * 2.3), 2);
            g.fillStyle = 'rgba(' + Q.glowRgb + ',' + (a * 0.22).toFixed(3) + ')'; g.beginPath(); g.arc(x, y, r * 2.2, 0, 7); g.fill(); g.fillStyle = 'rgba(' + Q.rgb + ',' + a.toFixed(3) + ')'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.restore(); }

        /* ---- herói ---- */
        function heroGeom() { var H = M.hero; return { x: W * H.x, gy: M.groundY * SH, sz: H.size * SH }; }
        function stepPuffs(dt) { var H = M.hero, D = H.stepDust, q = heroGeom(), st = Math.floor(runT * H.fps / (H.frames / 2)); if (running && heroImg && st !== lastStep) { lastStep = st; for (var i = 0; i < D.perStep; i++) PUFF.push({ x: q.x - q.sz * 0.10 + Math.random() * q.sz * 0.08, y: q.gy - 1, age: 0, life: lerp(D.life, Math.random()), vy: -(0.012 + Math.random() * 0.02) * SH, r: lerp(D.radius, Math.random()) * SH * 0.6 }); }
          for (var j = PUFF.length - 1; j >= 0; j--) { var p = PUFF[j]; p.age += dt; if (p.age > p.life) { PUFF.splice(j, 1); continue; } p.x -= (running ? M.runSpeed * SH : 0) * dt * 0.85; p.y += p.vy * dt; } }
        function drawHero() { if (!heroImg) return; var H = M.hero, q = heroGeom(), f = Math.floor(runT * H.fps) % H.frames, bob = Math.abs(Math.sin(runT * H.fps / (H.frames / 2) * Math.PI));
          g.fillStyle = 'rgba(30,18,8,' + H.shadow.alpha + ')'; g.beginPath(); g.ellipse(q.x - q.sz * 0.02, q.gy + q.sz * 0.012, q.sz * (H.shadow.rx + 0.03 * bob), q.sz * H.shadow.ry, 0, 0, 7); g.fill();
          PUFF.forEach(function (p) { var k = p.age / p.life; g.globalAlpha = (1 - k) * 0.7; g.fillStyle = H.stepDust.color; g.beginPath(); g.arc(p.x, p.y, p.r + k * H.stepDust.radius[1] * SH, 0, 7); g.fill(); }); g.globalAlpha = 1;
          g.drawImage(heroImg, f * H.frameW, 0, H.frameW, H.frameH, Math.round(q.x - q.sz / 2), Math.round(q.gy - q.sz * H.footY), q.sz, q.sz); }

        function draw() {
          g.setTransform(DPR, 0, 0, DPR, 0, 0); g.imageSmoothingQuality = 'high';
          drawBackdrop();
          drawLayer(LAY.sky); drawClouds(); drawActors('sky'); drawBirds();
          if (LAY.far.imgs[0]) { drawProps('far', false); drawLayer(LAY.far); drawProps('far', true); drawRotors('far', true); g.fillStyle = M.farFill.color; g.fillRect(0, LAY.far.bottom * SH - 1, W, (LAY.ground.top - LAY.far.bottom) * SH + 3); drawFx('far'); drawHaze(); drawFog(M.fog[0]); }
          drawRays();
          drawMill(); drawActors('mid'); drawRotors('mid', false); drawProps('mid', false); drawLayer(LAY.mid); drawProps('mid', true); drawTowerFlags(); drawForge(); drawSmoke(); drawFx('mid'); if (LAY.far.imgs[0]) drawFog(M.fog[1]);
          drawProps('ground', false); drawLayer(LAY.ground); drawProps('ground', true); drawDecals(); drawRoadside();
          if (o.hero !== false) drawHero();
          drawMotes(); drawFg();
          var B = M.bottomShade, v = g.createLinearGradient(0, SH * B.from, 0, SH); v.addColorStop(0, 'rgba(' + B.rgb + ',0)'); v.addColorStop(1, 'rgba(' + B.rgb + ',' + B.alpha + ')'); g.fillStyle = v; g.fillRect(0, SH * B.from, W, SH * (1 - B.from));
          if (o.line) { g.fillStyle = 'rgba(255,0,255,.8)'; g.fillRect(0, M.groundY * SH, W, 1); }
          drawLoading();
          if (self.firstPaintMs == null) self.firstPaintMs = Math.round(performance.now() - t0);
        }
        function frame(now) { var dt = Math.min(0.05, (now - last) / 1000); last = now; if (!frozen) { T += dt; if (running) { scroll += M.runSpeed * dt; runT += dt; } stepSmoke(dt); stepPuffs(dt); } else stepSmoke(0.016); draw(); self.fps = dt > 0 ? 1 / dt : 0; raf = requestAnimationFrame(frame); }
        self = {
          meta: M, fps: 0, loaded: false, progress: 0, firstPaintMs: null, readyMs: null, ready: null,
          start: function () { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } return self; },
          stop: function () { cancelAnimationFrame(raf); raf = 0; return self; },
          setRunning: function (b) { running = !!b; return self; },
          set: function (t, freeze) { T = t; runT = t; scroll = t * M.runSpeed; SMOKE.length = 0; if (freeze != null) frozen = !!freeze; for (var i = 0; i < 300; i++) stepSmoke(0.016); return self; },
          resize: function (w, h) { resize(w, h); return self; },
          draw: draw,
          get state() { return { t: T, scroll: scroll, scrollPx: scroll * SH, running: running, width: W, height: SH, dpr: DPR, smoke: SMOKE.length, loaded: self.loaded, progress: self.progress, firstPaintMs: self.firstPaintMs, readyMs: self.readyMs }; }
        };
        draw();                                   // primeiro quadro síncrono: nunca fica preto
        if (o.autoStart !== false) self.start();
        return self;
      }
    });
  }
  var EonScene = { create: create, rnd: rnd };
  if (typeof module !== 'undefined' && module.exports) module.exports = EonScene; else root.EonScene = EonScene;
})(typeof window !== 'undefined' ? window : this);
