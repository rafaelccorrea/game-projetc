'use strict';
/* ================= EXCLUIR CONTA (exigência da Play; Configurações › Conta) =================
   window.DeleteAccount.open() → abre um overlay próprio (não depende do Panels; carrega antes ou depois do jogo). Recusa no Modo dono (devolve false).
   Passo 1: explica (texto do PO) + link da página pública de exclusão. Passo 2: o jogador DIGITA "EXCLUIR" para liberar o botão vermelho (confirmação dupla).
   Envia Sys.net.deleteAccount() (DELETE /me: apaga em 30 dias; entrar de novo cancela). Deu certo → window.OnlineBoot.accountDeleted() (da fps-c8: bloqueia
   gravações, apaga a sessão, o pendente da nuvem e a marca do servidor e recarrega no Título). Falhou ou sem resposta → NADA é apagado no aparelho.
   Sem online (sem Sys.net, sem sessão ou sem rede) → "Precisa de internet". DATA.localSave: 'erase' (padrão, proposta ao dono) = o texto avisa que o jogo
   deste aparelho também é apagado; 'keep' = o texto diz que o aparelho fica com o progresso como jogo sem conta. Sem emoji; só rolagem vertical; 360 px. */
(function(){
const DATA={
  localSave:'erase',   // decisão do dono pendente (A = 'erase', recomendado; B = 'keep')
  page:'https://15-229-249-157.sslip.io/excluir-conta',
  word:'EXCLUIR', timeoutMs:15000,
  t:{title:'Excluir conta',
     main:'Apagamos sua conta e seus dados em 30 dias. Se você entrar de novo antes disso, a exclusão é cancelada. Compras não são reembolsadas por aqui.',
     all:'Isto vale para os seus personagens em TODOS os servidores: progresso, histórico, chat, correio, rankings e guilda.',
     erase:'O jogo deste aparelho também será apagado. Não dá para desfazer.',
     keep:'O jogo deste aparelho continua como jogo sem conta, sem nuvem.',
     link:'Saiba mais na página de exclusão',
     type:'Para confirmar, digite EXCLUIR:',
     offline:'Precisa de internet para excluir a conta. Conecte-se e tente de novo.',
     fail:'Não deu para excluir agora. Nada foi apagado. Tente de novo mais tarde.',
     noNet:'Sem conexão: nada foi apagado. Tente de novo com internet.',
     cleanFail:'A conta foi excluída, mas não deu para limpar este aparelho. Feche e abra o jogo.',
     noSession:'Você não está conectado a uma conta online. Para pedir a exclusão, use a página de exclusão.',
     sent:'Pedido enviado. A sua conta será apagada em 30 dias.',
     sentAt:'Pedido enviado. A sua conta será apagada em %D. Se você entrar de novo antes disso, a exclusão é cancelada.'}
};
const dTry=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const dEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const owner=()=>dTry(()=>(typeof OWNER_MODE!=='undefined'&&OWNER_MODE===true)||(typeof SAVE_KEY==='string'&&/^eras_owner/.test(SAVE_KEY)),false);
const online=()=>{ const N=window.Sys&&window.Sys.net; if(!N||typeof N.deleteAccount!=='function') return false;
  const sess=dTry(()=>typeof N.hasSession==='function'?!!N.hasSession():true,true), net=dTry(()=>navigator.onLine!==false,true); return sess&&net; };
const U={el:null,step:'info',typed:'',busy:false,msg:'',err:false};
function css(){ if(document.getElementById('da_css')) return; const st=document.createElement('style'); st.id='da_css'; st.textContent=`
#da_root{position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;background:rgba(8,6,4,.88);padding:14px;box-sizing:border-box}
#da_root .da-box{width:100%;max-width:400px;max-height:100%;overflow-y:auto;overflow-x:hidden;border-radius:20px;background:#1d1611;border:2px solid #ff6b5a;padding:16px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;color:#f6ecdf}
#da_root .da-btn{width:100%;min-height:50px;border-radius:14px;border:0;font-size:16px;font-weight:900;cursor:pointer}
#da_root .da-off{background:#33271d;color:#f6ecdf;border:2px solid #4a3a2b}
#da_root .da-red{background:linear-gradient(180deg,#ff8a6a,#d8402a);color:#2a0702;box-shadow:0 5px 0 #6a1a0a}
#da_root .da-red[disabled]{opacity:.45;box-shadow:none}
#da_root .da-in{width:100%;height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#0e0a07;color:#f6ecdf;font-size:18px;font-weight:900;text-align:center;letter-spacing:2px;box-sizing:border-box}`; document.head.appendChild(st); }
function draw(){ if(!U.el) return; const T=DATA.t, local=DATA.localSave==='keep'?T.keep:T.erase; let body='';
  if(U.step==='info') body=`<span style="font-size:14px;font-weight:800;line-height:1.4">${dEsc(T.main)}</span>
    <span style="font-size:13px;font-weight:800;line-height:1.4;color:#c9b9a2">${dEsc(T.all)}</span>
    <span style="font-size:13px;font-weight:900;line-height:1.4;color:#ffb38a">${dEsc(local)}</span>
    <a href="${dEsc(DATA.page)}" target="_blank" rel="noopener" style="font-size:13px;font-weight:900;color:#8cc8ff;overflow-wrap:anywhere">${dEsc(T.link)}</a>
    <button class="da-btn da-red" data-da="next">Continuar</button><button class="da-btn da-off" data-da="close">Cancelar</button>`;
  else if(U.step==='confirm'){ const ok=U.typed.trim().toUpperCase()===DATA.word;
    body=`<span style="font-size:14px;font-weight:900;line-height:1.4;color:#ffb38a">${dEsc(local)}</span>
    <label for="da_in" style="font-size:13px;font-weight:800">${dEsc(T.type)}</label>
    <input id="da_in" class="da-in" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" value="${dEsc(U.typed)}" aria-label="Digite EXCLUIR para confirmar">
    <button class="da-btn da-red" data-da="go" ${ok&&!U.busy?'':'disabled'}>${U.busy?'Enviando...':'Excluir minha conta'}</button><button class="da-btn da-off" data-da="close" ${U.busy?'disabled':''}>Cancelar</button>`; }
  else body=`<span style="font-size:14px;font-weight:900;line-height:1.4;color:${U.err?'#ff8a7a':'#f6ecdf'}">${dEsc(U.msg)}</span>${U.link?`<a href="${dEsc(DATA.page)}" target="_blank" rel="noopener" style="font-size:13px;font-weight:900;color:#8cc8ff;overflow-wrap:anywhere">${dEsc(T.link)}</a>`:''}<button class="da-btn da-off" data-da="close">Fechar</button>`;
  U.el.innerHTML=`<div class="da-box" role="dialog" aria-modal="true" aria-labelledby="da_t"><span id="da_t" class="lil" style="font-size:21px;color:#ff8a6a;text-align:center">${dEsc(T.title)}</span>${body}</div>`;
  const inp=U.el.querySelector&&U.el.querySelector('#da_in'); if(inp&&inp.addEventListener){ inp.addEventListener('input',()=>{ const pos=inp.selectionStart; U.typed=inp.value; draw(); const n=U.el.querySelector('#da_in'); if(n&&n.focus){ n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} } }); } }
function close(){ if(U.busy) return; if(U.el&&U.el.parentNode) U.el.parentNode.removeChild(U.el); U.el=null; U.step='info'; U.typed=''; U.msg=''; U.err=false; }
function show(msg,err,link){ U.step='msg'; U.msg=msg; U.err=!!err; U.link=!!link; U.busy=false; draw(); }
const dDate=ms=>{ try{ return new Date(ms).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){ return ''; } };
function send(){ if(U.busy) return; if(!online()){ show(DATA.t.offline,true); return; } U.busy=true; draw();
  let done=false; const timer=setTimeout(()=>{ if(!done){ done=true; show(DATA.t.fail,true); } },DATA.timeoutMs);
  let p; try{ p=Promise.resolve(window.Sys.net.deleteAccount()); }catch(e){ p=Promise.reject(e); }
  p.then(r=>{ if(done) return; done=true; clearTimeout(timer); U.busy=false; const until=r&&+r.until>0?+r.until:0, msg=until?DATA.t.sentAt.replace('%D',dDate(until)):DATA.t.sent;
      show(msg,false); const OB=window.OnlineBoot; if(OB&&typeof OB.accountDeleted==='function'){
        /* o OnlineBoot limpa o aparelho e recarrega; se a limpeza falhar ({ok:false}), o jogador precisa saber que a conta já foi excluída */
        let res=null; try{ res=OB.accountDeleted({localSave:DATA.localSave,until}); }catch(e){ res={ok:false,reason:'error'}; }
        Promise.resolve(res).then(x=>{ if(x&&x.ok===false&&x.reason!=='owner') show(msg+' '+DATA.t.cleanFail,true); },()=>show(msg+' '+DATA.t.cleanFail,true)); } },
    e=>{ if(done) return; done=true; clearTimeout(timer); const c=e&&e.code;
      if(c==='offline'||c==='timeout') show(DATA.t.noNet,true); else if(c==='no_session') show(DATA.t.noSession,true,true); else show(DATA.t.fail,true); }); }
function onClick(ev){ const b=ev.target&&ev.target.closest?ev.target.closest('[data-da]'):null; if(!b) return; const a=b.getAttribute?b.getAttribute('data-da'):(b.dataset||{}).da;
  if(b.disabled) return; dSnd('ui_tap');
  if(a==='close') close(); else if(a==='next'){ if(!online()){ show(DATA.t.offline,true); return; } U.step='confirm'; draw(); } else if(a==='go'){ if(U.typed.trim().toUpperCase()===DATA.word) send(); } }
function open(){ if(owner()) return false; css(); close(); U.el=document.createElement('div'); U.el.id='da_root'; U.el.addEventListener('click',onClick); document.body.appendChild(U.el);
  const N=window.Sys&&window.Sys.net, noSess=!!N&&dTry(()=>typeof N.hasSession==='function'&&!N.hasSession(),false);
  if(noSess||!N){ show(DATA.t.noSession,true,true); return true; }
  if(!online()){ show(DATA.t.offline,true); return true; } U.step='info'; draw(); return true; }
const _act=(a,typed)=>{ if(typed!=null){ U.typed=typed; draw(); } onClick({target:{closest:()=>({getAttribute:()=>a,disabled:false})}}); };   // só para testes
window.DeleteAccount={open,close,DATA,_state:U,_act};
})();
