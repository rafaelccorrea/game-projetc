'use strict';
/* ================= MAPA DAS ERAS V4 (desenho aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.map2) =================
   Protótipo: docs/proto/v2/MapaDasErasV4.html (as versões anteriores do Mapa foram reprovadas: vale só a V4). Não substitui o js/p_map.js: é outra tela ('map2').
   O QUE A TELA MOSTRA: o cenário da era em profundidade (camadas reais da batalha: assets/bg/v2/era<N>/sky, far e ground; névoa, silhuetas e partículas por
   código), a trilha das fases subindo (vencida / atual / fechada), o chefe do meio e o Senhor da Era no topo com o portão, os baús de marco, a troca entre as
   eras, as fases depois da última era (com os marcos) e, embaixo, o cartão da fase com a FC pedida x a sua e o "Lutar". O herói fica na fase atual, pela rota
   única do jogo (window.drawHeroFull do js/battle.js: arma na mão, asa, montaria e o pet por último, na frente).
   NENHUMA regra nem número de jogo aqui:
   - fase atual: Sys.host.stage() (S.stage). O jogo só anda para a frente (S.stage++ na vitória do chefe da fase), então fase menor que a atual = vencida,
     e fase vencida NÃO reabre (o jogo de hoje não tem volta de fase): o cartão dela só oferece "Ir para a fase atual";
   - eras e fases por era: ERAS e STAGES_PER_ERA (index.html); nome do Senhor: era9Boss / assets/enemies/meta.json / ERAS[e].en;
   - FC pedida: fcNeed (js/diff.js; cai no recFC com a chave da dificuldade desligada) · a sua FC: heroFC · texto: fcShow · faixas de cor: diffTier e DIFF.tier;
   - baús de marco: Sys.mapChest (list devolve closed | ready | collected e o prêmio; claim coleta e credita). Chave do módulo desligada ou módulo ausente:
     nenhum baú aparece. O prêmio mostrado é sempre o que o módulo devolve (os números são PROVISÓRIOS e moram no módulo);
   - marcos depois da última era: Sys.erasEnd.isMark / milestoneRewards (os prêmios só aparecem com a chave do módulo ligada);
   - prêmios do Senhor da Era e do chefe do meio (cartão da fase): lidos do Sys.loot.DATA, que é quem paga na própria vitória (rollKill / rollEgg do js/sys/loot.js).
     Pedras de forja: mats.eraBoss.forge e mats.boss.forge = [chance, mínimo, máximo]. Ovo do Senhor: garantido na 1ª vitória de cada era (eggs.eraBossFirstMin é a
     raridade mínima desse ovo; quais eras já deram o ovo fica no save do módulo, lido aqui sem escrever) e, nas seguintes, eggs.eraBossRepeatChance. Ovo do chefe
     de fase: eggs.bossChance, garantido quando a conta de chefes sem ovo chega a eggs.pity (vale para o chefe de TODA fase, não só o do meio). Sem o módulo ou
     sem o campo, aquele prêmio não aparece. Nenhum desses números está escrito neste arquivo.
   "LUTAR" usa a mesma rota do js/p_map.js: fecha a tela e volta para a Batalha (Screens.close + Sys.host.goTab('battle')), que já está na fase atual.
   AS ERAS NÃO ENCERRAM O JOGO: depois da última fase da última era a trilha continua ("Além das Eras", fases sem fim).
   DESEMPENHO: nada pesado por quadro (só o canvas do herói e até 44 partículas); a rolagem move 3 camadas por transform; só as imagens da era à vista são pedidas.
   O cabeçalho (Voltar, título, moedas) é do jogo. O arquivo roda em escopo próprio. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('map2' in PANEL_ON)) PANEL_ON.map2=false;
const N='map2';
const ACTIONS=['back','era','st','chest','claim','cclose','gate','fight','cur'];
const X={view:0,sel:1,chest:0,toast:'',toastT:0,anim:true,swap:false,sig:'',tk:0,raf:0,t0:0,t:0,P:[],fxKind:'',scroll:null,user:false,gt:0,trans:0,wipe:null,tm:[],geo:null,st:0,herr:0,cardH:0,gk:''};

/* ---------- geometria da trilha (só desenho; base de 390 px do protótipo, centrada na largura real) ---------- */
const TOPY=540, STEP=132, BOT=270;
const XS=[195,118,205,278,200,112,170,272,226];
const PF={sky:0.06,mid:0.22,front:1.25};
const LY=[['m2_lsky','sky'],['m2_lmid','mid'],['m2_lfront','front']];
const HC_W=240, HC_H=170, HC_X=130, HC_GY=150;   /* canvas do herói: largura, altura, x dos pés e chão */
/* cartão de baixo: altura de reserva (enquanto a tela não foi medida), margem inferior dele e a folga entre o nó e o topo do cartão
   (meia altura do nó 23 + sombra 6 + anel da fase atual 9 + 8 de respiro). A fase escolhida NUNCA fica atrás do cartão: ver fit() e targetOf() */
const CARD_H0=240, CARD_B=12, NODE_CLR=46;

/* ---------- leituras ISOLADAS (reserva segura se algum pedaço do jogo não estiver carregado) ---------- */
const Y=()=>window.Sys||{};
const host=()=>Y().host||null;
const now=()=>Date.now();
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const call=fn=>{ try{ if(typeof fn==='function') return fn(); }catch(e){} };
const el=id=>{ try{ return document.getElementById(id)||null; }catch(e){ return null; } };
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return String(Math.round(num(v))); };
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const pl=(n,a,b)=>nT(n)+' '+(n===1?a:b);
const reduced=()=>{ try{ return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches===true; }catch(e){ return false; } };
const eras=()=>{ try{ return (typeof ERAS!=='undefined'&&Array.isArray(ERAS))?ERAS:[]; }catch(e){ return []; } };
const PER=()=>{ try{ return (typeof STAGES_PER_ERA==='number'&&STAGES_PER_ERA>0)?Math.floor(STAGES_PER_ERA):10; }catch(e){ return 10; } };
const NE=()=>eras().length;
const LAST=()=>NE()*PER();
const eraIdx=s=>clamp(Math.floor((Math.max(1,s)-1)/PER()),0,Math.max(0,NE()-1));
const inEra=s=>((s-1)%PER())+1;
const eraName=i=>{ const e=eras()[i]; return (e&&e.n)?String(e.n):('Era '+(i+1)); };
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
const rom=i=>ROM[i]||String(i+1);
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
/* fase a jogar: a mesma leitura do js/p_map.js (Sys.host.stage; sem o host, o save) */
function stageNow(){ let s=0; try{ const h=host(); s=h&&typeof h.stage==='function'?h.stage():S.stage; }catch(e){ try{ s=S.stage; }catch(e2){ s=1; } } return Math.max(1,Math.floor(num(+s))||1); }
const curView=()=>{ const s=stageNow(); return s>LAST()?NE():eraIdx(s); };
/* primeira fase do trecho à vista: a era, ou (depois da última era) o bloco de fases sem fim onde o jogador está */
function block(v){ const n=PER(), L=LAST(); if(v<NE()) return v*n+1; const s=Math.max(L+1,stageNow()); return Math.floor((s-L-1)/n)*n+L+1; }
const stOf=s=>{ const c=stageNow(); return s<c?'done':s===c?'now':'lock'; };
const lockedV=v=>v>curView();
const eraWon=v=>v<NE()&&stageNow()>block(v)+PER()-1;
const gateReady=()=>X.view<NE()&&eraWon(X.view)&&!X.trans;
const heroHere=()=>X.view===curView();
const defSel=v=>{ const cv=curView(), a=block(v); return v===cv?stageNow():v<cv?a+PER()-1:a; };
const artEra=v=>clamp(v,0,Math.max(0,NE()-1));
/* nome do Senhor da Era: o mesmo que a batalha e a Troca de era usam */
function bossName(e){ try{ if(typeof era9Boss==='function'&&era9Boss(e)) return String(era9Boss(e)); }catch(x){}
  try{ if(typeof J==='function'){ const m=J('assets/enemies/meta.json')['era'+e+'_boss']; if(m&&m.name) return String(m.name); } }catch(x){}
  try{ const en=eras()[e].en; if(en&&en.length&&en[en.length-1].n) return String(en[en.length-1].n); }catch(x){} return 'Senhor da Era'; }
const isLord=s=>s<=LAST()&&inEra(s)===PER();
/* chefe do meio: a fase do meio da era (a mesma conta do js/battle.js para o Grimório), a partir da era do bloco "dificuldade" do balanço (era III) */
function midRule(){ let st=Math.round(PER()/2), from=2; try{ const T=window.DIFF&&DIFF.tbl; if(T){ if(T.midStage>0&&PER()===10) st=Math.floor(T.midStage); if(typeof T.midFromEra==='number') from=Math.floor(T.midFromEra); } }catch(e){} return {st:st,from:from}; }
const isMid=s=>{ if(s>LAST()) return false; const r=midRule(); return inEra(s)===r.st&&eraIdx(s)>=r.from; };
const EE=()=>{ const m=Y().erasEnd; return m&&typeof m.isMark==='function'?m:null; };
const eeOn=()=>{ const m=EE(); return !!(m&&m.DATA&&m.DATA.on===true&&typeof m.milestoneRewards==='function'); };
const isMark=s=>{ if(s<=LAST()) return false; try{ const m=EE(); return !!(m&&m.isMark(s)); }catch(e){ return false; } };
function markRewards(s){ if(!eeOn()) return []; try{ const r=EE().milestoneRewards(s); return Array.isArray(r)?r.map(String):[]; }catch(e){ return []; } }
function stageName(s){ if(s>LAST()) return isMark(s)?'Marco da fase '+nT(s):'Fase sem fim '+nT(s); if(isLord(s)) return 'Senhor: '+bossName(eraIdx(s)); if(isMid(s)) return 'Chefe do meio: fase '+nT(s); return 'Fase '+nT(s); }
/* FC */
const fin=v=>typeof v==='number'&&isFinite(v);
const needFC=s=>{ try{ const f=typeof fcNeed==='function'?fcNeed:(typeof recFC==='function'?recFC:null); const v=f?f(s):null; return fin(v)&&v>0?v:null; }catch(e){ return null; } };
const myFC=()=>{ try{ if(typeof heroFC==='function'){ const v=heroFC(); if(fin(v)&&v>0) return v; } }catch(e){} try{ const F=Y().fc; const v=F&&F.compute?F.compute(S,host()):null; return fin(v)&&v>0?v:null; }catch(e){ return null; } };
const fcT=v=>{ try{ if(typeof fcShow==='function') return String(fcShow(v)); }catch(e){} try{ const F=Y().fc; if(F&&typeof F.viewText==='function') return String(F.viewText(v)); }catch(e){} return kfT(v); };
/* faixas de cor da FC: as do jogo (diffTier e DIFF.tier do js/diff.js); sem o arquivo, os mesmos limiares de lá */
function tierMarks(){ try{ const T=window.DIFF&&DIFF.tier; if(T&&T.green>0&&T.yellow>0) return {g:+T.green,y:+T.yellow}; }catch(e){} return {g:1,y:0.9}; }
function tierOf(fc,need){ try{ if(typeof diffTier==='function'){ const t=diffTier(fc,need); if(t===0||t===1||t===2) return t; } }catch(e){} const m=tierMarks(), r=need>0?fc/need:1; return r>=m.g?0:r>=m.y?1:2; }
const TIER=[['easy','FC suficiente'],['even','Um pouco abaixo'],['nope','Bem abaixo']];
/* baús de marco: só com o módulo carregado e a chave dele ligada */
function MC(){ const m=Y().mapChest; return m&&m.DATA&&m.DATA.on===true&&typeof m.list==='function'&&typeof m.claim==='function'?m:null; }
function chestsOf(v){ const m=MC(); if(!m||v>=NE()||lockedV(v)) return []; let L=[]; try{ L=m.list(S,host(),v)||[]; }catch(e){ L=[]; } const a=block(v), n=PER();
  return L.filter(c=>c&&Number.isInteger(c.stage)&&c.stage>=a&&c.stage<a+n&&(c.state==='closed'||c.state==='ready'||c.state==='collected')); }
const chestAt=(v,s)=>chestsOf(v).find(c=>c.stage===s)||null;
function readyCount(){ const m=MC(); if(!m||typeof m.readyCount!=='function') return -1; try{ return Math.max(0,Math.floor(num(m.readyCount(S,host())))); }catch(e){ return -1; } }
/* ---------- prêmios do chefe: só leitura do Sys.loot.DATA (ver o cabeçalho); campo ausente ou sem valor = texto vazio = o prêmio não aparece ---------- */
const LD=()=>{ try{ const m=Y().loot; return m&&m.DATA&&typeof m.DATA==='object'?m.DATA:null; }catch(e){ return null; } };
const pctT=v=>String(Math.round(num(v)*1000)/10).replace('.',',')+'%';
/* spec = [chance, mínimo, máximo] (o rollMat do módulo: sai se a sorte for menor que a chance; a quantidade é um inteiro do mínimo ao máximo) */
function stonesTxt(cls){ let sp=null; try{ sp=LD().mats[cls].forge; }catch(e){ sp=null; } if(!Array.isArray(sp)) return '';
  const ch=num(sp[0]), a=Math.floor(num(sp[1])), b=Math.floor(num(sp[2])); if(!(ch>0)||!(b>0)||a>b) return '';
  const q=a===b?pl(b,'pedra de forja','pedras de forja'):a<1?'até '+pl(b,'pedra de forja','pedras de forja'):nT(a)+' a '+nT(b)+' pedras de forja';
  return ch>=1?q:pctT(ch)+' de chance: '+q; }
/* a era já deu o ovo da 1ª vitória? (marca do módulo no save; aqui só se lê) */
const eraEggDone=e=>{ try{ const a=S.sys.loot.egg.eraFirst; return Array.isArray(a)&&a.includes(e); }catch(x){ return false; } };
function lordEggTxt(e){ const D=LD(), E=D&&D.eggs; if(!E||typeof E!=='object') return '';
  if(!eraEggDone(e)) return Array.isArray(E.eraBossFirstMin)?'Ovo de pet garantido na 1ª vitória':'';
  const c=num(E.eraBossRepeatChance); return c>=1?'Ovo de pet garantido':c>0?pctT(c)+' de chance de ovo de pet':''; }
function bossEggTxt(){ const D=LD(), E=D&&D.eggs; if(!E||typeof E!=='object') return ''; const c=num(E.bossChance), p=Math.floor(num(E.pity));
  if(c>=1) return 'Ovo de pet garantido'; if(!(c>0)) return p>1?'Ovo de pet garantido a cada '+nT(p)+' chefes':'';
  return pctT(c)+' de chance de ovo de pet'+(p>1?' (garantido a cada '+nT(p)+' chefes sem ovo)':''); }
/* com as dificuldades do módulo ligadas, o chefe de fase só paga como chefe nas fases de DATA.diff.bossStages (o Senhor da Era não muda) */
function bossPays(s){ try{ const F=LD().diff; if(!F||F.on!==true) return true; const n=Math.floor(num(F.stagesPerEra)); return n>0&&Array.isArray(F.bossStages)&&F.bossStages.includes(((s-1)%n)+1); }catch(e){ return false; } }
const EGG_SV='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C8 3 5 8.6 5 13.2a7 7 0 0014 0C19 8.6 16 3 12 3z" fill="#ffe9b0" stroke="#6a3a06" stroke-width="1.6"/><path d="M9 9.5c.8-1.6 1.8-2.6 3-3" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/></svg>';
/* [ícone, texto] dos prêmios do chefe da fase s: Senhor da Era ou chefe do meio (as fases comuns seguem sem lista de prêmio, como no protótipo) */
function bossRewards(s){ const o=[]; if(!LD()||s>LAST()) return o; const lord=isLord(s); if(!lord&&!(isMid(s)&&bossPays(s))) return o;
  const st=stonesTxt(lord?'eraBoss':'boss'), eg=lord?lordEggTxt(eraIdx(s)):bossEggTxt();
  if(st) o.push([ic(IC.forge,22),st]); if(eg) o.push([EGG_SV,eg]); return o; }
const mounted=()=>{ try{ return typeof heroLook==='function'&&!!heroLook().mount; }catch(e){ return false; } };
const canDraw=()=>{ try{ return !X.herr&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };

/* ---------- imagens (só as que já existem no jogo) ---------- */
const IC={chest:'assets/ui/chest.png',coin:'assets/ui/coin.png',gem:'assets/ui/gem.png',forge:'assets/icons/menu/forge.png'};
const bgDir=e=>'assets/bg/v2/era'+e+'/';
const bossUrl=e=>'assets/enemies/era'+e+'_boss.png';
const ic=(u,z)=>'<img src="'+u+'" alt="" style="width:'+(z||22)+'px;height:'+(z||22)+'px">';
const SV={
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>',
  lock:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z"/></svg>',
  crown:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
  sword:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 4H20v5.5L9 20.5 3.5 15z"/><path d="M6 13l5 5M3 21l3-3"/></svg>',
  key:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2L20 20M16.5 16.5l2.5-2.5M14 14l2-2"/></svg>',
  title:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11l-8 4-8-4z" fill="#5ee7ff" stroke="#0b3a4a" stroke-width="1.5"/><path d="M8 10h8M8 13h5" stroke="#0b3a4a" stroke-width="1.8"/></svg>',
  up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 14l7-7 7 7M12 7v13"/></svg>',
  prev:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'};
/* enfeite de cada era (só desenho, igual ao protótipo): silhueta da frente, partícula, cor da névoa e da borda */
const DEC=[{sil:'palm',fx:'ember',fog:'#ffb070',lt:'#ffd9a0'},{sil:'column',fx:'dust',fog:'#f4d08a',lt:'#fff0b0'},{sil:'pine',fx:'leaf',fog:'#e4f4d0',lt:'#ffe9b0'},
  {sil:'mast',fx:'ember',fog:'#e8e4dc',lt:'#ffd9a0'},{sil:'chimney',fx:'spark',fog:'#c8b8a0',lt:'#e8d9b0'},{sil:'tower',fx:'snow',fog:'#dfe8f4',lt:'#f4f4f4'},
  {sil:'crystal',fx:'star',fog:'#a080ff',lt:'#9ad8ff'},{sil:'spike',fx:'ember2',fog:'#ff5030',lt:'#ff6a2a'},{sil:'cloud',fx:'mote',fog:'#ffffff',lt:'#fffbe0'}];
const decOf=v=>DEC[clamp(artEra(v),0,DEC.length-1)];
const GOLD_F='hue-rotate(-24deg) saturate(1.45) brightness(1.05)';   /* fases sem fim: o cenário da última era, dourado (igual ao protótipo) */

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.m2{--gold:#ffc94a;--green:#5ef0a0;--rose:#ff8aa8;--cyan:#5ee7ff;--text:#f6ecdf;--muted:#c9b8a2;--ink:#2a1403;--glass:rgba(26,18,12,.86);--gl2:rgba(22,16,12,.8);--edge:rgba(255,236,200,.16);--edge2:rgba(255,201,74,.45);
  position:relative;flex:1;width:100%;height:100%;min-height:0;min-width:0;overflow:hidden;background:#1d1611;color:var(--text);font-family:Nunito,system-ui,sans-serif}
.m2 *{box-sizing:border-box}
.m2 button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.m2 .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.m2-in{animation:m2-fade .22s ease-out}
@keyframes m2-fade{from{opacity:0}to{opacity:1}}
.m2-scene{position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none}
.m2-scene.swap{animation:m2-erain .7s ease-out}
@keyframes m2-erain{from{opacity:0;filter:brightness(2.2)}}
.m2-ly{position:absolute;left:0;width:100%;will-change:transform;pointer-events:none}
.m2-far>div{position:absolute;inset:0;background-size:cover;background-position:50% 30%;transform:scale(1.08);animation:m2-kb 34s ease-in-out infinite alternate}
@keyframes m2-kb{to{transform:scale(1.16) translate(-12px,6px)}}
.m2-comp{position:absolute;left:0;right:0;bottom:0;height:604px;-webkit-mask-image:linear-gradient(180deg,transparent 0,#000 34%);mask-image:linear-gradient(180deg,transparent 0,#000 34%)}
.m2-comp i{position:absolute;left:0;right:0;background-repeat:repeat-x}
.m2-fog{position:absolute;left:-160px;right:-170px;height:260px;opacity:.32;background:radial-gradient(40% 50% at 25% 50%,var(--fog,#fff),transparent 70%),radial-gradient(35% 45% at 70% 40%,var(--fog,#fff),transparent 70%);animation:m2-fogx 40s ease-in-out infinite alternate}
.m2-fog.f1{top:34%}
.m2-fog.f2{top:64%;opacity:.22;animation-duration:56s;animation-direction:alternate-reverse}
@keyframes m2-fogx{from{transform:translateX(-90px)}to{transform:translateX(70px)}}
.m2-shade{position:absolute;inset:0;background:radial-gradient(120% 60% at 50% 45%,rgba(20,12,8,0) 40%,rgba(20,12,8,.6) 100%),linear-gradient(180deg,rgba(20,12,8,.85) 0,rgba(20,12,8,.15) 22%,rgba(20,12,8,0) 55%,rgba(20,12,8,.7) 92%)}
.m2-front{position:absolute;inset:0;z-index:3;overflow:hidden;pointer-events:none}
.m2-front svg{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.m2-fx{position:absolute;left:0;top:0;width:100%;height:100%;z-index:4;pointer-events:none}
.m2-trail{position:absolute;inset:0;z-index:2;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y}
.m2-trail::-webkit-scrollbar{display:none}
.m2-track{position:relative;width:100%;overflow:hidden}
.m2-path{position:absolute;left:0;top:0;pointer-events:none}
.m2-sb{stroke:rgba(20,12,8,.7);stroke-width:22;fill:none;stroke-linecap:round}
.m2-sd{stroke:#ffc94a;stroke-width:6;fill:none;stroke-linecap:round}
.m2-sg{stroke:#ffcf5a;stroke-width:18;fill:none;opacity:.3;stroke-linecap:round}
.m2-sn{stroke:#f6ecdf;stroke-width:3;fill:none;stroke-dasharray:2 10;stroke-linecap:round;opacity:.6}
.m2-sa{stroke:#fff6c8;stroke-width:6;fill:none;stroke-dasharray:10 14;stroke-linecap:round;animation:m2-flow 1s linear infinite}
@keyframes m2-flow{to{stroke-dashoffset:-24}}
.m2-nd,.xs .m2-nd{position:absolute;z-index:1;width:68px;height:46px;margin:-23px 0 0 -34px;border-radius:50%;border:0;padding:0;background:radial-gradient(ellipse at 50% 30%,#8a6a48,#2a1c12 74%);box-shadow:0 0 0 2px rgba(255,236,200,.35),0 6px 0 #140c07,0 12px 18px rgba(0,0,0,.5);font-family:'Lilita One',Nunito,sans-serif;font-size:17px;line-height:1;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;gap:3px;font-variant-numeric:tabular-nums}
.m2-nd svg{width:14px;height:14px;flex:none}
.m2-nd.done,.xs .m2-nd.done{background:radial-gradient(ellipse at 50% 30%,#46dc92,#0f5a3a 74%);box-shadow:0 0 0 2px #7dffb8,0 6px 0 #06301e,0 12px 18px rgba(0,0,0,.5)}
.m2-nd.now,.xs .m2-nd.now{background:radial-gradient(ellipse at 50% 30%,#fff0a8,#d58a14 76%);color:#2a1403;text-shadow:none;box-shadow:0 0 0 3px #fff3c4,0 0 26px 8px rgba(255,201,74,.6),0 6px 0 #6a3a06}
.m2-nd.now::after{content:"";position:absolute;inset:-9px -12px;border-radius:50%;border:2px solid #ffc94a;animation:m2-ring 1.6s ease-out infinite;pointer-events:none}
@keyframes m2-ring{from{opacity:.9;transform:scale(.8)}to{opacity:0;transform:scale(1.35)}}
.m2-nd.lock,.xs .m2-nd.lock{background:radial-gradient(ellipse at 50% 30%,#4a3a2c,#1a120c 74%);color:#d8c8b0;box-shadow:0 0 0 2px rgba(255,236,200,.18),0 6px 0 #0c0805,0 12px 18px rgba(0,0,0,.45)}
.m2-nd.mid{box-shadow:0 0 0 3px #ff8aa8,0 6px 0 #4a0a22,0 12px 18px rgba(0,0,0,.5)}
.m2-nd.lord{width:96px;height:60px;margin:-30px 0 0 -48px;font-size:20px}
.m2-nd.lord.lock,.xs .m2-nd.lord.lock{background:radial-gradient(ellipse at 50% 30%,#8a2a30,#2a0712 74%);color:#ffd0d8;box-shadow:0 0 0 3px #ff6b6b,0 0 22px 4px rgba(255,80,80,.45),0 7px 0 #2a0510}
.m2-nd[aria-pressed="true"]{outline:3px solid #5ee7ff;outline-offset:6px}
.m2-ptag{position:absolute;z-index:2;transform:translateY(-50%);min-height:24px;padding:3px 9px;border-radius:12px;background:rgba(20,12,8,.86);border:1px solid var(--edge);color:#f6ecdf;letter-spacing:0;margin:0;font-size:11px;font-weight:900;line-height:1.2;overflow-wrap:anywhere;pointer-events:none;font-variant-numeric:tabular-nums;display:flex;align-items:center}
.m2-ptag.lock{color:#f6ecdf;border-color:rgba(255,236,200,.3)}
.m2-ptag.done{color:var(--green);border-color:rgba(94,240,160,.5)}
.m2-ptag.now{color:var(--gold);border-color:var(--gold)}
.m2-ptag.mid{color:#ffc0d3;border-color:rgba(255,107,154,.6)}
.m2-mb{position:absolute;z-index:1;width:84px;height:84px;margin-top:-74px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 4px 4px rgba(0,0,0,.6));animation:m2-bob 2.4s ease-in-out infinite}
.m2-mb.won{filter:grayscale(1) brightness(.7);opacity:.7;animation:none}
.m2-mb.lk{filter:brightness(0);opacity:.85;animation:none}
@keyframes m2-bob{50%{translate:0 -5px}}
.m2-chest,.xs .m2-chest{position:absolute;z-index:2;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:14px;border:2px solid rgba(255,236,200,.25);background:rgba(20,12,8,.72);padding:2px;display:grid;place-items:center;color:#fff}
.m2-chest img{width:38px;height:38px;display:block;object-fit:contain}
.m2-chest.lk img{filter:grayscale(.85) brightness(.6)}
.m2-chest.rdy,.xs .m2-chest.rdy{border-color:#ffc94a;box-shadow:0 0 0 2px rgba(255,201,74,.35),0 0 18px rgba(255,201,74,.75);animation:m2-wob 1.4s ease-in-out infinite}
@keyframes m2-wob{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-3deg)}}
.m2-chest.got img{opacity:.45}
.m2-chest .ck{position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:#22c47a;color:#05301b;display:grid;place-items:center;border:2px solid #140c07}
.m2-chest .ck svg{width:12px;height:12px}
.m2-chest .bd{position:absolute;right:-7px;top:-8px;padding:0 5px;height:18px;border-radius:9px;background:linear-gradient(180deg,#ff9a4a,#d8461a);border:2px solid #140c07;font-size:10px;font-weight:900;line-height:14px;color:#fff;font-style:normal}
.m2-gate{position:absolute;z-index:0;width:220px;height:230px;border-radius:110px 110px 6px 6px;background:linear-gradient(180deg,#6a5442,#3a2a1e);box-shadow:0 0 0 6px #2a1d14,0 0 0 8px rgba(255,201,74,.35),0 18px 30px rgba(0,0,0,.6);pointer-events:none}
.m2-gate .in{position:absolute;inset:14px 14px 0;border-radius:96px 96px 0 0;overflow:hidden;background:#0c0805;perspective:500px}
.m2-gate .peek{position:absolute;inset:0;background-size:cover;background-position:50% 40%;opacity:0}
.m2-gate .glow{position:absolute;inset:0;background:radial-gradient(60% 55% at 50% 60%,rgba(255,236,170,.9),rgba(255,201,74,.25) 55%,transparent 80%);opacity:0}
.m2-gate .dl,.m2-gate .dr{position:absolute;top:0;bottom:0;width:50%;background:repeating-linear-gradient(90deg,#5a3a20 0 18px,#4a2e18 18px 20px);box-shadow:inset 0 0 0 3px #2a1a0e}
.m2-gate .dl{left:0;transform-origin:0 50%;border-radius:96px 0 0 0}
.m2-gate .dr{right:0;transform-origin:100% 50%;border-radius:0 96px 0 0}
.m2-gate .key{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;background:#2a0712;border:2px solid #ff6b6b;display:grid;place-items:center;color:#ffb3c4;z-index:1}
.m2-gate .key svg{width:18px;height:18px}
.m2-gate.open .dl{transform:rotateY(-78deg)}
.m2-gate.open .dr{transform:rotateY(78deg)}
.m2-gate.open .peek,.m2-gate.open .glow{opacity:1}
.m2-gbtn,.xs .m2-gbtn{position:absolute;z-index:3;left:50%;transform:translateX(-50%);min-height:46px;max-width:calc(100% - 24px);padding:4px 18px;border-radius:14px;border:0;font-family:'Lilita One',Nunito,sans-serif;font-size:18px;line-height:1.1;letter-spacing:.5px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10,0 0 22px rgba(255,201,74,.6);display:flex;align-items:center;gap:6px;text-align:center;animation:m2-gp 1.4s ease-in-out infinite}
.m2-gbtn svg{width:18px;height:18px;flex:none}
@keyframes m2-gp{50%{box-shadow:0 3px 0 #9a5a10,0 0 34px rgba(255,201,74,.95)}}
.m2-lord{position:absolute;z-index:1;width:200px;height:200px;object-fit:contain;pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.6));animation:m2-bob2 2.8s ease-in-out infinite}
.m2-lord.lk{filter:brightness(0);animation:none}
@keyframes m2-bob2{50%{transform:translateY(-5px)}}
.m2-mark{position:absolute;z-index:1;width:160px;height:160px;border-radius:50%;border:5px solid #5ee7ff;box-shadow:0 0 24px rgba(94,231,255,.6),inset 0 0 24px rgba(94,231,255,.35);display:grid;place-items:center;font-size:44px;color:#eaffff;background:radial-gradient(circle,rgba(10,30,40,.75),rgba(10,20,30,.4));pointer-events:none;animation:m2-bob2 3s ease-in-out infinite}
.m2-bban{position:absolute;z-index:2;left:50%;transform:translateX(-50%);width:max-content;min-width:200px;max-width:calc(100% - 28px);padding:6px 14px 7px;border-radius:14px;text-align:center;background:linear-gradient(180deg,rgba(90,14,24,.9),rgba(30,8,14,.92));border:1.5px solid rgba(255,107,107,.65);box-shadow:0 0 24px rgba(255,80,80,.3);pointer-events:none}
.m2-bban small{display:block;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;font-weight:900;color:#ffb3c4;line-height:1.25}
.m2-bban b{display:block;font-size:20px;line-height:1.15;overflow-wrap:anywhere}
.m2-bban span{display:block;font-size:11px;font-weight:800;color:#ffd6e2;line-height:1.3;overflow-wrap:anywhere}
.m2-bban.won{background:linear-gradient(180deg,rgba(10,70,44,.9),rgba(6,24,18,.92));border-color:rgba(94,240,160,.6);box-shadow:none}
.m2-bban.won small,.m2-bban.won span{color:#b6ffd6}
.m2-bban.mk{background:linear-gradient(180deg,rgba(20,70,90,.9),rgba(6,18,34,.92));border-color:#5ee7ff;box-shadow:0 0 24px rgba(94,231,255,.3)}
.m2-bban.mk small,.m2-bban.mk span{color:#cdeffd}
.m2-cont{position:absolute;z-index:2;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100% - 28px);text-align:center;font-size:11px;font-weight:900;line-height:1.3;color:#cdeffd;background:rgba(20,12,8,.8);border:1px solid rgba(94,231,255,.45);border-radius:12px;padding:5px 12px;pointer-events:none}
.m2-hc{position:absolute;z-index:1;width:${HC_W}px;height:${HC_H}px;pointer-events:none}
.m2-ersw{position:absolute;z-index:6;left:8px;right:8px;top:8px;display:flex;flex-direction:column;gap:4px;min-width:0;pointer-events:none}
.m2-er{display:flex;align-items:stretch;gap:6px;min-width:0;pointer-events:auto}
.m2-arr,.xs .m2-arr{flex:none;width:44px;min-height:58px;border-radius:14px;border:1px solid var(--edge);background:var(--gl2);color:#fff;display:grid;place-items:center;padding:0}
.m2-arr svg{width:20px;height:20px}
.m2-arr.off,.xs .m2-arr.off{opacity:.3}
.m2-ern{flex:1;min-width:0;min-height:58px;border-radius:16px;background:var(--gl2);border:1px solid var(--edge2);display:flex;align-items:center;gap:8px;padding:5px 10px 5px 6px;box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08)}
.m2-emb{flex:none;position:relative;width:46px;height:46px;border-radius:50%;border:2.5px solid var(--gold);background:radial-gradient(circle at 50% 40%,#5a3a20,#1a0f08);overflow:hidden;box-shadow:0 0 10px rgba(255,201,74,.45)}
.m2-emb img{position:absolute;left:-6px;top:-2px;width:58px;height:58px;object-fit:contain}
.m2-emb.lk img{filter:brightness(0)}
.m2-emb i{position:absolute;right:-1px;bottom:-1px;font-style:normal;font-family:'Lilita One',Nunito,sans-serif;font-size:10px;background:var(--gold);color:var(--ink);border-radius:6px;padding:0 3px;line-height:13px}
.m2-et{flex:1;min-width:0}
.m2-et>b{display:block;font-size:18px;line-height:1.1;overflow-wrap:anywhere;text-shadow:0 2px 0 rgba(0,0,0,.4)}
.m2-et small{display:block;font-size:10.5px;color:var(--muted);font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.m2-et small b{color:var(--gold)}
.m2-pb{height:6px;border-radius:3px;background:rgba(0,0,0,.45);margin-top:3px;overflow:hidden}
.m2-pb i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#f2a826,#ffe07a)}
.m2-pc{flex:none;font-size:17px;color:var(--gold);font-variant-numeric:tabular-nums}
.m2-dots{align-self:center;display:flex;justify-content:center;gap:5px;pointer-events:none;padding:4px 8px;border-radius:9px;background:rgba(22,16,12,.85);border:1px solid rgba(255,236,200,.16)}
.m2-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,236,200,.3);box-shadow:0 0 0 1px rgba(20,12,8,.6)}
.m2-dots i.done{background:rgba(94,240,160,.75)}
.m2-dots i.here{background:var(--gold)}
.m2-dots i.on{width:18px;border-radius:4px;box-shadow:0 0 0 2px #fff}
.m2-card{position:absolute;z-index:6;left:10px;right:10px;bottom:max(12px,env(safe-area-inset-bottom));border-radius:20px;padding:11px 12px 12px;background:var(--glass);border:1.5px solid var(--edge2);box-shadow:0 14px 30px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.1);min-width:0}
.m2-card.lk{border-color:var(--edge)}
.m2-ch{display:flex;align-items:flex-start;gap:8px;min-width:0}
.m2-ch .t{flex:1;min-width:0}
.m2-ck{display:block;font-size:10px;letter-spacing:1.3px;text-transform:uppercase;font-weight:900;color:var(--gold);line-height:1.25}
.m2-ck.done{color:var(--green)}
.m2-ck.lock{color:var(--muted)}
.m2-ck.lord{color:#ffb3c4}
.m2-ch .t>b{display:block;font-size:21px;line-height:1.12;overflow-wrap:anywhere}
.m2-ch .t small{display:block;font-size:11px;font-weight:800;color:var(--muted);line-height:1.25;overflow-wrap:anywhere}
.m2-dif{flex:none;max-width:40%;font-size:10px;font-weight:900;padding:3px 8px;border-radius:8px;margin-top:2px;text-align:center;line-height:1.2}
.m2-dif.easy{background:rgba(94,240,160,.2);color:var(--green)}
.m2-dif.even{background:rgba(255,201,74,.2);color:var(--gold)}
.m2-dif.nope{background:rgba(255,107,107,.22);color:#ff9f9f}
.m2-dif.gone{background:rgba(94,240,160,.15);color:var(--green)}
.m2-gain{margin-top:5px;font-size:11px;font-weight:800;color:#f0dcc0;line-height:1.35;overflow-wrap:anywhere}
.m2-gain b{color:var(--gold)}
.m2-rw{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;min-width:0}
.m2-rw span{display:flex;align-items:center;gap:4px;min-height:28px;max-width:100%;padding:2px 8px 2px 3px;border-radius:9px;background:rgba(0,0,0,.35);border:1px solid var(--edge);font-size:10.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.m2-rw img,.m2-rw svg{width:22px;height:22px;flex:none}
.m2-fcr{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:6px;margin-top:7px}
.m2-fcr span{min-width:0;border-radius:11px;background:rgba(0,0,0,.35);padding:5px 9px;font-size:10px;font-weight:900;color:var(--muted);line-height:1.2;overflow-wrap:anywhere}
.m2-fcr span b{display:block;font-size:17px;color:var(--text);font-variant-numeric:tabular-nums}
.m2-fcr span.ok b{color:var(--green)}
.m2-fcr span.no b{color:#ff9f9f}
.m2-fbar{position:relative;height:8px;border-radius:4px;background:rgba(0,0,0,.45);margin-top:7px}
.m2-fbar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,#ff9f9f,#ffc94a 64%,#5ef0a0 80%)}
.m2-fbar em{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fff;border-radius:1px}
.m2-flbl{margin-top:3px;display:flex;justify-content:space-between;gap:8px;font-size:9.5px;font-weight:800;color:var(--muted);line-height:1.25}
.m2-flbl span{min-width:0;overflow-wrap:anywhere}
.m2-flbl span:last-child{text-align:right}
.m2-row{display:flex;gap:6px;margin-top:9px;min-width:0}
.m2-bt,.xs .m2-bt{flex:1;min-width:0;min-height:44px;padding:4px 10px;border-radius:13px;border:0;font-weight:900;font-size:14px;line-height:1.15;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center;overflow-wrap:anywhere}
.m2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.m2-bt.big,.xs .m2-bt.big{min-height:52px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:23px;letter-spacing:1px}
.m2-bt.big svg{width:20px;height:20px;flex:none}
.m2-bt.ghost,.xs .m2-bt.ghost{background:rgba(0,0,0,.35);color:#f6ecdf;box-shadow:none;border:1px solid rgba(255,236,200,.28)}
.m2-cpop{position:absolute;z-index:20;inset:0;background:rgba(10,6,4,.55);display:flex;align-items:flex-end;justify-content:center;padding:0 14px max(16px,env(safe-area-inset-bottom));animation:m2-fade .2s ease-out}
.m2-cpop .sh{width:100%;max-width:420px;min-width:0;border-radius:20px;background:rgba(29,22,17,.97);border:1.5px solid var(--gold);box-shadow:0 14px 30px rgba(0,0,0,.6);padding:12px;color:var(--text)}
.m2-cpop h3{margin:0;display:flex;align-items:center;gap:10px;font-size:21px;line-height:1.15;min-width:0}
.m2-cpop h3 img{width:56px;height:56px;flex:none;object-fit:contain}
.m2-cpop h3 span{min-width:0;overflow-wrap:anywhere}
.m2-cpop h3 small{display:block;font-family:Nunito,system-ui,sans-serif;font-size:11px;font-weight:900;color:var(--muted);line-height:1.3}
.m2-li{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.m2-li span{display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 10px 4px 6px;border-radius:12px;background:rgba(0,0,0,.35);border:1px solid var(--edge);font-weight:900;font-size:13px;line-height:1.2;overflow-wrap:anywhere}
.m2-li img{width:30px;height:30px;flex:none;object-fit:contain}
.m2-cst{margin-top:8px;font-size:12px;font-weight:800;color:var(--muted);line-height:1.35;overflow-wrap:anywhere}
.m2-cst b{color:var(--gold)}
.m2-toast{position:absolute;left:50%;z-index:40;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:9px 14px;border-radius:13px;background:rgba(26,17,11,.94);border:1px solid rgba(255,236,200,.25);font-weight:900;font-size:12px;line-height:1.3;text-align:center;overflow-wrap:anywhere;pointer-events:none;animation:m2-tin .25s ease-out both}
@keyframes m2-tin{from{opacity:0;transform:translate(-50%,-8px)}}
.m2-wipe{position:absolute;inset:0;z-index:30;pointer-events:none;background-size:cover;background-position:50% 40%;clip-path:circle(0 at 50% 30%);-webkit-clip-path:circle(0 at 50% 30%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;padding:0 16px;opacity:1}
.m2-wipe::before{content:"";position:absolute;inset:0;background:radial-gradient(60% 40% at 50% 45%,rgba(255,236,170,.75),rgba(20,12,8,.55) 80%)}
.m2-wipe.in{clip-path:circle(140% at 50% 30%);-webkit-clip-path:circle(140% at 50% 30%);transition:clip-path .65s cubic-bezier(.6,0,.3,1),-webkit-clip-path .65s cubic-bezier(.6,0,.3,1)}
.m2-wipe.out{opacity:0;transition:opacity .55s ease-in}
.m2-wipe small,.m2-wipe b,.m2-wipe span{position:relative;overflow-wrap:anywhere}
.m2-wipe small{font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:#2a1403}
.m2-wipe b{font-size:38px;line-height:1.05;color:#fff;text-shadow:0 3px 0 #000,0 0 22px rgba(255,201,74,.9)}
.m2-wipe span{display:inline-block;padding:6px 20px;font-size:17px;line-height:1.15;color:#fff;background:linear-gradient(90deg,transparent,rgba(220,110,20,.92) 18%,rgba(220,110,20,.92) 82%,transparent);text-shadow:0 2px 0 #000}
.m2-gatebox{position:relative;z-index:3;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.m2-gatebox .m2-bt{flex:none;min-height:48px;padding:0 26px;font-size:15px}
.m2-msg{font-size:13px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.m2-in,.m2-scene.swap,.m2-far>div,.m2-fog,.m2-sa,.m2-nd.now::after,.m2-mb,.m2-chest.rdy,.m2-gbtn,.m2-lord,.m2-mark,.m2-cpop,.m2-toast{animation:none}.m2-wipe.in,.m2-wipe.out{transition:none}}
`; document.head.appendChild(st); })();

/* ---------- geometria ---------- */
function geo(){ const d=(typeof xDims==='function'&&xDims(640))||{}, W=Math.round(clamp(num(d.Wb)||390,280,600)), H=Math.round(Math.max(420,num(d.H)||704)), n=PER();
  /* folga inferior da trilha: o que falta, além do BOT, para a fase 1 subir acima do cartão de baixo (altura REAL do cartão, medida no fit()) */
  const ch=num(X.cardH)>0?X.cardH:CARD_H0, free=H-ch-CARD_B, pad=Math.max(0,H-free+NODE_CLR-BOT);
  const TH=TOPY+(n-1)*STEP+BOT, M=Math.max(0,TH+pad-H), Mp=Math.min(M,2400), kx=Math.min(1,W/390), cx=Math.round(W/2);
  return {d:d,W:W,H:H,n:n,TH:TH,M:M,Mp:Mp,kx:kx,cx:cx,free:free,pad:pad,xs:i=>i>=n-1?cx:Math.round(cx+(XS[i%XS.length]-195)*kx),ny:i=>TOPY+(n-1-i)*STEP,lh:k=>Math.round(H+PF[k]*Mp)}; }
/* mede o cartão de baixo já desenhado (altura e topo reais, na base da tela) e acerta a folga inferior da trilha e o limite da rolagem.
   Sem medida (tela fora do documento) fica a reserva do geo(). */
function fit(g){ if(!g) return; const c=el('m2_card'), tk=el('m2_track'); let ch=0, top=0;
  try{ if(c){ ch=Math.ceil(num(c.offsetHeight)); top=Math.floor(num(c.offsetTop)); } }catch(e){ ch=0; }
  if(!(ch>0)) return;
  X.cardH=ch; g.free=(top>0&&top<g.H)?top:g.H-ch-CARD_B; g.pad=Math.max(0,g.H-g.free+NODE_CLR-BOT); g.M=Math.max(0,g.TH+g.pad-g.H);
  try{ if(tk&&tk.style) tk.style.height=(g.TH+g.pad)+'px'; }catch(e){} }
/* rolagem que põe a fase s à vista: perto do meio da tela, mas SEMPRE acima do cartão de baixo (o nó inteiro e, na fase atual, o herói em cima dele) */
const targetOf=(g,s)=>{ const i=clamp(s-block(X.view),0,g.n-1), y=Math.min(Math.max(g.H*0.47,262),g.free-(i>=g.n-1?NODE_CLR+8:NODE_CLR)); return clamp(Math.round(g.ny(i)-y),0,g.M); };

/* ---------- aviso (no alto, logo abaixo da troca de era: longe do cartão, dos botões de baixo e do herói, que fica no meio da tela) ---------- */
const TOAST_TOP=108;
const toastHtml=m=>'<div class="m2-toast" role="status" style="top:'+TOAST_TOP+'px">'+esc(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=now(); const t=el('m2_toast'); if(t) t.innerHTML=X.toast?toastHtml(X.toast):''; }

/* ================= CENÁRIO ================= */
function rng(seed){ let a=(seed*2654435761)>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function sil(kind,y,s,r){ const w=v=>Math.round(v*s), xo=-6+Math.round(r()*14);
  switch(kind){
    case 'palm': return `<rect x="${xo+w(18)}" y="${y-w(150)}" width="${w(9)}" height="${w(150)}" transform="rotate(6 ${xo+w(22)} ${y})"/><path d="M${xo+w(30)} ${y-w(150)} q${w(40)} ${-w(14)} ${w(62)} ${w(18)} q${-w(30)} ${-w(10)} ${-w(62)} ${-w(4)} M${xo+w(30)} ${y-w(150)} q${-w(34)} ${-w(16)} ${-w(50)} ${w(14)} q${w(24)} ${-w(14)} ${w(50)} ${-w(6)} M${xo+w(30)} ${y-w(152)} q${w(10)} ${-w(34)} ${w(40)} ${-w(40)} q${-w(24)} ${w(10)} ${-w(38)} ${w(38)}"/>`;
    case 'pine': return `<path d="M${xo} ${y} L${xo+w(36)} ${y-w(70)} L${xo+w(72)} ${y} Z M${xo+w(6)} ${y-w(45)} L${xo+w(36)} ${y-w(110)} L${xo+w(66)} ${y-w(45)} Z M${xo+w(14)} ${y-w(88)} L${xo+w(36)} ${y-w(145)} L${xo+w(58)} ${y-w(88)} Z"/><rect x="${xo+w(31)}" y="${y}" width="${w(10)}" height="${w(18)}"/>`;
    case 'column': return `<rect x="${xo+w(8)}" y="${y-w(170)}" width="${w(30)}" height="${w(170)}"/><rect x="${xo}" y="${y-w(182)}" width="${w(46)}" height="${w(14)}"/><path d="M${xo+w(4)} ${y-w(182)} L${xo+w(18)} ${y-w(200)} L${xo+w(30)} ${y-w(186)} L${xo+w(42)} ${y-w(196)} L${xo+w(46)} ${y-w(182)} Z"/>`;
    case 'mast': return `<rect x="${xo+w(22)}" y="${y-w(230)}" width="${w(6)}" height="${w(230)}"/><path d="M${xo+w(28)} ${y-w(210)} Q${xo+w(70)} ${y-w(170)} ${xo+w(28)} ${y-w(120)} Z M${xo+w(28)} ${y-w(110)} Q${xo+w(64)} ${y-w(80)} ${xo+w(28)} ${y-w(40)} Z"/><rect x="${xo}" y="${y-w(222)}" width="${w(50)}" height="${w(4)}"/>`;
    case 'chimney': return `<rect x="${xo+w(6)}" y="${y-w(210)}" width="${w(28)}" height="${w(210)}"/><rect x="${xo}" y="${y-w(220)}" width="${w(40)}" height="${w(12)}"/><circle cx="${xo+w(24)}" cy="${y-w(245)}" r="${w(16)}" opacity=".35"/><circle cx="${xo+w(42)}" cy="${y-w(275)}" r="${w(22)}" opacity=".22"/>`;
    case 'tower': { let o=`<rect x="${xo-4}" y="${y-w(250)}" width="${w(62)}" height="${w(250)}"/>`; for(let j=0;j<6;j++) for(let i=0;i<2;i++) if(r()<0.55) o+=`<rect x="${xo+w(10+i*24)}" y="${y-w(230-j*36)}" width="${w(10)}" height="${w(14)}" fill="#ffe9a0" opacity=".45"/>`; return o; }
    case 'crystal': return `<path d="M${xo} ${y} L${xo+w(14)} ${y-w(150)} L${xo+w(30)} ${y} Z M${xo+w(20)} ${y} L${xo+w(44)} ${y-w(96)} L${xo+w(60)} ${y} Z"/><path d="M${xo+w(14)} ${y-w(150)} L${xo+w(18)} ${y-w(20)}" stroke="#9ad8ff" stroke-width="2" opacity=".6"/>`;
    case 'spike': return `<path d="M${xo} ${y} L${xo+w(10)} ${y-w(160)} L${xo+w(22)} ${y} Z M${xo+w(18)} ${y} L${xo+w(32)} ${y-w(110)} L${xo+w(46)} ${y} Z M${xo+w(40)} ${y} L${xo+w(52)} ${y-w(60)} L${xo+w(64)} ${y} Z"/>`;
    default: return `<g fill="#fff" opacity=".55"><circle cx="${w(10)}" cy="${y-w(30)}" r="${w(34)}"/><circle cx="${w(46)}" cy="${y-w(20)}" r="${w(26)}"/><circle cx="${w(-6)}" cy="${y+w(6)}" r="${w(30)}"/></g>`; } }
/* silhuetas da frente: desenhadas uma vez por era e guardadas (texto do SVG) */
const FRONT={};
function frontSvg(g,v){ const D=decOf(v), h=g.lh('front'), key=v+'|'+g.W+'|'+h; if(FRONT[key]) return FRONT[key]; const r=rng(31+v), kind=D.sil, cl=kind==='cloud'; let L='', R='';
  for(let y=200;y<h;y+=200+Math.round(r()*90)) L+=sil(kind,y,0.8+r()*0.4,r);
  for(let y=300;y<h;y+=200+Math.round(r()*90)) R+=sil(kind,y,0.8+r()*0.4,r);
  for(const k in FRONT) delete FRONT[k];
  return FRONT[key]=`<svg viewBox="0 0 ${g.W} ${h}" preserveAspectRatio="none"><g fill="${cl?'#ffffff':'#140c07'}" stroke="${D.lt}" stroke-opacity="${cl?0:.28}" stroke-width="1.5" opacity="${cl?.8:.93}">${L}<g transform="translate(${g.W} 0) scale(-1 1)">${R}</g></g></svg>`; }
const lyStyle=(g,k)=>'height:'+g.lh(k)+'px;top:'+(-PF[k]*g.Mp).toFixed(1)+'px';
/* camadas reais da batalha (mesma montagem do js/p_end9.js, em 150%): céu, fundo distante e chão */
function compHtml(dir,gold){ return '<div class="m2-comp"'+(gold?' style="filter:'+GOLD_F+'"':'')+'>'
  +'<i style="top:0;height:372px;background-image:url('+dir+'sky.webp);background-size:744px 372px"></i>'
  +'<i style="top:39px;height:300px;background-image:url('+dir+'far.webp);background-size:751px 300px;background-position:-78px 0"></i>'
  +'<i style="top:360px;height:244px;background-image:url('+dir+'ground.webp);background-size:289px 244px"></i></div>'; }
function sceneHtml(g,v){ const dir=bgDir(artEra(v)), gold=v>=NE(), D=decOf(v), fog=gold?'#ffe9a0':D.fog;
  return '<div class="m2-scene'+(X.swap?' swap':'')+'" aria-hidden="true">'
    +'<div class="m2-ly m2-far" id="m2_lsky" style="'+lyStyle(g,'sky')+'"><div style="background-image:url('+dir+'sky.webp);filter:blur(7px) brightness(.5) '+(gold?'hue-rotate(-24deg) saturate(1.5)':'saturate(1.15)')+'"></div></div>'
    +'<div class="m2-ly" id="m2_lmid" style="'+lyStyle(g,'mid')+'">'+compHtml(dir,gold)+'</div>'
    +'<div class="m2-fog f1" style="--fog:'+fog+'"></div><div class="m2-fog f2" style="--fog:'+fog+'"></div><div class="m2-shade"></div></div>'; }

/* ---------- partículas da era (canvas; até 44; sem sombra por partícula) ---------- */
const FXC={ember:'255,150,60',ember2:'255,80,40',mote:'255,232,160',snow:'255,255,255',spark:'255,214,110',dust:'235,205,150',star:'210,225,255',leaf:'110,170,70'};
const theme=()=>X.view>=NE()?'mote':decOf(X.view).fx;
function spawn(th,init,W,H){ const r=Math.random, p={x:r()*W,y:init?r()*H:0,r:1+r()*2.2,ph:r()*6.3,rot:r()*6.3,vr:(r()-.5)*2,vx:0,vy:0};
  if(th==='ember'||th==='ember2'||th==='mote'){ p.vy=-(14+r()*26); p.vx=(r()-.5)*10; if(!init) p.y=H+16; }
  else if(th==='leaf'){ p.vy=22+r()*20; p.vx=10+r()*18; p.r=3+r()*2.5; if(!init) p.y=-12; }
  else if(th==='snow'){ p.vy=18+r()*24; p.vx=(r()-.5)*8; if(!init) p.y=-8; }
  else if(th==='spark'){ p.vy=60+r()*60; p.vx=(r()-.5)*30; p.r=1+r(); if(!init) p.y=-8; }
  else if(th==='dust'){ p.vx=12+r()*18; p.vy=(r()-.5)*6; p.r=.8+r()*1.6; if(!init) p.x=-6; }
  else { p.r=.6+r()*1.6; }
  return p; }
function fxReset(){ X.P=[]; X.fxKind=''; }
function drawFx(c,t,dt){ const g=X.geo; if(!g) return; const W=g.W, H=g.H; if(c.width!==W||c.height!==H){ c.width=W; c.height=H; }
  const x=c.getContext('2d'); if(!x) return; const th=theme();
  if(X.fxKind!==th||!X.P.length){ const nn=th==='star'||th==='snow'||th==='dust'?44:th==='spark'?30:40; X.P=[]; for(let i=0;i<nn;i++) X.P.push(spawn(th,true,W,H)); X.fxKind=th; }
  const rm=reduced(), col='rgb('+(FXC[th]||'255,255,255')+')';
  x.clearRect(0,0,W,H); x.fillStyle=col; x.strokeStyle=col;
  for(const p of X.P){ if(!rm){ p.x+=p.vx*dt+(th==='leaf'||th==='snow'?Math.sin(t*1.3+p.ph)*0.4:0); p.y+=p.vy*dt; p.rot+=p.vr*dt; }
    if(p.y<-20||p.y>H+26||p.x>W+10||p.x<-20) Object.assign(p,spawn(th,false,W,H));
    const tw=th==='star'||th==='mote'?0.45+0.55*Math.abs(Math.sin(t*1.7+p.ph)):th==='ember'||th==='ember2'?0.55+0.45*Math.sin(t*5+p.ph):0.8;
    x.globalAlpha=Math.max(0,tw);
    if(th==='leaf'){ x.save(); x.translate(p.x,p.y); x.rotate(p.rot); x.beginPath(); x.ellipse(0,0,p.r*1.6,p.r*.7,0,0,7); x.fill(); x.restore(); }
    else if(th==='spark'){ x.lineWidth=p.r; x.beginPath(); x.moveTo(p.x,p.y); x.lineTo(p.x-p.vx*.06,p.y-p.vy*.06); x.stroke(); }
    else { x.beginPath(); x.arc(p.x,p.y,p.r,0,7); x.fill(); } }
  x.globalAlpha=1; }

/* ---------- herói na fase atual: rota única do jogo (arma na mão, asa, montaria e o pet por último, na frente) ---------- */
function drawHero(c,t){ if(!canDraw()) return; const dpr=Math.min(window.devicePixelRatio||1,2), pw=Math.round(HC_W*dpr), ph=Math.round(HC_H*dpr);
  if(c.width!==pw||c.height!==ph){ c.width=pw; c.height=ph; }
  const x=c.getContext('2d'); if(!x) return; x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,HC_W,HC_H);
  const mt=mounted();
  x.save(); x.globalAlpha=.35; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(HC_X,HC_GY+1,mt?40:24,6,0,0,7); x.fill(); x.restore();   /* sombra no chão do nó: nada flutua */
  x.save(); try{ window.drawHeroFull(x,HC_X,HC_GY,(mt?0.36:0.42)*256/HS,{t:t}); }finally{ x.restore(); } }
function loop(ts){ X.raf=0; if(!isOn()){ X.t0=0; return; } const fx=el('m2_fx'), hc=el('m2_hc'); if(!fx&&!hc){ X.t0=0; return; }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), dt=clamp(t-X.t,0,0.05); X.t=t;
  let hid=false; try{ hid=document.hidden===true; }catch(e){}
  if(!hid){ if(fx){ try{ drawFx(fx,t,dt); }catch(e){} } if(hc){ try{ drawHero(hc,t); }catch(e){ X.herr=1; } } }
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&(el('m2_fx')||el('m2_hc'))) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; X.t=0; }

/* ================= HTML ================= */
function emptyHtml(msg){ return '<div class="m2"><div class="m2-gatebox" role="dialog" aria-label="Mapa das Eras"><span class="lil" style="font-size:26px">Mapa das Eras</span>'
  +'<span class="m2-msg" role="alert">'+esc(msg)+'</span><button class="m2-bt" data-x="back">Voltar</button></div></div>'; }
function segsHtml(g,v){ const a=block(v), lv=lockedV(v); let h='', x1=g.cx, y1=g.TH-120;
  for(let i=0;i<g.n;i++){ const x2=g.xs(i), y2=g.ny(i), d='M'+x1+' '+y1+' C'+x1+' '+(y1-66)+' '+x2+' '+(y2+66)+' '+x2+' '+y2, st=lv?'lock':stOf(a+i);
    h+='<path class="m2-sb" d="'+d+'"/>'+(st==='lock'?'<path class="m2-sn" d="'+d+'"/>':st==='now'?'<path class="m2-sg" d="'+d+'"/><path class="m2-sa" d="'+d+'"/>':'<path class="m2-sg" d="'+d+'"/><path class="m2-sd" d="'+d+'"/>');
    x1=x2; y1=y2; }
  return h; }
function nodesHtml(g,v){ const a=block(v), lv=lockedV(v), e=artEra(v), ne=NE(), chs=chestsOf(v); let h='';
  for(let i=0;i<g.n;i++){ const s=a+i, st=lv?'lock':stOf(s), x=g.xs(i), y=g.ny(i), top=i===g.n-1, lord=isLord(s), mid=isMid(s), right=x<=g.cx;
    const ico=st==='done'?SV.check:st==='lock'?(lord?SV.crown:SV.lock):lord?SV.crown:'';
    const lab=stageName(s)+(st==='done'?', vencida':st==='now'?', fase atual':', fechada');
    h+='<button class="m2-nd '+st+(top?' lord':'')+(mid?' mid':'')+'" style="left:'+x+'px;top:'+y+'px" data-x="st" data-s="'+s+'" aria-pressed="'+(X.sel===s)+'" aria-label="'+esc(lab)+'">'+ico+'<span>'+nT(s)+'</span></button>';
    if(!top){ const need=needFC(s), txt=st==='done'?'vencida':(mid?'Chefe · ':'')+(need?'FC '+fcT(need):'fase '+nT(s)), room=Math.max(60,Math.round(right?g.W-(x+44)-6:x-44-6));
      if(txt) h+='<span class="m2-ptag '+st+(mid&&st==='lock'?' mid':'')+'" style="'+(right?'left:'+(x+44)+'px':'right:'+(g.W-x+44)+'px')+';top:'+y+'px;max-width:'+room+'px">'+esc(txt)+'</span>'; }
    /* chefe do meio: na batalha o chefe de toda fase usa a arte do chefe da era (assets/enemies/era<N>_boss.png), menor; fica de pé do lado oposto à etiqueta */
    if(mid&&v<ne){ const mx=right?x-34-84:x+34; h+='<img class="m2-mb'+(st==='done'?' won':lv?' lk':'')+'" src="'+bossUrl(e)+'" alt="" style="left:'+mx+'px;top:'+y+'px'+(right?'':';transform:scaleX(-1)')+'">'; }
    /* baú de marco: só o que o Sys.mapChest devolve */
    const c=chs.find(q=>q.stage===s); if(c){ const cs=c.state==='collected'?'got':c.state==='ready'?'rdy':'lk', cx=right?x-70:x+70;
      h+='<button class="m2-chest '+cs+'" style="left:'+cx+'px;top:'+(y-6)+'px" data-x="chest" data-s="'+s+'" aria-label="'+esc(String(c.name||'Baú')+' da fase '+nT(s)+(cs==='rdy'?', pronto para coletar':cs==='got'?', coletado':', fechado'))+'">'+ic(IC.chest,38)+(cs==='got'?'<i class="ck">'+SV.check+'</i>':cs==='rdy'?'<i class="bd">!</i>':'')+'</button>'; } }
  return h; }
/* topo do trecho: portão + Senhor da Era (arte real) + faixa; nas fases sem fim, o topo do bloco (marco, quando o Sys.erasEnd diz que é) */
function topHtml(g,v){ const a=block(v), top=a+g.n-1, ne=NE(), need=needFC(top), by=TOPY-150, fcTxt=need?'FC pedida '+fcT(need):'';
  if(v>=ne){ const mk=isMark(top), rw=mk?markRewards(top):[], parts=(fcTxt?[fcTxt]:[]).concat(rw);
    return '<div class="m2-mark lil" style="left:'+(g.cx-80)+'px;top:'+(TOPY-350)+'px">'+nT(top)+'</div>'
      +'<div class="m2-bban mk" style="top:'+by+'px"><small>'+(mk?'Marco no topo':'Topo deste trecho')+'</small><b class="lil">'+(mk?'Marco ':'Fase ')+nT(top)+'</b>'+(parts.length?'<span>'+esc(parts.join(' · '))+'</span>':'')+'</div>'
      +(stageNow()>LAST()?'<span class="m2-cont" style="top:'+(TOPY-490)+'px">A jornada continua: novo trecho a cada '+nT(g.n)+' fases</span>':''); }
  const won=eraWon(v), lv=lockedV(v), nx=v+1, bn=bossName(v), peek=won?bgDir(artEra(nx))+'sky.webp':'';
  return '<div class="m2-gate'+(won?' open':'')+'" style="left:'+(g.cx-110)+'px;top:'+(TOPY-400)+'px"><div class="in"><div class="peek"'+(peek?' style="background-image:url('+peek+')'+(nx>=ne?';filter:'+GOLD_F:'')+'"':'')+'></div><div class="glow"></div><div class="dl"></div><div class="dr"></div>'+(won?'':'<span class="key">'+SV.lock+'</span>')+'</div></div>'
    +(won?'':'<img class="m2-lord'+(lv?' lk':'')+'" src="'+bossUrl(v)+'" alt="" style="left:'+(g.cx-100)+'px;top:'+(TOPY-372)+'px">')
    +(won?'<button class="m2-gbtn" data-x="gate" style="top:'+(TOPY-250)+'px">'+SV.up+'<span>'+(nx>=ne?'Além das Eras':'Atravessar: Era '+rom(nx))+'</span></button>':'')
    +'<div class="m2-bban'+(won?' won':'')+'" style="top:'+by+'px"><small>'+(won?'Senhor vencido · portão aberto':'Senhor da Era')+'</small><b class="lil">'+esc(bn)+'</b><span>'+(won?'A era '+rom(v)+' está completa':esc(fcTxt||('Fase '+nT(top))))+'</span></div>'; }
function ernHtml(v){ const cv=curView(), a=block(v), n=PER(), ne=NE(), s=stageNow(), L=LAST(); let sub, won, emb, name;
  if(v>=ne){ won=s>L?clamp(s-a,0,n):0; name='Além das Eras';
    sub=s>L?'Fases sem fim · '+nT(a)+' a '+nT(a+n-1)+' · você na <b>'+nT(s)+'</b>':'Fases sem fim · abrem depois da fase '+nT(L);
    emb='<div class="m2-emb'+(s>L?'':' lk')+'" style="border-color:#5ee7ff"><img src="'+bossUrl(artEra(v))+'" alt=""'+(s>L?' style="filter:hue-rotate(-24deg) saturate(1.4)"':'')+'><i>+</i></div>'; }
  else { won=clamp(s-a,0,n); name=eraName(v);
    sub='Era '+rom(v)+' de '+rom(ne-1)+' · '+(v<cv?'<b>completa</b>':v>cv?'fechada':'<b>'+nT(won)+'/'+nT(n)+'</b> fases');
    emb='<div class="m2-emb'+(v>cv?' lk':'')+'"><img src="'+bossUrl(v)+'" alt=""><i>'+rom(v)+'</i></div>'; }
  const pct=Math.round(won/n*100);
  return emb+'<div class="m2-et"><b class="lil">'+esc(name)+'</b><small>'+sub+'</small><div class="m2-pb" role="img" aria-label="Progresso deste trecho: '+pct+'%"><i style="width:'+pct+'%"></i></div></div><div class="m2-pc lil">'+pct+'%</div>'; }
function dotsHtml(v){ const cv=curView(), ne=NE(); let d=''; for(let i=0;i<=ne;i++) d+='<i class="'+(i<cv?'done':i===cv?'here':'')+(i===v?' on':'')+'"></i>'; return d; }
/* cartão da fase escolhida: FC pedida x a sua e a ação */
function cardHtml(v){ const s=X.sel, cur=stageNow(), lv=lockedV(v), st=lv?'lock':stOf(s), n=PER(), ne=NE(), L=LAST(), need=needFC(s), fc=myFC();
  const lord=isLord(s), mid=isMid(s), mark=isMark(s), e=eraIdx(s);
  const kick=st==='done'?['done','Vencida']:st==='lock'?['lock',lv?(v>=ne?'Trecho fechado':'Era fechada'):'Fechada']:lord?['lord','Senhor da Era · última fase da era']:mid?['lord','Chefe do meio da era']:mark?['','Próximo marco']:['','Próxima fase'];
  const sub=s<=L?eraName(e)+' · fase '+nT(inEra(s))+' de '+nT(n):'Fases sem fim · a jornada continua';
  let gain='';
  if(lord) gain=s>=L?'Vencer completa as <b>'+nT(ne)+' eras</b>: a jornada continua nas fases sem fim.':'Vencer abre o portão para a era <b>'+esc(eraName(e+1))+'</b>.';
  else if(mark){ const rw=markRewards(s); if(rw.length) gain='Prêmio do marco: '+esc(rw.join(', '))+'.'; }
  if(st==='lock'){ if(lv) gain=v>=ne?'Depois de <b>'+esc(bossName(ne-1))+'</b> (fase '+nT(L)+') vêm as <b>fases sem fim</b>: a jornada continua.'
      :'Vença <b>'+esc(bossName(v-1))+'</b>, Senhor da era '+esc(eraName(v-1))+' (fase '+nT(v*n)+'), para abrir esta era.';
    else gain='Vença a <b>fase '+nT(cur)+'</b> antes.'+(gain?' '+gain:''); }
  const brw=st!=='done'?bossRewards(s).map(q=>'<span>'+q[0]+esc(q[1])+'</span>').join(''):'';
  let chips=''; if(st!=='done'&&lord) chips='<div class="m2-rw">'+brw+'<span>'+SV.key+esc(s>=L?'Completa as '+nT(ne)+' eras':'Abre a era '+eraName(e+1))+'</span></div>';
  else if(brw) chips='<div class="m2-rw">'+brw+'</div>';
  else if(st!=='done'&&mark){ const rw=markRewards(s); if(rw.length) chips='<div class="m2-rw">'+rw.map(t=>'<span>'+SV.title+esc(t)+'</span>').join('')+'</div>'; }
  let dif='', fcr='';
  if(need&&fc){ const k=fc/need, pct=Math.round(k*100), tm=tierMarks(), tr=TIER[tierOf(fc,need)], sc=Math.max(1.25,tm.g*1.25), w=clamp(k/sc*100,2,100);
    dif=st==='done'?'<span class="m2-dif gone">Vencida</span>':'<span class="m2-dif '+tr[0]+'">'+tr[1]+'</span>';
    fcr='<div class="m2-fcr"><span>FC pedida<b class="lil">'+esc(fcT(need))+'</b></span><span class="'+(k>=tm.g?'ok':'no')+'">Sua FC ('+nT(pct)+'%)<b class="lil">'+esc(fcT(fc))+'</b></span></div>'
      +'<div class="m2-fbar" role="img" aria-label="Sua FC é '+nT(pct)+'% da pedida"><i style="width:'+w.toFixed(1)+'%"></i><em style="left:'+(tm.y/sc*100).toFixed(1)+'%"></em><em style="left:'+(tm.g/sc*100).toFixed(1)+'%"></em></div>'
      +'<div class="m2-flbl"><span>Abaixo de '+nT(Math.round(tm.y*100))+'%: bem abaixo</span><span>'+nT(Math.round(tm.g*100))+'%: FC suficiente</span></div>'; }
  else { dif=st==='done'?'<span class="m2-dif gone">Vencida</span>':'';
    if(need) fcr='<div class="m2-fcr"><span>FC pedida<b class="lil">'+esc(fcT(need))+'</b></span><span>Sua FC<b class="lil">indisponível agora</b></span></div>'; }
  const btn=st==='now'?'<button class="m2-bt big" data-x="fight">'+SV.sword+'Lutar</button>':'<button class="m2-bt ghost" data-x="cur">Ir para a fase atual ('+nT(cur)+')</button>';
  return '<div class="m2-ch"><div class="t"><span class="m2-ck '+kick[0]+'">'+kick[1]+'</span><b class="lil">'+esc(stageName(s))+'</b><small>'+esc(sub)+'</small></div>'+dif+'</div>'
    +(gain?'<div class="m2-gain">'+gain+'</div>':'')+chips+fcr+'<div class="m2-row">'+btn+'</div>'; }
/* linhas do prêmio: só o que o módulo devolveu (lista ou coleta); pedra de forja só com o Sys.forge carregado (é ele que credita) */
function rewardRows(r){ const o=[]; if(!r) return o; const gd=num(r.gold), gm=num(r.gems), stn=num(r.stones);
  if(gd>0) o.push([IC.coin,kfT(gd)+' '+(gd===1?'moeda':'moedas')]); if(gm>0) o.push([IC.gem,pl(gm,'diamante','diamantes')]);
  if(stn>0&&Y().forge) o.push([IC.forge,pl(stn,'pedra de forja','pedras de forja')]); return o; }
function popHtml(v){ if(!X.chest) return ''; const c=chestAt(v,X.chest); if(!c){ X.chest=0; return ''; }
  const s=c.stage, rows=rewardRows(c.reward), nm=String(c.name||'Baú de marco');
  const stx=c.state==='collected'?'Já coletado.':c.state==='ready'?'<b>Pronto!</b> A fase '+nT(s)+' foi vencida.':'Abre quando você vencer a <b>fase '+nT(s)+'</b>.';
  return '<div class="m2-cpop"><div class="sh" role="dialog" aria-label="'+esc(nm)+'"><h3 class="lil">'+ic(IC.chest,56)+'<span>'+esc(nm)+'<small>Marco da fase '+nT(s)+' · '+esc(eraName(eraIdx(s)))+'</small></span></h3>'
    +'<div class="m2-li">'+rows.map(q=>'<span>'+ic(q[0],30)+esc(q[1])+'</span>').join('')+'</div><div class="m2-cst">'+stx+'</div>'
    +'<div class="m2-row">'+(c.state==='ready'?'<button class="m2-bt big" data-x="claim" data-s="'+s+'">Coletar</button>':'')+'<button class="m2-bt ghost" data-x="cclose">Fechar</button></div></div></div>'; }
function wipeInner(v){ const ne=NE(); return v>=ne?'<small>Fim das '+nT(ne)+' eras</small><b class="lil">Além das Eras</b><span class="lil">A jornada continua</span>'
  :'<small>Era '+rom(v)+' de '+rom(ne-1)+'</small><b class="lil">'+esc(eraName(v))+'</b><span class="lil">Senhor: '+esc(bossName(v))+'</span>'; }
const wipeBg=v=>'url('+bgDir(artEra(v))+'sky.webp)';

/* ================= desenho da tela ================= */
function parallax(){ const g=X.geo, tr=el('m2_trail'); if(!g||!tr) return; const st=clamp(+tr.scrollTop||0,0,g.M), fr=g.M>0?(g.M-st)/g.M:0; X.st=st;
  for(const p of LY){ const e=el(p[0]); if(e&&e.style) e.style.transform='translate3d(0,'+(PF[p[1]]*g.Mp*fr).toFixed(1)+'px,0)'; }
  /* rolou até o topo com o Senhor vencido: o portão leva à era seguinte (igual ao protótipo) */
  if(X.user&&st<=2&&gateReady()){ clearTimeout(X.gt); X.gt=setTimeout(()=>{ const t2=el('m2_trail'); if(isOn()&&X.user&&t2&&(+t2.scrollTop||0)<=2&&gateReady()) eraTrans(X.view+1); },700); } }
function bind(tr){ try{ if(typeof tr.addEventListener!=='function') return; tr.addEventListener('scroll',parallax,{passive:true});
    for(const ev of ['wheel','touchstart','pointerdown']) tr.addEventListener(ev,()=>{ X.user=true; },{passive:true}); }catch(e){} }
function scrollGo(tr,g,o){ const to=targetOf(g,o.to); X.user=false;
  if(o.jump||reduced()||typeof tr.scrollTo!=='function'){ tr.scrollTop=to; return; }
  if(o.from==='bottom') tr.scrollTop=g.M; else if(o.keep!=null) tr.scrollTop=o.keep;
  try{ tr.scrollTo({top:to,behavior:'smooth'}); }catch(e){ tr.scrollTop=to; } }
function fixState(){ const ne=NE(), n=PER(); X.view=clamp(Math.floor(num(X.view)),0,ne); const a=block(X.view); if(!(X.sel>=a&&X.sel<a+n)) X.sel=defSel(X.view); if(lockedV(X.view)) X.chest=0; }
function draw(){
  const g=X.geo=geo();
  if(!NE()){ V.innerHTML=(typeof xWrap==='function'?xWrap(g.d,'',emptyHtml('Mapa das Eras indisponível agora.')):emptyHtml('Mapa das Eras indisponível agora.')); X.sig='x'; return; }
  fixState();
  const v=X.view, t0=el('m2_trail'), keep=t0?(+t0.scrollTop||0):null, here=heroHere(), a=block(v), hi=clamp(stageNow()-a,0,g.n-1);
  const alt=heroName()+' na fase atual, com a arma na mão e o pet na frente';
  const w=X.wipe;
  V.innerHTML=xWrap(g.d,'','<div class="m2'+(X.anim?' m2-in':'')+'">'+sceneHtml(g,v)
    +'<div class="m2-trail" id="m2_trail" aria-label="Trilha das fases: role para cima até o topo"><div class="m2-track" id="m2_track" style="height:'+(g.TH+g.pad)+'px">'
      +'<svg class="m2-path" width="'+g.W+'" height="'+g.TH+'" viewBox="0 0 '+g.W+' '+g.TH+'" aria-hidden="true">'+segsHtml(g,v)+'</svg>'
      +'<div id="m2_top">'+topHtml(g,v)+'</div><div id="m2_nodes">'+nodesHtml(g,v)+'</div>'
      +(here?'<canvas class="m2-hc" id="m2_hc" role="img" aria-label="'+esc(alt)+'" style="left:'+(g.xs(hi)-HC_X)+'px;top:'+(g.ny(hi)-14-HC_GY)+'px"></canvas>':'')
    +'</div></div>'
    +'<div class="m2-front" aria-hidden="true"><div class="m2-ly" id="m2_lfront" style="'+lyStyle(g,'front')+'">'+frontSvg(g,v)+'</div></div>'
    +'<canvas class="m2-fx" id="m2_fx" aria-hidden="true"></canvas>'
    +'<div class="m2-ersw"><div class="m2-er"><button class="m2-arr'+(v<=0?' off':'')+'" data-x="era" data-d="-1" aria-label="Era anterior" aria-disabled="'+(v<=0)+'">'+SV.prev+'</button>'
      +'<div class="m2-ern" id="m2_ern" aria-live="polite">'+ernHtml(v)+'</div>'
      +'<button class="m2-arr'+(v>=NE()?' off':'')+'" data-x="era" data-d="1" aria-label="Próxima era" aria-disabled="'+(v>=NE())+'">'+SV.next+'</button></div>'
      +'<div class="m2-dots" id="m2_dots" aria-hidden="true">'+dotsHtml(v)+'</div></div>'
    +'<div class="m2-card'+((lockedV(v)||stOf(X.sel)==='lock')?' lk':'')+'" id="m2_card" aria-live="polite">'+cardHtml(v)+'</div>'
    +'<div id="m2_toast">'+(X.toast&&now()-X.toastT<2400?toastHtml(X.toast):'')+'</div>'
    +'<div id="m2_pop">'+popHtml(v)+'</div>'
    +'<div class="'+(w?w.cls:'m2-wipe')+'" id="m2_wipe" aria-hidden="true"'+(w?' style="background-image:'+wipeBg(w.v)+'"':'')+'>'+(w?wipeInner(w.v):'')+'</div></div>');
  const tr=el('m2_trail'); fit(g);
  /* a tela mudou de tamanho (ou o cartão mudou de altura) sem o jogador ter rolado à mão: volta a pôr a fase escolhida à vista, acima do cartão */
  const gk=g.W+'|'+g.H+'|'+g.free; if(tr&&!X.scroll&&keep!=null&&!X.user&&X.gk&&X.gk!==gk) X.scroll={to:X.sel,jump:true}; X.gk=gk;
  if(tr){ bind(tr); if(X.scroll){ if(X.scroll.keep===undefined&&keep!=null&&!X.scroll.from) X.scroll.keep=keep; scrollGo(tr,g,X.scroll); } else if(keep!=null) tr.scrollTop=keep; }
  X.scroll=null; parallax(); X.anim=false; X.swap=false; X.sig=sig(); loopStart();
}
/* redesenho leve: troca só os pedaços que mudam (nós, cartão, faixa da era, janela do baú), sem recriar o cenário; sem os elementos, desenha tudo */
function soft(scrollTo){ const g=X.geo, a=el('m2_nodes'), b=el('m2_card'), c=el('m2_ern'), d=el('m2_dots'), p=el('m2_pop'), tr=el('m2_trail');
  if(!g||!a||!b||!c||!d||!p||!tr){ if(scrollTo!=null) X.scroll={to:scrollTo}; redraw(); return; }
  fixState(); const v=X.view; a.innerHTML=nodesHtml(g,v); b.innerHTML=cardHtml(v); try{ b.className='m2-card'+((lockedV(v)||stOf(X.sel)==='lock')?' lk':''); }catch(e){}
  c.innerHTML=ernHtml(v); d.innerHTML=dotsHtml(v); p.innerHTML=popHtml(v); X.sig=sig(); fit(g);
  if(scrollTo!=null) scrollGo(tr,g,{to:scrollTo}); }
/* o que muda por fora (fase vencida, FC, baú pronto): o tick redesenha só quando muda */
function sig(){ if(!NE()) return 'x'; try{ return [stageNow(),Math.round(num(myFC())),readyCount(),heroId(),MC()?1:0,eeOn()?1:0].join('|'); }catch(e){ return ''; } }

/* ================= ações ================= */
function later(fn,ms){ const id=setTimeout(fn,ms); X.tm.push(id); return id; }
function stopTimers(){ for(const id of X.tm){ try{ clearTimeout(id); }catch(e){} } X.tm=[]; try{ clearTimeout(X.gt); }catch(e){} X.gt=0; X.trans=0; X.wipe=null; }
function setView(v,anim){ X.view=clamp(v,0,NE()); X.sel=defSel(X.view); X.chest=0; X.swap=!!anim; fxReset(); X.scroll={to:X.sel,from:'bottom'}; redraw(); }
function putWipe(){ const w=el('m2_wipe'), o=X.wipe; if(!w) return; try{ w.className=o?o.cls:'m2-wipe'; if(o){ if(w.style) w.style.backgroundImage=wipeBg(o.v); w.innerHTML=wipeInner(o.v); } else w.innerHTML=''; }catch(e){} }
/* transição entre eras: a cortina de luz sai do portão, o cenário troca por baixo e a cortina some (sem a cortina na tela, ou com movimento reduzido, troca direto) */
function eraTrans(v){ if(X.trans) return; v=clamp(v,0,NE()); try{ clearTimeout(X.gt); }catch(e){} sfx('claim');
  if(!el('m2_wipe')||reduced()){ setView(v,true); return; }
  X.trans=1; X.wipe={v:v,cls:'m2-wipe'}; putWipe();
  later(()=>{ if(!X.wipe) return; X.wipe.cls='m2-wipe in'; putWipe();
    later(()=>{ if(!X.wipe) return; setView(v,false);
      later(()=>{ if(!X.wipe) return; X.wipe.cls='m2-wipe in out'; putWipe();
        later(()=>{ X.wipe=null; X.trans=0; putWipe(); },600); },60); },900); },60); }
/* "Lutar": a mesma rota do js/p_map.js (fecha a tela e volta para a Batalha, que já está na fase atual) */
function fight(){ if(X.view!==curView()||X.sel!==stageNow()) return; sfx('claim');
  try{ if(window.Screens&&Screens.close) Screens.close(); const h=host(); if(h&&h.goTab) h.goTab('battle'); }catch(e){ try{ console.error('mapa: batalha',e); }catch(e2){} } }
/* coleta do baú: UMA chamada ao Sys.mapChest.claim (ele marca, credita e não deixa repetir); a tela mostra o que ele devolveu */
function claim(s){ if(!X.chest||X.chest!==s) return; X.chest=0; const m=MC();
  if(!m){ sfx('ui_tap'); say('Baús indisponíveis agora'); soft(); return; }
  let r=null; try{ r=m.claim(S,host(),s); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='collected'?'Este baú já foi coletado':r&&r.reason==='closed'?'Vença a fase '+nT(s)+' para abrir este baú':'Não foi possível coletar agora'); soft(); return; }
  call(typeof statsChanged==='function'?statsChanged:typeof save==='function'?save:null); sfx('claim');
  const rows=rewardRows(r).map(q=>q[1]); say('Baú coletado'+(rows.length?': '+rows.join(' + '):'')); soft(); }
function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||'';
  if(a==='back'){ sfx('ui_tap'); try{ if(window.Screens&&Screens.close) Screens.close(); }catch(e){} return; }
  if(X.trans||!NE()) return;                              /* durante a troca de era o resto espera */
  if(a==='cclose'){ sfx('ui_tap'); X.chest=0; soft(); return; }
  if(a==='claim'){ claim(Math.floor(+ds.s)||X.chest); return; }
  if(X.chest) return;                                     /* janela do baú aberta: só as ações dela */
  if(a==='era'){ const v=X.view+((+ds.d)<0?-1:1); if(v<0||v>NE()) return; sfx('ui_tap'); setView(v,true); return; }
  if(a==='st'){ const s=Math.floor(+ds.s), a0=block(X.view); if(!(s>=a0&&s<a0+PER())) return; sfx('ui_tap'); X.sel=s; soft(s); return; }
  if(a==='chest'){ const s=Math.floor(+ds.s); if(!chestAt(X.view,s)) return; sfx('ui_tap'); X.chest=s; soft(); return; }
  if(a==='gate'){ if(gateReady()) eraTrans(X.view+1); return; }
  if(a==='fight'){ fight(); return; }
  if(a==='cur'){ sfx('ui_tap'); if(X.view!==curView()) setView(curView(),true); else { X.sel=stageNow(); soft(X.sel); } return; }
}
/* imagens que a tela mostra agora (só as da era à vista), para a espera de carga do jogo */
function urls(){ const u=[]; if(!NE()) return u; const v=clamp(Math.floor(num(X.view)),0,NE()), e=artEra(v), d=bgDir(e), add=q=>{ if(u.indexOf(q)<0) u.push(q); };
  add(d+'sky.webp'); add(d+'far.webp'); add(d+'ground.webp'); add(bossUrl(e));
  try{ if(v<NE()&&eraWon(v)) add(bgDir(artEra(v+1))+'sky.webp'); if(chestsOf(v).length){ add(IC.chest); add(IC.coin); add(IC.gem); add(IC.forge); }
    if(v<NE()&&(stonesTxt('eraBoss')||stonesTxt('boss'))) add(IC.forge); }catch(x){}
  return u; }

/* título curto: o cabeçalho do jogo corta com reticências o que não cabe em 320 px ao lado das moedas ("Mapa das Eras" virava "Mapa das E" cortado) */
const def=Panels.add(N,{title:'Mapa',actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.trans) return; if(X.toast&&now()-X.toastT>2400){ X.toast=''; const t=el('m2_toast'); if(t) t.innerHTML=''; }
    if(X.chest) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return !!X.trans; },
  /* o: {era: índice da era para abrir nela} (opcional). Sem ele, abre na era e na fase atuais */
  onOpen(o){ stopTimers(); loopStop(); fxReset(); X.chest=0; X.toast=''; X.anim=true; X.swap=false; X.sig=''; X.tk=0; X.herr=0; X.user=false; X.gk='';
    X.view=(o&&Number.isInteger(o.era))?clamp(o.era,0,NE()):curView(); X.sel=defSel(X.view); X.scroll={to:X.sel,from:'bottom'}; },
  onClose(){ stopTimers(); loopStop(); X.chest=0; X.toast=''; X.P=[]; } });
/* para o teste de fumaça, o console e o botão do mapa: estado da tela e a conta dos baús prontos (o "!" do botão) */
window.Map2={X:X,actions:ACTIONS,def:def,urls:urls,IC:IC,ready:()=>Math.max(0,readyCount())};
})();
