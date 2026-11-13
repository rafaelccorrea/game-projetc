'use strict';
/* ================= PAINÉIS (altura fixa, sem rolagem, com paginação) =================
   Cada aba cabe na folha (40% da tela até a barra inferior). Ações: data-a em botões/cards. */
let passTab='pass';   // aba interna do Passe: 'pass' | 'mis' (Missões)
let skinEra=Math.min(S.eraMax,heroLook().weapon.e);   /* era da arma do ITEM equipado (S.skinEq.weapon não vale mais: decisão do dono) */
const PG={gear:0,pass:-1,mis:0,shop:0};
const setTb = px => V.style.setProperty('--tb',Math.max(38,Math.min(84,Math.floor(px)))+'px');
let HOSTH=0;   // altura disponível quando o painel antigo é desenhado dentro de outra tela (Coleção, dentro da Loja)
const bodyH = () => HOSTH||Math.max(260,(V.clientHeight||420)-26-(view==='pass'?60:0));
function pager(key,pages){ const p=PG[key]; return pages<=1?'':`<div class="pager"><button class="pgb" data-a="pg" data-k="${key}" data-d="-1" ${p<=0?'disabled':''}>‹</button><b>${p+1}/${pages}</b><button class="pgb" data-a="pg" data-k="${key}" data-d="1" ${p>=pages-1?'disabled':''}>›</button></div>`; }
const th2=(slot,e,r)=>`<span class="tb" style="border-color:${RAR[r].c}">${thumb(slot,e,r)}</span>`;

function renderBattle(){ V.innerHTML=''; }
function updHudExtra(){   // 4x por segundo: relógios das telas abertas (a faixa da fase e o Desafiar são do js/fullbattle.js)
  if(view==='shop'||view==='summon') updShop(); else if(view==='pass'&&typeof passTick==='function') passTick();
}

/* Equipamento, Invocar e Loja: js/screens.js (telas aprovadas no canvas). */

/* ---------- Skins ---------- */
function renderSkins(el,h){ el=el||V; HOSTH=h||0; try{ renderSkinsIn(el); }finally{ HOSTH=0; } }
function renderSkinsIn(el){
  if(skinEra!=='pass'&&skinEra>S.eraMax) skinEra=S.eraMax;
  const list=slot=>SKINS.filter(s=>s.slot===slot&&(skinEra==='pass'?s.pass:(!s.pass&&s.e===skinEra)));
  const pw=heroLook().weapon   /* a arma do item equipado: skin de arma não se escolhe mais */, pa=SKIN(pvSkin.armor||S.skinEq.armor);
  const useBtn=s=>S.skinEq[s.slot]===s.id?'':(S.skins.includes(s.id)?`<button class="btn sml" data-a="skin" data-id="${s.id}">Usar</button>`:'<span class="sm">na loja ou no passe</span>');
  const row=slot=>`<div class="grid5">${list(slot).map(s=>{ const own=S.skins.includes(s.id), on=S.skinEq[slot]===s.id, sel=(pvSkin[slot]||S.skinEq[slot])===s.id;
      return `<button class="tb big ${sel?'sel':''}" data-a="sk" data-id="${s.id}" style="border-color:${RAR[s.r].c};opacity:${own?1:.45}">${thumb(s.slot,s.e,s.r)}${on?'<i>em uso</i>':own?'':'<i>🔒</i>'}</button>`; }).join('')}</div>`;
  const small=bodyH()<390, pvh=small?86:124; setTb((bodyH()-pvh-72)/2-8);
  const eras=[...ERAS.map((E,e)=>e).filter(e=>e<=S.eraMax),'pass'], ei=eras.indexOf(skinEra);
  const own=skinEra==='pass'?SKINS.filter(s=>s.pass&&S.skins.includes(s.id)).length+'/6':SKINS.filter(s=>!s.pass&&s.e===skinEra&&S.skins.includes(s.id)).length+'/10';
  el.innerHTML=`<div class="pvrow ${small?'small':''}"><canvas id="pvc" style="width:${pvh}px;height:${pvh}px"></canvas><div class="pvt">
      <div class="sm">🗡️ <b>${pw.n}</b> ${rb(pw.r)}</div><div class="pvu"></div>
      <div class="sm">🛡️ <b>${pa.n}</b> ${rb(pa.r)}</div><div class="pvu">${useBtn(pa)}</div>
      ${small?'':`<div class="sm mut">Skin equipada dá bônus de ATK e HP (hoje +${String(Sys.skin.equippedPct(S)).replace('.',',')}%); coleção +${String(Sys.skin.collectionPct(S)).replace('.',',')}%.</div>`}</div></div>
    <div class="pager"><button class="pgb" data-a="sera" data-d="-1" ${ei<=0?'disabled':''}>‹</button><b>${skinEra==='pass'?'🏆 Passe':ERAS[skinEra].icon+' '+ERAS[skinEra].n} · ${own}</b><button class="pgb" data-a="sera" data-d="1" ${ei>=eras.length-1?'disabled':''}>›</button></div>
    ${row('armor')}`;
}

/* Passe e Missões (tela 08), Práticas e Títulos (tela 16) e resultado do chefe (tela 10): js/screens2.js */

/* ---------- ações novas ---------- */
V.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-a]'); if(!b) return; const a=b.dataset.a;
  if(a==='pg'){ PG[b.dataset.k]+=+b.dataset.d; }
  else if(a==='sera'){ const eras=[...ERAS.map((E,e)=>e).filter(e=>e<=S.eraMax),'pass']; skinEra=eras[Math.max(0,Math.min(eras.length-1,eras.indexOf(skinEra)+(+b.dataset.d)))]; }
  else if(a==='sk'){ const s=SKIN(b.dataset.id); if(!s||s.slot==='weapon') return; pvSkin[s.slot]=s.id; if(S.skins.includes(s.id)){ S.skinEq[s.slot]=s.id; pvSkin[s.slot]=null; preloadAssets(); statsChanged(); } }   // trocar a skin recalcula atributos e FC na hora
  else return;
  snd('ui_tap'); render();
});
