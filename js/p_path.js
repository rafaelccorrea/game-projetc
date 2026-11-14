'use strict';
/* ================= CAMINHO DE LUTA (Nv 30) com TESTAR GRÁTIS — tela nova, nasce DESLIGADA (PANEL_ON.path) =================
   Protótipo aprovado pelo dono: docs/proto/v2/Caminhos.html. NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - os caminhos (nome, texto, golpes, atributos), o escolhido, o nível que libera, a troca grátis que sobra, quando a próxima volta e a frase do estado:
     Sys.path.view(S, host) (cada caminho já traz canChoose e canChange com o motivo da recusa);
   - escolher: Sys.path.choose(S, host, id) · trocar: Sys.path.change(S, host, id) (UMA chamada por toque em Confirmar; nunca existe troca paga);
   - nome e cor de cada golpe especial: Sys.strikes.DATA.name / color · "Forte contra" e "Resistem": Sys.affinity (só com a chave dele ligada);
   - ensaio: Sys.pathTry.view / canTry / start / finish / cancel / compare (duração e nome do boneco: Sys.pathTry.DATA).
   O ENSAIO É A BATALHA DE VERDADE (js/battle.js) com as flags de treino do módulo (Sys.pathTry.battle). Este arquivo NÃO luta e NÃO mexe na batalha.
   A ponte é esta (o Engenheiro liga):
     PPath.battle = function(cfg){ monta a luta de treino e devolve true }   → chamada depois do Sys.pathTry.start aceitar, com o cfg do módulo;
     PPath.finish({damage, sec, life, lifeMax, stunSec})                     → no fim dos segundos do ensaio: anota e abre a comparação;
     PPath.cancel()                                                          → "Sair do ensaio": nada é guardado.
   O QUE A BATALHA MANDA NO PPath.finish (tudo número; a tela repassa ao Sys.pathTry.finish sem fazer conta):
     damage  = dano total causado no boneco durante o ensaio;
     sec     = segundos lutados (o módulo limita à duração do ensaio);
     life    = vida do herói no fim do ensaio · lifeMax = vida máxima do herói no ensaio (as duas juntas: enchem a linha "Vida no fim" e a barra);
     stunSec = soma dos segundos em que o boneco ficou atordoado (0 para quem não atordoa): é a linha "Controle".
     Sem life, a linha "Vida no fim" fica com traço ("sem leitura"); sem stunSec o módulo anota 0 de controle.
   Sem PPath.battle ligada, o Testar grátis explica que o ensaio ainda não está ligado e NÃO chama o módulo.
   A comparação é a do protótipo e mostra só o que o Sys.pathTry.compare devolve: por caminho, Dano/s (bestDps), Vida no fim (life / lifeMax) e Controle (ctrl),
   com o selo "melhor" de cada linha vindo de topDps / topLife / topCtrl (a tela NÃO decide quem é o melhor). Caminho não testado: traço, sem número.
   Módulo desligado ou ausente: aviso e Voltar; nada é escrito no save. Sem imagem: os ícones são desenhados no código (os do protótipo).
   Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('path' in PANEL_ON)) PANEL_ON.path=false;
const N='path';
const ACTIONS=['pick','try','ok','no','cmp','list','other','back'];
const X={mode:'list',pick:'',kind:'',last:null,msg:'',tone:'',busy:false,run:null,anim:true,sig:'',tk:0,css:false};
const API={};
const DAY=86400000;

/* ---------- leituras dos módulos ---------- */
const PA=()=>(window.Sys&&window.Sys.path)||null;
const PT=()=>(window.Sys&&window.Sys.pathTry)||null;
const ok=()=>{ const P=PA(); try{ return !!(P&&typeof P.on==='function'&&P.on()===true&&P.view&&P.choose&&P.change); }catch(e){ return false; } };
const tryOn=()=>{ const T=PT(); try{ return ok()&&!!(T&&T.DATA&&T.DATA.on===true&&T.view&&T.start&&T.finish&&T.cancel&&T.compare); }catch(e){ return false; } };
const host=()=>(window.Sys&&window.Sys.host)||null;
const sv=()=>{ try{ return (typeof S!=='undefined'&&S)?S:null; }catch(e){ return null; } };
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const isOn=()=>{ try{ return typeof view!=='undefined'&&view===N; }catch(e){ return false; } };
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const dec=v=>String(Math.round(num(v)*100)/100).replace('.',',');
const persist=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const keep=()=>{ try{ if(typeof save==='function') save(); }catch(e){} };
const nowMs=()=>{ try{ const h=host(), t=h&&typeof h.now==='function'?h.now():0; if(t>0) return t; }catch(e){} return Date.now(); };
const viewOf=()=>{ try{ const v=PA().view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const tryView=()=>{ if(!tryOn()) return null; try{ const v=PT().view(sv(),host()); return v&&v.on?v:null; }catch(e){ return null; } };
const rowsOf=()=>{ if(!tryOn()) return []; try{ const r=PT().compare(sv()); return Array.isArray(r)?r:[]; }catch(e){ return []; } };
const trySec=()=>{ try{ return Math.floor(num(PT().DATA.sec)); }catch(e){ return 0; } };
const dummyName=()=>{ try{ return String(PT().DATA.dummy.name||''); }catch(e){ return ''; } };
const afterChoose=()=>{ try{ return PT().DATA.afterChoose===true; }catch(e){ return false; } };
const perWeek=()=>{ try{ return Math.floor(num(PA().DATA.changesPerWeek)); }catch(e){ return 0; } };

/* quando a troca grátis volta: o instante vem do módulo (nextFreeChange / next); aqui só vira texto */
const WD=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
function whenTxt(ms){ ms=num(ms); if(!(ms>0)) return ''; const d=new Date(ms), days=Math.ceil((ms-nowMs())/DAY);
  return WD[d.getDay()]+', '+String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+(days<=0?'':days===1?' (amanhã)':' (em '+days+' dias)'); }

/* etiquetas do que o caminho dá: golpes (nome e cor do Sys.strikes) e atributos em pontos % */
const STK_NAME={combo:'Combo',counter:'Contra-ataque',stun:'Atordoar',dodge:'Esquiva',lifesteal:'Roubo de vida'};
const STAT_LAB={aspd:['Velocidade de ataque','#f6ecdf'],critDmg:['Dano crítico','#ffd25e']};
function bonusList(p){ const out=[], K=(window.Sys&&window.Sys.strikes&&window.Sys.strikes.DATA)||{}, nm=K.name||{}, col=K.color||{};
  for(const k in (p.strikes||{})){ const v=num(p.strikes[k]); if(!v) continue; out.push({t:String(nm[k]||STK_NAME[k]||k)+' '+dec(v)+'%',c:/^#[0-9a-fA-F]{3,8}$/.test(col[k]||'')?col[k]:'#f6ecdf'}); }
  for(const k in (p.stat||{})){ const v=num(p.stat[k]); if(!v) continue; const L=STAT_LAB[k]; out.push({t:(L?L[0]:k)+' '+(v>0?'+':'-')+dec(Math.abs(v))+'%',c:L?L[1]:'#f6ecdf'}); }
  return out; }
/* eras em que o estilo do caminho é forte ou encontra resistência (tabela e percentuais do Sys.affinity; só com a chave dele ligada) */
function affOf(p){ try{ const A=window.Sys&&window.Sys.affinity; if(!A||!A.DATA||A.DATA.on!==true||!Array.isArray(A.DATA.eras)) return null; const st=p.style||p.id, pc=v=>Math.round(Math.abs(num(v))*100);
    return {strong:A.DATA.eras.filter(e=>e&&e.weak===st).map(e=>String(e.n)),resist:A.DATA.eras.filter(e=>e&&e.resist===st).map(e=>String(e.n)),up:pc(A.DATA.weak),dn:pc(A.DATA.resist)}; }catch(e){ return null; } }

const WHY={off:'O Caminho de luta está desligado agora.',id:'Este caminho não existe.',chosen:'Você já escolheu um caminho. Para mudar, use a troca grátis da semana.',
  none:'Escolha um caminho primeiro.',same:'Você já está neste caminho.',busy:'Já há um ensaio em andamento.'};
const TRY_WHY={off:'O Testar grátis está desligado agora.',id:WHY.id,chosen:'O Testar grátis fecha depois da escolha.',busy:WHY.busy,none:'Não há ensaio em andamento.'};
function why(r,v){ const k=r&&r.reason;
  if(k==='level'){ const need=num(r.need)||(v?num(v.needLevel):0), lv=v?Math.floor(num(v.level)):0; return 'Libera no Nv '+nT(need)+'.'+(v?' Você está no Nv '+nT(lv)+'.':''); }
  if(k==='week'){ const w=whenTxt(r.next||(v&&v.nextFreeChange)); return 'Você já usou a troca grátis desta semana.'+(w?' A próxima volta '+w+'.':'')+' Não há outra forma de trocar.'; }
  return WHY[k]||'Não foi possível agora.'; }
const NO_BATTLE='O ensaio ainda não está ligado nesta versão. Nada foi gasto.';

/* ---------- ícones desenhados no código (os do protótipo) ---------- */
const K='stroke="#1a110b" stroke-width="2.4" stroke-linejoin="round"';
const SV=inner=>'<svg class="pp-ic" viewBox="0 0 48 48" aria-hidden="true">'+inner+'</svg>';
const ICON={
  blade:'<path d="M36 5l7 0 0 7-20 20-7-7z" fill="#dfe8f2" '+K+'/><path d="M39 9L21 27" stroke="#9fb0c4" stroke-width="2"/><path d="M12 24l12 12-3 3-12-12z" fill="#ffc94a" '+K+'/><path d="M14 33l-7 7" stroke="#1a110b" stroke-width="7" stroke-linecap="round"/><path d="M14 33l-7 7" stroke="#8a5a2a" stroke-width="3.6" stroke-linecap="round"/><circle cx="6" cy="41" r="3.2" fill="#ffc94a" '+K+'/>',
  shot:'<path d="M10 6c16 4 26 14 30 30" fill="none" stroke="#1a110b" stroke-width="7" stroke-linecap="round"/><path d="M10 6c16 4 26 14 30 30" fill="none" stroke="#c8873e" stroke-width="3.6" stroke-linecap="round"/><path d="M10 6L40 36" stroke="#f6ecdf" stroke-width="1.6"/><path d="M6 42L34 14" stroke="#1a110b" stroke-width="5" stroke-linecap="round"/><path d="M6 42L34 14" stroke="#e8d2a8" stroke-width="2.4" stroke-linecap="round"/><path d="M38 10l-9 1 8 8z" fill="#ffb030" '+K+'/><path d="M6 42l2-7 5 5z" fill="#ff5a4a" '+K+'/>',
  arcane:'<circle cx="24" cy="24" r="17" fill="#3a2466" '+K+'/><circle cx="24" cy="24" r="12" fill="none" stroke="#c78bff" stroke-width="2" stroke-dasharray="4 3"/><path d="M24 9l4 11 11 4-11 4-4 11-4-11-11-4 11-4z" fill="#e6d4ff" '+K+'/><circle cx="24" cy="24" r="3.4" fill="#ffd25e"/>'
};
const GEN='<circle cx="24" cy="24" r="17" fill="#3a2508" '+K+'/><path d="M24 11l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#ffc94a" '+K+'/>';
const ico=p=>SV(ICON[p&&(p.style||p.id)]||ICON[p&&p.id]||GEN);

const CSS=`.pp{position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;color:#f6ecdf;font-family:Nunito,system-ui,sans-serif}
.pp *{box-sizing:border-box}
.pp button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pp-ic{display:block}
.pp-lil{font-family:'Lilita One',Nunito,system-ui,sans-serif;font-weight:400}
.pp-in{animation:pp-fade .22s ease-out}
@keyframes pp-fade{from{opacity:0;transform:translateY(8px)}}
.pp-bd{flex:1;min-height:0;min-width:0;padding:9px 12px 10px;display:flex;flex-direction:column;gap:8px}
.pp-bd>*{flex:none}
.pp-intro{border-radius:14px;background:linear-gradient(180deg,#5a3a10,#3a2508);border:2px solid #ffc94a;padding:7px 10px;font-size:12px;font-weight:800;line-height:1.35;overflow-wrap:anywhere}
.pp-intro b{font-size:17px;color:#fff;display:block;text-shadow:0 2px 0 #000;line-height:1.15}
.pp-intro em{font-style:normal;color:#ffc94a;font-weight:900}
.pp-pc{border-radius:15px;background:rgba(44,33,25,.94);border:1.5px solid #4a3a2b;padding:8px 10px;display:flex;flex-direction:column;gap:6px;min-width:0}
.pp-pc.ch{border:2px solid #7fe07a}
.pp-ph{display:flex;gap:9px;align-items:center;min-width:0}
.pp-pi{flex:none;width:50px;height:50px;border-radius:13px;background:radial-gradient(circle at 50% 40%,#5a4026,#1a120c 75%);border:2px solid #ffc94a;display:grid;place-items:center}
.pp-pi svg{width:40px;height:40px}
.pp-pn{flex:1;min-width:0}
.pp-pn b{display:flex;flex-wrap:wrap;align-items:center;gap:2px 6px;font-size:21px;line-height:1.05;color:#ffc94a;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pp-pn b em{font-style:normal;font-family:Nunito,system-ui,sans-serif;font-size:10.5px;font-weight:900;color:#0d2410;background:#9cf08f;border-radius:8px;padding:1px 6px;text-shadow:none;line-height:1.4}
.pp-pn b em.t{background:rgba(255,236,200,.14);color:#f6ecdf}
.pp-pn small{display:block;font-size:11.5px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.pp-bon{display:flex;gap:5px;flex-wrap:wrap;min-width:0}
.pp-bon span{display:inline-flex;align-items:center;gap:5px;min-height:26px;max-width:100%;padding:2px 9px 2px 7px;border-radius:13px;background:rgba(0,0,0,.35);border:1px solid rgba(255,236,200,.16);font-size:12px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.pp-bon span i{width:9px;height:9px;border-radius:50%;flex:none}
.pp-fc{display:flex;align-items:flex-start;gap:5px;min-width:0}
.pp-fc>small{flex:none;font-size:10.5px;font-weight:900;color:#c9b8a2;width:56px;line-height:1.15;padding-top:4px}
.pp-er{flex:1;display:flex;flex-wrap:wrap;gap:4px;min-width:0}
.pp-er span{min-height:24px;max-width:100%;border-radius:12px;background:rgba(127,224,122,.13);border:1px solid rgba(127,224,122,.5);color:#d6f7cf;font-size:10.5px;font-weight:900;line-height:1.15;display:inline-flex;align-items:center;padding:2px 8px;overflow-wrap:anywhere}
.pp-er span.r{background:rgba(255,120,90,.1);border-color:rgba(255,130,100,.4);color:#ffc4b0}
.pp-pb{display:flex;gap:6px;min-width:0}
.pp-o,.xs .pp-o{flex:1;min-width:0;min-height:44px;border-radius:13px;background:rgba(255,236,200,.07);border:1.5px solid rgba(255,236,200,.35);color:#f6ecdf;font-weight:900;font-size:14px;line-height:1.15;padding:4px 6px;overflow-wrap:anywhere}
.pp-o small{display:block;font-size:10.5px;color:#c9b8a2;font-weight:800;line-height:1.2}
.pp-g,.xs .pp-g{flex:1;min-width:0;min-height:44px;border:0;border-radius:13px;background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;font-size:18px;line-height:1.1;padding:4px 6px;box-shadow:0 3px 0 #1d5a1c;overflow-wrap:anywhere}
.pp-g:active{transform:translateY(2px);box-shadow:0 1px 0 #1d5a1c}
.pp-gold,.xs .pp-gold{flex:1;min-width:0;min-height:44px;border:0;border-radius:13px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:17px;line-height:1.1;padding:4px 6px;box-shadow:0 3px 0 #9a5a10;overflow-wrap:anywhere}
.pp-gold:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.pp-off,.xs .pp-off{flex:1;min-width:0;min-height:44px;border-radius:13px;background:rgba(255,255,255,.05);border:1px dashed rgba(255,236,200,.3);color:#c9b8a2;font-weight:900;font-size:12.5px;line-height:1.2;padding:4px 6px;overflow-wrap:anywhere}
.pp-off small{display:block;font-size:10.5px;font-weight:800;line-height:1.2}
.pp-ft{flex:none;padding:7px 12px 12px;background:rgba(28,20,15,.96);border-top:1px solid rgba(255,236,200,.12);text-align:center;min-width:0}
.pp-row{display:flex;gap:6px;min-width:0}
.pp-ln{margin:7px 0 0;font-size:12px;font-weight:900;line-height:1.35;overflow-wrap:anywhere}
.pp-ft>.pp-ln:first-child,.pp-ft>.pp-msg:first-child{margin-top:0}
.pp-msg{margin:7px 0 0;border-radius:12px;padding:7px 9px;font-size:12px;font-weight:900;line-height:1.3;text-align:center;overflow-wrap:anywhere}
.pp-msg.ok{background:rgba(94,240,160,.12);border:1px solid rgba(94,240,160,.5);color:#c9ffe0}
.pp-msg.bad{background:rgba(255,107,107,.14);border:1px solid rgba(255,123,123,.6);color:#ffd9d9}
.pp-note{border-radius:12px;background:rgba(0,0,0,.4);border:1px solid rgba(255,236,200,.16);padding:8px 10px;font-size:12.5px;font-weight:900;line-height:1.35;text-align:center;overflow-wrap:anywhere}
.pp-res{border-radius:20px;background:linear-gradient(180deg,rgba(42,30,20,.98),rgba(26,18,12,.98));border:2px solid #ffc94a;padding:12px 11px;display:flex;flex-direction:column;gap:9px;min-width:0}
.pp-rh{text-align:center}
.pp-rh b{display:block;font-size:25px;line-height:1.05;color:#ffc94a;text-shadow:0 2px 0 #000;overflow-wrap:anywhere}
.pp-rh small{display:block;margin-top:2px;font-size:12px;font-weight:900;line-height:1.3;overflow-wrap:anywhere}
.pp-cg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding-top:8px}
.pp-cc{position:relative;border-radius:14px;background:#2a1f16;border:2px solid #4a3a2b;padding:9px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0;text-align:center}
.pp-cc.cur{border-color:#ffc94a}
.pp-cc .pp-pi{width:40px;height:40px;border-radius:11px}
.pp-cc .pp-pi svg{width:32px;height:32px}
.pp-cc>b{font-size:12.5px;font-weight:900;color:#fff;margin-top:2px;line-height:1.15;overflow-wrap:anywhere;max-width:100%}
.pp-cc small{display:block;font-size:10px;font-weight:800;color:#c9b8a2;line-height:1.2;max-width:100%;overflow-wrap:anywhere}
.pp-dp{font-size:20px;line-height:1.05;color:#c9b8a2;text-shadow:0 2px 0 #000;max-width:100%}
.pp-ln{position:relative;width:100%;margin-top:4px;padding:3px 3px 4px;border-radius:9px;background:rgba(0,0,0,.25);border:1px solid rgba(255,236,200,.1);display:flex;flex-direction:column;align-items:center;min-width:0}
.pp-ln.tp{border-color:#ffc94a;background:rgba(255,201,74,.1)}
.pp-v{font-size:19px;line-height:1.05;color:#fff;text-shadow:0 2px 0 #000;overflow-wrap:anywhere;max-width:100%}
.pp-ln.tp .pp-v{color:#ffc94a}
.pp-hb{display:block;width:88%;height:6px;margin-top:2px;border-radius:3px;background:rgba(0,0,0,.5);overflow:hidden}
.pp-hb i{display:block;height:100%;background:linear-gradient(90deg,#3fae3c,#9cf08f)}
.pp-bst{position:absolute;right:-2px;top:-7px;padding:0 5px;height:15px;border-radius:8px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:9px;font-weight:900;line-height:15px}
.pp-tt,.xs .pp-tt{margin-top:4px;width:100%;min-height:44px;border-radius:11px;border:1.5px solid rgba(255,236,200,.35);background:rgba(255,236,200,.07);color:#f6ecdf;font-weight:900;font-size:12.5px;padding:2px 4px}
.pp-free{border-radius:12px;background:rgba(127,224,122,.12);border:1px solid rgba(127,224,122,.45);padding:7px 9px;font-size:12px;font-weight:900;text-align:center;line-height:1.35;overflow-wrap:anywhere}
.pp-cf{display:flex;gap:10px;align-items:center;min-width:0}
.pp-cf .pp-pi{width:62px;height:62px}
.pp-cf .pp-pi svg{width:50px;height:50px}
.pp-cf .pp-rh{flex:1;min-width:0;text-align:left}
.pp-cl{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px}
.pp-cl li{display:flex;gap:7px;align-items:flex-start;font-size:12px;font-weight:800;line-height:1.35;min-width:0}
.pp-cl li>span{flex:1;min-width:0;overflow-wrap:anywhere}
.pp-cl li i{flex:none;width:18px;height:18px;border-radius:50%;display:grid;place-items:center;margin-top:1px}
.pp-cl li i svg{width:12px;height:12px;display:block}
.pp-cl li i.y{background:#3fae3c}
.pp-cl li i.w{background:#f2a826}
.pp-cl li em{font-style:normal;color:#ffc94a;font-weight:900}
@media (prefers-reduced-motion:reduce){.pp-in{animation:none}}`;
(function(){ if(X.css) return; try{ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.id='pp_css'; st.textContent=CSS; document.head.appendChild(st); X.css=true; }catch(e){} })();
const TICK='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.5l2.5 2.5 4.5-5.5" fill="none" stroke="#0d2410" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const WARN='<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="5" y="2" width="2" height="5" fill="#2a1403"/><rect x="5" y="8" width="2" height="2" fill="#2a1403"/></svg>';

/* ================= HTML ================= */
const bgCss=()=>{ try{ if(typeof xEraBg==='function') return xEraBg(0.74,0.93); }catch(e){} return '#16110d'; };
const wrap=(body,foot)=>'<div class="pp'+(X.anim?' pp-in':'')+'" style="background:'+bgCss()+'"><div id="pp_sc" class="pp-bd x-scroll">'+body+'</div><div class="pp-ft">'+foot+'</div></div>';
const msgHtml=()=>X.msg?'<p class="pp-msg '+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc(X.msg)+'</p>':'';
const backRow='<div class="pp-row"><button class="pp-o" data-x="back">Voltar</button></div>';
const offHtml=()=>wrap('<div class="pp-note" role="alert">Caminho de luta indisponível agora.</div>',backRow);
const bonHtml=p=>{ const L=bonusList(p); return L.length?'<div class="pp-bon">'+L.map(b=>'<span><i style="background:'+b.c+'"></i>'+esc(b.t)+'</span>').join('')+'</div>':''; };
function affHtml(p){ const a=affOf(p); if(!a) return '';
  return (a.strong.length?'<div class="pp-fc"><small>Forte contra +'+a.up+'%</small><span class="pp-er">'+a.strong.map(n=>'<span>'+esc(n)+'</span>').join('')+'</span></div>':'')
    +(a.resist.length?'<div class="pp-fc"><small>Resistem -'+a.dn+'%</small><span class="pp-er">'+a.resist.map(n=>'<span class="r">'+esc(n)+'</span>').join('')+'</span></div>':''); }
function cardHtml(p,v,tv,rows){ const row=rows.find(r=>r&&r.id===p.id)||null, tp=tv&&Array.isArray(tv.paths)?tv.paths.find(q=>q&&q.id===p.id):null, sec=trySec();
  const tag=p.chosen?'<em>escolhido</em>':(row&&row.tried?'<em class="t">seu teste: '+nT(row.bestDps)+' dano/s</em>':''); let bt='';
  if(v.unlocked&&!p.chosen){
    const tryB=tp&&tp.can&&tp.can.ok?'<button class="pp-o" data-x="try" data-id="'+esc(p.id)+'" aria-label="Testar '+esc(p.name)+' grátis'+(sec?', '+sec+' segundos':'')+'">Testar grátis'+(sec?'<small>'+sec+' s</small>':'')+'</button>':'';
    if(!v.chosen) bt=tryB+'<button class="pp-g pp-lil" data-x="pick" data-id="'+esc(p.id)+'" aria-label="Escolher '+esc(p.name)+'">Escolher</button>';
    else if(p.canChange&&p.canChange.ok) bt=tryB+'<button class="pp-gold pp-lil" data-x="pick" data-id="'+esc(p.id)+'" aria-label="Trocar para '+esc(p.name)+', troca grátis da semana">Trocar para este</button>';
    else { const w=whenTxt(v.nextFreeChange); bt=tryB+'<button class="pp-off" data-x="pick" data-id="'+esc(p.id)+'" aria-disabled="true" aria-label="Troca grátis já usada nesta semana'+(w?'. Volta '+esc(w):'')+'">Troca grátis usada'+(w?'<small>volta '+esc(w)+'</small>':'')+'</button>'; } }
  return '<div class="pp-pc'+(p.chosen?' ch':'')+'"><div class="pp-ph"><span class="pp-pi">'+ico(p)+'</span><span class="pp-pn"><b class="pp-lil">'+esc(p.name)+tag+'</b><small>'+esc(p.desc)+'</small></span></div>'
    +bonHtml(p)+affHtml(p)+(bt?'<div class="pp-pb">'+bt+'</div>':'')+'</div>'; }
function listHtml(v){ const tv=tryView(), rows=rowsOf(), lv=Math.floor(num(v.level)), need=Math.floor(num(v.needLevel)), miss=Math.max(1,need-lv), w=whenTxt(v.nextFreeChange);
  const title=!v.unlocked?'Caminho de luta: libera no Nv '+nT(need):v.chosen?'Seu caminho: '+esc(v.chosenName):'Nv '+nT(need)+': escolha seu caminho';
  const intro='<div class="pp-intro"><b class="pp-lil">'+title+'</b>'+esc(v.text)+(v.chosen&&v.unlocked&&w?' Volta <em>'+esc(w)+'</em>.':'')+(v.chosen?' O herói continua igual.':'')+'</div>'
    +(!v.unlocked?'<div class="pp-note" role="status">Você está no Nv '+nT(lv)+'. '+(miss===1?'Falta 1 nível':'Faltam '+nT(miss)+' níveis')+' para escolher o caminho.</div>':'');
  const any=rows.some(r=>r&&r.tried); let foot=any?'<div class="pp-row"><button class="pp-o" data-x="cmp">Comparar os testes</button></div>':'';
  if(!v.unlocked) foot=backRow;
  const line=X.msg?msgHtml():(v.unlocked&&tv&&!v.chosen?'<p class="pp-ln">'+esc(tv.text)+'</p>':v.unlocked&&v.chosen&&tryOn()&&!afterChoose()?'<p class="pp-ln">Ensaio fechado depois da escolha. A troca é nesta tela.</p>':'');
  return wrap(intro+(Array.isArray(v.paths)?v.paths:[]).map(p=>cardHtml(p,v,tv,rows)).join(''),foot+line); }
function confirmHtml(v){ const p=(v.paths||[]).find(q=>q.id===X.pick), a=affOf(p), ch=X.kind==='change', n=perWeek(), li=(cls,t)=>'<li><i class="'+cls+'">'+(cls==='y'?TICK:WARN)+'</i><span>'+t+'</span></li>';
  const items=li('y','O corpo e a skin do herói <em>não mudam</em>. Muda só como ele luta.')
    +(a&&a.strong.length?li('y','Forte contra: <em>'+esc(a.strong.join(', '))+'</em> (+'+a.up+'%).'):'')
    +(ch?li('w','Esta é a <em>troca grátis desta semana</em>. Depois dela, a próxima só volta na semana seguinte.')+li('w','Você deixa o caminho <em>'+esc(v.chosenName)+'</em>.')
        :(n>0?li('w','Trocar depois: <em>grátis '+nT(n)+(n===1?' vez':' vezes')+' por semana</em>.'):'')+(tryOn()&&!afterChoose()?li('w','Depois de escolher, o Testar grátis fecha.'):''));
  return wrap('<div class="pp-res" role="dialog" aria-label="Confirmar caminho"><div class="pp-cf"><span class="pp-pi">'+ico(p)+'</span><div class="pp-rh"><b class="pp-lil">'+(ch?'Trocar para ':'Escolher ')+esc(p.name)+'?</b><small>'+esc(p.desc)+'</small></div></div>'
    +bonHtml(p)+'<ul class="pp-cl">'+items+'</ul></div>',
    '<div class="pp-row"><button class="pp-o" data-x="no">Voltar</button><button class="pp-g pp-lil" data-x="ok">Confirmar</button></div>'); }
/* uma linha da comparação (Dano/s, Vida no fim, Controle): o valor e o selo "melhor" são os do módulo; sem leitura, traço */
const fin=v=>typeof v==='number'&&isFinite(v);
const DASH='—';
const lnHtml=(lab,val,extra,top)=>'<div class="pp-ln'+(top?' tp':'')+'"><small>'+lab+'</small><span class="pp-v pp-lil">'+val+'</span>'+extra+(top?'<span class="pp-bst">melhor</span>':'')+'</div>';
function compareHtml(v){ const rows=rowsOf(), tv=tryView(), last=X.last, lp=last?rows.find(r=>r.id===last.id):null, sec=trySec(), dn=dummyName(), next=rows.find(r=>r&&!r.tried&&canTryRow(tv,r.id));
  const col=r=>{ const p=(v.paths||[]).find(q=>q.id===r.id)||{id:r.id}, hasD=fin(r.bestDps), hasL=fin(r.life), lm=num(r.lifeMax), hf=hasL&&lm>0?Math.max(0,Math.min(1,r.life/lm)):-1, hasC=fin(r.ctrl), no='<small>sem leitura</small>';
    return '<div class="pp-cc'+(last&&r.id===last.id?' cur':'')+'"><span class="pp-pi">'+ico(p)+'</span><b>'+esc(r.name)+'</b>'
      +(r.tried?lnHtml('Dano/s',hasD?nT(r.bestDps):DASH,'<small>'+(r.n===1?'1 teste':nT(r.n)+' testes')+'</small>',hasD&&r.topDps===true)
          +lnHtml('Vida no fim',hasL?nT(r.life):DASH,hasL?(hf>=0?'<span class="pp-hb" role="img" aria-label="'+Math.round(hf*100)+'% da vida máxima"><i style="width:'+(hf*100).toFixed(1)+'%"></i></span>':''):no,hasL&&r.topLife===true)
          +lnHtml('Controle',hasC?dec(r.ctrl)+' s':DASH,hasC?'<small>boneco atordoado</small>':no,hasC&&r.topCtrl===true)
        :'<span class="pp-dp pp-lil" aria-hidden="true">'+DASH+'</span><small>ainda não testou</small>'+(canTryRow(tv,r.id)?'<button class="pp-tt" data-x="try" data-id="'+esc(r.id)+'" aria-label="Testar '+esc(r.name)+' grátis">Testar</button>':''))+'</div>'; };
  const pk=lp&&(v.paths||[]).find(q=>q.id===lp.id), canPick=pk&&((pk.canChoose&&pk.canChoose.ok)||(pk.canChange&&pk.canChange.ok));
  const mine=lp?[nT(last.dps)+' dano/s'].concat(fin(last.life)?['vida no fim '+nT(last.life)]:[],fin(last.ctrl)?['controle '+dec(last.ctrl)+' s']:[]).join(', '):'';
  return wrap('<div class="pp-res" role="status" aria-label="Comparação dos ensaios"><div class="pp-rh"><b class="pp-lil">'+(lp?'Ensaio de '+esc(lp.name):'Comparar os testes')+'</b><small>'
      +(lp?'Este ensaio: '+mine+'. ':'')+'O melhor de cada caminho'+(sec?' em '+sec+' s':'')+(dn?' contra o '+esc(dn):'')+'.</small></div>'
      +'<div class="pp-cg">'+rows.map(col).join('')+'</div><div class="pp-free">O ensaio não dá prêmio nem conta progresso.<br>Testar de novo é grátis e sem limite.</div></div>',
    '<div class="pp-row"><button class="pp-o" data-x="'+(next?'other':'list')+'">'+(next?'Testar outro':'Ver os caminhos')+'</button>'
      +(canPick?'<button class="pp-g pp-lil" data-x="pick" data-id="'+esc(pk.id)+'">Escolher '+esc(pk.name)+'</button>':'')+'</div>'+msgHtml()); }
const canTryRow=(tv,id)=>{ const p=tv&&Array.isArray(tv.paths)?tv.paths.find(q=>q&&q.id===id):null; return !!(p&&p.can&&p.can.ok); };

/* ================= desenho da tela ================= */
function draw(){ const d=(typeof xDims==='function'?xDims(520):null)||{}; let h=''; const v=ok()?viewOf():null;
  if(!v){ X.mode='list'; X.pick=''; h=offHtml(); X.sig='x'; }
  else { if(X.mode==='confirm'&&!(v.paths||[]).some(q=>q.id===X.pick)){ X.mode='list'; X.pick=''; }
    if(X.mode==='compare'&&!tryOn()) X.mode='list';
    h=X.mode==='confirm'?confirmHtml(v):X.mode==='compare'?compareHtml(v):listHtml(v); X.sig=sig(); }
  V.innerHTML=typeof xWrap==='function'?xWrap(d,'',h):h; X.anim=false; }
function sig(){ if(!ok()) return 'x'; try{ const v=viewOf(); if(!v) return 'x'; return [X.mode,v.level,v.unlocked,v.chosen,v.freeLeft,v.nextFreeChange,tryOn()?1:0].join('|'); }catch(e){ return ''; } }
function say(m,tone){ X.msg=String(m||''); X.tone=tone||'bad'; }

/* ================= ações ================= */
/* 1º toque: só seleciona e abre a confirmação (ou mostra o motivo que o módulo já deu no view); nada é gravado */
function pick(id){ const v=viewOf(), p=v&&(v.paths||[]).find(q=>q.id===id); if(!p){ sfx('ui_tap'); say(WHY.id); X.mode='list'; redraw(); return; }
  const c=v.chosen?p.canChange:p.canChoose; sfx('ui_tap');
  if(!c||!c.ok){ say(why(c,v)); if(X.mode==='confirm') X.mode='list'; redraw(); return; }
  X.pick=id; X.kind=v.chosen?'change':'choose'; X.mode='confirm'; X.msg=''; redraw(); }
/* Confirmar: UMA chamada ao Sys.path.choose (1ª escolha) ou ao Sys.path.change (troca grátis da semana); o resultado, ou o motivo da recusa, é o do módulo */
function commit(){ if(X.busy||X.mode!=='confirm'||!X.pick||!ok()) return; X.busy=true; const id=X.pick, kind=X.kind, v0=viewOf(), p=v0&&(v0.paths||[]).find(q=>q.id===id); X.pick=''; X.mode='list'; let r=null;
  try{ r=kind==='change'?PA().change(sv(),host(),id):PA().choose(sv(),host(),id); }catch(e){ r=null; }
  X.busy=false;
  if(r&&r.ok){ persist(); sfx('claim'); const nm=(p&&p.name)||'', w=whenTxt(r.next);
    say(kind==='change'?'Caminho trocado: agora é '+nm+'.'+(w?' Próxima troca grátis: '+w+'.':''):'Caminho escolhido: '+nm+'. O herói continua igual; os golpes mudam.','ok'); }
  else { sfx('ui_tap'); say(r?why(r,viewOf()):'Não foi possível agora.'); }
  redraw(); }
/* Testar grátis: confere a ponte da batalha ANTES de chamar o módulo; depois UMA chamada ao Sys.pathTry.start e o cfg vai para a batalha */
function tryStart(id){ if(X.busy||X.run) return false; if(!tryOn()){ redraw(); return false; }
  if(typeof API.battle!=='function'){ sfx('ui_tap'); say(NO_BATTLE); redraw(); return false; }
  X.busy=true; let r=null; try{ r=PT().start(sv(),host(),id); }catch(e){ r=null; } X.busy=false;
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='level'?why(r,viewOf()):(r&&TRY_WHY[r.reason])||'Não foi possível testar agora.'); redraw(); return false; }
  X.msg=''; X.run={id:id}; sfx('ui_tap'); let started=false; try{ started=API.battle(r.battle)!==false; }catch(e){ started=false; }
  if(!started){ X.run=null; try{ PT().cancel(); }catch(e){} say('Não foi possível abrir o ensaio agora. Nada foi gasto.'); redraw(); return false; }
  return true; }
function showMe(o){ if(isOn()) redraw(); else { try{ if(window.Panels&&typeof Panels.open==='function') Panels.open(N,o); }catch(e){} } }
/* fim do ensaio (a batalha chama): UMA chamada ao Sys.pathTry.finish; nada é ganho. Abre a comparação.
   res = {damage, sec, life, lifeMax, stunSec} (ver o cabeçalho). life, lifeMax e stunSec só são repassados quando a batalha mandou número:
   sem eles o módulo guarda "sem leitura" na vida (e 0 no controle), em vez de a tela inventar um valor. */
function finish(res){ const T=PT(); X.run=null; if(!tryOn()) return {ok:false,reason:'off'}; let r=null;
  const o={damage:num(res&&res.damage),sec:num(res&&res.sec)}, sent=fin(res&&res.stunSec);
  if(fin(res&&res.life)){ o.life=res.life; if(fin(res.lifeMax)) o.lifeMax=res.lifeMax; } if(sent) o.stunSec=res.stunSec;
  try{ r=T.finish(sv(),host(),o); }catch(e){ r=null; }
  if(!r||!r.ok) return r||{ok:false,reason:'err'};
  keep(); sfx('ui_tap'); X.last={id:r.id,dps:r.dps,best:r.best,life:fin(r.life)?r.life:null,ctrl:sent&&fin(r.ctrl)?r.ctrl:null}; X.mode='compare'; X.msg=''; X.anim=true; showMe({keep:true}); return r; }
/* "Sair do ensaio" (a batalha chama): nada é guardado */
function cancel(){ X.run=null; let had=false; try{ const T=PT(); had=!!(T&&typeof T.cancel==='function'&&T.cancel()); }catch(e){ had=false; }
  if(had){ X.mode='list'; say('Ensaio encerrado: nada foi gasto nem ganho.','ok'); showMe({keep:true}); } return had; }
function closeMe(){ try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} }
function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||'';
  if(a==='back'){ sfx('ui_tap'); closeMe(); return; }
  if(X.busy||!ok()) return;
  if(a==='pick'){ pick(String(ds.id||'')); return; }
  if(a==='try'){ tryStart(String(ds.id||'')); return; }
  if(a==='ok'){ commit(); return; }
  if(a==='no'){ sfx('ui_tap'); X.pick=''; X.mode='list'; X.msg=''; redraw(); return; }
  if(a==='cmp'){ if(tryOn()){ sfx('ui_tap'); X.last=null; X.mode='compare'; X.msg=''; redraw(); } return; }
  if(a==='list'){ sfx('ui_tap'); X.mode='list'; X.msg=''; redraw(); return; }
  if(a==='other'){ const tv=tryView(), nx=rowsOf().find(r=>r&&!r.tried&&canTryRow(tv,r.id)); if(nx) tryStart(nx.id); else { X.mode='list'; redraw(); } return; }
}
function urls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){} return u; }

const def=Panels.add(N,{title:'Caminho de luta',actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.busy) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return X.busy; },
  /* abrir pela mão do jogador: começa na lista; se ficou um ensaio pendurado na memória do módulo (o jogador saiu da luta por outro caminho), ele é solto */
  onOpen(o){ X.anim=true; X.sig=''; X.tk=0; X.pick=''; if(o&&o.keep) return; X.mode='list'; X.msg=''; X.last=null; X.run=null;
    try{ const T=PT(); if(tryOn()&&typeof T.active==='function'&&T.active()) T.cancel(); }catch(e){} },
  onClose(){ X.pick=''; X.msg=''; if(X.mode==='confirm') X.mode='list'; } });
/* para a batalha, o teste de fumaça e o console */
Object.assign(API,{state:X,actions:ACTIONS,def:def,urls:urls,bonusList:bonusList,whenTxt:whenTxt,battle:null,tryStart:tryStart,finish:finish,cancel:cancel,
  running:()=>X.run?{id:X.run.id}:null});
window.PPath=API;
})();
