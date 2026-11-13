// checkguide.js <guide.png> [--violet out.png]
// Portão GRÁTIS antes de pagar vídeos: confere fundo verde, linha do chão, margens, e se o magenta (isMagC do polevid) é SÓ o bastão.
// --violet: pixels magenta longe do bastão (chamas roxas do dragão/pantera) viram azul-violeta (fora do isMagC) -> grava out.png.
const sharp=require('C:/Users/rafae/AppData/Local/Temp/tools/node_modules/sharp');
const [,,f,flag,out]=process.argv;const isMagC=(r,g,b)=>r>150&&b>150&&g<120&&Math.abs(r-b)<90;
(async()=>{const {data,info}=await sharp(f).removeAlpha().raw().toBuffer({resolveWithObject:true});const W=info.width,H=info.height,S=W/2048;
const rows=new Int32Array(H),cols=new Int32Array(W);let green=0;const pts=[];
for(let p=0;p<W*H;p++){const r=data[p*3],g=data[p*3+1],b=data[p*3+2];if(g>r+60&&g>b+60){green++;continue}rows[(p/W)|0]++;cols[p%W]++;if(isMagC(r,g,b))pts.push(p)}
let y0=0,y1=H-1,x0=0,x1=W-1;while(rows[y0]<6)y0++;while(rows[y1]<6)y1--;while(cols[x0]<6)x0++;while(cols[x1]<6)x1--;
const rep={file:f,size:W+'x'+H,greenBg:(green/(W*H)).toFixed(2),bbox:[x0,y0,x1,y1],groundY_2048:Math.round(y1/S),topMargin:Math.round(y0/S),sideMargins:[Math.round(x0/S),Math.round((W-1-x1)/S)],magentaPx:pts.length};
const warn=[];
if(pts.length<500*S*S)warn.push('quase sem magenta: bastão sumiu?');
else{// reta robusta: 2 passadas (descarta pontos longe na 2ª)
 // RANSAC (chamas roxas grandes enganam o ajuste simples)
 let use=pts;{const sub=pts.filter((_,i)=>i%7==0);let best=-1,bu=null;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  for(let k=0;k<400;k++){const a=sub[(rnd()*sub.length)|0],b=sub[(rnd()*sub.length)|0];const ax=a%W,ay=(a/W)|0,bx=b%W,by=(b/W)|0;const l=Math.hypot(bx-ax,by-ay);if(l<150*S)continue;const nx=-(by-ay)/l,ny=(bx-ax)/l;let n=0;for(const p of sub)if(Math.abs((p%W-ax)*nx+(((p/W)|0)-ay)*ny)<18*S)n++;if(n>best){best=n;bu=[ax,ay,nx,ny]}}
  if(bu)use=pts.filter(p=>Math.abs((p%W-bu[0])*bu[2]+(((p/W)|0)-bu[1])*bu[3])<30*S)}
 let L;for(let it=0;it<3;it++){let mx=0,my=0;for(const p of use){mx+=p%W;my+=(p/W)|0}mx/=use.length;my/=use.length;let a=0,b=0,c=0;for(const p of use){const dx=p%W-mx,dy=((p/W)|0)-my;a+=dx*dx;b+=dx*dy;c+=dy*dy}
  const th=0.5*Math.atan2(2*b,a-c);L={mx,my,ux:Math.cos(th),uy:Math.sin(th)};const dist=p=>Math.abs(-(p%W-L.mx)*L.uy+(((p/W)|0)-L.my)*L.ux);use=pts.filter(p=>dist(p)<40*S)}
 const dist=p=>Math.abs(-(p%W-L.mx)*L.uy+(((p/W)|0)-L.my)*L.ux);const far=pts.filter(p=>dist(p)>45*S);
 const ts=use.map(p=>(p%W-L.mx)*L.ux+(((p/W)|0)-L.my)*L.uy).sort((a,b)=>a-b);
 rep.pole={angleDeg:+(-Math.atan2(L.uy,L.ux)*180/Math.PI).toFixed(1),lengthPx2048:Math.round((ts[ts.length-1]-ts[0])/S),onLinePx:use.length};rep.magentaOffPole=far.length;
 if(far.length>300*S*S)warn.push(`${far.length} px magenta FORA do bastão (chama/fumaça roxa?) -> o polevid vai apagar/confundir: refazer pedindo chamas azul-violeta, ou rodar com --violet`);
 if(rep.pole.lengthPx2048<500)warn.push('bastão curto (<500px): pode estar escondido/quebrado');
 if(flag==='--violet'&&out){for(const p of far){const i=p*3;data[i]=Math.round(data[i]*0.5)}await sharp(data,{raw:{width:W,height:H,channels:3}}).png().toFile(out);rep.violetWritten=out}}
if(rep.greenBg<0.3)warn.push('pouco fundo verde');if(rep.topMargin<8)warn.push('encosta no topo');if(rep.sideMargins.some(m=>m<8))warn.push('encosta na lateral');
if(rep.groundY_2048>2040)warn.push('patas encostam na borda de baixo (aceito na fênix, mas confira se as patas estão inteiras)');
rep.warnings=warn;console.log(JSON.stringify(rep,null,1));process.exitCode=warn.length?1:0})();
