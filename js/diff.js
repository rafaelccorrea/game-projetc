'use strict';
/* ================= DIFICULDADE COM PAREDES (dono aprovou 13/11; docs/PROPOSTA_DIFICULDADE.md) — TELA E BATALHA =================
   CHAVE ÚNICA: window.DIFF_ON (DESLIGADA). Desligada, este arquivo não muda nada: fcNeed() devolve o recFC() de sempre e as outras funções saem na
   primeira linha. Conferir sem mexer em código: ?debug=1&diff=1. Ligar/desligar em tempo de execução: diffSet(true|false).
   NENHUM NÚMERO PRÓPRIO: tudo vem do bloco "dificuldade" do docs/balance.json, lido em tempo de execução pelo loadBalance() do js/battle.js
   (diffBal). Sem o bloco carregado, a chave ligada só mostra a FC de hoje (recFC) e o cartão: chefe, comuns e fúria ficam como hoje.
   Junto com a chave (e só com ela): Sys.advice.DATA.on, Sys.level.setKillCap, Sys.mount.setStarFlat e Sys.pet.setStageMult (estes três se o bloco mandar).

   PONTOS DE LIGAÇÃO (uma função cada):
     fcNeed(stage)            FC pedida da fase (FC real, a do heroFC). Ligada: recFc[stage-1]; depois da última, a última × afterLastGrowth por fase.
     diffEnemy(stage,kind,b)  vida e dano do inimigo de FASE (mkEnemy do js/battle.js; nunca em instância). b = o de hoje (null no mkEnemy).
     diffRef(fc,stage)        herói de referência da FC pedida (função pura do js/sys).
     diffStep(dt)             fúria do chefe (step do js/battle.js).
     diffHud(fc)              FC pedida colorida e aviso do teto de XP no HUD (fbTick do js/fullbattle.js).
     diffAsk()                cartão "Faltam X de FC" antes do chefe (bossTap do index.html). diffLoseRows(need): as ações na Derrota (js/screens2.js).

   A CONTA DO CHEFE (diffBoss; boss.fromRecOnly): sai SÓ da FC pedida da fase, nunca do herói do momento.
     1. Herói de referência = diffRef(FC pedida, fase): função pura do js/sys. Hoje é o Sys.tower.statsFromFC(fc, 0) (metade da FC em ATQ, metade em
        VIDA, crítico base, sem DEF nem velocidade). Quando a Sistemas entregar Sys.stats.refFromFc(fc, stage) com as proporções do jogador típico,
        o diffRef passa a usá-la sozinho (PONTO DE LIGAÇÃO ÚNICO; ver o pedido no relatório).
     2. DPS da FC pedida = ATQ de referência × (1 + crítico) × golpes em killSecAt100 segundos, contados por um ensaio do mesmo agendador da batalha
        (básico a cada intervalo do Sys.stats, especial a cada s2Cooldown, ultimate com a energia cheia; energia e recarga começam do zero).
     3. Onda do chefe inteira (boss.waveIncludesEscorts): vida do chefe = (killSecAt100 × DPS) ÷ (1 + escoltas × hpShareOfBoss), ou seja,
        o total menos a vida das escoltas. Cada comum/escolta = hpShareOfBoss da vida e dmgShareOfBoss do dano do chefe da MESMA fase.
     4. Dano do chefe: em surviveSecAt100 segundos, os golpes das escoltas (enquanto vivem; caem uma a uma no ritmo do DPS) mais os do chefe
        (um a cada 1,15 s no resto do tempo), já descontada a DEF de referência pelo Sys.stats.hit, somam a VIDA de referência.
   Fúria: furyAtSec segundos depois do primeiro inimigo da onda do chefe chegar ao lugar, o dano do chefe × furyDmgMult. */
const DIFF = window.DIFF = { tbl: null, tier: { green: 1, yellow: typeof BOSS_GLOW_AT === 'number' ? BOSS_GLOW_AT : 0.9 },   /* LIMIAR DAS CORES (lugar único): verde >= green × pedida; amarelo >= yellow × pedida (o mesmo 90% do brilho do Desafiar); abaixo, vermelho */
  col: ['#5fd068', '#ffc94a', '#ff6b5a'], name: ['verde', 'amarelo', 'vermelho'], applied: false, card: null, memo: {} };
const diffOn = () => window.DIFF_ON === true;
const diffNum = (v, d) => (typeof v === 'number' && isFinite(v)) ? v : d;

/* bloco "dificuldade" do balance.json (só aceita a tabela inteira e válida) */
function diffBal(d){ try { if (!d || typeof d !== 'object' || !Array.isArray(d.recFc) || !d.recFc.length || !d.recFc.every(v => typeof v === 'number' && v > 0)) return false;
    DIFF.tbl = d; DIFF.memo = {}; diffApply(); return true; } catch (e) { return false; } }
/* liga/desliga o que anda junto com a chave (nunca mexe nos módulos enquanto a chave nunca foi ligada) */
function diffApply(){ const on = diffOn(), T = DIFF.tbl; if (!on && !DIFF.applied) return; DIFF.applied = on; DIFF.memo = {};
  try { if (window.Sys && Sys.advice && Sys.advice.DATA) Sys.advice.DATA.on = on; } catch (e) {}
  try { if (window.Sys && Sys.level && typeof Sys.level.setKillCap === 'function') Sys.level.setKillCap(on && !!(T && T.killXpCap && T.killXpCap.on === true)); } catch (e) {}
  try { if (window.Sys && Sys.mount && typeof Sys.mount.setStarFlat === 'function') Sys.mount.setStarFlat(on && !!(T && T.mountStarFlat && T.mountStarFlat.on === true)); } catch (e) {}
  try { if (window.Sys && Sys.pet && typeof Sys.pet.setStageMult === 'function') Sys.pet.setStageMult(on && !!(T && T.petStageMult && T.petStageMult.on === true)); } catch (e) {}
  try { if (typeof B !== 'undefined' && B.hero && typeof refreshHero === 'function') refreshHero(); } catch (e) {} }
function diffSet(on){ window.DIFF_ON = on === true; diffApply(); if (!diffOn()){ diffClose(); diffHud(0); } return diffOn(); }

/* FC PEDIDA DA FASE (função única). kind fica para o dia em que o chefe pedir outra FC que a fase. */
function fcNeed(stage, kind){ const T = DIFF.tbl; if (!diffOn() || !T) return recFC(stage);
  const a = T.recFc, n = a.length, s = Math.max(1, Math.floor(stage) || 1); if (s <= n) return a[s - 1];
  return Math.round(a[n - 1] * Math.pow(diffNum(T.afterLastGrowth, 1), s - n)); }
/* cor pela FC do jogador: 0 verde · 1 amarelo · 2 vermelho */
function diffTier(fc, need){ const r = need > 0 ? fc / need : 1; return r >= DIFF.tier.green ? 0 : r >= DIFF.tier.yellow ? 1 : 2; }

/* ---------------- a conta do chefe ---------------- */
/* dano em T segundos, em unidades de ATQ: u = golpes do herói (levam o crítico), pu = golpes do pet. Mesmo agendador do step() do js/battle.js. */
function diffUnits(T, o){ const dt = 0.02; let t = 0, u = 0, pu = 0, act = null, atkT = 0, cd2 = o.cd2, en = o.energy, hurtT = o.hurtEvery, petT = 0;
  while (t < T){ t += dt; cd2 -= dt;
    if (act){ act.t += dt * act.rate; for (const h of act.hits) if (!h.d && act.t >= h.t){ h.d = 1; u += h.m; en = Math.min(100, en + act.e); } if (act.t >= act.dur) act = null; }
    hurtT -= dt; if (hurtT <= 0){ hurtT += o.hurtEvery; en = Math.min(100, en + o.eHurt); }
    if (o.petK > 0){ petT += dt; if (petT >= o.petIvl){ petT = 0; pu += o.petK; } }
    if (!act){
      if (en >= 100){ en = 0; act = { t: 0, rate: 1, dur: o.s3d, e: 0, hits: o.s3h.map(h => ({ t: h[0], m: o.s3m * h[1] })) }; }
      else if (cd2 <= 0){ cd2 = o.s2cd; act = { t: 0, rate: 1, dur: o.s2d, e: o.eSkill, hits: o.s2h.map(h => ({ t: h[0], m: o.s2m / o.s2h.length })) }; }
      else { atkT -= dt; if (atkT <= 0){ atkT = o.ivl; act = { t: 0, rate: o.s1i / o.ivl, dur: o.s1d, e: o.eHit * o.ivl / o.s1i, hits: [{ t: o.s1t, m: 1 }] }; } } } }
  return { u, pu }; }
/* HERÓI DE REFERÊNCIA: função pura da FC (e da fase). Uma função só; quando existir Sys.stats.refFromFc, é ela. */
function diffRef(fc, stage){ try { const T = window.Sys && Sys.stats; if (T && typeof T.refFromFc === 'function'){ const r = T.refFromFc(fc, stage); if (r && r.atk > 0 && r.hp > 0) return r; }
    const W = window.Sys && Sys.tower; if (W && typeof W.statsFromFC === 'function') return W.statsFromFC(fc, 0); } catch (e) {} return null; }
/* chefe e comum da fase: {hp, dmg, chp, cdmg, need, ref, dps} ou null (sem tabela ou sem os módulos: fica o inimigo de hoje). Só depende da fase. */
function diffBoss(stage){ const T = DIFF.tbl; if (!T || !T.boss || !(window.Sys && Sys.stats && typeof Sys.stats.hit === 'function')) return null;
  const need = fcNeed(stage, 'boss'), key = stage + '|' + need; if (DIFF.memo[key] !== undefined) return DIFF.memo[key];
  const kill = diffNum(T.boss.killSecAt100, 0), surv = diffNum(T.boss.surviveSecAt100, 0), ref = need > 0 && kill > 0 && surv > 0 ? diffRef(need, stage) : null; let out = null;
  if (ref && ref.atk > 0 && ref.hp > 0){
    const E = Math.max(0, Math.min(SKN.length - 1, S2DUR.length - 1, S2HITS.length - 1, eraOf(stage))), ivl = (typeof Sys.stats.interval === 'function' ? Sys.stats.interval(ref) : BAL.s1Interval) || BAL.s1Interval, bossEvery = 1.15;   /* atkEvery do chefe no mkEnemy */
    const crit = 1 + Math.max(0, Math.min(100, diffNum(ref.critRate, 0))) / 100 * Math.max(0, diffNum(ref.critDmg, 100)) / 100;
    const U = diffUnits(kill, { ivl, s1i: BAL.s1Interval, s1d: SWT, s1t: 0.19, s2cd: BAL.s2Cooldown, s2d: S2DUR[E] || 1, s2h: S2HITS[E] || [[0.5, 1]], s2m: BAL.s2Mult, s3d: ULT_DUR, s3h: ULT_HITS, s3m: BAL.s3Mult,
      eHit: BAL.energyPerHit, eSkill: BAL.energyPerSkillHit, eHurt: BAL.energyPerHurt, hurtEvery: bossEvery, energy: 0, cd2: 0, petK: 0, petIvl: 2 });
    const C = T.commons || {}, hs = Math.max(0, diffNum(C.hpShareOfBoss, diffNum(C.shareOfBoss, 0))), ds = Math.max(0, diffNum(C.dmgShareOfBoss, diffNum(C.shareOfBoss, 0)));
    let nE = 0; if (T.boss.waveIncludesEscorts === true){ try { nE = waveSpec(stage, 5).filter(k => k !== 'boss').length; } catch (e) { nE = 0; } }
    const total = ref.atk * crit * U.u, dps = total / kill, hp = Math.max(1, total / (1 + nE * hs)), tE = nE ? Math.min(surv, nE * hs * hp / dps) : 0;   /* tE = quando cai a última escolta */
    let eHits = 0; for (let i = 1; i <= nE; i++) eHits += (tE * i / nE) / BAL.commonAtkInterval; const bHits = Math.max(1, (surv - tE) / bossEvery);
    const def = Math.max(0, diffNum(ref.def, 0)), after = d => Sys.stats.hit({ atk: d, critRate: 0, critDmg: 0 }, 1, def, false).dmg, sum = d => bHits * after(d) + (ds > 0 ? eHits * after(d * ds) : 0), want = ref.hp;
    let lo = 0, hi = want / bHits; for (let i = 0; i < 80 && sum(hi) < want; i++) hi *= 2; for (let i = 0; i < 60; i++){ const m = (lo + hi) / 2; if (sum(m) < want) lo = m; else hi = m; }
    out = { hp, dmg: Math.max(1e-6, hi), chp: Math.max(1, hp * hs), cdmg: hi * ds, hs, ds, need, ref, dps, kill, surv, escorts: nE }; }
  if (Object.keys(DIFF.memo).length > 200) DIFF.memo = {}; DIFF.memo[key] = out; return out; }
/* inimigo de FASE (mkEnemy). Devolve b (o de hoje) se a chave estiver desligada, em instância ou sem tabela. */
function diffEnemy(stage, kind, b){ if (!diffOn() || !DIFF.tbl || (typeof B !== 'undefined' && B.inst)) return b;
  try { const x = diffBoss(stage); if (!x) return b; if (kind === 'boss') return { hp: x.hp, dmg: x.dmg, diff: true }; return x.hs > 0 && x.ds > 0 ? { hp: x.chp, dmg: x.cdmg, diff: true } : b; } catch (e) { return b; } }
/* FÚRIA: o relógio (DIFF.ft) corre desde que o primeiro inimigo da onda do chefe chegou ao lugar dele; zera quando a onda recomeça ou acaba.
   Passado o tempo, o dano do chefe multiplica (uma vez) e a tela avisa. */
function diffStep(dt){ if (!diffOn() || !DIFF.tbl || B.inst) return; const T = DIFF.tbl.boss; if (!T) return; const at = diffNum(T.furyAtSec, 0), m = diffNum(T.furyDmgMult, 1); if (!(at > 0) || !(m > 1)) return;
  if (S.wave !== 5 || B.deadT > 0 || (!B.en.length && B.toSpawn.length > 1)){ DIFF.ft = 0; return; }
  if (DIFF.ft > 0 || B.en.some(e => e.wasParked)) DIFF.ft = (DIFF.ft || 0) + dt; if (!(DIFF.ft >= at)) return;
  for (const e of B.en){ if (!e.boss || !e.diff || e.dead || e.fury) continue;
    e.fury = m; B.banner = { txt: 'FÚRIA DO CHEFE', sub: 'Dano x' + m, t: 0, dur: 1.8, col: '#ff5252' }; B.shake = Math.max(B.shake || 0, .5); try { snd('boss_appear'); } catch (er) {} DIFF.hk = null; } }
const diffFury = () => { try { return diffOn() && B.en.some(e => e.boss && e.fury > 1 && !e.dead); } catch (e) { return false; } };
/* herói caiu numa onda comum com a FC abaixo da pedida: o aviso diz o que falta e onde ver o que fazer */
function diffDeadMsg(){ if (!diffOn()) return ''; try { const need = fcNeed(S.stage), fc = heroFC(); if (fc >= need) return ''; return 'Derrotado: faltam ' + fcShow(Math.max(1, Math.ceil(need - fc))) + ' de FC. Toque em Desafiar para ver como ficar mais forte'; } catch (e) { return ''; } }

/* ---------------- HUD ---------------- */
/* o que o HUD mostra: {text, color, tier, need, aria, xp} (puro; o teste lê daqui) */
function diffHudInfo(fc, stage){ const boss = S.wave === 5, need = fcNeed(stage, boss ? 'boss' : 'stage'), tier = diffTier(fc, need), fury = boss && diffFury(); let xp = '';
  try { const c = Sys.level.killCap(S, Sys.host); if (c && c.on && c.full > 0 && c.used >= c.full) xp = 'XP de abate cheia até ' + (typeof gNum === 'function' ? gNum : fmt)(c.full) + ' por dia: agora rende ' + Math.round(c.rate * 100) + '%'; } catch (e) {}
  return { need, tier, color: fury ? DIFF.col[2] : DIFF.col[tier], text: fury ? 'Chefe em fúria: dano x' + diffNum(DIFF.tbl && DIFF.tbl.boss && DIFF.tbl.boss.furyDmgMult, 1) : (boss ? 'Chefe: FC ' : 'FC recomendada ') + fcShow(need), xp,
    aria: 'FC recomendada ' + (boss ? 'do chefe' : 'da fase') + ': ' + fcShow(need) + '. A sua: ' + fcShow(fc) + (tier === 0 ? ' (suficiente)' : tier === 1 ? ' (um pouco abaixo)' : ' (bem abaixo)') }; }
function diffHud(fc){ const el = document.getElementById('dfh'); if (!diffOn() || B.inst){ if (el) el.remove(); DIFF.hk = null; if (DIFF.dfx){ DIFF.dfx = false; try { document.body.classList.remove('dfx'); } catch (e) {} } return; }
  const host = document.getElementById('fb_w'); if (!host) return; let e = el;
  if (!e){ e = document.createElement('div'); e.id = 'dfh'; e.setAttribute('role', 'img'); e.style.cssText = 'position:absolute;left:78px;right:74px;top:110px;display:flex;flex-direction:column;align-items:center;gap:1px;pointer-events:none';
    e.innerHTML = '<span id="dfh_t" style="max-width:100%;height:15px;padding:0 8px;border-radius:8px;background:rgba(22,16,12,.86);border:1px solid rgba(255,236,200,.18);font-size:10.5px;line-height:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box"></span><span id="dfh_x" style="max-width:100%;font-size:9px;line-height:11px;font-weight:800;color:#c9b9a2;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>';
    host.appendChild(e); DIFF.hk = null; diffCss(); }
  const I = diffHudInfo(fc, S.stage), k = I.text + '|' + I.color + '|' + I.xp; if (DIFF.hk === k) return; DIFF.hk = k;
  const t = document.getElementById('dfh_t'), x = document.getElementById('dfh_x'); if (t){ t.textContent = I.text; t.style.color = I.color; } if (x){ x.textContent = I.xp; x.style.display = I.xp ? '' : 'none'; } e.setAttribute('aria-label', I.aria + (I.xp ? '. ' + I.xp : ''));
  if (!!I.xp !== !!DIFF.dfx){ DIFF.dfx = !!I.xp; try { document.body.classList.toggle('dfx', DIFF.dfx); } catch (er) {} } }   /* com a linha do teto de XP os avisos (toast) descem 14 px: ver diffCss */
function diffCss(){ if (DIFF.css) return; DIFF.css = true; try { const st = document.createElement('style'); st.textContent = 'body.fb.dfx #toast{top:calc(var(--fbsafe,0px) + 142px * var(--fbs,1))}#dfc button{font-family:inherit;cursor:pointer}#dfc button:active{transform:scale(.97)}'; document.head.appendChild(st); } catch (e) {} }

/* ---------------- cartão "Faltam X de FC" ---------------- */
/* destino de cada ação do Sys.advice (tab). scr = tela registrada (Screens/Panels); unl = chave da liberação por nível do MENU */
const DIFF_ROUTE = { gear: { name: 'Equip.' }, forge: { name: 'Forja', scr: 'forge', unl: 'forge' }, pet: { name: 'Pets', scr: 'pets', unl: 'pets' }, mount: { name: 'Montarias', scr: 'mounts', unl: 'mount' },
  titles: { name: 'Títulos', scr: 'profile', unl: 'profile', opts: { tab: 'tit' } }, hero: { name: 'Lutar', farm: true } };
/* null = não existe tela para a ação (ela não entra na lista) · {lock:N, why} = tela trancada por nível (a linha mostra o motivo) · senão, pode abrir */
function diffRoute(tab){ const R = DIFF_ROUTE[tab]; if (!R) return null; if (!R.scr) return { name: R.name, farm: !!R.farm, tab };
  let ok = false; try { ok = !!(window.Screens && Screens.reg && Screens.reg[R.scr] && !Screens.reg[R.scr].broken && (!window.Panels || !Panels.defs || !Panels.defs[R.scr] || Panels.on(R.scr))); } catch (e) { ok = false; } if (!ok) return null;
  let open = true, lv = 1; try { if (typeof fbUnl === 'function') open = !!fbUnl(R.unl); if (!open) lv = typeof fbLvU === 'function' ? fbLvU(R.unl) : (FB_UNLOCK[R.unl] || 1); } catch (e) { open = true; }
  return open ? { name: R.name, scr: R.scr, opts: R.opts, tab } : { name: R.name, tab, lock: lv, why: 'Abre no nível ' + lv }; }
const diffEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* regra do dono: zero emoji e zero estrela desenhada. "2★" vira "2 estrelas"; qualquer outro símbolo some. */
const diffTxt = s => String(s == null ? '' : s).replace(/(\d+)\s*★/g, (m, n) => n + (n === '1' ? ' estrela' : ' estrelas')).replace(/[←-⯿　-〿︀-️‍]|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').replace(/\s{2,}/g, ' ').trim();
/* o Sys.advice recebe uma CÓPIA do save: os módulos que ele consulta abrem o dia deles no primeiro uso (torre, instâncias) e abrir o cartão não pode mudar o save */
const diffCopy = o => { try { return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)); } catch (e) { return JSON.parse(JSON.stringify(o)); } };
/* conselho da Sistemas, já filtrado para o que tem tela: {text, fc, need, missing, ok, actions:[{label, gainText, route}]} (no máximo 3) */
function diffAdvice(need){ const out = { on: false, fc: 0, need, missing: 0, ok: true, text: '', actions: [] }; if (!diffOn()) return out;
  let r = null; try { if (window.Sys && typeof Sys.advice === 'function'){ if (Sys.advice.DATA && Sys.advice.DATA.on !== true) Sys.advice.DATA.on = true; r = Sys.advice(diffCopy(S), Sys.host, { need, limit: 12 }); } } catch (e) { r = null; }
  const fc = r && r.on ? r.fc : heroFC(), miss = Math.max(0, Math.ceil(need - fc)); out.on = true; out.fc = fc; out.missing = miss; out.ok = miss === 0;
  out.text = miss > 0 ? 'Faltam ' + fcShow(miss) + ' de FC' : 'FC suficiente';
  for (const a of (r && r.actions) || []){ if (out.actions.length >= 3) break; if (/^(buy|shop|summon)/.test(String(a.kind || ''))) continue;   /* nenhuma opção de compra */
    const route = diffRoute(a.tab); if (!route) continue; const label = diffTxt(a.label); if (!label) continue;
    out.actions.push({ id: a.id, kind: a.kind, tab: a.tab, label, gainText: diffTxt(a.gainText), ready: !!a.ready, route }); }
  return out; }
/* uma linha = um botão inteiro (ação, ganho e a tela de destino). pre = prefixo do data (data-q na Derrota, data-d no cartão) */
function diffRowsHtml(adv, attr, delay){ return adv.actions.map((a, i) => { const L = a.route.lock, fs = a.label.length > 46 ? 11 : a.label.length > 34 ? 11.5 : 12.5;
    return `<button class="q-path" ${attr}="adv:${i}" aria-label="${diffEsc(a.label + ': ' + a.gainText + '. ' + (L ? a.route.why : 'Abrir ' + a.route.name))}" style="flex:1;min-height:0;min-width:0;width:100%;display:flex;align-items:center;gap:8px;padding:0 8px 0 10px;border-radius:14px;border:2px solid ${L ? '#4a3a2b' : '#6a4a1a'};background:linear-gradient(180deg,#3a2c1f,#241a12);color:#f6ecdf;text-align:left;box-sizing:border-box${delay != null ? ';animation-delay:' + (delay + i * 0.15).toFixed(2) + 's' : ''}">
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px"><span style="font-size:${fs}px;line-height:1.15;font-weight:900;display:-webkit-box;-webkit-line-clamp:${L ? 1 : 2};-webkit-box-orient:vertical;overflow:hidden;word-break:break-word">${diffEsc(a.label)}</span>${L ? `<span style="font-size:10.5px;line-height:1.15;font-weight:800;color:#ffb3a8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${diffEsc(a.route.name)}: ${a.route.why.toLowerCase()}</span>` : ''}</span>
      <span style="flex:none;max-width:92px;font-size:12.5px;font-weight:900;color:#5fd068;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${diffEsc(a.gainText)}</span>
      <span style="flex:none;width:74px;height:30px;border-radius:10px;${L ? 'background:#16110d;border:1px solid #4a3a2b;color:#c9b9a2' : 'background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403'};font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;white-space:nowrap;box-sizing:border-box">${L ? 'Nv ' + L : diffEsc(a.route.name)}</span></button>`; }).join(''); }
/* DERROTA: as 3 ações no lugar dos 3 caminhos fixos, na MESMA caixa de 150 px (a altura da tela não muda). '' = fica a tela de hoje. */
function diffLoseRows(need){ if (!diffOn()) return ''; let adv; try { adv = diffAdvice(need); } catch (e) { return ''; } if (!adv.actions.length) return ''; DIFF.card = { adv, from: 'lose' };
  return `<div id="res_adv" style="flex:none;height:150px;display:flex;flex-direction:column;gap:6px">${diffRowsHtml(adv, 'data-q', typeof RES_LOSE_PATH === 'number' ? RES_LOSE_PATH : 1.1)}</div>`; }
/* ANTES DO CHEFE: cartão por cima do HUD, na base de 390 px (escala pela largura, como o HUD e a Derrota): nunca passa da largura da tela.
   Fica entre a faixa da fase e a cabeça do herói; se faltar altura, encolhe a partir do topo (até 0,7). Toque fora fecha. */
function diffCardHtml(adv, G){ const n = adv.actions.length, rowsH = n ? n * 46 + (n - 1) * 6 : 0, h = 14 + 28 + 18 + (n ? 10 + rowsH : 26) + 12 + 46 + 14, top = G.top, avail = G.feet - G.hs * 1.05 - 40, f = top + h > avail ? Math.max(0.7, Math.min(1, (avail - top) / h)) : 1;
  return `<div id="dfc_w" style="position:absolute;left:0;top:0;width:390px;height:${G.Hb.toFixed(1)}px;transform-origin:0 0;transform:scale(${G.s.toFixed(4)})">
    <div id="dfc_c" data-d="keep" style="position:absolute;left:16px;right:16px;top:${top.toFixed(1)}px;padding:14px 12px;border-radius:18px;background:rgba(29,22,17,.97);border:2px solid #6a4a1a;box-shadow:0 10px 30px rgba(0,0,0,.6);display:flex;flex-direction:column;box-sizing:border-box;transform-origin:50% 0;transform:scale(${f.toFixed(3)})">
      <h2 class="lil" style="margin:0;height:28px;font-size:24px;line-height:28px;color:#ff8a7e;text-shadow:0 2px 0 #4a0d08;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${diffEsc(adv.text)}</h2>
      <span style="height:18px;font-size:12.5px;line-height:18px;font-weight:800;color:#e8dccb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Sua FC: <b style="color:#ffc94a">${fcShow(adv.fc)}</b> · o chefe pede <b style="color:#fff">${fcShow(adv.need)}</b></span>
      ${n ? `<div style="margin-top:10px;height:${rowsH}px;display:flex;flex-direction:column;gap:6px">${diffRowsHtml(adv, 'data-d', null)}</div>` : `<span style="height:26px;font-size:12px;line-height:26px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Continue lutando: ouro, itens e XP aumentam a FC.</span>`}
      <div style="margin-top:12px;height:46px;display:flex;gap:8px">
        <button data-d="x" class="lil" style="flex:1;min-width:0;border-radius:14px;border:2px solid #4a3a2b;background:#241a12;color:#f6ecdf;font-size:17px">Agora não</button>
        <button data-d="go" class="lil" style="flex:1.5;min-width:0;border-radius:14px;border:2px solid #7a2a20;background:linear-gradient(180deg,#ff6a50,#c0301f);color:#fff;font-size:17px;white-space:nowrap">Desafiar assim mesmo</button></div></div></div>`; }
function diffGeo(){ let G = null; try { if (typeof resGeo === 'function') G = resGeo(null); } catch (e) { G = null; }
  if (!G){ const app = document.getElementById('app'), W = (app && app.clientWidth) || 390, H = (app && app.clientHeight) || 844, s = W / 390; G = { s, Hb: H / s, feet: 0.758 * H / s, hs: 150 }; }
  let st = 0; try { st = typeof fbSafeTop === 'function' ? fbSafeTop() : 0; } catch (e) { st = 0; } G.top = (diffNum(+st, 0) / G.s) + 132; return G; }
/* abre o cartão antes do chefe. true = abriu (o toque no Desafiar para aqui); false = não é o caso (chave desligada ou FC suficiente) */
function diffAsk(){ if (!diffOn()) return false; const need = fcNeed(S.stage, 'boss'), fc = heroFC(); if (fc >= need) return false;
  let adv; try { adv = diffAdvice(need); } catch (e) { return false; } diffClose(); diffCss();
  const app = document.getElementById('app'); if (!app) return false; const el = document.createElement('div'); el.id = 'dfc'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', adv.text + ' para o chefe');
  el.style.cssText = 'position:absolute;inset:0;z-index:38;overflow:hidden;background:rgba(6,3,2,.6);font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none';
  el.innerHTML = diffCardHtml(adv, diffGeo()); el.addEventListener('click', ev => { const b = ev.target && ev.target.closest ? ev.target.closest('[data-d]') : null; diffAct(b ? b.dataset.d : 'x'); });
  app.appendChild(el); DIFF.card = { adv, from: 'boss', el }; try { snd('ui_tap'); } catch (e) {} return true; }
function diffClose(){ const c = DIFF.card; if (c && c.el){ try { c.el.remove(); } catch (e) {} } const el = document.getElementById('dfc'); if (el) el.remove(); if (c && c.from === 'boss') DIFF.card = null; }
function diffAct(d){ if (d === 'keep') return; if (d === 'x'){ diffClose(); return; }
  if (d === 'go'){ diffClose(); if (challengeBoss()) toast('Desafiando o chefe!'); return; }
  if (String(d).indexOf('adv:') === 0) diffGo(+String(d).slice(4)); }
/* toque numa ação: leva à tela dela. Trancada por nível = aviso com o motivo (nada fecha). Devolve o que fez (para o teste). */
function diffGo(i, from){ const c = DIFF.card; if (!c || !c.adv) return null; const a = c.adv.actions[i]; if (!a) return null; const r = a.route; from = from || c.from;
  if (r.lock){ toast(r.name + ': abre no nível ' + r.lock); return 'lock'; }
  try { snd('ui_tap'); } catch (e) {}
  if (from === 'lose'){ if (typeof resClose === 'function') resClose('farm'); DIFF.card = null; } else diffClose();   /* na Derrota o jogo segue no modo farm atrás da tela aberta, como nos caminhos de hoje */
  if (r.farm){ toast('Vença as ondas para ganhar XP e subir de nível'); return 'farm'; }
  if (r.scr){ let ok = false; try { ok = !!Screens.open(r.scr, r.opts || {}); } catch (e) { ok = false; } if (!ok) setView('gear'); return ok ? r.scr : 'gear'; }
  setView('gear'); return 'gear'; }
addEventListener('resize', () => { try { const c = DIFF.card; if (c && c.from === 'boss' && c.el) c.el.innerHTML = diffCardHtml(c.adv, diffGeo()); } catch (e) {} });

/* chave: só em ?debug=1&diff=1 (nada muda para o jogador até o dono mandar ligar) */
if (typeof DEBUG !== 'undefined' && DEBUG && typeof QP !== 'undefined' && QP.get('diff') === '1') diffSet(true);
