'use strict';
/* ================= 32 CHAT (frases prontas) — tela nova, nasce DESLIGADA (PANEL_ON.chat) =================
   Protótipo: docs/proto/Chat.dc.html. REGRA DO PO (menores): só FRASES PRONTAS; não existe campo de texto livre.
   O chat é do servidor. Sem ele a tela abre normalmente (canais, frases, regras) mas NÃO há mensagens e ENVIAR diz "precisa do online · em breve":
   nada de jogadores nem conversa simulados (o protótipo simulava; aqui não).
   FONTE DE DADOS: ainda não existe Sys.chat. A tela lê de um provedor opcional window.P_CHAT (o engenheiro/servidor define quando o online chegar):
     P_CHAT.online() → bool · P_CHAT.messages(canal) → [{id, who, name, title, vip, time, text, mine, system}] (canal 'w' | 'e' | 'g')
     P_CHAT.send(canal, indiceDaFrase) → {ok, reason?, cdMs?} · P_CHAT.report(msgId, motivo) / block(who) / mute(who, ms) → {ok}
     P_CHAT.cooldownMs() (espera até o próximo envio) · P_CHAT.newLeftMs() (conta nova só lê na 1ª hora) · P_CHAT.guild() → bool (está numa guilda)
   A tabela de frases abaixo é CONTEÚDO DA TELA (as 20 do protótipo aprovado) até virar Sys.chat (pedido Q-8).
   Sem emoji; sem aviso próprio de poder. Pedido Q-8 (reports/pedidos-entre-agentes.md): carregar este script e ligar PANEL_ON.chat. */
const XC={tab:0,sel:null,rep:null,shake:-1,msg:''};
const C_MINH=560;
const C_PHRASES=['Bom jogo!','Valeu!','Oi, pessoal!','Boa sorte no chefe!','Alguém para a guilda?','Entrem na minha guilda!','Parabéns!','Que sorte!','Bora subir no ranking!','Ajuda no chefe?','Já volto!','Bom dia!','Boa noite!','Foi por pouco!','Que drop lindo!','Vamos de arena?','Obrigado pela ajuda!','Nova era liberada!','Até mais!','GG!'];
const C_REASONS=['Ofensa','Spam','Golpe ou fraude','Nome impróprio'];
const C_HINT={w:'Todos os jogadores do servidor · seja gentil',e:'Só quem está na mesma era',g:'Só membros da sua guilda'};
const C_CSS=`.pc-ph{border:2px solid #6b5843;background:#33271d;color:#f6ecdf;border-radius:12px;min-height:46px;padding:6px 12px;font-size:14px;font-weight:900;white-space:nowrap}
.pc-ph:active{transform:translateY(2px)}.pc-ph.off{opacity:.55}
.pc-shake{animation:pcs .35s}@keyframes pcs{0%,100%{transform:none}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.pc-up{animation:pcu .25s ease-out both}@keyframes pcu{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pc-shake,.pc-up{animation:none}}`;
const cP=()=>window.P_CHAT||null;
const cOnline=()=>{ try{ const p=cP(); return !!(p&&typeof p.online==='function'&&p.online()); }catch(e){ return false; } };
const cEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const cSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
function cInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pc_css')) return; const st=document.createElement('style'); st.id='pc_css'; st.textContent=C_CSS; document.head.appendChild(st); }
function cChannels(){ let era='Era'; try{ const e=ERAS[Math.min(S.eraMax||0,ERAS.length-1)]; if(e&&e.n) era=e.n; }catch(x){} return [{k:'w',label:'Mundial',name:'Mundial'},{k:'e',label:'Era',name:'Era '+era},{k:'g',label:'Guilda',name:'Guilda'}]; }
function cMsgs(k){ if(!cOnline()) return []; try{ const a=cP().messages&&cP().messages(k); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
const cCall=(fn,...a)=>{ try{ const p=cP(); return p&&typeof p[fn]==='function'?p[fn](...a):null; }catch(e){ return null; } };
function cMsgRow(m){ if(m.system) return `<div role="note" class="pc-up" style="align-self:center;max-width:94%;padding:4px 10px;border-radius:10px;background:#241b14;font-size:12px;font-weight:800;color:#c9b9a2;text-align:center">${cEsc(m.text)}</div>`;
  const on=XC.sel===m.id&&!m.mine;
  return `<div class="pc-up" style="display:flex;flex-direction:column;align-items:${m.mine?'flex-end':'flex-start'};gap:4px"><button data-x="pick" data-id="${cEsc(m.id)}" aria-label="${cEsc(m.name)}, ${cEsc(m.time)}: ${cEsc(m.text)}${m.mine?'':'. Toque para denunciar, bloquear ou silenciar'}" style="max-width:88%;text-align:left;padding:6px 10px;border-radius:14px;background:${m.mine?'#4a3214':'#1d1611'};border:2px solid ${on?'#ffc94a':'#4a3a2b'};color:#f6ecdf;display:flex;flex-direction:column;gap:2px"><span style="display:flex;gap:6px;align-items:baseline;font-size:12px;font-weight:900"><span style="color:${m.vip?'#ffd84a':m.mine?'#ffc94a':'#f6ecdf'}">${cEsc(m.name)}</span>${m.title?`<span style="color:#9fd8ff;font-size:11px">${cEsc(m.title)}</span>`:''}<span style="color:#9c8d7a;font-size:10px">${cEsc(m.time)}</span></span><span style="font-size:15px;font-weight:800">${cEsc(m.text)}</span></button>
    ${on?`<div style="display:flex;gap:6px"><button data-x="rep" data-id="${cEsc(m.id)}" class="pc-ph" style="min-height:46px">Denunciar</button><button data-x="block" data-who="${cEsc(m.who)}" class="pc-ph">Bloquear</button><button data-x="mute" data-who="${cEsc(m.who)}" class="pc-ph">Silenciar</button></div>`:''}</div>`; }
function scrChat(){
  cInject(); const d=xDims(C_MINH), CH=cChannels(), ch=CH[XC.tab], online=cOnline(), msgs=cMsgs(ch.k), cd=online?(+cCall('cooldownMs')||0):0, nl=online?(+cCall('newLeftMs')||0):0;
  const hasGuild=ch.k!=='g'||(online&&cCall('guild')===true);
  const tabs=CH.map((c,i)=>`<button role="tab" aria-selected="${i===XC.tab}" data-x="tab" data-i="${i}" style="flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid ${i===XC.tab?'#ffc94a':'#4a3a2b'};background:${i===XC.tab?'#4a3420':'#241b14'};color:${i===XC.tab?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:15px;padding:0">${c.label}</button>`).join('');
  const banner=online?(nl>0?`Conta nova só lê na 1ª hora · envio libera em ${Math.ceil(nl/60000)} min`:''):'O chat precisa do servidor online: em breve. Até lá não há mensagens e o envio fica desligado.';
  const log=!hasGuild?`Você não está em uma guilda. Entre em uma para usar este canal.`:msgs.length?msgs.slice().reverse().map(cMsgRow).join(''):(online?'Nenhuma mensagem neste canal ainda.':'Sem mensagens: o chat abre junto com o online.');
  const ph=C_PHRASES.map((t,i)=>`<button data-x="send" data-i="${i}" class="pc-ph${!online||cd>0||nl>0?' off':''}${XC.shake===i?' pc-shake':''}">${cEsc(t)}</button>`).join('');
  V.innerHTML=xWrap(d,'',`<div style="flex:none;display:flex;flex-direction:column;gap:6px;padding:4px 2px"><div role="tablist" aria-label="Canais" style="display:flex;gap:6px">${tabs}</div>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.2">${cEsc(ch.name)} · ${cEsc(C_HINT[ch.k])}</span>${banner?`<div role="status" style="padding:8px 10px;border-radius:12px;background:#2a1f16;border:2px dashed #8a6a3a;font-size:12px;font-weight:900;color:#ffd27a;line-height:1.25">${cEsc(banner)}</div>`:''}</div>
    <div role="log" aria-label="Mensagens do canal ${cEsc(ch.name)}" class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column-reverse;gap:8px;padding:6px 4px">${msgs.length&&hasGuild?log:`<div role="note" style="margin:auto;text-align:center;padding:16px;font-size:14px;font-weight:800;color:#c9b9a2">${cEsc(log)}</div>`}</div>
    <div style="flex:none;padding:6px 2px;display:flex;flex-direction:column;gap:6px;padding-bottom:max(8px,env(safe-area-inset-bottom))"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;color:#c9b9a2"><span>Frases prontas · ${cEsc(ch.name)}</span><span>${cd>0?'Próximo envio em '+(cd/1000).toFixed(1).replace('.',',')+' s':'1 a cada 3 s'}</span></div>
      <div class="x-scroll" role="group" aria-label="Frases prontas" style="display:flex;flex-wrap:wrap;gap:6px;max-height:156px;overflow-y:auto">${ph}</div><span style="font-size:11px;font-weight:800;color:#9c8d7a;text-align:center">Chat livre chega em breve</span></div>
    ${XC.rep?`<div role="dialog" aria-label="Denunciar" style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px"><div style="width:100%;max-width:340px;border-radius:18px;background:#1d1611;border:3px solid #8a6a3a;padding:14px;display:flex;flex-direction:column;gap:8px;box-sizing:border-box"><b style="font-family:'Lilita One',sans-serif;font-size:22px">Denunciar ${cEsc(XC.rep.name)}</b><span style="font-size:13px;font-weight:800;color:#c9b9a2">Mensagem: “${cEsc(XC.rep.text)}”. Nossa equipe confere em até 24 h.</span>${C_REASONS.map((r,i)=>`<button data-x="reason" data-i="${i}" class="pc-ph" style="text-align:left">${r}</button>`).join('')}<button data-x="repno" class="pc-ph">Cancelar</button></div></div>`:''}`);
}
function cFind(id){ for(const c of cChannels()){ const m=cMsgs(c.k).find(x=>String(x.id)===String(id)); if(m) return m; } return null; }
function cClick(b){
  const a=b.dataset.x, CH=cChannels(), ch=CH[XC.tab];
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i>=0&&i<CH.length){ XC.tab=i; XC.sel=null; cSnd('ui_tap'); render(); } return; }
  if(a==='send'){ const i=parseInt(b.dataset.i,10); cSnd('ui_tap'); XC.shake=i;
    if(!cOnline()){ cToast('Enviar precisa do servidor online: em breve'); render(); return; }
    if(+cCall('newLeftMs')>0){ cToast('Conta nova só lê na 1ª hora'); render(); return; }
    const cd=+cCall('cooldownMs')||0; if(cd>0){ cToast('Espere '+Math.ceil(cd/1000)+' s para enviar de novo'); render(); return; }
    const r=cCall('send',ch.k,i); if(!r||!r.ok){ cToast(r&&r.reason?String(r.reason):'Não foi possível enviar agora'); render(); return; }
    XC.shake=-1; XC.sel=null; cSnd('claim'); render(); return; }
  if(a==='pick'){ const m=cFind(b.dataset.id); if(!m||m.mine) return; cSnd('ui_tap'); XC.sel=XC.sel===m.id?null:m.id; render(); return; }
  if(a==='rep'){ const m=cFind(b.dataset.id); if(!m) return; cSnd('ui_tap'); XC.rep={id:m.id,name:m.name,text:m.text}; XC.sel=null; render(); return; }
  if(a==='repno'){ cSnd('ui_tap'); XC.rep=null; render(); return; }
  if(a==='reason'){ const r=C_REASONS[parseInt(b.dataset.i,10)], rep=XC.rep; XC.rep=null; cSnd('ui_tap'); const x=rep?cCall('report',rep.id,r):null; cToast(x&&x.ok?'Denúncia de '+rep.name+' enviada ('+r.toLowerCase()+'). Obrigado!':'Não foi possível enviar a denúncia agora'); render(); return; }
  if(a==='block'||a==='mute'){ cSnd('ui_tap'); const x=a==='block'?cCall('block',b.dataset.who):cCall('mute',b.dataset.who,3600000); XC.sel=null; cToast(x&&x.ok?(a==='block'?'Jogador bloqueado':'Jogador silenciado por 1 h'):'Não foi possível agora'); render(); return; }
}
Panels.add('chat',{title:'Chat',render:scrChat,click:cClick,
  tick(){ if(!cOnline()) return; try{ const k=cChannels()[XC.tab].k, sig=cMsgs(k).length+':'+Math.ceil((+cCall('cooldownMs')||0)/100); if(sig!==XC.sig){ XC.sig=sig; render(); } }catch(e){} },
  busy(){ return !!XC.rep; },
  onOpen(){ XC.sel=null; XC.rep=null; XC.shake=-1; },
  onClose(){ XC.rep=null; } });
