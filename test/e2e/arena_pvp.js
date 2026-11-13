'use strict';
/* LUTA PvP DA ARENA (Tela 23, js/p_arena.js, chave window.PA_PVP2), sem navegador. Rodar: node test/e2e/arena_pvp.js [-v]
   Carrega o jogo no sandbox com o canvas que grava a ORDEM dos drawImage (test/e2e/sandbox.js, draw:true), equipa pet + asa + montaria e confere:
     1. a luta nova abre pelo LUTE! com a abertura VS (dois retratos); com a chave desligada vale a luta antiga
     2. o registro da tela É o do Sys.arena (refeito aqui com a mesma semente: Sys.tower.duel) e é consumido NA ORDEM
     3. vida final = registro = fração do duelo (hpA/hpB) x vida cheia; dano somado = soma do registro; vencedor = r.win; ultimate, pet e energia = k/en do registro;
        o resultado mostra o delta e EXATAMENTE o r.rewards que o módulo creditou
     4. PULAR leva ao mesmo resultado da luta assistida (mesmo registro tocado inteiro)
     5. desenho: os dois lutadores (montaria, asa, arma), o adversário ESPELHADO; o pet de cada lado é o ÚLTIMO desenho, o do adversário espelhado;
        golpe com a folha de ataque da montaria; pet ataca junto; ultimate com a folha da batalha, espelhada quando é do adversário
     6. os pets nunca cruzam (caixas na tela) e a cena cabe em 288, 360, 384 e 412 px
     7. todo botão tem ação (x1/x2/x4, Pular, Voltar, Lutar de novo); sem emoji; sem rolagem horizontal declarada
   Só lê arquivos do jogo, nunca grava. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const fs = require('fs'), path = require('path');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, n = 0;
const check = (name, ok, det) => { n++; if (!ok) fail++; if (VERBOSE || !ok) console.log('  ' + (ok ? 'ok    ' : 'FALHA ') + name + (det && (!ok || VERBOSE) ? ' · ' + String(det).slice(0, 500) : '')); };
const RE = { pet: /anim\/pets\//, mount: /anim\/mounts\//, wing: /equip\/wing_/, weapon: /assets\/weapons\//, ult: /anim\/ult\//, aura: /anim\/aura\// };

(async () => {
  const loadErr = [], G = boot({ realFetch: true, draw: true, runBoot: true, search: '?debug=1&fresh=1', add: (g, nm, ok, e) => { if (!ok) loadErr.push(nm + ': ' + e); } }), { ev, sandbox: X } = G;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  const errs = [];
  const tick = async () => { try { G.inCtx(() => ev('draw')()); } catch (e) { const s = errStr(e); if (!errs.includes(s)) errs.push(s); } try { G.inCtx(() => G.advance(40)); } catch (e) {} await new Promise(r => setImmediate(r)); };
  const until = async (cond, max) => { for (let i = 0; i < max; i++) { let ok = false; try { ok = !!cond(); } catch (e) {} if (ok) return true; await tick(); } try { return !!cond(); } catch (e) { return false; } };
  /* canvas da luta com o sinal do espelho: cada drawImage vira {s: origem, m: espelhado?} */
  const cv = G.mkCanvas(false); cv.__tap = true; const cx = cv.getContext('2d'); let sign = 1; const stack = [];
  cx.save = () => { stack.push(sign); }; cx.restore = () => { if (stack.length) sign = stack.pop(); }; cx.scale = (a) => { if (a < 0) sign = -sign; }; cx.setTransform = (a) => { sign = a < 0 ? -1 : 1; };
  X.__pvCv = cv; ev('XA2.cv=__pvCv; 1');
  const drawList = () => { const L = []; sign = 1; stack.length = 0; G.setDrawTap(s => L.push({ s, m: sign < 0 })); try { G.inCtx(() => ev('paPvDraw')()); } catch (e) { errs.push('paPvDraw: ' + errStr(e)); } G.setDrawTap(null); return L; };
  const step = dt => { try { G.inCtx(() => ev('paPvStep(' + dt + ')')); } catch (e) { const s = 'paPvStep: ' + errStr(e); if (!errs.includes(s)) errs.push(s); } };
  const click = (x, extra) => { try { return G.inCtx(() => ev('paClick({dataset:' + JSON.stringify(Object.assign({ x }, extra || {})) + '})')); } catch (e) { errs.push('paClick ' + x + ': ' + errStr(e)); } };
  const w288 = () => ev("paPvNameFit(['Kael · Nv 50','Odin das Eras'],288).two===true&&paPvNameFit(['Kael · Nv 50','Odin das Eras'],360).two===false");
  const html = () => String(G.V.innerHTML || ''); const render0 = () => ev('render(); 1');

  /* preparo: sem a entrada, pet de chão + asa + montaria, Arena aberta */
  await until(() => ev("typeof PI!=='undefined'&&!!PI.el"), 40); try { if (ev("typeof PI!=='undefined'&&!!PI.el")) G.inCtx(() => ev('PI.finish()')); } catch (e) {}
  const pet = ev(`(function(){ S.tut=99; S.welcome=true; const L=Sys.level.ensure(S); L.lvl=60; L.xp=0; S.stage=3; S.best=12; S.wave=1; S.farm=false;
    Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); const o=Sys.pet.ensure(S);
    for(const p of Sys.pet.DATA.pets){ o.owned={}; o.owned[p.id]={stars:1,lvl:1}; o.eq=p.id; Sys.pet.ensure(S); const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base&&!i.draw.fly) return {id:p.id, base:i.draw.base}; }
    return {id:null}; })()`);
  check('pet equipado: ' + pet.id + ' (' + pet.base + ')', !!pet.id);
  const mt = ev(`(function(){ addItemToBag({slot:'wing',r:3,e:0,wing:'angel'}); const it=S.inv.filter(x=>x.slot==='wing').pop(); if(it) S.eq.wing=it.id;
    Sys.mount.DATA.on=true; Sys.mount.DATA.visual=true; const ids=Object.keys(MOUNT_TBL), id=ids.includes('horse')?'horse':ids[0]; Sys.mount.add(S,Sys.host,id); Sys.mount.equip(S,id);
    statsChanged(); refreshHero(); B.paused=false; B.res=null; view='battle'; startBattle(); HATCH.q.length=0; HATCH.cur=null; PETK.infoT=0; const lk=mountLook(); return {id, look:lk&&lk.id}; })()`);
  check('montaria equipada: ' + mt.id, mt.look === mt.id, JSON.stringify(mt));
  await until(() => ev("(function(){ HATCH.q.length=0; HATCH.cur=null; return !!petInfo()&&petReady(PETK.base)&&!!HM.mount&&mountReady(HM.mount.id)&&fullReady(HM); })()"), 400);
  check('painel arena registrado e funções da luta nova', ev("!!Panels.defs.arena&&typeof paPvStart==='function'&&typeof paPvStep==='function'&&typeof paPvSkip==='function'&&typeof paPvDraw==='function'&&typeof paPvGeo==='function'&&typeof paPvScript==='function'"));
  ev("Panels.enable('arena'); PANEL_V2.gate=false; view='arena'; XA2.view='lobby'; XA2.tab=0; XA2.sel=0; XA2.pv=null; render(); 1");
  check('lobby desenhado com o LUTE!', /data-x="fight"/.test(html()), html().slice(0, 120));

  /* ---------- chave desligada = luta antiga ---------- */
  ev('window.__pv0=window.PA_PVP2; window.PA_PVP2=false; Sys.arena.ensure(S,Sys.host).attemptsLeft=3; 1'); click('fight');
  check('chave desligada: luta antiga (sem estado da luta nova)', ev("XA2.view==='fight'&&!XA2.pv") && !/class="pv"/.test(html()), 'view ' + ev('XA2.view'));
  click('skip'); click('back'); ev('paStop(); window.PA_PVP2=true; 1');
  check('chave ligada para o resto do teste', ev('window.PA_PVP2===true'));

  /* ---------- uma luta: abre, VS, registro ---------- */
  const openFight = () => { ev("Sys.arena.ensure(S,Sys.host).attemptsLeft=3; XA2.view='lobby'; XA2.sel=0; window.__pre={gold:S.gold,gems:S.gems,inv:S.inv.length,lp:Sys.arena.ensure(S,Sys.host).lp,fights:Sys.arena.ensure(S,Sys.host).fights,left:3,me:JSON.stringify(Sys.tower.playerStats(S,Sys.host)),pf:(function(){ const p=(Sys.fc.stats(S,Sys.host)||{}).pet||{}, k=Math.max(0,+p.atk||0); return k/(1+k); })(),chest:JSON.stringify(Sys.chest.ensure?Sys.chest.ensure(S):null)}; render(); 1"); click('fight'); return ev('!!XA2.pv'); };
  check('LUTE! abre a luta nova', openFight() && ev("XA2.view==='fight'&&XA2.pv.phase==='vs'"), 'view ' + ev('XA2.view'));
  { const h = html(); check('abertura VS com os dois retratos', /pv-ovl pv-vs/.test(h) && (h.match(/class="pv-bigav"/g) || []).length === 2 && /class="pv-bigvs">VS</.test(h), h.slice(0, 200));
    check('HTML da luta sem undefined/NaN/[object', !/undefined|NaN|\[object/.test(h), (h.match(/.{50}(undefined|NaN|\[object).{30}/) || [''])[0]);
    check('HUD: vida com rastro, energia, feed, contadores, velocidade e Pular', ['pa_hp0', 'pa_hp1', 'pa_lg0', 'pa_lg1', 'pa_en0', 'pa_en1', 'pa_feed', 'pa_d0', 'pa_d1', 'pa_cr', 'pa_tm', 'pa_cv'].every(id => h.indexOf('id="' + id + '"') >= 0) && (h.match(/data-x="pvspd"/g) || []).length === 3 && /data-x="skip"/.test(h)); }
  /* o registro é o do módulo: refeito com a mesma semente */
  const cmp = ev(`(function(){ const pv=XA2.pv, r=pv.r, W=Sys.tower, me=JSON.parse(__pre.me); me.petFrac=__pre.pf; const foe=W.scaledFoe(me,pv.opp.fc); foe.petFrac=pv.opp.look?(pv.opp.look.pet?__pre.pf:0):__pre.pf; const d=Sys.arena.duelPvp(me,foe,r.seed), full=Sys.arena.DATA.pvp.enFull, H=pv.script.filter(e=>e.k==='hit');
    return {same:JSON.stringify(d.log)===JSON.stringify(pv.log), n:pv.log.length, win:d.win===r.win, isDuel:pv.log===r.log||(pv.log.length===r.duel.log.length&&pv.log.every((e,i)=>e===r.duel.log[i])), hits:H.map(e=>e.i).join(','), ults:pv.script.filter(e=>e.k==='ult').length, pf:__pre.pf,
      kOk:pv.log.every(e=>e.k==='hit'||e.k==='pet'||e.k==='ult'), ultOk:pv.script.filter(e=>e.k==='ult').map(e=>e.i).join(',')===pv.log.map((e,i)=>e.k==='ult'?i:-1).filter(i=>i>=0).join(',')&&H.every(e=>e.ult===(pv.log[e.i].k==='ult')), petOk:H.every(e=>e.pet===(pv.log[e.i].k==='pet'))&&pv.script.filter(e=>e.k==='atk').every(e=>e.pet===(pv.log[e.i].k==='pet')), enOk:H.every(e=>Math.abs(e.en[e.s]-Math.min(100,pv.log[e.i].en/full*100))<1e-9), pets:[0,1].map(s=>pv.log.filter(e=>e.s===s&&e.k==='pet').length), nUlt:pv.log.filter(e=>e.k==='ult').length,
      order:pv.script.every((e,i,a)=>!i||e.t>=a[i-1].t), consumed:Sys.arena.ensure(S,Sys.host).fights===__pre.fights+1&&Sys.arena.ensure(S,Sys.host).attemptsLeft===__pre.left-1}; })()`);
  check('registro da tela = duel.log do Sys.arena (mesmos objetos)', cmp.isDuel && cmp.n > 0, JSON.stringify(cmp));
  check('registro = Sys.arena.duelPvp refeito com a semente da luta e o petFrac (nada inventado)', cmp.same && cmp.win, JSON.stringify({ same: cmp.same, win: cmp.win, pf: cmp.pf }));
  check('registro no formato final: toda entrada com k hit/pet/ult', cmp.kOk);
  check('ultimate SÓ onde o registro diz k:ult (' + cmp.nUlt + '); pet ataca SÓ onde o registro diz k:pet (' + cmp.pets.join('+') + ')', cmp.ultOk && cmp.petOk, JSON.stringify({ ult: cmp.ultOk, pet: cmp.petOk }));
  check('barra de energia = en do registro (de quem bateu), em % de DATA.pvp.enFull', cmp.enOk);
  check('roteiro: um acerto por golpe do registro, na ordem, com horas crescentes', cmp.hits === Array.from({ length: cmp.n }, (_, i) => i).join(',') && cmp.order, cmp.hits);
  check('a luta gastou UMA tentativa no Sys.arena', cmp.consumed);
  const looks = ev(`(function(){ const pv=XA2.pv, a=pv.F[0].look, b=pv.F[1].look, lk=heroLook(), b2=paPvOppLook(pv.opp), k=pv.opp.look||{};
    return {myMount:a.mount&&a.mount.id, myW:a.weapon&&a.weapon.id, lkW:(wFamLook(lk.weapon)||lk.weapon).id, myWing:a.wing, myPet:a.pet&&a.pet.base, oppMount:b.mount&&b.mount.id, oppMountOk:!!(b.mount&&MOUNT_TBL[b.mount.id]), oppW:b.weapon&&b.weapon.id, oppSkinW:pv.opp.skin&&pv.opp.skin.weapon, oppPet:b.pet&&b.pet.base, oppWing:b.wing, oppHero:b.hero, lv:pv.opp.level, hasLook:!!pv.opp.look,
      asLook:(b.mount?b.mount.id+':'+b.mount.stars:'')===(k.mount?k.mount.id+':'+k.mount.stars:'')&&(b.pet?b.pet.base+':'+b.pet.stage+':'+b.pet.fly:'')===(k.pet?k.pet.base+':'+k.pet.stage+':'+!!k.pet.fly:'')&&(b.wing||'')===(k.wing||'')&&(b.aura||'')===(k.aura?'assets/anim/aura/'+k.aura:'')&&(b.hero===k.hero||(k.hero==='kaia'&&!!k.mount&&mountArtOf('kaia',k.mount.id)!==true&&b.hero==='kael')),
      det:JSON.stringify([b.mount,b.pet,b.wing,b.aura])===JSON.stringify([b2.mount,b2.pet,b2.wing,b2.aura])}; })()`);
  check('minha aparência = a do jogo (montaria, asa, pet, arma do item equipado)', looks.myMount === mt.id && looks.myWing === 'angel' && looks.myPet === pet.base && looks.myW === looks.lkW, JSON.stringify(looks));
  check('adversário aparece como o opp.look do módulo diz (montaria e estrelas, pet e estágio, asa, aura, herói) e a arma é a skin que o módulo deu', looks.hasLook && looks.asLook && looks.oppW === looks.oppSkinW, JSON.stringify(looks));
  check('robô de nível ' + looks.lv + ' (jogador 60): o look do módulo traz montaria, pet e asa (pré-condição dos testes de desenho)', looks.lv >= 58 && looks.oppMountOk && !!looks.oppPet && !!looks.oppWing, JSON.stringify(looks));
  check('placar e VS mostram o nível do adversário', html().indexOf(ev('XA2.pv.opp.name') + ' · Nv ' + looks.lv) >= 0 || (() => { ev('XA2.pv.phase="run"; render(); XA2.pv.phase="vs"; 1'); const h = html(); ev('render(); 1'); return h.indexOf(' · Nv ' + looks.lv + '<') >= 0; })());
  check('aparência do adversário é fixa para o mesmo adversário', looks.det);

  /* ---------- VS → luta (espera as folhas) ---------- */
  await until(() => { drawList(); return ev('XA2.pv.rdy===true'); }, 600);
  check('folhas dos dois lutadores prontas (drawHeroFull desenhou os dois)', ev('XA2.pv.rdy===true'));
  await until(() => ev("(function(){ const pv=XA2.pv; return [0,1].every(i=>sheetLoad(PET_DIR+pv.F[i].look.pet.base+'_idle',true).ok&&sheetLoad(PET_DIR+pv.F[i].look.pet.base+'_atk1',true).ok); })()"), 400);
  for (let i = 0; i < 60 && ev("XA2.pv.phase==='vs'"); i++) step(0.05);
  check('a abertura VS termina e a luta começa', ev("XA2.pv.phase==='run'") && !/pv-ovl pv-vs/.test(html()), ev('XA2.pv.phase'));

  /* ordem do desenho num quadro parado */
  const sprites = L => L.filter(o => RE.pet.test(o.s) || RE.mount.test(o.s) || RE.wing.test(o.s) || RE.weapon.test(o.s) || RE.ult.test(o.s));
  const petLast = (tag, L) => { const P = sprites(L), a = P[P.length - 2], b = P[P.length - 1], fp = P.findIndex(o => RE.pet.test(o.s));
    check(tag + ': os dois pets são os ÚLTIMOS desenhos (o meu, depois o do adversário espelhado)', !!a && !!b && RE.pet.test(a.s) && RE.pet.test(b.s) && !a.m && b.m && fp === P.length - 2, P.slice(-4).map(o => (o.m ? 'E:' : '') + o.s.replace(/^assets\/anim\//, '')).join(' | ')); };
  { const L = drawList(), mo = L.filter(o => RE.mount.test(o.s)), wg = L.filter(o => RE.wing.test(o.s)), wp = L.filter(o => RE.weapon.test(o.s));
    if (VERBOSE) console.log('    ' + sprites(L).map(o => (o.m ? 'E:' : '  ') + o.s).join('\n    '));
    check('parado: montaria dos dois lados (a minha direta, a do adversário ESPELHADA)', mo.some(o => !o.m && o.s.indexOf('_' + looks.myMount + '_') >= 0) && mo.some(o => o.m && o.s.indexOf('_' + looks.oppMount + '_') >= 0), mo.map(o => (o.m ? 'E:' : '') + o.s).join(' | '));
    check('parado: asa nas costas dos dois (a do adversário espelhada)', wg.some(o => !o.m) && wg.some(o => o.m), wg.map(o => (o.m ? 'E:' : '') + o.s).join(' | '));
    check('parado: arma na mão dos dois (a do adversário espelhada)', wp.some(o => !o.m) && wp.some(o => o.m), wp.map(o => (o.m ? 'E:' : '') + o.s).join(' | '));
    check('parado: nenhum desenho do adversário fora do espelho', !mo.some(o => !o.m && looks.oppMount !== looks.myMount && o.s.indexOf('_' + looks.oppMount + '_') >= 0));
    petLast('parado', L); }

  /* ---------- luta assistida até o fim ---------- */
  const seen = { atk0: false, atk1: false, pet0: false, pet1: false, ult0: false, ult1: false, ultMirBad: false, lastBad: 0, cross: 0, frames: 0, usedBad: false, hpBad: false };
  const play = (dt, sample) => { let guard = 0; while (ev("XA2.pv&&XA2.pv.phase!=='result'") && guard++ < 6000) { step(dt);
      const st = ev(`(function(){ const pv=XA2.pv, G=pv.geo, a=paPvPetBox(0,pv,G,true), b=paPvPetBox(1,pv,G,true), u=pv.used; let hpOk=true;
        if(u.length){ let h0=pv.max[0], h1=pv.max[1]; for(let i=0;i<u.length;i++){ const e=pv.log[u[i]]; if(e.s===0) h1=e.hp; else h0=e.hp; } hpOk=Math.abs(h0-pv.hp[0])<1e-6&&Math.abs(h1-pv.hp[1])<1e-6; }
        return {cross:!(a.r<b.l), in:a.l>=0&&b.r<=G.W, used:u.every((v,i)=>v===i), hpOk, ult:pv.ULT?pv.ULT.side:-1}; })()`);
      if (st.cross || !st.in) seen.cross++; if (!st.used) seen.usedBad = true; if (!st.hpOk) seen.hpBad = true;
      if (sample && guard % sample === 0) { const L = drawList(), P = sprites(L); seen.frames++;
        if (L.some(o => !o.m && /_attack_body/.test(o.s) && RE.mount.test(o.s))) seen.atk0 = true; if (L.some(o => o.m && /_attack_body/.test(o.s) && RE.mount.test(o.s))) seen.atk1 = true;
        if (L.some(o => !o.m && RE.pet.test(o.s) && /_atk1\./.test(o.s))) seen.pet0 = true; if (L.some(o => o.m && RE.pet.test(o.s) && /_atk1\./.test(o.s))) seen.pet1 = true;
        for (const o of L) if (RE.ult.test(o.s)) { if (st.ult === 0) { seen.ult0 = true; if (o.m) seen.ultMirBad = true; } else if (st.ult === 1) { seen.ult1 = true; if (!o.m) seen.ultMirBad = true; } }
        const a = P[P.length - 2], b = P[P.length - 1]; if (!(a && b && RE.pet.test(a.s) && RE.pet.test(b.s) && !a.m && b.m)) seen.lastBad++; } } return guard; };
  const steps = play(0.05, 3);
  const fin = ev(`(function(){ const pv=XA2.pv, d=pv.r.duel, L=pv.log; let h0=pv.max[0], h1=pv.max[1], d0=0, d1=0, c0=0; for(const e of L){ if(e.s===0){ h1=e.hp; d0+=e.dmg; if(e.crit) c0++; } else { h0=e.hp; d1+=e.dmg; } }
    return {phase:pv.phase, view:XA2.view, used:pv.used.length, n:L.length, inOrder:pv.used.every((v,i)=>v===i), hp:[pv.hp[0],pv.hp[1]], logHp:[h0,h1], left:[d.hpA*pv.max[0],d.hpB*pv.max[1]], dmg:[pv.dmg[0],pv.dmg[1]], logDmg:[d0,d1], crits:pv.crits, logCrits:c0, win:pv.r.win, duelWin:d.win, loser:pv.loser, alpha:[pv.F[0].alpha,pv.F[1].alpha], ults:pv.script.filter(e=>e.k==='ult').map(e=>e.s).join('')}; })()`);
  const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
  check('luta assistida chegou ao resultado (' + steps + ' passos)', fin.phase === 'result' && fin.view === 'result', JSON.stringify(fin));
  check('consumiu o registro inteiro, na ordem', fin.used === fin.n && fin.inOrder && !seen.usedBad, fin.used + ' de ' + fin.n);
  check('a vida mostrada bateu com o registro a cada passo', !seen.hpBad);
  check('vida final = último hp do registro = fração do duelo (hpA/hpB) x vida cheia', near(fin.hp[0], fin.logHp[0]) && near(fin.hp[1], fin.logHp[1]) && near(fin.hp[0], fin.left[0]) && near(fin.hp[1], fin.left[1]), JSON.stringify([fin.hp, fin.logHp, fin.left]));
  check('dano somado e críticos = os do registro', near(fin.dmg[0], fin.logDmg[0]) && near(fin.dmg[1], fin.logDmg[1]) && fin.crits === fin.logCrits, JSON.stringify([fin.dmg, fin.logDmg, fin.crits, fin.logCrits]));
  check('vencedor = o do Sys.arena', fin.win === fin.duelWin && new RegExp(fin.win ? '>VITÓRIA<' : '>DERROTA<').test(html()), 'win ' + fin.win);
  check('golpe com a folha de ATAQUE da montaria, dos dois lados (o do adversário espelhado)', seen.atk0 && seen.atk1, JSON.stringify(seen));
  check('pet ataca (folha _atk1; o do adversário espelhado) nos lados que têm golpe de pet no registro (' + cmp.pets.join('+') + ')', (!cmp.pets[0] || seen.pet0) && (!cmp.pets[1] || seen.pet1) && cmp.pets[0] + cmp.pets[1] > 0, JSON.stringify(seen));
  check('ultimate com a folha da batalha, espelhada só quando é do adversário', (fin.ults.indexOf('0') < 0 || seen.ult0) && (fin.ults.indexOf('1') < 0 || seen.ult1) && !seen.ultMirBad && fin.ults.length > 0, 'ults ' + fin.ults + ' ' + JSON.stringify(seen));
  check('pets por último em TODOS os quadros amostrados (' + seen.frames + ')', seen.lastBad === 0 && seen.frames > 20, 'fora da ordem em ' + seen.lastBad);
  check('os pets nunca cruzam e ficam dentro da tela (a cada passo, com o bote do ataque)', seen.cross === 0, seen.cross + ' passos');
  check('quem perdeu continua na tela (translúcido, nunca some); quem venceu inteiro', fin.loser < 0 || (fin.alpha[fin.loser] >= 0.3 && fin.alpha[fin.loser] < 1 && fin.alpha[1 - fin.loser] === 1), JSON.stringify(fin.alpha));
  { const L = drawList(); petLast('resultado', L); check('resultado: montaria dos dois continua desenhada', L.filter(o => RE.mount.test(o.s)).length >= 2); }

  /* resultado: exatamente o que o módulo creditou */
  const res = ev(`(function(){ const pv=XA2.pv, o=Sys.arena.ensure(S,Sys.host), li=Sys.arena.leagueInfo(S,Sys.host); return {delta:pv.r.delta, lp:o.lp, lp0:__pre.lp, gold:S.gold-__pre.gold, gems:S.gems-__pre.gems, rw:pv.r.rewards||null, fGold:paF((pv.r.rewards||{}).gold||0), chestMoved:JSON.stringify(Sys.chest.ensure?Sys.chest.ensure(S):null)!==__pre.chest, inv:S.inv.length===__pre.inv, left:o.attemptsLeft, league:li.league.name, on:li.rewardsOn, pz:JSON.stringify(li.league.prize)}; })()`);
  { const h = html(), sgn = res.delta >= 0 ? '+' : '−';
    check('resultado: pontos da liga = delta do módulo', h.indexOf('>' + sgn + Math.abs(res.delta) + ' pontos<') >= 0 && res.lp === Math.max(0, res.lp0 + res.delta), JSON.stringify(res));
    const boxes = hh => (hh.match(/<small>(moedas|gemas|baús?)<\/small>/g) || []).map(x => x.replace(/<\/?small>/g, '')).join(','), want = [res.rw && res.rw.gold > 0 ? 'moedas' : '', res.rw && res.rw.gems > 0 ? 'gemas' : '', res.rw && res.rw.chest > 0 ? (res.rw.chest > 1 ? 'baús' : 'baú') : ''].filter(Boolean).join(',');
    check('resultado: o módulo devolveu r.rewards {gold, gems, chest} e o saldo mudou IGUAL (moedas e gemas; baú = carga do Sys.chest)', !!res.rw && res.gold === res.rw.gold && res.gems === res.rw.gems && res.inv && (res.rw.chest > 0) === res.chestMoved, JSON.stringify(res));
    check('resultado: "Prêmio desta luta" com caixa só para o que veio > 0, valor abreviado pelo jogo', /Prêmio desta luta/.test(h) && boxes(h) === want && want.indexOf('moedas') === 0 && h.indexOf('<b>+' + res.fGold + '</b>') >= 0 && (!(res.rw.gems > 0) || h.indexOf('<b>+' + res.rw.gems + '</b>') >= 0), boxes(h) + ' / ' + want);
    check('resultado: linha de aviso do prêmio da liga ao fechar a semana', /class="pv-note">Prêmio da liga [^<]* ao fechar a semana/.test(h));
    check('resultado: aviso de que o prêmio da liga só vale com o ranking online (enquanto o módulo não entrega)', res.on || /vale quando o ranking online abrir/.test(h));
    check('resultado: barra da liga na tela', /class="pv-lgb"/.test(h));
    /* quando o módulo devolver r.rewards: exatamente o que veio, caixa só para o que é > 0, número abreviado pelo jogo */
    const withRw = rw => { X.__rwv = rw; ev('window.__rw0=XA2.pv.r.rewards; XA2.pv.r.rewards=__rwv; render(); 1'); const hh = html(); ev('XA2.pv.r.rewards=__rw0; 1'); return hh; };
    { const a = withRw({ gold: 18400 }), b = withRw({ gold: 1500000, gems: 12, chest: 1 }), c = withRw({ gold: 900, gems: 0, chest: 0 }), d = withRw({ gold: 0, gems: 0, chest: [{}, {}] }), e = withRw({}), u = withRw(undefined);
      check('sem r.rewards (provider antigo): nenhuma caixa, só pontos, barra e a linha da liga', boxes(u) === '' && !/class="pv-rw"/.test(u) && !/Prêmio desta luta/.test(u) && /class="pv-note"/.test(u));
      check('r.rewards só com moedas: uma caixa, valor abreviado', boxes(a) === 'moedas' && a.indexOf('<b>+' + ev('paF(18400)') + '</b>') >= 0 && /Prêmio desta luta/.test(a), boxes(a));
      check('r.rewards com moedas, gemas e baú: três caixas com o que veio', boxes(b) === 'moedas,gemas,baú' && b.indexOf('<b>+' + ev('paF(1500000)') + '</b>') >= 0 && b.indexOf('<b>+12</b>') >= 0 && b.indexOf('<b>+1</b>') >= 0 && !/1500000/.test(b), boxes(b) + ' ' + ev('paF(1500000)'));
      check('r.rewards com gemas 0 e baú 0: só a caixa de moedas', boxes(c) === 'moedas', boxes(c));
      check('r.rewards só com baú (lista de 2): só a caixa de baús', boxes(d) === 'baús' && d.indexOf('<b>+2</b>') >= 0, boxes(d));
      check('r.rewards vazio: nenhuma caixa', boxes(e) === '' && !/class="pv-rw"/.test(e));
      check('com r.rewards: sem undefined/NaN e a linha da liga continua', [a, b, c, d, e].every(x => !/undefined|NaN|\[object/.test(x) && /class="pv-note"/.test(x))); render0(); }
    check('resultado: Voltar e Lutar de novo com ação', /data-x="back"[^>]*>Voltar à arena</.test(h) && /data-x="again"[^>]*>(Lutar de novo · \d+|Sem lutas hoje)</.test(h) && h.indexOf('Lutar de novo · ' + res.left) >= 0, (h.match(/<button[^>]*data-x="again"[^>]*>[^<]*/) || [''])[0]);
    check('resultado sem undefined/NaN/[object', !/undefined|NaN|\[object/.test(h));
    check('resultado: diz em quantos GOLPES a luta acabou (dado do registro), não o relógio da animação', h.indexOf(' em ' + fin.n + ' golpes<') >= 0 && !/ em \d+:\d\d</.test(h), (h.match(/<p>[^<]*/) || [''])[0]); }
  const watched = { hp: fin.hp, dmg: fin.dmg, crits: fin.crits, win: fin.win };

  /* ---------- Pular = mesmo resultado (o MESMO registro tocado de novo e pulado) ---------- */
  ev("(function(){ const pv=XA2.pv; window.__again={opp:pv.opp,r:pv.r,fc:pv.myFc,max:pv.max.slice()}; XA2.view='fight'; paPvStart(__again.opp,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; render(); })(); 1");
  for (let i = 0; i < 160; i++) step(0.05); const mid = ev('XA2.pv.used.length'); click('skip');
  const sk = ev("(function(){ const pv=XA2.pv; return {phase:pv.phase, view:XA2.view, hp:[pv.hp[0],pv.hp[1]], dmg:[pv.dmg[0],pv.dmg[1]], crits:pv.crits, win:pv.r.win, used:pv.used.length, inOrder:pv.used.every((v,i)=>v===i)}; })()");
  check('Pular no meio (depois de ' + mid + ' golpes) abre o resultado', sk.phase === 'result' && sk.view === 'result' && mid > 0 && mid < fin.n, JSON.stringify(sk));
  check('Pular: mesma vida final, mesmo dano, mesmos críticos e mesmo vencedor da luta assistida', near(sk.hp[0], watched.hp[0]) && near(sk.hp[1], watched.hp[1]) && near(sk.dmg[0], watched.dmg[0]) && near(sk.dmg[1], watched.dmg[1]) && sk.crits === watched.crits && sk.win === watched.win && sk.used === fin.n && sk.inOrder, JSON.stringify([sk, watched]));
  check('Pular: a tela mostra o mesmo título', new RegExp(watched.win ? '>VITÓRIA<' : '>DERROTA<').test(html()));
  ev("(function(){ XA2.view='fight'; paPvStart(__again.opp,__again.r,__again.fc,__again.max[0],__again.max[1]); render(); })(); 1"); click('skip');
  check('Pular durante a abertura VS também chega ao mesmo resultado', ev("XA2.pv.phase==='result'") && near(ev('XA2.pv.hp[0]'), watched.hp[0]) && near(ev('XA2.pv.hp[1]'), watched.hp[1]));

  /* ---------- botões ---------- */
  ev("(function(){ XA2.view='fight'; paPvStart(__again.opp,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; render(); })(); 1");
  { const h = html(), acts = Array.from(new Set((h.match(/data-x="[^"]+"/g) || []).map(s => s.slice(8, -1)))), btn = (h.match(/<button[^>]*>/g) || []);
    check('luta: todo botão tem data-x tratado', btn.length === 4 && btn.every(b => /data-x="(pvspd|skip)"/.test(b)) && acts.every(a => ['pvspd', 'skip'].includes(a)), acts.join(',') + ' · ' + btn.length + ' botões');
    for (const v of [2, 4, 1]) { click('pvspd', { v: String(v) }); const hh = html(); check('velocidade x' + v + ': muda o relógio e marca o botão', ev('XA2.pv.speed') === v && new RegExp('data-v="' + v + '" aria-pressed="true"').test(hh) && (hh.match(/aria-pressed="true"/g) || []).length === 1, 'speed ' + ev('XA2.pv.speed')); }
    click('pvspd', { v: '4' }); const c0 = ev('XA2.pv.clock'); step(0.05); check('x4 anda 4 vezes o relógio da luta', near(ev('XA2.pv.clock') - c0, 0.2), String(ev('XA2.pv.clock') - c0)); click('pvspd', { v: '1' }); }
  click('skip');
  { const left0 = ev('Sys.arena.ensure(S,Sys.host).attemptsLeft'), f0 = ev('Sys.arena.ensure(S,Sys.host).fights'); click('again');
    check('Lutar de novo: nova luta de verdade (gasta tentativa, abre no VS, mesmo adversário)', ev("XA2.view==='fight'&&XA2.pv.phase==='vs'") && ev('Sys.arena.ensure(S,Sys.host).fights') === f0 + 1 && ev('Sys.arena.ensure(S,Sys.host).attemptsLeft') === left0 - 1 && ev('XA2.pv.opp.id===__again.opp.id'), 'tentativas ' + left0 + ' → ' + ev('Sys.arena.ensure(S,Sys.host).attemptsLeft')); }
  click('skip'); ev('Sys.arena.ensure(S,Sys.host).attemptsLeft=0; render(); 1');
  check('sem tentativas: o botão diz "Sem lutas hoje" (apagado, mas não morto)', /data-x="again" aria-disabled="true"[^>]*>Sem lutas hoje</.test(html()) && !/data-x="again"[^>]*\sdisabled/.test(html()), (html().match(/<button[^>]*data-x="again"[^>]*>[^<]*/) || [''])[0]);
  { ev("window.__t0=window.toast; window.__tl=[]; toast=function(t){ __tl.push(String(t)); }; 1"); const f1 = ev('Sys.arena.ensure(S,Sys.host).fights'); click('again'); const tl = ev('__tl.join("|")'); ev('toast=__t0; 1');
    check('sem tentativas: tocar em "Sem lutas hoje" avisa e não começa luta', /Sem lutas hoje/.test(tl) && ev('Sys.arena.ensure(S,Sys.host).fights') === f1 && ev("XA2.view==='result'"), 'aviso: ' + tl); }
  click('back');
  check('Voltar à arena: lobby, luta encerrada', ev("XA2.view==='lobby'&&!XA2.pv") && /role="tablist"/.test(html()));

  /* ---------- aura dos dois lados (atrás do lutador, a do adversário espelhada) e jogador SEM montaria (a pé, de verdade) ---------- */
  ev("XA2.view='fight'; paPvStart(__again.opp,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; XA2.pv.F[0].look.aura='assets/anim/aura/aura7'; XA2.pv.F[1].look.aura='assets/anim/aura/aura13'; 1");
  await until(() => ev("sheetLoad('assets/anim/aura/aura7',true).ok&&sheetLoad('assets/anim/aura/aura13',true).ok"), 300);
  { const L = drawList(), i7 = L.findIndex(o => /aura7/.test(o.s)), i13 = L.findIndex(o => /aura13/.test(o.s)), m0 = L.findIndex(o => !o.m && RE.mount.test(o.s)), m1 = L.findIndex(o => o.m && RE.mount.test(o.s));
    check('aura: desenhada dos dois lados, ATRÁS de cada lutador, a do adversário espelhada', i7 >= 0 && i13 >= 0 && !L[i7].m && L[i13].m && i7 < m0 && i13 < m1, JSON.stringify([i7, m0, i13, m1])); petLast('com aura', L); }
  ev("window.__nolook=Object.assign({},__again.opp); delete __nolook.look; 1");   /* RESERVA: provider antigo, sem opp.look → o robô espelha o jogador */
  ev("(function(){ window.__mt=Sys.mount.ensure(S).eq; Sys.mount.ensure(S).eq=null; statsChanged(); refreshHero(); LKC.t=-1e9; XA2.view='fight'; paPvStart(__nolook,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; })(); 1");
  check('reserva sem opp.look, jogador sem montaria: os DOIS a pé (o robô espelha o jogador), golpe curto', ev('!XA2.pv.F[0].look.mount&&XA2.pv.F[0].dur<0.5&&!XA2.pv.F[1].look.mount&&XA2.pv.F[1].dur<0.5&&!!XA2.pv.F[1].look.pet&&!!XA2.pv.F[1].look.wing'));
  await until(() => { drawList(); return ev('XA2.pv.rdy===true'); }, 400);
  check('a pé x a pé: os dois desenhados', ev('XA2.pv.rdy===true'));
  await until(() => ev("(function(){ const pv=XA2.pv; return [0,1].every(i=>sheetLoad(PET_DIR+pv.F[i].look.pet.base+'_idle',true).ok); })()"), 300);
  { const L = drawList(), hero = /anim\/(hyb|skins)\//; check('a pé x a pé: herói pelas folhas dele dos dois lados (o adversário espelhado), nenhuma folha de montaria', L.some(o => !o.m && hero.test(o.s)) && L.some(o => o.m && hero.test(o.s)) && !L.some(o => RE.mount.test(o.s)), L.map(o => (o.m ? 'E:' : '') + o.s).slice(0, 8).join(' | ')); petLast('a pé x a pé', L);
    check('a pé x a pé: asa dos dois', L.some(o => !o.m && RE.wing.test(o.s)) && L.some(o => o.m && RE.wing.test(o.s)));
    let ult = false, ultBad = false, bad = 0; for (let i = 0; i < 1500 && ev("XA2.pv.phase==='run'"); i++) { step(0.05); if (i % 4 === 0) { const L2 = drawList(), P = sprites(L2), x = P[P.length - 2], y = P[P.length - 1]; if (!(x && y && RE.pet.test(x.s) && RE.pet.test(y.s) && !x.m && y.m)) bad++; const us = ev('XA2.pv.ULT?XA2.pv.ULT.side:-1'); for (const o of L2) if (RE.ult.test(o.s)) { ult = true; if ((us === 1) !== o.m) ultBad = true; } } }
    check('a pé x a pé, luta inteira: pets por último em todos os quadros; ultimate na folha da batalha, espelhada só para o adversário', bad === 0 && ult && !ultBad, 'fora ' + bad + ' ult ' + ult + ' ' + ultBad); }
  for (const [w, h] of [[288, 512], [360, 640], [384, 700], [412, 760]]) { const q = ev('(function(){ const pv=XA2.pv, G=paPvGeo(' + w + ',' + h + '), o={gy:G.gy, xf:G.xf, K:G.K, feed:G.feedTop, half:KAEL_W/2*G.K}; for(const atk of [false,true]){ const a=paPvPetBox(0,pv,G,atk), b=paPvPetBox(1,pv,G,atk); o["a"+(atk?1:0)]=[a.l,a.r,a.gy]; o["b"+(atk?1:0)]=[b.l,b.r,b.gy]; } return o; })()');
    check(w + 'x' + h + ' a pé x a pé: herói inteiro na tela, pet à FRENTE dele (pés um pouco abaixo, acima do feed), cada um na sua metade, sem cruzar', q.xf - q.half >= 0 && q.a0[0] + (q.a0[1] - q.a0[0]) / 2 > q.xf && q.a0[2] > q.gy && q.a0[2] < q.gy + 24 && q.a0[2] < q.feed && q.a1[1] < w / 2 && q.b1[0] > w / 2 && q.a0[0] >= 0 && q.b0[1] <= w && q.a1[1] < q.b1[0] && q.gy - q.K > 60, JSON.stringify(q)); }
  /* sem pet / sem asa: o robô também não tem */
  ev("(function(){ window.__pe=Sys.pet.ensure(S).eq; window.__wg=S.eq.wing; Sys.pet.ensure(S).eq=null; delete S.eq.wing; statsChanged(); refreshHero(); LKC.t=-1e9; XA2.view='fight'; paPvStart(__nolook,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; })(); 1");
  check('reserva sem opp.look, jogador sem montaria, pet, asa e aura: o robô também aparece sem nenhum deles', ev("(function(){ const a=XA2.pv.F[0].look, b=XA2.pv.F[1].look; return !a.mount&&!a.pet&&!a.wing&&!a.aura&&!b.mount&&!b.pet&&!b.wing&&!b.aura&&!!b.weapon&&b.weapon.id===XA2.pv.opp.skin.weapon; })()"), ev('JSON.stringify([XA2.pv.F[0].look.pet,XA2.pv.F[0].look.wing,XA2.pv.F[1].look.pet,XA2.pv.F[1].look.wing])'));
  { await until(() => { drawList(); return ev('XA2.pv.rdy===true'); }, 300); const L = drawList(); check('sem pet/asa: nada de pet, asa ou montaria no desenho; os dois heróis e as armas continuam', !L.some(o => RE.pet.test(o.s) || RE.wing.test(o.s) || RE.mount.test(o.s)) && L.some(o => !o.m && RE.weapon.test(o.s)) && L.some(o => o.m && RE.weapon.test(o.s)), L.map(o => (o.m ? 'E:' : '') + o.s).slice(0, 8).join(' | ')); for (let i = 0; i < 60; i++) step(0.05); drawList(); }
  /* opp.look vindo do provider: usado inteiro, mesmo com o jogador sem nada (e sem mount = a pé, mesmo com o jogador montado) */
  { const q = ev("(function(){ const my0=paPvMyLook(), full=paPvOppLook({id:'x',skin:{weapon:'w01',armor:'a01'},look:{hero:'kael',mount:{id:'horse',stars:3},pet:{sprite:'era2_dragon',stage:2},wing:'demon',aura:'aura7'}},my0), foot=paPvOppLook({id:'y',skin:{weapon:'w01'},look:{wing:'angel'}},{mount:{id:'wolf',stars:5},pet:{base:'p'},wing:'angel',aura:'a'}); return {full:[full.mount&&full.mount.id,full.mount&&full.mount.stars,full.pet&&full.pet.base,full.wing,full.aura].join('|'), foot:[!!foot.mount,!!foot.pet,foot.wing,!!foot.aura].join('|'), mine:!my0.mount&&!my0.pet}; })()");
    check('opp.look do provider é usado inteiro (jogador sem nada, adversário completo)', q.mine && q.full === 'horse|3|era2_dragon_mid|demon|assets/anim/aura/aura7', JSON.stringify(q));
    check('opp.look sem montaria/pet/aura = adversário a pé e sem eles, mesmo com o jogador equipado', q.foot === 'false|false|angel|false', q.foot); }
  ev("(function(){ Sys.pet.ensure(S).eq=__pe; S.eq.wing=__wg; })(); 1");
  ev("(function(){ Sys.mount.equip(S,__mt); statsChanged(); refreshHero(); LKC.t=-1e9; })(); 1");

  /* ---------- placar e VS em tela estreita (visto pelo QA a 288): nomes inteiros, FC numa linha, retratos alinhados ---------- */
  ev("XA2.view='fight'; paPvStart(Object.assign({},__again.opp,{name:'Odin das Eras'}),__again.r,__again.fc,__again.max[0],__again.max[1]); 1");
  check('placar: o nome não usa reticências nem corte (CSS)', ev("!/\\.pv-pn\\{[^}]*(ellipsis|overflow:hidden)/.test(PV_CSS)&&/\\.pv-pf\\{[^}]*white-space:nowrap/.test(PV_CSS)"));
  for (const w of [288, 320, 360, 384, 412]) { const q = ev('(function(){ const pv=XA2.pv; pv.phase="run"; const h=paPvHTML({Wb:' + w + ',H:640}), nm=[...h.matchAll(/<div class="pv-pn( w2)?" style="font-size:([0-9.]+)px"><span>([^<]*)<\\/span>/g)].map(m=>({two:!!m[1],fs:+m[2],t:m[3],em:xTxtEm(m[3])})), fc=[...h.matchAll(/<div class="pv-pf" style="font-size:([0-9.]+)px">([^<]*)</g)].map(m=>({fs:+m[1],t:m[2],em:xTxtEm(m[2])})), av=paPvNameFit(["a","b"],' + w + ').avail; pv.phase="vs"; const v=paPvHTML({Wb:' + w + ',H:640}); return {nm,fc,av,vs:v}; })()');
    const okN = q.nm.length === 2 && q.nm[0].two === q.nm[1].two && q.nm[0].fs === q.nm[1].fs && q.nm.every(x => x.fs >= 9 && x.em * x.fs <= q.av * (x.two ? 1.7 : 1) + 0.5) && q.nm[1].t.indexOf('Odin das Eras') === 0;
    check(w + ': nomes do placar inteiros (uma linha, ou os DOIS lados em duas linhas da mesma altura), fonte >= 9', okN, JSON.stringify({ nm: q.nm, av: q.av }));
    check(w + ': FC do placar numa linha só e cabendo (fonte >= 7, igual dos dois lados)', q.fc.length === 2 && q.fc[0].fs === q.fc[1].fs && q.fc.every(x => x.fs >= 7 && x.em * x.fs <= q.av + 0.5), JSON.stringify(q.fc));
    const row = (q.vs.match(/<div class="pv-vsrow">([\s\S]*?)<\/div><div style="font-weight:900/) || ['', ''])[1], kids = (row.match(/<div class="pv-(vsc[^"]*|bigvs)"/g) || []).map(x => x.replace(/<div class="pv-/, '').replace(/"$/, ''));
    check(w + ': VS com os dois retratos na MESMA linha da grade e os nomes na linha de baixo', kids.join(',') === 'vsc,bigvs,vsc r,vsc n,vsc n r' && !/<div class="pv-bigav">[\s\S]{0,400}?<\/div><b>/.test(row), kids.join(',')); }
  check('288: nome comprido cai em duas linhas; 360: uma linha', w288());
  check('VS: grade de duas linhas (retratos alinhados independentemente do tamanho do nome)', ev("/\\.pv-vsrow\\{display:grid;[^}]*grid-template-rows:auto auto/.test(PV_CSS)"));

  /* ---------- medidas: 288, 360, 384, 412 ---------- */
  ev("Sys.arena.ensure(S,Sys.host).attemptsLeft=3; XA2.view='fight'; paPvStart(__again.opp,__again.r,__again.fc,__again.max[0],__again.max[1]); XA2.pv.phase='run'; 1");
  for (const [w, h] of [[288, 512], [360, 640], [384, 700], [412, 760], [360, 560]]) {
    const q = ev(`(function(){ const pv=XA2.pv, G=paPvGeo(${w},${h}), out={W:G.W, gy:G.gy, gyP:G.gyP, hs:G.hs, K:G.K, feed:G.feedTop};
      for(const atk of [false,true]){ const a=paPvPetBox(0,pv,G,atk), b=paPvPetBox(1,pv,G,atk); out['a'+(atk?1:0)]=[a.l,a.r]; out['b'+(atk?1:0)]=[b.l,b.r]; }
      const m=mountMetrics(pv.F[0].look.mount.id), k=G.K/256; out.front=G.x+(m?m.right*k:0); out.top=G.gy-(m?m.top*k:0); const hh=paPvHTML({Wb:${w},H:${h}}); out.bad=(/overflow-x:\\s*(auto|scroll)|overflow:\\s*(auto|scroll)|scroll-snap|grid-auto-flow:\\s*column/.exec(hh)||[''])[0]; out.nan=/undefined|NaN|\\[object/.test(hh); return out; })()`);
    const tag = w + 'x' + h + ': ';
    check(tag + 'pets dentro da tela, cada um na metade do dono, sem cruzar (parado e no bote)', q.a0[0] >= 0 && q.a1[0] >= 0 && q.a0[1] < w / 2 && q.a1[1] < w / 2 && q.b0[0] > w / 2 && q.b1[0] > w / 2 && q.b0[1] <= w && q.b1[1] <= w && q.a1[1] < q.b1[0], JSON.stringify(q));
    check(tag + 'pés dos heróis acima do plano dos pets, pets acima do feed, feed acima dos botões', q.gy < q.gyP && q.gyP < q.feed && q.feed + 52 < h - 108 && q.gy > 150, JSON.stringify(q));
    check(tag + 'herói montado cabe abaixo do placar (topo da montaria abaixo de 60 px)', q.top > 60, 'topo ' + q.top);
    check(tag + 'HTML sem rolagem horizontal declarada e sem undefined/NaN', !q.bad && !q.nan, q.bad); }
  ev('paPvFree(); XA2.view="lobby"; 1');

  /* ---------- texto: sem emoji; roteiro puro ---------- */
  { const src = fs.readFileSync(path.join(G.ROOT, 'js/p_arena.js'), 'utf8'), blk = src.slice(src.indexOf('LUTA PvP (Tela 23')), emo = /[\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}\uFE0F]/u.exec(blk);
    check('código da luta nova sem emoji nem símbolo de estrela/visto', !emo, emo ? 'achado: U+' + emo[0].codePointAt(0).toString(16) : '');
    check('código da luta nova sem sorteio para número (Math.random só no tremor)', (blk.match(/Math\.random\(\)/g) || []).length === 1 && /Math\.random\(\)-0\.5\)\*8\*F\.shake/.test(blk)); }
  { const s = ev(`(function(){ const log=[]; let hp=[1000,1000]; for(let i=0;i<14;i++){ const s=i%2; hp[1-s]-=60; log.push({s,dmg:60,crit:i===4,hp:hp[1-s]}); }
      const a=paPvScript(log,[0.64,0.19]), b=paPvScript(log.map((e,i)=>Object.assign({},e,i===2?{k:'ult',en:0}:i===3?{k:'pet',en:0}:{k:'hit',en:Math.min(100,25*(1+(i>>1)))})),[0.64,0.64]);
      return {hits:a.filter(e=>e.k==='hit').map(e=>e.i).join(','), ults:a.filter(e=>e.k==='ult').length, mono:a.every((e,i,x)=>!i||e.t>=x[i-1].t), sum:a.filter(e=>e.k==='hit').reduce((v,e)=>v+e.dmg,0),
        b:{ult:b.filter(e=>e.k==='ult').map(e=>e.i).join(','), pet:b.filter(e=>e.k==='hit'&&e.pet).map(e=>e.i).join(','), petAtk:b.filter(e=>e.k==='atk'&&e.pet).map(e=>e.i).join(','), hits:b.filter(e=>e.k==='hit').length, en0:b.filter(e=>e.k==='hit'&&e.i===0)[0].en.join('/'), en1:b.filter(e=>e.k==='hit'&&e.i===1)[0].en.join('/')}}; })()`);
    check('roteiro puro, registro sem k (provider antigo): 14 acertos na ordem, mesma soma, NENHUMA ultimate nem pet criados pela tela', s.hits === Array.from({ length: 14 }, (_, i) => i).join(',') && s.mono && s.sum === 840 && s.ults === 0, JSON.stringify(s));
    check('roteiro com k/en: ultimate só no k:ult, pet só no k:pet, energia = en de quem bateu e +enHurt para quem levou', s.b.ult === '2' && s.b.pet === '3' && s.b.petAtk === '3' && s.b.hits === 14 && s.b.en0 === '25/10' && s.b.en1 === '35/25', JSON.stringify(s.b)); }

  check('nenhum erro de execução', !errs.length, errs.slice(0, 4).join(' | '));
  const ce = G.consoleErrs.filter(s => /arena|drawHeroFull|pvp/i.test(s)); check('nenhum erro da luta no console', !ce.length, ce.slice(0, 3).join(' | '));
  console.log(fail ? '\nFALHOU: ' + fail + ' de ' + n + ' verificações' : '\nTUDO OK (' + n + ' verificações)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('ERRO no teste: ' + (e && e.stack || e)); process.exit(1); });
