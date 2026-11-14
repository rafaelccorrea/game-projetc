'use strict';
/* ================= TELA RUÍNAS EM TRIO (docs/LIGACOES_LOM_TELAS.md, seção 5) — NASCE DESLIGADA (PANEL_ON.coop = false) =================
   VISUAL: mock B votado pelo dono (docs/proto/v2/a/mocks/trio_b.jpg): a TORRE de pedra com os andares empilhados (o 1 embaixo), andar vencido aceso com o
   baú aberto, o guardião de pedra no andar da vez, o herói subindo pela lateral, os três retratos redondos à esquerda, os balões de frase pronta e o botão
   dourado embaixo. Ressalva do dono: os baús mostram PEDRAS, nunca moedas.
   Masmorra cooperativa de 3 (nível 30), 2 entradas grátis por dia. NENHUMA regra e NENHUM número aqui: tudo vem do js/sys/coop.js (Sys.coop) e, com o online,
   do js/sys/coopnet.js (Sys.coopNet):
   - o que a tela mostra: Sys.coop.view(S, host) (local) ou Sys.coopNet.view(S, host) (online: + leader, myId, started, err);
   - a corrida: Sys.coop.start(S, host). LOCAL = resposta na hora (o jogador + 2 retratos; o módulo já credita). ONLINE = Promise (só o líder; prêmio pelo
     CORREIO quando a resposta traz mailed:true). A corrida é uma CONTA resolvida pelo módulo/servidor: a tela só REPRODUZ o registro (floors[]) na torre,
     andar por andar, como a Torre V2 faz com o duel.log. A batalha do jogo NÃO é usada.
   - o grupo (só online): Sys.coopNet.create / invite({friendCode} | {guildMemberId}) / join(partyId) / leave / say(idx) / refresh.
   REGRAS DE MENORES: nenhum texto livre entre jogadores (convite só por código A-Z 0-9 ou membro da guilda; conversa só por FRASE PRONTA, pelo índice);
   nada à venda, nenhuma entrada comprada, nenhuma pressa.
   GASTA ENTRADA = DOIS TOQUES (o 1º arma, o 2º confirma). Sair do grupo também pede dois toques.
   ATENÇÃO: com o sistema desligado a tela NÃO chama status/view (eles preparam o save): mostra o aviso e o Voltar, sem escrever nada.
   Chaves: PANEL_ON.coop (esta tela), Sys.coop.DATA.on (o sistema) e Sys.coopNet.DATA.on (o online). O arquivo roda em escopo próprio.
   Ponte para o resto do jogo (cartão das Instâncias, selo do Menu): window.PCoop = {card(), alerts(), open()}. */
(function(){
const N='coop';

/* ---------- ARTE: UMA constante. As peças pintadas do mock que não existem em assets/ ficam aqui em CSS/SVG (icoOf e o estilo da torre). Quando existirem em
   CO_ART_DIR os arquivos foe.png (guardião de pedra), chest.png, chest_open.png (com pedras, sem moedas), ghost.png e ally.png (retratos redondos),
   relicfrag.png, stone.png e gold.png (etiquetas de prêmio), troque CO_ART_ON para true. A parede da torre e o andar aceso são CSS (variáveis --co-stone*, --co-warm*). ---------- */
const CO_ART_ON=false, CO_ART_DIR='assets/coop/';
const CO_ART={foe:'foe',chest:'chest',open:'chest_open',ghost:'ghost',ally:'ally',relicFrags:'relicfrag',stones:'stone',goldk:'gold'};
const CO_SVG={
  foe:'<path d="M12 35v-9l-5-3v-9l6-3 2-6h10l2 6 6 3v9l-5 3v9h-6v-6h-4v6z" fill="#9a968c" stroke="#3b3a36" stroke-width="1.8" stroke-linejoin="round"/><path d="M15 12h10v7H15z" fill="#7d796f"/><circle cx="17.5" cy="15" r="1.7" fill="#ff3b30"/><circle cx="22.500" cy="15" r="1.7" fill="#ff3b30"/><path d="M13 24h14" stroke="#3b3a36" stroke-width="1.4"/>',
  chest:'<rect x="7" y="16" width="26" height="16" rx="3" fill="#8a5a28" stroke="#3a2410" stroke-width="1.6"/><path d="M7 16c0-5 4-8 13-8s13 3 13 8z" fill="#a8702f" stroke="#3a2410" stroke-width="1.6"/><path d="M7 22h26M12 9v23M28 9v23" stroke="#e8b24a" stroke-width="1.6"/><rect x="18" y="19" width="4" height="6" rx="1" fill="#ffe07a" stroke="#3a2410" stroke-width="1"/>',
  open:'<path d="M8 20l2-12h20l2 12" fill="#6b4420" stroke="#3a2410" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 20l3-7 4 5 3-6 4 8" fill="#57c8ff" stroke="#e6f7ff" stroke-width="1.2" stroke-linejoin="round"/><path d="M11 20l4-4 3 4" fill="#c58bff" stroke="#f1e2ff" stroke-width="1"/><rect x="7" y="20" width="26" height="13" rx="3" fill="#a8702f" stroke="#3a2410" stroke-width="1.6"/><path d="M12 20v13M28 20v13" stroke="#e8b24a" stroke-width="1.6"/><rect x="18" y="23" width="4" height="5" rx="1" fill="#ffe07a" stroke="#3a2410" stroke-width="1"/>',
  ghost:'<circle cx="20" cy="20" r="19" fill="#5f6672"/><circle cx="20" cy="15" r="6.5" fill="#aeb6c4"/><path d="M8 35c0-8 5-12 12-12s12 4 12 12z" fill="#aeb6c4"/>',
  ally:'<circle cx="20" cy="20" r="19" fill="#3f7f86"/><circle cx="20" cy="15" r="6.5" fill="#f1d3b0"/><path d="M13 14c0-6 14-6 14 0-3-3-11-3-14 0z" fill="#5a3a22"/><path d="M8 35c0-8 5-12 12-12s12 4 12 12z" fill="#c9cdd6"/>',
  relicFrags:'<path d="M20 5l11 9-4 19H13L9 14z" fill="#2fa7a0" stroke="#bff3ee" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 5v28M9 14h22" stroke="#bff3ee" stroke-width="1.2"/>',
  stones:'<path d="M8 27l5-13 10-5 9 8-2 13-13 3z" fill="#8a8f9c" stroke="#e6e9f2" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 14l8 6 11-3M21 20l-4 13" stroke="#e6e9f2" stroke-width="1.2" fill="none"/>',
  goldk:'<path d="M9 30l4-12h14l4 12z" fill="#f2a826" stroke="#ffe07a" stroke-width="1.8" stroke-linejoin="round"/><path d="M13 18l3-6h8l3 6" fill="#ffc94a" stroke="#ffe07a" stroke-width="1.8" stroke-linejoin="round"/>'};
/* icoOf(kind): o ÚNICO lugar que decide entre o arquivo da Arte e a reserva */
function icoOf(kind){ if(!Object.prototype.hasOwnProperty.call(CO_SVG,kind)) kind='chest';
  if(CO_ART_ON) return '<img src="'+esc2(CO_ART_DIR+CO_ART[kind]+'.png')+'" alt="">';
  return '<svg viewBox="0 0 40 40" aria-hidden="true">'+CO_SVG[kind]+'</svg>'; }
const ico=(kind,cls)=>'<span class="co-i'+(cls?' '+cls:'')+'">'+icoOf(kind)+'</span>';

/* ---------- leituras dos módulos ISOLADAS ---------- */
const CM=()=>(window.Sys&&Sys.coop)||null;
const CN=()=>(window.Sys&&Sys.coopNet)||null;
const has=()=>{ const M=CM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.status==='function'&&typeof M.start==='function'&&typeof M.why==='function'); };
const isOn=()=>{ try{ return has()&&CM().DATA.on===true; }catch(e){ return false; } };
const host=()=>(window.Sys&&Sys.host)||null;
const netOn=()=>{ try{ const n=CN(); return !!(n&&n.DATA&&n.DATA.on===true&&typeof n.start==='function'&&typeof n.view==='function'); }catch(e){ return false; } };
const netSt=()=>{ try{ const n=CN(); return n&&typeof n.state==='function'?n.state():null; }catch(e){ return null; } };
const online=()=>{ const z=netSt(); return !!(netOn()&&z&&z.started); };
const statusNow=()=>{ try{ return CM().status(S,host())||null; }catch(e){ return null; } };
const viewNow=()=>{ try{ const v=online()?CN().view(S,host()):CM().view(S,host()); return v||null; }catch(e){ return null; } };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const redraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
/* o Sys.coop não avisa o jogo quando muda o save: a tela grava (save do jogo; sem ele, o aviso do host) */
const store=()=>{ try{ if(typeof save==='function') return save(); const h=host(); if(h&&typeof h.onChange==='function') h.onChange(); }catch(e){} };
const now=()=>Date.now();
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nT=v=>{ try{ return typeof n0==='function'?n0(num(v)):String(Math.round(num(v))); }catch(e){ return String(Math.round(num(v))); } };
const pl=(n,one,many)=>nT(n)+' '+(num(n)===1?one:many);
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
/* texto de um motivo: a FONTE é o módulo (Sys.coop.why) */
const why=r=>{ let t=''; try{ t=String(CM().why(r)||''); }catch(e){ t=''; } return t||'Não deu agora'; };
/* o módulo tem UMA palavra para o reason 'limit' ("Sem entradas hoje"); para frase e convite a tela diz o que de fato travou */
const WHY_SAY_WAIT='Aguarde um instante para mandar outra frase', WHY_SAY_DAY='As frases do grupo de hoje acabaram', WHY_INV_DAY='Convites de hoje completos', WHY_ONLINE='Abre com o online';
const sanitize=s=>String(s==null?'':s).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.co-root) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.co-root{--co-ink:#f6ecdf;--co-mut:#c9b8a2;--co-soft:#efe3d0;--co-gold:#ffc94a;--co-gold1:#ffe07a;--co-gold2:#f2a826;--co-goldsh:#9a5a10;--co-goldink:#2a1403;
  --co-card:rgba(18,22,32,.72);--co-line:rgba(255,236,200,.18);--co-ok:#7fe07a;--co-ok1:#9cf08f;--co-ok2:#3fae3c;--co-okink:#0d2410;--co-bad:#ffb3a8;--co-badbg:rgba(190,60,50,.28);
  --co-stone:#59616c;--co-stone2:#3d444d;--co-stone3:#2c3239;--co-ledge:#8a939e;--co-warm1:#f6b55a;--co-warm2:#b9722a;--co-warm3:#6e3f14;--co-num:#d9dde3;--co-numw:#ffe9a8;
  --co-ring:#8d949f;--co-ring1:#b88a2e;--co-ring2:#3f8f96;--co-bub:#fff3dc;--co-bubline:#d9bf94;--co-bubink:#5a3a22;--co-sky1:rgba(140,205,235,.30);--co-sky2:rgba(24,34,48,.62);color:var(--co-ink)}
.co-root,.co-root *{box-sizing:border-box}
.co-root button,.co-root input{font-family:Nunito,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.co-root button{cursor:pointer}
.co-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.co-in{animation:co-in .25s ease-out both}
@keyframes co-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes co-glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
.co-i{flex:none;display:inline-block;width:20px;height:20px;vertical-align:middle}
.co-i svg,.co-i img{display:block;width:100%;height:100%;object-fit:contain}
.co-i.big{width:56px;height:56px}
.co-i.mid{width:30px;height:30px}
.co-i.chest{width:38px;height:38px}
.co-i.foe{width:54px;height:54px}
.co-i.foe.dn{opacity:.3;transform:rotate(16deg) translateY(6px)}
.co-body{position:relative;flex:1;min-height:0;padding:8px 12px 20px;display:flex;flex-direction:column;gap:10px}
.co-main{flex:none;display:flex;align-items:stretch;gap:8px;min-width:0}
.co-ports{flex:none;width:74px;display:flex;flex-direction:column;justify-content:center;gap:8px;min-width:0}
.co-pt{display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;min-width:0}
.co-ptc{display:block;width:58px;height:58px;border-radius:50%;border:3px solid var(--co-ring2);background:#1a2028;overflow:hidden;box-shadow:0 2px 0 rgba(0,0,0,.45)}
.co-ptc svg,.co-ptc img,.co-ptc canvas{display:block;width:100%;height:100%;object-fit:cover}
.co-pt.me .co-ptc{border-color:var(--co-ring1)}
.co-pt.gh .co-ptc{border-color:var(--co-ring)}
.co-pt b{max-width:100%;padding:1px 7px;border-radius:9px;background:rgba(20,24,32,.78);font-size:11px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.co-pt small{max-width:100%;padding:0 5px;border-radius:7px;background:rgba(20,24,32,.6);font-size:9.5px;font-weight:800;color:var(--co-soft);line-height:1.3;overflow-wrap:anywhere}
.co-pt small.no{color:var(--co-bad)}
.co-tower{flex:1;min-width:0;display:flex;flex-direction:column;border-radius:10px 10px 6px 6px;background:linear-gradient(90deg,var(--co-stone3),var(--co-stone2) 12%,var(--co-stone2) 88%,var(--co-stone3));border:2px solid #22272d;box-shadow:0 4px 0 rgba(0,0,0,.4);overflow:hidden}
.co-cap{flex:none;min-height:26px;display:flex;align-items:center;justify-content:center;padding:3px 6px;font-size:10.5px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--co-num);background:repeating-linear-gradient(90deg,var(--co-stone) 0 30px,var(--co-stone2) 30px 32px);border-bottom:5px solid var(--co-ledge);text-align:center;overflow-wrap:anywhere}
.co-flr{flex:none;position:relative;display:flex;align-items:center;gap:6px;min-height:62px;padding:4px 6px 4px 4px;border-bottom:5px solid var(--co-ledge);background:linear-gradient(180deg,var(--co-stone3),var(--co-stone2));min-width:0}
.co-flr:last-child{border-bottom-width:6px}
.co-flr.w{background:radial-gradient(ellipse at 60% 80%,var(--co-warm1),var(--co-warm2) 55%,var(--co-warm3));animation:co-glow 2.4s ease-in-out infinite}
.co-flr.l{background:linear-gradient(180deg,#3a2326,var(--co-stone2))}
.co-hz{flex:none;display:block;width:50px;height:54px}
.co-hz canvas{display:block;width:100%;height:100%}
.co-fn{flex:none;width:24px;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:26px;line-height:1;color:var(--co-num);text-shadow:0 2px 0 rgba(0,0,0,.5)}
.co-flr.w .co-fn{color:var(--co-numw)}
.co-fx{flex:1;min-width:0;display:flex;align-items:center;gap:4px 6px;flex-wrap:wrap}
.co-fx .co-rw{padding:1px 5px;border-radius:8px;background:rgba(0,0,0,.45);font-size:11.5px}
.co-flr.z .co-fx{opacity:.8}
.co-msg{flex:none;min-height:36px;display:flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:12px;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--co-gold1);overflow-wrap:anywhere}
.co-msg.f{background:rgba(18,22,32,.78)}
.co-msg.bad{color:var(--co-bad)}
.co-bubs{flex:none;display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.co-bub,.xs .co-bub{flex:1 1 86px;min-width:0;min-height:44px;border-radius:22px;border:2px solid var(--co-bubline);background:var(--co-bub);color:#5a3a22;font-size:13.5px;font-weight:900;line-height:1.15;padding:4px 10px;overflow-wrap:anywhere;box-shadow:0 3px 0 rgba(0,0,0,.3)}
.co-bub.dim,.xs .co-bub.dim{opacity:.6}
.co-bub.more,.xs .co-bub.more{flex:0 1 auto;background:rgba(18,22,32,.78);border-color:var(--co-line);color:var(--co-ink)}
.co-bub:active{transform:translateY(2px)}
.co-go{flex:none;display:flex;flex-direction:column;gap:6px;min-width:0}
.co-ent{align-self:center;display:flex;align-items:center;gap:8px;padding:4px 12px;border-radius:14px;background:rgba(18,22,32,.78);font-size:13px;font-weight:900;max-width:100%;overflow-wrap:anywhere}
.co-pips{flex:none;display:flex;gap:5px}
.co-pips i{display:block;width:14px;height:14px;border-radius:50%;border:2px solid var(--co-gold);background:transparent}
.co-pips i.on{background:var(--co-gold)}
.co-note{margin:0;padding:6px 10px;border-radius:12px;background:rgba(18,22,32,.78);font-size:12.5px;font-weight:800;line-height:1.4;text-align:center;color:var(--co-soft);overflow-wrap:anywhere}
.co-sec{flex:none;border-radius:16px;background:var(--co-card);border:1px solid var(--co-line);padding:10px 12px 12px;min-width:0}
.co-h5{margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--co-mut);font-weight:900;overflow-wrap:anywhere}
.co-p{margin:0 0 8px;font-size:12.5px;font-weight:700;line-height:1.45;color:var(--co-soft);overflow-wrap:anywhere}
.co-p:last-child{margin-bottom:0}
.co-p b{color:var(--co-ok)}
.co-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.co-bt,.xs .co-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--co-gold1),var(--co-gold2));color:#2a1403;box-shadow:0 3px 0 var(--co-goldsh)}
.co-bt.go,.xs .co-bt.go{flex:none;width:100%;min-height:60px;border-radius:16px;border:2px solid #7a4a10;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;box-shadow:0 5px 0 var(--co-goldsh)}
.co-bt.o,.xs .co-bt.o{background:rgba(18,22,32,.78);border:1px solid rgba(255,236,200,.3);color:var(--co-ink);box-shadow:none}
.co-bt.b,.xs .co-bt.b{background:linear-gradient(180deg,var(--co-ok1),var(--co-ok2));color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.co-bt.b.go,.xs .co-bt.b.go{border-color:#1f6a1c;box-shadow:0 5px 0 #1f6a1c}
.co-bt.dim,.xs .co-bt.dim{opacity:.75}
.co-bt.sm,.xs .co-bt.sm{flex:none;min-height:44px;padding:4px 14px;font-size:13px}
.co-bt:active{transform:translateY(2px)}
.co-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--co-line);min-width:0}
.co-row:first-of-type{border-top:0}
.co-row>span{flex:1;min-width:0;font-size:13px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.co-cin{display:flex;gap:8px;align-items:stretch;min-width:0}
.co-inp{flex:1;min-width:0;width:100%;min-height:48px;border-radius:12px;border:1px solid rgba(255,236,200,.3);background:rgba(0,0,0,.4);color:var(--co-ink);font-size:16px;font-weight:900;letter-spacing:2px;text-align:center;text-transform:uppercase;padding:4px 8px}
.co-chat{margin:0 0 8px;padding:0;list-style:none;font-size:12.5px;font-weight:700;line-height:1.45;overflow-wrap:anywhere}
.co-chat b{color:var(--co-gold1)}
.co-fls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.co-fc{display:flex;flex-direction:column;align-items:center;gap:1px;padding:6px 2px;border-radius:10px;background:rgba(0,0,0,.3);border:1px solid var(--co-line);min-width:0}
.co-fc small{font-size:10px;font-weight:900;color:var(--co-mut)}
.co-fc.w{border-color:var(--co-gold);background:rgba(255,201,74,.14)}
.co-fc.l{border-color:var(--co-bad);background:var(--co-badbg)}
.co-fc.z{opacity:.45}
.co-tb{display:flex;align-items:center;gap:6px;padding:5px 0;border-top:1px solid var(--co-line);font-size:12.5px;font-weight:800;min-width:0}
.co-tb:first-of-type{border-top:0}
.co-tb>b{flex:none;width:68px;font-weight:900;color:var(--co-mut);font-size:11.5px}
.co-tb>span{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:flex-end}
.co-rw{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:900;white-space:nowrap}
.co-rws{display:flex;flex-wrap:wrap;gap:6px 14px;margin:6px 0 0}
.co-rws .co-rw{white-space:normal;overflow-wrap:anywhere}
.co-res{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.15;margin:0 0 4px;overflow-wrap:anywhere}
.co-wait{margin:0;padding:10px;text-align:center;font-size:13.5px;font-weight:900;color:var(--co-gold1)}
.co-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.co-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--co-soft);overflow-wrap:anywhere}
.co-off .co-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.co-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const STEP_MS=700, POLL_MS=10000, MSG_MS=3200, WINDOW=4, BUBBLES=3;
const X={busy:'',arm:'',msg:'',bad:false,msgT:0,code:'',sheet:'',run:null,boot:'',bootWhy:'',pollT:0,sig:'',gen:0,anim:true,top:true,raf:0,t0:0,timer:0};
function say(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=now(); }
/* fundo: regra da casa (cenário da era atual pelo xEraBg) com o véu claro de céu do mock por cima; a base escurece para os cartões */
const bg=()=>{ try{ return typeof xEraBg==='function'?'linear-gradient(180deg,var(--co-sky1),var(--co-sky2)),'+xEraBg(0.2,0.6):'#16110d'; }catch(e){ return '#16110d'; } };
const bgOff=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.55,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
const lvlNow=()=>{ try{ const L=window.Sys&&Sys.level; if(L&&typeof L.level==='function') return num(L.level(S)); const h=host(); return h&&typeof h.level==='function'?num(h.level()):0; }catch(e){ return 0; } };
function sig(){ try{ return JSON.stringify([S.sys&&S.sys.coop||null,online(),X.boot,lvlNow()]); }catch(e){ return ''; } }

/* ---------- O HERÓI NA TORRE (canvas pequeno no andar da vez): o herói do jogo a pé, com a arma na mão (window.drawHeroFull), pés na borda do andar ---------- */
const canHero=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||50, h=c.clientHeight||54;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'); if(!x) return;
  x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  if(canHero()){ try{ window.drawHeroFull(x,w/2,h-3,(h-6)/HS,{t:t,mount:false,pet:false}); }catch(e){} x.setTransform(dpr,0,0,dpr,0,0); } }
function loop(ts){ X.raf=0; const c=byId('co_stc'); if(!c||!isOn()){ X.t0=0; return; } try{ frame(c,ts); }catch(e){} X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&byId('co_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }

/* ---------- rede: uma ação por vez; "Carregando" enquanto a Promise não volta; a recusa vira o texto do módulo ---------- */
function run(label,fn,o){ if(X.busy) return; o=o||{}; X.arm=''; const gen=X.gen;
  const end=r=>{ if(gen!==X.gen) return; X.busy='';
    if(r&&r.ok){ store(); sfx('ui_ok'); say(typeof o.ok==='function'?o.ok(r):(o.ok||'')); try{ if(o.after) o.after(r); }catch(e){} }
    else { sfx('ui_tap'); say(o.why?o.why(r):why(r||'error'),true); }
    redraw(); };
  let pr=null; try{ pr=fn(); }catch(e){ pr=null; }
  if(pr&&typeof pr.then==='function'){ X.busy=label||'Carregando'; X.msg=''; redraw(); pr.then(end,()=>end(null)); } else end(pr); }
/* liga o online das Ruínas se o jogo ainda não ligou (Sys.coopNet.start: lê o estado e troca o provider). Só com as duas chaves ligadas e o nível aberto */
function boot(){ const n=CN(); if(!netOn()||online()||X.boot==='load') return; const st=statusNow(); if(!st||!st.open) return;
  X.boot='load'; X.bootWhy=''; const gen=X.gen;
  const end=r=>{ if(gen!==X.gen) return; X.boot=r&&r.ok?'':'err'; X.bootWhy=r&&r.ok?'':why(r||'error'); X.pollT=now(); redraw(); };
  let pr=null; try{ pr=n.start(S,host()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* leitura a cada 10 s com a tela aberta (grupo, convites, frases, entradas, última corrida) */
function poll(force){ const n=CN(); if(!online()||typeof n.refresh!=='function') return; const t=now(); if(!force&&t-X.pollT<POLL_MS) return; X.pollT=t; const gen=X.gen;
  const end=()=>{ if(gen!==X.gen) return; if(!X.busy&&!X.run&&X.sig&&sig()!==X.sig) redraw(); };
  let pr=null; try{ pr=n.refresh(S,host()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>{}); }

/* ---------- HTML ---------- */
const RW=[['relicFrags','fragmento de relíquia','fragmentos de relíquia'],['stones','pedra de treino','pedras de treino']];
/* prêmio em etiquetas: só o que o módulo devolveu e é > 0. goldk = ouro de N abates (a mesma unidade do módulo) */
function rwHtml(rw,short){ const c=[]; rw=rw||{};
  for(const k of RW){ const n=num(rw[k[0]]); if(n>0) c.push('<span class="co-rw" aria-label="'+esc2(pl(n,k[1],k[2]))+'">'+ico(k[0])+(short?nT(n):esc2(pl(n,k[1],k[2])))+'</span>'); }
  { const n=num(rw.goldk); if(n>0) c.push('<span class="co-rw" aria-label="'+esc2('ouro de '+pl(n,'abate','abates'))+'">'+ico('goldk')+(short?nT(n):esc2('ouro de '+pl(n,'abate','abates')))+'</span>'); }
  return c.join(''); }
function offHtml(d,msg,role){ V.innerHTML=xWrap(d,'co-root '+(X.anim?'co-in':''),'<div class="co-w" style="background:'+bgOff()+'"><div class="co-off">'+ico('chest','big')+'<span role="'+(role||'alert')+'">'+esc2(msg)+'</span><button class="co-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
const msgHtml=()=>{ const t=X.busy||X.msg; return '<div id="co_msg" class="co-msg'+(t?' f':'')+(X.msg&&X.bad&&!X.busy?' bad':'')+'" role="status">'+(t?esc2(t):'')+'</div>'; };
const allWon=R=>R.res.floors.length>=R.total&&R.res.floors.every(f=>f&&f.win);
/* OS TRÊS RETRATOS (coluna da esquerda, como no mock): eu com o retrato do jogo (avatarTag) quando existe; retrato automático com a etiqueta "Retrato" */
function avatarMe(){ try{ if(typeof avatarTag==='function') return String(avatarTag(58,'position:static;width:100%;height:100%;display:block','')||''); }catch(e){} return ''; }
function portHtml(m,myId){ const gh=m.ghost===true||m.seat===true, me=!gh&&(m.playerId==='me'||(!!myId&&String(m.playerId)===myId));
  const pic=(me&&avatarMe())||icoOf(gh?'ghost':'ally'), nm=m.seat?'Retrato':gh&&!m.name?'Retrato':m.name||'Jogador';
  return '<div class="co-pt'+(gh?' gh':'')+(me?' me':'')+'"><span class="co-ptc">'+pic+'</span><b>'+esc2(nm)+'</b>'
    +(m.seat?'<small>'+esc2(m.note||'')+'</small>':(gh&&m.name?'<small>Retrato</small>':'')+(m.fc!=null?'<small>Força '+nT(m.fc)+'</small>':''))
    +(!gh&&m.paid===false?'<small class="no">sem entrada: não ganhou</small>':!gh&&m.entryOk===false&&m.paid==null?'<small class="no">sem entrada hoje</small>':'')+'</div>'; }
function teamOf(v,R,on){ if(R) return (R.res.members||[]).slice(0,3); const seat=note=>({seat:true,note:note,ghost:true});
  if(on&&v.party){ const L=v.party.members.slice(0,3); while(L.length<3) L.push(seat('vaga aberta')); return L; }
  return [{playerId:'me',name:'Você'},seat(on?'vaga aberta':'força parecida'),seat(on?'vaga aberta':'força parecida')]; }
/* A TORRE: uma janela de 4 andares em volta do andar da vez (o 1 embaixo). Vencido = aceso, baú aberto e o prêmio do andar (tabela do módulo);
   da vez = o herói na borda e o guardião; acima = pedra escura, baú fechado e o prêmio que o andar dá. */
function towerHtml(R,v){ const T=v.table||[], total=R?R.total:Math.max(1,T.length), fl=R?R.res.floors:[];
  const won=k=>!!(R&&k<=R.k&&fl[k-1]&&fl[k-1].win), lostAt=R&&R.done&&!allWon(R)?R.k:0, top=!!(R&&R.done&&allWon(R));
  const cur=R?(R.done?(top?total:Math.max(1,R.k)):Math.min(R.k+1,Math.max(1,R.n))):1, lo=clamp(cur-2,1,Math.max(1,total-WINDOW+1)), hi=Math.min(total,lo+WINDOW-1);
  let h='<div class="co-tower" role="img" aria-label="'+esc2('Torre das ruínas: andar '+cur+' de '+total)+'"><div class="co-cap">'+(hi<total?'Sobe até o andar '+nT(total):'Topo das ruínas')+'</div>';
  for(let k=hi;k>=lo;k--){ const w=won(k), isCur=k===cur, rw=T[k-1]?rwHtml(T[k-1].reward,true):'';
    h+='<div class="co-flr '+(w?'w':k===lostAt?'l':'z')+'"><span class="co-hz">'+(isCur?'<canvas id="co_stc"></canvas>':'')+'</span><b class="co-fn">'+nT(k)+'</b><span class="co-fx">'
      +(w?ico('open','chest')+rw:isCur&&!top?ico('foe','foe')+(R?'':rw):ico('chest','chest')+rw)+'</span></div>'; }
  return h+'</div>'; }
/* a corrida em reprodução: os 10 andares do registro, e no fim a soma e para onde o prêmio foi */
function runHtml(R,v){ const fl=R.res.floors, T=(v&&v.table)||[]; let cells='';
  for(let i=0;i<R.total;i++){ const f=fl[i], seen=i<R.k&&f; cells+='<div class="co-fc '+(seen?(f.win?'w':'l'):'z')+'" aria-label="Andar '+(i+1)+(seen?(f.win?': vencido':': derrota'):'')+'">'+ico(seen&&f.win?'open':seen?'foe':'chest','mid')+'<small>'+(i+1)+'</small></div>'; }
  let h='';
  if(!R.done){ const cur=fl[R.k-1], t=cur&&cur.win&&T[R.k-1]?rwHtml(T[R.k-1].reward,false):'';
    return '<div class="co-go"><button class="co-bt o go" data-x="skip">Ver o resultado</button></div><section class="co-sec"><div class="co-h5">A corrida</div><div class="co-fls">'+cells+'</div>'+(t?'<p class="co-p" style="margin-top:8px">Baú do andar '+nT(R.k)+':</p><div class="co-rws">'+t+'</div>':'')+'</section>'; }
  const reached=num(R.res.reached), rw=R.reward, paid=R.paid!==false;
  h+='<section class="co-sec" role="status"><p class="co-res">'+(reached>=R.total?'As ruínas foram vencidas: '+pl(R.total,'andar','andares'):reached>0?'Fim da corrida: andar '+nT(reached):'Fim da corrida: o 1º guardião resistiu')+'</p>';
  if(!paid) h+='<p class="co-p">Você entrou sem entrada: não ganhou prêmio desta vez.</p>';
  else if(reached>0){ h+='<div class="co-rws">'+rwHtml(rw,false)+'</div><p class="co-p" style="margin-top:8px">'+(R.mailed?'O prêmio chega pelo correio.':'Prêmio já entregue.')+'</p>'; }
  else h+='<p class="co-p">Nenhum andar vencido: sem prêmio desta vez.</p>';
  h+='<div class="co-acts">'+(R.mailed&&paid&&reached>0?'<button class="co-bt" data-x="mail">Abrir o correio</button>':'')+'<button class="co-bt o" data-x="again">Fechar</button></div><div class="co-fls" style="margin-top:10px">'+cells+'</div></section>';
  return h; }
/* BALÕES DE FRASE PRONTA (só com grupo online): as primeiras frases do módulo e o botão que abre a lista inteira. Só o ÍNDICE sai daqui */
function bubsHtml(v){ const L=(v.phrases||[]).slice(0,BUBBLES); if(!L.length) return ''; let can=false; try{ can=!!CM().canSay(S,host(),L[0].idx).ok; }catch(e){}
  return '<div class="co-bubs">'+L.map(f=>'<button class="co-bub'+(can?'':' dim')+'" data-x="say" data-i="'+esc2(f.idx)+'">'+esc2(f.txt)+'</button>').join('')+'<button class="co-bub more" data-x="phr">'+(X.sheet==='phr'?'Fechar frases':'Mais frases')+'</button></div>'; }
/* BOTÃO DOURADO (como no mock) com as entradas do dia logo acima. 1º toque arma; o 2º (verde) confirma */
function goHtml(v,on){ const left=num(v.entriesLeft), max=Math.max(0,Math.round(num(v.entriesMax))), can=left>0&&(!on||(v.party&&v.leader)), lbl=on?'Entrar com o grupo':'Entrar com retratos';
  let pips=''; for(let i=0;i<max;i++) pips+='<i'+(i<left?' class="on"':'')+'></i>';
  let h='<div class="co-go"><div class="co-ent"><span>Entradas hoje: '+nT(left)+' de '+nT(max)+'</span><span class="co-pips" aria-hidden="true">'+pips+'</span></div>';
  if(on&&!v.party) return h+'<p class="co-note">'+esc2(why('no_party'))+'.</p></div>';
  if(X.arm==='start'&&can) h+='<p class="co-note">Gasta 1 das suas entradas de hoje. O resultado sai na hora.</p><button class="co-bt b go" data-x="startok">Confirmar: gastar 1 entrada</button>';
  else h+='<button class="co-bt go'+(can?'':' o dim')+'" data-x="start">'+esc2(can?lbl:left<=0?why('limit'):why('not_leader'))+'</button>';
  return h+'</div>'; }
function groupLocalHtml(){ let h='<section class="co-sec"><div class="co-h5">Seu trio</div>';
  if(X.boot==='load') h+='<p class="co-wait" role="status">Carregando o grupo online</p>';
  else { h+='<p class="co-p">Trio com amigos e com a guilda: '+esc2(X.bootWhy||WHY_ONLINE)+'. Por enquanto você corre com dois retratos de força parecida.</p>';
    if(netOn()) h+='<div class="co-acts"><button class="co-bt o sm" data-x="retry">Tentar conectar</button></div>'; }
  return h+'</section>'; }
function guildList(){ try{ const o=S.sys&&S.sys.guild; return o&&o.id&&Array.isArray(o.members)?o.members.filter(m=>m&&m.id!=null&&!m.me).slice(0,30):[]; }catch(e){ return []; } }
function groupOnlineHtml(v){ const p=v.party; let h='';
  if(!p){ h+='<section class="co-sec"><div class="co-h5">Seu trio</div><p class="co-p">Crie um grupo e convide até dois amigos. Vaga vazia vira um retrato de força parecida.</p><div class="co-acts"><button class="co-bt" data-x="create">Criar grupo</button></div></section>';
    h+='<section class="co-sec"><div class="co-h5">Convites recebidos</div>'+((v.invites||[]).length?(v.invites||[]).map(i=>'<div class="co-row"><span>'+esc2(i.fromName||'Jogador')+' chamou você</span><button class="co-bt sm" data-x="join" data-id="'+esc2(i.partyId)+'">Entrar</button></div>').join(''):'<p class="co-p">Nenhum convite agora.</p>')+'</section>';
    return h; }
  const humans=p.members.filter(m=>!m.ghost).length;
  h+='<section class="co-sec"><div class="co-h5">Seu trio'+(v.leader?' · você é o líder':'')+'</div>';
  if(v.leader&&humans<3){ h+='<div class="co-cin"><input id="co_code" class="co-inp" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10" placeholder="CÓDIGO" aria-label="Código do amigo: só letras e números, 6 a 10" value="'+esc2(X.code)+'"><button class="co-bt sm" data-x="inv">Convidar</button></div>'; }
  else if(!v.leader) h+='<p class="co-p">'+esc2(why('not_leader'))+' convidar e começar a corrida.</p>';
  else h+='<p class="co-p">Trio completo.</p>';
  h+='<div class="co-acts">'+(v.leader&&humans<3?'<button class="co-bt o sm" data-x="gopen">Convidar da guilda</button>':'')+(X.arm==='leave'?'<button class="co-bt b sm" data-x="leaveok">Confirmar: sair do grupo</button>':'<button class="co-bt o sm" data-x="leave">Sair do grupo</button>')+'</div></section>';
  return h; }
function sheetHtml(v){ let h='';
  if(X.sheet==='phr'){ const p=v.party, myId=String(v.myId||''), nm=id=>{ if(myId&&id===myId) return 'Você'; const m=p&&p.members.find(x=>x.playerId===id); return m?m.name||'Jogador':'Jogador'; };
    const chat=p&&Array.isArray(p.chat)?p.chat.slice(-6):[]; let can=false; try{ can=!!CM().canSay(S,host(),0).ok; }catch(e){}
    h+='<section class="co-sec"><div class="co-h5">Frases do grupo</div>'+(chat.length?'<ul class="co-chat">'+chat.map(m=>'<li><b>'+esc2(nm(m.playerId))+':</b> '+esc2(m.txt)+'</li>').join('')+'</ul>':'<p class="co-p">Ninguém falou ainda.</p>')
      +'<div class="co-bubs">'+(v.phrases||[]).slice(BUBBLES).map(f=>'<button class="co-bub'+(can?'':' dim')+'" data-x="say" data-i="'+esc2(f.idx)+'">'+esc2(f.txt)+'</button>').join('')+'</div><div class="co-acts"><button class="co-bt o sm" data-x="close">Fechar frases</button></div></section>'; }
  if(X.sheet==='guild'){ const L=guildList();
    h+='<section class="co-sec"><div class="co-h5">Convidar da guilda</div>'+(L.length?L.map(m=>'<div class="co-row"><span>'+esc2(m.name||'Membro')+'</span><button class="co-bt sm" data-x="ginv" data-id="'+esc2(m.id)+'">Convidar</button></div>').join(''):'<p class="co-p">Nenhum colega de guilda para convidar agora.</p>')
      +'<div class="co-acts"><button class="co-bt o sm" data-x="close">Fechar lista</button></div></section>'; }
  return h; }
function lastHtml(v){ const L=v.lastRun; if(!L||!L.runId) return ''; const r=num(L.reached);
  return '<section class="co-sec"><div class="co-h5">Última corrida</div><p class="co-p">'+(r>0?'Chegou ao andar '+nT(r)+'.':'O 1º guardião resistiu.')+'</p></section>'; }
function tableHtml(v){ const T=v.table||[]; if(!T.length) return '';
  return '<section class="co-sec"><div class="co-h5">Prêmio de cada andar</div>'+T.map(t=>'<div class="co-tb"><b>Andar '+nT(t.k)+'</b><span>'+rwHtml(t.reward,true)+'</span></div>').join('')
    +'<p class="co-p" style="margin-top:8px">Corrida inteira:</p><div class="co-rws">'+rwHtml(v.total,false)+'</div><p class="co-p" style="margin-top:8px"><b>Nada à venda.</b> As entradas são grátis e voltam todo dia.</p></section>'; }
function draw(){
  const d=xDims(240)||{};
  if(!has()){ loopStop(); offHtml(d,'Ruínas em Trio indisponíveis agora.'); return; }
  if(!isOn()){ loopStop(); offHtml(d,'As Ruínas em Trio ainda não abriram.'); return; }   /* desligado: não chama status/view (eles preparam o save) */
  const st=statusNow(); if(!st){ loopStop(); offHtml(d,'Ruínas em Trio indisponíveis agora.'); return; }
  if(!st.open){ loopStop(); offHtml(d,st.reason==='level'?why('level')+'. Continue lutando para liberar.':why(st.reason||'off'),st.reason==='level'?'status':'alert'); return; }
  const v=viewNow(); if(!v||!v.open){ loopStop(); offHtml(d,'Ruínas em Trio indisponíveis agora.'); return; }
  const on=online(), R=X.run, grp=!!(on&&v.party);
  if(X.sheet&&!grp) X.sheet=''; if(X.arm==='leave'&&!grp) X.arm='';
  let y0=0; try{ const sc0=X.top?null:byId('co_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const myId=R?R.myId:String(v.myId||'');
  let h='<div id="co_scroll" class="x-scroll co-body"><div class="co-main"><div class="co-ports">'+teamOf(v,R,on).map(m=>portHtml(m,myId)).join('')+'</div>'+towerHtml(R,v)+'</div>'+msgHtml();
  if(R) h+=runHtml(R,v);
  else { if(grp) h+=bubsHtml(v); h+=goHtml(v,on)+sheetHtml(v)+(on?groupOnlineHtml(v):groupLocalHtml())+lastHtml(v); }
  h+=tableHtml(v)+'</div>';
  V.innerHTML=xWrap(d,'co-root '+(X.anim?'co-in':''),'<div class="co-w" style="background:'+bg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=sig();
  if(y0){ try{ const sc=byId('co_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  loopStart();
}

/* ---------- a corrida: UMA chamada ao Sys.coop.start; a resposta é reproduzida andar por andar ---------- */
function stopTimer(){ if(X.timer){ try{ clearTimeout(X.timer); }catch(e){} X.timer=0; } }
function step(){ X.timer=0; const R=X.run; if(!R||R.done) return; R.k++; const f=R.res.floors[R.k-1];
  if(!f||!f.win||R.k>=R.n){ R.done=true; sfx(num(R.res.reached)>0?'claim':'ui_tap'); } else { sfx('hit'); X.timer=setTimeout(step,STEP_MS); }
  redraw(); }
function begin(res){ let total=10, rw=null, paid, myId=''; const M=CM();
  try{ total=M.DATA.floors.length; }catch(e){} try{ rw=res.reward&&typeof res.reward==='object'?res.reward:M.rewardFor(res.reached); }catch(e){ rw={}; }
  try{ paid=M.paidOf(res); }catch(e){ paid=undefined; } try{ const n=CN(); myId=n&&typeof n.myId==='function'?String(n.myId()||''):''; }catch(e){}
  const floors=Array.isArray(res.floors)?res.floors.slice(0,total):[];
  X.run={res:Object.assign({},res,{floors:floors}),k:0,n:floors.length,total:total,done:floors.length===0,reward:rw,paid:paid,mailed:res.mailed===true,myId:myId}; X.sheet=''; X.msg=''; X.top=true;
  stopTimer(); if(!X.run.done&&typeof setTimeout==='function') X.timer=setTimeout(step,STEP_MS); }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
const LOCAL={back:1,start:1,startok:1,skip:1,again:1,mail:1,retry:1,close:1};   /* o que funciona sem o online */
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  /* 1º toque: arma (ou diz por que não dá). Nada é chamado no módulo */
  start(){ sfx('ui_tap'); const v=viewNow(); if(!v||!v.open||X.run) return; const on=online();
    if(num(v.entriesLeft)<=0){ X.arm=''; say(why('limit'),true); return redraw(); }
    if(on&&!v.party){ X.arm=''; say(why('no_party'),true); return redraw(); }
    if(on&&!v.leader){ X.arm=''; say(why('not_leader'),true); return redraw(); }
    X.arm='start'; say('Toque em Confirmar para entrar.'); redraw(); },
  /* 2º toque: Sys.coop.start UMA vez */
  startok(){ if(X.run) return; if(X.arm!=='start'){ sfx('ui_tap'); say('Toque primeiro no botão dourado.',true); return redraw(); }
    run('Entrando nas ruínas',()=>CM().start(S,host()),{ok:()=>'',after:r=>begin(r)}); },
  skip(){ const R=X.run; if(!R||R.done) return; sfx('ui_tap'); stopTimer(); const fl=R.res.floors; let k=0; while(k<fl.length&&fl[k]&&fl[k].win) k++; R.k=Math.min(fl.length,k+1); R.done=true; redraw(); },
  again(){ sfx('ui_tap'); stopTimer(); X.run=null; X.msg=''; X.arm=''; X.top=true; redraw(); if(online()) poll(true); },
  mail(){ sfx('ui_tap'); try{ if(!(window.Panels&&typeof Panels.open==='function'&&Panels.open('mail',{from:N}))) { say('O correio abre pelo Menu.',true); redraw(); } }catch(e){} },
  retry(){ sfx('ui_tap'); if(X.boot==='load') return; X.boot=''; X.bootWhy=''; boot(); redraw(); },
  close(){ sfx('ui_tap'); X.sheet=''; X.msg=''; redraw(); },
  create(){ run('Criando o grupo',()=>CN().create(S,host()),{ok:'Grupo criado. Convide até dois amigos.'}); },
  join(b){ const id=String(b.dataset.id||''); if(!id) return; run('Entrando no grupo',()=>CN().join(S,host(),id),{ok:'Você entrou no grupo.'}); },
  leave(){ sfx('ui_tap'); X.arm='leave'; say('Toque em Confirmar para sair do grupo.'); redraw(); },
  leaveok(){ if(X.arm!=='leave'){ sfx('ui_tap'); say('Toque primeiro em Sair do grupo.',true); return redraw(); } X.sheet=''; run('Saindo do grupo',()=>CN().leave(S,host()),{ok:'Você saiu do grupo.'}); },
  /* convite por código: só A-Z e 0-9; o formato é conferido pelo módulo ANTES de qualquer chamada */
  inv(){ const el=byId('co_code'), code=sanitize(el&&typeof el.value==='string'?el.value:X.code); X.code=code; let c=null; try{ c=CM().canInvite(S,host(),{friendCode:code}); }catch(e){ c=null; }
    if(!c||!c.ok){ sfx('ui_tap'); say(why(c||'error'),true); return redraw(); }
    run('Enviando o convite',()=>CN().invite(S,host(),{friendCode:code}),{ok:'Convite enviado.',after:()=>{ X.code=''; },why:r=>r&&r.reason==='limit'?WHY_INV_DAY:why(r||'error')}); },
  gopen(){ sfx('ui_tap'); X.sheet='guild'; X.msg=''; redraw(); },
  ginv(b){ const id=String(b.dataset.id||''); if(!id) return; let c=null; try{ c=CM().canInvite(S,host(),{guildMemberId:id}); }catch(e){ c=null; }
    if(!c||!c.ok){ sfx('ui_tap'); say(why(c||'error'),true); return redraw(); }
    run('Enviando o convite',()=>CN().invite(S,host(),{guildMemberId:id}),{ok:'Convite enviado.',why:r=>r&&r.reason==='limit'?WHY_INV_DAY:why(r||'error')}); },
  phr(){ sfx('ui_tap'); X.sheet=X.sheet==='phr'?'':'phr'; X.msg=''; redraw(); },
  /* frase pronta: só o ÍNDICE sai daqui. Intervalo e teto do dia conferidos pelo módulo antes */
  say(b){ const idx=parseInt(b.dataset.i,10); const M=CM(); let c=null; try{ c=M.canSay(S,host(),idx); }catch(e){ c=null; }
    const lim=()=>{ let day=false; try{ day=M.groupSaid(S,host())>=M.DATA.msg.perDay; }catch(e){} return day?WHY_SAY_DAY:WHY_SAY_WAIT; };
    if(!c||!c.ok){ sfx('ui_tap'); say(c&&c.reason==='limit'?lim():why(c||'error'),true); return redraw(); }
    run('Enviando a frase',()=>CN().say(S,host(),idx),{ok:'Frase enviada.',why:r=>r&&r.reason==='limit'?lim():why(r||'error')}); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!isOn()) return;                                   /* módulo ausente ou desligado: só o Voltar funciona */
  if(X.busy) return;                                    /* uma ação por vez: o resto espera a resposta */
  const st=statusNow(); if(!st||!st.open) return;       /* trancado por nível: só o Voltar */
  if(!LOCAL[a]&&!online()){ sfx('ui_tap'); say(WHY_ONLINE,true); return redraw(); }
  if(a!=='startok'&&a!=='leaveok'&&a!=='start'&&a!=='leave') X.arm='';
  return ACT[a](b); }
/* o campo do código só aceita A-Z e 0-9 (o que é digitado é limpo na hora; não é chat) */
try{ if(typeof document!=='undefined'&&typeof document.addEventListener==='function') document.addEventListener('input',ev=>{ const t=ev&&ev.target; if(!t||t.id!=='co_code'||typeof t.value!=='string') return;
  const c=sanitize(t.value); if(t.value!==c) t.value=c; X.code=c; }); }catch(e){}

/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[]; try{ const b=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(b) u.push(b); }catch(e){}
  if(CO_ART_ON) for(const k in CO_ART) u.push(CO_ART_DIR+CO_ART[k]+'.png'); return u; }
function clearMsg(){ X.msg=''; const el=byId('co_msg'); if(el){ el.innerHTML=''; try{ el.className='co-msg'; }catch(e){} } }
/* PONTE: cartão das Instâncias e selo do Menu. Tela ou módulo desligado = nada é lido do save */
const panelOn=()=>{ try{ return !!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N)); }catch(e){ return false; } };
function card(){ if(!panelOn()||!isOn()) return {on:false}; const st=statusNow(); if(!st) return {on:false};
  if(!st.open) return {on:true,open:false,title:'Ruínas em Trio',line:why(st.reason||'off')};
  return {on:true,open:true,title:'Ruínas em Trio',line:nT(st.entriesLeft)+' de '+nT(st.entriesMax)+' entradas hoje',entriesLeft:num(st.entriesLeft),invites:(st.invites||[]).length}; }
function alerts(){ try{ const c=card(); return c.on&&c.open?c.entriesLeft+c.invites:0; }catch(e){ return 0; } }

if(!('coop' in PANEL_ON)) PANEL_ON.coop=false;
const def=Panels.add(N,{title:'Ruínas em Trio',actions:Object.keys(ACT),iconOf:icoOf,urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.sig==='x') return;
    if(X.msg&&!X.arm&&!X.busy&&now()-X.msgT>MSG_MS) clearMsg();
    if(X.busy||X.run) return;
    if(X.sig&&sig()!==X.sig) return redraw();
    poll(false); },
  busy(){ return !!X.busy||!!(X.run&&!X.run.done); },
  onOpen(){ X.gen++; stopTimer(); X.busy=''; X.arm=''; X.msg=''; X.code=''; X.sheet=''; X.run=null; X.boot=''; X.bootWhy=''; X.pollT=0; X.sig=''; X.anim=true; X.top=true;
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){}   /* pede a carga das imagens já na abertura */
    if(!isOn()) return;                                               /* desligada: nenhuma leitura, nenhuma rede */
    if(online()) poll(true); else boot(); },
  onClose(){ X.gen++; stopTimer(); loopStop(); X.busy=''; X.arm=''; X.msg=''; X.sheet=''; X.run=null; } });
window.PCoop={X:X,def:def,urls:urls,card:card,alerts:alerts,sanitize:sanitize,open(){ try{ return !!(window.Panels&&Panels.open(N)); }catch(e){ return false; } }};
})();
