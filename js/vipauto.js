'use strict';
/* ================= CONVENIÊNCIAS DO VIP NO JOGO (Engenheiro 8; tabela aprovada pelo dono em docs/PROPOSTA_VIP.md) =================
   Regra: Sys.vip.conv(S, id) → {on, need, value, lockText}. Quem não tem o nível NÃO usa a função (a tela mostra trancada com lockText).
   Com Sys.vip.DATA.convOn desligada tudo aqui volta ao comportamento de antes (mochila 60, 8 h, equipar sozinho para todos).
   O que este arquivo liga:
   - bagMax()        limite da mochila com o bônus do VIP (bag);
   - offlineCapH()   teto de horas do ganho offline (offlineH); BAL.offlineCapHours passa a devolver esse teto (ver vaOfflineHook);
   - vaCollect()     coleta automática (autoCollect): missões prontas, baús da atividade, níveis do Passe e correio sem item; UM aviso;
   - vaEquipAllowed  equipar o melhor sozinho (autoEquip): só com VIP e a preferência ligada; espaço VAZIO equipa sempre;
   - vaAutoSell      desmanche automático (autoSell): só Básico/Raro marcados pelo jogador, na ENTRADA do item; nunca item melhor que o equipado,
                     de prêmio/compra (origin), da temporada, da oferta, travado ou favorito;
   - vaFuseSoon      fusão automática (autoFuse): INERTE enquanto a Fusão não estiver ligada (Panels.on('fuse') + Sys.stats.DATA.quality.on);
                     nunca o equipado, travado, favorito, da temporada, da oferta nem 5 estrelas.
   Preferências no save: S.set.vipAuto = {autoEquip:bool, autoSell:{0:bool,1:bool}, autoFuse:bool} (padrão: tudo desligado, mesmo com VIP).
   Para as telas: window.VipAuto (no fim do arquivo). Depende de index.html (S, save, toast, snd, itemOf, iname, SLOT) e js/farm.js (normItem). */
const VA = { colT: 0, colTimer: 0, fuseTimer: 0, last: null };
const VA_BAG_BASE = 60, VA_SELL_R = [0, 1];
const vaVip = () => (typeof Sys !== 'undefined' && Sys && Sys.vip && typeof Sys.vip.conv === 'function') ? Sys.vip : null;
const vaConvOn = () => { const V = vaVip(); return !!(V && V.DATA && V.DATA.convOn === true); };
/* conveniência do save: sempre um objeto (sem o módulo: desligada) */
function vaConv(S0, id){ const V = vaVip(); try { const c = V && V.conv(S0, id); if (c) return c; } catch (e) {}
  return { id, on: false, need: 0, value: 0, name: '', free: '', lockText: 'VIP' }; }
/* número curto em português (mil, mi, bi) para o aviso: Sys.stats.abbr a partir de 10 mil; abaixo, o número inteiro do jogo */
const vaNum = n => { try { if (n >= 1e4 && Sys.stats && typeof Sys.stats.abbr === 'function') return Sys.stats.abbr(n); return (typeof gNum === 'function' ? gNum : fmt)(n); } catch (e) { return String(Math.floor(n)); } };

/* ---------- 1) MOCHILA ---------- */
function bagMax(S0){ const base = (typeof BAG_MAX === 'number' && BAG_MAX > 0) ? BAG_MAX : VA_BAG_BASE; let add = 0;
  try { add = Math.max(0, Math.floor(+vaConv(S0 || S, 'bag').value || 0)); } catch (e) {}
  return base + add; }
window.bagMax = bagMax;

/* ---------- 2) OFFLINE ---------- */
/* BAL.offlineCapHours (js/battle.js) é lido pelo modal antigo (js/meta.js) e pelo "Bem-vindo de volta" (js/p_intro.js). Sem editar nenhum dos dois
   donos, o campo vira uma propriedade: guarda a base (8 h, ou o que o docs/balance.json trouxer) e devolve o teto do VIP do save atual. */
let VA_OFF_BASE = 8;
function offlineCapH(S0){ let h = VA_OFF_BASE; try { const v = +vaConv(S0 || S, 'offlineH').value; if (isFinite(v) && v > h) h = v; } catch (e) {} return h; }
window.offlineCapH = offlineCapH;
function vaOfflineHook(){
  try { if (typeof BAL === 'object' && BAL){ const d = Object.getOwnPropertyDescriptor(BAL, 'offlineCapHours');
      if (d && !d.get){ if (typeof d.value === 'number' && d.value > 0) VA_OFF_BASE = d.value;
        Object.defineProperty(BAL, 'offlineCapHours', { enumerable: true, configurable: true, get: () => offlineCapH(), set: v => { if (typeof v === 'number' && isFinite(v) && v > 0) VA_OFF_BASE = v; } }); } } } catch (e) { console.error('vaOfflineHook', e); }
  vaOfflineSync(); }
/* itens do tempo fora (Sys.loot.offline): o módulo lê params.offlineCapHours (campo feito para o jogo ajustar) */
function vaOfflineSync(){ try { if (Sys.loot && Sys.loot.params) Sys.loot.params.offlineCapHours = offlineCapH(); } catch (e) {} }

/* ---------- preferências ---------- */
function vaPrefs(S0){ const s = S0 && S0.set && S0.set.vipAuto, sell = (s && s.autoSell) || {};
  return { autoEquip: !!(s && s.autoEquip), autoSell: { 0: !!sell[0], 1: !!sell[1] }, autoFuse: !!(s && s.autoFuse) }; }
const vaFusionOn = () => { try { return typeof Panels !== 'undefined' && Panels.on('fuse') && Sys.stats.DATA.quality.on === true; } catch (e) { return false; } };
/* setPref(S, 'autoEquip'|'autoFuse', bool) · setPref(S, 'autoSell', {0:bool, 1:bool}) (parcial vale) · setPref(S, 'autoSell0'|'autoSell1', bool)
   Ligar exige o nível de VIP: sem ele {ok:false, need, lockText}. Desligar sempre pode. Fusão desligada no jogo: {ok:false, reason:'off'}. */
function vaSetPref(S0, key, value){
  if (!S0 || typeof S0 !== 'object') return { ok: false, reason: 'save' };
  const p = vaPrefs(S0); let id = key, turnOn = false;
  if (key === 'autoEquip' || key === 'autoFuse'){ p[key] = !!value; turnOn = p[key]; }
  else if (key === 'autoSell0' || key === 'autoSell1'){ id = 'autoSell'; p.autoSell[key === 'autoSell0' ? 0 : 1] = !!value; turnOn = !!value; }
  else if (key === 'autoSell'){ if (value === false || value == null) p.autoSell = { 0: false, 1: false };
    else if (typeof value === 'object'){ for (const k in value){ if (VA_SELL_R.indexOf(+k) < 0){ if (value[k]) return { ok: false, reason: 'rarity' }; continue; } p.autoSell[+k] = !!value[k]; if (value[k]) turnOn = true; } }
    else return { ok: false, reason: 'value' }; }
  else return { ok: false, reason: 'key' };
  if (turnOn){ if (id === 'autoFuse' && !vaFusionOn()) return { ok: false, reason: 'off' };
    const c = vaConv(S0, id); if (!c.on) return { ok: false, need: c.need, lockText: c.lockText }; }
  if (!S0.set || typeof S0.set !== 'object') S0.set = {};
  S0.set.vipAuto = p;
  try { if (S0 === S && typeof save === 'function') save(); } catch (e) {}
  return { ok: true, prefs: vaPrefs(S0) }; }
/* estado para as telas: por conveniência {on, need, lockText, value, name, free}; nas três de preferência também {pref, active}; autoFuse: available */
function vaState(S0){ const V = vaVip(), out = {}, p = vaPrefs(S0);
  for (const c0 of (V && V.DATA && V.DATA.conv) || []){ const c = vaConv(S0, c0.id); out[c0.id] = { on: !!c.on, need: c.need, lockText: c.lockText, value: c.value, name: c.name, free: c.free }; }
  if (out.autoEquip){ out.autoEquip.pref = p.autoEquip; out.autoEquip.active = out.autoEquip.on && p.autoEquip; }
  if (out.autoSell){ out.autoSell.pref = p.autoSell; out.autoSell.active = out.autoSell.on && (p.autoSell[0] || p.autoSell[1]); }
  if (out.autoFuse){ out.autoFuse.available = vaFusionOn(); out.autoFuse.pref = p.autoFuse; out.autoFuse.active = out.autoFuse.available && out.autoFuse.on && p.autoFuse; }
  if (out.bag) out.bag.max = bagMax(S0);
  if (out.offlineH) out.offlineH.hours = offlineCapH(S0);
  return out; }

/* item que NENHUMA automação toca: equipado, travado, favorito, da temporada ou da oferta */
function vaKeep(it){ return !it || (S.eq && S.eq[it.slot] === it.id) || it.lock === true || it.locked === true || it.fav === true || it.season === true || it.offer === true; }

/* ---------- 4) EQUIPAR O MELHOR SOZINHO ---------- */
/* chamado pelo addItemToBag quando o item novo tem mais FC que o equipado. Espaço vazio: equipa sempre (nada é trocado). */
function vaEquipAllowed(it){
  return true;   /* DECISÃO DO DONO (13/11, via PO): o jogador GRÁTIS continua equipando o melhor item sozinho, como sempre foi. Equipar sozinho NÃO é
                    vantagem de VIP (Sistemas troca o benefício do VIP 2). A regra anterior (só VIP 2 com a preferência ligada) saiu. */ }

/* ---------- 5) DESMANCHE AUTOMÁTICO ---------- */
/* chamado pelo addItemToBag ANTES de o item entrar. Devolve null (o item entra normalmente) ou {msg, gold, forge} (já desmontado: não entra). */
function vaAutoSell(it, o){
  try {
    if (!it || VA_SELL_R.indexOf(it.r) < 0 || !vaConv(S, 'autoSell').on || !vaPrefs(S).autoSell[it.r]) return null;
    if (vaKeep(it) || typeof it.origin === 'string' || (o && o.pity)) return null;      // prêmio, compra, garantia: fica
    let sw = 1; try { sw = Sys.fc.itemFC(S, Sys.host, it).swap; } catch (e) { sw = 1; }
    if (!(sw <= 0)) return null;                                                     // melhor que o equipado (ou espaço vazio): fica
    S.inv.push(it); try { if (typeof codexSync === 'function') codexSync(); } catch (e) {} S.inv = S.inv.filter(x => x !== it);   // o códex registra o item mesmo desmontado
    const d = Sys.loot.dismantle(S, Sys.host, it) || {};
    const msg = 'Desmontou sozinho: ' + iname(it) + (d.gold ? ' · +' + vaNum(d.gold) + ' de ouro' : '') + (d.forge ? ' · +' + d.forge + ' pedra' + (d.forge > 1 ? 's' : '') + ' de forja' : '');
    return { msg, gold: d.gold || 0, forge: d.forge || 0 };
  } catch (e) { console.error('vaAutoSell', e); return null; } }

/* ---------- 6) FUSÃO AUTOMÁTICA (inerte até a Fusão ligar) ---------- */
const vaFuseActive = () => vaFusionOn() && !!vaConv(S, 'autoFuse').on && vaPrefs(S).autoFuse;
function vaFuseSoon(){ if (VA.fuseTimer || !vaFuseActive()) return; VA.fuseTimer = setTimeout(() => { VA.fuseTimer = 0; vaFuseRun(); }, 0); }
/* item novo a partir do resultado do Sys.stats.fuse (mesmo formato do uMake de js/p_fuse.js) */
function vaFuseMake(res, best){ const it = normItem(res); it.lvl = res.lvl; it.gold = res.gold; it.qp = res.qp; if (Number.isInteger(res.look)) it.look = res.look;
  if (it.slot === 'wing' && best && best.wing){ let ok = best.wing === 'angel' || best.wing === 'demon'; try { ok = ok || !!Sys.stats.DATA.wingTypes[best.wing]; } catch (e) {} if (ok) it.wing = best.wing; }
  if (it.slot === 'weapon' && best && typeof best.wt === 'string') it.wt = best.wt;   // os 3 são da mesma família: o resultado continua nela
  const top = (S.inv || []).reduce((m, x) => Math.max(m, +(x && x.id) || 0), 0); if (!(S.nextId > top)) S.nextId = top + 1;
  it.id = S.nextId++; it.gotAt = Date.now(); it.nw = 1; try { Sys.stats.ensureSubs(it); } catch (e) {} return it; }
/* junta 3 iguais (espaço, era, raridade, estrelas e, na arma, família), os de menor qualidade primeiro; repete enquanto houver trio e ouro */
function vaFuseRun(){
  if (!vaFuseActive() || (typeof B !== 'undefined' && B && B.inst)) return 0;
  let n = 0, made = null, stars = 0;
  try { const St = Sys.stats, Q = St.DATA.quality, need = Q.fusion.count, maxSt = Q.stars.length, skip = {};
    const fam = it => { if (it.slot !== 'weapon') return ''; try { return St.weaponType(it) || ''; } catch (e) { return ''; } };
    for (let guard = 0; guard < 40; guard++){
      const G = {}; for (const it of S.inv){ if (!it || !SLOT[it.slot] || vaKeep(it)) continue; const st = St.qualityStars(St.qpOf(it)); if (st >= maxSt) continue;
        const k = it.slot + '|' + (it.e | 0) + '|' + (it.r | 0) + '|' + st + '|' + fam(it); if (!skip[k]) (G[k] = G[k] || []).push(it); }
      const k = Object.keys(G).find(x => G[x].length >= need); if (!k) break;
      const items = G[k].slice().sort((a, b) => (St.qpOf(a) - St.qpOf(b)) || (a.id - b.id)).slice(0, need);
      const r = St.fuse(S, Sys.host, items); if (!r || !r.ok){ skip[k] = 1; continue; }    // sem ouro (ou recusa do módulo): esse grupo fica para depois
      const best = items.slice().sort((x, y) => St.qpOf(y) - St.qpOf(x))[0], it = vaFuseMake(r.result, best), gone = r.consumed || items.map(x => x.id);
      S.inv = S.inv.filter(x => gone.indexOf(x.id) < 0); S.inv.push(it); n++; made = it; stars = r.toStars; }
  } catch (e) { console.error('vaFuseRun', e); }
  if (n){ try { statsChanged(); } catch (e) {}
    toast(n === 1 ? 'Fusão automática: ' + iname(made) + ' com ' + stars + ' estrelas' : 'Fusão automática: ' + n + ' fusões feitas');
    if (typeof view !== 'undefined' && view !== 'battle' && typeof softRender === 'function') softRender(); }
  return n; }

/* ---------- 3) COLETA AUTOMÁTICA ---------- */
/* só o que não pede escolha: missões prontas (+ bônus das diárias), baús da Atividade de hoje, níveis do Passe e cartas do correio sem item, ovo
   nem skin. Nível do Passe com ITEM fica para o jogador se a mochila estiver cheia (o item novo desmontaria outro). UM aviso com o resumo. */
function vaMailSimple(att){ return !!att && typeof att === 'object' && !(Array.isArray(att.items) && att.items.length) && !(Array.isArray(att.eggs) && att.eggs.length) && !att.skin; }
function vaReady(){ if (typeof S === 'undefined' || !S || S.tut < 99 || (typeof PULLING !== 'undefined' && PULLING)) return false;
  if (typeof B !== 'undefined' && B && (B.inst || B.res)) return false;
  const t = document.getElementById('title'); return !t || t.style.display === 'none' || t.classList.contains('out'); }
function vaCollect(force){
  if (typeof SYS_ON === 'undefined' || !SYS_ON || !vaConv(S, 'autoCollect').on || !vaReady()) return null;
  const now = Date.now(); if (!force && now - VA.colT < 5000) return null; VA.colT = now;
  const H = Sys.host, g0 = S.gold, m0 = S.gems, out = { missions: 0, chests: 0, pass: 0, mail: 0, gold: 0, gems: 0, left: 0 };
  const unl = k => typeof fbUnl !== 'function' || fbUnl(k), P = Sys.pass;
  if (P && P.list && P.claimMission && unl('missions')){
    try { const one = id => { const r = P.claimMission(S, H, id); if (!r || !r.ok) return; out.missions++;
        try { const daily = id === 'bonus' || (P.DATA.daily || []).some(x => x.id === id);     // XP do jogador: igual ao resgate na tela de Missões
          if (daily && Sys.level){ const lr = id === 'bonus' ? Sys.level.onDailyBonus(S, H) : Sys.level.onMission(S, H); if (lr && lr.levels > 0 && typeof onLevelUp === 'function') onLevelUp(lr); } } catch (e) {} };
      const L = P.list(S, H); for (const m of L.daily.concat(L.weekly)) if (m.done && !m.claimed) one(m.id);
      const b = P.list(S, H).bonus; if (b && b.ready && !b.claimed) one('bonus'); } catch (e) { console.error('vaCollect missões', e); }
    try { if (Sys.activity && Sys.activity.claimAll) out.chests = (Sys.activity.claimAll(S, H) || []).filter(x => x && x.ok).length; } catch (e) { console.error('vaCollect atividade', e); } }
  if (P && P.claimTier && P.tier && P.reward && P.ensure && unl('pass')){
    try { if (P.refresh) P.refresh(S, H); const o = P.ensure(S), t = P.tier(S);
      for (let i = 1; i <= t; i++) for (const trk of ['free', 'premium']){ if (trk === 'premium' && !o.premium) continue; if ((trk === 'free' ? o.free : o.prem).includes(i)) continue;
        const rw = P.reward(trk, i); if (!rw) continue; if (rw.item && S.inv.length >= bagMax()){ out.left++; continue; }
        const r = P.claimTier(S, H, trk, i); if (r && r.ok) out.pass++; } } catch (e) { console.error('vaCollect passe', e); } }
  if (Sys.mail && Sys.mail.DATA && Sys.mail.DATA.enabled && Sys.mail.inbox && unl('mail')){
    try { for (const m of Sys.mail.inbox(S, H)) if (m.hasAtt && !m.claimed && vaMailSimple(m.att)){ const r = Sys.mail.claim(S, H, m.id); if (r && r.ok) out.mail++; } } catch (e) { console.error('vaCollect correio', e); } }
  out.gold = Math.max(0, S.gold - g0); out.gems = Math.max(0, S.gems - m0); VA.last = out;
  if (!(out.missions + out.chests + out.pass + out.mail)) return out;
  const pl = (n, a, b) => n + ' ' + (n > 1 ? b : a), parts = [];
  if (out.missions) parts.push(pl(out.missions, 'missão', 'missões')); if (out.chests) parts.push(pl(out.chests, 'baú', 'baús'));
  if (out.pass) parts.push(pl(out.pass, 'nível do Passe', 'níveis do Passe')); if (out.mail) parts.push(pl(out.mail, 'carta', 'cartas'));
  out.text = 'Coleta automática: ' + parts.join(', ') + (out.gems ? ' · +' + vaNum(out.gems) + ' gemas' : '') + (out.gold ? ' · +' + vaNum(out.gold) + ' de ouro' : '');
  try { statsChanged(); } catch (e) {} try { if (typeof passSync === 'function') passSync(); } catch (e) {}
  vaToast(out.text); snd('claim');
  if (typeof view !== 'undefined' && view !== 'battle'){ try { if (typeof softRender === 'function') softRender(); else render(); } catch (e) {} }
  return out; }
/* aviso único, um pouco mais longo que o comum (o resumo tem mais texto) */
function vaToast(msg){ const t = document.getElementById('toast'); if (!t || typeof toastT === 'undefined'){ toast(msg); return; }
  const show = () => { t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3600); };
  show(); setTimeout(() => { if (t.textContent !== msg) show(); }, 2400); }   /* outro aviso por cima (ex.: "Códex liberado" ao subir de nível com a XP das missões): o resumo volta UMA vez depois dele */
function vaCollectSoon(ms){ clearTimeout(VA.colTimer); VA.colTimer = setTimeout(() => { try { vaCollect(false); } catch (e) { console.error('vaCollect', e); } }, ms > 0 ? ms : 800); }
/* volta do segundo plano (navegador e app) */
document.addEventListener('visibilitychange', () => { if (!document.hidden) vaCollectSoon(900); });
document.addEventListener('resume', () => vaCollectSoon(900));

vaOfflineHook();

/* ---------- 7) PARA AS TELAS ---------- */
window.VipAuto = {
  prefs: vaPrefs,                 // prefs(S) → {autoEquip:bool, autoSell:{0:bool,1:bool}, autoFuse:bool}
  setPref: vaSetPref,             // setPref(S, chave, valor) → {ok:true, prefs} | {ok:false, need:n, lockText:'VIP n'} | {ok:false, reason:'off'|'key'|'value'|'rarity'|'save'}
  state: vaState,                 // state(S) → {<id>: {on, need, lockText, value, name, free, pref?, active?, available?, max?, hours?}}
  bagMax, offlineCapH,            // bagMax(S?) → espaços · offlineCapH(S?) → horas
  collect: () => vaCollect(true), // coleta agora (ex.: logo depois de subir o VIP); devolve o resumo {missions, chests, pass, mail, gold, gems, left, text} ou null
  fuseNow: () => vaFuseRun(),     // fusão automática agora (0 enquanto a Fusão estiver desligada)
  fusionOn: vaFusionOn,
};
