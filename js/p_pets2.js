'use strict';
/* ================= TELA PETS V2 (docs/proto/v2/Pets.html; PASSAGEM.md seções 0 e 4) — NASCE DESLIGADA (PANEL_ON.pets2 = false) =================
   Só a TELA. O herói fica sempre à vista no palco (arma na mão, asa, montaria) e o pet escolhido fica NA FRENTE dele, no estágio de verdade:
   quem desenha é a rota única do jogo (window.drawHeroFull do js/battle.js; o state vem do StageKit.toState quando o js/stagekit.js está carregado).
   Tocar num pet do jogador troca o ativo na hora (com "poder antes e depois" e Desfazer); tocar num pet que ele não tem mostra a PRÉVIA no herói,
   com a faixa "Prévia: X · Sair" (nenhuma janela por cima). Alimentar, Evoluir, Redefinir nível, ovos: tudo pelo Sys.pet (js/sys/pet.js).
   NENHUMA regra e NENHUM número aqui: nomes, raridade, sprite, estágios, tetos, custos, chances, fontes e a parte na FC vêm do módulo (Sys.pet, Sys.fc, Sys.level).
   A tela NÃO liga nenhuma chave: sem o módulo ou sem a tela 17b ligada (Sys.pet.setV17) mostra "Pets: em breve"; antes do nível, o portão com Voltar.
   "Em breve" num pet = o MÓDULO diz que ele ainda não existe (Sys.pet.avail): não tem prévia e não pode ser equipado.
   O arquivo roda em escopo próprio (os nomes daqui não chegam ao js/p_pets.js, que continua valendo enquanto esta chave estiver desligada). */
(function(){
const P2='pets2';

/* ---------- chamadas ao Sys.pet ISOLADAS (mesmas reservas do js/p_pets.js) ---------- */
const pP=()=>(window.Sys&&Sys.pet)||null;
const pHost=()=>(window.Sys&&Sys.host)||null;
function pReady(){ const P=pP(); return !!(P&&P.DATA&&P.DATA.v3===true&&P.DATA.v17&&P.DATA.v17.on===true&&typeof P.ensure==='function'&&typeof P.fcShare==='function'); }
function pCall(fn,args,fb){ const P=pP(); try{ if(P&&typeof P[fn]==='function'){ const r=P[fn].apply(P,args); return r==null?fb:r; } }catch(e){} return fb; }
const pSave=()=>pCall('ensure',[S],{owned:{},stored:{},food:0,eq:null,choices:[],gated:[],first:true});
/* o módulo não exporta locked/lockLevel: mesma leitura pelo Sys.level que a tela de hoje faz */
function pLocked(){ const P=pP(); if(!P) return false; if(typeof P.locked==='function') return !!P.locked(S);
  try{ const L=window.Sys&&Sys.level, v=P.DATA.v20; if(v&&v.on===true) return !!(L&&L.level&&L.level(S)<v.unlockLevel); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'pet')); }catch(e){ return false; } }
function pLockLevel(){ const P=pP(); if(P&&typeof P.lockLevel==='function') return P.lockLevel();
  try{ const L=window.Sys&&Sys.level, v=P&&P.DATA.v20; if(v&&v.on===true) return v.unlockLevel; return L&&L.unlockLevel?L.unlockLevel('pet'):1; }catch(e){ return 1; } }
function pHidden(){ if(pLocked()) return true; try{ return typeof xUnlocked==='function'&&!xUnlocked('pet'); }catch(e){ return false; } }
function pHiddenLv(){ if(pLocked()) return pLockLevel(); try{ return typeof xUnlockLv==='function'?xUnlockLv('pet'):pLockLevel(); }catch(e){ return pLockLevel(); } }
/* nome da raridade: a lista do módulo é interna; reserva = RN() do jogo (0-4) + "Prismático" (5), como na tela de hoje */
const pRN=r=>{ const P=pP(); if(P&&typeof P.rarityName==='function') return P.rarityName(r); if(r>=5) return 'Prismático'; try{ return (typeof RN==='function'&&RN(r))||''; }catch(e){ return ''; } };
/* nível que solta um ovo guardado pelo portão de raridade (Sys.loot.DATA.gates; reserva Sys.level.DATA.eggGate). 0 = não sei */
function pGateLevel(r){ const P=pP(); if(P&&typeof P.gateLevel==='function') return P.gateLevel(r)|0;
  try{ const g=window.Sys&&Sys.loot&&Sys.loot.DATA&&Sys.loot.DATA.gates; if(g&&g[r]&&g[r].lvl) return g[r].lvl|0; const e=window.Sys&&Sys.level&&Sys.level.DATA&&Sys.level.DATA.eggGate; if(e&&e[r]&&e[r].level) return e[r].level|0; }catch(e){} return 0; }
const pGateTxt=r=>{ const l=pGateLevel(r); return l>0?'guardado até o nível '+n0(l):'guardado até a raridade liberar'; };
const pChoices=()=>{ const c=pSave().choices; return Array.isArray(c)?c.map((q,i)=>({i,c:q})).filter(q=>q.c&&Array.isArray(q.c.options)&&q.c.options.length):[]; };
const pGated=id=>{ const g=pSave().gated; return Array.isArray(g)?g.filter(q=>q&&(id==null||q.pet===id)).length:0; };
function pEggPending(){ const P=pP(); if(!P||!P.DATA.v20||P.DATA.v20.on!==true||typeof P.firstEgg!=='function') return false; return pSave().first!==true&&!pLocked(); }

/* ---------- DADOS DA TELA (só arte e texto; copiados da tabela de hoje, PT_ART / PT_ORDER do js/p_pets.js) ----------
   Quem aparece: os 11 pets com imagem e folha aprovadas, na ordem do protótipo (por raridade). O sprite de cada um vem do MÓDULO (def.sprite, posto pelo setV17).
   P2_HOW = "como conseguir" dos pets de era (o módulo só traz o texto de fonte dos pets novos, em def.src). P2_EGG20 = também saem do 1º ovo (a % vem do módulo). */
const P2_ORDER=['wolf','owl','shadowwolf','falcon','drake','parrot','panther','golem','underworld','celestial','prism'];
const P2_HOW={wolf:'ovo da Pré-História',owl:'ovo da Antiguidade',drake:'ovo da era Medieval',parrot:'ovo da era da Pólvora',golem:'ovo da era Industrial',underworld:'ovo do Submundo',celestial:'ovo da era Celestial'};
const P2_EGG20={wolf:1,owl:1};
const P2_FILE=['ref','mid','evo'], P2_SUF=['','_mid','_evo'];
const P2_RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade do protótipo V2 */
const P2_SOON='Em breve: este pet ainda não está no jogo.';
/* para onde o botão "Ir" leva, pelo TEXTO da fonte (como a Aparência faz): só telas que existem e estão ligadas */
const P2_ROUTE=[[/Torre/,'tower','Torre'],[/Arena/,'arena','Arena'],[/Inst[âa]ncia/,'inst','Instâncias'],[/Miss[õo]es/,'missions','Missões']];
const P2_STAR='M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z';
const P2_SVG={
  go:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9aa6d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
  lock:'<svg viewBox="0 0 24 24" width="14" height="14" fill="#9aa6d6" aria-hidden="true"><path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h6V7a3 3 0 00-6 0v3z"></path></svg>',
  bowl:'<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M3 12 H21 L19 19 A2 2 0 0 1 17 20.5 H7 A2 2 0 0 1 5 19 Z" fill="#c77a3a" stroke="#5a2d10" stroke-width="1.3"></path><circle cx="8" cy="10.5" r="2.2" fill="#e8b070" stroke="#5a2d10" stroke-width="1"></circle><circle cx="12" cy="9" r="2.4" fill="#d89a5a" stroke="#5a2d10" stroke-width="1"></circle><circle cx="16" cy="10.5" r="2.2" fill="#e8b070" stroke="#5a2d10" stroke-width="1"></circle></svg>' };

(function(){ const st=document.createElement('style'); st.textContent=`
.p2-root{background:linear-gradient(180deg,#123a3c 0%,#0f1f44 26%,#0b1030 46%)!important;color:#eef1ff}
.p2-root,.p2-root *{box-sizing:border-box}
.p2-root button{font-family:Nunito,system-ui,sans-serif;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.p2-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.p2-in{animation:p2k-in .25s ease-out both}
@keyframes p2k-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.p2-stage{position:relative;flex:none;overflow:hidden;background:radial-gradient(110% 70% at 50% 60%,rgba(94,240,160,.18),rgba(94,240,160,0) 62%)}
.p2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:26px;padding:0 10px;border-radius:999px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;white-space:nowrap;max-width:94%;overflow:hidden}
.p2-who>span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.p2-who>i{flex:none;width:7px;height:7px;border-radius:50%;background:#5ef0a0;box-shadow:0 0 8px #5ef0a0}
.p2-who.pv{padding:2px 2px 2px 10px;background:linear-gradient(90deg,rgba(255,210,94,.3),rgba(255,164,52,.22));border-color:#ffd25e;color:#ffd25e}
.p2-who.pv>i{background:#ffd25e;box-shadow:0 0 8px #ffd25e}
.p2-who button{flex:none;min-height:40px;min-width:56px;padding:0 14px;border-radius:999px;border:0;background:#ffd25e;color:#1c1206;font-weight:900;font-size:13px}
.p2-food{position:absolute;z-index:3;right:8px;bottom:6px;display:flex;align-items:center;gap:4px;height:28px;padding:0 9px 0 5px;border-radius:14px;background:rgba(5,8,28,.7);border:1px solid rgba(130,150,255,.28);font-weight:900;font-size:12px;font-variant-numeric:tabular-nums}
.p2-fc{position:relative;flex:none;display:flex;align-items:center;gap:8px;margin:2px 12px 0;padding:4px 10px 4px 12px;border-radius:16px;background:linear-gradient(90deg,rgba(255,210,94,.16),rgba(10,14,44,.85) 60%);border:1px solid rgba(255,210,94,.5);min-width:0}
.p2-fc small{display:block;font-size:9px;letter-spacing:1.2px;color:#ffd25e;font-weight:900}
.p2-fc b.v{display:block;font-size:26px;line-height:1;color:#ffd25e;text-shadow:0 0 14px rgba(255,210,94,.55),0 2px 0 rgba(0,0,0,.4);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p2-chip{flex:none;max-width:52%;display:flex;flex-direction:column;align-items:flex-end;gap:1px;font-size:10px;font-weight:900;color:#9aa6d6;text-align:right;overflow-wrap:anywhere}
.p2-chip b{color:#eef1ff;font-size:12px}
.p2-bt{flex:1 1 0;min-width:0;min-height:40px;padding:0 6px;border-radius:11px;border:0;font-weight:900;font-size:12px;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206!important;box-shadow:0 3px 0 #9a5a10;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;overflow:hidden}
.p2-bt:active{transform:translateY(2px)}
.p2-bt>span,.p2-bt>small{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.p2-bt>small{font-size:10px;font-weight:900;opacity:.9}
.p2-bt.on{background:rgba(94,240,160,.12);color:#5ef0a0!important;box-shadow:none;border:2px solid #5ef0a0}
.p2-bt.off{background:rgba(255,255,255,.06);color:#9aa6d6!important;box-shadow:none;border:1px solid rgba(130,150,255,.28)}
.p2-bt.blue{background:linear-gradient(180deg,#6fd8ff,#2f86e0);color:#04223f!important;box-shadow:0 3px 0 #164e8c}
.p2-bt.grn{background:linear-gradient(180deg,#7dffb8,#22c47a);color:#05301b!important;box-shadow:0 3px 0 #0d6b40}
.p2-bt.red{background:#2a1530;color:#ffb3c4!important;border:2px solid #ff6b9a;box-shadow:none}
.p2-det{position:relative;flex:none;margin:6px 12px 0;padding:8px 10px;border-radius:14px;background:linear-gradient(90deg,#1b2459,#141c4a);border:1px solid var(--rc);min-width:0}
.p2-dt{display:flex;gap:9px;align-items:center;min-width:0}
.p2-th{flex:none;width:46px;height:40px;border-radius:11px;border:2px solid var(--rc);background:#0c1238;overflow:hidden;display:flex;align-items:flex-end;justify-content:center}
.p2-th img{width:100%;height:100%;object-fit:contain;display:block}
.p2-di{flex:1;min-width:0}
.p2-tag{display:inline-block;font-size:9px;font-weight:900;letter-spacing:1px;padding:1px 6px;border-radius:6px;background:#ffd25e;color:#1c1206;vertical-align:2px;margin-right:4px}
.p2-tag.eq{background:#5ef0a0;color:#043018}
.p2-tag.sn{background:#9aa6d6;color:#0b1030}
.p2-dn{font-weight:900;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p2-rar{font-size:9px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:var(--rc)}
.p2-dh{font-size:11px;color:#9aa6d6;font-weight:800;overflow-wrap:anywhere;line-height:1.25}
.p2-stars{flex:none;display:flex;gap:1px}
.p2-lvb{margin-top:6px;position:relative;height:20px;border-radius:10px;background:rgba(5,8,28,.6);border:1px solid rgba(130,150,255,.28);overflow:hidden}
.p2-lvb>i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#22c47a,#7dffb8);border-radius:10px;transition:width .25s}
.p2-lvb>i.cap{background:linear-gradient(90deg,#f4a52a,#ffe58a)}
.p2-lvb>span{position:relative;display:flex;justify-content:space-between;gap:6px;padding:0 9px;line-height:18px;font-size:11px;font-weight:900;white-space:nowrap;text-shadow:0 1px 2px #000}
.p2-lvb em{font-style:normal;overflow:hidden;text-overflow:ellipsis;min-width:0}
.p2-cmp{display:flex;align-items:center;flex-wrap:wrap;gap:2px 6px;margin-top:6px;padding:5px 8px;border-radius:10px;background:rgba(5,8,28,.55);font-weight:900;font-size:12px;min-width:0}
.p2-cmp small{flex:1 1 100%;font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#9aa6d6;min-width:0;overflow-wrap:anywhere}
.p2-cmp .a{color:#9aa6d6;font-variant-numeric:tabular-nums;white-space:nowrap}
.p2-cmp .b{font-size:17px;color:#ffd25e;font-variant-numeric:tabular-nums;white-space:nowrap}
.p2-cmp .d{margin-left:auto;font-variant-numeric:tabular-nums;white-space:nowrap}
.p2-up{color:#5ef0a0}.p2-dn2{color:#ff6b6b}.p2-eq0{color:#9aa6d6}
.p2-acts{display:flex;gap:6px;margin-top:7px;min-width:0}
.p2-src{margin:6px 0 0;font-size:11px;font-weight:800;color:#9aa6d6;line-height:1.4;overflow-wrap:anywhere}
.p2-src b{color:#ffd25e}
.p2-body{position:relative;flex:1;min-height:0;padding:8px 12px 20px}
.p2-body .p2-det{margin:0 0 8px}
.p2-pan{border-radius:16px;background:rgba(24,33,86,.78);border:1px solid rgba(130,150,255,.28);padding:10px;margin-bottom:8px;min-width:0}
.p2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9aa6d6;font-weight:900;margin:0 0 7px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.p2-sec>span{min-width:0;overflow-wrap:anywhere}
.p2-sec>span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.p2-sec b{color:#eef1ff}
.p2-hint{font-size:11px;color:#9aa6d6;margin:7px 0 0;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.p2-hint b{color:#ffd25e}
.p2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.p2-cell{position:relative;min-width:0;min-height:44px;border-radius:12px;border:2px solid var(--rc);background:radial-gradient(circle at 50% 35%,#1f2a70,#0c1238 78%);padding:0 0 4px;display:flex;flex-direction:column;align-items:stretch;overflow:hidden}
.p2-cell.sel{outline:3px solid #ffd25e;outline-offset:1px}
.p2-pi{width:100%;aspect-ratio:1/.8;display:block;object-fit:contain}
.p2-cell.lk .p2-pi{filter:grayscale(1) brightness(.55)}
.p2-cn{font-size:10px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px;line-height:13px}
.p2-cs{font-size:9px;font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 3px;line-height:12px;color:#9aa6d6}
.p2-cs.r{color:var(--rc)}
.p2-bdg{position:absolute;left:3px;top:3px;font-size:7px;font-weight:900;padding:1px 4px;border-radius:4px;letter-spacing:.3px;line-height:10px;background:#5ef0a0;color:#043018}
.p2-bdg.ev{left:auto;right:3px;background:#ffd25e;color:#1c1206}
.p2-lki{position:absolute;right:4px;top:4px;width:14px;height:14px}
.p2-ss{display:flex;justify-content:center;line-height:10px}
.p2-stg3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.p2-sc{min-width:0;min-height:44px;border-radius:12px;border:1px solid rgba(160,180,255,.5);background:rgba(5,8,28,.5);padding:0 0 4px;display:flex;flex-direction:column;overflow:hidden}
.p2-sc[aria-pressed="true"]{border:2px solid #ffd25e}
.p2-sc .p2-pi{aspect-ratio:1/.7}
.p2-sc.no .p2-pi{filter:grayscale(.9) brightness(.6)}
.p2-sc b{font-size:11px;font-weight:900;text-align:center}
.p2-sc small{font-size:9px;font-weight:900;text-align:center;color:#9aa6d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 2px}
.p2-sc small.up{color:#5ef0a0}
.p2-kv{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:800;padding:4px 0;border-top:1px solid rgba(130,150,255,.15);min-width:0}
.p2-kv.f{border-top:0}
.p2-kv>span:first-child{color:#9aa6d6;flex:none;max-width:42%;overflow-wrap:anywhere}
.p2-kv>span:last-child{text-align:right;min-width:0;overflow-wrap:anywhere}
.p2-odd{display:flex;align-items:center;gap:8px;min-height:22px;font-size:12px;font-weight:900;min-width:0}
.p2-odd .n{flex:0 1 44%;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p2-odd .bar{flex:1;min-width:0;height:8px;border-radius:4px;background:rgba(255,255,255,.07);overflow:hidden}
.p2-odd .bar>span{display:block;height:100%;background:var(--rc);border-radius:4px}
.p2-odd .pc{flex:none;min-width:44px;text-align:right;font-variant-numeric:tabular-nums}
.p2-rowb{display:flex;gap:6px;margin-top:8px;min-width:0}
.p2-flash{position:absolute;inset:0;z-index:4;pointer-events:none;animation:p2k-flash .9s ease-out both}
@keyframes p2k-flash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.p2-mbn{position:absolute;left:0;right:0;top:34%;z-index:5;text-align:center;pointer-events:none;font-size:32px;letter-spacing:2px;text-shadow:0 0 22px currentColor,0 3px 0 rgba(0,0,0,.55);animation:p2k-mbn 1.6s ease-out both}
@keyframes p2k-mbn{0%{opacity:0;transform:scale(.4)}18%{opacity:1;transform:scale(1.15)}30%{transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:translateY(-20px)}}
.p2-toast{position:absolute;left:50%;top:50px;z-index:6;transform:translateX(-50%);padding:7px 14px;border-radius:13px;background:rgba(5,8,28,.92);border:1px solid rgba(160,180,255,.5);font-weight:900;font-size:12px;text-align:center;line-height:1.25;max-width:92%;overflow-wrap:anywhere;pointer-events:none;animation:p2k-toast 2.2s ease-out both}
@keyframes p2k-toast{0%{opacity:0}8%,85%{opacity:1}100%{opacity:0}}
.p2-fly{position:absolute;z-index:6;left:50%;bottom:8px;transform:translateX(-50%);font-size:24px;pointer-events:none;white-space:nowrap;text-shadow:0 2px 0 rgba(0,0,0,.5);animation:p2k-fly 1.6s ease-out both}
@keyframes p2k-fly{0%{opacity:0;transform:translate(-50%,10px) scale(.8)}15%{opacity:1;transform:translate(-50%,0) scale(1.1)}100%{opacity:0;transform:translate(-50%,-50px)}}
@media (prefers-reduced-motion:reduce){.p2-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const XP={pv:null,   /* prévia: {id, stg, soon}. soon = o módulo não libera: só a faixa "Em breve", sem pet no herói */
  undo:null,last:null,fx:null,fly:null,toast:'',toastT:0,until:0,confirm:false,err:0,anim:true};
const pNow=()=>Date.now();
const pClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const pChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); }catch(e){} };
const pStore=()=>{ try{ if(typeof save==='function') save(); }catch(e){} };
const pRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
function pToast(msg){ XP.toast=String(msg||''); XP.toastT=pNow(); XP.until=Math.max(XP.until,XP.toastT+2300); }
const pDef=id=>{ const P=pP(); return (P&&P.DATA.pets.find(d=>d.id===id))||null; };
/* lista da tela: os pets da ordem do protótipo que o módulo conhece e que têm sprite (posto pelo setV17) */
function pList(){ const out=[]; for(const id of P2_ORDER){ const d=pDef(id); if(d&&d.sprite&&!d.removed) out.push(d); } return out; }
const pAvail=def=>!!pCall('avail',[def,pHost()],false);
/* "em breve" = não é do jogador E o MÓDULO diz que o pet ainda não existe */
const pSoon=(def,o)=>!o.owned[def.id]&&!pAvail(def);
const pStgOf=id=>pClamp((pCall('stage',[S,id],{}).index)|0,0,2);
const pImg=(def,stg)=>'assets/pets/'+def.sprite+'_'+P2_FILE[pClamp(stg|0,0,2)]+'.png';
let p2Tbl=null;
function pFly(def){ try{ if(!p2Tbl) p2Tbl=pCall('battleTable',[],{}); const b=p2Tbl[def.sprite]; return b&&b.fly>0?b.fly:0; }catch(e){ return 0; } }
const pRc=def=>P2_RC[pClamp(def.r|0,0,5)];
const pHeroN=()=>{ try{ return S.hero==='kaia'?'Kaia':'Kael'; }catch(e){ return 'Kael'; } };
const pLvl=()=>{ try{ return Sys.level.level(S)|0; }catch(e){ return 0; } };
/* FC (poder): o número do jogo (heroFC do index = Sys.fc.compute) e o texto na escala da tela (fcTxt do js/screens.js) */
function pFc(){ try{ if(typeof heroFC==='function') return +heroFC()||0; const F=window.Sys&&Sys.fc; return F&&F.compute?(+F.compute(S,pHost())||0):0; }catch(e){ return 0; } }
const pFcT=v=>{ try{ if(typeof fcTxt==='function') return fcTxt(v); }catch(e){} return n0(v); };
/* FC "se": a conta é a do Sys.fc, com o pet do jogador num nível/estágio de teste SÓ durante a conta (mesmo jeito do Sys.pet.fcShare e do advice do módulo,
   que trocam o equipado/o nível e devolvem). Só para pet que o jogador TEM: pôr um pet que ele não tem no save, mesmo por um instante, apagaria os fragmentos
   guardados e marcaria o 1º ovo como usado (Sys.pet.ensure). Por isso a prévia de pet que ele não tem mostra só o teto que o módulo informa. */
function pFcIf(id,patch){ const F=window.Sys&&Sys.fc; if(!F||typeof F.compute!=='function') return 0; const o=pSave(), x=o.owned[id]; if(!x) return 0;
  const eq0=o.eq, l0=x.lvl, hadS=('stg' in x), s0=x.stg; let v=0;
  try{ if(patch.lvl!=null) x.lvl=patch.lvl; if(patch.stg!=null) x.stg=patch.stg; o.eq=id; v=+F.compute(S,pHost())||0; }catch(e){ v=0; }
  finally{ x.lvl=l0; if(hadS) x.stg=s0; else delete x.stg; pSave().eq=eq0; }
  return v; }
/* fontes de um pet: texto do módulo (def.src) nos novos; tabela de hoje nos de era; Prismático pelas fontes do módulo (DATA.v4d.prism) */
function pSources(def){ const P=pP(), D=P.DATA; if(Array.isArray(def.src)&&def.src.length) return def.src.slice();
  if(def.noEgg&&def.hatchFrags){ const pr=(D.v4d&&D.v4d.prism)||{}, ar=window.Sys&&Sys.arena&&Sys.arena.DATA&&Sys.arena.DATA.rewards, s=[];
    if(pr.boss) s.push('Chefe da era '+pr.boss.minEra+': '+n0(pr.boss.perDay)+' fragmento por dia'); if(pr.vipMax) s.push('VIP '+pr.vipMax.level+': '+n0(pr.vipMax.frags)+' fragmentos, uma vez');
    if(pr.tower) s.push('Torre: '+n0(pr.tower.frags)+' fragmentos a cada '+n0(pr.tower.every)+' andares, a partir do '+n0(pr.tower.from)); if(pr.event) s.push('Eventos mensais: até '+n0(pr.event)+' fragmentos');
    if(ar&&ar[0]&&ar[0].prism) s.push('Arena, 1º lugar: '+n0(ar[0].prism)+' fragmentos'); return s; }
  const s=[]; if(P2_EGG20[def.id]&&D.v20&&D.v20.on===true){ const od=pCall('firstEggOdds',[],[]).find(q=>q.r===def.r); if(od) s.push('ovo do nível '+n0(D.v20.unlockLevel)+' ('+p1(od.pct)+')'); }
  if(P2_HOW[def.id]) s.push(P2_HOW[def.id]);
  const tw=D.v17.tower100; if(Array.isArray(tw)&&tw.indexOf(def.id)>=0) s.push('Torre, andar 100: ovo '+pRN(def.r)+' à escolha ('+tw.map(q=>{ const d=pDef(q); return d?d.name:''; }).filter(Boolean).join(' ou ')+')');
  return s; }
function pRoute(def){ try{ if(!window.Panels||typeof Panels.on!=='function') return null; for(const t of pSources(def)) for(const r of P2_ROUTE) if(r[0].test(t)&&Panels.on(r[1])) return {to:r[1],label:r[2]}; }catch(e){} return null; }
const pStars=(k,max,sz)=>{ let h=''; for(let i=1;i<=max;i++) h+=`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P2_STAR}" fill="${i<=k?'#ffd25e':'rgba(255,255,255,.12)'}" stroke="${i<=k?'#9a5a10':'rgba(160,180,255,.4)'}" stroke-width="1.4" stroke-linejoin="round"></path></svg>`; return h; };
const pX=v=>String(v).replace('.',',');
function pCmp(label,a,b){ const df=b-a, cls=Math.abs(df)<1?'p2-eq0':df>0?'p2-up':'p2-dn2', tx=Math.abs(df)<1?'igual':(df>0?'+':'−')+pFcT(Math.abs(df));
  return `<div class="p2-cmp"><small>${esc2(label)}</small><span class="a">${esc2(pFcT(a))}</span>${P2_SVG.go}<span class="b p2-lil">${esc2(pFcT(b))}</span><span class="d ${cls}">${esc2(tx)}</span></div>`; }
const pKv=(a,b,first)=>`<div class="p2-kv${first?' f':''}"><span>${esc2(a)}</span><span>${b}</span></div>`;

/* ---------- PALCO: canvas com a rota única do jogo. O pet é o ÚLTIMO desenho do drawHeroFull (na frente do herói) ---------- */
/* qual pet e qual estágio vão para o herói: a prévia ou o pet ativo; na evolução o estágio troca no meio do clarão (0,7 s) */
function pShown(){ const o=pSave();
  if(XP.pv&&!XP.pv.soon){ const d=pDef(XP.pv.id); if(d&&d.sprite) return {def:d,stg:pClamp(XP.pv.stg|0,0,2),fx:null}; }
  const d=o.eq&&o.owned[o.eq]?pDef(o.eq):null; if(!d||!d.sprite) return null;
  const f=XP.fx&&XP.fx.id===o.eq?XP.fx:null, age=f?(pNow()-f.t)/1000:9;
  return {def:d,stg:f&&age<0.7?f.from:pStgOf(o.eq),fx:f&&age<1.6?age:null}; }
function pState(t){ const sp=pShown(), look={pet:sp?{base:sp.def.sprite+P2_SUF[sp.stg],stage:sp.stg+1,fly:pFly(sp.def)}:null};
  const K=window.StageKit; if(K&&typeof K.toState==='function') return K.toState(look,{t});
  return {t,pet:look.pet||false}; }
const pCanDraw=()=>{ try{ return !XP.err&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
const pMounted=()=>{ try{ return typeof heroLook==='function'&&!!heroLook().mount; }catch(e){ return false; } };
function pHexA(h,a){ const v=parseInt(String(h).slice(1),16); return 'rgba('+(v>>16&255)+','+(v>>8&255)+','+(v&255)+','+pClamp(a,0,1).toFixed(3)+')'; }
let p2Raf=0, p2T0=0;
function pDraw(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!p2T0) p2T0=ts; const t=Math.max(0,(ts-p2T0)/1000), x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height);
  const mounted=pMounted(), k=c.height*(mounted?0.5:0.6)/HS, fx=c.width*(mounted?0.32:0.4), fy=c.height*0.9;
  /* chão: brilho e anel tracejado sob o herói e o pet (na evolução, na cor da raridade) */
  try{ const sp=pShown(), ga=sp&&sp.fx!=null?Math.max(0,1-sp.fx/1.6):0, col=sp?pRc(sp.def):'#5ee7ff', gx=fx+c.width*0.06, rx=c.width*0.34, ry=c.height*0.085;
    const g=x.createRadialGradient(gx,fy,4,gx,fy,rx); g.addColorStop(0,ga?pHexA(col,0.35+0.45*ga):'rgba(94,231,255,.32)'); g.addColorStop(1,'rgba(94,231,255,0)');
    x.fillStyle=g; x.beginPath(); x.ellipse(gx,fy,rx,ry,0,0,7); x.fill();
    x.strokeStyle=ga?pHexA(col,0.6+0.4*ga):'rgba(255,210,94,.5)'; x.setLineDash([5*dpr,6*dpr]); x.lineDashOffset=-t*(10+60*ga)*dpr; x.lineWidth=(1.5+2*ga)*dpr;
    x.beginPath(); x.ellipse(gx,fy,rx*0.83,ry*0.72,0,0,7); x.stroke(); x.setLineDash([]); }catch(e){}
  window.drawHeroFull(x,fx,fy,k,pState(t)); }
function pLoop(ts){ p2Raf=0; const c=typeof document!=='undefined'?document.getElementById('p2_cv'):null; if(!c||typeof view==='undefined'||view!==P2){ p2T0=0; return; }
  try{ pDraw(c,ts); }catch(e){ XP.err=1; pRedraw(); return; }   /* o desenho do jogo falhou: a tela troca para a imagem parada do pet (o pet nunca some) */
  p2Raf=requestAnimationFrame(pLoop); }
function pStart(){ try{ if(!p2Raf&&pCanDraw()&&document.getElementById('p2_cv')) p2Raf=requestAnimationFrame(pLoop); }catch(e){} }
function pStop(){ try{ if(p2Raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(p2Raf); }catch(e){} p2Raf=0; p2T0=0; }

/* ---------- desenho ---------- */
const P2_MINH=240;
function pEmpty(d,html){ V.innerHTML=xWrap(d,'p2-root '+(XP.anim?'p2-in':''),`<div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center">${html}</div>`); XP.anim=false; }
function pRender(){
  const d=xDims(P2_MINH)||{}, H=d.H>0?d.H:704, W=d.Wb>0?d.Wb:390;
  if(!pReady()){ pEmpty(d,`<img src="assets/pets/pet_egg.png" alt="" style="width:120px;height:120px;object-fit:contain;opacity:.85"><span class="p2-lil" style="font-size:24px">Pets: em breve</span>`); return; }
  const P=pP(), D=P.DATA, o=pSave(), host=pHost();
  if(pHidden()){ const n=Object.keys(o.owned).length;
    pEmpty(d,`<span class="p2-lil" style="font-size:26px">Pets</span><span style="padding:6px 14px;border-radius:999px;border:2px solid #ffd25e;color:#ffd25e;font-size:15px;font-weight:900">Libera no nível ${n0(pHiddenLv())}</span>
      <span style="font-size:13px;font-weight:800;color:#9aa6d6">Você está no nível ${n0(pLvl())}. Continue lutando para liberar.</span>${n?`<span style="font-size:12px;font-weight:800;color:#9aa6d6">${n0(n)} ${n===1?'pet esperando':'pets esperando'}</span>`:''}
      <button class="p2-bt" data-x="back" style="flex:none;margin-top:6px;min-height:48px;padding:0 28px;font-size:16px">Voltar</button>`); return; }
  const list=pList();
  if(!list.length){ pEmpty(d,'<span class="p2-lil" style="font-size:24px">Pets: em breve</span>'); return; }
  const SN=D.v3d.stages.map(s=>s.name), REQ=D.v17.stageReq, MAXS=D.maxStars, SM=D.v17.stageMult, smOn=!!(SM&&SM.on===true);
  /* a prévia só vale para pet da lista; de pet do jogador, só do ATIVO (ver outro estágio); "em breve" não tem prévia no herói */
  if(XP.pv){ const pd=list.find(p=>p.id===XP.pv.id); if(!pd||(o.owned[XP.pv.id]&&XP.pv.id!==o.eq)) XP.pv=null; else XP.pv.soon=pSoon(pd,o); }
  const pv=XP.pv, now=pNow(), fcNow=pFc();
  const nOwn=list.filter(p=>o.owned[p.id]).length, nReady=list.filter(p=>o.owned[p.id]&&pCall('canEvolve',[S,p.id],{}).ok===true).length;
  const eqDef=o.eq&&o.owned[o.eq]?list.find(p=>p.id===o.eq)||null:null;
  const sp=pShown(), canDraw=pCanDraw();
  const sc0=XP.anim?null:document.getElementById('p2_scroll'), y0=sc0?(+sc0.scrollTop||0):0;

  /* ----- PALCO ----- */
  const stH=Math.round(pClamp(H*0.27,150,236));
  const alt=pHeroN()+' com a arma na mão'+(sp?' e '+sp.def.name+' ('+SN[sp.stg]+') na frente':'');
  const who=pv&&!pv.soon?(()=>{ const pd=pDef(pv.id); return `<div class="p2-who pv"><i></i><span>Prévia: ${esc2(pd.name)}${o.owned[pd.id]?' '+esc2(SN[pClamp(pv.stg|0,0,2)]):''}</span><button data-x="sair" aria-label="Sair da prévia">Sair</button></div>`; })()
    :`<div class="p2-who"><i></i><span>${esc2(pHeroN())}${pLvl()>0?' · Nível '+n0(pLvl()):''}${eqDef?' · '+esc2(eqDef.name)+' '+esc2(SN[pStgOf(eqDef.id)]):''}</span></div>`;
  const fxAge=XP.fx?now-XP.fx.t:1e9, flyAge=XP.fly?now-XP.fly.t:1e9, tAge=XP.toast?now-XP.toastT:1e9;
  const stage=`<div class="p2-stage" style="height:${stH}px">
      ${canDraw?`<canvas id="p2_cv" role="img" aria-label="${esc2(alt)}" style="position:absolute;inset:0;width:100%;height:100%"></canvas>`
        :sp?`<img src="${pImg(sp.def,sp.stg)}" alt="${esc2(sp.def.name+', '+SN[sp.stg])}" style="position:absolute;left:50%;bottom:8%;height:74%;transform:translateX(-50%);object-fit:contain">`:''}
      ${who}
      <span class="p2-food" role="img" aria-label="Ração: ${n0(o.food)}">${P2_SVG.bowl}<span id="p2_food">${esc2(gNum(o.food))}</span></span>
      ${XP.fx&&fxAge<950?`<span class="p2-flash" aria-hidden="true" style="background:radial-gradient(circle at 46% 72%,rgba(255,250,225,.9),${pHexA(XP.fx.c,0.45)} 30%,transparent 62%);animation-delay:-${fxAge|0}ms"></span>`:''}
      ${XP.fx&&fxAge>=500&&fxAge<2100?`<span class="p2-mbn p2-lil" role="status" style="color:${XP.fx.c};animation-delay:-${(fxAge-500)|0}ms">${esc2(String(XP.fx.txt).toUpperCase())}!</span>`:''}
      ${XP.fly&&flyAge<1600?`<span class="p2-fly p2-lil ${XP.fly.d>0?'p2-up':'p2-dn2'}" aria-hidden="true" style="animation-delay:-${flyAge|0}ms">${XP.fly.d>0?'+':'−'}${esc2(pFcT(Math.abs(XP.fly.d)))} de poder</span>`:''}
      ${XP.toast&&tAge<2200?`<span class="p2-toast" role="status" style="animation-delay:-${tAge|0}ms">${esc2(XP.toast)}</span>`:''}
    </div>`;

  /* ----- PODER (FC) ----- */
  const shEq=eqDef?pCall('fcShare',[S,host,eqDef.id],{now:0,max:0}):{now:0,max:0};
  const fcrow=`<div class="p2-fc"><div style="flex:1;min-width:0"><small>PODER (FC)</small><b class="v p2-lil">${esc2(pFcT(fcNow))}</b></div>
      <div class="p2-chip"><span>Pets <b>${n0(nOwn)}/${n0(list.length)}</b></span><span>${nReady?`<span class="p2-up">${n0(nReady)} ${nReady>1?'prontos':'pronto'} para evoluir</span>`:'Parte do pet: '+p1(shEq.now)}</span></div></div>`;

  /* ----- FAIXA DO PET (no lugar de janela por cima do herói) ----- */
  const detId=pv?pv.id:(eqDef?eqDef.id:null), detDef=detId?list.find(p=>p.id===detId):null;
  let det='';
  if(!detDef){
    det=`<div class="p2-det" style="--rc:rgba(130,150,255,.5)"><p class="p2-src" style="margin:0">${nOwn?'Nenhum pet ativo. Toque num pet seu para ele lutar na frente do herói.':'Você ainda não tem pet. Toque num pet da lista para ver como ele fica no herói e como conseguir.'}</p></div>`; }
  else if(pv&&pv.soon){
    det=`<div class="p2-det" style="--rc:${pRc(detDef)}"><div class="p2-dt"><span class="p2-th"><img src="${pImg(detDef,0)}" alt="" style="filter:grayscale(1) brightness(.55)"></span>
        <div class="p2-di"><div class="p2-dn"><span class="p2-tag sn">EM BREVE</span>${esc2(detDef.name)} <span class="p2-rar">${esc2(pRN(detDef.r))}</span></div><div class="p2-dh">${esc2(P2_SOON)}</div></div></div>
      <div class="p2-acts"><button class="p2-bt off" data-x="sair">Fechar</button></div></div>`; }
  else if(!o.owned[detId]){   /* PRÉVIA de pet que o jogador não tem */
    const st=pClamp(pv.stg|0,0,2), sh=pCall('fcShare',[S,host,detId],{now:0,max:0}), src=pSources(detDef), sv=o.stored[detId]|0, ng=pGated(detId), rt=pRoute(detDef);
    const how=[]; if(detDef.hatchFrags) how.push('<b>'+n0(sv)+'/'+n0(detDef.hatchFrags)+'</b> fragmentos (nasce sozinho ao completar)'); for(const s of src) how.push(esc2(s));
    if(ng) how.push('<b>ovo '+esc2(pGateTxt(detDef.r))+'</b>');
    det=`<div class="p2-det" style="--rc:${pRc(detDef)}"><div class="p2-dt"><span class="p2-th"><img src="${pImg(detDef,st)}" alt=""></span>
        <div class="p2-di"><div class="p2-dn"><span class="p2-tag">PRÉVIA</span>${esc2(detDef.name)} <span class="p2-rar">${esc2(pRN(detDef.r))}</span></div>
          <div class="p2-dh">${esc2(SN[st])} · você ainda não tem${sh.max>0?' · até '+p1(sh.max)+' do poder no topo':''}</div></div></div>
      ${how.length?`<p class="p2-src">Como conseguir: ${how.join(' · ')}.</p>`:''}
      <div class="p2-acts"><button class="p2-bt off" data-x="sair">Sair</button>${rt?`<button class="p2-bt blue" data-x="go" data-to="${esc2(rt.to)}">Ir: ${esc2(rt.label)}</button>`:''}</div></div>`; }
  else {   /* pet ATIVO (ou a prévia de outro estágio dele) */
    const id=detId, x=o.owned[id], stg=pStgOf(id), sg=pCall('stage',[S,id],{}), lv=P.levelOf(S,id), cf=P.canFeed(S,host,id), ce=P.canEvolve(S,id), need=P.foodCost(lv), fxb=x.fx|0;
    const sc=P.starCostOf(detDef), sn=x.stars<MAXS?(sc[x.stars-1]|0):0, sh=pCall('fcShare',[S,host,id],{now:0,max:0}), cap=Math.min(sg.cap||D.v17.stageCap[stg],P.lvlCap(host));
    const capped=cf.reason==='max'||cf.reason==='cap'||cf.reason==='evolve', right=cf.reason==='max'?'máximo':cf.reason==='evolve'?'evolua para subir':cf.reason==='cap'?'teto da era':n0(fxb)+'/'+n0(need)+' de ração';
    const evoFc=ce.ok&&fcNow>0?pFcIf(id,{stg:stg+1}):0, gEv=evoFc>0?evoFc-fcNow:0;
    let cmp='';
    if(fcNow>0){
      if(pv){ const st=pClamp(pv.stg|0,0,2), l2=Math.max(lv,REQ[st]); cmp=pCmp('Prévia: '+SN[st]+' no Nv '+n0(l2),fcNow,pFcIf(id,{lvl:l2,stg:st})||fcNow); }
      else if(XP.last&&XP.last.id===id) cmp=pCmp('Poder antes e depois · '+XP.last.what,XP.last.a,XP.last.b);
      else if(ce.ok) cmp=pCmp('Evoluir para '+SN[stg+1],fcNow,evoFc||fcNow);
      else if(cf.ok||cf.reason==='food') cmp=pCmp('Nv '+n0(lv)+' para Nv '+n0(lv+1),fcNow,pFcIf(id,{lvl:lv+1})||fcNow);
      else cmp=pCmp('Poder agora',fcNow,fcNow); }
    const feedSm=cf.reason==='max'?'nível máximo':cf.reason==='cap'?'teto da era':cf.reason==='evolve'?'evolua primeiro':cf.reason==='locked'?'bloqueado':o.food>0?'até '+n0(D.v17.tapFood)+' de ração':'sem ração';
    const feedOff=capped||cf.reason==='locked'||o.food<=0;
    const feedB=`<button class="p2-bt${feedOff?' off':''}" data-x="feed" aria-disabled="${feedOff}"><span>Alimentar</span><small>${esc2(feedSm)}</small></button>`;
    const evB=stg>=2?`<span class="p2-bt on"><span>Evoluído</span><small>forma final</small></span>`
      :ce.ok?`<button class="p2-bt grn" data-x="evo"><span>Evoluir</span><small>${esc2(SN[stg+1])}${gEv>=1?' · +'+esc2(pFcT(gEv))+' de poder':''}</small></button>`
      :`<button class="p2-bt off" data-x="evo" aria-disabled="true"><span>Evoluir</span><small>no Nv ${n0(ce.need||REQ[stg+1])}</small></button>`;
    const ud=XP.undo&&o.owned[XP.undo]?pDef(XP.undo):null;
    const eqB=ud?`<button class="p2-bt off" data-x="undo"><span>Desfazer</span><small>volta ${esc2(ud.name)}</small></button>`:`<span class="p2-bt on"><span>Usando</span><small>pet ativo</small></span>`;
    det=`<div class="p2-det" style="--rc:${pRc(detDef)}"><div class="p2-dt"><span class="p2-th"><img src="${pImg(detDef,stg)}" alt=""></span>
        <div class="p2-di"><div class="p2-dn"><span class="p2-tag eq">ATIVO</span>${esc2(detDef.name)} <span class="p2-rar">${esc2(pRN(detDef.r))}</span></div>
          <div class="p2-dh">${esc2(SN[stg])} · ${sn?n0(x.frags|0)+'/'+n0(sn)+' fragmentos':n0(MAXS)+' estrelas: máximo'} · parte no poder ${p1(sh.now)}</div></div>
        <span class="p2-stars" role="img" aria-label="${n0(x.stars)} de ${n0(MAXS)} estrelas">${pStars(x.stars,MAXS,13)}</span></div>
      <div class="p2-lvb" role="img" aria-label="Nível ${n0(lv)} de ${n0(cap)}"><i class="${capped?'cap':''}" style="width:${capped?'100':Math.min(100,fxb/Math.max(1,need)*100).toFixed(1)}%"></i><span><b>Nv ${n0(lv)}/${n0(cap)}</b><em>${esc2(right)}</em></span></div>
      ${cmp}<div class="p2-acts">${feedB}${evB}${eqB}</div></div>`; }

  /* ----- GRADE DE PETS ----- */
  const cell=p=>{ const x=o.owned[p.id], sel=detId===p.id, eq=o.eq===p.id, rn=pRN(p.r);
    if(x){ const st=pStgOf(p.id), lv=P.levelOf(S,p.id), ev=pCall('canEvolve',[S,p.id],{}).ok===true;
      return `<button class="p2-cell${sel?' sel':''}" style="--rc:${pRc(p)}" data-x="pet" data-id="${esc2(p.id)}" aria-label="${esc2(p.name+', '+rn+', '+SN[st]+' nível '+lv+(eq?', ativo':''))}">
        <img class="p2-pi" src="${pImg(p,st)}" alt="">${eq?'<span class="p2-bdg">ATIVO</span>':''}${ev?'<span class="p2-bdg ev">EVOLUIR</span>':''}
        <span class="p2-cn">${esc2(p.name)}</span><span class="p2-cs r">Nv ${n0(lv)} · ${esc2(SN[st])}</span><span class="p2-ss">${pStars(x.stars,MAXS,9)}</span></button>`; }
    const sn=pSoon(p,o), sv=o.stored[p.id]|0, third=sn?'em breve':p.hatchFrags?n0(sv)+'/'+n0(p.hatchFrags)+' frag.':pGated(p.id)?'guardado':'toque para ver';
    return `<button class="p2-cell lk${sel?' sel':''}" style="--rc:${pRc(p)}" data-x="pet" data-id="${esc2(p.id)}" aria-label="${esc2(p.name+', '+rn+(sn?', em breve':', você não tem. Tocar para ver no herói'))}">
      <img class="p2-pi" src="${pImg(p,0)}" alt=""><span class="p2-lki">${P2_SVG.lock}</span>
      <span class="p2-cn">${esc2(p.name)}</span><span class="p2-cs r">${esc2(rn)}</span><span class="p2-cs">${esc2(third)}</span></button>`; };
  const nLater=D.pets.filter(p=>!p.removed&&P2_ORDER.indexOf(p.id)<0).length;
  const grid=`<div class="p2-pan"><div class="p2-sec"><span>Pets</span><span><b>${n0(nOwn)}/${n0(list.length)}</b> · toque para usar ou ver</span></div><div class="p2-grid">${list.map(cell).join('')}</div>
      <p class="p2-hint">Ração: vem dos baús e de <b>${n0(D.offlineFoodPer8h)} a cada 8 h</b> fora do jogo.${nLater?' Mais '+n0(nLater)+' pets entram quando a arte deles for aprovada.':''}</p></div>`;

  /* ----- SOBRE O PET: estágios, golpe, estrelas ----- */
  let about='';
  const abDef=pv&&!pv.soon?detDef:eqDef;
  if(abDef){ const id=abDef.id, x=o.owned[id]||null, stg=x?pStgOf(id):0, cur=pv&&!pv.soon?pClamp(pv.stg|0,0,2):stg, lv=x?P.levelOf(S,id):1, stars=x?x.stars:1;
    const ce=x?P.canEvolve(S,id):{ok:false};
    const cards=SN.map((nm,i)=>{ const reached=!!x&&i<=stg, rdy=!!x&&i===stg+1&&ce.ok===true;
      const st=reached?(i===stg?'atual':'feito'):rdy?'pronto!':i?'Nv '+n0(REQ[i]):'ao chocar';
      return `<button class="p2-sc${reached?'':' no'}" data-x="stg" data-i="${i}" aria-pressed="${cur===i}" aria-label="${esc2(nm)}: ver no herói"><img class="p2-pi" src="${pImg(abDef,i)}" alt=""><b>${esc2(nm)}</b><small class="${rdy?'up':''}">${esc2(st)}${smOn?' · ×'+pX(SM.m[i]):''}</small></button>`; }).join('');
    const od=P.attackOdds(stars,lv,id), A=D.v3d.attacks, sh=pCall('fcShare',[S,host,id],{now:0,max:0});
    const orow=(k,v,c,scale)=>`<div class="p2-odd" style="--rc:${c}"><span class="n">${esc2(A[k].name)} ×${pX(A[k].dmg)}</span><span class="bar"><span style="width:${Math.min(100,v/scale*100).toFixed(1)}%"></span></span><span class="pc">${p1(v*100)}</span></div>`;
    const bond=x&&o.eq===id?(pCall('bonus',[S],{}).petBond||0):0;
    const sc=P.starCostOf(abDef), sn=x&&x.stars<MAXS?(sc[x.stars-1]|0):0, src=pSources(abDef), cr=x?P.canResetLevel(S,id):{ok:false,refund:0};
    const rf=D.instanceRepeatFood[pClamp(abDef.r|0,0,D.instanceRepeatFood.length-1)];
    about=`<div class="p2-pan"><div class="p2-sec"><span>Estágios · ${esc2(abDef.name)}</span><span>toque para ver no herói</span></div><div class="p2-stg3">${cards}</div>
        <p class="p2-hint">Evoluir é manual e sem custo${smOn?': o poder do pet vale <b>×'+SM.m.map(pX).join('</b>, <b>×')+'</b> por estágio (evoluir dá poder na hora).':'; cada estágio libera mais níveis.'}</p></div>
      <div class="p2-pan"><div class="p2-sec"><span>Golpe</span><span>${x?'nível '+n0(lv)+', '+n0(stars)+(stars===1?' estrela':' estrelas'):'com 1 estrela no Nv 1'}</span></div>
        ${pKv('Ataque','sozinho, a cada '+pX(D.battle.interval)+' s, no inimigo da frente',true)}
        ${abDef.skill&&abDef.skill.note?pKv('Jeito',esc2(abDef.skill.note)):''}
        ${bond>0?pKv('Vínculo','+'+p1(bond)+' de vida do herói'):''}
        ${pKv('Parte no poder',(x?p1(sh.now):'—')+' · máximo '+p1(sh.max))}
        ${orow('crit',od.crit,'#ffa434',0.15)}${orow('mid',od.mid,'#b46bff',0.15)}${orow('basic',od.basic,'#4fa3ff',1)}
        <p class="p2-hint">As chances sobem com as <b>estrelas</b> e o <b>nível</b>.</p></div>
      <div class="p2-pan"><div class="p2-sec"><span>Estrelas e fragmentos</span><span>${x?(sn?n0(x.frags|0)+'/'+n0(sn)+' para '+n0(x.stars+1)+' estrelas':n0(MAXS)+' estrelas: máximo'):n0(o.stored[id]|0)+' guardados'}</span></div>
        ${pKv('Custo',sc.map(n0).join(' / ')+' fragmentos (2 a '+n0(MAXS)+' estrelas)',true)}
        ${abDef.noEgg?'':pKv('Ovo repetido','+'+n0(D.repeatFrags)+' fragmentos; com '+n0(MAXS)+' estrelas vira '+n0(rf)+' de ração')}
        ${src.length?pKv('Fontes',src.map(esc2).join(' · ')):''}
        ${x?(XP.confirm&&cr.ok?`<p class="p2-hint" role="status"><b>${esc2(abDef.name)}</b> volta para o <b>Nv 1</b> e você recebe <b>${n0(cr.refund|0)}</b> de ração (${p1(D.v3d.releaseRefund*100)} de ${n0(x.food|0)}). Estrelas e estágio ficam.</p>
            <div class="p2-rowb"><button class="p2-bt off" data-x="relno">Cancelar</button><button class="p2-bt red" data-x="relok">Redefinir</button></div>`
          :`<div class="p2-rowb"><button class="p2-bt red" data-x="rel" aria-disabled="${!cr.ok}">${esc2(D.v3d.releaseLabel||'Redefinir nível')}</button></div>`):''}</div>`; }

  /* ----- OVOS ----- */
  const chs=pChoices(), nGate=pGated(null), eggP=pEggPending(), tw=Array.isArray(D.v17.tower100)?D.v17.tower100.map(pDef).filter(Boolean):[];
  let eggTop='';
  if(eggP) eggTop+=`<div class="p2-rowb" style="margin:0 0 8px"><button class="p2-bt" data-x="egg"><span>Chocar o ovo do nível ${n0(D.v20.unlockLevel)}</span><small>${esc2(pCall('firstEggOdds',[],[]).map(q=>p1(q.pct)+' '+q.name).join(' · '))}</small></button></div>`;
  if(chs.length){ const c=chs[0].c;
    eggTop+=`<p class="p2-hint" style="margin:0 0 6px">Você tem <b>${n0(chs.length)}</b> ${chs.length>1?'ovos':'ovo'} à escolha. Toque no pet que você quer:</p><div class="p2-rowb" style="margin:0 0 8px">${c.options.map(q=>{ const pd=pDef(q); if(!pd) return '';
      return `<button class="p2-bt blue" data-x="pick" data-id="${esc2(q)}"><span>${esc2(pd.name)}</span><small>${esc2(pRN(pd.r))}${o.owned[q]?' · você já tem':''}</small></button>`; }).join('')}</div>`; }
  const gates=[3,4].map(r=>{ const l=pGateLevel(r), nm=pRN(r); return l>0&&nm?pKv(nm,'o ovo fica guardado até o nível '+n0(l)):''; }).join('');
  const eggs=`<div class="p2-pan"><div class="p2-sec"><span>Ovos</span><span>${nGate?n0(nGate)+(nGate>1?' guardados':' guardado'):''}</span></div>${eggTop}
      ${pKv('Chefe de era','dá o ovo da espécie da era',true)}
      ${tw.length?pKv('Torre, andar 100','ovo '+esc2(pRN(tw[0].r))+' à escolha: '+tw.map(q=>esc2(q.name)).join(' ou ')):''}${gates}</div>`;

  const compact=H<620;   /* tela baixa: a faixa do pet rola junto com o resto para a lista não sumir */
  V.innerHTML=xWrap(d,'p2-root '+(XP.anim?'p2-in':''),`${stage}${fcrow}${compact?'':det}
    <div id="p2_scroll" class="x-scroll p2-body">${compact?det:''}${grid}${about}${eggs}</div>`);
  XP.anim=false;
  if(y0){ const sc=document.getElementById('p2_scroll'); if(sc) sc.scrollTop=y0; }
  pStart();
}

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
function pFlyFc(dv){ if(Math.abs(dv)>=1){ XP.fly={d:dv,t:pNow()}; XP.until=Math.max(XP.until,XP.fly.t+1700); } }
const ACT={
  back(){ pSnd('ui_tap'); if(window.Screens&&typeof Screens.close==='function') Screens.close(); },
  sair(){ pSnd('ui_tap'); XP.pv=null; XP.confirm=false; pRedraw(); },
  pet(b,c){ const def=c.list.find(p=>p.id===b.dataset.id); if(!def) return; const id=def.id, o=c.o; XP.confirm=false;
    if(pSoon(def,o)){ pSnd('ui_tap'); XP.pv=XP.pv&&XP.pv.id===id?null:{id,stg:0,soon:true}; if(XP.pv) pToast(P2_SOON); pRedraw(); return; }   /* o módulo não libera: sem prévia e sem equipar */
    if(o.owned[id]){ XP.pv=null;
      if(o.eq!==id){ const before=pFc(), prev=o.eq;
        if(c.P.equip(S,id)){ pSnd('claim'); pChanged(); const after=pFc(); XP.undo=prev&&o.owned[prev]?prev:null; XP.last={id,what:'trocou o pet',a:before,b:after}; pFlyFc(after-before); pToast(def.name+' agora está na frente do herói'); }
        else pToast('Não foi possível equipar agora'); }
      else pSnd('ui_tap');
      pRedraw(); return; }
    pSnd('ui_tap'); if(XP.pv&&XP.pv.id===id) XP.pv=null; else { XP.pv={id,stg:0,soon:false}; pToast('Prévia: '+def.name+' no herói'); } pRedraw(); },
  stg(b,c){ const o=c.o, id=XP.pv&&!XP.pv.soon?XP.pv.id:o.eq, def=id?c.list.find(p=>p.id===id):null; if(!def) return; const i=pClamp(+b.dataset.i|0,0,2), x=o.owned[id];
    if(x&&!XP.pv&&i===pStgOf(id)) return; pSnd('ui_tap');
    if(x&&XP.pv&&i===pStgOf(id)) XP.pv=null; else XP.pv={id,stg:i,soon:false};
    pRedraw(); },
  feed(b,c){ const o=c.o, id=o.eq, x=id&&o.owned[id], P=c.P, D=P.DATA; if(!x){ pToast('Pet não obtido'); pRedraw(); return; } XP.pv=null;
    const cf=P.canFeed(S,c.host,id);
    if(cf.reason==='max') pToast('Nível máximo ('+n0(D.v3d.maxLvl)+')');
    else if(cf.reason==='evolve') pToast('Teto do estágio: evolua para passar do Nv '+n0(D.v17.stageCap[pStgOf(id)]));
    else if(cf.reason==='cap') pToast('Teto da era: avance de era para passar do Nv '+n0(P.lvlCap(c.host)));
    else if(cf.reason==='locked') pToast('Libera no nível '+n0(pLockLevel()));
    else { const before=pFc(), r=P.feedTap(S,c.host,id,D.v17.tapFood);
      if(!r||!r.ok) pToast('Sem ração: vem dos baús e do offline');
      else { XP.undo=null; pSnd(r.up?'upgrade':'ui_tap');
        if(r.up){ pChanged(); const after=pFc(), def=pDef(id); XP.last={id,what:'Nv '+n0(r.lvl),a:before,b:after}; pFlyFc(after-before); pToast((def?def.name:'Pet')+' subiu para o Nv '+n0(r.lvl)); } else pStore(); } }
    pRedraw(); },
  evo(b,c){ const o=c.o, id=o.eq, P=c.P; if(!id||!o.owned[id]){ pToast('Pet não obtido'); pRedraw(); return; } const def=pDef(id), SN=P.DATA.v3d.stages.map(s=>s.name), ce=P.canEvolve(S,id);
    if(!ce.ok){ pSnd('ui_tap'); pToast(ce.reason==='max'?'Já está no último estágio':ce.reason==='level'?'Precisa do Nv '+n0(ce.need)+': alimente o pet':'Evolução indisponível'); pRedraw(); return; }
    const from=ce.stage|0, before=pFc(), r=P.evolve(S,id); if(!r||!r.ok){ pToast('Evolução indisponível'); pRedraw(); return; }
    pSnd('summon'); pChanged(); const after=pFc(), to=pStgOf(id); XP.pv=null; XP.undo=null; XP.confirm=false; XP.last={id,what:SN[to],a:before,b:after};
    XP.fx={id,from,t:pNow(),c:pRc(def),txt:SN[to]}; XP.until=Math.max(XP.until,XP.fx.t+2200); pFlyFc(after-before); pToast(def.name+' evoluiu para '+SN[to]); pRedraw(); },
  undo(b,c){ const p=XP.undo, o=c.o; if(!p||!o.owned[p]){ XP.undo=null; pRedraw(); return; } const before=pFc();
    if(c.P.equip(S,p)){ pSnd('ui_tap'); pChanged(); const after=pFc(), d=pDef(p); XP.undo=null; XP.pv=null; XP.last={id:p,what:'voltou',a:before,b:after}; pFlyFc(after-before); pToast('Voltou: '+(d?d.name:'pet')); }
    else pToast('Não foi possível equipar agora');
    pRedraw(); },
  rel(b,c){ const id=c.o.eq; if(!id||!c.o.owned[id]) return; const cr=c.P.canResetLevel(S,id); pSnd('ui_tap'); if(!cr.ok) pToast('Já está no Nv 1'); else XP.confirm=true; pRedraw(); },
  relno(){ pSnd('ui_tap'); XP.confirm=false; pRedraw(); },
  relok(b,c){ const id=c.o.eq; XP.confirm=false; if(!id||!c.o.owned[id]){ pRedraw(); return; } const before=pFc(), r=c.P.resetLevel(S,c.host,id);
    if(r&&r.ok){ pSnd('coin'); pChanged(); const after=pFc(); XP.undo=null; XP.last={id,what:'Nv 1',a:before,b:after}; pFlyFc(after-before); pToast('+'+n0(r.refund|0)+' de ração de volta'); } else pToast('Já está no Nv 1');
    pRedraw(); },
  go(b,c){ const to=String(b.dataset.to||''); pSnd('ui_tap'); let ok=false; try{ ok=P2_ROUTE.some(r=>r[1]===to)&&!!window.Panels&&Panels.on(to)&&Panels.open(to,{from:P2})!==false; }catch(e){ ok=false; }
    if(!ok){ pToast('Esta tela ainda não está disponível'); pRedraw(); } },
  egg(b,c){ if(!pEggPending()) return; const r=c.P.firstEgg(S,c.host);
    if(!r||!r.ok){ pToast(r&&r.reason==='level'?'Libera no nível '+n0(r.needLevel||pLockLevel()):'O ovo já foi chocado'); pRedraw(); return; }
    pSnd('summon'); pChanged(); XP.pv=null; XP.undo=null; pToast('Novo pet: '+(r.name||'pet')+(r.rarityName?' ('+r.rarityName+')':'')); pRedraw(); },
  pick(b,c){ const ci=pChoices()[0], pid=String(b.dataset.id||''), pd=pDef(pid), r=ci&&pd?c.P.chooseEgg(S,c.host,ci.i,pid):null;
    if(!r||!r.ok){ pToast('Este ovo não está mais disponível'); pRedraw(); return; }
    const h=r.hatch||{}; pSnd('claim'); pChanged(); XP.pv=null;
    pToast(pd.name+': '+(h.held?'ovo '+pGateTxt(pd.r):h.isNew?'novo na coleção':h.to==='food'||h.food>0?'repetido, +'+n0(h.food|0)+' de ração':'repetido, +'+n0(h.frags|0)+' fragmentos')); pRedraw(); } };
function pClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!pReady()||pHidden()) return;
  const P=pP(); return ACT[a](b,{P,host:pHost(),o:pSave(),list:pList()}); }

/* imagens que a tela mostra agora (para a espera de carga do jogo, xGate): o ovo e o desenho parado de cada pet nos estágios que aparecem */
function pUrls(){ const u=['assets/pets/pet_egg.png']; try{ if(!pReady()) return u; const o=pSave(); for(const d of pList()){ u.push(pImg(d,o.owned[d.id]?pStgOf(d.id):0)); }
    const s=XP.pv&&!XP.pv.soon?pDef(XP.pv.id):(o.eq?pDef(o.eq):null); if(s&&s.sprite) for(let i=0;i<3;i++) if(u.indexOf(pImg(s,i))<0) u.push(pImg(s,i)); }catch(e){} return u; }

if(!('pets2' in PANEL_ON)) PANEL_ON.pets2=false;
Panels.add(P2,{title:'Pets',actions:Object.keys(ACT),
  render(){ if(typeof xGate==='function'&&xGate(pUrls())) return; return pRender(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return pClick(b); },
  /* 4x por segundo: a ração do topo e a limpeza do aviso, do "+poder" e do clarão quando o tempo deles acaba */
  tick(){ if(!pReady()||pHidden()) return; const el=document.getElementById('p2_food'); if(el){ const t=gNum(pSave().food); if(el.textContent!==t) el.textContent=t; }
    if(XP.until&&pNow()>XP.until){ XP.until=0; if(XP.fx&&pNow()-XP.fx.t>2100) XP.fx=null; if(XP.fly&&pNow()-XP.fly.t>1600) XP.fly=null; if(XP.toast&&pNow()-XP.toastT>2200) XP.toast=''; pRedraw(); } },
  onOpen(op){ pStop(); XP.pv=null; XP.undo=null; XP.last=null; XP.fx=null; XP.fly=null; XP.toast=''; XP.until=0; XP.confirm=false; XP.err=0; XP.anim=true; p2Tbl=null;
    if(op&&op.pet&&pReady()){ const d=pDef(op.pet), o=pSave(); if(d&&d.sprite&&!o.owned[d.id]&&!pSoon(d,o)) XP.pv={id:d.id,stg:0,soon:false}; } },
  onClose(){ pStop(); XP.pv=null; XP.undo=null; XP.last=null; XP.fx=null; XP.fly=null; XP.toast=''; XP.until=0; XP.confirm=false; } });
})();
