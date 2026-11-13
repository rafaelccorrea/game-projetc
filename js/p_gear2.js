'use strict';
/* ================= EQUIPAMENTO + MOCHILA V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.gear2) =================
   Protótipo: docs/proto/v2/Equipamento.html · passagem: docs/proto/v2/PASSAGEM.md (seções 0 e 2). Não substitui o scrGear do js/screens.js nem o js/p_bag.js:
   é outra tela ('gear2'). NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - quem pode equipar: Sys.stats.canEquip / slotOpen (hoje o único portão é o da asa: nível e raridade mínimos do Sys.stats.DATA.wing);
   - FC e atributos, antes e depois: Sys.fc.compute / stats / fcOfStats com {item} e {item, remove} (prévia sem mexer no save) e Sys.fc.viewText;
   - "Equipar o melhor": a MESMA conta do gBest do js/screens.js (maior FC por espaço, com a folga de 0,5); quando o gBest existe, é ele que roda;
   - subir o nível da peça: Sys.stats.canUpgrade / upgrade / upgradeCost / upgradeTo (só ouro), como os botões de hoje;
   - desmontar: Sys.loot.dismantle (ouro do Sys.stats.dismantleGold e pedras do Sys.loot.DATA.dismantle), com confirmação DENTRO do jogo; item em uso nunca;
   - Forja +N do espaço: Sys.forge.level · mochila N/máx: xBagMax · nome: iname · ícone: Sys.host.thumb · raridade: tabela RAR.
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói com a arma NA MÃO, a asa e o PET POR ÚLTIMO (na frente). A pé (mount:false), como no protótipo.
   A peça equipada aparece no herói pelo próprio jogo (a arma e a asa saem do item equipado). Peça que ainda não pode ser equipada: prévia NO herói por
   state.weapon / state.wing, com a faixa "Prévia: X · Sair". A roupa do herói não sai do item (é skin fixa, tela Aparência), então colete e afins não mudam o corpo.
   REGRA DO DONO (protótipo): tocou, trocou. Tocar numa peça que pode ser equipada troca na hora e a faixa mostra "FC antes → agora" e o botão Voltar.
   Para o toque só mostrar a prévia e a troca ficar no botão Equipar: Gear2.cfg.tapSwap=false.
   O arquivo roda em escopo próprio. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('gear2' in PANEL_ON)) PANEL_ON.gear2=false;

const NAME='gear2';
const CFG={tapSwap:true};
const X={tab:'weapon',sf:'all',rf:-1,sort:'fc',sel:null,undo:null,pv:null,ask:null,fly:null,toast:'',toastT:0,anim:true,top:true,sig:'',raf:0,t0:0};
const ACTIONS=['slot','tab','sf','rf','sort','item','close','pvout','equip','undo','best','forge','look','go','dism','dismok','askno','up','upmax'];
const TABS=[['weapon','Armas'],['gear','Equipamento'],['wing','Asas'],['pets','Pets'],['mounts','Montarias'],['skins','Skins'],['mats','Materiais'],['cons','Consumíveis']];
const SORTS=[['fc','FC'],['rar','Raridade'],['lvl','Nível']];
const SLOTS_FALLBACK=['weapon','armor','hat','gloves','boots','necklace','wing'];
/* ícones de pets e montarias com arquivo de nome próprio (mesma tabela do js/p_bag.js) */
const PET_ART={shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'};
const MOUNT_ART={raptor:'war_raptor',scorpion:'giant_scorpion',panther:'shadow_panther',hellhorse:'infernal_horse',unicorn:'war_unicorn',icewolf:'ice_wolf',phoenixm:'giant_phoenix',blackdragon:'black_dragon',celtiger:'celestial_tiger',mecha:'war_mecha'};

/* ---------- leituras dos módulos ---------- */
const now=()=>Date.now();
const tr=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const isOn=()=>typeof view!=='undefined'&&view===NAME;
const redraw=()=>{ if(isOn()&&typeof render==='function') render(); };
const call=(fn,a,b)=>{ try{ if(typeof fn==='function') return fn(a,b); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const lv=()=>tr(()=>Sys.level.level(S)|0,1);
const SL=()=>tr(()=>{ const a=Sys.stats.DATA.slots; return Array.isArray(a)&&a.length?a:null; },SLOTS_FALLBACK);
const slotOk=s=>SL().indexOf(s)>=0;
const slotName=s=>tr(()=>SLOT[s].n,tr(()=>Sys.forge.DATA.slotName[s],s));
const slotShort=s=>String(slotName(s)).split('/')[0];
const inv=()=>(Array.isArray(S.inv)?S.inv:[]).filter(it=>it&&slotOk(it.slot));
const byId=id=>id==null?null:(inv().find(i=>String(i.id)===String(id))||null);
const eqOf=s=>tr(()=>S.eq[s]!=null?byId(S.eq[s]):null,null);
const isEq=it=>!!it&&!!S.eq&&S.eq[it.slot]===it.id;
const inUse=it=>!!it&&!!S.eq&&Object.keys(S.eq).some(k=>S.eq[k]===it.id);
const canEq=it=>tr(()=>Sys.stats.canEquip(it,lv())===true,false);
const slotOpen=s=>tr(()=>Sys.stats.slotOpen(s,lv())!==false,true);
const wingLv=()=>tr(()=>Sys.stats.DATA.wing.minLevel,1);
const wingMinR=()=>tr(()=>Sys.stats.DATA.wing.minR|0,0);
const rIdx=it=>Math.max(0,(it&&it.r)|0);
const rcol=it=>{ const r=rIdx(it); return tr(()=>RAR[Math.min(RAR.length-1,r)].c,tr(()=>RC[Math.min(RC.length-1,r)],'#a9b3c9')); };
const rnameOf=r=>tr(()=>RAR[Math.min(RAR.length-1,Math.max(0,r|0))].n,'');
const rname=it=>rnameOf(rIdx(it));
const iName=it=>tr(()=>iname(it),slotShort(it.slot));
const eraOfItem=it=>tr(()=>ieraV(it),(it.e|0));
const eraName=e=>tr(()=>ERAS[e].n,'Era '+((e|0)+1));
const heroName=()=>tr(()=>S.hero==='kaia'?'Kaia':'Kael','Kael');
const thumb=it=>tr(()=>{ const u=Sys.host.thumb(it); return typeof u==='string'&&u?u:null; },tr(()=>slotIcon(it.slot,eraOfItem(it)),''));
const emptyIco=s=>tr(()=>ICON[s]||ICON.armor,'');
const forgeLv=s=>tr(()=>Sys.forge.level(S,s)|0,0);
const bagMax=()=>tr(()=>xBagMax(),tr(()=>Sys.host.bagMax(),60));
const fcTxt=v=>tr(()=>Sys.fc.viewText(v),String(Math.round(v)));
const num=v=>tr(()=>v>=1e7?kf(v):n0(v),String(Math.round(v)));
const gold=v=>tr(()=>kf(v),String(Math.round(v)));
const pc=v=>String(Math.round(v*10)/10).replace('.',',')+'%';
const pl=(n,a,b)=>n+' '+(n===1?a:b);
const reduced=()=>tr(()=>!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches),false);
/* por que esta peça não entra (quem decide é o Sys.stats.canEquip; aqui só o texto) */
function whyNot(it){ if(it&&it.slot==='wing'){ if(!slotOpen('wing')) return 'A asa abre no nível '+wingLv(); if(rIdx(it)<wingMinR()) return 'Asa: só '+rnameOf(wingMinR())+' ou acima'; }
  return 'Esta peça ainda não pode ser equipada'; }
const lockShort=it=>it&&it.slot==='wing'&&!slotOpen('wing')?'Nível '+wingLv():'Trancada';

/* ---------- FC e atributos (sempre do Sys.fc; guardados só durante um desenho) ---------- */
let C=null;
const cache=()=>C||(C={now:null,g:{},b:{}});
const snap=o=>{ const st=o?Sys.fc.stats(S,Sys.host,o):Sys.fc.stats(S,Sys.host); return {atk:+st.atk||0,hp:+st.hp||0,def:+st.def||0,crit:+st.critRate||0,fc:Sys.fc.fcOfStats(st)}; };
const fcNow=()=>{ const c=cache(); if(c.now==null) c.now=tr(()=>Sys.fc.compute(S,Sys.host),0); return c.now; };
const fcWith=it=>tr(()=>Sys.fc.compute(S,Sys.host,{item:it}),fcNow());
const fcWithout=it=>tr(()=>Sys.fc.compute(S,Sys.host,{item:it,remove:true}),fcNow());
/* quanto a FC muda se esta peça for para o espaço dela (0 para a que já está em uso) */
function gain(it){ if(!it||isEq(it)) return 0; const c=cache(), k=String(it.id); if(c.g[k]==null) c.g[k]=fcWith(it)-fcNow(); return c.g[k]; }
const better=it=>!!it&&!isEq(it)&&canEq(it)&&gain(it)>0.5;
function betterIn(s){ const c=cache(); if(c.b[s]==null) c.b[s]=inv().filter(i=>i.slot===s&&better(i)).length; return c.b[s]; }
const pieceFc=it=>Math.max(0,(isEq(it)?fcNow():fcWith(it))-fcWithout(it));
/* "Equipar o melhor": mesma conta do gBest (js/screens.js): por espaço aberto, a peça que dá a maior FC, simulando numa cópia do S.eq */
function bestLocal(){ const L=lv(), eq=Object.assign({},S.eq), real=S.eq; let n=0; S.eq=eq;
  try{ for(const slot of SL()){ if(!Sys.stats.slotOpen(slot,L)) continue; let best=eq[slot], bfc=Sys.fc.compute(S,Sys.host);
      for(const x of inv()){ if(x.slot!==slot||x.id===eq[slot]||!Sys.stats.canEquip(x,L)) continue; const fc=Sys.fc.compute(S,Sys.host,{item:x}); if(fc>bfc+0.5){ bfc=fc; best=x.id; } }
      if(best!==eq[slot]){ eq[slot]=best; n++; } } }finally{ S.eq=real; }
  return {eq:eq,n:n}; }
const bestOnce=()=>{ if(typeof gBest==='function'){ const r=tr(()=>gBest(),null); if(r&&r.eq&&typeof r.n==='number') return r; } return bestLocal(); };
/* a conta olha um espaço por vez; como os bônus em % de um espaço mudam o valor dos outros, uma passada só pode deixar seta verde na mochila.
   Aqui a MESMA conta repete (no máximo 4 vezes) até nenhuma troca melhorar mais; n = espaços que mudaram de verdade */
function bestPlan(){ const real=S.eq; let eq=real;
  try{ for(let i=0;i<4;i++){ S.eq=eq; const r=bestOnce(); if(!r||!r.n) break; eq=r.eq; } }finally{ S.eq=real; }
  let n=0; for(const s of SL()) if((eq[s]==null?null:eq[s])!==(real[s]==null?null:real[s])) n++;
  return {eq:eq===real?Object.assign({},real):eq,n:n}; }
/* subir o nível: 1 nível (Sys.stats.canUpgrade) e "até onde o ouro dá" (mesma conta do gMaxPlan do js/screens.js, com o teto do módulo) */
const upPlan=it=>tr(()=>Sys.stats.canUpgrade(S,Sys.host,it,'gold'),{ok:false,reason:'x',gold:0});
function maxPlan(it){ return tr(()=>{ const cap=Math.min(Sys.stats.DATA.maxItemLevel,lv()); let g=+S.gold||0, l=it.lvl||1, sum=0, n=0;
    if(upPlan(it).reason==='dormant') return {n:0,sum:0,to:l};
    while(l<cap){ const c=Sys.stats.upgradeCost(Object.assign({},it,{lvl:l})).gold; if(g<c) break; g-=c; sum+=c; l++; n++; } return {n:n,sum:sum,to:l}; },{n:0,sum:0,to:(it&&it.lvl)||1}); }
function upWhy(c,it){ return c.reason==='max'?'Nível máximo':c.reason==='level'?'Suba ao nível '+(c.needLevel||((it.lvl||1)+1))+' para melhorar'
  :c.reason==='dormant'?'Peça adormecida: acorda quando você chegar à era dela':c.reason==='money'?tr(()=>needMsg('gold',c.gold),'Falta ouro'):'Não dá para melhorar agora'; }
/* aparência que vai para o herói na prévia: arma pela família do item (como o wFamLook do js/battle.js); asa pelo Sys.stats.wingOf */
function wLook(it){ return tr(()=>{ if(typeof SKIN!=='function') return null; const r=Math.max(0,Math.min(4,it.r|0)), W=Sys.stats.DATA.weaponTypes[Sys.stats.weaponType(it)];
    if(W&&W.artEra!=null) return SKIN('w'+W.artEra+r)||null; if(W) return null; return SKIN('w'+eraOfItem(it)+r)||null; },null); }
const wingLook=it=>tr(()=>{ const w=Sys.stats.wingOf(it); return typeof w==='string'&&w?w:null; },null);
const pvAble=it=>!!it&&(it.slot==='weapon'?!!wLook(it):it.slot==='wing'?!!wingLook(it):false);

/* ---------- desenhos pequenos (sem emoji) ---------- */
const SV={
  up:'<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#043018" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V6M6 11l6-6 6 6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="10" height="10" fill="#c9d0f5" aria-hidden="true"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"/></svg>',
  x:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  go:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9aa6d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  hammer:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M14 4l6 6-3 3-6-6zM11 7l-8 8 3 3 8-8"/></svg>',
  shirt:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M8 3l4 3 4-3 5 4-3 4-2-1v11H8V10l-2 1-3-4z"/></svg>',
  undo:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M9 7L4 12l5 5M4 12h11a5 5 0 010 10h-2"/></svg>',
  star:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'
};

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.g2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--green:#5ef0a0;--red:#ff6b6b;--rose:#ff6b9a;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.g2 *{box-sizing:border-box}
.g2 button{color:inherit;font-family:inherit;cursor:pointer}
.g2-in{animation:g2-fade .22s ease-out}
.g2-bg{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none}
.g2-stage{position:relative;z-index:2;flex:none}
.g2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;height:24px;max-width:calc(100% - 128px);padding:0 10px;border-radius:12px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap}
.g2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.g2-who span{overflow:hidden;text-overflow:ellipsis;min-width:0}
button.g2-who{height:40px;top:0;border-color:var(--gold);color:var(--gold);background:linear-gradient(90deg,rgba(255,210,94,.3),rgba(255,164,52,.22))}
.xs button.g2-who{color:var(--gold)}
button.g2-who i{background:var(--gold);box-shadow:0 0 8px var(--gold)}
button.g2-who u{flex:none;text-decoration:none;height:22px;line-height:22px;padding:0 9px;border-radius:11px;background:var(--gold);color:var(--ink);font-size:11px}
.g2-slot{position:absolute;z-index:3;width:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:0;background:none;padding:0}
.g2-slot .sb{position:relative;border-radius:13px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);overflow:hidden;display:block}
.g2-slot .sb img{position:absolute;left:6%;top:6%;width:88%;height:88%;object-fit:contain}
.g2-slot .fg{position:absolute;right:1px;top:1px;padding:0 4px;border-radius:6px;background:rgba(5,8,28,.88);color:var(--gold);font-size:9px;font-weight:900;line-height:13px}
.g2-slot .ar{position:absolute;left:1px;top:1px;width:14px;height:14px;border-radius:5px;background:var(--green);display:grid;place-items:center}
.g2-slot .lk{position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:5px;background:rgba(5,8,28,.85);display:grid;place-items:center}
.g2-slot.lock .sb img{filter:grayscale(.85) brightness(.5)}
.g2-slot .sl{font-size:9px;font-weight:900;color:var(--muted);text-shadow:0 1px 0 #000;white-space:nowrap;max-width:54px;overflow:hidden;text-overflow:ellipsis}
.g2-slot.on .sb{box-shadow:0 0 0 3px var(--gold),0 0 16px rgba(255,210,94,.6)}
.g2-slot.on .sl{color:var(--gold)}
.g2-scroll{position:relative;z-index:3;flex:1;min-height:0;min-width:0;padding:2px 12px 20px}
.g2-fcrow{display:flex;flex-wrap:wrap;align-items:center;gap:4px 5px;padding:4px 6px 4px 10px;border-radius:16px;background:linear-gradient(90deg,rgba(255,210,94,.16),rgba(10,14,44,.85) 60%);border:1px solid rgba(255,210,94,.5);min-width:0}
.g2-fcb{flex:1 1 92px;min-width:0}
.g2-fcb small{display:block;font-size:9px;letter-spacing:1.2px;color:var(--gold);font-weight:900}
.g2-fcb b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;line-height:1;color:var(--gold);text-shadow:0 0 14px rgba(255,210,94,.55),0 2px 0 rgba(0,0,0,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-fcb em{display:block;font-style:normal;font-size:10px;font-weight:800;color:var(--green);line-height:1.15;overflow-wrap:anywhere}
.g2-fcb em.m{color:var(--muted)}
.g2-ib{flex:none;width:44px;height:44px;padding:0;border-radius:11px;border:1px solid var(--line2);background:rgba(5,8,28,.6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:9px;font-weight:900;color:var(--text)}
.xs .g2-ib{color:var(--text)}
.g2-bt{flex:1 1 0;min-width:0;min-height:44px;padding:2px 6px;border-radius:11px;border:0;font-weight:900;font-size:12px;line-height:1.1;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:var(--ink);box-shadow:0 3px 0 #9a5a10;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.xs .g2-bt{color:var(--ink)}
.g2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.g2-bt span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-flex;align-items:center;gap:4px}
.g2-bt small{font-size:10px;font-weight:800;opacity:.85;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.g2-bt.best{flex:none;min-width:76px;padding:2px 8px}
.g2-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);box-shadow:0 3px 0 #164e8c}
.xs .g2-bt.blue{color:#04223f}
.g2-bt.red{background:#2a1530;border:2px solid var(--rose);box-shadow:none}
.xs .g2-bt.red{color:#ffb3c4}
.g2-bt.on{background:rgba(94,240,160,.12);border:2px solid var(--green);box-shadow:none}
.xs .g2-bt.on{color:var(--green)}
.g2-bt.off,.g2-bt[aria-disabled="true"]{background:rgba(255,255,255,.06);box-shadow:none;border:1px solid var(--line);transform:none}
.xs .g2-bt.off,.xs .g2-bt[aria-disabled="true"]{color:var(--muted)}
.g2-det{position:sticky;top:0;z-index:5;margin:6px 0 0;padding:6px 8px 8px 10px;border-radius:14px;background:#141c4a;border:1px solid var(--rc);box-shadow:0 6px 14px rgba(3,5,18,.55);min-width:0}
.g2-dt{display:flex;gap:9px;align-items:center;min-width:0}
.g2-di0{flex:none;width:42px;height:42px;border-radius:11px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);position:relative;overflow:hidden;display:block}
.g2-di0 img{position:absolute;left:6%;top:6%;width:88%;height:88%;object-fit:contain}
.g2-di{flex:1;min-width:0}
.g2-dn{font-weight:900;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase}
.g2-dh{font-size:11px;color:var(--muted);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-dh b{color:var(--gold)}
.g2-dx{flex:none;width:40px;height:40px;border-radius:11px;border:1px solid var(--line);background:rgba(255,255,255,.05);display:grid;place-items:center;padding:0}
.g2-cmp{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;margin-top:5px;padding:5px 8px;border-radius:10px;background:rgba(5,8,28,.55);font-weight:900;font-size:12px;min-width:0}
.g2-cmp small{font-size:9px;letter-spacing:1px;color:var(--muted);flex:none}
.g2-cmp .a{color:var(--muted);white-space:nowrap}
.g2-cmp .b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;color:var(--gold);white-space:nowrap}
.g2-cmp .d{margin-left:auto;white-space:nowrap}
.g2-up{color:var(--green)} .g2-dn2{color:var(--red)} .g2-eq0{color:var(--muted)}
.g2-msg{color:var(--muted);font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.g2-msg b{color:var(--gold)}
.g2-acts{display:flex;gap:6px;margin-top:7px;min-width:0}
.g2-more{margin:6px 0 0;padding:8px 10px;border-radius:14px;background:rgba(20,28,74,.86);border:1px solid var(--line);min-width:0}
.g2-vs{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center}
.g2-vs div{border-radius:10px;background:rgba(5,8,28,.5);border:1px solid var(--rc);padding:4px 7px;min-width:0}
.g2-vs small{display:block;font-size:9px;font-weight:900;letter-spacing:1px;color:var(--muted)}
.g2-vs b{display:block;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-vs em{display:block;font-style:normal;font-size:10px;font-weight:800;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-vs i{font-style:normal;font-family:'Lilita One',Nunito,sans-serif;font-size:16px;color:var(--gold)}
.g2-sts{display:grid;gap:4px;margin-top:6px}
.g2-sts div{border-radius:9px;background:rgba(5,8,28,.45);padding:4px 6px;min-width:0}
.g2-sts small{display:block;font-size:9px;font-weight:900;color:var(--muted);letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-sts b{display:block;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-sts em{display:block;font-style:normal;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:6px 0 0;padding:3px;border-radius:14px;background:rgba(5,8,28,.75);border:1px solid var(--line)}
.g2-tab{height:40px;border:0;border-radius:10px;background:none;font-weight:900;font-size:11px;color:var(--muted);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
.xs .g2-tab{color:var(--muted)}
.g2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.xs .g2-tab[aria-selected="true"]{color:#fff}
.g2-body{padding-top:7px;min-width:0}
.g2-filt{display:grid;gap:5px;margin-bottom:6px}
.g2-fb{min-height:40px;padding:2px 6px;border-radius:12px;border:1px solid var(--line);background:rgba(5,8,28,.55);min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15}
.g2-fb small{font-size:9px;font-weight:900;letter-spacing:.6px;color:var(--muted);text-transform:uppercase}
.g2-fb b{font-size:12px;font-weight:900;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:2px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.g2-sec span{min-width:0}
.g2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.g2-sec b{color:var(--text)}
.g2-hint{font-size:11px;color:var(--muted);margin:0 0 7px;line-height:1.4;overflow-wrap:anywhere}
.g2-hint b{color:var(--gold)}
.g2-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:10px}
.g2-grid>div{min-width:0}
.g2-cell{position:relative;display:block;width:100%;aspect-ratio:1;min-height:40px;border-radius:13px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);padding:0;overflow:hidden}
.g2-cell img{position:absolute;left:7%;top:7%;width:86%;height:86%;object-fit:contain}
.g2-cell.lock img{filter:grayscale(.85) brightness(.5)}
.g2-cell.sel{box-shadow:0 0 0 3px var(--gold),0 0 16px rgba(255,210,94,.5)}
.g2-cell .eqb{position:absolute;left:2px;bottom:2px;font-size:8px;font-weight:900;padding:1px 4px;border-radius:5px;background:var(--green);color:#043018}
.g2-cell .lv{position:absolute;right:3px;bottom:2px;font-size:9px;font-weight:900;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000}
.g2-cell .ar{position:absolute;right:2px;top:2px;width:15px;height:15px;border-radius:5px;background:var(--green);display:grid;place-items:center;box-shadow:0 0 6px rgba(94,240,160,.7)}
.g2-cell .lk{position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:5px;background:rgba(5,8,28,.85);display:grid;place-items:center}
.g2-cell .fg{position:absolute;left:2px;top:2px;padding:0 4px;border-radius:6px;background:rgba(5,8,28,.85);color:var(--gold);font-size:9px;font-weight:900;line-height:13px}
.g2-cn{font-size:9px;font-weight:900;text-align:center;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted)}
.g2-empty{padding:22px 14px;border-radius:14px;background:var(--glass);border:1px solid var(--line);text-align:center;color:var(--muted);font-size:12px;font-weight:800;line-height:1.4;margin-bottom:8px;overflow-wrap:anywhere}
.g2-row{display:flex;gap:10px;align-items:center;padding:8px;border-radius:14px;background:var(--glass);border:1px solid var(--line);margin-bottom:6px;min-width:0}
.g2-row img{flex:none;width:40px;height:40px;object-fit:contain}
.g2-row div{flex:1;min-width:0}
.g2-row b{display:block;font-size:13px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.g2-row small{display:block;font-size:11px;color:var(--muted);font-weight:700;overflow-wrap:anywhere}
.g2-row strong{flex:none;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:19px}
.g2-fly{position:absolute;z-index:40;left:50%;transform:translateX(-50%);font-family:'Lilita One',Nunito,sans-serif;font-size:24px;pointer-events:none;animation:g2-fly 1.6s ease-out both;text-shadow:0 2px 0 rgba(0,0,0,.5);white-space:nowrap}
.g2-toast{position:absolute;left:50%;top:44px;z-index:40;transform:translateX(-50%);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;animation:g2-tin 2.2s ease both;max-width:calc(100% - 24px);overflow-wrap:anywhere;pointer-events:none}
.g2-shade{position:absolute;left:0;right:0;top:0;bottom:0;z-index:50;background:rgba(3,5,18,.72);display:flex;align-items:center;animation:g2-fade .2s}
.g2-modal{margin:auto 16px;width:100%;max-height:86%;overflow-y:auto;overflow-x:hidden;border-radius:22px;background:#161d52;border:1px solid var(--line2);padding:16px;min-width:0}
.g2-modal h3{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;margin:0 0 8px}
.g2-modal p{margin:0 0 6px;font-size:13px;color:var(--muted);line-height:1.45;overflow-wrap:anywhere}
.g2-gain{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 2px}
.g2-gain span{display:inline-flex;align-items:center;min-height:26px;padding:0 9px;border-radius:9px;background:rgba(94,240,160,.12);color:var(--green);font-weight:900;font-size:12px}
@keyframes g2-fade{from{opacity:0}}
@keyframes g2-tin{0%{opacity:0;transform:translate(-50%,-8px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
@keyframes g2-fly{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}100%{opacity:0;transform:translate(-50%,-60px)}}
@media (prefers-reduced-motion:reduce){.g2-in,.g2-shade{animation:none}.g2-fly,.g2-toast{animation-timing-function:step-end}}
`; document.head.appendChild(st); })();

/* ---------- avisos (dentro da tela; nada de diálogo do navegador) ---------- */
const toastHtml=m=>'<div class="g2-toast" role="status">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('g2_toast'); if(el) el.innerHTML=toastHtml(X.toast); }catch(e){} }
function fly(d){ X.fly=Math.abs(d)>=1?{t:now(),up:d>0,txt:(d>0?'+':'−')+fcTxt(Math.abs(d))+' FC'}:null; }
function changed(){ C=null; call(typeof statsChanged==='function'?statsChanged:null); }

/* ================= PALCO (canvas): chão e o herói do jogo, com a prévia quando houver ================= */
function heroState(t){ const st={t:t,mount:false}, it=X.pv!=null?byId(X.pv):null;
  if(it&&!isEq(it)){ if(it.slot==='weapon'){ const w=wLook(it); if(w) st.weapon=w; } else if(it.slot==='wing'){ const w=wingLook(it); if(w) st.wing=w; } }
  return st; }
function ground(x,g,t){ const HX=g.HX, GY=g.GY, gr=x.createRadialGradient(HX,GY,10,HX,GY,130); gr.addColorStop(0,'rgba(94,231,255,.35)'); gr.addColorStop(1,'rgba(94,231,255,0)'); x.fillStyle=gr; x.beginPath(); x.ellipse(HX,GY,130,20,0,0,7); x.fill();
  x.strokeStyle='rgba(255,210,94,.5)'; x.setLineDash([5,6]); x.lineDashOffset=-t*10; x.lineWidth=1.5; x.beginPath(); x.ellipse(HX,GY,104,15,0,0,7); x.stroke(); x.setLineDash([]); }
function hero(x,g,t){ if(typeof window.drawHeroFull!=='function'||!(typeof HS==='number'&&HS>0)) return;
  window.drawHeroFull(x,g.HX,g.GY,g.hk*256/HS,heroState(t)); }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||236;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0);
  base(); x.clearRect(0,0,w,h);
  const g={W:w,H:h,HX:w/2,GY:h-14,hk:Math.min(.8,(h-30)/256)};
  const part=fn=>{ try{ fn(); }catch(e){ try{ x.restore(); }catch(e2){} } base(); };
  part(()=>ground(x,g,reduced()?0:t)); part(()=>hero(x,g,t)); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('g2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('g2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }

/* ================= HTML ================= */
const ico=(it,cls)=>'<span class="'+cls+'"><img src="'+esc2(thumb(it))+'" alt=""></span>';

function stageHtml(SH){ const pitch=Math.floor((SH-6)/4), box=Math.max(30,Math.min(46,pitch-12)), all=SL(), sel=X.sel!=null?byId(X.sel):null;
  const L=['weapon','hat','armor','gloves'].filter(slotOk), R=['necklace','boots','wing'].filter(slotOk), rest=all.filter(s=>L.indexOf(s)<0&&R.indexOf(s)<0);
  const cell=(s,i,right)=>{ const it=eqOf(s), n=forgeLv(s), shut=!slotOpen(s), up=shut?0:betterIn(s), on=!!sel&&sel.slot===s;
    return '<button class="g2-slot'+(on?' on':'')+(shut?' lock':'')+'" data-x="slot" data-slot="'+esc2(s)+'" aria-pressed="'+on+'" aria-label="'+esc2(slotName(s))+': '+esc2(shut?'abre no nível '+wingLv():it?iName(it)+', '+rname(it)+', Forja +'+n:'vazio')+(up?', há peça melhor na mochila':'')+'" style="'+(right?'right':'left')+':6px;top:'+(2+i*pitch+(right?Math.round(pitch/2):0))+'px;height:'+pitch+'px;--rc:'+(it&&!shut?rcol(it):'#55608f')+'">'
      +'<span class="sb" style="width:'+box+'px;height:'+box+'px"><img src="'+esc2(it?thumb(it):emptyIco(s))+'" alt=""'+(it?'':' style="opacity:.5"')+'>'+(shut?'<span class="lk">'+SV.lock+'</span>':(n?'<span class="fg">+'+n+'</span>':'')+(up?'<span class="ar">'+SV.up+'</span>':''))+'</span>'
      +'<span class="sl">'+esc2(slotShort(s))+'</span></button>'; };
  const pv=X.pv!=null?byId(X.pv):null;
  const who=pv?'<button class="g2-who" data-x="pvout" aria-label="Sair da prévia"><i></i><span>Prévia: '+esc2(iName(pv))+'</span><u>Sair</u></button>'
    :'<div class="g2-who"><i></i><span>'+esc2(heroName())+' · Nível '+lv()+'</span></div>';
  return '<div class="g2-stage" style="height:'+SH+'px"><canvas id="g2_stc" role="img" aria-label="Seu herói com a arma equipada na mão, a asa e o pet na frente" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas>'
    +who+L.map((s,i)=>cell(s,i,false)).join('')+R.concat(rest).map((s,i)=>cell(s,i,true)).join('')+'</div>'; }

function fcRowHtml(narrow){ const nb=SL().reduce((a,s)=>a+(slotOpen(s)&&betterIn(s)?1:0),0);
  return '<div class="g2-fcrow"><div class="g2-fcb"><small>PODER (FC)</small><b id="g2_fc" style="font-size:'+(narrow?21:26)+'px">'+esc2(fcTxt(fcNow()))+'</b><em class="'+(nb?'':'m')+'">'+(nb?(nb===1?'1 espaço tem peça melhor':nb+' espaços têm peça melhor'):'Você já usa o melhor que tem')+'</em></div>'
    +'<button class="g2-ib" data-x="forge" aria-label="Abrir a Forja">'+SV.hammer+'<span>Forja</span></button>'
    +'<button class="g2-ib" data-x="look" aria-label="Abrir a Aparência">'+SV.shirt+'<span>Visual</span></button>'
    +'<button class="g2-bt best" data-x="best" aria-label="Equipar o melhor de cada espaço"><span>'+SV.star+'Equipar</span><span>o melhor</span></button></div>'; }

const dCls=d=>Math.abs(d)<1?'g2-eq0':d>0?'g2-up':'g2-dn2';
const dTxt=d=>Math.abs(d)<1?'igual':(d>0?'+':'−')+fcTxt(Math.abs(d));
function statCells(a,b,narrow){ return '<div class="g2-sts" style="grid-template-columns:repeat('+(narrow?2:4)+',minmax(0,1fr))">'+[['ATQ','atk'],['VIDA','hp'],['DEF','def'],['CRÍT','crit']].map(k=>{ const d=b[k[1]]-a[k[1]], cr=k[1]==='crit', same=cr?Math.abs(d)<0.05:Math.abs(d)<0.5, f=v=>cr?pc(v):num(v);
    return '<div><small>'+k[0]+'</small><b>'+esc2(f(b[k[1]]))+'</b><em class="'+(same?'g2-eq0':d>0?'g2-up':'g2-dn2')+'">'+(same?'igual':esc2((d>0?'+':'−')+f(Math.abs(d))))+'</em></div>'; }).join('')+'</div>'; }
const vsCell=(tag,x,slot)=>'<div style="--rc:'+(x?rcol(x):'#55608f')+'"><small>'+tag+'</small><b'+(x?' style="color:'+rcol(x)+'"':'')+'>'+esc2(x?iName(x):'espaço vazio')+'</b><em>'+(x?esc2(rname(x))+' · Nv. '+(x.lvl||1)+' · FC '+esc2(fcTxt(pieceFc(x))):esc2(slotShort(slot)))+'</em></div>';

/* faixa de detalhe: a parte de cima fica presa no topo da rolagem (peça, FC antes → depois e os botões); embaixo, "novo × o seu", atributos e nível */
function detHtml(narrow){ const it=X.sel!=null?byId(X.sel):null; if(!it) return '';
  const eq=isEq(it), ok=canEq(it), rc=rcol(it), sl=it.slot, fl=forgeLv(sl), id=esc2(it.id), u=eq&&X.undo&&String(X.undo.id)===String(it.id)?X.undo:null, prev=u&&u.prev!=null?byId(u.prev):null, cur=eq?null:eqOf(sl);
  let A=null, B=null, label='';
  try{ if(!eq&&ok){ A=snap(); B=snap({item:it}); label='FC ATUAL → NOVA'; }
    else if(eq&&prev){ A=snap({item:prev}); B=snap(); label='FC ANTES → AGORA'; }
    else if(eq){ A=snap({item:it,remove:true}); B=snap(); label='FC SEM → COM ELA'; } }catch(e){ A=B=null; }
  const dorm=tr(()=>Sys.stats.dormantInfo(it,Sys.host),null);
  const sub=esc2(slotShort(sl))+' · Nv. '+(it.lvl||1)+' · '+esc2(eraName(eraOfItem(it)))+' · Forja +'+fl+(eq?' · <b>usando</b>':ok?'':' · <b>'+esc2(whyNot(it))+'</b>')+(dorm&&dorm.dormant?' · <b>'+esc2(dorm.label)+'</b>':'');
  const head='<div class="g2-dt">'+ico(it,'g2-di0')+'<div class="g2-di"><div class="g2-dn">'+esc2(iName(it))+' <span class="g2-rar" style="color:'+rc+'">'+esc2(rname(it))+'</span></div><div class="g2-dh">'+sub+'</div></div>'
    +'<button class="g2-dx" data-x="close" aria-label="Fechar o detalhe">'+SV.x+'</button></div>';
  const cmp=A&&B?'<div class="g2-cmp"><small>'+label+'</small><span class="a">'+esc2(fcTxt(A.fc))+'</span>'+SV.go+'<span class="b">'+esc2(fcTxt(B.fc))+'</span><span class="d '+dCls(B.fc-A.fc)+'">'+esc2(dTxt(B.fc-A.fc))+'</span></div>'
    :'<div class="g2-cmp"><span class="g2-msg">'+esc2(whyNot(it))+'. A FC entra quando a peça puder ser equipada.</span></div>';
  const eqB=u?'<button class="g2-bt off" data-x="undo"><span>'+SV.undo+'Voltar</span></button>'
    :eq?'<span class="g2-bt on" role="status"><span>Usando</span></span>'
    :'<button class="g2-bt blue" data-x="equip" data-id="'+id+'" aria-disabled="'+(!ok)+'"><span>'+(ok?'Equipar':esc2(lockShort(it)))+'</span></button>';
  const disB='<button class="g2-bt '+(eq?'off':'red')+'" data-x="dism" data-id="'+id+'" aria-disabled="'+eq+'"><span>'+(eq?'Em uso':'Desmontar')+'</span></button>';
  const top='<div class="g2-det" id="g2_det" style="--rc:'+rc+'">'+head+cmp+'<div class="g2-acts"><button class="g2-bt" data-x="forge" data-slot="'+esc2(sl)+'"><span>'+SV.hammer+'Forjar</span><small>Forja +'+fl+'</small></button>'+disB+eqB+'</div></div>';
  const c=upPlan(it), mx=maxPlan(it);
  const vs=!eq?'<div class="g2-vs">'+vsCell('NOVO',it,sl)+'<i aria-hidden="true">×</i>'+vsCell('O SEU',cur,sl)+'</div>':prev?'<div class="g2-vs">'+vsCell('AGORA',it,sl)+'<i aria-hidden="true">×</i>'+vsCell('ANTES',prev,sl)+'</div>':'';
  const more='<div class="g2-more" id="g2_more">'+vs+(A&&B?statCells(A,B,narrow):'')
    +'<div class="g2-acts"><button class="g2-bt" data-x="up" data-id="'+id+'" aria-disabled="'+(!c.ok)+'"><span>Nível '+(it.lvl||1)+' → '+((it.lvl||1)+1)+'</span><small>'+esc2(c.ok||c.reason==='money'?gold(c.gold)+' de ouro':upWhy(c,it))+'</small></button>'
    +'<button class="g2-bt" data-x="upmax" data-id="'+id+'" aria-disabled="'+(!mx.n)+'"><span>Subir o máximo</span><small>'+(mx.n?'até o nível '+mx.to+' · '+esc2(gold(mx.sum))+' de ouro':'o ouro não dá para mais')+'</small></button></div></div>';
  return top+more; }

function tabsHtml(){ return '<div class="g2-tabs" role="tablist" aria-label="Mochila">'+TABS.map(t=>'<button class="g2-tab" role="tab" data-x="tab" data-t="'+t[0]+'" aria-selected="'+(X.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'; }

/* ---------- mochila: armas, peças e asas ---------- */
const inTab=(it,t)=>t==='weapon'?it.slot==='weapon':t==='wing'?it.slot==='wing':it.slot!=='weapon'&&it.slot!=='wing';
const gearSlots=()=>SL().filter(s=>s!=='weapon'&&s!=='wing');
function listItems(){ let L=inv().filter(i=>inTab(i,X.tab));
  if(X.tab==='gear'&&X.sf!=='all') L=L.filter(i=>i.slot===X.sf);
  if(X.rf>=0) L=L.filter(i=>(i.r|0)===X.rf);
  const g=i=>canEq(i)?gain(i):-Infinity;
  const by={fc:(a,b)=>{ const x=g(b), y=g(a); return x===y?0:x>y?1:-1; },rar:(a,b)=>(b.r|0)-(a.r|0)||(b.e|0)-(a.e|0)||(b.lvl|0)-(a.lvl|0),lvl:(a,b)=>(b.lvl|0)-(a.lvl|0)||(b.r|0)-(a.r|0)}[X.sort]||(()=>0);
  return L.sort((a,b)=>(isEq(b)-isEq(a))||by(a,b)||((a.id>b.id)-(a.id<b.id))); }
function cellHtml(it){ const eq=isEq(it), ok=canEq(it), d=eq||!ok?0:gain(it), sel=X.sel!=null&&String(X.sel)===String(it.id), fl=eq?forgeLv(it.slot):0;
  const tag=eq?'<span style="color:var(--gold)">Usando</span>':!ok?esc2(lockShort(it)):Math.abs(d)<1?'igual':'<span class="'+(d>0?'g2-up':'g2-dn2')+'">'+esc2(dTxt(d))+'</span>';
  return '<div><button class="g2-cell'+(ok?'':' lock')+(sel?' sel':'')+'" style="--rc:'+rcol(it)+'" data-x="item" data-id="'+esc2(it.id)+'" aria-pressed="'+sel+'" aria-label="'+esc2(iName(it)+', '+rname(it)+', nível '+(it.lvl||1)+(eq?', usando':'')+(ok?'':', '+whyNot(it)))+'"><img src="'+esc2(thumb(it))+'" alt="" loading="lazy">'
    +(eq?'<span class="eqb">Usando</span>':'')+(fl?'<span class="fg">+'+fl+'</span>':'')+'<span class="lv">'+(it.lvl||1)+'</span>'+(!ok?'<span class="lk">'+SV.lock+'</span>':(!eq&&d>0.5?'<span class="ar">'+SV.up+'</span>':''))+'</button><div class="g2-cn">'+tag+'</div></div>'; }
const rarsIn=()=>[...new Set(inv().filter(i=>inTab(i,X.tab)).map(i=>i.r|0))].sort((a,b)=>a-b);
function itemsBody(){ const L=listItems(), n=inv().length, mx=bagMax(), full=n>=mx, isGear=X.tab==='gear';
  const fb=(x,lab,val,col)=>'<button class="g2-fb" data-x="'+x+'" aria-label="'+esc2(lab+': '+val)+'. Toque para trocar"><small>'+lab+'</small><b'+(col?' style="color:'+col+'"':'')+'>'+esc2(val)+'</b></button>';
  let h='<div class="g2-filt" role="group" aria-label="Filtro e ordem" style="grid-template-columns:repeat('+(isGear?3:2)+',minmax(0,1fr))">'
    +(isGear?fb('sf','Peça',X.sf==='all'?'Todas':slotShort(X.sf)):'')
    +fb('rf','Raridade',X.rf<0?'Todas':rnameOf(X.rf),X.rf<0?'':rcol({r:X.rf}))+fb('sort','Ordem',(SORTS.find(s=>s[0]===X.sort)||SORTS[0])[1])+'</div>';
  h+='<div class="g2-sec"><span>'+esc2((TABS.find(t=>t[0]===X.tab)||TABS[0])[1])+'</span><span'+(full?' style="color:var(--red)"':'')+'>Mochila <b>'+n+'/'+mx+'</b></span></div>';
  if(X.sel==null) h+='<p class="g2-hint">'+(CFG.tapSwap?'Tocou, trocou: a peça vai para o herói na hora.':'Toque numa peça para ver a prévia e comparar.')+' O número embaixo é quanto a FC muda; a <b>seta verde</b> marca o que é melhor.</p>';
  h+=L.length?'<div class="g2-grid">'+L.map(cellHtml).join('')+'</div>':'<div class="g2-empty">'+(X.rf>=0||(isGear&&X.sf!=='all')?'Nenhuma peça com esse filtro.':'Nada aqui ainda. As peças vêm de inimigos, chefes e baús.')+'</div>';
  return h; }

/* ---------- mochila: pets, montarias, skins, materiais e consumíveis (só leitura; cada um abre a tela dele) ---------- */
const petImg=id=>{ if(PET_ART[id]) return 'assets/icons/pets/'+PET_ART[id]+'.png'; const P=Sys.pet, d=tr(()=>P.DATA.pets.find(p=>p.id===id),null), sp=d&&d.sprite, st=tr(()=>P.stage(S,id).index|0,0);
  return sp?'assets/icons/pets/'+sp+['_ref','_mid','_evo'][Math.max(0,Math.min(2,st))]+'.png':'assets/icons/menu/pets.png'; };
const mountImg=id=>'assets/icons/mounts/'+(MOUNT_ART[id]||id)+'.png';
const goCell=o=>'<div><button class="g2-cell" style="--rc:'+o.rc+'" data-x="go" data-to="'+o.to+'" aria-label="'+esc2(o.name+(o.eq?', em uso':'')+'. Abrir '+o.scr)+'"><img src="'+esc2(o.img)+'" alt="" loading="lazy">'+(o.eq?'<span class="eqb">Usando</span>':'')+'</button><div class="g2-cn" style="color:var(--text)">'+esc2(o.name)+'</div></div>';
const rowHtml=(img,name,sub,v)=>'<div class="g2-row"><img src="'+esc2(img)+'" alt="" loading="lazy"><div><b>'+esc2(name)+'</b><small>'+esc2(sub)+'</small></div><strong>'+esc2(v)+'</strong></div>';
const secHtml=(a,b)=>'<div class="g2-sec"><span>'+a+'</span><span>'+b+'</span></div>';
const emptyHtml=m=>'<div class="g2-empty">'+esc2(m)+'</div>';
const goBtn=(to,label)=>'<div class="g2-acts" style="margin:0 0 10px"><button class="g2-bt" data-x="go" data-to="'+to+'"><span>'+label+'</span></button></div>';
function petsBody(){ const P=tr(()=>Sys.pet,null), o=P&&P.ensure?tr(()=>P.ensure(S),null):null; if(!o) return secHtml('Pets','o pet fica na frente do herói')+emptyHtml('Pets: em breve');
  const ids=Object.keys(o.owned||{}), def=id=>tr(()=>P.DATA.pets.find(p=>p.id===id),null)||{name:id,r:0};
  if(!ids.length) return secHtml('Pets','o pet fica na frente do herói')+emptyHtml('Você ainda não tem pet.');
  return secHtml('Pets','o pet fica na frente do herói')+'<div class="g2-grid">'+ids.sort((a,b)=>(def(b).r|0)-(def(a).r|0)).map(id=>goCell({to:'pets',scr:'Pets',img:petImg(id),name:def(id).name||id,rc:rcol({r:Math.min(4,def(id).r|0)}),eq:o.eq===id})).join('')+'</div>'+goBtn('pets','Abrir Pets'); }
function mountsBody(){ const M=tr(()=>Sys.mount,null), o=M&&M.ensure?tr(()=>M.ensure(S),null):null; if(!o) return secHtml('Montarias','na batalha, o herói vai montado')+emptyHtml('Montarias: em breve');
  const ids=Object.keys(o.owned||{}), def=id=>tr(()=>M.DATA.mounts.find(m=>m.id===id),null)||{name:id,r:0};
  if(!ids.length) return secHtml('Montarias','na batalha, o herói vai montado')+emptyHtml('Você ainda não tem montaria.');
  return secHtml('Montarias','na batalha, o herói vai montado')+'<div class="g2-grid">'+ids.sort((a,b)=>(def(b).r|0)-(def(a).r|0)).map(id=>goCell({to:'mounts',scr:'Montarias',img:mountImg(id),name:def(id).name||id,rc:rcol({r:Math.min(4,def(id).r|0)}),eq:o.eq===id})).join('')+'</div>'+goBtn('mounts','Abrir Montarias'); }
function skinsBody(){ const fx=tr(()=>Sys.appearance.fixedSkins(S,Sys.host).filter(k=>k&&k.owned),[]), head=secHtml('Skins','trocar na Aparência');
  return head+(fx.length?'<div class="g2-grid">'+fx.map(k=>goCell({to:'look',scr:'Aparência',img:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':'assets/icons/menu/equipment.png',name:k.name||k.id,rc:rcol({r:Math.min(4,k.r|0)}),eq:!!k.equipped})).join('')+'</div>':emptyHtml('Nenhuma skin ainda. As skins que você ganhar aparecem aqui.'))+goBtn('look','Abrir a Aparência'); }
function matsBody(){ const s=Sys, rows=[];
  rows.push(rowHtml('assets/icons/menu/forge.png','Pedras de forja','Vêm de desmontar e dos chefes',gold(tr(()=>s.forge.ensure(S).stones,0))));
  if(tr(()=>!!s.practice.ensure,false)) rows.push(rowHtml('assets/icons/menu/summon.png','Pedras de treino','Sobem as Práticas',gold(tr(()=>s.practice.ensure(S).stones,0))));
  if(tr(()=>!!s.pet.ensure,false)) rows.push(rowHtml('assets/icons/menu/pets.png','Ração','Alimenta o pet',gold(tr(()=>s.pet.ensure(S).food,0))));
  rows.push(rowHtml('assets/ui/gem.png','Essência da Era','Transforma peças para a sua era',gold(tr(()=>s.loot.essence(S),0))));
  return secHtml('Materiais','vêm de jogar')+rows.join(''); }
function consBody(){ const s=Sys, rows=[];
  if(tr(()=>!!s.chest.ensure,false)){ const ch=tr(()=>s.chest.ensure(S).stored|0,0); rows.push(rowHtml('assets/ui/chest.png','Baús guardados',ch?'Abra no botão do baú, na batalha':'Os baús enchem com o tempo',gold(ch))); }
  const ks=tr(()=>s.instances.status(S,Sys.host),null); if(ks&&ks.total!=null) rows.push(rowHtml('assets/icons/menu/instances.png','Chaves de instância','Renovam todo dia',ks.total+'/'+ks.totalMax));
  const po=tr(()=>s.pet.ensure(S),null); if(po&&po.pre&&po.pre.length) rows.push(rowHtml('assets/icons/menu/pets.png','Ovos guardados','Chocam depois do 1º ovo',gold(po.pre.length)));
  return secHtml('Consumíveis','guardados para depois')+(rows.length?rows.join(''):emptyHtml('Nada guardado agora.')); }

function askHtml(){ const it=X.ask!=null?byId(X.ask):null; if(!it||inUse(it)) return ''; const rc=rcol(it), g=tr(()=>Sys.stats.dismantleGold(it)|0,0), st=tr(()=>{ const f=Sys.loot.DATA.dismantle.forge; return f[Math.max(0,Math.min(f.length-1,it.r|0))]|0; },0);
  return '<div class="g2-shade"><div class="g2-modal" role="dialog" aria-modal="true" aria-label="Confirmar desmontar"><h3>Desmontar?</h3>'
    +'<div class="g2-dt" style="--rc:'+rc+';padding:8px;border-radius:14px;background:rgba(5,8,28,.5);margin-bottom:10px">'+ico(it,'g2-di0')+'<div class="g2-di"><div class="g2-dn">'+esc2(iName(it))+'</div><div class="g2-rar" style="color:'+rc+'">'+esc2(rname(it))+' · Nv. '+(it.lvl||1)+'</div></div></div>'
    +'<p>A peça some da mochila. Você recebe:</p><div class="g2-gain"><span>+'+esc2(gold(g))+' de ouro</span>'+(st?'<span>+'+pl(st,'pedra','pedras')+' de forja</span>':'')+'</div><p>Não dá para desfazer.</p>'
    +'<div class="g2-acts" style="margin-top:12px"><button class="g2-bt off" data-x="askno" style="flex:.7 1 0"><span>Cancelar</span></button><button class="g2-bt red" data-x="dismok" data-id="'+esc2(it.id)+'"><span>Desmontar</span></button></div></div></div>'; }

/* ================= desenho da tela ================= */
function tidy(){ if(!S.eq||typeof S.eq!=='object') S.eq={};
  if(!TABS.some(t=>t[0]===X.tab)) X.tab='weapon';
  if(X.sel!=null&&!byId(X.sel)) X.sel=null;
  if(X.undo&&(X.sel==null||String(X.undo.id)!==String(X.sel)||!isEq(byId(X.undo.id)))) X.undo=null;
  if(X.pv!=null){ const p=byId(X.pv); if(!p||isEq(p)||!pvAble(p)) X.pv=null; }
  if(X.ask!=null){ const a=byId(X.ask); if(!a||inUse(a)) X.ask=null; }
  if(X.sf!=='all'&&gearSlots().indexOf(X.sf)<0) X.sf='all'; }
const elH=id=>{ try{ const e=document.getElementById(id); return e?(+e.offsetHeight||0):0; }catch(e){ return 0; } };
function draw(){ C=null; tidy();
  const d=xDims(240)||{}, Hh=+d.H||0, SH=Hh&&Hh<600?196:236, narrow=(+d.Wb||390)<350;
  let y0=0, h0=0; try{ const sc0=X.top?null:document.getElementById('g2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; h0=elH('g2_det')+elH('g2_more'); }catch(e){}
  const t=X.tab, body=t==='weapon'||t==='gear'||t==='wing'?itemsBody():t==='pets'?petsBody():t==='mounts'?mountsBody():t==='skins'?skinsBody():t==='mats'?matsBody():consBody();
  const f=X.fly&&now()-X.fly.t<1600?'<div class="g2-fly '+(X.fly.up?'g2-up':'g2-dn2')+'" style="top:'+(SH-30)+'px;animation-delay:'+(X.fly.t-now())+'ms">'+esc2(X.fly.txt)+'</div>':'';
  V.innerHTML=xWrap(d,'','<div class="g2'+(X.anim?' g2-in':'')+'"><div class="g2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div>'
    +stageHtml(SH)
    +'<div id="g2_scroll" class="g2-scroll x-scroll">'+fcRowHtml(narrow)+detHtml(narrow)+tabsHtml()+'<div class="g2-body">'+body+'</div></div>'
    +f+'<div id="g2_toast">'+(X.toast&&now()-X.toastT<2000?toastHtml(X.toast):'')+'</div>'+askHtml()+'</div>');
  /* a faixa de detalhe entra e sai acima da grade: a rolagem compensa a diferença para a grade não pular debaixo do dedo */
  if(y0>0){ try{ const sc=document.getElementById('g2_scroll'); if(sc) sc.scrollTop=Math.max(0,y0+(elH('g2_det')+elH('g2_more')-h0)); }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart(); }
/* o que muda por fora (drop novo, ouro, nível, forja): o tick redesenha só quando muda */
function sig(){ return tr(()=>{ const it=X.sel!=null?byId(X.sel):null; let u=''; if(it){ const c=upPlan(it); u=c.ok+':'+c.reason+':'+maxPlan(it).to+':'+(it.lvl|0); }
    return [X.tab,X.sf,X.rf,X.sort,X.sel,X.pv,X.ask,(S.inv||[]).length,S.nextId,SL().map(s=>(S.eq?S.eq[s]:'')+':'+forgeLv(s)).join(','),lv(),u,S.hero||''].join('|'); },''); }

/* ================= ações ================= */
function equip(it){ if(!it||!byId(it.id)||isEq(it)) return false;
  if(!canEq(it)){ sfx('ui_tap'); say(whyNot(it)); return false; }
  const cur=eqOf(it.slot), f0=fcNow(); S.eq[it.slot]=it.id; delete it.nw; changed();
  X.sel=it.id; X.undo={id:it.id,prev:cur?cur.id:null}; X.pv=null; fly(fcNow()-f0); sfx('equip'); say('Equipou: '+iName(it)); redraw(); return true; }
function undo(){ const u=X.undo, it=u?byId(u.id):null; if(!it||!isEq(it)) return; const p=u.prev!=null?byId(u.prev):null, f0=fcNow();
  if(p) S.eq[it.slot]=p.id; else delete S.eq[it.slot]; changed();
  X.undo=null; X.sel=it.id; X.pv=null; fly(fcNow()-f0); sfx('ui_tap'); say(p?'Voltou: '+iName(p):'Voltou: espaço vazio'); redraw(); }
function tapItem(id){ const it=byId(id); if(!it) return; delete it.nw; sfx('ui_tap'); call(typeof tutEvent==='function'?tutEvent:null,'view');
  if(isEq(it)){ X.sel=it.id; X.pv=null; redraw(); return; }
  if(!canEq(it)){ X.sel=it.id; X.undo=null; X.pv=pvAble(it)?it.id:null; say((X.pv!=null?'Prévia no herói. ':'')+whyNot(it)); redraw(); return; }
  if(CFG.tapSwap){ equip(it); return; }
  X.sel=it.id; X.undo=null; X.pv=pvAble(it)?it.id:null; redraw(); }
function tapSlot(s){ if(!slotOk(s)) return; sfx('ui_tap'); const it=eqOf(s);
  X.tab=s==='weapon'?'weapon':s==='wing'?'wing':'gear'; X.sf=X.tab==='gear'?s:'all'; X.rf=-1; X.sel=it?it.id:null; X.undo=null; X.pv=null; X.top=true;
  if(!slotOpen(s)) say('A asa abre no nível '+wingLv()); redraw(); }
function best(){ const f0=fcNow(), p=tr(()=>bestPlan(),null);
  if(!p||!p.n){ sfx('ui_tap'); say('Você já está com o melhor equipamento'); return; }
  S.eq=p.eq; changed(); X.sel=null; X.undo=null; X.pv=null; const d=fcNow()-f0; fly(d); sfx('upgrade');
  say(pl(p.n,'peça trocada','peças trocadas')+(d>=1?' · FC +'+fcTxt(d):'')); redraw(); }
function askDism(id){ const it=byId(id); if(!it) return; sfx('ui_tap'); if(inUse(it)){ say('Em uso: equipe outra peça antes de desmontar'); return; } X.ask=it.id; redraw(); }
function doDism(id){ const it=byId(id); X.ask=null; if(!it){ redraw(); return; }
  if(inUse(it)){ sfx('ui_tap'); say('Em uso: equipe outra peça antes de desmontar'); redraw(); return; }
  const nm=iName(it), r=tr(()=>Sys.loot.dismantle(S,Sys.host,it),null); if(!r){ sfx('ui_tap'); say('Não deu para desmontar agora'); redraw(); return; }
  S.inv=S.inv.filter(x=>x!==it&&!(x&&x.id===it.id)); if(String(X.sel)===String(it.id)) X.sel=null; X.undo=null; X.pv=null; changed(); sfx('coin');
  say('Desmontou '+nm+': +'+gold(r.gold||0)+' de ouro'+(r.forge?' · +'+pl(r.forge,'pedra','pedras')+' de forja':'')); redraw(); }
function levelUp(id,all){ const it=byId(id); if(!it) return; const eq=isEq(it), f0=fcNow(); let r=null, n=0;
  if(all){ const mx=maxPlan(it); if(!mx.n){ sfx('ui_tap'); say(upWhy(upPlan(it),it)); return; } r=tr(()=>Sys.stats.upgradeTo(S,Sys.host,it,'gold',mx.to),null); n=mx.n; }
  else { const c=upPlan(it); if(!c.ok){ sfx('ui_tap'); say(upWhy(c,it)); return; } r=tr(()=>Sys.stats.upgrade(S,Sys.host,it,'gold'),null); n=1; }
  if(!r||!r.ok){ sfx('ui_tap'); say('Não deu para melhorar agora'); redraw(); return; }
  call(typeof ptrack==='function'?ptrack:null,'upgrade',n); changed(); call(typeof tutEvent==='function'?tutEvent:null,'up');
  if(eq) fly(fcNow()-f0); sfx('upgrade'); say(iName(it)+': nível '+it.lvl); redraw(); }
/* outras telas: o Voltar delas traz de volta para cá ({from}); chave desligada = "em breve" */
const SCR={pets:'Pets',mounts:'Montarias',look:'Aparência',forge:'Forja'};
function go(to,o){ if(!SCR[to]) return; sfx('ui_tap'); const ok=tr(()=>!!(window.Panels&&Panels.open(to,Object.assign({from:NAME},o||{}))),false); if(!ok) say(SCR[to]+': em breve'); }
function goForge(slot){ const open=tr(()=>typeof xUnlocked==='function'?!!xUnlocked('forge'):Sys.level.isUnlocked(S,'forge'),true);
  if(!open){ sfx('ui_tap'); say('A Forja libera no nível '+tr(()=>typeof xUnlockLv==='function'?xUnlockLv('forge'):Sys.level.unlockLevel('forge'),1)); return; }
  const it=X.sel!=null?byId(X.sel):null, s=slotOk(slot)?slot:it?it.slot:null; go('forge',s?{slot:s}:null); }
const cycle=(list,cur)=>list[(Math.max(0,list.indexOf(cur))+1)%list.length];

function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||'';
  if(a==='askno'){ sfx('ui_tap'); X.ask=null; redraw(); return; }
  if(a==='dismok'){ doDism(ds.id); return; }
  if(X.ask!=null) return;                                /* confirmação aberta: só Cancelar ou Desmontar */
  if(a==='tab'){ const t=TABS.some(x=>x[0]===ds.t)?ds.t:'weapon'; sfx('ui_tap'); if(t===X.tab) return; X.tab=t; X.sf='all'; X.rf=-1; X.sel=null; X.undo=null; X.pv=null; X.top=true; redraw(); }
  else if(a==='slot') tapSlot(ds.slot);
  else if(a==='sf'){ sfx('ui_tap'); X.sf=cycle(['all'].concat(gearSlots()),X.sf); redraw(); }
  else if(a==='rf'){ sfx('ui_tap'); X.rf=cycle([-1].concat(rarsIn()),X.rf); redraw(); }
  else if(a==='sort'){ sfx('ui_tap'); X.sort=cycle(SORTS.map(s=>s[0]),X.sort); redraw(); }
  else if(a==='item') tapItem(ds.id);
  else if(a==='close'){ sfx('ui_tap'); X.sel=null; X.undo=null; X.pv=null; redraw(); }
  else if(a==='pvout'){ sfx('ui_tap'); X.pv=null; redraw(); }
  else if(a==='equip') equip(byId(ds.id));
  else if(a==='undo') undo();
  else if(a==='best') best();
  else if(a==='forge') goForge(ds.slot);
  else if(a==='look') go('look');
  else if(a==='go') go(ds.to);
  else if(a==='dism') askDism(ds.id);
  else if(a==='up') levelUp(ds.id,false);
  else if(a==='upmax') levelUp(ds.id,true);
}

function stop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }
const def=Panels.add(NAME,{title:'Equipamento',render:draw,click:click,actions:ACTIONS,
  tick(){ if(X.ask!=null) return; if(X.sig&&isOn()&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  /* a aba e os filtros ficam como estavam (voltar da Forja cai na mesma aba); o que é passageiro é limpo */
  onOpen(o){ X.anim=true; X.top=true; X.sel=null; X.undo=null; X.pv=null; X.ask=null; X.fly=null; X.toast=''; X.t0=0; C=null;
    if(o&&o.tab&&TABS.some(t=>t[0]===o.tab)){ X.tab=o.tab; X.sf='all'; X.rf=-1; }
    if(o&&o.slot&&slotOk(o.slot)){ X.tab=o.slot==='weapon'?'weapon':o.slot==='wing'?'wing':'gear'; X.sf=X.tab==='gear'?o.slot:'all'; X.rf=-1; const it=eqOf(o.slot); X.sel=it?it.id:null; } },
  onClose(){ X.sel=null; X.undo=null; X.pv=null; X.ask=null; X.fly=null; X.toast=''; C=null; stop(); } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) e a chave do toque */
window.Gear2={X:X,cfg:CFG,actions:ACTIONS,def:def,best:bestLocal};
})();
