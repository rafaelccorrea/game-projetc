'use strict';
/* ================= 30 CÓDEX DAS ERAS V2 — tela nova, nasce DESLIGADA (PANEL_ON.codex) =================
   Protótipo: docs/proto/Codex.dc.html (V2 aprovada: álbum com 6 cartões, categoria por era, ficha do item). Arte real de assets/ (sem blob).
   Catálogo (o que EXISTE no jogo): armas = ERAS[e].w[0|2|4] + assets/weapons/era<e>_t<0-2>.png (ataque ×RAR[r].m); armaduras = assets/icons/slots/era<e>_<espaço>.png com o atributo
   principal vindo de Sys.stats.DATA.main; pets = assets/pets/*_ref|mid|evo.png; montarias = Sys.mount.DATA.mounts (+ maxPct); bestiário = assets/enemies/era<e>_{e0,e1,boss}.png com
   os nomes de assets/enemies/meta.json; auras = assets/anim/aura/aura<N>.png. Nenhuma regra nem número é inventado aqui.
   POSSE / PROGRESSO / PRÊMIOS: NÃO existem em nenhum módulo hoje (não há "descobertas" salvas). Por isso ficam atrás de chave DESLIGADA, como as Missões:
   window.P_CODEX = { owned:false, rewards:false } e duas funções isoladas que hoje devolvem null (cdxOwned, cdxRewards). Desligado, a tela mostra o catálogo sem "tenho/falta",
   sem %, sem filtro e sem marcos (nada vazio, nada de "em breve"). Contrato (Q-9 em reports/pedidos-entre-agentes.md):
     readOwned() → Array|Set de ids do catálogo que o jogador já teve (ids: w-<era>-<0|1|2>, a-<era>-<espaço>, m-<id>, p-<pet>-<0|1|2>, b-<era>-<e0|e1|boss>, u-<7|10|13>)
     readRewards() → {claimed:[p..], marks:[{p, txt, img?}], claim(p) → {ok, txt}}  (marcos em % da coleção; só o PRÓXIMO aparece)
   DIFERENÇAS CONSCIENTES: sem emoji; "Papagaio-fênix" vira "Papagaio" (a fênix saiu do jogo); todas as armaduras existentes (6 espaços × 7 eras) em vez de 15 amostras;
   o bestiário cobre as 7 eras com nome (as eras 7 e 8 têm arte mas não têm nome no meta.json: ficam de fora); "Ir" abre a tela do jogo quando ela existe, senão avisa. */
const XK={view:'album',cat:'pet',filt:0,sel:null,meta:null,metaTry:false,gen:0};
const K_MINH=560;
const K_CATS=[{k:'arm',n:'Armas',c:'#ff8a6a'},{k:'eq',n:'Armaduras',c:'#4aa3ff'},{k:'pet',n:'Pets',c:'#ff8ad8'},{k:'mnt',n:'Montarias',c:'#b07cff'},{k:'bes',n:'Bestiário',c:'#ff5a5a'},{k:'aur',n:'Auras',c:'#ffc94a'}];
const K_ERAX=['Submundo','Celestial','Prismático'];   /* eras de pet além das 7 de ERAS */
const K_SLOTS=[['vest','Colete','armor'],['helmet','Elmo','hat'],['gloves','Luvas','gloves'],['boots','Botas','boots'],['necklace','Colar','necklace'],['wings','Asa','wing']];
const K_STAT={atk:'Ataque',hp:'Vida',def:'Defesa',critRate:'Crítico',aspd:'Velocidade de ataque',critDmg:'Dano crítico',atkPct:'Ataque %',hpPct:'Vida %'};
const K_STG=['Filhote','Médio','Evoluído'], K_STGF=['ref','mid','evo'];
const K_PETS=[{id:'mamute',n:'Mamute',era:0,r:0,f:'era0_mammoth',atk:['Chifrada','Jato de tromba','Tremor']},{id:'esfinge',n:'Esfinge',era:1,r:1,f:'era1_sphinx',atk:['Garra','Raio do sol','Tempestade de areia']},
  {id:'dragao',n:'Dragão',era:2,r:2,f:'era2_dragon',atk:['Mordida','Bola de fogo','Rabada']},{id:'papagaio',n:'Papagaio',era:3,r:2,f:'era3_parrot',atk:['Bicada','Pena de fogo','Rasante']},
  {id:'cao',n:'Cão mecânico',era:4,r:3,f:'era4_mechdog',atk:['Mordida de aço','Parafuso disparado','Jato de vapor']},{id:'cerbero',n:'Cérbero',era:7,r:3,f:'era7_cerberus',atk:['Mordida tripla','Chama do submundo','Uivo']},
  {id:'pegaso',n:'Pégaso',era:8,r:4,f:'era8_pegasus',atk:['Coice','Estrela cadente','Vendaval']},{id:'prisma',n:'Raposa de cristal',era:9,r:5,f:'prism_fox',atk:['Patada de cristal','Lança de cristal','Prisma']}];
/* 3 PETS NOVOS no Códex (PO: item completo inclui o Códex). Entram NO FIM e só quando o módulo os conta: Sys.codex.newPets() (Sistemas aeb043a) devolve os ids
   que valem agora ([] enquanto as entregas do Sys.newDrops estão desligadas: sem elas ninguém obtém esses pets e a coleção nunca chegaria a 100%).
   Não são de uma era: en = texto no lugar do nome da era ('' = só o nome); how = origem (Sistemas, fontes do js/sys/newdrops.js). */
const K_PETS_NEW=[{id:'lobo',n:'Lobo sombrio',era:-3,en:'',r:1,f:'pet_shadowwolf',atk:['Mordida','Investida sombria','Garra dupla'],how:'Instância Arsenal ou baús da atividade'},
  {id:'falcao',n:'Falcão de guerra',era:-3,en:'',r:1,f:'pet_falcon',atk:['Bicada','Mergulho','Rajada de penas'],how:'Torre, andar 30, ou missões diárias'},
  {id:'pantera',n:'Pantera espectral',era:-3,en:'',r:2,f:'pet_panther',atk:['Patada','Bote pelas costas','Sombra veloz'],how:'Arena: fim de temporada no Ouro ou acima'}];
function cdxPets(){ let on=[]; try{ const C=window.Sys&&Sys.codex; on=C&&typeof C.newPets==='function'?C.newPets():[]; }catch(e){ on=[]; } if(!Array.isArray(on)||!on.length) return K_PETS;
  return K_PETS.concat(on.map(id=>K_PETS_NEW.find(p=>p.id===id)).filter(Boolean)); }   /* na ordem que o módulo devolve = a do catalog() */
const K_MART={pony:'mount_pony_ref',horse:'mount_horse_ref',wolf:'mount_wolf_ref',griffin:'mount_griffin_ref',mythic:'mount_mythic_opt_tiger',wyvern:'mount_wyvern_ref'};
const K_MFALL=[{id:'pony',name:'Pônei',r:0},{id:'horse',name:'Cavalo de guerra',r:1},{id:'wolf',name:'Lobo de guerra',r:2},{id:'griffin',name:'Grifo dourado',r:2},{id:'mythic',name:'Tigre de cristal',r:3},{id:'wyvern',name:'Serpe dourada',r:4}];
const K_MHOW={pony:['Loja','shop'],horse:['Passe da temporada','pass'],wolf:['Oferta de primeira compra','offer'],griffin:['Eventos','events'],mythic:['Eventos','events'],wyvern:['Loja','shop']};
const K_CSS=`.pk-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pkk 1s steps(12,jump-none) infinite}
@keyframes pkk{from{background-position:0 0}to{background-position:100% 0}}
.pk-au{background-size:1600% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:pka 1.333s steps(16,jump-none) infinite}
@keyframes pka{from{background-position:0 0}to{background-position:100% 0}}
.pk-in{animation:pki .35s ease-out both}
@keyframes pki{from{transform:translateY(10px);opacity:0}to{transform:none;opacity:1}}
.pk-btn{border:0;border-radius:12px;font-weight:900;min-height:46px;padding:0 14px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c;font-size:15px}
.pk-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pk-sp{position:absolute;width:4px;height:4px;border-radius:50%;background:#ffe07a;animation:pks 2.2s ease-in-out infinite}
@keyframes pks{0%,100%{opacity:.15}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.pk-kid,.pk-au,.pk-in,.pk-sp{animation:none}}`;
const cdxEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function cdxInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pk_css')) return; const st=document.createElement('style'); st.id='pk_css'; st.textContent=K_CSS; document.head.appendChild(st); }
const cdxToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const cdxSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
window.P_CODEX=window.P_CODEX||{owned:false,rewards:false};
/* funções isoladas: hoje devolvem null (sem módulo). Quando a API de Sistemas chegar, defina P_CODEX.readOwned / readRewards e ligue as chaves. */
const cdxOwned=()=>{ try{ const p=window.P_CODEX; if(!p||!p.owned||typeof p.readOwned!=='function') return null; const r=p.readOwned(); return r?new Set(Array.from(r)):null; }catch(e){ return null; } };
const cdxRewards=()=>{ try{ const p=window.P_CODEX; if(!p||!p.rewards||typeof p.readRewards!=='function') return null; return p.readRewards()||null; }catch(e){ return null; } };
const cdxEra=e=>{ try{ if(ERAS[e]&&ERAS[e].n) return ERAS[e].n; }catch(x){} return K_ERAX[e-7]||('Era '+(e+1)); };
const cdxRar=r=>{ try{ if(r===5) return 'Prismático'; return RAR[r].n; }catch(e){ return ['Básico','Raro','Épico','Mítico','Lendário','Prismático'][r]||''; } };
const cdxRc=r=>{ try{ if(r===5) return '#8ff5ff'; return RAR[r].c; }catch(e){ return '#9aa0a6'; } };
function cdxLoadMeta(){ if(XK.metaTry||typeof fetch!=='function') return; XK.metaTry=true; try{ fetch('assets/enemies/meta.json').then(r=>r.ok?r.json():null).then(j=>{ if(j){ XK.meta=j; try{ if(window.Panels&&Panels.cur&&Panels.cur()==='codex'&&typeof render==='function') render(); }catch(e){} } }).catch(()=>{}); }catch(e){} }
/* ---- catálogo ---- */
const cdxImg=(src,cls)=>({t:'img',src,cls:cls||''});
function cdxItems(){
  const A=[]; let eras=7; try{ eras=ERAS.length; }catch(e){}   /* 7 eras; 9 com as eras 7-8 ligadas (js/eras9.js) */
  const rm=r=>{ try{ return String(RAR[r].m).replace('.',','); }catch(e){ return ''; } };
  for(let e=0;e<eras;e++) for(let t=0;t<3;t++){ const r=[0,2,4][t], nm=(()=>{ try{ return ERAS[e].w[r]; }catch(x){ return 'Arma'; } })();
    A.push({id:'w-'+e+'-'+t,cat:'arm',era:e,r,n:nm,art:cdxImg('assets/weapons/era'+e+'_t'+t+'.png','w'),attr:'Ataque ×'+rm(r)+' · '+cdxRar(r),how:t===0?'Baús da era '+cdxEra(e):t===1?'Baús da era '+cdxEra(e)+' ou Invocar':'Invocar',go:t===0?'battle':'summon',goN:t===0?'Batalha':'Invocar'}); }
  const main=(window.Sys&&Sys.stats&&Sys.stats.DATA&&Sys.stats.DATA.main)||null;
  for(let e=0;e<eras;e++) for(const sl of K_SLOTS){ const m=main&&main[sl[2]]; const attr=m?Object.keys(m).map(k=>K_STAT[k]||k).join(' e '):'';
    A.push({id:'a-'+e+'-'+sl[0],cat:'eq',era:e,r:0,n:sl[0]==='vest'?(()=>{ try{ return ERAS[e].a[0]; }catch(x){ return 'Colete'; } })():sl[1]+' '+cdxEra(e),label:sl[1],art:cdxImg('assets/icons/slots/era'+e+'_'+sl[0]+'.png','ic'),sub2:sl[1],attr,how:'Baús da era '+cdxEra(e),go:'gear',goN:'Equipamento'}); }
  for(const m of ((window.Sys&&Sys.mount&&Sys.mount.DATA&&Sys.mount.DATA.mounts)||K_MFALL)){ const f=K_MART[m.id]; if(!f) continue; const pct=(()=>{ try{ return Sys.mount.DATA.maxPct[m.r]; }catch(e){ return null; } })(), h=K_MHOW[m.id]||['Em breve',''];
    A.push({id:'m-'+m.id,cat:'mnt',era:-2,r:m.r,n:m.name,art:cdxImg('assets/mounts/'+f+'.png','stand'),attr:pct!=null?'Ataque e Vida até +'+String(pct).replace('.',',')+'%':'',how:h[0],go:h[1],goN:h[0]}); }
  for(const p of cdxPets()) for(let s=0;s<3;s++) A.push({id:'p-'+p.id+'-'+s,cat:'pet',era:p.era,en:p.en,r:p.r,n:p.n,label:K_STG[s],art:cdxImg('assets/pets/'+p.f+'_'+K_STGF[s]+'.png','stand'),sub2:K_STG[s],attr:'Golpe: '+p.atk[s],how:s===0?(p.how||'Ovo da '+cdxEra(p.era)):'Evolua o pet',go:'pets',goN:'Pets',grp:p.id});
  const M=XK.meta; let eb=eras; for(let e=0;e<eb;e++) for(const k of ['e0','e1','boss']){ const nm=(typeof era9Name==='function'&&era9Name('era'+e+'_'+k))||(M&&M['era'+e+'_'+k]&&M['era'+e+'_'+k].name); if(!nm) continue;   /* chefes das eras 7-8: nome do dono (js/eras9.js) */ const boss=k==='boss';
    A.push({id:'b-'+e+'-'+k,cat:'bes',era:e,r:boss?4:0,boss,n:nm,art:cdxImg('assets/enemies/era'+e+'_'+k+'.png','stand'),attr:(boss?'Chefe da ':'Inimigo comum da ')+cdxEra(e),how:boss?'Desafie o chefe na batalha':'Fases da era '+cdxEra(e),go:'battle',goN:'Batalha'}); }
  for(const n of [7,10,13]) A.push({id:'u-'+n,cat:'aur',era:-1,r:n===7?2:n===10?3:4,n:'Aura +'+n,art:{t:'aura',src:'assets/anim/aura/aura'+n+'.png'},attr:'Brilho atrás do Kael',how:'Forje a arma até +'+n,go:'forge',goN:'Forja'});
  return A; }
function cdxArt(a,big){ const cls=a.cls;
  if(a.t==='aura') return `<span style="position:relative;display:block;width:${big?150:60}px;height:${big?150:60}px"><span class="pk-au" aria-hidden="true" style="position:absolute;inset:0;background-image:url(${a.src})"></span><span class="pk-kid" aria-hidden="true" style="position:absolute;left:12%;top:24%;width:76%;height:76%"></span></span>`;
  const z=big?(cls==='stand'?170:130):(cls==='ic'?'46':cls==='w'?'54':'60');
  return `<img src="${a.src}" alt="" loading="lazy" style="width:${z}px;height:${z}px;object-fit:contain" onerror="this.style.visibility='hidden'">`; }
function cdxCell(it,own,i){ const miss=own&&!own.has(it.id), rc=cdxRc(it.r);
  return `<button data-x="pick" data-id="${it.id}" class="pk-in" aria-label="${cdxEsc((it.label?it.n+' '+it.label:it.n)+(own?(miss?', falta':', tenho'):''))}" style="animation-delay:${Math.min(i,10)*.03}s;flex:none;width:78px;display:flex;flex-direction:column;align-items:center;gap:3px;padding:0;background:none;border:0;color:#f6ecdf"><span style="position:relative;width:78px;height:78px;border-radius:14px;background:${miss?'#16110d':'#241b14'};border:2px solid ${miss?'#4a3a2b':rc};box-sizing:border-box;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:${!miss&&it.r>=3?'0 0 10px '+rc+'88':'none'}"><span style="display:flex;opacity:${miss?.28:1};filter:${miss?'grayscale(1) brightness(.5)':'none'}">${cdxArt(it.art,false)}</span>${miss?'<span aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:\'Lilita One\',sans-serif;font-size:26px;color:#9c8d7a">?</span>':''}</span><span style="font-size:11px;font-weight:800;line-height:1.1;max-width:78px;text-align:center;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${cdxEsc(it.label||it.n)}</span></button>`; }
function cdxSheet(it,own){ const miss=own&&!own.has(it.id), rc=cdxRc(it.r), sub=it.en!=null?it.en:it.era===-2?'Montaria':it.era<0?'Forja':cdxEra(it.era), sub2=it.sub2?(sub?it.sub2+' · '+sub:it.sub2):sub;
  const chip=(miss?'Falta · ':'')+(it.cat==='bes'?(it.boss?'Chefe':'Inimigo'):cdxRar(it.r));
  return `<div data-x="close" aria-hidden="true" style="position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.6)"></div>
  <div role="dialog" aria-modal="true" aria-label="${cdxEsc(it.n)}" class="pk-in" style="position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:41;max-width:366px;margin:0 auto;border-radius:20px;background:#1d1611;border:3px solid ${rc};padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;box-sizing:border-box;max-height:88%;overflow-y:auto;overflow-x:hidden">
    <button data-x="close" aria-label="Fechar" style="position:absolute;right:8px;top:8px;width:46px;height:46px;border-radius:12px;border:2px solid #4a3a2b;background:#2a1f16;color:#f6ecdf;font-size:22px;font-weight:900;padding:0">×</button>
    <div aria-hidden="true" style="position:relative;height:170px;display:flex;align-items:center;justify-content:center;opacity:${miss?.45:1};filter:${miss?'grayscale(.8) brightness(.6)':'none'}">${cdxArt(it.art,true)}</div>
    <span style="padding:3px 12px;border-radius:10px;background:${rc};color:#1a1109;font-size:12px;font-weight:900">${cdxEsc(chip)}</span>
    <span style="font-family:'Lilita One',sans-serif;font-size:24px;text-align:center">${cdxEsc(it.n)}</span><span style="font-size:13px;font-weight:800;color:#c9b9a2">${cdxEsc(sub2)}</span>
    ${it.attr?`<div style="font-size:14px;font-weight:900;color:#ffe07a;text-align:center">${cdxEsc(it.attr)}</div>`:''}
    <div style="width:100%;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#2a1f16;border:2px solid #4a3a2b;box-sizing:border-box"><span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><small style="font-size:11px;font-weight:800;color:#c9b9a2">Onde conseguir</small><b style="font-size:14px">${cdxEsc(it.how)}</b></span><button data-x="go" data-g="${cdxEsc(it.go)}" data-n="${cdxEsc(it.goN)}" class="pk-btn" aria-label="Ir para ${cdxEsc(it.goN)}">Ir</button></div></div>`; }
function cdxAlbum(items,own,rw){ const tot=items.length, ownN=own?items.filter(i=>own.has(i.id)).length:0, pct=own&&tot?Math.floor(ownN*100/tot):0;
  let top='';
  if(own){ let nxt=''; if(rw&&Array.isArray(rw.marks)){ const m=rw.marks.find(x=>!(rw.claimed||[]).includes(x.p)); if(m){ const ready=pct>=m.p; nxt=`<button data-x="${ready?'claim':'peek'}" data-p="${m.p}" class="pk-btn${ready?'':' off'}" style="flex:none;min-width:84px;${ready?'':'background:#33271d;color:#f6ecdf;box-shadow:none;border:2px solid #6b5843'}" aria-label="Prêmio de ${m.p} por cento">${ready?'Pegar '+m.p+'%':m.p+'%'}</button>`; } }
    top=`<div style="flex:none;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b"><span style="font-family:'Lilita One',sans-serif;font-size:30px;color:#ffe07a" aria-label="Coleção ${pct} por cento">${pct}<small style="font-size:16px">%</small></span><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px"><span style="font-size:12px;font-weight:800;color:#c9b9a2">${ownN} de ${tot} itens</span><span aria-hidden="true" style="position:relative;height:10px;border-radius:5px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${pct}%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></span></span></span>${nxt}</div>`; }
  const cards=K_CATS.map((c,i)=>{ const its=items.filter(x=>x.cat===c.k); if(!its.length) return ''; const o=own?its.filter(x=>own.has(x.id)).length:0, p=own?Math.floor(o*100/its.length):0, art=its.slice().sort((a,b)=>b.r-a.r)[0].art;
    return `<button data-x="cat" data-k="${c.k}" class="pk-in" aria-label="${c.n}: ${own?o+' de '+its.length+' ('+p+'%)':its.length+' itens'}" style="animation-delay:${.06+i*.06}s;position:relative;min-width:0;height:146px;border-radius:18px;background:linear-gradient(180deg,#2a1f16,#1d1611);border:2px solid ${c.c};box-sizing:border-box;padding:8px 10px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;color:#f6ecdf;text-align:left;overflow:hidden"><span class="pk-sp" aria-hidden="true" style="left:62%;top:18%"></span><span aria-hidden="true" style="position:absolute;right:2px;top:10px;display:flex;opacity:.95">${cdxArt(art,false)}</span><span style="font-family:'Lilita One',sans-serif;font-size:18px;position:relative">${c.n}</span><span style="position:relative;width:100%;display:flex;flex-direction:column;gap:4px">${own?`<span aria-hidden="true" style="height:7px;border-radius:4px;background:#0e0a07;overflow:hidden"><span style="display:block;height:100%;width:${p}%;background:${c.c}"></span></span><span style="font-size:12px;font-weight:900"><b>${o}/${its.length}</b> · ${p}%</span>`:`<span style="font-size:12px;font-weight:900;color:#c9b9a2">${its.length} itens</span>`}</span></button>`; }).join('');
  return top+`<div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-content:start;overflow-y:auto" class="x-scroll">${cards}</div>`; }
function cdxCat(items,own){ const cat=K_CATS.find(c=>c.k===XK.cat)||K_CATS[0], its=items.filter(x=>x.cat===cat.k), o=own?its.filter(x=>own.has(x.id)).length:0, p=own&&its.length?Math.floor(o*100/its.length):0;
  const shown=its.filter(x=>!own||XK.filt===0||(XK.filt===1?own.has(x.id):!own.has(x.id)));
  const groups=[], gi={}; for(const x of shown){ const key=cat.k==='pet'?x.grp:String(x.era); if(gi[key]===undefined){ gi[key]=groups.length; groups.push({key,era:x.era,n:cat.k==='pet'?(x.en!=null?(x.en?x.en+' · ':'')+x.n:cdxEra(x.era)+' · '+x.n):(x.era===-2?'Estábulo':x.era<0?'Forja da arma':cdxEra(x.era)),list:[]}); } groups[gi[key]].list.push(x); }
  groups.sort((a,b)=>a.era-b.era);
  const bands=groups.map((g,bi)=>{ const all=its.filter(x=>(cat.k==='pet'?x.grp:String(x.era))===g.key), oo=own?all.filter(x=>own.has(x.id)).length:0;
    return `<section aria-label="${cdxEsc(g.n)}" class="pk-in" style="animation-delay:${bi*.05}s;flex:none;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:900"><span style="font-family:'Lilita One',sans-serif;font-size:16px">${cdxEsc(g.n)}</span><span style="color:#c9b9a2">${own?oo+'/'+all.length:all.length}</span></div><div style="display:flex;flex-wrap:wrap;gap:8px">${g.list.map((x,i)=>cdxCell(x,own,i)).join('')}</div></section>`; }).join('');
  const seg=own?`<div role="group" aria-label="Mostrar" style="flex:none;display:flex;gap:6px">${['Todos','Tenho','Falta'].map((n,i)=>`<button data-x="filt" data-i="${i}" aria-pressed="${XK.filt===i}" style="flex:1;height:46px;border-radius:12px;border:2px solid ${XK.filt===i?'#ffc94a':'#4a3a2b'};background:${XK.filt===i?'#4a3420':'#241b14'};color:${XK.filt===i?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:15px;padding:0">${n}</button>`).join('')}</div>
    <div style="flex:none;display:flex;align-items:center;gap:8px;font-size:13px;font-weight:900"><b>${o}/${its.length}</b><span aria-hidden="true" style="flex:1;height:8px;border-radius:4px;background:#0e0a07;overflow:hidden"><span style="display:block;height:100%;width:${p}%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></span></span><span>${p}%</span></div>`:`<div style="flex:none;font-size:13px;font-weight:900;color:#c9b9a2">${its.length} itens</div>`;
  const empty=bands?'':`<p role="note" style="margin:20px 0;text-align:center;font-weight:800;color:#c9b9a2">${XK.filt===1?'Nenhum ainda. Vá caçar!':'Você já tem todos!'}</p>`;
  return seg+`<div class="x-scroll" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding-bottom:10px">${bands}${empty}</div>`; }
function scrCodex(){
  cdxInject(); cdxLoadMeta(); const d=xDims(K_MINH), items=cdxItems(), own=cdxOwned(), rw=cdxRewards();
  const inCat=XK.view==='cat', cat=K_CATS.find(c=>c.k===XK.cat);
  const head=`<div style="flex:none;display:flex;align-items:center;gap:8px;min-height:46px"><button data-x="back" aria-label="${inCat?'Voltar para o álbum':'Voltar'}" style="flex:none;width:46px;height:46px;border-radius:12px;border:2px solid #4a3a2b;background:#2a1f16;color:#f6ecdf;font-size:24px;font-weight:900;padding:0">‹</button><span role="heading" aria-level="1" style="font-family:'Lilita One',sans-serif;font-size:22px">${inCat?cat.n:'Códex das Eras'}</span></div>`;
  const sel=XK.sel?items.find(x=>x.id===XK.sel):null;
  V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:4px 2px 8px;box-sizing:border-box">${inCat?head:''}${inCat?cdxCat(items,own):cdxAlbum(items,own,rw)}</div>${sel?cdxSheet(sel,own):''}`);
}
function cdxGo(g,n){ cdxSnd('ui_tap');
  if(g==='battle'){ if(window.Screens&&Screens.close) Screens.close(); return; }
  if((g==='gear'||g==='summon'||g==='shop')&&typeof setView==='function'){ if(window.Screens&&Screens.close) Screens.close(); setView(g); return; }
  if(g&&window.Screens&&Screens.reg&&Screens.reg[g]){ Screens.open(g); return; }
  cdxToast('Esta tela abre mais adiante'); }
function cdxClick(b){
  const a=b.dataset.x;
  if(a==='back'){ cdxSnd('ui_tap'); if(XK.sel){ XK.sel=null; render(); return; } if(XK.view==='cat'){ XK.view='album'; render(); return; } if(window.Screens&&Screens.close) Screens.close(); return; }
  if(a==='cat'){ cdxSnd('ui_tap'); XK.view='cat'; XK.cat=b.dataset.k; XK.filt=0; XK.sel=null; render(); return; }
  if(a==='filt'){ cdxSnd('ui_tap'); XK.filt=parseInt(b.dataset.i,10)||0; render(); return; }
  if(a==='pick'){ cdxSnd('ui_tap'); XK.sel=b.dataset.id; render(); return; }
  if(a==='close'){ cdxSnd('ui_tap'); XK.sel=null; render(); return; }
  if(a==='go'){ XK.sel=null; cdxGo(b.dataset.g,b.dataset.n); return; }
  if(a==='peek'){ cdxSnd('ui_tap'); const R=cdxRewards(), m=R&&R.marks&&R.marks.find(x=>String(x.p)===b.dataset.p); cdxToast(m?m.p+'%: '+(m.txt||'prêmio'):'Continue coletando'); return; }
  if(a==='claim'){ const R=cdxRewards(), r=R&&typeof R.claim==='function'?R.claim(parseInt(b.dataset.p,10)):null; if(!r||!r.ok){ cdxSnd('ui_tap'); cdxToast('Este prêmio ainda não pode ser pego'); render(); return; }
    cdxSnd('claim'); try{ if(typeof statsChanged==='function') statsChanged(); }catch(e){} cdxToast(r.txt||'Prêmio recebido'); render(); }
}
Panels.add('codex',{title:'Códex das Eras',render:scrCodex,click:cdxClick,busy(){ return false; },onOpen(){ XK.view='album'; XK.sel=null; XK.filt=0; },onClose(){ XK.sel=null; } });
