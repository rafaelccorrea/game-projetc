// confere emenda: cola a faixa direita de A com a faixa esquerda de B. node join.js A B saida.jpg [largura da faixa]
const {sharp}=require('./lib.js');(async()=>{const [,,a,b,o,ww]=process.argv;const w=+(ww||500);const ma=await sharp(a).metadata(),mb=await sharp(b).metadata();
const L=await sharp(a).extract({left:ma.width-w,top:0,width:w,height:ma.height}).png().toBuffer(),R=await sharp(b).extract({left:0,top:0,width:w,height:mb.height}).png().toBuffer();
await sharp({create:{width:2*w,height:ma.height,channels:4,background:'#7fb6e8'}}).composite([{input:L,left:0,top:0},{input:R,left:w,top:0}]).jpeg({quality:85}).toFile(o);})();
