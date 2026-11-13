'use strict';
/* PET SEMPRE NA FRENTE (regra do dono; Engenheiro 14, sem navegador). Rodar: node test/e2e/petfront.js [-v]
   Carrega o jogo no sandbox com o canvas que grava a ORDEM dos drawImage (test/e2e/sandbox.js, draw:true), equipa pet + asa (+ montaria) e confere:
     1. batalha (draw() do js/battle.js) COM montaria: a folha do pet é desenhada DEPOIS da montaria (que traz o herói), da asa e da arma
     2. batalha SEM montaria: o pet é desenhado DEPOIS do corpo do herói, da asa e da arma
     3. drawHeroFull (Arena, Troca de era, Título, Aparência) COM e SEM montaria: mesma ordem
     4. posição: o pet fica À FRENTE (x > x do herói) e NÃO acima da linha do chão (dy >= 0); no drawHeroFull o deslocamento segue a montaria DESTE desenho
        (state.mount), não a da batalha (HM.mount)
     5. Vitória e Derrota abertas (B.res), com e sem montaria: o pet continua desenhado, por último, PARADO (nunca o quadro congelado do golpe)
     6. DERROTA (regra do dono, 13/11): o pet fica parado, por último, pés no chão, e desliza para ALÉM da arma caída (não tampa o herói nem a arma: caixas
        conferidas nas eras 0, 2 e 3, pet de estágio 1 e 3, Kael e Kaia); a montaria FICA parada ATRÁS do herói caído (imagem dela sozinha, assets/mounts/mount_*,
        respirando com as patas no chão; entra em fade cruzado com a folha montada; nunca o ícone de contorno branco); sem imagem, sai correndo; a asa acompanha o corpo caído (item 10)
     7. CHOCAGEM DE OVO: o pet equipado continua desenhado e o ovo fica AO LADO dele, à frente, dentro da tela, sem encostar no herói; só o pet que ainda
        está dentro do próprio ovo (1º ovo) espera nascer
     9. GANCHOS DE DEBUG do QA (dbgDieAt, dbgHatchAt, dbgLvUp): existem com ?debug=1, congelam o instante pedido e soltam
    10. ASA NA MORTE: desenhada em todos os quadros da queda (Kael, Kaia e 2 skins), antes do corpo, recortada na linha do chão; nunca asa dupla (Kael Anjo:
        pasta sem asa + asa do item; skins de asa própria: sem asa do item); folha sem âncora regravada (pastas de fase) ou com quadro não ok = sem asa
     8. APARÊNCIA (js/p_look.js): destaque (a pé e montado) e grade desenham o pet, por último
   Só lê arquivos do jogo, nunca grava. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, n = 0;
const check = (name, ok, det) => { n++; if (!ok) fail++; if (VERBOSE || !ok) console.log('  ' + (ok ? 'ok    ' : 'FALHA ') + name + (det && (!ok || VERBOSE) ? ' · ' + det : '')); };
const RE = { ref: /assets\/mounts\/mount_/, park: /icons\/mounts\//, egg: /pets\/pet_egg/, pet: /anim\/pets\//, mount: /anim\/mounts\//, hero: /anim\/hyb\//, wing: /equip\/wing_/, weapon: /assets\/weapons\// };
const first = (L, re) => L.findIndex(s => re.test(s));
const last = (L, re) => { for (let i = L.length - 1; i >= 0; i--) if (re.test(L[i])) return i; return -1; };
/* o pet vem depois de TODAS as partes pedidas (must = tem de existir no desenho; also = se existir, também fica antes do pet) */
function order(tag, L, must, also) { const p = first(L, RE.pet), det = k => k + ' ' + first(L, RE[k]) + '..' + last(L, RE[k]);
  check(tag + ': o pet foi desenhado', p >= 0, 'nenhuma folha anim/pets entre ' + L.length + ' desenhos');
  for (const k of must) { check(tag + ': ' + k + ' foi desenhado', last(L, RE[k]) >= 0, 'nenhum desenho de ' + k); check(tag + ': pet DEPOIS de ' + k, p >= 0 && last(L, RE[k]) >= 0 && last(L, RE[k]) < p, 'pet ' + p + ' · ' + det(k)); }
  for (const k of also) if (last(L, RE[k]) >= 0) check(tag + ': pet DEPOIS de ' + k, p > last(L, RE[k]), 'pet ' + p + ' · ' + det(k)); }

(async () => {
  const loadErr = [], G = boot({ realFetch: true, draw: true, runBoot: true, search: '?debug=1&fresh=1', add: (g, nm, ok, e) => { if (!ok) loadErr.push(nm + ': ' + e); } }), { ev, sandbox: X } = G;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  const errs = [];
  const tick = async () => { try { G.inCtx(() => ev('draw')()); } catch (e) { const s = errStr(e); if (!errs.includes(s)) errs.push(s); } try { G.inCtx(() => G.advance(40)); } catch (e) {} await new Promise(r => setImmediate(r)); };
  const until = async (cond, max) => { for (let i = 0; i < max; i++) { let ok = false; try { ok = !!cond(); } catch (e) {} if (ok) return true; await tick(); } try { return !!cond(); } catch (e) { return false; } };
  /* um draw() da batalha com a lista dos drawImage, na ordem */
  const battleList = () => { const L = []; G.setDrawTap(s => L.push(s)); try { G.inCtx(() => ev('draw')()); } catch (e) { errs.push('draw: ' + errStr(e)); } G.setDrawTap(null); return L; };
  /* um drawHeroFull num canvas próprio, com a lista dos drawImage e a posição que o drawPet usou */
  const fullList = state => { const cv = G.mkCanvas(false); cv.__tap = true; const L = []; let pos = null, ret = null; const p0 = X.drawPet;
    X.drawPet = function () { try { pos = ev('({dx:petX()-HX, mo:!!petMO(), dy:petTbl().dy+(petMO()?petMO().dy:0)})'); } catch (e) {} return p0.apply(this, arguments); };
    G.setDrawTap(s => L.push(s)); try { ret = G.inCtx(() => X.drawHeroFull(cv.getContext('2d'), 195, 600, 1, state)); } catch (e) { errs.push('drawHeroFull: ' + errStr(e)); } G.setDrawTap(null); X.drawPet = p0; return { L, pos, ret }; };

  /* VITÓRIA / DERROTA (P4/P13, Engenheiro 17): com o resultado aberto (B.res) o pet continua desenhado, por ÚLTIMO, e PARADO: o golpe que estava em andamento
     não fica congelado num quadro do ataque. Atrás da Troca de era (tela cheia) ele não é desenhado (exceção escrita no drawPet). must = o que tem de vir antes
     do pet na Vitória (montaria ou herói); na Derrota o Kael cai a pé (folha da morte, anim/hyb ou anim/skins), a montaria fica parada atrás dele (imagem dela sozinha, respirando) e o pet fica à frente. */
  const petSt = (L, st) => L.some(s => RE.pet.test(s) && new RegExp('_' + st + '\\.').test(s));
  const resCase = async (tag, must) => {
    ev("window.__pfS={r:B.res,a:PETK.act,run:B.running,d:B.deadT,db:B.deadBoss}; B.res=null; B.running=false; PETK.act={t:0.2,dur:1,hitT:0.5,e:null,done:true}; 1");
    try {
      let L = battleList(); check(tag + ': controle, fora do resultado o golpe em andamento aparece (folha _atk1)', petSt(L, 'atk1'), 'sem _atk1: o teste não enxergaria o defeito');
      ev("B.res={mode:'win'}; 1"); L = battleList(); order(tag + ' VITÓRIA', L, must, ['hero', 'wing', 'weapon']);
      check(tag + ' VITÓRIA: pet parado (folha _idle), sem quadro do golpe', petSt(L, 'idle') && !petSt(L, 'atk1'), L.filter(s => RE.pet.test(s)).join(', '));
      const pos = ev('({dx:petX()-HX, dy:petTbl().dy+(petMO()?petMO().dy:0)})'); check(tag + ' VITÓRIA: pet à frente e não acima do chão', pos.dx > 0 && pos.dy >= 0, JSON.stringify(pos));
      const f = fullList({ t: 0.3 }); order(tag + ' drawHeroFull com a Vitória aberta', f.L, must, ['hero', 'wing', 'weapon']); check(tag + ' drawHeroFull com a Vitória aberta: pet parado', petSt(f.L, 'idle') && !petSt(f.L, 'atk1'), f.L.filter(s => RE.pet.test(s)).join(', '));
      check(tag + ': o golpe guardado do pet continua o mesmo depois do drawHeroFull', ev('!!PETK.act&&PETK.act.t===0.2'));
      ev("B.res={mode:'era'}; 1"); L = battleList(); check(tag + ' Troca de era: pet não desenhado (a tela cobre tudo)', first(L, RE.pet) < 0, 'pet em ' + first(L, RE.pet));
      ev("B.res={mode:'lose'}; heroDown(true); 1"); await until(() => ev('ART_ON.kael_die!==true||dieSheet().ok'), 400);
      L = battleList(); const die = L.findIndex(s => /_die_body/.test(s)), p = first(L, RE.pet);
      check(tag + ' DERROTA: o pet foi desenhado', p >= 0, 'nenhuma folha anim/pets'); check(tag + ' DERROTA: herói caído pela folha da morte', die >= 0, 'sem _die_body entre ' + L.length + ' desenhos');
      check(tag + ' DERROTA: pet DEPOIS do herói caído', p > die && die >= 0, 'pet ' + p + ' · morte ' + die); check(tag + ' DERROTA: pet parado (folha _idle)', petSt(L, 'idle') && !petSt(L, 'atk1'), L.filter(s => RE.pet.test(s)).join(', '));
      /* regra do dono (13/11): na Derrota o pet NÃO recua; a montaria fica; a asa não flutua */
      const box = () => ev('(function(){ const c=dieClear(HM), m=petMetric(PETK.base)||{l:70,r:70}, k=petK(), p=petPos(); return {x:p.x, gy:p.gy, pl:p.x-m.l*k, pr:p.x+m.r*k, l:c.l, r:c.r, wl:c.wl, wr:c.wr, px:petX(), tx:petDieX(), hx:HX, GY:GY, LW:LW}; })()');
      const dp = box(), apart = b => b.pl >= b.r || b.pr <= b.l;
      check(tag + ' DERROTA: pet no lugar da Derrota (fim do deslize), pés no chão', Math.abs(dp.x - dp.tx) < 0.01 && dp.gy >= dp.GY, JSON.stringify(dp));
      check(tag + ' DERROTA: a arma caída foi medida', dp.wl != null && dp.wr > dp.wl, JSON.stringify(dp));
      check(tag + ' DERROTA: a caixa do pet não cruza a do herói caído + arma', apart(dp), JSON.stringify(dp));
      check(tag + ' DERROTA: pet além da arma, do lado do inimigo, inteiro na tela', dp.pl >= dp.wr && dp.pr <= dp.LW && dp.x > dp.hx, JSON.stringify(dp));
      /* inimigo que ficou em cena (visto pelo QA: o pet ia para cima do tigre). Conta pura do petDieX com um inimigo posto à mão. */
      for (const [nm, off, side] of [['com folga depois do pet', dp.pr - dp.r + 8, 'frente'], ['colado na arma (sem vaga)', 10, 'pés']]) {
        const q = ev('(function(){ const en0=B.en, c=dieClear(HM); B.en=[{x:c.r+' + off + '+35,dw:70,dead:false,sw:0,idx:0,key:"era0_e0"}]; try{ const m=petMetric(PETK.base)||{l:70,r:70}, k=petK(), x=petDieX(); return {x:x, pl:x-m.l*k, pr:x+m.r*k, el:enemyLeft(), l:c.l, r:c.r, wl:c.wl, wr:c.wr, hx:HX, LW:LW}; } finally { B.en=en0; } })()');
        check(tag + ' DERROTA, inimigo ' + nm + ': pet do lado d' + (side === 'frente' ? 'a frente' : 'os pés') + ', sem tocar o inimigo', q.pr <= q.el && (side === 'frente' ? q.pl >= q.r : q.x < q.hx), JSON.stringify(q));
        check(tag + ' DERROTA, inimigo ' + nm + ': pet não cruza a arma caída e fica na tela', (q.pl >= q.wr || q.pr <= q.wl) && q.pl >= 0 && q.pr <= q.LW, JSON.stringify(q)); }
      { const xs = [1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 0.8].map(d => { ev('B.deadT=' + d + '; 1'); return ev('petPos().x'); }); ev('B.deadT=0.8; 1');   /* deslize: começa onde estava, vai sem pulo, termina no lugar */
        const step = Math.max(...xs.slice(1).map((v, i) => Math.abs(v - xs[i]))), mono = xs.every((v, i) => !i || (v - xs[i - 1]) * (xs[xs.length - 1] - xs[0]) >= -1e-9);
        check(tag + ' DERROTA: o pet DESLIZA (começa na posição de vivo, sem teleporte, sem ir e voltar)', Math.abs(xs[0] - dp.px) < 0.01 && Math.abs(xs[xs.length - 1] - dp.tx) < 0.01 && mono && step < Math.abs(dp.tx - dp.px) * 0.6 + 0.01, xs.map(v => v.toFixed(1)).join(' → ')); }
      { const dI = L.findIndex(s => /_die_body/.test(s)); check(tag + ' DERROTA: a ASA é desenhada (âncora da folha da morte), antes do herói caído' + (must.includes('mount') ? ' e depois da montaria parada' : ''), first(L, RE.wing) >= 0 && last(L, RE.wing) < dI && (first(L, RE.ref) < 0 || last(L, RE.ref) < first(L, RE.wing)), 'asa ' + first(L, RE.wing) + '..' + last(L, RE.wing) + ' · morte ' + dI + ' · montaria ' + last(L, RE.ref)); }
      check(tag + ' DERROTA: nenhuma folha MONTADA (herói não fica montado morto)', last(L, RE.mount) < 0, 'folha montada em ' + last(L, RE.mount));
      check(tag + ' DERROTA: nenhum ícone parado de montaria (reprovado pelo dono)', first(L, RE.park) < 0, 'ícone em ' + first(L, RE.park));
      if (must.includes('mount')) { const id = ev('HM.mount.id'), run = new RegExp('anim/mounts/[a-z]+_' + id + '_run_body'), idle = new RegExp('anim/mounts/[a-z]+_' + id + '_idle_body'), at = d => { ev('B.deadT=' + d + '; 1'); return battleList(); }, dieI = E => E.findIndex(s => /_die_body/.test(s));
        /* toda montaria da tabela tem imagem parada, o arquivo existe e está no manifesto (senão não vai para a APK) */
        { const fsn = require('fs'), pth = require('path'), refs = ev('(function(){ const o={}; for(const m of mountIds()){ const k=m.id; o[k]=MOUNT_REF[k]?MOUNT_REF[k].f:null; } return o; })()'), man = fsn.readFileSync(pth.join(G.ROOT, 'assets/manifest.json'), 'utf8');
          for (const k in refs) { const f = refs[k] && 'assets/mounts/' + refs[k] + '.png'; check('montaria ' + k + ': imagem parada na tabela, no disco e no manifesto', !!f && fsn.existsSync(pth.join(G.ROOT, f)) && man.includes(f), String(f)); } }
        check(tag + ' DERROTA: imagem parada da montaria carregada (pedida quando ela entrou em cena)', await until(() => ev('mountStill(HM.mount.id).ok'), 80), JSON.stringify(ev('(function(){ const o=mountStill(HM.mount.id); return {ok:o.ok,fail:o.fail}; })()')));
        check(tag + ' DERROTA: imagem reduzida uma vez (largura <= MOUNT_STILL_W) e só a da montaria em uso na memória', ev('mountStill(HM.mount.id).c.width<=MOUNT_STILL_W&&Object.keys(MOUNT_STILL).length===1'), ev('mountStill(HM.mount.id).c.width') + ' px');
        check(tag + ' DERROTA: fade cruzado curto (0,2 a 0,5 s)', ev('MOUNT_XFADE>=0.2&&MOUNT_XFADE<=0.5'), 'MOUNT_XFADE=' + ev('MOUNT_XFADE'));
        ev('HM._md=null; 1'); let E = at(1.5);   /* 0,1 s depois da queda: no meio do fade cruzado */
        check(tag + ' DERROTA (fade cruzado): imagem parada E folha montada parada desenhadas, as duas antes do herói caído', first(E, RE.ref) >= 0 && E.some(s => idle.test(s)) && last(E, RE.ref) < dieI(E) && last(E, RE.mount) < dieI(E), E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', ') || 'nada da montaria');
        check(tag + ' DERROTA (fade cruzado): é a imagem desta montaria, sem folha de corrida nem ícone', (E[first(E, RE.ref)] || '').includes(ev('MOUNT_REF[HM.mount.id].f')) && !E.some(s => run.test(s)) && first(E, RE.park) < 0, E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', '));
        check(tag + ' DERROTA (fade cruzado): pet depois do herói caído, parado', first(E, RE.pet) > dieI(E) && petSt(E, 'idle'), E.filter(s => RE.pet.test(s)).join(', '));
        for (const d of [1.6 - ev('MOUNT_XFADE') - 0.05, 0.8]) { E = at(d); check(tag + ' DERROTA (deadT ' + d.toFixed(2) + '): a montaria FICA (imagem parada) → herói caído → pet; nenhuma folha montada', first(E, RE.ref) >= 0 && first(E, RE.ref) < dieI(E) && dieI(E) < first(E, RE.pet) && last(E, RE.mount) < 0 && first(E, RE.park) < 0, 'imagem ' + first(E, RE.ref) + ' · morte ' + dieI(E) + ' · pet ' + first(E, RE.pet) + ' · folha ' + last(E, RE.mount)); }
        /* respiração: patas sempre no chão, altura varia 1 a 2%, período de 2 a 3 s, largura/lugar não mudam */
        { const g = ev('(function(){ const H=Object.assign({},HM), out=[]; for(let i=0;i<=16;i++){ H.t=10+i*MOUNT_BREATH/16; const q=mountStillGeo(H); out.push({gy:q.gy,sy:q.sy,sx:q.sx,w:q.w,cx:q.cx,h:q.h}); } return {a:out, GY:GY, per:MOUNT_BREATH, hx:HX}; })()');
          const sy = g.a.map(q => q.sy), amp = Math.max(...sy) - 1, lo = 1 - Math.min(...sy);
          check(tag + ' DERROTA (respiração): patas sempre na linha do chão', g.a.every(q => q.gy === g.GY), JSON.stringify(g.a.map(q => q.gy)));
          check(tag + ' DERROTA (respiração): altura sobe e desce de 1 a 2%, período de 2 a 3 s', amp >= 0.01 && amp <= 0.02 && lo >= 0.01 && lo <= 0.02 && g.per >= 2 && g.per <= 3 && Math.abs(sy[0] - sy[16]) < 1e-9, 'amp +' + amp.toFixed(4) + ' / -' + lo.toFixed(4) + ' · período ' + g.per);
          check(tag + ' DERROTA (respiração): mesmo lugar e mesma largura o tempo todo, tamanho válido', g.a.every(q => q.w === g.a[0].w && q.cx === g.a[0].cx && q.w > 0 && q.h > 0), JSON.stringify(g.a[0])); }
        const f2 = fullList({ t: 0.3, deadP: 0.9 }), a2 = first(f2.L, RE.ref), b = f2.L.findIndex(s => /_die_body/.test(s)), c = first(f2.L, RE.pet);
        check(tag + ' drawHeroFull {deadP 0,9}: montaria parada → herói caído → pet; nenhuma folha montada', a2 >= 0 && a2 < b && b < c && last(f2.L, RE.mount) < 0, 'imagem ' + a2 + ' · morte ' + b + ' · pet ' + c + ' · folha ' + last(f2.L, RE.mount));
        /* ORIENTAÇÃO e ENCAIXE NA CENA, as 6 montarias: a transformação final não espelha a arte (todas olham para a direita no arquivo, como a montada) e a
           montaria parada cabe inteira com margem >= 6 px de tela a 288, 360 e 390 de largura (a cena lógica tem sempre LW de largura; a tela só escala) */
        { const all = ev('(function(){ const out={}; for(const m of mountIds()){ const k=m.id; const H=Object.assign({},HM,{mount:{id:k,stars:1},t:10}); const g=mountStillGeo(H); out[k]={face:MOUNT_REF[k]&&MOUNT_REF[k].face, xs:g.xs, flip:g.flip, l:g.cx-g.w/2, r:g.cx+g.w/2, gy:g.gy}; } return {m:out, LW:LW, GY:GY, edge:MOUNT_STILL_EDGE}; })()');
          for (const k in all.m) { const q = all.m[k];
            check('montaria parada ' + k + ': olha para a DIREITA (arte virada para a direita, desenho sem espelhar)', q.face === 'R' && q.flip === false && q.xs > 0, JSON.stringify(q));
            check('montaria parada ' + k + ': inteira na cena com margem (>= 6 px de tela a 288, 360 e 390), patas no chão', [288, 360, 390].every(W => q.l * W / all.LW >= 6 && (all.LW - q.r) * W / all.LW >= 6) && q.gy === all.GY, 'x ' + q.l.toFixed(1) + '..' + q.r.toFixed(1) + ' de ' + all.LW); }
          const fit = ev('(function(){ const E=MOUNT_STILL_EDGE, a=mountStillFit(66,174), b=mountStillFit(100,400), c=mountStillFit(320,100), d=mountStillFit(150,120); return {a:[a.cx-a.w/2,a.w], b:[b.cx-b.w/2,b.cx+b.w/2,b.w], c:[c.cx+c.w/2,c.w], d:[d.cx,d.w], E:E, LW:LW}; })()');
          check('montaria parada: saía pela borda esquerda → empurrada para dentro, mesma largura', Math.abs(fit.a[0] - fit.E) < 1e-9 && fit.a[1] === 174, JSON.stringify(fit));
          check('montaria parada: mais larga que a cena → reduzida até caber com margem dos dois lados', Math.abs(fit.b[0] - fit.E) < 1e-9 && Math.abs(fit.b[1] - (fit.LW - fit.E)) < 1e-9 && fit.b[2] < 400, JSON.stringify(fit));
          check('montaria parada: saía pela direita → empurrada para dentro; quem já cabe não muda', Math.abs(fit.c[0] - (fit.LW - fit.E)) < 1e-9 && fit.c[1] === 100 && fit.d[0] === 150 && fit.d[1] === 120, JSON.stringify(fit));
          check('montaria parada: flip só para arte virada para a esquerda (face L espelha)', ev("(function(){ const R=MOUNT_REF[HM.mount.id], f0=R.face; R.face='L'; try{ const g=mountStillGeo(Object.assign({},HM,{t:10})); return g.flip===true&&g.xs<0; } finally { R.face=f0; } })()"));
          check(tag + ' DERROTA: imagem da montaria em uso carregada de novo depois da conferência das 6', await until(() => ev('mountStill(HM.mount.id).ok'), 120)); }
        /* IMAGEM AINDA CARREGANDO no instante da queda: a montaria NÃO sai correndo virada para a esquerda; a folha parada espera no lugar e o fade começa quando a imagem chega */
        ev('window.__pfS2=MOUNT_STILL[HM.mount.id]; MOUNT_STILL[HM.mount.id]={c:null,ok:false,fail:false,bb:null}; HM._md=null; 1');
        try { E = at(1.5); check(tag + ' DERROTA com a imagem CARREGANDO: folha montada parada no lugar (sem corrida, sem imagem ainda), antes do herói caído', E.some(s => idle.test(s)) && !E.some(s => run.test(s)) && first(E, RE.ref) < 0 && last(E, RE.mount) < dieI(E) && ev("HM._md.mode==='still'"), E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', ') || 'nada da montaria');
          E = at(0.8); check(tag + ' DERROTA com a imagem CARREGANDO: continua esperando (nunca some, nunca sai correndo)', E.some(s => idle.test(s)) && !E.some(s => run.test(s)), E.filter(s => RE.mount.test(s)).join(', ') || 'nada da montaria');
          ev('MOUNT_STILL[HM.mount.id]=window.__pfS2; 1'); E = at(0.8); check(tag + ' DERROTA, a imagem CHEGOU: o fade cruzado começa nesse instante (imagem + folha parada juntas)', first(E, RE.ref) >= 0 && E.some(s => idle.test(s)) && ev('HM._md.tr!=null'), E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', '));
          ev('HM._md.tr=HM.t-1; 1'); E = at(0.8); check(tag + ' DERROTA, a imagem CHEGOU: terminado o fade só a imagem parada', first(E, RE.ref) >= 0 && last(E, RE.mount) < 0, E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', '));
          ev('MOUNT_STILL[HM.mount.id]={c:null,ok:false,fail:true,bb:null}; HM._md=null; 1'); E = at(1.5); check(tag + ' DERROTA com a imagem que FALHOU: reserva (sai correndo)', E.some(s => run.test(s)) && first(E, RE.ref) < 0 && ev("HM._md.mode==='exit'"), E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', '));
        } finally { ev('MOUNT_STILL[HM.mount.id]=window.__pfS2; HM._md=null; B.deadT=0.8; 1'); }
        /* RESERVA: montaria sem imagem (ou que não carregou) sai correndo, como antes */
        ev('window.__pfR=MOUNT_REF[HM.mount.id]; delete MOUNT_REF[HM.mount.id]; HM._md=null; 1');
        try { E = at(1.5); const mi = E.findIndex(s => run.test(s));
          check(tag + ' DERROTA sem imagem (reserva): sai correndo pela folha de CORRIDA, antes do herói caído; nenhuma imagem parada', mi >= 0 && mi < dieI(E) && dieI(E) < first(E, RE.pet) && first(E, RE.ref) < 0, E.filter(s => RE.ref.test(s) || RE.mount.test(s)).join(', ') || 'nada da montaria');
          check(tag + ' DERROTA sem imagem (reserva): a saída dura de 0,4 a 0,6 s', ev('MOUNT_EXIT>=0.4&&MOUNT_EXIT<=0.6'), 'MOUNT_EXIT=' + ev('MOUNT_EXIT'));
          E = at(1.6 - ev('MOUNT_EXIT') - 0.05); check(tag + ' DERROTA sem imagem (reserva): terminada a saída nada da montaria é desenhado; pet depois do herói caído', last(E, RE.mount) < 0 && first(E, RE.ref) < 0 && first(E, RE.pet) > dieI(E), 'montaria em ' + last(E, RE.mount));
        } finally { ev('MOUNT_REF[HM.mount.id]=window.__pfR; HM._md=null; B.deadT=0.8; 1'); } }
    } finally { ev("(function(){ const o=window.__pfS; heroDown(false); B.res=o.r; PETK.act=o.a; B.running=o.run; B.deadT=o.d; B.deadBoss=o.db; })(); 1"); } };

  /* CHOCAGEM DE OVO (regra do dono: o pet nunca some). other = espécie diferente da equipada. O relógio do ovo é posto à mão (t0 = B.at - T). */
  const hatchCase = async tag => {
    const o = ev(`(function(){ const sp=Sys.pet.DATA.v17.species||{}, me=PETK.info.id; let other=null; for(const k in sp){ if(k!==me&&sp[k]&&sp[k].sprite){ other={pet:k,sprite:sp[k].sprite}; break; } }
      window.__pfH={r:B.res,p:B.paused,run:B.running}; B.res=null; B.paused=false; B.running=false; view='battle'; HATCH.q.length=0; HATCH.cur=null; try{ if(!B.en.length) startBattle(); placeNow(); }catch(e){} return {me, mySprite:(sp[me]||{}).sprite||null, other}; })()`);
    const start = async (h, T) => { ev('HATCH.q.length=0; HATCH.cur=null; HATCH.q.push(' + JSON.stringify(Object.assign({ name: 'Teste', r: 1, first: false, dup: false }, h)) + '); 1'); battleList(); await until(() => ev('!!HATCH.egg&&HATCH.egg.complete'), 60); ev('if(!HATCH.cur){ hatchStart(HATCH.q.shift()); } HATCH.cur.t0=B.at-' + T + '; 1'); return battleList(); };
    const mine = L => L.filter(s => RE.pet.test(s) && s.includes(ev('PETK.base')));
    try {
      check(tag + ' CHOCAGEM: há outra espécie para chocar', !!o.other, JSON.stringify(o));
      /* VAGA do ovo/recém-nascido (conta pura do hatchPlace; não depende de onde o inimigo está: quem abre o espaço é o inimigo, pela reserva) */
      const far = (a0, a1, b0, b1) => a1 <= b0 + 0.05 || a0 >= b1 - 0.05, H = JSON.stringify({ pet: o.other.pet, sprite: o.other.sprite, dup: false });
      const q = ev('(function(){ const h=' + H + ', p=hatchPlace(h), m=petMetric(PETK.base)||{l:70,r:70}, k=petK(), mo=!!petMO(); return {side:p.side, l:p.x-p.sw/2, r:p.x+p.sw/2, x:p.x, ew:p.ew, sw:p.sw, nb:hatchNbW(h), nbk:hatchNbK(h), nbk0:heroBodyH()*0.46/Math.max(20,(petMetric(h.sprite)||{h:150}).h), min:HS*HATCH_EW_MIN, full:HS*HATCH_EW, edge:HATCH_EDGE, pl:petX()-m.l*k, pr:petX()+m.r*k, hl:HX-HS*(mo?0.45:KAEL_W/2), hr:HX+HS*KAEL_W/2, mo:mo, LW:LW}; })()');
      check(tag + ' CHOCAGEM: vaga dentro da tela COM MARGEM (nunca colada na borda)', q.l >= q.edge - 0.05 && q.r <= q.LW - q.edge + 0.05, JSON.stringify(q));
      check(tag + ' CHOCAGEM: recém-nascido no tamanho normal de filhote e cabe na vaga', Math.abs(q.nbk - q.nbk0) < 1e-9 && q.nb <= q.sw + 0.05, JSON.stringify(q));
      check(tag + ' CHOCAGEM: ovo entre o mínimo e o cheio, dentro da vaga', q.ew >= q.min - 0.05 && q.ew <= q.full + 0.05 && q.ew <= q.sw + 0.05, JSON.stringify(q));
      check(tag + ' CHOCAGEM: a vaga não cobre o pet equipado', far(q.l, q.r, q.pl, q.pr), JSON.stringify(q));
      check(tag + ' CHOCAGEM: a vaga não cobre o herói' + (q.mo ? ' nem a montaria' : ''), far(q.l, q.r, q.hl, q.hr), JSON.stringify(q));
      check(tag + ' CHOCAGEM: vaga À FRENTE do pet (nunca atrás do herói colada na borda esquerda)', q.side === 'front' || q.l >= q.edge, JSON.stringify(q));
      /* reserva: com ovo na vez, a folga do inimigo da frente conta a partir da vaga; sem ovo, volta ao normal */
      { const r = ev('(function(){ const q0=HATCH.q.slice(), c0=HATCH.cur; HATCH.cur=null; HATCH.q.length=0; const e0=heroEdge(); HATCH.q.push(' + H + '); const e1=heroEdge(), h=HATCH.q[0], right=h.side==="front"?h.x+h.sw/2:0; HATCH.q.length=0; const e2=heroEdge(); for(const x of q0) HATCH.q.push(x); HATCH.cur=c0; return {e0:e0,e1:e1,e2:e2,right:right,side:h.side}; })()');
        check(tag + ' CHOCAGEM: com ovo na vez o inimigo da frente guarda a folga a partir da vaga', r.side !== 'front' || (r.e1 >= r.right - 0.05 && r.e1 > r.e0), JSON.stringify(r)); check(tag + ' CHOCAGEM: sem ovo a folga volta ao normal', Math.abs(r.e2 - r.e0) < 0.01, JSON.stringify(r)); }
      /* espera: com inimigo DENTRO da vaga o ovo não aparece (não cobre ninguém); vaga livre → aparece; depois de HATCH_WAIT s aparece de qualquer jeito */
      { const w = ev('(function(){ const en0=B.en; HATCH.cur=null; HATCH.q.length=0; HATCH.q.push(' + H + '); const h=hatchSet(HATCH.q[0]), E={x:h.x+35-4,dw:70,dead:false,sw:0,idx:0,key:"era0_e0"}; B.en=[E]; const out={side:h.side};'
          + ' try{ drawHatch(); out.wait=!HATCH.cur&&HATCH.q.length===1; E.x=h.x+h.sw/2+35+2; drawHatch(); out.go=!!HATCH.cur&&HATCH.cur.x===h.x; HATCH.cur=null; HATCH.q.push(' + H + '); const h2=hatchSet(HATCH.q[0]); E.x=h2.x+35-4; drawHatch(); out.wait2=!HATCH.cur; h2.w0=B.at-HATCH_WAIT-0.1; drawHatch(); out.timeout=!!HATCH.cur; } finally { B.en=en0; HATCH.cur=null; HATCH.q.length=0; } return out; })()');
        if (w.side === 'front') { check(tag + ' CHOCAGEM: inimigo dentro da vaga → o ovo ESPERA (não cobre o inimigo)', w.wait && w.wait2, JSON.stringify(w)); check(tag + ' CHOCAGEM: vaga livre → o ovo aparece, no lugar escolhido', w.go, JSON.stringify(w)); check(tag + ' CHOCAGEM: a espera tem limite (a fila nunca trava)', w.timeout, JSON.stringify(w)); } }
      let L = await start(o.other, 1.0); const g = ev('({cur:!!HATCH.cur, x:HATCH.cur&&HATCH.cur.x})');
      check(tag + ' CHOCAGEM: o ovo está chocando', g.cur && first(L, RE.egg) >= 0, 'sem pet_egg entre ' + L.length + ' desenhos');
      check(tag + ' CHOCAGEM: o pet equipado CONTINUA desenhado', mine(L).length > 0, L.filter(s => RE.pet.test(s)).join(', ') || 'nenhuma folha anim/pets');
      check(tag + ' CHOCAGEM: o ovo é desenhado na vaga calculada', Math.abs(g.x - q.x) < 0.01, g.x + ' · ' + q.x);
      { const x0 = ev('HATCH.cur.x'); ev('for(const e of B.en) e.x-=20; 1'); battleList(); const x1 = ev('HATCH.cur.x'); ev('for(const e of B.en) e.x+=20; 1'); check(tag + ' CHOCAGEM: o ovo não muda de lugar quando o inimigo se mexe', x0 === x1, x0 + ' → ' + x1); }
      ev('HATCH.cur.t0=B.at-3.6; 1'); L = battleList(); check(tag + ' CHOCAGEM: depois de nascer o filhote, o pet equipado segue desenhado', mine(L).length > 0, L.filter(s => RE.pet.test(s)).join(', '));
      /* o próprio pet equipado dentro do ovo (1º ovo): espera nascer no lugar dele; repetido (dup) não esconde ninguém */
      L = await start({ pet: o.me, sprite: o.mySprite, first: true }, 1.0); check(tag + ' CHOCAGEM do próprio pet: antes de nascer só o ovo, no lugar do pet', first(L, RE.egg) >= 0 && first(L, RE.pet) < 0 && ev('hatchX(HATCH.cur)===petX()'), L.filter(s => RE.pet.test(s)).join(', '));
      ev('HATCH.cur.t0=B.at-3.6; 1'); L = battleList(); check(tag + ' CHOCAGEM do próprio pet: nascido, o pet é desenhado (uma vez só)', L.filter(s => RE.pet.test(s)).length === 1, L.filter(s => RE.pet.test(s)).join(', '));
      L = await start({ pet: o.me, sprite: o.mySprite, dup: true }, 1.0); check(tag + ' CHOCAGEM de repetido: o pet equipado continua desenhado', mine(L).length > 0 && first(L, RE.egg) >= 0, L.filter(s => RE.pet.test(s)).join(', '));
    } finally { ev('(function(){ const s=window.__pfH; HATCH.q.length=0; HATCH.cur=null; B.banner=null; B.res=s.r; B.paused=s.p; B.running=s.run; })(); 1'); } };
  /* APARÊNCIA (js/p_look.js): o destaque animado (plDraw) e a grade parada (plStills) desenham o pet, por último */
  const lookCase = (tag, mounted) => { const mk = live => { const cv = G.mkCanvas(false); cv.__tap = true; cv.width = cv.height = 440; cv.dataset.plsk = 'default'; if (live) { cv.dataset.live = '1'; cv.dataset.mounted = mounted ? '1' : '0'; } return cv; };
    const run = (cv, fn) => { const L = [], q0 = G.document.querySelectorAll; G.document.querySelectorAll = sel => (/data-live\]$/.test(sel) && !/not/.test(sel)) === !!cv.dataset.live ? [cv] : []; G.setDrawTap(s => L.push(s));
      try { G.inCtx(() => ev(fn)); } catch (e) { errs.push(fn + ': ' + errStr(e)); } G.setDrawTap(null); G.document.querySelectorAll = q0; try { G.inCtx(() => ev('plStop(); if(XLK.tm){ clearTimeout(XLK.tm); XLK.tm=0; } 1')); } catch (e) {} return L; };
    ev('XLK.err=0; XLK.t0=0; 1'); const L = run(mk(true), 'plDraw(1000)'); order(tag + ' APARÊNCIA destaque' + (mounted ? ' montado' : ' a pé'), L, [mounted ? 'mount' : 'hero'], ['hero', 'wing', 'weapon']);
    if (!mounted) { check(tag + ' APARÊNCIA destaque a pé: nenhuma folha de montaria', last(L, RE.mount) < 0, 'montaria em ' + last(L, RE.mount)); const g = run(mk(false), 'XLK.n=0; plStills()'); order(tag + ' APARÊNCIA grade (quadro parado)', g, ['hero'], ['wing', 'weapon']); }
    check(tag + ' APARÊNCIA: desenho sem erro', ev('!XLK.err')); };

  /* DERROTA, caixas (pedido do QA): o pet não cruza a arma caída nem o herói deitado. Eras 0, 2 e 3 (clava, espada, pistola) × pet de estágio 1 e 3 × Kael e Kaia.
     Só contas (dieClear / petDieX / petMetric), sem desenhar; no node a caixa do corpo vem do padrão DIE_BODY e a do pet do padrão do petMetric (o canvas falso
     não devolve pixels); a arma vem do tamanho real do PNG. */
  const dieBoxes = async () => { ev("window.__pfD={h:S.hero,ws:HM.ws,x:HM.x,d:B.deadT,m:HM.mount,stg:Sys.pet.ensure(S).owned[Sys.pet.ensure(S).eq].stg}; HM.mount=null; HM.x=HX; 1");
    try { for (const hero of ['kael', 'kaia']) { ev("Sys.appearance.setHero(S,'" + hero + "'); formRefresh(); 1"); const okS = await until(() => ev("formRefresh().hero==='" + hero + "'&&dieSheet().ok&&dieSheet().base.indexOf('" + hero + "_die')>=0"), 500); check('caixas ' + hero + ': folha da morte carregada', okS, ev('dieSheet().base'));
        for (const era of [0, 2, 3]) { const okW = await until(() => ev('!!SPR(wPng({e:' + era + ',r:0}),"weapon")'), 200); check('caixas ' + hero + ' era ' + era + ': arma carregada', okW);
          for (const stg of [0, 2]) { ev('(function(){ const o=Sys.pet.ensure(S); o.owned[o.eq].stg=' + stg + '; PETK.infoT=0; })(); 1'); await until(() => ev('(function(){ PETK.infoT=0; const I=petInfo(); return !!I&&(I.stage|0)===' + (stg + 1) + '&&petReady(PETK.base); })()'), 400);
            const b = ev('(function(){ HM.ws={e:' + era + ',r:0}; HM.x=HX; B.deadT=0.8; const c=dieClear(HM), m=petMetric(PETK.base)||{l:70,r:70}, k=petK(), p=petPos(); return {st:PETK.info&&PETK.info.stage, x:+p.x.toFixed(1), pl:+(p.x-m.l*k).toFixed(1), pr:+(p.x+m.r*k).toFixed(1), l:+c.l.toFixed(1), r:+c.r.toFixed(1), wl:c.wl==null?null:+c.wl.toFixed(1), wr:c.wr==null?null:+c.wr.toFixed(1), gy:p.gy, GY:GY, LW:LW}; })()');
            const tag = 'caixas ' + hero + ' · era ' + era + ' · pet estágio ' + (stg + 1);
            check(tag + ': pet não cruza a arma caída', b.wl != null && (b.pl >= b.wr || b.pr <= b.wl), JSON.stringify(b));
            check(tag + ': pet não cruza o herói deitado, fica na tela, pés no chão', (b.pl >= b.r || b.pr <= b.l) && b.pl >= 0 && b.pr <= b.LW && b.gy >= b.GY, JSON.stringify(b)); } } }
    } finally { ev("(function(){ const o=window.__pfD; S.hero=o.h; formRefresh(); HM.ws=o.ws; HM.x=o.x; B.deadT=o.d; HM.mount=o.m; const p=Sys.pet.ensure(S); p.owned[p.eq].stg=o.stg; PETK.infoT=0; })(); 1");
      await until(() => ev("(function(){ PETK.infoT=0; return formRefresh().hero==='kael'&&!!petInfo()&&petReady(PETK.base)&&fullReady(HM); })()"), 500); check('caixas: herói devolvido (Kael)', ev("heroForm().hero==='kael'")); } };

  /* GANCHOS DE DEBUG DO QA (window.dbgDieAt / dbgHatchAt / dbgLvUp; só com ?debug=1, que é como este teste carrega o jogo) */
  const dbgCase = async tag => { const sev = ev("window.__pfG={r:B.res,d:B.deadT,db:B.deadBoss,run:B.running,p:B.paused}; B.res=null; B.paused=false; view='battle'; HATCH.q.length=0; HATCH.cur=null; 1");
    try {
      check(tag + ' debug: os três ganchos existem', ev("typeof window.dbgDieAt==='function'&&typeof window.dbgHatchAt==='function'&&typeof window.dbgLvUp==='function'"));
      const mounted = ev('!!HM.mount'), a0 = ev('petX()');
      let r = ev('dbgDieAt(0.2)'); for (let i = 0; i < 12; i++) await tick(); let L = battleList(); const mid = ev('({d:B.deadT, res:!!B.res, x:petPos().x, to:petDieX(), hp:B.hero&&B.hero.hp})');
      check(tag + ' debug dbgDieAt(0,2): fica congelado (12 quadros depois: mesma queda, sem resultado, fase não recomeça)', Math.abs(mid.d - 1.4) < 0.06 && !mid.res && L.some(s => /_die_body/.test(s)), JSON.stringify(mid) + ' · ' + JSON.stringify(r));
      check(tag + ' debug dbgDieAt(0,2): pet no MEIO do deslize, desenhado depois do herói caído', (mid.x - a0) * (mid.to - mid.x) > 0 && first(L, RE.pet) > L.findIndex(s => /_die_body/.test(s)), 'de ' + a0.toFixed(1) + ' · agora ' + mid.x.toFixed(1) + ' · destino ' + mid.to.toFixed(1));
      if (mounted) check(tag + ' debug dbgDieAt(0,2): montaria no fade cruzado (imagem parada + folha montada parada), antes do herói caído', r.montaria === 'still' && first(L, RE.ref) >= 0 && L.some(s => /_idle_body/.test(s) && RE.mount.test(s)) && last(L, RE.ref) < L.findIndex(s => /_die_body/.test(s)), L.filter(s => RE.mount.test(s)).join(', ') || 'nenhuma folha de montaria');
      ev('dbgDieAt(1.6)'); for (let i = 0; i < 6; i++) await tick(); L = battleList(); const end = ev('({d:B.deadT, res:!!B.res, x:petPos().x, to:petDieX()})');
      check(tag + ' debug dbgDieAt(1,6): fim da queda parado (montaria parada atrás, sem folha montada, pet no destino, sem resultado)', last(L, RE.mount) < 0 && (!mounted || first(L, RE.ref) >= 0) && Math.abs(end.x - end.to) < 0.01 && end.d > 0 && !end.res, JSON.stringify(end));
      ev('dbgDieAt(null)'); check(tag + ' debug dbgDieAt(null): solta (herói de pé, vida cheia)', ev('B.deadT===0&&DBGFX.die===null&&(!B.hero||B.hero.hp===B.hero.maxhp)'));
      const other = ev("(function(){ const sp=Sys.pet.DATA.v17.species||{}, me=PETK.info.id; for(const k in sp) if(k!==me&&sp[k]&&sp[k].sprite) return {pet:k,sprite:sp[k].sprite}; return null; })()");
      check(tag + ' debug dbgHatchAt(): sem id devolve a lista de ids', ev('(function(){ const r=dbgHatchAt(); return !!r.erro&&Array.isArray(r.ids)&&r.ids.length>0&&!HATCH.cur; })()'));
      r = ev("dbgHatchAt('" + other.pet + "',2,1)"); await until(() => ev('!!HATCH.egg&&HATCH.egg.complete'), 60); for (let i = 0; i < 12; i++) await tick(); L = battleList();
      check(tag + ' debug dbgHatchAt(pet,2,1): ovo parado no instante 1 s, no lugar escolhido, pet equipado desenhado', ev('!!HATCH.cur&&Math.abs(B.at-HATCH.cur.t0-1)<0.06&&HATCH.cur.r===2') && first(L, RE.egg) >= 0 && L.some(s => RE.pet.test(s) && s.includes(ev('PETK.base'))), JSON.stringify(r));
      ev("dbgHatchAt('" + other.pet + "',2,4)"); await until(() => ev("sheetLoad(PET_DIR+'" + other.sprite + "_idle',true).ok"), 200); for (let i = 0; i < 4; i++) await tick(); L = battleList();
      check(tag + ' debug dbgHatchAt(pet,2,4): recém-nascido no lugar final (sem ovo), pet equipado desenhado', first(L, RE.egg) < 0 && L.some(s => RE.pet.test(s) && s.includes(other.sprite)) && L.some(s => RE.pet.test(s) && s.includes(ev('PETK.base'))), L.filter(s => RE.pet.test(s)).join(', '));
      ev('dbgHatchAt(null)'); check(tag + ' debug dbgHatchAt(null): solta', ev('!HATCH.cur&&!HATCH.q.length&&DBGFX.hatch===null'));
      r = ev('dbgLvUp(0.5)'); for (let i = 0; i < 12; i++) await tick(); battleList();
      check(tag + ' debug dbgLvUp(0,5): letreiro disparado e parado em 0,5 s', ev('!!B.lvfx&&Math.abs(B.at-B.lvfx.t0-0.5)<0.06'), JSON.stringify(r) + ' · ' + ev('B.lvfx?B.at-B.lvfx.t0:null'));
      ev('dbgLvUp(null)'); check(tag + ' debug dbgLvUp(null): solta', ev('DBGFX.lv===null'));
      /* dbgWing / dbgMount */
      { const w0 = ev('S.eq.wing'), m0 = ev('HM.mount&&HM.mount.id'), s0 = ev('(function(){ try{ const o=Sys.mount.ensure(S); return o.owned[o.eq].stars|0; }catch(e){ return 1; } })()');
        check(tag + ' debug: dbgWing e dbgMount existem', ev("typeof window.dbgWing==='function'&&typeof window.dbgMount==='function'"));
        let q = ev('dbgWing()'); check(tag + ' debug dbgWing(): lista os ids e a asa equipada', Array.isArray(q.ids) && q.ids.includes('angel') && q.ids.includes('demon') && q.equipada === 'angel', JSON.stringify(q));
        q = ev("dbgWing('demon')"); await until(() => ev("(function(){ draw(); return HM.wing==='demon'; })()"), 200); check(tag + " debug dbgWing('demon'): item de asa equipado e o herói passa a desenhar a asa demoníaca", q.equipada === 'demon' && ev("HM.wing==='demon'&&itemOf(S.eq.wing).slot==='wing'"), JSON.stringify(q) + ' · HM.wing=' + ev('HM.wing'));
        const n1 = ev('S.inv.length'); ev("dbgWing('demon')"); check(tag + ' debug dbgWing repetido: reusa o item (não enche a mochila)', ev('S.inv.length') === n1);
        q = ev('dbgWing(null)'); await until(() => ev('(function(){ draw(); return !HM.wing; })()'), 200); check(tag + ' debug dbgWing(null): tira a asa', q.semAsa === true && ev('S.eq.wing==null&&!HM.wing'), 'HM.wing=' + ev('HM.wing'));
        ev("dbgWing('angel'); S.eq.wing=" + JSON.stringify(w0) + "; statsChanged(); 1"); await until(() => ev("(function(){ draw(); return HM.wing==='angel'&&wingReady('angel'); })()"), 200);
        q = ev('dbgMount()'); check(tag + ' debug dbgMount(): lista os ids da tabela', Array.isArray(q.ids) && q.ids.length === ev('Object.keys(MOUNT_TBL).length'), JSON.stringify(q));
        q = ev("dbgMount('" + m0 + "', 5)"); check(tag + ' debug dbgMount(id, 5): montado com 5 estrelas e diz o estado da imagem parada', q.estrelas === 5 && q.montado === true && ['ok', 'carregando'].includes(q.imagemParada) && ev('mountLook().stars') === 5, JSON.stringify(q));
        q = ev('dbgMount(null)'); check(tag + ' debug dbgMount(null): desmonta', q.desmontado === true && ev('!mountLook()'));
        ev("dbgMount('" + m0 + "', " + s0 + ")"); await until(() => ev('(function(){ draw(); return !!HM.mount&&mountReady(HM.mount.id)&&fullReady(HM); })()'), 300); check(tag + ' debug: montaria e asa devolvidas', ev("!!HM.mount&&HM.mount.id==='" + m0 + "'&&HM.wing==='angel'"), ev('JSON.stringify({m:HM.mount&&HM.mount.id,w:HM.wing})')); } r = ev('dbgLvUp()'); check(tag + ' debug dbgLvUp(): dispara como numa subida real (efeito + faixa "Nível N!")', ev('!!B.lvfx&&!!B.banner&&/^Nível /.test(B.banner.txt)&&DBGFX.lv===null'), JSON.stringify(r));
    } finally { ev('(function(){ try{ dbgDieAt(null); dbgHatchAt(null); dbgLvUp(null); }catch(e){} const s=window.__pfG; B.lvfx=null; B.banner=null; B.res=s.r; B.deadT=s.d; B.deadBoss=s.db; B.running=s.run; B.paused=s.p; })(); 1'); } };

  /* ASA NA MORTE (PO): a asa-item acompanha o corpo caindo e deitado, pela âncora "back" da folha da morte em uso */
  const wingDie = async () => { ev("window.__pfW={h:S.hero,wing:S.eq.wing,d:B.deadT,db:B.deadBoss,r:B.res,run:B.running}; B.res=null; B.running=false; 1");
    const setLook = async (hero, skin, dir) => { ev("(function(){ const A=Sys.appearance; A.setHero(S,'" + hero + "'); " + (skin ? "try{ A.grantFixed(S,'" + skin + "',{owner:true}); }catch(e){} A.equipFixed(S,'" + skin + "');" : 'A.equipFixed(S,null);') + ' formRefresh(); B.deadT=0; })(); 1');
      return until(() => ev("(function(){ const F=formRefresh(); return F.hero==='" + hero + "'&&(F.skin||null)===" + (skin ? "'" + skin + "'" : 'null') + "&&dieSheet().ok&&dieSheet().base.indexOf('" + dir + "')>=0&&fullReady(HM)&&(!HM.wing||wingReady(HM.wing)); })()"), 600); };
    const frame = fi => { ev('B.deadT=' + (1.6 - (fi + 0.5) / 12) + '; 1'); const L = battleList(), d = L.findIndex(s => /_die_body/.test(s)); return { n: L.filter(s => RE.wing.test(s)).length, before: d >= 0 && last(L, RE.wing) < d, die: d >= 0 }; };
    try {
      for (const [nm, hero, skin, dir] of [['Kael padrão', 'kael', null, 'hyb/R/'], ['Kaia padrão', 'kaia', null, 'hyb/kaia/'], ['skin Kael Ninja', 'kael', 'kael_ninja', 'skins/kael_ninja/'], ['skin Kaia Arlequina', 'kaia', 'kaia_harlequin', 'skins/kaia_harlequin/']]) {
        const ok = await setLook(hero, skin, dir); check('asa na morte · ' + nm + ': herói/skin em cena com a folha da morte ' + dir, ok, ev('dieSheet().base') + ' · ' + JSON.stringify(ev('heroForm()')));
        check('asa na morte · ' + nm + ': a folha em uso tem âncora para todos os quadros (dieWingOk)', ev('dieWingOk(dieSheet())&&HM.wing==="angel"'), ev('dieSheet().base') + ' · asa ' + ev('HM.wing'));
        const bad = []; for (let fi = 0; fi < 18; fi++) { const f = frame(fi); if (!(f.die && f.n === 2 && f.before)) bad.push(fi + ':' + JSON.stringify(f)); }
        check('asa na morte · ' + nm + ': asa (par E/D, uma só) desenhada ANTES do corpo nos 18 quadros da queda', !bad.length, bad.join(' '));
        const c = ev('(function(){ const c=wingDieClip(HM); return {y:c.y, b:c.y+c.h, x:c.x, r:c.x+c.w, gy:HM.gy, GY:GY, LW:LW}; })()');
        check('asa na morte · ' + nm + ': recorte termina exatamente na linha do chão (nada da asa abaixo) e cobre a tela toda', c.b === c.gy && c.gy === c.GY && c.x <= 0 && c.r >= c.LW && c.y <= 0, JSON.stringify(c)); }
      /* nunca asa dupla */
      let ok = await setLook('kael', 'kael_angel', 'skins/kael_angel_nowing/'); let f = frame(17);
      check('asa na morte · Kael Anjo COM item de asa: corpo sem asa (regra do dono: skin nunca tem asa no corpo) + asa do item, uma só', ok && f.die && f.n === 2 && f.before, ev('dieSheet().base') + ' · ' + JSON.stringify(f));
      ev('S.eq.wing=null; statsChanged(); 1'); ok = await setLook('kael', 'kael_angel', 'skins/kael_angel_nowing/'); await until(() => ev('!HM.wing'), 60); f = frame(17);
      check('asa na morte · Kael Anjo SEM item de asa: a MESMA pasta sem asa e nenhuma asa desenhada', ok && f.die && f.n === 0 && /kael_angel_nowing\//.test(ev('dieSheet().base')), ev('dieSheet().base') + ' · ' + JSON.stringify(f));
      ev('S.eq.wing=window.__pfW.wing; statsChanged(); 1'); ok = await setLook('kaia', 'kaia_angel', 'skins/kaia_angel/'); await until(() => ev('HM.wing==="angel"'), 60); f = frame(17);
      check('asa na morte · Kaia Angelical (sem asa pintada, Arte 4a92ee6) com item de asa: UM par, o do item', ok && f.die && f.n === 2 && ev('dieWingOk(dieSheet())'), ev('dieSheet().base') + ' · ' + JSON.stringify(f));
      /* folha sem âncora regravada: sem asa, como antes */
      { const kn = ev("(function(){ const A=Sys.appearance; A.setHero(S,'kael'); try{ A.grantFixed(S,'kael_knight',{owner:true}); }catch(e){} const r=A.equipFixed(S,'kael_knight'); return {ok:!!(r&&r.ok), reason:r&&r.reason, off:['assets/anim/hyb/phase1/kael_die_body','assets/anim/hyb/phase2/kael_die_body','assets/anim/hyb/phase3/kael_die_body','assets/anim/hyb/kaia_phase2/kaia_die_body','assets/anim/hyb/kaia_phase3/kaia_die_body'].every(b=>DIE_WING_OFF.test(b)), on:!DIE_WING_OFF.test('assets/anim/hyb/R/kael_die_body')&&!DIE_WING_OFF.test('assets/anim/skins/kael_angel_nowing/kael_die_body')}; })()");
        check('asa na morte · folhas das pastas de FASE (âncora não regravada) ficam sem asa; as regravadas não', kn.off && kn.on, JSON.stringify(kn));
        if (kn.ok) { ok = await setLook('kael', 'kael_knight', 'phase2/'); f = frame(17); check('asa na morte · Kael Cavaleiro (pasta de fase): sem asa na morte', ok && f.die && f.n === 0, ev('dieSheet().base') + ' · ' + JSON.stringify(f)); }
        else console.log('  nota  Kael Cavaleiro não equipa (' + kn.reason + '): as pastas de fase não têm skin em uso hoje'); }
      ok = await setLook('kael', null, 'hyb/R/'); ev('(function(){ const s=dieSheet(); window.__pfB=s.meta.back[5].ok; s.meta.back[5].ok=false; delete s._dw; })(); 1'); f = frame(17);
      check('asa na morte · folha com um quadro ok:false: sem asa na morte', ok && f.die && f.n === 0, JSON.stringify(f));
      ev('(function(){ const s=dieSheet(); s.meta.back[5].ok=window.__pfB; delete s._dw; })(); 1'); f = frame(17); check('asa na morte · âncora devolvida: a asa volta', f.n === 2, JSON.stringify(f));
      /* quais folhas da morte ficam de fora (lista para a Arte) */
      { const fsn = require('fs'), pth = require('path'), out = [], inn = []; const walk = d => { for (const e of fsn.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('_') || e.name === 'enemy' || e.name === 'masks') continue; const p = pth.join(d, e.name); if (e.isDirectory()) walk(p); else if (/_die_body\.json$/.test(e.name)) { const j = JSON.parse(fsn.readFileSync(p, 'utf8')), rel = pth.relative(G.ROOT, p).replace(/\\/g, '/').replace(/\.json$/, ''); const okA = Array.isArray(j.back) && j.back.length >= j.frames && j.back.every(b => b && b.ok === true); (okA && !ev('DIE_WING_OFF.test(' + JSON.stringify(rel) + ')') ? inn : out).push(rel.replace('assets/anim/', '')); } } };
        walk(pth.join(G.ROOT, 'assets/anim/hyb')); walk(pth.join(G.ROOT, 'assets/anim/skins'));
        check('asa na morte · folhas COM asa: Kael, Kaia e as skins de assets/anim/skins sem asa própria (' + inn.length + ')', inn.includes('hyb/R/kael_die_body') && inn.includes('hyb/kaia/kaia_die_body') && inn.length >= 11, inn.join(', '));
        console.log('  nota  folhas da morte SEM asa (fase não regravada ou asa própria): ' + out.join(', ')); }
    } finally { ev("(function(){ const o=window.__pfW; try{ const A=Sys.appearance; A.setHero(S,'kaia'); A.equipFixed(S,null); A.setHero(S,'kael'); A.equipFixed(S,null); }catch(e){} S.hero=o.h; S.eq.wing=o.wing; statsChanged(); formRefresh(); B.deadT=o.d; B.deadBoss=o.db; B.res=o.r; B.running=o.run; })(); 1");
      const back = await until(() => ev("(function(){ PETK.infoT=0; const F=formRefresh(); return F.hero==='kael'&&!F.skin&&HM.wing==='angel'&&wingReady('angel')&&!!petInfo()&&petReady(PETK.base)&&fullReady(HM); })()"), 600); check('asa na morte: herói, skin e asa devolvidos', back, JSON.stringify(ev('heroForm()'))); } };

  /* preparo: sem a entrada, batalha parada num quadro calmo, pet + asa equipados */
  await until(() => ev("typeof PI!=='undefined'&&!!PI.el"), 40); try { if (ev("typeof PI!=='undefined'&&!!PI.el")) G.inCtx(() => ev('PI.finish()')); } catch (e) {}
  const pet = ev(`(function(){ S.tut=99; S.welcome=true; const L=Sys.level.ensure(S); L.lvl=50; L.xp=0; S.stage=3; S.best=12; S.wave=1; S.farm=false;
    Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); const o=Sys.pet.ensure(S);
    for(const p of Sys.pet.DATA.pets){ o.owned={}; o.owned[p.id]={stars:1,lvl:1}; o.eq=p.id; Sys.pet.ensure(S); const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base&&!i.draw.fly) return {id:p.id, base:i.draw.base}; }
    return {id:null}; })()`);
  check('pet de chão equipado: ' + pet.id + ' (' + pet.base + ')', !!pet.id);
  ev(`(function(){ addItemToBag({slot:'wing',r:3,e:0,wing:'angel'}); const it=S.inv.filter(x=>x.slot==='wing').pop(); if(it) S.eq.wing=it.id; statsChanged(); refreshHero();
    B.paused=false; B.res=null; view='battle'; startBattle(); HATCH.q.length=0; HATCH.cur=null; PETK.infoT=0; return 1; })()`);

  /* ---------- 2. SEM montaria ---------- */
  const noMount = ev("(function(){ try{ const o=Sys.mount.ensure(S); o.eq=null; }catch(e){} return !heroLook().mount; })()");
  check('sem montaria equipada', noMount);
  await until(() => ev("(function(){ HATCH.q.length=0; HATCH.cur=null; return !!petInfo()&&petReady(PETK.base)&&!HM.mount&&HM.wing==='angel'&&wingReady('angel')&&fullReady(HM); })()"), 400);
  await until(() => fullList({ t: 0.3 }).ret === true, 400);   /* o drawHeroFull devolve false enquanto uma folha pedida ainda carrega */
  { const L = battleList(); order('batalha SEM montaria', L, ['hero'], ['wing', 'weapon']); if (VERBOSE) console.log('    ' + L.filter(s => Object.values(RE).some(r => r.test(s))).join('\n    '));
    const f = fullList({ t: 0.3 }); check('drawHeroFull SEM montaria: desenhou (true)', f.ret === true, 'devolveu ' + f.ret); order('drawHeroFull SEM montaria', f.L, ['hero'], ['wing', 'weapon']);
    check('drawHeroFull SEM montaria: pet à frente e não acima do chão', !!f.pos && f.pos.dx > 0 && f.pos.dy >= 0 && f.pos.mo === false, JSON.stringify(f.pos)); }
  const foot = fullList({ t: 0.3 }).pos;
  await resCase('SEM montaria', ['hero']);
  await hatchCase('SEM montaria'); lookCase('SEM montaria', false);
  await dieBoxes();
  await wingDie();

  /* ---------- 1. COM montaria ---------- */
  const mt = ev(`(function(){ Sys.mount.DATA.on=true; Sys.mount.DATA.visual=true; const ids=Object.keys(MOUNT_TBL), id=ids.includes('wolf')?'wolf':ids[0]; Sys.mount.add(S,Sys.host,id); const e=Sys.mount.equip(S,id); const lk=mountLook(); return {id, e:!!e, look:lk&&lk.id}; })()`);
  check('montaria equipada: ' + mt.id, mt.e && mt.look === mt.id, JSON.stringify(mt));
  await until(() => ev("(function(){ HATCH.q.length=0; HATCH.cur=null; return !!petInfo()&&petReady(PETK.base)&&!!HM.mount&&mountReady(HM.mount.id)&&fullReady(HM); })()"), 400);
  check('batalha COM montaria: herói montado pronto para o desenho', ev('(function(){ draw(); return !!HM.mount&&!!mountPrefix(HM.mount.id)&&mountReady(HM.mount.id)&&HM.deadP<0; })()'), ev('JSON.stringify({m:HM.mount,pre:HM.mount&&mountPrefix(HM.mount.id),rdy:HM.mount&&mountReady(HM.mount.id),hero:S.hero,F:heroForm(),dead:HM.deadP,deadT:B.deadT,res:!!B.res,evo:typeof evoHidesHero==="function"&&evoHidesHero()})'));
  { const L = battleList(); order('batalha COM montaria', L, ['mount'], ['hero', 'wing', 'weapon']); if (VERBOSE) console.log('    ' + L.filter(s => Object.values(RE).some(r => r.test(s))).join('\n    '));
    const f = fullList({ t: 0.3 }); check('drawHeroFull COM montaria: desenhou (true)', f.ret === true, 'devolveu ' + f.ret); order('drawHeroFull COM montaria', f.L, ['mount'], ['hero', 'wing', 'weapon']);
    check('drawHeroFull COM montaria: pet mais à frente e mais abaixo que a pé', !!f.pos && !!foot && f.pos.mo === true && f.pos.dx > foot.dx && f.pos.dy > foot.dy, 'montado ' + JSON.stringify(f.pos) + ' · a pé ' + JSON.stringify(foot));
    /* a posição do pet segue a montaria DESTE desenho, não a da batalha */
    const g = fullList({ t: 0.3, mount: false }); order('drawHeroFull {mount:false} com a batalha montada', g.L, ['hero'], ['wing', 'weapon']);
    check('drawHeroFull {mount:false} com a batalha montada: pet na posição A PÉ', !!g.pos && !!foot && g.pos.mo === false && Math.abs(g.pos.dx - foot.dx) < 0.01, JSON.stringify(g.pos) + ' · a pé ' + JSON.stringify(foot));
    check('drawHeroFull {mount:false}: nenhuma folha de montaria', last(g.L, RE.mount) < 0, 'montaria em ' + last(g.L, RE.mount));
    const hm = ev('HM.mount&&HM.mount.id'); check('HM.mount da batalha intacto depois do drawHeroFull', hm === mt.id, 'HM.mount=' + hm);
    const h = (() => { ev('window.__pfM=HM.mount; HM.mount=null; 1'); try { return fullList({ t: 0.3 }); } finally { ev('HM.mount=window.__pfM; 1'); } })();
    check('drawHeroFull montado com a batalha A PÉ: pet na posição MONTADA', !!h.pos && h.pos.mo === true && Math.abs(h.pos.dx - f.pos.dx) < 0.01, JSON.stringify(h.pos) + ' · montado ' + JSON.stringify(f.pos)); }
  await resCase('COM montaria', ['mount']);
  await hatchCase('COM montaria'); lookCase('COM montaria', false); lookCase('COM montaria', true);
  await dbgCase('COM montaria');
  check('nenhuma exceção no desenho', !errs.length && !ev('!!window.__hfErr'), errs.slice(0, 4).join(' | '));
  console.log(fail ? '\n' + fail + ' FALHA(S) de ' + n + ' (pet na frente)' : '\nPET NA FRENTE OK (' + n + ' verificações): batalha, Vitória, Derrota (pet à frente, montaria fica parada respirando), chocagem de ovo, Aparência e drawHeroFull, com e sem montaria');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
