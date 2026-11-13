'use strict';
/* ================= STAGEKIT: O PALCO COMPARTILHADO DAS TELAS V2 (desligado; fora do index.html) =================
   docs/proto/v2/PASSAGEM.md, seção 0. Casca FINA sobre a rota única do jogo (combinado com o Engenheiro, 13/11):
   window.drawHeroFull(ctx, x, y, scale, state) em js/battle.js já resolve arma no grip, asa na âncora das costas por quadro, montaria (MOUNT_TBL),
   aura, skin fixa / pasta _nowing e o PET POR ÚLTIMO (na frente). Este arquivo NÃO desenha nada por conta própria e NÃO muda a ordem:
   - recebe o look no formato combinado com o Servidor (window.heroSnapshot): {hero, skin, armor, mount:{id,stars}|null, pet:{base,stage,fly}|null,
     wing, aura, weapon:{e,r,type}|null};
   - traduz para o state do drawHeroFull (toState);
   - guarda a prévia ("Prévia: X · Sair") por cima do look atual;
   - devolve a GEOMETRIA de um quadro a partir do .json da folha (geometryOf), para testes e para as telas posicionarem selos sem adivinhar.
   Herói e pet diferentes do save: state.hero e state.pet {base,stage,fly} (Engenheiro 0d2eb8d); kit.limits fica vazio. Falta ver na tela (só node).
   Teste: node test/sys/stagekit.test.js (geometria nas folhas reais). */
(function(root){
const DATA={on:false};
/* pés do herói quando o .json não traz feetY (folhas do hyb/R e das skins): o drawHeroAnim usa 242 no quadro de 256 */
const DEFAULT_FEET=242;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
/* look (formato do heroSnapshot) → state do drawHeroFull. Campo ausente = deixa a rota usar o do save. null = esconder. */
function toState(look,opt){ const L=look||{}, o=opt||{}, s={};
  if(o.t!=null) s.t=o.t; if(o.walking) s.walking=true; if(o.act) s.act=o.act;
  if('mount' in L) s.mount=L.mount?{id:String(L.mount.id),stars:Math.max(1,Math.min(7,(L.mount.stars|0)||1))}:false;
  if('wing' in L) s.wing=L.wing?String(L.wing):false;
  if('pet' in L) s.pet=L.pet?(L.pet.base?{base:String(L.pet.base),stage:Math.max(1,Math.min(3,(L.pet.stage|0)||1)),fly:+L.pet.fly||0}:true):false;   /* objeto = desenha ESSE pet (Engenheiro 0d2eb8d) */
  if(L.hero==='kael'||L.hero==='kaia') s.hero=L.hero;
  if(L.skin) s.skin=String(L.skin);
  try{ if(L.weapon&&typeof root.wFamLook==='function') s.weapon=root.wFamLook(L.weapon); }catch(e){}
  try{ if(L.armor&&typeof root.SKIN==='function'){ const a=root.SKIN(L.armor); if(a) s.armor=a; } }catch(e){}
  return s; }
/* o que o drawHeroFull ainda não troca. Desde o 0d2eb8d (Engenheiro) a rota troca herói (state.hero) e pet (state.pet objeto): nada falta. */
function limitsOf(look){ return []; }
/* geometria de um quadro f a partir do .json da folha: pés, grip (mão), costas (raiz da asa) e caixa do quadro na imagem (grade com cols) */
function geometryOf(meta,f){ const M=meta||{}, n=Math.max(1,M.frames|0), i=((f|0)%n+n)%n, cols=M.cols||n;
  const g=Array.isArray(M.grip)?M.grip[i]:null, b=Array.isArray(M.back)?M.back[i]:null;
  return {frame:i, sx:(i%cols)*num(M.w,0), sy:Math.floor(i/cols)*num(M.h,0), w:num(M.w,0), h:num(M.h,0), feetY:num(M.feetY,DEFAULT_FEET),
    grip:g?{x:g.x,y:g.y,ang:g.ang,behind:!!g.behind}:null, back:b?{x:b.x!=null?b.x:b[0],y:b.y!=null?b.y:b[1]}:null}; }
function create(canvas,opt){ const o=Object.assign({scale:1,feetX:0.5,feetY:0.92},opt||{}); let look={}, pv=null, last=null;
  const cur=()=>pv?Object.assign({},look,pv):look;
  return {
    setLook(l){ look=Object.assign({},l||{}); pv=null; },
    preview(part){ pv=Object.assign({},part||{}); },
    endPreview(){ pv=null; },
    get previewing(){ return !!pv; },
    get limits(){ return limitsOf(cur()); },
    /* um quadro: limpa e chama a rota do jogo. Devolve false se a folha ainda está carregando (chamar de novo no próximo quadro). */
    draw(t){ if(!DATA.on||!canvas||typeof root.drawHeroFull!=='function') return false; const x=canvas.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,canvas.width,canvas.height);
      const st=toState(cur(),{t:Math.max(0,num(t,0))}); last=st; return root.drawHeroFull(x,canvas.width*o.feetX,canvas.height*o.feetY,o.scale,st)!==false; },
    lastState:()=>last
  }; }
const API={DATA,DEFAULT_FEET,create,toState,geometryOf,limitsOf};
root.StageKit=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
