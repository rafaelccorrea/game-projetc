/* Eonbound — Sys.offer: OFERTA DE PRIMEIRA COMPRA (aprovada pelo PO; reports/spec-oferta-montaria.md). R$ 29,90, uma vez só, válida por 24 h a partir do
   1º acesso. Compra DIRETA, sem sorteio: arma ÉPICA 3★ (qp 5.000, secundários fixos medianos) que ACOMPANHA o jogador até o Nv 25 (Sys.stats.offerSync)
   + montaria ÉPICA (Sys.mount) + 300 💎 + ouro de 2 h de farm. Exceção de raridade (Épica antes do Nv 25) só nesta compra paga.
   O PAGAMENTO é do jogo/servidor (engenheiro, fps-30): quando a compra for confirmada, chama Sys.offer.grant(S, host). Daqui saem só a janela e a entrega.
   CHAVE DESLIGADA (DATA.on=false). Estado: S.sys.offer {seen, claimed}. Todo relógio por host.now (a trava de relógio da fps-30 vale aqui). */
(function(root){
'use strict';
const DATA={
  on:false, id:'first_purchase', priceBRL:29.90, windowMs:24*3600*1000,
  weapon:{slot:'weapon', r:2, qp:5000, subs:[{k:'atkPct',q:0.5},{k:'critRate',q:0.5}]},
  mount:'wolf',            // a montaria Épica do catálogo do Sys.mount: Lobo de guerra
  gems:300, goldk:2000,    // goldk = 2.000 × o ouro de um abate da fase (≈ 2 h de farm)
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const Sys=()=>root.Sys||{};
function ensure(S,host){ if(!S||typeof S!=='object') throw new Error('Sys.offer.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.offer; if(!o||typeof o!=='object') o=S.sys.offer={}; o.v=1; o.seen=num(o.seen,0); o.claimed=o.claimed===true;
  if(!o.seen&&host&&DATA.on===true) o.seen=nowOf(host);   // o relógio de 24 h começa no 1º acesso COM a oferta ligada
  return o; }
/* a tela pergunta: {on, available, msLeft, claimed, expired, price, contents} */
function status(S,host){ if(DATA.on!==true) return {on:false,available:false};
  const o=ensure(S,host), left=Math.max(0,o.seen+DATA.windowMs-nowOf(host));
  return {on:true,available:!o.claimed&&left>0,msLeft:left,claimed:o.claimed,expired:!o.claimed&&left<=0,price:DATA.priceBRL,
    contents:{weapon:'Arma Épica 3★',mount:(Sys().mount&&Sys().mount.info?Sys().mount.info(S,host,DATA.mount).name:DATA.mount),gems:DATA.gems,goldk:DATA.goldk}}; }
/* ENTREGA depois da compra confirmada. Uma vez só. {ok, weapon, mount, gems, gold} ou {ok:false, reason: off|done|expired} */
function grant(S,host,opts){ if(DATA.on!==true) return {ok:false,reason:'off'}; const o=ensure(S,host);
  if(o.claimed) return {ok:false,reason:'done'}; if(!(opts&&opts.ignoreWindow)&&nowOf(host)>o.seen+DATA.windowMs) return {ok:false,reason:'expired'};
  const ST=Sys().stats, L=Sys().level, lv=L&&L.level?L.level(S):int0(host&&host.level&&host.level())||1, era=int0(host&&host.eraMax&&host.eraMax());
  const W=DATA.weapon, w={slot:W.slot,e:era,r:W.r,lvl:Math.max(1,lv),gold:0,look:era,qp:W.qp,subs:W.subs.map(x=>({k:x.k,q:x.q})),offer:true};
  if(ST&&ST.offerSync) ST.offerSync(w,S,host); if(host&&host.addItem) host.addItem(w);
  const M=Sys().mount, mount=M&&M.add?M.add(S,host,DATA.mount):null;
  if(host&&host.addGems) host.addGems(DATA.gems);
  const unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)), gold=Math.round(DATA.goldk*unit); if(host&&host.addGold) host.addGold(gold);
  o.claimed=true; return {ok:true,weapon:w,mount,gems:DATA.gems,gold}; }
const API={DATA,ensure,status,grant};
root.Sys=root.Sys||{}; root.Sys.offer=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
