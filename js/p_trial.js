'use strict';
/* ================= PROVAÇÃO DO MESTRE — tela nova, nasce DESLIGADA (PANEL_ON.trial) =================
   Protótipo aprovado pelo dono: docs/proto/v2/Provacao.html. NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - marcos, teto, XP guardada, provações abertas, tentativas e bônus: Sys.trial.view(S, host) · selo do teto: Sys.trial.due(S, host);
   - regra, tempo, vida inicial e o inimigo (chefe da fase mais alta com os fatores do módulo): Sys.trial.spec(nível, host);
   - prêmio da 1ª vitória e o que a provação abre: o campo reward de cada linha do view (Sys.trial.rewardOf);
   - mestre (nome e papel): o campo master de cada linha (Sys.trial.master, que lê o Sys.mentors);
   - começar: Sys.trial.start(S, host, nível) (UMA chamada por toque em Lutar) · fim: Sys.trial.finish(S, host, {won, sec}) (UMA chamada por luta).
   A LUTA É A DA BATALHA DE VERDADE (js/battle.js): o spec do módulo pede regras que só ela conhece (sem pet, sem montaria, sem magias, metade da vida,
   relógio, chefe da fase com os fatores). Este arquivo NÃO luta e NÃO mexe na batalha. A ponte é esta (o Engenheiro liga):
     PTrial.battle = function(spec){ monta a luta e devolve true }   → chamada depois do Sys.trial.start aceitar, com o spec do módulo;
     PTrial.time(segundosQueFaltam)                                  → opcional, no laço da luta: move o relógio da faixa da regra;
     PTrial.finish({won, sec})                                       → no fim da luta (vitória, derrota, tempo esgotado ou saída): grava e abre o resultado.
   Sem PTrial.battle ligada, o botão Lutar explica que a luta ainda não está ligada e NÃO chama o módulo (nada é gravado).
   NA BATALHA (PTrial.mount(host) + PTrial.update() no fbTick, no molde do WeakSeal e do PCross): o selo "Teto Nv X" embaixo do FC (com a XP guardada)
   e, durante a luta, a faixa da regra embaixo da barra da fase. Os dois só existem com a tela ligada (Panels.on('trial')) E o módulo ligado.
   Retrato do mestre: PROVISÓRIO (silhueta desenhada no código). Quando a Arte entregar assets/mentors/m<era>.png, ligar PTrial.ART.portrait.
   Módulo desligado ou ausente: aviso e Voltar; nada é escrito no save. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('trial' in PANEL_ON)) PANEL_ON.trial=false;
const N='trial';
const ACTIONS=['go','back','sel','retry','cont','tip'];
const ART={portrait:false};   /* a Arte ainda não entregou os retratos dos mestres */
const X={mode:'card',sel:0,res:null,msg:'',tone:'',busy:false,run:null,left:null,anim:true,sig:'',tk:0,hud:null,hudSig:'',hudT:0,css:false};
const API={};

/* ---------- leituras dos módulos ---------- */
const TR=()=>(window.Sys&&window.Sys.trial)||null;
const ok=()=>{ const T=TR(); try{ return !!(T&&typeof T.on==='function'&&T.on()===true&&T.view&&T.due&&T.spec&&T.start&&T.finish); }catch(e){ return false; } };
const host=()=>(window.Sys&&window.Sys.host)||null;
const sv=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const isOn=()=>{ try{ return typeof view!=='undefined'&&view===N; }catch(e){ return false; } };
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return String(Math.round(num(v))); };
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const dec=v=>String(Math.round(num(v)*100)/100).replace('.',',');
const mmss=s=>{ s=Math.max(0,Math.ceil(num(s))); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const persist=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const viewOf=()=>{ try{ const v=TR().view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const specOf=l=>{ try{ return TR().spec(l,host())||null; }catch(e){ return null; } };
const capOn=()=>{ try{ return TR().DATA.cap!==false; }catch(e){ return true; } };
const levelNow=()=>{ try{ return Math.floor(num(window.Sys.level.level(sv()))); }catch(e){ return 0; } };
const eraName=e=>{ try{ if(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n) return String(ERAS[e].n); }catch(er){} return ''; };
/* era e número da fase mais alta (só para o rótulo e para a imagem do chefe): a conta é a do jogo (eraOf / STAGES_PER_ERA do index.html) */
function stageInfo(st){ st=Math.max(1,Math.floor(num(st))||1); let per=10, era=-1; try{ if(typeof STAGES_PER_ERA==='number'&&STAGES_PER_ERA>0) per=STAGES_PER_ERA; }catch(e){}
  try{ if(typeof eraOf==='function'){ const e=eraOf(st); if(Number.isInteger(e)&&e>=0) era=e; } }catch(e){}
  if(era<0) era=Math.floor((st-1)/per); const n=st-era*per; era=Math.max(0,Math.min(8,era));
  return {era:era,label:n>=1?(era+1)+'-'+n:String(st)}; }
const bossUrl=e=>'assets/enemies/era'+e+'_boss.png';
const IC={coin:'assets/ui/coin.png',gear:'assets/icons/menu/equipment.png',forge:'assets/icons/menu/forge.png',pets:'assets/icons/menu/pets.png'};
/* o modelo da tela: a provação aberta escolhida (ou a do teto), senão a próxima que ainda não abriu, senão "todas vencidas" */
function model(){ const v=viewOf(); if(!v) return null; const list=Array.isArray(v.list)?v.list:[], due=list.filter(x=>x&&x.open&&!x.passed);
  let row=due.find(x=>x.lvl===X.sel)||due.find(x=>x.lvl===v.due)||due[0]||null, kind='due';
  if(!row){ row=list.find(x=>x&&!x.passed&&!x.open)||null; kind=row?'next':'done'; }
  return {v:v,list:list,due:due,row:row,kind:kind,idx:row?list.indexOf(row)+1:0}; }
/* teto depois de vencer este marco: o próximo marco ainda não vencido (sem ele, o nível máximo) */
function capAfter(M,l){ const nx=M.list.find(x=>x&&x.lvl>l&&!x.passed); return nx?nx.lvl:0; }
/* XP guardada cheia? o tamanho do cofre é o do módulo (DATA.bankLevels níveis a partir do teto, pelo Sys.level.need) */
function bankFull(v){ try{ const L=window.Sys.level, D=TR().DATA; if(!v||!v.atCap||!L||typeof L.need!=='function') return false; let m=0;
    for(let i=0;i<Math.floor(num(D.bankLevels));i++) m+=Math.max(0,Math.floor(num(L.need(v.cap+i)))); return m>0&&num(v.bank)>=m; }catch(e){ return false; } }

const WHY={off:'A Provação do Mestre está desligada agora.',lvl:'Este nível não tem provação.',done:'Você já venceu esta provação.',
  level:'Você ainda não chegou ao nível desta provação.',none:'Não há provação em andamento.'};
const NO_BATTLE='A luta da provação ainda não está ligada nesta versão. Nada foi gasto.';

/* ---------- ícones desenhados no código (os do protótipo) ---------- */
const K='stroke="#1a110b" stroke-width="2.4" stroke-linejoin="round"';
const SV=inner=>'<svg class="pt-ic" viewBox="0 0 48 48" aria-hidden="true">'+inner+'</svg>';
const SLASH='<path d="M8 40L40 8" stroke="#1a110b" stroke-width="8" stroke-linecap="round"/><path d="M8 40L40 8" stroke="#ff5a4a" stroke-width="4.5" stroke-linecap="round"/>';
const CLOCK='<path d="M19 4h10M24 4v6" stroke="#1a110b" stroke-width="4" stroke-linecap="round"/><circle cx="24" cy="27" r="17" fill="#ffe07a" '+K+'/><path d="M24 27V15A12 12 0 0136 27z" fill="#f2a826"/><path d="M24 27l6-6" stroke="#1a110b" stroke-width="3" stroke-linecap="round"/>';
const RIC={
  nopet:'<ellipse cx="24" cy="31" rx="10" ry="8" fill="#e8b46a" '+K+'/><circle cx="12" cy="19" r="4.5" fill="#e8b46a" '+K+'/><circle cx="20" cy="12" r="4.5" fill="#e8b46a" '+K+'/><circle cx="29" cy="12" r="4.5" fill="#e8b46a" '+K+'/><circle cx="37" cy="19" r="4.5" fill="#e8b46a" '+K+'/>'+SLASH,
  t30:CLOCK,
  nomount:'<path d="M12 40V22a12 12 0 0124 0v18h-7V22a5 5 0 00-10 0v18z" fill="#b8c4d6" '+K+'/><circle cx="15.5" cy="30" r="1.6" fill="#1a110b"/><circle cx="32.5" cy="30" r="1.6" fill="#1a110b"/>'+SLASH,
  nospell:'<path d="M5 11c7-3 13-2 19 2v28c-6-4-12-5-19-2z" fill="#a98bff" '+K+'/><path d="M43 11c-7-3-13-2-19 2v28c6-4 12-5 19-2z" fill="#c9b4ff" '+K+'/>'+SLASH,
  half:'<path d="M24 42S6 31 6 18a9 9 0 0118-3 9 9 0 0118 3c0 13-18 24-18 24z" fill="#3a2a22" '+K+'/><path d="M24 42S6 31 6 18a9 9 0 0118-3z" fill="#ff5a6e" '+K+'/>'
};
const ruleIc=id=>SV(RIC[id]||CLOCK);
const STONE=SV('<path d="M10 18l14-12 14 12-6 22H16z" fill="#9ab4d6" '+K+'/><path d="M10 18h28M24 6l-6 12 6 22 6-22z" fill="none" stroke="#2a3a5a" stroke-width="2"/>');
const FOOD=SV('<path d="M30 6c8 0 12 6 12 12 0 8-8 14-16 12l-8 8a5 5 0 11-6-6l8-8c-2-8 2-18 10-18z" fill="#c8673a" '+K+'/><path d="M31 12c4 0 6 3 6 6" stroke="#ffd0a0" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="10" cy="38" r="3" fill="#f6ecdf"/>');
const KEY=SV('<circle cx="16" cy="18" r="10" fill="#ffc94a" '+K+'/><circle cx="16" cy="18" r="4" fill="#3a2508"/><path d="M23 25l17 17M33 35l5-5M38 40l4-4" fill="none" stroke="#1a110b" stroke-width="8" stroke-linecap="round"/><path d="M23 25l17 17M33 35l5-5M38 40l4-4" fill="none" stroke="#ffc94a" stroke-width="4" stroke-linecap="round"/>');
/* retrato PROVISÓRIO: silhueta (a arte do mestre vem depois) */
const SIL='<svg viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="40" r="19" fill="#0e0905"/><path d="M14 104c2-26 18-38 38-38s36 12 38 38z" fill="#0e0905"/></svg>';

const CSS=`.pt{position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;color:#f6ecdf;font-family:Nunito,system-ui,sans-serif}
.pt *{box-sizing:border-box}
.pt button,.pt-hud button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pt-ic{display:block}
.pt-lil{font-family:'Lilita One',Nunito,system-ui,sans-serif;font-weight:400}
.pt-in{animation:pt-fade .22s ease-out}
@keyframes pt-fade{from{opacity:0;transform:translateY(8px)}}
.pt-bd{flex:1;min-height:0;min-width:0;padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px}
.pt-bd>*{flex:none}
.pt-ms{display:flex;gap:10px;align-items:center;min-width:0}
.pt-por{position:relative;flex:none;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#5a4026,#1a120c 72%);border:3px solid #ffc94a;overflow:hidden}
.pt-por svg,.pt-por img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover}
.pt-por span{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:8.5px;font-weight:900;color:#2a1403;background:rgba(255,201,74,.92);line-height:13px}
.pt-mn{flex:1;min-width:0}
.pt-mn small{display:block;font-size:11px;font-weight:900;color:#c9b8a2;letter-spacing:.3px;line-height:1.25;overflow-wrap:anywhere}
.pt-mn b{display:block;font-size:28px;line-height:1.05;color:#ffc94a;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pt-mn i{display:block;font-style:normal;font-size:12.5px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.pt-mn q{display:block;margin-top:4px;font-size:11.5px;font-weight:800;font-style:italic;color:#c9b8a2;line-height:1.3;overflow-wrap:anywhere}
.pt-card{border-radius:15px;background:rgba(44,33,25,.94);border:1.5px solid #4a3a2b;padding:8px 10px;min-width:0}
.pt-card h4{margin:0 0 4px;font-size:15px;color:#ffc94a;display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 6px;line-height:1.2}
.pt-card h4 span{font-family:Nunito,system-ui,sans-serif;font-size:10.5px;font-weight:900;color:#c9b8a2;align-self:center}
.pt-card.rule{background:linear-gradient(180deg,#5a3a10,#3a2508);border:2px solid #ffc94a}
.pt-rl{display:flex;align-items:center;gap:9px;min-width:0}
.pt-rl svg{width:44px;height:44px;flex:none}
.pt-rl>div{flex:1;min-width:0}
.pt-rl b{display:block;font-size:22px;line-height:1.05;color:#fff;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pt-rl small{display:block;font-size:12px;font-weight:900;line-height:1.3;overflow-wrap:anywhere}
.pt-en{display:flex;align-items:center;gap:9px;min-width:0}
.pt-ei{flex:none;width:58px;height:58px;border-radius:12px;background:rgba(0,0,0,.35);display:grid;place-items:center;overflow:hidden}
.pt-ei img{max-width:56px;max-height:56px;object-fit:contain}
.pt-et{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.pt-et b{color:#fff;font-size:13px}
.pt-et em{font-style:normal;color:#ff9f9f;font-weight:900}
.pt-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0}
.pt-chip{flex:1 1 86px;min-width:0;display:flex;align-items:center;justify-content:center;gap:4px;min-height:30px;padding:2px 6px;border-radius:15px;background:rgba(0,0,0,.35);border:1px solid rgba(255,236,200,.16);font-weight:900;font-size:12.5px;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.pt-chip img,.pt-chip svg{width:20px;height:20px;flex:none}
.pt-perm{display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;margin-bottom:6px;padding:5px 8px;border-radius:11px;background:rgba(127,224,122,.12);border:1px solid rgba(127,224,122,.45);font-size:12px;font-weight:900;line-height:1.2}
.pt-perm em{font-style:normal;font-size:16px;color:#7fe07a}
.pt-op{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:900;line-height:1.25;margin-top:6px;min-width:0}
.pt-op .oi{flex:none;width:36px;height:36px;border-radius:10px;background:rgba(0,0,0,.35);display:grid;place-items:center}
.pt-op .oi svg{width:28px;height:28px}
.pt-op>span:last-child{flex:1;min-width:0;overflow-wrap:anywhere}
.pt-op small{display:block;font-size:10.5px;color:#c9b8a2}
.pt-cap{font-size:12px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.pt-cap em,.pt-big em{font-style:normal;color:#ffc94a;font-weight:900}
.pt-sel{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-width:0}
.pt-sel>span{flex:1 1 100%;font-size:11px;font-weight:900;color:#c9b8a2}
.pt-sb,.xs .pt-sb{flex:1 1 64px;min-width:0;min-height:42px;border-radius:12px;border:1.5px solid rgba(255,236,200,.3);background:rgba(255,236,200,.07);color:#f6ecdf;font-weight:900;font-size:13px;padding:2px 6px}
.pt-sb.on,.xs .pt-sb.on{border-color:#ffc94a;background:rgba(255,201,74,.16);color:#ffc94a}
.pt-ft{flex:none;padding:8px 12px 12px;background:rgba(28,20,15,.96);border-top:1px solid rgba(255,236,200,.12);text-align:center;min-width:0}
.pt-row{display:flex;gap:6px;min-width:0}
.pt-go,.xs .pt-go{flex:1;min-width:0;min-height:52px;border:0;border-radius:16px;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;font-size:22px;line-height:1.1;padding:4px 8px;box-shadow:0 4px 0 #1d5a1c;overflow-wrap:anywhere}
.pt-go:active{transform:translateY(2px);box-shadow:0 2px 0 #1d5a1c}
.pt-gold,.xs .pt-gold{flex:1;min-width:0;min-height:48px;border:0;border-radius:14px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:18px;line-height:1.1;padding:4px 8px;box-shadow:0 3px 0 #9a5a10;overflow-wrap:anywhere}
.pt-o,.xs .pt-o{flex:0 1 38%;min-width:0;min-height:48px;border-radius:14px;background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:#f6ecdf;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;overflow-wrap:anywhere}
.pt-o.wide,.xs .pt-o.wide{flex:1}
.pt-ln{margin:7px 0 0;font-size:12px;font-weight:900;line-height:1.35;overflow-wrap:anywhere}
.pt-ln span{color:#c9b8a2;font-weight:800}
.pt-msg{margin:7px 0 0;border-radius:12px;padding:7px 9px;font-size:12px;font-weight:900;line-height:1.3;text-align:center;overflow-wrap:anywhere}
.pt-msg.ok{background:rgba(94,240,160,.12);border:1px solid rgba(94,240,160,.5);color:#c9ffe0}
.pt-msg.bad{background:rgba(255,107,107,.14);border:1px solid rgba(255,123,123,.6);color:#ffd9d9}
.pt-note{border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,236,200,.16);padding:8px 10px;font-size:12.5px;font-weight:900;line-height:1.35;text-align:center;overflow-wrap:anywhere}
.pt-res{border-radius:20px;background:linear-gradient(180deg,rgba(42,30,20,.98),rgba(26,18,12,.98));border:2px solid #ffc94a;padding:12px 11px;display:flex;flex-direction:column;gap:8px;min-width:0}
.pt-res.lose{border-color:#8a6a50}
.pt-rh{text-align:center}
.pt-rh b{display:block;font-size:27px;line-height:1.05;color:#ffc94a;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pt-res.lose .pt-rh b{color:#ffb38a}
.pt-rh small{display:block;margin-top:2px;font-size:12px;font-weight:900;line-height:1.3;overflow-wrap:anywhere}
.pt-big{border-radius:14px;background:linear-gradient(180deg,#5a3a10,#3a2508);border:2px solid #ffc94a;padding:7px 9px;text-align:center}
.pt-big b{display:block;font-size:19px;color:#fff;text-shadow:0 2px 0 #000;line-height:1.1;overflow-wrap:anywhere}
.pt-big small{display:block;font-size:11.5px;font-weight:900;margin-top:2px;line-height:1.3;overflow-wrap:anywhere}
.pt-free{border-radius:12px;background:rgba(127,224,122,.12);border:1px solid rgba(127,224,122,.45);padding:7px 9px;font-size:12px;font-weight:900;text-align:center;line-height:1.35;overflow-wrap:anywhere}
.pt-tips h4{margin:0 0 4px 2px;font-size:15px;color:#ffc94a}
.pt-tg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.pt-tip,.xs .pt-tip{position:relative;border-radius:14px;background:#2a1f16;border:2px solid #4a3a2b;padding:5px 3px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:72px;color:#f6ecdf}
.pt-tip img{width:26px;height:26px;object-fit:contain}
.pt-tip b{font-size:11px;font-weight:900;line-height:1.1;text-align:center;overflow-wrap:anywhere;max-width:100%}
.pt-tip small{font-size:9.5px;font-weight:800;color:#c9b8a2;text-align:center;line-height:1.15}
.pt-tip .gb{position:absolute;right:3px;top:3px;padding:0 6px;height:18px;border-radius:9px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:12px;line-height:18px;box-shadow:0 1px 0 #9a5a10}
.pt-hud{position:absolute;left:0;top:0;width:0;height:0;z-index:6;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf}
.pt-seal,.xs .pt-seal{position:absolute;left:2px;box-sizing:border-box;min-width:74px;min-height:37px;padding:1px 4px;border-radius:12px;background:rgba(22,16,12,.78);border:1.5px solid #ffc94a;color:#f6ecdf;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.4);animation:pt-sp 1.4s ease-in-out infinite;width:max-content;max-width:120px}
.pt-seal.full,.xs .pt-seal.full{border-color:#ff9a4a}
.pt-seal b{display:block;font-size:12px;line-height:13px;color:#ffc94a;white-space:nowrap}
.pt-seal::before{content:'';position:absolute;left:-2px;right:-2px;top:-2px;bottom:-2px}
.pt-seal small{display:block;font-size:8.5px;line-height:9.5px;font-weight:900;white-space:nowrap}
.pt-seal.full small:last-child{color:#ffb38a}
@keyframes pt-sp{50%{box-shadow:0 0 0 3px rgba(255,201,74,.35),0 0 16px rgba(255,201,74,.6)}}
.pt-band{position:absolute;left:80px;width:235px;min-height:44px;border-radius:14px;background:rgba(22,16,12,.78);border:1.5px solid #ffc94a;display:flex;align-items:center;gap:6px;padding:4px 8px 7px 5px;box-shadow:0 6px 16px rgba(0,0,0,.4);overflow:hidden}
.pt-band svg{width:30px;height:30px;flex:none}
.pt-band .tx{flex:1;min-width:0}
.pt-band .tx small{display:block;font-size:10px;font-weight:900;color:#c9b8a2;line-height:1.1}
.pt-band .tx b{display:block;font-size:14px;font-weight:900;color:#fff;line-height:1.15;overflow-wrap:anywhere}
.pt-band .tm{flex:none;font-size:21px;color:#ffc94a;text-shadow:0 2px 0 #000}
.pt-band .tm.low{color:#ff8a6a}
.pt-band .bar{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(0,0,0,.5)}
.pt-band .bar i{display:block;height:100%;background:linear-gradient(90deg,#ffb04a,#ffe07a)}
@media (prefers-reduced-motion:reduce){.pt-in,.pt-seal{animation:none}}`;
function inject(){ if(X.css) return; try{ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.id='pt_css'; st.textContent=CSS; document.head.appendChild(st); X.css=true; }catch(e){} }
inject();

/* ================= HTML ================= */
const bgCss=()=>{ try{ if(typeof xEraBg==='function') return xEraBg(0.74,0.93); }catch(e){} return '#16110d'; };
const wrap=(body,foot)=>'<div class="pt'+(X.anim?' pt-in':'')+'" style="background:'+bgCss()+'"><div id="pt_sc" class="pt-bd x-scroll">'+body+'</div><div class="pt-ft">'+foot+'</div></div>';
const msgHtml=()=>X.msg?'<p class="pt-msg '+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc(X.msg)+'</p>':'';
const backRow='<div class="pt-row"><button class="pt-o wide" data-x="back">Voltar</button></div>';
function offHtml(){ return wrap('<div class="pt-note" role="alert">Provação do Mestre indisponível agora.</div>',backRow); }
function portrait(m){ return '<div class="pt-por">'+(ART.portrait&&m.portrait?'<img src="'+esc(m.portrait)+'" alt="">':SIL+'<span>retrato provisório</span>')+'</div>'; }
function masterHtml(M){ const r=M.row, m=r.master||{}, en=eraName(m.era);
  return '<div class="pt-ms">'+portrait(m)+'<div class="pt-mn"><small>PROVAÇÃO DO NV '+nT(r.lvl)+' · '+M.idx+'ª DE '+M.list.length+'</small><b class="pt-lil">'+esc(m.name)+'</b>'
    +'<i>'+esc(m.role)+(en?(m.role?' · ':'')+'era '+esc(en):'')+'</i><q>Mostre a sua força para passar do Nv '+nT(r.lvl)+'.</q></div></div>'; }
function ruleHtml(r,sp){ const ru=r.rule||{}, sec=sp?sp.sec:ru.sec;
  return '<div class="pt-card rule"><div class="pt-rl">'+ruleIc(ru.id)+'<div><b class="pt-lil">'+esc(ru.name)+'</b><small>'+esc(ru.text)+(sec?' Luta de '+nT(sec)+' s.':'')+'</small></div></div></div>'; }
function enemyHtml(sp){ if(!sp||!sp.enemy) return ''; const e=sp.enemy, si=stageInfo(e.stage), hm=num(e.hpMul), dm=num(e.dmgMul);
  return '<div class="pt-card"><h4 class="pt-lil">O mestre luta como<span>fase mais alta: '+esc(si.label)+'</span></h4><div class="pt-en"><span class="pt-ei"><img src="'+bossUrl(si.era)+'" alt=""></span>'
    +'<div class="pt-et"><b>Chefe da sua fase mais alta</b><br>'+(hm&&hm!==1?'com <em>Vida ×'+dec(hm)+'</em>':'com a mesma Vida')+(dm&&dm!==1?' e <em>dano ×'+dec(dm)+'</em>':' e o mesmo dano')+'. Vença antes de <b>'+mmss(sp.sec)+'</b>.</div></div></div>'; }
/* prêmio em etiquetas: só o que o módulo dono entrega (sem o Sys.forge ou o Sys.pet carregado, a etiqueta não aparece) */
function chipsHtml(rw,given){ const Y=window.Sys||{}, c=[];
  if(num(rw.gold)>0) c.push('<span class="pt-chip"><img src="'+IC.coin+'" alt="">'+(given?'+':'')+esc(kfT(rw.gold))+'</span>');
  if(num(rw.stones)>0&&(given||(Y.forge&&typeof Y.forge.addStones==='function'))) c.push('<span class="pt-chip">'+STONE+'+'+nT(rw.stones)+' '+(rw.stones===1?'pedra':'pedras')+'</span>');
  if(num(rw.food)>0&&(given||(Y.pet&&typeof Y.pet.addFood==='function'))) c.push('<span class="pt-chip">'+FOOD+'+'+nT(rw.food)+' ração</span>');
  return c.length?'<div class="pt-chips">'+c.join('')+'</div>':''; }
function permHtml(st){ st=st||{}; const p=[]; if(num(st.atkPct)) p.push('<em class="pt-lil">+'+dec(st.atkPct)+'% ATK</em>'); if(num(st.hpPct)) p.push('<em class="pt-lil">+'+dec(st.hpPct)+'% Vida</em>');
  return p.length?'<div class="pt-perm">Para sempre:'+p.join('')+'</div>':''; }
function opensHtml(op){ return (Array.isArray(op)?op:[]).map(x=>'<div class="pt-op"><span class="oi">'+KEY+'</span><span>'+esc(x&&x.name)+'<small>abre ao vencer esta provação</small></span></div>').join(''); }
function rewardHtml(M){ const r=M.row, rw=r.reward||{};
  return '<div class="pt-card"><h4 class="pt-lil">Prêmio da 1ª vitória<span>provação '+M.idx+'</span></h4>'+permHtml(rw.stat)+chipsHtml(rw,false)+'</div>'; }
function freesHtml(M){ const r=M.row, rw=r.reward||{}, ca=capAfter(M,r.lvl), bank=num(M.v.bank), atThis=M.v.atCap&&M.v.cap===r.lvl; let cap='';
  if(capOn()&&M.v.cap===r.lvl) cap='<div class="pt-cap">Teto sobe para '+(ca?'o <em>Nv '+nT(ca)+'</em>':'o <em>nível máximo</em>')+(atThis&&bank>0?' e a XP guardada volta: <em>'+nT(bank)+' XP</em>':'')+'.</div>';
  const op=opensHtml(rw.opens); if(!cap&&!op) return '';
  return '<div class="pt-card"><h4 class="pt-lil">Vencer libera</h4>'+cap+op+'</div>'; }
function selHtml(M){ if(M.due.length<2) return '';
  return '<div class="pt-sel"><span>Provações abertas: escolha qual enfrentar</span>'+M.due.map(x=>'<button class="pt-sb'+(x.lvl===M.row.lvl?' on':'')+'" data-x="sel" data-l="'+nT(x.lvl)+'" aria-pressed="'+(x.lvl===M.row.lvl)+'">Nv '+nT(x.lvl)+'</button>').join('')+'</div>'; }
function cardHtml(M){ const r=M.row, sp=specOf(r.lvl), tries=Math.floor(num(r.tries));
  const body=selHtml(M)+masterHtml(M)+ruleHtml(r,sp)+enemyHtml(sp)+rewardHtml(M)+freesHtml(M);
  if(M.kind==='next'){ const lv=Math.floor(num(M.v.level)), miss=Math.max(1,r.lvl-lv);
    return wrap('<div class="pt-note" role="status">Você está no Nv '+nT(lv)+'. '+(miss===1?'Falta 1 nível':'Faltam '+nT(miss)+' níveis')+' para a provação do Nv '+nT(r.lvl)+'.</div>'+body,backRow+msgHtml()); }
  return wrap(body,'<div class="pt-row"><button class="pt-go pt-lil" data-x="go" aria-label="Lutar contra '+esc(r.master&&r.master.name)+', grátis">Lutar</button></div>'
    +(msgHtml()||'<p class="pt-ln">Tentar de novo é grátis <span>· sem limite, sem energia, sem gema'+(tries?' · tentativas: '+nT(tries):'')+'</span></p>')); }
function doneHtml(M){ const b=M.v.bonus||{}, p=[]; if(num(b.atkPct)) p.push('+'+dec(b.atkPct)+'% ATK'); if(num(b.hpPct)) p.push('+'+dec(b.hpPct)+'% Vida');
  return wrap('<div class="pt-note" role="status">Todas as provações vencidas.'+(p.length?'<br>Bônus para sempre: '+esc(p.join(' e '))+'.':'')+'</div>',backRow); }
const TIPS=[{d:'gear',img:IC.gear,label:'Equipamento',sub:'Use o melhor'},{d:'forge',img:IC.forge,label:'Forja',sub:'Suba a arma',un:'forge'},{d:'pets',img:IC.pets,label:'Pet',sub:'Evolua o pet',un:'pet'}];
function tipList(ruleId){ return TIPS.filter(t=>{ if(t.d==='pets'&&ruleId==='nopet') return false; try{ if(t.un&&typeof xUnlocked==='function'&&!xUnlocked(t.un)) return false; }catch(e){} return true; }); }
function tipsHtml(ruleId){ const T=tipList(ruleId); if(!T.length) return '';
  return '<div class="pt-tips"><h4 class="pt-lil">Fique mais forte</h4><div class="pt-tg">'+T.map(t=>'<button class="pt-tip" data-x="tip" data-d="'+t.d+'" aria-label="'+t.label+', '+t.sub+'. Ir para '+t.label+'"><span class="gb pt-lil">Ir</span><img src="'+t.img+'" alt=""><b>'+t.label+'</b><small>'+t.sub+'</small></button>').join('')+'</div></div>'; }
function resultHtml(){ const Rz=X.res, r=Rz.r, v=viewOf(), list=v&&Array.isArray(v.list)?v.list:[], row=list.find(x=>x&&x.lvl===r.lvl)||{}, m=row.master||{}, ru=row.rule||{};
  if(r.won){ const rw=r.reward||{}, rel=num(r.released), up=Rz.lv1>Rz.lv0, lim=capOn()&&num(r.cap)>num(Rz.cap0), more=list.some(x=>x&&x.lvl>r.lvl&&!x.passed);
    const big=lim?'<div class="pt-big"><b class="pt-lil">Teto liberado: agora até o '+(more?'Nv '+nT(r.cap):'nível máximo')+'</b>'+(rel>0||up?'<small>'+(rel>0?'XP guardada liberada: <em>+'+nT(rel)+' XP</em>':'')+(up?(rel>0?' · ':'')+'você subiu para o <em>Nv '+nT(Rz.lv1)+'</em>':'')+'</small>':'')+'</div>':'';
    const op=(Array.isArray(rw.opens)?rw.opens:[]).map(x=>esc(x&&x.name)).join(', ');
    return wrap('<div class="pt-res" role="status" aria-label="Provação vencida"><div class="pt-rh"><b class="pt-lil">Provação vencida!</b><small>'+esc(m.name)+' reconhece a sua força · regra '+esc(ru.name)+'</small></div>'
      +big+permHtml(rw.stat)+chipsHtml(rw,true)+(op?'<div class="pt-free">Abriu: '+op+'</div>':'')+'</div>',
      '<div class="pt-row"><button class="pt-go pt-lil" data-x="cont">Continuar</button></div>'); }
  const bank=v?num(v.bank):0, sec=num(ru.sec);
  return wrap('<div class="pt-res lose" role="status" aria-label="O mestre venceu"><div class="pt-rh"><b class="pt-lil">'+(r.late?'Passou do tempo':'O mestre venceu desta vez')+'</b><small>'
      +(r.late?'Você venceu depois dos '+nT(sec)+' s da regra: conta como derrota.':esc(m.name)+' ainda segura '+(capOn()?'o teto do Nv '+nT(r.lvl):'a provação do Nv '+nT(r.lvl))+'.')+'</small></div>'
      +'<div class="pt-free">Perder não custa nada. Tentar de novo é grátis e sem limite.'+(bank>0?'<br>A XP guardada ('+nT(bank)+' XP) continua esperando.':'')+'</div>'+tipsHtml(ru.id)+'</div>',
    '<div class="pt-row"><button class="pt-o" data-x="back">Voltar</button><button class="pt-gold pt-lil" data-x="retry">Tentar de novo grátis</button></div>'+msgHtml()); }

/* ================= desenho da tela ================= */
function draw(){ const d=(typeof xDims==='function'?xDims(520):null)||{}; let h='';
  if(!ok()){ X.mode='card'; X.res=null; h=offHtml(); X.sig='x'; }
  else if(X.mode==='result'&&X.res) { h=resultHtml(); X.sig=sig(); }
  else { X.mode='card'; const M=model(); h=!M?offHtml():M.kind==='done'?doneHtml(M):cardHtml(M); X.sig=sig(); }
  V.innerHTML=typeof xWrap==='function'?xWrap(d,'',h):h; X.anim=false; }
function sig(){ if(!ok()) return 'x'; try{ const v=viewOf(); if(!v) return 'x'; return [X.mode,v.level,v.cap,v.bank,v.due,v.list.filter(x=>x.passed).length,X.sel].join('|'); }catch(e){ return ''; } }
function say(m,tone){ X.msg=String(m||''); X.tone=tone||'bad'; }

/* ================= ações ================= */
/* começar: confere a ponte da batalha ANTES de chamar o módulo (sem ela nada é gravado); depois UMA chamada ao Sys.trial.start e o spec vai para a batalha */
function begin(lvl){ if(X.busy||X.run) return false; if(!ok()){ redraw(); return false; }
  const M=model(); let l=Math.floor(num(lvl)); if(!l){ if(!M||M.kind!=='due'){ sfx('ui_tap'); say(WHY.level); redraw(); return false; } l=M.row.lvl; }
  if(typeof API.battle!=='function'){ sfx('ui_tap'); say(NO_BATTLE); redraw(); return false; }
  X.busy=true; let r=null; try{ r=TR().start(sv(),host(),l); }catch(e){ r=null; } X.busy=false;
  if(!r||!r.ok){ sfx('ui_tap'); say((r&&WHY[r.reason])||'Não foi possível começar agora.'); redraw(); return false; }
  persist(); X.msg=''; X.res=null; X.mode='card'; X.sel=r.lvl; X.run={lvl:r.lvl,spec:r.spec}; X.left=null; sfx('ui_tap');
  let started=false; try{ started=API.battle(r.spec)!==false; }catch(e){ started=false; }
  if(!started){ X.run=null; say('Não foi possível abrir a luta agora. Tente de novo: é grátis.'); hudUpdate(true); redraw(); return false; }
  hudUpdate(true); return true; }
/* fim da luta (a batalha chama): UMA chamada ao Sys.trial.finish; o prêmio, o teto novo e a XP liberada são os que o módulo devolve. Abre o resultado. */
function finish(res){ if(!ok()) return {ok:false,reason:'off'}; const lv0=levelNow(), v0=viewOf(), cap0=v0?num(v0.cap):0; let r=null;
  try{ r=TR().finish(sv(),host(),{won:!!(res&&res.won),sec:num(res&&res.sec)}); }catch(e){ r=null; }
  X.run=null; X.left=null;
  if(!r||!r.ok){ hudUpdate(true); return r||{ok:false,reason:'err'}; }
  persist(); sfx(r.won?'claim':'ui_tap'); X.res={r:r,lv0:lv0,lv1:levelNow(),cap0:cap0}; X.mode='result'; X.msg=''; X.sel=r.lvl; X.anim=true; hudUpdate(true);
  if(isOn()) redraw(); else { try{ if(window.Panels&&typeof Panels.open==='function') Panels.open(N,{result:true}); }catch(e){} }
  return r; }
/* DESISTIR no meio da luta (a batalha chama, js/instfx.js ligTrialExit, depois de voltar à fase): UMA chamada ao Sys.trial.quit, que desfaz a tentativa e não
   mexe na XP guardada nem no teto. Não há resultado: some a faixa da regra e a tela volta a poder começar outra luta. */
function cancel(){ let r=null; try{ const T=TR(); if(T&&typeof T.quit==='function') r=T.quit(sv(),host()); }catch(e){ r=null; }
  X.run=null; X.left=null; if(r&&r.ok) persist(); hudUpdate(true); redraw(); return r||{ok:false,reason:'none'}; }
function goTip(d){ if(!TIPS.some(t=>t.d===d)) return; sfx('ui_tap');
  try{ if(d==='gear'){ if(typeof setView==='function') setView('gear'); return; } if(window.Panels&&typeof Panels.open==='function') Panels.open(d); }catch(e){} }
function closeMe(){ try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} }
function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||'';
  if(a==='back'){ sfx('ui_tap'); closeMe(); return; }
  if(X.busy) return;
  if(a==='cont'){ sfx('ui_tap'); X.mode='card'; X.res=null; X.sel=0; closeMe(); return; }
  if(!ok()) return;
  if(a==='sel'){ const l=parseInt(ds.l,10)||0, M=model(); if(M&&M.due.some(x=>x.lvl===l)){ sfx('ui_tap'); X.sel=l; X.msg=''; X.mode='card'; redraw(); } return; }
  if(a==='go'){ if(X.mode==='card') begin(0); return; }
  if(a==='retry'){ if(X.mode==='result'&&X.res){ const l=X.res.r.lvl; X.mode='card'; X.res=null; X.sel=l; begin(l); } return; }
  if(a==='tip'){ goTip(String(ds.d||'')); return; }
}
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[IC.coin]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg);
    if(ok()){ if(X.mode==='result'&&X.res&&!X.res.r.won){ for(const t of TIPS) u.push(t.img); }
      else { const M=model(); if(M&&M.row){ const sp=specOf(M.row.lvl); if(sp&&sp.enemy) u.push(bossUrl(stageInfo(sp.enemy.stage).era)); if(ART.portrait&&M.row.master&&M.row.master.portrait) u.push(M.row.master.portrait); } } } }catch(e){} return u; }

/* ================= na batalha: selo "Teto Nv X" e faixa da regra ================= */
const hudOn=()=>{ try{ return ok()&&!!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N)); }catch(e){ return false; } };
/* topo da faixa: logo abaixo da barra da fase (y 122 do protótipo); com o selo "Fraco contra" (js/weakseal.js) na tela, desce para baixo dele */
function bandTop(){ try{ const w=document.getElementById('wsl_root'); if(w&&w.style&&w.style.display!=='none'){ const h=Math.round(num(w.offsetHeight))||24; return 122+h+6; } }catch(e){} return 122; }
function hudHtml(o){ o=o||{}; if(!hudOn()) return '';
  if(X.run){ if(X.left==null) return ''; const sp=X.run.spec||{}, ru=sp.rule||{}, tot=Math.max(1,num(sp.sec)), left=Math.max(0,Math.min(tot,num(X.left)));
    return '<div class="pt-band" role="status" style="top:'+(o.bandTop!=null?+o.bandTop:bandTop())+'px" aria-label="Provação do Mestre, regra '+esc(ru.name)+', faltam '+mmss(left)+'">'+ruleIc(ru.id)
      +'<span class="tx"><small>Provação do Mestre</small><b>'+esc(ru.name)+'</b></span><span class="tm pt-lil'+(left<=10?' low':'')+'">'+mmss(left)+'</span><span class="bar"><i style="width:'+(left/tot*100).toFixed(1)+'%"></i></span></div>'; }
  let d=null; try{ d=TR().due(sv(),host()); }catch(e){ d=null; } if(!d||!d.due) return '';
  /* o selo mora no vão entre o FC do retrato (acaba em y 97) e o 1º ícone da coluna esquerda (começa em y 136), à esquerda da barra da fase (x 78):
     37 px de altura em y 98 a 135, x 2 a 76; a área de toque passa 2 px de cada lado (41 px) pelo ::before */
  const top=o.sealTop!=null?+o.sealTop:98;
  if(d.atCap&&capOn()){ const v=viewOf(), bank=v?num(v.bank):0, full=bankFull(v);
    return '<button class="pt-seal'+(full?' full':'')+'" data-pt="open" style="top:'+top+'px" aria-label="Teto do Nv '+nT(d.lvl)+': '+nT(bank)+' XP guardada'+(full?', cheia: o que passar disso não é guardado':'')+'. Toque para abrir a Provação do Mestre"><b class="pt-lil">Teto Nv '+nT(d.lvl)+'</b><small>guardada:</small><small>'+nT(bank)+' XP</small></button>'; }
  return '<button class="pt-seal" data-pt="open" style="top:'+top+'px" aria-label="Provação do Mestre do Nv '+nT(d.lvl)+' aberta. Toque para abrir"><b class="pt-lil">Provação</b><small>do Nv '+nT(d.lvl)+'</small><small>aberta</small></button>'; }
function hudClick(b){ const a=b&&b.dataset?b.dataset.pt:''; if(a!=='open') return false; sfx('ui_tap'); try{ if(window.Panels&&typeof Panels.open==='function') Panels.open(N,{}); }catch(e){} return true; }
function mount(hostEl){ if(X.hud) return true; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='pt_hud'; r.className='pt-hud';
    if(r.addEventListener) r.addEventListener('click',ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-pt]'):null; if(b) hudClick(b); });
    h.appendChild(r); X.hud=r; X.hudSig=''; X.hudT=0; hudUpdate(true); return true; }catch(e){ return false; } }
/* chamar no fbTick: lê o módulo no máximo 2 vezes por segundo e só troca o HTML quando muda */
function hudUpdate(force){ const r=X.hud; if(!r) return false; const now=Date.now(); if(!force&&now-X.hudT<500) return X.hudSig!==''; X.hudT=now;
  let h=''; try{ h=hudHtml(); }catch(e){ h=''; } if(h!==X.hudSig){ X.hudSig=h; r.innerHTML=h; } return h!==''; }
function unmount(){ const r=X.hud; X.hud=null; X.hudSig=''; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
/* relógio da faixa: a batalha passa os segundos que faltam; redesenha só quando o segundo muda */
function time(left){ if(!X.run) return false; const a=X.left==null?-1:Math.ceil(X.left), b=Math.ceil(Math.max(0,num(left))); X.left=Math.max(0,num(left)); if(a!==b) hudUpdate(true); return true; }

const def=Panels.add(N,{title:'Provação do Mestre',actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.busy) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return X.busy; },
  onOpen(o){ X.msg=''; X.anim=true; X.sig=''; X.tk=0; X.run=null; X.left=null;   /* o jogador voltou para esta tela: não há luta da provação em curso */
    if(!(o&&o.result&&X.res)){ X.mode='card'; X.res=null; } if(o&&o.lvl) X.sel=Math.floor(num(+o.lvl)); },
  onClose(){ X.msg=''; if(X.mode==='result'){ X.mode='card'; X.res=null; } } });
/* para a batalha, o HUD, o teste de fumaça e o console */
Object.assign(API,{state:X,actions:ACTIONS,def:def,ART:ART,IC:IC,urls:urls,start:begin,finish:finish,cancel:cancel,time:time,battle:null,
  running:()=>X.run?{lvl:X.run.lvl,spec:X.run.spec}:null,hudOn:hudOn,hudHtml:hudHtml,hudClick:hudClick,mount:mount,update:hudUpdate,unmount:unmount});
window.PTrial=API;
})();
