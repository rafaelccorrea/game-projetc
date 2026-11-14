'use strict';
/* ================= TELA LADRÃO DE BRASAS — NASCE DESLIGADA (PANEL_ON.thief = false) =================
   SEM PROTÓTIPO APROVADO em docs/proto/v2 (só a regra: docs/SISTEMA_MATRIZ.md "Fogueira P1 e Ladrão de Brasas" e js/sys/thief.js). Esta é a parte que é TELA:
   a entrada (entradas do dia, lote, Repetir) e o RESULTADO. A perseguição de 45 s é LUTA e não mora aqui (molde do js/p_inst.js):
   - "Entrar" chama Sys.thief.enter(S, host) UMA vez e entrega a corrida ao jogo por window.startThiefRun({lv, lote, secs}). REGRA ÚNICA COM O SERVIDOR:
     a entrada é GASTA AO ENTRAR e sair no meio NÃO devolve (a tela diz isso antes do toque). Se o jogo ainda não ligou essa função, o toque explica e
     NÃO chama o enter (nada é gasto). Se a função devolver false depois do enter, a corrida fica ABERTA (a entrada já gasta não se perde: Continuar).
   - No fim da perseguição a batalha chama window.PThief.finish(score) (score 0..1 = fração do saco que caiu): aqui roda Sys.thief.finish(S, host, {score})
     UMA vez (não gasta outra entrada), o save é gravado e esta tela abre com o resultado. Saiu no meio: window.PThief.cancel() (fecha a corrida; a entrada não volta).
   NENHUMA regra e NENHUM número aqui: entradas, segundos, lote, melhor nível e total vêm do Sys.thief.view; as Brasas entram pelo próprio módulo
   (Sys.bonfire.addBrasas(S,'thief',n)); o estoque e o teto vêm do Sys.bonfire.view.
   ESTADOS HONESTOS: sem o módulo ou com a chave desligada = aviso e Voltar (nada é lido nem gravado no save); Fogueira desligada = aviso e Voltar
   (sem a Fogueira as Brasas não entrariam e a entrada seria gasta à toa).
   O JOGO TEM MENORES: as entradas são grátis; não há entrada paga, anúncio, preço nem sorteio. "Repetir" gasta uma entrada do dia: pede DOIS toques.
   Avisos numa LINHA RESERVADA no topo (não cobre botão). Sem emoji, sem alert/confirm/prompt. O cabeçalho (Voltar, título, moedas) é do jogo.
   Abre por Panels.open('thief'). Para o Menu: window.PThief.alerts() = entradas que ainda sobram hoje. */
(function(){
const N='thief';
const TOAST_MS=3200, DAY=86400000;

/* ---------- leituras dos módulos ---------- */
const TH=()=>{ const T=window.Sys&&Sys.thief; return T&&T.DATA&&typeof T.view==='function'&&typeof T.enter==='function'&&typeof T.finish==='function'&&typeof T.sweep==='function'&&typeof T.cancel==='function'?T:null; };
const BF=()=>{ const B=window.Sys&&Sys.bonfire; return B&&B.DATA&&typeof B.addBrasas==='function'&&typeof B.view==='function'?B:null; };
const thOn=()=>{ try{ const T=TH(); return !!(T&&T.DATA.on===true); }catch(e){ return false; } };
const fireOn=()=>{ try{ const B=BF(); return !!(B&&B.DATA.on===true); }catch(e){ return false; } };
const host=()=>(window.Sys&&Sys.host)||null;
const sv=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const gameNow=()=>{ try{ const h=host(); if(h&&h.now) return h.now(); }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const saved=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const isN=v=>typeof v==='number'&&isFinite(v);
const num=v=>isN(v)?v:0;
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
const brasas=n=>nT(n)+(num(n)===1?' Brasa':' Brasas');
/* a leitura do módulo grava o dia no save (Sys.thief.view chama o today): só com as duas chaves ligadas */
const viewNow=()=>{ try{ if(!thOn()||!fireOn()) return null; const v=TH().view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const fireNow=()=>{ try{ if(!fireOn()) return null; return BF().view(sv(),host())||null; }catch(e){ return null; } };
/* as entradas voltam na virada do dia de BRASÍLIA (UTC-3), a mesma conta do Sys.thief.dayKey */
const resetMs=()=>{ const t=gameNow()-3*3600000; return DAY-(((t%DAY)+DAY)%DAY); };
const hm=ms=>{ const m=Math.max(1,Math.ceil(num(ms)/60000)), h=Math.floor(m/60); return h>0?h+' h '+(m%60)+' min':m+' min'; };

const WHY={off:'O Ladrão de Brasas ainda não foi ligado',entries:'Sem entradas hoje. Elas voltam à meia-noite de Brasília',run:'Há uma perseguição aberta: termine ou saia dela antes',
  none:'Vença uma perseguição inteira para liberar o Repetir'};
const why=r=>WHY[r]||'Não foi possível agora. Tente de novo';
/* LADRÃO ONLINE (docs/LIGACOES_RECOMPENSAS.md 2.1, N3): com o Sys.thiefNet INICIADO (state().started) quem decide é o servidor e os toques Entrar / fim / Repetir
   usam as Promises dele, que devolvem o mesmo formato do Sys.thief síncrono. Módulo ausente, desligado ou não iniciado = null = a tela segue no Sys.thief local.
   "Sair" continua no Sys.thief.cancel: a entrada do servidor já foi gasta no enter e não volta (o texto da tela já diz). */
const TN=()=>{ try{ const n=window.Sys&&Sys.thiefNet; return n&&typeof n.state==='function'&&n.state().started===true&&typeof n.enter==='function'&&typeof n.finish==='function'&&typeof n.sweep==='function'?n:null; }catch(e){ return null; } };
WHY.busy='Aguarde: o pedido anterior ainda está a caminho';
const waitT=ms=>num(ms)<60000?Math.max(1,Math.ceil(num(ms)/1000))+' s':hm(ms);
/* motivo de uma recusa do online: r.local é a palavra do WHY desta tela; retryAfterMs = quanto esperar (sem entradas, o texto já diz quando voltam) */
const whyR=r=>{ const k=r&&(r.local||r.reason), ms=num(r&&r.retryAfterMs); if(!WHY[k]) return ms>0?'Não foi possível agora. Tente de novo em '+waitT(ms):why(k);
  return WHY[k]+(ms>0&&k!=='entries'&&k!=='busy'?'. Tente de novo em '+waitT(ms):''); };

/* ---------- arte: ícones desenhados no código (a tela não usa PNG; o ladrão em si é da batalha e ainda não tem arte) ---------- */
const K='stroke="#1a110b" stroke-width="2.4" stroke-linejoin="round"';
const SV=(inner,z)=>'<svg class="th-ic" viewBox="0 0 48 48" width="'+(z||22)+'" height="'+(z||22)+'" aria-hidden="true">'+inner+'</svg>';
const I_BRASA='<path d="M24 3c3 8 13 12 13 25a13 13 0 01-26 0c0-7 3-10 6-13 1 5 3 7 6 7-2-7 0-13 1-19z" fill="#ff7a2a" '+K+'/><path d="M24 24c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 1 2 2 3 3 3-1-3 0-5 0-8z" fill="#ffe07a"/>';
const I_SACK='<path d="M17 13c-9 7-12 15-12 22 0 6 5 9 19 9s19-3 19-9c0-7-3-15-12-22z" fill="#c98a4b" '+K+'/><path d="M16 13l-3-8 7 3 4-4 4 4 7-3-3 8z" fill="#e8b46a" '+K+'/><path d="M17 13h14" stroke="#1a110b" stroke-width="3.4" stroke-linecap="round"/><path d="M24 22c2 3 5 4 5 8a5 5 0 01-10 0c0-2 1-4 3-5 0 2 1 3 2 3-1-2-1-4 0-6z" fill="#ff7a2a" stroke="#1a110b" stroke-width="1.6" stroke-linejoin="round"/>';
const I_CLOCK='<circle cx="24" cy="26" r="17" fill="#f6ecdf" '+K+'/><path d="M24 15v11l7 5" fill="none" stroke="#1a110b" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M19 4h10" stroke="#1a110b" stroke-width="4" stroke-linecap="round"/>';
const I_AGAIN='<path d="M38 24a14 14 0 11-5-10.7" fill="none" stroke="#0d2410" stroke-width="5" stroke-linecap="round"/><path d="M34 4v11H23" fill="none" stroke="#0d2410" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
const I_INFO='<circle cx="24" cy="24" r="18" fill="none" stroke="#7fe07a" stroke-width="4"/><path d="M24 22v12M24 14v1" stroke="#7fe07a" stroke-width="5" stroke-linecap="round"/>';

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.th{--g2:#ffc94a;--cream:#f6ecdf;--mut:#c9b8a2;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:#16110d;color:var(--cream);font-family:Nunito,system-ui,sans-serif}
.th *{box-sizing:border-box}
.th button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.th .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.th-ic{display:block;flex:none}
.th-bg{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none}
.th-in{animation:th-fade .2s ease-out}
@keyframes th-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.th-strip{position:relative;z-index:2;flex:none;min-height:44px;margin:8px 12px 0;padding:5px 10px;border-radius:12px;background:rgba(127,224,122,.12);border:1px solid rgba(127,224,122,.45);display:flex;align-items:center;justify-content:center;min-width:0}
.th-st{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;font-size:11.5px;font-weight:900;line-height:1.3;text-align:center;overflow-wrap:anywhere}
.th-st span{min-width:0;overflow-wrap:anywhere}
.th-st.bad{color:#ffd0c6}
.th-st.ok{color:#d9ffd4}
.th-conf{position:relative;z-index:2;flex:none;margin:8px 12px 0;padding:11px 11px 10px;border-radius:16px;background:rgba(42,30,20,.98);border:2px solid var(--g2);min-width:0}
.th-conf b{display:block;font-size:19px;line-height:1.15;color:#fff;text-align:center;overflow-wrap:anywhere}
.th-conf p{margin:6px 0 9px;font-size:12.5px;font-weight:800;line-height:1.4;text-align:center;overflow-wrap:anywhere}
.th-conf p em,.th-card p em{font-style:normal;color:var(--g2)}
.th-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.th-scroll{position:relative;z-index:2;flex:1;min-height:0;min-width:0;padding:8px 12px 16px;display:flex;flex-direction:column;gap:8px}
.th-card{flex:none;border-radius:15px;background:rgba(44,33,25,.94);border:1.5px solid #4a3a2b;padding:10px;min-width:0}
.th-card.hi{width:auto;height:auto;object-fit:initial;vertical-align:baseline;background:linear-gradient(180deg,rgba(90,58,16,.96),rgba(58,37,8,.96));border:2px solid var(--g2)}
.th-card.res{background:linear-gradient(180deg,rgba(40,70,44,.97),rgba(22,40,26,.97));border:2px solid #7fe07a;text-align:center}
.th-card h4{margin:0 0 6px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:16px;line-height:1.15;color:var(--g2);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:2px 8px;min-width:0}
.th-card h4 span{font-family:Nunito,system-ui,sans-serif;font-size:11px;font-weight:900;color:var(--mut);min-width:0;overflow-wrap:anywhere}
.th-card p{margin:0;font-size:12.5px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.th-card p.d{color:var(--mut);font-size:11.5px;margin-top:6px}
.th-card p.w{color:#ffb38a;font-size:11.5px;margin-top:6px}
.th-top{display:flex;align-items:center;gap:10px;min-width:0;margin-bottom:8px}
.th-top .ib{flex:none;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#5a4026,#21170f 75%);border:2px solid #8a6a40;display:grid;place-items:center}
.th-top p{flex:1;min-width:0}
.th-kv{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-top:1px solid rgba(255,236,200,.12);font-size:12.5px;font-weight:800;line-height:1.3;min-width:0}
.th-kv span{min-width:0;overflow-wrap:anywhere}
.th-kv span:first-child{display:flex;align-items:center;gap:6px}
.th-kv span:last-child{text-align:right;color:#fff;font-weight:900}
.th-kv small{display:block;font-size:10.5px;font-weight:800;color:var(--mut);line-height:1.25}
.th-bt,.xs .th-bt{min-height:48px;min-width:44px;padding:4px 14px;border-radius:13px;border:1.5px solid rgba(255,236,200,.25);background:#3a2c20;color:#f6ecdf;font-weight:900;font-size:15px;line-height:1.15;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center;overflow-wrap:anywhere}
.th-bt:active{transform:translateY(2px)}
.th-bt.y,.xs .th-bt.y{border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10}
.th-bt.g,.xs .th-bt.g{border:0;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;box-shadow:0 3px 0 #1d5a1c}
.th-bt.off,.xs .th-bt.off{opacity:.5;box-shadow:none}
.th-bt.wide{width:100%;margin-top:8px}
.th-big{display:block;font-family:'Lilita One',Nunito,sans-serif;font-size:34px;line-height:1.15;color:#fff;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.th-card.res h4{justify-content:center;font-size:20px;color:#d9ffd4}
.th-gate{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.th-gate b{font-size:26px;line-height:1.1;color:#fff}
.th-gate span{font-size:13px;font-weight:800;color:var(--mut);line-height:1.4;overflow-wrap:anywhere}
.th-gate .th-bt{padding:0 26px}
@media (prefers-reduced-motion:reduce){.th-in{animation:none}}
`; document.head.appendChild(el); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={conf:false,res:null,toast:'',tone:'bad',toastT:0,anim:true,top:true,sig:'',tk:0,md:'',busy:false};
function say(m,tone){ X.toast=String(m||''); X.tone=tone==='ok'?'ok':'bad'; X.toastT=Date.now(); redraw(); }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="th-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.74,0.93):'#16110d')+'"></div>';
/* none (sem módulo) · off (chave desligada) · fire (Fogueira desligada) · lobby */
function mode(){ if(!TH()) return {m:'none'}; if(!thOn()) return {m:'off'}; if(!fireOn()) return {m:'fire'}; const v=viewNow(); if(!v) return {m:'off'}; return {m:'lobby',v:v,f:fireNow()}; }
function stripInner(){ if(X.toast&&Date.now()-X.toastT<TOAST_MS) return '<span class="th-st '+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc2(X.toast)+'</span>';
  return '<span class="th-st">'+SV(I_INFO,20)+'<span>Brasas só jogando. As entradas são grátis e voltam todo dia.</span></span>'; }
function setStrip(){ const el=byId('th_strip'); if(el) el.innerHTML=stripInner(); }
function confHtml(v){ if(!X.conf) return '';
  return '<div class="th-conf" role="alertdialog" aria-label="Repetir"><b class="lil">Repetir agora?</b><p>Gasta <em>1 entrada</em> de hoje e rende na hora o lote cheio do nível '+nT(v.best)+': <em>'+esc2(brasas(v.sweepLote))+'</em>. Sem perseguição.</p><div class="th-row2"><button class="th-bt" data-x="no">Cancelar</button><button class="th-bt g" data-x="yes">Repetir</button></div></div>'; }
/* resultado: os campos são os que o Sys.thief.finish / sweep devolveu */
function resHtml(v){ const r=X.res; if(!r) return ''; const lost=Math.max(0,num(r.drop)-num(r.brasas)), sweep=r.kind==='sweep';
  return '<div class="th-card res" role="status"><h4>'+(sweep?'Repetido':r.won?'Saco inteiro':'Fim da perseguição')+'</h4>'
    +'<span class="th-big">+'+esc2(brasas(r.brasas))+'</span>'
    +'<p>'+(sweep?'Lote cheio do nível '+nT(r.lv)+' da Fogueira.':'O ladrão soltou '+nT(r.drop)+' de '+esc2(brasas(r.lote))+' do saco.')+'</p>'
    +(lost>0?'<p class="w">O estoque da Fogueira encheu: '+esc2(brasas(lost))+' não '+(lost===1?'coube':'couberam')+'. Use Brasas na Fogueira antes da próxima.</p>':'')
    +(!sweep&&r.won?'<p class="d">Nível '+nT(r.lv)+' vencido. O Repetir passa a render o lote cheio do melhor nível vencido (nível '+nT(r.best)+').</p>':'')
    +(!sweep&&!r.won?'<p class="d">Solte o saco inteiro para vencer o nível e liberar o Repetir dele.</p>':'')
    +'<p class="d">Entradas que sobram hoje: '+nT(r.left)+' de '+nT(v.entries)+'.</p>'
    +'<button class="th-bt y wide" data-x="ok">Continuar</button></div>'; }
function lobbyHtml(M){ const v=M.v, f=M.f||{}, stock=num(f.stock), max=num(f.max), full=max>0&&stock+num(v.lote)>max;
  let h=resHtml(v);
  h+='<div class="th-card hi"><h4>Perseguição<span>'+nT(v.secs)+' s</span></h4>'
    +'<div class="th-top"><span class="ib">'+SV(I_SACK,44)+'</span><p>Um ladrão foge com um saco de Brasas por <em>'+nT(v.secs)+' s</em>. Bata nele para o saco soltar as Brasas.</p></div>'
    +'<div class="th-kv"><span>'+SV(I_CLOCK,20)+'<span>Entradas hoje<small>voltam em '+esc2(hm(resetMs()))+' (meia-noite de Brasília)</small></span></span><span id="th_left">'+nT(v.left)+'/'+nT(v.entries)+'</span></div>'
    +'<div class="th-kv"><span>'+SV(I_BRASA,20)+'<span>Prêmio do saco inteiro<small>lote do nível '+nT(v.lv)+' da Fogueira</small></span></span><span>'+esc2(brasas(v.lote))+'</span></div>';
  if(v.run) h+='<p class="w">Há uma perseguição aberta (nível '+nT(v.run.lv)+'). A entrada dela já foi gasta: se sair agora, ela não volta e o saco fica com o ladrão.</p><div class="th-row2" style="margin-top:8px"><button class="th-bt" data-x="cancel" aria-label="Sair da perseguição. A entrada não volta">Sair (a entrada não volta)</button><button class="th-bt y" data-x="resume">Continuar</button></div>';
  else h+='<button class="th-bt y wide'+(v.canEnter?'':' off')+'" data-x="enter" aria-label="Entrar na perseguição'+(v.canEnter?'':', sem entradas hoje')+'">Entrar</button>'+(v.left>0?'<p class="d">Entrar gasta 1 entrada na hora. Sair no meio não devolve.</p>':'<p class="d">'+esc2(why('entries'))+'.</p>');
  h+='</div>';
  h+='<div class="th-card"><h4>Repetir<span>sem perseguição</span></h4>'
    +(num(v.best)>0?'<p>Rende na hora o lote cheio do melhor nível que você já venceu (nível '+nT(v.best)+'): <em>'+esc2(brasas(v.sweepLote))+'</em>. Gasta 1 entrada.</p>'
      :'<p>Rende na hora o lote cheio do melhor nível que você já venceu. Gasta 1 entrada.</p><p class="d">'+esc2(why('none'))+' (solte o saco inteiro).</p>')
    +'<button class="th-bt g wide'+(v.canSweep?'':' off')+'" data-x="sweep" aria-label="Repetir'+(v.canSweep?'':', ainda não disponível')+'">'+SV(I_AGAIN,20)+'Repetir</button></div>';
  h+='<div class="th-card"><h4>Fogueira das Eras<span>para onde as Brasas vão</span></h4>'
    +'<div class="th-kv" style="border-top:0;padding-top:0"><span>'+SV(I_BRASA,20)+'<span>Brasas guardadas</span></span><span>'+nT(stock)+(max>0?'/'+nT(max):'')+'</span></div>'
    +'<div class="th-kv"><span>'+SV(I_SACK,20)+'<span>Já tiradas do Ladrão</span></span><span>'+esc2(brasas(v.total))+'</span></div>'
    +(full?'<p class="w">O estoque está quase cheio: o que passar de '+nT(max)+' não entra. Use Brasas na Fogueira antes de entrar.</p>':'')
    +'<p class="d">Nada aqui é vendido. Sem entrada paga e sem anúncio.</p></div>';
  return h; }
const gate=(d,txt,role)=>xWrap(d,'','<div class="th">'+bgHtml()+'<div class="th-gate"><b class="lil">Ladrão de Brasas</b><span role="'+(role||'alert')+'">'+esc2(txt)+'</span><button class="th-bt y" data-x="back">Voltar</button></div></div>');

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{}, M=mode(); X.md=M.m;
  if(M.m==='none'){ V.innerHTML=gate(d,'Ladrão de Brasas indisponível agora.'); X.sig='x'; return; }
  if(M.m==='off'){ V.innerHTML=gate(d,'Ladrão de Brasas: em breve.','status'); X.sig='x'; return; }
  if(M.m==='fire'){ V.innerHTML=gate(d,'O Ladrão de Brasas abre junto com a Fogueira das Eras. Em breve.','status'); X.sig='x'; return; }
  if(X.conf&&!M.v.canSweep) X.conf=false;
  let y0=0; try{ const s0=X.top?null:byId('th_scroll'); y0=s0?(+s0.scrollTop||0):0; }catch(e){}
  V.innerHTML=xWrap(d,'','<div class="th'+(X.anim?' th-in':'')+'">'+bgHtml()
    +'<div id="th_strip" class="th-strip">'+stripInner()+'</div>'+confHtml(M.v)
    +'<div id="th_scroll" class="th-scroll x-scroll">'+lobbyHtml(M)+'</div></div>');
  try{ if(y0){ const sc=byId('th_scroll'); if(sc) sc.scrollTop=y0; } }catch(e){}
  X.anim=false; X.top=false; X.sig=sig();
}
function sig(){ try{ const M=mode(), v=M.v; if(!v) return M.m; const f=M.f||{}; return [M.m,v.left,v.lv,v.lote,v.best,v.total,v.run?v.run.lv:0,f.stock,f.max,Math.ceil(resetMs()/60000),typeof window.startThiefRun].join('|'); }catch(e){ return ''; } }

/* ================= a corrida (a luta é do jogo; aqui só a entrega e o resultado) ================= */
/* entrega a corrida à batalha. Devolveu false ou estourou: a corrida fica ABERTA no módulo (a entrada já foi gasta no enter; o jogador volta por Continuar) */
function launch(run){ let ok=false; try{ ok=window.startThiefRun(Object.assign({},run,{lv:run.lv,lote:run.lote,secs:run.secs}))!==false;   /* a corrida INTEIRA do módulo: a luta usa bagHp, escapeAt/Every/Dur, seed e endsAt quando vierem */ }catch(e){ ok=false; }
  if(!ok) say('Não foi possível começar agora. A perseguição fica aberta: toque em Continuar');
  return ok; }
/* FIM DA PERSEGUIÇÃO (a batalha chama UMA vez): score 0..1 = fração do saco que caiu. Roda o Sys.thief.finish, grava e abre o resultado. Devolve o que o módulo devolveu */
function finish(score){ const T=TH(); if(!T||!thOn()) return {ok:false,reason:'off'}; if(!fireOn()) return {ok:false,reason:'off'};
  /* online: o servidor paga e o Sys.thiefNet credita uma vez por corrida; devolve a Promise com o mesmo resultado. Recusa: abre a tela e diz o motivo (a corrida que o servidor ainda aceita fica aberta, em Continuar) */
  { const net=TN(); if(net) return Promise.resolve().then(()=>net.finish(sv(),host(),num(score))).then(r=>r,()=>null).then(r=>{
      if(!r||!r.ok){ try{ if(!isOn()&&window.Panels&&typeof Panels.open==='function'&&Panels.on(N)) Panels.open(N); }catch(e){} say(whyR(r)); return r||{ok:false,reason:'run'}; }
      saved(); sfx('claim'); showResult(r); return r; }); }
  let r=null; try{ r=T.finish(sv(),host(),{score:num(score)}); }catch(e){ r=null; } if(!r||!r.ok) return r||{ok:false,reason:'run'};
  saved(); sfx('claim'); showResult(r); return r; }
/* mostra um resultado já calculado (o que Sys.thief.finish ou sweep devolveu) e abre a tela */
function showResult(r,kind){ if(!r||!r.ok) return false; X.res=Object.assign({},r,{kind:kind==='sweep'?'sweep':'run'}); X.conf=false; X.top=true; X.anim=true;
  try{ if(!isOn()&&window.Panels&&typeof Panels.open==='function'&&Panels.on(N)){ X.keep=true; Panels.open(N,{result:true}); } }catch(e){}
  X.keep=false; redraw(); return true; }
/* saiu no meio: fecha a corrida. A entrada foi gasta no enter e NÃO volta */
function cancel(){ const T=TH(); if(!T||!thOn()) return false; let had=false; try{ had=!!T.cancel(sv(),host()); }catch(e){} if(had) saved(); redraw(); return had; }

/* um pedido online de cada vez: espera a resposta, diz o motivo da recusa ou segue com o resultado (mesmo formato do Sys.thief) */
function online(call,done){ if(X.busy) return; X.busy=true;
  Promise.resolve().then(call).then(r=>r,()=>null).then(r=>{ X.busy=false; if(!r||!r.ok){ say(whyR(r)); return; } try{ done(r); }catch(e){ try{ console.error('ladrão online',e); }catch(e2){} } }); }
/* ================= toques (cada data-x da tela tem uma entrada aqui) ================= */
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  ok(){ sfx('ui_tap'); X.res=null; X.top=true; redraw(); },
  no(){ sfx('ui_tap'); X.conf=false; redraw(); },
  /* Entrar: uma chamada ao Sys.thief.enter, que GASTA a entrada na hora; o fim (Sys.thief.finish) não gasta outra */
  enter(){ const T=TH(), v=viewNow(); if(!v) return; sfx('ui_tap'); X.conf=false;
    if(v.run) return say(why('run')); if(!v.canEnter) return say(why('entries'));
    if(typeof window.startThiefRun!=='function') return say('A perseguição ainda não está disponível. Nada foi gasto');   /* não abre corrida que ninguém vai fechar */
    { const net=TN(); if(net) return online(()=>net.enter(sv(),host()),q=>{ X.res=null; saved(); launch(q); redraw(); }); }
    let r=null; try{ r=T.enter(sv(),host()); }catch(e){ r=null; } if(!r||!r.ok) return say(why(r&&r.reason));
    X.res=null; saved(); launch(r); redraw(); },
  resume(){ const T=TH(), v=viewNow(); if(!v||!v.run) return; sfx('ui_tap');
    if(typeof window.startThiefRun!=='function') return say('A perseguição ainda não está disponível. Ela continua aberta');
    launch({lv:v.run.lv,lote:T.loteOf(v.run.lv),secs:v.secs}); redraw(); },
  cancel(){ const v=viewNow(); if(!v||!v.run) return; sfx('ui_tap'); if(cancel()) say('Você saiu da perseguição. A entrada foi gasta'); },
  /* Repetir gasta uma entrada do dia na hora: o 1º toque só abre a confirmação */
  sweep(){ const v=viewNow(); if(!v) return; sfx('ui_tap'); if(v.run) return say(why('run')); if(!(num(v.best)>0)) return say(why('none')); if(!v.canSweep) return say(why('entries'));
    X.toast=''; X.conf=true; redraw(); },
  yes(){ const T=TH(); if(!X.conf) return; sfx('ui_tap'); X.conf=false;
    { const net=TN(); if(net) return online(()=>net.sweep(sv(),host()),q=>{ saved(); sfx('claim'); showResult(q,'sweep'); }); }
    let r=null; try{ r=T.sweep(sv(),host()); }catch(e){ r=null; } if(!r||!r.ok) return say(why(r&&r.reason));
    saved(); sfx('claim'); showResult(r,'sweep'); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!TH()||!thOn()||!fireOn()) return;                 /* módulo ausente ou desligado: só o Voltar funciona */
  return ACT[a](b); }

/* imagens que a tela mostra (só o fundo da era) */
function urls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){} return u; }
/* número do selo no Menu: entradas que sobram hoje. Tela, módulo ou Fogueira desligados = 0 (e nada é lido do save) */
function alerts(){ try{ if(!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N))) return 0; const v=viewNow(); return v?num(v.left):0; }catch(e){ return 0; } }

if(!('thief' in PANEL_ON)) PANEL_ON.thief=false;
const def=Panels.add(N,{title:'Ladrão de Brasas',actions:Object.keys(ACT),urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()) return; if(X.toast&&Date.now()-X.toastT>=TOAST_MS){ X.toast=''; setStrip(); }
    if(X.sig==='x') return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  onOpen(o){ X.conf=false; X.toast=''; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.busy=false; if(!(o&&o.result)&&!X.keep) X.res=null;   /* aberta pelo resultado (showResult): o resultado fica */
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){} },
  onClose(){ X.conf=false; X.toast=''; X.res=null; } });
/* ganchos da batalha, selo do Menu, teste de fumaça e console */
window.PThief={X:X,def:def,urls:urls,finish:finish,cancel:cancel,showResult:showResult,alerts:alerts};
})();
