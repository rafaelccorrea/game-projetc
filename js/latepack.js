/* ============================================================
   PACOTE 'ui:late' (fast-follow da Play; plano A da base do AAB, PO 14/11)
   A arte de telas que só abrem mais tarde (retratos e ícones de pets, Mentores, títulos, Relíquias, Escavação, Dupla, Acampamento,
   Tela Inicial) saiu da base da loja e chega sozinha logo depois da instalação. As telas escrevem o caminho de sempre
   ("assets/pets/x.png"); este arquivo resolve, num ponto só, os dois casos de uma <img> dessas que falha:
     1. o pacote JÁ chegou, mas mora em outra pasta (Sys.assets.url): troca o endereço uma vez e a imagem carrega;
     2. o pacote AINDA não chegou: deixa a reserva da própria tela agir (onerror dela); sem reserva, esconde a imagem
        (nunca o ícone de imagem quebrada) e tenta de novo sozinho quando o pacote chegar (mesmo que chegue no MESMO endereço: js/padbridge.js avisa).
   No APK de teste (tudo dentro, Sys.assets desligado) nada disto roda: a imagem não falha.
   SIMULAÇÃO para o QA (PO 14/11): ?debug=1&semlate=1 faz toda <img> desse pacote FALHAR de verdade (endereço que não existe), para ver a reserva de
   cada tela antes da loja; ?debug=1&semlate=20 faz o pacote "chegar" depois de 20 s; no console, LatePack.chegou() faz chegar na hora.
   Limite da simulação: só <img> do DOM; fundo por CSS e imagem desenhada em canvas não entram.
   ============================================================ */
(function(){
  'use strict';
  const PACK='ui:late', WAIT=new Set(); let timer=null;
  const A=()=>{ try{ const a=window.Sys&&window.Sys.assets; return a&&typeof a.classify==='function'?a:null; }catch(e){ return null; } };
  /* caminho relativo ao jogo ("assets/...") de um endereço qualquer; null = não é arte do jogo */
  function rel(src){ try{ const s=String(src||''), i=s.indexOf('assets/'); if(i<0) return null; return s.slice(i).replace(/[?#].*$/,''); }catch(e){ return null; } }
  function late(p){ const a=A(); try{ return !!(a&&p&&a.classify(p)===PACK); }catch(e){ return false; } }
  const SIM={on:false};
  function ready(p){ if(SIM.on) return false; const a=A(); try{ return !!(a&&typeof a.isReady==='function'&&a.isReady(p)); }catch(e){ return false; } }
  function real(p){ const a=A(); try{ return a&&typeof a.url==='function'?a.url(p):p; }catch(e){ return p; } }
  /* devolve 'swap' (trocou o endereço), 'wait' (pacote não chegou) ou '' (não é comigo) */
  function fix(im){ if(!im||!im.dataset) return ''; const p=im.dataset.lpP||rel(im.getAttribute&&im.getAttribute('src')||im.src); if(!late(p)) return '';
    if(ready(p)){ const u=real(p); if(im.dataset.lp==='s'||u===(im.getAttribute&&im.getAttribute('src'))) return ''; im.dataset.lp='s'; im.dataset.lpP=p; if(im.style&&im.dataset.lpH){ im.style.visibility=''; delete im.dataset.lpH; } im.src=u; return 'swap'; }
    im.dataset.lp='w'; im.dataset.lpP=p; return 'wait'; }
  /* o pacote chegou no MESMO endereço (versão de loja: o app intercepta https://localhost/assets/..., CONTRATO_PACOTES §5): a <img> que já falhou não se
     recarrega sozinha. Pede de novo UMA vez (o carimbo ?lp=1 evita a resposta de falha guardada) e desfaz o esconder. Só roda para imagem que ESPERAVA o pacote. */
  function again(im){ try{ const p=im.dataset.lpP; if(!p||im.dataset.lp==='s') return; im.dataset.lp='s'; if(im.style&&im.dataset.lpH){ im.style.visibility=''; delete im.dataset.lpH; } const u=real(p); im.src=u+(u.indexOf('?')<0?'?':'&')+'lp=1'; }catch(e){} }
  function tick(){ for(const im of Array.from(WAIT)){ if(!im.isConnected){ WAIT.delete(im); continue; } if(ready(im.dataset.lpP)){ WAIT.delete(im); im.dataset.lp=''; if(im.style) im.style.display=''; if(fix(im)!=='swap') again(im); } }
    if(!WAIT.size&&timer){ clearInterval(timer); timer=null; } }
  function onError(ev){ const im=ev&&ev.target; if(!im||im.tagName!=='IMG') return; const r=fix(im);
    if(r==='swap'){ if(ev.stopPropagation) ev.stopPropagation(); return; }   /* a reserva da tela não dispara: a imagem vai carregar do pacote */
    if(r==='wait'){ if(!(im.getAttribute&&im.getAttribute('onerror'))&&im.style){ im.style.visibility='hidden'; im.dataset.lpH='1'; }   /* sem reserva própria: some, sem ícone quebrado */
      WAIT.add(im); if(!timer&&typeof setInterval==='function') timer=setInterval(tick,3000); return; }
    if(r==='') hudRetry(im); }
  /* QA 14/11 (S24, rede caiu): os botões da BATALHA mostravam o ícone de imagem quebrada enquanto a arte não vinha. Imagem do #fbhud que falha e não tem
     reserva própria: some (o botão fica só com a moldura e o rótulo) e é pedida de novo a cada 5 s, até 24 vezes; ao carregar, volta a aparecer. */
  function hudRetry(im){ try{ if(!im.closest||!im.closest('#fbhud')||(im.getAttribute&&im.getAttribute('onerror'))||!im.style) return; const src=im.getAttribute('src'); if(!src||src.indexOf('data:')===0) return;
      im.style.visibility='hidden'; if(!im.dataset.lpR){ im.dataset.lpR='0'; im.addEventListener('load',()=>{ try{ im.style.visibility=''; im.dataset.lpR='0'; }catch(e){} }); }
      const n=(parseInt(im.dataset.lpR,10)||0)+1; if(n>24) return; im.dataset.lpR=String(n);
      setTimeout(()=>{ try{ if(im.isConnected&&im.getAttribute('src')===src&&!(im.complete&&im.naturalWidth>0)) im.src=src; }catch(e){} },5000); }catch(e){} }
  try{ if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('error',onError,true); }catch(e){}
  /* simulação: troca o endereço das <img> do pacote por um que não existe (guarda o original em data-lp-p); o erro de verdade segue o caminho normal */
  function simMark(im){ try{ if(!SIM.on||!im||im.tagName!=='IMG'||im.dataset.lpP) return; const p=rel(im.getAttribute('src')); if(!late(p)) return; im.dataset.lpP=p; im.src='assets/__pacote_ausente__/'+p.split('/').pop(); }catch(e){} }
  function simScan(root){ try{ if(!root) return; if(root.tagName==='IMG') simMark(root); if(root.querySelectorAll) root.querySelectorAll('img').forEach(simMark); }catch(e){} }
  function chegou(){ SIM.on=false; tick(); return WAIT.size; }
  try{ const q=new URLSearchParams(location.search), v=q.get('semlate'); if(q.get('debug')==='1'&&v!=null&&typeof MutationObserver==='function'){ SIM.on=true;
      new MutationObserver(ms=>{ if(!SIM.on) return; for(const m of ms){ if(m.type==='attributes') simMark(m.target); else m.addedNodes.forEach(simScan); } }).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
      simScan(document.documentElement); const sec=parseInt(v,10); if(sec>1) setTimeout(chegou,sec*1000); console.log('[LatePack] simulação: pacote ui:late AUSENTE'+(sec>1?' por '+sec+' s':' (LatePack.chegou() para fazer chegar)')); } }catch(e){}
  window.LatePack={PACK,rel,late,fix,onError,tick,hudRetry,chegou,sim:SIM,simMark,waiting:()=>WAIT.size};
})();
