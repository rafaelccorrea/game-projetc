'use strict';
/* ================= 05 APARÊNCIA (aba do Equipamento) — tela nova, nasce DESLIGADA (PANEL_ON.look) =================
   Protótipo: docs/proto/Equipamento.dc.html (aba Aparência). NENHUMA regra aqui: tudo vem de Sys.appearance (js/sys/appearance.js):
   modo Itens/Skin = look(S).mode + setMode; ocultar peça = look(S).hidden + setLookHidden (asa, botas, colete, chapéu, óculos, máscara; SÓ visual, atributos não mudam);
   cosméticos de cabeça = DATA.cosmetics + look(S).cos (owned/eq) + equipCosmetic; o que está aparecendo = layers(S, host); peças equipadas = host.equipped().
   Sem emoji: ícones de espaço em assets/icons/slots, cosméticos em assets/anim/equip/cos, chapéu por era em assets/anim/equip/hats.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (para não mostrar dado falso):
   - o Kael da vitrine é o parado de assets/anim/hyb/R (roupa base com a arma); as peças por cima (chapéu por era, colete e botas em cor, óculos, máscara) são desenhadas na BATALHA
     pelas âncoras de cabeça; aqui cada peça aparece na sua linha, com a arte real, e o aviso "Aparecendo no Kael" diz o que a camada de desenho (Sys.appearance.layers) devolve;
   - "colar e luvas não aparecem" (regra do módulo): ficam fora da lista;
   - os cosméticos usam os ids e nomes do módulo (DATA.cosmetics, ainda provisórios); sem preço em gemas: o módulo ainda não tem preço, a linha diz de onde vem
     (Loja direta / Evento / Conquista) e o toque explica que ainda não dá para obter; sem barra de progresso inventada;
   - a skin completa (modo Skin) vem da Coleção de skins do Equipamento: sem skin de roupa escolhida, o modo Skin mostra o aviso e usa as peças (como o módulo faz).
   Pedido Q-15 (reports/pedidos-entre-agentes.md): carregar este script, ligar PANEL_ON.look e abrir pela aba/botão Aparência do Equipamento (Panels.open('look')). */
const XLK={tab:0};
const PL_MINH=520;
const PL_CSS=`.pl-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:plk 1s steps(12,jump-none) infinite}
@keyframes plk{from{background-position:0 0}to{background-position:100% 0}}
.pl-row{animation:plr .3s ease-out both}
@keyframes plr{from{transform:translateY(6px);opacity:0}to{transform:none;opacity:1}}
.pl-eye{flex:none;width:46px;height:46px;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:0}
@media (prefers-reduced-motion:reduce){.pl-kid,.pl-row{animation:none}}`;
const PL_NAMES={wing:'Asa',boots:'Botas',armor:'Colete',hat:'Chapéu',glasses:'Óculos',mask:'Máscara'};
const PL_ORIGIN={shop:['Loja direta','#3a2c10','#ffc94a'],event:['Evento','#1f3a22','#7ef08a'],achievement:['Conquista','#14283f','#9fd0ff']};
const PL_ICON={wing:'wings',boots:'boots',armor:'vest',hat:'helmet'};   /* nome do arquivo em assets/icons/slots/era<e>_<nome>.png */
const plOk=()=>!!(window.Sys&&Sys.appearance&&Sys.appearance.look&&Sys.appearance.setLookHidden&&Sys.appearance.layers);
const plEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function plInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pl_css')) return; const st=document.createElement('style'); st.id='pl_css'; st.textContent=PL_CSS; document.head.appendChild(st); }
const plToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const plSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const plChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const plEra=e=>{ try{ return (ERAS[e]&&ERAS[e].n)||('Era '+(e+1)); }catch(x){ return 'Era '+(e+1); } };
const plRar=r=>{ try{ return RAR[r]?RAR[r].n:''; }catch(e){ return ''; } };
const plRC=r=>{ try{ return RAR[r]?RAR[r].c:'#9aa0a6'; }catch(e){ return '#9aa0a6'; } };
const plEq=()=>{ try{ const h=Sys.host; return h&&typeof h.equipped==='function'?(h.equipped()||{}):{}; }catch(e){ return {}; } };
const plEraOf=it=>Number.isInteger(it&&it.look)?it.look:Math.max(0,Math.min(8,Math.floor(Number(it&&it.e)||0)));
const plOutfit=S=>{ try{ const A=Sys.appearance, id=A.skinOf(S,'armor'); return id&&!A.DATA.starterSkins.includes(id)?id:null; }catch(e){ return null; } };
/* uma linha por camada de item (asa, botas, colete, chapéu) e por cosmético de cabeça equipado (óculos, máscara) */
function plRows(){ const A=Sys.appearance, L=A.look(S), eq=plEq(), shown=new Set(A.layers(S,Sys.host).map(x=>x.layer)), skinMode=L.mode==='skin'&&!!plOutfit(S), rows=[];
  const slotOf={wing:'wing',boots:'boots',armor:'armor',hat:'hat'};
  for(const k of A.DATA.lookHideable){ const off=!!L.hidden[k]; let art='', name='', color='#6a5a48', none=false, sub='';
    if(slotOf[k]){ const it=eq[slotOf[k]]; if(!it){ none=true; name='Nada equipado'; } else { const e=plEraOf(it), r=Math.max(0,Math.min(4,Math.floor(Number(it.r)||0))); name=PL_NAMES[k]+' · '+plEra(e)+' · '+plRar(r); color=plRC(r);
        art=k==='hat'?'assets/anim/equip/hats/hat_era'+e+'.png':'assets/icons/slots/era'+Math.min(6,e)+'_'+PL_ICON[k]+'.png'; } }
    else { const id=L.cos.eq[k], c=id&&A.DATA.cosmetics.find(x=>x.id===id); if(!c){ none=true; name='Nenhum equipado'; } else { name=c.name; color='#c9a3ff'; art='assets/anim/equip/cos/'+c.id+'.png'; } }
    const blocked=skinMode&&k!=='wing', state=none?'Equipe um abaixo':blocked?'Escondida pela skin (modo Skin)':off?'Oculta no visual · atributos mantidos':(shown.has(k)?'Aparecendo no Kael':'Equipada');
    rows.push({k,off,none,blocked,name,color,art,state,sub}); }
  return rows; }
function plRow(r,i){ const eye=r.off?'M3 3 L21 21 M10.6 6.2 A10 10 0 0 1 22 12 A17 17 0 0 1 18.6 16.4 M6.1 6.1 A17 17 0 0 0 2 12 A10 10 0 0 0 12 18 A9 9 0 0 0 14 17.7':'M2 12 C5 6 9 4 12 4 C15 4 19 6 22 12 C19 18 15 20 12 20 C9 20 5 18 2 12 Z M12 9 A3 3 0 1 1 11.99 9';
  return `<div class="pl-row" style="animation-delay:${i*.04}s;flex:none;min-height:60px;display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:14px;background:#1d1611;border:2px solid ${r.none?'#4a3a2b':r.color};box-sizing:border-box;opacity:${r.blocked||r.none?.6:1}">
    <span aria-hidden="true" style="flex:none;width:44px;height:44px;border-radius:10px;background:#16110d;border:2px solid #4a3a2b;box-sizing:border-box;display:flex;align-items:center;justify-content:center">${r.art?`<img src="${r.art}" alt="" style="max-width:36px;max-height:36px;object-fit:contain" onerror="this.style.display='none'">`:''}</span>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:11px;font-weight:900;color:#c9b9a2">${plEsc(PL_NAMES[r.k]).toUpperCase()}</span><span style="font-size:14px;font-weight:900;color:#f6ecdf;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${plEsc(r.name)}</span><span style="font-size:11px;font-weight:800;color:${r.off?'#9c8d7a':'#9ff0a8'}">${plEsc(r.state)}</span></span>
    <button data-x="eye" data-k="${r.k}" class="pl-eye" aria-label="${r.off?'Mostrar':'Ocultar'} ${plEsc(PL_NAMES[r.k].toLowerCase())} no visual (não tira atributos)" style="border:2px solid ${r.off?'#6a5a48':'#c9a3ff'};background:${r.off?'#16110d':'#2d2140'};color:${r.off?'#8a7a68':'#e3d0ff'}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${eye}"></path></svg></button></div>`; }
function plCos(c,L,i){ const owned=L.cos.owned.includes(c.id), eqd=L.cos.eq[c.cat]===c.id, o=PL_ORIGIN[c.src]||['Origem','#2a2a2a','#c9b9a2'];
  const st=eqd?'Usando':owned?'Usar':'Ainda não é seu';
  return `<button data-x="cos" data-id="${c.id}" class="pl-row" aria-label="${plEsc(c.name)}, ${c.cat==='glasses'?'óculos':'máscara'}, origem ${plEsc(o[0])}, ${eqd?'em uso, toque para tirar':owned?'toque para usar':'ainda não é seu'}" style="animation-delay:${i*.04}s;flex:none;min-height:64px;display:flex;align-items:center;gap:10px;padding:6px 10px;border-radius:14px;background:#1d1611;border:2px solid ${eqd?'#5fd068':owned?'#8a6a3a':'#4a3a2b'};box-sizing:border-box;text-align:left;color:#f6ecdf;width:100%;opacity:${owned?1:.6}">
    <span aria-hidden="true" style="flex:none;width:56px;height:44px;border-radius:10px;background:#16110d;border:2px solid #4a3a2b;box-sizing:border-box;display:flex;align-items:center;justify-content:center"><img src="assets/anim/equip/cos/${c.id}.png" alt="" style="max-width:48px;max-height:34px;object-fit:contain" onerror="this.style.display='none'"></span>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.15"><span style="font-size:11px;font-weight:900;color:#c9b9a2">${c.cat==='glasses'?'ÓCULOS':'MÁSCARA'}</span><span style="font-size:14px;font-weight:900">${plEsc(c.name)}</span><span style="align-self:flex-start;padding:1px 8px;border-radius:8px;background:${o[1]};color:${o[2]};font-size:10px;font-weight:900">${plEsc(o[0])}</span></span>
    <span style="flex:none;font-size:13px;font-weight:900;color:${eqd?'#7ef08a':owned?'#f6ecdf':'#c9b9a2'}">${st}</span></button>`; }
function scrLook(){
  plInject(); const d=xDims(PL_MINH);
  if(!plOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Aparência indisponível agora.</div>`); return; }
  const A=Sys.appearance, L=A.look(S), items=L.mode!=='skin', rows=plRows(), noOutfit=!items&&!plOutfit(S);
  const seg=(m,l)=>{ const on=L.mode===m; return `<button data-x="mode" data-m="${m}" role="tab" aria-selected="${on}" style="flex:1;min-height:46px;border-radius:12px;border:0;font-family:'Lilita One',sans-serif;font-size:16px;padding:0;background:${on?'linear-gradient(180deg,#c9a3ff,#8a55e0)':'transparent'};color:${on?'#1a0d2e':'#c9b9a2'}">${l}</button>`; };
  const shown=A.layers(S,Sys.host).filter(x=>x.layer!=='base').map(x=>PL_NAMES[x.layer]||(x.layer==='weapon'?'Arma':x.layer==='skin'?'Skin completa':x.layer)).join(', ');
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:4px 2px 12px">
    <div style="flex:none;display:flex;gap:12px;align-items:center;padding:8px 10px;border-radius:16px;background:radial-gradient(ellipse at 50% 70%,#3a2c4a,#1d1611);border:2px solid #4a3a2b">
      <div role="img" aria-label="Kael, modo ${items?'Itens':'Skin'}${shown?': '+plEsc(shown):''}" style="flex:none;width:120px;height:120px;position:relative"><div class="pl-kid" style="position:absolute;inset:0"></div></div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><b style="font-family:'Lilita One',sans-serif;font-size:20px">Aparência</b><span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.25">Roupa base + peças por cima. Só muda o visual. Ocultar não tira atributos: a peça continua equipada e somando FC.</span><span style="font-size:11px;font-weight:900;color:#e3d0ff">${shown?'No visual: '+plEsc(shown):'Só a roupa base'}</span></div></div>
    <div style="flex:none"><span style="font-size:12px;font-weight:900;color:#c9b9a2">MODO</span><div role="tablist" aria-label="Modo da aparência" style="display:flex;gap:4px;padding:3px;border-radius:14px;background:#16110d;border:2px solid #4a3a2b;margin-top:4px">${seg('items','Itens')}${seg('skin','Skin')}</div>
      ${noOutfit?'<span role="note" style="display:block;margin-top:6px;font-size:12px;font-weight:800;color:#ffd27a">Sem skin de roupa escolhida: o modo Skin usa as peças. Escolha uma na Coleção de skins do Equipamento.</span>':''}</div>
    <div style="flex:none;display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;font-weight:900;color:#c9b9a2">PEÇAS NO VISUAL <span style="font-weight:700">· colar e luvas não aparecem</span></span>${rows.map(plRow).join('')}</div>
    <div style="flex:none;display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;font-weight:900;color:#c9b9a2">COSMÉTICOS <span style="font-weight:700">· só visual, nos dois modos; sem sorteio: loja direta, evento ou conquista</span></span>${A.DATA.cosmetics.map((c,i)=>plCos(c,L,i)).join('')}</div>
    <button data-x="back" style="flex:none;min-height:54px;border-radius:14px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-family:'Lilita One',sans-serif;font-size:18px">Voltar</button></div>`);
}
function plClick(b){
  const a=b.dataset.x;
  if(a==='back'){ plSnd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(!plOk()) return; const A=Sys.appearance;
  if(a==='mode'){ const m=b.dataset.m; if(A.look(S).mode===m) return; if(A.setMode(S,m)){ plSnd('ui_tap'); plChanged(); plToast(m==='items'?'Modo Itens: peças por cima da roupa base':'Modo Skin: skin completa, peças escondidas'); render(); } return; }
  if(a==='eye'){ const k=b.dataset.k, row=plRows().find(r=>r.k===k); plSnd('ui_tap'); if(!row) return;
    if(row.none){ plToast(k==='glasses'||k==='mask'?'Equipe um cosmético primeiro':'Equipe uma peça primeiro'); return; }
    if(A.setLookHidden(S,k,!row.off)){ plChanged(); plToast((row.off?'Mostrando ':'Ocultou ')+PL_NAMES[k].toLowerCase()+(row.off?'':' · atributos mantidos')); render(); } return; }
  if(a==='cos'){ const id=b.dataset.id, c=A.DATA.cosmetics.find(x=>x.id===id), L=A.look(S); plSnd('ui_tap'); if(!c) return;
    if(L.cos.eq[c.cat]===id){ A.equipCosmetic(S,c.cat,null); plChanged(); plToast('Tirou: '+c.name); render(); return; }
    if(L.cos.owned.includes(id)){ if(A.equipCosmetic(S,c.cat,id)){ A.setLookHidden(S,c.cat,false); plChanged(); plToast('Usando: '+c.name); render(); } return; }
    plToast(c.src==='shop'?'Loja direta: ainda não dá para obter este cosmético':c.src==='event'?'Este cosmético chega em evento':'Este cosmético vem de conquista'); }
}
Panels.add('look',{title:'Aparência',render:scrLook,click:plClick,onOpen(){ XLK.tab=0; } });
