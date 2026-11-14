'use strict';
/* TELA DE EVENTOS com o CALENDÁRIO DE EDIÇÕES (js/p_events.js + Sys.events.load / base; docs/CALENDARIO_EVENTOS.md).
   Sem navegador: node test/e2e/eventos_edicao.js
   Sobe o jogo de verdade no sandbox e confere: abrir a tela pede o calendário (Sys.events.load) UMA vez, sem travar a abertura; o calendário fica no save;
   a edição de id novo (festival_eras_AAMMDD) aparece com a arte e as cores do TEMA (ev.base), com reserva para o ev.id; pontos, missões, loja e trilha são
   os da edição atual (id completo); edição nova começa do zero; sem rede a tela abre igual. Só lê arquivos do jogo. Código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }), { ev } = G; const wait = async () => { for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r)); }; await wait();
  const J = code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  const DAY = 86400000, now = Date.now(), ymd = t => { const d = new Date(t - 3 * 3600000), p = x => String(x).padStart(2, '0'); return p(d.getUTCFullYear() % 100) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()); };
  const mk = (t0, days) => ({ id: 'festival_eras_' + ymd(t0), start: new Date(t0).toISOString(), end: new Date(t0 + days * DAY).toISOString() });
  const A = mk(now - 2 * DAY, 14), B2 = mk(now - 1 * DAY, 14);   /* duas edições do mesmo tema, com ids diferentes; as duas valem agora */
  ev(`(function(){ S.tut=99; S.welcome=true; view='battle'; Sys.events.DATA.enabled=true; PANEL_ON.events=true;
    window.__cal=${JSON.stringify([A])}; window.__calN=0; window.__calFail=false; Sys.net=Sys.net||{};
    Sys.net.events=function(){ __calN++; return __calFail?Promise.reject(Object.assign(new Error('x'),{code:'offline'})):Promise.resolve(JSON.parse(JSON.stringify(__cal))); };
    window.__saves=0; const sv=save; save=function(){ __saves++; try{ return sv.apply(this,arguments); }catch(e){} }; return 1; })()`);
  check('módulo novo carregado (Sys.events.load, base, setCalendar) e tela ligada', ev("typeof Sys.events.load==='function'&&typeof Sys.events.base==='function'&&typeof evtLoadCal==='function'&&typeof evtBase==='function'"));

  /* ---------- 1) abrir a tela pede o calendário, sem travar ---------- */
  { const r = J(`const cal0=Sys.events.DATA.calendar===true; const ok=Panels.open('events'); const html=String(V.innerHTML||''); return {cal0:cal0,ok:ok,n:__calN,drawn:html.length>200,calNow:Sys.events.DATA.calendar===true,busy:XEVT.calBusy===true};`);
    check('abrir a tela chama Sys.events.load UMA vez e desenha na hora (não espera a rede)', r.cal0 === false && r.n === 1 && r.drawn && r.calNow === false && r.busy === true, JSON.stringify(r));
    await wait();
    const a = J(`const s0=__saves; return {cal:Sys.events.DATA.calendar===true,ids:Sys.events.DATA.events.map(e=>e.id),bases:Sys.events.DATA.events.map(e=>e.base),evcal:(S.sys.evcal||[]).map(e=>e.id),busy:XEVT.calBusy===true,saves:__saves};`);
    check('a resposta do servidor vira o calendário do módulo e fica guardada no save (S.sys.evcal), com gravação', a.cal && a.ids.join() === A.id && a.bases.join() === 'festival_eras' && a.evcal.join() === A.id && a.busy === false && a.saves >= 1, JSON.stringify(a));
    const b = J(`Screens.close(); Panels.open('events'); Panels.open('events'); const d=Panels.defs.events; for(let i=0;i<5;i++){ d.render(); if(d.tick) d.tick(); } return {n:__calN};`);
    check('reabrir logo em seguida, redesenhar e o relógio da tela não pedem de novo (um pedido por minuto)', b.n === 1, JSON.stringify(b)); }

  /* ---------- 2) a edição de id novo usa o TEMA (ev.base) ---------- */
  { const r = J(`const M=evtModel(), c=M.cur, T=Sys.evtrail; const html=String(V.innerHTML||''); const th=EVT_TH.festival_eras;
      EVT_TH.__zz={bg:'ZZ'}; const o={id:c&&c.ev.id,base:c&&c.ev.base,live:c&&c.live,st:c&&c.st,xev:XEVT.ev,name:c&&c.ev.name,
        thBase:evtTh(evtBase({id:'__zz_261120',base:'__zz'}))===EVT_TH.__zz,thId:evtTh(evtBase({id:'__zz'}))===EVT_TH.__zz,thNone:evtTh(evtBase({id:'nada_261120'}))===th,b0:evtBase(null),
        bg:html.indexOf(th.bg)>=0,nameIn:html.indexOf(c?c.ev.name:'@@')>=0,idIn:html.indexOf('data-id="${A.id}"')>=0,
        cfgSame:etCfg(c.ev.id)===etCfg('festival_eras'),cfgMod:!T||!T.DATA||!T.DATA.events||etCfg(c.ev.id)===(T.DATA.events[c.ev.id]||T.DATA.events.festival_eras||T.DATA.events.default||null)};
      delete EVT_TH.__zz; return o;`);
    check('a tela mostra a edição do calendário (id com a data) e ela está valendo', r.id === A.id && r.base === 'festival_eras' && r.live === true && r.st === 'on' && r.xev === A.id, JSON.stringify(r));
    check('arte e cores pelo TEMA: ev.base escolhe; sem ev.base vale o ev.id; tema desconhecido cai no padrão', r.thBase && r.thId && r.thNone && r.b0 === '', JSON.stringify(r));
    check('a tela desenhada usa o fundo do tema festival_eras e o nome do evento', r.bg && r.nameIn, JSON.stringify(r));
    check('trilha e chefe: a configuração da edição é a do tema (a mesma busca do módulo)', r.cfgSame && r.cfgMod, JSON.stringify(r)); }

  /* ---------- 3) pontos, missões, loja e trilha são os da EDIÇÃO atual ---------- */
  { const r = J(`const E=Sys.events, h=Sys.host; for(let i=0;i<300;i++) E.track(S,h,'kill',1); E.track(S,h,'boss',3); Panels.defs.events.render(); const M=evtModel(), L=E.list(S,h);
      let tr=null; try{ tr=Sys.evtrail&&Sys.evtrail.DATA&&Sys.evtrail.DATA.on!==false?Sys.evtrail.trail(S,h,M.cur.ev.id):null; }catch(e){ tr=null; }
      return {keys:Object.keys(S.sys.events||{}),pts:M.cur.pts,lp:L.length&&L[0].pts,lid:L.length&&L[0].id,mis:M.mis.length,misMod:(E.missions(S,h,M.cur.ev.id)||[]).length,prog:M.mis.some(m=>m.p>0),shop:M.shop.length,shopMod:(E.shop(S,h,M.cur.ev.id)||[]).length,
        tr:M.tr?M.tr.earned:null,trMod:tr?tr.earned:null,old:(E.missions(S,h,'festival_eras')||[]).some(m=>m.p>0)};`);
    check('o progresso é gravado e lido pelo id COMPLETO da edição (nada pelo id do tema)', r.keys.join() === A.id && r.lid === A.id && r.pts === r.lp && r.prog === true, JSON.stringify(r));
    check('missões, loja e trilha da tela = as do módulo para a edição atual', r.mis > 0 && r.mis === r.misMod && r.shop === r.shopMod && r.shop > 0 && r.tr === r.trMod, JSON.stringify(r));
    const t = J(`Screens.close(); Panels.open('events',{event:'festival_eras'}); const M=evtModel(); return {id:M.cur&&M.cur.ev.id};`);
    check('abrir pedindo o evento pelo TEMA (atalho antigo "festival_eras") cai na edição que está valendo', t.id === A.id, JSON.stringify(t)); }

  /* ---------- 4) edição nova: começa do zero, a tela troca sozinha ---------- */
  { const r = J(`const E=Sys.events, h=Sys.host; const pts0=evtModel().cur.pts; const q=E.setCalendar(${JSON.stringify([B2])},S); const d=Panels.defs.events; if(d.tick) d.tick(); d.render(); const M=evtModel(), html=String(V.innerHTML||'');
      return {q:q&&q.ok,pts0:pts0,id:M.cur&&M.cur.ev.id,base:M.cur&&M.cur.ev.base,pts:M.cur&&M.cur.pts,xev:XEVT.ev,live:M.cur&&M.cur.live,mis0:M.mis.every(m=>!(m.p>0)&&!m.claimed),bg:html.indexOf(EVT_TH.festival_eras.bg)>=0,evcal:(S.sys.evcal||[]).map(e=>e.id)};`);
    check('edição de id novo com o mesmo tema: a tela passa para ela (não guarda o id antigo) e mantém a arte do tema', r.q && r.id === B2.id && r.base === 'festival_eras' && r.xev === B2.id && r.live === true && r.bg && r.evcal.join() === B2.id, JSON.stringify(r));
    check('edição nova começa do zero: pontos e missões zerados (a anterior tinha pontos)', r.pts0 >= 0 && r.pts === 0 && r.mis0 === true, JSON.stringify(r)); }

  /* ---------- 5) sem rede: a tela abre igual, com o calendário guardado ---------- */
  { ev('__calFail=true; XEVT.calT=0; Screens.close(); 1');
    const r = J(`let err=''; try{ Panels.open('events'); }catch(e){ err=String(e&&e.message||e); } return {err:err,n:__calN,drawn:String(V.innerHTML||'').length>200};`); await wait();
    const a = J(`const M=evtModel(); return {busy:XEVT.calBusy===true,id:M.cur&&M.cur.ev.id,ids:Sys.events.DATA.events.map(e=>e.id)};`);
    check('falha de rede no calendário: a tela abre, nada trava e a edição guardada continua', !r.err && r.n === 2 && r.drawn && a.busy === false && a.id === B2.id && a.ids.join() === B2.id, JSON.stringify([r, a]));
    const z = J(`const L=Sys.events.load; Sys.events.load=function(){ throw new Error('boom'); }; XEVT.calT=0; let err=''; try{ Screens.close(); Panels.open('events'); }catch(e){ err=String(e&&e.message||e); } Sys.events.load=L;
      const L2=Sys.events.load; delete Sys.events.load; XEVT.calT=0; try{ Screens.close(); Panels.open('events'); }catch(e){ err+=String(e&&e.message||e); } Sys.events.load=L2; return {err:err,busy:XEVT.calBusy===true,drawn:String(V.innerHTML||'').length>200};`);
    check('módulo sem load (versão antiga) ou load que estoura: a tela abre do mesmo jeito', !z.err && z.busy === false && z.drawn, JSON.stringify(z)); }

  console.log((fail ? 'FALHOU' : 'OK') + ': ' + (n - fail) + '/' + n + ' (tela de Eventos com o calendário de edições)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.log('  FALHA exceção no teste · ' + (e && e.stack || e)); process.exit(1); });
