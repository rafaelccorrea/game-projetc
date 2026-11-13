'use strict';
/* ================= BATALHA V2 (3 ataques, efeitos, mão na arma) =================
   Depende de: dados/estado do index.html (S, RAR, ERAS, SKIN, track, toast, snd, vib...). */
/* GUARDA (Engenheiro 5): se o js/preload.js não carregou (lista de scripts antiga, arquivo faltando), o jogo abre do mesmo jeito com um carregador mínimo
   de mesma API (caminho antigo: onload, sem decode, sem nova tentativa). Nenhuma chamada a Preload pode impedir a batalha de abrir. */
const PRE_MINI=(function(){ const C=new Map(), lim=(p,ms)=>new Promise(ok=>{ let d=false; const t=setTimeout(()=>{ if(!d){ d=true; ok(false); } },ms); Promise.resolve(p).then(v=>{ if(!d){ d=true; clearTimeout(t); ok(v); } },()=>{ if(!d){ d=true; clearTimeout(t); ok(false); } }); });
  const get=u=>{ let e=C.get(u); if(e) return e; e={url:u,json:/\.json(\?|$)/i.test(u),img:null,data:null,ok:false,fail:false,p:null}; C.set(u,e);
    e.p=e.json?Promise.resolve().then(()=>fetch(u,{cache:'no-cache'})).then(r=>r.ok?r.json():null).then(j=>{ if(j){ e.data=j; e.ok=true; } else e.fail=true; return e; },()=>{ e.fail=true; return e; })
      :new Promise(ok=>{ const im=new Image(); im.onload=()=>{ e.img=im; e.ok=true; ok(e); }; im.onerror=()=>{ e.fail=true; ok(e); }; im.src=u; });
    return e; };
  const T={done:0,total:0}, ready=us=>{ const es=(Array.isArray(us)?us:[us]).filter(u=>typeof u==='string'&&u).map(get); return Promise.all(es.map(e=>e.p)).then(()=>{ const failed=es.filter(e=>!e.ok).map(e=>e.url); return {ok:!failed.length,failed}; }); };
  const M={ready,get,has:u=>{ const e=C.get(u); return !!(e&&e.ok); },image:u=>{ const e=get(u); return e.ok?e.img:null; },json:u=>{ const e=get(u); return e.ok?e.data:null; },retry:()=>Promise.resolve({ok:true,failed:[]}),drop:u=>C.delete(u),
    track:x=>{ if(Array.isArray(x)){ x.forEach(u=>M.track(u)); return; } T.total++; const fin=()=>{ T.done++; }; (typeof x==='string'?get(x).p:Promise.resolve(x)).then(fin,fin); },reset:()=>{ T.done=0; T.total=0; },
    all:(ps,ms)=>lim(Promise.all(ps).then(()=>true),ms>0?ms:30000),limit:lim,get progress(){ return {done:T.done,total:T.total,failed:[]}; },slow:0,cold:false,mini:true,size:()=>C.size};
  return M; })();
/* PRE() = o carregador em uso: o window.Preload completo (js/preload.js) ou, se ele faltar ou vier incompleto (sem get), o mínimo acima. TODA chamada do jogo passa por aqui. */
let PRE_WARN=false;
function PRE(){ const P=typeof window!=='undefined'?window.Preload:null; if(P&&typeof P.get==='function'&&typeof P.track==='function') return P; if(!PRE_WARN){ PRE_WARN=true; try{ console.warn('Preload ausente ou incompleto: usando o carregador mínimo (caminho antigo)'); }catch(e){} } return PRE_MINI; }
const cv=document.getElementById('cv'); let ctx=cv.getContext('2d'); const mainCtx=ctx;
const LW=330, PX=LW/390, HX=108*PX;   // PX: px do protótipo (tela de 390) → px lógicos. Herói: caixa de 176 px em x=20..196 (centro 108)          // mundo lógico: largura fixa, altura variável (retrato)
/* GEOMETRIA DO PROTÓTIPO (PO, rodada 7): tela 390x844 = HUD y 0..64 · CAMPO y 64..768 (704) · abas y 768..844. O canvas (#cv) ocupa SÓ o campo
   (#stage). LINHA DOS PÉS = 0,78 do campo (549 de 704 = y 613 da tela). Em outra proporção de tela vale a mesma fração do campo. */
/* TELA CHEIA (única desde a v0.12.2): a cena ocupa a tela inteira, pés em y=640 de 844 e quadro do Kael de 176 px, como no protótipo. */
/* 04b: LIMITE DIREITO DOS SLOTS dos comuns, em px da tela de 390. A coluna direita de ícones do protótipo atual começa em x=325 e vai de y=150 a 522;
   os comuns (até 122 px, pés em 640) ficam abaixo dela, por isso hoje o limite é a borda de sempre (382). Se a V2 dos ícones descer a coluna, baixe aqui. */
const FB_SLOT_XMAX=382;
const FIELD_FEET=640/844, HERO_FRAME=176/844;   // HERO_FRAME: lado do quadro do herói em fração da altura do campo (186 px em 704; boneco ~160 px), como no cenário v2
let LH=600, GY=LH*FIELD_FEET;        // GY = linha do chão (interpolada na troca de aba)
function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,2);   /* v0.12.2 (desempenho no S24): teto 2. A tela cheia tem 20% mais pixels que o campo antigo; 2,5 custava caro em aparelho de DPR alto */
  const cw=cv.clientWidth, ch=cv.clientHeight; if(!cw||!ch) return;
  cv.width=Math.round(cw*dpr); cv.height=Math.round(ch*dpr);
  const first=!cv.dataset.ok; cv.dataset.ok=1; LH=ch/(cw/LW); if(first) GY=LH*FIELD_FEET;
  HS=Math.max(124,Math.min(168,LH*HERO_FRAME));   // herói ~160 px de altura numa tela de 390x844 (quadro de 183 px), como no cenário v2
  mainCtx.setTransform(cv.width/LW,0,0,cv.width/LW,0,0);
  { const app=document.getElementById('app'); if(app) app.style.setProperty('--apph',app.clientHeight+'px'); }
}
addEventListener('resize',resize);

/* ---------- balanceamento (docs/balance.json sobrescreve o que existir com o mesmo nome) ---------- */
/* balance v7.3 (docs/balance.json, bloco "BAL", autorizado pelo PO): eraBossHpMult 1,1 · eraBossDmgMult 0,9 · eraMult 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161; o resto vem da v6; o arquivo sobrescreve as chaves de mesmo nome.
   NÃO usados da v6 (regra do dono mudou: nível é do ITEM, teto = nível do jogador): lvlMult, maxLvl, upCostBase, upCostGrowth, upCostRarity. */
const BAL={ commonHpMult:0.42, commonDmgMult:0.33, commonGoldMult:0.32, commonAtkInterval:1.2, commonDrop:0.035, enemyHpBase:22, enemyHpGrowth:1.282, enemyDmgBase:3.5, enemyDmgGrowth:1.282, bossHpMult:6, eraBossHpMult:1.1,
  eraMult:[0.944,0.777,1.44,4.2,16.1,53.2,161], itemEraFactor:12, priceEraFactor:4, sellBase:8, pullPity:10,
  bossDmgMult:1.8, eraBossDmgMult:0.9, earlyEase:[], earlyDmg:[], earlyBossDmg:[], s1Interval:0.8, s2Cooldown:6, s2Mult:3, s3Mult:10,
  energyPerHit:4, energyPerSkillHit:2, energyPerHurt:3, critChance:0.12, critMult:2, goldBase:4, goldGrowth:1.15, bossGoldMult:5,
  offlineCapHours:8, offlineKillsPerMin:6, offlineRate:0.5,
  /* CURA DO HERÓI (P0 do dono, 14/11: "quando derrotar um BOSS a vida regenera"). waveHeal = parte da vida máxima que volta depois de cada onda COMUM vencida;
     depois da onda do CHEFE não há cura (a fase nova começa com a vida que sobrou). bossChallengeHeal = quanto volta ao DESAFIAR o chefe (botão ou automático):
     antes era a vida CHEIA (1); agora é a mesma cura de uma onda. Derrota e "tentar de novo" continuam com a vida cheia. */
  waveHeal:0.08, bossChallengeHeal:0.08 };
function loadBalance(){
  fetch('docs/balance.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{ if(!j) return;
    const src=Object.assign({},j,j.BAL||{},j.combat||{},j.combate||{},j.offline||{});
    /* as tabelas de XP do Sys.level NÃO são mais sobrescritas aqui: o js/sys/level.js já traz os números do balance.json (remendo da rodada 6 retirado) */
    try{ const t=j.tower&&j.tower.fc_mediana_do_gratis_no_fim_de_cada_era; if(Array.isArray(t)&&t.length>=7&&t.every(v=>typeof v==='number'&&v>0)){ REC_FC=t.slice(0,Math.max(7,ERAS.length));   /* o balance.json pode trazer 9 valores (eras 7-8): com a chave desligada valem só os 7 primeiros */ if(typeof ERA9!=='undefined') ERA9.fcDer=false; } }catch(e){}   // FC recomendada por era (modo farm e tela de derrota)
    for(const k in BAL){ const v=src[k]; if(Array.isArray(BAL[k])?Array.isArray(v):(typeof v==='number'&&isFinite(v)&&v>0)) BAL[k]=v; }
    if(typeof diffBal==='function') diffBal(j.dificuldade);   /* dificuldade com paredes (js/diff.js, chave desligada): a tabela é lida daqui, nunca copiada para o código */
    if(typeof era9Bal==='function') era9Bal();   /* eras 7-8 (js/eras9.js): o arquivo traz 7 valores de eraMult e de FC recomendada; os das eras 7-8 seguem a regra das eras de trás */
  }).catch(()=>{});
}
if(typeof era9Bal==='function') era9Bal();   /* eras 7-8 jogáveis (js/eras9.js): eraMult e FC recomendada das duas eras novas, sem tocar nas eras 0-6 */

const SKN=[['Golpe Sísmico','Fúria do Mamute'],['Estocada Tripla','Ira do Olimpo'],['Corte Giratório','Lâmina do Dragão'],
  ['Tiro Duplo','Salva de Canhões'],['Rajada a Vapor','Tempestade Tesla'],['Rajada Tática','Ataque Aéreo'],['Corte de Plasma','Colapso do Vazio'],
  ['Garra Sombria','Portão do Submundo'],['Lâmina Celeste','Juízo Celestial']];   /* eras 7 (Submundo) e 8 (Celestial): nomes APROVADOS pelo PO; folhas era7_ult / era8_ult */
const S2HITS=[[[.55,1]],[[.2,1],[.45,1],[.7,1]],[[.3,1],[.55,1],[.8,1]],[[.15,1],[.5,1]],
  [[.15,1],[.31,1],[.47,1],[.63,1],[.79,1]],[[.1,1],[.24,1],[.38,1],[.52,1],[.66,1],[.8,1]],[[.4,1],[.6,1]],[[.4,1],[.6,1]],[[.3,1],[.55,1],[.8,1]]];   // eras 7 e 8: provisório (iguais às 6 e 2)
const S2DUR=[.95,.95,1.05,.8,1,1,.95,.95,1.05];
const ULT_HITS=[[.8,.125],[1.05,.125],[1.3,.125],[1.55,.125],[1.9,.5]], ULT_DUR=2.4;

const BOSS_FALL_DUR=1.4;   // chefe tombando (sem folha de morte ligada)
const B={hero:null,enemy:null,fx:[],t:0,speed:1,deadT:0,swing:0,hurt:0,parts:[],rings:[],corpses:[],wfx:[],shake:0,cam:0,tr:null,
  dispEra:eraOf(S.stage),paused:true,tipW:null,cd2:0,energy:0,act:null,slow:0,dim:0,banner:null,step:0,
  en:[],toSpawn:[],spawnT:0,spawnN:0,waveT:0,running:true,holdT:0,reach:HX+74,at:0,eshots:[],eAtkT:-9};   // reach = borda direita do herói + arma em repouso
/* v0.12.3: a arma nova só entra na mão quando a arte dela (sprite da arma e, se for pistola, as 3 folhas) já carregou; até lá fica a ANTERIOR
   (nunca mão vazia). Se a arte não chegar em 4 s, troca assim mesmo. */
const HLK={cur:null,req:null,t0:0};
function lookReady(w){ if(!SPR(wPng(w),'weapon')) return false; const pe=typeof pistolEra==='function'?pistolEra(w):-1; return pe<0||pistolReady(pe); }
/* ARMA PELA FAMÍLIA (Engenheiro 5; decisão do dono: arma e ultimate nunca mudam com a era do mapa). Sem skin de arma escolhida, a arma na mão sai da
   FAMÍLIA do item equipado (Sys.stats.weaponType: it.wt gravado; item antigo = pela arte dele): família com arte de era → a skin 'w<artEra><raridade>'
   de sempre; ARCO e BUMERANGUE (sem arte de era; só com a família LIGADA no módulo, DATA.weaponTypes[t].on) → objeto próprio, um por raridade:
   {wk: chave do meta.json e do PNG (bow_epico...), wt, style 'ranged'|'return', fam: a entrada do módulo (reach, pierce, hits), e: era de reserva
   (fromEra) para nome, som, ícone e efeitos em código}. Com a família desligada nada disto é criado (um teste por quadro). */
const WARM={}, W_FKEY=['basico','raro','epico','mitico','lendario'];
function wItemNow(){ return (S.eq&&S.eq.weapon?itemOf(S.eq.weapon):null)||null; }   /* decisão do dono: vale SEMPRE o item equipado (S.skinEq.weapon é ignorado) */
function wFamLook(w){ const it=wItemNow(); if(!it||!(window.Sys&&Sys.stats&&typeof Sys.stats.weaponType==='function')) return w;
  try{ const t=Sys.stats.weaponType(it), W=Sys.stats.DATA.weaponTypes[t]; if(!W) return w; const r=Math.max(0,Math.min(4,it.r|0));
    if(W.artEra!=null) return SKIN('w'+W.artEra+r)||w;
    if(W.on!==true||(W.style!=='ranged'&&W.style!=='return')) return w;
    const k=t+'_'+W_FKEY[r]; return WARM[k]||(WARM[k]={id:'wf_'+k,slot:'weapon',e:Math.max(0,Math.min(6,W.fromEra|0)),r,wk:k,wt:t,style:W.style,fam:W,n:W.name});
  }catch(e){ return w; } }
/* o que vai para o Sys.stats (ultOf/skillFx): o ITEM equipado (família e raridade de verdade, Divino inclusive); com skin de arma escolhida, a skin */
/* Engenheiro 10: enquanto a arma nova espera a arte (wSkin segura a ANTERIOR na mão por até 4 s), a ultimate e o efeito por raridade seguem a arma que está NA MÃO
   (HLK.arm = o item que valia quando ela entrou), não o item recém-equipado: antes saía a ultimate da família nova com a arma antiga na mão. */
const wArm = () => { const w=wSkin(); if(WS_W!==HLK.cur) return HLK.arm||w; return wItemNow()||w; };
/* DESEMPENHO (Engenheiro 7): a aparência do herói (heroLook: 3 buscas em SKINS, 2 em S.inv, Sys.stats.wingOf, Sys.mount.battleInfo) era refeita a CADA chamada
   de wSkin()/draw(), várias vezes por quadro. lookNow() guarda o resultado por ESTADO (espaços de arma/asa, skins, herói, montaria e estrelas, asa escondida) e
   por no máximo 200 ms (mesma folga do heroForm e do petInfo: item transformado no mesmo espaço aparece em até 0,2 s). SÓ LEITURA: quem altera o objeto
   devolvido (vitrine) continua chamando heroLook(). */
const LKC={v:null,t:-1e9,k:''}; let WS_LK=null, WS_W=null;
function lookNow(){ const now=performance.now(); let k=''; try{ const e=S.eq||{}, q=S.skinEq||{}, y=S.sys||{}, m=y.mount, ap=y.appearance;
    k=e.weapon+'|'+e.wing+'|'+q.weapon+'|'+q.armor+'|'+S.hero+'|'+(m?m.eq+':'+(m.owned&&m.owned[m.eq]?m.owned[m.eq].stars|0:0):'')+'|'+(ap?(ap.skin&&ap.skin.wing)+':'+(ap.hidden&&ap.hidden.wing):''); }catch(er){ k=''; }
  if(LKC.v&&k&&k===LKC.k&&now-LKC.t<200&&now>=LKC.t) return LKC.v; LKC.k=k; LKC.t=now; return LKC.v=heroLook(); }
const wSkin = () => { const lk=lookNow(); let w; if(lk===WS_LK) w=WS_W; else { w=wFamLook(lk.weapon); WS_LK=lk; WS_W=w; } if(w!==HLK.cur){ if(HLK.req!==w){ HLK.req=w; HLK.t0=performance.now(); }
    if(!HLK.cur||lookReady(w)||performance.now()-HLK.t0>4000){ HLK.cur=w; HLK.arm=wItemNow(); } } return HLK.cur; };   // arma NA MÃO: skin escolhida, senão o item equipado (heroLook, index.html)
const fxCol = () => { const r=wSkin().r; return r>0?RAR[r].c:'#ffffff'; };
/* POSE PELA FAMÍLIA: Sys.stats.weaponStyle (melee | gun | ranged | return); sem o módulo, o tipo do meta.json da arma (conferido: os dois dizem o mesmo nas 35 armas de era) */
const wIsGun0 = ws => { if(ws.wk) return false;   /* arco e bumerangue: pose de golpe, projétil por código */
  try{ if(window.Sys&&Sys.stats&&typeof Sys.stats.weaponStyle==='function') return Sys.stats.weaponStyle({look:ws.e,e:ws.e,r:ws.r})==='gun'; }catch(e){}
  const m=J('assets/weapons/meta.json')[wKey(ws)]; return m&&m.type?m.type==='gun':(ws.e>=3&&ws.e<=5)||(ws.e===6&&tierOf(ws.r)===0); };
const wIsGun = ws => wIsGun0(ws)&&(ws.e!==4||ART_ON.pistol_era4===true);   /* v0.12.3: arma de fogo só com a PISTOLA APROVADA (eras 3, 5 e 6; era 4 atrás da chave ART_ON.pistol_era4). Sem ela, golpe corpo a corpo (pose de espada) */

/* ---------- horda: fábrica de inimigos, ondas e saque (pontos de extensão: mkEnemy, waveSpec, lootFor) ---------- */
function mkEnemy(stage,kind){   // kind: 'e0' | 'e1' | 'boss'
  const era=eraOf(stage), boss=kind==='boss', eraBoss=boss&&stage%STAGES_PER_ERA===0, ease=BAL.earlyEase[stage-1]||1;
  const kinds=ERAS[era].en, k=kinds[(kind==='e1'?1:kind==='boss'?kinds.length-1:0)%kinds.length], key=`era${era}_${kind}`;
  const em=BAL.eraMult[era]||1;   // dificuldade por era (v6): multiplica vida E dano
  const dx=typeof diffEnemy==='function'?diffEnemy(stage,kind,null):null;   /* dificuldade com paredes (js/diff.js): com a chave DESLIGADA vem null e vale a conta de sempre */
  const hp=dx?dx.hp:em*BAL.enemyHpBase*Math.pow(BAL.enemyHpGrowth,stage-1)*ease*(boss?BAL.bossHpMult*(eraBoss?BAL.eraBossHpMult:1):BAL.commonHpMult);
  const dmg=dx?dx.dmg:em*BAL.enemyDmgBase*Math.pow(BAL.enemyDmgGrowth,stage-1)*(ease<1?0.7:1)*(boss?BAL.bossDmgMult*(eraBoss?BAL.eraBossDmgMult:1):BAL.commonDmgMult)*((boss?BAL.earlyBossDmg:BAL.earlyDmg)[stage-1]||1);   /* P0 do dono (inimigo tirando só "-1" e começo fácil): multiplicador SÓ DE DANO por fase, da Sistemas (docs/balance.json earlyDmg nos comuns, earlyBossDmg no chefe; fase sem valor = 1). A reserva do earlyEase no código passou a 1: o valor que vale é o do arquivo (só vida) */
  const gold=Math.max(1,Math.ceil(BAL.goldBase*Math.pow(BAL.goldGrowth,stage-1)*(boss?BAL.bossGoldMult:BAL.commonGoldMult)));
  return {kind,key,boss,eraBoss,maxhp:hp,hp,dmg,gold,atkEvery:boss?1.15:BAL.commonAtkInterval,atkT:0.5+Math.random()*0.7,
    id:B.spawnN++,x:WAITX,slot:WAITX,lane:0,idx:9,sc:1,wt:Math.random()*2,parked:false,dead:false,hit:0,sw:0,seed:Math.random()*6,spd:EN_WALK,
    name:(boss&&typeof era9Boss==='function'&&era9Boss(era))||(eraBoss?'Senhor da Era '+k.n:boss?'Chefe '+k.n:k.n),col:eraBoss?'#7a1020':boss?'#c0392b':k.c,size:eraBoss?1.7:boss?1.45:1,kindName:k.n,shape:k.s,spr:`assets/enemies/${key}.png`,...(dx?{diff:true}:null)};
}
function waveSpec(stage,wave){
  if(wave===5) return ['e0','e1','boss'];
  const inEra=((stage-1)%STAGES_PER_ERA)+1, n=Math.min(7,3+Math.floor(inEra/3)+(wave>=3?1:0)), a=[];
  for(let i=0;i<n;i++) a.push((i+stage+wave)%2?'e1':'e0');
  return a;
}
function lootFor(e){ return {gold:e.gold, dropChance:e.boss?1:BAL.commonDrop}; }
function startWave(delay){
  B.en=[]; B.toSpawn=waveSpec(S.stage,S.wave); B.waveN=B.toSpawn.length; B.spawnT=delay==null?0.4:delay; B.enemy=null; B.waveT=0; B.bossT0=S.wave===5?Date.now():0; preloadAssets();
}
/* ATRIBUTOS NA BATALHA (ponto único): tudo vem de heroStats() = Sys.fc.stats. Golpe = ATK × mult × (1 + dano crítico, se critar) × (1 − redução
   da DEF do alvo), pelo Sys.stats.hit; a DEF do herói reduz o dano recebido pela mesma fórmula; a velocidade de ataque encurta o básico. */
function heroApply(h,st){ h.maxhp=st.hp; h.atk=st.atk; h.def=st.def||0; h.critRate=st.critRate||0; h.critDmg=st.critDmg==null?100:st.critDmg; h.aspd=st.aspd||0;
  h.ivl=(window.Sys&&Sys.stats)?Sys.stats.interval(st):BAL.s1Interval; }
function startBattle(){
  const st=heroStats();
  B.hero={hp:st.hp,atkT:0.3}; heroApply(B.hero,st);
  B.deadT=0; B.act=null; startWave();
}
function refreshHero(){
  const st=heroStats(); if(!B.hero) return;
  const pct=B.hero.hp/B.hero.maxhp; heroApply(B.hero,st); B.hero.hp=Math.max(1,st.hp*pct);
}
function floatText(x,y,txt,col,big){ B.fx.push({x:x+(Math.random()-.5)*14,y,txt,col,t:0,big}); }
function burst(x,y,col,n,sp){ sp=sp||1; if(typeof FP!=='undefined'&&FP.q) n=Math.max(1,Math.round(n*PART_Q[FP.q]));   /* qualidade adaptativa: menos partículas por estouro */ for(let i=0;i<n;i++) B.parts.push({x,y,vx:(Math.random()-.5)*150*sp,vy:(-Math.random()*120-20)*sp,g:320,t:0,life:.5+Math.random()*.35,col:Math.random()<.35?'#ffffff':col,sz:2+Math.random()*3,glow:Math.random()<.4}); }
function dust(x,y,n,col){ for(let i=0;i<n;i++) B.parts.push({x:x+(Math.random()-.5)*10,y,vx:(Math.random()-.5)*40-(B.running?RUNV()*0.85:0),vy:-10-Math.random()*26,g:30,t:0,life:.45+Math.random()*.3,col:col||'#d8c8a8',sz:3+Math.random()*3,glow:false}); }
function ring(x,y,col,max){ B.rings.push({x,y,t:0,col,max:max||26}); }
function wfx(fn,dur,o){ o=o||{}; o.fn=fn; o.dur=dur; o.t=-(o.delay||0); B.wfx.push(o); return o; }

/* drops, ouro e XP do abate: js/farm.js (Sys.loot.onKill) */

/* ---------- fila, alcance e alvo ---------- */
const LANEY=[0,0,0];                                  // sem faixas de profundidade: todos na mesma linha do chão
/* LAYOUT DO PROTÓTIPO DA BATALHA (PO, campo 390 de largura): 3 comuns em profundidade com sobreposição parcial, z-order frente > meio > fundo.
   frente x=194 (~98 px de altura) · meio x=246 (~116 px) · fundo x=298 (~92 px); todos com os pés na mesma linha. */
/* DECISÃO FINAL DO PO (rodada 7): centros em 222 / 282 / 338; sobreposição máx. 40% (frente×meio) e 50% (meio×fundo), medida sobre a largura
   do mais estreito do par; altura mínima 95 / 95 / 85 (o do fundo encolhe até 85 antes de sobrepor mais); nada passa de x=382; pés na mesma linha. */
const SLOTX=[222,282,338].map(v=>v*PX),   /* 04b (PO): a V2 dos ícones deixa livre a faixa direita x 300-390, y 400-650; os centros são os mesmos do jogo */
   SLOTMIN=[95,95,85].map(v=>v*PX), SLOT_OVL=[0.45,0.5], MAXVIS_ALL=3;
let MAXVIS=MAXVIS_ALL;   // 3 visíveis; cai para 1 na onda em que uma espécie larga demais não cabe (ver SOLO_WIDE)
/* ESPÉCIE LARGA (PO): mínimo de altura próprio; se mesmo no mínimo não couber nas sobreposições, entra SOZINHA (1 visível, o resto no "+N").
   Hoje só o Drone da era 5 (a arte será refeita mais estreita; quando chegar, tirar a entrada). */
const heroEdge=()=>HERO_EDGE+Math.max(typeof mountFront==='function'?mountFront():0,typeof petFront==='function'?petFront():0);   // v0.12.7: o inimigo da frente guarda a folga a partir da montaria/do pet, não só do corpo do Kael
const SOLO_WIDE={ era5_e0:{minH:80*PX} }, HERO_EDGE=150*PX, HERO_GAP=32*PX, HERO_REACH=4*PX, HERO_SHIFT_MAX=110*PX, HERO_BACK_MIN=80*PX, HERO_FRONT_K=1.10/1.20;   // folga de 32 px do corpo do Kael parado (QA pediu 30-40); fundo até 80 px; frente até a escala 1,10   // HERO_EDGE: borda direita do corpo do Kael parado; HERO_GAP: respiro mínimo até o inimigo da frente
function waveVis(){ const keys=new Set(B.toSpawn.concat(B.en.map(e=>e.kind)).map(k=>`era${eraOf(S.stage)}_${k}`));
  for(const k of keys){ const W=SOLO_WIDE[k]; if(!W) continue; const sp=SPR(`assets/enemies/${k}.png`,'enemy'), w=W.minH*(sp?sp.w/sp.h:2);
    if((w+60*PX)/2-(SLOTX[1]-SLOTX[0])>SLOT_OVL[0]*Math.min(w,60*PX)) return 1; } return ERA_VIS[eraOf(S.stage)]||MAXVIS_ALL; }
/* v0.12.3 (PO): nas eras de bicho largo só 2 comuns visíveis por vez (com 3, a folga de 32 px do Kael levava a sobreposição atrás a 64-88%). O total da onda não muda: os outros entram conforme morrem. */
const ERA_VIS={0:2,1:2,4:2};
/* ALTURA POR ESPÉCIE (e0 98 px, e1 106 px), fixa durante a vida do inimigo; o slot do fundo desenha a 0,9 (profundidade). Antes a altura era
   do SLOT (100/116/95): a cada passo na fila o inimigo crescia e encolhia ~20%, com a cabeça subindo e descendo: era o "pulo de pato". */
const KINDH={e0:98*PX,e1:106*PX}, BACK_SC=0.9, SLOTH=[KINDH.e0,KINDH.e1,KINDH.e0*BACK_SC];
/* ESCALA POR INIMIGO (pedido do dono via PO, v0.11.3): só por código, a arte aprovada não muda. Multiplica a ALTURA-alvo; como tudo é desenhado a partir
   do pé (linha do chão) e a largura, a sombra, a barra de vida, o nome, o ponto de impacto, os efeitos e a passada da corrida saem de e.dh / e.dw,
   tudo acompanha. Limites que continuam valendo DEPOIS da escala: comum nunca mais alto que o Kael (heroBodyH), nada passa de x=382, sobreposição
   máxima 45% / 50% (o hordeFit encolhe quem tem mais folga) e chefe dentro da caixa 190..382. Para ajustar: mude o número aqui.
   Debug: window.__noScale = true ignora a tabela (prints de antes/depois). */
/* v0.11.4 (PO): TAMANHO PADRONIZADO NAS 7 ERAS. Comuns: alvo 118 px (e0) e 122 px (e1) de altura opaca (~75% do Kael, 158 px; nunca acima dele).
   Chefes: alvo >= 165 px. O que não cabe nas caixas do contrato é reduzido pelo hordeFit (comuns) ou pela largura da caixa (chefes). */
const EN_SCALE={ era0_e0:1.20, era0_e1:1.15, era0_boss:1.00, era1_e0:1.20, era1_e1:1.15, era1_boss:1.10, era2_e0:1.20, era2_e1:1.15, era2_boss:1.10,
  era3_e0:1.20, era3_e1:1.15, era3_boss:1.10, era4_e0:1.20, era4_e1:1.15, era4_boss:1.10, era5_e0:1.20, era5_e1:1.15, era5_boss:1.10, era6_e0:1.20, era6_e1:1.15, era6_boss:1.10 };
/* chefes que podem usar a caixa LARGA do contrato (170..382): Dragão (era 2, decisão do PO), Tanque (era 5) e Devorador (era 6), para chegar a 165 px ou mais */
const BOSS_WIDE={ era1_boss:1, era2_boss:1, era5_boss:1, era6_boss:1 };   // v0.11.5: Minotauro também (PO)
/* ERA 4 (PO): sobreposição aceita até 55% só nessa era; a Aranha é larga: em vez de baixar a altura, o slot dela sobrepõe mais (altura mínima própria) */
const ERA_OVL={ 0:[0.55,0.55], 1:[0.55,0.55], 4:[0.55,0.55], 5:[0.55,0.55] },   /* v0.11.5 (PO): eras 0, 1 e 5 na mesma regra da 4 */
   EN_MINH={ era4_e0:115*PX, era4_e1:115*PX };
const enScale=e=>(DEBUG&&window.__noScale)?1:(EN_SCALE[e.key]||1);
const HERO_BODY_FRAC=0.848;   // altura opaca do Kael parado ÷ lado do quadro (medida na folha kael_idle_body: topo do cabelo até os pés)
const heroBodyH=()=>{ const p=(typeof phaseBodyH==='function')?phaseBodyH():0; return p>0?p:HS*HERO_BODY_FRAC; };   /* por fase (adolescente, adulto, guerreiro): altura medida na folha parada × escala da fase */
const slotMin=(e,i)=>SOLO_WIDE[e.key]?SOLO_WIDE[e.key].minH:(!(DEBUG&&window.__noScale)&&EN_MINH[e.key])?EN_MINH[e.key]*(i===MAXVIS_ALL-1?BACK_SC:1):SLOTMIN[i];
const slotH=(e,i)=>Math.max(slotMin(e,i),Math.min(heroBodyH(),(KINDH[e.kind]||KINDH.e0)*(i===MAXVIS_ALL-1?BACK_SC:1)*enScale(e)));
/* ajuste dos comuns visíveis: centro (slot) e altura-alvo (dhT) de cada um, nesta ordem de prioridade:
   1) nada cortado (borda direita <= 382) · 2) altura mínima · 3) sobreposição máxima (encolhe quem tem mais folga, até o mínimo). */
function hordeFit(vis){
  const n=vis.length, H=[], A=[], X=[];
  for(let i=0;i<n;i++){ const sp=SPR(vis[i].spr,'enemy'); A[i]=sp?sp.w/sp.h:0.9; H[i]=slotH(vis[i],i); X[i]=SLOTX[i]; }
  const W=i=>H[i]*A[i];
  const XR=FB_SLOT_XMAX*PX;   // limite direito dos slots dos comuns (04b: constante própria)
  for(let i=0;i<n;i++){ const mw=2*(XR-X[i]); if(W(i)>mw){ H[i]=Math.max(slotMin(vis[i],i),mw/A[i]); if(W(i)>mw) X[i]=XR-W(i)/2; } }
  if(n===1&&SOLO_WIDE[vis[0].key]){ const HE=heroEdge(), Wm=BOSS_X1-HE; if(W(0)>Wm) H[0]=Math.max(slotMin(vis[0],0),Wm/A[0]); X[0]=Math.min(BOSS_X1-W(0)/2,Math.max(X[0],HE+W(0)/2)); }   /* sozinho: usa a largura inteira entre o herói e x=382 (o centro vai para a direita) antes de encolher */
  /* COMUNS: golpe, dano e morte também ficam dentro de x<=382 pela POSIÇÃO DO SLOT (PO): se um quadro dessas folhas passa da borda, o centro do slot recua;
     o corpo não desliza por quadro. enExt = quanto a parte opaca dessas folhas passa à direita da âncora, por px de altura. */
  const XB=X.slice(), EX=[]; for(let i=0;i<n;i++){ const ex=(EN_EXT_ON&&!(DEBUG&&window.__noExt))?enExt(vis[i],SPR(vis[i].spr,'enemy')):null; EX[i]=ex?ex.r:0; }
  const fitX=i=>{ X[i]=Math.min(XB[i],BOSS_X1-H[i]*EX[i]); };   // o centro recua só o que a folha mais larga pede NA ALTURA ATUAL (se a altura cai, o centro volta)
  for(let i=0;i<n;i++) fitX(i);
  for(let i=0;i<n-1;i++) for(let it=0;it<160;it++){ fitX(i); fitX(i+1);
    const o=((W(i)+W(i+1))/2-(X[i+1]-X[i]))/Math.min(W(i),W(i+1)); if(o<=(ERA_OVL[eraOf(S.stage)]||SLOT_OVL)[i]) break;
    const ma=slotMin(vis[i],i), mb=slotMin(vis[i+1],i+1), a=H[i]/ma, b=H[i+1]/mb, j=b>=a?i+1:i, mj=j===i?ma:mb; if(H[j]<=mj+0.01) break;
    H[j]=Math.max(mj,H[j]*0.985); }
  /* v0.12.2 (dono, visto no celular; números do QA/PO): o inimigo da FRENTE para com FOLGA VISÍVEL do corpo do Kael. A borda esquerda da parte opaca
     dele (sprite parado, centrado no slot) fica em HERO_EDGE + HERO_GAP ou mais à direita; no golpe, a ponta da folha de ataque entra no máximo
     HERO_REACH na borda do Kael. Os centros andam para a direita o que falta (os de trás juntos, até a borda de 382). Se com isso a sobreposição entre
     inimigos passar do limite da era, encolhe nesta ordem (PO): 1º só o do FUNDO, até HERO_BACK_MIN; 2º o da FRENTE, até HERO_FRONT_K da altura dele.
     O do meio não encolhe aqui. O que ainda sobrar fica como sobreposição entre inimigos (nunca corte, nunca em cima do herói). */
  if(n){ const XB0=X.slice(), H00=H[0], la=enExtL(vis[0],SPR(vis[0].spr,'enemy')), lim=ERA_OVL[eraOf(S.stage)]||SLOT_OVL;
    const place=()=>{ for(let i=0;i<n;i++) X[i]=Math.min(XB0[i],Math.max(XR-W(i)/2,XB0[i]-0)); const HE=heroEdge(), need=Math.max(HE+HERO_GAP+W(0)/2, la?HE-HERO_REACH+H[0]*la.l:0);
      if(X[0]<need){ const d=Math.min(need-X[0],HERO_SHIFT_MAX); for(let i=0;i<n;i++) X[i]=Math.max(X[i],Math.min(X[i]+d,XR-W(i)/2)); } };
    const ovl=i=>((W(i)+W(i+1))/2-(X[i+1]-X[i]))/Math.min(W(i),W(i+1));
    for(let it=0;it<80;it++){ place(); if(n<2) break; const bad=[]; for(let i=0;i<n-1;i++) if(ovl(i)>lim[i]+0.005) bad.push(i); if(!bad.length) break;
      const bk=n-1; if(bad.includes(bk-1)&&bk>=1&&H[bk]>HERO_BACK_MIN+0.01){ H[bk]=Math.max(HERO_BACK_MIN,H[bk]*0.985); continue; }
      if(H[0]>H00*HERO_FRONT_K+0.01){ H[0]=Math.max(H00*HERO_FRONT_K,H[0]*0.985); continue; }
      break; }
    B.front=X[0]; }
  for(let i=0;i<n;i++){ vis[i].slot=X[i]; vis[i].dhT=H[i]; }
}
const EN_IDLE_N=4, EN_IDLE_FPS=4;   // inimigo parado: os 4 primeiros quadros da folha de golpe, a 4 quadros/s (não há tabela da Arte por inimigo: valor único, a confirmar)
const WAITX=LW+110;
const EN_WALK=62, EN_STEP=120;   // px lógicos/s: entrada pela direita (constante, igual para todos) e passo de um slot para o outro (rápido, para ficar a maior parte do tempo parado e atacando)
/* ATAQUE DOS INIMIGOS (regra do PO): todo inimigo parado no slot ataca, com cadência própria (atkEvery) e defasado dos outros.
   Corpo a corpo: avanço rápido NO CHÃO até o herói, golpe e volta ao slot. De longe (tabela abaixo): projétil que voa até o herói
   e causa o dano ao chegar. EATK = duração da animação; EHIT = instante do golpe/disparo; EGAP = intervalo mínimo entre dois inimigos. */
const EATK=0.5, EHIT=0.2, EGAP=0.22;
const ENEMY_RANGED={ era2_boss:'fire', era3_e1:'bullet', era5_e0:'bullet', era5_e1:'bullet', era5_boss:'shell', era6_e0:'plasma', era6_e1:'plasma' };
const ESHOT_COL={fire:'#ff8a2a',bullet:'#ffe27a',shell:'#ffb040',plasma:'#b45cff'};
/* sprites que vieram virados para a DIREITA no arquivo: espelhados por código (inimigo sempre olha para a esquerda, para o herói) */
/* FLAG POR ARQUIVO (conferida abrindo cada imagem em 2026-11-12, rodada 7). EN_FLIP = sprite ESTÁTICO de assets/enemies/<chave>.png;
   EN_FLIP_SHEET = folha animada (caminho sem extensão). O Rex (era0_boss.png) hoje olha para a ESQUERDA no arquivo: sem flag.
   O Pirata (era3_e0.png) e o Tanque (era5_boss.png) continuam olhando para a DIREITA no arquivo: seguem espelhados por código.
   As folhas da era 0 (Dente-de-Sabre, Brutamontes, Rex) e da era 2 olham para a esquerda: nenhuma flag. */
const EN_FLIP={};   // reaberto em 2026-11-12 (parte 2): Rex, Pirata e Tanque JÁ olham para a esquerda no arquivo (a arte virou na fonte): nenhuma flag
const EN_FLIP_SHEET={};
function heroHit(d,src){   // dano no herói: pisca, número, som, clarão no golpe. Devolve true se o herói caiu.
  const h=B.hero; if(!h||B.deadT>0) return false;
  if(window.Sys&&Sys.stats) d=Sys.stats.hit({atk:d,critRate:0,critDmg:0},1,h.def,false).dmg;   // DEF do herói reduz o dano recebido (mesma fórmula do golpe, sem crítico)
  if(!window.__stay) h.hp-=d; B.hurt=0.15; if(src&&src.boss) B.shake=Math.max(B.shake,.3); snd('hero_hurt');   // golpe comum: SEM tremor de câmera (clarão + número + herói piscando); só o chefe treme, curto
  floatText(HX,GY-HS*0.9,'-'+fmt(Math.max(1,d)),'#ff6b6b'); burst(HX,GY-HS*0.45,'#ff4d4d',4); addEnergy(BAL.energyPerHurt);
  wfx(fnHit,0.22,{x:HX+HS*0.1,y:GY-HS*0.45,r:src&&src.boss?36:24,n:8,col:ULTCOL[B.dispEra]||'#ff6b5a',rot:Math.random()*6.28,layer:1,hero:1});   // impacto NO HERÓI, na cor da era (o golpe não viaja pela tela)
  if(DEBUG) window.__dmgIn=(window.__dmgIn||0)+d;
  if(h.hp<=0){ h.hp=0; B.streak=0; B.deadT=1.6; B.act=null; B.toSpawn=[]; B.eshots=[]; B.deadBoss=S.wave===5&&!B.inst; snd('defeat'); if(!B.deadBoss&&!B.inst) toast((typeof diffDeadMsg==='function'&&diffDeadMsg())||'Derrotado... recomeçando a fase');   /* na instância o aviso é o resultado da instância, não o da fase */ return true; }
  return false;
}                                   // fila de espera, fora da tela (selo "+N" na borda direita)
const contact = e => e.boss?bossSlot(e):Math.max(SLOTX[0],B.front||0);   // B.front: centro real do slot da frente (hordeFit pode levá-lo para a direita)   // posição de luta (protótipo: o da frente fica em x=194 e o chefe pode encostar no herói)
const eY = e => GY+LANEY[e.lane]-(e.dh||80)*0.5;
const heroGun = () => wIsGun(wSkin());
/* ALCANCE do herói em x (0 = corpo a corpo): arma de fogo HX+230 (como sempre); arco/bumerangue = distância do slot da frente × reach do módulo (1 = encosta) */
const heroRange = () => { const ws=wSkin(); if(ws.fam&&ws.fam.reach>1) return HX+(SLOTX[0]-HX)*ws.fam.reach; return wIsGun(ws)?HX+230:0; };
/* REGRA DO CHEFE (decisão do PO; ponto único para trocar): as escoltas vêm primeiro e o chefe conta no selo "+N"; quando elas morrem,
   o chefe entra andando pela direita e para num slot PRÓPRIO, centralizado na metade direita do campo, inteiro na tela (margem EDGE). */
const BOSS_AFTER_ESCORTS=true, EDGE=8*PX, BOSS_X0=190*PX, BOSS_X0MIN=170*PX, BOSS_X1=382*PX;   // caixa do chefe no protótipo: x=190..382 (8 px da borda)
const BOSS_FIT = () => BOSS_X1-BOSS_X0;
function bossSlot(e){ const w=Math.min(e.dw||BOSS_FIT(),BOSS_X1-BOSS_X0MIN); return w>BOSS_FIT()?BOSS_X1-w/2:(BOSS_X0+BOSS_X1)/2; }   // mais largo que a caixa (altura mínima): cresce para a esquerda, a borda direita não passa
function layoutHorde(){
  MAXVIS=waveVis(); B.front=0;
  const L=B.en;   /* ordem da fila = ordem de chegada (B.en); NÃO reordenar por x: com velocidades diferentes os inimigos trocavam de slot andando, aos trancos */
  const nv=Math.min(MAXVIS,L.length);
  for(let i=0;i<L.length;i++){ const e=L[i]; e.idx=i;
    if(i>=MAXVIS){ e.slot=WAITX; if(e.x<WAITX) e.x=WAITX; continue; }                 // o resto espera fora da tela
    { const edge=LW+(e.dw||70)*0.5+14; if(e.x>edge) e.x=edge; }                          // promovido: entra andando a partir da borda direita
    if(e.boss&&nv===1){ e.slot=bossSlot(e); continue; }
    e.slot=Math.min(SLOTX[i],BOSS_X1-(e.dw||70)*0.5); }
  const vis=L.slice(0,nv).filter(e=>!e.boss); if(vis.length===nv) hordeFit(vis);   /* nada cortado: sprite largo recua para caber em x<=382 (prioridade sobre os 40% de sobreposição) */                                                                  // comuns: posições fixas do protótipo
}
/* posição DESENHADA do inimigo (slot menos o avanço do ataque): sombra, barra, nome, números e efeitos usam esta, não o slot */
function eAdvK(e){ if(!(e.sw>0)) return 0; const D=e.swD||EATK, u=1-e.sw/D, hu=(e.swH||EHIT)/D; return u<hu?easeOut(u/hu):1-smooth((u-hu)/(1-hu)); }
/* corpo a corpo: avança NO CHÃO até a borda esquerda do sprite encostar na frente do corpo do herói (HX + 0,18·HS) e volta */
const EN_LUNGE=[12,12,12].map(v=>v*PX), EN_LUNGE_BOSS=10;   // AVANÇO MÁXIMO do golpe por slot (frente, meio, fundo), em px de tela: constante única (número a confirmar pelo PO)
function eAdv(e){ const k=eAdvK(e); return k?(ENEMY_RANGED[e.key]?-4*k:(e.boss?EN_LUNGE_BOSS:(e.idx===0&&enOn(e.key,'attack'))?0:EN_LUNGE[Math.min(e.idx,MAXVIS-1)])*k):0; }
/* herói: no golpe corpo a corpo avança até 12 px (de tela) no chão e volta; com arma de fogo e na ultimate fica no lugar */
const HERO_LUNGE=12*PX;
function heroLunge(){ const a=B.act; if(!a||a.gun||a.rg||a.type==='s3'||B.deadT>0) return 0; return HERO_LUNGE*Math.sin(Math.PI*Math.min(1,a.t/a.dur)); }
const eX = e => e.x-eAdv(e);
const inRange = (e,rg) => e.x<=Math.max(rg||0,contact(e)+8);          // rg = heroRange()
const inEngage = (e,rg) => e.x<=Math.max(rg?rg-20:0,contact(e)+6);
function target(){ const gun=heroRange(); for(const e of B.en) if(!e.dead&&inRange(e,gun)) return e; return null; }
function nearest(n){ const out=[], t=target(); if(!t) return out; for(const e of B.en){ if(!e.dead&&e.x<=t.x+110&&e.x<=LW+10){ out.push(e); if(out.length>=n) break; } } return out; }
function placeNow(){ layoutHorde(); for(const e of B.en){ e.x=e.slot; e.parked=true; e.hc=e.dhT||0; } }
const waitingN = () => B.toSpawn.length+Math.max(0,B.en.length-MAXVIS);

/* ---------- habilidades ---------- */
const engaged = () => !!(B.hero&&B.deadT<=0&&target());
function addEnergy(n){ const b=B.energy; B.energy=Math.min(100,b+n); if(b<100&&B.energy>=100){ snd('ult_ready'); vib(30); } }
/* ULTIMATE POR ARMA (v0.12.9, atrás de NEXT_ON): habilidade, ícone, nome e efeito vêm SEMPRE da era da arma na mão (wSkin = heroLook), nunca da era da
   fase. O efeito por RARIDADE é do módulo (só visual): Sys.stats.skillFx(arma, 's1'|'s2'|'s3') → {color, size, shake, flash, ...}. Sem o módulo, nada muda. */
function skFx(ws,type){ if(!NEXT_ON) return null; try{ return (window.Sys&&Sys.stats&&typeof Sys.stats.skillFx==='function')?Sys.stats.skillFx(ws,type):null; }catch(e){ return null; } }
function startAct(type){
  const ws=wSkin(), E=Math.min(SKN.length-1,ws.e), gun=wIsGun(ws), a={type,t:0,era:E,gun,col:fxCol(),hits:[],ev:[],dur:SWT}, lag=gun?0.09:0;
  { const fx=skFx(wArm(),type); if(fx){ a.fx=fx; if(typeof fx.color==='string'&&fx.color) a.col=fx.color; } }   /* o ITEM (família + raridade) vai ao módulo; a.fx.ult = Sys.stats.ultOf */
  const RG=(ws.wk&&ws.fam&&type!=='s3')?ws.fam:null;   /* arco / bumerangue: acertos e frações do módulo, projétil por código */
  if(RG){ rgAct(a,ws,RG,type); if(type==='s2'){ B.cd2=BAL.s2Cooldown; B.banner={txt:SKN[E][0],sub:'',t:0,dur:.9,col:a.col,small:true}; } }
  else if(type==='s1'){ { const tr=typeof heroTrailSheet==='function'?heroTrailSheet(ws):null; if(tr) a.trail=tr; }   /* golpe básico da era 2: folha composta com o rastro (s1-era2_t<tier>, aprovada) */
    a.hits.push({s:gun?0.03:0.19,t:(gun?0.03:0.19)+lag,m:1,i:0}); a.rate=B.hero&&B.hero.ivl>0?BAL.s1Interval/B.hero.ivl:1; }   // velocidade de ataque: o golpe básico inteiro toca mais rápido
  else if(type==='s2'){ const hs=S2HITS[E], sp=typeof heroSpinSheet==='function'?heroSpinSheet(ws):null, kd=sp?(sp.meta.frames/(sp.meta.fps||12))/S2DUR[E]:1; a.dur=S2DUR[E]*kd; if(sp) a.spin=sp;   /* Corte Giratório: a folha toca inteira (17 quadros a 12 fps) e os acertos acompanham */
    hs.forEach((h,i)=>a.hits.push({s:h[0]*kd,t:h[0]*kd+lag,m:BAL.s2Mult/hs.length,i,n:hs.length})); B.cd2=BAL.s2Cooldown;
    B.banner={txt:SKN[E][0],sub:'',t:0,dur:.9,col:a.col,small:true}; }
  else { a.dur=ULT_DUR; ULT_HITS.forEach((h,i)=>{ a.hits.push({s:h[0],t:h[0],m:BAL.s3Mult*h[1],i,fin:i===4}); a.ev.push({t:h[0]-0.3,i,fin:i===4,pre:true}); });
    ptrack('ult'); B.energy=0; B.slow=0.5; B.banner={txt:SKN[E][1]+'!',pill:true,t:0,dur:1.8,col:a.col}; S.ultTip=1; B.shake=Math.max(B.shake,.6*(a.fx&&a.fx.shake>0?a.fx.shake:1)); vib(40); ultStart(a); }
  if(gun&&type!=='s3') a.hits.forEach(h=>a.ev.push({t:h.s,h}));
  B.act=a; snd(`era${E}_${type}`);
  if(typeof tutEvent==='function') tutEvent(type);
  return a;
}
/* ===== ARCO E BUMERANGUE (Engenheiro 5; atrás de Sys.stats.DATA.weaponTypes.bow/boomerang.on, desligadas) =====
   Dano TOTAL do golpe igual ao da espada (s1 = 1 × ATK; s2 = BAL.s2Mult × ATK): cada acerto leva a FRAÇÃO de fam.hits.s1 / fam.hits.s2 do módulo.
   pierce = quantos inimigos da fila o projétil alcança (mínimo 1); o dano do acerto é DIVIDIDO entre os atingidos (não soma). Energia do básico
   repartida pelas mesmas frações (a ultimate enche no mesmo ritmo). Tempos em segundos da ação (o básico inteiro acelera com a velocidade de ataque):
   ARCO: solta a flecha em RG_BOW_S (a pose é a do golpe), voo RG_FLY; s2 = uma flecha por fração.
   BUMERANGUE: sai da mão em s, acerta na IDA e na VOLTA (um par de frações por arremesso) e volta à mão em e, sempre antes do fim da ação. */
const RG_FLY=0.10, RG_BOW_S=0.14, RG_BOOM=[0.08,0.19,0.30,0.38];   // bumerangue: sai · acerto da ida · acerto da volta · na mão
function rgAct(a,ws,W,type){
  const fr=(W.hits&&Array.isArray(W.hits[type])&&W.hits[type].length)?W.hits[type]:[1], tot=type==='s1'?1:BAL.s2Mult; a.rg=W; a.rgt=ws.wt; a.fly=[];
  if(ws.style==='ranged'){ const n=fr.length, gap=type==='s1'?0:0.25; a.dur=type==='s1'?SWT:Math.max(0.6,RG_BOW_S+gap*(n-1)+RG_FLY+0.31);
    fr.forEach((f,i)=>{ const s=RG_BOW_S+gap*i, h={s,t:s+RG_FLY,m:tot*f,i,n,ef:f}; a.hits.push(h); a.ev.push({t:s,h,rg:1}); }); }
  else { const n=Math.ceil(fr.length/2), T=RG_BOOM, per=type==='s1'?0:T[3]+0.07; a.dur=type==='s1'?SWT:Math.max(0.6,per*n+0.05);
    for(let j=0;j<n;j++){ const o=per*j, fl={s:o+T[0],e:o+T[3],p0:null,p1:null,tg:null}, hs=[]; a.fly.push(fl);
      [0,1].forEach(q=>{ const f=fr[j*2+q]; if(f==null) return; const h={s:fl.s,t:o+T[1+q],m:tot*f,i:j*2+q,n:fr.length,ef:f,fl}; a.hits.push(h); hs.push(h); });
      a.ev.push({t:fl.s,fl,rg:1}); } }
  if(type==='s1') a.rate=B.hero&&B.hero.ivl>0?BAL.s1Interval/B.hero.ivl:1;
}
const rgN = a => Math.max(1,a.rg.pierce|0);
function rgEvent(a,v){ const list=nearest(rgN(a)), tp=tipPos(), far=list.length?list[list.length-1]:null, col=a.col==='#ffffff'?'#ffe9c8':a.col;
  if(v.fl){ v.fl.tg=list; v.fl.p0={x:tp.x,y:tp.y}; v.fl.p1=far?{x:Math.min(far.x,LW-14)-4,y:eY(far)}:{x:Math.min(LW-20,heroRange()),y:GY-HS*0.4}; return; }   // bumerangue: destino = o mais longe que ele alcança
  v.h.tg=list; wfx(fnArrow,RG_FLY,{x0:tp.x,y0:tp.y,x1:far?Math.min(far.x,LW-10)-6:Math.min(LW-20,heroRange()),y1:far?eY(far):tp.y,col,layer:1}); }
function rgHit(a,h){ const tg=h.fl?h.fl.tg:h.tg, live=tg?tg.filter(e=>!e.dead):[], list=live.length?live:nearest(rgN(a)); if(!list.length) return;
  hitMany(list,h.m/list.length,a,h); }
/* flecha em código: haste + ponta + penas, rastro curto na cor da raridade; some ao acertar */
function fnArrow(o,k){ const x=o.x0+(o.x1-o.x0)*k, y=o.y0+(o.y1-o.y0)*k, an=Math.atan2(o.y1-o.y0,o.x1-o.x0); ctx.translate(x,y); ctx.rotate(an); ctx.lineCap='round';
  const g=ctx.createLinearGradient(-34,0,-8,0); g.addColorStop(0,o.col+'00'); g.addColorStop(1,o.col); ctx.strokeStyle=g; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-34,0); ctx.lineTo(-8,0); ctx.stroke();
  ctx.strokeStyle='#3a2410'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-17,0); ctx.lineTo(0,0); ctx.stroke(); ctx.strokeStyle='#d8b078'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-17,0); ctx.lineTo(0,0); ctx.stroke();
  ctx.fillStyle='#f4f4f4'; ctx.strokeStyle='#3a2410'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(4,0); ctx.lineTo(-2,-3); ctx.lineTo(-2,3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle=o.col; ctx.beginPath(); ctx.moveTo(-17,0); ctx.lineTo(-21,-3); ctx.lineTo(-14,0); ctx.lineTo(-21,3); ctx.closePath(); ctx.fill(); }
/* bumerangue no ar: o PRÓPRIO sprite da arma girando em torno do "center" do meta.json; vai até o alvo e VOLTA à mão (posição atual da mão, mesmo que o herói
   se mexa). Enquanto voa, a arma some da mão (boomOut). Acabou a ação (ou foi interrompida), ele está na mão: nada fica parado no ar. */
function boomNow(){ const a=B.act; if(!a||!a.fly||!a.fly.length) return null; for(const f of a.fly) if(f.p0&&a.t>=f.s&&a.t<f.e) return f; return null; }
const boomOut = () => !!boomNow();
function boomPos(f,u){ const hand=B.tipW||f.p0, k=u<0.5?easeOut(u*2):smooth((u-0.5)*2), A=u<0.5?f.p0:f.p1, Bq=u<0.5?f.p1:hand; return {x:A.x+(Bq.x-A.x)*k,y:A.y+(Bq.y-A.y)*k+(u<0.5?-9:7)*Math.sin(Math.PI*k)}; }
function drawBoom(){ const f=boomNow(); if(!f) return; const a=B.act, ws=wSkin(), w0=SPR(wPng(ws),'weapon'); if(!w0) return; const wm=J('assets/weapons/meta.json')[wKey(ws)]||{}, c=wm.center||[0.5,0.5];
  const kk=HS*0.5*(wm.scale||1)/Math.max(w0.w,w0.h), dw=w0.w*kk, dh=w0.h*kk, cx=((c[0]-w0.fx)/w0.fw)*dw, cy=((c[1]-w0.fy)/w0.fh)*dh, wimg=skinSpr(w0,ws.r), u=(a.t-f.s)/(f.e-f.s), col=a.col==='#ffffff'?'#ffe9c8':a.col;
  for(let j=3;j>=0;j--){ const uj=Math.max(0,u-j*0.045), p=boomPos(f,uj); ctx.save(); ctx.translate(p.x,p.y); ctx.rotate((B.at-j*0.012)*26); ctx.globalAlpha=j?0.22*(1-j/4):1;
    if(!j) drawGlow(col,0,0,dw*0.55,0.35); dspr(wimg,-cx,-cy,dw,dh); ctx.restore(); } }
/* arco: flecha encaixada na corda enquanto arma o tiro (dentro do desenho da arma, no espaço dela, a partir do nock). Chamado pelos 3 desenhos do herói. */
function wExtra(H,ws,a,nx,ny,len){ if(!a||!a.rg||ws.style!=='ranged') return; let to=1e9; for(const h of a.hits){ const d=h.s-a.t; if(d>0&&d<to) to=d; } if(to>0.17) return;
  ctx.save(); ctx.lineCap='round'; ctx.strokeStyle='#3a2410'; ctx.lineWidth=3.4; ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(nx+len,ny); ctx.stroke(); ctx.strokeStyle='#d8b078'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(nx,ny); ctx.lineTo(nx+len,ny); ctx.stroke();
  ctx.fillStyle='#f4f4f4'; ctx.beginPath(); ctx.moveTo(nx+len+5,ny); ctx.lineTo(nx+len-2,ny-3.5); ctx.lineTo(nx+len-2,ny+3.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
/* giro da arma na mão (rad): eixo da mão do quadro menos o ângulo nativo da arma (meta.json). ARCO: fica em pé (corda para o lado do herói), acompanhando a
   mão só até 18 graus: com a pose de golpe da espada ele não pode varrer como lâmina, e a flecha sai reta. */
function wAngOf(wm,G,gun){ const wang=typeof wm.angle==='number'?wm.angle:(gun?0:90); let d=G.ang-wang; if(wm.type==='bow'){ d=((d+180)%360+360)%360-180; d=Math.max(-18,Math.min(18,d)); } return -d*Math.PI/180; }
/* ponto especial da arma, em px do desenho a partir do grip: arco = nock (de onde a flecha sai); bumerangue = center (pivô do giro). null = arma comum */
function wSpot(wm,w0,dw,dh,gx,gy2){ const p=wm.type==='bow'?wm.nock:wm.type==='boomerang'?wm.center:null; return Array.isArray(p)?[((p[0]-w0.fx)/w0.fw)*dw-gx,((p[1]-w0.fy)/w0.fh)*dh-gy2]:null; }
function flushAct(){ const a=B.act; if(a) for(const hh of a.hits) if(!hh.done){ hh.done=true; skillHit(a,hh); } }
function useSkill(n){
  if(B.paused||!engaged()) return false;
  if(n===2){ if(B.cd2>0||(B.act&&B.act.type!=='s1')) return false; flushAct(); if(!engaged()) return false; startAct('s2'); return true; }
  if(n===3){ if(B.energy<100||(B.act&&B.act.type!=='s1')) return false; flushAct(); startAct('s3'); return true; }
  return false;
}
/* RECORDES DO PERFIL (Sys.profile da Sistemas; chave desligada = não chama nada): maior golpe, sequência de abates sem cair e tempo do chefe */
function profRec(k,v,info){ try{ const P=window.Sys&&Sys.profile; if(P&&P.DATA&&P.DATA.on===true&&typeof P.record==='function') P.record(S,k,v,Sys.host,info); }catch(e){} }
function killEnemy(e){
  e.dead=true; const i=B.en.indexOf(e); if(i>=0) B.en.splice(i,1);
  const lt=lootFor(e), y=eY(e); e.x=eX(e); e.sw=0;   // morre onde está desenhado
  if(B.inst){ B.inst.kills++; }   /* instância: sem drops de fase, sem XP, sem missão; o prêmio vem do Sys.instances.finish */
  else { S.kills++; ptrack('kill'); if(e.boss) ptrack('boss'); farmKill(e,y); B.streak=(B.streak||0)+1; profRec('streak',B.streak); }   // ouro, XP, gemas, item e materiais: Sys.loot (js/farm.js); voam como pickups
  burst(e.x,y,e.col,e.boss?22:10); ring(e.x,y,'#ffffff',e.boss?40:26); B.corpses.push({e,x:e.x,t:0,life:enSheet(e,'die')?shDur(enSheet(e,'die'),EN_DIE_DUR):(e.boss&&SCREENS_ON.bossResult)?BOSS_FALL_DUR:0.6}); if(e.boss&&SCREENS_ON.bossResult) for(let i=0;i<3;i++) dust(e.x-30+i*30,GY-2,3,'#c8b496'); snd('enemy_die'); if(e.boss) snd('coin');
}
function heroDown(on){ if(on){ B.deadT=0.8; B.deadBoss=true; } else { B.deadT=0; B.deadBoss=false; } }   // tela 10 (derrota): deixa o Kael caído / devolve
const WAVE_GAP=0.3;   /* segundos entre o fim de uma onda comum e a entrada da próxima */
function waveClear(){
  const h=B.hero;
  if(typeof petWave==='function') petWave();
  if(B.inst){ instWaveClear(); return; }   // luta da instância (js/instfx.js): as ondas são as da instância   // cura por onda do pet (se o pet equipado curar)
  try{ if(window.Sys&&Sys.titles){ const fr=Sys.titles.onWaveClear(S,Sys.host); if(fr&&fr.length){ refreshHero(); if(typeof progFresh==='function') progFresh(fr); } } }catch(e){}
  const bossWon=S.wave===5; if(bossWon&&B.bossT0>0){ profRec('bossTime',(Date.now()-B.bossT0)/1000,'Fase '+S.stage); B.bossT0=0; }
  if(S.wave===5){
    const oldEra=eraOf(S.stage), won=S.stage, loot=B.bossLoot; B.bossLoot=null;
    S.farm=false; S.gems+=10; S.stage++; S.wave=1; S.best=Math.max(S.best,S.stage); snd('gem'); if(typeof fogBrasa==='function') fogBrasa('stage',1);   /* Fogueira: Brasas da fase vencida (só com o módulo ligado) */ if(typeof codexSync==='function') codexSync();   /* códex: fase vencida */
    const ne=eraOf(S.stage), newEra=ne>oldEra&&ne>S.eraMax;
    if(newEra){ S.eraMax=ne; S.gems+=30; }
    /* TELA 10 (vitória): abre por cima da batalha; se não puder abrir (outra tela aberta, tutorial), vale o aviso curto de antes */
    /* TROCA DE ERA (pedido Q-2): tela nova em overlay (js/p_era.js), só com PANEL_ON.era ligada pelo agente B; se não abrir, vale o fluxo de sempre */
    /* Engenheiro 2 (coordenador): no Senhor da Era a ORDEM é VITÓRIA (tela 10) → TROCA DE ERA, uma depois da outra: a Troca de era fica guardada em B.eraPend e
       abre quando a vitória fechar (laço do jogo). Sem a tela 10 (chave desligada, tutorial, outra tela aberta) a Troca de era abre direto, como antes. */
    const eraOpts=(newEra&&window.Panels&&typeof Panels.on==='function'&&Panels.on('era'))?{from:oldEra,to:ne,boss:(typeof era9Boss==='function'&&era9Boss(oldEra))||((J('assets/enemies/meta.json')['era'+oldEra+'_boss']||{}).name)||'Senhor da Era',gems:40,essence:loot&&loot.essence||0,onDone:()=>{}}:null;   /* nome do Senhor da Era vencido, do meta dos inimigos */
    let ee=null; try{ if(window.Sys&&Sys.erasEnd&&typeof Sys.erasEnd.onStageClear==='function') ee=Sys.erasEnd.onStageClear(S,Sys.host,won); }catch(er){ console.error('erasEnd',er); }
    const lootW=(ee&&ee.ok&&ee.stones>0)?Object.assign({},loot||{},{astral:ee.stones}):loot;   /* pedras astrais das fases acima da 90: aparecem na linha de prêmios da Vitória (pedido da Sistemas) */
    let shown=!!(typeof resOpen==='function'&&resOpen('win',{stage:won,loot:lootW,gems:10+(newEra?30:0),newEra:newEra?ne:-1}));
    if(shown&&eraOpts) B.eraPend=eraOpts;
    else if(eraOpts){ try{ shown=Panels.open('era',eraOpts)!==false; }catch(er){ console.error('era',er); } }
    /* FIM DAS 9 ERAS (tela V2 aprovada, js/p_end9.js; PANEL_ON.end9 nasce desligada): ao vencer a última fase da última era, depois da Vitória. Na fase 90 não há era nova, então não disputa com a Troca de era. Não é fim do jogo: a tela leva à fase seguinte */
    /* Sys.erasEnd (Sistemas, chave desligada = {ok:false}): na fase 90 entrega os prêmios do fim das 9 eras (uma vez) e a tela os mostra; acima da 90, marco a cada 10 fases e pedras astrais, num aviso curto */
    if(ee&&ee.ok&&ee.mark&&typeof toast==='function'){ try{ toast((ee.mark.name||'Marco')+' alcançado'+(ee.stones>0?': +'+ee.stones+' pedras astrais':'')); }catch(er){} }
    if(won===ERAS.length*STAGES_PER_ERA&&window.Panels&&typeof Panels.on==='function'&&Panels.on('end9')){ const eo={stage:won,gems:10,essence:loot&&loot.essence||0}; if(ee&&ee.ok&&ee.final){ if(ee.final.prizes) eo.prizes=ee.final.prizes; if(ee.final.milestone) eo.milestone=ee.final.milestone; } if(shown) B.endPend=eo; else { try{ shown=Panels.open('end9',eo)!==false; }catch(er){ console.error('end9',er); } } }
    if(!shown) toast(newEra?`Nova era: ${ERAS[ne].n}! +40 gemas`:`Fase ${S.stage-1} vencida! +10 gemas`);   // aviso reserva, sem emoji
  } else if(S.farm&&S.wave>=4){ S.wave=1;   // farm: repete as ondas comuns (1 a 4) com drop, ouro e XP normais; nunca entra na onda do chefe sozinho
    if(S.set.autoBoss&&heroFC()>=(typeof fcNeed==='function'?fcNeed:recFC)(S.stage)){ challengeBoss(); return; } }   /* a cura é a do próprio desafio (bossChallengeHeal): antes somava 8% e depois enchia a vida */
  else S.wave++;
  if(!bossWon) h.hp=Math.min(h.maxhp,h.hp+h.maxhp*Math.min(1,BAL.waveHeal));   /* depois do chefe a fase nova começa com a vida que sobrou */
  { const gap=(bossWon||S.wave===5)?1.2:WAVE_GAP;   /* B4 (polimento da batalha): entre ondas comuns o próximo inimigo entra logo, sem 1,2 s de palco vazio; a entrada do chefe e a fase nova mantêm a pausa */
    B.toSpawn=waveSpec(S.stage,S.wave); B.waveN=B.toSpawn.length; B.spawnT=gap; B.waveT=gap; B.bossT0=S.wave===5?Date.now():0; } preloadAssets(); save();
  if(view!=='battle'){ if(typeof softRender==='function') softRender(); else render(); }
}
/* "Desafiar chefe": chama a onda do chefe da fase atual (com a vida cheia), no farm ou fora dele (fora do farm só antecipa a onda 5). Também é o "Tentar de novo" da derrota. */
function challengeBoss(){ if(S.wave===5||B.deadT>0||B.res) return false; S.farm=false; S.wave=5; const h=B.hero; if(h) h.hp=Math.min(h.maxhp,h.hp+h.maxhp*Math.min(1,BAL.bossChallengeHeal)); B.act=null; B.eshots=[]; startWave(0.4); save(); hud(); return true; }
/* kind: 0 normal · 2 = s2 (laranja maior) · 3 = s3 (dourado enorme) */
function hitEnemy(e,mult,a,h){
  const hero=B.hero; if(!e||e.dead){ e=target(); if(!e) return; }
  let crit, d; if(window.Sys&&Sys.stats){ const r=Sys.stats.hit(hero,mult,e.def||0); crit=r.crit; d=r.dmg*(0.9+Math.random()*0.2); }   // inimigos ainda não têm DEF (e.def ausente = 0): a tabela vem do balanceamento
  else { crit=Math.random()<BAL.critChance; d=hero.atk*mult*(crit?BAL.critMult:1)*(0.9+Math.random()*0.2); }
  const ex=eX(e), ey=eY(e), fin=h&&h.fin, k=a.type==='s3'?(fin?3:2):a.type==='s2'?2:crit?1:0;
  e.hp-=d; e.hit=0.12; if(!(e.hurtT>0)){ e.hurtD=shDur(enSheet(e,'hurt'),EN_HURT_DUR); e.hurtT=e.hurtD; }   // a folha de dano toca inteira, no fps do .json
  floatText(ex,e.boss?GY-(e.dh||150)-36:GY-(e.dh||90)-20,fmt(d),k===3?'#ffd23f':k===2?(a.type==='s3'?'#ffd23f':'#ff9a3a'):crit?'#ffe14a':'#ffffff',k===3?2:k===2?1:crit?3:0); profRec('hit',d,a.type==='s3'?'Ultimate':crit?'Crítico':'');
  { const fx=a.fx, pm=fx&&fx.particles>0?fx.particles:1, lite=a.type==='s3'?1:0.5;   /* s1 e s2: metade do reforço */
    burst(ex-8,ey+6,a.col==='#ffffff'?'#ff9d5c':a.col,Math.round((crit||fin?8:3)*(1+(pm-1)*lite)));
    if(fx&&fin){ const sz=fx.size>0?fx.size:1; ring(ex-6,ey,a.col,34*sz); if(sz>1) ring(ex-6,ey,'#ffffff',22*sz); B.shake=Math.max(B.shake,.5*(fx.shake>0?fx.shake:1)); if(fx.flash) B.flash=Math.max(B.flash||0,0.28); } }
  if(false) burst(ex-8,ey+6,a.col==='#ffffff'?'#ff9d5c':a.col,crit||fin?8:3);
  const hs=fxSpr(crit?'crit':'hit',a.col); if(hs) wfx(fnSpr,crit?0.25:0.16,{spr:hs,x:ex-6,y:ey,size:HS*(crit?0.8:0.5),rot:Math.random()*6.28,layer:1});
  else wfx(fnHit,crit?0.3:0.2,{x:ex-6,y:ey,r:crit?40:24,n:crit?11:7,col:a.col==='#ffffff'?(crit?'#ffd23f':'#ffe9c8'):a.col,rot:Math.random()*6.28,layer:1});
  if(crit){ ring(ex-10,ey,'#ffd23f'); }
  if(window.__stay&&e.hp<=0) e.hp=e.maxhp;
  if(e.hp<=0) killEnemy(e);
  return crit;
}
function hitMany(list,mult,a,h){
  let crit=false; for(const e of list.slice()) crit=hitEnemy(e,mult,a,h)||crit;
  if(list.length){ if(crit){ snd('crit'); vib(25); } else snd('hit'); addEnergy(a.type==='s1'?energyPerBasic()*(h&&h.ef!=null?h.ef:1):a.type==='s2'?BAL.energyPerSkillHit:0); }
}
/* ENERGIA DA ULTIMATE NORMALIZADA POR TEMPO (PO): energia por golpe básico = base (BAL.energyPerHit) × intervalo atual ÷ intervalo de referência
   (BAL.s1Interval). Com mais velocidade de ataque há mais golpes, cada um carregando menos: a ultimate enche no mesmo ritmo por segundo.
   O especial (recarga fixa, não acelera) e a energia ao apanhar não mudam. */
function energyPerBasic(){ const h=B.hero; return BAL.energyPerHit*((h&&h.ivl>0?h.ivl:BAL.s1Interval)/BAL.s1Interval); }
function tipPos(){ return B.tipW||{x:HX+62,y:GY-44}; }
function shotFx(a,strong,list){
  const tp=tipPos();
  for(const e of list) wfx(fnTracer,0.1,{x0:tp.x,y0:tp.y,x1:e.x-10,y1:eY(e)+(Math.random()-.5)*10,col:a.col==='#ffffff'?'#ffe27a':a.col,w:strong?3.4:2.4,layer:1});
  B.parts.push({x:tp.x-30,y:tp.y-4,vx:-40-Math.random()*40,vy:-80-Math.random()*40,g:420,t:0,life:.6,col:'#d8b040',sz:3,glow:false}); // cápsula
  if(a.era===4) for(let i=0;i<3;i++) B.parts.push({x:tp.x,y:tp.y,vx:20+Math.random()*30,vy:-20-Math.random()*20,g:-20,t:0,life:.6,col:'#f0f0f0',sz:5+Math.random()*4,glow:false});
}
function actEvent(a,v){
  if(v.pre){ ultPre(a,v); return; }
  if(v.rg){ rgEvent(a,v); return; }
  const list=a.type==='s2'?nearest(3):nearest(1); v.h.tg=list;
  if(!wIsGun(wSkin())) return;   /* Engenheiro 10: a ação nasceu com arma de fogo (a.gun) e a arma na mão foi trocada no meio dela (equipar o melhor sozinho, drop): sem isto o resto da ação soltava traçante, cápsula e fumaça de TIRO da ponta da clava/espada. O dano segue igual. */
  shotFx(a,a.type==='s2',list);
  if(a.type==='s2'&&a.era===6&&list[0]) wfx(fnWave,0.2,{x0:HX+50,x1:list[0].x,y:eY(list[0]),r:26,col:a.col,layer:1});
}
function skillHit(a,h){
  if(a.type==='s3'){ const all=B.en.filter(e=>!e.dead&&e.x<=LW+20); const c=hordeCenter(all); ultHit(a,h,c.x,c.y); hitMany(all,h.m,a,h); return; }
  if(a.rg){ rgHit(a,h); return; }   /* arco / bumerangue */
  const list=(h.tg&&h.tg.filter(e=>!e.dead).length?h.tg.filter(e=>!e.dead):null)||(a.type==='s2'?nearest(3):nearest(1));
  if(!list.length) return;
  const e0=list[0], ex=e0.x, ey=eY(e0), col=a.col;
  if(fxArt(a.type,a.era,ex,ey,1)){ hitMany(list,h.m,a,h); return; }      // folha animada aprovada (quando existir)
  if(!a.gun){
    const sl=fxSpr('slash',col);
    if(a.type==='s1'){ wfx(fnArc,0.18,{x:ex-14,y:ey,ang:0.35,r:26,col,layer:1,flip:(B.spawnN+S.kills)%2}); }
    else if(a.era===0){ wfx(fnShock,0.5,{x:HX+50,r:130,col,layer:0}); wfx(fnShock,0.6,{x:HX+50,r:90,col:'#ffffff',layer:0,delay:.08}); dust(HX+46,GY,14); dust(ex,GY,8); vib(30); }
    else if(a.era===1){ wfx(fnTracer,0.14,{x0:HX+30,y0:ey+4,x1:list[list.length-1].x+10,y1:ey+(h.i-1)*10,col,w:4.5,layer:1}); }
    else if(a.era===2){ wfx(fnArc,0.25,{x:ex+6,y:ey,ang:-0.6+h.i*0.9,r:46,col,layer:1}); }
    else { wfx(fnWave,0.28,{x0:HX+40,x1:list[list.length-1].x+14,y:ey,r:32,col,layer:1}); }
    if(a.type==='s2'){ if(a.era!==0) wfx(fnShock,0.35,{x:ex,r:46,col,layer:0}); }
  } else if(a.type==='s2') wfx(fnShock,0.3,{x:ex,r:34,col,layer:0});
  hitMany(list,h.m,a,h);
}
function hordeCenter(all){ if(!all.length) return {x:HX+120,y:GY-45}; let x=0; for(const e of all) x+=Math.min(e.x,LW-30); return {x:x/all.length,y:GY-45}; }
/* ===== PONTO ÚNICO DE TROCA DOS EFEITOS =====
   O dono reprovou efeito em PNG parado: nenhuma imagem de assets/fx é desenhada. Tudo abaixo é PROVISÓRIO EM CÓDIGO.
   null = provisório em código. Quando a folha ANIMADA aprovada chegar (fps-ff; ordem era 2, 0, 5), ponha no lugar do null:
     {sheet:'assets/fx/anim/era2_ult.png', frames:16, fps:12, scale:2.4, anchor:[0.5,0.9], blend:'lighter'}
   (folha horizontal; scale = altura em relação a 124 px lógicos; anchor = ponto que cai no alvo).
   s1/s2/ult: uma entrada por era. slash/hit/crit/muzzle/aura: null = código; 'sprite' reativa o PNG antigo de assets/fx (só para comparação). */
const FX_ART={
  /* ultimates ANIMADAS entregues pela fps-ff (assets/anim/ult/era<N>_ult.png + .json: grade de quadros 384x216, 49 quadros, "screen":"full"):
     eras 0, 2 e 5. meta:true = lê quadros/colunas/blend do .json ao lado; dur = segundos em que a folha inteira toca. */
  ult:[0,1,2,3,4,5,6,7,8].map(e=>({sheet:'assets/anim/ult/era'+e+'_ult',meta:true,dur:2.5})),   // as 7 aprovadas + eras 7 e 8 (folhas em disco, chaves ult_era7/ult_era8); blend lido do .json (eras 0, 3 e 5 source-over; as outras lighter)
  s2: [null,null,null,null,null,null,null],
  s1: [null,null,null,null,null,null,null],
  slash:null, hit:null, crit:null, muzzle:null, aura:null,
};
const ULTCOL=['#d8a868','#9ad8ff','#ff8a2a','#ffb040','#7ad8ff','#ff9a3a','#b45cff','#ff5a1a','#ffe7a3'];   /* eras 7 e 8: cores da paleta das armas do Sys.eras (lava, ouro branco) */
const PART_MAX=260;                                   // teto de partículas (desempenho em celular)
/* emissores chamados A CADA QUADRO (ambiente da ultimate): a quantidade por segundo é a mesma a 60 e a 120 quadros (B.fk = fração de um quadro de 60) e cai com o degrau de qualidade */
function emit(p){ const q=PART_Q[FP.q]*(B.fk>0?B.fk:1); if(q<1&&Math.random()>q) return; if(B.parts.length<PART_MAX*PART_Q[FP.q]) B.parts.push(p); }
const fxPng = A => A.meta?A.sheet+'.png':A.sheet;
function fnSheet(o,k){ const A=o.art, im=o.img, M=o.m||A, fr=M.frames||1, fi=Math.min(fr-1,Math.floor(k*fr));
  if((M.blend||A.blend)==='lighter') ctx.globalCompositeOperation='lighter';
  if(M.cols){ const fw=M.w, fh=M.h, sx=(fi%M.cols)*fw, sy=Math.floor(fi/M.cols)*fh;                 // grade de quadros
    if(M.screen==='full'){ const ww=LW+24, hh=ww*fh/fw, bz=o.bz;
      if(bz&&bz.size>1){ const px=LW*0.62, py=GY+LW*0.09; ctx.translate(px,py); ctx.scale(bz.size,bz.size); ctx.translate(-px,-py); }   /* reforço (Mítico): maior, crescendo a partir do chão no meio da horda */
      ctx.drawImage(im,sx,sy,fw,fh,-12,GY+LW*0.09-hh,ww,hh);
      if(bz&&bz.glow>0){ ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=Math.min(0.6,0.32*bz.glow); ctx.drawImage(im,sx,sy,fw,fh,-12,GY+LW*0.09-hh,ww,hh); }   /* brilho: o mesmo quadro somado por cima */
      return; }   // faixa da largura do campo, apoiada logo abaixo da linha dos pés
    const hh=124*(A.scale||2.4), ww=hh*fw/fh, an=A.anchor||[0.5,0.5]; ctx.drawImage(im,sx,sy,fw,fh,o.x-ww*an[0],o.y-hh*an[1],ww,hh); return; }
  const fw=im.naturalWidth/fr, hh=124*(A.scale||2.4), ww=hh*fw/im.naturalHeight, an=A.anchor||[0.5,0.5];
  ctx.drawImage(im,fi*fw,0,fw,im.naturalHeight,o.x-ww*an[0],o.y-hh*an[1],ww,hh); }
function fxArt(kind,era,x,y,layer){ const A=FX_ART[kind]&&FX_ART[kind][era]; if(!A||(kind==='ult'&&!ART_ON['ult_era'+era])) return false; return fxArtGo(A,x,y,layer,null); }
function fxArtGo(A,x,y,layer,ex){ const im=IMG(fxPng(A)); if(!im) return false;
  let m=null; if(A.meta){ m=J(A.sheet+'.json'); if(!m||!m.frames) return false; }
  const o={img:im,art:A,m,x,y,layer:layer==null?1:layer,delay:A.delay||0}; if(ex) Object.assign(o,ex);
  wfx(fnSheet,A.dur||((m||A).frames||1)/((m||A).fps||12),o); return true; }
/* ===== ULTIMATE PELA FAMÍLIA DA ARMA (Engenheiro 5; Sys.stats.ultOf, decisão do dono) =====
   Básico/Raro/Épico = folha base da família (assets/anim/ult/era<artEra>_ult) · Mítico = a mesma folha com REFORÇO por código (boost do módulo: tamanho,
   brilho, partículas, anel, tremor; só visual, tremor preso em 3 px de tela pelo draw) · Lendário/Divino = folha PRÓPRIA assets/anim/ult/<família>_legend
   quando liberada; senão a base com reforço. As 9 folhas próprias estão no disco (DATA.ownDelivered) e ficam atrás da chave ULT_LEGEND_ON, DESLIGADA
   até o voto do dono (liga só em ?debug=1&ultlend=1, ou quando Sistemas marcar DATA.ownReady[família] depois do voto).
   A era do MAPA não entra: a.era = artEra da família da arma na mão. Família sem folha no disco (arco/bumerangue: bow_base/boomerang_base ainda não existem):
   cai na folha da era de reserva da arma (era<a.era>_ult); sem ela, o efeito em código. */
/* Engenheiro 9 (voto do dono de 13/11; as 9 vistas na batalha): LIGADA por padrão; ?debug=1&ultlend=0 desliga (o botão "Ultimates lendárias" do Modo dono também).
   No boot, com os módulos js/sys já carregados (vêm antes deste arquivo), Sys.stats.goLive('ults') marca as 9 aprovadas (idempotente). */
window.ULT_LEGEND_ON=!(DEBUG&&typeof QP!=='undefined'&&QP.get('ultlend')==='0');   /* chave em window; lida a cada uso */
try{ if(window.ULT_LEGEND_ON===true&&typeof Sys!=='undefined'&&Sys&&Sys.stats&&typeof Sys.stats.goLive==='function') Sys.stats.goLive('ults'); }catch(e){ console.error('goLive ults',e); }
/* 8 ASAS NOVAS aprovadas (fênix, gelo, sombra, tempestade, mecânica, ossos, mariposa sombria e a SERÁFICA, versão A votada pelo dono em 14/11): ligadas no boot.
   A lista é a DATA.wingsApproved do js/sys/stats.js. */
try{ if(typeof Sys!=='undefined'&&Sys&&Sys.stats&&typeof Sys.stats.goLive==='function') Sys.stats.goLive('wings'); }catch(e){ console.error('goLive wings',e); }
const ULT_ARTS={};
const ultArtOf = sheet => ULT_ARTS[sheet]||(ULT_ARTS[sheet]={sheet,meta:true,dur:2.5});
/* Engenheiro 9: (1) a chave window.ULT_LEGEND_ON MANDA: desligada, o Lendário/Divino toca a base da família com reforço, mesmo com ownReady ligado no módulo
   (é o que faz o botão do Modo dono e o ?ultlend=0 valerem depois do goLive('ults')); (2) a folha própria só é devolvida para TOCAR quando está decodificada
   (png + json): enquanto carrega, sai a base com reforço (inteira), nunca o efeito em código nem quadro vazio; want=true (pré-carga, lista da cena) devolve a
   folha DESEJADA, pronta ou não. */
function ultBaseOf(U){ try{ const W=Sys.stats.DATA.weaponTypes[U.type]; return W?(W.ult!==undefined?W.ult:(W.artEra!=null?'assets/anim/ult/era'+W.artEra+'_ult':null)):null; }catch(e){ return null; } }
const ultHas = sheet => !!IMG(sheet+'.png')&&J(sheet+'.json').frames>0;
function ultPlan(arm,era,want){   // → {sheet, boost, own} ou null (sem módulo: a folha da era, como antes)
  let U=null; try{ U=(NEXT_ON&&window.Sys&&Sys.stats&&typeof Sys.stats.ultOf==='function')?Sys.stats.ultOf(arm):null; }catch(e){ U=null; }
  const eraSheet=ART_ON['ult_era'+era]?'assets/anim/ult/era'+era+'_ult':null; if(!U) return eraSheet?{sheet:eraSheet,boost:null,own:false}:null;
  let sheet=U.sheet, boost=U.boost||null, own=U.ownReady===true;
  const toBase=()=>{ sheet=ultBaseOf(U); own=false; try{ boost=Object.assign({},Sys.stats.DATA.ultBoost); }catch(e){ boost=null; } };
  if(U.tier==='own'){ const keyOn=window.ULT_LEGEND_ON===true;
    if(!own&&keyOn){ const D=Sys.stats.DATA.ownDelivered; if(Array.isArray(D)&&D.indexOf(U.type)>=0){ sheet=U.ownSheet; boost=null; own=true; } }
    else if(own&&!keyOn) toBase();
    if(own){ const q=IMGS[sheet+'.png']; if((q&&q.fail)||(!want&&!ultHas(sheet))) toBase(); } }   // folha própria ausente do disco, ou ainda carregando (ultHas já pediu): base reforçada
  if(!own){ const m=/\/era(\d+)_ult$/.exec(sheet||''); if(m&&!ART_ON['ult_era'+m[1]]) sheet=null; }   // folha de era só com a chave de arte dela ligada
  if(sheet){ const q=IMGS[sheet+'.png']; if(q&&q.fail) sheet=null; }                                    // arquivo não existe no disco
  if(!sheet) sheet=eraSheet;
  return sheet?{sheet,boost,own}:null; }
/* ----- ultimates por era ----- */
function ultStart(a){
  const c=hordeCenter(B.en), col=a.col==='#ffffff'?ULTCOL[a.era]:a.col;
  const P=ultPlan(wArm(),a.era); a.boost=P&&P.boost||null;
  if(P&&fxArtGo(ultArtOf(P.sheet),LW*0.7,GY+4,2,a.boost?{bz:a.boost}:null)){ a.img=true; a.own=P.own;   // camada 2: entre os inimigos e o herói (o herói fica por cima)
    if(a.boost) wfx(fnUltBoost,2.3,{bz:a.boost,col,layer:1,delay:.15}); return; }
  a.img=false;
  wfx(fnUltAmb,ULT_DUR-0.3,{era:a.era,col,delay:.2,layer:a.era===6?0:1,cx:Math.max(c.x,HX+110),cy:c.y});
  if(a.era===6) wfx(fnHole,1.75,{x:Math.max(c.x,HX+110),y:c.y-10,r:30,col,delay:.35,layer:0});
}
/* reforço da ultimate (Mítico, ou Lendário sem folha própria liberada): partículas a mais na cor da raridade, subindo do chão da horda (× bz.particles) */
function fnUltBoost(o,k){ const n=Math.max(0,(o.bz.particles||1)-1)*3, env=Math.sin(Math.min(1,k)*Math.PI);
  for(let i=0;i<3;i++) if(Math.random()<n/3*env+0.15) emit({x:HX+70+Math.random()*(LW-HX-70),y:GY-Math.random()*26,vx:(Math.random()-.5)*26,vy:-70-Math.random()*110,g:-20,t:0,life:.55+Math.random()*.4,col:Math.random()<.3?'#ffffff':o.col,sz:2+Math.random()*2.5,glow:true}); }
/* ambiente da ultimate, todo em código, com identidade por era (cores e tipo de partícula). k = 0..1 ao longo da ultimate */
function fnUltAmb(o,k){
  const E=o.era, col=o.col, t=B.at, env=Math.sin(Math.min(1,k)*Math.PI), x0=HX+50, x1=LW+10;
  const all=B.en.filter(e=>!e.dead&&e.x<=LW+20), rx=()=>x0+Math.random()*(x1-x0);
  if(E===0){        // pedras e poeira caindo, ondas no chão
    for(let i=0;i<2;i++) emit({x:rx(),y:GY-270-Math.random()*60,vx:-20+Math.random()*40,vy:240+Math.random()*160,g:300,t:0,life:.8,col:Math.random()<.5?'#8a6a45':col,sz:2+Math.random()*4,glow:false});
    if(Math.random()<.5) emit({x:rx(),y:GY+1,vx:(Math.random()-.5)*50,vy:-20-Math.random()*40,g:40,t:0,life:.6,col:'#d8c8a8',sz:4+Math.random()*4,glow:false});
    for(let i=0;i<3;i++){ const ph=(k*3+i/3)%1, r=150*ph+10; ctx.globalAlpha=(1-ph)*env*.8; ctx.strokeStyle=i%2?'#ffffff':col; ctx.lineWidth=3*(1-ph)+1; ctx.beginPath(); ctx.ellipse(o.cx,GY+3,r,r*.2,0,0,7); ctx.stroke(); } }
  else if(E===1){   // colunas de luz descendo sobre os inimigos
    ctx.globalCompositeOperation='lighter'; const nC=Math.max(2,Math.min(4,all.length+1));
    for(let i=0;i<nC;i++){ const e=all.length?all[i%all.length]:null, cx=(e?Math.min(e.x,LW-12):o.cx)+(i>=all.length?34:0)+Math.sin(t*5+i*2)*4, w=(8+6*Math.sin(t*17+i*3))*env+2, top=GY*(1-Math.min(1,k*6));
      const g=ctx.createLinearGradient(cx-w*2,0,cx+w*2,0); g.addColorStop(0,col+'00'); g.addColorStop(.5,'#ffffff'); g.addColorStop(1,col+'00'); ctx.globalAlpha=env*.7; ctx.fillStyle=g; ctx.fillRect(cx-w*2,-10,w*4,GY+14-top);
      if(Math.random()<.7) emit({x:cx+(Math.random()-.5)*w*3,y:GY-Math.random()*20,vx:(Math.random()-.5)*20,vy:-90-Math.random()*120,g:0,t:0,life:.6,col,sz:2+Math.random()*2,glow:true}); } }
  else if(E===2){   // varredura de fogo em arco, com brasas
    ctx.globalCompositeOperation='lighter'; const sw=(k*2.6)%1, th=-1.95+sw*2.3, R=LW*0.5, cx=x0-10, cy=GY-36;
    for(let j=0;j<14;j++){ const tj=th-j*0.085; if(tj<-1.95) break; const r=R*(0.8+0.2*Math.sin(j*1.7+t*9)), x=cx+Math.cos(tj)*r, y=cy+Math.sin(tj)*r*0.8, sz=26*(1-j/15);
      drawGlow(j<3?'#ffe9a8':j<8?col:'#c8321e',x,y,sz,env*(1-j/15)); drawGlow(col,cx+Math.cos(tj)*r*.6,cy+Math.sin(tj)*r*.48,sz*.7,env*(1-j/15)*.6); }
    const hx=cx+Math.cos(th)*R, hy=cy+Math.sin(th)*R*0.8;
    for(let i=0;i<3;i++) emit({x:hx+(Math.random()-.5)*20,y:hy+(Math.random()-.5)*20,vx:(Math.random()-.5)*70,vy:-50-Math.random()*90,g:-30,t:0,life:.6+Math.random()*.4,col:Math.random()<.5?col:'#ffd45a',sz:2+Math.random()*3,glow:true}); }
  else if(E===3){   // fumaça das explosões e estilhaços
    for(let i=0;i<2;i++) emit({x:o.cx+(Math.random()-.5)*150,y:GY-8-Math.random()*40,vx:(Math.random()-.5)*20,vy:-30-Math.random()*30,g:-15,t:0,life:.9,col:Math.random()<.5?'#5a5a5a':'#8a8a8a',sz:6+Math.random()*7,glow:false});
    if(Math.random()<.6) emit({x:o.cx+(Math.random()-.5)*120,y:GY-20,vx:(Math.random()-.5)*220,vy:-120-Math.random()*120,g:420,t:0,life:.6,col,sz:2+Math.random()*2,glow:true}); }
  else if(E===4){   // arcos elétricos pulando entre os inimigos e faíscas
    if(all.length&&Math.random()<.4){ const e1=all[Math.floor(Math.random()*all.length)], e2=all[Math.floor(Math.random()*all.length)], y1=eY(e1)-20+Math.random()*40;
      wfx(fnBolt,.16,{pts:e1===e2?mkBolt(Math.min(e1.x,LW-8)+(Math.random()-.5)*70,-10,Math.min(e1.x,LW-8),y1,7,12):mkBolt(Math.min(e1.x,LW-8),y1,Math.min(e2.x,LW-8),eY(e2),5,10),col,w:2.5,layer:1}); }
    for(let i=0;i<2;i++){ const e=all.length?all[Math.floor(Math.random()*all.length)]:null; emit({x:(e?Math.min(e.x,LW-8):o.cx)+(Math.random()-.5)*30,y:(e?eY(e):o.cy)+(Math.random()-.5)*40,vx:(Math.random()-.5)*160,vy:(Math.random()-.5)*160,g:200,t:0,life:.3,col:Math.random()<.5?'#ffffff':col,sz:2,glow:true}); } }
  else if(E===5){   // traços de mísseis descendo e fumaça no chão
    ctx.globalCompositeOperation='lighter'; ctx.lineCap='round';
    for(let i=0;i<6;i++){ const ph=(k*4.5+i*0.19)%1, x=o.cx-150+i*42+ph*110, y=GY-340+ph*335; ctx.globalAlpha=env*(1-ph*.6); ctx.strokeStyle=i%2?col:'#ffffff'; ctx.lineWidth=2.2; ctx.beginPath(); ctx.moveTo(x-18,y-56); ctx.lineTo(x,y); ctx.stroke(); drawGlow(col,x,y,7,env); }
    for(let i=0;i<2;i++) emit({x:o.cx+(Math.random()-.5)*170,y:GY-4-Math.random()*20,vx:(Math.random()-.5)*30,vy:-25-Math.random()*30,g:-10,t:0,life:.9,col:Math.random()<.5?'#6a6a6a':'#9a9a9a',sz:6+Math.random()*6,glow:false}); }
  else {            // vórtice de partículas caindo para o centro
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<46;i++){ const ph=(t*0.9+i*0.137)%1, rad=(1-ph)*150+8, an=i*2.4+t*4+ph*5, x=o.cx+Math.cos(an)*rad, y=o.cy-10+Math.sin(an)*rad*.55, sz=1.5+3*ph; ctx.globalAlpha=env*ph; ctx.fillStyle=i%3?col:'#ffffff'; ctx.fillRect(x-sz/2,y-sz/2,sz,sz); } }
}
function ultPre(a,v){
  const all=B.en.filter(e=>!e.dead&&e.x<=LW+20); if(!all.length) return; const n=v.fin?4:2, E=a.era;
  for(let i=0;i<n;i++){ const e=all[(i+v.i)%all.length], ex=Math.min(e.x,LW-10)+(Math.random()-.5)*20, ey=eY(e);
    if(E===0) wfx(fnProj,0.3,{x0:ex+30,y0:GY-330,x1:ex,y1:GY-6,arc:0,kind:'rock',r:v.fin?13:9,layer:1});
    else if(E===3) wfx(fnProj,0.3,{x0:-12,y0:GY-90,x1:ex,y1:ey+10,arc:50,kind:'ball',r:v.fin?7:5,layer:1});
    else if(E===5) wfx(fnProj,0.3,{x0:ex-120,y0:GY-330,x1:ex,y1:GY-6,arc:0,kind:'missile',r:6,col:a.col,layer:1});
  }
}
function ultHit(a,h,ex,ey){
  const E=a.era, col=a.col, c2=col==='#ffffff'?(ULTCOL[E]||col):col, fin=h.fin;
  const all=B.en.filter(e=>!e.dead&&e.x<=LW+20), pick=i=>all.length?all[i%all.length]:{x:ex,lane:1,dh:80};
  B.shake=Math.max(B.shake,fin?1.3:.55);
  if(E===0){ wfx(fnShock,0.55,{x:ex,r:fin?190:90,col:c2,layer:0}); dust(ex,GY,fin?26:10); if(fin){ wfx(fnShock,0.7,{x:ex,r:130,col:'#ffffff',layer:0,delay:.1}); burst(ex,GY-10,'#8a6a45',24,1.5); } }
  else if(E===1){ const n=fin?4:2; for(let i=0;i<n;i++){ const e=pick(i+h.i); wfx(fnBolt,0.3,{pts:mkBolt(e.x+(Math.random()-.5)*70,GY-340,Math.min(e.x,LW-8),GY-4,9,16),col:c2,w:fin?6:4,layer:1,delay:i*.05}); } wfx(fnFlash,0.25,{a:fin?.7:.25,col:'#ffffff',layer:1}); burst(ex,GY-12,c2,fin?20:8); }
  else if(E===2){ if(fin){ wfx(fnWave,0.45,{x0:HX+30,x1:LW+40,y:ey,r:70,col:c2,layer:1}); for(let i=0;i<26;i++) B.parts.push({x:HX+60+Math.random()*(LW-HX-60),y:GY-Math.random()*20,vx:(Math.random()-.5)*30,vy:-60-Math.random()*90,g:-30,t:0,life:.7+Math.random()*.4,col:Math.random()<.5?c2:'#ffd45a',sz:3+Math.random()*4,glow:true}); }
    else { const e=pick(h.i); wfx(fnArc,0.28,{x:Math.min(e.x,LW-20),y:eY(e),ang:-1+h.i*1.3,r:54,col:c2,layer:1}); } }
  else if(E===3||E===5){ const n=fin?4:2; for(let i=0;i<n;i++){ const e=pick(i+h.i); wfx(fnExpl,0.4,{x:Math.min(e.x,LW-10),y:E===5?GY-14:eY(e)+8,r:fin?50:32,col:c2,layer:1,delay:i*.05}); } burst(ex,ey+10,c2,fin?26:10,1.4); if(E===5) dust(ex,GY,fin?16:6,'#888888'); }
  else if(E===4){ const tp=tipPos(); let px=tp.x, py=tp.y; const n=Math.max(1,Math.min(all.length,fin?7:4));   // relâmpago em cadeia
    for(let i=0;i<n;i++){ const e=pick(i), x=Math.min(e.x,LW-8), y=eY(e); wfx(fnBolt,0.28,{pts:mkBolt(px,py,x,y,5,12),col:c2,w:fin?5:3.5,layer:1,delay:i*.03}); px=x; py=y; }
    if(fin) wfx(fnFlash,0.25,{a:.55,col:c2,layer:1}); burst(ex,ey,c2,fin?22:8); }
  else { ring(ex,ey,c2,fin?110:40); burst(ex,ey,c2,fin?30:8,fin?2:1); if(fin){ wfx(fnFlash,0.3,{a:.75,col:'#ffffff',layer:1}); wfx(fnExpl,0.5,{x:ex,y:ey,r:90,col:c2,layer:1}); } }
  if(a.boost){ const bz=a.boost, sz=bz.size>0?bz.size:1;   /* reforço por cima (só visual): anel no chão e no ar, tremor × bz.shake (o draw prende em 3 px de tela) */
    B.shake=Math.max(B.shake,(fin?1.3:.55)*(bz.shake>0?bz.shake:1));
    if(bz.ring){ wfx(fnShock,fin?0.6:0.4,{x:ex,r:(fin?150:70)*sz,col:c2,layer:0}); if(fin){ ring(ex,ey,c2,80*sz); ring(ex,ey,'#ffffff',54*sz); } } }
  if(fin){ B.slow=0.22; vib(80); }
}

function step(dt){
  if(B.res) return;   // tela 10 (resultado do chefe) aberta: a batalha espera
  B.t+=dt;
  const h=B.hero; if(!h) return;
  if(typeof diffStep==='function') diffStep(dt);   /* fúria do chefe (js/diff.js; chave desligada = não faz nada) */
  if(window.__stay){ B.hurt=0; h.hp=h.maxhp; } if(B.hurt>0) B.hurt-=dt;
  if(B.cd2>0) B.cd2-=dt;
  if(B.deadT>0){ B.deadT-=dt; B.running=false; if(B.deadT<=0){ if(B.inst){ instEnd(false); return; } if(B.deadBoss){ S.farm=true; B.deadBoss=false; save();
      /* TELA 10 (derrota): o chefe fica de pé e o herói volta a ficar parado até o jogador escolher; sem a tela, entra direto no farm */
      if(typeof resOpen==='function'&&resOpen('lose',{stage:S.stage})){ h.hp=h.maxhp; return; }
      toast('Derrotado pelo chefe: juntando força. Desafiar acende quando a sua FC chegar perto'); }
    S.wave=1; startBattle(); if(view!=='battle'){ if(typeof softRender==='function') softRender(); else render(); } } return; }
  // surgimento "aos poucos"
  if(B.waveT>0) B.waveT-=dt;
  /* Engenheiro 5: ERA NOVA só entra com cenário, inimigos e chefe DECODIFICADOS (eraReady, js/loading.js). Enquanto carrega, o herói segue correndo no cenário
     antigo com um aviso curto; no máximo ERA_HOLD_MAX s de jogo (depois entra com a reserva: nunca trava). */
  B.eraHold=false; if(!B.inst&&typeof eraReady==='function'){ const ne=eraOf(S.stage); if(ne!==B.dispEra&&!eraReady(ne)&&(B.eraWait||0)<ERA_HOLD_MAX){ B.eraHold=true; B.eraWait=(B.eraWait||0)+dt; } else if(ne===B.dispEra) B.eraWait=0; }
  if(B.toSpawn.length&&!B.eraHold&&!(BOSS_AFTER_ESCORTS&&B.toSpawn[0]==='boss'&&B.en.length)){ B.spawnT-=dt; if(B.spawnT<=0){ const k=B.toSpawn.shift(), e=(B.inst&&typeof instMk==='function')?instMk(k):mkEnemy(S.stage,k); B.en.push(e);
      B.spawnT=(B.toSpawn[0]==='boss'?1:0)+0.55+Math.random()*0.4;
      if(e.boss){ snd('boss_appear'); vib(60); B.banner={txt:e.eraBoss?'SENHOR DA ERA':'CHEFE',sub:'',t:0,dur:1.4,col:'#ff5252'}; } } }
  layoutHorde();
  const gun=heroRange(), ult=B.act&&B.act.type==='s3';
  let eng=false; for(const e of B.en) if(inEngage(e,gun)){ eng=true; break; }
  if(eng) B.holdT=0.6; else if(B.holdT>0) B.holdT-=dt;
  B.running=!eng&&!B.act&&B.holdT<=0&&!B.en.some(e=>e.x<=LW-10);   // não corre com horda visível na tela
  // ação em curso
  const a=B.act;
  if(a){ a.t+=dt*(a.rate||1);
    for(const v of a.ev) if(!v.done&&a.t>=v.t){ v.done=true; actEvent(a,v); }
    for(const hh of a.hits) if(!hh.done&&a.t>=hh.t){ hh.done=true; skillHit(a,hh); }
    if(a.t>=a.dur&&B.act===a) B.act=null;
  }
  B.swing=(B.act&&B.act.type==='s1')?SWT*(1-B.act.t/B.act.dur):0;
  // inimigos: andam até o slot; só os 2 da frente atacam
  for(const e of B.en){
    if(e.hit>0) e.hit-=dt; if(e.hurtT>0) e.hurtT-=dt; if(e.sw>0) e.sw-=dt; e.wt+=dt; if(e.dhT) e.hc=e.hc?e.hc+(e.dhT-e.hc)*Math.min(1,dt*5):e.dhT;
    if(e.x>e.slot+0.5){ const v=(e.wasParked&&!enOn(e.key,'run'))?Math.max(e.spd,EN_STEP):e.spd;   /* já esteve num slot: anda rápido até o próximo */
      e.x-=Math.min(e.x-e.slot,((B.running?RUNV():0)+v)*dt*(ult?0.25:1)); e.parked=false; }
    else { if(e.x<e.slot-0.5) e.x+=Math.min(e.slot-e.x,30*dt); const was=e.parked; e.parked=e.idx<MAXVIS; if(e.parked) e.wasParked=true; if(e.parked&&!was) e.atkT=Math.min(e.atkT,0.15+0.12*e.idx); }   // chegou ao slot: ataca logo
    if(e.idx<(window.__atk2?2:MAXVIS)&&e.x<=LW){ e.atkT-=dt;   /* a cadência conta também enquanto ele troca de slot: ao parar, ataca logo (nenhum visível fica 2 s sem atacar) */
      if((e.parked||(e.wasParked&&e.x-e.slot<70))&&e.atkT<=0&&e.sw<=0&&B.t-B.eAtkT>=EGAP){   /* quem já esteve num slot e só está fechando a fila (até 70 px do slot novo) golpeia sem esperar chegar: nenhum visível fica mais de 2 s sem golpear */ e.atkT=e.atkEvery; B.eAtkT=B.t; { const sh=enSheet(e,'attack'); e.swD=sh?shDur(sh,EN_ATK_DUR):EATK; e.swH=sh?(EN_HIT_FRAME[e.key]!=null?EN_HIT_FRAME[e.key]/(sh.meta.fps||12):e.swD*0.5):EHIT; } e.sw=e.swD; e.struck=false; if(DEBUG) (window.__atk=window.__atk||[]).push([e.id,e.idx,+B.t.toFixed(2)]); } }
    if(e.sw>0&&!e.struck&&e.sw<=(e.swD||EATK)-(e.swH||EHIT)){ e.struck=true; const d=e.dmg*(e.fury||1)*(0.9+Math.random()*0.2), kind=ENEMY_RANGED[e.key];
      if(kind){ const x0=e.x-(e.dw||60)*0.35, y0=GY-(e.dh||80)*0.55, x1=HX+HS*0.1, y1=GY-HS*0.45;
        B.eshots.push({x0,y0,x1,y1,t:0,dur:Math.max(0.16,Math.hypot(x1-x0,y1-y0)/380),d,boss:e.boss,kind});
        wfx(fnHit,0.14,{x:x0-4,y:y0,r:e.boss?20:12,n:6,col:ESHOT_COL[kind],rot:Math.random()*6.28,layer:1}); }
      else if(heroHit(d,e)) return; }
  }
  for(let i=1;i<B.en.length&&i<MAXVIS;i++){ const a=B.en[i-1], b=B.en[i]; if(!b.parked&&b.x<a.x+16) b.x=a.x+16; }   // ninguém ultrapassa quem está na frente na fila
  for(const p of B.eshots){ p.t+=dt; if(p.t>=p.dur&&!p.done){ p.done=true; if(heroHit(p.d,p)) return; } }
  if(B.eshots.length) B.eshots=B.eshots.filter(p=>!p.done);
  B.enemy=target();
  // herói: corre até entrar em alcance; parado, ataca
  if(B.running){ const dx=RUNV()*dt; B.cam+=dx; for(const r of B.rings) r.x-=dx; for(const f of B.fx) f.x-=dx; }
  else if(!B.act&&B.enemy){
    const tut=typeof tutHold==='function'&&tutHold();
    if(B.energy>=100) startAct('s3');          
    else if(B.cd2<=0) startAct('s2');   /* v0.12.1 (ordem do dono): o jogo é SÓ AUTOMÁTICO; especial e ultimate disparam sozinhos sempre, sem modo manual e sem esperar o tutorial */
    else { h.atkT-=dt; if(h.atkT<=0){ h.atkT=h.ivl||BAL.s1Interval; startAct('s1'); } }   // intervalo do básico = Sys.stats.interval (0,8 s ÷ (1 + velocidade de ataque))
  }
  if(!B.en.length&&!B.toSpawn.length&&B.waveT<=0) waveClear();
}
const ERA_HOLD_MAX=20;

/* ---------- assets (sprites com cache + fallback) ---------- */
const IMGS={};
function IMG(path){
  let o=IMGS[path];
  if(!o){ const e=PRE().get(path); o=IMGS[path]={img:e.img,ok:e.ok,fail:e.fail,p:e.p};   /* Engenheiro 5: cache único do Preload; ok = DECODIFICADA */
    /* Engenheiro 10: folhas grandes de efeito (ultimate, subir de nível, efeitos em folha) ganham o PINO de decodificação (Preload.pin): a imagem só fica ok com o
       bitmap pronto, para o 1º quadro da ultimate não decodificar 3072x1512 dentro do desenho */
    /* Engenheiro 13 (memória): as folhas de ULTIMATE (3.072x1.512 = 17,7 MB cada) não são mais fixadas aqui: a pré-carga pedia 2 ou 3 (a própria, a base e a da
       era) e as 3 ficavam fixadas para sempre (53 MB). Quem fixa é o ultPinKeep (abaixo): só a que VAI TOCAR. */
    const big=/assets\/(anim\/fx|fx)\//.test(path)&&typeof PRE().pin==='function'&&PRE().pinOk;
    const pin=()=>big&&e.ok?PRE().pin(path).then(bm=>{ if(bm&&IMGS[path]===o) o.img=bm; },()=>{}):Promise.resolve();
    if(e.ok){ if(big) pin(); } else { o.p=e.p.then(()=>pin()).then(()=>{ if(!o.img) o.img=e.img; o.ok=e.ok; o.fail=e.fail; return e; }); } }
  return o.ok?o.img:null;
}
/* Engenheiro 13: PINO DA ULTIMATE = uma folha só, a que vai tocar (ultPlan sem "want": a própria se já está pronta, senão a base). Chamado pela pré-carga
   (a cada fase e a cada troca de arma). As outras voltam à imagem comum; o bitmap antigo não é fechado à força (uma ultimate em andamento ainda o desenha). */
const UPIN={path:null,busy:false};
function ultPinKeep(sheet){ let P=null; try{ P=PRE(); }catch(e){ return; } if(!P||!P.pinOk||typeof P.pin!=='function') return; const path=sheet?sheet+'.png':null;
  const drop=()=>{ if(!UPIN.path) return; const q=IMGS[UPIN.path]; if(q&&q.el){ q.img=q.el; q.el=null; } try{ P.unpin(UPIN.path,false); }catch(e){} UPIN.path=null; };
  if(!path){ drop(); return; } if(UPIN.path===path||UPIN.busy) return; IMG(path); const o=IMGS[path]; if(!o||o.fail) return;
  if(!o.ok||!o.img){ if(o.p&&!o.upw){ o.upw=true; o.p.then(()=>{ o.upw=false; try{ ultPinNow(); }catch(e){} },()=>{ o.upw=false; }); } return; }   /* ainda carregando: tenta de novo quando chegar */
  UPIN.busy=true; P.pin(path).then(bm=>{ UPIN.busy=false; if(!bm) return; if(IMGS[path]!==o){ try{ P.unpin(path,true); }catch(e){} return; } drop(); o.el=o.img; o.img=bm; UPIN.path=path; if(typeof pinWarm==='function') pinWarm(bm); try{ ultPinNow(); }catch(e){} },()=>{ UPIN.busy=false; }); }
function ultPinNow(){ const E=Math.min(SKN.length-1,wSkin().e), P=ultPlan(wArm(),E); ultPinKeep(P?P.sheet:null); }
const JSONS={};
function J(path){
  if(!(path in JSONS)){ JSONS[path]=null; const e=PRE().get(path); if(e.ok) JSONS[path]=e.data; else e.p.then(()=>{ JSONS[path]=e.ok?e.data:{}; }); }   /* Engenheiro 5: cache único do Preload */
  return JSONS[path]||{};
}
const tierOf = r => r<=1?0:r<=3?1:2;           // r0,r1->T0 · r2,r3->T1 · r4->T2
const heroKey = sk => `era${sk.e}_t${tierOf(sk.r)}`;
/* v0.12.5 ARMAS POR RARIDADE (arte nova): cada raridade tem a SUA imagem. Básico = eraN_t0 · Raro = eraN_raro · Épico = eraN_t1 · Mítico = eraN_mitico ·
   Lendário = eraN_t2 (assets/weapons/ e as mesmas chaves no meta.json). wKey/wPng valem para a ARMA; heroKey/tierOf continuam para a roupa. */
const W_RKEY=['t0','raro','t1','mitico','t2'];
const wKey = ws => ws.wk||('era'+ws.e+'_'+W_RKEY[Math.max(0,Math.min(4,ws.r|0))]);   /* ws.wk: arma de família sem arte de era (bow_<raridade>, boomerang_<raridade>) */
const wPng = ws => 'assets/weapons/'+wKey(ws)+'.png';
const SWT=0.4;                                  // duração do ataque básico
let HS=155;                                     // lado do quadro do herói em px lógicos (recalculado no resize)
const tc=document.createElement('canvas'); tc.width=tc.height=400; const tx=tc.getContext('2d');
/* Sprites pré-renderizados (offscreen, na escala usada). s={c,w,h,pad,fx,fy,fw,fh,bot} */
const SPRC={};
function bbox(im){
  /* CAIXA OPACA (bbox do alfa), medida uma vez por sprite numa grade de 256, SEM folga: altura, largura, margens e sobreposição do jogo usam
     esta caixa (as medidas do PO valem para os pixels opacos, não para o retângulo da imagem). Limiar: alfa > 40 de 255. */
  try{ const n=256, c=document.createElement('canvas'); c.width=c.height=n; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(im,0,0,n,n);
    const d=x.getImageData(0,0,n,n).data; let x0=n,y0=n,x1=-1,y1=-1;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++) if(d[(j*n+i)*4+3]>40){ if(i<x0)x0=i; if(i>x1)x1=i; if(j<y0)y0=j; if(j>y1)y1=j; }
    if(x1<0) return [0,0,1,1];
    return [x0/n,y0/n,(x1+1)/n,(y1+1)/n];
  }catch(e){ return [0,0,1,1]; }
}
function SPR(path,kind){
  let s=SPRC[path]; if(s) return s;
  const im=IMG(path); if(!im) return null;
  const bb=bbox(im); let f=kind==='hero'?[0,0,1,1]:bb;
  const sw=(f[2]-f[0])*im.naturalWidth, sh=(f[3]-f[1])*im.naturalHeight, mx=kind==='hero'?288:kind==='weapon'?300:320, k=mx/Math.max(sw,sh);
  const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(sw*k)); c.height=Math.max(1,Math.round(sh*k));
  c.getContext('2d').drawImage(im,f[0]*im.naturalWidth,f[1]*im.naturalHeight,sw,sh,0,0,c.width,c.height);
  s=SPRC[path]={c,w:c.width,h:c.height,pad:0,fx:f[0],fy:f[1],fw:f[2]-f[0],fh:f[3]-f[1],bot:bb[3]};
  delete IMGS[path]; PRE().drop(path);   /* já está no canvas pré-renderizado: solta a imagem (memória) */
  return s;
}
/* variante com tingimento leve + brilho por raridade, pré-renderizada */
const GLOWB=[0,5,8,11,15], TINT=[0,.08,.12,.16,.2];   // (a raridade mais visível na arma fica para a versão seguinte; valores da v0.12.3)
//   /* v0.12.4 (dono): raridades que repetem a imagem (tiers) ficam diferentes na mão: contorno/brilho e tinta na cor da raridade, crescente do Raro ao Lendário; o Básico fica sem nada */
function skinSpr(s,r){
  if(!s||r<1) return s;
  if(!s.v) s.v={};
  if(s.v[r]) return s.v[r];
  const col=RAR[r].c, pad=Math.round(GLOWB[r]*2.2), c=document.createElement('canvas'); c.width=s.w+pad*2; c.height=s.h+pad*2;
  const x=c.getContext('2d'); x.shadowColor=col; x.shadowBlur=GLOWB[r]*2; x.drawImage(s.c,pad,pad); x.shadowBlur=0;
  const t=document.createElement('canvas'); t.width=s.w; t.height=s.h; const y=t.getContext('2d'); y.drawImage(s.c,0,0); y.globalCompositeOperation='source-atop'; y.globalAlpha=TINT[r]; y.fillStyle=col; y.fillRect(0,0,s.w,s.h);
  x.drawImage(t,pad,pad);
  return s.v[r]={...s,c,pad,v:null,fist:null};
}
function dspr(s,x,y,dw,dh,flashCol,flashA){
  const kx=dw/s.w, ky=dh/s.h, X=x-s.pad*kx, Y=y-s.pad*ky, W=s.c.width*kx, H=s.c.height*ky;
  ctx.drawImage(s.c,X,Y,W,H);
  if(flashA>0){
    tc.width=s.c.width; tc.height=s.c.height; tx.drawImage(s.c,0,0);
    tx.globalCompositeOperation='source-atop'; tx.fillStyle=flashCol; tx.fillRect(0,0,tc.width,tc.height); tx.globalCompositeOperation='source-over';
    ctx.save(); ctx.globalAlpha*=Math.min(1,flashA); ctx.drawImage(tc,X,Y,W,H); ctx.restore();
  }
}
/* recorte circular do punho (redesenhado por cima da arma: mão "segurando") */
function fistSpr(s,ax,ay,r){
  const k=ax+'|'+ay+'|'+r; if(s.fist&&s.fist.k===k) return s.fist;
  const d=Math.max(4,Math.round(r*2*s.w)), c=document.createElement('canvas'); c.width=c.height=d; const x=c.getContext('2d');
  x.beginPath(); x.arc(d/2,d/2,d/2,0,7); x.clip(); x.drawImage(s.c,-(ax*s.w+s.pad-d/2),-(ay*s.h+s.pad-d/2));
  return s.fist={k,c};
}
/* brilho radial pré-renderizado por cor (evita criar gradiente por quadro) */
const GLOWS={};
function glowC(col){ let c=GLOWS[col]; if(c) return c; c=GLOWS[col]=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d');
  /* cor curta (#fff) vira #ffffff: '#fff'+'00' é cor inválida e o addColorStop lançava exceção (era o que acontecia com o pickup de Essência do Senhor da Era) */
  const c6=/^#[0-9a-f]{3}$/i.test(col)?'#'+col[1]+col[1]+col[2]+col[2]+col[3]+col[3]:col;
  try{ const g=x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'#ffffff'); g.addColorStop(.3,c6); g.addColorStop(1,c6+'00'); x.fillStyle=g; x.fillRect(0,0,64,64); }catch(er){ x.fillStyle='rgba(255,255,255,.35)'; x.beginPath(); x.arc(32,32,24,0,7); x.fill(); }
  return c; }
function drawGlow(col,x,y,r,a,add){ if(a<=0) return; const ga=ctx.globalAlpha, op=ctx.globalCompositeOperation; ctx.globalAlpha=ga*Math.min(1,a); if(add!==false) ctx.globalCompositeOperation='lighter'; ctx.drawImage(glowC(col),x-r,y-r,r*2,r*2); ctx.globalAlpha=ga; ctx.globalCompositeOperation=op; }
/* sprites de efeito genéricos (brancos) tingidos pela cor da raridade */
const FXS={};
function fxSpr(name,col){
  if(FX_ART[name]!=='sprite') return null;      // PNG parado reprovado: provisório em código
  const k=name+col; if(k in FXS) return FXS[k];
  const im=IMG(`assets/fx/${name}.png`); if(!im) return null;
  const c=document.createElement('canvas'); c.width=c.height=160; const x=c.getContext('2d'); x.drawImage(im,0,0,160,160);
  if(col!=='#ffffff'){ x.globalCompositeOperation='multiply'; x.fillStyle=col; x.fillRect(0,0,160,160); x.globalCompositeOperation='destination-in'; x.drawImage(im,0,0,160,160);
    x.globalCompositeOperation='lighter'; x.globalAlpha=.35; x.drawImage(im,0,0,160,160); }
  return FXS[k]=c;
}
/* correções finas por arma (dx,dy em px lógicos; s = escala; rot = rad) */
const WFIX={};
const hp = (kind,e,t) => `assets/${kind}/era${e}_t${t}.png`;
const EN_IDS = era => [`era${era}_e0`,`era${era}_e1`,`era${era}_boss`];
/* FUNDO ESTÁTICO DE RESERVA (quando o cenário vivo não carrega): assets/bg/era<N>.png; nas eras 7 e 8 o arquivo em disco é era<N>_ref.png (linha do chão em assets/bg/meta.json) */
const BG_FILE={7:'era7_ref',8:'era8_ref'}, bgPath = era => 'assets/bg/'+(BG_FILE[era]||'era'+era)+'.png';
function preloadEra(era){
  if(era<0||era>=ERAS.length) return;
  if(sceneOn(era)) sceneGet(era); else if(!BGS[bgPath(era)]) IMG(bgPath(era)); EN_IDS(era).forEach(k=>{ SPR(`assets/enemies/${k}.png`,'enemy'); enPreload(k); });
}
function preloadAssets(){
  J('assets/hero/anchors.json'); J('assets/weapons/meta.json'); J('assets/enemies/meta.json'); J('assets/bg/meta.json'); J('assets/fx/meta.json');
  const ae=SKIN(S.skinEq.armor), we=wSkin();
  SPR(hp('hero',ae.e,tierOf(ae.r)),'hero'); SPR(wPng(we),'weapon'); heroPreload(ae.e);
  ['hit','crit','muzzle','slash','aura'].forEach(n=>{ if(FX_ART[n]==='sprite') IMG(`assets/fx/${n}.png`); });
  ['s2','s1'].forEach(kd=>{ const A=FX_ART[kd][we.e]; if(A){ IMG(fxPng(A)); if(A.meta) J(A.sheet+'.json'); } });
  { const E=Math.min(SKN.length-1,we.e); for(const wt of [true,false]){ const P=ultPlan(wArm(),E,wt); if(P){ IMG(P.sheet+'.png'); J(P.sheet+'.json'); } }   /* ultimate da FAMÍLIA da arma: a desejada (base, ou a própria com a chave ligada) e a que toca enquanto a própria carrega (base) */
    if(we.wk&&ART_ON['ult_era'+E]){ IMG('assets/anim/ult/era'+E+'_ult.png'); J('assets/anim/ult/era'+E+'_ult.json'); }   /* arco/bumerangue: a folha de reserva também */
    ultPinNow(); }   /* Engenheiro 13: fixa só a folha que vai tocar */
  const era=eraOf(S.stage); preloadEra(era);
  if(((S.stage-1)%STAGES_PER_ERA)+1>=8){ preloadEra(era+1); if(typeof eraReady==='function') eraReady(era+1); }   /* próxima era em segundo plano (cenário, inimigos, chefe) */
}
const easeOut = t => 1-Math.pow(1-t,3);
const smooth = t => t*t*(3-2*t);
const pulse = x => x<=0||x>=1?0:Math.sin(x*Math.PI);
function swingEnv(sw){ return sw<0?0:(sw<.5?Math.sin(sw/.5*Math.PI/2):Math.cos((sw-.5)/.5*Math.PI/2)); }

/* ---------- efeitos de mundo (wfx) ---------- */
function mkBolt(x0,y0,x1,y1,n,j){ const p=[x0,y0]; for(let i=1;i<n;i++){ const k=i/n; p.push(x0+(x1-x0)*k+(Math.random()-.5)*j*2, y0+(y1-y0)*k+(Math.random()-.5)*j); } p.push(x1,y1); return p; }
function fnShock(o,k){ const q=easeOut(k); ctx.globalAlpha=1-k; ctx.strokeStyle=o.col; ctx.lineWidth=5*(1-k)+1; ctx.beginPath(); ctx.ellipse(o.x,GY+3,o.r*q,o.r*q*0.2,0,0,7); ctx.stroke(); }
function fnBolt(o,k){ const p0=o.pts, n0=p0.length/2, rev=Math.min(1,k/0.3), p=[];   // raio: desce em 30% do tempo e fica tremendo até sumir
  for(let i=0;i<n0;i++){ if(i/(n0-1)>rev+0.001) break; const edge=i===0||i===n0-1?0:1, ph=o.pts[2]*0.7+i*2.3; p.push(p0[i*2]+edge*Math.sin(B.at*70+ph)*o.w*0.9, p0[i*2+1]+edge*Math.cos(B.at*55+ph)*o.w*0.6); }
  if(p.length<4) return; ctx.globalAlpha=1-k*k; ctx.lineJoin='round'; ctx.globalCompositeOperation='lighter';
  for(let pass=0;pass<2;pass++){ ctx.strokeStyle=pass?'#ffffff':o.col; ctx.lineWidth=pass?o.w*0.4:o.w; ctx.beginPath(); ctx.moveTo(p[0],p[1]); for(let i=2;i<p.length;i+=2) ctx.lineTo(p[i],p[i+1]); ctx.stroke(); }
  drawGlow(o.col,p[p.length-2],p[p.length-1],o.w*5,1-k); }
function fnTracer(o,k){ ctx.globalAlpha=(1-k)*.95; ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'; ctx.strokeStyle=o.col; ctx.lineWidth=o.w; ctx.beginPath(); ctx.moveTo(o.x0+(o.x1-o.x0)*k*.6,o.y0+(o.y1-o.y0)*k*.6); ctx.lineTo(o.x1,o.y1); ctx.stroke();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=o.w*.4; ctx.stroke(); }
function crescent(r){ ctx.beginPath(); ctx.arc(0,0,r,-1.25,1.25); ctx.quadraticCurveTo(r*0.62,0,r*Math.cos(-1.25),r*Math.sin(-1.25)); ctx.fill(); }
function fnWave(o,k){ const x=o.x0+(o.x1-o.x0)*easeOut(k), a=k<.7?1:1-(k-.7)/.3; ctx.translate(x,o.y); drawGlow(o.col,0,0,o.r*1.5,a*.7);
  ctx.globalAlpha=a; ctx.globalCompositeOperation='lighter'; ctx.fillStyle=o.col; crescent(o.r); ctx.fillStyle='#ffffff'; ctx.globalAlpha=a*.8; ctx.scale(.86,.86); crescent(o.r); }
function fnArc(o,k){ const sl=fxSpr('slash',o.col), q=easeOut(k); ctx.translate(o.x+18*q,o.y); ctx.rotate(o.ang+(o.flip?-1:1)*(q-0.5)*1.1); const s=0.55+0.8*q; /* corte: varre girando, cresce e avança na direção do golpe */ ctx.scale(s,s); ctx.globalAlpha=1-k*k; ctx.globalCompositeOperation='lighter';
  if(sl){ if(o.flip) ctx.scale(1,-1); const W=o.r*2.6; ctx.drawImage(sl,-W*0.35,-W/2,W,W); return; }
  ctx.translate(-o.r*.6,0); ctx.fillStyle=o.col; crescent(o.r); ctx.fillStyle='#ffffff'; ctx.scale(.84,.84); crescent(o.r); }
/* impacto: estrela de riscos que cresce, gira, segue o golpe e some */
function fnHit(o,k){ const q=easeOut(k); ctx.translate(o.x+10*q,o.y-3*q); ctx.rotate(o.rot+k*1.2); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=1-k*k; ctx.lineCap='round';
  drawGlow(o.col,0,0,o.r*(0.5+0.5*q),(1-k)*.9);
  for(let i=0;i<o.n;i++){ const an=i*6.283/o.n, r0=o.r*(0.15+0.45*q), r1=o.r*(0.45+0.75*q)*(i%2?0.7:1); ctx.strokeStyle=i%2?o.col:'#ffffff'; ctx.lineWidth=(1-k)*(i%2?2:3.2)+.4; ctx.beginPath(); ctx.moveTo(Math.cos(an)*r0,Math.sin(an)*r0); ctx.lineTo(Math.cos(an)*r1,Math.sin(an)*r1); ctx.stroke(); } }
function fnExpl(o,k){ const q=easeOut(k), r=o.r*(0.35+0.9*q); drawGlow(o.col,o.x,o.y,r*1.5,1-k); drawGlow('#ffffff',o.x,o.y,r*.7,(1-k)*.9);
  ctx.globalAlpha=1-k; ctx.strokeStyle='#ffffff'; ctx.lineWidth=3*(1-k)+.5; ctx.beginPath(); ctx.arc(o.x,o.y,r,0,7); ctx.stroke(); }
function fnFlash(o,k){ ctx.globalAlpha=o.a*(1-k); ctx.fillStyle=o.col; ctx.fillRect(-10,-10,LW+20,LH+20); }
function fnSpr(o,k){ const q=easeOut(k), s=o.size*(0.45+0.75*q); ctx.globalAlpha=1-k*k; ctx.globalCompositeOperation='lighter'; ctx.translate(o.x+10*q,o.y-4*q); ctx.rotate((o.rot||0)+k*1.4); /* impacto: cresce, gira e segue o golpe */ ctx.drawImage(o.spr,-s/2,-s/2,s,s); }
function fnImg(o,k){ let a=k<.1?k/.1:k>.8?(1-k)/.2:1, s=1, x=o.x, y=o.y, r=0; const m=o.mode, q=easeOut(Math.min(1,k*2.2));
  if(m==='slide'){ x=o.x-(1-q)*LW*0.9; y+=Math.sin(k*30)*2*(1-q); }
  else if(m==='diag'){ x=o.x-(1-q)*120; y=o.y-(1-q)*160; }
  else if(m==='spin'){ r=B.t*1.6; s=k<.85?0.2+0.8*q:Math.max(0.05,(1-k)/.15); a=Math.min(1,k*8); }
  else if(m==='flick'){ r=Math.sin(B.t*9)*0.14; a*=0.75+0.25*Math.sin(B.t*47); s=0.8+0.2*q; }
  else if(m==='top'){ a*=0.7+0.3*Math.sin(B.t*60); }
  else s=0.5+0.5*q;
  const out=k>.78?(k-.78)/.22:0, pk=Math.sin(B.at*13)*0.035;                    // pico: pulsa; saída: cresce, avança e some
  if(m!=='spin'){ s*=1+pk+0.28*out*out; if(m!=='top'){ x+=26*k+40*out*out; y+=Math.sin(B.at*9)*2.5; } else x+=Math.sin(B.at*48)*3; }
  ctx.globalAlpha=Math.max(0,a)*(o.add?1:0.94); if(o.add) ctx.globalCompositeOperation='lighter';
  if(m==='top'){ const hh=Math.max(o.h,o.y/o.ay), ww=hh*o.w/o.h*s, top=o.y-hh*o.ay; ctx.beginPath(); ctx.rect(-20,top-2,LW+40,hh*Math.min(1,k*5)+2); ctx.clip(); ctx.drawImage(o.img,x-ww*o.ax,top,ww,hh); return; }   // raio: cai do topo (entrada), treme e pulsa   // raio: topo no topo da tela
  if(m==='spin'||m==='flick'){ const cx=x+(0.5-o.ax)*o.w, cy=y+(0.5-o.ay)*o.h; ctx.translate(cx,cy); ctx.rotate(r); ctx.scale(s,s); ctx.drawImage(o.img,-o.w/2,-o.h/2,o.w,o.h); return; }
  ctx.translate(x,y); ctx.scale(s,s); ctx.drawImage(o.img,-o.w*o.ax,-o.h*o.ay,o.w,o.h); }
function fnProj(o,k){ const x=o.x0+(o.x1-o.x0)*k, y=o.y0+(o.y1-o.y0)*k-o.arc*4*k*(1-k);
  if(o.kind==='rock'){ ctx.fillStyle='#6b5a48'; ctx.beginPath(); ctx.arc(x,y,o.r,0,7); ctx.fill(); ctx.fillStyle='#8a7a66'; ctx.beginPath(); ctx.arc(x-o.r*.25,y-o.r*.25,o.r*.55,0,7); ctx.fill(); }
  else if(o.kind==='ball'){ drawGlow('#ff9a3a',x-6,y,o.r*2.4,.7); ctx.fillStyle='#1c1c20'; ctx.beginPath(); ctx.arc(x,y,o.r,0,7); ctx.fill(); }
  else { ctx.translate(x,y); ctx.rotate(Math.atan2(o.y1-o.y0,o.x1-o.x0)); drawGlow('#ffb040',-12,0,10,.9); ctx.fillStyle='#d8dde4'; ctx.fillRect(-9,-2.5,16,5); ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.moveTo(7,-2.5); ctx.lineTo(13,0); ctx.lineTo(7,2.5); ctx.fill(); } }
function fnHole(o,k){ const R=o.r*Math.min(1,k*5)*(k>.9?(1-k)/.1:1)*(1+0.5*k); if(R<=0) return;
  drawGlow(o.col,o.x,o.y,R*2.6,.85); ctx.fillStyle='#05020c'; ctx.beginPath(); ctx.arc(o.x,o.y,R,0,7); ctx.fill();
  ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=o.col; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(o.x,o.y,R*1.75,R*0.5,B.t*2.2,0,7); ctx.stroke();
  ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(o.x,o.y,R*1.4,R*0.36,-B.t*3,0,7); ctx.stroke();
  ctx.fillStyle='#ffffff'; for(let i=0;i<12;i++){ const ph=(B.t*1.4+i*0.37)%1, rad=R*(3.4-ph*2.6), an=i*1.9+B.t*5+ph*4; ctx.globalAlpha=ph; ctx.fillRect(o.x+Math.cos(an)*rad-1.5,o.y+Math.sin(an)*rad*.7-1.5,3,3); } }
function drawWfx(layer){
  for(const o of B.wfx){ if(o.t<0||(o.layer||0)!==layer) continue; ctx.save(); o.fn(o,Math.min(1,o.t/o.dur)); ctx.restore(); }
}

/* ---------- desenho ---------- */
const BGS={};
function bgImg(era){
  const k=bgPath(era); if(BGS[k]) return BGS[k];
  const im=IMG(k); if(!im) return null;
  const w=Math.min(1280,im.naturalWidth), h=Math.round(w*im.naturalHeight/im.naturalWidth);
  const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(im,0,0,w,h);
  BGS[k]=c; delete IMGS[k]; return c;
}
/* pose do herói conforme a ação (antecipação -> golpe -> retorno) */
const PZ={dx:0,dy:0,rot:0,sx:1,sy:1,wang:0,rec:0,flash:0,trail:0};
function shotEnv(a,dec){ let m=0; for(const h of a.hits){ const d=a.t-h.t; if(d>=0&&d<dec) m=Math.max(m,1-d/dec); } return m; }
function heroPose(a,gun,t){
  const P=PZ; P.dx=P.dy=P.rot=P.rec=P.flash=P.trail=0; P.sx=P.sy=1; P.wang=gun?Math.sin(t*2.6)*0.03:0.35+Math.sin(t*2.6)*0.05;
  if(!a) return P;
  const u=Math.min(1,a.t/a.dur), E=a.era;
  if(gun){
    const s=shotEnv(a,a.type==='s1'?0.22:0.13); P.rec=s*(a.type==='s1'?7:9); P.flash=shotEnv(a,0.09); P.rot=-s*0.06; P.sx=1-s*0.03;
    if(a.type==='s3'){ const k=Math.min(1,a.t/0.5)*(a.t<1.95?1:Math.max(0,1-(a.t-1.95)/0.3)); P.wang=(E===3||E===5)?-1.0*k:0; P.dy=-6*k; P.rot-=0.1*k; }
    return P;
  }
  if(a.type==='s1'){
    if(u<.25){ const k=easeOut(u/.25); P.wang=0.35-0.95*k; P.rot=-0.09*k; P.dx=-4*k; P.sy=1-0.03*k; }
    else if(u<.55){ const k=easeOut((u-.25)/.3); P.wang=-0.6+2.55*k; P.rot=-0.09+0.27*k; P.dx=-4+18*k; P.sx=1+0.06*k; P.sy=0.97-0.02*k; P.trail=1; }
    else { const q=smooth((u-.55)/.45); P.wang=1.95-1.6*q; P.rot=0.18*(1-q); P.dx=14*(1-q); P.sx=1+0.06*(1-q); P.sy=1-0.05*(1-q); P.trail=q<.3?1:0; }
    return P;
  }
  if(a.type==='s2'){
    if(E===0){ const th=a.hits[0].t; if(a.t<th){ const k=a.t/th; P.dy=-56*Math.sin(k*Math.PI); P.dx=16*k; P.wang=-1.0+3.0*easeOut(Math.max(0,(k-.7)/.3)); P.rot=-0.15+0.4*k; P.trail=k>.7?1:0; }
      else { const k=Math.min(1,(a.t-th)/(a.dur-th)), q=smooth(k); P.sy=1-0.2*(1-q); P.sx=1+0.14*(1-q); P.wang=2.0-1.65*q; P.dx=16*(1-q); P.rot=0.25*(1-q); } }
    else if(E===1){ let m=0; for(const h of a.hits) m=Math.max(m,pulse((a.t-h.t+0.1)/0.2)); const k=Math.min(1,u*8)*Math.min(1,(1-u)*6); P.dx=28*m-4*k; P.wang=0.35+(1.2+0.1*m)*k; P.rot=0.12*m; P.sx=1+0.1*m; P.sy=1-0.05*m; P.trail=m>.6?1:0; }
    else if(E===2){ P.wang=0.35+Math.PI*4*smooth(u); P.dx=22*pulse(u); P.rot=0.14*pulse(u); P.dy=-6*pulse(u); P.trail=1; }
    else { const th=a.hits[0].t; if(a.t<th){ const k=easeOut(a.t/th); P.wang=0.35-1.3*k; P.rot=-0.12*k; P.dx=-6*k; } else { const k=Math.min(1,(a.t-th)/(a.dur-th)); P.wang=k<.3?-0.95+3.1*easeOut(k/.3):2.15-1.8*smooth((k-.3)/.7); P.dx=36*pulse(Math.min(1,k*1.2)); P.rot=0.2*(1-k); P.trail=k<.45?1:0; } }
    return P;
  }
  const k=Math.min(1,a.t/0.5);
  if(a.t<1.78){ P.wang=-0.75*k+Math.sin(t*40)*0.03; P.dy=-12*k+Math.sin(t*6)*1.5; P.rot=-0.13*k; }
  else if(a.t<1.95){ const q=easeOut((a.t-1.78)/0.17); P.wang=-0.75+2.8*q; P.dx=20*q; P.dy=-12*(1-q); P.rot=-0.13+0.35*q; P.trail=1; P.sx=1+0.08*q; P.sy=1-0.06*q; }
  else { const q=smooth(Math.min(1,(a.t-1.95)/0.4)); P.wang=2.05-1.7*q; P.dx=20*(1-q); P.rot=0.22*(1-q); }
  return P;
}
/* H: {x,gy,t,sk,ws,walking,hurt,deadP,act,main}
   Rig: anchors.json {hand,handR,angle} · weapons/meta.json {type,grip,angle(graus, 0=direita, 90=cima),len,muzzle,layer:"back"} */
/* SUBIR DE NÍVEL (aprovado): folha assets/anim/fx/levelup (quadros, fps, pés e âncora do .json), tocada UMA vez sobre o Kael, pés na linha do chão,
   na mesma escala do quadro do herói. B.lvfx = {t} é ligado em js/farm.js quando o nível sobe. */
const LVUP='assets/anim/fx/levelup_fx_low';   /* P21: versão com o "NÍVEL +1" a 150 px dos pés (a levelup_fx punha o texto na altura da barra de vida do herói, que é HTML e fica por cima do canvas) */
const LVUP_TXT={x0:137,y0:160};   /* canto de cima/esquerda do "NÍVEL +1" no quadro da levelup_fx_low (medido nos pixels, quadros 8 a 21: x 137..306, y 160..197); o .json pode trazer "text":{x0,y0} */
const LVUP_OLD_FX='assets/anim/fx/levelup_fx';   /* Engenheiro 4 (dono): versão SÓ-EFEITO (22 quadros, 448x384, pés em (224, 352)), por cima do herói desenhado, em qualquer herói/skin e montado. A folha antiga (levelup, com o Kael garoto desenhado) saiu de uso. */
/* A folha levelup TRAZ O KAEL GAROTO A PÉ desenhado (visto: por cima do herói montado/adolescente aparecia um segundo Kael criança com espada). Ela só vale quando o
   herói na tela É esse (Kael, fase 0, a pé). Nos outros casos (fases 1 a 3, montado, Kaia): efeito por código (coluna de luz + anel no chão), na escala do herói,
   até a Arte entregar a versão só-efeito (levelup_fx). */
const lvupPlain=()=>{ try{ return (typeof heroPhase!=='function'||heroPhase()===0)&&!heroLook().mount&&S.hero!=='kaia'; }catch(e){ return true; } };
function drawLevelUpCode(t,dur){ const u=Math.max(0,Math.min(1,t/dur)), k=(typeof phaseK==='function'?phaseK():1), a=Math.sin(u*Math.PI), rise=(typeof heroRise==='function'?heroRise():0), h=HS*(1.25*k)+rise, w=HS*0.5*k;
  ctx.save(); ctx.globalCompositeOperation='lighter';
  const g=ctx.createLinearGradient(0,GY-h,0,GY); g.addColorStop(0,'rgba(95,240,207,0)'); g.addColorStop(0.6,'rgba(95,240,207,'+(0.35*a).toFixed(3)+')'); g.addColorStop(1,'rgba(255,255,255,'+(0.55*a).toFixed(3)+')');
  ctx.fillStyle=g; ctx.fillRect(HX-w/2,GY-h,w,h);
  ctx.globalAlpha=a; ctx.strokeStyle='#bffcee'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(HX,GY,HS*(0.25+0.45*u)*k,HS*(0.06+0.1*u)*k,0,0,7); ctx.stroke();
  ctx.restore(); }
function drawLevelUp(){ const f=B.lvfx; if(!f) return;
  const sh=sheetLoad(LVUP,true); if(sh.fail){ const t=B.at-f.t0; if(t<0||t>=1.1){ B.lvfx=null; return; } drawLevelUpCode(t,1.1); return; }   /* arquivo faltando: efeito por código (reserva) */
  if(!sh.ok) return;
  const M=sh.meta, fi=Math.floor((B.at-f.t0)*(M.fps||12)); if(fi<0||fi>=M.frames){ B.lvfx=null; return; }
  const mo=!!heroLook().mount&&typeof heroRise==='function'&&heroRise()>0, k0=HS/256*(typeof phaseK==='function'?phaseK():1), ax=M.anchorX||M.w/2, fyv=M.feetY||M.h, tb=M.text||LVUP_TXT, th=fyv-tb.y0, tl=ax-tb.x0;
  let k=k0*(mo?1.3:1), cx=HX+(mo?HS*0.1:0);   /* na escala do herói; montado, maior (cobre herói + montaria) e centrado na sela */
  /* Engenheiro 17 (P21/P25): a barra de vida e a coluna de ícones são HTML, sempre por cima do canvas; o texto da folha não pode cair atrás delas.
     (1) montado: a folha ×1,3 punha o topo do texto na altura das barras (que ficam logo acima da cabeça): a escala cai até o topo do texto ficar abaixo da cabeça;
     (2) tela curta (16:9): a coluna esquerda (Equip./Invocar/Loja/Passe) desce até a altura do texto: o efeito anda para a direita até o texto livrar a coluna. */
  if(mo){ const top=heroBodyH()+heroRise()-4; if(th*k>top) k=Math.max(k0,top/th); }
  { const C=typeof FB_COL!=='undefined'?FB_COL:null; if(C&&C.r>0&&GY-th*k<C.b){ const d=C.r+2-(cx-tl*k); if(d>0) cx+=Math.min(HS*0.25,d); } }
  ctx.drawImage(sh.img,sheetSX(M,fi),sheetSY(M,fi),M.w,M.h,cx-ax*k,GY-fyv*k,M.w*k,M.h*k); }
const WING_DRAW=true;   // asa equipada desenhada atrás do Kael: escrita, NUNCA vista rodando; desligada até a versão do Modo dono
function drawHero(H){
  if(drawHeroAnim(H)) return;   // folhas híbridas (js/stage.js): a ASA é desenhada lá dentro, presa à âncora das costas de cada quadro
  if(WING_DRAW&&H.deadP<0&&typeof drawWings==='function') drawWings(H);   // reserva (sprite parado antigo)
  if(false) return;   // folhas híbridas (js/stage.js); abaixo, o sprite parado antigo como reserva
  const sk=H.sk, ws=H.ws, key=heroKey(sk), t=H.t;
  const body0=SPR(hp('hero',sk.e,tierOf(sk.r)),'hero');
  if(!body0){ if(H.main) drawHeroOld(); return; }
  const body=skinSpr(body0,sk.r), top0=body0.bot||0.95, gy=H.gy;
  const wk=wKey(ws), wm=J('assets/weapons/meta.json')[wk]||{}, gun=wIsGun(ws);
  const P=heroPose(H.act,gun,t);
  let bob,sx,sy,rot;
  if(H.walking){ bob=-Math.abs(Math.sin(t*14))*5; const s=Math.sin(t*28); sy=1+s*0.035; sx=1-s*0.035; rot=0.08+Math.sin(t*14)*0.03; }   // corrida
  else { const b=Math.sin(t*2.6); bob=b*-1.3; sy=1+b*0.022; sx=1-b*0.016; rot=0; }
  rot+=P.rot; sx*=P.sx; sy*=P.sy; bob+=P.dy;
  let ox=H.x+P.dx, alpha=1;
  if(H.hurt>0) ox+=(Math.random()-.5)*5;
  if(H.deadP>=0){ const p=H.deadP; rot=-1.45*Math.min(1,p*3.2); ox-=Math.min(1,p*3)*14; alpha=p>.55?Math.max(0.1,1-(p-.55)/.45):1; bob=0; }
  const sh=Math.max(.4,1+bob*0.012);
  ctx.save(); ctx.globalAlpha=0.35*alpha; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(ox,gy+2,28*sh,7*sh,0,0,7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(ox,gy+bob); ctx.rotate(rot); ctx.scale(sx,sy); ctx.globalAlpha=alpha;
  const T=tierOf(sk.r);
  if(T===2){ const au=fxSpr('aura',RAR[sk.r].c), a=0.45+0.15*Math.sin(t*3); if(au){ ctx.save(); ctx.globalAlpha=alpha*(a+.2); ctx.globalCompositeOperation='lighter'; ctx.translate(0,-HS*.45); ctx.rotate(t*0.5); ctx.drawImage(au,-HS*.7,-HS*.7,HS*1.4,HS*1.4); ctx.restore(); } else drawGlow(RAR[sk.r].c,0,-HS*.5,HS*.8,alpha*a); }
  if(H.act&&H.act.type==='s3'&&H.act.t<1.95) drawGlow(H.act.col,0,-HS*.45,HS*(0.6+0.25*Math.min(1,H.act.t)),0.5+0.2*Math.sin(t*20));
  const an=J('assets/hero/anchors.json')[key]||{}, anc=an.hand||[0.82,0.68], hr=(an.handR||0.05)*1.15;
  const hx=-HS/2+anc[0]*HS, hy=-HS*top0+anc[1]*HS;
  const grip=wm.grip||(gun?[0.26,0.6]:[0.5,0.78]);
  const w0=SPR(wPng(ws),'weapon'), wimg=skinSpr(w0,ws.r), fx=WFIX[wk]||WFIX[heroKey(ws)]||{}, back=wm.layer==='back';
  if(H.main) B.tipW=null;
  const drawW=()=>{
    const L=HS*(gun?0.72:0.82)*(fx.s||1), k=Math.min(L/Math.max(w0.w,w0.h),gun?HS*0.36*(fx.s||1)/w0.h:1e9), dw=w0.w*k, dh=w0.h*k;
    const gx=((grip[0]-w0.fx)/w0.fw)*dw, gy2=((grip[1]-w0.fy)/w0.fh)*dh;
    const ang=(typeof wm.angle==='number'?(wm.angle-(gun?0:90))*Math.PI/180:0)+(fx.rot||0)+P.wang-(gun?P.rec*0.03:0);
    let tx0,ty0;   // ponta (boca do cano / ponta da lâmina) no espaço da arma
    if(gun){ const mz=wm.muzzle; tx0=mz?((mz[0]-w0.fx)/w0.fw)*dw-gx:dw-gx; ty0=mz?((mz[1]-w0.fy)/w0.fh)*dh-gy2:dh*0.42-gy2; }
    else { const ln=typeof wm.len==='number'?wm.len*(dw/w0.fw):gy2, wa=typeof wm.angle==='number'?wm.angle*Math.PI/180:Math.PI/2; tx0=Math.cos(wa)*ln; ty0=-Math.sin(wa)*ln; }
    ctx.save(); ctx.translate(hx+(fx.dx||0),hy+(fx.dy||0)); ctx.rotate(ang); if(gun) ctx.translate(-P.rec,0);
    dspr(wimg,-gx,-gy2,dw,dh);
    if(gun){
      if(P.flash>0){ const mz=fxSpr('muzzle',H.act?H.act.col:'#ffffff'), r=16+10*P.flash;
        if(mz){ ctx.globalAlpha=alpha*P.flash; ctx.globalCompositeOperation='lighter'; ctx.drawImage(mz,tx0-2,ty0-r,r*2,r*2); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=alpha; }
        else drawGlow('#ffd45a',tx0+3,ty0,r,P.flash); }
    }else if(P.trail){ const col=H.act?H.act.col:'#ffffff', sl=fxSpr('slash',col), R=Math.hypot(tx0,ty0), ta=Math.atan2(ty0,tx0);
      ctx.globalAlpha=alpha*0.6; ctx.globalCompositeOperation='lighter';
      if(sl){ const W=R*1.5; ctx.translate(tx0*.5,ty0*.5); ctx.rotate(ta+Math.PI/2); ctx.drawImage(sl,-W*0.35,-W/2,W,W); }
      else { ctx.strokeStyle=col; ctx.lineWidth=7; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(0,0,R*0.9,ta-1.0,ta-0.06); ctx.stroke(); ctx.strokeStyle='#ffffff'; ctx.lineWidth=2.5; ctx.stroke(); } }
    ctx.restore();
    if(H.main){ const c=Math.cos(ang), s=Math.sin(ang), lx=hx+(tx0-(gun?P.rec:0))*c-ty0*s, ly=hy+(tx0-(gun?P.rec:0))*s+ty0*c, cr=Math.cos(rot), sr=Math.sin(rot);
      B.tipW={x:ox+(lx*sx)*cr-(ly*sy)*sr,y:gy+bob+(lx*sx)*sr+(ly*sy)*cr};
      if(!H.act&&H.deadP<0){ const rc=Math.max(HX+HS*0.4,Math.min(HX+HS*1.05,B.tipW.x+(gun?3:9))); B.reach+=(rc-B.reach)*0.2; } }
  };
  if(w0&&back) drawW();
  dspr(body,-HS/2,-HS*top0,HS,HS,'#ff3030',H.hurt>0?H.hurt/0.15*0.65:0);
  if(w0&&!back){ drawW(); const f=fistSpr(body,anc[0],anc[1],hr), fr=hr*HS; ctx.drawImage(f.c,hx-fr,hy-fr,fr*2,fr*2); }   // punho por cima: mão segurando
  else if(!w0&&H.main){ ctx.save(); ctx.translate(hx-14,hy+50); drawWeapon(ws); ctx.restore(); }
  ctx.restore();
}
/* ALTURAS (decisão do PO, pelo protótipo; px numa tela de 390 → px lógicos = px·330/390): herói ~160; comum 110–120 com variação por
   espécie (nunca abaixo de 100); chefe 180–200; Senhor da Era no topo da faixa. Se o chefe não couber inteiro, a largura manda (BOSS_FIT). */
const EN_SIZE={ common:SLOTH[1], boss:180*PX, eraBoss:192*PX, bossMin:150*PX, minH:SLOTMIN[0] };   // comum: altura do slot do meio; os outros slots escalam (SLOTSC). Chefe: alvo 180 px, mínimo 150 nos largos
function enemyH(e){ return (e.eraBoss?EN_SIZE.eraBoss:e.boss?EN_SIZE.boss:EN_SIZE.common)*enScale(e); }
/* folhas de corrida aprovadas (8 quadros de 256x256, 12 fps): assets/anim/<chave>_run.png. Só existem Goblin e Esqueleto da era 2;
   quem não tem folha desliza no chão com os pés fixos. Para ligar outra, basta acrescentar a chave. */
const EN_RUN={era2_e0:1,era2_e1:1};
/* FOLHAS POR ESPÉCIE (fps-ff): corrida, ATAQUE, DANO e MORTE. Formato: folha horizontal, quadro w x 256 (12 fps), com padLeft/padRight no .json
   (a célula original de 256 começa em x=padLeft; pés em y≈243). Hoje só a era 2 (Goblin, Esqueleto, Dragão Real). Quem não está na tabela usa o
   comportamento por código (desliza, avanço com inclinação, tomba ao morrer). O .json não marca o quadro de impacto: o dano sai no MEIO da animação. */
const EN_DIR='assets/anim/hyb/enemy/';
/* PARA LIGAR UMA ERA NOVA: acrescente o número em EN_ANIM_ERAS (os 12 arquivos <chave>_<run|attack|hurt|die>.png/.json em EN_DIR). Exceção de caminho
   em EN_ANIM_PATH. Se um arquivo faltar ou falhar, aquele estado cai no comportamento sem folha (desliza / avanço curto com inclinação / tomba). */
const EN_ANIM_ERAS=[0,1,2,3,4,5,6,7,8];   // as 7 eras aprovadas (docs/ARTE_APROVADA.md) + eras 7 (Submundo) e 8 (Celestial): 12 folhas por era conferidas em disco (test/e2e/eras78.js). Só aparecem quando a tabela ERAS ganhar as eras 7-8 (Sys.eras.extra)
/* ===== CHAVES DE ARTE (ordem do dono): só fica LIGADO o que ele aprovou. Para ligar um conjunto depois do voto, troque false por true AQUI.
   enemy_<estado>_era<N>: folhas dos inimigos (comuns e chefe da era; o chefe da era 2 tem chave própria na corrida).
   ult_era<N>: ultimate animada (assets/anim/ult). Desligado = provisório aprovado em código (desliza sem quique, ataque no lugar com até 12 px
   + inclinação + impacto no herói; ultimate por partículas). O cenário vivo por era é a chave sceneV2 da tabela ERAS (index.html): era 1 desligada. ===== */
/* GRANULAR: uma chave por INIMIGO e por ESTADO, com o nome do arquivo (<chave>_<run|attack|hurt|die>), e uma por ultimate (ult_era<N>).
   Estado inicial = banco de aprovações do dono lido pelo QA em 2026-11-12. true = aprovado e ligado; false = sem voto, desligado. */
const ART_ON={
  /* LISTA OFICIAL: docs/ARTE_APROVADA.md (220 aprovados) + reports/arte_aprovada_vs_jogo.md (arquivo, quadros, fps, pés e quadro do golpe).
     Auditoria item a item: reports/auditoria-aprovados.md. As 84 folhas de inimigo (7 eras x e0/e1/boss x run/attack/hurt/die) estão aprovadas:
     as chaves são criadas logo abaixo, todas ligadas. Para desligar uma, acrescente aqui, por exemplo: era4_e1_die:false. */
  ult_era0:true, ult_era1:true, ult_era2:true, ult_era3:true, ult_era4:true, ult_era5:true, ult_era6:true,   // ult-eraN-anim: as 7 aprovadas
  ult_era7:true, ult_era8:true,   // ult-era7-anim e ult-era8-anim: APROVADAS pelo dono em 12/11 (confirmado pelo PO em 13/11): folha-base das famílias infernal e celeste
  kael_die:NEXT_ON,       // morte nova do Kael (aprovada): assets/anim/hyb/R/kael_die_body
  en_idle_prep:NEXT_ON,   // inimigo parado = quadros de preparo do golpe em vai-e-volta (opção A aprovada)
  pistol_era4:true,   /* v0.12.4: revólver da era 4 APROVADO */
  //   // revólver da era 4 (versão corrigida em voto): DESLIGADA; ligada, a era 4 usa assets/anim/hyb/R/pistol/*_era4_t0
  kael_hybR_t0:true, kael_hybR_t1:true, kael_hybR_t2:true,                                 // Kael em folha COMPOSTA aprovada (hybR-run/idle/attack-era2_t<tier>): só com roupa E arma da era 2 no mesmo tier (js/stage.js)
  s1_era2_t0:true, s1_era2_t1:true, s1_era2_t2:true,                                       // golpe básico com rastro (kael_attack_trail_era2_t<tier>)
  s2_era2_t0:true, s2_era2_t1:true, s2_era2_t2:true,                                       // Corte Giratório (kael_spin_era2_t<tier>)
  aura4:true, aura7:true, aura10:true, aura13:true,                                        // auras de fortalecimento (assets/anim/aura): só aparecem com o +N da ARMA no Sys.forge
};
for(const E of EN_ANIM_ERAS) for(const kd of ['e0','e1','boss']) for(const st of ['run','attack','hurt','die']){ const k='era'+E+'_'+kd+'_'+st; if(ART_ON[k]===undefined) ART_ON[k]=true; }
ART_ON.era0_e0_hurt=false;   /* QA lote visual B ("cano cinza com clarão" solto ao lado do herói): a folha de dano do tigre (era0_e0_hurt.png, quadros 3 a 9) traz PINTADO um cano de arma com clarão de tiro à esquerda do bicho; desligada até a Arte refazer (sem ela vale o piscar de dano por código). Religar: apagar esta linha */
/* QUADRO DO GOLPE/TIRO de cada folha de ataque (contando do 0; medido pela dona da arte: a arma ou o tiro chega mais longe para a esquerda).
   O dano e o projétil saem nesse quadro; a folha toca no fps do .json (12), dentro do intervalo de ataque do balanceamento (que não muda). */
const EN_HIT_FRAME={ era0_e0:6, era0_e1:6, era0_boss:5, era1_e0:4, era1_e1:6, era1_boss:8, era2_e0:6, era2_e1:8, era2_boss:8, era3_e0:2, era3_e1:1, era3_boss:4,
  era4_e0:8, era4_e1:5, era4_boss:9, era5_e0:3, era5_e1:3, era5_boss:4, era6_e0:5, era6_e1:5, era6_boss:5,
  era7_e0:2, era7_e1:4, era7_boss:8, era8_e0:2, era8_e1:6, era8_boss:6 };   /* eras 7-8: medido nas folhas (1º quadro em que a parte opaca chega mais à esquerda; o mesmo cálculo devolve os valores das eras 5 e 6) */
const shDur=(sh,def)=>sh&&sh.meta&&sh.meta.frames?sh.meta.frames/(sh.meta.fps||12):def;   // duração real da folha (quadros ÷ fps do .json)
const enOn=(key,st)=>ART_ON[key+'_'+st]===true;
const EN_ANIM_PATH={ era2_e0:{run:'assets/anim/era2_e0_run'}, era2_e1:{run:'assets/anim/era2_e1_run'} };
const ENEMY_SETS={};
for(const E of EN_ANIM_ERAS) for(const kd of ['e0','e1','boss']){ const key=`era${E}_${kd}`, o={}; for(const st of ['run','attack','hurt','die']) o[st]=(EN_ANIM_PATH[key]&&EN_ANIM_PATH[key][st])||EN_DIR+key+'_'+st; ENEMY_SETS[key]=o; }
const EN_FEET_DEFAULT=243;   // linha dos pés na célula de 256 quando o .json não traz feetY
const EN_ATK_DUR=1.0, EN_HURT_DUR=0.4, EN_DIE_DUR=1.0;     // reservas (sem .json): cada folha toca no fps do próprio .json (shDur)
function enSheet(e,st){ const T=ENEMY_SETS[e.key]; if(!T||!T[st]||!enOn(e.key,st)) return null; const sh=sheetLoad(T[st],true); return sh.ok?sh:null; }
function enPreload(key){ const T=ENEMY_SETS[key], out=[]; if(T) for(const k in T) if(enOn(key,k)) out.push(sheetLoad(T[k],true).p.then(s=>{ if(s){ try{ enBounds(s); }catch(e){} } return s; })); return out; }   /* os limites opacos de cada folha são medidos AQUI, no carregamento da era (tela de loading), não na 1ª onda */
/* LIMITES OPACOS POR QUADRO de cada folha (medidos uma vez, na 1ª vez que a folha é desenhada): l, r, t, b em px do quadro (alfa > 40).
   Usados para cumprir o contrato SEM mexer na arte: (1) em combate, golpe, dano e morte nada opaco passa de x=382 nem fica abaixo de x=8: o quadro que
   passaria é deslocado só o que falta (na ENTRADA andando pode vir de fora); (2) a sola nunca fica abaixo da linha do chão: o quadro cuja parte opaca
   desce além do feetY é levantado só o que falta (chefes das eras 3 e 4 ao cair). */
const EN_BB_C=document.createElement('canvas'), EN_CTX={e:null,ox:0,walk:false,st:''};
function enBounds(sh){ if(sh.bb) return sh.bb; const M=sh.meta, n=M.frames, W=M.w, H=M.h, out=[];
  try{ EN_BB_C.width=W; EN_BB_C.height=H; const g=EN_BB_C.getContext('2d',{willReadFrequently:true});
    for(let i=0;i<n;i++){ g.clearRect(0,0,W,H); g.drawImage(sh.img,sheetSX(M,i),sheetSY(M,i),W,H,0,0,W,H); const d=g.getImageData(0,0,W,H).data; let l=W,r=-1,t=H,b=-1;
      for(let y=0;y<H;y++){ const row=y*W*4+3; for(let x=y&1;x<W;x+=2) if(d[row+x*4]>40){ if(x<l) l=x; if(x>r) r=x; if(y<t) t=y; if(y>b) b=y; } }
      out.push(r<0?null:{l:Math.max(0,l-1),r:Math.min(W,r+2),t,b:b+1}); } }catch(er){ for(let i=out.length;i<n;i++) out.push(null); }
  /* sola: se a folha INTEIRA assenta abaixo do feetY (todo quadro desce), o erro é da âncora da folha: sobe um valor FIXO (o menor excesso entre os
     quadros), sem tremer entre quadros. Na morte o corpo deita e o excesso cresce quadro a quadro: lá a correção é por quadro (assenta no chão). */
  { const fy=typeof M.feetY==='number'?M.feetY:(M.padTop||0)+EN_FEET_DEFAULT; let mn=1e9; for(const b of out) if(b) mn=Math.min(mn,b.b-1-fy); sh.lift=mn<1e9&&mn>1?mn:0; }
  return sh.bb=out; }
/* CHAVE: true = o slot do comum recua para o golpe/dano/morte caberem em x<=382 (pedido do PO na v0.11.5; custo: o do fundo fica menor nas eras em que a
   folha de golpe é bem mais larga que o sprite parado). false = centros fixos 222/282/338 e a arma do comum pode passar de 382 em alguns quadros. */
const EN_EXT_ON=false;   // DESLIGADA: medido na v0.11.5, ligar isto leva o slot do fundo ~27-37 px para a esquerda e a sobreposição meio×fundo vai a 64-109% com o meio e o fundo no mínimo (95/85 px). Ver reports/agente5-engenheiro.md
const EN_EXT={}, EN_EXTL={};
/* quanto a parte opaca da folha de GOLPE passa à ESQUERDA da âncora, por px de altura do inimigo (para o da frente não atravessar o Kael ao golpear) */
function enExtL(e,spr){ const c=EN_EXTL[e.key]; if(c) return c; const T=ENEMY_SETS[e.key]; if(!T||!spr||!enOn(e.key,'attack')) return null; const sh=sheetLoad(T.attack,true); if(!sh.ok) return null; const M=sh.meta; let ll=0;
  for(const b of enBounds(sh)) if(b){ const v=((spr.fx+spr.fw/2)-(b.l-(M.padLeft||0))/256)/spr.fh; if(v>ll) ll=v; }
  return EN_EXTL[e.key]={l:ll}; }
function enExt(e,spr){ const c=EN_EXT[e.key]; if(c) return c; const T=ENEMY_SETS[e.key]; if(!T||!spr) return null; let rr=0;
  for(const st of ['attack','hurt','die']){ if(!enOn(e.key,st)) continue; const sh=sheetLoad(T[st],true); if(!sh.ok) return null; const M=sh.meta;
    for(const b of enBounds(sh)) if(b){ const v=((b.r-(M.padLeft||0))/256-(spr.fx+spr.fw/2))/spr.fh; if(v>rr) rr=v; } }
  return EN_EXT[e.key]={r:rr}; }
function enFrame(sh,u,spr,F,loopT){ const M=sh.meta, n=M.frames, fi=loopT!=null?Math.floor(loopT*(M.fps||12))%n:Math.min(n-1,Math.max(0,Math.floor(u*n))), k=F/256;
  /* ÂNCORA PELO .json DE CADA FOLHA: largura e altura do quadro (M.w, M.h), nº de quadros e feetY (linha dos pés dentro do quadro) vêm do arquivo.
     O quadro é desenhado com a linha feetY em cima da linha dos pés do campo. Folha sem feetY (as corridas antigas era2_e0_run / era2_e1_run, 256x256):
     vale padTop + 243 (pés em 243 de 256 na célula original). Nada supõe quadro de 256 de altura nem a base do quadro como chão. */
  const fy=typeof M.feetY==='number'?M.feetY:(M.padTop||0)+EN_FEET_DEFAULT;
  /* v0.11.5 (PO): o CORPO NÃO DESLIZA por quadro. A âncora do pé fica parada; nos quadros de golpe/disparo do chefe a arte (cano, clarão, arma) pode
     passar de x=382. Só a sola é corrigida (ver enBounds). */
  const x0=-(spr.fx+spr.fw/2)*F-(M.padLeft||0)*k, C=EN_CTX, b=enBounds(sh)[fi]; let dy=0;
  /* PRÓXIMA VERSÃO (hoje só com a chave da 04b, para não mexer no caminho padrão que o QA está medindo): a referência da sola é o feetY do .json;
     o corpo NÃO sobe por causa de poeira, fumaça ou arma abaixo da linha (aceito pelo PO). Só a folha que traz o campo opcional "feetDy" no .json
     ({"<quadro>": px da célula, negativo = subir}) tem o quadro deslocado, escalado. Hoje: era3_boss_attack (cauda do Capitão Fantasma). */
  /* v0.11.6: a referência da sola é SEMPRE o feetY do .json. O corpo não sobe por causa de poeira, fumaça ou arma abaixo da linha (aceito pelo PO), nem na
     morte. Só o quadro listado no campo opcional "feetDy" do .json da folha ({"<quadro>": px da célula; negativo = sobe, positivo = desce}) é deslocado,
     na escala do inimigo. Hoje: era3_boss_attack e era3_boss_hurt (cauda do Capitão Fantasma). */
  { const fd=M.feetDy&&M.feetDy[fi]; dy=typeof fd==='number'?fd*k:0; if(b&&window.__probe2&&C.e) window.__probe2(C.e,C.st,C.ox+x0+b.l*k,C.ox+x0+b.r*k,(fy-b.t)*k-dy,(b.b-1-fy)*k+dy,C.ox,dy); }
  ctx.drawImage(sh.img,sheetSX(M,fi),sheetSY(M,fi),M.w,M.h,x0,-fy*k+dy,M.w*k,M.h*k); }
const EN_STRIDE={era0_e0:0.42,era0_e1:0.73,era0_boss:1.01, era1_e0:0.55,era1_e1:0.45,era1_boss:0.56, era2_e0:0.89,era2_e1:0.94,era2_boss:0.40,
  era3_e0:0.54,era3_e1:0.66,era3_boss:0.35, era4_e0:0.38,era4_e1:0.45,era4_boss:0.35, era5_e0:0.5,era5_e1:0.40,era5_boss:0.5, era6_e0:0.21,era6_e1:0.68,era6_boss:0.35};   // medidas da fps-ff (2026-11-12) pelo contato da sola; era1_e0/e1, era3_boss e era5_boss são estimativa; era5_e0 (drone) paira, valor livre   // lado-do-quadro por segundo, medido na folha: o pé de apoio recua ~19 px (Goblin) e ~20 px (Esqueleto) por quadro de 256 a 12 fps
function drawEnemyAt(e,x,deadP){
  const spr=SPR(e.spr,'enemy'), t=B.at, gy=GY+LANEY[e.lane];
  const dying=deadP>0;
  const walking=!dying&&!e.parked&&e.x<WAITX-1;
  // NADA de quique: os pés ficam na linha do chão o tempo todo. Parado = respiração (scaleY a partir da base). Ataque = inclinação/avanço curto pela base.
  let adv=0, rot=0, alpha=1, sy=1, lean=0;   // rot só na MORTE por código (tomba); em vida a inclinação é 'lean' (cisalhamento ancorado na base: os dois pés ficam na linha)
  if(e.sw>0&&!dying){ const k=eAdvK(e); adv=eAdv(e); lean=ENEMY_RANGED[e.key]?-0.07*k:0.22*k; }   // lean > 0 = topo para a ESQUERDA (para o herói); cisalhamento, a base não sai do chão   // corpo a corpo: avanço NO CHÃO até o herói e volta; de longe: recuo curto
  let ox=x-adv;
  if(!walking&&!dying&&!(e.sw>0)) sy=1+Math.sin(t*3+e.seed)*0.02;   // respiração: só scaleY (±2%) ancorado na base, só parado
  else if(walking&&!enOn(e.key,'run')) lean=0.06;                    // andando sem folha: desliza reto, com inclinação FIXA para a frente
  if(!dying&&e.hit>0){ const room=BOSS_X1-(x+(e.dw||0)*0.5), k=e.hit/0.12;   // levou golpe: recuo curto e inclinação para trás, SÓ até a margem de 382 (nada desenhado passa dela)
    const lb=Math.min(0.05,Math.max(0,room-0.5)/Math.max(1,e.dh||90)); lean-=lb; ox+=Math.max(0,Math.min(3*k,room-0.5-lb*(e.dh||90))); }
  const shDie=dying?enSheet(e,'die'):null, shAtk=!dying&&e.sw>0?enSheet(e,'attack'):null, shHurt=!dying&&!shAtk&&e.hurtT>0?enSheet(e,'hurt'):null, shRun=walking?enSheet(e,'run'):null;
  const shIdle=(!dying&&!shAtk&&!shHurt&&!walking&&ART_ON.en_idle_prep===true&&enOn(e.key,'attack'))?enSheet(e,'attack'):null;
  if(shAtk||shRun||shHurt) lean=0;                              // com folha o corpo não inclina (a folha já tem o movimento)
  let dark=0;
  if(dying){ if(shDie){ rot=0; alpha=deadP>0.8?Math.max(0,1-(deadP-0.8)/0.2):1; }
    else if(e.boss&&SCREENS_ON.bossResult){ const k=Math.min(1,deadP/0.6), q=k*k*(3-2*k); rot=0.21*q; sy=1-0.14*q; dark=0.62*q; alpha=deadP>0.8?Math.max(0,1-(deadP-0.8)/0.2):1; }   /* chefe sem folha de morte ligada: TOMBA girando pelos pés (os pés não saem da linha do chão), encolhe e escurece, como no canvas da tela 10 */
    else { alpha=Math.max(0,1-deadP*1.25); } }   // morte sem folha aprovada: some com fade no chão, no lugar (sem tombar nem girar)
  let dw=0,dh=0; if(spr){ dh=e.boss?enemyH(e):(e.hc||e.dhT||SLOTH[Math.min(e.idx,MAXVIS-1)]); dw=dh*spr.w/spr.h; if(e.boss){ const mw=(BOSS_WIDE[e.key]&&!(DEBUG&&window.__noScale))?BOSS_X1-BOSS_X0MIN:BOSS_FIT(); if(dw>mw){ let k=Math.max(mw/dw,Math.min(1,EN_SIZE.bossMin/dh)); k=Math.min(k,(BOSS_X1-BOSS_X0MIN)/dw); dh*=k; dw*=k; } }   // chefe: cabe pela LARGURA da caixa, sem cair abaixo da altura mínima
    /* comum: a altura vem do hordeFit (e.hc acompanha o alvo e.dhT com suavização) */ e.dw=dw; e.dh=dh; }
  ctx.save(); ctx.globalAlpha=0.35*alpha; ctx.fillStyle='#000'; ctx.beginPath(); ctx.ellipse(x-adv,gy+2,(spr?Math.max(20,dw*.42):22*e.size),5,0,0,7); ctx.fill(); ctx.restore();
  if(window.__probe) window.__probe(e,{x:ox,feet:gy,top:gy-dh*sy,dh,dw,sy,sx:1,rot,lean,adv,walking,atk:e.sw>0,dying,sheet:!!(shDie||shAtk||shHurt||shRun)});   // medição (QA): o que o desenho usa de fato
  ctx.save(); ctx.translate(ox,gy); ctx.rotate(rot); if(lean) ctx.transform(1,0,lean,1,0,0); ctx.globalAlpha=alpha;
  { const shU=shDie||shAtk||shHurt||shRun||shIdle; if(shU?EN_FLIP_SHEET[shU.base]:EN_FLIP[e.key]) ctx.scale(-1,1); }   // arquivo virado para a direita: espelha só o corpo (sombra, barra e nome ficam de fora); flag por ARQUIVO (estático x folha)
  EN_CTX.e=e; EN_CTX.ox=ox; EN_CTX.walk=walking&&!e.wasParked; EN_CTX.st=shDie?'die':shAtk?'attack':shHurt?'hurt':shRun?'run':'idle';
  if(spr){
    const F=dh/spr.fh;                       // F = lado do quadro inteiro (512 da arte) na tela
    e.spd=enOn(e.key,'run')?(EN_STRIDE[e.key]||0.9)*F:EN_WALK;
    if(e.boss&&!(dying&&SCREENS_ON.bossResult)) drawGlow(e.eraBoss?'#ff2a2a':'#ff7a30',0,-dh*.5,dh*.8,alpha*(e.eraBoss?0.4:0.28),false);
    if(!shAtk) e.inAtk=false; if(!shAtk&&!shIdle) e.idA=null;
    if(shDie) enFrame(shDie,deadP,spr,F);                                              // morte: toca a folha e some no fim
    else if(shAtk){ if(!e.inAtk){ e.inAtk=true; e.atk0=e.idA!=null?(e.idF||0)/(shAtk.meta.frames||1):0; } e.idA=null; enFrame(shAtk,e.atk0+(1-e.atk0)*(1-e.sw/(e.swD||EATK)),spr,F); }   /* Engenheiro 2: o golpe começa no quadro em que o preparo estava (sem pulo para o quadro 0) */                          // ataque
    else if(shHurt) enFrame(shHurt,1-e.hurtT/(e.hurtD||EN_HURT_DUR),spr,F);                       // levando dano
    else if(shRun) enFrame(shRun,0,spr,F,e.wt);
    else if(shIdle){ if(e.idA==null) e.idA=B.at; e.inAtk=false; const n=shIdle.meta.frames||1, m=Math.max(1,Math.min(EN_IDLE_N,n)), per=Math.max(1,2*m-2), ph=Math.floor((B.at-e.idA)*EN_IDLE_FPS)%per, fi=ph<m?ph:per-ph; e.idF=fi; enFrame(shIdle,(fi+0.5)/n,spr,F); }   /* relógio próprio: o preparo recomeça do quadro 0 depois de golpe/dano/corrida */   // preparo do golpe, indo e voltando                                        // corrida (pés do quadro na linha do chão)
    else { ctx.scale(1,sy); if(dark>0) dspr(spr,-dw/2,-dh,dw,dh,'#0a0705',dark); else dspr(spr,-dw/2,-dh,dw,dh,'#fff',(!dying&&e.hit>0)?e.hit/0.12*0.85:0); }
  }else drawEnemyOld(e,1,sy,dying);
  ctx.restore();
}
function bar(x,y,w,pct,col,hh){ hh=hh||7; ctx.fillStyle='#0008'; ctx.fillRect(x,y,w,hh); ctx.fillStyle=col; ctx.fillRect(x,y,w*Math.max(0,pct),hh); ctx.strokeStyle='#000a'; ctx.lineWidth=1; ctx.strokeRect(x,y,w,hh); }
function enemyLabel(e){
  const own=typeof era9Name==='function'?era9Name(e.key):null; if(own) return own;   /* eras 7-8: nome próprio do chefe (js/eras9.js), sem prefixo */
  const mn=(J('assets/enemies/meta.json')[e.key]||{}).name;
  if(!mn) return e.name;
  return e.eraBoss?'Senhor da Era '+mn:e.boss?'Chefe '+mn:mn;   /* sem emoji (regra do dono) */
}
/* cenário rolando: imagem | cópia espelhada | imagem ... (sem costura) */
const BGM={}; let bgFade=null;
function bgMirror(img,k){ let m=BGM[k]; if(m) return m; m=BGM[k]=document.createElement('canvas'); m.width=img.width; m.height=img.height; const x=m.getContext('2d'); x.translate(img.width,0); x.scale(-1,1); x.drawImage(img,0,0); return m; }
let bgSeam=null, bgSeamK='';
function drawBG(){
  const era=B.dispEra, sc=sceneFrame(era);
  if(sc){   // cenário vivo (canvas próprio atrás deste): aqui só a faixa abaixo da cena
    ctx.clearRect(-12,-12,LW+24,LH+24); const yb=GY/sc.gy;
    if(yb<LH+12){ if(bgSeamK!==sc.shade){ bgSeamK=sc.shade; bgSeam=document.createElement('canvas'); bgSeam.width=1; bgSeam.height=32; const x=bgSeam.getContext('2d'), g=x.createLinearGradient(0,0,0,32); g.addColorStop(0,`rgba(${sc.shade},0)`); g.addColorStop(1,`rgba(${sc.shade},1)`); x.fillStyle=g; x.fillRect(0,0,1,32); }
      ctx.fillStyle=`rgb(${sc.shade})`; ctx.fillRect(-12,yb-1,LW+24,LH-yb+14); ctx.drawImage(bgSeam,-12,yb-26,LW+24,26); }
    return; }
  const img=bgImg(era);
  ctx.fillStyle='#14110f'; ctx.fillRect(0,0,LW,LH);
  if(!img){ drawBGOld(); return; }
  for(const k in BGM) if(k!==String(era)){ delete BGM[k]; delete BGS[bgPath(k)]; }   // libera a era anterior
  const gm=(J('assets/bg/meta.json')['era'+era]||{}).groundY||0.72, g0=gm+0.05, ar=img.width/img.height;
  const h=GY/g0, w=Math.round(h*ar), m=bgMirror(img,era), off=B.cam%(2*w);
  for(let i=0,x=-off;x<LW;i++,x+=w) ctx.drawImage(i%2?m:img,x,0,w+1,h);
  if(h<LH){ if(!bgFade){ bgFade=document.createElement('canvas'); bgFade.width=1; bgFade.height=64; const x=bgFade.getContext('2d'), g=x.createLinearGradient(0,0,0,64); g.addColorStop(0,'rgba(20,17,15,0)'); g.addColorStop(1,'rgba(20,17,15,1)'); x.fillStyle=g; x.fillRect(0,0,1,64); }
    ctx.drawImage(bgFade,0,h-46,LW,48); }
}
const HM={x:HX,gy:0,t:0,sk:null,ws:null,walking:false,hurt:0,deadP:-1,act:null,main:true};
/* ASAS NOVAS (Engenheiro 5): o heroLook (index.html) só devolve 'angel' | 'demon'. Com a chave do módulo ligada (Sys.stats.DATA.newWings, ou
   newWingReady[id]) a asa desenhada é a que Sys.stats.wingOf devolver para o item equipado (qualquer id de DATA.wingTypes; json e PNG carregam sob demanda
   no drawWingsAt). Chave desligada: sai no primeiro teste e vale o heroLook. Asa escondida (hidden.wing) ou skin de asa escolhida: não mexe. */
/* paciência da troca de equipamento: a peça nova espera a arte ficar pronta por até 12 s; passou disso (arquivo faltando), entra assim mesmo com a reserva */
const LOOKW={};
function lookWait(part,id){ const k=part+':'+id, now=performance.now(); let o=LOOKW[part]; if(!o||o.k!==k) o=LOOKW[part]={k,t0:now}; return now-o.t0>12000; }
/* drawHeroFull em outras telas: tudo o que o herói pedido usa está pronto? (dispara as cargas) */
function fullReady(H){ const F=heroForm(); let ok=true;
  if(F.hero==='kael'&&F.stage===0&&!F.skin){ const set=heroSet(H.sk?H.sk.e:2); for(const st of ['idle','run','attack']) if(!SHEET(set[st])) ok=false; }
  else if(!phaseReady(F.stage)) ok=false;
  if(H.mount&&typeof mountReady==='function'&&mountPrefix()&&!mountReady(H.mount.id)) ok=false;
  if(H.wing&&typeof wingReady==='function'&&!wingReady(H.wing)) ok=false;
  if(H.ws){ if(!SPR(wPng(H.ws),'weapon')) ok=false; const pe=pistolEra(H.ws); if(pe>=0&&!pistolReady(pe)) ok=false; }
  return ok; }
function wingNow(lk){ const w=lk&&lk.wing; if(!w) return w;
  try{ const ST=window.Sys&&Sys.stats, D=ST&&ST.DATA; if(!D||typeof ST.wingOf!=='function') return w; let on=D.newWings===true; if(!on) for(const k in D.newWingReady){ if(D.newWingReady[k]===true){ on=true; break; } } if(!on) return w;
    const ap=S.sys&&S.sys.appearance; if(ap&&ap.skin&&typeof ap.skin.wing==='string') return w;
    const wi=S.eq&&S.eq.wing!=null?itemOf(S.eq.wing):null, id=wi?ST.wingOf(wi):null; return (typeof id==='string'&&D.wingTypes[id])?id:w; }catch(e){ return w; } }
function draw(){
  ctx=mainCtx;
  ctx.save();
  { const lim=3*LW/(cv.clientWidth||LW), amp=Math.min(B.shake*4,lim); B.shx=B.shake>0?(Math.random()-.5)*2*amp:0; if(DEBUG&&B.shx){ const px=Math.abs(B.shx)*(cv.clientWidth||LW)/LW; if(!(window.__shxMax>=px)) window.__shxMax=px; } }   /* Engenheiro 2: TETO de 3 px de TELA (regra do dono); antes o golpe final da ultimate chegava a ±5,2 px lógicos */   // tremor (só ultimate e golpe de chefe): SÓ HORIZONTAL e o MESMO deslocamento para o cenário (js/stage.js) e os personagens: ninguém sai da linha do chão
  if(B.shx) ctx.translate(B.shx,0);
  drawBG();
  if(B.dim>0.01){ ctx.fillStyle=`rgba(4,2,14,${B.dim*0.68})`; ctx.fillRect(-10,-10,LW+20,LH+20); }
  drawWfx(0);
  for(const c of B.corpses) drawEnemyAt(c.e,c.x,c.t/(c.life||0.6));
  const h=B.hero, L=B.en;
  HM.x=HX+heroLunge(); HM.gy=GY; HM.t=B.at; HM.sk=SKIN(S.skinEq.armor); { const lk=lookNow(), wg=wingNow(lk), mo=lk.mount;   /* Engenheiro 5: asa e montaria NOVAS só entram no desenho quando as folhas delas estão decodificadas; até lá fica a anterior, inteira */
    if(!wg||wg===HM.wing||typeof wingReady!=='function'||wingReady(wg)||lookWait('wing',wg)) HM.wing=wg;
    if(!mo||(HM.mount&&HM.mount.id===mo.id)||typeof mountReady!=='function'||mountReady(mo.id)||lookWait('mount',mo.id)) HM.mount=mo; }   /* mesma montaria que já está no desenho: sem conferir as 3 folhas de novo a cada quadro */ { const w=wSkin(); if(w!==HM.ws){ HM.ws=w; preloadAssets(); } }   /* trocou a arma (equipar item ou skin): carrega a arte na hora */ HM.walking=B.running&&B.deadT<=0&&!B.res; HM.hurt=B.hurt; HM.deadP=B.deadT>0?1-B.deadT/1.6:-1; HM.act=B.act;
  /* Engenheiro 2: trocou montaria/pet/estágio NO MEIO da onda → a folga do inimigo da frente é refeita na hora (antes só na onda seguinte: a asa do pet evoluído encostava no inimigo) */
  { const he=heroEdge(); if(B.heK!=null&&Math.abs(he-B.heK)>1&&B.deadT<=0&&!B.res){ try{ layoutHorde(); }catch(e){} } B.heK=he; }
  const ultOn=!!(B.act&&B.act.type==='s3');
  if(!ultOn){ drawHero(HM); if(typeof drawEvo==='function') drawEvo(); }
  for(let i=L.length-1;i>=0;i--) if(L[i].x<WAITX-1&&!(L[i].sw>0)) drawEnemyAt(L[i],L[i].x,0);   // 3º atrás do 2º, 2º atrás do 1º
  for(let i=L.length-1;i>=0;i--) if(L[i].x<WAITX-1&&L[i].sw>0) drawEnemyAt(L[i],L[i].x,0);       // quem está atacando passa pela frente
  for(const p of B.eshots){ const k=Math.min(1,p.t/p.dur), col=ESHOT_COL[p.kind], big=p.kind==='shell'||p.kind==='fire'||p.boss;   // projéteis dos inimigos, em código
    for(let j=5;j>=0;j--){ const kj=Math.max(0,k-j*0.035), x=p.x0+(p.x1-p.x0)*kj, y=p.y0+(p.y1-p.y0)*kj-(p.kind==='shell'?26*4*kj*(1-kj):0); drawGlow(col,x,y,(big?11:6)*(1-j/7)*(p.kind==='fire'?1.5+0.3*Math.sin(B.at*40+j):1),j?0.6*(1-j/6):1,false);
      if(!j){ ctx.fillStyle=p.kind==='shell'?'#2a2a30':'#ffffff'; ctx.strokeStyle='#3a1a08'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(x,y,big?4.5:2.6,0,7); ctx.fill(); ctx.stroke(); } } }   /* núcleo sólido: aparece também sobre fundo claro */
  if(ultOn){ drawWfx(2); drawHero(HM); }
  if(typeof drawPet==='function') drawPet();   // v0.12.7 (dono): pet AO LADO e um pouco À FRENTE do Kael, por cima da montaria
  if(typeof drawHatch==='function') drawHatch();   // ovo chocando (por cima da cena, abaixo do HUD)   // herói sempre por cima do efeito da ultimate
  drawWfx(1);
  if(B.act&&B.act.fly) drawBoom();   /* bumerangue no ar (só existe com a família ligada) */
  // barras de vida depois dos efeitos (nunca cobertas)
  ctx.textAlign='center'; ctx.lineJoin='round';
  if(!B.res) for(const e of L){ if(e.x>LW+40) continue;
    const top=e.dh||(e.boss?150:95), gy=GY+LANEY[e.lane], vx=eX(e);
    if(e.boss){ const bw=Math.max(80,Math.min((e.dw||90)*.8,110)), bx=Math.max(bw/2+4,Math.min(LW-bw/2-4,vx)); bar(bx-bw/2,gy-top-12,bw,e.hp/e.maxhp,'#ff5252');
      ctx.font='800 11px system-ui'; ctx.fillStyle=e.eraBoss?'#ffd75e':'#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=3;
      const lb=enemyLabel(e), tw=ctx.measureText(lb).width, lx=Math.max(tw/2+4,Math.min(LW-tw/2-4,vx)); ctx.strokeText(lb,lx,gy-top-16); ctx.fillText(lb,lx,gy-top-16); }
    else if(e.hp<e.maxhp||e===B.enemy) bar(vx-21,gy-top-9,42,e.hp/e.maxhp,'#ff5a4e',5);
  }
  { const nw=waitingN(); if(nw>0&&B.deadT<=0&&!B.res){ const tx='+'+nw, pop=1+0.06*Math.sin(B.at*5);   // fila de espera: selo na borda direita, na altura do chão
      ctx.save(); ctx.font=`${LILITA()?'400':'900'} 15px ${LILITA()?'"Lilita One",':''}system-ui`; const tw=Math.max(29,ctx.measureText(tx).width+12), bx=LW-tw/2-6*PX, by2=GY-86*PX;
      ctx.translate(bx,by2); ctx.scale(pop,pop); ctx.fillStyle='#ff5a4e'; ctx.strokeStyle='#7a1a14'; ctx.lineWidth=1.5; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-tw/2,-11,tw,22,11); else ctx.rect(-tw/2,-11,tw,22); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#ffffff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(tx,0,1); ctx.restore(); } }
  if(B.eraHold){ ctx.save(); ctx.font='800 12px system-ui'; ctx.textAlign='center'; ctx.lineJoin='round'; ctx.lineWidth=3; ctx.strokeStyle='#000'; ctx.fillStyle='#ffe9c8'; const tx='Carregando a próxima era'+'.'.repeat(1+Math.floor(B.at*2)%3); ctx.strokeText(tx,LW/2,GY-HS-40); ctx.fillText(tx,LW/2,GY-HS-40); ctx.restore(); }
  drawLevelUp();   /* P21: subir de nível DEPOIS das barras de vida e dos selos do canvas (o texto nunca fica atrás deles) */
  drawPicks();
  for(const p of B.parts){ const a=Math.max(0,1-p.t/p.life); ctx.globalAlpha=a; ctx.fillStyle=p.col;
    if(p.glow) ctx.globalCompositeOperation='lighter'; const s=p.sz*(p.glow?a+.4:1); ctx.fillRect(p.x-s/2,p.y-s/2,s,s); if(p.glow) ctx.globalCompositeOperation='source-over'; }
  ctx.globalAlpha=1;
  for(const r of B.rings){ const k=r.t/0.45; ctx.globalAlpha=Math.max(0,1-k); ctx.strokeStyle=r.col; ctx.lineWidth=3*(1-k)+1; ctx.beginPath(); ctx.arc(r.x,r.y,6+r.max*easeOut(Math.min(1,k)),0,7); ctx.stroke(); }
  ctx.globalAlpha=1; ctx.textAlign='center';
  for(const f of B.fx){ const k=f.t, pop=1+0.6*Math.max(0,1-k*7); ctx.globalAlpha=Math.max(0,1-k*k);
    ctx.font=`${LILITA()?'400':'900'} ${Math.round((f.big===2?34:f.big===3?23:f.big?21:15)*pop)}px ${LILITA()?'"Lilita One",':''}system-ui`; const yy=f.y-easeOut(k)*(f.big===2?54:40), xx=Math.max(24,Math.min(LW-24,f.x));
    ctx.lineWidth=f.big===2?6:4; ctx.lineJoin='round'; ctx.strokeStyle='#000'; ctx.strokeText(f.txt,xx,yy); ctx.fillStyle=f.col; ctx.fillText(f.txt,xx,yy); }
  ctx.globalAlpha=1;
  ctx.restore();
  if(B.dim>0.01){ if(!vigC){ vigC=document.createElement('canvas'); vigC.width=vigC.height=128; const x=vigC.getContext('2d'), g=x.createRadialGradient(64,64,30,64,64,90); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.85)'); x.fillStyle=g; x.fillRect(0,0,128,128); }
    ctx.globalAlpha=B.dim; ctx.drawImage(vigC,0,0,LW,LH); ctx.globalAlpha=1; }
  const bn=B.banner, by=Math.max(96,GY-HS-110);
  if(bn){ const k=bn.t, al=Math.min(1,k/0.12)*Math.min(1,(bn.dur-k)/0.3), sc=1+0.5*Math.max(0,1-k*6)+0.03*Math.sin(B.at*7), y=bn.small?by+34:by;
    ctx.save(); ctx.globalAlpha=Math.max(0,al); ctx.textAlign='center'; ctx.translate(LW/2,y); ctx.scale(sc,sc); ctx.lineJoin='round';
    if(bn.pill){ const L=LILITA(); ctx.font=`${L?'400':'900'} 22px ${L?'"Lilita One",':''}system-ui`; const pw=ctx.measureText(bn.txt).width+32; ctx.fillStyle=bn.bg||'rgba(120,40,200,.85)'; ctx.strokeStyle=bn.bd||'#d9b3ff'; ctx.lineWidth=2; ctx.beginPath(); if(ctx.roundRect) ctx.roundRect(-pw/2,-20,pw,38,11); else ctx.rect(-pw/2,-20,pw,38); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.strokeStyle=bn.sh||'#3a0d6a'; ctx.lineWidth=3; ctx.strokeText(bn.txt,0,7); ctx.fillText(bn.txt,0,7); ctx.restore(); }
    else {
    if(!bn.small){ ctx.fillStyle='#000a'; ctx.fillRect(-LW,-22,LW*2,bn.sub?44:34); }
    if(bn.sub){ ctx.font='800 10px system-ui'; ctx.fillStyle='#fff'; ctx.fillText(bn.sub,0,-10); }
    ctx.font=`900 ${bn.small?14:22}px system-ui`; ctx.lineWidth=bn.small?4:5; ctx.strokeStyle='#000'; ctx.fillStyle=bn.col==='#ffffff'&&!bn.small?'#ffd75e':bn.col; ctx.strokeText(bn.txt,0,bn.sub?12:6); ctx.fillText(bn.txt,0,bn.sub?12:6);
    ctx.restore(); } }
  if(B.flash>0){ ctx.save(); ctx.globalAlpha=Math.min(0.55,B.flash*2.2); ctx.fillStyle='#fff'; ctx.fillRect(0,0,LW,LH); ctx.restore(); B.flash=Math.max(0,B.flash-(B.fdt>0?B.fdt:1/60)); }   // clarão do golpe final (Mítico e Lendário)
  if(B.deadT>0){ { const quiet=B.deadBoss&&SCREENS_ON.bossResult; ctx.fillStyle=quiet?`rgba(0,0,0,${Math.min(.6,(1.6-B.deadT)*.6)})`:'#000a'; ctx.fillRect(0,0,LW,LH); if(!quiet){ ctx.fillStyle='#ff6b6b'; ctx.font='800 26px system-ui'; ctx.textAlign='center'; ctx.fillText('DERROTADO',LW/2,GY-90); } } }   /* tela 10 ligada: chefe sem o letreiro (a tela 10 de derrota abre em seguida) */
  const tr=B.tr;
  if(tr){
    const a=tr.t<0.45?tr.t/0.45:Math.max(0,1-(tr.t-0.45)/0.55);
    ctx.fillStyle=`rgba(255,240,200,${a*0.9})`; ctx.fillRect(0,0,LW,LH);
    if(tr.t>0.5&&tr.t<2.8){
      const k=tr.t-0.5, al=Math.min(1,k/0.3)*Math.min(1,(2.8-tr.t)/0.5), sc=1+0.25*Math.max(0,1-k*4);
      ctx.save(); ctx.globalAlpha=al; ctx.fillStyle='#0009'; ctx.fillRect(0,by-28,LW,70); ctx.textAlign='center';
      ctx.translate(LW/2,by); ctx.scale(sc,sc);
      ctx.font='900 24px system-ui'; ctx.lineWidth=5; ctx.lineJoin='round'; ctx.strokeStyle='#5a2a05'; ctx.fillStyle='#ffd75e'; ctx.strokeText('NOVA ERA',0,0); ctx.fillText('NOVA ERA',0,0);
      ctx.font='800 16px system-ui'; ctx.lineWidth=4; ctx.strokeStyle='#000'; ctx.fillStyle='#fff'; const nm=ERAS[tr.to].n; ctx.strokeText(nm,0,28); ctx.fillText(nm,0,28);
      ctx.restore();
    }
  }
}
let vigC=null, lilitaOk=false, lilitaT=0;
function LILITA(){ if(lilitaOk) return true; const now=performance.now(); if(now-lilitaT>1000){ lilitaT=now; try{ lilitaOk=!!(document.fonts&&document.fonts.check('15px "Lilita One"')&&[...document.fonts].some(f=>/Lilita/.test(f.family)&&f.status==='loaded')); }catch(e){} } return lilitaOk; }
function tickFx(dt){
  if(B.endPend&&!B.res&&!B.inst){ const eo=B.endPend; B.endPend=null; try{ if(window.Panels&&Panels.on('end9')) Panels.open('end9',eo); }catch(er){ console.error('end9',er); } }   /* a vitória fechou: Fim das 9 eras */
  if(B.eraPend&&!B.res&&!B.inst){ const eo=B.eraPend; B.eraPend=null; try{ if(window.Panels&&Panels.on('era')) Panels.open('era',eo); }catch(er){ console.error('era',er); } }   /* a vitória fechou: agora a Troca de era */

  B.at+=dt*(B.paused?1:B.speed);   // relógio da animação do herói (não para na pausa: nada estático)
  if(B.running&&B.deadT<=0&&!B.paused){ const st=Math.floor(B.at*3); if(st!==B.step){ B.step=st; dust(HX-HS*0.1,GY-1,2); } }   // poeira a cada passada (2 por ciclo de 8 quadros a 12 fps)
  const gt=document.body.classList.contains('sheet')?sheetGY():LH*FIELD_FEET; GY=Math.abs(gt-GY)<0.5?gt:GY+(gt-GY)*Math.min(1,dt*9);
  tickPicks(dt);
  for(const f of B.fx) f.t+=dt*1.1; B.fx=B.fx.filter(f=>f.t<1);
  for(const p of B.parts){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.g*dt; } if(B.parts.length){ B.parts=B.parts.filter(p=>p.t<p.life); if(B.parts.length>PART_MAX) B.parts.splice(0,B.parts.length-PART_MAX); }
  for(const r of B.rings) r.t+=dt; B.rings=B.rings.filter(r=>r.t<0.45);
  for(const c of B.corpses){ if(c.e.holdC) c.t=Math.min(c.t+dt,(c.life||0.6)*0.79); else c.t+=dt; if(B.running&&!B.res) c.x-=RUNV()*dt; }   /* holdC: o chefe caído fica no chão enquanto a tela de vitória está aberta */ B.corpses=B.corpses.filter(c=>c.t<(c.life||0.6));
  if(B.wfx.length){ for(const o of B.wfx) o.t+=dt; B.wfx=B.wfx.filter(o=>o.t<o.dur); }
  if(B.banner){ B.banner.t+=dt; if(B.banner.t>=B.banner.dur) B.banner=null; }
  if(B.shake>0) B.shake=Math.max(0,B.shake-dt*3);
  const ult=B.act&&B.act.type==='s3'&&B.act.t<2.05; B.dim+=((ult?1:0)-B.dim)*Math.min(1,dt*9);
  const cur=B.res?B.dispEra:eraOf(S.stage);   // a troca de cenário espera a tela de resultado fechar
  if(cur!==B.dispEra&&!B.tr&&!B.eraHold&&(typeof eraReady!=='function'||eraReady(cur)||(B.eraWait||0)>=ERA_HOLD_MAX)){ B.tr={t:0,to:cur}; if(typeof sceneTrim==='function') setTimeout(sceneTrim,4000);   /* cenários das outras eras saem da memória depois da troca */ if(!B.paused){ snd('era_change'); music('era'+cur); } }
  if(B.tr){ B.tr.to=cur; B.tr.t+=dt; if(B.tr.t>0.45&&B.dispEra!==B.tr.to) B.dispEra=B.tr.to; if(B.tr.t>2.9) B.tr=null; }
  const sk=SKIN(S.skinEq.armor);
  if(tierOf(sk.r)===2&&B.deadT<=0&&Math.random()<dt*10)
    B.parts.push({x:HX+(Math.random()-.5)*44,y:GY-Math.random()*HS*.75,vx:(Math.random()-.5)*8,vy:-18-Math.random()*20,g:0,t:0,life:1,col:RAR[sk.r].c,sz:3,glow:true});
  // faíscas saindo da ponta da arma durante o golpe
  const a=B.act; if(a&&B.tipW&&!a.gun&&PZ.trail&&Math.random()<dt*60)
    B.parts.push({x:B.tipW.x,y:B.tipW.y,vx:(Math.random()-.5)*50,vy:(Math.random()-.5)*50,g:120,t:0,life:.3,col:a.col==='#ffffff'?'#ffe9a8':a.col,sz:2.5,glow:true});
}

/* linha dos pés com painel aberto (Skins, Missões, Passe): o painel começa em 40% da tela; os pés ficam 46 px de tela acima dele (faixa das habilidades) */
function sheetGY(){ const app=document.getElementById('app'), st=cv.parentNode, k=cv.clientWidth/LW||1; return Math.max(HS+30,(app.clientHeight*0.40-st.offsetTop-46)/k); }
/* ---------- prévia animada (aba Skins) ---------- */
const PV={x:0,gy:0,t:0,sk:null,ws:null,walking:false,hurt:0,deadP:-1,act:null,main:false}; let pvT=0, pvN=0;
function drawPreview(dt){
  const c=document.getElementById('pvc'); if(!c) return;
  const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, hgt=c.clientHeight; if(!w) return;
  if(c.width!==Math.round(w*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(hgt*dpr); }
  const x=c.getContext('2d'), k=c.height/190; x.setTransform(k,0,0,k,0,0); x.clearRect(0,0,w*dpr/k+2,192);
  pvT+=dt; PV.t=pvT; PV.sk=SKIN(pvSkin.armor||S.skinEq.armor); PV.ws=(pvSkin.weapon&&SKIN(pvSkin.weapon))||wSkin(); PV.x=(c.width/k)/2-8; PV.gy=176; PV.lay=(pvSkin.armor&&typeof layOfSkin==='function'&&typeof layersOk==='function'&&layersOk())?layOfSkin(pvSkin.armor):undefined;   /* a roupa-skin OLHADA aparece com as camadas dela */
  if(PV.act){ PV.act.t+=dt; if(PV.act.t>=PV.act.dur) PV.act=null; }
  else if(pvT>pvN){ const ws=PV.ws, gun=wIsGun(ws), ty=(Math.floor(pvT/1.7)%3===2)?'s2':'s1'; pvN=pvT+1.7;
    const a={type:ty,t:0,era:ws.e,gun,col:ws.r>0?RAR[ws.r].c:'#ffffff',hits:[],dur:ty==='s1'?SWT:S2DUR[ws.e]};
    if(ty==='s1') a.hits.push({t:gun?0.03:0.19}); else S2HITS[ws.e].forEach(h=>a.hits.push({t:h[0]})); PV.act=a; }
  ctx=x; try{ drawHero(PV); }finally{ ctx=mainCtx; }
}

/* ---------- VITRINE DO EQUIPAMENTO: Kael parado (respirando) num canvas, com a MESMA regra de aparência da batalha (heroLook) ----------
   drawHeroPreview(canvas, look, dt): look = {armor, weapon} (objetos de SKINS). O quadro do herói ocupa a ALTURA do canvas; pés em 243/256 da altura. */
const HPVW={x:0,gy:0,t:0,sk:null,ws:null,walking:false,hurt:0,deadP:-1,act:null,main:false}; let hpvT=0, hpvWs=null;
function drawHeroPreview(c,look,dt){
  const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, hgt=c.clientHeight; if(!w||!hgt) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(hgt*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(hgt*dpr); }
  const x=c.getContext('2d'), k=c.height/HS; x.setTransform(k,0,0,k,0,0); x.clearRect(0,0,c.width/k+2,HS+2);
  hpvT+=dt||0; HPVW.t=hpvT; HPVW.sk=look.armor; HPVW.ws=look.weapon; HPVW.wing=look.wing; HPVW.mount=look.mount; HPVW.x=(c.width/k)/2; HPVW.gy=HS*243/256;
  if(hpvWs!==look.weapon){ hpvWs=look.weapon; preloadAssets(); }
  ctx=x; try{ drawHero(HPVW); }finally{ ctx=mainCtx; }
}
function drawGearPreview(dt){ const c=document.getElementById('gkc'); if(c){ const lk=heroLook(); lk.wing=wingNow(lk); lk.weapon=wFamLook(lk.weapon); drawHeroPreview(c,lk,dt); } }   /* vitrine: a mesma asa e a mesma arma (família) da batalha */

/* ---------- laço ---------- */
let last=performance.now(), hudT=0, saveT=0;
/* ===== 60 QUADROS POR SEGUNDO + QUALIDADE ADAPTATIVA (Engenheiro 5; ordem do dono: a 120 Hz o aparelho esquenta à toa) =====
   LIMITE: o laço mede a taxa da TELA (quartil baixo dos intervalos do requestAnimationFrame, refeito a cada 40 chamadas) e desenha 1 a cada N chamadas, N inteiro
   = piso(Hz ÷ 60 + 0,15): 60 Hz → 1 (nada muda) · 90 → 1 (90) · 120 → 2 (60) · 144 → 2 (72) · 180 → 3 (60) · 240 → 4 (60). Divisor inteiro = ritmo igual
   em todo quadro (sem alternar 8/25 ms nem derivar); nunca fica abaixo de 60. TODA a lógica anda por delta de tempo (rdt), então a velocidade do jogo é a mesma.
   Chaves de comparação (só ?debug=1): &fps=120 sem limite · &fps=60 o padrão · &peso=1 queima ~14 ms por quadro (para ver a qualidade adaptativa).
   QUALIDADE (FP.q 0 → 2): a média de quadros fica abaixo de 55/60 do alvo por 2 janelas de 2 s → desce um degrau; sobe de volta só depois de 5 janelas seguidas
   (10 s) com a média no alvo E o trabalho do quadro abaixo de metade do orçamento (sem piscar). Degrau 1: metade das partículas. Degrau 2: partículas a 1/4 e o
   cenário vivo em resolução 0,7 (js/stage.js). NUNCA sai herói, montaria, pet, asa, inimigo nem barra.
   Medidor de debug (index.html mostra window.__fps): "média (pior quadro em ms, degrau)". Números crus: window.__fpsStat = {avg, worstMs, workMs, hz, n, q}. */
const FPS_Q=DEBUG&&typeof QP!=='undefined'?QP.get('fps'):null, FPS_FREE=FPS_Q==='120'||FPS_Q==='0', FPS_PESO=DEBUG&&typeof QP!=='undefined'&&QP.get('peso')==='1';
const FP={hz:60,n:1,i:0,raw:[],lastRaw:0,w0:0,wf:0,work:0,worst:0,q:0,low:0,high:0};
const PART_Q=[1,0.5,0.25];
function fpsWindow(now){ const el=now-FP.w0; if(el<2000) return; const avg=FP.wf*1000/el, target=FP.hz/FP.n, work=FP.wf?FP.work/FP.wf:0, ok=!document.hidden&&!B.paused&&FP.wf>10&&el<2600;
  window.__fpsStat={avg:Math.round(avg*10)/10,worstMs:Math.round(FP.worst*10)/10,workMs:Math.round(work*10)/10,hz:Math.round(FP.hz),n:FP.n,q:FP.q};
  window.__fps=Math.round(avg)+' (pior '+Math.round(FP.worst)+' ms, q'+FP.q+') ';
  /* só desce o degrau quando o trabalho do PRÓPRIO jogo pesa (mais de 40% do orçamento do quadro): se a média cai com o jogo folgado (aba em segundo plano, navegador ou
     aparelho segurando os quadros), tirar partículas não ajuda e não é feito */
  if(ok){ if(avg<target*55/60&&work>400/target){ FP.low++; FP.high=0; } else { FP.low=0; if(avg>=target*0.97&&work<500/target) FP.high++; else FP.high=0; }
    /* Engenheiro 13 (sem piscar): se o degrau desce de novo menos de 30 s depois de ter subido, a subida seguinte passa a exigir o dobro de janelas boas (5 → 10 → 20 → 40,
       isto é, 10 s → 80 s); antes um aparelho no limite podia alternar de degrau a cada ~14 s para sempre */
    if(FP.low>=2&&FP.q<2){ FP.q++; FP.low=0; FP.high=0; if(FP.upAt&&now-FP.upAt<30000) FP.upNeed=Math.min(40,(FP.upNeed||5)*2); fpsApply(); } else if(FP.high>=(FP.upNeed||5)&&FP.q>0){ FP.q--; FP.high=0; FP.low=0; FP.upAt=now; fpsApply(); } }
  FP.w0=now; FP.wf=0; FP.work=0; FP.worst=0; }
function fpsApply(){ try{ if(typeof sceneQuality==='function') sceneQuality(FP.q>=2?0.7:1); }catch(e){} if(DEBUG) console.log('qualidade adaptativa: degrau '+FP.q); }
/* ===== PERFIL DE PICOS (Engenheiro 10; SÓ com ?debug=1&pf=1: fora disso PF é null e nada é medido) =====
   Por quadro: tempo de step / tickFx / draw / prévias / hud / save. Guarda os 20 PIORES quadros (trabalho do jogo) com o que estava acontecendo, as tarefas
   longas do navegador (> 50 ms, PerformanceObserver), cada drawImage acima de 1,5 ms (decodificação na 1ª vez de uma folha) e cada save(). Ler: __pf.report(). */
const PF=(DEBUG&&typeof QP!=='undefined'&&QP.get('pf')==='1')?{n:0,sum:0,max:0,o8:0,o16:0,o33:0,o50:0,gap50:0,gapMax:0,worst:[],tags:[],seg:{step:0,fx:0,draw:0,prev:0,hud:0,save:0},segMax:{step:0,fx:0,draw:0,prev:0,hud:0,save:0},long:[],saves:{n:0,sum:0,max:0,bytes:0},slow:{},init:false}:null;
function pfTag(s){ if(PF&&PF.tags.length<12) PF.tags.push(s); }
function pfInit(){ PF.init=true;
  try{ const P=CanvasRenderingContext2D.prototype, o=P.drawImage; P.drawImage=function(im){ const t=performance.now(); const r=o.apply(this,arguments); const d=performance.now()-t;
      if(d>1.5){ const nm=(im&&im.src)?im.src.replace(/^.*\/assets\//,''):(im&&im.width?'canvas '+im.width+'x'+im.height:'?'); pfTag('drawImage '+nm+' '+d.toFixed(1)+'ms'); const q=PF.slow[nm]||(PF.slow[nm]={n:0,max:0}); q.n++; if(d>q.max) q.max=Math.round(d*10)/10; } return r; }; }catch(e){}
  try{ const s0=save; save=function(){ const t=performance.now(); const r=s0.apply(this,arguments); const d=performance.now()-t; PF.saves.n++; PF.saves.sum+=d; if(d>PF.saves.max) PF.saves.max=d; if(d>0.5) pfTag('save '+d.toFixed(1)+'ms'); return r; }; }catch(e){}
  PF.fn={}; for(const nm of ['updHudExtra','hudSys','syncSpeed','fbTick','fcNotice','startWave','preloadAssets','statsChanged','render','refreshHero','codexSync','petStep','resTick','fbLayout','layoutHorde','lootTick','evhTick']){ try{ const f0=window[nm]; if(typeof f0!=='function') continue; const q=PF.fn[nm]={n:0,sum:0,max:0};
      window[nm]=function(){ const t=performance.now(); const r=f0.apply(this,arguments); const d=performance.now()-t; q.n++; q.sum+=d; if(d>q.max) q.max=d; if(d>2) pfTag(nm+' '+d.toFixed(1)+'ms'); return r; }; }catch(e){} }
  try{ new PerformanceObserver(l=>{ for(const e of l.getEntries()){ if(PF.long.length<60) PF.long.push({ms:Math.round(e.duration),at:Math.round(e.startTime),stg:S.stage+'-'+S.wave,act:B.act?B.act.type:'',hid:document.hidden}); } }).observe({entryTypes:['longtask']}); }catch(e){}
  window.__pf={ raw:PF, reset(){ PF.n=PF.sum=PF.max=PF.o8=PF.o16=PF.o33=PF.o50=PF.gap50=PF.gapMax=0; PF.worst=[]; PF.long=[]; PF.slow={}; PF.saves={n:0,sum:0,max:0,bytes:0}; for(const k in PF.seg){ PF.seg[k]=0; PF.segMax[k]=0; } for(const k in PF.fn){ PF.fn[k].n=0; PF.fn[k].sum=0; PF.fn[k].max=0; } },
    report(){ const r1=v=>Math.round(v*100)/100, sg={}, sm={}; for(const k in PF.seg){ sg[k]=r1(PF.seg[k]/Math.max(1,PF.n)); sm[k]=r1(PF.segMax[k]); }
      return {quadros:PF.n,mediaMs:r1(PF.sum/Math.max(1,PF.n)),piorMs:r1(PF.max),acima8:PF.o8,acima16:PF.o16,acima33:PF.o33,acima50:PF.o50,intervaloAcima50:PF.gap50,intervaloMax:Math.round(PF.gapMax),mediaPorParte:sg,piorPorParte:sm,
        saves:{n:PF.saves.n,mediaMs:r1(PF.saves.sum/Math.max(1,PF.saves.n)),piorMs:r1(PF.saves.max)},funcoes:Object.keys(PF.fn).filter(k=>PF.fn[k].n).map(k=>k+' n'+PF.fn[k].n+' média '+r1(PF.fn[k].sum/PF.fn[k].n)+' pior '+r1(PF.fn[k].max)).join(' · '),
        pinos:(()=>{ try{ const P=PRE(); return {n:P.pins(),MB:r1(P.pinBytes()/1048576),picoMB:r1(P.pinPeak()/1048576),cortesPeloTeto:typeof PINS!=='undefined'?PINS.cut:0,recusadasPeloTeto:typeof PINS!=='undefined'?PINS.refused:0}; }catch(e){ return null; } })(),jsHeapMB:(performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null),tarefasLongas:PF.long,drawLento:PF.slow,piores:PF.worst.map(w=>w.ms+'ms ['+w.seg+'] '+w.st+(w.tags.length?' | '+w.tags.join('; '):''))}; } }; }
function pfEnd(gap,a,b,c,d,e,f,g){ const tot=g-a; PF.n++; PF.sum+=tot; if(tot>PF.max) PF.max=tot; if(tot>8) PF.o8++; if(tot>16.7) PF.o16++; if(tot>33) PF.o33++; if(tot>50) PF.o50++;
  if(!document.hidden&&gap<1000){ if(gap>50) PF.gap50++; if(gap>PF.gapMax) PF.gapMax=gap; }
  const v=[b-a,c-b,d-c,e-d,f-e,g-f], K=['step','fx','draw','prev','hud','save']; for(let i=0;i<6;i++){ PF.seg[K[i]]+=v[i]; if(v[i]>PF.segMax[K[i]]) PF.segMax[K[i]]=v[i]; }
  const W=PF.worst; if(tot>4&&(W.length<20||tot>W[W.length-1].ms)){ let st=''; try{ st='fase '+S.stage+'-'+S.wave+' t'+Math.round(B.at)+' ato:'+(B.act?B.act.type:'-')+' inim:'+B.en.length+' part:'+B.parts.length+' wfx:'+B.wfx.length+(B.tr?' TROCA-ERA':'')+(B.lvfx?' NIVEL':'')+(B.deadT>0?' MORTE':'')+(B.res?' RESULTADO':'')+(typeof view!=='undefined'&&view!=='battle'?' tela:'+view:''); }catch(er){}
    W.push({ms:Math.round(tot*10)/10,seg:K.map((k,i)=>k+' '+v[i].toFixed(1)).filter((s,i)=>v[i]>=0.5).join(', '),st,tags:PF.tags.slice()}); W.sort((x,y)=>y.ms-x.ms); if(W.length>20) W.length=20; }
  PF.tags.length=0; }
function loop(now){
  { const d=now-FP.lastRaw; FP.lastRaw=now; if(d>2&&d<60){ FP.raw.push(d); if(FP.raw.length>=40){ let sm=0; for(let i=0;i<40;i++) sm+=FP.raw[i]; const hz=40000/sm; FP.raw.length=0;   /* Engenheiro 7: taxa pela MÉDIA dos 40 intervalos, não pelo quartil baixo: em tela de 60 Hz com quadros irregulares (8 ms / 25 ms alternados, PC ou celular carregado) o quartil dava "120 Hz" e o jogo passava a desenhar 1 a cada 2 (30 por segundo). A média nunca passa da taxa real; com quadros perdidos ela só erra para MENOS (sem pular quadro) */ if(hz>30&&hz<400){ FP.hz=hz; FP.n=FPS_FREE?1:Math.max(1,Math.floor(hz/60+0.15)); } } }
    if(++FP.i<FP.n){ requestAnimationFrame(loop); return; } FP.i=0; }   /* tela de 120/144 Hz: pula as chamadas do meio (nada é calculado nem desenhado nelas) */
  const w0=performance.now(), pfGap=now-last; let pA=0,pB=0,pC=0,pD=0,pE=0; if(PF&&!PF.init) pfInit();
  const rdt=(DEBUG&&window.__frz)?0:Math.min(0.1,(now-last)/1000); { const ms=now-last; if(ms<1000){ FP.wf++; if(ms>FP.worst) FP.worst=ms; } if(!FP.w0) FP.w0=now; } last=now; B.fdt=rdt; B.fk=Math.min(1,rdt*60);
  let dt=rdt; if(B.slow>0){ B.slow-=rdt; dt=rdt*0.3; }
  /* um erro num quadro NUNCA pode matar o laço do jogo (antes, uma exceção no desenho parava tudo para sempre: o requestAnimationFrame ficava no fim) */
  try{
  if(!B.paused){ const n=B.speed; for(let i=0;i<n;i++){ step(dt); if(typeof petStep==='function') petStep(dt); if(B.inst&&typeof instStep==='function') instStep(dt); } }
  if(typeof resTick==='function') resTick(rdt);
  if(PF) pA=performance.now();
  tickFx(dt); if(PF) pB=performance.now(); draw();
  }catch(er){ if(!window.__loopErr||performance.now()-window.__loopErr>2000){ window.__loopErr=performance.now(); console.error('loop',er); } try{ ctx=mainCtx; ctx.setTransform(1,0,0,1,0,0); resize(); }catch(e2){} }
  if(PF) pC=performance.now();
  drawPreview(rdt); drawGearPreview(rdt);   // prévia animada da Coleção (dentro da Loja); sai sozinha se o canvas não existir
  if(PF) pD=performance.now();
  hudT+=rdt; if(hudT>0.25){ hudT=0; hud(); }
  if(PF) pE=performance.now();
  saveT+=rdt; if(saveT>5){ saveT=0; save(); }
  if(PF) pfEnd(pfGap,w0,pA||w0,pB||pA||w0,pC||w0,pD||w0,pE||w0,performance.now());
  if(FPS_PESO){ const t=performance.now(); while(performance.now()-t<14){} }   /* só teste (?debug=1&peso=1): carga artificial */
  FP.work+=performance.now()-w0; fpsWindow(now);
  requestAnimationFrame(loop);
}


/* ================= HERÓI COMPLETO, UM CAMINHO SÓ (ordem do dono: pet, montaria, asa e aura nunca somem) =================
   drawHeroFull(ctx2, x, y, scale, state): desenha asa + Kael (montado se tiver montaria; na fase certa) + aura + pet com o MESMO código e as MESMAS tabelas da
   batalha, em qualquer canvas. (x, y) = ponto dos pés no canvas de destino; scale = 1 → tamanho da batalha (HS px lógicos de quadro).
   state (tudo opcional): { t, walking, act, deadP, pet (false esconde), mount (false esconde / {id, stars}), wing (false / 'angel' | 'demon'), weapon (skin), armor (skin),
   skin (id de skin fixa ou 'default': desenha essa skin em vez da equipada; vitrine da Aparência),
   hero ('kael' | 'kaia': desenha esse corpo em vez do do save; só durante este desenho) · pet ({base, stage 1-3, fly}: desenha esse pet em vez do equipado; formato do heroSnapshot),
   layers (lista do Sys.appearance.layers: tinta de colete/botas, chapéu, óculos, máscara e aura da roupa-skin; sem o campo valem as do save; [] = nenhuma) }.
   drawHeroLayers(canvas, layers, dt): vitrine da Aparência (pedido Q-15): encaixa o herói completo no canvas; 'layers' (Sys.appearance.layers) define asa e arma visíveis. */
const HFULL={x:0,gy:0,t:0,sk:null,ws:null,walking:false,hurt:0,deadP:-1,act:null,main:false};
function drawHeroFull(c2,x,y,scale,state){ const st=state||{}; const hv=(st.hero==='kaia'||st.hero==='kael')&&typeof S!=='undefined'&&S&&(S.hero==='kaia'?'kaia':'kael')!==st.hero;
  if(!hv) return drawHeroFull0(c2,x,y,scale,st);
  /* state.hero: o corpo é lido do save em vários pontos (forma, montaria, folhas); troca S.hero só durante este desenho e solta o cache da forma (200 ms) na ida e na volta */
  const h0=S.hero; S.hero=st.hero; if(typeof FORM!=='undefined') FORM.t=-1e9;
  try{ return drawHeroFull0(c2,x,y,scale,st); } finally{ S.hero=h0; if(typeof FORM!=='undefined') FORM.t=-1e9; } }
function drawHeroFull0(c2,x,y,scale,state){ const st=state||{}, k=scale>0?scale:1, lk=heroLook(), old=ctx;
  HFULL.x=HX; HFULL.gy=GY; HFULL.t=st.t!=null?st.t:B.at; HFULL.sk=st.armor||SKIN(S.skinEq.armor); HFULL.ws=st.weapon||wFamLook(lk.weapon)||wSkin(); HFULL.walking=!!st.walking; HFULL.deadP=st.deadP!=null?st.deadP:-1; HFULL.act=st.act||null;
  HFULL.wing=st.wing===false?null:(st.wing||wingNow(lk)); HFULL.mount=st.mount===false?null:(st.mount||lk.mount);
  HFULL.lay=(st.layers!==undefined&&typeof layParse==='function')?layParse(st.layers):undefined;   /* camadas da roupa-skin: as passadas (Sys.appearance.layers) ou, sem elas, as do save */
  const ov0=(typeof FORM!=='undefined')?FORM.ov:null; if(typeof FORM!=='undefined') FORM.ov=(st.skin!=null&&st.skin!=='')?st.skin:null;   /* state.skin (opcional): desenha essa skin fixa ('default' = corpo padrão) em vez da equipada */
  /* Engenheiro 5: folha pedida ainda carregando (1ª vez da Kaia, skin, montaria, asa) → NÃO desenha pela metade: dispara a carga e devolve false; a tela chama de novo
     no quadro seguinte (devolve true quando desenhou). Arquivo que não vem em 12 s: desenha com a reserva. */
  { let rdy=false; try{ rdy=fullReady(HFULL); }catch(e){ rdy=true; } if(!rdy&&!lookWait('full',(st.skin||'')+'|'+(HFULL.mount&&HFULL.mount.id||'')+'|'+(HFULL.wing||'')+'|'+(S.hero||''))){ if(typeof FORM!=='undefined') FORM.ov=ov0; return false; } }
  c2.save(); c2.translate(x-HX*k,y-GY*k); c2.scale(k,k); ctx=c2;
  try{ drawHero(HFULL); if(st.pet!==false&&typeof drawPet==='function'){ const r0=B.res, d0=B.deadT, run0=B.running, m0=HM.mount; B.res=null; B.deadT=0; B.running=!!st.walking; HM.mount=HFULL.mount;   /* Engenheiro 14 (dono: pet SEMPRE NA FRENTE): o pet é o ÚLTIMO desenho (depois da asa, da montaria, do herói e da arma) e a posição dele segue a montaria DESTE desenho (antes seguia a da batalha, HM.mount: herói a pé com pet longe, ou montado com o pet em cima da montaria) */
      const a0=PETK.act; PETK.act=null; const pov=(st.pet&&typeof st.pet==='object'&&typeof petOvSet==='function')?petOvSet(st.pet):null;   /* Engenheiro 17: o pet desta vitrine fica parado/andando (state.walking); antes mostrava o quadro do golpe que a batalha tinha em andamento (congelado com a Vitória aberta) */
      try{ drawPet(); }finally{ if(pov) pov(); B.res=r0; B.deadT=d0; B.running=run0; HM.mount=m0; PETK.act=a0; } } }
  catch(e){ if(!window.__hfErr){ window.__hfErr=1; console.error('drawHeroFull',e); } }
  finally{ ctx=old; c2.restore(); if(typeof FORM!=='undefined') FORM.ov=ov0; } return true; }
window.drawHeroFull=drawHeroFull;
let hlT=0;
function drawHeroLayers(c,layers,dt){ if(!c) return; const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||c.width, h=c.clientHeight||c.height; if(!w||!h) return;
  if(c.clientWidth&&(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr))){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  const x=c.getContext('2d'), st={t:(hlT+=dt||0)}; if(Array.isArray(layers)) st.layers=layers; x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height);
  if(Array.isArray(layers)){ const has=k=>layers.some(l=>l&&(l.layer===k||l.key===k)); if(!has('wing')) st.wing=false; const wl=layers.find(l=>l&&(l.layer==='weapon'||l.key==='weapon')); if(wl&&wl.id&&SKIN(wl.id)) st.weapon=SKIN(wl.id); }
  const mounted=!!heroLook().mount, hh=(mounted?heroBodyH()+(typeof heroRise==='function'?heroRise():0):heroBodyH())*1.25, ww=HS*(mounted?1.9:1.5), k=Math.min(c.width/ww,c.height/hh);
  drawHeroFull(x,c.width*(mounted?0.42:0.45),c.height*0.93,k,st); }
window.drawHeroLayers=drawHeroLayers;
