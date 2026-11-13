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
   TESTE (só com ?debug=1): &falha=<trecho> força a falha dos arquivos com esse trecho na URL (1 rodada; &falhas=N rodadas) · &lento=N atrasa cada arquivo N ms (até 6 de cada vez, como o navegador) · &frio=1 acrescenta um carimbo à URL (carga sem cache). */
(function (W) {
  const QS = new URLSearchParams(location.search), DBG = /[?&]debug=1/.test(location.search);
  const SLOW = DBG ? Math.max(0, +QS.get('lento') || 0) : 0, COLD = DBG && QS.get('frio') === '1' ? 'cb=' + Date.now() : '';
  /* CHAVE ÚNICA (ordem do PO, 13/11 01h50): PRELOAD_NEW = false por padrão → caminho de carga ANTIGO (imagem pronta no onload, sem decode(), sem fila; a tela de
     carregamento usa a lista de antes e libera em 15 s: js/loading.js). O pré-carregador novo só liga com ?debug=1&carga=nova, até passar nos quatro casos
     (save novo, save antigo que volta, rede lenta, aba em segundo plano). */
  const NEW = DBG && QS.get('carga') === 'nova'; W.PRELOAD_NEW = NEW;
  const FILE_MS = 12000, TRIES = 3, LIST_MS = 30000, PAR = 8, STALL_MS = 15000, TASK_MS = 38000, DECODE_MS = 1500;
  /* &falha=<trecho da URL> (só debug): os arquivos cuja URL contém o trecho falham na 1ª rodada (as 3 tentativas) e carregam no "Tentar de novo"; &falhas=N = falham N rodadas */
  const FAIL = DBG ? (QS.get('falha') || '') : '', FAILN = Math.max(1, +QS.get('falhas') || 1), HANG = DBG ? (QS.get('trava') || '') : '';
  const C = new Map();
  const isJson = u => /\.json(\?|$)/i.test(u);
  const real = u => COLD ? u + (u.indexOf('?') < 0 ? '?' : '&') + COLD : u;
  /* FILA (Engenheiro 7): no máximo PAR arquivos EM PARALELO; os outros esperam na fila e o prazo de cada um só começa quando ele sai dela (antes o prazo
     contava a espera: com rede lenta os últimos da lista "falhavam" sem nunca terem sido pedidos). No teste (&lento=N) cada arquivo segura a vaga N ms antes de pedir. */
  let run = 0; const Q = [];
  /* BATIMENTO (só enquanto há carga em andamento): a página está DESENHANDO? (visível E com quadro nos últimos 700 ms). Visto aqui e no QA: janela do Chrome
     coberta/estrangulada não avisa por document.hidden, mas não produz quadros e o img.decode() fica sem resposta: com 8 vagas presas nisso a fila inteira
     parava ("0%", depois "nada progrediu por 15 s"). Sem quadros, a imagem vale no onload. Nada aqui é necessário para a carga andar: só escolhe decode ou onload. */
  let beat = 0, beatGap = 1e9, beatOn = false;   /* beatGap = intervalo entre os dois últimos quadros: janela estrangulada entrega 1 quadro por segundo, o que não basta para o decode */
  const NORAF = DBG && QS.get('semraf') === '1';   /* ?debug=1&semraf=1: o carregador inteiro sem nenhum quadro (como em segundo plano) */
  const beatGo = () => { if (beatOn || NORAF) return; beatOn = true; const f = () => { const n = performance.now(); beatGap = n - beat; beat = n; if (run > 0 || Q.length) requestAnimationFrame(f); else { beatOn = false; beat = 0; } }; requestAnimationFrame(f); };
  const live = () => !document.hidden && performance.now() - beat < 700 && beatGap < 300;
  const acquire = () => new Promise(ok => { const go = () => { run++; if (NEW) beatGo(); if (SLOW) setTimeout(ok, SLOW); else ok(); }; if (run < PAR || (!NEW && !SLOW)) go(); else Q.push(go); });   /* caminho antigo: sem fila (tudo de uma vez, como antes) */
  const release = () => { run--; if (Q.length) Q.shift()(); };
  /* PROGRESSO: lastProg = instante do último arquivo/tarefa concluído (ou da volta da página ao primeiro plano). Nada "estoura por tempo total": um pedido só é
     abandonado quando passou do prazo mínimo dele E nada no carregador progrediu nos últimos STALL_MS (rede parada de verdade). Página escondida não conta. */
  let lastProg = performance.now(); const prog = () => { lastProg = performance.now(); };
  const idle = () => document.hidden ? 0 : performance.now() - lastProg;
  const stall = (p, minMs) => new Promise(ok => { const t0 = performance.now(); let d = false; const fin = v => { if (d) return; d = true; clearInterval(iv); ok(v); };
    const iv = setInterval(() => { if (document.hidden) return; const n = performance.now(); if (n - t0 > minMs && n - lastProg > STALL_MS) fin(false); }, 1000);
    Promise.resolve(p).then(fin, () => fin(false)); });
  /* tempo-limite que só conta com a página VISÍVEL (Engenheiro 7): aba em segundo plano / app minimizado atrasa temporizadores e decodificação; visto: 34 arquivos
     davam "não carregou" sem falha nenhuma de rede. Se a página ficou escondida em algum momento da espera, o prazo recomeça quando ela volta. */
  let hidAt = document.hidden ? Infinity : -1;
  document.addEventListener('visibilitychange', () => { hidAt = document.hidden ? Infinity : performance.now(); prog(); });
  const limit = (p, ms) => new Promise(ok => { let d = false, t = 0; const fin = v => { if (!d){ d = true; clearTimeout(t); ok(v); } };
    const arm = () => { const t0 = performance.now(); t = setTimeout(() => { if (d) return;
        if (document.hidden){ const on = () => { if (!document.hidden){ document.removeEventListener('visibilitychange', on); if (!d) arm(); } }; document.addEventListener('visibilitychange', on); }
        else if (hidAt >= t0) arm(); else fin(false); }, ms); };
    arm(); Promise.resolve(p).then(fin, () => fin(false)); });
  function oneImg(e) { return new Promise(ok => { const im = new Image(); let done = false; const fin = v => { if (done) return; done = true; if (v) e.img = im; ok(v); };
    im.onerror = () => fin(false);
    im.onload = () => { if (!NEW || !live()) fin(im.naturalWidth > 0);  /* sem quadros (segundo plano, janela coberta) o decode() pode nunca responder: a imagem inteira já vale */
      else if (typeof im.decode === 'function'){ im.decode().then(() => fin(true), () => fin(im.naturalWidth > 0)); setTimeout(() => fin(im.naturalWidth > 0), DECODE_MS); } else fin(true); };   /* decode falhou ou não respondeu em DECODE_MS (janela sem desenhar), mas a imagem veio inteira: vale (reserva do onload) */
    im.src = real(e.url); }); }
  function oneJson(e) { return fetch(real(e.url), { cache: COLD ? 'reload' : 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j && typeof j === 'object'){ e.data = j; return true; } return false; }); }
  function load(e) { let n = 0; e.rounds = (e.rounds || 0) + 1; const forced = FAIL && e.url.indexOf(FAIL) >= 0 && e.rounds <= FAILN;
    const go = () => { n++; const hang = HANG && n === 1 && e.rounds === 1 && e.url.indexOf(HANG) >= 0;   /* &trava=<trecho> (só debug): a 1ª tentativa desses arquivos nunca responde (rede parada) */
      return (forced ? Promise.resolve(false) : stall(hang ? new Promise(() => {}) : e.json ? oneJson(e) : oneImg(e), FILE_MS)).then(v => { if (v){ e.ok = true; e.fail = false; return e; } if (n < TRIES) return go();
        e.fail = true; if (!e.warned){ e.warned = true; console.warn('Preload: não carregou depois de ' + TRIES + ' tentativas: ' + e.url); } return e; }); };
    const end = () => { release(); prog(); return e; };
    e.fail = false; return e.p = acquire().then(go).then(end, () => { e.fail = true; return end(); }); }
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
  const B = { done: 0, total: 0, failed: [], gen: 0, open: [] };   /* open = nomes do que ainda não terminou (arquivo ou tarefa): vai no aviso de "parou" */
  /* arquivo: termina quando o carregador dele termina (as tentativas e a regra de "parado" são do load). Tarefa (cenário vivo, fontes): só é abandonada depois
     de TASK_MS E com o carregador parado. Um reset() no meio descarta o que ainda estava chegando do lote anterior (gen). */
  function track(x, label) { if (Array.isArray(x)){ x.forEach(u => track(u)); return; }
    B.total++; const g = B.gen, isU = typeof x === 'string', name = isU ? x : (label || 'tarefa'); B.open.push(name);
    const p = isU ? get(x).p.then(e => e.ok) : stall(Promise.resolve(x).then(v => v !== false && v !== null, () => false), TASK_MS);
    const t0 = performance.now(); p.then(v => { if (g !== B.gen) return; B.done++; prog(); { const i = B.open.indexOf(name); if (i >= 0) B.open.splice(i, 1); } if (!v) B.failed.push(name); if (DBG) TL.push([name, Math.round(t0), Math.round(performance.now())]); }); }
  const TL = [];   /* só debug: [nome, entrou, terminou] em ms da página (Preload.timeline) */
  const reset = () => { B.gen++; B.done = 0; B.total = 0; B.failed = []; B.open = []; prog(); };
  W.Preload = { ready, has, get, image, json, retry, drop, track, reset, all, limit, get progress() { return { done: B.done, total: B.total, failed: B.failed.slice() }; },
    get idle() { return idle(); }, get pending() { return B.open.slice(); }, get live() { return live(); }, timeline: TL, stallMs: STALL_MS, slow: SLOW, cold: !!COLD, size: () => C.size };
})(window);
