'use strict';
/* TELA DE EVENTOS com os 3 TEMAS NOVOS (js/p_events.js + Sys.events.setCalendar; docs/EVENTOS_TEMAS.md).
   Sem navegador: node test/e2e/eventos_temas_tela.js
   Sobe o jogo no sandbox e, para cada tema (cacada_chefes, semana_forja, festa_pets), põe uma ocorrência que já começou (sem guardar no save),
   abre a tela e confere: desenha sem erro, usa as cores e o mapa DO TEMA (não os do Festival), mostra o nome dos pontos (ev.points) e o chefe do
   Sys.evtrail, e a moldura do grande prêmio sai na cor do tema. Só lê arquivos do jogo. Código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }), { ev } = G;
  const J = code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  const DAY = 86400000, now = Date.now(), ymd = t => { const d = new Date(t - 3 * 3600000), p = x => String(x).padStart(2, '0'); return p(d.getUTCFullYear() % 100) + p(d.getUTCMonth() + 1) + p(d.getUTCDate()); };
  ev(`(function(){ S.tut=99; S.welcome=true; view='battle'; Sys.events.DATA.enabled=true; Sys.evtrail.DATA.on=true; PANEL_ON.events=true;
    Sys.net=Sys.net||{}; Sys.net.events=function(){ return Promise.reject(Object.assign(new Error('x'),{code:'offline'})); }; return 1; })()`);
  const T = { cacada_chefes: { bd: '#ffb04a', map: 'assets/map/era3.jpg', frame: '#d8362a' }, semana_forja: { bd: '#ffd27a', map: 'assets/map/era4.jpg', frame: '#e0701a' }, festa_pets: { bd: '#ffe07a', map: 'assets/map/era1.jpg', frame: '#22a86a' } };
  for (const base of Object.keys(T)) {
    const id = base + '_' + ymd(now - DAY), cal = [{ id, start: now - DAY, end: now + 13 * DAY }];
    const r = J(`let err=''; try{ try{ Panels.close&&Panels.close(); }catch(e){} Sys.events.setCalendar(${JSON.stringify(cal)},null); XEVT.ev=null; XEVT.tab=2; Panels.open('events'); }catch(e){ err=String(e&&e.stack||e); }
      let html=''; const tabs=[]; for(const t of [2,0,1]){ try{ XEVT.tab=t; render(); const h=String(V.innerHTML||''); tabs.push(h.length); html+=h; }catch(e){ err+=' aba '+t+': '+String(e&&e.stack||e); } } const M=evtModel(); const c=M&&M.cur; let boss=null; try{ boss=c?Sys.evtrail.boss(S,evtHost(),c.ev.id):null; }catch(e){}
      const big=M&&M.tr?M.tr.milestones.filter(m=>m.reward&&m.reward.frame).map(m=>m.reward.frame):[];
      const fr=evtFrame(big[0]); return {err:err,len:html.length,tabs:tabs,hasFrameSvg:html.indexOf(fr)>=0,id:c&&c.ev.id,base:c&&c.ev.base,name:c&&c.ev.name,pts:c&&c.ev.points,live:!!(c&&c.live),
        hasName:!!(c&&html.indexOf(evtEsc(c.ev.name))>=0),hasBd:html.indexOf(${JSON.stringify(T[base].bd)})>=0,hasMap:html.indexOf(${JSON.stringify(T[base].map)})>=0,
        festMap:html.indexOf('assets/map/world.jpg')>=0,festTok:html.indexOf('#8a4dff')>=0,frame:big,hasFrame:html.indexOf(${JSON.stringify(T[base].frame)})>=0,
        boss:boss&&boss.name,hasBoss:!!(boss&&boss.name&&html.indexOf(evtEsc(boss.name))>=0),hasPts:!!(c&&c.ev.points&&html.indexOf(evtEsc(c.ev.points))>=0),undef:/undefined|NaN|\\[object/.test(html)};`);
    const d = JSON.stringify(r);
    check(base + ': abre sem erro nas 3 abas (Loja, Trilha, Chefe) e é o evento atual, ativo', !r.err && r.tabs.length === 3 && r.tabs.every(x => x > 500) && r.id === id && r.base === base && r.live, d);
    check(base + ': nome do evento na tela', r.hasName, d);
    check(base + ': cores e mapa do tema, nada do Festival', r.hasBd && r.hasMap && !r.festMap, d);
    check(base + ': moldura do grande prêmio na cor do tema', r.frame.length > 0 && r.hasFrame && r.hasFrameSvg, d);
    check(base + ': chefe do Sys.evtrail aparece pelo nome', r.hasBoss, d);
    check(base + ': sem "undefined", "NaN" ou "[object" na tela', !r.undef, d);
  }
  console.log((fail ? 'FALHOU: ' + fail + ' de ' : 'OK: ' + n + '/') + n + ' (tela de Eventos com os 3 temas novos)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
