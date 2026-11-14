'use strict';
/* ================= TELA PETS DE APOIO + BÔNUS POR TER (docs/LIGACOES_LOM_A.md, seção 3) — NASCE DESLIGADA (PANEL_ON.petsup = false) =================
   Faixa da Coleção (bônus por ter), o pet principal com os 2 encaixes de Apoio e a folha para escolher o pet de cada encaixe.
   NENHUMA regra e NENHUM número aqui. Tudo vem do js/sys/petsupport.js (Sys.petSupport):
   - tudo o que a tela mostra: Sys.petSupport.view(S) → {main, owned, collection:{count, pct, capped, cap}, slots:[{i, open, need, id, name, bond, camp}],
     candidates:[{id, name, r, camp, bond, inSlot}]};
   - pôr / trocar / tirar: Sys.petSupport.setSupport(S, i, id | null). UMA chamada por toque; a recusa (locked, main, camp, pet) vira o aviso.
     O módulo NÃO avisa o jogo: depois de um ok a tela chama statsChanged() (a FC muda) e save().
   Nada aqui gasta recurso (trocar o apoio é livre): não há dois toques. Nada à venda: os pets vêm das fontes da tela de Pets.
   TRANCADO POR NÍVEL: a mesma regra do Menu (xUnlocked('pet') / xUnlockLv('pet') do js/screens.js); o módulo não tem portão próprio.
   Esta tela é um painel à parte (a especificação põe a faixa e os encaixes DENTRO da tela de Pets: o Engenheiro decide se liga por um botão na
   tela de Pets ou se traz estes blocos para o js/p_pets2.js).
   Chaves: PANEL_ON.petsup (esta tela) e Sys.petSupport.DATA.on (o sistema). Sistema desligado: aviso e Voltar, sem escrever no save.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='petsup';

/* ---------- ÍCONE DO PET: UMA função (psIcon). Usa o ícone que já existe em assets/icons/pets (<sprite>_<ref|mid|evo>.png) para os sprites da lista
   PS_HAS; pet sem ícone em disco usa a reserva (medalhão na cor da raridade com a inicial). A Arte que entregar um ícone novo entra em PS_HAS. ---------- */
const PS_DIR='assets/icons/pets/', PS_FILE=['ref','mid','evo'];
const PS_HAS=['era0_mammoth','era1_sphinx','era2_dragon','era3_parrot','era4_mechdog','era7_cerberus','era8_pegasus','pet_falcon','pet_panther','pet_shadowwolf','prism_fox'];
const PS_RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade das telas V2 */
const PS_RN=['Básico','Raro','Épico','Mítico','Lendário','Prismático'];
const PS_LOCK='<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#241b14" stroke="#4a3a2b" stroke-width="2"/><path d="M14 19h12v9H14zM16.5 19v-3.5a3.5 3.5 0 017 0V19" fill="none" stroke="#c9d0f5" stroke-width="2.2" stroke-linejoin="round"/></svg>';
const PS_PLUS='<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="rgba(22,16,12,.5)" stroke="rgba(255,236,200,.4)" stroke-width="2" stroke-dasharray="5 4"/><path d="M20 12v16M12 20h16" fill="none" stroke="#ffe9c4" stroke-width="3" stroke-linecap="round"/></svg>';
function psIcon(id,name,r){ let sp='', st=0;
  try{ const P=Sys.pet, d=P.DATA.pets.find(p=>p.id===id); sp=d&&d.sprite?String(d.sprite):''; const s=P.stage(S,id); st=s&&typeof s.index==='number'?Math.max(0,Math.min(2,s.index|0)):0; }catch(e){ sp=''; }
  if(sp&&PS_HAS.indexOf(sp)>=0) return '<img src="'+esc2(PS_DIR+sp+'_'+PS_FILE[st]+'.png')+'" alt="">';
  const c=PS_RC[Math.max(0,Math.min(5,r|0))];
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#241b14"/><circle cx="20" cy="20" r="16" fill="'+c+'"/><text x="20" y="26.5" text-anchor="middle" font-size="18" font-weight="900" fill="#1d1611">'+esc2(String(name||'?').trim().charAt(0).toUpperCase()||'?')+'</text></svg>'; }
const pIco=(id,name,r)=>'<span class="ps-i">'+psIcon(id,name,r)+'</span>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const pM=()=>(window.Sys&&Sys.petSupport)||null;
const pHas=()=>{ const M=pM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.setSupport==='function'); };
const pOk=()=>{ try{ return pHas()&&pM().DATA.on===true; }catch(e){ return false; } };
const pSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const pRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const pStore=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); }catch(e){} try{ if(typeof save==='function') save(); }catch(e){} };
const pNow=()=>Date.now();
const pN=v=>{ try{ return typeof n0==='function'?n0(v):String(Math.round(+v||0)); }catch(e){ return String(Math.round(+v||0)); } };
const pPl=(n,one,many)=>pN(n)+' '+(n===1?one:many);
const pPct=v=>(Math.round((+v||0)*100)/100).toString().replace('.',',')+'%';
const pView=()=>{ try{ const v=pM().view(S); return v&&Array.isArray(v.slots)&&Array.isArray(v.candidates)&&v.collection?v:null; }catch(e){ return null; } };
/* trancado por nível: a mesma regra do Menu. 0 = aberto; número = nível em que abre */
function pLockLv(){ try{ if(typeof xUnlocked==='function'&&!xUnlocked('pet')) return Math.max(1,(typeof xUnlockLv==='function'?xUnlockLv('pet'):0)|0)||1; }catch(e){} return 0; }
/* nome e raridade do pet principal (o view do módulo só manda o id) */
function pMain(id){ let name=String(id||''), r=0; try{ const P=Sys.pet, d=P.DATA.pets.find(p=>p.id===id); if(d){ name=d.name||name; r=d.r|0; } }catch(e){} return {id,name,r}; }

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.ps-root): o revestimento do mock troca só este bloco ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.ps-root{--ps-ink:#f6ecdf;--ps-mut:#c9b8a2;--ps-soft:#efe3d0;--ps-gold:#ffc94a;--ps-gold1:#ffe07a;--ps-gold2:#f2a826;--ps-goldsh:#9a5a10;--ps-goldink:#2a1403;
  --ps-sheet:#1d1611;--ps-sheetline:#4a3a2b;--ps-card:rgba(0,0,0,.42);--ps-line:rgba(255,236,200,.16);--ps-ok:#7fe07a;--ps-bad:#ffb3a8;--ps-lockink:#b8a690;color:var(--ps-ink)}
.ps-root,.ps-root *{box-sizing:border-box}
.ps-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ps-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.ps-in{animation:ps-in .25s ease-out both}
@keyframes ps-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes ps-up{from{transform:translateY(30px);opacity:.3}}
.ps-i{flex:none;display:block;width:48px;height:48px}
.ps-i svg,.ps-i img{display:block;width:100%;height:100%;object-fit:contain}
.ps-top{flex:none;margin:8px 12px 0;padding:8px 12px;border-radius:14px;background:var(--ps-card);border:1px solid var(--ps-line);min-width:0}
.ps-top small{display:block;font-size:11px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--ps-mut);overflow-wrap:anywhere}
.ps-top b{display:block;margin-top:2px;font-size:14px;font-weight:900;line-height:1.3;color:var(--ps-ok);overflow-wrap:anywhere}
.ps-top b.z{color:var(--ps-mut)}
.ps-top p{margin:3px 0 0;font-size:11.5px;font-weight:800;line-height:1.4;color:var(--ps-mut);overflow-wrap:anywhere}
.ps-msg{flex:none;min-height:20px;margin:4px 12px 0;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--ps-gold1);overflow-wrap:anywhere}
.ps-msg.bad{color:var(--ps-bad)}
.ps-body{position:relative;flex:1;min-height:0;padding:4px 12px 20px}
.ps-h5{margin:10px 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--ps-mut);font-weight:900}
.ps-stage{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:stretch}
.ps-main{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:140px;padding:8px 4px;border-radius:14px;background:var(--ps-card);border:2px solid var(--ps-gold);text-align:center;min-width:0}
.ps-main .ps-i{width:72px;height:72px}
.ps-main b,.ps-sl b{font-size:12px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.ps-main small,.ps-sl small{font-size:10px;font-weight:800;color:var(--ps-mut);line-height:1.25;overflow-wrap:anywhere}
.ps-sl,.xs .ps-sl{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:140px;padding:8px 4px;border-radius:14px;border:1.5px dashed rgba(255,236,200,.3);background:rgba(0,0,0,.4);color:var(--ps-ink);text-align:center;min-width:0}
.ps-sl.full,.xs .ps-sl.full{border-style:solid;border-color:var(--ps-line);background:var(--ps-card)}
.ps-sl.lock b{color:var(--ps-lockink)}
.ps-sl small.ok{color:var(--ps-ok)}
.ps-sl small.bad{color:var(--ps-bad)}
.ps-sl:active,.ps-rw:active{transform:translateY(2px)}
.ps-box{margin-top:10px;border-radius:14px;background:var(--ps-card);border:1px solid var(--ps-line);padding:8px 12px 10px;min-width:0}
.ps-box .ps-h5{margin-top:0}
.ps-box ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.ps-box p{margin:6px 0 0;font-size:12px;font-weight:800;line-height:1.45;color:var(--ps-soft);overflow-wrap:anywhere}
.ps-box p b{color:var(--ps-ok)}
.ps-none{border-radius:16px;background:rgba(255,201,74,.08);border:1px solid rgba(255,201,74,.35);padding:10px 12px;margin-top:8px;min-width:0}
.ps-none b{display:block;font-size:14px;font-weight:900;color:var(--ps-soft);line-height:1.25}
.ps-none p{margin:4px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:var(--ps-soft);overflow-wrap:anywhere}
.ps-shade{position:absolute;inset:0;z-index:2;background:rgba(10,6,3,.66)}
.ps-sh{position:absolute;left:0;right:0;bottom:0;z-index:3;max-height:92%;border-radius:22px 22px 0 0;background:var(--ps-sheet);border-top:2px solid var(--ps-sheetline);padding:14px 14px 18px;animation:ps-up .28s ease-out;box-shadow:0 -10px 30px rgba(0,0,0,.55)}
.ps-sh h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.1;overflow-wrap:anywhere}
.ps-sh>p{margin:3px 0 0;font-size:12px;font-weight:800;color:var(--ps-mut);line-height:1.35;overflow-wrap:anywhere}
.ps-list{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.ps-rw,.xs .ps-rw{display:flex;align-items:center;gap:9px;width:100%;min-height:58px;padding:6px 10px;border-radius:14px;background:rgba(0,0,0,.3);border:1px solid var(--ps-line);color:var(--ps-ink);text-align:left;min-width:0}
.ps-rw .ps-i{width:44px;height:44px}
.ps-rw .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.ps-rw b{font-size:13.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.ps-rw small{font-size:11px;font-weight:800;color:var(--ps-mut);line-height:1.25;overflow-wrap:anywhere}
.ps-rw em{flex:none;font-style:normal;font-size:13px;font-weight:900;color:var(--ps-ok);text-align:right;line-height:1.2}
.ps-rw.dim,.xs .ps-rw.dim{opacity:.5;border-style:dashed}
.ps-rw.dim em{color:var(--ps-mut)}
.ps-rw.on,.xs .ps-rw.on{border-color:var(--ps-gold)}
.ps-sh .ps-msg{margin:8px 0 0}
.ps-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.ps-bt,.xs .ps-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--ps-gold1),var(--ps-gold2));color:#2a1403;box-shadow:0 3px 0 var(--ps-goldsh)}
.ps-bt.o,.xs .ps-bt.o{background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:var(--ps-ink);box-shadow:none}
.ps-bt:active{transform:translateY(2px)}
.ps-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.ps-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--ps-soft);overflow-wrap:anywhere}
.ps-off .ps-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.ps-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={slot:-1,msg:'',bad:false,msgT:0,anim:true,top:true,sig:''};
function pSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=pNow(); }
const pMsgHtml=id=>'<div id="'+id+'" class="ps-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
const pBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.55,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
/* motivo de uma recusa do módulo, em texto de jogador */
/* Se o módulo ganhar a função why (como os outros três do bloco A), o texto passa a vir dela; hoje ele não tem, e vale a tabela daqui. */
const PS_WHY={main:'Este é o pet principal: ele já luta na frente',camp:'Este pet está no acampamento. Tire-o da tenda primeiro',pet:'Você não tem este pet',off:'Os pets de apoio ainda não abriram',slot:'Este espaço não existe'};
function pReason(r){ const why=r&&r.reason;
  if(why==='locked') return 'Tenha '+pPl(r.need|0,'pet','pets')+' para abrir este espaço';
  let t=''; try{ const M=pM(); if(M&&typeof M.why==='function') t=String(M.why(r)||''); }catch(e){ t=''; }
  return t||PS_WHY[why]||'Não dá agora'; }

/* ---------- desenho ---------- */
function pOffHtml(d,msg){ V.innerHTML=xWrap(d,'ps-root '+(X.anim?'ps-in':''),'<div class="ps-w" style="background:'+pBg()+'"><div class="ps-off"><span role="alert">'+esc2(msg)+'</span><button class="ps-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
function pSlot(s,v){ const lb='Apoio '+(s.i+1);
  if(!s.open) return '<button class="ps-sl lock" data-x="slot" data-i="'+s.i+'" aria-label="'+esc2(lb+', trancado: tenha '+s.need+' pets')+'"><span class="ps-i">'+PS_LOCK+'</span><b>'+lb+'</b><small>Tenha '+pPl(s.need|0,'pet','pets')+'</small><small>Você tem '+pN(v.owned)+'</small></button>';
  if(!s.id) return '<button class="ps-sl" data-x="slot" data-i="'+s.i+'" aria-label="'+esc2(lb+', vazio: toque para escolher')+'"><span class="ps-i">'+PS_PLUS+'</span><b>'+lb+'</b><small>Toque para escolher</small></button>';
  const c=v.candidates.find(q=>q.id===s.id)||{r:0};
  const eff=s.bond>0?'<small class="ok">+'+pPct(s.bond)+' Vida</small>':s.camp?'<small class="bad">no acampamento: sem efeito</small>':'<small class="bad">sem efeito: precisa do pet principal lutando</small>';
  return '<button class="ps-sl full" data-x="slot" data-i="'+s.i+'" aria-label="'+esc2(lb+': '+s.name)+'">'+pIco(s.id,s.name,c.r)+'<b>'+esc2(s.name)+'</b><small>'+lb+'</small>'+eff+'</button>'; }
function pSheet(v){ const s=v.slots[X.slot], lb='Apoio '+(s.i+1);
  let h='<div class="ps-shade" data-x="close"></div><div class="ps-sh x-scroll" role="dialog" aria-label="'+esc2('Escolher o pet do '+lb)+'">';
  h+='<h3>'+lb+'</h3><p>Escolha um pet para ficar atrás do principal. Ele não ataca: passa parte da vida dele ao herói.</p>'+pMsgHtml('ps_msg2');
  if(!v.candidates.length) h+='<section class="ps-none"><b>Nenhum pet livre</b><p>O pet principal não pode ser apoio. Consiga mais pets na tela de Pets.</p></section>';
  h+='<div class="ps-list">'+v.candidates.map(c=>{ const here=c.inSlot===s.i, other=c.inSlot>=0&&!here;
    const sub=c.camp?'no acampamento':here?'neste espaço':other?'no Apoio '+(c.inSlot+1)+': toque para trocar':(PS_RN[c.r]||'');
    return '<button class="ps-rw'+(c.camp?' dim':'')+(here?' on':'')+'" data-x="pick" data-id="'+esc2(c.id)+'" aria-label="'+esc2(c.name+', +'+pPct(c.bond)+' de Vida'+(c.camp?', no acampamento':''))+'">'+pIco(c.id,c.name,c.r)+'<span class="t"><b>'+esc2(c.name)+'</b><small>'+esc2(sub)+'</small></span><em>+'+pPct(c.bond)+' Vida</em></button>'; }).join('')+'</div>';
  h+='<div class="ps-acts">'+(s.id?'<button class="ps-bt o" data-x="clear">Tirar do '+lb+'</button>':'')+'<button class="ps-bt o" data-x="close">Fechar</button></div></div>';
  return h; }
function pDraw(){
  const d=xDims(240)||{};
  if(!pHas()){ pOffHtml(d,'Pets de apoio indisponíveis agora.'); return; }
  if(!pOk()){ pOffHtml(d,'Os pets de apoio ainda não abriram.'); return; }
  const lk=pLockLv(); if(lk){ pOffHtml(d,'Os pets abrem no nível '+pN(lk)+'. Continue vencendo fases para chegar lá.'); X.sig='lock'; return; }
  const v=pView(); if(!v){ pOffHtml(d,'Pets de apoio indisponíveis agora.'); return; }
  if(X.slot>=0&&!(v.slots[X.slot]&&v.slots[X.slot].open)) X.slot=-1;
  let y0=0; try{ const sc0=X.top?null:document.getElementById('ps_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const C=v.collection, D=pM().DATA;
  let h='<div class="ps-top"><small>Coleção: '+pPl(C.count|0,'pet','pets')+'</small><b'+(C.pct>0?'':' class="z"')+'>ATQ +'+pPct(C.pct)+' · Vida +'+pPct(C.pct)+(C.capped?' (no teto)':'')+'</b><p>Cada pet que você tem soma ATQ e Vida, mesmo fora da luta. Teto de +'+pPct(C.cap)+'.</p></div>'+(X.slot>=0?'<div class="ps-msg"></div>':pMsgHtml('ps_msg'));
  h+='<div id="ps_scroll" class="x-scroll ps-body">';
  if(!v.owned) h+='<section class="ps-none"><b>Você ainda não tem pets</b><p>Os pets vêm dos ovos e das fontes fixas da tela de Pets. Com '+pN(D.slotNeed[0])+' pets abre o 1º espaço de apoio; com '+pN(D.slotNeed[1])+', o 2º.</p></section>';
  else if(!v.main) h+='<section class="ps-none"><b>Sem pet principal</b><p>Escolha o pet principal na tela de Pets. Sem ele lutando, o apoio não vale.</p></section>';
  h+='<div class="ps-h5">Na luta</div><div class="ps-stage">';
  if(v.main){ const m=pMain(v.main); h+='<div class="ps-main" role="img" aria-label="'+esc2('Pet principal: '+m.name)+'">'+pIco(m.id,m.name,m.r)+'<b>'+esc2(m.name)+'</b><small>Principal: ataca na frente</small></div>'; }
  else h+='<div class="ps-main" style="border-style:dashed" role="img" aria-label="Sem pet principal"><span class="ps-i">'+PS_PLUS+'</span><b>Principal</b><small>Escolha na tela de Pets</small></div>';
  h+=v.slots.map(s=>pSlot(s,v)).join('')+'</div>';
  h+='<section class="ps-box"><div class="ps-h5">Como funciona</div><ul><li>O principal é o único que ataca e fica sempre na frente.</li><li>O apoio não ataca e não é alvo: passa '+pN(Math.round((+D.share||0)*100))+'% do lado de vida dele como Vida do herói.</li><li>Só vale com o pet principal lutando.</li><li>Pet numa tenda do acampamento não conta como apoio.</li><li>Trocar o principal para um pet de apoio tira esse pet do espaço.</li></ul><p><b>Nada à venda.</b> Trocar o apoio é livre e não gasta nada.</p></section>';
  h+='<div class="ps-acts"><button class="ps-bt o" data-x="pets">Abrir a tela de Pets</button></div></div>';
  if(X.slot>=0) h+=pSheet(v);
  V.innerHTML=xWrap(d,'ps-root '+(X.anim?'ps-in':''),'<div class="ps-w" style="background:'+pBg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=pSig();
  if(y0){ try{ const sc=document.getElementById('ps_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
}
/* assinatura do que muda por fora (pet novo, principal trocado, pet que entra na tenda, nível): leitura crua do save */
function pSig(){ try{ const p=S.sys&&S.sys.pet||{}, c=S.sys&&S.sys.camp||{}; return JSON.stringify([S.sys&&S.sys.petSupport||null,p.eq||null,Object.keys(p.owned||{}),c.tents||null,pLockLv()]); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
function pSet(i,id,okMsg){ let r=null; try{ r=pM().setSupport(S,i,id); }catch(e){ r={ok:false}; }
  if(r&&r.ok){ pSnd('ui_ok'); pStore(); pSay(okMsg); return true; }
  pSnd('ui_tap'); pSay(pReason(r),true); return false; }
const ACT={
  back(){ pSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  close(){ pSnd('ui_tap'); X.slot=-1; X.msg=''; pRedraw(); },
  pets(){ pSnd('ui_tap'); let ok=false; try{ ok=!!(window.Panels&&typeof Panels.open==='function'&&Panels.open('pets',{from:N})); }catch(e){ ok=false; }
    if(!ok){ pSay('A tela de Pets abre pelo Menu.',true); pRedraw(); } },
  slot(b){ const i=parseInt(b.dataset.i,10), v=pView(); if(!v||!(i>=0)||!v.slots[i]) return; pSnd('ui_tap'); const s=v.slots[i];
    if(!s.open){ X.slot=-1; pSay(pReason({reason:'locked',need:s.need}),true); pRedraw(); return; }
    X.slot=i; X.msg=''; pRedraw(); },
  pick(b){ const id=String(b.dataset.id||''), v=pView(); if(!v||X.slot<0||!v.slots[X.slot]) return; const c=v.candidates.find(q=>q.id===id), i=X.slot;
    if(c&&c.inSlot===i){ pSnd('ui_tap'); pSay(c.name+' já está neste espaço'); pRedraw(); return; }
    if(pSet(i,id,(c?c.name:'Pet')+' no Apoio '+(i+1)+(c&&c.bond>0?' · +'+pPct(c.bond)+' Vida':''))) X.slot=-1;
    pRedraw(); },
  clear(){ const v=pView(); if(!v||X.slot<0||!v.slots[X.slot]) return; const s=v.slots[X.slot], i=X.slot;
    if(!s.id){ pSnd('ui_tap'); pSay('Este espaço já está vazio',true); pRedraw(); return; }
    if(pSet(i,null,s.name+' saiu do Apoio '+(i+1))) X.slot=-1;
    pRedraw(); } };
function pClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!pOk()||pLockLv()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function pUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  try{ if(pOk()&&!pLockLv()){ const v=pView(); if(v){ const ids=v.candidates.map(c=>c.id); if(v.main) ids.push(v.main);
      for(const id of ids){ const m=/src="([^"]+)"/.exec(psIcon(id,'',0)); if(m&&u.indexOf(m[1])<0) u.push(m[1]); } } } }catch(e){}
  return u; }
function pClearMsg(){ X.msg=''; try{ for(const id of ['ps_msg','ps_msg2']){ const el=document.getElementById(id); if(el) el.innerHTML=''; } }catch(e){} }

if(!('petsup' in PANEL_ON)) PANEL_ON.petsup=false;
Panels.add(N,{title:'Pets de apoio',actions:Object.keys(ACT),iconOf:psIcon,
  render(){ if(typeof pwGate==='function'){ if(pwGate(pUrls())) return; } else if(typeof xGate==='function'&&xGate(pUrls())) return; return pDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return pClick(b); },
  tick(){ if(!pOk()) return; if(X.sig==='lock'){ if(!pLockLv()) pRedraw(); return; }   /* chegou ao nível com a tela aberta: abre sozinha */
    if(X.msg&&pNow()-X.msgT>2600) pClearMsg(); if(X.sig&&X.sig!=='x'&&pSig()!==X.sig) pRedraw(); },
  busy(){ return false; },
  onOpen(){ X.slot=-1; X.msg=''; X.anim=true; X.top=true; X.sig=''; },
  onClose(){ X.slot=-1; X.msg=''; } });
})();
