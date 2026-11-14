// node test/sys/grimoire-fontes.test.js — Grimório: fontes do dia (Sys.grimoire.onSource): Instância diária, Torre, Missões diárias e Eventos
// pagam páginas e tinta PEQUENAS, com teto por fonte, teto do dia somado e id único (nunca paga 2 vezes). Desligado = nada.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['clock','grimoire'].forEach(m=>{ try{ require('../../js/sys/'+m+'.js'); }catch(e){ if(m==='grimoire') throw e; } });
const {makeHost}=require('./_host.js');
const G=Sys.grimoire, D=G.DATA;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ const k=D.on; G.setOn(true); try{ fn(); } finally { G.setOn(k); } };
const DAY=24*3600*1000;
/* save com a B da era 1 (Lança do Minotauro) já aprendida, para a instância poder juntar página */
const fresh=()=>{ const S={}; G.ensure(S).own.minotaurSpear={lv:1,pages:0}; return S; };

t('desligado: nada paga, nada é gravado',()=>{
  assert.strictEqual(D.on,false); const S={}, h=makeHost({eraMax:1});
  for(const s of ['instance','tower','mission','event']){ const r=G.onSource(S,h,s,{id:'x',floor:10,spell:'cannonball'}); assert.strictEqual(r.ok,false); assert.strictEqual(r.reason,'off'); assert.strictEqual(r.pages+r.ink,0); }
  assert.strictEqual(S.sys,undefined,'nem cria o estado');
});

t('instância: 1 página da B da era jogada (se aprendida) + 3 tinta; sem a B aprendida, só a tinta',()=>withOn(()=>{
  let S=fresh(), h=makeHost({eraMax:1});
  let r=G.onSource(S,h,'instance',{id:'gold-3-1',era:1}); assert.deepStrictEqual([r.ok,r.pages,r.ink,r.spell,r.reason],[true,1,3,'minotaurSpear','']);
  assert.strictEqual(G.ensure(S).own.minotaurSpear.pages,1); assert.strictEqual(G.ensure(S).ink,3); assert.ok(h.changes>0);
  S={}; r=G.onSource(S,h,'instance',{id:'gold-3-2',era:1}); assert.deepStrictEqual([r.ok,r.pages,r.ink,r.spell],[true,0,3,null]); assert.strictEqual(G.ensure(S).own.minotaurSpear,undefined,'instância não ensina');
}));

t('Torre: só o andar múltiplo de 10 paga (5 tinta); os outros devolvem skip',()=>withOn(()=>{
  const S=fresh(), h=makeHost({});
  assert.strictEqual(G.onSource(S,h,'tower',{id:'tower:7',floor:7}).reason,'skip');
  assert.strictEqual(G.onSource(S,h,'tower',{id:'tower:x'}).reason,'skip','sem andar');
  const r=G.onSource(S,h,'tower',{id:'tower:10',floor:10}); assert.deepStrictEqual([r.ok,r.pages,r.ink],[true,0,5]);
  assert.strictEqual(G.onSource(S,h,'tower',{id:'tower:20',floor:20}).reason,'cap','um marco por dia');
}));

t('missões diárias: 1 tinta cada, até 5 no dia; o mesmo id de missão volta a pagar no dia seguinte',()=>withOn(()=>{
  const S=fresh(), h=makeHost({});
  for(const m of ['d_kill','d_ult','d_chest','d_inst','d_forge']){ const r=G.onSource(S,h,'mission',{id:m}); assert.deepStrictEqual([r.ok,r.ink,r.pages],[true,1,0],m); }
  assert.strictEqual(G.onSource(S,h,'mission',{id:'d_summon'}).reason,'cap');
  assert.strictEqual(G.onSource(S,h,'mission',{id:'d_kill'}).reason,'dup');
  h.t+=DAY; const r=G.onSource(S,h,'mission',{id:'d_kill'}); assert.ok(r.ok&&r.ink===1,'missão diária é do dia');
}));

t('evento: 1 página da magia que o evento diz + 2 tinta (pode ensinar); sem magia, página da A da era se já aprendida (senão só a tinta)',()=>withOn(()=>{
  let S={}, h=makeHost({});
  let r=G.onSource(S,h,'event',{id:'ev1:100',spell:'plasmaRay'}); assert.deepStrictEqual([r.ok,r.pages,r.ink,r.spell,r.learned],[true,1,2,'plasmaRay',true]);
  assert.strictEqual(G.levelOf(S,'plasmaRay'),1);
  S={}; r=G.onSource(S,h,'event',{id:'ev1:200'}); assert.deepStrictEqual([r.ok,r.pages,r.ink,r.spell],[true,0,2,null]);
  S={}; r=G.onSource(S,h,'event',{id:'ev1:300',spell:'naoExiste'}); assert.deepStrictEqual([r.pages,r.ink],[0,2]);
  const A0=G.DATA.spells.filter(x=>x.era===0)[0]; S={}; G.ensure(S); G.onSource(S,h,'event',{id:'ev3:0',spell:A0.id}); h.t+=DAY; r=G.onSource(S,h,'event',{id:'ev3:1',era:0}); assert.strictEqual(r.spell,A0.id,'sem magia do evento: página da A da era, já aprendida'); assert.strictEqual(r.pages,1);
}));

t('mesmo ctx.id não paga duas vezes, nem na virada do dia; sem id não paga',()=>withOn(()=>{
  const S=fresh(), h=makeHost({eraMax:1});
  assert.ok(G.onSource(S,h,'instance',{id:'run-1',era:1}).ok);
  const r=G.onSource(S,h,'instance',{id:'run-1',era:1}); assert.deepStrictEqual([r.ok,r.reason,r.pages,r.ink],[false,'dup',0,0]);
  h.t+=DAY; assert.strictEqual(G.onSource(S,h,'instance',{id:'run-1',era:1}).reason,'dup','o dia anterior ainda é lembrado');
  assert.ok(G.onSource(S,h,'instance',{id:'run-2',era:1}).ok,'outra corrida no dia novo paga');
  assert.strictEqual(G.onSource(S,h,'event',{}).reason,'id'); assert.strictEqual(G.onSource(S,h,'event',{id:''}).reason,'id');
  assert.strictEqual(G.onSource(S,h,'shop',{id:'a'}).reason,'src'); assert.strictEqual(G.onSource(S,h,'eraLord',{id:'a'}).reason,'src','chefe não entra por aqui');
  assert.strictEqual(G.ensure(S).ink,6);
}));

t('teto por fonte: a 2ª instância do dia não paga; volta no dia seguinte',()=>withOn(()=>{
  const S=fresh(), h=makeHost({eraMax:1});
  assert.ok(G.onSource(S,h,'instance',{id:'a',era:1}).ok); const r=G.onSource(S,h,'instance',{id:'b',era:1}); assert.deepStrictEqual([r.ok,r.reason],[false,'cap']);
  h.t+=DAY; assert.ok(G.onSource(S,h,'instance',{id:'c',era:1}).ok);
}));

t('teto do DIA somado: 12 tinta e 2 páginas, mesmo com todas as fontes no máximo; corta em parte',()=>withOn(()=>{
  const S=fresh(), h=makeHost({eraMax:1}); let ink=0, pages=0; const add=r=>{ ink+=r.ink; pages+=r.pages; return r; };
  add(G.onSource(S,h,'instance',{id:'i',era:1}));              // 1 p + 3
  add(G.onSource(S,h,'tower',{id:'t10',floor:10}));            // 5  -> 8
  add(G.onSource(S,h,'event',{id:'e',spell:'minotaurSpear'})); // 1 p + 2 -> 10
  for(const m of ['m1','m2','m3','m4','m5']) add(G.onSource(S,h,'mission',{id:m}));   // só 2 cabem -> 12
  assert.strictEqual(ink,D.sourceCap.ink); assert.strictEqual(pages,D.sourceCap.pages);
  assert.strictEqual(G.ensure(S).ink,12); assert.strictEqual(G.ensure(S).own.minotaurSpear.pages,2);
  const v=G.sourceToday(S,h); assert.deepStrictEqual(v.tot,{pages:2,ink:12}); assert.strictEqual(v.by.mission.ink,2);
  /* corte em parte: com 11 de tinta no dia, o evento (1 página + 2 tinta) paga a página e só 1 de tinta */
  const S2=fresh(), h2=makeHost({eraMax:1}); G.onSource(S2,h2,'instance',{id:'i',era:1}); G.onSource(S2,h2,'tower',{id:'t',floor:30});
  for(const m of ['m1','m2','m3']) G.onSource(S2,h2,'mission',{id:m});   // 3+5+3 = 11
  const r=G.onSource(S2,h2,'event',{id:'e1',spell:'minotaurSpear'}); assert.deepStrictEqual([r.ok,r.pages,r.ink],[true,1,1]);
  assert.strictEqual(G.onSource(S2,h2,'mission',{id:'m4'}).reason,'cap');
}));

t('calibração: as 4 fontes no teto ficam em no máximo ~50% do que os chefes dão por dia ao jogador ativo (1 era: 30 tinta, 4 páginas)',()=>{
  const bossInk=D.grants.eraLord.ink+D.grants.chief50.ink, bossPages=2+2*D.grants.eraLordRepeat.n;
  assert.strictEqual(bossInk,30); assert.strictEqual(bossPages,4);
  assert.ok(D.sourceCap.ink<=bossInk*0.5); assert.ok(D.sourceCap.pages<=bossPages*0.5);
  for(const k in D.sources){ const s=D.sources[k]; assert.ok((s.ink||0)<=5&&(s.pages||0)<=1,k+' quantia pequena'); assert.ok(s.cap&&(s.cap.ink||0)<=5&&(s.cap.pages||0)<=1,k+' teto pequeno'); }
});

t('a tela (DATA.grants) mostra os mesmos números das fontes',()=>{
  const g=D.grants, s=D.sources;
  assert.strictEqual(g.instance.n,s.instance.pages); assert.strictEqual(g.instance.ink,s.instance.ink);
  assert.strictEqual(g.tower.ink,s.tower.ink); assert.strictEqual(s.tower.every,10);
  assert.strictEqual(g.daily.ink,s.mission.cap.ink); assert.strictEqual(g.event.n,s.event.pages);
  for(const k of Object.keys(s)) assert.ok(!D.forbidden.includes(k),'nenhuma fonte de loja');
});

t('os chefes seguem pelo grant de sempre; a instância só junta página da B depois de aprendida',()=>withOn(()=>{
  const S={}, h=makeHost({eraMax:1}); const r=G.grant(S,h,'eraLord',{era:1}); assert.ok(r.ok&&r.learned==='bronzePhalanx'&&r.ink===20);
  assert.strictEqual(G.onSource(S,h,'instance',{id:'z',era:1}).spell,null,'a B da era 1 ainda não foi aprendida');
}));

console.log(n+' testes ok');
