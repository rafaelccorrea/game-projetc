const {sharp,load,img,keyMagenta,crop}=require('./lib.js');
module.exports=async function(file,minArea=3000){
  const o=keyMagenta(await load(file));const {d,W,H}=o;const lab=new Int32Array(W*H);const comps=[];
  for(let p0=0;p0<W*H;p0++){if(lab[p0]||d[p0*4+3]<40)continue;const id=comps.length+1;const st=[p0];lab[p0]=id;let x0=W,y0=H,x1=0,y1=0,n=0;
    while(st.length){const p=st.pop(),x=p%W,y=(p/W)|0;n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;
      for(const q of [p-1,p+1,p-W,p+W]){if(q<0||q>=W*H)continue;if(Math.abs((q%W)-x)>1)continue;if(!lab[q]&&d[q*4+3]>=40){lab[q]=id;st.push(q);}}}
    comps.push({id,x0,y0,x1,y1,n});}
  const big=comps.filter(c=>c.n>=minArea);
  // extract each with only its own label (+ soft edge pixels nearby)
  for(const c of big){const pad=3;const x0=Math.max(0,c.x0-pad),y0=Math.max(0,c.y0-pad),w=Math.min(W,c.x1+pad+1)-x0,h=Math.min(H,c.y1+pad+1)-y0;
    c.img=crop(o,x0,y0,w,h);c.ox=x0;c.oy=y0;}
  return big;
};
