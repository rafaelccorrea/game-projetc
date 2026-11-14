'use strict';
/* ================= FAIXA DO CHEFE DA GUILDA NA BATALHA — arquivo novo, escopo próprio, só aparece com a chave do módulo ligada =================
   Regra e números: js/sys/guildboss.js (Sys.guildBoss; docs/LIGACOES_LOM_B.md seção 3). NENHUMA regra nem número aqui:
   - o que a faixa mostra: Sys.guildBoss.hud(S, Sys.host) → {show, name, level, frac, hpText, mineText, hitsLeft, hitsMax, killed, stale};
   - a leitura do servidor: Sys.guildBoss.loadBoss(S, Sys.host), só com o online da guilda iniciado (Sys.guildNet.state().started), quando o hud() diz
     "stale" e NO MÁXIMO 1 VEZ POR MINUTO (trava daqui, além da do módulo, que só vale quando já existe chefe no espelho).
   Com Sys.guildBoss.DATA.on desligado (ou sem o módulo): mount() devolve false e NADA entra no DOM. Ligado, mas sem guilda ou sem chefe (show:false):
   a faixa sai do DOM. Em luta de instância (B.inst: Torre, Arena, Provação, Ladrão etc.) a faixa também sai: o topo é da instância.
   ONDE FICA (base 390x844 do #fb_w do js/fullbattle.js): x 80 a 316 (a largura da barra da fase, que vai de x 78 a 316 e de y 60 a 118; o botão Menu começa
   em x 318 e a coluna esquerda de ícones acaba em x 70). O topo é o primeiro vão livre ABAIXO da barra da fase e de tudo o que mora ali:
   chip "FC recomendada" (#dfh do js/diff.js), selo "Forte contra / Fraco contra" (#wsl_root do js/weakseal.js, POS y 122: a faixa fica 16 px abaixo dele, fora
   da área de toque do selo), selo da Encruzilhada (.pc-badge), faixa da Provação (.pt-band) e o guia (.pgd). Sem nenhum deles: y 122. Para mudar: GuildBossHud.POS.
   A camada (z-index 5) fica ABAIXO da do selo (6): a explicação do "Forte contra", quando aberta, passa por cima da faixa.
   Toque na faixa: abre a Guilda na aba Chefe (Panels.open('guild', {tab:'boss'})). Chefe caído: "Derrotado! Prêmios no correio".
   API (window.GuildBossHud): on() · info() (o hud() do módulo ou null) · html(h) · mount(host?) (host padrão: #fb_w) · update(force?) (chamar no fbTick:
   lê o módulo no máximo 2 vezes por segundo e só troca o HTML quando muda) · unmount() · open() · place() (o topo calculado) · state · POS.
   Sem imagem: o ícone da guilda é desenhado no código. */
(function(){
const ST={host:null,root:null,sig:'',t:0,top:-1,poll:0,busy:false,css:false};
const POS={left:80,top:122,width:236,gap:6,sealGap:16,minPollMs:60000};   /* base 390x844 */
const GB=()=>{ const M=window.Sys&&window.Sys.guildBoss; return M&&typeof M.on==='function'&&typeof M.hud==='function'?M:null; };
const on=()=>{ try{ const M=GB(); return !!(M&&M.on()===true); }catch(e){ return false; } };
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const save=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const host=()=>(window.Sys&&window.Sys.host)||null;
const int=v=>{ const n=Math.floor(+v); return isFinite(n)&&n>0?n:0; };
const c01=v=>Math.max(0,Math.min(1,+v||0));
const netOk=()=>{ try{ const n=window.Sys&&window.Sys.guildNet, z=n&&typeof n.state==='function'?n.state():null; return !!(z&&z.on&&z.started); }catch(e){ return false; } };
const inInst=()=>{ try{ return typeof B!=='undefined'&&!!(B&&B.inst); }catch(e){ return false; } };

/* o hud() do módulo, ou null (chave desligada, sem módulo, sem save, luta de instância ou erro do módulo) */
function info(){ if(!on()||inInst()) return null; const s=save(); if(!s) return null; let h=null; try{ h=GB().hud(s,host()); }catch(e){ h=null; } return h&&typeof h==='object'?h:null; }

/* leitura do servidor: só com o espelho velho (stale), o online da guilda iniciado, uma por vez e no máximo 1 por minuto */
function poll(h,now){ if(ST.busy||!h||h.stale!==true||!netOk()) return false; let every=POS.minPollMs; try{ every=Math.max(every,+GB().DATA.pollMs||0); }catch(e){}
  if(ST.poll&&now-ST.poll<every) return false; ST.poll=now; ST.busy=true; let pr=null; try{ pr=GB().loadBoss(save(),host()); }catch(e){ pr=null; }
  const end=()=>{ ST.busy=false; try{ update(true); }catch(e){} }; Promise.resolve(pr).then(end,end); return true; }

const ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z" fill="#6a1f22" stroke="#ffc94a" stroke-width="1.8"/><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#ffc94a"/></svg>';
const CSS=`#gbh_root{position:absolute;z-index:5;font-family:Nunito,system-ui,sans-serif}
.gbh,.xs .gbh{position:relative;width:100%;min-height:36px;margin:0;display:flex;align-items:center;gap:6px;padding:3px 9px 4px 5px;border-radius:12px;border:1.5px solid #ff7b7b;background:rgba(22,16,12,.84);color:#f6ecdf;font:800 10.5px/1.2 Nunito,system-ui,sans-serif;text-align:left;box-shadow:0 2px 0 rgba(0,0,0,.35);cursor:pointer;-webkit-tap-highlight-color:transparent;box-sizing:border-box}
.gbh::before{content:'';position:absolute;left:0;right:0;top:0;height:100%;min-height:var(--fbt,44px)}
.gbh:active{transform:translateY(1px)}
.gbh-ic{flex:none;width:22px;height:22px;display:grid;place-items:center}
.gbh-ic svg{width:22px;height:22px;display:block}
.gbh-tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.gbh-l1{display:flex;justify-content:space-between;align-items:baseline;gap:6px;min-width:0}
.gbh-l1 b{min-width:0;font-weight:900;font-size:11.5px;color:#fff;overflow-wrap:anywhere}
.gbh-l1 em{flex:none;font-style:normal;font-weight:900;color:#ffd0d0;white-space:nowrap}
.gbh-bar{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.16);overflow:hidden}
.gbh-bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#ff5a5a,#ff9fbe)}
.gbh-l2{display:block;color:#e6d8c4;overflow-wrap:anywhere}
.gbh.dead,.xs .gbh.dead{border-color:#ffc94a}
.gbh.dead .gbh-l2{color:#ffc94a;font-weight:900}`;
function inject(){ if(ST.css) return; try{ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.id='gbh_css'; el.textContent=CSS; document.head.appendChild(el); ST.css=true; }catch(e){} }

/* HTML da faixa a partir do hud() do módulo ('' sem show) */
function html(h){ if(!h||h.show!==true) return ''; const name=String(h.name||'')||'Chefe da guilda', lv=int(h.level), pct=Math.round(c01(h.frac)*100), dead=h.killed===true;
  const l1=name+(lv?' · Nv '+lv:''), hp=String(h.hpText==null?'':h.hpText);
  const l2=dead?'Derrotado! Prêmios no correio':'Meu dano hoje: '+String(h.mineText==null?'0':h.mineText)+' · Golpes: '+int(h.hitsLeft)+'/'+int(h.hitsMax);
  const aria='Chefe da guilda: '+l1+'. '+(dead?'':'Vida '+hp+'. ')+l2+'. Toque para abrir o chefe na guilda';
  return '<button type="button" class="gbh'+(dead?' dead':'')+'" data-gbh="open" aria-label="'+esc(aria)+'"><span class="gbh-ic">'+ICON+'</span><span class="gbh-tx"><span class="gbh-l1"><b>'+esc(l1)+'</b>'+(hp?'<em>'+esc(hp)+'</em>':'')+'</span>'
    +'<span class="gbh-bar" role="progressbar" aria-label="Vida do chefe da guilda" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+pct+'"><i style="width:'+pct+'%"></i></span><span class="gbh-l2">'+esc(l2)+'</span></span></button>'; }

/* topo da faixa: abaixo da barra da fase (y 122) e de cada vizinho que estiver na tela. Só LÊ os elementos dos outros arquivos; sem eles vale o y 122 */
function place(){ let t=POS.top;
  const under=(el,defTop,defH,gap)=>{ try{ if(!el||(el.style&&el.style.display==='none')) return; const top=Math.round(+el.offsetTop)||parseFloat(el.style&&el.style.top)||defTop, hh=Math.round(+el.offsetHeight)||defH; t=Math.max(t,top+hh+gap); }catch(e){} };
  try{ if(typeof document==='undefined') return t; const id=k=>document.getElementById(k), q=s=>typeof document.querySelector==='function'?document.querySelector(s):null;
    { const d=id('dfh'); if(d){ const x=id('dfh_x'), two=!!(x&&x.textContent&&!(x.style&&x.style.display==='none')); under(d,110,two?27:15,POS.gap); } }
    under(id('wsl_root'),122,24,POS.sealGap);   /* selo "Forte contra": 16 px (a área de toque dele desce 14 px abaixo do desenho) */
    under(q('#pc_hud .pc-badge'),122,40,POS.gap); under(q('#pt_hud .pt-band'),122,44,POS.gap); under(q('#fb_w .pgd'),124,48,POS.gap); }catch(e){}
  return t; }

function open(){ try{ if(typeof snd==='function') snd('ui_tap'); }catch(e){}
  try{ if(window.Panels&&typeof window.Panels.open==='function'&&window.Panels.open('guild',{tab:'boss'})) return true; }catch(e){}
  try{ const Sc=window.Screens; if(Sc&&Sc.reg&&Sc.reg.guild&&typeof Sc.open==='function'){ Sc.open('guild',{tab:'boss'}); return true; } }catch(e){}
  try{ if(typeof toast==='function') toast('Guilda: em breve'); }catch(e){} return false; }

function drop(){ const r=ST.root; ST.root=null; ST.sig=''; ST.top=-1; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
/* liga a faixa ao painel da batalha. Chave desligada: false e nada no DOM (o fbTick tenta de novo a cada batida, sem custo) */
function mount(hostEl){ if(!on()) return false; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject(); if(ST.host!==h){ drop(); ST.host=h; } ST.t=0; update(true); return true; }catch(e){ return false; } }
function unmount(){ drop(); ST.host=null; }
/* chamar no fbTick. Devolve true com a faixa na tela */
function update(force){ const hEl=ST.host; if(!hEl) return false; const now=Date.now(); if(!force&&now-ST.t<500) return !!ST.root; ST.t=now;
  const h=info(); if(h) poll(h,now);
  const s=html(h); if(!s){ drop(); return false; }
  let r=ST.root; if(!r){ try{ r=document.createElement('div'); r.id='gbh_root'; r.style.left=POS.left+'px'; r.style.width=POS.width+'px';
      if(r.addEventListener) r.addEventListener('click',ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-gbh]'):null; if(b) open(); });
      hEl.appendChild(r); ST.root=r; ST.sig=''; ST.top=-1; }catch(e){ ST.root=null; return false; } }
  const top=place(); if(top!==ST.top){ ST.top=top; r.style.top=top+'px'; }
  if(s!==ST.sig){ ST.sig=s; r.innerHTML=s; } return true; }

window.GuildBossHud={on:on,info:info,html:html,mount:mount,update:update,unmount:unmount,open:open,place:place,state:ST,POS:POS};
})();
