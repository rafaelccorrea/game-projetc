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
  gems:300, goldk:0,       // dono 14/11: a oferta paga NÃO dá ouro (era 2.000 abates ≈ 83 min; ouro pago compra melhoria). docs/ECONOMIA_OURO.md §6
  skin:null,               // GANCHO (dono, 12/11): id de uma das 5 skins novas (Sys.appearance, sources:['offer']); null = a oferta segue como hoje    // goldk = 2.000 × o ouro de um abate da fase (≈ 2 h de farm)
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const Sys=()=>root.Sys||{};
const skinId=S=>{ const A=Sys().appearance, sk=DATA.skin||(A&&A.DATA&&A.DATA.skinsOn===true?A.DATA.offerSkin:null); if(!sk) return null; return typeof sk==='object'?sk[S&&S.hero==='kaia'?'kaia':'kael']:sk; };
const skinName=S=>{ const A=Sys().appearance, id=skinId(S), k=id&&A&&A.FIXED?A.FIXED.find(x=>x.id===id):null; return k?k.name:null; };
function ensure(S,host){ if(!S||typeof S!=='object') throw new Error('Sys.offer.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.offer; if(!o||typeof o!=='object') o=S.sys.offer={}; o.v=1; o.seen=num(o.seen,0); o.claimed=o.claimed===true; o.bought=o.bought===true;
  if(!o.seen&&host&&DATA.on===true) o.seen=nowOf(host);   // o relógio de 24 h começa no 1º acesso COM a oferta ligada
  return o; }
/* D11 (PO): a oferta só aparece para quem NUNCA comprou nada. Sem servidor, conta como compra: host.hasPurchased() (se o jogo tiver), pontos de VIP
   (Sys.vip, só vêm de compra), passe premium (Sys.pass) ou markPurchase(S) chamado pelo jogo em qualquer compra. Com servidor: GET /purchases/can-buy. */
function hasPurchased(S,host){ try{ if(host&&typeof host.hasPurchased==='function'&&host.hasPurchased()) return true; }catch(e){}
  const o=S&&S.sys&&S.sys.offer; if(o&&o.bought===true) return true;
  if(S&&S.sys&&S.sys.vip&&int0(S.sys.vip.points)>0) return true; if(S&&S.sys&&S.sys.pass&&S.sys.pass.premium===true) return true; return false; }
const markPurchase=(S,host)=>{ ensure(S,host).bought=true; return true; };
/* a tela pergunta: {on, available, msLeft, claimed, expired, price, contents, reason} */
function status(S,host){ if(DATA.on!==true) return {on:false,available:false};
  const o=ensure(S,host), left=Math.max(0,o.seen+DATA.windowMs-nowOf(host)), bought=!o.claimed&&hasPurchased(S,host);
  return {on:true,available:!o.claimed&&!bought&&left>0,reason:o.claimed?'done':bought?'not_first_purchase':left<=0?'expired':'',msLeft:left,claimed:o.claimed,expired:!o.claimed&&left<=0,price:DATA.priceBRL,
    contents:{skin:skinName(S),weapon:'Arma Épica 3★',mount:(Sys().mount&&Sys().mount.info?Sys().mount.info(S,host,DATA.mount).name:DATA.mount),gems:DATA.gems,goldk:DATA.goldk}}; }
/* ENTREGA depois da compra confirmada. Uma vez só. {ok, weapon, mount, gems, gold} ou {ok:false, reason: off|done|expired} */
function grant(S,host,opts){ if(DATA.on!==true) return {ok:false,reason:'off'}; const o=ensure(S,host);
  if(o.claimed) return {ok:false,reason:'done'}; if(!(opts&&opts.ignoreWindow)&&nowOf(host)>o.seen+DATA.windowMs) return {ok:false,reason:'expired'};
  const ST=Sys().stats, L=Sys().level, lv=L&&L.level?L.level(S):int0(host&&host.level&&host.level())||1, era=int0(host&&host.eraMax&&host.eraMax());
  const W=DATA.weapon, w={slot:W.slot,e:era,r:W.r,lvl:Math.max(1,lv),gold:0,look:era,qp:W.qp,subs:W.subs.map(x=>({k:x.k,q:x.q})),offer:true};
  if(ST&&ST.offerSync) ST.offerSync(w,S,host); if(host&&host.addItem) host.addItem(w);
  const M=Sys().mount, mount=M&&M.add?M.add(S,host,DATA.mount):null;
  if(host&&host.addGems) host.addGems(DATA.gems);
  const unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)), gold=Math.round(int0(DATA.goldk)*unit); if(gold>0&&host&&host.addGold) host.addGold(gold);
  const A=Sys().appearance, sid=skinId(S), skin=sid&&A&&A.grantFixed?A.grantFixed(S,sid,{source:'offer'}):null;
  o.claimed=true; return {ok:true,weapon:w,mount,gems:DATA.gems,gold,skin}; }
/* com servidor: a janela vem do GET /offers (endsAt, relógio do servidor). O seen passa a ser endsAt − 24 h, e o relógio do aparelho não manda mais. */
function setWindow(S,endsAt){ const e=num(endsAt,0); if(!(e>0)) return false; const o=ensure(S); o.seen=e-DATA.windowMs; o.server=true; return true; }
const API={DATA,ensure,status,grant,setWindow,hasPurchased,markPurchase};
root.Sys=root.Sys||{}; root.Sys.offer=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
