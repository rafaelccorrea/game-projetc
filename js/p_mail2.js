'use strict';
/* ================= CORREIO V3, VERSÃO A (aprovada pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.mail2) =================
   Protótipo: docs/proto/v2/CorreioV3.html, direção A: cada carta é um CARTÃO com o prêmio à vista; ARRASTAR o cartão para a direita resgata
   (o botão "Resgatar" do cartão faz o mesmo, para quem não consegue arrastar). Não substitui o js/p_mail.js: é outra tela ('mail2').
   NENHUMA regra aqui. Tudo vem do Sys.mail (js/sys/mail.js):
   - caixa = Sys.mail.inbox(S, host) (id, title, body, att, at, exp, daysLeft, read, claimed, hasAtt, type, from);
   - ler = Sys.mail.read · resgatar = Sys.mail.claim (a entrega é do Sys.loot.grantBundle: portões e itens guardados valem) · tudo = Sys.mail.claimAll
   - apagar = Sys.mail.remove (só sem prêmio pendente) · limite de cartas = Sys.mail.DATA.max · chave do módulo = Sys.mail.DATA.enabled.
   O PRÊMIO DO CARTÃO é o pacote real da carta (m.att): ouro, diamantes, materiais, itens, ovos, skin, fragmentos. Nada é inventado; chave que a tela
   não conhece não vira peça. Título, texto e remetente podem vir do SERVIDOR: sempre escapados (esc2).
   Nada à venda nesta tela: sem preço, sem compra, sem pressa. A validade aparece como "vale até DD/MM".
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói com a arma na mão e o pet por último (na frente); ao resgatar, as peças voam até ele.
   GESTO: pointerdown/move/up/cancel no documento, só com esta tela aberta; o cartão tem touch-action:pan-y (o arrasto vertical é a rolagem da lista).
   O cabeçalho (Voltar, título, moedas) é do jogo. O arquivo roda em escopo próprio. Toques por data-x; a lista das ações fica em def.actions. */
(function(){
if(!('mail2' in PANEL_ON)) PANEL_ON.mail2=false;
const N='mail2';
const ACTIONS=['back','open','claim','del','all','delread','delno','delyes'];
const SWIPE=0.45;      /* fração da largura do cartão a partir da qual soltar resgata (igual ao protótipo; só desenho) */
const SOON_DAYS=3;     /* a partir de quantos dias o cartão com prêmio ganha o selo "Vale até" (igual ao protótipo; só desenho) */
const X={open:null,conf:false,say:'',sayT:0,why:null,last:null,drag:null,noClick:0,anim:true,top:true,sig:'',tk:0,raf:0,t0:0,t:0,fly:[],fx:[],err:0};

/* ---------- leituras dos módulos ---------- */
const MM=()=>(window.Sys&&Sys.mail)||null;
const mOk=()=>{ const M=MM(); return !!(M&&M.DATA&&typeof M.inbox==='function'&&typeof M.claim==='function'&&typeof M.read==='function'&&typeof M.remove==='function'); };
const mOn=()=>mOk()&&MM().DATA.enabled===true;
const host=()=>(window.Sys&&Sys.host)||null;
const now=()=>Date.now();
const gameNow=()=>{ try{ const h=host(), v=h&&h.now&&h.now(); if(typeof v==='number'&&isFinite(v)) return v; }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const changed=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const int0=v=>Math.max(0,Math.floor(num(v)));
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return String(Math.round(num(v))); };
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const pl=(n,a,b)=>nT(n)+' '+(n===1?a:b);
const rarName=r=>{ try{ return (typeof RN==='function'&&RN(r))||''; }catch(e){ return ''; } };
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
const inbox=()=>{ try{ const L=MM().inbox(S,host()); return Array.isArray(L)?L:[]; }catch(e){ return []; } };
/* a carta pode ter id número (local) ou texto (servidor): a chave do HTML guarda o tipo para achar a carta certa de volta */
const keyOf=m=>(typeof m.id==='number'?'n':'s')+String(m.id);
const find=(k,L)=>(L||inbox()).find(m=>keyOf(m)===String(k))||null;
const pend=m=>!!(m&&m.hasAtt&&!m.claimed);
const unreadOf=m=>!m.read||pend(m);
const TYPES=['system','reward','guild','event'];
const typeOf=m=>TYPES.indexOf(m.type)>=0?m.type:'system';

/* ---------- imagens (só as que já existem no jogo) ---------- */
const IC={coin:'assets/ui/coin.png',gem:'assets/ui/gem.png',chest:'assets/ui/chest.png',forge:'assets/icons/menu/forge.png',food:'assets/icons/menu/pets.png',
  egg:'assets/icons/pets/pet_egg.png',mount:'assets/icons/menu/mounts.png'};
const RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade das telas V2 */
const rcOf=r=>RC[Math.max(0,Math.min(RC.length-1,int0(r)))];
/* ícone do item pelo espaço e pela era (assets/icons/slots/era<N>_<espaço>.png, os mesmos da tela de Equipamento) */
const SLOT_FILE={weapon:'weapon',armor:'vest',hat:'helmet',gloves:'gloves',boots:'boots',necklace:'necklace',wing:'wings'};
const SLOT_NAME={weapon:'Arma',armor:'Colete',hat:'Capacete',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'};
const ERA_MAX=8;
function eraNow(){ try{ const h=host(), e=h&&h.eraMax?h.eraMax():(S.eraMax|0); return Math.max(0,Math.min(ERA_MAX,int0(e))); }catch(e){ return 0; } }
const slotImg=(slot,e)=>'assets/icons/slots/era'+Math.max(0,Math.min(ERA_MAX,int0(e)))+'_'+SLOT_FILE[slot]+'.png';
const petDef=id=>{ try{ return (Sys.pet.DATA.pets||[]).find(p=>p.id===id)||null; }catch(e){ return null; } };
const skinDef=id=>{ try{ const A=Sys.appearance; return (A&&typeof A.fixedSkins==='function'?A.fixedSkins(S,host()):[]).find(k=>k.id===id)||null; }catch(e){ return null; } };
/* ícone do pet: os 9 pets novos têm arquivo com outro nome (mesma tabela CL_ART do js/p_colecao.js; a de lá vale quando está carregada); os outros usam
   <sprite>_ref.png; sem nada disso, o ovo */
const PET_ART={shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'};
function petImg(d){ if(!d) return IC.egg; let a=null; try{ if(typeof CL_ART!=='undefined'&&CL_ART&&CL_ART.pets) a=CL_ART.pets[d.id]; }catch(e){} if(!a) a=PET_ART[d.id];
  return a?'assets/icons/pets/'+a+'.png':d.sprite&&!/^pet_/.test(d.sprite)?'assets/icons/pets/'+d.sprite+'_ref.png':IC.egg; }
const MAT=[['forge','Pedras de forja',IC.forge],['stones','Pedras de treino',IC.forge],['food','Ração',IC.food],['essence','Essência',IC.chest],['xp','Experiência',null]];

/* PEÇAS DO PRÊMIO: lidas do pacote real da carta. {img|null, b (valor), s (nome), rc (cor da raridade), tag, vis (é visual)} */
function pieces(att){ const out=[]; if(!att||typeof att!=='object') return out;
  if(int0(att.gold)) out.push({img:IC.coin,b:kfT(int0(att.gold)),s:'Ouro'});
  if(num(att.goldk)>0) out.push({img:IC.coin,b:'×'+nT(att.goldk),s:'Ouro de abate'});
  if(int0(att.gems)) out.push({img:IC.gem,b:'×'+nT(int0(att.gems)),s:'Diamantes'});
  for(const m of MAT) if(int0(att[m[0]])) out.push({img:m[2],b:'×'+nT(int0(att[m[0]])),s:m[1],ltr:m[0]==='xp'?'XP':''});
  for(const it of Array.isArray(att.items)?att.items:[]){ if(!it||!SLOT_FILE[it.slot]) continue;
    out.push({img:slotImg(it.slot,it.e!=null?it.e:eraNow()),b:rarName(int0(it.r))||SLOT_NAME[it.slot],s:SLOT_NAME[it.slot],rc:rcOf(it.r),tag:'ITEM'}); }
  for(const r of Array.isArray(att.eggs)?att.eggs:[]) out.push({img:IC.egg,b:rarName(int0(r))||'Ovo',s:'Ovo de pet',rc:rcOf(r)});
  if(att.skin){ const k=skinDef(att.skin);
    out.push(k?{img:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':null,b:rarName(int0(k.r))||'Visual',s:String(k.name||'Visual'),rc:rcOf(k.r),tag:'VISUAL',vis:true,ltr:'V'}
      :{img:null,b:'Visual',s:'Visual do herói',tag:'VISUAL',vis:true,ltr:'V'}); }
  if(att.petFrags&&typeof att.petFrags==='object') for(const id in att.petFrags){ const n=int0(att.petFrags[id]); if(!n) continue; const d=petDef(id);
    out.push({img:petImg(d),b:'×'+nT(n),s:d?'Fragm. '+d.name:'Fragm. de pet',rc:d?rcOf(d.r):''}); }
  if(int0(att.mountFrags)) out.push({img:IC.mount,b:'×'+nT(int0(att.mountFrags)),s:'Fragm. de montaria'});
  if(att.newDrops&&typeof att.newDrops==='object') out.push({img:IC.chest,b:'Prêmio',s:'Aparece ao resgatar'});   /* o prêmio é da tabela do Sys.newDrops, decidido no resgate */
  return out; }

/* resumo do que o Sys.loot.grantBundle entregou (inclui o que ficou guardado por nível) */
function gotText(g){ if(!g||typeof g!=='object') return 'prêmio recebido'; const a=[];
  if(g.gold) a.push(kfT(g.gold)+' de ouro'); if(g.gems) a.push(pl(g.gems,'diamante','diamantes'));
  if(g.forge) a.push(pl(g.forge,'pedra de forja','pedras de forja')); if(g.stones) a.push(pl(g.stones,'pedra de treino','pedras de treino'));
  if(g.food) a.push(nT(g.food)+' de ração'); if(g.essence) a.push(nT(g.essence)+' de essência'); if(g.xp) a.push(kfT(g.xp)+' de experiência');
  if(g.items&&g.items.length) a.push(pl(g.items.length,'item','itens')); if(g.eggs&&g.eggs.length) a.push(pl(g.eggs.length,'ovo','ovos'));
  if(g.skin) a.push('visual novo');
  if(g.petFrags&&typeof g.petFrags==='object'){ let n=0; for(const id in g.petFrags) n+=int0(g.petFrags[id]); if(n) a.push(pl(n,'fragmento de pet','fragmentos de pet')); }
  if(g.mountFrags&&g.mountFrags.n) a.push(pl(g.mountFrags.n,'fragmento de montaria','fragmentos de montaria'));
  if(Array.isArray(g.newDrops)&&g.newDrops.length){ const got=g.newDrops.filter(d=>d&&d.held!==true), kept=g.newDrops.length-got.length;
    if(got.length) a.push(pl(got.length,'prêmio novo','prêmios novos')); if(kept) a.push(kept===1?'1 prêmio guardado para quando for liberado':nT(kept)+' prêmios guardados para quando forem liberados'); }
  const held=(g.heldItems||[]).length+(g.heldEggs||[]).length; if(held) a.push(held===1?'1 guardado até o nível certo':nT(held)+' guardados até o nível certo');
  return a.join(', ')||'prêmio recebido'; }
/* motivo da recusa do módulo, em texto (o cartão volta para o lugar) */
function whyText(r){ const k=String((r&&r.reason)||'').toLowerCase();
  if(k==='resgatado') return 'O prêmio desta carta já foi resgatado.';
  if(k==='novos_desligado') return 'Este prêmio fica guardado na carta até os itens novos serem liberados.';
  if(k==='desligado') return 'O Correio ainda não está ativo.';
  if(k==='id') return 'Esta carta não está mais na caixa.';
  if(k==='sem_anexo') return 'Esta carta não tem prêmio.';
  if(/mochila|cheia|bag|full/.test(k)) return 'Mochila cheia: libere espaço e resgate de novo.';
  return 'Não foi possível resgatar agora. Tente de novo.'; }

/* ---------- datas (texto neutro: sem contagem regressiva) ---------- */
const p2=v=>String(v).padStart(2,'0');
function agoText(at){ const d=new Date(num(at)), n=new Date(gameNow()), a=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()), b=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()), k=Math.round((a-b)/86400000);
  return k<=0?'hoje':k===1?'ontem':'há '+nT(k)+' dias'; }
function untilText(exp){ const d=new Date(num(exp)); return 'vale até '+p2(d.getDate())+'/'+p2(d.getMonth()+1); }

const SV={
  reward:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="18" height="12" rx="2" fill="#ffd25e" stroke="#9a5a10" stroke-width="1.5"></rect><path d="M3 9h18v4H3z" fill="#f4a52a"></path><path d="M12 9v12" stroke="#9a5a10" stroke-width="2"></path><path d="M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 1 6-1.5S14 5 12 9z" fill="#ff6b9a"></path></svg>',
  guild:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z" fill="#5ee7ff" stroke="#16306e" stroke-width="1.6"></path><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff6d6"></path></svg>',
  event:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.6 6.3 6.6.5-5 4.4 1.6 6.5L12 16.2 6.2 19.7l1.6-6.5-5-4.4 6.6-.5z" fill="#a97bff" stroke="#3a1a6e" stroke-width="1.3"></path></svg>',
  system:'<svg viewBox="0 0 24 24" fill="none" stroke="#dfe5ff" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2.5"></rect><path d="M3.5 6.5L12 13l8.5-6.5"></path></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="#7dffb8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6"></path></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>',
  box:'<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 24l24-14 24 14v26a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#26338a" stroke="#7f93ff" stroke-width="2.5" stroke-linejoin="round"></path><path d="M8 24l24 16 24-16" fill="none" stroke="#7f93ff" stroke-width="2.5" stroke-linejoin="round"></path><path d="M16 20h32v12L32 42 16 32z" fill="#eef1ff" opacity=".9"></path></svg>' };

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.m3{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--rose:#ff6b9a;--green:#5ef0a0;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.m3 *{box-sizing:border-box}
.m3 button{color:inherit;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.m3 .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.m3-in{animation:m3-fade .22s ease-out}
@keyframes m3-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.m3-bg{position:absolute;left:0;right:0;top:0;height:360px;pointer-events:none}
.m3-bg2{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;background:radial-gradient(110% 40% at 50% 22%,rgba(255,210,94,.16),rgba(255,210,94,0) 60%),linear-gradient(180deg,rgba(11,16,48,.1) 0,rgba(11,16,48,.35) 180px,var(--night) 320px)}
.m3-stage{position:relative;z-index:2;flex:none;min-width:0;overflow:hidden}
.m3-stage canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.m3-still{position:absolute;left:50%;bottom:6%;height:80%;transform:translateX(-50%);object-fit:contain}
.m3-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:24px;padding:2px 10px;border-radius:12px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;line-height:1.2;text-align:center;width:max-content;max-width:94%;overflow-wrap:anywhere}
.m3-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.m3-say{position:absolute;z-index:4;left:50%;top:34px;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:7px 12px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;overflow-wrap:anywhere;pointer-events:none;animation:m3-tin .25s ease-out both}
@keyframes m3-tin{from{opacity:0;transform:translate(-50%,-8px)}}
.m3-bt,.xs .m3-bt{flex:none;min-width:76px;min-height:40px;padding:4px 12px;border-radius:12px;border:0;font-weight:900;font-size:13px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:5px;text-align:center;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.m3-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.m3-bt.off,.xs .m3-bt.off{background:rgba(255,255,255,.06);color:#9aa6d6;box-shadow:none;border:1px solid rgba(130,150,255,.28)}
.m3-bt.ghost,.xs .m3-bt.ghost{background:rgba(255,255,255,.08);color:#eef1ff;box-shadow:none;border:1px solid rgba(160,180,255,.5)}
.m3-body{position:relative;z-index:3;flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:6px 12px 14px}
.m3-hint{font-size:11px;color:var(--muted);margin:2px 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.m3-hint b{color:var(--gold)}
.m3-empty{text-align:center;padding:26px 18px;color:var(--muted);font-weight:800;font-size:13px;line-height:1.5;overflow-wrap:anywhere}
.m3-empty svg{width:64px;height:64px;display:block;margin:0 auto 10px;opacity:.85}
.m3-empty b{display:block;color:var(--text);font-size:15px;margin-bottom:4px}
.m3-foot{position:relative;z-index:5;flex:none;display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px;padding-bottom:max(14px,env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(11,16,48,0),var(--night) 30%);min-width:0}
.m3-foot .m3-bt{flex:1 1 0;min-width:0;min-height:48px;font-size:14px}
.m3-foot .m3-bt:first-of-type{flex:0 1 40%}
.m3-foot p{flex:1 1 100%;margin:0;font-size:12px;font-weight:800;color:var(--text);line-height:1.35;text-align:center;overflow-wrap:anywhere}
.m3-lic{flex:none;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;position:relative}
.m3-lic svg{width:24px;height:24px}
.m3-lic.reward{background:rgba(255,210,94,.18)}
.m3-lic.guild{background:rgba(94,231,255,.16)}
.m3-lic.event{background:rgba(169,123,255,.18)}
.m3-lic.system{background:rgba(255,255,255,.08)}
.m3-dot{position:absolute;right:-3px;top:-3px;width:12px;height:12px;border-radius:50%;background:var(--cyan);border:2px solid var(--night);box-shadow:0 0 8px var(--cyan)}
.m3-bdg{flex:none;font-size:10px;font-weight:900;padding:2px 7px;border-radius:8px;line-height:1.4;text-align:center}
.m3-bdg.new{background:rgba(94,231,255,.18);color:var(--cyan)}
.m3-bdg.exp{background:rgba(255,210,94,.16);color:var(--gold);border:1px solid rgba(255,210,94,.55)}
.m3-bdg.got{background:rgba(94,240,160,.15);color:var(--green)}
.m3-bdg.cos{background:rgba(255,107,154,.2);color:#ffd6e2}
.m3-cw{position:relative;margin-bottom:8px;border-radius:16px;overflow:hidden}
.m3-under{position:absolute;inset:0;display:flex;align-items:center;gap:8px;padding-left:18px;border-radius:16px;background:linear-gradient(90deg,#1b7a4c,#0f3b2a);color:#c9ffe2;font-size:18px;letter-spacing:.5px}
.m3-under svg{width:26px;height:26px;flex:none}
.m3-under.go{background:linear-gradient(90deg,#22c47a,#127046);color:#fff}
.m3-cd{position:relative;border-radius:16px;background:linear-gradient(160deg,#283480,#121946);border:1px solid var(--line);padding:8px 9px 9px;touch-action:pan-y;user-select:none;-webkit-user-select:none;min-width:0}
.m3-cd.unr{border-color:rgba(94,231,255,.65)}
.m3-cd.pend{box-shadow:inset 0 0 0 1px rgba(255,210,94,.35)}
.m3-cd.exp{border-color:rgba(255,210,94,.8)}
.m3-cd.got{background:#141a42}
.m3-cd.drag{box-shadow:0 10px 22px rgba(0,0,0,.5);border-color:var(--green)}
.m3-ch,.xs .m3-ch{display:flex;align-items:center;gap:8px;width:100%;min-height:44px;border:0;background:none;padding:0;text-align:left;color:#eef1ff}
.m3-mi{flex:1;min-width:0}
.m3-mi b{display:block;font-size:13px;line-height:1.2;overflow-wrap:anywhere}
.m3-cd:not(.unr) .m3-mi b{color:#c9d0f0}
.m3-mi small{display:block;font-size:10.5px;color:var(--muted);font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.m3-bs{flex:none;max-width:38%;display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.m3-rwd{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:7px}
.m3-tl{position:relative;border-radius:12px;border:2px solid var(--rc,rgba(160,180,255,.5));background:radial-gradient(circle at 50% 32%,#27306f,#0c1238 78%);padding:4px 3px;text-align:center;min-width:0}
.m3-tl img,.m3-tl .ltr{display:block;width:46px;max-width:100%;height:46px;margin:0 auto;object-fit:contain}
.m3-tl .ltr{display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--gold)}
.m3-tl b{display:block;font-size:12px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.m3-tl small{display:block;font-size:9px;color:var(--muted);font-weight:800;line-height:1.2;overflow-wrap:anywhere}
.m3-tl .rb{position:absolute;left:3px;top:3px;font-size:8px;font-weight:900;padding:1px 4px;border-radius:5px;background:var(--rose);color:#3a0716;letter-spacing:.3px}
.m3-tl.more{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;color:var(--gold)}
.m3-tl.more small{font-family:Nunito,system-ui,sans-serif}
.m3-cd.got .m3-tl{opacity:.42}
.m3-txt{margin:7px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:#dfe5ff;white-space:pre-wrap;overflow-wrap:anywhere}
.m3-why{margin:7px 0 0;padding:6px 9px;border-radius:10px;background:rgba(255,107,154,.14);border:1px solid rgba(255,107,154,.55);font-size:12px;font-weight:800;line-height:1.35;color:#ffd6e2;overflow-wrap:anywhere}
.m3-ca{display:flex;align-items:center;gap:6px;margin-top:8px;min-width:0}
.m3-sw{flex:1;min-width:0;min-height:40px;border-radius:12px;background:rgba(94,240,160,.1);border:1px dashed rgba(94,240,160,.55);display:flex;align-items:center;gap:6px;padding:2px 10px;font-size:11.5px;font-weight:900;line-height:1.2;color:#bff5d8;overflow-wrap:anywhere}
.m3-sw svg{width:18px;height:18px;flex:none;animation:m3-nudge 1.4s ease-in-out infinite}
@keyframes m3-nudge{0%,100%{transform:translateX(0)}50%{transform:translateX(5px)}}
.m3-info{flex:1;min-width:0;font-size:11px;font-weight:800;color:var(--muted);line-height:1.3;overflow-wrap:anywhere}
.m3-info b{color:var(--green)}
.m3-gate{position:relative;z-index:3;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.m3-gate .m3-bt{min-height:48px;padding:0 26px;font-size:15px}
.m3-msg{font-size:13px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.m3-in,.m3-say,.m3-sw svg{animation:none}}
`; document.head.appendChild(el); })();

/* ---------- aviso: faixa de texto DENTRO do palco (lá não há botão; nunca fica por cima do que o jogador acabou de tocar) ---------- */
const sayHtml=m=>'<div class="m3-say" role="status">'+esc2(m)+'</div>';
function say(m){ X.say=String(m||''); X.sayT=now(); try{ const el=document.getElementById('m3_say'); if(el) el.innerHTML=X.say?sayHtml(X.say):''; }catch(e){} }

/* ================= PALCO (canvas): o herói do jogo com o pet na frente; as peças resgatadas voam até ele ================= */
const IMG={};
function img(u){ let o=IMG[u]; if(o!==undefined) return o; try{ if(typeof Image==='undefined'){ IMG[u]=null; return null; } o=new Image(); o.src=u; IMG[u]=o; }catch(e){ o=IMG[u]=null; } return o; }
const okImg=i=>!!(i&&i.complete&&i.naturalWidth>0);
const canDraw=()=>{ try{ return !X.err&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
function heroState(t){ try{ const K=window.StageKit; if(K&&typeof K.toState==='function') return K.toState({},{t:t}); }catch(e){} return {t:t}; }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000); X.t=t; const x=c.getContext('2d'), W=c.width, H=c.height;
  x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,W,H);
  const fx=W*0.5, fy=H*0.92, k=H*0.62/HS;
  try{ const g=x.createRadialGradient(fx,fy,4,fx,fy,W*0.4); g.addColorStop(0,'rgba(255,210,94,.28)'); g.addColorStop(1,'rgba(255,210,94,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(fx,fy,W*0.42,H*0.09,0,0,7); x.fill(); }catch(e){}
  window.drawHeroFull(x,fx,fy,k,heroState(t));   /* arma na mão; o pet é o último desenho do drawHeroFull (na frente) */
  x.setTransform(1,0,0,1,0,0);
  /* peças voando da lista (embaixo) até o peito do herói */
  X.fly=X.fly.filter(p=>t-p.t<1.1+p.d&&t>=p.t-0.01);
  for(const p of X.fly){ const u=Math.max(0,Math.min(1,(t-p.t-p.d)/0.9)); if(u<=0) continue; const im=img(p.img); if(!okImg(im)) continue;
    const sx=p.x*W, sy=H+20*dpr, ex=fx, ey=fy-H*0.36, cx=(sx+ex)/2, cy=Math.min(sy,ey)-40*dpr, q=1-u, xx=q*q*sx+2*q*u*cx+u*u*ex, yy=q*q*sy+2*q*u*cy+u*u*ey, s=26*dpr*(1-u*0.5);
    x.save(); x.globalAlpha=u>0.85?(1-u)/0.15:1; x.drawImage(im,xx-s/2,yy-s/2,s,s); x.restore(); }
  X.fx=X.fx.filter(p=>t-p.t<1.3&&t>=p.t-0.01);
  for(const p of X.fx){ const a=(t-p.t)/1.3; x.save(); x.globalAlpha=1-a; x.font='900 '+Math.round(14*dpr)+'px Nunito,sans-serif'; x.textAlign='center'; x.lineWidth=3*dpr; x.strokeStyle='rgba(0,0,0,.6)'; x.fillStyle='#5ef0a0';
    const py=fy-H*0.62-a*18*dpr; x.strokeText(p.s,fx,py); x.fillText(p.s,fx,py); x.restore(); } }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('m3_cv'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){ X.err=1; redraw(); return; }   /* o desenho do jogo falhou: a tela troca para o retrato parado e continua funcionando */
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&canDraw()&&document.getElementById('m3_cv')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }
function still(){ try{ const A=window.Sys&&Sys.appearance, k=A&&typeof A.avatarKey==='function'?A.avatarKey(S,host()):null; return k?'assets/hero/avatar/'+k+'.png':null; }catch(e){ return null; } }
/* peças da carta saindo em leque para o herói (só desenho; a entrega já foi feita pelo módulo) */
function fly(att,delay){ const P=pieces(att).filter(p=>p.img).slice(0,6); P.forEach((p,i)=>{ X.fly.push({img:p.img,x:0.15+((i*0.17)%0.7),t:X.t,d:(delay||0)+i*0.12}); }); if(X.fly.length>40) X.fly.splice(0,X.fly.length-40); }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="m3-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.4,0.9):'#16110d')+'"></div><div class="m3-bg2"></div>';
function gateHtml(msg,alert){ return '<div class="m3">'+bgHtml()+'<div class="m3-gate"><span class="lil" style="font-size:26px">Correio</span>'
  +'<span class="m3-msg" role="'+(alert?'alert':'note')+'">'+esc2(msg)+'</span><button class="m3-bt" data-x="back">Voltar</button></div></div>'; }
function tile(p){ const art=p.img?'<img src="'+esc2(p.img)+'" alt="">':'<span class="ltr lil" aria-hidden="true">'+esc2(p.ltr||String(p.s).charAt(0))+'</span>';
  return '<div class="m3-tl"'+(p.rc?' style="--rc:'+p.rc+'"':'')+'>'+(p.tag?'<span class="rb">'+esc2(p.tag)+'</span>':'')+art+'<b>'+esc2(p.b)+'</b><small>'+esc2(p.s)+'</small></div>'; }
function subText(m){ return esc2(m.from||'')+' · '+esc2(agoText(m.at))+' · '+esc2(untilText(m.exp)); }
function badges(m,pcs){ const P=pend(m); let h='';
  if(P&&num(m.daysLeft)<=SOON_DAYS) h+='<span class="m3-bdg exp">'+esc2(untilText(m.exp).replace(/^v/,'V'))+'</span>'; else if(!m.read) h+='<span class="m3-bdg new">Nova</span>';
  if(m.claimed) h+='<span class="m3-bdg got">Resgatado</span>'; else if(pcs.some(p=>p.vis)) h+='<span class="m3-bdg cos">Visual</span>';
  return h; }
function card(m){ const k=keyOf(m), P=pend(m), pcs=pieces(m.att), op=X.open===k||!m.hasAtt, un=unreadOf(m), ek=esc2(k), et=esc2(m.title);
  let tiles=''; if(pcs.length){ const cut=pcs.length>4&&!op, show=cut?pcs.slice(0,3):pcs;
    tiles='<div class="m3-rwd" aria-label="Prêmio da carta">'+show.map(tile).join('')+(cut?'<div class="m3-tl more lil">+'+nT(pcs.length-3)+'<small>toque no título</small></div>':'')+'</div>'; }
  const body=op&&m.body?'<p class="m3-txt">'+esc2(m.body)+(Array.isArray(m.att&&m.att.items)&&m.att.items.length?' Item acima do seu nível fica guardado até você poder usar.':'')+'</p>':'';
  const why=X.why&&X.why.k===k?'<p class="m3-why" role="alert">'+esc2(X.why.txt)+'</p>':'';
  let act='';
  if(P) act='<div class="m3-sw" aria-hidden="true">'+SV.arrow+'<span>Arraste para a direita</span></div><button class="m3-bt" data-x="claim" data-id="'+ek+'" data-nodrag="1" aria-label="Resgatar: '+et+'">Resgatar</button>';
  else { const info=m.claimed?'<span class="m3-info"><b>Resgatado.</b> '+(X.last&&X.last.k===k?esc2(X.last.txt.charAt(0).toUpperCase()+X.last.txt.slice(1))+'.':'Já está na sua conta.')+'</span>'
      :!m.read?'<span class="m3-info">Toque no título para ler.</span>':'<span class="m3-info">Lida.</span>';
    act=info+(m.read?'<button class="m3-bt off" data-x="del" data-id="'+ek+'" data-nodrag="1" aria-label="Apagar: '+et+'">Apagar</button>':''); }
  return '<div class="m3-cw"><div class="m3-under lil" aria-hidden="true">'+SV.check+'Resgatar</div><div class="m3-cd'+(un?' unr':'')+(P?' pend':'')+(P&&num(m.daysLeft)<=SOON_DAYS?' exp':'')+(m.claimed?' got':'')+'" data-card="'+ek+'">'
    +'<button class="m3-ch" data-x="open" data-id="'+ek+'" aria-expanded="'+op+'"><span class="m3-lic '+typeOf(m)+'">'+SV[typeOf(m)]+(un?'<span class="m3-dot"></span>':'')+'</span>'
    +'<span class="m3-mi"><b>'+et+'</b><small>'+subText(m)+'</small></span><span class="m3-bs">'+badges(m,pcs)+'</span></button>'
    +tiles+body+why+'<div class="m3-ca">'+act+'</div></div></div>'; }
/* ordem do protótipo: com prêmio primeiro (a que vale por menos tempo em cima), depois as não lidas, depois o resto; dentro do grupo, a mais nova primeiro */
function ordered(L){ const rank=m=>pend(m)?0:!m.read?1:2; return L.slice().sort((a,b)=>rank(a)-rank(b)||(rank(a)===0?(num(a.exp)-num(b.exp)):0)||(num(b.at)-num(a.at))); }
const canDel=m=>m.read&&!pend(m);
function footHtml(L){ const p=L.filter(pend).length, rd=L.filter(canDel).length;
  if(X.conf&&rd) return '<div class="m3-foot"><p role="alert">Apagar '+(rd===1?'1 carta lida':nT(rd)+' cartas lidas')+'? Carta com prêmio para resgatar não é apagada.</p>'
    +'<button class="m3-bt ghost" data-x="delno">Cancelar</button><button class="m3-bt" data-x="delyes">Apagar'+(rd>1?' as '+nT(rd):'')+'</button></div>';
  return '<div class="m3-foot"><button class="m3-bt off" data-x="delread" aria-disabled="'+(!rd)+'">Apagar lidas'+(rd?' ('+nT(rd)+')':'')+'</button>'
    +'<button class="m3-bt'+(p?'':' off')+'" data-x="all" aria-disabled="'+(!p)+'">'+(p?'Resgatar tudo ('+nT(p)+')':'Nada para resgatar')+'</button></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{};
  if(!mOk()){ V.innerHTML=xWrap(d,'',gateHtml('Correio indisponível agora.',true)); X.sig='x'; return; }
  if(!mOn()){ V.innerHTML=xWrap(d,'',gateHtml('O Correio ainda não está ativo. Prêmios de Arena, Torneio, guilda e eventos vão chegar aqui.',false)); X.sig='off'; return; }
  let y0=0; try{ const sc0=X.top?null:document.getElementById('m3_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const L=inbox(), p=L.filter(pend).length, Hh=+d.H||0, SH=Hh&&Hh<600?108:132, max=int0(MM().DATA.max);
  if(X.open&&!find(X.open,L)) X.open=null; if(X.why&&!find(X.why.k,L)) X.why=null; if(!L.some(canDel)) X.conf=false;
  const st=still(), alt=heroName()+' com a arma na mão e o pet na frente; ao resgatar, os prêmios voam até '+(heroId()==='kaia'?'ela':'ele');
  const stage='<div class="m3-stage" style="height:'+SH+'px">'+(canDraw()?'<canvas id="m3_cv" role="img" aria-label="'+esc2(alt)+'"></canvas>':st?'<img class="m3-still" src="'+esc2(st)+'" alt="'+esc2(heroName())+'">':'')
    +'<div class="m3-who"><i></i><span>'+esc2(heroName())+' · '+(p?pl(p,'carta com prêmio','cartas com prêmio'):L.length?'tudo resgatado':'caixa vazia')+'</span></div>'
    +'<div id="m3_say">'+(X.say&&now()-X.sayT<2600?sayHtml(X.say):'')+'</div></div>';
  const list=L.length?'<p class="m3-hint">'+(p?'<b>'+nT(p)+' com prêmio.</b> Arraste o cartão para a direita ou toque em Resgatar.':'Tudo resgatado.')+' '+nT(L.length)+(max?' de '+nT(max):'')+(L.length===1?' carta.':' cartas.')+'</p>'+ordered(L).map(card).join('')
    :'<div class="m3-empty" role="note">'+SV.box+'<b>Sua caixa está vazia</b>Prêmios de Arena, Torneio, guilda e eventos chegam aqui. Nada é vendido no Correio.</div>';
  V.innerHTML=xWrap(d,'','<div class="m3'+(X.anim?' m3-in':'')+'">'+bgHtml()+stage+'<div id="m3_scroll" class="m3-body x-scroll">'+list+'</div>'+footHtml(L)+'</div>');
  if(y0){ try{ const sc=document.getElementById('m3_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (carta nova do servidor, carta vencida, chave do módulo): o tick redesenha só quando muda */
function sig(){ if(!mOk()) return 'x'; if(!mOn()) return 'off'; try{ return inbox().map(m=>keyOf(m)+(m.read?'r':'')+(m.claimed?'c':'')+num(m.daysLeft)).join('|')+'#'+heroId(); }catch(e){ return ''; } }

/* ================= ações (toda entrega é do módulo; a tela só chama e mostra o resultado) ================= */
/* resgata UMA carta pela função do módulo. Devolve true se entregou. el = cartão arrastado (para a animação de saída ou de volta) */
function claimCard(k,el){ const m=find(k); let r=null;
  if(m&&!m.hasAtt){ try{ MM().read(S,host(),m.id); }catch(e){} changed(); r={ok:false,reason:'sem_anexo'}; }   /* carta sem prêmio: só marca como lida */
  else if(m){ try{ r=MM().claim(S,host(),m.id); }catch(e){ r=null; } }
  else r={ok:false,reason:'id'};
  const ok=!!(r&&r.ok);
  if(ok){ const txt=gotText(r.got); X.why=null; X.last={k:String(k),txt:txt}; sfx('claim'); changed(); fly(m.att,0); X.fx.push({s:'Resgatado!',t:X.t+0.7}); say('Resgatado: '+txt); }
  else { X.why={k:String(k),txt:whyText(r),t:now()}; sfx('ui_tap'); say(X.why.txt); }
  if(el&&el.style){ try{ if(ok){ el.style.transition='transform .18s ease-in'; el.style.transform='translateX(105%)'; } else { el.style.transition='transform .2s ease-out'; el.style.transform=''; if(el.classList) el.classList.remove('drag'); } }catch(e){}
    setTimeout(redraw,ok?190:210); }
  else redraw();
  return ok; }
function claimAll(){ const M=MM(), n0p=inbox().filter(pend).length; if(!n0p){ sfx('ui_tap'); say('Nenhum prêmio para resgatar.'); return; }
  let r=null; try{ r=M.claimAll(S,host()); }catch(e){ r=null; }
  const n=int0(r&&r.n), left=inbox().filter(pend).length; X.why=null;
  if(!n){ sfx('ui_tap'); say(left?'Nenhum prêmio pôde ser resgatado agora.':'Nenhum prêmio para resgatar.'); redraw(); return; }
  sfx('claim'); changed(); (r.list||[]).slice(0,4).forEach((o,i)=>{ const m=find((typeof o.id==='number'?'n':'s')+String(o.id)); if(m) fly(m.att,i*0.25); }); X.fx.push({s:'Resgatado!',t:X.t+0.7});
  say((n===1?'1 carta resgatada':nT(n)+' cartas resgatadas')+(left?'. '+(left===1?'1 ficou':nT(left)+' ficaram')+' para depois':'')+'.'); redraw(); }
function delRead(){ const M=MM(); let n=0; for(const m of inbox()) if(canDel(m)){ try{ if(M.remove(S,host(),m.id)) n++; }catch(e){} }
  X.conf=false; X.open=null; if(n) changed(); say(n===1?'1 carta apagada.':nT(n)+' cartas apagadas.'); redraw(); }

const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  open(b){ const k=String(b.dataset.id||''), m=find(k); if(!m) return; sfx('ui_tap'); X.conf=false; X.open=(X.open===k&&m.hasAtt)?null:k;
    if(!m.read){ try{ MM().read(S,host(),m.id); }catch(e){} changed(); } redraw(); },
  claim(b){ X.conf=false; claimCard(String(b.dataset.id||''),null); },
  del(b){ const k=String(b.dataset.id||''), m=find(k); if(!m) return; sfx('ui_tap'); X.conf=false; let ok=false; try{ ok=MM().remove(S,host(),m.id); }catch(e){ ok=false; }
    if(!ok){ X.why={k:k,txt:'Resgate o prêmio antes de apagar esta carta.',t:now()}; redraw(); return; }
    if(X.open===k) X.open=null; changed(); say('Carta apagada.'); redraw(); },
  all(){ X.conf=false; claimAll(); },
  delread(){ sfx('ui_tap'); if(!inbox().some(canDel)){ say('Não há cartas lidas para apagar.'); return; } X.conf=true; redraw(); },
  delno(){ sfx('ui_tap'); X.conf=false; redraw(); },
  delyes(){ sfx('ui_tap'); delRead(); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!mOn()) return;
  if(now()<X.noClick||X.drag&&X.drag.on) return;   /* o toque que sobra depois de um arrasto não abre nem resgata nada */
  return ACT[a](b); }

/* ================= GESTO: arrastar o cartão para a direita ================= */
function pDown(ev){ if(!isOn()||X.drag||!mOn()) return; if(ev.button>0||ev.isPrimary===false) return; const t=ev.target; if(!t||typeof t.closest!=='function') return;
  if(t.closest('[data-nodrag]')) return; const cd=t.closest('[data-card]'); if(!cd||!cd.dataset) return;
  const m=find(cd.dataset.card); if(!pend(m)) return;   /* só carta com prêmio para resgatar */
  let w=0; try{ w=cd.getBoundingClientRect().width; }catch(e){} X.drag={k:keyOf(m),el:cd,x0:+ev.clientX||0,y0:+ev.clientY||0,w:w>0?w:300,on:false,p:0,pid:ev.pointerId}; }
function pMove(ev){ const d=X.drag; if(!d||(d.pid!=null&&ev.pointerId!=null&&ev.pointerId!==d.pid)) return; const dx=(+ev.clientX||0)-d.x0, dy=(+ev.clientY||0)-d.y0;
  if(!d.on){ if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){ X.drag=null; return; }   /* movimento vertical: é a rolagem da lista */
    if(dx>8&&dx>Math.abs(dy)){ d.on=true; try{ d.el.setPointerCapture(d.pid); }catch(e){} try{ d.el.classList.add('drag'); }catch(e){} } else return; }
  d.p=Math.max(0,Math.min(1,dx/d.w));
  try{ d.el.style.transition='none'; d.el.style.transform='translateX('+(d.p*100).toFixed(1)+'%)'; const u=d.el.parentNode&&d.el.parentNode.querySelector?d.el.parentNode.querySelector('.m3-under'):null; if(u&&u.classList) u.classList.toggle('go',d.p>=SWIPE); }catch(e){} }
function pEnd(ev,cancel){ const d=X.drag; if(!d||(d.pid!=null&&ev&&ev.pointerId!=null&&ev.pointerId!==d.pid)) return; X.drag=null; if(!d.on) return; X.noClick=now()+350;
  if(!cancel&&d.p>=SWIPE&&isOn()){ claimCard(d.k,d.el); return; }
  try{ d.el.style.transition='transform .2s ease-out'; d.el.style.transform=''; d.el.classList.remove('drag'); const u=d.el.parentNode&&d.el.parentNode.querySelector?d.el.parentNode.querySelector('.m3-under'):null; if(u&&u.classList) u.classList.remove('go'); }catch(e){} }
(function(){ try{ if(typeof document==='undefined'||typeof document.addEventListener!=='function') return;
    document.addEventListener('pointerdown',pDown); document.addEventListener('pointermove',pMove);
    document.addEventListener('pointerup',ev=>pEnd(ev,false)); document.addEventListener('pointercancel',ev=>pEnd(ev,true)); }catch(e){} })();

/* imagens que a tela mostra agora (para a espera de carga do jogo: a tela não abre em "Carregando as imagens" pela metade) */
function urls(){ const u=[IC.coin,IC.gem]; const add=x=>{ if(x&&u.indexOf(x)<0) u.push(x); };
  try{ add(typeof xEraBgUrl==='function'?xEraBgUrl():''); if(mOn()) for(const m of inbox()) for(const p of pieces(m.att)) add(p.img); if(!canDraw()) add(still()); }catch(e){} return u; }

const def=Panels.add(N,{title:'Correio',actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.drag) return;
    if(X.say&&now()-X.sayT>2600){ X.say=''; try{ const el=document.getElementById('m3_say'); if(el) el.innerHTML=''; }catch(e){} }
    if(X.why&&now()-X.why.t>6000){ X.why=null; redraw(); return; }
    X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return !!(X.drag&&X.drag.on); },
  onOpen(){ loopStop(); X.open=null; X.conf=false; X.say=''; X.why=null; X.last=null; X.drag=null; X.noClick=0; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.err=0; X.fly=[]; X.fx=[]; },
  onClose(){ loopStop(); X.drag=null; X.conf=false; X.say=''; X.why=null; X.fly=[]; X.fx=[]; } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Mail2={X:X,actions:ACTIONS,def:def,urls:urls,pieces:pieces,SWIPE:SWIPE,IC:IC,slotImg:slotImg,SLOT_FILE:SLOT_FILE,petImg:petImg};
})();
