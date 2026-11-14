'use strict';
/* ================= 09 CONFIGURAÇÕES — tela nova, nasce DESLIGADA (PANEL_ON.cfg = false) =================
   Protótipo: docs/proto/Configuracoes.dc.html (painel de metal, abas internas, cartões de pergaminho, rodapé). Só o CONTEÚDO: o cabeçalho
   (voltar, título, moedas e gemas) é do index.html/fullbattle.js.
   NENHUMA regra de jogo aqui. Cada opção usa as MESMAS chamadas do modal antigo (openSettings, index.html):
   - som: S.set.sound + GameAudio.setEnabled + syncMus · vibração: S.set.vib · chefe sozinho: S.set.autoBoss · gravação: save();
   - velocidade: quem libera é o Sys.vip.maxSpeed(S, Sys.host) (lido por canSpeed/speedInfo do index); a troca grava B.speed e S.set.spd e chama syncSpeed();
   - resetar: window.__noSave=true, apaga localStorage[SAVE_KEY] e recarrega (igual ao "Apagar tudo").
   O jogo é SÓ AUTOMÁTICO (ordem do dono): não existe opção de modo de combate nesta tela.
   3 abas do protótipo: Som · Jogo | Tela · Avisos | Conta · Ajuda. O que o jogo ainda não tem (qualidade gráfica, economia de bateria, notificações,
   vincular Google/Apple, idioma, ID do jogador, central de ajuda) aparece DESABILITADO com o selo "em breve" (decisão do PO): não muda valor, não grava
   nada e não mostra dado inventado. "Código de resgate" não é desenhado até existir.
   SOBRE (cartão Suporte, aba Conta · Ajuda): nome do jogo, versão e os Termos de Uso e a Política de Privacidade. É o destino de "Configurações › Sobre",
   citado na Tela Inicial e no Login (js/p_title3.js, js/p_intro.js). O jogo não traz o texto dos documentos: a janela repete a frase de aceite das telas de
   entrada e aponta para as páginas públicas do servidor (/termos e /privacidade, no mesmo endereço da página de exclusão do js/delacct.js).
   MENU DE DEPURAÇÃO DO APP DEV: 5 toques no número da versão (rodapé) chamam window.DevMenu.tap(). O DevMenu (js/devmenu.js) só existe no build DEV;
   fora dele o toque não faz nada.
   Cópia de segurança (decisão do PO): o save S vira um código de texto (prefixo EON1: + JSON em UTF-8 em base64 + ponto + 8 letras de conferência) para copiar e colar.
   O código nunca sai do aparelho por conta do jogo: não há rede aqui. */
const XC={page:0,anim:true,cards:true,keep:false,dlg:null,code:'',copied:false,imp:'',err:'',src:null,toast:'',toastT:0,flip:'',selp:0,shk:0,drag:false,dragT:0,sig:''};
const C_PRE='EON1:', C_MAX=3e6;                 /* prefixo de versão do código e tamanho máximo aceito (caracteres) */
/* volumes de fábrica do js/audio.js (VOL.music e VOL.sfx): a API não devolve o valor atual, então o ponto de partida dos controles fica isolado aqui */
const C_VOL0={mus:50,sfx:90};
/* páginas públicas dos documentos (servidor do jogo; a de exclusão de conta é a do js/delacct.js) */
const C_LEGAL={terms:'https://15-229-249-157.sslip.io/termos',privacy:'https://15-229-249-157.sslip.io/privacidade'};

/* ---------- leituras e chamadas isoladas (valor de reserva seguro) ---------- */
const cAudio=()=>window.GameAudio||null;
const cHasVol=()=>{ const g=cAudio(); return !!(g&&typeof g.setVolume==='function'); };      /* sem setVolume, os controles de volume não aparecem */
const cVol=k=>{ const v=S.set[k==='mus'?'volMus':'volSfx']; return typeof v==='number'&&isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):C_VOL0[k]; };
const cMuted=k=>!!S.set[k==='mus'?'musOff':'sfxOff'];
const cShown=k=>cMuted(k)?0:cVol(k);
function cVolApply(){ const g=cAudio(); if(!g||typeof g.setVolume!=='function') return false; try{ g.setVolume({music:cShown('mus')/100,sfx:cShown('sfx')/100}); return true; }catch(e){ return false; } }
const cVolSaved=()=>S.set.volMus!==undefined||S.set.volSfx!==undefined||S.set.musOff!==undefined||S.set.sfxOff!==undefined;
/* o js/audio.js carrega depois (assíncrono): quem já mexeu no volume tem o valor reaplicado quando o áudio existir; quem nunca mexeu, nada muda */
(function cVolBoot(n){ try{ if(!cVolSaved()) return; }catch(e){ return; } if(cVolApply()||n>=20) return; setTimeout(()=>cVolBoot(n+1),500); })(0);
const cCan=n=>{ try{ return typeof canSpeed==='function'?!!canSpeed(n):n===1; }catch(e){ return n===1; } };
function cSpeeds(){ let l=null; try{ l=Sys.vip.maxSpeed(S,Sys.host).speeds; }catch(e){}
  if(!Array.isArray(l)||!l.length) l=[{speed:1,unlocked:true,text:''}];
  return l.map(x=>({speed:x.speed,text:x.text||'',ok:cCan(x.speed)})); }
const cSpdNow=()=>{ try{ return B.speed||1; }catch(e){ return 1; } };
function cSetSpeed(n){ try{ B.speed=n; }catch(e){} S.set.spd=n; save(); try{ if(typeof syncSpeed==='function') syncSpeed(); }catch(e){} }
const cLv=o=>{ try{ return Sys.level.level(o); }catch(e){ return 0; } };
const cTier=()=>{ try{ const sa=SKIN(S.skinEq.armor); return tierOf(sa?sa.r:0); }catch(e){ return 0; } };
const cName=()=>{ try{ return typeof GAME_NAME==='string'&&GAME_NAME?GAME_NAME:'Eonbound'; }catch(e){ return 'Eonbound'; } };
const cVer=()=>{ try{ return VERSION+(DEBUG?' · DEBUG':''); }catch(e){ return ''; } };
function cOn(){ return typeof view!=='undefined'&&view==='cfg'; }

/* ---------- código de cópia de segurança: EON1: + base64( UTF-8( JSON do save ) ) ---------- */
function cB64e(str){ return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,(m,h)=>String.fromCharCode(parseInt(h,16)))); }
function cB64d(b){ const bin=atob(b); let p=''; for(let i=0;i<bin.length;i++){ const c=bin.charCodeAt(i); p+='%'+(c<16?'0':'')+c.toString(16); } return decodeURIComponent(p); }   /* UTF-8 inválido lança erro */
/* conferência do código (FNV-1a de 32 bits, 8 letras no fim): pega caractere trocado ou pedaço faltando, que o base64 sozinho deixaria passar */
function cSum(s){ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); } return ('0000000'+(h>>>0).toString(16)).slice(-8); }
function cExport(){ try{ save(); const b=cB64e(JSON.stringify(S)); return C_PRE+b+'.'+cSum(b); }catch(e){ return ''; } }
/* campos mínimos de um save do jogo (os de newState() que o jogo lê sem valor de reserva). O código sempre vem de um jogo rodando, já migrado:
   nada é completado nem alterado aqui; o que entra é exatamente o que foi exportado, e o load() do index faz as migrações de sempre ao recarregar. */
function cCheck(o){ const num=v=>typeof v==='number'&&isFinite(v), obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  if(!obj(o)) return 'formato';
  for(const k of ['gold','gems','kills']) if(!num(o[k])||o[k]<0) return k;
  for(const k of ['stage','wave','best','nextId']) if(!num(o[k])||o[k]<1) return k;
  if(!num(o.eraMax)||o.eraMax<0) return 'eraMax';
  if(!Array.isArray(o.inv)) return 'inv';
  const ids={}; for(const it of o.inv){ if(!obj(it)||!num(it.id)||typeof it.slot!=='string'||!num(it.r)) return 'inv'; ids[it.id]=1; }
  if(!obj(o.eq)) return 'eq';
  for(const k in o.eq) if(o.eq[k]!=null&&!ids[o.eq[k]]) return 'eq';
  if(!Array.isArray(o.skins)||o.skins.some(x=>typeof x!=='string')) return 'skins';
  if(!obj(o.skinEq)||typeof o.skinEq.weapon!=='string'||typeof o.skinEq.armor!=='string') return 'skinEq';
  if(o.set!==undefined&&!obj(o.set)) return 'set';
  return ''; }
function cParse(txt){ const t=String(txt==null?'':txt).replace(/\s+/g,'');
  if(!t) return {ok:false,msg:'Cole o código no campo primeiro.'};
  if(t.length>C_MAX) return {ok:false,msg:'Código grande demais: não é um código de progresso.'};
  if(t.slice(0,C_PRE.length).toUpperCase()!==C_PRE) return {ok:false,msg:'Código inválido: ele precisa começar com '+C_PRE};
  const rest=t.slice(C_PRE.length), dot=rest.lastIndexOf('.'), b=dot<0?'':rest.slice(0,dot), sum=dot<0?'':rest.slice(dot+1).toLowerCase();
  if(!b||b.length%4!==0||!/^[A-Za-z0-9+\/]+={0,2}$/.test(b)||sum!==cSum(b)) return {ok:false,msg:'Código incompleto ou alterado. Copie de novo, inteiro.'};
  let o; try{ o=JSON.parse(cB64d(b)); }catch(e){ return {ok:false,msg:'Código danificado: não deu para ler. Copie de novo, inteiro.'}; }
  if(cCheck(o)) return {ok:false,msg:'Este código não traz um progresso válido do jogo.'};
  const rm=cRealmMsg(o); if(rm) return {ok:false,msg:rm};
  return {ok:true,save:o}; }
/* SAVES POR SERVIDOR (index.html: window.Realm; cada save leva S.realm e um save de outro servidor NÃO é carregado): um código só entra no servidor
   em que foi exportado. De outro servidor é RECUSADO com aviso, sem gravar nada (não se carimba por cima: seria copiar progresso entre servidores).
   Código antigo, sem o campo realm, vale como S1. */
const cRealmNow=()=>{ try{ const r=window.Realm&&typeof Realm.id==='function'?Realm.id():''; return /^s[0-9]{1,3}$/.test(r||'')?r:'s1'; }catch(e){ return 's1'; } };
const cRealmOf=o=>(o&&typeof o.realm==='string'&&/^s[0-9]{1,3}$/.test(o.realm))?o.realm:'s1';
/* LINHA "SERVIDOR" (cartão Conta): o selo vem do realmBadge() do js/p_realm.js ("S1 · Nova Era") e o botão abre o painel 'realm' (Panels.open; o Voltar
   devolve às Configurações). Sem realmBadge (arquivo não carregado) ou sem o selo: a linha não aparece. Painel desligado: selo sem botão. */
function cRealmBadge(){ try{ if(typeof window.realmBadge!=='function') return ''; const t=window.realmBadge(); return typeof t==='string'?t.trim():''; }catch(e){ return ''; } }
function cRealmRow(){ const t=cRealmBadge(); if(!t) return ''; const can=!!(window.Panels&&Panels.on('realm'));
  return `<div class="c-row" data-row="realm" style="animation-delay:.14s">${cI(C_IC.globe,24,'#ffc94a',2.3)}
          <span class="c-rl"><b>Servidor</b><small style="overflow-wrap:anywhere">${esc2(t)}</small></span>
          ${can?`<button class="c-dark" data-x="realm" aria-label="Trocar servidor. Atual: ${esc2(t)}" style="width:96px;min-height:44px;flex:none;margin-right:4px;border-radius:12px;font-size:13px;font-weight:900;line-height:1.1;padding:2px 4px;box-sizing:border-box">Trocar servidor</button>`:''}</div>`; }
/* EXCLUIR CONTA (exigência da Play): botão discreto no fim do cartão Conta. A tela é do js/delacct.js (window.DeleteAccount.open(), de Sistemas). Aparece
   fora do Modo dono e só quando DeleteAccount existe; com o online desligado continua visível (a tela mostra o link da página de exclusão). */
const cOwner=()=>{ try{ return typeof OWNER_MODE!=='undefined'&&OWNER_MODE===true; }catch(e){ return false; } };
const cDelOn=()=>{ try{ return !cOwner()&&!!window.DeleteAccount&&typeof window.DeleteAccount.open==='function'; }catch(e){ return false; } };
/* VINCULAR CONTA (Google): só com o online ligado (window.OnlineBoot.state().on, js/onlineboot.js); desligado, a linha "EM BREVE" de antes.
   Já vinculado = Sys.net.player().linked traz 'google' (PlayerDto do docs/API_SERVIDOR.md; email quando o servidor mandar) ou o vínculo feito nesta sessão.
   O toque chama OnlineBoot.google() → {ok, action:'login'|'linked'} | {ok:false, reason}. Apple continua "Em breve". Uma chamada por vez (XC.gbusy). */
const cLinkOn=()=>{ try{ const O=window.OnlineBoot; return !!(O&&typeof O.state==='function'&&typeof O.google==='function'&&O.state().on); }catch(e){ return false; } };
function cLinked(){ try{ const p=window.Sys&&Sys.net&&typeof Sys.net.player==='function'?Sys.net.player():null; if(p&&Array.isArray(p.linked)&&p.linked.indexOf('google')>=0) return {on:true,email:typeof p.email==='string'?p.email:''}; }catch(e){}
  return XC.glinked?{on:true,email:''}:{on:false,email:''}; }
function cLinkGoogle(){ const k=cLinked(), st='flex:1;min-width:0;height:52px;border-radius:12px;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 6px;box-sizing:border-box';
  const two=(a,b)=>`<span style="display:flex;flex-direction:column;line-height:1.1;text-align:left;min-width:0"><span>${a}</span><span style="font-size:11px;font-weight:800;opacity:.85;overflow-wrap:anywhere">${b}</span></span>`;
  if(k.on) return `<span data-glink="on" role="status" aria-label="Conta Google vinculada${k.email?': '+esc2(k.email):''}" style="${st};border:2px solid #2f6b36;background:#12261a;color:#9be89f">${cI(C_IC.chk,18,'#9be89f',3)}${two('Google',k.email?esc2(k.email):'Vinculada')}</span>`;
  if(XC.gbusy) return `<span data-glink="busy" role="status" style="${st};border:2px solid #4a3a2b;background:#16110d;color:#c9b9a2">${cI(C_IC.cloud,18,'#ffc94a',2.4)}${two('Google','Conectando...')}</span>`;
  return `<button class="c-dark" data-x="glink" data-glink="off" aria-label="Vincular conta Google" style="${st}">${cI(C_IC.cloud,18,'#ffc94a',2.4)}${two('Google','Vincular')}</button>`; }
const C_GMSG={google_unavailable:'Disponível no aplicativo',cancelled:'Vinculação cancelada',canceled:'Vinculação cancelada',offline:'Sem conexão: tente de novo',network:'Sem conexão: tente de novo',timeout:'Sem resposta: tente de novo',
  link_taken:'Essa conta Google já é de outro jogador',already_linked:'Este jogador já tem outra conta Google vinculada',nosave:'Aguarde o jogo terminar de carregar',off:'Online desligado nesta versão'};
function cLinkGo(){ if(XC.gbusy) return; let p=null; try{ p=window.OnlineBoot.google(); }catch(e){ p=null; }
  if(!p||typeof p.then!=='function'){ cSay('Não deu para vincular agora'); return; }
  XC.gbusy=true; XC.keep=true; if(view==='cfg') render();
  const fin=r=>{ XC.gbusy=false; let msg; if(r&&r.ok){ XC.glinked=true; msg=r.action==='login'?'Você entrou na sua conta Google':'Conta Google vinculada'; }
      else { const w=r&&r.reason; msg=C_GMSG[w]||'Não deu para vincular agora'; if(w==='link_taken'&&r.other&&r.other.name) msg+=' ('+String(r.other.name).slice(0,24)+')'; }
      if(view==='cfg'){ XC.keep=true; try{ render(); }catch(e){} } cSay(msg); };
  p.then(fin,()=>fin(null)); }
/* nome do servidor para o aviso: "S1 · Nova Era" pela lista do js/p_realm.js (RealmUI.list); sem ela, só "S1" */
function cRealmName(id){ const nm=String(id||'s1').toUpperCase(); try{ const L=window.RealmUI&&typeof RealmUI.list==='function'?RealmUI.list():null, r=Array.isArray(L)?L.find(x=>x&&x.id===id):null; if(r&&r.name) return (r.code||nm)+' · '+r.name; }catch(e){} return nm; }
function cRealmMsg(o){ const from=cRealmOf(o); if(from===cRealmNow()) return ''; return 'Este código é do servidor '+cRealmName(from)+'. Troque de servidor para usar.'; }
/* grava o save importado e recarrega, do mesmo jeito que o "Apagar tudo": __noSave antes, para o save de saída não escrever por cima */
function cImportDo(){ const o=XC.src; if(!o) return false; const prev=window.__noSave; let ok=false;
  { const rm=cRealmMsg(o); if(rm){ XC.src=null; XC.dlg='imp'; XC.err=rm; try{ render(); }catch(e){} return false; } }   /* segunda trava (o cParse já recusa): código de outro servidor NUNCA é gravado; o aviso fica na janela de importar */
  try{ const j=JSON.stringify(o); window.__noSave=true; localStorage.setItem(SAVE_KEY,j); ok=localStorage.getItem(SAVE_KEY)===j; }catch(e){ ok=false; }
  if(!ok){ window.__noSave=prev; try{ save(); }catch(e){} XC.dlg='imp'; XC.err='Não deu para gravar neste aparelho. Nada mudou.'; render(); return false; }
  location.href=location.pathname+location.search; return true; }
function cResetDo(){ window.__noSave=true; try{ localStorage.removeItem(SAVE_KEY); }catch(e){} location.href=location.pathname+location.search; }

(function(){ const st=document.createElement('style'); st.textContent=`
.c-in{animation:c-fade .22s ease-out}
@keyframes c-fade{from{opacity:0}to{opacity:1}}
.c-bg{position:absolute;inset:0;filter:blur(5px) saturate(1.1);   /* era inset:-14px (388 px numa tela de 360): o fundo não passa mais da largura; a borda do desfoque fica sob a vinheta escura */background:#7fb3d9;pointer-events:none}
.c-frame{position:relative;flex:1;min-height:0;width:calc(100% - 20px);max-width:640px;margin:8px auto 12px;box-sizing:border-box;border-radius:26px;padding:4px;background:linear-gradient(160deg,#9a8a74,#3a3028 26%,#7a6852 52%,#2a2018 78%,#8a7860);box-shadow:0 22px 50px rgba(0,0,0,.65),0 0 0 2px #140e08;display:flex;flex-direction:column}
.c-in .c-frame{animation:c-panelIn .55s cubic-bezier(.2,1.3,.4,1) both}
@keyframes c-panelIn{0%{transform:translateY(-40px) scale(.94);opacity:0}100%{transform:none;opacity:1}}
.c-rivet{position:absolute;width:10px;height:10px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6d0,#c9a060 45%,#5a4024);box-shadow:0 1px 1px rgba(0,0,0,.6);z-index:2;pointer-events:none}
.c-inner{position:relative;flex:1;min-height:0;border-radius:22px;overflow:hidden;background:linear-gradient(180deg,rgba(30,22,15,.9),rgba(20,15,10,.93));display:flex;flex-direction:column}
.c-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.35) 50%,transparent 65%);background-size:250% 100%;animation:c-sh 3.4s ease-in-out infinite;pointer-events:none}
@keyframes c-sh{0%,45%{background-position:150% 0}100%{background-position:-60% 0}}
.c-tab{flex:1;min-width:0;height:54px;border-radius:14px;border:2px solid #4a3a2b;background:#1d1611;color:#c9b9a2!important;padding:0 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:900;transition:transform .15s}
.c-in .c-tab{animation:c-tabIn .4s cubic-bezier(.2,1.4,.4,1) both}
@keyframes c-tabIn{from{opacity:0;transform:translateY(-10px) scale(.9)}to{opacity:1;transform:none}}
.c-tab.sel{border-color:#ffc94a;background:linear-gradient(180deg,#5a4020,#33271d);color:#ffe07a!important;box-shadow:0 0 14px rgba(255,201,74,.45)}
.c-tab:active{transform:scale(.95)}
.c-tab .c-ti{display:flex;gap:6px}
.c-tab.sel .c-ti svg{animation:c-tib 1.8s ease-in-out infinite}
@keyframes c-tib{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.c-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;padding:6px 10px 10px;display:flex;flex-direction:column;gap:10px}
.c-scroll::after{content:"";flex:none;height:18px}   /* folga de rolagem no fim: alguns WebViews ignoram o padding de baixo de um rolador flex e a última linha (dica do x4) parava colada/sob a barra "Salvo automaticamente" */
.c-card{flex:none;border-radius:16px;background:linear-gradient(180deg,rgba(48,36,24,.97),rgba(30,22,15,.97));border:2px solid #5a4632;box-shadow:inset 0 1px 0 rgba(255,230,180,.12),0 4px 0 rgba(0,0,0,.35);overflow:hidden}
.c-cards .c-card{animation:c-cardIn .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes c-cardIn{0%{opacity:0;transform:translateX(50px) scale(.94)}100%{opacity:1;transform:none}}
.c-chead{position:relative;height:42px;display:flex;align-items:center;gap:8px;padding:0 10px 0 6px;background:linear-gradient(180deg,#f3e4c0,#d6bc88);border-bottom:2px solid #8a6a3a;overflow:hidden}
.c-chead h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:19px;color:#2a1403;flex:1}
.c-chead .c-hint{font-size:11px;font-weight:900;color:#5a3a12}
.c-medal{width:32px;height:32px;flex:none;border-radius:50%;background:radial-gradient(circle at 40% 35%,#6a4a18,#2a1d0f);border:2px solid #ffc94a;display:flex;align-items:center;justify-content:center;box-sizing:border-box;animation:c-medalK 2.4s ease-in-out infinite}
@keyframes c-medalK{0%,100%{box-shadow:0 0 4px rgba(255,201,74,.4)}50%{box-shadow:0 0 14px rgba(255,201,74,1)}}
.c-cbody{padding:8px;display:flex;flex-direction:column;gap:6px}
.c-row{min-height:58px;display:flex;align-items:center;gap:10px;padding:0 4px 0 10px;border-radius:12px;background:rgba(0,0,0,.24);border:1px solid rgba(255,220,160,.08);box-sizing:border-box}
.c-cards .c-row{animation:c-rowIn .4s ease-out both}
@keyframes c-rowIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:none}}
.c-rl{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.c-rl b{font-size:15px;font-weight:900}
.c-rl small{font-size:11.5px;font-weight:700;color:#c9b9a2}
.c-wig{animation:c-wigK 2.8s ease-in-out infinite}
@keyframes c-wigK{0%,80%,100%{transform:rotate(0)}84%{transform:rotate(-12deg)}88%{transform:rotate(12deg)}92%{transform:rotate(-8deg)}96%{transform:rotate(6deg)}}
.c-off{filter:grayscale(1) brightness(.6)}
.c-sw{width:66px;height:44px;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:center;flex:none}
.c-track{position:relative;width:58px;height:32px;border-radius:16px;background:#0e0a07;border:2px solid #4a3a2b;box-sizing:border-box;display:block;transition:background .2s,border-color .2s}
.c-knob{position:absolute;top:2px;left:2px;width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#f6ecdf,#a8987f);box-shadow:0 2px 0 rgba(0,0,0,.45)}
.c-track.on{background:linear-gradient(180deg,#6ad872,#3fae3c);border-color:#2f8a2c}
.c-track.on .c-knob{left:28px;background:linear-gradient(180deg,#fff,#e8ffe0);box-shadow:0 2px 0 rgba(0,0,0,.45),0 0 10px rgba(160,255,160,.95)}
.c-track.fl .c-knob{animation:c-koff .25s cubic-bezier(.3,1.6,.5,1)}
.c-track.on.fl .c-knob{animation:c-kon .25s cubic-bezier(.3,1.6,.5,1)}
@keyframes c-kon{from{left:2px}}
@keyframes c-koff{from{left:28px}}
.c-seg{display:flex;gap:6px}
.c-sb{flex:1;min-width:0;height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#16110d;color:#c9b9a2!important;font-size:14px;font-weight:900;padding:0 4px;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;transition:transform .15s,background .2s}
.c-sb.sel{border-color:#ffc94a;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 4px 0 #8a4f0c}
.c-sb.selp{animation:c-selpK .35s cubic-bezier(.2,1.6,.4,1)}
@keyframes c-selpK{0%{transform:scale(.88)}100%{transform:none}}
.c-sb.lock{background:repeating-linear-gradient(135deg,#16110d 0 8px,#1d1611 8px 16px);color:#8a7a66!important;border-style:dashed}
.c-sb:active{transform:scale(.95)}
.c-shk{animation:c-shkK .4s}
@keyframes c-shkK{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
.c-spd{font-family:'Lilita One',Nunito,sans-serif;font-size:20px}
.c-rng{-webkit-appearance:none;appearance:none;width:100%;height:44px;background:transparent;margin:0;padding:0;cursor:pointer;display:block;touch-action:pan-y}
.c-rng:focus{outline:none}
.c-rng::-webkit-slider-runnable-track{height:14px;border-radius:7px;background:linear-gradient(90deg,#f2a826 0%,#ffe07a var(--p),#0e0a07 var(--p));border:2px solid #6a4a1a}
.c-rng::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;margin-top:-10px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff6d0,#ffc94a 45%,#c9831a);border:2px solid #6a3a08;box-shadow:0 2px 0 #6a3a08,0 0 12px rgba(255,201,74,.8)}
.c-rng::-moz-range-track{height:12px;border-radius:7px;background:linear-gradient(90deg,#f2a826 0%,#ffe07a var(--p),#0e0a07 var(--p));border:2px solid #6a4a1a}
.c-rng::-moz-range-thumb{width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 40% 35%,#fff6d0,#ffc94a 45%,#c9831a);border:2px solid #6a3a08;box-shadow:0 0 12px rgba(255,201,74,.8)}
.c-rng.muted::-webkit-slider-runnable-track{background:#0e0a07}
.c-rng.muted::-moz-range-track{background:#0e0a07}
.c-ibtn{width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:radial-gradient(circle at 40% 35%,#4a3418,#1d1611);color:#ffc94a!important;display:flex;align-items:center;justify-content:center;padding:0;box-sizing:border-box}
.c-ibtn.mut{color:#8a7a66!important;border-color:#4a3a2b}
.c-eq{display:inline-flex;gap:2px;align-items:flex-end;height:14px;width:16px;transform-origin:50% 100%}
.c-eq i{width:3px;background:#5fd068;border-radius:1px;animation:c-eqa .8s ease-in-out infinite}
.c-eq i:nth-child(2){animation-delay:.2s}.c-eq i:nth-child(3){animation-delay:.4s}.c-eq i:nth-child(4){animation-delay:.1s}
@keyframes c-eqa{0%,100%{height:3px}50%{height:14px}}
.c-val{width:44px;flex:none;text-align:right;font-family:'Lilita One',Nunito,sans-serif;font-size:17px;color:#ffe07a}
.c-ok{color:#5fd068}.c-no{color:#ff9a8a}
.c-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.c-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.c-dark{border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf!important}
.c-dark:active,.c-red:active,.c-warn:active{transform:scale(.96)}
.c-red{border:0;background:linear-gradient(180deg,#e05555,#a02020);color:#fff!important;box-shadow:0 6px 0 #5a1010}
.c-warn{border:2px solid #a8423a;background:rgba(255,90,78,.12);color:#ffb3a8!important}
.c-toast{animation:c-ts 2.4s ease-out both}
@keyframes c-ts{0%{opacity:0;transform:translateY(-14px) scale(.95)}10%,85%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-14px)}}
.c-veil{animation:c-veilK .2s ease-out both}
@keyframes c-veilK{from{opacity:0}to{opacity:1}}
.c-pop{animation:c-popK .35s cubic-bezier(.2,1.5,.4,1) both}
@keyframes c-popK{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.c-saved{animation:c-savedK 2.4s ease-in-out infinite}
@keyframes c-savedK{0%,100%{opacity:.7}50%{opacity:1}}
.c-field{display:block;width:100%;height:118px;resize:none;margin:0;border-radius:14px;border:2px solid #4a3a2b;background:#0e0a07;color:#f6ecdf;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:16px;line-height:1.25;padding:8px 10px;box-sizing:border-box;word-break:break-all;overflow-y:auto;overflow-x:hidden;-webkit-user-select:text;user-select:text;-webkit-touch-callout:default;touch-action:pan-y}
.c-soon{display:inline-block;vertical-align:middle;flex:none;padding:2px 6px;border-radius:999px;border:1px dashed #8a7458;background:rgba(14,10,7,.7);color:#e8dccb;font-family:Nunito,system-ui,sans-serif;font-size:9.5px;font-weight:900;letter-spacing:.5px;line-height:1.2;white-space:nowrap}
.c-dis{opacity:.55;filter:grayscale(.7)}
.c-dis button[disabled],.c-dis button[disabled]:active{cursor:default;transform:none;pointer-events:none}
.c-link{flex:1;min-width:0;height:52px;border-radius:12px;border:2px solid #4a3a2b;background:#16110d;color:#c9b9a2!important;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;padding:0 6px;box-sizing:border-box}
.c-nav{flex:1;min-width:0;min-height:56px;border:1px solid rgba(255,220,160,.08);border-radius:12px;background:rgba(0,0,0,.24);display:flex;align-items:center;gap:10px;padding:0 10px;text-align:left;box-sizing:border-box}
.c-cards .c-nav{animation:c-rowIn .4s ease-out both}
.c-field:focus{outline:none;border-color:#ffc94a}
.c-field.err{border-color:#ff5a4e}
`; document.head.appendChild(st); })();

/* ---------- ícones (traços do protótipo) ---------- */
const cI=(d,s,c,w,cls,sty)=>`<svg ${cls?'class="'+cls+'" ':''}width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="${w||2.3}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;${sty||''}"><path d="${d}"></path></svg>`;
const C_IC={
  som:'M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7', somHi:'M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14', mute:'M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  music:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', musicOff:'M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2 2l20 20',
  jogo:'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3',
  user:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  bolt:'M13 2 4 14h7l-1 8 9-12h-7z', phone:'M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 8v8M21 8v8',
  skull:'M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3zM9 12h.01M15 12h.01M10 20v-2M14 20v-2',
  lock:'M6 11h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4',
  gfx:'M3 4h18v15H3zM3 16l5-5 4 4 3-3 6 6', bell:'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  help:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01', book:'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM20 17v5H6.5A2.5 2.5 0 0 1 4 19.5',
  globe:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20', cloud:'M18 10h-1.3A7 7 0 1 0 9 19h9a5 5 0 0 0 0-9z',
  spark:'M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z', box:'M3 9h18v11H3zM3 9l2-5h14l2 5M10 13h4', cal:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',
  chk:'M4 12l6 6L20 6', copy:'M11 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM5 15V5a2 2 0 0 1 2-2h10',
  up:'M12 16V4M7 9l5-5 5 5M4 20h16', down:'M12 4v12M7 11l5 5 5-5M4 20h16', trash:'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5', warn:'M12 3 2 20h20L12 3zM12 10v4M12 17h.01' };
const cMedal=k=>`<span class="c-medal">${cI(C_IC[k],18,'#ffc94a',2.4)}</span>`;
const cHead=(k,title,hint)=>`<div class="c-chead">${cMedal(k)}<h3>${esc2(title)}</h3>${hint?`<span class="c-hint">${esc2(hint)}</span>`:''}<span class="c-shine"></span></div>`;
const cSwitch=(x,on,label)=>`<button class="c-sw" role="switch" aria-checked="${on?'true':'false'}" aria-label="${esc2(label)}" data-x="${x}"><span class="c-track ${on?'on':''} ${XC.flip===x?'fl':''}"><span class="c-knob"></span></span></button>`;

/* ---------- aviso (pergaminho do protótipo) ---------- */
function cToastHtml(msg){ return `<div class="c-toast" role="status" style="position:absolute;left:0;right:0;margin:0 auto;width:calc(100% - 60px);max-width:420px;top:28px;z-index:45;min-height:48px;padding:10px 14px;border-radius:14px;background:linear-gradient(180deg,#f3e4c0,#d6bc88);border:2px solid #8a6a3a;color:#2a1403;font-size:14px;font-weight:900;display:flex;align-items:center;box-sizing:border-box;box-shadow:0 8px 0 rgba(0,0,0,.35);pointer-events:none"><span style="flex:1;text-align:center;line-height:1.2">${esc2(msg)}</span></div>`; }
function cSay(msg){ XC.toast=msg; XC.toastT=Date.now(); const el=document.getElementById('c_toast'); if(el) el.innerHTML=cToastHtml(msg); }

/* ---------- página 1: som e jogo ---------- */
function cPageSound(){
  const snd=!!S.set.sound, vol=cHasVol(), sp=cSpeeds(), cur=cSpdNow();
  const slider=(k,label,ic,icOff,dl)=>{ const v=cVol(k), m=cMuted(k), shown=m?0:v, dead=m||v===0;
    return `<div class="c-row" id="c_r${k}" style="padding:0 8px 0 6px;animation-delay:${dl};${snd?'':'opacity:.55'}">
      <button class="c-ibtn ${dead?'mut':''}" data-x="mute" data-k="${k}" aria-label="${m?'Ligar ':'Silenciar '}${label.toLowerCase()}">${cI(dead?icOff:ic,22,'currentColor',2.3)}</button>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <span style="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:900;height:18px">${label}
          <span class="c-eq" id="c_eq${k}" aria-hidden="true" style="transform:scaleY(${Math.max(.25,shown/100).toFixed(2)});${snd&&shown>0?'':'display:none'}"><i></i><i></i><i></i><i></i></span></span>
        <input class="c-rng ${m?'muted':''}" type="range" min="0" max="100" step="1" value="${v}" data-c="vol" data-k="${k}" aria-label="${label}" style="--p:${shown}%">
      </div>
      <span class="c-val" id="c_v${k}">${shown}%</span></div>`; };
  const seg=sp.map(o=>{ const sel=o.speed===cur, lock=!o.ok;
    return `<button role="radio" aria-checked="${sel?'true':'false'}" aria-label="Velocidade x${o.speed}${lock?', bloqueada. '+esc2(o.text):''}" data-x="spd" data-n="${o.speed}" class="c-sb ${sel?'sel':lock?'lock':''} ${XC.selp===o.speed?'selp':''} ${XC.shk===o.speed?'c-shk':''}">${lock?cI(C_IC.lock,16,'currentColor',2.6):''}<span class="c-spd">x${o.speed}</span></button>`; }).join('');
  const rules=sp.filter(o=>o.text).map((o,i,a)=>`<span class="${o.ok?'c-ok':'c-no'}" style="flex:1;${i&&i===a.length-1?'text-align:right':''}">${esc2(o.text)}</span>`).join('');
  return `<section class="c-card" aria-label="Som">${cHead('somHi','Som',snd?'Ligado':'Desligado')}
      <div class="c-cbody">
        <div class="c-row" style="animation-delay:.06s">${cI(snd?C_IC.somHi:C_IC.mute,24,snd?'#ffc94a':'#8a7a66',2.3)}
          <span class="c-rl"><b>Som</b><small>Música e efeitos do jogo</small></span>${cSwitch('snd',snd,'Som')}</div>
        ${vol?slider('mus','Música',C_IC.music,C_IC.musicOff,'.12s')+slider('sfx','Efeitos',C_IC.som,C_IC.mute,'.18s'):''}
      </div></section>
    <section class="c-card" aria-label="Jogo" style="animation-delay:.1s">${cHead('jogo','Jogo','')}
      <div class="c-cbody">
        <div class="c-row" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px;animation-delay:.2s">
          <div style="display:flex;align-items:center;gap:8px">${cI(C_IC.bolt,22,'#ffc94a',2.3)}
            <span style="flex:1;font-size:15px;font-weight:900">Velocidade da batalha</span>
            <span class="lil" style="font-size:17px;color:#ffe07a">x${cur}</span></div>
          <div class="c-seg" role="radiogroup" aria-label="Velocidade">${seg}</div>
          ${rules?`<div style="display:flex;gap:10px;font-size:11.5px;font-weight:800;line-height:1.2">${rules}</div>`:''}
        </div>
        <div class="c-row" style="animation-delay:.3s">${cI(C_IC.phone,24,'#ffc94a',2.3,S.set.vib?'c-wig':'c-off')}
          <span class="c-rl"><b>Vibração</b><small>Golpes fortes, chefe e prêmios</small></span>${cSwitch('vib',!!S.set.vib,'Vibração')}</div>
        <div class="c-row" style="animation-delay:.38s">${cI(C_IC.skull,24,'#ffc94a',2.3,S.set.autoBoss?'':'c-off')}
          <span class="c-rl"><b>Desafiar o chefe sozinho</b><small>Quando a sua FC chegar à recomendada da fase</small></span>${cSwitch('boss',!!S.set.autoBoss,'Desafiar o chefe sozinho')}</div>
      </div></section>`;
}

/* ---------- linhas "em breve" (decisão do PO): aparecem no lugar e com o desenho do protótipo, DESABILITADAS; o toque só avisa "Em breve";
   nenhuma grava nada no save nem mostra dado inventado ---------- */
const C_SOON='<span class="c-soon">EM BREVE</span>';
const cSwOff=label=>`<button class="c-sw" role="switch" aria-checked="false" aria-label="${esc2(label)}, em breve" disabled aria-disabled="true"><span class="c-track"><span class="c-knob"></span></span></button>`;
const cSegOff=(label,opts,h)=>`<div class="c-seg" role="radiogroup" aria-label="${esc2(label)}, em breve" aria-disabled="true">${opts.map(t=>`<button role="radio" aria-checked="false" disabled aria-disabled="true" class="c-sb" style="${h?'height:'+h+'px;':''}font-size:13px">${esc2(t)}</button>`).join('')}</div>`;

/* ---------- página 2: gráficos e notificações (tudo "em breve") ---------- */
function cPageScreen(){
  const nt=(label,sub,ic,dl)=>`<div class="c-row c-dis" data-x="soon" aria-disabled="true" style="animation-delay:${dl}">${cI(C_IC[ic],26,'#ffc94a',2.2)}
      <span class="c-rl"><b>${label} ${C_SOON}</b><small>${sub}</small></span>${cSwOff(label)}</div>`;
  return `<section class="c-card" aria-label="Gráficos">${cHead('gfx','Gráficos','Em breve')}
      <div class="c-cbody">
        <div class="c-row c-dis" data-x="soon" aria-disabled="true" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px;animation-delay:.1s">
          <div style="display:flex;align-items:center;gap:8px">${cI(C_IC.spark,22,'#ffc94a',2.3)}
            <span style="flex:1;font-size:15px;font-weight:900">Qualidade</span>${C_SOON}</div>
          ${cSegOff('Qualidade gráfica',['Baixa','Média','Alta'])}
        </div>
        <div class="c-row c-dis" data-x="soon" aria-disabled="true" style="animation-delay:.18s">
          <span aria-hidden="true" style="position:relative;width:28px;height:16px;flex:none;margin:0 2px;border:2px solid #ffc94a;border-radius:4px;box-sizing:border-box;padding:2px">
            <span style="display:block;height:100%;width:40%;border-radius:1px;background:#5fd068"></span>
            <span style="position:absolute;right:-6px;top:3px;width:3px;height:6px;border-radius:1px;background:#ffc94a"></span></span>
          <span class="c-rl"><b>Economia de bateria ${C_SOON}</b><small>Menos efeitos e menos quadros</small></span>${cSwOff('Economia de bateria')}</div>
      </div></section>
    <section class="c-card" aria-label="Notificações" style="animation-delay:.1s">${cHead('bell','Notificações','Em breve')}
      <div class="c-cbody">
        ${nt('Baú cheio','Quando o baú encher','box','.12s')}
        ${nt('Energia e instâncias','Energia cheia e chaves renovadas','bolt','.2s')}
        ${nt('Eventos','Evento novo e prêmio pronto','cal','.28s')}
      </div></section>`;
}

/* ---------- página 3: conta (jogador, vincular, cópia de segurança, idioma, resetar) e suporte ---------- */
function cPageAccount(){
  const t=cTier(), lv=cLv(S);
  const link=l=>`<button class="c-link" disabled aria-disabled="true" aria-label="Vincular conta ${l}, em breve">${cI(C_IC.cloud,18,'#ffc94a',2.4)}
      <span style="display:flex;flex-direction:column;line-height:1.1;text-align:left"><span>${l}</span><span style="font-size:11px;font-weight:800;opacity:.85">Em breve</span></span></button>`;
  return `<section class="c-card" aria-label="Conta">${cHead('user','Conta','Neste aparelho')}
      <div class="c-cbody">
        <div class="c-row" style="padding:0 6px;animation-delay:.1s">
          <span style="position:relative;width:46px;height:46px;flex:none;border-radius:12px;border:2px solid #ffc94a;background:#33271d;overflow:hidden;box-sizing:border-box">
            ${typeof avatarTag==='function'?avatarTag(42,'position:absolute;left:0;top:0',S.hero==='kaia'?'Kaia':'Kael')   /* retrato da fase e do herói (js/avatar.js); sem ele, o de antes */
              :`<span class="kidle ${t?'t'+t:''}" role="img" aria-label="Kael" style="position:absolute;left:-20px;top:-8px;width:84px;height:84px;display:block"></span>`}</span>
          <span class="c-rl"><b style="overflow-wrap:anywhere">${esc2(S.name||'Kael')}${lv?' · Nv. '+n0(lv):''}</b><small>ID do jogador</small><span style="font-size:12px;font-weight:900;color:#8a7a66">em breve</span></span>
          <span class="c-dis" data-x="soon" style="flex:none;display:flex"><button class="c-sb" disabled aria-disabled="true" aria-label="Copiar o ID do jogador, em breve" style="flex:none;width:88px;height:44px;font-size:13px">${cI(C_IC.copy,16,'currentColor',2.4)}Copiar</button></span>
        </div>${cRealmRow()}
        ${cLinkOn()?`<div class="c-row" data-row="link" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px;animation-delay:.18s">
          <span style="font-size:13px;font-weight:900;color:#e8dccb;line-height:1.25">Vincular conta <span style="color:#c9b9a2;font-weight:700">· salva o progresso na nuvem</span></span>
          <div style="display:flex;gap:6px">${cLinkGoogle()}<span class="c-dis" data-x="soon" style="flex:1;min-width:0;display:flex">${link('Apple')}</span></div>
        </div>`:`<div class="c-row c-dis" data-row="link" data-x="soon" aria-disabled="true" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px;animation-delay:.18s">
          <span style="font-size:13px;font-weight:900;color:#e8dccb">Vincular conta <span style="color:#c9b9a2;font-weight:700">· salva o progresso na nuvem</span> ${C_SOON}</span>
          <div style="display:flex;gap:6px">${link('Google')}${link('Apple')}</div>
        </div>`}
        <div class="c-row" style="flex-direction:column;align-items:stretch;gap:8px;padding:8px;animation-delay:.24s">
          <span style="font-size:13px;font-weight:900;color:#e8dccb;line-height:1.25">Cópia de segurança <span style="color:#c9b9a2;font-weight:700">· guarde o progresso em um código e recupere aqui ou em outro aparelho</span></span>
          <div style="display:flex;gap:8px;padding-bottom:6px">
            <button class="c-gold lil" data-x="exp" style="flex:1;min-width:0;height:50px;border-radius:14px;font-size:18px;padding:0;display:flex;align-items:center;justify-content:center;gap:6px">${cI(C_IC.up,18,'#2a1403',2.6)}Exportar</button>
            <button class="c-dark lil" data-x="imp" style="flex:1;min-width:0;height:50px;border-radius:14px;font-size:18px;padding:0;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box">${cI(C_IC.down,18,'#ffc94a',2.6)}Importar</button></div>
        </div>
        <div class="c-row c-dis" data-x="soon" aria-disabled="true" style="flex-direction:column;align-items:stretch;gap:6px;padding:8px;animation-delay:.3s">
          <span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:900;color:#e8dccb">${cI(C_IC.globe,18,'#ffc94a',2.3)}Idioma ${C_SOON}</span>
          ${cSegOff('Idioma',['Português','English','Español'],44)}
        </div>
        <div class="c-row" style="animation-delay:.36s">${cI(C_IC.trash,24,'#ff9a8a',2.3)}
          <span class="c-rl"><b>Resetar progresso</b><small>Apaga tudo e começa do zero</small></span>
          <button class="c-warn" data-x="rst" style="width:92px;height:44px;flex:none;margin-right:4px;border-radius:12px;font-size:14px;font-weight:900;padding:0;box-sizing:border-box">Resetar</button></div>
        ${cDelOn()?`<button data-x="delacct" aria-label="Excluir conta: abre a tela de exclusão" style="align-self:center;min-height:44px;padding:0 16px;border:0;background:none;color:#c9b9a2;font-size:12.5px;font-weight:800;text-decoration:underline;text-underline-offset:3px">Excluir conta</button>`:''}
      </div></section>
    <section class="c-card" aria-label="Suporte" style="animation-delay:.1s">${cHead('help','Suporte','')}
      <div class="c-cbody">
        <div class="c-dis" data-x="soon" style="display:flex"><button class="c-nav" disabled aria-disabled="true" aria-label="Central de ajuda, em breve" style="animation-delay:.12s">${cI(C_IC.book,24,'#ffc94a',2.3)}
          <span class="c-rl"><b>Central de ajuda ${C_SOON}</b><small>Dúvidas comuns e falar com a equipe</small></span>
          ${cI('M9 6l6 6-6 6',18,'#c9b9a2',2.6)}</button></div>
        <div style="display:flex"><button class="c-nav" data-x="about" aria-label="Sobre: versão, Termos de Uso e Política de Privacidade" style="animation-delay:.18s">${cI(C_IC.shield,24,'#ffc94a',2.3)}
          <span class="c-rl"><b style="color:#f6ecdf">Sobre</b><small>Versão, Termos de Uso e Política de Privacidade</small></span>
          ${cI('M9 6l6 6-6 6',18,'#c9b9a2',2.6)}</button></div>
      </div></section>`;
}

/* ---------- janelas: exportar, importar, confirmar importação, resetar ---------- */
function cDialog(){
  const d=XC.dlg; if(!d) return '';
  const box=(label,inner)=>`<button class="c-veil" data-x="dlgx" aria-label="Fechar" style="position:absolute;inset:0;z-index:39;border:0;padding:0;background:rgba(0,0,0,.7)"></button>
    <div class="c-pop" role="dialog" aria-modal="true" aria-label="${esc2(label)}" style="position:absolute;left:0;right:0;top:0;bottom:0;margin:auto;height:max-content;max-height:calc(100% - 16px);width:calc(100% - 40px);max-width:360px;z-index:40;border-radius:22px;padding:4px;background:linear-gradient(160deg,#9a8a74,#3a3028 30%,#7a6852 55%,#2a2018);box-sizing:border-box;display:flex;flex-direction:column">
      <div style="flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;border-radius:18px;background:#1d1611;padding:14px;display:flex;flex-direction:column;gap:10px">${inner}</div></div>`;
  const ttl=(k,col,t)=>`<div style="display:flex;align-items:center;gap:10px">${cI(C_IC[k],30,col,2.3)}<h3 class="lil" style="margin:0;flex:1;font-weight:400;font-size:22px;color:${col};line-height:1.1">${esc2(t)}</h3></div>`;
  const txt=t=>`<span style="font-size:13px;font-weight:800;color:#c9b9a2;line-height:1.3">${t}</span>`;
  const btnNo=(x,t)=>`<button class="c-dark" data-x="${x}" style="flex:1;height:52px;border-radius:14px;font-size:15px;font-weight:900;padding:0;box-sizing:border-box">${t}</button>`;
  if(d==='exp') return box('Exportar progresso',`${ttl('shield','#ffc94a','Exportar progresso')}
      ${txt('Este código guarda todo o seu progresso. Copie e guarde em um lugar seguro. Quem tiver o código consegue carregar o seu progresso.')}
      <textarea id="c_code" class="c-field" readonly spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Código do progresso">${esc2(XC.code)}</textarea>
      <div style="display:flex;gap:8px;padding-bottom:6px">${btnNo('dlgx','Fechar')}
        <button class="c-gold lil" data-x="copy" id="c_copyb" style="flex:1.3;height:52px;border-radius:14px;font-size:20px;padding:0">${XC.copied?'Copiado':'Copiar'}</button></div>`);
  if(d==='imp') return box('Importar progresso',`${ttl('down','#ffc94a','Importar progresso')}
      ${txt('Cole aqui o código exportado. Antes de trocar o progresso, o jogo confere o código e pede a sua confirmação.')}
      <textarea id="c_imp" class="c-field ${XC.err?'err':''}" spellcheck="false" autocomplete="off" autocapitalize="off" autocorrect="off" placeholder="${C_PRE}..." aria-label="Código para importar">${esc2(XC.imp)}</textarea>
      <span id="c_err" role="alert" style="min-height:16px;font-size:12.5px;font-weight:900;color:#ff9a8a;line-height:1.25">${esc2(XC.err)}</span>
      <div style="display:flex;gap:8px;padding-bottom:6px">${btnNo('dlgx','Cancelar')}
        <button class="c-gold lil" data-x="impgo" style="flex:1.3;height:52px;border-radius:14px;font-size:20px;padding:0">Conferir</button></div>`);
  if(d==='impok'){ const o=XC.src||{}, lv=cLv(o);
    return box('Substituir o progresso',`${ttl('warn','#ff9a8a','Substituir o progresso?')}
      ${txt('O progresso atual deste aparelho será <b style="color:#ffb3a8">substituído</b> pelo progresso do código. Não dá para desfazer.')}
      <div style="display:flex;flex-direction:column;gap:4px;padding:8px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">
        <span style="font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:.5px">PROGRESSO DO CÓDIGO</span>
        <span style="font-size:15px;font-weight:900;overflow-wrap:anywhere">${esc2(typeof o.name==='string'&&o.name?o.name:'Kael')}${lv?' · Nv. '+n0(lv):''}</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:14px;font-weight:900">${COIN_I(18)}${kf(o.gold||0)}<span style="width:8px"></span>${GEM_I(18)}${n0(o.gems||0)}</span></div>
      <div style="display:flex;gap:8px;padding-bottom:6px">${btnNo('impno','Cancelar')}
        <button class="c-red lil" data-x="impyes" style="flex:1.3;height:52px;border-radius:14px;font-size:19px;padding:0">Substituir</button></div>`); }
  if(d==='about'){ const lk=(u,t)=>`<a href="${esc2(u)}" target="_blank" rel="noopener" style="min-height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#16110d;color:#ffe07a;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 12px;box-sizing:border-box;text-decoration:none"><span>${t}</span>${cI('M9 6l6 6-6 6',18,'#c9b9a2',2.6)}</a>`;
    return box('Sobre',`${ttl('shield','#ffc94a','Sobre')}
      <div style="display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">
        <span class="lil" style="font-size:20px;color:#ffe07a;overflow-wrap:anywhere">${esc2(cName())}</span>
        <span style="font-size:13px;font-weight:900;color:#c9b9a2">Versão ${esc2(cVer())}</span></div>
      ${txt('Ao jogar você aceita os Termos de Uso e a Política de Privacidade.')}
      ${lk(C_LEGAL.terms,'Termos de Uso')}${lk(C_LEGAL.privacy,'Política de Privacidade')}
      ${txt('Os documentos abrem no navegador e precisam de internet.')}
      <div style="display:flex;gap:8px;padding-bottom:6px">${btnNo('dlgx','Fechar')}</div>`); }
  if(d==='rst') return box('Resetar progresso',`${ttl('trash','#ff9a8a','Resetar progresso?')}
      ${txt('Isso apaga <b style="color:#ffb3a8">TODO</b> o seu progresso, itens, skins e moedas. Não dá para desfazer.')}
      <div style="display:flex;gap:8px;padding-bottom:6px">${btnNo('dlgx','Cancelar')}
        <button class="c-red lil" data-x="rstyes" style="flex:1.3;height:52px;border-radius:14px;font-size:19px;padding:0">Apagar tudo</button></div>`);
  return '';
}

function scrCfg(){
  const d=xDims(440);                                   /* o miolo rola: a tela vale de ~500 a ~800 px de altura sem encolher além da largura */
  const old=document.getElementById('c_scroll'); let top=0; if(old&&XC.keep){ top=+old.scrollTop||0; }
  if(XC.page!==0&&XC.page!==1&&XC.page!==2) XC.page=0;
  const tabs=[['Som · Jogo',C_IC.som,C_IC.jogo],['Tela · Avisos',C_IC.gfx,C_IC.bell],['Conta · Ajuda',C_IC.user,C_IC.help]].map((t,i)=>{ const on=XC.page===i;
    return `<button role="tab" aria-selected="${on?'true':'false'}" data-x="tab" data-i="${i}" class="c-tab ${on?'sel':''}" style="animation-delay:${(0.15+i*0.07).toFixed(2)}s">
      <span class="c-ti">${cI(t[1],20,'currentColor',2.2)}${cI(t[2],20,'currentColor',2.2,'','animation-delay:.3s')}</span>${t[0]}</button>`; }).join('');
  V.innerHTML=xWrap(d,XC.anim?'c-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden">
    <div class="c-bg" aria-hidden="true">
      <div class="x-ly x-sky" style="top:0;height:62%;background-size:auto 100%"></div><div class="x-ly x-cld" style="top:5%;height:26%;background-size:auto 100%"></div>
      <div class="x-ly x-far" style="top:22%;height:44%;background-size:auto 100%"></div><div class="x-ly x-gnd" style="top:64%;height:38%;background-size:auto 100%"></div></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(10,7,5,.35),rgba(10,7,5,.8));pointer-events:none"></div>
    <div class="c-frame" role="region" aria-label="Configurações">
      <span class="c-rivet" style="left:10px;top:10px"></span><span class="c-rivet" style="right:10px;top:10px"></span>
      <span class="c-rivet" style="left:10px;bottom:10px"></span><span class="c-rivet" style="right:10px;bottom:10px"></span>
      <div class="c-inner">
        <div role="tablist" aria-label="Grupos de opções" style="flex:none;display:flex;gap:6px;padding:8px 10px 4px">${tabs}</div>
        <div class="c-scroll x-scroll ${XC.cards?'c-cards':''}" id="c_scroll">${XC.page===0?cPageSound():XC.page===1?cPageScreen():cPageAccount()}</div>
        <div style="min-height:40px;flex:none;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0 10px;padding:3px 18px;border-top:1px solid #4a3a2b;background:rgba(14,10,7,.85);font-size:11.5px;font-weight:800;color:#c9b9a2;box-sizing:border-box">
          <span class="c-saved" style="display:flex;align-items:center;gap:6px;color:#9be89f;white-space:nowrap">${cI(C_IC.chk,14,'currentColor',3)}Salvo automaticamente</span>
          <span data-x="ver" style="min-width:0;line-height:1.3;overflow-wrap:anywhere">${esc2(cName())} · ${esc2(cVer())}</span></div>
      </div>
    </div>
    ${cDialog()}
    <div id="c_toast">${XC.toast&&Date.now()-XC.toastT<1800?cToastHtml(XC.toast):''}</div></div>`);
  if(top){ const nw=document.getElementById('c_scroll'); if(nw) nw.scrollTop=top; }
  XC.anim=false; XC.cards=false; XC.keep=true; XC.flip=''; XC.selp=0; XC.shk=0; XC.sig=cSig();
}
/* o que muda por fora (velocidade liberada ao subir de nível, botão de música da batalha): o tick redesenha só quando isto muda */
function cSig(){ try{ return [S.set.sound?1:0,S.set.vib?1:0,S.set.autoBoss?1:0,cSpdNow(),cSpeeds().map(o=>o.ok?1:0).join(''),cHasVol()?1:0,cName()].join('|'); }catch(e){ return ''; } }

/* guarda o que o jogador digitou/colou ANTES de qualquer redesenho */
function cKeepField(){ const el=document.getElementById('c_imp'); if(el&&XC.dlg==='imp'&&typeof el.value==='string') XC.imp=el.value; }
function cCloseDlg(){ cKeepField(); XC.dlg=null; XC.code=''; XC.copied=false; XC.src=null; XC.err=''; }

/* controle de volume: ajusta ao arrastar SEM redesenhar (o redesenho soltaria o dedo); grava ao soltar */
function cVolInput(t,done){ const k=t.dataset.k==='sfx'?'sfx':'mus', n=Math.max(0,Math.min(100,parseInt(t.value,10)||0));
  S.set[k==='mus'?'volMus':'volSfx']=n; S.set[k==='mus'?'musOff':'sfxOff']=false; cVolApply();
  try{ t.style.setProperty('--p',n+'%'); t.classList.remove('muted'); }catch(e){}
  const v=document.getElementById('c_v'+k); if(v) v.textContent=n+'%';
  const q=document.getElementById('c_eq'+k); if(q&&q.style){ q.style.transform='scaleY('+Math.max(.25,n/100).toFixed(2)+')'; q.style.display=S.set.sound&&n>0?'':'none'; }
  XC.drag=!done; clearTimeout(XC.dragT);
  if(done){ save(); if(k==='sfx') snd('ui_tap'); if(cOn()) render(); }
  else XC.dragT=setTimeout(()=>{ XC.drag=false; save(); },1500); }
(function(){ try{ if(typeof V==='undefined'||!V||!V.addEventListener) return;
    V.addEventListener('input',ev=>{ const t=ev.target; if(cOn()&&t&&t.dataset&&t.dataset.c==='vol') cVolInput(t,false); });
    V.addEventListener('change',ev=>{ const t=ev.target; if(cOn()&&t&&t.dataset&&t.dataset.c==='vol') cVolInput(t,true); }); }catch(e){} })();

/* copiar o código: área de transferência; se não der, seleção + execCommand; se ainda não der, deixa selecionado para o jogador copiar */
function cCopy(){ const txt=XC.code, ta=document.getElementById('c_code');
  const done=()=>{ XC.copied=true; const b=document.getElementById('c_copyb'); if(b) b.textContent='Copiado'; cSay('Código copiado'); try{ vib(20); }catch(e){} };
  const pick=()=>{ try{ ta.focus(); ta.select(); if(ta.setSelectionRange) ta.setSelectionRange(0,txt.length); return true; }catch(e){ return false; } };
  const legacy=()=>{ let ok=false; if(ta&&pick()){ try{ ok=document.execCommand('copy')===true; }catch(e){ ok=false; } } if(ok) done(); else { if(ta) pick(); cSay('Selecione e copie o código'); } };
  try{ if(navigator.clipboard&&typeof navigator.clipboard.writeText==='function'){ navigator.clipboard.writeText(txt).then(done,legacy); return; } }catch(e){}
  legacy(); }

function cClick(b,ev){
  const a=b.dataset.x;
  if(XC.dlg){                                           /* com janela aberta, só valem os botões dela */
    if(a==='dlgx'){ snd('ui_tap'); cCloseDlg(); render(); }
    else if(a==='copy'&&XC.dlg==='exp'){ snd('ui_tap'); cCopy(); }
    else if(a==='impgo'&&XC.dlg==='imp'){ cKeepField(); const r=cParse(XC.imp); snd('ui_tap');
      if(!r.ok){ XC.err=r.msg; XC.src=null; try{ vib(40); }catch(e){}       /* inválido: aviso claro, nada muda; sem redesenho (o campo fica como está) */
        const e=document.getElementById('c_err'), f=document.getElementById('c_imp'); if(e) e.textContent=r.msg;
        if(f&&f.classList){ f.classList.add('err'); f.classList.remove('c-shk'); void f.offsetWidth; f.classList.add('c-shk'); } return; }
      XC.err=''; XC.src=r.save; XC.dlg='impok'; render(); }
    else if(a==='impno'&&XC.dlg==='impok'){ snd('ui_tap'); XC.src=null; XC.dlg='imp'; render(); }
    else if(a==='impyes'&&XC.dlg==='impok'){ snd('ui_tap'); cImportDo(); }
    else if(a==='rstyes'&&XC.dlg==='rst'){ cResetDo(); }
    return; }
  if(a==='ver'){ try{ if(window.DevMenu&&typeof window.DevMenu.tap==='function') window.DevMenu.tap(); }catch(e){} return; }   /* número da versão: 5 toques abrem o menu de depuração, que só existe no build DEV (js/devmenu.js); fora dele não faz nada */
  if(a==='about'){ snd('ui_tap'); XC.dlg='about'; render(); return; }
  if(a==='soon'){ snd('ui_tap'); cSay('Em breve'); }                 /* linha desabilitada: só o aviso; nada muda, nada é gravado */
  else if(a==='tab'){ const i=Math.max(0,Math.min(2,+b.dataset.i|0)); if(i===XC.page) return; snd('ui_tap'); vib(12); XC.page=i; XC.cards=true; XC.keep=false; render(); }
  else if(a==='snd'){ S.set.sound=!S.set.sound; if(window.GameAudio&&GameAudio.setEnabled){ try{ GameAudio.setEnabled(S.set.sound); }catch(e){} }
    save(); try{ if(typeof syncMus==='function') syncMus(); }catch(e){} snd('ui_tap'); XC.flip='snd'; render(); }
  else if(a==='vib'){ S.set.vib=!S.set.vib; save(); snd('ui_tap'); vib(30); XC.flip='vib'; render(); }
  else if(a==='boss'){ S.set.autoBoss=!S.set.autoBoss; save(); snd('ui_tap'); vib(12); XC.flip='boss'; render(); }
  else if(a==='mute'){ const k=b.dataset.k==='sfx'?'sfx':'mus', f=k==='mus'?'musOff':'sfxOff'; S.set[f]=!S.set[f];
    if(S.set[k==='mus'?'volMus':'volSfx']===undefined) S.set[k==='mus'?'volMus':'volSfx']=C_VOL0[k];
    cVolApply(); save(); snd('ui_tap'); vib(12); render(); }
  else if(a==='spd'){ const n=+b.dataset.n||1, o=cSpeeds().find(x=>x.speed===n);
    if(!o||!o.ok){ snd('ui_tap'); vib(40); XC.shk=n; render(); cSay(o&&o.text?o.text:'Velocidade x'+n+' bloqueada'); return; }
    snd('ui_tap'); vib(12); if(n===cSpdNow()) return; cSetSpeed(n); XC.selp=n; render(); }
  else if(a==='exp'){ snd('ui_tap'); const c=cExport(); if(!c){ cSay('Não deu para gerar o código agora'); return; } XC.code=c; XC.copied=false; XC.dlg='exp'; render(); }
  else if(a==='imp'){ snd('ui_tap'); XC.err=''; XC.src=null; XC.dlg='imp'; render(); }
  else if(a==='rst'){ snd('ui_tap'); XC.dlg='rst'; render(); }
  else if(a==='glink'){ snd('ui_tap'); if(!cLinkOn()){ cSay('Em breve'); return; } cLinkGo(); }
  else if(a==='delacct'){ snd('ui_tap'); let ok=false; try{ ok=cDelOn()&&window.DeleteAccount.open()!==false; }catch(e){ ok=false; } if(!ok) cSay('Não deu para abrir a exclusão de conta agora'); }
  else if(a==='realm'){ snd('ui_tap'); let ok=false; try{ ok=!!(window.Panels&&Panels.open('realm',{from:'cfg'})); }catch(e){ ok=false; } if(!ok) cSay('Troca de servidor indisponível agora'); }
}

Panels.add('cfg',{title:'Configurações',render:scrCfg,click:cClick,
  tick(){ if(XC.dlg||XC.drag) return; if(XC.sig&&cSig()!==XC.sig&&cOn()) render(); },
  /* janela aberta (campo de texto em uso) ou dedo no controle de volume: ninguém redesenha por fora */
  busy(){ return !!XC.dlg||XC.drag; },
  onOpen(o){ clearTimeout(XC.dragT); XC.drag=false; XC.anim=true; XC.cards=true; XC.keep=false; XC.dlg=null; XC.code=''; XC.copied=false; XC.src=null; XC.err=''; XC.toast='';
    XC.page=o&&(o.page===2||o.tab==='save'||o.tab==='conta')?2:o&&(o.page===1||o.tab==='tela')?1:0; if(cVolSaved()) cVolApply(); },
  onClose(){ clearTimeout(XC.dragT); if(XC.drag){ XC.drag=false; try{ save(); }catch(e){} } XC.dlg=null; XC.code=''; XC.copied=false; XC.src=null; XC.err=''; XC.imp=''; XC.toast=''; } });
