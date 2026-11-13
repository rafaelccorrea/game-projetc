/* Eonbound — Sys.loadouts: 3 CONJUNTOS SALVOS (Fases / Arena / Chefe). docs/IDLE_PARECIDOS.md §3 item 5 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   Um conjunto guarda as PEÇAS dos 7 espaços do Sys.stats (arma, armadura, elmo, luvas, botas, colar e ASA, que é uma peça do espaço 'wing'), o PET e a
   MONTARIA. As MAGIAS não são copiadas aqui: o Sys.grimoire já tem um conjunto por modo (fases/arena/chefe) e a batalha lê Sys.grimoire.loadout(S, modo);
   este módulo usa os MESMOS nomes de modo e só mostra as magias do modo no view (fonte única = Sys.grimoire). Trocar num toque = apply(S, modo, host).
   - save(S, modo, host): fotografa o que está equipado agora (host.equipped(), Sys.pet, Sys.mount).
   - apply(S, modo, host): equipa pelo host.equip(item) (o mesmo do jogo e da Fogueira), PULANDO peça que não existe mais (desmontada, vendida, fundida),
     peça que o espaço ainda não aceita (Sys.stats.canEquip: asa antes do nível) e pet/montaria que o jogador não tem ou que ainda estão trancados.
     Espaço vazio no conjunto NÃO tira a peça do herói (nunca deixa o herói pelado). Pet e montaria trocam por Sys.pet.equip / Sys.mount.equip (com a
     regra "trocar sem perder" de cada um, se ligada). Nada é gasto: trocar é grátis e sem limite.
   - modeFor({boss, pvp}) = Sys.grimoire.modeFor (mesma regra: Arena/Torneio = arena, chefe/Senhor/Chefe Mundial = chefe, resto = fases).
   - auto (opção do jogador, desligada): forBattle(S, host, ctx) troca sozinho para o conjunto do modo antes da luta, se ele existir.
   Nada pago, nada sorteado. Estado: S.sys.loadouts {v, sets:{fases|arena|chefe:{gear:{espaço:id}, pet, mount, at}}, cur, auto}. Sem DOM.
   Teste: test/sys/loadouts.test.js */
(function(root){
'use strict';

const DATA={
  on:false,
  modes:['fases','arena','chefe'],
  modeName:{fases:'Fases',arena:'Arena',chefe:'Chefe'},
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],   // = Sys.stats.DATA.slots (lido de lá quando carregado)
  needLevel:0,   // PROPOSTA: abre junto com a mochila (sem portão). O PO pode pôr um nível aqui.
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const isMode=m=>DATA.modes.includes(m);
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const slots=()=>{ const T=SYS().stats; return T&&T.DATA&&Array.isArray(T.DATA.slots)?T.DATA.slots:DATA.slots; };
const idKey=v=>v==null?null:(typeof v==='number'||typeof v==='string')?v:null;
const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
const levelOf=(S,host)=>{ const L=SYS().level; try{ if(L&&L.level) return L.level(S); }catch(e){} return int0(host&&host.level&&host.level())||1; };
const unlocked=(S,f)=>{ const L=SYS().level; try{ return !(L&&L.isUnlocked)||L.isUnlocked(S,f); }catch(e){ return true; } };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.loadouts.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.loadouts; if(!o||typeof o!=='object') o=S.sys.loadouts={};
  o.v=1; const sets=(o.sets&&typeof o.sets==='object')?o.sets:{}; o.sets={};
  for(const m of DATA.modes){ const x=sets[m]; if(!x||typeof x!=='object') continue; const g={};
    if(x.gear&&typeof x.gear==='object') for(const s of slots()){ const id=idKey(x.gear[s]); if(id!=null) g[s]=id; }
    o.sets[m]={gear:g,pet:typeof x.pet==='string'?x.pet:null,mount:typeof x.mount==='string'?x.mount:null,at:int0(x.at)}; }
  o.cur=isMode(o.cur)?o.cur:null; o.auto=o.auto===true;
  return o; }

/* ---------------- leitura do que está equipado ---------------- */
function equippedNow(host){ let e=null; try{ e=host&&typeof host.equipped==='function'?host.equipped():null; }catch(x){ e=null; } const out={};
  if(Array.isArray(e)){ for(const it of e) if(it&&it.slot) out[it.slot]=it; } else if(e&&typeof e==='object') for(const k in e) if(e[k]) out[(e[k]&&e[k].slot)||k]=e[k];
  return out; }
function bag(host){ try{ const b=host&&host.items?(typeof host.items==='function'?host.items():host.items):[]; return Array.isArray(b)?b:[]; }catch(e){ return []; } }
const findItem=(host,id)=>bag(host).find(it=>it&&same(it.id,id))||null;
const petNow=S=>{ const P=SYS().pet; try{ return P&&P.ensure?P.ensure(S).eq||null:null; }catch(e){ return null; } };
const mountNow=S=>{ const M=SYS().mount; try{ return M&&M.ensure?M.ensure(S).eq||null:null; }catch(e){ return null; } };

/* ---------------- salvar ---------------- */
/* fotografa o equipado agora no conjunto do modo. {ok, mode, set} | {ok:false, reason: off|mode} */
function save(S,mode,host){ if(!on()) return {ok:false,reason:'off'}; if(!isMode(mode)) return {ok:false,reason:'mode'};
  const o=ensure(S), eq=equippedNow(host), g={};
  for(const s of slots()){ const it=eq[s]; if(it&&it.id!=null) g[s]=it.id; }
  o.sets[mode]={gear:g,pet:petNow(S),mount:mountNow(S),at:nowOf(host)}; o.cur=mode;
  changed(host); return {ok:true,mode,set:JSON.parse(JSON.stringify(o.sets[mode]))}; }
/* apaga o conjunto do modo */
function clear(S,mode,host){ if(!on()) return {ok:false,reason:'off'}; if(!isMode(mode)) return {ok:false,reason:'mode'}; const o=ensure(S); delete o.sets[mode]; if(o.cur===mode) o.cur=null; changed(host); return {ok:true,mode}; }

/* ---------------- aplicar ---------------- */
/* o que o apply faria (sem mudar nada): {ok, mode, changes:[{kind:'gear'|'pet'|'mount', slot?, id}], skipped:[{kind, slot?, id, reason:'gone'|'locked'|'slot'}], same} */
function plan(S,mode,host){ if(!on()) return {ok:false,reason:'off'}; if(!isMode(mode)) return {ok:false,reason:'mode'};
  const o=ensure(S), set=o.sets[mode]; if(!set) return {ok:false,reason:'empty'};
  const T=SYS().stats, lv=levelOf(S,host), eq=equippedNow(host), changes=[], skipped=[];
  for(const s of slots()){ const id=set.gear[s]; if(id==null) continue; const cur=eq[s]; if(cur&&same(cur.id,id)) continue;
    const it=findItem(host,id); if(!it){ skipped.push({kind:'gear',slot:s,id,reason:'gone'}); continue; }
    if(it.slot!==s){ skipped.push({kind:'gear',slot:s,id,reason:'slot'}); continue; }
    if(T&&typeof T.canEquip==='function'&&!T.canEquip(it,lv)){ skipped.push({kind:'gear',slot:s,id,reason:'locked'}); continue; }
    changes.push({kind:'gear',slot:s,id,item:it}); }
  const P=SYS().pet; if(set.pet&&P&&!same(petNow(S),set.pet)){ let own=false; try{ own=!!P.ensure(S).owned[set.pet]; }catch(e){}
    if(!own) skipped.push({kind:'pet',id:set.pet,reason:'gone'}); else changes.push({kind:'pet',id:set.pet}); }   // pet trancado: o Sys.pet.equip recusa e o apply marca 'locked'
  const M=SYS().mount; if(set.mount&&M&&!same(mountNow(S),set.mount)){ let own=false; try{ own=!!M.ensure(S).owned[set.mount]; }catch(e){}
    if(!own) skipped.push({kind:'mount',id:set.mount,reason:'gone'}); else if(!unlocked(S,'mount')) skipped.push({kind:'mount',id:set.mount,reason:'locked'}); else changes.push({kind:'mount',id:set.mount}); }
  return {ok:true,mode,changes,skipped,same:changes.length===0}; }

/* troca num toque. {ok, mode, equipped:n, changes, skipped} — pula o que não existe mais ou ainda não pode; espaço vazio no conjunto não desequipa */
function apply(S,mode,host){ const p=plan(S,mode,host); if(!p.ok) return p; const done=[], skipped=p.skipped.slice();
  for(const c of p.changes){ let ok=false;
    try{ if(c.kind==='gear') ok=!!(host&&typeof host.equip==='function'&&host.equip(c.item));
      else if(c.kind==='pet') ok=!!SYS().pet.equip(S,c.id);
      else if(c.kind==='mount') ok=!!SYS().mount.equip(S,c.id); }catch(e){ ok=false; }
    if(ok) done.push({kind:c.kind,slot:c.slot,id:c.id}); else skipped.push({kind:c.kind,slot:c.slot,id:c.id,reason:'locked'}); }
  ensure(S).cur=mode; if(done.length) changed(host);
  return {ok:true,mode,equipped:done.length,changes:done,skipped}; }

/* modo da batalha → conjunto (mesma regra do Grimório) */
function modeFor(ctx){ const G=SYS().grimoire; if(G&&typeof G.modeFor==='function') return G.modeFor(ctx); ctx=ctx||{}; if(ctx.pvp||ctx.arena) return 'arena'; if(ctx.boss||ctx.worldBoss) return 'chefe'; return 'fases'; }
/* opção do jogador: trocar sozinho antes da luta */
function setAuto(S,v){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); o.auto=!!v; return {ok:true,auto:o.auto}; }
/* o Engenheiro chama ANTES de cada luta: com o auto ligado e o conjunto do modo salvo, aplica. {applied, mode, ...} */
function forBattle(S,host,ctx){ if(!on()) return {applied:false,reason:'off'}; const o=ensure(S), m=modeFor(ctx);
  if(!o.auto) return {applied:false,reason:'auto',mode:m}; if(!o.sets[m]) return {applied:false,reason:'empty',mode:m};
  const r=apply(S,m,host); return Object.assign({applied:r.ok&&r.equipped>0},r); }

/* ---------------- tela ---------------- */
function view(S,host){ const o=ensure(S), G=SYS().grimoire, P=SYS().pet, M=SYS().mount;
  const nm=(it)=>{ try{ return host&&host.itemName?host.itemName(it):(it&&it.name)||''; }catch(e){ return ''; } };
  return {on:on(),auto:o.auto,cur:o.cur,modes:DATA.modes.map(m=>{ const set=o.sets[m]; let spells=[];
    try{ spells=G&&G.loadout?G.loadout(S,m).map(x=>({id:x.id,name:x.name,lv:x.lv})):[]; }catch(e){ spells=[]; }
    if(!set) return {mode:m,name:DATA.modeName[m],saved:false,inUse:false,gear:[],pet:null,mount:null,spells,missing:0,at:0};
    const p=plan(S,m,host), gone=p.ok?p.skipped.length:0;
    return {mode:m,name:DATA.modeName[m],saved:true,inUse:!!(p.ok&&p.same),at:set.at,
      gear:slots().map(s=>{ const id=set.gear[s]; if(id==null) return {slot:s,id:null}; const it=findItem(host,id); return {slot:s,id,have:!!it,name:it?nm(it):'',r:it?int0(it.r):null}; }),
      pet:set.pet?{id:set.pet,name:(P&&P.DATA&&Array.isArray(P.DATA.pets)&&(P.DATA.pets.find(x=>x.id===set.pet)||{}).name)||set.pet}:null,
      mount:set.mount?{id:set.mount,name:(M&&M.DATA&&Array.isArray(M.DATA.mounts)&&(M.DATA.mounts.find(x=>x.id===set.mount)||{}).name)||set.mount}:null,
      spells,missing:gone}; })}; }

const API={DATA,on,setOn,ensure,save,clear,plan,apply,modeFor,setAuto,forBattle,view};
root.Sys=root.Sys||{}; root.Sys.loadouts=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
