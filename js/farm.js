'use strict';
/* ================= LIGAÇÃO COM js/sys (somente leitura): Sys.host, saque da horda, baú de toque, nível do jogador, pickups =================
   Ligados nesta rodada: Sys.loot, Sys.chest, Sys.level. NÃO ligados: instâncias, forja, práticas, títulos, torre, pet, VIP, 7 espaços.
   Depende de index.html (S, RAR, ERAS, power, iname, sellVal, toast, snd, fmt, hud, render, track) e js/battle.js (B, BAL, GY, LW, HX, HS...). */
const SYS_ON = !!(window.Sys && Sys.loot && Sys.chest && Sys.level && Sys.stats && Sys.fc);
const SYS_E2 = !!(window.Sys && Sys.pass && Sys.practice && Sys.titles);   // passe, práticas e títulos (rodada 9)
let PULLING = null;                       // durante uma invocação ou compra: lista dos itens entregues (para a tela de resultado)

/* 7 ESPAÇOS: cada item vai para o SEU espaço (a conversão fixa da rodada 6, que jogava luvas/colar na arma e chapéu/botas/asa na armadura, saiu).
   Formato final: {slot, r, e, lvl, gold, subs:[{k,q}]} + id. Arma Mítica→Épica, asa só nível 50+ e Épica+: já vêm resolvidos do Sys.loot. */
function normItem(o){ const slot = SLOT[o.slot] ? o.slot : 'armor', r = Math.max(0, Math.min(RAR.length - 1, o.r | 0));
  const it = { slot, r, e: Math.max(0, Math.min(ERAS.length - 1, o.e | 0)), lvl: 1, gold: 0, subs: Array.isArray(o.subs) ? o.subs.map(s => ({ k: s.k, q: s.q })) : [] };
  /* Item da Temporada do passe (premium 27 e 30): season, targetR e seasonEnd precisam ficar no item, senão o Sys.pass.evolveSeason não o acha; look = era da aparência */
  if (o.season){ it.season = true; if (Number.isInteger(o.targetR)) it.targetR = o.targetR; if (o.seasonEnd != null) it.seasonEnd = o.seasonEnd; }
  if (Number.isInteger(o.look)) it.look = o.look;
  if (typeof o.origin === 'string') it.origin = o.origin;   // origem do item (shop, gift, offer...): sem efeito visível; o servidor confere depois
  if (o.qp != null) it.qp = o.qp;   // qualidade do item (regra da fps-e2, ainda desligada em Sys.stats.DATA.quality.on): só não perder o campo
  return it; }

/* aviso de drop: na Loja não aparece (cobriria o destaque); nas outras telas cheias cai no miolo, fora de cabeçalho e rótulo (CSS body.full #toast) */
function dropToast(msg){ if (view === 'shop') return; toast(msg); }
/* entrada única de item na mochila (drop, chefe, baú, invocação, loja, offline). Equipar automático: pela FC REAL (Sys.fc.itemFC().swap > 0).
   A garantia da invocação é do Sys.loot.summon (o item vem com pity:true); a do jogo (S.pity) foi retirada. */
function addItemToBag(o){
  const it = normItem(o); it.id = S.nextId++; try { Sys.stats.ensureSubs(it); } catch (e) {} it.nw = 1; const nm = iname(it);
  if (S.inv.length >= BAG_MAX){   /* MOCHILA CHEIA: sai o item MAIS FRACO que não está equipado (FC do item no nível atual, Sys.fc.itemFC().fc); o novo só é descartado se for ele o mais fraco */
    const fcOf = x => { try { return Sys.fc.itemFC(S, Sys.host, x).fc; } catch (e) { return 0; } };
    let weak = null, wf = Infinity; for (const x of S.inv){ if (S.eq[x.slot] === x.id) continue; const f = fcOf(x); if (f < wf){ wf = f; weak = x; } }
    const out = (!weak || fcOf(it) <= wf) ? it : weak; let d = null; try { d = Sys.loot.dismantle(S, Sys.host, out); } catch (e) {}
    const msg = 'Mochila cheia: desmontou ' + iname(out) + (d && d.gold ? ' · +' + fmt(d.gold) + ' de ouro' : '') + (d && d.forge ? ' · +' + d.forge + ' pedra' + (d.forge > 1 ? 's' : '') + ' de forja' : '');
    if (out === it){ if (PULLING) PULLING.push({ r: it.r, slot: it.slot, e: it.e, name: nm, pity: !!o.pity, dism: true }); else dropToast(msg); return; }
    S.inv = S.inv.filter(x => x.id !== out.id); if (!PULLING) dropToast(msg); else PULLING.bagMsg = msg; }
  S.inv.push(it);
  let better = false; try { better = Sys.stats.canEquip(it, Sys.level.level(S)) && Sys.fc.itemFC(S, Sys.host, it).swap > 0; } catch (e) {}
  if (better){ S.eq[it.slot] = it.id; refreshHero(); try { Sys.fc.record(S, Sys.host); } catch (e) {} }
  if (PULLING) PULLING.push({ r: it.r, slot: it.slot, e: it.e, name: nm, pity: !!o.pity, eq: better });
  else dropToast(better ? 'Equipou ' + nm + ' [' + RAR[it.r].n + ' · ' + SLOT[it.slot].n + ']' : 'Drop: ' + nm + ' [' + RAR[it.r].n + ' · ' + SLOT[it.slot].n + ']');
  if (it.r >= 4) snd('legendary');
  if (view === 'gear' && typeof softRender === 'function') softRender();
}

window.Sys = window.Sys || {};
Sys.host = {
  /* itens equipados nos 7 espaços (o Sys.stats/fc calcula tudo a partir daqui; espaço vazio = ausente) */
  equipped: () => { const o = {}; for (const s of SLOTS7){ const it = S.eq[s] != null ? itemOf(S.eq[s]) : null; if (it) o[s] = it; } return o; },
  stage: () => S.stage, eraMax: () => S.eraMax, best: () => S.best,
  level: () => (SYS_ON ? Sys.level.level(S) : 1),
  goldUnit: st => Math.max(1, Math.ceil(BAL.goldBase * Math.pow(BAL.goldGrowth, (st || S.stage) - 1) * BAL.commonGoldMult)),   // ouro de 1 abate comum
  addGold: n => { S.gold += Math.max(0, n || 0); }, addGems: n => { S.gems += Math.max(0, n || 0); },
  canSpendGold: n => n >= 0 && S.gold >= n, spendGold: n => { if (!(n >= 0) || S.gold < n) return false; S.gold -= n; return true; },
  canSpendGems: n => n >= 0 && S.gems >= n, spendGems: n => { if (!(n >= 0) || S.gems < n) return false; S.gems -= n; return true; },
  skinR: id => { const s = SKIN(id); return s ? s.r : undefined; },
  goTab: t => { if (FULLV[t] || t === 'pass' || t === 'battle') setView(t); },
  addItem: o => addItemToBag(o),
  /* Sys.pass: mochila (o Item da Temporada evolui no level up) e skin da temporada; Sys.titles: tamanho do catálogo de skins */
  items: () => S.inv,
  addSkin: id => { const k = id === 'season' ? SEASON_SKIN : id; if (SKIN(k) && !S.skins.includes(k)) S.skins.push(k); },
  catalog: kind => kind === 'wardrobe' ? SKINS.filter(s => !s.pass || s.id === SEASON_SKIN).length : undefined,
  now: () => Date.now(), rng: Math.random, toast: m => toast(String(m).replace(/ Liberou:.*$/, '').replace(/^🎖️\s*/, '')),   // sem anunciar funções que ainda não estão ligadas
  // opcionais de interface
  itemName: it => iname(normItem(it)), rarName: r => RAR[r] ? RAR[r].n : '', rarColor: r => RAR[r] ? RAR[r].c : '#fff',
  thumb: it => (it && SLOT[it.slot]) ? slotIcon(it.slot, Number.isInteger(it.look) ? it.look : it.e) : ICON.armor,   // ícone aprovado do espaço na era do item
  sfx: n => snd(n), fmt: n => fmt(n),
  onChange: () => { save(); hud(); if (view !== 'battle'){ if (typeof softRender === 'function') softRender(); else render(); } },
};

/* CARGA DO SAVE (uma vez, antes de qualquer cálculo): Sys.stats.migrateSave estima o ouro investido dos itens antigos pela tabela antiga e
   gera os secundários. Aqui também: espaços equipados que apontam para item inexistente saem; contador de garantia antigo (S.pity) sai. */
function sysMigrate(){
  if (!Array.isArray(S.inv)) S.inv = []; if (!S.eq || typeof S.eq !== 'object') S.eq = {};
  S.inv = S.inv.filter(it => it && SLOT[it.slot]);
  let n = 0; try { n = Sys.stats.migrateSave(S); } catch (e) { console.error('migrateSave', e); }
  for (const s in S.eq){ if (!SLOT[s] || !itemOf(S.eq[s])) delete S.eq[s]; }
  delete S.pity; if (Sys.skin && Sys.skin.useHost) Sys.skin.useHost(Sys.host);
  if (!S.name && (S.welcome || S.kills > 0 || S.stage > 1)){ S.name = 'Kael'; S.hero = 'kael'; }   // save antigo sem nome: "Kael", sem mostrar a intro
  return n;
}
function sysBoot(){
  if (!SYS_ON) return;
  try { window.__migrated = sysMigrate(); Sys.loot.ensure(S); Sys.chest.ensure(S); Sys.level.ensure(S); if (DEBUG && window.__plv > 1){ const o = Sys.level.ensure(S); o.lvl = Math.min(100, window.__plv | 0); o.xp = 0; } Sys.loot.flushPending(S, Sys.host);
    if (SYS_E2) sysBootE2();
    const el = document.getElementById('chestbox'); if (el) Sys.chest.render(el, S, Sys.host, { overlay: document.getElementById('app') });
  } catch (e) { console.error('sysBoot', e); }
}
/* PASSE, PRÁTICAS E TÍTULOS. Migração do passe antigo: o Sys.pass.ensure importa S.pass.xp/free/prem na 1ª carga (o que já foi resgatado continua
   resgatado e não é dado de novo). O "Premium (teste)" antigo era grátis: NÃO vira premium (só compra ou dbgPremium); a marca fica em S.sys.pass.mig.
   S.pass e S.daily (missões antigas) saem do save. Títulos: os já cumpridos são dados em silêncio na carga. */
function sysBootE2(){
  const had = !!(S.sys && S.sys.pass), old = S.pass; const o = Sys.pass.ensure(S);
  if (!had && old){ o.mig = { xp: old.xp | 0, on: !!old.on, free: (old.free || []).length, prem: (old.prem || []).length }; o.premium = false; }
  delete S.pass; delete S.daily; Sys.pass.refresh(S, Sys.host);
  Sys.practice.ensure(S); Sys.titles.ensure(S); Sys.titles.check(S, Sys.host, { silent: true });
  if (DEBUG && QP.has('stones')) Sys.practice.addStones(S, +QP.get('stones') || 0, Sys.host);
}
/* nível do jogador: teto do nível dos itens e bônus de atributo (entra em heroStats) */
function onLevelUp(lv){
  try { Sys.loot.onLevelUp(S, Sys.host); } catch (e) {}
  if (typeof speedCheck === 'function') speedCheck(lv);
  refreshHero(); snd('upgrade'); vib(40);
  B.banner = { txt: 'Nível ' + lv.to + '!', pill: true, bg: 'rgba(14,60,52,.9)', bd: '#5ff0cf', sh: '#063a30', t: 0, dur: 2.2, col: '#5ff0cf' };   // "Nível X!" como no canvas
  { const av = document.getElementById('fb_av'); if (av){ av.classList.remove('fb-cbump'); void av.offsetWidth; av.classList.add('fb-cbump'); } }
  for (let i = 0; i < 18; i++) emit({ x: HX + (Math.random() - .5) * 50, y: GY - Math.random() * HS * 0.8, vx: (Math.random() - .5) * 40, vy: -60 - Math.random() * 80, g: 0, t: 0, life: .8, col: Math.random() < .5 ? '#6fe3ff' : '#ffffff', sz: 2 + Math.random() * 3, glow: true });
  if (view !== 'battle' && typeof softRender === 'function') softRender();
}
/* abate na campanha: ouro, XP, gema, item e materiais pelo Sys.loot; carga do baú pelo Sys.chest */
function farmKill(e, y){
  if (!SYS_ON){ S.gold += e.gold; floatText(e.x, y - 30, '+' + fmt(e.gold) + '🪙', '#ffc94a'); return; }
  let r = null;
  try { r = Sys.loot.onKill(S, Sys.host, { gold: e.gold, boss: e.boss, eraBoss: e.eraBoss, era: eraOf(S.stage), stage: S.stage, x: e.x, y });
    Sys.chest.onKill(S, { boss: e.boss, eraBoss: e.eraBoss }, Sys.host);
    if (SYS_E2){ const en = { boss: !!e.boss, eraBoss: !!e.eraBoss }; const st = Sys.practice.onKill(S, Sys.host, en); if (st > 0 && typeof progStone === 'function') progStone(st);
      const fresh = Sys.titles.onKill(S, Sys.host, en); if (fresh && fresh.length){ refreshHero(); if (typeof progFresh === 'function') progFresh(fresh); } }
    } catch (err) { console.error('farmKill', err); }
  if (e.boss) B.bossLoot = r;   // a tela 10 (vitória) mostra o que este abate deu
  if (typeof passSync === 'function') passSync();
  if (!r) return;
  spawnPicks(r.pickups || [], e.x);
  if (r.levelUp && r.levelUp.to > r.levelUp.from) onLevelUp(r.levelUp);
  if (r.held && r.held.length && !(e.boss && SCREENS_ON.bossResult)) toast('Ovo guardado: choca no nível ' + r.held[0].needLevel);
}

/* ---------- pickups: pulam do inimigo, ficam um instante no chão (moeda girando, orbe pulsando, item brilhando na cor da raridade)
   e voam para o contador (ouro, gemas, barra de nível, mochila). O ganho JÁ foi creditado no abate: o voo é só visual.
   Rótulo "+N" agrupado por tipo (Sys.loot.createGrouper) ao lado do destino, para não poluir a horda. ---------- */
const PK = { list: [], G: null, tg: {}, tgT: -9, MAX: 70 };
const PK_TO = { gold: 'gold', gems: 'gems', level: 'lvb', bag: 'tabgear' };
function spawnPicks(arr, x){
  if (!PK.G) PK.G = Sys.loot.createGrouper();
  for (const p of arr){
    if (PK.list.length >= PK.MAX){ PK.G.add(p.type, p.value, B.at); continue; }      // teto: o excedente vai direto para o "+N"
    PK.list.push({ p, x, y: GY - 34, vx: -20 + Math.random() * 90, vy: -150 - Math.random() * 90, t: -(p.delay || 0), st: 0, rt: 0, ft: 0, sx: 0, sy: 0, rest: 0.3 + Math.random() * 0.35, sd: Math.random() * 6 });
    if (p.type === 'item' && typeof rarSnd === 'function') rarSnd(p.r); }   // som por raridade: só com a chave SCREENS_ON.rarityFx (js/rarity.js)
}
function pickTarget(to){
  if (B.at - PK.tgT > 0.5){ PK.tgT = B.at; PK.tg = {}; }
  let T = PK.tg[to]; if (T) return T;
  const el = fbTarget(to),   // 04b: os pickups voam para o HUD novo
    cr = cv.getBoundingClientRect(), k = cr.width / LW;
  if (el && k){ const r = el.getBoundingClientRect(); T = { x: (r.left + r.width / 2 - cr.left) / k, y: (r.top + r.height / 2 - cr.top) / k }; } else T = { x: 30, y: 20 };
  return PK.tg[to] = T;
}
function tickPicks(dt){
  if (!PK.list.length) return; const run = B.running ? RUNV() * dt : 0;
  for (const q of PK.list){
    q.t += dt; if (q.t < 0) continue;
    if (q.st === 0){ q.vy += 620 * dt; q.x += q.vx * dt - run; q.y += q.vy * dt; if (q.y >= GY - 6 && q.vy > 0){ q.y = GY - 6; q.st = 1; } }
    else if (q.st === 1){ q.rt += dt; q.x -= run; if (q.rt > q.rest || q.x < 6){ q.st = 2; q.sx = q.x; q.sy = q.y; } }
    else { q.ft += dt / 0.5; const k = Math.min(1, q.ft), e = k * k, T = pickTarget(q.p.to); q.x = q.sx + (T.x - q.sx) * e; q.y = q.sy + (T.y - q.sy) * e - Math.sin(Math.PI * k) * 26;
      if (k >= 1){ q.done = true; PK.G.add(q.p.type, q.p.value, B.at); if (q.p.type === 'gold' && B.at - (PK.bumpT || 0) > 0.4){ PK.bumpT = B.at; const gp = document.getElementById('fb_goldp'); if (gp){ gp.classList.remove('fb-cbump'); void gp.offsetWidth; gp.classList.add('fb-cbump'); } } } }
  }
  PK.list = PK.list.filter(q => !q.done);
}
const PK_COL = { essence: '#c9a4ff', gold: '#ffc94a', gem: '#6fd3ff', xp: '#6fe3ff', forge: '#ff9a4a', food: '#d8b070', egg: '#ffe9c8' };
function drawPicks(){
  const t = B.at;
  for (const q of PK.list){ if (q.t < 0) continue; const p = q.p, s = p.big ? 1.4 : 1, ph = t * 9 + q.sd;
    ctx.save(); ctx.translate(q.x, q.y);
    if (q.st === 1){ ctx.globalAlpha = 0.25; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 5, 5 * s, 1.6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; if (!(p.type === 'item' && typeof RAR_ON === 'function' && RAR_ON())) ctx.translate(0, -2 - Math.abs(Math.sin(ph * 0.5)) * 2.5); }   // com a chave da raridade o item fica apoiado no chão
    if (p.type === 'gold'){ const w = Math.abs(Math.cos(ph)) * 4.6 * s + 0.9;                       // moeda girando
      ctx.fillStyle = '#a86a10'; ctx.beginPath(); ctx.ellipse(0, 0, w + 1, 5.6 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffc94a'; ctx.beginPath(); ctx.ellipse(0, 0, w, 4.6 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.ellipse(-w * 0.25, -1.2 * s, w * 0.35, 1.6 * s, 0, 0, 7); ctx.fill(); }
    else if (p.type === 'xp'){ const r = (4 + 1.6 * Math.sin(ph)) * s; drawGlow('#5ff0cf', 0, 0, r * 2.4, 0.9); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 7); ctx.fill(); }   // orbe pulsando
    else if (p.type === 'gem'){ ctx.rotate(Math.sin(ph * 0.6) * 0.5); drawGlow('#6fd3ff', 0, 0, 10 * s, 0.5 + 0.3 * Math.sin(ph)); ctx.fillStyle = '#6fd3ff'; ctx.strokeStyle = '#1d5f86'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -6 * s); ctx.lineTo(5 * s, 0); ctx.lineTo(0, 6 * s); ctx.lineTo(-5 * s, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (p.type === 'item' && typeof RAR_ON === 'function' && RAR_ON()) rarDrop(q, p, s, ph);   // brilho, partículas e feixe por raridade (js/rarity.js)
    else if (p.type === 'item'){ const c = RAR[p.r] ? RAR[p.r].c : '#fff'; drawGlow(c, 0, -2, (13 + 3 * Math.sin(ph)) * s, 0.85); ctx.rotate(Math.sin(ph * 0.5) * 0.35);          // item: brilho na cor da raridade
      ctx.fillStyle = '#2a211a'; ctx.strokeStyle = c; ctx.lineWidth = 1.8; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-6 * s, -8 * s, 12 * s, 12 * s, 3); else ctx.rect(-6 * s, -8 * s, 12 * s, 12 * s); ctx.fill(); ctx.stroke();
      ctx.fillStyle = c; ctx.fillRect(-1.2 * s, -6 * s, 2.4 * s, 8 * s); ctx.fillRect(-3.5 * s, -0.5 * s, 7 * s, 1.8 * s); }
    else { const c = p.type === 'egg' && RAR[p.r] ? RAR[p.r].c : (PK_COL[p.type] || '#fff'); drawGlow(c, 0, 0, (9 + 2 * Math.sin(ph)) * s, 0.7); ctx.rotate(Math.sin(ph * 0.7) * 0.3);
      ctx.fillStyle = c; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1; ctx.beginPath(); if (p.type === 'egg') ctx.ellipse(0, 0, 4.2 * s, 5.6 * s, 0, 0, 7); else { for (let i = 0; i < 6; i++){ const a = i * Math.PI / 3; ctx.lineTo(Math.cos(a) * 5 * s, Math.sin(a) * 5 * s); } ctx.closePath(); } ctx.fill(); ctx.stroke(); }
    ctx.restore(); }
  if (!PK.G) return; PK.G.due(t);
  for (const b of PK.G.live()){ const to = b.type === 'gold' ? 'gold' : b.type === 'gem' ? 'gems' : b.type === 'xp' ? 'level' : 'bag', T = pickTarget(to), age = t - b.last, pop = 1 + 0.35 * Math.max(0, 1 - age * 6);
    const tx = '+' + fmt(b.total) + (b.type === 'xp' ? ' XP' : ''), col = b.type === 'item' ? '#ffffff' : (PK_COL[b.type] || '#fff'), up = to === 'bag';
    ctx.save(); ctx.translate(Math.max(22, Math.min(LW - 22, T.x)), T.y + (up ? -24 : 20)); ctx.scale(pop, pop); ctx.font = '900 11px system-ui'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(tx, 0, 0); ctx.fillStyle = col; ctx.fillText(tx, 0, 0); ctx.restore(); }
}

/* HUD: "Nv. X" + barra de XP; baú de toque */
const LVH = { t: '', w: -1 };
function hudSys(){
  if (!SYS_ON) return;
  const h = Sys.level.hud(S), w = Math.round((h.max ? 1 : h.frac) * 100);
  const el = document.getElementById('chestbox'); if (el){ try { Sys.chest.update(el, S, Sys.host); } catch (e) {} }
}
