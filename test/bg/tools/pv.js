// previa jpeg para conferencia: node pv.js <entrada> <saida.jpg> [largura] [x0,y0,w,h em fracao]
const {sharp}=require('./lib.js');(async()=>{const [,,i,o,w,c]=process.argv;let s=sharp(i);const m=await s.metadata();console.log(m.width,m.height);
if(c){const [x,y,ww,hh]=c.split(',').map(Number);s=s.extract({left:Math.round(x*m.width),top:Math.round(y*m.height),width:Math.round(ww*m.width),height:Math.round(hh*m.height)});}
await s.resize(+(w||1500)).flatten({background:'#7fb6e8'}).jpeg({quality:82}).toFile(o);})();
