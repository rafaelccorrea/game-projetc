'use strict';
/* ================= TELA INICIAL V3 (voto do dono: mock A, "com o DRAGÃO da B") — nasce DESLIGADA (window.TITLE3_ON = false) =================
   Mocks: docs/proto/v2/a/mocks/ti_a.jpg (a escolhida) e ti_b.jpg (o dragão). Regras e estados: docs/proto/v2/TelaInicial.html.
   O QUE É: uma camada que entra NO LUGAR do Título de hoje (tela "TituloV2B" do js/p_intro.js), dentro da mesma sobreposição #pin.
   Nada de conta, save ou servidor é feito aqui: cada toque chama a função de hoje do PIntro (js/p_intro.js) / OnlineBoot (js/onlineboot.js):
     JOGAR (quem volta)        -> PIntro.nav()  (a mesma do JOGAR de hoje: Bem-vindo de volta com o Coletar, ou direto para o jogo)
     JOGAR (jogador novo)      -> PIntro.guest() (é AQUI que o convidado nasce: OnlineBoot.play) + PIntro.realmStep (1ª vez) + PIntro.show('Prologo')
     cartão do servidor        -> PIntro.realmStep(false)  (o painel de reinos de hoje, js/p_realm.js)
     conta: Google             -> PIntro.google()  (entra ou vincula; aviso do app DEV; conta Google que já tem outro personagem)
   COMO SE ENCAIXA: sem gancho no index.html nem no js/p_intro.js. Com a chave LIGADA este arquivo embrulha PIntro.show / PIntro.finish /
   PIntro.toast; quando o PIntro pede a tela "TituloV2B", a camada nova é montada e a antiga não é desenhada. Qualquer erro ao montar = a tela
   antiga aparece como sempre. Com a chave DESLIGADA nada é embrulhado, nenhum listener, nenhum estilo, nenhum temporizador.
   LIGAR: window.TITLE3_ON = true ANTES deste arquivo (ou trocar o false abaixo). Só para conferir: ?debug=1&titulo=3 (sem o debug=1 o parâmetro não vale).
   No app (sem barra de endereço), pelo console do chrome://inspect, com o Título de hoje na tela: TITLE3_ON=true; PTitle3.install()  (troca na hora; vale até recarregar).
   Roteiro do QA: docs/TELA_INICIAL_V2_QA.md.
   SAVE: quem JÁ TEM JOGO neste celular e toca em "Vincular com Google" vê antes um aviso com Continuar / Cancelar (a conta Google pode já ter um jogo salvo, e o
   caminho de hoje, PIntro.google, carrega o jogo da nuvem sem perguntar). Jogador novo (sem jogo no celular) entra direto, como na tela de Login de hoje.
   O ?skip=1 e a recarga ao vivo (LIVE_SKIP) desligam a entrada inteira (PANEL_ON.intro = false): esta tela também não aparece.
   Sem preço, oferta ou urgência (jogo com menores). Sem emoji. Teste: node test/paineis/p_title3.smoke.js */
(function(W){

/* ---------- ARTE: tudo o que a tela desenha de imagem está AQUI (trocar a peça = trocar a linha) ---------- */
const T3_ART={
  logo:'assets/brand/logo.png',                         /* o logo dourado do carregamento (um logo só) */
  /* DRAGÃO da direção B. Hoje: a folha idle do pet dragão do jogo, estágio evoluído (tira de 12 quadros de 512x352, pés em y=307).
     A Arte troca por uma folha própria da Tela Inicial (dragão voando, virado para o herói): mudar base e os números ao lado. */
  dragon:{base:'assets/anim/pets/era2_dragon_evo_idle',frames:12,cols:0,fps:12,w:512,h:352,cx:224,feetY:307,body:256,rel:0.92,x:0.80,flip:false},
  /* FUNDO PINTADO (Arte, aprovado pelo dono): o castelo ao entardecer do mock A, 1080x1920, com o logo pintado já apagado do céu (o logo real continua no alto).
     ground = linha do chão na pintura, como fração da altura: 0,79 (y = 1517 de 1920, o meio da clareira de terra, que vai de y 1400 a 1620 e de x 180 a 960); é aí que ficam os pés do herói e do dragão.
     A pintura cobre a largura da tela, centrada (focus), sem esticar; a altura é a que põe a linha do chão logo acima dos botões, e a base da pintura passa por trás deles.
     RESERVA: se a imagem não carregar (evento de erro), a tela volta sozinha para a cena da era (bg, abaixo), com a tinta de entardecer de antes. */
  bgArt:{url:'assets/ui/title/title_bg_a.png',ratio:1080/1920,ground:0.79,focus:0.50},
  /* RESERVA do fundo: a cena da era do jogador [arquivo, linha do chão (assets/bg/meta.json), foco horizontal]. */
  bg:[['assets/bg/era0.png',0.77,0.50],['assets/bg/era1.png',0.64,0.50],['assets/bg/era2.png',0.78,0.60],['assets/bg/era3.png',0.70,0.50],['assets/bg/era4.png',0.76,0.50],
      ['assets/bg/era5.png',0.68,0.50],['assets/bg/era6.png',0.67,0.50],['assets/bg/era7_ref.png',0.73,0.50],['assets/bg/era8_ref.png',0.79,0.50]],
  bgRatio:1600/1073,   /* largura / altura dos fundos */
  bgFeet:0.05,         /* os pés ficam um pouco abaixo da linha do chão (no meio da estrada) */
  bgNew:2,             /* jogador novo: a cena do castelo (a do mock A) */
  heroX:0.40,          /* centro do herói na largura da tela */
  avatarDir:'assets/hero/avatar/'
};
const T3_NEW_DIRECT=true;   /* jogador novo: JOGAR cria o convidado e segue para o Prólogo (quem já tem conta Google entra pelo botão logo abaixo do JOGAR, ou pelo ícone de conta). false = JOGAR abre a tela de Login de hoje */

if(typeof W.TITLE3_ON==='undefined') W.TITLE3_ON=false;   /* A CHAVE */
try{ if(typeof DEBUG!=='undefined'&&DEBUG&&typeof QP!=='undefined'&&QP&&QP.get('titulo')==='3') W.TITLE3_ON=true; }catch(e){}
const ON=()=>W.TITLE3_ON===true;

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* o fundo pintado é do pacote 'ui:late' (assets/ui/title): com o pacote baixado em outra pasta, o endereço de verdade é o do Sys.assets.url; sem o Sys.assets
   (ou desligado) é o caminho de sempre. Fundo por CSS não passa pelo js/latepack.js, por isso a troca é feita aqui. Pacote que ainda não chegou = a reserva (cena da era). */
const artUrl=u=>{ const v=tr(()=>W.Sys.assets.url(u),u); return typeof v==='string'&&v?v:u; };
const T={inst:false,PI:null,el:null,parts:null,bgBad:false,probe:null,live:false,raf:0,last:0,t:0,sheet:null,note:'',gBusy:false,gAsk:false,played:false,geo:null,herr:0,h1:null,h2:null,show0:null,fin0:null,toast0:null};
const SAVE=()=>{ try{ return (typeof S!=='undefined'&&S)?S:{}; }catch(e){ return {}; } };
const snd=n=>{ try{ if(T.PI&&T.PI.g&&T.PI.g.snd) T.PI.g.snd(n); }catch(e){} };
const say=m=>{ try{ if(T.PI&&T.PI.toast) T.PI.toast(m); }catch(e){} };
const isDev=()=>/EonboundDev/i.test(tr(()=>navigator.userAgent,'')||'');

/* ---------- leitura do jogo (só leitura; nada aqui cria conta nem chama o servidor) ---------- */
function netState(){ const OB=W.OnlineBoot; const st=tr(()=>OB.state(),null), off=tr(()=>navigator.onLine===false,false);
  if(!st||!st.on) return off?'offline':'off';                                   /* camada online desligada: jogo local */
  const raw=tr(()=>OB._st,null)||{};
  if(raw.reloading||st.lastAction==='applied') return 'cloud';                  /* o save da nuvem foi gravado e o jogo está recarregando */
  if(st.choosing) return 'choice';                                              /* tela Nuvem x Aparelho aberta (js/cloudchoice.js) */
  if(off) return 'offline';
  if(st.booting) return 'connecting';
  if(st.booted) return st.pending?'pending':'ok';
  if(st.waitingPlay) return 'wait';                                             /* sem conta ainda: nasce no JOGAR (não é erro) */
  const why=String(tr(()=>raw.last.reason,'')||'');
  if(!why) return 'connecting';
  return /maint/i.test(why)?'maint':'offline'; }
function snap(){ const PI=T.PI||W.PIntro||{}, g=PI.g||{}, s=SAVE();
  const isNew=!!tr(()=>g.isNew(),!s.name), stage=Math.max(1,(s.stage|0)||1);
  let per=10; try{ if(typeof STAGES_PER_ERA==='number'&&STAGES_PER_ERA>0) per=Math.floor(STAGES_PER_ERA); }catch(e){}
  let era=Math.floor((stage-1)/per); try{ if(typeof eraOf==='function') era=eraOf(stage); }catch(e){}
  era=clamp(era|0,0,T3_ART.bg.length-1);
  const hero=s.hero==='kaia'?'kaia':'kael';
  let avatar=String(tr(()=>W.Sys.appearance.avatarKey(s,W.Sys.host),'')||''); if(!/^[A-Za-z0-9_]+$/.test(avatar)) avatar=hero+'_phase0';
  const sess=!!tr(()=>W.Sys.net.DATA.on===true&&W.Sys.net.hasSession(),false);
  const acct=s.acct==='google'?'google':((!isNew||s.acct==='guest'||sess)?'guest':'none');
  return {isNew,name:String(tr(()=>g.name(),s.name||'')||'Viajante'),lvl:tr(()=>g.level(),1)|0||1,era,eraName:String(tr(()=>ERAS[era].n,'Era '+(era+1))),phase:((stage-1)%per)+1,
    hero,avatar,ver:String(tr(()=>g.version(),'')||''),realm:String(tr(()=>PI.realmBadge(),'S1 · Nova Era')),canSwap:!!tr(()=>PI.realmUI(),null),
    acct,net:netState(),gReady:!!tr(()=>PI.googleReady(),false),dev:isDev(),sceneEra:isNew?T3_ART.bgNew:era}; }

/* ---------- desenho: interface (texto sempre escapado) ---------- */
const IC={
  user:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c1-4.5 4.5-6.5 8-6.5s7 2 8 6.5"></path></svg>',
  x:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>',
  wifi:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M2 8.5a15 15 0 0 1 20 0M5.5 12a10 10 0 0 1 13 0M9 15.5a5 5 0 0 1 6 0"></path><path d="M3 3l18 18"></path></svg>',
  tool:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"></path></svg>',
  cloud:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a5 5 0 0 1-.6-10A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"></path></svg>',
  chev:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>'
};
const NET_TXT={ok:['Online','#5fd068'],connecting:['Conectando','#ffd25e'],offline:['Sem conexão','#b8a58a'],maint:['Manutenção','#ff9a5a'],cloud:['Nuvem','#7fd0ff'],choice:['Nuvem','#7fd0ff'],pending:['Online','#5fd068'],wait:['Pronto','#5fd068'],off:['','#ffd25e']};
const ACCT_ARIA={google:'Conta: Google',guest:'Conta: convidado',none:'Conta: ainda sem conta'};
function bannerHTML(st){
  if(st.net==='offline') return '<div class="t3-ban t3-off" role="status">'+IC.wifi+'<span>Sem conexão. Você joga offline e o progresso fica salvo neste celular até a conexão voltar.</span></div>';
  if(st.net==='maint') return '<div class="t3-ban t3-mt" role="status">'+IC.tool+'<span>Servidor em manutenção. Dá para jogar offline; o progresso sobe quando ele voltar.</span></div>';
  if(st.net==='cloud') return '<div class="t3-ban t3-cl" role="status">'+IC.cloud+'<span>Carregando o seu jogo da nuvem. Aguarde um instante.</span></div>';
  if(st.net==='choice') return '<div class="t3-ban t3-cl" role="status">'+IC.cloud+'<span>Escolha qual jogo continuar: o deste celular ou o da nuvem.</span></div>';
  if(st.net==='pending') return '<div class="t3-ban t3-cl" role="status">'+IC.cloud+'<span>Jogo da nuvem encontrado. Ele entra na próxima abertura do jogo.</span></div>';
  return ''; }
function playSub(st){ if(st.net==='cloud') return 'Carregando o seu jogo da nuvem'; if(st.net==='choice') return 'Escolha o jogo para continuar';
  if(st.net==='offline'||st.net==='maint') return 'Jogo offline';
  if(!st.isNew) return 'Continuar a jornada';
  return (st.acct==='none'&&st.net!=='off')?'Começa como convidado neste celular':'Começar a jornada'; }
function uiHTML(st){ const nt=NET_TXT[st.net]||NET_TXT.off, wait=st.net==='cloud'||st.net==='choice';
  const tag=st.acct==='google'?'<span class="t3-ac t3-acg" aria-hidden="true">G</span>':st.acct==='guest'?'<span class="t3-ac" aria-hidden="true">C</span>':'';
  const pcard=st.isNew?'':'<div class="t3-pc" role="group" aria-label="Seu herói"><img class="t3-av" src="'+esc(T3_ART.avatarDir+st.avatar)+'.png" alt="">'
    +'<span class="t3-pn"><b>'+esc(st.name)+'</b><small>'+esc(st.eraName)+' · fase '+(st.phase|0)+'</small></span><span class="t3-lv">Nv '+(st.lvl|0)+'</span></div>';
  const srvIn='<span class="t3-dot" style="background:'+nt[1]+';color:'+nt[1]+'"></span><span class="t3-sn"><b>'+esc(st.realm)+'</b>'+(nt[0]?'<small>'+esc(nt[0])+'</small>':'')+'</span>';
  const srv=st.canSwap
    ?'<button type="button" class="t3-srv" data-t3="srv" aria-label="Servidor '+esc(st.realm)+(nt[0]?', '+esc(nt[0]):'')+'. Trocar servidor">'+srvIn+'<span class="t3-tr">Trocar '+IC.chev+'</span></button>'
    :'<div class="t3-srv" role="status" aria-label="Servidor '+esc(st.realm)+(nt[0]?', '+esc(nt[0]):'')+'">'+srvIn+'</div>';
  const foot=st.acct==='google'?'Salvo na nuvem':st.acct==='guest'?'Salvo neste celular':'Sem conta ainda';
  /* JOGADOR NOVO SEM CONTA (aparelho novo): quem já tem conta Google entra nela por aqui, à vista, sem virar convidado novo. É a MESMA ação do ícone de conta
     (ACTIONS.google -> PIntro.google: sem conexão avisa e não tenta; no app DEV o PIntro avisa; conta que já tem personagem carrega o save da nuvem pelo caminho de hoje).
     O JOGAR continua criando o convidado só no toque. Quem já tem conta (convidado ou Google) não vê este botão. */
  const noNet=st.net==='offline'||st.net==='maint';
  const gAlt=(st.isNew&&st.acct==='none'&&st.net!=='off')
    ?'<button type="button" class="t3-alt" data-t3="google"'+((T.gBusy||(noNet&&!st.dev))?' aria-disabled="true"':'')+'><i aria-hidden="true">G</i><span>'+(T.gBusy?'Conectando com Google':'Já tenho conta: entrar com Google')+'</span></button>'
      +'<p class="t3-terms">Convidado: o progresso fica neste celular até você ligar uma conta.</p>':'';
  return '<button type="button" class="t3-acct" data-t3="acct" aria-label="'+ACCT_ARIA[st.acct]+'">'+IC.user+tag+'</button>'
    +'<div class="t3-stack"><div class="t3-col">'+bannerHTML(st)+pcard+srv
    +'<button type="button" class="t3-play'+(wait?' t3-wait':'')+'" data-t3="play"'+(wait?' aria-disabled="true"':'')+'>JOGAR<small>'+esc(playSub(st))+'</small></button>'+gAlt
    +(st.isNew?'<p class="t3-terms">Ao jogar você aceita os Termos de Uso e a Política de Privacidade (em Configurações › Sobre).</p>':'')
    +'<div class="t3-ft"><span>'+foot+'</span><span>Versão '+esc(st.ver)+'</span></div></div></div>'; }
function sheetHTML(st){ const noNet=st.net==='offline'||st.net==='maint';
  const who=st.acct==='google'?['Conta Google conectada','Seu progresso fica salvo na nuvem.']
    :st.acct==='guest'?['Convidado','Seu progresso fica salvo só neste celular.']
    :['Você ainda não tem conta',st.net==='off'?'O jogo começa salvo neste celular.':'Ao tocar em JOGAR, criamos um jogo de convidado neste celular.'];
  const ask=T.gAsk&&!T.gBusy&&st.acct==='guest';   /* quem já tem jogo neste celular confirma antes (ACTIONS.google) */
  const gTxt=T.gBusy?'Conectando com Google':ask?'Continuar com Google':(st.acct==='none'?'Entrar com Google':'Vincular com Google');
  const gBtn='<button type="button" class="t3-btn t3-ggl" data-t3="google"'+((T.gBusy||(noNet&&!st.dev))?' aria-disabled="true"':'')+'><i aria-hidden="true">G</i>'+gTxt+'</button>';
  let body='';
  if(st.acct==='none') body=gBtn+'<button type="button" class="t3-btn" data-t3="guest">Continuar como convidado</button>';
  else if(st.acct==='guest') body=ask
    ?'<p class="t3-note t3-w" role="alert">Antes de continuar: se esta conta Google já tiver um jogo salvo, ele pode entrar no lugar do jogo deste celular. Se ela ainda não tiver jogo, este herói fica guardado nela.</p>'+gBtn+'<button type="button" class="t3-btn" data-t3="gno">Cancelar</button>'
    :gBtn+'<p class="t3-note">Vincular guarda este herói na nuvem para jogar em outro celular.</p>';
  else body='<p class="t3-note">A conta Google ligada aparece em Configurações › Conta.</p>';
  if(st.acct!=='google'&&st.dev) body+='<p class="t3-note t3-w" role="status">No app DEV o login Google não funciona. Jogue como convidado.</p>';
  else if(st.acct!=='google'&&noNet) body+='<p class="t3-note t3-w" role="status">Entrar com Google precisa de conexão. O jogo offline funciona.</p>';
  if(T.note) body+='<p class="t3-note t3-msg" role="status">'+esc(T.note)+'</p>';
  return '<div class="t3-dim" data-t3="close"></div><div class="t3-sh" role="dialog" aria-label="Conta"><div class="t3-hd"><b>Conta</b><button type="button" class="t3-x" data-t3="close" aria-label="Fechar">'+IC.x+'</button></div>'
    +'<div class="t3-who"><span class="t3-wi" aria-hidden="true">'+(st.acct==='google'?'<b>G</b>':IC.user)+'</span><div><b>'+who[0]+'</b><small>'+who[1]+'</small></div></div>'
    +body+'<p class="t3-note">Excluir conta fica em Configurações › Conta.</p></div>'; }

/* ---------- ações: cada uma chama a função de hoje ---------- */
const ACTIONS={
  acct(){ snd('ui_tap'); T.sheet='acct'; T.note=''; T.gAsk=false; render(); return true; },
  close(){ if(!T.sheet) return false; T.sheet=null; T.note=''; T.gAsk=false; render(); return true; },
  gno(){ if(!T.gAsk) return false; snd('ui_tap'); T.gAsk=false; T.note=''; render(); return true; },   /* Cancelar do aviso: nada é chamado */
  /* cartão do servidor: o painel de reinos de hoje (PIntro.realmStep -> RealmUI.mount, com Voltar) */
  srv(){ const PI=T.PI; if(!PI||!tr(()=>PI.realmUI(),null)) return false; snd('ui_tap'); T.sheet=null; render();
    try{ PI.realmStep(false,()=>{ if(T.el) render(); }); }catch(e){ tr(()=>console.error('[titulo3] servidor',e),0); } return true; },
  /* JOGAR: a mesma função de hoje, UMA vez. O convidado só nasce aqui (PIntro.guest -> OnlineBoot.play). */
  play(){ const PI=T.PI; if(!PI||T.played) return false; const st=snap();
    if(st.net==='cloud'){ say('Espere: o seu jogo está vindo da nuvem'); return false; }
    if(st.net==='choice'){ say('Escolha primeiro qual jogo continuar'); return false; }
    T.played=true; T.sheet=null; snd('summon'); render();
    try{
      if(st.isNew&&T3_NEW_DIRECT){ if(st.acct!=='google') PI.guest();   /* quem já entrou com o Google pelo ícone não vira convidado */
        const go=()=>{ if(PI.el) PI.show('Prologo'); };
        if(!PI.realmSeen()&&PI.realmUI()) PI.realmStep(true,go); else go(); }
      else PI.nav('Prologo');
    }catch(e){ T.played=false; tr(()=>console.error('[titulo3] jogar',e),0); render(); return false; }
    return true; },
  /* Google: PIntro.google() faz tudo (entrar, vincular, aviso do app DEV, conta que já tem outro personagem, save da nuvem pendente) */
  google(){ const PI=T.PI; if(!PI||T.gBusy) return false; const st=snap(); if(st.acct==='google') return false;
    if(!st.dev){   /* no app DEV o próprio PIntro.google avisa */
      if(st.net==='offline'||st.net==='maint'){ say('Entrar com Google precisa de conexão. O jogo offline funciona.'); return false; }
      if(!st.gReady){ say('Login com Google ainda não está disponível aqui'); return false; } }
    /* NADA troca o save sem confirmação: quem já tem jogo neste celular vê o aviso na folha da Conta e só o segundo toque (Continuar com Google) segue.
       Jogador novo não tem o que perder e entra direto; no app DEV o PIntro.google só avisa. */
    if(!st.isNew&&!st.dev&&!T.gAsk){ T.gAsk=true; T.sheet='acct'; T.note=''; snd('ui_tap'); render(); return true; }
    T.gAsk=false; T.gBusy=true; T.note=''; snd('ui_tap'); render();
    let p; try{ p=PI.google(); }catch(e){ p=Promise.reject(e); }
    Promise.resolve(p).then(()=>{ T.gBusy=false; T.sheet=null; T.note=''; snd('claim'); say('Conta Google conectada. O seu progresso fica salvo na nuvem.'); render(); },
      e=>{ T.gBusy=false; if(!(e&&e.code==='cancelled')) say('Não foi possível entrar com o Google. Tente de novo.'); render(); });
    return true; },
  guest(){ const st=snap(); snd('ui_tap'); T.sheet=null; T.note='';
    say(st.acct==='none'&&st.net!=='off'?'Combinado: o jogo de convidado é criado quando você tocar em JOGAR':'Você continua jogando neste celular'); render(); return true; }
};
function act(name){ const f=Object.prototype.hasOwnProperty.call(ACTIONS,name)?ACTIONS[name]:null; if(!f||!T.el) return false; try{ return f(); }catch(e){ tr(()=>console.error('[titulo3]',e),0); return false; } }
function onClick(ev){ const t=ev&&ev.target, b=t&&t.closest?t.closest('[data-t3]'):null; if(!b||!T.el) return; if(T.el.contains&&!T.el.contains(b)) return;
  act(b.getAttribute?b.getAttribute('data-t3'):(b.dataset||{}).t3); }

/* ---------- cena: fundo da era, dragão (folha), herói do jogo (drawHeroFull) ---------- */
function dragonCss(){ const D=T3_ART.dragon, url=D.base+'.png';
  try{ if(typeof xSheetBg==='function'&&typeof xSheetMeta==='function') return xSheetBg(url,xSheetMeta(D.base,{frames:D.frames,cols:D.cols,fps:D.fps}),{}); }catch(e){}   /* tira OU grade: o ajudante das telas (js/screens.js) lê o .json real */
  const c=D.cols>0?D.cols:D.frames, r=Math.ceil(D.frames/c);
  if(r>1) return 'background:url('+url+') 0 0/'+(c*100)+'% '+(r*100)+'% no-repeat';   /* grade sem o ajudante: quadro parado (nunca mostra célula errada) */
  return 'background:url('+url+') 0 0/'+(D.frames*100)+'% 100% no-repeat;animation:t3_sheet '+(D.frames/D.fps).toFixed(3)+'s steps('+D.frames+',jump-none) infinite'; }
function embersHTML(){ let h=''; for(let i=0;i<12;i++){ const l=(i*23+7)%100, s=3+(i*5)%4, du=7+(i*3)%6, de=(i*1.3).toFixed(1), b=18+(i*17)%52;
    h+='<span class="t3-em" style="left:'+l+'%;bottom:'+b+'%;width:'+s+'px;height:'+s+'px;animation-duration:'+du+'s;animation-delay:-'+de+'s"></span>'; } return h; }
const canHero=()=>{ try{ return T.herr<4&&typeof W.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
const px=v=>Math.round(v)+'px';
function layout(){ const el=T.el, P=T.parts; if(!el||!P) return; const W0=el.clientWidth||390, H0=el.clientHeight||844, A=T3_ART, D=A.dragon;
  const st=T.snapNow||snap(), B=A.bg[clamp(st.sceneEra|0,0,A.bg.length-1)];
  const stack=tr(()=>P.ui.querySelector('.t3-stack'),null), top=(stack&&stack.offsetTop>0)?stack.offsetTop:Math.round(H0*0.68);
  const gT=Math.max(Math.round(H0*0.40),top-14), art=(A.bgArt&&A.bgArt.url&&!T.bgBad)?A.bgArt:null;
  let feet=0, bh=0;
  if(art){   /* fundo pintado: cobre a largura sem esticar; se a largura mandar e o chão passar dos botões, a pintura sobe (corta um pouco do céu) e o chão fica à vista */
    bh=Math.max(gT/art.ground,W0/art.ratio); const bw=bh*art.ratio, f0=Math.round(bh*art.ground), ty=Math.min(0,gT-f0), left=clamp(W0/2-bw*art.focus,W0-bw,0), end=ty+bh; feet=f0+ty;
    P.bg.style.cssText='left:'+px(left)+';top:'+px(ty)+';width:'+px(bw)+';height:'+px(bh)+';background-image:url('+artUrl(art.url)+')';
    const f1=feet+Math.round(bh*0.05);   /* o escuro só começa abaixo da clareira onde o herói pisa */
    P.fade.style.cssText='top:'+px(f1)+';height:'+px(Math.max(48,end-f1));
    P.floor.style.cssText='top:'+px(Math.max(f1+48,end)); }
  else {     /* reserva: a cena da era, como antes */
    const gy=Math.min(0.95,B[1]+A.bgFeet); bh=Math.max(gT/gy,W0/A.bgRatio); const bw=bh*A.bgRatio, left=clamp(W0/2-bw*B[2],W0-bw,0); feet=Math.round(bh*gy);
    P.bg.style.cssText='left:'+px(left)+';top:0;width:'+px(bw)+';height:'+px(bh)+';background-image:url('+B[0]+')';
    P.fade.style.cssText='top:'+px(feet+4)+';height:'+px(Math.max(48,bh-feet-4));
    P.floor.style.cssText='top:'+px(Math.max(feet+52,bh)); }
  P.scene.className='t3-scene'+(art?' t3-art':'');
  const logoB=64+Math.min(W0*0.80,340)*317/1024+24, mounted=!!tr(()=>heroLook().mount,null);
  let F=clamp(W0*0.40,112,176)*(mounted?0.84:1); F=clamp(F,88,Math.max(88,(feet-logoB)/(mounted?1.7:1.25)));
  const ch=Math.round(3*F), cy=ch-Math.round(0.3*F);
  P.hero.style.cssText='left:0;top:'+px(feet-cy)+';width:'+px(W0)+';height:'+px(ch);
  const k=F*D.rel/D.body, dx=W0*D.x;
  P.dragon.style.cssText='left:'+px(dx-D.cx*k)+';top:'+px(feet-D.feetY*k+2)+';width:'+px(D.w*k)+';height:'+px(D.h*k)+';'+(D.flip?'transform:scaleX(-1);':'')+dragonCss();
  P.shade.style.cssText='left:'+px(dx-D.body*k*0.34)+';top:'+px(feet-5)+';width:'+px(D.body*k*0.68)+';height:12px';
  T.geo={W0,H0,F,feet,cw:W0,ch,hx:W0*A.heroX,hy:cy}; }
function tick(ts){ T.raf=0; if(!T.live||!T.el) return; const next=()=>{ try{ T.raf=requestAnimationFrame(tick); }catch(e){ T.raf=0; } };
  if(tr(()=>document.hidden,false)||(T.last&&ts-T.last<32)){ next(); return; }   /* no máximo 30 quadros/s; parado com o app no fundo */
  const dt=T.last?Math.min(0.05,(ts-T.last)/1000):0; T.last=ts; T.t+=dt;
  const c=T.parts&&T.parts.hero, g=T.geo;
  if(c&&g&&c.getContext&&canHero()){ try{ const dpr=Math.min(W.devicePixelRatio||1,2), w=Math.round(g.cw*dpr), h=Math.round(g.ch*dpr);
      if(w>0&&h>0){ if(c.width!==w||c.height!==h){ c.width=w; c.height=h; } const x=c.getContext('2d');
        if(x){ x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,w,h);
          /* o herói do jogo: arma na mão, montaria e asa equipadas, pés no chão da cena. O pet do jogador não entra: o dragão da tela faz esse papel */
          W.drawHeroFull(x,g.hx*dpr,g.hy*dpr,g.F*dpr/HS,{t:T.t,pet:false}); } } }catch(e){ T.herr++; } }
  next(); }

/* ---------- estilo (só entra na página quando a tela é montada) ---------- */
const T3_CSS=`#pin .t3{position:absolute;inset:0;z-index:3;overflow:hidden;background:#0b0806;color:#f6ecdf;font-family:Nunito,system-ui,sans-serif;-webkit-user-select:none;user-select:none}
#pin .t3 *{box-sizing:border-box}
#pin .t3 button{font-family:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#pin .t3 button:focus-visible{outline:3px solid #ffc94a;outline-offset:2px}
#pin .t3-scene{position:absolute;inset:0;overflow:hidden;pointer-events:none}
#pin .t3-bg{position:absolute;background-size:100% 100%;background-repeat:no-repeat}
#pin .t3-tint{position:absolute;inset:0;background:linear-gradient(180deg,rgba(46,26,84,.72) 0%,rgba(112,54,112,.38) 34%,rgba(255,140,80,.14) 56%,rgba(11,8,6,0) 74%)}
#pin .t3-glow{position:absolute;inset:0;background:radial-gradient(ellipse 70% 34% at 50% 56%,rgba(255,214,150,.20),rgba(255,214,150,0) 70%)}
#pin .t3-art .t3-tint{background:linear-gradient(180deg,rgba(28,14,54,.36) 0%,rgba(46,22,70,.12) 26%,rgba(11,8,6,0) 50%)}
#pin .t3-art .t3-glow{opacity:.45}
#pin .t3-em{position:absolute;border-radius:50%;background:rgba(255,170,80,.95);box-shadow:0 0 8px 3px rgba(255,150,70,.5);animation:t3_rise 9s linear infinite}
#pin .t3-shade{position:absolute;border-radius:50%;background:rgba(0,0,0,.42);filter:blur(2px)}
#pin .t3-dragon{position:absolute}
#pin .t3-hero{position:absolute;display:block}
#pin .t3-fade{position:absolute;left:0;right:0;background:linear-gradient(180deg,rgba(11,8,6,0) 0%,rgba(11,8,6,.74) 55%,#0b0806 100%)}
#pin .t3-floor{position:absolute;left:0;right:0;bottom:0;background:#0b0806}
#pin .t3-logo{position:absolute;z-index:2;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);width:min(80%,340px);height:auto;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 6px 12px rgba(0,0,0,.55))}
#pin .t3-logot{position:absolute;z-index:2;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 72px);text-align:center;font:400 46px 'Lilita One',sans-serif;letter-spacing:1px;color:#ffd25e;text-shadow:0 3px 0 #5a3206,0 6px 14px rgba(0,0,0,.6);pointer-events:none}
#pin .t3-ui{position:absolute;inset:0;z-index:3;pointer-events:none}
#pin .t3-ui>*{pointer-events:auto}
#pin .t3-acct{position:absolute;top:calc(env(safe-area-inset-top,0px) + 12px);right:max(12px,env(safe-area-inset-right,0px));width:48px;height:48px;border-radius:50%;border:2px solid #ffc94a;background:rgba(40,26,14,.86);color:#ffe2a8;display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 4px 12px rgba(0,0,0,.45)}
#pin .t3-acct:active{transform:scale(.94)}
#pin .t3-ac{position:absolute;right:-3px;bottom:-3px;width:20px;height:20px;border-radius:50%;border:2px solid #1d1611;background:#c9b9a2;color:#1d1611;font:900 11px/16px Nunito,system-ui,sans-serif;text-align:center}
#pin .t3-acg{background:#fff;color:#1f1f1f}
#pin .t3-stack{position:absolute;left:0;right:0;bottom:0;padding:22px max(16px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 12px) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(180deg,rgba(11,8,6,0) 0%,rgba(11,8,6,.70) 26%,rgba(11,8,6,.94) 100%)}
#pin .t3-col{width:100%;max-width:400px;margin:0 auto;display:flex;flex-direction:column;align-items:stretch;gap:10px;min-width:0}
#pin .t3-ban{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:12px;font-size:13px;font-weight:800;line-height:1.35;text-align:left}
#pin .t3-ban svg{flex:none;margin-top:1px}
#pin .t3-ban span{min-width:0;overflow-wrap:anywhere}
#pin .t3-off{background:rgba(52,44,36,.94);border:1px solid #8a7458;color:#f0e4d2}
#pin .t3-mt{background:rgba(64,32,18,.95);border:1px solid #ff9a5a;color:#ffe2cc}
#pin .t3-cl{background:rgba(20,36,48,.95);border:1px solid #7fd0ff;color:#dff4ff}
#pin .t3-pc{display:flex;align-items:center;gap:10px;min-width:0;padding:6px 10px 6px 6px;border-radius:16px;background:rgba(20,14,9,.82);border:1.5px solid rgba(255,201,74,.55)}
#pin .t3-av{width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #ffc94a;background:#2a1f16;object-fit:cover}
#pin .t3-pn{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
#pin .t3-pn b{font:400 18px 'Lilita One',sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pin .t3-pn small{font-size:12.5px;font-weight:800;color:#d8cbb8;overflow-wrap:anywhere}
#pin .t3-lv{flex:none;padding:3px 10px;border-radius:10px;background:linear-gradient(180deg,#ffe07a,#f2b52a);color:#3a2208;font:400 15px 'Lilita One',sans-serif;white-space:nowrap}
#pin .t3-srv{display:flex;align-items:center;gap:10px;width:100%;min-height:50px;min-width:0;padding:6px 8px 6px 14px;border-radius:16px;border:1.5px solid rgba(255,214,150,.45);background:rgba(16,11,7,.86);text-align:left;color:#f6ecdf;font-size:14px}
#pin .t3-dot{width:12px;height:12px;border-radius:50%;flex:none;box-shadow:0 0 8px currentColor}
#pin .t3-sn{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
#pin .t3-sn b{font:400 17px 'Lilita One',sans-serif;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pin .t3-sn small{font-size:12px;font-weight:800;color:#d8cbb8}
#pin .t3-tr{flex:none;min-height:38px;display:flex;align-items:center;gap:4px;padding:0 12px;border-radius:12px;background:#3a2c1f;border:1px solid #6b5338;font-size:13px;font-weight:900;color:#ffe2a8}
#pin .t3-play{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;min-height:72px;padding:6px 10px;border:0;border-radius:22px;background:linear-gradient(180deg,#ffe58a 0%,#f2a826 100%);color:#2a1403;font:400 36px/1 'Lilita One',sans-serif;letter-spacing:3px;box-shadow:0 6px 0 #8a4f0c,0 10px 24px rgba(0,0,0,.45);animation:t3_pulse 1.8s ease-in-out infinite}
#pin .t3-play small{font:900 12.5px/1.2 Nunito,system-ui,sans-serif;letter-spacing:0;color:#2a1403;margin-top:3px}
#pin .t3-play:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
#pin .t3-play.t3-wait{animation:none;filter:saturate(.4) brightness(.82);cursor:default}
#pin .t3-alt{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:48px;min-width:0;padding:6px 12px;border-radius:16px;border:2px solid #d9b877;background:#1b140e;color:#ffffff;font-size:14.5px;font-weight:900;line-height:1.2;text-align:center}
#pin .t3-alt i{font-style:normal;width:26px;height:26px;flex:none;border-radius:50%;background:#ffffff;color:#1f1f1f;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900}
#pin .t3-alt span{min-width:0;overflow-wrap:anywhere}
#pin .t3-alt:active{transform:translateY(2px)}
#pin .t3-alt[aria-disabled="true"]{opacity:.6}
#pin .t3-terms{margin:0;font-size:12px;font-weight:700;color:#d8cbb8;text-align:center;line-height:1.4}
#pin .t3-ft{display:flex;flex-wrap:wrap;justify-content:space-between;gap:2px 10px;font-size:12px;font-weight:800;color:#d8cbb8}
#pin .t3-sheet{position:absolute;inset:0;z-index:4;pointer-events:none}
#pin .t3-sheet>*{pointer-events:auto}
#pin .t3-dim{position:absolute;inset:0;background:rgba(6,4,2,.66)}
#pin .t3-sh{position:absolute;left:0;right:0;bottom:0;max-height:82%;overflow-y:auto;overflow-x:hidden;padding:16px max(14px,env(safe-area-inset-right,0px)) calc(env(safe-area-inset-bottom,0px) + 18px) max(14px,env(safe-area-inset-left,0px));border-radius:26px 26px 0 0;background:linear-gradient(180deg,#2c2116,#1b140e);border-top:2px solid rgba(255,201,74,.55);box-shadow:0 -12px 40px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:10px;animation:t3_up .25s ease-out}
#pin .t3-hd{display:flex;align-items:center;gap:8px}
#pin .t3-hd b{flex:1;min-width:0;font:400 23px 'Lilita One',sans-serif;color:#fff}
#pin .t3-x{flex:none;width:44px;height:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;display:flex;align-items:center;justify-content:center;padding:0}
#pin .t3-who{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;background:#16110d;border:1.5px solid #4a3a2b}
#pin .t3-wi{width:46px;height:46px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#33271d;border:2px solid #6b5338;color:#f6ecdf}
#pin .t3-wi b{font-size:20px;color:#fff}
#pin .t3-who div{flex:1;min-width:0;line-height:1.3}
#pin .t3-who div b{display:block;font-size:15px;font-weight:900}
#pin .t3-who small{display:block;font-size:12.5px;font-weight:800;color:#c9b9a2}
#pin .t3-btn{width:100%;min-height:50px;border-radius:15px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:10px;padding:6px 12px;text-align:center}
#pin .t3-ggl{border:0;background:#fff;color:#1f1f1f;box-shadow:0 4px 0 #9a9a9a}
#pin .t3-ggl i{font-style:normal;width:26px;height:26px;flex:none;border-radius:50%;border:2px solid #1f1f1f;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900}
#pin .t3-btn[aria-disabled="true"]{opacity:.6}
#pin .t3-note{margin:0;font-size:12.5px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.4;overflow-wrap:anywhere}
#pin .t3-w{color:#ffb38a}
#pin .t3-msg{padding:8px 10px;border-radius:12px;border:1px solid #ffc94a;background:#16110d;color:#ffe9b0}
#pin.t3on .pi-toast{white-space:normal;width:max-content;max-width:calc(100% - 32px);text-align:center;bottom:auto;top:calc(env(safe-area-inset-top,0px) + 72px);line-height:1.35}
@keyframes t3_sheet{from{background-position:0 0}to{background-position:100% 0}}
@keyframes t3_rise{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-190px);opacity:0}}
@keyframes t3_pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
@keyframes t3_up{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){#pin .t3-play,#pin .t3-em,#pin .t3-sh{animation:none}#pin .t3-em{display:none}}`;
function css(){ if(document.getElementById('t3_css')) return; const st=document.createElement('style'); st.id='t3_css'; st.textContent=T3_CSS; document.head.appendChild(st); }

/* ---------- montar / desmontar ---------- */
function render(){ const P=T.parts; if(!T.el||!P) return; const st=snap(); T.snapNow=st;
  P.ui.innerHTML=uiHTML(st); P.sheet.innerHTML=T.sheet?sheetHTML(st):'';
  try{ const av=P.ui.querySelector&&P.ui.querySelector('.t3-av'); if(av&&av.addEventListener) av.addEventListener('error',()=>{ av.style.visibility='hidden'; },{once:true}); }catch(e){}
  try{ layout(); }catch(e){ tr(()=>console.error('[titulo3] cena',e),0); } }
function mk(tag,cls){ const e=document.createElement(tag); e.className=cls; return e; }
function mount(PI){ if(!PI||!PI.el||!PI.root) return false;
  if(T.el) unmount(true);
  css();
  const el=mk('div','t3'), scene=mk('div','t3-scene'); scene.setAttribute('aria-hidden','true');
  const P={scene,bg:mk('div','t3-bg'),tint:mk('div','t3-tint'),glow:mk('div','t3-glow'),em:mk('div','t3-ems'),shade:mk('div','t3-shade'),dragon:mk('div','t3-dragon'),
    hero:mk('canvas','t3-hero'),fade:mk('div','t3-fade'),floor:mk('div','t3-floor'),logo:mk('img','t3-logo'),ui:mk('div','t3-ui'),sheet:mk('div','t3-sheet')};
  P.em.innerHTML=embersHTML();
  for(const k of ['bg','tint','glow','em','shade','dragon','hero','fade','floor']) scene.appendChild(P[k]);
  P.logo.setAttribute('alt','Eonbound');
  P.logo.addEventListener('error',()=>{ try{ const t=mk('div','t3-logot'); t.textContent='EONBOUND'; el.replaceChild(t,P.logo); }catch(e){} },{once:true});
  P.logo.setAttribute('src',T3_ART.logo);
  /* pede a carga do fundo pintado junto com o logo; se falhar, a cena volta para a reserva (cenário da era) e é redesenhada */
  if(!T.bgBad&&T3_ART.bgArt&&T3_ART.bgArt.url){ const pr=mk('img','t3-probe'); pr.addEventListener('error',()=>{ if(T.bgBad) return; T.bgBad=true; if(T.el){ try{ layout(); }catch(e){} } },{once:true}); pr.setAttribute('src',artUrl(T3_ART.bgArt.url)); T.probe=pr; }
  el.appendChild(scene); el.appendChild(P.logo); el.appendChild(P.ui); el.appendChild(P.sheet);
  el.addEventListener('click',onClick);
  PI.el.appendChild(el);
  /* daqui em diante a tela nova está na página: o PIntro passa a "estar no Título" sem desenhar a tela antiga */
  try{ if(PI.cur&&PI.cur.componentWillUnmount) PI.cur.componentWillUnmount(); }catch(e){}
  try{ const old=PI.el.querySelector&&PI.el.querySelector('.pi-realmbar'); if(old) old.remove(); }catch(e){}
  PI.id='TituloV2B'; PI.cur={state:{},renderVals(){ return {}; },__t3:true};
  try{ PI.root.className='pi-TituloV2B'; PI.root.innerHTML=''; PI.fit(); }catch(e){}
  try{ PI.el.classList.add('t3on'); }catch(e){}
  T.PI=PI; T.el=el; T.parts=P; T.sheet=null; T.note=''; T.gBusy=false; T.gAsk=false; T.played=false; T.herr=0; T.last=0; T.live=true;
  T.h1=()=>{ if(T.el) render(); }; T.h2=()=>{ if(T.el){ try{ layout(); }catch(e){} } };
  try{ W.addEventListener('onlineboot',T.h1); W.addEventListener('online',T.h1); W.addEventListener('offline',T.h1); W.addEventListener('resize',T.h2); }catch(e){}
  render();
  try{ if(!T.raf) T.raf=requestAnimationFrame(tick); }catch(e){}
  return true; }
function stop(){ T.live=false; try{ if(T.raf) cancelAnimationFrame(T.raf); }catch(e){} T.raf=0;
  try{ if(T.h1){ W.removeEventListener('onlineboot',T.h1); W.removeEventListener('online',T.h1); W.removeEventListener('offline',T.h1); } if(T.h2) W.removeEventListener('resize',T.h2); }catch(e){}
  T.h1=T.h2=null; }
function unmount(removeDom){ stop(); const el=T.el; T.el=null; T.parts=null; T.sheet=null; T.geo=null; T.snapNow=null; if(!el) return;
  try{ el.removeEventListener('click',onClick); }catch(e){}
  if(removeDom){ try{ el.remove(); }catch(e){} try{ if(T.PI&&T.PI.el) T.PI.el.classList.remove('t3on'); }catch(e){} } }

/* ---------- encaixe (só com a chave ligada) ---------- */
function install(){ if(T.inst) return true; if(!ON()) return false; const PI=W.PIntro; if(!PI||typeof PI.show!=='function'||typeof PI.finish!=='function') return false;
  T.inst=true; T.PI=PI; const show0=T.show0=PI.show, fin0=T.fin0=PI.finish, toast0=T.toast0=PI.toast;
  PI.show=function(id,props){
    if(id==='TituloV2B'&&ON()&&this.el&&this.root){ let ok=false; try{ ok=mount(this); }catch(e){ ok=false; tr(()=>console.error('[titulo3] montar',e),0); }
      if(ok) return true; unmount(true); }   /* não montou: a tela de hoje aparece como sempre */
    else unmount(true);
    return show0.call(this,id,props); };
  PI.finish=function(){ unmount(false); return fin0.apply(this,arguments); };   /* a camada some junto com a entrada (o PIntro apaga o #pin) */
  /* com a tela nova na frente: o aviso perde as reticências e, com a folha da Conta aberta, fica escrito nela (o aviso some em 2 s) */
  if(typeof toast0==='function') PI.toast=function(msg){ let m=String(msg==null?'':msg);
    if(T.el){ m=m.replace(/\s*(\.{3}|…)\s*$/,'').replace(/\.{3}|…/g,'.').replace(/\s*Entre por ela na tela de Login\./,'');   /* com esta tela não há "tela de Login" para quem já tem jogo */ if(T.sheet){ T.note=m; try{ T.parts.sheet.innerHTML=sheetHTML(T.snapNow||snap()); }catch(e){} } }
    return toast0.call(this,m); };
  /* arquivo carregado com o Título de hoje já na tela: troca na hora */
  try{ if(PI.el&&PI.root&&PI.id==='TituloV2B'&&!(PI.cur&&PI.cur.__t3)) PI.show('TituloV2B'); }catch(e){}
  return true; }

W.PTitle3={ART:T3_ART,NEW_DIRECT:T3_NEW_DIRECT,isOn:ON,install,snap,uiHTML,sheetHTML,act,actions:()=>Object.keys(ACTIONS),_t:T,_css:T3_CSS};

if(ON()&&!install()){   /* o js/p_intro.js ainda não rodou: tenta de novo no load (antes do arranque dele, que espera um temporizador) */
  let n=0; const again=()=>{ if(install()||++n>40) return; try{ setTimeout(again,100); }catch(e){} };
  try{ if(document.readyState==='complete') setTimeout(again,0); else W.addEventListener('load',again,{once:true}); }catch(e){}
}
})(window);
