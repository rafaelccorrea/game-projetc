// Simulação LEVE da economia de ouro (Sistemas, 14/11): todas as fontes medidas em MINUTOS DE ABATE da fase atual e o tempo para
// pagar uma melhoria (tentativa de Forja, nível de Montaria, nível da arma) em 5 cenários. Roda em menos de 1 s, sem navegador.
// Uso: node tools/sim-ouro.js [--md]   (--md imprime as tabelas em Markdown para o docs/ECONOMIA_OURO.md)
// Premissas (docs/ECONOMIA_OURO.md §1): 1 min de abate = 24 abates comuns (ritmo medido da build, o mesmo do Sys.mapchest e do Sys.clock);
// abates por dia = KILL do tools/sim-180-dias.js (jogador grátis típico); 10 fases por era (curva de hoje); 1 volta do offline de 8 h por dia;
// Mina de Ouro com 40 abates no Normal; Hora de Ouro pega 30 min de jogo; torre 2 andares/dia no andar 1,5 × fase.
'use strict';
const R = p => require(process.cwd() + '/js/sys/' + p + '.js');
const ST = R('stats'), FG = R('forge'), MO = R('mount'), CH = R('chest'), PA = R('pass'), TW = R('tower'), IN = R('instances'), AR = R('arena');
const AC = R('activity'), LG = R('login'), DU = R('duo'), GF = R('guildfire'), CA = R('camp'), TR = R('trial'), BL = R('bossloss'), CR = R('crossroads');
ST.setEra9(true);
const MD = process.argv.includes('--md');
const KPM = 24, KILL = [3663, 3180, 3024, 3934, 3909, 4854, 4846, 4842, 5799];
const LIN = [1, 12, 25, 40, 55, 70, 85, 100, 110], LOUT = [12, 25, 40, 55, 70, 85, 100, 110, 120];
const raw = s => Math.ceil(4 * Math.pow(1.15, s - 1));                 // js/battle.js mkEnemy sem o commonGoldMult (offline do js/meta.js usa este)
const unit = s => Math.max(1, Math.ceil(4 * Math.pow(1.15, s - 1) * 0.32)); // = host.goldUnit (js/farm.js): ouro de 1 abate comum
const eraOf = s => Math.min(8, Math.floor((s - 1) / 10));
const lvlOf = s => { const e = eraOf(s), f = ((s - 1) % 10) / 10; return Math.round(LIN[e] + f * (LOUT[e] - LIN[e])); };
const sum = a => a.reduce((x, y) => x + y, 0);

/* ---- fontes: cada uma devolve {claim, day} em ABATES (unidades de goldUnit) na fase s. old = números de hoje, neu = números propostos ---- */
const passFree = sum(PA.DATA.free.map(r => r.goldk || 0));
const actOld = [40, 40, 60, 60, 120], actNew = [24, 24, 24, 24, 48];
const SRC = [
  // VIVAS (no jogo hoje)
  { id: 'offline', name: 'Offline 8 h (js/meta.js)', live: true, old: s => { const g = 480 * 6 * 0.5 * raw(s) / unit(s); return { claim: g, day: g }; },
    neu: s => { const g = 480 * 6 * 0.5; return { claim: g, day: g }; }, note: 'ouro por abate SEM o commonGoldMult 0,32' },
  { id: 'chest', name: 'Baú de abates (Sys.chest)', live: true, old: () => ({ claim: CH.DATA.goldUnits[1], day: CH.DATA.dailyCap * sum(CH.DATA.goldUnits) / 2 }), neu: null },
  { id: 'pass', name: 'Passe grátis (Sys.pass)', live: true, old: () => ({ claim: Math.max(...PA.DATA.free.map(r => r.goldk || 0)), day: passFree / 27 }), neu: null },
  { id: 'tower', name: 'Torre, 2 andares/dia (Sys.tower)', live: true, old: s => { const f = Math.round(1.5 * s), g = TW.DATA.reward.goldMult * (1 + TW.DATA.reward.goldPerFloor * f); return { claim: g, day: 2 * g }; },
    neu: s => { const f = Math.round(1.5 * s), g = Math.min(60, TW.DATA.reward.goldMult * (1 + 0.015 * f)); return { claim: g, day: 2 * g }; } },
  { id: 'inst', name: 'Instâncias, 2 chaves cada, Normal (Sys.instances)', live: true,
    old: () => { const rw = 1.6, mine = 4 * rw * 40, gear = 20 * rw, boss = 40 * rw; return { claim: 4 * 2.5 * 40, day: 2 * (mine + gear + boss) }; },
    neu: () => { const rw = 1.6, mine = Math.min(120, 1 * rw * 40), gear = 20 * rw, boss = 40 * rw; return { claim: 120, day: 2 * (mine + gear + boss) }; } },
  { id: 'arena', name: 'Arena: 3 lutas/dia + liga semanal (Sys.arena)', live: true,
    old: () => ({ claim: AR.DATA.leagues[2].prize.goldk, day: 2 * AR.DATA.fightRewards.goldkWin + AR.DATA.fightRewards.goldkLoss + AR.DATA.leagues[1].prize.goldk / 7 }),
    neu: () => ({ claim: 120, day: 2 * AR.DATA.fightRewards.goldkWin + AR.DATA.fightRewards.goldkLoss + 120 / 7 }) },
  { id: 'golden', name: 'Hora de Ouro +100% (Sys.schedule), 30 min jogados', live: true, old: () => ({ claim: 30 * KPM, day: 30 * KPM }), neu: () => ({ claim: 9 * KPM, day: 9 * KPM }) },
  // DESLIGADAS ANTIGAS (aprovadas antes; só proposta)
  { id: 'activity', name: 'Baús de atividade (Sys.activity)', old: () => ({ claim: 120, day: sum(actOld) }), neu: () => ({ claim: 48, day: sum(actNew) }) },
  { id: 'login', name: 'Login 7 dias (Sys.login)', old: () => ({ claim: 30, day: 50 / 7 }), neu: null },
  { id: 'achcodex', name: 'Conquistas + Coleção (180 dias)', old: () => ({ claim: 3000, day: (27 * 2360 + 5700) / 180 }), neu: () => ({ claim: 120, day: (27 * 288 + 360) / 180 }), note: 'estimativa: 27 conquistas × 4 níveis' },
  // NOVAS (desligadas; corrigidas neste commit: neu = o que está no código agora)
  { id: 'trial', name: 'Provação (Sys.trial), 1 a cada ~20 dias', fresh: true, old: s => { const k = Math.max(1, Math.floor(lvlOf(s) / 10)); return { claim: 60 * k, day: 60 * k / 20 }; },
    neu: () => { const g = TR.rewardOf(10, { goldUnit: () => 1 }).gold; return { claim: g, day: g / 20 }; } },
  { id: 'bossloss', name: 'Derrota premiada (Sys.bossloss)', fresh: true, old: s => { const w = BL.winGold(s) / unit(s), c = w * BL.DATA.share; return { claim: c, day: BL.DATA.dayMax * c / 3 }; }, neu: null, note: '1/3 do teto de 15/dia' },
  { id: 'duo', name: 'Dupla (Sys.duo) diária + semanais', fresh: true, old: () => ({ claim: 150, day: 30 + 470 / 7 }),
    neu: () => ({ claim: Math.max(...DU.DATA.weekly.map(m => m.reward.goldK)), day: DU.DATA.daily.reward.goldK + sum(DU.DATA.weekly.map(m => m.reward.goldK)) / 7 }) },
  { id: 'gfire', name: 'Fogueira da Guilda (Sys.guildFire), 9 baús em 60 dias', fresh: true, old: () => ({ claim: 400, day: 40 * 54 / 60 }),
    neu: () => ({ claim: GF.chestOf(10, { goldUnit: () => 1 }).gold, day: sum([2, 3, 4, 5, 6, 7, 8, 9, 10].map(L => GF.chestOf(L, { goldUnit: () => 1 }).gold)) / 60 }) },
  { id: 'camp', name: 'Acampamento, Tenda do Ouro Nv 5 + 2 pets Raros 2★ (Sys.camp)', fresh: true,
    old: () => { const r = 40 * 1.6 * 1.6; return { claim: r * 8, day: r * 24 }; },
    neu: () => { const d = CA.DATA.tents[0], r = d.perHour * 1.6 * 1.6, cap = d.capMin * KPM; return { claim: Math.min(cap, r * 8), day: Math.min(r * 24, 3 * cap) }; } },
  { id: 'mapchest', name: 'Baús do mapa (Sys.mapchest), 2 por era', fresh: true, old: () => ({ claim: 72, day: 144 / 7 }), neu: null, note: 'da outra sessão; só medido' },
  { id: 'cross', name: 'Encruzilhada ouro % (se o goldPct do Sys.fc for ligado ao abate)', fresh: true, pct: true, old: s => ({ claim: 0, day: 0.24 * KILL[eraOf(s)] }), neu: s => ({ claim: 0, day: 0.05 * KILL[eraOf(s)] }), note: 'antes: 3 de 9 escolhas × 8%' },
];
const val = (src, s, which) => { const f = which === 'neu' && src.neu ? src.neu : src.old; return f(s); };

/* cenários: quais fontes entram e com que números */
const SCN = [
  { id: 'A', name: 'Só abate', pick: () => null },
  { id: 'L', name: 'Hoje no jogo (vivas, números de hoje) = CURVA CALIBRADA', pick: x => x.live ? 'old' : null },
  { id: 'B', name: 'Hoje + tudo desligado ligado com os números antigos', pick: () => 'old' },
  { id: 'Cn', name: 'Depois deste commit: vivas de hoje + desligadas com os números novos', pick: x => x.live ? 'old' : (x.fresh ? 'neu' : 'neu') },
  { id: 'C', name: 'PROPOSTA inteira (vivas também corrigidas)', pick: () => 'neu' },
];
function extras(s, scn, claimsOnly) { let d = 0; for (const x of SRC) { if (claimsOnly && (x.id === 'offline' || x.pct)) continue; const w = scn.pick(x); if (w) d += val(x, s, w).day; } return d; }
const BUDGET = 65, X = 5;   // meta do dia: resgates (sem offline e sem %) <= 65 min de abate (~ +40% do dia típico); teto por resgate X = 5 min
const ratio = (s, scn) => extras(s, scn) / KILL[eraOf(s)];

/* custos das melhorias em abates da fase */
const forgeTry = () => FG.DATA.goldPerTryKills;
const mountLv = s => { const L = Math.max(1, Math.min(59, Math.floor(lvlOf(s) / 2))), C = MO.DATA.cost; return Math.ceil(C.goldK * (1 + C.growth * (L - 1)) * (1 + 2 * C.rarCost)); };   // Épica
const weaponLv = s => ST.upgradeCost({ lvl: lvlOf(s), r: 2, e: eraOf(s) }).gold / unit(s);
const minutes = (cost, s, scn) => cost / (KPM * (1 + ratio(s, scn)));   // minutos de jogo ativo para pagar

/* ---- saída ---- */
const f1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const big = n => n >= 1e9 ? f1(n / 1e9) + ' bi' : n >= 1e6 ? f1(n / 1e6) + ' mi' : n >= 1e3 ? f1(n / 1e3) + ' mil' : String(Math.round(n));
const P = MD ? (...c) => console.log('| ' + c.join(' | ') + ' |') : (...c) => console.log(c.join('  ·  '));
console.log(MD ? '### Fontes (minutos de abate por resgate · por dia; ouro absoluto por dia nas fases 10 / 30 / 50)\n' : '== FONTES ==');
if (MD) { P('Fonte', 'Hoje: resgate · dia (min)', 'Hoje: ouro/dia F10 · F30 · F50', 'Proposto: resgate · dia (min)', 'Proposto: ouro/dia F10 · F30 · F50'); P('---', '---', '---', '---', '---'); }
for (const x of SRC) {
  const o = val(x, 30, 'old'), n = val(x, 30, 'neu');
  const abs = w => [10, 30, 50].map(s => big(val(x, s, w).day * unit(s))).join(' · ');
  P(x.name + (x.live ? ' **(vivo)**' : x.fresh ? ' (nova, desligada)' : ' (desligada)'), f1(o.claim / KPM) + ' · ' + f1(o.day / KPM), abs('old'), x.neu ? f1(n.claim / KPM) + ' · ' + f1(n.day / KPM) : 'igual', x.neu ? abs('neu') : 'igual');
}
console.log(MD ? '\n### Ouro extra do dia sobre o ouro de abate (abates do dia: ' + KILL.join(', ') + ' por era)\n' : '\n== EXTRA DO DIA / ABATE DO DIA ==');
if (MD) { P('Cenário', 'F10', 'F30', 'F50', 'F80'); P('---', '---', '---', '---', '---'); }
for (const c of SCN) P(c.id + ' ' + c.name, ...[10, 30, 50, 80].map(s => '+' + Math.round(ratio(s, c) * 100) + '%'));
console.log(MD ? '\n### Só os RESGATES (sem offline e sem % de ouro), em minutos de abate por dia; meta <= ' + BUDGET + ' min\n' : '\n== RESGATES DO DIA (min de abate; meta <= ' + BUDGET + ') ==');
if (MD) { P('Cenário', 'F10', 'F30', 'F50', 'F80'); P('---', '---', '---', '---', '---'); }
for (const c of SCN) P(c.id + ' ' + c.name, ...[10, 30, 50, 80].map(s => f1(extras(s, c, true) / KPM) + ' min (+' + Math.round(extras(s, c, true) / KILL[eraOf(s)] * 100) + '%)'));
let overX = []; for (const x of SRC) for (const w of ['neu']) { const v = val(x, 30, w).claim / KPM; if (v > X + 1e-9 && x.id !== 'offline' && x.id !== 'golden') overX.push(x.id + ' ' + f1(v)); }
let overB = 0; for (let s = 5; s <= 90; s += 5) overB = Math.max(overB, extras(s, SCN[4], true) / KPM);
console.log('Proposta: resgate acima de X = ' + X + ' min: ' + (overX.length ? overX.join(', ') : 'nenhum') + ' · maior soma do dia (fases 5-90) = ' + f1(overB) + ' min' + (overB <= BUDGET ? ' (dentro da meta)' : ' (ACIMA da meta)'));
console.log(MD ? '\n### Minutos de jogo para pagar 1 melhoria (A só abate · L calibrada · B · Cn · C) e C ÷ L\n' : '\n== MINUTOS PARA PAGAR ==');
if (MD) { P('Fase', 'Forja (1 tentativa)', 'Montaria Épica (1 nível)', 'Arma Épica (1 nível)', 'C ÷ L'); P('---', '---', '---', '---', '---'); }
let worst = Infinity, worstCn = Infinity;
for (let s = 5; s <= 90; s += 5) {
  const row = cost => SCN.map(c => f1(minutes(cost, s, c))).join(' · ');
  const k = minutes(1, s, SCN[4]) / minutes(1, s, SCN[1]), kn = minutes(1, s, SCN[3]) / minutes(1, s, SCN[1]); worst = Math.min(worst, k); worstCn = Math.min(worstCn, kn);
  P(String(s), row(forgeTry()), row(mountLv(s)), row(weaponLv(s)), f1(k));
}
console.log((MD ? '\n' : '\n== RESULTADO ==\n') + 'Proposta inteira (C) ÷ curva calibrada (L): menor razão = ' + f1(worst) + (worst >= 1 ? ' (nunca mais rápido que a curva)' : ' (MAIS RÁPIDO que a curva!)'));
console.log('Depois deste commit (Cn) ÷ L: menor razão = ' + (Math.round(worstCn * 100) / 100).toString().replace('.', ',') + ' (só os módulos novos, já corrigidos, somados ao jogo de hoje)');
if (worst < 1) process.exitCode = 1;
