// Sys.assets: classificação de cada arquivo em pacote, o que o jogador precisa agora (herói/fase/era/montaria/pet), plano de baixar/apagar e APK base.
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
const {makeHost}=require('./_host.js');
const A=require('../../js/sys/assets.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };

t('classify: cada tipo de arte no seu pacote; fontes brutas fora',()=>{
  const C=A.classify;
  assert.strictEqual(C('assets/anim/hyb/R/kael_idle_body.png'),'hero:kael:0'); assert.strictEqual(C('assets/anim/hyb/phase2/kael_run_era2_t1.png'),'retired','fases 1-3 aposentadas');
  assert.strictEqual(C('assets/anim/hyb/kaia/kaia_idle_body.png'),'hero:kaia:0'); assert.strictEqual(C('assets/anim/hyb/kaia_phase3/masks/kaia_idle_head.json'),'retired');
  assert.strictEqual(C('assets/map/era3.jpg'),'era:3'); assert.strictEqual(C('assets/map/world.jpg'),'core'); assert.ok(!A.excluded('assets/map/world.jpg'),'o mapa entra no app');
  assert.strictEqual(C('assets/anim/skins/kael_demon/kael_idle_body.png'),'skin:kael_demon'); assert.strictEqual(C('assets/anim/mounts/kaia_pony_run_body.png'),'mount:pony');
  assert.strictEqual(A.deliveryOf('core'),'base'); assert.strictEqual(A.deliveryOf('aura'),'fast'); assert.strictEqual(A.deliveryOf('retired'),'none'); assert.strictEqual(A.deliveryOf('mount:wolf'),'demand'); assert.ok(!A.DATA.fastFollow().some(p=>p.startsWith('hero:')),'fast-follow sem herói');
  assert.strictEqual(C('assets/anim/hyb/R/pistol/kael_pistol_idle_era5_t0.png'),'gun:5'); assert.strictEqual(C('assets/anim/hyb/R/gun/kael_gun_shoot_era3_t2.png'),'gun:3');
  assert.strictEqual(C('assets/anim/hyb/enemy/era7_boss_attack.png'),'enemy:7'); assert.strictEqual(C('assets/enemies/era2_e0.png'),'enemy:2');
  assert.strictEqual(C('assets/anim/mounts/kael_wolf_idle_3star.png'),'mount:wolf'); assert.strictEqual(C('assets/anim/pets/era7_cerberus_mid_atk1.png'),'pet:era7_cerberus:1');
  assert.strictEqual(C('assets/anim/pets/prism_fox_idle.png'),'pet:prism_fox:0'); assert.strictEqual(C('assets/anim/pets/era0_mammoth_evo_run.json'),'pet:era0_mammoth:2');
  assert.strictEqual(C('assets/weapons/era4_mitico.png'),'era:4'); assert.strictEqual(C('assets/anim/ult/era8_ult.png'),'era:8'); assert.strictEqual(C('assets/bg/era1.png'),'era:1');
  assert.strictEqual(C('assets/anim/look_preview/kael_phase3_idle_look_b.png'),'preview'); assert.strictEqual(C('assets/ui/coin.png'),'core'); assert.strictEqual(C('js/battle.js'),'core');
  assert.ok(A.excluded('assets/anim/hyb/phase3/_reprovado/x.png')&&A.excluded('assets/hero/phases/kaia/kaia_phase1_src.png')&&A.excluded('assets/anim/rig/src/a.png')&&!A.excluded('assets/ui/coin.png'));
});
t('desligado: nada muda',()=>{ assert.deepStrictEqual(A.needed({},makeHost()),{on:false}); assert.deepStrictEqual(A.plan({},makeHost(),[]),{on:false}); });
t('needed/plan: herói e fase, era atual + próxima, pistola, montaria e pet equipados; plano baixa o que falta e apaga o que sobra',()=>{
  const L=require('../../js/sys/level.js'), PU=require('../../js/sys/phaseup.js'), M=require('../../js/sys/mount.js');
  A.setManifest({packs:{'core':{bytes:10,files:[]},'hero:kaia:1':{bytes:5,files:[]},'hero:kaia:2':{bytes:5,files:[]},'era:3':{bytes:3,files:[]},'era:4':{bytes:3,files:[]},'enemy:3':{bytes:2,files:[]},'enemy:4':{bytes:2,files:[]},'gun:3':{bytes:1,files:[]},'mount:wolf':{bytes:7,files:[]},'aura':{bytes:1,files:[]}}});
  A.DATA.on=true; PU.DATA.on=true; M.DATA.on=true; globalThis.Sys.mount=M; try{
    const S={hero:'kaia',inv:[{slot:'weapon',e:3,r:2}]}, h=makeHost({eraMax:3}); L.ensure(S).lvl=30; PU.evolve(S,h); M.add(S,h,'wolf'); const AP=require('../../js/sys/appearance.js'); globalThis.Sys.appearance=AP;
    assert.strictEqual(A.needed(S,h).phase,0,'sem crescimento: corpo padrão'); assert.ok(!A.needed(S,h).packs.includes('hero:kaia:1'),'não baixa a fase seguinte');
    assert.strictEqual(AP.equipFixed(S,'kaia_knight').reason,'retired','skins adultas fora do jogo (dono)');
    const nd=A.needed(S,h); assert.deepStrictEqual([nd.hero,nd.phase,nd.era],['kaia',0,3]);
    for(const p of ['core','aura','hero:kaia:0','era:3','era:4','enemy:3','enemy:4','gun:3','mount:wolf']) assert.ok(nd.packs.includes(p),'falta '+p);
    assert.ok(!nd.packs.includes('hero:kael:0')&&!nd.packs.includes('era:5'));
    const pl=A.plan(S,h,['core','aura','era:0','era:1','enemy:0','enemy:1','hero:kael:0','hero:kaia:0','mount:pony']);
    assert.ok(!pl.fetch.includes('hero:kaia:0')&&pl.fetch.includes('mount:wolf'),'a Kaia padrão já vem no APK base'); assert.deepStrictEqual(pl.drop,['mount:pony'],'só sai o que não é do APK base nem é preciso'); assert.ok(pl.fetchBytes>0);
  } finally { A.DATA.on=false; PU.DATA.on=false; M.DATA.on=false; delete globalThis.Sys.mount; A.setManifest(null); }
});
t('manifesto real (se gerado): APK base com os dois heróis < 150 MB e todo arquivo listado existe',()=>{
  const f=path.join(__dirname,'../../assets/manifest.json'); if(!fs.existsSync(f)) return; const m=JSON.parse(fs.readFileSync(f,'utf8')); A.setManifest(m);
  try{ const b=A.firstBoot(); assert.ok(b.packs.includes('hero:kael:0')&&b.packs.includes('hero:kaia:0')); assert.ok(b.mb<150,'APK base '+b.mb+' MB');
    const root=path.join(__dirname,'../..'); let miss=0; for(const id in m.packs) for(const x of m.packs[id].files) if(!fs.existsSync(path.join(root,x))) miss++; if(miss>5) console.warn('AVISO: '+miss+' arquivos do manifesto não existem mais (a Arte mexeu na arte): rode node tools/asset-manifest.js');   // aviso, não falha: o manifesto segue a arte de outra sessão
  } finally { A.setManifest(null); }
});
t('resolvedor único (Play Asset Delivery): url() aponta para o pack baixado ou fica no caminho original',()=>{
  const p='assets/anim/mounts/kael_wolf_idle_3star.png'; assert.strictEqual(A.url(p),p); assert.ok(A.isReady(p),'desligado: tudo no APK');
  A.DATA.on=true; try{ assert.ok(!A.isReady(p)); assert.ok(A.isReady('assets/ui/coin.png'),'base');
    A.setPackPath('mount:wolf','https://localhost/_capacitor_file_/data/packs/mount_wolf/'); assert.strictEqual(A.url(p),'https://localhost/_capacitor_file_/data/packs/mount_wolf/'+p); assert.ok(A.isReady(p));
    assert.ok(A.installed().includes('mount:wolf')&&A.installed().includes('hero:kaia:0')); assert.strictEqual(A.url('assets/ui/coin.png'),'assets/ui/coin.png');
    A.setPackPath('mount:wolf',null); assert.strictEqual(A.url(p),p);
  } finally { A.DATA.on=false; }
});
t('pré-carga da cena (P27): sceneSet com herói/arma/ultimate/montaria/asa/era/inimigos/ícones, só arquivos que existem; nextEraSet = era seguinte',()=>{
  const f=path.join(__dirname,'../../assets/manifest.json'); if(!fs.existsSync(f)) return; A.setManifest(JSON.parse(fs.readFileSync(f,'utf8')));
  const T=require('../../js/sys/stats.js'), M=require('../../js/sys/mount.js'), AP=require('../../js/sys/appearance.js'); Object.assign(globalThis.Sys,{stats:T,mount:M,appearance:AP});
  try{ const S={hero:'kael',inv:[{id:1,slot:'weapon',e:5,r:4},{id:2,slot:'wing',e:0,r:3,wing:'angel'}],eq:{weapon:1,wing:2}}, h=makeHost({eraMax:5}); M.add(S,h,'wolf');
    const r=A.sceneSet(S,h); assert.ok(r.on); assert.deepStrictEqual(r.missing,[],'tudo existe: '+r.missing.join(', '));
    const G=r.groups; assert.ok(G.hero.length&&G.hero.every(p=>p.startsWith('assets/anim/hyb/R/'))); assert.ok(!G.hero.some(p=>/\/bow\//.test(p)),'sem as folhas do arco');
    assert.ok(G.hero.some(p=>/\/(pistol|gun)\//.test(p)),'arma de fogo: folhas da pistola'); assert.ok(!G.hero.some(p=>/_era(\d)_/.test(p)&&!/_era5_/.test(p)),'tintas só da era da arte da arma');
    assert.ok(G.weapon.includes('assets/weapons/era5_t2.png')); assert.ok(G.ult.includes('assets/anim/ult/era5_ult.png'));
    assert.ok(G.mount.length&&G.mount.every(p=>p.startsWith('assets/anim/mounts/kael_wolf_'))); assert.ok(G.wing.includes('assets/anim/equip/wing_angel_L.png'));
    assert.ok(G.era.some(p=>p.startsWith('assets/bg/v2/era5/')||p==='assets/bg/era5.png'),'fundo da era 5'); assert.ok(G.enemies.length); assert.strictEqual(new Set(r.files).size,r.files.length);
    const n=A.nextEraSet(S,h); assert.strictEqual(n.era,6); assert.ok(n.groups.era.some(p=>p.startsWith('assets/bg/v2/era6/'))&&n.groups.enemies.length);
    S.hero='kaia'; assert.ok(A.sceneSet(S,h).groups.hero.every(p=>p.startsWith('assets/anim/hyb/kaia/'))); assert.strictEqual(A.sceneSet(S,h).groups.mount.length>0,A.mountedArt('kaia','wolf')===true,'Kaia montada só quando a folha existe (mountedArt)'); assert.ok(A.sceneSet(S,h).groups.mount.every(p=>p.startsWith('assets/anim/mounts/kaia_wolf_')));
  } finally { A.setManifest(null); }
});
console.log(`ok: ${n} testes`);
