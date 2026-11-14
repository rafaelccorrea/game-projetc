'use strict';
/* ================= TELA GUILDA V2 (docs/proto/v2/Guilda.html) — NASCE DESLIGADA (PANEL_ON.guild2 = false) =================
   Só a TELA. O herói fica sempre à vista no palco (rota única do jogo: window.drawHeroFull, arma na mão e pet na frente), ao lado do estandarte da guilda;
   na aba Chefe o chefe aparece no lugar do estandarte. Abaixo: cartão da guilda e 7 abas (Membros, Doar, Bênçãos, Chefe, Loja, Missões, Territórios).
   NENHUMA regra e NENHUM número aqui:
   - regras, tetos, custos e permissões: Sys.guild (js/sys/guild.js): status, ensure, DATA, can, memberCap, bannerCap, xpBar, territoryBonus, territoryPoints, canCreate, canJoin;
   - tudo que MUDA vem do SERVIDOR pelo Sys.guildNet (js/sys/guildnet.js; contrato docs/API_SERVIDOR.md 10.1 e 10.4): mine() (guilda, membros, pedidos) e as
     ações em Promise {ok, reason}. Durante a Promise a tela mostra "Carregando…"; a recusa do servidor vira texto (tabela WHY).
   SEM O ONLINE INICIADO (Sys.guildNet.state().started falso) a tela mostra o estado honesto ("abre com o online") e as regras reais do módulo; nenhuma guilda,
   membro ou número inventado. Sair, expulsar, passar a liderança, comprar, doar e criar pedem confirmação em dois toques, numa faixa DENTRO da tela
   (abaixo das abas, nunca por cima do herói). Sem emoji, sem alert/confirm/prompt. O cabeçalho (Voltar, título, moedas) é do jogo.
   O arquivo roda em escopo próprio: nenhum nome daqui chega ao js/p_guild.js, que continua valendo enquanto esta chave estiver desligada. */
(function(){
const N='guild2';

/* ---------- leituras dos módulos ---------- */
const GM=()=>{ const G=window.Sys&&Sys.guild; return G&&G.DATA&&typeof G.status==='function'&&typeof G.ensure==='function'?G:null; };
const GN=()=>(window.Sys&&Sys.guildNet)||null;
const host=()=>(window.Sys&&Sys.host)||null;
const netSt=()=>{ try{ const n=GN(); return n&&typeof n.state==='function'?n.state():null; }catch(e){ return null; } };
const online=()=>{ const z=netSt(); return !!(z&&z.on&&z.started); };
const mineNow=()=>{ try{ const n=GN(); return (n&&typeof n.mine==='function'&&n.mine())||null; }catch(e){ return null; } };
const gameNow=()=>{ try{ const h=host(); if(h&&h.now) return h.now(); }catch(e){} return Date.now(); };
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const saved=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const isN=v=>typeof v==='number'&&isFinite(v);
const num=v=>isN(v)?v:0;
const c01=v=>Math.max(0,Math.min(1,v));
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return String(Math.round(num(v))); };
const fcT=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return kfT(v); };
const dec=v=>String(Math.round(num(v)*100)/100).replace('.',',');
const pick=(o,...ks)=>{ for(const k of ks) if(o&&isN(o[k])) return o[k]; return null; };
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
const myFc=()=>{ try{ const T=Sys.tower; if(T&&T.playerStats) return num(T.playerStats(S,host()).fc); }catch(e){} return 0; };
const coinName=n=>{ let c='Brasão'; try{ c=String(GM().DATA.coin||c); }catch(e){} return n===1?c:(c==='Brasão'?'Brasões':c+'s'); };
const roleKey=r=>(r==='leader'||r==='officer')?r:'member';
const roleName=r=>{ try{ return String(GM().DATA.roleName[roleKey(r)]); }catch(e){ return 'Membro'; } };
const can=a=>{ try{ return !!GM().can(S,a); }catch(e){ return false; } };
function ago(ms){ const h=Math.floor(Math.max(0,gameNow()-num(ms))/36e5); return h<1?'há pouco':h<48?'há '+h+' h':'há '+Math.floor(h/24)+' dias'; }
function hm(ms){ const h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4); return h>=24?Math.floor(h/24)+' d '+(h%24)+' h':h+' h '+m+' min'; }

/* ---------- recusas (o servidor decide; aqui só o texto) ---------- */
const WHY={off:'As guildas ainda não foram ligadas',server:'Em breve: abre com o online',forbidden:'O seu cargo não permite isso',guild_full:'A guilda está cheia',
  rejoin_cooldown:'Você saiu desta guilda há pouco: espere para voltar',cooldown:'Você saiu de uma guilda há pouco: espere para entrar em outra',name_taken:'Já existe uma guilda com esse nome',
  name_filtered:'Esse nome não é permitido. Escolha outro',level_required:'Seu nível ainda não libera isso',already_in_guild:'Você já está em uma guilda',in_guild:'Você já está em uma guilda',
  leader_must_transfer:'Passe a liderança antes de sair',not_in_guild:'Você não está numa guilda',daily_limit:'Já feito hoje. Volta à meia-noite de Brasília',weekly_limit:'Limite desta semana atingido',
  guild_level:'O nível da guilda ainda não libera este item',boss_down:'O chefe desta semana já foi derrubado',not_contributed:'Os Brasões desta missão são só para quem ajudou nela',
  not_enough_coin:'Faltam Brasões',not_enough_xp:'Falta XP da guilda',cap:'Já está no teto do nível da guilda',not_found:'Isso ainda não está disponível',
  bad_request:'Não deu certo. Confira e tente de novo',too_many_officers:'A guilda já tem o máximo de oficiais',not_done:'A missão ainda não terminou',already_claimed:'Você já resgatou esta missão',
  brasas:'Faltam Brasas: jogue para ganhar mais na sua Fogueira',brasas_over:'Suas Brasas ainda estão sendo salvas: jogue um pouco e tente de novo',
  brasas_unverified:'Seu progresso ainda não foi enviado: tente de novo em instantes',hook:'Dar Brasas ainda não está disponível',done:'Já feito hoje. Volta à meia-noite de Brasília',
  day:'Limite de Brasas de hoje atingido',guild:'Entre numa guilda para alimentar a fogueira',
  net_off:'Sem conexão: tente de novo',timeout:'Sem conexão: tente de novo',offline:'Sem conexão: tente de novo'};
const why=r=>WHY[r]||'Não foi possível agora. Tente de novo';
/* recusa inteira ({reason, details, retryAfterMs}): no 429 daily_limit (contrato 10.5) mostra o tempo que falta quando o retryAfterMs chega; sem ele, a virada de Brasília */
/* recusas do nome montado e do estilo (name, name_taken, style, leader, rename_cooldown, restyle_cooldown): o texto é do Sys.guild.reasonText */
const rt=r=>{ try{ return String(GM().reasonText(r)||''); }catch(e){ return ''; } };
function whyR(r){ const R=r&&r.reason, t=rt(r); if(t) return t; if(R!=='daily_limit') return why(R); const ms=num(r.retryAfterMs)||num(r.details&&r.details.retryAfterMs); if(!(ms>0)) return why(R);
  const h=Math.floor(ms/36e5), m=Math.floor(ms%36e5/6e4); return 'Já feito hoje. Volta em '+(h>0?h+' h '+m+' min':Math.max(1,m)+' min'); }
function whyLocal(c){ const R=c&&c.reason;
  if(R==='level') return 'A guilda libera no nível '+nT(c.needLevel||0);
  if(R==='cooldown') return 'Espere '+hm(num(c.msLeft))+' depois de sair de uma guilda';
  if(R==='money') return 'Falta ouro: criar custa '+kfT(c.gold||0);
  return why(R); }

/* ---------- arte (só o que já existe no jogo) ---------- */
const IC={coin:'assets/ui/coin.png',gem:'assets/ui/gem.png',chest:'assets/ui/chest.png',forge:'assets/icons/menu/forge.png',pets:'assets/icons/menu/pets.png',mounts:'assets/icons/menu/mounts.png',tourney:'assets/icons/menu/tourney.png'};
const GIVE_IC={forge:IC.forge,food:IC.pets,essence:IC.chest,stones:IC.forge,mountFrags:IC.mounts};
const BN={atk:'Ataque',hp:'Vida',def:'Defesa',gold:'Ouro',food:'Ração'};
const DN={gold_s:'Ouro (pequena)',gold_l:'Ouro (grande)',gems:'Diamantes'};
const ERA0=['Pré','Ant','Med','Pól','Ind','Mod','Fut','Sub','Cel'];
const SV={
  coin:'<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" style="flex:none;vertical-align:-2px"><path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z" fill="#5ee7ff" stroke="#16306e" stroke-width="1.6"></path><path d="M12 6.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6-3.2-1.7-3.2 1.7.6-3.6-2.6-2.5 3.6-.5z" fill="#fff6d6"></path></svg>',
  atk:'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ff9f6b" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M14.5 3.5l6 6-9 9-3-3zM5 19l3-3M3.5 16.5l4 4"></path></svg>',
  hp:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 6-8 11-8 11z" fill="#ff6b9a"></path></svg>',
  def:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 2l8 3v6c0 5.5-3.6 9.3-8 11-4.4-1.7-8-5.5-8-11V5z" fill="#7aa6ff" stroke="#16306e" stroke-width="1.4"></path></svg>',
  gold:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="#ffd25e" stroke="#9a5a10" stroke-width="1.6"></circle><path d="M12 7.5v9M9.5 10h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4" stroke="#9a5a10" stroke-width="1.6" fill="none"></path></svg>',
  food:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M5 11h14l-1.5 8.5h-11z" fill="#c98a4b" stroke="#6b3d12" stroke-width="1.3"></path><circle cx="9" cy="9" r="2.5" fill="#ffb36b"></circle><circle cx="14.5" cy="8" r="3" fill="#ff8a5c"></circle></svg>',
  cal:'<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#5ef0a0" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="3"></rect><path d="M4 10h16M9 3v4M15 3v4M9 14.5l2 2 4-4"></path></svg>',
  info:'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#5ee7ff" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none;margin-top:1px"><circle cx="12" cy="12" r="10"></circle><path d="M12 11v6M12 7.5v.5"></path></svg>',
  emb:'<svg class="gd2-emb" viewBox="0 0 44 44" aria-hidden="true"><path d="M22 2l17 6v12c0 11-7.5 18.5-17 22C12.5 38.5 5 31 5 20V8z" fill="#2a3a96" stroke="#ffd25e" stroke-width="2.5"></path><path d="M22 11l3 6.3 7 .9-5.1 4.8 1.3 6.9L22 26.6l-6.2 3.3 1.3-6.9-5.1-4.8 7-.9z" fill="#ffd25e"></path></svg>' };
const coinTxt=v=>'<span class="gd2-cn">'+SV.coin+esc2(nT(v))+'</span>';
const img=(u,z)=>'<img src="'+u+'" alt="" style="width:'+(z||36)+'px;height:'+(z||36)+'px;object-fit:contain;flex:none">';
const bossUrl=lv=>'assets/enemies/era'+Math.max(0,Math.min(8,(lv|0)-1))+'_boss.png';

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.gd2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--rose:#ff6b9a;--green:#5ef0a0;--text:#eef1ff;--muted:#9aa6d6;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.gd2 *{box-sizing:border-box}
.gd2 button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.gd2 .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.gd2-in{animation:gd2-fade .22s ease-out}
@keyframes gd2-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.gd2-bg{position:absolute;left:0;right:0;top:0;height:360px;pointer-events:none}
.gd2-bg2{position:absolute;left:0;right:0;top:200px;height:160px;pointer-events:none;background:linear-gradient(180deg,rgba(11,16,48,0),var(--night))}
.gd2-stage{position:relative;z-index:2;flex:none;min-width:0}
.gd2-stage canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.gd2-who{position:absolute;z-index:3;left:50%;top:4px;transform:translateX(-50%);display:flex;align-items:center;gap:6px;min-height:24px;max-width:94%;padding:2px 10px;border-radius:12px;background:linear-gradient(90deg,rgba(94,231,255,.22),rgba(169,123,255,.22));border:1px solid rgba(94,231,255,.55);font-weight:900;font-size:11px;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.gd2-who i{flex:none;width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green)}
.gd2-bt,.xs .gd2-bt{flex:none;min-width:72px;min-height:40px;padding:4px 10px;border-radius:11px;border:0;font-weight:900;font-size:12.5px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:4px;text-align:center;overflow-wrap:anywhere}
.gd2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.gd2-bt.rose,.xs .gd2-bt.rose{background:linear-gradient(180deg,#ff9fbe,#e0477a);color:#3a0618;box-shadow:0 3px 0 #8c1d44}
.gd2-bt.off,.xs .gd2-bt.off{background:rgba(255,255,255,.06);color:#9aa6d6;box-shadow:none;border:1px solid rgba(130,150,255,.28)}
.gd2-bt.ghost,.xs .gd2-bt.ghost{background:rgba(255,255,255,.08);color:#eef1ff;box-shadow:none;border:1px solid rgba(160,180,255,.5)}
.gd2-bt.wide{width:100%;min-height:44px;font-size:14px}
.gd2-pill{flex:none;font-size:10px;font-weight:900;padding:3px 8px;border-radius:8px;line-height:1.15;text-align:center}
.gd2-pill.on{background:rgba(94,240,160,.15);color:var(--green)}
.gd2-pill.off{background:rgba(255,255,255,.07);color:var(--muted)}
.gd2-gc{position:relative;z-index:3;flex:none;margin:4px 12px 0;padding:8px 10px;border-radius:16px;background:linear-gradient(160deg,rgba(94,231,255,.16),rgba(24,33,86,.92) 60%);border:2px solid rgba(94,231,255,.45);min-width:0}
.gd2-scroll .gd2-gc{margin:0 0 8px}
.gd2-gh{display:flex;align-items:center;gap:9px;min-width:0}
.gd2-emb{flex:none;width:44px;height:44px}
.gd2-gh .t{flex:1;min-width:0}
.gd2-gh .nm{font-size:19px;letter-spacing:.4px;line-height:1.1;overflow-wrap:anywhere}
.gd2-gh small{display:block;font-size:11px;font-weight:800;color:var(--muted);line-height:1.3;overflow-wrap:anywhere}
.gd2-gh small b{color:var(--text)}
.gd2-lvb{flex:none;text-align:center;font-weight:900;font-size:10px;color:var(--muted);line-height:1.05}
.gd2-lvb b{display:block;font-size:24px;color:var(--cyan)}
.gd2-bar{height:8px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:6px}
.gd2-bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#5ee7ff,#a97bff)}
.gd2-bar.red i{background:linear-gradient(90deg,#ff6b6b,#ff9fbe)}
.gd2-bar.grn i{background:linear-gradient(90deg,#5ef0a0,#22c47a)}
.gd2-prog{font-size:11px;font-weight:900;margin-top:5px;display:flex;justify-content:space-between;gap:8px;min-width:0}
.gd2-prog span{min-width:0;overflow-wrap:anywhere}
.gd2-prog span:last-child{color:var(--gold);text-align:right}
.gd2-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.gd2-chip{font-size:10px;font-weight:900;padding:2px 7px;border-radius:8px;background:rgba(5,8,28,.55);border:1px solid var(--line)}
.gd2-chip b{color:var(--gold)}
.gd2-chip.g b{color:var(--green)}
.gd2-tabs{position:relative;z-index:3;flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:6px 12px 0}
.gd2-tab,.xs .gd2-tab{min-width:0;min-height:40px;border-radius:10px;border:1px solid var(--line);background:rgba(255,255,255,.05);font-weight:900;font-size:11.5px;line-height:1.1;color:#9aa6d6;padding:0 2px;overflow-wrap:anywhere}
.gd2-tab[aria-selected="true"],.xs .gd2-tab[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);color:#fff;border-color:#7f93ff}
.gd2-busy{position:relative;z-index:3;flex:none;margin:6px 12px 0;padding:6px 10px;border-radius:11px;background:rgba(94,231,255,.12);border:1px solid rgba(94,231,255,.45);font-size:12px;font-weight:900;color:#cdeffd;text-align:center}
.gd2-conf{position:relative;z-index:3;flex:none;margin:6px 12px 0;padding:9px 10px;border-radius:14px;background:#2a1530;border:2px solid var(--rose);min-width:0}
.gd2-conf p{margin:0 0 8px;font-size:12.5px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.gd2-conf .row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.gd2-conf .gd2-bt{min-width:0;min-height:44px}
.gd2-scroll{position:relative;z-index:3;flex:1;min-height:0;min-width:0;padding:8px 12px 16px}
.gd2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:10px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.gd2-sec:first-child{margin-top:0}
.gd2-sec span{min-width:0;overflow-wrap:anywhere}
.gd2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.gd2-sec b{color:var(--gold)}
.gd2-hint{font-size:11px;color:var(--muted);margin:6px 0 8px;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.gd2-hint b{color:var(--gold)}
.gd2-rule{display:flex;gap:8px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:rgba(94,231,255,.1);border:1px solid rgba(94,231,255,.45);font-size:11.5px;font-weight:800;color:#cdeffd;line-height:1.4;margin:0 0 6px;min-width:0}
.gd2-rule span{min-width:0;overflow-wrap:anywhere}
.gd2-rule b{color:#fff}
.gd2-note{padding:12px;border-radius:13px;border:1px dashed var(--line2);background:rgba(5,8,28,.45);text-align:center;font-size:12px;font-weight:800;color:var(--muted);line-height:1.4;margin-bottom:6px;overflow-wrap:anywhere}
.gd2-note .gd2-bt{margin-top:8px}
.gd2-row,.xs .gd2-row{width:100%;display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:13px;background:var(--glass);border:1px solid var(--line);margin-bottom:6px;min-width:0;min-height:44px;text-align:left;color:#eef1ff;font-size:12px}
.gd2-row.me{border-color:var(--gold)}
.gd2-row.sel{border-color:#7f93ff}
.gd2-row .ic{flex:none;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(5,8,28,.55);border:1px solid var(--line2)}
.gd2-row .mi{flex:1;min-width:0}
.gd2-row .mi b{display:block;font-size:13px;line-height:1.2;overflow-wrap:anywhere}
.gd2-row .mi b span{color:var(--gold)}
.gd2-row .mi small{display:block;font-size:10.5px;color:var(--muted);font-weight:800;line-height:1.3;overflow-wrap:anywhere}
.gd2-row .mi small em{font-style:normal;color:var(--green)}
.gd2-av{flex:none;width:34px;height:34px;border-radius:10px;background:#1a2366;border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--cyan)}
.gd2-role{flex:none;font-size:9.5px;font-weight:900;padding:2px 6px;border-radius:7px;text-transform:uppercase;letter-spacing:.4px}
.gd2-role.leader{background:rgba(255,210,94,.18);color:var(--gold)}
.gd2-role.officer{background:rgba(94,231,255,.15);color:var(--cyan)}
.gd2-role.member{background:rgba(255,255,255,.07);color:var(--muted)}
.gd2-mact{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:-2px 0 8px}
.gd2-mact .gd2-bt{min-width:0}
.gd2-pips{display:flex;gap:2px;margin-top:4px}
.gd2-pips i{flex:1;height:7px;border-radius:3px;background:rgba(255,255,255,.1)}
.gd2-pips i.on{background:linear-gradient(90deg,#ffe58a,#f4a52a)}
.gd2-pips i.cap{background:rgba(255,255,255,.04);outline:1px dashed rgba(255,255,255,.12)}
.gd2-boss{border-radius:14px;padding:9px;background:linear-gradient(160deg,rgba(255,107,154,.16),rgba(24,33,86,.9) 60%);border:1px solid rgba(255,107,154,.45);margin-bottom:6px;min-width:0}
.gd2-band{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);gap:6px;font-size:11px;font-weight:800;padding:5px 0;border-top:1px solid rgba(130,150,255,.14);line-height:1.3}
.gd2-band span{min-width:0;overflow-wrap:anywhere}
.gd2-band span:last-child{text-align:right;color:var(--gold)}
.gd2-cn{display:inline-flex;align-items:center;gap:3px}
.gd2-ms{padding:8px 9px;border-radius:13px;background:var(--glass);border:1px solid var(--line);margin-bottom:6px;min-width:0}
.gd2-ms .row{display:flex;align-items:center;gap:8px;min-width:0}
.gd2-ms .row b{flex:1;min-width:0;font-size:12.5px;overflow-wrap:anywhere}
.gd2-ms .row>span{flex:none;font-size:11px;font-weight:900;color:var(--muted)}
.gd2-map{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:3px;margin-bottom:6px}
.gd2-map span{min-width:0;min-height:24px;border-radius:6px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.05);font-size:9px;font-weight:900;color:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center}
.gd2-map span.k{border:0;background:none;color:var(--muted);min-height:14px;font-size:8.5px}
.gd2-map span.own{background:rgba(169,123,255,.28);border-color:#a97bff;color:#efe6ff}
.gd2-map span.mine{background:rgba(94,240,160,.35);border-color:var(--green);color:#eafff3}
.gd2-map span.cap{grid-column:1/-1;min-height:28px;font-size:11px;letter-spacing:.6px}
.gd2-leg{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10px;font-weight:800;color:var(--muted);margin:2px 0 8px}
.gd2-leg i{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:4px;vertical-align:-1px}
.gd2-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;margin:4px 0 8px}
.gd2-week span{min-width:0;border-radius:7px;padding:4px 0;text-align:center;font-size:9px;font-weight:900;background:rgba(255,255,255,.05);color:var(--muted);line-height:1.15;overflow-wrap:anywhere}
.gd2-week span.now{background:rgba(255,210,94,.2);color:var(--gold);outline:1px solid var(--gold)}
.gd2-pk2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:6px;min-width:0}
.gd2-pk2 .gd2-bt{min-width:0;min-height:44px}
.gd2-pk,.xs .gd2-pk{min-width:0;min-height:44px;padding:4px 9px;border-radius:11px;border:1px solid var(--line2);background:rgba(5,8,28,.7);color:#eef1ff;text-align:left;font-weight:900;font-size:13px;line-height:1.15;overflow-wrap:anywhere}
.gd2-pk small{display:block;font-size:9.5px;font-weight:900;color:var(--muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:1px}
.gd2-pk b{display:block}
.gd2-pk[aria-expanded="true"],.xs .gd2-pk[aria-expanded="true"]{border-color:var(--cyan)}
.gd2-pl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px;max-height:232px;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:6px;border-radius:12px;border:1px solid var(--cyan);background:rgba(5,8,28,.7);margin-bottom:6px;min-width:0}
.gd2-po,.xs .gd2-po{min-width:0;min-height:40px;padding:2px 6px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:#eef1ff;font-weight:800;font-size:12.5px;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.gd2-po[aria-selected="true"],.xs .gd2-po[aria-selected="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);border-color:#7f93ff;color:#fff}
.gd2-pv{padding:9px 10px;border-radius:13px;border:1px dashed var(--line2);background:rgba(5,8,28,.45);text-align:center;font-size:21px;letter-spacing:.4px;line-height:1.15;color:var(--gold);margin-bottom:6px;overflow-wrap:anywhere}
.gd2-pv small{display:block;font:900 9.5px Nunito,system-ui,sans-serif;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin-bottom:2px}
.gd2-toast{position:absolute;left:50%;z-index:40;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;overflow-wrap:anywhere;pointer-events:none;animation:gd2-tin .25s ease-out both}
@keyframes gd2-tin{from{opacity:0;transform:translate(-50%,-8px)}}
.gd2-gate{position:relative;z-index:3;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.gd2-gate span{font-size:13px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.gd2-in,.gd2-toast{animation:none}}
`; document.head.appendChild(el); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const TABS=[['members','Membros'],['donate','Doar'],['bless','Bênçãos'],['boss','Chefe'],['shop','Loja'],['miss','Missões'],['terr','Territórios']];
const X={tab:'members',md:'',sel:'',conf:null,busy:'',toast:'',toastT:0,anim:true,top:true,sig:'',tk:0,d:{},pk:{ca:null,cb:null,cs:0,ra:null,rb:null,qa:null,qb:null},open:'',plk:'',ren:false,hit:null,raf:0,t0:0,t:0,glow:0,fx:[],lv:1};
let toastTop=190;
const toastHtml=(m,top)=>'<div class="gd2-toast" role="status" style="top:'+top+'px">'+esc2(m)+'</div>';
function say(m){ X.toast=String(m||''); X.toastT=Date.now(); redraw(); }

/* ---------- rede: uma ação por vez; "Carregando…" enquanto a Promise não volta; a recusa vira texto ---------- */
function run(label,fn,okMsg,after){ if(X.busy) return; X.busy=label||'Carregando…'; X.conf=null; redraw();
  const end=r=>{ X.busy=''; if(r&&r.ok){ try{ if(after) after(r); }catch(e){} saved(); sfx('claim'); X.toast=String(typeof okMsg==='function'?okMsg(r):okMsg); } else X.toast=whyR(r); X.toastT=Date.now(); redraw(); };
  let pr=null; try{ pr=fn(); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* leituras por aba (lista de guildas, chefe, loja, missões): {st:'load'|'ok'|'err', d, why} */
function loadSec(k){ const n=GN(); if(!n||!online()) return; const h=host();
  /* busca sem texto: GET /guilds?a=<nameA>&b=<nameB> (uma parte, as duas ou nenhuma = todas); docs/GUILDA_NOME.md seção 5 */
  const fn={list:()=>n.list(S,h,isN(X.pk.qa)||isN(X.pk.qb)?{a:isN(X.pk.qa)?X.pk.qa:null,b:isN(X.pk.qb)?X.pk.qb:null}:null),boss:()=>n.boss(S,h),shop:()=>n.shop(S,h),miss:()=>n.missions(S,h)}[k]; if(!fn) return;
  const tok=X.d[k]={st:'load'}; let pr=null; try{ pr=fn(); }catch(e){ pr=null; }
  const end=r=>{ if(X.d[k]!==tok) return; X.d[k]=r&&r.ok?{st:'ok',d:r}:{st:'err',why:why(r&&r.reason)}; redraw(); };
  Promise.resolve(pr).then(end,()=>end(null)); }
function sec(k){ if(!X.d[k]) loadSec(k); return X.d[k]||{st:'load'}; }
const arr=r=>Array.isArray(r)?r:r&&Array.isArray(r.data)?r.data:r&&Array.isArray(r.list)?r.list:r&&Array.isArray(r.items)?r.items:[];
function secHtml(z,k){ return z.st==='ok'?'':z.st==='err'?'<div class="gd2-note" role="alert">'+esc2(z.why)+'<br><button class="gd2-bt ghost" data-x="retry" data-k="'+k+'">Tentar de novo</button></div>':'<div class="gd2-note" role="status">Carregando…</div>'; }

/* ---------- PALCO (canvas): chão, estandarte ou chefe, brilho da bênção, herói do jogo com o pet na frente, números ---------- */
const IMGS={};
function imgOf(u){ let o=IMGS[u]; if(o!==undefined) return o; try{ if(typeof Image==='undefined'){ IMGS[u]=null; return null; } o=new Image(); o.src=u; IMGS[u]=o; }catch(e){ o=IMGS[u]=null; } return o; }
const okImg=i=>!!(i&&i.complete&&i.naturalWidth>0);
const canDraw=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
function drawFlag(x,g,t){ const FX=g.RX, top=g.GY-Math.min(128,g.H*0.72), w=74, h=58;
  x.save(); x.globalAlpha=.3; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(FX,g.GY+2,22,5,0,0,7); x.fill(); x.restore();
  x.fillStyle='#6b4a22'; x.fillRect(FX-2,top,4,g.GY-top+2); x.fillStyle='#ffd25e'; x.beginPath(); x.arc(FX,top-3,5,0,7); x.fill();
  x.save(); x.beginPath(); x.moveTo(FX+2,top+4);
  for(let i=0;i<=12;i++){ const u=i/12; x.lineTo(FX+2+u*w,top+4+Math.sin(t*3+u*5)*4*u); }
  for(let i=12;i>=0;i--){ const u=i/12; x.lineTo(FX+2+u*w,top+4+h+Math.sin(t*3+u*5)*4*u-(u>0.75?(u-0.75)*30:0)); }
  x.closePath(); const gr=x.createLinearGradient(FX,top,FX+w,top+h); gr.addColorStop(0,'#2a3a96'); gr.addColorStop(1,'#5b2a8a'); x.fillStyle=gr; x.fill(); x.strokeStyle='#ffd25e'; x.lineWidth=2; x.stroke(); x.restore();
  const cx=FX+2+w*0.45, cy=top+4+h*0.45+Math.sin(t*3+2.2)*2;
  x.save(); x.translate(cx,cy); x.fillStyle='#ffd25e'; x.beginPath(); x.moveTo(0,-14); x.lineTo(11,-9); x.lineTo(11,2); x.quadraticCurveTo(10,11,0,15); x.quadraticCurveTo(-10,11,-11,2); x.lineTo(-11,-9); x.closePath(); x.fill();
  x.fillStyle='#2a3a96'; x.beginPath(); x.moveTo(0,-8); x.lineTo(2.4,-2.5); x.lineTo(8,-2); x.lineTo(3.6,1.6); x.lineTo(5,7.5); x.lineTo(0,4.5); x.lineTo(-5,7.5); x.lineTo(-3.6,1.6); x.lineTo(-8,-2); x.lineTo(-2.4,-2.5); x.closePath(); x.fill(); x.restore(); }
function drawBoss(x,g,t){ const B=imgOf(bossUrl(X.lv)); if(!okImg(B)) return drawFlag(x,g,t); const sz=Math.min(g.H*0.82,g.W*0.42), br=1+0.015*Math.sin(t*2), age=X.hit?t-X.hit.t:9, sh=age>=0&&age<0.35?Math.sin(age*80)*3:0;
  x.save(); x.globalAlpha=.3; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(g.RX,g.GY+3,sz*0.33,7,0,0,7); x.fill(); x.restore();
  x.save(); x.translate(g.RX+sh,g.GY+sz*0.05); x.scale(1,br); x.drawImage(B,-sz/2,-sz,sz,sz); x.restore(); }
function drawGlow(x,g,t){ if(!(X.glow>0)) return; const a=Math.min(1,X.glow), cy=g.GY-g.H*0.34; x.save(); x.globalCompositeOperation='lighter';
  const gr=x.createRadialGradient(g.LX,cy,6,g.LX,cy,90); gr.addColorStop(0,'rgba(255,226,140,'+(0.55*a).toFixed(3)+')'); gr.addColorStop(1,'rgba(255,226,140,0)'); x.fillStyle=gr; x.beginPath(); x.arc(g.LX,cy,90,0,7); x.fill(); x.restore(); }
function drawFx(x,g,t){ X.fx=X.fx.filter(p=>t-p.t<1.4&&t>=p.t-0.01); for(const p of X.fx){ const a=c01((t-p.t)/1.4), px=p.s?g.RX:g.LX, py=g.GY-g.H*0.62-a*26;
    x.save(); x.globalAlpha=1-a; x.font='900 14px Nunito,sans-serif'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.6)'; x.fillStyle=p.c; x.strokeText(p.txt,px,py); x.fillText(p.txt,px,py); x.restore(); } }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||176;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), dt=Math.max(0,Math.min(0.1,t-X.t)); X.t=t; if(X.glow>0) X.glow=Math.max(0,X.glow-dt*0.5);
  const x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0); base(); x.clearRect(0,0,w,h);
  const hs=(typeof HS==='number'&&HS>0)?HS:155, hk=Math.min(0.6,(h-30)/256), g={W:w,H:h,LX:Math.round(w*0.36),RX:Math.round(w*0.74),GY:h-18,k:hk*256/hs};
  const part=fn=>{ try{ fn(); }catch(err){ try{ x.restore(); }catch(e2){} } base(); };
  part(()=>{ const gr=x.createRadialGradient(g.W/2,g.GY,10,g.W/2,g.GY,g.W*0.42); gr.addColorStop(0,'rgba(94,231,255,.25)'); gr.addColorStop(1,'rgba(94,231,255,0)'); x.fillStyle=gr; x.beginPath(); x.ellipse(g.W/2,g.GY,g.W*0.42,16,0,0,7); x.fill(); });
  part(()=>{ if(X.md==='in'&&X.tab==='boss') drawBoss(x,g,t); else drawFlag(x,g,t); });
  part(()=>drawGlow(x,g,t));
  part(()=>{ if(canDraw()) window.drawHeroFull(x,g.LX,g.GY,g.k,{t:t,mount:false}); });   /* herói a pé, arma na mão; o pet é o último desenho do drawHeroFull (na frente) */
  part(()=>drawFx(x,g,t)); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('gd2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('gd2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }
const fx=(txt,c,s)=>{ X.fx.push({txt:String(txt),c:c,s:s?1:0,t:X.t}); if(X.fx.length>12) X.fx.shift(); };

/* ================= HTML ================= */
const bgHtml=()=>'<div class="gd2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.45,0.9):'#16110d')+'"></div><div class="gd2-bg2"></div>';
const secH=(a,b)=>'<div class="gd2-sec"><span>'+a+'</span><span>'+(b||'')+'</span></div>';
const rule=t=>'<div class="gd2-rule">'+SV.info+'<span>'+t+'</span></div>';
/* em que estado a tela está: none (sem módulo) · closed (sem online) · out (online, sem guilda) · in (na guilda) */
function mode(){ const G=GM(); if(!G) return {m:'none'}; let st=null; try{ st=G.status(S,host()); }catch(e){ st=null; } st=st||{on:false,open:false,reason:'off'};
  if(!st.open||!online()) return {m:'closed',st:st}; const o=G.ensure(S); return {m:o.id?'in':'out',st:st,o:o}; }

/* ----- sem o online: estado honesto e as regras reais do módulo ----- */
function rulesHtml(){ const G=GM(), D=G.DATA, B=D.banners, T=D.territory; let cost=''; try{ cost=kfT(G.createCost(host())); }catch(e){}
  const row=(a,b)=>'<div class="gd2-row"><span class="mi"><b>'+esc2(a)+'</b><small>'+esc2(b)+'</small></span></div>';
  return secH('Como a guilda funciona','regras do jogo')
    +row('Vagas',nT(D.members.base)+' no nível 1, +'+nT(D.members.perLevel)+' por nível, até '+nT(D.members.max))
    +row('Criar',(cost?cost+' de ouro':'ouro de umas 8 h jogando')+'. Sem diamante')
    +row('Cargos','Líder (1), oficiais (até '+nT(D.maxOfficers)+') e membros')
    +row('Bênçãos (estandartes)','Valem para todos. Teto no nível '+nT(D.xpLevel.maxLevel)+': '+Object.keys(B.cap).map(k=>(BN[k]||k)+' +'+dec(B.cap[k])+'%').join(', '))
    +row('Territórios','Cada um: ouro +'+dec(T.per.gold)+'%, XP +'+dec(T.per.xp)+'%, itens +'+dec(T.per.drop)+'%. Capital vale '+nT(T.capitalMult)+'x. Teto: '+dec(T.cap.gold)+'/'+dec(T.cap.xp)+'/'+dec(T.cap.drop)+'%')
    +row('Loja da guilda','Só por '+coinName(2)+'. Sem diamante e sem sorteio'); }
function pClosed(M){ const R=M.st.reason, z=netSt();
  const txt=R==='off'?'Guildas: em breve':R==='level'?'A guilda libera no nível '+nT(M.st.needLevel||0):'Em breve: abre com o online';
  const sub=R==='off'||R==='level'?'':'As guildas ainda não abriram. Volte mais tarde.';
  return '<div class="gd2-note" role="status"><b class="lil" style="display:block;font-size:20px;color:#eef1ff">Guilda</b>'+esc2(txt)+(sub?'<br>'+esc2(sub):'')+'</div>'+rulesHtml(); }

/* ----- NOME MONTADO e ESTILO: seletores de toque, sem teclado (decisão do dono: nenhum texto livre de jogador; docs/GUILDA_NOME.md) -----
   Chaves: ca/cb/cs = criar (1ª parte, 2ª parte, estilo) · ra/rb = trocar o nome (líder) · qa/qb = busca (null = qualquer) · st = estilo da guilda (líder).
   Um botão mostra a escolha e abre a lista rolável logo abaixo (uma lista aberta por vez); as listas são as do Sys.guild (nameParts, styles). */
const PK={ca:['a','Primeira parte do nome'],cb:['b','Segunda parte do nome'],cs:['s','Estilo da guilda'],ra:['a','Primeira parte do novo nome'],rb:['b','Segunda parte do novo nome'],
  qa:['a','Busca pela primeira parte'],qb:['b','Busca pela segunda parte'],st:['s','Estilo da guilda']};
const pkAny=k=>k==='qa'||k==='qb';
function pkItems(k){ const G=GM(), t=PK[k]?PK[k][0]:'', P=(G&&G.nameParts)||{}, L=t==='a'?P.a:t==='b'?P.b:t==='s'?(G&&G.styles):null; return Array.isArray(L)?L:[]; }
/* estilo atual da guilda: o do Sys.guild (status().styleIdx); enquanto o espelho não traz o índice, vale o da última leitura do servidor (GET /guild) */
function styleNow(){ const G=GM(); let i=null; try{ i=G.ensure(S).styleIdx; }catch(e){} if(G&&!G.styleValid(i)){ const g=(mineNow()||{}).guild||{}; i=G.styleValid(g.styleIdx)?g.styleIdx:null; } return isN(i)?i:null; }
const pkCur=k=>k==='st'?styleNow():X.pk[k];
/* os seletores de cada estado: sem guilda = criar e buscar; na guilda = nome e estilo, só para o líder (o Sys.guild e o servidor conferem de novo) */
function pkOk(k){ if(!PK[k]) return false; if(X.md==='out') return k[0]==='c'||k[0]==='q'; if(X.md!=='in') return false; let r=''; try{ r=GM().ensure(S).role; }catch(e){} return r==='leader'&&(k[0]==='r'||k==='st'); }
/* garante um par válido nos seletores de criar e de trocar o nome (começa sorteado: o botão Criar nunca fica sem nome) */
function seed(){ const G=GM(), p=X.pk; if(!G||typeof G.nameRandom!=='function') return; for(const k of ['c','r']) if(!G.nameValid(p[k+'a'],p[k+'b'])){ const r=G.nameRandom(); p[k+'a']=r.a; p[k+'b']=r.b; } if(!G.styleValid(p.cs)) p.cs=0; }
function pkBtn(k,cap){ const L=pkItems(k), i=pkCur(k), v=isN(i)&&L[i]!=null?String(L[i]):(pkAny(k)?'Qualquer':'Escolher');
  return '<button class="gd2-pk" data-x="pk" data-k="'+k+'" aria-expanded="'+(X.open===k)+'" aria-label="'+esc2(PK[k][1]+': '+v)+'"><small>'+esc2(cap)+'</small><b>'+esc2(v)+'</b></button>'; }
function pkList(k){ if(X.open!==k) return ''; const L=pkItems(k), i=pkCur(k), o=(v,t,on)=>'<button class="gd2-po" role="option" data-x="opt" data-k="'+k+'" data-i="'+v+'" aria-selected="'+on+'">'+esc2(t)+'</button>';
  return '<div id="gd2_pl" class="gd2-pl" role="listbox" aria-label="'+esc2(PK[k][1])+'">'+(pkAny(k)?o('any','Qualquer',i==null):'')+L.map((t,j)=>o(j,String(t),j===i)).join('')+'</div>'; }
const namePick=p=>'<div class="gd2-pk2">'+pkBtn(p+'a','1ª parte')+pkBtn(p+'b','2ª parte')+'</div>'+pkList(p+'a')+pkList(p+'b');
const pvHtml=(a,b,cap)=>'<div class="gd2-pv lil"><small>'+esc2(cap)+'</small>'+esc2(GM().nameOf(a,b))+'</div>';

/* ----- online, sem guilda: procurar e criar ----- */
function pNone(M){ const G=GM(), D=G.DATA, p=X.pk, z=sec('list'), L=z.st==='ok'?arr(z.d).filter(g=>g&&g.id!=null).slice(0,30):[]; let c={ok:false}; try{ c=G.canCreate(S,host(),p.ca,p.cb,p.cs); }catch(e){} let cost=0; try{ cost=G.createCost(host()); }catch(e){}
  let h=rule('Na guilda: bênçãos de <b>ATQ, Vida e Defesa</b> para todos, chefe da semana, loja de '+esc2(coinName(2))+' e o <b>Torneio do Poder</b>.')
    +secH('Entrar numa guilda','busca pelas partes do nome')
    +namePick('q')
    +secHtml(z,'list');
  if(z.st==='ok'&&!L.length) h+='<div class="gd2-note" role="status">Nenhuma guilda encontrada.</div>';
  for(const g of L){ const lv=pick(g,'level'), mem=pick(g,'members'), cap=pick(g,'maxMembers'), full=mem!=null&&cap!=null&&mem>=cap, ask=g.open===false;
    const sub=[lv!=null?'nível '+nT(lv):'',mem!=null?nT(mem)+(cap!=null?'/'+nT(cap):'')+' membros':'',g.open===true?'aberta':ask?'com pedido':'',isN(g.minLevel)&&g.minLevel>0?'Nv mínimo '+nT(g.minLevel):''].filter(Boolean).join(' · ');
    h+='<div class="gd2-row"><span class="mi"><b>'+esc2(g.name||'Guilda')+'</b><small>'+esc2(sub)+'</small></span>'+(full?'<span class="gd2-pill off">Cheia</span>':'<button class="gd2-bt'+(ask?' ghost':'')+'" data-x="join" data-id="'+esc2(g.id)+'">'+(ask?'Pedir':'Entrar')+'</button>')+'</div>'; }
  h+=secH('Criar a sua','nível '+nT(M.st.needLevel||0))
    +pvHtml(p.ca,p.cb,'Nome da nova guilda')
    +namePick('c')
    +'<div class="gd2-pk2">'+pkBtn('cs','Estilo')+'<button class="gd2-bt ghost" data-x="roll" data-k="c">Sortear</button></div>'+pkList('cs')
    +'<button class="gd2-bt wide'+(c.ok?'':' off')+'" data-x="create">Criar guilda</button>'
    +'<p class="gd2-hint">Criar custa <b>'+esc2(kfT(cost))+' de ouro</b> (cerca de '+nT(D.create.goldk)+' abates da sua fase). Sem diamante. Escolher e sortear o nome não gastam nada.'+(c.ok?'':' '+esc2(rt(c)||whyLocal(c))+'.')+'</p>';
  return h; }

/* ----- ficha da guilda (só o líder): nome montado e estilo. Líder de guilda com nome antigo (status().nameLegacy) vê o aviso para escolher o novo nome -----
   As regras são do Sys.guild (canRename: troca livre da migração, depois 1 a cada 30 dias; canRestyle: 1 por dia de Brasília); o envio é o PATCH /guild. */
function fichaHtml(o){ if(roleKey(o.role)!=='leader') return ''; const G=GM(), p=X.pk; let st={}, cr={ok:false}, cs={ok:false}; try{ st=G.status(S,host())||{}; cr=G.canRename(S,host()); cs=G.canRestyle(S,host()); }catch(e){}
  const legacy=st.nameLegacy===true, si=styleNow(); let h='';
  if(legacy||X.ren) h+=secH(legacy?'Escolha o novo nome da guilda':'Trocar o nome da guilda','só o líder')
    +(legacy?rule('O nome da guilda agora é montado com <b>duas partes</b>. O nome antigo aparece até você escolher o novo. Não custa nada.'):'')
    +pvHtml(p.ra,p.rb,'Novo nome')+namePick('r')
    +'<div class="gd2-pk2"><button class="gd2-bt ghost" data-x="roll" data-k="r">Sortear</button><button class="gd2-bt'+(cr.ok?'':' off')+'" data-x="rename">'+(legacy?'Usar este nome':'Trocar nome')+'</button></div>'
    +(cr.ok?'':'<p class="gd2-hint">'+esc2(rt(cr)||why(cr.reason))+'.</p>');
  h+=secH('Ficha da guilda','só o líder troca');
  if(!legacy) h+='<div class="gd2-row"><span class="mi"><b>Nome</b><small>'+esc2(G.name(S)||'Sua guilda')+'</small></span><button class="gd2-bt ghost'+(cr.ok||X.ren?'':' off')+'" data-x="ren">'+(X.ren?'Fechar':'Trocar')+'</button></div>';
  return h+'<div class="gd2-row"><span class="mi"><b>Estilo</b><small>'+esc2(si!=null?G.styleOf(si):'Ainda sem estilo')+(cs.ok?'':' · '+esc2(rt(cs)||why(cs.reason)))+'</small></span><button class="gd2-bt ghost'+(cs.ok?'':' off')+'" data-x="pk" data-k="st">Trocar</button></div>'+pkList('st'); }

/* ----- cartão da guilda ----- */
function cardHtml(o){ const G=GM(), mine=mineNow()||{}, g=mine.guild||{}, n=Array.isArray(mine.members)?mine.members.length:pick(g,'members'), cap=G.memberCap(o.level), b=o.banners||{}; let pk={goldPct:0,xpPct:0,dropPct:0}, xb={into:0,need:0,frac:0,max:false};
  try{ pk=G.perks(S); }catch(e){} try{ xb=G.xpBar(S); }catch(e){}
  let gname=''; try{ gname=String(G.name(S)||''); }catch(e){} const si=styleNow();   /* nome da MINHA guilda: o par das listas (Sys.guild.name); guilda antiga mostra o texto antigo, escapado */
  return '<div class="gd2-gc"><div class="gd2-gh">'+SV.emb+'<div class="t"><div class="nm lil">'+esc2(gname||'Sua guilda')+'</div><small>'+(n!=null?nT(n)+'/':'até ')+nT(cap)+' membros · seu cargo: <b>'+esc2(roleName(o.role))+'</b> · '+coinTxt(o.coin)+' '+esc2(coinName(o.coin))+'</small></div><div class="gd2-lvb">NÍVEL<b class="lil">'+nT(o.level)+'</b></div></div>'
    +'<div class="gd2-bar" role="progressbar" aria-label="XP da guilda" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(c01(xb.frac)*100)+'"><i style="width:'+(c01(xb.frac)*100).toFixed(1)+'%"></i></div>'
    +'<div class="gd2-prog"><span>'+(xb.max?'Nível máximo da guilda':'XP da guilda '+nT(xb.into)+'/'+nT(xb.need))+'</span><span>'+(xb.max?'':'próximo nível: mais vagas e teto maior')+'</span></div>'
    +'<div class="gd2-chips">'+(si!=null?'<span class="gd2-chip">Estilo <b>'+esc2(G.styleOf(si))+'</b></span>':'')+'<span class="gd2-chip g">ATQ <b>+'+dec(b.atk)+'%</b></span><span class="gd2-chip g">Vida <b>+'+dec(b.hp)+'%</b></span><span class="gd2-chip g">Defesa <b>+'+dec(b.def)+'%</b></span><span class="gd2-chip">Ouro <b>+'+dec(pk.goldPct)+'%</b></span><span class="gd2-chip">XP <b>+'+dec(pk.xpPct)+'%</b></span><span class="gd2-chip">Itens <b>+'+dec(pk.dropPct)+'%</b></span></div></div>'; }
const tabsHtml=()=>'<div class="gd2-tabs" role="tablist" aria-label="Seções da guilda">'+TABS.concat(fireOn()?[['fire','Fogueira']]:[]).map(t=>'<button class="gd2-tab" role="tab" data-x="tab" data-t="'+t[0]+'" aria-selected="'+(X.tab===t[0])+'">'+t[1]+'</button>').join('')+'</div>';

/* ----- Membros ----- */
function memList(){ const m=mineNow(), L=m&&Array.isArray(m.members)?m.members.filter(x=>x&&x.id!=null):[], ord={leader:0,officer:1,member:2};
  return L.slice().sort((a,b)=>(ord[roleKey(a.role)]-ord[roleKey(b.role)])||((b.me?1:0)-(a.me?1:0))||(num(b.contrib)-num(a.contrib))); }
/* o que o MEU cargo pode fazer com este membro (permissões do Sys.guild.DATA.perms; o servidor confere de novo) */
function actsFor(m,o,offs){ if(m.me) return []; const D=GM().DATA, r=roleKey(m.role), a=[];
  if(can('promote')&&r==='member'&&offs<D.maxOfficers) a.push('promote');
  if(can('promote')&&r==='officer') a.push('demote');
  if(can('transfer')&&r!=='leader') a.push('transfer');
  if(can('kick')&&(r==='member'||(o.role==='leader'&&r==='officer'))) a.push('kick');
  return a; }
const ACT_LB={promote:['Promover a oficial',''],demote:['Rebaixar a membro',' ghost'],transfer:['Passar a liderança',' ghost'],kick:['Expulsar',' rose']};
function pMembers(o){ const G=GM(), D=G.DATA, L=memList(), offs=L.filter(m=>roleKey(m.role)==='officer').length, mine=mineNow()||{};
  let h=fichaHtml(o)+secH('Membros',nT(L.length)+'/'+nT(G.memberCap(o.level))+' · oficiais '+nT(offs)+'/'+nT(D.maxOfficers));
  if(!L.length) h+='<div class="gd2-note" role="status">A lista de membros ainda não chegou.</div>';
  for(const m of L){ const id=String(m.id), acts=actsFor(m,o,offs), open=X.sel===id&&acts.length>0, lvl=pick(m,'level','lvl');
    const sub=[lvl!=null?'Nv '+nT(lvl):'',isN(m.fc)?'FC '+fcT(m.fc):'',isN(m.contrib)?nT(m.contrib)+' na semana':'',!m.me&&m.lastSeen>0?'visto '+ago(m.lastSeen):''].filter(Boolean).join(' · ');
    const inner='<span class="gd2-av lil" aria-hidden="true">'+esc2(Array.from(String(m.name||'?'))[0]||'?')+'</span><span class="mi"><b>'+esc2(m.name||'?')+(m.me?' (você)':'')+'</b><small>'+esc2(sub)+'</small></span><span class="gd2-role '+roleKey(m.role)+'">'+esc2(roleName(m.role))+'</span>';
    h+=acts.length?'<button class="gd2-row'+(open?' sel':'')+'" data-x="sel" data-id="'+esc2(id)+'" aria-expanded="'+open+'">'+inner+'</button>':'<div class="gd2-row'+(m.me?' me':'')+'">'+inner+'</div>';
    if(open) h+='<div class="gd2-mact">'+acts.map(a=>'<button class="gd2-bt'+ACT_LB[a][1]+'" data-x="mact" data-k="'+a+'" data-id="'+esc2(id)+'">'+ACT_LB[a][0]+'</button>').join('')+'</div>'; }
  const rq=Array.isArray(mine.requests)?mine.requests.filter(r=>r&&(r.playerId!=null||r.id!=null)):[];
  if(can('accept')&&rq.length){ h+=secH('Pedidos para entrar',nT(rq.length));
    for(const r of rq){ const id=String(r.playerId!=null?r.playerId:r.id), lvl=pick(r,'level','lvl');
      h+='<div class="gd2-row"><span class="mi"><b>'+esc2(r.name||'?')+'</b><small>'+esc2([lvl!=null?'Nv '+nT(lvl):'',isN(r.fc)?'FC '+fcT(r.fc):'',isN(r.at)&&r.at>0?'pediu '+ago(r.at):''].filter(Boolean).join(' · '))+'</small></span></div>'
        +'<div class="gd2-mact"><button class="gd2-bt" data-x="req" data-k="accept" data-id="'+esc2(id)+'">Aceitar</button><button class="gd2-bt ghost" data-x="req" data-k="decline" data-id="'+esc2(id)+'">Recusar</button></div>'; } }
  h+='<p class="gd2-hint">Líder ausente por '+nT(D.leave.leaderAbsentDays)+' dias passa a liderança ao oficial mais ativo. Sair: '+nT(D.leave.cooldownH)+' h para entrar em outra, '+nT(D.leave.sameGuildDays)+' dias para voltar a esta.</p>'
    +'<button class="gd2-bt ghost wide" data-x="leave">Sair da guilda</button>';
  return h; }

/* ----- Doar ----- */
/* ouro de "goldk": goldk × ouro de um abate da fase (Sys.host.goldUnit), a mesma conta do Sys.guild.createCost */
const gUnit=()=>{ let u=1; try{ const h=host(); u=Math.max(1,num(h&&h.goldUnit&&h.goldUnit())); }catch(e){} return u; };
function donCost(d){ const h=host(); if(d.gems) return {gems:d.gems,txt:nT(d.gems)+' diamantes',ok:!h||typeof h.canSpendGems!=='function'||!!h.canSpendGems(d.gems)};
  const g=Math.round(num(d.goldk)*gUnit()); return {gold:g,txt:kfT(g)+' de ouro',ok:!h||typeof h.canSpendGold!=='function'||!!h.canSpendGold(g)}; }
/* contrato 10.5: a resposta da doação traz cost:{goldk, gems} e é ESSE o valor que o jogo debita (null = a resposta veio sem o cost) */
function srvCost(c){ return c&&typeof c==='object'?{gems:Math.max(0,Math.round(num(c.gems))),gold:Math.round(Math.max(0,num(c.goldk))*gUnit())}:null; }
/* contrato 10.5: me.donatedToday traz as chaves feitas no dia de Brasília ("donate:<kind>" e "checkin"); checkinToday é o mesmo dado como booleano */
function doneToday(key){ const me=(mineNow()||{}).me||{}, L=Array.isArray(me.donatedToday)?me.donatedToday.map(String):[]; return L.indexOf(key)>=0||(key==='checkin'&&me.checkinToday===true); }
function pDonate(o){ const D=GM().DATA, ck=doneToday('checkin'), feito='<span class="gd2-pill on">Feito hoje</span>', volta=' · volta à meia-noite de Brasília';
  let h=secH('Hoje','1 de cada por dia')
    +'<div class="gd2-row"><span class="ic">'+SV.cal+'</span><span class="mi"><b>Presença</b><small><em>+'+nT(D.checkin.coin)+' '+esc2(coinName(D.checkin.coin))+'</em> · +'+nT(D.checkin.xp)+' XP da guilda'+(ck?volta:'')+'</small></span>'+(ck?feito:'<button class="gd2-bt" data-x="checkin">Fazer</button>')+'</div>';
  for(const d of D.donate){ const c=donCost(d), dn=doneToday('donate:'+d.id);
    h+='<div class="gd2-row"><span class="ic">'+(d.gems?img(IC.gem,28):SV.gold)+'</span><span class="mi"><b>'+esc2(DN[d.id]||d.id)+': '+esc2(c.txt)+'</b><small><em>+'+nT(d.coin)+' '+esc2(coinName(d.coin))+'</em> · +'+nT(d.xp)+' XP da guilda'+(dn?volta:'')+'</small></span>'
      +(dn?feito:'<button class="gd2-bt'+(c.ok?'':' off')+'" data-x="don" data-id="'+esc2(d.id)+'">Doar</button>')+'</div>'; }
  return h+'<p class="gd2-hint">'+esc2(coinName(1))+' é a moeda da guilda (loja da guilda). O XP sobe o nível: mais vagas e teto maior nas bênçãos.</p>'; }

/* ----- Bênçãos ----- */
function pBless(o){ const G=GM(), B=G.DATA.banners, up=can('banner'); let bv=null; try{ bv=GN().blessingsView(); }catch(e){} const free=pick(bv,'xpFree');
  let h=secH('Bênçãos (estandartes)',free!=null?'XP guardado: <b>'+nT(free)+'</b>':'')+(up?'':rule('Só <b>líder e oficiais</b> sobem as bênçãos. Elas valem para todos os membros.'));
  for(const k of Object.keys(B.cap)){ const cur=num(o.banners[k]), cap=G.bannerCap(k,o.level), max=B.cap[k], st=B.step[k], steps=Math.round(max/st), on=Math.round(cur/st), lim=Math.round(cap/st), full=cur>=cap-1e-9; let pips='';
    for(let i=0;i<steps;i++) pips+='<i class="'+(i<on?'on':i>=lim?'cap':'')+'"></i>';
    h+='<div class="gd2-row"><span class="ic">'+SV[k]+'</span><span class="mi"><b>'+esc2(BN[k]||k)+' <span>+'+dec(cur)+'%</span></b><span class="gd2-pips" aria-hidden="true">'+pips+'</span><small>'
      +(full?(cap<max?'No teto do nível '+nT(o.level)+' (+'+dec(cap)+'%). Teto final +'+dec(max)+'% no nível '+nT(G.DATA.xpLevel.maxLevel):'No teto final'):'Próximo: +'+dec(Math.min(cap,cur+st))+'% · '+nT(B.costXp[k])+' XP da guilda')+'</small></span>'
      +(up&&!full?'<button class="gd2-bt" data-x="bls" data-id="'+k+'">Subir</button>':'')+'</div>'; }
  return h+'<p class="gd2-hint">Ataque, Vida e Defesa entram na sua FC na hora. Ouro e Ração aumentam o que você ganha. O teto sobe com o nível da guilda.</p>'; }

/* ----- Chefe ----- */
function bandTxt(b){ return coinTxt(b.coin)+(b.forge?' · '+nT(b.forge)+' forja':'')+(b.food?' · '+nT(b.food)+' ração':'')+(b.essence?' · '+nT(b.essence)+' Ess.':''); }
/* contrato 10.5: GET /guild/boss → {week, hpMax, hpLeft, down, hitsLeft, myDamage, top:[{id,name,damage}], bands:[…], kill:{…}}. As faixas e o prêmio de derrubar
   são os que o SERVIDOR mandou; só sem eles (resposta ainda não chegou) valem os do Sys.guild.DATA.boss, que é a tabela que o servidor lê */
const bossDown=d=>!!d&&(d.down===true||(isN(d.hpLeft)&&isN(d.hpMax)&&d.hpMax>0&&d.hpLeft<=0));
function pBoss(o){ const D=GM().DATA.boss, z=sec('boss'), d=z.st==='ok'?z.d:null; let h='';
  const sb=d&&Array.isArray(d.bands)?d.bands.filter(b=>b&&isN(b.minRatio)).sort((a,b)=>a.minRatio-b.minRatio):[], bands=sb.length?sb:D.bands, kill=d&&d.kill&&typeof d.kill==='object'?d.kill:D.kill;
  if(!d) h+=secHtml(z,'boss');
  else { const hp=pick(d,'hpLeft'), max=pick(d,'hpMax'), left=pick(d,'hitsLeft'), myD=pick(d,'myDamage'), dead=bossDown(d), canHit=!dead&&left!==0, fr=hp!=null&&max>0?c01(hp/max):null;
    const top=Array.isArray(d.top)?d.top.filter(t=>t&&isN(t.damage)).slice(0,10):[], meM=memList().find(m=>m.me), meId=meM?String(meM.id):'';
    h+='<div class="gd2-boss"><div class="gd2-prog" style="margin-top:0"><span>Chefe da semana'+(dead?' · derrubado':'')+'</span><span>'+(fr!=null?dec(fr*100)+'%':'')+'</span></div>'
      +(fr!=null?'<div class="gd2-bar red" role="progressbar" aria-label="Vida do chefe" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(fr*100)+'"><i style="width:'+(fr*100).toFixed(1)+'%"></i></div>':'')
      +'<div class="gd2-prog"><span>'+(hp!=null?'Vida '+kfT(hp)+(max!=null?' de '+kfT(max):''):'Vida do chefe indisponível agora')+'</span><span>'+(dead?'':left!=null?nT(left)+(left===1?' golpe hoje':' golpes hoje'):nT(D.hitsPerDay)+' golpes por dia')+'</span></div>'
      +(myD!=null?'<div class="gd2-prog"><span>Seu dano na semana</span><span>'+esc2(kfT(myD))+'</span></div>':'')
      +(dead?'<div class="gd2-note" role="status" style="margin:8px 0 0">Chefe derrubado nesta semana. Os prêmios de quem bateu foram pelo correio. Na semana que vem tem outro.</div>'
        :'<button class="gd2-bt wide '+(canHit?'rose':'off')+'" data-x="hit" style="margin-top:8px">'+(canHit?'Atacar':'Golpes de hoje usados')+'</button>'+(canHit?'':'<p class="gd2-hint" style="margin:6px 0 0">Feito hoje: os golpes voltam à meia-noite de Brasília.</p>'))
      +(X.hit?'<p class="gd2-hint" style="margin:8px 0 0" role="status">Último golpe: <b>'+esc2(kfT(X.hit.damage))+'</b> de dano'+(X.hit.band?' · prêmio: '+bandTxt(X.hit.band):'')+'</p>':'')+'</div>';
    if(top.length){ h+=secH('Quem mais bateu','dano na semana'); top.forEach((t,i)=>{ h+='<div class="gd2-band"><span>'+nT(i+1)+'º '+esc2(t.name||'?')+(meId&&String(t.id)===meId?' (você)':'')+'</span><span>'+esc2(kfT(t.damage))+'</span></div>'; }); } }
  h+=secH('Prêmio por faixa de dano','seu dano dividido pelo seu ATQ');
  bands.forEach((b,i)=>{ const nx=bands[i+1]; h+='<div class="gd2-band"><span>'+(nx?'De '+dec(b.minRatio)+'x a '+dec(nx.minRatio)+'x':dec(b.minRatio)+'x ou mais')+'</span><span>'+bandTxt(b)+'</span></div>'; });
  return h+'<p class="gd2-hint" style="margin-top:8px">Derrubar o chefe dá a todos que bateram '+coinTxt(num(kill.coin))+', '+nT(num(kill.forge))+' pedras de forja, '+nT(num(kill.food))+' de ração e '+nT(num(kill.essence))+' Essências, mais '+nT(num(kill.xp))+' XP da guilda. Os prêmios chegam pelo correio.</p>'; }

/* ----- Loja (só por Brasões; nada sorteado) ----- */
/* contrato 10.5: GET /guild/shop → {coin, week, items:[{id, name, cost, weekly, minLevel, give, bought, left, locked}]}. Com a lista do servidor, é ELA que a tela mostra
   (nome, custo, limite, o que sobrou e a trava); a tabela do Sys.guild.DATA.shop só completa um campo que não veio */
function shopItems(){ const D=GM().DATA, z=X.d.shop, L=z&&z.st==='ok'?arr(z.d).filter(s=>s&&s.id!=null):[], loc=id=>(D.shop||[]).find(q=>q.id===String(id))||{};
  return (L.length?L:(D.shop||[])).map(row=>{ const s=L.length?row:{}, it=L.length?loc(row.id):row, weekly=isN(s.weekly)?s.weekly:num(it.weekly), bought=pick(s,'bought'), left=pick(s,'left');
    return {id:String(row.id),name:String(s.name||it.name||row.id),cost:isN(s.cost)?s.cost:num(it.cost),weekly:weekly,minLevel:isN(s.minLevel)?s.minLevel:num(it.minLevel),give:(s.give&&typeof s.give==='object'?s.give:it.give)||{},
      left:left!=null?left:bought!=null?Math.max(0,weekly-bought):null,locked:s.locked===true}; }); }
const shopCoin=o=>{ const z=X.d.shop; return z&&z.st==='ok'&&z.d&&isN(z.d.coin)?z.d.coin:num(o.coin); };
const shopLock=(it,o)=>it.locked||o.level<it.minLevel;
const shopLockTxt=(it,o)=>it.minLevel>o.level?'Abre no nível '+nT(it.minLevel)+' da guilda':'Ainda não liberado para a sua guilda';
function pShop(o){ const z=sec('shop'); let h=secH('Loja da guilda','só por '+esc2(coinName(2)))+secHtml(z,'shop');
  if(z.st==='ok') for(const it of shopItems()){ const lock=shopLock(it,o), out=it.left!=null&&it.left<=0, afford=shopCoin(o)>=it.cost, ic=GIVE_IC[Object.keys(it.give)[0]]||IC.chest;
    h+='<div class="gd2-row">'+img(ic,36)+'<span class="mi"><b>'+esc2(it.name)+'</b><small>'+(lock?esc2(shopLockTxt(it,o)):out?'Limite desta semana atingido ('+nT(it.weekly)+' de '+nT(it.weekly)+')':it.left!=null?nT(it.left)+' de '+nT(it.weekly)+' nesta semana':'até '+nT(it.weekly)+' por semana')+'</small></span>'
      +(lock?'<span class="gd2-pill off">'+(it.minLevel>o.level?'Nível '+nT(it.minLevel):'Travado')+'</span>':out?'<span class="gd2-pill off">Esgotado</span>':'<button class="gd2-bt'+(afford?'':' off')+'" data-x="buy" data-id="'+esc2(it.id)+'" aria-label="'+esc2('Trocar '+nT(it.cost)+' '+coinName(it.cost)+' por '+it.name)+'">'+coinTxt(it.cost)+'</button>')+'</div>'; }
  return h+'<p class="gd2-hint">Sem diamante e sem sorteio. Os fragmentos são da montaria que você usa. A loja renova na segunda.</p>'; }

/* ----- Missões ----- */
/* contrato 10.5: GET /guild/missions → {week, list:[{id, name, counter, target, xp, coin, progress, done, contributed, claimed}]}. "done" e "contributed" são do servidor:
   os Brasões da missão são só de quem ajudou nela (409 not_contributed) */
function missList(){ const D=GM().DATA, z=X.d.miss, L=z&&z.st==='ok'?arr(z.d).filter(m=>m&&m.id!=null):[], loc=id=>(D.missions||[]).find(q=>q.id===String(id))||{};
  return (L.length?L:(D.missions||[])).map(row=>{ const s=L.length?row:{}, it=L.length?loc(row.id):row, target=isN(s.target)?s.target:num(it.target), pv=pick(s,'progress'), v=pv!=null?Math.max(0,Math.min(target,pv)):null;
    return {id:String(row.id),name:String(s.name||it.name||row.id),target:target,xp:isN(s.xp)?s.xp:num(it.xp),coin:isN(s.coin)?s.coin:num(it.coin),v:v,
      done:typeof s.done==='boolean'?s.done:(v!=null&&target>0&&v>=target),helped:s.contributed!==false,claimed:s.claimed===true}; }); }
function pMiss(o){ const z=sec('miss');
  let h=secH('Missões da semana','contam as ações de todos')+secHtml(z,'miss');
  if(z.st==='ok') for(const m of missList()){ const can=m.done&&m.helped&&!m.claimed;
    h+='<div class="gd2-ms"><div class="row"><b>'+esc2(m.name)+'</b><span>'+(m.v!=null?nT(m.v)+'/'+nT(m.target):'meta '+nT(m.target))+'</span>'+(m.claimed?'<span class="gd2-pill on">Resgatado</span>':can?'<button class="gd2-bt" data-x="claim" data-id="'+esc2(m.id)+'">Resgatar</button>':m.done?'<span class="gd2-pill off">Concluída</span>':'')+'</div>'
      +(m.v!=null&&m.target>0?'<div class="gd2-bar grn"><i style="width:'+(c01(m.v/m.target)*100).toFixed(1)+'%"></i></div>':'')
      +'<div class="gd2-prog"><span>+'+nT(m.xp)+' XP da guilda</span><span>'+coinTxt(m.coin)+' para cada membro que ajudou</span></div>'
      +(m.done&&!m.helped&&!m.claimed?'<p class="gd2-hint" style="margin:5px 0 0">'+esc2(WHY.not_contributed)+'.</p>':'')+'</div>'; }
  return h; }

/* ----- Territórios ----- */
function pTerr(o){ const G=GM(), D=G.DATA, T=D.territory, Z=D.season||{}, L=o.territories||[], tb=G.territoryBonus(L); let pts=0; try{ pts=G.territoryPoints(L); }catch(e){}
  const days=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'], today=new Date(gameNow()).getDay(), ph=dd=>(Z.declareDays||[]).indexOf(dd)>=0?'declarar':(Z.battleDays||[]).indexOf(dd)>=0?'batalha'+(isN(Z.battleHour)?' '+Z.battleHour+'h':''):dd===Z.prizeDay?'prêmios':'';
  let h=secH('Torneio do Poder · semana','<b>'+nT(pts)+'</b> pontos de território')+'<div class="gd2-week">'+[1,2,3,4,5,6,0].map(dd=>'<span class="'+(dd===today?'now':'')+'">'+days[dd]+'<br>'+ph(dd)+'</span>').join('')+'</div>';
  let TN=null, mp=null, my=null; try{ TN=window.Sys&&Sys.tourneyNet; const zz=TN&&TN.state?TN.state():null; if(zz&&zz.on&&zz.ready){ mp=TN.map(); my=TN.my()||{}; } }catch(e){ mp=null; }
  if(mp){ const by={}, mineIds=Array.isArray(my.territories)?my.territories.map(String):[]; for(const m of mp) if(m&&typeof m.id==='string') by[m.id]=m;
    const cell=(id,lab,cls)=>{ const m=by[id], mn=mineIds.indexOf(id)>=0, ow=!!(m&&m.owner); return '<span class="'+(cls||'')+(mn?' mine':ow?' own':'')+'" role="img" aria-label="'+esc2(lab+(mn?', da sua guilda':ow?', de '+String(m.owner.name||'outra guilda'):', sem dono'))+'">'+esc2(cls?('CAPITAL'+(mn?' · sua':ow?' · '+String(m.owner.name||''):'')):lab.slice(-1))+'</span>'; };
    let cells=''; for(let e=0;e<T.regions;e++) cells+='<span class="k" aria-hidden="true">'+(ERA0[e]||e)+'</span>';
    for(let k=1;k<=T.perRegion;k++) for(let e=0;e<T.regions;e++) cells+=cell('r'+e+'t'+k,'Era '+e+', território '+k,'');
    h+='<div class="gd2-map" style="grid-template-columns:repeat('+T.regions+',minmax(0,1fr))">'+cells+cell('capital','Capital','cap')+'</div>'
      +'<div class="gd2-leg"><span><i style="background:#5ef0a0"></i>Sua guilda</span><span><i style="background:#a97bff"></i>Outra guilda</span><span><i style="background:rgba(255,255,255,.12)"></i>Sem dono</span></div>'; }
  else h+='<div class="gd2-note" role="status">'+(L.length?'Sua guilda tem '+nT(L.length)+(L.length===1?' território':' territórios')+(L.some(t=>t.capital)?' (com a Capital)':'')+'.':'Sua guilda ainda não tem territórios.')+' O mapa completo fica no Torneio do Poder.</div>';
  h+='<div class="gd2-row"><span class="mi"><b>Bônus '+(L.length===1?'do seu território':'dos seus '+nT(L.length)+' territórios')+'</b><small>Cada um: ouro +'+dec(T.per.gold)+'%, XP +'+dec(T.per.xp)+'%, itens +'+dec(T.per.drop)+'%. Capital vale '+nT(T.capitalMult)+'x. Teto: ouro +'+dec(T.cap.gold)+'%, XP +'+dec(T.cap.xp)+'%, itens +'+dec(T.cap.drop)+'%</small></span><span class="gd2-pill on">Ouro +'+dec(tb.gold)+'%<br>XP +'+dec(tb.xp)+'% · Itens +'+dec(tb.drop)+'%</span></div>'
    +'<button class="gd2-bt wide" data-x="tour">'+img(IC.tourney,20)+'Abrir o Torneio do Poder</button>'
    +'<p class="gd2-hint" style="margin-top:8px">Líder e oficiais declaram até '+nT(Z.attacksPerDay||0)+' ataques por dia. As batalhas são de '+nT(D.tourney.size)+' contra '+nT(D.tourney.size)+'. No dia dos prêmios, um baú por território para cada membro, pelo correio.</p>';
  return h; }
/* ----- Fogueira da Guilda (8ª aba; Sys.guildFire + Sys.guildFireNet; contrato docs/API_SERVIDOR.md §16.2) -----
   Aparece só com a chave do módulo ligada, o online da guilda iniciado e o Sys.guildFireNet iniciado (sem ele as chamas seriam só deste aparelho).
   NENHUM número aqui: tudo vem do Sys.guildFire.view. Os baús de nível vão SOZINHOS pelo correio (servidor): aqui não há botão de resgatar. */
const GF=()=>(window.Sys&&Sys.guildFire)||null, GFN=()=>(window.Sys&&Sys.guildFireNet)||null;
function fireOn(){ try{ const F=GF(), Nn=GFN(), z=Nn&&typeof Nn.state==='function'?Nn.state():null; return !!(F&&F.DATA&&F.DATA.on===true&&online()&&z&&z.on&&z.started); }catch(e){ return false; } }
function fireBra(){ try{ return num(Sys.bonfire.ensure(S).bra); }catch(e){ return 0; } }
function pFire(o){ let v=null; try{ v=fireOn()?GF().view(S,host()):null; }catch(e){ v=null; }
  if(!v||v.on!==true) return rule('A Fogueira da Guilda abre com o online.');
  if(!v.open) return rule('Entre numa guilda para alimentar a fogueira.');
  const pct=Math.round(c01(num(v.frac))*100), have=fireBra(), left=num(v.braLeft);
  let h=secH('Fogueira · nível '+nT(v.level),esc2(v.name||''))
    +'<div class="gd2-row"><span class="mi"><b>'+(v.max?nT(v.into)+'/'+nT(v.need)+' chamas para o próximo baú extra':nT(v.into)+'/'+nT(v.need)+' chamas para o nível '+nT(v.level+1))+'</b>'
    +'<span role="progressbar" aria-label="Chamas da fogueira" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" style="display:block;height:8px;margin:6px 0 4px;border-radius:5px;background:rgba(0,0,0,.35);overflow:hidden"><span style="display:block;height:100%;width:'+pct+'%;background:#ff9f2e"></span></span>'
    +'<small>'+(v.perksText?'Bônus da guilda: '+esc2(v.perksText):'O bônus começa no nível 2')+' · você já deu '+nT(v.mine)+' chamas</small></span></div>';
  h+=secH('Alimentar','1 grátis por dia');
  h+='<div class="gd2-row"><span class="mi"><b>Alimentar grátis: +'+nT(v.freeFlames)+' chamas</b><small>'+(v.free?'Uma vez por dia':'Feito hoje · volta à meia-noite de Brasília')+'</small></span>'
    +(v.free?'<button class="gd2-bt" data-x="fire" data-n="0">Alimentar</button>':'<span class="gd2-pill on">Feito hoje</span>')+'</div>';
  if(v.brasaHook){ const opts=[1,5,20].filter(n=>n<=left);
    h+='<div class="gd2-row"><span class="mi"><b>Dar Brasas: 1 chama por Brasa</b><small>Você tem '+nT(have)+' Brasas · pode dar mais '+nT(left)+' hoje</small></span>'
      +(opts.length?opts.map(n=>'<button class="gd2-bt'+(n<=have?'':' off')+'" data-x="fire" data-n="'+n+'" aria-label="Dar '+nT(n)+' Brasas">+'+nT(n)+'</button>').join(''):'<span class="gd2-pill on">Feito hoje</span>')+'</div>'; }
  const nx=v.next&&v.next.chest;
  if(nx) h+=secH(v.max?'Próximo baú extra':'Baú do nível '+nT(v.next.level),'para cada membro')
    +'<div class="gd2-row"><span class="ic">'+img(IC.chest,28)+'</span><span class="mi"><b>'+kfT(nx.gold)+' de ouro · '+nT(nx.stones)+' pedras de forja · '+nT(nx.food)+' de ração</b><small>Chega sozinho pelo correio quando a guilda sobe de nível</small></span></div>';
  return h+'<p class="gd2-hint">As Brasas vêm só de jogar (a sua Fogueira). Nada aqui se compra. O baú vai para quem já estava na guilda quando o nível subiu.</p>'; }
const BODY={members:pMembers,donate:pDonate,bless:pBless,boss:pBoss,shop:pShop,miss:pMiss,terr:pTerr,fire:pFire};

/* ----- faixa de confirmação (2º toque), dentro da tela ----- */
function confHtml(){ const c=X.conf; if(!c) return '';
  return '<div class="gd2-conf" role="alertdialog" aria-label="Confirmação"><p>'+c.txt+'</p><div class="row"><button class="gd2-bt ghost" data-x="no">Cancelar</button><button class="gd2-bt rose" data-x="yes">'+esc2(c.yes)+'</button></div></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{}, M=mode(); X.md=M.m;
  if(M.m==='none'){ V.innerHTML=xWrap(d,'','<div class="gd2">'+bgHtml()+'<div class="gd2-gate"><b class="lil" style="font-size:26px">Guilda</b><span role="alert">Guilda indisponível agora.</span><button class="gd2-bt" data-x="back" style="min-height:48px;padding:0 26px;font-size:15px">Voltar</button></div></div>'); X.sig='x'; return; }
  seed(); if(X.open&&!pkOk(X.open)) X.open=''; if(M.m!=='in') X.ren=false;
  /* a rolagem da tela e a da lista aberta (a mesma lista) sobrevivem ao redesenho */
  let y0=0, y1=0; try{ const sc0=X.top?null:document.getElementById('gd2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; const pl0=X.open&&X.open===X.plk?document.getElementById('gd2_pl'):null; y1=pl0?(+pl0.scrollTop||0):0; }catch(e){}
  const Hh=+d.H||0, small=!!(Hh&&Hh<620), SH=small?150:176; toastTop=SH+8;
  let card='', tabs='', body='';
  if(M.m==='closed') body=pClosed(M); else if(M.m==='out') body=pNone(M);
  else { X.lv=M.o.level|0; if(!BODY[X.tab]||(X.tab==='fire'&&!fireOn())) X.tab='members'; card=cardHtml(M.o); tabs=tabsHtml(); body=BODY[X.tab](M.o); }
  const fc=myFc(), boss=M.m==='in'&&X.tab==='boss';
  const alt=heroName()+' com a arma na mão e o pet na frente, ao lado '+(boss?'do chefe da guilda':'do estandarte da guilda');
  V.innerHTML=xWrap(d,'','<div class="gd2'+(X.anim?' gd2-in':'')+'">'+bgHtml()
    +'<div class="gd2-stage" style="height:'+SH+'px"><canvas id="gd2_stc" role="img" aria-label="'+esc2(alt)+'"></canvas><div class="gd2-who"><i></i><span>'+esc2(heroName())+(fc>0?' · FC '+esc2(fcT(fc)):'')+'</span></div></div>'
    +(small?'':card)+tabs+(X.busy?'<div class="gd2-busy" role="status">'+esc2(X.busy)+'</div>':'')+confHtml()
    +'<div id="gd2_scroll" class="gd2-scroll x-scroll">'+(small?card:'')+body+'</div>'
    +'<div id="gd2_toast">'+(X.toast&&Date.now()-X.toastT<2600?toastHtml(X.toast,toastTop):'')+'</div></div>');
  try{ if(y0){ const sc=document.getElementById('gd2_scroll'); if(sc) sc.scrollTop=y0; } if(y1){ const pl=document.getElementById('gd2_pl'); if(pl) pl.scrollTop=y1; } }catch(e){}
  X.plk=X.open; X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (resposta do servidor, nível, herói): o tick redesenha só quando muda */
function sig(){ try{ const M=mode(), z=netSt()||{}, o=M.o||{}; return [M.m,M.st&&M.st.reason,o.id,o.level,o.coin,o.role,o.xp,o.name,o.nameA,o.nameB,o.styleIdx,z.at,z.started,heroId()].join('|'); }catch(e){ return ''; } }

/* ================= toques (cada data-x da tela tem uma entrada aqui) ================= */
const memName=id=>{ const m=memList().find(x=>String(x.id)===String(id)); return m?String(m.name||'?'):''; };
const ask=(k,id,txt,yes)=>{ X.conf={k:k,id:id,txt:txt,yes:yes}; redraw(); };
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  tab(b){ const t=String(b.dataset.t||''); if(!BODY[t]||t===X.tab) return; sfx('ui_tap'); X.tab=t; X.sel=''; X.conf=null; X.top=true; redraw();
    if(t==='fire'){ try{ const Nn=GFN(); if(Nn&&typeof Nn.refresh==='function') Promise.resolve(Nn.refresh(S,host())).then(redraw,()=>{}); }catch(e){} } },
  sel(b){ const id=String(b.dataset.id||''); sfx('ui_tap'); X.sel=X.sel===id?'':id; X.conf=null; redraw(); },
  retry(b){ const k=String(b.dataset.k||''); sfx('ui_tap'); delete X.d[k]; redraw(); },
  no(){ sfx('ui_tap'); X.conf=null; redraw(); },
  /* membros: promover e rebaixar vão direto; expulsar e passar a liderança pedem o 2º toque */
  mact(b){ const k=String(b.dataset.k||''), id=String(b.dataset.id||''), nm=memName(id), n=GN(), D=GM().DATA; if(!nm||!ACT_LB[k]) return; sfx('ui_tap');
    { const L=memList(), m=L.find(x=>String(x.id)===id), offs=L.filter(x=>roleKey(x.role)==='officer').length; if(!m||actsFor(m,GM().ensure(S),offs).indexOf(k)<0) return say(why('forbidden')); }
    if(k==='promote') return run('Carregando…',()=>n.promote(S,host(),id),nm+' agora é '+roleName('officer'));
    if(k==='demote') return run('Carregando…',()=>n.demote(S,host(),id),nm+' agora é '+roleName('member'));
    if(k==='kick') return ask('kick',id,'Expulsar <b>'+esc2(nm)+'</b>? Quem sai pode entrar em outra guilda em '+nT(D.leave.cooldownH)+' h e só volta para esta depois de '+nT(D.leave.sameGuildDays)+' dias.','Expulsar');
    if(k==='transfer') return ask('transfer',id,'Passar a liderança para <b>'+esc2(nm)+'</b>? Você deixa de ser o líder da guilda.','Passar a liderança'); },
  req(b){ const k=b.dataset.k==='accept'?'accept':'decline', id=String(b.dataset.id||''), n=GN(); if(!id) return; sfx('ui_tap'); run('Carregando…',()=>n[k](S,host(),id),k==='accept'?'Pedido aceito':'Pedido recusado'); },
  leave(){ const D=GM().DATA; sfx('ui_tap'); ask('leave','','Sair da guilda? Você perde os '+esc2(coinName(2))+' não gastos e as bênçãos. São '+nT(D.leave.cooldownH)+' h para entrar em outra e '+nT(D.leave.sameGuildDays)+' dias para voltar a esta.','Sair da guilda'); },
  /* Fogueira: n = 0 é o alimentar grátis; n > 0 = dar n Brasas. O servidor decide primeiro (Sys.guildFireNet.feed); baú pronto vai ao correio sozinho */
  fire(b){ const k=Math.max(0,parseInt(b.dataset.n,10)||0), Nn=GFN(); if(!Nn||!fireOn()) return say('A Fogueira da Guilda abre com o online'); sfx('ui_tap');
    if(k>0&&k>fireBra()) return say(why('brasas'));
    run('Alimentando a fogueira…',()=>Nn.feed(S,host(),k),r=>'+'+nT(num(r.flames)||(k||num(GF().DATA.free.flames)))+' chamas na fogueira'+(num(r.chestsMailed)>0?' · '+nT(r.chestsMailed)+(r.chestsMailed>1?' baús enviados':' baú enviado')+' ao seu correio':''),()=>{ X.glow=1.2; }); },
  checkin(){ const n=GN(), D=GM().DATA; sfx('ui_tap'); if(doneToday('checkin')) return say(why('daily_limit'));
    const got=r=>{ const c=r&&r.gained&&isN(r.gained.coin)?r.gained.coin:D.checkin.coin; return '+'+nT(c)+' '+coinName(c); };
    run('Carregando…',()=>n.checkin(S,host()),r=>'Presença marcada: '+got(r),r=>fx(got(r),'#5ee7ff')); },
  don(b){ const id=String(b.dataset.id||''), d=(GM().DATA.donate||[]).find(x=>x.id===id); if(!d) return; sfx('ui_tap'); if(doneToday('donate:'+d.id)) return say(why('daily_limit')); const c=donCost(d);
    if(!c.ok) return say(d.gems?'Faltam diamantes para esta doação':'Falta ouro para esta doação');
    ask('don',id,'Doar <b>'+esc2(c.txt)+'</b> para a guilda? Você recebe +'+nT(d.coin)+' '+esc2(coinName(d.coin))+' e a guilda +'+nT(d.xp)+' XP.','Doar'); },
  bls(b){ const k=String(b.dataset.id||''), B=GM().DATA.banners, n=GN(); if(!(k in B.cap)) return; sfx('ui_tap'); if(!can('banner')) return say('Só o líder e os oficiais sobem as bênçãos');
    run('Carregando…',()=>n.upgradeBlessing(S,host(),k),(BN[k]||k)+' subiu para toda a guilda',()=>{ X.glow=1.6; fx('+'+dec(B.step[k])+'% '+(BN[k]||k),'#ffe58a'); }); },
  /* contrato 10.5: o golpe volta {damage, seed, log, timeout, killed, band, hitsLeft, hpLeft, hpMax}; band = a faixa de prêmio que o golpe alcançou */
  hit(){ const z=X.d.boss, d=z&&z.st==='ok'?z.d:null, n=GN(); if(!d) return; sfx('ui_tap');
    if(bossDown(d)) return say(why('boss_down')); if(pick(d,'hitsLeft')===0) return say('Você já usou os golpes de hoje. Eles voltam à meia-noite de Brasília');
    run('Atacando o chefe…',()=>n.bossHit(S,host()),r=>(r.killed===true?'Chefe derrubado! ':'')+'Golpe no chefe: '+kfT(num(r.damage))+' de dano',r=>{ X.hit={damage:num(r.damage),band:r.band&&typeof r.band==='object'&&isN(r.band.coin)?r.band:null,t:X.t}; fx('-'+kfT(num(r.damage)),'#ff9f9f',1); delete X.d.boss; }); },
  buy(b){ const id=String(b.dataset.id||''), it=shopItems().find(x=>x.id===id), o=GM().ensure(S); if(!it) return; sfx('ui_tap');
    if(shopLock(it,o)) return say(shopLockTxt(it,o)); if(it.left!=null&&it.left<=0) return say('Limite desta semana atingido'); if(shopCoin(o)<it.cost) return say('Faltam '+coinName(2)+': custa '+nT(it.cost));
    ask('buy',id,'Trocar <b>'+nT(it.cost)+' '+esc2(coinName(it.cost))+'</b> por <b>'+esc2(it.name)+'</b>?','Trocar'); },
  claim(b){ const id=String(b.dataset.id||''), m=missList().find(x=>x.id===id), n=GN(); if(!m) return; sfx('ui_tap');
    if(m.claimed) return say(why('already_claimed')); if(!m.done) return say(why('not_done')); if(!m.helped) return say(why('not_contributed'));
    run('Carregando…',()=>n.claimMission(S,host(),id),'Missão resgatada: +'+nT(m.coin)+' '+coinName(m.coin),()=>{ delete X.d.miss; }); },
  /* seletores do nome, do estilo e da busca: abrir ou fechar a lista, escolher um item, sortear o par. Nada disto gasta nem chama a rede (só a busca recarrega a lista) */
  pk(b){ const k=String(b.dataset.k||''); if(!pkOk(k)) return; sfx('ui_tap');
    if(k==='st'&&X.open!=='st'){ let c={ok:false}; try{ c=GM().canRestyle(S,host()); }catch(e){} if(!c.ok) return say(rt(c)||why(c.reason)); }
    X.open=X.open===k?'':k; X.conf=null; redraw(); },
  opt(b){ const k=String(b.dataset.k||''), raw=String(b.dataset.i==null?'':b.dataset.i), G=GM(); if(!pkOk(k)) return; const L=pkItems(k), i=raw==='any'?null:parseInt(raw,10);
    if(i===null?!pkAny(k):!(i>=0&&i<L.length)) return; sfx('ui_tap'); X.open=''; X.conf=null;
    if(k==='st'){ if(i===styleNow()) return redraw(); let c={ok:false}; try{ c=G.canRestyle(S,host(),i); }catch(e){} if(!c.ok) return say(rt(c)||why(c.reason)); const per=num(G.DATA.restyle&&G.DATA.restyle.perDay)||1;
      return ask('restyle',i,'Trocar o estilo da guilda para <b>'+esc2(G.styleOf(i))+'</b>? Só dá para trocar '+(per===1?'1 vez':nT(per)+' vezes')+' por dia.','Trocar estilo'); }
    X.pk[k]=i; if(pkAny(k)) delete X.d.list; redraw(); },
  roll(b){ const k=b.dataset.k==='r'?'r':'c', G=GM(), p=X.pk; if(!pkOk(k+'a')) return; sfx('ui_tap'); let r=null;
    for(let i=0;i<8;i++){ r=G.nameRandom(); if(r.a!==p[k+'a']||r.b!==p[k+'b']) break; }
    p[k+'a']=r.a; p[k+'b']=r.b; X.open=''; X.conf=null; redraw(); },
  /* líder: abre ou fecha a troca de nome (guilda que já tem o par); os seletores começam no nome atual */
  ren(){ const G=GM(); if(!pkOk('ra')) return; sfx('ui_tap'); X.open=''; X.conf=null; if(X.ren){ X.ren=false; return redraw(); }
    let c={ok:false}; try{ c=G.canRename(S,host()); }catch(e){} if(!c.ok) return say(rt(c)||why(c.reason));
    const o=G.ensure(S); if(G.nameValid(o.nameA,o.nameB)){ X.pk.ra=o.nameA; X.pk.rb=o.nameB; } X.ren=true; redraw(); },
  rename(){ const G=GM(), p=X.pk; if(!pkOk('ra')) return; sfx('ui_tap'); let c={ok:false}; try{ c=G.canRename(S,host(),p.ra,p.rb); }catch(e){} if(!c.ok) return say(rt(c)||why(c.reason));
    const o=G.ensure(S); if(o.nameA===p.ra&&o.nameB===p.rb) return say('Esse já é o nome da guilda');
    X.open=''; ask('rename',{nameA:p.ra,nameB:p.rb},'Trocar o nome da guilda para <b>'+esc2(G.nameOf(p.ra,p.rb))+'</b>? Não custa nada. Depois desta troca, a próxima só em '+nT(G.DATA.rename.everyDays)+' dias.','Trocar nome'); },
  join(b){ const id=String(b.dataset.id||''), n=GN(); if(!id) return; sfx('ui_tap'); let c={ok:true}; try{ c=GM().canJoin(S,host(),id); }catch(e){} if(!c.ok) return say(whyLocal(c));
    run('Carregando…',()=>n.join(S,host(),id),r=>r.status==='requested'?'Pedido enviado. O líder ou um oficial precisa aceitar':'Você entrou na guilda',()=>{ delete X.d.list; X.tab='members'; X.top=true; }); },
  /* criar: o nome é o par dos seletores (índices); canCreate devolve o body {nameA, nameB, styleIdx} que vai ao servidor, sem texto livre */
  create(){ sfx('ui_tap'); const p=X.pk; let c={ok:false}; try{ c=GM().canCreate(S,host(),p.ca,p.cb,p.cs); }catch(e){}
    if(!c.ok) return say(rt(c)||whyLocal(c)); X.open='';
    ask('create',Object.assign({},c.body),'Criar a guilda <b>'+esc2(c.name)+'</b> por <b>'+esc2(kfT(c.gold))+' de ouro</b>? Você será o líder.','Criar guilda'); },
  tour(){ sfx('ui_tap'); try{ if(window.Panels&&Panels.open&&Panels.open('tourney',{from:N})) return; }catch(e){} say('O Torneio do Poder ainda não abriu'); },
  /* 2º toque: só aqui a ação que muda o servidor é enviada */
  yes(){ const c=X.conf, n=GN(), h=host(), G=GM(); if(!c||!n) return; sfx('ui_tap'); X.conf=null;
    if(c.k==='kick'){ const nm=memName(c.id); return run('Expulsando…',()=>n.kick(S,h,c.id),nm+' saiu da guilda',()=>{ X.sel=''; }); }
    if(c.k==='transfer'){ const nm=memName(c.id); return run('Passando a liderança…',()=>n.transfer(S,h,c.id),nm+' agora é '+roleName('leader'),()=>{ X.sel=''; }); }
    if(c.k==='leave') return run('Saindo da guilda…',()=>n.leave(S,h),'Você saiu da guilda',()=>{ X.d={}; X.sel=''; X.tab='members'; X.hit=null; });
    if(c.k==='buy'){ const it=shopItems().find(x=>x.id===c.id); return run('Trocando…',()=>n.shopBuy(S,h,c.id),'Trocado: '+(it?it.name:'item')+'. Chega pelo correio',()=>{ delete X.d.shop; }); }
    if(c.k==='don'){ const d=(G.DATA.donate||[]).find(x=>x.id===c.id); if(!d) return redraw(); const cost=donCost(d); if(!cost.ok) return say(d.gems?'Faltam diamantes para esta doação':'Falta ouro para esta doação');
      /* contrato 10.4 e 10.5: quem debita o ouro ou o diamante é o jogo, UMA vez e só DEPOIS de o servidor aceitar, e o valor é o cost:{goldk, gems} da resposta
         (goldk × ouro de um abate); o servidor confere pelo resumo do save. Só se a resposta vier sem o cost vale o valor da tabela do jogo, que é a que o servidor lê */
      const gain=r=>{ const q=(r&&r.gained)||{}; return {coin:isN(q.coin)?q.coin:d.coin,xp:isN(q.xp)?q.xp:d.xp}; };
      return run('Doando…',()=>n.donate(S,h,d.id),r=>{ const q=gain(r); return 'Doado: +'+nT(q.coin)+' '+coinName(q.coin)+', +'+nT(q.xp)+' XP da guilda'; },r=>{ const pay=srvCost(r.cost)||cost, q=gain(r);
        try{ if(pay.gems>0&&h&&h.spendGems) h.spendGems(pay.gems); if(pay.gold>0&&h&&h.spendGold) h.spendGold(pay.gold); }catch(e){} fx('+'+nT(q.coin)+' '+coinName(q.coin),'#5ee7ff'); }); }
    if(c.k==='create'){ const b=(c.id&&typeof c.id==='object')?c.id:{}; let cc={ok:false}; try{ cc=G.canCreate(S,h,b.nameA,b.nameB,b.styleIdx); }catch(e){} if(!cc.ok) return say(rt(cc)||whyLocal(cc));
      /* contrato 10.1: o custo em ouro é cobrado pelo jogo (depois de o servidor aceitar) e conferido no save. O corpo é o cc.body do Sys.guild: índices, sem name nem description */
      return run('Criando a guilda…',()=>n.create(S,h,Object.assign({emblemId:0,lang:'pt',open:true,minLevel:1},cc.body)),'Guilda criada! Você é o líder',()=>{ try{ if(h&&h.spendGold) h.spendGold(cc.gold); }catch(e){} X.d={}; X.open=''; X.tab='members'; X.top=true; }); }
    /* nome e estilo da guilda (só o líder): PATCH /guild {nameA, nameB} e PATCH /guild {styleIdx}; sem custo */
    if(c.k==='rename'){ const b=(c.id&&typeof c.id==='object')?c.id:{}; let cc={ok:false}; try{ cc=G.canRename(S,h,b.nameA,b.nameB); }catch(e){} if(!cc.ok) return say(rt(cc)||why(cc.reason));
      if(typeof n.patch!=='function') return say('Trocar o nome ainda não está disponível');
      return run('Trocando o nome',()=>n.patch(S,h,{nameA:b.nameA,nameB:b.nameB}),'Nome da guilda trocado',()=>{ X.ren=false; X.open=''; }); }
    if(c.k==='restyle'){ let cc={ok:false}; try{ cc=G.canRestyle(S,h,c.id); }catch(e){} if(!cc.ok) return say(rt(cc)||why(cc.reason));
      if(typeof n.patch!=='function') return say('Trocar o estilo ainda não está disponível');
      return run('Trocando o estilo',()=>n.patch(S,h,{styleIdx:c.id}),'Estilo da guilda trocado',()=>{ X.open=''; }); }
    redraw(); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!GM()) return;
  if(X.busy) return;                                    /* uma ação por vez: o resto espera a resposta do servidor */
  if(a!=='tab'&&a!=='sel'&&a!=='no'&&a!=='retry'&&a!=='tour'&&!online()) return say('Em breve: abre com o online');
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[IC.coin,IC.gem,IC.chest,IC.forge,IC.pets,IC.mounts,IC.tourney]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); const G=GM(); if(G&&online()){ const o=G.ensure(S); if(o.id) u.push(bossUrl(o.level)); } }catch(e){} return u; }

if(!('guild2' in PANEL_ON)) PANEL_ON.guild2=false;
const def=Panels.add(N,{title:'Guilda',actions:Object.keys(ACT),urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()) return; if(X.toast&&Date.now()-X.toastT>2600){ X.toast=''; try{ const el=document.getElementById('gd2_toast'); if(el) el.innerHTML=''; }catch(e){} }
    if(X.busy) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&X.sig!=='x'&&sig()!==X.sig) redraw(); },
  busy(){ return !!X.busy; },
  onOpen(){ loopStop(); X.tab='members'; X.sel=''; X.conf=null; X.busy=''; X.toast=''; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.d={}; X.hit=null; X.fx=[]; X.glow=0; X.open=''; X.plk=''; X.ren=false; X.pk.qa=null; X.pk.qb=null;
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){}   /* pede a carga das imagens já na abertura */
    /* contrato 12.1: ao abrir a tela de guilda, o jogo refaz a leitura da guilda no servidor */
    try{ const n=GN(); if(n&&online()&&typeof n.refresh==='function') Promise.resolve(n.refresh(S,host())).then(redraw,()=>{}); }catch(e){} },
  onClose(){ loopStop(); X.conf=null; X.toast=''; X.busy=''; } });
/* para o teste de fumaça e para conferir no console (somente leitura por convenção) */
window.Guild2={X:X,def:def,urls:urls,why:why,whyR:whyR};
})();
