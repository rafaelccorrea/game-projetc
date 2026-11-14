'use strict';
/* ================= TELA PERFIL V5 (docs/proto/PerfilV5.html) — NASCE DESLIGADA (PANEL_ON.profile2 = false) =================
   O herói fica SEMPRE à vista no topo (arma na mão, asa, montaria, aura e o PET NA FRENTE): quem desenha é a rota única do jogo (window.drawHeroFull
   do js/battle.js). "Tocou, trocou": o que o jogador TEM vai para o herói na hora (equipar pelo módulo); o que falta vira PRÉVIA no herói, com
   "como ganhar" quando o módulo diz. Nenhuma janela por cima do herói: prévia, avisos e detalhes ficam na faixa ABAIXO do palco.
   NENHUMA regra e NENHUM número aqui. De onde vem cada coisa (as mesmas chamadas do js/p_profile.js, mais as das telas V2):
   - nome: S.name · retrato: Sys.appearance.avatarKey · título em destaque: Sys.titles.featured · servidor: window.realmBadge (js/p_realm.js);
   - nível e barra de XP: Sys.level.progress · FC: Sys.fc.compute (texto pelo Sys.fc.viewText) · era e fase: eraOf / ERAS / S.stage · VIP: Sys.vip;
   - Visual e Coleção: skins fixas (Sys.appearance.fixedSkins / equipFixed), montarias (Sys.mount.DATA / live / equip) e pets (Sys.pet.DATA / avail / equip);
   - Títulos: Sys.titles.DATA.titles + isUnlocked / progress / condLabel / bonusText / setFeatured (o destaque vale em dobro: é do módulo);
   - Números: Sys.titles.current (abates, chefes, torre, arena, práticas), S.best, S.playSeconds, Sys.net.player (login e ID, quando o servidor informar).
   SISTEMAS DO PERFIL (Sys.profile, js/sys/profile.js; chave DATA.on DESLIGADA = nada disto aparece e a tela fica como sempre foi):
   - trocar nome: lápis ao lado do nome → campo DENTRO da tela (renameQuote / rename; o motivo da recusa vem do Sys.name.check estrito, em texto);
   - aura, retrato e moldura na aba Visual (view().auras / portraits / frames; equip(S,host,'frame'|'aura'|'avatar',id)); o que falta mostra "como ganhar";
     a aura escolhida aparece como SELO na identidade: o drawHeroFull não recebe aura (quem desenha a aura na batalha é o jogo);
   - Números: FC de 7 dias (view().fc.points) e recordes (view().records, só os que o módulo já guardou).
   O QUE O JOGO NÃO TEM NÃO APARECE (o protótipo mostrava com dados de exemplo): asas no Perfil (asa é item do Equipamento), economia, de onde vem o FC.
   TELA BAIXA (altura menor que 690): palco menor, e a identidade e os três quadros rolam junto com o conteúdo (as abas ficam logo abaixo do palco).
   A faixa do item tocado (em uso ou prévia) só existe nas abas Visual e Coleção.
   Depois de trocar skin, montaria, pet ou título a tela chama statsChanged() (o aviso de poder é do jogo). O cabeçalho (Voltar, título, moedas) é do jogo.
   O arquivo roda em escopo próprio: os nomes daqui não chegam ao js/p_profile.js, que continua valendo enquanto esta chave estiver desligada. */
(function(){
const N='profile2';
const RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade do protótipo V2 (0 a 5) */
/* nome do arquivo do ícone quando ele não é o id do módulo (mesma tabela CL_ART do js/p_colecao.js; a de lá vale quando está carregada) */
const ART={pets:{shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'},
  mounts:{pony:'pony',horse:'horse',wolf:'wolf',griffin:'griffin',mythic:'mythic',wyvern:'wyvern',raptor:'war_raptor',scorpion:'giant_scorpion',panther:'shadow_panther',hellhorse:'infernal_horse',unicorn:'war_unicorn',icewolf:'ice_wolf',phoenixm:'giant_phoenix',blackdragon:'black_dragon',celtiger:'celestial_tiger',mecha:'war_mecha'}};
const TABS=[['vis','Visual'],['col','Coleção'],['tit','Títulos'],['num','Números']];
const KINDS=[['skin','Skins'],['mount','Montarias'],['pet','Pets']];
/* para onde o botão "Ir" de um título fechado leva (tela registrada; 'battle' = fechar o Perfil e lutar). Tipo sem tela: sem botão */
const GO={stage:'battle',era:'battle',boss:'battle',kills:'battle',tower:'tower',arena:'arena',pets:'pets',petStar:'pets',mounts:'mounts'};
const GO_NAME={battle:'Batalha',tower:'Torre',arena:'Arena',pets:'Pets',mounts:'Montarias'};
const X={tab:'vis',pv:null,det:null,mode:'ride',ct:'skin',cf:'all',tf:'all',flash:'',err:0,anim:true,top:true,sig:'',rn:null};
/* moldura do retrato: desenho por id (os do protótipo); id sem desenho próprio usa a cor da raridade */
const FR={none:'border:2px solid rgba(255,255,255,.25)',bronze:'border:3px solid #d08a4c;box-shadow:inset 0 0 0 2px #6d3d16',
  prata:'border:3px solid #dfe7ff;box-shadow:inset 0 0 0 2px #7f8bb5,0 0 10px rgba(220,230,255,.5)',ouro:'border:3px solid #ffd25e;box-shadow:inset 0 0 0 2px #a8661a,0 0 14px rgba(255,210,94,.7)',
  cristal:'border:3px solid #5ee7ff;box-shadow:inset 0 0 0 2px #a97bff,0 0 16px rgba(94,231,255,.8)',eterna:'border:3px solid #fff1a8;box-shadow:inset 0 0 0 3px #ff9f2e,0 0 20px #ffd25e,0 0 34px rgba(255,159,46,.6)'};
const KN={frame:'Moldura',aura:'Aura',avatar:'Retrato'};

/* ---------- leituras ISOLADAS ---------- */
const Y=()=>window.Sys||{};
const hostOf=()=>Y().host||null;
const fin=v=>typeof v==='number'&&isFinite(v);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ok=()=>{ const T=Y().titles; return !!(T&&T.DATA&&typeof T.progress==='function'); };
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroN=()=>heroId()==='kaia'?'Kaia':'Kael';
const nameOf=()=>{ try{ return (typeof S.name==='string'&&S.name.trim())||heroN(); }catch(e){ return heroN(); } };
const sndP=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const redraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const changed=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const STAR_RX=new RegExp(' *'+String.fromCharCode(9733),'g');   /* o módulo escreve "5 (estrela)" com o sinal; a tela escreve por extenso */
const noStar=x=>String(x==null?'':x).replace(STAR_RX,' estrelas');
const rc=r=>RC[clamp(r|0,0,5)];
const rn=r=>{ try{ const v=typeof RN==='function'?RN(r):''; if(v) return v; }catch(e){} return r>=5?'Divino':''; };
const fcT=v=>{ try{ const F=Y().fc; if(F&&typeof F.viewText==='function') return String(F.viewText(v)); }catch(e){} try{ if(typeof kf==='function') return kf(v); }catch(e){} return n0(v); };
const myFC=()=>{ try{ const F=Y().fc; const v=F&&F.compute?F.compute(S,hostOf()):null; return fin(v)?v:null; }catch(e){ return null; } };
const cur=t=>{ try{ const v=Y().titles.current(S,hostOf(),t); return fin(v)?v:null; }catch(e){ return null; } };
const realmTxt=()=>{ try{ const t=typeof window.realmBadge==='function'?window.realmBadge():''; return typeof t==='string'?t.trim():''; }catch(e){ return ''; } };
const player=()=>{ try{ const p=Y().net&&typeof Y().net.player==='function'?Y().net.player():null; return p&&typeof p==='object'?p:null; }catch(e){ return null; } };
const playerId=()=>{ const p=player(); if(!p) return ''; const v=p.publicId!=null?p.publicId:p.id; return (typeof v==='string'||typeof v==='number')&&String(v).length<=40?String(v):''; };
const panelOn=n=>{ try{ if(!window.Panels) return false; const n2=Panels.v2&&Panels.v2[n]; return !!((n2&&Panels.on(n2))||Panels.on(n)); }catch(e){ return false; } };
function artOf(kind,id){ let a=null; try{ if(typeof CL_ART!=='undefined'&&CL_ART&&CL_ART[kind]) a=CL_ART[kind][id]; }catch(e){} return a||ART[kind][id]||null; }
function petFly(sp){ try{ const t=Y().pet.battleTable&&Y().pet.battleTable(); return t&&t[sp]&&t[sp].fly>0?t[sp].fly:0; }catch(e){ return 0; } }
const canRide=id=>{ try{ return typeof MOUNT_TBL!=='undefined'&&!!MOUNT_TBL[id]&&typeof mountPrefix==='function'&&!!mountPrefix(id); }catch(e){ return false; } };
/* Sys.profile: só vale com a chave do módulo ligada; desligada ou ausente, a tela não mostra nada dele */
const prof=()=>{ try{ const P=Y().profile; return (P&&P.DATA&&P.DATA.on===true&&typeof P.view==='function')?P:null; }catch(e){ return null; } };
function pview(){ const P=prof(); if(!P) return null; try{ const v=P.view(S,hostOf()); return v&&v.on===true?v:null; }catch(e){ return null; } }
const isMinor=()=>{ try{ const p=player(); if(p&&p.ageBand) return p.ageBand!=='18+'; }catch(e){} return true; };   /* sem saber a idade: regra de menor (a mais rígida), como no js/p_intro.js */
const persist=()=>{ try{ if(typeof save==='function') save(); }catch(e){} };
const frCss=(id,r)=>FR[id]||('border:3px solid '+rc(r)+';box-shadow:inset 0 0 0 2px rgba(5,8,28,.7),0 0 14px '+rc(r));
/* arte da moldura (assets/ui/frames/<id>.png, 256x256 com janela interna de 160 centrada): o retrato ocupa 62,5% do quadro e a moldura vai por cima no quadro inteiro.
   Id sem arte, ou arte que não carregou, fica com a borda por CSS (frCss) */
const FRI=['none','bronze','prata','ouro','cristal','eterna','nine_eras','mark100','mark150'], FRX={};
function frImg(id){ if(FRI.indexOf(id)<0||FRX[id]===-1) return ''; const u='assets/ui/frames/'+id+'.png';
  if(FRX[id]==null){ FRX[id]=1; try{ if(typeof Image==='function'){ const im=new Image(); im.onerror=()=>{ FRX[id]=-1; try{ if(typeof view!=='undefined'&&view===N) redraw(); }catch(e){} }; im.src=u; } }catch(e){} }
  return u; }
const dayBR=d=>{ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||'')); return m?m[3]+'/'+m[2]:''; };
const nameLim=()=>{ let a=3,b=14; try{ const D=Y().name.DATA; if(D.min>0) a=D.min|0; if(D.max>0) b=D.max|0; }catch(e){} return [a,b]; };

/* ---------- LISTAS (lidas dos módulos, sem normalizar o save) ---------- */
/* item = {kind, id, name, r, own, eq, canPv, icon, how, soon, stars} */
function skins(){ const A=Y().appearance, out=[]; if(!A||typeof A.fixedSkins!=='function') return out; let L=[]; try{ L=A.fixedSkins(S,hostOf()).filter(k=>k.available!==false); }catch(e){ L=[]; }
  const anyEq=L.some(k=>k.equipped);
  out.push({kind:'skin',id:'default',name:heroN()+' (padrão)',r:0,own:true,eq:!anyEq,canPv:true,icon:'assets/hero/avatar/'+heroId()+'_phase0.png',how:'Skin inicial',soon:false});
  for(const k of L) out.push({kind:'skin',id:k.id,name:k.name,r:k.r|0,own:!!k.owned,eq:!!k.equipped,canPv:k.art!==false,icon:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':null,how:typeof k.how==='string'?k.how:'',soon:k.art===false,bonus:k.bonus||''});
  return out; }
function mounts(){ const M=Y().mount, out=[]; if(!M||!M.DATA) return out; let o=null; try{ o=S.sys&&S.sys.mount; }catch(e){} const ow=(o&&o.owned&&typeof o.owned==='object')?o.owned:{};
  for(const d of M.DATA.mounts||[]){ const own=!!ow[d.id]; let live=true; try{ live=typeof M.live!=='function'||M.live(d)===true; }catch(e){ live=false; } if(!own&&!live) continue; const a=artOf('mounts',d.id);
    out.push({kind:'mount',id:d.id,name:d.name,r:d.r|0,own,eq:!!(own&&o.eq===d.id),canPv:canRide(d.id),icon:a?'assets/icons/mounts/'+a+'.png':null,how:typeof d.how==='string'?d.how:'',soon:false,stars:own?(ow[d.id].stars|0)||1:0}); }
  return out; }
function pets(){ const P=Y().pet, out=[]; if(!P||!P.DATA) return out; let o=null; try{ o=S.sys&&S.sys.pet; }catch(e){} const ow=(o&&o.owned&&typeof o.owned==='object')?o.owned:{};
  for(const d of P.DATA.pets||[]){ const own=!!ow[d.id]; let live=true; try{ live=typeof P.avail!=='function'||P.avail(d,hostOf())===true; }catch(e){ live=false; } if(!own&&!live) continue; const a=artOf('pets',d.id);
    out.push({kind:'pet',id:d.id,name:d.name,r:d.r|0,own,eq:!!(own&&o.eq===d.id),canPv:!!d.sprite,icon:d.sprite?'assets/pets/'+d.sprite+'_ref.png':a?'assets/icons/pets/'+a+'.png':null,how:typeof d.how==='string'?d.how:'',soon:false,sprite:d.sprite||'',stars:own?(ow[d.id].stars|0):0}); }
  return out; }
const LIST={skin:skins,mount:mounts,pet:pets};
const find=r=>{ if(!r||!LIST[r.kind]) return null; return LIST[r.kind]().find(i=>i.id===r.id)||null; };
const pvItem=()=>{ const it=X.pv?find(X.pv):null; return it&&!it.own&&it.canPv?it:null; };
function titleRows(){ const T=Y().titles, feat=T.featured(S); return T.DATA.titles.map(t=>({t,p:T.progress(S,hostOf(),t),own:T.isUnlocked(S,t.id),eq:!!(feat&&feat.id===t.id)})).sort((a,b)=>(b.eq-a.eq)||((b.own?1:0)-(a.own?1:0))||((a.t.r|0)-(b.t.r|0))); }

/* ---------- CSS (classes p5-*; paleta do protótipo) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.p5-root{color:#eef1ff}
.p5-root,.p5-root *{box-sizing:border-box}
.p5-root button{font-family:Nunito,system-ui,sans-serif;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.p5-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.p5-bg{position:absolute;inset:0;z-index:0;pointer-events:none}
.p5-in{animation:p5in .25s ease-out both}
@keyframes p5in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.p5-stage{position:relative;z-index:1;flex:none;overflow:hidden}
.p5-cv{position:absolute;inset:0;width:100%;height:100%}
.p5-still{position:absolute;left:50%;bottom:6%;height:76%;transform:translateX(-50%);object-fit:contain}
.p5-chip{position:absolute;z-index:3;top:4px;display:flex;align-items:center;gap:6px;min-height:28px;max-width:46%;padding:2px 10px;border-radius:14px;font-weight:900;font-size:11px;line-height:1.15;overflow-wrap:anywhere}
.p5-srv{left:10px;background:rgba(10,14,44,.72);border:1px solid rgba(94,231,255,.6)}
.p5-srv i{flex:none;width:7px;height:7px;border-radius:50%;background:#5ef0a0;box-shadow:0 0 8px #5ef0a0}
.p5-vip,.xs .p5-vip{right:10px;min-height:40px;min-width:64px;padding:4px 9px 5px 5px;border-radius:13px;background:rgba(40,28,8,.78);border:1px solid rgba(255,210,94,.7);color:#eef1ff;text-align:left}
.p5-crown{flex:none;width:28px;height:28px;border-radius:9px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#fff0a8,#ffae2e);color:#1c1206;font-size:15px}
.p5-vip small{display:block;font-size:9px;color:#ffd25e;letter-spacing:.8px}
.p5-vb{display:block;width:52px;height:4px;border-radius:2px;background:rgba(255,255,255,.15);margin-top:3px;overflow:hidden}
.p5-vb i{display:block;height:100%;background:#ffd25e}
.p5-mode{position:absolute;z-index:3;right:8px;bottom:6px;display:flex;flex-direction:column;gap:4px;padding:3px;border-radius:13px;background:rgba(5,8,28,.72);border:1px solid rgba(130,150,255,.28)}
.p5-mode button,.xs .p5-mode button{border:0;background:none;min-height:40px;min-width:68px;padding:0 10px;border-radius:10px;font-weight:900;font-size:11px;color:#9aa6d6}
.p5-mode button[aria-pressed="true"],.xs .p5-mode button[aria-pressed="true"]{background:#3d4fb8;color:#fff}
.p5-idb{position:relative;z-index:2;flex:none;display:flex;gap:10px;align-items:center;margin:0 10px;padding:6px 10px;border-radius:18px;background:rgba(11,16,48,.9);border:1px solid rgba(160,180,255,.5);min-width:0}
.p5-pfp,.xs .p5-pfp{flex:none;width:48px;height:48px;border-radius:14px;position:relative;background:#16205c;overflow:hidden;border:2px solid rgba(255,255,255,.25);padding:0}
.p5-pfp img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.p5-idt{flex:1;min-width:0}
.p5-nm{font-size:20px;line-height:1.05;overflow-wrap:anywhere}
.p5-tit,.xs .p5-tit{margin-top:3px;display:inline-flex;align-items:center;gap:5px;max-width:100%;min-height:40px;padding:2px 9px 2px 7px;border-radius:9px;font-weight:900;font-size:12px;line-height:1.15;text-align:left;border:0;border-left:3px solid var(--tc);background:rgba(255,255,255,.07);color:var(--tc);overflow-wrap:anywhere}
.p5-tit img{flex:none;width:18px;height:18px;object-fit:contain}
.p5-idr{flex:none;max-width:34%;text-align:right;font-size:10px;color:#9aa6d6;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.p5-stats{position:relative;z-index:2;flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:6px 10px 0}
.p5-st,.xs .p5-st{min-width:0;min-height:48px;border-radius:12px;padding:5px 8px;background:rgba(10,14,44,.82);border:1px solid rgba(130,150,255,.28);text-align:left;color:#eef1ff;display:block}
.p5-st small{display:block;font-size:9px;letter-spacing:.8px;text-transform:uppercase;color:#9aa6d6;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.p5-st b{display:block;font-size:16px;line-height:1.15;overflow-wrap:anywhere}
.p5-st.fc b{color:#ffd25e}
.p5-xp{height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:3px;overflow:hidden}
.p5-xp i{display:block;height:100%;background:#5ee7ff}
.p5-tabs{position:relative;z-index:2;flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;margin:6px 10px 0;padding:3px;border-radius:14px;background:rgba(5,8,28,.8);border:1px solid rgba(130,150,255,.28)}
.p5-tab,.xs .p5-tab{min-width:0;min-height:40px;border:0;border-radius:11px;background:none;font-weight:900;font-size:12px;color:#9aa6d6;padding:0 2px}
.p5-tab[aria-selected="true"],.xs .p5-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff}
.p5-det{position:relative;z-index:2;flex:none;margin:6px 10px 0;padding:7px 9px;border-radius:14px;background:#141c4a;border:1px solid var(--rc);display:flex;gap:9px;align-items:center;min-width:0}
.p5-det.pv{border-color:#ff6b9a;background:#2a1838}
.p5-th{flex:none;width:44px;height:44px;border-radius:11px;border:2px solid var(--rc);background:#0c1238;overflow:hidden;display:flex;align-items:center;justify-content:center}
.p5-th img{width:100%;height:100%;object-fit:contain;display:block}
.p5-di{flex:1;min-width:0}
.p5-dn{font-weight:900;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.p5-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--rc)}
.p5-dh{font-size:11px;color:#9aa6d6;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.p5-dh b{color:#ffd25e}
.p5-fl{position:relative;z-index:2;flex:none;margin:5px 10px 0;padding:5px 10px;border-radius:10px;background:rgba(94,240,160,.12);color:#5ef0a0;font-size:12px;font-weight:900;line-height:1.25;text-align:center;overflow-wrap:anywhere}
.p5-body{position:relative;z-index:2;flex:1;min-height:0;min-width:0;padding:8px 10px 16px}
.p5-hint{font-size:11px;color:#9aa6d6;margin:0 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.p5-hint b{color:#ffd25e}
.p5-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9aa6d6;font-weight:900;margin:6px 0;display:flex;justify-content:space-between;gap:8px;min-width:0}
.p5-sec span{min-width:0;overflow-wrap:anywhere}
.p5-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.p5-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin-bottom:10px}
.p5-grid>div{min-width:0}
.p5-cell,.xs .p5-cell{position:relative;display:block;width:100%;aspect-ratio:1;min-height:44px;border-radius:14px;border:2px solid var(--rc);background:#131b52;padding:0;overflow:hidden}
.p5-cell img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.p5-cell.lock img{filter:grayscale(.85) brightness(.55)}
.p5-cell.sel{box-shadow:0 0 0 3px #ffd25e,0 0 14px rgba(255,210,94,.5)}
.p5-cell.pv{box-shadow:0 0 0 3px #ff6b9a,0 0 14px rgba(255,107,154,.5)}
.p5-ini{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;color:var(--rc)}
.p5-lk{position:absolute;right:3px;top:3px;width:16px;height:16px;border-radius:5px;background:rgba(5,8,28,.85);display:flex;align-items:center;justify-content:center}
.p5-eqb{position:absolute;left:3px;bottom:3px;font-size:8px;font-weight:900;padding:1px 4px;border-radius:5px;background:#5ef0a0;color:#043018}
.p5-cn{font-size:9.5px;font-weight:900;text-align:center;margin-top:2px;line-height:1.15;color:#9aa6d6;overflow-wrap:anywhere}
.p5-cn.own{color:#eef1ff}
.p5-filt{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}
.p5-fb,.xs .p5-fb{min-height:40px;padding:0 12px;border-radius:14px;border:1px solid rgba(130,150,255,.28);background:rgba(10,14,44,.7);font-weight:900;font-size:11px;color:#9aa6d6}
.p5-fb[aria-pressed="true"],.xs .p5-fb[aria-pressed="true"]{border-color:#ffd25e;color:#ffd25e;background:rgba(60,44,10,.8)}
.p5-card{border-radius:14px;background:rgba(24,33,86,.85);border:1px solid rgba(130,150,255,.28);padding:10px;margin-bottom:8px;min-width:0}
.p5-card h4{margin:0 0 7px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9aa6d6;font-weight:900;display:flex;justify-content:space-between;gap:8px;overflow-wrap:anywhere}
.p5-rbar{display:flex;height:9px;border-radius:5px;overflow:hidden;margin:7px 0 5px;background:rgba(255,255,255,.08)}
.p5-rbar i{display:block;height:100%}
.p5-rleg{display:flex;flex-wrap:wrap;gap:3px 9px;font-size:10px;font-weight:800;color:#9aa6d6}
.p5-rleg b{color:#eef1ff}
.p5-rleg i{display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:3px}
.p5-kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.p5-kv>div{border-radius:10px;background:rgba(5,8,28,.5);padding:7px 9px;min-width:0}
.p5-kv small{display:block;font-size:10px;color:#9aa6d6;font-weight:800;line-height:1.2;overflow-wrap:anywhere}
.p5-kv b{display:block;font-size:17px;line-height:1.2;overflow-wrap:anywhere}
.p5-kv em{display:block;font-style:normal;font-size:10px;font-weight:800;color:#9aa6d6;overflow-wrap:anywhere}
.p5-trow{display:flex;gap:9px;align-items:center;padding:8px;border-radius:14px;background:rgba(24,33,86,.85);border:1px solid rgba(130,150,255,.28);margin-bottom:6px;min-width:0}
.p5-trow.eq{border-color:#ffd25e;box-shadow:0 0 0 1px #ffd25e inset}
.p5-crest{flex:none;width:46px;height:46px;border-radius:13px;background:#0c1238;border:2px solid var(--rc);display:flex;align-items:center;justify-content:center;overflow:hidden}
.p5-crest img{width:42px;height:42px;object-fit:contain}
.p5-trow.lock .p5-crest{filter:grayscale(.85) brightness(.7)}
.p5-ti{flex:1;min-width:0}
.p5-tn{font-weight:900;font-size:14px;line-height:1.2;overflow-wrap:anywhere}
.p5-tc{font-size:11px;color:#9aa6d6;margin-top:1px;line-height:1.3;font-weight:700;overflow-wrap:anywhere}
.p5-pb{height:4px;border-radius:2px;background:rgba(255,255,255,.1);margin-top:4px;overflow:hidden}
.p5-pb i{display:block;height:100%;background:var(--rc);border-radius:2px}
.p5-bon{display:flex;gap:3px;flex-wrap:wrap;margin-top:4px}
.p5-bon span{font-size:10px;font-weight:900;padding:1px 6px;border-radius:7px;background:rgba(94,240,160,.12);color:#5ef0a0}
.p5-bon span.x2{background:rgba(255,210,94,.15);color:#ffd25e}
.p5-bt,.xs .p5-bt{flex:none;min-width:76px;min-height:40px;padding:0 10px;border-radius:11px;border:0;font-weight:900;font-size:12px;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.p5-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.p5-bt.blue,.xs .p5-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);color:#04223f;box-shadow:0 3px 0 #164e8c}
.p5-bt.rose,.xs .p5-bt.rose{background:linear-gradient(180deg,#ff9fbe,#e0477a);color:#3a0618;box-shadow:0 3px 0 #8c1d44}
.p5-bt.ghost,.xs .p5-bt.ghost{background:rgba(255,255,255,.08);color:#eef1ff;box-shadow:none;border:1px solid rgba(160,180,255,.5)}
.p5-tag{flex:none;min-width:70px;min-height:30px;padding:0 9px;border-radius:10px;font-weight:900;font-size:11px;display:inline-flex;align-items:center;justify-content:center;text-align:center;background:rgba(94,240,160,.12);color:#5ef0a0;border:2px solid #5ef0a0}
.p5-tag.soon{background:rgba(255,255,255,.06);color:#9aa6d6;border:1px solid rgba(130,150,255,.28)}
.p5-nmr{display:flex;align-items:center;gap:6px;min-width:0}
.p5-nmr .p5-nm{min-width:0}
.p5-pen,.xs .p5-pen{flex:none;min-width:40px;min-height:40px;padding:0;border-radius:11px;border:1px solid rgba(160,180,255,.5);background:rgba(255,255,255,.06);color:#fff;display:inline-flex;align-items:center;justify-content:center}
.p5-fr{position:absolute;inset:0;border-radius:14px;pointer-events:none}
.p5-au{margin-top:3px;font-size:10px;font-weight:800;color:#9aa6d6;line-height:1.3;overflow-wrap:anywhere}
.p5-au b{color:#5ee7ff}
.p5-inp,.xs .p5-inp{display:block;width:100%;min-height:46px;border-radius:12px;border:2px solid rgba(160,180,255,.5);background:#0a0f30;color:#eef1ff;padding:0 14px;font:900 17px Nunito,system-ui,sans-serif}
.p5-inp.bad,.xs .p5-inp.bad{border-color:#ff4f6d}
.p5-err{font-size:12px;color:#ff8fa3;min-height:16px;margin:6px 0;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.p5-err.cf{color:#ffd25e}
.p5-acts{display:flex;gap:8px;margin-top:8px}
.p5-acts .p5-bt{flex:1}
.p5-glow{position:absolute;inset:12%;border-radius:50%;background:radial-gradient(circle,var(--rc) 0,rgba(0,0,0,0) 68%);opacity:.9}
.p5-cell.lock .p5-glow{opacity:.3}
.p5-none{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;color:#9aa6d6}
.p5-ch{display:block;width:100%;height:auto}
.p5-chd{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));font-size:9px;font-weight:800;color:#9aa6d6;text-align:center}
.p5-che{display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;min-width:0}
.p5-che span{min-width:0}
.p5-che span:last-child{text-align:right}
.p5-che small{display:block;font-size:10px;color:#9aa6d6;font-weight:800}
.p5-che b{display:block;font-size:17px;line-height:1.2;color:#ffd25e;overflow-wrap:anywhere}
.p5-rec{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid rgba(130,150,255,.28);min-width:0}
.p5-rec.first{border-top:0}
.p5-rec span{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.p5-rec em{display:block;font-style:normal;font-size:10px;color:#9aa6d6;font-weight:700}
.p5-rec b{flex:none;max-width:50%;font-size:17px;text-align:right;overflow-wrap:anywhere}
.p5-top{position:relative;z-index:2;min-width:0;margin-bottom:8px}
.p5-top.lo .p5-idb{margin:0;padding:4px 8px;border-radius:14px}
.p5-top.lo .p5-stats{margin:6px 0 0}
.p5-top.lo .p5-st{min-height:40px;padding:3px 8px}
.p5-top.lo .p5-st b{font-size:14px}
@media (prefers-reduced-motion:reduce){.p5-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();
const SVG_LOCK='<svg viewBox="0 0 24 24" width="10" height="10" fill="#c9d0f5" aria-hidden="true"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"></path></svg>';
const SVG_GO='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';

/* ---------- PALCO: canvas com a rota única do jogo (o pet é o ÚLTIMO desenho do drawHeroFull, na frente do herói) ---------- */
const eqMount=()=>mounts().find(m=>m.eq)||null;
function stageState(t){ const p=pvItem(), st={t:t};
  if(p&&p.kind==='skin') st.skin=p.id;
  if(p&&p.kind==='mount') st.mount={id:p.id,stars:1}; else if(X.mode==='foot') st.mount=false;
  if(p&&p.kind==='pet') st.pet={base:p.sprite,stage:1,fly:petFly(p.sprite)};
  return st; }
const riding=()=>{ const p=pvItem(); if(p&&p.kind==='mount') return true; if(X.mode==='foot') return false; try{ return typeof heroLook==='function'&&!!heroLook().mount; }catch(e){ return false; } };
const canDraw=()=>{ try{ return !X.err&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
let raf=0, t0=0;
function draw(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!t0) t0=ts; const t=Math.max(0,(ts-t0)/1000), x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height);
  const rd=riding(), k=c.height*(rd?0.5:0.6)/HS, fx=c.width*(rd?0.4:0.46), fy=c.height*0.92;
  x.save(); try{ const gx=fx+c.width*0.04, rx=c.width*0.3, g=x.createRadialGradient(gx,fy,4,gx,fy,rx); g.addColorStop(0,'rgba(94,231,255,.28)'); g.addColorStop(1,'rgba(94,231,255,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(gx,fy,rx,c.height*0.07,0,0,7); x.fill(); }catch(e){} x.restore();
  window.drawHeroFull(x,fx,fy,k,stageState(t)); }
function loop(ts){ raf=0; const c=typeof document!=='undefined'?document.getElementById('p5_cv'):null; if(!c||typeof view==='undefined'||view!==N){ t0=0; return; }
  try{ draw(c,ts); }catch(e){ X.err=1; redraw(); return; }   /* o desenho do jogo falhou: retrato parado, a tela continua funcionando */
  raf=requestAnimationFrame(loop); }
function start(){ try{ if(!raf&&canDraw()&&document.getElementById('p5_cv')) raf=requestAnimationFrame(loop); }catch(e){} }
function stop(){ try{ if(raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(raf); }catch(e){} raf=0; t0=0; }
function avatarUrl(){ try{ const A=Y().appearance, k=A&&typeof A.avatarKey==='function'?A.avatarKey(S,hostOf()):null; return k?'assets/hero/avatar/'+k+'.png':null; }catch(e){ return null; } }

/* ---------- pedaços da tela ---------- */
const thumb=it=>it.icon?`<img src="${esc2(it.icon)}" alt="">`:`<span class="p5-lil" aria-hidden="true" style="font-size:20px;color:${rc(it.r)}">${esc2(String(it.name).charAt(0))}</span>`;
function cell(it){ const pv=!!(X.pv&&X.pv.kind===it.kind&&X.pv.id===it.id), st=it.own?(it.eq?'em uso':'na coleção'):it.soon?'em breve':(it.canPv?'prévia no herói':'falta');
  const lab=it.kind==='skin'?String(it.name).replace(/^(Kael|Kaia) /,'').replace(/[()]/g,''):it.name;
  return `<div><button class="p5-cell${it.own?'':' lock'}${it.eq?' sel':''}${pv?' pv':''}" style="--rc:${rc(it.r)}" data-x="it" data-k="${it.kind}" data-id="${esc2(it.id)}" aria-pressed="${it.eq||pv}" aria-label="${esc2(it.name+', '+st)}">${it.icon?`<img src="${esc2(it.icon)}" alt="" loading="lazy">`:`<span class="p5-ini p5-lil" aria-hidden="true">${esc2(String(it.name).charAt(0))}</span>`}${it.own?'':`<span class="p5-lk">${SVG_LOCK}</span>`}${it.eq?'<span class="p5-eqb">Usando</span>':''}</button><div class="p5-cn${it.own?' own':''}">${esc2(lab)}</div></div>`; }
function rarBar(items){ const tot=items.length||1; let bar='', leg=''; for(let r=0;r<=5;r++){ const all=items.filter(i=>(i.r|0)===r), o=all.filter(i=>i.own).length; if(!all.length) continue;
    bar+=`<i style="width:${(all.length/tot*100).toFixed(1)}%;background:${rc(r)};opacity:${o?1:.28}"></i>`; leg+=`<span><i style="background:${rc(r)}"></i>${esc2(rn(r)||('Raridade '+(r+1)))} <b>${n0(o)}/${n0(all.length)}</b></span>`; }
  return `<div class="p5-rbar">${bar}</div><div class="p5-rleg">${leg}</div>`; }
function detHtml(){ const R=X.pv||X.det, it=R?find(R):null; if(!it) return '';
  const pv=!!(X.pv&&!it.own), kindN=it.kind==='skin'?'Skin':it.kind==='mount'?'Montaria':'Pet';
  const line=it.own?('Na sua coleção'+(it.eq?' · em uso':'')+(it.stars>0?' · '+n0(it.stars)+(it.stars===1?' estrela':' estrelas'):''))
    :it.soon?'A arte ainda não está no jogo.':it.how?'Como ganhar: <b>'+esc2(noStar(it.how))+'</b>':'Ainda não é seu.';
  const right=pv?`<button class="p5-bt rose" data-x="sair" aria-label="Sair da prévia">Sair</button>`:it.eq?'<span class="p5-tag">Usando</span>':it.own?'':`<span class="p5-tag soon">${it.soon?'Em breve':'Falta'}</span>`;
  return `<div class="p5-det${pv?' pv':''}" style="--rc:${rc(it.r)}"><span class="p5-th">${thumb(it)}</span><div class="p5-di"><div class="p5-dn">${pv&&it.canPv?'Prévia: ':''}${esc2(it.name)} <span class="p5-rar">${esc2(rn(it.r))}</span></div><div class="p5-dh">${esc2(kindN)}${it.bonus?' · '+esc2(it.bonus)+' em uso':''}</div><div class="p5-dh">${line}${pv&&!it.canPv?' Sem prévia no herói.':''}</div></div>${right}</div>`; }
/* ---------- Sys.profile: aura, retrato, moldura, trocar nome, gráfico do FC e recordes (tudo lido do view() do módulo) ---------- */
const SVG_PEN='<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>';
function cosCell(kind,it,av,r){ const id=kind==='avatar'?it.avatar:it.id, own=!!it.owned, eq=!!it.equipped, how=typeof it.how==='string'?noStar(it.how):'';
  const st=own?(eq?'em uso':'toque para usar'):(how?'como ganhar: '+how:'falta');
  const inner=kind==='avatar'?`<img src="assets/hero/avatar/${esc2(it.avatar)}.png" alt="" loading="lazy" style="inset:0;width:100%;height:100%;object-fit:cover">`
    :kind==='frame'?(fu=>fu?(av?`<img src="${esc2(av)}" alt="" loading="lazy" style="inset:18.75%;width:62.5%;height:62.5%;object-fit:cover">`:'')+`<img src="${esc2(fu)}" alt="" loading="lazy" style="inset:0;width:100%;height:100%;object-fit:contain">`
      :(av?`<img src="${esc2(av)}" alt="" loading="lazy" style="inset:0;width:100%;height:100%;object-fit:cover">`:'')+`<span class="p5-fr" style="${frCss(it.id,r)}"></span>`)(frImg(it.id))
    :it.id==='none'?'<span class="p5-none">Nenhuma</span>':'<span class="p5-glow"></span>';
  const lab=kind==='avatar'?String(it.name).replace(/^(Kael|Kaia) /,''):(own||!how)?it.name:how;
  return `<div><button class="p5-cell${own?'':' lock'}${eq?' sel':''}" style="--rc:${rc(r)}${kind==='frame'?';border:0':''}" data-x="pf" data-k="${kind}" data-id="${esc2(id)}" aria-pressed="${eq}" aria-label="${esc2(KN[kind]+' '+it.name+', '+st)}">${inner}${own?'':`<span class="p5-lk">${SVG_LOCK}</span>`}${eq?'<span class="p5-eqb">Usando</span>':''}</button><div class="p5-cn${own?' own':''}">${esc2(lab)}</div></div>`; }
/* retratos que a tela mostra: os que o jogador tem e os das skins que a tela também lista (skin sem arte no jogo não entra) */
function portraitList(v){ const sk=skins(), by={}; for(const s of sk) by[s.id]=s; return (Array.isArray(v.portraits)?v.portraits:[]).filter(p=>p&&typeof p.avatar==='string'&&p.avatar&&(p.owned||!p.skin||by[p.skin])).map(p=>({p,r:p.skin&&by[p.skin]?by[p.skin].r:0})); }
function pfpUrl(v,av){ const a=v&&v.equipped&&v.equipped.avatar; return (typeof a==='string'&&a)?'assets/hero/avatar/'+a+'.png':av; }
function cosHtml(v,av){ const au=Array.isArray(v.auras)?v.auras:[], fr=Array.isArray(v.frames)?v.frames:[], po=portraitList(v), pf=pfpUrl(v,av); let h='';
  if(au.length) h+=`<div class="p5-sec"><span>Aura</span><span>${v.equipped&&v.equipped.aura?'selo no perfil':'pela Forja da arma'}</span></div><p class="p5-hint">Sem escolha, vale a aura da Forja da arma. Toque na aura em uso para voltar a ela.</p><div class="p5-grid">${au.map(a=>cosCell('aura',a,null,a.r|0)).join('')}</div>`;
  if(po.length) h+=`<div class="p5-sec"><span>Retrato</span><span>pelas skins que você tem</span></div><div class="p5-grid">${po.map(q=>cosCell('avatar',q.p,null,q.r)).join('')}</div>`;
  if(fr.length) h+=`<div class="p5-sec"><span>Moldura do retrato</span><span>${n0(fr.filter(f=>f.owned).length)}/${n0(fr.length)}</span></div><div class="p5-grid">${fr.map(f=>cosCell('frame',f,pf,f.r|0)).join('')}</div>`;
  return h; }
function renHtml(v){ const R=X.rn, q=v&&v.rename; if(!R||!q||q.on!==true) return ''; const lim=nameLim(), P=prof(), pay=!q.free&&q.gems>0, armed=pay&&R.armed!=null&&R.armed===R.val;
  let nextCost=0; try{ nextCost=P.DATA.rename.gems|0; }catch(e){}
  const cost=pay?'Custa <b>'+n0(q.gems)+' diamantes</b>.':'A primeira troca é <b>grátis</b>'+(nextCost>0?'; depois custa '+n0(nextCost)+' diamantes.':'.');
  const msg=R.err?`<div class="p5-err" role="alert">${esc2(R.err)}</div>`:armed?`<div class="p5-err cf" role="status">Confirma? Saem ${n0(q.gems)} diamantes e o seu nome passa a ser ${esc2(R.val)}.</div>`:'<div class="p5-err"></div>';
  return `<div class="p5-card"><h4><span>Trocar nome</span><span>${pay?n0(q.gems)+' diamantes':'Grátis'}</span></h4>
    <input id="p5_name" class="p5-inp${R.err?' bad':''}" type="text" maxlength="${lim[1]}" value="${esc2(R.val)}" aria-label="Novo nome" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">${msg}
    <p class="p5-hint" style="margin:0">De ${n0(lim[0])} a ${n0(lim[1])} letras, números ou _, sem espaço. ${cost}</p>
    <div class="p5-acts"><button class="p5-bt ghost" data-x="renx">Cancelar</button><button class="p5-bt" data-x="renok">${armed?'Confirmar · '+n0(q.gems):pay?'Trocar · '+n0(q.gems):'Trocar grátis'}</button></div></div>`; }
/* FC de 7 dias: linha com área; os dias sem jogo ficam sem ponto. Valores inicial e final por escrito */
function fcHtml(fc){ if(!fc||!Array.isArray(fc.points)) return ''; const pts=fc.points, n=pts.length, have=[];
  pts.forEach((p,i)=>{ if(p&&!p.gap&&fin(p.fc)) have.push({i,v:p.fc,l:typeof p.label==='string'?p.label:''}); });
  const open='<div class="p5-card"><h4><span>FC em 7 dias</span></h4>';
  if(have.length<2) return open+`<p class="p5-hint" role="note" style="margin:0">O gráfico aparece depois de alguns dias de jogo.${have.length?' Hoje: <b>'+esc2(fcT(have[0].v))+'</b>.':''}</p></div>`;
  const W=280, top=8, bot=70, lo=Math.min(...have.map(p=>p.v)), hi=Math.max(...have.map(p=>p.v)), sp=hi-lo, a=have[0], z=have[have.length-1], d=z.v-a.v;
  const xy=p=>[((p.i+0.5)/n*W).toFixed(1),(sp>0?bot-(p.v-lo)/sp*(bot-top):(top+bot)/2).toFixed(1)], P2=have.map(xy), line=P2.map(q=>q.join(',')).join(' ');
  const svg=`<svg class="p5-ch" viewBox="0 0 ${W} 78" role="img" aria-label="${esc2('FC nos últimos 7 dias: de '+fcT(a.v)+' para '+fcT(z.v))}"><polygon points="${P2[0][0]},76 ${line} ${P2[P2.length-1][0]},76" fill="rgba(255,210,94,.18)"></polygon><line x1="0" y1="76" x2="${W}" y2="76" stroke="rgba(160,180,255,.4)" stroke-width="1"></line><polyline points="${line}" fill="none" stroke="#ffd25e" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></polyline>${P2.map((q,i)=>`<circle cx="${q[0]}" cy="${q[1]}" r="${i===P2.length-1?4.5:3}" fill="${i===P2.length-1?'#fff3b0':'#ffd25e'}"></circle>`).join('')}</svg>`;
  return open+`<div class="p5-che"><span><small>${esc2(a.l||'início')}</small><b class="p5-lil">${esc2(fcT(a.v))}</b></span><span><small>${esc2(z.l||'fim')}</small><b class="p5-lil">${esc2(fcT(z.v))}</b></span></div>${svg}
    <div class="p5-chd" aria-hidden="true">${pts.map(p=>`<span>${esc2(p&&typeof p.label==='string'?p.label:'')}</span>`).join('')}</div>
    <p class="p5-hint" style="margin:7px 0 0">${d>0?'Subiu <b>'+esc2(fcT(d))+'</b>':d<0?'Caiu <b>'+esc2(fcT(-d))+'</b>':'Ficou igual'} em ${n0(have.length)} dias com jogo. Dia sem jogo fica sem ponto.</p></div>`; }
function recHtml(recs){ if(!Array.isArray(recs)) return ''; const L=recs.filter(r=>r&&r.has&&fin(r.v)&&typeof r.name==='string');
  const val=r=>r.id==='fc'?fcT(r.v):(r.id==='arenaRank'||r.id==='arenaLeague')?String(r.text):n0(r.v)+(r.unit?' '+r.unit:'');
  return `<div class="p5-card"><h4><span>Recordes</span></h4>${L.length?L.map((r,i)=>{ const sub=[dayBR(r.day),typeof r.info==='string'?r.info:''].filter(Boolean).join(' · '); return `<div class="p5-rec${i?'':' first'}"><span>${esc2(r.name)}${sub?'<em>'+esc2(sub)+'</em>':''}</span><b class="p5-lil">${esc2(val(r))}</b></div>`; }).join(''):'<p class="p5-hint" role="note" style="margin:0">Seus recordes aparecem aqui conforme você joga.</p>'}</div>`; }
function visHtml(v,av){ let h='<p class="p5-hint">Tocou, trocou: o que você tem vai para o herói na hora. O que falta aparece como <b>prévia</b> no herói.</p>';
  for(const [k,l] of KINDS){ const L=LIST[k](); if(!L.length) continue; h+=`<div class="p5-sec"><span>${l}${k==='skin'?' · '+esc2(heroN()):''}</span><span>${n0(L.filter(i=>i.own).length)}/${n0(L.length)}</span></div><div class="p5-grid">${L.map(cell).join('')}</div>`; }
  return h+(v?cosHtml(v,av):''); }
function colHtml(){ const all=[].concat(...KINDS.map(k=>LIST[k[0]]())), own=all.filter(i=>i.own).length; if(!LIST[X.ct]) X.ct='skin'; const L=LIST[X.ct](), nm=(KINDS.find(k=>k[0]===X.ct)||[])[1]||'';
  let h=`<div class="p5-card"><h4><span>Coleção total</span><span>${n0(own)}/${n0(all.length)}</span></h4>${rarBar(all)}</div>`;
  h+=`<div class="p5-filt" role="group" aria-label="Tipo">${KINDS.map(([k,l])=>{ const q=LIST[k](); return `<button class="p5-fb" data-x="ct" data-k="${k}" aria-pressed="${X.ct===k}">${l} ${n0(q.filter(i=>i.own).length)}/${n0(q.length)}</button>`; }).join('')}</div>`;
  h+=`<div class="p5-card"><h4><span>${esc2(nm)}</span><span>${n0(L.filter(i=>i.own).length)}/${n0(L.length)}</span></h4>${rarBar(L)}</div>`;
  h+=`<div class="p5-filt" role="group" aria-label="Filtro">${[['all','Todos'],['own','Tenho'],['lock','Falta']].map(([k,l])=>`<button class="p5-fb" data-x="cf" data-f="${k}" aria-pressed="${X.cf===k}">${l}</button>`).join('')}</div>`;
  const list=L.filter(i=>X.cf==='all'||(X.cf==='own'?i.own:!i.own)).sort((a,b)=>((b.own?1:0)-(a.own?1:0))||(a.r-b.r));
  return h+(list.length?`<div class="p5-grid">${list.map(cell).join('')}</div>`:'<p class="p5-hint" role="note">Nada aqui.</p>'); }
function titHtml(){ const T=Y().titles, rows=titleRows(), cnt=rows.filter(r=>r.own).length, list=rows.filter(r=>X.tf==='all'||(X.tf==='own'?r.own:!r.own));
  let h=`<div class="p5-filt" role="group" aria-label="Filtro">${[['all','Todos'],['own','Conquistados'],['lock','A conquistar']].map(([k,l])=>`<button class="p5-fb" data-x="tf" data-f="${k}" aria-pressed="${X.tf===k}">${l}</button>`).join('')}</div>
    <p class="p5-hint">${n0(cnt)} de ${n0(rows.length)} conquistados. O título em destaque vale <b>${T.DATA.featuredMult===2?'em dobro':'x'+String(T.DATA.featuredMult).replace('.',',')}</b>; os outros conquistados somam normal.</p>`;
  for(const r of list){ const t=r.t, p=r.p, c=rc(t.r), bn=t.cosmetic?['Visual']:String(T.bonusText(t,r.eq?T.DATA.featuredMult:1)).split(' · ').filter(s=>s&&s!=='—'), cond=noStar(T.condLabel(S,hostOf(),t));
    const prog=!r.own&&p&&p.need>0&&t.cond.type!=='arena', pct=prog?Math.round(clamp(p.frac,0,1)*100):0, to=GO[t.cond.type], canGo=!!to&&(to==='battle'||panelOn(to));
    h+=`<div class="p5-trow${r.eq?' eq':''}${r.own?'':' lock'}" style="--rc:${c}"><span class="p5-crest">${t.icon?`<img src="${esc2(t.icon)}" alt="">`:`<span class="p5-lil" aria-hidden="true" style="font-size:20px;color:${c}">${esc2(String(t.name).charAt(0))}</span>`}</span>
      <div class="p5-ti"><div class="p5-tn">${esc2(t.name)}</div><div class="p5-rar">${esc2((T.DATA.titleRName&&T.DATA.titleRName[t.r|0])||'')}</div><div class="p5-tc">${r.own?'Conquistado: ':''}${esc2(cond)}${prog?' · '+n0(Math.min(p.cur,p.need))+'/'+n0(p.need):''}</div>${prog?`<div class="p5-pb" role="progressbar" aria-label="Progresso de ${esc2(t.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>`:''}<div class="p5-bon">${bn.map(s=>`<span class="${r.eq?'x2':''}">${esc2(s)}</span>`).join('')}</div></div>
      ${r.eq?'<span class="p5-tag">Destaque</span>':r.own?`<button class="p5-bt" data-x="feat" data-id="${esc2(t.id)}" aria-label="Destacar ${esc2(t.name)}">Destacar</button>`:canGo?`<button class="p5-bt blue" data-x="go" data-to="${to}" aria-label="Ir para ${esc2(GO_NAME[to])}">Ir ${SVG_GO}</button>`:''}</div>`; }
  return h+(list.length?'':'<p class="p5-hint" role="note">Nenhum título aqui.</p>'); }
function numHtml(pvw){ const kv=(l,v,s)=>`<div><small>${esc2(l)}</small><b class="p5-lil">${esc2(v)}</b>${s?'<em>'+esc2(s)+'</em>':''}</div>`, card=(t,a)=>a.length?`<div class="p5-card"><h4><span>${t}</span></h4><div class="p5-kv">${a.join('')}</div></div>`:''; let h=pvw?fcHtml(pvw.fc):'';
  { const a=[], fc=myFC(); let P=null; try{ P=Y().level.progress(S); }catch(e){}
    if(fc!=null) a.push(kv('FC',fcT(fc),'')); if(P) a.push(kv('Nível',n0(P.lvl),P.max?'nível máximo':Math.round(clamp(P.frac,0,1)*100)+'% para o próximo'));
    try{ const V=Y().vip; if(V&&typeof V.level==='function') a.push(kv('VIP',V.level(S)>0?n0(V.level(S)):'Sem VIP','')); }catch(e){} h+=card('Poder',a); }
  { const a=[], k=cur('kills'), b=cur('boss'); if(k!=null) a.push(kv('Inimigos derrotados',n0(k),'')); if(b!=null) a.push(kv('Chefes derrotados',n0(b),'')); h+=card('Combate',a); }
  { const a=[]; try{ const best=Math.max(1,S.best|0,S.stage|0), e=eraOf(best); a.push(kv('Fase mais alta',n0(best),'Era '+(e+1)+' · '+ERAS[e].n)); a.push(kv('Eras liberadas',n0(Math.min(ERAS.length,(cur('era')|0)+1))+' de '+n0(ERAS.length),'')); }catch(e){}
    const tw=cur('tower'), ar=cur('arena'), pr=cur('practice'); if(tw!=null&&Y().tower) a.push(kv('Torre',tw>0?'Andar '+n0(tw):'—',tw>0?'seu recorde':'ainda sem recorde'));
    if(ar>0) a.push(kv('Arena',n0(ar)+'º','melhor posição da semana')); if(pr>0) a.push(kv('Práticas',n0(pr),'níveis somados')); h+=card('Progresso',a); }
  { const a=[]; for(const [k,l] of KINDS){ const L=LIST[k](); if(L.length) a.push(kv(l,n0(L.filter(i=>i.own).length)+' de '+n0(L.length),'')); }
    try{ const r=titleRows(); a.push(kv('Títulos',n0(r.filter(q=>q.own).length)+' de '+n0(r.length),'')); }catch(e){} h+=card('Coleção',a); }
  if(pvw) h+=recHtml(pvw.records);
  { const a=[], rb=realmTxt(), p=player(), id=playerId(); if(rb) a.push(kv('Servidor',rb,''));
    try{ const s=Math.floor(+S.playSeconds||0); if(s>=60) a.push(kv('Tempo jogado',s>=3600?n0(Math.floor(s/3600))+' h '+n0(Math.floor(s%3600/60))+' min':n0(Math.floor(s/60))+' min','')); }catch(e){}
    if(p&&Array.isArray(p.linked)) a.push(kv('Login',p.linked.indexOf('google')>=0?'Google':'Convidado',p.linked.indexOf('google')>=0?'conta vinculada':'sem conta vinculada'));
    if(id) a.push(`<div><small>ID do jogador</small><b class="p5-lil">${esc2(id)}</b><button class="p5-bt ghost" data-x="copy" style="margin-top:4px">Copiar</button></div>`); h+=card('Conta',a); }
  return h||'<p class="p5-hint" role="note">Sem números para mostrar agora.</p>'; }

/* ---------- desenho ---------- */
function vRender(){ const d=xDims(600)||{}, H=d.H>0?d.H:704, bg=typeof xEraBg==='function'?xEraBg(0.35,0.9):'#16110d';
  if(!ok()){ V.innerHTML=xWrap(d,'p5-root',`<div class="p5-bg" style="background:${bg}"></div><div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center"><span role="alert" style="font-weight:800;color:#9aa6d6">Perfil indisponível agora.</span><button class="p5-bt" data-x="back" style="min-height:48px;padding:0 28px;font-size:16px">Voltar</button></div>`); X.sig='x'; return; }
  if(X.pv&&!pvItem()&&!find(X.pv)) X.pv=null; if(X.det&&!find(X.det)) X.det=null;
  let y0=0; try{ const sc0=X.top?null:document.getElementById('p5_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const pvw=pview(); if(!pvw) X.rn=null; let refocus=false;
  if(X.rn){ try{ const el=document.getElementById('p5_name'); if(el&&typeof el.value==='string'){ X.rn.val=el.value.slice(0,40); refocus=document.activeElement===el; } }catch(e){} }   /* o que o jogador já digitou não se perde num redesenho */
  const lo=H<690;   /* tela baixa: palco menor; identidade e quadros rolam com o conteúdo */
  const T=Y().titles, feat=T.featured(S), av=avatarUrl(), can=canDraw(), stH=Math.round(lo?clamp(H*0.24,120,170):clamp(H*0.28,150,250)), p=pvItem(), mt=eqMount(), showMode=!!(mt||(p&&p.kind==='mount'));
  /* ----- PALCO ----- */
  const rb=realmTxt(); let vip='';
  try{ const V0=Y().vip; if(V0&&typeof V0.level==='function'){ const lv=V0.level(S)|0, P=typeof V0.progress==='function'?V0.progress(S):null, pct=P?Math.round(clamp(+P.frac||0,0,1)*100):0, inner=`<span class="p5-crown p5-lil">${n0(lv)}</span><span><small>VIP</small>${lv?'Nível '+n0(lv):'Sem VIP'}${P&&!P.max?`<span class="p5-vb"><i style="width:${pct}%"></i></span>`:''}</span>`;
      vip=panelOn('vip')?`<button class="p5-chip p5-vip" data-x="vip" aria-label="Ver o Clube VIP: ${lv?'VIP '+lv:'sem VIP'}">${inner}</button>`:`<span class="p5-chip p5-vip">${inner}</span>`; } }catch(e){ vip=''; }
  const alt=heroN()+' com a arma na mão'+(p?', prévia de '+p.name:'');
  const md=p&&p.kind==='mount'?'ride':X.mode;
  const stage=`<div class="p5-stage" style="height:${stH}px">${can?`<canvas id="p5_cv" class="p5-cv" role="img" aria-label="${esc2(alt)}"></canvas>`:av?`<img class="p5-still" src="${esc2(av)}" alt="${esc2(heroN())}">`:''}${rb?`<span class="p5-chip p5-srv"><i></i>${esc2(rb)}</span>`:''}${vip}
    ${showMode?`<div class="p5-mode" role="group" aria-label="Como mostrar o herói"><button data-x="mode" data-m="ride" aria-pressed="${md==='ride'}">Montado</button><button data-x="mode" data-m="foot" aria-pressed="${md==='foot'}">A pé</button></div>`:''}</div>`;
  /* ----- IDENTIDADE (abaixo do palco: nada por cima do herói) ----- */
  const tc=feat?rc(feat.r):'#9aa6d6', id=playerId();
  let pfS='', pfR='', frH='', nmH=`<div class="p5-nm p5-lil">${esc2(nameOf())}</div>`, auH='', pfA=av;
  if(pvw){ const E=pvw.equipped||{}, fid=typeof E.frame==='string'&&E.frame?E.frame:'none', f=(pvw.frames||[]).find(q=>q.id===fid), au=E.aura?(pvw.auras||[]).find(q=>q.id===E.aura):null;
    const fu=frImg(fid); pfA=pfpUrl(pvw,av);
    /* com arte: o retrato fica do tamanho de sempre e a moldura passa 30% para fora de cada lado (256/160 do retrato) */
    if(fu){ pfS=' style="border:0;overflow:visible;margin:0 6px"'; pfR=' style="border-radius:12%"'; frH=`<img src="${esc2(fu)}" alt="" style="inset:-30%;width:160%;height:160%;max-width:none;object-fit:contain;pointer-events:none">`; }
    else { pfS=' style="border:0"'; frH=`<span class="p5-fr" style="${frCss(fid,f?f.r|0:0)}"></span>`; }
    nmH=`<div class="p5-nmr">${nmH}<button class="p5-pen" data-x="ren" aria-expanded="${!!X.rn}" aria-label="Trocar nome">${SVG_PEN}</button></div>`;
    if(au) auH=`<div class="p5-au">Aura: <b>${esc2(au.name)}</b></div>`; }
  const idb=`<div class="p5-idb"><button class="p5-pfp"${pfS} data-x="tab" data-t="vis" aria-label="Retrato: abrir a aba Visual">${pfA?`<img src="${esc2(pfA)}" alt=""${pfR}>`:''}${frH}</button>
    <div class="p5-idt">${nmH}<button class="p5-tit" style="--tc:${tc}" data-x="tab" data-t="tit" aria-label="Título em destaque: ${esc2(feat?feat.name:'nenhum')}. Abrir a aba Títulos">${feat&&feat.icon?`<img src="${esc2(feat.icon)}" alt="">`:''}<span>${esc2(feat?feat.name:'Sem título')}</span></button>${auH}</div>
    ${id?`<div class="p5-idr">ID ${esc2(id)}</div>`:''}</div>`;
  /* ----- NÍVEL, FC, ERA ----- */
  let P=null; try{ P=Y().level.progress(S); }catch(e){} const fc=myFC(), xp=P?Math.round(clamp(P.frac,0,1)*100):0; let eraT='';
  try{ const stg=Math.max(1,S.stage|0), e=eraOf(stg); eraT=`<div class="p5-st"><small>Era ${e+1} · ${esc2(ERAS[e].n)}</small><b class="p5-lil">Fase ${n0(stg)}</b></div>`; }catch(e){ eraT=''; }
  const stats=`<div class="p5-stats" style="grid-template-columns:repeat(${(P?1:0)+(fc!=null?1:0)+(eraT?1:0)||1},minmax(0,1fr))">${P?`<button class="p5-st" data-x="tab" data-t="num" aria-label="Nível ${P.lvl}. Abrir a aba Números"><small>Nível ${n0(P.lvl)}</small><b class="p5-lil">${P.max?'Máximo':xp+'%'}</b><div class="p5-xp"><i style="width:${P.max?100:xp}%"></i></div></button>`:''}${fc!=null?`<button class="p5-st fc" data-x="tab" data-t="num" aria-label="FC ${esc2(fcT(fc))}. Abrir a aba Números"><small>FC</small><b class="p5-lil">${esc2(fcT(fc))}</b></button>`:''}${eraT}</div>`;
  const tabs=`<div class="p5-tabs" role="tablist" aria-label="Seções do perfil">${TABS.map(t=>`<button class="p5-tab" role="tab" data-x="tab" data-t="${t[0]}" aria-selected="${X.tab===t[0]}">${t[1]}</button>`).join('')}</div>`;
  const fl=X.flash?`<div class="p5-fl" role="status" aria-live="polite">${esc2(X.flash)}</div>`:'';
  const body=X.tab==='tit'?titHtml():X.tab==='col'?colHtml():X.tab==='num'?numHtml(pvw):visHtml(pvw,av);
  const det=(X.tab==='vis'||X.tab==='col')?detHtml():'';   /* a faixa do item tocado só faz sentido onde há itens */
  const rnH=pvw?renHtml(pvw):'', scO='<div id="p5_scroll" class="x-scroll p5-body" style="overflow-y:auto;overflow-x:hidden">';
  V.innerHTML=xWrap(d,'p5-root '+(X.anim?'p5-in':''),`<div class="p5-bg" style="background:${bg}"></div>${stage}`+(lo?`${tabs}${det}${fl}${scO}<div class="p5-top lo">${idb}${stats}</div>${rnH}${body}</div>`:`${idb}${stats}${tabs}${det}${fl}${scO}${rnH}${body}</div>`));
  X.anim=false; X.top=false; X.sig=sig();
  if(y0){ try{ const sc=document.getElementById('p5_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  if(X.rn&&(refocus||X.rn.focus)){ X.rn.focus=false; try{ const el=document.getElementById('p5_name'); if(el&&typeof el.focus==='function'){ el.focus(); const n=String(el.value||'').length; if(typeof el.setSelectionRange==='function') el.setSelectionRange(n,n); } }catch(e){} }
  start(); }
/* assinatura do que muda por fora (nível, FC, fase, herói): o tick redesenha só quando ela muda */
function sig(){ try{ let lv=0; try{ lv=Y().level.level(S)|0; }catch(e){} return [lv,S.stage|0,heroId(),Math.round(myFC()||0),S.name||''].join('|'); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
function equip(it){ try{ if(it.kind==='skin'){ const r=Y().appearance.equipFixed(S,it.id==='default'?null:it.id); return !!(r&&r.ok); }
    if(it.kind==='mount') return Y().mount.equip(S,it.id)===true; if(it.kind==='pet') return Y().pet.equip(S,it.id)===true; }catch(e){} return false; }
const ACT={
  back(){ sndP('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  tab(b){ const t=String(b.dataset.t||''); if(!TABS.some(q=>q[0]===t)||t===X.tab) return; sndP('ui_tap'); X.tab=t; X.top=true; X.flash=''; if(t==='tit'||t==='num'){ X.pv=null; X.det=null; } redraw(); },
  /* ----- Sys.profile ----- */
  ren(){ if(!prof()) return; sndP('ui_tap'); X.flash=''; X.rn=X.rn?null:{val:'',err:'',armed:null,focus:true}; if(X.rn){ try{ if(typeof S.name==='string') X.rn.val=S.name; }catch(e){} } X.top=true; redraw(); },
  renx(){ if(!X.rn) return; sndP('ui_tap'); X.rn=null; redraw(); },
  renok(){ const P=prof(), R=X.rn; if(!P||!R) return; let v=R.val; try{ const el=document.getElementById('p5_name'); if(el&&typeof el.value==='string') v=el.value; }catch(e){}
    v=String(v==null?'':v).trim().slice(0,40); R.val=v; R.err='';
    const fail=m=>{ R.err=m; R.armed=null; sndP('ui_tap'); try{ const el=document.getElementById('p5_name'); if(el) el.value=v; }catch(e){} redraw(); };
    let q=null, c=null; try{ q=P.renameQuote(S,hostOf()); }catch(e){ q=null; } if(!q||q.on!==true) return fail('Tente de novo em instantes.');
    if(!v.length) return fail('Digite um nome.');
    /* o motivo da recusa aparece ANTES de pedir a confirmação (o mesmo filtro estrito que o módulo aplica na troca) */
    try{ const Nm=Y().name; c=Nm&&typeof Nm.check==='function'?Nm.check(v,{strict:true,minor:isMinor(),current:typeof S.name==='string'?S.name:null}):null; }catch(e){ c=null; }
    if(!c) return fail('Tente de novo em instantes.'); if(!c.ok) return fail(c.msg||'Esse nome não é permitido.');
    if(!q.free&&q.gems>0){ if(!q.canPay) return fail('Faltam diamantes.');
      if(R.armed!==v){ R.armed=v; sndP('ui_tap'); try{ const el=document.getElementById('p5_name'); if(el) el.value=v; }catch(e){} redraw(); return; } }   /* custa: o 1º toque só pede a confirmação */
    let r=null; try{ r=P.rename(S,hostOf(),v,{minor:isMinor()}); }catch(e){ r=null; }
    if(!r||!r.ok) return fail(r&&r.reason==='gemas'?'Faltam diamantes.':(r&&typeof r.msg==='string'&&r.msg)||'Não foi possível trocar agora.');
    X.rn=null; sndP('claim'); persist(); X.flash='Nome trocado para '+nameOf(); redraw(); },
  pf(b){ const P=prof(), v=pview(); if(!P||!v) return; const k=String(b.dataset.k||''), id=String(b.dataset.id||''); if(!KN[k]) return;
    const L=k==='frame'?v.frames:k==='aura'?v.auras:portraitList(v).map(q=>q.p), it=(Array.isArray(L)?L:[]).find(q=>q&&(k==='avatar'?q.avatar:q.id)===id); if(!it) return;
    X.flash=''; X.pv=null; X.det=null; const how=typeof it.how==='string'?noStar(it.how):'';
    if(!it.owned){ sndP('ui_tap'); X.flash=KN[k]+' '+it.name+(how?'. Como ganhar: '+how:': ainda não é seu'); redraw(); return; }
    if(it.equipped&&k!=='aura'){ sndP('ui_tap'); redraw(); return; }
    let r=null; try{ r=P.equip(S,hostOf(),k,it.equipped?null:id); }catch(e){ r=null; }   /* aura em uso tocada de novo: volta à da Forja da arma */
    if(r&&r.ok){ sndP('claim'); persist(); X.flash=it.equipped?'Aura de volta à da Forja da arma':k==='avatar'?'Retrato trocado':KN[k]+' '+it.name+' em uso'; }
    else { sndP('ui_tap'); X.flash=r&&r.reason==='falta'&&r.how?KN[k]+' '+it.name+'. Como ganhar: '+noStar(r.how):'Não foi possível trocar agora'; }
    redraw(); },
  it(b){ const it=find({kind:String(b.dataset.k||''),id:String(b.dataset.id||'')}); if(!it) return; X.flash='';
    if(it.own){ X.pv=null; X.det={kind:it.kind,id:it.id};
      if(it.eq){ sndP('ui_tap'); }
      else if(equip(it)){ sndP('claim'); if(it.kind==='mount') X.mode='ride';
        if(it.kind==='skin'){ const P=prof(); if(P){ try{ P.equip(S,hostOf(),'avatar',null); }catch(e){} } }   /* como no protótipo: trocar de skin devolve o retrato ao da skin */
        changed(); X.flash=it.name+' em uso'; }
      else { sndP('ui_tap'); X.flash='Não foi possível trocar agora'; }
      redraw(); return; }
    sndP('ui_tap'); X.det=null; const same=X.pv&&X.pv.kind===it.kind&&X.pv.id===it.id; X.pv=same?null:{kind:it.kind,id:it.id}; redraw(); },
  sair(){ sndP('ui_tap'); X.pv=null; X.det=null; X.flash=''; redraw(); },
  mode(b){ const m=b.dataset.m==='foot'?'foot':'ride'; sndP('ui_tap'); if(X.pv&&X.pv.kind==='mount') X.pv=null; X.mode=m; redraw(); },
  ct(b){ const k=String(b.dataset.k||''); if(!LIST[k]||k===X.ct) return; sndP('ui_tap'); X.ct=k; X.cf='all'; redraw(); },
  cf(b){ const f=String(b.dataset.f||''); if(['all','own','lock'].indexOf(f)<0||f===X.cf) return; sndP('ui_tap'); X.cf=f; redraw(); },
  tf(b){ const f=String(b.dataset.f||''); if(['all','own','lock'].indexOf(f)<0||f===X.tf) return; sndP('ui_tap'); X.tf=f; X.top=true; redraw(); },
  feat(b){ const T=Y().titles, id=String(b.dataset.id||''); if(!T.setFeatured(S,id)){ sndP('ui_tap'); X.flash='Você ainda não conquistou este título'; redraw(); return; }
    sndP('claim'); changed(); const t=T.DATA.titles.find(q=>q.id===id); X.flash='Título em destaque: '+(t?t.name:''); redraw(); },
  go(b){ const to=String(b.dataset.to||''); if(!GO_NAME[to]) return; sndP('ui_tap');
    if(to==='battle'){ try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} return; }
    let opened=false; try{ opened=!!(window.Panels&&Panels.open(to,{from:N})); }catch(e){ opened=false; } if(!opened){ X.flash=GO_NAME[to]+': ainda não abriu para você'; redraw(); } },
  vip(){ sndP('ui_tap'); try{ if(window.Panels) Panels.open('vip',{from:N}); }catch(e){} },
  copy(){ const id=playerId(); if(!id) return; sndP('ui_tap'); const done=()=>{ X.flash='ID copiado: '+id; redraw(); };
    try{ if(typeof navigator!=='undefined'&&navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){ navigator.clipboard.writeText(id).then(done,()=>{ X.flash='Não foi possível copiar. Seu ID: '+id; redraw(); }); return; } }catch(e){}
    X.flash='Seu ID: '+id; redraw(); } };
function vClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!ok()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo, xGate) */
function urls(){ const u=[]; const add=x=>{ if(x&&u.indexOf(x)<0) u.push(x); };
  try{ add(typeof xEraBgUrl==='function'?xEraBgUrl():''); add(avatarUrl()); { const v=pview(); if(v){ add(pfpUrl(v,null)); if(X.tab==='vis') for(const q of portraitList(v)) add('assets/hero/avatar/'+q.p.avatar+'.png'); } } if(ok()){ const f=Y().titles.featured(S); add(f&&f.icon); if(X.tab==='tit') for(const t of Y().titles.DATA.titles) add(t.icon); else if(X.tab!=='num') for(const k of KINDS) for(const it of LIST[k[0]]()) add(it.icon); } }catch(e){}
  return u; }

if(!('profile2' in PANEL_ON)) PANEL_ON.profile2=false;
Panels.add(N,{title:'Perfil',actions:Object.keys(ACT),
  render(){ if(typeof xGate==='function'&&xGate(urls())) return; return vRender(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return vClick(b); },
  tick(){ if(!ok()) return; if(X.sig&&X.sig!=='x'&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  /* o.tab aceita os nomes desta tela (vis, col, tit, num) e os da tela de hoje (tit, sta) */
  onOpen(o){ stop(); const t=o&&o.tab; X.tab=t==='sta'?'num':TABS.some(q=>q[0]===t)?t:'vis'; X.pv=null; X.det=null; X.flash=''; X.err=0; X.anim=true; X.top=true; X.sig=''; X.ct='skin'; X.cf='all'; X.tf='all'; X.mode='ride'; X.rn=null;
    { const P=prof(); if(P&&typeof P.sync==='function'){ try{ P.sync(S,hostOf()); }catch(e){} } } },   /* recordes e ponto de hoje do FC (o módulo só escreve com a chave ligada) */
  onClose(){ stop(); X.pv=null; X.det=null; X.flash=''; X.rn=null; } });
})();
