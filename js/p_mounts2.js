'use strict';
/* ================= MONTARIAS V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.mounts2) =================
   Protótipo: docs/proto/v2/Montarias.html · passagem: docs/proto/v2/PASSAGEM.md (seções 0 e 5). Não substitui o js/p_mounts.js: é outra tela ('mounts2').
   NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - Montaria (catálogo, posse, nível, teto, custo em ouro, estrelas, fragmentos, % de ATK e VIDA, aura por estrela, origem): Sys.mount
     (DATA, ensure, info, catalog, live, auraOf, pctOf, upgradeCost, canUpgrade, upgrade, equip);
   - lista das montarias LIGADAS e com arte: mountIds() do js/mountfx.js (a tela ainda confere Sys.mount.live uma a uma);
   - FC antes e depois: Sys.fc (compute, viewText, delta) · portão da tela: fbUnl('mount') / Sys.level;
   - origem "oferta de 1ª compra": só quando Sys.offer.DATA.mount aponta a montaria. O que o módulo não informa NÃO aparece.
   PALCO: window.drawHeroFull (js/battle.js) com state.mount = {id, stars}: herói ATUAL montado, arma equipada NA MÃO, aura por estrela e o PET POR
   ÚLTIMO (na frente). Herói sem folha montada naquela montaria (mountPrefix(id) nulo) ou modo "A pé": a imagem parada da montaria (MOUNT_REF do
   js/mountfx.js) atrás do herói a pé, com a aura desenhada por código pela ficha que o Sys.mount.auraOf informa.
   A ESTRELA SOBE SOZINHA no módulo (Sys.mount.addFragments): a tela mostra o progresso, não tem botão de subir estrela.
   O arquivo roda em escopo próprio (nenhum nome daqui chega às outras telas). Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('mounts2' in PANEL_ON)) PANEL_ON.mounts2=false;

const X={pv:null,apv:null,mode:'ride',undo:null,last:null,fly:null,toast:'',toastT:0,sig:'',anim:true,top:true,raf:0,t0:0,look:null};
const ACTIONS=['sel','pvout','mode','star','lvl','undo','offer','back'];
const ICON_DIR='assets/icons/mounts/', STILL_DIR='assets/mounts/';
/* enquadramento do herói MONTADO: os mesmos números do js/p_mounts.js (MT_RIDE): caixa quadrada com as patas na base e o herói a 26% da largura */
const RIDE={fx:(70.4+128*0.6-68)/304,k:256*0.6/304};

/* ---------- leituras dos módulos ---------- */
const M=()=>(window.Sys&&Sys.mount)||null;
const host=()=>(window.Sys&&Sys.host)||null;
const now=()=>Date.now();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const isOn=()=>typeof view!=='undefined'&&view==='mounts2';
const redraw=()=>{ if(isOn()&&typeof render==='function') render(); };
const call=(fn,a,b)=>{ try{ if(typeof fn==='function') return fn(a,b); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const ready=()=>{ const m=M(); return !!(m&&m.DATA&&m.DATA.on===true&&Array.isArray(m.DATA.mounts)&&typeof m.ensure==='function'&&typeof m.info==='function'); };
const sv=()=>M().ensure(S);
const defOf=id=>M().DATA.mounts.find(q=>q&&q.id===id)||null;
const info=id=>{ try{ return M().info(S,host(),id)||null; }catch(e){ return null; } };
const liveOk=d=>{ try{ const m=M(); return typeof m.live!=='function'||!!m.live(d); }catch(e){ return false; } };
/* montarias da tela: as LIGADAS e com arte (mountIds do js/mountfx.js), conferidas uma a uma no Sys.mount.live; sem a lista, nenhuma */
function ids(){ let l=[]; try{ if(typeof mountIds==='function') l=mountIds()||[]; }catch(e){ l=[]; }
  return l.map(d=>d&&typeof d==='object'?d.id:d).filter(id=>{ const d=defOf(id); return !!d&&!d.tbd&&liveOk(d); }); }
const catOf=id=>{ try{ return (M().catalog()||[]).find(c=>c&&c.id===id)||null; }catch(e){ return null; } };
const fileOf=id=>{ try{ return typeof mountFile==='function'?mountFile(id):id; }catch(e){ return id; } };
const iconOf=id=>ICON_DIR+fileOf(id)+'.png';
const refOf=id=>{ try{ return (typeof MOUNT_REF!=='undefined'&&MOUNT_REF[id])||null; }catch(e){ return null; } };
const stillUrl=id=>{ const r=refOf(id); return r&&r.f?STILL_DIR+r.f+'.png':''; };
const canRide=id=>{ try{ return typeof window.drawHeroFull==='function'&&typeof MOUNT_TBL!=='undefined'&&!!MOUNT_TBL[id]&&typeof mountPrefix==='function'&&!!mountPrefix(id)&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
const starMax=()=>{ try{ if(typeof mountStarMax==='function') return mountStarMax(); }catch(e){} try{ return Math.max(1,M().DATA.maxStars|0); }catch(e){ return 1; } };
const auraOf=n=>{ try{ return M().auraOf(n)||null; }catch(e){ return null; } };
const auraCol=n=>{ try{ if(typeof MOUNT_AURA!=='undefined'&&MOUNT_AURA[n]) return MOUNT_AURA[n]; }catch(e){} return 'rgba(200,230,255,'; };
const pctOf=(id,l,s)=>{ try{ return +M().pctOf(id,l,s)||0; }catch(e){ return 0; } };
const powR=inf=>(inf&&typeof inf.powerRarity==='number'?inf.powerRarity:(inf?inf.rarity:0))|0;   /* raridade do PODER (Sys.mount.info().powerRarity): estrela plana e custo seguem ela, não a do visual */
const canUp=id=>{ try{ return M().canUpgrade(S,host(),id)||{ok:false,reason:'off',gold:0}; }catch(e){ return {ok:false,reason:'off',gold:0}; } };
const heroName=()=>{ try{ return S.hero==='kaia'?'Kaia':'Kael'; }catch(e){ return 'Kael'; } };
const plvNow=()=>{ try{ return plv()|0; }catch(e){ return 0; } };
const rcol=r=>{ try{ return RC[clamp(r|0,0,RC.length-1)]; }catch(e){ return '#a9b3c9'; } };
const fcNow=()=>{ try{ return Sys.fc.compute(S,host()); }catch(e){ return 0; } };
const fcTxt=v=>{ try{ return Sys.fc.viewText(v); }catch(e){ return String(Math.round(v)); } };
const fcDelta=(a,b)=>{ try{ return Sys.fc.delta(a,b); }catch(e){ return {text:'',color:'#9aa6d6',diff:b-a}; } };
const gold=v=>{ try{ return typeof kf==='function'?kf(v):n0(v); }catch(e){ return String(Math.round(v)); } };
const dec=v=>String(Math.round((+v||0)*100)/100).replace('.',',');
const pc=v=>'+'+dec(v)+'%';
const stTxt=n=>n0(n)+(n===1?' estrela':' estrelas');
/* FC com a montaria EM USO num nível ou numa estrela diferente: o Sys.fc não tem opção de prévia, então a ficha muda só durante esta conta e volta */
function fcWith(id,ch){ let x=null; try{ x=sv().owned[id]; }catch(e){ x=null; } if(!x) return fcNow(); const l=x.lvl, s=x.stars;
  try{ if(ch.lvl) x.lvl=ch.lvl; if(ch.stars) x.stars=ch.stars; return Sys.fc.compute(S,host()); }catch(e){ return fcNow(); } finally{ x.lvl=l; x.stars=s; } }
/* FC se o jogador tivesse e usasse a montaria da prévia (nível 1, 1 estrela): entra e sai do save dentro desta conta; fragmentos guardados e a equipada voltam como estavam */
function fcIfHad(id){ let o=null; try{ o=sv(); }catch(e){ return fcNow(); } if(o.owned[id]) return fcNow(); const eq0=o.eq, st0=o.stored[id];
  try{ o.owned[id]={stars:1,frags:0,lvl:1,gold:0}; o.eq=id; return Sys.fc.compute(S,host()); }catch(e){ return 0; }
  finally{ const o2=S.sys.mount; delete o2.owned[id]; o2.eq=eq0&&o2.owned[eq0]?eq0:null; if(st0) o2.stored[id]=st0; } }
/* portão: a mesma regra do MENU (fbUnl do js/fullbattle.js); sem ela, o nível do Sys.level. Quem JÁ tem montaria entra antes. */
function gateLv(){ try{ const L=Sys.level; if(L&&typeof L.unlockLevel==='function'){ const v=L.unlockLevel('mount'); if(v>0) return v; } const U=L&&L.DATA&&L.DATA.unlock; if(U&&typeof U.mount==='number') return U.mount; }catch(e){} return 0; }
function levelOk(){ try{ if(typeof PANEL_V2!=='undefined'&&PANEL_V2.gate===false) return true; if(typeof fbUnl==='function') return !!fbUnl('mount'); const n=gateLv(); return !n||plvNow()>=n; }catch(e){ return true; } }
const locked=(list,o)=>!levelOk()&&!list.some(id=>o.owned[id]);
/* origem: só o que os módulos informam. Sys.mount.catalog().src (texto do módulo) e a oferta de 1ª compra quando o Sys.offer aponta esta montaria */
const offerHas=id=>{ try{ return !!(window.Sys&&Sys.offer&&Sys.offer.DATA&&Sys.offer.DATA.mount===id); }catch(e){ return false; } };
const offerOpen=()=>{ try{ return !!(window.Panels&&Panels.on('offer')&&Sys.offer&&typeof Sys.offer.status==='function'&&Sys.offer.status(S,host()).available===true); }catch(e){ return false; } };
function srcOf(id){ const c=catOf(id), out=(c&&Array.isArray(c.src)?c.src:[]).map(String).filter(Boolean); if(offerHas(id)) out.unshift('Oferta de 1ª compra'); return out; }
const playerMax=()=>{ try{ return Sys.level.DATA.maxLevel|0; }catch(e){ return 0; } };
const capTxt=c=>{ const nl=c&&c.needLevel|0, mx=playerMax(); return mx&&nl>mx?'nível do jogador no máximo':'jogador Nv '+n0(nl); };

/* ---------- desenhos pequenos (sem emoji) ---------- */
const SV={
  go:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9aa6d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  lock:'<svg viewBox="0 0 24 24" width="14" height="14" fill="#c9d0f5" aria-hidden="true"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"/></svg>',
  star:(on,px)=>'<svg viewBox="0 0 24 24" width="'+px+'" height="'+px+'" aria-hidden="true" style="flex:none"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="'+(on?'#ffd25e':'rgba(255,255,255,.12)')+'" stroke="'+(on?'#9a5a10':'rgba(160,180,255,.4)')+'" stroke-width="1.4" stroke-linejoin="round"/></svg>'
};
const starsH=(k,px)=>{ const mx=starMax(); let h=''; for(let i=1;i<=mx;i++) h+=SV.star(i<=k,px); return '<span class="m2-stars" role="img" aria-label="'+k+' de '+mx+' estrelas">'+h+'</span>'; };

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.m2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--violet:#a97bff;--green:#5ef0a0;--red:#ff6b6b;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.m2 *{box-sizing:border-box}
.m2 button{color:inherit;font-family:inherit;cursor:pointer}
.m2-in{animation:m2-fade .22s ease-out}
.m2-bg{position:absolute;left:0;right:0;top:0;height:380px;pointer-events:none;background:radial-gradient(110% 40% at 50% 24%,rgba(255,210,94,.16),transparent 60%),radial-gradient(70% 30% at 50% 58%,rgba(94,231,255,.14),transparent 70%),linear-gradient(180deg,#1a1440 0%,#141a4c 40%,var(--night) 100%)}
.m2-stage{position:relative;z-index:2;flex:none}
.m2-who{position:absolute;z-index:3;left:8px;top:4px;display:flex;align-items:center;gap:6px;min-height:26px;line-height:1.1;max-width:calc(100% - 150px);padding:0 10px;border-radius:13px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap}
.m2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.m2-who span{overflow-wrap:anywhere;min-width:0}
.m2 button.m2-who,.xs button.m2-who{min-height:40px;padding:0 5px 0 10px;border-radius:20px;border-color:var(--gold);color:var(--gold);background:linear-gradient(90deg,rgba(60,44,10,.92),rgba(40,26,8,.92))}
button.m2-who i{background:var(--gold);box-shadow:0 0 8px var(--gold)}
button.m2-who u{flex:none;text-decoration:none;height:28px;line-height:28px;padding:0 11px;border-radius:14px;background:var(--gold);color:var(--ink);font-size:12px}
.m2-mode{position:absolute;z-index:3;right:8px;top:4px;display:flex;gap:2px;padding:2px;border-radius:14px;background:rgba(5,8,28,.72);border:1px solid var(--line)}
.m2 .m2-mode button,.xs .m2-mode button{border:0;background:none;min-height:40px;min-width:48px;padding:0 9px;border-radius:11px;font-weight:900;font-size:11px;color:var(--muted)}
.m2 .m2-mode button[aria-pressed="true"],.xs .m2-mode button[aria-pressed="true"]{background:#3d4fb8;color:#fff}
.m2-note{position:relative;z-index:3;flex:none;margin:0 12px 2px;padding:3px 9px;border-radius:11px;background:var(--glass);border:1px solid var(--line2);font-size:10px;font-weight:800;color:var(--muted);line-height:1.25;overflow-wrap:anywhere;text-align:center;pointer-events:none}
.m2-note b{color:var(--gold)}
.m2-fcrow{position:relative;z-index:3;flex:none;display:flex;align-items:center;gap:8px;margin:2px 12px 0;padding:4px 10px 4px 12px;border-radius:16px;background:linear-gradient(90deg,rgba(255,210,94,.16),rgba(10,14,44,.85) 60%);border:1px solid rgba(255,210,94,.5);min-width:0}
.m2-fcb{flex:1;min-width:0}
.m2-fcb small{display:block;font-size:9px;letter-spacing:1.2px;color:var(--gold);font-weight:900}
.m2-fcb b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:26px;line-height:1;color:var(--gold);text-shadow:0 0 14px rgba(255,210,94,.55),0 2px 0 rgba(0,0,0,.4);white-space:normal;overflow-wrap:anywhere}
.m2-chip{flex:0 1 auto;min-width:0;display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:10px;font-weight:900;color:var(--muted);text-align:right}
.m2-chip span{max-width:100%;white-space:normal;overflow-wrap:anywhere}
.m2-chip b{color:var(--text);font-size:12px}
.m2-fix{position:relative;z-index:3;flex:none;margin:6px 12px 0;min-width:0}
.m2-scroll{position:relative;z-index:3;flex:1;min-height:0;padding:8px 12px 20px}
.m2-det{position:relative;padding:8px 10px;border-radius:14px;background:linear-gradient(90deg,#1b2459,#141c4a);border:1px solid var(--rc);min-width:0}
.m2-scroll .m2-det{margin-bottom:8px}
.m2-dt{display:flex;gap:9px;align-items:center;min-width:0}
.m2-th{flex:none;width:46px;height:40px;border-radius:11px;border:2px solid var(--rc);background:#0c1238;overflow:hidden;display:block}
.m2-th img{width:100%;height:100%;object-fit:contain;display:block}
.m2-di{flex:1;min-width:0}
.m2-tag{display:inline-block;font-size:9px;font-weight:900;letter-spacing:1px;padding:1px 6px;border-radius:6px;background:var(--gold);color:var(--ink);vertical-align:2px;margin-right:4px}
.m2-tag.eq{background:var(--green);color:#043018}
.m2-dn{font-weight:900;font-size:14px;white-space:normal;overflow-wrap:anywhere}
.m2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--rc)}
.m2-dh{font-size:11px;color:var(--muted);font-weight:800;white-space:normal;overflow-wrap:anywhere}
.m2-stars{flex:none;display:inline-flex;gap:1px}
.m2-lvb{margin-top:6px;position:relative;height:20px;border-radius:10px;background:rgba(5,8,28,.6);border:1px solid var(--line);overflow:hidden}
.m2-lvb>i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22c47a,#7dffb8);border-radius:10px;transition:width .25s}
.m2-lvb>i.cap{background:linear-gradient(90deg,#f4a52a,#ffe58a)}
.m2-lvb>i.fr{background:linear-gradient(90deg,#7a54d8,#c3a3ff)}
.m2-lvb span{position:relative;display:flex;justify-content:space-between;gap:6px;padding:0 9px;line-height:18px;font-size:11px;font-weight:900;white-space:nowrap;text-shadow:0 1px 2px #000}
.m2-lvb span b{flex:none}
.m2-lvb span em{font-style:normal;overflow-wrap:anywhere;min-width:0}
.m2-cmp{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;margin-top:6px;padding:5px 8px;border-radius:10px;background:rgba(5,8,28,.55);font-weight:900;font-size:12px;min-width:0}
.m2-cmp small{font-size:9px;letter-spacing:1px;color:var(--muted);flex:0 1 auto;min-width:0;overflow-wrap:anywhere}
.m2-cmp .a{color:var(--muted);white-space:nowrap}
.m2-cmp .b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;color:var(--gold);white-space:nowrap}
.m2-cmp .b.p{color:var(--cyan)}
.m2-cmp .d{margin-left:auto;white-space:nowrap}
.m2-acts{display:flex;gap:6px;margin-top:7px}
.m2 .m2-bt,.xs .m2-bt{flex:1 1 0;min-width:0;min-height:44px;padding:2px 6px;border-radius:11px;border:0;font-weight:900;font-size:12px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:var(--ink);box-shadow:0 3px 0 #9a5a10;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:0;text-align:center}
.m2 button.m2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.m2-bt span{max-width:100%;white-space:normal;overflow-wrap:anywhere}
.m2-bt small{font-size:10px;font-weight:800;opacity:.9;max-width:100%;white-space:normal;overflow-wrap:anywhere}
.m2 .m2-bt.blue,.xs .m2-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);color:#04223f;box-shadow:0 3px 0 #164e8c}
.m2 .m2-bt.on,.xs .m2-bt.on{background:rgba(94,240,160,.12);color:var(--green);box-shadow:none;border:2px solid var(--green)}
.m2 .m2-bt.off,.xs .m2-bt.off,.m2 .m2-bt[aria-disabled="true"],.xs .m2-bt[aria-disabled="true"]{background:rgba(255,255,255,.06);color:var(--muted);box-shadow:none;border:1px solid var(--line);transform:none}
.m2-src{margin:6px 0 0;font-size:11px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
.m2-src b{color:var(--gold)}
.m2-pan{border-radius:16px;background:var(--glass);border:1px solid var(--line);padding:10px;margin-bottom:8px;min-width:0}
.m2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:0 0 7px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.m2-sec span:first-child{flex:none}
.m2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right;min-width:0;overflow-wrap:anywhere}
.m2-sec b{color:var(--text)}
.m2-hint{font-size:11px;color:var(--muted);margin:7px 0 0;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.m2-hint b{color:var(--gold)}
.m2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.m2 .m2-cell,.xs .m2-cell{position:relative;min-width:0;min-height:88px;border-radius:12px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#27337e,#0c1238 78%);padding:0 0 4px;display:flex;flex-direction:column;align-items:stretch;overflow:hidden;color:var(--text)}
.m2-cell.sel{outline:3px solid var(--gold);outline-offset:1px}
.m2-cell .pi{display:block;width:100%;aspect-ratio:1/.8;position:relative}
.m2-cell .pi img{position:absolute;left:7%;top:4%;width:86%;height:96%;object-fit:contain;object-position:50% 80%}
.m2-cell.lk .pi img{filter:grayscale(1) brightness(.55)}
.m2-cell .cn{font-size:10px;font-weight:900;text-align:center;white-space:normal;overflow-wrap:anywhere;padding:0 3px;line-height:13px}
.m2-cell .cs{font-size:9px;font-weight:900;text-align:center;white-space:normal;overflow-wrap:anywhere;padding:0 3px;line-height:12px;color:var(--muted)}
.m2-cell .cs.r{color:var(--rc)}
.m2-cell .bdg{position:absolute;left:3px;top:3px;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px;letter-spacing:.3px;line-height:10px;background:var(--green);color:#043018}
.m2-cell .lki{position:absolute;right:4px;top:4px;display:block;line-height:0}
.m2-cell .ss{display:flex;justify-content:center}
.m2-cell .fb{display:block;height:4px;margin:2px 6px 0;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden}
.m2-cell .fb i{display:block;height:100%;background:linear-gradient(90deg,#7a54d8,#c3a3ff)}
.m2-st{display:grid;gap:5px}
.m2 .m2-sc,.xs .m2-sc{min-width:0;min-height:76px;border-radius:11px;border:1px solid var(--line2);background:rgba(5,8,28,.5);padding:5px 2px 4px;display:flex;flex-direction:column;align-items:center;gap:1px;overflow:hidden;color:var(--text)}
.m2 .m2-sc[aria-pressed="true"]{border:2px solid var(--gold)}
.m2-sc.no{opacity:.62}
.m2-sc b{font-size:12px;font-weight:900;color:var(--gold);display:inline-flex;align-items:center;gap:2px}
.m2-sc i{display:block;width:26px;height:26px;border-radius:50%;margin:1px 0;flex:none}
.m2-sc small{font-size:9px;font-weight:900;text-align:center;color:var(--muted);white-space:normal;overflow-wrap:anywhere;max-width:100%;padding:0 2px}
.m2-sc small.v{color:var(--text)}
.m2-kv{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;padding:4px 0;border-top:1px solid rgba(130,150,255,.15);min-width:0}
.m2-kv.k0{border-top:0}
.m2-kv span:first-child{color:var(--muted);flex:0 1 auto;min-width:0;overflow-wrap:anywhere}
.m2-kv span:last-child{text-align:right;min-width:0;overflow-wrap:anywhere}
.m2-msg{color:var(--muted);font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.m2-msg b{color:var(--gold)}
.m2-fly{position:absolute;z-index:40;left:50%;transform:translateX(-50%);font-family:'Lilita One',Nunito,sans-serif;font-size:24px;pointer-events:none;animation:m2-fly 1.6s ease-out both;text-shadow:0 2px 0 rgba(0,0,0,.5);white-space:nowrap}
.m2-toast{position:absolute;left:50%;top:48px;z-index:40;transform:translateX(-50%);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;animation:m2-tin 2.2s ease both;max-width:calc(100% - 24px);overflow-wrap:anywhere;pointer-events:none}
.m2-gate{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 28px;text-align:center;position:relative}
@keyframes m2-fade{from{opacity:0}}
@keyframes m2-tin{0%{opacity:0;transform:translate(-50%,-8px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
@keyframes m2-fly{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}100%{opacity:0;transform:translate(-50%,-60px)}}
@media (prefers-reduced-motion:reduce){.m2-in{animation:none}.m2-fly,.m2-toast{animation-timing-function:step-end}}
`; document.head.appendChild(st); })();

/* ---------- avisos (dentro da tela; nada de diálogo do navegador) ---------- */
const toastHtml=m=>'<div class="m2-toast" role="status">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('m2_toast'); if(el) el.innerHTML=toastHtml(X.toast); }catch(e){} }
function flyFc(d){ X.fly=Math.abs(d)>=1?{t:now(),up:d>0,txt:(d>0?'+':'−')+fcTxt(Math.abs(d))+' FC'}:null; }

/* ================= PALCO (canvas) ================= */
const SEED=[]; for(let i=0;i<50;i++) SEED.push([((i*7919)%997)/997,((i*104729)%991)/991,((i*1299709)%983)/983]);
/* imagem parada da montaria (MOUNT_REF): uma só na memória, reduzida UMA vez para um desenho pequeno; o arquivo grande é solto */
const STILL={id:null,o:null}, STILL_W=384;
function still(id){ if(STILL.id===id&&STILL.o) return STILL.o; const o={c:null,ok:false,fail:false,bb:null}; STILL.id=id; STILL.o=o; const u=stillUrl(id);
  if(!u||typeof Image!=='function'||typeof document==='undefined'){ o.fail=true; return o; }
  try{ const im=new Image(); im.onerror=()=>{ o.fail=true; };
    im.onload=()=>{ if(STILL.o!==o) return; try{ const w=im.naturalWidth, h=im.naturalHeight; if(!(w>0&&h>0)){ o.fail=true; return; }
        const s=Math.min(1,STILL_W/w), c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w*s)); c.height=Math.max(1,Math.round(h*s)); const g=c.getContext('2d',{willReadFrequently:true}); g.drawImage(im,0,0,w,h,0,0,c.width,c.height);
        let bb={l:0,r:c.width,t:0,b:c.height};
        try{ const d=g.getImageData(0,0,c.width,c.height).data, W=c.width, H=c.height; let l=W, r=-1, t=H, b=-1;
          for(let y=0;y<H;y++){ const row=y*W*4+3; for(let x=0;x<W;x++) if(d[row+x*4]>140){ if(x<l) l=x; if(x>r) r=x; if(y<t) t=y; if(y>b) b=y; } }
          if(r>l&&b>t) bb={l:l,r:r+1,t:t,b:b+1}; }catch(e){}
        o.c=c; o.bb=bb; o.ok=true; }catch(e){ o.fail=true; } };
    im.src=u; }catch(e){ o.fail=true; }
  return o; }
function ground(x,u,t,cx,gy,rx){ const g=x.createRadialGradient(cx,gy,10*u,cx,gy,rx); g.addColorStop(0,'rgba(94,231,255,.3)'); g.addColorStop(1,'rgba(94,231,255,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(cx,gy,rx,rx*0.15,0,0,7); x.fill();
  x.strokeStyle='rgba(255,210,94,.5)'; x.setLineDash([5*u,6*u]); x.lineDashOffset=-t*10*u; x.lineWidth=1.5*u; x.beginPath(); x.ellipse(cx,gy,rx*0.84,rx*0.11,0,0,7); x.stroke(); x.setLineDash([]); }
/* luz no chão, maior a cada estrela (a ficha da aura vem do Sys.mount.auraOf; a cor, do MOUNT_AURA do js/mountfx.js) */
function auraGround(x,u,t,st,cx,gy,w){ const A=auraOf(st); if(!A||!(A.glow>0)) return; const col=auraCol(st), pu=0.5+0.2*Math.sin(t*2.4), r=w*(0.42+0.04*st);
  const g=x.createRadialGradient(cx,gy,4*u,cx,gy,r); g.addColorStop(0,col+Math.min(0.9,(0.18+0.07*A.glow)*pu*2).toFixed(3)+')'); g.addColorStop(1,col+'0)'); x.fillStyle=g; x.beginPath(); x.ellipse(cx,gy,r,r*0.2,0,0,7); x.fill(); }
/* clarão e fumaça ATRÁS da montaria parada (no herói montado quem desenha o halo e a fumaça é o próprio jogo) */
function auraStill(x,u,t,st,cx,gy,w,h){ const A=auraOf(st); if(!A||!(A.glow>0)) return; const col=auraCol(st), pu=0.5+0.2*Math.sin(t*2.4), cy=gy-h*0.45, r=w*(0.5+0.05*st);
  const g=x.createRadialGradient(cx,cy,w*0.06,cx,cy,r); g.addColorStop(0,col+Math.min(0.95,(0.22+0.12*A.glow)*(0.75+pu*0.5)).toFixed(3)+')'); g.addColorStop(0.55,col+(0.3*pu+0.1).toFixed(3)+')'); g.addColorStop(1,col+'0)'); x.fillStyle=g; x.fillRect(cx-r,cy-r,r*2,r*2);
  if(A.smoke){ const N=A.glow>=3?16:10; for(let i=0;i<N;i++){ const s=SEED[i], p=(t*(0.18+0.1*s[2])+s[0])%1, px=cx+(s[1]-0.5)*w*0.95+Math.sin(t*0.8+i)*6*u, py=gy+4*u-p*h*0.62, rr=(8+p*(18+6*A.glow))*u, a=Math.sin(Math.PI*p)*(A.glow>=3?0.26:0.2);
      const sg=x.createRadialGradient(px,py,u,px,py,rr); sg.addColorStop(0,col+a.toFixed(3)+')'); sg.addColorStop(1,col+'0)'); x.fillStyle=sg; x.beginPath(); x.arc(px,py,rr,0,7); x.fill(); } } }
/* partículas subindo NA FRENTE, só quando a ficha da aura diz que tem (particles) */
function auraFront(x,u,t,st,cx,gy,w,h){ const A=auraOf(st); if(!A||!A.particles) return; const col=auraCol(st);
  x.save(); x.globalCompositeOperation='lighter';
  for(let i=0;i<22;i++){ const s=SEED[i+12], p=(t*(0.22+0.12*s[2])+s[0])%1, px=cx+(s[1]-0.5)*w+Math.sin(t*2+i)*4*u, py=gy+2*u-p*h*0.85, r=(1.2+2.2*(1-p)*s[2]+0.6)*u;
    x.fillStyle=(i%3?col:'rgba(255,255,230,')+(Math.sin(Math.PI*p)*0.9).toFixed(3)+')'; x.beginPath(); x.arc(px,py,r,0,7); x.fill();
    if(i%4===0){ x.strokeStyle=x.fillStyle; x.lineWidth=0.8*u; x.beginPath(); x.moveTo(px-r*2.2,py); x.lineTo(px+r*2.2,py); x.moveTo(px,py-r*2.2); x.lineTo(px,py+r*2.2); x.stroke(); } }
  x.restore(); }
function stillDraw(x,u,t,id,cx,gy,w,maxH){ const o=still(id), R=refOf(id)||{}; x.save(); x.globalAlpha=0.3; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(cx,gy+3*u,w*0.38,9*u,0,0,7); x.fill(); x.restore();
  if(!o.ok||!o.c) return; const bb=o.bb, bw=Math.max(1,bb.r-bb.l), bh=Math.max(1,bb.b-bb.t), s=Math.min(w/bw,maxH/bh)*(R.rs>0?R.rs:1), br=1+0.012*Math.sin(t*2.2);
  x.save(); x.translate(cx,gy+3*u); x.scale((R.face==='L'?-1:1)*s,s*br); x.drawImage(o.c,-(bb.l+bb.r)/2,-bb.b); x.restore(); }
/* o herói é o do jogo: arma na mão, asa nas costas e o pet por último (na frente) */
function hero(x,px,py,k,state){ if(typeof window.drawHeroFull!=='function'||!(typeof HS==='number'&&HS>0)) return; window.drawHeroFull(x,px,py,k,state); }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||236;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'), W=c.width, H=c.height, u=W/w, base=()=>x.setTransform(1,0,0,1,0,0);
  base(); x.clearRect(0,0,W,H);
  const L=X.look||{}, id=L.id||null, st=clamp((L.st|0)||1,1,starMax()), ride=!!id&&X.mode==='ride'&&canRide(id), gy=H-14*u;
  const part=fn=>{ try{ fn(); }catch(e){ try{ x.restore(); }catch(e2){} } base(); };
  if(ride){ const B=Math.min(H*0.9,W*0.62), bl=(W-B)/2-W*0.07, cx=bl+B*0.5;
    part(()=>ground(x,u,t,cx,gy,B*0.62)); part(()=>auraGround(x,u,t,st,cx,gy,B));
    part(()=>hero(x,bl+B*RIDE.fx,gy,B*RIDE.k/HS,{t:t,mount:{id:id,stars:st}}));
    part(()=>auraFront(x,u,t,st,cx,gy,B*0.9,B*0.75)); }
  else { const hk=Math.min(0.8,(h-30)/256)*u, hx=id?W*0.32:W*0.5, mw=Math.min(W*0.5,H*0.9), mh=H*0.78, mx=W*0.6;
    part(()=>ground(x,u,t,W*0.5,gy,Math.min(W*0.4,150*u)));
    if(id){ part(()=>auraGround(x,u,t,st,mx,gy,mw)); part(()=>auraStill(x,u,t,st,mx,gy,mw,mh)); part(()=>stillDraw(x,u,t,id,mx,gy,mw,mh)); }
    part(()=>hero(x,hx,gy,hk*256/HS,{t:t,mount:false}));
    if(id) part(()=>auraFront(x,u,t,st,mx,gy,mw,mh)); } }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('m2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('m2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }

/* ================= HTML ================= */
const backBt=(txt)=>'<button class="m2-bt" data-x="back" style="position:relative;flex:none;min-height:48px;padding:0 26px;font-size:15px"><span>'+txt+'</span></button>';
function soonHtml(){ return '<div class="m2"><div class="m2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div><div class="m2-gate"><span class="lil" style="font-size:24px">Montarias: em breve</span>'+backBt('Voltar')+'</div></div>'; }
function gateHtml(){ const lv=gateLv(), off=offerOpen();
  return '<div class="m2"><div class="m2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div><div class="m2-gate" role="dialog" aria-label="Montarias bloqueadas"><span class="lil" style="font-size:26px">Montarias</span>'
    +'<span style="padding:6px 14px;border-radius:999px;border:2px solid var(--gold);color:var(--gold);font-size:15px;font-weight:900">'+(lv?'Libera no nível '+n0(lv):'Ainda não liberado')+'</span>'
    +'<span class="m2-msg">Você está no nível '+n0(plvNow())+'. Continue lutando para liberar.</span>'
    +(off?'<button class="m2-bt blue" data-x="offer" style="flex:none;min-height:48px;padding:0 26px;font-size:14px"><span>Ver oferta de 1ª compra</span></button>':'')
    +backBt('Voltar')+'</div></div>'; }

/* o que vai para o palco e para a faixa: a prévia (montaria que o jogador não tem), senão a montaria em uso */
function shown(o,list){ if(X.pv&&(list.indexOf(X.pv)<0||o.owned[X.pv])) X.pv=null; if(X.pv) return X.pv; return o.eq&&o.owned[o.eq]&&list.indexOf(o.eq)>=0?o.eq:null; }

function stageHtml(SH,id,inf,o){ const own=!!(inf&&inf.owned), ride=!!id&&X.mode==='ride'&&canRide(id);
  let who;
  if(X.pv&&inf) who='<button class="m2-who" data-x="pvout" aria-label="Sair da prévia de '+esc2(inf.name)+'"><i></i><span>Prévia: '+esc2(inf.name)+'</span><u>Sair</u></button>';
  else if(X.apv&&inf) who='<button class="m2-who" data-x="pvout" aria-label="Sair da prévia da aura"><i></i><span>Prévia da aura: '+esc2(stTxt(X.apv))+'</span><u>Sair</u></button>';
  else who='<div class="m2-who"><i></i><span>'+esc2(heroName())+' · Nível '+n0(plvNow())+(own?' · '+esc2(inf.name)+' · '+esc2(stTxt(inf.stars|0)):'')+'</span></div>';
  let note='';
  if(id&&inf){ if(X.mode==='ride'&&!ride) note=esc2(heroName())+' ainda não tem arte montada em <b>'+esc2(inf.name)+'</b>: a montaria fica parada atrás do herói';
    else if(X.mode==='foot') note='A pé: a montaria fica parada atrás do herói'; }
  const alt=id&&inf?heroName()+(ride?' montando ':' com ')+inf.name+', com a aura das estrelas e o pet na frente':heroName()+' sem montaria, com o pet na frente';
  return '<div class="m2-stage" style="height:'+SH+'px"><canvas id="m2_stc" role="img" aria-label="'+esc2(alt)+'" style="position:absolute;left:0;top:0;width:100%;height:100%"></canvas>'+who
    +'<div class="m2-mode" role="group" aria-label="Como mostrar o herói"><button data-x="mode" data-m="ride" aria-pressed="'+(X.mode==='ride')+'">Montado</button><button data-x="mode" data-m="foot" aria-pressed="'+(X.mode==='foot')+'">A pé</button></div>'
    +'</div>'+(note?'<div class="m2-note">'+note+'</div>':''); }   /* o aviso fica ABAIXO do palco (não cobre o herói nem a montaria) */

function fcRowHtml(o,list){ const own=list.filter(q=>o.owned[q]).length, e=o.eq&&o.owned[o.eq]?info(o.eq):null;
  return '<div class="m2-fcrow"><div class="m2-fcb"><small>PODER (FC)</small><b>'+esc2(fcTxt(fcNow()))+'</b></div>'
    +'<div class="m2-chip"><span>Montarias <b>'+own+'/'+list.length+'</b></span><span>ATK e VIDA '+pc(e?e.pct:0)+'</span></div></div>'; }

const cmpFc=(lab,a,b)=>{ const d=fcDelta(a,b); return '<div class="m2-cmp"><small>'+lab+'</small><span class="a">'+esc2(fcTxt(a))+'</span>'+SV.go+'<span class="b">'+esc2(fcTxt(b))+'</span><span class="d" style="color:'+esc2(d.color||'#9aa6d6')+'">'+(d.text?esc2(d.text):'igual')+'</span></div>'; };
const cmpPct=(lab,a,b)=>{ const df=Math.round((b-a)*100)/100, col=df>0?'var(--green)':df<0?'var(--red)':'var(--muted)';
  return '<div class="m2-cmp"><small>'+lab+'</small><span class="a">'+pc(a)+'</span>'+SV.go+'<span class="b p">'+pc(b)+'</span><span class="d" style="color:'+col+'">'+(df?(df>0?'+':'−')+dec(Math.abs(df))+'%':'igual')+'</span></div>'; };
const thumb=id=>'<span class="m2-th"><img src="'+esc2(iconOf(id))+'" alt=""></span>';

/* ----- faixa: a montaria EM USO (nível com o teto, % agora → depois, FC antes → depois, Subir nível, estrela, Usando / Desfazer) ----- */
function detOwned(id,inf){ const D=M().DATA, rc=rcol(inf.rarity), mx=D.maxStars|0, cu=canUp(id), lvl=inf.lvl|0, st=inf.stars|0, cap=inf.cap|0, p0=+inf.pct||0, need=inf.need|0, fr=inf.frags|0;
  const a=auraOf(st), fa=fcNow(), canPay=cu.ok===true||cu.reason==='money', L=X.last&&X.last.id===id?X.last:null;
  const gL=canPay?fcWith(id,{lvl:lvl+1})-fa:0, gS=need?fcWith(id,{stars:st+1})-fa:0;
  let pcmp, cmp;
  if(L){ pcmp=cmpPct('ATK E VIDA · '+esc2(L.what),L.pa,L.pb); cmp=cmpFc('FC ANTES → DEPOIS',L.a,L.b); }
  else if(X.apv&&X.apv!==st){ pcmp=cmpPct('ATK E VIDA · '+st+' → '+esc2(stTxt(X.apv)).toUpperCase(),p0,pctOf(id,lvl,X.apv)); cmp=cmpFc('FC AGORA → COM '+esc2(stTxt(X.apv)).toUpperCase(),fa,fcWith(id,{stars:X.apv})); }
  else if(canPay){ pcmp=cmpPct('ATK E VIDA · NV '+lvl+' → '+(lvl+1),p0,pctOf(id,lvl+1,st)); cmp=cmpFc('FC ANTES → DEPOIS DO NÍVEL',fa,fa+gL); }
  else if(need){ pcmp=cmpPct('ATK E VIDA · '+st+' → '+esc2(stTxt(st+1)).toUpperCase(),p0,pctOf(id,lvl,st+1)); cmp=cmpFc('FC ANTES → DEPOIS DA ESTRELA',fa,fa+gS); }
  else { pcmp=cmpPct('ATK E VIDA AGORA',p0,p0); cmp=cmpFc('FC AGORA',fa,fa); }
  let right, w, cls='';
  if(cu.reason==='max'){ right='máximo'; w=100; cls='cap'; }
  else if(cu.reason==='cap'){ right='teto: '+capTxt(cu)+' libera o próximo'; w=100; cls='cap'; }
  else { right=canPay?'próximo: '+gold(cu.gold||0)+' de ouro':'indisponível agora'; w=clamp(lvl/Math.max(1,cap)*100,0,100); }
  const bar='<div class="m2-lvb" role="img" aria-label="Nível '+lvl+' de '+cap+'"><i class="'+cls+'" style="width:'+w.toFixed(1)+'%"></i><span><b>Nv '+n0(lvl)+'/'+n0(cap)+'</b><em>'+esc2(right)+'</em></span></div>';
  const lvB=cu.reason==='max'?'<button class="m2-bt" data-x="lvl" aria-disabled="true"><span>Subir nível</span><small>nível máximo</small></button>'
    :cu.reason==='cap'?'<button class="m2-bt" data-x="lvl" aria-disabled="true"><span>Subir nível</span><small>teto: '+esc2(capTxt(cu))+'</small></button>'
    :canPay?'<button class="m2-bt" data-x="lvl" aria-disabled="'+(!cu.ok)+'"><span>Subir nível'+(gL>=1?' · +'+esc2(fcTxt(gL))+' FC':'')+'</span><small>'+esc2(gold(cu.gold||0))+' de ouro'+(cu.ok?'':' (falta ouro)')+'</small></button>'
    :'<button class="m2-bt" data-x="lvl" aria-disabled="true"><span>Subir nível</span><small>indisponível agora</small></button>';
  const stB=need?'<span class="m2-bt off"><span>'+esc2(stTxt(st+1))+'</span><small>'+n0(fr)+'/'+n0(need)+' frag.'+(gS>=1?' · +'+esc2(fcTxt(gS))+' FC':'')+'</small></span>'
    :'<span class="m2-bt on"><span>'+esc2(stTxt(st))+'</span><small>'+(st>=mx?'máximo':'sem próxima agora')+'</small></span>';
  const U=X.undo&&X.undo.to===id?X.undo:null, pi=U&&U.prev?info(U.prev):null;
  const eqB=U?'<button class="m2-bt off" data-x="undo"><span>Desfazer</span><small>'+(pi&&pi.owned?'volta '+esc2(pi.name):'volta a pé')+'</small></button>'
    :'<span class="m2-bt on"><span>Usando</span><small>'+(canRide(id)?'montado':'bônus valendo')+'</small></span>';
  return '<div class="m2-det" style="--rc:'+rc+'"><div class="m2-dt">'+thumb(id)+'<div class="m2-di"><div class="m2-dn"><span class="m2-tag eq">USANDO</span>'+esc2(inf.name)+' <span class="m2-rar">'+esc2(inf.rarityName||'')+'</span></div>'
    +'<div class="m2-dh">'+(need?n0(fr)+'/'+n0(need)+' fragmentos':esc2(stTxt(st)))+(a&&a.name?' · aura: '+esc2(a.name):'')+'</div></div>'+starsH(st,13)+'</div>'
    +bar+pcmp+cmp+'<div class="m2-acts">'+lvB+stB+eqB+'</div>'
    +(need?'<p class="m2-src">A estrela sobe sozinha ao juntar <b>'+n0(need)+'</b> fragmentos.</p>':'')+'</div>'; }

/* ----- faixa: PRÉVIA de montaria que o jogador não tem (fragmentos, FC com ela, origem do módulo) ----- */
function detPreview(id,inf){ const D=M().DATA, rc=rcol(inf.rarity), c=catOf(id), hf=c?c.hatchFrags|0:0, fr=inf.frags|0, src=srcOf(id), fa=fcNow();
  const bar=hf?'<div class="m2-lvb" role="img" aria-label="'+fr+' de '+hf+' fragmentos"><i class="fr" style="width:'+clamp(fr/hf*100,0,100).toFixed(1)+'%"></i><span><b>'+n0(fr)+'/'+n0(hf)+' fragmentos</b><em>nasce sozinha ao completar</em></span></div>'
    :fr?'<p class="m2-src"><b>'+n0(fr)+'</b> fragmentos guardados: entram quando ela chegar.</p>':'';
  return '<div class="m2-det" style="--rc:'+rc+'"><div class="m2-dt">'+thumb(id)+'<div class="m2-di"><div class="m2-dn"><span class="m2-tag">PRÉVIA</span>'+esc2(inf.name)+' <span class="m2-rar">'+esc2(inf.rarityName||'')+'</span></div>'
    +'<div class="m2-dh">você ainda não tem · até '+pc(pctOf(id,D.maxLvl,D.maxStars))+' de ATK e VIDA</div></div></div>'
    +bar+cmpFc('FC AGORA → COM ELA (NV 1, 1 ESTRELA)',fa,fcIfHad(id))
    +'<p class="m2-src">'+(src.length?'Como conseguir: '+src.map(esc2).join(' · ')+'.':'A origem desta montaria ainda não foi anunciada.')+'</p>'
    +'<div class="m2-acts"><button class="m2-bt off" data-x="pvout"><span>Sair</span></button>'+(offerHas(id)&&offerOpen()?'<button class="m2-bt blue" data-x="offer"><span>Ver oferta</span></button>':'')+'</div></div>'; }
function detHtml(id,inf){ if(!id||!inf) return '<div class="m2-det" style="--rc:#55608f"><div class="m2-msg">Nenhuma montaria em uso. Toque numa montaria sua para montar, ou numa que você ainda não tem para ver no herói.</div></div>';
  return inf.owned?detOwned(id,inf):detPreview(id,inf); }

/* ----- corpo: grade, estrelas e aura, nível, como conseguir ----- */
function cellHtml(m,sel,o){ const rc=rcol(m.rarity), eq=o.eq===m.id;
  if(m.owned) return '<button class="m2-cell'+(sel?' sel':'')+'" style="--rc:'+rc+'" data-x="sel" data-id="'+esc2(m.id)+'" aria-pressed="'+sel+'" aria-label="'+esc2(m.name)+', '+esc2(m.rarityName||'')+', nível '+(m.lvl|0)+', '+esc2(stTxt(m.stars|0))+(eq?', em uso':'')+'">'
    +'<span class="pi"><img src="'+esc2(iconOf(m.id))+'" alt="" loading="lazy"></span>'+(eq?'<span class="bdg">USANDO</span>':'')
    +'<span class="cn">'+esc2(m.name)+'</span><span class="cs r">Nv '+n0(m.lvl|0)+' · '+esc2(m.rarityName||'')+'</span><span class="ss">'+starsH(m.stars|0,9)+'</span></button>';
  const c=catOf(m.id), hf=c?c.hatchFrags|0:0, fr=m.frags|0;
  return '<button class="m2-cell lk'+(sel?' sel':'')+'" style="--rc:'+rc+'" data-x="sel" data-id="'+esc2(m.id)+'" aria-pressed="'+sel+'" aria-label="'+esc2(m.name)+', '+esc2(m.rarityName||'')+', você não tem. Tocar para ver no herói">'
    +'<span class="pi"><img src="'+esc2(iconOf(m.id))+'" alt="" loading="lazy"></span><span class="lki">'+SV.lock+'</span>'
    +'<span class="cn">'+esc2(m.name)+'</span><span class="cs r">'+esc2(m.rarityName||'')+'</span><span class="cs">'+(hf?n0(fr)+'/'+n0(hf)+' frag.':fr?n0(fr)+' frag.':'ver no herói')+'</span>'
    +(hf?'<span class="fb"><i style="width:'+clamp(fr/hf*100,0,100).toFixed(1)+'%"></i></span>':'')+'</button>'; }
function gridHtml(list,o,id){ const infs=list.map(info).filter(Boolean), own=infs.filter(m=>m.owned).length;
  return '<div class="m2-pan"><div class="m2-sec"><span>Montarias</span><span><b>'+own+'/'+infs.length+'</b> · toque para montar ou ver</span></div><div class="m2-grid">'+infs.map(m=>cellHtml(m,m.id===id,o)).join('')+'</div>'
    +'<p class="m2-hint">Só uma montaria por vez dá o bônus: a que você usa.</p></div>'; }
function starsHtml(id,inf){ if(!id||!inf) return ''; const D=M().DATA, mx=starMax(), lv=inf.owned?inf.lvl|0:1, cur=X.apv||(inf.owned?inf.stars|0:1), cols=mx<=5?mx:4;
  let cards=''; for(let s=1;s<=mx;s++){ const A=auraOf(s)||{}, col=auraCol(s), got=inf.owned&&s<=(inf.stars|0);
    const dot=A.glow>0?'background:radial-gradient(circle,'+col+'0.95) 0,'+col+'0.35) '+Math.min(64,30+10*A.glow)+'%,transparent 72%)':'background:rgba(255,255,255,.06);border:1px dashed rgba(160,180,255,.35)';
    cards+='<button class="m2-sc'+(got||!inf.owned?'':' no')+'" data-x="star" data-n="'+s+'" aria-pressed="'+(cur===s)+'" aria-label="'+esc2(stTxt(s))+': '+esc2(A.name||'')+'. Ver no herói"><b>'+s+SV.star(true,11)+'</b><i style="'+dot+'"></i><small>'+esc2(A.name||'')+'</small><small class="v">'+pc(pctOf(id,lv,s))+'</small></button>'; }
  const F=D.starFlat, flat=F&&F.on===true&&Array.isArray(F.pct)?F.pct[clamp(powR(inf),0,F.pct.length-1)]:0, sc=Array.isArray(D.starCost)?D.starCost:[], ca=auraOf(cur);
  return '<div class="m2-pan"><div class="m2-sec"><span>Estrelas e aura</span><span>'+esc2(inf.name)+' · Nv '+n0(lv)+' · toque para ver</span></div><div class="m2-st" style="grid-template-columns:repeat('+cols+',minmax(0,1fr))">'+cards+'</div>'
    +'<p class="m2-hint">Com '+esc2(stTxt(cur))+': <b>'+esc2((ca&&ca.name)||'')+'</b> e '+pc(pctOf(id,lv,cur))+' de ATK e VIDA no Nv '+n0(lv)+'.'+(flat?' Cada estrela acima da 1ª soma +'+dec(flat)+'% (poder de '+esc2(inf.powerRarityName||inf.rarityName||'')+').':'')+'</p>'
    +(sc.length?'<div class="m2-kv k0"><span>Custo</span><span>'+sc.map(n0).join(' / ')+' fragmentos (da 2ª à '+(sc.length+1)+'ª estrela)</span></div>':'')
    +'<div class="m2-kv'+(sc.length?'':' k0')+'"><span>Montaria repetida</span><span>'+n0(D.dupFrags|0)+' fragmentos</span></div></div>'; }
function levelHtml(id,inf){ if(!id||!inf) return ''; const D=M().DATA, C=D.cost||{}, mxL=D.maxLvl|0, own=!!inf.owned, lv=own?inf.lvl|0:1, st=own?inf.stars|0:1; let unit=0; try{ unit=+host().goldUnit()||0; }catch(e){ unit=0; }
  let uc=null; if(own){ try{ uc=M().upgradeCost(S,host(),id); }catch(e){ uc=null; } }
  return '<div class="m2-pan"><div class="m2-sec"><span>Nível</span><span>teto agora: Nv '+n0(inf.cap|0)+' (jogador Nv '+n0(plvNow())+')</span></div>'
    +'<div class="m2-kv k0"><span>Ouro de 1 abate</span><span>'+(unit?esc2(gold(unit)):'-')+'</span></div>'
    +(own?'<div class="m2-kv"><span>Nv '+n0(lv)+' → '+n0(Math.min(mxL,lv+1))+'</span><span>'+(lv<mxL&&uc&&uc.ok?esc2(gold(uc.gold))+' de ouro':'máximo')+'</span></div>':'')
    +(typeof C.goldK==='number'?'<div class="m2-kv"><span>Conta</span><span>'+dec(C.goldK)+' × ouro de 1 abate × (1 + '+dec(C.growth)+' × '+(lv-1)+') × (1 + '+dec(C.rarCost)+' × '+powR(inf)+')</span></div>':'')
    +'<div class="m2-kv"><span>Nv 1 → Nv '+n0(mxL)+'</span><span>'+pc(pctOf(id,1,st))+' → '+pc(pctOf(id,mxL,st))+' de ATK e VIDA ('+esc2(stTxt(st))+')</span></div></div>'; }
function howHtml(list,o){ const D=M().DATA, rows=list.filter(q=>!o.owned[q]).map(q=>{ const s=srcOf(q), i=info(q); return s.length&&i?'<div class="m2-kv"><span>'+esc2(i.name)+'</span><span>'+esc2(s[0])+'</span></div>':''; }).join('');
  return '<div class="m2-pan"><div class="m2-sec"><span>Como conseguir</span><span>fragmentos e montarias vêm de jogar</span></div>'+rows
    +'<p class="m2-hint">Montaria repetida vira <b>'+n0(D.dupFrags|0)+' fragmentos</b>. Fragmentos de uma montaria que você ainda não tem ficam guardados.</p></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240);
  if(!ready()){ V.innerHTML=xWrap(d,'',soonHtml()); X.sig='soon'; X.look=null; return; }
  const o=sv(), list=ids();
  if(!list.length){ V.innerHTML=xWrap(d,'',soonHtml()); X.sig='soon'; X.look=null; return; }
  if(locked(list,o)){ V.innerHTML=xWrap(d,'',gateHtml()); X.sig='gate'; X.look=null; return; }
  const id=shown(o,list), inf=id?info(id):null, mx=starMax();
  if(X.apv&&(!id||X.apv>mx)) X.apv=null;
  if(X.undo&&(X.undo.to!==o.eq||(X.undo.prev&&!o.owned[X.undo.prev]))) X.undo=null;
  if(X.last&&X.last.id!==id) X.last=null;
  X.look=id?{id:id,st:X.apv||(inf&&inf.owned?inf.stars|0:1)}:null;
  let y0=0; try{ const sc0=X.top?null:document.getElementById('m2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const Hh=+d.H||0, small=Hh>0&&Hh<640, SH=small?196:236, det=detHtml(id,inf);
  const fly=X.fly&&now()-X.fly.t<1600?'<div class="m2-fly" style="top:'+(SH-36)+'px;color:'+(X.fly.up?'var(--green)':'var(--red)')+';animation-delay:'+(X.fly.t-now())+'ms">'+esc2(X.fly.txt)+'</div>':'';
  V.innerHTML=xWrap(d,'','<div class="m2'+(X.anim?' m2-in':'')+'"><div class="m2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.5,0.9):'#16110d')+'"></div>'
    +stageHtml(SH,id,inf,o)+fcRowHtml(o,list)+(small?'':'<div class="m2-fix">'+det+'</div>')
    +'<div id="m2_scroll" class="m2-scroll x-scroll">'+(small?det:'')+gridHtml(list,o,id)+starsHtml(id,inf)+levelHtml(id,inf)+howHtml(list,o)+'</div>'
    +fly+'<div id="m2_toast">'+(X.toast&&now()-X.toastT<2000?toastHtml(X.toast):'')+'</div></div>');
  if(y0){ try{ const sc=document.getElementById('m2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (ouro caindo da batalha, nível do jogador, fragmento que chegou, montaria que o módulo ligou): o tick redesenha só quando muda */
function sig(){ if(!ready()) return 'soon'; try{ const o=sv(), list=ids(); if(!list.length) return 'soon'; if(locked(list,o)) return 'gate';
    const id=X.pv&&list.indexOf(X.pv)>=0&&!o.owned[X.pv]?X.pv:(o.eq||''), c=o.eq?canUp(o.eq):{};
    return [list.join(','),o.eq||'',id,list.map(q=>{ const x=o.owned[q]; return x?x.lvl+'.'+x.stars+'.'+x.frags:'s'+(o.stored[q]||0); }).join(','),c.ok?1:0,c.reason||'',c.gold||0,plvNow(),id&&canRide(id)?1:0,starMax(),offerOpen()?1:0].join('|'); }catch(e){ return ''; } }

/* ================= ações ================= */
function tapMount(mid){ const o=sv(), list=ids(); if(list.indexOf(mid)<0) return; const inf=info(mid); if(!inf) return; sfx('ui_tap'); X.apv=null;
  if(inf.owned){ X.pv=null; X.mode='ride';
    if(o.eq===mid){ X.last=null; redraw(); return; }
    const prev=o.eq&&o.owned[o.eq]?o.eq:null, fa=fcNow(), pi=prev?info(prev):null, pa=pi?+pi.pct||0:0; let ok=false; try{ ok=M().equip(S,mid)===true; }catch(e){ ok=false; }
    if(!ok){ say('Não foi possível usar esta montaria agora'); redraw(); return; }
    call(typeof statsChanged==='function'?statsChanged:null); sfx('claim'); const fb=fcNow();
    X.undo={to:mid,prev:prev}; X.last={id:mid,what:'TROCOU',a:fa,b:fb,pa:pa,pb:+inf.pct||0}; flyFc(fb-fa); X.top=true;
    say(heroName()+(canRide(mid)?' montou: ':' usa: ')+inf.name); redraw(); return; }
  if(X.pv===mid){ X.pv=null; redraw(); return; }
  X.pv=mid; X.last=null; X.top=true; say('Prévia: '+inf.name+(canRide(mid)?' no herói':'')); redraw(); }
function lvlUp(){ const o=sv(), id=o.eq; if(X.pv||!id||!o.owned[id]){ sfx('ui_tap'); say('Use uma montaria sua para subir o nível dela'); return; }
  const inf=info(id), c=canUp(id);
  if(!c.ok){ sfx('ui_tap'); say(c.reason==='max'?'Nível máximo alcançado':c.reason==='cap'?'Teto do nível: '+capTxt(c)+' libera o próximo':c.reason==='money'?'Falta ouro: o próximo nível custa '+gold(c.gold||0):'Subir de nível indisponível agora'); return; }
  const fa=fcNow(), pa=+inf.pct||0; let r=null; try{ r=M().upgrade(S,host(),id,1); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='money'?'Falta ouro: o próximo nível custa '+gold(c.gold||0):'Não foi possível subir o nível agora'); redraw(); return; }
  call(typeof statsChanged==='function'?statsChanged:null); sfx('upgrade'); const n2=info(id)||inf, fb=fcNow();
  X.undo=null; X.apv=null; X.last={id:id,what:'NV '+(n2.lvl|0),a:fa,b:fb,pa:pa,pb:+n2.pct||0}; flyFc(fb-fa);
  say(inf.name+' subiu para o Nv '+n0(n2.lvl|0)+' (−'+gold(r.spent||0)+' de ouro)'); redraw(); }
function undo(){ const o=sv(), U=X.undo; if(!U||U.to!==o.eq){ X.undo=null; redraw(); return; } const prev=U.prev&&o.owned[U.prev]?U.prev:null, fa=fcNow(), ci=info(o.eq), pa=ci?+ci.pct||0:0;
  let ok=false; try{ ok=M().equip(S,prev)===true; }catch(e){ ok=false; }
  if(!ok){ sfx('ui_tap'); say('Não foi possível desfazer agora'); return; }
  call(typeof statsChanged==='function'?statsChanged:null); sfx('ui_tap'); const fb=fcNow(), pi=prev?info(prev):null;
  X.undo=null; X.apv=null; X.last=prev?{id:prev,what:'VOLTOU',a:fa,b:fb,pa:pa,pb:pi?+pi.pct||0:0}:null; flyFc(fb-fa); say(pi?'Voltou: '+pi.name:heroName()+' voltou a pé'); redraw(); }

function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{};
  if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; }
  if(a==='offer'){ sfx('ui_tap'); let ok=false; try{ ok=offerOpen()&&Panels.open('offer')!==false; }catch(e){ ok=false; } if(!ok) say('A oferta não está disponível agora'); return; }
  if(!ready()) return; const o=sv(), list=ids(); if(!list.length||locked(list,o)) return;
  if(a==='sel') tapMount(ds.id);
  else if(a==='pvout'){ sfx('ui_tap'); X.pv=null; X.apv=null; redraw(); }
  else if(a==='mode'){ sfx('ui_tap'); X.mode=ds.m==='foot'?'foot':'ride'; redraw(); }
  else if(a==='star'){ const id=shown(o,list), n=clamp(+ds.n|0,1,starMax()); sfx('ui_tap'); if(!id) return; const x=o.owned[id]; X.last=null;
    X.apv=((x&&n===(x.stars|0))||(!x&&n===1&&!X.apv)||X.apv===n)?null:n; redraw(); }
  else if(a==='lvl') lvlUp();
  else if(a==='undo') undo();
}

/* imagens que a tela cita: o ícone de cada montaria da lista e a imagem parada de cada uma (esta só é pedida quando vai ao palco) */
function urls(){ try{ if(!ready()) return []; const out=[]; for(const id of ids()){ out.push(iconOf(id)); const s=stillUrl(id); if(s) out.push(s); } return out; }catch(e){ return []; } }

const def=Panels.add('mounts2',{title:'Montarias',render:draw,click:click,actions:ACTIONS,urls:urls,
  tick(){ if(X.fly&&now()-X.fly.t<1700) return; if(X.sig&&isOn()&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  onOpen(op){ X.anim=true; X.top=true; X.pv=null; X.apv=null; X.mode='ride'; X.undo=null; X.last=null; X.fly=null; X.toast=''; X.t0=0;
    try{ if(op&&op.mount&&ready()){ const o=sv(); if(ids().indexOf(op.mount)>=0&&!o.owned[op.mount]) X.pv=op.mount; } }catch(e){} },
  onClose(){ X.pv=null; X.apv=null; X.undo=null; X.last=null; X.fly=null; X.toast=''; X.look=null; STILL.id=null; STILL.o=null;
    try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Mounts2={X:X,actions:ACTIONS,def:def,urls:urls};
})();
