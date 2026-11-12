// ERA 0: recorta as duas folhas de props (raw/props.png, raw/props2.png). uso: node props0.js <pastaTrabalho> <pastaSaida>
const {sharp,img}=require('./lib.js');const comps=require('./comps.js');
const S=process.argv[2],OUT=process.argv[3];
const save=async(c,name,w,q=86)=>{const r=await img(c.img||c).resize(w).webp({quality:q,alphaQuality:100,effort:6}).toFile(OUT+'/'+name+'.webp');console.log(name,r.width,r.height,Math.round(r.size/1024)+'KB');};
const byRows=(cs,cuts)=>{const rows=cuts.map(()=>[]);rows.push([]);for(const c of cs){const cy=(c.y0+c.y1)/2;let k=0;while(k<cuts.length&&cy>=cuts[k])k++;rows[k].push(c);}rows.forEach(r=>r.sort((a,b)=>a.x0-b.x0));return rows;};
(async()=>{
  // ---- folha 1: nuvens / pterossauro em 4 quadros / chama em 4 quadros + fogueira + geiser
  let rows=byRows(await comps(S+'/raw/props.png',6000),[480,1040]);console.log('props1',rows.map(r=>r.length));
  for(let i=0;i<3;i++)await save(rows[0][i],'cloud'+(i+1),480,82);
  { const F=660,frames=[];   // alinha pelo bico (pixel mais a direita)
    for(const c of rows[1]){const o=c.img;let bx=-1,by=0;for(let x=o.W-1;x>=0&&bx<0;x--)for(let y=0;y<o.H;y++)if(o.d[(y*o.W+x)*4+3]>128){bx=x;by=y;break;}
      frames.push({input:await img(o).png().toBuffer(),left:frames.length*F+(F-16-bx),top:Math.round(F*0.47-by)});console.log('ptero',o.W,o.H,bx,by);}
    const sheet=await sharp({create:{width:F*frames.length,height:F,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toBuffer();
    const r=await sharp(sheet).resize(168*frames.length).webp({quality:88,alphaQuality:100}).toFile(OUT+'/ptero.webp');console.log('ptero sheet',r.width,r.height,Math.round(r.size/1024)+'KB');
    await sharp(sheet).resize(1320).flatten({background:'#e9a0a0'}).jpeg().toFile(S+'/work/p_ptero.jpg'); }
  { const F=480,frames=[];for(const c of rows[2].slice(0,4)){const o=c.img;frames.push({input:await img(o).png().toBuffer(),left:frames.length*F+Math.round((F-o.W)/2),top:F-o.H-4});}
    const sheet=await sharp({create:{width:F*4,height:F,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(frames).png().toBuffer();
    const r=await sharp(sheet).resize(176*4).webp({quality:88,alphaQuality:100}).toFile(OUT+'/flame.webp');console.log('flame',r.width,r.height,Math.round(r.size/1024)+'KB'); }
  await save(rows[2][4],'campfire',300);await save(rows[2][5],'vent',300);
  // ---- folha 2: plantas do primeiro plano / pedras, cicadacea, dinossauro / tocha, caveira, totem, costelas, pedra pintada
  rows=byRows(await comps(S+'/raw/props2.png',6000),[560,1000]);console.log('props2',rows.map(r=>r.map(c=>[c.x0,c.y0,c.x1-c.x0,c.y1-c.y0].join(','))));
  for(let i=0;i<4;i++)await save(rows[0][i],'fern'+(i+1),380,82);
  await save(rows[1][0],'rock1',340);await save(rows[1][1],'rock2',340);await save(rows[1][2],'cycad',360);await save(rows[1][3],'dino',420,88);
  const r3=rows[2];await save(r3[0],'torch',170);await save(r3[1],'skullpole',240);await save(r3[2],'totem',170);await save(r3[r3.length-1],'runestone',220);
  { const parts=r3.slice(3,r3.length-1);const x0=Math.min(...parts.map(c=>c.ox)),y0=Math.min(...parts.map(c=>c.oy)),x1=Math.max(...parts.map(c=>c.ox+c.img.W)),y1=Math.max(...parts.map(c=>c.oy+c.img.H));
    const comp=[];for(const c of parts)comp.push({input:await img(c.img).png().toBuffer(),left:c.ox-x0,top:c.oy-y0});
    const buf=await sharp({create:{width:x1-x0,height:y1-y0,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(comp).png().toBuffer();
    const r=await sharp(buf).resize(380).webp({quality:86,alphaQuality:100}).toFile(OUT+'/ribs.webp');console.log('ribs',parts.length,'partes',r.width,r.height,Math.round(r.size/1024)+'KB'); }
})();
