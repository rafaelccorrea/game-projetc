/* Eonbound — Sys.net: CAMADA DE API do jogo com o servidor (contrato docs/API_SERVIDOR.md; servidor em Desktop\fps-server). fps-30 (Servidor).
   Atrás de chave DESLIGADA (DATA.on=false): desligado, toda chamada rejeita na hora com {code:'net_off'} e o jogo segue 100% local.
   O que faz (servidor mínimo para lançar, BACKLOG_URGENTE): sessão de convidado + renovação do token (refresh rotativo), vincular/entrar com
   Google, save na nuvem com a regra de conflito do §3.3, relógio do servidor (x-server-time) e compras Google Play (conferência no servidor).
   Regras:
   - Tudo é ASSÍNCRONO (Promise). Os módulos Sys.* continuam síncronos; a tela espera a Promise (contrato §1).
   - Tokens e o id do aparelho ficam no ARMAZENAMENTO DO APARELHO (host.storage), NUNCA dentro do S: o S sobe para a nuvem.
   - 401 token_expired: renova UMA vez e repete o pedido; se a renovação falhar, a sessão volta ao convidado (nova chamada a ensureSession).
   - Sem rede: rejeita {code:'offline'}; a tela mostra "sem conexão" no que precisa do servidor.
   - Nunca passa preço nem 💎 pelo cliente: a compra manda só o recibo do Google (productId, purchaseToken, orderId); quem entrega é o servidor.
   - Erros: rejeita com Error {code, reason (= code), status, details, retryAfterMs}; em 429 também retryAfterMin (minutos, para cima).
   - SAIR / TROCAR DE CONTA (§2.2b): signOut(opts) atrás da chave DATA.signOutOn (desligada). Todo PUT /save leva owner = id do jogador da sessão.
   Ligar (camada do engenheiro): Sys.net.init({fetch, storage:{get,set}, clientVersion, platform}); DATA.base='https://<host>/v1'; DATA.on=true.
   Testes: test/sys/net.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  base:null,                    // 'https://<host>/v1' (o dono passa quando o servidor subir)
  timeoutMs:10000,
  storageKey:'eon.net',
  saveFormat:1,
  /* LOGIN GOOGLE: ID do cliente WEB do projeto Firebase/Google Cloud "eonbound" (público; o servidor confere o idToken contra ele: GOOGLE_CLIENT_ID).
     No jogo é o serverClientId do plugin nativo. Vazio = o botão do Google mostra "em breve". */
  googleClientId:'108430697904-opm26965n34smlrrnlq1kha8bobb17b5.apps.googleusercontent.com',
  googlePlugin:'SocialLogin',   // @capgo/capacitor-social-login (Credential Manager do Android)
  /* SAIR / TROCAR DE CONTA (§2.2b): chave da frente, DESLIGADA. Desligada, signOut() devolve {ok:false, reason:'off'} sem nenhum pedido. */
  signOutOn:false,
  signOutTries:4,               // PUT /save com 429: no máximo 4 tentativas...
  signOutMaxWaitMs:95000,       // ...e no máximo 95 s de espera somada (o limite do servidor é 1 gravação a cada 30 s)
  realmMax:60,                  // servidores varridos na saída (sessões 'eon.net@sN' guardadas no aparelho)
};
const ST={ fetch:null, storage:null, clientVersion:'0', platform:'android', mem:{}, offset:0, refreshing:null, sleep:null, signingOut:null };

function init(o){
  o=o||{};
  ST.fetch=o.fetch||(typeof root.fetch==='function'?root.fetch.bind(root):null);
  ST.storage=o.storage||null; ST.clientVersion=String(o.clientVersion||'0'); ST.platform=String(o.platform||'android');
  ST.sleep=typeof o.sleep==='function'?o.sleep:null;   // só para teste: espera falsa (sem dormir de verdade)
  ST.mem=load(); if(!ST.mem.deviceId){ ST.mem.deviceId=uuid(); persist(); }
  return API;
}
/* SERVIDOR (realm, docs/SERVIDORES.md): o do jogo (window.Realm.id(), fps-c8) ou DATA.realm; ausente = 's1'. A SESSÃO é por servidor
   (chave 'eon.net' no S1, como sempre; 'eon.net@sN' nos outros), o deviceId é do aparelho (o mesmo em todos: o servidor acha os personagens da conta). */
function realm(){ let r=DATA.realm; try{ if(!r&&typeof window!=='undefined'&&window.Realm&&typeof window.Realm.id==='function') r=window.Realm.id(); }catch(e){} r=String(r||'s1').toLowerCase(); return /^s[0-9]{1,3}$/.test(r)?r:'s1'; }
const skey=()=>realm()==='s1'?DATA.storageKey:DATA.storageKey+'@'+realm();
function load(){ try{ const g=k=>{ const s=ST.storage&&ST.storage.get(k); return s?JSON.parse(s):null; }; const m=g(skey())||{};
  if(!m.deviceId&&skey()!==DATA.storageKey){ const b=g(DATA.storageKey); if(b&&b.deviceId) m.deviceId=b.deviceId; } return m; }catch(e){ return {}; } }
function persist(){ try{ ST.storage&&ST.storage.set(skey(),JSON.stringify(ST.mem)); }catch(e){} }
function uuid(){
  const c=root.crypto; if(c&&typeof c.randomUUID==='function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,ch=>{ const r=Math.random()*16|0; return (ch==='x'?r:(r&3|8)).toString(16); });
}
const fail=(code,extra)=>Object.assign(new Error(code),{code,reason:code},extra||{});

/* ---------- transporte ---------- */
async function raw(method,path,body,auth){
  if(!DATA.on) throw fail('net_off');
  if(!DATA.base||!ST.fetch) throw fail('net_not_configured');
  const h={'content-type':'application/json','x-client-version':ST.clientVersion,'x-device-id':ST.mem.deviceId||''};
  if(auth){ if(!ST.mem.access) throw fail('no_session'); h.authorization='Bearer '+ST.mem.access; }
  let res;
  const ctl=typeof AbortController!=='undefined'?new AbortController():null, tm=ctl?setTimeout(()=>ctl.abort(),DATA.timeoutMs):null;
  try{ res=await ST.fetch(DATA.base+path,{method,headers:h,body:body==null?undefined:JSON.stringify(body),signal:ctl?ctl.signal:undefined}); }
  catch(e){ throw fail('offline'); }
  finally{ if(tm) clearTimeout(tm); }
  const st=Number(res.headers&&res.headers.get&&res.headers.get('x-server-time'));
  if(isFinite(st)&&st>0) ST.offset=st-Date.now();
  if(res.status===204) return null;
  let data=null; try{ data=await res.json(); }catch(e){}
  if(res.status>=400){
    const e=(data&&data.error)||{}, x={status:res.status,details:e.details||{},retryAfterMs:Number(e.retryAfterMs)||0};
    /* 429: o tempo vem em retryAfterMs (corpo) ou no cabeçalho Retry-After (segundos); a tela mostra em minutos (para cima) */
    if(res.status===429){
      if(!(x.retryAfterMs>0)){ const ra=Number(res.headers&&res.headers.get&&res.headers.get('retry-after')); if(isFinite(ra)&&ra>0) x.retryAfterMs=Math.ceil(ra*1000); }
      x.retryAfterMin=x.retryAfterMs>0?Math.ceil(x.retryAfterMs/60000):0;
    }
    throw fail(e.code||(res.status===429?'rate_limited':'http_'+res.status),x);
  }
  return data;
}
/* com sessão: renova uma vez em 401 token_expired e repete */
async function call(method,path,body){
  try{ return await raw(method,path,body,true); }
  catch(e){
    if(e.status!==401||!ST.mem.refresh) throw e;
    await refresh();
    return raw(method,path,body,true);
  }
}
function takeSession(r){
  /* OUTRA conta (ex.: convidado → conta Google): a versão do save que o aparelho conhecia era da conta anterior. Zera, senão o sync compara
     com a versão errada e pode ignorar o save da conta nova (achado da fps-c8). */
  const prev=ST.mem.player&&ST.mem.player.id, next=r&&r.player&&r.player.id; if(prev&&next&&prev!==next) delete ST.mem.save;
  ST.mem.access=r.accessToken; ST.mem.refresh=r.refreshToken; ST.mem.accessExpiresAt=r.accessExpiresAt; ST.mem.player=r.player||null; persist();
  return r.player;
}
function dropSession(){ delete ST.mem.access; delete ST.mem.refresh; delete ST.mem.accessExpiresAt; persist(); }
/* várias chamadas ao mesmo tempo com token vencido = UMA renovação (reusar o refresh derrubaria a família inteira) */
function refresh(){
  if(ST.refreshing) return ST.refreshing;
  const tok=ST.mem.refresh;
  ST.refreshing=raw('POST','/auth/refresh',{refreshToken:tok},false).then(takeSession,e=>{ if(e.status===401) dropSession(); throw e; })
    .finally(()=>{ ST.refreshing=null; });
  return ST.refreshing;
}

/* ---------- conta ---------- */
/* abre a sessão: renova se houver refresh; senão entra como convidado (o mesmo aparelho volta à mesma conta). birthDate 'AAAA-MM' (tela neutra).
   {create:false}: só renova; sem sessão lança 'no_session' e NÃO cria convidado (decisão do PO 13/11: o convidado nasce no servidor só quando o jogador
   toca em JOGAR ou entra com o Google; nunca só por abrir o app, nem logo depois de excluir a conta). */
async function ensureSession(o){
  o=o||{};
  if(ST.mem.refresh){ try{ return await refresh(); }catch(e){ if(e.code==='offline'||e.code==='net_off') throw e; } }
  if(o.create===false) throw fail('no_session');
  const body={deviceId:ST.mem.deviceId,platform:ST.platform,clientVersion:ST.clientVersion,realm:realm()};
  if(o.birthDate) body.birthDate=o.birthDate;
  return takeSession(await raw('POST','/auth/guest',body,false));
}
const linkGoogle=tok=>call('POST','/auth/link/google',tok).then(p=>{ ST.mem.player=p; persist(); return p; });
/* aparelho novo: entra na conta vinculada ao Google (o save da nuvem vem depois, por sync) */
async function loginGoogle(tok){
  let r; try{ r=await raw('POST','/auth/login/google',Object.assign({deviceId:ST.mem.deviceId,realm:realm()},tok),false); }
  catch(e){ if(e.status===404&&e.code!=='not_linked'){ e.code=e.reason='not_linked'; e.message='not_linked'; } throw e; }   // 404 = conta Google sem vínculo
  return takeSession(r);
}
/* GET /realms (público; com sessão, o servidor junta o personagem do jogador em cada servidor). Sem rede: rejeita (a tela mostra só o servidor atual). */
const realms=()=>raw('GET','/realms',null,!!(ST.mem&&ST.mem.access));
/* entra com o Google pelo plugin nativo e manda só o idToken ao servidor. mode 'login' = aparelho novo / conta vinculada; 'link' = vincula ao convidado atual.
   Sem o plugin (navegador, APK sem ele): rejeita {code:'google_unavailable'} e a tela mantém "em breve". Cancelado pelo jogador: {code:'cancelled'}. */
function googleReady(){ try{ const P=root.Capacitor&&root.Capacitor.Plugins; return !!(DATA.on&&DATA.googleClientId&&P&&P[DATA.googlePlugin]); }catch(e){ return false; } }
let gInit=null;
/* mode: 'login' | 'link' | 'auto' (login; sem vínculo neste servidor → vincula ao convidado atual com o MESMO idToken: a janela do Google abre UMA vez).
   o.idToken: reusa um idToken já obtido (sem abrir a janela). No erro not_linked do 'login', e.idToken vem junto para o chamador vincular sem abrir de novo. */
async function googleSignIn(mode,o){
  let idToken=o&&o.idToken;
  if(!idToken) idToken=await googleIdToken();
  if(mode==='link') return linkGoogle({idToken});
  /* 'auto' devolve {action:'login'|'linked', player} (a tela precisa saber se ENTROU na conta ou VINCULOU ao convidado); 'login' devolve o jogador */
  try{ const p=await loginGoogle({idToken}); return mode==='auto'?{action:'login',player:p}:p; }
  catch(e){ if(e&&e.code==='not_linked'){ if(mode==='auto') return {action:'linked',player:await linkGoogle({idToken})}; e.idToken=idToken; } throw e; }
}
async function googleIdToken(){
  if(!googleReady()) throw fail('google_unavailable');
  const G=root.Capacitor.Plugins[DATA.googlePlugin];
  if(!gInit) gInit=G.initialize({google:{webClientId:DATA.googleClientId}});
  await gInit;
  let r; try{ r=await G.login({provider:'google',options:{}}); /* sem scopes: com a MainActivity padrão (BridgeActivity) o plugin recusa; email e perfil já vêm */ }
  catch(e){ const m=String(e&&(e.code||e.message)||''); throw fail(/cancel/i.test(m)?'cancelled':'google_error'); }
  const idToken=r&&r.result&&(r.result.idToken||(r.result.credential&&r.result.credential.idToken));
  if(!idToken) throw fail('google_error');
  return idToken;
}
async function logout(){ const t=ST.mem.refresh; dropSession(); if(t){ try{ await raw('POST','/auth/logout',{refreshToken:t},false); }catch(e){} } }
const me=()=>call('GET','/me');
const player=()=>ST.mem.player||null;
const hasSession=()=>!!ST.mem.refresh;
/* EXCLUSÃO DA CONTA (Play Store/LGPD): DELETE /me → 202. O servidor apaga em 30 dias e REVOGA todas as sessões; aqui a sessão local também sai.
   Resolve {ok:true, until:<ms em que a exclusão se completa>}. Entrar de novo antes disso cancela o pedido (o login devolve a conta). Rejeita como as outras
   chamadas: e.code 'offline' | 'timeout' | 'no_session' | 'token_invalid' | 'server'... */
/* depois de excluir: aparelho ganha outro deviceId. Senão o próximo convidado deste aparelho cairia na conta excluída e CANCELARIA a exclusão sem o jogador
   pedir (entrar com o Google continua cancelando, como o aviso diz). */
async function deleteAccount(){ await call('DELETE','/me'); dropSession(); delete ST.mem.player; delete ST.mem.save; ST.mem.deviceId=uuid(); persist(); return {ok:true,until:serverNow()+30*86400000}; }

/* ---------- sair / trocar de conta (§2.2b) ---------- */
/* Sys.net.signOut(opts) → Promise<{ok:true} | {ok:false, reason, retryAfterMs?, retryAfterMin?, details?}>. NUNCA rejeita.
   opts.save     = o S atual (ou opts.getSave = () => S): o mesmo S que o jogo passa ao push/sync;
   opts.summary  = o resumo (objeto ou função S → resumo), como no push;
   opts.sleep    = (ms) => Promise (só teste; padrão setTimeout).
   Ordem (só segue se o passo anterior deu certo; falhou = NADA apagado):
   (a) save confirmado na nuvem: aparelho com mudança (saveMeta().dirty) → PUT /save com owner até o 200 {version}; 429 → espera o Retry-After e
       repete (DATA.signOutTries tentativas, DATA.signOutMaxWaitMs de espera somada). Sem mudança → GET /save/head e a version tem de ser a do aparelho
       (diferente e com o S em mãos → sobe; sem o S → 'save_mismatch');
   (b) POST /auth/logout {refreshToken} → 204 (401 = sessão já morta: segue);
   (c) apaga access, refresh, jogador e a versão do save conhecida (a sessão de TODOS os servidores guardados no aparelho);
   (d) deviceId NOVO no armazenamento do aparelho (o antigo fica preso à conta Google).
   Apagar o save local e voltar ao Título é da tela. reasons: 'off' (chave desligada), 'net_off', 'not_google' (convidado sem Google: sair perderia a conta),
   'no_session', 'owner_mode', 'no_save' (há mudança e não veio o S), 'save_mismatch', 'busy' (já saindo), 'rate_limited' (+retryAfterMs/Min),
   e os códigos do servidor: 'wrong_account' (+details.session), 'save_conflict', 'save_regress', 'offline', 'timeout'... */
const nap=ms=>new Promise(r=>setTimeout(r,ms));
function signOut(opts){
  if(!DATA.signOutOn) return Promise.resolve({ok:false,reason:'off'});
  if(ST.signingOut) return Promise.resolve({ok:false,reason:'busy'});
  ST.signingOut=doSignOut(opts||{}).catch(e=>no(e)).finally(()=>{ ST.signingOut=null; });
  return ST.signingOut;
}
function no(e){
  const o={ok:false,reason:(e&&e.code)||'error'};
  if(e&&e.retryAfterMs) o.retryAfterMs=e.retryAfterMs;
  if(e&&e.retryAfterMin!=null) o.retryAfterMin=e.retryAfterMin;
  if(e&&e.details&&Object.keys(e.details).length) o.details=e.details;
  return o;
}
async function doSignOut(o){
  if(!DATA.on) return {ok:false,reason:'net_off'};
  if(ownerMode()) return {ok:false,reason:'owner_mode'};                  // save de teste do dono: nunca sobe, então nunca se confirma
  if(!ST.mem.refresh) return {ok:false,reason:'no_session'};
  const p=ST.mem.player, linked=p&&Array.isArray(p.linked)?p.linked:[];
  if(linked.indexOf('google')<0) return {ok:false,reason:'not_google'};   // §2.2b: só conta com Google (o convidado só volta pelo deviceId)
  const sleep=o.sleep||ST.sleep||nap;
  let S=o.save; if(S==null&&typeof o.getSave==='function'){ try{ S=o.getSave(); }catch(e){ S=null; } }
  /* (a) save confirmado */
  const pushIt=async()=>{
    let waited=0;
    for(let i=1;;i++){
      try{ return await push(S,o.summary||{}); }
      catch(e){
        if(e.code!=='rate_limited'||i>=DATA.signOutTries) throw e;
        const ms=Math.max(1000,Number(e.retryAfterMs)||30000);
        if(waited+ms>DATA.signOutMaxWaitMs) throw e;
        waited+=ms; await sleep(ms);
      }
    }
  };
  const m=saveMeta();
  if(m.dirty){
    if(S==null) return {ok:false,reason:'no_save'};
    await pushIt();
  }else{
    const h=await head();
    if(!h||h.version!==m.version){
      if(S==null) return {ok:false,reason:'save_mismatch'};
      await pushIt();
    }
  }
  /* (b) revoga a sessão do aparelho */
  const tok=ST.mem.refresh;
  try{ await raw('POST','/auth/logout',{refreshToken:tok},false); }
  catch(e){ if(e.status!==401) throw e; }
  /* (c) + (d): sessão fora e deviceId novo, em todos os servidores guardados no aparelho */
  const dev=uuid(), cur=skey();
  delete ST.mem.access; delete ST.mem.refresh; delete ST.mem.accessExpiresAt; delete ST.mem.player; delete ST.mem.save;
  ST.mem.deviceId=dev; ST.refreshing=null; persist();
  await sweepRealms(cur,dev);
  return {ok:true};
}
/* as outras sessões guardadas ('eon.net' e 'eon.net@sN') são da MESMA conta: revoga cada uma (sem esperar resultado) e deixa só o deviceId novo */
async function sweepRealms(cur,dev){
  if(!ST.storage) return;
  const keys=[DATA.storageKey]; for(let i=2;i<=DATA.realmMax;i++) keys.push(DATA.storageKey+'@s'+i);
  for(const k of keys){
    if(k===cur) continue;
    let m=null; try{ const s=ST.storage.get(k); m=s?JSON.parse(s):null; }catch(e){ m=null; }
    if(!m||typeof m!=='object') continue;
    if(m.refresh){ try{ await raw('POST','/auth/logout',{refreshToken:m.refresh},false); }catch(e){} }
    try{ ST.storage.set(k,JSON.stringify({deviceId:dev})); }catch(e){}
  }
}

/* ---------- relógio ---------- */
/* agora no relógio do servidor (a última resposta trouxe x-server-time); sem servidor = relógio do aparelho */
const serverNow=()=>Date.now()+ST.offset;
const time=()=>raw('GET','/time',null,false);

/* ---------- save (§3) ---------- */
/* ST.mem.save = {version, dirty}: a versão da nuvem que o aparelho conhece e se o aparelho mudou desde a última sincronização */
const saveMeta=()=>Object.assign({version:0,dirty:false},ST.mem.save||{});
function markDirty(){ ST.mem.save=Object.assign(saveMeta(),{dirty:true}); persist(); }
function setMeta(version,dirty){ ST.mem.save={version,dirty:!!dirty}; persist(); }
/* MODO DONO (app de teste, save separado 'eras_owner_v1'): o save do dono NUNCA sobe nem desce da nuvem (senão o save cheio de itens liberados
   cobriria o da conta real) e as entregas de compra REAIS não caem no save de teste. push/pull/sync/chooseSide/restore e as entregas não tocam em nada. */
/* Modo dono = a flag OU a chave do save do dono ('eras_owner_v1' ou 'eras_owner_v1@<realm>'): qualquer uma das duas basta para nada subir nem descer */
const ownerMode=()=>{ if(DATA.ownerForce===true) return true; try{ if(typeof OWNER_MODE!=='undefined'&&OWNER_MODE===true) return true; return typeof SAVE_KEY==='string'&&/^eras_owner_v1(@|$)/.test(SAVE_KEY); }catch(e){ return false; } };   // eslint-disable-line no-undef
const OWNER_SKIP={action:'none',owner:true};
async function head(){ try{ return await call('GET','/save/head'); }catch(e){ if(e.code==='not_found') return null; throw e; } }
async function pull(){
  if(ownerMode()) return null;
  try{ const r=await call('GET','/save'); setMeta(r.version,false); return r; }
  catch(e){ if(e.code==='not_found') return null; throw e; }
}
/* sobe o S. 409 save_conflict: rejeita com details.cloud (a tela decide com chooseSide). */
/* summary pode ser o OBJETO ou a FUNÇÃO S → resumo: com a função, o resumo é montado junto com o corpo do pedido (o mesmo instante em que o S
   é serializado), então gemas/fase que mudarem durante um await não divergem do save (o servidor confere era/fase/gemas contra o blob). */
const sumOf=(S,summary)=>{ try{ return (typeof summary==='function'?summary(S):summary)||{}; }catch(e){ return {}; } };
async function push(S,summary,o){
  if(ownerMode()) return Object.assign({},OWNER_SKIP);
  const m=saveMeta();
  let r;
  /* owner (§2.2b): o id do jogador da sessão. O servidor recusa com 409 wrong_account {session} se não for o do token (e não grava). Sem id conhecido, vai sem. */
  const own=ST.mem.player&&ST.mem.player.id;
  try{ r=await call('PUT','/save',{baseVersion:m.version,saveFormat:DATA.saveFormat,clientVersion:ST.clientVersion,deviceId:ST.mem.deviceId,
    clientTime:Date.now(),summary:sumOf(S,summary),save:S,...(own!=null?{owner:String(own)}:{}),...(o&&o.force?{force:true}:{})}); }
  catch(e){
    // 422 save_implausible: o servidor GUARDOU o save (marcado para revisão) na versão details.version; o aparelho precisa saber, senão o próximo dá conflito
    if(e.code==='save_implausible'&&e.details&&typeof e.details.version==='number') setMeta(e.details.version,false);
    throw e;
  }
  setMeta(r.version,false);
  return r;
}
/* REGRA DO §3.3 na abertura: devolve {action, cloud?}
   'none'    = nuvem igual à versão conhecida e aparelho sem mudança;
   'push'    = só o aparelho mudou (ou nuvem vazia): já subiu;
   'pulled'  = nuvem mais nova e o aparelho não mudou: já baixou (r.save = o S novo; a camada troca o S local);
   'choose'  = os DOIS mudaram: a tela mostra os resumos (device × cloud) e chama chooseSide('device'|'cloud'). Nunca há fusão. */
/* PROTEÇÃO DO SAVE DA NUVEM (perda achada pelo QA: aparelho sem save local + identidade guardada subiu um save VAZIO por cima da nuvem):
   - aparelho NOVO/VAZIO (nível ≤ 1, fase ≤ 1, sem XP nem tempo de jogo) e nuvem COM progresso → BAIXA a nuvem, nunca sobe;
   - aparelho ATRÁS da nuvem (nível ou era menores) → PERGUNTA (choose), nunca sobe sozinho. Só a escolha explícita do jogador (chooseSide) sobe por cima,
     e o servidor também recusa a regressão sem essa marca (409 save_regress). */
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const isFresh=d=>num(d.level)<=1&&num(d.stage)<=1&&num(d.xp)<=0&&num(d.playSeconds)<=0;
const hasProgress=c=>num(c.level)>1||num(c.stage)>1||num(c.xp)>0||num(c.playSeconds)>0;
const behind=(d,c)=>num(d.level)<num(c.level)||num(d.era)<num(c.era);
/* lado recomendado: mais tempo de jogo; empate (ex.: tempo ainda não medido) → o mais avançado (nível, era, fase, FC); empate total → aparelho (mesmo progresso; é só o destaque, o jogador escolhe) */
function recommendOf(d,c){ for(const k of ['playSeconds','level','era','stage','fc']){ if(num(d[k])>num(c[k])) return 'device'; if(num(d[k])<num(c[k])) return 'cloud'; } return 'device'; }
async function sync(S,summary){
  if(ownerMode()) return Object.assign({},OWNER_SKIP);
  const m=saveMeta(), h=await head();
  if(!h){ const r=await push(S,summary); return {action:'push',version:r.version}; }
  const cs=(h&&h.summary)||{}, dv=sumOf(S,summary), choose=()=>({action:'choose',cloud:h,device:dv,recommend:recommendOf(dv,cs)});
  const pullIt=async()=>{ const r=await pull(); return {action:'pulled',version:r.version,save:r.save,summary:r.summary}; };
  if(hasProgress(cs)&&isFresh(dv)) return pullIt();                       // aparelho vazio nunca cobre uma nuvem com progresso
  if(h.version===m.version){
    if(!m.dirty) return {action:'none',version:h.version};
    if(behind(dv,cs)) return choose();                                    // aparelho atrás: o jogador decide
    const r=await push(S,summary); return {action:'push',version:r.version};
  }
  if(!m.dirty) return pullIt();
  return choose();
}
/* escolha da tela no conflito. 'device' sobe o S por cima (a versão da nuvem vai para o histórico); 'cloud' baixa. */
async function chooseSide(side,S,summary){
  if(ownerMode()) return Object.assign({},OWNER_SKIP);
  if(side==='cloud'){ const r=await pull(); return {action:'pulled',version:r.version,save:r.save,summary:r.summary}; }
  const h=await head(); setMeta(h?h.version:0,true);
  const r=await push(S,summary,{force:true}); return {action:'push',version:r.version};   // escolha EXPLÍCITA do jogador: o servidor aceita mesmo se regredir
}
const history=()=>call('GET','/save/history');
const restore=version=>ownerMode()?Promise.resolve(Object.assign({},OWNER_SKIP)):call('POST','/save/restore',{version}).then(r=>{ setMeta(r.version,false); return r; });

/* ---------- compras (§7) ---------- */
/* antes de abrir a compra: o id que vai em BillingFlowParams.setObfuscatedAccountId (o servidor confere que a compra é desta conta) */
const accountId=()=>call('GET','/purchases/account-id').then(r=>r.obfuscatedAccountId);
const canBuy=productId=>call('GET','/purchases/can-buy?productId='+encodeURIComponent(productId));
/* depois do Google: manda o recibo. status 'granted'|'already_granted'|'pending'|'invalid'. A ENTREGA vem por deliveries() (abaixo).
   A confirmação (acknowledge/consume) é do SERVIDOR: o app não chama acknowledge. */
const verifyGoogle=p=>call('POST','/purchases/google',{productId:p.productId,purchaseToken:p.purchaseToken,orderId:p.orderId||null});
/* ENTREGAS: o jogo aplica SÓ o que vem daqui (o grants da resposta da compra é informativo), grava o save e confirma com ackDelivery(id).
   Chamar ao abrir o jogo e depois de cada compra. revoke:true = estorno (tirar o que der: 💎 até 0, VIP, skin, passe). */
const deliveries=()=>ownerMode()?Promise.resolve([]):call('GET','/purchases/deliveries');
const ackDelivery=id=>ownerMode()?Promise.resolve(Object.assign({},OWNER_SKIP)):call('POST','/purchases/deliveries/'+encodeURIComponent(id)+'/ack');
const entitlements=()=>call('GET','/entitlements');
const offers=()=>call('GET','/offers');
const claimMonthlyCard=()=>call('POST','/purchases/monthly-card/claim');

/* ---------- correio e eventos ---------- */
const mail=()=>call('GET','/mail');
const claimMail=id=>call('POST','/mail/'+encodeURIComponent(id)+'/claim');
const events=()=>call('GET','/events');

function _reset(){ ST.fetch=null; ST.storage=null; ST.mem={}; ST.offset=0; ST.refreshing=null; ST.sleep=null; ST.signingOut=null; }

const API={DATA,realm,realms,init,ensureSession,linkGoogle,loginGoogle,googleReady,googleSignIn,logout,signOut,me,player,hasSession,deleteAccount,serverNow,time,
  markDirty,saveMeta,head,pull,push,sync,chooseSide,history,restore,accountId,canBuy,verifyGoogle,deliveries,ackDelivery,entitlements,offers,claimMonthlyCard,
  mail,claimMail,events,_reset,_call:call};
root.Sys=root.Sys||{}; root.Sys.net=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
