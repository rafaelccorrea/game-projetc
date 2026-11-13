'use strict';
/* ================= CARTÃO "MECHA DE GUERRA" DA LOJA (js/p_shopmecha.js) — NASCE DESLIGADO (PANEL_ON.shopmecha) =================
   Só o cartão, para o agente de painéis encaixar na Loja: shMechaCard() devolve {html, click(b)} (ou null) e a Loja chama click no clique.
   Dados SÓ de Sys.buy (produto 'mount_mecha') e Sys.mount (montaria 'mecha'); nada escrito aqui.
   Regras do PO: com a chave desligada o cartão NÃO existe (devolve null); a tela não mostra preço nem botão de compra de item que o jogo ainda
   não entrega: com a chave ligada e Sys.buy.ready() falso mostra "Em breve" e o aviso "Pagamento em breve", SEM preço; o preço (Sys.buy.priceText)
   só aparece quando a compra real está ligada (ready() verdadeiro). A chave só liga com a arte do Mecha aprovada pelo dono.
   Montaria que o jogador já tem: "Você tem", sem botão. Arte: assets/mounts/new/war_mecha_ref_prev.png (~300 KB; use pGate do p_wait.js nesta tela). */
const SHM_ART='assets/icons/mounts/war_mecha.png', SHM_OLD='assets/mounts/new/war_mecha_ref_prev.png';   /* ícone transparente da Arte; reserva = miniatura antiga */
const shmEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function shmOn(){ try{ return !!(window.PANEL_ON&&window.PANEL_ON.shopmecha); }catch(e){ return false; } }
function shmProduct(){ try{ return window.Sys&&Sys.buy&&Sys.buy.product?Sys.buy.product('mount_mecha'):null; }catch(e){ return null; } }
function shmMount(p){ try{ const M=window.Sys&&Sys.mount, id=p&&p.mountId; if(!M||!M.DATA||!id) return null; return M.DATA.mounts.find(m=>m.id===id)||null; }catch(e){ return null; } }
function shmOwned(p){ try{ return !!(Sys.mount.ensure(S).owned||{})[p.mountId]; }catch(e){ return false; } }
function shmReady(){ try{ return Sys.buy.ready()===true; }catch(e){ return false; } }
function shMechaCard(){
  if(!shmOn()) return null; const p=shmProduct(), m=shmMount(p); if(!p||!m) return null;
  const own=shmOwned(p), ready=shmReady(), price=(ready&&!own&&Sys.buy.priceText)?Sys.buy.priceText(p.id):'';
  const rn=(window.RAR&&RAR[m.r]&&RAR[m.r].n)||'Lendário';
  const act=own?'<span style="font-size:13px;font-weight:900;color:#7ef08a">Você tem</span>'
    :'<button data-x="shm-buy" aria-label="'+shmEsc(ready?'Comprar '+m.name+' por '+price:m.name+': em breve')+'" style="min-height:48px;padding:0 18px;border:0;border-radius:12px;font-weight:900;font-size:15px;background:'+(ready?'linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c':'#3a3128;color:#c9b9a2')+'">'+(ready?shmEsc(price):'Em breve')+'</button>';
  const html='<div role="group" aria-label="'+shmEsc(p.name)+', '+shmEsc(rn)+'" style="display:flex;gap:10px;padding:10px;border-radius:14px;background:#1d1611;border:2px solid #ffc94a88;box-sizing:border-box">'
    +'<img src="'+SHM_ART+'" alt="" loading="lazy" decoding="async" data-old="'+SHM_OLD+'" onerror="if(!this.__f){this.__f=1;this.src=this.dataset.old}else{this.hidden=true}" style="flex:none;width:84px;height:84px;border-radius:12px;background:#16110d;border:2px solid #4a3a2b;object-fit:contain">'
    +'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;justify-content:center"><b style="font-family:\'Lilita One\',sans-serif;font-size:16px;line-height:1.1">'+shmEsc(p.name)+'</b>'
    +'<span style="font-size:12px;font-weight:900;color:#ffc94a">Montaria '+shmEsc(rn)+'</span><span style="font-size:12px;font-weight:700;color:#c9b9a2">Vem inteira, uma vez por conta. Sem sorteio.</span>'+act+'</div></div>';
  return {html,click:shMechaClick};
}
/* clique do cartão: sem compra real (ready falso) só avisa "Pagamento em breve"; com ela, compra pelo Sys.buy (a entrega é do próprio Sys.buy) */
function shMechaClick(b){
  if(!b||!b.dataset||b.dataset.x!=='shm-buy') return false;
  const toast_=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
  try{ if(typeof snd==='function') snd('ui_tap'); }catch(e){}
  const p=shmProduct(); if(!p||shmOwned(p)) return true;
  if(!shmReady()){ toast_('Pagamento em breve'); return true; }
  try{ Promise.resolve(Sys.buy.purchase(S,Sys.host,p.id)).then(r=>{ toast_(r&&r.ok?'Mecha de Guerra é sua!':'Compra não concluída'); try{ if(typeof statsChanged==='function') statsChanged(); if(typeof render==='function') render(); }catch(e){} },()=>toast_('Compra não concluída')); }catch(e){ toast_('Compra não concluída'); }
  return true; }
window.shMechaCard=shMechaCard; window.shMechaClick=shMechaClick;
