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
const XLK={raf:0,t0:0,err:0,open:null,mount:false,tm:0};
/* REGRA DO DONO (14/11): skin NUNCA tem asa no corpo; asa é só item. Nenhuma skin esconde a asa-item (o Kael Anjo passou a usar a pasta sem asa no catálogo).
   A lista fica vazia de propósito; não acrescentar id aqui: skin nova com asa pintada é arte reprovada. */
const PL_OWNWING={};   /* Kaia Angelical NÃO tem asa pintada (Arte conferiu todas as folhas, 4a92ee6: só auréola e cachecol): recebe a asa do item como qualquer skin */
const plWingOff=id=>PL_OWNWING[id]===1;
const PL_MINH=520;
const PL_CSS=`.pl-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:plk 1s steps(12,jump-none) infinite}
@keyframes plk{from{background-position:0 0}to{background-position:100% 0}}
.pl-in{animation:plr .35s ease-out both}
@keyframes plr{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
.pl-btn,.xs .pl-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 16px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pl-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
@media (prefers-reduced-motion:reduce){.pl-kid,.pl-in{animation:none}}`;
const plEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function plInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pl_css')) return; const st=document.createElement('style'); st.id='pl_css'; st.textContent=PL_CSS; document.head.appendChild(st); }
const plSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const plToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const plRar=r=>{ try{ return (typeof RAR!=='undefined'&&RAR[r])?{n:RAR[r].n,c:RAR[r].c}:null; }catch(e){ return null; } };
/* como obter: com a chave de obtenção desligada (soon) a tela diz só "Em breve"; com ela ligada, o "how" do módulo (sem preço) */
const plHow=sk=>sk.soon?'Em breve: ainda não dá para obter':(sk.how||'Ainda não disponível');
const plChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
function plHero(){ try{ const A=window.Sys&&Sys.appearance; const h=A&&A.heroOf?A.heroOf(S):(S&&S.hero); return h==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } }
/* skins fixas do herói atual: [] se o módulo ainda não tem a API (a tela fica só com a padrão) */
function plFixed(hero){ try{ const A=window.Sys&&Sys.appearance; if(!A||typeof A.fixedSkins!=='function') return []; const l=A.fixedSkins(S,Sys.host); return (Array.isArray(l)?l:[]).filter(x=>x&&x.id&&(!x.hero||x.hero===hero)); }catch(e){ return []; } }
function plDraw(ts){ XLK.raf=0; const cs=document.querySelectorAll?document.querySelectorAll('canvas[data-plsk][data-live]'):[]; if(!cs.length) return; if(!XLK.t0) XLK.t0=ts||0;
  if(typeof window.drawHeroFull!=='function'||XLK.err){ plFallback(); return; }
  const hs=(typeof HS==='number'&&HS>0)?HS:155;   /* a vitrine mostra o herói A PÉ (com montaria a skin não apareceria, P21) e COM O PET, na frente (regra do dono: pet sempre na frente e nunca some): sem state.pet o drawHeroFull desenha o pet por último, na mesma posição das outras telas (Arena, Troca de era). Montado, o herói vai um pouco para a esquerda para o pet (que fica mais à frente) caber no quadro */
  for(const cv of cs){ try{ const c2=cv.getContext('2d'), w=cv.width, h=cv.height; c2.clearRect(0,0,w,h); window.drawHeroFull(c2,w*(cv.dataset.mounted==='1'?0.38:0.45),h*0.93,h*0.62/hs,{t:((ts||0)-XLK.t0)/1000,skin:cv.dataset.plsk,mount:cv.dataset.mounted==='1'?undefined:false,wing:plWingOff(cv.dataset.plsk)?false:undefined}); }catch(e){ XLK.err=1; plFallback(); return; } }
  if(typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw); }
/* reserva: o Kael parado no lugar de cada canvas */
function plFallback(){ try{ const cs=document.querySelectorAll('canvas[data-plsk]'); for(const cv of cs){ cv.style.display='none'; const fb=cv.nextElementSibling; if(fb) fb.style.display='block'; } }catch(e){} }
function plStop(){ if(XLK.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(XLK.raf); XLK.raf=0; }
/* regra do PO: nada de preço de item que o jogo ainda não entrega: tira o "R$ 24,90" do texto de como ganhar */
function plNoPrice(s){ return String(s).replace(/ *R[$] *[0-9.,]+/g,'').replace(/ +/g,' ').trim(); }
/* pet equipado com as folhas ainda carregando: o quadro parado da grade não é dado como pronto (senão o cartão ficaria SEM o pet até reabrir a tela) */
function plPetWait(){ try{ if(typeof petInfo!=='function'||typeof petReady!=='function') return false; return !!(petInfo()&&PETK.base&&!petReady(PETK.base)); }catch(e){ return false; } }
/* GRADE: quadro PARADO (um desenho só por cartão, nada de laço de animação: desempenho); tenta de novo algumas vezes porque a folha pode ainda estar carregando */
function plStills(){ XLK.tm=0; const cs=document.querySelectorAll?document.querySelectorAll('canvas[data-plsk]:not([data-live])'):[]; if(!cs.length) return;
  if(typeof window.drawHeroFull!=='function'||XLK.err){ plFallback(); return; } const hs=(typeof HS==='number'&&HS>0)?HS:155, pw=plPetWait(); let miss=0;
  for(const cv of cs){ try{ const c2=cv.getContext('2d'), w=cv.width, h=cv.height; if(cv.__painted) continue; c2.clearRect(0,0,w,h); window.drawHeroFull(c2,w*0.45,h*0.93,h*0.62/hs,{t:0.35,skin:cv.dataset.plsk,mount:false,wing:plWingOff(cv.dataset.plsk)?false:undefined});
      let ok=true; try{ if(c2.getImageData){ const d=c2.getImageData(Math.floor(w*0.3),Math.floor(h*0.25),Math.floor(w*0.4),Math.floor(h*0.6)).data; ok=false; for(let i=3;i<d.length;i+=16) if(d[i]>0){ ok=true; break; } } }catch(e){ ok=true; }
      if(ok&&!pw) cv.__painted=1; else miss++; }catch(e){ XLK.err=1; plFallback(); return; } }
  XLK.n=(XLK.n||0)+1; if(miss&&XLK.n<20&&typeof setTimeout==='function') XLK.tm=setTimeout(plStills,600); }   /* a folha de cada skin carrega sob demanda: repete a cada 0,6 s (até ~12 s) só nos cartões ainda vazios; o quadro pronto não é redesenhado */
/* COMO GANHAR: texto do módulo (sem preço) e o botão que leva à tela certa pelos caminhos que o MENU já usa; destino desligado/bloqueado = o botão explica */
function plOpenTry(fn,msg){ let ok=false; try{ ok=fn()!==false; }catch(e){ ok=false; } if(!ok) plToast(msg); return ok; }
function plRoute(how){ const s=String(how||''); const R=(label,run,msg)=>({label,run:()=>plOpenTry(run,msg)});
  if(/Loja/i.test(s)) return R('Ir à Loja',()=>{ window.SHOP_RETURN='look'; if(window.Screens&&Screens.open&&Screens.open('shop')!==false) return true; if(typeof setView==='function'){ setView('shop'); return true; } return false; },'A Loja não está disponível agora');
  if(/Passe/i.test(s)) return R('Ir ao Passe',()=>{ if(window.Panels&&Panels.defs&&Panels.defs.passv2&&Panels.on('passv2')) return Panels.open('passv2',{from:'look'}); return Screens.open('pass',{tab:'rewards'}); },'O Passe não está disponível agora');
  if(/VIP/i.test(s)) return R('Ir ao Clube VIP',()=>Panels.open('vip',{from:'look'}),'O Clube VIP não está disponível agora');
  if(/Torneio/i.test(s)) return R('Ir ao Torneio',()=>Panels.open('tourney',{from:'look'}),'O Torneio ainda não está disponível');
  if(/Oferta/i.test(s)) return R('Ver a Oferta',()=>Screens.open('offer'),'A Oferta não está disponível agora');
  return null; }
const plBadge=(t,c,bg)=>'<span style="padding:3px 10px;border-radius:10px;background:'+(bg||'#16110d')+';border:2px solid '+c+';color:'+c+';font-size:12px;font-weight:900">'+plEsc(t)+'</span>';
/* cartão da grade: botão que abre o destaque; herói em quadro parado; cadeado de código nas sem arte */
function plCard(sk,hasFull,i){ const eq=!!sk.equipped, rar=sk.r>=0?plRar(sk.r):null, noArt=sk.art===false, locked=!sk.owned&&!eq&&sk.id!=='default';
  const art=noArt?'<svg width="56" height="74" viewBox="0 0 84 110" fill="none" aria-hidden="true"><circle cx="42" cy="26" r="18" fill="#2a2118" stroke="#4a3a2b" stroke-width="3"></circle><path d="M10 104c0-26 14-42 32-42s32 16 32 42z" fill="#2a2118" stroke="#4a3a2b" stroke-width="3"></path><rect x="30" y="58" width="24" height="20" rx="4" fill="#8a6a3a" stroke="#4a3a2b" stroke-width="3"></rect><path d="M35 58v-6a7 7 0 0 1 14 0v6" stroke="#8a6a3a" stroke-width="4" fill="none"></path></svg>'
    :'<canvas data-plsk="'+plEsc(sk.id)+'" width="300" height="300" style="position:absolute;inset:0;width:100%;height:100%;'+(hasFull?'':'display:none')+'"></canvas><div style="position:absolute;inset:0;'+(hasFull?'display:none':'display:block')+'"><div class="pl-kid" style="position:absolute;inset:0"></div></div>';
  const state=eq?plBadge('EQUIPADA','#9ff0a8','#1f3a22'):noArt?plBadge('Em breve','#c9b9a2','#2a2118'):locked?plBadge('Trancada','#c9b9a2'):sk.id==='default'?'':plBadge('Sua','#ffd27a');
  return '<button data-x="open" data-id="'+plEsc(sk.id)+'" class="pl-in" aria-label="'+plEsc(sk.name)+(eq?', equipada':noArt?', em breve':locked?', trancada':'')+'. Ver" style="animation-delay:'+(i*.04)+'s;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px;border-radius:14px;background:'+(noArt?'#1d1611':'radial-gradient(ellipse at 50% 75%,#3a2c4a,#1d1611)')+';border:2px '+(noArt?'dashed':'solid')+' '+(eq?'#5fd068':rar?rar.c:'#4a3a2b')+';box-sizing:border-box;color:#f6ecdf;opacity:'+(locked||noArt?.9:1)+'">'
    +'<span style="position:relative;display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:1/1;max-height:150px">'+art+'</span>'
    +'<b style="font-family:\'Lilita One\',sans-serif;font-size:15px;line-height:1.1;text-align:center">'+plEsc(sk.name)+'</b><span style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center">'+(rar?plBadge(rar.n,rar.c):'')+state+'</span></button>'; }
/* DESTAQUE: o herói maior e ANIMADO (só aqui roda o laço), como ganhar + botão, Equipar se for sua; A pé / Montado (montado = corpo padrão, regra aprovada) */
function plDetail(c,hasFull,hero){ if(!c) return ''; const rar=c.r>=0?plRar(c.r):null, noArt=c.art===false, eq=!!c.equipped, mountEq=(()=>{ try{ return !!(window.Sys&&Sys.mount&&Sys.mount.ensure(S).eq); }catch(e){ return false; } })(), mounted=XLK.mount&&mountEq&&!noArt;
  const how=c.id==='default'?'':plNoPrice(c.how||''), route=!c.owned&&c.id!=='default'?plRoute(c.how):null;
  const canvas=noArt?'<svg width="120" height="160" viewBox="0 0 84 110" fill="none" aria-hidden="true"><circle cx="42" cy="26" r="18" fill="#2a2118" stroke="#4a3a2b" stroke-width="3"></circle><path d="M10 104c0-26 14-42 32-42s32 16 32 42z" fill="#2a2118" stroke="#4a3a2b" stroke-width="3"></path><rect x="30" y="58" width="24" height="20" rx="4" fill="#8a6a3a" stroke="#4a3a2b" stroke-width="3"></rect><path d="M35 58v-6a7 7 0 0 1 14 0v6" stroke="#8a6a3a" stroke-width="4" fill="none"></path></svg>'
    :'<canvas data-plsk="'+plEsc(mounted?'default':c.id)+'" data-live="1" data-mounted="'+(mounted?1:0)+'" width="440" height="440" style="position:absolute;inset:0;width:100%;height:100%;'+(hasFull?'':'display:none')+'"></canvas><div style="position:absolute;inset:0;'+(hasFull?'display:none':'display:block')+'"><div class="pl-kid" style="position:absolute;inset:0"></div></div>';
  const tg=(a,t,on)=>'<button data-x="'+a+'" aria-pressed="'+on+'" style="flex:1;min-height:40px;border-radius:10px;border:2px solid '+(on?'#ffc94a':'#4a3a2b')+';background:'+(on?'#3a2c1a':'#1d1611')+';color:'+(on?'#ffe07a':'#c9b9a2')+';font-weight:900;font-size:13px">'+t+'</button>';
  return '<div role="dialog" aria-label="'+plEsc(c.name)+'" style="position:fixed;inset:0;z-index:50;background:#0e0a07;scrollbar-width:thin;scrollbar-color:#6b5843 #1d1611;display:flex;flex-direction:column;align-items:center;padding:12px;box-sizing:border-box;overflow-y:auto;overflow-x:hidden">'
    +'<div style="width:100%;max-width:360px;display:flex;flex-direction:column;gap:8px;align-items:center">'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center"><b style="font-family:\'Lilita One\',sans-serif;font-size:22px">'+plEsc(c.name)+'</b>'+(rar?plBadge(rar.n,rar.c):'')+(eq?plBadge('EQUIPADA','#9ff0a8','#1f3a22'):'')+'</div>'
    +'<div style="position:relative;width:min(100%,300px);aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;border-radius:16px;background:radial-gradient(ellipse at 50% 75%,#3a2c4a,#1d1611)">'+canvas+'</div>'
    +(noArt?'<span style="font-size:12px;font-weight:800;color:#c9b9a2">Arte em breve: ainda não dá para ver o herói com esta skin.</span>':(mountEq?'<div style="display:flex;gap:6px;width:100%">'+tg('pose-foot','A pé',!mounted)+tg('pose-mount','Montado',mounted)+'</div>'+(mounted?'<span style="font-size:11px;font-weight:800;color:#c9b9a2;text-align:center">Montado, o herói usa o corpo padrão (regra aprovada).</span>':''):''))
    +(c.bonus?'<span style="font-size:13px;font-weight:900;color:#9ff0a8">'+plEsc(c.bonus)+'</span>':'')
    +(how?'<div style="width:100%;box-sizing:border-box;padding:10px;border-radius:12px;background:#1d1611;border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:4px"><span style="font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:1px">COMO GANHAR</span><span style="font-size:14px;font-weight:800;color:#ffd27a;line-height:1.3">'+plEsc(c.soon&&!c.owned?how+' (a entrega abre numa próxima versão)':how)+'</span></div>':'')
    +(route?'<button data-x="route" data-id="'+plEsc(c.id)+'" class="pl-btn" style="width:100%">'+plEsc(route.label)+'</button>':'')
    +(c.owned&&!eq&&c.id!=='default'?'<button data-x="equip" data-id="'+plEsc(c.id)+'" class="pl-btn" style="width:100%" aria-label="Equipar '+plEsc(c.name)+'">Equipar</button>':(c.id==='default'&&!eq?'<button data-x="equip" data-id="default" class="pl-btn" style="width:100%">Equipar a skin padrão</button>':''))
    +'<button data-x="close" style="width:100%;min-height:48px;border-radius:12px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-family:\'Lilita One\',sans-serif;font-size:17px">Voltar</button></div></div>'; }
/* Modo dono: trocar Kael ↔ Kaia sem sair da vitrine (mesmas atualizações do atalho "Herói" do js/artprev.js) */
const plOwner=()=>{ try{ return typeof OWNER_MODE!=='undefined'&&OWNER_MODE===true; }catch(e){ return false; } };
function plCards(hero,name){ const fixed=plFixed(hero), anyEq=fixed.some(x=>x.equipped);
  return [{id:'default',name:name+' · skin padrão',owned:true,equipped:!anyEq,how:'',bonus:''}].concat(fixed.map(x=>({id:x.id,name:x.name||x.id,owned:!!x.owned,equipped:!!x.equipped,how:x.how||'',bonus:x.bonus||'',soon:!!x.soon,art:x.art,r:Number.isInteger(x.r)?x.r:-1}))); }
function scrLook(){
  plInject(); const d=xDims(PL_MINH), hero=plHero(), name=hero==='kaia'?'Kaia':'Kael', pa=hero==='kaia'?'a':'o';
  const hasFull=typeof window.drawHeroFull==='function'&&!XLK.err, cards=plCards(hero,name), sel=XLK.open!=null?cards.find(c=>c.id===XLK.open):null; if(XLK.open!=null&&!sel) XLK.open=null;
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 12px">
    ${plOwner()?'<button data-x="hero" style="flex:none;min-height:46px;border-radius:12px;border:2px solid #ffc94a;background:#3a2c1a;color:#ffe07a;font-weight:900;font-size:14px">Modo dono: trocar de herói ('+name+' → '+(hero==='kaia'?'Kael':'Kaia')+')</button>':''}
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">${cards.map((c,i)=>plCard(c,hasFull,i)).join('')}</div>
    <div role="note" style="flex:none;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:16px;border:2px dashed #6b5843;background:#1d1611;text-align:center;box-sizing:border-box">
      <b style="font-family:'Lilita One',sans-serif;font-size:17px;color:#f6ecdf">Novas skins em breve</b>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">Skins com arte própria para ${pa} ${name} chegam numa próxima versão.</span></div>
    <button data-x="back" style="flex:none;min-height:54px;border-radius:14px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-family:'Lilita One',sans-serif;font-size:18px">Voltar</button></div>${sel?plDetail(sel,hasFull,hero):''}`);
  plStop(); if(XLK.tm&&typeof clearTimeout==='function') clearTimeout(XLK.tm); XLK.n=0; XLK.t0=0; if(hasFull) plStills();
  if(sel&&hasFull&&typeof requestAnimationFrame==='function') XLK.raf=requestAnimationFrame(plDraw);
}
function plEquipId(id){ const A=window.Sys&&Sys.appearance; plSnd('ui_tap'); if(!A||typeof A.equipFixed!=='function'){ plToast('Skins fixas ainda não estão disponíveis'); return; }
  if(id==='default'){ let r0=false; try{ r0=A.equipFixed(S,null); }catch(e){ r0=false; } if(r0===false||(r0&&r0.ok===false)){ plToast('Não foi possível voltar ao padrão'); return; } plChanged(); plToast('Equipada: skin padrão'); render(); return; }
  const sk=plFixed(plHero()).find(x=>x.id===id); if(!sk){ plToast('Esta skin não está disponível'); return; } if(!sk.owned){ plToast(sk.soon?'Em breve: ainda não dá para obter esta skin':(sk.how||'Você ainda não tem esta skin')); return; }
  let r=false; try{ r=A.equipFixed(S,id); }catch(e){ r=false; } if(r===false||(r&&r.ok===false)){ plToast(r&&r.reason==='owned'?'Você ainda não tem esta skin':r&&r.reason==='hero'?'Esta skin é de outro herói':'Não foi possível equipar agora'); return; }
  plChanged(); plToast('Equipada: '+(sk.name||id)); render(); }
function plClick(b){
  const a=b.dataset.x;
  if(a==='back'){ plSnd('ui_tap'); plStop(); XLK.open=null; if(window.Screens&&Screens.close) Screens.close(); return; }
  if(a==='open'){ plSnd('ui_tap'); XLK.open=b.dataset.id; XLK.mount=false; render(); return; }
  if(a==='close'){ plSnd('ui_tap'); XLK.open=null; plStop(); render(); return; }
  if(a==='pose-foot'||a==='pose-mount'){ plSnd('ui_tap'); XLK.mount=a==='pose-mount'; render(); return; }
  if(a==='route'){ plSnd('ui_tap'); const sk=plCards(plHero(),plHero()==='kaia'?'Kaia':'Kael').find(x=>x.id===b.dataset.id); const r=sk&&plRoute(sk.how); if(!r){ plToast('Ainda não dá para ganhar esta skin'); return; } plStop(); XLK.open=null; r.run(); return; }
  if(a==='hero'){ if(!plOwner()) return; plSnd('ui_tap'); const next=plHero()==='kaia'?'kael':'kaia', A=window.Sys&&Sys.appearance; let ok=false; try{ ok=A&&A.setHero&&A.setHero(S,next); }catch(e){ ok=false; }
    if(!ok){ plToast('Não foi possível trocar de herói'); return; } try{ if(typeof formRefresh==='function') formRefresh(); if(typeof preloadAssets==='function') preloadAssets(); if(typeof avatarRefresh==='function') avatarRefresh(); }catch(e){} XLK.open=null; plToast('Herói: '+(next==='kaia'?'Kaia':'Kael')); plChanged(); render(); return; }
  if(a==='equip'){ plEquipId(b.dataset.id); return; }
}
/* Engenheiro 15: o herói mudou por fora com a vitrine aberta (item melhor equipado sozinho, Modo dono): os quadros PARADOS da grade guardavam a arma antiga até
   a tela ser reaberta. O aviso único (heroChanged, index.html) dispara 'herochange': a grade é refeita sem redesenhar a tela (o destaque já é animado). */
function plHeroChanged(){ try{ if(typeof view==='undefined'||view!=='look'||!document.querySelectorAll) return; for(const cv of document.querySelectorAll('canvas[data-plsk]:not([data-live])')) cv.__painted=0; XLK.n=0; if(!XLK.tm) plStills(); }catch(e){} }
if(typeof window!=='undefined'&&typeof window.addEventListener==='function') window.addEventListener('herochange',plHeroChanged);
Panels.add('look',{title:'Aparência',render:scrLook,click:plClick,onOpen(){ XLK.t0=0; XLK.err=0; XLK.open=null; XLK.mount=false; },onClose(){ plStop(); XLK.open=null; } });
