// node test/sys/guild-nome.test.js — NOME DA GUILDA montado com duas listas fixas (sem texto livre; jogo com menores) + estilo + regras de troca
'use strict';
const assert=require('assert');
globalThis.Sys={};
require('../../js/sys/clock.js');
require('../../js/sys/level.js');
const G=require('../../js/sys/guild.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const A=G.nameParts.a, B=G.nameParts.b, L=s=>[...s].length;
const D=86400000;
let NOW=Date.UTC(2026,10,14,15,0,0);
const host={now:()=>NOW,goldUnit:()=>1,canSpendGold:()=>true,level:()=>40};
const open=()=>{ G.DATA.on=true; G.setProvider({online:true,status:()=>({open:true})}); };
const save=g=>({sys:{level:{lvl:40,xp:0},guild:g||{}}});

t('listas do tamanho combinado e exportadas (DATA.nameParts = nameParts)',()=>{
  assert.ok(A.length>=40&&B.length>=40,'~40 em cada'); assert.strictEqual(G.DATA.nameParts.a,A); assert.ok(G.styles.length>=6&&G.styles.length<=8); });
t('todas as combinações cabem em 24 caracteres',()=>{
  const bad=[]; for(const a of A) for(const b of B){ const s=a+' '+b; if(L(s)>G.DATA.nameMax) bad.push(s); }
  assert.deepStrictEqual(bad,[]); assert.strictEqual(G.DATA.nameMax,24); });
t('sem repetição: nas listas, nos estilos e nos nomes (nem sem acento/maiúscula)',()=>{
  const f=x=>G.nameFold(x);
  assert.strictEqual(new Set(A.map(f)).size,A.length,'A repetida'); assert.strictEqual(new Set(B.map(f)).size,B.length,'B repetida');
  assert.strictEqual(new Set(G.styles.map(f)).size,G.styles.length,'estilo repetido');
  const all=new Set(); for(const a of A) for(const b of B) all.add(f(a+' '+b)); assert.strictEqual(all.size,A.length*B.length); });
t('formato das partes: A uma palavra, B começa com da/do/das/dos, NFC e sem espaço sobrando',()=>{
  for(const a of A){ assert.ok(/^\S+$/.test(a),a); assert.strictEqual(a,a.normalize('NFC')); }
  for(const b of B){ assert.ok(/^(da|do|das|dos) \S/.test(b),b); assert.strictEqual(b,b.normalize('NFC')); assert.strictEqual(b,b.trim()); }
  for(const s of G.styles){ assert.strictEqual(s,s.normalize('NFC').trim()); assert.ok(L(s)<=24,s); } });
t('nameOf / nameValid: par inválido recusado',()=>{
  assert.strictEqual(G.nameOf(0,0),'Lobos da Aurora'); assert.ok(G.nameValid(0,0)); assert.ok(G.nameValid(A.length-1,B.length-1));
  for(const [a,b] of [[-1,0],[0,-1],[A.length,0],[0,B.length],[1.5,0],['0',0],[null,0],[undefined,undefined],[NaN,0],[0,Infinity]]){
    assert.strictEqual(G.nameValid(a,b),false,JSON.stringify([a,b])); assert.strictEqual(G.nameOf(a,b),''); } });
t('nameParse ida e volta em TODAS as combinações (e tolera maiúscula, sem acento e espaço a mais)',()=>{
  for(let a=0;a<A.length;a++) for(let b=0;b<B.length;b++) assert.deepStrictEqual(G.nameParse(G.nameOf(a,b)),{a,b});
  assert.deepStrictEqual(G.nameParse('  LOBOS   da aurora '),{a:0,b:0}); assert.deepStrictEqual(G.nameParse('Guardioes do Vulcao'),{a:1,b:1});
  for(const x of ['','Lobos','da Aurora','Lobos da Aurora!','Lobos da Aurora da Aurora','Matadores da Aurora',null,42,{}]) assert.strictEqual(G.nameParse(x),null,String(x)); });
t('nameRandom sempre dá par válido; estilos: styleOf/styleValid',()=>{
  for(const r of [0,0.5,0.999999,1]){ const p=G.nameRandom(()=>r); assert.ok(G.nameValid(p.a,p.b)); }
  assert.strictEqual(G.styleOf(0),'Tranquila'); assert.ok(G.styleValid(G.styles.length-1)); assert.ok(!G.styleValid(G.styles.length)); assert.strictEqual(G.styleOf(-1),''); });
t('save antigo com nome digitado não quebra: mostra o texto até escolher um par',()=>{
  const S=save({id:'g1',name:'Os Brabos 2010',role:'leader'}); const o=G.ensure(S);
  assert.strictEqual(o.nameA,null); assert.strictEqual(o.nameB,null); assert.strictEqual(G.name(S),'Os Brabos 2010');
  assert.strictEqual(o.styleIdx,null); assert.strictEqual(o.renameFree,false); assert.strictEqual(o.renamedAt,0);
  const S2=save({id:'g2',name:'Lobos da Aurora'}); assert.strictEqual(G.ensure(S2).nameA,0); assert.strictEqual(G.name(S2),'Lobos da Aurora');
  assert.strictEqual(G.name({}),''); const S3=save({nameA:3,nameB:3}); G.ensure(S3); assert.strictEqual(S3.sys.guild.nameA,null,'sem guilda não guarda par'); });
t('save guarda o par (índices) e name(S) usa o par; par inválido no save cai no texto',()=>{
  const S=save({id:'g1',name:'qualquer',nameA:2,nameB:3,styleIdx:4}); G.ensure(S);
  assert.strictEqual(G.name(S),'Viajantes das Cavernas'); assert.strictEqual(S.sys.guild.name,'Viajantes das Cavernas'); assert.strictEqual(S.sys.guild.styleIdx,4);
  const S2=save({id:'g1',name:'Velho',nameA:99,nameB:0,styleIdx:99}); G.ensure(S2); assert.strictEqual(G.name(S2),'Velho'); assert.strictEqual(S2.sys.guild.styleIdx,null);
  const back=JSON.parse(JSON.stringify(S)); assert.strictEqual(G.name(back),'Viajantes das Cavernas'); });
t('applyServer: par do servidor vale; sem par, lê o texto; texto livre antigo fica como texto',()=>{
  const S=save({});
  G.applyServer(S,{id:'g1',name:'Lixo',nameA:5,nameB:5,styleIdx:2,renameFree:true,renamedAt:0,styledAt:123,role:'leader',level:1},host);
  const o=S.sys.guild; assert.strictEqual(o.nameA,5); assert.strictEqual(o.nameB,5); assert.strictEqual(G.name(S),'Dragões do Âmbar');
  assert.strictEqual(o.styleIdx,2); assert.strictEqual(o.renameFree,true); assert.strictEqual(o.styledAt,123);
  G.applyServer(S,{id:'g1',name:'Tigres do Gelo',role:'leader',level:1},host); assert.strictEqual(o.nameA,7); assert.strictEqual(o.nameB,4);
  G.applyServer(S,{id:'g1',name:'Nome Antigo',nameA:-1,nameB:2,role:'leader',level:1},host); assert.strictEqual(o.nameA,null); assert.strictEqual(G.name(S),'Nome Antigo'); });
t('status mostra nome, par, nameLegacy e estilo',()=>{ open();
  const S=save({id:'g1',name:'Velho',role:'leader'}); let st=G.status(S,host); assert.strictEqual(st.name,'Velho'); assert.strictEqual(st.nameLegacy,true);
  S.sys.guild.nameA=0; S.sys.guild.nameB=1; S.sys.guild.styleIdx=1; st=G.status(S,host);
  assert.strictEqual(st.name,'Lobos do Vulcão'); assert.strictEqual(st.nameLegacy,false); assert.strictEqual(st.style,'Ativa todo dia'); });
t('canCreate exige o par válido (sem texto livre) e devolve o body {nameA, nameB, styleIdx}',()=>{ open();
  const S=save({});
  assert.strictEqual(G.canCreate(S,host).reason,'name','sem par');
  assert.strictEqual(G.canCreate(S,host,'Lobos','da Aurora').reason,'name','texto não vale');
  assert.strictEqual(G.canCreate(S,host,0,B.length).reason,'name');
  assert.strictEqual(G.canCreate(S,host,0,0,99).reason,'style');
  const c=G.canCreate(S,host,0,0,3); assert.ok(c.ok); assert.deepStrictEqual(c.body,{nameA:0,nameB:0,styleIdx:3}); assert.strictEqual(c.name,'Lobos da Aurora');
  assert.deepStrictEqual(G.canCreate(S,host,1,2).body,{nameA:1,nameB:2});
  G.DATA.on=false; assert.strictEqual(G.canCreate(S,host,0,0).reason,'off'); open(); });
t('canRename: só o líder; renameFree 1 vez a qualquer hora; depois 1 a cada 30 dias',()=>{ open();
  const S=save({id:'g1',nameA:0,nameB:0,role:'officer'}); assert.strictEqual(G.canRename(S,host).reason,'leader');
  assert.strictEqual(G.canRename(save({}),host).reason,'leader','sem guilda');
  S.sys.guild.role='leader'; assert.ok(G.canRename(S,host).ok,'nunca trocou');
  S.sys.guild.renamedAt=NOW-10*D; let r=G.canRename(S,host); assert.strictEqual(r.reason,'rename_cooldown'); assert.strictEqual(r.retryAfterMs,20*D);
  assert.strictEqual(G.reasonText(r),'Você poderá trocar o nome em 20 dias');
  S.sys.guild.renameFree=true; r=G.canRename(S,host); assert.ok(r.ok); assert.strictEqual(r.free,true);
  S.sys.guild.renameFree=false; S.sys.guild.renamedAt=NOW-30*D; assert.ok(G.canRename(S,host).ok,'30 dias depois');
  assert.strictEqual(G.canRename(S,host,0,99).reason,'name'); assert.ok(G.canRename(S,host,4,4).ok); });
t('canRestyle: só o líder, 1 por dia de Brasília, retryAfterMs até a virada',()=>{ open();
  const C=Sys.clock.DATA, tz=C.tzOffsetMin; C.tzOffsetMin=-180;
  try{ const S=save({id:'g1',nameA:0,nameB:0,role:'member'}); assert.strictEqual(G.canRestyle(S,host).reason,'leader');
    S.sys.guild.role='leader'; assert.ok(G.canRestyle(S,host).ok);
    NOW=Date.UTC(2026,10,14,15,0,0);                     // 12h em Brasília
    S.sys.guild.styledAt=Date.UTC(2026,10,14,4,0,0);     // 01h em Brasília, mesmo dia
    const r=G.canRestyle(S,host); assert.strictEqual(r.reason,'restyle_cooldown'); assert.strictEqual(r.retryAfterMs,12*3600000);
    assert.strictEqual(G.reasonText(r),'Você poderá trocar o estilo amanhã');
    S.sys.guild.styledAt=Date.UTC(2026,10,14,2,0,0);     // 23h do dia 13 em Brasília: já pode
    assert.ok(G.canRestyle(S,host).ok); assert.strictEqual(G.canRestyle(S,host,50).reason,'style');
  } finally { C.tzOffsetMin=tz; } });
t('textos das recusas do servidor',()=>{
  assert.strictEqual(G.reasonText('name_taken'),'Esse nome já existe neste servidor; troque uma das partes');
  assert.strictEqual(G.reasonText({reason:'rename_cooldown',retryAfterMs:1}),'Você poderá trocar o nome em 1 dia');
  assert.strictEqual(G.reasonText('xyz'),''); });
t('o JSON do docs/GUILDA_NOME.md (que o servidor copia) é igual às listas do módulo',()=>{
  const md=require('fs').readFileSync(require('path').join(__dirname,'../../docs/GUILDA_NOME.md'),'utf8');
  const m=md.match(/guild-name-json:begin -->\s*```json\s*([\s\S]*?)```/); assert.ok(m,'bloco JSON no doc'); const j=JSON.parse(m[1]);
  assert.deepStrictEqual(j.a,A); assert.deepStrictEqual(j.b,B); assert.deepStrictEqual(j.styles,G.styles); assert.strictEqual(j.nameMax,G.DATA.nameMax); });
G.DATA.on=false; G.setProvider(null);
console.log(n+' testes ok');
