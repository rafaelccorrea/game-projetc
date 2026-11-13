'use strict';
/* ================= TELA TORNEIO DO PODER V2 (docs/proto/v2/TorneioDoPoder.html) — NASCE DESLIGADA (PANEL_ON.tourney2 = false) =================
   Só a TELA. A guerra semanal das guildas em 4 abas: Mapa (28 territórios, declarar ataque), Escalação (os lutadores de sexta e de sábado),
   Batalhas (a luta animada pelo registro de cada duelo: rei da colina) e Ranking. O herói fica sempre à vista no palco (rota única do jogo:
   window.drawHeroFull); ao ver uma batalha, os dois lutadores de cada duelo aparecem frente a frente com as barras de vida, x1/x4 e Pular.
   NENHUMA regra e NENHUM número aqui:
   - regras e prêmios: Sys.guild.DATA (season, territory, rankPoints, capitalMinEra, tourney, weeklyChest), territoryBonus, territoryPoints, tourneyReward;
   - o que muda vem do SERVIDOR pelo Sys.tourneyNet (cache síncrono: state, map, my, schedule, ranking, battles, lineup; Promise: declare, setLineup),
     contrato docs/API_SERVIDOR.md 10.3. A lógica de leitura, da escalação e das recusas é a do js/p_tourney.js (tNet, tLineup, tLuClick, T_WHY, T_LUWHY);
   - os membros da escalação: Sys.guildNet.mine().members (fc, level e era quando o servidor manda);
   - a luta: battles().list[i].duels[j].log (o registro do Sys.tower.duelCarry: {s, dmg, crit, hp}). A tela só TOCA o registro: a vida de cada lutador
     sai do próprio registro (vida do alvo antes do 1º golpe que levou); nome e FC só de quem é da SUA guilda (o servidor manda só os ids).
   SEM O ONLINE (chave desligada, cache vazio ou sem guilda) a tela mostra o estado honesto e as regras; nenhuma guilda, dono ou batalha inventados.
   Declarar ataque pede confirmação em dois toques, numa faixa DENTRO da tela (abaixo das abas, nunca por cima do herói). Sem emoji, sem alert/confirm/prompt.
   O arquivo roda em escopo próprio: nenhum nome daqui chega ao js/p_tourney.js, que continua valendo enquanto esta chave estiver desligada. */
(function(){
const N0='tourney2';

/* ---------- leituras dos módulos ---------- */
const tG=()=>(window.Sys&&Sys.guild&&Sys.guild.DATA&&Sys.guild.territoryBonus)?Sys.guild:null;
const TN=()=>(window.Sys&&Sys.tourneyNet)||null;
const tNet=()=>{ try{ const N=TN(), z=N&&N.state?N.state():null; return z&&z.on&&z.ready?N:null; }catch(e){ return null; } };
const host=()=>(window.Sys&&Sys.host)||null;
const tNow=()=>{ try{ const h=host(); if(h&&h.now) return h.now(); }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view===N0;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const isN=v=>typeof v==='number'&&isFinite(v);
const num=v=>isN(v)?v:0;
const c01=v=>Math.max(0,Math.min(1,v));
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
function tFC(n){ const f=(v,u)=>String(v<10?Math.round(v*10)/10:Math.round(v)).replace('.',',')+' '+u; n=num(n); return n>=1e6?f(n/1e6,'mi'):n>=1e3?f(n/1e3,'mil'):String(Math.round(n)); }
const fcT=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return tFC(v); };
const dmgT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return tFC(v); };
const dec=v=>String(Math.round(num(v)*10)/10).replace('.',',');
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
const ERA0=['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'];
const tEra=i=>{ try{ if(typeof ERAS!=='undefined'&&ERAS[i]&&ERAS[i].n) return String(ERAS[i].n); }catch(e){} return ERA0[i]||('Era '+i); };
const tRegions=()=>{ const G=tG(); return G?G.DATA.territory.regions:9; };
const tPerRegion=()=>{ const G=tG(); return G?G.DATA.territory.perRegion:3; };
const tileOf=id=>{ const q=/^r(\d+)t(\d+)$/.exec(String(id||'')); return id==='capital'?{id:'capital',capital:true,region:tRegions()-1,k:0}:q?{id:String(id),capital:false,region:+q[1],k:+q[2]}:null; };
const tTerrName=id=>{ const t=tileOf(id); return !t?String(id||''):t.capital?'Capital':tEra(t.region)+' · território '+t.k; };
const dayName=slot=>slot==='d6'?'sábado':'sexta';
const hourTxt=()=>{ try{ const h=tG().DATA.season.battleHour; return isN(h)?h+'h':''; }catch(e){ return ''; } };
const coinName=n=>{ let c='Brasão'; try{ c=String(tG().DATA.coin||c); }catch(e){} return n===1?c:(c==='Brasão'?'Brasões':c+'s'); };
function tStatus(){ const G=tG(); if(!G) return {on:false,open:false,reason:'off'}; try{ return G.status(S,host())||{on:false,reason:'off'}; }catch(e){ return {on:false,open:false,reason:'off'}; } }

/* ---------- recusas do servidor (as mesmas do js/p_tourney.js) ---------- */
const T_WHY={tourney_phase:'Ataques só de segunda a quinta',own_territory:'Este território já é da sua guilda',daily_limit:'Sua guilda já usou os ataques de hoje',territory_busy:'Já há um ataque a este território nesse dia',
  defender_busy:'O dono já defende outro território nesse dia',era_too_low:'A era mediana dos escalados está abaixo desta região',forbidden:'Só o líder e os oficiais declaram ataques',not_in_guild:'Entre numa guilda para participar',
  net_off:'Sem conexão: tente de novo',timeout:'Sem conexão: tente de novo',offline:'Sem conexão: tente de novo'};
const T_LUWHY={lineup_locked:'Escalação travada às 19h',member_too_new:'Há escalado com menos de 24 h de guilda antes da trava',bad_request:'Escalação inválida: confira os escalados',forbidden:'Só o líder e os oficiais escalam',
  net_off:'Sem conexão: tente de novo',timeout:'Sem conexão: tente de novo',offline:'Sem conexão: tente de novo'};
const T_REASON={neutral:'território sem dono',walkover:'o dono não tinha lutador',empty:'o atacante não tinha lutador',era:'era mediana abaixo da região'};
const T_PAL=['#4aa3ff','#ff6a5a','#c58bff','#ff9f43','#4ad6c8','#ff7ac0','#b8c94a','#a9b3c9'];
const hashOf=v=>{ let x=7; for(const c of String(v)) x=(x*31+c.charCodeAt(0))>>>0; return x; };
const colOf=id=>T_PAL[hashOf(id)%T_PAL.length];

const SV={
  coin:'<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" style="flex:none;vertical-align:-2px"><path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z" fill="#5ee7ff" stroke="#16306e" stroke-width="1.6"></path><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff6d6"></path></svg>',
  sw:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#ffd25e" stroke-width="3" stroke-linecap="round" aria-hidden="true" style="flex:none"><path d="M4 3l10 10M20 3L10 13M5 17l3-3M19 17l-3-3"></path></svg>',
  ck:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#05301b" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg>',
  lock:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#9aa6d6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 11V8a6 6 0 0112 0v3M5 11h14v10H5z"></path></svg>',
  info:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5ee7ff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"></circle><path d="M12 11v6M12 7.5v.5"></path></svg>' };

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.tr2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--rose:#ff6b9a;--green:#5ef0a0;--text:#eef1ff;--muted:#9aa6d6;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.tr2 *{box-sizing:border-box}
.tr2 button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.tr2 .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.tr2-in{animation:tr2-fade .22s ease-out}
@keyframes tr2-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.tr2-bg{position:absolute;left:0;right:0;top:0;height:380px;pointer-events:none}
.tr2-bg2{position:absolute;left:0;right:0;top:220px;height:160px;pointer-events:none;background:linear-gradient(180deg,rgba(11,16,48,0),var(--night))}
.tr2-stage{position:relative;z-index:2;flex:none;min-width:0}
.tr2-stage canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.tr2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:24px;width:max-content;max-width:94%;padding:2px 10px;border-radius:12px;background:rgba(255,210,94,.18);border:1px solid rgba(255,210,94,.55);color:var(--gold);font-weight:900;font-size:11px;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.tr2-hp{position:absolute;z-index:3;top:6px;width:calc(50% - 16px);max-width:160px;min-width:0}
.tr2-hp.l{left:10px}
.tr2-hp.r{right:10px;text-align:right}
.tr2-hp b{display:block;font-size:11px;font-weight:900;line-height:1.15;overflow-wrap:anywhere;text-shadow:0 1px 0 rgba(0,0,0,.6)}
.tr2-hp small{display:block;font-size:9.5px;color:var(--muted);font-weight:800;line-height:1.15;overflow-wrap:anywhere}
.tr2-hpb{height:8px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;margin-top:3px;border:1px solid rgba(255,255,255,.15)}
.tr2-hpb i{display:block;height:100%;background:linear-gradient(90deg,#5ef0a0,#22c47a);transition:width .12s linear}
.tr2-hp.r .tr2-hpb i{background:linear-gradient(90deg,#ff9f9f,#ff6b6b);margin-left:auto}
.tr2-qs{position:absolute;z-index:3;left:50%;bottom:2px;transform:translateX(-50%);width:max-content;max-width:94%;font-size:10.5px;font-weight:900;padding:2px 9px;border-radius:8px;background:rgba(5,8,28,.78);text-align:center;line-height:1.2;overflow-wrap:anywhere}
.tr2-ctl{position:relative;z-index:3;flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:4px 12px 0}
.tr2-ctl button,.xs .tr2-ctl button{min-width:0;min-height:40px;border-radius:10px;border:1px solid var(--line2);background:rgba(5,8,28,.78);color:#eef1ff;font-weight:900;font-size:12px;line-height:1.1;padding:0 2px;overflow-wrap:anywhere}
.tr2-ctl button[aria-pressed="true"],.xs .tr2-ctl button[aria-pressed="true"]{border-color:#ffd25e;color:#ffd25e}
.tr2-bt,.xs .tr2-bt{flex:1;min-width:0;min-height:40px;padding:4px 8px;border-radius:11px;border:0;font-weight:900;font-size:12.5px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:4px;text-align:center;overflow-wrap:anywhere}
.tr2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.tr2-bt.rose,.xs .tr2-bt.rose{background:linear-gradient(180deg,#ff9fbe,#e0477a);color:#3a0618;box-shadow:0 3px 0 #8c1d44}
.tr2-bt.off,.xs .tr2-bt.off{background:rgba(255,255,255,.06);color:#9aa6d6;box-shadow:none;border:1px solid rgba(130,150,255,.28)}
.tr2-bt.ghost,.xs .tr2-bt.ghost{background:rgba(255,255,255,.08);color:#eef1ff;box-shadow:none;border:1px solid rgba(160,180,255,.5)}
.tr2-bt.fix{flex:none}
.tr2-tabs{position:relative;z-index:3;flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:6px 12px 0}
.tr2-tab,.xs .tr2-tab{min-width:0;min-height:40px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.05);font-weight:900;font-size:12px;line-height:1.1;color:#9aa6d6;padding:0 2px;overflow-wrap:anywhere}
.tr2-tab[aria-selected="true"],.xs .tr2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;border-color:#7f93ff}
.tr2-busy{position:relative;z-index:3;flex:none;margin:6px 12px 0;padding:6px 10px;border-radius:11px;background:rgba(94,231,255,.12);border:1px solid rgba(94,231,255,.45);font-size:12px;font-weight:900;color:#cdeffd;text-align:center}
.tr2-conf{position:relative;z-index:3;flex:none;margin:6px 12px 0;padding:9px 10px;border-radius:14px;background:#2a1530;border:2px solid var(--rose);min-width:0}
.tr2-conf p{margin:0 0 8px;font-size:12.5px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.tr2-row2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.tr2-row2 .tr2-bt{min-height:44px}
.tr2-scroll{position:relative;z-index:3;flex:1;min-height:0;min-width:0;padding:8px 12px 16px}
.tr2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:10px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.tr2-sec span{min-width:0;overflow-wrap:anywhere}
.tr2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.tr2-hint{font-size:11px;color:var(--muted);margin:6px 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.tr2-rule{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:rgba(94,231,255,.1);border:1px solid rgba(94,231,255,.45);font-size:11.5px;font-weight:800;color:#cdeffd;line-height:1.4;margin:0 0 6px;min-width:0}
.tr2-rule span{min-width:0;overflow-wrap:anywhere}
.tr2-rule b{color:#fff}
.tr2-note{padding:12px;border-radius:13px;border:1px dashed var(--line2);background:rgba(5,8,28,.45);text-align:center;font-size:12px;font-weight:800;color:var(--muted);line-height:1.4;margin-bottom:6px;overflow-wrap:anywhere}
.tr2-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin:2px 0 8px}
.tr2-week span{min-width:0;border-radius:7px;padding:4px 0;text-align:center;font-size:9px;font-weight:900;background:rgba(255,255,255,.05);color:var(--muted);line-height:1.15;overflow-wrap:anywhere}
.tr2-week span.now{background:rgba(255,210,94,.2);color:var(--gold);outline:1px solid var(--gold)}
.tr2-mrow{display:grid;grid-template-columns:minmax(0,1.15fr) repeat(3,minmax(0,1fr));gap:4px;margin-bottom:4px;align-items:stretch}
.tr2-mrow>span{min-width:0;display:flex;align-items:center;font-size:10.5px;font-weight:900;color:var(--muted);line-height:1.15;overflow-wrap:anywhere}
.tr2-tt,.xs .tr2-tt{position:relative;min-width:0;min-height:40px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);font-size:10px;font-weight:900;line-height:1.1;color:rgba(255,255,255,.7);padding:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;overflow-wrap:anywhere;overflow:hidden}
.tr2-tt b{font-size:13px}
.tr2-tt.mine,.xs .tr2-tt.mine{background:rgba(94,240,160,.32);border-color:#5ef0a0;color:#eafff3}
.tr2-tt.sel{outline:3px solid #fff;outline-offset:-1px}
.tr2-tt .sw{position:absolute;right:2px;top:2px}
.tr2-tt.cap{width:100%;min-height:44px;font-size:11.5px;letter-spacing:.5px;margin-bottom:4px}
.tr2-leg{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10px;font-weight:800;color:var(--muted);margin:6px 0 8px}
.tr2-leg span{min-width:0;overflow-wrap:anywhere}
.tr2-leg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.tr2-det{border-radius:14px;padding:9px;background:var(--glass);border:1px solid var(--line2);margin-bottom:6px;min-width:0}
.tr2-det h3{margin:0 0 4px;font-size:14px;line-height:1.2;display:flex;justify-content:space-between;gap:8px;overflow-wrap:anywhere}
.tr2-det h3 span{font-size:11px;color:var(--muted);flex:none}
.tr2-kv{display:flex;justify-content:space-between;gap:8px;font-size:11.5px;font-weight:800;padding:3px 0;border-top:1px solid rgba(130,150,255,.13);line-height:1.3}
.tr2-kv span:first-child{color:var(--muted);flex:none;max-width:48%}
.tr2-kv span:last-child{text-align:right;min-width:0;overflow-wrap:anywhere}
.tr2-err{margin-top:6px;font-size:11px;font-weight:800;color:#ffb3c4;line-height:1.35;overflow-wrap:anywhere}
.tr2-pk{display:flex;gap:8px;align-items:center;padding:7px 9px;border-radius:12px;background:var(--glass);border:1px solid var(--line);margin-bottom:5px;min-width:0}
.tr2-pk>span{flex:1;min-width:0;font-size:12px;font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.tr2-pk>span small{display:block;font-size:10px;color:var(--muted);font-weight:700}
.tr2-pk>em{font-style:normal;font-weight:900;font-size:11.5px;color:var(--gold);flex:none;text-align:right;max-width:46%;line-height:1.3}
.tr2-seg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;margin-bottom:6px}
.tr2-seg button,.xs .tr2-seg button{min-width:0;min-height:40px;border-radius:10px;border:1px solid var(--line2);background:#0b1030;color:#eef1ff;font-weight:900;font-size:12px;line-height:1.1}
.tr2-seg button[aria-pressed="true"],.xs .tr2-seg button[aria-pressed="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);border-color:#7f93ff}
.tr2-lsum{border-radius:14px;padding:8px 10px;background:linear-gradient(160deg,rgba(94,240,160,.14),rgba(24,33,86,.9) 60%);border:1px solid rgba(94,240,160,.45);margin-bottom:6px;min-width:0}
.tr2-lsum .row{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900;line-height:1.3}
.tr2-lsum .row span{min-width:0;overflow-wrap:anywhere}
.tr2-lsum .row span:last-child{color:var(--gold);text-align:right}
.tr2-lsum small{display:block;font-size:10.5px;color:var(--muted);font-weight:800;margin-top:3px;line-height:1.35;overflow-wrap:anywhere}
.tr2-lu,.xs .tr2-lu{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:12px;background:var(--glass);border:1px solid var(--line);margin-bottom:4px;min-width:0;width:100%;min-height:44px;text-align:left;color:#eef1ff}
.tr2-lu.on,.xs .tr2-lu.on{border-color:#5ef0a0;background:rgba(94,240,160,.1)}
.tr2-lu.dis{opacity:.55}
.tr2-ck{flex:none;width:22px;height:22px;border-radius:7px;border:2px solid var(--line2);display:flex;align-items:center;justify-content:center}
.tr2-lu.on .tr2-ck{background:var(--green);border-color:var(--green)}
.tr2-pos{flex:none;min-width:22px;font-size:11px;font-weight:900;color:var(--green);text-align:center}
.tr2-av{flex:none;width:32px;height:32px;border-radius:9px;background:#1a2366;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--cyan)}
.tr2-mi{flex:1;min-width:0}
.tr2-mi b{display:block;font-size:12.5px;line-height:1.2;overflow-wrap:anywhere}
.tr2-mi small{display:block;font-size:10.5px;color:var(--muted);font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.tr2-mi small.won{color:var(--green)}
.tr2-mi small.lost{color:#ff9f9f}
.tr2-fc{flex:none;font-size:12px;font-weight:900;color:var(--gold);text-align:right;line-height:1.1}
.tr2-fc small{display:block;font-size:9px;color:var(--muted)}
.tr2-stick{position:sticky;bottom:-16px;z-index:2;padding:8px 0 8px;background:linear-gradient(180deg,rgba(11,16,48,0),var(--night) 35%);display:flex;gap:6px}
.tr2-stick .tr2-bt{min-height:44px}
.tr2-bat{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:13px;background:var(--glass);border:1px solid var(--line);margin-bottom:5px;min-width:0}
.tr2-rk{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:12px;background:var(--glass);border:1px solid var(--line);margin-bottom:4px;min-width:0;min-height:40px}
.tr2-rk.me{border-color:var(--gold);background:rgba(255,210,94,.1)}
.tr2-rk .n{flex:none;min-width:30px;font-size:16px;color:var(--muted);text-align:center}
.tr2-rk .n.top{color:var(--gold)}
.tr2-rk .nm{flex:1;min-width:0;font-size:12.5px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.tr2-rk em{flex:none;font-style:normal;font-size:12px;font-weight:900;color:var(--gold)}
.tr2-rw{display:grid;grid-template-columns:minmax(0,.7fr) minmax(0,2fr);gap:6px;font-size:11px;font-weight:800;padding:4px 0;border-top:1px solid rgba(130,150,255,.14);line-height:1.3}
.tr2-rw span{min-width:0;overflow-wrap:anywhere}
.tr2-rw span:last-child{color:var(--gold);text-align:right}
.tr2-toast{position:absolute;left:50%;z-index:40;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;overflow-wrap:anywhere;pointer-events:none;animation:tr2-tin .25s ease-out both}
@keyframes tr2-tin{from{opacity:0;transform:translate(-50%,-8px)}}
.tr2-gate{position:relative;z-index:3;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.tr2-gate span{font-size:13px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.tr2-in,.tr2-toast{animation:none}.tr2-hpb i{transition:none}}
`; document.head.appendChild(el); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const TABS=[['map','Mapa'],['lineup','Escalação'],['battles','Batalhas'],['rank','Ranking']];
const X={tab:'map',md:'',sel:'',conf:null,busy:'',toast:'',toastT:0,anim:true,top:true,sig:'',tk:0,slot:'d5',lu:{},rk:'tournament',rp:null,fx:[],raf:0,t0:0,t:0,asked:{},loading:false};
let toastTop=210;
const toastHtml=(m,top)=>'<div class="tr2-toast" role="status" style="top:'+top+'px">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=Date.now(); redraw(); }

/* ---------- ESCALAÇÃO: as mesmas contas do js/p_tourney.js (o servidor valida; a tela só evita o toque que ele recusaria) ---------- */
const tSize=N=>{ let n=0; try{ n=N.state().size|0; }catch(e){} if(!(n>0)){ try{ n=tG().DATA.tourney.size|0; }catch(e){} } return n>0?n:15; };
function tMembers(){ try{ const GN=window.Sys&&Sys.guildNet, m=GN&&GN.mine?GN.mine():null, L=m&&Array.isArray(m.members)?m.members.filter(x=>x&&x.id!=null):[];
    const hasFc=L.some(x=>typeof x.fc==='number'); return {list:hasFc?L.slice().sort((a,b)=>(+b.fc||0)-(+a.fc||0)):L,hasFc}; }catch(e){ return {list:[],hasFc:false}; } }
function tLockAt(N,slot){ try{ const l=N.lineup(slot); if(l&&l.lockAt>0) return +l.lockAt; const s=N.schedule().find(x=>x&&x.slot===slot); return s&&s.lockAt>0?+s.lockAt:0; }catch(e){ return 0; } }
function tLocked(N,slot){ try{ const l=N.lineup(slot); if(l&&l.locked===true) return true; }catch(e){} const at=tLockAt(N,slot); return at>0&&tNow()>=at; }
const tElig=(m,lockAt)=>!(lockAt>0&&typeof m.joinedAt==='number')||m.joinedAt<=lockAt-864e5;
/* cópia de trabalho da escalação do dia (começa igual à do servidor; "salva" enquanto não muda) */
function tLu(N,slot){ let w=X.lu[slot]; if(!w){ let base=[]; try{ const l=N.lineup(slot); base=l&&Array.isArray(l.members)?l.members.map(String):[]; }catch(e){} w=X.lu[slot]={ids:base,saved:true}; } return w; }
const median=a=>a.length?(a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2):null;

/* ---------- BATALHA: monta a reprise a partir do registro do servidor (nada é simulado aqui) ---------- */
function myGuildId(){ const N=tNet(), my=N?N.my():null; return my&&my.guildId!=null?String(my.guildId):null; }
function battleInfo(b){ const A=b.attacker||{}, D=b.defender||null, me=myGuildId(), aMine=me!=null&&A.id!=null&&String(A.id)===me, bMine=me!=null&&!!D&&D.id!=null&&String(D.id)===me;
  const done=b.winner!=null||!!b.winnerName, winAtt=done&&(b.winner!=null?String(b.winner)===String(A.id):String(b.winnerName)===String(A.name));
  const duels=(Array.isArray(b.duels)?b.duels:[]).filter(d=>d&&Array.isArray(d.log)&&d.log.length);
  return {A:A,D:D,aName:String(A.name||'Guilda'),dName:D?String(D.name||'Guilda'):'Sem dono',aMine:aMine,bMine:bMine,done:done,winAtt:winAtt,duels:duels}; }
function buildReplay(b,bi){ const I=battleInfo(b); if(!I.duels.length) return null; const mem={}; for(const m of tMembers().list) mem[String(m.id)]=m;
  const full={}, seqA=[], seqB=[], out=[];
  const who=(id,mine,n)=>{ const m=mine?mem[id]:null; return {name:m&&m.name?String(m.name):'Lutador '+n,fc:m&&isN(m.fc)?m.fc:null,me:!!(m&&m.me)}; };
  for(const d of I.duels){ const a=String(d.a), bb=String(d.b);
    /* vida de cada um ao entrar no duelo = vida do alvo antes do 1º golpe que levou (hp + dmg do registro); sem golpe levado, a vida que sobrou */
    const first=s=>{ const e=d.log.find(q=>q&&q.s===s&&isN(q.hp)); return e?num(e.hp)+num(e.dmg):null; }, fa=first(1), fb=first(0), a0=fa!=null?fa:num(d.hpLeftA), b0=fb!=null?fb:num(d.hpLeftB);
    if(full['a'+a]==null) full['a'+a]=a0; if(full['b'+bb]==null) full['b'+bb]=b0; if(seqA.indexOf(a)<0) seqA.push(a); if(seqB.indexOf(bb)<0) seqB.push(bb);
    out.push({log:d.log,hpA0:a0,hpB0:b0,maxA:Math.max(1,full['a'+a],a0),maxB:Math.max(1,full['b'+bb],b0),endA:isN(d.hpLeftA)?d.hpLeftA:null,endB:isN(d.hpLeftB)?d.hpLeftB:null,
      pa:who(a,I.aMine,seqA.indexOf(a)+1),pb:who(bb,I.bMine,seqB.indexOf(bb)+1)}); }
  return {bi:bi,I:I,duels:out,i:0,k:0,next:X.t+0.6,speed:X.rp?X.rp.speed:1,e:null,hp:[out[0].hpA0,out[0].hpB0],done:false}; }
function ovHtml(){ const R=X.rp; if(!R) return ''; const D=R.duels[Math.min(R.i,R.duels.length-1)], I=R.I, pa=c01(R.hp[0]/D.maxA)*100, pb=c01(R.hp[1]/D.maxB)*100;
  const side=(c,p,g,pc,id)=>'<div class="tr2-hp '+c+'"><b>'+esc2(p.name)+(p.me?' (você)':'')+'</b><small>'+esc2(g)+(p.fc!=null?' · FC '+esc2(fcT(p.fc)):'')+'</small><div class="tr2-hpb"><i id="'+id+'" style="width:'+pc.toFixed(1)+'%"></i></div></div>';
  return side('l',D.pa,I.aName,pa,'tr2_hpa')+side('r',D.pb,I.dName,pb,'tr2_hpb')
    +'<div class="tr2-qs" role="status">'+(R.done?(I.done?esc2(I.winAtt?I.aName+' toma o território':I.dName+' segura o território'):'Fim do registro'):'Duelo '+nT(R.i+1)+' de '+nT(R.duels.length))+'</div>'; }
function ovPut(){ try{ const el=document.getElementById('tr2_ov'); if(el) el.innerHTML=ovHtml(); }catch(e){} }
function setBars(){ const R=X.rp; if(!R) return; const D=R.duels[R.i]; try{ const a=document.getElementById('tr2_hpa'), b=document.getElementById('tr2_hpb'); if(a&&a.style) a.style.width=(c01(R.hp[0]/D.maxA)*100).toFixed(1)+'%'; if(b&&b.style) b.style.width=(c01(R.hp[1]/D.maxB)*100).toFixed(1)+'%'; }catch(e){} }
/* toca o registro: um golpe por passo (o ritmo é só desenho); entre dois duelos, a fila anda e as barras voltam para a vida que cada um trouxe */
function stepReplay(t){ const R=X.rp; if(!R||R.done||t<R.next) return; const D=R.duels[R.i];
  if(R.k<D.log.length){ const e=D.log[R.k++]||{}, s=e.s===1?1:0; R.e={s:s,t:t}; if(isN(e.hp)) R.hp[1-s]=e.hp;
    X.fx.push({s:s,t:t,big:!!e.crit,c:e.crit?'#ffe58a':'#fff',txt:(e.crit?'Crítico! ':'')+'-'+dmgT(num(e.dmg))}); if(X.fx.length>24) X.fx.shift();
    sfx(e.crit?'crit':'hit'); R.next=t+0.42/R.speed; setBars(); return; }
  if(R.i+1>=R.duels.length){ R.done=true; R.e=null; sfx('claim'); redraw(); return; }
  R.i++; R.k=0; R.e=null; const Nx=R.duels[R.i]; R.hp=[Nx.hpA0,Nx.hpB0]; R.next=t+0.9/R.speed; ovPut(); }
function skipReplay(){ const R=X.rp; if(!R||R.done) return; R.i=R.duels.length-1; const D=R.duels[R.i]; R.k=D.log.length; R.e=null;
  const last=s=>{ for(let q=D.log.length-1;q>=0;q--){ const e=D.log[q]; if(e&&e.s===s&&isN(e.hp)) return e.hp; } return null; }, la=last(1), lb=last(0);
  R.hp=[D.endA!=null?D.endA:la!=null?la:D.hpA0,D.endB!=null?D.endB:lb!=null?lb:D.hpB0]; R.done=true; X.fx=[]; }

/* ---------- PALCO (canvas): parado = o herói do jogo com o pet na frente; na reprise = os dois lutadores do duelo, frente a frente ---------- */
const canDraw=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
function fighter(x,g,cx,mirror,st,lunge,hurt){ x.save(); if(mirror){ x.translate(cx*2,0); x.scale(-1,1); }
  try{ window.drawHeroFull(x,cx+lunge*12+(hurt>0?Math.sin(hurt*80)*3:0),g.GY,g.k,st); } finally{ x.restore(); } }
/* corpo de cada lado: quem é VOCÊ usa o seu visual; os outros usam o corpo padrão (a sua guilda com o seu herói, a adversária com o outro) */
function lookOf(p,mine,t){ if(p.me) return {t:t,mount:false,pet:false}; const h=heroId(); return {t:t,hero:mine?h:(h==='kael'?'kaia':'kael'),skin:'default',mount:false,pet:false,wing:false,layers:[]}; }
function drawFx(x,g,t){ X.fx=X.fx.filter(p=>t-p.t<1.1&&t>=p.t-0.01); for(const p of X.fx){ const a=c01((t-p.t)/1.1), px=p.s===0?g.RX:g.LX, py=g.GY-g.H*0.56-a*30;
    x.save(); x.globalAlpha=1-a; x.font='900 '+(p.big?16:13)+'px Nunito,sans-serif'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.6)'; x.fillStyle=p.c; x.strokeText(p.txt,px,py); x.fillText(p.txt,px,py); x.restore(); } }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||196;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000); X.t=t; const x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0); base(); x.clearRect(0,0,w,h);
  const hs=(typeof HS==='number'&&HS>0)?HS:155, hk=Math.min(0.6,(h-34)/256), g={W:w,H:h,LX:Math.round(w*0.28),RX:Math.round(w*0.72),GY:h-20,k:hk*256/hs};
  const part=fn=>{ try{ fn(); }catch(err){ try{ x.restore(); }catch(e2){} } base(); };
  part(()=>{ const gr=x.createRadialGradient(w/2,g.GY,10,w/2,g.GY,w/2); gr.addColorStop(0,'rgba(255,210,94,.22)'); gr.addColorStop(1,'rgba(255,210,94,0)'); x.fillStyle=gr; x.beginPath(); x.ellipse(w/2,g.GY,w/2,18,0,0,7); x.fill(); });
  try{ stepReplay(t); }catch(e){}
  const R=X.rp;
  if(R){ const D=R.duels[Math.min(R.i,R.duels.length-1)], e=R.e, age=e?t-e.t:9, la=e&&e.s===0?Math.max(0,1-age*5):0, lb=e&&e.s===1?Math.max(0,1-age*5):0, ha=e&&e.s===1?Math.max(0,0.3-age):0, hb=e&&e.s===0?Math.max(0,0.3-age):0;
    if(canDraw()){ part(()=>fighter(x,g,g.LX,false,lookOf(D.pa,R.I.aMine,t),la,ha)); part(()=>fighter(x,g,g.RX,true,lookOf(D.pb,R.I.bMine,t+0.37),lb,hb)); } }
  else part(()=>{ if(canDraw()) window.drawHeroFull(x,Math.round(w*0.44),g.GY,g.k,{t:t,mount:false}); });   /* herói a pé, arma na mão; o pet é o último desenho do drawHeroFull (na frente) */
  part(()=>drawFx(x,g,t)); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('tr2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('tr2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="tr2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.45,0.9):'#16110d')+'"></div><div class="tr2-bg2"></div>';
const secH=(a,b)=>'<div class="tr2-sec"><span>'+a+'</span><span>'+(b||'')+'</span></div>';
const rule=t=>'<div class="tr2-rule">'+SV.info+'<span>'+t+'</span></div>';
const note=t=>'<div class="tr2-note" role="status">'+t+'</div>';
const coinTxt=v=>'<span style="display:inline-flex;align-items:center;gap:3px">'+SV.coin+esc2(nT(v)+' '+coinName(v))+'</span>';
function weekStrip(){ const Z=(tG().DATA.season)||{}, days=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], today=new Date(tNow()).getDay(), hh=hourTxt();
  const ph=dd=>(Z.declareDays||[]).indexOf(dd)>=0?'declarar':(Z.battleDays||[]).indexOf(dd)>=0?(hh||'batalha'):dd===Z.prizeDay?'prêmios':'';
  return '<div class="tr2-week" aria-label="Semana do torneio">'+[1,2,3,4,5,6,0].map(dd=>'<span class="'+(dd===today?'now':'')+'">'+days[dd]+'<br>'+ph(dd)+'</span>').join('')+'</div>'; }
function prizesHtml(){ const G=tG(), D=G.DATA, W=D.weeklyChest&&D.weeklyChest.mats;
  return secH('Prêmios do torneio','para quem estava escalado')+'<div class="tr2-det">'+D.tourney.rewards.map(r=>{ const rw=G.tourneyReward(r.from);
      return '<div class="tr2-rw"><span>'+(r.from===r.to?nT(r.from)+'º':nT(r.from)+'º a '+nT(r.to)+'º')+'</span><span>'+coinTxt(rw.coin)+(rw.prism?' · '+nT(rw.prism)+(rw.prism===1?' fragmento':' fragmentos')+' do Prismático':'')+(rw.frame?' · moldura':'')+'</span></div>'; }).join('')+'</div>'
    +'<p class="tr2-hint">Só guilda com pelo menos 1 vitória na semana. Mais: 1 baú por território para cada membro da guilda dona'+(W?' (1 item da raridade mais alta que você pode receber + '+nT(W.forge)+' de forja, '+nT(W.food)+' de ração, '+nT(W.essence)+' Essência)':'')+', pelo correio.</p>'; }
function rulesHtml(){ const G=tG(), D=G.DATA, Z=D.season||{}, T=D.territory, hh=hourTxt();
  return rule('Cada guilda escala até <b>'+nT(D.tourney.size)+' membros</b>. Luta automática com os atributos reais: quem vence segue com a vida que sobrou e enfrenta o próximo. Empate no tempo: o defensor fica.')
    +'<div class="tr2-det"><div class="tr2-kv" style="border-top:0"><span>Declarar ataques</span><span>segunda a quinta, até '+nT(Z.attacksPerDay||0)+' por dia</span></div><div class="tr2-kv"><span>Batalhas</span><span>sexta e sábado'+(hh?', às '+hh:'')+'</span></div>'
    +'<div class="tr2-kv"><span>Território</span><span>ouro +'+dec(T.per.gold)+'%, XP +'+dec(T.per.xp)+'%, drop +'+dec(T.per.drop)+'%</span></div><div class="tr2-kv"><span>Capital</span><span>vale '+nT(T.capitalMult)+'x · pede mediana de era '+nT(D.capitalMinEra)+'</span></div>'
    +'<div class="tr2-kv"><span>Região</span><span>só ataca a guilda cuja mediana de era dos escalados alcança a era da região</span></div></div>'; }

/* em que estado a tela está: none (sem módulo) · closed (sem online ou sem dados) · on (cache do servidor pronto) */
function mode(){ const G=tG(); if(!G) return {m:'none'}; const N=tNet(); if(N) return {m:'on',N:N}; let z=null; try{ const T=TN(); z=T&&T.state?T.state():null; }catch(e){} return {m:'closed',z:z,st:tStatus()}; }
function pClosed(M){ const z=M.z, st=M.st||{}; let txt='Em breve: abre com o online', sub='As guildas, os donos dos territórios e as batalhas vêm do servidor. Nada aparece aqui antes disso.';
  if(st.reason==='level'){ txt='Libera no nível '+nT(st.needLevel||0); sub='O torneio abre junto com a guilda.'; }
  else if(z&&z.on&&X.loading){ txt='Carregando o torneio…'; sub=''; }
  else if(z&&z.on&&z.err==='not_in_guild'){ txt='Entre numa guilda para participar'; sub='O torneio é disputado entre as guildas do seu servidor.'; }
  else if(z&&z.on&&(z.err==='net_off'||z.err==='timeout'||z.err==='offline')){ txt='Sem conexão com o servidor'; sub='Abra a tela de novo quando a conexão voltar.'; }
  return '<div class="tr2-note" role="status"><b class="lil" style="display:block;font-size:20px;color:#eef1ff">Torneio do Poder</b>'+esc2(txt)+(sub?'<br>'+esc2(sub):'')+'</div>'+weekStrip()+rulesHtml()+prizesHtml(); }

/* ----- Mapa ----- */
function mapData(N){ const by={}, my=N.my()||{}, me=my.guildId!=null?String(my.guildId):null, mineIds=Array.isArray(my.territories)?my.territories.map(String):[];
  for(const m of N.map()) if(m&&typeof m.id==='string'&&tileOf(m.id)) by[m.id]=m;
  const isMine=id=>{ const m=by[id]; return mineIds.indexOf(id)>=0||!!(me!=null&&m&&m.owner&&m.owner.id!=null&&String(m.owner.id)===me); };
  return {by:by,my:my,me:me,isMine:isMine}; }
function tileBtn(id,MD){ const t=tileOf(id), m=MD.by[id], mine=MD.isMine(id), ow=m&&m.owner&&m.owner.id!=null?m.owner:null, atk=!!(m&&Array.isArray(m.attacks)&&m.attacks.length), c=ow&&!mine?colOf(ow.id):'';
  const lab=tTerrName(id)+(mine?', da sua guilda':ow?', de '+String(ow.name||'outra guilda'):', sem dono')+(atk?', com ataque marcado':'');
  const tag=mine?'sua':ow?Array.from(String(ow.name||'').replace(/[^A-Za-z0-9À-ÿ]/g,'')).slice(0,3).join('').toUpperCase():'';
  return '<button class="tr2-tt'+(t.capital?' cap':'')+(mine?' mine':'')+(X.sel===id?' sel':'')+'" data-x="tile" data-id="'+esc2(id)+'" aria-pressed="'+(X.sel===id)+'" aria-label="'+esc2(lab)+'"'+(c?' style="background:'+c+'40;border-color:'+c+'"':'')+'>'
    +(t.capital?'<span>CAPITAL'+(mine?' · sua guilda':ow?' · '+esc2(ow.name||''):'')+'</span>':'<b>'+t.k+'</b>'+(tag?'<span>'+esc2(tag)+'</span>':''))+(atk?'<span class="sw">'+SV.sw+'</span>':'')+'</button>'; }
function detHtml(MD,N){ const t=tileOf(X.sel); if(!t) return ''; const G=tG(), D=G.DATA, T=D.territory, P=D.rankPoints||{}, m=MD.by[t.id]||{}, mine=MD.isMine(t.id), ow=m.owner&&m.owner.id!=null?m.owner:null, mult=t.capital?T.capitalMult:1;
  const pts=t.capital?num(P.capital):num(P.regionBase)+t.region, atks=Array.isArray(m.attacks)?m.attacks.filter(a=>a):[], used=atks.map(a=>a.slot), hh=hourTxt(), z=N.state();
  let h='<div class="tr2-det"><h3>'+esc2(tTerrName(t.id))+'<span>'+nT(pts)+(pts===1?' ponto':' pontos')+'</span></h3>'
    +'<div class="tr2-kv" style="border-top:0"><span>Dono</span><span>'+(mine?'Sua guilda':ow?esc2(ow.name||'Guilda'):'Sem dono')+'</span></div>'
    +'<div class="tr2-kv"><span>Bônus para o dono</span><span>ouro +'+dec(T.per.gold*mult)+'%, XP +'+dec(T.per.xp*mult)+'%, drop +'+dec(T.per.drop*mult)+'%</span></div>'
    +'<div class="tr2-kv"><span>Pede mediana de era</span><span>'+(t.capital?nT(D.capitalMinEra)+' ou mais':nT(t.region)+' ou mais ('+esc2(tEra(t.region))+')')+'</span></div>'
    +atks.map(a=>'<div class="tr2-kv"><span>Ataque marcado</span><span>'+esc2((a.attacker&&a.attacker.name)||'Guilda')+' · '+dayName(a.slot)+(hh?' '+hh:'')+'</span></div>').join('');
  if(mine) h+='<div class="tr2-row2" style="margin-top:8px;grid-template-columns:minmax(0,1fr)"><button class="tr2-bt ghost" data-x="defend">Escalar a defesa</button></div>';
  else if(MD.my.canDeclare){ const off=k=>z.phase!=='declare'||used.indexOf(k)>=0;
    h+='<div class="tr2-row2" style="margin-top:8px">'+['d5','d6'].map(k=>'<button class="tr2-bt'+(off(k)?' off':'')+'" data-x="decl" data-k="'+k+'">Atacar '+dayName(k)+(hh?' '+hh:'')+'</button>').join('')+'</div>'
      +(z.phase!=='declare'?'<div class="tr2-err">'+esc2(T_WHY.tourney_phase)+'.</div>':'')+'<p class="tr2-hint" style="margin:6px 0 0">Ataques que sua guilda ainda pode declarar hoje: '+nT(MD.my.attacksLeftToday|0)+'.</p>'; }
  else h+='<div class="tr2-err" style="color:#9aa6d6">'+(MD.me!=null?'Só o líder e os oficiais declaram ataque.':'Entre numa guilda para participar.')+'</div>';
  return h+'</div>'; }
function pMap(N){ const G=tG(), MD=mapData(N), R=tRegions(), PR=tPerRegion(); let rows='';
  for(let e=0;e<R;e++){ rows+='<div class="tr2-mrow"><span>'+esc2(tEra(e))+'</span>'; for(let k=1;k<=PR;k++) rows+=tileBtn('r'+e+'t'+k,MD); rows+='</div>'; }
  const owners={}, mineL=[]; for(const id in MD.by){ const m=MD.by[id], t=tileOf(id); if(MD.isMine(id)) mineL.push({region:t.region,capital:t.capital}); else if(m.owner&&m.owner.id!=null) owners[String(m.owner.id)]=String(m.owner.name||'Guilda'); }
  const ids=Object.keys(owners), tb=G.territoryBonus(mineL); let pts=0; try{ pts=G.territoryPoints(mineL); }catch(e){}
  const leg='<div class="tr2-leg">'+(MD.me!=null?'<span><i style="background:#5ef0a0"></i>Sua guilda</span>':'')+ids.slice(0,6).map(id=>'<span><i style="background:'+colOf(id)+'"></i>'+esc2(owners[id])+'</span>').join('')+(ids.length>6?'<span>+'+nT(ids.length-6)+' guildas</span>':'')+'<span><i style="background:rgba(255,255,255,.12)"></i>Sem dono</span><span>'+SV.sw+' ataque marcado</span></div>';
  return weekStrip()+tileBtn('capital',MD)+rows+leg+(X.sel?detHtml(MD,N):note('Toque num território para ver o dono, o bônus e atacar.'))
    +(MD.me!=null?'<div class="tr2-pk"><span>'+(mineL.length===1?'Seu território':'Seus '+nT(mineL.length)+' territórios')+' · '+nT(pts)+(pts===1?' ponto':' pontos')+'<small>No dia dos prêmios: 1 baú por território para cada membro</small></span><em>Ouro +'+dec(tb.gold)+'%<br>XP +'+dec(tb.xp)+'% · Drop +'+dec(tb.drop)+'%</em></div>':note('Entre numa guilda para participar do torneio.')); }

/* ----- Escalação ----- */
function pLineup(N){ const my=N.my()||{}; if(my.guildId==null) return note('Entre numa guilda para escalar os lutadores.');
  const slot=X.slot==='d6'?'d6':'d5', can=!!my.canLineup, size=tSize(N), lockAt=tLockAt(N,slot), lk=tLocked(N,slot), W=tLu(N,slot), M=tMembers(), by={}; for(const m of M.list) by[String(m.id)]=m;
  const ids=W.ids.filter(id=>by[id]), picked=ids.map(id=>by[id]), ord=M.hasFc?picked.slice().sort((a,b)=>(+b.fc||0)-(+a.fc||0)):picked, pos={}; ord.forEach((m,i)=>{ pos[String(m.id)]=i+1; });
  const med=median(picked.map(m=>m.era).filter(e=>typeof e==='number').sort((a,b)=>a-b)), fcSum=picked.reduce((a,m)=>a+(+m.fc||0),0), h=lockAt>0?(lockAt-tNow())/36e5:null, hh=hourTxt();
  const lockTxt=lk?'Travada às 19h. Trocar de equipamento agora não muda a batalha':h==null?'Trava às 19h do dia da luta':h>48?'Trava '+dayName(slot)+' às 19h (1 h antes da luta)':'Trava em '+Math.max(1,Math.round(h))+' h, às 19h';
  let out='<div class="tr2-seg" role="group" aria-label="Dia da batalha">'+['d5','d6'].map(k=>'<button data-x="slot" data-k="'+k+'" aria-pressed="'+(slot===k)+'">'+(k==='d5'?'Sexta':'Sábado')+(hh?' '+hh:'')+'</button>').join('')+'</div>'
    +'<div class="tr2-lsum"><div class="row"><span>Escalados '+ids.length+'/'+size+'</span><span>'+(M.hasFc?'FC somada '+esc2(fcT(fcSum)):'')+'</span></div>'
    +'<div class="row" style="margin-top:3px"><span>'+(med!=null?'Mediana de era: '+esc2(dec(med))+' ('+esc2(tEra(Math.floor(med)))+')':'Mediana de era: sem dados')+'</span><span>'+(W.saved?'Salva':'Não salva')+'</span></div>'
    +'<small>'+esc2(lockTxt)+'. '+(M.hasFc?'A fila luta em ordem de FC (o 1º abre). ':'')+'Só entra quem está na guilda desde 24 h antes da trava.'+(med!=null?' Com esta mediana dá para atacar até a região '+esc2(tEra(Math.min(tRegions()-1,Math.floor(med))))+'.':'')+'</small></div>';
  const meId=String((M.list.find(m=>m.me)||{}).id);
  if(!can) out+=rule('Só <b>o líder e os oficiais</b> escalam. Você está '+(pos[meId]?'<b>escalado</b> na posição '+pos[meId]:'fora da escalação')+'.');
  if(!M.list.length) out+=note('A lista de membros da guilda ainda não chegou.');
  for(const m of M.list){ const id=String(m.id), on=ids.indexOf(id)>=0, el=tElig(m,lockAt), dis=lk||!can||(!el&&!on)||(!on&&ids.length>=size);
    const sub=!el?'Menos de 24 h de guilda antes da trava':[typeof m.level==='number'?'Nv '+nT(m.level):'',typeof m.era==='number'?tEra(m.era):''].filter(Boolean).join(' · ');
    out+='<button class="tr2-lu'+(on?' on':'')+(dis&&!on?' dis':'')+'" data-x="pick" data-id="'+esc2(id)+'" aria-pressed="'+on+'"'+(dis?' aria-disabled="true"':'')+'><span class="tr2-ck" aria-hidden="true">'+(on?SV.ck:!el?SV.lock:'')+'</span>'+(on?'<span class="tr2-pos">'+pos[id]+'º</span>':'')
      +'<span class="tr2-av lil" aria-hidden="true">'+esc2(Array.from(String(m.name||'?'))[0]||'?')+'</span><span class="tr2-mi"><b>'+esc2(m.name||'?')+(m.me?' (você)':'')+'</b>'+(sub?'<small>'+esc2(sub)+'</small>':'')+'</span>'
      +(typeof m.fc==='number'?'<span class="tr2-fc">'+esc2(fcT(m.fc))+'<small>FC</small></span>':'')+'</button>'; }
  if(can&&!lk) out+='<div class="tr2-stick"><button class="tr2-bt ghost" data-x="lu" data-k="clear">Limpar</button>'+(M.hasFc?'<button class="tr2-bt ghost" data-x="lu" data-k="best">Os '+size+' de maior FC</button>':'')+'<button class="tr2-bt'+(W.saved?' off':'')+'" data-x="lu" data-k="save">'+(W.saved?'Salva':'Salvar')+'</button></div>';
  return out; }

/* ----- Batalhas ----- */
function battleList(N){ const BT=N.battles(); return BT&&Array.isArray(BT.list)?BT.list.filter(b=>b).slice(0,30):null; }
function pBattles(N){ const L=battleList(N), hh=hourTxt();
  if(!L){ if(!X.asked.bt){ X.asked.bt=1; try{ Promise.resolve(N.loadBattles()).then(redraw,redraw); }catch(e){} } return weekStrip()+note('Carregando as batalhas…'); }
  if(!L.length) return weekStrip()+note('Nenhuma batalha nesta semana ainda. Elas acontecem na sexta e no sábado'+(hh?', às '+hh:'')+'.');
  let h=secH('Batalhas da semana','toque para ver a luta');
  L.forEach((b,i)=>{ const I=battleInfo(b), meIn=I.aMine||I.bMine, meWin=(I.aMine&&I.winAtt)||(I.bMine&&!I.winAtt), nd=I.duels.length;
    const res=!I.done?'Aguardando a batalha'+(hh?' das '+hh:''):(I.winAtt?I.aName+' tomou':I.dName+' segurou')+(nd?' · '+nT(nd)+(nd===1?' duelo':' duelos'):'')+(T_REASON[b.reason]?' · '+T_REASON[b.reason]:'')+(meIn?(meWin?' · vitória da sua guilda':' · derrota da sua guilda'):'');
    h+='<div class="tr2-bat"><span class="tr2-mi"><b>'+esc2(tTerrName(b.territory))+' · '+dayName(b.slot)+'</b><b>'+esc2(I.aName)+' ataca '+esc2(I.dName)+'</b><small class="'+(I.done&&meIn?(meWin?'won':'lost'):'')+'">'+esc2(res)+'</small></span>'
      +(nd?'<button class="tr2-bt fix" data-x="watch" data-i="'+i+'">Ver luta</button>':'')+'</div>'; });
  return h+'<p class="tr2-hint">Cada duelo é o registro de golpes que o servidor manda; a tela só toca. O vencedor segue com a vida que sobrou contra o próximo da fila.</p>'; }

/* ----- Ranking ----- */
function pRank(N){ const kind=X.rk==='territory'?'territory':'tournament', K=N.ranking(kind), L=K&&Array.isArray(K.list)?K.list.filter(g=>g):[];
  if(!K&&!X.asked['rk'+kind]){ X.asked['rk'+kind]=1; try{ Promise.resolve(N.loadRanking(kind)).then(redraw,redraw); }catch(e){} }
  let h='<div class="tr2-seg" role="group" aria-label="Tipo de ranking">'+[['tournament','Vitórias'],['territory','Territórios']].map(k=>'<button data-x="rk" data-k="'+k[0]+'" aria-pressed="'+(kind===k[0])+'">'+k[1]+'</button>').join('')+'</div>';
  if(!L.length) h+=note(K?'Nenhuma guilda pontuou nesta semana ainda.':'Carregando o ranking…');
  for(const g of L){ const r=g.rank|0, v=kind==='territory'?(g.points|0):(g.wins|0);
    h+='<div class="tr2-rk'+(g.me?' me':'')+'"><span class="n lil'+(r>=1&&r<=3?' top':'')+'">'+nT(r)+'º</span><span class="nm">'+esc2(g.name||'Guilda')+(g.me?' (sua)':'')+'</span><em>'+nT(v)+(kind==='territory'?(v===1?' ponto':' pontos'):(v===1?' vitória':' vitórias'))+'</em></div>'; }
  return h+prizesHtml(); }
const BODY={map:pMap,lineup:pLineup,battles:pBattles,rank:pRank};

function confHtml(){ const c=X.conf; if(!c) return '';
  return '<div class="tr2-conf" role="alertdialog" aria-label="Confirmação"><p>'+c.txt+'</p><div class="tr2-row2"><button class="tr2-bt ghost" data-x="no">Cancelar</button><button class="tr2-bt rose" data-x="yes">'+esc2(c.yes)+'</button></div></div>'; }
function ctlHtml(){ const R=X.rp; if(!R) return '';
  return '<div class="tr2-ctl" role="group" aria-label="Controles da luta"><button data-x="spd" data-k="1" aria-pressed="'+(R.speed===1)+'">x1</button><button data-x="spd" data-k="4" aria-pressed="'+(R.speed===4)+'">x4</button>'
    +(R.done?'<button data-x="again">Ver de novo</button>':'<button data-x="skip">Pular</button>')+'<button data-x="rclose">Fechar</button></div>'; }
function whoTxt(M){ if(M.m!=='on') return heroName(); const z=M.N.state(), my=M.N.my()||{}, ph={declare:'Declarar ataques',battle:'Batalhas',prize:'Prêmios'}[z.phase]||'Temporada';
  return ph+(my.guildId==null?'':my.canDeclare?' · ataques hoje: '+nT(my.attacksLeftToday|0):''); }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{}, M=mode(); X.md=M.m;
  if(M.m==='none'){ V.innerHTML=xWrap(d,'','<div class="tr2">'+bgHtml()+'<div class="tr2-gate"><b class="lil" style="font-size:26px">Torneio do Poder</b><span role="alert">Torneio do Poder indisponível agora.</span><button class="tr2-bt fix" data-x="back" style="min-height:48px;padding:0 26px;font-size:15px">Voltar</button></div></div>'); X.sig='x'; return; }
  let y0=0; try{ const sc0=X.top?null:document.getElementById('tr2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  if(M.m!=='on'){ X.rp=null; X.conf=null; }
  const Hh=+d.H||0, SH=Hh&&Hh<620?160:196; toastTop=SH+8;
  if(!BODY[X.tab]) X.tab='map';
  const body=M.m==='on'?BODY[X.tab](M.N):pClosed(M), R=X.rp;
  const tabs=M.m==='on'?'<div class="tr2-tabs" role="tablist" aria-label="Seções do torneio">'+TABS.map(t=>'<button class="tr2-tab" role="tab" data-x="tab" data-t="'+t[0]+'" aria-selected="'+(X.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>':'';
  const alt=R?'Luta: os dois lutadores do duelo frente a frente, com as barras de vida':heroName()+' com a arma na mão e o pet na frente';
  V.innerHTML=xWrap(d,'','<div class="tr2'+(X.anim?' tr2-in':'')+'">'+bgHtml()
    +'<div class="tr2-stage" style="height:'+SH+'px"><canvas id="tr2_stc" role="img" aria-label="'+esc2(alt)+'"></canvas>'+(R?'':'<div class="tr2-who">'+esc2(whoTxt(M))+'</div>')+'<div id="tr2_ov">'+ovHtml()+'</div></div>'
    +ctlHtml()+tabs+(X.busy?'<div class="tr2-busy" role="status">'+esc2(X.busy)+'</div>':'')+confHtml()
    +'<div id="tr2_scroll" class="tr2-scroll x-scroll">'+body+'</div>'
    +'<div id="tr2_toast">'+(X.toast&&Date.now()-X.toastT<2600?toastHtml(X.toast,toastTop):'')+'</div></div>');
  if(y0){ try{ const sc=document.getElementById('tr2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (resposta do servidor, chave, nível, herói): o tick redesenha só quando muda */
function sig(){ try{ const T=TN(), z=T&&T.state?T.state():{}, st=tStatus(); let ga=0; try{ const GN=window.Sys&&Sys.guildNet; ga=GN&&GN.state?GN.state().at:0; }catch(e){} return [z.on,z.ready,z.at,z.err,z.phase,st.on,st.open,st.reason,ga,heroId(),X.loading].join('|'); }catch(e){ return ''; } }

/* busca do servidor ao abrir (a mesma do js/p_tourney.js): mapa, rankings, batalhas, a escalação de sexta e, se faltar, a lista de membros da guilda */
function netLoad(){ try{ const N=TN(); if(!N||!N.DATA||N.DATA.on!==true||typeof N.refresh!=='function') return; X.loading=true;
    const end=()=>{ X.loading=false; redraw(); };
    Promise.resolve(N.refresh({territory:true})).then(()=>{ try{ if(typeof N.loadLineup==='function') N.loadLineup('d5').then(()=>{ if(X.lu.d5&&X.lu.d5.saved) delete X.lu.d5; redraw(); },()=>{}); }catch(e){}
      try{ const GN=window.Sys&&Sys.guildNet; if(GN&&GN.DATA&&GN.DATA.on===true&&GN.refresh&&!GN.mine()) GN.refresh(S,host()).then(redraw,()=>{}); }catch(e){} end(); },end); }catch(e){ X.loading=false; } }

/* ================= toques (cada data-x da tela tem uma entrada aqui) ================= */
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  tab(b){ const t=String(b.dataset.t||''); if(!BODY[t]||t===X.tab) return; sfx('ui_tap'); X.tab=t; X.conf=null; X.top=true; if(t!=='battles'){ X.rp=null; X.fx=[]; } redraw(); },
  tile(b){ const id=String(b.dataset.id||''); if(!tileOf(id)) return; sfx('ui_tap'); X.sel=X.sel===id?'':id; X.conf=null; redraw(); },
  defend(){ sfx('ui_tap'); X.tab='lineup'; X.conf=null; X.top=true; redraw(); },
  no(){ sfx('ui_tap'); X.conf=null; redraw(); },
  /* declarar ataque: 1º toque abre a confirmação; só o 2º (yes) envia. Quem recusa de verdade é o servidor */
  decl(b){ const N=tNet(), slot=b.dataset.k==='d6'?'d6':'d5', t=tileOf(X.sel); if(!N||!t) return; sfx('ui_tap'); const MD=mapData(N), m=MD.by[t.id]||{}, hh=hourTxt();
    if(MD.isMine(t.id)) return say(T_WHY.own_territory); if(!MD.my.canDeclare) return say(T_WHY.forbidden); if(N.state().phase!=='declare') return say(T_WHY.tourney_phase);
    if((Array.isArray(m.attacks)?m.attacks:[]).some(a=>a&&a.slot===slot)) return say(T_WHY.territory_busy);
    X.conf={tid:t.id,slot:slot,yes:'Declarar ataque',txt:'Atacar <b>'+esc2(tTerrName(t.id))+'</b> '+(slot==='d6'?'no':'na')+' <b>'+dayName(slot)+(hh?' às '+hh:'')+'</b>? O ataque não pode ser desfeito e gasta 1 dos ataques de hoje da guilda.'}; redraw(); },
  yes(){ const c=X.conf, N=tNet(); if(!c||!N||X.busy) return; sfx('ui_tap'); X.conf=null; X.busy='Declarando ataque…'; redraw(); const hh=hourTxt();
    const end=q=>{ X.busy=''; X.toast=q&&q.ok?'Ataque declarado para '+dayName(c.slot)+(hh?' às '+hh:''):(T_WHY[q&&q.reason]||'Não foi possível declarar agora'); X.toastT=Date.now(); if(q&&q.ok) sfx('claim'); redraw(); };
    let pr=null; try{ pr=N.declare(c.tid,c.slot); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); },
  slot(b){ const N=tNet(), k=b.dataset.k==='d6'?'d6':'d5'; if(!N||k===X.slot) return; sfx('ui_tap'); X.slot=k;
    try{ if(!N.lineup(k)||N.lineup(k).lockAt==null) Promise.resolve(N.loadLineup(k)).then(()=>{ if(X.lu[k]&&X.lu[k].saved) delete X.lu[k]; redraw(); },()=>{}); }catch(e){} redraw(); },
  pick(b){ const N=tNet(); if(!N) return; sfx('ui_tap'); const slot=X.slot==='d6'?'d6':'d5', W=tLu(N,slot), my=N.my()||{}, size=tSize(N), lockAt=tLockAt(N,slot), M=tMembers();
    if(tLocked(N,slot)) return say(T_LUWHY.lineup_locked); if(!my.canLineup) return say(T_LUWHY.forbidden);
    const id=String(b.dataset.id), m=M.list.find(x=>String(x.id)===id), i=W.ids.indexOf(id); if(!m) return;
    if(i>=0){ W.ids.splice(i,1); W.saved=false; return redraw(); }
    if(!tElig(m,lockAt)) return say((m.name||'Este membro')+' entrou há menos de 24 h antes da trava'+(slot==='d5'&&tElig(m,tLockAt(N,'d6'))?' (pode no sábado)':''));
    if(W.ids.length>=size) return say('Já são '+size+'. Tire alguém antes'); W.ids.push(id); W.saved=false; redraw(); },
  lu(b){ const N=tNet(); if(!N) return; sfx('ui_tap'); const slot=X.slot==='d6'?'d6':'d5', W=tLu(N,slot), my=N.my()||{}, size=tSize(N), lockAt=tLockAt(N,slot), M=tMembers(), k=b.dataset.k;
    if(tLocked(N,slot)) return say(T_LUWHY.lineup_locked); if(!my.canLineup) return say(T_LUWHY.forbidden);
    if(k==='clear'){ W.ids=[]; W.saved=false; return redraw(); }
    if(k==='best'){ if(!M.hasFc) return; W.ids=M.list.filter(m=>tElig(m,lockAt)).slice(0,size).map(m=>String(m.id)); W.saved=false; return redraw(); }
    if(k==='save'){ if(W.saved||X.busy) return; if(!W.ids.length) return say('Escale pelo menos 1'); X.busy='Salvando a escalação…'; redraw(); const n=W.ids.length;
      const end=q=>{ X.busy=''; if(q&&q.ok){ W.saved=true; if(Array.isArray(q.members)) W.ids=q.members.map(String); sfx('claim'); } X.toast=q&&q.ok?'Escalação de '+dayName(slot)+' salva ('+n+'/'+size+')':(T_LUWHY[q&&q.reason]||'Não foi possível salvar agora'); X.toastT=Date.now(); redraw(); };
      let pr=null; try{ pr=N.setLineup(slot,W.ids.slice()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); } },
  rk(b){ const k=b.dataset.k==='territory'?'territory':'tournament'; if(k===X.rk) return; sfx('ui_tap'); X.rk=k; X.top=true; redraw(); },
  /* a luta: toca o registro da batalha escolhida */
  watch(b){ const N=tNet(), L=N?battleList(N):null, i=parseInt(b.dataset.i,10), bt=L&&L[i]; if(!bt) return; sfx('ui_tap'); const R=buildReplay(bt,i); if(!R) return say('Esta batalha não teve luta'); X.fx=[]; X.rp=R; X.top=true; redraw(); },
  spd(b){ const R=X.rp; if(!R) return; sfx('ui_tap'); R.speed=b.dataset.k==='4'?4:1; redraw(); },
  skip(){ if(!X.rp) return; sfx('ui_tap'); skipReplay(); redraw(); },
  again(){ const R=X.rp, N=tNet(), L=N?battleList(N):null; if(!R||!L||!L[R.bi]) return; sfx('ui_tap'); const sp=R.speed, R2=buildReplay(L[R.bi],R.bi); if(!R2) return; R2.speed=sp; X.fx=[]; X.rp=R2; redraw(); },
  rclose(){ sfx('ui_tap'); X.rp=null; X.fx=[]; redraw(); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!tG()) return;
  if(!tNet()) return say('Em breve: abre com o online');
  if(X.busy&&a!=='spd'&&a!=='skip'&&a!=='again'&&a!=='rclose') return;   /* uma ação de rede por vez */
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){} return u; }

if(!('tourney2' in PANEL_ON)) PANEL_ON.tourney2=false;
const def=Panels.add(N0,{title:'Torneio do Poder',actions:Object.keys(ACT),urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()) return; if(X.toast&&Date.now()-X.toastT>2600){ X.toast=''; try{ const el=document.getElementById('tr2_toast'); if(el) el.innerHTML=''; }catch(e){} }
    if(X.busy||(X.rp&&!X.rp.done)) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&X.sig!=='x'&&sig()!==X.sig) redraw(); },
  busy(){ return !!X.busy||!!(X.rp&&!X.rp.done); },
  onOpen(o){ loopStop(); X.lu={}; X.slot='d5'; X.tab=o&&typeof o.tab==='string'&&BODY[o.tab]?o.tab:'map'; X.sel=''; X.conf=null; X.busy=''; X.toast=''; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.rk='tournament'; X.rp=null; X.fx=[]; X.asked={}; X.loading=false;
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){}   /* pede a carga das imagens já na abertura */
    netLoad(); },
  onClose(){ loopStop(); X.rp=null; X.fx=[]; X.conf=null; X.toast=''; X.busy=''; } });
/* para o teste de fumaça e para conferir no console (somente leitura por convenção) */
window.Tourney2={X:X,def:def,urls:urls,T_WHY:T_WHY,T_LUWHY:T_LUWHY};
})();
