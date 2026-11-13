/* Eonbound — Sys.auction: LEILÃO entre jogadores (plano APROVADO pelo PO: reports/spec-qualidade-item.md §11; travas compartilhadas com a troca da
   guilda: reports/spec-guildas.md §2; pré-condição: Cofre do Mercado, reports/backend-economia.md). Tela: js/p_auction.js (hoje demonstração desligada).
   TUDO DEPENDE DO SERVIDOR (fps-30: inventário oficial, compra atômica, prazo, histórico, moderação). Aqui, no jogo, só:
   - as REGRAS puras (taxa de anúncio, taxa de venda, durações, faixa de preço, travas do item, limites) — o servidor usa as mesmas no Node;
   - o espelho do que o servidor mandou (S.sys.auction: meus anúncios, histórico, contadores do dia);
   - um PROVIDER trocável, como a guilda/arena: sem servidor, o leilão fica FECHADO ("O leilão abre com o online"): busca vazia, anunciar/comprar = 'server'.
   REGRAS (dono/PO):
   - SÓ OURO. Nunca diamante, nunca dinheiro real (e nenhuma "moeda do leilão" por enquanto: a tela ainda mostra o botão, o PO decide).
   - ANÔNIMO: vendedor e comprador nunca aparecem (o espelho e a busca descartam qualquer campo de vendedor/comprador).
   - Só 18+ até o parecer jurídico: idade do jogador por argumento ({age}) ou host.age(); sem idade = NÃO.
   - Nível do jogador ≥ Sys.level.unlockLevel('auction') (fonte única; hoje 45).
   - TAXA DE ANÚNCIO em ouro, NÃO reembolsável (contra spam): 2% do preço (12 h: 1%, 48 h: 3%), mínimo 10 de ouro.
   - TAXA DE VENDA: 10% do preço sai do vendedor (ralo de ouro; spec §11). Comprador paga o preço cheio.
   - DURAÇÃO: 12, 24 ou 48 h. Sem venda no prazo, o item volta ao vendedor como estava (a taxa de anúncio não volta).
   - O item CHEGA NO NÍVEL 1 e com ouro investido 0; o vendedor recebe 50% do ouro investido AO ANUNCIAR (como na troca da guilda e no desmontar;
     o servidor RECALCULA o ouro investido pelo Sys.stats.upgradeCost — o item.gold do aparelho é só a estimativa local).
   - NUNCA entra: item comprado com 💎/dinheiro (offer/bought, origem shop_gem|offer|pass_premium), pets, skins, VIP, montarias, fragmentos,
     materiais, moedas. Item obtido há menos de 24 h também não.
   - LIMITES por dia: anunciar 5, comprar 10; no máximo 10 anúncios ativos ao mesmo tempo.
   - FAIXA DE PREÇO (contra lavagem de ouro): 0,5× a 5× o VALOR DE REFERÊNCIA do item (refValue: o ouro para levar um item igual, novo, do nível 1
     ao 20 pela tabela do Sys.stats, × qualidade), arredondado, mínimo 100 de ouro.
   - PORTÕES valem para quem COMPRA: item acima da raridade permitida chega GUARDADO (held) e item de era futura chega ADORMECIDO (dormant). Aqui só
     a marca; a guarda é do Sys.loot/servidor.
   CHAVE DESLIGADA (DATA.on=false): desligada, status() diz {on:false}, canList/canBuy/list/buy/cancel/search dizem {ok:false,reason:'off'} e nada
   muda no save. As contas puras (feeOf, taxOf, priceRange, refValue, itemTradable, received) funcionam sempre (o servidor reaproveita). */
(function(root){
'use strict';
const DATA={
  on:false,
  currency:'gold',                                   // só ouro (dono)
  adult:18,                                          // 18+ até o parecer jurídico
  hours:[12,24,48],                                  // durações do anúncio
  fee:{pct:{12:0.01,24:0.02,48:0.03}, min:10},       // taxa de anúncio (não reembolsável) sobre o preço
  tax:0.10,                                          // taxa de venda, sai do vendedor
  goldBack:0.5,                                      // 50% do ouro investido volta ao vendedor ao anunciar
  itemAgeH:24,                                       // item obtido há menos de 24 h não entra
  perDay:{list:5, buy:10}, maxActive:10,
  price:{minMult:0.5, maxMult:5, floor:100, refLevels:20},
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],
  blocked:['offer','bought','shop_gem','pet','skin','vip','mount','frag','material','currency'],
  blockedOrigin:['shop_gem','offer','pass_premium'],
  logMax:50,
  text:{soon:'O leilão abre com o online'},
};
const REASON={off:'O leilão está desligado',server:'O leilão abre com o online',level:'Libera num nível mais alto',adult:'Só para maiores de 18 anos',
  kind:'Este item não entra no leilão',bought:'Item comprado com diamante não entra no leilão',item_age:'Item novo: espere 24 h para anunciar',
  hours:'Escolha 12, 24 ou 48 horas',price_low:'Preço abaixo do mínimo',price_high:'Preço acima do máximo',money:'Ouro insuficiente',
  day_limit:'Limite do dia atingido',active_limit:'Limite de anúncios ativos',equipped:'Tire o item do personagem antes',mine:'Este anúncio é seu',
  ended:'Este anúncio já terminou',listing:'Anúncio inválido',in_auction:'Este item já está no leilão'};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const H=3600*1000;
const off=()=>({ok:false,reason:'off',text:REASON.off});
const no=(reason,x)=>Object.assign({ok:false,reason,text:REASON[reason]||''},x||{});
const dayKey=ms=>{ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
const playerLevel=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); return int0(host&&host.level&&host.level())||1; };
const needLevel=()=>{ const L=root.Sys&&root.Sys.level; return L&&L.unlockLevel?L.unlockLevel('auction'):45; };
const ageOf=(host,me)=>{ if(me&&me.age!=null) return num(me.age,0); return num(host&&typeof host.age==='function'?host.age():null,0); };
const reasonText=r=>REASON[r]||'';

/* ---------- regras puras (o servidor usa as mesmas) ---------- */
const validHours=h=>DATA.hours.includes(num(h,0));
/* taxa de anúncio (não reembolsável): % do preço pela duração, mínimo DATA.fee.min */
function feeOf(price,hours){ const h=validHours(hours)?hours:24, p=int0(price); return Math.max(DATA.fee.min,Math.ceil(p*DATA.fee.pct[h])); }
/* taxa de venda (sai do vendedor) */
const taxOf=price=>Math.ceil(int0(price)*DATA.tax);
/* resumo para a tela "Vender": {buyerPays, fee, tax, net (o que o vendedor recebe na venda), goldBack (ao anunciar)} */
function summary(price,hours,item){ const p=int0(price); return {buyerPays:p,fee:feeOf(p,hours),tax:taxOf(p),net:p-taxOf(p),goldBack:goldBackOf(item)}; }
const goldBackOf=item=>Math.floor(int0(item&&item.gold)*DATA.goldBack);
/* custo de 1 nível (Sys.stats.upgradeCost quando carregado; sem ele, a mesma tabela padrão: 20·1,06^(n−1)·(1+0,6r)·3,5^era) */
function levelCost(n,r,e){ const St=root.Sys&&root.Sys.stats; if(St&&typeof St.upgradeCost==='function') return int0(St.upgradeCost({lvl:n,r,e}).gold);
  return Math.floor(20*Math.pow(1.06,n-1)*(1+r*0.6)*Math.pow(3.5,e)); }
const qMult=item=>{ const St=root.Sys&&root.Sys.stats; return St&&typeof St.qualityMult==='function'?num(St.qualityMult(item),1):1; };
/* VALOR DE REFERÊNCIA do item (não depende do nível nem do ouro investido, que zeram na venda): ouro para levar um igual do Nv 1 ao Nv 20, × qualidade */
function refValue(item){ const r=clamp(int0(item&&item.r),0,9), e=clamp(int0(item&&item.e),0,99); let g=0;
  for(let n=1;n<DATA.price.refLevels;n++) g+=levelCost(n,r,e); return Math.max(1,Math.round(g*qMult(item))); }
/* faixa de preço permitida: {min, max, ref} */
function priceRange(item){ const P=DATA.price, ref=refValue(item); const min=Math.max(P.floor,Math.round(ref*P.minMult)); return {min,max:Math.max(min,Math.round(ref*P.maxMult)),ref}; }
/* o item pode entrar no leilão? (forma e origem; idade/uso o canList confere) {ok, reason: kind|bought} */
function itemTradable(item){ if(!item||typeof item!=='object'||!DATA.slots.includes(item.slot)) return no('kind');
  if(item.offer===true||item.bought===true||DATA.blockedOrigin.includes(String(item.origin||''))) return no('bought');
  if(DATA.blocked.includes(item.kind)) return no('kind'); return {ok:true}; }
/* o item como CHEGA ao comprador: nível 1, ouro investido 0, origem 'auction'; qualidade, era, raridade e secundários ficam */
function received(item){ const o=JSON.parse(JSON.stringify(item||{})); o.lvl=1; o.gold=0; delete o.gotAt; delete o.goldEstimated; o.origin='auction'; return o; }

/* ---------- espelho do servidor no save: S.sys.auction ---------- */
/* anúncio saneado e ANÔNIMO: {id, item (como chega: Nv 1), price, hours, endsAt, mine, state: active|sold|expired|cancelled} */
function normListing(x){ if(!x||typeof x!=='object'||x.id==null||!x.item) return null;
  return {id:String(x.id),item:received(x.item),price:int0(x.price),hours:validHours(x.hours)?x.hours:24,endsAt:int0(x.endsAt),mine:x.mine===true,
    state:['active','sold','expired','cancelled'].includes(x.state)?x.state:'active'}; }
const normLog=x=>(x&&typeof x==='object'&&(x.k==='sale'||x.k==='buy'))?{k:x.k,slot:String((x.item&&x.item.slot)||x.slot||''),r:int0(x.item?x.item.r:x.r),e:int0(x.item?x.item.e:x.e),price:int0(x.price),gold:num(x.gold,0)|0,t:int0(x.t)}:null;
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.auction.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.auction; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.auction={}; o.v=1;
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={key:typeof d.key==='string'?d.key:'',listed:int0(d.listed),bought:int0(d.bought)};
  o.mine=Array.isArray(o.mine)?o.mine.map(normListing).filter(Boolean).slice(0,DATA.maxActive*3):[];
  o.log=Array.isArray(o.log)?o.log.map(normLog).filter(Boolean).slice(-DATA.logMax):[];
  return o; }
function dayOf(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day.key!==k) o.day={key:k,listed:0,bought:0}; return o.day; }

/* ---------- PROVIDER: o servidor troca este objeto ---------- */
const closedProvider={ online:false,
  status:()=>({open:false,reason:'server'}),
  search:()=>({ok:true,online:false,list:[],total:0,text:DATA.text.soon}),
  list:()=>({ok:false,reason:'server'}), buy:()=>({ok:false,reason:'server'}), cancel:()=>({ok:false,reason:'server'}), sync:()=>({ok:false,reason:'server'}) };
let provider=closedProvider;
function setProvider(p){ provider=p&&typeof p==='object'?Object.assign({},closedProvider,p):closedProvider; return provider.online===true; }

/* aplica o que o servidor mandou (GET /auction/me): {mine:[anúncios], log:[{k:'sale'|'buy', item, price, gold, t}], day:{listed, bought}} */
function applyServer(S,data,host){ const o=ensure(S); if(!data||typeof data!=='object') return {ok:false,reason:'data'};
  if(Array.isArray(data.mine)) o.mine=data.mine.map(x=>normListing(Object.assign({},x,{mine:true}))).filter(Boolean);
  if(Array.isArray(data.log)) o.log=data.log.map(normLog).filter(Boolean).slice(-DATA.logMax);
  if(data.day&&typeof data.day==='object'){ const d=dayOf(S,host); d.listed=int0(data.day.listed); d.bought=int0(data.day.bought); }
  ensure(S); return {ok:true}; }

/* ---------- para a tela ---------- */
/* {on, open, online, reason: off|level|server|'', needLevel, text, limits, left:{list, buy}, active} */
function status(S,host){ if(!ON()) return {on:false,open:false,reason:'off'}; const nl=needLevel(), lv=playerLevel(S,host);
  if(lv<nl) return {on:true,open:false,online:provider.online===true,reason:'level',needLevel:nl,text:REASON.level};
  const ps=provider.status?provider.status(S,host)||{}:{open:false};
  if(!ps.open) return {on:true,open:false,online:false,reason:ps.reason||'server',needLevel:nl,text:DATA.text.soon};
  const d=dayOf(S,host), a=activeCount(S);
  return {on:true,open:true,online:true,reason:'',needLevel:nl,text:'',limits:{list:DATA.perDay.list,buy:DATA.perDay.buy,active:DATA.maxActive},
    left:{list:Math.max(0,DATA.perDay.list-d.listed),buy:Math.max(0,DATA.perDay.buy-d.bought)},active:a}; }
const activeCount=S=>ensure(S).mine.filter(x=>x.state==='active').length;
/* portão comum: chave, nível, servidor, idade */
function gate(S,host,me){ const st=status(S,host); if(!st.on) return off(); if(!st.open) return no(st.reason,{needLevel:st.needLevel});
  if(ageOf(host,me)<DATA.adult) return no('adult'); return null; }
/* pode anunciar? {ok, reason, fee, tax, net, goldBack, range} — me: {age, equipped?} (o servidor confere tudo de novo) */
function canList(S,host,item,price,hours,me){ const g=gate(S,host,me); if(g) return g; const o=ensure(S), now=nowOf(host);
  const it=itemTradable(item); if(!it.ok) return it;
  if(me&&me.equipped===true) return no('equipped');
  if(item.id!=null&&o.mine.some(x=>x.state==='active'&&x.item&&x.item.id===item.id)) return no('in_auction');
  if(int0(item.gotAt)&&now-int0(item.gotAt)<DATA.itemAgeH*H) return no('item_age',{msLeft:DATA.itemAgeH*H-(now-int0(item.gotAt))});
  if(!validHours(hours)) return no('hours',{hours:DATA.hours.slice()});
  const range=priceRange(item), p=int0(price);
  if(p<range.min) return no('price_low',{range}); if(p>range.max) return no('price_high',{range});
  const d=dayOf(S,host); if(d.listed>=DATA.perDay.list) return no('day_limit'); if(activeCount(S)>=DATA.maxActive) return no('active_limit');
  const sm=summary(p,hours,item);
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(sm.fee)) return no('money',{fee:sm.fee});
  return Object.assign({ok:true,range},sm); }
/* anuncia: confere localmente e manda ao servidor. Quem move ouro/item é o servidor (Cofre do Mercado); o jogo aplica o que ele confirmar. */
function list(S,host,item,price,hours,me){ const c=canList(S,host,item,price,hours,me); if(!c.ok) return c;
  const r=provider.list({item,price:int0(price),hours,fee:c.fee,goldBack:c.goldBack},S,host)||{};
  if(!r.ok) return no(r.reason||'server');
  const o=ensure(S), d=dayOf(S,host); d.listed++;
  const L=normListing({id:r.id!=null?r.id:('l'+nowOf(host)),item:Object.assign({},item),price:int0(price),hours,endsAt:int0(r.endsAt)||nowOf(host)+hours*H,mine:true,state:'active'});
  if(L){ L.item.id=item.id; o.mine.push(L); }
  return {ok:true,id:L&&L.id,fee:c.fee,goldBack:c.goldBack,net:c.net,endsAt:L&&L.endsAt}; }
/* pode comprar? {ok, reason, price, held (acima da raridade: chega GUARDADO), dormant (era futura: chega ADORMECIDO)} */
function canBuy(S,host,listing,me){ const g=gate(S,host,me); if(g) return g; const L=normListing(listing); if(!L) return no('listing');
  if(L.mine) return no('mine'); if(L.state!=='active'||(L.endsAt&&L.endsAt<=nowOf(host))) return no('ended');
  const d=dayOf(S,host); if(d.bought>=DATA.perDay.buy) return no('day_limit');
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(L.price)) return no('money',{price:L.price});
  return Object.assign({ok:true,price:L.price},buyerGate(host,L.item)); }
/* portões de quem recebe: {held, dormant} (só a marca; a guarda é do Sys.loot/servidor) */
function buyerGate(host,item){ const Lo=root.Sys&&root.Sys.loot; let held=false, dormant=false;
  if(Lo&&typeof Lo.maxAllowedR==='function'&&host) held=int0(item&&item.r)>Lo.maxAllowedR(host);
  if(host&&typeof host.eraMax==='function') dormant=int0(item&&item.e)>int0(host.eraMax());
  return {held,dormant}; }
function buy(S,host,listing,me){ const c=canBuy(S,host,listing,me); if(!c.ok) return c;
  const r=provider.buy({id:String(listing.id),price:c.price},S,host)||{}; if(!r.ok) return no(r.reason||'server');
  const o=ensure(S), d=dayOf(S,host); d.bought++; const it=received(r.item||listing.item);
  o.log.push(normLog({k:'buy',item:it,price:c.price,gold:-c.price,t:nowOf(host)})); if(o.log.length>DATA.logMax) o.log.shift();
  return {ok:true,item:it,price:c.price,held:c.held,dormant:c.dormant}; }
/* cancela um anúncio meu: o item volta como estava; a taxa de anúncio NÃO volta */
function cancel(S,host,id){ if(!ON()) return off(); const o=ensure(S), L=o.mine.find(x=>x.id===String(id)&&x.state==='active'); if(!L) return no('listing');
  const r=provider.cancel({id:L.id},S,host)||{}; if(!r.ok) return no(r.reason||'server'); L.state='cancelled'; return {ok:true,id:L.id}; }
/* busca (aba Comprar): q = {slot, e, r, minStars, sort:'end'|'price', page}. Offline: lista vazia + texto. Sempre ANÔNIMO. */
function search(S,host,q){ if(!ON()) return {on:false,ok:false,reason:'off',online:false,list:[],total:0};
  const st=status(S,host); if(!st.open) return {on:true,ok:true,online:false,reason:st.reason,list:[],total:0,text:st.text};
  const r=provider.search(Object.assign({sort:'end',page:0},q||{}),S,host)||{};
  const L=(Array.isArray(r.list)?r.list:[]).map(normListing).filter(Boolean);
  return {on:true,ok:r.ok!==false,online:r.online!==false,list:L,total:int0(r.total)||L.length,text:r.text||''}; }
/* meus anúncios (espelho), mais novo primeiro, com o tempo que falta */
function myListings(S,host){ const t=nowOf(host); return ensure(S).mine.slice().sort((a,b)=>b.endsAt-a.endsAt).map(x=>Object.assign({},x,{msLeft:x.state==='active'?Math.max(0,x.endsAt-t):0})); }
/* histórico (espelho), mais novo primeiro */
const history=S=>ensure(S).log.slice().reverse();
/* aba Vender: cada item da mochila com {item, ok, reason, text, range}; inv = lista de itens, eq = {slot: id} equipados */
function sellable(S,host,inv,eq){ const now=nowOf(host), o=ensure(S);
  return (Array.isArray(inv)?inv:[]).filter(x=>x&&typeof x==='object').map(item=>{ const t=itemTradable(item);
    let reason=t.ok?'':t.reason;
    if(!reason&&eq&&item.id!=null&&eq[item.slot]===item.id) reason='equipped';
    if(!reason&&item.id!=null&&o.mine.some(x=>x.state==='active'&&x.item.id===item.id)) reason='in_auction';
    if(!reason&&int0(item.gotAt)&&now-int0(item.gotAt)<DATA.itemAgeH*H) reason='item_age';
    return {item,ok:!reason,reason,text:reasonText(reason),range:t.ok?priceRange(item):null}; }); }
/* textos das regras (folha "Regras"), já com os números */
function rulesText(){ const pc=h=>Math.round(DATA.fee.pct[h]*100)+'%';
  return ['Preço só em ouro. Nunca diamante nem dinheiro real.',
    'Vendedor e comprador não aparecem: o leilão é anônimo.',
    'Só para maiores de '+DATA.adult+' anos.',
    'Taxa de anúncio (não volta): '+DATA.hours.map(h=>pc(h)+' em '+h+' h').join(', ')+', mínimo '+DATA.fee.min+' de ouro.',
    'Taxa de venda: '+Math.round(DATA.tax*100)+'% do preço sai do vendedor.',
    'Ao anunciar, o item sai da sua coleção e você recebe metade do ouro investido. Se não vender no prazo, volta.',
    'Item vendido chega ao comprador no nível 1.',
    'Pets, skins, VIP, montarias, materiais e itens comprados com diamante não entram.',
    'Item ganho há menos de '+DATA.itemAgeH+' h não entra.',
    'Por dia: anunciar '+DATA.perDay.list+', comprar '+DATA.perDay.buy+'. Até '+DATA.maxActive+' anúncios ao mesmo tempo.',
    'Preço entre '+String(DATA.price.minMult).replace('.',',')+'× e '+DATA.price.maxMult+'× o valor do item.',
    'Item acima da sua raridade chega guardado; de era futura, adormecido.']; }

const API={DATA,REASON,reasonText,ensure,setProvider,applyServer,status,feeOf,taxOf,summary,goldBackOf,refValue,priceRange,itemTradable,received,normListing,
  canList,list,canBuy,buy,buyerGate,cancel,search,myListings,history,sellable,rulesText,validHours,
  get provider(){ return provider; }};
root.Sys=root.Sys||{}; root.Sys.auction=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
