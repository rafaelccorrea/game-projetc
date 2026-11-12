// Reconstroi todas as camadas da era a partir dos brutos. uso: node build2.js <pastaTrabalho com raw/ e work/> <pastaSaida>
const {sharp,load,img,keyMagenta,wrap,crop,bbox}=require('./lib.js');const mill=require('./mill.js');
const S=process.argv[2],OUT=process.argv[3];const info={};
const save=async(o,name,w,q=86)=>{let s=img(o);if(w&&w<o.W)s=s.resize(w);const r=await s.webp({quality:q,alphaQuality:100,effort:6}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');info[name]=[r.width,r.height];return r;};
const seam=async(o,name)=>{const h=Math.floor(o.W/2),sh=Buffer.alloc(o.d.length);for(let y=0;y<o.H;y++)for(let x=0;x<o.W;x++){const sx=(x+h)%o.W;o.d.copy(sh,(y*o.W+x)*4,(y*o.W+sx)*4,(y*o.W+sx)*4+4);}
  await sharp(sh,{raw:{width:o.W,height:o.H,channels:4}}).extract({left:Math.floor(o.W/2-600),top:0,width:1200,height:o.H}).flatten({background:'#7fb6e8'}).jpeg({quality:85}).toFile(S+'/work/seam_'+name+'.jpg');};
(async()=>{
  // ---- céu (ladrilhável: bordas sem nuvem, degradê só vertical)
  let sky=wrap(await load(S+'/raw/sky2.png'),48);await seam(sky,'sky');await save(sky,'sky',2048,88);
  // ---- far (sem fusão; espelha no desenho)
  let far=keyMagenta(await load(S+'/raw/far.png'));far=crop(far,0,340,far.W,1246-340);await save(far,'far',2048,88);
  // ---- mid A/B
  const A=keyMagenta(await load(S+'/raw/mid.png'));const Br=await load(S+'/raw/midB.png');
  for(let p=0;p<Br.W*Br.H;p++){const i=p*4;if(Br.d[i]>235&&Br.d[i+1]>235&&Br.d[i+2]>235&&((p/Br.W)|0)>Br.H*0.9){Br.d[i]=255;Br.d[i+1]=0;Br.d[i+2]=255;}}
  const B=keyMagenta(Br);const M=await mill(B,S);
  const bA=bbox(A),bB=bbox(B);const clear=(o,x0,x1,yTop,y0=0)=>{for(let y=y0;y<yTop;y++)for(let x=x0;x<x1;x++)o.d[(y*o.W+x)*4+3]=0;};
  const gA=bA.y1-36;clear(A,0,185,gA,1040);clear(A,3035,A.W,gA);
  const Hc=1045,tA=bA.y1+1-Hc,tB=bB.y1+1-Hc;console.log('mid tops',tA,tB,'bboxB',bB);
  const MW=+(process.argv[4]||3168);
  await save(crop(A,0,tA,A.W,Hc),'midA',MW,84);await save(crop(B,0,tB,B.W,Hc),'midB',MW,84);
  // ---- moinho: pá + corpo vetorial
  await save(M.blade,'mill_blade',0,90);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="305" height="400"><g stroke="#2b1c16" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
   <polygon points="45,137 245,147 275,398 30,398" fill="#efe3c8"/><polygon points="188,145 245,147 275,398 208,398" fill="#cdbfa6" stroke="none"/>
   <polygon points="45,137 245,147 275,398 30,398" fill="none"/>
   <path d="M90 268 V236 a14 14 0 0 1 28 0 V268 Z" fill="#55617a" stroke-width="4"/>
   <polygon points="95,15 20,138 262,150" fill="#e0752f"/><polygon points="95,15 20,138 128,143" fill="#8a4a2c" stroke="none"/>
   <g stroke="#a8501f" stroke-width="3" fill="none"><path d="M118 52 L172 145"/><path d="M150 76 L214 147"/><path d="M134 100 L196 118"/><path d="M150 124 L232 136"/><path d="M112 74 L158 90"/></g>
   <polygon points="95,15 20,138 262,150" fill="none"/><path d="M95 15 L128 143" stroke-width="4" fill="none"/></g></svg>`;
  const body=await sharp(Buffer.from(svg)).webp({quality:90,alphaQuality:100}).toFile(OUT+'/mill_body.webp');console.log('mill_body',body.width,body.height);
  info.mill={hub:[M.hub[0]/B.W,(M.hub[1]-tB)/Hc],bladePivot:M.pivot,bladeW:M.blade.W/B.W,body:[2255/B.W,(455-tB)/Hc,305/B.W,400/Hc]};
  // ---- chão: tira pedras/rachaduras da estrada (mediana horizontal), mantém grama
  let g=await load(S+'/raw/ground.png');g=crop(g,0,520,g.W,g.H-520);g=keyMagenta(g);const b=bbox(g);g=crop(g,0,b.y0-2,g.W,g.H-(b.y0-2));
  {const {d,W,H}=g;const brown=i=>d[i]>d[i+1]+20&&d[i+1]>d[i+2]+10;const frac=[];for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x+=4)if(brown((y*W+x)*4))n++;frac.push(n/(W/4));}
   let y0=0;while(frac[y0]<0.8)y0++;let y1=H-1;while(frac[y1]<0.8)y1--;let ye=y1;while(ye<H-1&&frac[ye]>0.25)ye++;console.log('road rows',y0,y1,'ext',ye,'of',H);info.road=[y0/H,y1/H];
   const src=Buffer.from(d);const WIN=560,N=40;
   for(let y=y0;y<=ye;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(src[i+1]>src[i]+5)continue; // grama fica
     const rs=[],gs=[],bs=[];for(let k=0;k<N;k++){const xx=((x-WIN/2+Math.round(k*WIN/N))%W+W)%W;const j=(y*W+xx)*4;if(src[j]>src[j+1]+20&&src[j+1]>src[j+2]+10){rs.push(src[j]);gs.push(src[j+1]);bs.push(src[j+2]);}}
     if(rs.length<6)continue;rs.sort((a,b)=>a-b);gs.sort((a,b)=>a-b);bs.sort((a,b)=>a-b);const m=rs.length>>1;d[i]=rs[m];d[i+1]=gs[m];d[i+2]=bs[m];}
  }
  g=wrap(g,30);await seam(g,'ground');await save(g,'ground',2048,88);
  await img(g).resize(1600).flatten({background:'#7fb6e8'}).jpeg({quality:85}).toFile(S+'/work/ground_new.jpg');
  // ---- decalques: atlas
  const D=keyMagenta(await load(S+'/raw/decals.png'));const k=D.W/1600;
  const cells=[];const cols=[[0,300],[300,640],[640,960],[960,1290],[1290,1600]];
  const names=[['stone1','stone2','stone3','slab','pile'],['peb1','peb2','peb3','peb4','peb5'],null,['tuft1','tuft2','tuft3','flowers','leaves']];const rows=[[0,215],[230,430],[470,650],[690,893]];
  for(const r of [0,1,3])cols.forEach((c,ci)=>cells.push({n:names[r][ci],x0:c[0],x1:c[1],y0:rows[r][0],y1:rows[r][1]}));
  [['crack1',0,305],['crack2',310,645],['rut',650,1275],['puddle',1285,1600]].forEach(c=>cells.push({n:c[0],x0:c[1],x1:c[2],y0:470,y1:650}));
  const SC=0.55;let ax=2,ay=2,rowH=0;const comp=[],rects={};const AW=1400;
  for(const c of cells){const sub=crop(D,Math.round(c.x0*k),Math.round(c.y0*k),Math.round((c.x1-c.x0)*k),Math.round((c.y1-c.y0)*k));const bb=bbox(sub,10);const cw=bb.x1-bb.x0+1,ch=bb.y1-bb.y0+1;
    const cc=crop(sub,bb.x0,bb.y0,cw,ch);const w=Math.round(cw*SC),h=Math.round(ch*SC);if(ax+w+2>AW){ax=2;ay+=rowH+2;rowH=0;}
    comp.push({input:await img(cc).resize(w,h).png().toBuffer(),left:ax,top:ay});rects[c.n]=[ax,ay,w,h];ax+=w+2;rowH=Math.max(rowH,h);}
  const AH=ay+rowH+2;const r=await sharp({create:{width:AW,height:AH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comp).webp({quality:88,alphaQuality:100}).toFile(OUT+'/decals.webp');
  console.log('decals',r.width,r.height,Math.round(r.size/1024)+'KB');info.decals={size:[AW,AH],rects};
  require('fs').writeFileSync(S+'/work/info.json',JSON.stringify(info,null,1));
})();
