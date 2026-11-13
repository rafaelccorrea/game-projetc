'use strict';
/* COERÊNCIA DAS ARMAS (QA, sem navegador). Rodar: node test/e2e/weapons.js [-v]
   Pedido do dono: "a arma de pedra mostra um revólver saindo de dentro". Hipótese: item de uma era com família (wt) de OUTRA família: a mochila mostra o
   ícone/nome da era (a clava) e a batalha desenha a arma da FAMÍLIA (wFamLook troca pela arte de W.artEra). Este teste carrega o jogo no sandbox, equipa
   cada combinação e compara, para cada item, o que as telas mostram (ícone = wKey da skin da era, nome = iname) com o que a batalha desenha:
     lk = heroLook().weapon (skin da era do item) · fam = wFamLook(lk) (o que a batalha usa) · pistolEra(fam)/wIsGun(fam) (pose de pistola)
   Casos: A) família × raridade × era do item, com wt correto (a família da própria era)  B) item de era E com wt de OUTRA família (o que o Modo dono,
   um save antigo ou o rollWeaponType podem gerar)  C) save ANTIGO (formato v0.12.7: só slot, r, e, lvl, look, SEM wt): carrega pela partida real, migra
   e confere. Falha = o desenho da batalha difere do ícone/nome do item, ou clava (era 0) com pose de arma de fogo. Lista cada item incoerente. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
const FAMS = ['club', 'gladius', 'sword', 'flintlock', 'revolver', 'rifle', 'plasma', 'infernal', 'celestial', 'bow', 'boomerang'];
const RN = ['básico', 'raro', 'épico', 'mítico', 'lendário'];
let fail = 0, nA = 0, nB = 0, nC = 0; const bad = [];
function view(G, item) {   /* equipa o item e devolve o que ícone/nome/batalha mostram */
  return G.ev(`(function(){ const it=${JSON.stringify(item)}; it.id=S.nextId++; S.inv.push(it); S.eq.weapon=it.id; S.skinEq=S.skinEq||{}; S.skinEq.weapon='w00';
    const lk=heroLook().weapon; const fam=wFamLook(lk); let pe=-1, gun=false, st=null, ty=null; try{ pe=pistolEra(fam); gun=!!wIsGun(fam); }catch(e){} try{ ty=Sys.stats.weaponType(it); st=Sys.stats.weaponStyle(it); }catch(e){}
    return {name:iname(it), iconKey:wKey(lk), iconEra:lk.e, drawKey:wKey(fam), drawEra:fam.e, wk:fam.wk||null, pistolEra:pe, gun, type:ty, style:st, wt:it.wt||null}; })()`);
}
function game(storage, search) { const G = boot({ runBoot: !!storage, search: search || '?debug=1&skip=1', storage: storage || {}, add() {} }); G.flush && G.flush(); return G; }
const mis = (tag, it, v) => { const why = []; if (v.iconKey !== v.drawKey) why.push('ícone ' + v.iconKey + ' ≠ desenho ' + v.drawKey); if (it.e === 0 && (v.pistolEra >= 0 || v.gun)) why.push('clava/era 0 com pose de PISTOLA (pistolEra ' + v.pistolEra + ')');
  if (v.type && v.style === 'gun' && v.iconEra < 3) why.push('família ' + v.type + ' (gun) com ícone de era ' + v.iconEra); return why.length ? { tag, item: JSON.stringify(it), nome: v.name, wt: v.wt, type: v.type, why: why.join('; ') } : null; };
(async () => {
  const G = game();
  /* A) wt correto: a família da própria era, todas as eras e raridades */
  for (let e = 0; e <= 8; e++) for (let r = 0; r <= 4; r++) { const it = { slot: 'weapon', r, e, lvl: 1, gold: 0, subs: [], look: e }; const v = view(G, it); nA++;
    const m = mis('A e' + e + ' ' + RN[r], it, v); if (m) bad.push(m); if (VERBOSE) console.log('  A era ' + e + ' ' + RN[r] + ': ' + v.name + ' ícone ' + v.iconKey + ' desenho ' + v.drawKey + ' tipo ' + v.type + ' pistola ' + v.pistolEra); }
  /* B) item de uma era com wt de OUTRA família */
  for (let e = 0; e <= 8; e++) for (const wt of FAMS) for (const r of [0, 2, 4]) { const it = { slot: 'weapon', r, e, lvl: 1, gold: 0, subs: [], look: e, wt }; const v = view(G, it); nB++;
    const m = mis('B e' + e + ' wt=' + wt + ' ' + RN[r], it, v); if (m) bad.push(m); }
  /* C) save antigo (v0.12.7): itens só com slot, r, e, lvl, look, sem wt; carregado pela partida real */
  { const inv = []; let id = 3; for (let e = 0; e <= 8; e++) for (let r = 0; r <= 4; r++) inv.push({ id: id++, slot: 'weapon', r, e, lvl: 1, gold: 0, subs: [], look: e });
    inv.unshift({ id: 1, slot: 'weapon', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }, { id: 2, slot: 'armor', r: 0, e: 0, lvl: 1, gold: 0, subs: [] });
    const old = { gold: 100, gems: 30, stage: 5, wave: 1, best: 5, eraMax: 0, nextId: id, name: 'Antigo', hero: 'kael', tut: 99, welcome: true, kills: 40, inv, eq: { weapon: 1, armor: 2 }, skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' }, lastSeen: Date.now() - 1000 };
    const g2 = game({ eras_proto_v2: JSON.stringify(old) }, '?debug=1');
    const ids = g2.ev('S.inv.filter(i=>i.slot==="weapon").map(i=>i.id)');
    for (const wid of ids) { const row = g2.ev(`(function(){ const it=S.inv.find(i=>i.id===${wid}); S.eq.weapon=it.id; S.skinEq.weapon='w00'; const lk=heroLook().weapon, fam=wFamLook(lk); let pe=-1,gun=false,ty=null,st=null; try{ pe=pistolEra(fam); gun=!!wIsGun(fam); }catch(e){} try{ ty=Sys.stats.weaponType(it); st=Sys.stats.weaponStyle(it); }catch(e){}
        return {item:{r:it.r,e:it.e,look:it.look,wt:it.wt||null}, name:iname(it), iconKey:wKey(lk), iconEra:lk.e, drawKey:wKey(fam), drawEra:fam.e, pistolEra:pe, gun, type:ty, style:st, wt:it.wt||null}; })()`); nC++;
      const m = mis('C migrado r' + row.item.r + ' e' + row.item.e + ' wt=' + row.item.wt, row.item, row); if (m) bad.push(m); }
    const noWt = g2.ev('S.inv.filter(i=>i.slot==="weapon"&&!i.wt).length');
    if (VERBOSE) console.log('  C) save antigo: ' + nC + ' armas migradas; sem wt depois da carga: ' + noWt); }
  const per = {}; for (const b of bad) { const k = b.tag.split(' ')[0]; per[k] = (per[k] || 0) + 1; }
  console.log('Verificados: A ' + nA + ' (família da era) · B ' + nB + ' (wt de outra família) · C ' + nC + ' (save antigo migrado). Incoerentes: ' + bad.length + ' (' + JSON.stringify(per) + ')');
  const show = bad.filter(b => !/^B /.test(b.tag)).concat(bad.filter(b => /^B /.test(b.tag)).slice(0, 12));
  for (const b of show) console.log('  INCOERENTE ' + b.tag + ' · ' + b.nome + ' · wt=' + b.wt + ' tipo=' + b.type + ' → ' + b.why);
  if (bad.filter(b => /^B /.test(b.tag)).length > 12) console.log('  … mais ' + (bad.filter(b => /^B /.test(b.tag)).length - 12) + ' casos B iguais');
  const hard = bad.filter(b => !/^B /.test(b.tag)); fail = hard.length;
  console.log(fail ? '\n' + fail + ' ITEM(NS) INCOERENTE(S) em A/C (caminhos reais: família da própria era e save antigo migrado)' : '\nA e C COERENTES (família da própria era e save antigo migrado)' + (bad.length ? '; B mostra o risco de um wt de outra família (' + bad.length + ' casos)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
