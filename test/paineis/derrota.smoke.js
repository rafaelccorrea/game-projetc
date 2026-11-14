'use strict';
/* DERROTA DO CHEFE + Sys.bossLoss (prêmio pelo dano e até 3 dicas com "Ir"), SEM NAVEGADOR. Uso: node test/paineis/derrota.smoke.js [-v]
   Sobe o jogo de verdade (test/e2e/sandbox.js) e passa pelo caminho real: herói cai no chefe (js/battle.js) → resBossLoss → resOpen('lose') (js/screens2.js).
   Chave do módulo desligada = Derrota de hoje e nenhum crédito. Ligada = onDefeat UMA vez por derrota, prêmio e dicas na tela, "Ir" pela rota do js/diff.js,
   nada de loja/VIP/oferta/gemas/invocação, sem emoji, textos escapados. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const boot = require('../e2e/sandbox'), errStr = boot.errStr;
const DT = 1 / 30;
let fails = 0, total = 0;
const check = (name, ok, err) => { total++; if (!ok) fails++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok || !err ? '' : ' → ' + err)); return !!ok; };
const EMOJI = /[←-⯿️]|[\uD800-\uDBFF][\uDC00-\uDFFF]/;
const tick = () => new Promise(r => setImmediate(r));
const text = h => String(h).replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, ' ');
const SHOP = /loja|vip|oferta|gema|invoca|pacote|sorteio|comprar|compra|pre[çc]o|R\$/i;

(async () => {
  /* SYS_LIVE (js/farm.js): o Sys.bossLoss agora NASCE LIGADO. Primeiro um jogo sem parâmetro só para provar isso; o jogo do teste sobe com &sem=bossLoss para a parte "desligada" */
  { const G0 = boot({ realFetch: true }); check('sem parâmetro de conferência o Sys.bossLoss nasce LIGADO (SYS_LIVE.bossLoss do js/farm.js)', G0.ev('!!(typeof SYS_LIVE==="object"&&SYS_LIVE.bossLoss===true&&Sys.bossLoss&&Sys.bossLoss.DATA.on===true)'), String(G0.ev('Sys.bossLoss&&Sys.bossLoss.DATA.on'))); }
  const loadErr = []; const G = boot({ realFetch: true, search: '?debug=1&fresh=1&skip=1&sem=bossLoss', add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } }); const { ev, inCtx } = G, X = G.sandbox;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  G.frameErr = []; G.n = 0; G.weak = false; G.bossAt = null;
  /* herói fraco (não tira vida do chefe sozinho) e o chefe posto na vida que o caso pede */
  G.hero = () => { const h = ev('B.hero'); if (!h) return; const b = ev('B.en').find(e => e.boss && !e.dead); if (G.weak) { if (b) { h.atk = 1e-6; h.critRate = 0; h.hp = Math.min(h.hp, 1); } else if (ev('B.deadT') <= 0) h.hp = h.maxhp; }   /* até o chefe entrar o herói aguenta as escoltas; com o chefe na tela ele cai */ if (G.bossAt != null && b) b.hp = b.maxhp * G.bossAt; };
  X.__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { G.hero(); ev('step')(dt); if (typeof X.petStep === 'function') ev('petStep')(dt); } if (typeof X.resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); };
  G.frame = async () => { try { inCtx(() => X.__e2eFrame(DT)); } catch (e) { const s = errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); } try { inCtx(() => G.advance(DT * 1000)); } catch (e) {} if (++G.n % 30 === 0) await tick(); };
  G.until = async (cond, secs) => { const n = Math.ceil(secs / DT); for (let i = 0; i < n; i++) { if (cond()) return true; await G.frame(); if (G.frameErr.length > 10) break; } return !!cond(); };
  const start = (stage, keep) => ev(`(function(){ ${keep ? '' : '__e2eReplace(JSON.parse(__e2eBase));'} S.tut=99; S.welcome=true; S.name='Kael'; S.hero=S.hero||'kael'; S.stage=${stage}; S.wave=5; S.best=Math.max(S.best||1,${stage}); S.eraMax=Math.max(S.eraMax||0,eraOf(${stage})); S.farm=false;
      B.paused=false; B.res=null; B.inst=null; B.deadT=0; B.deadBoss=false; view='battle'; try{ statsChanged(); }catch(e){} startBattle(); return 1; })()`);
  for (let i = 0; i < 20; i++) await tick();
  ev('SCREENS_ON.bossResult=true');
  const html = () => String(ev('RES.el?RES.el.innerHTML:""') || '');
  /* espiões: quantas vezes o módulo foi chamado e o que foi creditado em nome dele */
  ev(`(function(){ window.__bl={calls:0,res:[],gold:0,xp:0,stones:0,opts:[]}; const M=Sys.bossLoss, f=M.onDefeat; M.onDefeat=function(S2,h,o){ __bl.calls++; __bl.opts.push(JSON.parse(JSON.stringify(o||{}))); const g0=S.gold; const r=f.apply(M,arguments); __bl.res.push(JSON.parse(JSON.stringify(r))); __bl.gold+=S.gold-g0; return r; };
    const ax=Sys.level.addXp; Sys.level.addXp=function(a,n,h,src){ if(src==='bossLoss') __bl.xp+=n; return ax.apply(Sys.level,arguments); };
    const as=Sys.forge.addStones; Sys.forge.addStones=function(a,n){ __bl.stones+=n; return as.apply(Sys.forge,arguments); }; return 1; })()`);
  const bl = () => JSON.parse(ev('JSON.stringify(__bl)'));
  /* derrota de verdade: o herói fraco cai na onda do chefe com o chefe em `frac` da vida; espera a tela abrir */
  const lose = async (stage, frac, keep) => { start(stage, keep); G.weak = true; G.bossAt = frac; const ok = await G.until(() => !!ev('B.res') || (ev('S.farm') === true && ev('B.deadT') <= 0), 120); G.weak = false; G.bossAt = null; return ok && !!ev('B.res'); };

  /* ======================= 1. CHAVE DESLIGADA ======================= */
  console.log('1. chave do Sys.bossLoss desligada');
  check('módulo carregado e, com &sem=bossLoss, a chave fica desligada', ev('!!(Sys.bossLoss&&Sys.bossLoss.DATA.on===false)'), String(ev('Sys.bossLoss&&Sys.bossLoss.DATA.on')));
  let ok = await lose(3, 0.38);
  check('derrota real: tela abriu (modo lose)', ok && ev('RES.mode') === 'lose', JSON.stringify(ev('B.res')));
  const off = html(), b0 = bl();
  check('desligada: onDefeat nem é chamado e nada é creditado', b0.calls === 0 && b0.gold === 0 && b0.xp === 0 && b0.stones === 0 && ev('!(S.sys&&S.sys.bossLoss&&S.sys.bossLoss.total)'), JSON.stringify(b0));
  check('desligada: resBossLoss() devolve null', ev('resBossLoss()') === null);
  check('desligada: bloco de hoje ("Fique mais forte" + caminhos), sem o quadro novo', /Fique mais forte/.test(off) && ((/data-q="gear"/.test(off) && /height:150px/.test(off)) || /res_adv|data-q="adv:/.test(off)) && !/res_rw|res_tips|data-q="tip:|Prêmio/.test(off)   /* com a dificuldade nova ligada por padrão (1d7d977) o bloco de hoje são as linhas do js/diff.js (adv:N); com ela desligada, os caminhos fixos */, off.length + ' caracteres');
  check('desligada: botões de hoje (farm e retry)', /data-q="farm"/.test(off) && /data-q="retry"/.test(off));
  /* mesma tela aberta de três jeitos com o mesmo estado: como hoje, com o {on:false} do módulo e sem o módulo */
  ev("resClose('farm')"); start(3); ev("resOpen('lose',{stage:S.stage},true)"); const offA = html(); ev('B.res=null; RES.el=null; document.body.classList.remove("resui"); heroDown(false)');
  ev("resOpen('lose',{stage:S.stage,loss:Sys.bossLoss.onDefeat(S,Sys.host,{stage:S.stage,dmgDone:60,bossMaxHp:100})},true)"); const offB = html(); ev('B.res=null; RES.el=null; heroDown(false)');
  ev("window.__m=Sys.bossLoss; delete Sys.bossLoss; resOpen('lose',{stage:S.stage},true)"); const offC = html(); ev('Sys.bossLoss=window.__m; B.res=null; RES.el=null; heroDown(false)');
  check('desligada: HTML idêntico com o módulo desligado, com o {on:false} dele e sem o módulo', offA.length > 500 && offA === offB && offA === offC, offA.length + ' / ' + offB.length + ' / ' + offC.length);
  check('desligada: o {on:false} direto do módulo não creditou', bl().gold === 0 && bl().xp === 0 && bl().stones === 0, JSON.stringify(bl()));
  ev('__bl.calls=0; __bl.res=[]; __bl.opts=[]');

  /* ======================= 2. CHAVE LIGADA ======================= */
  console.log('2. chave ligada');
  ev('Sys.bossLoss.setOn(true)');
  /* dicas de mentira no Sys.advice.all: 4 proibidas (loja, VIP, gemas, invocação), 1 com HTML e símbolo no texto, e mais 3 boas (a 4ª boa não entra) */
  ev(`(function(){ window.__all=Sys.advice.all; Sys.advice.all=function(){ return {list:[
      {id:'shop_weapon',kind:'buyItem',tab:'shop',label:'Comprar arma na Loja',gain:9999,gainText:'+9,9 mil FC',ready:true},
      {id:'vip1',kind:'vip',tab:'vip',label:'Virar VIP',gain:9000,gainText:'+9 mil FC',ready:true},
      {id:'gem_pack',kind:'gear',tab:'gear',label:'Pacote de gemas',gain:8000,gainText:'+8 mil FC',ready:true},
      {id:'s10',kind:'summon10',tab:'summon',label:'Invocar 10 vezes',gain:7000,gainText:'+7 mil FC',ready:true},
      {id:'equip_best',kind:'equip',tab:'gear',label:'Use o melhor <img src=x onerror=1> & "Clava" 2★',gain:1200,gainText:'+1,2 mil FC <b>',ready:true},
      {id:'forge_weapon',kind:'forge',tab:'forge',label:'Clava +3 para +4',gain:900,gainText:'+900 FC',ready:true},
      {id:'pet_evo',kind:'pet',tab:'pet',label:'Evoluir o mamute',gain:700,gainText:'+700 FC',ready:true},
      {id:'mount_star',kind:'mount',tab:'mount',label:'Subir a estrela',gain:600,gainText:'+600 FC',ready:true}]}; }; return 1; })()`);
  const gold0 = ev('S.gold');
  ok = await lose(3, 0.38);
  check('ligada · derrota real: tela abriu', ok && ev('RES.mode') === 'lose');
  let b = bl(), r = b.res[0] || { reward: {}, tips: [] }, h = html();
  check('ligada: onDefeat chamado UMA vez nesta derrota', b.calls === 1, 'chamadas ' + b.calls);
  check('ligada: dano medido no chefe de verdade (62% da vida, fase 3, era 0)', b.opts[0] && b.opts[0].stage === 3 && b.opts[0].bossMaxHp > 0 && Math.abs(b.opts[0].dmgDone / b.opts[0].bossMaxHp - 0.62) < 0.011 && b.opts[0].era === 0 && b.opts[0].eraBoss === false && r.pct >= 61 && r.pct <= 62, JSON.stringify(b.opts[0]) + ' pct ' + r.pct);
  check('ligada: prêmio creditado uma vez (ouro do save = prêmio do módulo; XP e pedra pelo módulo)', r.reward.gold > 0 && b.gold === r.reward.gold && b.xp === r.reward.xp && b.stones === r.reward.stones && r.reward.gems === 0, JSON.stringify(r.reward) + ' x ' + JSON.stringify({ gold: b.gold, xp: b.xp, stones: b.stones }));
  check('ligada: quadro do prêmio na tela (título, % da vida, ouro, XP, pedra, regra do dia)', /id="res_rw"/.test(h) && /Prêmio pelo dano/.test(h) && h.includes(r.pct + '%</span> da vida do chefe') && h.includes('+' + ev(`gNum(${r.reward.gold})`) + '<') && h.includes('+' + ev(`gNum(${r.reward.xp})`) + ' XP') && (r.reward.stones ? /\+1 Pedra</.test(h) : true) && /1ª derrota hoje nesta fase/.test(h) && /1ª: 100%/.test(h) && /4ª: nada/.test(h), text(h).replace(/\s+/g, ' ').slice(0, 400));
  check('ligada: o quadro SUBSTITUI o bloco de hoje (sem os caminhos fixos e sem as linhas do js/diff.js)', !/height:150px/.test(h) && !/data-q="(gear|forge|summon)"/.test(h) && !/res_adv|data-q="adv:/.test(h) && (h.match(/>Fique mais forte</g) || []).length === 1, 'títulos: ' + (h.match(/>Fique mais forte</g) || []).length);
  check('ligada: botões de hoje continuam (farm e retry) e o título da Derrota', /data-q="farm"/.test(h) && /data-q="retry"/.test(h) && /O chefe foi mais forte/.test(h) && /id="res_fc"/.test(h));
  const tips = JSON.parse(ev('JSON.stringify(RES.tips.map(t=>({id:t.id,tab:t.tab,label:t.label,gain:t.gainText,lock:t.route.lock||0,farm:!!t.route.farm,scr:t.route.scr||""})))'));
  check('ligada: até 3 dicas, só as de evolução, na ordem do módulo', tips.length === 3 && tips.map(t => t.id).join() === 'equip_best,forge_weapon,pet_evo' && [0, 1, 2].every(i => h.includes('data-q="tip:' + i + '"')) && !h.includes('data-q="tip:3"'), JSON.stringify(tips.map(t => t.id)));
  check('ligada: cada dica com o ganho (gainText) e o "Ir"', tips.every(t => h.includes(ev(`esc2(${JSON.stringify(t.gain)})`))) && (h.match(/>Ir<\/span>/g) || []).length + (h.match(/>Nv \d+<\/span>/g) || []).length === 3, tips.map(t => t.gain).join(' | '));
  const tx = text(h);
  check('ligada: nenhuma dica de loja, VIP, oferta, gemas ou invocação; nenhum preço', !SHOP.test(tx) && !/shop_weapon|vip1|gem_pack|s10/.test(h) && !/gem\.png|summon\.png|shop\.png|vip\.png|offer\.png/.test(h), (tx.match(SHOP) || [''])[0]);
  check('ligada: sem emoji nem símbolo (seta, estrela)', !EMOJI.test(tx), (tx.match(EMOJI) || [''])[0]);
  check('ligada: textos do módulo escapados (nenhuma tag injetada)', !/<img src=x/.test(h) && !/onerror=1>/.test(h) && h.includes('&lt;img src=x onerror=1&gt;') && h.includes('&amp;') && !/FC <b>/.test(h), '');
  check('ligada: sem undefined/NaN/[object', !/undefined|NaN|\[object/.test(h));
  { const box = h.slice(h.indexOf('id="res_rw"') - 40, h.indexOf('id="res_a"'));
    check('ligada: quadro sem reticências e sem rolagem', !/text-overflow:\s*ellipsis/.test(box) && !/overflow(-x|-y)?:\s*(auto|scroll)/.test(box) && !/…|\.\.\./.test(text(box)));
    check('ligada: toque das dicas com 68 px ou mais; "Ir" dourado com texto escuro', (box.match(/data-q="tip:\d"[^>]*min-height:68px/g) || []).length === 3 && /background:linear-gradient\(180deg,#ffe07a,#f2a826\);color:#2a1403[^>]*>Ir</.test(box));
    const fixed = []; box.replace(/(?:^|[;"])(?:min-)?width:(\d+(?:\.\d+)?)px/g, (x, n) => { fixed.push(+n); return x; });
    check('ligada: nenhuma largura fixa passa da área útil (358 px da base de 390, que escala para 320)', fixed.every(n => n <= 358), fixed.join(',')); }
  check('ligada: a altura do bloco entra na conta que protege o Kael caído (RES.loseX e resLay)', ev('typeof RES.loseX==="number"&&RES.lay.f>=0.7&&RES.lay.f<=1') && ev("resLay('lose',RES.geo,RES.loseX).f<=resLay('lose',RES.geo,0).f"), 'loseX ' + ev('RES.loseX') + ' f ' + ev('RES.lay.f'));
  check('ligada: sem alert/confirm/prompt no código novo', !/\b(alert|confirm|prompt)\(/.test(G.rd('js/screens2.js').split('DERROTA QUE RENDE')[1].split('function resLoseHtml')[0]));

  /* QA B1: rótulo da dica em até 2 linhas, fonte de 10 px ou mais, sem reticências; 3 linhas só quando o texto do módulo não cabe em 2 */
  { const lab = (h.match(/<span class="res-tipl" style="[^"]*"/g) || []);
    check('B1: rótulo de cada dica com 10 px ou mais, sem reticências, sem linha presa e sem corte', lab.length === 3 && lab.every(s => { const m = /font-size:([\d.]+)px/.exec(s); return m && +m[1] >= 10 && +m[1] <= 11 && !/ellipsis|nowrap|line-clamp|overflow:\s*hidden/.test(s) && /overflow-wrap:anywhere/.test(s) && /text-wrap:balance/.test(s); }), lab[0]);
    const mh = (n, len) => +ev(`(function(){ const t=RES.tips.slice(0,${n}).map(x=>Object.assign({},x,{label:'Subir para o nivel '.repeat(9).slice(0,${len})})); const m=/id="res_tips" style="flex:none;min-height:(\\d+)px/.exec(resLossBox(RES.o.loss,t,3).html); return m?+m[1]:-1; })()`);
    const H2 = Math.ceil(62 + 11.5 * 2), H3 = Math.ceil(62 + 11.5 * 3);
    check('B1: 3 dicas, rótulo de até 38 letras = caixa de 2 linhas; 39 em diante = 3 linhas (só nesse caso)', mh(3, 20) <= H2 && mh(3, 38) === H2 && mh(3, 39) === H3 && mh(3, 57) === H3, [mh(3, 20), mh(3, 38), mh(3, 39), mh(3, 57)].join(','));
    check('B1: 2 dicas (cartão mais largo), o rótulo do print do QA (39 letras) cabe em 2 linhas; 1 dica, em 1', mh(2, 39) === H2 && mh(2, 60) === H2 && mh(1, 39) === Math.ceil(62 + 11.5), [mh(2, 39), mh(2, 60), mh(1, 39)].join(','));
    check('B1: a caixa do rótulo longo de mentira (47 letras, 3 dicas) reserva as 3 linhas', new RegExp('id="res_tips" style="flex:none;min-height:' + H3 + 'px').test(h), (h.match(/id="res_tips" style="[^"]*"/) || [''])[0]); }

  /* QA B2: aviso de liberação ("Invocar: 1 item grátis por dia") NÃO sai por cima do resultado: espera a tela fechar (ponto único: fbNovoTick do js/fullbattle.js) */
  if (check('B2: o ponto único dos avisos de liberação existe (fbNovoTick, FBN, fbResUp)', ev('typeof fbNovoTick==="function"&&typeof FBN==="object"&&typeof fbResUp==="function"'))) {
    const toasts = []; const t0 = X.toast; X.toast = m => { toasts.push(String(m)); return t0(m); };
    try {
      const id = ev(`(function(){ window.__unl=JSON.stringify(S.unl||{}); window.__keep=JSON.stringify(S.unlKeep||null); window.__tut=S.tut; S.tut=99; S.unlKeep=Object.assign({},S.unlKeep||{},{summon:1,missions:1});
        if(!S.unl||typeof S.unl!=='object') S.unl={}; const all=FB_MENU.concat(FB_DROP).filter(m=>FB_UNLOCK[m.id]); for(const m of all) S.unl[m.id]=1; const m=all.find(m=>fbShown(m)); if(!m) return ''; delete S.unl[m.id]; FBN.until=0; FBN.redo=''; FBN.txt=''; FBN.at=0; return m.id; })()`);
      const txt = id ? ev(`FB_UNLOCK_TXT[${JSON.stringify(id)}]||''`) : '';
      check('B2: há um aviso de liberação pendente para o teste', !!id && !!txt, 'id ' + id);
      check('B2: a Derrota está aberta neste ponto', !!ev('B.res') && ev('fbResUp()') === true);
      toasts.length = 0; for (let i = 0; i < 5; i++) ev('fbNovoTick()');
      check('B2: com o resultado aberto o aviso não sai e a liberação continua pendente', !toasts.includes(txt) && !ev(`S.unl[${JSON.stringify(id)}]`), JSON.stringify(toasts));
      ev('window.__res=B.res; window.__dt=B.deadT; window.__db=B.deadBoss; B.res=null; B.deadBoss=true; B.deadT=0.8'); ev('fbNovoTick()');
      check('B2: herói caindo diante do chefe (a tela abre em seguida): o aviso também espera', !toasts.includes(txt));
      ev('B.deadT=0; B.deadBoss=false; window.__v=view; window.__p=B.paused; view="battle"; B.paused=false; fbNovoTick()');
      check('B2: tela fechada: o aviso que esperou sai, uma vez, e a liberação é marcada', toasts.filter(m => m === txt).length === 1 && ev(`S.unl[${JSON.stringify(id)}]`) === 1, JSON.stringify(toasts));
      /* aviso já na tela quando o resultado abre: sai da frente e é repetido depois */
      ev('B.res=window.__res; fbNovoTick()');
      check('B2: aviso que estava na tela quando o resultado abriu sai da frente e fica na fila', ev('FBN.redo') === txt && ev('(function(){ const t=document.getElementById("toast"); return !t||!t.classList||typeof t.classList.contains!=="function"||!t.classList.contains("on"); })()') === true, String(ev('FBN.redo')));
      ev('fbNovoTick(); fbNovoTick()'); check('B2: enquanto o resultado está aberto ele não volta', toasts.filter(m => m === txt).length === 1);
      ev('B.res=null; fbNovoTick()'); check('B2: fechou: o aviso volta uma vez', toasts.filter(m => m === txt).length === 2 && ev('FBN.redo') === '', JSON.stringify(toasts));
      ev('FBN.until=0; fbNovoTick()'); check('B2: e não repete de novo', toasts.filter(m => m === txt).length === 2);
      check('B2: o balão do tutorial espera pelo mesmo sinal (tutLayout do js/meta.js lê B.res)', /B\.res/.test((G.rd('js/meta.js').split('function tutLayout')[1] || '').split('function tutEvent')[0]));
    } finally { X.toast = t0; ev('B.res=window.__res||B.res; B.deadT=window.__dt||0; B.deadBoss=!!window.__db; if(window.__v) view=window.__v; if(window.__p!==undefined) B.paused=window.__p; S.unl=JSON.parse(window.__unl||"{}"); S.unlKeep=JSON.parse(window.__keep||"null")||undefined; S.tut=window.__tut; FBN.until=0; FBN.redo=""; FBN.txt=""; FBN.at=0'); } }

  /* reabrir e redesenhar: nada de crédito novo */
  const g1 = ev('S.gold'), sv1 = ev('JSON.stringify(S.sys.bossLoss)');
  ev('window.__loss=RES.o.loss; B.res=null; RES.el=null; heroDown(false); resOpen("lose",{stage:S.stage,loss:__loss},true)'); const h2 = html();
  try { inCtx(() => { const L = X.__e2eResize; if (typeof L === 'function') L(); }); } catch (e) {}
  check('reabrir a Derrota com o mesmo resultado: mesma tela, onDefeat continua em 1 e o save não muda', bl().calls === 1 && ev('S.gold') === g1 && ev('JSON.stringify(S.sys.bossLoss)') === sv1 && /id="res_rw"/.test(h2) && h2.includes('+' + ev(`gNum(${r.reward.gold})`) + '<'), 'chamadas ' + bl().calls);
  ev('B.res=null; RES.el=null; heroDown(false); dbgResult("lose")'); check('abrir pela depuração (sem resultado): tela de hoje, nenhum crédito', bl().calls === 1 && ev('S.gold') === g1 && !/res_rw/.test(html()) && /height:150px/.test(html()));
  ev('B.res=null; RES.el=null; heroDown(false)');

  /* "Ir": cada dica abre o destino da rota do js/diff.js */
  /* com a tela nova ligada (PANEL_ON.<nome>2), quem abre a antiga cai na nova: o destino esperado é lido do jogo carregado (Panels.v2 e VIEW_V2 do index.html) */
  const dest = n => ev(`(function(n){ const a=Panels.v2[n]; if(a&&PANEL_ON[a]&&Panels.defs[a]) return a; const b=(typeof VIEW_V2!=='undefined')?VIEW_V2[n]:null; if(b&&PANEL_ON[b]===true&&Panels.defs[b]) return b; return n; })(${JSON.stringify(n)})`);
  const VIEW = { gear: dest('gear'), forge: dest('forge'), pet: dest('pets'), mount: dest('mounts'), titles: dest('profile') };
  for (let i = 0; i < tips.length; i++) { const t = tips[i]; ev('resOpen("lose",{stage:S.stage,loss:__loss},true); RES.t=0'); ev(`resAct('tip:${i}')`);
    check('Ir · ' + t.id + ': antes de os cartões aparecerem o toque não vale', !!ev('B.res'));
    ev('RES.t=RES_LOSE_BTN+1'); ev(`resAct('tip:${i}')`); const v = ev('view'), open = !!ev('B.res');
    check('Ir · ' + t.id + ' → ' + (t.lock ? 'aviso do nível, a tela fica' : t.farm ? 'modo farm' : 'tela ' + VIEW[t.tab] + ', Derrota fechada, farm atrás'), t.lock ? open && v === 'battle' : t.farm ? !open && v === 'battle' && ev('S.farm') === true : !open && v === VIEW[t.tab] && ev('S.farm') === true, 'view=' + v + ' aberta=' + open + ' rota=' + JSON.stringify(t));
    check('Ir · ' + t.id + ': não creditou de novo', bl().calls === 1 && ev('S.gold') === g1);
    ev("if(B.res){ B.res=null; RES.el=null; heroDown(false); } if(view!=='battle'){ try{ Screens.close(); }catch(e){} } view='battle'"); }
  check('Ir com destino trancado ou sem tela não some com a rota (toda dica na tela tem rota do DIFF_ROUTE)', tips.every(t => ev(`!!DIFF_ROUTE[${JSON.stringify(t.tab)}]`)));

  /* 2ª, 3ª e 4ª derrota na mesma fase no mesmo dia; abaixo de 10% */
  const again = async (frac, label) => { ev('__bl.calls=0; __bl.res=[]; __bl.opts=[]; __bl.gold=0; __bl.xp=0; __bl.stones=0'); const okk = await lose(3, frac, true); const bb = bl(); return { ok: okk, b: bb, r: bb.res[0] || { reward: {} }, h: html(), label }; };
  let a = await again(0.38);
  check('2ª derrota: metade do prêmio, texto "(×0,5 por ser a 2ª)", regra marcando a 2ª', a.ok && a.b.calls === 1 && a.r.reward.gold > 0 && a.r.reward.gold <= r.reward.gold / 2 + 1 && a.b.gold === a.r.reward.gold && /\(×0,5 por ser a 2ª\)/.test(a.h) && /2ª derrota hoje nesta fase/.test(a.h) && a.r.reward.stones === 0 && !/Pedra</.test(a.h), JSON.stringify(a.r.reward));
  a = await again(0.95);
  check('abaixo de 10%: sem números, o texto honesto do módulo, e não gasta a vez', a.ok && a.b.calls === 1 && a.b.gold === 0 && /Sem prêmio desta vez/.test(a.h) && a.h.includes(ev(`esc2(${JSON.stringify(a.r.text || 'x')})`)) && /não gasta a sua vez do dia/.test(a.h) && !/assets\/ui\/coin\.png/.test(a.h.slice(a.h.indexOf('id="res_rw"'))) && ev('S.sys.bossLoss.n["3"]') === 2, text(a.h.slice(a.h.indexOf('id="res_rw"'))).replace(/\s+/g, ' ').slice(0, 200));
  check('abaixo de 10%: as dicas continuam', /data-q="tip:0"/.test(a.h));
  a = await again(0.38);
  check('3ª derrota: um quarto do prêmio', a.ok && a.r.reward.gold >= 0 && /3ª derrota hoje nesta fase|Sem prêmio desta vez/.test(a.h) && ev('S.sys.bossLoss.n["3"]') >= 2, JSON.stringify(a.r.reward));
  ev('S.sys.bossLoss.n["3"]=3');
  a = await again(0.38);
  check('4ª derrota: sem números, "Prêmio do dia já recebido" e o texto do módulo', a.ok && a.b.calls === 1 && a.b.gold === 0 && a.b.xp === 0 && a.r.capped === true && /Prêmio do dia já recebido/.test(a.h) && a.h.includes(ev(`esc2(${JSON.stringify(a.r.text || 'x')})`)) && !/assets\/ui\/coin\.png/.test(a.h.slice(a.h.indexOf('id="res_rw"'), a.h.indexOf('id="res_a"'))) && /4ª: nada/.test(a.h), text(a.h.slice(a.h.indexOf('id="res_rw"'))).replace(/\s+/g, ' ').slice(0, 200));
  check('4ª derrota: sem emoji, sem loja, sem undefined', !EMOJI.test(text(a.h)) && !SHOP.test(text(a.h)) && !/undefined|NaN|\[object/.test(a.h));

  /* tela que não pode abrir (jogador em outra tela): credita uma vez e o aviso diz o que entrou */
  { const toasts = []; const t0 = X.toast; X.toast = m => { toasts.push(String(m)); return t0(m); };
    ev('__bl.calls=0; __bl.res=[]; __bl.gold=0'); start(4); ev('window.__noRes=true'); G.weak = true; G.bossAt = 0.5; await G.until(() => ev('S.farm') === true && ev('B.deadT') <= 0, 120); G.weak = false; G.bossAt = null; ev('window.__noRes=false'); X.toast = t0;
    const bb = bl(), rr = bb.res[0] || { reward: {} };
    check('sem a tela: onDefeat uma vez, crédito feito e aviso com o prêmio (sem emoji, sem loja)', bb.calls === 1 && rr.reward.gold > 0 && bb.gold === rr.reward.gold && toasts.some(m => /Prêmio pelo dano: \+/.test(m) && !EMOJI.test(m) && !SHOP.test(m)), 'chamadas ' + bb.calls + ' avisos ' + JSON.stringify(toasts.slice(-3))); }

  /* ======================= 3. DESLIGA DE NOVO ======================= */
  console.log('3. chave desligada de novo');
  ev('Sys.bossLoss.setOn(false); Sys.advice.all=window.__all; __bl.calls=0; __bl.gold=0; __bl.xp=0; __bl.stones=0');
  start(3); ev("resOpen('lose',{stage:S.stage},true)"); const offZ = html(); ev('B.res=null; RES.el=null; heroDown(false)');
  ev("window.__m=Sys.bossLoss; delete Sys.bossLoss; resOpen('lose',{stage:S.stage},true)"); const offY = html(); ev('Sys.bossLoss=window.__m');
  const geo = x => x.replace(/ellipse at \d+% \d+%/, 'ellipse').replace(/class="q-orbs"[^>]*>/, '').replace(/id="res_w"[^>]*>/, '').replace(/id="res_p"[^>]*>/, '');   /* as telas abertas no meio do teste mexem na medida do palco: sai só a geometria */
  { const A = geo(offA), Z = geo(offZ); let i = 0; while (i < Z.length && Z[i] === A[i]) i++; check('Derrota idêntica à do começo (e à do jogo sem o módulo)', offZ === offY && Z === A, 'difere em ' + i + ': ' + A.slice(i - 60, i + 60) + ' ||| ' + Z.slice(i - 60, i + 60)); }
  /* ======================= 4. PRÁTICA (mesmo arquivo, js/screens2.js): ouro APLICADO no resumo e teto da trilha pelo módulo ======================= */
  console.log('4. Prática: resumo com o ouro aplicado (Sys.loot.goldBreakdown) e a Coleta parando no teto do módulo');
  { const prog = () => String(ev('(function(){ B.res=null; RES.el=null; try{ heroDown(false); }catch(e){} view="prog"; XR.tab="prac"; XR.rowFx=null; scrProg(); return V.innerHTML; })()') || '');
    const row = (hh, id) => { const i = hh.indexOf('data-id="' + id + '"'); if (i < 0) return ''; const a = hh.lastIndexOf('class="r-row', i), z = hh.indexOf('class="r-row', i); return hh.slice(a, z < 0 ? hh.indexOf('Total das práticas', i) : z); };
    const sum = hh => text((hh.match(/Total das práticas[\s\S]{0,400}?<\/div>/) || [''])[0]).replace(/\s+/g, ' ');
    const gid = ev('(Sys.practice.DATA.tracks.find(t=>t.stat==="goldPct")||{}).id') || '', J = JSON.stringify(gid);
    check('Prática: o Sys.loot tem a conta do ouro (goldBreakdown com applied.practice, raw, pct, overXp) e o Sys.practice o teto da trilha (capT)', !!gid && ev('(function(){ const g=Sys.loot.goldBreakdown(S); return !!(g&&g.applied&&typeof g.applied.practice==="number"&&typeof g.raw==="number"&&typeof g.pct==="number"&&typeof g.overXp==="number"&&typeof Sys.practice.capT==="function"); })()'), gid);
    /* ouro da Prática ligado no Sys.loot (é o valor de fábrica; o teste força para não depender dele) e nível alto para a Prática estar liberada */
    ev(`(function(){ window.__gl=Sys.loot.goldLive; Sys.loot.goldLive=function(s){ return s==='practice'?true:window.__gl.apply(this,arguments); }; window.__pr=JSON.stringify(S.sys.practice||null); window.__lv=JSON.stringify(S.sys.level||null); window.__em=S.eraMax;
      try{ S.sys.level.lvl=60; }catch(e){} S.eraMax=8; const o=Sys.practice.ensure(S); o.stones=1e9; return 1; })()`);
    try {
      const capEra = ev('Sys.practice.capOf(Sys.host)'), capG = ev(`Sys.practice.capT(Sys.practice.DATA.tracks.find(t=>t.id===${J}),Sys.host)`), per = ev(`Sys.practice.DATA.tracks.find(t=>t.id===${J}).per`);
      check('Prática: a Coleta tem teto próprio, abaixo do teto da era (o módulo decide)', capG > 0 && capG < capEra, capG + ' x ' + capEra);
      ev(`Sys.practice.ensure(S).lv[${J}]=3`); let p = prog(), gr = row(p, gid), ap = ev('Sys.loot.goldBreakdown(S).applied.practice');
      check('Prática: linha da Coleta mostra o nível sobre o teto DELA e segue treinando', gr.includes('Nv 3/' + capG + '<') && new RegExp('data-x="train" data-id="' + gid + '"').test(gr) && />Treinar</.test(gr) && /% ouro/.test(gr) && !/Em breve/.test(gr), text(gr).replace(/\s+/g, ' ').slice(0, 160));
      check('Prática: o resumo mostra o ouro APLICADO pela conta do Sys.loot', ap > 0 && sum(p).includes('+' + ev(`f1c(${ap})`) + '% ouro'), sum(p) + ' / aplicado ' + ap);
      /* a conta do Sys.loot corta a fonte: o resumo segue a conta, não o valor cru do Sys.practice */
      ev('window.__gb=Sys.loot.goldBreakdown; Sys.loot.goldBreakdown=function(){ const g=window.__gb.apply(this,arguments); g.applied=Object.assign({},g.applied,{practice:0.7}); return g; }');
      try { p = prog(); check('Prática: se a conta aplica menos que o cru, a tela mostra o aplicado', sum(p).includes('+' + ev('f1c(0.7)') + '% ouro') && !sum(p).includes('+' + ev(`f1c(${ap})`) + '% ouro') && ev('Sys.practice.bonus(S).goldPct') !== 0.7, sum(p)); } finally { ev('Sys.loot.goldBreakdown=window.__gb'); }
      ev('window.__gb=Sys.loot.goldBreakdown; delete Sys.loot.goldBreakdown'); try { p = prog(); check('Prática: sem a conta (módulo antigo) vale o valor do Sys.practice, sem quebrar', sum(p).includes('+' + ev('f1c(Sys.practice.bonus(S).goldPct)') + '% ouro')); } finally { ev('Sys.loot.goldBreakdown=window.__gb'); }
      /* Coleta no teto dela: "Máx.", texto próprio (não é o teto da era) e o toque diz o motivo sem gastar pedra */
      ev(`Sys.practice.ensure(S).lv[${J}]=${capG}`); p = prog(); gr = row(p, gid); const st0 = ev('Sys.practice.ensure(S).stones');
      check('Prática: Coleta no teto dela mostra "Máx." e "no máximo" (não "teto da era") e o valor aplicado', gr.includes('Nv ' + capG + '/' + capG + '<') && />Máx\.</.test(gr) && />no máximo</.test(gr) && /· máximo</.test(gr) && !/teto da era/.test(gr) && !/y-gold/.test(gr) && sum(p).includes('+' + ev('f1c(Sys.loot.goldBreakdown(S).applied.practice)') + '% ouro') && ev('Sys.loot.goldBreakdown(S).applied.practice') === capG * per, text(gr).replace(/\s+/g, ' ').slice(0, 160) + ' | ' + sum(p));
      check('Prática: o módulo recusa treinar a Coleta no teto (reason cap)', ev(`Sys.practice.canTrain(S,Sys.host,${J}).reason`) === 'cap');
      ev(`rClick({dataset:{x:'train',id:${J}}})`);
      check('Prática: tocar na Coleta no teto não treina nem gasta pedra, e a tela diz o motivo', ev(`Sys.practice.ensure(S).lv[${J}]`) === capG && ev('Sys.practice.ensure(S).stones') === st0 && / já está no máximo$/.test(String(ev('XR.banner'))), String(ev('XR.banner')));
      check('Prática: os outros motivos têm texto (nível, pedras, teto da era, em breve)', ev('pracWhy(null,"locked")').indexOf('Libera no nível') === 0 && /Faltam pedras de prática/.test(ev(`pracWhy(Sys.practice.DATA.tracks[0],"stones")`)) && /teto da era/.test(ev('pracWhy(Sys.practice.DATA.tracks[0],"cap")')) && /: em breve$/.test(ev(`pracWhy(Sys.practice.DATA.tracks.find(t=>t.id===${J}),"soon")`)) && ev('pracWhy(null,"x")') === 'Não foi possível treinar agora');
      { const o1 = ev('Sys.practice.DATA.tracks[0].id'); ev(`Sys.practice.ensure(S).lv[${JSON.stringify(o1)}]=${capEra}`); p = prog(); const r1 = row(p, o1); check('Prática: trilha comum no teto da era continua dizendo "teto da era"', />teto da era</.test(r1) && /· máximo da era</.test(r1) && r1.includes('Nv ' + capEra + '/' + capEra + '<'), text(r1).replace(/\s+/g, ' ').slice(0, 140)); }
      check('Prática: sem reticências, sem emoji, sem undefined', !/…|\.\.\./.test(text(p)) && !EMOJI.test(text(p).replace(/→/g, '')) && !/undefined|NaN|\[object/.test(p));
    } finally { ev('Sys.loot.goldLive=window.__gl; S.sys.practice=JSON.parse(window.__pr)||undefined; if(window.__lv!=="null") S.sys.level=JSON.parse(window.__lv); S.eraMax=window.__em'); }
    ev("try{ Screens.close(); }catch(e){} view='battle'"); }

  check('nenhuma exceção no laço da batalha', !G.frameErr.length, G.frameErr.slice(0, 4).join(' | '));
  console.log((fails ? 'FALHOU ' : 'OK ') + (total - fails) + '/' + total + ' · derrota.smoke');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERRO', e && e.stack || e); process.exit(1); });
