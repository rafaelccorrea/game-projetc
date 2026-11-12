const {sharp,img}=require('./lib.js');const comps=require('./comps.js');
const S=process.argv[2],OUT=process.argv[3];
(async()=>{
  const cs=await comps(S+'/raw/props2.png',6000);
  const rows=[[],[],[]];for(const c of cs){const cy=(c.y0+c.y1)/2;rows[cy<560?0:cy<1040?1:2].push(c);}
  rows.forEach(r=>r.sort((a,b)=>a.x0-b.x0));console.log(rows.map(r=>r.map(c=>[c.x0,c.y0,c.x1-c.x0,c.y1-c.y0].join(','))));
  const save=async(c,name,w)=>{const r=await img(c.img).resize(w).webp({quality:88,alphaQuality:100}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');};
  await save(rows[0][0],'torch',200);
  const F=480,frames=[];
  for(const c of rows[0].slice(1,5)){const o=c.img;frames.push({input:await img(o).png().toBuffer(),left:frames.length*F+Math.round((F-o.W)/2),top:F-o.H-4});}
  const sheet=await sharp({create:{width:F*4,height:F,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toBuffer();
  let r=await sharp(sheet).resize(192*4).webp({quality:90,alphaQuality:100}).toFile(OUT+'/flame.webp');console.log('flame',r.width,r.height);
  for(let i=0;i<4;i++)await save(rows[1][i],'grass'+(i+1),480);
  await save(rows[2][0],'rock1',360);await save(rows[2][1],'rock2',360);await save(rows[2][2],'bush',380);await save(rows[2][3],'fence',360);await save(rows[2][4],'lantern',220);
})();
