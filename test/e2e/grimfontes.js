'use strict';
/* GRIMÓRIO: FONTES DO DIA ligadas ao jogo (docs/LIGACOES_BATALHA.md seção 7).
   Sem navegador: node test/e2e/grimfontes.js
   Sobe o jogo de verdade no sandbox (Grimório LIGADO pelo SYS_LIVE), espia o Sys.grimoire.onSource e confere que cada fonte o chama UMA vez por evento,
   com o id certo, e NUNCA em redesenho, relógio ou passo da luta:
   instância vencida (js/instfx.js) e varrida (js/p_inst.js), andar da Torre (js/p_tower2.js e js/p_tower.js), missão diária resgatada (js/p_missions.js)
   e marco da trilha do evento (js/p_events.js). O aviso (grimSrc, js/ui.js) sai uma vez só e não apaga o aviso da tela.
   Só lê arquivos do jogo. Código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const J = code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  const spin = () => { try { G.advance(4000); } catch (e) {} };   /* relógios das telas (animação da Torre, avisos) */
  ev(`(function(){ S.tut=99; S.welcome=true; S.best=Math.max(S.best||0,12); S.stage=Math.max(S.stage||1,12); B.paused=false; B.res=null; view='battle';
    window.__gs=[]; const real=Sys.grimoire.onSource;
    Sys.grimoire.onSource=function(s,h,src,ctx){ const r=real.apply(this,arguments); __gs.push({src:src,id:String(ctx&&ctx.id),floor:ctx&&ctx.floor,era:ctx&&ctx.era,spell:ctx&&ctx.spell,ok:!!(r&&r.ok),reason:r&&r.reason,pages:r&&r.pages,ink:r&&r.ink}); return r; };
    window.__ts=[]; const t0=toast; toast=function(m){ __ts.push(String(m)); try{ return t0.apply(this,arguments); }catch(e){} };
    window.__of=function(src){ return __gs.filter(x=>x.src===src); };
    window.__newDay=function(){ delete Sys.grimoire.ensure(S).src; __gs.length=0; __ts.length=0; };   /* zera o teto do dia entre as partes do teste */
    window.__redraw=function(k){ for(let i=0;i<(k||3);i++){ try{ render(); }catch(e){} try{ hud(); }catch(e){} try{ if(typeof updHudExtra==='function') updHudExtra(); }catch(e){} try{ const d=Panels.cur&&Panels.cur(); if(d&&d.tick) d.tick(); }catch(e){} } };
    window.__btn=function(d){ return {dataset:d,getAttribute:function(){ return null; },closest:function(){ return null; }}; };
    return 1; })()`);
  check('o jogo sobe com o Grimório LIGADO e o grimSrc carregado (js/ui.js)', ev("Sys.grimoire.DATA.on===true&&typeof grimSrc==='function'&&typeof grimSrcTxt==='function'"));
  check('texto do aviso: página no singular e no plural, tinta, e vazio quando nada entrou', ev("grimSrcTxt(1,3)") === 'Grimório: +1 página · +3 de tinta' && ev("grimSrcTxt(2,0)") === 'Grimório: +2 páginas' && ev("grimSrcTxt(0,5)") === 'Grimório: +5 de tinta' && ev("grimSrcTxt(0,0)") === '');

  /* ---------- 1) INSTÂNCIA vencida (js/instfx.js) ---------- */
  { const r = J(`const I=Sys.instances, ink0=Sys.grimoire.ensure(S).ink; const st=I.start(S,Sys.host,'gear',0); if(!st||!st.ok) return {err:'start',st:st}; startInstanceRun(st.run); const id=st.run.id;
      for(let i=0;i<30;i++) step(1/30); const mid=__of('instance').length; instEnd(true); const a=__of('instance').slice();
      for(let i=0;i<60;i++) step(1/30); __redraw(4); return {id:id,mid:mid,a:a,after:__of('instance').length,ink:Sys.grimoire.ensure(S).ink-ink0,ts:__ts.slice(),era:(I.levelInfo(0)||{}).era};`);
    check('instância em andamento: o passo da luta não chama a fonte', r.mid === 0, JSON.stringify(r));
    check('instância VENCIDA: onSource("instance") UMA vez, com o id da corrida e a era do nível', r.a && r.a.length === 1 && r.a[0].id === r.id && r.a[0].era === r.era && r.a[0].ok === true && r.a[0].ink === 3 && r.ink === 3, JSON.stringify(r));
    check('instância: passos da luta e redesenhos depois do fim não chamam de novo', r.after === 1, JSON.stringify(r));
    check('instância: UM aviso "Grimório: +3 de tinta"', r.ts && r.ts.filter(t => t.indexOf('Grimório:') === 0).length === 1 && r.ts.includes('Grimório: +3 de tinta'), JSON.stringify(r.ts));
    const l = J(`__newDay(); const I=Sys.instances; const st=I.start(S,Sys.host,'gear',0); if(!st||!st.ok) return {err:'start',st:st}; startInstanceRun(st.run); instEnd(false); __redraw(2); return {n:__of('instance').length,ts:__ts.filter(t=>t.indexOf('Grimório')>=0)};`);
    check('instância PERDIDA: a fonte não é chamada', l.n === 0 && l.ts.length === 0, JSON.stringify(l)); }

  /* ---------- 2) INSTÂNCIA varrida (js/p_inst.js) ---------- */
  { const r = J(`__newDay(); const I=Sys.instances; Panels.open('inst'); const can=I.canSweep(S,Sys.host,'gear',0), k0=I.status(S,Sys.host).keys.gear; PInst.state.sel=PInst.state.sel||{}; PInst.state.sel.gear=0; Panels.defs.inst.click(__btn({x:'ok',t:'gear'}));
      Panels.defs.inst.click(__btn({x:'sweep',t:'gear'})); const a=__of('instance').slice(); __redraw(4); Panels.defs.inst.render(); Panels.defs.inst.render();
      return {can:can,k0:k0,k1:I.status(S,Sys.host).keys.gear,a:a,after:__of('instance').length,ts:__ts.filter(t=>t.indexOf('Grimório')>=0)};`);
    check('varrer: nível já vencido e com entrada (pré-condição do teste)', r.can === true && r.k1 === r.k0 - 1, JSON.stringify(r));
    check('instância VARRIDA: onSource("instance") UMA vez, id "sweep-tipo-nível-hora"', r.a.length === 1 && /^sweep-gear-0-\d+$/.test(r.a[0].id) && r.a[0].ok === true && r.a[0].ink === 3, JSON.stringify(r));
    check('varrida: redesenhar a tela do resultado não chama de novo; um aviso só', r.after === 1 && r.ts.length === 1, JSON.stringify(r));
    const z = J(`const I=Sys.instances; while(I.status(S,Sys.host).keys.gear>0&&I.canSweep(S,Sys.host,'gear',0)) I.sweep(S,Sys.host,'gear',0); Panels.defs.inst.click(__btn({x:'ok',t:'gear'})); const n0=__gs.length; Panels.defs.inst.click(__btn({x:'sweep',t:'gear'})); return {d:__gs.length-n0,k:I.status(S,Sys.host).keys.gear};`);
    check('varrer SEM entrada (recusado pelo módulo): a fonte não é chamada', z.d === 0, JSON.stringify(z));
    ev("try{ Screens.close(); }catch(e){} 1"); }

  /* ---------- 3) TORRE nova (js/p_tower2.js) ---------- */
  { const r = J(`__newDay(); const T=Sys.tower, L=Sys.level, iu=L&&L.isUnlocked; if(L&&iu) L.isUnlocked=function(s,k){ return k==='tower'?true:iu.apply(this,arguments); };
      const f0=T.fight; T.fight=function(){ const q=f0.apply(this,arguments); window.__tw=q; return q; };
      const out={}; const go=function(best,key){ const o=T.ensure(S,Sys.host); o.best=best; o.lossesLeft=3; window.__tw=null; const n0=__of('tower').length; Panels.defs.tower2.click(__btn({x:'go'}));
        out[key]={res:__tw?{ok:__tw.ok,win:__tw.win,floor:__tw.floor}:null,calls:__of('tower').slice(n0)}; };
      Panels.open('tower2'); go(9,'f10'); return out;`);
    spin();
    const a = J(`__redraw(4); Panels.defs.tower2.render(); return {n:__of('tower').length,ts:__ts.filter(t=>t.indexOf('Grimório')>=0)};`);
    const won = r.f10.res && r.f10.res.ok && r.f10.res.win;
    check('Torre: a luta do andar 10 aconteceu de verdade (Sys.tower.fight)', !!(r.f10.res && r.f10.res.ok && r.f10.res.floor === 10), JSON.stringify(r));
    if (won) {
      check('Torre nova, andar 10 VENCIDO: onSource("tower") UMA vez, id "floor-10", 5 de tinta', r.f10.calls.length === 1 && r.f10.calls[0].id === 'floor-10' && r.f10.calls[0].floor === 10 && r.f10.calls[0].ok && r.f10.calls[0].ink === 5, JSON.stringify(r));
      check('Torre nova: a animação da luta, o resultado e os redesenhos não chamam de novo; um aviso só', a.n === 1 && a.ts.length === 1 && a.ts[0] === 'Grimório: +5 de tinta', JSON.stringify(a));
    } else check('Torre nova, andar 10 PERDIDO: a fonte não é chamada', r.f10.calls.length === 0 && a.n === 0, JSON.stringify(r));
    /* resultado forçado (vitória e derrota), para o gancho ser provado nos dois casos seja qual for a força do herói novo */
    const k = J(`const T=Sys.tower, real=T.fight; const out={}; const forced=function(win){ return function(){ const q=real.apply(this,arguments); if(q&&q.ok){ q.win=win; if(win&&!q.rewards) q.rewards=T.grantRewards(S,Sys.host,T.rewardsFor(q.floor,Sys.host,S)); } return q; }; };
      const go=function(best,win,key){ try{ Screens.close(); }catch(e){} Panels.open('tower2'); const o=T.ensure(S,Sys.host); o.best=best; o.lossesLeft=3; T.fight=forced(win); const n0=__of('tower').length, t0=__ts.length; let err='';
        try{ Panels.defs.tower2.click(__btn({x:'go'})); }catch(e){ err=String(e&&e.message||e); } T.fight=real; out[key]={calls:__of('tower').slice(n0),ts:__ts.slice(t0).filter(t=>t.indexOf('Grimório')>=0),err:err}; };
      __newDay(); go(19,true,'w20'); window.__go=go; window.__out=out; return out;`);
    spin();
    const k2 = J(`__go(20,true,'w21'); return __out;`); spin();
    const k3 = J(`__go(29,false,'l30'); return __out;`); spin();
    const k4 = J(`__redraw(3); return {n:__of('tower').length};`);
    check('Torre nova, vitória no andar 20: UMA chamada, id "floor-20", paga a tinta', k.w20.calls.length === 1 && k.w20.calls[0].id === 'floor-20' && k.w20.calls[0].ok && k.w20.calls[0].ink === 5 && k.w20.ts.length === 1 && !k.w20.err, JSON.stringify(k.w20));
    check('Torre nova, vitória no andar 21 (não é múltiplo de 10): UMA chamada, o módulo devolve "skip", sem aviso', k2.w21.calls.length === 1 && k2.w21.calls[0].reason === 'skip' && !k2.w21.calls[0].ok && k2.w21.ts.length === 0 && !k2.w21.err, JSON.stringify(k2.w21));
    check('Torre nova, DERROTA no andar 30: a fonte não é chamada', k3.l30.calls.length === 0 && !k3.l30.err, JSON.stringify(k3.l30));
    check('Torre nova: total de chamadas = vitórias (2), nada a mais nos redesenhos', k4.n === 2, JSON.stringify(k4));
    ev("try{ Screens.close(); }catch(e){} 1"); }

  /* ---------- 4) TORRE antiga (js/p_tower.js) ---------- */
  { const r = J(`__newDay(); const T=Sys.tower, real=T.fight; T.fight=function(){ const q=real.apply(this,arguments); if(q&&q.ok){ q.win=true; if(!q.rewards) q.rewards=T.grantRewards(S,Sys.host,T.rewardsFor(q.floor,Sys.host,S)); } return q; };
      const o=T.ensure(S,Sys.host); o.best=39; o.lossesLeft=3; let err=''; try{ Panels.open('tower'); Panels.defs.tower.click(__btn({x:'climb'})); }catch(e){ err=String(e&&e.message||e); } T.fight=real; return {a:__of('tower').slice(),err:err};`);
    spin();
    const a = J(`__redraw(3); return {n:__of('tower').length,ts:__ts.filter(t=>t.indexOf('Grimório')>=0)};`);
    check('Torre antiga, andar 40 vencido: onSource("tower") UMA vez, id "floor-40"', r.a.length === 1 && r.a[0].id === 'floor-40' && r.a[0].ok && r.a[0].ink === 5, JSON.stringify(r));
    check('Torre antiga: animação e redesenhos não chamam de novo; um aviso só', a.n === 1 && a.ts.length === 1, JSON.stringify(a));
    ev("try{ if(typeof tStop==='function') tStop(); Screens.close(); }catch(e){} 1"); }

  /* ---------- 5) MISSÕES diárias (js/p_missions.js) ---------- */
  { const r = J(`__newDay(); const P=Sys.pass, D=P.DATA.daily, ink0=Sys.grimoire.ensure(S).ink; P.track(S,Sys.host,D[0].k,D[0].need); Panels.open('missions');
      const n0=__gs.length; __redraw(3); const idle=__gs.length-n0;
      Panels.defs.missions.click(__btn({x:'claim',src:'pass',id:D[0].id})); const a=__of('mission').slice(), ts=__ts.slice();
      Panels.defs.missions.click(__btn({x:'claim',src:'pass',id:D[0].id})); __redraw(3);
      return {id:D[0].id,idle:idle,a:a,after:__of('mission').length,ink:Sys.grimoire.ensure(S).ink-ink0,ts:ts};`);
    check('Missões: abrir e redesenhar a tela não chama a fonte', r.idle === 0, JSON.stringify(r));
    check('missão DIÁRIA resgatada: onSource("mission") UMA vez, id da missão, 1 de tinta', r.a.length === 1 && r.a[0].id === r.id && r.a[0].ok && r.a[0].ink === 1 && r.ink === 1, JSON.stringify(r));
    check('missão já resgatada (2º toque) e redesenhos: nenhuma chamada nova', r.after === 1, JSON.stringify(r));
    check('missão: o aviso do resgate traz o Grimório no MESMO aviso (um não apaga o outro)', r.ts.length >= 1 && /Grimório: \+1 de tinta$/.test(r.ts[r.ts.length - 1]) && r.ts.filter(t => t.indexOf('Grimório') >= 0).length === 1, JSON.stringify(r.ts));
    const all = J(`const P=Sys.pass, D=P.DATA.daily; for(const m of D) P.track(S,Sys.host,m.k,m.need); const L=P.list(S,Sys.host), ready=L.daily.filter(m=>m.done&&!m.claimed).map(m=>m.id); const n0=__of('mission').length, t0=__ts.length, ink0=Sys.grimoire.ensure(S).ink;
      PMissions&&0; Panels.defs.missions.click(__btn({x:'tab',t:'daily'})); Panels.defs.missions.click(__btn({x:'all'})); const c=__of('mission').slice(n0); __redraw(3);
      const L2=P.list(S,Sys.host); return {ready:ready,bonus:!!L2.bonus.claimed,ids:c.map(x=>x.id),paid:c.filter(x=>x.ok).length,after:__of('mission').length-n0,ink:Sys.grimoire.ensure(S).ink-ink0,ts:__ts.slice(t0),cap:Sys.grimoire.DATA.sources.mission.cap.ink};`.replace('PMissions&&0; ', ''));
    const want = all.ready.concat(all.bonus ? ['bonus'] : []);
    check('"Resgatar tudo" nas diárias: UMA chamada por missão resgatada (e o bônus das diárias), sem repetir id', all.ready.length >= 2 && all.ids.length === want.length && want.every(id => all.ids.filter(x => x === id).length === 1) && all.after === all.ids.length, JSON.stringify(all));
    check('"Resgatar tudo": a tinta para no teto do dia do módulo e sai somada num aviso só', all.ink === Math.min(all.cap - 1, all.ids.length) && all.ink === all.paid && all.ts.filter(t => t.indexOf('Grimório') >= 0).length === 1 && all.ts[all.ts.length - 1].endsWith('missões resgatadas · +15 gemas · +75 XP do Passe · Grimório: +' + all.ink + ' de tinta'), JSON.stringify(all));
    const wk = J(`__newDay(); const P=Sys.pass, W=P.DATA.weekly||[]; if(!W.length) return {skip:1}; for(const m of W) P.track(S,Sys.host,m.k,m.need); const L=P.list(S,Sys.host).weekly.filter(m=>m.done&&!m.claimed); if(!L.length) return {skip:1};
      Panels.defs.missions.click(__btn({x:'claim',src:'pass',id:L[0].id})); return {n:__of('mission').length,ts:__ts.slice()};`);
    check('missão SEMANAL resgatada: não é fonte do Grimório (nenhuma chamada)', wk.skip === 1 || (wk.n === 0 && wk.ts.every(t => t.indexOf('Grimório') < 0)), JSON.stringify(wk));
    ev("try{ Screens.close(); }catch(e){} 1"); }

  /* ---------- 6) EVENTOS: marco da trilha (js/p_events.js) ---------- */
  { const r = J(`__newDay(); const E=Sys.evtrail, real=E.claimTrail; let calls=0; E.claimTrail=function(s,h,id,at){ calls++; return at===300?{ok:false,reason:'points'}:{ok:true,got:{}}; };
      const mk=function(){ return {cur:{live:true,ev:{id:'evTeste'}},tr:{earned:250,milestones:[{at:100,name:'Marco A',reached:true,claimed:false,reward:{}},{at:200,name:'Marco B',reached:true,claimed:false,reward:{}},{at:250,name:'Marco C',reached:true,claimed:false,reward:{}},{at:300,name:'Marco D',reached:false,claimed:false,reward:{}}]}}; };
      const out={}; let err='';
      try{ const M=mk(); etNode(M,100); out.one=__of('event').slice(); out.oneTs=__ts.slice(); M.tr.milestones[0].claimed=true; etNode(M,100); etNode(M,300); __redraw(3); out.afterOne=__of('event').length;
        __newDay(); const M2=mk(); etClaimAll(M2); out.all=__of('event').slice(); out.allTs=__ts.slice(); __redraw(3); out.afterAll=__of('event').length;
        __newDay(); const M3=mk(); M3.cur.live=false; etNode(M3,100); etClaimAll(M3); out.prev=__of('event').length;
        __newDay(); const M4=mk(); M4.cur.ev.grimSpell='minotaurSpear'; etNode(M4,100); out.sp=__of('event').slice(); }catch(e){ err=String(e&&e.stack||e).slice(0,300); }
      E.claimTrail=real; out.err=err; out.calls=calls; return out;`);
    check('eventos: os testes rodaram sem exceção', !r.err, r.err);
    check('marco da trilha resgatado: onSource("event") UMA vez, id "evento:marco", 2 de tinta', r.one && r.one.length === 1 && r.one[0].id === 'evTeste:100' && r.one[0].ok && r.one[0].ink === 2 && r.one[0].spell === null, JSON.stringify(r.one));
    check('marco: o aviso do prêmio traz o Grimório no MESMO aviso', r.oneTs && r.oneTs.length === 1 && r.oneTs[0].indexOf('Marco A foi para a sua mochila') === 0 && /Grimório: .*\+2 de tinta$/.test(r.oneTs[0]), JSON.stringify(r.oneTs));
    check('marco já resgatado, marco sem pontos e redesenhos: nenhuma chamada nova', r.afterOne === 1, JSON.stringify(r));
    check('"Resgatar tudo" da trilha: UMA chamada por marco resgatado (3), ids diferentes; só o 1º paga (teto do dia)', r.all && r.all.length === 3 && r.all.map(x => x.id).join() === 'evTeste:100,evTeste:200,evTeste:250' && r.all[0].ok && r.all[1].reason === 'cap' && r.all[2].reason === 'cap' && r.afterAll === 3, JSON.stringify(r.all));
    check('"Resgatar tudo" da trilha: um aviso só, com o Grimório somado', r.allTs && r.allTs.length === 1 && r.allTs[0].indexOf('3 prêmios da trilha resgatados') === 0 && /Grimório: .*\+2 de tinta$/.test(r.allTs[0]), JSON.stringify(r.allTs));
    check('evento em prévia (não está ao vivo): a fonte não é chamada', r.prev === 0, JSON.stringify(r));
    check('evento com magia própria (grimSpell): o id da magia vai no ctx.spell', r.sp && r.sp.length === 1 && r.sp[0].spell === 'minotaurSpear', JSON.stringify(r.sp)); }

  /* ---------- 7) chave DESLIGADA: nada muda ---------- */
  { const r = J(`__newDay(); Sys.grimoire.setOn(false); const g0=JSON.stringify(S.sys.grimoire); const a=grimSrc('instance',{id:'x1',era:0}), b=grimSrc('tower',{id:'floor-10',floor:10}); Sys.grimoire.setOn(true);
      return {a:a&&a.reason,b:b&&b.reason,same:JSON.stringify(S.sys.grimoire)===g0,ts:__ts.length};`);
    check('chave do módulo desligada: "off", nada gravado e nenhum aviso', r.a === 'off' && r.b === 'off' && r.same && r.ts === 0, JSON.stringify(r)); }

  const errs = (G.consoleErrs || []).filter(e => /grim/i.test(String(e)));
  check('nenhum erro de Grimório no console do jogo', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log((fail ? 'FALHOU' : 'OK') + ': ' + (n - fail) + '/' + n + ' (fontes do dia do Grimório: uma chamada por evento)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  FALHA exceção no teste · ' + (e && e.stack || e)); process.exit(1); });
