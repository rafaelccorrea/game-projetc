'use strict';
/* "FRACO CONTRA" NO DANO (Sys.affinity → js/battle.js, affMult/hitEnemy). Sem navegador: node test/e2e/afinidade.js
   Sobe o jogo de verdade no sandbox, põe um inimigo na frente do herói e mede o golpe do herói (hitEnemy) com a sorte travada (sem crítico, variação fixa):
   chave desligada = dano de hoje; ligada = o mesmo dano × Sys.affinity.mult (forte, resistem e neutro, cada um na era da tabela do módulo);
   o número que salta na tela é o do dano já multiplicado; o golpe do pet não muda. Só lê arquivos do jogo. Sai com código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  /* o JOGO liga a afinidade no arranque (SYS_LIVE, js/farm.js); "?debug=1&sem=affinity" sobe sem ela, para provar o "desligada = como antes" */
  { const G0 = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    check('sem parâmetro a afinidade nasce LIGADA (SYS_LIVE do jogo)', G0.ev('!!(Sys.affinity&&Sys.affinity.DATA)&&Sys.affinity.DATA.on===true')); }
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1&sem=affinity' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  ev("(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; Math.random=()=>0.5; return 1; })()");
  /* um golpe básico do herói num inimigo de vida enorme; devolve o dano e o número que saltou */
  const hit = () => JSON.parse(ev(`(function(){ AFFC.t=-1e9; B.hero.critRate=0; B.fx.length=0; const e=mkEnemy(S.stage,'e0'); e.maxhp=e.hp=1e7; e.x=e.slot=SLOTX[0]; e.parked=true; B.en=[e];
    hitEnemy(e,1,{type:'s1',col:'#ffffff',hits:[],ev:[]},null); const f=B.fx[0]; return JSON.stringify({d:1e7-e.hp,txt:f?f.txt:'',fmt:fmt(1e7-e.hp)}); })()`));
  const at = (stage, on) => { ev('(function(){ S.stage=' + stage + '; S.wave=1; Sys.affinity.setOn(' + (on ? 'true' : 'false') + '); return 1; })()'); return hit(); };
  check('módulo carregado e chave DESLIGADA com &sem=affinity', ev('!!(Sys.affinity&&Sys.affinity.DATA)&&Sys.affinity.DATA.on===false'));
  const D = JSON.parse(ev('JSON.stringify({weak:Sys.affinity.DATA.weak,resist:Sys.affinity.DATA.resist,per:STAGES_PER_ERA})'));
  check('herói de corpo a corpo no save novo (estilo Lâmina pelo módulo)', ev("(function(){ Sys.affinity.setOn(true); const s=Sys.affinity.heroStyle(S,Sys.host); Sys.affinity.setOn(false); return s; })()") === 'blade');
  /* era 0: fraca contra Lâmina · era 3: resiste a Lâmina · era 1: neutra para Lâmina (tabela do módulo) */
  const cases = [['forte (era 0)', 1, 1 + D.weak], ['resistem (era 3)', 3 * D.per + 1, 1 + D.resist], ['neutro (era 1)', D.per + 1, 1]];
  for (const [nm, stage, want] of cases) {
    const off = at(stage, false), m = ev('(function(){ Sys.affinity.setOn(true); const m=Sys.affinity.mult(S,Sys.host,{era:eraOf(S.stage)}); Sys.affinity.setOn(false); return m; })()'), on = at(stage, true);
    check(nm + ': o módulo dá ×' + want, Math.abs(m - want) < 1e-9, 'veio ' + m);
    check(nm + ': desligada o golpe é o de hoje (ATQ × 1, sem crítico)', off.d > 0 && Math.abs(off.d - ev('B.hero.atk')) < 1e-6 * off.d, JSON.stringify(off) + ' atk ' + ev('B.hero.atk'));
    check(nm + ': ligada o dano = dano de hoje × multiplicador do módulo', Math.abs(on.d - off.d * m) < 1e-6 * off.d, on.d + ' x ' + off.d * m);
    check(nm + ': o número que salta é o do dano aplicado', on.txt === on.fmt && off.txt === off.fmt, JSON.stringify([on, off]));
    if (want !== 1) check(nm + ': ligada muda de verdade', Math.abs(on.d - off.d) > 1e-3 * off.d);
  }
  /* ultimate e especial passam pelo mesmo ponto (hitMany → hitEnemy) */
  { const r = JSON.parse(ev(`(function(){ S.stage=1; Sys.affinity.setOn(false); AFFC.t=-1e9; B.hero.critRate=0; const mk=()=>{ const e=mkEnemy(1,'e0'); e.maxhp=e.hp=1e7; e.x=e.slot=SLOTX[0]; e.parked=true; return e; };
      let e=mk(); B.en=[e]; hitMany([e],2,{type:'s3',col:'#ffffff',hits:[],ev:[]},{m:2}); const a=1e7-e.hp; Sys.affinity.setOn(true); AFFC.t=-1e9; e=mk(); B.en=[e]; hitMany([e],2,{type:'s3',col:'#ffffff',hits:[],ev:[]},{m:2}); const b=1e7-e.hp;
      Sys.affinity.setOn(false); return JSON.stringify({a,b}); })()`));
    check('ultimate/especial (hitMany): mesmo multiplicador', Math.abs(r.b - r.a * (1 + D.weak)) < 1e-6 * r.a, JSON.stringify(r)); }
  /* inimigo marcado como neutro (Boneco de Treino) e chave desligada no fim */
  { const r = JSON.parse(ev(`(function(){ S.stage=1; Sys.affinity.setOn(true); AFFC.t=-1e9; const e=mkEnemy(1,'e0'); e.maxhp=e.hp=1e7; e.noAff=true; B.en=[e]; hitEnemy(e,1,{type:'s1',col:'#ffffff',hits:[],ev:[]},null); Sys.affinity.setOn(false); return JSON.stringify({d:1e7-e.hp,atk:B.hero.atk}); })()`));
    check('inimigo neutro (noAff) não leva o multiplicador', Math.abs(r.d - r.atk) < 1e-6 * r.atk, JSON.stringify(r)); }
  check('a batalha segue rodando com a chave ligada (60 passos sem erro)', (() => { try { ev('(function(){ Sys.affinity.setOn(true); startBattle(); for(let i=0;i<60;i++) step(1/30); Sys.affinity.setOn(false); return 1; })()'); return true; } catch (e) { console.log(String(e && e.message)); return false; } })());
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (afinidade no dano)' : 'AFINIDADE NO DANO OK (' + n + ' verificações): desligada = como hoje; ligada = dano × Sys.affinity.mult, no número que salta');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
