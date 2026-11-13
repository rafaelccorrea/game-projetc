'use strict';
/* ================= PRÉ-CARREGADOR (Engenheiro 5; ordem do dono: nada aparece pela metade) =================
   UM CACHE SÓ por URL: as imagens daqui são as MESMAS instâncias que o sheetLoad (js/stage.js), o IMG (js/battle.js), a asa e as telas desenham.
   Imagem = pronta quando DECODIFICADA (img.decode(); onde não existir, onload). .json = pronto quando baixado e interpretado.
   API FECHADA (QA e painéis usam):
     Preload.ready(urls, {timeout}) → Promise<{ok: boolean, failed: string[]}>   nunca rejeita; timeout em ms para a lista inteira (padrão 30000)
     Preload.has(url) → boolean                                                 já decodificada / interpretada
   Extras: Preload.get(url) → entrada {url, img|data, ok, fail, p} (dispara a carga) · Preload.image(url) → imagem pronta ou null · Preload.json(url) → objeto ou null
     Preload.retry(urls) → tenta de novo as que falharam · Preload.drop(url) → solta do cache (memória) · Preload.track(promessa|urls) / Preload.progress
     {done, total, failed} → lote da tela de carregamento · Preload.reset() zera o lote · Preload.all(promessas, ms) → espera com tempo-limite.
   Cada arquivo: até TRIES tentativas com FILE_MS de tempo-limite cada; falhou em todas = entra na lista de falhas, avisa no console UMA vez e o jogo segue com a
   reserva de sempre (quem desenha confere ok). Sem custo por quadro: tudo é promessa; has() é uma leitura de mapa.
   TESTE (só com ?debug=1): &lento=N atrasa cada arquivo N ms (até 6 de cada vez, como o navegador) · &frio=1 acrescenta um carimbo à URL (carga sem cache). */
(function (W) {
  const QS = new URLSearchParams(location.search), DBG = /[?&]debug=1/.test(location.search);
  const SLOW = DBG ? Math.max(0, +QS.get('lento') || 0) : 0, COLD = DBG && QS.get('frio') === '1' ? 'cb=' + Date.now() : '';
  const FILE_MS = 12000, TRIES = 3, LIST_MS = 30000, PAR = 6;
  const C = new Map();
  const isJson = u => /\.json(\?|$)/i.test(u);
  const real = u => COLD ? u + (u.indexOf('?') < 0 ? '?' : '&') + COLD : u;
  /* fila de teste: PAR arquivos por vez, cada um segura SLOW ms */
  let run = 0; const Q = [];
  const slot = () => SLOW ? new Promise(ok => { const go = () => { run++; setTimeout(() => { run--; ok(); if (Q.length) Q.shift()(); }, SLOW); }; if (run < PAR) go(); else Q.push(go); }) : null;
  const limit = (p, ms) => new Promise(ok => { let d = false; const t = setTimeout(() => { if (!d){ d = true; ok(false); } }, ms); p.then(v => { if (!d){ d = true; clearTimeout(t); ok(v); } }, () => { if (!d){ d = true; clearTimeout(t); ok(false); } }); });
  function oneImg(e) { return new Promise(ok => { const im = new Image(); let done = false; const fin = v => { if (done) return; done = true; if (v) e.img = im; ok(v); };
    im.onerror = () => fin(false);
    im.onload = () => { if (typeof im.decode === 'function') im.decode().then(() => fin(true), () => fin(im.naturalWidth > 0)); else fin(true); };   /* decode falhou mas a imagem veio inteira: vale (reserva do onload) */
    im.src = real(e.url); }); }
  function oneJson(e) { return fetch(real(e.url), { cache: COLD ? 'reload' : 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j && typeof j === 'object'){ e.data = j; return true; } return false; }); }
  function load(e) { let n = 0; const go = () => { n++; const w = slot(), job = () => limit(e.json ? oneJson(e) : oneImg(e), FILE_MS);
      return (w ? w.then(job) : job()).then(v => { if (v){ e.ok = true; e.fail = false; return e; } if (n < TRIES) return go();
        e.fail = true; if (!e.warned){ e.warned = true; console.warn('Preload: não carregou depois de ' + TRIES + ' tentativas: ' + e.url); } return e; }); };
    e.fail = false; return e.p = go(); }
  function get(url) { let e = C.get(url); if (!e){ e = { url, json: isJson(url), img: null, data: null, ok: false, fail: false, p: null, warned: false }; C.set(url, e); load(e); } return e; }
  const has = url => { const e = C.get(url); return !!(e && e.ok); };
  const image = url => { const e = get(url); return e.ok ? e.img : null; };
  const json = url => { const e = get(url); return e.ok ? e.data : null; };
  function all(ps, ms) { return limit(Promise.all(ps).then(() => true), ms > 0 ? ms : LIST_MS); }
  function ready(urls, opt) { const L = (Array.isArray(urls) ? urls : [urls]).filter(u => typeof u === 'string' && u), es = L.map(get);
    return all(es.map(e => e.p), opt && opt.timeout).then(() => { const failed = es.filter(e => !e.ok).map(e => e.url); return { ok: !failed.length, failed }; }, () => ({ ok: false, failed: L })); }
  function retry(urls) { const L = (urls || [...C.keys()]).filter(u => { const e = C.get(u); return e && e.fail; }); L.forEach(u => load(C.get(u))); return ready(L); }
  function drop(url) { const e = C.get(url); if (e && (e.ok || e.fail)){ C.delete(url); return true; } return false; }
  /* lote da tela de carregamento: progresso REAL = prontos ÷ total */
  const B = { done: 0, total: 0, failed: [] };
  function track(x, label) { if (Array.isArray(x)){ x.forEach(u => track(u)); return; }
    B.total++; const p = typeof x === 'string' ? get(x).p.then(e => e.ok) : Promise.resolve(x).then(v => v !== false && v !== null, () => false), name = typeof x === 'string' ? x : (label || 'tarefa');
    limit(p, FILE_MS * TRIES + 2000).then(v => { B.done++; if (!v) B.failed.push(name); }); }
  const reset = () => { B.done = 0; B.total = 0; B.failed = []; };
  W.Preload = { ready, has, get, image, json, retry, drop, track, reset, all, limit, get progress() { return { done: B.done, total: B.total, failed: B.failed.slice() }; }, slow: SLOW, cold: !!COLD, size: () => C.size };
})(window);
