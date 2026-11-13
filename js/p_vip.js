'use strict';
/* ================= 18 CLUBE VIP — tela nova, nasce DESLIGADA (PANEL_ON.vip) =================
   Protótipo: docs/proto/VIP.dc.html. NENHUMA regra nem número aqui: tudo vem de Sys.vip (js/sys/vip.js):
   nível atual e pontos (level, progress), benefícios por nível (levelInfo(0..10)), moldura/aura/skin por nível. A tela só desenha e navega.
   O cabeçalho (Voltar, título, moedas, gemas) é do jogo (index.html/fullbattle.js); aqui só o conteúdo, na ordem do protótipo:
   legenda · vitrine do Kael (moldura + aura) + nível/progresso · carrossel dos níveis 1-10 · tabela "Sem VIP × Com VIP n" · botão fixo "Comprar VIP".
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - sem a faixa "NÚMEROS = PROPOSTA": é texto de desenvolvimento e os números já são os do Sys.vip;
   - sem preço e sem "[VALOR]": os pontos que faltam são os reais do Sys.vip.progress (o valor de cada nível é do dono); o botão de compra diz
     "Pagamento em breve" e abre o aviso do protótipo (nada é cobrado, nada é simulado);
   - a vitrine mostra o que o nível ESCOLHIDO dá: moldura animada só nos níveis que a têm (7+) e aura dourada só no nível que a tem (10);
   - setas do carrossel somem nos extremos (nenhum botão sem ação);
   - "Chaves/dia" mostra +N entradas de instância POR ÁREA (Sys.vip.levelInfo.keys), igual ao Sys.instances.
   Sem pedido a outros arquivos: o script entra pela lista de scripts de js/screens.js junto com os outros p_*.js (pedido Q-vip no reports/pedidos-entre-agentes.md). */
const XV={sel:1,cf:false,anim:true,sig:''};
const V_MINH=520;   /* altura mínima passada ao xDims; o que faltar rola (classe x-scroll) */
const V_ICON={spd:'M5 19l7-7-7-7M12 19l7-7-7-7',atk:'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6',gold:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M9 9.5h4.5a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5H15',
  keys:'M8 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM11 10h10M18 10v4M21 10v3',chest:'M3 10h18v10H3zM3 10l2-5h14l2 5M12 10v4',off:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  frame:'M4 4h16v16H4zM8 8h8v8H8z',skin:'M8 3l4 3 4-3 4 4-2 4v10H6V11L4 7z',aura:'M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z'};
const V_SPD=['x1 (x2 no nível 15)','x2 já','x2 já · x4 no nível 40'];
const V_CSS=`.pv-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pvk 1s steps(12,jump-none) infinite}
@keyframes pvk{from{background-position:0 0}to{background-position:100% 0}}
.pv-aura{background-image:url(assets/anim/aura/aura13.png);background-size:1600% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:pvk 1.333s steps(16,jump-none) infinite}
@property --pva{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes pvr{to{--pva:360deg}}
.pv-frame{position:absolute;inset:0;border-radius:20px;padding:3px;box-sizing:border-box;background:conic-gradient(from var(--pva,0deg),#8a4f0c,#ffe07a,#fff6d0,#f2a826,#8a4f0c,#ffe07a,#8a4f0c);animation:pvr 3s linear infinite}
.pv-frame0{position:absolute;inset:0;border-radius:20px;padding:3px;box-sizing:border-box;background:#6a4a1a}
.pv-in{width:100%;height:100%;border-radius:17px;background:radial-gradient(circle at 50% 62%,#5a3d12 0%,#2a1d0f 55%,#140e08 100%);overflow:hidden;position:relative}
.pv-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.4) 0deg 8deg,rgba(255,201,74,0) 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%);animation:pvs 16s linear infinite}
@keyframes pvs{to{transform:rotate(360deg)}}
.pv-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff3c4;box-shadow:0 0 10px 3px rgba(255,201,74,.9);animation:pvt 1.8s ease-in-out infinite}
@keyframes pvt{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1.2);opacity:1}}
.pv-badge{animation:pvb 2.4s ease-in-out infinite}
@keyframes pvb{0%,100%{filter:drop-shadow(0 0 6px rgba(255,201,74,.5))}50%{filter:drop-shadow(0 0 18px rgba(255,201,74,1))}}
.pv-gt{background:linear-gradient(100deg,#ffe07a 20%,#fff8de 45%,#f2a826 60%,#ffe07a 80%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pvg 3s linear infinite}
@keyframes pvg{from{background-position:120% 0}to{background-position:-130% 0}}
.pv-bar{transition:width .5s cubic-bezier(.2,.8,.2,1);position:relative;overflow:hidden}
.pv-bar::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);background-size:220% 100%;animation:pvg 2.2s linear infinite}
.pv-gold,.xs .pv-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 6px 0 #8a4f0c;border:0}
.pv-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.pv-cta{animation:pvc 1.5s ease-in-out infinite}
@keyframes pvc{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 8px rgba(255,201,74,.3)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 26px rgba(255,201,74,.95)}}
.pv-shine{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.55) 50%,transparent 65%);background-size:260% 100%;animation:pvg 2.6s ease-in-out infinite;pointer-events:none}
.pv-lvin{animation:pvl .35s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pvl{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
.pv-row{animation:pvw .3s ease-out both}
@keyframes pvw{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.pv-new{animation:pvn 1.2s ease-in-out infinite}
@keyframes pvn{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.pv-veil{animation:pvl .2s ease-out both}
@media (prefers-reduced-motion:reduce){.pv-kid,.pv-aura,.pv-frame,.pv-rays,.pv-spark,.pv-badge,.pv-gt,.pv-bar::after,.pv-cta,.pv-shine,.pv-new{animation:none}}`;

/* ---------- leituras do Sys.vip isoladas (reserva segura se o módulo não estiver carregado) ---------- */
const vOk=()=>!!(window.Sys&&Sys.vip&&Sys.vip.levelInfo&&Sys.vip.progress);
const vMax=()=>vOk()&&Sys.vip.DATA?Sys.vip.DATA.maxLevel:10;
const vCur=()=>{ try{ return vOk()?Sys.vip.level(S):0; }catch(e){ return 0; } };
const vClamp=n=>Math.max(1,Math.min(vMax(),n|0||1));
const vInfo=n=>Sys.vip.levelInfo(n);
const vEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function vInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pv_css')) return; const st=document.createElement('style'); st.id='pv_css'; st.textContent=V_CSS; document.head.appendChild(st); }
/* linhas da tabela: [chave, rótulo, formatador do valor] — cada valor vem do levelInfo; "base" é o nível 0 (sem VIP) */
const V_ROWS=[
  ['spd','Velocidade',i=>V_SPD[Math.max(0,Math.min(2,i.speedTier|0))]],
  ['atk','ATK e Vida',i=>i.atkPct?'+'+i.atkPct+'%':'—'],
  ['gold','Ouro e XP',i=>i.goldXpPct?'+'+i.goldXpPct+'%':'—'],
  ['keys','Entradas de instância/dia por área',i=>i.keys?'+'+i.keys:'—'],
  ['chest','Baús/dia',(i,base)=>i.chestPerDay>base.chestPerDay?i.chestPerDay+'/dia':'padrão ('+i.chestPerDay+')'],
  ['off','Ganho offline',i=>'x'+(i.offlineMult||1)],
  ['frame','Moldura animada',i=>i.frame?'Sim':'—'],
  ['skin','Skin exclusiva',i=>i.vipSkin?'Sim':'—'],
  ['aura','Aura VIP',i=>i.aura?'Sim':'—']];
const V_KEY={spd:'speedTier',atk:'atkPct',gold:'goldXpPct',keys:'keys',chest:'chestPerDay',off:'offlineMult',frame:'frame',skin:'vipSkin',aura:'aura'};

/* recompensa ÚNICA do nível: lida das fontes dos módulos (Sys.mount/Sys.pet: src "VIP n: inteira..."); nada escrito aqui */
/* só item VIVO no módulo (a função do próprio módulo: Sys.mount.live / Sys.pet.avail); desligado = nada aparece e a tela fica igual à de antes */
function vLive(M,kind,x){ try{ return kind==='Montaria'?(M.live?M.live(x)===true:false):(M.avail?M.avail(x,Sys.host)===true:false); }catch(e){ return false; } }
/* ícone da Arte (assets/icons/{mounts,pets}/<id>.png); o id do módulo vira o nome do arquivo pela tabela CL_ART do p_colecao.js; sem ícone conhecido o cartão fica só com o texto */
function vIcon(kind,id){ try{ const T=typeof CL_ART!=='undefined'?CL_ART:null; if(!T) return null; const a=kind==='Montaria'?T.mounts[id]:T.pets[id]; return a?'assets/icons/'+(kind==='Montaria'?'mounts':'pets')+'/'+a+'.png':null; }catch(e){ return null; } }
function vUnique(n){ const out=[], re=new RegExp('VIP '+n+'(?![0-9])');
  const scan=(M,kind)=>{ try{ const L=(M&&M.DATA&&(kind==='Montaria'?M.DATA.mounts:M.DATA.pets))||[]; for(const x of L) if(x.nw&&(x.src||[]).some(s=>re.test(s))&&vLive(M,kind,x)) out.push({kind,name:x.name,r:x.r,ic:vIcon(kind,x.id)}); }catch(e){} };
  scan(window.Sys&&Sys.mount,'Montaria'); scan(window.Sys&&Sys.pet,'Pet'); return out; }
/* CONVENIÊNCIAS DO VIP (aprovadas pelo dono; docs/PROPOSTA_VIP.md): a lista vem TODA de Sys.vip.convTable() (nome, nível, valores por nível, grátis) e Sys.vip.conv(S,id).
   Do nível escolhido L: toda conveniência que o L já tem (valor acima do grátis). Ativa = o jogador já tem o nível que dá aquele valor; senão TRANCADA com "VIP n".
   Sem preço. Arena/Torre: o VIP SOMA ao que o grátis tem; o número do grátis vem do módulo (Sys.arena/Sys.tower DATA), nunca de tabela escrita aqui. */
const V_UNIT={offlineH:' h',bag:' espaços'};
function vConvRows(L,cur){ let T=[]; try{ T=(window.Sys&&Sys.vip&&Sys.vip.convTable)?Sys.vip.convTable():[]; }catch(e){ T=[]; } const rows=[];
  for(const c of T){ const vals=Array.isArray(c.values)?c.values:null, has=vals?(vals[L]>vals[0]):(L>=c.vip); if(!has) continue;
    let need=c.vip; if(vals){ need=vals.findIndex(x=>x===vals[L]); if(need<1) need=c.vip; }
    let val=''; if(vals){ const u=(c.unit||V_UNIT[c.id]||''); val=(c.id==='offlineH'?'':'+')+vals[L]+u; }
    let free=String(c.free||''); try{ if(c.id==='arenaAdd'&&Sys.arena&&Sys.arena.DATA) free='hoje: '+Sys.arena.DATA.attemptsPerDay+' por dia'; else if(c.id==='towerAdd'&&Sys.tower&&Sys.tower.DATA) free='hoje: '+Sys.tower.DATA.lossesPerDay+' por dia'; }catch(e){} if(/Sys[.]/.test(free)) free='';
    rows.push({id:c.id,name:String(c.name).replace(/ *★/g,' estrelas'),val,free,need,on:cur>=need}); }
  return rows; }
function vConvCard(L,cur){ const rows=vConvRows(L,cur); if(!rows.length) return '';
  return '<div role="list" aria-label="Conveniências até o VIP '+L+'" style="flex:none;margin:0 12px;border-radius:16px;border:2px solid #6a4a1a;background:#1d1611;overflow:hidden"><div style="padding:8px 12px;background:#2a1d0f;border-bottom:1px solid #6a4a1a;font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:1px">CONVENIÊNCIAS DO VIP '+L+'</div>'
    +rows.map(r=>'<div role="listitem" aria-label="'+vEsc(r.name+(r.val?': '+r.val:'')+(r.on?', ativa':', trancada, '+'VIP '+r.need))+'" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #2a2018;opacity:'+(r.on?1:.75)+'"><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:13px;font-weight:900;line-height:1.2;color:'+(r.on?'#f6ecdf':'#c9b9a2')+'">'+vEsc(r.name)+(r.val?' · <b style="color:#ffe07a">'+vEsc(r.val)+'</b>':'')+'</span>'+(r.free?'<span style="font-size:11px;font-weight:700;color:#9c8d7a">Grátis: '+vEsc(r.free)+'</span>':'')+'</span>'
      +(r.on?'<span style="flex:none;padding:2px 8px;border-radius:8px;background:#1f3a22;border:2px solid #5fd068;color:#9ff0a8;font-size:11px;font-weight:900">Ativa</span>':'<span style="flex:none;display:flex;align-items:center;gap:4px;padding:2px 8px;border-radius:8px;background:#16110d;border:2px solid #6b5843;color:#c9b9a2;font-size:11px;font-weight:900"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="3" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>VIP '+r.need+'</span>')+'</div>').join('')+'</div>'; }
function vUniqueCard(n){ const u=vUnique(n); if(!u.length) return '';
  return '<div role="note" style="flex:none;margin:0 12px;padding:10px 12px;border-radius:14px;border:2px solid #ffc94a;background:linear-gradient(180deg,#3a2a12,#2a1d0f);display:flex;flex-direction:column;gap:4px"><span style="font-size:11px;font-weight:900;color:#ffc94a;letter-spacing:1px">SÓ NO VIP '+n+'</span>'
    +u.map(x=>'<span style="display:flex;align-items:center;gap:8px;font-size:14px;font-weight:900;line-height:1.2">'+(x.ic?'<img src="'+x.ic+'" alt="" loading="lazy" decoding="async" onerror="this.hidden=true" style="flex:none;width:48px;height:48px;object-fit:contain">':'')+'<span style="min-width:0">'+vEsc(x.kind+' '+(['Básico','Raro','Épico','Mítico','Lendário'][x.r]||'')+': '+x.name)+'</span></span>').join('')
    +'<span style="font-size:11px;font-weight:800;color:#c9b9a2">Vem inteira, uma vez, ao chegar neste nível. Sem sorteio.</span></div>'; }
function scrVip(){
  vInject();
  const d=xDims(V_MINH);
  if(!vOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Clube VIP indisponível agora.</div>`); XV.sig='x'; return; }
  const cur=vCur(), P=Sys.vip.progress(S), L=vClamp(XV.sel), base=vInfo(0), here=vInfo(L), prev=L>1?vInfo(L-1):base, max=vMax();
  const pct=Math.round((P.frac||0)*100), dots=Array.from({length:max},(_,i)=>{ const n=i+1; return `<span style="width:${n===L?20:8}px;height:8px;border-radius:4px;background:${n===L?'#ffc94a':n<=cur?'#a8761f':'#4a3a2b'};transition:width .25s"></span>`; }).join('');
  const rows=V_ROWS.map((r,ix)=>{ const k=V_KEY[r[0]], bv=r[2](base,base), hv=r[2](here,base), changed=here[k]!==base[k], isNew=here[k]!==prev[k]&&L>1||(L===1&&here[k]!==base[k]);
    return `<div role="row" class="pv-row" style="flex:1;min-height:38px;display:grid;grid-template-columns:1.25fr .9fr 1.2fr;align-items:center;border-bottom:1px solid #2a2018;animation-delay:${(ix*0.03).toFixed(2)}s">
      <span role="cell" style="display:flex;align-items:center;gap:6px;padding-left:8px;font-size:12px;font-weight:900;line-height:1.1"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="${V_ICON[r[0]]}"></path></svg>${vEsc(r[1])}</span>
      <span role="cell" style="text-align:center;font-size:${bv.length>12?10:12}px;line-height:1.1;font-weight:800;color:#9c8d7a">${vEsc(bv)}</span>
      <span role="cell" style="height:100%;display:flex;align-items:center;justify-content:center;gap:4px;background:rgba(255,201,74,.07);font-size:${hv.length>12?10:13}px;line-height:1.1;text-align:center;font-weight:900;color:${changed?'#ffe07a':'#9c8d7a'}">${vEsc(hv)}${isNew&&changed?'<span class="pv-new" style="padding:0 4px;border-radius:5px;background:#5fd068;color:#0d2410;font-size:9px;font-weight:900">NOVO</span>':''}</span></div>`; }).join('');
  const arrow=(a,label,ch,show)=>`<button data-x="${a}" aria-label="${label}" style="width:48px;height:48px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:#2a1d0f;color:#ffe07a;font-family:'Lilita One',sans-serif;font-size:26px;padding:0;visibility:${show?'visible':'hidden'}" ${show?'':'tabindex="-1" aria-hidden="true"'}>${ch}</button>`;
  const title=cur>=1?'VIP '+cur:'Sem VIP';
  const hasFrame=!!here.frame, hasAura=!!here.aura;
  const need=P.max?'Você está no nível máximo do Clube VIP.':`${P.missing===1?"Falta 1 ponto VIP":"Faltam "+kf(P.missing)+" pontos VIP"} em compras. Toda compra conta (diamantes, passe, ofertas).`;
  const stage=`<div style="height:196px;flex:none;position:relative;display:flex;gap:10px;padding:0 12px">
      <div style="position:relative;width:168px;flex:none"><div class="${hasFrame?'pv-frame':'pv-frame0'}"><div class="pv-in">
        <div class="pv-rays" style="left:-36px;top:-30px;width:240px;height:240px"></div>
        ${hasAura?'<div class="pv-aura" aria-hidden="true" style="position:absolute;left:15px;top:3px;width:132px;height:165px"></div>':''}
        <div style="position:absolute;left:24px;top:158px;width:114px;height:22px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#7a5a26 0%,#3a2810 60%,#1a120a 100%);border:2px solid #ffc94a;box-shadow:0 0 16px rgba(255,201,74,.6)"></div>
        <div style="position:absolute;left:44px;top:162px;width:74px;height:10px;border-radius:50%;background:rgba(0,0,0,.45)"></div>
        ${pvHeroOk()?`<canvas id="pv_hero" width="280" height="280" role="img" aria-label="${pvHeroName()}${hasAura?' com a aura dourada VIP':''}" style="position:absolute;left:11px;top:35px;width:140px;height:140px"></canvas>`:`<div class="pv-kid" role="img" aria-label="Kael${hasAura?' com a aura dourada VIP':''}" style="position:absolute;left:11px;top:35px;width:140px;height:140px"></div>`}
        <span class="pv-spark" style="left:18px;top:26px"></span><span class="pv-spark" style="left:136px;top:50px;animation-delay:.6s"></span><span class="pv-spark" style="left:30px;top:120px;animation-delay:1.2s"></span><span class="pv-spark" style="left:128px;top:132px;animation-delay:1.6s"></span>
      </div></div></div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;justify-content:center">
        <span style="font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:1px">SEU NÍVEL</span>
        <div class="pv-badge" style="align-self:flex-start;display:flex;align-items:center;gap:6px;padding:4px 10px 6px;border-radius:14px;background:linear-gradient(180deg,#ffe07a,#c9831a);box-shadow:0 4px 0 #6a3a08;max-width:100%;box-sizing:border-box;overflow:hidden">${cur>=1?'<svg width="22" height="18" viewBox="0 0 40 28" aria-hidden="true" style="flex:none"><path d="M3 24 6 6l9 9 5-13 5 13 9-9 3 18z" fill="#2a1403"></path></svg>':''}<span style="font-family:'Lilita One',sans-serif;font-size:${cur>=1?28:19}px;line-height:1;color:#2a1403;white-space:nowrap">${title}</span></div>
        ${P.max?'':`<div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900"><span>Até o VIP ${P.next}</span><span style="color:#ffc94a">${pct}%</span></div>`}
        <div role="progressbar" aria-label="Progresso até o próximo VIP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="height:14px;border-radius:7px;background:#0e0a07;border:1px solid #6a4a1a;overflow:hidden"><div class="pv-bar" style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></div></div>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.2">${need}</span></div></div>`;
  const carousel=`<div style="height:50px;flex:none;display:flex;align-items:center;gap:8px;padding:0 12px">${arrow('prev','Nível VIP anterior','‹',L>1)}
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><span id="pv_sel" class="pv-lvin" style="font-family:'Lilita One',sans-serif;font-size:22px;line-height:1">VIP ${L}${L===cur?' (você)':''}</span><div aria-hidden="true" style="display:flex;gap:4px">${dots}</div></div>
      ${arrow('next','Próximo nível VIP','›',L<max)}</div>`;
  const table=`<div role="table" aria-label="Benefícios: sem VIP comparado com VIP ${L}" style="flex:none;min-height:340px;margin:0 12px;border-radius:16px;border:2px solid #6a4a1a;background:#1d1611;overflow:hidden;display:flex;flex-direction:column">
      <div role="row" style="height:36px;flex:none;display:grid;grid-template-columns:1.25fr .9fr 1.2fr;align-items:center;background:#2a1d0f;border-bottom:1px solid #6a4a1a"><span role="columnheader" style="padding-left:10px;font-size:11px;font-weight:900;color:#c9b9a2">BENEFÍCIO</span><span role="columnheader" style="text-align:center;font-size:12px;font-weight:900;color:#c9b9a2">Sem VIP</span><span role="columnheader" style="height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,rgba(255,201,74,.3),rgba(255,201,74,.08));font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a">Com VIP ${L}</span></div>${rows}</div>`;
  const dlg=XV.cf?`<div class="pv-veil" style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.8);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box"><div role="alertdialog" aria-label="Pagamento em breve" class="pv-lvin" style="width:100%;max-width:320px;border-radius:18px;border:3px solid #ffc94a;background:#241a10;padding:18px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:10px;box-shadow:0 0 30px rgba(255,201,74,.45)">
      <span class="pv-gt" style="font-family:'Lilita One',sans-serif;font-size:24px">Pagamento em breve</span><span style="font-size:14px;font-weight:800;text-align:center;color:#e8dccb">A compra do VIP ainda não está disponível. Quando abrir, cada compra soma pontos para subir de nível.</span>
      <button data-x="closecf" class="pv-gold" style="width:180px;height:50px;border-radius:14px;font-family:'Lilita One',sans-serif;font-size:19px">Entendi</button></div></div>`:'';
  V.innerHTML=xWrap(d,XV.anim?'f-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="pv_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:6px 0 8px;box-sizing:border-box;overflow-y:auto">
      <span style="flex:none;text-align:center;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.15">Sobe acumulando compras na loja</span>${stage}${carousel}${vUniqueCard(L)}${vConvCard(L,cur)}${table}</div>
    <div style="flex:none;padding:8px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-sizing:border-box"><button data-x="buy" class="pv-gold pv-cta" style="position:relative;overflow:hidden;width:100%;height:58px;border-radius:16px;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05"><span class="pv-shine"></span><span style="font-family:'Lilita One',sans-serif;font-size:22px">Ir à Loja</span><span style="font-size:11px;font-weight:900;color:#5a330a">Cada compra soma pontos VIP</span></button></div>${dlg}</div>`);
  XV.anim=false; XV.sig=vSig();
}
/* assinatura do que muda por fora (compra, nível): o tick redesenha só quando ela muda */
function vSig(){ try{ const P=Sys.vip.progress(S); return [P.level,P.points].join('|'); }catch(e){ return ''; } }
/* O VIP vem do TOTAL gasto em qualquer compra (decisão do dono): o botão abre a LOJA (aba de gemas quando existe), sem preço de VIP. Volta: window.SHOP_RETURN='vip' (a Loja lê ao fechar). */
function vShop(){ try{ if(typeof XH!=='undefined'&&XH&&typeof xUnlocked==='function'&&xUnlocked('gemShop')) XH.tab='gem'; }catch(e){} window.SHOP_RETURN='vip'; try{ if(window.Screens&&Screens.open&&Screens.open('shop')!==false) return; }catch(e){} try{ if(typeof setView==='function') setView('shop'); }catch(e){} }
function vGo(n){ const m=vMax(), t=Math.max(1,Math.min(m,n)); if(t===XV.sel) return; snd('ui_tap'); XV.sel=t; render(); }
function vClick(b,ev){
  const a=b.dataset.x;
  if(a==='prev') vGo(XV.sel-1);
  else if(a==='next') vGo(XV.sel+1);
  else if(a==='buy'){ snd('ui_tap'); vShop(); }
  else if(a==='closecf'){ snd('ui_tap'); XV.cf=false; render(); }
}

/* VITRINE (QA no S24): a folha fixa kael_idle_era2_t0 mostrava sempre o Kael com a espada enferrujada. Agora é o desenho do próprio jogo num canvas
   (window.drawHeroFull: herói ATUAL, skin e arma EQUIPADAS, a pé, sem pet); sem o desenho do jogo, vale a folha de antes. */
const pvHeroOk=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
const pvHeroName=()=>{ try{ return S.hero==='kaia'?'Kaia':'Kael'; }catch(e){ return 'Kael'; } };
let pvRaf=0, pvT0=0;
function pvHeroLoop(ts){ pvRaf=0; const c=typeof document!=='undefined'?document.getElementById('pv_hero'):null; if(!c||typeof view==='undefined'||view!=='vip'){ pvT0=0; return; }
  try{ if(!pvT0) pvT0=ts; const x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height); window.drawHeroFull(x,c.width*0.5,c.height*242/256,c.height/HS,{t:(ts-pvT0)/1000,mount:false,pet:false,wing:false});   /* mesmo enquadramento da folha de antes: o quadro de 256 ocupa a caixa, pés em 242 */ }catch(e){}
  pvRaf=requestAnimationFrame(pvHeroLoop); }
function pvHeroStart(){ try{ if(!pvRaf&&pvHeroOk()&&document.getElementById('pv_hero')) pvRaf=requestAnimationFrame(pvHeroLoop); }catch(e){} }
Panels.add('vip',{title:'Clube VIP',render:function(){ if(typeof pwGate==='function'&&pwGate(['assets/anim/hyb/R/kael_idle_era2_t0.png','assets/anim/aura/aura13.png'])) return; const r0=scrVip.apply(this,arguments); pvHeroStart(); return r0; },click:function(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return vClick.apply(this,arguments); },
  tick(){ if(XV.cf||!vOk()) return; if(XV.sig&&vSig()!==XV.sig) render(); },
  busy(){ return false; },
  onOpen(){ const c=vCur(); XV.sel=c>=vMax()?vMax():vClamp(c+1); XV.cf=false; XV.anim=true;
    try{ if(window.Sys&&Sys.pet&&Sys.pet.prismVipMax) Sys.pet.prismVipMax(S,Sys.host); }catch(e){} },   /* VIP no máximo: o Sys.pet entrega os 500 fragmentos do Prismático uma vez (idempotente) */
  onClose(){ XV.cf=false; } });
