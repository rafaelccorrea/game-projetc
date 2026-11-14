'use strict';
/* ================= TELA DUPLA DAS ERAS (docs/proto/v2/Dupla.html) — NASCE DESLIGADA (PANEL_ON.duo = false) =================
   Só a TELA. NENHUMA regra e NENHUM número aqui:
   - regras, limites, metas, prêmios e as 18 frases prontas: Sys.duo (js/sys/duo.js): on, status, view, ensure, canSend, DATA;
   - tudo que MUDA passa pelo SERVIDOR, pelo Sys.duoNet (js/sys/duonet.js; contrato docs/API_SERVIDOR.md 16.1): start, refresh, friendCode e as ações em
     Promise {ok, reason, retryAfterMs}: invite(código), accept(código), decline(código), leave(), block(código), send(índice), claim(id).
     Durante a Promise a linha de aviso mostra "Carregando…"; a recusa do servidor vira texto (tabela why).
   O JOGO TEM MENORES: não existe texto livre entre jogadores. O único campo da tela é o CÓDIGO DE AMIGO (A-Z e 0-9, 6 a 10), que nunca aparece para
   ninguém; a conversa é só pelas frases prontas do módulo, que viajam pelo ÍNDICE. Nada da Dupla é vendido: sem preço, sem compra, sem sorteio.
   ESTADOS HONESTOS: sem o módulo ou com a chave do módulo desligada = aviso e Voltar (nada é lido nem gravado no save); nível baixo = aviso com o nível
   do módulo; rede desligada ou sem conexão = "abre com o online" e as regras reais do módulo (nenhum parceiro, convite ou número inventado);
   conectando = "Carregando…"; recusa do servidor = o motivo em texto.
   Sair da dupla e bloquear pedem confirmação em DOIS toques, numa faixa dentro da tela (acima da lista, nunca por cima do botão tocado).
   Avisos saem numa LINHA RESERVADA no topo (não cobre botão). Sem emoji, sem alert/confirm/prompt. O cabeçalho (Voltar, título, moedas) é do jogo.
   Abre por Panels.open('duo'). Para o Menu: window.PDuo.alerts() devolve o número do selo (convites recebidos, ou frases novas do parceiro). */
(function(){
const N='duo';
const TOAST_MS=3200;

/* ---------- leituras dos módulos ---------- */
const DM=()=>{ const D=window.Sys&&Sys.duo; return D&&D.DATA&&typeof D.view==='function'&&typeof D.status==='function'&&typeof D.ensure==='function'?D:null; };
const DN=()=>{ const n=window.Sys&&Sys.duoNet; return n&&n.DATA&&typeof n.state==='function'?n:null; };
const host=()=>(window.Sys&&Sys.host)||null;
const sv=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const duoOn=()=>{ try{ const D=DM(); return !!(D&&D.DATA.on===true); }catch(e){ return false; } };
const netSt=()=>{ try{ const n=DN(); return n?n.state():null; }catch(e){ return null; } };
const online=()=>{ const z=netSt(); return !!(z&&z.on&&z.started); };
const gameNow=()=>{ try{ const h=host(); if(h&&h.now) return h.now(); }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const saved=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const isN=v=>typeof v==='number'&&isFinite(v);
const num=v=>isN(v)?v:0;
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return nT(v); };
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
const p2=n=>String(n).padStart(2,'0');
const hms=ms=>{ const s=Math.max(0,Math.ceil(num(ms)/1000)); return p2(Math.floor(s/3600))+':'+p2(Math.floor(s%3600/60))+':'+p2(s%60); };
const hm=ms=>{ const m=Math.max(1,Math.ceil(num(ms)/60000)), h=Math.floor(m/60); return h>0?h+' h '+(m%60)+' min':m+' min'; };
function ago(at){ if(!(num(at)>0)) return ''; const m=Math.max(0,Math.round((gameNow()-at)/60000)); return m<1?'agora':m<60?'há '+m+' min':m<2880?'há '+Math.round(m/60)+' h':'há '+Math.round(m/1440)+' dias'; }
const eraName=e=>{ if(!isN(e)) return ''; try{ if(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n) return String(ERAS[e].n); }catch(er){} return 'Era '+(e+1); };
const viewNow=()=>{ try{ const D=DM(); if(!D||!duoOn()) return null; const v=D.view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const data=()=>{ const D=DM(); return (D&&D.DATA)||{}; };
const sanitize=v=>String(v==null?'':v).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10);
const codeOk=c=>{ try{ return data().codeRe.test(c); }catch(e){ return false; } };

/* ---------- recusas (o módulo e o servidor decidem; aqui só o texto, com os números do módulo) ---------- */
function why(r){ const D=data(), I=D.invite||{}, M=D.msg||{};
  const T={off:'A Dupla ainda não foi ligada',online:'Em breve: abre com o online',module:'Dupla indisponível agora',data:'Algo deu errado. Tente de novo',
    code:'Código inválido ou não encontrado: confira com o seu amigo',self:'Esse é o seu código',dup:'Você já convidou esse código',
    limit:'Os convites de hoje acabaram ('+nT(I.perDay)+' por dia). Amanhã tem mais',limit_out:'Você já tem '+nT(I.maxOut)+' convites esperando resposta',
    paired:'Você já tem uma dupla',relink:'Você saiu de uma dupla: espere a contagem para formar outra',level:'A Dupla abre no nível '+nT(D.needLevel),
    target_paired:'Esse amigo já tem uma dupla',target_level:'Esse amigo ainda não chegou ao nível da Dupla',target_full:'Esse amigo já tem convites demais esperando',
    invite:'Esse convite venceu',blocked:'Jogador bloqueado',none:'Você está sem dupla agora',id:'Isso não existe mais',
    wait:'Aguarde um pouco para a próxima frase',day:'Chegou a '+nT(M.perDay)+' frases hoje. Amanhã tem mais',repeat:'Essa já foi '+nT(M.repeatMax)+' vezes seguidas: escolha outra',phrase:'Frase inválida',
    done:'A meta ainda não fechou',presence:'A meta precisa dos dois: o seu parceiro ainda não entrou',claimed:'Você já resgatou este prêmio',
    not_found:'A Dupla ainda não abriu',forbidden:'Isso não é permitido agora',bad_request:'Não deu certo. Confira e tente de novo',daily_limit:'Limite de hoje atingido. Amanhã tem mais',
    net_off:'Sem conexão: tente de novo',timeout:'Sem conexão: tente de novo',offline:'Sem conexão: tente de novo',server:'Sem resposta agora. Tente de novo'};
  return T[r]||'Não foi possível agora. Tente de novo'; }
/* recusa inteira ({reason, ms, retryAfterMs}): quando o tempo que falta chega, ele entra no texto */
function whyR(r){ const R=r&&r.reason, ms=num(r&&r.retryAfterMs)||num(r&&r.ms);
  if(R==='wait') return 'Aguarde '+Math.max(1,Math.ceil((ms||num((data().msg||{}).cooldownMs))/1000))+' s para a próxima frase';
  if(R==='relink'&&ms>0) return 'Você saiu de uma dupla: espere '+hm(ms)+' para formar outra';
  if(R==='level'&&r&&isN(r.needLevel)) return 'A Dupla abre no nível '+nT(r.needLevel);
  return why(R); }

/* ---------- arte: 1 imagem do jogo (moeda) e ícones desenhados no código (os do protótipo) ---------- */
const IC={coin:'assets/ui/coin.png'};
const K='stroke="#1a110b" stroke-width="2.4" stroke-linejoin="round"';
const SV=(inner,z)=>'<svg class="du-ic" viewBox="0 0 48 48" width="'+(z||20)+'" height="'+(z||20)+'" aria-hidden="true">'+inner+'</svg>';
const I_STONE='<path d="M10 18l14-12 14 12-6 22H16z" fill="#9ab4d6" '+K+'/><path d="M10 18h28M24 6l-6 12 6 22 6-22z" fill="none" stroke="#2a3a5a" stroke-width="2"/>';
const I_DUO='<circle cx="17" cy="16" r="8" fill="#ffd25e" '+K+'/><path d="M3 42c1-11 6-16 14-16s13 5 14 16z" fill="#ffc94a" '+K+'/><circle cx="32" cy="18" r="7.5" fill="#8ff5dc" '+K+'/><path d="M20 44c1-10 5-15 12-15s12 5 13 15z" fill="#5ee7c8" '+K+'/>';
const I_ONE='<circle cx="24" cy="17" r="9" fill="#8ff5dc" '+K+'/><path d="M7 44c1-12 7-18 17-18s16 6 17 18z" fill="#5ee7c8" '+K+'/>';
const I_ENV='<rect x="5" y="11" width="38" height="27" rx="4" fill="#e9f6ff" '+K+'/><path d="M6 13l18 14 18-14" fill="none" stroke="#1a110b" stroke-width="2.6" stroke-linejoin="round"/>';
const I_COPY='<rect x="15" y="14" width="24" height="28" rx="4" fill="#f6ecdf" '+K+'/><path d="M10 34V10a4 4 0 014-4h18" fill="none" stroke="#f6ecdf" stroke-width="4" stroke-linecap="round"/>';
const I_SHIELD='<path d="M24 4l17 6v12c0 11-7 18-17 22C14 40 7 33 7 22V10z" fill="#7fe07a" '+K+'/><path d="M16 24l6 6 11-12" fill="none" stroke="#0d2410" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
const I_BLOCK='<circle cx="24" cy="24" r="17" fill="none" stroke="#ffb3a8" stroke-width="5"/><path d="M12 36L36 12" stroke="#ffb3a8" stroke-width="5" stroke-linecap="round"/>';
const I_DOOR='<path d="M8 6h20v36H8z" fill="#8a5a34" '+K+'/><path d="M28 24h15M37 17l7 7-7 7" fill="none" stroke="#f6ecdf" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>';
const I_BUB='<path d="M6 10h36v22H20l-9 8v-8H6z" fill="#f6ecdf" '+K+'/><circle cx="16" cy="21" r="2.6" fill="#1a110b"/><circle cx="24" cy="21" r="2.6" fill="#1a110b"/><circle cx="32" cy="21" r="2.6" fill="#1a110b"/>';
const I_LOCK='<rect x="10" y="21" width="28" height="22" rx="4" fill="#ffd25e" '+K+'/><path d="M16 21v-6a8 8 0 0116 0v6" fill="none" stroke="#1a110b" stroke-width="4"/>';
const I_BACK='<path d="M30 8L14 24l16 16" fill="none" stroke="#f6ecdf" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>';
const I_CHAIN='<g fill="none" stroke="#1a110b" stroke-width="8"><rect x="5" y="16" width="22" height="16" rx="8"/><rect x="21" y="16" width="22" height="16" rx="8"/></g><g fill="none" stroke="#c3ccde" stroke-width="4"><rect x="5" y="16" width="22" height="16" rx="8"/><rect x="21" y="16" width="22" height="16" rx="8"/></g>';
const I_HEART='<path d="M24 42C10 32 5 24 5 16a9.5 9.5 0 0119-3 9.5 9.5 0 0119 3c0 8-5 16-19 26z" fill="#ff5468" '+K+'/><path d="M13 13c-2 1-3 3-3 5" fill="none" stroke="#ffc2c9" stroke-width="3" stroke-linecap="round"/>';
const I_BOSS='<path d="M12 17L5 6l13 5M36 17l7-11-13 5" fill="#ffd25e" '+K+'/><path d="M11 23c0-9 5-14 13-14s13 5 13 14v8l-5 4v6H16v-6l-5-4z" fill="#e2574c" '+K+'/><circle cx="19" cy="25" r="3" fill="#1a110b"/><circle cx="29" cy="25" r="3" fill="#1a110b"/>';
const I_FLAG='<path d="M14 8h25l-7 9 7 9H14z" fill="#7fe07a" '+K+'/><path d="M12 44V6" stroke="#1a110b" stroke-width="7" stroke-linecap="round"/><path d="M12 44V6" stroke="#f6ecdf" stroke-width="3.4" stroke-linecap="round"/>';
const I_SWORDS='<path d="M7 7l9 2 16 18-5 5L9 16z" fill="#dbe8ff" '+K+'/><path d="M41 7l-9 2-16 18 5 5 18-16z" fill="#9ab4d6" '+K+'/><path d="M8 40l9-9M40 40l-9-9" stroke="#1a110b" stroke-width="8" stroke-linecap="round"/><path d="M8 40l9-9M40 40l-9-9" stroke="#ffd25e" stroke-width="4" stroke-linecap="round"/>';
const I_SCROLL='<path d="M13 7h26v27a7 7 0 01-7 7H13z" fill="#f6e3b0" '+K+'/><path d="M13 7a5 5 0 00-5 5v4h5" fill="#e2c98a" '+K+'/><path d="M19 17h14M19 24h14M19 31h8" fill="none" stroke="#6b4426" stroke-width="2.6" stroke-linecap="round"/>';
const W_IC={boss200:I_BOSS,stages40:I_FLAG,arena20:I_SWORDS,days5:I_DUO};   /* ícone por missão da semana (id do Sys.duo); id novo cai no I_DUO */
const coinImg='<img src="'+IC.coin+'" alt="" width="20" height="20">';
/* ARTE QUE A TELA AINDA DESENHA EM CSS/SVG (mocks du_a, du_fr, du_cv). Quando a Arte entregar os arquivos, o caminho entra AQUI e só aqui (vazio = desenho em CSS):
   retratoEu/retratoPar: fundo dos dois retratos · madeira: painel das frases · placa: placa do código */
const ART={retratoEu:'',retratoPar:'',madeira:'',placa:''};
const artBg=k=>ART[k]?' style="background:url('+ART[k]+') center/cover no-repeat"':'';
const QUICK=5;   /* quantas frases prontas (as primeiras do módulo) viram balão na tela da dupla; as outras abrem em "Abrir" */

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.du{--bg:#12142a;--pan:rgba(22,24,44,.95);--pan2:rgba(34,30,62,.97);--line:#8a6a3a;--gold:#e9b949;--g2:#ffd27a;--cream:#f8ecd4;--mut:#c6bdd6;--ink:#3a2413;--ink2:#5c4630;--paper:#fbf1dc;--paper2:#f1dfba;--wood:#6b4426;--wood2:#4a2d18;--pink:#ff6fae;--pc:#ffd95e;--blue:#3a72cc;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--bg);color:var(--cream);font-family:Nunito,system-ui,sans-serif}
.du *{box-sizing:border-box}
.du button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.du .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.du-ic{display:block;flex:none}
.du-bg{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none}
.du-in{animation:du-fade .2s ease-out}
@keyframes du-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.du-strip{position:relative;z-index:2;flex:none;min-height:44px;margin:8px 12px 0;padding:5px 10px;border-radius:12px;background:rgba(18,20,42,.88);border:1px solid rgba(255,210,122,.42);display:flex;align-items:center;justify-content:center;min-width:0}
.du-st{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;font-size:11.5px;font-weight:900;line-height:1.3;text-align:center;overflow-wrap:anywhere}
.du-st span{min-width:0;overflow-wrap:anywhere}
.du-st.busy{color:#cdeffd}
.du-st.bad{color:#ffd0c6}
.du-st.ok{color:#d9ffd4}
.du-conf{position:relative;z-index:2;flex:none;margin:8px 12px 0;padding:11px 11px 10px;border-radius:16px;background:var(--pan2);border:2px solid #ff8a6a;box-shadow:0 4px 0 rgba(0,0,0,.4);min-width:0}
.du-conf b{display:block;font-size:19px;line-height:1.15;color:#fff;text-align:center;overflow-wrap:anywhere}
.du-conf ul{margin:7px 0 9px;padding-left:18px;font-size:12.5px;font-weight:800;line-height:1.4}
.du-conf ul em{font-style:normal;color:var(--g2)}
.du-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.du-scroll{position:relative;z-index:2;flex:1;min-height:0;min-width:0;padding:8px 12px 16px;display:flex;flex-direction:column;gap:10px}
.du-card{flex:none;border-radius:16px;background:var(--pan);border:2px solid var(--line);box-shadow:0 4px 0 rgba(0,0,0,.38),inset 0 0 0 1px rgba(255,210,122,.1);padding:10px 11px;min-width:0}
.du-card.hi{background:linear-gradient(180deg,rgba(58,44,96,.96),rgba(28,26,56,.96));border-color:var(--g2)}
.du-card h4{margin:0 0 6px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:16px;line-height:1.15;color:var(--g2);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:2px 8px;min-width:0}
.du-card h4 span{font-family:Nunito,system-ui,sans-serif;font-size:11px;font-weight:900;color:var(--mut);min-width:0;overflow-wrap:anywhere}
.du-card h4 span.cnt{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:14px;color:var(--g2)}
.du-card h4.ct{justify-content:center;text-align:center;font-size:20px;margin:12px 0 4px;text-shadow:0 2px 0 rgba(0,0,0,.5)}
.du-card h4.ct span{flex:0 0 100%;text-align:center}
.du-note{font-size:11.5px;font-weight:800;color:var(--mut);line-height:1.35;margin:6px 0 0;overflow-wrap:anywhere}
.du-note b{color:var(--cream)}
.du-miss{font-size:11.5px;font-weight:800;color:#ffb38a;margin:5px 0 0;line-height:1.3;overflow-wrap:anywhere}
.du-bt,.xs .du-bt{flex:none;min-height:44px;min-width:44px;padding:4px 12px;border-radius:13px;border:2px solid rgba(255,210,122,.35);background:#2a2748;color:#f8ecd4;font-weight:900;font-size:14px;line-height:1.15;display:inline-flex;align-items:center;justify-content:center;gap:5px;text-align:center;overflow-wrap:anywhere}
.du-bt:active{transform:translateY(2px)}
.du-bt.g,.xs .du-bt.g{border:0;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;box-shadow:0 3px 0 #1d5a1c}
.du-bt.r,.xs .du-bt.r{border:2px solid rgba(255,107,107,.6);background:#3a1c26;color:#ffb3a8}
.du-bt.y,.xs .du-bt.y{border:2px solid #9a5a10;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #7a4208}
.du-bt.b,.xs .du-bt.b{border:2px solid #1b3c7a;background:linear-gradient(180deg,var(--blue),#27509f);color:#fff;box-shadow:0 3px 0 #16305f;text-shadow:0 1px 0 rgba(0,0,0,.45)}
.du-bt.b small{display:block;font-size:10.5px;font-weight:800;line-height:1.15}
.du-bt.b .tw{min-width:0;overflow-wrap:anywhere}
.du-bt.off,.xs .du-bt.off{opacity:.5;box-shadow:none}
/* cartão claro do convite (mock du_cv): papel creme, aro dourado, placa de madeira com o código */
.du-card.lt{background:linear-gradient(180deg,var(--paper),var(--paper2));border:3px solid var(--gold);box-shadow:0 0 0 2px #7a4a17,0 6px 0 rgba(0,0,0,.42);color:var(--ink);padding:12px 12px 11px}
.du-card.lt h4{color:#7a3d0c}
.du-card.lt h4 span{color:var(--ink2)}
.du-card.lt h4 span.cnt{color:#7a3d0c}
.du-card.lt h4.pl{justify-content:center;text-align:center;font-size:19px;margin-bottom:8px}
.du-card.lt h4.pl span{flex:0 0 100%;text-align:center}
.du-card.lt h4.s2{margin-top:12px}
.du-card.lt .du-note{color:var(--ink2)}
.du-card.lt .du-note b{color:var(--ink)}
.du-myc{display:flex;align-items:center;gap:8px;min-width:0;padding:9px 10px;border-radius:14px;background:linear-gradient(180deg,#8a5a34,var(--wood) 55%,#5c3a20);border:3px solid var(--gold);box-shadow:inset 0 0 0 2px var(--wood2),0 3px 0 #7a4a17}
.du-myc .cd{flex:1;min-width:0;min-height:48px;display:flex;align-items:center;justify-content:center;font-family:'Lilita One',Nunito,sans-serif;font-size:25px;letter-spacing:3px;color:#fff3d6;text-shadow:0 2px 0 #2a1a0e;text-align:center;overflow-wrap:anywhere;padding:2px 4px}
.du-myc .cd.sm{font-family:Nunito,system-ui,sans-serif;font-size:12.5px;font-weight:900;letter-spacing:0;color:#fbe9c8;text-shadow:none}
.du-cin{display:flex;gap:8px;align-items:stretch;min-width:0}
.du-inp{flex:1;min-width:0;height:48px;border-radius:12px;background:#e6d3b0;border:2px solid #c2a271;color:var(--ink);font:400 20px 'Lilita One',Nunito,sans-serif;letter-spacing:2px;padding:0 10px;text-transform:uppercase}
.du-inp::placeholder{font:800 12.5px Nunito,system-ui,sans-serif;letter-spacing:0;color:#6e563c;text-transform:none}
.du-inp:disabled{opacity:.5}
.du-hint{font-size:11px;font-weight:800;color:var(--ink2);margin-top:6px;line-height:1.35;overflow-wrap:anywhere}
.du-hint.err{color:#a3261a}
.du-inv{padding:7px 0;border-top:1px solid rgba(255,236,200,.1);min-width:0}
.du-inv.first{border-top:0;padding-top:0}
.du-inv .who{display:flex;align-items:center;gap:8px;min-width:0}
.du-av{flex:none;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#ffcf8a,#a4571f 78%);border:2px solid var(--gold);display:grid;place-items:center;position:relative}
.du-inv .tx{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.25}
.du-inv .tx b{display:block;font-size:14.5px;color:#fff;overflow-wrap:anywhere}
.du-inv .tx small{display:block;color:var(--mut);font-size:11px;line-height:1.25;overflow-wrap:anywhere}
.du-inv .acts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 48px;gap:6px;margin-top:6px}
.du-inv .acts .du-bt{min-width:0;padding:4px 6px;font-size:13px}
.du-empty{font-size:12px;font-weight:800;color:var(--mut);text-align:center;padding:6px 0;line-height:1.35}
/* os dois retratos (mock du_a): você à esquerda (o herói do jogo), o parceiro à direita, o elo e o coração no meio */
.du-pair{display:grid;grid-template-columns:minmax(0,1fr) minmax(64px,84px) minmax(0,1fr);align-items:center;gap:6px;min-width:0}
.du-pf{min-width:0;text-align:center}
.du-pf .fr{position:relative;display:block;width:100%;max-width:132px;margin:0 auto;border-radius:14px;border:3px solid var(--gold);box-shadow:0 0 0 2px #5a3a12,0 5px 0 rgba(0,0,0,.42);overflow:hidden}
.du-pf .fr:before{content:"";display:block;padding-top:116%}
.du-pf.me .fr{background:radial-gradient(circle at 50% 42%,#6cc8ff,#1f4f9a 80%)}
.du-pf.pa .fr{background:radial-gradient(circle at 50% 42%,#ffd79a,#a4571f 80%)}
.du-pf .fr canvas,.du-pf .fr .ph{position:absolute;left:0;top:0;width:100%;height:100%}
.du-pf .fr .ph{display:grid;place-items:center}
.du-pf .fr .dot{position:absolute;right:6px;bottom:6px;width:16px;height:16px;border-radius:50%;background:#43e06a;border:2px solid #1a120c}
.du-pf .fr .dot.off{background:#8a7a68}
.du-pf small{display:block;margin-top:5px;font-size:11px;font-weight:900;line-height:1.2;color:var(--mut);overflow-wrap:anywhere}
.du-lk{min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center}
.du-lk b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:14px;line-height:1.1;color:var(--g2);overflow-wrap:anywhere}
.du-lk em{display:block;font-style:normal;font-family:'Lilita One',Nunito,sans-serif;font-size:15px;line-height:1.1;color:#fff;overflow-wrap:anywhere}
.du-pt{display:block;min-width:0;margin-top:8px;text-align:center}
.du-pt .tx{display:block;min-width:0}
.du-pt .tx small{display:block;font-size:10.5px;font-weight:900;color:var(--mut);letter-spacing:.3px;line-height:1.25}
.du-pt .tx b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1.1;color:#fff;overflow-wrap:anywhere}
.du-pt .tx i{display:block;font-style:normal;font-size:12px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.du-pt .tx i em{font-style:normal;color:#43e06a;font-weight:900}
.du-pt .tx i em.off{color:var(--mut)}
.du-day{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,210,122,.2)}
.du-bar{position:relative;height:18px;border-radius:9px;background:#1a1530;overflow:hidden;display:flex;border:2px solid var(--line);box-shadow:inset 0 2px 3px rgba(0,0,0,.55)}
.du-bar i{display:block;height:100%}
.du-bar .me{background:linear-gradient(90deg,#ff6fae,#ff9a62)}
.du-bar .pa{background:linear-gradient(90deg,#ff9a62,#ffd95e)}
.du-leg{display:flex;justify-content:space-between;gap:6px;margin-top:4px;font-size:11px;font-weight:900;flex-wrap:wrap;line-height:1.3}
.du-leg span{min-width:0;overflow-wrap:anywhere}
.du-leg .m{color:#ffa3cb}
.du-leg .p{color:#ffd95e}
.du-rw{display:flex;align-items:center;gap:8px;margin-top:7px;min-width:0}
.du-rw .chips{flex:1;min-width:0;display:flex;gap:5px;flex-wrap:wrap}
.du-chip{display:inline-flex;align-items:center;gap:3px;min-height:26px;padding:0 7px 0 3px;border-radius:13px;background:rgba(0,0,0,.35);border:1px solid rgba(255,210,122,.22);font-weight:900;font-size:12px}
.du-chip img{width:20px;height:20px;flex:none;object-fit:contain}
.du-got{flex:none;display:inline-flex;align-items:center;gap:5px;min-height:44px;padding:0 10px;border-radius:13px;background:rgba(94,231,255,.12);border:1.5px solid rgba(94,231,255,.5);color:#bff4ff;font-weight:900;font-size:12.5px;line-height:1.15;text-align:center}
.du-wm{display:grid;grid-template-columns:38px minmax(0,1fr);gap:0 9px;align-items:start;padding:8px 0;border-top:1px solid rgba(255,210,122,.14);min-width:0}
.du-wm.first{border-top:0;padding-top:2px}
.du-wm .wi{padding-top:2px}
.du-wm .wb{min-width:0}
.du-wm .nm{font-size:13.5px;font-weight:900;line-height:1.2;color:var(--cream);margin-bottom:4px;min-width:0;overflow-wrap:anywhere}
.du-wm .nm b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:14.5px;color:var(--g2)}
/* frases rápidas na tela da dupla: balões creme (mock du_a) */
.du-fpv{display:flex;align-items:center;gap:8px;min-width:0}
.du-fpv .q{flex:1;min-width:0;font-size:12.5px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.du-fpv .q b{color:var(--pc)}
.du-quick{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px 8px;margin-top:10px;padding-bottom:8px}
.du-qb,.xs .du-qb{position:relative;min-width:0;min-height:48px;padding:5px 6px;border-radius:14px;border:2px solid var(--wood2);background:linear-gradient(180deg,#fff7e4,#f1e2c0);color:var(--ink);box-shadow:0 3px 0 #2a1a0e;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:14.5px;line-height:1.12;text-align:center;overflow-wrap:anywhere}
.du-qb:after{content:"";position:absolute;left:14px;bottom:-8px;width:12px;height:12px;background:#f1e2c0;border-right:2px solid var(--wood2);border-bottom:2px solid var(--wood2);transform:skewX(28deg) rotate(45deg)}
.du-qb:active{transform:translateY(2px)}
.du-quick .du-bt.b{min-width:0;min-height:48px;padding:4px 6px;font-size:13.5px}
.du-rule{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-top:1px solid rgba(255,210,122,.14);font-size:12px;font-weight:800;line-height:1.3;min-width:0}
.du-rule.first{border-top:0}
.du-rule span{min-width:0;overflow-wrap:anywhere}
.du-rule span:first-child{flex:none;max-width:40%;color:var(--g2);font-weight:900}
.du-rule span:last-child{text-align:right}
.du-wt{text-align:center}
.du-wt b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:19px;color:#fff;line-height:1.15}
.du-wt .tm{display:block;font-family:'Lilita One',Nunito,sans-serif;font-size:38px;line-height:1.15;color:var(--g2);text-shadow:0 2px 0 #000;letter-spacing:1px}
.du-wt small{display:block;font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.du-wt small.d{color:var(--mut);margin-top:4px}
/* frases prontas (mock du_fr): painel de madeira com cantos dourados e medalhões redondos */
.du-ph{position:relative;z-index:2;flex:none;display:flex;align-items:center;gap:8px;margin:8px 12px 0;min-width:0}
.du-ph b{flex:1;min-width:0;font-size:18px;line-height:1.15;color:#fff;overflow-wrap:anywhere}
.du-chat{position:relative;z-index:2;flex:1 1 110px;min-height:84px;min-width:0;margin:8px 12px 0;padding:8px 10px;border-radius:14px;background:rgba(14,15,34,.84);border:1px solid rgba(255,210,122,.2);display:flex;flex-direction:column;gap:6px}
.du-bub{flex:none;max-width:82%;padding:7px 11px;border-radius:15px;font-size:14px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.du-bub small{display:block;font-size:10px;font-weight:800;opacity:.85;margin-top:2px}
.du-bub.me{align-self:flex-end;background:linear-gradient(180deg,#ffe07a,#f2b52a);color:#2a1403;border-bottom-right-radius:4px}
.du-bub.pa{align-self:flex-start;background:linear-gradient(180deg,#fff7e4,#f1e2c0);color:var(--ink);border:1px solid var(--wood2);border-bottom-left-radius:4px}
.du-wood{position:relative;z-index:2;flex:1 1 250px;min-height:176px;min-width:0;margin:10px 6px 0;padding:10px 9px 0;border-radius:16px 16px 0 0;background:repeating-linear-gradient(180deg,#5c3a20 0,#5c3a20 34px,#4f311a 34px,#4f311a 36px);border:3px solid #2a1a0e;border-bottom:0;box-shadow:inset 0 0 0 2px rgba(255,201,74,.22);display:flex;flex-direction:column}
.du-wood:before,.du-wood:after{content:"";position:absolute;top:-4px;width:30px;height:30px;border-top:6px solid #f0b53a;pointer-events:none}
.du-wood:before{left:-4px;border-left:6px solid #f0b53a;border-top-left-radius:18px}
.du-wood:after{right:-4px;border-right:6px solid #f0b53a;border-top-right-radius:18px}
.du-wood h3{flex:none;margin:0 0 4px;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1.1;color:var(--g2);text-shadow:0 2px 0 #2a1a0e}
.du-cbar{flex:none;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:2px 8px;font-size:11.5px;font-weight:900;line-height:1.3;min-width:0;color:var(--cream)}
.du-cbar .cd{color:#9ff5c0}
.du-cbar .cd.w{color:#ffc29a}
.du-cbar b{color:var(--g2)}
.du-pgrid{flex:1;min-height:0;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-content:start;gap:8px 6px;margin-top:8px;padding-bottom:12px}
.du-phb,.xs .du-phb{min-width:0;min-height:76px;padding:2px;border:0;border-radius:12px;background:none;color:var(--cream);font-weight:900;font-size:12.5px;line-height:1.15;text-align:center;overflow-wrap:anywhere;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px}
.du-phb i{flex:none;width:48px;height:48px;border-radius:50%;border:3px solid #f0b53a;box-shadow:0 0 0 2px #4a2d18,0 0 10px rgba(255,170,60,.5);display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#6fb4f0,#27509f)}
.du-phb:nth-child(5n+2) i{background:radial-gradient(circle at 50% 35%,#f2a85a,#9a4a14)}
.du-phb:nth-child(5n+3) i{background:radial-gradient(circle at 50% 35%,#7fe0a0,#1f7a46)}
.du-phb:nth-child(5n+4) i{background:radial-gradient(circle at 50% 35%,#f07a7a,#8a2330)}
.du-phb:nth-child(5n+5) i{background:radial-gradient(circle at 50% 35%,#c59af2,#5a2f9a)}
.du-phb span{min-width:0;max-width:100%;overflow-wrap:anywhere}
.du-phb:active i{transform:translateY(2px)}
.du-phb.cw,.xs .du-phb.cw{opacity:.5}
.du-phb.rp,.xs .du-phb.rp{opacity:.42}
.du-phb.rp i{border-style:dashed}
.du-gate{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.du-gate b{font-size:26px;line-height:1.1;color:var(--g2);text-shadow:0 2px 0 rgba(0,0,0,.5)}
.du-gate span{font-size:13px;font-weight:800;color:var(--mut);line-height:1.4;overflow-wrap:anywhere}
.du-gate .du-bt{min-height:48px;padding:0 26px;font-size:15px}
@media (prefers-reduced-motion:reduce){.du-in{animation:none}}
`; document.head.appendChild(el); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={phr:false,conf:null,busy:'',toast:'',tone:'ok',toastT:0,err:'',code:'',codeSt:'',boot:'',bootWhy:'',mailed:{},anim:true,top:true,sig:'',tk:0,cdK:'',pollT:0,md:'',readAt:-1};
function say(m,tone){ X.toast=String(m||''); X.tone=tone==='ok'?'ok':'bad'; X.toastT=Date.now(); redraw(); }

/* frases do parceiro já vistas: fica fora do save (por aparelho); só escreve ao abrir as frases */
const RKEY='eonbound.duo.read';
function readAt(){ if(X.readAt>=0) return X.readAt; let v=0; try{ v=num(parseInt(localStorage.getItem(RKEY),10)); }catch(e){ v=0; } X.readAt=Math.max(0,v); return X.readAt; }
function markRead(v){ let top=0; for(const m of (v&&v.chat)||[]) if(!m.me&&num(m.at)>top) top=num(m.at); if(top<=readAt()) return; X.readAt=top; try{ localStorage.setItem(RKEY,String(top)); }catch(e){} }
const unread=v=>{ const t=readAt(); let n=0; for(const m of (v&&v.chat)||[]) if(!m.me&&num(m.at)>t) n++; return n; };

/* ---------- rede: uma ação por vez; "Carregando…" enquanto a Promise não volta; a recusa vira texto ---------- */
function run(label,fn,o){ if(X.busy) return; o=o||{}; X.busy=label||'Carregando…'; X.conf=null; X.err=''; X.toast=''; redraw();
  const end=r=>{ X.busy='';
    if(r&&r.ok){ try{ if(o.after) o.after(r); }catch(e){} saved(); if(!o.quiet) sfx('claim'); X.toast=String(typeof o.ok==='function'?o.ok(r):(o.ok||'')); X.tone='ok'; }
    else { const m=whyR(r); if(o.err){ X.err=m; X.toast=''; } else { X.toast=m; X.tone='bad'; } }
    X.toastT=Date.now(); redraw(); };
  let pr=null; try{ pr=fn(); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* liga o online da Dupla se o jogo ainda não ligou (Sys.duoNet.start: GET /duo e troca o provider). Só com as duas chaves ligadas e o nível aberto */
function boot(){ const n=DN(), z=netSt(), D=DM(); if(!n||!z||!z.on||z.started||X.boot==='load'||!D||!duoOn()) return;
  let st=null; try{ st=D.status(sv(),host()); }catch(e){} if(!st||!st.open) return;
  X.boot='load'; X.bootWhy='';
  const end=r=>{ X.boot=r&&r.ok?'':'err'; X.bootWhy=r&&r.ok?'':whyR(r); X.pollT=Date.now(); redraw(); };
  let pr=null; try{ pr=n.start(sv(),host()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* o meu código de amigo: vem no GET /duo; se não veio, pede uma vez (GET /me/friend-code) */
function loadCode(){ const n=DN(); if(!n||!online()||X.codeSt==='load'||typeof n.friendCode!=='function') return; X.codeSt='load';
  const end=r=>{ X.codeSt=r&&r.ok&&r.code?'':'err'; redraw(); };
  let pr=null; try{ pr=n.friendCode(); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* leitura de tempos em tempos com a tela aberta (frases e progresso do parceiro chegam pelo GET /duo) */
function poll(force){ const n=DN(); if(!n||!online()||typeof n.refresh!=='function') return; const now=Date.now(); if(!force&&now-X.pollT<(X.phr?10000:30000)) return; X.pollT=now;
  const end=()=>{ if(!X.busy&&X.sig&&sig()!==X.sig) redraw(); };
  let pr=null; try{ pr=n.refresh(sv(),host()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>{}); }

/* ================= HTML ================= */
/* fundo: regra da casa (cenário da era atual pelo xEraBg), bem escurecido e com um véu azul-noite por cima, como no mock escuro */
const bgHtml=()=>'<div class="du-bg" style="background:'+(typeof xEraBg==='function'?'linear-gradient(180deg,rgba(18,20,48,.5),rgba(10,10,28,.62)),'+xEraBg(0.7,0.9):'#12142a')+'"></div>';
/* o MEU retrato: o herói do jogo (window.drawHeroFull: arma na mão), a pé. Sem o desenho do jogo, fica o boneco em SVG */
const heroOk=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
let hRaf=0, hT0=0;
function heroLoop(ts){ hRaf=0; const c=byId('du_hero'); if(!c||!isOn()||typeof c.getContext!=='function'){ hT0=0; return; }
  try{ if(!hT0) hT0=ts; const x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height); window.drawHeroFull(x,c.width*0.5,c.height*0.95,c.height*0.96/HS,{t:(ts-hT0)/1000,mount:false,pet:false}); }catch(e){}
  hRaf=requestAnimationFrame(heroLoop); }
function heroStart(){ try{ if(!hRaf&&heroOk()&&byId('du_hero')) hRaf=requestAnimationFrame(heroLoop); }catch(e){} }
/* em que estado a tela está: none (sem módulo) · off (chave desligada) · level · closed (sem online) · boot (conectando) · out · wait · duo · phr */
function mode(){ const D=DM(); if(!D) return {m:'none'}; if(!duoOn()) return {m:'off'};
  let st=null; try{ st=D.status(sv(),host()); }catch(e){ st=null; } if(!st||!st.on) return {m:'off'};
  if(!st.open) return st.reason==='level'?{m:'level',st:st}:{m:'off'};
  const z=netSt(); if(!z||!z.on) return {m:'closed',st:st}; if(!z.started) return {m:X.boot==='load'?'boot':'closed',st:st};
  const v=viewNow(); if(!v) return {m:'off'};
  return {m:v.partner?(X.phr?'phr':'duo'):(num(v.relinkLeft)>0?'wait':'out'),st:st,v:v}; }
const leftOf=(a,b)=>isN(b)?Math.min(num(a),b):num(a);

function stripInner(M){ const m=(M&&M.m)||X.md;
  if(X.busy) return '<span class="du-st busy" role="status">'+esc2(X.busy)+'</span>';
  if(X.toast&&Date.now()-X.toastT<TOAST_MS) return '<span class="du-st '+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc2(X.toast)+'</span>';
  if(m==='phr') return '<span class="du-st">'+SV(I_LOCK,18)+'<span>Só frases prontas, sem texto livre</span></span>';
  return '<span class="du-st">'+SV(I_SHIELD,22)+'<span>Dupla é só com quem tem o seu código. Sem busca de estranhos, sem texto livre, sem troca.</span></span>'; }
function setStrip(){ const el=byId('du_strip'); if(el) el.innerHTML=stripInner(null); }

function confHtml(){ const c=X.conf; if(!c) return ''; const nm=esc2(c.name||'esse jogador'), D=data(), rh=nT(Math.round(num(D.relinkMs)/3600000));
  if(c.k==='leave') return '<div class="du-conf" role="alertdialog" aria-label="Sair da dupla"><b class="lil">Sair da dupla com '+nm+'?</b><ul><li>A dupla acaba <em>para os dois</em>.</li><li><em>Quem sai espera '+rh+' h</em> para formar outra. '+nm+' não espera.</li><li>Missão já resgatada nesta semana não volta com parceiro novo.</li></ul><div class="du-row2"><button class="du-bt" data-x="no">Ficar</button><button class="du-bt r" data-x="yes">Sair</button></div></div>';
  return '<div class="du-conf" role="alertdialog" aria-label="Bloquear"><b class="lil">Bloquear '+nm+'?</b><ul>'+(c.k==='block'?'<li>A dupla acaba <em>para os dois</em>.</li>':'<li>O convite some.</li>')+'<li>'+nm+' <em>não pode mais te convidar</em>.</li><li>Ninguém é avisado de que foi bloqueado.</li></ul><div class="du-row2"><button class="du-bt" data-x="no">Cancelar</button><button class="du-bt r" data-x="yes">Bloquear</button></div></div>'; }

/* ----- regras reais do módulo (estado sem online) ----- */
function rulesHtml(){ const D=data(), I=D.invite||{}, M=D.msg||{}, G=D.daily||{}; let i=0;
  const row=(a,b)=>'<div class="du-rule'+(i++?'':' first')+'"><span>'+esc2(a)+'</span><span>'+esc2(b)+'</span></div>';
  return '<div class="du-card"><h4>Como a Dupla funciona<span>regras do jogo</span></h4>'
    +row('Quem','1 amigo de verdade, pelo código de amigo. Sem busca de estranhos')
    +row('Convite',nT(I.perDay)+' por dia. Vence em '+nT(Math.round(num(I.ttlMs)/3600000))+' h')
    +row('Conversa','Só '+nT((D.phrases||[]).length)+' frases prontas. '+nT(M.perDay)+' por dia')
    +row(String(G.name||'Meta do dia'),'Os dois entram no dia e somam '+nT(G.target)+' abates')
    +row('Semana',nT((D.weekly||[]).length)+' missões pela soma dos dois')
    +row('Prêmio','Igual para os dois. Cada um resgata o seu. Só ouro e pedras de forja')
    +row('Sair','Acaba para os dois. Quem sai espera '+nT(Math.round(num(D.relinkMs)/3600000))+' h')+'</div>'; }
function pClosed(M){ const z=netSt(); let t='', btn='';
  if(M.m==='boot') t='<span role="status">Carregando…</span>';
  else if(!z||!z.on) t='<span role="status">Em breve: abre com o online</span><span>A Dupla ainda não abriu. Volte mais tarde.</span>';
  else if(X.boot==='err'){ t='<span role="alert">'+esc2(X.bootWhy||why(''))+'</span><span>A Dupla abre com o online. Nada aparece aqui antes disso.</span>'; btn='<button class="du-bt y" data-x="retry" data-k="boot">Tentar de novo</button>'; }
  else { t='<span role="status">Em breve: abre com o online</span><span>A Dupla ainda não abriu. Volte mais tarde.</span>'; btn='<button class="du-bt y" data-x="retry" data-k="boot">Tentar de novo</button>'; }
  return '<div class="du-card hi du-wt"><b>Dupla das Eras</b>'+t.replace(/<span/g,'<small').replace(/<\/span>/g,'</small>')+(btn?'<div style="margin-top:8px">'+btn+'</div>':'')+'</div>'+rulesHtml(); }

/* ----- sem dupla: o meu código, convidar pelo código, convites recebidos ----- */
function myCodeCard(){ const z=netSt()||{}, c=typeof z.code==='string'&&z.code?z.code:'';
  let mid;
  if(c) mid='<span class="cd" aria-label="Seu código: '+esc2(c.split('').join(' '))+'">'+esc2(c)+'</span><button class="du-bt y" data-x="copy" aria-label="Copiar o seu código">Copiar</button>';
  else if(X.codeSt==='err') mid='<span class="cd sm" role="alert">Não foi possível ler o seu código</span><button class="du-bt y" data-x="retry" data-k="code">Tentar de novo</button>';
  else mid='<span class="cd sm" role="status">Carregando…</span>';
  return '<h4 class="pl">Seu código de amigo<span>mostre só a amigos de verdade</span></h4><div class="du-myc"'+artBg('placa')+'>'+mid+'</div>'; }
function sentList(){ try{ const D=DM(), o=D.ensure(sv()), t=gameNow(), ttl=num(D.DATA.invite.ttlMs); return o.inv.out.filter(x=>t-x.at<ttl).map(x=>({code:x.code,h:Math.max(1,Math.ceil((x.at+ttl-t)/3600000))})); }catch(e){ return []; } }
function codeCard(v,waiting){ const D=data(), I=D.invite||{}, z=netSt()||{}, left=leftOf(v.invitesLeft,z.invitesLeft), used=Math.max(0,num(I.perDay)-left), out=sentList();
  /* mock du_cv: UM cartão claro com a placa do código em cima e o campo do código do amigo embaixo */
  return '<div class="du-card lt">'+myCodeCard()+'<h4 class="s2">Convidar pelo código<span class="cnt">Convites hoje: '+nT(used)+'/'+nT(I.perDay)+'</span></h4>'
    +'<div class="du-cin"><input id="du_code" class="du-inp" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="10" placeholder="Código do amigo" aria-label="Código do amigo: só letras e números, 6 a 10" value="'+esc2(X.code)+'"'+(waiting?' disabled':'')+'>'
    +'<button class="du-bt y'+(waiting?' off':'')+'" data-x="invite">Convidar</button></div>'
    +(X.err?'<div class="du-hint err" role="alert">'+esc2(X.err)+'</div>':'<div class="du-hint">Só letras e números, de 6 a 10. Não é chat: nada que você digita aparece para ninguém.</div>')
    +(out.length?'<p class="du-note">Enviados: '+out.map(x=>'<b>'+esc2(x.code)+'</b> (vence em '+nT(x.h)+' h)').join(', ')+'</p>':'')+'</div>'; }
function invitesCard(v,waiting){ const L=v.invitesIn||[], ttlH=nT(Math.round(num((data().invite||{}).ttlMs)/3600000));
  return '<div class="du-card"><h4>Convites recebidos<span>'+nT(L.length)+'</span></h4>'+(L.length?L.map((x,i)=>{ const nm=esc2(x.name||'Amigo'), id=esc2(x.id);
      /* a hora do convite não aparece: o Sys.duo.receiveInvite regrava a hora a cada leitura do servidor, então "há X" e "vence em" sairiam errados */
      const sub=[x.lv?'Nv '+nT(x.lv):'',eraName(x.era)].filter(Boolean).join(' · ')||'Convite pelo seu código';
      return '<div class="du-inv'+(i?'':' first')+'"><div class="who"><span class="du-av">'+SV(I_ONE,30)+'</span><span class="tx"><b>'+nm+'</b><small>'+esc2(sub)+'</small></span></div>'
        +'<div class="acts"><button class="du-bt g'+(waiting?' off':'')+'" data-x="accept" data-id="'+id+'">Aceitar</button><button class="du-bt" data-x="decline" data-id="'+id+'">Recusar</button><button class="du-bt r" data-x="blockinv" data-id="'+id+'" aria-label="Bloquear '+nm+'">'+SV(I_BLOCK)+'</button></div></div>'; }).join('')
    :'<div class="du-empty">Nenhum convite agora.</div>')+(L.length?'<p class="du-note">Convite sem resposta vence em '+ttlH+' h.</p>':'')+(num(v.blocked)>0?'<p class="du-note">Bloqueados: <b>'+nT(v.blocked)+'</b> (não podem te convidar)</p>':'')+'</div>'; }
function pOut(v){ return '<div class="du-card hi"><h4>Jogue em dupla com um amigo<span>1 dupla por vez</span></h4><p class="du-note" style="margin:0;color:#f6ecdf">Juntos vocês fecham a meta do dia e as missões da semana. <b>Cada um ganha o seu prêmio.</b> Só ouro e pedras de forja.</p></div>'
  +codeCard(v,false)+invitesCard(v,false); }
function pWait(v){ const rh=nT(Math.round(num(data().relinkMs)/3600000));
  return '<div class="du-card hi du-wt" role="status"><b>Você saiu da dupla</b><span class="tm" id="du_wtm">'+hms(v.relinkLeft)+'</span><small>Pode formar outra dupla quando a contagem acabar.</small><small class="d">Só quem sai espera '+rh+' h. Quem ficou pode formar outra na hora. Missão já resgatada nesta semana não volta com parceiro novo.</small></div>'
    +codeCard(v,true)+invitesCard(v,true)+'<p class="du-note" style="margin:0">Aceitar e convidar voltam quando a contagem acabar. Recusar e bloquear funcionam agora.</p>'; }

/* ----- com dupla ----- */
const partnerOn=p=>num(p.last)>0&&gameNow()-p.last<5*60000;   /* contrato 16.1: "online" = visto há menos de 5 min */
function rwChips(rw){ rw=rw||{}; let gold=''; try{ const h=host(); if(h&&typeof h.goldUnit==='function') gold=kfT(Math.round(num(rw.goldK)*Math.max(1,num(h.goldUnit())))); }catch(e){ gold=''; }
  const st=num(rw.stones);
  return (num(rw.goldK)>0?'<span class="du-chip">'+coinImg+(gold?esc2(gold):'Ouro')+'</span>':'')+(st>0?'<span class="du-chip">'+SV(I_STONE)+'+'+nT(st)+' '+(st>1?'pedras':'pedra')+'</span>':''); }
function claimBtn(st){ if(st.claimed) return '<span class="du-got" role="status">'+SV(I_ENV)+(X.mailed[st.id]?'No correio':'Resgatado')+'</span>';
  return '<button class="du-bt y'+(st.done?'':' off')+'" data-x="claim" data-id="'+esc2(st.id)+'" aria-label="Resgatar '+esc2(st.name)+(st.done?'':', ainda não fechou')+'">Resgatar</button>'; }
function bar2(mine,partner,target){ const T=Math.max(1,num(target)), a=Math.min(1,num(mine)/T), b=Math.min(1-a,num(partner)/T), tot=Math.min(T,num(mine)+num(partner));
  return '<div class="du-bar" role="img" aria-label="'+nT(tot)+' de '+nT(T)+'"><i class="me" style="width:'+(a*100).toFixed(1)+'%"></i><i class="pa" style="width:'+(b*100).toFixed(1)+'%"></i></div>'; }
function pDuo(v){ const p=v.partner, nm=esc2(p.name||'Parceiro'), on=partnerOn(p), d=v.daily, W=v.weekly||[], M=data().msg||{}, z=netSt()||{}, last=v.chat&&v.chat[v.chat.length-1], un=unread(v);
  const days=num(p.since)>0?Math.max(1,Math.round((gameNow()-p.since)/86400000)):0, sent=Math.max(0,num(M.perDay)-leftOf(v.msgLeft,z.msgLeft));
  const sub=[p.lv?'Nv '+nT(p.lv):'',esc2(eraName(p.era)),num(p.last)>0?'<em class="'+(on?'':'off')+'">'+(on?'online':'visto '+esc2(ago(p.last)))+'</em>':''].filter(Boolean).join(' · ');
  const tot=Math.min(num(d.target),num(d.mine)+num(d.partner));
  /* ordem do mock du_a: os dois retratos com o elo e o "juntos hoje" no meio · painel das missões · balões de frase e o botão azul */
  return '<div class="du-card">'
    +'<div class="du-pair"><div class="du-pf me"><span class="fr"'+artBg('retratoEu')+'>'+(heroOk()?'<canvas id="du_hero" width="208" height="240" aria-hidden="true"></canvas>':'<span class="ph">'+SV(I_ONE,56)+'</span>')+'</span><small>Você</small></div>'
    +'<div class="du-lk">'+SV(I_CHAIN,34)+SV(I_HEART,30)+'<b>'+esc2(d.name)+'</b><em>'+nT(tot)+' / '+nT(d.target)+'</em></div>'
    +'<div class="du-pf pa"><span class="fr"'+artBg('retratoPar')+'><span class="ph">'+SV(I_ONE,56)+'</span>'+(num(p.last)>0?'<i class="dot'+(on?'':' off')+'"></i>':'')+'</span><small>Parceiro</small></div></div>'
    +'<div class="du-pt"><span class="tx"><small>SUA DUPLA'+(days?' · HÁ '+nT(days)+(days>1?' DIAS':' DIA'):'')+'</small><b>'+nm+'</b>'+(sub?'<i>'+sub+'</i>':'')+'</span></div>'
    +'<div class="du-day"><p class="du-note" style="margin:0 0 5px">Os dois entram e somam '+nT(d.target)+' abates.</p>'+bar2(d.mine,d.partner,d.target)
    +'<div class="du-leg"><span class="m">Você: '+nT(d.mine)+'</span><span class="p">'+nm+': '+nT(d.partner)+(d.both?' · entrou hoje':'')+'</span></div>'
    +(d.both?'':'<p class="du-miss">'+nm+' ainda não entrou hoje: a meta precisa dos dois.</p>')
    +'<div class="du-rw"><span class="chips">'+rwChips(d.reward)+'</span>'+claimBtn(d)+'</div></div>'
    +'<h4 class="ct">Missões da semana<span>soma dos dois · cada um resgata o seu</span></h4>'+W.map((m,i)=>'<div class="du-wm'+(i?'':' first')+'"><span class="wi">'+SV(W_IC[m.id]||I_DUO,36)+'</span><div class="wb"><div class="nm">'+esc2(m.name)+': <b>'+nT(m.value)+'/'+nT(m.target)+'</b></div>'
        +(m.mine==null?bar2(m.value,0,m.target)+'<div class="du-leg"><span>dias em que os dois entraram</span></div>':bar2(m.mine,m.partner,m.target)+'<div class="du-leg"><span class="m">Você: '+nT(m.mine)+'</span><span class="p">'+nm+': '+nT(m.partner)+'</span></div>')
        +'<div class="du-rw"><span class="chips">'+rwChips(m.reward)+'</span>'+claimBtn(m)+'</div></div></div>').join('')
    +'<p class="du-note">Só ouro e pedras de forja. Nada da Dupla se compra.</p></div>'
    +'<div class="du-card"><h4>Frases prontas<span>Frases hoje: '+nT(sent)+'/'+nT(M.perDay)+'</span></h4><div class="du-fpv">'+SV(I_BUB,30)+'<span class="q">'+(last?(last.me?'Você':'<b>'+nm+'</b>')+': '+esc2(last.txt):'Nenhuma frase ainda.')+'</span></div>'
    +'<div class="du-quick" role="group" aria-label="Frases prontas">'+(v.phrases||[]).slice(0,QUICK).map(f=>'<button class="du-qb" data-x="send" data-idx="'+nT(f.idx)+'" aria-label="Mandar: '+esc2(f.txt)+'">'+esc2(f.txt)+'</button>').join('')
    +'<button class="du-bt b" data-x="phr" aria-label="Abrir todas as frases'+(un?', '+nT(un)+' novas':'')+'">'+SV(I_SCROLL,24)+'<span class="tw">Abrir'+(un?' ('+nT(un)+')':'')+'<small>todas as frases</small></span></button></div></div>'
    +'<div class="du-row2" style="flex:none"><button class="du-bt" data-x="leave">'+SV(I_DOOR)+'Sair da dupla</button><button class="du-bt r" data-x="block">'+SV(I_BLOCK)+'Bloquear</button></div>'; }

/* ----- frases prontas ----- */
function cdState(v){ const D=DM(), P=(v&&v.phrases)||[], per=[]; let k='ok', ms=0;
  for(const f of P){ let c={ok:false,reason:'phrase'}; try{ c=D.canSend(sv(),host(),f.idx)||c; }catch(e){} per.push(c);
    if(!c.ok&&c.reason==='day') k='day'; else if(!c.ok&&c.reason==='wait'&&k!=='day'){ k='wait'; ms=Math.max(ms,num(c.ms)); } }
  return {k:k,ms:ms,per:per}; }
const cdTxt=c=>c.k==='day'?nT((data().msg||{}).perDay)+' por dia: acabou hoje':c.k==='wait'?'aguarde '+nT(Math.max(1,Math.ceil(c.ms/1000)))+' s':'pode mandar';
function pPhr(v){ const p=v.partner, nm=esc2(p.name||'Parceiro'), M=data().msg||{}, z=netSt()||{}, c=cdState(v), sent=Math.max(0,num(M.perDay)-leftOf(v.msgLeft,z.msgLeft)); X.cdK=c.k;
  return '<div class="du-ph"><button class="du-bt" data-x="tduo" aria-label="Voltar para a dupla">'+SV(I_BACK,16)+'Dupla</button><b class="lil">Frases · '+nm+'</b></div>'
    +'<div id="du_chat" class="du-chat x-scroll" aria-live="polite">'+(v.chat.length?v.chat.map(m=>'<div class="du-bub '+(m.me?'me':'pa')+'">'+esc2(m.txt)+'<small>'+(m.me?'você':nm)+(ago(m.at)?' · '+esc2(ago(m.at)):'')+'</small></div>').join(''):'<div class="du-empty">Toque numa frase para mandar.</div>')+'</div>'
    +'<div class="du-wood"'+artBg('madeira')+'><h3>Frases prontas</h3>'
    +'<div class="du-cbar"><span class="cd'+(c.k==='ok'?'':' w')+'" id="du_cd">'+esc2(cdTxt(c))+'</span><span>1 a cada '+nT(Math.round(num(M.cooldownMs)/1000))+' s · <b>'+nT(sent)+'/'+nT(M.perDay)+'</b> hoje</span></div>'
    +'<div class="du-pgrid x-scroll" role="group" aria-label="Frases prontas">'+v.phrases.map((f,i)=>{ const r=c.per[i]||{}, rp=!r.ok&&r.reason==='repeat';
      return '<button class="du-phb'+(rp?' rp':c.k!=='ok'?' cw':'')+'" data-x="send" data-idx="'+nT(f.idx)+'" aria-label="Mandar: '+esc2(f.txt)+(rp?' (já foi '+nT(M.repeatMax)+' vezes seguidas)':'')+'"><i>'+SV(I_BUB,26)+'</i><span>'+esc2(f.txt)+'</span></button>'; }).join('')+'</div></div>'; }

function grab(){ let foc=false; try{ const el=byId('du_code'); if(el&&typeof el.value==='string'){ X.code=sanitize(el.value); foc=document.activeElement===el; } }catch(e){} return foc; }
const gate=(d,txt,role)=>xWrap(d,'','<div class="du">'+bgHtml()+'<div class="du-gate"><b class="lil">Dupla das Eras</b><span role="'+(role||'alert')+'">'+esc2(txt)+'</span><button class="du-bt y" data-x="back">Voltar</button></div></div>');

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{}, M=mode(); X.md=M.m;
  if(M.m==='none'){ V.innerHTML=gate(d,'Dupla indisponível agora.'); X.sig='x'; return; }
  if(M.m==='off'){ V.innerHTML=gate(d,'Dupla das Eras: em breve.','status'); X.sig='x'; return; }
  if(M.m==='level'){ V.innerHTML=gate(d,'A Dupla abre no nível '+nT(M.st.needLevel)+'. Continue lutando para liberar.','status'); X.sig=sig(); return; }
  const foc=X.noGrab?false:grab(); X.noGrab=false; let y0=0; try{ const s0=X.top?null:byId('du_scroll'); y0=s0?(+s0.scrollTop||0):0; }catch(e){}
  let body='', phr=false;
  if(M.m==='closed'||M.m==='boot') body=pClosed(M);
  else { const z=netSt()||{}; if(!z.code&&X.codeSt===''&&(M.m==='out'||M.m==='wait')) loadCode();
    if(M.m==='out') body=pOut(M.v); else if(M.m==='wait') body=pWait(M.v); else if(M.m==='duo') body=pDuo(M.v); else { phr=true; markRead(M.v); body=pPhr(M.v); } }
  V.innerHTML=xWrap(d,'','<div class="du'+(X.anim?' du-in':'')+'">'+bgHtml()
    +'<div id="du_strip" class="du-strip">'+stripInner(M)+'</div>'+confHtml()
    +(phr?body:'<div id="du_scroll" class="du-scroll x-scroll">'+body+'</div>')+'</div>');
  try{ if(y0){ const sc=byId('du_scroll'); if(sc) sc.scrollTop=y0; } if(phr){ const ch=byId('du_chat'); if(ch) ch.scrollTop=1e6; }
    if(foc){ const el=byId('du_code'); if(el&&el.focus){ el.focus(); if(el.setSelectionRange) el.setSelectionRange(X.code.length,X.code.length); } } }catch(e){}
  X.anim=false; X.top=false; X.sig=sig(); heroStart();
}
/* o que muda por fora (resposta do servidor, relógio do parceiro, nível): o tick redesenha só quando muda */
function sig(){ try{ const M=mode(), z=netSt()||{}, v=M.v; if(!v) return [M.m,X.boot,z.on,z.started,M.st&&M.st.needLevel].join('|');
    const p=v.partner, c=v.chat||[];
    return [M.m,p&&p.id,p&&p.name,p&&p.lv,p&&p.era,p?partnerOn(p):'',v.daily.value,v.daily.mine,v.daily.partner,v.daily.both,v.daily.claimed,(v.weekly||[]).map(w=>w.value+':'+(w.claimed?1:0)).join(','),
      (v.invitesIn||[]).map(i=>i.id).join(','),v.invitesOut,v.invitesLeft,c.length,c.length?c[c.length-1].at:0,v.msgLeft,num(v.relinkLeft)>0,v.blocked,z.code,z.invitesLeft,z.msgLeft,X.codeSt].join('|'); }catch(e){ return ''; } }

/* ================= toques (cada data-x da tela tem uma entrada aqui) ================= */
const invName=id=>{ const v=viewNow(), x=v&&(v.invitesIn||[]).find(i=>String(i.id)===String(id)); return x?String(x.name||'Amigo'):''; };
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  retry(b){ const k=String(b.dataset.k||''); sfx('ui_tap'); if(k==='code'){ X.codeSt=''; loadCode(); } else { X.boot=''; boot(); } redraw(); },
  no(){ sfx('ui_tap'); X.conf=null; redraw(); },
  phr(){ if(!online()) return; sfx('ui_tap'); X.phr=true; X.conf=null; X.toast=''; X.anim=true; poll(true); redraw(); },
  tduo(){ sfx('ui_tap'); X.phr=false; X.conf=null; X.top=true; X.anim=true; redraw(); },
  copy(){ const z=netSt()||{}, c=typeof z.code==='string'?z.code:''; if(!c) return; sfx('ui_tap'); let ok=false;
    try{ if(typeof navigator!=='undefined'&&navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){ Promise.resolve(navigator.clipboard.writeText(c)).catch(()=>{}); ok=true; } }catch(e){ ok=false; }
    say(ok?'Código '+c+' copiado':'Anote o seu código: '+c,'ok'); },
  /* convidar: o código é conferido aqui (formato do módulo) antes de gastar rede; quem decide é o servidor */
  invite(){ grab(); sfx('ui_tap'); const v=viewNow(), n=DN(), z=netSt()||{}, c=X.code, ttl=nT(Math.round(num((data().invite||{}).ttlMs)/3600000)); X.toast='';
    if(v&&num(v.relinkLeft)>0){ X.err=whyR({reason:'relink',ms:v.relinkLeft}); return redraw(); }
    if(!codeOk(c)){ X.err='Código inválido: use de 6 a 10 letras ou números'; return redraw(); }
    if(z.code&&String(z.code).toUpperCase()===c){ X.err=why('self'); return redraw(); }
    run('Carregando…',()=>n.invite(sv(),host(),c),{err:true,ok:()=>'Convite enviado para '+c+'. Vence em '+ttl+' h',after:()=>{ X.code=''; X.noGrab=true; }}); },
  accept(b){ const id=String(b.dataset.id||''), v=viewNow(), n=DN(); if(!id||!invName(id)) return; sfx('ui_tap');
    if(v&&num(v.relinkLeft)>0) return say(whyR({reason:'relink',ms:v.relinkLeft}),'bad');
    run('Carregando…',()=>n.accept(sv(),host(),id),{ok:()=>{ const w=viewNow(); return w&&w.partner?'Dupla formada com '+w.partner.name:'Convite aceito'; },after:()=>{ X.top=true; X.phr=false; }}); },
  decline(b){ const id=String(b.dataset.id||''), n=DN(); if(!id||!invName(id)) return; sfx('ui_tap'); run('Carregando…',()=>n.decline(sv(),host(),id),{ok:'Convite recusado',quiet:true}); },
  /* sair e bloquear: o 1º toque só abre a confirmação */
  blockinv(b){ const id=String(b.dataset.id||''), nm=invName(id); if(!id||!nm) return; sfx('ui_tap'); X.toast=''; X.conf={k:'blockinv',id:id,name:nm}; redraw(); },
  leave(){ const v=viewNow(); if(!v||!v.partner) return; sfx('ui_tap'); X.toast=''; X.conf={k:'leave',id:String(v.partner.id),name:String(v.partner.name||'')}; redraw(); },
  block(){ const v=viewNow(); if(!v||!v.partner) return; sfx('ui_tap'); X.toast=''; X.conf={k:'block',id:String(v.partner.id),name:String(v.partner.name||'')}; redraw(); },
  /* 2º toque: só aqui a ação é enviada ao servidor */
  yes(){ const c=X.conf, n=DN(); if(!c||!n) return; sfx('ui_tap'); X.conf=null;
    if(c.k==='leave') return run('Saindo da dupla…',()=>n.leave(sv(),host()),{ok:'Você saiu da dupla',quiet:true,after:()=>{ X.phr=false; X.top=true; }});
    if(c.k==='block') return run('Bloqueando…',()=>n.block(sv(),host(),c.id),{ok:'Jogador bloqueado',quiet:true,after:()=>{ X.phr=false; X.top=true; }});
    if(c.k==='blockinv') return run('Bloqueando…',()=>n.block(sv(),host(),c.id),{ok:'Bloqueado: não pode mais te convidar',quiet:true});
    redraw(); },
  /* frase: viaja SÓ o índice (inteiro da lista do módulo); não existe texto do jogador */
  send(b){ const idx=parseInt(b.dataset.idx,10), v=viewNow(), n=DN(); if(!v||!v.partner||!Number.isInteger(idx)||!(v.phrases||[]).some(f=>f.idx===idx)) return; sfx('ui_tap');
    run('Carregando…',()=>n.send(sv(),host(),idx),{ok:'',quiet:true,after:()=>{ markRead(viewNow()); }}); },
  claim(b){ const id=String(b.dataset.id||''), v=viewNow(), n=DN(); if(!v||!v.partner) return; const st=id==='daily'?v.daily:(v.weekly||[]).find(m=>m.id===id); if(!st) return; sfx('ui_tap');
    if(st.claimed) return say(why('claimed'),'bad');
    if(!st.done) return say(id==='daily'&&!st.both?String(v.partner.name||'O parceiro')+' ainda não entrou hoje: a meta precisa dos dois':why('done'),'bad');
    run('Carregando…',()=>n.claim(sv(),host(),id),{after:r=>{ if(r.mailed===true) X.mailed[id]=1; },
      ok:r=>{ if(r.mailed===true) return 'Prêmio enviado: chega pelo correio'; const q=r.reward||{}, g=num(q.gold), s=num(q.stones), parts=[]; if(g>0) parts.push('+'+kfT(g)+' de ouro'); if(s>0) parts.push('+'+nT(s)+(s>1?' pedras de forja':' pedra de forja'));
        return parts.length?'Prêmio recebido: '+parts.join(' e '):'Prêmio resgatado'; }}); } };
const LOCAL={retry:1,no:1,tduo:1};
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!DM()||!duoOn()) return;                           /* módulo ausente ou desligado: só o Voltar funciona */
  if(X.busy) return;                                    /* uma ação por vez: o resto espera a resposta do servidor */
  if(!LOCAL[a]&&!online()) return say('Em breve: abre com o online','bad');
  return ACT[a](b); }
/* o campo do código só aceita A-Z e 0-9 (o que é digitado é limpo na hora; não é chat) */
try{ if(typeof document!=='undefined'&&typeof document.addEventListener==='function') document.addEventListener('input',ev=>{ const t=ev&&ev.target; if(!t||t.id!=='du_code'||typeof t.value!=='string') return;
  const c=sanitize(t.value); if(t.value!==c) t.value=c; X.code=c; if(X.err){ X.err=''; redraw(); } }); }catch(e){}

/* imagens que a tela mostra (para a espera de carga do jogo) */
function urls(){ const u=[IC.coin]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){} return u; }
/* número do selo no Menu: sem dupla = convites recebidos; com dupla = frases novas do parceiro. Chave ou módulo desligado = 0 (e nada é lido do save) */
function alerts(){ try{ if(!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N))||!online()) return 0; const v=viewNow(); if(!v||!v.open) return 0; return v.partner?unread(v):(v.invitesIn||[]).length; }catch(e){ return 0; } }

if(!('duo' in PANEL_ON)) PANEL_ON.duo=false;
const def=Panels.add(N,{title:'Dupla das Eras',actions:Object.keys(ACT),urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()) return;
    if(X.toast&&Date.now()-X.toastT>=TOAST_MS){ X.toast=''; setStrip(); }
    if(X.busy||X.sig==='x') return;
    { const el=byId('du_wtm'); if(el){ const v=viewNow(), l=v?num(v.relinkLeft):0; if(l>0) el.textContent=hms(l); else return redraw(); } }
    { const el=byId('du_cd'); if(el){ const c=cdState(viewNow()); if(c.k!==X.cdK) return redraw(); el.textContent=cdTxt(c); } }
    X.tk=(X.tk+1)%4; if(X.tk===0){ if(X.sig&&sig()!==X.sig) return redraw(); poll(false); } },
  busy(){ return !!X.busy; },
  onOpen(){ X.phr=false; X.conf=null; X.busy=''; X.toast=''; X.err=''; X.code=''; X.codeSt=''; X.boot=''; X.bootWhy=''; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.pollT=0;
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){}   /* pede a carga das imagens já na abertura */
    if(!DM()||!duoOn()) return;                                       /* desligada: nenhuma leitura, nenhuma rede */
    if(online()) poll(true); else boot(); },
  onClose(){ X.conf=null; X.toast=''; X.busy=''; X.phr=false; } });
/* para o Menu (selo), o teste de fumaça e o console (somente leitura por convenção) */
window.PDuo={X:X,def:def,urls:urls,why:why,whyR:whyR,alerts:alerts,sanitize:sanitize};
})();
