// TUDO LIGADO JUNTO (BACKLOG_URGENTE, ordem do dono: "tudo aprovado tem que ficar funcional"): liga TODAS as chaves da fps-e2 ao mesmo tempo e faz
// uma jornada de jogador (nível 1 → era 8) conferindo que nada quebra quando os sistemas convivem: sem exceção, sem NaN/Infinity no save, FC finita e
// crescente com o progresso, save que volta igual depois de JSON (como no localStorage/servidor) e regras de dinheiro respeitadas.
// Processo próprio (as chaves são globais do módulo; não vazam para os outros testes).
'use strict';
const assert=require('assert');
const {makeHost}=require('./_host.js');
const R='../../js/sys/';
const mods=['clock','stats','fc','level','loot','forge','practice','tower','instances','chest','pet','vip','pass','skin','titles','arena','events','login','mail','guide','mount','offer','appearance','phases','guild'];
const Sys={}; for(const m of mods){ try{ Sys[m]=require(R+m+'.js'); }catch(e){ throw new Error('carregar '+m+': '+e.message); } }
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };

// ---------- liga tudo o que é da fps-e2 ----------
function allOn(){
  Sys.level.setV9(true); Sys.stats.setEra9(true); Sys.stats.setDivine(true); Sys.stats.DATA.quality.on=true; Sys.stats.DATA.futureEra.on=true;
  Sys.pet.DATA.v3=true; Sys.pet.DATA.v4=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true);
  Sys.mount.DATA.on=true; Sys.offer.DATA.on=true; Sys.phases.DATA.on=true; Sys.guild.DATA.on=true;
}
allOn();

const scanBad=(o,path,out)=>{ if(typeof o==='number'){ if(!isFinite(o)) out.push(path); return out; } if(o&&typeof o==='object') for(const k in o) scanBad(o[k],path+'.'+k,out); return out; };
function mkHost(S,o){ const h=makeHost(Object.assign({eraMax:0},o||{})); h.inv=[]; h.eq={};
  h.addItem=it=>{ h.inv.push(it); if(!h.eq[it.slot]) h.eq[it.slot]=it; }; h.equipped=()=>h.eq;
  h.eraMax=()=>Sys.phases.eraMax(S); h.level=()=>Sys.level.level(S); h.spendGold=g=>{ if(h.gold<g) return false; h.gold-=g; return true; }; h.canSpendGold=g=>h.gold>=g;
  return h; }
const ensureAll=(S,h)=>{ for(const m of mods){ const M=Sys[m]; if(M&&typeof M.ensure==='function') M.ensure(S,h); } };

t('todas as chaves ligam juntas e os módulos carregam sem DOM',()=>{
  assert.strictEqual(Sys.level.DATA.maxLevel,120); assert.strictEqual(Sys.stats.maxR(),5); assert.strictEqual(Sys.stats.DATA.maxEra,8);
  assert.ok(Sys.pet.DATA.v17.on&&Sys.mount.DATA.on&&Sys.offer.DATA.on&&Sys.phases.DATA.on);
  assert.strictEqual(typeof document,'undefined');
});

t('jornada nível 1 → era 8 com tudo ligado: sem exceção, sem NaN, FC cresce, save volta igual',()=>{
  const S={best:1,kills:0,eraMax:0,skins:['w00','a00'],inv:[]}, h=mkHost(S); ensureAll(S,h);
  // oferta de 1ª compra no 1º acesso (janela de 24 h), arma acompanha, montaria Épica
  const st=Sys.offer.status(S,h); assert.ok(st.available,'oferta no 1º acesso');
  const g=Sys.offer.grant(S,h); assert.ok(g.ok&&g.mount&&g.mount.isNew); assert.ok(Sys.offer.grant(S,h).reason==='done','uma vez só');
  assert.strictEqual(Sys.mount.ensure(S).eq,'wolf');
  const fc0=Sys.fc.compute(S,h); assert.ok(isFinite(fc0)&&fc0>0,'FC inicial '+fc0);
  let lastFc=fc0, eggDone=false, kael=[];
  for(let e=0;e<=8;e++){
    const req=Sys.phases.DATA.required[e];
    for(let d=0;d<req;d++) for(let k=1;k<=100;k++){
      const c=Sys.phases.canChallenge(S,h,e,d,k,Sys.fc.compute(S,h));
      if(!c.ok){ assert.strictEqual(c.reason,'level','fase '+[e,d,k]+' travada por '+c.reason); Sys.level.ensure(S).lvl=c.needLevel; }
      const w=Sys.phases.win(S,h,e,d,k); assert.ok(w.ok,'vencer '+[e,d,k]+' '+w.reason);
      const en=Sys.phases.enemy(e,d,k,'boss'); assert.ok(en.hp>0&&en.dmg>0&&en.def>=0&&isFinite(en.hp));
    }
    // a cada era: XP pelo caminho normal, pet (ovo do Nv 20), montaria sobe, item da era equipado (qualidade/fusão ligadas)
    Sys.level.addXp(S,1e6,h,'kill');
    if(!eggDone&&Sys.level.level(S)>=20){ const r=Sys.pet.firstEgg(S,h); assert.ok(r&&r.ok!==false,'ovo do Nv 20: '+JSON.stringify(r)); eggDone=true;
      const bi=Sys.pet.battleInfo(S,h); assert.ok(bi&&bi.id&&bi.draw,'pet na batalha'); }
    h.gold+=1e30; Sys.mount.upgrade(S,h,'wolf',5);
    const it={slot:'weapon',e,r:Math.min(Sys.stats.maxR(),[1,1,2,2,2,3,4,4,5][e]),lvl:Sys.level.level(S),gold:0,look:e,qp:5000}; Sys.stats.ensureSubs&&Sys.stats.ensureSubs(it,h.rng); h.eq.weapon=it;
    const fc=Sys.fc.compute(S,h); assert.ok(isFinite(fc)&&fc>=lastFc,'FC na era '+e+': '+fc+' < '+lastFc); lastFc=fc;
    let sg=Sys.level.stage(S,h); while(sg.ready){ assert.ok(Sys.level.evolve(S,h).ok!==false,'evoluir o Kael'); sg=Sys.level.stage(S,h); } kael.push(sg.stage);
    assert.ok(Array.isArray(Sys.appearance.layers(S,h)),'aparência');
  }
  assert.strictEqual(Sys.phases.eraMax(S),8); assert.ok(Sys.phases.eraCleared(S,8));
  assert.ok(kael.every((x,i)=>i===0||x>=kael[i-1]),'Kael não volta de fase'); assert.strictEqual(kael[8],3,'Kael chega a guerreiro lendário: '+kael);
  const bad=scanBad(S,'S',[]); assert.deepStrictEqual(bad,[],'números inválidos no save');
  // save volta igual depois de JSON e de todos os ensure (migração idempotente)
  const j=JSON.stringify(S), S2=JSON.parse(j), h2=mkHost(S2); h2.eq=h.eq; ensureAll(S2,h2); ensureAll(S2,h2);
  assert.strictEqual(Sys.fc.compute(S2,h2),Sys.fc.compute(S,h),'FC igual depois de recarregar');
  assert.deepStrictEqual(Sys.phases.ensure(S2),Sys.phases.ensure(S)); assert.deepStrictEqual(Sys.mount.ensure(S2),Sys.mount.ensure(S));
});

t('regra de dinheiro com tudo ligado: quem já comprou não vê a oferta; oferta vencida não entrega',()=>{
  const S={best:1,kills:0,eraMax:0,skins:['w00','a00'],inv:[]}, h=mkHost(S); ensureAll(S,h);
  Sys.offer.markPurchase(S,h); assert.strictEqual(Sys.offer.status(S,h).reason,'not_first_purchase');
  const S3={best:1,kills:0,eraMax:0,skins:['w00','a00'],inv:[]}, h3=mkHost(S3); ensureAll(S3,h3); h3.t+=25*3600*1000;
  assert.strictEqual(Sys.offer.grant(S3,h3).reason,'expired');
});

t('save de hoje (10 fases por era) migra para a Revisão 2 sem perder caminho',()=>{
  const S={best:24,stage:24,kills:500,eraMax:2,skins:['w00','a00'],inv:[]}, h=mkHost(S); ensureAll(S,h);
  const m=Sys.phases.migrate(S,h); assert.ok(m.migrated); assert.strictEqual(Sys.phases.eraMax(S),2); assert.deepStrictEqual(Sys.phases.ensure(S).cur,{e:2,d:0,n:31});
});

t('guilda com tudo ligado: estandartes no teto dão no máximo +5% de FC (o único poder da guilda)',()=>{
  const S={best:1,kills:0,eraMax:0,skins:['w00','a00'],inv:[]}, h=mkHost(S); ensureAll(S,h); Sys.level.ensure(S).lvl=60;
  h.eq.weapon={slot:'weapon',e:2,r:2,lvl:60,gold:0,qp:2500}; h.eq.armor={slot:'armor',e:2,r:2,lvl:60,gold:0,qp:2500};
  const f0=Sys.fc.compute(S,h); Sys.guild.setProvider({online:true,status:()=>({open:true})});
  Sys.guild.applyServer(S,{id:'g',role:'member',level:10,banners:{atk:5,hp:5,def:3,gold:10,food:10},territories:[],joinedAt:h.t});
  const f1=Sys.fc.compute(S,h); assert.ok(f1>f0,'estandarte conta'); assert.ok(f1<=f0*1.0501,'teto +5%: '+(f1/f0)); Sys.guild.setProvider(null);
});

console.log(`ok: ${n} testes`);
