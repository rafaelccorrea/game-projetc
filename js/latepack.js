/* ============================================================
   PACOTE 'ui:late' (fast-follow da Play; plano A da base do AAB, PO 14/11)
   A arte de telas que só abrem mais tarde (retratos e ícones de pets, Mentores, títulos, Relíquias, Escavação, Dupla, Acampamento,
   Tela Inicial) saiu da base da loja e chega sozinha logo depois da instalação. As telas escrevem o caminho de sempre
   ("assets/pets/x.png"); este arquivo resolve, num ponto só, os dois casos de uma <img> dessas que falha:
     1. o pacote JÁ chegou, mas mora em outra pasta (Sys.assets.url): troca o endereço uma vez e a imagem carrega;
     2. o pacote AINDA não chegou: deixa a reserva da própria tela agir (onerror dela); sem reserva, esconde a imagem
        (nunca o ícone de imagem quebrada) e tenta de novo sozinho quando o pacote chegar.
   No APK de teste (tudo dentro, Sys.assets desligado) nada disto roda: a imagem não falha.
   ============================================================ */
(function(){
  'use strict';
  const PACK='ui:late', WAIT=new Set(); let timer=null;
  const A=()=>{ try{ const a=window.Sys&&window.Sys.assets; return a&&typeof a.classify==='function'?a:null; }catch(e){ return null; } };
  /* caminho relativo ao jogo ("assets/...") de um endereço qualquer; null = não é arte do jogo */
  function rel(src){ try{ const s=String(src||''), i=s.indexOf('assets/'); if(i<0) return null; return s.slice(i).replace(/[?#].*$/,''); }catch(e){ return null; } }
  function late(p){ const a=A(); try{ return !!(a&&p&&a.classify(p)===PACK); }catch(e){ return false; } }
  function ready(p){ const a=A(); try{ return !!(a&&typeof a.isReady==='function'&&a.isReady(p)); }catch(e){ return false; } }
  function real(p){ const a=A(); try{ return a&&typeof a.url==='function'?a.url(p):p; }catch(e){ return p; } }
  /* devolve 'swap' (trocou o endereço), 'wait' (pacote não chegou) ou '' (não é comigo) */
  function fix(im){ if(!im||!im.dataset) return ''; const p=im.dataset.lpP||rel(im.getAttribute&&im.getAttribute('src')||im.src); if(!late(p)) return '';
    if(ready(p)){ const u=real(p); if(im.dataset.lp==='s'||u===(im.getAttribute&&im.getAttribute('src'))) return ''; im.dataset.lp='s'; im.dataset.lpP=p; if(im.style&&im.dataset.lpH){ im.style.visibility=''; delete im.dataset.lpH; } im.src=u; return 'swap'; }
    im.dataset.lp='w'; im.dataset.lpP=p; return 'wait'; }
  function tick(){ for(const im of Array.from(WAIT)){ if(!im.isConnected){ WAIT.delete(im); continue; } if(ready(im.dataset.lpP)){ WAIT.delete(im); im.dataset.lp=''; if(im.style) im.style.display=''; fix(im); } }
    if(!WAIT.size&&timer){ clearInterval(timer); timer=null; } }
  function onError(ev){ const im=ev&&ev.target; if(!im||im.tagName!=='IMG') return; const r=fix(im);
    if(r==='swap'){ if(ev.stopPropagation) ev.stopPropagation(); return; }   /* a reserva da tela não dispara: a imagem vai carregar do pacote */
    if(r==='wait'){ if(!(im.getAttribute&&im.getAttribute('onerror'))&&im.style){ im.style.visibility='hidden'; im.dataset.lpH='1'; }   /* sem reserva própria: some, sem ícone quebrado */
      WAIT.add(im); if(!timer&&typeof setInterval==='function') timer=setInterval(tick,3000); } }
  try{ if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('error',onError,true); }catch(e){}
  window.LatePack={PACK,rel,late,fix,onError,tick,waiting:()=>WAIT.size};
})();
