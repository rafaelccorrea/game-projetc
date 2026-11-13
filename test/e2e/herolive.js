'use strict';
/* HERÓI AO VIVO (Engenheiro 15, sem navegador). Rodar: node test/e2e/herolive.js [-v]
   Regra do dono: qualquer mudança no personagem (arma, asa, montaria, pet, skin, herói, retrato) vale NA HORA em todas as telas, sem sair e voltar.
   O jogo guarda o desenho do herói em memórias curtas (aparência 200 ms: LKC; forma/skin 200 ms: FORM; pet 0,5 s do relógio da batalha: PETK; retrato 150 ms + 1 s).
   O aviso único heroChanged() (index.html; o statsChanged chama) vence todas na hora. Este teste carrega o jogo no sandbox (imagens e json lidos do disco), muda o
   personagem pelo caminho das telas (mudança + statsChanged) e lê, NA MESMA HORA (sem andar o relógio), o que o drawHeroFull, a batalha (lookNow/heroForm/petInfo)
   e o retrato (js/avatar.js) desenham. Cada bloco mostra também o que a memória devolvia SEM o aviso (linha "sem aviso": informação, não reprova).
   A regra da arma na batalha (HLK.cur: a arma nova espera a arte e o fim do golpe) NÃO é conferida aqui: é outra regra. Sai com código 1 se algo reprovar. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, total = 0;
const check = (name, ok, err) => { total++; if (!ok) fail++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok ? '' : ' → ' + (err == null ? '' : err))); return !!ok; };
const info = t => { if (VERBOSE) console.log('  ..    ' + t); };

(async () => {
  const loadErr = [];
  const G = boot({ search: '?debug=1&skip=1', draw: true, realFetch: true, add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } }), ev = G.ev, X = G.sandbox;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  /* anda os timers do jogo (imagens) e deixa as Promises (fetch dos json) responderem */
  const pump = async n => { for (let i = 0; i < (n || 20); i++) { G.inCtx(() => G.advance(50)); await new Promise(r => setImmediate(r)); } };
  const until = async (code, max) => { for (let i = 0; i < (max || 80); i++) { let ok = false; try { ok = !!ev(code); } catch (e) { ok = false; } if (ok) return true; await pump(2); } return false; };
  check('aviso único existe: window.heroChanged e o statsChanged chama', ev("typeof heroChanged==='function'&&window.heroChanged===heroChanged&&/heroChanged\\(\\)/.test(String(statsChanged))"), 'heroChanged não definido ou fora do statsChanged');
  ev(`(function(){ S.tut=99; S.welcome=true; S.name='Kael'; S.hero='kael'; const L=Sys.level.ensure(S); L.lvl=70; L.xp=0; S.eraMax=6; S.best=70; B.paused=false; view='battle'; startBattle();
    window.__hl={ full(st){ const cv=document.createElement('canvas'); cv.__tap=true; const r=drawHeroFull(cv.getContext('2d'),195,600,1,st||{}); return {r, src:[...cv.__srcs]}; },
      wk(){ return wKey(wFamLook(lookNow().weapon)); }, hw(){ return HFULL.ws?wKey(HFULL.ws):null; } }; })()`);
  await pump(40);
  check('herói padrão pronto para desenhar (drawHeroFull devolve true)', await until('__hl.full({mount:false,pet:false}).r===true', 120), 'as folhas do Kael não carregaram no sandbox');

  /* ---------------- ARMA ---------------- */
  ev(`(function(){ const mk=(r,e)=>{ const it={slot:'weapon',r,e,lvl:1,gold:0,subs:[],look:e}; it.id=S.nextId++; S.inv.push(it); return it.id; }; window.__wa=mk(0,0); window.__wb=mk(2,2); S.eq.weapon=__wa; statsChanged(); })()`);
  check('arma: clava equipada → drawHeroFull e batalha com era0', ev("__hl.full({mount:false,pet:false}), __hl.hw()==='era0_t0'&&__hl.wk()==='era0_t0'"), ev('__hl.hw()+" / "+__hl.wk()'));
  ev('S.eq.weapon=__wb; statsChanged(); 1');
  check('arma: trocar o item equipado muda na hora (drawHeroFull + lookNow)', ev("__hl.full({mount:false,pet:false}), __hl.hw()===wKey(SKIN('w22'))&&__hl.wk()===wKey(SKIN('w22'))"), ev('__hl.hw()+" / "+__hl.wk()'));
  ev('(function(){ const it=itemOf(__wb); it.e=5; it.look=5; })()');
  info('arma transformada no MESMO item, sem aviso: a batalha via ' + ev('__hl.wk()') + ' (o wFamLook lê o item direto)');
  ev('statsChanged(); 1');
  check('arma: item transformado no mesmo espaço (era/aparência) muda na hora com o aviso', ev("__hl.full({mount:false,pet:false}), __hl.hw()===wKey(SKIN('w52'))&&__hl.wk()===wKey(SKIN('w52'))"), ev('__hl.hw()+" / "+__hl.wk()'));

  /* ---------------- ASA ---------------- */
  ev(`(function(){ const mk=w=>{ const it={slot:'wing',r:3,e:0,lvl:1,gold:0,subs:[],wing:w}; it.id=S.nextId++; S.inv.push(it); return it.id; }; window.__ga=mk('angel'); window.__gd=mk('demon'); S.eq.wing=__ga; statsChanged(); })()`);
  check('asa: anjo equipada aparece no drawHeroFull', ev("__hl.full({mount:false,pet:false}), HFULL.wing===wingNow(heroLook())&&heroLook().wing==='angel'&&lookNow().wing==='angel'"), 'HFULL.wing=' + ev('HFULL.wing') + ' heroLook().wing=' + ev('heroLook().wing'));
  ev('S.eq.wing=__gd; statsChanged(); 1');
  check('asa: trocar a asa muda na hora (drawHeroFull + lookNow)', ev("__hl.full({mount:false,pet:false}), HFULL.wing===wingNow(heroLook())&&lookNow().wing==='demon'"), 'HFULL.wing=' + ev('HFULL.wing') + ' lookNow().wing=' + ev('lookNow().wing'));
  ev('delete S.eq.wing; statsChanged(); 1');
  check('asa: tirar a asa some na hora', ev("__hl.full({mount:false,pet:false}), !HFULL.wing&&!lookNow().wing"), 'HFULL.wing=' + ev('HFULL.wing'));

  /* ---------------- MONTARIA ---------------- */
  const mids = ev("(function(){ Sys.mount.DATA.on=true; Sys.mount.DATA.visual=true; const ids=Object.keys(MOUNT_TBL); for(const id of ids.slice(0,2)) Sys.mount.add(S,Sys.host,id); Sys.mount.equip(S,ids[0]); statsChanged(); return ids.slice(0,2); })()");
  check('montaria: ' + mids[0] + ' equipada → drawHeroFull e batalha montados nela', ev(`__hl.full({pet:false}), HFULL.mount&&HFULL.mount.id==='${mids[0]}'&&lookNow().mount.id==='${mids[0]}'`), 'HFULL.mount=' + ev('JSON.stringify(HFULL.mount)'));
  ev(`Sys.mount.equip(S,'${mids[1]}'); statsChanged(); 1`);
  check('montaria: trocar para ' + mids[1] + ' muda na hora', ev(`__hl.full({pet:false}), HFULL.mount&&HFULL.mount.id==='${mids[1]}'&&lookNow().mount.id==='${mids[1]}'`), 'HFULL.mount=' + ev('JSON.stringify(HFULL.mount)'));
  ev(`Sys.mount.ensure(S).owned['${mids[1]}'].stars=4; statsChanged(); 1`);
  check('montaria: estrelas (aura) mudam na hora', ev('__hl.full({pet:false}), HFULL.mount.stars===4&&lookNow().mount.stars===4'), 'estrelas ' + ev('HFULL.mount&&HFULL.mount.stars'));
  check('montaria: desenhada de verdade quando a folha carrega', await until(`__hl.full({pet:false}).src.some(s=>/anim\\/mounts\\/kael_${mids[1]}_/.test(s))`, 120), 'nenhuma folha de ' + mids[1] + ' no canvas');
  ev('Sys.mount.equip(S,null); statsChanged(); 1');
  check('montaria: desmontar vale na hora (herói a pé)', ev('__hl.full({pet:false}), !HFULL.mount&&!lookNow().mount'), 'HFULL.mount=' + ev('JSON.stringify(HFULL.mount)'));

  /* ---------------- PET ---------------- */
  const pets = ev(`(function(){ Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); const o=Sys.pet.ensure(S), out=[];
    for(const p of Sys.pet.DATA.pets){ o.owned[p.id]={stars:1,lvl:1,frags:0}; o.eq=p.id; Sys.pet.ensure(S); const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base) out.push({id:p.id,base:i.draw.base}); if(out.length>=2) break; }
    Sys.pet.equip(S,out[0].id); statsChanged(); return out; })()`);
  check('pet: dois pets com arte para o teste', pets.length === 2, JSON.stringify(pets));
  if (pets.length === 2) {
    await until(`petReady('${pets[0].base}')&&petReady('${pets[1].base}')`, 120);   /* as duas folhas decodificadas: o pet novo só entra com a arte pronta (regra que fica) */
    check('pet: ' + pets[0].id + ' equipado é o da batalha', await until(`(petInfo()||{draw:{}}).draw.base==='${pets[0].base}'`, 40), 'petInfo=' + ev('JSON.stringify(petInfo()&&petInfo().draw)'));
    ev(`Sys.pet.equip(S,'${pets[1].id}'); 1`);
    info('pet trocado sem aviso: a batalha ainda via ' + ev('(petInfo()||{draw:{}}).draw.base') + ' (memória de 0,5 s do relógio da batalha)');
    ev('statsChanged(); 1');
    check('pet: trocar o pet muda na hora (petInfo da batalha e do drawHeroFull)', ev(`(petInfo()||{draw:{}}).draw.base==='${pets[1].base}'&&PETK.base==='${pets[1].base}'`), 'petInfo=' + ev('JSON.stringify(petInfo()&&petInfo().draw)'));
    check('pet: o drawHeroFull desenha o pet novo', await until(`__hl.full({mount:false}).src.some(s=>s.indexOf('anim/pets/${pets[1].base}_')>=0)`, 80), 'folha de ' + pets[1].base + ' não desenhada: ' + ev('__hl.full({mount:false}).src.join(", ")'));
  }

  /* ---------------- SKIN FIXA + RETRATO ---------------- */
  const sk = ev("(function(){ const l=Sys.appearance.fixedSkins(S,Sys.host).filter(x=>x.hero==='kael'&&x.art!==false); return l.length?l[0].id:null; })()");
  check('skin: existe skin fixa do Kael com arte', !!sk, 'nenhuma');
  if (sk) {
    ev(`window.__av=avatarFor(S,50); Sys.appearance.grantFixed(S,'${sk}',{owner:true}); 1`);
    await until("typeof __av.__avk==='string'&&__av.__avk.indexOf(avatarKeyOf(S))===0", 80);
    const av0 = ev('avatarKeyOf(S)');
    /* 1ª volta: carrega as folhas e o retrato da skin (a troca espera a arte: regra que fica) */
    ev(`Sys.appearance.equipFixed(S,'${sk}'); statsChanged(); 1`);
    check('skin: ' + sk + ' entra no desenho quando as folhas carregam', await until(`heroForm().skin==='${sk}'`, 200), 'heroForm=' + ev('JSON.stringify(heroForm())'));
    const av1 = ev('avatarKeyOf(S)');
    await until(`__av.__avk.indexOf('${av1}')===0`, 80);
    ev('Sys.appearance.equipFixed(S,null); statsChanged(); 1');
    check('skin: voltar à padrão vale na hora (forma e retrato)', ev(`heroForm().skin===null&&__av.__avk.indexOf('${av0}')===0`), 'heroForm=' + ev('JSON.stringify(heroForm())') + ' retrato=' + ev('__av.__avk'));
    /* 2ª volta, com a arte já na memória: tem de valer na mesma hora */
    ev(`Sys.appearance.equipFixed(S,'${sk}'); 1`);
    info('skin trocada sem aviso: forma ainda ' + ev('String(heroForm().skin)') + ' (memória de 200 ms), retrato ainda ' + ev('__av.__avk'));
    ev('statsChanged(); 1');
    check('skin: equipar muda NA HORA a forma do herói (batalha, Equipamento, drawHeroFull sem state.skin)', ev(`heroForm().skin==='${sk}'`), 'heroForm=' + ev('JSON.stringify(heroForm())'));
    check('skin: o retrato (cabeçalho, Perfil) muda NA HORA' + (av1 === av0 ? ' [a skin usa o mesmo retrato do padrão: só confere que não quebrou]' : ''), ev(`__av.__avk.indexOf('${av1}')===0`), 'retrato=' + ev('__av.__avk') + ' esperado ' + av1);
    check('skin: o drawHeroFull desenha a pasta da skin', await until(`(function(){ const d=heroForm().dir; return __hl.full({mount:false,pet:false}).src.some(s=>s.indexOf(d)===0); })()`, 80), ev('__hl.full({mount:false,pet:false}).src.join(", ")'));
    ev('Sys.appearance.equipFixed(S,null); statsChanged(); 1');
  }

  /* ---------------- HERÓI (Kael ↔ Kaia) ---------------- */
  ev("Sys.appearance.setHero(S,'kaia'); statsChanged(); 1");
  check('herói: Kaia entra no desenho quando as folhas carregam', await until("heroForm().hero==='kaia'", 200), 'heroForm=' + ev('JSON.stringify(heroForm())'));
  await until("__av&&__av.__avk.indexOf(avatarKeyOf(S))===0", 80);
  ev("Sys.appearance.setHero(S,'kael'); statsChanged(); 1");
  check('herói: voltar ao Kael vale na hora (forma e retrato)', ev("heroForm().hero==='kael'&&(!window.__av||__av.__avk.indexOf('kael_')===0)"), 'heroForm=' + ev('JSON.stringify(heroForm())') + ' retrato=' + ev('window.__av&&__av.__avk'));
  ev("Sys.appearance.setHero(S,'kaia'); statsChanged(); 1");
  check('herói: trocar para a Kaia (arte já na memória) vale NA HORA (forma e retrato)', ev("heroForm().hero==='kaia'&&(!window.__av||__av.__avk.indexOf('kaia_')===0)"), 'heroForm=' + ev('JSON.stringify(heroForm())') + ' retrato=' + ev('window.__av&&__av.__avk'));
  ev("Sys.appearance.setHero(S,'kael'); statsChanged(); 1");

  /* ---------------- ITEM MELHOR EQUIPADO SOZINHO (drop) ---------------- */
  ev("(function(){ for(const s in S.eq) delete S.eq[s]; statsChanged(); lookNow(); addItemToBag({slot:'weapon',r:4,e:6,look:6}); })()");
  check('drop melhor equipa sozinho e a batalha vê a arma nova na hora', ev("S.eq.weapon!=null&&__hl.wk()===wKey(wFamLook(heroLook().weapon))&&itemOf(S.eq.weapon).e===6"), 'eq=' + ev('S.eq.weapon') + ' batalha=' + ev('__hl.wk()'));

  /* ---------------- APARÊNCIA ABERTA: quadros parados refeitos pelo evento 'herochange' ---------------- */
  { const cv = G.mkCanvas(false); cv.dataset.plsk = 'default'; cv.__painted = 1; const evs = [];
    const q0 = G.document.querySelectorAll, d0 = X.dispatchEvent, c0 = X.CustomEvent;
    G.document.querySelectorAll = sel => (/data-plsk/.test(sel) && /not\(\[data-live\]\)/.test(sel)) ? [cv] : [];
    X.CustomEvent = function (t) { this.type = t; }; X.dispatchEvent = e => { evs.push(e && e.type); if (e && e.type === 'herochange' && typeof X.plHeroChanged === 'function') X.plHeroChanged(); };
    try { ev("view='look'; statsChanged(); 1"); } catch (e) { check('Aparência aberta: aviso sem exceção', false, errStr(e)); }
    check("o aviso dispara o evento 'herochange' no window", evs.includes('herochange'), 'eventos: ' + evs.join(','));
    for (let i = 0; i < 60 && !cv.__srcs.size; i++) await pump(4);   /* a arma nova ainda carregando: a própria tela tenta de novo a cada 0,6 s (plStills) */
    check('Aparência aberta: o quadro parado é refeito (drawHeroFull de novo no cartão)', cv.__painted !== 1 && cv.__srcs.size > 0, 'o cartão não recebeu desenho (plHeroChanged=' + typeof X.plHeroChanged + ')');
    ev("view='battle'; 1"); G.document.querySelectorAll = q0; X.dispatchEvent = d0; X.CustomEvent = c0; }

  const hf = ev('!!window.__hfErr') || G.consoleErrs.some(m => /drawHeroFull|heroChanged/.test(m));
  check('nenhum erro do drawHeroFull / heroChanged no console do jogo', !hf, G.consoleErrs.filter(m => /drawHeroFull|heroChanged/.test(m)).slice(0, 3).join(' | '));
  console.log(fail ? '\n' + fail + ' FALHA(S) de ' + total + ' (herói ao vivo)' : '\nHERÓI AO VIVO OK (' + total + ' verificações): arma, asa, montaria, pet, skin, herói e retrato mudam na hora');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
