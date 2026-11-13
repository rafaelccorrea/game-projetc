'use strict';
/* ================= ÁUDIO OPCIONAL · TUTORIAL · BOAS-VINDAS · GANHOS OFFLINE · PWA ================= */

/* ---------- js/audio.js (opcional; dono: agente de áudio) ---------- */
/* TABELA DE SUBSTITUIÇÃO DE SONS: nome -> arquivo (relativo a assets/audio/), sem editar manifest.json nem js/audio.js.
   Em 2026-11-12 (10:10) a sessão de áudio promoveu os 13 sons refeitos e aprovados para assets/audio/sfx/ (os antigos foram
   para assets/audio/_rejeitados/ e a pasta _new/ deixou de existir), então hoje o manifest já aponta para os aprovados e a
   tabela fica VAZIA. Para trocar um som por um candidato sem mexer no manifest, acrescente uma linha, por exemplo:
     hit:'_new/hit.mp3',
   e para desfazer, apague a linha. Se o arquivo indicado não existir, vale o do manifest (reserva).
   A troca é feita na resposta do manifest, só durante o GameAudio.init(). */
const SFX_SWAP={
};
/* Sons que NÃO devem tocar o arquivo (nem o sintetizado): acrescente o nome aqui se o dono reprovar algum. */
const SFX_MUTE={};
const AUDIO_BASE='assets/audio/';
window.__sfxSwap={};   // diagnóstico: nome -> arquivo efetivamente usado
function patchAudioManifest(m,rawFetch){
  m=m||{}; m.sfx=m.sfx||{};
  return Promise.all(Object.keys(SFX_SWAP).map(name=>rawFetch(AUDIO_BASE+SFX_SWAP[name],{method:'HEAD'}).then(r=>{
    if(!r.ok) return; const old=m.sfx[name], vol=old&&typeof old==='object'&&typeof old.volume==='number'?old.volume:0.7;
    m.sfx[name]={file:SFX_SWAP[name],volume:vol}; window.__sfxSwap[name]=SFX_SWAP[name]; }).catch(()=>{}))).then(()=>m);
}
function audioInit(g){
  if(!Object.keys(SFX_SWAP).length){ try{ g.init(); }catch(e){} return; }
  const raw=window.fetch, re=/assets\/audio\/manifest\.json(\?|$)/;
  const restore=()=>{ if(window.fetch===hook) window.fetch=raw; };
  function hook(u,o){ const url=typeof u==='string'?u:(u&&u.url)||'';
    if(!re.test(url)) return raw.apply(window,arguments);
    return raw.apply(window,arguments).then(r=>!r.ok?r:r.clone().json().then(m=>patchAudioManifest(m,raw.bind(window)))
      .then(m=>new Response(JSON.stringify(m),{status:200,headers:{'Content-Type':'application/json'}})).catch(()=>r)); }
  window.fetch=hook;
  let p=null; try{ p=g.init(); }catch(e){}
  if(p&&p.then) p.then(restore,restore); else restore();
}
(function(){
  const s=document.createElement('script'); s.src='js/audio.js?v='+(DEBUG?Date.now():VERSION); s.async=true;
  s.onload=()=>{ const g=window.GameAudio; if(!g) return; try{ if(g.init) audioInit(g); if(g.setEnabled) g.setEnabled(!!S.set.sound); }catch(e){} };
  s.onerror=()=>{};
  document.head.appendChild(s);
})();
let audioUnlocked=false;
function unlockAudio(){
  if(audioUnlocked) return; audioUnlocked=true;
  const g=window.GameAudio; if(g&&g.unlock){ try{ g.unlock(); }catch(e){} }
  const t=document.getElementById('title'); if(t&&t.style.display!=='none'&&!t.classList.contains('out')) music('title');
}
addEventListener('pointerdown',unlockAudio,{once:true,capture:true});
// sem zoom / arrasto acidental
addEventListener('gesturestart',e=>e.preventDefault());
addEventListener('dblclick',e=>e.preventDefault());
addEventListener('contextmenu',e=>{ if(!DEBUG) e.preventDefault(); });
addEventListener('dragstart',e=>e.preventDefault());

/* ---------- ao tocar em JOGAR ---------- */
function onPlay(){
  unlockAudio(); snd('ui_tap'); music('era'+eraOf(S.stage));
  if(!DEBUG){ const el=document.documentElement, fs=el.requestFullscreen||el.webkitRequestFullscreen; if(fs){ try{ const p=fs.call(el,{navigationUI:'hide'}); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
    if(screen.orientation&&screen.orientation.lock){ try{ const p=screen.orientation.lock('portrait'); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } }
  /* JOGADOR NOVO (sem nome no save): tela 03 INTRO (3 cartões, escolha do herói, nome) antes das boas-vindas e do tutorial */
  if(typeof introNeeded==='function'&&introNeeded()){ B.paused=true; showIntro(()=>{ B.paused=false; afterIntro(); }); return; }
  afterIntro();
}
function afterIntro(){
  if(!S.welcome) showWelcome();
  else if(!showOffline()&&S.tut<99) startTut();
  if(typeof vaCollectSoon==='function') vaCollectSoon(2500);   // VIP 1: coleta automática ao abrir o jogo (js/vipauto.js; um aviso só)
}
function showWelcome(){
  if(S.welcome) return;   /* o presente entra UMA vez (recarregar não dá de novo: S.welcome vai no save) */
  S.welcome=true; S.gold+=200; S.gems+=50; save(); hud();
  /* Engenheiro 2 (decisão do coordenador): quem passou pela ENTRADA NOVA (js/p_intro.js ligada) não vê o modal antigo: o presente entra do mesmo jeito,
     aparece num aviso curto com os ícones do jogo e o tutorial começa em seguida. Com a entrada nova desligada vale o modal de sempre (sem emoji). */
  if(typeof Panels!=='undefined'&&typeof Panels.on==='function'&&Panels.on('intro')){ toastHtml(`Presente de boas-vindas: +200 ${COIN()} +50 ${GEM()}`,3200); snd('claim'); if(S.tut<99) startTut(); return; }
  mbox.innerHTML=`<h3><img src="assets/ui/chest.png" alt="" style="width:24px;height:24px;object-fit:contain;vertical-align:-5px;margin-right:6px">Bem-vindo a ${GAME_NAME}!</h3>
    <div>Você começa na <b>Pré-História</b> com um graveto e muita coragem. Atravesse as eras!</div>
    <div class="card" style="margin-top:10px;text-align:center"><b>Presente de boas-vindas</b><div style="font-size:18px;margin-top:4px">+200 ${COIN()} &nbsp; +50 ${GEM()}</div><div class="sm">e 1 invocação grátis por dia</div></div>
    <div class="row"><button class="btn grow" id="m_go">Começar</button></div>`;
  modal.style.display='flex'; B.paused=true;
  document.getElementById('m_go').onclick=()=>{ closeModal(); B.paused=false; snd('claim'); if(S.tut<99) startTut(); };
}
/* aviso curto com ícones (o toast comum só aceita texto) */
function toastHtml(html,ms){ const t=document.getElementById('toast'); if(!t) return; t.innerHTML=html; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),ms||2200); }
/* ---------- ganhos offline: moedas por tempo fora, com teto ---------- */
function showOffline(){
  if(window.__noSave||S.tut<99||AWAY<120||window.__offDone) return false; window.__offDone=true;
  const capH=typeof offlineCapH==='function'?offlineCapH():BAL.offlineCapHours, cap=capH*3600, t=Math.min(AWAY,cap);   // teto com o VIP (8 h; 10/12/14 h: js/vipauto.js)
  if(typeof vaOfflineSync==='function') vaOfflineSync();
  const perKill=Math.ceil(BAL.goldBase*Math.pow(BAL.goldGrowth,S.stage-1));
  let om=1; try{ om=Math.max(1,Sys.vip.perks(S).offlineMult||1); }catch(e){}   // VIP: ouro offline em dobro (número do Sys.vip)
  const gold=Math.floor(t/60*BAL.offlineKillsPerMin*perKill*BAL.offlineRate*om); if(gold<=0) return false;
  const hh=Math.floor(t/3600), mm=Math.floor(t%3600/60);
  mbox.innerHTML=`<h3>Enquanto você esteve fora</h3>
    <div>Seu guerreiro continuou lutando por <b>${hh?hh+'h ':''}${mm}min</b>${AWAY>cap?` (teto de ${capH}h)`:''}.</div>
    <div class="card" style="margin-top:10px;text-align:center;font-size:20px"><b>+${fmt(gold)}</b> ${COIN()}</div>
    <div class="row"><button class="btn grow" id="m_go">Resgatar</button></div>`;
  modal.style.display='flex';
  document.getElementById('m_go').onclick=()=>{ S.gold+=gold;
    if(SYS_ON){ try{ const o=Sys.loot.offline(S,Sys.host,t); Sys.loot.grant(S,Sys.host,o); Sys.chest.onKills(S,o.kills,Sys.host); const lr=Sys.level.onOffline(S,Sys.host,t); if(lr&&lr.levels>0) onLevelUp(lr); if(Sys.practice&&Sys.practice.onOffline) Sys.practice.onOffline(S,Sys.host,t);   /* pedras de prática do tempo fora */ }catch(e){ console.error('offline',e); } }   // itens, carga do baú e XP do tempo fora
    save(); hud(); closeModal(); snd('coin'); snd('claim'); if(view!=='battle') render(); };
  return true;
}

/* ---------- tutorial guiado ---------- */
const TUT=[
  {txt:'A batalha é <b>automática</b>: seu herói ataca sozinho. Derrote 4 inimigos e o chefe para avançar de fase.', sel:()=>'#cv', ok:true},
  {txt:'O <b>Especial</b> dispara sozinho quando recarrega: um golpe 3x mais forte!', sel:()=>'#fb_s2b', ok:true},
  {txt:()=>view!=='gear'?'Agora abra <b>Equip.</b> para melhorar sua arma.':!document.getElementById('g_upgold')?'Toque na sua <b>arma</b> na mochila.':tutCapped()?'O item sobe até o <b>seu nível</b>. Lute para subir de nível e volte aqui para <b>Upar</b>.':'Toque em <b>Upar</b> para deixar sua arma mais forte.',
   sel:()=>view!=='gear'?'#fbm_gear':document.getElementById('g_upgold')?'#g_upgold':'.x-cell.eqw', ev:'up', views:['gear'], okIf:()=>view==='gear'&&!!document.getElementById('g_upgold')&&tutCapped()},
  {txt:'A <b>Ultimate</b> carrega quando você bate e apanha e dispara sozinha quando a energia enche.', sel:()=>'#fb_s3b', ok:true, pre:()=>{ if(view!=='battle') setView('battle'); }},
  /* v0.12.3 (liberação por nível): Invocar só existe a partir do nível 3. O passo fica por último e ESPERA o nível (when); até lá o tutorial some da tela */
  {txt:()=>view==='summon'?'Você tem 1 invocação <b>grátis</b> por dia. Toque nela!':'Abra <b>Invocar</b>: há 1 invocação grátis por dia.', sel:()=>view==='summon'?'[data-a=pull][data-k=item][data-n="1"]':'#fbm_summon', ev:'pull', views:['summon'],
   when:()=>typeof fbUnl!=='function'||fbUnl('summon'), pre:()=>{ if(!S.unl||typeof S.unl!=='object') S.unl={}; S.unl.summon=1; }},
];
let tutWait=false;   // true = o passo atual espera uma condição (when); o balão e o anel ficam escondidos
let tutT=null;
const tutOn = () => S.tut<99 && tutT!==null;
/* a arma equipada já está no teto (nível do jogador)? Então o passo "Upar" vira aviso com "Entendi" (o jogador novo começa no nível 1) */
function tutCapped(){ try{ const it=itemOf(S.eq.weapon); return !it||!Sys.stats.canUpgrade(S,Sys.host,it,'gold').ok; }catch(e){ return true; } }
function tutHold(){ return false; }   // só automático: o tutorial não segura mais as habilidades
function startTut(){
  if(S.tut>=99||tutT!==null) return;
  document.getElementById('tut').style.display='block';
  tutT=setInterval(tutLayout,250); tutShow();
}
function endTut(skip){
  S.tut=99; clearInterval(tutT); tutT=null; document.getElementById('tut').style.display='none';
  if(!skip){ S.gems+=20; toast('Tutorial concluído! +20 gemas'); snd('claim'); }
  save(); hud();
}
function tutShow(){
  const st=TUT[S.tut]; if(!st){ endTut(false); return; }
  if(st.when&&!st.when()){ tutWait=true; document.getElementById('tut').style.display='none'; return; }
  if(tutWait){ tutWait=false; document.getElementById('tut').style.display='block'; if(typeof fbLayout==='function') fbLayout(); }
  if(st.pre) st.pre();
  if(S.tut===1) B.cd2=0;
  const b=document.querySelector('#tut .tbub');
  b.innerHTML=`<small>Passo ${S.tut+1} de ${TUT.length}</small><div>${typeof st.txt==='function'?st.txt():st.txt}</div>
    <div class="row"><button class="btn dim" id="t_skip" style="min-height:40px;font-size:13px">Pular</button>${(st.ok||(st.okIf&&st.okIf()))?'<button class="btn" id="t_ok" style="min-height:40px">Entendi</button>':''}</div>`;
  b.dataset.k=S.tut+'|'+st.sel()+'|'+(st.okIf?st.okIf():'');
  document.getElementById('t_skip').onclick=()=>endTut(true);
  const ok=document.getElementById('t_ok'); if(ok) ok.onclick=()=>{ snd('ui_tap'); S.tut++; save(); tutShow(); };
  tutLayout();
}
function tutLayout(){
  if(!tutOn()) return; const st=TUT[S.tut]; if(!st) return;
  if(tutWait){ if(!st.when||st.when()){ if(view==='battle'&&!B.paused) tutShow(); } return; }
  const b=document.querySelector('#tut .tbub'), r=document.querySelector('#tut .tring');
  if(b.dataset.k!==S.tut+'|'+st.sel()+'|'+(st.okIf?st.okIf():'')){ tutShow(); return; }
  if(S.tut===1&&B.cd2>0&&!(B.act&&B.act.type==='s2')) B.cd2=0;
  /* Engenheiro 2 (QA): com uma TELA CHEIA aberta que não é a do passo (Pets, Arena, Torneio...), o holofote e o balão somem e voltam ao fechar */
  const other=(view!=='battle'&&!(st.views&&st.views.indexOf(view)>=0))||!!(typeof B!=='undefined'&&B.res);   /* B.res = Vitória/Derrota do chefe ou Troca de era por cima da batalha */
  const el=document.querySelector(st.sel()), hide=other||(modal.style.display==='flex'&&!(el&&modal.contains(el)));
  document.getElementById('tut').style.visibility=hide?'hidden':'visible';
  if(!el){ r.style.display='none'; b.style.top='40%'; b.style.bottom='auto'; return; }
  const q0=el.getBoundingClientRect(), ar=document.getElementById('app').getBoundingClientRect(), cvS=st.sel()==='#cv', pad=6;
  const q=cvS?{left:20,top:cv.parentNode.offsetTop+(GY-HS-30)*ar.width/LW,width:ar.width-40,height:(HS+50)*ar.width/LW}:{left:q0.left-ar.left,top:q0.top-ar.top,width:q0.width,height:q0.height}; q.bottom=q.top+q.height;
  r.style.display='block'; r.style.left=(q.left-pad)+'px'; r.style.top=(q.top-pad)+'px'; r.style.width=(q.width+pad*2)+'px'; r.style.height=(q.height+pad*2)+'px';
  r.style.borderRadius=(el.classList.contains('skb')?'50%':'14px');
  const vh=ar.height, below=q.bottom+14, bh=b.offsetHeight||120;
  if(below+bh<vh-8){ b.style.top=below+'px'; b.style.bottom='auto'; }
  else { b.style.top=Math.max(8,q.top-bh-14)+'px'; b.style.bottom='auto'; }
}
function tutEvent(ev){
  if(!tutOn()) return; const st=TUT[S.tut]; if(!st) return;
  if(st.ev===ev){ 
    S.tut++; save(); setTimeout(tutShow,ev==='s2'?900:350); }
  else if(ev==='view') setTimeout(tutLayout,30);
}

/* ---------- PWA (manifest/sw são do agente de UX; só liga se existirem) ---------- */
(function(){
  const head=(tag,attrs)=>{ const el=document.createElement(tag); for(const k in attrs) el.setAttribute(k,attrs[k]); document.head.appendChild(el); };
  fetch('manifest.webmanifest',{method:'HEAD'}).then(r=>{ if(!r.ok) return; head('link',{rel:'manifest',href:'manifest.webmanifest'});
    return fetch('manifest.webmanifest').then(x=>x.json()).then(m=>{ const ic=(m.icons||[]).filter(i=>/png/.test(i.type||i.src)).sort((a,b)=>parseInt(b.sizes)-parseInt(a.sizes)).find(i=>parseInt(i.sizes)<=192)||(m.icons||[])[0];
      if(ic) head('link',{rel:'apple-touch-icon',href:ic.src}); }); }).catch(()=>{});
  if('serviceWorker' in navigator && !window.Capacitor && !DEBUG && !window.__noSave && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname))   // nunca em localhost: os assets ainda mudam
    fetch('sw.js',{method:'HEAD'}).then(r=>{ if(r.ok) navigator.serviceWorker.register('sw.js').catch(()=>{}); }).catch(()=>{});
})();
