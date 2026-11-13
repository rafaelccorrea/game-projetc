// node test/sys/stagekit.test.js — GEOMETRIA DO PALCO nas folhas REAIS (json + png), sem navegador.
// Regras do dono: arma no punho, asa nas costas, pet na frente e no chão, pés no chão, nada flutua. Folhas em grade: cols no json (sx = (f % cols)·w, sy = piso(f/cols)·h).
// Verifica, quadro a quadro: (1) a grade cabe na imagem; (2) o ponto mais baixo do desenho = feetY (pés no chão); (3) há mão opaca no grip (arma no punho);
// (4) a âncora das costas (back) cai no corpo; (5) pets com os pés no feetY; (6) StageKit.geometryOf devolve os mesmos pontos; (7) skins com asa própria
// (Kael Anjo) têm a pasta _nowing completa. Um processo node só (memória do PC).
'use strict';
const fs=require('fs'), path=require('path'), zlib=require('zlib'), assert=require('assert');
const ROOT=path.join(__dirname,'..','..');
globalThis.window=globalThis; const SK=require('../../js/stagekit.js');

/* ---------- PNG → {w,h,alpha(x,y)} (8 bits, tipos 2/3/6, sem entrelaçamento) ---------- */
function readPng(file){ const b=fs.readFileSync(file); let p=8, w=0, h=0, ct=0, bd=0, il=0, pal=null, trns=null; const idat=[];
  while(p<b.length){ const len=b.readUInt32BE(p), type=b.toString('ascii',p+4,p+8), d=b.subarray(p+8,p+8+len);
    if(type==='IHDR'){ w=d.readUInt32BE(0); h=d.readUInt32BE(4); bd=d[8]; ct=d[9]; il=d[12]; } else if(type==='PLTE') pal=d; else if(type==='tRNS') trns=d; else if(type==='IDAT') idat.push(d); else if(type==='IEND') break; p+=12+len; }
  if(bd!==8||il!==0||![2,3,6].includes(ct)) throw new Error('png não suportado '+file+' ct='+ct+' bd='+bd+' il='+il);
  const bpp=ct===6?4:ct===2?3:1, raw=zlib.inflateSync(Buffer.concat(idat)), stride=w*bpp, A=new Uint8Array(w*h); let prev=Buffer.alloc(stride), q=0;
  for(let y=0;y<h;y++){ const f=raw[q++], line=Buffer.from(raw.subarray(q,q+stride)); q+=stride;
    for(let i=0;i<stride;i++){ const a=i>=bpp?line[i-bpp]:0, up=prev[i], c=i>=bpp?prev[i-bpp]:0;
      line[i]=(line[i]+(f===1?a:f===2?up:f===3?((a+up)>>1):f===4?(()=>{ const pp=a+up-c, pa=Math.abs(pp-a), pb=Math.abs(pp-up), pc=Math.abs(pp-c); return pa<=pb&&pa<=pc?a:pb<=pc?up:c; })():0))&255; }
    for(let x=0;x<w;x++) A[y*w+x]=ct===6?line[x*4+3]:ct===2?255:(trns&&line[x]<trns.length?trns[line[x]]:255);
    prev=line; }
  return {w,h,a:(x,y)=>x<0||y<0||x>=w||y>=h?0:A[(y|0)*w+(x|0)]}; }

/* ---------- checagens ---------- */
const OP=60;   // alfa mínimo para "pixel do desenho"
let n=0; const fails=[], notes=[];
const t=(name,fn)=>{ try{ fn(); n++; } catch(e){ fails.push(name+': '+e.message); } };
function frameBox(img,M,f){ const cols=M.cols||M.frames, sx=(f%cols)*M.w, sy=Math.floor(f/cols)*M.h; let minX=1e9,minY=1e9,maxX=-1,maxY=-1;
  for(let y=0;y<M.h;y+=1) for(let x=0;x<M.w;x+=2) if(img.a(sx+x,sy+y)>OP){ if(x<minX)minX=x; if(x>maxX)maxX=x; if(y<minY)minY=y; if(y>maxY)maxY=y; }
  return {sx,sy,minX,minY,maxX,maxY}; }
const near=(img,sx,sy,x,y,r)=>{ for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++) if(dx*dx+dy*dy<=r*r&&img.a(sx+x+dx,sy+y+dy)>OP) return true; return false; };
/* kind: 'hero' (grip e back), 'mount' (pés da montaria = feetY; grip e back do herói montado), 'pet' (só pés) */
function checkSheet(rel,kind,opt){ opt=opt||{}; const jf=path.join(ROOT,rel+'.json'), pf=path.join(ROOT,rel+'.png'); if(!fs.existsSync(jf)||!fs.existsSync(pf)){ notes.push('sem arquivo: '+rel); return; }
  const M=JSON.parse(fs.readFileSync(jf,'utf8')); if(M.feetY==null) M.feetY=SK.DEFAULT_FEET;
  const img=readPng(pf), cols=M.cols||M.frames, rows=Math.ceil(M.frames/cols);
  t(rel+' grade',()=>{ assert.ok(img.w>=cols*M.w&&img.h>=rows*M.h,`imagem ${img.w}x${img.h} < ${cols}x${rows} quadros de ${M.w}x${M.h}`); });
  const tolFeet=opt.tolFeet||4;
  /* pet que VOA: o jogo (js/petfx.js drawPet) o sobe heroBodyH × fly; na folha isso é fly ÷ h[estágio] × altura opaca do pet (petK = heroBodyH × h ÷ altura) */
  let rise=0; if(opt.fly){ let a=1e9,z=-1; for(let f=0;f<M.frames;f++){ const B=frameBox(img,M,f); if(B.maxY<0) continue; a=Math.min(a,B.minY); z=Math.max(z,B.maxY); } rise=opt.fly.fly/opt.fly.h*(z-a); }
  for(let f=0;f<M.frames;f++){ const B=frameBox(img,M,f); if(B.maxY<0) continue;
    if(opt.fly) t(`${rel} q${f} não afunda no chão`,()=>{ assert.ok(B.maxY-rise<=M.feetY+tolFeet,`ponto mais baixo ${B.maxY} − subida ${rise.toFixed(1)} abaixo do chão ${M.feetY}`); });
    else t(`${rel} q${f} pés no chão`,()=>{ assert.ok(Math.abs(B.maxY-M.feetY)<=tolFeet,`ponto mais baixo ${B.maxY} ≠ feetY ${M.feetY} (±${tolFeet})`); });
    if(kind!=='pet'&&Array.isArray(M.grip)&&M.grip[f]&&M.grip[f].hw>0){ const g=M.grip[f], gy=g.y+(g.fdy||0)*0;
      t(`${rel} q${f} mão no grip`,()=>{ assert.ok(near(img,B.sx,B.sy,g.x,gy,6),`sem desenho a 6 px do grip (${g.x},${gy})`); }); }
    if(kind!=='pet'&&Array.isArray(M.back)&&M.back[f]){ const k=M.back[f], bx=k.x!=null?k.x:k[0], by=k.y!=null?k.y:k[1];
      if(bx!=null) t(`${rel} q${f} costas no corpo`,()=>{ assert.ok(bx>=B.minX-8&&bx<=B.maxX+8&&by>=B.minY-8&&by<=B.maxY+8,`âncora das costas (${bx},${by}) fora do corpo [${B.minX}-${B.maxX}]x[${B.minY}-${B.maxY}]`); }); }
    if(f===0) t(`${rel} geometryOf`,()=>{ const G=SK.geometryOf(M,0); assert.strictEqual(G.feetY,M.feetY); if(M.grip&&M.grip[0]){ assert.strictEqual(G.grip.x,M.grip[0].x); } }); }
}
/* ---------- quais folhas ---------- */
for(const a of ['idle','attack','run']) checkSheet('assets/anim/hyb/R/kael_'+a+'_body','hero',{tolFeet:a==='idle'?4:6});   /* corrida tem quadro no ar e o golpe avança o pé: ±6 */
for(const a of ['idle','attack','run']) checkSheet('assets/anim/hyb/kaia/kaia_'+a+'_body','hero',{tolFeet:a==='idle'?4:6});
for(const a of ['idle','run','shoot']) checkSheet('assets/anim/hyb/R/kael_pistol_'+a+'_body','hero',{tolFeet:a==='idle'?4:6});
for(const d of fs.readdirSync(path.join(ROOT,'assets/anim/skins'))){ if(d.startsWith('_')) continue; const h=d.split('_')[0]; for(const a of ['idle','attack']) checkSheet(`assets/anim/skins/${d}/${h}_${a}_body`,'hero'); }
for(const h of ['kael','kaia']) for(const m of ['pony','horse','wolf','griffin','mythic','wyvern']) checkSheet(`assets/anim/mounts/${h}_${m}_idle_body`,'mount');
/* tabela de desenho dos pets do jogo (fly e altura por estágio): Sys.pet.battleTable() */
const PT=(()=>{ try{ globalThis.Sys=globalThis.Sys||{}; return require('../../js/sys/pet.js').battleTable(); }catch(e){ return {}; } })();
for(const f of fs.readdirSync(path.join(ROOT,'assets/anim/pets'))){ if(!/_idle\.json$/.test(f)) continue; const base=f.replace(/_idle\.json$/,''), stg=/_evo$/.test(base)?2:/_mid$/.test(base)?1:0, sp=base.replace(/_(mid|evo)$/,''), T=PT[sp];
  checkSheet('assets/anim/pets/'+f.replace(/\.json$/,''),'pet',T&&T.fly>0?{fly:{fly:T.fly,h:(T.h&&T.h[stg])||0.5}}:{}); }
/* Kael Anjo: o jogo usa SEMPRE a pasta _nowing (regra do dono: skin nunca com asa no corpo) → precisa ter todos os estados de uma skin viva */
t('Kael Anjo: pasta _nowing completa (mesmos estados de uma skin viva, a Ninja; a pasta antiga com asa saiu do jogo, a1e2bbd)',()=>{ const norm=(d,id)=>fs.readdirSync(path.join(ROOT,'assets/anim/skins',d)).filter(f=>!f.startsWith('_')).map(f=>f.split(id).join('X')); const A=norm('kael_ninja','kael_ninja'), B=new Set(norm('kael_angel_nowing','kael_angel_nowing')); const miss=A.filter(f=>!B.has(f)); assert.ok(!miss.length,'faltam '+miss.slice(0,5).join(', ')); });
/* StageKit: a ordem de desenho é a do drawHeroFull (pet por último); o kit só traduz o look e devolve o que a rota não sabe trocar */
t('StageKit.toState: look do heroSnapshot → state do drawHeroFull',()=>{ const s=SK.toState({hero:'kael',mount:null,pet:null,wing:null,aura:null},{t:1}); assert.strictEqual(s.mount,false); assert.strictEqual(s.pet,false); assert.strictEqual(s.wing,false); assert.strictEqual(s.t,1);
  const s2=SK.toState({hero:'kael',mount:{id:'horse',stars:3},pet:{base:'era0_mammoth',stage:1},wing:'angel'},{}); assert.deepStrictEqual(s2.mount,{id:'horse',stars:3}); assert.strictEqual(s2.wing,'angel'); assert.deepStrictEqual(s2.pet,{base:'era0_mammoth',stage:1,fly:0}); assert.strictEqual(s2.hero,'kael');
  assert.strictEqual(SK.toState({pet:true}).pet,true); assert.strictEqual(SK.toState({hero:'outro'}).hero,undefined); assert.deepStrictEqual(SK.limitsOf({hero:'kaia',pet:{base:'x'}}),[]); });
t('StageKit desligado por padrão',()=>{ assert.strictEqual(SK.DATA.on,false); });

/* ACHADOS CONHECIDOS da arte (avisados à Arte e ao Engenheiro em 13/11): aparecem como AVISO e não quebram o teste; achado NOVO quebra */
/* papagaio e falcão saíram (13/11): com a subida real dos voadores (fly ÷ h × altura) nenhum quadro afunda no chão */
/* ciborgue, demônio e pistola atirando: grip corrigido no json pela Arte (7429424, 36683e8, bbaf54d). Lista vazia: qualquer achado volta a FALHAR */
const KNOWN=[];
const known=fails.filter(x=>KNOWN.some(r=>r.test(x))); for(const k of known) fails.splice(fails.indexOf(k),1);
if(known.length){ const by={}; for(const k of known){ const kk=k.replace(/ q\d+ /,' qN ').replace(/:.*/,''); by[kk]=(by[kk]||0)+1; } console.log('AVISOS (achados conhecidos da arte): '+Object.entries(by).map(([k,v])=>v+'× '+k).join(' · ')); }
console.log(n+' verificações ok'+(notes.length?' · '+notes.length+' folhas ausentes':''));
if(notes.length) console.log('  '+notes.slice(0,12).join('\n  '));
if(fails.length){ console.log('FALHAS ('+fails.length+'):'); const by={}; for(const f of fails){ const k=f.replace(/ q\d+ /,' qN ').replace(/:.*/,''); (by[k]=by[k]||[]).push(f); }
  for(const k in by) console.log('  '+by[k].length+'× '+by[k][0]); process.exitCode=1; }
