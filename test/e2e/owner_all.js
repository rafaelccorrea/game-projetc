'use strict';
/* MODO DONO: "LIBERAR TUDO" e "RECURSOS INFINITOS" (js/artprev.js, Engenheiro 11). Sem navegador. Rodar: node test/e2e/owner_all.js [-v]
   Usa o sandbox.js (DOM falso + o jogo na ordem do index). Quatro cargas do jogo, como o aparelho faz (entrar e sair do Modo dono recarregam a página):
     1. jogo normal sem save  → monta um save REAL e grava (chave eras_proto_v2)
     2. jogo normal com esse save → confere que NADA do Modo dono existe fora dele; grava como o "Jogar no modo dono" faz (save() antes de recarregar)
     3. Modo dono (eon_owner_mode = 1; chave eras_owner_v1) → LIBERAR TUDO, RECURSOS INFINITOS, VIP, estágio do pet, relógio dos eventos, vários save()
     4. de volta ao jogo normal → o save real é o mesmo, byte a byte, e não tem nada do que foi liberado
   Sai com código 1 se algo reprovar. (A rede no Modo dono, js/sys/net.js, é coberta pelo teste do Servidor.) */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, total = 0;
const check = (name, ok, err) => { total++; if (!ok) fail++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok ? '' : ' — ' + (err == null ? '' : err))); };
const REAL = 'eras_proto_v2', OWN = 'eras_owner_v1', FLAG = 'eon_owner_mode';
function game(storage) { const loadErr = []; const G = boot({ search: '?debug=1&skip=1', storage: storage || {}, add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } });
  G.loadErr = loadErr; G.ls = k => G.sandbox.localStorage.getItem(k); G.flush(); return G; }
const T = (name, fn) => { try { const r = fn(); check(name, r === true || r === undefined, r); } catch (e) { check(name, false, errStr(e)); } };

/* ---------- 1. save real ---------- */
const G1 = game();
check('1. jogo normal carregou', !G1.loadErr.length, G1.loadErr.slice(0, 3).join(' | '));
G1.ev(`(function(){ S.name='Dono_Real'; S.hero='kael'; S.tut=99; S.welcome=true; S.gold=4321; S.gems=77; S.kills=250; S.stage=8; S.best=8;
  try{ const L=Sys.level.ensure(S); L.lvl=23; }catch(e){} for(let i=0;i<5;i++) addItemToBag({slot:['hat','gloves','boots','necklace','weapon'][i],r:i%3,e:0}); statsChanged(); save(); })()`); G1.flush();
const real1 = G1.ls(REAL);
check('1. o save real foi gravado na chave ' + REAL, typeof real1 === 'string' && real1.length > 100, 'vazio');

/* ---------- 2. fora do Modo dono nada existe ---------- */
const G2 = game({ [REAL]: real1 });
T('2. fora do Modo dono: OWNER_MODE falso e chave de gravação do jogo real', () => G2.ev('OWNER_MODE===false&&SAVE_KEY==="' + REAL + '"') || 'OWNER_MODE=' + G2.ev('OWNER_MODE') + ' SAVE_KEY=' + G2.ev('SAVE_KEY'));
T('2. fora do Modo dono: sem ownerAct, sem ownerRefill, sem OWNER_INFINITE', () => G2.ev("typeof window.ownerAct==='undefined'&&typeof window.ownerRefill==='undefined'&&typeof window.OWNER_INFINITE==='undefined'") || 'algum nome do Modo dono existe no jogo normal');
T('2. fora do Modo dono: a mochila tem o limite do jogo (60 sem VIP)', () => { const n = G2.ev('bagMax()'); return n === 60 || 'bagMax() = ' + n; });
T('2. fora do Modo dono: o ouro não é reabastecido', () => { G2.ev('S.gold=4321'); G2.flush(); return G2.ev('S.gold') === 4321 || 'ouro ' + G2.ev('S.gold'); });
G2.ev('save()');   /* o botão "Jogar no modo dono" grava o jogo real antes de recarregar */
const real0 = G2.ls(REAL);
const realObj = JSON.parse(real0);

/* ---------- 3. Modo dono ---------- */
const G = game({ [REAL]: real0, [FLAG]: '1' }), ev = G.ev;
check('3. Modo dono carregou', !G.loadErr.length, G.loadErr.slice(0, 3).join(' | '));
T('3. Modo dono: OWNER_MODE e chave de gravação separada', () => ev('OWNER_MODE===true&&SAVE_KEY==="' + OWN + '"') || 'SAVE_KEY=' + ev('SAVE_KEY'));
T('3. o save de teste nasce novo (não é cópia do real)', () => ev('S.name') !== 'Dono_Real' || 'o Modo dono abriu com o save real');
T('3. ownerAct existe no Modo dono', () => ev("typeof window.ownerAct==='function'&&typeof window.ownerRefill==='function'") || 'faltam');
const sameReal = label => T(label + ': o save real está igual, byte a byte', () => G.ls(REAL) === real0 || 'o save real mudou (' + String(G.ls(REAL)).length + ' x ' + real0.length + ' caracteres)');
const act = k => { ev('ownerAct(' + JSON.stringify(k) + ')'); G.flush(); };
const saves = () => { for (let i = 0; i < 4; i++) ev('save()'); };   /* o que visibilitychange / pagehide / freeze / pause fazem (index.html) */

/* confirmação: o 1º toque não libera nada */
const inv0 = ev('S.inv.length');
act('all');
T('3. LIBERAR TUDO: o primeiro toque só pede a confirmação', () => ev('S.inv.length') === inv0 || 'a mochila mudou no primeiro toque');
act('all');
const D = ev(`(function(){ const T=Sys.stats, W=T.DATA.weaponTypes, out={fams:Object.keys(W), maxR:T.maxR(), miss:[], bad:[], ult:[]};
  for(const t of out.fams) for(let r=0;r<=out.maxR;r++){ const it=S.inv.find(i=>i.slot==='weapon'&&i.origin==='owner'&&i.wt===t&&i.r===r);
    if(!it){ out.miss.push(t+':'+r); continue; } if(T.weaponType(it)!==t||T.ensureWeaponType(it)!==t) out.bad.push(t+':'+r+'='+T.weaponType(it));
    const u=T.ultOf(it); if(u.type!==t||u.tier!==T.DATA.ultTier[r]) out.ult.push(t+':'+r+'='+u.type+'/'+u.tier); }
  out.weapons=S.inv.filter(i=>i.slot==='weapon'&&i.origin==='owner').length;
  const A=Sys.appearance, fx=A.fixedSkins(S); out.skins=fx.length; out.skinsOwned=fx.filter(k=>k.owned).length; out.skinsArt=fx.filter(k=>k.owned&&k.art).length; out.skinsNoArt=fx.filter(k=>k.owned&&!k.art).map(k=>k.id);
  const P=Sys.pet, po=P.ensure(S), PD=P.DATA; out.petsWant=PD.pets.filter(d=>(!d.nw||PD.newPets===true||PD.newReady[d.id]===true)&&!d.removed&&(!d.v17||PD.v17.on===true)&&(!d.v4||(PD.v4===true&&PD.v3===true))).map(d=>d.id);
  out.petsMiss=out.petsWant.filter(id=>!po.owned[id]); out.pets=Object.keys(po.owned).length; out.newPets=['shadowwolf','falcon','panther'].filter(id=>po.owned[id]).length;
  const M=Sys.mount, mo=M.ensure(S); out.mountsWant=M.DATA.mounts.filter(m=>!m.tbd&&M.live(m)).map(m=>m.id); out.mountsMiss=out.mountsWant.filter(id=>!mo.owned[id]); out.mounts=Object.keys(mo.owned).length;
  const WG=Object.keys(T.DATA.wingTypes); out.wingsWant=WG; out.wingsMiss=WG.filter(w=>!S.inv.some(i=>i.slot==='wing'&&i.wing===w)); out.wingsDead=WG.filter(w=>{ const it=S.inv.find(i=>i.slot==='wing'&&i.wing===w); return !it||T.wingOf(it)!==w||!T.canEquip(it,Sys.level.level(S)); });
  out.keyPets=PD.newPets===true&&M.DATA.newOn===true&&!!(S.ownerKeys&&S.ownerKeys.pets===true); out.petsNew=PD.pets.filter(d=>d.nw&&po.owned[d.id]).length; out.petsNewAll=PD.pets.filter(d=>d.nw).length; out.petEq=po.eq;
  out.mountsNew=M.DATA.mounts.filter(m=>m.nw&&mo.owned[m.id]).length; out.mountsNewAll=M.DATA.mounts.filter(m=>m.nw&&!m.tbd).length; out.mountEq=mo.eq; out.mountEqArt=!mo.eq||!!MOUNT_TBL[mo.eq];
  out.forge=Object.assign({},Sys.forge.ensure(S).lv); out.titles=Object.keys(Sys.titles.ensure(S).unlocked).length; out.titlesAll=Sys.titles.DATA.titles.length;
  out.level=Sys.level.level(S); out.fc=Sys.fc.compute(S,Sys.host); out.ids=new Set(S.inv.map(i=>i.id)).size===S.inv.length; out.inv=S.inv.length; out.bag=bagMax();
  out.nan=JSON.stringify(S).indexOf('NaN')>=0||JSON.stringify(S).indexOf('null')>=0&&S.inv.some(i=>i==null); return JSON.stringify(out); })()`);
const R = JSON.parse(D);
T('3. ARMAS: as 11 famílias do módulo (com arco e bumerangue)', () => (R.fams.length === 11 && R.fams.includes('bow') && R.fams.includes('boomerang')) || R.fams.join(','));
T('3. ARMAS: cada família × raridade existe (' + R.fams.length + ' × ' + (R.maxR + 1) + ' = ' + R.weapons + ')', () => (!R.miss.length && R.weapons === R.fams.length * (R.maxR + 1)) || 'faltam ' + R.miss.join(', ') + ' · total ' + R.weapons);
T('3. ARMAS: it.wt certo (Sys.stats.weaponType e ensureWeaponType devolvem a família)', () => !R.bad.length || R.bad.join(', '));
T('3. ARMAS: ultimate da família no nível da raridade (base, base, base, reforçada, própria)', () => !R.ult.length || R.ult.join(', '));
T('3. SKINS: todas as fixas do módulo na coleção (' + R.skinsOwned + '/' + R.skins + '; ' + R.skinsArt + ' com arte)', () => (R.skins > 0 && R.skinsOwned === R.skins) || R.skinsOwned + '/' + R.skins);
T('3. PETS: todos os vivos no módulo (' + R.pets + '), com lobo sombrio, falcão e pantera', () => (!R.petsMiss.length && R.pets >= R.petsWant.length && R.newPets === 3) || 'faltam ' + R.petsMiss.join(', ') + ' · novos ' + R.newPets + '/3');
T('3. MONTARIAS: todas as vivas no módulo (' + R.mounts + ')', () => (!R.mountsMiss.length && R.mounts >= 6) || 'faltam ' + R.mountsMiss.join(', ') + ' · total ' + R.mounts);
T('3. a chave "Pets e montarias novos" foi ligada e guardada no save de teste', () => R.keyPets || 'newPets/newOn/S.ownerKeys.pets');
T('3. PETS NOVOS: os ' + R.petsNewAll + ' do módulo na coleção; nenhum pet equipado pelo botão', () => (R.petsNew === R.petsNewAll && R.petsNewAll >= 9 && R.petEq == null) || R.petsNew + '/' + R.petsNewAll + ' · equipado: ' + R.petEq);
T('3. MONTARIAS NOVAS: as ' + R.mountsNewAll + ' do módulo na coleção; a equipada (' + R.mountEq + ') tem arte montada', () => (R.mountsNew === R.mountsNewAll && R.mountsNewAll >= 10 && R.mountEqArt) || R.mountsNew + '/' + R.mountsNewAll + ' · equipada: ' + R.mountEq);
T('3. ASAS: os ' + R.wingsWant.length + ' modelos (2 antigas + 8 novas, Serafim inclusa)', () => (R.wingsWant.length === 10 && !R.wingsMiss.length) || 'faltam ' + R.wingsMiss.join(', '));
T('3. ASAS: cada uma desenha o próprio modelo e pode ser equipada', () => !R.wingsDead.length || R.wingsDead.join(', '));
T('3. FORJA: arma e asa em +13 ou mais', () => (R.forge.weapon >= 13 && R.forge.wing >= 13) || JSON.stringify(R.forge));
T('3. TÍTULOS: todos (' + R.titles + '/' + R.titlesAll + ')', () => R.titles === R.titlesAll || R.titles + '/' + R.titlesAll);
T('3. nível 70 ou mais (asa e pet abertos)', () => R.level >= 70 || 'nível ' + R.level);
T('3. FC calculável, sem NaN (' + Math.round(R.fc) + ')', () => (Number.isFinite(R.fc) && R.fc > 0 && !R.nan) || 'FC ' + R.fc);
T('3. ids dos itens sem repetição; mochila ' + R.inv + ' de ' + R.bag, () => (R.ids && R.bag >= R.inv) || 'ids repetidos ou mochila acima do limite (' + R.inv + '/' + R.bag + ')');
T('3. FC finito com CADA arma liberada na mão', () => { const bad = ev(`(function(){ const keep=S.eq.weapon, bad=[]; for(const it of S.inv.filter(i=>i.slot==='weapon'&&i.origin==='owner')){ S.eq.weapon=it.id; const v=Sys.fc.compute(S,Sys.host); if(!(Number.isFinite(v)&&v>0)) bad.push(it.wt+':'+it.r); try{ refreshHero(); }catch(e){ bad.push(it.wt+':'+it.r+' refreshHero '+e.message); } } S.eq.weapon=keep; refreshHero(); return bad.join(', '); })()`); return !bad || bad; });
T('3. LIBERAR TUDO de novo não duplica nada', () => { const q = "JSON.stringify([S.inv.filter(i=>i.origin==='owner').length,Object.keys(Sys.pet.ensure(S).owned).length,JSON.stringify(Sys.mount.ensure(S).owned)])", a = ev(q); act('all'); act('all'); const b = ev(q); return a === b || a + ' → ' + b; });
T('3. um drop comum entra na mochila sem desmontar nenhum item liberado', () => { const a = ev("S.inv.filter(i=>i.origin==='owner').length"); ev("for(let i=0;i<30;i++) addItemToBag({slot:'armor',r:4,e:S.eraMax|0})"); G.flush(); const b = ev("S.inv.filter(i=>i.origin==='owner').length"); return a === b || a + ' → ' + b; });
T('3. tela Teste: tem LIBERAR TUDO e RECURSOS INFINITOS, sem "undefined"/"NaN"', () => { const h = String(G.document.getElementById('apv').innerHTML || ''); const bad = ['undefined', 'NaN', '[object'].find(x => h.indexOf(x) >= 0);
  return (h.indexOf('LIBERAR TUDO') >= 0 && h.indexOf('RECURSOS INFINITOS') >= 0 && h.indexOf('Liberado: ') >= 0 && h.indexOf('data-o="exit"') >= 0 && !bad) || (bad ? 'contém ' + bad : 'faltam os botões ou o resumo'); });
T('3. tela Teste: nenhum emoji', () => { const h = String(G.document.getElementById('apv').innerHTML || ''); const m = h.match(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u); return !m || 'emoji ' + m[0]; });
saves(); sameReal('3a. depois do LIBERAR TUDO e de 4 gravações');
T('3a. o save de teste foi gravado na chave separada, com os itens liberados', () => { const o = JSON.parse(G.ls(OWN) || '{}'); return (Array.isArray(o.inv) && o.inv.filter(i => i.origin === 'owner').length >= R.weapons) || 'sem itens no ' + OWN; });

/* ---------- RECURSOS INFINITOS ---------- */
T('3c. RECURSOS INFINITOS nasce ligado (window.OWNER_INFINITE)', () => ev('window.OWNER_INFINITE===true') || 'OWNER_INFINITE=' + ev('window.OWNER_INFINITE'));
const drain = `(function(){ S.gold=5; S.gems=0; const f=Sys.forge.ensure(S); f.stones=0; Sys.practice.ensure(S).stones=0; Sys.pet.ensure(S).food=0; Sys.loot.ensure(S).mat.essence=0;
  Sys.arena.ensure(S,Sys.host).attemptsLeft=0; Sys.tower.ensure(S,Sys.host).lossesLeft=0; const I=Sys.instances.ensure(S); for(const t of Sys.instances.DATA.order) I.keys[t]=0;
  Sys.schedule.ensure(S).entered={'world_boss@1700000000000':2}; const c=Sys.chest.ensure(S); c.today=99; c.stored=0; })()`;
const stock = () => JSON.parse(ev(`JSON.stringify({gold:S.gold,gems:S.gems,forge:Sys.forge.ensure(S).stones,train:Sys.practice.ensure(S).stones,food:Sys.pet.ensure(S).food,ess:Sys.loot.ensure(S).mat.essence,
  arena:Sys.arena.ensure(S,Sys.host).attemptsLeft,arenaMax:Sys.arena.DATA.attemptsPerDay,tower:Sys.tower.ensure(S,Sys.host).lossesLeft,towerMax:Sys.tower.DATA.lossesPerDay,
  keys:Sys.instances.DATA.order.map(t=>Sys.instances.ensure(S).keys[t]),keysMax:Sys.instances.keysMax(S),entered:Object.keys(Sys.schedule.ensure(S).entered).length,chestToday:Sys.chest.ensure(S).today,chest:Sys.chest.ensure(S).stored,bag:bagMax()})`));
ev(drain); ev('ownerRefill()');
{ const s = stock();
  T('3c. ligado: ouro e gemas voltam ao máximo (999 bi)', () => (s.gold >= 999e9 && s.gems >= 999e9) || s.gold + ' / ' + s.gems);
  T('3c. ligado: pedras de forja e de treino, ração e Essência voltam ao máximo', () => (s.forge >= 1e9 && s.train >= 1e9 && s.food >= 1e9 && s.ess >= 999999) || JSON.stringify([s.forge, s.train, s.food, s.ess]));
  T('3c. ligado: tentativas da arena e da torre voltam ao máximo do dia', () => (s.arena >= s.arenaMax && s.tower >= s.towerMax) || 'arena ' + s.arena + '/' + s.arenaMax + ' torre ' + s.tower + '/' + s.towerMax);
  T('3c. ligado: entradas das instâncias, dos eventos com hora e baús do dia voltam', () => (s.keys.every(k => k >= s.keysMax) && s.keysMax > 0 && s.entered === 0 && s.chestToday === 0 && s.chest >= 1) || JSON.stringify([s.keys, s.keysMax, s.entered, s.chestToday, s.chest]));
  T('3c. ligado: a mochila não barra (limite ' + s.bag + ')', () => s.bag >= 9999 || 'bagMax() = ' + s.bag);
  T('3c. ligado: gastar pelo jogo funciona e o saldo volta', () => { const ok = ev('Sys.host.spendGold(5e8)&&Sys.host.spendGems(5e8)'); const mid = ev('S.gold<999e9&&S.gems<999e9'); ev('ownerRefill()'); return (ok && mid && ev('S.gold>=999e9&&S.gems>=999e9')) || 'gastou=' + ok + ' caiu=' + mid; });
  T('3c. ligado: a forja tenta sem "sem pedras" (Sys.forge.canTry)', () => { const r = ev("JSON.stringify(Sys.forge.canTry(S,Sys.host,'armor'))"); return !/"reason":"(stones|gold)"/.test(r) || r; }); }
saves(); sameReal('3c. com RECURSOS INFINITOS ligado e 4 gravações');
act('inf');
T('3c. desligar: o interruptor fica guardado no save de teste e OWNER_INFINITE vira falso', () => ev('S.ownerKeys.inf===false&&window.OWNER_INFINITE===false') || 'inf=' + ev('S.ownerKeys&&S.ownerKeys.inf'));
ev(drain); ev('ownerRefill()');
{ const s = stock();
  T('3c. desligado: nada é reabastecido', () => (s.gold === 5 && s.gems === 0 && s.forge === 0 && s.food === 0 && s.arena === 0 && s.tower === 0 && s.keys.every(k => k === 0) && s.entered === 1) || JSON.stringify(s));
  T('3c. desligado: a mochila volta ao limite do jogo + os itens liberados', () => { const own = ev("S.inv.filter(i=>i.origin==='owner').length"); return (s.bag < 9999 && s.bag >= 60 + own) || 'bagMax() = ' + s.bag + ' com ' + own + ' liberados'; }); }
T('3c. desligado fica desligado depois de gravar e ler o save de teste', () => { ev('save()'); const o = JSON.parse(G.ls(OWN)); return (o.ownerKeys && o.ownerKeys.inf === false) || 'não gravou'; });
act('inf');
T('3c. religar: reabastece na hora', () => ev('window.OWNER_INFINITE===true&&S.gold>=999e9&&S.gems>=999e9') || 'ouro ' + ev('S.gold'));

/* ---------- VIP, pet, montaria, relógio ---------- */
T('3. VIP: o seletor escreve S.sys.vip.points (pontos do nível) e o nível pelo Sys.vip', () => { act('vip7'); const a = ev('JSON.stringify([Sys.vip.level(S),S.sys.vip.points,Sys.vip.DATA.points[7],Sys.vip.levelForPoints(S.sys.vip.points)])'); act('vip10'); const b = ev('Sys.vip.level(S)'); act('vip0'); const c = ev('JSON.stringify([Sys.vip.level(S),S.sys.vip.points])');
  const A = JSON.parse(a), C = JSON.parse(c); return (A[0] === 7 && A[1] === A[2] && A[3] === 7 && b === 10 && C[0] === 0 && C[1] === 0) || a + ' · ' + b + ' · ' + c; });
T('3. VIP: uma compra depois do seletor soma no mesmo dado (addPoints) e o nível sobe', () => { act('vip3'); const r = ev('JSON.stringify(Sys.vip.addPoints(S,Sys.vip.DATA.points[5]-Sys.vip.DATA.points[3]))'); const lv = ev('Sys.vip.level(S)'); act('vip0'); return lv === 5 || r; });
T('3. PET: estágio 1 / 2 / 3 do pet equipado', () => { const id = ev("(function(){ const P=Sys.pet, o=P.ensure(S); const id=o.eq||Object.keys(o.owned)[0]; P.equip(S,id); return P.ensure(S).eq; })()"); if (!id) return 'nenhum pet equipado';
  const st = n => { act('pst' + n); const i = ev('Sys.pet.battleInfo(S,Sys.host)'); return i ? i.stage : null; }; const a = st(3), b = st(2), c = st(1); return (a === 3 && b === 2 && c === 1) || [a, b, c].join(','); });
T('3. PET: sem pet equipado o botão só avisa', () => { ev('Sys.pet.equip(S,null)'); act('pst2'); return ev('Sys.pet.ensure(S).eq') == null || 'equipou sozinho'; });
T('3. batalha: um passo com cada pet e cada montaria equipados, inclusive os sem arte, não lança erro', () => { const bad = ev(`(function(){ const bad=[], P=Sys.pet, M=Sys.mount, p0=P.ensure(S).eq, m0=M.ensure(S).eq, step=tag=>{ try{ refreshHero(); if(typeof preloadAssets==='function') preloadAssets(); const v=Sys.fc.compute(S,Sys.host); if(!(Number.isFinite(v)&&v>0)) bad.push(tag+' FC '+v); if(typeof petStep==='function') petStep(0.05); if(typeof petInfo==='function'){ PETK.infoT=0; petInfo(); } }catch(e){ bad.push(tag+': '+e.message); } };
  for(const id of Object.keys(P.ensure(S).owned)){ P.equip(S,id); step('pet '+id); } P.equip(S,p0);
  for(const id of Object.keys(M.ensure(S).owned)){ M.equip(S,id); step('montaria '+id); } M.equip(S,m0); refreshHero(); return bad.join(' | '); })()`); G.flush(); return !bad || bad; });
T('3. CHAVES: "Mochila nova" e "Escolha de servidor" ligam, abrem pelo atalho e desligam (quando o painel está registrado)', () => { const out = []; for (const k of ['bag', 'realm']) { if (!ev('!!(window.Panels&&Panels.defs&&Panels.defs.' + k + ')')) { out.push(k + ': painel ainda não registrado (sem botão)'); continue; }
    if (ev('Panels.on("' + k + '")')) act('key_' + k); act('key_' + k); const on = ev('Panels.on("' + k + '")&&S.ownerKeys.' + k + '===true'); let open = true; try { act('open_' + k); open = ev('view') === k; } catch (e) { open = errStr(e); } try { ev('Screens.close()'); G.flush(); } catch (e) {}
    act('key_' + k); const off = ev('!Panels.on("' + k + '")&&S.ownerKeys.' + k + '===false'); if (!(on && open === true && off)) return k + ': ligou=' + on + ' abriu=' + open + ' desligou=' + off; out.push(k + ' OK'); }
  if (VERBOSE) console.log('          ' + out.join(' · ')); return true; });
T('3. CHAVE "Ícones por raridade (opção C)": o LIBERAR TUDO não liga; o botão liga e desliga PANEL_V2.rarIcons e guarda no save de teste', () => { if (!ev("typeof PANEL_V2!=='undefined'&&'rarIcons' in PANEL_V2")) return 'PANEL_V2.rarIcons não existe';
  const a = ev('PANEL_V2.rarIcons===false&&!(S.ownerKeys&&S.ownerKeys.rarico===true)'); act('key_rarico'); const on = ev('PANEL_V2.rarIcons===true&&S.ownerKeys.rarico===true'), btn = String(G.document.getElementById('apv').innerHTML || '').indexOf('data-o="key_rarico"') >= 0; ev('save()'); const saved = JSON.parse(G.ls(OWN)).ownerKeys.rarico === true;
  const Gr = game({ [REAL]: real0, [FLAG]: '1', [OWN]: G.ls(OWN) }), re = Gr.ev('PANEL_V2.rarIcons===true');   /* reaplicada na carga do Modo dono */
  act('key_rarico'); const off = ev('PANEL_V2.rarIcons===false&&S.ownerKeys.rarico===false');
  return (a && on && btn && saved && re && off && G2.ev('PANEL_V2.rarIcons===false')) || JSON.stringify({ desligadaDepoisDoLiberarTudo: a, ligou: on, botao: btn, gravou: saved, reaplicou: re, desligou: off, foraDoModoDono: G2.ev('PANEL_V2.rarIcons') }); });
T('3. MONTARIA: estrela +1 / -1 vale para qualquer montaria equipada', () => { const bad = ev(`(function(){ const M=Sys.mount, bad=[], m0=M.ensure(S).eq; try{ return run(); } finally { M.equip(S,m0); } function run(){ for(const id of Object.keys(M.ensure(S).owned)){ M.equip(S,id); M.ensure(S).owned[id].stars=1; for(let i=0;i<5;i++) ownerAct('mtstar'); const up=M.ensure(S).owned[id].stars; ownerAct('mtstar0'); const dn=M.ensure(S).owned[id].stars; if(up!==5||dn!==4) bad.push(id+':'+up+'/'+dn); } return bad.join(', '); } })()`); G.flush(); return !bad || bad; });
T('3. TEMPO: "Abrir evento agora" abre um evento da agenda e "Relógio real" volta', () => { const a0 = ev('Sys.schedule.active(S,Sys.host).length'); act('evnow'); const a1 = ev('Sys.schedule.active(S,Sys.host).length'), off = ev('Sys.host.now()-Date.now()'); act('evreal'); const back = Math.abs(ev('Sys.host.now()-Date.now()')), seen = ev('Sys.schedule.now(S,Sys.host)-Date.now()');
  return (a1 >= 1 && a1 >= a0 && off >= 0 && back < 50 && Math.abs(seen) < 5000) || 'abertos ' + a0 + ' → ' + a1 + ' · deslocamento ' + off + ' · de volta ' + back + ' · módulo ' + seen; });
T('3. TEMPO: com o Sys.clock ligado, adiantar e voltar não deixa o save de teste "no futuro"; save() grava lastSeen pelo relógio real', () => { if (!ev('!!(Sys.clock&&Sys.clock.DATA)')) return true;
  const on0 = ev('Sys.clock.DATA.on'); ev('Sys.clock.DATA.on=true; Sys.clock._reset()'); const q = 'Sys.clock.now(S,{rawNow:()=>Sys.host.now()})-Date.now()';
  const before = ev(q), max0 = ev('Sys.clock.ensure(S).max'); act('evnow'); const during = ev(q), maxF = ev('Sys.clock.ensure(S).max-Date.now()'); ev('save()'); const ls = Math.abs(ev('S.lastSeen-Date.now()'));
  act('evreal'); const after = ev(q), maxB = ev('Sys.clock.ensure(S).max-Date.now()'), sch = ev('Sys.schedule.now(S,Sys.host)-Date.now()'), day = ev('Sys.clock.dayKey(Sys.clock.now(S,{rawNow:()=>Sys.host.now()}))===Sys.clock.dayKey(Date.now())');
  ev('Sys.clock.DATA.on=' + JSON.stringify(on0) + '; Sys.clock._reset()');
  return (Math.abs(before) < 5000 && during > 30000 && maxF > 30000 && ls < 5000 && Math.abs(after) < 5000 && maxB < 5000 && Math.abs(sch) < 5000 && day) || JSON.stringify({ before, during, maxF, lastSeen: ls, after, maxB, sch, day, max0 }); });
T('3. TEMPO: sessão fechada com o relógio adiantado: a próxima abertura do Modo dono solta as travas', () => { const o = JSON.parse(G.ls(OWN) || '{}'); o.sys = o.sys || {}; o.sys.schedule = Object.assign({}, o.sys.schedule, { v: 1, seen: Date.now() + 5 * 86400000, entered: {} }); o.sys.clock = Object.assign({}, o.sys.clock, { v: 1, max: Date.now() + 5 * 86400000 });
  const Gx = game({ [REAL]: real0, [FLAG]: '1', [OWN]: JSON.stringify(o) }); const r = Gx.ev('JSON.stringify([Sys.schedule.ensure(S).seen,Sys.clock?Sys.clock.ensure(S).max:0,Sys.schedule.now(S,Sys.host)-Date.now()])'), A = JSON.parse(r); return (A[0] <= Date.now() + 5000 && A[1] === 0 && Math.abs(A[2]) < 5000 && Gx.ls(REAL) === real0) || r; });
T('3. FC continua finito no fim', () => { const v = ev('Sys.fc.compute(S,Sys.host)'); return (Number.isFinite(v) && v > 0) || 'FC ' + v; });
T('3. o jogo não registrou erro no console', () => !G.consoleErrs.length || [...new Set(G.consoleErrs)].slice(0, 3).join(' | '));
saves(); sameReal('3. no fim do Modo dono');

/* ---------- sair ---------- */
act('exit');   /* grava o save de teste, tira o sinalizador e recarrega (location.reload é nulo no sandbox) */
T('3. sair: o sinalizador do Modo dono saiu e o save real continua igual, byte a byte', () => (G.ls(FLAG) == null && G.ls(REAL) === real0) || 'flag=' + G.ls(FLAG));
const ownAfter = G.ls(OWN);

/* ---------- 4. de volta ao jogo normal ---------- */
const G4 = game({ [REAL]: G.ls(REAL), [OWN]: ownAfter });
T('4. de volta: jogo normal, com o save real', () => (G4.ev('OWNER_MODE') === false && G4.ev('S.name') === 'Dono_Real') || 'OWNER_MODE=' + G4.ev('OWNER_MODE') + ' nome=' + G4.ev('S.name'));
T('4. de volta: nenhum item liberado, ouro e gemas do jogador', () => { const n = G4.ev("S.inv.filter(i=>i.origin==='owner').length"), g = G4.ev('S.gold'), d = G4.ev('S.gems'); return (n === 0 && g === realObj.gold && d === realObj.gems && G4.ev('S.inv.length') === realObj.inv.length) || n + ' itens · ouro ' + g + ' · gemas ' + d; });
T('4. de volta: sem skins fixas, sem montarias, VIP e forja do jogador', () => { const r = G4.ev("JSON.stringify([Sys.appearance.fixedSkins(S).filter(k=>k.owned).length,Object.keys(Sys.mount.ensure(S).owned).length,Sys.vip.level(S),Sys.forge.ensure(S).lv.weapon,Sys.level.level(S)])"); return r === '[0,0,0,0,23]' || r; });
T('4. de volta: nada do Modo dono existe e nada reabastece', () => { G4.flush(); return (G4.ev("typeof window.ownerAct==='undefined'&&typeof window.OWNER_INFINITE==='undefined'&&bagMax()===60") && G4.ev('S.gold') === realObj.gold) || 'sobrou algo do Modo dono'; });
T('4. de volta: "Ícones por raridade" no padrão (desligada), mesmo com a escolha guardada no save de teste', () => { const o = JSON.parse(ownAfter); o.ownerKeys = Object.assign({}, o.ownerKeys, { rarico: true }); const Gn = game({ [REAL]: G.ls(REAL), [OWN]: JSON.stringify(o) }); return Gn.ev('PANEL_V2.rarIcons===false') || 'ligada fora do Modo dono'; });
T('4. de volta: o save de teste ficou guardado para a próxima entrada', () => { const o = JSON.parse(G4.ls(OWN) || '{}'); return (Array.isArray(o.inv) && o.inv.some(i => i.origin === 'owner')) || 'o save de teste sumiu'; });

/* ---------- 5. Modo dono no servidor s2 (QA A1): a chave do dono é eras_owner_v1@s2 ---------- */
{ const OWN2 = OWN + '@s2', REAL2 = REAL + '@s2', real2 = JSON.stringify(Object.assign({}, realObj, { name: 'Real_S2', realm: 's2', gold: 222 }));
  const G5 = game({ eon_realm: 's2', [FLAG]: '1', [REAL]: real0, [REAL2]: real2, [OWN]: ownAfter }), e5 = G5.ev, a5 = k => { e5('ownerAct(' + JSON.stringify(k) + ')'); G5.flush(); };
  check('5. s2: Modo dono carregou', !G5.loadErr.length, G5.loadErr.slice(0, 3).join(' | '));
  T('5. s2: a chave de gravação é ' + OWN2 + ' e as ferramentas do dono existem', () => (e5('SAVE_KEY') === OWN2 && e5("typeof window.ownerAct==='function'&&window.OWNER_INFINITE===true")) || 'SAVE_KEY=' + e5('SAVE_KEY') + ' ownerAct=' + e5('typeof window.ownerAct'));
  T('5. s2: o save de teste do s2 nasce novo (não é o do s1 nem o real)', () => (e5("S.inv.filter(i=>i.origin==='owner').length") === 0 && e5('S.name') !== 'Real_S2') || 'abriu com outro save');
  a5('all'); a5('all');
  T('5. s2: LIBERAR TUDO funciona (armas, skins, pets, montarias, asas)', () => { const r = e5("JSON.stringify([S.inv.filter(i=>i.slot==='weapon'&&i.origin==='owner').length,Sys.appearance.fixedSkins(S).filter(k=>k.owned).length,Object.keys(Sys.pet.ensure(S).owned).length,Object.keys(Sys.mount.ensure(S).owned).length,S.inv.filter(i=>i.slot==='wing').length])"); const A = JSON.parse(r);
    return (A[0] === R.weapons && A[1] === R.skins && A[2] >= R.pets && A[3] >= R.mounts && A[4] >= 10) || r; });
  T('5. s2: RECURSOS INFINITOS reabastece; o seletor de VIP e o interruptor funcionam', () => { e5('S.gold=5;S.gems=0;ownerRefill()'); const g = e5('S.gold>=999e9&&S.gems>=999e9'); a5('vip4'); const v = e5('Sys.vip.level(S)'); a5('inf'); const off = e5('window.OWNER_INFINITE===false'); a5('inf'); return (g && v === 4 && off && e5('window.OWNER_INFINITE===true')) || 'ouro=' + g + ' vip=' + v + ' desligou=' + off; });
  for (let i = 0; i < 4; i++) e5('save()');
  T('5. s2: gravou só em ' + OWN2 + ' (com os itens liberados)', () => { const o = JSON.parse(G5.ls(OWN2) || '{}'); return (Array.isArray(o.inv) && o.inv.filter(i => i.origin === 'owner').length >= R.weapons) || 'sem itens em ' + OWN2; });
  T('5. s2: ' + REAL + ', ' + REAL2 + ' e ' + OWN + ' iguais, byte a byte', () => (G5.ls(REAL) === real0 && G5.ls(REAL2) === real2 && G5.ls(OWN) === ownAfter) || [G5.ls(REAL) === real0, G5.ls(REAL2) === real2, G5.ls(OWN) === ownAfter].join(','));
  a5('exit');
  T('5. s2: sair tira o sinalizador e não toca nos outros saves', () => (G5.ls(FLAG) == null && G5.ls(REAL) === real0 && G5.ls(REAL2) === real2 && G5.ls(OWN) === ownAfter) || 'flag=' + G5.ls(FLAG));
  T('5. js/artprev.js não usa chave de save fixa para gravar (só SAVE_KEY)', () => { const src = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'js', 'artprev.js'), 'utf8'); const m = src.match(/(setItem|removeItem|getItem)\(\s*['"]eras_[^'"]*['"]/); return !m || m[0]; }); }

console.log('\n' + (fail ? fail + ' FALHA(S) de ' + total + ' verificações' : 'MODO DONO: LIBERAR TUDO E RECURSOS INFINITOS OK (' + total + ' verificações)'));
process.exit(fail ? 1 : 0);
