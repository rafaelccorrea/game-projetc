'use strict';
/* ================= ENCRUZILHADA DAS ERAS — tela nova, nasce DESLIGADA (PANEL_ON.cross) =================
   Protótipo aprovado: docs/proto/v2/Encruzilhada.html. Decisão do dono: "do jeito mostrado: a escolha vale até o fim da era".
   É um OVERLAY (def.overlay, molde do js/p_era.js): janela por cima da batalha, que continua visível atrás, escurecida e parada.
   Abre por Panels.open('cross', {stage, onDone})  → janela de escolha da encruzilhada daquela fase (número da fase ou {era, n});
            Panels.open('cross')                    → a encruzilhada que está esperando; se não há nenhuma, a lista das bênçãos;
            Panels.open('cross', {mode:'list'})     → lista "Bênçãos da era" (as ativas e as encruzilhadas esperando).
   NENHUMA regra nem número de jogo aqui. Tudo vem do js/sys/crossroads.js (Sys.crossroads):
   - as 2 bênçãos (nome, texto, valores): offers(S, fase) · gravar a escolha: choose(S, fase, id, host) (UMA chamada por toque em Confirmar);
   - bênçãos ativas da era: active(S) · era, fases por era, pontos da trilha e encruzilhadas esperando: view(S, host) · fase → era/número: where(fase).
   O rótulo curto do cartão ("ATK +3%") é montado com os valores stat/perk/strike que o módulo devolve; chave que a tela não conhece mostra o texto do módulo.
   Quando o módulo recusa (off, stage, old, done, id) a janela mostra o motivo; nada é gravado aqui.
   Módulo desligado ou ausente: aviso e Voltar.
   NA BATALHA (PCross.mount(host) + PCross.update() no fbTick, como o PGuide): o selo "Encruzilhada" embaixo da barra da fase enquanto houver uma esperando
   e o botão "Bênçãos" na coluna da esquerda. Os dois só existem com a tela ligada (Panels.on('cross')) E o módulo ligado.
   Sem imagem: os ícones são desenhados no código (os do protótipo). Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('cross' in PANEL_ON)) PANEL_ON.cross=false;
const N='cross';
const ACTIONS=['pick','back','ok','later','close','open'];
const X={open:false,el:null,mode:'',stage:null,sel:'',msg:'',tone:'',busy:false,o:null,paused:false,offers:[],
  hud:null,hudSig:'',hudT:0,bump:0,css:false,le:null,bt:null};

/* ---------- leituras do módulo ---------- */
const CR=()=>(window.Sys&&window.Sys.crossroads)||null;
const ok=()=>{ const C=CR(); try{ return !!(C&&typeof C.on==='function'&&C.on()===true&&C.offers&&C.choose&&C.active&&C.view&&C.where); }catch(e){ return false; } };
const host=()=>(window.Sys&&window.Sys.host)||null;
const sv=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const nf=v=>String(Math.round(v*10)/10).replace('.',',');
const viewOf=()=>{ try{ const v=CR().view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const whereOf=st=>{ try{ return CR().where(st)||null; }catch(e){ return null; } };
const norm=st=>{ const w=st==null?null:whereOf(st); return w?{era:w.era,n:w.n}:null; };
const offersOf=st=>{ try{ const a=CR().offers(sv(),st); return Array.isArray(a)?a:[]; }catch(e){ return []; } };
const activeOf=()=>{ try{ const a=CR().active(sv()); return Array.isArray(a)?a:[]; }catch(e){ return []; } };
const eraName=e=>{ try{ if(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n) return String(ERAS[e].n); }catch(er){} const v=viewOf(); return (v&&v.era===e&&v.eraName)?String(v.eraName):'Era '+(e+1); };
const lbl=st=>(st.era+1)+'-'+st.n;
/* encruzilhadas esperando: a era e a fase saem da CHAVE "era:fase" de cada item do view().open (é o que o módulo grava no save); os campos era/n/stage/offers
   do item não são usados aqui, e as ofertas vêm sempre do offers(S, {era, n}) */
const pendOf=v=>(v&&Array.isArray(v.open)?v.open:[]).map(o=>{ const p=String(o&&o.key||'').split(':'); return {era:parseInt(p[0],10)||0,n:parseInt(p[1],10)||0}; }).filter(o=>o.n>0);
const perEraOf=()=>{ try{ return Math.max(1,Math.floor(num(CR().perEra()))||10); }catch(e){ return 10; } };
const lastLbl=era=>(era+1)+'-'+perEraOf();

/* rótulo curto do efeito, com os valores do módulo (k = quantas vezes a bênção foi escolhida na era) */
const LAB={atkPct:['ATK','%',1],hpPct:['Vida','%',1],critPct:['Crítico','',1],defPct:['Dano recebido','%',-1],goldPct:['Ouro','%',1],
  xpPct:['XP','%',1],brasaPot:['Brasa',' por pote',1],combo:['Combo','',1],counter:['Contra-ataque','',1],dodge:['Esquiva','',1],stun:['Atordoar','',1],lifesteal:['Roubo de vida','',1]};
function fx(b,k){ k=k||1; const out=[]; let unknown=false;
  for(const grp of [b&&b.stat,b&&b.perk,b&&b.strike]){ if(!grp) continue; for(const key in grp){ const v=num(grp[key]); if(!v) continue; const L=LAB[key]; if(!L){ unknown=true; continue; }
      const val=v*k*L[2]; out.push(L[0]+' '+(val<0?'-':'+')+nf(Math.abs(val))+L[1]); } }
  return (unknown||!out.length)?String((b&&b.text)||''):out.join(' · '); }
const plural=n=>n===0?'nenhuma escolhida':n===1?'1 escolhida':n+' escolhidas';
const WHY={off:'A Encruzilhada está desligada agora.',stage:'Esta fase não tem encruzilhada.',old:'Esta encruzilhada é de uma era que já passou. As bênçãos dela acabaram.',
  done:'Você já escolheu nesta encruzilhada. Não dá para trocar.',id:'Esta bênção não está nesta encruzilhada.'};

/* ---------- ícones desenhados no código (os do protótipo) ---------- */
const K='stroke="#1a110b" stroke-width="2.4" stroke-linejoin="round"';
const SV=inner=>'<svg class="pc-ic" viewBox="0 0 48 48" aria-hidden="true">'+inner+'</svg>';
const ICON={
  furia:'<path d="M33 5h10v10L23 35l-10-10z" fill="#e8eef8" '+K+'/><path d="M33 5L18 30" stroke="#9ab" stroke-width="2"/><path d="M11 23l14 14-4 4-4-4-6 6-4-4 6-6-4-4z" fill="#d9952f" '+K+'/>',
  vigor:'<path d="M24 42S6 31 6 18a9 9 0 0118-3 9 9 0 0118 3c0 13-18 24-18 24z" fill="#ff5a6e" '+K+'/><path d="M13 17a4 4 0 014-4" stroke="#ffd0d6" stroke-width="3" fill="none" stroke-linecap="round"/>',
  olhar:'<circle cx="24" cy="24" r="17" fill="#3a1a10" '+K+'/><circle cx="24" cy="24" r="13" fill="none" stroke="#ffd25e" stroke-width="4"/><circle cx="24" cy="24" r="6" fill="none" stroke="#ff6b4a" stroke-width="4"/><circle cx="24" cy="24" r="2" fill="#fff"/>',
  escudo:'<path d="M24 4l16 6v12c0 11-7 18-16 22C15 40 8 33 8 22V10z" fill="#6fb6ff" '+K+'/><path d="M24 10l10 4v8c0 7-4 12-10 15z" fill="#bfe0ff"/>',
  tesouro:'<circle cx="24" cy="25" r="17" fill="#ffc94a" '+K+'/><circle cx="24" cy="25" r="11" fill="none" stroke="#c07a12" stroke-width="3"/><path d="M24 17l2.4 5 5.4.6-4 3.8 1.1 5.4L24 29l-4.9 2.8 1.1-5.4-4-3.8 5.4-.6z" fill="#fff1b0"/>',
  saber:'<path d="M5 11c7-3 13-2 19 2v28c-6-4-12-5-19-2z" fill="#a98bff" '+K+'/><path d="M43 11c-7-3-13-2-19 2v28c6-4 12-5 19-2z" fill="#c9b4ff" '+K+'/><path d="M10 18c3-1 6-1 9 1M10 24c3-1 6-1 9 1M29 19c3-2 6-2 9-1M29 25c3-2 6-2 9-1" stroke="#3a2a7a" stroke-width="2" fill="none" stroke-linecap="round"/>',
  brasa:'<path d="M24 3c3 8 13 12 13 25a13 13 0 01-26 0c0-7 3-10 6-13 1 5 3 7 6 7-2-7 0-13 1-19z" fill="#ff7a2a" '+K+'/><path d="M24 24c2 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 1 2 2 3 3 3-1-3 0-5 0-8z" fill="#ffe07a"/>',
  combo:'<path d="M8 36L30 8" stroke="#1a110b" stroke-width="9" stroke-linecap="round"/><path d="M18 42L40 14" stroke="#1a110b" stroke-width="9" stroke-linecap="round"/><path d="M8 36L30 8" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M18 42L40 14" stroke="#ffd25e" stroke-width="5" stroke-linecap="round"/>',
  contra:'<path d="M38 17H14l7-8" fill="none" stroke="#1a110b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 31h24l-7 8" fill="none" stroke="#1a110b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M38 17H14l7-8" fill="none" stroke="#7fe07a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 31h24l-7 8" fill="none" stroke="#ff9f6a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>',
  esquiva:'<path d="M6 17h24a5 5 0 10-5-5M6 25h32a5 5 0 11-5 5M6 33h16" fill="none" stroke="#1a110b" stroke-width="8" stroke-linecap="round"/><path d="M6 17h24a5 5 0 10-5-5M6 25h32a5 5 0 11-5 5M6 33h16" fill="none" stroke="#9fe8ff" stroke-width="4" stroke-linecap="round"/>',
  atordoa:'<path d="M24 4l4 12 13-2-9 10 8 11-13-4-5 12-3-13-13-1 11-7-6-12 11 7z" fill="#ffd25e" '+K+'/><circle cx="24" cy="24" r="4" fill="#fff"/>',
  roubo:'<path d="M24 4C18 15 11 22 11 30a13 13 0 0026 0c0-8-7-15-13-26z" fill="#e0304a" '+K+'/><path d="M24 25v12M18 31h12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
};
const CROSS=SV('<rect x="21" y="6" width="6" height="38" rx="2" fill="#8a5a2a" '+K+'/><path d="M8 10h22l6 5-6 5H8z" fill="#ffc94a" '+K+'/><path d="M40 22H18l-6 5 6 5h22z" fill="#e8b46a" '+K+'/><path d="M13 15h12M22 27h13" stroke="#6a3a10" stroke-width="2" stroke-linecap="round"/><path d="M14 44h20" stroke="#1a110b" stroke-width="3" stroke-linecap="round"/>');
const GLASS=SV('<path d="M13 5h22M13 43h22" stroke="#ffc94a" stroke-width="4" stroke-linecap="round"/><path d="M15 6c0 10 7 12 7 18s-7 8-7 18h18c0-10-7-12-7-18s7-8 7-18z" fill="#3a2508" stroke="#ffc94a" stroke-width="2.6" stroke-linejoin="round"/><path d="M18 40c1-5 4-7 6-8 2 1 5 3 6 8z" fill="#ffe07a"/><path d="M19 12h10l-5 7z" fill="#ffe07a"/>');
const CROWN=SV('<circle cx="24" cy="26" r="18" fill="#5a1a14" '+K+'/><path d="M11 32l-2-15 8 7 7-11 7 11 8-7-2 15z" fill="#ffc94a" '+K+'/><circle cx="24" cy="27" r="3" fill="#ff5a6e"/>');
const ico=id=>ICON[id]?SV(ICON[id]):CROSS;

const CSS=`.pc-ov{position:absolute;inset:0;z-index:94;overflow:hidden;background:rgba(6,4,2,.58);font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;touch-action:manipulation;-webkit-tap-highlight-color:transparent;animation:pc-fade .2s ease-out}
@keyframes pc-fade{from{opacity:0}}
.pc-ov *{box-sizing:border-box}
.pc-ov button,.pc-hud button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pc-ic{display:block}
.pc-lil{font-family:'Lilita One',Nunito,system-ui,sans-serif;font-weight:400}
.pc-xm{position:absolute;left:10px;right:10px;margin:0 auto;max-width:400px;overflow-x:hidden;overflow-y:auto;border-radius:20px;background:linear-gradient(180deg,rgba(42,30,20,.97),rgba(26,18,12,.97));border:2px solid #ffc94a;padding:10px 10px 11px;box-shadow:0 14px 40px rgba(0,0,0,.6);animation:pc-pop .22s ease-out;scrollbar-width:none}
@keyframes pc-pop{from{opacity:0;transform:scale(.94)}}
.pc-xh{display:flex;align-items:center;gap:8px;min-width:0}
.pc-xh>svg{width:46px;height:46px;flex:none}
.pc-xh>div{flex:1;min-width:0}
.pc-xh b{display:block;font-size:23px;line-height:1.05;color:#ffc94a;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pc-xh small{display:block;font-size:11.5px;font-weight:900;line-height:1.25;color:#f6ecdf;overflow-wrap:anywhere}
.pc-x,.xs .pc-x{flex:none;width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,236,200,.25);background:rgba(255,236,200,.06);font-size:20px;font-weight:900;padding:0;color:#f6ecdf}
.pc-xr{margin-top:8px;border-radius:14px;background:linear-gradient(180deg,#5a3a10,#3a2508);border:2px solid #ffc94a;padding:7px 9px 8px}
.pc-xr .t{display:flex;align-items:center;gap:7px;min-width:0}
.pc-xr .t svg{width:26px;height:26px;flex:none}
.pc-xr .t b{font-size:21px;color:#fff;text-shadow:0 2px 0 #000;line-height:1.05;min-width:0;overflow-wrap:anywhere}
.pc-xr p{margin:4px 0 0;font-size:11.5px;font-weight:900;line-height:1.3;color:#f6ecdf;overflow-wrap:anywhere}
.pc-xr p em,.pc-xq em,.pc-end em{font-style:normal;color:#ffc94a}
.pc-trk{position:relative;height:30px;margin:8px 14px 0 6px}
.pc-trk .bar{position:absolute;left:0;right:0;top:11px;height:8px;border-radius:4px;background:rgba(0,0,0,.5)}
.pc-trk .bar i{position:absolute;left:0;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,#ffb04a,#ffe07a)}
.pc-trk .pt{position:absolute;top:7px;width:16px;height:16px;margin-left:-8px;border-radius:50%;background:#3a2508;border:2px solid #b8945a}
.pc-trk .pt.done{background:#7a5a20;border-color:#ffe07a}
.pc-trk .pt.now{top:3px;width:24px;height:24px;margin-left:-12px;background:#ffc94a;border-color:#fff;box-shadow:0 0 10px rgba(255,201,74,.9)}
.pc-trk .boss{position:absolute;right:-14px;top:0;width:30px;height:30px}
.pc-trk .boss svg{width:30px;height:30px}
.pc-trkl{display:flex;justify-content:space-between;gap:6px;margin-top:1px;font-size:9.5px;font-weight:900;line-height:1.2;color:#c9b8a2}
.pc-trkl span{min-width:0;overflow-wrap:anywhere}
.pc-trkl span:last-child{color:#ff9f9f;text-align:right}
.pc-xcs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}
.pc-xc{position:relative;border-radius:15px;background:rgba(0,0,0,.35);border:2px solid #6a5a48;padding:8px 6px 7px;display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0;transition:border-color .15s,opacity .15s}
.pc-xc .ib{width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 50% 40%,#5a4026,#21170f 75%);border:2px solid #8a6a40;display:grid;place-items:center;flex:none}
.pc-xc .ib svg{width:42px;height:42px}
.pc-xc>b{margin-top:5px;font-size:12.5px;font-weight:900;line-height:1.15;min-height:29px;display:flex;align-items:center;overflow-wrap:anywhere}
.pc-xc .fx{font-size:clamp(15px,5vw,20px);line-height:1.05;color:#7fe07a;text-shadow:0 2px 0 #000;margin-top:2px;min-height:42px;display:flex;align-items:center;overflow-wrap:anywhere}
.pc-xc small{font-size:10px;font-weight:800;color:#c9b8a2;line-height:1.25;min-height:25px;overflow-wrap:anywhere}
.pc-xc .until{margin-top:4px;font-size:9.5px;font-weight:900;line-height:1.2;color:#ffc94a}
.pc-xc.sel{border-color:#ffc94a;box-shadow:0 0 16px rgba(255,201,74,.55)}
.pc-xc.off{opacity:.38}
.pc-gold,.xs .pc-gold{border:0;border-radius:13px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10;font-weight:900}
.pc-gold:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.pc-xc .pc-gold{margin-top:6px;width:100%;min-height:44px;font-size:18px;padding:0 4px}
.pc-xf{margin-top:9px;font-size:10.5px;font-weight:900;line-height:1.35;color:#c9b8a2;text-align:center;overflow-wrap:anywhere}
.pc-xf b{color:#f6ecdf}
.pc-xbt{display:flex;gap:6px;margin-top:7px}
.pc-xbt button{flex:1;min-width:0;min-height:44px;border-radius:13px;font-weight:900;font-size:13px;line-height:1.15;padding:4px 6px;overflow-wrap:anywhere}
.pc-xbt button small{display:block;font-size:10px;font-weight:800;line-height:1.2;color:#c9b8a2}
.pc-o,.xs .pc-o{background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:#f6ecdf}
.pc-g,.xs .pc-g{border:0;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;box-shadow:0 3px 0 #1d5a1c}
.pc-xq{margin-top:8px;border-radius:12px;background:rgba(0,0,0,.4);padding:7px 8px;font-size:12px;font-weight:900;text-align:center;line-height:1.3;overflow-wrap:anywhere}
.pc-msg{margin-top:8px;border-radius:12px;padding:7px 9px;font-size:12px;font-weight:900;line-height:1.3;text-align:center;overflow-wrap:anywhere}
.pc-msg.ok{background:rgba(94,240,160,.12);border:1px solid rgba(94,240,160,.5);color:#c9ffe0}
.pc-msg.bad{background:rgba(255,107,107,.14);border:1px solid rgba(255,123,123,.6);color:#ffd9d9}
.pc-brow{display:flex;align-items:center;gap:7px;padding:6px 2px;border-top:1px solid rgba(255,236,200,.1);min-width:0}
.pc-brow>svg{width:30px;height:30px;flex:none}
.pc-brow .tx{flex:1;min-width:0}
.pc-brow .tx b{display:block;font-size:12.5px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.pc-brow .tx small{display:block;font-size:10px;font-weight:800;line-height:1.2;color:#c9b8a2;overflow-wrap:anywhere}
.pc-brow .v{flex:none;max-width:46%;text-align:right;font-size:15px;line-height:1.1;color:#7fe07a;overflow-wrap:anywhere}
.pc-brow .v small{display:block;font-family:Nunito,system-ui,sans-serif;font-size:9.5px;font-weight:900;line-height:1.2;color:#ffc94a}
.pc-pend{display:flex;align-items:center;gap:6px;margin:6px 0 4px;padding:5px 6px;border-radius:11px;background:rgba(255,201,74,.12);border:1px solid rgba(255,201,74,.5);min-width:0}
.pc-pend span{flex:1;min-width:0;font-size:11.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.pc-pend .pc-gold{flex:none;min-height:44px;padding:0 12px;font-size:13px}
.pc-end{margin-top:6px;padding:6px 7px;border-radius:10px;background:rgba(0,0,0,.35);font-size:10.5px;font-weight:900;line-height:1.35;color:#f6ecdf;overflow-wrap:anywhere}
.pc-none{font-size:11.5px;font-weight:800;color:#c9b8a2;padding:8px 2px;line-height:1.3}
.pc-hud{position:absolute;left:0;top:0;width:0;height:0;z-index:6;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf}
body.fb.pcx.pcx #toast{top:calc(var(--fbsafe,0px) + var(--pcxt,180px) * var(--fbs,1))}
.pc-badge,.xs .pc-badge{position:absolute;left:82px;min-height:40px;max-width:236px;padding:2px 12px 2px 5px;border-radius:20px;background:rgba(22,16,12,.74);border:1.5px solid #ffc94a;color:#f6ecdf;display:flex;align-items:center;gap:6px;text-align:left;box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08);animation:pc-xb 1.4s ease-in-out infinite;width:max-content}
.pc-badge svg{width:30px;height:30px;flex:none}
.pc-badge b{display:block;font-size:15px;color:#ffc94a;line-height:1}
.pc-badge small{display:block;font-size:10px;font-weight:900;color:#f6ecdf;line-height:1.1}
@keyframes pc-xb{50%{box-shadow:0 0 0 3px rgba(255,201,74,.35),0 0 18px rgba(255,201,74,.6)}}
.pc-bb,.xs .pc-bb{position:absolute;left:12px;width:58px;height:74px;padding:0;border:0;background:none;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px}
.pc-bb .r{position:relative;width:52px;height:52px;border-radius:50%;background:rgba(22,16,12,.74);border:2px solid #ffc94a;display:grid;place-items:center;box-shadow:0 6px 16px rgba(0,0,0,.4)}
.pc-bb .r svg{width:34px;height:34px}
.pc-bb .lb{font-size:10.5px;line-height:12px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000,0 0 5px #000;white-space:nowrap}
.pc-bb .ct{position:absolute;right:-5px;top:-4px;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border:2px solid #1a110b;font-style:normal;font-size:12px;font-weight:900;display:grid;place-items:center}
.pc-bb .ct.ex{background:linear-gradient(180deg,#ff9a4a,#d8461a);color:#fff}
.pc-bb.bump .r{animation:pc-bump .45s ease-out}
@keyframes pc-bump{40%{transform:scale(1.18)}}
@media (prefers-reduced-motion:reduce){.pc-ov,.pc-xm,.pc-badge,.pc-bb.bump .r{animation:none}}`;
function inject(){ if(X.css) return; try{ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.id='pc_css'; st.textContent=CSS; document.head.appendChild(st); X.css=true; }catch(e){} }

/* ================= HTML da janela ================= */
const msgHtml=()=>X.msg?'<div class="pc-msg '+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc(X.msg)+'</div>':'';
const headHtml=(title,sub,close)=>'<div class="pc-xh">'+CROSS+'<div><b class="pc-lil">'+esc(title)+'</b>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>'+(close?'<button class="pc-x" data-x="close" aria-label="Fechar">×</button>':'')+'</div>';
function trackHtml(st,v){ const pe=(v&&v.perEra>0)?v.perEra:perEraOf(), pts=(v&&Array.isArray(v.points))?v.points:[]; let h='';
  for(const n of pts) h+='<i class="pt '+(n===st.n?'now':n<st.n?'done':'')+'" style="left:'+(n/pe*100).toFixed(2)+'%"></i>';
  return '<div class="pc-trk" aria-hidden="true"><div class="bar"><i style="width:'+(Math.min(1,st.n/pe)*100).toFixed(2)+'%"></i></div>'+h+'<span class="boss">'+CROWN+'</span></div>'
    +'<div class="pc-trkl"><span>Agora: fase '+esc(lbl(st))+'</span><span>Fase '+esc(lastLbl(st.era))+': Senhor da Era</span></div>'; }
function pickHtml(){ const st=X.stage, of=X.offers=offersOf(st), v=viewOf(), next=(typeof ERAS!=='undefined'&&ERAS[st.era+1]&&ERAS[st.era+1].n)?String(ERAS[st.era+1].n):'';
  const sel=of.find(b=>b.id===X.sel)||null; if(!sel) X.sel='';
  const cards=of.map(b=>'<div class="pc-xc'+(sel?(sel.id===b.id?' sel':' off'):'')+'"><span class="ib">'+ico(b.id)+'</span><b>'+esc(b.name)+'</b><span class="fx pc-lil">'+esc(fx(b))+'</span><small>'+esc(b.text)+'</small><span class="until">até o fim da era</span>'
    +(sel?'':'<button class="pc-gold pc-lil" data-x="pick" data-id="'+esc(b.id)+'" aria-label="Escolher '+esc(b.name)+': '+esc(fx(b))+', vale até o fim da era">Escolher</button>')+'</div>').join('');
  const foot=sel?('<div class="pc-xq">Ficar com <em>'+esc(sel.name)+'</em> ('+esc(fx(sel))+') até vencer o Senhor da Era?<br>Não dá para trocar depois.</div><div class="pc-xbt"><button class="pc-o" data-x="back">Voltar</button><button class="pc-g" data-x="ok">Confirmar</button></div>')
    :(msgHtml()+'<div class="pc-xf"><b>Escolha definitiva.</b> Estas 2 são sempre as mesmas nesta encruzilhada: elas não mudam.</div><div class="pc-xbt"><button class="pc-o" data-x="later">Escolher depois<small>fica esperando no selo, sem prazo</small></button></div>');
  return headHtml('Encruzilhada das Eras','Fase '+lbl(st)+' vencida · escolha 1 de '+of.length+' bênçãos',false)
    +'<div class="pc-xr"><div class="t">'+GLASS+'<b class="pc-lil">Vale até o fim da era</b></div><p>Acaba ao vencer o <em>Senhor da Era</em> (fase '+esc(lastLbl(st.era))+').'+(next?' Na era seguinte ('+esc(next)+') começa uma coleção nova.':'')+'</p>'+trackHtml(st,v)+'</div>'
    +'<div class="pc-xcs">'+cards+'</div>'+foot; }
function listHtml(){ const v=viewOf(), act=activeOf(), era=v?v.era:0, pend=pendOf(v);
  const agg={}, order=[]; for(const b of act){ if(!agg[b.id]){ agg[b.id]={b:b,k:0}; order.push(b.id); } agg[b.id].k++; }
  const rows=order.map(id=>{ const a=agg[id], b=a.b, k=a.k; return '<div class="pc-brow">'+ico(b.id)+'<span class="tx"><b>'+esc(b.name)+(k>1?' ×'+k:'')+'</b><small>'+esc(b.text)+(k>1?' cada':'')+'</small></span><span class="v pc-lil">'+esc(fx(b,k))+'<small>ativa até o fim da era</small></span></div>'; }).join('');
  const p=pend.map(o=>'<div class="pc-pend"><span>Encruzilhada da fase '+esc(lbl(o))+' esperando</span><button class="pc-gold" data-x="open" data-k="'+esc(o.era+':'+o.n)+'" aria-label="Escolher a bênção da fase '+esc(lbl(o))+'">Escolher</button></div>').join('');
  return headHtml('Bênçãos da era',eraName(era)+' · '+plural(act.length),true)+msgHtml()+p
    +(rows||'<div class="pc-none">Nenhuma bênção escolhida nesta era ainda.</div>')
    +'<div class="pc-end">Valem até o fim da era: acabam ao vencer o <em>Senhor da Era</em> (fase '+esc(lastLbl(era))+').</div>'
    +'<div class="pc-xbt"><button class="pc-o" data-x="close">Voltar</button></div>'; }
const offHtml=()=>headHtml('Encruzilhada','',false)+'<div class="pc-msg bad" role="alert">Encruzilhada indisponível agora.</div><div class="pc-xbt"><button class="pc-o" data-x="close">Voltar</button></div>';

function draw(){ if(!X.open||!X.el) return; if(X.mode!=='off'&&!ok()){ X.mode='off'; X.sel=''; }
  if(X.mode==='pick'&&(!X.stage||!offersOf(X.stage).length)){ X.mode='list'; X.sel=''; }   /* a encruzilhada deixou de estar aberta por fora: mostra a lista */
  const H=X.el.clientHeight||844, top=Math.round(Math.max(8,Math.min(150,H-548)));
  const aria=X.mode==='pick'?'Encruzilhada das Eras':X.mode==='list'?'Bênçãos da era':'Encruzilhada indisponível';
  X.el.innerHTML='<div class="pc-xm" role="dialog" aria-label="'+esc(aria)+'" style="top:'+top+'px;max-height:'+Math.max(120,H-top-8)+'px">'+(X.mode==='pick'?pickHtml():X.mode==='list'?listHtml():offHtml())+'</div>'; }

/* ================= ações ================= */
const persist=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
/* a escolha: UMA chamada ao Sys.crossroads.choose por toque em Confirmar; o resultado (ou o motivo da recusa) é o do módulo */
function commit(){ if(X.busy||X.mode!=='pick'||!X.sel||!ok()) return; X.busy=true; const id=X.sel, st=X.stage, b=X.offers.find(q=>q.id===id)||null; X.sel=''; let r=null;
  try{ r=CR().choose(sv(),st,id,host()); }catch(e){ r=null; }
  X.busy=false;
  if(r&&r.ok){ persist(); sfx('claim'); X.msg=(r.name||(b&&b.name)||'Bênção')+' ativa: '+(b?fx(b):'')+' até o fim da era ('+eraName(st.era)+')'; X.tone='ok'; X.mode='list'; X.bump=Date.now(); }
  else { sfx('ui_tap'); X.msg=(r&&WHY[r.reason])||'Não foi possível escolher agora.'; X.tone='bad'; if(!offersOf(st).length||(r&&(r.reason==='old'||r.reason==='done'||r.reason==='stage'))) X.mode='list'; }
  draw(); hudUpdate(true); }
function goPick(st,why){ const s=norm(st); if(s&&offersOf(s).length){ X.mode='pick'; X.stage=s; X.sel=''; X.msg=''; X.tone=''; return true; }
  X.mode='list'; X.sel=''; if(why){ const w=st==null?null:whereOf(st); X.msg=(!w||!w.point)?WHY.stage:WHY.done; X.tone='bad'; } return false; }
function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||''; if(!X.open||X.busy) return;
  if(a==='close'){ sfx('ui_tap'); close(); return; }
  if(a==='later'){ sfx('ui_tap'); close(); return; }
  if(X.mode==='off') return;
  if(a==='pick'){ if(X.mode==='pick'&&X.offers.some(q=>q.id===ds.id)){ sfx('ui_tap'); X.sel=String(ds.id); X.msg=''; draw(); } return; }
  if(a==='back'){ sfx('ui_tap'); X.sel=''; draw(); return; }
  if(a==='ok'){ commit(); return; }
  if(a==='open'){ const p=String(ds.k||'').split(':'); sfx('ui_tap'); goPick({era:parseInt(p[0],10)||0,n:parseInt(p[1],10)||0},true); draw(); return; }
}
function close(){ if(!X.open) return; X.open=false; const el=X.el; X.el=null; try{ if(el){ if(el.parentNode&&el.parentNode.removeChild) el.parentNode.removeChild(el); else if(typeof el.remove==='function') el.remove(); } }catch(e){}
  if(X.paused){ X.paused=false; try{ if(typeof B!=='undefined'&&B.res&&B.res.mode===N){ B.res=null; B.running=true; } }catch(e){} }
  const cb=X.o&&X.o.onDone; X.o=null; X.sel=''; X.msg=''; X.busy=false; hudUpdate(true); if(typeof cb==='function'){ try{ cb(); }catch(e){} } }
function open(o){ o=o||{}; if(X.open||typeof document==='undefined') return false;
  X.o=o; X.sel=''; X.msg=''; X.tone=''; X.busy=false; X.offers=[]; X.stage=null;
  if(!ok()) X.mode='off';
  else if(o.mode==='list') X.mode='list';
  else if(o.stage!=null) goPick(o.stage,true);
  else { const f=pendOf(viewOf())[0]||null; if(f) goPick(f,false); else X.mode='list'; }
  inject(); const par=document.getElementById('app')||document.body; if(!par) return false;
  const el=document.createElement('div'); el.className='pc-ov';
  if(el.addEventListener) el.addEventListener('click',ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-x]'):null; if(b) click(b); });
  par.appendChild(el); X.el=el; X.open=true;
  /* a luta fica parada atrás da janela (como nas outras janelas de resultado) e volta sozinha ao fechar; o.pause===false deixa correr */
  X.paused=false; if(o.pause!==false){ try{ if(typeof B!=='undefined'&&B&&!B.res){ B.res={mode:N}; B.act=null; B.banner=null; B.running=false; B.eshots=[]; X.paused=true; } }catch(e){} }
  draw(); return true; }

/* ================= na batalha: selo "Encruzilhada" e botão "Bênçãos" ================= */
const hudOn=()=>{ try{ return ok()&&!!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N)); }catch(e){ return false; } };
/* topo do selo: logo abaixo da barra da fase (y 122 do protótipo, x 82 a 318 na base de 390). Desce para ficar com BADGE_GAP px de folga abaixo do que estiver ali:
   o chip "FC recomendada" do js/diff.js (#dfh: top 110, 15 px de altura, 27 com a linha do teto de XP) e o selo "Fraco contra" (js/weakseal.js, #wsl_root). */
const BADGE_GAP=6, BADGE_H=40;
function badgeTop(){ let t=122;
  try{ const d=document.getElementById('dfh'); if(d&&!(d.style&&d.style.display==='none')){ const x=document.getElementById('dfh_x'), two=!!(x&&x.textContent&&!(x.style&&x.style.display==='none'));
      const top=Math.round(num(d.offsetTop))||110, h=Math.round(num(d.offsetHeight))||(two?27:15); t=Math.max(t,top+h+BADGE_GAP); } }catch(e){}
  try{ const w=document.getElementById('wsl_root'); if(w&&w.style&&w.style.display!=='none'){ const h=Math.round(num(w.offsetHeight))||24; t=Math.max(t,(Math.round(num(w.offsetTop))||122)+h+BADGE_GAP); } }catch(e){}
  return t; }
/* com o selo na tela os avisos do jogo (#toast: liberações, drops) descem para baixo dele, com a mesma folga; sem o selo voltam ao lugar */
function toastGap(top){ try{ const b=document.body; if(!b||!b.classList) return; if(top!=null){ if(b.style&&typeof b.style.setProperty==='function') b.style.setProperty('--pcxt',(top+BADGE_H+BADGE_GAP+2)+'px'); b.classList.add('pcx'); } else b.classList.remove('pcx'); }catch(e){} }
/* topo do botão Bênçãos: a vaga livre seguinte da coluna da esquerda do HUD (passo de 78 px a partir de 136, tabela FB_MENU do js/fullbattle.js);
   sem a tabela, a posição do protótipo (290) */
function bbTop(){ try{ if(typeof FB_MENU!=='undefined'&&Array.isArray(FB_MENU)){ let n=0; for(const m of FB_MENU){ if(m.side!=='left') continue; if(typeof fbUnl==='function'&&!fbUnl(m.id)) continue; if(typeof m.show==='function'&&!m.show()) continue; n++; } return 136+78*n; } }catch(e){} return 290; }
function hudHtml(o){ o=o||{}; X.le=null; X.bt=null; if(!hudOn()) return ''; const v=viewOf(); if(!v) return ''; X.le=v.lastEnded||null; const act=Array.isArray(v.active)?v.active:[], pend=pendOf(v); if(!act.length&&!pend.length) return '';
  let h='';
  if(pend.length){ const f=pend[0], bt=o.badgeTop!=null?+o.badgeTop:badgeTop(); X.bt=bt; h+='<button class="pc-badge" data-pc="badge" style="top:'+bt+'px" aria-label="Encruzilhada da fase '+esc(lbl(f))+' esperando: toque para escolher">'+CROSS+'<span><b class="pc-lil">Encruzilhada</b><small>fase '+esc(lbl(f))+' · escolha 1 de '+(offersOf(f).length||2)+'</small></span></button>'; }
  const al=act.length===1?'1 ativa':act.length+' ativas';
  h+='<button class="pc-bb'+(Date.now()-X.bump<600?' bump':'')+'" data-pc="list" style="top:'+(o.bbTop!=null?+o.bbTop:bbTop())+'px" aria-label="Bênçãos da era: '+al+(pend.length?', encruzilhada esperando':'')+'"><span class="r">'+CROSS+(pend.length?'<em class="ct ex">!</em>':act.length?'<em class="ct">'+act.length+'</em>':'')+'</span><span class="lb">Bênçãos</span></button>';
  return h; }
function hudClick(b){ const a=b&&b.dataset?b.dataset.pc:''; if(a!=='badge'&&a!=='list') return false; sfx('ui_tap');
  try{ if(window.Panels&&typeof Panels.open==='function') Panels.open(N,a==='list'?{mode:'list'}:{}); }catch(e){} return true; }
function mount(hostEl){ if(X.hud) return true; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='pc_hud'; r.className='pc-hud';
    if(r.addEventListener) r.addEventListener('click',ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-pc]'):null; if(b) hudClick(b); });
    h.appendChild(r); X.hud=r; X.hudSig=''; X.hudT=0; hudUpdate(true); return true; }catch(e){ return false; } }
/* chamar no fbTick: lê o módulo no máximo 2 vezes por segundo e só troca o HTML quando muda */
function hudUpdate(force){ const r=X.hud; if(!r) return false; const now=Date.now(); if(!force&&now-X.hudT<500) return X.hudSig!==''; X.hudT=now;
  let h=''; try{ h=hudHtml(); }catch(e){ h=''; X.bt=null; } if(h!==X.hudSig){ X.hudSig=h; r.innerHTML=h; } toastGap(h?X.bt:null); if(X.le) endedNote(X.le); return h!==''; }
/* AVISO, UMA VEZ, DAS BÊNÇÃOS QUE ACABARAM (docs/LIGACOES_RECOMPENSAS.md, C1-C2): o módulo guarda em view().lastEnded as bênçãos da era vencida
   (apaga na vitória do Senhor da Era) e a tela avisa uma vez e chama ackEnded. Sai DEPOIS da Vitória, da Troca de era e da Encruzilhada (nada aberto
   por cima da luta) e também ao abrir o jogo, se ficou pendente. Usa a leitura que o HUD já fez (nenhuma leitura a mais do módulo). */
function endedNote(le){ try{ if(X.open||!le||!Array.isArray(le.list)||!le.list.length||typeof toast!=='function') return false;
    if(typeof B!=='undefined'&&B&&(B.crossPend||B.eraPend||B.endPend||B.res||B.inst)) return false;
    const C=CR(); if(!C||typeof C.ackEnded!=='function') return false;
    const k={}, order=[]; for(const b of le.list){ const nm=String((b&&b.name)||''); if(!nm) continue; if(!k[nm]){ k[nm]=0; order.push(nm); } k[nm]++; }
    const next=(typeof ERAS!=='undefined'&&ERAS[le.era+1]&&ERAS[le.era+1].n)?String(ERAS[le.era+1].n):'';
    if(C.ackEnded(sv(),host())!==true) return false;   /* o módulo limpa primeiro: se não limpou, não avisa (nunca repete) */
    X.le=null; toast('As bênçãos da era '+eraName(le.era)+' acabaram'+(order.length?': '+order.map(n=>n+(k[n]>1?' ×'+k[n]:'')).join(', '):'')+'. '+(next?'Na era seguinte ('+next+') começa uma coleção nova.':'A jornada continua.'));
    return true; }catch(e){ try{ console.error('PCross: fim das bênçãos',e); }catch(e2){} return false; } }
function unmount(){ const r=X.hud; X.hud=null; X.hudSig=''; toastGap(null); try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }

const def=Panels.add(N,{title:'Encruzilhada',overlay:true,actions:ACTIONS,open:open,close:close});
/* para o HUD, o teste de fumaça e o console: window.PCross.open({stage:5}) */
window.PCross={open:open,close:close,click:click,state:X,actions:ACTIONS,def:def,fx:fx,hudOn:hudOn,hudHtml:hudHtml,hudClick:hudClick,mount:mount,update:hudUpdate,unmount:unmount};
})();
