// node test/sys/arenaset.test.js — Sys.arenaSet (desligado): conjunto PvP da arena (magias do preset 'arena' do Grimório + conjunto 'arena' do
// Sys.loadouts) no retrato, luta com as magias como modificadores fixos (mesma semente), Brasa da Arena 1 por vitória até 5 por dia (Sys.bonfire 'arena')
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','loot','forge','fc','tower','chest','grimoire','loadouts','bonfire','arena','arenaset'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const AS=Sys.arenaSet, A=Sys.arena, T=Sys.tower, G=Sys.grimoire, BF=Sys.bonfire, LO=Sys.loadouts;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=(mods,fn)=>{ const old=mods.map(m=>m.DATA.on); mods.forEach(m=>{ m.DATA.on=true; }); try{ fn(); } finally{ mods.forEach((m,i)=>{ m.DATA.on=old[i]; }); } };
const me={atk:100,hp:2000,def:20,critRate:12,critDmg:100,aspd:0}; me.fc=T.fcOfStats(me);
function learn(S,ids,lv){ const o=G.ensure(S); for(const id of ids) o.own[id]={lv:lv||1,pages:0}; }

t('DESLIGADO por padrão: sem parte no retrato, sem Brasa, view off',()=>{ assert.strictEqual(AS.DATA.on,false); const S={}, h=makeHost();
  assert.strictEqual(AS.snapshotPart(S,h),null); assert.strictEqual(AS.onWin(S,h),0); assert.strictEqual(AS.view(S,h).on,false); });
t('sem magias nos dois lados: duel = Sys.arena.duelPvp idêntico (mesma semente)',()=>{ const f=T.scaledFoe(me,me.fc*1.03);
  assert.deepStrictEqual(AS.duel(me,f,11),A.duelPvp(me,f,11)); assert.deepStrictEqual(AS.duel(Object.assign({},me,{pvp:{spells:[]}}),f,11),A.duelPvp(me,f,11)); });
t('mods: dano = mult/recarga; cura/escudo pela janela; atordoar e esquiva baixam o ATQ do outro; tetos 50%/50%/30/20%',()=>{
  const m=AS.mods([{id:'cannonball',lv:1}]); assert.ok(Math.abs(m.atk-3/18)<1e-3); assert.strictEqual(m.hp,0);
  const h=AS.mods([{id:'medKit',lv:1}]); assert.ok(Math.abs(h.hp-0.15*30/20)<1e-3);
  const s=AS.mods([{id:'knightCharge',lv:1}]); assert.ok(s.foe>0&&s.atk>0);
  const d=AS.mods([{id:'ghostFog',lv:1}]); assert.ok(Math.abs(d.foe-0.2*4/20)<1e-3);
  const big=AS.mods([{id:'cannonball',lv:10},{id:'lightLance',lv:10},{id:'plasmaRay',lv:10}]); assert.ok(big.atk<=0.5);
  const heal=AS.mods([{id:'medKit',lv:10},{id:'judgeBlessing',lv:10},{id:'ancestralFire',lv:10}]); assert.strictEqual(heal.hp,0.5);
  assert.deepStrictEqual(AS.mods([{id:'nao_existe'},{id:'cannonball'},{id:'cannonball'}]),AS.mods([{id:'cannonball'}]),'desconhecida some, repetida conta 1 vez');
  assert.ok(AS.mods([{id:'a'},{id:'b'},{id:'c'},{id:'medKit'}]).hp===0,'só as 3 primeiras'); });
t('luta com magias: retratos não mudam, mesma semente = mesma luta, magias de dano dão vantagem real',()=>{ const f=T.scaledFoe(me,me.fc);
  const A1=Object.assign({},me,{pvp:{spells:[{id:'cannonball',lv:5},{id:'plasmaRay',lv:5},{id:'lightLance',lv:5}]}}), copy=JSON.stringify(A1);
  const d1=AS.duel(A1,f,3), d2=AS.duel(A1,f,3); assert.deepStrictEqual(d1,d2); assert.strictEqual(JSON.stringify(A1),copy); assert.ok(d1.mods.A.atk>0);
  let w=0, w0=0; for(let i=0;i<300;i++){ if(AS.duel(A1,f,i).win) w++; if(A.duelPvp(me,f,i).win) w0++; } assert.ok(w>w0+30,'com magias '+w+' x sem '+w0);
  const B1=Object.assign({},f,{pvp:{spells:A1.pvp.spells}}); let ws=0; for(let i=0;i<300;i++) if(AS.duel(A1,B1,i).win) ws++; assert.ok(ws>90&&ws<210,'mesmas magias dos dois lados = luta justa '+ws); });
t('pvpSet: magias do preset arena (vazio cai no de Fases) + conjunto arena do Sys.loadouts',()=>withOn([AS,G,LO],()=>{ const S={}, h=makeHost();
  learn(S,['cannonball','medKit','gearSpin'],2); G.setPreset(S,'fases',['gearSpin']);
  assert.deepStrictEqual(AS.pvpSet(S,h).spells,[{id:'gearSpin',lv:2}],'sem preset arena: o de Fases');
  G.setPreset(S,'arena',['cannonball','medKit']); const sw={id:7,slot:'weapon',r:2}; h.eq={weapon:sw}; h.equipped=()=>h.eq; h.items=[sw]; LO.save(S,'arena',h);
  const p=AS.snapshotPart(S,h); assert.deepStrictEqual(p.spells,[{id:'cannonball',lv:2},{id:'medKit',lv:2}]); assert.deepStrictEqual(p.gear,{weapon:7});
  const v=AS.view(S,h); assert.ok(v.on&&v.ownSpells&&v.gearSet&&v.spells.length===2&&v.mods.atk>0); }));
t('Sys.bonfire fonte arena: 1 por vitória, teto 5 por dia de Brasília, conta no got, zera no dia seguinte, save forjado volta ao teto; desligada nada',()=>{ const S={}, h=makeHost(); assert.strictEqual(BF.addBrasas(S,'arena',1,{host:h}),0,'desligada');
  withOn([BF],()=>{ let s=0; for(let i=0;i<8;i++) s+=BF.addBrasas(S,'arena',1,{host:h}); assert.strictEqual(s,5); const o=BF.ensure(S); assert.strictEqual(o.ar.n,5); assert.strictEqual(o.got,5); assert.strictEqual(BF.arenaLeft(S,h),0);
    assert.strictEqual(BF.addBrasas(S,'arena',3,{host:h}),0); h.t+=864e5; assert.strictEqual(BF.arenaLeft(S,h),5); assert.strictEqual(BF.addBrasas(S,'arena',9,{host:h}),5,'pedido grande corta no teto'); o.ar.n=99; BF.ensure(S); assert.strictEqual(o.ar.n,5); }); });
t('Brasa da Arena: 1 por vitória, 5 por dia; derrota nada; Fogueira desligada nada',()=>withOn([AS],()=>{ const S={}, h=makeHost();
  assert.strictEqual(AS.onWin(S,h),0,'Fogueira desligada'); withOn([BF],()=>{ let s=0; for(let i=0;i<7;i++) s+=AS.onWin(S,h); assert.strictEqual(s,5); assert.strictEqual(AS.view(S,h).brasa.left,0);
    h.t+=864e5; assert.strictEqual(AS.onWin(S,h),1); assert.strictEqual(BF.ensure(S).ar.n,1); }); }));
t('arena local: vitória credita a Brasa no prêmio da luta (rewards.brasas), formato antigo sem Brasa intacto',()=>withOn([AS,BF],()=>{ const h=makeHost({level:40,eraMax:2}), S={};
  let got=0, wins=0; for(let i=0;i<3;i++){ const L=A.opponents(S,h); const r=A.fight(S,h,L[0].id); if(r.win){ wins++; got+=r.rewards.brasas||0; } else assert.strictEqual(r.rewards.brasas,undefined); }
  assert.strictEqual(got,wins); }));
t('arena local com conjunto PvP: o bot leva as mesmas magias (luta continua determinística)',()=>withOn([AS,G],()=>{ const S={}, h=makeHost({level:40,eraMax:2});
  learn(S,['cannonball'],3); G.setPreset(S,'arena',['cannonball']); const L=A.opponents(S,h); const r=A.fight(S,h,L[0].id); assert.ok(r.ok&&r.duel&&r.duel.mods&&r.duel.mods.A.atk===r.duel.mods.B.atk); }));
t('vm: Sys.arenaSet.duel roda num contexto sem window/document só com stats, grimoire, arena e arenaset (como o servidor carrega) e dá a mesma luta',()=>{ const vm=require('vm'), fs=require('fs'), ctx=vm.createContext({});
  for(const m of ['stats','grimoire','arena','arenaset']) vm.runInContext(fs.readFileSync(require.resolve('../../js/sys/'+m+'.js'),'utf8'),ctx);
  const f=T.scaledFoe(me,me.fc), A1=Object.assign({},me,{pvp:{spells:[{id:'cannonball',lv:4},{id:'medKit',lv:2},{id:'ghostFog',lv:1}]}});
  ctx.A1=A1; ctx.F1=f; const r=vm.runInContext('Sys.arenaSet.duel(A1,F1,99)',ctx); assert.deepStrictEqual(JSON.parse(JSON.stringify(r)),JSON.parse(JSON.stringify(AS.duel(A1,f,99)))); });
console.log(n+' testes ok');
