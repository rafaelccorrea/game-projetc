// Confere o js/avatar.js com os arquivos reais, sem navegador. Rodar: node test/paineis/avatar.crop.js [raiz] [saida.png]
//  1. retratos da Arte (assets/hero/avatar): os 8 arquivos e a âncora "head" de cada um; desenha chapéu/óculos/máscara por cima com a MESMA conta do avatar.js
//     (translate · rotate · scale(s/res) · drawImage(-pivot)) e confere que a peça cai em cima da cabeça (cobre pixels opacos do retrato);
//  2. reserva (recorte da folha parada): a função pura avatarLocate nas 8 folhas.
//  Com [saida.png] grava uma folha de conferência: linha 1-2 retratos + peças, linha 3-4 recortes da reserva.
const fs=require('fs'), zlib=require('zlib'), path=require('path');
const root=process.argv[2]||'.', outFile=process.argv[3];
function readPng(file){ const b=fs.readFileSync(file); let p=8,w=0,h=0,bd=0,ct=0,il=0,idat=[],trns=null,plte=null;
  while(p<b.length){ const len=b.readUInt32BE(p), type=b.toString('ascii',p+4,p+8), d=b.subarray(p+8,p+8+len); p+=12+len;
    if(type==='IHDR'){ w=d.readUInt32BE(0); h=d.readUInt32BE(4); bd=d[8]; ct=d[9]; il=d[12]; } else if(type==='IDAT') idat.push(d); else if(type==='tRNS') trns=d; else if(type==='PLTE') plte=d; else if(type==='IEND') break; }
  if(bd!==8||il!==0) throw new Error('formato: bd='+bd+' ct='+ct+' il='+il);
  const ch=ct===6?4:ct===2?3:ct===4?2:1, raw=zlib.inflateSync(Buffer.concat(idat)), stride=w*ch, out=Buffer.alloc(h*stride);
  for(let y=0;y<h;y++){ const f=raw[y*(stride+1)], ro=y*(stride+1)+1, oo=y*stride;
    for(let x=0;x<stride;x++){ const a=x>=ch?out[oo+x-ch]:0, u=y?out[oo-stride+x]:0, c=(x>=ch&&y)?out[oo-stride+x-ch]:0; let v=raw[ro+x];
      if(f===1) v+=a; else if(f===2) v+=u; else if(f===3) v+=(a+u)>>1; else if(f===4){ const pp=a+u-c, pa=Math.abs(pp-a), pb=Math.abs(pp-u), pc=Math.abs(pp-c); v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?u:c); }
      out[oo+x]=v&255; } }
  const rgba=(x,y)=>{ x=Math.round(x); y=Math.round(y); if(x<0||y<0||x>=w||y>=h) return [0,0,0,0]; const i=y*stride+x*ch; if(ct===6) return [out[i],out[i+1],out[i+2],out[i+3]]; if(ct===2) return [out[i],out[i+1],out[i+2],255];
    if(ct===3){ const k=out[i]; return [plte[k*3],plte[k*3+1],plte[k*3+2],trns&&k<trns.length?trns[k]:255]; } return [out[i],out[i],out[i],ct===4?out[i+1]:255]; };
  return {w,h,ct,rgba}; }
function crc32(buf){ let c,crc=~0; for(let n=0;n<buf.length;n++){ c=(crc^buf[n])&255; for(let k=0;k<8;k++) c=c&1?(c>>>1)^0xedb88320:c>>>1; crc=(crc>>>8)^c; } return (~crc)>>>0; }
function writePng(file,w,h,data){ const raw=Buffer.alloc(h*(w*4+1)); for(let y=0;y<h;y++){ raw[y*(w*4+1)]=0; data.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4); }
  const chunk=(t,d)=>{ const b=Buffer.alloc(12+d.length); b.writeUInt32BE(d.length,0); b.write(t,4,'ascii'); d.copy(b,8); b.writeUInt32BE(crc32(b.subarray(4,8+d.length)),8+d.length); return b; };
  const ih=Buffer.alloc(13); ih.writeUInt32BE(w,0); ih.writeUInt32BE(h,4); ih[8]=8; ih[9]=6;
  fs.writeFileSync(file,Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))])); }
const J=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
// carrega o js/avatar.js com uma página de mentira (só para conferir a API e pegar avatarLocate e as constantes)
const win={devicePixelRatio:1}; global.window=win; global.document={createElement:()=>({getContext:()=>({}),style:{},dataset:{}}),documentElement:{},querySelectorAll:()=>[]};
const src=fs.readFileSync(path.join(root,'js/avatar.js'),'utf8'); const si=global.setInterval, ft=global.fetch; global.setInterval=()=>0; global.fetch=()=>Promise.resolve(null); new Function(src)(); global.setInterval=si; global.fetch=ft;
for(const k of ['avatarFor','avatarTag','avatarUrl','avatarRefresh','avatarOnReady','avatarLocate','avatarInfo']) if(typeof win[k]!=='function') throw new Error('API do avatar.js incompleta: '+k);
const K=+(/K:([\d.]+)/.exec(src)||[])[1], DY=+(/DY:([\d.]+)/.exec(src)||[])[1], MIN=+(/MIN:(\d+)/.exec(src)||[])[1];
const T=96, tiles=[]; let bad=0; const BG=(tx,ty)=>{ const dx=tx-T/2+.5, dy=ty-T/2+.5; return dx*dx+dy*dy<=T*T/4?[74,58,43]:[20,16,12]; };
const say=(ok,txt)=>{ if(!ok) bad++; console.log((ok?'OK    ':'FALHA ')+txt); };

console.log('--- 0. qual retrato (sem fases: skin equipada pelo Sys.appearance.avatarKey; sem a função, o padrão do herói)');
{ const IT=J('assets/hero/avatar/avatars.json').items, K=win.avatarKeyOf, eq=(a,b,t)=>say(a===b,t+' → '+a+(a===b?'':' (esperado '+b+')'));
  say(typeof K==='function','avatarKeyOf existe'); say(!/phaseUp\s*\.\s*current|Sys\.phaseUp\s*&&/.test(src),'o avatar.js não lê mais Sys.phaseUp');
  delete win.Sys; eq(K({hero:'kael'},IT),'kael_phase0','sem módulo, Kael'); eq(K({hero:'kaia'},IT),'kaia_phase0','sem módulo, Kaia'); eq(K({},IT),'kael_phase0','sem herói no save');
  global.Sys=win.Sys={host:{},appearance:{},phaseUp:{current:()=>3}}; eq(K({hero:'kael'},IT),'kael_phase0','módulo sem avatarKey (phaseUp diz 3: ignorado)');
  Sys.appearance.avatarKey=(s)=>s.hero==='kaia'?'kaia_phase3':'kael_phase2'; eq(K({hero:'kael'},IT),'kael_phase2','avatarKey: Kael Cavaleiro'); eq(K({hero:'kaia'},IT),'kaia_phase3','avatarKey: Kaia Guerreira Lendária');
  Sys.appearance.avatarKey=()=>'nao_existe'; eq(K({hero:'kaia'},IT),'kaia_phase0','avatarKey com chave fora do avatars.json'); Sys.appearance.avatarKey=()=>{ throw new Error('x'); }; eq(K({hero:'kael'},IT),'kael_phase0','avatarKey com erro');
  delete win.Sys; delete global.Sys; }
console.log('--- 1. retratos da Arte + peças de cabeça');
const PIECES=/const AVATAR_PIECES=true/.test(src);   // chave do js/avatar.js: desligada (decisão do dono) = só o rosto; as peças nem são lidas
console.log('    peças de cabeça: '+(PIECES?'LIGADAS':'desligadas (AVATAR_PIECES=false): só o rosto do retrato'));
// com a chave desligada, toda leitura de hats.json / cos.json tem de estar atrás dela, e a lista de peças tem de sair vazia antes de consultar o módulo
for(const f of ['hats.json','cos.json']){ const all=src.split("'"+f+"'").length-1, gated=src.split("AVATAR_PIECES?getJson(AV."+(f==='hats.json'?'HATS':'COS')+"+'"+f+"')").length-1;
  say(all===gated,'leitura de '+f+' só atrás da chave AVATAR_PIECES ('+gated+' de '+all+')'); }
say(src.indexOf('function headLayers(sv){ const out=[]; if(!AVATAR_PIECES) return out;')>=0,'headLayers devolve vazio com a chave desligada (não consulta Sys.appearance.layers nem carrega imagem de peça)');
const AVJ=J('assets/hero/avatar/avatars.json'), HATS=PIECES?J('assets/anim/equip/hats/hats.json').hats:{}, COS=PIECES?J('assets/anim/equip/cos/cos.json').items:{}, SZ=AVJ.size||256;
const hatIds=Object.keys(HATS), cosIds=Object.keys(COS); let pi=0;
for(const hero of ['kael','kaia']) for(let ph=0;ph<4;ph++){ const id=hero+'_phase'+ph, it=AVJ.items[id];
  if(!it){ say(false,id+': falta no avatars.json'); continue; }
  let im; try{ im=readPng(path.join(root,'assets/hero/avatar',it.file)); }catch(e){ say(false,id+': '+e.message); continue; }
  const h=it.head||{}, okA=im.w===SZ&&im.h===SZ&&typeof h.x==='number'&&typeof h.y==='number'&&h.s>0&&im.rgba(h.x,h.y)[3]>128;
  say(okA,id+': '+im.w+'x'+im.h+', âncora '+h.x+','+h.y+' ang '+h.ang+' s '+h.s+(okA?' (em cima da figura)':' (âncora fora da figura ou tamanho errado)'));
  // peças: um chapéu e um cosmético diferentes por retrato, para a folha de conferência mostrar todos
  const parts=PIECES?[{m:HATS[hatIds[pi%hatIds.length]],dir:'assets/anim/equip/hats/',k:hatIds[pi%hatIds.length]},{m:COS[cosIds[pi%cosIds.length]],dir:'assets/anim/equip/cos/',k:cosIds[pi%cosIds.length]}]:[]; pi++;
  const ang=(h.ang||0)*Math.PI/180, ca=Math.cos(ang), sa=Math.sin(ang);
  for(const p of parts){ p.im=readPng(path.join(root,p.dir,p.m.file)); p.k2=(h.s||1)/(p.m.res||1); p.pv=p.m.pivot||{x:0,y:0};
    // ponto do retrato → ponto da peça (inverso de translate·rotate·scale·drawImage(-pivot))
    p.at=(X,Y)=>{ const dx=X-h.x, dy=Y-h.y, rx=(dx*ca+dy*sa)/p.k2, ry=(-dx*sa+dy*ca)/p.k2; return p.im.rgba(rx+p.pv.x,ry+p.pv.y); };
    let on=0,tot=0; for(let Y=0;Y<SZ;Y+=2) for(let X=0;X<SZ;X+=2){ if(p.at(X,Y)[3]>128){ tot++; if(im.rgba(X,Y)[3]>128) on++; } }
    const pct=tot?Math.round(on/tot*100):0; say(tot>40&&pct>=35,'  '+id+' + '+p.k+': '+tot*4+' px da peça dentro do retrato, '+pct+'% em cima da figura'); }
  const tile=Buffer.alloc(T*T*4); for(let ty=0;ty<T;ty++) for(let tx=0;tx<T;tx++){ const X=(tx+.5)*SZ/T, Y=(ty+.5)*SZ/T, i=(ty*T+tx)*4; let c=BG(tx,ty);
    for(const q of [im.rgba(X,Y)].concat(parts.map(p=>p.at(X,Y)))){ const a=q[3]/255; c=[c[0]*(1-a)+q[0]*a,c[1]*(1-a)+q[1]*a,c[2]*(1-a)+q[2]*a]; }
    tile[i]=Math.round(c[0]); tile[i+1]=Math.round(c[1]); tile[i+2]=Math.round(c[2]); tile[i+3]=255; }
  tiles.push(tile); }

console.log('--- 2. reserva: recorte da folha parada (avatarLocate)');
const DIRS={kael:['R','phase1','phase2','phase3'],kaia:['kaia','kaia_phase1','kaia_phase2','kaia_phase3']};
for(const hero in DIRS) DIRS[hero].forEach((d,stg)=>{ const base=path.join('assets/anim/hyb',d,hero+'_idle_body'), M=J(base+'.json');
  let a0=null; try{ a0=J(path.join('assets/anim/hyb',d,'masks',hero+'_idle_head.json')).head[0]; }catch(e){}
  const im=readPng(path.join(root,base+'.png')), w=M.w, h=M.h, fy=typeof M.feetY==='number'?M.feetY:243, px=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){ const c=im.rgba(x,y), i=(y*w+x)*4; px[i]=c[0]; px[i+1]=c[1]; px[i+2]=c[2]; px[i+3]=c[3]; }
  const L=win.avatarLocate(px,w,h,fy,M.padLeft||0,a0), c=Math.max(MIN,K*L.hh), x0=L.hx-c/2, y0=L.hy+DY*c-c/2;
  let op=0,tot=0; const tile=Buffer.alloc(T*T*4); for(let ty=0;ty<T;ty++) for(let tx=0;tx<T;tx++){ const q=im.rgba(x0+(tx+.5)*c/T,y0+(ty+.5)*c/T), i=(ty*T+tx)*4; tot++; if(q[3]>128) op++;
    const a=q[3]/255, bg=BG(tx,ty); tile[i]=Math.round(q[0]*a+bg[0]*(1-a)); tile[i+1]=Math.round(q[1]*a+bg[1]*(1-a)); tile[i+2]=Math.round(q[2]*a+bg[2]*(1-a)); tile[i+3]=255; }
  const pct=Math.round(op/tot*100);
  say(pct>=25&&pct<=92,hero+' fase '+stg+' ('+d+'): âncora json '+(a0?a0.x+','+a0.y:'-')+' → usada '+Math.round(L.hx)+','+Math.round(L.hy)+' ['+L.note+']; recorte '+Math.round(c)+' px; figura '+pct+'%');
  tiles.push(tile); });
if(outFile){ const W=T*4, H=T*Math.ceil(tiles.length/4), img=Buffer.alloc(W*H*4); tiles.forEach((t,i)=>{ const cx=(i%4)*T, cy=Math.floor(i/4)*T; for(let y=0;y<T;y++) t.copy(img,((cy+y)*W+cx)*4,y*T*4,(y+1)*T*4); }); writePng(outFile,W,H,img);
  console.log('folha de conferência: '+outFile+' (linhas 1-2: retratos Kael/Kaia fases 0-3'+(PIECES?' com peças':'')+'; linhas 3-4: recorte da reserva)'); }
console.log(bad?bad+' verificação(ões) com FALHA':'avatar OK');
process.exit(bad?1:0);
