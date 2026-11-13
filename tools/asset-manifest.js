// Gera assets/manifest.json: cada arquivo de assets/ que vai para o app, agrupado no PACOTE do Sys.assets.classify (fonte única), com bytes.
// Uso: node tools/asset-manifest.js [--root <pasta do jogo>] [--out assets/manifest.json] [--report]
// --report imprime a tabela por pacote e o APK base do jogador novo (Kael e Kaia). Sem dependências.
'use strict';
const fs=require('fs'), path=require('path');
const args=process.argv.slice(2), opt=k=>{ const i=args.indexOf(k); return i>=0?args[i+1]:null; };
const ROOT=path.resolve(opt('--root')||path.join(__dirname,'..')), OUT=path.resolve(ROOT,opt('--out')||'assets/manifest.json');
const A=require(path.join(__dirname,'..','js','sys','assets.js'));
const packs={};
(function walk(dir){ for(const name of fs.readdirSync(dir)){ const full=path.join(dir,name), rel=path.relative(ROOT,full).replace(/\\/g,'/');
  if(A.excluded(rel)) continue; const st=fs.statSync(full); if(st.isDirectory()){ walk(full); continue; }
  if(rel==='assets/manifest.json') continue; const id=A.classify(rel); (packs[id]=packs[id]||{bytes:0,files:[]}); packs[id].bytes+=st.size; packs[id].files.push(rel); } })(path.join(ROOT,'assets'));
const total=Object.values(packs).reduce((t,p)=>t+p.bytes,0);
const man={v:1,generated:new Date().toISOString().slice(0,10),total,packs};
fs.writeFileSync(OUT,JSON.stringify(man));
if(args.includes('--report')){ A.setManifest(man); const mb=b=>(b/1048576).toFixed(1);
  const rows=Object.entries(packs).sort((a,b)=>b[1].bytes-a[1].bytes);
  const group=id=>id.split(':')[0]; const g={}; for(const [id,p] of rows){ g[group(id)]=(g[group(id)]||0)+p.bytes; }
  console.log('TOTAL no app (sem as fontes brutas): '+mb(total)+' MB em '+rows.length+' pacotes');
  console.log('Por tipo: '+Object.entries(g).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+mb(v)+' MB').join(' · '));
  for(const h of ['kael']){ const f=A.firstBoot(h); console.log('APK base do jogador novo (os dois heróis): '+f.mb+' MB = '+f.packs.map(p=>p+' '+mb(A.packBytes(p))).join(' + ')); }
  const ff=A.DATA.fastFollow('kael').reduce((t,p)=>t+A.packBytes(p),0); console.log('fast-follow (baixa logo depois, Kael): '+mb(ff)+' MB');
  console.log('Maiores pacotes: '+rows.slice(0,12).map(([id,p])=>id+' '+mb(p.bytes)).join(' · '));
  console.log('manifesto: '+path.relative(ROOT,OUT)+' ('+mb(fs.statSync(OUT).size)+' MB)'); }
