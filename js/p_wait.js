'use strict';
/* ================= INVÓLUCRO VISUAL DO PRÉ-CARREGADOR DAS TELAS (js/p_wait.js) =================
   Ordem do dono: nada desenhado com imagem ainda carregando. A função de carga é UMA só, do engenheiro: window.Preload.ready(urls,{timeout}) →
   Promise<{ok,failed[]}> e window.Preload.has(url) (js/preload.js). Este arquivo é SÓ o invólucro visual:
   - pGate(urls, opts): chamada no começo do render de uma tela: `if(typeof pGate==='function'&&pGate([...urls])) return;`
     devolve false quando todas as imagens já estão prontas (a tela segue e se desenha); devolve true quando pôs o esqueleto/indicador em V e
     VAI chamar render() sozinho quando tudo estiver decodificado. Falhou ou estourou o tempo: mensagem + "Tentar de novo" e "Continuar assim"
     (esse segue a tela com a reserva que ela já tem para imagem ausente). Nunca trava a tela, nunca rejeita.
   - pWait(el, urls, {timeout, onReady, label}): a mesma coisa para um elemento qualquer; onReady({ok, failed}) quando acabar.
   - pWaitClick(b): cliques dos botões do esqueleto (data-x="pw-retry" | "pw-go"); as telas que usam pGate já passam por ele se chamarem
     `if(pWaitClick(b)) return;` no começo do click. Sem o Preload carregado, usa um carregador mínimo próprio com a MESMA semântica (Image + decode).
   Sem emoji; PT-BR; responsivo (nada fixo em largura). */
const PW={done:{},busy:null,fail:null,tok:0};
const PW_TIMEOUT=8000;
const pwwEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pwCss(){ if(typeof document==='undefined'||!document.head||(document.getElementById&&document.getElementById('pw_css'))) return; const st=document.createElement('style'); st.id='pw_css';
  st.textContent='.pw-sk{animation:pws 1.2s ease-in-out infinite}@keyframes pws{0%,100%{opacity:.45}50%{opacity:1}}.pw-spin{animation:pwr .9s linear infinite}@keyframes pwr{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.pw-sk,.pw-spin{animation:none}}';
  try{ document.head.appendChild(st); }catch(e){} }
function pwUrls(urls){ const s=[]; for(const u of Array.isArray(urls)?urls:[]) if(typeof u==='string'&&u&&s.indexOf(u)<0) s.push(u); return s; }
function pwHas(u){ if(PW.done[u]) return true; try{ if(window.Preload&&typeof window.Preload.has==='function'&&window.Preload.has(u)){ PW.done[u]=1; return true; } }catch(e){} return false; }
function pwAllReady(urls){ return urls.every(pwHas); }
/* carregador próprio mínimo (só quando o Preload do engenheiro não existe): mesma semântica, nunca rejeita */
function pwOwnLoad(urls,timeout){
  return new Promise(res=>{ const failed=[]; let left=urls.length, over=false;
    const end=()=>{ if(over) return; over=true; clearTimeout(tm); res({ok:failed.length===0,failed}); };
    const tm=setTimeout(()=>{ for(const u of urls) if(!PW.done[u]&&failed.indexOf(u)<0) failed.push(u); end(); },timeout);
    if(!left){ end(); return; }
    for(const u of urls){ let im; try{ im=new Image(); }catch(e){ failed.push(u); if(--left===0) end(); continue; }
      const fin=ok=>{ if(ok) PW.done[u]=1; else if(failed.indexOf(u)<0) failed.push(u); if(--left===0) end(); };
      im.onerror=()=>fin(false);
      if(typeof im.decode==='function'){ im.src=u; im.decode().then(()=>fin(true),()=>fin(false)); } else { im.onload=()=>fin(true); im.src=u; } } });
}
function pwLoad(urls,timeout){
  const P=window.Preload; let p;
  if(P&&typeof P.ready==='function'){ try{ p=Promise.resolve(P.ready(urls,{timeout})); }catch(e){ p=pwOwnLoad(urls,timeout); } }
  else p=pwOwnLoad(urls,timeout);
  return p.then(r=>{ r=r||{}; const failed=Array.isArray(r.failed)?r.failed:[]; if(!failed.length) for(const u of urls) PW.done[u]=1; return {ok:r.ok!==false&&failed.length===0,failed}; },()=>({ok:false,failed:urls.slice()}));
}
function pwSkeleton(label){ pwCss();
  return '<div role="status" aria-live="polite" aria-label="'+pwwEsc(label||'Carregando')+'" style="flex:1;width:100%;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;box-sizing:border-box;text-align:center">'
    +'<svg class="pw-spin" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9" opacity=".95"></path></svg>'
    +'<div class="pw-sk" style="width:70%;max-width:240px;height:12px;border-radius:6px;background:#3a2c1f"></div><div class="pw-sk" style="width:50%;max-width:180px;height:12px;border-radius:6px;background:#2f241a"></div>'
    +'<span style="font-size:13px;font-weight:800;color:#c9b9a2">'+pwwEsc(label||'Carregando as imagens')+'</span></div>'; }
function pwFailView(n){ pwCss();
  return '<div role="alert" style="flex:1;width:100%;min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;box-sizing:border-box;text-align:center">'
    +'<span style="font-size:15px;font-weight:900;color:#f6ecdf">'+(n>1?'Algumas imagens não carregaram.':'Uma imagem não carregou.')+'</span><span style="font-size:12px;font-weight:700;color:#c9b9a2">Confira a conexão e tente de novo.</span>'
    +'<button data-x="pw-retry" style="min-height:48px;padding:0 22px;border:0;border-radius:12px;font-weight:900;font-size:15px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c">Tentar de novo</button>'
    +'<button data-x="pw-go" style="min-height:44px;padding:0 18px;border-radius:12px;font-weight:900;font-size:14px;background:#33271d;color:#f6ecdf;border:2px solid #6b5843">Continuar assim</button></div>'; }
function pwPut(el,html){ try{ if(el) el.innerHTML=html; }catch(e){} }
/* CORREÇÃO PEQUENA DO AGENTE B (aviso em reports/pedidos-entre-agentes.md, B-29): no jogo o V é `const V` do index.html, que NÃO vira window.V; com
   window.V o esqueleto e a tela de falha não apareciam e a tela ficava sem desenhar. pwV() acha o V nos dois jeitos (e, por último, o #view). */
function pwV(){ try{ if(typeof V!=='undefined'&&V) return V; }catch(e){} try{ if(window.V) return window.V; }catch(e){} try{ return document.getElementById('view'); }catch(e){} return null; }
/* elemento qualquer */
function pWait(el,urls,o){ o=o||{}; const list=pwUrls(urls), timeout=o.timeout>0?o.timeout:PW_TIMEOUT, tok=++PW.tok; if(el) el.__pwTok=tok;
  const fin=r=>{ if(el&&el.__pwTok!==tok) return; try{ if(typeof o.onReady==='function') o.onReady(r); }catch(e){} };
  if(pwAllReady(list)){ fin({ok:true,failed:[]}); return false; }
  pwPut(el,pwSkeleton(o.label));
  pwLoad(list,timeout).then(r=>{ if(el&&el.__pwTok!==tok) return; if(r.ok){ fin(r); return; }
    pwPut(el,pwFailView(r.failed.length)); PW.fail={el,list,o,r}; });
  return true; }
/* tela inteira (V): chamar no começo do render. true = esqueleto na tela (render volta sozinho); false = pode desenhar */
function pGate(urls,o){ o=o||{}; const list=pwUrls(urls); if(pwAllReady(list)||PW.skip===list.join('|')) return false;
  const key=list.join('|'); if(PW.busy===key) return true; if(PW.fail&&PW.fail.key===key) { pwPut(pwV(),pwFailView(PW.fail.n)); return true; }
  PW.busy=key; const tok=++PW.tok; pwPut(pwV(),pwSkeleton(o.label));
  pwLoad(list,o.timeout>0?o.timeout:PW_TIMEOUT).then(r=>{ if(PW.busy!==key||PW.tok!==tok) return; PW.busy=null;
    if(r.ok){ PW.fail=null; try{ if(typeof render==='function') render(); }catch(e){} return; }
    PW.fail={key,n:r.failed.length,list}; pwPut(pwV(),pwFailView(r.failed.length)); });
  return true; }
/* cliques do esqueleto: devolve true quando tratou */
function pWaitClick(b){ const a=b&&b.dataset&&b.dataset.x; if(a!=='pw-retry'&&a!=='pw-go') return false;
  const f=PW.fail; PW.fail=null; PW.busy=null;
  if(f&&f.el){ if(a==='pw-retry') pWait(f.el,f.list,f.o); else { try{ if(f.o&&typeof f.o.onReady==='function') f.o.onReady(f.r); }catch(e){} } return true; }
  if(a==='pw-go'&&f&&f.key) PW.skip=f.key;
  try{ if(typeof render==='function') render(); }catch(e){} PW.skip=null; return true; }
window.pGate=pGate; window.pWait=pWait; window.pWaitClick=pWaitClick;
