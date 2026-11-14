'use strict';
/* ================= LOJA V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.shop2) =================
   Protótipo: docs/proto/v2/Loja.html · passagem: docs/proto/v2/PASSAGEM.md (seções 0 e 7). Não substitui a Loja do js/screens.js: é outra tela ('shop2').
   NENHUM produto, preço nem benefício escrito aqui. Tudo vem dos módulos:
   - produtos de dinheiro (diamantes, Cartão Mensal, Passe Premium, Oferta, Mecha, skins): Sys.buy.DATA.products, preço por Sys.buy.priceText;
     a compra é Sys.buy.purchase e a entrega é do próprio Sys.buy. Com Sys.buy.ready() FALSO (o jogador de hoje) a tela NÃO mostra preço em
     reais nem botão de compra: só "Em breve";
   - VIP (nível, pontos, vantagens por nível, conveniências): Sys.vip · prêmios de nível: Sys.newDrops.DATA.sources['vip:level'];
   - Oferta de 1ª compra: Sys.offer (DATA e status) · skins: Sys.appearance (fixedSkins, skinProducts, equipFixed; fontes por DATA.skinsOn);
   - montaria à venda: Sys.newDrops.shop() + Sys.mount · asas (não se vendem): Sys.stats.wingCatalog · Passe: Sys.pass;
   - estoque do dia em OURO: S.shop.offers (6 itens, montado por ensureShop() do index.html); a compra segue a receita da Loja de hoje
     (tira o ouro, marca vendido, addItemToBag).
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói com a arma NA MÃO, a asa e o PET POR ÚLTIMO (na frente). Tocar numa skin, montaria ou asa
   mostra a PRÉVIA no herói ("Prévia: X · Sair"), sem janela por cima. Jogo com menores: nada de sorteio pago, nada de contagem regressiva de oferta.
   O arquivo roda em escopo próprio. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('shop2' in PANEL_ON)) PANEL_ON.shop2=false;

const X={tab:'ofertas',pv:null,sel:null,vl:null,sheet:null,busy:false,toast:'',toastT:0,sig:'',anim:true,top:true,raf:0,t0:0,look:null,
  card:{st:null,at:0,load:false,claim:false}};
const ACTIONS=['tab','pv','pvout','equip','buy','buyok','gold','goldok','sclose','claim','cardretry','vl','go','back'];
const TABS=[['ofertas','Ofertas'],['gemas','Diamantes'],['visual','Visual'],['montarias','Montarias'],['vip','VIP'],['passe','Passe'],['ouro','Ouro']];
const SOON='Em breve', SOON_MSG='Pagamento em breve: nada é cobrado agora';
const UI_COIN='assets/ui/coin.png', UI_GEM='assets/ui/gem.png', UI_PASS='assets/ui/pass.png';
/* ícone da montaria: assets/icons/mounts/<arquivo>.png. O Mecha usa o arquivo do cartão de hoje (js/p_shopmecha.js: war_mecha) */
const MOUNT_ICO={mecha:'war_mecha'};

/* ---------- leituras dos módulos (cada uma protegida: módulo faltando = a parte some, a tela não quebra) ---------- */
const now=()=>Date.now();
const isOn=()=>typeof view!=='undefined'&&view==='shop2';
const redraw=()=>{ if(isOn()&&typeof render==='function') render(); };
const call=(fn,a,b)=>{ try{ if(typeof fn==='function') return fn(a,b); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const changed=()=>{ call(typeof statsChanged==='function'?statsChanged:(typeof save==='function'?save:null)); };
const hero=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>hero()==='kaia'?'Kaia':'Kael';
const rcl=r=>Math.max(0,Math.min(RC.length-1,r|0));
const rc=r=>RC[rcl(r)];
const rn=r=>{ try{ return RN(rcl(r))||''; }catch(e){ return ''; } };
const num=v=>String(v).replace('.',',');
const pl=(n,a,b)=>n0(n)+' '+(n===1?a:b);
const eraNow=()=>{ try{ return Math.max(0,Sys.host.eraMax()|0); }catch(e){ return Math.max(0,(S&&S.eraMax)|0); } };
const eraName=e=>(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n)||('Era '+(e+1));
const slotN=s=>{ try{ return String(SLOT[s].n).split('/')[0]; }catch(e){ return s; } };
const reduced=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
const gemOk=()=>{ try{ return typeof xUnlocked!=='function'||!!xUnlocked('gemShop'); }catch(e){ return true; } };
const gemLv=()=>{ try{ return typeof xUnlockLv==='function'?xUnlockLv('gemShop'):1; }catch(e){ return 1; } };

/* --- dinheiro: Sys.buy --- */
const ready=()=>{ try{ return typeof Sys.buy.purchase==='function'&&Sys.buy.ready()===true; }catch(e){ return false; } };
const simul=()=>{ try{ return Sys.buy.simulated()===true; }catch(e){ return false; } };
const prod=id=>{ try{ return Sys.buy.product(id)||null; }catch(e){ return null; } };
const prods=kind=>{ try{ return (Sys.buy.DATA.products||[]).filter(p=>p&&p.kind===kind&&typeof p.id==='string'); }catch(e){ return []; } };
const price=id=>{ if(!ready()) return ''; try{ return String(Sys.buy.priceText(id)||''); }catch(e){ return ''; } };
const avail=id=>{ try{ return Sys.buy.available(id,S)===true; }catch(e){ return false; } };

/* --- VIP: Sys.vip --- */
const vipP=()=>{ try{ return Sys.vip.progress(S); }catch(e){ return {level:0,points:0,next:null,needTotal:0,missing:0,frac:0,max:false}; } };
const vipMax=()=>{ try{ return Sys.vip.DATA.maxLevel|0; }catch(e){ return 0; } };
const vipPts=l=>{ try{ return Sys.vip.DATA.points[l]|0; }catch(e){ return 0; } };
const vipInfo=l=>{ try{ return Sys.vip.levelInfo(l); }catch(e){ return null; } };
/* prêmios de nível (uma vez): as regras 'vip:level' do Sys.newDrops; o nível é o primeiro em que a regra vale */
function vipPrizes(){ const out=[]; try{ const R=(Sys.newDrops.DATA.sources||{})['vip:level']||[], mx=vipMax();
    for(const r of R){ let lv=0; for(let i=1;i<=mx;i++){ let ok=false; try{ ok=!r.when||!!r.when({level:i}); }catch(e){ ok=false; } if(ok){ lv=i; break; } } if(!lv) continue;
      if(r.skin){ const id=r.skin[hero()], k=id?fixedDef(id):null; if(k&&k.off!==true) out.push({lv,kind:'skin',id,name:'Skin '+k.name,r:k.r,img:k.avatar?avatarUrl(k.avatar):'',sub:rn(k.r)}); }
      else if(r.mount){ const m=mountDef(r.mount); if(m) out.push({lv,kind:'mount',id:m.id,name:m.name,r:m.r,img:mountIcon(m.id),sub:'Montaria '+rn(m.r)+(r.whole?', inteira':''),soon:!mountLive(m)}); }
      else if(r.pet){ let p=null; try{ p=(Sys.pet.DATA.pets||[]).find(q=>q.id===r.pet)||null; }catch(e){ p=null; } if(p) out.push({lv,kind:'pet',id:p.id,name:p.name,r:p.r,img:'',sub:'Pet '+rn(p.r)+(r.whole?', inteiro':'')}); } }
  }catch(e){} return out.sort((a,b)=>a.lv-b.lv); }

/* --- skins: Sys.appearance --- */
const AP=()=>Sys.appearance;
const skinsOn=()=>{ try{ return AP().DATA.skinsOn===true; }catch(e){ return false; } };
const fixedDef=id=>{ try{ return AP().FIXED.find(f=>f.id===id)||null; }catch(e){ return null; } };
const avatarUrl=k=>'assets/hero/avatar/'+k+'.png';
const hookId=h=>!h?null:(typeof h==='object'?(h[hero()]||null):h);
/* lista do herói atual: a padrão + as fixas que servem nele; pid = produto do Sys.buy quando a skin é de compra direta */
function skins(){ const out=[]; let eqDef=true;
  try{ const A=AP(); eqDef=!A.fixedEquipped(S); const P=A.skinProducts(S)||[];
    for(const k of A.fixedSkins(S,Sys.host)||[]){ if(!k||!k.available) continue; const p=P.find(q=>q.id===k.id);
      out.push({id:k.id,name:k.name,r:k.r,owned:!!k.owned,eq:!!k.equipped&&!eqDef,art:k.art!==false,img:k.avatar?avatarUrl(k.avatar):'',bonus:k.bonus||'',col:k.bonusPct?k.bonusPct.collection:0,how:k.how||'',pid:p?p.productId:null}); }
  }catch(e){}
  out.unshift({id:'default',name:heroName()+' (padrão)',r:0,owned:true,eq:eqDef,art:true,img:avatarUrl(hero()+'_phase0'),bonus:'',col:0,how:'',pid:null,def:true});
  return out; }
/* estado de venda: own (tem) · buy (compra direta, com a compra real ligada) · how (vem de outro lugar) · soon (em breve) */
function skinState(sk){ if(sk.owned) return 'own'; if(sk.pid) return ready()&&avail(sk.pid)?'buy':'soon'; return skinsOn()&&sk.art?'how':'soon'; }
function skinTab(sk){ try{ const D=AP().DATA; if(hookId(D.offerSkin)===sk.id) return 'ofertas'; if(hookId(D.passSkin)===sk.id) return 'passe'; }catch(e){}
  return vipPrizes().some(p=>p.kind==='skin'&&p.id===sk.id)?'vip':''; }
const skinBonus=sk=>sk.def?'Skin inicial':(sk.bonus?sk.bonus+' equipada':'')+(sk.col?' · +'+num(sk.col)+'% na coleção':'');

/* --- montarias e asas: Sys.mount, Sys.newDrops, Sys.stats --- */
const mountDef=id=>{ try{ return Sys.mount.DATA.mounts.find(m=>m.id===id&&!m.tbd)||null; }catch(e){ return null; } };
const mountLive=m=>{ try{ return !!Sys.mount.live(m); }catch(e){ return false; } };
const mountOwned=id=>{ try{ return !!(Sys.mount.ensure(S).owned||{})[id]; }catch(e){ return false; } };
function mountIcon(id){ let f=MOUNT_ICO[id]||''; try{ if(!f&&typeof CL_ART!=='undefined'&&CL_ART.mounts&&CL_ART.mounts[id]) f=CL_ART.mounts[id]; }catch(e){}
  try{ if(!f&&typeof mountFile==='function') f=mountFile(id); }catch(e){} return 'assets/icons/mounts/'+(f||id)+'.png'; }
const mountGives=m=>{ try{ const D=Sys.mount.DATA, pr=typeof Sys.mount.powerRarity==='function'?Sys.mount.powerRarity(m.id):null; return 'Até +'+num(D.maxPct[pr!=null?pr:m.r])+'% ATQ e VIDA (Nv. '+D.maxLvl+' e '+D.maxStars+' estrelas)'; }catch(e){ return ''; } };
/* dá para mostrar montado no palco? só montaria liberada E com a folha montada do herói (as mesmas condições do mountLook do js/mountfx.js) */
function mountCanPv(m){ try{ return !!m&&mountLive(m)&&Sys.mount.DATA.visual===true&&typeof MOUNT_TBL!=='undefined'&&!!MOUNT_TBL[m.id]&&typeof mountPrefix==='function'&&!!mountPrefix(m.id); }catch(e){ return false; } }
/* montarias à venda: Sys.newDrops.shop() (on = liberada no jogo) + o produto do Sys.buy */
function shopMounts(){ const out=[]; try{ for(const x of Sys.newDrops.shop()||[]){ if(!x||x.kind!=='mount') continue; const m=mountDef(x.id), p=prod(x.productId); if(m&&p) out.push({m,p,on:x.on===true}); } }catch(e){} return out; }
function wings(){ try{ const T=Sys.stats, minR=T.DATA.wing.minR|0, minL=T.DATA.wing.minLevel|0;
    return (T.wingCatalog()||[]).filter(w=>w&&w.live).map(w=>({id:w.id,name:w.name,r:w.r==null?minR:w.r,how:(w.src&&w.src[0])||('Cai dos inimigos a partir do nível '+minL),img:'assets/icons/wings/wing_'+w.id+'.png'})); }catch(e){ return []; } }
const wingEq=()=>{ try{ const id=S.eq&&S.eq.wing; if(id==null) return null; const it=(S.inv||[]).find(i=>i&&i.id===id); return it?Sys.stats.wingOf(it):null; }catch(e){ return null; } };

/* --- Oferta de 1ª compra: Sys.offer (conteúdo do DATA; janela e "já comprou" do status) --- */
function offerInfo(){ let O=null, p=null; try{ O=Sys.offer; p=prod(Sys.buy.DATA.offerProduct); }catch(e){ O=null; } if(!O||!O.DATA||!p) return null;
  const D=O.DATA; let st={on:false,available:false}; try{ st=O.status(S,Sys.host)||st; }catch(e){}
  let claimed=!!st.claimed; try{ if(S.sys&&S.sys.offer&&S.sys.offer.claimed===true) claimed=true; }catch(e){}
  const items=[]; let skin=null, mount=null;
  try{ const id=hookId(D.skin)||(skinsOn()?hookId(AP().DATA.offerSkin):null), k=id?fixedDef(id):null; if(k&&k.off!==true){ skin={id:k.id,art:k.art!==false,name:k.name}; items.push({img:k.avatar?avatarUrl(k.avatar):'',r:k.r,t:'Skin '+k.name}); } }catch(e){}
  try{ const W=D.weapon; if(W){ let stars=0; try{ stars=Sys.stats.DATA.quality?Sys.stats.qualityStars(W.qp)|0:0; }catch(e){ stars=0; }
      items.push({img:typeof slotIcon==='function'?slotIcon(W.slot,eraNow(),W.r):'',r:W.r,t:slotN(W.slot)+' '+rn(W.r)+(stars?' '+stars+' estrelas':'')}); } }catch(e){}
  try{ const m=mountDef(D.mount); if(m){ mount={id:m.id,def:m}; items.push({img:mountIcon(m.id),r:m.r,t:m.name}); } }catch(e){}
  if(D.gems>0) items.push({img:UI_GEM,r:1,t:n0(D.gems)+' diamantes'});
  try{ const unit=Math.max(1,+Sys.host.goldUnit()||1), g=Math.round((+D.goldk||0)*unit); if(g>0) items.push({img:UI_COIN,r:0,t:kf(g)+' de ouro'}); }catch(e){}
  const can=ready()&&st.on===true&&st.available===true&&!claimed;
  return {p,items,skin,mount,claimed,can,ended:!claimed&&st.on===true&&!st.available,label:claimed?'Comprada':(st.on===true&&!st.available)?'Encerrada':SOON}; }

/* --- Passe: Sys.pass --- */
function passInfo(){ try{ const D=Sys.pass.DATA, sum=a=>(Array.isArray(a)?a:[]).reduce((t,x)=>t+((x&&+x.gems)||0),0); let prem=false; try{ prem=!!Sys.pass.progress(S).premium; }catch(e){}
    const sid=skinsOn()?hookId(AP().DATA.passSkin):null, k=sid?fixedDef(sid):null;
    return {tiers:D.tiers|0,days:D.seasonDays|0,xp:+D.premiumXpPct||0,premGems:sum(D.premium),freeGems:sum(D.free),premium:prem,skin:k&&k.off!==true?k:null,p:prods('pass_premium')[0]||null}; }catch(e){ return null; } }

/* --- estoque do dia em ouro: S.shop.offers --- */
function offers(){ try{ if(typeof ensureShop==='function') ensureShop(); }catch(e){} try{ return S.shop&&Array.isArray(S.shop.offers)?S.shop.offers:[]; }catch(e){ return []; } }
function gItem(o){ try{ if(typeof shopItem==='function') return shopItem(o); }catch(e){} return {slot:o.slot,r:o.r,e:o.e,lvl:1,gold:0,subs:Array.isArray(o.subs)?o.subs:[]}; }
const gName=it=>{ try{ return iname(it); }catch(e){ return slotN(it.slot); } };
const gIcon=(it,px)=>{ try{ const u=slotIcon(it.slot,typeof ieraV==='function'?ieraV(it):it.e|0); return typeof xRarIco==='function'?xRarIco(u,it.r,px):u; }catch(e){ return ''; } };
const gLines=it=>{ try{ return typeof itemLines==='function'?(itemLines(it)||[]):[]; }catch(e){ return []; } };
const bagFull=()=>{ try{ return (S.inv||[]).length>=(typeof xBagMax==='function'?xBagMax():Infinity); }catch(e){ return false; } };
const lackGold=g=>{ try{ return typeof needMsg==='function'?needMsg('gold',g):'Falta ouro'; }catch(e){ return 'Falta ouro'; } };

/* ---------- desenhos pequenos (sem emoji) ---------- */
const SV={
  go:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M9 6l6 6-6 6"/></svg>',
  eye:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  info:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5ee7ff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  check:'<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#5ef0a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  crown:px=>'<svg viewBox="0 0 24 18" width="'+px+'" height="'+Math.round(px*0.75)+'" fill="#ffd25e" aria-hidden="true" style="flex:none"><path d="M2 16L4 4l5 5 3-8 3 8 5-5 2 12z"/></svg>',
  gift:px=>'<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" fill="none" stroke="#ffd25e" stroke-width="2" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M3 9h18v4H3zM5 13h14v8H5zM12 9v12M12 9c-2-5-8-3-5 0M12 9c2-5 8-3 5 0"/></svg>',
  paw:px=>'<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" fill="#9aa6d6" aria-hidden="true" style="flex:none"><circle cx="6" cy="10" r="2.2"/><circle cx="10" cy="6" r="2.2"/><circle cx="15" cy="6" r="2.2"/><circle cx="19" cy="10" r="2.2"/><path d="M12 11c-3 0-6 3-6 6 0 2 2 3 6 3s6-1 6-3c0-3-3-6-6-6z"/></svg>'
};
const im=(src,px)=>'<img src="'+src+'" alt="" width="'+px+'" height="'+px+'" style="width:'+px+'px;height:'+px+'px;object-fit:contain;flex:none">';
const ico=(src,r,inner)=>'<span class="s2-ico" style="--rc:'+rc(r)+'">'+(src?'<img src="'+src+'" alt="" loading="lazy">':(inner||''))+'</span>';
const tag=(cls,txt)=>'<span class="s2-bt '+cls+'">'+esc2(txt)+'</span>';

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.s2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--rose:#ff6b9a;--green:#5ef0a0;--red:#ff6b6b;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.s2 *{box-sizing:border-box}
.s2 button{font-family:inherit;cursor:pointer}
.s2-in{animation:s2-fade .22s ease-out}
.s2-bg{position:absolute;left:0;right:0;top:0;height:380px;pointer-events:none}
.s2-stage{position:relative;z-index:2;flex:none}
.s2-cur{position:absolute;z-index:3;top:4px;display:flex;align-items:center;gap:4px;height:26px;max-width:88px;padding:0 8px 0 3px;border-radius:13px;background:rgba(5,8,28,.7);border:1px solid var(--line);font-weight:900;font-size:12px;white-space:nowrap}
.s2-cur span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.s2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;height:26px;max-width:calc(100% - 190px);padding:0 10px;border-radius:13px;background:rgba(5,8,28,.7);border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap}
.s2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.s2-who span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.s2-pvb,.xs .s2-pvb{position:absolute;z-index:4;left:50%;top:34px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;height:40px;max-width:calc(100% - 24px);padding:0 5px 0 12px;border-radius:20px;border:1px solid var(--rose);background:rgba(60,14,34,.92);color:#ffd6e2;font-weight:900;font-size:12px;white-space:nowrap}
.s2-pvb span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.s2-pvb u{flex:none;text-decoration:none;height:28px;line-height:28px;padding:0 12px;border-radius:14px;background:var(--rose);color:#3a0618}
.s2-vip,.xs .s2-vip{position:relative;z-index:3;flex:none;display:flex;align-items:center;gap:8px;min-height:44px;margin:2px 12px 0;padding:4px 10px 4px 8px;border-radius:14px;background:linear-gradient(90deg,rgba(74,56,10,.9),rgba(10,14,44,.9) 65%);border:1px solid rgba(255,210,94,.5);text-align:left;min-width:0;color:var(--text)}
.s2-vip .vl{font-family:'Lilita One',Nunito,sans-serif;font-size:20px;color:var(--gold);white-space:nowrap;flex:none}
.s2-vip .vp{flex:1;min-width:0;display:block}
.s2-vip small{display:block;font-size:10px;font-weight:800;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.s2-vip small b{color:var(--text)}
.s2-bar{display:block;height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden}
.s2-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#ffe58a,#f4a52a)}
.s2-tabs{position:relative;z-index:3;flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:6px 12px 0;padding:3px;border-radius:14px;background:rgba(5,8,28,.8);border:1px solid var(--line)}
.s2-tab,.xs .s2-tab{position:relative;height:40px;border:0;border-radius:10px;background:none;font-weight:900;font-size:12px;color:var(--muted);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
.s2-tab[aria-selected="true"],.xs .s2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.s2-tab[aria-disabled="true"],.xs .s2-tab[aria-disabled="true"]{color:#58628f}
.s2-scroll{position:relative;z-index:3;flex:1;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;padding:8px 12px 20px}
.s2-bt,.xs .s2-bt{flex:none;min-width:76px;min-height:40px;padding:2px 10px;border-radius:11px;border:0;font-weight:900;font-size:12px;line-height:1.1;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:var(--ink);box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:4px;text-align:center;font-variant-numeric:tabular-nums}
.s2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.s2-bt.blue,.xs .s2-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);color:#04223f;box-shadow:0 3px 0 #164e8c}
.s2-bt.rose,.xs .s2-bt.rose{background:linear-gradient(180deg,#ff9fbe,#e0477a);color:#3a0618;box-shadow:0 3px 0 #8c1d44}
.s2-bt.on,.xs .s2-bt.on{background:rgba(94,240,160,.12);color:var(--green);box-shadow:none;border:2px solid var(--green);transform:none}
.s2-bt.off,.xs .s2-bt.off,.s2-bt[aria-disabled="true"],.xs .s2-bt[aria-disabled="true"]{background:rgba(255,255,255,.06);color:var(--muted);box-shadow:none;border:1px solid var(--line);transform:none}
.s2-det{position:sticky;top:-8px;z-index:5;display:flex;gap:9px;align-items:center;margin:0 0 8px;padding:7px 9px;border-radius:14px;background:linear-gradient(90deg,#232c66,#141c4a);border:1px solid var(--rc);min-width:0;animation:s2-rin .2s ease-out}
.s2-det .s2-ico{width:44px;height:44px;border-radius:11px}
.s2-di{flex:1;min-width:0}
.s2-dn{font-weight:900;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.s2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--rc)}
.s2-dg{font-size:11px;color:var(--green);font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.s2-dh{font-size:11px;color:var(--muted);font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.s2-dh b{color:var(--gold)}
.s2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:4px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.s2-sec span{min-width:0}
.s2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.s2-sec b{color:var(--gold)}
.s2-hint{font-size:11px;color:var(--muted);margin:0 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.s2-hint b{color:var(--gold)}
.s2-pc,.xs .s2-pc{width:100%;display:flex;gap:10px;align-items:center;padding:8px;border-radius:16px;background:var(--glass);border:1px solid var(--line);margin-bottom:7px;min-width:0;text-align:left;color:var(--text)}
.s2-pc.pv{box-shadow:0 0 0 3px var(--rose)}
.s2-ico{flex:none;width:56px;height:56px;border-radius:14px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);position:relative;overflow:hidden;display:grid;place-items:center}
.s2-ico img{position:absolute;left:6%;top:6%;width:88%;height:88%;object-fit:contain}
.s2-pi{flex:1;min-width:0;display:block}
.s2-pn{display:block;font-weight:900;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.s2-pg{display:block;font-size:11px;color:var(--green);font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.s2-ps{display:block;font-size:11px;color:var(--muted);font-weight:700;line-height:1.35;overflow-wrap:anywhere}
.s2-ps b{color:var(--gold)}
.s2-pbt{display:flex;flex-direction:column;gap:6px;flex:none}
.s2-off{position:relative;border-radius:18px;padding:10px;margin-bottom:8px;background:linear-gradient(160deg,rgba(90,30,60,.8),rgba(24,33,86,.92) 45%,rgba(74,56,10,.8));border:2px solid rgba(255,210,94,.7);min-width:0}
.s2-offh{display:flex;align-items:center;gap:8px;min-width:0}
.s2-offh .t{flex:1;min-width:0}
.s2-offh .t b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:19px;letter-spacing:.5px;color:var(--gold);line-height:1.1;overflow-wrap:anywhere}
.s2-offh .t small{display:block;font-size:11px;font-weight:800;color:#ffd6e2;line-height:1.3}
.s2-ofg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin:8px 0}
.s2-ofg div{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.s2-ofg .s2-ico{width:100%;height:auto;aspect-ratio:1;border-radius:12px}
.s2-ofg small{font-size:9px;font-weight:900;text-align:center;line-height:1.15;overflow-wrap:anywhere;max-width:100%}
.s2-offb{display:flex;gap:8px;min-width:0}
.s2-offb .s2-bt{flex:1 1 0;min-width:0;min-height:42px;font-size:13px}
.s2-ben{margin:8px 0;padding-left:16px;font-size:12px;font-weight:700;line-height:1.5}
.s2-ben b{color:var(--gold)}
.s2-vg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}
.s2-vc,.xs .s2-vc{position:relative;border-radius:14px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 30%,#27337e,#0c1238);padding:5px 5px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;color:var(--text)}
.s2-vc .art{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.s2-vc .nm{font-size:11px;font-weight:900;text-align:center;line-height:1.15;min-height:26px;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
.s2-vc .bo{font-size:9px;font-weight:800;color:var(--green);text-align:center;line-height:1.2}
.s2-vc .st{margin-top:3px;width:100%;min-height:24px;border-radius:8px;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.1;padding:2px 3px;overflow-wrap:anywhere}
.s2-vc .st.buy{background:linear-gradient(180deg,#ffe58a,#f4a52a);color:var(--ink)}
.s2-vc .st.own{background:rgba(94,240,160,.12);color:var(--green)}
.s2-vc .st.how{background:rgba(255,255,255,.06);color:var(--muted);font-size:9px}
.s2-vc.pv{box-shadow:0 0 0 3px var(--rose),0 0 14px rgba(255,107,154,.5)}
.s2-vc.eq{box-shadow:0 0 0 3px var(--gold),0 0 14px rgba(255,210,94,.45)}
.s2-vc .bd{position:absolute;left:4px;top:4px;font-size:8px;font-weight:900;padding:1px 5px;border-radius:6px;background:var(--green);color:#043018}
.s2-vc .rt{position:absolute;right:4px;top:4px;font-size:8px;font-weight:900;padding:1px 5px;border-radius:6px;background:rgba(5,8,28,.8);color:var(--rc);text-transform:uppercase;letter-spacing:.4px}
.s2-gg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-bottom:10px}
.s2-gk{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 8px 8px;border-radius:16px;background:radial-gradient(circle at 50% 25%,rgba(30,80,120,.6),rgba(24,33,86,.9) 70%);border:1px solid rgba(94,231,255,.45);min-width:0}
.s2-pile{position:relative;width:96px;height:62px;max-width:100%}
.s2-pile img{position:absolute;width:36px;height:36px}
.s2-gk>b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1;color:#c9f6ff;font-variant-numeric:tabular-nums}
.s2-gk small{font-size:11px;font-weight:800;color:var(--muted);text-align:center;line-height:1.25;min-height:28px;overflow-wrap:anywhere}
.s2-gk small b{color:var(--green)}
.s2-gk .s2-bt{width:100%;min-width:0;margin-top:2px}
.s2-vipc{border-radius:18px;padding:10px;margin-bottom:8px;background:linear-gradient(160deg,rgba(74,56,10,.85),rgba(24,33,86,.92) 55%);border:2px solid rgba(255,210,94,.65);min-width:0}
.s2-viph{display:flex;align-items:center;gap:10px;min-width:0}
.s2-viph .big{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:32px;line-height:1;color:var(--gold)}
.s2-viph .t{flex:1;min-width:0}
.s2-viph small{display:block;font-size:11px;font-weight:800;color:var(--muted);line-height:1.35;overflow-wrap:anywhere}
.s2-viph small b{color:var(--text)}
.s2-vipc .s2-bar{height:10px;margin-top:8px}
.s2-lvls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:8px}
.s2-lv,.xs .s2-lv{height:40px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-weight:900;font-size:13px;color:var(--muted);padding:0;min-width:0}
.s2-lv.got,.xs .s2-lv.got{color:var(--text)}
.s2-lv.me,.xs .s2-lv.me{border:2px solid var(--gold);color:var(--gold)}
.s2-lv[aria-pressed="true"],.xs .s2-lv[aria-pressed="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;border-color:#7f93ff}
.s2-pk{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:12px;background:var(--glass);border:1px solid var(--line);margin-bottom:5px;min-width:0}
.s2-pk>img{width:30px;height:30px;object-fit:contain;flex:none}
.s2-pk>span:first-of-type{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.s2-pk small{display:block;font-size:10px;color:var(--muted);font-weight:700}
.s2-pk em{font-style:normal;font-weight:900;font-size:12px;color:var(--gold);white-space:nowrap;flex:none}
.s2-pill{flex:none;font-size:10px;font-weight:900;padding:2px 7px;border-radius:8px;white-space:nowrap}
.s2-pill.on{background:rgba(94,240,160,.15);color:var(--green)}
.s2-pill.off{background:rgba(255,255,255,.07);color:var(--muted)}
.s2-og{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-bottom:10px}
.s2-oc{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 5px;border-radius:14px;background:var(--glass);border:1px solid var(--line);min-width:0}
.s2-oc .s2-ico{width:100%;height:auto;aspect-ratio:1}
.s2-oc .nm{font-size:10px;font-weight:900;text-align:center;line-height:1.15;min-height:24px;display:flex;align-items:center;overflow-wrap:anywhere}
.s2-oc .sb{font-size:9px;font-weight:900;text-align:center;line-height:1.15;color:var(--rc);overflow-wrap:anywhere}
.s2-oc .s2-bt{width:100%;min-width:0;font-size:11px;padding:0 4px}
.s2-oc.sold .s2-ico img{filter:grayscale(.8) brightness(.55)}
.s2-wide,.xs .s2-wide{width:100%;min-height:40px}
.s2-shade{position:absolute;inset:0;z-index:30;background:rgba(3,5,18,.74);display:flex;align-items:flex-end;animation:s2-fade .2s}
.s2-sheet{width:100%;max-height:88%;overflow-y:auto;overflow-x:hidden;border-radius:24px 24px 0 0;background:linear-gradient(180deg,#1d2768,#0f1540);border:1px solid var(--line2);border-bottom:0;padding:14px 16px 22px;min-width:0;animation:s2-sup .25s ease-out}
.s2-sheet h3{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;margin:0 0 10px;letter-spacing:.5px}
.s2-mi{display:flex;gap:10px;align-items:center;padding:8px;border-radius:14px;background:rgba(5,8,28,.5);margin-bottom:10px;min-width:0}
.s2-mi .s2-ico{width:52px;height:52px}
.s2-sheet p{margin:0 0 6px;font-size:13px;color:var(--muted);line-height:1.45;font-weight:700;overflow-wrap:anywhere}
.s2-gain{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 2px}
.s2-gain span{display:inline-flex;align-items:center;gap:5px;min-height:28px;padding:3px 9px;border-radius:9px;background:rgba(94,240,160,.12);color:var(--green);font-weight:900;font-size:12px;line-height:1.2;min-width:0;overflow-wrap:anywhere}
.s2-prow{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--line);min-width:0}
.s2-prow span{font-size:13px;font-weight:800;color:var(--muted)}
.s2-prow b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:28px;color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.s2-prow em{font-style:normal;font-weight:900;font-size:13px;white-space:nowrap}
.s2-note{display:flex;gap:8px;align-items:flex-start;padding:9px 10px;border-radius:12px;background:rgba(20,60,90,.5);border:1px solid rgba(94,231,255,.45);font-size:12px;font-weight:800;color:#cdeffd;line-height:1.4;margin-top:10px;overflow-wrap:anywhere}
.s2-macts{display:flex;gap:8px;margin-top:14px;min-width:0}
.s2-macts .s2-bt{flex:1 1 0;min-width:0;min-height:48px;font-size:14px}
.s2-okc{width:64px;height:64px;border-radius:50%;margin:4px auto 10px;display:grid;place-items:center;background:rgba(94,240,160,.15);border:2px solid var(--green)}
.s2-toast{position:absolute;left:50%;top:44px;z-index:40;transform:translateX(-50%);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;animation:s2-tin 2.2s ease both;max-width:calc(100% - 24px);overflow-wrap:anywhere;pointer-events:none}
@keyframes s2-fade{from{opacity:0}}
@keyframes s2-rin{from{opacity:.001;transform:translateY(6px)}}
@keyframes s2-sup{from{transform:translateY(60px);opacity:.4}}
@keyframes s2-tin{0%{opacity:0;transform:translate(-50%,-8px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.s2-in,.s2-shade,.s2-sheet,.s2-det{animation:none}.s2-toast{animation-timing-function:step-end}}
`; document.head.appendChild(st); })();

/* ---------- aviso dentro da tela (nada de diálogo do navegador) ---------- */
const toastHtml=m=>'<div class="s2-toast" role="status">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('s2_toast'); if(el) el.innerHTML=toastHtml(X.toast); }catch(e){} }

/* ================= PALCO (canvas): chão e o herói do jogo. A prévia entra pelo state do drawHeroFull ================= */
/* o que o palco mostra agora: a pé com o que está equipado; a prévia troca a skin, a asa ou põe a montaria (o pet continua, na frente) */
function lookNow(){ const L={mount:false}, R=X.pv; if(!R) return L;
  if(R.kind==='skin') L.skin=R.id;
  else if(R.kind==='wing') L.wing=R.id;
  else if(R.kind==='mount'){ const m=mountDef(R.id); if(mountCanPv(m)) L.mount={id:m.id,stars:1}; }
  else if(R.kind==='offer'){ const o=offerInfo(); if(o){ if(o.skin&&o.skin.art) L.skin=o.skin.id; if(o.mount&&mountCanPv(o.mount.def)) L.mount={id:o.mount.id,stars:1}; } }
  return L; }
function ground(x,hx,gy,t){ const g=x.createRadialGradient(hx,gy,10,hx,gy,140); g.addColorStop(0,'rgba(255,210,94,.3)'); g.addColorStop(1,'rgba(255,210,94,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(hx,gy,140,20,0,0,7); x.fill();
  x.strokeStyle='rgba(255,210,94,.5)'; x.setLineDash([5,6]); x.lineDashOffset=reduced()?0:-t*10; x.lineWidth=1.5; x.beginPath(); x.ellipse(hx,gy,112,15,0,0,7); x.stroke(); x.setLineDash([]); }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||216;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0);
  base(); x.clearRect(0,0,w,h);
  const L=X.look||{mount:false}, rid=!!L.mount, hk=Math.min(.78,(h-34)/256)*(rid?.8:1), hx=w*(rid?.44:.5), gy=h-12;
  try{ ground(x,w*.5,gy,t); }catch(e){} base();
  try{ if(typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0) window.drawHeroFull(x,hx,gy,hk*256/HS,Object.assign({t:t},L)); }catch(e){ try{ x.restore(); }catch(e2){} }
  base(); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('s2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('s2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }

/* ================= HTML ================= */
function pvName(){ const R=X.pv; if(!R) return ''; if(R.kind==='offer'){ const o=offerInfo(); return o?o.p.name:''; }
  if(R.kind==='skin'){ const k=skins().find(s=>s.id===R.id); return k?k.name:''; } if(R.kind==='mount'){ const m=mountDef(R.id); return m?m.name:''; }
  const w=wings().find(q=>q.id===R.id); return w?w.name:''; }
function stageHtml(SH){ const v=vipP();
  return '<div class="s2-stage" style="height:'+SH+'px"><canvas id="s2_stc" role="img" aria-label="Seu herói com a arma equipada na mão e o pet na frente; a prévia aparece aqui" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas>'
    +'<div class="s2-cur" style="left:8px" role="img" aria-label="'+n0(+S.gold||0)+' de ouro">'+im(UI_COIN,20)+'<span>'+esc2(kf(+S.gold||0))+'</span></div>'
    +'<div class="s2-cur" style="right:8px" role="img" aria-label="'+n0(+S.gems||0)+' diamantes">'+im(UI_GEM,20)+'<span>'+n0(+S.gems||0)+'</span></div>'
    +'<div class="s2-who"><i></i><span>'+esc2(heroName())+' · '+(v.level?'VIP '+v.level:'sem VIP')+'</span></div>'
    +(X.pv?'<button class="s2-pvb" data-x="pvout" aria-label="Sair da prévia"><span>Prévia: '+esc2(pvName())+'</span><u>Sair</u></button>':'')+'</div>'; }
function vipBarHtml(){ const v=vipP();
  return '<button class="s2-vip" data-x="tab" data-t="vip" aria-label="VIP '+v.level+': abrir a aba VIP">'+SV.crown(28)+'<span class="vl">VIP '+v.level+'</span><span class="vp"><span class="s2-bar"><i style="width:'+(v.frac*100).toFixed(1)+'%"></i></span>'
    +'<small>'+(v.max?'Nível máximo':'<b>'+n0(v.points)+'</b> de <b>'+n0(v.needTotal)+'</b> pontos para o VIP '+v.next)+'</small></span>'+SV.go+'</button>'; }
function tabsHtml(){ const ok=gemOk();
  return '<div class="s2-tabs" role="tablist" aria-label="Seções da loja">'+TABS.map(t=>'<button class="s2-tab" role="tab" data-x="tab" data-t="'+t[0]+'" aria-selected="'+(X.tab===t[0])+'"'+(!ok&&t[0]!=='ouro'?' aria-disabled="true"':'')+'>'+t[1]+'</button>').join('')+'</div>'; }

/* botão de um produto de dinheiro: preço (compra real ligada e produto disponível) ou só "Em breve" */
function buyBtn(id,can,cls){ const pr=can?price(id):''; return pr?'<button class="s2-bt'+(cls?' '+cls:'')+'" data-x="buy" data-id="'+esc2(id)+'">'+esc2(pr)+'</button>':tag('off',SOON); }

/* ----- faixa de detalhe da prévia / do item tocado ----- */
function detHtml(){ const R=X.pv||X.sel; if(!R) return '';
  const box=(r,icon,name,rar,gives,st,btn)=>'<div class="s2-det" style="--rc:'+rc(r)+'">'+icon+'<div class="s2-di"><div class="s2-dn">'+esc2(name)+(rar?' <span class="s2-rar">'+esc2(rar)+'</span>':'')+'</div>'+(gives?'<div class="s2-dg">'+esc2(gives)+'</div>':'')+'<div class="s2-dh">'+st+'</div></div>'+btn+'</div>';
  if(R.kind==='offer'){ const o=offerInfo(); if(!o) return '';
    return box(4,ico('',4,SV.gift(26)),o.p.name,'1ª compra',o.items.map(i=>i.t).join(' + '),'Só na 1ª compra · uma vez por conta',o.can?buyBtn(o.p.id,true):tag(o.claimed?'on':'off',o.label)); }
  if(R.kind==='skin'){ const sk=skins().find(s=>s.id===R.id); if(!sk) return ''; const st=skinState(sk), to=skinTab(sk);
    const txt=st==='own'?(sk.eq?'Na coleção · <b>usando</b>':'Na coleção'):st==='buy'?'Compra direta, uma vez por conta · mesmo corpo do herói':st==='how'?'Como ganhar: <b>'+esc2(sk.how)+'</b>':sk.pid?'Compra direta: pagamento em breve':'Em breve';
    const btn=st==='own'?(sk.eq?tag('on','Usando'):'<button class="s2-bt blue" data-x="equip" data-id="'+esc2(sk.id)+'">Usar</button>'):st==='buy'?buyBtn(sk.pid,true)
      :st==='how'&&to?'<button class="s2-bt blue" data-x="tab" data-t="'+to+'">Ver'+SV.go+'</button>':tag('off',st==='how'?'Não se vende':SOON);
    return box(sk.r,ico(sk.img,sk.r),sk.name,rn(sk.r),skinBonus(sk),txt,btn); }
  if(R.kind==='mount'){ const m=mountDef(R.id); if(!m) return ''; const own=mountOwned(m.id), sm=shopMounts().find(q=>q.m.id===m.id), o=offerInfo(), inOffer=!!(o&&o.mount&&o.mount.id===m.id);
    const txt=own?'Na coleção · montar na tela Montarias':sm?'Inteira, sem sorteio · uma vez por conta':inOffer?'Como ganhar: <b>'+esc2(o.p.name)+'</b>':'Não se vende';
    const btn=own?tag('on','Na coleção'):sm?buyBtn(sm.p.id,sm.on&&ready()&&avail(sm.p.id)):inOffer?'<button class="s2-bt blue" data-x="tab" data-t="ofertas">Ver'+SV.go+'</button>':tag('off','Não se vende');
    return box(m.r,ico(mountIcon(m.id),m.r),m.name,rn(m.r),mountGives(m),txt,btn); }
  const w=wings().find(q=>q.id===R.id); if(!w) return ''; const eq=wingEq()===w.id;
  return box(w.r,ico(w.img,w.r),w.name,rn(w.r),'Peça do espaço Asa: o atributo vem da raridade e do nível do item',eq?'Na mochila · <b>usando</b>':'Não se vende · <b>'+esc2(w.how)+'</b>',eq?tag('on','Usando'):tag('off','Não se vende')); }

/* ----- pedaços das abas ----- */
function offerCard(){ const o=offerInfo(); if(!o) return '';
  const head='<div class="s2-offh">'+SV.gift(36)+'<div class="t"><b>'+esc2(o.p.name)+'</b><small>Só na 1ª compra · uma vez por conta · compra direta</small></div></div>';
  const grid=o.items.length?'<div class="s2-ofg" style="grid-template-columns:repeat('+Math.min(5,o.items.length)+',minmax(0,1fr))">'+o.items.map(i=>'<div>'+ico(i.img,i.r)+'<small>'+esc2(i.t)+'</small></div>').join('')+'</div>':'';
  const canPv=!!((o.skin&&o.skin.art)||(o.mount&&mountCanPv(o.mount.def)));
  return '<div class="s2-off">'+head+grid+'<div class="s2-offb">'+(canPv?'<button class="s2-bt rose" data-x="pv" data-k="offer" data-id="offer">'+SV.eye+'Ver no herói</button>':'')
    +(o.can?buyBtn(o.p.id,true):tag(o.claimed?'on':'off',o.label))+'</div></div>'; }
/* Cartão Mensal: o estado (ativo, dias, resgatado hoje) é do Sys.buy.cardStatusLive e só é consultado com a compra real ligada */
function cardLoad(){ const C=X.card; if(C.load||!ready()) return; if(C.st&&(C.st.err||now()-C.at<30000)) return;
  let fn=null; try{ fn=typeof Sys.buy.cardStatusLive==='function'?Sys.buy.cardStatusLive:Sys.buy.cardStatus; }catch(e){ fn=null; }
  if(typeof fn!=='function'){ C.st={err:true}; C.at=now(); return; }
  C.load=true; let sync=true; const fin=st=>{ C.load=false; C.at=now(); C.st=st&&typeof st==='object'&&!st.error?{active:!!st.active,daysLeft:Math.max(0,Math.floor(+st.daysLeft||0)),claimedToday:!!st.claimedToday}:{err:true}; if(!sync) redraw(); };
  try{ Promise.resolve(fn.call(Sys.buy,S,Sys.host)).then(fin,()=>fin(null)); }catch(e){ fin(null); } sync=false; }
function cardRow(){ const p=prods('monthly_card')[0]; if(!p) return ''; const on=ready(); if(on) cardLoad(); const st=on?X.card.st:null;
  const gives=n0(p.gems)+' diamantes na hora + '+n0(p.daily)+' por dia por '+n0(p.days)+' dias', total=n0((+p.gems||0)+(+p.daily||0)*(+p.days||0))+' no total · resgate 1 vez por dia';
  let btn=tag('off',SOON), sub=total;
  if(on){ if(!st||X.card.claim) btn=tag('off',X.card.claim?'Resgatando...':'Conferindo...');
    else if(st.err){ btn='<button class="s2-bt blue" data-x="cardretry">Tentar de novo</button>'; sub='Não deu para conferir o cartão agora.'; }
    else if(st.active){ sub='Ativo: '+pl(st.daysLeft,'dia restante','dias restantes'); btn=st.claimedToday?tag('off','Resgatado hoje'):'<button class="s2-bt blue" data-x="claim">'+im(UI_GEM,16)+'Resgatar '+n0(p.daily)+'</button>'; }
    else btn=buyBtn(p.id,true); }
  return '<div class="s2-pc">'+ico(UI_GEM,3)+'<div class="s2-pi"><span class="s2-pn">'+esc2(p.name)+'</span><span class="s2-pg">'+esc2(gives)+'</span><span class="s2-ps">'+esc2(sub)+'</span></div>'+btn+'</div>'; }
function passGives(P){ const g=[]; if(P.xp) g.push('+'+num(P.xp)+'% XP do Passe'); if(P.premGems) g.push(n0(P.premGems)+' diamantes'); if(P.skin) g.push('skin '+P.skin.name+' no nível '+P.tiers); return g.join(' · '); }
function passRow(){ const P=passInfo(); if(!P||!P.p) return '';
  return '<div class="s2-pc">'+ico(UI_PASS,4)+'<div class="s2-pi"><span class="s2-pn">'+esc2(P.p.name)+'</span><span class="s2-pg">'+esc2(passGives(P))+'</span><span class="s2-ps">'+(P.premium?'<b>Ativo</b> nesta temporada':'Temporada de '+n0(P.days)+' dias')+'</span></div><button class="s2-bt blue" data-x="tab" data-t="passe">Ver'+SV.go+'</button></div>'; }
function goldCell(o,i){ const it=gItem(o), nm=gName(it), can=(+S.gold||0)>=o.price;
  return '<div class="s2-oc'+(o.sold?' sold':'')+'" style="--rc:'+rc(o.r)+'">'+ico(gIcon(it,56),o.r)+'<div class="nm">'+esc2(nm)+'</div><div class="sb">'+esc2(rn(o.r))+' · '+esc2(slotN(o.slot))+'</div>'
    +(o.sold?tag('on','Comprado'):'<button class="s2-bt'+(can?'':' off')+'" data-x="gold" data-i="'+i+'" aria-label="'+esc2(nm)+', '+esc2(rn(o.r))+': '+n0(o.price)+' de ouro">'+im(UI_COIN,16)+esc2(kf(o.price))+'</button>')+'</div>'; }

/* ----- as 7 abas ----- */
function tabOfertas(){ const L=offers(); let h=offerCard()+cardRow()+passRow();
  if(L.length){ const top=L.map((o,i)=>({o,i})).sort((a,b)=>(b.o.r-a.o.r)||(a.i-b.i)).slice(0,3);
    h+='<div class="s2-sec"><span>Ofertas do dia (ouro)</span><span>renova à meia-noite</span></div><div class="s2-og">'+top.map(q=>goldCell(q.o,q.i)).join('')+'</div>'
      +'<button class="s2-bt off s2-wide" data-x="tab" data-t="ouro">Ver as '+L.length+' ofertas do dia'+SV.go+'</button>'; }
  return h; }
function tabGemas(){ const P=prods('gems'), on=ready(), pos=[[30,14],[8,22],[52,22],[20,4],[42,4],[30,28]];
  const pile=c=>'<span class="s2-pile" aria-hidden="true">'+pos.slice(0,c).map(q=>'<img src="'+UI_GEM+'" alt="" style="left:'+q[0]+'px;top:'+q[1]+'px">').join('')+'</span>';
  let h='<p class="s2-hint">'+(P.some(p=>p.firstDouble)?'Cada pacote vem em <b>dobro na 1ª compra</b> dele. ':'')+'Diamantes nunca compram VIP nem Passe. '+(on?'Cada real gasto vira 1 ponto VIP.'+(simul()?' Modo dono: compra simulada, nada é cobrado.':''):SOON_MSG+'.')+'</p><div class="s2-gg">';
  P.forEach((p,i)=>{ h+='<div class="s2-gk">'+pile(Math.min(pos.length,i+1))+'<b>'+n0(p.gems)+'</b><small>diamantes'+(p.firstDouble?'<br>1ª compra: <b>'+n0(p.gems*2)+'</b>':'')+'</small>'+buyBtn(p.id,on)+'</div>'; });
  return h+'</div>'+cardRow(); }
function vcSkin(sk){ const st=skinState(sk), pv=!!(X.pv&&X.pv.kind==='skin'&&X.pv.id===sk.id);
  const foot=st==='own'?'<span class="st own">'+(sk.eq?'Usando':'Na coleção')+'</span>':st==='buy'?'<span class="st buy">'+esc2(price(sk.pid))+'</span>':st==='how'?'<span class="st how">'+esc2(sk.how)+'</span>':'<span class="st how">'+SOON+'</span>';
  return '<button class="s2-vc'+(sk.eq&&!X.pv?' eq':'')+(pv?' pv':'')+'" style="--rc:'+rc(sk.r)+'" data-x="pv" data-k="skin" data-id="'+esc2(sk.id)+'" aria-pressed="'+pv+'" aria-label="'+esc2(sk.name)+', '+esc2(rn(sk.r))+(sk.owned?', na coleção':'')+'">'
    +(sk.owned?'<span class="bd">'+(sk.eq?'Usando':'Sua')+'</span>':'')+'<span class="rt">'+esc2(rn(sk.r))+'</span>'+(sk.img?'<img class="art" src="'+sk.img+'" alt="" loading="lazy">':'')+'<span class="nm">'+esc2(sk.name)+'</span><span class="bo">'+esc2(sk.def?'Inicial':sk.bonus)+'</span>'+foot+'</button>'; }
function tabVisual(){ const L=skins(), mine=L.filter(s=>s.owned), sale=L.filter(s=>s.pid&&!s.owned), rest=L.filter(s=>!s.pid&&!s.owned);
  let h='<p class="s2-hint">Toque numa skin: ela aparece <b>no herói</b> na hora. A que você já tem troca no toque. Skin nunca vem de sorteio.</p>';
  if(sale.length) h+='<div class="s2-sec"><span>Compra direta</span><span>uma vez por conta</span></div><div class="s2-vg">'+sale.map(vcSkin).join('')+'</div>';
  h+='<div class="s2-sec"><span>Na coleção</span><span>'+mine.length+' de '+L.length+'</span></div><div class="s2-vg">'+mine.map(vcSkin).join('')+'</div>';
  if(rest.length) h+='<div class="s2-sec"><span>Ganhe de outro jeito</span><span>não se vendem sozinhas</span></div><div class="s2-vg">'+rest.map(vcSkin).join('')+'</div>';
  return h; }
function tabMontarias(){ const SM=shopMounts(), o=offerInfo(), W=wings(), weq=wingEq(); let h='<p class="s2-hint">Montaria à venda vem <b>inteira</b>, sem sorteio. Asas e pets não se vendem: a lista mostra de onde vêm.</p>';
  for(const q of SM){ const m=q.m, own=mountOwned(m.id), pvOk=mountCanPv(m);
    h+='<div class="s2-off" style="border-color:'+rc(m.r)+'"><div class="s2-offh">'+ico(mountIcon(m.id),m.r)+'<div class="t"><b style="color:'+rc(m.r)+'">'+esc2(q.p.name)+'</b><small style="color:var(--green)">'+esc2(mountGives(m))+'</small><small style="color:var(--muted)">Montaria '+esc2(rn(m.r))+' · uma vez por conta</small></div></div>'
      +'<div class="s2-offb" style="margin-top:8px">'+(pvOk?'<button class="s2-bt rose" data-x="pv" data-k="mount" data-id="'+esc2(m.id)+'">'+SV.eye+'Ver no herói</button>':'')+(own?tag('on','Na coleção'):buyBtn(q.p.id,q.on&&ready()&&avail(q.p.id)))+'</div></div>'; }
  if(o&&o.mount&&!SM.some(q=>q.m.id===o.mount.id)){ const m=o.mount.def, own=mountOwned(m.id), pv=!!(X.pv&&X.pv.kind==='mount'&&X.pv.id===m.id);
    h+='<button class="s2-pc'+(pv?' pv':'')+'" data-x="pv" data-k="mount" data-id="'+esc2(m.id)+'" aria-pressed="'+pv+'">'+ico(mountIcon(m.id),m.r)+'<span class="s2-pi"><span class="s2-pn">'+esc2(m.name)+' <span class="s2-rar" style="--rc:'+rc(m.r)+'">'+esc2(rn(m.r))+'</span></span><span class="s2-pg">'+esc2(mountGives(m))+'</span><span class="s2-ps">'+(own?'Na coleção':'Vem na '+esc2(o.p.name))+'</span></span>'+tag(own?'on':'off',own?'Na coleção':'Na oferta')+'</button>'; }
  if(W.length) h+='<div class="s2-sec"><span>Asas · não se vendem</span><span>toque para a prévia</span></div><div class="s2-vg">'+W.map(w=>{ const pv=!!(X.pv&&X.pv.kind==='wing'&&X.pv.id===w.id), eq=weq===w.id;
    return '<button class="s2-vc'+(eq&&!X.pv?' eq':'')+(pv?' pv':'')+'" style="--rc:'+rc(w.r)+'" data-x="pv" data-k="wing" data-id="'+esc2(w.id)+'" aria-pressed="'+pv+'" aria-label="'+esc2(w.name)+', '+esc2(rn(w.r))+'">'+(eq?'<span class="bd">Usando</span>':'')+'<span class="rt">'+esc2(rn(w.r))+'</span><img class="art" src="'+w.img+'" alt="" loading="lazy" style="padding:10%"><span class="nm">'+esc2(w.name)+'</span><span class="st '+(eq?'own':'how')+'">'+esc2(eq?'Usando':w.how)+'</span></button>'; }).join('')+'</div>';
  h+='<div class="s2-sec"><span>Pets · não se vendem</span><span></span></div><div class="s2-pc">'+ico('',2,SV.paw(30))+'<div class="s2-pi"><span class="s2-pn">Pets vêm jogando</span><span class="s2-ps">Dos ovos e das atividades do jogo, nunca da Loja. Seu pet fica sempre na frente do herói.</span></div><button class="s2-bt blue" data-x="go" data-to="pets">Ver'+SV.go+'</button></div>';
  return h; }
function perkRows(L){ const me=vipP().level, I=vipInfo(L), I0=vipInfo(0), mx=vipMax(); if(!I||!I0) return '';
  const first=fn=>{ for(let i=1;i<=mx;i++){ const x=vipInfo(i); if(x&&fn(x)) return i; } return 0; };
  const pill=need=>L>=need?'<span class="s2-pill on">'+(me>=need?'Liberado':'No VIP '+L)+'</span>':'<span class="s2-pill off">VIP '+need+'</span>';
  const row=(name,val,need,sub)=>need?'<div class="s2-pk"><span>'+esc2(name)+(sub?'<small>'+esc2(sub)+'</small>':'')+'</span>'+(val!=null?'<em>'+(L>=need?esc2(val):'-')+'</em>':'')+pill(need)+'</div>':'';
  let spd=''; try{ const SP=Sys.vip.DATA.speeds, l2=(SP[1].rules.find(r=>r.level&&!r.spd)||{}).level, l4=(SP[2].rules[0]||{}).level, s4=SP[2].speed, s2=SP[1].speed;
    spd=I.speedTier>=2?'x'+s2+' já · x'+s4+' no nível '+l4:I.speedTier>=1?'x'+s2+' já':'x'+s2+' no nível '+l2; }catch(e){ spd=''; }
  /* ouro e XP separados (Sys.vip: goldPct e xpPct; com a curva v9 do Sys.level o XP é o da coluna xp9); módulo antigo sem os campos = goldXpPct nos dois */
  const gp=x=>+(x.goldPct!=null?x.goldPct:x.goldXpPct)||0, xp=x=>{ try{ const Lv=Sys.level, T=Sys.vip.DATA.table; if(Lv&&Lv.DATA&&Lv.DATA.v9&&Lv.DATA.v9.on===true&&Array.isArray(T.xp9)) return +T.xp9[x.level]||0; }catch(e){} return +(x.xpPct!=null?x.xpPct:x.goldXpPct)||0; };
  const fv=x=>x.frameVip|0, fN=first(x=>fv(x)>0)||first(x=>x.frame);
  let h=row('ATQ e VIDA','+'+num(I.atkPct)+'%',first(x=>x.atkPct>0),'Poder do VIP')+row('Ouro','+'+num(gp(I))+'%',first(x=>gp(x)>0),'')+row('XP','+'+num(xp(I))+'%',first(x=>xp(x)>0),'')
    +(spd?row('Velocidade da batalha',spd,first(x=>x.speedTier>I0.speedTier),''):'')
    +row('Entradas de instância por área','+'+n0(I.keys),first(x=>x.keys>I0.keys),'')
    +row('Baús por dia',n0(I.chestPerDay),first(x=>x.chestPerDay>I0.chestPerDay),'Grátis: '+n0(I0.chestPerDay))
    +row('XP, itens, pedras e ração offline','x'+num(I.offlineMult),first(x=>x.offlineMult>I0.offlineMult),'Grátis: x'+num(I0.offlineMult)+'. Não vale para o ouro');
  try{ if(Sys.vip.DATA.convOn===true) for(const c of Sys.vip.convTable()||[]){ const v=c.values?c.values[L]:null;
      h+=row(c.name,v==null?null:(c.id==='offlineH'?n0(v)+' h':'+'+n0(v)+(c.unit||'')),c.vip,'Grátis: '+c.free); } }catch(e){}
  h+=row('Moldura VIP no perfil',fv(I)>0?'VIP '+n0(fv(I)):null,fN,fv(I)>0?'Uma moldura por nível de VIP':'')+row('Aura VIP',null,first(x=>x.aura),'');
  return h; }
function tabVip(){ const v=vipP(), mx=vipMax(), on=ready(); if(X.vl==null||X.vl<1||X.vl>mx) X.vl=Math.min(mx,Math.max(1,v.level)); const L=X.vl;
  let h='<div class="s2-vipc"><div class="s2-viph">'+SV.crown(48)+'<div class="t"><div class="big">VIP '+v.level+'</div><small>'+(v.max?'Nível máximo':'<b>'+n0(v.points)+'</b> de <b>'+n0(v.needTotal)+'</b> pontos para o VIP '+v.next)+'</small>'
    +'<small>'+(on?'Cada real gasto vira 1 ponto VIP, em qualquer compra da Loja':'Os pontos VIP vêm das compras da Loja. '+SOON_MSG)+'</small></div></div><span class="s2-bar"><i style="width:'+(v.frac*100).toFixed(1)+'%"></i></span></div>';
  h+='<p class="s2-hint">O VIP não se compra separado nem com diamantes: sobe sozinho com os pontos. <b>Nada é sorteado.</b> Escolha um nível para ver o que ele dá:</p>';
  h+='<div class="s2-lvls" role="group" aria-label="Nível de VIP">'+Array.from({length:mx},(_,i)=>i+1).map(i=>'<button class="s2-lv'+(i<=v.level?' got':'')+(i===v.level?' me':'')+'" data-x="vl" data-v="'+i+'" aria-pressed="'+(L===i)+'" aria-label="VIP '+i+', a partir de '+n0(vipPts(i))+' pontos">'+i+'</button>').join('')+'</div>';
  const PZ=vipPrizes(); if(PZ.length){ h+='<div class="s2-sec"><span>Prêmios de nível · uma vez</span><span></span></div>';
    for(const p of PZ){ const k=p.kind==='skin'?fixedDef(p.id):null, canPv=p.kind==='skin'&&k&&k.art!==false&&skinsOn();
      h+='<div class="s2-pk">'+(p.img?'<img src="'+p.img+'" alt="">':SV.paw(30))+'<span>'+esc2(p.name)+'<small>'+esc2(p.sub)+(p.soon?' · arte em breve':'')+'</small></span>'
        +(canPv?'<button class="s2-bt rose" data-x="pv" data-k="skin" data-id="'+esc2(p.id)+'" style="min-width:0">'+SV.eye+'Prévia</button>':'')+'<span class="s2-pill '+(v.level>=p.lv?'on':'off')+'">'+(v.level>=p.lv?'Liberado':'VIP '+p.lv)+'</span></div>'; } }
  h+='<div class="s2-sec"><span>Vantagens no VIP '+L+'</span><span>'+(L<=v.level?'<b>você tem</b>':'faltam '+n0(Math.max(0,vipPts(L)-v.points))+' pontos')+'</span></div>'+perkRows(L);
  h+='<button class="s2-bt off s2-wide" data-x="go" data-to="vip" style="margin-top:4px">Abrir a tela do VIP'+SV.go+'</button>';
  return h; }
function tabPasse(){ const P=passInfo(); if(!P||!P.p) return '<p class="s2-hint">O Passe aparece aqui quando estiver disponível.</p>';
  const sk=P.skin, canPv=!!(sk&&sk.art!==false);
  let h='<div class="s2-off"><div class="s2-offh">'+im(UI_PASS,40)+'<div class="t"><b>'+esc2(P.p.name)+'</b><small style="color:var(--muted)">Temporada de '+n0(P.days)+' dias · '+n0(P.tiers)+' níveis</small></div>'+(P.premium?'<span class="s2-pill on">Ativo</span>':'')+'</div><ul class="s2-ben">'
    +(P.xp?'<li><b>+'+num(P.xp)+'% XP</b> do Passe</li>':'')+(P.premGems?'<li>Trilha premium: <b>'+n0(P.premGems)+' diamantes</b> e peças da temporada</li>':'')
    +(sk?'<li>No nível '+n0(P.tiers)+': skin <b>'+esc2(sk.name)+'</b> ('+esc2(rn(sk.r))+')</li>':'')+(P.freeGems?'<li>A trilha grátis continua: '+n0(P.freeGems)+' diamantes</li>':'')+'</ul>'
    +'<div class="s2-offb">'+(canPv?'<button class="s2-bt rose" data-x="pv" data-k="skin" data-id="'+esc2(sk.id)+'">'+SV.eye+'Ver a skin no herói</button>':'')+(P.premium?tag('on','Ativo nesta temporada'):buyBtn(P.p.id,ready()))+'</div></div>';
  h+='<p class="s2-hint">'+(P.p.oncePerSeason?'Uma compra por temporada; vale só para a temporada atual. ':'')+'Diamantes não compram o Passe.</p>';
  h+='<button class="s2-bt off s2-wide" data-x="go" data-to="pass">Abrir o Passe'+SV.go+'</button>';
  return h; }
function tabOuro(){ const L=offers();
  return '<div class="s2-sec"><span>Ofertas do dia</span><span>renova à meia-noite</span></div><p class="s2-hint">Itens inteiros da sua era, pagos com <b>ouro do jogo</b>. Você vê a peça antes: nada é sorteado.</p>'
    +(L.length?'<div class="s2-og">'+L.map(goldCell).join('')+'</div>':'<p class="s2-hint">O estoque de hoje ainda não chegou.</p>'); }
const BODY={ofertas:tabOfertas,gemas:tabGemas,visual:tabVisual,montarias:tabMontarias,vip:tabVip,passe:tabPasse,ouro:tabOuro};

/* ----- folhas (dentro da tela): compra com dinheiro, compra concluída e compra com ouro ----- */
function prodIcon(p){ if(p.kind==='gems') return ico(UI_GEM,1); if(p.kind==='monthly_card') return ico(UI_GEM,3); if(p.kind==='pass_premium') return ico(UI_PASS,4); if(p.kind==='offer') return ico('',4,SV.gift(30));
  if(p.kind==='mount'){ const m=mountDef(p.mountId); return ico(mountIcon(p.mountId),m?m.r:4); } const k=fixedDef(p.skinId); return ico(k&&k.avatar?avatarUrl(k.avatar):'',k?k.r:3); }
const prodKind=p=>p.once?'Uma vez por conta':p.oncePerSeason?'Uma vez por temporada':p.kind==='monthly_card'?n0(p.days)+' dias':'Pacote de diamantes';
function gainsOf(p){ const g=[];
  if(p.kind==='gems'){ g.push(n0(p.gems)+' diamantes'); if(p.firstDouble) g.push('Na 1ª compra deste pacote: '+n0(p.gems*2)); }
  else if(p.kind==='monthly_card'){ g.push(n0(p.gems)+' diamantes agora'); g.push(n0(p.daily)+' por dia por '+n0(p.days)+' dias'); }
  else if(p.kind==='pass_premium'){ const P=passInfo(); g.push('Trilha premium da temporada'); if(P&&P.xp) g.push('+'+num(P.xp)+'% XP do Passe'); if(P&&P.skin) g.push('Skin '+P.skin.name+' no nível '+P.tiers); }
  else if(p.kind==='offer'){ const o=offerInfo(); if(o) for(const i of o.items) g.push(i.t); }
  else if(p.kind==='mount'){ const m=mountDef(p.mountId); if(m){ g.push(m.name+', inteira'); g.push(mountGives(m)); } }
  else if(p.kind==='skin'){ const sk=skins().find(s=>s.id===p.skinId), k=fixedDef(p.skinId); g.push('Skin '+(k?k.name:p.name)); if(sk) g.push(skinBonus(sk)); }
  return g.filter(Boolean); }
const gainHtml=g=>'<div class="s2-gain">'+g.map(t=>'<span>'+esc2(t)+'</span>').join('')+'</div>';
function sheetHtml(){ const s=X.sheet; if(!s) return ''; let inner='', label='';
  if(s.k==='buy'){ const p=prod(s.id); if(!p) return ''; label='Confirmar compra';
    inner='<h3>Confirmar compra</h3><div class="s2-mi">'+prodIcon(p)+'<div class="s2-di"><div class="s2-dn">'+esc2(p.name)+'</div><div class="s2-dh">'+esc2(prodKind(p))+'</div></div></div><p>Você recebe:</p>'+gainHtml(gainsOf(p))
      +'<div class="s2-prow"><span>Preço</span><b>'+esc2(price(p.id))+'</b></div>'
      +'<div class="s2-note">'+SV.info+'<span>'+(simul()?'Modo dono: compra simulada. Nada é cobrado e nenhum dado de pagamento é pedido.':'A cobrança abre na tela do Google Play. Nenhum dado de pagamento é pedido aqui.')+'</span></div>'
      +'<div class="s2-macts"><button class="s2-bt off" data-x="sclose" style="flex:.7 1 0">Cancelar</button><button class="s2-bt" data-x="buyok" data-id="'+esc2(p.id)+'" aria-disabled="'+X.busy+'">'+(X.busy?'Aguarde...':'Comprar')+'</button></div>'; }
  else if(s.k==='done'){ const p=prod(s.id); if(!p) return ''; label='Compra concluída'; const sk=p.kind==='skin'?skins().find(q=>q.id===p.skinId&&q.owned&&q.art&&!q.eq):null;
    inner='<div class="s2-okc">'+SV.check+'</div><h3 style="text-align:center">Compra concluída</h3><p style="text-align:center">'+esc2(p.name)+(s.sim?' · compra simulada, nada foi cobrado':'')+'</p>'+gainHtml(s.gains||[])
      +'<div class="s2-macts">'+(sk?'<button class="s2-bt blue" data-x="equip" data-id="'+esc2(sk.id)+'">Usar agora</button>':'')+'<button class="s2-bt'+(sk?' off':'')+'" data-x="sclose">Fechar</button></div>'; }
  else if(s.k==='gold'){ const o=offers()[s.i]; if(!o||o.sold) return ''; const it=gItem(o), have=+S.gold||0; label='Comprar com ouro';
    inner='<h3>Comprar com ouro</h3><div class="s2-mi" style="--rc:'+rc(o.r)+'">'+ico(gIcon(it,52),o.r)+'<div class="s2-di"><div class="s2-dn">'+esc2(gName(it))+'</div><div class="s2-rar">'+esc2(rn(o.r))+' · '+esc2(slotN(o.slot))+' · '+esc2(eraName(o.e|0))+'</div>'
      +'<div class="s2-dh">'+gLines(it).map(esc2).join(' · ')+'</div></div></div><p>A peça inteira vai para a mochila. Nada é sorteado.</p>'
      +'<div class="s2-prow"><span>Preço</span><b>'+im(UI_COIN,24)+n0(o.price)+'</b></div><div class="s2-prow" style="margin-top:6px;padding-top:6px;border-top:0"><span>Seu ouro</span><em>'+esc2(kf(have))+' → '+esc2(kf(Math.max(0,have-o.price)))+'</em></div>'
      +'<div class="s2-note">'+SV.info+'<span>Pago com o ouro do jogo. Não usa dinheiro e não dá ponto VIP.</span></div>'
      +'<div class="s2-macts"><button class="s2-bt off" data-x="sclose" style="flex:.7 1 0">Cancelar</button><button class="s2-bt" data-x="goldok" data-i="'+s.i+'">Comprar</button></div>'; }
  if(!inner) return '';
  return '<div class="s2-shade"><div class="s2-sheet" role="dialog" aria-modal="true" aria-label="'+label+'">'+inner+'</div></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240), Hh=+d.H||0, SH=Hh&&Hh<600?170:216;
  if(!BODY[X.tab]) X.tab='ofertas'; if(!gemOk()) X.tab='ouro';
  if(X.sheet&&!sheetHtml()) X.sheet=null;
  let y0=0; try{ const sc0=X.top?null:document.getElementById('s2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  X.look=lookNow();
  const body=BODY[X.tab]();
  V.innerHTML=xWrap(d,'','<div class="s2'+(X.anim?' s2-in':'')+'"><div class="s2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.45,0.92):'#16110d')+'"></div>'
    +stageHtml(SH)+vipBarHtml()+tabsHtml()
    +'<div id="s2_scroll" class="s2-scroll x-scroll" role="tabpanel" aria-label="'+esc2((TABS.find(t=>t[0]===X.tab)||['',''])[1])+'">'+detHtml()+body+'</div>'
    +'<div id="s2_toast">'+(X.toast&&now()-X.toastT<2000?toastHtml(X.toast):'')+'</div>'+sheetHtml()+'</div>');
  if(y0){ try{ const sc=document.getElementById('s2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (ouro e diamantes caindo da batalha, virada do dia, VIP, chave da compra): o tick redesenha só quando muda */
function sig(){ try{ const L=(S.shop&&S.shop.offers)||[], g=+S.gold||0;
    return [X.tab,hero(),S.shop&&S.shop.date,typeof todayKey==='function'?todayKey():'',L.map(o=>(o.sold?'s':g>=o.price?'1':'0')).join(''),kf(g),S.gems|0,vipP().level,vipP().points,ready()?1:0,gemOk()?1:0].join('|'); }catch(e){ return ''; } }

/* ================= ações ================= */
function equipSkin(id){ const L=skins(), sk=L.find(s=>s.id===id); if(!sk){ redraw(); return; }
  if(!sk.owned){ sfx('ui_tap'); say('Você ainda não tem esta skin'); return; }
  let r=null; try{ r=AP().equipFixed(S,sk.def?null:sk.id); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='art'?'Esta skin já é sua: a arte chega em breve':'Não deu para usar esta skin agora'); return; }
  X.pv=null; X.sel={kind:'skin',id:sk.id}; if(X.sheet&&X.sheet.k==='done') X.sheet=null; changed(); sfx('upgrade'); redraw(); say(sk.name+' equipada'); }
function preview(kind,id){ sfx('ui_tap');
  if(kind==='offer'){ if(!offerInfo()) return; X.pv=X.pv&&X.pv.kind==='offer'?null:{kind:'offer',id:'offer'}; X.sel=null; redraw(); return; }
  if(kind==='skin'){ const sk=skins().find(s=>s.id===id); if(!sk) return;
    if(sk.owned){ if(sk.eq){ X.pv=null; X.sel={kind,id}; redraw(); } else equipSkin(id); return; }   /* a que você já tem troca no toque */
    if(!sk.art){ X.pv=null; X.sel={kind,id}; redraw(); say('Prévia em breve: a arte desta skin ainda não chegou'); return; } }
  else if(kind==='mount'){ const m=mountDef(id); if(!m) return; if(!mountCanPv(m)){ X.pv=null; X.sel={kind,id}; redraw(); say('Prévia em breve: a arte montada ainda não chegou'); return; } }
  else if(kind==='wing'){ if(!wings().some(w=>w.id===id)) return; }
  else return;
  if(X.pv&&X.pv.kind===kind&&X.pv.id===id){ X.pv=null; X.sel=null; } else { X.pv={kind,id}; X.sel=null; }
  redraw(); }
/* compra com dinheiro: a folha só abre com a compra real ligada (Sys.buy.ready()); senão avisa "em breve" e nada muda */
function whyNot(p){ if(!ready()) return SOON_MSG;
  if(p.kind==='offer'){ const o=offerInfo(); return o&&o.can?'':o&&o.claimed?'Você já tem: '+p.name:'Esta oferta não está disponível'; }
  if(p.kind==='pass_premium'){ const P=passInfo(); return P&&P.premium?'O Passe já está ativo nesta temporada':''; }
  if(p.kind==='monthly_card'){ const st=X.card.st; return st&&st.active?'O Cartão Mensal já está ativo':''; }
  if(p.kind==='skin'||p.kind==='mount') return avail(p.id)?'':((p.kind==='skin'?skins().some(s=>s.id===p.skinId&&s.owned):mountOwned(p.mountId))?'Você já tem: '+p.name:SOON+': '+p.name);
  return ''; }
function askBuy(id){ const p=prod(id); sfx('ui_tap'); if(!p) return; const why=whyNot(p); if(why){ say(why); return; } X.sheet={k:'buy',id:p.id}; redraw(); }
function buyMsg(r,p){ const w=r&&r.reason; return w==='cancelled'?'Compra cancelada':w==='soon'?SOON_MSG:w==='owned'?'Você já tem: '+p.name:w==='pending'?'Pagamento pendente: a entrega chega quando for aprovado'
  :w==='offline'?'Sem conexão: tente de novo':w==='not_eligible'?'Esta oferta era só para a 1ª compra':'Compra não concluída'; }
function doBuy(id){ const p=prod(id); if(!p||X.busy) return; const why=whyNot(p); if(why){ X.sheet=null; redraw(); say(why); return; }
  const gains=gainsOf(p), sim=simul(); X.busy=true; redraw();
  const fin=r=>{ X.busy=false; if(r&&r.ok){ let g=0; try{ for(const a of r.applied||[]) for(const x of (a&&a.got)||[]) if(x&&x.kind==='gems'&&x.n>0) g+=x.n; }catch(e){}
      if(p.kind==='gems'&&g>0) gains[0]=n0(g)+' diamantes'; if(p.kind==='monthly_card'){ X.card.st=null; X.card.at=0; }
      changed(); sfx('gem'); X.pv=null; X.sheet={k:'done',id:p.id,gains:p.kind==='gems'?gains.slice(0,1):gains,sim:sim}; redraw(); }
    else { X.sheet=null; sfx('ui_tap'); redraw(); say(buyMsg(r,p)); } };
  try{ Promise.resolve(Sys.buy.purchase(S,Sys.host,p.id)).then(fin,()=>fin(null)); }catch(e){ fin(null); } }
function claimCard(){ const C=X.card; sfx('ui_tap'); if(C.claim) return; if(!ready()){ say(SOON_MSG); return; } if(C.st&&C.st.claimedToday){ say('Já resgatado hoje: volte amanhã'); return; }
  C.claim=true; redraw();
  const fin=r=>{ C.claim=false; const cur=C.st&&!C.st.err?C.st:null; let msg;
    if(r&&r.ok){ if(cur) cur.claimedToday=true; changed(); sfx('gem'); msg='Cartão Mensal: +'+n0(r.gems||0)+' diamantes de hoje'; }
    else { const w=r&&r.reason; if(w==='claimed'&&cur) cur.claimedToday=true; if(w==='no_card'&&cur) cur.active=false;
      msg=w==='claimed'?'Já resgatado hoje: volte amanhã':w==='no_card'?'O Cartão Mensal não está ativo':w==='soon'?SOON_MSG:w==='offline'?'Sem conexão: tente de novo':'Não deu para resgatar agora'; }
    C.at=0; redraw(); say(msg); };
  try{ Promise.resolve(Sys.buy.cardClaim(S,Sys.host)).then(fin,()=>fin(null)); }catch(e){ fin(null); } }
/* compra com OURO do estoque do dia: a mesma receita da Loja de hoje (js/screens.js): tira o ouro, marca vendido e entrega por addItemToBag */
function askGold(i){ const o=offers()[i]; sfx('ui_tap'); if(!o) return;
  if(o.sold){ say('Já comprado hoje. Repõe à meia-noite'); return; } if((+S.gold||0)<o.price){ say(lackGold(o.price)); return; }
  X.sheet={k:'gold',i:i}; redraw(); }
function doGold(i){ const o=offers()[i]; if(!o||o.sold){ X.sheet=null; redraw(); return; }
  if((+S.gold||0)<o.price){ X.sheet=null; redraw(); say(lackGold(o.price)); return; }
  if(bagFull()){ X.sheet=null; redraw(); say('Mochila cheia: desmonte itens no Equipamento'); return; }
  if(typeof addItemToBag!=='function'){ X.sheet=null; redraw(); say('Não deu para comprar agora'); return; }
  const nm=gName(gItem(o)); let got=null, hadP=false; try{ hadP=typeof PULLING!=='undefined'; }catch(e){ hadP=false; }
  S.gold-=o.price; o.sold=true; X.sheet=null;
  if(hadP){ const was=PULLING; PULLING=[]; try{ addItemToBag({slot:o.slot,r:o.r,e:o.e,subs:o.subs,origin:'shop'}); got=PULLING[0]||null; } finally{ PULLING=was; } }
  else addItemToBag({slot:o.slot,r:o.r,e:o.e,subs:o.subs,origin:'shop'});
  changed(); sfx('coin'); redraw();
  say(got&&got.dism?'Comprado: '+(got.name||nm)+' (desmontado pela sua regra de desmonte)':got&&got.eq?'Comprado e equipado: '+(got.name||nm):'Comprado: '+((got&&got.name)||nm)+' (na mochila)'); }
/* outras telas: o Passe (tela do jogo) e os painéis VIP e Pets; quem não abre avisa */
function goTo(to){ sfx('ui_tap'); let ok=false;
  if(to==='pass'){ try{ if(typeof xUnlocked==='function'&&!xUnlocked('pass')){ say('O Passe libera no nível '+(typeof xUnlockLv==='function'?xUnlockLv('pass'):'')); return; } if(typeof setView==='function'){ setView('pass'); ok=true; } }catch(e){ ok=false; } }
  else if(to==='vip'||to==='pets'){ try{ ok=!!(window.Panels&&Panels.open(to,{from:'shop2'})); }catch(e){ ok=false; } }
  if(!ok) say('Esta tela ainda não abre daqui'); }

function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{};
  if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; }
  if(X.busy) return;                                       /* compra em curso: o resto espera a resposta */
  if(a==='sclose'){ sfx('ui_tap'); X.sheet=null; redraw(); return; }
  if(a==='buyok'){ doBuy(String(ds.id||'')); return; }
  if(a==='goldok'){ doGold(+ds.i); return; }
  if(a==='equip'){ equipSkin(String(ds.id||'')); return; }
  if(X.sheet) return;                                      /* folha aberta: só os botões dela */
  if(a==='tab'){ const t=BODY[ds.t]?ds.t:'ofertas'; sfx('ui_tap'); if(!gemOk()&&t!=='ouro'){ say('Libera no nível '+gemLv()+'. Até lá, a aba Ouro está aberta.'); return; } if(t===X.tab) return; X.tab=t; X.sel=null; X.top=true; redraw(); }
  else if(a==='pv') preview(String(ds.k||''),String(ds.id||''));
  else if(a==='pvout'){ sfx('ui_tap'); X.pv=null; X.sel=null; redraw(); }
  else if(a==='buy') askBuy(String(ds.id||''));
  else if(a==='gold') askGold(+ds.i);
  else if(a==='claim') claimCard();
  else if(a==='cardretry'){ sfx('ui_tap'); X.card.st=null; X.card.at=0; redraw(); }
  else if(a==='vl'){ const v=+ds.v|0; sfx('ui_tap'); if(v>=1&&v<=vipMax()&&v!==X.vl){ X.vl=v; redraw(); } }
  else if(a==='go') goTo(String(ds.to||''));
}

const def=Panels.add('shop2',{title:'Loja',render:draw,click:click,actions:ACTIONS,
  tick(){ if(X.busy||X.sheet||X.card.claim) return; if(X.sig&&isOn()&&sig()!==X.sig) redraw(); },
  busy(){ return X.busy; },
  onOpen(o){ X.anim=true; X.top=true; X.pv=null; X.sel=null; X.sheet=null; X.busy=false; X.toast=''; X.t0=0; X.vl=null; X.card.at=0;
    X.tab=o&&BODY[o.tab]?o.tab:'ofertas'; },
  onClose(){ X.pv=null; X.sel=null; X.sheet=null; X.busy=false; X.toast='';
    try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Shop2={X:X,actions:ACTIONS,def:def};
})();
