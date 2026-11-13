'use strict';
/* ================= FORJA V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.forge2) =================
   Protótipo: docs/proto/v2/Forja.html · passagem: docs/proto/v2/PASSAGEM.md (seções 0 e 3). Não substitui o js/p_forge.js: é outra tela ('forge2').
   NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - Forja (+N do ESPAÇO, chance, garantia, pedras, ouro por tentativa, teto da era, auras, +16 a +20 quando o módulo ligar): Sys.forge
     (DATA, ensure, level, chance, canTry, attempt, worstTries, capOf, aura, forge20On);
   - FC antes e depois: Sys.fc (compute, viewText, delta, measure, itemFC);
   - Transformar: Sys.stats.canTransform / transform (o custo e a cobrança são do Sys.loot.transformCost / payTransform) e Sys.loot.essence;
   - Fundir: Sys.stats.canFuse / fuse / qpOf / qualityStars / qualityMult. A aba só existe com Sys.stats.DATA.quality.on === true;
   - asa: Sys.stats.slotOpen('wing', nível) · portão da tela: Sys.level.isUnlocked(S,'forge').
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói com a arma NA MÃO, a asa e o PET POR ÚLTIMO (na frente). A pé (mount:false), como no protótipo.
   A AURA DA ARMA é desenhada por código neste arquivo, atrás e na frente do herói, pela faixa que o Sys.forge.DATA.auras informa (cor e +N do módulo):
   luz no chão, clarão, fumaça, chamas, raios girando, faíscas e relâmpagos; dentro da faixa cada +1 deixa a aura um pouco mais forte.
   O arquivo roda em escopo próprio (nenhum nome daqui chega às outras telas). Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('forge2' in PANEL_ON)) PANEL_ON.forge2=false;

const X={tab:'forge',slot:'weapon',apv:null,busy:false,auto:null,fx:null,ban:null,fly:null,toast:'',toastT:0,
  tsel:null,ask:null,gkey:null,sig:'',anim:true,top:true,t1:0,raf:0,t0:0};
const ACTIONS=['tab','slot','forge','auto','aura','pvout','tsel','trans','transok','askno','gsel','fuse','back'];
const BAN_MS=2400;

/* ---------- leituras dos módulos ---------- */
const FD=()=>Sys.forge.DATA;
const now=()=>Date.now();
const isOn=()=>typeof view!=='undefined'&&view==='forge2';
const redraw=()=>{ if(isOn()&&typeof render==='function') render(); };
const call=(fn,a,b)=>{ try{ if(typeof fn==='function') return fn(a,b); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const lvl=sl=>Sys.forge.level(S,sl);
const stonesNow=()=>Sys.forge.ensure(S).stones;
const pityOf=sl=>Sys.forge.ensure(S).pity[sl]||0;
const capNow=()=>Sys.forge.capOf(Sys.host);
const bonusOf=n=>{ const b=FD().bonus; return b[Math.max(0,Math.min(b.length-1,n|0))]||0; };
const f20=()=>{ try{ return Sys.forge.forge20On()===true; }catch(e){ return false; } };
const auras=()=>FD().auras;
const tierOf=n=>{ const A=auras(); let t=0; for(let i=0;i<A.length;i++) if(n>=A[i].from) t=i; return t; };
const auraOf=n=>auras()[tierOf(n)];
const acol=a=>(a&&a.col)||'#55608f';
const slotOk=sl=>FD().slots.indexOf(sl)>=0;
const slotName=sl=>FD().slotName[sl]||sl;
const slotShort=sl=>String(slotName(sl)).split('/')[0];
const wingOpen=()=>{ try{ return Sys.stats.slotOpen('wing',plv()); }catch(e){ return true; } };
const wingLv=()=>{ try{ return Sys.stats.DATA.wing.minLevel; }catch(e){ return 1; } };
const wingShut=sl=>sl==='wing'&&!wingOpen();
const locked=()=>{ try{ return !!(Sys.level&&Sys.level.isUnlocked&&!Sys.level.isUnlocked(S,'forge')); }catch(e){ return false; } };
const gateLv=()=>{ try{ return Sys.level.unlockLevel('forge'); }catch(e){ return 1; } };
const eraNow=()=>{ try{ return Math.max(0,Sys.host.eraMax()|0); }catch(e){ return 0; } };
const eraName=e=>(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n)||('Era '+(e+1));
const heroName=()=>{ try{ return S.hero==='kaia'?'Kaia':'Kael'; }catch(e){ return 'Kael'; } };
const byId=id=>(S.inv||[]).find(i=>i&&String(i.id)===String(id))||null;
const eqOf=sl=>{ try{ return S.eq&&S.eq[sl]!=null?byId(S.eq[sl]):null; }catch(e){ return null; } };
const isEq=it=>!!it&&!!S.eq&&S.eq[it.slot]===it.id;
const rcol=it=>RC[Math.max(0,Math.min(RC.length-1,(it&&it.r)|0))];
const rname=it=>{ try{ return RN(it.r)||''; }catch(e){ return ''; } };
const iName=it=>{ try{ return iname(it); }catch(e){ return slotName(it.slot); } };
const icoOf=(sl,it,px)=>{ try{ if(it){ const u=slotIcon(sl,ieraV(it)); return typeof xRarIco==='function'?xRarIco(u,it.r,px):u; } return ICON[sl]||ICON.armor||''; }catch(e){ return ''; } };
const fcNow=()=>{ try{ return Sys.fc.compute(S,Sys.host); }catch(e){ return 0; } };
const fcTxt=v=>{ try{ return Sys.fc.viewText(v); }catch(e){ return String(Math.round(v)); } };
const fcDelta=(a,b)=>{ try{ return Sys.fc.delta(a,b); }catch(e){ return {text:'',color:'#9aa6d6',diff:b-a}; } };
/* FC com o +1 do espaço: o Sys.fc não tem opção de prévia da Forja, então o nível do espaço sobe 1 só durante esta conta e volta em seguida */
function fcAfterForge(sl){ const n=Sys.forge.ensure(S).lv[sl]; try{ Sys.forge.ensure(S).lv[sl]=n+1; return Sys.fc.compute(S,Sys.host); }catch(e){ return fcNow(); } finally{ Sys.forge.ensure(S).lv[sl]=n; } }
const pc=v=>String(Math.round(v*10)/10).replace('.',',')+'%';
const pctB=b=>'+'+Math.round(b*100)+'%';
const pl=(n,a,b)=>n0(n)+' '+(n===1?a:b);
const reduced=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
const essence=()=>{ try{ return Sys.loot.essence(S); }catch(e){ return 0; } };
const canGold=g=>{ try{ return typeof Sys.host.canSpendGold==='function'?!!Sys.host.canSpendGold(g):(S.gold>=g); }catch(e){ return false; } };
const lackGold=g=>{ try{ return typeof needMsg==='function'?needMsg('gold',g):'Falta ouro'; }catch(e){ return 'Falta ouro'; } };
const Q=()=>Sys.stats.DATA.quality;
const qOn=()=>{ try{ return Q().on===true; }catch(e){ return false; } };

/* ---------- desenhos pequenos (sem emoji) ---------- */
const SV={
  go:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9aa6d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  goG:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#5ef0a0" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="10" height="10" fill="#c9d0f5" aria-hidden="true"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"/></svg>',
  hammer:'<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M14 4l6 6-3 3-6-6zM11 7l-8 8 3 3 8-8"/></svg>',
  stone:'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style="flex:none"><path d="M4 16l4-9 8-2 5 6-2 7-9 2z" fill="#ff9a3a" stroke="#6a2a08" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 7l4 5 9-1M12 12l-2 8" fill="none" stroke="#6a2a08" stroke-width="1.2"/></svg>',
  gem:'<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" style="flex:none"><path d="M12 2l8 7-8 13L4 9z" fill="#a97bff" stroke="#3a1f78" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 9h16M12 2l-3 7 3 13 3-13z" fill="none" stroke="#3a1f78" stroke-width="1.2"/></svg>',
  star:on=>'<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="'+(on?'#ffd25e':'#2b3260')+'" stroke="'+(on?'#9a5a10':'#454e86')+'" stroke-width="1.4" stroke-linejoin="round"/></svg>'
};
const starsH=s=>{ let M=5; try{ M=Q().stars.length; }catch(e){} let h=''; for(let i=0;i<M;i++) h+=SV.star(i<s); return '<span class="f2-stars" role="img" aria-label="'+s+' de '+M+' estrelas">'+h+'</span>'; };

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.f2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--violet:#a97bff;--rose:#ff6b9a;--green:#5ef0a0;--red:#ff6b6b;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.f2 *{box-sizing:border-box}
.f2 button{color:inherit;font-family:inherit;cursor:pointer}
.f2-in{animation:f2-fade .22s ease-out}
.f2-bg{position:absolute;left:0;right:0;top:0;height:380px;pointer-events:none;background:radial-gradient(110% 46% at 50% 30%,rgba(255,150,70,.22),transparent 62%),radial-gradient(70% 30% at 50% 58%,rgba(120,90,255,.18),transparent 70%),linear-gradient(180deg,#1a1440 0%,#141a4c 40%,var(--night) 100%)}
.f2-stage{position:relative;z-index:2;flex:none}
.f2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:24px;max-width:calc(100% - 128px);padding:3px 10px;border-radius:12px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;line-height:1.15}
.f2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.f2-who span{min-width:0;white-space:normal;overflow-wrap:anywhere;text-align:center}
button.f2-who{min-height:40px;top:0;border-color:var(--gold);color:var(--gold);background:linear-gradient(90deg,rgba(255,210,94,.3),rgba(255,164,52,.22))}
button.f2-who i{background:var(--gold);box-shadow:0 0 8px var(--gold)}
button.f2-who u{flex:none;text-decoration:none;height:22px;line-height:22px;padding:0 9px;border-radius:11px;background:var(--gold);color:var(--ink);font-size:11px}
.f2-slot{position:absolute;z-index:3;width:54px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:0;background:none;padding:0}
.f2-slot .sb{position:relative;border-radius:13px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);overflow:hidden;display:block}
.f2-slot .sb img{position:absolute;left:8%;top:8%;width:84%;height:84%;object-fit:contain}
.f2-slot .fg{position:absolute;right:1px;top:1px;padding:0 4px;border-radius:6px;background:rgba(5,8,28,.88);color:var(--gold);font-size:10px;font-weight:900;line-height:14px}
.f2-slot .fg.cp{color:var(--muted)}
.f2-slot .lk{position:absolute;right:2px;top:2px;width:16px;height:16px;border-radius:5px;background:rgba(5,8,28,.85);display:grid;place-items:center}
.f2-slot.lock .sb img{filter:grayscale(.85) brightness(.5)}
.f2-slot .sl{font-size:9px;font-weight:900;color:var(--muted);text-shadow:0 1px 0 #000;white-space:normal;overflow-wrap:anywhere;text-align:center;line-height:1;max-width:54px}
.f2-slot.on .sb{box-shadow:0 0 0 3px var(--gold),0 0 16px rgba(255,210,94,.6)}
.f2-slot.on .sl{color:var(--gold)}
.f2-fcrow{position:relative;z-index:3;flex:none;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;margin:2px 12px 0;padding:4px 8px 4px 12px;border-radius:16px;background:linear-gradient(90deg,rgba(255,210,94,.16),rgba(10,14,44,.85) 60%);border:1px solid rgba(255,210,94,.5)}
.f2-fcb{flex:1 1 96px;min-width:0}
.f2-fcb small{display:block;font-size:9px;letter-spacing:1.2px;color:var(--gold);font-weight:900}
.f2-fcb b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:26px;line-height:1;color:var(--gold);text-shadow:0 0 14px rgba(255,210,94,.55),0 2px 0 rgba(0,0,0,.4);white-space:normal;overflow-wrap:anywhere}
.f2-fcb em{display:block;font-style:normal;font-size:10px;font-weight:800;color:var(--muted);line-height:1.15;white-space:normal;overflow-wrap:anywhere}
.f2-chip{flex:0 1 auto;min-width:0;display:flex;align-items:center;gap:6px;max-width:150px;min-height:38px;padding:2px 10px 2px 8px;border-radius:11px;background:rgba(5,8,28,.6);border:1px solid var(--line2)}
.f2-chip i{flex:none;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#fff 0 18%,var(--ac) 45%,transparent 72%);box-shadow:0 0 10px var(--ac)}
.f2-chip span{min-width:0;font-size:11px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.f2-chip small{display:block;font-size:9px;color:var(--muted);letter-spacing:.4px}
.f2-tabs{position:relative;z-index:3;flex:none;display:grid;gap:3px;margin:6px 12px 0;padding:3px;border-radius:14px;background:rgba(5,8,28,.75);border:1px solid var(--line)}
.f2-tab{min-height:40px;border:0;border-radius:10px;background:none;font-weight:900;font-size:13px;line-height:1.1;color:var(--muted);min-width:0;white-space:normal;overflow-wrap:anywhere;padding:2px}
.f2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.f2-scroll{position:relative;z-index:3;flex:1;min-height:0;padding:6px 12px 20px}
.f2-det{position:relative;margin:0 0 8px;padding:8px 10px;border-radius:14px;background:linear-gradient(90deg,#1b2459,#141c4a);border:1px solid var(--rc);min-width:0}
.f2-dt{display:flex;gap:9px;align-items:center;min-width:0}
.f2-di0{flex:none;width:42px;height:42px;border-radius:11px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238);position:relative;overflow:hidden;display:block}
.f2-di0 img{position:absolute;left:8%;top:8%;width:84%;height:84%;object-fit:contain}
.f2-di{flex:1;min-width:0}
.f2-dn{font-weight:900;font-size:14px;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase}
.f2-dh{font-size:11px;color:var(--muted);font-weight:800;line-height:1.25;white-space:normal;overflow-wrap:anywhere}
.f2-dh b{color:var(--gold)}
.f2-lvb{flex:none;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1;color:var(--gold);text-shadow:0 0 12px rgba(255,210,94,.5);display:flex;align-items:center;gap:3px}
.f2-lvb .nx{color:var(--green);text-shadow:0 0 12px rgba(94,240,160,.5)}
.f2-tagl{display:inline-block;font-size:9px;font-weight:900;letter-spacing:.8px;padding:1px 6px;border-radius:6px;background:var(--rose);color:#2a0612;vertical-align:1px;margin-right:4px}
.f2-chn{display:flex;gap:10px;align-items:center;margin-top:6px;padding:6px 8px;border-radius:10px;background:rgba(5,8,28,.55);min-width:0}
.f2-chn .pc{flex:none;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:28px;line-height:1;color:var(--cyan);text-shadow:0 0 12px rgba(94,231,255,.45);min-width:62px;text-align:center}
.f2-chn .cw{flex:1;min-width:0}
.f2-chn small{display:block;font-size:11px;font-weight:900;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-chn small b{color:var(--green)}
.f2-chn em{display:block;font-style:normal;font-size:10px;font-weight:800;color:var(--muted);overflow-wrap:anywhere;line-height:1.2}
.f2-pity{display:block;height:7px;margin:3px 0;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
.f2-pity i{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,#5ef0a0,#5ee7ff);transition:width .3s}
.f2-msg{color:var(--muted);font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.f2-msg b{color:var(--gold)}
.f2-sts{display:grid;gap:4px;margin-top:5px}
.f2-sts div{border-radius:9px;background:rgba(5,8,28,.45);padding:4px 6px;min-width:0}
.f2-sts small{display:block;font-size:8.5px;font-weight:900;color:var(--muted);letter-spacing:.4px;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-sts b{display:block;font-size:11.5px;font-weight:900;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-sts em{display:block;font-style:normal;font-size:9px;font-weight:800;color:var(--muted);line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-sts .up b{color:var(--green)}
.f2-sts .bad b{color:var(--red)}
.f2-cmp{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;margin-top:5px;padding:5px 8px;border-radius:10px;background:rgba(5,8,28,.55);font-weight:900;font-size:12px;min-width:0}
.f2-cmp small{font-size:9px;letter-spacing:1px;color:var(--muted);flex:none}
.f2-cmp .a{color:var(--muted);white-space:nowrap}
.f2-cmp .b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;white-space:nowrap}
.f2-cmp .d{margin-left:auto;white-space:nowrap}
.f2-acts{display:flex;gap:6px;margin-top:7px}
.f2-bt{flex:1 1 0;min-width:0;min-height:44px;padding:3px 6px;border-radius:11px;border:0;font-weight:900;font-size:12px;line-height:1.1;text-align:center;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:var(--ink)!important;box-shadow:0 3px 0 #9a5a10;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.f2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.f2-bt span{max-width:100%;min-width:0;white-space:normal;overflow-wrap:anywhere;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.f2-bt small{font-size:10px;font-weight:800;opacity:.85;max-width:100%;white-space:normal;overflow-wrap:anywhere}
.f2-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);color:#04223f!important;box-shadow:0 3px 0 #164e8c}
.f2-bt.off,.f2-bt[aria-disabled="true"]{background:rgba(255,255,255,.06);color:var(--muted)!important;box-shadow:none;border:1px solid var(--line);transform:none}
.f2-foot{margin-top:5px;font-size:10px;font-weight:800;color:var(--muted);line-height:1.3;overflow-wrap:anywhere}
.f2-foot b{color:var(--text)}
.f2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:2px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.f2-sec span{min-width:0}
.f2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.f2-sec b{color:var(--text)}
.f2-hint{font-size:11px;color:var(--muted);margin:0 0 8px;line-height:1.4;overflow-wrap:anywhere}
.f2-hint b{color:var(--gold)}
.f2-alg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;margin-bottom:10px}
.f2-ac{position:relative;min-height:60px;border-radius:12px;border:1px solid var(--line);background:rgba(5,8,28,.5);padding:6px 2px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}
.f2-ac .sw{width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,#fff 0 12%,var(--ac) 40%,transparent 72%);box-shadow:0 0 12px var(--ac)}
.f2-ac .sw.none{background:radial-gradient(circle,#55608f 0 30%,transparent 70%);box-shadow:none}
.f2-ac b{font-size:12px;font-weight:900;color:var(--gold)}
.f2-ac small{font-size:9px;font-weight:800;color:var(--muted);text-align:center;line-height:1.15;white-space:normal;overflow-wrap:anywhere;max-width:100%;padding:0 1px}
.f2-ac.cur{border-color:var(--gold);box-shadow:0 0 0 2px rgba(255,210,94,.45)}
.f2-ac.cur::after{content:'SUA';position:absolute;top:-6px;left:50%;transform:translateX(-50%);font-size:8px;font-weight:900;letter-spacing:.6px;padding:0 5px;border-radius:5px;background:var(--gold);color:var(--ink)}
.f2-ac.pv{border-color:var(--cyan)}
.f2-tbl{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,.6fr);border-radius:12px;overflow:hidden;border:1px solid var(--line);margin-bottom:10px;font-size:11px;font-weight:800}
.f2-tbl>span{padding:4px 3px 4px 5px;background:rgba(5,8,28,.45);border-top:1px solid rgba(130,150,255,.12);line-height:1.15;white-space:normal;overflow-wrap:anywhere;display:flex;align-items:center;gap:4px;min-width:0}
.f2-tbl>span.h{background:rgba(61,79,184,.35);color:var(--muted);font-size:9px;letter-spacing:.6px;border-top:0}
.f2-tbl>span.dn{color:#6f7ab0}
.f2-tbl>span.cu{background:rgba(255,210,94,.18);color:var(--gold)}
.f2-tbl>span.cp{color:#58628f}
.f2-tbl i{display:inline-block;flex:none;width:9px;height:9px;border-radius:50%;background:var(--ac);box-shadow:0 0 6px var(--ac)}
.f2-row{width:100%;min-height:54px;display:flex;gap:10px;align-items:center;padding:7px 8px;border-radius:14px;background:var(--glass);border:1px solid var(--line);margin-bottom:6px;text-align:left;min-width:0}
.f2-row .f2-di0{width:40px;height:40px}
.f2-row .tx{flex:1;min-width:0;display:block}
.f2-row .tx b{display:block;font-size:13px;font-weight:900;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
.f2-row .tx small{display:block;font-size:11px;color:var(--muted);font-weight:700;line-height:1.25;white-space:normal;overflow-wrap:anywhere}
.f2-row strong{flex:none;font-size:11px;font-weight:900;text-align:right;line-height:1.3}
.f2-row.on{border-color:var(--gold);box-shadow:0 0 0 2px rgba(255,210,94,.35)}
.f2-eqb{font-size:8px;font-weight:900;padding:1px 5px;border-radius:5px;background:var(--green);color:#043018;vertical-align:1px;margin-left:4px}
.f2-mat{display:flex;gap:10px;align-items:center;padding:7px 10px;border-radius:14px;background:rgba(5,8,28,.5);border:1px solid var(--line);margin-bottom:8px;min-width:0}
.f2-mat div{flex:1;min-width:0;font-size:11px;color:var(--muted);font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.f2-mat div b{display:block;color:var(--text);font-size:13px}
.f2-mat strong{flex:none;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;color:var(--gold)}
.f2-stars{display:inline-flex;gap:1px;vertical-align:-2px}
.f2-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto minmax(0,1.1fr);gap:5px;align-items:center;margin-top:6px}
.f2-trio .q{border-radius:10px;background:rgba(5,8,28,.5);border:1px solid var(--line);padding:4px 2px;text-align:center;min-width:0}
.f2-trio .q img{width:30px;height:30px;object-fit:contain;display:block;margin:0 auto}
.f2-trio .q small{display:block;font-size:9px;font-weight:900;color:var(--muted);line-height:1.15;white-space:normal;overflow-wrap:anywhere}
.f2-trio .q.res{border-color:var(--gold);background:rgba(255,210,94,.12)}
.f2-bands{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px;margin-bottom:10px}
.f2-bands div{border-radius:10px;background:rgba(5,8,28,.5);border:1px solid var(--line);padding:5px 3px;text-align:center;min-width:0}
.f2-bands b{display:block;font-size:11px;color:var(--gold)}
.f2-bands small{display:block;font-size:9px;font-weight:800;color:var(--muted);line-height:1.15;white-space:normal;overflow-wrap:anywhere}
.f2-notes{position:relative;z-index:3;flex:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px 6px;min-height:40px;margin:4px 12px 0;pointer-events:none;min-width:0}
.f2-notes>div:empty{display:none}
.f2-notes>div{flex:0 1 auto;min-width:0}
.f2-ban{max-width:100%;padding:3px 12px;border-radius:12px;text-align:center;animation:f2-bin 2.4s ease-out both}
.f2-ban b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:16px;line-height:1.1;overflow-wrap:anywhere}
.f2-ban small{display:block;font-size:10px;line-height:1.2;font-weight:900;overflow-wrap:anywhere}
.f2-ban.ok{background:linear-gradient(180deg,rgba(60,40,6,.94),rgba(30,20,4,.94));border:2px solid var(--gold);color:var(--gold)}
.f2-ban.ok small{color:var(--green)}
.f2-ban.no{background:rgba(42,21,48,.94);border:2px solid var(--rose);color:#ffb3c4}
.f2-ban.no small{color:var(--text)}
.f2-ban.au{border-color:var(--ac);color:#fff}
.f2-fly{padding:1px 10px;border-radius:11px;background:rgba(5,8,28,.94);border:1px solid var(--line2);max-width:100%;text-align:center;overflow-wrap:anywhere;font-family:'Lilita One',Nunito,sans-serif;font-size:16px;line-height:1.2;animation:f2-fly 1.6s ease-out both;text-shadow:0 2px 0 rgba(0,0,0,.5);color:var(--green)}
.f2-toast{padding:4px 12px;border-radius:12px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;animation:f2-tin 2.2s ease both;max-width:100%;overflow-wrap:anywhere}
.f2-sm .f2-fcrow{padding:3px 8px 3px 10px}
.f2-sm .f2-fcb{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 6px}
.f2-sm .f2-fcb b{font-size:20px}
.f2-sm .f2-fcb em{flex:1 1 100%}
.f2-sm .f2-chip{min-height:30px}
.f2-sm .f2-tabs{margin-top:4px}
.f2-sm .f2-scroll{padding-top:4px}
.f2-sm .f2-det{padding:6px 10px}
.f2-sm .f2-chn{margin-top:4px;padding:4px 8px}
.f2-sm .f2-chn .pc{font-size:24px}
.f2-shade{position:absolute;inset:0;z-index:50;background:rgba(3,5,18,.72);display:flex;align-items:center;animation:f2-fade .2s}
.f2-modal{margin:auto 16px;width:100%;max-height:86%;overflow-y:auto;border-radius:22px;background:linear-gradient(180deg,#1d2768,#0f1540);border:1px solid var(--line2);padding:16px;min-width:0}
.f2-modal h3{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;margin:0 0 8px}
.f2-modal p{margin:0 0 6px;font-size:13px;color:var(--muted);line-height:1.45;overflow-wrap:anywhere}
.f2-modal p b{color:var(--text)}
.f2-gain{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 2px}
.f2-gain span{display:inline-flex;align-items:center;gap:4px;min-height:26px;padding:0 9px;border-radius:9px;background:rgba(255,107,107,.12);color:#ffc9c9;font-weight:900;font-size:12px}
.f2-gate{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 28px;text-align:center}
@keyframes f2-fade{from{opacity:0}}
@keyframes f2-tin{0%{opacity:0;transform:scale(.94)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
@keyframes f2-fly{0%{opacity:0;transform:scale(.9)}15%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
@keyframes f2-bin{0%{opacity:0;transform:scale(.9)}10%{opacity:1;transform:none}82%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.f2-in,.f2-shade{animation:none}.f2-ban,.f2-fly,.f2-toast{animation-timing-function:step-end}}
`; document.head.appendChild(st); })();

/* ---------- avisos (dentro da tela; nada de diálogo do navegador) ---------- */
const toastHtml=m=>'<div class="f2-toast" role="status">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('f2_toast'); if(el) el.innerHTML=toastHtml(X.toast); }catch(e){} }
function banner(cls,title,sub){ X.ban={cls,title,sub:sub||'',t:now()}; }
/* a faixa guarda a hora em que nasceu: se a tela redesenhar no meio, a animação continua de onde estava (atraso negativo) */
function banHtml(b){ if(!b) return ''; const age=now()-b.t; if(age>=BAN_MS) return '';
  return '<div class="f2-ban '+b.cls+'" role="status" style="animation-delay:'+(-age)+'ms'+(b.col?';--ac:'+b.col:'')+'"><b>'+esc2(b.title)+'</b><small>'+esc2(b.sub)+'</small></div>'; }
function whyTxt(r,sl){ return r==='locked'?'A Forja libera no nível '+gateLv():r==='wing'?'A asa abre no nível '+wingLv()
  :r==='max'?slotShort(sl)+' já está no máximo: +'+FD().max:r==='cap'?'Teto da '+eraName(eraNow())+': +'+capNow()+'. Avance de era para passar.'
  :r==='stones'?'Faltam pedras de forja. Elas caem de chefes e inimigos e vêm ao desmontar itens.':r==='gold'?'Falta ouro para a tentativa':'Não dá para forjar este espaço agora'; }
const whyShort=r=>r==='stones'?'acabaram as pedras':r==='gold'?'acabou o ouro':r==='cap'?'teto da era':r==='max'?'nível máximo':'não dá agora';

/* ================= PALCO (canvas): chão, aura atrás, herói do jogo, aura na frente, efeito da tentativa ================= */
const SEED=[]; for(let i=0;i<48;i++) SEED.push([((i*7919)%997)/997,((i*104729)%991)/991,((i*1299709)%983)/983]);
const c01=v=>Math.max(0,Math.min(1,v));
function hexA(h,a){ const v=parseInt(String(h||'#55608f').slice(1),16)||0; return 'rgba('+(v>>16&255)+','+(v>>8&255)+','+(v&255)+','+c01(a).toFixed(3)+')'; }
/* força dentro da faixa: cada +1 acima do começo da faixa deixa a aura um pouco mais forte (só desenho) */
const auraQ=(lv,a)=>Math.min(1,(lv-a.from+1)/3)+Math.max(0,lv-(a.from+2))*0.06;
function flames(x,g,t,q,front){ x.save(); x.globalCompositeOperation='lighter'; const N=front?5:9, HX=g.HX, GY=g.GY;
  for(let i=0;i<N;i++){ const s=SEED[i+(front?24:0)], bx=HX-4+(s[0]-.5)*(front?64:100), h=(front?30:66)+34*q+16*Math.sin(t*7+i*1.7)+12*s[1], w=(front?8:13)+6*s[2], sw=Math.sin(t*5+i*2.1)*7;
    const gr=x.createLinearGradient(bx,GY+2,bx,GY-h); gr.addColorStop(0,'rgba(255,60,40,'+(front?.38:.55)+')'); gr.addColorStop(.45,'rgba(255,140,40,'+(front?.28:.42)+')'); gr.addColorStop(1,'rgba(255,220,90,0)');
    x.fillStyle=gr; x.beginPath(); x.moveTo(bx-w,GY+2); x.quadraticCurveTo(bx-w*.7+sw*.3,GY-h*.5,bx+sw,GY-h); x.quadraticCurveTo(bx+w*.7+sw*.3,GY-h*.5,bx+w,GY+2); x.closePath(); x.fill(); }
  x.restore(); }
function auraBack(x,g,t,lv){ const T=tierOf(lv); if(!T) return; const a=auras()[T], col=acol(a), q=auraQ(lv,a), pu=.5+.2*Math.sin(t*2.6), HX=g.HX, GY=g.GY, CY=g.CY;
  const r=70+12*T+8*q, g1=x.createRadialGradient(HX,GY,4,HX,GY,r); g1.addColorStop(0,hexA(col,.32+.08*q)); g1.addColorStop(1,hexA(col,0)); x.fillStyle=g1; x.beginPath(); x.ellipse(HX,GY,r,r*.22,0,0,7); x.fill();
  const g2=x.createRadialGradient(HX,CY,8,HX,CY,84+12*T); g2.addColorStop(0,hexA(col,(.22+.07*T)*(.8+pu*.5))); g2.addColorStop(1,hexA(col,0)); x.fillStyle=g2; x.fillRect(HX-150,CY-130,300,230);
  if(a.id==='gold'){ x.save(); x.globalCompositeOperation='lighter'; x.translate(HX,CY); x.rotate(t*.22); const N=14;
    for(let i=0;i<N;i++){ x.rotate(Math.PI*2/N); const len=105+18*Math.sin(t*1.7+i)+22*q, w=6+3*Math.sin(t*2.3+i*1.3);
      const lg=x.createLinearGradient(0,0,len,0); lg.addColorStop(0,'rgba(255,226,120,.42)'); lg.addColorStop(1,'rgba(255,210,63,0)'); x.fillStyle=lg;
      x.beginPath(); x.moveTo(0,0); x.lineTo(len,-w); x.lineTo(len,w); x.closePath(); x.fill(); }
    x.restore(); }
  if(a.id==='purple'||a.id==='gold'){ const N=a.id==='gold'?12:10+Math.round(4*q), sc=a.id==='gold'?'255,214,110':'180,92,255';
    for(let i=0;i<N;i++){ const s=SEED[i], p=(t*(0.2+0.1*s[2])+s[0])%1, px=HX+(s[1]-0.5)*96+Math.sin(t*0.9+i)*6, py=GY+2-p*150, rr=7+p*(16+6*q);
      const al=Math.sin(Math.PI*p)*(.2+.08*q), rg=x.createRadialGradient(px,py,1,px,py,rr); rg.addColorStop(0,'rgba('+sc+','+al.toFixed(3)+')'); rg.addColorStop(1,'rgba('+sc+',0)');
      x.fillStyle=rg; x.beginPath(); x.arc(px,py,rr,0,7); x.fill(); } }
  if(a.id==='flame') flames(x,g,t,q,false); }
function auraFront(x,g,t,lv){ const T=tierOf(lv); if(!T) return; const a=auras()[T], q=auraQ(lv,a), HX=g.HX, GY=g.GY;
  if(a.id==='flame') flames(x,g,t,q,true);
  x.save(); x.globalCompositeOperation='lighter';
  const N=5+4*T+Math.round(4*q), c=a.id==='flame'?'255,150,60':a.id==='gold'?'255,232,140':a.id==='purple'?'214,160,255':'140,200,255';
  for(let i=0;i<N;i++){ const s=SEED[(i+11)%48], p=(t*(0.25+0.12*s[2]+0.04*T)+s[0])%1, px=HX+(s[1]-0.5)*(84+6*T)+Math.sin(t*2+i)*4, py=GY-p*(130+12*T), rr=1+1.8*(1-p)*s[2]+.5;
    x.fillStyle='rgba('+c+','+(Math.sin(Math.PI*p)*.9).toFixed(3)+')'; x.beginPath(); x.arc(px,py,rr,0,7); x.fill();
    if(a.id==='gold'&&i%4===0){ x.strokeStyle=x.fillStyle; x.lineWidth=.8; x.beginPath(); x.moveTo(px-rr*2.4,py); x.lineTo(px+rr*2.4,py); x.moveTo(px,py-rr*2.4); x.lineTo(px,py+rr*2.4); x.stroke(); } }
  x.restore();
  if(a.id==='gold'){ const P=1.3, ph=t%P, k=Math.floor(t/P);
    if(ph<0.2){ const side=k%2?1:-1, al=1-ph/0.2; x.save(); x.globalCompositeOperation='lighter'; x.strokeStyle='rgba(255,240,170,'+al.toFixed(2)+')'; x.lineWidth=2; x.shadowColor='#ffd23f'; x.shadowBlur=10;
      x.beginPath(); let px=HX+side*(46+8*q), py=GY-158; x.moveTo(px,py);
      for(let j=1;j<=7;j++){ const s=SEED[(k*7+j)%48]; px=HX+side*(40+(s[0]-.5)*24); py=GY-158+j*19; x.lineTo(px,py); }
      x.stroke(); x.lineWidth=.8; x.strokeStyle='rgba(255,255,255,'+al.toFixed(2)+')'; x.stroke(); x.restore(); } } }
/* efeito do Forjar: faíscas na altura da mão (acertou), onda e clarão quando a aura sobe de faixa; fumaça cinza (falhou) */
function forgeFx(x,g){ const f=X.fx; if(!f) return; const age=(now()-f.t)/1000; if(age>1.6){ X.fx=null; return; }
  const hx=g.HX+22*g.hk/.8, hy=g.GY-96*g.hk/.8, HX=g.HX, CY=g.CY;
  x.save(); x.globalCompositeOperation='lighter';
  if(f.ok){ for(let i=0;i<30;i++){ const s=SEED[i], an=s[0]*Math.PI*2, v=70+150*s[1], life=.7+.5*s[2]; if(age>life) continue;
      const px=hx+Math.cos(an)*v*age, py=hy+Math.sin(an)*v*age+150*age*age, al=1-age/life;
      x.strokeStyle=i%3?'rgba(255,200,80,'+al.toFixed(2)+')':'rgba(255,255,220,'+al.toFixed(2)+')'; x.lineWidth=1.6;
      x.beginPath(); x.moveTo(px,py); x.lineTo(px-Math.cos(an)*6,py-Math.sin(an)*6-3); x.stroke(); }
    if(age<.35){ const gr=x.createRadialGradient(hx,hy,2,hx,hy,60); gr.addColorStop(0,'rgba(255,240,180,'+(.7*(1-age/.35)).toFixed(2)+')'); gr.addColorStop(1,'rgba(255,200,80,0)'); x.fillStyle=gr; x.beginPath(); x.arc(hx,hy,60,0,7); x.fill(); }
    if(f.cross){ const col=acol(auraOf(f.to)), rr=20+300*age, al=Math.max(0,1-age/1.2); x.strokeStyle=hexA(col,al); x.lineWidth=6*(1-age/1.6)+1; x.beginPath(); x.ellipse(HX,CY,rr,rr*.62,0,0,7); x.stroke();
      if(age<.3){ x.fillStyle=hexA(col,.35*(1-age/.3)); x.fillRect(0,0,g.W,g.H); } }
  } else { x.globalCompositeOperation='source-over';
    for(let i=0;i<7;i++){ const s=SEED[i+30], p=age/1.3; if(p>1) continue; const px=hx+(s[0]-.5)*30+Math.sin(age*3+i)*4, py=hy-p*50-s[1]*10, rr=6+p*16;
      const gr=x.createRadialGradient(px,py,1,px,py,rr); gr.addColorStop(0,'rgba(150,150,170,'+(.4*(1-p)).toFixed(2)+')'); gr.addColorStop(1,'rgba(150,150,170,0)'); x.fillStyle=gr; x.beginPath(); x.arc(px,py,rr,0,7); x.fill(); }
    for(let i=0;i<8;i++){ const s=SEED[i+38], an=Math.PI*(.15+.7*s[0]), v=40+60*s[1], px=hx+Math.cos(an)*v*age*(s[2]>.5?1:-1), py=hy+Math.sin(an)*v*age*.3+120*age*age, al=Math.max(0,1-age/.9);
      x.fillStyle='rgba(255,120,90,'+al.toFixed(2)+')'; x.beginPath(); x.arc(px,py,1.3,0,7); x.fill(); } }
  x.restore(); }
/* nível da aura que vai para o palco: a prévia tocada na legenda, ou o +N da arma (ao subir de faixa, a antiga fica até o clarão) */
function shownLv(){ if(X.apv!=null) return X.apv; const f=X.fx; if(f&&f.cross&&(now()-f.t)<350) return f.from; return lvl('weapon'); }
function ground(x,g,t){ const HX=g.HX, GY=g.GY, gr=x.createRadialGradient(HX,GY,10,HX,GY,130); gr.addColorStop(0,'rgba(255,170,90,.28)'); gr.addColorStop(1,'rgba(255,170,90,0)'); x.fillStyle=gr; x.beginPath(); x.ellipse(HX,GY,130,20,0,0,7); x.fill();
  x.strokeStyle='rgba(255,210,94,.5)'; x.setLineDash([5,6]); x.lineDashOffset=-t*10; x.lineWidth=1.5; x.beginPath(); x.ellipse(HX,GY,104,15,0,0,7); x.stroke(); x.setLineDash([]); }
/* o herói é o do jogo: arma na mão, asa nas costas e o pet por último (na frente). A pé, como no protótipo */
function hero(x,g,t){ if(typeof window.drawHeroFull!=='function'||!(typeof HS==='number'&&HS>0)) return;
  window.drawHeroFull(x,g.HX,g.GY,g.hk*256/HS,{t:t,mount:false}); }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||236;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0);
  base(); x.clearRect(0,0,w,h);
  const hk=Math.min(.8,(h-30)/256), g={W:w,H:h,HX:w/2,GY:h-14,hk:hk}; g.CY=g.GY-102*hk; const lv=shownLv();
  const part=fn=>{ try{ fn(); }catch(e){ try{ x.restore(); }catch(e2){} } base(); };
  part(()=>ground(x,g,t)); part(()=>auraBack(x,g,t,lv)); part(()=>hero(x,g,t)); part(()=>auraFront(x,g,t,lv)); part(()=>forgeFx(x,g)); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('f2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('f2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }

/* ================= HTML ================= */
function gateHtml(){ return '<div class="f2"><div class="f2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div><div class="f2-gate" role="dialog" aria-label="Forja bloqueada"><span class="lil" style="font-size:26px;position:relative">Forja</span>'
  +'<span style="position:relative;padding:6px 14px;border-radius:999px;border:2px solid var(--gold);color:var(--gold);font-size:15px;font-weight:900">Libera no nível '+gateLv()+'</span>'
  +'<span class="f2-msg" style="position:relative">Você está no nível '+esc2(call(plv)||1)+'. Continue lutando para liberar. Você tem '+n0(stonesNow())+' pedras de forja guardadas.</span>'
  +'<button class="f2-bt" data-x="back" style="position:relative;flex:none;min-height:48px;padding:0 26px;font-size:15px"><span>Voltar ao Equipamento</span></button></div></div>'; }

function stageHtml(SH){ const cap=capNow(), M=FD().max, pitch=Math.floor((SH-6)/4), box=Math.max(30,Math.min(46,pitch-12));
  const L=['weapon','hat','armor','gloves'], R=['necklace','boots','wing'], rest=FD().slots.filter(s=>L.indexOf(s)<0&&R.indexOf(s)<0);
  const cell=(s,i,right)=>{ if(!slotOk(s)) return ''; const it=eqOf(s), n=lvl(s), shut=wingShut(s), atCap=n>=cap||n>=M, on=X.slot===s&&X.tab==='forge';
    return '<button class="f2-slot'+(on?' on':'')+(shut?' lock':'')+'" data-x="slot" data-slot="'+s+'" aria-pressed="'+on+'" aria-label="'+esc2(slotName(s))+': Forja +'+n+(shut?', abre no nível '+wingLv():atCap?', no teto':'')+'" style="'+(right?'right':'left')+':6px;top:'+(2+i*pitch+(right?Math.round(pitch/2):0))+'px;height:'+pitch+'px;--rc:'+(it&&!shut?rcol(it):'#55608f')+'">'
      +'<span class="sb" style="width:'+box+'px;height:'+box+'px"><img src="'+icoOf(s,it,box)+'" alt=""'+(it?'':' style="opacity:.5"')+'>'+(shut?'<span class="lk">'+SV.lock+'</span>':'<span class="fg'+(atCap?' cp':'')+'">+'+n+'</span>')+'</span>'
      +'<span class="sl">'+esc2(slotShort(s))+'</span></button>'; };
  const who=X.apv!=null?'<button class="f2-who" data-x="pvout" aria-label="Sair da prévia da aura"><i></i><span>Prévia: '+esc2(auraOf(X.apv).name)+' (+'+X.apv+')</span><u>Sair</u></button>'
    :'<div class="f2-who"><i></i><span>'+esc2(heroName())+' · '+esc2(eraName(eraNow()))+' · Teto +'+cap+'</span></div>';
  return '<div class="f2-stage" style="height:'+SH+'px"><canvas id="f2_stc" role="img" aria-label="Seu herói com a arma na mão e a aura da arma, que cresce com o nível da Forja, e o pet na frente" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas>'
    +who+L.map((s,i)=>cell(s,i,false)).join('')+R.concat(rest).map((s,i)=>cell(s,i,true)).join('')+'</div>'; }

function fcRowHtml(){ const w=lvl('weapon'), a=auraOf(w), nx=auras()[tierOf(w)+1];
  return '<div class="f2-fcrow"><div class="f2-fcb"><small>PODER (FC)</small><b id="f2_fc">'+esc2(fcTxt(fcNow()))+'</b><em>Arma +'+w+' · bônus do espaço '+pctB(bonusOf(w))+'</em></div>'
    +'<div class="f2-chip" role="img" aria-label="'+n0(stonesNow())+' pedras de forja">'+SV.stone+'<span><b id="f2_stones">'+esc2(kf(stonesNow()))+'</b><small>pedras</small></span></div>'
    +'<div class="f2-chip" style="--ac:'+acol(a)+'"><i></i><span>'+esc2(a.name)+'<small>'+(nx?'próxima no +'+nx.from:'aura máxima')+'</small></span></div></div>'; }

function tabsHtml(){ const T=[['forge','Forjar'],['trans','Transformar']]; if(qOn()) T.push(['fuse','Fundir']);
  return '<div class="f2-tabs" role="tablist" style="grid-template-columns:repeat('+T.length+',minmax(0,1fr))">'+T.map(t=>'<button class="f2-tab" role="tab" data-x="tab" data-t="'+t[0]+'" aria-selected="'+(X.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>'; }

const stsCols=narrow=>narrow?'repeat(2,minmax(0,1fr))':'minmax(0,.85fr) minmax(0,1fr) minmax(0,1.3fr) minmax(0,1fr)';
const cmpHtml=(lab,fa,fb)=>{ const d=fcDelta(fa,fb); return '<div class="f2-cmp"><small>'+lab+'</small><span class="a">'+esc2(fcTxt(fa))+'</span>'+SV.go+'<span class="b" style="color:'+esc2(d.color||'#9aa6d6')+'">'+esc2(fcTxt(fb))+'</span><span class="d" style="color:'+esc2(d.color||'#9aa6d6')+'">'+(d.text?esc2(d.text):'sem mudança')+'</span></div>'; };

/* ----- aba Forjar: faixa de detalhe ----- */
function detForge(narrow,short){ const D=FD(), sl=X.slot, it=eqOf(sl), n=lvl(sl), M=D.max, cap=capNow(), shut=wingShut(sl), c=Sys.forge.canTry(S,Sys.host,sl);
  const top=n>=M, atCap=!top&&n>=cap, rc=it&&!shut?rcol(it):'#55608f', late=f20()&&n>=15;
  const head='<div class="f2-dt"><span class="f2-di0"><img src="'+icoOf(sl,shut?null:it,36)+'" alt=""'+(it&&!shut?'':' style="opacity:.5"')+'></span><div class="f2-di"><div class="f2-dn">'+esc2(slotName(sl))+' · '+esc2(shut?'abre no nível '+wingLv():it?iName(it):'espaço vazio')+(it&&!shut?' <span class="f2-rar" style="color:'+rc+'">'+esc2(rname(it))+'</span>':'')+'</div>'
    +'<div class="f2-dh">'+(late?'<span class="f2-tagl">ERAS FINAIS</span>':'')+(top?'Forja <b>+'+n+'</b> · máximo':atCap?'Forja <b>+'+n+'</b> · no teto da era':'Forja <b>+'+n+' → +'+(n+1)+'</b> · teto da era +'+cap)+'</div></div>'
    +'<span class="f2-lvb">+'+n+(top||atCap||shut?'':SV.goG+'<span class="nx">+'+(n+1)+'</span>')+'</span></div>';
  const open='<div class="f2-det" id="f2_det" style="--rc:'+rc+'">'+head;
  if(shut) return open+'<div class="f2-chn"><div class="f2-msg">O espaço da asa abre no <b>nível '+wingLv()+'</b>. O +N fica guardado no espaço.</div></div></div>';
  if(c.reason==='locked') return open+'<div class="f2-chn"><div class="f2-msg">A Forja libera no <b>nível '+gateLv()+'</b>.</div></div></div>';
  if(top) return open+'<div class="f2-chn"><div class="f2-msg">Este espaço chegou ao máximo: <b>+'+M+'</b>, bônus '+pctB(bonusOf(n))+'.</div></div></div>';
  if(atCap){ let ne=-1; for(let e=eraNow()+1;e<D.capByEra.length;e++) if(D.capByEra[e]>cap){ ne=e; break; }
    return open+'<div class="f2-chn"><div class="f2-msg">Teto da era: <b>+'+cap+'</b>. '+(ne>=0?'O +'+D.capByEra[ne]+' abre na <b>'+esc2(eraName(ne))+'</b>.':'Não há era com teto maior.')+' Guarde as pedras: elas não se perdem.</div></div></div>'; }
  const base=D.chance[n], pity=pityOf(sl), pw=c01(pity/Math.max(1,100-base))*100, wt=Sys.forge.worstTries(S,sl), st=stonesNow();
  const isW=sl==='weapon', a0=auraOf(n), a1=auraOf(n+1), auraUp=isW&&a1.id!==a0.id;
  const fa=fcNow(), fb=fcAfterForge(sl), lackS=st<c.stones, lackG=c.reason==='gold'||!canGold(c.gold);
  const paid=Math.max(0,Math.min(c.stones>0?Math.floor(st/c.stones):wt,c.gold>0?Math.floor((+S.gold||0)/c.gold):wt)), A=X.auto, go=c.ok&&!X.busy;
  let stage=0; try{ stage=Sys.host.stage()|0; }catch(e){}
  /* tela baixa (320x640, 360x640): os botões sobem para logo abaixo da chance, para o Forjar aparecer sem rolar; o custo já está escrito no próprio botão */
  const chn='<div class="f2-chn"><b class="pc">'+pc(c.chance)+'</b><div class="cw"><small>'+pc(base)+' '+(pity?'<b>+ '+pc(pity)+' de garantia</b>':'· sem garantia acumulada')+'</small><span class="f2-pity" role="img" aria-label="Garantia acumulada: '+pc(pity)+'"><i style="width:'+pw.toFixed(1)+'%"></i></span><em>Garantido em até '+pl(wt,'tentativa','tentativas')+' · cada falha soma +'+pc(D.pityPerFail)+'</em></div></div>';
  const info='<div class="f2-sts" style="grid-template-columns:'+stsCols(narrow)+'">'
      +'<div class="'+(lackS?'bad':'')+'"><small>PEDRAS</small><b>'+n0(c.stones)+'</b><em>tem '+esc2(kf(st))+'</em></div>'
      +'<div class="'+(lackG?'bad':'')+'"><small>OURO/TENT.</small><b>'+esc2(kf(c.gold))+'</b><em>'+n0(D.goldPerTryKills)+' abates'+(stage?' da fase '+stage:'')+'</em></div>'
      +'<div class="up"><small>BÔNUS</small><b>'+pctB(bonusOf(n))+' → '+pctB(bonusOf(n+1))+'</b><em>do espaço</em></div>'
      +'<div class="'+(auraUp?'up':'')+'"><small>AURA DA ARMA</small><b>'+esc2(!isW?'só na arma':auraUp?a1.name:a0.name)+'</b><em>'+(!isW?'vem do +N da arma':auraUp?'nova aura no +'+(n+1):'continua')+'</em></div></div>'
    +cmpHtml('FC ANTES → DEPOIS',fa,fb);
  const acts='<div class="f2-acts">'
      +'<button class="f2-bt" data-x="forge" id="f2_go" aria-disabled="'+(!go)+'"><span>'+SV.hammer+'Forjar</span><small>'+pl(c.stones,'pedra','pedras')+' · '+esc2(kf(c.gold))+' de ouro</small></button>'
      +'<button class="f2-bt blue" data-x="auto" id="f2_auto" aria-disabled="'+(!go)+'"><span>'+(A?'Tentativa '+A.k+'...':'Forjar até conseguir')+'</span><small>'+(A?pl(A.stones,'pedra gasta','pedras gastas'):paid>=wt?'até '+wt+'x · '+n0(wt*c.stones)+' pedras no pior caso':'pedras e ouro para '+paid+'x')+'</small></button></div>';
  return open+chn+(short?acts+info:info+acts)
    +'<div class="f2-foot">'+(c.ok?'':'<b>'+esc2(whyTxt(c.reason,sl))+'</b> ')+'A falha nunca tira nível. Pedras e ouro vêm de jogar: nunca de diamante nem de dinheiro.</div></div>'; }

/* ----- aba Forjar: legenda das auras e tabela ----- */
function bodyForge(){ const D=FD(), A=auras(), w=lvl('weapon'), cur=tierOf(w), sl=X.slot, n=lvl(sl), cap=capNow();
  let h='<div class="f2-sec"><span>Auras da arma</span><span>toque para ver no herói</span></div><div class="f2-alg">'+A.map((a,i)=>'<button class="f2-ac'+(i===cur?' cur':'')+(X.apv!=null&&tierOf(X.apv)===i?' pv':'')+'" style="--ac:'+acol(a)+'" data-x="aura" data-v="'+a.from+'" aria-pressed="'+(X.apv!=null&&tierOf(X.apv)===i)+'" aria-label="'+esc2(a.name)+', a partir do +'+a.from+'"><span class="sw'+(a.id==='none'?' none':'')+'"></span><b>+'+a.from+'</b><small>'+esc2(String(a.name).replace('Aura ',''))+'</small></button>').join('')+'</div>';
  h+='<div class="f2-sec"><span>Tabela da Forja</span><span>'+esc2(slotShort(sl))+' · teto da era <b>+'+cap+'</b></span></div><div class="f2-tbl" role="table" aria-label="Chance, pedras e bônus por nível"><span class="h">NÍVEL</span><span class="h">CHANCE</span><span class="h">PEDRAS</span><span class="h">BÔNUS</span><span class="h">AURA</span>';
  for(let i=0;i<D.max;i++){ const cls=i<n?'dn':i===n?'cu':i>=cap?'cp':'';
    h+='<span class="'+cls+'">+'+i+' → +'+(i+1)+'</span><span class="'+cls+'">'+pc(D.chance[i])+'</span><span class="'+cls+'">'+n0(D.stones[i])+'</span><span class="'+cls+'">'+pctB(bonusOf(i+1))+'</span><span class="'+cls+'"><i style="--ac:'+acol(auraOf(i+1))+'"></i></span>'; }
  h+='</div><p class="f2-hint">Linhas apagadas: já feitas ou acima do teto da era. O +N é do <b>espaço</b>: trocar de peça mantém o +N. Cada falha soma <b>+'+pc(D.pityPerFail)+'</b> na próxima tentativa daquele espaço e zera ao acertar.</p>';
  return h; }

/* ----- aba Transformar (Sys.stats.canTransform / transform; essência do Sys.loot) ----- */
function transPlan(it){ try{ return Sys.stats.canTransform(S,Sys.host,it)||{ok:false,reason:'item'}; }catch(e){ return {ok:false,reason:'item'}; } }
const transOk=c=>!!c&&c.reason!=='item'&&c.reason!=='same'&&c.reason!=='ahead'&&c.gold!=null;
function transList(){ const out=[]; for(const it of (S.inv||[])){ if(!it||!slotOk(it.slot)) continue; const c=transPlan(it); if(transOk(c)) out.push({it,c}); }
  return out.sort((a,b)=>(isEq(b.it)-isEq(a.it))||((b.it.r|0)-(a.it.r|0))||((b.it.e|0)-(a.it.e|0))||((b.it.lvl|0)-(a.it.lvl|0))); }
const transPay=c=>({ess:essence()>=(c.essence||0),gold:canGold(c.gold||0)});
function transFc(it,c){ try{ return Sys.fc.itemFC(S,Sys.host,Object.assign({},it,{e:c.to,lvl:1,look:Number.isInteger(it.look)?it.look:(it.e|0)})).swap||0; }catch(e){ return 0; } }
function detTrans(narrow,L){ const cur=L.find(o=>String(o.it.id)===String(X.tsel));
  if(!cur) return '<div class="f2-det" style="--rc:#55608f"><div class="f2-chn"><div class="f2-msg">'+(L.length?'Toque numa peça da lista para ver o custo.':'Nenhuma peça de era antiga na mochila: tudo já está na <b>'+esc2(eraName(eraNow()))+'</b>.')+'</div></div></div>';
  const it=cur.it, c=cur.c, rc=rcol(it), eq=isEq(it), P=transPay(c), can=P.ess&&P.gold, fa=fcNow(), fb=Math.max(0,fa+transFc(it,c)), jump=(c.to|0)-(c.from|0);
  return '<div class="f2-det" style="--rc:'+rc+'"><div class="f2-dt"><span class="f2-di0"><img src="'+icoOf(it.slot,it,36)+'" alt=""></span><div class="f2-di"><div class="f2-dn">'+esc2(iName(it))+' <span class="f2-rar" style="color:'+rc+'">'+esc2(rname(it))+'</span></div>'
    +'<div class="f2-dh">'+esc2(slotShort(it.slot))+' · '+esc2(eraName(c.from))+' <b>→ '+esc2(eraName(c.to))+'</b></div></div></div>'
    +'<div class="f2-sts" style="grid-template-columns:'+stsCols(narrow)+'">'
      +'<div class="'+(P.ess?'':'bad')+'"><small>ESSÊNCIA</small><b>'+n0(c.essence||0)+'</b><em>tem '+n0(essence())+'</em></div>'
      +'<div class="'+(P.gold?'':'bad')+'"><small>OURO</small><b>'+esc2(kf(c.gold))+'</b><em>'+pl(jump,'era de salto','eras de salto')+'</em></div>'
      +'<div><small>NÍVEL</small><b>'+(it.lvl||1)+' → 1</b><em>volta ao 1</em></div>'
      +'<div class="up"><small>VISUAL</small><b>igual</b><em>raridade e extras ficam</em></div></div>'
    +cmpHtml(eq?'FC ANTES → DEPOIS':'FC SE EQUIPAR',fa,fb)
    +'<div class="f2-acts"><button class="f2-bt" data-x="trans" data-id="'+esc2(it.id)+'" aria-disabled="'+(!can)+'"><span>Transformar</span><small>'+pl(c.essence||0,'essência','essências')+' · '+esc2(kf(c.gold))+' de ouro</small></button></div>'
    +'<div class="f2-foot">O +N da Forja continua no espaço. '+(c.lostGold?'O ouro investido nos níveis ('+esc2(kf(c.lostGold))+') não volta. ':'')+(can?'':'<b>'+(P.ess?'Falta ouro.':'Falta Essência da Era.')+'</b>')+'</div></div>'; }
function bodyTrans(L){ let h='<div class="f2-mat">'+SV.gem+'<div><b>Essência da Era</b>Vem de vencer o Senhor da Era e o Chefe de Era</div><strong>'+n0(essence())+'</strong></div>';
  h+='<div class="f2-sec"><span>Peças de era antiga</span><span>vão para a '+esc2(eraName(eraNow()))+'</span></div>';
  if(!L.length) h+='<p class="f2-hint">Nada para transformar agora.</p>';
  h+=L.map(o=>{ const it=o.it, c=o.c, P=transPay(c), can=P.ess&&P.gold, rc=rcol(it);
    return '<button class="f2-row'+(String(X.tsel)===String(it.id)?' on':'')+'" data-x="tsel" data-id="'+esc2(it.id)+'" aria-pressed="'+(String(X.tsel)===String(it.id))+'" style="--rc:'+rc+'"><span class="f2-di0"><img src="'+icoOf(it.slot,it,34)+'" alt=""></span><span class="tx"><b>'+esc2(iName(it))+(isEq(it)?'<span class="f2-eqb">USANDO</span>':'')+'</b><small>'+esc2(rname(it))+' · '+esc2(eraName(it.e|0))+' · Nv '+(it.lvl||1)+'</small></span><strong style="color:'+(can?'var(--text)':'var(--red)')+'">'+n0(c.essence||0)+' ess.<br>'+esc2(kf(c.gold))+'</strong></button>'; }).join('');
  h+='<p class="f2-hint">A peça vai para a sua era atual com a mesma raridade, os mesmos extras e o mesmo visual. O nível volta ao <b>1</b>. O custo cresce com a raridade e com as eras puladas.</p>';
  return h; }
function askHtml(){ const it=X.ask!=null?byId(X.ask):null; if(!it) return ''; const c=transPlan(it); if(!transOk(c)) return ''; const rc=rcol(it);
  return '<div class="f2-shade"><div class="f2-modal" role="dialog" aria-modal="true" aria-label="Confirmar transformação"><h3>Transformar?</h3>'
    +'<div class="f2-dt" style="--rc:'+rc+';padding:8px;border-radius:14px;background:rgba(5,8,28,.5);margin-bottom:10px"><span class="f2-di0"><img src="'+icoOf(it.slot,it,36)+'" alt=""></span><div class="f2-di"><div class="f2-dn">'+esc2(iName(it))+'</div><div class="f2-rar" style="color:'+rc+'">'+esc2(rname(it))+' · '+esc2(eraName(c.from))+' → '+esc2(eraName(c.to))+'</div></div></div>'
    +'<p>A peça vai para a <b>'+esc2(eraName(c.to))+'</b> com a mesma raridade, os mesmos extras e o mesmo visual. O nível volta ao <b>1</b>'+(c.lostGold?' e o ouro investido ('+esc2(kf(c.lostGold))+') não volta':'')+'.</p>'
    +'<p>Você paga:</p><div class="f2-gain"><span>'+n0(c.essence||0)+' Essência da Era</span><span>'+esc2(kf(c.gold))+' de ouro</span></div>'
    +'<div class="f2-acts" style="margin-top:12px"><button class="f2-bt off" data-x="askno" style="flex:.7 1 0"><span>Cancelar</span></button><button class="f2-bt" data-x="transok" data-id="'+esc2(it.id)+'"><span>Transformar</span></button></div></div></div>'; }

/* ----- aba Fundir (só com Sys.stats.DATA.quality.on): 3 iguais viram 1 com +1 estrela ----- */
const qpOf=it=>Sys.stats.qpOf(it), stOf=it=>Sys.stats.qualityStars(qpOf(it));
const famOf=it=>{ if(!it||it.slot!=='weapon') return ''; try{ return Sys.stats.weaponType(it)||''; }catch(e){ return ''; } };
const qMul=qp=>{ try{ return Sys.stats.qualityMult({qp:qp}); }catch(e){ return 1; } };
const xq=v=>'x'+(+v).toFixed(2).replace('.',',');
function groups(){ if(!qOn()) return []; const G={};
  for(const it of (S.inv||[])){ if(!it||!slotOk(it.slot)) continue; const st=stOf(it), k=[it.slot,it.e|0,it.r|0,st,famOf(it)].join('|'); (G[k]=G[k]||{k:k,slot:it.slot,e:it.e|0,r:it.r|0,st:st,items:[]}).items.push(it); }
  const ord=FD().slots; return Object.values(G).filter(g=>g.items.length>=2).sort((a,b)=>(b.items.length>=Q().fusion.count)-(a.items.length>=Q().fusion.count)||ord.indexOf(a.slot)-ord.indexOf(b.slot)||b.e-a.e||b.r-a.r||b.st-a.st); }
/* os 3 de menor qualidade, os não equipados primeiro */
const pick3=g=>g.items.slice().sort((a,b)=>(isEq(a)-isEq(b))||(qpOf(a)-qpOf(b))||(a.id-b.id)).slice(0,Q().fusion.count);
/* prévia: o próprio canFuse; com ouro insuficiente, de novo com um host que não barra o ouro (só para mostrar o resultado; a cobrança é a real) */
function fusePlan(items){ const c=Sys.stats.canFuse(S,Sys.host,items); if(c.ok||c.reason!=='money') return {c:c,res:c.result||null,gold:c.gold};
  const p=Sys.stats.canFuse(S,Object.assign({},Sys.host,{canSpendGold:()=>true}),items); return {c:c,res:p.result||null,gold:c.gold!=null?c.gold:p.gold}; }
function detFuse(narrow,G){ const g=G.find(o=>o.k===X.gkey); if(!g) return '<div class="f2-det" style="--rc:#55608f"><div class="f2-chn"><div class="f2-msg">'+(G.length?'Toque num grupo para ver a fusão.':'Junte 3 peças iguais (mesma era, espaço, raridade e estrelas; arma da mesma família) para fundir.')+'</div></div></div>';
  const it0=g.items[0], rc=rcol(it0), need=Q().fusion.count, mx=Q().stars.length;
  const head='<div class="f2-dt"><span class="f2-di0"><img src="'+icoOf(g.slot,it0,36)+'" alt=""></span><div class="f2-di"><div class="f2-dn">'+esc2(iName(it0))+' <span class="f2-rar" style="color:'+rc+'">'+esc2(rname(it0))+'</span></div>';
  if(g.st>=mx||g.items.length<need) return '<div class="f2-det" style="--rc:'+rc+'">'+head+'<div class="f2-dh">'+g.items.length+' iguais · '+starsH(g.st)+'</div></div></div><div class="f2-chn"><div class="f2-msg">'+(g.st>=mx?'<b>'+mx+' estrelas não funde</b>: já é a melhor qualidade.':'Faltam <b>'+(need-g.items.length)+'</b> iguais (mesma era, espaço, raridade e estrelas'+(g.slot==='weapon'?'; arma da mesma família':'')+').')+'</div></div></div>';
  const items=pick3(g), P=fusePlan(items), R=P.res, lack=P.c.reason==='money';
  if(!R) return '<div class="f2-det" style="--rc:'+rc+'">'+head+'<div class="f2-dh">'+g.items.length+' iguais · '+starsH(g.st)+'</div></div></div><div class="f2-chn"><div class="f2-msg">Não dá para fundir este grupo agora.</div></div></div>';
  const qa=items.reduce((t,x)=>t+qMul(qpOf(x)),0)/items.length, qb=qMul(R.qp), fa=fcNow(); let sw=0; try{ sw=Sys.fc.itemFC(S,Sys.host,R).swap||0; }catch(e){}
  return '<div class="f2-det" style="--rc:'+rc+'">'+head+'<div class="f2-dh">'+need+' iguais '+starsH(g.st)+' → 1 com '+starsH(g.st+1)+'</div></div></div>'
    +'<div class="f2-trio">'+items.map(x=>'<div class="q"><img src="'+icoOf(g.slot,x,30)+'" alt=""><small>Nv '+(x.lvl||1)+' · '+n0(qpOf(x))+'</small></div>').join('')+SV.goG+'<div class="q res"><img src="'+icoOf(g.slot,it0,30)+'" alt=""><small>Nv '+R.lvl+' · '+n0(R.qp)+'</small></div></div>'
    +'<div class="f2-sts" style="grid-template-columns:'+stsCols(narrow)+'">'
      +'<div class="up"><small>ESTRELAS</small><b>'+g.st+' → '+(g.st+1)+'</b><em>sem sorte</em></div>'
      +'<div class="'+(lack?'bad':'')+'"><small>OURO</small><b>'+esc2(P.gold!=null?kf(P.gold):'-')+'</b><em>só ouro</em></div>'
      +'<div class="up"><small>QUALIDADE</small><b>'+xq(qa)+' → '+xq(qb)+'</b><em>em tudo da peça</em></div>'
      +'<div><small>NÍVEL</small><b>'+R.lvl+'</b><em>o maior dos '+need+'</em></div></div>'
    +cmpHtml(items.some(isEq)?'FC DEPOIS DE FUNDIR':'FC SE EQUIPAR',fa,Math.max(0,fa+sw))
    +'<div class="f2-acts"><button class="f2-bt" data-x="fuse" aria-disabled="'+(!P.c.ok)+'"><span>Fundir '+need+' em 1</span><small>'+esc2(P.gold!=null?kf(P.gold):'-')+' de ouro</small></button></div>'
    +'<div class="f2-foot">O ouro investido das '+need+' fica no resultado. Extras e visual vêm da de maior qualidade.'+(lack?' <b>Falta ouro.</b>':'')+'</div></div>'; }
function bodyFuse(G){ const B=Q().stars, need=Q().fusion.count;
  let h='<div class="f2-sec"><span>Estrelas da qualidade</span><span>multiplica tudo da peça</span></div><div class="f2-bands">'+B.map((lo,i)=>{ const hi=i+1<B.length?B[i+1]-1:Q().top; return '<div><b>'+(i+1)+' est.</b><small>'+n0(lo)+'-'+n0(hi)+'</small><small>'+xq(qMul(lo))+'-'+xq(qMul(hi))+'</small></div>'; }).join('')+'</div>';
  h+='<div class="f2-sec"><span>Grupos de iguais</span><span>toque para ver</span></div>';
  if(!G.length) h+='<p class="f2-hint">Nenhum grupo de peças iguais na mochila.</p>';
  h+=G.map(g=>{ const it=g.items[0], can=g.items.length>=need&&g.st<B.length;
    return '<button class="f2-row'+(X.gkey===g.k?' on':'')+'" data-x="gsel" data-k="'+esc2(g.k)+'" aria-pressed="'+(X.gkey===g.k)+'" style="--rc:'+rcol(it)+'"><span class="f2-di0"><img src="'+icoOf(g.slot,it,34)+'" alt=""></span><span class="tx"><b>'+esc2(iName(it))+' x'+g.items.length+'</b><small>'+esc2(rname(it))+' · '+esc2(eraName(g.e))+' · '+starsH(g.st)+'</small></span><strong style="color:'+(can?'var(--green)':'var(--muted)')+'">'+(can?'pode fundir':g.st>=B.length?'não funde':'falta '+(need-g.items.length))+'</strong></button>'; }).join('');
  h+='<p class="f2-hint">'+need+' peças iguais viram 1 com mais uma estrela, pagando só ouro. A qualidade nova fica na mesma posição da média das '+need+', na faixa da estrela seguinte.</p>';
  return h; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240);
  if(locked()){ V.innerHTML=xWrap(d,'',gateHtml()); X.sig='gate'; return; }
  if(!slotOk(X.slot)) X.slot='weapon';
  if(X.tab==='fuse'&&!qOn()) X.tab='forge';
  let y0=0; try{ const sc0=X.top?null:document.getElementById('f2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  /* TELA BAIXA (QA: 320x640 e 360x640): pela altura que a tela tem (d.H), o palco encolhe (sem baixar de 166 px: 4 espaços de 40 px de toque), as margens
     apertam (.f2-sm) e os botões da aba Forjar sobem para logo abaixo da chance. REST = o que fica abaixo do palco até o fim do botão Forjar, com folga */
  const Hh=+d.H||0, narrow=(+d.Wb||390)<350, short=Hh>0&&Hh<(narrow?800:690), REST=400, SH=short?Math.max(166,Math.min(236,Math.round(Hh-REST))):236;
  let det='', body='';
  if(X.tab==='trans'){ const L=transList(); if(!L.some(o=>String(o.it.id)===String(X.tsel))) X.tsel=L.length?L[0].it.id:null; det=detTrans(narrow,L); body=bodyTrans(L); }
  else if(X.tab==='fuse'){ const G=groups(); if(!G.some(o=>o.k===X.gkey)) X.gkey=G.length?G[0].k:null; det=detFuse(narrow,G); body=bodyFuse(G); }
  else { det=detForge(narrow,short); body=bodyForge(); }
  const fly=X.fly&&now()-X.fly.t<1600?'<div class="f2-fly" aria-hidden="true" style="animation-delay:'+(X.fly.t-now())+'ms">'+esc2(X.fly.txt)+'</div>':'';
  V.innerHTML=xWrap(d,'','<div class="f2'+(short?' f2-sm':'')+(X.anim?' f2-in':'')+'"><div class="f2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div>'
    +stageHtml(SH)+fcRowHtml()+tabsHtml()
    /* AVISOS: linha PRÓPRIA no fluxo, entre as abas e o cartão "+N → +N+1", sempre presente (vazia sem aviso, para a tela não pular). Não é posicionada por
       cima de nada: não cobre o herói, nem o número, nem os botões. Uma faixa de resultado por vez, o "+FC" ao lado e a mensagem */
    +'<div class="f2-notes" id="f2_notes">'+banHtml(X.ban)
    +fly+'<div id="f2_toast">'+(X.toast&&now()-X.toastT<2000?toastHtml(X.toast):'')+'</div></div>'
    +'<div id="f2_scroll" class="f2-scroll x-scroll">'+det+body+'</div>'+askHtml()+'</div>');
  if(y0){ try{ const sc=document.getElementById('f2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (pedras e ouro caindo da batalha, era nova, nível): o tick redesenha só quando muda */
function sig(){ if(locked()) return 'gate'; try{ const c=Sys.forge.canTry(S,Sys.host,X.slot), st=stonesNow(); let x='';
    if(X.tab==='trans'){ const it=X.tsel!=null?byId(X.tsel):null, p=it?transPlan(it):null; x=[essence(),(S.inv||[]).length,p&&p.gold!=null?(canGold(p.gold)?1:0):'-'].join(','); }
    else if(X.tab==='fuse') x=[(S.inv||[]).length,S.nextId].join(',');
    return [X.tab,X.slot,c.reason,c.stones,c.gold,c.chance,st,c.gold>0?Math.min(40,Math.floor((+S.gold||0)/c.gold)):0,capNow(),wingOpen()?1:0,qOn()?1:0,f20()?1:0,x].join('|'); }catch(e){ return ''; } }

/* ================= ações ================= */
/* uma tentativa: quem decide, cobra e guarda a garantia é o Sys.forge; o resultado já fica gravado */
function tryOnce(sl){ const c=Sys.forge.canTry(S,Sys.host,sl); if(!c.ok) return {ok:false,reason:c.reason};
  const r=Sys.forge.attempt(S,Sys.host,sl); if(!r.ok) return r;
  if(r.success) call(typeof statsChanged==='function'?statsChanged:null); else { call(typeof save==='function'?save:null); call(typeof hud==='function'?hud:null); }
  return r; }
/* depois da tentativa: efeito no palco, faixa com o resultado e a FC que subiu */
function result(r,sl,w0,fc0,k,spent){ const w1=lvl('weapon'), cross=sl==='weapon'&&r.success&&tierOf(w1)!==tierOf(w0);
  X.fx={t:now(),ok:!!r.success,cross:cross,from:w0,to:w1};   if(r.success){ sfx('claim'); call(typeof vib==='function'?vib:null,40); const df=fcNow()-fc0; X.fly=df>0?{t:now(),txt:'+'+fcTxt(df)+' FC'}:null;
    /* uma faixa só (cabe na linha de avisos): ao cruzar a faixa da aura, a 2ª linha anuncia a aura nova */
    if(cross){ const a=auraOf(w1); banner('ok au',slotShort(sl)+' +'+r.lv+'!','Nova aura: '+a.name+(k>1?' · na '+k+'ª tentativa':'')); X.ban.col=acol(a); }
    else banner('ok',slotShort(sl)+' +'+r.lv+'!',k>1?'Conseguiu na '+k+'ª tentativa · '+pl(spent.stones,'pedra','pedras')+' · '+kf(spent.gold)+' de ouro':'Bônus do espaço '+pctB(bonusOf(r.lv))); }
  else { sfx('ui_tap'); X.fly=null; banner('no','Falhou, +'+pc(FD().pityPerFail)+' na próxima','Próxima: '+pc(Sys.forge.chance(S,sl))+' · o nível não cai'); }
  redraw(); }
function forgeOnce(){ if(X.busy) return; const sl=X.slot;
  if(wingShut(sl)){ sfx('ui_tap'); say(whyTxt('wing',sl)); return; }
  const fc0=fcNow(), w0=lvl('weapon'), r=tryOnce(sl);
  if(!r.ok){ sfx('ui_tap'); say(whyTxt(r.reason,sl)); return; }
  X.apv=null; result(r,sl,w0,fc0,1,null); }
/* "Forjar até conseguir": repete a MESMA tentativa do botão Forjar e para no acerto, ou quando acabam as pedras, ou quando acaba o ouro */
function autoStop(){ clearTimeout(X.t1); X.busy=false; X.auto=null; }
function autoForge(){ if(X.busy) return; const sl=X.slot;
  if(wingShut(sl)){ sfx('ui_tap'); say(whyTxt('wing',sl)); return; }
  const c0=Sys.forge.canTry(S,Sys.host,sl); if(!c0.ok){ sfx('ui_tap'); say(whyTxt(c0.reason,sl)); return; }
  X.busy=true; X.apv=null; X.ban=null; const fc0=fcNow(), w0=lvl('weapon'), A=X.auto={slot:sl,k:0,stones:0,gold:0};
  const step=()=>{ if(!X.busy||X.auto!==A) return; if(!isOn()){ autoStop(); return; }
    const r=tryOnce(sl);
    if(!r.ok){ autoStop(); sfx('ui_tap'); banner('no','Parou: '+whyShort(r.reason),pl(A.k,'tentativa','tentativas')+' · garantia agora +'+pc(pityOf(sl))+' · próxima '+pc(Sys.forge.chance(S,sl))); redraw(); return; }
    A.k++; A.stones+=r.stones||0; A.gold+=r.gold||0;
    if(r.success){ autoStop(); result(r,sl,w0,fc0,A.k,A); return; }
    sfx('ui_tap'); X.fx={t:now(),ok:false,cross:false,from:w0,to:w0}; redraw(); X.t1=setTimeout(step,reduced()?60:300); };
  step(); }
function doTrans(id){ const it=byId(id); X.ask=null; if(!it){ redraw(); return; } const c=transPlan(it);
  if(!transOk(c)){ say('Esta peça já está na sua era'); redraw(); return; }
  const P=transPay(c); if(!P.ess||!P.gold){ sfx('ui_tap'); say(P.ess?lackGold(c.gold):'Falta Essência da Era: ela vem do Senhor da Era e do Chefe de Era'); redraw(); return; }
  const eq=isEq(it), nm=iName(it); let r=null, dl=null;
  try{ const m=Sys.fc.measure(S,Sys.host,()=>Sys.stats.transform(S,Sys.host,it)); r=m.result; dl=m.delta; }catch(e){ if(!r){ try{ r=Sys.stats.transform(S,Sys.host,it); }catch(e2){ r=null; } } }
  if(!r||!r.ok){ sfx('ui_tap'); say('Não deu para transformar agora'); redraw(); return; }
  call(typeof ptrack==='function'?ptrack:null,'transform',1); call(typeof statsChanged==='function'?statsChanged:null); sfx('upgrade');
  X.tsel=null; X.fly=eq&&dl&&dl.diff>0?{t:now(),txt:'+'+fcTxt(dl.diff)+' FC'}:null;   banner('ok','Transformada!',nm+' agora é da '+eraName(r.to)); redraw(); }
/* item novo a partir do resultado do canFuse, no formato da mochila (mesma receita do js/p_fuse.js: o Sys.stats.fuse não mexe no save) */
function fuseMake(res,best){ let it; try{ it=typeof normItem==='function'?normItem(res):Object.assign({},res); }catch(e){ it=Object.assign({},res); }
  it.lvl=res.lvl; it.gold=res.gold; it.qp=res.qp; if(Number.isInteger(res.look)) it.look=res.look;
  if(it.slot==='wing'&&best&&best.wing){ let ok=false; try{ ok=!!Sys.stats.DATA.wingTypes[best.wing]; }catch(e){} if(ok) it.wing=best.wing; }
  const top=(S.inv||[]).reduce((m,x)=>Math.max(m,+(x&&x.id)||0),0); if(!(S.nextId>top)) S.nextId=top+1;
  it.id=S.nextId++; it.gotAt=now(); it.nw=1; try{ Sys.stats.ensureSubs(it); }catch(e){} return it; }
function doFuse(){ if(!qOn()) return; const g=groups().find(o=>o.k===X.gkey); if(!g){ redraw(); return; }
  if(g.st>=Q().stars.length||g.items.length<Q().fusion.count){ sfx('ui_tap'); say(g.st>=Q().stars.length?'Esta qualidade já é a melhor: não funde':'Faltam peças iguais para fundir'); return; }
  const items=pick3(g), c=Sys.stats.canFuse(S,Sys.host,items);
  if(!c.ok){ sfx('ui_tap'); say(c.reason==='money'?lackGold(c.gold):c.reason==='max'?'Esta qualidade já é a melhor: não funde':c.reason==='different'?'As peças precisam ser iguais':'Não dá para fundir agora'); return; }
  const slot=items[0].slot, wasEq=items.some(isEq), best=items.slice().sort((a,b)=>qpOf(b)-qpOf(a))[0], nm=iName(best); let made=null, rr=null;
  const run=()=>{ const r=Sys.stats.fuse(S,Sys.host,items); rr=r; if(!r||!r.ok) return r;
    const it=fuseMake(r.result,best), gone=r.consumed||items.map(x=>x.id);
    S.inv=S.inv.filter(x=>gone.indexOf(x.id)<0); S.inv.push(it); if(wasEq||gone.indexOf(S.eq[slot])>=0) S.eq[slot]=it.id; made=it; return r; };
  let dl=null; try{ dl=Sys.fc.measure(S,Sys.host,run).delta; }catch(e){ if(!rr) run(); }
  if(!made){ sfx('ui_tap'); say(rr&&rr.reason==='money'?lackGold(c.gold):'Não deu para fundir agora'); redraw(); return; }
  call(typeof statsChanged==='function'?statsChanged:null); sfx('upgrade');   /* mesmas chamadas do js/p_fuse.js */
  X.gkey=null; X.fly=dl&&dl.diff>0?{t:now(),txt:'+'+fcTxt(dl.diff)+' FC'}:null;   banner('ok',nm+': '+c.toStars+' estrelas','qualidade '+n0(qpOf(made))+' · '+xq(qMul(qpOf(made)))); redraw(); }

function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=b.dataset||{};
  if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; }
  if(a==='askno'){ sfx('ui_tap'); X.ask=null; redraw(); return; }
  if(X.busy) return;                                     /* durante o "Forjar até conseguir" o resto espera */
  if(a==='transok'){ doTrans(ds.id); return; }
  if(X.ask!=null) return;                                /* confirmação aberta: só Cancelar ou Transformar */
  if(a==='tab'){ const t=ds.t==='trans'?'trans':ds.t==='fuse'&&qOn()?'fuse':'forge'; sfx('ui_tap'); if(t===X.tab) return; X.tab=t; X.apv=null; X.top=true; redraw(); }
  else if(a==='slot'){ const s=ds.slot; sfx('ui_tap'); if(!slotOk(s)) return; if(wingShut(s)) say(whyTxt('wing',s)); X.slot=s; X.tab='forge'; X.apv=null; X.top=true; redraw(); }
  else if(a==='forge') forgeOnce();
  else if(a==='auto') autoForge();
  else if(a==='aura'){ const v=+ds.v||0, w=lvl('weapon'); sfx('ui_tap'); X.apv=(X.apv===v||(X.apv==null&&tierOf(v)===tierOf(w)))?null:v; redraw(); }
  else if(a==='pvout'){ sfx('ui_tap'); X.apv=null; redraw(); }
  else if(a==='tsel'){ sfx('ui_tap'); X.tsel=ds.id; X.top=true; redraw(); }
  else if(a==='trans'){ const it=byId(ds.id), c=it?transPlan(it):null; sfx('ui_tap'); if(!it||!transOk(c)) return; const P=transPay(c);
    if(!P.ess||!P.gold){ say(P.ess?lackGold(c.gold):'Falta Essência da Era: ela vem do Senhor da Era e do Chefe de Era'); return; } X.ask=it.id; redraw(); }
  else if(a==='gsel'){ if(!qOn()) return; sfx('ui_tap'); X.gkey=ds.k; X.top=true; redraw(); }
  else if(a==='fuse') doFuse();
}

const def=Panels.add('forge2',{title:'Forja',parent:'gear',render:draw,click:click,actions:ACTIONS,
  tick(){ if(X.busy||X.ask!=null) return; if(X.fx&&now()-X.fx.t<1700) return; if(X.sig&&isOn()&&sig()!==X.sig) redraw(); },
  busy(){ return X.busy; },
  onOpen(o){ autoStop(); X.anim=true; X.top=true; X.apv=null; X.fx=null; X.ban=null; X.fly=null; X.toast=''; X.ask=null; X.t0=0;
    X.tab=o&&o.tab==='trans'?'trans':o&&o.tab==='fuse'&&qOn()?'fuse':'forge'; if(o&&o.slot&&slotOk(o.slot)) X.slot=o.slot; },
  onClose(){ autoStop(); X.apv=null; X.fx=null; X.ban=null; X.fly=null; X.toast=''; X.ask=null;
    try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Forge2={X:X,actions:ACTIONS,def:def};
})();
