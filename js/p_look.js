'use strict';
/* ================= 05 APARÊNCIA = VITRINE DE SKINS (aba do Equipamento) — tela nova, nasce DESLIGADA (PANEL_ON.look) =================
   DECISÃO FINAL DO DONO (via PO): não há combinações/camadas nem fases/crescimento. O padrão é o garoto (Kael) / a menina (Kaia) para sempre. O adulto e o guerreiro
   viram as primeiras SKINS FIXAS ("Kael Cavaleiro", "Kael Guerreiro Lendário", "Kaia Cavaleira", "Kaia Guerreira Lendária"), equipáveis aqui.
   A tela lista a skin PADRÃO + as skins fixas DO HERÓI ATUAL, cada uma num cartão: herói desenhado (window.drawHeroFull), nome, selo EQUIPADA na que está em uso,
   botão "Equipar" nas que o jogador possui e, nas que não possui, o texto de como obter que o módulo trouxer (sem botão de comprar inventado). Cartão "Novas skins em breve".
   API de Sistemas (ainda chegando; LIDA COM RESERVA, ajustar aos nomes reais quando saírem): Sys.appearance.fixedSkins(S, host) → [{id, name, hero, owned, equipped, how, bonus}]
   e Sys.appearance.equipFixed(S, id) (id null/'default' volta ao padrão). Se a lista não existir, a tela fica só com a padrão + "Novas skins em breve".
   drawHeroFull(ctx, x, pés, scale, state): para um cartão que NÃO é a skin equipada passo state.skin=<id> (a skin padrão = 'default'); se o desenho ainda ignorar state.skin,
   todos os cartões mostram o herói equipado (pedido ao engenheiro). Reserva do desenho: o Kael parado de assets/anim/hyb/R. Zero emoji, nenhum botão sem ação.
   Pedido Q-15 (reports/pedidos-entre-agentes.md): carregar este script e ligar PANEL_ON.look; a entrada é o cartão do Equipamento (Panels.open('look')), o Voltar volta ao Equipamento. */
const XLK={raf:0,t0:0,err:0};
const PL_MINH=520;
const PL_CSS=`.pl-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:plk 1s steps(12,jump-none) infinite}
@keyframes plk{from{background-position:0 0}to{background-position:100% 0}}
.pl-in{animation:plr .35s ease-out both}
@keyframes plr{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
.pl-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 16px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pl-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
@media (prefers-reduced-motion:reduce){.pl-kid,.pl-in{animation:none}}`;
const plEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function plInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pl_css')) return; const st=document.createElement('style'); st.id='pl_css'; st.textContent=PL_CSS; document.head.appendChild(st); }
const plSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const plToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const plRar=r=>{ try{ return (typeof RAR!=='undefined'&&RAR[r])?{n:RAR[r].n,c:RAR[r].c}:null; }catch(e){ return null; } };
/* como obter: com a chave de obtenção desligada (soon) a tela diz só "Em breve" (o texto "how" do módulo ainda traz preço de proposta); com ela ligada, o "how" */
const plHow=sk=>sk.soon?'Em breve: ainda não dá para obter':(sk.how||'Ainda não disponível');
const plChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
function plHero(){ try{ const A=window.Sys&&Sys.appearance; const h=A&&A.heroOf?A.heroOf(S):(S&&S.hero); return h==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } }
/* skins fixas do herói atual: [] se o módulo ainda não tem a API (a tela fica só com a padrão) */
function plFixed(hero){ try{ const A=window.Sys&&Sys.appearance; if(!A||typeof A.fixedSkins!=='function') return []; const l=A.fixedSkins(S,Sys.host); return (Array.isArray(l)?l:[]).filter(x=>x&&x.id&&(!x.hero||x.hero===hero)); }catch(e){ return []; } }
function plDraw(ts){ XLK.raf=0; const cs=document.querySelectorAll?document.querySelectorAll('canvas[data-plsk]'):[]; if(!cs.length) return; if(!XLK.t0) XLK.t0=ts||0;
  if(typeof window.drawHeroFull!=='function'||XLK.err){ plFallback(); return; }
  const hs=(typeof HS==='number'&&HS>0)?HS:155;   /* a vitrine mostra o herói A PÉ e sem pet: com montaria a skin não apareceria (P21) */
  for(const cv of cs){ try{ const c2=cv.getContext('2d'), w=cv.width, h=cv.height; c2.clearRect(0,0,w,h); window.drawHeroFull(c2,w*0.45,h*0.93,h*0.62/hs,{t:((ts||0)-XLK.t0)/1000,skin:cv.dataset.plsk,mount:false,pet:false}); }catch(e){ XLK.err=1; plFallback(); return; } }
  if(typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw); }
/* reserva: o Kael parado no lugar de cada canvas */
function plFallback(){ try{ const cs=document.querySelectorAll('canvas[data-plsk]'); for(const cv of cs){ cv.style.display='none'; const fb=cv.nextElementSibling; if(fb) fb.style.display='block'; } }catch(e){} }
function plStop(){ if(XLK.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(XLK.raf); XLK.raf=0; }
/* um cartão de skin: herói, nome, selo, e Equipar ou como obter */
function plCard(sk,hasFull,i){ const eq=!!sk.equipped, size=hasFull?'':'display:none', rar=sk.r>=0?plRar(sk.r):null;
  const act=eq?'':(sk.owned?`<button data-x="equip" data-id="${plEsc(sk.id)}" class="pl-btn" aria-label="Equipar ${plEsc(sk.name)}">Equipar</button>`:`<span style="font-size:12px;font-weight:800;color:#ffd27a;text-align:center;line-height:1.3">${plEsc(plHow(sk))}</span>`);
  return `<div class="pl-in" style="animation-delay:${i*.06}s;flex:none;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;border-radius:16px;background:radial-gradient(ellipse at 50% 75%,#3a2c4a,#1d1611);border:2px solid ${eq?'#5fd068':rar?rar.c:sk.owned?'#8a6a3a':'#4a3a2b'};box-sizing:border-box;opacity:${sk.owned||eq?1:.85}">
    <div role="img" aria-label="${plEsc(sk.name)}${eq?', equipada':''}" style="position:relative;width:min(100%,220px);aspect-ratio:1/1">
      <canvas data-plsk="${plEsc(sk.id)}" width="440" height="440" style="position:absolute;inset:0;width:100%;height:100%;${size}"></canvas>
      <div style="position:absolute;inset:0;${hasFull?'display:none':'display:block'}"><div class="pl-kid" style="position:absolute;inset:0"></div></div></div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center"><b style="font-family:'Lilita One',sans-serif;font-size:20px;color:#f6ecdf">${plEsc(sk.name)}</b>${rar?`<span style="padding:3px 10px;border-radius:10px;background:#16110d;border:2px solid ${rar.c};color:${rar.c};font-size:12px;font-weight:900">${plEsc(rar.n)}</span>`:''}${eq?'<span style="padding:3px 10px;border-radius:10px;background:#1f3a22;border:2px solid #5fd068;color:#9ff0a8;font-size:12px;font-weight:900">EQUIPADA</span>':''}</div>
    ${sk.bonus?`<span style="font-size:12px;font-weight:800;color:#9ff0a8">${plEsc(sk.bonus)}</span>`:''}${act}</div>`; }
function scrLook(){
  plInject(); const d=xDims(PL_MINH), hero=plHero(), name=hero==='kaia'?'Kaia':'Kael', pa=hero==='kaia'?'a':'o';
  const fixed=plFixed(hero), anyEq=fixed.some(x=>x.equipped), hasFull=typeof window.drawHeroFull==='function'&&!XLK.err;
  const cards=[{id:'default',name:name+' · skin padrão',owned:true,equipped:!anyEq,how:'',bonus:''}].concat(fixed.map(x=>({id:x.id,name:x.name||x.id,owned:!!x.owned,equipped:!!x.equipped,how:x.how||'',bonus:x.bonus||'',soon:!!x.soon,r:Number.isInteger(x.r)?x.r:-1})));
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 12px">
    ${cards.map((c,i)=>plCard(c,hasFull,i)).join('')}
    <div role="note" style="flex:none;min-height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;border-radius:16px;border:2px dashed #6b5843;background:#1d1611;text-align:center;box-sizing:border-box">
      <span aria-hidden="true" style="width:34px;height:26px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2b;box-sizing:border-box"></span>
      <b style="font-family:'Lilita One',sans-serif;font-size:18px;color:#f6ecdf">Novas skins em breve</b>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">Skins com arte própria para ${pa} ${name} chegam numa próxima versão.</span></div>
    <button data-x="back" style="flex:none;min-height:54px;border-radius:14px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-family:'Lilita One',sans-serif;font-size:18px">Voltar</button></div>`);
  plStop(); if(hasFull&&typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw);
}
function plClick(b){
  const a=b.dataset.x;
  if(a==='back'){ plSnd('ui_tap'); plStop(); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(a==='equip'){ const id=b.dataset.id, A=window.Sys&&Sys.appearance; plSnd('ui_tap'); if(!A||typeof A.equipFixed!=='function'){ plToast('Skins fixas ainda não estão disponíveis'); return; }
    if(id==='default'){ let r0=false; try{ r0=A.equipFixed(S,null); }catch(e){ r0=false; } if(r0===false||(r0&&r0.ok===false)){ plToast('Não foi possível voltar ao padrão'); return; } plChanged(); plToast('Equipada: skin padrão'); render(); return; }
    const sk=plFixed(plHero()).find(x=>x.id===id); if(!sk){ plToast('Esta skin não está disponível'); return; } if(!sk.owned){ plToast(sk.soon?'Em breve: ainda não dá para obter esta skin':(sk.how||'Você ainda não tem esta skin')); return; }
    let r=false; try{ r=A.equipFixed(S,id); }catch(e){ r=false; } if(r===false||(r&&r.ok===false)){ plToast(r&&r.reason==='owned'?'Você ainda não tem esta skin':r&&r.reason==='hero'?'Esta skin é de outro herói':'Não foi possível equipar agora'); return; }
    plChanged(); plToast('Equipada: '+(sk.name||id)); render(); }
}
Panels.add('look',{title:'Aparência',render:scrLook,click:plClick,onOpen(){ XLK.t0=0; XLK.err=0; },onClose(){ plStop(); } });
