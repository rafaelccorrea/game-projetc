'use strict';
/* TESTE DA RECUPERAÇÃO SOZINHA DO PRÉ-CARREGADOR (js/preload.js), sem navegador. Rodar: node test/e2e/preloadrec.js
   Rede, imagens e relógio são de mentira (o relógio é virtual: nada espera de verdade). Cenários:
     1. rede FORA: o arquivo falha nas 3 tentativas (com espera crescente entre elas), o aviso "Sem conexão" aparece e o carregador volta a tentar
        sozinho com espera crescente; pedido novo com a rede fora falha de uma vez (não segura a fila);
     2. a rede VOLTA: na rodada seguinte o arquivo carrega, o aviso some e Preload.onRecover é chamado;
     3. arquivo que NÃO EXISTE (404): falha definitiva, sem aviso e sem insistir (quem desenha usa a reserva, como antes);
     4. evento 'online' do aparelho: tenta na hora, sem esperar a rodada;
     5. tela de carregamento aberta: a recuperação sozinha espera (o aviso e o "Tentar de novo" são os dela). */
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
function world() {
  let now = 0, seq = 0; const timers = []; const W = { net: 'down', missing: new Set(), reqs: [], heads: [], listeners: {}, docL: {}, els: [] };
  const setT = (f, ms) => { const t = { id: ++seq, at: now + (ms || 0), f }; timers.push(t); return t.id; }, clrT = id => { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); };
  function Image() { const im = this; im.naturalWidth = 0; Object.defineProperty(im, 'src', { set(u) { W.reqs.push(u); setT(() => { if (W.net === 'up' && !W.missing.has(u)){ im.naturalWidth = 8; im.onload && im.onload(); } else im.onerror && im.onerror(); }, 20); } }); }
  const fetch = (u, o) => new Promise((ok, no) => { if (o && o.method === 'HEAD') W.heads.push(u); setT(() => { if (W.net !== 'up') return no(new Error('rede'));
    const miss = W.missing.has(u); ok({ ok: !miss, status: miss ? 404 : 200, json: () => Promise.resolve({ a: 1 }) }); }, 20); });
  const mkEl = () => ({ style: {}, setAttribute() {}, textContent: '' });
  const sb = { console: { warn() {}, error: console.error, log() {} }, URLSearchParams, Promise, Map, Set, Math, Date, Error, JSON,
    location: { search: '' }, performance: { now: () => now }, setTimeout: setT, clearTimeout: clrT, setInterval: (f, ms) => { const id = ++seq; const go = () => { timers.push({ id, at: now + ms, f: () => { f(); go(); } }); }; go(); return id; }, clearInterval: clrT,
    requestAnimationFrame: f => setT(() => f(now), 16), Image, fetch,
    document: { hidden: false, addEventListener(n, f) { (W.docL[n] = W.docL[n] || []).push(f); }, removeEventListener() {}, createElement() { const e = mkEl(); W.els.push(e); return e; }, body: { appendChild() {} }, getElementById: () => null },
    addEventListener(n, f) { (W.listeners[n] = W.listeners[n] || []).push(f); } };
  sb.window = sb; vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(R, 'js/preload.js'), 'utf8'), sb, { filename: 'preload.js' });
  /* avança o relógio virtual: dispara os temporizadores em ordem e deixa as promessas resolverem entre eles */
  W.run = async ms => { const end = now + ms; for (let guard = 0; guard < 200000; guard++) { await new Promise(r => setImmediate(r)); timers.sort((a, b) => a.at - b.at || a.id - b.id); const t = timers[0]; if (!t || t.at > end) break; timers.shift(); now = Math.max(now, t.at); t.f(); } now = end; await new Promise(r => setImmediate(r)); };
  W.P = sb.Preload; W.sb = sb; W.now = () => now; return W;
}
const out = []; const ok = (name, cond, extra) => { assert(cond, name + (extra ? ' — ' + extra : '')); out.push(name); };
(async () => {
  /* 1) rede fora */
  let W = world(), P = W.P; let rec = 0; P.onRecover(n => { rec += n; });
  const e = P.get('assets/a.png'); await W.run(250);
  ok('1ª tentativa falhou e a 2ª espera (ainda sem falha definitiva)', !e.fail && W.reqs.length === 1, 'pedidos=' + W.reqs.length);
  await W.run(3000); ok('3 tentativas com espera crescente, depois falha', e.fail && W.reqs.length === 3, 'pedidos=' + W.reqs.length);
  await W.run(1000); ok('rede fora confirmada: aviso na tela', P.netDown === true && P.failing === 1 && W.els.length === 1 && W.els[0].style.display === 'block' && /Sem conexão/.test(W.els[0].textContent));
  const n0 = W.reqs.length; const e2 = P.get('assets/b.png'); await W.run(100); ok('pedido novo com a rede fora falha de uma vez (1 pedido só)', e2.fail && W.reqs.length === n0 + 1);
  const h0 = W.heads.length; await W.run(8000 + 15000 + 500); ok('insiste sozinho com espera crescente (8 s, depois 15 s; uma sonda por rodada)', W.heads.length - h0 === 2, 'sondas=' + (W.heads.length - h0)); ok('sem a rede nada foi pedido de novo', W.reqs.length === n0 + 1);
  /* 2) a rede volta */
  W.net = 'up'; await W.run(31000); ok('rede de volta: os dois arquivos carregam sozinhos', e.ok && !e.fail && e2.ok && P.failing === 0, 'falhando=' + P.failing);
  ok('aviso some e onRecover avisa o jogo', P.netDown === false && W.els[0].style.display === 'none' && rec === 2, 'rec=' + rec);
  const h1 = W.heads.length; await W.run(120000); ok('tudo carregado: para de sondar', W.heads.length === h1);
  /* 3) arquivo que não existe */
  W = world(); P = W.P; W.net = 'up'; W.missing.add('assets/nao.png'); const m = P.get('assets/nao.png'); await W.run(5000);
  ok('404: falha definitiva, sem aviso, sem insistir', m.fail && m.gone === true && P.netDown === false && P.failing === 0 && W.els.length === 0); const r3 = W.reqs.length, h3 = W.heads.length; await W.run(120000); ok('404: nenhum pedido a mais em 2 min', W.reqs.length === r3 && W.heads.length === h3);
  /* 4) evento online */
  W = world(); P = W.P; const o = P.get('assets/c.png'); await W.run(4000); ok('(preparo) em falha de rede', o.fail && P.netDown); await W.run(4000 + 8000 + 15000 + 30000);   /* já na espera de 60 s */
  W.net = 'up'; (W.listeners.online || []).forEach(f => f()); await W.run(1500); ok("evento 'online': tenta na hora (sem esperar os 60 s)", o.ok && !P.netDown);
  /* 5) tela de carregamento aberta */
  W = world(); P = W.P; W.sb.LD = { el: {}, closed: false }; vm.runInContext('var LD = window.LD;', W.sb); const l = P.get('assets/d.png'); await W.run(20000);
  ok('carregamento aberto: sem aviso próprio e sem sondar', l.fail && W.els.length === 0 && W.heads.length === 0, 'sondas=' + W.heads.length);
  W.net = 'up'; vm.runInContext('LD.closed = true;', W.sb); await W.run(4000); ok('carregamento fechado: a recuperação segue e o arquivo carrega', l.ok);
  for (const x of out) console.log('  OK    ' + x); console.log('RECUPERAÇÃO DO PRÉ-CARREGADOR OK (' + out.length + ' verificações)');
})().catch(er => { console.error(String(er && er.message || er)); process.exit(1); });
