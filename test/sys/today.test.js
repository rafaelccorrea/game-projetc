// node test/sys/today.test.js — Sys.today (lista "Hoje" + "Pegar tudo", desligada): junta o que dá para pegar agora; "Pegar tudo" só resgata
// (nunca gasta moeda/entrada/picareta/Brasa, nunca começa luta, nunca pega a trilha premium); módulo ausente/desligado/com erro é pulado
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','loot','forge','practice','pet','pass','activity','login','mail','chest','instances','bonfire','thief','relics','dig','mapchest','camp','today'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const T=Sys.today;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=()=>{ const h=makeHost({now:Date.UTC(2026,10,13,15,0,0),eraMax:1,level:40}); h.spent=0; h.spendGold=x=>{ h.spent+=x; return true; }; h.canSpendGold=()=>true; return h; };
/* liga as chaves pedidas e desliga no fim */
function withOn(keys,fn){ const save=[]; const set=(obj,k,v)=>{ save.push([obj,k,obj[k]]); obj[k]=v; };
  set(T.DATA,'on',true); for(const [m,k] of keys) set(Sys[m].DATA,k,true);
  try{ fn(); } finally{ for(const [o,k,v] of save.reverse()) o[k]=v; } }

t('DESLIGADA por padrão: lista vazia, Pegar tudo não faz nada',()=>{ assert.strictEqual(T.DATA.on,false); const S={}, h=host();
  assert.deepStrictEqual(T.list(S,h),[]); assert.strictEqual(T.claimAll(S,h).reason,'off'); assert.strictEqual(T.badge(S,h),0); });
t('junta login, correio e missões prontas; Pegar tudo resgata e some da lista',()=>withOn([['login','enabled'],['mail','enabled']],()=>{ const S={}, h=host();
  Sys.mail.send(S,h,{title:'Prêmio',att:{gems:5}}); Sys.pass.track(S,h,'chest',1); Sys.pass.track(S,h,'summon',1);
  const L=T.list(S,h), ids=L.map(x=>x.id); assert.ok(ids.includes('login')&&ids.includes('mail')&&ids.includes('missions'),ids.join());
  assert.strictEqual(L.find(x=>x.id==='missions').count,2); assert.ok(L.every(x=>x.kind==='claim'||x.kind==='go'));
  const g0=h.gems, r=T.claimAll(S,h); assert.ok(r.ok&&r.by.login===1&&r.by.mail===1&&r.by.missions===2,JSON.stringify(r.by)); assert.ok(h.gems>g0);
  assert.strictEqual(h.spent,0,'não gasta ouro'); const ids2=T.list(S,h).map(x=>x.id); assert.ok(!ids2.includes('login')&&!ids2.includes('mail')&&!ids2.includes('missions'));
  assert.strictEqual(T.claimAll(S,h).reason,'empty'); }));
t('atividade vem depois das missões (os pontos saem delas) e abre o baú no mesmo Pegar tudo',()=>withOn([['activity','on']],()=>{ const S={}, h=host();
  Sys.pass.track(S,h,'chest',1); Sys.pass.track(S,h,'summon',1); const r=T.claimAll(S,h); assert.strictEqual(r.by.missions,2); assert.strictEqual(r.by.activity,1,'30 pontos (baú + invocação) abrem o baú dos 20'); }));
t('linhas "go" só avisam: Ladrão, Escavação, Fogueira e Instâncias não mudam no Pegar tudo',()=>withOn([['thief','on'],['dig','on'],['bonfire','on']],()=>{ const S={}, h=host();
  Sys.bonfire.addBrasas(S,'thief',3); const L=T.list(S,h), go=L.filter(x=>x.kind==='go').map(x=>x.id);
  assert.ok(go.includes('thief')&&go.includes('dig')&&go.includes('bonfire')&&go.includes('instances'),go.join());
  const before=JSON.stringify([Sys.thief.view(S,h).left,Sys.dig.view(S,h).picks,Sys.bonfire.view(S,h).bra,Sys.instances.status(S,h).total]);
  const r=T.claimAll(S,h); assert.ok(!r.by.thief&&!r.by.dig&&!r.by.bonfire&&!r.by.instances); assert.ok(r.left.some(x=>x.id==='dig'));
  assert.strictEqual(JSON.stringify([Sys.thief.view(S,h).left,Sys.dig.view(S,h).picks,Sys.bonfire.view(S,h).bra,Sys.instances.status(S,h).total]),before); }));
t('baús de abate: abre os guardados; mochila cheia bloqueia (fica na lista como bloqueado)',()=>withOn([],()=>{ const S={}, h=host(); const o=Sys.chest.refresh(S,h); o.stored=2;
  h.bagFull=()=>true; let row=T.list(S,h).find(x=>x.id==='chest'); assert.ok(row&&row.blocked==='bag'); assert.ok(!T.claimAll(S,h).by.chest); assert.strictEqual(Sys.chest.progress(S,h).stored,2);
  h.bagFull=()=>false; const r=T.claimAll(S,h); assert.strictEqual(r.by.chest,2); assert.strictEqual(Sys.chest.progress(S,h).stored,0); assert.ok(h.items.length>0); }));
t('passe: só a trilha GRÁTIS; a premium (mesmo comprada) fica para a tela do passe',()=>withOn([],()=>{ const S={}, h=host(); const P=Sys.pass, o=P.ensure(S);
  o.premium=true; o.xp=P.DATA.xpPerTier*2; const row=T.list(S,h).find(x=>x.id==='passFree'); assert.ok(row&&row.count>=1);
  T.claimAll(S,h); assert.ok(P.ensure(S).free.length>=1); assert.deepStrictEqual(P.ensure(S).prem,[],'premium intocada'); }));
t('acampamento e baús do mapa (quando ligados) entram no Pegar tudo',()=>withOn([['camp','on'],['mapChest','on']],()=>{ const S={}, h=host(); h._stage=40;
  const C=Sys.camp.ensure(S,h); for(const k in C.tents) C.tents[k].acc=3; const ids=T.list(S,h).map(x=>x.id); assert.ok(ids.includes('camp'),ids.join());
  const r=T.claimAll(S,h); assert.strictEqual(r.by.camp,1); assert.strictEqual(h.spent,0); }));
t('defensivo: módulo com erro ou ausente é pulado, a lista continua',()=>withOn([['login','enabled']],()=>{ const S={}, h=host(); const keep=Sys.pass.list; Sys.pass.list=()=>{ throw new Error('x'); };
  try{ const L=T.list(S,h); assert.ok(L.some(x=>x.id==='login')&&!L.some(x=>x.id==='missions')); assert.ok(T.claimAll(S,h).by.login===1); } finally{ Sys.pass.list=keep; }
  const keepS=globalThis.Sys; globalThis.Sys={today:T}; try{ assert.deepStrictEqual(T.list({},h),[]); assert.strictEqual(T.claimAll({},h).reason,'empty'); } finally{ globalThis.Sys=keepS; } }));
t('não cria prêmio nem guarda estado: código sem addGold/addGems/preço; save sem S.sys.today',()=>withOn([],()=>{ const S={}, h=host(); T.list(S,h); T.claimAll(S,h); assert.ok(!S.sys||!S.sys.today);
  const src=require('fs').readFileSync(require('path').join(__dirname,'../../js/sys/today.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  assert.ok(!/addGold|addGems|spendGold|spendBrasas|productId|price|Math\.random|\.enter\(|\.sweep\(|\.start\(|\.hit\(|'premium'/i.test(src)); }));
console.log(n+' testes ok');
