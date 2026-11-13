// Simulação de 180 dias (fps-e2): calendário pelo XP (Sys.level v9) e FC do jogador com TODOS os sistemas × FC recomendada (Sys.phases).
// Uso: node tools/sim-180-dias.js [--scale]  (--scale liga a proposta Sys.phases.DATA.fcScale). Relatório: reports/sim-180-dias.md
const R=p=>require(process.cwd()+'/js/sys/'+p+'.js');
const FG=R('forge'), ST=R('stats'), FC=R('fc'), LV=R('level'), VIP=R('vip'), PH=R('phases'), MO=R('mount'), TI=R('titles');
ST.setEra9(true); LV.setV9(true); if(process.argv.includes('--scale')) PH.DATA.fcScale.on=true;
const LIN=[1,12,25,40,55,70,85,100,110], LOUT=[12,25,40,55,70,85,100,110,120];
const eraOfLevel=L=>{ let e=0; for(let i=0;i<9;i++) if(L>=LIN[i]) e=i; return e; };
const KILL=[3663,3180,3024,3934,3909,4854,4846,4842,5799], M={activeMin:40,offline:160,missions:230,inst:320}, CAP={mid:0.3,over:0.1};
const capKill=(raw,e)=>{ const t=KILL[e]; return Math.min(raw,t)+CAP.mid*Math.max(0,Math.min(raw,2*t)-t)+CAP.over*Math.max(0,raw-2*t); };
const VT=VIP.DATA.table;
function dayXp(e,L,o){ const v=o.vip||0, xpP=1+(VT.xp9[v]||0)/100+(o.guildXp||0)/100, speed=v>=5&&L>=40?4:(v>=1||L>=15)?2:1;
  const kill=capKill(KILL[e]*(L<15?1:Math.min(speed,4)/2),e)*xpP; return kill+(M.offline+M.missions+M.inst*(v>=1?1.5:1))*(1+e)*xpP; }
const X=LV.DATA.v9.xpToNext;
const capR=(L,e)=>L>=105&&e>=7?5:L>=85&&e>=5?4:L>=70&&e>=4?3:L>=25?2:L>=10?1:0, forgeAt=e=>Math.min(15,Math.round(2+1.6*e));
function baseFc(L,e,r,forge,qp){ const S={sys:{level:{lvl:L,xp:0},forge:{lv:{}}}}; for(const s of ST.DATA.slots) S.sys.forge.lv[s]=forge;
  const eq={}; for(const s of ST.DATA.slots){ if(s==='wing'&&(L<50||r<2)) continue; eq[s]={slot:s,e,r:s==='weapon'&&r===3?2:r,lvl:L,subs:[],qp,wing:'angel'}; }
  const h={equipped:()=>eq,eraMax:()=>e,level:()=>L,atk:()=>0,hp:()=>0,now:()=>0}; return Math.round(FC.compute(S,h)); }
// títulos: fração conquistada por dia (os de nível/era/torre/arena/pets vêm com o progresso): ~linear até 70% no dia 180; destaque ×2 de um
const titlesPct=d=>{ let a=0; for(const t of TI.DATA.titles) a+=(t.bonus&&t.bonus.atkPct)||0; return a*Math.min(0.7,d/180*0.7); };
// pet (17b): parte da FC total 8-25% pela raridade; jogador típico: Básico/Raro até a era 3, Épico (Dragão/Papagaio-fênix) da torre 100, Mítico era 4+
const petShare=(L,e)=>L<20?0:[0.08,0.11,0.11,0.14,0.17,0.17,0.17,0.17,0.20][e]*Math.min(1,(L-20)/40+0.3);
// montaria: oferta (lobo Épico) só no pagante; grátis ganha montaria Rara no Nv 38 (passe/evento) e Épica ~era 5; nível = jogador/2; estrelas pela atividade (1/dia)
const mountPct=(L,d,pay)=>{ if(!pay&&L<38) return 0; const id=pay?'wolf':(L>=85?'griffin':'horse'), st=Math.min(5,1+Math.floor((pay?d:Math.max(0,d-20))/25)); return MO.pctOf(id,Math.min(60,Math.floor(L/2)),st); };
const guildPct=d=>Math.min(5,d<12?0:(d-12)/90*5);   // estandartes ATK/Vida até +5% (guilda nível 10 em ~3 meses)
const vipPct=v=>VT.atk[v]||0;
function run(o){ let L=1,xp=0; const rows=[]; let stuck=0, easy=0;
  for(let d=1;d<=200;d++){ const e0=eraOfLevel(L); xp+=d===1?dayXp(0,1,o)*0.9:dayXp(e0,L,o); while(L<120&&xp>=X[L-1]){ xp-=X[L-1]; L++; }
    const e=eraOfLevel(L), f=(L-LIN[e])/Math.max(1,LOUT[e]-LIN[e]), r=capR(L,e), forge=Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
    const qp=o.vip?6000:4000;   // qualidade: grátis 3★ médio (garimpo), VIP/fusão 4★
    const base=baseFc(L,e,r,forge,qp), pct=1+(titlesPct(d)+mountPct(L,d,!!o.vip)+guildPct(d)+vipPct(o.vip||0))/100, withPet=base*pct/(1-petShare(L,e));
    // fase onde o jogador está: dificuldades exigidas da era percorridas pelo progresso de nível na era
    const req=PH.DATA.required[e], idx=Math.min(req*100-1,Math.floor(f*req*100)), dd=Math.floor(idx/100), n=idx%100+1, rec=PH.fcRec(e,dd,n);
    const m=withPet/rec; if(m<0.9) stuck++; if(m>2) easy++;
    rows.push({d,L,e,dd,n,base,fc:Math.round(withPet),rec,m:Math.round(m*100)/100}); if(L>=120&&d>=180) break; }
  const endDay=k=>{ const r=rows.find(x=>x.L>=LOUT[k]); return r?r.d:null; };
  return {rows,stuck,easy,end:LOUT.map((_,k)=>endDay(k)),day120:(rows.find(x=>x.L>=120)||{}).d}; }
const free=run({}), vip10=run({vip:10}), vip5=run({vip:5});
const ab=v=>ST.abbr(v);
for(const [k,R_] of [['GRÁTIS',free],['VIP 5',vip5],['VIP 10',vip10]]){
  console.log('\n'+k+': fim das eras (dia):',JSON.stringify(R_.end),'| Nv 120 no dia',R_.day120,'| dias abaixo de 90% da FC rec.:',R_.stuck,'| dias acima de 2×:',R_.easy);
  for(const d of [1,3,7,14,30,45,60,90,120,150,180]){ const r=R_.rows[Math.min(d,R_.rows.length)-1]; if(!r) continue; console.log('  dia '+String(d).padStart(3),'Nv',String(r.L).padStart(3),'era',r.e,PH.DATA.diffName[r.dd].padEnd(7),'fase',String(r.n).padStart(3),'| FC base',ab(r.base).padEnd(6),'com tudo',ab(r.fc).padEnd(6),'| rec.',ab(r.rec).padEnd(6),'| margem ×'+r.m); } }
// por era: margem mínima e máxima (onde trava / onde passa fácil)
for(const [k,R_] of [['GRÁTIS',free],['VIP 10',vip10]]){ const by={}; for(const r of R_.rows){ const b=by[r.e]||(by[r.e]={min:9,max:0}); b.min=Math.min(b.min,r.m); b.max=Math.max(b.max,r.m); }
  console.log(k+' margem por era (mín-máx):',Object.entries(by).map(([e,b])=>e+':'+b.min.toFixed(2)+'-'+b.max.toFixed(2)).join(' ')); }
// contribuição de cada fonte no dia 120 (grátis)
{ const r=free.rows[119], L=r.L, e=r.e; console.log('\nFontes no dia 120 (grátis, Nv '+L+'): títulos +'+titlesPct(120).toFixed(1)+'% · montaria +'+mountPct(L,120,false).toFixed(1)+'% · guilda +'+guildPct(120).toFixed(1)+'% · pet '+(petShare(L,e)*100).toFixed(0)+'% da FC total'); }
// multiplicador médio das fontes novas (FC com tudo ÷ FC base) por era, grátis e VIP 10; margem mínima de cada era em cada perfil
for(const [k,R_] of [['GRÁTIS',free],['VIP 10',vip10]]){ const by={}; for(const r of R_.rows){ const b=by[r.e]||(by[r.e]={s:0,n:0}); b.s+=r.fc/r.base; b.n++; }
  console.log('EXTRA '+k+': '+Object.entries(by).map(([e,b])=>e+':×'+(b.s/b.n).toFixed(2)).join(' ')); }
// diamantes: base aprovada + conquistas alcançáveis em 180 dias (grátis) + arena (online, Ouro/Platina)
const AC=R('achievements'); let gems=0; const reach={kill:300000,boss:3000,ult:4000,phases:2300,tower:150,arena:300,instance:600,level:120,era:8,fc:1.3e15,stage:3,chest:900,activity:150,login:170,pets:6,petStars:5,petEvo:2,mounts:2,mountLvl:60,weaponR:4,wings:2,summon:200,titles:24,upgrade:2500,forgeLvl:15,forgeStones:5000,practice:180,fuse:12,transform:40,guild:1,donate:150,guildBoss:60,tourney:20};
const done=[]; for(const a of AC.DATA.list){ const v=reach[a.id]||0; if(v>=a.tiers[a.tiers.length-1]){ gems+=a.lastGems; done.push(a.id); } }
console.log('DIAMANTES conquistas (grátis, 180 dias): '+gems+' ('+done.length+' completas: '+done.join(',')+')');
