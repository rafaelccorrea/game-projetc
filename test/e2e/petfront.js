'use strict';
/* PET SEMPRE NA FRENTE (regra do dono; Engenheiro 14, sem navegador). Rodar: node test/e2e/petfront.js [-v]
   Carrega o jogo no sandbox com o canvas que grava a ORDEM dos drawImage (test/e2e/sandbox.js, draw:true), equipa pet + asa (+ montaria) e confere:
     1. batalha (draw() do js/battle.js) COM montaria: a folha do pet é desenhada DEPOIS da montaria (que traz o herói), da asa e da arma
     2. batalha SEM montaria: o pet é desenhado DEPOIS do corpo do herói, da asa e da arma
     3. drawHeroFull (Arena, Troca de era, Título, Aparência) COM e SEM montaria: mesma ordem
     4. posição: o pet fica À FRENTE (x > x do herói) e NÃO acima da linha do chão (dy >= 0); no drawHeroFull o deslocamento segue a montaria DESTE desenho
        (state.mount), não a da batalha (HM.mount)
     5. Vitória e Derrota abertas (B.res), com e sem montaria: o pet continua desenhado, por último, PARADO (nunca o quadro congelado do golpe)
   Só lê arquivos do jogo, nunca grava. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, n = 0;
const check = (name, ok, det) => { n++; if (!ok) fail++; if (VERBOSE || !ok) console.log('  ' + (ok ? 'ok    ' : 'FALHA ') + name + (det && (!ok || VERBOSE) ? ' · ' + det : '')); };
const RE = { pet: /anim\/pets\//, mount: /anim\/mounts\//, hero: /anim\/hyb\//, wing: /wing/, weapon: /assets\/weapons\// };
const first = (L, re) => L.findIndex(s => re.test(s));
const last = (L, re) => { for (let i = L.length - 1; i >= 0; i--) if (re.test(L[i])) return i; return -1; };
/* o pet vem depois de TODAS as partes pedidas (must = tem de existir no desenho; also = se existir, também fica antes do pet) */
function order(tag, L, must, also) { const p = first(L, RE.pet), det = k => k + ' ' + first(L, RE[k]) + '..' + last(L, RE[k]);
  check(tag + ': o pet foi desenhado', p >= 0, 'nenhuma folha anim/pets entre ' + L.length + ' desenhos');
  for (const k of must) { check(tag + ': ' + k + ' foi desenhado', last(L, RE[k]) >= 0, 'nenhum desenho de ' + k); check(tag + ': pet DEPOIS de ' + k, p >= 0 && last(L, RE[k]) >= 0 && last(L, RE[k]) < p, 'pet ' + p + ' · ' + det(k)); }
  for (const k of also) if (last(L, RE[k]) >= 0) check(tag + ': pet DEPOIS de ' + k, p > last(L, RE[k]), 'pet ' + p + ' · ' + det(k)); }

(async () => {
  const loadErr = [], G = boot({ realFetch: true, draw: true, runBoot: true, search: '?debug=1&fresh=1', add: (g, nm, ok, e) => { if (!ok) loadErr.push(nm + ': ' + e); } }), { ev, sandbox: X } = G;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  const errs = [];
  const tick = async () => { try { G.inCtx(() => ev('draw')()); } catch (e) { const s = errStr(e); if (!errs.includes(s)) errs.push(s); } try { G.inCtx(() => G.advance(40)); } catch (e) {} await new Promise(r => setImmediate(r)); };
  const until = async (cond, max) => { for (let i = 0; i < max; i++) { let ok = false; try { ok = !!cond(); } catch (e) {} if (ok) return true; await tick(); } try { return !!cond(); } catch (e) { return false; } };
  /* um draw() da batalha com a lista dos drawImage, na ordem */
  const battleList = () => { const L = []; G.setDrawTap(s => L.push(s)); try { G.inCtx(() => ev('draw')()); } catch (e) { errs.push('draw: ' + errStr(e)); } G.setDrawTap(null); return L; };
  /* um drawHeroFull num canvas próprio, com a lista dos drawImage e a posição que o drawPet usou */
  const fullList = state => { const cv = G.mkCanvas(false); cv.__tap = true; const L = []; let pos = null, ret = null; const p0 = X.drawPet;
    X.drawPet = function () { try { pos = ev('({dx:petX()-HX, mo:!!petMO(), dy:petTbl().dy+(petMO()?petMO().dy:0)})'); } catch (e) {} return p0.apply(this, arguments); };
    G.setDrawTap(s => L.push(s)); try { ret = G.inCtx(() => X.drawHeroFull(cv.getContext('2d'), 195, 600, 1, state)); } catch (e) { errs.push('drawHeroFull: ' + errStr(e)); } G.setDrawTap(null); X.drawPet = p0; return { L, pos, ret }; };

  /* VITÓRIA / DERROTA (P4/P13, Engenheiro 17): com o resultado aberto (B.res) o pet continua desenhado, por ÚLTIMO, e PARADO: o golpe que estava em andamento
     não fica congelado num quadro do ataque. Atrás da Troca de era (tela cheia) ele não é desenhado (exceção escrita no drawPet). must = o que tem de vir antes
     do pet na Vitória (montaria ou herói); na Derrota o Kael cai a pé (folha da morte, anim/hyb ou anim/skins) e a montaria sai de cena. */
  const petSt = (L, st) => L.some(s => RE.pet.test(s) && new RegExp('_' + st + '\\.').test(s));
  const resCase = async (tag, must) => {
    ev("window.__pfS={r:B.res,a:PETK.act,run:B.running,d:B.deadT,db:B.deadBoss}; B.res=null; B.running=false; PETK.act={t:0.2,dur:1,hitT:0.5,e:null,done:true}; 1");
    try {
      let L = battleList(); check(tag + ': controle, fora do resultado o golpe em andamento aparece (folha _atk1)', petSt(L, 'atk1'), 'sem _atk1: o teste não enxergaria o defeito');
      ev("B.res={mode:'win'}; 1"); L = battleList(); order(tag + ' VITÓRIA', L, must, ['hero', 'wing', 'weapon']);
      check(tag + ' VITÓRIA: pet parado (folha _idle), sem quadro do golpe', petSt(L, 'idle') && !petSt(L, 'atk1'), L.filter(s => RE.pet.test(s)).join(', '));
      const pos = ev('({dx:petX()-HX, dy:petTbl().dy+(petMO()?petMO().dy:0)})'); check(tag + ' VITÓRIA: pet à frente e não acima do chão', pos.dx > 0 && pos.dy >= 0, JSON.stringify(pos));
      const f = fullList({ t: 0.3 }); order(tag + ' drawHeroFull com a Vitória aberta', f.L, must, ['hero', 'wing', 'weapon']); check(tag + ' drawHeroFull com a Vitória aberta: pet parado', petSt(f.L, 'idle') && !petSt(f.L, 'atk1'), f.L.filter(s => RE.pet.test(s)).join(', '));
      check(tag + ': o golpe guardado do pet continua o mesmo depois do drawHeroFull', ev('!!PETK.act&&PETK.act.t===0.2'));
      ev("B.res={mode:'era'}; 1"); L = battleList(); check(tag + ' Troca de era: pet não desenhado (a tela cobre tudo)', first(L, RE.pet) < 0, 'pet em ' + first(L, RE.pet));
      ev("B.res={mode:'lose'}; heroDown(true); 1"); await until(() => ev('ART_ON.kael_die!==true||dieSheet().ok'), 400);
      L = battleList(); const die = L.findIndex(s => /_die_body/.test(s)), p = first(L, RE.pet);
      check(tag + ' DERROTA: o pet foi desenhado', p >= 0, 'nenhuma folha anim/pets'); check(tag + ' DERROTA: herói caído pela folha da morte', die >= 0, 'sem _die_body entre ' + L.length + ' desenhos');
      check(tag + ' DERROTA: pet DEPOIS do herói caído', p > die && die >= 0, 'pet ' + p + ' · morte ' + die); check(tag + ' DERROTA: pet parado (folha _idle)', petSt(L, 'idle') && !petSt(L, 'atk1'), L.filter(s => RE.pet.test(s)).join(', '));
    } finally { ev("(function(){ const o=window.__pfS; heroDown(false); B.res=o.r; PETK.act=o.a; B.running=o.run; B.deadT=o.d; B.deadBoss=o.db; })(); 1"); } };

  /* preparo: sem a entrada, batalha parada num quadro calmo, pet + asa equipados */
  await until(() => ev("typeof PI!=='undefined'&&!!PI.el"), 40); try { if (ev("typeof PI!=='undefined'&&!!PI.el")) G.inCtx(() => ev('PI.finish()')); } catch (e) {}
  const pet = ev(`(function(){ S.tut=99; S.welcome=true; const L=Sys.level.ensure(S); L.lvl=50; L.xp=0; S.stage=3; S.best=12; S.wave=1; S.farm=false;
    Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); const o=Sys.pet.ensure(S);
    for(const p of Sys.pet.DATA.pets){ o.owned={}; o.owned[p.id]={stars:1,lvl:1}; o.eq=p.id; Sys.pet.ensure(S); const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base&&!i.draw.fly) return {id:p.id, base:i.draw.base}; }
    return {id:null}; })()`);
  check('pet de chão equipado: ' + pet.id + ' (' + pet.base + ')', !!pet.id);
  ev(`(function(){ addItemToBag({slot:'wing',r:3,e:0,wing:'angel'}); const it=S.inv.filter(x=>x.slot==='wing').pop(); if(it) S.eq.wing=it.id; statsChanged(); refreshHero();
    B.paused=false; B.res=null; view='battle'; startBattle(); HATCH.q.length=0; HATCH.cur=null; PETK.infoT=0; return 1; })()`);

  /* ---------- 2. SEM montaria ---------- */
  const noMount = ev("(function(){ try{ const o=Sys.mount.ensure(S); o.eq=null; }catch(e){} return !heroLook().mount; })()");
  check('sem montaria equipada', noMount);
  await until(() => ev("(function(){ HATCH.q.length=0; HATCH.cur=null; return !!petInfo()&&petReady(PETK.base)&&!HM.mount&&HM.wing==='angel'&&wingReady('angel')&&fullReady(HM); })()"), 400);
  await until(() => fullList({ t: 0.3 }).ret === true, 400);   /* o drawHeroFull devolve false enquanto uma folha pedida ainda carrega */
  { const L = battleList(); order('batalha SEM montaria', L, ['hero'], ['wing', 'weapon']); if (VERBOSE) console.log('    ' + L.filter(s => Object.values(RE).some(r => r.test(s))).join('\n    '));
    const f = fullList({ t: 0.3 }); check('drawHeroFull SEM montaria: desenhou (true)', f.ret === true, 'devolveu ' + f.ret); order('drawHeroFull SEM montaria', f.L, ['hero'], ['wing', 'weapon']);
    check('drawHeroFull SEM montaria: pet à frente e não acima do chão', !!f.pos && f.pos.dx > 0 && f.pos.dy >= 0 && f.pos.mo === false, JSON.stringify(f.pos)); }
  const foot = fullList({ t: 0.3 }).pos;
  await resCase('SEM montaria', ['hero']);

  /* ---------- 1. COM montaria ---------- */
  const mt = ev(`(function(){ Sys.mount.DATA.on=true; Sys.mount.DATA.visual=true; const ids=Object.keys(MOUNT_TBL), id=ids.includes('wolf')?'wolf':ids[0]; Sys.mount.add(S,Sys.host,id); const e=Sys.mount.equip(S,id); const lk=mountLook(); return {id, e:!!e, look:lk&&lk.id}; })()`);
  check('montaria equipada: ' + mt.id, mt.e && mt.look === mt.id, JSON.stringify(mt));
  await until(() => ev("(function(){ HATCH.q.length=0; HATCH.cur=null; return !!petInfo()&&petReady(PETK.base)&&!!HM.mount&&mountReady(HM.mount.id)&&fullReady(HM); })()"), 400);
  { const L = battleList(); order('batalha COM montaria', L, ['mount'], ['hero', 'wing', 'weapon']); if (VERBOSE) console.log('    ' + L.filter(s => Object.values(RE).some(r => r.test(s))).join('\n    '));
    const f = fullList({ t: 0.3 }); check('drawHeroFull COM montaria: desenhou (true)', f.ret === true, 'devolveu ' + f.ret); order('drawHeroFull COM montaria', f.L, ['mount'], ['hero', 'wing', 'weapon']);
    check('drawHeroFull COM montaria: pet mais à frente e mais abaixo que a pé', !!f.pos && !!foot && f.pos.mo === true && f.pos.dx > foot.dx && f.pos.dy > foot.dy, 'montado ' + JSON.stringify(f.pos) + ' · a pé ' + JSON.stringify(foot));
    /* a posição do pet segue a montaria DESTE desenho, não a da batalha */
    const g = fullList({ t: 0.3, mount: false }); order('drawHeroFull {mount:false} com a batalha montada', g.L, ['hero'], ['wing', 'weapon']);
    check('drawHeroFull {mount:false} com a batalha montada: pet na posição A PÉ', !!g.pos && !!foot && g.pos.mo === false && Math.abs(g.pos.dx - foot.dx) < 0.01, JSON.stringify(g.pos) + ' · a pé ' + JSON.stringify(foot));
    check('drawHeroFull {mount:false}: nenhuma folha de montaria', last(g.L, RE.mount) < 0, 'montaria em ' + last(g.L, RE.mount));
    const hm = ev('HM.mount&&HM.mount.id'); check('HM.mount da batalha intacto depois do drawHeroFull', hm === mt.id, 'HM.mount=' + hm);
    const h = (() => { ev('window.__pfM=HM.mount; HM.mount=null; 1'); try { return fullList({ t: 0.3 }); } finally { ev('HM.mount=window.__pfM; 1'); } })();
    check('drawHeroFull montado com a batalha A PÉ: pet na posição MONTADA', !!h.pos && h.pos.mo === true && Math.abs(h.pos.dx - f.pos.dx) < 0.01, JSON.stringify(h.pos) + ' · montado ' + JSON.stringify(f.pos)); }
  await resCase('COM montaria', ['mount']);
  check('nenhuma exceção no desenho', !errs.length && !ev('!!window.__hfErr'), errs.slice(0, 4).join(' | '));
  console.log(fail ? '\n' + fail + ' FALHA(S) de ' + n + ' (pet na frente)' : '\nPET NA FRENTE OK (' + n + ' verificações): batalha, Vitória, Derrota e drawHeroFull, com e sem montaria');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
