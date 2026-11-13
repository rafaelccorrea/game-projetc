// confere em disco: toda montaria do MOUNT_TBL tem as 6 folhas do Kael (png+json) pelo nome de arquivo (mountFile) e a imagem parada da Derrota
const fs=require('fs'),vm=require('vm'); const src=fs.readFileSync('js/mountfx.js','utf8');
const sb={window:{},console,performance:{now:()=>0},document:{createElement:()=>({getContext:()=>null})}}; sb.sheetLoad=p=>({ok:true,base:p}); sb.Sys={mount:{DATA:{mounts:[]},live:m=>!m.nw}}; vm.createContext(sb);
vm.runInContext(src+'\n;globalThis.__x={MOUNT_TBL,MOUNT_REF,mountFile,mountSheet,MOUNT_DIR,mountIds};',sb);
const X=sb.__x; let n=0,bad=[]; const need=p=>{ n++; if(!fs.existsSync(p)) bad.push(p); };
for(const id of Object.keys(X.MOUNT_TBL)){ const f=X.mountFile(id); for(const st of ['idle','run','attack']){ need(X.MOUNT_DIR+'kael_'+f+'_'+st+'_body.png'); need(X.MOUNT_DIR+'kael_'+f+'_'+st+'_body.json'); need(X.MOUNT_DIR+'kael_'+f+'_'+st+'_era2_t1.png'); need(X.MOUNT_DIR+'kael_'+f+'_'+st+'_era2_t1.json'); }
  if(X.MOUNT_REF[id]) need('assets/mounts/'+X.MOUNT_REF[id].f+'.png'); }
if(X.mountFile('phoenixm')!=='giant_phoenix'||X.mountFile('wolf')!=='wolf') bad.push('mountFile');
sb.S={hero:'kael'}; if(X.mountSheet('phoenixm','idle').base!=='assets/anim/mounts/kael_giant_phoenix_idle_body') bad.push('mountSheet: '+X.mountSheet('phoenixm','idle').base);
sb.Sys.mount.DATA.mounts=[{id:'wolf'},{id:'phoenixm',nw:true},{id:'raptor',nw:true}]; const ids=X.mountIds().map(m=>m.id).join(','); if(ids!=='wolf') bad.push('mountIds com a chave desligada: '+ids);
sb.Sys.mount.live=()=>true; const ids2=X.mountIds().map(m=>m.id).join(','); if(ids2!=='wolf,phoenixm') bad.push('mountIds com a chave ligada: '+ids2);
if(bad.length){ console.log('FALHA\n'+bad.join('\n')); process.exit(1); } console.log('MONTARIAS: arquivos em disco OK ('+n+' arquivos, '+Object.keys(X.MOUNT_TBL).length+' montarias; Fênix só com a chave do módulo)');
/* estrelas 6 e 7 (Sistemas f636e23): o teto do desenho vem do módulo e as cores existem; com a chave desligada o teto continua 5 */
{ const fs2=require('fs'),vm2=require('vm'); const sb2={window:{},console,performance:{now:()=>0},document:{createElement:()=>({getContext:()=>null})},sheetLoad:p=>({ok:true,base:p}),Sys:{mount:{DATA:{mounts:[],maxStars:5},live:()=>true}}}; vm2.createContext(sb2);
  vm2.runInContext(fs2.readFileSync('js/mountfx.js','utf8')+'\n;globalThis.__y={MOUNT_AURA,mountStarMax};',sb2); const Y=sb2.__y, bad2=[];
  if(Y.MOUNT_AURA.length!==8||!/^rgba\(255,110,60,$/.test(Y.MOUNT_AURA[6])||!/^rgba\(255,248,215,$/.test(Y.MOUNT_AURA[7])) bad2.push('cores 6/7');
  if(Y.mountStarMax()!==5) bad2.push('teto com a chave desligada: '+Y.mountStarMax()); sb2.Sys.mount.DATA.maxStars=7; if(Y.mountStarMax()!==7) bad2.push('teto com 7 estrelas: '+Y.mountStarMax()); sb2.Sys.mount.DATA.maxStars=99; if(Y.mountStarMax()!==7) bad2.push('teto nunca passa das cores');
  if(bad2.length){ console.log('FALHA estrelas 6/7\n'+bad2.join('\n')); process.exit(1); } console.log('MONTARIAS: estrelas 6 e 7 OK (teto do módulo: 5 desligado, 7 ligado)'); }
