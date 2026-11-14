'use strict';
/* ================= TELA CLUBE VIP V2 (docs/proto/v2/VIP.html; PASSAGEM.md seções 0 e 8) — NASCE DESLIGADA (PANEL_ON.vip2 = false) =================
   Só a TELA. O herói fica sempre à vista no palco (arma na mão, asa, montaria, pet na frente): quem desenha é a rota única do jogo
   (window.drawHeroFull do js/battle.js; o state vem do StageKit.toState quando o js/stagekit.js está carregado).
   Tocar num prêmio do VIP mostra a PRÉVIA no herói, com a faixa "Prévia: X · Sair" (nenhuma janela por cima).
   NENHUMA regra e NENHUM número aqui. De onde vem cada coisa:
   - nível, pontos e barra: Sys.vip.level / Sys.vip.progress / Sys.vip.DATA.points;
   - benefícios por nível: Sys.vip.levelInfo(n); texto da velocidade: Sys.vip.DATA.speeds; conveniências: Sys.vip.convTable() (só com DATA.convOn);
   - prêmios e o nível de cada um: Sys.newDrops.DATA.sources['vip:level'] (a regra "when" é perguntada nível a nível), a aura por Sys.vip.levelInfo(n).aura
     e os fragmentos do Prismático por Sys.pet.DATA.v4d.prism.vipMax; nome, raridade e "já existe no jogo" vêm de Sys.appearance, Sys.mount e Sys.pet.
   NADA SE COMPRA AQUI e a tela não mostra preço: o progresso é em PONTOS VIP (o que o Sys.vip guarda). A única ação é "Ir para a Loja".
   "Em breve" num prêmio = o MÓDULO diz que ele ainda não existe no jogo (Sys.pet.avail, Sys.mount.live, chaves do Sys.newDrops / Sys.appearance): sem prévia.
   O cabeçalho (Voltar, título, moedas) é do jogo. O arquivo roda em escopo próprio: os nomes daqui não chegam ao js/p_vip.js, que continua valendo
   enquanto esta chave estiver desligada. */
(function(){
const N='vip2';

/* ---------- leituras dos módulos ISOLADAS (reserva segura se algum não estiver carregado) ---------- */
const vM=()=>(window.Sys&&Sys.vip)||null;
const vOk=()=>{ const M=vM(); return !!(M&&M.DATA&&typeof M.levelInfo==='function'&&typeof M.progress==='function'&&typeof M.level==='function'); };
const vHost=()=>(window.Sys&&Sys.host)||null;
const vMax=()=>vM().DATA.maxLevel|0;
const vCur=()=>{ try{ return vM().level(S)|0; }catch(e){ return 0; } };
const vInfo=n=>vM().levelInfo(n);
const vPts=n=>{ const p=vM().DATA.points; return Math.max(0,Math.floor(+(p&&p[n])||0)); };
const vClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const vHero=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const vHeroN=()=>vHero()==='kaia'?'Kaia':'Kael';
const vBuyOn=()=>{ try{ return !!(window.Sys&&Sys.buy&&Sys.buy.DATA&&Sys.buy.DATA.on===true); }catch(e){ return false; } };
const vV9=()=>{ try{ const L=window.Sys&&Sys.level; return !!(L&&L.DATA&&L.DATA.v9&&L.DATA.v9.on===true); }catch(e){ return false; } };
const vPc=v=>String(v).replace('.',',')+'%';
const vRN=r=>{ if(r>=5) return 'Prismático'; try{ return (typeof RN==='function'&&RN(r))||''; }catch(e){ return ''; } };
const vCap=s=>{ s=String(s||''); return s?s.charAt(0).toUpperCase()+s.slice(1):s; };
const vSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const vRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };

/* ---------- DADOS DA TELA (só arte, cor e rótulo; nenhum número de regra) ---------- */
const V2_RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade do protótipo V2 */
const V2_AURA='assets/anim/aura/aura13.png', V2_AURA_N=16;                     /* a mesma folha da aura dourada da tela de hoje (js/p_vip.js): 16 quadros em linha */
const V2_VIP_IC='assets/icons/menu/vip.png';
/* nome do arquivo do ícone quando ele não é o id do módulo (mesma tabela CL_ART do js/p_colecao.js; a de lá vale quando está carregada) */
const V2_ART={mounts:{phoenixm:'giant_phoenix'},pets:{wyvernpet:'infernal_wyvern'}};
const V2_UNIT={offlineH:' h',bag:' espaços'};   /* unidade do valor da conveniência quando o módulo não traz (igual à tela de hoje) */
const V2_SVG={
  eye:'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  info:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5ee7ff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"></circle><path d="M12 11v6M12 7.5v.5"></path></svg>' };

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.v2-root{background:linear-gradient(180deg,#3a2a12 0%,#141c4a 24%,#0b1030 44%)!important;color:#eef1ff}
.v2-root,.v2-root *{box-sizing:border-box}
.v2-root button{font-family:Nunito,system-ui,sans-serif;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.v2-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.v2-in{animation:v2k-in .25s ease-out both}
@keyframes v2k-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.v2-stage{position:relative;flex:none;overflow:hidden;background:radial-gradient(110% 70% at 50% 62%,rgba(255,210,94,.2),rgba(255,210,94,0) 62%)}
.v2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:26px;padding:0 10px;border-radius:999px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap;max-width:94%;overflow:hidden}
.v2-who>span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.v2-who>i{flex:none;width:7px;height:7px;border-radius:50%;background:#5ef0a0;box-shadow:0 0 8px #5ef0a0}
.v2-who.pv{padding:2px 2px 2px 10px;background:rgba(255,107,154,.2);border-color:#ff6b9a;color:#ffd6e2}
.v2-who.pv>i{background:#ff6b9a;box-shadow:0 0 8px #ff6b9a}
.v2-who button,.xs .v2-who button{flex:none;min-height:40px;min-width:56px;padding:0 14px;border-radius:999px;border:0;background:#ffd25e;color:#1c1206;font-weight:900;font-size:13px}
.v2-still{position:absolute;left:50%;bottom:6%;height:78%;transform:translateX(-50%);object-fit:contain}
.v2-bt,.xs .v2-bt{flex:none;min-height:40px;padding:0 12px;border-radius:11px;border:0;font-weight:900;font-size:12px;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap}
.v2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.v2-bt.rose,.xs .v2-bt.rose{background:linear-gradient(180deg,#ff9fbe,#e0477a);color:#3a0618;box-shadow:0 3px 0 #8c1d44}
.v2-tag{flex:none;min-width:58px;min-height:30px;padding:0 9px;border-radius:10px;font-weight:900;font-size:11px;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap}
.v2-tag.own{background:rgba(94,240,160,.12);color:#5ef0a0;border:2px solid #5ef0a0}
.v2-tag.lock{background:rgba(255,255,255,.06);color:#ffd25e;border:1px solid rgba(130,150,255,.28)}
.v2-tag.soon{background:rgba(255,255,255,.06);color:#9aa6d6;border:1px solid rgba(130,150,255,.28)}
.v2-det{position:relative;flex:none;display:flex;gap:9px;align-items:center;margin:6px 12px 0;padding:7px 9px;border-radius:14px;background:linear-gradient(90deg,#27214f,#141c4a);border:1px solid var(--rc);min-width:0;animation:v2k-in .2s ease-out both}
.v2-th{flex:none;width:44px;height:44px;border-radius:11px;border:2px solid var(--rc);background:#0c1238;overflow:hidden;display:flex;align-items:center;justify-content:center}
.v2-th img{width:100%;height:100%;object-fit:contain;display:block}
.v2-di{flex:1;min-width:0}
.v2-dn{font-weight:900;font-size:14px;overflow-wrap:anywhere;line-height:1.2}
.v2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--rc)}
.v2-dg{font-size:11px;color:#5ef0a0;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.v2-dh{font-size:11px;color:#9aa6d6;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.v2-dh b{color:#ffd25e}
.v2-body{position:relative;flex:1;min-height:0;padding:8px 12px 14px}
.v2-body .v2-det{margin:0 0 8px}
.v2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9aa6d6;font-weight:900;margin:10px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.v2-sec>span{min-width:0;overflow-wrap:anywhere}
.v2-sec>span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.v2-hint{font-size:11px;color:#9aa6d6;margin:6px 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.v2-hint b{color:#ffd25e}
.v2-rule{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:rgba(94,231,255,.1);border:1px solid rgba(94,231,255,.45);font-size:11.5px;font-weight:800;color:#cdeffd;line-height:1.4;margin:0 0 4px;min-width:0}
.v2-rule>span{min-width:0;overflow-wrap:anywhere}
.v2-rule b{color:#fff}
.v2-card{border-radius:18px;padding:10px;margin-bottom:8px;background:linear-gradient(160deg,rgba(255,210,94,.22),rgba(24,33,86,.92) 55%);border:2px solid rgba(255,210,94,.65);min-width:0}
.v2-ch{display:flex;align-items:center;gap:10px;min-width:0}
.v2-ch>img{width:52px;height:52px;flex:none;object-fit:contain}
.v2-ch .t{flex:1;min-width:0}
.v2-big{font-size:32px;line-height:1;color:#ffd25e;text-shadow:0 0 16px rgba(255,210,94,.6)}
.v2-ch small{display:block;font-size:11px;font-weight:800;color:#9aa6d6;line-height:1.35;overflow-wrap:anywhere}
.v2-ch small b{color:#eef1ff}
.v2-bar{height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:8px}
.v2-bar>i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#ffe58a,#f4a52a)}
.v2-prog{font-size:12px;font-weight:900;margin-top:5px;display:flex;justify-content:space-between;gap:8px;min-width:0}
.v2-prog>span:first-child{min-width:0;overflow-wrap:anywhere}
.v2-prog>span:last-child{color:#ffd25e;flex:none}
.v2-rw{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.v2-rc{position:relative;min-width:0;min-height:44px;border-radius:14px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 30%,#27306f,#0c1238 78%);padding:4px 4px 5px;display:flex;flex-direction:column;align-items:center;gap:2px}
.v2-rc.pv{box-shadow:0 0 0 3px #ff6b9a,0 0 14px rgba(255,107,154,.5)}
.v2-rc.sn .v2-art{filter:grayscale(.9) brightness(.6)}
.v2-art{width:100%;aspect-ratio:1;object-fit:contain;display:block}
.v2-nm{width:100%;font-size:10px;font-weight:900;text-align:center;line-height:1.15;min-height:24px;display:flex;align-items:center;justify-content:center;overflow-wrap:anywhere}
.v2-st{width:100%;min-height:20px;border-radius:7px;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1.1;padding:2px;overflow-wrap:anywhere;text-align:center}
.v2-st.own{background:rgba(94,240,160,.15);color:#5ef0a0}
.v2-st.lock{background:rgba(255,255,255,.07);color:#ffd25e}
.v2-st.soon{background:rgba(255,255,255,.07);color:#9aa6d6}
.v2-ey{position:absolute;right:4px;top:4px;width:20px;height:20px;border-radius:7px;background:rgba(5,8,28,.8);display:flex;align-items:center;justify-content:center;color:#ffd6e2}
.v2-lvls{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;margin-bottom:6px}
.v2-lv,.xs .v2-lv{position:relative;min-width:0;min-height:40px;border-radius:9px;border:1px solid rgba(130,150,255,.28);background:rgba(255,255,255,.04);font-weight:900;font-size:14px;color:#9aa6d6;padding:0;line-height:1.05}
.v2-lv small{font-size:9px;display:block;line-height:1}
.v2-lv.got,.xs .v2-lv.got{color:#eef1ff}
.v2-lv.me,.xs .v2-lv.me{border:2px solid #ffd25e;color:#ffd25e}
.v2-lv[aria-pressed="true"],.xs .v2-lv[aria-pressed="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;border-color:#7f93ff}
.v2-rd{position:absolute;right:3px;top:3px;width:6px;height:6px;border-radius:50%;background:#ff6b9a}
.v2-lvcap{display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;color:#9aa6d6;text-align:center;line-height:1.2;min-width:0;overflow-wrap:anywhere}
.v2-lvh{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:14px;background:linear-gradient(90deg,rgba(255,210,94,.16),rgba(10,14,44,.85) 70%);border:1px solid rgba(255,210,94,.5);min-width:0}
.v2-lvh>b{font-size:22px;color:#ffd25e;flex:none}
.v2-lvh>span.tx{flex:1;min-width:0;font-size:11px;font-weight:800;color:#9aa6d6;line-height:1.35;overflow-wrap:anywhere}
.v2-lvh em{font-style:normal;color:#eef1ff}
.v2-pill{flex:none;font-size:10px;font-weight:900;padding:2px 7px;border-radius:8px;white-space:nowrap}
.v2-pill.on{background:rgba(94,240,160,.15);color:#5ef0a0}
.v2-pill.off{background:rgba(255,255,255,.07);color:#9aa6d6}
.v2-pk{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:12px;background:rgba(24,33,86,.78);border:1px solid rgba(130,150,255,.28);margin-bottom:5px;min-width:0}
.v2-pk.nw{border-color:rgba(94,240,160,.5)}
.v2-pk>span.tx{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.v2-pk>span.tx small{display:block;font-size:10px;color:#9aa6d6;font-weight:700}
.v2-pk>em{font-style:normal;font-weight:900;font-size:12px;color:#ffd25e;flex:none;text-align:right;max-width:42%;overflow-wrap:anywhere}
.v2-pth{flex:none;width:36px;height:36px;border-radius:9px;background:#0c1238;overflow:hidden;display:flex;align-items:center;justify-content:center}
.v2-pth img{width:100%;height:100%;object-fit:contain;display:block}
.v2-tbl{border-radius:14px;border:1px solid rgba(130,150,255,.28);overflow:hidden;background:rgba(5,8,28,.45)}
.v2-tr{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,.9fr) minmax(0,1fr);align-items:stretch;border-bottom:1px solid rgba(130,150,255,.15);min-height:34px}
.v2-tr:last-child{border-bottom:0}
.v2-tr>span{padding:5px 7px;font-size:11px;font-weight:800;line-height:1.25;min-width:0;overflow-wrap:anywhere;display:flex;align-items:center}
.v2-tr>span:nth-child(2){color:#9aa6d6;justify-content:center;text-align:center}
.v2-tr>span:nth-child(3){justify-content:center;text-align:center;background:rgba(255,210,94,.07);font-weight:900}
.v2-tr.hd{min-height:28px;background:rgba(61,79,184,.35)}
.v2-tr.hd>span{font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:#9aa6d6;font-weight:900}
.v2-tr .up{color:#ffd25e}
.v2-tr .no{color:#9aa6d6}
.v2-foot{position:relative;flex:none;padding:8px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));background:linear-gradient(180deg,rgba(11,16,48,0),#0b1030 30%);display:flex;flex-direction:column;gap:4px;min-width:0}
.v2-foot .v2-bt{width:100%;min-height:48px;font-size:15px}
.v2-foot .v2-bt img{width:20px;height:20px;object-fit:contain}
.v2-foot small{text-align:center;font-size:10px;font-weight:800;color:#9aa6d6;line-height:1.3;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.v2-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={sel:1,pv:null,anim:true,top:true,err:0,sig:''};

/* ---------- BENEFÍCIOS: tudo lido do Sys.vip ---------- */
/* texto da velocidade de um degrau do VIP, montado das regras do módulo (Sys.vip.DATA.speeds): "x2 no nível N", "x2 já", "x2 já · x4 no nível N" */
function vSpd(t){ const out=[]; let L=[]; try{ L=vM().DATA.speeds||[]; }catch(e){ L=[]; }
  for(const st of L){ if(!(st.speed>1)) continue; const R=Array.isArray(st.rules)?st.rules:[];
    if(R.some(r=>(r.spd|0)<=t&&!(r.level>0))) out.push('x'+st.speed+' já');
    else { const r=R.filter(q=>(q.spd|0)<=t&&q.level>0).sort((a,b)=>a.level-b.level)[0]; if(r) out.push('x'+st.speed+' no nível '+n0(r.level)); } }
  return out.length?out.join(' · '):'x1'; }
/* linhas fixas: [campo do levelInfo, rótulo, texto do valor]. Com a curva v9 do Sys.level o XP tem coluna própria no módulo (DATA.table.xp9) */
function vBaseRows(){ const v9=vV9(), T=vM().DATA.table||{}, gp=i=>+(i.goldPct!=null?i.goldPct:i.goldXpPct)||0, xp=i=>+(i.xpPct!=null?i.xpPct:i.goldXpPct)||0, fv=i=>(i.frameVip|0)||(i.frame?(i.level|0)||1:0);
  const rows=[['speedTier','Velocidade da batalha',i=>vSpd(i.speedTier|0)],
    ['atkPct','ATQ e VIDA',i=>i.atkPct?'+'+vPc(i.atkPct):'—'],
    ['goldPct','Ouro',i=>gp(i)?'+'+vPc(gp(i)):'—',gp]];   /* ouro e XP separados (dono 14/11): goldPct e xpPct do levelInfo; módulo antigo sem os campos = goldXpPct nos dois */
  if(v9&&Array.isArray(T.xp9)) rows.push(['xp9','XP',i=>{ const v=+T.xp9[i.level]||0; return v?'+'+vPc(v):'—'; },i=>+T.xp9[i.level]||0]);
  else rows.push(['xpPct','XP',i=>xp(i)?'+'+vPc(xp(i)):'—',xp]);
  rows.push(['keys','Entradas de instância por área',i=>i.keys?'+'+n0(i.keys)+' por dia':'—'],
    ['chestPerDay','Baús por dia',i=>n0(i.chestPerDay)],
    ['offlineMult','XP, itens, pedras e ração offline',i=>'x'+String(i.offlineMult).replace('.',',')],   /* o x2 do offline não vale para o ouro */
    ['frameVip','Moldura VIP no perfil',i=>fv(i)?'VIP '+n0(fv(i)):'—',fv]);   /* cada VIP N tem a moldura VIP N; a moldura Ouro é do nível 60 */
  return rows; }
const vRowVal=(r,i)=>r[3]?r[3](i):i[r[0]];
/* conveniências (Sys.vip.convTable, só com a chave convOn do módulo): o nome do módulo vem com a explicação entre parênteses; aqui ela vira a 2ª linha */
function vConvs(){ const M=vM(); try{ if(M.DATA.convOn!==true||typeof M.convTable!=='function') return [];
    const star=new RegExp(' *'+String.fromCharCode(9733),'g');   /* o módulo escreve "5 (estrela)" com o sinal; a tela escreve por extenso */
    return M.convTable().map(c=>{ const nm=String(c.name||'').replace(star,' estrelas'), m=/^(.*?)\s*\((.*)\)\s*$/.exec(nm);
      return {id:c.id,vip:c.vip|0,vals:Array.isArray(c.values)?c.values:null,unit:c.unit||V2_UNIT[c.id]||'',name:m?m[1]:nm,sub:m?m[2]:'',free:vCap(c.free)}; }); }catch(e){ return []; } }
/* valor de uma conveniência no nível L: número do módulo (somado ao grátis quando o grátis é zero) ou "Sim" */
function vConvTxt(c,L){ if(!c.vals) return L>=c.vip?'Sim':'—'; const v=+c.vals[L]||0, b=+c.vals[0]||0; if(L<c.vip||v===b) return b>0?n0(b)+c.unit:'—'; return (b>0?'':'+')+n0(v)+c.unit; }
const vConvOn=(c,L)=>c.vals?(L>=c.vip&&(+c.vals[L]||0)!==(+c.vals[0]||0)):L>=c.vip;
/* tabela acumulada do nível L: [rótulo, grátis, valor no L, igual ao grátis?] */
function vTable(L){ const b=vInfo(0), h=vInfo(L), out=[];
  for(const r of vBaseRows()) out.push([r[1],r[2](b),r[2](h),vRowVal(r,h)===vRowVal(r,b)]);
  for(const c of vConvs()) out.push([c.name,c.free||'—',vConvTxt(c,L),!vConvOn(c,L)]);
  return out; }
/* o que ABRE ou MELHORA no nível L, comparado com o L-1: [rótulo, valor, 2ª linha] */
function vOpens(L){ if(L<1) return []; const a=vInfo(L-1), h=vInfo(L), b=vInfo(0), out=[];
  for(const r of vBaseRows()) if(vRowVal(r,h)!==vRowVal(r,a)){ const f=r[2](b); out.push([r[1],r[2](h),f&&f!=='—'?'Grátis: '+f:'']); }
  for(const c of vConvs()){ const ch=c.vals?(L>=c.vip&&(+c.vals[L]||0)!==(+c.vals[L-1]||0)):L===c.vip; if(!ch) continue;
    out.push([c.name,c.vals?vConvTxt(c,L):'Abre',[c.sub,c.free?'grátis: '+c.free:''].filter(Boolean).join(' · ')]); }
  return out; }

/* ---------- PRÊMIOS: lidos das regras dos módulos; inteiros, uma vez, sem sorteio ---------- */
function vIcon(kind,id){ let a=null; try{ if(typeof CL_ART!=='undefined'&&CL_ART&&CL_ART[kind]) a=CL_ART[kind][id]; }catch(e){} if(!a) a=V2_ART[kind]&&V2_ART[kind][id]; return a?'assets/icons/'+kind+'/'+a+'.png':null; }
function vPetFly(sprite){ try{ const t=Sys.pet.battleTable&&Sys.pet.battleTable(); return t&&t[sprite]&&t[sprite].fly>0?t[sprite].fly:0; }catch(e){ return 0; } }
/* primeiro nível de VIP em que a regra do Sys.newDrops vale (a regra é uma função do módulo: pergunta nível a nível, nenhum número aqui) */
function vRuleLevel(rule){ for(let l=1;l<=vMax();l++){ try{ if(!rule.when||rule.when({level:l})) return l; }catch(e){} } return 0; }
function vPrizes(){ const out=[], Y=window.Sys||{}, host=vHost(), h=vHero();
  const ND=Y.newDrops, ndOn=!!(ND&&ND.DATA&&ND.DATA.on===true); let R=[]; try{ R=(ND&&ND.DATA&&ND.DATA.sources&&ND.DATA.sources['vip:level'])||[]; }catch(e){ R=[]; }
  for(const rule of R){ try{ const v=vRuleLevel(rule); if(!v) continue;
      if(rule.skin){ const id=rule.skin[h], A=Y.appearance; if(!id||!A||typeof A.fixedSkins!=='function') continue; const k=A.fixedSkins(S,host).find(q=>q.id===id); if(!k) continue;
        const live=ndOn&&A.DATA&&A.DATA.skinsOn===true;
        out.push({key:'skin:'+id,kind:'skin',id,v,r:k.r|0,name:k.name,icon:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':null,own:!!k.owned,live,canPv:live&&k.art!==false&&k.available!==false,held:false,
          gives:'Skin · raridade '+vRN(k.r|0)+(k.bonus?' · '+k.bonus+' em uso':''),what:'Skin no corpo padrão do herói',card:true}); }
      else if(rule.mount){ const M=Y.mount, def=M&&M.DATA&&(M.DATA.mounts||[]).find(q=>q.id===rule.mount); if(!def) continue;
        const live=ndOn&&typeof M.live==='function'&&M.live(def)===true; let own=false; try{ own=!!M.ensure(S).owned[def.id]; }catch(e){}
        out.push({key:'mount:'+def.id,kind:'mount',id:def.id,v,r:def.r|0,name:def.name,icon:vIcon('mounts',def.id),own,live,canPv:live,held:true,
          gives:'Montaria · raridade '+vRN(def.r|0),what:rule.whole?'Montaria inteira':'Fragmentos da montaria',card:true}); }
      else if(rule.pet){ const P=Y.pet, def=P&&P.DATA&&(P.DATA.pets||[]).find(q=>q.id===rule.pet); if(!def) continue;
        const live=ndOn&&typeof P.avail==='function'&&P.avail(def,host)===true; let own=false; try{ own=!!P.ensure(S).owned[def.id]; }catch(e){}
        out.push({key:'pet:'+def.id,kind:'pet',id:def.id,v,r:def.r|0,name:def.name,icon:vIcon('pets',def.id)||(def.sprite?'assets/pets/'+def.sprite+'_ref.png':null),own,live,canPv:live&&!!def.sprite,held:true,sprite:def.sprite||'',
          gives:'Pet · raridade '+vRN(def.r|0)+(def.skill&&def.skill.note?' · '+def.skill.note:''),what:rule.whole?'Pet inteiro':'Fragmentos do pet',card:true}); }
    }catch(e){} }
  /* aura do VIP: o primeiro nível em que o Sys.vip.levelInfo diz aura */
  try{ let av=0; for(let l=1;l<=vMax()&&!av;l++) if(vInfo(l).aura) av=l;
    if(av) out.push({key:'aura',kind:'aura',id:'aura',v:av,r:4,name:'Aura VIP dourada',icon:V2_VIP_IC,own:!!vInfo(vCur()).aura,live:true,canPv:true,held:false,gives:'Visual: aura dourada em volta do herói',what:'Visual',card:true}); }catch(e){}
  /* fragmentos do Prismático no VIP máximo (Sys.pet.DATA.v4d.prism.vipMax; só entra no jogo com a Revisão 4 do pet) */
  try{ const P=Y.pet, pm=P&&P.DATA&&P.DATA.v4d&&P.DATA.v4d.prism&&P.DATA.v4d.prism.vipMax, def=pm&&(P.DATA.pets||[]).find(q=>q.id==='prism');
    if(pm&&def&&pm.level>=1&&pm.level<=vMax()){ const live=typeof P.avail==='function'&&P.avail(def,host)===true; let own=false; try{ const o=P.ensure(S); own=!!(o.prism&&o.prism.vipMax===true); }catch(e){}
      out.push({key:'prism',kind:'prism',id:def.id,v:pm.level|0,r:def.r|0,name:def.name,icon:vIcon('pets',def.id)||(def.sprite?'assets/pets/'+def.sprite+'_ref.png':'assets/pets/pet_egg.png'),own,live,canPv:live&&!!def.sprite,held:false,sprite:def.sprite||'',
        gives:n0(pm.frags)+(def.hatchFrags?' dos '+n0(def.hatchFrags):'')+' fragmentos do pet '+def.name,what:'Fragmentos',card:false}); } }catch(e){}
  return out.sort((a,b)=>a.v-b.v); }
const vRc=p=>V2_RC[vClamp(p.r|0,0,5)];
/* selo do prêmio: Seu · Em breve (o módulo não libera) · Liberado (já tem o nível) · VIP n */
function vStat(p,cur){ return p.own?{t:p.kind==='aura'?'Ativa':'Seu',c:'own'}:!p.live?{t:'Em breve',c:'soon'}:cur>=p.v?{t:'Liberado',c:'own'}:{t:'VIP '+p.v,c:'lock'}; }
const vThumb=p=>p.icon?`<img src="${esc2(p.icon)}" alt="">`:`<span class="v2-lil" aria-hidden="true" style="font-size:18px;color:${vRc(p)}">${esc2(String(p.name).charAt(0))}</span>`;

/* ---------- PALCO: canvas com a rota única do jogo (o pet é o ÚLTIMO desenho do drawHeroFull, na frente do herói) ---------- */
let v2List=null;   /* prêmios do último desenho da tela: o laço do palco lê daqui, sem refazer a lista a cada quadro */
const vPvPrize=()=>{ if(!X.pv||!v2List) return null; const p=v2List.find(q=>q.key===X.pv); return p&&p.canPv?p:null; };
function vState(t){ const p=vPvPrize(), look={};
  if(p){ if(p.kind==='skin') look.skin=p.id; else if(p.kind==='mount') look.mount={id:p.id,stars:1}; else if(p.kind==='pet'||p.kind==='prism') look.pet={base:p.sprite,stage:1,fly:vPetFly(p.sprite)}; }
  const K=window.StageKit; if(K&&typeof K.toState==='function') return K.toState(look,{t});
  const st={t}; if(look.skin) st.skin=look.skin; if(look.mount) st.mount=look.mount; if(look.pet) st.pet=look.pet; return st; }
const vCanDraw=()=>{ try{ return !X.err&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
const vMounted=()=>{ const p=vPvPrize(); if(p&&p.kind==='mount') return true; try{ return typeof heroLook==='function'&&!!heroLook().mount; }catch(e){ return false; } };
const vAuraOn=()=>{ const p=vPvPrize(); if(p&&p.kind==='aura') return true; try{ return !!vInfo(vCur()).aura; }catch(e){ return false; } };
let v2Aura=null;
function vAuraImg(){ if(v2Aura) return v2Aura; try{ if(typeof Image==='undefined') return null; v2Aura=new Image(); v2Aura.src=V2_AURA; }catch(e){ v2Aura=null; } return v2Aura; }
let v2Raf=0, v2T0=0;
function vDraw(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!v2T0) v2T0=ts; const t=Math.max(0,(ts-v2T0)/1000), x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height);
  const mounted=vMounted(), k=c.height*(mounted?0.5:0.6)/HS, fx=c.width*(mounted?0.36:0.44), fy=c.height*0.9;
  /* chão: brilho dourado e anel tracejado sob o herói e o pet */
  try{ const gx=fx+c.width*0.05, rx=c.width*0.34, ry=c.height*0.085, g=x.createRadialGradient(gx,fy,4,gx,fy,rx); g.addColorStop(0,'rgba(255,210,94,.32)'); g.addColorStop(1,'rgba(255,210,94,0)');
    x.fillStyle=g; x.beginPath(); x.ellipse(gx,fy,rx,ry,0,0,7); x.fill();
    x.strokeStyle='rgba(255,210,94,.5)'; x.setLineDash([5*dpr,6*dpr]); x.lineDashOffset=-t*10*dpr; x.lineWidth=1.5*dpr; x.beginPath(); x.ellipse(gx,fy,rx*0.83,ry*0.72,0,0,7); x.stroke(); x.setLineDash([]); }catch(e){}
  /* aura dourada do VIP (prévia, ou o jogador já tem): atrás do herói, presa ao chão; mesma proporção da tela de hoje */
  if(vAuraOn()){ try{ const A=vAuraImg(); if(A&&A.complete&&A.naturalWidth>0){ const fw=A.naturalWidth/V2_AURA_N, fh=A.naturalHeight, fi=((Math.floor(t*12)%V2_AURA_N)+V2_AURA_N)%V2_AURA_N, aw=HS*k*0.94, ah=aw*fh/fw;
        x.save(); x.globalCompositeOperation='lighter'; x.drawImage(A,fi*fw,0,fw,fh,fx-aw/2,fy-ah,aw,ah); x.restore(); } }catch(e){ try{ x.restore(); }catch(e2){} } }
  window.drawHeroFull(x,fx,fy,k,vState(t)); }
function vLoop(ts){ v2Raf=0; const c=typeof document!=='undefined'?document.getElementById('v2_cv'):null; if(!c||typeof view==='undefined'||view!==N){ v2T0=0; return; }
  try{ vDraw(c,ts); }catch(e){ X.err=1; vRedraw(); return; }   /* o desenho do jogo falhou: a tela troca para o retrato parado e continua funcionando */
  v2Raf=requestAnimationFrame(vLoop); }
function vStart(){ try{ if(!v2Raf&&vCanDraw()&&document.getElementById('v2_cv')) v2Raf=requestAnimationFrame(vLoop); }catch(e){} }
function vStop(){ try{ if(v2Raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(v2Raf); }catch(e){} v2Raf=0; v2T0=0; }
/* retrato parado (reserva do palco): o do Sys.appearance, o mesmo do perfil */
function vStill(){ try{ const A=window.Sys&&Sys.appearance, k=A&&typeof A.avatarKey==='function'?A.avatarKey(S,vHost()):null; return k?'assets/hero/avatar/'+k+'.png':null; }catch(e){ return null; } }

/* ---------- desenho ---------- */
function vEmpty(d,html){ V.innerHTML=xWrap(d,'v2-root '+(X.anim?'v2-in':''),`<div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center">${html}</div>`); X.anim=false; X.sig='x'; }
function vDetHtml(p,cur){ const st=vStat(p,cur), v='<b>VIP '+n0(p.v)+'</b>';
  const line=p.own?(p.kind==='aura'?'Ativa: você tem o '+v:'Na coleção · ganho no '+v)
    :!p.live?'Ainda não está no jogo.'+(p.held?' Quem chega no '+v+' recebe quando entrar; nada se perde.':' É do '+v+'.')
    :esc2(p.what)+', uma vez, ao chegar no '+v+' · sem sorteio';
  return `<div class="v2-det" style="--rc:${vRc(p)}"><span class="v2-th">${vThumb(p)}</span><div class="v2-di"><div class="v2-dn">${esc2(p.name)} <span class="v2-rar">${esc2(vRN(p.r))}</span></div><div class="v2-dg">${esc2(p.gives)}</div><div class="v2-dh">${line}</div></div><span class="v2-tag ${st.c}">${esc2(st.t)}</span></div>`; }
function vLevelPanel(L,cur,P,list){ const max=vMax();
  const status=L===0?'O que todo jogador tem':L<=cur?'<em>Você tem</em>':(()=>{ const f=Math.max(0,vPts(L)-P.points); return (f===1?'Falta <em>1 ponto VIP</em>':'Faltam <em>'+n0(f)+' pontos VIP</em>'); })();
  let h=`<div class="v2-lvh"><b class="v2-lil">${L?'VIP '+n0(L):'Sem VIP'}</b><span class="tx">${L?'A partir de <em>'+n0(vPts(L))+(vPts(L)===1?' ponto VIP':' pontos VIP')+'</em> no total':'Jogador grátis'}<br>${status}</span>${L&&L<=cur?'<span class="v2-pill on">Liberado</span>':L?'<span class="v2-pill off">VIP '+n0(L)+'</span>':''}</div>`;
  if(L>0){ const op=vOpens(L);
    h+=`<div class="v2-sec"><span>Abre no VIP ${n0(L)}</span><span>${n0(op.length)} ${op.length===1?'item':'itens'}</span></div>`;
    h+=op.length?op.map(o=>`<div class="v2-pk nw"><span class="tx">${esc2(o[0])}${o[2]?'<small>'+esc2(o[2])+'</small>':''}</span><em>${esc2(o[1])}</em></div>`).join(''):'<p class="v2-hint">Os mesmos benefícios do nível anterior.</p>';
    const rws=list.filter(p=>p.v===L);
    if(rws.length){ h+=`<div class="v2-sec"><span>Prêmios do VIP ${n0(L)}</span><span>inteiros, uma vez</span></div>`;
      h+=rws.map(p=>{ const st=vStat(p,cur), on=X.pv===p.key;
        return `<div class="v2-pk" style="border-color:${vRc(p)}"><span class="v2-pth">${vThumb(p)}</span><span class="tx">${esc2(p.name)}<small>${esc2(p.gives)}</small></span>`
          +(p.canPv?`<button class="v2-bt rose" data-x="pv" data-id="${esc2(p.key)}" aria-pressed="${on}" aria-label="${esc2((on?'Sair da prévia: ':'Ver no herói: ')+p.name)}">${V2_SVG.eye}${on?'Sair':'Prévia'}</button>`:`<span class="v2-tag ${st.c}">${esc2(st.t)}</span>`)+'</div>'; }).join('');
      if(rws.some(p=>p.kind==='skin')) h+=`<p class="v2-hint">A skin usa o corpo padrão ${vHero()==='kaia'?'da Kaia':'do Kael'}; não muda o tamanho do herói.</p>`;
      if(rws.some(p=>!p.live)) h+='<p class="v2-hint">Prêmio marcado <b>Em breve</b> ainda não está no jogo; ele aparece aqui para você saber o que o nível traz.</p>'; } }
  h+=`<div class="v2-sec"><span>Tudo no ${L?'VIP '+n0(L):'jogo grátis'}</span><span>acumulado</span></div><div class="v2-tbl" role="table" aria-label="Benefícios: grátis comparado com ${L?'VIP '+n0(L):'grátis'}">
    <div class="v2-tr hd" role="row"><span role="columnheader">Benefício</span><span role="columnheader">Grátis</span><span role="columnheader">${L?'VIP '+n0(L):'Grátis'}</span></div>`;
  h+=vTable(L).map(r=>`<div class="v2-tr" role="row"><span role="cell">${esc2(r[0])}</span><span role="cell">${esc2(r[1])}</span><span role="cell" class="${r[3]?'no':'up'}">${esc2(r[2])}</span></div>`).join('')+'</div>';
  const got=list.filter(p=>L>=p.v);
  h+=`<p class="v2-hint" style="margin-top:8px">Prêmios até ${L?'o VIP '+n0(L):'aqui'}: <b>${got.length?got.map(p=>esc2(p.name)).join(', '):'nenhum'}</b>.${L<max?'':' Este é o nível máximo.'}</p>`;
  return h; }
function vRender(){
  const d=xDims(240)||{}, H=d.H>0?d.H:704;
  if(!vOk()){ vEmpty(d,'<span role="alert" style="font-weight:800;color:#9aa6d6">Clube VIP indisponível agora.</span><button class="v2-bt" data-x="back" style="min-height:48px;padding:0 28px;font-size:16px">Voltar</button>'); return; }
  const max=vMax(), cur=vClamp(vCur(),0,max), P=vM().progress(S), list=vPrizes(); v2List=list;
  X.sel=vClamp(X.sel|0,0,max); if(X.pv&&!list.some(p=>p.key===X.pv)) X.pv=null;
  const L=X.sel, pvP=X.pv?list.find(p=>p.key===X.pv):null, canDraw=vCanDraw();
  let y0=0; try{ const sc0=X.top?null:document.getElementById('v2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}

  /* ----- PALCO ----- */
  const stH=Math.round(vClamp(H*0.27,150,216)), still=vStill();
  const who=pvP?`<div class="v2-who pv"><i></i><span>${pvP.canPv?'Prévia':'Em breve'}: ${esc2(pvP.name)}</span><button data-x="sair" aria-label="${pvP.canPv?'Sair da prévia':'Fechar'}">${pvP.canPv?'Sair':'Fechar'}</button></div>`
    :`<div class="v2-who"><i></i><span>${esc2(vHeroN())} · ${cur?'VIP '+n0(cur):'sem VIP'}</span></div>`;
  const alt=vHeroN()+' com a arma na mão'+(pvP&&pvP.canPv?', prévia de '+pvP.name:'');
  const stage=`<div class="v2-stage" style="height:${stH}px">${canDraw?`<canvas id="v2_cv" role="img" aria-label="${esc2(alt)}" style="position:absolute;inset:0;width:100%;height:100%"></canvas>`:still?`<img class="v2-still" src="${esc2(still)}" alt="${esc2(vHeroN())}">`:''}${who}</div>`;
  const det=pvP?vDetHtml(pvP,cur):'';

  /* ----- CARTÃO DO NÍVEL ATUAL (em pontos VIP: é o que o módulo guarda; a tela não mostra preço) ----- */
  const pct=Math.round(vClamp(+P.frac||0,0,1)*100);
  const card=`<div class="v2-card"><div class="v2-ch"><img src="${V2_VIP_IC}" alt=""><div class="t"><div class="v2-big v2-lil">${cur?'VIP '+n0(cur):'Sem VIP'}</div><small>Os pontos VIP vêm das compras na Loja. O nível só sobe.</small><small>Seus pontos VIP: <b>${n0(P.points)}</b></small></div></div>
      <div class="v2-bar" role="progressbar" aria-label="Progresso até o próximo VIP" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      <div class="v2-prog"><span>${P.max?'Nível máximo do Clube VIP':n0(P.points)+' de '+n0(P.needTotal)+' pontos para o VIP '+n0(P.next)}</span><span>${P.max?'':pct+'%'}</span></div></div>`;
  const rule=`<div class="v2-rule">${V2_SVG.info}<span>O VIP é <b>conveniência</b> mais os <b>prêmios listados</b>. Nada é sorteado: cada prêmio vem inteiro, uma vez, ao chegar no nível.</span></div>`;

  /* ----- PRÊMIOS (cartões; sem rolagem para o lado) ----- */
  const cards=list.filter(p=>p.card);
  const rw=cards.length?`<div class="v2-sec"><span>Prêmios do VIP</span><span>toque para ver no herói</span></div><div class="v2-rw" style="grid-template-columns:repeat(${Math.min(4,Math.max(2,cards.length))},minmax(0,1fr))">${cards.map(p=>{ const st=vStat(p,cur);
      return `<button class="v2-rc${X.pv===p.key?' pv':''}${p.live?'':' sn'}" style="--rc:${vRc(p)}" data-x="pv" data-id="${esc2(p.key)}" aria-pressed="${X.pv===p.key}" aria-label="${esc2((p.canPv?'Prévia: ':'')+p.name+', VIP '+p.v+', '+st.t)}">${p.icon?`<img class="v2-art" src="${esc2(p.icon)}" alt="">`:`<span class="v2-art v2-lil" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;font-size:26px;color:${vRc(p)}">${esc2(String(p.name).charAt(0))}</span>`}${p.canPv?`<span class="v2-ey" aria-hidden="true">${V2_SVG.eye}</span>`:''}<span class="v2-nm">${esc2(p.name)}</span><span class="v2-st ${st.c}">${esc2(st.t)}</span></button>`; }).join('')}</div>`:'';

  /* ----- NÍVEIS 0 a máximo (grade que quebra em 2 linhas) ----- */
  let lv=''; for(let i=0;i<=max;i++){ const dot=list.some(p=>p.v===i);
    lv+=`<button class="v2-lv${i<=cur?' got':''}${i===cur?' me':''}" data-x="lv" data-l="${i}" aria-pressed="${L===i}" aria-label="${esc2(i?'VIP '+i+', a partir de '+n0(vPts(i))+' pontos VIP'+(dot?', com prêmio':''):'Sem VIP')}">${i?n0(i):'<small>Sem</small><small>VIP</small>'}${dot?'<span class="v2-rd" aria-hidden="true"></span>':''}</button>`; }
  const lvls=`<div class="v2-sec"><span>Níveis do VIP</span><span>escolha um</span></div><div class="v2-lvls" role="group" aria-label="Nível de VIP">${lv}${list.length?'<span class="v2-lvcap" aria-hidden="true">ponto rosa = prêmio</span>':''}</div>`;

  const foot=`<div class="v2-foot"><button class="v2-bt" data-x="shop"><img src="assets/icons/menu/shop.png" alt="">Ir para a Loja</button><small>${vBuyOn()?'O VIP sobe com as compras da Loja. Aqui nada se compra.':'O VIP sobe com as compras da Loja. As compras ainda não abriram: nada é cobrado.'}</small></div>`;

  const compact=H<620;   /* tela baixa: a faixa do prêmio rola junto com o resto */
  V.innerHTML=xWrap(d,'v2-root '+(X.anim?'v2-in':''),`${stage}${compact?'':det}<div id="v2_scroll" class="x-scroll v2-body">${compact?det:''}${card}${rule}${rw}${lvls}${vLevelPanel(L,cur,P,list)}</div>${foot}`);
  X.anim=false; X.top=false; X.sig=vSig();
  if(y0){ try{ const sc=document.getElementById('v2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  vStart();
}
/* assinatura do que muda por fora (pontos, nível, herói): o tick redesenha só quando ela muda */
function vSig(){ try{ const P=vM().progress(S); return [P.level,P.points,vHero()].join('|'); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
/* O VIP vem do total das compras: o botão abre a LOJA (aba de diamantes quando existe), sem preço de VIP. A volta fica marcada em window.SHOP_RETURN
   (a Loja lê ao fechar, js/panels.js hookClose) com o nome DESTA tela, para o jogador voltar para a tela nova. */
function vShop(){ try{ if(typeof XH!=='undefined'&&XH&&typeof xUnlocked==='function'&&xUnlocked('gemShop')) XH.tab='gem'; }catch(e){}
  window.SHOP_RETURN=N; try{ if(window.Screens&&Screens.open&&Screens.open('shop')!==false) return; }catch(e){} try{ if(typeof setView==='function') setView('shop'); }catch(e){} }
const ACT={
  back(){ vSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  sair(){ vSnd('ui_tap'); X.pv=null; vRedraw(); },
  pv(b){ const id=String(b.dataset.id||''), p=vPrizes().find(q=>q.key===id); if(!p) return; vSnd('ui_tap'); X.pv=X.pv===id?null:id; vRedraw(); },
  lv(b){ const l=vClamp(parseInt(b.dataset.l,10)||0,0,vMax()); if(l===X.sel) return; vSnd('ui_tap'); X.sel=l; vRedraw(); },
  shop(){ vSnd('ui_tap'); vShop(); } };
function vClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!vOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo, xGate) */
function vUrls(){ const u=[V2_VIP_IC,'assets/icons/menu/shop.png']; try{ if(vOk()) for(const p of vPrizes()) if(p.icon&&u.indexOf(p.icon)<0) u.push(p.icon); }catch(e){} return u; }

if(!('vip2' in PANEL_ON)) PANEL_ON.vip2=false;
Panels.add(N,{title:'Clube VIP',actions:Object.keys(ACT),
  render(){ if(typeof xGate==='function'&&xGate(vUrls())) return; return vRender(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return vClick(b); },
  tick(){ if(!vOk()) return; if(X.sig&&X.sig!=='x'&&vSig()!==X.sig) vRedraw(); },
  busy(){ return false; },
  onOpen(){ vStop(); X.pv=null; X.err=0; X.anim=true; X.top=true; X.sig='';
    if(vOk()){ const c=vCur(), m=vMax(); X.sel=c>=m?m:vClamp(c+1,0,m);
      try{ if(window.Sys&&Sys.pet&&Sys.pet.prismVipMax) Sys.pet.prismVipMax(S,Sys.host); }catch(e){} } },   /* igual à tela de hoje: VIP no máximo, o Sys.pet entrega os fragmentos do Prismático uma vez (idempotente) */
  onClose(){ vStop(); X.pv=null; } });
})();
