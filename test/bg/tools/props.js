const {sharp,img}=require('./lib.js');const comps=require('./comps.js');
const S=process.argv[2],OUT=process.argv[3];
(async()=>{
  const cs=await comps(S+'/raw/props.png');
  cs.sort((a,b)=>(Math.round(a.y0/400)-Math.round(b.y0/400))||a.x0-b.x0);
  cs.forEach((c,i)=>console.log(i,c.x0,c.y0,c.x1,c.y1,c.n));
  const save=async(c,name,w,flop)=>{let s=img(c.img).resize(w);if(flop)s=s.flop();const r=await s.webp({quality:88,alphaQuality:100}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');};
  const rows=[[],[],[]];for(const c of cs){const cy=(c.y0+c.y1)/2;rows[cy<500?0:cy<1000&&c.x0<2500?1:(c.x0>=2500?1:2)].push(c);}
  rows.forEach(r=>r.sort((a,b)=>a.x0-b.x0));
  console.log(rows.map(r=>r.length));
  for(let i=0;i<3;i++)await save(rows[0][i],'cloud'+(i+1),640);
  await save(rows[1][0],'flag1',520);await save(rows[1][1],'flag2',380);await save(rows[1][2],'flag3',380,true);
  const pole=rows[1][3];const pr=await img(pole.img).resize({height:640}).webp({quality:88}).toFile(OUT+'/pole.webp');console.log('pole',pr.width,pr.height);
  // birds: align by beak (rightmost pixel), frame 220x220
  const F=600,frames=[];
  for(const c of rows[2]){const o=c.img;let bx=-1,by=0;for(let x=o.W-1;x>=0&&bx<0;x--)for(let y=0;y<o.H;y++)if(o.d[(y*o.W+x)*4+3]>128){bx=x;by=y;break;}
    frames.push({input:await img(o).png().toBuffer(),left:frames.length*F+(F-20-bx),top:Math.round(F/2-by)});console.log('bird',o.W,o.H,bx,by);}
  const sheet=await sharp({create:{width:F*frames.length,height:F,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toBuffer();
  const r=await sharp(sheet).resize(128*frames.length).webp({quality:90,alphaQuality:100}).toFile(OUT+'/bird.webp');console.log('bird sheet',r.width,r.height,Math.round(r.size/1024)+'KB');
  await sharp(sheet).resize(1200).flatten({background:'#7fb6e8'}).jpeg().toFile(S+'/work/bird_prev.jpg');
})();
