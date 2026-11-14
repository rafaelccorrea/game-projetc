/* Eonbound — FOGUEIRA DAS ERAS V5 na tela de batalha (protótipo aprovado pelo dono: docs/proto/v2/FogueiraV5.html).
   ATRÁS DE CHAVE: só monta quando fogOn() (js/farm.js) for verdadeiro E o módulo de regras estiver ligado (Sys.bonfire.DATA.on === true).
   Este arquivo NÃO liga chave nenhuma e, desligado, não cria elemento, estilo nem ouvinte.
   Regras: TODAS do Sys.bonfire (js/sys/bonfire.js, da Sistemas). Aqui só há interface: botão redondo no meio de baixo (estágio, selo de Brasas, arco do pote,
   "Fogueira N", selo AUTO/PAUSA), engrenagem, cartão pequeno "nova x a sua" (Equipar / Guardar / Desmontar) por cima da luta sem pausar, painel por cima
   (nível, Subir, 9 estágios, automático, chances, mochila, desmontar rápido, recuperar), faíscas do inimigo até a Fogueira (B2 do docs/LOM_VS_EONBOUND.md)
   e o resumo do tempo fora. Brasas NUNCA são vendidas: nenhum texto de preço, de compra ou de pressa.
   Quem liga (js/battle.js, js/farm.js, js/meta.js, index.html) chama window.Fogueira: tick(dt), draw(ctx), onKill(x,y), onBrasa(x,y,n), offline(seg).
   Custo por quadro: tick = uma soma (a parte lenta roda 5 vezes por segundo); draw = só as faíscas vivas (teto MAX_FLY); nenhum elemento criado por quadro,
   nenhuma leitura de layout no laço (medidas só ao montar e ao redimensionar). Teste: node test/paineis/fogueira.smoke.js */
(function(){
'use strict';
/* ---------- ARTE: ponto único. Estágios 1 a 9 (256x256, fundo transparente, base em y=250). Sem o arquivo, entra a fogueira desenhada em CSS (.fgx-fb). ---------- */
const FOG_ART = n => 'assets/ui/fogueira/fg_s' + n + '.png';
/* chama animada: folha em GRADE com o mesmo enquadramento da parada + .json {frames, fps, w, h, cols}. Se o .json e a folha carregarem, a parada é trocada
   pela animada por CSS (sem custo por quadro em JS e sem mexer no layout); se faltar qualquer um dos dois, fica a parada. Só a do estágio atual é carregada. */
const FOG_LOOP = n => 'assets/ui/fogueira/fg_s' + n + '_loop.png';
const FOG_LOOP_JSON = n => 'assets/ui/fogueira/fg_s' + n + '_loop.json';
const FOG_LOOP_ON = true;
/* x1/x2/x4: os botões e a regra são do js/fullbattle.js (#fb_spd). Com a Fogueira montada o grupo só MUDA DE LUGAR (coluna à direita, abaixo do Baú),
   porque a fila de baixo é onde a Fogueira fica; ao desmontar, o estilo original volta. false = não toca no grupo (quando o fullbattle já o posicionar). */
const MOVE_SPEED = true;
const AUTO_S = 1.5, AUTO_GAP = 0.35, HOLD_MS = 500, MAX_FLY = 24, SYNC_S = 0.2, STATUS_S = 1.3, BAG_SHOW = 30;
const ACTIONS = ['forge', 'sheet', 'equip', 'keep', 'sell', 'lock', 'cclose', 'close', 'up', 'on', 'off', 'sellb', 'eq', 'batch', 'open', 'worse', 'below', 'rec', 'offok'];
const RN_DEF = ['Básico', 'Raro', 'Épico', 'Mítico', 'Lendário'], RC_DEF = ['#a9b3c9', '#4fa3ff', '#b46bff', '#ff4f6d', '#ffa434'];

/* ---------- acesso ao jogo (tudo com reserva: o arquivo carrega sozinho no teste) ---------- */
const BF = () => (typeof Sys !== 'undefined' && Sys && Sys.bonfire) || null;
const isOn = () => { try { const b = BF(); return !!(b && b.DATA && b.DATA.on === true && typeof fogOn === 'function' && fogOn()); } catch (e) { return false; } };
const host = () => { try { if (typeof fogHost === 'function') return fogHost(); } catch (e) {} return (typeof Sys !== 'undefined' && Sys.host) || {}; };
const inBattle = () => typeof view === 'undefined' || view === 'battle';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nf = v => { v = Math.max(0, Math.round(+v || 0)); try { if (typeof kf === 'function') return String(kf(v)); if (typeof fmt === 'function') return String(fmt(v)); } catch (e) {} return v.toLocaleString('pt-BR'); };
const fcTxt = v => { v = Math.max(0, Math.round(+v || 0)); try { if (typeof fcShow === 'function') return String(fcShow(v)); } catch (e) {} return nf(v); };
const say = m => { ST.said = m; try { if (typeof toast === 'function') toast(m); } catch (e) {} };
const sfx = n => { try { if (typeof snd === 'function') snd(n); } catch (e) {} };
const pl = (n, one, many) => n + ' ' + (n === 1 ? one : many);
const nameOf = (h, it) => { try { if (h.itemName) return String(h.itemName(it)); } catch (e) {} return String((it && it.name) || 'Peça'); };
const thumbOf = (h, it) => { try { if (h.thumb) return String(h.thumb(it)); } catch (e) {} return FOG_ART(1); };
const rarN = (h, r) => { let s = ''; try { s = h.rarName ? h.rarName(r) : ''; } catch (e) {} return s || RN_DEF[r] || ''; };
const rarC = (h, r) => { let c = ''; try { c = h.rarColor ? h.rarColor(r) : ''; } catch (e) {} return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : (RC_DEF[r] || '#c9b8a2'); };
const starsOf = it => Math.max(1, Math.min(5, Math.floor((+(it && it.qp) || 0) / 2000) + 1));
const fcOf = (h, it) => { try { return +h.fcOf(it) || 0; } catch (e) { return 0; } };
const deltaOf = (h, it) => { try { return +h.delta(it) || 0; } catch (e) { return 0; } };
const bagOf = h => { try { const b = typeof h.items === 'function' ? h.items() : h.items; return Array.isArray(b) ? b : []; } catch (e) { return []; } };
const bagMaxOf = h => { try { return +h.bagMax() || 30; } catch (e) { return 30; } };
const eqOf = h => { try { return h.equipped() || {}; } catch (e) { return {}; } };
const eqIds = h => new Set(Object.values(eqOf(h)).filter(Boolean).map(x => String(typeof x === 'object' ? x.id : x)));
const nowOf = h => { try { return +h.now() || Date.now(); } catch (e) { return Date.now(); } };
const instant = () => { try { const c = Sys.vip && Sys.vip.conv && Sys.vip.conv(S, 'bonfireInstant'); return !!(c && c.on); } catch (e) { return false; } };   /* VIP 4: só o efeito, sem texto de venda */

/* ---------- estado da interface (nada disto vai para o save) ---------- */
let M = null;                                   // montada: {root, btn, card, sheet, off, css, host}
const ST = { said: '', acc: 0, key: {}, stage: 0, loopTok: 0, bumpT: 0, bumpK: 0, clock: 0, lay: true, layKey: '', spdMode: '', held: false, holdT: null };
let Q = [], CARD = null, STATUS = null, SHEET = false, OFF = null, QK = null, SHKEY = '';
const A = { t: AUTO_S, left: 0, paused: false };
const FLY = []; let TGT = null, SPD_ORIG = null, OFF_DONE = false;

const CSS = `
#fbhud #fgx{position:absolute;inset:0;pointer-events:none;z-index:7;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf}
#fbhud #fgx>div{pointer-events:none}#fbhud #fgx button,#fbhud #fgx .fgx-c,#fbhud #fgx .fgx-sh{pointer-events:auto}
#fgx *{box-sizing:border-box}#fgx button{font-family:inherit;cursor:pointer;color:inherit}
.fgx-b{position:absolute;left:118px;top:calc(100% - 100px);width:84px;height:94px;padding:0;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:1px}
.fgx-w{position:relative;width:80px;height:80px;display:grid;place-items:center}
.fgx-i{position:relative;width:70px;height:70px;border-radius:50%;overflow:hidden;border:3px solid #c8642a;background:radial-gradient(circle at 50% 72%,#6a2a10,#1d1611 70%);box-shadow:0 6px 16px rgba(0,0,0,.5);display:block}
.fgx-i::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle at 50% 62%,rgba(255,150,60,.42),rgba(255,120,30,0) 62%);animation:fgxfl 1.7s ease-in-out infinite;pointer-events:none}
.fgx-art{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;display:block}
.fgx-lp{position:absolute;inset:0;display:none;background-repeat:no-repeat}
.loop>.fgx-lp{display:block}.loop>.fgx-art{visibility:hidden}
.fgx-fb{display:none;position:absolute;left:24%;right:24%;bottom:20%;height:54%;border-radius:50% 50% 46% 46%/66% 66% 34% 34%;background:radial-gradient(circle at 50% 80%,#fff3b0 0,#fff3b0 16%,#ffb03a 40%,#e2521a 70%,rgba(226,82,26,0) 73%)}
.fgx-fb::after{content:"";position:absolute;left:-28%;right:-28%;bottom:-16%;height:16%;border-radius:6px;background:linear-gradient(180deg,#8a5a34,#4a2e18)}
.noart>.fgx-fb{display:block}.noart>.fgx-art{display:none}
.fgx-pot{position:absolute;inset:0;width:80px;height:80px;transform:rotate(-90deg);pointer-events:none}
.fgx-pot circle{fill:none;stroke-width:4}.fgx-pot .p0{stroke:rgba(0,0,0,.45)}.fgx-pot .p1{stroke:#ffb15a;stroke-linecap:round;stroke-dasharray:0 100;transition:stroke-dasharray .25s}
.fgx-bd{position:absolute;right:-4px;top:-2px;min-width:26px;height:22px;padding:0 6px;border-radius:11px;background:linear-gradient(180deg,#ff9a4a,#d8461a);border:2px solid #1a110b;display:grid;place-items:center}
.fgx-bd b{font-size:12px;font-weight:900;color:#fff;font-variant-numeric:tabular-nums}
.fgx-bd.k1{animation:fgxk1 .35s ease-out}.fgx-bd.k2{animation:fgxk2 .35s ease-out}
.fgx-au{position:absolute;left:50%;bottom:-3px;transform:translateX(-50%);padding:0 5px;border-radius:6px;background:#5ef0a0;color:#03210f;font-size:8.5px;font-weight:900;line-height:13px}
.fgx-au.pz{background:#ffd25e;color:#2a1403}.fgx-au[hidden]{display:none}
.fgx-lb{font-size:10.5px;line-height:12px;font-weight:900;color:#ffd3a6;text-shadow:0 1px 2px #000,0 0 5px #000;white-space:nowrap}
.fgx-b.pulse .fgx-i{animation:fgxp 1.1s ease-in-out infinite}
.fgx-b:active .fgx-i{transform:scale(.93)}
.fgx-g{position:absolute;left:112px;top:calc(100% - 98px);width:26px;height:26px;border-radius:50%;border:2px solid #1a110b;background:#6a5a48;padding:0;display:grid;place-items:center;z-index:1}
.fgx-g::after{content:"";position:absolute;inset:-8px}.fgx-g svg{width:15px;height:15px}
@keyframes fgxfl{0%,100%{opacity:.55}50%{opacity:1}}
@keyframes fgxp{50%{box-shadow:0 0 0 3px #ffd25e,0 0 22px rgba(255,190,80,.95)}}
@keyframes fgxk1{40%{transform:scale(1.16)}}@keyframes fgxk2{40%{transform:scale(1.16)}}
@keyframes fgxin{from{opacity:0}}
@keyframes fgxup{from{transform:translateY(30px);opacity:.3}}
.fgx-c{position:absolute;left:42px;top:var(--fgct,236px);width:280px;border-radius:16px;background:rgba(29,22,17,.95);border:1.5px solid var(--rc,#6a5a48);padding:8px 9px 9px;box-shadow:0 10px 26px rgba(0,0,0,.5);animation:fgxin .2s ease-out}
.fgx-c.st{padding:8px 10px;text-align:center;font-size:12px;font-weight:900;line-height:1.3;color:#f6ecdf}
.fgx-r{display:flex;align-items:center;gap:8px;min-width:0}
.fgx-ic{flex:none;width:46px;height:46px;border-radius:12px;border:2px solid var(--rc,#6a5a48);background:rgba(0,0,0,.45);display:grid;place-items:center}
.fgx-ic img{width:38px;height:38px;object-fit:contain}
.fgx-tx{flex:1;min-width:0}
.fgx-tx b{display:block;font-size:13px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.fgx-tx small{display:block;font-size:10.5px;font-weight:900;color:var(--rc,#c9b8a2);overflow-wrap:anywhere}
.fgx-tx span{display:block;font-size:10px;font-weight:800;color:#c9b8a2;overflow-wrap:anywhere}
.fgx-dl{flex:none;font-family:'Lilita One',Nunito,sans-serif;font-size:17px;text-align:right;line-height:1}
.fgx-dl small{display:block;font-family:Nunito,system-ui,sans-serif;font-size:9px;font-weight:900;color:#c9b8a2}
.fgx-dl.up{color:#7fe07a}.fgx-dl.dn{color:#ff9f9f}
.fgx-n{margin-top:5px;font-size:11px;font-weight:900;text-align:center;line-height:1.3;color:#ffd25e}
.fgx-q{margin-top:5px;font-size:10px;font-weight:900;color:#c9b8a2;text-align:right}
.fgx-bt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin-top:7px}
.fgx-bt.two{grid-template-columns:repeat(2,minmax(0,1fr))}
.fgx-bt button{min-width:0;min-height:44px;border-radius:12px;font-weight:900;font-size:12.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;padding:3px;overflow-wrap:anywhere;text-align:center}
.fgx-bt button small{font-size:8.5px;font-weight:900;line-height:1.15}
.fgx-gd{border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 3px 0 #9a5a10}
.fgx-ol{background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:#f6ecdf}
.fgx-rd{border:0;background:linear-gradient(180deg,#ff8a6a,#c0301f);color:#fff!important;box-shadow:0 3px 0 #6a1408}
.fgx-sh{position:absolute;left:0;right:0;bottom:0;max-height:min(600px,calc(100% - 64px));overflow-y:auto;overflow-x:hidden;background:#1d1611;border-radius:20px 20px 0 0;border-top:2px solid #4a3a2b;padding:10px 12px 14px;animation:fgxup .22s ease-out;scrollbar-width:none;box-shadow:0 -10px 30px rgba(0,0,0,.55);z-index:3}
.fgx-sh h3{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 6px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:19px;line-height:1.15}
.fgx-sh h3 span{min-width:0;overflow-wrap:anywhere}
.fgx-x{flex:none;width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,236,200,.25);background:rgba(255,236,200,.06);font-size:20px;font-weight:900;padding:0}
.fgx-xp{position:relative;height:24px;border-radius:12px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.16);overflow:hidden}
.fgx-xp i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#ff8a3c,#ffd25e)}
.fgx-xp b{position:absolute;inset:0;display:grid;place-items:center;font-size:11px;font-weight:900;text-shadow:0 1px 2px #000}
.fgx-up{width:100%;min-height:44px;margin-top:6px;border:0;border-radius:13px;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410!important;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px}
.fgx-up[aria-disabled="true"]{background:rgba(255,255,255,.07);color:#c9b8a2!important}
.fgx-se{display:flex;justify-content:space-between;gap:6px;margin:12px 0 5px;font-size:10px;font-weight:900;letter-spacing:1px;color:#c9b8a2;text-transform:uppercase}
.fgx-se span:last-child{text-transform:none;letter-spacing:0;text-align:right}
.fgx-ga{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.fgx-ga>div{border-radius:11px;background:rgba(0,0,0,.3);border:1.5px solid rgba(255,236,200,.16);padding:4px 3px;text-align:center;min-width:0}
.fgx-ga>div.cur{border-color:#ffc94a;box-shadow:0 0 10px rgba(255,201,74,.4)}.fgx-ga>div.lk{opacity:.5}
.fgx-gi{position:relative;display:block;width:100%;aspect-ratio:1/1;border-radius:8px;overflow:hidden;background:radial-gradient(circle at 50% 72%,#3a1a10,#1d1611 70%)}
.fgx-ga b{display:block;font-size:10.5px;line-height:1.15;margin-top:3px;min-height:24px;overflow-wrap:anywhere}
.fgx-ga small{display:block;font-size:9.5px;color:#c9b8a2;font-weight:800}
.fgx-sg{display:flex;gap:5px;flex-wrap:wrap}
.fgx-sg button{flex:1 1 60px;min-width:0;min-height:40px;border-radius:11px;border:1px solid rgba(255,236,200,.25);background:rgba(0,0,0,.3);font-weight:900;font-size:12px;line-height:1.15;padding:3px 4px;overflow-wrap:anywhere}
.fgx-sg button[aria-pressed="true"]{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;border-color:#ffc94a}
.fgx-tb{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.fgx-tb div{border-radius:10px;background:rgba(0,0,0,.3);border:1.5px solid var(--rc,#6a5a48);padding:4px 2px;text-align:center;min-width:0}
.fgx-tb b{display:block;font-size:13px;font-weight:900}.fgx-tb small{display:block;font-size:8.5px;font-weight:900;color:var(--rc,#c9b8a2);overflow-wrap:anywhere}.fgx-tb .z{opacity:.4}
.fgx-nt{margin:6px 0 0;font-size:10.5px;font-weight:800;color:#c9b8a2;line-height:1.4}
.fgx-bg{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
.fgx-bi{position:relative;min-width:0;min-height:48px;border-radius:11px;background:rgba(0,0,0,.35);border:2px solid var(--rc,#6a5a48);padding:3px 1px 2px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}
.fgx-bi img{width:30px;height:30px;object-fit:contain;display:block}
.fgx-bi small{display:block;font-size:8.5px;font-weight:900;line-height:1.1}
.fgx-bi .du{color:#7fe07a}.fgx-bi .dd{color:#ff9f9f}
.fgx-bi.locked{box-shadow:0 0 0 2px #ffc94a inset}
.fgx-bi .lk{position:absolute;right:1px;top:1px;width:12px;height:12px}
.fgx-qd{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}
.fgx-qd button{flex:1 1 90px;min-width:0;min-height:40px;border-radius:11px;border:1px solid rgba(255,236,200,.25);background:rgba(255,236,200,.06);font-weight:900;font-size:11px;line-height:1.15;padding:3px 4px;overflow-wrap:anywhere}
.fgx-qd button.arm{background:linear-gradient(180deg,#ff8a6a,#c0301f);border-color:#ff8a6a;color:#fff!important}
`;
const GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"></circle><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"></path></svg>';
const LOCK = '<svg class="lk" viewBox="0 0 24 24" fill="none" stroke="#ffd25e" stroke-width="3" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
const artHtml = (n, cls) => `<span class="${cls}"><span class="fgx-fb" aria-hidden="true"></span><img class="fgx-art" src="${FOG_ART(n)}" alt=""><span class="fgx-lp" aria-hidden="true"></span></span>`;

/* ---------- montar / desmontar ---------- */
const mk = (id, html) => { const e = document.createElement('div'); e.id = id; if (html != null) e.innerHTML = html; return e; };
const gid = id => { try { return document.getElementById(id); } catch (e) { return null; } };
function btnHtml(){ return `<button class="fgx-b" data-fg="forge" id="fgx_b" aria-label="Fogueira das Eras: toque para forjar, segure para abrir o painel"><span class="fgx-w">${artHtml(1, 'fgx-i" id="fgx_i')}<svg class="fgx-pot" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="37" class="p0"></circle><circle cx="40" cy="40" r="37" class="p1" id="fgx_pot" pathLength="100"></circle></svg><span class="fgx-bd" id="fgx_bdw"><b id="fgx_bra">0</b></span><span class="fgx-au" id="fgx_au" hidden>AUTO</span></span><span class="fgx-lb" id="fgx_lb">Fogueira</span></button><button class="fgx-g" data-fg="sheet" aria-label="Painel da Fogueira: nível, estágios, automático e mochila">${GEAR}</button>`; }
function mount(){ if (M) return true; if (!isOn() || typeof document === 'undefined') return false; const hostEl = gid('fb_w'); if (!hostEl) return false;
  const css = document.createElement('style'); css.id = 'fgx_css'; css.textContent = CSS; document.head.appendChild(css);
  const root = mk('fgx'), btn = mk('fgx_btn', btnHtml()), card = mk('fgx_card', ''), sheet = mk('fgx_sheet', ''), off = mk('fgx_off', '');
  root.appendChild(btn); root.appendChild(card); root.appendChild(off); root.appendChild(sheet); hostEl.appendChild(root);
  M = { root, btn, card, sheet, off, css, host: hostEl, loopCss: null };
  if (root.addEventListener){ root.addEventListener('click', onClick); root.addEventListener('pointerdown', onDown); for (const t of ['pointerup', 'pointerleave', 'pointercancel']) root.addEventListener(t, onUp); root.addEventListener('error', onImgErr, true); }
  try { if (typeof addEventListener === 'function') addEventListener('resize', onResize); } catch (e) {}
  try { if (document.body && document.body.classList) document.body.classList.add('fogv5'); } catch (e) {}
  ST.key = {}; ST.stage = 0; ST.lay = true; ST.layKey = ''; ST.spdMode = ''; TGT = null; A.t = AUTO_S; A.left = 0; A.paused = false; SHKEY = '';
  sync(); layout(); renderCard(); renderSheet(); renderOff(); return true; }
function unmount(){ if (!M) return; clearTimeout(ST.holdT); speedRestore();
  try { if (typeof removeEventListener === 'function') removeEventListener('resize', onResize); } catch (e) {}
  try { if (document.body && document.body.classList) document.body.classList.remove('fogv5'); } catch (e) {}
  for (const e of [M.root, M.css, M.loopCss]){ try { if (e && e.remove) e.remove(); else if (e && e.parentNode) e.parentNode.removeChild(e); } catch (er) {} }
  M = null; FLY.length = 0; TGT = null; SHEET = false; STATUS = null; QK = null; OFF = null;
  /* peça já forjada que esperava a decisão (a Brasa já foi gasta): vai para a mochila, nunca se perde */
  { const h = host(); for (const c of (CARD && CARD.why !== 'bag' ? [CARD] : []).concat(Q)){ try { const b = BF(); if (b) b.makeRoom(S, h); if (h.addItem) h.addItem(c.it); } catch (e) {} } }
  Q = []; CARD = null; A.paused = false; }
const onResize = () => { ST.lay = true; TGT = null; };
function onImgErr(ev){ const t = ev && ev.target; if (!t || !t.classList || !t.classList.contains('fgx-art')) return; const p = t.parentNode; if (p && p.classList) p.classList.add('noart'); }

/* ---------- botão: estágio, Brasas, pote, nível, AUTO/PAUSA (5 vezes por segundo, só o que mudou) ---------- */
function setH(id, prop, v){ const k = id + '|' + prop; if (ST.key[k] === v) return false; ST.key[k] = v; const e = gid(id); if (!e) return true;
  if (prop === 'text') e.textContent = v; else if (prop === 'class') e.className = v; else if (prop === 'hidden') e.hidden = v; else if (prop === 'dash') e.style.strokeDasharray = v; else e.setAttribute(prop, v); return true; }
function sync(){ const b = BF(); if (!b || !M) return; const o = b.ensure(S), D = b.DATA, n = b.stageOf(o.lv) + 1, autoOk = o.auto.on && o.lv >= D.auto.level, full = o.lv < D.maxLevel && o.xp >= b.xpNeed(o.lv), per = b.perTap(o.lv);
  ST.hud = { lv: o.lv, bra: o.bra, pot: o.pot, stage: n, auto: autoOk ? (A.paused ? 'PAUSA' : 'AUTO') : '', pulse: full };
  setH('fgx_bra', 'text', String(o.bra)); setH('fgx_pot', 'dash', (o.pot / D.brasas.potKills * 100).toFixed(1) + ' 100'); setH('fgx_lb', 'text', 'Fogueira ' + o.lv);
  setH('fgx_au', 'hidden', !autoOk); setH('fgx_au', 'class', 'fgx-au' + (A.paused ? ' pz' : '')); setH('fgx_au', 'text', A.paused ? 'PAUSA' : 'AUTO');
  setH('fgx_b', 'class', 'fgx-b' + (full ? ' pulse' : ''));
  setH('fgx_b', 'aria-label', 'Fogueira nível ' + o.lv + ', ' + pl(o.bra, 'Brasa', 'Brasas') + ', pote ' + o.pot + ' de ' + D.brasas.potKills + '. Toque para forjar ' + pl(per, 'peça', 'peças') + '. Segure para abrir o painel');
  if (ST.stage !== n){ ST.stage = n; setArt(n); } }
function setArt(n){ const box = gid('fgx_i'); ST.loopTok++; if (!box || !box.querySelector) return; const im = box.querySelector('.fgx-art'); box.classList.remove('noart', 'loop'); if (im) im.src = FOG_ART(n); tryLoop(n, box, ST.loopTok); }
/* chama animada: só entra se a folha carregar; qualquer falha deixa a imagem parada como está */
/* geometria e animação da folha: a MESMA regra do jogo (xSheetNorm/xSheetCss do js/screens.js: grade = uma animação com keyframes quadro a quadro, em %,
   step-end; a célula vazia nunca aparece). Sem o ajudante (teste), a conta igual feita aqui. Quadros, colunas e fps vêm SEMPRE do .json. */
function sheetNorm(j){ try { if (typeof xSheetNorm === 'function') return xSheetNorm(j); } catch (e) {} const f = Math.max(1, j.frames | 0), c = j.cols > 0 ? Math.min(j.cols | 0, f) : f; return { frames: f, cols: c, rows: Math.ceil(f / c), fps: j.fps > 0 ? +j.fps : 12 }; }
function sheetCss(m){ try { if (typeof xSheetCss === 'function') return xSheetCss(m, {}); } catch (e) {} const f = m.frames, c = m.cols, r = m.rows; if (f <= 1) return { size: '100% 100%', anim: 'none' };
  const nm = 'fgxl' + c + '_' + f, pos = i => (c > 1 ? (i % c / (c - 1) * 100).toFixed(3) : '0') + '% ' + (r > 1 ? (Math.floor(i / c) / (r - 1) * 100).toFixed(3) : '0') + '%';
  if (!M.loopCss){ M.loopCss = document.createElement('style'); M.loopCss.textContent = ''; document.head.appendChild(M.loopCss); }
  if (M.loopCss.textContent.indexOf('@keyframes ' + nm + '{') < 0){ let k = '@keyframes ' + nm + '{'; for (let i = 0; i < f; i++) k += (i / f * 100).toFixed(4) + '%{background-position:' + pos(i) + '}'; M.loopCss.textContent += k + '100%{background-position:' + pos(f - 1) + '}}\n'; }
  return { size: (c * 100) + '% ' + (r * 100) + '%', anim: nm + ' ' + (+(f / m.fps).toFixed(4)) + 's step-end infinite' }; }
function loopApply(n, box, tok, j){ if (!M || tok !== ST.loopTok || !j || !(j.frames > 1) || !box.querySelector) return false; const lp = box.querySelector('.fgx-lp'); if (!lp) return false;
  const k = sheetCss(sheetNorm(j)); lp.style.backgroundImage = 'url(' + FOG_LOOP(n) + ')'; lp.style.backgroundSize = k.size; lp.style.animation = k.anim; box.classList.add('loop'); return true; }
/* primeiro o .json (sem ele não há como saber a grade: fica a parada); depois a folha; só então troca */
function tryLoop(n, box, tok){ if (!FOG_LOOP_ON || typeof fetch !== 'function') return;
  const got = j => { if (!M || tok !== ST.loopTok || !j || !(j.frames > 1)) return; let probe = null; try { probe = document.createElement('img'); } catch (e) { return; } if (!probe) return;
    probe.onerror = () => {}; probe.onload = () => { try { loopApply(n, box, tok, j); } catch (e) {} }; probe.src = FOG_LOOP(n); };
  try { Promise.resolve(fetch(FOG_LOOP_JSON(n))).then(r => r && r.ok ? r.json() : null).then(got, () => {}); } catch (e) {} }
function bump(){ if (ST.clock - ST.bumpT < 0.3) return; ST.bumpT = ST.clock; ST.bumpK ^= 1; setH('fgx_bdw', 'class', 'fgx-bd ' + (ST.bumpK ? 'k1' : 'k2')); }

/* ---------- lugar das coisas (só ao montar, ao redimensionar e quando a coluna direita de ícones muda): cartão acima do herói; x1/x2/x4 ---------- */
function speedRestore(){ if (!SPD_ORIG) return; try { SPD_ORIG.el.style.cssText = SPD_ORIG.a; SPD_ORIG.par.style.cssText = SPD_ORIG.b; } catch (e) {} SPD_ORIG = null; ST.spdMode = ''; }
function layout(){ ST.lay = false; if (!M) return; const app = gid('app'); if (!app || !(app.clientWidth > 0)) return;
  const W = app.clientWidth, H = app.clientHeight, st = parseFloat(M.host.style && M.host.style.top) || 0, s = Math.min(W / 390, Math.max(1, H / 844)), Hb = (H - st) / s;
  const ff = typeof FIELD_FEET === 'number' ? FIELD_FEET : 640 / 844, feet = (ff * H - st) / s, fbt = s < 1 ? 44 / s : 44;
  /* cartão e resumo: sempre ACIMA da cabeça do herói (aviso nunca por cima dele) */
  { let hero = 176; try { if (typeof HS === 'number' && typeof LW === 'number' && typeof cv !== 'undefined' && cv.clientWidth) hero = HS * (cv.clientWidth / LW) / s; } catch (e) {}
    const top = Math.max(126, Math.min(236, feet - hero - 150)); if (M.root.style && M.root.style.setProperty) M.root.style.setProperty('--fgct', top.toFixed(0) + 'px'); ST.cardTop = top; }
  if (!MOVE_SPEED) return; const el = gid('fb_spd'), par = el && el.parentNode; if (!el || !par || !par.style) return;
  if (!SPD_ORIG) SPD_ORIG = { el, par, a: el.style.cssText, b: par.style.cssText };
  /* coluna à direita, logo abaixo do último ícone visível desse lado (Baú; Oferta/Evento quando existirem), fora da faixa dos inimigos (240 px acima do chão) */
  let top = 232; try { if (typeof FB_MENU !== 'undefined') for (const m of FB_MENU){ if (m.side !== 'right') continue; const e = gid('fbm_' + m.id); if (!e || e.style.display === 'none') continue; top = Math.max(top, (m.cy != null ? m.cy : m.y) + 62 + 8); } } catch (e) {}
  const colH = 3 * fbt + 2 * 2 + 8, fits = top + colH <= feet - 240;
  if (fits){ par.style.cssText = 'position:absolute;right:6px;top:' + top.toFixed(0) + 'px'; el.style.cssText = 'border-radius:26px;padding:3px;box-sizing:border-box;display:flex;flex-direction:column;gap:2px'; ST.spdMode = 'col'; }
  else { /* tela baixa: a coluna entraria na faixa dos inimigos; a fila fica deitada à esquerda, logo ACIMA da Fogueira e abaixo dos pés do herói */
    par.style.cssText = 'position:absolute;left:10px;top:' + (Hb - 110 - fbt).toFixed(0) + 'px'; el.style.cssText = SPD_ORIG.a; ST.spdMode = 'row'; } }
function layKey(){ let k = ''; try { if (typeof FB_MENU !== 'undefined') for (const m of FB_MENU) if (m.side === 'right'){ const e = gid('fbm_' + m.id); k += m.id + (e && e.style.display !== 'none' ? (m.cy != null ? m.cy : m.y) : 'x') + ','; } } catch (e) {} return k; }

/* ---------- mochila: abrir espaço pela regra do módulo (desmonta a pior destrancada; a luta nunca para) ---------- */
function room(h){ const full = () => bagOf(h).length >= bagMaxOf(h); if (!full()) return { ok: true, out: null }; let r = null; try { r = BF().makeRoom(S, h); } catch (e) {} if (!r || full()) return { ok: false, out: null }; return { ok: true, out: r }; }
const FULL_TXT = 'Mochila cheia e sem peça destrancada para sair. Destranque ou desmonte uma peça no painel.';
const roomMsg = (h, r) => r && r.out ? 'Mochila cheia: desmontei a pior destrancada (' + nameOf(h, r.out.item) + ')' : '';

/* ---------- toque: forja o lote do nível pela regra do módulo ---------- */
function tapForge(){ const b = BF(); if (!b || !M) return false; if (OFF){ say('Feche o resumo primeiro.'); return false; }
  if (CARD || Q.length){ say('Decida a peça do cartão primeiro. A luta continua.'); return false; }
  const o = b.ensure(S), D = b.DATA; if (o.bra <= 0){ const left = D.brasas.potKills - o.pot; say('Sem Brasas. ' + (left === 1 ? 'Falta 1 abate' : 'Faltam ' + left + ' abates') + ' em fase nova para a próxima Brasa.'); return false; }
  const res = b.tap(S, host()); if (!res || !res.ok){ if (res && res.reason === 'brasas') say('Sem Brasas.'); else if (res && res.reason === 'loot') say('A Fogueira não conseguiu forjar agora. Tente de novo.'); return false; }
  res.items.forEach((it, i) => Q.push({ it, stars: res.stars[i] || starsOf(it), why: 'forge' })); sfx('upgrade'); STATUS = null;
  if (res.n > 1) say('Forjou ' + res.n + ' peças: ' + res.perTap + ' por toque no nível ' + o.lv + '.'); nextCard(); sync(); return true; }
function nextCard(){ CARD = Q.shift() || null; renderCard(); }
function cardHtml(){ const b = BF(), h = host(), it = CARD.it, why = CARD.why, bag = why === 'bag', cur = eqOf(h)[it.slot], same = cur && cur.id != null && cur.id === it.id, d = same ? 0 : deltaOf(h, it), r = b.refundOf(it), rc = rarC(h, it.r), lk = bag && b.isLocked(S, it);
  const mine = same ? 'É a que você está usando' : cur ? 'Sua: ' + nameOf(h, cur) + ' · FC ' + fcTxt(fcOf(h, cur)) : 'Sua: nenhuma';
  const ref = '+' + nf(r.gold) + ' ouro · +' + r.xp + ' XP';
  return `<div class="fgx-c" role="dialog" aria-label="Peça da Fogueira" style="--rc:${rc}"><div class="fgx-r"><span class="fgx-ic"><img src="${esc(thumbOf(h, it))}" alt=""></span><span class="fgx-tx"><b>${esc(nameOf(h, it))}</b><small>${esc(rarN(h, it.r))} · ${pl(CARD.stars || starsOf(it), 'estrela', 'estrelas')}</small><span>${esc(mine)}</span></span><span class="fgx-dl ${d >= 0 ? 'up' : 'dn'}">${d >= 0 ? '+' : '−'}${esc(fcTxt(Math.abs(d)))}<small>de FC</small></span></div>`
    + (why === 'pause' ? `<div class="fgx-n">Automático pausou: saiu ${esc(rarN(h, it.r))}. Você decide.</div>` : '')
    + (bag ? `<div class="fgx-bt two"><button class="fgx-gd" data-fg="equip">Equipar</button><button class="fgx-ol" data-fg="lock">${lk ? 'Destrancar' : 'Trancar'}</button><button class="fgx-rd" data-fg="sell">Desmontar<small>${ref}</small></button><button class="fgx-ol" data-fg="cclose">Fechar</button></div>`
      : `<div class="fgx-bt"><button class="fgx-gd" data-fg="equip">Equipar</button><button class="fgx-ol" data-fg="keep">Guardar</button><button class="fgx-rd" data-fg="sell">Desmontar<small>${ref}</small></button></div>`)
    + (Q.length ? `<div class="fgx-q">+${Q.length} na fila</div>` : '') + '</div>'; }
function renderCard(){ if (!M) return; let h = ''; try { h = CARD ? cardHtml() : STATUS ? `<div class="fgx-c st" role="status">${esc(STATUS.txt)}</div>` : ''; } catch (e) { h = ''; try { console.error('Fogueira: cartão', e); } catch (e2) {} } if (M.card.innerHTML !== h) M.card.innerHTML = h; }
function canWear(h, it){ try { const T = Sys.stats; if (T && T.canEquip) return !!T.canEquip(it, h.level ? h.level() : 1); } catch (e) {} return true; }
function cardAct(a){ if (!CARD || !M) return; const b = BF(), h = host(), it = CARD.it, why = CARD.why, bag = why === 'bag', nm = nameOf(h, it);
  if (a === 'cclose'){ if (!bag) return; }
  else if (a === 'lock'){ if (!bag) return; const on = !b.isLocked(S, it); b.lock(S, it, on); say(on ? 'Trancada: nunca será desmontada.' : 'Destrancada.'); renderCard(); return; }
  else if (a === 'equip'){ if (!canWear(h, it)){ say('Você ainda não pode usar esta peça. Guarde para depois.'); return; }
    let rm = null; if (!bag){ rm = room(h); if (!rm.ok){ say(FULL_TXT); return; } h.addItem(it); }
    let ok = false; try { ok = h.equip(it) !== false; } catch (e) {} if (!ok){ say('Não deu para equipar. A peça ficou na mochila.'); } else { sfx('upgrade'); say(roomMsg(h, rm) || 'Equipou: ' + nm); } }
  else if (a === 'keep'){ if (bag) return; const rm = room(h); if (!rm.ok){ say(FULL_TXT); return; } h.addItem(it); say(roomMsg(h, rm) || 'Guardou na mochila: ' + nm); }
  else if (a === 'sell'){ if (bag && b.isLocked(S, it)){ say('Peça trancada. Destranque para desmontar.'); return; } if (bag && eqIds(h).has(String(it.id))){ say('Peça em uso. Equipe outra antes de desmontar.'); return; }
    if (!bag) h.addItem(it);   /* entra na mochila com id próprio e sai pelo desmanche do módulo: assim fica nos "últimos 10" e pode ser recuperada */
    const t = b.dismantle(S, h, [it]); if (!t.n){ say('Não deu para desmontar. A peça ficou na mochila.'); } else { sfx('claim'); say('Desmontou: +' + nf(t.gold) + ' ouro · +' + t.xp + ' XP da Fogueira' + (t.stones ? ' · +' + pl(t.stones, 'pedra', 'pedras') + ' de forja' : '') + (t.bra ? ' · +' + pl(t.bra, 'Brasa', 'Brasas') : '')); } }
  else return;
  if (why === 'pause'){ A.paused = false; A.t = 0.8; }
  CARD = null; try { if (h.onChange) h.onChange(); } catch (e) {} nextCard(); sync(); SHKEY = ''; if (SHEET) renderSheet(); }

/* ---------- automático (regras do módulo: autoRun; PAUSA em Épico ou melhor; cadeado respeitado) ---------- */
function autoStep(d){ const b = BF(), o = b.ensure(S); if (!o.auto.on || o.lv < b.DATA.auto.level){ A.paused = false; A.left = 0; return; }
  if (A.paused || CARD || Q.length || OFF || o.bra <= 0 || !inBattle()) return; A.t -= d; if (A.t > 0) return;
  const h = host(), batch = o.auto.batch; let res = null;
  if (batch === 1 || instant()){ A.left = 0; res = b.autoRun(S, h); }                       /* lote inteiro de uma vez (lote 1, ou a conveniência ligada) */
  else { if (A.left <= 0) A.left = batch; b.setAuto(S, { batch: 1 }); try { res = b.autoRun(S, h); } finally { b.setAuto(S, { batch }); } A.left--; }   /* uma peça por vez */
  A.t = A.left > 0 ? AUTO_GAP : AUTO_S; if (!res || !res.ok || !res.done) return;
  if (res.pause){ A.paused = true; A.left = 0; STATUS = null; CARD = { it: res.pause, stars: starsOf(res.pause), why: 'pause' }; sfx('claim'); renderCard(); sync(); return; }
  const p = []; if (res.equipped) p.push('equipou ' + res.equipped); if (res.sold) p.push('desmontou ' + res.sold); if (res.kept) p.push('guardou ' + res.kept);
  STATUS = { txt: 'Automático: ' + p.join(' · '), t: STATUS_S }; renderCard(); }

/* ---------- painel por cima (segurar 0,5 s ou a engrenagem) ---------- */
function sheetHtml(){ const b = BF(), h = host(), v = b.view(S, h), D = b.DATA, A2 = v.auto, lockA = v.lv < v.autoLevel, max = v.lv >= D.maxLevel, full = !max && v.xp >= v.need, si = b.stageOf(v.lv), eq = eqIds(h), now = nowOf(h);
  const pr = x => x ? 'true' : 'false', pct = p => p >= 10 ? Math.round(p) + '%' : String(Math.round(p * 10) / 10).replace('.', ',') + '%';
  const all = bagOf(h).filter(it => it && !eq.has(String(it.id))), bag = all.slice(-BAG_SHOW).reverse(), rec = v.recent.filter(x => now - (+x.t || 0) < D.keep.ms);
  const arm = k => QK && QK.k === k ? QK : null;
  const qb = (k, act, val, label) => { const q = arm(k); return `<button data-fg="${act}"${val != null ? ` data-v="${val}"` : ''} class="${q ? 'arm' : ''}">${q ? 'Toque de novo: desmontar ' + pl(q.n, 'peça', 'peças') : esc(label)}</button>`; };
  return `<div class="fgx-sh" id="fgx_sh" role="dialog" aria-label="Painel da Fogueira"><h3><span>Fogueira · nível ${v.lv} · ${esc(v.stage.name)}</span><button class="fgx-x" data-fg="close" aria-label="Fechar">×</button></h3>
<div class="fgx-xp"><i style="width:${(max ? 100 : Math.min(100, v.xp / v.need * 100)).toFixed(1)}%"></i><b>${max ? 'Nível máximo' : 'XP da Fogueira ' + v.xp + '/' + v.need}</b></div>
<button class="fgx-up" data-fg="up" aria-disabled="${pr(!full)}">${max ? 'Nível máximo' : full ? 'Subir para o nível ' + (v.lv + 1) + ' · ' + nf(v.cost) + ' de ouro' : 'Forje e desmonte para encher a barra'}</button>
<p class="fgx-nt">Brasas: <b style="color:#ffc27a">${v.bra}/${v.max}</b> · pote ${v.pot}/${v.potKills} abates em fase nova · <b style="color:#fff">${pl(v.perTap, 'peça', 'peças')} por toque</b> (cada uma = 1 Brasa)${v.nextTap ? ' · no nível ' + v.nextTap.lv + ': ' + v.nextTap.n + ' por toque' : ''}. Brasas só se ganham jogando.</p>
<div class="fgx-se"><span>Estágios</span><span>${si + 1} de ${D.stages.length}</span></div>
<div class="fgx-ga">${D.stages.map((s, i) => `<div class="${i === si ? 'cur' : i > si ? 'lk' : ''}">${artHtml(i + 1, 'fgx-gi')}<b>${esc(s.name)}</b><small>${i > si ? 'nível ' + s.from : i === si ? 'atual' : 'feito'}</small></div>`).join('')}</div>
<div class="fgx-se"><span>Automático</span><span>${lockA ? 'abre no nível ' + v.autoLevel : A2.on ? 'ligado' : 'desligado'}</span></div>
<div class="fgx-sg"><button data-fg="on" aria-pressed="${pr(A2.on && !lockA)}">Ligado</button><button data-fg="off" aria-pressed="${pr(!(A2.on && !lockA))}">Desligado</button></div>
<div class="fgx-se"><span>Peças por rodada</span><span></span></div>
<div class="fgx-sg">${D.auto.batches.map(n => `<button data-fg="batch" data-v="${n}" aria-pressed="${pr(A2.batch === n)}">${n}</button>`).join('')}</div>
<div class="fgx-se"><span>Desmontar sozinho abaixo de</span><span></span></div>
<div class="fgx-sg">${[1, 2, 3].map(r => `<button data-fg="sellb" data-v="${r}" aria-pressed="${pr(A2.sellBelow === r)}">${esc(rarN(h, r))}</button>`).join('')}</div>
<div class="fgx-se"><span>Equipar a melhor sozinho</span><span></span></div>
<div class="fgx-sg"><button data-fg="eq" data-v="1" aria-pressed="${pr(A2.equip)}">Sim</button><button data-fg="eq" data-v="0" aria-pressed="${pr(!A2.equip)}">Não</button></div>
<p class="fgx-nt">Sempre pausa em ${esc(rarN(h, D.auto.pauseFromR))} ou melhor. Nunca desmonta peça com cadeado. Mochila cheia: desmonta a pior destrancada e a luta nunca para.</p>
<div class="fgx-se"><span>Chances no nível ${v.lv}</span><span>qualidade média: ${pl(Math.round(v.stars), 'estrela', 'estrelas')}</span></div>
<div class="fgx-tb">${v.odds.map((p, r) => `<div class="${p > 0 ? '' : 'z'}" style="--rc:${rarC(h, r)}"><b>${p > 0 ? pct(p) : '0%'}</b><small>${esc(rarN(h, r))}</small></div>`).join('')}</div>
<div class="fgx-se"><span>Mochila ${bagOf(h).length}/${bagMaxOf(h)}</span><span>${all.length > bag.length ? 'as ' + bag.length + ' mais novas' : ''}</span></div>
<div class="fgx-qd">${qb('worse', 'worse', null, 'Desmontar as piores que a sua')}${[1, 2].map(r => qb('below' + r, 'below', r, 'Abaixo de ' + rarN(h, r))).join('')}</div>
<div class="fgx-bg">${bag.map(it => { const dd = deltaOf(h, it), lk = b.isLocked(S, it), nm = nameOf(h, it); return `<button class="fgx-bi ${lk ? 'locked' : ''}" style="--rc:${rarC(h, it.r)}" data-fg="open" data-v="${esc(it.id)}" aria-label="Ver ${esc(nm)}${lk ? ', trancada' : ''}"><img src="${esc(thumbOf(h, it))}" alt=""><small class="${dd > 0 ? 'du' : 'dd'}">${dd > 0 ? '+' : '−'}${esc(fcTxt(Math.abs(dd)))}</small>${lk ? LOCK : ''}</button>`; }).join('') || '<p class="fgx-nt">Vazia.</p>'}</div>
${rec.length ? `<div class="fgx-se"><span>Recuperar (últimas ${D.keep.n}, por ${Math.round(D.keep.ms / 60000)} min)</span><span>${rec.length}</span></div><div class="fgx-bg">${rec.map(x => `<button class="fgx-bi" style="--rc:${rarC(h, x.item.r)}" data-fg="rec" data-v="${esc(x.item.id)}" aria-label="Recuperar ${esc(nameOf(h, x.item))}"><img src="${esc(thumbOf(h, x.item))}" alt=""><small>${esc(rarN(h, x.item.r))}</small></button>`).join('')}</div>` : ''}</div>`; }
function renderSheet(){ if (!M) return; let h = ''; if (SHEET){ try { h = sheetHtml(); } catch (e) { h = ''; SHEET = false; try { console.error('Fogueira: painel', e); } catch (e2) {} } }
  if (M.sheet.innerHTML === h) return; let sc = 0; const old = gid('fgx_sh'); if (old) sc = old.scrollTop || 0; M.sheet.innerHTML = h; const nw = gid('fgx_sh'); if (nw && sc) nw.scrollTop = sc; }
function sheetKey(){ const b = BF(), o = b.ensure(S), h = host(); return [o.lv, o.xp, o.bra, o.pot, o.recent.length, o.locked.length, bagOf(h).length, o.auto.on, o.auto.batch, o.auto.equip, o.auto.sellBelow].join('|'); }
const findBag = (h, id) => bagOf(h).find(x => x && String(x.id) === String(id)) || null;
function quickAct(k, opt){ const b = BF(), h = host(), eq = eqIds(h);
  if (!QK || QK.k !== k){ const n = bagOf(h).filter(it => it && !b.isLocked(S, it) && !eq.has(String(it.id)) && (opt.worse ? deltaOf(h, it) < 0 : (it.r | 0) < opt.belowR)).length;
    if (!n){ QK = null; say('Nada para desmontar.'); return; } QK = { k, n }; return; }   /* 1º toque: mostra quantas; 2º toque: desmonta */
  QK = null; const t = b.quick(S, h, opt); if (!t.n){ say('Nada para desmontar.'); return; } sfx('claim'); try { if (h.onChange) h.onChange(); } catch (e) {}
  say('Desmontei ' + pl(t.n, 'peça', 'peças') + ': +' + nf(t.gold) + ' ouro · +' + t.xp + ' XP da Fogueira'); }
function levelUp(){ const b = BF(), h = host(), v0 = b.view(S, h), r = b.levelUp(S, h);
  if (!r.ok){ if (r.reason === 'xp') say((r.need === 1 ? 'Falta 1' : 'Faltam ' + r.need) + ' de XP da Fogueira. Forje e desmonte para encher a barra.'); else if (r.reason === 'gold') say('Falta ouro: subir custa ' + nf(r.cost) + '.'); else if (r.reason === 'max') say('A Fogueira já está no nível máximo.'); return; }
  sfx('upgrade'); const u = v0.unlock, msg = [r.evolved ? 'A Fogueira evoluiu: ' + r.stage.name + ' (nível ' + r.lv + ')' : 'Fogueira nível ' + r.lv];
  if (u){ if (u.perTap) msg.push(u.perTap + ' peças por toque'); if (u.rarity) msg.push('agora sai ' + rarN(h, u.rarity)); if (u.auto) msg.push('automático liberado'); }
  say(msg.join(' · ')); try { if (h.onChange) h.onChange(); } catch (e) {} sync(); }
function act(a, el){ const b = BF(); if (!b || !M) return; const v = el && el.dataset ? el.dataset.v : undefined, h = host(); if (a !== 'worse' && a !== 'below') QK = null;
  if (a === 'forge'){ tapForge(); return; }
  if (a === 'sheet'){ SHEET = !SHEET; sfx('ui_tap'); SHKEY = ''; renderSheet(); return; }
  if (a === 'equip' || a === 'keep' || a === 'sell' || a === 'lock' || a === 'cclose'){ cardAct(a); return; }
  if (a === 'offok'){ OFF = null; renderOff(); return; }
  if (a === 'close'){ SHEET = false; renderSheet(); return; }
  if (a === 'up') levelUp();
  else if (a === 'on' || a === 'off'){ const o = b.ensure(S); if (o.lv < b.DATA.auto.level){ say('O automático abre no nível ' + b.DATA.auto.level + ' da Fogueira.'); return; } b.setAuto(S, { on: a === 'on' }); A.paused = false; A.left = 0; A.t = 0.5; sync(); }
  else if (a === 'sellb') b.setAuto(S, { sellBelow: +v });
  else if (a === 'eq') b.setAuto(S, { equip: v === '1' });
  else if (a === 'batch'){ b.setAuto(S, { batch: +v }); A.left = 0; }
  else if (a === 'open'){ const it = findBag(h, v); if (!it) return; if (CARD || Q.length){ say('Decida o cartão aberto primeiro.'); return; } SHEET = false; renderSheet(); STATUS = null; CARD = { it, stars: starsOf(it), why: 'bag' }; renderCard(); return; }
  else if (a === 'worse') quickAct('worse', { worse: true });
  else if (a === 'below') quickAct('below' + (+v), { belowR: +v });
  else if (a === 'rec'){ if (bagOf(h).length >= bagMaxOf(h)){ say('Mochila cheia: abra espaço para recuperar.'); return; } const r = b.recover(S, h, v);
    if (r.ok){ say('Recuperada: ' + nameOf(h, r.item)); try { if (h.onChange) h.onChange(); } catch (e) {} } else say(r.reason === 'gold' ? 'Falta ouro para devolver o que a peça rendeu.' : 'O tempo de recuperar esta peça acabou.'); }
  else return;
  SHKEY = ''; renderSheet(); }
function onClick(ev){ const t = ev && ev.target, el = t && t.closest ? t.closest('[data-fg]') : null; if (!el) return; const a = el.dataset.fg;
  if (a === 'forge' && ST.held){ ST.held = false; return; } act(a, el); }
function onDown(ev){ const t = ev && ev.target, el = t && t.closest ? t.closest('#fgx_b') : null; if (!el) return; ST.held = false; clearTimeout(ST.holdT);
  ST.holdT = setTimeout(() => { if (!M) return; ST.held = true; SHEET = true; SHKEY = ''; renderSheet(); }, HOLD_MS); }
function onUp(){ clearTimeout(ST.holdT); }

/* ---------- tempo fora: UMA vez por abertura do jogo; só as Brasas são da Fogueira (ouro e itens continuam no aviso que já existe) ---------- */
function offlineText(r){ if (!r || !r.on || !(r.brasas > 0)) return ''; const hh = Math.floor(r.counted / 3600), mm = Math.floor(r.counted % 3600 / 60);
  return 'A Fogueira juntou ' + pl(r.brasas, 'Brasa', 'Brasas') + ' em ' + (hh ? hh + ' h ' : '') + mm + ' min.' + (r.full ? ' O estoque está cheio.' : r.dayLeft <= 0 ? ' É o limite de Brasas do tempo fora por dia.' : ''); }
function offline(seconds, opt){ const b = BF(); if (!b || OFF_DONE || !isOn()) return null; OFF_DONE = true; let r = null; try { r = b.offline(S, host(), seconds); } catch (e) { return null; }
  r.text = offlineText(r); if (r.text && !(opt && opt.silent)){ if (!M) mount(); if (M){ OFF = r; renderOff(); sync(); } } return r; }
function renderOff(){ if (!M) return; const h = OFF ? `<div class="fgx-c" role="dialog" aria-label="Enquanto você esteve fora"><div class="fgx-r"><span class="fgx-tx"><b>Enquanto você esteve fora</b><span>${esc(OFF.text)}</span></span></div><div class="fgx-bt two" style="grid-template-columns:minmax(0,1fr)"><button class="fgx-gd" data-fg="offok">Entendi</button></div></div>` : ''; if (M.off.innerHTML !== h) M.off.innerHTML = h; }

/* ---------- faíscas no canvas da batalha (px lógicos da cena; teto MAX_FLY; nada é creditado aqui: o ganho é do módulo) ---------- */
function target(){ if (TGT) return TGT; try { const e = gid('fgx_b'); if (e && typeof cv !== 'undefined' && typeof LW === 'number'){ const cr = cv.getBoundingClientRect(), k = cr.width / LW, r = e.getBoundingClientRect(); if (k > 0 && r.width > 0) return TGT = { x: (r.left + r.width / 2 - cr.left) / k, y: (r.top + r.height * 0.42 - cr.top) / k }; } } catch (e) {}
  const lw = typeof LW === 'number' ? LW : 330, lh = typeof LH === 'number' ? LH : 714; return TGT = { x: lw * 160 / 390, y: lh - 46 }; }
function fly(k, x, y, delay, txt){ if (FLY.length >= MAX_FLY) return false; FLY.push({ k, x0: +x || 0, y0: +y || 0, t: -(delay || 0), dur: k === 'bra' ? 1 : 0.9, arc: k === 'bra' ? 46 : 38, txt: txt || '' }); return true; }
/* abate: a faísca só voa quando o abate CONTA para o pote (Sys.bonfire.killCounts: só fase nova) */
function onKill(x, y){ if (!M) return false; try { if (!BF().killCounts(S, S.stage, S.best)) return false; } catch (e) { return false; } return fly('ember', x, y, 0, ''); }
/* Brasas creditadas pelo módulo (pote cheio, fase, chefe): voam do ponto até a Fogueira; devolve true se desenhou (quem chama não precisa do voo antigo) */
function onBrasa(x, y, n){ if (!M) return false; n = Math.max(0, n | 0); if (!n) return false; const k = Math.min(n, 6); let any = false; for (let i = 0; i < k; i++) any = fly('bra', (+x || 0) + (i - k / 2) * 5, y, i * 0.1, i === k - 1 ? '+' + pl(n, 'Brasa', 'Brasas') : '') || any; if (!any) bump(); return true; }
function stepFly(dt){ for (let i = FLY.length - 1; i >= 0; i--){ const f = FLY[i]; f.t += dt; if (f.t < f.dur) continue; FLY.splice(i, 1); bump();
    if (f.txt){ try { const T = target(); if (typeof floatText === 'function') floatText(T.x, T.y - 30, f.txt, '#ffc27a', true); } catch (e) {} } } }
function draw(c){ if (!M || !FLY.length || !c) return; const T = target(); c.save(); c.globalCompositeOperation = 'lighter';
  for (const f of FLY){ if (f.t < 0) continue; const u = Math.min(1, f.t / f.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2, x = f.x0 + (T.x - f.x0) * e, y = f.y0 + (T.y - f.y0) * e - Math.sin(u * Math.PI) * f.arc, r = f.k === 'bra' ? 4.6 : 3;
    c.globalAlpha = 0.32; c.fillStyle = '#ff6a2a'; c.beginPath(); c.arc(x, y, r * 2.3, 0, 7); c.fill(); c.globalAlpha = 0.95; c.fillStyle = f.k === 'bra' ? '#ffe07a' : '#ffc27a'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.restore(); }

/* ---------- relógio: chamado a cada quadro pelo laço; a parte lenta roda a cada SYNC_S ---------- */
function slow(d){ const on = isOn(); if (on && !M) mount(); else if (!on && M){ unmount(); return; } if (!M) return;
  if (STATUS){ STATUS.t -= d; if (STATUS.t <= 0){ STATUS = null; renderCard(); } }
  try { autoStep(d); } catch (e) { A.t = AUTO_S; try { console.error('Fogueira: automático', e); } catch (e2) {} }
  sync(); if (!ST.lay){ const k = layKey(); if (k !== ST.layKey){ ST.layKey = k; ST.lay = true; } } if (ST.lay){ ST.layKey = layKey(); layout(); }
  if (SHEET){ const k = sheetKey(); if (k !== SHKEY){ SHKEY = k; renderSheet(); } } }
function tick(dt){ dt = +dt || 0; if (!(dt > 0)) return; ST.clock += dt; ST.acc += dt; if (M && FLY.length) stepFly(dt); if (ST.acc < SYNC_S) return; const d = ST.acc; ST.acc = 0; try { slow(d); } catch (e) { try { console.error('Fogueira', e); } catch (e2) {} } }

const API = { FOG_ART, FOG_LOOP, FOG_LOOP_JSON, ACTIONS, loopApply: (n, box, j) => loopApply(n, box, ST.loopTok, j), mount, unmount, tick, draw, onKill, onBrasa, offline, offlineText, act,
  mounted: () => !!M, isOn, target: () => M ? target() : null,
  state: () => ({ mounted: !!M, card: CARD, queue: Q.slice(), status: STATUS, sheet: SHEET, off: OFF, auto: Object.assign({}, A), fly: FLY.length, said: ST.said, hud: ST.hud || null, speed: ST.spdMode, arm: QK }),
  els: () => M };
(typeof window !== 'undefined' ? window : globalThis).Fogueira = API;
})();
