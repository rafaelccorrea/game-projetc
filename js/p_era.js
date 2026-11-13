'use strict';
/* ================= 17 TROCA DE ERA (abertura da nova era) — tela nova, nasce DESLIGADA (PANEL_ON.era) =================
   Protótipo: docs/proto/TrocaEra.dc.html. É um OVERLAY (def.overlay): não é uma "view"; abre por Panels.open('era', {from, to, boss, gems, essence, onDone}),
   quem chama é o fim da luta do Senhor da Era (pedido Q-2). NENHUMA regra de jogo aqui: nomes de era e inimigos (ERAS), 
   o que o jogador ganhou vem em `o` (gems/essence) — o que não vier não aparece (nada de número inventado).
   ROTEIRO (o do protótipo): a) o Senhor da Era antigo cai e o letreiro "Senhor da Era derrotado!" · b) portal e Kael correndo até ele · c) clarão e o cenário da nova era ·
   d) letreiro "NOVA ERA LIBERADA · ERA n · NOME" · e) cartões um de cada vez: novos inimigos (andando), itens novos que caem (arma e armadura da era; a ultimate é da arma, não da era)
   (só se a arma do jogador for de era anterior), recompensa (só se houver) · f) resumo e "Começar a era".
   Toque em qualquer lugar adianta para o próximo passo; "Pular" vai direto ao resumo. O jogo fica parado enquanto a tela está aberta (B.res), como as
   outras telas de resultado, e volta sozinho ao fechar. Folhas e imagens vêm de assets/ (sem blob): cenário assets/bg/era<n>.png (linha do chão em
   assets/bg/meta.json), Kael assets/anim/hyb/R/kael_run_body, chefe caindo era<n>_boss_die, inimigo andando era<n>_e0_run.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - o cenário é a imagem de fundo da era (assets/bg), não as camadas de parallax do kit (a Antiguidade/Medieval do protótipo eram só demonstração);
   - sem "Essência da Era: ícone provisório": a Essência só aparece quando o jogo informa quantas deu (o.essence), com texto próprio;
   - o cartão da arma só aparece se a arma EQUIPADA for de era anterior à nova (o protótipo afirmava isso sempre). */
const PE={el:null,step:'',steps:[],i:0,o:null,timer:0,meta:{},open:false,prevRes:null,prevRun:false,done:false};
const PE_MS={boss:1800,portal:1600,flash:900,title:2300,foe:2600,weap:2400,reward:2400};
const PE_CSS=`.pe-ov{position:absolute;inset:0;z-index:95;overflow:hidden;background:#16110d;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.pe-bg{position:absolute;inset:0;background-size:cover;background-position:50% 100%;transition:opacity .6s ease}
.pe-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,7,5,.55) 0%,rgba(10,7,5,.05) 30%,rgba(10,7,5,.05) 72%,rgba(10,7,5,.92) 100%);pointer-events:none}
.pe-sh{background-repeat:no-repeat;animation:pesh var(--d,.67s) steps(var(--n,8),jump-none) infinite}
.pe-sh1{background-repeat:no-repeat;animation:pesh var(--d,1s) steps(var(--n,8),jump-none) forwards}
@keyframes pesh{from{background-position:0 0}to{background-position:100% 0}}
.pe-lil{font-family:'Lilita One',system-ui,sans-serif;font-weight:400}
.pe-portal{position:absolute;border-radius:50%;animation:peop .9s cubic-bezier(.2,1.4,.4,1) both}
@keyframes peop{from{transform:scale(0,.2);opacity:0}to{transform:none;opacity:1}}
.pe-swirl{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#fff6c8,#ffc94a,#b07cff,#4aa3ff,#fff6c8,#ffc94a,#b07cff,#4aa3ff,#fff6c8);-webkit-mask:radial-gradient(ellipse,transparent 18%,#000 38%,#000 62%,transparent 72%);mask:radial-gradient(ellipse,transparent 18%,#000 38%,#000 62%,transparent 72%);animation:pespin 1.6s linear infinite}
.pe-core{position:absolute;inset:16%;border-radius:50%;background:radial-gradient(ellipse,#fff 0%,#fff1b8 30%,rgba(176,124,255,.7) 60%,rgba(74,163,255,0) 75%);animation:pecore 1.2s ease-in-out infinite}
@keyframes pecore{0%,100%{transform:scale(.92);opacity:.85}50%{transform:scale(1.06);opacity:1}}
@keyframes pespin{to{transform:rotate(360deg)}}
.pe-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff3c4;box-shadow:0 0 10px 3px rgba(255,201,74,.9);animation:petw 1.4s ease-in-out infinite}
@keyframes petw{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1.2);opacity:1}}
.pe-flash{position:absolute;inset:0;z-index:8;background:radial-gradient(circle at 75% 65%,#fff 0%,#fff4c8 45%,rgba(255,233,168,.9) 100%);animation:pefl .9s ease-out both;pointer-events:none}
@keyframes pefl{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
.pe-banner{animation:peba .5s cubic-bezier(.2,1.4,.4,1) both}
@keyframes peba{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.pe-title{animation:peti .8s cubic-bezier(.2,1.5,.4,1) both,pegl 2s .8s ease-in-out infinite}
@keyframes peti{0%{transform:scale(2.4);opacity:0;letter-spacing:12px}100%{transform:none;opacity:1;letter-spacing:1px}}
@keyframes pegl{0%,100%{text-shadow:0 4px 0 #6a3a08,0 0 10px rgba(255,201,74,.5)}50%{text-shadow:0 4px 0 #6a3a08,0 0 30px rgba(255,201,74,1),0 0 60px rgba(255,140,40,.7)}}
.pe-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.35) 0deg 8deg,transparent 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%);animation:pespin 14s linear infinite}
.pe-card{animation:peca .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes peca{0%{transform:translateX(60px) scale(.9);opacity:0}100%{transform:none;opacity:1}}
.pe-row{animation:pero .4s ease-out both}
@keyframes pero{from{transform:translateX(-30px);opacity:0}to{transform:none;opacity:1}}
.pe-walk{animation:pewk 4s linear infinite}
@keyframes pewk{from{transform:translateX(150px)}to{transform:translateX(-150px)}}
.pe-toportal{animation:pept 1.5s ease-in both}
@keyframes pept{0%{transform:translateX(-200px)}85%{transform:translateX(var(--tx,190px));opacity:1}100%{transform:translateX(calc(var(--tx,190px) + 20px)) scale(.6);opacity:0}}
.pe-runin{animation:peri .7s ease-out both}
@keyframes peri{from{transform:translateX(-160px)}to{transform:none}}
.pe-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 6px 0 #8a4f0c;border:0}
.pe-gold:active{transform:scale(.97)}
.pe-pulse{animation:pepu 1.4s ease-in-out infinite}
@keyframes pepu{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 28px rgba(255,201,74,.95)}}
.pe-ultr{animation:peuy var(--dy,4.1s) steps(var(--rows,7),jump-end) infinite}
@keyframes peuy{from{transform:translateY(0)}to{transform:translateY(-100%)}}
.pe-ultc{background-size:100% 100%;background-repeat:no-repeat;animation:peux var(--dx,.67s) steps(var(--cols,8),jump-end) infinite}
@keyframes peux{from{transform:translateX(0)}to{transform:translateX(-100%)}}
.pe-gem{animation:pegp 1.2s ease-in-out infinite}
@keyframes pegp{0%,100%{transform:scale(1) rotate(-6deg)}50%{transform:scale(1.18) rotate(6deg)}}
@media (prefers-reduced-motion:reduce){.pe-sh,.pe-sh1,.pe-swirl,.pe-core,.pe-spark,.pe-title,.pe-rays,.pe-walk,.pe-ultr,.pe-ultc,.pe-gem,.pe-pulse{animation:none}}`;

const peEra=n=>(typeof ERAS!=='undefined'&&ERAS[n])?ERAS[n]:null;
const peEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function peInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pe_css')) return; const st=document.createElement('style'); st.id='pe_css'; st.textContent=PE_CSS; document.head.appendChild(st); }
const peGround=n=>{ const m=PE.meta.bg&&PE.meta.bg['era'+n]; return m&&m.groundY>0?m.groundY:0.74; };
/* folha de animação: usa o .json ao lado do .png (frames, w, h, feetY); sem o json devolve null e a tela mostra a imagem parada */
function peSheet(base){ const k=PE.meta[base]; return k||null; }
function peLoad(urls){ if(typeof fetch!=='function') return Promise.resolve(); return Promise.all(urls.map(u=>fetch(u).then(r=>r.ok?r.json():null).then(j=>{ PE.meta[u]=j; }).catch(()=>{ PE.meta[u]=null; }))); }
/* onde está o json do andar do inimigo da era: a era 2 mora em assets/anim/, as outras em assets/anim/hyb/enemy/ */
const peRunBase=(n,k)=>n===2?`assets/anim/era2_${k}_run`:`assets/anim/hyb/enemy/era${n}_${k}_run`;
/* desenha uma folha com os pés numa linha: (base, caixa em px por altura do quadro, pé x do centro, y do chão) */
function peSprite(base,hPx,cx,gy,cls,extra){ const j=PE.meta[base+'.json']; if(!j||!j.frames||!j.w||!j.h) return '';
  const k=hPx/j.h, w=j.w*k, fy=(typeof j.feetY==='number'?j.feetY:j.h*0.94)*k, n=j.frames;
  /* TIRA OU GRADE (a Arte está convertendo: era0_boss_die já é 7 × 2 com 13 quadros): o tamanho e a animação saem do xSheetCss (js/screens.js) pelo "cols" do
     .json; a duração é a do --d passado em extra (ou quadros ÷ fps) e a classe pe-sh1 = toca uma vez. Sem o ajudante, a tira de antes. */
  const sm=(typeof xSheetNorm==='function'&&typeof xSheetCss==='function')?xSheetNorm(j):null, dm=/--d:\s*([0-9.]+)s/.exec(extra||''), sc=sm?xSheetCss(sm,{once:cls==='pe-sh1',dur:dm?+dm[1]:0}):null;
  return `<div class="${cls||'pe-sh'}" role="img" aria-hidden="true" style="position:absolute;left:${(cx-w/2).toFixed(1)}px;top:${(gy-fy).toFixed(1)}px;width:${w.toFixed(1)}px;height:${hPx.toFixed(1)}px;background-image:url(${base}.png);background-size:${sc?sc.size:n*100+'% 100%'};--n:${n};--d:${(n/(j.fps||12)).toFixed(3)}s;${extra||''}${sc?';animation:'+sc.anim:''}"></div>`; }
/* HERÓI: window.drawHeroFull(ctx, x(centro), y(PÉS), scale(multiplicador do HS da batalha), {t em segundos, walking}) desenha fase, montaria, asa, aura e pet (ordem do dono: nada some).
   Canvas transparente com folga (2,4x de largura e 1,9x de altura do quadro) para o herói montado não cortar; pés em 0,9 da altura; laço enquanto o overlay está aberto.
   Reserva: sem a função (ou se ela der erro) volta a folha do Kael correndo (peSprite). */
function peMounted(){ try{ return !!(window.Sys&&Sys.mount&&Sys.mount.ensure&&Sys.mount.ensure(S).eq); }catch(e){ return false; } }
function peHero(hPx,cx,gy,cls,extra){ if(typeof window.drawHeroFull!=='function'||PE.hfErr) return peSprite('assets/anim/hyb/R/kael_run_body',hPx,cx,gy,cls,extra);
  const w=hPx*2.4, h=hPx*1.9, fx=w*(peMounted()?0.42:0.45), fy=h*0.9, r=Math.min(2,(typeof devicePixelRatio==='number'&&devicePixelRatio)||1);
  return `<canvas data-pehf="${hPx.toFixed(1)}" data-fx="${fx.toFixed(1)}" data-fy="${fy.toFixed(1)}" width="${Math.round(w*r)}" height="${Math.round(h*r)}" role="img" aria-label="Kael" style="position:absolute;left:${(cx-fx).toFixed(1)}px;top:${(gy-fy).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;pointer-events:none"></canvas>`; }
function peLoop(ts){ PE.raf=0; if(!PE.open||!PE.el) return; const cs=PE.el.querySelectorAll?PE.el.querySelectorAll('canvas[data-pehf]'):[]; const hs=(typeof HS==='number'&&HS>0)?HS:155;
  for(const cv of cs){ try{ const c2=cv.getContext('2d'), r=cv.width/(parseFloat(cv.style.width)||cv.width||1), hp=parseFloat(cv.dataset.pehf)||176; c2.clearRect(0,0,cv.width,cv.height);
      window.drawHeroFull(c2,parseFloat(cv.dataset.fx)*r,parseFloat(cv.dataset.fy)*r,hp/hs*r,{t:(ts||0)/1000,walking:true}); }catch(e){ PE.hfErr=1; if(PE.open) peFrame(); return; } }
  if(cs.length&&typeof requestAnimationFrame==='function') PE.raf=requestAnimationFrame(peLoop); }
function peLoopStart(){ if(PE.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(PE.raf); PE.raf=0; if(typeof requestAnimationFrame==='function') PE.raf=requestAnimationFrame(peLoop); }
function peStatic(src,hPx,cx,gy){ const w=hPx; return `<img alt="" src="${src}" style="position:absolute;left:${(cx-w/2).toFixed(1)}px;top:${(gy-hPx).toFixed(1)}px;height:${hPx.toFixed(1)}px;width:auto;max-width:none">`; }

/* passos desta abertura: a lista depende do que o jogo informou e do que o jogador tem */
function peSteps(o){ const to=peEra(o.to), out=['boss','portal','flash','title'];
  out.push('foe'); out.push('weap'); if((o.gems|0)>0||(o.essence|0)>0) out.push('reward'); out.push('final'); return out; }
/* a ultimate é da ARMA equipada (ordem do dono): a era só muda cenário, inimigos e itens que caem */
function peOld(o){ try{ const w=(typeof heroLook==='function'?heroLook().weapon:null); return !!(w&&typeof w.e==='number'&&w.e<o.to); }catch(e){ return false; } }
/* eras 7-8 (js/eras9.js): o chefe tem nome próprio e é o Senhor da Era; sai da lista dos comuns e entra no fim da frase pelo nome */
const peOwn=n=>{ try{ return typeof era9Boss==='function'?era9Boss(n):null; }catch(e){ return null; } };
function peFoes(n){ const e=peEra(n), own=peOwn(n); return e&&e.en?e.en.map(x=>x.n).filter(x=>x!==own):[]; }
const peJoin=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];

function peFrame(){ const o=PE.o, W=PE.el.clientWidth||390, H=PE.el.clientHeight||844, u=W/390, sk=PE.step, f=o.from, t=o.to, ef=peEra(f), et=peEra(t);
  const gyA=peGround(f)*H, gyB=peGround(t)*H, onNew=['title','foe','weap','reward','final'].includes(sk)||sk==='flash';
  let stage='';
  const bossBase=`assets/anim/hyb/enemy/era${f}_boss_die`, bossLay=peSprite(bossBase,264*u,W*0.42,gyA,'pe-sh1','--d:1.083s');
  if(sk==='boss'){ stage+=`<div style="position:absolute;left:${(70*u).toFixed(0)}px;top:${(gyA-8*u).toFixed(0)}px;width:${(230*u).toFixed(0)}px;height:${(18*u).toFixed(0)}px;border-radius:50%;background:rgba(0,0,0,.45)"></div>`+(bossLay||peStatic(`assets/enemies/era${f}_boss.png`,200*u,W*0.42,gyA))
      +`<div class="pe-banner" style="position:absolute;left:0;right:0;top:${(150*u).toFixed(0)}px;display:flex;flex-direction:column;align-items:center;gap:6px"><span class="pe-lil" style="padding:8px 18px;border-radius:14px;background:rgba(120,20,12,.88);border:2px solid #ff8a7a;font-size:24px;color:#fff;text-shadow:0 2px 0 #3a0a06;text-align:center">Senhor da Era derrotado!</span><span style="font-size:14px;font-weight:900;text-shadow:0 2px 4px #000">${peEsc(o.boss||'')}${o.boss?' · ':''}${peEsc(ef?ef.n:'')}</span></div>`; }
  const runBase='assets/anim/hyb/R/kael_run_body';
  if(sk==='portal'){ const px=W*0.56; stage+=`<div class="pe-portal" aria-hidden="true" style="left:${px.toFixed(0)}px;top:${(gyA-244*u).toFixed(0)}px;width:${(160*u).toFixed(0)}px;height:${(250*u).toFixed(0)}px;box-shadow:0 0 60px 20px rgba(255,201,74,.55)"><div class="pe-swirl"></div><div class="pe-core"></div></div>`
      +[[236,440],[350,500],[250,620],[340,640]].map((p,i)=>`<span class="pe-spark" style="left:${(p[0]*u).toFixed(0)}px;top:${(gyA-(658-p[1])*u).toFixed(0)}px;animation-delay:${(i*.4).toFixed(1)}s"></span>`).join('')
      +`<div class="pe-toportal" style="--tx:${(W*0.5).toFixed(0)}px;position:absolute;left:0;top:0;width:100%;height:100%">${peHero(176*u,W*0.25,gyA,'pe-sh','--d:.667s')}</div>`; }
  if(sk==='flash') stage+='<div class="pe-flash"></div>'+peHero(176*u,W*0.3,gyB,'pe-sh','--d:.667s');
  if(onNew&&sk!=='flash'&&sk!=='final') stage+=`<div class="pe-runin" style="position:absolute;inset:0">${peHero(176*u,W*0.3,gyB,'pe-sh','--d:.667s')}</div>`;
  if(sk==='title') stage+=`<div style="position:absolute;left:0;right:0;top:${(70*u).toFixed(0)}px;height:${(150*u).toFixed(0)}px;display:flex;flex-direction:column;align-items:center;justify-content:center"><div class="pe-rays" aria-hidden="true" style="left:${(W/2-150*u).toFixed(0)}px;top:${(-75*u).toFixed(0)}px;width:${(300*u).toFixed(0)}px;height:${(300*u).toFixed(0)}px"></div><span style="position:relative;font-size:14px;font-weight:900;letter-spacing:3px;text-shadow:0 2px 4px #000">NOVA ERA LIBERADA</span><span class="pe-title pe-lil" style="position:relative;font-size:${Math.min(42,Math.max(26,W/(String(et?et.n:'').length+8)*1.35)).toFixed(0)}px;color:#ffc94a;white-space:nowrap">ERA ${t+1} · ${peEsc(et?et.n.toUpperCase():'')}</span></div>`;
  const card=(bd,glow,top,inner)=>`<div class="pe-card" role="group" style="position:absolute;left:${(20*u).toFixed(0)}px;right:${(20*u).toFixed(0)}px;top:${(top*u).toFixed(0)}px;padding:12px;border-radius:18px;background:rgba(29,22,17,.94);border:2px solid ${bd};${glow?`box-shadow:0 0 24px ${glow};`:''}box-sizing:border-box;display:flex;flex-direction:column;gap:8px">${inner}</div>`;
  if(sk==='foe'){ const names=peFoes(t), base=peRunBase(t,'e0'), sp=peSprite(base,106*u,0,106*u,'pe-sh','');
    stage+=card('#ff5a4e','',266,`<span class="pe-lil" style="font-size:20px;text-align:center">Novos inimigos</span><span style="font-size:13px;font-weight:800;color:#c9b9a2;text-align:center">${peEsc(peJoin(names))} e ${peOwn(t)?'o '+peEsc(peOwn(t)):'o Senhor da Era '+peEsc(et?et.n:'')}</span>
      <div style="position:relative;height:${(106*u).toFixed(0)}px;overflow:hidden;border-radius:12px;background:linear-gradient(180deg,#2a1f16 0%,#3a2c1f 78%,#5a4430 78%,#4a3826 100%)"><div class="pe-walk" style="position:absolute;left:50%;top:0;width:0;height:100%">${sp||peStatic(`assets/enemies/era${t}_e0.png`,106*u,0,106*u)}</div></div>`); }
  if(sk==='weap') stage+=card('#4aa3ff','',296,`<span class="pe-lil" style="font-size:19px;text-align:center">Novos itens caem aqui</span><div style="display:flex;gap:18px;justify-content:center"><img alt="Arma da era" src="assets/weapons/era${t}_t0.png" style="width:96px;height:96px;object-fit:contain" onerror="this.style.display='none'"><img alt="Armadura da era" src="assets/hero/era${t}_t0.png" style="width:96px;height:96px;object-fit:contain" onerror="this.style.display='none'"></div><span style="font-size:14px;font-weight:800;color:#e8dccb;text-align:center">Armas e armaduras da ${peEsc(et?et.n:'nova era')} passam a cair nos inimigos.${peOld(o)?' A sua arma atual é de uma era anterior.':''}</span>`);
  if(sk==='reward'){ const g=o.gems|0, es=o.essence|0; stage+=card('#ffc94a','rgba(255,201,74,.6)',286,`<span class="pe-lil" style="font-size:22px;color:#ffc94a;text-align:center">Recompensa</span><div style="display:flex;gap:24px;justify-content:center;flex-wrap:wrap">${g?`<span class="pe-lil" style="display:flex;align-items:center;gap:6px;font-size:22px"><img class="pe-gem" src="assets/ui/gem.png" alt="" style="width:34px;height:34px;object-fit:contain">+${g} gemas</span>`:''}${es?`<span class="pe-lil" style="display:flex;align-items:center;gap:6px;font-size:20px"><span class="pe-gem" aria-hidden="true" style="width:26px;height:26px;border-radius:50%;background:radial-gradient(#e7c4ff,#8a4fd0);display:inline-block"></span>+${es} Essência da Era</span>`:''}</div>`); }
  if(sk==='final'){ const rows=[['#ff5a4e','Novos inimigos: '+peEsc(peJoin(peFoes(t)))],['#4aa3ff','Novas armas e armaduras caem nesta era'+(peOld(o)?' (a sua arma é de uma era anterior)':'')]];
    if(PE.steps.includes('reward')){ const g=o.gems|0, es=o.essence|0; rows.push(['#ffc94a','Recompensa: '+[g?'+'+g+' gemas':'',es?'+'+es+' Essência da Era':''].filter(Boolean).join(', ')]); }
    stage+=`<div style="position:absolute;left:${(20*u).toFixed(0)}px;right:${(20*u).toFixed(0)}px;top:${(120*u).toFixed(0)}px;display:flex;flex-direction:column;gap:8px"><span class="pe-lil" style="text-align:center;font-size:26px;color:#ffc94a;text-shadow:0 3px 0 #6a3a08">ERA ${t+1} · ${peEsc(et?et.n.toUpperCase():'')}</span>${rows.map((r,i)=>`<div class="pe-row" style="min-height:58px;display:flex;align-items:center;padding:6px 12px;border-radius:14px;background:rgba(29,22,17,.94);border:2px solid ${r[0]};font-size:15px;font-weight:900;line-height:1.2;animation-delay:${(i*.08).toFixed(2)}s">${r[1]}</div>`).join('')}</div>`
      +`<button data-e="start" class="pe-gold pe-pulse pe-lil" style="position:absolute;left:${(40*u).toFixed(0)}px;right:${(40*u).toFixed(0)}px;bottom:${Math.max(24,54*u).toFixed(0)}px;height:64px;border-radius:18px;font-size:26px;padding:0;cursor:pointer">Começar a era</button>`; }
  const skip=sk==='final'?'':`<button data-e="skip" aria-label="Pular a apresentação" style="position:absolute;top:max(10px,env(safe-area-inset-top));right:10px;z-index:20;min-width:64px;height:44px;border-radius:14px;border:1px solid rgba(255,236,200,.25);background:rgba(16,11,8,.7);color:#f6ecdf;font-weight:900;font-size:14px;padding:0 14px;cursor:pointer">Pular</button>`;
  const peBg=e=>typeof bgPath==='function'?bgPath(e):`assets/bg/era${e}.png`, bgNew=peBg(t), bgOld=peBg(f);   /* eras 7 e 8: o fundo estático em disco é era<N>_ref.png (bgPath, js/battle.js) */
  PE.el.innerHTML=`<div class="pe-bg" style="background-image:url(${bgOld});opacity:${onNew?0:1}"></div><div class="pe-bg" style="background-image:url(${bgNew});opacity:${onNew?1:0}"></div><div class="pe-shade"></div>${stage}${skip}`; }

function peGo(i){ clearTimeout(PE.timer); PE.i=Math.max(0,Math.min(PE.steps.length-1,i)); PE.step=PE.steps[PE.i]; peFrame(); peLoopStart();
  if(PE.step!=='final'&&PE_MS[PE.step]) PE.timer=setTimeout(()=>{ if(PE.open) peGo(PE.i+1); },PE_MS[PE.step]);
  try{ if(typeof snd==='function') snd(PE.step==='flash'?'claim':PE.step==='title'?'gem':'ui_tap'); }catch(e){} }
function peClose(){ if(!PE.open) return; PE.open=false; clearTimeout(PE.timer); if(PE.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(PE.raf); PE.raf=0; PE.hfErr=0; if(PE.el&&PE.el.parentNode) PE.el.parentNode.removeChild(PE.el); PE.el=null;
  try{ if(typeof B!=='undefined'&&B.res&&B.res.mode==='era'){ B.res=null; B.running=true; } }catch(e){}
  try{ document.body&&document.body.classList.remove('resui'); }catch(e){}
  const cb=PE.o&&PE.o.onDone; PE.o=null; if(typeof cb==='function'){ try{ cb(); }catch(e){} } }
function peOpen(o){ o=o||{}; if(PE.open) return false; const to=o.to|0, from=(o.from==null?to-1:o.from|0);
  if(!peEra(to)||!peEra(from)||typeof document==='undefined') return false;
  PE.o={from,to,boss:o.boss||'',gems:o.gems|0,essence:o.essence|0,onDone:o.onDone}; PE.steps=peSteps(PE.o); PE.open=true;
  peInject(); const host=document.getElementById('app')||document.body; PE.el=document.createElement('div'); PE.el.className='pe-ov'; PE.el.setAttribute('role','dialog'); PE.el.setAttribute('aria-label','Nova era liberada: '+peEra(to).n);
  PE.el.addEventListener('click',ev=>{ const b=ev.target&&ev.target.closest?ev.target.closest('[data-e]'):null; const a=b&&b.dataset.e;
    if(a==='start'){ peClose(); return; }
    if(a==='skip'){ peGo(PE.steps.length-1); return; }
    if(PE.step!=='final') peGo(PE.i+1); });
  host.appendChild(PE.el);
  try{ if(typeof B!=='undefined'&&!B.res){ B.res={mode:'era'}; B.act=null; B.banner=null; B.running=false; B.eshots=[]; } }catch(e){}
  PE.step='boss'; PE.i=0; PE.el.innerHTML='<div class="pe-bg" style="background:#16110d"></div>';
  const urls=[`assets/anim/hyb/enemy/era${from}_boss_die.json`,'assets/anim/hyb/R/kael_run_body.json',peRunBase(to,'e0')+'.json','assets/bg/meta.json'];
  peLoad(urls).then(()=>{ PE.meta.bg=PE.meta['assets/bg/meta.json']||{}; if(PE.open) peGo(0); });   /* as folhas ficam em PE.meta[base+'.json'], lidas por peSprite */
  return true; }

Panels.add('era',{title:'Nova era',overlay:true,open:peOpen,close:peClose});
window.PEra={open:peOpen,close:peClose,go:peGo,state:PE,steps:peSteps};   /* depuração e teste de fumaça: window.PEra.open({from:1,to:2,boss:'Minotauro',gems:30}) */
