'use strict';
/* ================= TELA 17b PETS V2 (docs/proto/PetsV2.dc.html) — NASCE DESLIGADA (PANEL_ON.pets = false) =================
   Só a TELA: palco do pet (folha animada), estágios, abas Detalhes / Ataques / Evoluir / Coleção, alimentar, redefinir nível, evoluir,
   ovo do nível 20 e ovo à escolha (com a animação de chocar). Nenhuma regra aqui: tudo vem do Sys.pet (js/sys/pet.js, §5f e §5h do
   reports/sys-e2-api.md). A tela NÃO liga nenhuma chave do módulo: sem o módulo carregado ou com a chave da tela 17b desligada
   (Sys.pet.setV17), mostra "Pets: em breve"; antes do nível de liberação, o portão com Voltar.
   LAYOUT NOVO (PANEL_V2.real do screens.js): tamanho real, largura d.Wb de 320 a 600 px, altura útil d.H; nada encolhe, o miolo ROLA
   (x-scroll, a rolagem é devolvida no redesenho) e a ação principal fica fixa embaixo. O cabeçalho com Voltar é do index. */

/* ---------- chamadas ao Sys.pet ISOLADAS (valor de reserva seguro; o que falta no módulo está anotado em cada uma) ---------- */
const ptP=()=>(window.Sys&&Sys.pet)||null;
const ptHost=()=>(window.Sys&&Sys.host)||null;
/* a tela só existe com o módulo carregado, a Revisão 3 e a chave da 17b ligadas (quem liga é o jogo, não a tela) */
function ptReady(){ const P=ptP(); return !!(P&&P.DATA&&P.DATA.v3===true&&P.DATA.v17&&P.DATA.v17.on===true&&typeof P.ensure==='function'&&typeof P.fcShare==='function'); }
function ptCall(fn,args,fb){ const P=ptP(); try{ if(P&&typeof P[fn]==='function'){ const r=P[fn].apply(P,args); return r==null?fb:r; } }catch(e){} return fb; }
const ptSave=()=>ptCall('ensure',[S],{owned:{},stored:{},food:0,eq:null,pre:[],first:true});
/* FALTA NO MÓDULO: Sys.pet.locked(S) e Sys.pet.lockLevel() existem lá dentro mas não são exportadas. Reserva: a mesma leitura pelo Sys.level. */
function ptLocked(){ const P=ptP(); if(!P) return false; if(typeof P.locked==='function') return !!P.locked(S);
  try{ const L=window.Sys&&Sys.level, v=P.DATA.v20; if(v&&v.on===true) return !!(L&&L.level&&L.level(S)<v.unlockLevel); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'pet')); }catch(e){ return false; } }
function ptLockLevel(){ const P=ptP(); if(P&&typeof P.lockLevel==='function') return P.lockLevel();
  try{ const L=window.Sys&&Sys.level, v=P&&P.DATA.v20; if(v&&v.on===true) return v.unlockLevel; return L&&L.unlockLevel?L.unlockLevel('pet'):1; }catch(e){ return 1; } }
/* FALTA NO MÓDULO: nome da raridade por índice (a lista RNAME é interna). Reserva: RN() do jogo (0-4) + "Prismático" (5). */
const ptRN=r=>{ const P=ptP(); if(P&&typeof P.rarityName==='function') return P.rarityName(r); return r>=5?'Prismático':(RN(r)||''); };
/* FALTA NO MÓDULO: o nível que solta um ovo guardado pelo portão de raridade. Reserva: tabela do portão (Sys.loot.DATA.gates; depois Sys.level.DATA.eggGate). 0 = não sei. */
function ptGateLevel(r){ const P=ptP(); if(P&&typeof P.gateLevel==='function') return P.gateLevel(r)|0;
  try{ const g=window.Sys&&Sys.loot&&Sys.loot.DATA&&Sys.loot.DATA.gates; if(g&&g[r]&&g[r].lvl) return g[r].lvl|0; const e=window.Sys&&Sys.level&&Sys.level.DATA&&Sys.level.DATA.eggGate; if(e&&e[r]&&e[r].level) return e[r].level|0; }catch(e){} return 0; }
const ptGateTxt=r=>{ const l=ptGateLevel(r); return l>0?'guardado até o nível '+n0(l):'guardado até a raridade liberar'; };
/* ovos À ESCOLHA pendentes e ovos guardados pelo portão (listas do save do módulo) */
const ptChoices=()=>{ const c=ptSave().choices; return Array.isArray(c)?c.map((q,i)=>({i,c:q})).filter(q=>q.c&&Array.isArray(q.c.options)&&q.c.options.length):[]; };   /* i = índice para o chooseEgg */
const ptGated=id=>{ const g=ptSave().gated; return Array.isArray(g)?g.filter(q=>q&&q.pet===id).length:0; };
/* Alimentar por toque: direto no Sys.pet.feedTap (barra parcial de DATA.v17.tapFood por toque). O defeito que existia no módulo (nível e barra não
   gravavam) foi corrigido pela sessão de Sistemas (Sys.pet.ensure atualiza a ficha no lugar; há teste de regressão): o desvio da tela saiu. */
function ptFeedTap(id){ const P=ptP(); return ptCall('feedTap',[S,ptHost(),id,P.DATA.v17.tapFood],{ok:false,reason:'off'}); }
/* 1º ovo (chave v20 do módulo): só aparece na tela quando o módulo diz que está pendente */
function ptEggPending(){ const P=ptP(); if(!P||!P.DATA.v20||P.DATA.v20.on!==true||typeof P.firstEgg!=='function') return false; return ptSave().first!==true&&!ptLocked(); }

/* ---------- DADOS DA TELA (arte e textos do protótipo). Pontos que dependem de decisão do PO ficam SÓ aqui ---------- */
/* sprite = arquivos em assets/pets/<sprite>_{ref,mid,evo}.png (conferidos). foot = última linha opaca / 512 (medido no protótipo).
   sheet = tem folha de batalha em assets/anim/pets; sem folha a tela mostra silhueta "em breve" (pedido da coordenação).
   atk = nomes dos 3 ataques [básico, crítico, mediano] (texto da tela; o módulo só tem nomes genéricos).
   how = "como conseguir": ovo = espécie da era, sem sorteio (decisão do PO). egg20 = também sai do 1º ovo (a % vem do módulo);
   o ovo à escolha do andar 100 entra pelo DATA.v17.tower100 (ver ptHow). */
const PT_ART={
  wolf:      {sprite:'era0_mammoth', era:0,eraN:'Pré-História',fly:false,fx:'#bfe6ff',foot:[0.949,0.953,0.981],sheet:true, atk:['Chifrada','Jato de tromba','Tremor'],                      how:'ovo da Pré-História',egg20:true},
  owl:       {sprite:'era1_sphinx',  era:1,eraN:'Antiguidade', fly:false,fx:'#ffd36a',foot:[0.936,0.988,1],    sheet:true, atk:['Garra','Raio do sol','Tempestade de areia'],             how:'ovo da Antiguidade',egg20:true},
  drake:     {sprite:'era2_dragon',  era:2,eraN:'Medieval',    fly:false,fx:'#ff8a3a',foot:[0.949,0.984,0.949],sheet:true, atk:['Mordida','Bola de fogo','Rabada'],                       how:'ovo da era Medieval'},
  parrot:    {sprite:'era3_parrot',  era:3,eraN:'Pólvora',     fly:true, fx:'#ff6a3a',foot:[0.949,1,1],        sheet:true, atk:['Bicada','Pena de fogo','Rasante'],                       how:'ovo da era da Pólvora'},
  golem:     {sprite:'era4_mechdog', era:4,eraN:'Industrial',  fly:false,fx:'#ffd36a',foot:[0.949,1,1],        sheet:true, atk:['Mordida de aço','Parafuso disparado','Jato de vapor'],   how:'ovo da era Industrial'},
  /* 3 PETS NOVOS já ligados no módulo (Sys.pet.DATA.newReady) e aprovados: Lobo sombrio, Falcão de guerra e Pantera espectral. Imagens paradas da Arte (73ea4f2,
     pés em 0,95 da altura como os antigos), golpes e origem da Sistemas (fontes do js/sys/newdrops.js). Não são de uma era: sem cenário de era no palco. */
  shadowwolf:{sprite:'pet_shadowwolf',era:-1,eraN:'',fly:false,fx:'#7a5cff',foot:[0.95,0.95,0.95],sheet:true, atk:['Mordida','Investida sombria','Garra dupla'],   how:'Instância Arsenal (1ª vitória em cada dificuldade) ou baús da atividade'},
  falcon:    {sprite:'pet_falcon',    era:-1,eraN:'',fly:true, fx:'#d8b47a',foot:[0.95,0.95,0.95],sheet:true, atk:['Bicada','Mergulho','Rajada de penas'],          how:'Torre, andar 30, ou missões diárias'},
  panther:   {sprite:'pet_panther',   era:-1,eraN:'',fly:false,fx:'#b07cff',foot:[0.95,0.95,0.95],sheet:true, atk:['Patada','Bote pelas costas','Sombra veloz'],        how:'Arena: fim de temporada no Ouro ou acima'},
  underworld:{sprite:'era7_cerberus',era:7,eraN:'Submundo',    fly:false,fx:'#ff4a2a',foot:[0.938,0.951,0.949],sheet:true, atk:['Mordida tripla','Chama do submundo','Uivo'],             how:'ovo do Submundo'},
  celestial: {sprite:'era8_pegasus', era:8,eraN:'Celestial',   fly:true, fx:'#fff3c4',foot:[1,0.986,1],        sheet:true, atk:['Coice','Estrela cadente','Vendaval'],                    how:'ovo da era Celestial'},
  prism:     {sprite:'prism_fox',    era:9,eraN:'Prismático',  fly:false,fx:'#8ff5ff',foot:[0.998,0.973,0.957],sheet:true, atk:['Patada de cristal','Lança de cristal','Prisma'],         how:''},
};
const PT_ORDER=['wolf','owl','drake','parrot','golem','shadowwolf','falcon','panther','underworld','celestial','prism'];   /* ordem do protótipo; só estes aparecem (a fênix saiu do jogo: decisão do PO) */
const PT_NOART={sprite:'',era:-1,eraN:'',fly:false,fx:'#fff3c4',foot:[1,1,1],sheet:true,atk:['Golpe','Tiro','Pancada'],how:''};
const PT_FILE=['ref','mid','evo'];
const PT_RC=['#e8e2d8','#4aa3ff','#b07cff','#ff5a5a','#ffc94a','#8ff5ff'], PT_RGB=['232,226,216','74,163,255','176,124,255','255,90,90','255,201,74','143,245,255'];
const PT_TXT={ noFood:'Sem ração: vem dos baús e do offline',   /* texto do protótipo (fontes de ração: fps-30) */
  soon:'Em breve: este pet ainda não está no jogo.' };
const PT_ICON={ basic:'M5 19 L19 5 M14 5 H19 V10 M5 14 L10 19', crit:'M12 3 V7 M12 17 V21 M3 12 H7 M17 12 H21 M12 9 A3 3 0 1 0 12.01 9', mid:'M3 17 C7 11 17 11 21 17 M6 13 L4 9 M12 11 V6 M18 13 L20 9' };
const PT_KIND={ basic:{kind:'Básico',c:'#e8e2d8',i:0,act:'pt-lunge'}, crit:{kind:'Crítico (tiro)',c:'#ffc94a',i:1,act:'pt-recoil'}, mid:{kind:'Mediano',c:'#7fc8ff',i:2,act:'pt-stomp'} };
const PT_DECO={
  1:[['pt-pyr','6%','30%','30%','auto','0s'],['pt-pyr','64%','30%','22%','auto','0s'],['pt-cloudc','30%','78%','auto','14%','-8s']],
  3:[['pt-wave','0','30%','100%','6%','0s'],['pt-mast','78%','36%','4px','30%','0s'],['pt-sail','79%','42%','12%','20%','0s'],['pt-mast','12%','36%','3px','20%','0s'],['pt-sail','13%','40%','8%','13%','-1.4s']],
  4:[['pt-chim','8%','30%','7%','42%','0s'],['pt-chim','20%','30%','5%','30%','0s'],['pt-chim','82%','30%','8%','38%','0s'],['pt-smoke','9%','72%','26px','26px','0s'],['pt-smoke','83%','68%','26px','26px','-2s'],['pt-smoke','20%','60%','26px','26px','-1s']],
  7:[['pt-ember','12%','20%','5px','5px','0s'],['pt-ember','28%','14%','5px','5px','-1.2s'],['pt-ember','72%','18%','5px','5px','-0.6s'],['pt-ember','86%','24%','5px','5px','-2.1s'],['pt-ember','50%','10%','5px','5px','-1.7s']],
  8:[['pt-cloudc','6%','64%','auto','14%','0s'],['pt-cloudc','62%','74%','auto','14%','-13s'],['pt-cloudc','40%','36%','auto','14%','-6s']],
  9:[['pt-shard','8%','28%','7%','auto','0s'],['pt-shard','16%','28%','4%','auto','-.8s'],['pt-shard','80%','28%','8%','auto','-1.4s'],['pt-shard','90%','28%','4%','auto','-.4s']] };
const PT_STAR='M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z';
const PT_BOWL='<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12 H21 L19 19 A2 2 0 0 1 17 20.5 H7 A2 2 0 0 1 5 19 Z" fill="#c77a3a" stroke="#5a2d10" stroke-width="1.3"></path><circle cx="8" cy="10.5" r="2.2" fill="#e8b070" stroke="#5a2d10" stroke-width="1"></circle><circle cx="12" cy="9" r="2.4" fill="#d89a5a" stroke="#5a2d10" stroke-width="1"></circle><circle cx="16" cy="10.5" r="2.2" fill="#e8b070" stroke="#5a2d10" stroke-width="1"></circle></svg>';
const PT_PAW='<svg viewBox="0 0 24 24" width="60%" height="60%" fill="#6a5a48" aria-hidden="true"><ellipse cx="12" cy="16" rx="5.2" ry="4.2"></ellipse><circle cx="5.5" cy="10.5" r="2.2"></circle><circle cx="9.5" cy="6.5" r="2.2"></circle><circle cx="14.5" cy="6.5" r="2.2"></circle><circle cx="18.5" cy="10.5" r="2.2"></circle></svg>';

(function(){ const st=document.createElement('style'); st.textContent=`
.pt-root,.pt-root *{box-sizing:border-box}
.pt-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.pt-root button.lil{font-family:'Lilita One',Nunito,sans-serif}
.pt-in{animation:ptk-pin .28s ease-out both}
.pt-ol{text-shadow:-1px -1px 0 #120c08,1px -1px 0 #120c08,-1px 1px 0 #120c08,1px 1px 0 #120c08,0 2px 0 #120c08}
.pt-L{position:absolute;left:0;right:0;background-repeat:repeat-x;background-size:auto 100%;pointer-events:none}
.pt-Lsky{top:0;height:60%}.pt-Lfar{top:22%;height:42%}.pt-Lmid{top:17.5%;height:50%}.pt-Lgnd{top:65.5%;height:40%}.pt-Lcld{top:2.5%;height:27%;animation:ptk-drift 120s linear infinite}
.pt-sky0{background-image:url(assets/bg/v2/era0/sky.webp)}.pt-far0{background-image:url(assets/bg/v2/era0/far.webp)}.pt-mid0{background-image:url(assets/bg/v2/era0/midA.webp)}.pt-gnd0{background-image:url(assets/bg/v2/era0/ground.webp)}.pt-cld0{background-image:url(assets/bg/v2/era0/cloud1.webp)}
.pt-sky2{background-image:url(assets/bg/v2/era2/sky.webp)}.pt-far2{background-image:url(assets/bg/v2/era2/far.webp)}.pt-mid2{background-image:url(assets/bg/v2/era2/midA.webp)}.pt-gnd2{background-image:url(assets/bg/v2/era2/ground.webp)}.pt-cld2{background-image:url(assets/bg/v2/era2/cloud1.webp)}
@keyframes ptk-drift{from{background-position-x:0}to{background-position-x:-2400px}}
.pt-th{position:absolute;inset:0}
.pt-th1{background:linear-gradient(180deg,#f9dc9a 0%,#eeb066 46%,#c98a4a 64%,#8f5a2c 100%)}
.pt-th3{background:linear-gradient(180deg,#ffbe7a 0%,#f08a55 38%,#8a5a6a 56%,#2d6f86 62%,#1f4a5c 100%)}
.pt-th4{background:linear-gradient(180deg,#a7a9a3 0%,#857a6c 45%,#5b4f43 64%,#3a3129 100%)}
.pt-th7{background:radial-gradient(ellipse at 50% 100%,#a2261a 0%,rgba(162,38,26,0) 55%),linear-gradient(180deg,#24071a 0%,#3a0d1a 50%,#1a0608 100%)}
.pt-th8{background:linear-gradient(180deg,#a9d8ff 0%,#dbefff 46%,#fff1cf 66%,#f3d99a 100%)}
.pt-th9{background:radial-gradient(ellipse at 50% 70%,rgba(143,245,255,.35),rgba(143,245,255,0) 60%),linear-gradient(180deg,#24164a 0%,#3b2470 45%,#12304a 70%,#0b1c2c 100%)}
.pt-floor{position:absolute;left:0;right:0;bottom:0;height:30%}
.pt-fl1{background:linear-gradient(180deg,#d39a5a,#9a6234)}.pt-fl3{background:linear-gradient(180deg,#b88a5a,#7a5434)}.pt-fl4{background:linear-gradient(180deg,#4a4038,#2a231e)}
.pt-fl7{background:linear-gradient(180deg,#3a1410,#140606)}.pt-fl8{background:linear-gradient(180deg,#fff6e0,#e8cf96)}.pt-fl9{background:linear-gradient(180deg,#2a2a5a,#141432)}
.pt-pyr{position:absolute;aspect-ratio:2/1;background:linear-gradient(90deg,#d6995a 50%,#b07440 50%);clip-path:polygon(50% 0,100% 100%,0 100%)}
.pt-chim{position:absolute;background:#3a3029;border-radius:3px 3px 0 0}
.pt-smoke{position:absolute;width:26px;height:26px;border-radius:50%;background:rgba(220,214,204,.55);animation:ptk-smoke 4s ease-out infinite}
@keyframes ptk-smoke{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:.8}100%{transform:translate(30px,-60px) scale(1.8);opacity:0}}
.pt-mast{position:absolute;background:#4a2a1a;width:4px}
.pt-sail{position:absolute;background:#f6ecdf;clip-path:polygon(0 0,100% 20%,100% 80%,0 100%);animation:ptk-sail 3s ease-in-out infinite;transform-origin:0 50%}
@keyframes ptk-sail{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.86)}}
.pt-wave{position:absolute;left:0;right:0;height:6%;background:repeating-linear-gradient(90deg,rgba(255,255,255,.35) 0 18px,transparent 18px 40px);animation:ptk-wave 3s linear infinite}
@keyframes ptk-wave{to{background-position-x:-80px}}
.pt-ember{position:absolute;width:5px;height:5px;border-radius:50%;background:#ffb04a;box-shadow:0 0 8px 2px rgba(255,120,40,.9);animation:ptk-ember 3.2s linear infinite}
@keyframes ptk-ember{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-120px);opacity:0}}
.pt-cloudc{position:absolute;height:14%;aspect-ratio:3/1;border-radius:999px;background:#fff;opacity:.85;animation:ptk-cl 26s linear infinite;box-shadow:24px -10px 0 4px #fff,-20px -6px 0 2px #fff}
@keyframes ptk-cl{from{transform:translateX(-40px)}to{transform:translateX(60px)}}
.pt-shard{position:absolute;aspect-ratio:1/3;clip-path:polygon(50% 0,100% 30%,80% 100%,20% 100%,0 30%);background:linear-gradient(180deg,#d8fbff,#7ad7ff 45%,#b07cff);animation:ptk-shardG 2.6s ease-in-out infinite}
@keyframes ptk-shardG{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5) hue-rotate(40deg)}}
.pt-ped{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#8a7a68 0%,#5a4c3e 55%,#3a3028 100%);box-shadow:0 7px 0 #2a2019,0 10px 14px rgba(0,0,0,.45)}
.pt-pedRim{position:absolute;inset:-3px;border-radius:50%;border:3px solid;animation:ptk-rim 2.2s ease-in-out infinite}
@keyframes ptk-rim{0%,100%{opacity:.55}50%{opacity:1}}
.pt-breathe{animation:ptk-breathe 2.6s ease-in-out infinite}
@keyframes ptk-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.018,1.04)}}
.pt-fly{animation:ptk-fly 2.2s ease-in-out infinite}
@keyframes ptk-fly{0%,100%{transform:translateY(0)}50%{transform:translateY(-4%)}}
.pt-shd{position:absolute;left:50%;border-radius:50%;background:rgba(0,0,0,.42);transform:translateX(-50%)}
.pt-shdFly{animation:ptk-shdFly 2.2s ease-in-out infinite}
@keyframes ptk-shdFly{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(.82);opacity:.7}}
.pt-lunge{animation:ptk-lunge .5s ease-out both}
@keyframes ptk-lunge{0%,100%{transform:translateX(0)}35%{transform:translateX(9%)}}
.pt-recoil{animation:ptk-recoil .45s ease-out both}
@keyframes ptk-recoil{0%,100%{transform:translateX(0)}25%{transform:translateX(-5%)}}
.pt-stomp{animation:ptk-stomp .5s ease-out both}
@keyframes ptk-stomp{0%,100%{transform:scale(1,1)}30%{transform:scale(1.06,.94)}}
.pt-aura{position:absolute;left:50%;bottom:0;transform:translateX(-50%);border-radius:50%;pointer-events:none}
.pt-a0{width:82%;height:34%;animation:ptk-auraP 2.8s ease-in-out infinite}
.pt-a1{width:104%;height:62%;animation:ptk-auraP 2.2s ease-in-out infinite}
.pt-a2{width:120%;height:92%;animation:ptk-auraP 1.6s ease-in-out infinite}
@keyframes ptk-auraP{0%,100%{opacity:.6;transform:translateX(-50%) scale(.96)}50%{opacity:1;transform:translateX(-50%) scale(1.04)}}
.pt-ring{position:absolute;left:50%;bottom:-4%;width:86%;height:16%;border-radius:50%;border:3px solid;transform:translateX(-50%);animation:ptk-ringP 1.8s ease-out infinite}
@keyframes ptk-ringP{0%{opacity:.9;transform:translateX(-50%) scale(.6)}100%{opacity:0;transform:translateX(-50%) scale(1.25)}}
.pt-rays{position:absolute;left:50%;bottom:-6%;width:116%;aspect-ratio:1;margin-left:-58%;border-radius:50%;-webkit-mask:radial-gradient(circle,#000 18%,transparent 66%);mask:radial-gradient(circle,#000 18%,transparent 66%);animation:ptk-spin 9s linear infinite}
@keyframes ptk-spin{to{transform:rotate(360deg)}}
.pt-pt{position:absolute;width:6px;height:6px;border-radius:50%;animation:ptk-rise 2.4s linear infinite}
@keyframes ptk-rise{0%{top:88%;opacity:0;transform:scale(.6)}15%{opacity:1}100%{top:12%;opacity:0;transform:scale(1.2)}}
@keyframes ptk-hue{from{filter:hue-rotate(0)}to{filter:hue-rotate(360deg)}}
.pt-ring.pt-rainbow{animation:ptk-ringP 1.8s ease-out infinite,ptk-hue 4s linear infinite}
.pt-rays.pt-rainbow{animation:ptk-spin 9s linear infinite,ptk-hue 4s linear infinite}
.pt-pt.pt-rainbow{animation:ptk-rise 2.4s linear infinite,ptk-hue 4s linear infinite}
.pt-a0.pt-rainbow{animation:ptk-auraP 2.8s ease-in-out infinite,ptk-hue 4s linear infinite}
.pt-a1.pt-rainbow{animation:ptk-auraP 2.2s ease-in-out infinite,ptk-hue 4s linear infinite}
.pt-a2.pt-rainbow{animation:ptk-auraP 1.6s ease-in-out infinite,ptk-hue 4s linear infinite}
.pt-shot{position:absolute;width:5%;aspect-ratio:1;border-radius:50%;animation:ptk-shot .55s ease-in both}
@keyframes ptk-shot{0%{left:56%;opacity:1;transform:scale(.6)}85%{opacity:1}100%{left:96%;opacity:0;transform:scale(1.2)}}
.pt-boom{position:absolute;right:2%;width:18%;aspect-ratio:1;border-radius:50%;animation:ptk-boom .5s ease-out .45s both}
@keyframes ptk-boom{0%{transform:scale(.2);opacity:0}30%{opacity:1}100%{transform:scale(1.4);opacity:0}}
.pt-slash{position:absolute;width:20%;aspect-ratio:1;border-radius:50%;border-right:5px solid #fff;border-top:5px solid transparent;border-bottom:5px solid transparent;animation:ptk-slash .45s ease-out .1s both}
@keyframes ptk-slash{0%{transform:rotate(-50deg) scale(.6);opacity:0}40%{opacity:1}100%{transform:rotate(40deg) scale(1.1);opacity:0}}
.pt-shock{position:absolute;left:50%;width:70%;height:12%;border-radius:50%;border:4px solid;transform:translateX(-50%);animation:ptk-shock .6s ease-out both}
@keyframes ptk-shock{0%{transform:translateX(-50%) scale(.3);opacity:1}100%{transform:translateX(-50%) scale(1.5);opacity:0}}
.pt-atkTag{animation:ptk-tag .9s ease-out both}
@keyframes ptk-tag{0%{transform:scale(.6);opacity:0}20%{transform:scale(1.1);opacity:1}80%{opacity:1}100%{transform:scale(1);opacity:0}}
.pt-gold{border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 5px 0 #8a4f0c}
.pt-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
.pt-sec{border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf}
.pt-off{border:2px solid #4a3a2b;background:#2a211a;color:#8f8070;box-shadow:none}
.pt-eqd{border:2px solid #5fd068;background:#1f3a22;color:#9ff0a6}
.pt-pulse{animation:ptk-pulse 1.4s ease-in-out infinite}
@keyframes ptk-pulse{0%,100%{box-shadow:0 5px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 5px 0 #8a4f0c,0 0 18px rgba(255,201,74,.9)}}
.pt-bar{position:relative;display:block;height:10px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden}
.pt-barF{position:absolute;left:0;top:0;bottom:0;border-radius:999px;transition:width .35s ease-out}
.pt-shine{position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);background-size:300% 100%;animation:ptk-shine 2.4s ease-in-out infinite}
@keyframes ptk-shine{0%,50%{background-position:160% 0}100%{background-position:-60% 0}}
.pt-star{animation:ptk-star 2.4s ease-in-out infinite}
@keyframes ptk-star{0%,100%{filter:drop-shadow(0 0 1px rgba(255,201,74,.4))}50%{filter:drop-shadow(0 0 5px rgba(255,201,74,1))}}
.pt-dotCur{animation:ptk-dotP 1.4s ease-in-out infinite}
@keyframes ptk-dotP{0%,100%{box-shadow:0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 0 10px rgba(255,201,74,1)}}
.pt-panelIn{animation:ptk-pin .28s ease-out both}
@keyframes ptk-pin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.pt-tile{transition:transform .15s}
.pt-tile:active{transform:scale(.95)}
.pt-tileSel{animation:ptk-tileSel 1.6s ease-in-out infinite}
@keyframes ptk-tileSel{0%,100%{box-shadow:0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 0 12px rgba(255,201,74,.85)}}
.pt-sil{filter:brightness(0);opacity:.5}
.pt-wsil{filter:brightness(0) invert(1) drop-shadow(0 0 10px #fff3c4)}
.pt-rare{position:relative;overflow:hidden}
.pt-rare::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%);background-size:300% 100%;animation:ptk-shine 2.4s ease-in-out infinite;pointer-events:none}
.pt-rbw{background:linear-gradient(90deg,#ff5a5a,#ffc94a,#5fd068,#4aa3ff,#b07cff,#ff5a5a);background-size:200% 100%;animation:ptk-rbw 3s linear infinite}
@keyframes ptk-rbw{to{background-position:-200% 0}}
.pt-toast{animation:ptk-toast 2.2s ease-out both}
@keyframes ptk-toast{0%{opacity:0;transform:translate(-50%,-8px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,0)}}
.pt-lvPop{display:inline-block;animation:ptk-lvPop .6s ease-out both}
@keyframes ptk-lvPop{0%{transform:scale(1)}40%{transform:scale(1.25);color:#fff}100%{transform:scale(1)}}
.pt-eggBtn{animation:ptk-eggW 2.4s ease-in-out infinite;transform-origin:50% 90%}
@keyframes ptk-eggW{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-10deg)}90%{transform:rotate(9deg)}95%{transform:rotate(-5deg)}}
.pt-ovl{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:16px;background:radial-gradient(circle at 50% 45%,rgba(48,34,20,.96),rgba(6,4,3,.98) 70%)}
.pt-scene{position:relative;aspect-ratio:1/1;flex:none}
.pt-eggShake{animation:ptk-shake .5s ease-in-out infinite;transform-origin:50% 92%}
@keyframes ptk-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(3deg)}}
.pt-eggCrack{animation:ptk-shake .22s linear infinite,ptk-eggGlow .9s ease-in infinite;transform-origin:50% 92%}
@keyframes ptk-eggGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.6) drop-shadow(0 0 14px #fff3c4)}}
.pt-crk{stroke-dasharray:120;stroke-dashoffset:120;animation:ptk-crk 1s ease-out forwards}
@keyframes ptk-crk{to{stroke-dashoffset:0}}
.pt-beam{position:absolute;left:50%;bottom:30%;width:6%;height:70%;margin-left:-3%;transform-origin:50% 100%;background:linear-gradient(0deg,rgba(255,243,196,.9),rgba(255,243,196,0));animation:ptk-beam 1s ease-in both}
@keyframes ptk-beam{from{opacity:0;height:10%}to{opacity:1;height:70%}}
.pt-flash{position:absolute;inset:0;z-index:5;pointer-events:none;background:radial-gradient(circle at 50% 50%,#fff 0%,rgba(255,255,255,.9) 30%,rgba(255,224,122,.4) 60%,rgba(255,224,122,0) 85%);animation:ptk-flash .7s ease-out both}
@keyframes ptk-flash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.pt-burstRing{position:absolute;left:50%;top:55%;width:30%;aspect-ratio:1;margin:-15% 0 0 -15%;border-radius:50%;border:6px solid #fff3c4;animation:ptk-bring .7s ease-out both}
@keyframes ptk-bring{0%{transform:scale(.2);opacity:1}100%{transform:scale(3.4);opacity:0}}
.pt-spoke{position:absolute;inset:0;pointer-events:none}
.pt-spk{position:absolute;left:50%;top:55%;width:4%;aspect-ratio:1;border-radius:50%;background:#fff3c4;box-shadow:0 0 10px 3px rgba(255,201,74,.9);animation:ptk-spk .8s ease-out both}
@keyframes ptk-spk{0%{left:50%;opacity:1}100%{left:96%;opacity:0}}
.pt-reveal{animation:ptk-reveal .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes ptk-reveal{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.pt-cardIn{animation:ptk-pin .4s ease-out .3s both}
.pt-coc{position:absolute;left:50%;bottom:12%;width:66%;height:80%;margin-left:-33%;border-radius:50% 50% 46% 46%;background:radial-gradient(ellipse at 50% 55%,#fff 0%,#fff3c4 40%,rgba(255,224,122,.6) 70%,rgba(255,224,122,0) 100%);animation:ptk-coc .5s ease-in-out infinite}
@keyframes ptk-coc{0%,100%{transform:scale(1,1);filter:brightness(1)}50%{transform:scale(1.05,.97);filter:brightness(1.3)}}
.pt-spiral{position:absolute;left:50%;bottom:12%;width:80%;height:84%;margin-left:-40%;border-radius:50%;border:4px dashed rgba(255,243,196,.8);animation:ptk-spin 1.2s linear infinite}
.pt-glowUp{animation:ptk-glowUp 1.2s ease-in both}
@keyframes ptk-glowUp{from{filter:brightness(1)}to{filter:brightness(3) saturate(0)}}
.pt-hrays{position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;margin:-75% 0 0 -75%;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.3) 0deg 8deg,transparent 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 66%);mask:radial-gradient(circle,#000 20%,transparent 66%);animation:ptk-spin 14s linear infinite}
.pt-jump{animation:ptk-jump .6s cubic-bezier(.3,1.2,.5,1) both}
@keyframes ptk-jump{0%{transform:translateY(-34%) scale(.55);opacity:0}45%{transform:translateY(-16%) scale(1.04);opacity:1}78%{transform:translateY(0) scale(1.06,.92)}100%{transform:none;opacity:1}}
.pt-pulse2{animation:ptk-pulse2 1.4s ease-in-out infinite}
@keyframes ptk-pulse2{0%,100%{box-shadow:0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 0 16px rgba(255,201,74,.9)}}
@keyframes ptk-sp{from{background-position:0 0}to{background-position:100% 0}}
`; document.head.appendChild(st); })();

/* ---------- peças ---------- */
const ptOpen=()=>typeof view!=='undefined'&&view==='pets';
function ptLater(fn,ms){ const q=XPT.seq; XPT.timers.push(setTimeout(()=>{ if(q===XPT.seq&&ptOpen()) fn(); },ms)); }
function ptStop(){ XPT.seq++; XPT.timers.forEach(t=>{ try{ clearTimeout(t); }catch(e){} }); XPT.timers=[]; }
function ptToast(msg){ XPT.toast=String(msg||''); XPT.toastT=Date.now(); }
const ptArt=def=>PT_ART[def.id]||PT_NOART;
const ptDef=id=>{ const P=ptP(); return (P&&P.DATA.pets.find(d=>d.id===id))||null; };
/* lista da tela: os pets do protótipo, na ordem dele (a fênix não entra) */
function ptList(){ const out=[]; for(const id of PT_ORDER){ const d=ptDef(id); if(d) out.push(d); } return out; }
/* "em breve" = não é do jogador E (o módulo diz que ainda não existe OU não tem folha de batalha) */
const ptSoon=(def,o)=>!o.owned[def.id]&&(!ptCall('avail',[def,ptHost()],false)||!ptArt(def).sheet);
const ptShift=(def,stg)=>((1-ptArt(def).foot[stg])*100).toFixed(1)+'%';
/* desenho do pet (arquivo de assets/pets) ou marcador neutro quando a espécie não tem arte */
function ptPic(def,stg,cls,style,alt){ const a=ptArt(def);
  if(a.sprite) return `<img src="assets/pets/${a.sprite}_${PT_FILE[stg]}.png" alt="${esc2(alt||'')}" class="${cls||''}" style="${style}">`;
  return `<span class="${cls||''}" role="img" aria-label="${esc2(alt||'')}" style="${style};display:flex;align-items:flex-end;justify-content:center">${PT_PAW}</span>`; }
function ptAuraBg(r,stg,strong){ const c=PT_RGB[r];
  if(r===5) return stg===0?'radial-gradient(ellipse at 50% 100%, rgba(220,255,255,0.55), rgba(143,245,255,0) 68%)'
    :'radial-gradient(ellipse at 50% 100%, rgba(255,120,200,'+(strong?0.75:0.55)+'), rgba(120,200,255,0.35) 40%, rgba(143,245,255,0) 70%)';
  if(stg===0) return 'radial-gradient(ellipse at 50% 100%, rgba(255,250,235,0.5), rgba(255,250,235,0) 68%)';
  if(stg===1) return 'radial-gradient(ellipse at 50% 100%, rgba('+c+',0.6), rgba('+c+',0) 68%)';
  return 'radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.55), rgba('+c+',0.75) 28%, rgba('+c+',0) 70%)'; }
function ptStrong(r){ const prism=r===5, rb=prism?' pt-rainbow':'';
  const rays=prism?'repeating-conic-gradient(rgba(255,138,216,0.35) 0deg 8deg, transparent 8deg 20deg, rgba(143,245,255,0.35) 20deg 28deg, transparent 28deg 40deg)':'repeating-conic-gradient(rgba('+PT_RGB[r]+',0.32) 0deg 8deg, transparent 8deg 24deg)';
  return `<span class="pt-rays${rb}" aria-hidden="true" style="background:${rays}"></span>`+[12,30,48,64,80,22].map((l,i)=>{ const c=prism?['#ff8ad8','#8ff5ff','#ffe07a','#9ff0a6','#b07cff','#fff'][i]:(i%2?'#fff3c4':PT_RC[r]);
    return `<span class="pt-pt${rb}" aria-hidden="true" style="left:${l}%;background:${c};box-shadow:0 0 8px 2px ${c};animation-delay:${(-i*0.4).toFixed(1)}s"></span>`; }).join(''); }
const ptSpokes=()=>[0,30,60,90,120,150,180,210,240,270,300,330].map((r,i)=>`<span class="pt-spoke" aria-hidden="true" style="transform:rotate(${r}deg)"><span class="pt-spk" style="animation-delay:${(i%3*0.05).toFixed(2)}s"></span></span>`).join('');
const ptMult=v=>(v===1?'':'~')+String(v).replace('.',',')+'x';
const ptPct=v=>p1(v*100);
/* chances dos 3 ataques (atual e máxima) e nomes: Sys.pet.attackOdds + DATA.v3d.attacks */
function ptAtkInfo(def,x){ const P=ptP(), D=P.DATA, A=D.v3d.attacks, a=ptArt(def);
  const now=P.attackOdds(x?x.stars:1,x?(x.lvl||1):1,def.id), max=P.attackOdds(D.maxStars,D.v3d.maxLvl,def.id);
  return ['basic','crit','mid'].map(k=>({k,name:a.atk[PT_KIND[k].i],kind:PT_KIND[k].kind,c:PT_KIND[k].c,mult:ptMult(A[k].dmg),now:now[k],max:max[k]})); }
function ptFxHtml(k,def){ const a=ptArt(def), K=PT_KIND[k], A=ptP().DATA.v3d.attacks, c=a.fx;
  return (k==='crit'?`<span class="pt-shot" aria-hidden="true" style="top:52%;background:radial-gradient(circle,#fff 0 25%,${c} 60%);box-shadow:0 0 14px 4px ${c}"></span><span class="pt-boom" aria-hidden="true" style="top:42%;background:radial-gradient(circle,#fff 0 18%,${c} 50%,transparent 72%)"></span>`
    :k==='basic'?'<span class="pt-slash" aria-hidden="true" style="right:8%;top:40%"></span>':`<span class="pt-shock" aria-hidden="true" style="bottom:6%;border-color:${c}"></span>`)
    +`<span class="pt-atkTag lil pt-ol" role="status" style="position:absolute;right:8px;top:4px;font-size:16px;color:${K.c}">${esc2(a.atk[K.i])} ${ptMult(A[k].dmg)}</span>`; }
/* quanto o pet soma à FC (número): a parte dele na FC TOTAL (Sys.pet.fcShare) aplicada sobre a FC atual do herói */
function ptFcAdd(id,sh,o){ const fc=heroFC(); if(!(sh.now>0)||!(fc>0)) return 0; if(o.eq===id) return fc*sh.now/100;
  const e=o.eq?ptCall('fcShare',[S,ptHost(),o.eq],{now:0,max:0}).now:0, base=fc*(1-e/100); return base*sh.now/(100-sh.now); }
function ptHow(def){ const P=ptP(), a=ptArt(def), D=P.DATA; if(def.hatchFrags) return n0(def.hatchFrags)+' fragmentos prismáticos';
  let t=a.how||'';
  if(a.egg20&&D.v20&&D.v20.on===true){ const od=ptCall('firstEggOdds',[],[]).find(x=>x.r===def.r); if(od) t='ovo do Nv '+D.v20.unlockLevel+' ('+p1(od.pct)+')'+(t?' ou '+t:''); }
  const tw=D.v17.tower100; if(Array.isArray(tw)&&tw.indexOf(def.id)>=0) t+=(t?' ou ':'')+'andar 100 da torre: ovo '+ptRN(def.r)+' à escolha ('+tw.map(q=>{ const d=ptDef(q); return d?d.name.split('-')[0]:''; }).filter(Boolean).join(' ou ')+')';
  return t; }
/* resultado de um ovo (addEgg do módulo) em uma frase: novo, repetido (fragmentos ou ração) ou guardado pelo portão */
function ptEggLine(h,stageName){ if(!h) return ''; if(h.held) return 'Ovo '+ptGateTxt(h.needR!=null?h.needR:(ptDef(h.pet)||{}).r|0);
  if(h.isNew) return 'novo na coleção, '+stageName; if(h.to==='food'||h.food>0) return 'repetido com 5 estrelas: +'+n0(h.food|0)+' de ração';
  return 'repetido: +'+n0(h.frags|0)+' fragmentos'; }

/* ---------- FOLHAS REAIS (assets/anim/pets; conferidas arquivo a arquivo, .json + .png) ----------
   Todas as folhas têm o MESMO formato (lido dos .json): quadro 512x352 numa fila só, 12 fps, pés em y=307, desenho na faixa x 96..352 (centro em 224),
   y 64..320 (256 px). idle e atk têm 12 quadros (1 s); run tem 8 (não é usado aqui: a tela não anda).
   PT_SH[sprite][estágio] = folhas que EXISTEM daquele estágio (0 filhote, 1 médio "_mid_", 2 evoluído "_evo_"). Sem folha do estágio: imagem parada.
   Filhote tem atk1/atk2/atk3 (básico/mediano/crítico); médio e evoluído só atk1 (formato econômico da fps-ff): os 3 ataques tocam o atk1.
   Cérbero: só parte das folhas (filhote idle+atk1, médio idle, evoluído nada) => segue em silhueta "em breve" (PT_ART.sheet=false). */
const PT_SHEET={frames:12,fps:12,w:512,h:352,feetY:307,cx:224,box:256};
const PT_SH={
  era0_mammoth:[['idle','atk1','atk2','atk3'],['idle','atk1','atk2'],['idle','atk1']],
  era1_sphinx: [['idle','atk1','atk2','atk3'],['idle','atk1'],['idle','atk1']],
  era2_dragon: [['idle','atk1','atk2','atk3'],['idle','atk1'],['idle','atk1']],
  era3_parrot: [['idle','atk1','atk2','atk3'],['idle','atk1'],['idle','atk1']],
  era4_mechdog:[['idle','atk1','atk2','atk3'],['idle','atk1'],['idle','atk1']],
  /* levantamento da Arte (14/11): Cérbero, Pégaso e Raposa têm as folhas dos 3 estágios (idle, run, atk1) em assets/anim/pets: sheet:true e animados como os outros.
     Seguem "Em breve" só enquanto o MÓDULO disser que não existem (Sys.pet.avail: chave v4 e eras 7-8, voto do dono), não mais por falta de folha. */
  era7_cerberus:[['idle','atk1'],['idle','atk1'],['idle','atk1']],
  era8_pegasus: [['idle','atk1'],['idle','atk1'],['idle','atk1']],
  prism_fox:    [['idle','atk1'],['idle','atk1'],['idle','atk1']],
  pet_shadowwolf:[['idle','atk1'],['idle','atk1'],['idle','atk1']],
  pet_falcon:   [['idle','atk1'],['idle','atk1'],['idle','atk1']],
  pet_panther:  [['idle','atk1'],['idle','atk1'],['idle','atk1']] };
const PT_SHP=['','mid_','evo_'], PT_ATKSH={basic:'atk1',mid:'atk2',crit:'atk3'};
function ptSheet(def,stg,k){ const a=ptArt(def), t=PT_SH[a.sprite]; return t&&t[stg]&&t[stg].indexOf(k)>=0?'assets/anim/pets/'+a.sprite+'_'+PT_SHP[stg]+k+'.png':''; }
const ptAtkSheet=(def,stg,k)=>ptSheet(def,stg,PT_ATKSH[k])||ptSheet(def,stg,'atk1');
/* folha animada dentro de uma caixa QUADRADA: a faixa desenhada (256 px) ocupa a caixa e os pés ficam na base dela, como a imagem parada */
function ptSprite(url,once,alt){ const F=PT_SHEET;
  return `<div role="img" aria-label="${esc2(alt||'')}" style="position:absolute;left:50%;bottom:0;height:${(F.h/F.box*100).toFixed(1)}%;aspect-ratio:${F.w}/${F.h};transform:translate(-${(F.cx/F.w*100).toFixed(2)}%,${((F.h-F.feetY)/F.h*100).toFixed(2)}%);${xSheetBg(url,xSheetMeta(url),{once:!!once})}"></div>`; }   /* tira OU grade (ex.: era0_mammoth_atk1/atk2 já são 6 × 2): xSheetBg/xSheetMeta do js/screens.js leem o .json real da folha */
/* o pet vivo (palco e prévia): folha idle quando existe; senão a imagem parada respirando (e flutuando, se voa) */
function ptLive(def,stg,alt,sil){ const a=ptArt(def), u=sil?'':ptSheet(def,stg,'idle'); if(u) return ptSprite(u,false,alt);
  return `<div class="${a.fly?'pt-fly':''}" style="position:absolute;inset:0"><div class="pt-breathe" style="position:absolute;inset:0;transform-origin:50% 100%">${ptPic(def,stg,sil?'pt-sil':'',`position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;transform:translateY(${ptShift(def,stg)})`,alt)}</div></div>`; }
/* toca um ataque no palco SEM redesenhar a tela: efeito + folha de ataque (ou o movimento em CSS do protótipo, se o estágio não tem folha) */
function ptPlayAtk(k,loud){ const def=ptDef(XPT.sel); if(!def) return; const n=++XPT.fxN, stg=XPT.vw|0, u=ptAtkSheet(def,stg,k); XPT.fx=k; XPT.lastAtk=Date.now(); if(loud) snd('ui_tap');
  const fx=document.getElementById('pt_fx'), act=document.getElementById('pt_act'), pet=document.getElementById('pt_pet'), row=document.getElementById('pt_ak_'+k);
  if(fx) fx.innerHTML=ptFxHtml(k,def); if(u){ if(pet) pet.innerHTML=ptSprite(u,true,''); } else if(act) act.className=PT_KIND[k].act; if(row&&row.style) row.style.borderColor=PT_KIND[k].c;
  ptLater(()=>{ if(XPT.fxN!==n) return; XPT.fx=null; const f2=document.getElementById('pt_fx'), a2=document.getElementById('pt_act'), p2=document.getElementById('pt_pet'), r2=document.getElementById('pt_ak_'+k);
    if(f2) f2.innerHTML=''; if(a2) a2.className=''; if(u&&p2) p2.innerHTML=ptLive(def,stg,'',false); if(r2&&r2.style) r2.style.borderColor='#4a3a2b'; },1000); }

/* ---------- liberação por nível: o módulo (chave v20) e a regra comum das telas (xUnlocked do screens.js) ---------- */
function ptHidden(){ if(ptLocked()) return true; try{ return typeof xUnlocked==='function'&&!xUnlocked('pet'); }catch(e){ return false; } }
function ptHiddenLv(){ if(ptLocked()) return ptLockLevel(); try{ return typeof xUnlockLv==='function'?xUnlockLv('pet'):ptLockLevel(); }catch(e){ return ptLockLevel(); } }

/* ---------- estado ---------- */
const PT_MINH=240;   /* altura mínima passada ao xDims: pequena de propósito (no layout novo nada encolhe; o miolo rola) */
const XPT={sel:null,view:null,vw:0,tab:'det',anim:true,pin:true,toast:'',toastT:0,fx:null,fxN:0,lastAtk:0,lvPop:false,confirm:false,
  choice:false,hatch:null,hRes:null,evo:null,evoFrom:0,evoId:null,seq:0,timers:[]};
function ptEmpty(d,html){ V.innerHTML=xWrap(d,'pt-root '+(XPT.anim?'pt-in':''),`<div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center">${html}</div>`); XPT.anim=false; }

/* ---------- desenho (layout novo: tamanho real, largura d.Wb de 320 a 600, o miolo rola e a ação principal fica embaixo) ---------- */
function scrPets(){
  const d=xDims(PT_MINH), H=d.H, W=d.Wb;
  if(!ptReady()){ ptEmpty(d,`<img src="assets/pets/pet_egg.png" alt="" style="width:120px;height:120px;object-fit:contain;opacity:.85"><span class="lil" style="font-size:24px">Pets: em breve</span>`); return; }
  const P=ptP(), D=P.DATA, o=ptSave(), host=ptHost();
  if(ptHidden()){ const n=Object.keys(o.owned).length;
    ptEmpty(d,`${SVG_LOCK(56,'#ffc94a')}<span class="lil" style="font-size:26px">Pets</span><span style="padding:6px 14px;border-radius:999px;background:#33271d;border:2px solid #ffc94a;color:#ffc94a;font-size:15px;font-weight:900">Libera no nível ${n0(ptHiddenLv())}</span>
      <span style="font-size:13px;font-weight:800;color:#c9b9a2">Você está no nível ${n0(plv())}. Continue lutando para liberar.</span>${n?`<span style="font-size:12px;font-weight:800;color:#c9b9a2">${n0(n)} ${n===1?'pet esperando':'pets esperando'}</span>`:''}
      <button class="pt-gold lil" data-x="back" style="margin-top:6px;height:52px;padding:0 28px;border-radius:16px;font-size:20px">Voltar</button>`); return; }
  const list=ptList();
  if(!list.length){ ptEmpty(d,'<span class="lil" style="font-size:24px">Pets: em breve</span>'); return; }
  if(!list.some(p=>p.id===XPT.sel)) XPT.sel=(list.find(p=>p.id===o.eq)||list.find(p=>o.owned[p.id])||list[0]).id;
  const def=list.find(p=>p.id===XPT.sel), idx=list.indexOf(def), id=def.id, art=ptArt(def), x=o.owned[id]||null, owned=!!x, soon=ptSoon(def,o);
  const r=Math.max(0,Math.min(5,def.r|0)), rc=PT_RC[r], prism=r===5, rb=prism?' pt-rainbow':'';
  const SN=D.v3d.stages.map(s=>s.name), REQ=D.v17.stageReq, CAP=D.v17.stageCap, MAXL=D.v3d.maxLvl;
  const sg=owned?ptCall('stage',[S,id],{}):{}, stg=owned?Math.max(0,Math.min(2,sg.index|0)):0;
  let vw=XPT.view!=null?XPT.view:stg; if(XPT.evo==='glow'||XPT.evo==='coc') vw=XPT.evoFrom; if(soon) vw=0; vw=Math.max(0,Math.min(2,vw|0)); XPT.vw=vw;
  const lv=owned?P.levelOf(S,id):0, stars=owned?x.stars:0, isEq=o.eq===id, strong=vw===2;
  const sh=ptCall('fcShare',[S,host,id],{now:0,max:0}), fcAdd=owned?ptFcAdd(id,sh,o):0;
  const cf=owned?P.canFeed(S,host,id):{ok:false,reason:'pet',cost:0}, need=P.foodCost(lv||1), fxb=owned?(x.fx|0):0;
  const ce=owned?P.canEvolve(S,id):{ok:false,reason:'pet'}, ready=ce.ok===true;
  const era=art.era, eraName=art.eraN||'', egg=ptEggPending(), chs=ptChoices(), nCh=chs.length, nGate=ptGated(id);
  const sk=SKIN(S.skinEq.armor), tier=tierOf(sk?sk.r:0);
  const petAlt=def.name+', '+SN[vw]+', '+ptRN(r);
  const layers=e=>`<div class="pt-L pt-Lsky pt-sky${e}"></div><div class="pt-L pt-Lcld pt-cld${e}"></div><div class="pt-L pt-Lfar pt-far${e}"></div><div class="pt-L pt-Lmid pt-mid${e}"></div><div class="pt-L pt-Lgnd pt-gnd${e}"></div>`;
  const pin=XPT.pin?'pt-panelIn':'';
  const stH=Math.round(Math.max(190,Math.min(340,H*0.36))), petPx=Math.round(Math.min(380,W*0.58));
  const sc0=XPT.anim?null:document.getElementById('pt_scroll'), y0=sc0?(+sc0.scrollTop||0):0;   /* o redesenho não devolve a rolagem ao topo */
  const eggBtn=(act,l1,aria)=>`<button data-x="${act}" aria-label="${aria}" class="pt-pulse2" style="position:absolute;right:6px;bottom:6px;z-index:4;min-width:64px;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:2px 6px;border-radius:14px;border:2px solid #ffc94a;background:rgba(51,39,29,0.94);color:#ffe07a;font-size:11px;font-weight:900;line-height:1.05">
      <img class="pt-eggBtn" src="assets/pets/pet_egg.png" alt="" style="width:38px;height:38px;object-fit:contain"><span>${l1}</span></button>`;

  /* ----- PALCO ----- */
  const stage=`<div style="position:relative;flex:none;height:${stH}px;border-radius:18px;overflow:hidden;border:2px solid ${rc};display:flex;flex-direction:column;background:#1d1611">
      ${era===0||era===2?layers(era):`<div class="pt-th ${PT_DECO[era]?'pt-th'+era:''}"></div>${PT_DECO[era]?`<div class="pt-floor pt-fl${era}"></div>`:''}`}
      ${(PT_DECO[era]||[]).map(q=>`<span class="${q[0]}" aria-hidden="true" style="left:${q[1]};bottom:${q[2]};width:${q[3]};height:${q[4]};animation-delay:${q[5]}"></span>`).join('')}
      <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(10,7,5,0.6) 0%,rgba(10,7,5,0) 26%,rgba(10,7,5,0) 80%,rgba(10,7,5,0.45) 100%)"></div>
      <div style="position:relative;z-index:3;height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 6px">
        <span style="flex:none">${xPager('pet',idx,list.length,null,'Pet anterior','Próximo pet')}</span>
        <span role="img" aria-label="Ração: ${n0(o.food)}" style="flex:none;display:flex;align-items:center;gap:4px;height:32px;padding:0 8px 0 4px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b">${PT_BOWL}<span id="pt_food" style="font-size:14px;font-weight:900">${gNum(o.food)}</span></span>
      </div>
      <div style="position:relative;z-index:2;flex:1;min-height:0">
        <div class="pt-ped" style="bottom:4%;width:min(62%,300px);height:15%"><span class="pt-pedRim" style="border-color:${rc}"></span></div>
        <div style="position:absolute;left:50%;bottom:11.5%;height:min(84%,${petPx}px);aspect-ratio:1/1;transform:translateX(-50%)">
          <div id="pt_act" class="${XPT.fx&&!ptAtkSheet(def,vw,XPT.fx)?PT_KIND[XPT.fx].act:''}" style="position:absolute;inset:0">
            ${soon?'':`<div class="pt-aura pt-a${vw}${rb}" aria-hidden="true" style="background:${ptAuraBg(r,vw,strong)}"></div>${vw>=1?`<span class="pt-ring${rb}" aria-hidden="true" style="border-color:${rc}"></span>`:''}${strong?ptStrong(r):''}`}
            <span class="pt-shd ${art.fly?'pt-shdFly':''}" aria-hidden="true" style="bottom:-3%;width:54%;height:8%"></span>
            <div id="pt_pet" style="position:absolute;inset:0">${XPT.fx&&!soon&&ptAtkSheet(def,vw,XPT.fx)?ptSprite(ptAtkSheet(def,vw,XPT.fx),true,petAlt):ptLive(def,vw,soon?def.name+', em breve':petAlt,soon)}</div>
          </div>
        </div>
        <div id="pt_fx" style="position:absolute;inset:0;pointer-events:none">${XPT.fx&&!soon?ptFxHtml(XPT.fx,def):''}</div>
        ${soon||!owned||vw!==stg?`<span class="pt-ol" style="position:absolute;left:8px;bottom:6px;padding:2px 8px;border-radius:8px;background:rgba(14,10,7,0.8);border:1px dashed #c9b9a2;font-size:11px;font-weight:900;color:#f6ecdf">${soon?'em breve':!owned?'não obtido':'vendo: '+esc2(SN[vw])}</span>`:''}
        ${egg?eggBtn('egg','Chocar<br>ovo','Chocar o ovo do nível '+n0(D.v20.unlockLevel)):nCh?eggBtn('choose','Escolher<br>ovo'+(nCh>1?' ('+n0(nCh)+')':''),'Escolher ovo: '+n0(nCh)+' pendente'+(nCh>1?'s':'')):''}
      </div>
    </div>`;

  /* ----- nome, raridade, estrelas, nível, estágios ----- */
  const info=`<div style="flex:none;display:flex;align-items:center;gap:6px;min-height:54px">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">
        <span style="display:flex;align-items:center;gap:6px;min-width:0"><span class="lil pt-ol" style="min-width:0;font-size:${String(def.name||'').length>14?18:21}px;line-height:1.25;overflow-wrap:anywhere">${esc2(def.name)}</span>
          ${isEq?`<span role="img" aria-label="Equipado" style="flex:none;width:20px;height:20px;border-radius:50%;background:#5fd068;display:flex;align-items:center;justify-content:center">${Y_CHK(13,'#0d2410')}</span>`:''}</span>
        <span style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-width:0">
          <span class="${prism?'pt-rbw pt-rare':r>=3?'pt-rare':''}" style="flex:none;padding:1px 7px;border-radius:7px;font-size:11px;font-weight:900;color:#16110d;background:${rc}">${esc2(ptRN(r))}</span>
          <span role="img" aria-label="${owned?stars+' de '+D.maxStars+' estrelas':'não obtido'}" style="display:flex;gap:1px;flex:none">${Array.from({length:D.maxStars},(_,i)=>`<svg class="${i<stars?'pt-star':''}" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style="animation-delay:${(i*0.2).toFixed(1)}s"><path d="${PT_STAR}" fill="${i<stars?'#ffc94a':'#3a2c1f'}" stroke="#6a3a08" stroke-width="1.4" stroke-linejoin="round"></path></svg>`).join('')}</span>
          <span class="${XPT.lvPop?'pt-lvPop':''}" style="font-size:13px;font-weight:900;color:#ffe07a;white-space:nowrap">${owned?'Nv '+n0(lv)+'/'+n0(MAXL):'Nv —'}</span>
        </span>
      </div>
      ${soon?'':`<div role="group" aria-label="Estágios do pet (toque para ver)" style="flex:none;position:relative;display:flex;gap:2px">
        <span aria-hidden="true" style="position:absolute;left:22px;right:22px;top:13px;height:3px;background:#4a3a2b;border-radius:2px"></span>
        ${SN.map((n,i)=>{ const reached=owned&&i<=stg, cur=i===vw;
          return `<button data-x="stg" data-i="${i}" aria-label="${esc2(n)}${i===0?'':' (Nv '+REQ[i]+')'}${reached?', alcançado':', ainda não'}. Toque para ver" aria-pressed="${cur}" style="position:relative;width:44px;height:48px;border:0;border-radius:10px;background:${cur?'#3a2c1f':'transparent'};padding:4px 0 0;display:flex;flex-direction:column;align-items:center;gap:3px;color:${cur?'#ffc94a':'#c9b9a2'}">
            <span class="${owned&&i===stg?'pt-dotCur':''}" style="width:16px;height:16px;border-radius:50%;border:3px solid ${reached?rc:'#6a5a48'};background:${reached?rc:'#16110d'}"></span><span style="font-size:10px;font-weight:900;line-height:1">${esc2(n)}</span></button>`; }).join('')}
      </div>`}
    </div>`;

  const tabs=`<div role="tablist" aria-label="Seções do pet" style="height:44px;flex:none;display:flex;gap:4px">${[['det','Detalhes'],['atk','Ataques'],['evo','Evoluir'],['col','Coleção']].map(t=>{ const on=XPT.tab===t[0];
      return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${t[0]}" class="lil" style="flex:1;min-width:0;border-radius:12px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'linear-gradient(180deg,#ffe07a,#f2a826)':'#33271d'};color:${on?'#2a1403':'#c9b9a2'};font-size:${W<350?14:15}px;padding:0">${t[1]}</button>`; }).join('')}</div>`;

  const soonBox=`<div class="${pin}" style="display:flex;flex-direction:column;justify-content:center;gap:8px;min-height:72px"><span style="font-size:13px;font-weight:900;line-height:1.3;text-align:center;color:#c9b9a2">${esc2(PT_TXT.soon)}</span></div>`;
  const cell=(lb,val)=>`<div style="flex:1;min-width:0;min-height:40px;border-radius:10px;background:#33271d;display:flex;flex-direction:column;justify-content:center;padding:3px 8px;line-height:1.25"><span style="font-size:10px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${lb}</span><span style="font-size:13px;font-weight:900;overflow-wrap:anywhere">${val}</span></div>`;   /* valor (FC) e rótulo inteiros: quebram linha se faltar largura, sem reticências nem corte na altura */

  /* ----- DETALHES ----- */
  const det=()=>{ const bpH=[44,54,62][vw], pvH=Math.round(Math.max(88,Math.min(132,W*0.27)));
    return `<div class="${pin}" style="display:flex;flex-direction:column;gap:6px">
      <div style="flex:none;display:flex;gap:4px">
        ${''   /* a célula "Bônus na FC +N%" saiu (decisão do PO: confundia com o valor de FC); fica só "Soma à FC". As células são flex:1: as duas que restam dividem a largura. */}
        ${cell('Soma à FC',`<span style="color:#ffe07a">${owned?'+'+(typeof fcTxt==='function'?fcTxt(fcAdd):kf(fcAdd))+' FC':'—'}</span>`)}
        ${cell(esc2(eraName||'Pet'),art.fly?'Voa':'Terrestre')}
      </div>
      <div role="img" aria-label="Prévia na batalha: Kael parado e ${esc2(def.name)} atrás dele, no chão" style="position:relative;flex:none;height:${pvH}px;border-radius:12px;overflow:hidden;border:1px solid #4a3a2b;background:#7fb3d9">
        ${layers(2)}
        <div style="position:absolute;left:4%;top:${80-bpH}%;height:${bpH}%;aspect-ratio:1/1"><span class="pt-shd ${art.fly?'pt-shdFly':''}" aria-hidden="true" style="bottom:-5%;width:60%;height:12%"></span>${ptLive(def,vw,'',false)}</div>
        <div style="position:absolute;left:26%;top:9.7%;height:74%;aspect-ratio:1/1"><span class="pt-shd" aria-hidden="true" style="bottom:1%;width:46%;height:9%"></span><div class="kidle ${tier?'t'+tier:''}" style="position:absolute;inset:0"></div></div>
        <span class="pt-ol" style="position:absolute;left:6px;top:4px;padding:1px 7px;border-radius:7px;background:rgba(14,10,7,0.75);font-size:11px;font-weight:900;color:${isEq?'#9ff0a6':'#f6ecdf'}">${isEq?'Na batalha: atrás do Kael':'Prévia na batalha'}</span>
      </div>
      ${owned?`<div style="flex:none;display:flex;align-items:center;gap:8px">
        <span style="flex:1;min-width:0;font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.25">Ração gasta neste pet: <b style="color:#ffe07a">${n0(x.food|0)}</b>. Redefinir devolve ${p1(D.v3d.releaseRefund*100)}; estrelas e estágio ficam.</span>
        <button data-x="reset" class="pt-sec" aria-label="Redefinir nível de ${esc2(def.name)}: devolve ${p1(D.v3d.releaseRefund*100)} da ração" style="flex:none;min-height:44px;padding:0 12px;border-radius:12px;font-size:12px;font-weight:900;line-height:1.05">Redefinir<br>nível</button></div>`
      :`<span style="flex:none;font-size:12px;font-weight:900;line-height:1.25"><span style="color:#ff8a7a">Não obtido.</span> ${nGate?`<span style="color:#ffe07a">Ovo ${esc2(ptGateTxt(r))}.</span>`:`Como conseguir: <span style="color:#ffe07a">${esc2(ptHow(def))}</span>`}</span>`}
    </div>`; };

  /* ----- ATAQUES ----- */
  const atk=()=>`<div class="${pin}" style="display:flex;flex-direction:column;gap:6px">
      <span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.2">Ataca <b style="color:#f6ecdf">sozinho</b> a cada ~${String(D.battle.interval).replace('.',',')} s. A chance sobe com <b style="color:#ffc94a">estrelas</b> e <b style="color:#ffc94a">nível</b>. Toque para ver.</span>
      ${ptAtkInfo(def,x).map(k=>{ const sc=k.k==='basic'?1:0.15;
        return `<button data-x="atk" data-k="${k.k}" id="pt_ak_${k.k}" aria-label="${esc2(k.name)}, ${k.kind}, dano ${k.mult}, chance atual ${ptPct(k.now)}, no máximo ${ptPct(k.max)}. Toque para ver" style="flex:none;min-height:52px;display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:12px;border:2px solid ${XPT.fx===k.k?k.c:'#4a3a2b'};background:#33271d;color:#f6ecdf;text-align:left">
        <span style="flex:none;width:36px;height:36px;border-radius:10px;background:${k.c};display:flex;align-items:center;justify-content:center"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16110d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${PT_ICON[k.k]}"></path></svg></span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:14px;font-weight:900;overflow-wrap:anywhere">${esc2(k.name)}</span><span style="font-size:11px;font-weight:800;color:${k.c};overflow-wrap:anywhere">${k.kind} · dano ${k.mult}</span></span>
        <span style="flex:none;width:32%;display:flex;flex-direction:column;gap:2px;line-height:1.1">
          <span style="display:flex;justify-content:space-between;align-items:baseline;gap:4px;white-space:nowrap"><span class="lil" style="font-size:17px;color:${k.c}">${ptPct(k.now)}</span><span style="font-size:10px;font-weight:900;color:#c9b9a2">máx ${ptPct(k.max)}</span></span>
          <span class="pt-bar" style="height:8px"><span class="pt-barF" style="width:${Math.min(100,k.now/sc*100).toFixed(1)}%;background:${k.c}"></span><span aria-hidden="true" style="position:absolute;top:0;bottom:0;left:${Math.min(99,k.max/sc*100).toFixed(1)}%;width:2px;background:#f6ecdf"></span></span>
        </span></button>`; }).join('')}
    </div>`;

  /* ----- EVOLUIR ----- */
  const evo=()=>{ const sc=owned?P.starCostOf(def):[], rep='repetido = +'+n0(D.repeatFrags)+' fragmentos';
    const starTxt=!owned?rep+' (com '+D.maxStars+' estrelas vira ração)':stars>=D.maxStars?D.maxStars+' estrelas máximo, repetido vira ração':n0(x.frags|0)+'/'+n0(sc[stars-1]|0)+' fragmentos, '+rep;
    return `<div class="${pin}" style="display:flex;flex-direction:column;gap:6px">
      <div style="flex:none;display:flex;gap:5px">${SN.map((n,i)=>{ const reached=owned&&i<=stg, can=owned&&i===stg+1&&ready;
        return `<button data-x="stg" data-i="${i}" data-keep="1" aria-label="${esc2(n)}, ${i===0?'ao chocar':'nível '+REQ[i]}. Toque para ver" style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:3px;padding:4px 2px 6px;border-radius:12px;border:2px solid ${i===vw?'#ffc94a':reached?rc:'#4a3a2b'};background:${reached?'#33271d':'#241b14'};color:#f6ecdf;overflow:hidden">
          <span style="position:relative;width:100%;height:72px;flex:none"><span style="position:absolute;left:18%;right:18%;bottom:2px;height:10px;border-radius:50%;background:rgba(0,0,0,0.45)"></span>
            <span class="pt-aura pt-a${i}${rb}" aria-hidden="true" style="background:${ptAuraBg(r,i,i===2)};height:70%"></span>
            ${ptPic(def,i,'',`position:absolute;left:50%;bottom:0;height:100%;aspect-ratio:1/1;transform:translate(-50%,${ptShift(def,i)});object-fit:contain`,'')}</span>
          <span class="lil" style="font-size:14px;line-height:1">${esc2(n)}</span><span style="font-size:10px;font-weight:900;color:#c9b9a2;line-height:1">${i===0?'ao chocar':'Nv '+n0(REQ[i])}</span>
          <span style="padding:1px 6px;border-radius:6px;font-size:10px;font-weight:900;background:${reached?'#1f3a22':can?'#ffc94a':'#16110d'};color:${reached?'#9ff0a6':can?'#2a1403':'#c9b9a2'};white-space:nowrap">${reached?(i===stg?'atual':'feito'):can?'pronto!':owned?'faltam '+n0(Math.max(0,REQ[i]-lv))+' Nv':'bloqueado'}</span></button>`; }).join('')}</div>
      <span style="flex:none;font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.3">Aura: <b style="color:#f6ecdf">leve</b> · <b style="color:${rc}">cor da raridade</b> · <b style="color:#ffe07a">forte com partículas</b>${prism?' (arco-íris mudando de cor)':''}. Estrelas: ${starTxt}.</span>
    </div>`; };

  /* ----- COLEÇÃO ----- */
  const col=()=>{ const nOwn=list.filter(p=>o.owned[p.id]).length;
    const tile=p=>{ const po=o.owned[p.id], on=p.id===id, isP=p.r>=5, sn=ptSoon(p,o), st=po?Math.max(0,Math.min(2,ptCall('stage',[S,p.id],{}).index|0)):0;
      const fr=isP&&!po&&p.hatchFrags?Math.floor(Math.min(1,(o.stored[p.id]|0)/p.hatchFrags)*100)+'%':'';
      const lbl=po?'Nv '+n0(P.levelOf(S,p.id)):ptGated(p.id)?'guardado':sn?'em breve':(fr||'?');
      return `<button data-x="sel" data-id="${p.id}" aria-label="${esc2(p.name)} (${esc2(ptRN(p.r))})${po?', obtido, nível '+P.levelOf(S,p.id):sn?', em breve':', não obtido'}" aria-pressed="${on}" class="pt-tile ${on?'pt-tileSel':''}${isP?' pt-rare':''}" style="position:relative;height:60px;min-width:0;border-radius:11px;border:2px solid ${on?'#ffc94a':po?PT_RC[Math.min(5,p.r)]:'#4a3a2b'};background:${on?'#3a2c1f':isP?'#2a1f3a':'#241b14'};padding:0;overflow:hidden;color:#f6ecdf">
        ${ptPic(p,st,po?'':'pt-sil','position:absolute;left:50%;top:2px;height:42px;width:42px;margin-left:-21px;object-fit:contain','')}
        <span class="pt-ol" style="position:absolute;left:0;right:0;bottom:2px;font-size:10px;font-weight:900;line-height:1.1;text-align:center;color:${po?'#ffe07a':isP?'#e6d8ff':'#c9b9a2'}">${lbl}</span></button>`; };
    let box;
    if(prism&&(owned||ptCall('avail',[def,host],false))){ const have=o.stored[id]|0, tot=def.hatchFrags|0, pr=(D.v4d&&D.v4d.prism)||{}, ar=window.Sys&&Sys.arena&&Sys.arena.DATA&&Sys.arena.DATA.rewards;
      const src=[]; if(pr.event) src.push(['Evento mensal','+'+n0(pr.event)]); if(pr.vipMax) src.push(['VIP '+pr.vipMax.level+' (1 vez)','+'+n0(pr.vipMax.frags)]);
      if(ar&&ar[0]&&ar[0].prism) src.push(['Arena (1º lugar)','+'+n0(ar[0].prism)]); if(pr.boss) src.push(['Chefe da era '+pr.boss.minEra,'+'+n0(pr.boss.perDay)+' por dia']);
      if(pr.tower) src.push(['Torre (a cada '+pr.tower.every+')','+'+n0(pr.tower.frags)]);
      box=`<div style="display:flex;flex-direction:column;gap:5px;padding:6px 8px;border-radius:12px;background:#2a1f3a;border:2px solid #b07cff">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="lil" style="font-size:14px">${esc2(def.name)}</span><span class="pt-rbw pt-rare" style="padding:1px 7px;border-radius:7px;font-size:10px;font-weight:900;color:#16110d">O MAIS RARO</span>
          <span style="margin-left:auto;font-size:12px;font-weight:900;color:#e6d8ff">${owned?n0(stars)+(stars===1?' estrela':' estrelas')+' · Nv '+n0(lv):n0(have)+'/'+n0(tot)}</span></span>
        <span class="pt-bar" style="flex:none"><span class="pt-barF pt-rbw" style="width:${owned?100:Math.min(100,have/Math.max(1,tot)*100).toFixed(1)}%"></span></span>
        <div style="display:grid;grid-template-columns:repeat(${W<360?2:3},1fr);gap:3px">${src.map(f=>`<span style="min-width:0;min-height:30px;border-radius:7px;background:#1d1611;padding:2px 5px;display:flex;flex-direction:column;justify-content:center;line-height:1.15"><span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(f[0])}</span><span style="font-size:10px;font-weight:900;color:#e6d8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(f[1])}</span></span>`).join('')}</div></div>`; }
    else box=`<div style="display:flex;flex-direction:column;justify-content:center;gap:4px;padding:8px 10px;border-radius:12px;background:#33271d;border:2px solid ${rc}">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0"><span class="lil" style="font-size:16px">${esc2(def.name)}</span><span style="font-size:11px;font-weight:900;color:#c9b9a2">${esc2((eraName?eraName+' · ':'')+ptRN(r))}</span></span>
        <span style="font-size:12px;font-weight:900;line-height:1.25">${owned?'Obtido · '+n0(stars)+(stars===1?' estrela':' estrelas')+' · '+esc2(SN[stg])+' · Nv '+n0(lv):nGate?'Ovo '+esc2(ptGateTxt(r)):soon?esc2(PT_TXT.soon):'Como conseguir: '+esc2(ptHow(def))}</span>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2">Coleção: ${n0(nOwn)} de ${n0(list.length)} pets</span></div>`;
    return `<div class="${pin}" style="display:flex;flex-direction:column;gap:6px"><div style="flex:none;display:grid;grid-template-columns:repeat(4,1fr);gap:5px">${list.map(tile).join('')}</div>${box}</div>`; };

  const body=XPT.tab==='col'?col():soon?soonBox:XPT.tab==='atk'?atk():XPT.tab==='evo'?evo():det();
  const panel=`<div style="flex:none;position:relative;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;padding:8px;display:flex;flex-direction:column">${body}</div>`;

  /* ----- AÇÃO PRINCIPAL (fixa embaixo, fora da rolagem) ----- */
  let bar='';
  if(owned&&XPT.tab==='evo'){ const evoTxt=stg>=2?'Forma final alcançada':ready?'Evoluir para '+SN[stg+1]:'Evoluir no Nv '+n0(REQ[stg+1])+' (está no '+n0(lv)+')';
    bar=`<button data-x="evolve" class="lil ${ready?'pt-gold pt-pulse':'pt-off'}" aria-disabled="${!ready}" style="width:100%;min-height:52px;border-radius:14px;font-size:${W<350?16:18}px">${esc2(evoTxt)}</button>`; }
  else if(owned){ const atMax=cf.reason==='max', atEvo=cf.reason==='evolve', atCap=cf.reason==='cap', full=atMax||atEvo||atCap, capEra=atCap?P.lvlCap(host):0;
    const feedTxt=atMax?'máximo':atEvo?'teto do estágio':atCap?'teto da era':n0(fxb)+'/'+n0(need);
    const feedNote=atMax?'Nv '+n0(MAXL):atEvo?'evolua para passar do Nv '+n0(CAP[stg]):atCap?'avance de era para passar do Nv '+n0(capEra):'Nv '+n0(lv+1)+' custa '+n0(need);
    const feedOff=full||o.food<=0, feedBtn=atEvo?'Evoluir primeiro':atCap?'Teto da era':atMax?'Nível máximo':'Alimentar +'+n0(D.v17.tapFood);
    bar=`<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:6px">
        <span style="display:flex;justify-content:space-between;gap:6px;font-size:11px;font-weight:900;white-space:nowrap"><span>Ração <span style="color:#ffe07a">${feedTxt}</span></span><span style="color:#c9b9a2;overflow:hidden;text-overflow:ellipsis">${feedNote}</span></span>
        <span class="pt-bar"><span class="pt-barF" style="width:${full?'100':Math.min(100,fxb/Math.max(1,need)*100).toFixed(1)}%;background:linear-gradient(90deg,#c77a3a,#ffc94a)"><span class="pt-shine"></span></span></span></div>
      <div style="display:flex;gap:8px">
        <button data-x="equip" class="lil ${isEq?'pt-eqd':'pt-sec'}" aria-pressed="${isEq}" style="flex:1;min-width:0;min-height:52px;border-radius:14px;font-size:${W<350?16:18}px">${isEq?'Equipado':'Equipar'}</button>
        <button data-x="feed" class="lil ${feedOff?'pt-off':'pt-gold'}" aria-disabled="${feedOff}" style="flex:1.25;min-width:0;min-height:52px;border-radius:14px;font-size:${W<350?16:18}px;line-height:1.05">${feedBtn}</button></div>`; }
  else if(XPT.tab!=='col') bar='<button data-x="gocol" class="pt-sec lil" style="width:100%;min-height:52px;border-radius:14px;font-size:18px">Ver coleção</button>';
  const toast=XPT.toast&&Date.now()-XPT.toastT<2200?`<span class="pt-toast" role="status" style="position:absolute;left:50%;bottom:100%;margin-bottom:8px;z-index:6;width:max-content;max-width:calc(100% - 24px);padding:6px 12px;border-radius:10px;background:#0e0a07;border:2px solid #ffc94a;font-size:12px;font-weight:900;text-align:center;line-height:1.25;pointer-events:none">${esc2(XPT.toast)}</span>`:'';
  const foot=`<div style="position:relative;flex:none;${bar?'padding:8px 10px 10px;border-top:2px solid #33271d;background:#16110d':''}">${toast}${bar}</div>`;

  /* ----- CONFIRMAR REDEFINIR ----- */
  let over='';
  if(XPT.confirm&&owned){ const cr=P.canResetLevel(S,id);
    over=`<div role="dialog" aria-label="Confirmar redefinir nível" class="x-scrim" style="position:absolute;inset:0;z-index:45;background:rgba(8,6,4,0.85);display:flex;align-items:center;justify-content:center;padding:20px">
      <div class="pt-panelIn" style="width:100%;max-width:340px;border-radius:18px;background:#1d1611;border:2px solid #ffc94a;padding:16px;display:flex;flex-direction:column;gap:10px">
        <span class="lil" style="font-size:22px">Redefinir nível?</span>
        <span style="font-size:13px;font-weight:800;line-height:1.35">${esc2(def.name)} volta para o <b>Nv 1</b>. Você recebe de volta <b style="color:#ffe07a">${n0(cr.refund|0)}</b> de ração (${p1(D.v3d.releaseRefund*100)} de ${n0(x.food|0)}). Estrelas e estágio ficam.</span>
        <div style="display:flex;gap:8px"><button data-x="cfno" class="pt-sec lil" style="flex:1;min-height:50px;border-radius:14px;font-size:18px">Cancelar</button><button data-x="cfyes" class="pt-gold lil" style="flex:1;min-height:50px;border-radius:14px;font-size:18px">Redefinir</button></div>
      </div></div>`; }
  const scW=Math.round(Math.min(340,W*0.84,Math.max(150,H-230)));

  /* ----- ESCOLHER O OVO (ovo à escolha pendente: Sys.pet.ensure(S).choices) ----- */
  if(XPT.choice&&nCh&&!XPT.hatch){ const c=chs[0].c, extra=[c.frags?'+'+n0(c.frags)+' fragmentos':'',c.food?'+'+n0(c.food)+' de ração':''].filter(Boolean).join(' e ');
    over+=`<div role="dialog" aria-label="Escolha seu ovo" class="x-scrim" style="position:absolute;inset:0;z-index:45;background:rgba(8,6,4,0.85);display:flex;align-items:center;justify-content:center;padding:12px">
      <div class="pt-panelIn x-scroll" style="width:100%;max-width:360px;max-height:100%;border-radius:18px;background:#1d1611;border:2px solid #ffc94a;padding:14px;display:flex;flex-direction:column;gap:10px">
        <span class="lil" style="font-size:22px;flex:none">Escolha seu ovo</span>
        <span style="flex:none;font-size:12px;font-weight:800;line-height:1.3;color:#c9b9a2">Toque no pet que você quer${nCh>1?' ('+n0(nCh)+' ovos para escolher)':''}.${extra?' Vai junto: <b style="color:#ffe07a">'+extra+'</b>.':''}</span>
        <div style="flex:none;display:flex;gap:8px">${c.options.map(q=>{ const pd=ptDef(q); if(!pd) return ''; const pr=Math.max(0,Math.min(5,pd.r|0)), has=!!o.owned[q];
          return `<button data-x="pick" data-id="${q}" aria-label="Escolher ${esc2(pd.name)}, ${esc2(ptRN(pr))}${has?', você já tem':''}" style="flex:1;min-width:0;min-height:150px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;border-radius:14px;border:2px solid ${PT_RC[pr]};background:#33271d;color:#f6ecdf;overflow:hidden">
            <span style="position:relative;width:100%;height:84px;flex:none">${ptPic(pd,0,'',`position:absolute;left:50%;bottom:0;height:100%;aspect-ratio:1/1;transform:translate(-50%,${ptShift(pd,0)});object-fit:contain`,'')}</span>
            <span class="lil" style="font-size:15px;line-height:1.05;text-align:center">${esc2(pd.name)}</span>
            <span style="padding:1px 7px;border-radius:7px;font-size:10px;font-weight:900;color:#16110d;background:${PT_RC[pr]}">${esc2(ptRN(pr))}</span>
            <span style="font-size:10px;font-weight:900;color:#c9b9a2;line-height:1.1;text-align:center">${has?(o.owned[q].stars>=D.maxStars?'você já tem '+D.maxStars+' estrelas: vira ração':'você já tem: +'+n0(D.repeatFrags)+' fragmentos'):'novo na coleção'}</span></button>`; }).join('')}</div>
        <button data-x="chno" class="pt-sec lil" style="flex:none;min-height:46px;border-radius:14px;font-size:17px">Escolher depois</button>
      </div></div>`; }

  /* ----- CHOCAR O OVO: treme, racha com luz, explode em brilho, o pet salta ao chão ----- */
  if(XPT.hatch){ const h=XPT.hatch, R=XPT.hRes||{}, hd=ptDef(R.pet)||list[0], hr=Math.max(0,Math.min(5,hd.r|0)), odds=ptCall('firstEggOdds',[],[]), od=odds.find(q=>q.r===R.rarity), isNew=!R.hatch||R.hatch.isNew!==false;
    const shown=h==='card'||h==='reveal', first=R.kind!=='choice', eggT=first?'Ovo do nível '+n0(D.v20.unlockLevel):'Ovo à escolha';
    over+=`<div class="pt-ovl" role="dialog" aria-label="Chocando: ${eggT}">
      <span class="lil pt-ol" style="font-size:26px;text-align:center">${shown?esc2(hd.name)+'!':eggT}</span>
      <div class="pt-scene" style="width:${scW}px">
        <span class="pt-hrays" aria-hidden="true" style="opacity:${h==='shake'?'0.25':h==='crack'?'0.6':'1'}"></span>
        <span aria-hidden="true" style="position:absolute;left:22%;right:22%;bottom:8%;height:9%;border-radius:50%;background:rgba(0,0,0,0.5)"></span>
        ${h==='shake'||h==='crack'?`<div class="${h==='crack'?'pt-eggCrack':'pt-eggShake'}" style="position:absolute;left:22%;bottom:12%;width:56%;aspect-ratio:1/1">
          <img src="assets/pets/pet_egg.png" alt="Ovo de pet" style="width:100%;height:100%;object-fit:contain;display:block">
          ${h==='crack'?`<span class="pt-beam" aria-hidden="true" style="transform:rotate(-28deg)"></span><span class="pt-beam" aria-hidden="true" style="transform:rotate(4deg);animation-delay:.25s"></span><span class="pt-beam" aria-hidden="true" style="transform:rotate(32deg);animation-delay:.5s"></span>
          <svg viewBox="0 0 100 100" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;overflow:visible"><polyline class="pt-crk" points="30,44 40,52 36,60 48,66 46,76 56,82" fill="none" stroke="#fff7d0" stroke-width="3.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 4px #ffe07a)"></polyline><polyline class="pt-crk" points="62,36 56,46 64,54 58,62" fill="none" stroke="#fff7d0" stroke-width="2.6" stroke-linejoin="round" style="animation-delay:.35s;filter:drop-shadow(0 0 4px #ffe07a)"></polyline><polyline class="pt-crk" points="48,30 52,38 46,44" fill="none" stroke="#fff7d0" stroke-width="2.2" stroke-linejoin="round" style="animation-delay:.6s;filter:drop-shadow(0 0 4px #ffe07a)"></polyline></svg>`:''}</div>`:''}
        ${h==='burst'?'<span class="pt-burstRing" aria-hidden="true"></span>'+ptSpokes():''}
        ${h==='burst'||shown?`<div style="position:absolute;left:12%;bottom:10%;width:76%;aspect-ratio:1/1"><span class="pt-aura pt-a1" aria-hidden="true" style="background:${ptAuraBg(hr,1,false)}"></span>
          <div class="${h==='card'?'':h==='burst'?'pt-reveal':'pt-jump'}" style="position:absolute;inset:0;transform-origin:50% 100%"><div class="pt-breathe" style="position:absolute;inset:0;transform-origin:50% 100%">${ptPic(hd,0,'',`position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;transform:translateY(${ptShift(hd,0)})`,hd.name+' filhote')}</div></div></div>`:''}
        ${h==='burst'?'<span class="pt-flash" aria-hidden="true"></span>':''}
      </div>
      ${h==='card'?`<div class="pt-cardIn" style="width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border-radius:18px;background:#1d1611;border:2px solid ${PT_RC[hr]}">
        <span style="font-size:14px;font-weight:900;text-align:center">${esc2(ptRN(hr))}${first&&od?' ('+p1(od.pct)+')':''} · ${isNew?'novo na coleção, '+esc2(SN[0]):esc2(ptEggLine(R.hatch,SN[0]))}</span>
        <button data-x="eggend" class="pt-gold pt-pulse lil" style="width:100%;max-width:240px;min-height:52px;border-radius:14px;font-size:20px">Pegar pet</button></div>`
      :!first?'':`<span style="font-size:13px;font-weight:900;color:#e8dccb;text-align:center;line-height:1.35">Sorteio grátis: ${odds.map(q=>`<span style="color:${PT_RC[Math.min(5,q.r)]}">${p1(q.pct)} ${esc2(q.name)}</span>`).join(' · ')}<br>nunca Lendário</span>`}
    </div>`; }

  /* ----- EVOLUÇÃO: brilho, casulo de luz, explosão, forma nova com a aura do estágio ----- */
  if(XPT.evo){ const e=XPT.evo, eTo=Math.min(2,XPT.evoFrom+1), eStg=e==='burst'||e==='new'?eTo:XPT.evoFrom;
    over+=`<div class="pt-ovl" role="dialog" aria-label="Evolução do pet">
      <span class="lil pt-ol" style="font-size:26px;text-align:center">${e==='new'?'Evoluiu: '+esc2(SN[eTo])+'!':'Evoluindo…'}</span>
      <div class="pt-scene" style="width:${scW}px">
        <span class="pt-hrays" aria-hidden="true" style="opacity:${e==='glow'?'0.3':e==='coc'?'0.7':'1'}"></span>
        <span aria-hidden="true" style="position:absolute;left:20%;right:20%;bottom:8%;height:9%;border-radius:50%;background:rgba(0,0,0,0.5)"></span>
        <div style="position:absolute;left:12%;bottom:10%;width:76%;aspect-ratio:1/1">
          ${e==='new'?`<span class="pt-aura pt-a${eTo}${rb}" aria-hidden="true" style="background:${ptAuraBg(r,eTo,eTo===2)}"></span>${eTo===2?ptStrong(r):''}`:''}
          <div class="${e==='glow'?'pt-glowUp':e==='new'?'pt-reveal':''}" style="position:absolute;inset:0;transform-origin:50% 100%"><div class="pt-breathe" style="position:absolute;inset:0;transform-origin:50% 100%">${ptPic(def,eStg,e==='coc'?'pt-wsil':'',`position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;transform:translateY(${ptShift(def,eStg)})`,def.name+' '+SN[eStg])}</div></div>
        </div>
        ${e==='coc'?'<span class="pt-spiral" aria-hidden="true"></span><span class="pt-coc" aria-hidden="true"></span>':''}
        ${e==='burst'?'<span class="pt-burstRing" aria-hidden="true"></span>'+ptSpokes()+'<span class="pt-flash" aria-hidden="true"></span>':''}
      </div>
      ${e==='new'?`<div class="pt-cardIn" style="width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 14px;border-radius:18px;background:#1d1611;border:2px solid ${rc}">
        <span style="font-size:14px;font-weight:900;text-align:center">${esc2(def.name)} agora é ${esc2(SN[eTo])} · aura ${eTo===1?'na cor da raridade':'forte com partículas'} · teto Nv ${n0(CAP[eTo])}</span>
        <button data-x="evoend" class="pt-gold pt-pulse lil" style="width:100%;max-width:240px;min-height:52px;border-radius:14px;font-size:20px">Continuar</button></div>`:''}
    </div>`; }

  V.innerHTML=xWrap(d,'pt-root '+(XPT.anim?'pt-in':''),`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="pt_scroll" class="x-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;padding:6px 10px 10px">${stage}${info}${tabs}${panel}</div>${foot}${over}</div>`);
  XPT.anim=false; XPT.pin=false;
  if(y0){ const sc=document.getElementById('pt_scroll'); if(sc) sc.scrollTop=y0; }
}

/* animação de chocar (treme 1,6 s, racha 1,3 s, explode 0,5 s, salta 0,6 s, cartão): o ovo JÁ foi resolvido pelo módulo antes de ela começar */
function ptHatchAnim(){ snd('summon'); ptStop(); XPT.fx=null; XPT.hatch='shake'; render();
  ptLater(()=>{ XPT.hatch='crack'; snd('ui_tap'); render(); },1600);
  ptLater(()=>{ XPT.hatch='burst'; snd('legendary'); render(); },2900);
  ptLater(()=>{ XPT.hatch='reveal'; render(); },3400);
  ptLater(()=>{ if(XPT.hatch==='reveal'){ XPT.hatch='card'; render(); } },4000); }

/* ---------- toques ---------- */
function ptClick(b,ev){
  const a=b.dataset.x;
  if(a==='back'){ snd('ui_tap'); if(window.Screens&&typeof Screens.close==='function') Screens.close(); return; }
  if(!ptReady()||ptHidden()) return;
  const P=ptP(), D=P.DATA, host=ptHost(), o=ptSave(), list=ptList(), def=list.find(p=>p.id===XPT.sel); if(!def) return;
  const id=def.id, x=o.owned[id]||null;
  /* animações de tela cheia: só os botões delas */
  if(XPT.hatch){ if(a==='eggend'&&XPT.hatch==='card'){ const R=XPT.hRes||{}; snd('claim'); ptStop(); XPT.hatch=null; XPT.hRes=null; if(R.pet) XPT.sel=R.pet; XPT.view=null; XPT.tab='det'; XPT.pin=true;
      ptToast(R.pre&&R.pre.length?'Novo pet! Ovos guardados chocados: '+n0(R.pre.length):R.frags?'Novo pet! +'+n0(R.frags)+' fragmentos':'Novo pet na coleção!'); render(); } return; }
  if(XPT.evo){ if(a==='evoend'&&XPT.evo==='new'){ snd('claim'); ptStop(); XPT.evo=null; XPT.evoId=null; XPT.tab='det'; XPT.pin=true; render(); } return; }
  /* ovo à escolha: o módulo choca (chooseEgg) e diz o que aconteceu: novo, repetido ou guardado pelo portão */
  if(XPT.choice){
    if(a==='chno'){ snd('ui_tap'); XPT.choice=false; render(); }
    else if(a==='pick'){ const ci=ptChoices()[0], pid=b.dataset.id, pd=ptDef(pid); XPT.choice=false;
      const r=ci&&pd?P.chooseEgg(S,host,ci.i,pid):null;
      if(!r||!r.ok){ ptToast('Este ovo não está mais disponível'); render(); return; }
      const h=r.hatch||{}; statsChanged(); XPT.sel=pid; XPT.view=null;
      if(h.isNew){ XPT.hRes={pet:pid,hatch:h,kind:'choice',frags:r.frags|0}; ptHatchAnim(); }
      else { snd('claim'); ptToast(pd.name+': '+ptEggLine(h,'')); render(); } }
    return; }
  if(XPT.confirm){
    if(a==='cfno'){ snd('ui_tap'); XPT.confirm=false; render(); }
    else if(a==='cfyes'){ const r=P.resetLevel(S,host,id); XPT.confirm=false;
      if(r&&r.ok){ snd('coin'); statsChanged(); ptToast('+'+n0(r.refund|0)+' de ração devolvida'); } else ptToast('Já está no Nv 1');
      render(); }
    return; }
  if(a==='tab'){ if(XPT.tab!==b.dataset.t&&/^(det|atk|evo|col)$/.test(b.dataset.t)){ snd('ui_tap'); XPT.tab=b.dataset.t; XPT.pin=true; render(); } return; }
  if(a==='pet'){ const i=list.indexOf(def)+(+b.dataset.d<0?-1:1); if(i<0||i>=list.length) return; snd('ui_tap'); XPT.sel=list[i].id; XPT.view=null; XPT.fx=null; XPT.fxN++; render(); return; }
  if(a==='sel'){ if(list.some(p=>p.id===b.dataset.id)){ snd('ui_tap'); XPT.sel=b.dataset.id; XPT.view=null; XPT.fx=null; XPT.fxN++; render(); } return; }
  if(a==='gocol'){ snd('ui_tap'); XPT.tab='col'; XPT.pin=true; render(); return; }
  if(a==='stg'){ const i=Math.max(0,Math.min(2,+b.dataset.i|0)), cur=x?Math.max(0,Math.min(2,ptCall('stage',[S,id],{}).index|0)):0; snd('ui_tap');
    XPT.view=(x&&i===cur&&!b.dataset.keep)?null:i; XPT.fx=null; XPT.fxN++; render(); return; }
  if(a==='atk'){ if(PT_KIND[b.dataset.k]&&!ptSoon(def,o)) ptPlayAtk(b.dataset.k,true); return; }
  if(a==='egg'){ if(!ptEggPending()) return; const r=P.firstEgg(S,host);
    if(!r||!r.ok){ ptToast(r&&r.reason==='level'?'Libera no nível '+n0(r.needLevel||ptLockLevel()):'O ovo já foi chocado'); render(); return; }
    statsChanged(); XPT.hRes=r; ptHatchAnim(); return; }
  if(a==='choose'){ if(ptChoices().length){ snd('ui_tap'); XPT.choice=true; render(); } return; }
  if(!x){ if(a==='evolve'||a==='equip'||a==='feed'||a==='reset'){ ptToast('Pet não obtido'); render(); } return; }
  if(a==='equip'){ if(o.eq===id){ snd('ui_tap'); ptToast('Já está na batalha (1 ativo)'); }
    else if(P.equip(S,id)){ snd('claim'); statsChanged(); ptToast(def.name+' vai lutar atrás do Kael'); }
    else ptToast('Não foi possível equipar agora');
    render(); return; }
  if(a==='reset'){ const c=P.canResetLevel(S,id); snd('ui_tap'); if(!c.ok){ ptToast('Já está no Nv 1'); } else XPT.confirm=true; render(); return; }
  if(a==='feed'){ const c=P.canFeed(S,host,id), cur=Math.max(0,Math.min(2,ptCall('stage',[S,id],{}).index|0));
    if(c.reason==='max') ptToast('Nível máximo ('+n0(D.v3d.maxLvl)+')');
    else if(c.reason==='evolve'){ snd('ui_tap'); ptToast('Evolua para passar do Nv '+n0(D.v17.stageCap[cur])); XPT.tab='evo'; XPT.pin=true; }
    else if(c.reason==='cap') ptToast('Teto da era: avance de era para passar do Nv '+n0(P.lvlCap(host)));
    else if(c.reason==='locked') ptToast('Libera no nível '+n0(ptLockLevel()));
    else { const r=ptFeedTap(id);
      if(!r||!r.ok) ptToast(r&&r.fallback&&r.need&&P.ensure(S).food>0?'Falta ração: o Nv '+n0(P.levelOf(S,id)+1)+' custa '+n0(r.need):PT_TXT.noFood);
      else { snd(r.up?'upgrade':'ui_tap'); if(r.up){ XPT.lvPop=true; statsChanged(); ptLater(()=>{ XPT.lvPop=false; },650); } else save(); } }
    render(); return; }
  if(a==='evolve'){ const c=P.canEvolve(S,id);
    if(!c.ok){ snd('ui_tap'); ptToast(c.reason==='max'?'Já está no último estágio':c.reason==='level'?'Precisa do Nv '+n0(c.need)+': alimente o pet':'Evolução indisponível'); render(); return; }
    const from=c.stage, r=P.evolve(S,id); if(!r||!r.ok){ ptToast('Evolução indisponível'); render(); return; }
    snd('summon'); statsChanged(); ptStop(); XPT.fx=null; XPT.evoFrom=from; XPT.evoId=id; XPT.view=null; XPT.evo='glow'; render();
    ptLater(()=>{ XPT.evo='coc'; render(); },1200);
    ptLater(()=>{ XPT.evo='burst'; snd('legendary'); render(); },2500);
    ptLater(()=>{ XPT.evo='new'; render(); },3000);
    return; }
}

if(!('pets' in PANEL_ON)) PANEL_ON.pets=false;
/* imagens que a tela mostra agora: o ovo, o desenho de cada pet da lista (1º estágio) e o do pet escolhido no estágio que está na vitrine */
function ptUrls(){ const u=['assets/pets/pet_egg.png']; try{ if(!ptReady()) return u; const list=ptList(); for(const d of list){ const a=ptArt(d); if(a&&a.sprite) u.push('assets/pets/'+a.sprite+'_'+PT_FILE[0]+'.png'); }
    const def=list.find(p=>p.id===XPT.sel), a=def?ptArt(def):null; if(a&&a.sprite) u.push('assets/pets/'+a.sprite+'_'+PT_FILE[Math.max(0,Math.min(2,XPT.vw|0))]+'.png'); }catch(e){} return u; }
Panels.add('pets',{title:'Pets',render:function(){ if(typeof xGate==='function'&&xGate(ptUrls())) return; return scrPets.apply(this,arguments); },click:function(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return ptClick.apply(this,arguments); },
  /* 4x por segundo: ataque de demonstração a cada ~2,4 s (só efeito no palco, sem redesenhar) e a ração do topo */
  tick(){ if(!ptReady()||ptHidden()||XPT.hatch||XPT.evo||XPT.confirm||XPT.choice) return; const o=ptSave(), el=document.getElementById('pt_food');
    if(el){ const t=gNum(o.food); if(el.textContent!==t) el.textContent=t; }
    if(XPT.fx||Date.now()-XPT.lastAtk<2400) return; const def=ptDef(XPT.sel); if(!def||ptSoon(def,o)) return;
    const x=o.owned[def.id], od=ptP().attackOdds(x?x.stars:1,x?(x.lvl||1):1,def.id), u=Math.random();
    ptPlayAtk(u<od.crit?'crit':u<od.crit+od.mid?'mid':'basic',false); },
  busy(){ return !!(XPT.hatch||XPT.evo||XPT.confirm||XPT.choice); },
  onOpen(op){ ptStop(); XPT.anim=true; XPT.pin=true; XPT.view=null; XPT.fx=null; XPT.toast=''; XPT.confirm=false; XPT.choice=false; XPT.hatch=null; XPT.hRes=null; XPT.evo=null; XPT.evoId=null; XPT.lvPop=false; XPT.lastAtk=Date.now();
    if(op&&op.tab&&/^(det|atk|evo|col)$/.test(op.tab)) XPT.tab=op.tab; else XPT.tab='det';
    if(ptReady()){ const o=ptSave(); XPT.sel=(op&&op.pet&&ptDef(op.pet))?op.pet:(o.eq||XPT.sel); } },
  onClose(){ ptStop(); XPT.fx=null; XPT.confirm=false; XPT.choice=false; XPT.hatch=null; XPT.hRes=null; XPT.evo=null; XPT.evoId=null; XPT.lvPop=false; } });

/* ESCOLHA DE OVO chamada de fora (pedido A-15): quando o Sys.pet.addEgg devolve {choice:true, options, index}, o jogo chama
   Screens.open('eggpick', {index, options}). Esta entrada só leva à tela de Pets já com a folha "Escolha seu ovo" aberta: a escolha em si
   (Sys.pet.chooseEgg) e a animação de chocar são as mesmas da tela. Liga junto com a tela de Pets (Panels.enable em js/panels.js). */
if(!('eggpick' in PANEL_ON)) PANEL_ON.eggpick=false;
Panels.add('eggpick',{title:'Escolher ovo',render(){ V.innerHTML=''; },
  onOpen(){ setTimeout(()=>{ if(typeof view==='undefined'||view!=='eggpick') return;
    if(window.Panels&&Panels.on('pets')){ Panels.open('pets'); if(ptChoices().length){ XPT.choice=true; render(); } } else if(window.Screens) Screens.close(); },0); },
  onClose(){ } });
if(PANEL_ON.pets) Panels.enable('eggpick');
