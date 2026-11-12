// ERA 0 (Pre-Historia): reconstroi as camadas a partir dos brutos.
// uso: node build0.js <pastaTrabalho com raw/ e work/> <pastaSaida>
// brutos: sky.png far.png mid.png midB.png ground.png decals.png (21:9 2K; decals 16:9 2K)
const fs=require('fs');const {sharp,load,img,keyMagenta,wrap,crop,bbox}=require('./lib.js');
const S=process.argv[2],OUT=process.argv[3];const info={};
const save=async(o,name,w,q=86)=>{let s=img(o);if(w&&w<o.W)s=s.resize(w);const r=await s.webp({quality:q,alphaQuality:100,effort:6}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');info[name]=[r.width,r.height];return r;};
const prev=async(o,name,w=1500)=>img(o).resize(Math.min(w,o.W)).flatten({background:'#7fb6e8'}).jpeg({quality:84}).toFile(S+'/work/p_'+name+'.jpg');
// mascara branca (alfa = teste de cor) recortada no proprio retangulo; devolve retangulo em fracao da camada
const mask=async(o,test,x0,y0,x1,y1,name,outW)=>{let bx0=1e9,by0=1e9,bx1=-1,by1=-1;const hit=new Uint8Array(o.W*o.H);
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*o.W+x)*4;if(o.d[i+3]>128&&test(o.d[i],o.d[i+1],o.d[i+2])){hit[y*o.W+x]=1;if(x<bx0)bx0=x;if(x>bx1)bx1=x;if(y<by0)by0=y;if(y>by1)by1=y;}}
  bx0-=3;by0-=3;bx1+=3;by1+=3;const w=bx1-bx0+1,h=by1-by0+1,d=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const j=(y*w+x)*4;d[j]=d[j+1]=d[j+2]=255;d[j+3]=hit[(y+by0)*o.W+x+bx0]?255:0;}
  const r=await sharp(d,{raw:{width:w,height:h,channels:4}}).blur(1.2).resize(outW).webp({quality:80,alphaQuality:90}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');
  return {rect:[bx0/o.W,by0/o.H,w/o.W,h/o.H],px:[bx0,by0,w,h],hit};};
(async()=>{
  // ---- ceu (bordas sem nuvem, degrade so vertical): emenda nele mesmo
  const sky=wrap(await load(S+'/raw/sky.png'),48);await save(sky,'sky',2048,88);
  // ---- far: vulcao + cordilheira
  let far=keyMagenta(await load(S+'/raw/far.png'));const bf=bbox(far);const fy0=bf.y0-8,fy1=1160;far=crop(far,0,fy0,far.W,fy1-fy0);console.log('far bbox',bf,'crop',fy0,fy1);
  const lava=await mask(far,(r,g,b)=>r>215&&g>95&&r-b>110&&r-g>25,Math.round(far.W*0.5),0,Math.round(far.W*0.95),far.H,'lava',260);
  { // cratera = centro das linhas de cima da mascara
    let sx=0,sy=0,n=0;const [mx,my,mw,mh]=lava.px;for(let y=my;y<my+mh*0.16;y++)for(let x=mx;x<mx+mw;x++)if(lava.hit[y*far.W+x]){sx+=x;sy+=y;n++;}
    info.crater=[sx/n/far.W,sy/n/far.H];info.lava=lava.rect;console.log('crater',info.crater,'lava',lava.rect); }
  await save(far,'far',2048,88);await prev(far,'far');
  // ---- mid A/B
  const A=keyMagenta(await load(S+'/raw/mid.png'));const Br=await load(S+'/raw/midB.png');
  for(let y=0;y<225;y++)for(let x=1150;x<1720;x++){const i=(y*Br.W+x)*4;Br.d[i]=255;Br.d[i+1]=0;Br.d[i+2]=255;}   // samambaia fantasma no topo do midB
  const B=keyMagenta(Br);const bA=bbox(A),bB=bbox(B);const top=Math.min(bA.y0,bB.y0)-6,Hc=A.H-top;console.log('mid bbox',bA,bB,'Hc',Hc);
  const cA=crop(A,0,top,A.W,Hc),cB=crop(B,0,top,B.W,Hc);
  // emenda A|B: o fundo de selva tem tom diferente nas duas bordas; iguala o lado esquerdo de cada trecho ao direito do anterior (por linha, esmaecendo em F px)
  const matchLeft=(T,P,F=520)=>{const {d,W,H}=T,sm=t=>t*t*(3-2*t);const med=(o,xa,y)=>{const c=[[],[],[]];for(let x=xa;x<xa+8;x++){const i=(y*o.W+x)*4;if(o.d[i+3]<250)return null;for(let q=0;q<3;q++)c[q].push(o.d[i+q]);}return c.map(v=>v.sort((u,w)=>u-w)[4]);};
    const Ls=[],Ds=[];for(let y=0;y<H;y++){const l=med(T,3,y),r=med(P,P.W-11,y);const good=c=>{if(!c)return false;const u=c[0]+c[1]+c[2];return u>=150&&u<=330&&c[1]>=c[0];};const okL=good(l),ok=okL&&good(r)&&Math.hypot(l[0]-r[0],l[1]-r[1],l[2]-r[2])<=90;
      Ls.push(okL?l:null);Ds.push(ok?[r[0]-l[0],r[1]-l[1],r[2]-l[2]]:null);}   // a linha e corrigida se o lado esquerdo for fundo; o delta vem das vizinhas validas
    for(let y=0;y<H;y++){const l=Ls[y];if(!l)continue;const c=[[],[],[]];for(let k=Math.max(0,y-25);k<=Math.min(H-1,y+25);k++)if(Ds[k])for(let q=0;q<3;q++)c[q].push(Ds[k][q]);if(c[0].length<6)continue;
      const dl=c.map(v=>v.sort((u,w)=>u-w)[v.length>>1]);   // delta = mediana de 31 linhas: uma linha fora do padrao nao vira risco horizontal
      for(let x=0;x<F;x++){const i=(y*W+x)*4;if(d[i+3]<250)continue;const ds=Math.hypot(d[i]-l[0],d[i+1]-l[1],d[i+2]-l[2]),w=ds<16?1:ds>32?0:1-(ds-16)/16;if(!w)continue;const k=w*(1-sm(x/F));for(let q=0;q<3;q++)d[i+q]=Math.max(0,Math.min(255,Math.round(d[i+q]+dl[q]*k)));}}};
  {const a0={d:Buffer.from(cA.d),W:cA.W,H:cA.H};matchLeft(cA,cB);matchLeft(cB,a0);}
  const fall=await mask(cB,(r,g,b)=>(b>185&&b>=r+12&&g>150)||(r>228&&g>236&&b>238),640,300-top,900,1150-top,'fall',96);
  info.fall=fall.rect;console.log('fall',fall.rect);
  const MW=+(process.argv[4]||2640),MQ=+(process.argv[5]||78);
  await save(cA,'midA',MW,MQ);await save(cB,'midB',MW,MQ);await prev(cA,'midA');await prev(cB,'midB');
  for(const n of ['midA','midB']){const r=await sharp(OUT+'/'+n+'.webp').resize(880).webp({quality:64,alphaQuality:90}).toFile(OUT+'/'+n+'_lo.webp');console.log(n+'_lo',Math.round(r.size/1024)+'KB');}
  // emenda A|B e B|A para conferir
  for(const [l,r,n] of [[cA,cB,'AB'],[cB,cA,'BA']]){const w=700;const L=await img(crop(l,l.W-w,0,w,Hc)).png().toBuffer(),R=await img(crop(r,0,0,w,Hc)).png().toBuffer();
    await sharp({create:{width:2*w,height:Hc,channels:4,background:'#7fb6e8'}}).composite([{input:L,left:0,top:0},{input:R,left:w,top:0}]).jpeg({quality:84}).toFile(S+'/work/seam_'+n+'.jpg');}
  // ---- chao
  let g=keyMagenta(await load(S+'/raw/ground.png'));const bg=bbox(g);g=crop(g,0,bg.y0-2,g.W,g.H-(bg.y0-2));
  { const {d,W,H}=g;const brown=i=>d[i]>d[i+1]+35&&d[i+1]>d[i+2]+25;const frac=[];for(let y=0;y<H;y++){let n=0;for(let x=0;x<W;x+=4)if(brown((y*W+x)*4))n++;frac.push(n/(W/4));}
    let y0=0;while(frac[y0]<0.9)y0++;let y1=H-1;while(frac[y1]<0.9)y1--;info.road=[y0/H,y1/H];console.log('ground H',H,'road rows',y0,y1);
    const m=(y0+y1)>>1;let c=[0,0,0],n=0;for(let x=0;x<W;x+=7){const i=((y0+30)*W+x)*4;c[0]+=d[i];c[1]+=d[i+1];c[2]+=d[i+2];n++;}info.roadColor=c.map(v=>Math.round(v/n));console.log('road color',info.roadColor);
    // linha reta escura do topo: recolore para o verde da grama e esmaece o alfa
    const rows=[];for(let y=0;y<Math.round(H*0.14);y++){let dk=0,op=0;for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]>128){op++;if(d[i]+d[i+1]+d[i+2]<200)dk++;}}rows.push([y,op,dk]);}
    const line=rows.filter(r=>r[1]>W*0.9&&r[2]>W*0.5).map(r=>r[0]);console.log('linha escura',line.join(','));
    if(line.length){const ya=line[0]-3,yb=line[line.length-1]+3;let gc=[0,0,0],k=0;for(let x=0;x<W;x+=5){const i=((yb+8)*W+x)*4;if(d[i+1]>d[i]){gc[0]+=d[i];gc[1]+=d[i+1];gc[2]+=d[i+2];k++;}}gc=gc.map(v=>Math.round(v/k));console.log('verde',gc);info.grassColor=gc;
      for(let y=Math.max(0,ya);y<=yb;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]<10)continue;const lum=d[i]+d[i+1]+d[i+2];if(lum<300){const t=Math.min(1,(300-lum)/110);for(let q=0;q<3;q++)d[i+q]=Math.round(d[i+q]+(gc[q]-d[i+q])*t);}}
      for(let x=0;x<W;x++){let k2=0;for(let y=0;y<=yb+6&&k2<10;y++){const i=(y*W+x)*4;if(d[i+3]>40){d[i+3]=Math.round(d[i+3]*(k2+1)/11);k2++;}}}}   // borda de cima esmaecida em 10 px
  }
  g=wrap(g,30);await save(g,'ground',2048,88);await prev(g,'ground');
  // ---- decalques: celulas separadas por linhas magenta; fundo ocre removido por preenchimento a partir da borda
  const D=await load(S+'/raw/decals.png');
  { const {d,W,H}=D;const mag=i=>d[i]>200&&d[i+2]>200&&d[i+1]<110;const lines=(n,m,at)=>{const out=[];let run=null;for(let a=0;a<n;a++){let c=0;for(let b=0;b<m;b+=3)if(mag(at(a,b)*4))c++;const is=c/(m/3)>0.6;if(is&&!run)run=[a,a];else if(is)run[1]=a;else if(run){out.push(run);run=null;}}if(run)out.push(run);return out;};
    const vx=lines(W,H,(x,y)=>y*W+x),hy=lines(H,W,(y,x)=>y*W+x);const cuts=(ls,n)=>{const c=[0];ls.forEach(l=>{c.push(l[0]);c.push(l[1]+1);});c.push(n);const o=[];for(let i=0;i<c.length;i+=2)if(c[i+1]-c[i]>60)o.push([c[i],c[i+1]]);return o;};
    const cols=cuts(vx,W),rws=cuts(hy,H);console.log('decals grid',cols.length,'x',rws.length);
    const names=[['dino1','dino2','paw','feet','tracks'],['bone','bones','skull','ribs','tusk'],['stone1','stone2','stone3','slab','pile'],['tuft1','tuft2','tuft3','sprout','pebbles']];
    const SC=0.42,AW=1200;let ax=2,ay=2,rowH=0;const comp=[],rects={};
    for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x0=cols[c][0]+8,x1=cols[c][1]-8,y0=rws[r][0]+8,y1=rws[r][1]-8,w=x1-x0,h=y1-y0;const sub=crop(D,x0,y0,w,h),p=sub.d;
      const bs=[[],[],[]];for(let x=0;x<w;x+=5)for(const y of [1,h-2])for(let q=0;q<3;q++)bs[q].push(p[(y*w+x)*4+q]);const bgc=bs.map(a=>a.sort((u,v)=>u-v)[a.length>>1]);
      const dist=i=>Math.hypot(p[i]-bgc[0],p[i+1]-bgc[1],p[i+2]-bgc[2]),tol=26,isbg=new Uint8Array(w*h),st=[];const push=(x,y)=>{const q=y*w+x;if(!isbg[q]&&dist(q*4)<tol){isbg[q]=1;st.push(q);}};
      for(let x=0;x<w;x++){push(x,0);push(x,h-1);}for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
      while(st.length){const q=st.pop(),x=q%w,y=(q/w)|0;if(x>0)push(x-1,y);if(x<w-1)push(x+1,y);if(y>0)push(x,y-1);if(y<h-1)push(x,y+1);}
      for(let q=0;q<w*h;q++){const i=q*4;if(isbg[q]){p[i+3]=0;continue;}let near=false;for(const o of [-1,1,-w,w]){const t=q+o;if(t>=0&&t<w*h&&isbg[t]){near=true;break;}}if(near){const dd=dist(i);if(dd<tol*2)p[i+3]=Math.round(255*Math.max(0.3,(dd-tol*0.5)/(tol*1.5)));}}
      const bb=bbox(sub,10),cw=bb.x1-bb.x0+1,ch=bb.y1-bb.y0+1,cc=crop(sub,bb.x0,bb.y0,cw,ch),ww=Math.round(cw*SC),hh=Math.round(ch*SC);if(ax+ww+2>AW){ax=2;ay+=rowH+2;rowH=0;}
      comp.push({input:await img(cc).resize(ww,hh).png().toBuffer(),left:ax,top:ay});rects[names[r][c]]=[ax,ay,ww,hh];ax+=ww+2;rowH=Math.max(rowH,hh);
      if(r===3&&c<4){ // variante para a grama (sem o montinho de terra): g+nome
        const v={d:Buffer.from(cc.d),W:cc.W,H:cc.H};for(let q=0;q<v.W*v.H;q++){const i=q*4,R=v.d[i],Gc=v.d[i+1];if(R>Gc+12)v.d[i+3]=0;else if(R>Gc&&R+Gc+v.d[i+2]>150)v.d[i+3]=Math.round(v.d[i+3]*0.5);}
        const b2=bbox(v,40),w2=b2.x1-b2.x0+1,h2=b2.y1-b2.y0+1,c2=crop(v,b2.x0,b2.y0,w2,h2),W2=Math.round(w2*SC),H2=Math.round(h2*SC);if(ax+W2+2>AW){ax=2;ay+=rowH+2;rowH=0;}
        comp.push({input:await img(c2).resize(W2,H2).png().toBuffer(),left:ax,top:ay});rects['g'+names[r][c]]=[ax,ay,W2,H2];ax+=W2+2;rowH=Math.max(rowH,H2);}if(r===0&&c===0)console.log('decal bg',bgc);}
    const AH=ay+rowH+2;const at=sharp({create:{width:AW,height:AH,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comp);const buf=await at.png().toBuffer();
    const rr=await sharp(buf).webp({quality:84,alphaQuality:100,effort:6}).toFile(OUT+'/decals.webp');console.log('decals',rr.width,rr.height,Math.round(rr.size/1024)+'KB');info.decals={size:[AW,AH],rects};
    await sharp(buf).flatten({background:'#'+info.roadColor.map(v=>v.toString(16).padStart(2,'0')).join('')}).jpeg({quality:86}).toFile(S+'/work/p_decals.jpg'); }
  fs.writeFileSync(S+'/work/info.json',JSON.stringify(info,null,1));
})();
