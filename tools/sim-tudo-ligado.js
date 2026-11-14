// EQUILÍBRIO COM TUDO LIGADO (Sistemas, 14/11; docs/EQUILIBRIO_TUDO_LIGADO.md). SÓ MEDE: não muda número do jogo.
// Uso: node tools/sim-tudo-ligado.js            → tabela por era: % de poder dos módulos novos, FC com e sem, efeito escondido na luta
//      node tools/sim-tudo-ligado.js --tudo     → JSON para o tools/cal-tudo.js (luta real do Senhor da Era no sandbox)
//      node tools/sim-tudo-ligado.js --dias [--xp=24] [--semfc] [--sopct]    → o tools/sim-paredes.js de novo, com a FC dos módulos e o XP extra (dias em parede, fim das eras)
// "Pior caso razoável" = grátis ATIVO com tudo, no Senhor da Era de cada era (nível e equipamento do herói de referência Sys.stats.refFromFc):
//  Provação: 1 por 10 níveis (+1% ATQ e VIDA cada) · Mentores: os das eras anteriores com 4 marcos (600 pts), o da era atual com 2 (abrem no Nv 16)
//  Encruzilhada: 1 bênção na era (+3% ATQ) · Grimório: magia A das eras anteriores + B das eras até a atual; as 3 de dano do conjunto Chefe no nível
//  da era (LV), as outras 3 níveis abaixo · Guilda V2: estandartes ATQ/VIDA/DEF subindo até o teto (5/5/3) na era 3 · Caminho (Nv 30): o estilo
//  que a era é "Fraco contra" (1 troca grátis por semana) · Golpes dos itens: valor esperado (q = 0,5) do sorteio dos 7 espaços + asa na raridade da era.
// Já estavam na medida da calibração (não entram como novos): títulos, prática, pet, montaria, Forja, skins, VIP (parede segue o grátis).
'use strict';
const R = p => require(process.cwd() + '/js/sys/' + p + '.js');
const ST = R('stats'), FC = R('fc'), K = R('strikes'), GR = R('grimoire'), ME = R('mentors'), PA = R('path'), AF = R('affinity'), TI = R('titles'), PR = R('practice');
ST.setEra9(true); K.setOn(true);
const BAL = JSON.parse(require('fs').readFileSync(process.cwd() + '/docs/balance.json', 'utf8')).dificuldade;
const REC = BAL.recFc, KILL = BAL.boss.killSecAt100;
const LV_SPELL = [1, 2, 3, 5, 6, 7, 8, 9, 10];              // nível das 3 magias do conjunto Chefe no Senhor da Era (tinta ~25/dia)
const GUILD = [[0, 0, 0], [1, 1, 0.6], [3, 3, 1.5], [5, 5, 3], [5, 5, 3], [5, 5, 3], [5, 5, 3], [5, 5, 3], [5, 5, 3]];
const MARK_PAST = 4, MARK_NOW = 2;
const r1 = v => Math.round(v * 10) / 10, pc = v => (v >= 0 ? '+' : '') + r1(v).toString().replace('.', ',') + '%';

function era(e) {
  const stage = e * 10 + 10, ref = ST.refFromFc(REC[stage - 1], stage), L = ref.level, rr = ref.rarity;
  const d = { atk: 0, hp: 0, crit: 0, def: 0 }, src = {};
  const add = (k, o) => { src[k] = o; for (const x in o) d[x] += o[x]; };
  const tp = Math.floor(L / 10); add('Provação', { atk: tp, hp: tp });
  const me = { atk: 0, hp: 0, crit: 0, def: 0 }, MAP = { atkPct: 'atk', hpPct: 'hp', critPct: 'crit', defPct: 'def' };
  if (L >= ME.DATA.needLevel) for (const m of ME.DATA.list) { if (m.era > e || !MAP[m.stat]) continue; me[MAP[m.stat]] += m.per * (m.era < e ? MARK_PAST : MARK_NOW); }
  add('Mentores', me);
  add('Encruzilhada', { atk: 3 });
  const g = GUILD[e]; add('Guilda V2', { atk: g[0], hp: g[1], def: g[2] });
  // Grimório: A das eras < e (Senhor vencido), B das eras <= e (chefe do meio vencido)
  const own = GR.DATA.spells.filter((s, i) => (i % 2 === 0 ? s.era < e : s.era <= e));
  const lvOf = (lv, s) => GR.stat(s, lv), dps = (s, lv) => { const st = lvOf(lv, s); return st.mult / st.cd; };
  const dmg = own.filter(s => s.kind === 'dmg').sort((a, b) => dps(b, LV_SPELL[e]) - dps(a, LV_SPELL[e])).slice(0, 3);
  const gp = { atk: 0, hp: 0, crit: 0, def: 0 }; for (const s of own) { const lv = dmg.includes(s) ? LV_SPELL[e] : Math.max(1, LV_SPELL[e] - 3); gp[MAP[s.passive]] += GR.passiveOf(s, lv); }
  add('Grimório (passivo)', gp);
  // Caminho e afinidade
  const weak = AF.DATA.eras[e].weak, eraW = AF.DATA.eraStyle[e], path = L >= PA.DATA.unlockLevel ? PA.DATA.paths.find(p => p.style === weak) || null : null;
  const style = path ? path.style : eraW, aff = style === weak ? 1 + AF.DATA.weak : style === AF.DATA.eras[e].resist ? 1 + AF.DATA.resist : 1;
  // golpes dos itens: valor esperado por espaço (cada golpe do pool tem chance count/len de sair; q médio 0,5)
  const stk = { combo: 0, counter: 0, stun: 0, dodge: 0, lifesteal: 0 }, cnt = K.DATA.count[rr] || 0;
  for (const slot in K.DATA.pool) { if (slot === 'wing' && (L < 50 || rr < 2)) continue; const pool = K.DATA.pool[slot], c = Math.min(cnt, pool.length);
    for (const k of pool) stk[k] += (c / pool.length) * K.value({ k, q: 0.5 }, { r: slot === 'weapon' && rr === 3 ? 2 : rr, e }); }
  const stkAll = Object.assign({}, stk); if (path) for (const k in path.strikes) stkAll[k] += path.strikes[k];
  const capB = {}; for (const k in stkAll) capB[k] = Math.min(stkAll[k], K.DATA.bossCap[k]);
  // FC: referência (= FC pedida) e com os módulos. P0 = % que o grátis já tinha (títulos da fase + prática na metade do teto), o novo soma em cima.
  let tA = 0, tH = 0; for (const t of TI.DATA.titles) { const c = t.cond; if (c.type === 'stage' && c.n <= stage - 1 || c.type === 'era' && c.n <= e) { tA += (t.bonus.atkPct || 0) * TI.DATA.bonusMult; tH += (t.bonus.hpPct || 0) * TI.DATA.bonusMult; } }
  const prac = (PR.DATA.cap.base + PR.DATA.cap.perEra * e) * 0.5 * 0.5, P0a = tA + prac, P0h = tH + prac;
  const fc0 = FC.fcOfStats(ref), st = Object.assign({}, ref, { atk: ref.atk * (1 + (P0a + d.atk) / 100) / (1 + P0a / 100), hp: ref.hp * (1 + (P0h + d.hp) / 100) / (1 + P0h / 100), critRate: ref.critRate + d.crit, def: ref.def * (1 + d.def / 100) });
  const fcPct = FC.fcOfStats(st), stS = Object.assign({}, st, { strikes: stkAll }), fcAll = FC.fcOfStats(stS);
  // efeito escondido (não está na FC): afinidade, atributo do caminho, magias de dano (ATQ por segundo / ATQ por segundo do golpe básico com crítico)
  const ps = path ? path.stat : {}, ivl = ST.interval(Object.assign({}, st, { aspd: (st.aspd || 0) + (ps.aspd || 0) })), ivl0 = ST.interval(st);
  const cr = Math.min(100, st.critRate) / 100, cdm = (st.critDmg + (ps.critDmg || 0)) / 100, base = (1 + cr * st.critDmg / 100) / ivl0;
  const pathMul = ((1 + cr * cdm) / ivl) / base, spellPerSec = dmg.reduce((a, s) => a + dps(s, LV_SPELL[e]), 0), spellMul = 1 + spellPerSec / base;
  const comboMul = 1 + K.DATA.comboMult * capB.combo / 100;   // combo contra o chefe (teto de chefe): golpe extra de 50% do básico
  return { e, stage, L, rar: rr, src, d, P0a: r1(P0a), fcGainPct: (fcPct / fc0 - 1) * 100, fcAllPct: (fcAll / fc0 - 1) * 100, stk: capB, stkItems: stk, path: path ? path.id : null, aff, pathMul, spellMul, comboMul,
    spells: dmg.map(s => s.id), lv: LV_SPELL[e], fc0 };
}
const E = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(era);

if (process.argv.includes('--tudo')) {
  const atkG = x => { const a = x.src; let s = 0; for (const k in a) s += a[k].atk || 0; return s; };
  console.log(JSON.stringify({ pct: E.map(x => ({ atk: r1(x.d.atk * 100 / (100 + x.P0a)), hp: r1(x.d.hp * 100 / (100 + x.P0a)), crit: r1(x.d.crit), def: r1(x.d.def) })), path: E.map(x => x.path), spells: E.map(x => x.spells), lv: E.map(x => x.lv), stk: E.map(x => x.stkItems) }));
  process.exit(0);
}
if (!process.argv.includes('--dias')) {
  console.log('## Poder dos módulos novos no Senhor da Era (grátis ativo com tudo)');
  console.log('| Era | Nv | Provação | Mentores | Encruzilhada | Guilda V2 | Grimório passivo | Soma ATQ / VIDA / crít / DEF | FC: só % | FC: % + golpes | Caminho | Afinidade | Caminho na luta | Magias (3, Nv) | Combo vs chefe | Poder na luta (estimado) | Tempo do chefe (killSec ÷ poder) |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const s = o => [o.atk ? 'A' + r1(o.atk) : '', o.hp ? 'V' + r1(o.hp) : '', o.crit ? 'C' + r1(o.crit) : '', o.def ? 'D' + r1(o.def) : ''].filter(Boolean).join(' ') || '0';
  for (const x of E) { const fcM = 1 + x.fcAllPct / 100, fight = x.aff * x.pathMul * x.spellMul * (1 + x.fcGainPct / 200);   // na luta: ATQ dos % (metade da FC: ATQ e VIDA crescem juntos) + golpes (combo) + escondidos
    const pw = fight * x.comboMul;
    console.log('| ' + x.e + ' | ' + x.L + ' | ' + s(x.src['Provação']) + ' | ' + s(x.src['Mentores']) + ' | ' + s(x.src['Encruzilhada']) + ' | ' + s(x.src['Guilda V2']) + ' | ' + s(x.src['Grimório (passivo)']) + ' | ' +
      [x.d.atk, x.d.hp, x.d.crit, x.d.def].map(r1).join(' / ') + ' | ' + pc(x.fcGainPct) + ' | ' + pc(x.fcAllPct) + ' | ' + (x.path || '—') + ' | x' + x.aff.toFixed(2) + ' | x' + x.pathMul.toFixed(2) + ' | ' + x.spells.length + ' (Nv ' + x.lv + ') x' + x.spellMul.toFixed(2) + ' | ' + r1(x.stk.combo) + '% x' + x.comboMul.toFixed(2) + ' | x' + pw.toFixed(2) + ' | ' + Math.round(KILL[x.e] / pw) + ' s de ' + KILL[x.e] + ' |'); }
  console.log('\nGolpes dos itens (valor esperado, teto de chefe) por era: ' + E.map(x => x.e + ': ' + Object.entries(x.stk).filter(([, v]) => v > 0.05).map(([k, v]) => k + ' ' + r1(v)).join(', ')).join(' | '));
  console.log('P0 (títulos + prática na metade, % de ATQ que o grátis já tinha): ' + E.map(x => x.P0a).join(' / '));
  process.exit(0);
}
// --dias: roda o tools/sim-paredes.js com a FC multiplicada pelos módulos (por era, valor do Senhor) e a XP extra (XPX, % em toda XP, depois do teto de abate)
const XPX = +((process.argv.find(a => a.startsWith('--xp=')) || '--xp=24').split('=')[1]), FCON = !process.argv.includes('--semfc');
const MUL = E.map(x => 1 + (process.argv.includes('--sopct') ? x.fcGainPct : x.fcAllPct) / 100);   // --sopct: só os % (sem os golpes dos itens)
let src = require('fs').readFileSync(process.cwd() + '/tools/sim-paredes.js', 'utf8');
const rep = (a, b) => { if (!src.includes(a)) throw new Error('sim-paredes mudou: ' + a.slice(0, 50)); src = src.replace(a, b); };
rep("const v=baseFc(L,e,r,forge,o.vip?6000:4000)*pct*trainMul", "const v=(o.mod?o.mod[e]:1)*baseFc(L,e,r,forge,o.vip?6000:4000)*pct*trainMul");
rep("key=(o.vip||0)+'|'+(o.lazy?1:0)+'|'", "key=(o.tag||'')+(o.vip||0)+'|'+(o.lazy?1:0)+'|'");
rep("function dayXp(e,L,o){", "function dayXp(e,L,o){ return dayXp0(e,L,o)*(1+(o.xpx||0)/100); }\nfunction dayXp0(e,L,o){");
rep("const P={free:play(free),vip5:play(vip5),vip10:play(vip10),lazy:play(lazy)};", "const P={free:play(free),vip5:play(vip5),vip10:play(vip10),lazy:play(lazy)};\n__TUDO(P,play,curve,plan,fcAt,END);");
global.__TUDO = (P, play, curve, plan, fcAt) => {
  const mk = o => curve(Object.assign({ tag: 'T', mod: FCON ? MUL : null, xpx: XPX }, o));
  const C = { free: mk({}), vip10: mk({ vip: 10 }), lazy: mk({ lazy: true }) }, Q = { free: play(C.free), vip10: play(C.vip10), lazy: play(C.lazy) };
  const endD = (p, e) => p.pass[e * 10 + 9] != null ? Math.ceil(p.pass[e * 10 + 9]) : 'trava';
  const wall = (p, j) => p.stuck[j] != null ? r1(p.stuck[j]) : '—';
  const arr = (Cv, p, j) => { const a = p.pass[j - 1]; return a == null ? '—' : Math.round(fcAt(Cv, a, plan[j].e) / plan[j].rec * 100) + '%'; };
  console.log('\n## TUDO LIGADO (FC dos módulos ' + (FCON ? 'sim' : 'não') + ', XP +' + XPX + '%) contra o de hoje');
  console.log('| Era | Fim da era grátis: hoje → tudo | VIP 10: hoje → tudo | Sem Forja nem pet: hoje → tudo | Senhor: FC ao chegar (grátis) hoje → tudo | Espera no Senhor (dias) grátis: hoje → tudo |');
  console.log('|---|---|---|---|---|---|');
  for (let e = 0; e < 9; e++) { const j = e * 10 + 9;
    console.log('| ' + e + ' | ' + endD(P.free, e) + ' → ' + endD(Q.free, e) + ' | ' + endD(P.vip10, e) + ' → ' + endD(Q.vip10, e) + ' | ' + endD(P.lazy, e) + ' → ' + endD(Q.lazy, e) + ' | ' +
      arr(global.__free, P.free, j) + ' → ' + arr(C.free, Q.free, j) + ' | ' + wall(P.free, j) + ' → ' + wall(Q.free, j) + ' |'); }
  const days = p => plan.reduce((a, pl, j) => a + (pl.wall && p.stuck[j] != null ? p.stuck[j] : 0), 0);
  console.log('dias em parede (grátis): hoje ' + r1(days(P.free)) + ' → tudo ' + r1(days(Q.free)) + ' · VIP 10: ' + r1(days(P.vip10)) + ' → ' + r1(days(Q.vip10)) + ' · sem Forja nem pet: fases ' + P.lazy.done + ' → ' + Q.lazy.done);
  console.log('FC dos módulos por era (x): ' + MUL.map(v => v.toFixed(3)).join(' / '));
};
rep("const free=curve({}),", "const free=global.__free=curve({}),");
const log0 = console.log; console.log = (...a) => { const t = String(a[0]); if (/^## TUDO|^\| Era \| Fim da era grátis: hoje|^dias em parede|^FC dos módulos|^calendário/.test(t) || (/^\| \d \|/.test(t) && t.includes('→')) || t === '|---|---|---|---|---|---|') log0(...a); };
// eslint-disable-next-line no-eval
new Function('require', 'process', 'global', src)(require, process, global);
console.log = log0;
