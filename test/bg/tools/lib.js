const path=require('path');
const sharp=require('C:/Users/rafae/AppData/Local/Temp/tools/node_modules/sharp');
async function load(f){const {data,info}=await sharp(f).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {d:data,W:info.width,H:info.height};}
function img(o){return sharp(o.d,{raw:{width:o.W,height:o.H,channels:4}});}
// chroma magenta -> alpha
function keyMagenta(o,lo=50,hi=130){const {d,W,H}=o;const a=new Float32Array(W*H);
 for(let p=0;p<W*H;p++){const i=p*4;const m=Math.min(d[i],d[i+2])-d[i+1];a[p]=m<=lo?1:m>=hi?0:1-(m-lo)/(hi-lo);}
 // erode 1px: pixels adjacent to fully transparent get reduced, and despill
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const p=y*W+x,i=p*4;let al=a[p];
  let near=false;for(let dy=-2;dy<=2&&!near;dy++)for(let dx=-2;dx<=2;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=W||yy>=H)continue;if(a[yy*W+xx]<0.5){near=true;break;}}
  if(near||al<1){const g=d[i+1];const m=Math.min(d[i],d[i+2])-g;if(m>0){const k=Math.min(1,m/40);d[i]=Math.round(d[i]-(d[i]-Math.max(g,d[i]*0.45))*k);d[i+2]=Math.round(d[i+2]-(d[i+2]-Math.max(g,d[i+2]*0.45))*k);}}
  d[i+3]=Math.round(255*al);}
 return o;}
// crossfade wrap: output width W-O, seamless horizontally
function wrap(o,O){const {d,W,H}=o;const NW=W-O;const out=Buffer.alloc(NW*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<NW;x++){const j=(y*NW+x)*4;const i=(y*W+x)*4;
  if(x>=O){d.copy(out,j,i,i+4);continue;}
  let t=x/O;t=t*t*(3-2*t);const k=(y*W+(NW+x))*4;
  const a1=d[i+3]/255*t,a2=d[k+3]/255*(1-t),A=a1+a2;
  if(A<=0){continue;}
  for(let c=0;c<3;c++)out[j+c]=Math.round((d[i+c]*a1+d[k+c]*a2)/A);
  out[j+3]=Math.round(255*Math.min(1,A));}
 return {d:out,W:NW,H};}
function crop(o,x0,y0,w,h){const out=Buffer.alloc(w*h*4);for(let y=0;y<h;y++)o.d.copy(out,y*w*4,((y+y0)*o.W+x0)*4,((y+y0)*o.W+x0+w)*4);return {d:out,W:w,H:h};}
function bbox(o,th=16){let x0=o.W,y0=o.H,x1=-1,y1=-1;for(let y=0;y<o.H;y++)for(let x=0;x<o.W;x++)if(o.d[(y*o.W+x)*4+3]>th){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}return {x0,y0,x1,y1};}
module.exports={sharp,load,img,keyMagenta,wrap,crop,bbox};
