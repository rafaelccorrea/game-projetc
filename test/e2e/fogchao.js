'use strict';
/* FOGUEIRA, parte 4: ITEM NO CHÃO ESPERANDO O TOQUE (js/farm.js). Sem navegador: node test/e2e/fogchao.js
   Chave desligada (padrão): todo item voa sozinho, como hoje. Chave ligada (?debug=1&fogueira=1): Épico ou melhor espera o toque parado na tela;
   Básico e Raro voam sozinhos; o toque perto do item o manda para a mochila; longe não faz nada; sem toque ele vai sozinho depois do prazo;
   nunca mais que PK_HOLD_MAX esperando; "+FC" só quando a peça é melhor que a equipada. Sai com código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
async function game(search) { const G = boot({ realFetch: true, runBoot: true, search }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  ev("(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; PK.list.length=0; return 1; })()"); return G; }
const step = (G, secs) => G.ev(`(function(){ for(let i=0;i<${Math.round(secs * 30)};i++) tickPicks(1/30); return 1; })()`);
(async () => {
  /* 1) chave desligada: nada espera */
  let G = await game('?debug=1&fresh=1&skip=1&fogueira=0&sem=bonfire'), ev = G.ev;
  check('chave desligada pelos parâmetros de conferência (?debug=1&fogueira=0&sem=bonfire)', ev('fogOn()===false'));
  ev("spawnPicks([{type:'item',value:1,r:3,slot:'weapon',e:0,to:'bag'},{type:'item',value:1,r:0,slot:'armor',e:0,to:'bag'}],200)"); step(G, 0.2);
  check('chave desligada: nenhum item marcado para esperar', ev('PK.list.length===2&&PK.list.every(q=>!q.hold)'), ev('JSON.stringify(PK.list.map(q=>q.hold))'));
  step(G, 3); check('chave desligada: tudo voou sozinho em 3 s', ev('PK.list.length') === 0, 'sobraram ' + ev('PK.list.length'));
  check('sem o modo de conferência: Sys.bonfire carregado e DESLIGADO; fogBrasa não credita, não liga e não desenha', ev('!!(Sys.bonfire&&Sys.bonfire.DATA)&&Sys.bonfire.DATA.on===false') && ev("fogBrasa('boss',1,200)") === 0 && ev('Sys.bonfire.DATA.on===false') && ev('PK.list.length') === 0);
  /* 2) chave ligada */
  G = await game('?debug=1&fresh=1&skip=1'); ev = G.ev;
  check('LIGADA por padrão (ordem do dono): FOGUEIRA_ON e o módulo Sys.bonfire ligado no arranque (sysLive)', ev('fogOn()===true&&FOGUEIRA_ON===true&&Sys.bonfire.DATA.on===true'));
  ev("spawnPicks([{type:'item',value:1,r:2,slot:'weapon',e:0,to:'bag'},{type:'item',value:1,r:1,slot:'armor',e:0,to:'bag'},{type:'item',value:1,r:0,slot:'boots',e:0,to:'bag'},{type:'gold',value:5,to:'gold'}],200)");
  step(G, 3);
  const h1 = JSON.parse(ev('JSON.stringify(pkHeld().map(q=>({r:q.p.r,x:q.x,y:q.y,st:q.st})))'));
  check('Épico espera no chão; Raro, Básico e ouro voaram sozinhos', h1.length === 1 && h1[0].r === 2 && ev('PK.list.length') === 1, JSON.stringify(h1) + ' lista ' + ev('PK.list.length'));
  check('o item que espera fica dentro da tela', h1.length === 1 && h1[0].x >= 16 && h1[0].x <= ev('LW') - 16, JSON.stringify(h1));
  ev('B.running=true; 1'); const x0 = h1.length ? h1[0].x : 0; step(G, 2); check('não anda com o cenário (herói correndo)', Math.abs(ev('pkHeld()[0].x') - x0) < 0.01, x0 + ' → ' + ev('pkHeld()[0].x')); ev('B.running=false; 1');
  check('toque LONGE não pega', ev('pkTap(pkHeld()[0].x+80, pkHeld()[0].y)') === false && ev('pkHeld().length') === 1);
  check('toque PERTO manda para a mochila', ev('pkTap(pkHeld()[0].x+10, pkHeld()[0].y-12)') === true && ev('pkHeld().length') === 0 && ev('PK.list.length') === 1);
  step(G, 1); check('depois do toque o item chega e sai da lista', ev('PK.list.length') === 0);
  /* sem toque: vai sozinho depois do prazo */
  ev("spawnPicks([{type:'item',value:1,r:4,slot:'weapon',e:0,to:'bag'}],220)"); step(G, 5); check('Lendário ainda espera aos 5 s', ev('pkHeld().length') === 1);
  step(G, ev('PK_HOLD_S') + 2); check('sem toque, vai sozinho depois de ' + ev('PK_HOLD_S') + ' s', ev('PK.list.length') === 0, 'sobraram ' + ev('PK.list.length'));
  /* teto de itens esperando */
  ev("spawnPicks(Array.from({length:10},()=>({type:'item',value:1,r:2,slot:'weapon',e:0,to:'bag'})),200)"); step(G, 3);
  { const xs = JSON.parse(ev('JSON.stringify(pkHeld().map(q=>Math.round(q.x)).sort((a,b)=>a-b))')); let gap = 1e9; for (let i = 1; i < xs.length; i++) gap = Math.min(gap, xs[i] - xs[i - 1]); check('itens que esperam não se sobrepõem (pelo menos ' + ev('PK_GAP') + ' px entre eles) e ficam na tela', xs.length >= 2 && gap >= ev('PK_GAP') - 1 && xs[0] >= 20 && xs[xs.length - 1] <= ev('LW') - 20, JSON.stringify(xs)); }
  check('no máximo ' + ev('PK_HOLD_MAX') + ' esperando; o excedente voa', ev('pkHeld().length') === ev('PK_HOLD_MAX') && ev('PK.list.length') === ev('PK_HOLD_MAX'), ev('pkHeld().length') + ' / ' + ev('PK.list.length'));
  ev('PK.list.length=0; 1');
  /* +FC: peça melhor que a equipada (equipada sozinha ao entrar na mochila) e peça pior */
  const up = ev("(function(){ addItemToBag({slot:'weapon',r:3,e:0}); const p={type:'item',value:1,r:3,slot:'weapon',e:0,to:'bag'}; return pkBetter(p); })()");
  check('"+FC" quando a peça é melhor que a equipada', up === true, String(up));
  const dn = ev("(function(){ const p={type:'item',value:1,r:2,slot:'necklace',e:0,to:'bag'}; return pkBetter(p); })()"); check('sem a peça na mochila não promete "+FC"', dn === false, String(dn));
  let drew = true; try { G.inCtx(() => ev('drawPicks')()); } catch (e) { drew = false; console.log(String(e && e.message)); }
  ev("spawnPicks([{type:'item',value:1,r:3,slot:'weapon',e:0,to:'bag'}],200)"); step(G, 2); try { G.inCtx(() => ev('drawPicks')()); } catch (e) { drew = false; console.log(String(e && e.message)); }
  check('desenho do item esperando (anel e etiqueta) sem erro', drew && ev('pkHeld().length===1&&pkHeld()[0].up===true'));
  /* BRASAS: com o módulo desligado nada entra; ligado, o pote de 20 abates dá 1, o chefe e a fase dão as do módulo, e cada Brasa creditada vira um desenho que voa */
  check('ligada: a Brasa do chefe credita pelo módulo', ev('!!(Sys.bonfire&&Sys.bonfire.DATA&&Sys.bonfire.DATA.on===true)') && ev("fogBrasa('boss',1,200)") > 0);
  ev('PK.list.length=0; 1');
  const br = JSON.parse(ev("(function(){ const F=Sys.bonfire; F.DATA.on=true; const o=F.ensure(S); o.bra=0; o.pot=0; const out={}; let k=0; for(let i=0;i<19;i++) k+=fogBrasa('kill',1,200); out.k19=k; out.k20=fogBrasa('kill',1,200); out.bra1=o.bra; out.boss=fogBrasa('boss',1,200); out.stage=fogBrasa('stage',1); out.bra=o.bra; out.pk=PK.list.filter(q=>q.p.type==='brasa').length; out.sum=PK.list.filter(q=>q.p.type==='brasa').reduce((a,q)=>a+q.p.value,0); out.venda=fogBrasa('shop',5,200); F.DATA.on=false; return JSON.stringify(Object.assign(out,{B:F.DATA.brasas})); })()"));
  check('pote: 19 abates não dão Brasa, o 20º dá 1', br.k19 === 0 && br.k20 === 1 && br.bra1 === 1, JSON.stringify(br));
  check('chefe e fase dão as Brasas do módulo (' + br.B.boss + ' e ' + br.B.stage + ')', br.boss === br.B.boss && br.stage === br.B.stage && br.bra === 1 + br.B.boss + br.B.stage, JSON.stringify(br));
  check('cada Brasa creditada é desenhada (soma dos desenhos = Brasas ganhas)', br.pk >= 3 && br.sum === br.bra, JSON.stringify(br));
  check('fonte que não existe (venda) devolve 0: Brasa nunca é vendida', br.venda === 0);
  let drew2 = true; try { G.inCtx(() => ev('drawPicks')()); step(G, 3); } catch (e) { drew2 = false; console.log(String(e && e.message)); } check('Brasas desenhadas e recolhidas sem erro', drew2 && ev("PK.list.filter(q=>q.p.type==='brasa').length") === 0);
  /* HOST DA FOGUEIRA com o módulo REAL (Sys.bonfire): forjar não entrega; a peça só entra sem equipar; equipar, desmontar, recuperar e mochila cheia funcionam com o jogo */
  { const r = JSON.parse(ev(`(function(){ const F=Sys.bonfire, out={}; F.DATA.on=true; const o=F.ensure(S); o.bra=10; o.lv=1; const H=fogHost(); out.miss=['eraMax','level','goldUnit','spendGold','addGold','addItem','removeItem','items','equipped','equip','delta','fcOf','bagMax','now','rng'].filter(k=>typeof H[k]!=='function');
      const n0=S.inv.length, eq0=JSON.stringify(S.eq); const f=F.forge(S,H); out.forge=!!(f&&f.ok&&f.item&&f.item.slot); out.semEntrega=S.inv.length===n0; out.bra=o.bra; out.delta=typeof H.delta(f.item); out.fc=H.fcOf(f.item)>0;
      const it=H.addItem(f.item); out.entrou=S.inv.length===n0+1&&!!it&&f.item.id===it.id; out.semEquipar=JSON.stringify(S.eq)===eq0; out.equip=H.equip(f.item)===true&&S.eq[it.slot]===it.id; out.naoTiraEquipado=H.removeItem(it)===false&&S.inv.length===n0+1;
      const f2=F.forge(S,H); const it2=H.addItem(f2.item); const g0=S.gold; const d=F.dismantle(S,H,[it2]); out.desmonta=!!(d&&d.n===1)&&S.inv.length===n0+1&&S.gold>=g0; out.recente=F.view(S,H).recent.length>=1;
      const rc=F.recover(S,H,it2.id); out.recupera=!!(rc&&rc.ok)&&S.inv.length===n0+2; out.bagMax=H.bagMax()>0; F.DATA.on=false; return JSON.stringify(out); })()`));
    check('host da Fogueira tem as 15 funções que o módulo usa', r.miss.length === 0, 'faltam: ' + r.miss.join(','));
    check('forjar gasta 1 Brasa e NÃO entrega a peça sozinho', r.forge && r.semEntrega && r.bra === 9, JSON.stringify(r));
    check('a peça entra na mochila sem equipar e ganha id; equipar funciona; equipado não sai da mochila', r.entrou && r.semEquipar && r.equip && r.naoTiraEquipado && r.delta === 'number' && r.fc, JSON.stringify(r));
    check('desmontar tira da mochila e devolve ouro; recuperar devolve a peça', r.desmonta && r.recente && r.recupera && r.bagMax, JSON.stringify(r)); }
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (item no chão)' : 'FOGUEIRA · ITEM NO CHÃO OK (' + n + ' verificações): desligada = como hoje; ligada = Épico ou melhor espera o toque');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
