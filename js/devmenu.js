'use strict';
/* ================= MENU DE DEPURAÇÃO ESCONDIDO: SÓ NO BUILD DEV (pedido do PO: o app DEV não tem barra de endereço para abrir ?debug=1) =================
   Abre com 5 toques seguidos (em até 3 s) no número da versão, no rodapé de Configurações (js/p_cfg.js chama window.DevMenu.tap()).
   SINAL DE "É O DEV" (os três juntos): página servida por http (não https), em localhost ou 127.0.0.1, na porta 8080, e STORE_BUILD desligado.
     - app "Eonbound DEV" (br.com.intellisys.eonbound.dev): carrega de http://localhost:8080 (server.url do capacitor.config do sabor dev);
     - navegador de mesa no servidor de desenvolvimento (node tools/dev-server.js, porta 8080);
     - app normal e versão da loja: https://localhost, sem porta → este arquivo SAI na primeira linha: não cria window.DevMenu, não cria elemento,
       não põe estilo nem ouvinte; os 5 toques não fazem nada (o gancho do p_cfg.js só chama DevMenu.tap se ele existir).
   O QUE FAZ: monta uma URL com parâmetros que o jogo JÁ entende e recarrega a página nela. Este arquivo NÃO mexe no save, NÃO chama a rede e NÃO muda
   regra de jogo. debug=1 vai sempre (sem ele nenhum dos outros vale). Cada parâmetro e onde o jogo o lê:
     com=<chaves>   js/farm.js (sysLive) + battlepolish/mountcharge/skillicons: liga, só nesta carga, chaves que estão com false no SYS_LIVE (várias por vírgula)
     titulo=3       js/p_title3.js: liga a Tela Inicial nova (TITLE3_ON) só nesta carga
     fresh=1        index.html: save novo SÓ EM MEMÓRIA (S=newState()) com as gravações bloqueadas (__noSave): nada é gravado, o save do aparelho fica como está
                    e o online não liga (js/onlineboot.js: motivo 'nosave'). Pede confirmação.
     semlate=1|20   js/latepack.js: simula o pacote ui:late ausente (1 = até chamar LatePack.chegou(); 20 = chega depois de 20 s)
     falha=era      js/preload.js: os arquivos com "era" no endereço falham na 1ª rodada do carregamento e carregam no "Tentar de novo"
     lento=800      js/preload.js: cada arquivo do carregamento espera 800 ms antes de ser pedido
     era=N&plv=X    index.html (atalho do QA): nível do jogador X (2 a 100) SÓ EM MEMÓRIA. O bloco do ?era= bloqueia as gravações (__noSave): o save não é
                    alterado e nada sobe para a nuvem. Efeitos do mesmo atalho: volta ao início da era, arma e roupa de teste, 50.000 de ouro (tudo só nesta carga).
   Com parâmetro ativo aparece um selo "DEV" no canto (só no build DEV): é a saída para quem ficou num jogo novo de teste e não chega a Configurações. */
(function (W) {
  function isDev() { try { if (typeof STORE_BUILD !== 'undefined' && STORE_BUILD === true) return false; const L = W.location; if (!L) return false;
      return L.protocol === 'http:' && (L.hostname === 'localhost' || L.hostname === '127.0.0.1') && String(L.port) === '8080'; } catch (e) { return false; } }
  if (!isDev()) return;   /* app normal / loja: nada deste arquivo existe */

  const TAPS = 5, WIN_MS = 3000, PLV_MIN = 2, PLV_MAX = 100;
  const ITEMS = [
    { id: 'titulo', k: 'titulo', v: '3', t: 'Tela Inicial nova', s: 'Liga a Tela Inicial V3 só nesta carga.' },
    { id: 'fresh', k: 'fresh', v: '1', t: 'Jogo novo de teste', s: 'Save novo só em memória. Nada é gravado; o jogo deste aparelho não é apagado.', ask: true },
    { id: 'semlate1', k: 'semlate', v: '1', t: 'Pacote de arte ausente', s: 'Simula o pacote ui:late faltando até chamar LatePack.chegou().' },
    { id: 'semlate20', k: 'semlate', v: '20', t: 'Pacote de arte chega em 20 s', s: 'Simula o pacote ui:late faltando por 20 segundos.' },
    { id: 'falha', k: 'falha', v: 'era', t: 'Falha no carregamento', s: 'Arquivos com "era" no endereço falham na 1ª rodada e carregam no Tentar de novo.' },
    { id: 'lento', k: 'lento', v: '800', t: 'Carregamento lento', s: 'Cada arquivo espera 800 ms antes de ser pedido.' }];
  const U = { el: null, chip: null, taps: [], sel: {}, com: {}, plv: '', ask: false, msg: '' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* chaves que o com= aceita: SÓ as que estão com false no SYS_LIVE (regra do sysLive, js/farm.js); lidas na hora, sem lista fixa aqui */
  function comKeys() { const out = []; try { if (typeof SYS_LIVE !== 'undefined' && SYS_LIVE) for (const k in SYS_LIVE) if (SYS_LIVE[k] === false && /^\w+$/.test(k)) out.push(k); } catch (e) {} return out; }
  /* parâmetros ativos agora (o que está no endereço) */
  function active() { const out = []; try { const q = String(W.location.search || '').replace(/^\?/, ''); if (q) for (const p of q.split('&')) if (p) out.push(p); } catch (e) {} return out; }
  function activeMap() { const m = {}; for (const p of active()) { const i = p.indexOf('='); let k = i < 0 ? p : p.slice(0, i), v = i < 0 ? '' : p.slice(i + 1); try { k = decodeURIComponent(k); v = decodeURIComponent(v); } catch (e) {} m[k] = v; } return m; }
  function curEra() { try { const e = eraOf(S.stage) | 0; return Math.max(0, Math.min(8, e)); } catch (e) { return 0; } }
  function plvOf(v) { const n = parseInt(v, 10); return isFinite(n) && n >= PLV_MIN ? Math.min(PLV_MAX, n) : 0; }
  const basePath = () => { try { return String(W.location.pathname || '/'); } catch (e) { return '/'; } };

  /* URL de um conjunto de escolhas: {com:[chaves], items:[ids], plv:número}. Só entra o que está nas tabelas acima; debug=1 sempre. */
  function url(sel) { sel = sel || {}; const parts = ['debug=1'], ok = comKeys();
    const com = (Array.isArray(sel.com) ? sel.com : []).filter((k, i, a) => ok.indexOf(k) >= 0 && a.indexOf(k) === i);
    if (com.length) parts.push('com=' + com.join(','));
    const ids = Array.isArray(sel.items) ? sel.items : [], seen = {};
    for (const it of ITEMS) { if (ids.indexOf(it.id) < 0 || seen[it.k]) continue; seen[it.k] = 1; parts.push(it.k + '=' + it.v); }   /* um valor por parâmetro (semlate=1 OU 20) */
    const n = plvOf(sel.plv); if (n) parts.push('era=' + curEra(), 'plv=' + n);
    return basePath() + '?' + parts.join('&'); }
  const normalUrl = () => basePath();
  function go(u) { try { W.location.href = u; return true; } catch (e) { return false; } }

  function selNow() { return { com: comKeys().filter(k => U.com[k]), items: ITEMS.filter(it => U.sel[it.id]).map(it => it.id), plv: U.plv }; }
  function keepField() { try { const f = document.getElementById('dv_plv'); if (f && typeof f.value === 'string') U.plv = f.value; } catch (e) {} }
  /* ao abrir: as caixas começam como o endereço atual */
  function fromUrl() { const m = activeMap(); U.sel = {}; U.com = {}; U.plv = ''; U.ask = false; U.msg = '';
    for (const it of ITEMS) if (m[it.k] === it.v) U.sel[it.id] = true;
    const ok = comKeys(); for (const k of String(m.com || '').split(',')) if (ok.indexOf(k) >= 0) U.com[k] = true;
    const n = plvOf(m.plv); if (n) U.plv = String(n); }

  const B = 'min-height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font:900 14px Nunito,system-ui,sans-serif;padding:6px 10px;box-sizing:border-box;cursor:pointer';
  const GOLD = 'background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#8a4f0c';
  function box(on, attrs, title, sub) { return `<button ${attrs} role="checkbox" aria-checked="${on ? 'true' : 'false'}" style="${B};width:100%;display:flex;align-items:center;gap:10px;text-align:left;${on ? 'border-color:#ffc94a;background:#4a3418' : ''}">
      <span aria-hidden="true" style="flex:none;width:22px;height:22px;border-radius:6px;border:2px solid ${on ? '#ffc94a' : '#8a7a66'};background:${on ? '#ffc94a' : 'transparent'};color:#2a1403;font:900 16px/18px Nunito,sans-serif;text-align:center;box-sizing:border-box">${on ? 'x' : ''}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2"><span>${esc(title)}</span>${sub ? `<span style="font-size:11.5px;font-weight:700;color:#c9b9a2;overflow-wrap:anywhere">${esc(sub)}</span>` : ''}</span></button>`; }
  function html() { const act = active(), keys = comKeys(), u = url(selNow());
    const head = `<div style="display:flex;align-items:center;gap:8px"><b style="flex:1;font:400 20px 'Lilita One',Nunito,sans-serif;color:#ffc94a">Depuração · app DEV</b><button data-d="close" aria-label="Fechar" style="${B};min-width:48px">Fechar</button></div>`;
    if (U.ask) return head + `<div role="alertdialog" aria-label="Jogo novo de teste" style="display:flex;flex-direction:column;gap:10px;padding:12px;border-radius:14px;border:2px solid #ffc94a;background:#241b14">
        <b style="font-size:16px">Começar um jogo novo de teste?</b>
        <span style="font-size:13px;font-weight:700;color:#e8dccb;line-height:1.35">Com fresh=1 o jogo abre com um save novo que existe só nesta carga. Nada é gravado, o jogo deste aparelho NÃO é apagado e o online fica desligado. Para voltar ao seu jogo: selo DEV no canto, Voltar ao normal.</span>
        <div style="display:flex;gap:8px"><button data-d="askno" style="${B};flex:1">Cancelar</button><button data-d="askyes" style="${B};flex:1;${GOLD}">Começar</button></div></div>`;
    return head + `
      <div style="padding:10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b;display:flex;flex-direction:column;gap:8px">
        <span style="font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:.5px">ATIVOS AGORA</span>
        <span id="dv_act" style="font:700 13px ui-monospace,Consolas,monospace;overflow-wrap:anywhere">${act.length ? esc(act.join(' · ')) : 'nenhum (jogo normal)'}</span>
        <button data-d="normal" style="${B}">Voltar ao normal</button></div>
      <span style="font-size:12px;font-weight:700;color:#c9b9a2;line-height:1.3">Marque e toque em Aplicar: a página recarrega com os parâmetros. debug=1 vai sempre.</span>
      ${ITEMS.map(it => box(!!U.sel[it.id], `data-d="item" data-id="${it.id}"`, it.t + ' (' + it.k + '=' + it.v + ')', it.s)).join('')}
      <span style="font-size:12px;font-weight:900;color:#c9b9a2;margin-top:4px">LIGAR MÓDULO DESLIGADO (com=)</span>
      <span style="font-size:11.5px;font-weight:700;color:#c9b9a2;line-height:1.3">Liga no jogo que estiver aberto, só nesta carga. São módulos ainda não aprovados.</span>
      ${keys.length ? keys.map(k => box(!!U.com[k], `data-d="com" data-id="${esc(k)}"`, k, '')).join('') : '<span style="font-size:12.5px;font-weight:700">Nenhuma chave desligada no SYS_LIVE.</span>'}
      <span style="font-size:12px;font-weight:900;color:#c9b9a2;margin-top:4px">SUBIR PARA O NÍVEL (era=${curEra()}&amp;plv=)</span>
      <span style="font-size:11.5px;font-weight:700;color:#c9b9a2;line-height:1.3">Só nesta carga: nada é gravado e nada vai para a nuvem. O atalho também volta ao início da era, com arma e roupa de teste e 50.000 de ouro. Vazio = não muda o nível.</span>
      <input id="dv_plv" type="number" inputmode="numeric" min="${PLV_MIN}" max="${PLV_MAX}" step="1" value="${esc(U.plv)}" placeholder="${PLV_MIN} a ${PLV_MAX}" aria-label="Nível do jogador, de ${PLV_MIN} a ${PLV_MAX}" style="height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#0e0a07;color:#f6ecdf;font:900 16px Nunito,system-ui,sans-serif;padding:0 12px;box-sizing:border-box;width:100%">
      <span id="dv_msg" role="alert" style="min-height:16px;font-size:12.5px;font-weight:900;color:#ff9a8a">${esc(U.msg)}</span>
      <span id="dv_url" style="font:700 12px ui-monospace,Consolas,monospace;color:#9be89f;overflow-wrap:anywhere">${esc(u)}</span>
      <button data-d="apply" style="${B};${GOLD};min-height:52px;font-size:16px">Aplicar e recarregar</button>`; }
  function paint() { if (!U.el) return; const sc = U.el.firstChild, top = sc ? +sc.scrollTop || 0 : 0;
    U.el.innerHTML = `<div role="dialog" aria-modal="true" aria-label="Menu de depuração do app DEV" style="width:100%;max-width:420px;max-height:100%;overflow-y:auto;overflow-x:hidden;border-radius:18px;background:#1d1611;border:2px solid #ffc94a;padding:14px 12px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;color:#f6ecdf;font-family:Nunito,system-ui,sans-serif">${html()}</div>`;
    try { if (top && U.el.firstChild) U.el.firstChild.scrollTop = top; } catch (e) {} }

  function toggle(kind, id) { keepField(); U.msg = '';
    if (kind === 'com') { if (comKeys().indexOf(id) < 0) return false; U.com[id] = !U.com[id]; }
    else { const it = ITEMS.find(x => x.id === id); if (!it) return false; const on = !U.sel[id];
      if (on) for (const o of ITEMS) if (o.k === it.k) U.sel[o.id] = false;   /* mesmo parâmetro, outro valor: fica um só */
      U.sel[id] = on; }
    paint(); return true; }
  function setLevel(v) { U.plv = v == null ? '' : String(v); U.msg = ''; paint(); }
  /* Aplicar: nível fora da faixa não recarrega; fresh=1 pede confirmação antes */
  function apply(confirmed) { keepField(); const raw = String(U.plv || '').trim();
    if (raw && (!/^\d+$/.test(raw) || +raw < PLV_MIN || +raw > PLV_MAX)) { U.msg = 'Nível de ' + PLV_MIN + ' a ' + PLV_MAX + ', ou deixe vazio.'; paint(); return false; }
    if (U.sel.fresh && confirmed !== true) { U.ask = true; paint(); return false; }
    U.ask = false; return go(url(selNow())); }
  function backToNormal() { return go(normalUrl()); }

  function onClick(ev) { let b = ev && ev.target; try { b = b && b.closest ? b.closest('[data-d]') : null; } catch (e) { b = null; }
    if (!b) { if (ev && ev.target === U.el) close(); return; }
    const a = b.dataset.d;
    if (a === 'close') close(); else if (a === 'normal') backToNormal(); else if (a === 'item' || a === 'com') toggle(a, b.dataset.id);
    else if (a === 'apply') apply(false); else if (a === 'askyes') apply(true); else if (a === 'askno') { U.ask = false; paint(); } }
  function open() { if (U.el) return true; let host = null; try { host = document.body; } catch (e) {} if (!host) return false;
    fromUrl(); const el = document.createElement('div'); el.id = 'dv_root';
    el.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,6,4,.9);padding:12px;box-sizing:border-box';
    el.addEventListener('click', onClick); el.addEventListener('input', ev => { const t = ev && ev.target; if (t && t.id === 'dv_plv') { U.plv = String(t.value || ''); } });
    U.el = el; paint(); host.appendChild(el); return true; }
  function close() { if (!U.el) return; try { U.el.remove(); } catch (e) {} U.el = null; U.ask = false; }
  /* 5 toques em até 3 s (o gancho é do js/p_cfg.js: toque no número da versão). Devolve true quando abriu. */
  function tap(now) { now = typeof now === 'number' ? now : Date.now(); U.taps = U.taps.filter(t => now >= t && now - t < WIN_MS); U.taps.push(now);
    if (U.taps.length < TAPS) return false; U.taps = []; return open(); }

  /* selo "DEV": só com parâmetro no endereço; abre o menu com um toque (saída do jogo novo de teste) */
  function chip() { try { if (U.chip || !active().length || !document.body) return; const c = document.createElement('button'); c.id = 'dv_chip'; c.textContent = 'DEV'; c.setAttribute('aria-label', 'Menu de depuração do app DEV: há parâmetros ativos');
      c.style.cssText = 'position:fixed;right:2px;top:calc(env(safe-area-inset-top) + 2px);z-index:9997;min-width:44px;min-height:44px;padding:0;border:0;background:none;color:#2a1403;font:900 11px Nunito,system-ui,sans-serif;cursor:pointer;opacity:.85';
      c.innerHTML = '<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#ffc94a;box-shadow:0 2px 6px rgba(0,0,0,.45)">DEV</span>';
      c.addEventListener('click', () => { open(); }); document.body.appendChild(c); U.chip = c; } catch (e) {} }
  chip();

  W.DevMenu = { tap, open, close, url, normalUrl, active, comKeys, toggle, setLevel, apply, backToNormal, isOpen: () => !!U.el, ITEMS, _u: U };
})(window);
