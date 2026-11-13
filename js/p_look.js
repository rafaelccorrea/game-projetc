'use strict';
/* ================= 05 APARÊNCIA = VITRINE DE SKINS (aba do Equipamento) — tela nova, nasce DESLIGADA (PANEL_ON.look) =================
   DECISÃO FINAL DO DONO (via PO): não há combinações/camadas para o jogador. O Kael e a Kaia de hoje são as SKINS PADRÃO; skins fixas com arte própria vêm depois.
   A tela mostra a skin padrão do herói atual como EQUIPADA, com o herói desenhado por window.drawHeroFull(ctx, x, y, scale, state) (fase e herói certos; é o mesmo
   desenho da batalha). Reserva se a função faltar ou der erro: o Kael parado de assets/anim/hyb/R. E um espaço "Novas skins em breve".
   SEM "ocultar peça", SEM modo Itens/Skin, SEM lista de cosméticos. Nenhuma regra aqui: o herói vem de Sys.appearance.heroOf(S) (se existir) ou S.hero; a fase, do
   Sys.phaseUp.current(S) (só para o rótulo "Fase n", e só quando o módulo existe). Zero emoji.
   Pedido Q-15 (reports/pedidos-entre-agentes.md): carregar este script e ligar PANEL_ON.look; a entrada é o cartão do Equipamento (Panels.open('look')), o Voltar volta ao Equipamento. */
const XLK={raf:0,t0:0,drawn:0,err:0};
const PL_MINH=520;
const PL_CSS=`.pl-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:plk 1s steps(12,jump-none) infinite}
@keyframes plk{from{background-position:0 0}to{background-position:100% 0}}
.pl-in{animation:plr .35s ease-out both}
@keyframes plr{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pl-kid,.pl-in{animation:none}}`;
const plEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function plInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pl_css')) return; const st=document.createElement('style'); st.id='pl_css'; st.textContent=PL_CSS; document.head.appendChild(st); }
const plSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
/* herói atual ('kaia' ou Kael) e fase (0-3) só se os módulos existirem; sem dado, não inventa */
function plHero(){ try{ const A=window.Sys&&Sys.appearance; const h=A&&A.heroOf?A.heroOf(S):(S&&S.hero); return h==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } }
function plPhase(){ try{ const PU=window.Sys&&Sys.phaseUp; if(PU&&PU.DATA&&PU.DATA.on===true&&PU.current){ const n=PU.current(S); return Number.isInteger(n)?n:null; } }catch(e){} return null; }
function plDraw(ts){ XLK.raf=0; const cv=document.getElementById('pl_cv'); if(!cv||!cv.getContext) return; if(!XLK.t0) XLK.t0=ts||0;
  if(typeof window.drawHeroFull==='function'&&!XLK.err){ try{ const c2=cv.getContext('2d'), w=cv.width, h=cv.height; c2.clearRect(0,0,w,h); window.drawHeroFull(c2,w*0.5,h*0.9,h/300,{vitrine:true,t:((ts||0)-XLK.t0)/1000}); XLK.drawn++; }catch(e){ XLK.err=1; plFallback(); return; } }
  else { plFallback(); return; }
  if(typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw); }
/* reserva: o Kael parado no lugar do canvas */
function plFallback(){ const cv=document.getElementById('pl_cv'); if(!cv||!cv.parentNode) return; try{ cv.style.display='none'; const fb=document.getElementById('pl_fb'); if(fb) fb.style.display='block'; }catch(e){} }
function plStop(){ if(XLK.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(XLK.raf); XLK.raf=0; }
function scrLook(){
  plInject(); const d=xDims(PL_MINH), hero=plHero(), name=hero==='kaia'?'Kaia':'Kael', ph=plPhase();
  const hasFull=typeof window.drawHeroFull==='function'&&!XLK.err;
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 12px">
    <div class="pl-in" style="flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;border-radius:16px;background:radial-gradient(ellipse at 50% 75%,#3a2c4a,#1d1611);border:2px solid #5fd068;box-sizing:border-box">
      <div role="img" aria-label="${name}, skin padrão, equipada" style="position:relative;width:min(100%,260px);aspect-ratio:1/1">
        <canvas id="pl_cv" width="520" height="520" style="position:absolute;inset:0;width:100%;height:100%;${hasFull?'':'display:none'}"></canvas>
        <div id="pl_fb" style="position:absolute;inset:0;${hasFull?'display:none':'display:block'}"><div class="pl-kid" style="position:absolute;inset:0"></div></div></div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center"><b style="font-family:'Lilita One',sans-serif;font-size:22px;color:#f6ecdf">${name} · skin padrão</b><span style="padding:3px 10px;border-radius:10px;background:#1f3a22;border:2px solid #5fd068;color:#9ff0a8;font-size:12px;font-weight:900">EQUIPADA</span></div>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.3">${ph!=null?'Fase '+(ph+1)+' do herói · ':''}Você usa a skin padrão do ${name}. Ela evolui junto com você.</span></div>
    <div role="note" style="flex:none;min-height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;border-radius:16px;border:2px dashed #6b5843;background:#1d1611;text-align:center;box-sizing:border-box">
      <span aria-hidden="true" style="width:34px;height:26px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2b;box-sizing:border-box"></span>
      <b style="font-family:'Lilita One',sans-serif;font-size:18px;color:#f6ecdf">Novas skins em breve</b>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">Skins com arte própria para o ${name} chegam numa próxima versão.</span></div>
    <button data-x="back" style="flex:none;min-height:54px;border-radius:14px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-family:'Lilita One',sans-serif;font-size:18px">Voltar</button></div>`);
  plStop(); if(hasFull&&typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw);
}
function plClick(b){
  const a=b.dataset.x;
  if(a==='back'){ plSnd('ui_tap'); plStop(); if(window.Screens&&Screens.close) Screens.close(); return; }
}
Panels.add('look',{title:'Aparência',render:scrLook,click:plClick,onOpen(){ XLK.t0=0; XLK.err=0; },onClose(){ plStop(); } });
