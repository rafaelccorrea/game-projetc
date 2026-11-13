/* Eonbound — Sys.chat: CHAT DE FRASES PRONTAS (regras do PO/dono; pedido Q-8 em reports/pedidos-entre-agentes.md; tela js/p_chat.js).
   REGRA DE MENORES: NUNCA existe texto livre. O jogador só envia uma FRASE PRONTA pelo ÍNDICE (DATA.phrases). Nenhuma função aceita texto do jogador.
   - As 20 primeiras frases são as da tela/protótipo aprovado (C_PHRASES de js/p_chat.js), NA MESMA ORDEM: o índice da tela vale aqui.
   - Canais: 'world' (Mundial, 'w'), 'era' ('e', mesma era; o servidor filtra) e 'guild' ('g', só com Sys.guild ligado e o jogador numa guilda).
   - Anti-spam: 1 envio a cada 3 s; no máximo 10 por minuto; a mesma frase 3 vezes seguidas é bloqueada (a 3ª não sai).
   - Conta nova só LÊ na 1ª hora: conta a partir de host.accountCreated() (se o jogo tiver) ou de S.sys.chat.born (1º ensure com a chave ligada).
     Com servidor, o provider pode mandar newLeftMs() e vale o MAIOR dos dois (o servidor é a autoridade; o relógio local só ajuda).
   - Silenciar (por tempo, padrão 1 h) e bloquear (até desbloquear) são LOCAIS, guardados no save. Denúncia fica numa FILA local (S.sys.chat.reports)
     e vai ao servidor pelo provider (flushReports). Motivos: DATA.reasons.
   - O chat É DO SERVIDOR. O provider padrão é OFFLINE: sem mensagens, sem jogadores simulados; status() diz
     {online:false, reason:'server', text:'O chat precisa do servidor online: em breve'}. O servidor troca o provider com Sys.chat.setProvider(p).
   - screenProvider(S, host) monta o objeto window.P_CHAT que a tela espera (contrato no cabeçalho de js/p_chat.js).
   CHAVE DESLIGADA (DATA.on=false): desligada, canSend/send/mute/block/report respondem {ok:false, on:false, reason:'off'} e nada muda no save
   (ensure só arruma o save). Nada pago, nada sorteado. Todo relógio por host.now. */
(function(root){
'use strict';
const S3=3000, MIN=60000, H=3600000, D=24*H;
const DATA={
  on:false,
  cooldownMs:S3,            // 1 envio a cada 3 s
  perMinute:10,             // no máximo 10 envios por minuto
  repeatMax:2,              // a mesma frase no máximo 2 vezes seguidas (a 3ª é bloqueada)
  newAccountMs:H,           // conta nova só lê na 1ª hora
  muteDefaultMs:H, muteMaxMs:30*D,
  maxBlocked:200, maxReports:50, reportsPerDay:20,
  categories:[
    {id:'cumprimento',  name:'Cumprimentos'},
    {id:'batalha',      name:'Batalha'},
    {id:'guilda',       name:'Guilda'},
    {id:'ajuda',        name:'Ajuda'},
    {id:'agradecimento',name:'Agradecimentos'},
    {id:'despedida',    name:'Despedidas'},
  ],
  // ÍNDICES 0-19 = C_PHRASES da tela (mesma ordem e mesmo texto). Novas frases entram SEMPRE NO FIM (índice não muda).
  phrases:[
    {id:'bom_jogo',      cat:'cumprimento',   txt:'Bom jogo!'},
    {id:'valeu',         cat:'agradecimento', txt:'Valeu!'},
    {id:'oi_pessoal',    cat:'cumprimento',   txt:'Oi, pessoal!'},
    {id:'sorte_chefe',   cat:'batalha',       txt:'Boa sorte no chefe!'},
    {id:'alguem_guilda', cat:'guilda',        txt:'Alguém para a guilda?'},
    {id:'entrem_guilda', cat:'guilda',        txt:'Entrem na minha guilda!'},
    {id:'parabens',      cat:'agradecimento', txt:'Parabéns!'},
    {id:'que_sorte',     cat:'batalha',       txt:'Que sorte!'},
    {id:'bora_ranking',  cat:'batalha',       txt:'Bora subir no ranking!'},
    {id:'ajuda_chefe',   cat:'ajuda',         txt:'Ajuda no chefe?'},
    {id:'ja_volto',      cat:'despedida',     txt:'Já volto!'},
    {id:'bom_dia',       cat:'cumprimento',   txt:'Bom dia!'},
    {id:'boa_noite',     cat:'cumprimento',   txt:'Boa noite!'},
    {id:'por_pouco',     cat:'batalha',       txt:'Foi por pouco!'},
    {id:'drop_lindo',    cat:'batalha',       txt:'Que drop lindo!'},
    {id:'vamos_arena',   cat:'batalha',       txt:'Vamos de arena?'},
    {id:'obrigado_ajuda',cat:'agradecimento', txt:'Obrigado pela ajuda!'},
    {id:'nova_era',      cat:'batalha',       txt:'Nova era liberada!'},
    {id:'ate_mais',      cat:'despedida',     txt:'Até mais!'},
    {id:'gg',            cat:'batalha',       txt:'GG!'},
    // 20+: novas
    {id:'boa_tarde',     cat:'cumprimento',   txt:'Boa tarde!'},
    {id:'bem_vindo',     cat:'cumprimento',   txt:'Bem-vindo!'},
    {id:'tudo_bem',      cat:'cumprimento',   txt:'Tudo bem?'},
    {id:'chefe_caiu',    cat:'batalha',       txt:'Chefe derrotado!'},
    {id:'guilda_boa',    cat:'guilda',        txt:'Guilda boa, recomendo!'},
    {id:'doar_guilda',   cat:'guilda',        txt:'Bora doar para a guilda!'},
    {id:'territorio',    cat:'guilda',        txt:'Território conquistado!'},
    {id:'torneio',       cat:'guilda',        txt:'Faltam membros no torneio!'},
    {id:'subir_guilda',  cat:'guilda',        txt:'Vamos subir a guilda!'},
    {id:'preciso_ajuda', cat:'ajuda',         txt:'Preciso de ajuda!'},
    {id:'alguma_dica',   cat:'ajuda',         txt:'Alguma dica?'},
    {id:'melhor_arma',   cat:'ajuda',         txt:'Qual a melhor arma?'},
    {id:'evoluir_pet',   cat:'ajuda',         txt:'Como evolui o pet?'},
    {id:'ajuda_torre',   cat:'ajuda',         txt:'Me ajuda na torre?'},
    {id:'muito_obrigado',cat:'agradecimento', txt:'Muito obrigado!'},
    {id:'mandou_bem',    cat:'agradecimento', txt:'Mandou bem!'},
    {id:'voce_demais',   cat:'agradecimento', txt:'Você é demais!'},
    {id:'tchau',         cat:'despedida',     txt:'Tchau!'},
    {id:'ate_amanha',    cat:'despedida',     txt:'Até amanhã!'},
    {id:'vou_dormir',    cat:'despedida',     txt:'Vou dormir, até amanhã!'},
  ],
  // motivos de denúncia: os 4 da tela (rótulo igual) + 'outro'
  reasons:[
    {id:'ofensa', txt:'Ofensa'},
    {id:'spam',   txt:'Spam'},
    {id:'golpe',  txt:'Golpe ou fraude'},
    {id:'nome',   txt:'Nome impróprio'},
    {id:'outro',  txt:'Outro'},
  ],
  channels:[
    {id:'world', k:'w', name:'Mundial', hint:'Todos os jogadores do servidor · seja gentil'},
    {id:'era',   k:'e', name:'Era',     hint:'Só quem está na mesma era'},
    {id:'guild', k:'g', name:'Guilda',  hint:'Só membros da sua guilda'},
  ],
  // texto pt-BR de cada motivo de recusa (a tela mostra num aviso)
  reasonText:{
    off:'Chat desligado',
    server:'Enviar precisa do servidor online: em breve',
    new:'Conta nova só lê na 1ª hora',
    cooldown:'Espere 3 s para enviar de novo',
    rate:'Muitas mensagens seguidas: espere um pouco',
    repeat:'Escolha outra frase: a mesma não pode 3 vezes seguidas',
    channel:'Entre em uma guilda para usar este canal',
    phrase:'Frase inválida',
    who:'Jogador inválido',
    reason:'Motivo inválido',
    limit:'Muitas denúncias hoje: tente amanhã',
  },
  serverText:'O chat precisa do servidor online: em breve',
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const nowOf=host=>num(host&&typeof host.now==='function'?host.now():undefined,Date.now());
const OFF={ok:false,on:false,reason:'off'};
const idOf=who=>{ if(typeof who!=='string'&&typeof who!=='number') return ''; const s=String(who).trim(); return s.length<=64?s:''; };
const call=(o,fn,...a)=>{ try{ return o&&typeof o[fn]==='function'?o[fn](...a):undefined; }catch(e){ return undefined; } };

/* ---------- save: S.sys.chat ---------- */
function ensure(S,host){ if(!S||typeof S!=='object') throw new Error('Sys.chat.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.chat; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.chat={}; o.v=1;
  o.born=int0(o.born); if(!o.born&&ON()&&host) o.born=nowOf(host);   // a 1ª hora conta do 1º acesso COM a chave ligada
  o.last=int0(o.last); o.lastPhrase=Number.isInteger(o.lastPhrase)&&o.lastPhrase>=0&&o.lastPhrase<DATA.phrases.length?o.lastPhrase:-1; o.streak=o.lastPhrase<0?0:Math.min(99,int0(o.streak));
  o.sent=Array.isArray(o.sent)?o.sent.filter(t=>typeof t==='number'&&isFinite(t)&&t>0).slice(-DATA.perMinute):[];
  const m=(o.muted&&typeof o.muted==='object'&&!Array.isArray(o.muted))?o.muted:{}; o.muted={};
  for(const k of Object.keys(m).slice(0,DATA.maxBlocked)){ const id=idOf(k), u=int0(m[k]); if(id&&u) o.muted[id]=u; }
  o.blocked=Array.isArray(o.blocked)?[...new Set(o.blocked.map(idOf).filter(Boolean))].slice(0,DATA.maxBlocked):[];
  o.seq=int0(o.seq);
  o.reports=Array.isArray(o.reports)?o.reports.filter(r=>r&&typeof r==='object'&&(idOf(r.who)||idOf(r.msg))&&DATA.reasons.some(x=>x.id===r.reason)).slice(-DATA.maxReports)
    .map(r=>({id:int0(r.id),who:idOf(r.who),msg:idOf(r.msg),reason:r.reason,at:int0(r.at),sent:r.sent===true})):[];
  return o; }

/* ---------- conteúdo ---------- */
const categories=()=>DATA.categories.map(c=>({id:c.id,name:c.name,n:DATA.phrases.filter(p=>p.cat===c.id).length}));
/* frases com o índice (o que se envia); cat opcional filtra */
function phrases(cat){ return DATA.phrases.map((p,i)=>({i,id:p.id,cat:p.cat,txt:p.txt})).filter(p=>!cat||p.cat===cat); }
const phrase=i=>Number.isInteger(i)&&i>=0&&i<DATA.phrases.length?DATA.phrases[i]:null;
const reportReasons=()=>DATA.reasons.map(r=>({id:r.id,txt:r.txt}));
/* aceita o id ('golpe') ou o rótulo da tela ('Golpe ou fraude') */
const reasonId=r=>{ const s=String(r==null?'':r).trim().toLowerCase(); const x=DATA.reasons.find(z=>z.id===s||z.txt.toLowerCase()===s); return x?x.id:''; };
const reasonText=code=>DATA.reasonText[code]||'Não foi possível agora';

/* ---------- PROVIDER (como arena/guilda): sem servidor, OFFLINE ---------- */
const offlineProvider={ online:false,
  messages:()=>[],                                             // (S, host, channelId) → [{id, who, name, title, vip, time, text, mine, system}]
  send:()=>({ok:false,reason:'server'}),                        // (S, host, channelId, phraseIdx, phraseId) → {ok, reason?}
  report:()=>({ok:false,reason:'server'}),                      // (S, host, {who, msg, reason, at}) → {ok}
};
let provider=offlineProvider;
function setProvider(p){ provider=p&&typeof p==='object'?Object.assign({},offlineProvider,p):offlineProvider; return isOnline(); }
const getProvider=()=>provider;
function isOnline(S,host){ const o=provider.online; try{ return typeof o==='function'?o.call(provider,S,host)===true:o===true; }catch(e){ return false; } }

/* ---------- canais ---------- */
const chanOf=c=>{ const s=String(c==null?'':c); return DATA.channels.find(x=>x.id===s||x.k===s)||null; };
function inGuild(S){ const G=root.Sys&&root.Sys.guild; if(!G||!G.DATA||G.DATA.on!==true||typeof G.inGuild!=='function') return false; try{ return G.inGuild(S)===true; }catch(e){ return false; } }
function channels(S,host){ const g=ON()&&inGuild(S);
  return DATA.channels.map(c=>({id:c.id,k:c.k,name:c.name,hint:c.hint,available:ON()&&(c.id!=='guild'||g),reason:!ON()?'off':c.id==='guild'&&!g?'channel':''})); }

/* ---------- relógios ---------- */
function newLeftMs(S,host){ if(!ON()) return 0; const o=ensure(S,host), now=nowOf(host);
  const ac=int0(host&&typeof host.accountCreated==='function'?call(host,'accountCreated'):0), born=ac||o.born||now;
  const local=Math.min(DATA.newAccountMs,Math.max(0,born+DATA.newAccountMs-now));
  const srv=isOnline(S,host)?int0(call(provider,'newLeftMs',S,host)):0;
  return Math.max(local,srv); }
function cooldownMs(S,host){ if(!ON()) return 0; const o=ensure(S,host); if(!o.last) return 0; return Math.min(DATA.cooldownMs,Math.max(0,o.last+DATA.cooldownMs-nowOf(host))); }
/* envios no último minuto (os "do futuro" por relógio voltado contam, até 1 min à frente) */
function recent(o,now){ o.sent=o.sent.filter(t=>t>now-MIN&&t<=now+MIN); return o.sent; }
function rateLeftMs(o,now){ const r=recent(o,now); if(r.length<DATA.perMinute) return 0; const oldest=Math.min(...r); return Math.min(MIN,Math.max(1,oldest+MIN-now)); }

/* ---------- enviar ---------- */
/* {ok, reason:'off'|'server'|'phrase'|'channel'|'new'|'cooldown'|'rate'|'repeat', msLeft} */
function canSend(S,host,channel,phraseIdx){ if(!ON()) return Object.assign({msLeft:0},OFF);
  const o=ensure(S,host), now=nowOf(host), no=(reason,msLeft)=>({ok:false,on:true,reason,msLeft:int0(msLeft)});
  if(!isOnline(S,host)) return no('server');
  if(!phrase(phraseIdx)) return no('phrase');
  const ch=chanOf(channel); if(!ch||(ch.id==='guild'&&!inGuild(S))) return no('channel');
  const nl=newLeftMs(S,host); if(nl>0) return no('new',nl);
  const cd=cooldownMs(S,host); if(cd>0) return no('cooldown',cd);
  const rl=rateLeftMs(o,now); if(rl>0) return no('rate',rl);
  if(o.lastPhrase===phraseIdx&&o.streak>=DATA.repeatMax) return no('repeat');
  return {ok:true,on:true,reason:'',msLeft:0}; }
/* só índice de frase pronta: não existe parâmetro de texto. Anota o envio só quando o servidor aceita. */
function send(S,host,channel,phraseIdx){ const c=canSend(S,host,channel,phraseIdx); if(!c.ok) return c;
  const o=ensure(S,host), now=nowOf(host), ch=chanOf(channel), p=phrase(phraseIdx);
  const r=call(provider,'send',S,host,ch.id,phraseIdx,p.id);
  if(!r||r.ok!==true) return {ok:false,on:true,reason:r&&typeof r.reason==='string'?r.reason:'server',msLeft:int0(r&&r.cdMs)};
  o.streak=o.lastPhrase===phraseIdx?o.streak+1:1; o.lastPhrase=phraseIdx; o.last=now; recent(o,now).push(now); o.sent=o.sent.slice(-DATA.perMinute);
  return {ok:true,on:true,reason:'',channel:ch.id,phrase:{i:phraseIdx,id:p.id,txt:p.txt},msg:r.msg||null}; }

/* ---------- silenciar / bloquear (locais, no save) ---------- */
function mute(S,host,who,ms){ if(!ON()) return OFF; const id=idOf(who); if(!id) return {ok:false,on:true,reason:'who'}; const o=ensure(S,host), now=nowOf(host);
  const d=Math.min(DATA.muteMaxMs,int0(ms)||DATA.muteDefaultMs); for(const k of Object.keys(o.muted)) if(o.muted[k]<=now) delete o.muted[k];
  if(!(id in o.muted)&&Object.keys(o.muted).length>=DATA.maxBlocked) return {ok:false,on:true,reason:'limit'};
  o.muted[id]=now+d; return {ok:true,on:true,until:o.muted[id]}; }
function unmute(S,host,who){ if(!ON()) return OFF; const id=idOf(who), o=ensure(S,host); const had=id in o.muted; delete o.muted[id]; return {ok:had,on:true}; }
function isMuted(S,host,who){ if(!ON()) return false; const id=idOf(who), o=ensure(S,host); return !!id&&int0(o.muted[id])>nowOf(host); }
function block(S,host,who){ if(!ON()) return OFF; const id=idOf(who); if(!id) return {ok:false,on:true,reason:'who'}; const o=ensure(S,host);
  if(o.blocked.includes(id)) return {ok:true,on:true}; if(o.blocked.length>=DATA.maxBlocked) return {ok:false,on:true,reason:'limit'};
  o.blocked.push(id); return {ok:true,on:true}; }
function unblock(S,host,who){ if(!ON()) return OFF; const id=idOf(who), o=ensure(S,host), i=o.blocked.indexOf(id); if(i<0) return {ok:false,on:true}; o.blocked.splice(i,1); return {ok:true,on:true}; }
function isBlocked(S,host,who){ if(!ON()) return false; const id=idOf(who); return !!id&&ensure(S,host).blocked.includes(id); }
const hidden=(S,host,who)=>isBlocked(S,host,who)||isMuted(S,host,who);

/* ---------- denúncia (fila local → servidor) ---------- */
/* target = id do jogador; opts.msg = id da mensagem (a tela denuncia pela mensagem). → {ok, reason?, dup?, queued, sent} */
function report(S,host,playerId,reason,opts){ if(!ON()) return OFF; const o=ensure(S,host), now=nowOf(host), who=idOf(playerId), msg=idOf(opts&&opts.msg), rid=reasonId(reason);
  if(!who&&!msg) return {ok:false,on:true,reason:'who'}; if(!rid) return {ok:false,on:true,reason:'reason'};
  if(o.reports.some(r=>r.reason===rid&&(msg?r.msg===msg:(!r.msg&&r.who===who)))) return {ok:true,on:true,dup:true,queued:o.reports.length};
  if(o.reports.filter(r=>r.at>now-D&&r.at<=now+D).length>=DATA.reportsPerDay) return {ok:false,on:true,reason:'limit'};
  const r={id:++o.seq,who,msg,reason:rid,at:now,sent:false}; o.reports.push(r);
  if(o.reports.length>DATA.maxReports){ const i=o.reports.findIndex(x=>x.sent); o.reports.splice(i>=0?i:0,1); }
  flushReports(S,host); return {ok:true,on:true,queued:o.reports.filter(x=>!x.sent).length,sent:r.sent}; }
/* manda ao servidor o que está na fila (com provider online); as já enviadas ficam até 1 dia (para o "denunciado" e o limite diário) */
function flushReports(S,host){ if(!ON()) return 0; const o=ensure(S,host), now=nowOf(host); let n=0;
  if(isOnline(S,host)) for(const r of o.reports){ if(r.sent) continue; const x=call(provider,'report',S,host,{who:r.who,msg:r.msg,reason:r.reason,at:r.at}); if(x&&x.ok===true){ r.sent=true; n++; } }
  o.reports=o.reports.filter(r=>!r.sent||r.at>now-D); return n; }
const pendingReports=S=>ensure(S).reports.filter(r=>!r.sent).map(r=>Object.assign({},r));

/* ---------- mensagens (do servidor, filtradas pelo bloqueio/silêncio local) ---------- */
function messages(S,host,channel){ if(!ON()||!isOnline(S,host)) return []; const ch=chanOf(channel); if(!ch||(ch.id==='guild'&&!inGuild(S))) return [];
  const a=call(provider,'messages',S,host,ch.id); return Array.isArray(a)?a.filter(m=>m&&typeof m==='object'&&(m.system||m.mine||!hidden(S,host,m.who))).slice(-100):[]; }

/* ---------- status para as telas ---------- */
function status(S,host){ if(!ON()) return {on:false,online:false,reason:'off',text:''};
  if(!isOnline(S,host)) return {on:true,online:false,reason:'server',text:DATA.serverText};
  return {on:true,online:true,reason:'',text:'',newLeftMs:newLeftMs(S,host),cooldownMs:cooldownMs(S,host),guild:inGuild(S)}; }

/* ---------- window.P_CHAT para js/p_chat.js ---------- */
/* window.P_CHAT = Sys.chat.screenProvider(() => S, Sys.host). A tela usa canal 'w'|'e'|'g' e o índice da frase dela (= o daqui). */
/* S pode ser o save OU uma função que devolve o save (recomendado: () => S, porque o jogo troca o objeto ao carregar/reiniciar) */
function screenProvider(S,host){ const save=typeof S==='function'?()=>S():()=>S;
  const find=id=>{ for(const c of DATA.channels){ const m=messages(save(),host,c.id).find(x=>String(x.id)===String(id)); if(m) return m; } return null; };
  const txt=r=>r&&r.ok?r:Object.assign({},r,{ok:false,code:r&&r.reason,reason:reasonText(r&&r.reason)});
  return {
    online:()=>ON()&&isOnline(save(),host),
    messages:k=>messages(save(),host,k),
    send:(k,i)=>{ const r=send(save(),host,k,i); return r.ok?{ok:true}:Object.assign(txt(r),{cdMs:r.msLeft||0}); },
    report:(msgId,motivo)=>{ const m=find(msgId); return txt(report(save(),host,m&&m.who,motivo,{msg:msgId})); },
    block:who=>txt(block(save(),host,who)),
    mute:(who,ms)=>txt(mute(save(),host,who,ms)),
    cooldownMs:()=>cooldownMs(save(),host),
    newLeftMs:()=>newLeftMs(save(),host),
    guild:()=>ON()&&inGuild(save()),
  }; }

const API={DATA,ensure,categories,phrases,phrase,reportReasons,reasonText,channels,inGuild,status,newLeftMs,cooldownMs,canSend,send,messages,
  mute,unmute,isMuted,block,unblock,isBlocked,report,flushReports,pendingReports,setProvider,getProvider,offlineProvider,isOnline,screenProvider};
root.Sys=root.Sys||{}; root.Sys.chat=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
