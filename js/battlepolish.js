'use strict';
/* ================= POLIMENTO DA BATALHA (docs/LOM_VS_EONBOUND.md, itens B3 e B4; item 6 da lista de prioridade) — arquivo novo, escopo próprio =================
   ATRÁS DE CHAVE DESLIGADA: SYS_LIVE.battlePolish (js/farm.js) nasce false. Com ela desligada este arquivo não cria elemento, estilo nem ouvinte, e os três
   ganchos devolvem exatamente o que o jogo já fazia. Para conferir: ?debug=1&com=battlePolish (a mesma regra do sysLive: "com" liga em debug o que está false,
   "sem" desliga). Este arquivo NÃO mora no Sys: a chave é lida aqui (on()), porque o sysLive só liga módulos do js/sys.
   O QUE FAZ, com a chave ligada:
   - "+N" NO NÚMERO DE PODER (B3): quando a FC do cabeçalho sobe, um "+N" verde salta por cima do selo "FC" do retrato e o selo dá um pulo. Subidas seguidas
     (dentro de 1,3 s) SOMAM no mesmo aviso. Queda de FC não mostra nada aqui (o aviso grande do index.html, fcNotice, continua igual e é de outro arquivo).
     Não avisa nos primeiros 4 s (carga do jogo), na troca de save nem na entrada/saída de instância (a Provação muda o teto: não é ganho do jogador).
     Um elemento só, criado uma vez e reaproveitado; a animação é CSS (transform e opacidade), sem laço próprio. Com "reduzir movimento" o aviso só aparece e some.
   - ONDAS SEM BURACO (B4): entre ondas COMUNS a pausa cai de WAVE_GAP (0,3 s) para CFG.waveGap, o herói não espera o resto do "segura" para voltar a correr
     e o PRIMEIRO inimigo da onda nasce a CFG.entry px da borda direita (em vez dos 110 de sempre). A entrada do chefe, a fase nova e as instâncias NÃO mudam.
     ATENÇÃO (Sistemas): onda mais rápida = um pouco mais de abates por minuto; os dois números de CFG são provisórios e precisam do aval dela.
   - BRASA VOANDO ATÉ A FOGUEIRA (B2): JÁ EXISTE e já está ligada (js/fogueira.js: Fogueira.onKill, chamado no js/farm.js a cada abate que conta para o pote;
     o arco do pote e o selo de Brasas enchem à vista). Nada foi duplicado aqui.
   GANCHOS (uma linha cada): js/battle.js waveClear → bpWaveGap(WAVE_GAP) · js/battle.js step (nascimento) → bpSpawn(e) · js/fullbattle.js fbTick → BattlePolish.fc(FCV).
   Teste: node test/paineis/battlepolish.smoke.js */
(function(){
const KEY='battlePolish';
/* NÚMEROS PROVISÓRIOS (só ritmo de tela; a Sistemas confirma): waveGap = segundos entre o fim de uma onda comum e o primeiro nascimento da próxima;
   entry = distância da borda direita, em px lógicos do canvas, em que o primeiro inimigo da onda nasce; fcArmMs = silêncio depois de armar; fcShowMs = duração do "+N". */
const CFG={waveGap:0.05,entry:70,fcArmMs:4000,fcShowMs:1300};
let ON=null;
function on(){ if(ON!==null) return ON; let v=false, known=false;
  try{ if(typeof SYS_LIVE!=='undefined'&&SYS_LIVE){ known=true; v=SYS_LIVE[KEY]===true; } }catch(e){}
  try{ if(typeof DEBUG!=='undefined'&&DEBUG&&typeof location!=='undefined'){ const q=String(location.search||''), c=/[?&]com=([\w,]+)/.exec(q), s=/[?&]sem=([\w,]+)/.exec(q);
      if(known&&SYS_LIVE[KEY]===false&&c&&c[1].split(',').indexOf(KEY)>=0) v=true;   /* só liga por "com" o que está na tabela com false (regra do sysLive) */
      if(s&&s[1].split(',').indexOf(KEY)>=0) v=false; } }catch(e){}
  if(known) ON=v; return v; }
function setOn(v){ ON=v==null?null:!!v; return ON; }   /* teste e console; null = ler a chave de novo */

/* ---------- B4: ondas sem buraco ---------- */
function waveGap(def){ if(!on()) return def; try{ if(typeof B!=='undefined'&&B&&!B.inst) B.holdT=0; }catch(e){} return Math.min(+def||0,CFG.waveGap); }
function spawn(e){ if(!on()||!e||e.boss) return false;
  try{ if(typeof B==='undefined'||!B||B.inst||B.en.length!==1||B.en[0]!==e) return false;   /* só o primeiro da onda, com o palco vazio */
    if(typeof S!=='undefined'&&S&&S.wave===5) return false;   /* onda do chefe: a entrada é a de sempre */
    const x=LW+CFG.entry; if(e.x>x){ e.x=x; return true; } }catch(er){} return false; }

/* ---------- B3: "+N" no número de poder ---------- */
const F={last:null,s:null,inst:false,arm:0,acc:0,until:0,el:null,css:false,shown:''};
const CSS=`#bp_fc{position:absolute;left:0;top:60px;width:80px;z-index:8;pointer-events:none;text-align:center;font:400 15px/1 'Lilita One',Nunito,system-ui,sans-serif;color:#7fe07a;text-shadow:0 2px 0 #0d2410,0 0 6px #000;white-space:nowrap;opacity:0}
#bp_fc.go{animation:bpfc 1.3s ease-out both}
#fb_fc.bp-up{animation:bpchip .45s ease-out}
@keyframes bpfc{0%{opacity:0;transform:translateY(8px) scale(.8)}14%{opacity:1;transform:translateY(0) scale(1.18)}28%{transform:translateY(0) scale(1)}78%{opacity:1;transform:translateY(-6px)}100%{opacity:0;transform:translateY(-16px)}}
@keyframes bpchip{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes bpfcr{0%,100%{opacity:0}12%,80%{opacity:1}}
@media (prefers-reduced-motion:reduce){#bp_fc.go{animation:bpfcr 1.3s linear both}#fb_fc.bp-up{animation:none}}`;
function txt(n){ n=Math.max(0,Math.round(+n||0)); try{ if(typeof fcShow==='function') return String(fcShow(n)); if(typeof fmt==='function') return String(fmt(n)); }catch(e){} return String(n); }
function ensure(){ try{ if(typeof document==='undefined') return null; const host=document.getElementById('fb_w'); if(!host) return null;
    if(F.el&&F.el.parentNode===host) return F.el;
    if(!F.css&&document.head){ const st=document.createElement('style'); st.id='bp_css'; st.textContent=CSS; document.head.appendChild(st); F.css=true; }
    const el=document.createElement('div'); el.id='bp_fc'; el.setAttribute('aria-hidden','true'); host.appendChild(el); F.el=el; return el; }catch(e){ return null; } }
function restart(el,cls){ try{ if(!el||!el.classList) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }catch(e){} }
function show(t){ const el=ensure(); if(!el) return false; F.shown=t; el.textContent=t; restart(el,'go'); try{ restart(document.getElementById('fb_fc'),'bp-up'); }catch(e){} return true; }
/* chamar no fbTick com a FC já calculada (não calcula nada). Devolve true quando mostrou o "+N" */
function fc(v){ if(!on()) return false; v=+v; if(!isFinite(v)) return false; const now=Date.now(); let s=null, inst=false;
  try{ s=typeof S!=='undefined'?S:null; inst=typeof B!=='undefined'&&!!(B&&B.inst); }catch(e){}
  if(F.last===null||F.s!==s||F.inst!==inst){ const first=F.last===null; F.last=v; F.s=s; F.inst=inst; F.acc=0; F.until=0; F.arm=now+(first?CFG.fcArmMs:1000); return false; }
  const d=v-F.last; F.last=v; if(now<F.arm||!(d>=1)) return false;
  F.acc=(now<F.until?F.acc:0)+d; F.until=now+CFG.fcShowMs; return show('+'+txt(F.acc)); }

const W=typeof window!=='undefined'?window:globalThis;
W.bpWaveGap=waveGap; W.bpSpawn=spawn;
W.BattlePolish={KEY:KEY,on:on,setOn:setOn,fc:fc,waveGap:waveGap,spawn:spawn,CFG:CFG,state:F};
})();
