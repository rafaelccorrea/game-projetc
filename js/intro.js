'use strict';
/* ================= TELA 03 INTRO (canvas aprovado): 3 cartões → escolha do herói (Kael / Kaia) → nome do jogador =================
   Só para JOGADOR NOVO, antes das boas-vindas e do tutorial. Grava S.hero ('kael') e S.name; o HUD mostra o nome.
   A Kaia aparece como SILHUETA e ainda não pode ser escolhida (a arte dela não foi aprovada): tocar nela só avisa.
   Save antigo sem nome: vira "Kael" na carga (sysMigrate, js/farm.js) e a intro não aparece.
   Base de 390 px de largura (medidas do protótipo), escalada para a largura real; depende de index.html (S, save, snd, hud). */
const INTRO={step:0,hero:'',nick:'',sugs:null,done:null,el:null};
const KAIA_ON=false;   // chave: true quando a arte da Kaia for aprovada (aí ela pode ser escolhida)
const INTRO_CARDS=[
  {k:'ERA 0 · PRÉ-HISTÓRIA', h:'Tudo começa com um osso e coragem.', b:'Kael acorda sem nada. Lute, junte moedas e deixe seus itens mais fortes: tudo automático, até offline.'},
  {k:'ATRAVESSE AS ERAS', h:'Derrote o chefe e abra o portal.', b:'Cada era traz uma arma nova com 3 ataques: o básico, o especial e uma Ultimate de arrasar.'},
  {k:'ERA 6 · FUTURISTA', h:'Até o fim do tempo.', b:'Lá no fim espera o Devorador Cósmico. Sua força vem da jornada: itens, nível e conquistas.'},
];
const INTRO_POOL=['MataGoblin','CachecolRubro','ViajanteDoTempo','OssoDeFerro','EraDeOuro','LendaDasEras','Andarilho'];
const KAIA_SVG='<svg width="120" height="144" viewBox="0 0 100 120" aria-hidden="true"><path d="M50 8c9 0 15 7 15 16s-6 17-15 17-15-8-15-17 6-16 15-16z" fill="#0d0a08"></path><path d="M38 20c4-10 20-12 26-2 3 6 4 14 10 20-8 0-14-4-17-9-2 6-10 9-19 9 3-5 0-12 0-18z" fill="#0d0a08"></path><path d="M33 44h34l6 34H27z" fill="#0d0a08"></path><path d="M34 42c10 6 22 6 32 0l2 7c-12 7-24 7-36 0z" fill="#b8231c"></path><path d="M62 46l12 16-6 3-10-14z" fill="#b8231c"></path><path d="M30 50l-10 26 6 2 10-22zM70 50l10 26-6 2-10-22z" fill="#0d0a08"></path><path d="M36 78h11l-2 36h-9zM53 78h11l1 36h-9z" fill="#0d0a08"></path></svg>';
(function(){ const st=document.createElement('style'); st.textContent=`
#intro{position:absolute;inset:0;z-index:92;background:#16110d;overflow:hidden;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf}
#intro .iw{position:absolute;left:0;top:0;width:390px;transform-origin:0 0;overflow:hidden;background:#16110d}
#intro button{font-family:Nunito,system-ui,sans-serif;cursor:pointer}
#intro .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
#intro .sc{position:absolute;inset:0;overflow:hidden}
#intro .sc .ly{position:absolute;left:0;right:0;background-repeat:repeat-x;background-position:0 0}
#intro .sc0{background:#9cc9c0}#intro .sc2{background:#8fc6dc}
#intro .sc0 .fl{position:absolute;left:0;right:0;top:312px;height:52px;background:#5b8377}#intro .sc2 .fl{position:absolute;left:0;right:0;top:312px;height:52px;background:#6b93a6}
#intro .sc0 .sky{background-image:url(assets/bg/v2/era0/sky.webp)}#intro .sc0 .far{background-image:url(assets/bg/v2/era0/far.webp)}#intro .sc0 .mid{background-image:url(assets/bg/v2/era0/midA.webp)}#intro .sc0 .ground{background-image:url(assets/bg/v2/era0/ground.webp)}
#intro .sc2 .sky{background-image:url(assets/bg/v2/era2/sky.webp)}#intro .sc2 .far{background-image:url(assets/bg/v2/era2/far.webp)}#intro .sc2 .mid{background-image:url(assets/bg/v2/era2/midA.webp)}#intro .sc2 .ground{background-image:url(assets/bg/v2/era2/ground.webp)}
#intro .sky{top:0;height:312px;background-size:auto 312px;animation:isky 253s linear infinite}
#intro .far{top:114px;height:218px;background-size:auto 218px;animation:ifar 85s linear infinite}
#intro .mid{top:91px;height:260px;background-size:auto 260px;animation:imid 13s linear infinite}
#intro .ground{top:341px;height:198px;background-size:auto 198px;animation:ignd 5s linear infinite}
@keyframes isky{to{background-position:-724px 0}}@keyframes ifar{to{background-position:-855px 0}}@keyframes imid{to{background-position:-683px 0}}@keyframes ignd{to{background-position:-704px 0}}
#intro .cl{position:absolute;background-size:contain;background-repeat:no-repeat;background-position:center;animation:icl linear infinite}
#intro .sc0 .cl{background-image:url(assets/bg/v2/era0/cloud1.webp)}#intro .sc2 .cl{background-image:url(assets/bg/v2/era2/cloud1.webp)}
@keyframes icl{from{transform:translateX(0)}to{transform:translateX(-560px)}}
#intro .card{animation:icin .5s cubic-bezier(.2,.9,.3,1.2) both}
@keyframes icin{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
#intro .krun{background-image:url(assets/anim/hyb/kael_run_body.png);background-size:800% 100%;background-repeat:no-repeat;animation:ikrn .667s steps(8,jump-none) infinite}
@keyframes ikrn{from{background-position:0 0}to{background-position:100% 0}}
#intro .shad{position:absolute;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.5) 0%,rgba(0,0,0,.3) 55%,rgba(0,0,0,0) 72%)}
#intro .boss{animation:iloom 3s ease-in-out infinite;transform-origin:50% 95%}
@keyframes iloom{0%,100%{transform:scale(1);filter:drop-shadow(0 0 10px rgba(180,80,255,.6))}50%{transform:scale(1.05);filter:drop-shadow(0 0 26px rgba(180,80,255,.95))}}
#intro .portal{animation:ispin 6s linear infinite}
@keyframes ispin{to{transform:rotate(360deg)}}
#intro .shake{animation:ishake .35s}
@keyframes ishake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
#intro .hcard{transition:transform .15s}#intro .hcard:active{transform:scale(.97)}
#intro .hsel{animation:ihsel 1.4s ease-in-out infinite}
@keyframes ihsel{0%,100%{box-shadow:0 0 10px rgba(255,201,74,.45),inset 0 0 14px rgba(255,201,74,.18)}50%{box-shadow:0 0 30px rgba(255,201,74,1),inset 0 0 24px rgba(255,201,74,.35)}}
#intro .sil{transform-origin:50% 100%;animation:isilb 2.4s ease-in-out infinite}
@keyframes isilb{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.025)}}
#intro .wip{animation:iwip 2s ease-in-out infinite}
@keyframes iwip{0%,100%{opacity:.8}50%{opacity:1}}
#intro .cta{animation:ipulse 1.6s ease-in-out infinite}
@keyframes ipulse{50%{transform:scale(1.04)}}
#intro input{user-select:text;-webkit-user-select:text}
#intro input:focus{outline:3px solid #ffc94a;outline-offset:2px}
#intro .itoast{position:absolute;left:0;right:0;top:500px;display:flex;justify-content:center;pointer-events:none;animation:xtoastIn 2s ease both}
`; document.head.appendChild(st); })();

function introCheck(n){ if(n.length<3) return {ok:false,msg:'Mínimo de 3 caracteres.'}; if(!/^[A-Za-z0-9_À-ú]+$/.test(n)) return {ok:false,msg:'Use só letras, números e _.'}; return {ok:true,msg:'Nome disponível!'}; }
function introDims(){ const app=document.getElementById('app'), W=app.clientWidth||390, Hp=app.clientHeight||844, s=Math.min(W/390,Hp/700); return {s,H:Hp/s,ox:(W-390*s)/2}; }
function introRender(){
  const I=INTRO, d=introDims(), el=I.el; let h='';
  if(I.step<3){ const c=INTRO_CARDS[I.step], dot=i=>`<span style="width:${I.step===i?28:10}px;height:10px;border-radius:5px;background:${I.step===i?'#ffc94a':'#4a3a2b'}"></span>`;
    const scene=e=>`<div class="sc sc${e}"><div class="ly sky"></div><div class="cl" style="left:400px;top:40px;width:150px;height:60px;animation-duration:70s;animation-delay:-20s"></div><div class="cl" style="left:400px;top:96px;width:110px;height:44px;animation-duration:95s;animation-delay:-62s;opacity:.85"></div><div class="fl"></div><div class="ly far"></div><div class="ly mid"></div><div class="ly ground"></div></div>`;
    h=`<div style="position:absolute;inset:0"><div style="position:absolute;left:0;right:0;top:0;height:520px;overflow:hidden">
        ${I.step===0?scene(0):I.step===1?scene(2):'<div style="position:absolute;inset:0;background:#0b0b2e url(assets/bg/era6.png) center/cover no-repeat"></div>'}
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(22,17,13,.2) 0%,rgba(22,17,13,0) 50%,#16110d 100%)"></div>
        ${I.step===0?'<div class="shad" style="left:140px;top:398px;width:110px;height:16px"></div><div class="krun" role="img" aria-label="Kael correndo na Pré-História" style="position:absolute;left:95px;top:216px;width:200px;height:200px"></div>'
          :I.step===1?'<div class="shad" style="left:140px;top:398px;width:110px;height:16px"></div><div style="position:absolute;left:95px;top:216px;width:200px;height:200px"><div class="portal" style="position:absolute;inset:-20px;border-radius:50%;border:6px dashed rgba(111,211,255,.7);box-shadow:0 0 30px rgba(111,211,255,.6),inset 0 0 30px rgba(111,211,255,.4)"></div><div class="krun" role="img" aria-label="Kael correndo na Era Medieval" style="position:absolute;left:0;top:0;width:200px;height:200px"></div></div>'
          :'<img class="boss" src="assets/enemies/era6_boss.png" alt="Devorador Cósmico" style="position:absolute;left:160px;top:130px;width:230px;height:230px;object-fit:contain"><div style="position:absolute;left:30px;top:341px;width:130px;height:22px;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#4a5a78 0%,#263048 60%,#121826 100%);border:2px solid #6fd3ff;box-shadow:0 0 16px rgba(111,211,255,.55)"></div><div style="position:absolute;left:30px;top:361px;width:130px;height:10px;border-radius:0 0 50% 50%;background:#121826"></div><div class="shad" style="left:50px;top:342px;width:90px;height:12px"></div><div class="kidle" role="img" aria-label="Kael" style="position:absolute;left:10px;top:187px;width:170px;height:170px"></div>'}
      </div>
      <button data-i="skip" style="position:absolute;top:20px;right:16px;height:44px;padding:0 16px;border-radius:14px;border:2px solid #4a3a2b;background:rgba(29,22,17,.85);color:#f6ecdf;font-weight:800;font-size:14px">Pular</button>
      <div class="card" style="position:absolute;left:24px;right:24px;top:${Math.min(520,d.H-300)}px;display:flex;flex-direction:column;gap:10px">
        <span style="font-size:13px;font-weight:900;color:#ffc94a;letter-spacing:1px">${c.k}</span>
        <h1 class="lil" style="margin:0;font-size:30px;line-height:1.1">${c.h}</h1>
        <p style="margin:0;font-size:15px;font-weight:700;color:#e8dccb;line-height:1.45">${c.b}</p></div>
      <div style="position:absolute;left:24px;right:24px;bottom:34px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;gap:8px">${dot(0)}${dot(1)}${dot(2)}</div>
        <button data-i="next" class="lil" style="height:56px;padding:0 28px;border-radius:16px;border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);box-shadow:0 5px 0 #8a4f0c;color:#2a1403;font-size:20px">${I.step===2?'Vamos!':'Próximo'}</button></div></div>`;
  } else if(I.step===3){ const on=I.hero==='kael', ch=Math.max(300,Math.min(430,d.H-56-34-14*3-36-40-62)), dy=ch-430;
    const base=bd=>`<span class="shad" style="left:52px;right:52px;top:${304+dy}px;height:12px;z-index:1"></span><span style="position:absolute;left:22px;right:22px;top:${300+dy}px;height:26px;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#6b5236 0%,#3a2c1f 60%,#1d1611 100%);border:2px solid ${bd}"></span>`;
    h=`<div class="card" style="position:absolute;inset:0;display:flex;flex-direction:column;padding:56px 16px 34px;box-sizing:border-box;gap:14px;background:radial-gradient(circle at 50% 35%,#3a2c1f 0%,#16110d 70%)">
      <h1 class="lil" style="margin:0;font-size:30px;text-align:center">Escolha seu herói</h1>
      <p style="margin:0;font-size:14px;font-weight:700;color:#c9b9a2;text-align:center">Os dois usam o cachecol vermelho. A força vem da jornada, não do herói.</p>
      <div role="group" aria-label="Heróis" style="display:flex;gap:12px">
        <button class="hcard ${on?'hsel':''}" data-i="kael" aria-pressed="${on}" aria-label="KAEL" style="position:relative;flex:1;min-width:0;height:${ch}px;border-radius:22px;border:3px solid ${on?'#ffc94a':'#4a3a2b'};background:radial-gradient(circle at 50% 42%,${on?'rgba(255,201,74,.38)':'#33271d'} 0%,#1d1611 70%);color:#f6ecdf;padding:0;overflow:hidden;display:block">
          ${base(on?'#ffc94a':'#4a3a2b')}<span class="kidle" aria-hidden="true" style="position:absolute;left:50%;top:${150+dy}px;width:168px;height:168px;margin-left:-84px"></span>
          <span style="position:absolute;left:0;right:0;top:${344+dy}px;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="lil" style="font-size:30px;letter-spacing:1px">KAEL</span><span style="font-size:13px;font-weight:800;color:#c9b9a2">O viajante do tempo</span></span>
          ${on?'<span style="position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:50%;background:#ffc94a;color:#2a1403;display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg></span>':''}</button>
        <button class="hcard" data-i="kaia" aria-pressed="false" aria-label="KAIA, em breve" style="position:relative;flex:1;min-width:0;height:${ch}px;border-radius:22px;border:3px solid #4a3a2b;background:radial-gradient(circle at 50% 42%,#33271d 0%,#1d1611 70%);color:#f6ecdf;padding:0;overflow:hidden;display:block">
          ${base('#4a3a2b')}<span class="sil" style="position:absolute;left:50%;top:${166+dy}px;width:120px;height:144px;margin-left:-60px;display:block;filter:drop-shadow(0 0 10px rgba(255,201,74,.25))">${KAIA_SVG}</span>
          <span class="wip" style="position:absolute;left:12px;top:12px;padding:4px 8px;border-radius:8px;background:rgba(14,10,7,.92);border:1px dashed #ffb3a8;color:#ffb3a8;font-size:11px;font-weight:900">em breve</span>
          <span style="position:absolute;left:0;right:0;top:${344+dy}px;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="lil" style="font-size:30px;letter-spacing:1px">KAIA</span><span style="font-size:13px;font-weight:800;color:#c9b9a2">A heroína do cachecol</span></span></button>
      </div><div id="i_toast"></div>
      <div style="flex:1"></div>
      ${I.hero?'<button class="cta lil" data-i="choose" style="width:100%;height:62px;border-radius:18px;border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);box-shadow:0 6px 0 #8a4f0c;color:#2a1403;font-size:24px">Escolher</button>'
        :'<div class="lil" style="display:flex;align-items:center;justify-content:center;width:100%;height:62px;border-radius:18px;background:#33271d;color:#9c8d7a;font-size:24px">Escolher</div>'}</div>`;
  } else { const chk=introCheck(I.nick); if(!I.sugs) I.sugs=['Lenda_'+(10+Math.floor(Math.random()*89))].concat(INTRO_POOL.slice().sort(()=>Math.random()-.5).slice(0,2));
    h=`<div class="card" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:${d.H<760?30:70}px 24px 34px;box-sizing:border-box;gap:14px;background:radial-gradient(circle at 50% 30%,#3a2c1f 0%,#16110d 70%)">
      <div style="position:relative;width:200px;height:200px;flex:none"><div style="position:absolute;left:30px;right:30px;bottom:6px;height:22px;border-radius:50%;background:rgba(255,201,74,.25);box-shadow:0 0 30px rgba(255,201,74,.5)"></div><div class="shad" style="left:55px;right:55px;top:179px;height:12px"></div>
        <div class="kidle" role="img" aria-label="Kael" style="position:absolute;left:0;top:-4px;width:200px;height:200px"></div></div>
      <h1 class="lil" style="margin:0;font-size:28px;text-align:center">Como vão te chamar, lenda?</h1>
      <p style="margin:0;font-size:14px;font-weight:700;color:#c9b9a2;text-align:center">Esse nome aparece no jogo e no ranking. O herói continua sendo o personagem escolhido.</p>
      <div style="width:100%;display:flex;flex-direction:column;gap:6px;margin-top:6px"><label for="i_nick" style="font-size:13px;font-weight:900">Nome do jogador</label>
        <div id="i_field" style="display:flex;gap:8px">
          <input id="i_nick" value="${I.nick.replace(/"/g,'&quot;')}" maxlength="14" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0;height:54px;border-radius:14px;border:2px solid ${chk.ok?'#5fd068':'#ff5a4e'};background:#0e0a07;color:#f6ecdf;font-family:Nunito,sans-serif;font-size:18px;font-weight:800;padding:0 14px;box-sizing:border-box">
          <button data-i="dice" aria-label="Sortear nome" style="width:54px;height:54px;flex:none;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#ffc94a;display:flex;align-items:center;justify-content:center;padding:0"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"></rect><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"></circle><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"></circle><circle cx="15.5" cy="8.5" r="1.3" fill="currentColor"></circle><circle cx="8.5" cy="15.5" r="1.3" fill="currentColor"></circle><circle cx="12" cy="12" r="1.3" fill="currentColor"></circle></svg></button></div>
        <span id="i_hint" style="font-size:12px;font-weight:800;color:${chk.ok?'#7ee27a':'#ff8a7a'}">${chk.msg}</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">${I.sugs.map(s=>`<button data-i="sug" data-n="${s}" style="height:40px;padding:0 14px;border-radius:999px;border:1px solid #4a3a2b;background:#241b14;color:#f6ecdf;font-weight:800;font-size:14px">${s}</button>`).join('')}</div>
      <div style="flex:1"></div><div id="i_go" style="width:100%"></div></div>`;
  }
  el.innerHTML=`<div class="iw" style="height:${d.H.toFixed(1)}px;transform:translateX(${d.ox.toFixed(1)}px) scale(${d.s.toFixed(4)})">${h}</div>`;
  if(I.step>=4) introGo();
}
function introGo(){ const chk=introCheck(INTRO.nick), g=document.getElementById('i_go'), inp=document.getElementById('i_nick'), hint=document.getElementById('i_hint'); if(!g) return;
  if(inp) inp.style.borderColor=chk.ok?'#5fd068':'#ff5a4e'; if(hint){ hint.textContent=chk.msg; hint.style.color=chk.ok?'#7ee27a':'#ff8a7a'; }
  g.innerHTML=chk.ok?'<button class="cta lil" data-i="go" style="display:flex;align-items:center;justify-content:center;width:100%;height:62px;border-radius:18px;border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);box-shadow:0 6px 0 #8a4f0c;color:#2a1403;font-size:24px">Começar a aventura</button>'
    :'<div class="lil" style="display:flex;align-items:center;justify-content:center;width:100%;height:62px;border-radius:18px;background:#33271d;color:#9c8d7a;font-size:24px">Começar a aventura</div>'; }
function introClick(ev){ const b=ev.target.closest('[data-i]'); if(!b) return; const a=b.dataset.i, I=INTRO;
  if(a==='next'){ snd('ui_tap'); I.step++; introRender(); }
  else if(a==='skip'){ snd('ui_tap'); I.step=3; introRender(); }
  else if(a==='kael'){ snd('claim'); I.hero='kael'; introRender(); }
  else if(a==='kaia'){ snd('ui_tap'); if(KAIA_ON){ I.hero='kaia'; introRender(); } else { const t=document.getElementById('i_toast'); if(t) t.innerHTML='<div class="itoast"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ffb3a8;font-size:14px;font-weight:900">Kaia chega em breve</span></div>'; } }
  else if(a==='choose'){ if(!I.hero) return; snd('ui_tap'); I.step=4; if(!I.nick) I.nick='Lenda_'+(10+Math.floor(Math.random()*89)); introRender(); }
  else if(a==='dice'){ snd('ui_tap'); I.sugs=null; I.nick=INTRO_POOL[Math.floor(Math.random()*INTRO_POOL.length)]; introRender(); }
  else if(a==='sug'){ snd('ui_tap'); I.nick=b.dataset.n; introRender(); }
  else if(a==='go'){ const chk=introCheck(I.nick); if(!chk.ok){ const f=document.getElementById('i_field'); if(f){ f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); } return; }
    snd('claim'); S.hero=I.hero||'kael'; S.name=I.nick; save(); hud(); const el=I.el, done=I.done; I.el=null; I.done=null; el.style.transition='opacity .35s'; el.style.opacity='0'; setTimeout(()=>{ el.remove(); if(done) done(); },360); }
}
/* jogador novo = ainda sem nome no save */
const introNeeded = () => !S.name;
function showIntro(done){ if(INTRO.el) return; const el=document.createElement('div'); el.id='intro'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Introdução');
  document.getElementById('app').appendChild(el); Object.assign(INTRO,{step:0,hero:'',nick:'',sugs:null,done,el});
  el.addEventListener('click',introClick); el.addEventListener('input',ev=>{ if(ev.target&&ev.target.id==='i_nick'){ INTRO.nick=(ev.target.value||'').slice(0,14); introGo(); } });
  introRender(); }
addEventListener('resize',()=>{ if(INTRO.el&&INTRO.step<4) introRender(); });
