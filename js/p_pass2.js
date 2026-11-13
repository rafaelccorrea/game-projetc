'use strict';
/* ================= PASSE DA TEMPORADA V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.pass2) =================
   Protótipo: docs/proto/v2/Passe.html · passagem: docs/proto/v2/PASSAGEM.md (seções 0 e 9). Não substitui o Passe de hoje (js/screens2.js, 'pass'): é outra tela ('pass2').
   NENHUMA regra, prêmio, nível nem preço aqui. Tudo vem dos módulos:
   - níveis, XP, trilhas grátis e premium, temporada, missões, resgatar, guardados: Sys.pass (DATA, refresh, season, progress, reward, claimTier, claimAll, list, claimMission, held);
   - portões de raridade e da asa (item "guardado até o nível N"): Sys.loot (maxAllowedR, DATA.gates, DATA.wing), as mesmas leituras que o Sys.pass faz por dentro;
   - skin do último nível premium: Sys.appearance (DATA.passSkin, DATA.skinsOn, FIXED); montaria que recebe os fragmentos: Sys.mount; fragmento de pet das diárias: Sys.newDrops + Sys.pet;
   - COMPRA do premium: só pelo Sys.buy (ajudantes xBuyReady / xBuyProds / xBuyPrice / xBuy do js/screens.js). Com a compra real desligada (Sys.buy.DATA.on false) a tela
     NÃO mostra preço nem botão de compra: só "Em breve". Esta tela nunca liga o premium por conta própria (quem liga é a entrega do Sys.buy).
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói com a arma NA MÃO, a asa e o PET POR ÚLTIMO (na frente). A pé por padrão, como no protótipo.
   PRÉVIA: tocar na skin, na asa, na arma, no fragmento de montaria ou no pet de um prêmio mostra a peça NO herói ("Prévia: X · Sair"), pelo state do drawHeroFull
   (skin, wing, weapon, mount, pet). Nenhuma janela por cima. Skin nunca traz asa no corpo (a pasta sem asa é do Sys.appearance); asa é só item.
   O arquivo roda em escopo próprio. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('pass2' in PANEL_ON)) PANEL_ON.pass2=false;

const X={tab:'track',pv:null,sheet:false,toast:'',toastT:0,lvup:null,anim:true,top:true,sig:'',raf:0,t0:0};
const ACTIONS=['tab','claim','all','pv','pvout','mclaim','mgo','prem','sclose','buy','back'];

/* ---------- leituras dos módulos ---------- */
const PS=()=>Sys.pass, PD=()=>Sys.pass.DATA;
const now=()=>Date.now();
const hostNow=()=>{ try{ const h=Sys.host; if(h&&typeof h.now==='function'){ const v=+h.now(); if(isFinite(v)) return v; } }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view==='pass2';
const redraw=()=>{ if(isOn()&&typeof render==='function') render(); };
const call=(fn,a,b)=>{ try{ if(typeof fn==='function') return fn(a,b); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const int0=v=>Math.max(0,Math.floor(+v||0));
const ready=()=>{ try{ return !!(window.Sys&&Sys.pass&&Sys.host&&typeof Sys.pass.claimTier==='function'); }catch(e){ return false; } };
const locked=()=>{ try{ return typeof xUnlocked==='function'&&!xUnlocked('pass'); }catch(e){ return false; } };
const gateLv=()=>{ try{ return typeof xUnlockLv==='function'?xUnlockLv('pass'):1; }catch(e){ return 1; } };
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
const pLevel=()=>{ try{ const h=Sys.host; if(h&&typeof h.level==='function'){ const v=+h.level(); if(isFinite(v)) return v; } }catch(e){} try{ return +plv()||1; }catch(e){ return 1; } };
const eraNow=()=>{ try{ return Math.max(0,Math.min(8,Sys.host.eraMax()|0)); }catch(e){ return 0; } };
const eraName=e=>{ try{ return (typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n)||('Era '+(e+1)); }catch(er){ return 'Era '+(e+1); } };
const rcol=r=>{ try{ return RC[Math.max(0,Math.min(RC.length-1,r|0))]||'#a9b3c9'; }catch(e){ return '#a9b3c9'; } };
const rnm=r=>{ try{ return RN(r)||''; }catch(e){ return ''; } };
const kfT=v=>{ try{ return String(kf(v)); }catch(e){ return String(Math.round(v)); } };
const reduced=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
/* textos (não são regra): nome curto do espaço e o gênero da palavra da raridade ("Arma Rara", "Luvas Raras", "Chapéu Raro") */
const SLN={weapon:'Arma',armor:'Armadura',hat:'Chapéu',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'};
const GEN={weapon:'f',armor:'f',wing:'f',gloves:'fp',boots:'fp',hat:'m',necklace:'m'};
const sln=s=>SLN[s]||'Item';
const rarW=(r,sl)=>{ const b=rnm(r), g=GEN[sl]||'m'; if(g==='m') return b; const f=b.replace(/o$/,'a'); return g==='fp'?f+'s':f; };
const icoOf=(sl,e,r)=>{ try{ return String(slotIcon(sl,e,r)||''); }catch(er){ return ''; } };
const IMG_COIN='assets/ui/coin.png', IMG_GEM='assets/ui/gem.png';
const MATN={forge:['pedra de forja','pedras de forja'],essence:['essência','essências'],food:['ração de pet','rações de pet']};

/* portões: as MESMAS leituras do Sys.pass (canReceive, needLevel e seasonR não são exportados pelo módulo) */
const maxR=()=>{ try{ const L=Sys.loot; return L&&L.maxAllowedR?L.maxAllowedR(Sys.host):4; }catch(e){ return 4; } };
const wingRule=()=>{ try{ const w=Sys.loot.DATA.wing; return {lv:+w.minLevel||1,r:+w.minR||0}; }catch(e){ return {lv:1,r:0}; } };
function canRecv(sp){ try{ const L=Sys.loot; if(!L||!L.maxAllowedR) return true; if(L.maxAllowedR(Sys.host)<sp.r) return false;
    if(sp.slot==='wing'){ const w=wingRule(); if(pLevel()<w.lv||sp.r<w.r) return false; } return true; }catch(e){ return true; } }
function needLv(sp){ try{ const g=Sys.loot.DATA.gates[sp.r]||{lvl:1}; return Math.max(+g.lvl||1,sp.slot==='wing'?wingRule().lv:1); }catch(e){ return 1; } }
function seasonR(sp){ let r=Math.max(0,Math.min(4,sp.r|0)); r=Math.min(r,maxR()); if(sp.slot==='weapon'&&r===3) r=2; return r; }
/* bônus de XP do passe (premium + VIP de conveniência): a mesma soma do Sys.pass.addXp, só para MOSTRAR o XP de cada missão */
function xpPct(){ let p=0; try{ if(PS().ensure(S).premium) p+=+PD().premiumXpPct||0; }catch(e){} try{ const c=Sys.vip&&Sys.vip.conv?Sys.vip.conv(S,'passXp'):null; p+=Math.max(0,Number(c&&c.value)||0); }catch(e){} return p; }
const xpGain=px=>Math.round(int0(px)*(1+xpPct()/100));

/* compra real: só com o Sys.buy pronto E o produto do catálogo com preço. Senão null = "Em breve" (sem preço, sem botão de compra) */
function premProd(){ try{ if(typeof xBuyReady!=='function'||!xBuyReady()) return null; const p=xBuyProds('pass_premium')[0]; if(!p) return null; const pr=String(xBuyPrice(p.id)||''); return pr?{id:p.id,name:p.name||'Passe Premium',price:pr}:null; }catch(e){ return null; } }
/* skin do último nível premium (Sys.appearance): só existe quando o módulo entrega (skinsOn) e a skin não saiu de linha */
function passSkin(){ try{ const A=Sys.appearance; if(!A||!A.DATA||A.DATA.skinsOn!==true) return null; let id=A.DATA.passSkin; if(id&&typeof id==='object') id=id[heroId()];
    if(typeof id!=='string') return null; const k=(A.FIXED||[]).find(z=>z&&z.id===id); if(!k||k.off===true||!k.name) return null;
    return {id:id,name:String(k.name),r:k.r|0,av:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':'',art:k.art!==false}; }catch(e){ return null; } }
/* asa do prêmio: o tipo é o que o Sys.stats resolve para o item que o Passe cria */
function wingKind(sp){ try{ const T=Sys.stats, id=T.wingOf({slot:'wing',r:sp.r,e:eraNow()}); const W=T.DATA.wingTypes[id]; return typeof id==='string'&&W&&W.name?{id:id,name:String(W.name)}:null; }catch(e){ return null; } }
/* montaria que recebe os fragmentos (a equipada, ou a primeira que o jogador tem) e as estrelas depois do prêmio (custos do Sys.mount) */
function mountTarget(fr){ try{ const M=Sys.mount, o=M.ensure(S), id=o.eq||Object.keys(o.owned||{})[0]; if(!id) return null; const def=M.DATA.mounts.find(m=>m.id===id), x=o.owned[id]; if(!def||!x) return null;
    const C=M.DATA.starCost, mx=M.DATA.maxStars||5; let s=Math.max(1,x.stars|0), f=int0(x.frags)+int0(fr); while(s<mx&&C[s-1]>0&&f>=C[s-1]){ f-=C[s-1]; s++; }
    let ride=false; try{ ride=typeof MOUNT_TBL!=='undefined'&&!!MOUNT_TBL[id]&&typeof mountPrefix==='function'&&!!mountPrefix(id); }catch(e){ ride=false; }
    return {id:id,name:String(def.name),r:def.r|0,stars:s,up:s>(x.stars|0),ride:ride}; }catch(e){ return null; } }
/* fragmento de pet do bônus das diárias (Sys.newDrops 'missions:daily'); null = o módulo não entrega */
function dailyPet(){ try{ const N=Sys.newDrops, Pt=Sys.pet; if(!N||!N.DATA||N.DATA.on!==true||!Pt) return null; const rule=(N.DATA.sources['missions:daily']||[]).find(r=>r&&r.pet); if(!rule) return null;
    const def=Pt.DATA.pets.find(p=>p.id===rule.pet); if(!def) return null; const live=!def.nw||Pt.DATA.newPets===true||!!(Pt.DATA.newReady&&Pt.DATA.newReady[def.id]===true);
    const o=Pt.ensure(S), base=typeof def.sprite==='string'&&def.sprite?def.sprite:'pet_'+def.id; let fly=0; try{ const b=Pt.battleTable()[base]; fly=b&&b.fly>0?b.fly:0; }catch(e){}
    return {id:def.id,name:String(def.name),n:int0(rule.n)||1,live:live,owned:!!(o.owned&&o.owned[def.id]),have:int0(o.stored&&o.stored[def.id]),hatch:int0(def.hatchFrags),img:'assets/pets/'+base+'_ref.png',base:base,fly:fly}; }catch(e){ return null; } }
const skinOf=id=>{ try{ return typeof SKIN==='function'?SKIN(id)||null:null; }catch(e){ return null; } };
const eqWeapon=()=>{ try{ const id=S.eq&&S.eq.weapon; if(id==null) return ''; const it=(S.inv||[]).find(i=>i&&i.id===id); return it?String(iname(it)||''):''; }catch(e){ return ''; } };

/* ---------- o que cada prêmio é (só o que o Sys.pass entrega) ----------
   {rc, ic, av, name (HTML já escapado), sub (HTML já escapado), label (texto), pv (prévia no herói ou null), mini:{ic|frag, rc, pv, label}} */
function wpv(e,r){ const sk=skinOf('w'+e+r); let nm=''; try{ nm=String(iname({slot:'weapon',r:r,e:e})||''); }catch(er){} nm=nm||('Arma '+rarW(r,'weapon'));
  return sk?{kind:'weapon',name:nm,st:{weapon:sk}}:null; }
function rwInfo(trk,t){ const rw=PS().reward(trk,t), o={rc:rcol(0),ic:'',av:false,name:'',sub:'',label:'',pv:null,mini:null}; if(!rw) return o;
  const e=eraNow();
  if(rw.goldk){ let u=1; try{ u=Math.max(1,+Sys.host.goldUnit()||1); }catch(er){} o.ic=IMG_COIN; o.rc='#ffd25e'; o.label=kfT(Math.round(rw.goldk*u))+' de ouro'; o.name=esc2(o.label); o.sub='= '+n0(rw.goldk)+' abates da sua fase'; }
  else if(rw.gems&&!rw.item){ o.ic=IMG_GEM; o.rc='#5ee7ff'; o.label=n0(rw.gems)+' diamantes'; o.name=esc2(o.label); }
  if(rw.item){ const sp=rw.item;
    if(sp.season){ const r=seasonR(sp); o.rc=rcol(r); o.ic=icoOf(sp.slot,e,r); o.pv=sp.slot==='weapon'?wpv(e,r):null; o.label=sln(sp.slot)+' da temporada'; o.name=esc2(o.label);
      o.sub=r<sp.r?'chega <b>'+esc2(rarW(r,sp.slot))+'</b>, evolui até '+esc2(rarW(sp.r,sp.slot)):esc2(rarW(sp.r,sp.slot)); }
    else if(sp.slot==='wing'){ const wk=wingKind(sp), nm=wk?wk.name:sln('wing'); o.rc=rcol(sp.r); o.ic=icoOf('wing',e,sp.r); o.label=nm+' '+rarW(sp.r,'wing');
      o.pv=wk?{kind:'wing',name:o.label,st:{wing:wk.id}}:null; o.name=esc2(nm)+' <em>'+esc2(rarW(sp.r,'wing'))+'</em>';
      o.sub=canRecv(sp)?'vai para a mochila':'guardada até o <b>nível '+n0(needLv(sp))+'</b>'; }
    else { o.rc=rcol(sp.r); o.ic=icoOf(sp.slot,e,sp.r); o.pv=sp.slot==='weapon'?wpv(e,sp.r):null; o.label=sln(sp.slot)+' '+rarW(sp.r,sp.slot);
      o.name=esc2(sln(sp.slot))+' <em>'+esc2(rarW(sp.r,sp.slot))+'</em>'; o.sub=canRecv(sp)?esc2(eraName(e))+' (era liberada)':'guardada até o <b>nível '+n0(needLv(sp))+'</b>'; } }
  /* pacote do nível: materiais e fragmentos de montaria (números do prêmio) */
  { const ex=[], m=rw.mat&&typeof rw.mat==='object'?rw.mat:{}; for(const k in m){ const q=int0(m[k]); if(q) ex.push('+'+n0(q)+' '+(MATN[k]?MATN[k][q===1?0:1]:k)); }
    const mf=int0(rw.mountFrags); if(mf){ const mt=mountTarget(mf); ex.push('+'+n0(mf)+' frag. '+(mt?'de '+mt.name:'de montaria (guardados até a 1ª montaria)'));
      o.mini={frag:true,rc:mt?rcol(mt.r):'#ffd25e',label:mt?mt.name+' com '+mt.stars+' estrelas':'',pv:mt&&mt.ride?{kind:'mount',name:mt.name+' · '+mt.stars+' estrelas',st:{mount:{id:mt.id,stars:mt.stars}}}:null}; }
    if(ex.length){ o.sub=esc2(ex.join(' · ')); o.label+=', '+ex.join(', '); } }
  /* último nível premium: a skin do passe na frente; o item do nível vira o selo pequeno */
  if(trk==='premium'&&t===PD().tiers){ const sk=passSkin();
    if(sk){ o.mini={ic:o.ic,rc:o.rc,pv:o.pv,label:o.label}; const was=o.label; o.rc=rcol(sk.r); o.ic=sk.av; o.av=true; o.label='Skin '+sk.name+', mais '+was;
      o.pv=sk.art?{kind:'skin',name:sk.name+' ('+rarW(sk.r,'wing')+')',st:{skin:sk.id}}:null; o.name='Skin <em>'+esc2(sk.name)+'</em>'; o.sub='+ '+esc2(was)+(o.sub?' · '+o.sub:''); } }
  return o; }
const pending=()=>{ const o=PS().ensure(S), t=PS().tier(S); let c=0; for(let i=1;i<=t;i++){ if(!o.free.includes(i)) c++; if(o.premium&&!o.prem.includes(i)) c++; } return c; };
function misReady(L){ return L.daily.filter(m=>m.done&&!m.claimed).length+L.weekly.filter(m=>m.done&&!m.claimed).length+(L.bonus.ready&&!L.bonus.claimed?1:0); }

/* ---------- desenhos pequenos (sem emoji) ---------- */
const SV={
  lock:c=>'<svg viewBox="0 0 24 24" width="12" height="12" fill="'+(c||'#9aa6d6')+'" aria-hidden="true" style="flex:none"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"/></svg>',
  ok:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#5ef0a0" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12l5 5 9-10"/></svg>',
  chk:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ffd25e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;margin-top:2px"><path d="M5 12l5 5 9-10"/></svg>',
  eye:'<svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.5" fill="#fff"/></svg>',
  box:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffd25e" stroke-width="2.4" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/></svg>',
  frag:'<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 2l9 7-4 13H7L3 9z" fill="#ffd25e" stroke="#6a4a08" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.ps2{--night:#0b1030;--glass:rgba(24,33,86,.86);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--violet:#a97bff;--rose:#ff6b9a;--green:#5ef0a0;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;--ci:46px;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:#16110d;color:var(--text);font-family:Nunito,system-ui,sans-serif}
.ps2 *{box-sizing:border-box}
.ps2 button{color:inherit;font-family:inherit;cursor:pointer}
.ps2-in{animation:ps2-fade .22s ease-out}
.ps2-bg{position:absolute;inset:0;pointer-events:none}
.ps2-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.ps2-stage{position:relative;z-index:2;flex:none}
.ps2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;height:26px;max-width:94%;padding:0 10px;border-radius:13px;background:rgba(11,16,48,.82);border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap}
.ps2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.ps2-who span{overflow:hidden;text-overflow:ellipsis;min-width:0}
button.ps2-who{height:40px;top:0;border-color:var(--rose);background:rgba(60,16,36,.9)}
.ps2 button.ps2-who,.xs button.ps2-who{color:#ffd6e2}
button.ps2-who i{background:var(--rose);box-shadow:0 0 8px var(--rose)}
button.ps2-who u{flex:none;text-decoration:none;height:24px;line-height:24px;padding:0 10px;border-radius:12px;background:rgba(255,255,255,.18);font-size:11px}
.ps2-pvn{position:absolute;z-index:3;left:50%;bottom:2px;transform:translateX(-50%);font-size:10px;font-weight:900;color:var(--muted);background:rgba(5,8,28,.8);border-radius:8px;padding:2px 8px;white-space:nowrap;max-width:94%;overflow:hidden;text-overflow:ellipsis}
.ps2-sea{position:relative;z-index:3;display:flex;align-items:center;gap:10px;margin:0 12px;padding:7px 10px;border-radius:16px;background:rgba(16,20,58,.92);border:1px solid rgba(169,123,255,.55);flex:none;min-width:0}
.ps2-lvb{flex:none;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#ffe58a,#f4a52a);color:var(--ink);box-shadow:0 0 14px rgba(255,210,94,.5),inset 0 -3px 0 rgba(0,0,0,.2);line-height:1;text-align:center}
.ps2-lvb b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px}
.ps2-lvb small{display:block;font-size:8px;font-weight:900;letter-spacing:.5px}
.ps2-sei{flex:1;min-width:0}
.ps2-l1{display:flex;justify-content:space-between;gap:6px;font-size:11px;font-weight:900;white-space:nowrap;min-width:0}
.ps2-l1 span:first-child{letter-spacing:1px;color:var(--violet);overflow:hidden;text-overflow:ellipsis;min-width:0}
.ps2-l1 span:last-child{color:var(--muted);flex:none}
.ps2-xpb{position:relative;height:12px;margin:5px 0 3px;border-radius:6px;background:rgba(255,255,255,.08);border:1px solid var(--line);overflow:hidden}
.ps2-xpb span{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#5ee7ff,#a97bff);transition:width .4s}
.ps2-l2{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:2px 6px;font-size:10px;font-weight:900;color:var(--muted);min-width:0}
.ps2-l2 b{color:var(--text)}
.ps2-pch{display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:6px;font-size:9px;font-weight:900;letter-spacing:.4px;white-space:nowrap}
.ps2-pch.on{background:linear-gradient(90deg,#ffe58a,#f4a52a);color:var(--ink)}
.ps2-pch.off{background:rgba(255,255,255,.1);color:var(--muted)}
.ps2-tabs{position:relative;z-index:3;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;margin:7px 12px 0;flex:none}
.ps2-tab{position:relative;height:40px;border-radius:12px;border:1px solid var(--line2);background:rgba(11,16,48,.9);font-weight:900;font-size:13px;min-width:0;padding:0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ps2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);border-color:#7f93ff}
.ps2-nb{position:absolute;right:8px;top:50%;transform:translateY(-50%);min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--rose);color:#fff;font-size:10px;font-weight:900;display:grid;place-items:center}
.ps2-body{position:relative;z-index:3;flex:1;min-height:0;min-width:0;padding:6px 12px 12px}
.ps2-thead{position:sticky;top:-6px;z-index:5;display:grid;grid-template-columns:minmax(0,1fr) 36px minmax(0,1fr);gap:6px;padding:7px 0 6px;margin-bottom:4px;border-radius:0 0 10px 10px;background:rgba(11,16,48,.95);font-size:11px;font-weight:900;letter-spacing:1px;text-transform:uppercase;text-align:center}
.ps2-thead .f{color:var(--green)} .ps2-thead .p{color:var(--gold)}
.ps2-thead span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps2-row{position:relative;display:grid;grid-template-columns:minmax(0,1fr) 36px minmax(0,1fr);gap:6px;margin-bottom:6px;min-width:0}
.ps2-node{position:relative;display:flex;align-items:center;justify-content:center}
.ps2-node::before{content:'';position:absolute;left:50%;top:-6px;bottom:-6px;width:4px;margin-left:-2px;background:rgba(255,255,255,.14)}
.ps2-row.got .ps2-node::before{background:linear-gradient(180deg,#5ee7ff,#a97bff)}
.ps2-node b{position:relative;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:15px;background:#1a2366;border:2px solid var(--line2);color:var(--muted)}
.ps2-row.got .ps2-node b{background:linear-gradient(180deg,#6fd8ff,#5a4fd0);border-color:#bfe9ff;color:#fff}
.ps2-row.now .ps2-node b{background:radial-gradient(circle at 50% 35%,#ffe58a,#f4a52a);border-color:#fff3b8;color:var(--ink);box-shadow:0 0 14px rgba(255,210,94,.7)}
.ps2-cell{position:relative;min-width:0;display:grid;grid-template-columns:auto minmax(0,1fr);gap:6px;align-items:center;align-content:start;padding:6px;border-radius:13px;background:var(--glass);border:1px solid var(--line)}
.ps2-cell.pr{background:rgba(44,36,78,.9);border-color:rgba(255,210,94,.35)}
.ps2-cell.ready{border-color:var(--gold);box-shadow:0 0 0 1px rgba(255,210,94,.5),0 0 12px rgba(255,210,94,.25)}
.ps2-cell.lockp .ps2-cx,.ps2-cell.lockp .ps2-ci img{opacity:.72}
.ps2-ciw{position:relative;flex:none;width:var(--ci);height:var(--ci)}
.ps2-ci{position:relative;display:block;width:var(--ci);height:var(--ci);border-radius:11px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);padding:0;overflow:visible}
.ps2-ci img{position:absolute;left:6%;top:6%;width:88%;height:88%;object-fit:contain;border-radius:8px}
.ps2-ci.av img{left:0;top:0;width:100%;height:100%;object-fit:cover;border-radius:9px}
.ps2-ci.pvon{outline:3px solid var(--rose);outline-offset:1px}
.ps2-eye{position:absolute;left:-4px;top:-4px;width:16px;height:16px;border-radius:50%;background:var(--rose);display:grid;place-items:center}
.ps2-pl{position:absolute;right:-5px;top:-5px;width:18px;height:18px;border-radius:6px;background:#2a1f4a;border:1px solid var(--gold);display:grid;place-items:center}
.ps2-mini{position:absolute;z-index:2;right:-14px;bottom:-14px;width:40px;height:40px;border:0;background:none;padding:0;display:grid;place-items:center}
.ps2-mini>span{position:relative;display:grid;place-items:center;width:26px;height:26px;border-radius:8px;border:2px solid var(--mc);background:#0c1238;overflow:hidden}
.ps2-mini img{width:88%;height:88%;object-fit:contain}
.ps2-mini.pvon>span{outline:2px solid var(--rose)}
.ps2-cx{min-width:0;display:flex;flex-direction:column;gap:2px}
.ps2-cn{font-size:11.5px;font-weight:900;line-height:1.15;color:var(--text);overflow-wrap:anywhere}
.ps2-cn em{font-style:normal;color:var(--rc)}
.ps2-cs{font-size:9.5px;font-weight:800;color:var(--muted);line-height:1.2;overflow-wrap:anywhere}
.ps2-cs b{color:var(--gold)}
.ps2-cb{grid-column:1/-1;min-height:26px;border-radius:9px;border:0;font-weight:900;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;padding:2px 4px;min-width:0;text-align:center;line-height:1.1}
button.ps2-cb{min-height:40px;font-size:12.5px}
.ps2-cb.go{background:linear-gradient(180deg,#ffe58a,#f4a52a);box-shadow:0 2px 0 #9a5a10}
.ps2 .ps2-cb.go,.xs .ps2-cb.go{color:var(--ink)}
.ps2-cb.go:active{transform:translateY(2px);box-shadow:none}
.ps2-cb.ok{background:rgba(94,240,160,.12);color:var(--green);border:1px solid var(--green)}
.ps2-cb.hd{background:rgba(255,210,94,.1);color:var(--gold);border:1px solid rgba(255,210,94,.5)}
.ps2-cb.lk{background:rgba(255,255,255,.06);color:var(--muted);border:1px solid var(--line)}
.ps2 button.ps2-cb.lk,.xs button.ps2-cb.lk{color:var(--text)}
.ps2-cb.pm{background:linear-gradient(180deg,#c9a6ff,#7b4fe0);box-shadow:0 2px 0 #3f2394}
.ps2 .ps2-cb.pm,.xs .ps2-cb.pm{color:#1a0838}
.ps2-pan{border-radius:16px;background:var(--glass);border:1px solid var(--line);padding:10px;margin-bottom:8px;min-width:0}
.ps2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:0 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.ps2-sec span{min-width:0}
.ps2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.ps2-hint{font-size:11px;color:var(--muted);margin:6px 0 0;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.ps2-hint b{color:var(--gold)}
.ps2-ms{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid rgba(130,150,255,.14);min-width:0}
.ps2-ms.f{border-top:0}
.ps2-ms.bo{background:rgba(255,210,94,.07);border-radius:10px;padding:7px 6px;margin-top:4px;border-top:0}
.ps2-mt{flex:1;min-width:0}
.ps2-mt .t{font-size:12px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.ps2-mbar{display:flex;align-items:center;gap:6px;margin-top:4px}
.ps2-mbar i{flex:1;min-width:0;height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;position:relative}
.ps2-mbar i span{position:absolute;left:0;top:0;bottom:0;background:var(--cyan);border-radius:4px}
.ps2-mbar i span.full{background:var(--green)}
.ps2-mbar small{flex:none;font-size:10px;font-weight:900;color:var(--muted)}
.ps2-mr{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;align-items:center}
.ps2-mr>span{display:inline-flex;align-items:center;gap:3px;min-height:18px;padding:0 6px;border-radius:6px;background:rgba(5,8,28,.55);font-size:10px;font-weight:900;color:var(--cyan)}
.ps2-mr>span.g{color:var(--text)}
.ps2-mr img{width:13px;height:13px;object-fit:contain}
.ps2-mr button,.ps2-mr>span.pt{display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 8px;border-radius:9px;border:1px solid rgba(255,107,154,.6);background:rgba(255,107,154,.12);font-size:10px;font-weight:900;text-align:left;line-height:1.15}
.ps2 .ps2-mr button,.xs .ps2-mr button,.ps2-mr>span.pt{color:#ffd6e2}
.ps2-mr button img,.ps2-mr>span.pt img{width:22px;height:22px}
.ps2-mr button.pvon{outline:2px solid var(--rose)}
.ps2-ms .ps2-cb{flex:none;width:78px;min-height:40px}
.ps2-foot{position:relative;z-index:4;flex:none;display:flex;gap:8px;padding:8px 12px 12px;background:rgba(11,16,48,.92);min-width:0}
.ps2-fb{flex:1 1 0;min-width:0;min-height:48px;border-radius:13px;border:0;font-weight:900;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;padding:2px 6px;text-align:center}
.ps2-fb b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:15px;letter-spacing:.3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps2-fb small{font-size:10px;font-weight:900;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ps2-fb.buy{flex:1.2 1 0;background:linear-gradient(180deg,#ffe58a,#f4a52a);box-shadow:0 3px 0 #9a5a10}
.ps2 .ps2-fb.buy,.xs .ps2-fb.buy{color:var(--ink)}
.ps2-fb.all{background:linear-gradient(180deg,#7dffb8,#22c47a);box-shadow:0 3px 0 #0d6b40}
.ps2 .ps2-fb.all,.xs .ps2-fb.all{color:#05301b}
.ps2-fb.all[aria-disabled="true"]{background:rgba(255,255,255,.06);box-shadow:none;border:1px solid var(--line)}
.ps2 .ps2-fb.all[aria-disabled="true"],.xs .ps2-fb.all[aria-disabled="true"]{color:var(--muted)}
.ps2-fb.on{flex:1.2 1 0;background:rgba(255,210,94,.1);border:2px solid var(--gold);color:var(--gold)}
.ps2-fb.soon{flex:1.2 1 0;background:rgba(255,255,255,.06);border:1px solid var(--line2);color:var(--muted)}
.ps2-fb.soon b{color:var(--text)}
.ps2-shade{position:absolute;inset:0;z-index:20;background:rgba(3,5,18,.74);display:flex;align-items:flex-end;animation:ps2-fade .2s}
.ps2-sheet{width:100%;max-height:86%;border-radius:24px 24px 0 0;background:#182056;border:1px solid var(--line2);border-bottom:0;padding:14px 16px 16px;min-width:0}
.ps2-sheet h3{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:21px;margin:0 0 2px;overflow-wrap:anywhere}
.ps2-sheet p{margin:0 0 6px;font-size:12.5px;color:var(--muted);line-height:1.45;overflow-wrap:anywhere}
.ps2-sheet p b{color:var(--text)}
.ps2-price{font-family:'Lilita One',Nunito,sans-serif;font-size:28px;color:var(--gold);margin:2px 0 6px}
.ps2-gl{list-style:none;margin:0 0 10px;padding:0}
.ps2-gl li{display:flex;gap:7px;align-items:flex-start;font-size:12px;font-weight:800;line-height:1.35;padding:4px 0;border-top:1px solid rgba(130,150,255,.14);overflow-wrap:anywhere}
.ps2-gl li:first-child{border-top:0}
.ps2-gl li span{min-width:0}
.ps2-gl li b{color:var(--gold)}
.ps2-warn{margin:0 0 10px;padding:8px 10px;border-radius:11px;background:rgba(255,107,154,.1);border:1px solid rgba(255,107,154,.45);font-size:11.5px;font-weight:800;color:#ffd6e2;line-height:1.4;overflow-wrap:anywhere}
.ps2-macts{display:flex;gap:8px}
.ps2-macts button{flex:1 1 0;min-width:0;min-height:48px;border-radius:13px;border:0;font-weight:900;font-size:14px;padding:2px 6px}
.ps2-macts .c{flex:.7 1 0;background:rgba(255,255,255,.08);border:1px solid var(--line2)}
.ps2-macts .y{background:linear-gradient(180deg,#ffe58a,#f4a52a);box-shadow:0 3px 0 #9a5a10}
.ps2 .ps2-macts .y,.xs .ps2-macts .y{color:var(--ink)}
.ps2-toast{position:absolute;left:50%;top:44px;z-index:40;transform:translateX(-50%);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;animation:ps2-tin 2.4s ease both;max-width:calc(100% - 24px);overflow-wrap:anywhere;pointer-events:none}
.ps2-lvup{position:absolute;left:0;right:0;z-index:31;text-align:center;pointer-events:none;font-family:'Lilita One',Nunito,sans-serif;font-size:32px;letter-spacing:1.5px;color:var(--gold);text-shadow:0 0 22px rgba(255,210,94,.9),0 3px 0 rgba(0,0,0,.55);animation:ps2-lv 1.5s ease-out both}
.ps2-gate{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 28px;text-align:center}
.ps2-msg{color:var(--muted);font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
@keyframes ps2-fade{from{opacity:0}}
@keyframes ps2-tin{0%{opacity:0;transform:translate(-50%,-8px)}10%{opacity:1;transform:translate(-50%,0)}82%{opacity:1}100%{opacity:0}}
@keyframes ps2-lv{0%{opacity:0;transform:scale(.4)}18%{opacity:1;transform:scale(1.15)}30%{transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-24px)}}
@media (prefers-reduced-motion:reduce){.ps2-in,.ps2-shade{animation:none}.ps2-toast,.ps2-lvup{animation-timing-function:step-end}}
`; document.head.appendChild(st); })();

/* ---------- avisos (dentro da tela; nada de diálogo do navegador) ---------- */
const TOAST_MS=2400;
const toastHtml=(m,age)=>'<div class="ps2-toast" role="status" style="animation-delay:'+(-Math.max(0,age|0))+'ms">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('ps2_toast'); if(el) el.innerHTML=toastHtml(X.toast,0); }catch(e){} }

/* ================= PALCO (canvas): chão e o herói do jogo, com a peça da prévia ================= */
function pvState(t){ const st={t:t,mount:false}, pv=X.pv; if(pv&&pv.st) Object.assign(st,pv.st); return st; }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||226;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0);
  base(); x.clearRect(0,0,w,h);
  const ride=!!(X.pv&&X.pv.kind==='mount'), hk=Math.min(.8,(h-30)/256)*(ride?0.78:1), HX=w*(ride?0.46:0.5), GY=h-14;
  try{ const g=x.createRadialGradient(HX,GY,10,HX,GY,130); g.addColorStop(0,'rgba(94,231,255,.32)'); g.addColorStop(1,'rgba(94,231,255,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(HX,GY,130,19,0,0,7); x.fill();
    x.strokeStyle=X.pv?'rgba(255,107,154,.65)':'rgba(255,210,94,.5)'; x.setLineDash([5,6]); x.lineDashOffset=-t*10; x.lineWidth=1.5; x.beginPath(); x.ellipse(HX,GY,106,15,0,0,7); x.stroke(); x.setLineDash([]); }catch(e){}
  base();
  /* devolve false enquanto a folha pedida (skin, montaria, asa) carrega: o próximo quadro chama de novo */
  try{ if(typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0) window.drawHeroFull(x,HX,GY,hk*256/HS,pvState(t)); }catch(e){ try{ x.restore(); }catch(e2){} }
  base(); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('ps2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('ps2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="ps2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.45,0.92):'#16110d')+'"></div>';
function gateHtml(soon){ return '<div class="ps2">'+bgHtml()+'<div class="ps2-gate" role="dialog" aria-label="Passe indisponível"><span class="ps2-lil" style="font-size:26px">Passe</span>'
  +'<span style="padding:6px 14px;border-radius:999px;border:2px solid var(--gold);color:var(--gold);font-size:15px;font-weight:900">'+(soon?'Em breve':'Libera no nível '+n0(gateLv()))+'</span>'
  +(soon?'':'<span class="ps2-msg">Você está no nível '+n0(pLevel())+'. Continue lutando para liberar.</span>')
  +'<button class="ps2-cb go" data-x="back" style="min-height:48px;padding:0 26px;font-size:15px">Voltar</button></div></div>'; }

const NOTES={skin:'Mesmo corpo do herói · arma equipada na mão',mount:'Montado · aura da estrela depois do prêmio',pet:'O pet fica na frente do herói',weapon:'Na mão do herói · ainda não equipada'};
function stageHtml(SH){ const pv=X.pv, w=eqWeapon();
  const who=pv?'<button class="ps2-who" data-x="pvout" aria-label="Sair da prévia: '+esc2(pv.name)+'"><i></i><span>Prévia: '+esc2(pv.name)+'</span><u>Sair</u></button>'
    :'<div class="ps2-who"><i></i><span>'+esc2(heroName())+' · Nível '+n0(pLevel())+(w?' · '+esc2(w)+' na mão':'')+'</span></div>';
  const note=pv?(pv.kind==='wing'?'Asa nas costas · equipa a partir do nível '+n0(wingRule().lv):NOTES[pv.kind]||''):'';
  return '<div class="ps2-stage" style="height:'+SH+'px"><canvas id="ps2_stc" role="img" aria-label="Seu herói com a arma equipada na mão e o pet na frente" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas>'
    +who+(note?'<div class="ps2-pvn">'+esc2(note)+'</div>':'')+'</div>'; }

function seaHtml(pr,sea){ const T=PD().tiers, days=Math.max(0,Math.ceil((sea.end-hostNow())/86400000)), pct=xpPct();
  return '<div class="ps2-sea"><div class="ps2-lvb" role="img" aria-label="Nível do passe '+pr.tier+' de '+T+'"><span><b>'+pr.tier+'</b><small>DE '+T+'</small></span></div>'
    +'<div class="ps2-sei"><div class="ps2-l1"><span>TEMPORADA '+n0(sea.n)+'</span><span>'+(days===1?'Falta 1 dia':'Faltam '+n0(days)+' dias')+'</span></div>'
    +'<div class="ps2-xpb" role="progressbar" aria-label="XP do passe" aria-valuemin="0" aria-valuemax="'+pr.per+'" aria-valuenow="'+pr.inTier+'"><span style="width:'+(pr.max?100:Math.round(pr.inTier/pr.per*100))+'%"></span></div>'
    +'<div class="ps2-l2"><span>'+(pr.max?'<b>Nível máximo</b>':'<b>'+n0(pr.inTier)+'/'+n0(pr.per)+' XP</b> para o nível '+(pr.tier+1))+'</span>'
    +'<span class="ps2-pch '+(pr.premium?'on':'off')+'">'+(pr.premium?'PREMIUM':'GRÁTIS')+(pct?' +'+esc2(String(pct).replace('.',','))+'% XP':'')+'</span></div></div></div>'; }

function tabsHtml(nT,nM){ const b=(k,lab,n)=>'<button class="ps2-tab" role="tab" data-x="tab" data-t="'+k+'" aria-selected="'+(X.tab===k)+'"'+(n?' aria-label="'+lab+', '+n+(n===1?' pronto':' prontos')+' para resgatar"':'')+'>'+lab+(n?'<span class="ps2-nb">'+n+'</span>':'')+'</button>';
  return '<div class="ps2-tabs" role="tablist">'+b('track','Recompensas',nT)+b('mis','Missões',nM)+'</div>'; }

/* ----- trilha vertical: uma linha por nível, grátis à esquerda e premium à direita ----- */
const pvSame=pv=>!!(X.pv&&pv&&X.pv.kind===pv.kind&&X.pv.name===pv.name);
function cellState(o,trk,t,cur){ if((trk==='free'?o.free:o.prem).includes(t)) return 'done'; if(trk==='premium'&&!o.premium) return 'lockp'; if(t>cur) return 'lock'; return 'ready'; }
function isHeld(trk,t){ try{ const rw=PS().reward(trk,t), sp=rw&&rw.item; if(!sp||sp.season||canRecv(sp)) return 0; return PS().held(S).some(h=>h.slot===sp.slot&&h.r===sp.r)?needLv(sp):0; }catch(e){ return 0; } }
function cellHtml(o,trk,t,cur,prod){ const inf=rwInfo(trk,t), st=cellState(o,trk,t,cur), pr=trk==='premium', lab=(pr?'Premium':'Grátis')+', nível '+t+': '+inf.label;
  const main=inf.pv?'<button class="ps2-ci'+(inf.av?' av':'')+(pvSame(inf.pv)?' pvon':'')+'" data-x="pv" data-t="'+trk+'" data-lv="'+t+'" data-m="main" aria-pressed="'+pvSame(inf.pv)+'" aria-label="Ver no herói: '+esc2(inf.pv.name)+'">'
      +'<img src="'+esc2(inf.ic)+'" alt=""><span class="ps2-eye">'+SV.eye+'</span>'+(st==='lockp'?'<span class="ps2-pl">'+SV.lock('#ffd25e')+'</span>':'')+'</button>'
    :'<span class="ps2-ci'+(inf.av?' av':'')+'">'+(inf.ic?'<img src="'+esc2(inf.ic)+'" alt="">':'')+(st==='lockp'?'<span class="ps2-pl">'+SV.lock('#ffd25e')+'</span>':'')+'</span>';
  let mini=''; if(inf.mini){ const m=inf.mini, art=m.frag?SV.frag:(m.ic?'<img src="'+esc2(m.ic)+'" alt="">':'');
    mini=m.pv?'<button class="ps2-mini'+(pvSame(m.pv)?' pvon':'')+'" style="--mc:'+m.rc+'" data-x="pv" data-t="'+trk+'" data-lv="'+t+'" data-m="mini" aria-pressed="'+pvSame(m.pv)+'" aria-label="Ver no herói: '+esc2(m.pv.name)+'"><span>'+art+'</span></button>'
      :'<span class="ps2-mini" style="--mc:'+m.rc+'" aria-hidden="true"><span>'+art+'</span></span>'; }
  const held=st==='done'?isHeld(trk,t):0;
  const b=st==='done'?(held?'<span class="ps2-cb hd">'+SV.box+'Guardada · Nv. '+n0(held)+'</span>':'<span class="ps2-cb ok">'+SV.ok+'Resgatado</span>')
    :st==='ready'?'<button class="ps2-cb go" data-x="claim" data-t="'+trk+'" data-lv="'+t+'" aria-label="Resgatar: '+esc2(lab)+'">Resgatar</button>'
    :st==='lockp'?(prod?'<button class="ps2-cb pm" data-x="prem" aria-label="Ver o Passe Premium">'+SV.lock('#1a0838')+'Premium</button>':'<span class="ps2-cb lk">'+SV.lock()+'Premium</span>')
    :'<span class="ps2-cb lk">'+SV.lock()+'Nível '+t+'</span>';
  return '<div class="ps2-cell'+(pr?' pr':'')+' '+st+'" style="--rc:'+inf.rc+'" role="group" aria-label="'+esc2(lab)+'"><div class="ps2-ciw">'+main+mini+'</div>'
    +'<div class="ps2-cx"><div class="ps2-cn">'+inf.name+'</div>'+(inf.sub?'<div class="ps2-cs">'+inf.sub+'</div>':'')+'</div>'+b+'</div>'; }
function trackHtml(o,cur,prod){ const T=PD().tiers; let h='<div class="ps2-thead"><span class="f">Grátis</span><span></span><span class="p">'+(o.premium||prod?'Premium':'Premium · em breve')+'</span></div>';
  for(let i=1;i<=T;i++) h+='<div class="ps2-row'+(i<=cur?' got':'')+(i===cur?' now':'')+'" id="ps2_r'+i+'">'+cellHtml(o,'free',i,cur,prod)+'<div class="ps2-node"><b>'+i+'</b></div>'+cellHtml(o,'premium',i,cur,prod)+'</div>';
  return h+'<p class="ps2-hint" style="text-align:center">Fim da temporada · '+T+' níveis · itens da sua era</p>'; }

/* ----- missões (Sys.pass.list: o módulo decide quais aparecem) ----- */
const MIS_GO={summon:'summon',upgrade:'gear'};
const misKind=id=>{ try{ const m=PD().daily.concat(PD().weekly).find(x=>x.id===id); return m?m.k:''; }catch(e){ return ''; } };
const gemTag=n=>n?'<span class="g"><img src="'+IMG_GEM+'" alt="">+'+n0(n)+'</span>':'';
function misRow(m,first){ const pct=Math.round(Math.min(1,m.p/Math.max(1,m.need))*100);
  const b=m.claimed?'<span class="ps2-cb ok">'+SV.ok+'Feito</span>':m.done?'<button class="ps2-cb go" data-x="mclaim" data-id="'+esc2(m.id)+'" aria-label="'+esc2(m.txt)+', resgatar">Resgatar</button>'
    :'<button class="ps2-cb lk" data-x="mgo" data-id="'+esc2(m.id)+'" aria-label="'+esc2(m.txt)+', '+n0(m.p)+' de '+n0(m.need)+', ir jogar">Ir</button>';
  return '<div class="ps2-ms'+(first?' f':'')+'"><div class="ps2-mt"><div class="t">'+esc2(m.txt)+'</div><div class="ps2-mbar"><i><span class="'+(m.done?'full':'')+'" style="width:'+pct+'%"></span></i><small>'+n0(m.p)+'/'+n0(m.need)+'</small></div>'
    +'<div class="ps2-mr"><span>+'+n0(xpGain(m.pxp))+' XP do passe</span>'+gemTag(m.gems)+'</div></div>'+b+'</div>'; }
const petPv=dp=>dp&&dp.live?{kind:'pet',name:dp.name+' (pet)',st:{pet:{base:dp.base,stage:1,fly:dp.fly}}}:null;
function misHtml(L){ const bo=L.bonus, dp=dailyPet(), pp=petPv(dp), nd=L.daily.length, cd=L.daily.filter(m=>m.claimed).length;
  const bb=bo.claimed?'<span class="ps2-cb ok">'+SV.ok+'Feito</span>':bo.ready?'<button class="ps2-cb go" data-x="mclaim" data-id="bonus" aria-label="'+esc2(bo.txt)+', resgatar">Resgatar</button>':'<span class="ps2-cb lk">'+cd+'/'+nd+'</span>';
  let pet=''; if(dp){ const tx='+'+n0(dp.n)+' frag. '+esc2(dp.name)+(!dp.owned&&dp.hatch?' ('+n0(dp.have)+'/'+n0(dp.hatch)+')':''), im=dp.live?'<img src="'+esc2(dp.img)+'" alt="">':'';
    pet=pp?'<button class="'+(pvSame(pp)?'pvon':'')+'" data-x="pv" data-t="pet" aria-pressed="'+pvSame(pp)+'" aria-label="Ver no herói: '+esc2(dp.name)+'">'+im+'<span>'+tx+'</span></button>':'<span class="pt">'+im+'<span>'+tx+'</span></span>'; }
  const sum=a=>a.reduce((s,m)=>s+int0(m.pxp),0), dB=sum(L.daily)+int0(bo.pxp), wB=sum(L.weekly), k=1+xpPct()/100, more=v=>k>1?' ('+n0(Math.round(v*k))+' com os seus bônus de XP)':'';
  return '<div class="ps2-pan"><div class="ps2-sec"><span>Diárias</span><span>renovam à meia-noite</span></div>'+L.daily.map((m,i)=>misRow(m,i===0)).join('')
    +'<div class="ps2-ms bo"><div class="ps2-mt"><div class="t">'+esc2(bo.txt||'Complete as diárias')+'</div><div class="ps2-mr"><span>+'+n0(xpGain(bo.pxp))+' XP do passe</span>'+gemTag(bo.gems)+pet+'</div></div>'+bb+'</div>'
    +'<p class="ps2-hint">Todas as diárias com o bônus = <b>'+n0(dB)+' XP</b> por dia'+more(dB)+'.</p></div>'
    +'<div class="ps2-pan"><div class="ps2-sec"><span>Semanais</span><span>renovam na segunda</span></div>'+(L.weekly.length?L.weekly.map((m,i)=>misRow(m,i===0)).join(''):'<p class="ps2-hint">Nenhuma missão semanal agora.</p>')
    +'<p class="ps2-hint">Semanais = <b>'+n0(wB)+' XP</b> por semana'+more(wB)+'. O XP do passe sobe o nível do passe ('+n0(PD().xpPerTier)+' XP por nível); não muda o nível do jogador.</p></div>'; }

function footHtml(o,sea,prod,c){ const pc=+PD().premiumXpPct||0;
  const left=o.premium?'<div class="ps2-fb on"><b>Premium ativo</b><small>Temporada '+n0(sea.n)+(pc?' · +'+pc+'% XP':'')+'</small></div>'
    :prod?'<button class="ps2-fb buy" data-x="prem" aria-label="Ver o Passe Premium, '+esc2(prod.price)+'"><b>Passe Premium</b><small>'+esc2(prod.price)+' · compra direta</small></button>'
    :'<div class="ps2-fb soon" role="note"><b>Passe Premium</b><small>Em breve</small></div>';
  return '<div class="ps2-foot">'+left+'<button class="ps2-fb all" data-x="all" aria-disabled="'+(!c)+'"><b>Resgatar tudo</b><small>'+(c?c+(c===1?' prêmio pronto':' prêmios prontos'):'nada pronto agora')+'</small></button></div>'; }

/* ----- folha do Premium: SÓ com a compra real ligada e o produto no catálogo do Sys.buy. Lista o que a trilha tem (contado no Sys.pass.DATA) ----- */
function sheetHtml(o,sea,prod,cur){ if(!X.sheet||!prod||o.premium) return ''; const D=PD(), L=D.premium||[], gems=L.reduce((s,r)=>s+int0(r&&r.gems),0), items=L.filter(r=>r&&r.item).length, sk=passSkin();
  const days=Math.max(0,Math.ceil((sea.end-hostNow())/86400000)); let sim=false; try{ sim=typeof xBuySim==='function'&&xBuySim(); }catch(e){}
  const li=t=>'<li>'+SV.chk+'<span>'+t+'</span></li>';
  return '<div class="ps2-shade"><div class="ps2-sheet x-scroll" role="dialog" aria-modal="true" aria-label="Passe Premium">'
    +'<h3>'+esc2(prod.name)+' · Temporada '+n0(sea.n)+'</h3><div class="ps2-price">'+esc2(prod.price)+'</div>'
    +'<p>Compra direta de uma trilha conhecida: <b>você vê na tela tudo o que vem</b>. Nada depende de sorte. Vale só nesta temporada ('+(days===1?'falta 1 dia':'faltam '+n0(days)+' dias')+').</p>'
    +'<ul class="ps2-gl">'+li('Trilha Premium inteira: <b>'+L.length+' prêmios</b>'+(cur?'; os níveis que você já alcançou ('+cur+') ficam prontos para resgatar':''))
      +(D.premiumXpPct?li('<b>+'+(+D.premiumXpPct)+'% de XP do passe</b> nas missões'):'')+li(items+' equipamentos, incluindo os itens da temporada que evoluem')+li('<b>'+n0(gems)+' diamantes</b> ao longo da trilha')
      +(sk?li('Nível '+D.tiers+': skin <b>'+esc2(sk.name)+'</b>, mesmo corpo do herói'):'')+'</ul>'
    +'<div class="ps2-warn">'+(sim?'Modo dono: compra simulada, nada é cobrado.':'O pagamento é feito pela loja do aparelho. Peça a um responsável antes de comprar.')+'</div>'
    +'<div class="ps2-macts"><button class="c" data-x="sclose">Agora não</button><button class="y" data-x="buy" aria-label="Comprar '+esc2(prod.name)+': '+esc2(prod.price)+'">Comprar · '+esc2(prod.price)+'</button></div></div></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{};
  if(!ready()){ V.innerHTML=xWrap(d,'',gateHtml(true)); X.sig='soon'; return; }
  if(locked()){ V.innerHTML=xWrap(d,'',gateHtml(false)); X.sig='gate'; return; }
  const P=PS(), o=P.refresh(S,Sys.host), sea=P.season(S,Sys.host), pr=P.progress(S), cur=pr.tier, L=P.list(S,Sys.host), prod=o.premium?null:premProd(), c=pending();
  if(X.tab!=='mis') X.tab='track'; if(!prod||o.premium) X.sheet=false;
  let y0=0; try{ const sc0=X.top?null:document.getElementById('ps2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const Hh=+d.H||0, SH=Hh&&Hh<600?170:226, narrow=(+d.Wb||390)<350;
  const lv=X.lvup&&now()-X.lvup.t<1500?'<div class="ps2-lvup" role="status" style="top:'+(SH+24)+'px;animation-delay:'+(X.lvup.t-now())+'ms">PASSE NÍVEL '+n0(X.lvup.tier)+'!</div>':'';
  const tAge=now()-X.toastT;
  V.innerHTML=xWrap(d,'','<div class="ps2'+(X.anim?' ps2-in':'')+'"'+(narrow?' style="--ci:40px"':'')+'>'+bgHtml()
    +stageHtml(SH)+seaHtml(pr,sea)+tabsHtml(c,misReady(L))
    +'<div id="ps2_scroll" class="ps2-body x-scroll">'+(X.tab==='mis'?misHtml(L):trackHtml(o,cur,prod))+'</div>'
    +footHtml(o,sea,prod,c)+lv+'<div id="ps2_toast">'+(X.toast&&tAge<TOAST_MS?toastHtml(X.toast,tAge):'')+'</div>'+sheetHtml(o,sea,prod,cur)+'</div>');
  try{ const sc=document.getElementById('ps2_scroll'); if(sc){ if(X.top){ const r=X.tab==='track'?document.getElementById('ps2_r'+Math.max(1,cur)):null; sc.scrollTop=r?Math.max(0,(+r.offsetTop||0)-90):0; } else if(y0) sc.scrollTop=y0; } }catch(e){}
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (XP e missões andando na batalha, virada do dia ou da temporada, compra entregue): o tick redesenha só quando muda */
function sig(){ if(!ready()) return 'soon'; if(locked()) return 'gate'; try{ const o=PS().ensure(S), s=o.season||{}; let m='';
    if(X.tab==='mis'){ const L=PS().list(S,Sys.host); m=L.daily.concat(L.weekly).map(q=>q.p+(q.claimed?'c':'')).join(',')+(L.bonus.claimed?'b':''); }
    return [X.tab,o.xp,o.premium?1:0,o.free.length,o.prem.length,o.held.length,s.n,o.d&&o.d.day,o.w&&o.w.week,pLevel(),eraNow(),premProd()?1:0,m].join('|'); }catch(e){ return ''; } }

/* ================= ações ================= */
const WHY={trilha:'Trilha inválida',nivel:'Este nível não existe no passe',bloqueado:'Ainda não liberou: suba o nível do passe',premium:'Exige o Passe Premium',resgatado:'Recompensa já resgatada',sem_premio:'Este nível não tem prêmio nesta trilha',erro:'Não foi possível resgatar agora. Tente de novo'};
/* o que entrou, em texto, a partir do que o módulo devolveu */
function gotTxt(r){ const out=[]; if(!r) return out;
  if(r.gold) out.push('+'+kfT(r.gold)+' de ouro'); if(r.gems) out.push('+'+n0(r.gems)+' diamantes');
  if(r.item){ let nm=''; try{ nm=String(iname(r.item)||''); }catch(e){} out.push((nm||sln(r.item.slot))+(r.item.season?' (item da temporada)':'')+' na mochila'); }
  if(r.held) out.push(sln(r.held.slot)+' guardada até o nível '+n0(r.held.needLevel||needLv(r.held)));
  if(r.mat) for(const k in r.mat){ const q=int0(r.mat[k]); if(q) out.push('+'+n0(q)+' '+(MATN[k]?MATN[k][q===1?0:1]:k)); }
  if(r.mountFrags){ const mf=r.mountFrags, q=int0(typeof mf==='object'?mf.n:mf); if(q) out.push('+'+n0(q)+' frag. de montaria'+(mf&&mf.stored?' (guardados até a 1ª montaria)':mf&&mf.up?' (estrela nova)':'')); }
  if(r.fixedSkin){ let nm=''; try{ const k=(Sys.appearance.FIXED||[]).find(z=>z&&z.id===r.fixedSkin); nm=k?k.name:''; }catch(e){} out.push((nm||'Skin do passe')+' é sua'); }
  return out; }
function claimOne(trk,t){ let r=null; try{ r=PS().claimTier(S,Sys.host,trk,t); }catch(e){ r={ok:false,reason:'erro'}; }
  if(!r||!r.ok){ sfx('ui_tap'); say(WHY[r&&r.reason]||WHY.erro); redraw(); return; }
  call(typeof statsChanged==='function'?statsChanged:null); sfx('claim'); const tx=gotTxt(r.rewards);
  say('Nível '+t+': '+(tx.length?tx.join(' · '):'recompensa resgatada')); redraw(); }
function claimEvery(){ if(!pending()){ sfx('ui_tap'); say('Nada pronto para resgatar agora'); return; }
  let r=null; try{ r=PS().claimAll(S,Sys.host); }catch(e){ r=null; }
  if(!r||!r.n){ sfx('ui_tap'); say(r?'Nada pronto para resgatar agora':WHY.erro); redraw(); return; }
  let gold=0, gems=0, items=0, held=0; for(const q of r.list){ gold+=+q.gold||0; gems+=+q.gems||0; if(q.item) items++; if(q.held) held++; }
  call(typeof statsChanged==='function'?statsChanged:null); sfx('claim');
  say(r.n+(r.n===1?' prêmio':' prêmios')+(gold?' · +'+kfT(gold)+' de ouro':'')+(gems?' · +'+n0(gems)+' diamantes':'')+(items?' · '+items+(items===1?' item':' itens')+' na mochila':'')+(held?' · '+held+(held===1?' guardado':' guardados'):'')); redraw(); }
/* missão: o XP do passe e os diamantes são do Sys.pass.claimMission; a diária também dá XP do JOGADOR (Sys.level), como no Passe de hoje */
function claimMis(id){ let r=null; try{ r=PS().claimMission(S,Sys.host,id); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='resgatado'?'Missão já resgatada':r&&r.reason==='incompleto'?'Missão ainda não concluída':'Não foi possível resgatar agora'); redraw(); return; }
  sfx('claim'); if(r.tierUp){ X.lvup={t:now(),tier:r.tier}; setTimeout(()=>sfx('upgrade'),250); }
  try{ const daily=id==='bonus'||PD().daily.some(x=>x.id===id); if(daily&&Sys.level){ const lr=id==='bonus'?Sys.level.onDailyBonus(S,Sys.host):Sys.level.onMission(S,Sys.host); if(lr&&lr.levels>0&&typeof onLevelUp==='function') onLevelUp(lr); } }catch(e){}
  call(typeof save==='function'?save:null); call(typeof hud==='function'?hud:null);
  const nd=r.newDrops&&Array.isArray(r.newDrops.got)&&r.newDrops.got.length, dp=nd?dailyPet():null;
  say('+'+n0(r.xp)+' XP do passe'+(r.gems?' · +'+n0(r.gems)+' diamantes':'')+(dp?' · +'+n0(dp.n)+' frag. '+dp.name:'')); redraw(); }
function preview(ds){ let pv=null; try{ if(ds.t==='pet') pv=petPv(dailyPet()); else { const t=+ds.lv, trk=ds.t==='premium'?'premium':'free'; if(Number.isInteger(t)&&t>=1&&t<=PD().tiers){ const inf=rwInfo(trk,t); pv=ds.m==='mini'?(inf.mini&&inf.mini.pv):inf.pv; } } }catch(e){ pv=null; }
  sfx('ui_tap'); if(!pv) return; if(pvSame(pv)){ X.pv=null; X.toast=''; redraw(); return; } X.pv=pv; say('Prévia: '+pv.name); redraw(); }
function buyNow(){ const pp=premProd(); if(!pp||typeof xBuy!=='function'){ X.sheet=false; sfx('ui_tap'); say('Passe Premium: em breve'); redraw(); return; }
  sfx('ui_tap'); xBuy(pp.id,(r,p)=>{ if(r&&r.ok){ X.sheet=false; sfx('claim'); call(typeof passSync==='function'?passSync:null); }
    say(r&&r.ok?'Passe Premium ativado':(typeof xBuyMsg==='function'?String(xBuyMsg(r,p)||''):'')||'Não foi possível concluir agora'); redraw(); }); }

function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{};
  if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; }
  if(!ready()||locked()) return;
  if(a==='sclose'){ sfx('ui_tap'); X.sheet=false; redraw(); return; }
  if(a==='buy'){ if(X.sheet) buyNow(); return; }
  if(X.sheet) return;                                    /* folha aberta: só Agora não ou Comprar */
  if(a==='tab'){ const t=ds.t==='mis'?'mis':'track'; sfx('ui_tap'); if(t===X.tab) return; X.tab=t; X.top=true; redraw(); }
  else if(a==='claim'){ const t=+ds.lv; claimOne(ds.t==='premium'?'premium':'free',Number.isInteger(t)?t:0); }
  else if(a==='all') claimEvery();
  else if(a==='pv') preview(ds);
  else if(a==='pvout'){ sfx('ui_tap'); X.pv=null; X.toast=''; redraw(); }
  else if(a==='mclaim') claimMis(String(ds.id||''));
  else if(a==='mgo'){ sfx('ui_tap'); const to=MIS_GO[misKind(String(ds.id||''))]||'battle'; try{ if(typeof setView==='function') setView(to); }catch(e){} }
  else if(a==='prem'){ sfx('ui_tap'); if(PS().ensure(S).premium) return; if(!premProd()){ say('Passe Premium: em breve'); return; } X.sheet=true; redraw(); }
}

const def=Panels.add('pass2',{title:'Passe',render:draw,click:click,actions:ACTIONS,
  tick(){ if(X.sheet) return; if(X.sig&&isOn()&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  onOpen(o){ X.anim=true; X.top=true; X.pv=null; X.sheet=false; X.toast=''; X.lvup=null; X.t0=0; X.tab=o&&(o.tab==='mis'||o.tab==='missions')?'mis':'track'; },
  onClose(){ X.pv=null; X.sheet=false; X.toast=''; X.lvup=null; loopStop(); } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Pass2={X:X,actions:ACTIONS,def:def,reduced:reduced};
})();
