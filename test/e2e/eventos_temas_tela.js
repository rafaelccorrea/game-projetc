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
    Sys.net=Sys.net||{}; Sys.net.events=function(){ return Promise.reject(Object.assign(new Error('x'),{code:'offline'})); };
    window.__art0=JSON.stringify(EVT_ART); for(const k of Object.keys(EVT_ART)) delete EVT_ART[k];   /* os casos abaixo partem da tabela vazia (desenho por código); a tabela de verdade é conferida aqui */
    return 1; })()`);
  { const fs = require('fs'), path = require('path'), art = JSON.parse(ev('window.__art0')), bad = [];
    for (const b of Object.keys(art)) for (const k of Object.keys(art[b])) { const f = path.join(__dirname, '../../assets/events', b, k === 'bg' ? 'bg.jpg' : k + '.png'); if (!fs.existsSync(f)) bad.push(b + '/' + k); }
    check('tabela EVT_ART do jogo: toda peça ligada existe em assets/events/', bad.length === 0, bad.join(', ')); }
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
  /* ---------- ARTE PINTADA POR TEMA (EVT_ART em js/p_events.js): nasce vazia; ligada (aqui só em memória) troca fundo, ícone, ficha dos pontos e moldura ---------- */
  { const base = 'cacada_chefes', dir = 'assets/events/' + base + '/';
    const cal = [{ id: base + '_' + ymd(now - DAY), start: now - DAY, end: now + 13 * DAY }, { id: 'festa_pets_' + ymd(now + 20 * DAY), start: now + 20 * DAY, end: now + 34 * DAY }];   /* dois eventos: a lista de eventos aparece */
    const r = J(`const clk=h=>String(h).replace(/<span id="pz_hd">[^<]*<\\/span><span id="pz_sec">[^<]*<\\/span>/g,'').replace(/role="timer" aria-label="[^"]*"/g,'');
      const draw=()=>{ let h=''; for(const t of [2,0,1]){ XEVT.tab=t; render(); h+=clk(V.innerHTML); } return h; };
      const o={err:''}; try{ o.vazia=Object.keys(EVT_ART).length===0;
        try{ Panels.close&&Panels.close(); }catch(e){} Sys.events.setCalendar(${JSON.stringify(cal)},null); XEVT.ev=null; Panels.open('events');
        draw();   /* o primeiro desenho depois de abrir leva a classe da animação de entrada: a comparação usa o segundo */
        const h0=draw(); o.semArte=h0.indexOf('assets/events/')<0&&h0.indexOf('evtArtFail')<0&&h0.indexOf('data-art')<0; o.lista0=evtArtList().length; o.tok0=h0.indexOf('class="pz-tok" width="32" height="32" viewBox')>=0;
        const M0=evtModel(), big=M0.tr.milestones.filter(m=>m.reward&&m.reward.frame).map(m=>m.reward.frame), fr=evtFrame(big[0]); o.frame0=h0.indexOf(fr)>=0;
        EVT_ART.${base}={bg:1,icon:1,points:1,frame:1}; Panels.open('events');
        const h1=draw(); o.lista=evtArtList(); o.pre=evtArtPre();
        o.n={}; for(const f of ['bg.jpg','icon.png','points.png','frame.png']) o.n[f]=h1.split('src="${dir}'+f+'"').length-1;
        const imgs=h1.match(/<img [^>]*data-art="[^"]*"[^>]*>/g)||[]; o.imgs=imgs.length; o.reserva=imgs.every(t=>t.indexOf('onerror="evtArtFail(this)"')>=0&&t.indexOf(' alt=""')>=0); o.outro=h1.indexOf('assets/events/festa_pets/')>=0;
        o.tok1=h1.indexOf('class="pz-tok" width="32" height="32" viewBox')>=0; o.frame1=h1.indexOf(fr)>=0; o.veu=h1.indexOf('class="pz-bgv"')>=0&&h1.indexOf('class="pz-bgi"')>=0; o.nome=h1.indexOf(evtEsc(M0.cur.ev.name))>=0;
        o.undef=/undefined|NaN|\\[object/.test(h1);
        /* reserva: cada peça que falha volta ao desenho por código; com as quatro em falha a tela sai igual à de antes de ligar */
        o.f1=evtArtFail({getAttribute:()=>'${dir}points.png'}); o.f1b=evtArtFail({getAttribute:()=>'${dir}points.png'}); const h2=draw(); o.soPontos=h2.indexOf('${dir}points.png')<0&&h2.indexOf('${dir}frame.png')>=0&&h2.indexOf('class="pz-tok" width="32" height="32" viewBox')>=0;
        for(const f of ['bg.jpg','icon.png','frame.png']) evtArtFail({getAttribute:()=>'${dir}'+f}); const h3=draw(); o.igual=h3===h0; o.lista3=evtArtList().length;
        /* abrir a tela de novo esquece as falhas (o pacote pode ter chegado) */
        Panels.open('events'); o.denovo=draw().indexOf('${dir}bg.jpg')>=0;
        EVT_ART.${base}={points:1}; XEVT.artBad={}; const h4=draw(); o.parcial=h4.indexOf('${dir}points.png')>=0&&h4.indexOf('${dir}bg.jpg')<0&&h4.indexOf('${dir}icon.png')<0&&h4.indexOf('${dir}frame.png')<0&&h4.indexOf(fr)>=0;
      }catch(e){ o.err=String(e&&e.stack||e); } delete EVT_ART.${base}; XEVT.artBad={}; return o;`);
    const d = JSON.stringify(r);
    check('arte: a tabela EVT_ART nasce vazia e, vazia, a tela não cita assets/events nem a reserva', !r.err && r.vazia && r.semArte && r.lista0 === 0 && r.tok0 && r.frame0, d);
    check('arte ligada: os quatro caminhos do tema aparecem (fundo 1x por desenho, ícone no banner e na lista, ficha dos pontos, moldura)', !r.err && r.n['bg.jpg'] === 3 && r.n['icon.png'] === 6 && r.n['points.png'] >= 3 && r.n['frame.png'] >= 1 && !r.undef && r.nome, d);
    check('arte ligada: a ficha e a moldura de código saem, o fundo leva o véu de leitura e o tema não ligado fica como antes', !r.tok1 && !r.frame1 && r.veu && !r.outro, d);
    check('arte ligada: toda <img> nova tem reserva (onerror=evtArtFail) e alt vazio', r.imgs > 0 && r.reserva, d);
    check('arte ligada: as peças entram na lista de pré-carga da tela', Array.isArray(r.lista) && r.lista.length === 4 && r.lista.every(p => p.indexOf(dir) === 0) && Array.isArray(r.pre) && r.pre.length === 4, d);
    check('reserva: a peça que falha volta ao desenho por código (uma falha marca uma vez); as quatro em falha = tela igual à de antes', r.f1 === true && r.f1b === false && r.soPontos && r.igual && r.lista3 === 0, d);
    check('reserva: abrir a tela de novo tenta as peças outra vez; ligar só uma peça troca só ela', r.denovo && r.parcial, d);
  }
  console.log((fail ? 'FALHOU: ' + fail + ' de ' : 'OK: ' + n + '/') + n + ' (tela de Eventos com os 3 temas novos)');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
