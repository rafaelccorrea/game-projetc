/* Eonbound — Sys.fcHelp: "COMO GANHAR FC" quando o jogador está fraco para a fase/era (pedido do dono 14/11, via PO). SÓ LÓGICA (a tela é do Engenheiro).
   CHAVE DESLIGADA: DATA.on=false → {on:false, sources:[]}.
   - FRACO: FC atual < FC pedida (need, vem de quem chama: Sys.diff/fcNeed da fase ou REC_FC da era). MUITO FRACO: < 85% da pedida.
   - FONTES: só as que o jogador JÁ TEM (nível do Sys.level.DATA.unlock + módulo ligado; host.featureOn(id) manda se existir). "A gente vai liberando
     conforme o tempo": fonte trancada NÃO aparece (nem como "abre no Nv X").
   - GANHO: o mesmo motor das 3 dicas da Derrota (Sys.advice.all e Sys.fc.advice dos módulos), simulado numa CÓPIA do save, com a FC do HUD.
     Quando não dá para calcular (ex.: Grimório, Instâncias), gain=null e a fonte aparece só com o texto.
   - OURO ESCASSO e nada pago: nenhuma dica de loja, compra, oferta, VIP, pacote, diamante, invocação ou sorteio (filtro igual ao Sys.bossLoss).
   Ordem: 1) dá para fazer AGORA, maior ganho primeiro; 2) com ganho, mas falta recurso; 3) sem número, na ordem do catálogo; subir de nível por último.
   Sys.fcHelp(S, host, {need, limit}) → {on, fc, need, ratio, state:'ok'|'fraco'|'muito_fraco'|null, missing, text, sources:[{id, txt, gain, gainText,
   ready, tab, actionId}]}. Estado: nenhum (só lê). */
(function(root){
'use strict';
const DATA={
  on:false,          // CHAVE: liga quando o Engenheiro mostrar o painel e o dono aprovar
  weak:1,            // FC < 100% da pedida = fraco
  veryWeak:0.85,     // FC < 85% da pedida = muito fraco
  limit:8,           // quantas fontes devolver no máximo
  /* catálogo (ordem = prioridade quando não há número). feature = chave do Sys.level.DATA.unlock (null = desde o começo); mod = Sys.<mod> que precisa existir
     e estar ligado; tab = destino do botão Ir (o Engenheiro liga cada um à tela) */
  sources:[
    {id:'gear',      feature:null,        mod:'stats',     tab:'gear',      txt:'Equipe peças melhores da mochila'},
    {id:'bonfire',   feature:null,        mod:'bonfire',   tab:'bonfire',   txt:'Acenda a Fogueira para ganhar peças novas'},
    {id:'forge',     feature:'forge',     mod:'forge',     tab:'forge',     txt:'Forje os espaços do equipamento'},
    {id:'pet',       feature:'pets',      mod:'pet',       tab:'pet',       txt:'Alimente e evolua o pet'},
    {id:'mount',     feature:'mount',     mod:'mount',     tab:'mount',     txt:'Suba as estrelas da montaria'},
    {id:'grimoire',  feature:null,        mod:'grimoire',  tab:'grimoire',  txt:'Suba o nível das magias do Grimório'},
    {id:'practice',  feature:'practice',  mod:'practice',  tab:'practice',  txt:'Treine na Prática'},
    {id:'relics',    feature:'relics',    mod:'relics',    tab:'relics',    txt:'Desperte e suba as Relíquias'},
    {id:'mentors',   feature:'mentors',   mod:'mentors',   tab:'mentors',   txt:'Visite os Mentores'},
    {id:'titles',    feature:null,        mod:'titles',    tab:'titles',    txt:'Destaque o melhor título'},
    {id:'tower',     feature:'tower',     mod:'tower',     tab:'tower',     txt:'Suba andares da Torre (cada andar dá ATQ e Vida)'},
    {id:'instances', feature:'instances', mod:'instances', tab:'instances', txt:'Jogue as Instâncias para ganhar materiais'},
    {id:'events',    feature:'events',    mod:'events',    tab:'events',    txt:'Faça as missões do evento'},
    {id:'guild',     feature:'guild',     mod:'guild',     tab:'guild',     txt:'Use os bônus da Guilda'},
    {id:'level',     feature:null,        mod:'level',     tab:'hero',      txt:'Suba de nível jogando as fases', last:true},
  ],
  /* de onde vem cada ação dos motores: Sys.advice.all (kind) e Sys.fc.advice (module) → id da fonte */
  fromKind:{equip:'gear',fuse:'gear',forge:'forge',pet:'pet',mount:'mount',title:'title',level:'level'},
  fromModule:{forge:'forge',pet:'pet',mount:'mount',titles:'titles',practice:'practice',relics:'relics',tower:'tower',instances:'instances',grimoire:'grimoire',mentors:'mentors',guild:'guild',bonfire:'bonfire'},
  forbidden:/buy|shop|store|summon|offer|oferta|vip|pack|gacha|gem|diamante|pay|premium|loja|compra|invoc|sorteio|ba[uú]/i,
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(Number(v),0)));
const clone=o=>{ try{ return typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o)); }catch(e){ return JSON.parse(JSON.stringify(o)); } };
const F=()=>SYS().fc;
const fcOf=(S,host)=>{ try{ return num(F().compute(S,host),0); }catch(e){ return 0; } };
const viewText=n=>{ const f=F(); try{ return f&&f.viewText?f.viewText(n):String(Math.round(n)); }catch(e){ return String(Math.round(n)); } };
const shown=n=>{ const f=F(); try{ return f&&f.view?f.view(n):Math.round(n); }catch(e){ return Math.round(n); } };

/* a fonte está no jogo para ESTE jogador? (nível + módulo ligado; host.featureOn(id) decide se existir) */
function modOn(name){ const M=SYS()[name]; if(!M) return false; try{ if(typeof M.on==='function') return M.on()===true; }catch(e){ return false; }
  if(name==='guild'||name==='bonfire') return !!(M.DATA&&M.DATA.on===true); return true; }
function levelOk(S,host,feature){ if(!feature) return true; const L=SYS().level; if(!L) return true;
  try{ if(typeof L.isUnlocked==='function') return L.isUnlocked(S,feature)===true; }catch(e){ return false; } return true; }
function available(S,host,src){ if(host&&typeof host.featureOn==='function'){ try{ const r=host.featureOn(src.id); if(r===true||r===false) return r; }catch(e){} }
  if(!modOn(src.mod)||!levelOk(S,host,src.feature)) return false;
  if(src.id==='events'){ const E=SYS().events; try{ return !!(E&&E.list&&E.list(S,host).some(x=>x.phase==='ativo')); }catch(e){ return false; } }
  return true; }

/* ações dos motores, numa CÓPIA do save (torre/instâncias abrem o dia no 1º uso): [{src, id, label, gain, ready}] */
function actions(S,host){ const out=[], A=SYS().advice, f=F(); let S2;
  try{ S2=clone(S); }catch(e){ return out; }
  if(A&&typeof A.all==='function'){ let l=[]; try{ l=A.all(S2,host).list||[]; }catch(e){ l=[]; }
    for(const a of l){ if(a.locked||a.id==='farm') continue; const src=DATA.fromKind[a.kind]; if(src) out.push({src:src==='title'?'titles':src,id:a.id,label:a.label,gain:a.noGain?null:num(a.gain,0),ready:!!a.ready}); } }
  if(f&&typeof f.advice==='function'){ let l=[]; try{ S2=clone(S); l=f.advice(S2,host,99)||[]; }catch(e){ l=[]; }
    for(const a of l){ const src=DATA.fromModule[a.module]; if(src) out.push({src,id:a.id,label:a.label,gain:num(a.gain,0),ready:!!a.ready}); } }
  return out.filter(a=>!DATA.forbidden.test(String(a.id)+' '+String(a.label))); }

function help(S0,host,opts){ opts=opts||{}; let S; try{ S=clone(S0||{}); }catch(e){ S={}; }   // tudo numa cópia: o fc.compute e os módulos completam o save ao ler
  if(DATA.on!==true) return {on:false,fc:0,need:null,ratio:null,state:null,missing:null,text:'',sources:[]};
  const fc=fcOf(S,host), need=num(Number(opts.need),NaN), has=isFinite(need)&&need>0, ratio=has?fc/need:null;
  const state=!has?null:ratio<DATA.veryWeak?'muito_fraco':ratio<DATA.weak?'fraco':'ok', missing=has?Math.max(0,Math.ceil(need-fc)):null;
  const acts=actions(S,host), list=[];
  for(const src of DATA.sources){ if(!available(S,host,src)) continue;
    const mine=acts.filter(a=>a.src===src.id&&(a.gain==null||shown(fc+a.gain)>shown(fc)));   // ganho que a tela não mostra não conta
    mine.sort((a,b)=>(b.ready-a.ready)||(num(b.gain,0)-num(a.gain,0))); const b=mine[0]||null;
    list.push({id:src.id,txt:b&&b.label?b.label:src.txt,gain:b&&b.gain!=null?Math.round(b.gain):null,gainText:b&&b.gain!=null?'+'+viewText(b.gain)+' FC':'',
      ready:b?b.ready:false,tab:src.tab,actionId:b?b.id:null,last:!!src.last}); }
  const rank=x=>x.last?3:x.gain!=null&&x.ready?0:x.gain!=null?1:2;
  list.sort((a,b)=>(rank(a)-rank(b))||(num(b.gain,0)-num(a.gain,0)));
  const lim=Math.max(1,int0(num(opts.limit,DATA.limit)));
  return {on:true,fc,need:has?need:null,ratio:has?Math.round(ratio*1000)/1000:null,state,missing,
    text:!has?'':state==='ok'?'FC suficiente':`Faltam ${viewText(missing)} de FC`,sources:list.slice(0,lim).map(({last,...x})=>x)}; }

const API=Object.assign(help,{DATA,help,available,actions});
root.Sys=root.Sys||{}; root.Sys.fcHelp=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
