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
/* TIRO MONTADO: chave desligada = sempre o golpe de espada; ligada, só usa 'shoot' com arma de fogo, fora da ultimate, e com a folha pronta e com grip em todos os quadros */
{ const fs3=require('fs'),vm3=require('vm'); const mk=(search,sheet)=>{ const sb={window:{},console,DEBUG:true,location:{search},performance:{now:()=>0},document:{createElement:()=>({getContext:()=>null})},S:{hero:'kael'},sheetLoad:p=>/_shoot_body$/.test(p)?sheet(p):{ok:true,base:p,meta:{frames:12,grip:[]}},Sys:{mount:{DATA:{mounts:[],maxStars:5},live:()=>true}}}; vm3.createContext(sb);
    vm3.runInContext(fs3.readFileSync('js/mountfx.js','utf8')+'\n;globalThis.__z={mountShootState,mountShootOn,MOUNT_SHOOT_ON};',sb); return sb.__z; };
  const full={ok:true,meta:{frames:12,grip:Array.from({length:12},()=>({x:1,y:1}))}}, bad3=[]; let asked='';
  let Z=mk('?debug=1',p=>{ asked=p; return full; }); if(Z.MOUNT_SHOOT_ON!==false||Z.mountShootOn()!==false) bad3.push('a chave tem de nascer desligada'); if(Z.mountShootState('wolf',{gun:true,type:'s1'})!=='attack'||asked) bad3.push('desligada: não usa nem pede a folha de tiro');
  Z=mk('?debug=1&mshoot=1',p=>{ asked=p; return full; }); if(Z.mountShootState('phoenixm',{gun:true,type:'s1'})!=='shoot') bad3.push('ligada + arma de fogo + folha pronta = shoot'); if(asked!=='assets/anim/mounts/kael_giant_phoenix_shoot_body') bad3.push('nome da folha: '+asked);
  if(Z.mountShootState('wolf',{gun:false,type:'s1'})!=='attack') bad3.push('arma branca continua no golpe'); if(Z.mountShootState('wolf',{gun:true,type:'s3'})!=='attack') bad3.push('ultimate continua no golpe'); if(Z.mountShootState('wolf',null)!=='attack') bad3.push('sem ação');
  Z=mk('?debug=1&mshoot=1',()=>({ok:false,fail:true})); if(Z.mountShootState('wolf',{gun:true,type:'s1'})!=='attack') bad3.push('folha que não existe: golpe de espada');
  Z=mk('?debug=1&mshoot=1',()=>({ok:true,meta:{frames:12,grip:[{x:1,y:1}]}})); if(Z.mountShootState('wolf',{gun:true,type:'s1'})!=='attack') bad3.push('folha sem grip em todos os quadros: golpe de espada');
  if(bad3.length){ console.log('FALHA tiro montado\n'+bad3.join('\n')); process.exit(1); } console.log('MONTARIAS: tiro montado OK (chave desligada; ligada só com arma de fogo e folha completa)'); }
/* FÊNIX GIGANTE LIGADA (dono, 14/11): o módulo a libera (newReady.phoenixm), só ela entre as 10 novas; Kael e Kaia têm as 3 folhas montadas com grip e back em todos os quadros,
   a imagem parada da Derrota e o ícone existem; e o manifesto do jogo leva tudo (senão não vai na APK) */
{ const fs4=require('fs'); const g4=globalThis; g4.window=g4; require('../../js/sys/mount.js'); const M=g4.Sys.mount, bad4=[]; const nw=M.DATA.mounts.filter(m=>m.nw), on=nw.filter(m=>M.live(m)).map(m=>m.id);
  if(on.join(',')!=='phoenixm,mecha') bad4.push('montarias novas ligadas: '+on.join(',')); if(M.DATA.newOn!==false) bad4.push('newOn geral tem de seguir desligado');
  const man=fs4.readFileSync('assets/manifest.json','utf8'), need4=[]; for(const h of ['kael','kaia']) for(const st of ['idle','run','attack']){ const b='assets/anim/mounts/'+h+'_giant_phoenix_'+st+'_body'; need4.push(b+'.png',b+'.json');
      try{ const j=JSON.parse(fs4.readFileSync(b+'.json','utf8')), n=j.frames|0; if(!(n>0)||!Array.isArray(j.grip)||j.grip.length<n||!j.grip.every(q=>q&&typeof q.x==='number'&&typeof q.y==='number')||!Array.isArray(j.back)||j.back.length<n||j.w!==512||j.h!==352||j.feetY!==339) bad4.push('folha incompleta: '+b); }catch(e){ bad4.push('sem json: '+b); } }
  need4.push('assets/mounts/still/giant_phoenix.png','assets/icons/mounts/giant_phoenix.png'); for(const f of need4){ if(!fs4.existsSync(f)) bad4.push('falta em disco: '+f); else if(man.indexOf('"'+f+'"')<0) bad4.push('fora do manifesto: '+f); }
  const a=M.add({},{},'phoenixm'); if(!a||a.ok===false) bad4.push('Sys.mount.add recusa a Fênix: '+JSON.stringify(a)); const r=M.add({},{},'raptor'); if(!r||r.ok!==false) bad4.push('montaria nova desligada (raptor) tem de ser recusada');
  if(bad4.length){ console.log('FALHA Fênix ligada\n'+bad4.join('\n')); process.exit(1); } console.log('MONTARIAS: Fênix gigante LIGADA OK (Kael e Kaia, 6 folhas completas, imagem parada, ícone, tudo no manifesto; as outras 9 novas desligadas)'); }
/* KAIA NA FÊNIX (QA): o jogo tem de achar a arte montada da Kaia pelo ARQUIVO, porque o pacote do manifesto se chama mount:giant e o id do módulo é phoenixm */
{ const fs5=require('fs'),vm5=require('vm'); const g5=globalThis; g5.window=g5; require('../../js/sys/assets.js'); g5.Sys.assets.setManifest(JSON.parse(fs5.readFileSync('assets/manifest.json','utf8')));
  const sb5={window:{Sys:{assets:g5.Sys.assets}},console,performance:{now:()=>0},document:{createElement:()=>({getContext:()=>null})},sheetLoad:p=>({ok:true,base:p}),S:{hero:'kaia'},Sys:{assets:g5.Sys.assets,mount:{DATA:{mounts:[],maxStars:5},live:()=>true,battleInfo:()=>null}}}; vm5.createContext(sb5);
  vm5.runInContext(fs5.readFileSync('js/mountfx.js','utf8')+'\n;globalThis.__k={mountArtOf,mountPrefix};',sb5); const K=sb5.__k, bad5=[];
  if(K.mountArtOf('kaia','phoenixm')!==true) bad5.push('Kaia na Fênix: mountArtOf = '+K.mountArtOf('kaia','phoenixm')); if(K.mountPrefix('phoenixm')!=='kaia_') bad5.push('prefixo da Kaia na Fênix: '+K.mountPrefix('phoenixm'));
  if(K.mountArtOf('kaia','wolf')!==true) bad5.push('Kaia no lobo'); if(K.mountArtOf('kaia','raptor')!==false) bad5.push('Kaia numa montaria sem arte tem de dar false: '+K.mountArtOf('kaia','raptor'));
  if(bad5.length){ console.log('FALHA Kaia na Fênix\n'+bad5.join('\n')); process.exit(1); } console.log('MONTARIAS: Kaia monta a Fênix (arte achada pelo arquivo no manifesto); montaria sem arte continua a pé'); }
