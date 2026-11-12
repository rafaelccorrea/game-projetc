// Pos-processo: (1) tira o contorno reto do topo do chao; (2) gera versoes leves da vila. uso: node finish.js <pastaDaEra>
const {sharp,load,img}=require('./lib.js');const D=process.argv[2];
(async()=>{
  const g=await load(D+'/ground.webp');const {d,W,H}=g;const rows=[];
  for(let y=0;y<Math.round(H*0.14);y++){let n=0,op=0;for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]>128){op++;if(d[i]+d[i+1]+d[i+2]<270)n++;}}rows.push([y,op,n]);}
  const line=rows.filter(r=>r[1]>W*0.9&&r[2]>W*0.5).map(r=>r[0]);console.log('linha escura nas linhas',line.join(','));
  if(line.length){const y0=line[0]-2,y1=line[line.length-1]+2;
    for(let y=Math.max(0,y0);y<=y1;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]<10)continue;const lum=d[i]+d[i+1]+d[i+2];if(lum<330){const t=Math.min(1,(330-lum)/120);d[i]=Math.round(d[i]+(84-d[i])*t);d[i+1]=Math.round(d[i+1]+(158-d[i+1])*t);d[i+2]=Math.round(d[i+2]+(50-d[i+2])*t);}}
    // esmaece o alfa das 3 primeiras linhas opacas
    for(let x=0;x<W;x++){let k=0;for(let y=0;y<=y1&&k<3;y++){const i=(y*W+x)*4;if(d[i+3]>40){d[i+3]=Math.round(d[i+3]*(0.35+0.25*k));k++;}}}
    const r=await img(g).webp({quality:88,alphaQuality:100,effort:6}).toFile(D+'/ground_tmp.webp');console.log('ground',r.width,r.height,Math.round(r.size/1024)+'KB');}
  for(const n of ['midA','midB']){const r=await sharp(D+'/'+n+'.webp').resize(1056).webp({quality:70,alphaQuality:90}).toFile(D+'/'+n+'_lo.webp');console.log(n+'_lo',r.width,r.height,Math.round(r.size/1024)+'KB');}
})();
