/* Eonbound — Sys.crossroads: ENCRUZILHADA DAS ERAS. docs/IDLE_PARECIDOS.md §3 item 6 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   A cada 10 fases da era (fases 10, 20 ... 90 na curva de 100 fases por era do Sys.phases; na curva de hoje, 10 fases por era, a fase 5) o jogador
   escolhe 1 entre 2 BÊNÇÃOS. A bênção vale até o FIM DA ERA ATUAL (como o documento descreve): quando o jogador chega à era seguinte, as bênçãos
   da era anterior apagam e começa uma coleção nova. Na última fase da era não há encruzilhada (a bênção apagaria na hora).
   - offers(S, stage): as 2 bênçãos da encruzilhada. DETERMINÍSTICO por save + fase (semente guardada no save + chave da fase): abrir de novo, sair
     e voltar, reiniciar o app mostram SEMPRE as mesmas duas. Não existe "rolar de novo", nem grátis nem por gema (nada pago, nada sorteado na hora).
   - choose(S, stage, id): grava a escolha (uma vez por encruzilhada; não troca depois).
   - onStage(S, host, stage): o Engenheiro chama ao VENCER uma fase; devolve {due, stage, offers} quando abriu uma encruzilhada e atualiza a era.
   - bonus(S): soma das bênçãos da era atual nas chaves do Sys.fc (atkPct, hpPct, critPct, defPct, goldPct). O Sys.fc soma sozinho.
   - perks(S): o que NÃO é FC e o jogo aplica onde já existe: xpPct (XP das fontes), brasaPot (+Brasa por pote de abates do Sys.bonfire)
     e strikes {combo, counter, stun, dodge, lifesteal} (pontos somados ao perfil do Sys.strikes, dentro dos tetos dele).
   Pendente: encruzilhada aberta e não escolhida fica esperando (sem prazo) enquanto a era for a atual. Estado: S.sys.crossroads. Sem DOM.
   Teste: test/sys/crossroads.test.js */
(function(root){
'use strict';

const DATA={
  on:false,
  label:'Encruzilhada', icon:'',
  every:10,          // a cada N fases da era (curva de 100 fases por era)
  everyShort:5,      // na curva de hoje (10 fases por era) a encruzilhada fica na fase 5 (a 10 é a última: apagaria na hora)
  choices:2,         // bênçãos por encruzilhada (documento: 2)
  needLevel:0,       // PROPOSTA: sem portão de nível (a 1ª encruzilhada já é a fase 5/10). O PO pode pôr um nível aqui.
  // POOL de bênçãos. stat = chave do Sys.fc; perk = efeito fora da FC; strike = pontos do Sys.strikes. once = só uma vez por era.
  // Valores PROPOSTA (Sistemas calibra com o QA): até 9 escolhas por era: no máximo +36% numa chave de combate (Vida 4 x 9) escolhendo sempre a mesma.
  // OURO (docs/ECONOMIA_OURO.md, regra do dono "ouro difícil, sempre pouco"): Trilha do Tesouro +5% e UMA vez por era (antes +8% repetível = até +72% de ouro).
  pool:[
    {id:'furia',   name:'Fúria da Era',      text:'+3% de ATK',                       stat:{atkPct:3}},
    {id:'vigor',   name:'Vigor Antigo',      text:'+4% de Vida',                      stat:{hpPct:4}},
    {id:'olhar',   name:'Olhar Certeiro',    text:'+1,5 de chance de crítico',        stat:{critPct:1.5}},
    {id:'escudo',  name:'Escudo dos Ancestrais', text:'+2% de redução de dano',       stat:{defPct:2}},
    {id:'tesouro', name:'Trilha do Tesouro', text:'+5% de ouro',                      stat:{goldPct:5}, once:true},
    {id:'saber',   name:'Saber das Eras',    text:'+6% de XP',                        perk:{xpPct:6}},
    {id:'brasa',   name:'Brasa Viva',        text:'+1 Brasa por pote de abates',      perk:{brasaPot:1}, once:true},
    {id:'combo',   name:'Golpe Duplo',       text:'+4 de Combo',                      strike:{combo:4}},
    {id:'contra',  name:'Resposta Rápida',   text:'+4 de Contra-ataque',              strike:{counter:4}},
    {id:'esquiva', name:'Passo Leve',        text:'+2 de Esquiva',                    strike:{dodge:2}},
    {id:'atordoa', name:'Pancada Firme',     text:'+1,5 de Atordoar',                 strike:{stun:1.5}},
    {id:'roubo',   name:'Sede de Batalha',   text:'+1,5 de Roubo de vida',            strike:{lifesteal:1.5}},
  ],
};
const BY={}; for(const b of DATA.pool) BY[b.id]=b;
const FC_KEYS=['atkPct','hpPct','goldPct','critPct','defPct','fc'];
const STK_KEYS=['combo','counter','stun','dodge','lifesteal'];
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const intS=v=>int0(Number(v));   // texto da chave 'era:n' → número (o int0 sozinho devolve 0 para texto)
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function hash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* fases por era: 100 com o Sys.phases ligado (curva de 9 eras), senão o STAGES_PER_ERA do jogo (10) */
function perEra(){ const P=SYS().phases; if(P&&P.DATA&&P.DATA.on===true) return int0(P.DATA.perEra)||100; const g=int0(root.STAGES_PER_ERA); return g||10; }
const everyOf=pe=>pe>=DATA.every*2?DATA.every:DATA.everyShort;
/* fase → {era, n, key}. Aceita o número da fase (1, 2 ...; era = (fase-1)/porEra) ou {era, n} (Sys.phases). */
function where(stage){ const pe=perEra(); let era, n;
  if(stage&&typeof stage==='object'){ era=int0(stage.era); n=int0(stage.n); }
  else { const st=int0(stage); if(!st) return null; era=Math.floor((st-1)/pe); n=((st-1)%pe)+1; }
  if(n<1||n>pe) return null; return {era,n,key:era+':'+n,point:n%everyOf(pe)===0&&n<pe}; }
const isPoint=stage=>{ const w=where(stage); return !!(w&&w.point); };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.crossroads.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.crossroads; if(!o||typeof o!=='object') o=S.sys.crossroads={};
  o.v=1;
  if(typeof o.seed!=='number'||!isFinite(o.seed)) o.seed=hash(String(S.id||S.uid||S.name||'')+'|'+Date.now()+'|'+Math.random());
  o.era=int0(o.era);
  const src=(o.picks&&typeof o.picks==='object')?o.picks:{}; o.picks={};
  for(const k in src){ const p=src[k]; if(p&&typeof p==='object'&&BY[p.id]) o.picks[k]={id:p.id,era:int0(p.era),at:int0(p.at)}; }
  o.open=Array.isArray(o.open)?o.open.filter(k=>typeof k==='string'&&!o.picks[k]):[];
  o.total=int0(o.total);
  const le=o.lastEnded; o.lastEnded=(le&&typeof le==='object'&&Array.isArray(le.list))?{era:int0(le.era),list:le.list.filter(x=>x&&BY[x.id]).map(x=>card(BY[x.id]))}:null;
  if(o.lastEnded&&!o.lastEnded.list.length) o.lastEnded=null;
  return o; }

/* bênçãos já escolhidas na era (para o "once") */
const pickedInEra=(o,era)=>Object.values(o.picks).filter(p=>p.era===era).map(p=>p.id);
/* as 2 bênçãos da encruzilhada: semente do save + chave da fase. Sempre as mesmas. Tira as "once" já escolhidas na era. */
function offers(S,stage){ const w=where(stage); if(!w||!w.point) return []; const o=ensure(S);
  if(o.picks[w.key]) return [];   // já escolhida: não oferece mais
  const used=new Set(pickedInEra(o,w.era).filter(id=>BY[id].once)), cand=DATA.pool.filter(b=>!used.has(b.id));
  const rng=mulberry(hash(o.seed+'|'+w.key)), a=cand.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; }
  return a.slice(0,DATA.choices).map(card); }
const card=b=>({id:b.id,name:b.name,text:b.text,stat:Object.assign({},b.stat||{}),perk:Object.assign({},b.perk||{}),strike:Object.assign({},b.strike||{})});

function levelOk(S,host){ if(!DATA.needLevel) return true; const L=SYS().level; let lv=0; try{ lv=L&&L.level?L.level(S):int0(host&&host.level&&host.level()); }catch(e){ lv=0; } return lv>=DATA.needLevel; }
/* sobe a era guardada (a era nova apaga as bênçãos da anterior: bonus/perks só contam a era atual) */
/* troca de era: guarda as bênçãos da era que acabou em o.lastEnded {era, list} (a tela anima uma vez e chama ackEnded) e devolve a lista */
function setEra(o,era){ if(era>o.era){ const old=o.era, ended=Object.keys(o.picks).filter(k=>o.picks[k].era===old).sort((a,b)=>intS(a.split(':')[1])-intS(b.split(':')[1])).map(k=>card(BY[o.picks[k].id]));
  o.era=era; o.open=o.open.filter(k=>intS(k.split(':')[0])>=era); if(ended.length) o.lastEnded={era:old,list:ended}; return ended; } return null; }

/* O Engenheiro chama ao VENCER uma fase (a primeira vez ou de novo: repetir não abre de novo).
   {due:false} | {due:true, stage, key, offers} */
function onStage(S,host,stage){ if(!on()) return {due:false,reason:'off'}; const w=where(stage); if(!w) return {due:false,reason:'stage'};
  /* vencer a ÚLTIMA fase da era (Senhor da Era) já é entrar na era seguinte: as bênçãos apagam AQUI, como o protótipo aprovado mostra (antes só apagavam na 1ª vitória da era nova) */
  const o=ensure(S), era0=o.era, to=w.n>=perEra()?w.era+1:w.era; const moved=setEra(o,to); if(moved) changed(host); const ex=moved&&moved.length?{ended:moved,endedEra:era0}:{};
  if(!w.point||w.era<o.era||o.picks[w.key]) return Object.assign({due:false,reason:w.point?'done':'none'},ex);
  if(!levelOk(S,host)) return Object.assign({due:false,reason:'level'},ex);
  if(!o.open.includes(w.key)){ o.open.push(w.key); changed(host); }
  return Object.assign({due:true,stage,key:w.key,offers:offers(S,stage)},ex); }

/* grava a escolha. {ok, id, key} | {ok:false, reason: off|stage|old|done|id} */
function choose(S,stage,id,host){ if(!on()) return {ok:false,reason:'off'}; const w=where(stage); if(!w||!w.point) return {ok:false,reason:'stage'};
  const o=ensure(S); setEra(o,w.era); if(w.era<o.era) return {ok:false,reason:'old'}; if(o.picks[w.key]) return {ok:false,reason:'done'};
  if(!offers(S,stage).some(b=>b.id===id)) return {ok:false,reason:'id'};
  o.picks[w.key]={id,era:w.era,at:nowOf(host)}; o.open=o.open.filter(k=>k!==w.key); o.total++;
  changed(host); return {ok:true,id,key:w.key,name:BY[id].name}; }

/* bênçãos ativas (era atual) */
function active(S){ if(!on()||!S) return []; const o=ensure(S);
  return Object.keys(o.picks).filter(k=>o.picks[k].era===o.era).sort((a,b)=>int0(a.split(':')[1])-int0(b.split(':')[1])).map(k=>Object.assign({key:k},card(BY[o.picks[k].id]))); }
function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0};
  for(const x of active(S)) for(const k of FC_KEYS) b[k]+=num(x.stat[k],0);
  for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6; return b; }
function perks(S){ const p={xpPct:0,brasaPot:0,strikes:{combo:0,counter:0,stun:0,dodge:0,lifesteal:0}};
  for(const x of active(S)){ p.xpPct+=num(x.perk.xpPct,0); p.brasaPot+=num(x.perk.brasaPot,0); for(const k of STK_KEYS) p.strikes[k]+=num(x.strike[k],0); }
  return p; }

/* tela: bênçãos da era atual + encruzilhadas abertas esperando escolha */
function view(S,host){ if(!on()) return {on:false}; const o=ensure(S), pe=perEra(), ev=everyOf(pe);
  const eraName=(()=>{ const P=SYS().phases; const n=P&&P.DATA&&P.DATA.eraName; return Array.isArray(n)?n[o.era]||'':''; })();
  return {on:true,era:o.era,eraName,perEra:pe,every:ev,points:Array.from({length:Math.max(0,Math.ceil(pe/ev)-1)},(_,i)=>(i+1)*ev).filter(n=>n<pe),
    active:active(S),bonus:bonus(S),perks:perks(S),
    open:o.open.map(k=>{ const [e,n]=k.split(':').map(intS); return {key:k,era:e,n,stage:e*pe+n,offers:offers(S,{era:e,n})}; }),
    lastEnded:o.lastEnded?{era:o.lastEnded.era,list:o.lastEnded.list.map(x=>Object.assign({},x))}:null,
    total:o.total}; }
/* a tela já animou as bênçãos que acabaram: limpa o o.lastEnded (mostrar uma vez) */
function ackEnded(S,host){ if(!on()||!S) return false; const o=ensure(S); if(!o.lastEnded) return false; o.lastEnded=null; changed(host); return true; }

const API={DATA,on,setOn,perEra,where,isPoint,ensure,offers,onStage,choose,active,bonus,perks,view,ackEnded};
root.Sys=root.Sys||{}; root.Sys.crossroads=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
