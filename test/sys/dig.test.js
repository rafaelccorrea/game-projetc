// node test/sys/dig.test.js — Sys.dig (Escavação, desligada): camada 5×6 FIXA pela semente, picaretas grátis que voltam com o tempo,
// terra 1 toque / rocha 2, vizinhança, escada, profundidade presa à era do herói, pedras de prática e fragmentos de relíquia, bomba e broca,
// prêmio guardado sem os módulos, sem ouro e nada à venda
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','practice','relics','dig'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const D=Sys.dig, P=Sys.practice, R=Sys.relics;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=(fn,rel)=>{ const a=D.DATA.on, b=R.DATA.on; D.DATA.on=true; R.DATA.on=rel!==false; try{ fn(); } finally{ D.DATA.on=a; R.DATA.on=b; } };
const host=o=>makeHost(Object.assign({now:Date.UTC(2026,10,13,15,0,0),eraMax:0},o||{}));
const MIN=60000;
/* cava a camada inteira, linha por linha (sempre pode: linha de cima aberta libera a de baixo) */
function digAll(S,h){ const out=[]; for(let r=0;r<D.DATA.rows;r++) for(let c=0;c<D.DATA.cols;c++){ let x; do{ x=D.hit(S,h,r,c); if(!x.ok) return {stop:x,out}; out.push(x); }while(x.hp>0); } return {out}; }

t('DESLIGADA por padrão: não cava, view não muda o save',()=>{ assert.strictEqual(D.DATA.on,false); const S={}, h=host();
  assert.strictEqual(D.hit(S,h,0,0).reason,'off'); assert.strictEqual(D.descend(S,h).reason,'off'); assert.strictEqual(D.grant(S,h,'daily').reason,'off');
  const v=D.view(S,h); assert.ok(!v.on&&v.cells.length===30&&v.paid===false); assert.ok(!S.sys,'view desligada não grava'); });
t('camada FIXA pela semente: igual sempre; 1 escada fora da 1ª linha, 6 pedras, 2 fragmentos; bomba/broca nas camadas certas',()=>{
  for(let d=0;d<40;d++){ const a=D.layout(d,0), b=D.layout(d,0); assert.deepStrictEqual(a,b);
    const it=a.map(c=>c.item).filter(Boolean), k=x=>it.filter(i=>i.t===x).length;
    assert.strictEqual(k('stairs'),1); assert.ok(a.findIndex(c=>c.item&&c.item.t==='stairs')>=D.DATA.cols); assert.strictEqual(k('stones'),6); assert.strictEqual(k('frag'),2);
    assert.strictEqual(k('bomb'),(d+1)%3===0?1:0); assert.strictEqual(k('drill'),(d+1)%5===0?1:0);
    it.filter(i=>i.t==='frag').forEach(i=>assert.ok(i.era>=0&&i.era<=D.eraOfDepth(d))); }
  assert.notDeepStrictEqual(D.layout(0,0),D.layout(0,1),'outra volta = outra camada'); });
t('picaretas: começa com 20; terra 1 toque, rocha 2; só linha de cima ou vizinha de aberta',()=>on(()=>{ const S={}, h=host(); const L=D.layout(0,0);
  assert.strictEqual(D.view(S,h).picks,20); assert.strictEqual(D.hit(S,h,2,0).reason,'blocked');
  const r=D.hit(S,h,0,0); assert.strictEqual(r.picks,19); if(L[0].k==='rock'){ assert.ok(r.hp===1&&!r.opened.length); const r2=D.hit(S,h,0,0); assert.ok(r2.opened.length===1); } else assert.ok(r.opened.length===1);
  assert.ok(D.hit(S,h,1,0).ok,'vizinha de aberta'); assert.strictEqual(D.hit(S,h,0,0).reason,'cell','já aberta'); }));
t('sem picareta não cava; volta 1 a cada 30 min até 20; relógio para trás não dá picareta',()=>on(()=>{ const S={}, h=host(); D.ensure(S,h).e=0;
  const x=D.hit(S,h,0,0); assert.ok(x.reason==='picks'&&x.nextInMs===30*MIN); h.t+=29*MIN; assert.strictEqual(D.view(S,h).picks,0); h.t+=MIN; assert.strictEqual(D.view(S,h).picks,1);
  h.t+=100*30*MIN; assert.strictEqual(D.view(S,h).picks,20); h.t-=5*3600000; assert.strictEqual(D.view(S,h).picks,20); h.t+=60*MIN; assert.strictEqual(D.view(S,h).picks,20,'cheio não acumula'); }));
t('cavar a camada toda: pedras entram no Sys.practice, fragmentos no Sys.relics; escada desce',()=>on(()=>{ const S={}, h=host(); D.ensure(S,h).e=40;
  const L=D.layout(0,0), want=L.filter(c=>c.item&&c.item.t==='stones').reduce((s,c)=>s+c.item.n,0);
  assert.strictEqual(D.descend(S,h).reason,'stairs'); const res=digAll(S,h); assert.ok(!res.stop,'40 picaretas bastam');
  assert.strictEqual(P.ensure(S).stones,want); assert.strictEqual(R.ensure(S).frags[0],2); assert.strictEqual(D.view(S,h).got.stones,want);
  const d=D.descend(S,h); assert.ok(d.ok&&d.depth===1&&d.round===0,'desce para a camada 1'); }));
t('profundidade presa à era: era 0 vai até a camada 9; no fundo a próxima é outra na mesma profundidade',()=>on(()=>{ const S={}, h=host({eraMax:0});
  assert.strictEqual(D.maxDepth(h),9); const o=D.ensure(S,h); o.depth=8; o.grid=o.grid.map(()=>({hp:0,open:true}));
  let d=D.descend(S,h); assert.ok(d.depth===9&&d.round===0); D.ensure(S,h).grid=D.ensure(S,h).grid.map(()=>({hp:0,open:true}));
  d=D.descend(S,h); assert.ok(d.depth===9&&d.round===1&&d.era===0); h._eraMax=1; D.ensure(S,h).grid=D.ensure(S,h).grid.map(()=>({hp:0,open:true}));
  d=D.descend(S,h); assert.ok(d.depth===10&&d.era===1,'era nova libera a camada 10 (Antiguidade)'); }));
t('bomba (cruz) e broca (coluna) não gastam picareta',()=>on(()=>{ const S={}, h=host(); const o=D.ensure(S,h); o.bombs=1; o.drills=1;
  const b=D.bomb(S,h,0,2); assert.ok(b.ok&&b.opened.length===4,'linha de cima: célula + 3 vizinhas'); assert.strictEqual(o.e,20);
  assert.strictEqual(D.bomb(S,h,0,0).reason,'bombs'); const dr=D.drill(S,h,4); assert.ok(dr.ok&&dr.opened.length===6); assert.strictEqual(D.drill(S,h,0).reason,'drills'); assert.strictEqual(D.view(S,h).picks,20); }));
t('sem Sys.relics ligado: fragmentos ficam guardados e entram depois',()=>{ const S={}, h=host();
  on(()=>{ D.ensure(S,h).e=40; digAll(S,h); assert.strictEqual(D.view(S,h).pend.frags[0],2); },false);
  on(()=>{ D.flush(S,h); assert.strictEqual(D.view(S,h).pend.frags[0],0); assert.strictEqual(R.ensure(S).frags[0],2); }); });
t('fontes fixas: missões do dia +5 (1 vez por dia, passa do teto até 40), Senhor da Era 1 bomba por era, evento',()=>on(()=>{ const S={}, h=host();
  const a=D.grant(S,h,'daily'); assert.ok(a.ok&&a.picks===5); assert.strictEqual(D.view(S,h).picks,25); assert.strictEqual(D.grant(S,h,'daily').reason,'daily');
  h.t+=86400000; assert.ok(D.grant(S,h,'daily').ok); assert.ok(D.grant(S,h,'eraLord',{era:0}).bombs===1); assert.strictEqual(D.grant(S,h,'eraLord',{era:0}).reason,'done');
  const e=D.grant(S,h,'event'); assert.ok(e.picks===10&&e.drills===1); D.grant(S,h,'event'); assert.strictEqual(D.view(S,h).picks,40,'teto de 40'); }));
t('nada à venda: loja/recarga/anúncio recusados; sem ouro, preço ou Math.random',()=>on(()=>{ const S={}, h=host();
  for(const s of ['shop','gems','refill','ads','pay']) assert.strictEqual(D.grant(S,h,s).reason,'forbidden');
  const src=require('fs').readFileSync(require('path').join(__dirname,'../../js/sys/dig.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  assert.ok(!/addGold|addGems|productId|brl|price|Math\.random|host\.rng/i.test(src)); assert.strictEqual(h.gold,0); }));
t('save estranho é consertado',()=>on(()=>{ const S={sys:{dig:{v:1,e:999,grid:[1,2],pend:{stones:-3,frags:'x'},depth:-4}}}, h=host(); const o=D.ensure(S,h);
  assert.ok(o.e===40&&o.grid.length===30&&o.pend.stones===0&&o.pend.frags.length===9&&o.depth===0); }));
console.log(n+' testes ok');
