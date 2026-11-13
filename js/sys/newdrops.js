/* Eonbound — Sys.newDrops: ENTREGAS dos itens NOVOS aprovados pelo dono (13/11; docs/PROPOSTA_NOVOS_ITENS.md): 9 pets, 10 montarias, 8 asas, Mecha na loja.
   UMA tabela de fontes → prêmios; cada fonte (torre, arena, torneio, guilda, eventos, chefes, instância, atividade, missões, VIP, loja) chama
   grant(S, host, fonte, ctx) no momento em que já paga o prêmio de hoje. Sem sorteio pago; nenhum diamante (a meta de ~10 mil fica).
   CHAVE DATA.on (desligada até a arte ser aprovada). Ligada, cada item ainda respeita a chave dele: Sys.pet newPets/newReady, Sys.mount newOn/newReady,
   Sys.stats newWings/newWingReady. Item não liberado: pet/montaria GUARDAM os fragmentos (nada se perde); asa não cai.
   Repetido: pet/montaria que o jogador já tem e que viria INTEIRO vira 10 fragmentos (regra de hoje), nunca o pacote inteiro.
   Uma vez só: prêmios de marco (andar da torre, nível de VIP, 1ª vitória, compra) ficam em S.sys.newdrops.done; "por dia" fica em day.
   Asa abaixo do nível das asas (Sys.loot.DATA.wing.minLevel, 50): fica guardada e sai em releaseHeld(S, host) no subir de nível. Sem DOM. */
(function(root){
'use strict';
const DATA={
  on:true,   // LIGADO (dono, 14/11, próxima versão): pet/montaria ainda sem desenho fica GUARDADO (heldPM) até o newReady dele
  // fonte → regras. pet/mount: n = fragmentos (whole = inteiro). once = só uma vez por chave. perDay = teto de vezes por dia.
  sources:{
    'tower:floor':   [{when:c=>c.floor===30,  pet:'falcon', whole:true, once:true},
                      {when:c=>c.floor===50,  mount:'raptor', whole:true, once:true},
                      {when:c=>c.floor===150, pet:'griffin', whole:true, once:true},
                      {when:c=>[120,140,160].includes(c.floor), wing:'storm', once:true}],
    // arena: league = índice da liga no fim da temporada (0 Bronze, 1 Prata, 2 Ouro, 3 Platina, 4 Diamante, 5 Mestre, 6 Lenda)
    'arena:season':  [{when:c=>c.league===2, pet:'panther', n:15}, {when:c=>c.league>=3, pet:'panther', n:30},
                      {when:c=>c.league===2, mount:'panther', n:10}, {when:c=>c.league>=3, mount:'panther', n:20},
                      {when:c=>c.league>=4, wing:'shadow'}],
    // torneio da temporada: rank = posição final (1 = primeiro)
    'tourney:season':[{when:c=>c.rank>=1&&c.rank<=10, skin:{kael:'kael_samurai'}},   // Samurai é do Kael; a Kaia não tem skin de torneio
                      {when:c=>c.rank===1, wing:'seraph'},
                      {when:c=>c.rank>=1&&c.rank<=3, pet:'icedragon', whole:true}, {when:c=>c.rank>=4&&c.rank<=10, pet:'icedragon', n:100},
                      {when:c=>c.rank>=1&&c.rank<=3, mount:'blackdragon', whole:true}, {when:c=>c.rank>=4&&c.rank<=10, mount:'blackdragon', n:50},
                      {when:c=>c.rank>=1&&c.rank<=10, wing:'phoenix'}],
    'tourney:weekend':[{when:c=>c.rank>=1&&c.rank<=100, pet:'obsidian', n:20},
                      {when:c=>c.rank>=11&&c.rank<=100, mount:'icewolf', n:10}, {when:c=>c.rank>=1&&c.rank<=10, mount:'icewolf', n:25}],
    'guild:weekly':  [{pet:'crow', n:5}, {mount:'unicorn', n:5}],
    'guild:capital': [{pet:'obsidian', n:40}, {mount:'celtiger', n:40}],
    'evtrail:top':   [{pet:'scorpion', n:20}, {mount:'scorpion', n:20}],
    // Chefe Mundial: frac = parte da vida do chefe tirada pelo jogador; monthTop = faixa de topo do mês
    'worldboss':     [{when:c=>c.frac>=0.05, pet:'griffin', n:10, perDay:1}, {when:c=>c.frac>=0.05, mount:'scorpion', n:10, perDay:1}, {when:c=>c.monthTop===true, wing:'phoenix'}],
    // chefe de ERA (fim da era, cada vitória): era 7 / 8 por dia; asa de ossos na 1ª vitória de cada dificuldade na era 7; serafim na 1ª no Hell da era 8
    'boss:era':      [{when:c=>c.era===7, pet:'wyvernpet', n:3, perDay:1}, {when:c=>c.era===7, mount:'hellhorse', n:2, perDay:1},
                      {when:c=>c.era===7, wing:'bone', once:true, key:c=>'d'+c.diff},
                      {when:c=>c.era===8, mount:'celtiger', n:2, perDay:1}, {when:c=>c.era===8&&c.diff===3, wing:'seraph', once:true}],
    // instância: type ('gear' = Arsenal, 'boss' = Chefe de Era), diff (0 Fácil … 3), first = 1ª vitória dessa dificuldade
    'inst:win':      [{when:c=>c.type==='gear'&&c.first, pet:'shadowwolf', whole:true, once:true, key:c=>'d'+c.diff},
                      {when:c=>c.type==='gear'&&c.first&&c.diff>=2, wing:'mechanical', once:true, key:c=>'d'+c.diff},
                      {when:c=>c.type==='boss'&&c.first, wing:'bone', once:true, key:c=>'d'+c.diff}],
    'activity:full': [{pet:'shadowwolf', n:2, perDay:1}, {mount:'raptor', n:1, perDay:1}],   // os 100 pontos da atividade do dia
    'missions:daily':[{pet:'falcon', n:1, perDay:1}],
    'invasion:top':  [{wing:'ice', perDay:1}],                                               // baú de topo da Invasão da Era (1 por semana na agenda)
    'vip:level':     [{when:c=>c.level>=7, skin:{kael:'kael_demon',kaia:'kaia_demon'}, once:true, key:()=>'v7'}, {when:c=>c.level>=8, mount:'phoenixm', whole:true, once:true, key:()=>'v8'}, {when:c=>c.level>=9, pet:'wyvernpet', whole:true, once:true, key:()=>'v9'}],
    'shop:product':  [{when:c=>c.productId==='mount_mecha', mount:'mecha', whole:true, once:true, key:c=>c.orderId||'mecha'},
                      {when:c=>c.productId==='skin_kael_paladin', skin:{kael:'kael_paladin'}, any:true}, {when:c=>c.productId==='skin_kaia_harlequin', skin:{kaia:'kaia_harlequin'}, any:true},
                      {when:c=>c.productId==='skin_kael_cyborg', skin:{kael:'kael_cyborg'}, any:true}],
  },
  // loja: compra DIRETA (Sys.buy entrega pelo servidor; aqui só o catálogo e a entrega local)
  shop:[{productId:'mount_mecha', name:'Mecha de guerra', kind:'mount', id:'mecha'}],   // preço: Sys.buy.priceText(productId), nunca aqui
  dupFrags:10,
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const SYS=()=>root.Sys||{};
const ON=()=>DATA.on===true;
const dayOf=host=>{ const t=num(host&&host.now&&host.now(),Date.now()); return Math.floor((t-3*3600000)/86400000); };   // dia de Brasília
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.newDrops.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.newdrops; if(!o||typeof o!=='object') o=S.sys.newdrops={}; o.v=1;
  o.done=Array.isArray(o.done)?o.done.filter(x=>typeof x==='string').slice(-500):[];
  o.day=(o.day&&typeof o.day==='object')?o.day:{}; o.heldWings=Array.isArray(o.heldWings)?o.heldWings.filter(w=>w&&typeof w.id==='string'):[];
  // pet/montaria ainda NÃO liberado no jogo (sem desenho na batalha): o prêmio fica GUARDADO aqui, por item ({'pet:crow':{whole,n}}), e entra no releaseHeld
  // quando o item for liberado (newReady um a um). Nada some e nada aparece antes da arte.
  const hp=(o.heldPM&&typeof o.heldPM==='object'&&!Array.isArray(o.heldPM))?o.heldPM:{}; o.heldPM={}; for(const k of Object.keys(hp)){ if(!/^(pet|mount):[a-z0-9_]{1,30}$/.test(k)) continue; const x=hp[k]||{}; o.heldPM[k]={whole:x.whole===true,n:int0(x.n)}; }
  return o; }
const lvlOf=(S,host)=>{ const L=SYS().level; return L&&L.level?L.level(S):int0(host&&host.level&&host.level())||1; };
const eraOf=host=>int0(host&&host.eraMax&&host.eraMax());
/* um prêmio de pet/montaria: inteiro (ou 10 se já tem) ou n fragmentos; devolve o que entrou */
/* o item já pode aparecer no jogo? pet: Sys.pet.avail (newReady/chave, v4/v17, era mínima); montaria: Sys.mount.live (newReady/chave) */
function itemLive(kind,def,host){ try{ if(kind==='pet'){ const P=SYS().pet; return P&&typeof P.avail==='function'?!!P.avail(def,host):true; } const M=SYS().mount; return M&&typeof M.live==='function'?!!M.live(def):true; }catch(e){ return false; } }
function givePetMount(S,host,kind,id,rule){ const M=kind==='pet'?SYS().pet:SYS().mount; if(!M||!M.addFragments) return null;
  const def=(M.DATA&&(kind==='pet'?M.DATA.pets:M.DATA.mounts)||[]).find(x=>x.id===id); if(!def) return null;
  if(!itemLive(kind,def,host)){ const o=ensure(S), k=kind+':'+id, h=o.heldPM[k]||(o.heldPM[k]={whole:false,n:0}); if(rule.whole) h.whole=true; else h.n+=int0(rule.n);
    return {kind,id,frags:0,whole:false,hatched:false,stored:false,held:true}; }
  const owned=!!(M.ensure&&M.ensure(S).owned&&M.ensure(S).owned[id]); const n=rule.whole?(owned?DATA.dupFrags:int0(def.hatchFrags)):int0(rule.n);
  // PORTÃO DE RARIDADE do pet (o mesmo do ovo: Sys.level.eggMaxR / Sys.loot.capEggR): acima dele os fragmentos ficam GUARDADOS e o pet nasce quando o portão abrir
  if(kind==='pet'&&!owned){ const L=SYS().level; let cap=def.r; try{ if(L&&L.eggMaxR) cap=L.eggMaxR(S,host,def.r); }catch(e){}
    if(cap<def.r){ const o=M.ensure(S); o.stored[id]=int0(o.stored[id])+n; return {kind,id,frags:n,whole:false,hatched:false,stored:true,gated:true}; } }
  const r=M.addFragments(S,id,n,host); return {kind,id,frags:n,whole:!!rule.whole&&!owned,hatched:!!(r&&r.hatched),stored:!!(r&&r.stored)}; }
/* uma asa: item de asa com a raridade do modelo, era atual, nível do jogador (atributo pelo padrão do item) */
function makeWing(S,host,id,era){ const T=SYS().stats, W=T&&T.DATA&&T.DATA.wingTypes&&T.DATA.wingTypes[id]; if(!W) return null;
  const it={slot:'wing',wing:id,r:int0(W.r),e:era,look:era,lvl:Math.max(1,lvlOf(S,host)),gold:0,src:'newdrops'}; try{ if(T.migrateItem) T.migrateItem(it); }catch(e){} return it; }
function giveWing(S,host,id){ const T=SYS().stats; if(!T||!T.wingLive||!T.wingLive(id)) return null;
  const Lt=SYS().loot, minL=num(Lt&&Lt.DATA&&Lt.DATA.wing&&Lt.DATA.wing.minLevel,50);
  if(lvlOf(S,host)<minL){ ensure(S).heldWings.push({id}); return {kind:'wing',id,held:true,needLevel:minL}; }
  const it=makeWing(S,host,id,eraOf(host)); if(it&&host&&host.addItem) host.addItem(it); return it?{kind:'wing',id,item:it}:null; }
/* skin (Sys.appearance; chave skinsOn lá): a do herói do jogador; any = produto da loja de um herói só (entrega mesmo se o jogador estiver no outro) */
function giveSkin(S,map,any){ const A=SYS().appearance; if(!A||!A.grantFixed) return null; const h=S&&S.hero==='kaia'?'kaia':'kael', id=map[h]||(any?Object.values(map)[0]:null); if(!id) return null;
  const r=A.grantFixed(S,id,{source:'reward'}); return r&&r.ok?{kind:'skin',id}:null; }
/* ENTREGA de uma fonte. ctx = dados da fonte (floor, league, rank, era, diff, first, frac, level, productId…). Devolve a lista do que entrou. */
function grant(S,host,src,ctx){ if(!ON()) return {ok:false,reason:'off',got:[]}; const R=DATA.sources[src]; if(!R) return {ok:false,reason:'source',got:[]};
  const c=ctx||{}, o=ensure(S), day=dayOf(host), got=[];
  for(const rule of R){ let ok=false; try{ ok=!rule.when||!!rule.when(c); }catch(e){ ok=false; } if(!ok) continue;
    const what=rule.pet?'pet:'+rule.pet:rule.mount?'mount:'+rule.mount:rule.skin?'skin:'+Object.values(rule.skin).join('/'):'wing:'+rule.wing, k=src+'|'+what+(rule.key?'|'+rule.key(c):rule.once&&c.floor?'|'+c.floor:'');
    if(rule.once&&o.done.includes(k)) continue;
    if(rule.perDay){ const dk=k+'@'+day; if(int0(o.day[dk])>=rule.perDay) continue; }
    const g=rule.pet?givePetMount(S,host,'pet',rule.pet,rule):rule.mount?givePetMount(S,host,'mount',rule.mount,rule):rule.skin?giveSkin(S,rule.skin,rule.any):giveWing(S,host,rule.wing);
    if(!g) continue; got.push(g);
    if(rule.once) o.done.push(k);
    if(rule.perDay){ const dk=k+'@'+day; o.day[dk]=int0(o.day[dk])+1; }
  }
  for(const dk of Object.keys(o.day)) if(+dk.split('@').pop()<day-2) delete o.day[dk];   // só os últimos dias
  return {ok:true,got}; }
/* asas guardadas por nível: chamar no subir de nível */
function releaseHeld(S,host){ const o=ensure(S), Lt=SYS().loot, minL=num(Lt&&Lt.DATA&&Lt.DATA.wing&&Lt.DATA.wing.minLevel,50);
  // pets/montarias guardados até serem liberados: entregam agora (inteiro primeiro, depois os fragmentos juntados)
  const rel=[]; if(ON()) for(const k of Object.keys(o.heldPM)){ const [kind,id]=k.split(':'), M=kind==='pet'?SYS().pet:SYS().mount, def=M&&M.DATA&&(kind==='pet'?M.DATA.pets:M.DATA.mounts||[]).find(x=>x.id===id);
    if(!def||!itemLive(kind,def,host)) continue; const h=o.heldPM[k]; delete o.heldPM[k];
    if(h.whole){ const g=givePetMount(S,host,kind,id,{whole:true}); if(g) rel.push(g); } if(h.n){ const g=givePetMount(S,host,kind,id,{n:h.n}); if(g) rel.push(g); } }
  // pets novos guardados pelo portão de raridade: nascem quando o portão abre (o que juntou vai inteiro pelo caminho normal)
  const P=SYS().pet, L=SYS().level; if(ON()&&P&&P.ensure&&P.addFragments) for(const d of (P.DATA.pets||[]).filter(x=>x.nw&&x.hatchFrags)){ const po=P.ensure(S), k=int0(po.stored[d.id]);
    if(!k||po.owned[d.id]||k<d.hatchFrags) continue; let cap=d.r; try{ if(L&&L.eggMaxR) cap=L.eggMaxR(S,host,d.r); }catch(e){} if(cap<d.r) continue; delete po.stored[d.id]; P.addFragments(S,d.id,k,host); }
  if(lvlOf(S,host)<minL) return rel;
  const out=[]; for(const w of o.heldWings.splice(0)){ const it=makeWing(S,host,w.id,eraOf(host)); if(it&&host&&host.addItem){ host.addItem(it); out.push(it); } } return rel.concat(out); }
/* modelo da asa de um drop de asa comum (Sys.loot): Rara a partir da era 2 vira a Mariposa sombria (se liberada); senão o de hoje (anjo/demônio) */
function wingTypeForDrop(era,r,diff){ const T=SYS().stats; if(int0(era)>=2&&int0(r)===1&&T&&T.wingLive&&T.wingLive('darkmoth')&&ON()) return 'darkmoth';
  return T&&T.wingForDrop?T.wingForDrop(era,diff):'angel'; }
/* loja: catálogo (a tela) e a entrega local de uma compra confirmada pelo servidor (Sys.buy chama com o productId) */
const shop=()=>DATA.shop.map(p=>{ const M=SYS().mount, live=!!(M&&M.live&&M.live((M.DATA.mounts||[]).find(x=>x.id===p.id))); return Object.assign({},p,{on:ON()&&live,soon:!(ON()&&live)}); });
const grantProduct=(S,host,productId,orderId)=>grant(S,host,'shop:product',{productId,orderId});
/* tabela legível (PO/dono): fonte → o que dá */
function table(){ const out=[]; for(const src in DATA.sources) for(const r of DATA.sources[src]) out.push({source:src,kind:r.pet?'pet':r.mount?'mount':'wing',id:r.pet||r.mount||r.wing,
  amount:r.whole?'inteiro':r.n?r.n+' fragmentos':'1 item',once:!!r.once,perDay:r.perDay||0,cond:r.when?String(r.when).replace(/^c=>/,''):''}); return out; }

const API={DATA,ensure,grant,releaseHeld,wingTypeForDrop,shop,grantProduct,table};
root.Sys=root.Sys||{}; root.Sys.newDrops=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
