'use strict';
/* ================= MODO DONO + PRÉVIA DA ARTE (só no APP DE TESTE: TEST_BUILD, index.html) — v0.12.5 =================
   Um item no MENU da batalha ("Teste"), FORA da regra de nível, que abre uma tela cheia registrada por Screens.register('artprev').
   - MODO DONO: save SEPARADO (chave eras_owner_v1; o save real fica intocado e volta ao sair), selo "MODO DONO" fixo no topo, todas as telas
     existentes liberadas (fbUnl devolve verdadeiro com OWNER_MODE) e atalhos (nível, asa, era, pedras, ouro, gemas).
   - PRÉVIA DA ARTE: cartões montados por uma TABELA de dados; um tocador genérico de folha (.png + .json: quadros, fps, célula, pads, feetY, âncora)
     desenha em tamanho real sobre uma faixa de chão. As imagens são carregadas SÓ ao abrir o cartão e soltas ao sair. Estado cujo arquivo não
     existe some; cartão sem nenhum estado não abre. A versão de loja não tem nada disto (STORE_BUILD = true). */
(function(){
if (typeof TEST_BUILD === 'undefined' || !TEST_BUILD) return;
const A = 'assets/anim/', R = A + 'hyb/R/', EQ = A + 'equip/preview/', PT = A + 'pets/', MT = A + 'mounts/', PS = R + 'pistol/';
const kael = st => ({ png: R + 'kael_' + st + '_era2_t1.png', json: R + 'kael_' + st + '_body.json' });   // garoto atual: folha composta de 256 + .json do corpo
const KI = kael('idle');
const ph = (n, st) => A + 'hyb/phase' + n + '/kael_' + st;
const pet = (sp, nm) => ({ t: nm, s: [['Parado', [PT + sp + '_idle']], ['Andando', [PT + sp + '_run']], ['Ataque 1', [PT + sp + '_atk1']], ['Ataque 2', [PT + sp + '_atk2']], ['Ataque 3', [PT + sp + '_atk3']],
  ['Médio parado', [PT + sp + '_mid_idle']], ['Médio andando', [PT + sp + '_mid_run']], ['Médio ataque', [PT + sp + '_mid_atk1']], ['Evoluído parado', [PT + sp + '_evo_idle']], ['Evoluído andando', [PT + sp + '_evo_run']], ['Evoluído ataque', [PT + sp + '_evo_atk1']]] });
const mount = (m, nm) => ({ t: nm, s: [['Parado', [MT + 'kael_' + m + '_idle_era2_t1']], ['Correndo', [MT + 'kael_' + m + '_run_era2_t1']], ['Golpe', [MT + 'kael_' + m + '_attack_era2_t1']],
  ['3 estrelas parado', [MT + 'kael_' + m + '_idle_3star']], ['3 estrelas correndo', [MT + 'kael_' + m + '_run_3star']], ['5 estrelas parado', [MT + 'kael_' + m + '_idle_5star']], ['5 estrelas correndo', [MT + 'kael_' + m + '_run_5star']]] });
const gun = (e, nm) => ({ t: nm, s: [['Parado', [PS + 'kael_pistol_idle_era' + e + '_t0']], ['Correndo', [PS + 'kael_pistol_run_era' + e + '_t0']], ['Atirando', [PS + 'kael_pistol_shoot_era' + e + '_t0']]] });
/* TABELA DE ESCALA POR FASE NA TELA (dono, v0.12.7): garoto 1,00 · adolescente 1,12 · adulto 1,25 · guerreiro 1,30, para Kael e Kaia; pés no chão.
   Vale na Prévia agora; fica em window.PHASE_SCALE para a batalha usar quando o Kael por fase ligar. O tocador NÃO normaliza altura: desenha cada
   folha na escala do quadro (HS/256) vezes este número. As folhas de adulto e guerreiro serão REFEITAS pela Arte (corpo de criança): sem polimento agora. */
const PHASE_SCALE = window.PHASE_SCALE = [1.00, 1.12, 1.25, 1.30];
const fase = (n, nm) => ({ t: nm, s: [['Parado', [ph(n, 'idle_era2_t1')], { sc: PHASE_SCALE[n] }], ['Correndo', [ph(n, 'run_era2_t1')], { sc: PHASE_SCALE[n] }], ['Golpe', [ph(n, 'attack_era2_t1')], { sc: PHASE_SCALE[n] }], ['Giro', [ph(n, 'spin_era2_t1')], { sc: PHASE_SCALE[n] }], ['Morte', [ph(n, 'die_body')], { once: 1, sc: PHASE_SCALE[n] }]] });
const kaiaF = (n, nm) => { const d = A + 'hyb/' + (n ? 'kaia_phase' + n : 'kaia') + '/kaia_'; return { t: nm, s: [['Parada', [d + 'idle_era2_t1'], { sc: PHASE_SCALE[n] }], ['Correndo', [d + 'run_era2_t1'], { sc: PHASE_SCALE[n] }], ['Golpe', [d + 'attack_era2_t1'], { sc: PHASE_SCALE[n] }]] }; };
/* TABELA: grupo → cartões {t: título, s: [[estado, [camadas de baixo para cima], {once}]]}. Camada = 'base' (base.png + base.json) ou {png, json}. */
const TB = [
  { g: 'Asas e auras', c: [
    { t: 'Asa demoníaca', s: [['Parado', [EQ + 'kael_idle_wing_demon']], ['Correndo', [EQ + 'kael_run_wing_demon']]] },
    { t: 'Asa de anjo', s: [['Parado', [EQ + 'kael_idle_wing_angel']], ['Correndo', [EQ + 'kael_run_wing_angel']]] },
    { t: 'Aura maligna', s: [['No Kael', [A + 'aura/aura_evil', KI]]] }, { t: 'Aura celestial', s: [['No Kael', [A + 'aura/aura_holy', KI]]] },
    { t: 'Auras de forja', s: [['+4', [A + 'aura/aura4', KI]], ['+7', [A + 'aura/aura7', KI]], ['+10', [A + 'aura/aura10', KI]], ['+13', [A + 'aura/aura13', KI]]] } ] },
  { g: 'Kael', c: [
    { t: 'Kael (padrão)', s: [['Parado', [KI]], ['Correndo', [kael('run')]], ['Golpe', [R + 'kael_attack_wide_era2_t1']], ['Giro', [R + 'kael_spin_era2_t0']], ['Morte', [R + 'kael_die_body'], { once: 1 }]] }, ] },
  { g: 'Kaia', c: [kaiaF(0, 'Kaia (padrão)')] },
  { g: 'Pets', c: [pet('era0_mammoth', 'Mamute'), pet('era1_sphinx', 'Esfinge'), pet('era2_dragon', 'Dragão'), pet('era3_parrot', 'Papagaio'), pet('era4_mechdog', 'Cão mecânico'),
    { t: 'Ovo chocando', egg: { egg: 'assets/pets/pet_egg.png', pet: PT + 'era0_mammoth_idle' } }] },
  { g: 'Montarias', c: [mount('wolf', 'Kael no lobo'), mount('griffin', 'Kael no grifo')] },
  { g: 'Armas de fogo e nível', c: [gun(3, 'Pistola (era 3)'), gun(4, 'Revólver (era 4)'), gun(5, 'Pistola (era 5)'), gun(6, 'Pistola (era 6)'),
    { t: 'Subir de nível', s: [['Nível +1', [KI, A + 'fx/levelup'], { once: 1 }]] }] },
];
/* ================= CHAVES PARA O VOTO DO DONO (Engenheiro 6, v0.12.9) =================
   Tudo que espera voto fica DESLIGADO no jogo. Aqui, SÓ no Modo dono, cada coisa ganha um botão liga/desliga com o estado escrito no botão.
   A escolha fica no save do Modo dono (S.ownerKeys, chave eras_owner_v1; o save real nunca é lido nem escrito aqui) e é reaplicada quando o Modo dono
   abre de novo. Fora do Modo dono nada disto roda: sair do Modo dono recarrega a página e cada chave nasce no padrão do arquivo dela.
   Tabela: k (id) · t (rótulo) · get() (estado real, lido do módulo dono) · set(on) (escreve no módulo dono, só em memória). Chave cujo módulo não
   está carregado não ganha botão (get devolve null). */
const KST = () => Sys.stats.DATA;
const OWNER_KEYS = [
  { k: 'fuse', t: 'Fusão', get: () => (window.Panels && Panels.defs && Panels.defs.fuse && KST().quality) ? (Panels.on('fuse') && KST().quality.on === true) : null,
    set: on => { KST().quality.on = on; if (on) Panels.enable('fuse'); else PANEL_ON.fuse = false; } },   /* PANEL_ON.fuse + Sys.stats.DATA.quality.on andam juntas; a entrada aparece na Forja */
  { k: 'wings', t: 'Asas novas', get: () => (KST().wingTypes && 'newWings' in KST()) ? KST().newWings === true : null, set: on => { KST().newWings = on; } },
  { k: 'bow', t: 'Arco e Bumerangue', get: () => { const W = KST().weaponTypes; return W && W.bow && W.boomerang ? (W.bow.on === true && W.boomerang.on === true) : null; },
    set: on => { KST().weaponTypes.bow.on = on; KST().weaponTypes.boomerang.on = on; } },
  /* Ultimates lendárias: a chave é da batalha (js/battle.js, Engenheiro 5), combinada pelo nome window.ULT_LEGEND_ON. Lê o nome como a batalha lê; escreve em
     window.ULT_LEGEND_ON. Enquanto a batalha declarar a chave como constante, a escrita não pega: o botão continua mostrando o estado REAL e avisa. */
  { k: 'ult', t: 'Ultimates lendárias', get: () => { try { return typeof ULT_LEGEND_ON !== 'undefined' ? ULT_LEGEND_ON === true : window.ULT_LEGEND_ON === true; } catch (e) { return window.ULT_LEGEND_ON === true; } },
    set: on => { try { window.ULT_LEGEND_ON = on; } catch (e) {} } },
  { k: 'pets', t: 'Pets e montarias novos', get: () => (Sys.pet && Sys.mount && 'newPets' in Sys.pet.DATA && 'newOn' in Sys.mount.DATA) ? (Sys.pet.DATA.newPets === true && Sys.mount.DATA.newOn === true) : null,
    set: on => { Sys.pet.DATA.newPets = on; Sys.mount.DATA.newOn = on; } },
  { k: 'drops', t: 'Entregas dos itens novos', get: () => (Sys.newDrops && Sys.newDrops.DATA) ? Sys.newDrops.DATA.on === true : null, set: on => { Sys.newDrops.DATA.on = on; } },
  /* o HUD dos eventos com horário (SCREENS_ON.evHud) saiu daqui: ligado por padrão por decisão do PO/dono (13/11) */
];
const keyGet = K => { try { return K.get(); } catch (e) { return null; } };
function keySet(K, on){ try { K.set(!!on); } catch (e) { console.error('chave ' + K.k, e); } return keyGet(K) === !!on; }
/* reaplica as escolhas guardadas no save do Modo dono (só com OWNER_MODE; chamada uma vez, na carga) */
function keysBoot(){ if (!OWNER_MODE) return; const o = S.ownerKeys; if (!o || typeof o !== 'object') return; for (const K of OWNER_KEYS) if (typeof o[K.k] === 'boolean' && keyGet(K) !== null && keyGet(K) !== o[K.k]) keySet(K, o[K.k]); }
const WING_NEW = ['phoenix', 'ice', 'shadow', 'storm', 'mechanical', 'bone', 'seraph', 'darkmoth'];
const WING_SHORT = { phoenix: 'Fênix', ice: 'Gelo', shadow: 'Sombra', storm: 'Tempestade', mechanical: 'Mecânicas', bone: 'Ossos', seraph: 'Serafim', darkmoth: 'Mariposa' };
const UI = { open: null, st: 0, layers: null, raf: 0, t0: 0, tok: 0 };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function loadLayer(L){ const png = typeof L === 'string' ? L + '.png' : L.png, json = typeof L === 'string' ? L + '.json' : L.json;
  return Promise.all([new Promise((ok, er) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => er(new Error('img')); im.src = png; }), fetch(json).then(r => { if (!r.ok) throw new Error('json'); return r.json(); })]).then(a => ({ img: a[0], m: a[1] })); }
function freeLayers(){ if (UI.raf) cancelAnimationFrame(UI.raf); UI.raf = 0; if (UI.layers) for (const st of UI.layers) if (st) for (const l of st.ly){ try { l.img.src = ''; } catch (e) {} l.img = null; } UI.layers = null; UI.tok++; }
/* tocador genérico: pés/âncora de cada folha na linha do chão; escala = a do quadro do herói na batalha (HS px lógicos por 256 px de célula) */
function drawLayers(g, st, t, cx, gy, k){ let done = true; k *= st.sc || 1;
  for (const l of st.ly){ const M = l.m, n = M.frames || 1, fps = M.fps || 12; let fi = Math.floor(t * fps); if (st.once){ if (fi < n) done = false; fi = Math.min(n - 1, fi); } else { fi %= n; done = false; }
    const ax = typeof M.anchorX === 'number' ? M.anchorX : Array.isArray(M.anchor) ? M.anchor[0] * M.w : (M.padLeft != null ? M.padLeft + 128 : M.w / 2);
    const fy = typeof M.feetY === 'number' ? M.feetY : Array.isArray(M.anchor) ? M.anchor[1] * M.h : M.h * 243 / 256;
    g.save(); if (M.blend === 'lighter') g.globalCompositeOperation = 'lighter';
    if (M.aura){ const gr = g.createRadialGradient(cx, gy - 60 * k, 4, cx, gy - 60 * k, 150 * k); gr.addColorStop(0, M.stars >= 5 ? 'rgba(255,214,120,.55)' : 'rgba(120,200,255,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(cx - 160 * k, gy - 220 * k, 320 * k, 240 * k); }
    g.drawImage(l.img, fi * M.w, 0, M.w, M.h, cx - ax * k, gy - fy * k, M.w * k, M.h * k); g.restore(); }
  return done; }
function drawEgg(g, E, t, cx, gy, k){ const T = t % 6, ew = 96 * k, eh = ew * E.egg.naturalHeight / E.egg.naturalWidth, M = E.pet.m;
  const petAt = (y, a) => { const fi = Math.floor(t * (M.fps || 12)) % M.frames, ax = M.padLeft != null ? M.padLeft + 128 : M.w / 2, fy = typeof M.feetY === 'number' ? M.feetY : M.h; g.save(); g.globalAlpha = a; g.drawImage(E.pet.img, fi * M.w, 0, M.w, M.h, cx - ax * k, y - fy * k, M.w * k, M.h * k); g.restore(); };
  if (T < 2.6){ const sh = T < 1.6 ? Math.sin(T * 22) * 0.05 * (T / 1.6) : Math.sin(T * 40) * 0.09; g.save(); g.translate(cx, gy); g.rotate(sh); g.drawImage(E.egg, -ew / 2, -eh, ew, eh);   // treme cada vez mais
    if (T > 1.6){ g.strokeStyle = '#2a1403'; g.lineWidth = 2.2 * k; g.lineJoin = 'round'; const p = Math.min(1, (T - 1.6) / 0.8); g.beginPath(); g.moveTo(-ew * 0.28, -eh * 0.55);   // racha
        [[-0.12, -0.42], [-0.02, -0.6], [0.1, -0.44], [0.2, -0.62], [0.3, -0.5]].slice(0, Math.ceil(p * 5)).forEach(q => g.lineTo(q[0] * ew, q[1] * eh)); g.stroke(); }
    g.restore(); }
  if (T >= 2.3 && T < 3.3){ const p = (T - 2.3), r = (40 + 260 * p) * k, gr = g.createRadialGradient(cx, gy - eh * 0.5, 2, cx, gy - eh * 0.5, r); gr.addColorStop(0, 'rgba(255,255,255,' + Math.max(0, 1 - p) + ')'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.fillRect(cx - r, gy - eh * 0.5 - r, r * 2, r * 2); }   // luz
  if (T >= 2.6){ const p = Math.min(1, (T - 2.6) / 0.7), jump = Math.sin(p * Math.PI) * 70 * k; petAt(gy - jump, Math.min(1, p * 3)); }   // o pet salta e pousa no chão
}
function play(){ const c = document.getElementById('apv_cv'); if (!c || !UI.layers) return; const dpr = Math.min(window.devicePixelRatio || 1, 2), w = c.clientWidth, h = c.clientHeight;
  if (c.width !== Math.round(w * dpr)){ c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d'), now = performance.now(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const gy = h - 46, k = (HS / 256) * ((typeof cv !== 'undefined' && cv.clientWidth ? cv.clientWidth : w) / LW), cx = w * 0.42;
  const sky = g.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, '#2a3b52'); sky.addColorStop(1, '#6f8a8c'); g.fillStyle = sky; g.fillRect(0, 0, w, gy);
  const gr = g.createLinearGradient(0, gy, 0, h); gr.addColorStop(0, '#7a5a34'); gr.addColorStop(1, '#4a3520'); g.fillStyle = gr; g.fillRect(0, gy - 8, w, h - gy + 8); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, gy - 8, w, 3);
  const st = UI.layers[UI.st]; let t = (now - UI.t0) / 1000;
  if (st && st.egg) drawEgg(g, st.egg, t, cx, gy, k);
  else if (st){ g.fillStyle = 'rgba(30,18,8,.3)'; g.beginPath(); g.ellipse(cx, gy + 2, 34 * k, 8 * k, 0, 0, 7); g.fill(); if (drawLayers(g, st, t, cx, gy, k) && t > (st.dur || 1) + 1) UI.t0 = now; }
  UI.raf = requestAnimationFrame(play); }
function openCard(gi, ci){ const card = TB[gi].c[ci], tok = ++UI.tok; freeLayers(); UI.tok = tok; UI.open = [gi, ci]; UI.st = 0; paint();
  const jobs = card.egg ? [Promise.all([new Promise((ok, er) => { const im = new Image(); im.onload = () => ok(im); im.onerror = er; im.src = card.egg.egg; }), loadLayer(card.egg.pet)]).then(a => ({ label: 'Chocar', egg: { egg: a[0], pet: a[1] }, ly: [a[1]] })).catch(() => null)]
    : card.s.map(s => Promise.all(s[1].map(loadLayer)).then(ly => ({ label: s[0], ly, once: !!(s[2] && s[2].once), sc: (s[2] && s[2].sc) || 1, dur: Math.max.apply(null, ly.map(l => (l.m.frames || 1) / (l.m.fps || 12))) })).catch(() => null));
  Promise.all(jobs).then(res => { if (UI.tok !== tok) return; const ok = res.filter(Boolean);
    if (!ok.length){ UI.open = null; paint(); toast('Arte ainda não entregue'); return; }
    UI.layers = ok; UI.st = 0; UI.t0 = performance.now(); paint(); UI.raf = requestAnimationFrame(play); }); }
function closeCard(){ freeLayers(); UI.open = null; paint(); }
const btn = 'min-height:48px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font:900 14px Nunito,system-ui,sans-serif;padding:0 12px;cursor:pointer';
function ownerHtml(){
  if (!OWNER_MODE) return `<div style="padding:12px;border-radius:16px;background:#241b14;border:2px solid #4a3a2b;margin-bottom:12px"><div style="font:400 18px 'Lilita One',Nunito,sans-serif;color:#ffc94a">Modo dono</div>
    <div style="font-size:12.5px;color:#c9b9a2;margin:4px 0 10px">Abre um jogo SEPARADO, com tudo liberado e atalhos de teste. O seu jogo de verdade fica guardado e volta quando você sair.</div>
    <button data-o="enter" style="${btn};width:100%;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#8a4f0c">Jogar no modo dono</button></div>`;
  const b = (k, t) => `<button data-o="${k}" style="${btn}">${t}</button>`;
  return `<div style="padding:12px;border-radius:16px;background:#241b14;border:2px solid #ffc94a;margin-bottom:12px"><div style="font:400 18px 'Lilita One',Nunito,sans-serif;color:#ffc94a">Modo dono ligado</div>
    <div style="font-size:12.5px;color:#c9b9a2;margin:4px 0 10px">Este é o jogo de teste. Todas as telas que existem estão liberadas.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${b('lv20', 'Ir para o nível 20')}${b('lv32', 'Ir para o nível 32')}${b('lv50', 'Ir para o nível 50')}${b('lv70', 'Ir para o nível 70')}${b('wingangel', 'Asa de anjo')}${b('wingdemon', 'Asa demoníaca')}${typeof petOk === 'function' && petOk() ? b('egg', 'Ganhar ovo') : ''}${b('era', 'Avançar era')}${b('hero_kael', 'Herói: Kael')}${b('hero_kaia', 'Herói: Kaia')}${b('scn7', 'Cenário: Submundo')}${b('scn8', 'Cenário: Celestial')}${b('scn', 'Cenário da era atual')}${b('stones', '+500 pedras de forja')}${b('gold', '+1 milhão de ouro')}${b('gems', '+5.000 gemas')}</div>
    ${typeof mountOk === 'function' && mountOk() ? '<div style="font:900 12px Nunito,sans-serif;color:#c9b9a2;margin:10px 0 6px">MONTARIAS</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">' + mountIds().map(m => b('mt_' + m.id, m.name)).join('') + b('mtstar', 'Estrela +1') + b('mtstar0', 'Estrela -1') + b('mtoff', 'Desmontar') + '</div>' : ''}
    <div style="font:900 12px Nunito,sans-serif;color:#c9b9a2;margin:12px 0 2px">CHAVES PARA O VOTO</div>
    <div style="font-size:12px;color:#c9b9a2;margin:0 0 6px">Liga e desliga o que ainda espera o seu voto. Vale só neste jogo de teste; ao sair do modo dono tudo volta ao padrão.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${OWNER_KEYS.map(K => { const v = keyGet(K); return v === null ? '' : `<button data-o="key_${K.k}" aria-pressed="${v}" style="${btn};min-height:52px;line-height:1.15;${v ? 'background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#8a4f0c' : ''}">${K.t}<br><span style="font-size:11.5px">${v ? 'LIGADA' : 'DESLIGADA'}</span></button>`; }).join('')}</div>
    ${KST().wingTypes ? '<div style="font:900 12px Nunito,sans-serif;color:#c9b9a2;margin:10px 0 6px">ASAS NOVAS (ganhar e equipar)</div><div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px">' + WING_NEW.filter(w => KST().wingTypes[w]).map(w => `<button data-o="wg_${w}" aria-label="${esc(KST().wingTypes[w].name)}: ganhar e equipar" style="${btn}">${WING_SHORT[w]}</button>`).join('') + '</div>' : ''}
    ${KST().weaponTypes && KST().weaponTypes.bow ? '<div style="font:900 12px Nunito,sans-serif;color:#c9b9a2;margin:10px 0 6px">ARMAS NOVAS (ganhar e equipar)</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + b('wt_bow', 'Arco e flecha') + b('wt_boomerang', 'Bumerangue') + '</div>' : ''}
    <button data-o="exit" style="${btn};width:100%;margin-top:10px">Sair do modo dono (volta ao seu jogo)</button></div>`; }
function paint(){ const el = document.getElementById('apv'); if (!el) return;
  if (UI.open){ const card = TB[UI.open[0]].c[UI.open[1]], L = UI.layers;
    el.innerHTML = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button data-p="back" style="${btn}">Lista</button><div style="font:400 20px 'Lilita One',Nunito,sans-serif;color:#fff;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(card.t)}</div></div>
      <canvas id="apv_cv" role="img" aria-label="${esc(card.t)}" style="display:block;width:100%;height:340px;border-radius:16px;border:2px solid #4a3a2b;background:#16110d"></canvas>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">${L ? L.map((s, i) => `<button data-p="st" data-i="${i}" aria-pressed="${i === UI.st}" style="${btn};${i === UI.st ? 'background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#8a4f0c' : ''}">${esc(s.label)}</button>`).join('') : '<span style="color:#c9b9a2;font-size:13px">Carregando…</span>'}</div>`;
    return; }
  el.innerHTML = ownerHtml() + `<div style="font:400 18px 'Lilita One',Nunito,sans-serif;color:#ffc94a;margin:4px 0 2px">Prévia da arte</div><div style="font-size:12.5px;color:#c9b9a2;margin-bottom:8px">Arte aprovada em movimento, no tamanho do jogo. Toque num cartão.</div>`
    + TB.map((G, gi) => `<div style="font:900 13px Nunito,sans-serif;color:#c9b9a2;margin:12px 0 6px;text-transform:uppercase;letter-spacing:.04em">${esc(G.g)}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${G.c.map((c, ci) => `<button data-p="card" data-g="${gi}" data-c="${ci}" style="${btn};text-align:left">${esc(c.t)}</button>`).join('')}</div>`).join('')
    + '<div style="height:24px"></div>'; }
function ownerAct(k){
  if (k === 'enter' || k === 'exit'){ try { save(); if (k === 'enter') localStorage.setItem('eon_owner_mode', '1'); else localStorage.removeItem('eon_owner_mode'); } catch (e) {} window.__noSave = true; location.reload(); return; }
  if (!OWNER_MODE) return;
  if (k.indexOf('lv') === 0){ const n = +k.slice(2), o = Sys.level.ensure(S); o.lvl = Math.max(o.lvl | 0, n); o.xp = 0;
    for (const s of SLOTS7){ const it = S.eq[s] != null ? itemOf(S.eq[s]) : null; if (it) it.lvl = Math.max(it.lvl | 0, n); }   // FC coerente: os itens equipados sobem junto
    S.gold += 200000; toast('Nível ' + n + '. Itens equipados no nível ' + n); if (typeof petLevel === 'function') petLevel(false); }   /* o atalho pula o caminho normal de subir de nível: chama aqui o ovo do nível 20 */
  else if (k === 'wingangel' || k === 'wingdemon'){ const w = k === 'wingangel' ? 'angel' : 'demon';   /* as duas asas são ITENS distintos (item.wing) */
    try { let it = S.inv.find(i => i.slot === 'wing' && i.wing === w); if (!it){ Sys.host.addItem({ slot: 'wing', r: 2, e: Math.min(6, S.eraMax | 0), lvl: 1, wing: w }); it = S.inv[S.inv.length - 1]; if (it && it.slot === 'wing' && it.wing !== w) it.wing = w; }
      if (it && it.slot === 'wing'){ S.eq.wing = it.id; toast(w === 'angel' ? 'Asa de anjo equipada' : 'Asa demoníaca equipada'); } } catch (e) { toast('Não deu para criar a asa'); } }
  else if (k.indexOf('key_') === 0){ const K = OWNER_KEYS.find(x => x.k === k.slice(4)), cur = K ? keyGet(K) : null; if (cur === null){ toast('Chave indisponível'); return; }   /* Engenheiro 6: chaves para o voto (só Modo dono; guardadas em S.ownerKeys do save de teste) */
    const want = !cur, ok = keySet(K, want); if (!S.ownerKeys || typeof S.ownerKeys !== 'object') S.ownerKeys = {};
    if (ok){ S.ownerKeys[K.k] = want; toast(K.t + ': ' + (want ? 'ligada' : 'desligada')); } else toast(K.t + ': a chave ainda é fixa no arquivo da batalha');
    if (typeof refreshHero === 'function') refreshHero(); if (typeof preloadAssets === 'function') preloadAssets(); statsChanged(); if (typeof fbLayout === 'function') fbLayout(); paint(); return; }
  else if (k.indexOf('wg_') === 0){ const w = k.slice(3), W = KST().wingTypes && KST().wingTypes[w]; if (!W){ toast('Asa indisponível'); return; }   /* as 8 asas novas: item de asa com o modelo (item.wing), na raridade em que o modelo cai */
    try { let it = S.inv.find(i => i.slot === 'wing' && i.wing === w); if (!it){ const n0 = S.nextId; Sys.host.addItem({ slot: 'wing', r: Math.min(4, W.r | 0), e: Math.min(6, S.eraMax | 0), lvl: 1, wing: w }); it = S.inv.find(i => i.id === n0 && i.slot === 'wing'); if (it && it.wing !== w) it.wing = w; }
      if (it){ S.eq.wing = it.id; if (typeof preloadAssets === 'function') preloadAssets(); toast(W.name + ' equipada' + (KST().newWings === true ? '' : '. Ligue a chave Asas novas para ver o desenho')); } else toast('Não deu para criar a asa (mochila cheia)'); } catch (e) { toast('Não deu para criar a asa'); } }
  else if (k.indexOf('wt_') === 0){ const t = k.slice(3), W = KST().weaponTypes && KST().weaponTypes[t]; if (!W){ toast('Arma indisponível'); return; }   /* arco e bumerangue: arma com a família gravada (item.wt), na raridade e no nível da arma equipada */
    try { const cur = S.eq.weapon != null ? itemOf(S.eq.weapon) : null; let it = S.inv.find(i => i.slot === 'weapon' && i.wt === t);
      if (!it){ const n0 = S.nextId; Sys.host.addItem({ slot: 'weapon', r: cur ? cur.r | 0 : 2, e: Math.max(W.fromEra | 0, Math.min(6, cur ? cur.e | 0 : S.eraMax | 0)), lvl: 1, wt: t }); it = S.inv.find(i => i.id === n0 && i.slot === 'weapon'); if (it){ it.wt = t; it.lvl = Math.max(1, cur ? cur.lvl | 0 : 1); } }
      if (it){ S.eq.weapon = it.id; if (typeof refreshHero === 'function') refreshHero(); if (typeof preloadAssets === 'function') preloadAssets(); toast(W.name + ' equipado' + (W.on === true ? '' : '. Ligue a chave Arco e Bumerangue para ver o golpe')); } else toast('Não deu para criar a arma (mochila cheia)'); } catch (e) { toast('Não deu para criar a arma'); } }
  else if (k.indexOf('mt_') === 0){ const r = mountGive(k.slice(3)); toast(r && r.ok === false ? 'Montaria indisponível' : 'Montaria equipada'); }
  else if (k === 'mtstar' || k === 'mtstar0'){ const n = mountStar(k === 'mtstar' ? 1 : -1); toast(n ? n + ' estrela(s)' : 'Sem montaria equipada'); }
  else if (k === 'mtoff'){ mountOff(); toast('A pé'); }
  else if (k === 'hero_kael' || k === 'hero_kaia'){ const h = k.slice(5); let ok = false; try { ok = Sys.appearance.setHero(S, h); } catch (e) {} if (ok){ if (typeof formRefresh === 'function') formRefresh(); if (typeof preloadAssets === 'function') preloadAssets(); toast('Herói: ' + (h === 'kaia' ? 'Kaia' : 'Kael')); } else toast('Troca de herói indisponível'); }   /* Engenheiro 4: troca o herói do save de teste (só visual; atributos e FC iguais) */
  else if (k.indexOf('fx_') === 0){ const kind = k.slice(3), h = S.hero === 'kaia' ? 'kaia' : 'kael', id = kind === 'default' ? null : h + '_' + kind; let r = null;   /* Engenheiro 4: skins FIXAS no Modo dono (libera com owner:true e equipa; para o jogador seguem desligadas até o voto do dono) */
    try { if (id) Sys.appearance.grantFixed(S, id, { owner: true }); r = Sys.appearance.equipFixed(S, id); } catch (e) { r = null; }
    if (r && r.ok !== false){ if (typeof formRefresh === 'function') formRefresh(); if (typeof preloadAssets === 'function') preloadAssets(); if (typeof avatarRefresh === 'function') avatarRefresh(); toast(id ? 'Skin equipada' : 'Skin padrão'); } else toast('Skin indisponível'); }
  else if (false && k.indexOf('ph') === 0 && k.length === 3){   /* atalhos de FASE desligados (decisão final do dono: sem crescimento) */ const n = +k.slice(2); try { const o = Sys.phaseUp.ensure(S); o.stg = n; const need = Sys.phaseUp.DATA.levels[n] | 0, lv = Sys.level.ensure(S); if (n === 0) lv.lvl = Math.min(lv.lvl | 0, 21); else lv.lvl = Math.max(Math.min(lv.lvl | 0, (Sys.phaseUp.DATA.levels[n + 1] || 101) - 1), need); B.evo = null; toast('Fase: ' + Sys.phaseUp.nameOf(S, n) + ' (nível ' + lv.lvl + ')'); } catch (e) { toast('Fases indisponíveis'); } }   /* atalho por fase: põe o nível dentro da faixa da fase para ela não evoluir sozinha */
  else if (k.indexOf('scn') === 0){ const n = k.length > 3 ? +k.slice(3) : null; if (typeof sceneForce === 'function') sceneForce(n); toast(n == null ? 'Cenário da era atual' : n === 7 ? 'Cenário vivo: Submundo' : 'Cenário vivo: Celestial'); Screens.close(); return; }   /* prévia dos cenários vivos das eras 7 e 8 (ainda sem fase no jogo) */
  else if (k === 'era'){ const e = Math.min(6, eraOf(S.stage) + 1); S.stage = e * STAGES_PER_ERA + 1; S.wave = 1; S.eraMax = Math.max(S.eraMax | 0, e); S.best = Math.max(S.best | 0, S.stage); S.farm = false; startBattle(); preloadAssets(); toast('Era ' + (e + 1) + ': ' + ERAS[e].n); }
  else if (k === 'stones'){ try { Sys.forge.addStones(S, 500, Sys.host); toast('+500 pedras de forja'); } catch (e) { toast('Forja indisponível'); } }
  else if (k === 'egg'){ const x = petGiveEgg(); if (x && x.pet) toast('Ovo chocando na batalha'); Screens.close(); return; }
  else if (k === 'gold'){ S.gold += 1000000; toast('+1 milhão de ouro'); }
  else if (k === 'gems'){ S.gems += 5000; toast('+5.000 gemas'); }
  statsChanged(); if (typeof fbLayout === 'function') fbLayout(); }
function onClick(ev){ const b = ev.target.closest('button'); if (!b) return; snd('ui_tap');
  if (b.dataset.o) ownerAct(b.dataset.o);
  else if (b.dataset.p === 'card') openCard(+b.dataset.g, +b.dataset.c);
  else if (b.dataset.p === 'back') closeCard();
  else if (b.dataset.p === 'st'){ UI.st = +b.dataset.i; UI.t0 = performance.now(); const raf = UI.raf; paint(); if (!raf) UI.raf = requestAnimationFrame(play); } }
Screens.register('artprev', { title: 'Teste',
  render(el){ if (document.getElementById('apv')) return; el.innerHTML = '<div id="apv" style="padding:12px;height:100%;box-sizing:border-box;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:Nunito,system-ui,sans-serif"></div>'; document.getElementById('apv').addEventListener('click', onClick); paint(); },
  onOpen(){ UI.open = null; }, onClose(){ freeLayers(); UI.open = null; } });
keysBoot();   /* Modo dono: reaplica as chaves do voto guardadas no save de teste */
/* item do MENU, fora da regra de nível (sem entrada em FB_UNLOCK) */
if (typeof FB_DROP !== 'undefined') FB_DROP.push({ id: 'artprev', icon: 'settings', label: 'Teste', act: 'soon:artprev', tag: OWNER_MODE ? 'Dono' : 'Arte' });
/* selo fixo "MODO DONO" no topo, o tempo todo */
if (OWNER_MODE){ const s = document.createElement('div'); s.id = 'ownertag'; s.textContent = 'MODO DONO'; s.setAttribute('role', 'status');
  s.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 2px);transform:translateX(-50%);z-index:99;padding:1px 10px;border-radius:0 0 10px 10px;background:#ffc94a;color:#2a1403;font:900 10.5px Nunito,system-ui,sans-serif;letter-spacing:.06em;pointer-events:none';
  document.body.appendChild(s); }
})();
