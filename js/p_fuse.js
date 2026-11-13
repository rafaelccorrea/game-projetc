'use strict';
/* ================= FUSÃO (3 itens iguais → 1 com +1 estrela) e ADORMECIDOS — tela nova, nasce DESLIGADA (PANEL_ON.fuse) =================
   O QUE MOSTRA: duas abas.
   - "Fundir": os itens da mochila agrupados por (espaço, era de poder, raridade, estrelas); só grupos com 3 ou mais. Tocar num grupo abre a
     bancada: 3 vagas já preenchidas (os 3 de MENOR qualidade, os não equipados primeiro), a lista do grupo para trocar, a prévia do resultado
     (estrelas de → para, qualidade, nível, ouro, FC) e o botão "Fundir". Depois: animação curta e o cartão do resultado com a variação de FC.
   - "Adormecidos": itens de era futura (rendem menos até o jogador chegar na era deles), com o rótulo do módulo, a barra da era e
     "Chegue na era N para acordar". Quem acordou desde a última visita aparece uma vez com o selo "Acordou!". NÃO existe despertar pago.
   FONTES (nenhuma conta de jogo aqui):
   - estrelas e qualidade: Sys.stats.qualityStars / qpOf / DATA.quality (chave .on e faixas .stars); custo, resultado e motivo: Sys.stats.canFuse;
     cobrança: Sys.stats.fuse (gasta o ouro pelo Sys.host.spendGold); adormecido: Sys.stats.isDormant / dormantInfo (chave DATA.futureEra.on);
   - FC: Sys.fc.measure (antes/depois da fusão, .delta.text/.color) e Sys.fc.itemFC(...).swap (prévia, e FC do resultado quando ele não fica equipado);
   - mochila e equipamento como o resto do jogo: S.inv, S.eq[slot] = id, S.nextId++ (igual ao addItemToBag do js/farm.js, com normItem quando existe).
     O Sys.stats.fuse NÃO mexe no save: aqui os 3 saem de S.inv, o resultado entra com id novo e, se um dos 3 estava equipado, o resultado fica
     equipado no lugar dele. Depois: statsChanged() (FC, aviso de força, códex, save, HUD).
   - "visto adormecido": S.sys.fuseSeen.dorm = ids que estavam adormecidos na última visita (só desta tela; serve só para o selo "Acordou!").
   LAYOUT como a Forja (js/p_forge.js): cabeçalho (Voltar, título, moedas) é do index/fullbattle; aqui só o conteúdo, xDims/xWrap do js/screens.js
   (base 390, escala 1 no layout novo), miolo rola (x-scroll), toques por data-x, CSS injetado uma vez, sig para o tick não redesenhar à toa,
   prefers-reduced-motion desliga as animações (e a espera da animação da fusão), alvos de toque de 44 px ou mais, aria-label nos botões.
   DIFERENÇAS CONSCIENTES:
   - itens 5 estrelas não aparecem na aba Fundir (5 estrelas não funde; mostrar o grupo seria um botão morto);
   - com DATA.quality.on desligada a aba Fundir mostra só "A qualidade e a fusão abrem em breve" (sem botão); Adormecidos continua;
   - a prévia com ouro insuficiente usa o próprio canFuse com um host que não barra o ouro (só para mostrar o resultado; a cobrança é a real);
   - na asa, o tipo da asa (item.wing) vem do item de maior qualidade, como o visual (o canFuse não devolve o campo);
   - na era: o rótulo do módulo diz "era N" (número da era de poder); a dica repete o número e põe o nome da era entre parênteses.
   PEDIDO AO ENGENHEIRO: pôr 'p_fuse' na lista de telas do js/screens.js (linha ~823, junto de 'p_forge') e abrir pela Forja (aba/botão "Fusão":
   Panels.open('fuse',{from:'forge'})) ou pelo MENU; ligar PANEL_ON.fuse junto com Sys.stats.DATA.quality.on. Subtela do Equipamento (parent:'gear'). */
const XU={tab:'fuse',key:null,pick:[],busy:false,fx:null,res:null,toast:'',toastT:0,anim:true,t1:0,sig:''};
const U_MINH=240;
const U_ARROW='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><line x1="4" y1="12" x2="19" y2="12"></line><polyline points="13 6 19 12 13 18"></polyline></svg>';
const U_BACK='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
const U_MOON='<svg width="16" height="16" viewBox="0 0 24 24" fill="#b07cff" stroke="none" aria-hidden="true" style="flex:none"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"></path></svg>';
const U_FUSE=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'#ffc94a'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="12" cy="18" r="3.4"></circle><path d="M8 8l2.6 7M16 8l-2.6 7"></path></svg>`;
function uStar(on,s){ return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on?'#ffc94a':'#33271d'}" stroke="${on?'#8a4f0c':'#4a3a2b'}" stroke-width="1.4" stroke-linejoin="round"></path></svg>`; }

/* ---------- leituras do Sys isoladas ---------- */
const uQ=()=>Sys.stats.DATA.quality;
const uQOn=()=>{ try{ return uQ().on===true; }catch(e){ return false; } };
const uMaxSt=()=>{ try{ return uQ().stars.length; }catch(e){ return 5; } };
const uQp=it=>Sys.stats.qpOf(it);
const uSt=it=>Sys.stats.qualityStars(uQp(it));
const uIsEq=it=>!!it&&S.eq&&S.eq[it.slot]===it.id;
const uEraName=e=>(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n)||('Era '+(e+1));
const uEraNow=()=>{ try{ return Math.max(0,Sys.host.eraMax()|0); }catch(e){ return 0; } };
const uDorm=it=>{ try{ return Sys.stats.dormantInfo(it,Sys.host)||{dormant:false}; }catch(e){ return {dormant:false}; } };
const uReduced=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
function uStars(n,s){ let h=''; const M=uMaxSt(); for(let i=1;i<=M;i++) h+=uStar(i<=n,s); return `<span role="img" aria-label="${n} de ${M} estrelas" style="display:inline-flex;gap:1px;align-items:center">${h}</span>`; }

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
#fu_scroll>*{flex-shrink:0}   /* F1 (QA): as vagas não encolhem; quem rola é a lista */
.fu-in{animation:fu-fade .22s ease-out}
@keyframes fu-fade{from{opacity:0}to{opacity:1}}
.fu-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.fu-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.fu-pulse{animation:fu-pulseK 1.5s ease-in-out infinite}
@keyframes fu-pulseK{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 22px rgba(255,201,74,.85)}}
.fu-tap:active{transform:scale(.95)}
.fu-m0{animation:fu-m0K .8s ease-in both}.fu-m1{animation:fu-m1K .8s ease-in both}.fu-m2{animation:fu-m2K .8s ease-in both}
@keyframes fu-m0K{to{transform:translateX(96px) scale(.4);opacity:0}}
@keyframes fu-m1K{to{transform:scale(.4);opacity:0}}
@keyframes fu-m2K{to{transform:translateX(-96px) scale(.4);opacity:0}}
.fu-flash{animation:fu-flashK .8s ease-out both;pointer-events:none}
@keyframes fu-flashK{0%{opacity:0}60%{opacity:.95}100%{opacity:0}}
.fu-pop{animation:fu-popK .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes fu-popK{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
.fu-woke{animation:fu-wokeK 1.6s ease-in-out 3}
@keyframes fu-wokeK{0%,100%{box-shadow:0 0 0 rgba(95,208,104,0)}50%{box-shadow:0 0 16px rgba(95,208,104,.9)}}
.fu-toast{animation:fu-toastK 2.2s ease both}
@keyframes fu-toastK{0%{transform:translateY(-14px);opacity:0}12%{transform:none;opacity:1}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.fu-in,.fu-pulse,.fu-m0,.fu-m1,.fu-m2,.fu-flash,.fu-pop,.fu-woke,.fu-toast{animation:none}}
`; document.head.appendChild(st); })();

function uToastHtml(msg){ return `<div class="fu-toast" role="status" style="position:absolute;left:0;right:0;top:70px;display:flex;justify-content:center;pointer-events:none;z-index:6"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ff8a5c;font-size:14px;font-weight:900;color:#f6ecdf;box-shadow:0 0 16px rgba(255,138,92,.45);max-width:260px;text-align:center;line-height:1.2">${esc2(msg)}</span></div>`; }
function uToast(msg){ XU.toast=msg; XU.toastT=Date.now(); const el=document.getElementById('fu_toast'); if(el) el.innerHTML=uToastHtml(msg); }
function uOn(){ return typeof view!=='undefined'&&view==='fuse'; }
function uStop(){ clearTimeout(XU.t1); XU.busy=false; XU.fx=null; }
const uTouch=d=>Math.max(44,Math.ceil(44/(d.s||1)-1e-6));

/* ---------- grupos de itens iguais (espaço, era de poder, raridade, estrelas) ---------- */
/* F5 (QA): arma agrupa também pela FAMÍLIA (Sys.stats.weaponType = it.wt): 3 iguais = mesma família (o canFuse exige) */
const uFam=it=>{ if(!it||it.slot!=='weapon') return ''; try{ return Sys.stats.weaponType(it)||''; }catch(e){ return ''; } };
const uFamName=it=>{ const k=uFam(it); if(!k) return ''; try{ return Sys.stats.DATA.weaponTypes[k].name||''; }catch(e){ return ''; } };
const uKey=it=>it.slot+'|'+(it.e|0)+'|'+(it.r|0)+'|'+uSt(it)+'|'+uFam(it);
function uGroups(){ const G={}; if(!uQOn()) return [];
  for(const it of (S.inv||[])){ if(!it||!SLOT[it.slot]) continue; const st=uSt(it); if(st>=uMaxSt()) continue;   /* 5 estrelas não funde */
    const k=uKey(it); (G[k]=G[k]||{k,slot:it.slot,e:it.e|0,r:it.r|0,st,items:[]}).items.push(it); }
  const need=uQ().fusion.count, order=Sys.stats.DATA.slots;
  return Object.values(G).filter(g=>g.items.length>=need).sort((a,b)=>order.indexOf(a.slot)-order.indexOf(b.slot)||b.e-a.e||b.r-a.r||b.st-a.st); }
const uGroup=k=>uGroups().find(g=>g.k===k)||null;
/* os 3 de menor qualidade, os não equipados primeiro */
function uAutoPick(g){ const n=uQ().fusion.count; return g.items.slice().sort((a,b)=>(uIsEq(a)-uIsEq(b))||(uQp(a)-uQp(b))||(a.id-b.id)).slice(0,n).map(x=>x.id); }
function uPicked(){ return XU.pick.map(id=>itemOf(id)).filter(Boolean); }
/* prévia: o próprio canFuse; com ouro insuficiente, de novo com um host que não barra o ouro (só para mostrar o resultado) */
function uPlan(items){ const c=Sys.stats.canFuse(S,Sys.host,items); if(c.ok||c.reason!=='money') return {c,res:c.result||null,gold:c.gold};
  const p=Sys.stats.canFuse(S,Object.assign({},Sys.host,{canSpendGold:()=>true}),items); return {c,res:p.result||null,gold:c.gold!=null?c.gold:p.gold}; }
const uWhy=(c,items)=>c.reason==='money'?'Ouro insuficiente':c.reason==='max'?'5 estrelas não funde':c.reason==='different'?((items&&items.length&&new Set(items.map(uFam)).size>1)?'Famílias diferentes':'Itens diferentes'):c.reason==='off'?'Em breve':'Escolha 3 itens';

/* ---------- miniatura do item (moldura da raridade do js/screens.js) ---------- */
/* ícone da peça pelo nível da raridade (Sys.assets.tierIcon) */
const uTierIco=it=>{ const u=slotIcon(it.slot,ieraV(it)); try{ return Sys.assets.tierIcon(u,it.r); }catch(e){ return u; } };
function uThumb(it,s){ const q=xRar(it), img=`<img src="${typeof xRarIco==='function'?xRarIco(uTierIco(it),it.r,Math.round(s*.78)):uTierIco(it)}" alt="" style="width:${Math.round(s*.78)}px;height:${Math.round(s*.78)}px;object-fit:contain">`;
  return `<span${q.on?' class="'+q.cls.trim()+'"'+q.at:''} style="position:relative;width:${s}px;height:${s}px;flex:none;border-radius:${Math.round(s*.24)}px;${q.on?'':'border:2px solid '+RC[it.r|0]+';background:radial-gradient(circle at 50% 40%,#3a2c1f,#16110d);'}display:flex;align-items:center;justify-content:center;box-sizing:border-box">${img}</span>`; }
const uEqTag=`<span style="position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);padding:0 5px;border-radius:7px;background:#5fd068;color:#0d2410;font-size:9px;font-weight:900;line-height:14px;white-space:nowrap">Equipado</span>`;

/* ---------- abas ---------- */
function uTabs(d){ const t44=uTouch(d), nD=uDormList().length;
  return `<div role="tablist" aria-label="Fusão" style="height:${t44+8}px;flex:none;margin:0 12px;display:flex;padding:3px;gap:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">`
    +[['fuse','Fundir'],['dorm','Adormecidos'+(nD?' ('+nD+')':'')]].map(m=>{ const on=XU.tab===m[0];
      return `<button role="tab" data-x="tab" data-t="${m[0]}" aria-selected="${on}" style="flex:1;height:${t44}px;border-radius:11px;border:0;background:${on?'#3a2c1f':'transparent'};color:${on?'#ffc94a':'#c9b9a2'};font-size:14px;font-weight:900;padding:0;white-space:nowrap">${m[1]}</button>`; }).join('')+'</div>'; }

const U_CARD='margin:0 12px;padding:12px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;box-sizing:border-box';
const U_OFF='border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2';
function uEmpty(title,msg,icon){ return `<div style="${U_CARD};min-height:220px;align-items:center;justify-content:center;text-align:center">${icon||U_FUSE(56,'#8a7458')}
  <span class="lil" style="font-size:20px">${esc2(title)}</span><span style="font-size:13px;font-weight:800;color:#c9b9a2;line-height:1.3;max-width:300px">${esc2(msg)}</span></div>`; }

/* ---------- aba Fundir: lista de grupos ---------- */
function uList(d){ const G=uGroups();
  if(!G.length) return uEmpty('Nada para fundir','Junte 3 itens iguais (mesmo espaço, era, raridade e estrelas) para fundir.');
  const cells=G.map(g=>{ const it=g.items[0], nm=iname(it);
    return `<button class="fu-tap" data-x="grp" data-k="${esc2(g.k)}" aria-label="${esc2(SLOT[g.slot].n)} ${esc2(nm)}, ${esc2(RN(g.r))}, ${esc2(uEraName(g.e))}, ${g.st} estrelas, ${g.items.length} iguais" style="position:relative;min-height:128px;border-radius:14px;border:2px solid #4a3a2b;background:#1d1611;color:#f6ecdf;padding:8px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;box-sizing:border-box">
      ${uThumb(it,56)}
      <span class="lil" style="position:absolute;top:4px;right:6px;font-size:14px;color:#ffc94a">×${g.items.length}</span>
      ${uStars(g.st,12)}
      <span style="max-width:100%;font-size:11px;font-weight:900;color:${xRarT(it)};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(nm)}</span>
      <span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(uFamName(it)||SLOT[g.slot].n)} · ${esc2(uEraName(g.e))}</span></button>`; }).join('');
  return `<div style="margin:0 12px;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.25">3 itens iguais viram 1 com +1 estrela. Toque num grupo.</div>
    <div role="list" aria-label="Grupos que podem fundir" style="margin:0 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px">${cells}</div>`; }

/* ---------- aba Fundir: bancada do grupo ---------- */
function uBench(d,g){ const t44=uTouch(d), need=uQ().fusion.count, picked=uPicked(), fx=XU.fx;
  const back=`<button data-x="list" aria-label="Voltar à lista de grupos" style="align-self:flex-start;margin:0 12px;height:${t44}px;padding:0 14px 0 8px;border-radius:12px;${U_OFF};color:#f6ecdf;font-size:13px;font-weight:900;display:flex;align-items:center;gap:4px">${U_BACK}Grupos</button>`;
  let slots=''; for(let i=0;i<need;i++){ const it=picked[i];
    slots+=it?`<button class="fu-tap ${fx==='fuse'?'fu-m'+i:''}" data-x="slot" data-i="${i}" aria-label="Vaga ${i+1}: ${esc2(iname(it))}, qualidade ${n0(uQp(it))}${uIsEq(it)?', equipado':''}. Tocar para tirar" style="position:relative;width:80px;height:96px;border:0;background:transparent;padding:0;display:flex;flex-direction:column;align-items:center;gap:3px;color:#f6ecdf">
        <span style="position:relative">${uThumb(it,64)}${uIsEq(it)?uEqTag:''}</span><span style="font-size:11px;font-weight:900;color:#c9b9a2;margin-top:4px">${n0(uQp(it))}</span></button>`
      :`<button data-x="slot" data-i="${i}" aria-label="Vaga ${i+1} vazia: escolha um item abaixo" style="width:80px;height:96px;border:0;background:transparent;padding:0;display:flex;align-items:flex-start;justify-content:center">
        <span style="width:64px;height:64px;border-radius:15px;border:2px dashed #8a7458;background:rgba(14,10,7,.82);display:flex;align-items:center;justify-content:center;color:#8a7458;font-size:26px;font-weight:900">+</span></button>`; }
  const stage=`<div style="position:relative;margin:0 12px;padding:8px 0 2px;border-radius:16px;background:radial-gradient(ellipse at 50% 60%,#3a2c1f,#16110d 75%);border:2px solid #4a3a2b;overflow:hidden">
      <div role="group" aria-label="Vagas da fusão" style="display:flex;justify-content:center;gap:12px">${slots}</div>
      ${fx==='fuse'?'<div class="fu-flash" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.95),rgba(255,201,74,.55) 35%,rgba(255,201,74,0) 70%)"></div>':''}</div>`;
  const pool=g.items.slice().sort((a,b)=>uQp(a)-uQp(b)||a.id-b.id).map(it=>{ const on=XU.pick.indexOf(it.id)>=0;
    return `<button class="fu-tap" data-x="pick" data-id="${it.id}" aria-pressed="${on}" aria-label="${esc2(iname(it))}, qualidade ${n0(uQp(it))}, nível ${it.lvl||1}${uIsEq(it)?', equipado':''}${on?', na vaga':''}" style="position:relative;width:64px;min-height:84px;border-radius:12px;border:${on?'3px solid #ffc94a':'2px solid transparent'};background:${on?'#3a2c1f':'transparent'};padding:4px 0;display:flex;flex-direction:column;align-items:center;gap:2px;color:#f6ecdf;box-sizing:border-box">
      <span style="position:relative">${uThumb(it,46)}${uIsEq(it)?uEqTag:''}</span><span style="font-size:10px;font-weight:900;color:#c9b9a2;margin-top:5px">${n0(uQp(it))}</span><span style="font-size:10px;font-weight:800;color:#8a7458">Nv.${it.lvl||1}</span></button>`; }).join('');
  /* prévia */
  let card='';
  if(picked.length===need){ const P=uPlan(picked), c=P.c, R=P.res, lack=c.reason==='money', okGo=c.ok&&!XU.busy;
    const anyEq=picked.some(uIsEq); let fcRow='';
    if(R){ let sw=0; try{ sw=Sys.fc.itemFC(S,Sys.host,R).swap; }catch(e){ sw=0; } const dl=Sys.fc&&Sys.fc.delta?Sys.fc.delta(0,sw):null, ba=uBA(sw);
      fcRow=`<div style="display:flex;flex-direction:column;gap:1px;font-size:12px;font-weight:900"><span style="color:#c9b9a2">${anyEq?'FC depois de fundir (fica equipado)':'FC se equipar o resultado'}</span>
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span>${esc2(ba.b)}</span>${U_ARROW.replace(/22/g,'16')}<span class="lil" style="font-size:16px;color:${dl?dl.color:'#c9b9a2'}">${esc2(ba.a)}</span><span style="color:${dl?dl.color:'#c9b9a2'}">(${dl&&dl.text?esc2(dl.text):'sem mudança'})</span></span></div>`; }
    const label=XU.busy?'Fundindo...':c.ok?'Fundir':uWhy(c,picked);
    card=`<div style="${U_CARD}">
      ${R?`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${uStars(c.fromStars||g.st,16)}${U_ARROW}${uStars(R?uSt(R):g.st+1,18)}</div>
      <div style="display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:900">
        <div style="display:flex;justify-content:space-between"><span style="color:#c9b9a2">Qualidade</span><span>${n0(R.qp)} / ${n0(uQ().top)}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#c9b9a2">Nível (o maior dos 3)</span><span>Nv. ${R.lvl}</span></div>
        ${fcRow}</div>
      <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.25">O ouro investido dos 3 fica no resultado; visual e secundários vêm do de maior qualidade.${anyEq?' O resultado entra equipado no lugar.':''}</span>`
      :`<span style="font-size:13px;font-weight:800;color:#c9b9a2">${esc2(uWhy(c,picked))}</span>`}
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;flex-direction:column;line-height:1.15;width:112px;flex:none">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2">Custo</span>
          <span class="lil" style="display:flex;align-items:center;gap:4px;font-size:20px;color:${lack?'#ff5a4e':'#f6ecdf'};white-space:nowrap">${COIN_I(22)}${P.gold!=null?kf(P.gold):'—'}</span>
          ${lack?'<span style="font-size:11px;font-weight:900;color:#ff5a4e">Ouro insuficiente</span>':''}</div>
        <button class="lil ${okGo?'fu-gold fu-pulse':''}" data-x="fuse" aria-disabled="${!okGo}" aria-label="${esc2(label)}" style="flex:1;height:56px;border-radius:16px;font-size:${label.length>14?17:21}px;padding:0;${okGo?'':U_OFF}">${esc2(label)}</button></div></div>`; }
  else card=`<div style="${U_CARD};align-items:center;text-align:center"><span style="font-size:13px;font-weight:800;color:#c9b9a2">Escolha mais ${need-picked.length} ${need-picked.length===1?'item':'itens'} na lista abaixo.</span></div>`;
  const it0=g.items[0];
  return `<div style="display:flex;align-items:center;gap:8px;margin-right:12px">${back.replace('align-self:flex-start;','flex:none;')}<div style="min-width:0;display:flex;flex-direction:column;line-height:1.2"><span style="font-size:13px;font-weight:900;color:${xRarT(it0)};overflow-wrap:anywhere">${esc2(iname(it0))}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">${esc2(uFamName(it0)?SLOT[g.slot].n+' · '+uFamName(it0):SLOT[g.slot].n)} · ${esc2(RN(g.r))} · ${esc2(uEraName(g.e))}</span></div></div>
    ${stage}${card}
    <div style="margin:0 12px;font-size:12px;font-weight:900;color:#c9b9a2">Itens iguais (${g.items.length}) · toque para pôr ou tirar da vaga</div>
    <div role="group" aria-label="Itens do grupo" style="margin:0 12px;display:flex;flex-wrap:wrap;gap:6px">${pool}</div>`; }

/* FC antes → depois na escala de exibição (Sys.fc.viewText): antes = FC de agora; depois = agora + a troca */
function uBA(sw,before){ let b=0; try{ b=before!=null?before:Sys.fc.compute(S,Sys.host); }catch(e){ b=0; } const vt=v=>{ try{ return Sys.fc.viewText(v); }catch(e){ return String(Math.round(v)); } };
  return {b:vt(b),a:vt(Math.max(0,b+(+sw||0)))}; }
/* ---------- cartão do resultado ---------- */
function uResult(d){ const R=XU.res, it=itemOf(R.id);
  if(!it) return uEmpty('Fusão feita','O item novo está na mochila.');
  return `<div class="fu-pop" role="dialog" aria-label="Resultado da fusão" style="${U_CARD};align-items:center;text-align:center;border-color:#ffc94a;box-shadow:0 0 18px rgba(255,201,74,.35)">
    <span class="lil" style="font-size:26px;color:#ffc94a;text-shadow:0 3px 0 #6a3a08">Fusão concluída!</span>
    <span style="position:relative">${uThumb(it,84)}${R.eq?uEqTag:''}</span>
    <span style="font-size:15px;font-weight:900;color:${xRarT(it)};margin-top:4px">${esc2(iname(it))}</span>
    <div style="display:flex;align-items:center;gap:8px">${uStars(R.from,14)}${U_ARROW}${uStars(R.to,20)}</div>
    <span style="font-size:12px;font-weight:900;color:#c9b9a2">Qualidade ${n0(uQp(it))} · Nv. ${it.lvl||1}</span>
    <div style="display:flex;flex-direction:column;align-items:center;padding:6px 14px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">
      <span style="font-size:11px;font-weight:800;color:#c9b9a2">${R.eq?'Sua FC':'FC se equipar'}</span>
      <span style="display:flex;align-items:center;gap:6px"><span style="font-size:14px;font-weight:900">${esc2(R.b||'')}</span>${U_ARROW}<span class="lil" style="font-size:22px;color:${esc2(R.color)}">${esc2(R.a||'')}</span></span>
      <span style="font-size:12px;font-weight:900;color:${esc2(R.color)}">${R.text?esc2(R.text):'sem mudança'}</span></div>
    <button class="lil fu-gold" data-x="done" aria-label="Continuar" style="width:100%;height:${Math.max(52,uTouch(d))}px;border-radius:16px;font-size:20px;margin-top:4px">Continuar</button></div>`; }

/* ---------- aba Adormecidos ---------- */
function uSeen(){ if(!S.sys||typeof S.sys!=='object') S.sys={}; let o=S.sys.fuseSeen; if(!o||typeof o!=='object') o=S.sys.fuseSeen={}; if(!Array.isArray(o.dorm)) o.dorm=null; return o; }
function uDormList(){ return (S.inv||[]).filter(it=>it&&SLOT[it.slot]&&uDorm(it).dormant); }
/* acordaram desde a última visita: estavam na lista vista e hoje não estão adormecidos (só com a regra ligada) */
function uWoke(){ let on=false; try{ on=Sys.stats.DATA.futureEra.on===true; }catch(e){} const o=uSeen(); if(!on||!o.dorm) return [];
  return o.dorm.map(id=>itemOf(id)).filter(it=>it&&!uDorm(it).dormant); }
function uMarkSeen(){ try{ uSeen().dorm=uDormList().map(x=>x.id); }catch(e){} }
function uDormTab(){ const L=uDormList(), W=uWoke(), now=uEraNow();
  if(!L.length&&!W.length) return uEmpty('Nenhum item adormecido','Item de era futura fica adormecido (rende menos) até você chegar na era dele. Ele acorda sozinho, sem custo.',`<svg width="56" height="56" viewBox="0 0 24 24" fill="#8a7458" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"></path></svg>`);
  const row=(it,woke)=>{ const di=uDorm(it), we=woke?(it.e|0):di.wakeEra, pct=woke?100:Math.round(Math.min(1,(now+1)/(we+1))*100);
    return `<div role="listitem" class="${woke?'fu-woke':''}" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#1d1611;border:2px solid ${woke?'#5fd068':'#4a3a2b'};box-sizing:border-box">
      ${uThumb(it,52)}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <div style="display:flex;align-items:center;gap:4px 6px;flex-wrap:wrap"><span style="min-width:0;font-size:13px;font-weight:900;color:${xRarT(it)};line-height:1.2;overflow-wrap:anywhere">${esc2(iname(it))}</span>
          ${woke?'<span style="flex:none;padding:1px 8px;border-radius:8px;background:#5fd068;color:#0d2410;font-size:11px;font-weight:900">Acordou!</span>':''}</div>
        <span style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:800;color:${woke?'#5fd068':'#c9a4ff'}">${woke?'Já rende com a força da era dele':U_MOON+esc2(di.label||'')}</span>
        <div role="img" aria-label="Sua era ${now} de ${we}" style="height:8px;border-radius:4px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden"><div style="width:${pct}%;height:100%;background:${woke?'#5fd068':'linear-gradient(90deg,#7a5cff,#c9a4ff)'}"></div></div>
        ${woke?'':`<span style="font-size:11px;font-weight:800;color:#c9b9a2">Chegue na era ${we} (${esc2(uEraName(we))}) para acordar</span>`}</div></div>`; };
  return `<div role="list" aria-label="Itens adormecidos" style="margin:0 12px;display:flex;flex-direction:column;gap:8px">${W.map(it=>row(it,true)).join('')}${L.map(it=>row(it,false)).join('')}</div>
    <div style="margin:0 12px;font-size:11px;font-weight:800;color:#8a7458;line-height:1.25">Adormecido rende como no máximo uma era à frente e fica no nível 1; acorda sozinho quando você chega na era dele.</div>`; }

/* ---------- desenho ---------- */
function scrFuse(){
  const d=xDims(U_MINH), sc0=XU.anim?null:document.getElementById('fu_scroll'), y0=sc0?(+sc0.scrollTop||0):0;
  let body='';
  if(XU.tab==='dorm') body=uDormTab();
  else if(!uQOn()) body=uEmpty('Em breve','A qualidade e a fusão abrem em breve. Itens iguais poderão virar 1 com mais estrelas.',`<span style="display:flex;gap:2px">${uStar(true,22)}${uStar(true,22)}${uStar(false,22)}</span>`);
  else if(XU.res) body=uResult(d);
  else { const g=XU.key?uGroup(XU.key):null; if(XU.key&&!g){ XU.key=null; XU.pick=[]; } body=g?uBench(d,g):uList(d); }
  V.innerHTML=xWrap(d,XU.anim?'fu-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="fu_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:8px 0 14px;box-sizing:border-box">
      ${uTabs(d)}${body}</div>
    <div id="fu_toast">${XU.toast&&Date.now()-XU.toastT<1500?uToastHtml(XU.toast):''}</div></div>`);
  if(y0){ const sc=document.getElementById('fu_scroll'); if(sc) sc.scrollTop=y0; }
  XU.anim=false; XU.sig=uSig();
}
/* o que muda por fora (ouro, drop novo, era nova, chave da qualidade): o tick redesenha só quando muda */
function uSig(){ try{ return [XU.tab,uQOn()?1:0,uEraNow(),(S.inv||[]).length,S.nextId,Math.floor(S.gold||0),XU.key||'',XU.pick.join(',')].join('|'); }catch(e){ return ''; } }

function uClick(b){
  const a=b.dataset.x; if(XU.busy) return;
  if(a==='tab'){ const t=b.dataset.t==='dorm'?'dorm':'fuse'; snd('ui_tap'); if(t===XU.tab) return; if(XU.tab==='dorm') uMarkSeen(); XU.tab=t; XU.anim=true; render(); }
  else if(a==='grp'){ const g=uGroup(b.dataset.k); snd('ui_tap'); if(!g) return; XU.key=g.k; XU.pick=uAutoPick(g); XU.anim=true; render(); }
  else if(a==='list'){ snd('ui_tap'); XU.key=null; XU.pick=[]; XU.anim=true; render(); }
  else if(a==='slot'){ const i=+b.dataset.i|0; snd('ui_tap'); if(XU.pick[i]==null){ uToast('Toque num item da lista para pôr na vaga'); return; } XU.pick.splice(i,1); render(); }
  else if(a==='pick'){ const id=+b.dataset.id, j=XU.pick.indexOf(id), need=uQ().fusion.count; snd('ui_tap');
    if(j>=0) XU.pick.splice(j,1); else if(XU.pick.length<need) XU.pick.push(id); else { XU.pick[need-1]=id; } render(); }
  else if(a==='fuse') uFuse();
  else if(a==='done'){ snd('ui_tap'); XU.res=null; const g=XU.key?uGroup(XU.key):null; if(g) XU.pick=uAutoPick(g); else { XU.key=null; XU.pick=[]; } XU.anim=true; render(); }
}
/* item novo a partir do resultado do canFuse, no formato da mochila (normItem do js/farm.js quando existe; ele zera lvl/gold, então voltam aqui) */
function uMake(res,best){ let it; try{ it=typeof normItem==='function'?normItem(res):Object.assign({},res); }catch(e){ it=Object.assign({},res); }
  it.lvl=res.lvl; it.gold=res.gold; it.qp=res.qp; if(Number.isInteger(res.look)) it.look=res.look;
  if(it.slot==='wing'&&best&&best.wing){ let ok=best.wing==='angel'||best.wing==='demon'; try{ ok=!!Sys.stats.DATA.wingTypes[best.wing]; }catch(e){} if(ok) it.wing=best.wing; }   /* asas novas também (o desenho decide pelo Sys.stats.wingOf) */
  const top=(S.inv||[]).reduce((m,x)=>Math.max(m,+(x&&x.id)||0),0); if(!(S.nextId>top)) S.nextId=top+1;   /* F4 (QA): nextId atrasado reaproveitaria o id de um item da mochila */
  it.id=S.nextId++; it.gotAt=Date.now(); it.nw=1; try{ Sys.stats.ensureSubs(it); }catch(e){} return it; }
function uFuse(){
  const items=uPicked(), H=Sys.host, c=Sys.stats.canFuse(S,H,items);
  if(!c.ok){ snd('ui_tap'); uToast(c.reason==='money'?needMsg('gold',c.gold):c.reason==='max'?'5 estrelas não funde':c.reason==='off'?'A fusão abre em breve':c.reason==='different'?(new Set(items.map(uFam)).size>1?'Os 3 precisam ser da mesma família':'Os 3 precisam ser iguais'):'Escolha 3 itens'); return; }
  const slot=items[0].slot, wasEq=items.some(uIsEq), best=items.slice().sort((x,y)=>uQp(y)-uQp(x))[0]; let made=null, rr=null;
  const run=()=>{ const r=Sys.stats.fuse(S,H,items); rr=r; if(!r||!r.ok) return r;
    const it=uMake(r.result,best), gone=r.consumed||items.map(x=>x.id);
    S.inv=S.inv.filter(x=>gone.indexOf(x.id)<0); S.inv.push(it);
    if(wasEq||gone.indexOf(S.eq[slot])>=0) S.eq[slot]=it.id;
    try{ if(typeof XG!=='undefined'&&XG&&gone.indexOf(XG.sel)>=0) XG.sel=null; }catch(e){}
    made=it; return r; };
  let dl=null; try{ dl=Sys.fc&&Sys.fc.measure?Sys.fc.measure(S,H,run).delta:(run(),null); }catch(e){ if(!rr) run(); }
  if(!made){ snd('ui_tap'); uToast(rr&&rr.reason==='money'?needMsg('gold',c.gold):'Não deu para fundir agora'); render(); return; }
  let text=dl?dl.text:'', color=dl?dl.color:'#c9b9a2', ba=dl?uBA(dl.after-dl.before,dl.before):uBA(0);
  if(!wasEq){ try{ const sw=Sys.fc.itemFC(S,H,made).swap, d2=Sys.fc.delta(0,sw); text=d2.text; color=d2.color; ba=uBA(sw); }catch(e){} }
  statsChanged();
  XU.res={id:made.id,eq:wasEq,from:c.fromStars,to:c.toStars,text,color,b:ba.b,a:ba.a};
  if(uReduced()){ snd('upgrade'); vib(40); render(); return; }
  snd('ui_tap'); XU.busy=true; XU.fx='fuse'; const keep=XU.res; XU.res=null;
  render();
  clearTimeout(XU.t1); XU.t1=setTimeout(()=>{ XU.busy=false; XU.fx=null; XU.res=keep; snd('upgrade'); vib(40); if(uOn()) render(); },800);
}

Panels.add('fuse',{title:'Fusão',parent:'gear',render:scrFuse,click:uClick,
  tick(){ if(XU.busy||XU.fx||XU.res) return; if(XU.sig&&uSig()!==XU.sig&&uOn()) render(); },
  busy(){ return XU.busy||!!XU.fx; },
  onOpen(o){ uStop(); XU.anim=true; XU.res=null; XU.toast=''; XU.key=null; XU.pick=[]; XU.tab=o&&o.tab==='dorm'?'dorm':'fuse';
    try{ const s=uSeen(); if(!s.dorm) s.dorm=uDormList().map(x=>x.id); }catch(e){} },
  onClose(){ if(XU.busy&&XU.fx){ XU.busy=false; XU.fx=null; } uStop(); if(XU.tab==='dorm') uMarkSeen(); XU.res=null; XU.toast=''; } });
