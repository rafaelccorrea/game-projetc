'use strict';
/* PET SEMPRE NA FRENTE (regra do dono; Engenheiro 14, sem navegador). Rodar: node test/e2e/petfront.js [-v]
   Carrega o jogo no sandbox com o canvas que grava a ORDEM dos drawImage (test/e2e/sandbox.js, draw:true), equipa pet + asa (+ montaria) e confere:
     1. batalha (draw() do js/battle.js) COM montaria: a folha do pet é desenhada DEPOIS da montaria (que traz o herói), da asa e da arma
     2. batalha SEM montaria: o pet é desenhado DEPOIS do corpo do herói, da asa e da arma
     3. drawHeroFull (Arena, Troca de era, Título, Aparência) COM e SEM montaria: mesma ordem
     4. posição: o pet fica À FRENTE (x > x do herói) e NÃO acima da linha do chão (dy >= 0); no drawHeroFull o deslocamento segue a montaria DESTE desenho
        (state.mount), não a da batalha (HM.mount)
     5. Vitória e Derrota abertas (B.res), com e sem montaria: o pet continua desenhado, por último, PARADO (nunca o quadro congelado do golpe)
     6. DERROTA (regra do dono, 13/11): o pet fica À FRENTE do herói caído (não recua mais), parado; a montaria FICA em cena (arte dela sozinha,
        assets/icons/mounts/<id>.png, desenhada ANTES do herói caído; nenhuma folha montada com cavaleiro); a asa segue sem desenho (ficaria solta no ar)
     7. CHOCAGEM DE OVO: o pet equipado continua desenhado e o ovo fica AO LADO dele, à frente, dentro da tela, sem encostar no herói; só o pet que ainda
        está dentro do próprio ovo (1º ovo) espera nascer
     8. APARÊNCIA (js/p_look.js): destaque (a pé e montado) e grade desenham o pet, por último
   Só lê arquivos do jogo, nunca grava. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, n = 0;
const check = (name, ok, det) => { n++; if (!ok) fail++; if (VERBOSE || !ok) console.log('  ' + (ok ? 'ok    ' : 'FALHA ') + name + (det && (!ok || VERBOSE) ? ' · ' + det : '')); };
const RE = { park: /icons\/mounts\//, egg: /pets\/pet_egg/, pet: /anim\/pets\//, mount: /anim\/mounts\//, hero: /anim\/hyb\//, wing: /wing/, weapon: /assets\/weapons\// };
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
     do pet na Vitória (montaria ou herói); na Derrota o Kael cai a pé (folha da morte, anim/hyb ou anim/skins), a montaria fica parada atrás dele (arte dela sozinha) e o pet fica à frente. */
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
      /* regra do dono (13/11): na Derrota o pet NÃO recua; a montaria fica; a asa não flutua */
      const dp = ev('({x:petPos().x, gy:petPos().gy, px:petX(), hx:HX, GY:GY})');
      check(tag + ' DERROTA: pet À FRENTE do herói caído (mesma posição de vivo, sem recuar)', dp.x === dp.px && dp.x > dp.hx, JSON.stringify(dp)); check(tag + ' DERROTA: pet com os pés no chão (não acima da linha)', dp.gy >= dp.GY, JSON.stringify(dp));
      check(tag + ' DERROTA: asa não é desenhada (sem âncora confiável no corpo deitado ficaria solta no ar)', last(L, RE.wing) < 0, 'asa em ' + last(L, RE.wing));
      check(tag + ' DERROTA: nenhuma folha MONTADA (herói não fica montado morto)', last(L, RE.mount) < 0, 'folha montada em ' + last(L, RE.mount));
      if (must.includes('mount')) { await until(() => ev('mountParkImg(HM.mount.id).ok'), 60); L = battleList(); const mi = first(L, RE.park), d2 = L.findIndex(s => /_die_body/.test(s)), p2 = first(L, RE.pet);
        check(tag + ' DERROTA: a montaria FICA em cena (arte dela sozinha: ' + ev('HM.mount.id') + ')', mi >= 0 && (L[mi] || '').includes('icons/mounts/' + ev('HM.mount.id') + '.png'), 'nenhum assets/icons/mounts entre ' + L.length + ' desenhos');
        check(tag + ' DERROTA: ordem montaria parada → herói caído → pet', mi >= 0 && mi < d2 && d2 < p2, 'montaria ' + mi + ' · morte ' + d2 + ' · pet ' + p2);
        const f2 = fullList({ t: 0.3, deadP: 0.9 }), a = first(f2.L, RE.park), b = f2.L.findIndex(s => /_die_body/.test(s)), c = first(f2.L, RE.pet);
        check(tag + ' drawHeroFull {deadP}: montaria parada → herói caído → pet', a >= 0 && a < b && b < c && last(f2.L, RE.mount) < 0, 'montaria ' + a + ' · morte ' + b + ' · pet ' + c + ' · folha montada ' + last(f2.L, RE.mount)); }
      else check(tag + ' DERROTA: sem montaria equipada, nenhuma montaria parada', first(L, RE.park) < 0, 'montaria em ' + first(L, RE.park));
    } finally { ev("(function(){ const o=window.__pfS; heroDown(false); B.res=o.r; PETK.act=o.a; B.running=o.run; B.deadT=o.d; B.deadBoss=o.db; })(); 1"); } };

  /* CHOCAGEM DE OVO (regra do dono: o pet nunca some). other = espécie diferente da equipada. O relógio do ovo é posto à mão (t0 = B.at - T). */
  const hatchCase = async tag => {
    const o = ev(`(function(){ const sp=Sys.pet.DATA.v17.species||{}, me=PETK.info.id; let other=null; for(const k in sp){ if(k!==me&&sp[k]&&sp[k].sprite){ other={pet:k,sprite:sp[k].sprite}; break; } }
      window.__pfH={r:B.res,p:B.paused,run:B.running}; B.res=null; B.paused=false; B.running=false; view='battle'; HATCH.q.length=0; HATCH.cur=null; return {me, mySprite:(sp[me]||{}).sprite||null, other}; })()`);
    const start = async (h, T) => { ev('HATCH.q.length=0; HATCH.cur=null; HATCH.q.push(' + JSON.stringify(Object.assign({ name: 'Teste', r: 1, first: false, dup: false }, h)) + '); 1'); battleList(); await until(() => ev('!!HATCH.egg&&HATCH.egg.complete'), 60); ev('if(!HATCH.cur){ HATCH.cur=HATCH.q.shift(); } HATCH.cur.t0=B.at-' + T + '; 1'); return battleList(); };
    const mine = L => L.filter(s => RE.pet.test(s) && s.includes(ev('PETK.base')));
    try {
      check(tag + ' CHOCAGEM: há outra espécie para chocar', !!o.other, JSON.stringify(o));
      let L = await start(o.other, 1.0); const g = ev('({egg:hatchX(HATCH.cur), ew:HS*0.5, px:petX(), hx:HX, LW:LW, cur:!!HATCH.cur})');
      check(tag + ' CHOCAGEM: o ovo está chocando', g.cur && first(L, RE.egg) >= 0, 'sem pet_egg entre ' + L.length + ' desenhos');
      check(tag + ' CHOCAGEM: o pet equipado CONTINUA desenhado', mine(L).length > 0, L.filter(s => RE.pet.test(s)).join(', ') || 'nenhuma folha anim/pets');
      check(tag + ' CHOCAGEM: ovo AO LADO do pet, à frente (a borda do ovo não passa do centro do pet nem toca o herói)', g.egg - g.ew / 2 >= g.px && g.px > g.hx, JSON.stringify(g));
      check(tag + ' CHOCAGEM: ovo inteiro dentro da tela', g.egg + g.ew / 2 <= g.LW, JSON.stringify(g));
      ev('HATCH.cur.t0=B.at-3.6; 1'); L = battleList(); check(tag + ' CHOCAGEM: depois de nascer o filhote, o pet equipado segue desenhado', mine(L).length > 0, L.filter(s => RE.pet.test(s)).join(', '));
      /* o próprio pet equipado dentro do ovo (1º ovo): espera nascer no lugar dele; repetido (dup) não esconde ninguém */
      L = await start({ pet: o.me, sprite: o.mySprite, first: true }, 1.0); check(tag + ' CHOCAGEM do próprio pet: antes de nascer só o ovo, no lugar do pet', first(L, RE.egg) >= 0 && first(L, RE.pet) < 0 && ev('hatchX(HATCH.cur)===petX()'), L.filter(s => RE.pet.test(s)).join(', '));
      ev('HATCH.cur.t0=B.at-3.6; 1'); L = battleList(); check(tag + ' CHOCAGEM do próprio pet: nascido, o pet é desenhado (uma vez só)', L.filter(s => RE.pet.test(s)).length === 1, L.filter(s => RE.pet.test(s)).join(', '));
      L = await start({ pet: o.me, sprite: o.mySprite, dup: true }, 1.0); check(tag + ' CHOCAGEM de repetido: o pet equipado continua desenhado', mine(L).length > 0 && first(L, RE.egg) >= 0, L.filter(s => RE.pet.test(s)).join(', '));
    } finally { ev('(function(){ const s=window.__pfH; HATCH.q.length=0; HATCH.cur=null; B.banner=null; B.res=s.r; B.paused=s.p; B.running=s.run; })(); 1'); } };
  /* APARÊNCIA (js/p_look.js): o destaque animado (plDraw) e a grade parada (plStills) desenham o pet, por último */
  const lookCase = (tag, mounted) => { const mk = live => { const cv = G.mkCanvas(false); cv.__tap = true; cv.width = cv.height = 440; cv.dataset.plsk = 'default'; if (live) { cv.dataset.live = '1'; cv.dataset.mounted = mounted ? '1' : '0'; } return cv; };
    const run = (cv, fn) => { const L = [], q0 = G.document.querySelectorAll; G.document.querySelectorAll = sel => (/data-live\]$/.test(sel) && !/not/.test(sel)) === !!cv.dataset.live ? [cv] : []; G.setDrawTap(s => L.push(s));
      try { G.inCtx(() => ev(fn)); } catch (e) { errs.push(fn + ': ' + errStr(e)); } G.setDrawTap(null); G.document.querySelectorAll = q0; try { G.inCtx(() => ev('plStop(); if(XLK.tm){ clearTimeout(XLK.tm); XLK.tm=0; } 1')); } catch (e) {} return L; };
    ev('XLK.err=0; XLK.t0=0; 1'); const L = run(mk(true), 'plDraw(1000)'); order(tag + ' APARÊNCIA destaque' + (mounted ? ' montado' : ' a pé'), L, [mounted ? 'mount' : 'hero'], ['hero', 'wing', 'weapon']);
    if (!mounted) { check(tag + ' APARÊNCIA destaque a pé: nenhuma folha de montaria', last(L, RE.mount) < 0, 'montaria em ' + last(L, RE.mount)); const g = run(mk(false), 'XLK.n=0; plStills()'); order(tag + ' APARÊNCIA grade (quadro parado)', g, ['hero'], ['wing', 'weapon']); }
    check(tag + ' APARÊNCIA: desenho sem erro', ev('!XLK.err')); };

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
  await hatchCase('SEM montaria'); lookCase('SEM montaria', false);

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
  await hatchCase('COM montaria'); lookCase('COM montaria', false); lookCase('COM montaria', true);
  check('nenhuma exceção no desenho', !errs.length && !ev('!!window.__hfErr'), errs.slice(0, 4).join(' | '));
  console.log(fail ? '\n' + fail + ' FALHA(S) de ' + n + ' (pet na frente)' : '\nPET NA FRENTE OK (' + n + ' verificações): batalha, Vitória, Derrota (pet à frente, montaria em cena), chocagem de ovo, Aparência e drawHeroFull, com e sem montaria');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
