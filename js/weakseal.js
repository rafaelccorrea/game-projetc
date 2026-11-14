'use strict';
/* ================= SELO "FRACO CONTRA" (afinidade das eras) — arquivo novo, escopo próprio, só aparece com a chave do módulo ligada =================
   Protótipo aprovado: docs/proto/v2/Pequenos3.html, SEÇÃO 1 (só ela). Regra: js/sys/affinity.js (Sys.affinity). NENHUMA regra nem número aqui:
   - tom (verde / vermelho / cinza), estilo do herói, estilo fraco e o que resiste, nome da era, frase "Fraco contra: X" e a dica: Sys.affinity.warn(S, Sys.host, fase);
   - os percentuais mostrados (+15% / −10%): Sys.affinity.DATA.weak e DATA.resist.
   Com Sys.affinity.DATA.on desligado (ou sem o módulo): html() devolve '', draw() não desenha e devolve null, update() esconde o selo.
   O multiplicador no dano (Sys.affinity.mult) NÃO é deste arquivo: aqui é só o selo.
   ONDE FICA (protótipo): logo abaixo da barra da fase da batalha, x 82 a 318, y 122 (base 390x844 do #fb_w do js/fullbattle.js), à esquerda do Desafiar.
   Tocar no selo abre/fecha a explicação curta, que desce abaixo do selo (céu da batalha: não cobre o herói nem botão).
   API (window.WeakSeal):
   - on()                      → a chave do módulo está ligada?
   - info(fase?)               → {tone, txt, head, general, aria} ou null (fase = número da fase, {era} ou nada = S.stage)
   - html(fase?)               → HTML do selo para telas DOM (cartão da fase etc.); toque: WeakSeal.click(elemento com data-ws)
   - mount(host?) / update()   → selo posicionado na batalha (host padrão: #fb_w); update() no fbTick; unmount() tira
   - draw(ctx, x, y, enemy, o) → o mesmo selo em canvas (x = centro, y = topo; enemy.stage ou o.stage ou S.stage; o.scale); devolve {x,y,w,h,tone,text}
   Sem imagem: os 3 ícones são desenhados no código. */
(function(){
const ST={tip:false,root:null,css:false,sig:'',t:0,era:-1};
const POS={left:82,top:122,width:236};   /* base 390x844 (protótipo) */
const AF=()=>(window.Sys&&window.Sys.affinity)||null;
const on=()=>{ const A=AF(); return !!(A&&A.DATA&&A.DATA.on===true&&typeof A.warn==='function'); };
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const pct=v=>(v>0?'+':'−')+Math.round(Math.abs(+v||0)*100)+'%';
const save=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const host=()=>(window.Sys&&window.Sys.host)||null;
/* a fase que o selo mostra: a pedida, senão a do jogo. Número de fase vira {era} pela conta do próprio jogo (eraOf do index.html), para o selo
   falar da mesma era que a batalha desenha; sem ela, o módulo faz a conta dele (10 fases por era). */
function stageArg(stage){ if(stage&&typeof stage==='object') return stage; let n=+stage; if(!(n>=1)){ const s=save(); n=s&&s.stage>=1?s.stage:1; }
  try{ if(typeof eraOf==='function'){ const e=eraOf(n); if(Number.isInteger(e)&&e>=0) return {era:e}; } }catch(e){} return n; }

function info(stage){ if(!on()) return null; const A=AF(); let w=null; try{ w=A.warn(save(),host(),stageArg(stage)); }catch(e){ w=null; }
  if(!w||w.on!==true||!w.weakAgainst) return null;
  const up=pct(A.DATA.weak), dn=pct(A.DATA.resist), tone=w.tone==='good'||w.tone==='bad'?w.tone:'neutral';
  const txt=tone==='good'?'Forte contra: '+w.eraName+' · '+up:tone==='bad'?'Resistem a: '+w.mine+' · '+dn:(w.text||'Fraco contra: '+w.weakAgainst);
  const head=tone==='neutral'?esc(w.eraName)+' é fraca contra <b>'+esc(w.weakAgainst)+'</b>.'+(w.mine?' Seu estilo (<b>'+esc(w.mine)+'</b>) dá dano normal aqui.':'')
    :'<b>'+esc(w.tip)+'.</b>';
  const general='Cada era é fraca contra um estilo ('+up+') e pode resistir a outro ('+dn+'). Nenhuma era resiste à arma que cai nela.';
  return {tone,txt,head,general,era:w.era,aria:txt+'. Toque para ver a explicação'}; }

const IC={good:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2l4 5H7.5v3h-3V7H2z" fill="#0b2a16"/></svg>',
  bad:'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 10L2 5h2.5V2h3v3H10z" fill="#3a0b0b"/></svg>',
  neutral:'<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="5" y="5" width="2" height="5" fill="#261e17"/><rect x="5" y="2" width="2" height="2" fill="#261e17"/></svg>'};
const CSS=`.wsl-w{position:relative;display:inline-block;max-width:100%;font-family:Nunito,system-ui,sans-serif}
.wsl,.xs .wsl{position:relative;max-width:100%;min-height:24px;display:inline-flex;align-items:center;gap:5px;padding:2px 10px 2px 4px;border-radius:12px;border:2px solid;font:900 11.5px/1.15 Nunito,system-ui,sans-serif;text-align:left;white-space:normal;overflow-wrap:anywhere;box-shadow:0 2px 0 rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.wsl::before{content:'';position:absolute;left:-4px;right:-4px;top:-4px;bottom:-14px}
.wsl .wsl-ic{width:16px;height:16px;border-radius:50%;display:grid;place-items:center;flex:none}
.wsl .wsl-ic svg{width:12px;height:12px;display:block}
.wsl.good,.xs .wsl.good{background:linear-gradient(180deg,#1f5a32,#143d22);border-color:#5ef0a0;color:#d9ffe6}
.wsl.good .wsl-ic{background:#5ef0a0}
.wsl.bad,.xs .wsl.bad{background:linear-gradient(180deg,#6a1f22,#4a1416);border-color:#ff7b7b;color:#ffe0e0}
.wsl.bad .wsl-ic{background:#ff7b7b}
.wsl.neutral,.xs .wsl.neutral{background:linear-gradient(180deg,#3a3026,#261e17);border-color:#a8977f;color:#efe3d0}
.wsl.neutral .wsl-ic{background:#a8977f}
.wsl-tip{position:absolute;left:0;top:calc(100% + 6px);width:236px;max-width:calc(100vw - 24px);padding:9px 11px;border-radius:14px;background:rgba(26,18,12,.96);border:2px solid #ffc94a;color:#f6ecdf;font:800 11.5px/1.35 Nunito,system-ui,sans-serif;text-align:left;z-index:20;box-sizing:border-box;cursor:pointer;overflow-wrap:anywhere}
.wsl-tip b{color:#ffc94a}
.wsl-tip p{margin:0 0 5px}
.wsl-tip .wsl-x{display:block;margin-top:4px;font-size:10.5px;color:#c9b8a2}
.wsl-tip::before{content:'';position:absolute;left:22px;top:-8px;border:7px solid transparent;border-top:0;border-bottom-color:#ffc94a}
#wsl_root{position:absolute;z-index:6}`;
function inject(){ if(ST.css) return; try{ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.id='wsl_css'; el.textContent=CSS; document.head.appendChild(el); ST.css=true; }catch(e){} }

/* HTML do selo (telas DOM). '' com a chave desligada. */
function html(stage){ const I=info(stage); if(!I) return ''; inject();
  const tip=ST.tip?'<div class="wsl-tip" role="status" data-ws="tip"><p>'+I.head+'</p><p>'+esc(I.general)+'</p><span class="wsl-x">Toque no selo para fechar</span></div>':'';
  return '<span class="wsl-w"><button type="button" class="wsl '+I.tone+'" data-ws="tip" aria-expanded="'+(ST.tip?'true':'false')+'" aria-label="'+esc(I.aria)+'"><span class="wsl-ic">'+IC[I.tone]+'</span><span>'+esc(I.txt)+'</span></button>'+tip+'</span>'; }
/* toque num elemento com data-ws (o selo ou a explicação): abre/fecha. Devolve true quando tratou. */
function click(b){ const a=b&&b.dataset?b.dataset.ws:''; if(a!=='tip') return false; ST.tip=!ST.tip; try{ if(typeof snd==='function') snd('ui_tap'); }catch(e){} update(true); return true; }

/* ---------- selo posicionado na batalha ---------- */
function mount(hostEl){ if(ST.root) return true; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='wsl_root'; r.style.left=POS.left+'px'; r.style.top=POS.top+'px'; r.style.width=POS.width+'px'; r.style.display='none';
    if(r.addEventListener) r.addEventListener('click',ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-ws]'):null; if(b) click(b); });
    h.appendChild(r); ST.root=r; ST.sig=''; ST.t=0; update(true); return true; }catch(e){ return false; } }
function unmount(){ const r=ST.root; ST.root=null; ST.sig=''; ST.tip=false; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
/* chamar no fbTick: refaz o HTML só quando o texto muda (no máximo 2 leituras do módulo por segundo; force = agora) */
function update(force){ const r=ST.root; if(!r) return false; { const tp=(POS.top+(typeof window!=='undefined'?(window.DFH_EXTRA|0):0))+'px'; if(r.style.top!==tp) r.style.top=tp; }   /* desce quando o chip "FC recomendada" está em alerta (maior) */
  const now=Date.now(); if(!force&&now-ST.t<500) return r.style.display!=='none'; ST.t=now;
  const I=info(); if(!I){ ST.tip=false; if(ST.sig!=='off'){ ST.sig='off'; r.innerHTML=''; r.style.display='none'; } return false; }
  if(I.era!==ST.era){ ST.era=I.era; ST.tip=false; }   /* mudou de era: a explicação aberta era da outra */
  const sig=I.tone+'|'+I.txt+'|'+(ST.tip?1:0); if(sig!==ST.sig){ ST.sig=sig; r.innerHTML=html(); r.style.display=''; } return true; }

/* ---------- o mesmo selo em canvas ---------- */
const COL={good:{a:'#1f5a32',b:'#5ef0a0',t:'#d9ffe6',i:'#0b2a16'},bad:{a:'#6a1f22',b:'#ff7b7b',t:'#ffe0e0',i:'#3a0b0b'},neutral:{a:'#3a3026',b:'#a8977f',t:'#efe3d0',i:'#261e17'}};
function draw(c,x,y,enemy,o){ o=o||{}; if(!c) return null; const I=info(enemy&&enemy.stage!=null?enemy.stage:o.stage); if(!I) return null;
  const k=o.scale>0?o.scale:1, fs=11.5*k, h=24*k, r=h/2, ic=8*k, K=COL[I.tone]; let out=null;
  c.save();
  try{ c.font='900 '+fs.toFixed(1)+'px Nunito,sans-serif'; const m=c.measureText(I.txt), tw=(m&&m.width>0)?m.width:I.txt.length*fs*0.56, w=4*k+ic*2+5*k+tw+10*k, x0=(+x||0)-w/2, y0=+y||0;
    c.beginPath(); c.moveTo(x0+r,y0); c.lineTo(x0+w-r,y0); c.arc(x0+w-r,y0+r,r,-Math.PI/2,Math.PI/2); c.lineTo(x0+r,y0+h); c.arc(x0+r,y0+r,r,Math.PI/2,Math.PI*1.5); c.closePath();
    c.fillStyle=K.a; c.fill(); c.lineWidth=2*k; c.strokeStyle=K.b; c.stroke();
    const cx=x0+4*k+ic, cy=y0+r; c.beginPath(); c.arc(cx,cy,ic,0,Math.PI*2); c.fillStyle=K.b; c.fill();
    c.fillStyle=K.i; c.beginPath(); const u=k;
    if(I.tone==='good'){ c.moveTo(cx,cy-4*u); c.lineTo(cx+4*u,cy+1*u); c.lineTo(cx+1.5*u,cy+1*u); c.lineTo(cx+1.5*u,cy+4*u); c.lineTo(cx-1.5*u,cy+4*u); c.lineTo(cx-1.5*u,cy+1*u); c.lineTo(cx-4*u,cy+1*u); }
    else if(I.tone==='bad'){ c.moveTo(cx,cy+4*u); c.lineTo(cx-4*u,cy-1*u); c.lineTo(cx-1.5*u,cy-1*u); c.lineTo(cx-1.5*u,cy-4*u); c.lineTo(cx+1.5*u,cy-4*u); c.lineTo(cx+1.5*u,cy-1*u); c.lineTo(cx+4*u,cy-1*u); }
    else { c.rect(cx-1*u,cy-1*u,2*u,5*u); c.rect(cx-1*u,cy-4*u,2*u,2*u); }
    c.closePath(); c.fill();
    c.fillStyle=K.t; c.textAlign='left'; c.textBaseline='middle'; c.fillText(I.txt,x0+4*k+ic*2+5*k,y0+r+0.5*k);
    out={x:x0,y:y0,w:w,h:h,tone:I.tone,text:I.txt}; }catch(e){ out=null; }
  c.restore(); return out; }

window.WeakSeal={on:on,info:info,html:html,click:click,mount:mount,update:update,unmount:unmount,draw:draw,state:ST,POS:POS};
})();
