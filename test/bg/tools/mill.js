// Recorta o moinho da camada midB: devolve {B (sem moinho), blade:{img,pivot}, hub}
const {sharp,img,crop,bbox}=require('./lib.js');
const HUB=[2345,562], U=[0.640,-0.769], V=[0.769,0.640];
module.exports=async function(B,S){
  const {d,W,H}=B;const A=(x,y)=>(y*W+x)*4;
  // 1) pá de cima-direita -> sprite
  const bl={d:Buffer.alloc(d.length),W,H};
  for(let y=200;y<620;y++)for(let x=2300;x<2640;x++){const rx=x-HUB[0],ry=y-HUB[1];const r=rx*U[0]+ry*U[1],c=rx*V[0]+ry*V[1];
    if(r>=108&&r<=350&&c>=-80&&c<=66){const i=A(x,y);if(d[i+3]>0)d.copy(bl.d,i,i,i+4);}}
  const bb=bbox(bl,8);const pad=2;const bx=bb.x0-pad,by=bb.y0-pad,bw=bb.x1-bb.x0+1+2*pad,bh=bb.y1-bb.y0+1+2*pad;
  const blade=crop(bl,bx,by,bw,bh);const pivot=[HUB[0]-bx,HUB[1]-by];
  // 2) remover o moinho: geometria (acima da cumeeira/chamine) + cor (ao lado da macieira)
  const OX=2000,OY=230;
  const keepTree=new Uint8Array(W*H);
  const isTree=(i)=>{const r=d[i],g=d[i+1],b=d[i+2];return d[i+3]>20&&((g>r+8&&g>b+8)||(r>150&&g<95&&b<95&&r>g+70)||(r>g+25&&g>b+5&&r<150&&(i/4%W)-OX>520));};
  const tl=cy=>cy<260?680:cy<300?575:cy<400?518:cy<440?480:430;
  for(let cy=20;cy<585;cy++)for(let cx=tl(cy);cx<600;cx++){const i=A(cx+OX,cy+OY);if(isTree(i))keepTree[i/4]=1;}
  for(let cy=20;cy<585;cy++)for(let cx=80;cx<585;cx++){const x=cx+OX,y=cy+OY,i=A(x,y);if(d[i+3]===0)continue;let rm=false;
    if(cx<318)rm=cy<537+(cx-100)*0.125-3;
    else if(cx<416)rm=cy<509;
    else if(cy<578){ if(keepTree[i/4])rm=false; else{const lum=(d[i]+d[i+1]+d[i+2])/3;let nearT=false;
        if(lum<95){for(let dy=-4;dy<=4&&!nearT;dy++)for(let dx=-4;dx<=4;dx++){if(keepTree[(y+dy)*W+x+dx]){nearT=true;break;}}}
        rm=!nearT;} }
    if(rm)d[i+3]=0;}
  for(let cx=138;cx<244;cx++){const yt=Math.round(537+(cx-100)*0.125);for(let cy=yt-3;cy<yt+15;cy++){const i=A(cx+OX,cy+OY);const dk=cy<yt+2;d[i]=dk?38:118;d[i+1]=dk?16:44;d[i+2]=dk?20:52;d[i+3]=255;}}
  // ponta da pa que invadia a cumeeira -> cor do telhado
  for(let cy=530;cy<575;cy++)for(let cx=95;cx<318;cx++){const i=A(cx+OX,cy+OY);if(d[i+3]>0&&d[i]>170&&d[i+1]>140&&d[i+2]>100){d[i]=118;d[i+1]=44;d[i+2]=52;}}
  if(S)await img(crop(B,2000,230,700,700)).flatten({background:'#7fb6e8'}).jpeg({quality:88}).toFile(S+'/work/mill_removed.jpg');
  if(S)await img(blade).flatten({background:'#7fb6e8'}).jpeg().toFile(S+'/work/blade.jpg');
  return {blade,pivot,hub:HUB};
};
