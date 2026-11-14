'use strict';
/* ================= ÍCONE DE HABILIDADE COM RECARGA NA BATALHA: INVESTIDA MONTADA (docs/LOM_VS_EONBOUND.md, item B7) — arquivo novo, escopo próprio =================
   ATRÁS DE CHAVE DESLIGADA: SYS_LIVE.skillIcons (js/farm.js) nasce false. Desligada: mount() devolve false e NADA entra no DOM.
   Para conferir: ?debug=1&com=mountCharge,skillIcons (o ícone só tem o que mostrar com a Investida ligada e o herói montado).
   O QUE JÁ EXISTIA e NÃO foi refeito: o Especial (#fb_s2b) e a Ultimate (#fb_s3b) do js/fullbattle.js já mostram recarga e energia; as 3 magias do Grimório têm
   a coluna com anel do js/grimhud.js. Faltava só a habilidade nova: a Investida.
   NENHUMA regra nem número aqui: o relógio é o do js/mountcharge.js (MountCharge.info() → {show, cd, left, running}). A Investida dispara SOZINHA: o ícone é só
   leitura (não é botão, não recebe toque e não cobre toque de ninguém: pointer-events none).
   ONDE FICA (base 390x844 do #fb_w): um círculo de 40 px à esquerda do "Básico" e acima do Especial (x 218 a 258, 184 px acima do fundo), com o rótulo
   "Investida" embaixo. Ancorado no fundo como os vizinhos. Para mudar: SkillIcons.POS. A posição NÃO foi vista na tela: conferir contra a Fogueira, a fila
   x1/x2/x4 e a fila deitada do Grimório em tela baixa.
   Sem imagem: o desenho (ferradura com traços de corrida) é feito no código. Sem animação contínua: o anel é um conic-gradient trocado em passos de 2%.
   API (window.SkillIcons): on() · setOn(v) · mount(host?) (host padrão: #fb_w) · update() (chamar no fbTick) · unmount() · peek() · POS · state. */
(function(){
const KEY='skillIcons';
const POS={right:132,up:184,size:40};   /* base 390x844: distância da borda direita, distância do fundo até o topo do círculo, lado do círculo */
const ST={root:null,css:false,k:'',shown:false,slot:null,ring:null,txt:null};
let ON=null;
function on(){ if(ON!==null) return ON; let v=false, known=false;
  try{ if(typeof SYS_LIVE!=='undefined'&&SYS_LIVE){ known=true; v=SYS_LIVE[KEY]===true; } }catch(e){}
  try{ if(typeof DEBUG!=='undefined'&&DEBUG&&typeof location!=='undefined'){ const q=String(location.search||''), c=/[?&]com=([\w,]+)/.exec(q), s=/[?&]sem=([\w,]+)/.exec(q);
      if(known&&SYS_LIVE[KEY]===false&&c&&c[1].split(',').indexOf(KEY)>=0) v=true;   /* só liga por "com" o que está na tabela com false (regra do sysLive) */
      if(s&&s[1].split(',').indexOf(KEY)>=0) v=false; } }catch(e){}
  if(known) ON=v; return v; }
function setOn(v){ ON=v==null?null:!!v; return ON; }   /* teste e console; null = ler a chave de novo */
const ICON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 19.5V11a5.3 5.3 0 0 1 10.6 0v8.5h-3V11a2.3 2.3 0 0 0-4.6 0v8.5z" fill="#ffd27a" stroke="#2a1403" stroke-width="1.3" stroke-linejoin="round"/><path d="M2 9h4M1 13h4M2.5 17h3" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>';
const CSS=`#ski_root{position:absolute;z-index:5;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:1px;font-family:Nunito,system-ui,sans-serif}
.ski-s{position:relative;border-radius:50%;background:#1d1611;border:2px solid #6b5a48;box-shadow:0 2px 0 rgba(0,0,0,.45);box-sizing:border-box;overflow:hidden}
.ski-s .ski-i{position:absolute;left:0;top:0;right:0;bottom:0;display:grid;place-items:center}
.ski-s .ski-i svg{width:74%;height:74%;display:block}
.ski-s .ski-c{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%}
.ski-s .ski-t{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font:900 14px/1 Nunito,system-ui,sans-serif;color:#fff;text-shadow:0 1px 0 #000,0 0 4px #000}
.ski-s.rdy{border-color:#ffc94a;box-shadow:0 0 10px rgba(255,201,74,.85),0 2px 0 rgba(0,0,0,.45)}
.ski-lb{font-size:10.5px;line-height:12px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000,0 0 5px #000;white-space:nowrap}`;
function inject(){ if(ST.css) return; try{ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.id='ski_css'; el.textContent=CSS; document.head.appendChild(el); ST.css=true; }catch(e){} }
function info(){ try{ const M=(typeof window!=='undefined'?window:globalThis).MountCharge; const i=M&&typeof M.info==='function'?M.info():null; return i&&i.show===true?i:null; }catch(e){ return null; } }
/* liga o ícone ao painel da batalha. Chave desligada: false e nada no DOM (o fbTick tenta de novo a cada batida, sem custo) */
function mount(hostEl){ if(!on()) return false; if(ST.root) return true;
  try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='ski_root'; r.style.right=POS.right+'px'; r.style.top='calc(100% - '+POS.up+'px)'; r.style.display='none';
    r.innerHTML='<div class="ski-s" role="img" style="width:'+POS.size+'px;height:'+POS.size+'px"><span class="ski-i">'+ICON+'</span><span class="ski-c"></span><span class="ski-t"></span></div><span class="ski-lb">Investida</span>';
    h.appendChild(r); ST.root=r; ST.k=''; ST.shown=false; const s=r.children&&r.children[0]; ST.slot=s||null; ST.ring=s&&s.children?s.children[1]:null; ST.txt=s&&s.children?s.children[2]:null; update(); return true; }catch(e){ return false; } }
function unmount(){ const r=ST.root; ST.root=null; ST.slot=ST.ring=ST.txt=null; ST.k=''; ST.shown=false; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
/* chamar no fbTick. Devolve true com o ícone na tela. Só mexe no DOM quando o segundo ou o passo do anel muda */
function update(){ const r=ST.root; if(!r) return false; const i=info();
  if(!i){ if(ST.shown||ST.k!=='off'){ ST.shown=false; ST.k='off'; try{ r.style.display='none'; }catch(e){} } return false; }
  const left=i.running?0:Math.max(0,+i.left||0), cd=Math.max(0.001,+i.cd||0), sec=Math.ceil(left), pc=Math.round(Math.min(1,left/cd)*50)*2, k=(i.running?'r':'')+sec+'|'+pc;
  if(!ST.shown){ ST.shown=true; try{ r.style.display=''; }catch(e){} }
  if(k===ST.k) return true; ST.k=k;
  try{ if(ST.ring&&ST.ring.style) ST.ring.style.background=left>0?'conic-gradient(rgba(0,0,0,.72) '+pc+'%,rgba(0,0,0,0) '+pc+'%)':'none';
    if(ST.txt) ST.txt.textContent=left>0?String(sec):'';
    if(ST.slot){ ST.slot.className=left>0?'ski-s':'ski-s rdy'; if(typeof ST.slot.setAttribute==='function') ST.slot.setAttribute('aria-label','Investida montada'+(left>0?': recarga, faltam '+sec+' s':': pronta')+'. Dispara sozinha'); } }catch(e){}
  return true; }
function peek(){ return {mounted:!!ST.root,shown:ST.shown,k:ST.k}; }
(typeof window!=='undefined'?window:globalThis).SkillIcons={KEY:KEY,on:on,setOn:setOn,mount:mount,update:update,unmount:unmount,peek:peek,POS:POS,state:ST};
})();
