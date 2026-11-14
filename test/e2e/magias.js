'use strict';
/* MAGIAS DO GRIMÓRIO NA LUTA (Sys.grimoire → js/battle.js: grimSync, grimStep, grimCast, heroGuard) e a COLUNA DE ÍCONES (js/grimhud.js).
   Sem navegador: node test/e2e/magias.js
   Sobe o jogo de verdade no sandbox, aprende magias pelo próprio módulo (addPages/setPreset) e confere: chave desligada = nada; o conjunto do modo entra com a
   recarga do módulo; o relógio anda com a luta; a magia lança SOZINHA quando zera e há inimigo em alcance (e espera se não há); aplica o que o cast do módulo
   devolve (dano por golpe e por alvo, área dividida, atordoar, cura, escudo que absorve, esquiva e velocidade de ataque temporárias); respeita a recarga;
   onda do chefe usa o conjunto Chefe; Provação "sem magias" não lança; a coluna de ícones lê os relógios. Só lê arquivos do jogo. Código 1 se falhar. */
const vm = require('vm');
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  /* o JOGO liga o Grimório no arranque (SYS_LIVE, js/farm.js); "?debug=1&sem=grimoire" sobe sem ele, para provar o "desligado = como antes" */
  { const G0 = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    check('sem parâmetro o Grimório nasce LIGADO (SYS_LIVE do jogo)', G0.ev('!!(Sys.grimoire&&Sys.grimoire.DATA)&&Sys.grimoire.DATA.on===true')); }
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1&sem=grimoire' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const J =code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  if (ev("typeof GrimHud==='undefined'")) vm.runInContext(G.rd('js/grimhud.js'), G.sandbox, { filename: 'js/grimhud.js' });   /* enquanto o arquivo não entra na lista do index.html */
  ev(`(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; Math.random=()=>0.5; window.__rng=0.999; Sys.host.rng=()=>window.__rng;
    window.__mk=function(k,kind){ const L=[]; for(let i=0;i<(k||1);i++){ const e=mkEnemy(S.stage,kind||'e0'); e.maxhp=e.hp=1e7; e.dmg=5; e.atkT=99; L.push(e); } B.en=L; B.toSpawn=[]; B.eshots=[]; placeNow(); B.fx.length=0; B.banner=null; B.hero.hp=B.hero.maxhp; B.deadT=0; B.act=null; return L; };
    window.__set=function(mode,ids){ const Gm=Sys.grimoire; for(const id of ids) if(!Gm.owned(S,id)) Gm.addPages(S,id,1,'test'); const r=Gm.setPreset(S,mode,ids); grimSync(); return r&&r.ok; };
    window.__run=function(sec){ const k=Math.round(sec*30); for(let i=0;i<k;i++) grimStep(1/30); }; return 1; })()`);
  /* ---------- 1) desligado ---------- */
  check('módulo carregado e chave DESLIGADA com &sem=grimoire', ev('!!(Sys.grimoire&&Sys.grimoire.DATA)&&Sys.grimoire.DATA.on===false'));
  { const r = J(`startBattle(); B.sysT=0; for(let i=0;i<90;i++) step(1/30); return {grim:B.grim,list:GrimBattle.list(),on:GrimBattle.on(),banner:B.banner&&B.banner.txt};`);
    check('desligado: sem estado de magia, sem lista para a coluna', r.grim === null && r.list === null && r.on === false, JSON.stringify(r)); }
  /* ---------- 2) conjunto e relógio ---------- */
  ev('Sys.grimoire.setOn(true); 1');
  { const ok = ev("__set('fases',['minotaurSpear','ancestralFire','bronzePhalanx'])"), r = J(`const L=Sys.grimoire.loadout(S,'fases'); return {mode:B.grim.mode,list:B.grim.list,cds:L.map(x=>x.cd),ids:L.map(x=>x.id)};`);
    check('conjunto Fases do módulo vira os relógios da luta (até 3), cada um com a recarga CHEIA do módulo', ok && r.mode === 'fases' && r.list.length === 3 && r.list.every((s, i) => s.id === r.ids[i] && s.cd === r.cds[i] && s.left === r.cds[i]), JSON.stringify(r));
    const c = J(`__mk(1); const l0=B.grim.list.map(s=>s.left); B.sysT=5; for(let i=0;i<60;i++) step(1/30); return {l0,l1:B.grim.list.map(s=>s.left),casts:B.grim.casts};`);
    check('o relógio anda com a luta (2 s de jogo = 2 s a menos) e nada lança antes de zerar', c.casts === 0 && c.l0.every((v, i) => Math.abs(v - c.l1[i] - 2) < 1e-6), JSON.stringify(c)); }
  /* ---------- 3) dano num alvo: lança sozinha, aplica e respeita a recarga ---------- */
  { const r = J(`const e=__mk(1)[0], s=B.grim.list[0]; const want=Sys.grimoire.cast(S,s.id,{atk:B.hero.atk,hpMax:B.hero.maxhp,boss:false,pvp:false,targets:1}); B.grim.casts=0; B.grim.q.length=0; B.grim.gapT=0;
      B.en=[]; s.left=0.05; __run(0.5); const waited=B.grim.casts===0&&s.left<=0; B.en=[e]; __run(1); const d=1e7-e.hp, c1=B.grim.casts, left=s.left, ban=B.banner?{txt:B.banner.txt,col:B.banner.col,small:B.banner.small}:null, num=B.fx.some(f=>f.txt===fmt(want.hits[0])&&f.col===want.color);
      __run(3); return {want,waited,d,c1,c2:B.grim.casts,left,cd:s.cd,ban,num};`);
    check('magia zerada SEM inimigo em alcance espera (não lança no vazio)', r.waited, JSON.stringify(r));
    check('com inimigo em alcance lança sozinha: dano = o do cast do módulo', r.c1 === 1 && Math.abs(r.d - r.want.dmg) <= 1 && r.want.dmg > 0, JSON.stringify(r));
    check('faixa curta com o nome e a cor do módulo; número do dano na cor da magia', !!r.ban && r.ban.txt === r.want.label && r.ban.col === r.want.color && r.ban.small === true && r.num, JSON.stringify(r));
    check('recarga respeitada: volta para a recarga do módulo e não lança de novo antes', r.c2 === 1 && Math.abs(r.left - (r.want.cd - (1 - 0.05))) < 0.1 && r.cd === r.want.cd, JSON.stringify(r)); }
  /* ---------- 4) cura e escudo ---------- */
  { const r = J(`const e=__mk(1)[0], g=B.grim, sH=g.list[1], sS=g.list[2]; const wH=Sys.grimoire.cast(S,sH.id,{atk:B.hero.atk,hpMax:B.hero.maxhp,targets:1}), wS=Sys.grimoire.cast(S,sS.id,{atk:B.hero.atk,hpMax:B.hero.maxhp,targets:1});
      g.gapT=0; B.hero.hp=B.hero.maxhp*0.5; const h0=B.hero.hp; sH.left=0.01; __run(0.2); const heal=B.hero.hp-h0;
      g.gapT=0; sS.left=0.01; __run(0.2); const sh={amt:g.shAmt,t:g.shT}; const hp1=B.hero.hp; B.fx.length=0; const part=Math.min(5,wS.shield.amount/2); heroHit(part,{raw:1}); const afterA={hp:B.hero.hp,amt:g.shAmt,lab:B.fx.some(f=>f.txt==='ESCUDO')};
      heroHit(wS.shield.amount*2,{raw:1}); const afterB={lost:hp1-B.hero.hp,amt:g.shAmt,t:g.shT};
      g.shAmt=10; g.shT=wS.shield.sec; __run(wS.shield.sec+0.2); return {wH:wH.heal,heal,wS:wS.shield,sh,hp1,part,afterA,afterB,exp:{amt:g.shAmt,t:g.shT}};`);
    check('cura = a do cast do módulo', r.wH > 0 && Math.abs(r.heal - r.wH) < 1e-6, JSON.stringify([r.wH, r.heal]));
    check('escudo: quantidade e segundos do módulo', r.sh.amt === r.wS.amount && Math.abs(r.sh.t - r.wS.sec) < 0.25, JSON.stringify(r.sh));
    check('escudo absorve o golpe inteiro (vida não cai) e mostra ESCUDO', r.afterA.hp === r.hp1 && Math.abs(r.afterA.amt - (r.wS.amount - r.part)) < 1e-6 && r.afterA.lab, JSON.stringify(r.afterA));
    check('golpe maior que o escudo: só o que sobra tira vida, e o escudo acaba', Math.abs(r.afterB.lost - (r.wS.amount * 2 - (r.wS.amount - r.part))) < 1e-6 && r.afterB.amt === 0 && r.afterB.t === 0, JSON.stringify(r.afterB));
    check('escudo acaba no tempo do módulo', r.exp.amt === 0 && r.exp.t === 0, JSON.stringify(r.exp)); }
  /* ---------- 5) área dividida, vários golpes, atordoar ---------- */
  { ev("__set('fases',['royalBreath','knightCharge','underChains'])");
    const r = J(`const L=__mk(2), g=B.grim, s=g.list[0]; const w=Sys.grimoire.cast(S,s.id,{atk:B.hero.atk,hpMax:B.hero.maxhp,targets:2}); g.gapT=0; g.casts=0; s.left=0.01; __run(1.5); const d=L.map(e=>1e7-e.hp);
      const e=__mk(1)[0], k=g.list[1], wk=Sys.grimoire.cast(S,k.id,{atk:B.hero.atk,hpMax:B.hero.maxhp,targets:1}); g.gapT=0; k.left=0.01; const t0=B.t; __run(0.1); const st=e.stunT, imm=e.imm, lab=B.fx.some(f=>f.txt===Sys.strikes.DATA.battle.stun);
      const e2=__mk(1)[0]; e2.imm=B.t+50; g.gapT=0; k.left=0.01; __run(0.1); return {w:{hits:w.hits,aoe:w.aoe,targets:w.targets,dmg:w.dmg},d,casts:g.casts,wk:wk.stun,st,immOk:imm>t0+wk.stun,lab,imune:!(e2.stunT>0)};`);
    const per = r.w.hits.reduce((a, b) => a + b, 0);
    check('área: acerta os 2 inimigos, cada um com a soma dos golpes que o módulo já dividiu', r.w.aoe && r.w.targets === 2 && r.d.length === 2 && r.d.every(v => Math.abs(v - per) < 1e-6) && r.w.hits.length === 3, JSON.stringify(r));
    check('atordoar da magia: segundos do módulo, rótulo ATORDOADO e imunidade depois', Math.abs(r.st - r.wk) < 0.11 && r.immOk && r.lab, JSON.stringify(r));
    check('alvo imune (mesma imunidade dos golpes especiais) não é atordoado de novo', r.imune, JSON.stringify(r)); }
  /* ---------- 6) bônus temporários: esquiva e velocidade de ataque ---------- */
  { ev("__set('fases',['ghostFog','steamBoiler'])");
    const r = J(`const e=__mk(1)[0], g=B.grim, a=g.list[0], b=g.list[1]; const wa=Sys.grimoire.cast(S,a.id,{atk:1,hpMax:1,targets:1}), wb=Sys.grimoire.cast(S,b.id,{atk:1,hpMax:1,targets:1}); const as0=B.hero.aspd, iv0=B.hero.ivl;
      g.gapT=0; a.left=0.01; __run(0.1); const dg={t:g.dodgeT,v:g.dodgeV}; __rng=0; const hp0=B.hero.hp; B.fx.length=0; heroHit(10,e); const dodged=hp0===B.hero.hp, lab=B.fx.some(f=>f.txt==='ESQUIVA'); __rng=0.999; heroHit(10,e); const hit=hp0-B.hero.hp>0;
      g.dodgeT=0.05; __run(0.2); __rng=0; B.hero.hp=hp0; heroHit(10,e); const after=hp0-B.hero.hp>0; __rng=0.999;
      g.gapT=0; b.left=0.01; __run(0.1); const as1=B.hero.aspd, iv1=B.hero.ivl, at=g.aspdT; __run(wb.buff.sec+0.2); return {wa:wa.buff,wb:wb.buff,dg,dodged,lab,hit,after,as0,as1,iv0,iv1,at,as2:B.hero.aspd,iv2:B.hero.ivl,unk:g.unk||null};`);
    check('bônus de esquiva: valor e segundos do módulo; com sorte o golpe é esquivado (rótulo ESQUIVA), sem sorte entra', r.wa.key === 'dodge' && r.dg.v === r.wa.val && Math.abs(r.dg.t - r.wa.sec) < 0.11 && r.dodged && r.lab && r.hit, JSON.stringify(r));
    check('bônus de esquiva acaba no tempo', r.after, JSON.stringify(r));
    check('bônus de velocidade de ataque: +' + r.wb.val + ' enquanto dura (básico mais rápido) e volta depois', r.wb.key === 'aspd' && Math.abs(r.as1 - (r.as0 + r.wb.val)) < 1e-9 && r.iv1 < r.iv0 && Math.abs(r.as2 - r.as0) < 1e-9 && Math.abs(r.iv2 - r.iv0) < 1e-9, JSON.stringify(r));
    check('todo bônus do módulo tem efeito na batalha (nenhuma chave desconhecida)', r.unk === null && ev("Sys.grimoire.DATA.spells.filter(s=>s.kind==='buff').every(s=>s.fx.key==='dodge'||s.fx.key==='aspd')"), JSON.stringify(r.unk)); }
  /* ---------- 7) modo Chefe, Provação sem magias, luta inteira ---------- */
  { const r = J(`__set('fases',['minotaurSpear']); __set('chefe',['cannonball']); const w0=S.wave; S.wave=5; grimSync(); const boss={mode:B.grim.mode,ids:B.grim.list.map(s=>s.id)}; S.wave=1; grimSync(); const fas={mode:B.grim.mode,ids:B.grim.list.map(s=>s.id)}; S.wave=w0;
      const i0=B.inst; B.inst={run:{noSpells:true,waves:[[]]},back:{},t:9}; grimSync(); const none=B.grim===null; B.inst=i0; grimSync(); return {boss,fas,none,back:!!B.grim};`);
    check('onda do chefe usa o conjunto Chefe; fora dela, o de Fases', r.boss.mode === 'chefe' && r.boss.ids[0] === 'cannonball' && r.fas.mode === 'fases' && r.fas.ids[0] === 'minotaurSpear', JSON.stringify(r));
    check('Provação "sem magias": nenhuma magia na luta; depois dela voltam', r.none && r.back, JSON.stringify(r));
    let ok = true; try { ev("(function(){ __set('fases',['minotaurSpear','rollingStone','ancestralFire']); startBattle(); for(const s of B.grim.list) s.left=1; for(let i=0;i<900;i++) step(1/30); return 1; })()"); } catch (e) { ok = false; console.log(String(e && e.message)); }
    const t = J(`return {casts:B.grim.casts,kills:S.kills,hp:B.hero.hp,max:B.hero.maxhp,left:B.grim.list.map(s=>s.left),cd:B.grim.list.map(s=>s.cd)};`);
    check('30 s de luta de verdade: as 3 magias lançam sozinhas, sem erro', ok && t.casts >= 3 && t.kills > 0 && isFinite(t.hp) && t.hp <= t.max + 1e-6 && t.left.every((v, i) => v <= t.cd[i] + 1e-6), JSON.stringify(t)); }
  /* ---------- 8) coluna de ícones (js/grimhud.js) ---------- */
  { const host = G.mkStub(); G.sandbox.__host = host;
    const r = J(`const m=GrimHud.mount(__host); const u=GrimHud.update(); const p=GrimHud.peek(); const html=String(GrimHud.state.root.innerHTML||''); return {m,u,shown:p.shown,sig:p.sig,top:p.top,want:GrimHud.topOf(),n:(html.match(/class="grh-s"/g)||[]).length,ico:/<img|<svg|grh-l/.test(html),left:html.indexOf('left:'+GrimHud.POS.left+'px')>=0,ids:B.grim.list.map(s=>s.id).join('|')+'|',emoji:/[\\u{1F300}-\\u{1FAFF}]/u.test(html)};`);
    check('coluna monta e mostra 1 ícone por magia do conjunto, na coluna da esquerda (x ' + ev('GrimHud.POS.left') + ')', r.m && r.u && r.shown && r.n === 3 && r.sig === r.ids && r.ico && r.left && r.top === r.want && !r.emoji, JSON.stringify(r));
    const o = J(`Sys.grimoire.setOn(false); grimSync(); const u=GrimHud.update(); const p=GrimHud.peek(); GrimHud.unmount(); return {grim:B.grim,u,shown:p.shown,html:String(p.sig)};`);
    check('chave desligada: a luta solta as magias e a coluna some', o.grim === null && o.u === false && o.shown === false, JSON.stringify(o)); }
  check('sem console.error do jogo', G.consoleErrs.length === 0, G.consoleErrs.slice(0, 3).join(' | '));
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (magias do Grimório)' : 'MAGIAS DO GRIMÓRIO OK (' + n + ' verificações): lançam sozinhas no relógio, aplicam o cast do módulo, respeitam a recarga; desligado = como hoje');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
