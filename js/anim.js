/* Eonbound — motor de animação por recortes com ossos (fps-ff).
   Uso:
     await Anim.load('era2_hero_t0', 'assets/anim/rig/era2_hero_t0/');
     Anim.draw(ctx, 'era2_hero_t0', 'run', t, x, groundY, size, {weapon:{img, grip:[fx,fy], angle:90}});
   x, groundY = ponto dos pés no chão (pixel do canvas). size = lado em que o sprite parado de 512 seria desenhado.
   t = segundos desde o início do estado. Estados: 'idle', 'run' (os demais entram depois de aprovado).
   Anim.groundSpeed('era2_hero_t0', size) = px/s em que o chão deve rolar para os pés não patinarem.
   Espaço interno: o mesmo do sprite parado (512x512), pés em y=486 (0,95). */
(function(){
  const RIGS = {};
  const FPS = 12, RUN_FRAMES = 8;          // corrida: 8 quadros a 12 fps (ciclo de 0,667 s)
  const RUN_CYCLE = RUN_FRAMES / FPS;
  const FOOT_Y = 486, CX = 256;
  const D = Math.PI / 180;

  // matrizes 2D [a,b,c,d,e,f] no formato do canvas
  const mul = (m, n) => [m[0]*n[0]+m[2]*n[1], m[1]*n[0]+m[3]*n[1], m[0]*n[2]+m[2]*n[3], m[1]*n[2]+m[3]*n[3], m[0]*n[4]+m[2]*n[5]+m[4], m[1]*n[4]+m[3]*n[5]+m[5]];
  const T = (x, y) => [1,0,0,1,x,y];
  const R = a => { const c = Math.cos(a), s = Math.sin(a); return [c,s,-s,c,0,0]; };
  const S = (x, y) => [x,0,0,y,0,0];
  const ap = (m, p) => [m[0]*p[0]+m[2]*p[1]+m[4], m[1]*p[0]+m[3]*p[1]+m[5]];

  function loadImg(src){ return new Promise((ok, err) => { const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src; }); }

  async function load(id, base){
    const rig = await (await fetch(base + 'rig.json')).json();
    await Promise.all(Object.values(rig.parts).map(async p => { p.img = await loadImg(base + p.file); }));
    if (rig.mod){ const md = rig.mod, all = [md.head, md.ring, md.upperW, md.foreW, md.thighF, md.thighB, md.shinF, md.shinB, ...Object.values(md.hair), ...Object.values(md.eyes)].filter(Boolean);
      await Promise.all(all.map(async l => { l.img = await loadImg(base + l.file); })); }
    if (rig.type === 'profile'){ rig.stride2 = 34; RIGS[id] = rig; return rig; }
    const P = rig.parts;
    rig.legLen = P.legF.points.foot[1] - P.legF.pivot[1];
    rig.stride2 = 22;
    rig.stride = rig.legLen * Math.sin(22 * D);            // meio passo (px no espaço 512)
    RIGS[id] = rig;
    return rig;
  }

  // corte de arma (bbox do alfa) para escalar igual ao battle.js
  const trimCache = new WeakMap();
  function trim(img){
    if (trimCache.has(img)) return trimCache.get(img);
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) if (d[(y*c.width+x)*4+3] > 20) { if (x<x0)x0=x; if (x>x1)x1=x; if (y<y0)y0=y; if (y>y1)y1=y; }
    const r = { w: x1-x0, h: y1-y0 }; trimCache.set(img, r); return r;
  }

  const ease = s => (1 - Math.cos(Math.PI * s)) / 2;

  /* Pose = ângulos locais (rad, horário) + escalas. Corrida: o pé de apoio recua em linha reta e velocidade
     constante (casa com o chão), o pé no ar volta com aceleração suave e a perna encurta para não arrastar. */
  function pose(rig, state, t){
    const o = { up: -20 * D, fore: 15 * D, lean: 0, head: 0, armF: 0, armW: 0, legF: 0, legB: 0, sF: 1, sB: 1, scarf: 0, scarfS: 1, stanceF: true, stanceB: true, breath: 1 };
    if (state === 'run'){
      const f = Math.floor((t % RUN_CYCLE) / RUN_CYCLE * RUN_FRAMES);   // quadro inteiro: 8 poses fixas
      const p = (f + 0.5) / RUN_FRAMES;   // meio quadro: nenhum quadro cai na troca exata de apoio
      o.lean = 8 * D;
      const leg = q => {
        q = ((q % 1) + 1) % 1;
        const X = rig.stride;
        if (q < 0.5) return { x: X * (1 - 4 * q), s: 1, st: true };
        const s = (q - 0.5) * 2;
        return { x: -X + 2 * X * ease(s), s: 1 - 0.24 * Math.sin(Math.PI * s), st: false };
      };
      const a = leg(p), b = leg(p + 0.5);
      // ângulo de mundo tal que o pé fique em x: vetor (0,L) girado θ horário => x = -L sin θ
      o.legF = -Math.asin(a.x / rig.legLen) - o.lean; o.sF = a.s; o.stanceF = a.st;
      o.legB = -Math.asin(b.x / rig.legLen) - o.lean; o.sB = b.s; o.stanceB = b.st;
      const c = Math.cos(2 * Math.PI * p);
      o.armF = 38 * D * c - o.lean;              // braço de trás balança oposto à perna da frente
      o.armW = -6 * D * c - 22 * D - o.lean;     // braço da arma: firme à frente, quase sem balanço (arma não chicoteia)
      o.up = -22 * D - 5 * D * c; o.fore = 70 * D + 4 * D * c;   // correndo: lâmina à frente, acima das pernas   // braço com cotovelo (mundo): guarda baixa, lâmina à frente
      o.head = -3 * D + 1 * D * Math.sin(4 * Math.PI * p);
      o.scarf = -38 * D + 8 * D * Math.sin(2 * Math.PI * p * 2 + 1);
      o.scarfS = 1 + 0.06 * Math.sin(2 * Math.PI * p * 2);
    } else if (state === 'attack'){ // golpe (s1): prepara, corta, volta — 0,6 s
      const u = Math.min(1, t / 0.6), k1 = ease(Math.min(1, u / 0.3)), k2 = ease(Math.max(0, Math.min(1, (u - 0.3) / 0.25))), k3 = ease(Math.max(0, (u - 0.7) / 0.3));
      o.lean = (-4 * k1 + 14 * k2) * (1 - k3) * D;
      // prepara com o braço para cima e para TRÁS (atrás da cabeça), passa por cima e corta para a frente
      o.up = (k2 > 0 ? 140 + 180 * k2 : -8 + 148 * k1) * D; if (k3 > 0) o.up = (320 + 32 * k3) * D;
      o.fore = (k2 > 0 ? -30 + 130 * k2 : 52 - 82 * k1) * D; if (k3 > 0) o.fore = (100 - 48 * k3) * D;
      o.armF = (10 * k1 - 25 * k2) * (1 - k3) * D; o.head = (-3 * k1 + 4 * k2) * (1 - k3) * D; o.scarf = -40 * D + 12 * D * k2 * (1 - k3);
      o.wBack = u > 0.06 && u < 0.4;
      o.trail = u > 0.28 && u < 0.62 ? 1 - Math.abs(u - 0.45) / 0.17 : 0;
    } else { // idle: respiração (o tronco sobe 1-2 px; pés parados)
      const b = Math.sin(Math.PI * t);          // ciclo de 2 s (24 quadros a 12 fps)
      o.breath = 1 + 0.018 * b;
      o.armF = 4 * D + 3 * D * b; o.armW = -20 * D - 1.5 * D * b;
      o.up = -8 * D - 2 * D * b; o.fore = 52 * D + 2.5 * D * b;
      o.head = 1.5 * D * b;
      o.scarf = -40 * D + 4 * D * Math.sin(Math.PI * t + 1); o.scarfS = 1 + 0.03 * Math.sin(2 * Math.PI * t);
    }
    if (rig.mod && rig.mod.thighF) legs2(rig, state, t, o);
    return o;
  }

  /* Pernas com joelho (IK de 2 ossos). Alvos dos pés em px do espaço 512, relativos ao centro (CX) e ao chão (FOOT_Y).
     Corrida copiada da folha por quadros aprovada: contato, apoio (joelho dobra, corpo desce ~2 px), passagem (pé de trás
     passa sob o quadril com o joelho alto) e impulso; o pé de apoio recua em linha reta no chão (não patina). */
  function legs2(rig, state, t, o){
    const X = rig.stride2;
    if (state === 'run'){
      const f = Math.floor((t % RUN_CYCLE) / RUN_CYCLE * RUN_FRAMES), p = (f + 0.5) / RUN_FRAMES;
      const foot = q => { q = ((q % 1) + 1) % 1;
        if (q < 0.5) return [X * (1 - 4 * q) + 4, 0, true];
        const s = (q - 0.5) * 2; return [-X + 2 * X * ease(s) + 4, -24 * Math.sin(Math.PI * s) * (s < 0.5 ? 1 : 0.8), false]; };
      o.footF = foot(p); o.footB = foot(p + 0.5);
      o.hipH = 85 + 2 * Math.cos(4 * Math.PI * p);       // mais baixo no meio do apoio
      o.lean = 6 * D;
      o.free = 32 * D * Math.cos(2 * Math.PI * p);          // braço livre (de trás) oposto à perna da frente
    } else if (state === 'attack'){
      const u = Math.min(1, t / 0.6), k1 = ease(Math.min(1, u / 0.3)), k2 = ease(Math.max(0, Math.min(1, (u - 0.3) / 0.25))), k3 = ease(Math.max(0, (u - 0.7) / 0.3));
      const step = 16 * k2 * (1 - k3);                       // meio passo do pé da frente no corte
      o.footF = [16 + step, -6 * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.3) / 0.2))) * (1 - k3), true];
      o.footB = [-16 - 4 * k1 * (1 - k3), 0, true];
      o.hipH = 88 - (7 * k1 + 4 * k2) * (1 - k3);            // joelhos dobram na preparação
      o.lean = (-5 * k1 + 7 * k2) * (1 - k3) * D;            // gira pelo quadril, sem tombar
      o.free = (-25 * k1 + 35 * k2) * (1 - k3) * D;
    } else {
      const b = Math.sin(Math.PI * t);
      o.footF = [14, 0, true]; o.footB = [-12, 0, true];
      o.hipH = 88 + 0.8 * b; o.free = 4 * D + 3 * D * b;
    }
  }

  function build(rig, o, weapon, look = {}, t = 0){
    const P = rig.parts, tor = P.torso, list = [], md = rig.mod;
    const at = (part, m, pivot) => mul(m, T(-pivot[0], -pivot[1]));
    // raiz = quadril (pivô do tronco); y resolvido depois para o pé de apoio tocar o chão
    const legM = (root, hipPt, ang, sy) => mul(mul(mul(root, R(o.lean)), T(hipPt[0]-tor.pivot[0], hipPt[1]-tor.pivot[1])), mul(R(ang), S(1, sy)));
    const footOf = (root, name, hip, ang, sy) => { const m = mul(legM(root, hip, ang, sy), T(-P[name].pivot[0], -P[name].pivot[1])), pt = P[name].points;
      return [0, Math.max(ap(m, pt.heel || pt.foot)[1], ap(m, pt.toe || pt.foot)[1])]; };   // canto mais baixo da sola
    const footX = (root, name, hip, ang, sy) => ap(mul(legM(root, hip, ang, sy), T(-P[name].pivot[0], -P[name].pivot[1])), P[name].points.foot)[0];
    const K = md && md.thighF;
    let root = T(CX, 0);
    let ymax = -1e9;
    if (K){ ymax = o.hipH; o.stanceF = o.stanceB = false; }
    if (o.stanceF) ymax = Math.max(ymax, footOf(root, 'legF', tor.points.hipF, o.legF, o.sF)[1]);
    if (o.stanceB) ymax = Math.max(ymax, footOf(root, 'legB', tor.points.hipB, o.legB, o.sB)[1]);
    root = T(CX, FOOT_Y - ymax);
    if (!K) rig._feet = { F: [footX(root,'legF',tor.points.hipF,o.legF,o.sF), footOf(root,'legF',tor.points.hipF,o.legF,o.sF)[1], o.stanceF], B: [footX(root,'legB',tor.points.hipB,o.legB,o.sB), footOf(root,'legB',tor.points.hipB,o.legB,o.sB)[1], o.stanceB] };
    const torM = mul(mul(root, R(o.lean)), S(1, o.breath));
    const child = (pt, ang, sx = 1, sy = 1) => mul(mul(torM, T(pt[0]-tor.pivot[0], pt[1]-tor.pivot[1])), mul(R(ang), S(sx, sy)));
    if (K){
      const ik = (hipPt, foot, th, sh) => {
        const H = ap(torM, [hipPt[0] - tor.pivot[0], hipPt[1] - tor.pivot[1]]);
        const Fp = [CX + foot[0], FOOT_Y + foot[1]];
        const L1 = th.knee[1] - th.pivot[1], L2 = sh.sole[1] - sh.pivot[1];
        let dx = Fp[0] - H[0], dy = Fp[1] - H[1], d = Math.hypot(dx, dy); const dm = (L1 + L2) * 0.999;
        if (d > dm){ dx *= dm / d; dy *= dm / d; d = dm; }
        const a0 = Math.atan2(dy, dx), al = Math.acos(Math.max(-1, Math.min(1, (L1*L1 + d*d - L2*L2) / (2 * L1 * d))));
        const ka = a0 - al, Kp = [H[0] + L1 * Math.cos(ka), H[1] + L1 * Math.sin(ka)];   // joelho para a frente
        const sa = Math.atan2(H[1] + dy - Kp[1], H[0] + dx - Kp[0]);
        const thM = mul(mul(T(H[0], H[1]), R(ka - Math.PI / 2)), T(-th.pivot[0], -th.pivot[1]));
        const shM = mul(mul(T(Kp[0], Kp[1]), R(sa - Math.PI / 2)), T(-sh.pivot[0], -sh.pivot[1]));
        return { thM, shM, sole: ap(shM, sh.sole), heel: ap(shM, sh.heel), toe: ap(shM, sh.toe) };
      };
      const lb = ik(tor.points.hipB, o.footB, md.thighB, md.shinB), lf = ik(tor.points.hipF, o.footF, md.thighF, md.shinF);
      rig._feet = { F: [lf.sole[0], Math.max(lf.heel[1], lf.toe[1]), o.footF[2]], B: [lb.sole[0], Math.max(lb.heel[1], lb.toe[1]), o.footB[2]] };
      // a sola não pode afundar: se um canto do pé de apoio passou do chão, sobe o quadril e refaz
      // a sola não afunda: o canto mais baixo de cada pé fica no chão ou acima (a ponta/calcanhar inclinados não atravessam)
      const oF = rig._feet.F[1] - FOOT_Y, oB = rig._feet.B[1] - FOOT_Y;
      if ((oF > 0.3 || oB > 0.3) && (o._fixed || 0) < 4){ o._fixed = (o._fixed || 0) + 1; if (oF > 0.3) o.footF = [o.footF[0], o.footF[1] - oF, o.footF[2]]; if (oB > 0.3) o.footB = [o.footB[0], o.footB[1] - oB, o.footB[2]]; return build(rig, o, weapon, look, t); }
      list.push(['', lb.thM, md.thighB.img, md.thighB.w, md.thighB.h], ['', lb.shM, md.shinB.img, md.shinB.w, md.shinB.h]);
      list.push(['', lf.thM, md.thighF.img, md.thighF.w, md.thighF.h], ['', lf.shM, md.shinF.img, md.shinF.w, md.shinF.h]);
    } else {
      const legBm = legM(root, tor.points.hipB, o.legB, o.sB), legFm = legM(root, tor.points.hipF, o.legF, o.sF);
      list.push(['legB', at(0, legBm, P.legB.pivot)]);
      list.push(['legF', at(0, legFm, P.legF.pivot)]);
    }
    list.push(['scarf', at(0, child(tor.points.scarf, o.scarf, o.scarfS, 1.35), P.scarf.pivot)]);
    if (md){
      // cabeça modular (do sprite aprovado): base careca + cabelo + olhos, girando no pescoço
      const hm = child(tor.points.neck, o.head), nk = md.neck, L = l => list.push(['', mul(hm, T(l.x - nk[0], l.y - nk[1])), l.img, l.w, l.h]);
      list.torsoIdx = list.length;
      list.push(['torso', at(0, torM, tor.pivot)]);   // tronco antes da cabeça: o anel do cachecol original vem por cima
      list.headIdx = list.length;
      L(md.head);
      const blink = (t % 3.3) > 1.5 && (t % 3.3) < 1.62 && look.eyes !== 'closed';
      const ey = blink ? 'closed' : (look.eyes || 'orig'); if (md.eyes[ey]) L(md.eyes[ey]);
      L(md.hair[look.hair || 'orig'] || md.hair.orig);
      list.push(['', mul(hm, T(md.ring.x - nk[0], md.ring.y - nk[1])), md.ring.img, md.ring.w, md.ring.h]);
    } else {
      list.push(['head', at(0, child(tor.points.neck, o.head), P.head.pivot)]);
      list.push(['torso', at(0, torM, tor.pivot)]);
    }
    if (!md) list.push(['armF', at(0, child(tor.points.shoulderF, o.armF), P.armF.pivot)]);
    if (md){
      // braço livre = braço de trás (longe da câmera), atrás do tronco, balançando
      list.splice(list.torsoIdx, 0, ['armF', at(0, child(tor.points.shoulderW, (o.free ?? o.armF) - o.lean), P.armF.pivot)]); list.torsoIdx++; list.headIdx++;
      // braço da arma com cotovelo; a mão fecha sobre o cabo (cabo desenhado entre o braço e o punho)
      const U = md.upperW, F = md.foreW;
      const um = child(tor.points.shoulderF, o.up - o.lean), umP = mul(um, T(-U.pivot[0], -U.pivot[1]));
      const el = ap(umP, U.elbow);
      const fm = mul(T(el[0], el[1]), R(o.fore)), fmP = mul(fm, T(-F.pivot[0], -F.pivot[1]));
      // arma no braço da FRENTE (mais perto da câmera), na frente do tronco
      list.push(['', umP, U.img, U.w, U.h]);
      if (weapon && weapon.img){
        const gun = weapon.type === 'gun', tr = trim(weapon.img), Lw = 512 * (gun ? 0.42 : 0.52), k = Lw / Math.max(tr.w, tr.h);
        const g = ap(fmP, F.grip);
        // espada: lâmina na direção do eixo da mão (perpendicular ao antebraço); arma de fogo: cano na direção do antebraço
        const wa = gun ? o.fore + (weapon.angle || 0) * D : o.fore + ((weapon.angle ?? 90) - 90) * D;
        list.push(['', mul(mul(T(g[0], g[1]), R(wa)), mul(S(k, k), T(-weapon.grip[0] * weapon.img.width, -weapon.grip[1] * weapon.img.height))), weapon.img, weapon.img.width, weapon.img.height]);
        rig._tip = { g, wa, len: k * Math.max(tr.w, tr.h) * 0.75, trail: o.trail || 0 };
      }
      const armStart = list.length - (weapon && weapon.img ? 2 : 1);
      list.push(['', fmP, F.img, F.w, F.h]);
      if (o.wBack && list.headIdx != null){ const arm = list.splice(armStart); list.splice(list.headIdx, 0, ...arm); }   // na preparação braço e lâmina passam ATRÁS da cabeça
      return list;
    }
    const armWm = child(tor.points.shoulderW, o.armW);
    if (weapon && weapon.img){
      const tr = trim(weapon.img), L = 512 * 0.56, k = L / Math.max(tr.w, tr.h);
      const hand = mul(armWm, T(P.armW.points.hand[0]-P.armW.pivot[0], P.armW.points.hand[1]-P.armW.pivot[1]));
      // arma de pé (ângulo 90) em relação ao braço; o braço já gira, então a lâmina acompanha o balanço
      const armWorld = o.armW + o.lean, bladeWorld = 38 * D + 0.2 * armWorld;   // lâmina para cima e um pouco à frente
      const wa = ((weapon.angle ?? 90) - 90) * D + bladeWorld - armWorld;
      const wm = mul(mul(hand, R(wa)), mul(S(k, k), T(-weapon.grip[0] * weapon.img.width, -weapon.grip[1] * weapon.img.height)));
      list.push(['weapon', wm, weapon.img]);
    }
    list.push(['armW', at(0, armWm, P.armW.pivot)]);
    return list;
  }

  /* ===== Kael em PERFIL ESTRITO (rig.type 'profile') =====
     Pernas com joelho (IK), braço da arma = braço da FRENTE (perto da câmera), braço de trás livre.
     Golpe: na preparação a lâmina vai para TRÁS das costas (desenhada atrás do corpo), passa por cima
     e corta à frente do corpo; pés plantados, joelhos dobram, meio passo do pé da frente. */
  function poseP(rig, state, t){
    const o = { lean: 0, head: 0, scarf: 0, upN: -10 * D, foreN: 50 * D, upF: 0, foreF: 0, hipH: 0, wBehind: false };
    const X = rig.stride2;
    if (state === 'run'){
      const f = Math.floor((t % RUN_CYCLE) / RUN_CYCLE * RUN_FRAMES), p = (f + 0.5) / RUN_FRAMES, c = Math.cos(2 * Math.PI * p);
      const foot = q => { q = ((q % 1) + 1) % 1;
        if (q < 0.5) return [X * (1 - 4 * q) + 6, 0, true];
        const s = (q - 0.5) * 2; return [-X + 2 * X * ease(s) + 6, -30 * Math.sin(Math.PI * s), false]; };
      o.footN = foot(p); o.footF = foot(p + 0.5);
      o.hipH = 0.93 + 0.025 * Math.cos(4 * Math.PI * p);   // fração do comprimento da perna; mais baixo no apoio
      o.lean = 7 * D; o.head = -4 * D + 1.5 * D * Math.sin(4 * Math.PI * p);
      o.upN = -28 * D - 5 * D * c; o.foreN = 42 * D + 4 * D * c;
      o.upF = 38 * D * c; o.foreF = o.upF - 25 * D - 10 * D * Math.max(0, c);
      o.scarf = 35 * D + 8 * D * Math.sin(4 * Math.PI * p + 1);
    } else if (state === 'attack'){
      const u = Math.min(1, t / 0.6), k1 = ease(Math.min(1, u / 0.3)), k2 = ease(Math.max(0, Math.min(1, (u - 0.3) / 0.22))), k3 = ease(Math.max(0, (u - 0.68) / 0.32));
      const step = 18 * k2 * (1 - k3);
      o.footN = [16 + step, -7 * Math.sin(Math.PI * Math.min(1, Math.max(0, (u - 0.28) / 0.2))) * (1 - k3), true];
      o.footF = [-14 - 5 * k1 * (1 - k3), 0, true];
      o.hipH = 0.95 - (0.07 * k1 + 0.05 * k2) * (1 - k3);
      o.lean = (-6 * k1 + 9 * k2) * (1 - k3) * D;
      // corte horizontal: braço recua (lâmina atrás das costas), avança e corta à frente
      o.upN = (k3 > 0 ? -60 + 50 * k3 : k2 > 0 ? 95 - 155 * k2 : -10 + 105 * k1) * D;
      o.foreN = (k3 > 0 ? 100 - 50 * k3 : k2 > 0 ? -90 + 190 * k2 : 50 - 140 * k1) * D;
      o.wBehind = o.upN > -15 * D && u > 0.04;
      o.upF = (-20 * k1 + 30 * k2) * (1 - k3) * D; o.foreF = o.upF - 20 * D;
      o.head = (-4 * k1 + 5 * k2) * (1 - k3) * D; o.scarf = 30 * D + 15 * D * k2 * (1 - k3);
      o.trail = u > 0.3 && u < 0.55 ? 1 : 0;
    } else {
      const b = Math.sin(Math.PI * t);
      o.footN = [14, 0, true]; o.footF = [-10, 0, true];
      o.hipH = 0.965 + 0.008 * b; o.lean = 1 * D;
      o.upN = -10 * D - 2 * D * b; o.foreN = 50 * D + 2 * D * b;
      o.upF = 6 * D + 3 * D * b; o.foreF = o.upF - 12 * D;
      o.head = 1.2 * D * b; o.scarf = 22 * D + 4 * D * Math.sin(Math.PI * t + 1);
    }
    return o;
  }

  function buildP(rig, o, weapon, look, t){
    const P = rig.parts, tor = P.torso, list = [];
    const L1 = P.thighN.knee[1] - P.thighN.pivot[1], L2 = P.shinN.sole[1] - P.shinN.pivot[1];
    const hipOff = tor.hipN[1] - tor.pivot[1];
    const root = T(CX, FOOT_Y - (L1 + L2) * o.hipH - hipOff);
    const torM = mul(root, R(o.lean));
    const at = (pt) => ap(torM, [pt[0] - tor.pivot[0], pt[1] - tor.pivot[1]]);
    const put = (part, m) => list.push(['', mul(m, T(-part.pivot[0], -part.pivot[1])), part.img, part.w, part.h]);
    const ik = (hipPt, foot, th, sh) => {
      const H = at(hipPt), Fp = [CX + foot[0], FOOT_Y + foot[1]];
      const l1 = th.knee[1] - th.pivot[1], l2 = sh.sole[1] - sh.pivot[1];
      let dx = Fp[0] - H[0], dy = Fp[1] - H[1], d = Math.hypot(dx, dy); const dm = (l1 + l2) * 0.999;
      if (d > dm){ dx *= dm / d; dy *= dm / d; d = dm; }
      const a0 = Math.atan2(dy, dx), al = Math.acos(Math.max(-1, Math.min(1, (l1*l1 + d*d - l2*l2) / (2 * l1 * d))));
      const ka = a0 - al, Kp = [H[0] + l1 * Math.cos(ka), H[1] + l1 * Math.sin(ka)];
      const sa = Math.atan2(H[1] + dy - Kp[1], H[0] + dx - Kp[0]);
      const thM = mul(T(H[0], H[1]), R(ka - Math.PI / 2)), shM = mul(T(Kp[0], Kp[1]), R(sa - Math.PI / 2));
      const shP = mul(shM, T(-sh.pivot[0], -sh.pivot[1]));
      return { thM, shM, low: Math.max(ap(shP, sh.heel)[1], ap(shP, sh.toe)[1]) };
    };
    let lf, ln;
    for (let i = 0; i < 4; i++){   // sola nunca afunda
      lf = ik(tor.hipF, o.footF, P.thighF, P.shinF); ln = ik(tor.hipN, o.footN, P.thighN, P.shinN);
      const eF = lf.low - FOOT_Y, eN = ln.low - FOOT_Y; if (eF <= 0.3 && eN <= 0.3) break;
      if (eF > 0.3) o.footF = [o.footF[0], o.footF[1] - eF, o.footF[2]]; if (eN > 0.3) o.footN = [o.footN[0], o.footN[1] - eN, o.footN[2]];
    }
    rig._feet = { F: [0, lf.low, o.footF[2]], B: [0, ln.low, o.footN[2]] };
    const neck = at(tor.neck), sc = at(tor.scarf);
    put(P.scarf, mul(T(sc[0], sc[1]), R(o.scarf + o.lean)));
    const sF = at(tor.shoulderF), uF = mul(T(sF[0], sF[1]), R(o.upF + o.lean)); put(P.upperF, uF);
    const eF = ap(mul(uF, T(-P.upperF.pivot[0], -P.upperF.pivot[1])), P.upperF.elbow); put(P.foreF, mul(T(eF[0], eF[1]), R(o.foreF + o.lean)));
    const behind = list.length;
    put(P.thighF, lf.thM); put(P.shinF, lf.shM);
    put(P.thighN, ln.thM); put(P.shinN, ln.shM);
    put(P.head, mul(T(neck[0], neck[1]), R(o.head + o.lean)));
    put(P.torso, torM);
    const sN = at(tor.shoulderN), uN = mul(T(sN[0], sN[1]), R(o.upN)); put(P.upperN, uN);
    const eN = ap(mul(uN, T(-P.upperN.pivot[0], -P.upperN.pivot[1])), P.upperN.elbow);
    const fN = mul(T(eN[0], eN[1]), R(o.foreN)), fNP = mul(fN, T(-P.foreN.pivot[0], -P.foreN.pivot[1]));
    if (weapon && weapon.img){
      const gun = weapon.type === 'gun', tr = trim(weapon.img), Lw = 512 * (gun ? 0.4 : 0.5), k = Lw / Math.max(tr.w, tr.h);
      const g = ap(fNP, P.foreN.grip);
      const wa = gun ? o.foreN + (weapon.angle || 0) * D : o.foreN + ((weapon.angle ?? 90) - 90) * D;
      const item = ['', mul(mul(T(g[0], g[1]), R(wa)), mul(S(k, k), T(-weapon.grip[0] * weapon.img.width, -weapon.grip[1] * weapon.img.height))), weapon.img, weapon.img.width, weapon.img.height];
      if (o.wBehind) list.splice(behind, 0, item); else list.push(item);
    }
    list.push(['', fNP, P.foreN.img, P.foreN.w, P.foreN.h]);
    return list;
  }

  function draw(ctx, id, state, t, x, groundY, size, opts = {}){
    const rig = RIGS[id]; if (!rig) return false;
    if (rig.type === 'profile'){
      const k = size / 512, base = [k, 0, 0, k, x - CX * k, groundY - FOOT_Y * k];
      ctx.save();
      for (const [, m, img, w, h] of buildP(rig, poseP(rig, state, t), opts.weapon, opts.look || {}, t)){ ctx.setTransform(...mul(base, m)); ctx.drawImage(img, 0, 0, w, h); }
      ctx.restore(); return true;
    }
    const o = pose(rig, state, t);
    const k = size / 512;
    const base = [k, 0, 0, k, x - CX * k, groundY - FOOT_Y * k];
    ctx.save();
    for (const [name, m, img, w, h] of build(rig, o, opts.weapon, opts.look, t)){
      const M = mul(base, m);
      ctx.setTransform(...M);
      if (img && w) ctx.drawImage(img, 0, 0, w, h);
      else if (img) ctx.drawImage(img, 0, 0);
      else { const p = rig.parts[name]; ctx.drawImage(p.img, 0, 0, p.w, p.h); }
    }
    ctx.restore();
    return true;
  }

  function groundSpeed(id, size){
    const rig = RIGS[id]; if (!rig) return 0;
    // o pé de apoio percorre 2*stride em meio ciclo
    return (4 * ((rig.mod && rig.mod.thighF) || rig.type === 'profile' ? rig.stride2 : rig.stride) / RUN_CYCLE) * size / 512;
  }

  // diagnóstico: posição x do pé e y da sola mais baixa (espaço 512) de cada perna no quadro t
  function feet(id, state, t){ const rig = RIGS[id]; if (rig.type === 'profile') buildP(rig, poseP(rig, state, t)); else build(rig, pose(rig, state, t)); return rig._feet; }

  window.Anim = { load, draw, groundSpeed, feet, FPS, RUN_FRAMES, RUN_CYCLE };
})();
