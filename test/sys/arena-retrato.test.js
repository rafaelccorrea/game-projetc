// node test/sys/arena-retrato.test.js — o retrato da Arena (POST /arena/snapshot) usa o CONJUNTO ARENA quando ele existe (achado do Servidor 14/11):
// FC e atributos batem com o pvp.gear que vai junto. Sys.loadouts.preview calcula sem equipar nada e sem mexer no save.
// SYSDIR (opcional) = pasta do loadouts.js e do arenanet.js a testar.
'use strict';
const assert=require('assert'), path=require('path');
const D=process.env.SYSDIR||path.join(__dirname,'../../js/sys');
globalThis.Sys=globalThis.Sys||{};
['stats','fc','level','tower','pet','mount','grimoire','arena','arenaset'].forEach(m=>require('../../js/sys/'+m+'.js'));
const LO=require(path.join(D,'loadouts.js')), AN=require(path.join(D,'arenanet.js')), AS=Sys.arenaSet;
let n=0; const t=async(name,fn)=>{ await fn(); n++; console.log('ok -',name); };

function world(){ const S={inv:[],eq:{},sys:{level:{lvl:60,xp:0}}}; let id=1;
  const add=(slot,r,on)=>{ const it={id:id++,slot,e:0,r,lvl:1,subs:[],name:slot+id}; S.inv.push(it); if(on) S.eq[slot]=it.id; return it; };
  const host={t:Date.UTC(2026,10,14,15),items:()=>S.inv,level:()=>60,onChange:()=>{},
    equipped:()=>{ const r={}; for(const s in S.eq){ const it=S.inv.find(x=>x.id===S.eq[s]); if(it) r[s]=it; } return r; },
    equip:it=>{ const x=S.inv.find(q=>q.id===it.id); if(!x) return false; S.eq[x.slot]=x.id; return true; }};
  host.now=()=>host.t; return {S,host,add}; }
const sent=[]; Sys.net={_call:async(m,p,b)=>{ sent.push({k:m+' '+p,b}); return {ok:true}; },serverNow:()=>Date.now()};

(async()=>{
  LO.DATA.on=true; AS.DATA.on=true; AN.DATA.on=true;
  await t('preview: peças do conjunto Arena entram na conta; o save e o equipado não mudam',async()=>{ const w=world();
    const weak=w.add('weapon',0,true), strong=w.add('weapon',4,false);
    S_eq(w); LO.save(w.S,'arena',w.host); w.S.eq.weapon=weak.id;   // conjunto Arena = arma forte; equipado agora = arma fraca
    const before=JSON.stringify([w.S.eq,w.S.inv,w.S.sys.loadouts]), v=LO.preview(w.S,'arena',w.host); assert.ok(v.ok);
    assert.strictEqual(v.host.equipped().weapon.id,strong.id); assert.strictEqual(w.host.equipped().weapon.id,weak.id); assert.strictEqual(JSON.stringify([w.S.eq,w.S.inv,w.S.sys.loadouts]),before);
    assert.ok(Sys.fc.compute(v.S,v.host)>Sys.fc.compute(w.S,w.host),'FC do conjunto Arena é maior');
    function S_eq(w){ w.S.eq.weapon=strong.id; } });
  await t('snapshot: a FC mandada é a do conjunto Arena (a mesma do pvp.gear), não a do equipado',async()=>{ const w=world();
    const weak=w.add('weapon',0,true), strong=w.add('weapon',4,false); w.S.eq.weapon=strong.id; LO.save(w.S,'arena',w.host); w.S.eq.weapon=weak.id;
    sent.length=0; const r=await AN.snapshot(w.S,w.host,true); assert.ok(r.ok,JSON.stringify(r)); const b=sent.find(x=>/snapshot/.test(x.k)).b;
    const v=LO.preview(w.S,'arena',w.host); assert.strictEqual(b.fc,Sys.tower.playerStats(v.S,v.host).fc); assert.notStrictEqual(b.fc,Sys.tower.playerStats(w.S,w.host).fc);
    assert.strictEqual(b.pvp.gear.weapon,strong.id); });
  await t('sem conjunto Arena (ou com o arenaSet desligado): o retrato é o equipado, como antes',async()=>{ const w=world(); w.add('weapon',2,true);
    sent.length=0; await AN.snapshot(w.S,w.host,true); let b=sent.find(x=>/snapshot/.test(x.k)).b; assert.strictEqual(b.fc,Sys.tower.playerStats(w.S,w.host).fc);
    const w2=world(); const a=w2.add('weapon',0,true), c=w2.add('weapon',4,false); w2.S.eq.weapon=c.id; LO.save(w2.S,'arena',w2.host); w2.S.eq.weapon=a.id;
    AS.DATA.on=false; sent.length=0; await AN.snapshot(w2.S,w2.host,true); b=sent.find(x=>/snapshot/.test(x.k)).b; AS.DATA.on=true;
    assert.strictEqual(b.fc,Sys.tower.playerStats(w2.S,w2.host).fc); assert.strictEqual(b.pvp,undefined); });
  console.log(n+' testes ok');
})().catch(e=>{ console.error(e); process.exit(1); });
