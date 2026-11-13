/* Eonbound — Sys.mentors: MENTORES DAS ERAS. docs/IDLE_PARECIDOS.md §3 item 8 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   Uma figura histórica por era (9, os mesmos temas do Sys.eras / ERAS do jogo). O jogador dá PRESENTES: peças que sobraram da mochila (nunca a
   equipada nem a trancada no cadeado da Fogueira) e materiais (pedras de forja, ração de pet). Cada presente dá AMIZADE; a peça da MESMA ERA do
   mentor vale +50% (o "presente favorito"). Marcos de amizade 1 a 5: cada marco dá um ATRIBUTO PEQUENO fixo (o tema do mentor), uma FALA da
   história da era e, no marco 5, um TÍTULO (cosmético no Sys.titles: o atributo já vem daqui, sem contar duas vezes).
   - Libera: função aberta no nível DATA.needLevel; cada mentor aparece quando o jogador CHEGA à era dele (host.eraMax() >= era).
   - Nada pago, nada sorteado, sem gema. Presente é definitivo (a peça sai da mochila pelo host.removeItem, o mesmo do desmanche).
   - bonus(S): soma dos marcos de todos os mentores nas chaves do Sys.fc (o Sys.fc soma sozinho).
   Estado: S.sys.mentors {v, pts:{era:pontos}, seen:{era:marco já mostrado}}. Sem DOM. Arte de retrato: assets/mentors/m<era>.png (a Arte faz).
   Teste: test/sys/mentors.test.js */
(function(root){
'use strict';

const DATA={
  on:false,
  label:'Mentores', icon:'',
  needLevel:16,                  // PROPOSTA: abre depois do Códex (12) e da Forja (12); o PO pode mudar
  favMult:1.5,                   // peça da era do mentor vale +50%
  itemPts:[1,2,4,8,16,32],       // amizade por peça, pela raridade (Básico ... Divino)
  stonesPer:2,                   // 1 ponto a cada 2 pedras de forja
  foodPer:10,                    // 1 ponto a cada 10 de ração
  marks:[30,100,250,600,1200],   // amizade acumulada para os marcos 1..5
  // por mentor: era, nome, papel, atributo por MARCO (chave do Sys.fc; 5 marcos = 5x), 5 falas (uma por marco), título do marco 5
  list:[
    {era:0, id:'nara',   name:'Nara',    role:'Pintora das Cavernas', stat:'hpPct',  per:0.6, title:'Guardiã do Fogo',
     lines:['Antes das palavras, havia o fogo e as paredes da caverna.','Cada traço na pedra conta uma caçada que o clã venceu junto.',
            'O mamute não é inimigo: é a força que o clã aprende a respeitar.','Guardar a chama acesa é guardar a memória de todos nós.',
            'Leve o fogo adiante. As próximas eras vão precisar dele.']},
    {era:1, id:'tales',  name:'Tales',   role:'Escriba',             stat:'critPct', per:0.3, title:'Escriba das Eras',
     lines:['Escrever é fazer a voz durar mais que quem fala.','Nas tábuas de argila guardamos leis, colheitas e promessas.',
            'Um bom escriba lê o que está escrito e também o que ficou de fora.','As grandes muralhas caem; as palavras atravessam os séculos.',
            'Seu nome já está nas minhas tábuas. Agora ele não se perde.']},
    {era:2, id:'bertoldo', name:'Bertoldo', role:'Ferreiro',          stat:'atkPct', per:0.5, title:'Aprendiz da Forja',
     lines:['O ferro só obedece a quem tem paciência com o fogo.','Mil marteladas fazem uma lâmina; uma pressa a quebra.',
            'O castelo depende do ferreiro tanto quanto do cavaleiro.','Uma espada boa protege; uma espada má só assusta.',
            'Esta marca na minha bigorna agora também é sua.']},
    {era:3, id:'ines',   name:'Inês',    role:'Navegadora',          stat:'goldPct', per:2,  title:'Leitor de Estrelas',
     lines:['O mar não tem estradas: quem guia são as estrelas.','O astrolábio mede o céu para que o navio ache a terra.',
            'Mapas novos nascem de quem tem coragem de passar do último.','A pólvora mudou as guerras; a bússola mudou o mundo.',
            'Onde houver horizonte, haverá um caminho para você.']},
    {era:4, id:'otto',   name:'Otto',    role:'Inventor',            stat:'defPct', per:0.4, title:'Mestre das Engrenagens',
     lines:['O vapor empurra pistões; as ideias empurram o mundo.','Cada engrenagem é pequena, mas nenhuma máquina anda sem ela.',
            'A fábrica fez em um dia o que um vilarejo fazia num ano.','Inventar é errar com método até acertar.',
            'Guarde estas plantas. Um dia você vai construir a sua máquina.']},
    {era:5, id:'lia',    name:'Lia',     role:'Aviadora',            stat:'critPct', per:0.3, title:'Asa do Século',
     lines:['Voar foi o sonho mais antigo que a humanidade realizou.','Lá de cima, as fronteiras do mapa simplesmente somem.',
            'O rádio aproximou quem estava a oceanos de distância.','Coragem não é não ter medo: é decolar mesmo com ele.',
            'O céu é grande o bastante para todos os sonhos. Siga voando.']},
    {era:6, id:'kira',   name:'Kira',    role:'Engenheira Estelar',  stat:'atkPct', per:0.5, title:'Piloto das Estrelas',
     lines:['As cidades flutuam porque alguém calculou cada detalhe.','Os robôs ajudam; quem decide o caminho ainda somos nós.',
            'A luz das estrelas que você vê saiu delas há milhares de anos.','Toda tecnologia nova começa como uma pergunta antiga.',
            'O futuro não chega sozinho. A gente constrói, peça por peça.']},
    {era:7, id:'caronte', name:'Caronte', role:'Barqueiro do Submundo', stat:'hpPct', per:0.6, title:'Travessia Segura',
     lines:['Poucos descem até aqui e menos ainda pedem para voltar.','O rio de brasas não queima quem atravessa com propósito.',
            'Até no Submundo há regras, e eu sou quem as guarda.','Os demônios temem quem não esquece de onde veio.',
            'Meu barco leva você para os dois lados do rio. Sempre.']},
    {era:8, id:'aurora', name:'Aurora',  role:'Astrônoma Celeste',   stat:'goldPct', per:2,  title:'Guardião dos Astros',
     lines:['Daqui de cima, todas as eras parecem um só caminho.','Cada estrela é uma era que alguém já atravessou.',
            'O Juiz Celestial pesa a coragem, não a força.','A luz mais forte nasce depois da noite mais longa.',
            'Você atravessou o tempo. As estrelas agora contam a sua história.']},
  ],
  statText:{atkPct:'ATK',hpPct:'Vida',critPct:'chance de crítico',defPct:'redução de dano',goldPct:'ouro'},
};
const BY={}; for(const m of DATA.list) BY[m.era]=m;
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; if(DATA.on) registerTitles(); return DATA.on; };
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const fmtP=v=>String(Math.round(v*100)/100).replace('.',',');

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.mentors.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.mentors; if(!o||typeof o!=='object') o=S.sys.mentors={};
  o.v=1; const p=(o.pts&&typeof o.pts==='object')?o.pts:{}, s=(o.seen&&typeof o.seen==='object')?o.seen:{}; o.pts={}; o.seen={};
  for(const m of DATA.list){ const k=String(m.era); if(p[k]) o.pts[k]=int0(p[k]); if(s[k]) o.seen[k]=Math.min(DATA.marks.length,int0(s[k])); }
  return o; }

const markOf=pts=>{ let k=0; for(const t of DATA.marks) if(int0(pts)>=t) k++; return k; };
const statAt=(m,mark)=>Math.round(m.per*mark*1e6)/1e6;
const levelOf=(S,host)=>{ const L=SYS().level; try{ if(L&&L.level) return L.level(S); }catch(e){} return int0(host&&host.level&&host.level()); };
const eraMaxOf=host=>int0(host&&host.eraMax&&host.eraMax());
function isOpen(S,host){ return on()&&levelOf(S,host)>=DATA.needLevel; }
/* mentor desbloqueado: função aberta e o jogador já chegou à era dele */
function unlocked(S,host,era){ return isOpen(S,host)&&!!BY[era]&&eraMaxOf(host)>=era; }

/* peças que podem virar presente: da mochila, nem equipadas nem trancadas (cadeado do Sys.bonfire) */
function bag(host){ try{ const b=host&&host.items?(typeof host.items==='function'?host.items():host.items):[]; return Array.isArray(b)?b:[]; }catch(e){ return []; } }
function equippedIds(host){ try{ const e=host&&host.equipped?host.equipped():{}; return new Set(Object.values(e||{}).filter(Boolean).map(x=>String(typeof x==='object'?x.id:x))); }catch(e){ return new Set(); } }
const lockedIn=(S,it)=>{ const B=SYS().bonfire; try{ return !!(B&&typeof B.isLocked==='function'&&B.isLocked(S,it)); }catch(e){ return false; } };
function giftable(S,host){ const eq=equippedIds(host); return bag(host).filter(it=>it&&it.id!=null&&!eq.has(String(it.id))&&!lockedIn(S,it)); }
/* amizade que uma peça dá a um mentor */
function itemValue(it,era){ if(!it) return 0; const r=Math.max(0,Math.min(DATA.itemPts.length-1,int0(it.r))), base=DATA.itemPts[r];
  const e=it.look!=null?int0(it.look):int0(it.e); return Math.round(base*(e===era?DATA.favMult:1)); }

const stonesHave=S=>{ const F=SYS().forge; try{ return F&&F.ensure?int0(F.ensure(S).stones):0; }catch(e){ return 0; } };
const foodHave=S=>{ const P=SYS().pet; try{ return P&&P.ensure?int0(P.ensure(S).food):0; }catch(e){ return 0; } };

/* presente: {items:[id...], stones:n, food:n}. Pedras/ração são arredondadas para baixo ao múltiplo que vale ponto (não gasta sobra à toa).
   {ok, era, pts, total, mark, newMarks:[{mark, line, stat, title?}]} | {ok:false, reason: off|locked|empty|items|stones|food} */
function gift(S,host,era,g){ if(!on()) return {ok:false,reason:'off'}; era=int0(era); const m=BY[era]; if(!m) return {ok:false,reason:'era'};
  if(!unlocked(S,host,era)) return {ok:false,reason:'locked'}; g=g||{};
  if(markOf(ensure(S).pts[String(era)]||0)>=DATA.marks.length) return {ok:false,reason:'max'};   // amizade máxima: não gasta peça à toa
  const ok=giftable(S,host), ids=Array.isArray(g.items)?g.items.map(String):[], items=[];
  for(const id of ids){ const it=ok.find(x=>String(x.id)===id); if(!it||items.includes(it)) return {ok:false,reason:'items',id}; items.push(it); }
  const st=int0(g.stones)-int0(g.stones)%DATA.stonesPer, fd=int0(g.food)-int0(g.food)%DATA.foodPer;
  if(st>stonesHave(S)) return {ok:false,reason:'stones'}; if(fd>foodHave(S)) return {ok:false,reason:'food'};
  let pts=items.reduce((a,it)=>a+itemValue(it,era),0)+st/DATA.stonesPer+fd/DATA.foodPer;
  if(!pts) return {ok:false,reason:'empty'};
  if(items.length&&!(host&&typeof host.removeItem==='function')) return {ok:false,reason:'items'};
  for(const it of items) host.removeItem(it);
  if(st){ const F=SYS().forge.ensure(S); F.stones-=st; F.spent=int0(F.spent)+st; } if(fd) SYS().pet.ensure(S).food-=fd;
  const o=ensure(S), k=String(era), before=markOf(o.pts[k]||0); o.pts[k]=int0(o.pts[k])+pts; const after=markOf(o.pts[k]);
  const newMarks=[]; for(let i=before+1;i<=after;i++) newMarks.push(markInfo(m,i));
  if(after>=DATA.marks.length) grantTitle(S,host,m);
  changed(host); return {ok:true,era,pts,total:o.pts[k],mark:after,newMarks}; }
function markInfo(m,i){ const x={mark:i,line:m.lines[i-1],stat:{[m.stat]:m.per},text:`+${fmtP(m.per)}% de ${DATA.statText[m.stat]}`};
  if(i===DATA.marks.length) x.title=m.title; return x; }
/* título do marco 5: cosmético no Sys.titles (o atributo já vem do bonus daqui) */
/* Os 9 títulos entram na tabela do Sys.titles SÓ com a chave ligada (setOn(true) ou registerTitles()). O Sys.titles apaga do save título que não está
   na tabela: por isso o Engenheiro liga esta chave ANTES do primeiro Sys.titles.ensure do save (no carregamento). sync() regrava o título perdido. */
function titleId(m){ return 'mentor_'+m.id; }
function registerTitles(){ const T=SYS().titles; if(!T||typeof T.addTitle!=='function') return 0; let n=0;
  for(const m of DATA.list){ try{ if(T.addTitle({id:titleId(m),name:m.title,cosmetic:true,r:3,text:`Amizade máxima com ${m.name}, ${m.role}`})) n++; }catch(e){} } return n; }
function grantTitle(S,host,m){ const T=SYS().titles; if(!T||typeof T.grant!=='function') return false; registerTitles();
  try{ return T.grant(S,titleId(m),host); }catch(e){ return false; } }
/* regrava o título de quem já tem o marco 5 */
function sync(S,host){ if(!on()) return 0; const o=ensure(S); let n=0; for(const m of DATA.list) if(markOf(o.pts[String(m.era)]||0)>=DATA.marks.length&&grantTitle(S,host,m)) n++; return n; }
/* marca as falas novas como vistas (a tela mostra a fala uma vez; depois fica no álbum do mentor) */
function seen(S,era){ if(!on()) return false; const o=ensure(S), k=String(int0(era)); if(!BY[int0(era)]) return false; o.seen[k]=markOf(o.pts[k]||0); return true; }

function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!on()||!S) return b; const o=ensure(S);
  for(const m of DATA.list){ const k=markOf(o.pts[String(m.era)]||0); if(k) b[m.stat]+=statAt(m,k); }
  for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6; return b; }

/* tela: os 9 mentores (trancado mostra só a silhueta e a era), amizade, próximo marco, falas liberadas, peças que podem virar presente */
function view(S,host){ if(!on()) return {on:false}; sync(S,host); const o=ensure(S), open=isOpen(S,host), gl=giftable(S,host);
  const eraName=e=>{ const P=SYS().phases; const n=P&&P.DATA&&P.DATA.eraName; return Array.isArray(n)?n[e]||'':''; };
  return {on:true,open,needLevel:DATA.needLevel,stones:stonesHave(S),food:foodHave(S),stonesPer:DATA.stonesPer,foodPer:DATA.foodPer,
    mentors:DATA.list.map(m=>{ const k=String(m.era), pts=int0(o.pts[k]), mk=markOf(pts), un=unlocked(S,host,m.era);
      return {era:m.era,eraName:eraName(m.era),id:m.id,name:un?m.name:'???',role:m.role,portrait:'assets/mentors/m'+m.era+'.png',unlocked:un,
        pts,mark:mk,maxMark:DATA.marks.length,next:mk<DATA.marks.length?DATA.marks[mk]:null,
        stat:m.stat,statNow:statAt(m,mk),statMax:statAt(m,DATA.marks.length),statText:`+${fmtP(statAt(m,mk))}% de ${DATA.statText[m.stat]}`,
        lines:un?m.lines.slice(0,mk):[],newLine:un&&mk>int0(o.seen[k])?m.lines[mk-1]:null,title:mk>=DATA.marks.length?m.title:null,
        fav:un?gl.filter(it=>(it.look!=null?int0(it.look):int0(it.e))===m.era).length:0}; }),
    giftable:gl.map(it=>({id:it.id,slot:it.slot,r:int0(it.r),e:int0(it.e)}))}; }

const API={DATA,on,setOn,ensure,markOf,registerTitles,sync,isOpen,unlocked,giftable,itemValue,gift,seen,bonus,view,byEra:e=>BY[int0(e)]||null};
root.Sys=root.Sys||{}; root.Sys.mentors=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
