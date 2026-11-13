'use strict';
(function(){   /* escopo próprio: nenhum nome desta tela vaza para o jogo (XB/XR e outros já existem lá) */
/* ================= MOCHILA (pedido do dono: "uma tela de mochila para melhorar a visualização de tudo, dos itens que ele tem") =================
   Tela própria, nasce DESLIGADA (PANEL_ON.bag; no Modo dono ligada para o voto). Só LÊ os módulos e usa as mesmas ações do Equipamento.
   ABAS: Armas · Equipamento (peças) · Asas · Pets · Montarias · Skins · Materiais · Consumíveis.
   - Itens (armas, peças, asas): S.inv, com a moldura e o brilho da raridade (xRar do js/screens.js), Forja +N do espaço (Sys.forge), estrelas da
     qualidade (Sys.stats.qualityStars), nível e o selo "Equipado". Filtro por raridade e ordem (raridade, nível, FC, mais novo). Contador N/máx
     (xBagMax: 60/80/100 com o VIP). Tocar abre o detalhe: atributos (Sys.stats.itemStats), FC do item e o sobe/desce contra o equipado
     (Sys.fc.itemFC().swap, na escala de exibição Sys.fc.viewText) e os botões Equipar · Forjar (abre a Forja) · Desmontar (com confirmação).
   - Pets e Montarias: os que o jogador tem (Sys.pet / Sys.mount), com estrelas, nível, estágio; Equipar. Skins: as possuídas (Sys.appearance
     fixedSkins com owned) e as de item (S.skins); Equipar quando a arte existe. Materiais: pedras de forja e de treino, ração, Essência,
     fragmentos guardados. Consumíveis: baús guardados (Sys.chest), chaves de instância (Sys.instances), ovos guardados e escolhas de ovo (Sys.pet).
   Nada de emoji: ícones são imagens do jogo (assets/icons, assets/ui) ou SVG. Toques por data-x; alvos de 44 px; aria-label; sem DOM fixo.
   PEDIDO AO ENGENHEIRO: pôr 'p_bag' na lista de telas do js/screens.js (junto de 'p_fuse'), PANEL_ON.bag (desligada; ligada no Modo dono) e o
   ícone "Mochila" no menu (assets/icons/menu/equipment.png serve até a Arte fazer um próprio). */
const XB={tab:'weapon',rf:-1,sort:'rar',sel:null,cf:null,anim:true,toast:'',toastT:0,sig:'',fcCache:{}};
const B_TABS=[['weapon','Armas'],['gear','Equipamento'],['wing','Asas'],['pets','Pets'],['mounts','Montarias'],['skins','Skins'],['mats','Materiais'],['cons','Consumíveis']];
const B_SORT=[['rar','Raridade'],['lvl','Nível'],['fc','FC'],['new','Mais novo']];
const B_PET_ART={shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'};
const B_MOUNT_ART={raptor:'war_raptor',scorpion:'giant_scorpion',panther:'shadow_panther',hellhorse:'infernal_horse',unicorn:'war_unicorn',icewolf:'ice_wolf',phoenixm:'giant_phoenix',blackdragon:'black_dragon',celtiger:'celestial_tiger',mecha:'war_mecha'};
const B_RNAME=['basico','raro','epico','mitico','lendario','lendario'];
const bSys=()=>window.Sys||{};
const bTry=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const bEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const bOn=()=>typeof view!=='undefined'&&view==='bag';
const bTouch=d=>Math.max(44,Math.ceil(44/((d&&d.s)||1)-1e-6));
const bRC=r=>(typeof RC!=='undefined'&&RC[Math.min(4,r|0)])||'#e8e2d8';
const bRN=r=>bTry(()=>RN(Math.min(4,r|0)),['Básico','Raro','Épico','Mítico','Lendário'][Math.min(4,r|0)]);
const bNum=v=>bTry(()=>kf(v),String(Math.round(v||0)));
const bFC=v=>bTry(()=>Sys.fc.viewText(v),bNum(v));
const bMax=()=>bTry(()=>xBagMax(),bTry(()=>BAG_MAX,60));
const bItems=()=>(S.inv||[]).filter(it=>it&&it.slot);
const bIsEq=it=>!!it&&S.eq&&S.eq[it.slot]===it.id;
const bStars=it=>bTry(()=>Sys.stats.qualityStars(Sys.stats.qpOf(it)),0);
const bForgeLv=slot=>bTry(()=>Sys.forge.ensure(S).lv[slot]|0,0);
const bSvgStar=(on,s)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="${on?'#ffc94a':'#33271d'}" stroke="${on?'#8a4f0c':'#4a3a2b'}" stroke-width="1.4" stroke-linejoin="round"></path></svg>`;
function bStarRow(n,max,s){ let h=''; for(let i=1;i<=max;i++) h+=bSvgStar(i<=n,s); return `<span role="img" aria-label="${n} de ${max} estrelas" style="display:inline-flex;gap:1px">${h}</span>`; }

/* ---------- imagem de cada coisa ---------- */
function bItemImg(it){ const wt=bTry(()=>Sys.stats.weaponType(it),null);
  if(it.slot==='weapon'&&(wt==='bow'||wt==='boomerang')) return 'assets/weapons/'+wt+'_'+B_RNAME[Math.min(5,it.r|0)]+'.png';
  if(it.slot==='wing'){ const w=bTry(()=>Sys.stats.wingOf(it),'angel'); if(w&&w!=='angel'&&w!=='demon') return 'assets/icons/wings/wing_'+w+'.png'; }
  return bTry(()=>slotIcon(it.slot,ieraV(it)),'assets/ui/chest.png'); }
function bPetImg(id){ if(B_PET_ART[id]) return 'assets/icons/pets/'+B_PET_ART[id]+'.png';
  const P=bSys().pet, d=bTry(()=>P.DATA.pets.find(p=>p.id===id),null), sp=d&&d.sprite, st=bTry(()=>P.stage(S,id).index|0,0);
  return sp?'assets/icons/pets/'+sp+['_ref','_mid','_evo'][Math.max(0,Math.min(2,st))]+'.png':'assets/icons/menu/pets.png'; }
const bMountImg=id=>'assets/icons/mounts/'+(B_MOUNT_ART[id]||id)+'.png';
function bCell(o){ /* {key, img, r, name, sub, badge, eq, stars, starMax, plus, x, id, aria} */
  const q=o.item?bTry(()=>xRar(o.item),{on:false}):{on:false}, c=bRC(o.r);
  const frame=q.on?` class="${(q.cls||'').trim()}"${q.at||''}`:'';
  return `<button class="bg-tap" data-x="${o.x}" data-id="${bEsc(o.id)}" aria-label="${bEsc(o.aria||o.name)}" style="position:relative;min-height:118px;border-radius:14px;border:2px solid ${o.eq?'#5fd068':'#4a3a2b'};background:#1d1611;color:#f6ecdf;padding:8px 4px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;box-sizing:border-box;min-width:0">
    <span${frame} style="position:relative;width:58px;height:58px;flex:none;border-radius:14px;${q.on?'':'border:2px solid '+c+';background:radial-gradient(circle at 50% 40%,#3a2c1f,#16110d);box-shadow:0 0 10px '+c+'55;'}display:flex;align-items:center;justify-content:center;box-sizing:border-box">
      <img src="${bEsc(o.img)}" alt="" loading="lazy" style="width:46px;height:46px;object-fit:contain">
      ${o.plus?`<span style="position:absolute;right:-4px;top:-6px;padding:0 5px;border-radius:7px;background:#3a2c1f;border:1px solid #ffc94a;color:#ffe07a;font-size:10px;font-weight:900;line-height:15px">+${o.plus}</span>`:''}
      ${o.eq?`<span style="position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);padding:0 5px;border-radius:7px;background:#5fd068;color:#0d2410;font-size:9px;font-weight:900;line-height:14px;white-space:nowrap">Equipado</span>`:''}</span>
    ${o.stars!=null?`<span style="margin-top:4px">${bStarRow(o.stars,o.starMax||5,11)}</span>`:'<span style="height:4px"></span>'}
    <span style="max-width:100%;font-size:11px;font-weight:900;color:${c};line-height:1.15;text-align:center;overflow-wrap:anywhere">${bEsc(o.name)}</span>
    ${o.sub?`<span style="font-size:10px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.15">${bEsc(o.sub)}</span>`:''}
    ${o.badge?`<span style="position:absolute;top:4px;right:5px;font-size:12px;font-weight:900;color:#ffc94a">${bEsc(o.badge)}</span>`:''}</button>`; }
const bGrid=cells=>`<div role="list" style="margin:0 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:8px">${cells.join('')}</div>`;
function bEmpty(msg){ return `<div style="margin:0 12px;padding:28px 14px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;text-align:center;color:#c9b9a2;font-size:13px;font-weight:800;line-height:1.35">${bEsc(msg)}</div>`; }

/* ---------- itens (armas, peças, asas) ---------- */
function bItemList(){ const t=XB.tab; let L=bItems().filter(it=>t==='weapon'?it.slot==='weapon':t==='wing'?it.slot==='wing':it.slot!=='weapon'&&it.slot!=='wing');
  if(XB.rf>=0) L=L.filter(it=>(it.r|0)===XB.rf);
  const fc=it=>{ const k=it.id+'|'+(it.lvl|0)+'|'+(it.qp|0); if(XB.fcCache[k]==null) XB.fcCache[k]=bTry(()=>Sys.fc.itemFC(S,Sys.host,it).fc,0); return XB.fcCache[k]; };
  const by={rar:(a,b)=>(b.r|0)-(a.r|0)||(b.lvl|0)-(a.lvl|0),lvl:(a,b)=>(b.lvl|0)-(a.lvl|0)||(b.r|0)-(a.r|0),fc:(a,b)=>fc(b)-fc(a),new:(a,b)=>(b.gotAt||b.id||0)-(a.gotAt||a.id||0)}[XB.sort];
  return L.sort((a,b)=>(bIsEq(b)-bIsEq(a))||by(a,b)); }
function bItemsTab(d){ const L=bItemList(), t44=bTouch(d), rs=[...new Set(bItems().map(x=>x.r|0))].sort((a,b)=>a-b);
  const chip=(on,x,v,label,col)=>`<button data-x="${x}" data-v="${v}" aria-pressed="${on}" style="flex:none;height:${Math.max(34,t44-8)}px;padding:0 10px;border-radius:10px;border:2px solid ${on?(col||'#ffc94a'):'#4a3a2b'};background:${on?'#3a2c1f':'#1d1611'};color:${on?(col||'#ffe07a'):'#c9b9a2'};font-size:12px;font-weight:900;white-space:nowrap">${bEsc(label)}</button>`;
  const filt=`<div style="margin:0 12px;display:flex;gap:6px;overflow-x:auto;padding-bottom:2px" role="group" aria-label="Filtro por raridade">${chip(XB.rf<0,'rf',-1,'Todas')}${rs.map(r=>chip(XB.rf===r,'rf',r,bRN(r),bRC(r))).join('')}</div>`;
  const sort=`<div style="margin:0 12px;display:flex;gap:6px;flex-wrap:wrap" role="group" aria-label="Ordem">${B_SORT.map(([k,n])=>chip(XB.sort===k,'sort',k,n)).join('')}</div>`;
  if(!L.length) return filt+sort+bEmpty(XB.rf>=0?'Nenhum item dessa raridade aqui.':'Nada aqui ainda. Derrote inimigos e abra baús para encher a mochila.');
  return filt+sort+bGrid(L.map(it=>bCell({x:'item',id:it.id,item:it,img:bItemImg(it),r:it.r|0,name:bTry(()=>iname(it),'Item'),sub:'Nv. '+(it.lvl||1)+(it.slot!=='weapon'&&it.slot!=='wing'?' · '+bTry(()=>SLOT[it.slot].n,''):''),
    eq:bIsEq(it),stars:bStars(it),plus:bIsEq(it)?bForgeLv(it.slot):0,aria:bTry(()=>iname(it),'Item')+', '+bRN(it.r)+', nível '+(it.lvl||1)+(bIsEq(it)?', equipado':'')}))); }

/* ---------- pets, montarias, skins ---------- */
function bPetsTab(){ const P=bSys().pet; if(!P||!P.ensure) return bEmpty('Pets abrem no nível 20.'); const o=bTry(()=>P.ensure(S),{owned:{}}), ids=Object.keys(o.owned||{});
  if(!ids.length) return bEmpty('Você ainda não tem pet. O primeiro ovo vem no nível 20.');
  const def=id=>bTry(()=>P.DATA.pets.find(p=>p.id===id),{name:id,r:0});
  return bGrid(ids.sort((a,b)=>(def(b).r|0)-(def(a).r|0)).map(id=>{ const x=o.owned[id], d=def(id), st=bTry(()=>P.stage(S,id),null);
    return bCell({x:'pet',id,img:bPetImg(id),r:Math.min(4,d.r|0),name:d.name||id,sub:'Nv. '+bTry(()=>P.levelOf(S,id),1)+(st&&st.name?' · '+st.name:''),eq:o.eq===id,stars:x.stars|0,aria:(d.name||id)+(o.eq===id?', equipado':'')}); })); }
function bMountsTab(){ const M=bSys().mount; if(!M||!M.ensure) return bEmpty('Montarias abrem no nível 38.'); const o=bTry(()=>M.ensure(S),{owned:{}}), ids=Object.keys(o.owned||{});
  if(!ids.length) return bEmpty('Você ainda não tem montaria.');
  const def=id=>bTry(()=>M.DATA.mounts.find(m=>m.id===id),{name:id,r:0});
  return bGrid(ids.sort((a,b)=>(def(b).r|0)-(def(a).r|0)).map(id=>{ const x=o.owned[id], d=def(id);
    return bCell({x:'mount',id,img:bMountImg(id),r:d.r|0,name:d.name||id,sub:'Nv. '+(x.lvl||1),eq:o.eq===id,stars:x.stars|0,aria:(d.name||id)+(o.eq===id?', equipada':'')}); })); }
function bSkinsTab(){ const A=bSys().appearance; const fx=bTry(()=>A.fixedSkins(S,Sys.host).filter(k=>k.owned),[]);
  const cells=fx.map(k=>bCell({x:'skin',id:k.id,img:k.avatar?'assets/hero/avatar/'+k.avatar+'.png':'assets/icons/menu/equipment.png',r:Math.min(4,k.r|0),name:k.name,sub:k.art?(k.available?'':'de outro herói'):'arte em breve',eq:!!k.equipped,aria:k.name+(k.equipped?', equipada':'')}));
  if(!cells.length) return bEmpty('Nenhuma skin ainda. As skins novas aparecem aqui quando você ganhar ou comprar.');
  return bGrid(cells); }

/* ---------- materiais e consumíveis ---------- */
function bRow(img,name,val,hint){ return `<div role="listitem" style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#1d1611;border:2px solid #4a3a2b;box-sizing:border-box">
  <span style="width:44px;height:44px;flex:none;border-radius:12px;background:#0e0a07;display:flex;align-items:center;justify-content:center"><img src="${bEsc(img)}" alt="" loading="lazy" style="width:34px;height:34px;object-fit:contain"></span>
  <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2"><span style="font-size:13px;font-weight:900;color:#f6ecdf;overflow-wrap:anywhere">${bEsc(name)}</span>${hint?`<span style="font-size:11px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${bEsc(hint)}</span>`:''}</span>
  <span class="lil" style="flex:none;font-size:18px;color:#ffe07a">${bEsc(val)}</span></div>`; }
const bList=rows=>`<div role="list" style="margin:0 12px;display:flex;flex-direction:column;gap:8px">${rows.join('')}</div>`;
function bMatsTab(){ const s=bSys(), rows=[];
  rows.push(bRow('assets/icons/menu/forge.png','Pedras de forja',bNum(bTry(()=>s.forge.ensure(S).stones,0)),'Fortalecem os espaços na Forja'));
  rows.push(bRow('assets/icons/menu/summon.png','Pedras de treino',bNum(bTry(()=>s.practice.ensure(S).stones,0)),'Sobem as Práticas'));
  rows.push(bRow('assets/icons/menu/pets.png','Ração',bNum(bTry(()=>s.pet.ensure(S).food,0)),'Alimenta o pet'));
  rows.push(bRow('assets/ui/gem.png','Essência da Era',bNum(bTry(()=>s.loot.ensure(S).mat.essence,0)),'Transforma itens para a sua era'));
  const pf=bTry(()=>s.pet.ensure(S).stored,{}), mf=bTry(()=>s.mount.ensure(S).stored,{});
  const pn=id=>bTry(()=>s.pet.DATA.pets.find(p=>p.id===id).name,id), mn=id=>bTry(()=>s.mount.DATA.mounts.find(m=>m.id===id).name,id);
  for(const id in pf) if(pf[id]>0) rows.push(bRow(bPetImg(id),'Fragmentos: '+pn(id),bNum(pf[id]),'Pet ainda não nascido'));
  for(const id in mf) if(mf[id]>0) rows.push(bRow(bMountImg(id),'Fragmentos: '+mn(id),bNum(mf[id]),'Montaria ainda não nascida'));
  const pm=bTry(()=>s.pass.ensure(S).mfrag|0,0); if(pm) rows.push(bRow('assets/icons/menu/mounts.png','Fragmentos de montaria',bNum(pm),'Entram na sua 1ª montaria'));
  return bList(rows); }
function bConsTab(){ const s=bSys(), rows=[];
  const ch=bTry(()=>s.chest.ensure(S).stored|0,0); rows.push(bRow('assets/ui/chest.png','Baús guardados',bNum(ch),ch?'Abra no botão do baú':'Os baús enchem com o tempo'));
  const ks=bTry(()=>s.instances.status(S,Sys.host),null); if(ks) rows.push(bRow('assets/icons/menu/instances.png','Chaves de instância',ks.total+'/'+ks.totalMax,'Renovam todo dia'));
  const po=bTry(()=>s.pet.ensure(S),null); if(po){ if(po.pre&&po.pre.length) rows.push(bRow('assets/icons/menu/pets.png','Ovos guardados',bNum(po.pre.length),'Chocam depois do 1º ovo'));
    if(po.choices&&po.choices.length) rows.push(bRow('assets/icons/menu/pets.png','Ovos à escolha',bNum(po.choices.length),'Escolha o pet na tela de Pets')); }
  return bList(rows); }

/* ---------- detalhe ---------- */
function bDetail(d){ const sel=XB.sel; if(!sel) return ''; const t44=bTouch(d); let body='', acts='';
  const btn=(x,label,gold,dis)=>`<button data-x="${x}" ${dis?'aria-disabled="true"':''} class="lil ${gold&&!dis?'bg-gold':''}" style="flex:1;min-width:0;height:${Math.max(48,t44)}px;border-radius:14px;font-size:16px;padding:0 6px;${gold&&!dis?'':'border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2'}">${bEsc(label)}</button>`;
  if(sel.kind==='item'){ const it=bTry(()=>itemOf(sel.id),null); if(!it) return '';
    const st=bTry(()=>Sys.stats.itemStats(it,null,bIsEq(it)?bForgeLv(it.slot):0),{}), F=bTry(()=>Sys.fc.itemFC(S,Sys.host,it),{fc:0,swap:0}), eq=bIsEq(it), ok=bTry(()=>canEq(it),true);
    const row=(k,v)=>`<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900"><span style="color:#c9b9a2">${k}</span><span>${v}</span></div>`, pct=v=>'+'+(Math.round((v||0)*10)/10).toString().replace('.',',')+'%';
    const lines=[st.atk?row('ATK',bNum(st.atk)):'',st.hp?row('Vida',bNum(st.hp)):'',st.def?row('Defesa',bNum(st.def)):'',st.atkPct?row('ATK %',pct(st.atkPct)):'',st.hpPct?row('Vida %',pct(st.hpPct)):'',st.defPct?row('Defesa %',pct(st.defPct)):'',st.critRate?row('Crítico',pct(st.critRate)):'',st.critDmg?row('Dano crítico',pct(st.critDmg)):'',st.aspd?row('Vel. de ataque',pct(st.aspd)):''].filter(Boolean).join('');
    const sw=F.swap||0, col=sw>0?'#5fd068':sw<0?'#ff6b6b':'#c9b9a2';
    body=`<div style="display:flex;align-items:center;gap:10px">${bCell({x:'noop',id:it.id,item:it,img:bItemImg(it),r:it.r|0,name:'',eq,stars:null,plus:eq?bForgeLv(it.slot):0}).replace('min-height:118px','min-height:0;width:76px;flex:none;border:0;background:transparent;padding:0')}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span style="font-size:15px;font-weight:900;color:${bRC(it.r)};overflow-wrap:anywhere">${bEsc(bTry(()=>iname(it),'Item'))}</span>
      <span style="font-size:11px;font-weight:800;color:#c9b9a2">${bEsc(bRN(it.r))} · Nv. ${it.lvl||1}${eq&&bForgeLv(it.slot)?' · Forja +'+bForgeLv(it.slot):''}</span>${bStarRow(bStars(it),5,13)}</div></div>
      <div style="display:flex;flex-direction:column;gap:3px">${lines}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b"><span style="font-size:12px;font-weight:900;color:#c9b9a2">FC do item</span><span class="lil" style="font-size:18px">${bEsc(bFC(F.fc))}</span></div>
      ${eq?'':`<div style="font-size:12px;font-weight:900;color:${col};text-align:right">${sw?(sw>0?'Equipar: +':'Equipar: −')+bEsc(bFC(Math.abs(sw)))+' de FC':'Equipar: sem mudança de FC'}</div>`}`;
    if(XB.cf===it.id) acts=`<div style="font-size:13px;font-weight:900;color:#ffb38a;text-align:center">Desmontar este item? Ele vira moedas e não volta.</div><div style="display:flex;gap:8px">${btn('cfno','Cancelar')}${btn('cfyes','Desmontar',true)}</div>`;
    else acts=`<div style="display:flex;gap:8px">${eq?btn('noeq','Equipado',false,true):btn('equip',ok?'Equipar':'Nível baixo',true,!ok)}${btn('forge','Forjar')}${btn('dism','Desmontar',false,eq)}</div>`; }
  else if(sel.kind==='pet'||sel.kind==='mount'||sel.kind==='skin'){ const k=sel.kind, M=k==='pet'?bSys().pet:k==='mount'?bSys().mount:null;
    let name=sel.id, img='', r=0, eq=false, sub='';
    if(k==='pet'){ const d=bTry(()=>M.DATA.pets.find(p=>p.id===sel.id),{}), o=bTry(()=>M.ensure(S),{owned:{}}), x=o.owned[sel.id]||{}; name=d.name||sel.id; img=bPetImg(sel.id); r=Math.min(4,d.r|0); eq=o.eq===sel.id; sub='Nv. '+bTry(()=>M.levelOf(S,sel.id),1)+' · '+(x.stars|0)+' estrelas'; }
    else if(k==='mount'){ const d=bTry(()=>M.DATA.mounts.find(m=>m.id===sel.id),{}), o=bTry(()=>M.ensure(S),{owned:{}}), x=o.owned[sel.id]||{}; name=d.name||sel.id; img=bMountImg(sel.id); r=d.r|0; eq=o.eq===sel.id; sub='Nv. '+(x.lvl||1)+' · '+(x.stars|0)+' estrelas · +'+bTry(()=>M.pctOf(sel.id,x.lvl||1,x.stars||1),0)+'% ATK e Vida'; }
    else { const s0=bTry(()=>Sys.appearance.fixedSkins(S,Sys.host).find(z=>z.id===sel.id),{}); name=s0.name||sel.id; img=s0.avatar?'assets/hero/avatar/'+s0.avatar+'.png':''; r=Math.min(4,s0.r|0); eq=!!s0.equipped; sub=(s0.bonus||'')+(s0.art?'':' · arte em breve'); }
    body=`<div style="display:flex;align-items:center;gap:12px"><span style="width:76px;height:76px;flex:none;border-radius:16px;border:2px solid ${bRC(r)};background:radial-gradient(circle at 50% 40%,#3a2c1f,#16110d);box-shadow:0 0 12px ${bRC(r)}55;display:flex;align-items:center;justify-content:center"><img src="${bEsc(img)}" alt="" style="width:62px;height:62px;object-fit:contain"></span>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span style="font-size:15px;font-weight:900;color:${bRC(r)};overflow-wrap:anywhere">${bEsc(name)}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">${bEsc(bRN(r))}${sub?' · '+bEsc(sub):''}</span></div></div>`;
    acts=`<div style="display:flex;gap:8px">${eq?btn('noeq',k==='pet'?'Equipado':'Equipada',false,true):btn('equip'+k,'Equipar',true)}${k==='pet'?btn('gopets','Ver na tela de Pets'):k==='mount'?btn('gomounts','Ver Montarias'):''}</div>`; }
  return `<div class="bg-sheet" role="dialog" aria-label="Detalhe" style="position:absolute;left:0;right:0;bottom:0;max-height:78%;overflow-y:auto;padding:14px 14px max(14px,env(safe-area-inset-bottom));border-radius:20px 20px 0 0;background:#1d1611;border-top:2px solid #ffc94a;box-shadow:0 -8px 24px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:10px;z-index:5;box-sizing:border-box">
    <button data-x="close" aria-label="Fechar" style="position:absolute;right:8px;top:6px;width:${t44}px;height:${t44}px;border:0;background:transparent;color:#c9b9a2;font-size:24px;font-weight:900">×</button>
    ${body}${acts}</div><div data-x="close" aria-hidden="true" style="position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:4"></div>`; }

/* ---------- desenho ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.bg-tap:active{transform:scale(.96)} .bg-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 5px 0 #8a4f0c;border:0}
.bg-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c} .bg-in{animation:bg-fade .2s ease-out} @keyframes bg-fade{from{opacity:0}to{opacity:1}}
.bg-sheet{animation:bg-up .22s ease-out} @keyframes bg-up{from{transform:translateY(30px);opacity:0}to{transform:none;opacity:1}}
#bg_scroll>*{flex-shrink:0} @media (prefers-reduced-motion:reduce){.bg-in,.bg-sheet{animation:none}}`; document.head.appendChild(st); })();
function bToastHtml(m){ return `<div role="status" style="position:absolute;left:0;right:0;top:60px;display:flex;justify-content:center;pointer-events:none;z-index:7"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ffc94a;font-size:14px;font-weight:900;color:#f6ecdf;max-width:270px;text-align:center;line-height:1.2">${bEsc(m)}</span></div>`; }
function bToast(m){ XB.toast=m; XB.toastT=Date.now(); const el=document.getElementById('bg_toast'); if(el) el.innerHTML=bToastHtml(m); }
function scrBag(){ const d=bTry(()=>xDims(240),{s:1}), sc0=XB.anim?null:document.getElementById('bg_scroll'), y0=sc0?(+sc0.scrollTop||0):0, t44=bTouch(d);
  const n=bItems().length, mx=bMax(), full=n>=mx;
  const head=`<div style="margin:0 12px;display:flex;align-items:center;gap:8px"><span class="lil" style="font-size:20px;color:#f6ecdf">Mochila</span>
    <span aria-label="Itens na mochila: ${n} de ${mx}" style="margin-left:auto;padding:3px 10px;border-radius:10px;background:#0e0a07;border:1px solid ${full?'#ff6b6b':'#4a3a2b'};font-size:13px;font-weight:900;color:${full?'#ff8a7a':'#ffe07a'}">${n}/${mx}</span></div>`;
  const tabs=`<div role="tablist" aria-label="Mochila" style="margin:0 12px;display:flex;gap:5px;overflow-x:auto;padding-bottom:2px">${B_TABS.map(([k,nm])=>{ const on=XB.tab===k;
    return `<button role="tab" data-x="tab" data-t="${k}" aria-selected="${on}" style="flex:none;height:${t44}px;padding:0 12px;border-radius:12px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#3a2c1f':'#1d1611'};color:${on?'#ffc94a':'#c9b9a2'};font-size:13px;font-weight:900;white-space:nowrap">${nm}</button>`; }).join('')}</div>`;
  const t=XB.tab, body=t==='weapon'||t==='gear'||t==='wing'?bItemsTab(d):t==='pets'?bPetsTab():t==='mounts'?bMountsTab():t==='skins'?bSkinsTab():t==='mats'?bMatsTab():bConsTab();
  const html=`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="bg_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:8px 0 16px;box-sizing:border-box">${head}${tabs}${body}</div>
    ${bDetail(d)}<div id="bg_toast">${XB.toast&&Date.now()-XB.toastT<1500?bToastHtml(XB.toast):''}</div></div>`;
  V.innerHTML=bTry(()=>xWrap(d,XB.anim?'bg-in':'',html),html);
  if(y0){ const sc=document.getElementById('bg_scroll'); if(sc) sc.scrollTop=y0; } XB.anim=false; XB.sig=bSig(); }
function bSig(){ try{ return [XB.tab,XB.rf,XB.sort,XB.sel&&XB.sel.id,XB.cf,(S.inv||[]).length,S.nextId,JSON.stringify(S.eq||{}),bTry(()=>Sys.pet.ensure(S).eq,''),bTry(()=>Sys.mount.ensure(S).eq,'')].join('|'); }catch(e){ return ''; } }
function bChanged(){ XB.fcCache={}; try{ if(typeof statsChanged==='function') statsChanged(); }catch(e){} }

function bClick(b){ const a=b.dataset.x, sel=XB.sel;
  if(a==='tab'){ bSnd('ui_tap'); XB.tab=b.dataset.t; XB.sel=null; XB.cf=null; XB.rf=-1; XB.anim=true; render(); }
  else if(a==='rf'){ bSnd('ui_tap'); XB.rf=+b.dataset.v; render(); }
  else if(a==='sort'){ bSnd('ui_tap'); XB.sort=b.dataset.v; render(); }
  else if(a==='item'){ bSnd('ui_tap'); const it=bTry(()=>itemOf(+b.dataset.id),null); if(it){ delete it.nw; XB.sel={kind:'item',id:it.id}; XB.cf=null; render(); } }
  else if(a==='pet'||a==='mount'||a==='skin'){ bSnd('ui_tap'); XB.sel={kind:a,id:b.dataset.id}; render(); }
  else if(a==='close'){ bSnd('ui_tap'); XB.sel=null; XB.cf=null; render(); }
  else if(a==='forge'){ bSnd('ui_tap'); if(bTry(()=>xUnlocked('forge'),true)&&window.Panels&&Panels.open('forge')) return; bToast('A Forja abre no nível '+bTry(()=>xUnlockLv('forge'),12)); }
  else if(a==='gopets'){ bSnd('ui_tap'); if(!(window.Panels&&Panels.open('pets'))) bToast('Pets: em breve'); }
  else if(a==='gomounts'){ bSnd('ui_tap'); if(!(window.Panels&&Panels.open('mounts'))) bToast('Montarias: em breve'); }
  else if(!sel) return;
  else if(a==='equip'){ const it=itemOf(sel.id); if(!it) return; if(!bTry(()=>canEq(it),true)){ bSnd('ui_tap'); bToast('Seu nível ainda é baixo para este item'); return; }
    const dl=bTry(()=>Sys.fc.measure(S,Sys.host,()=>{ S.eq[it.slot]=it.id; }).delta,null); if(!dl) S.eq[it.slot]=it.id; bChanged(); bSnd('equip'); bToast('Equipado'+(dl&&dl.text?': FC '+dl.text:'')); XB.sel=null; render(); }
  else if(a==='equippet'){ if(bTry(()=>Sys.pet.equip(S,sel.id),false)){ bChanged(); bSnd('equip'); bToast('Pet equipado'); XB.sel=null; render(); } else { bSnd('ui_tap'); bToast('Não deu para equipar agora'); } }
  else if(a==='equipmount'){ if(bTry(()=>Sys.mount.equip(S,sel.id),false)){ bChanged(); bSnd('equip'); bToast('Montaria equipada'); XB.sel=null; render(); } else { bSnd('ui_tap'); bToast('Não deu para equipar agora'); } }
  else if(a==='equipskin'){ const r=bTry(()=>Sys.appearance.equipFixed(S,sel.id),{ok:false}); bSnd('ui_tap');
    if(r.ok){ bChanged(); bToast('Skin equipada'); XB.sel=null; render(); } else bToast(r.reason==='art'?'A arte desta skin chega em breve':r.reason==='hero'?'Esta skin é do outro herói':'Não deu para equipar agora'); }
  else if(a==='dism'){ const it=itemOf(sel.id); if(!it) return; bSnd('ui_tap'); if(bIsEq(it)){ bToast('Tire o item antes de desmontar'); return; } XB.cf=it.id; render(); }
  else if(a==='cfno'){ bSnd('ui_tap'); XB.cf=null; render(); }
  else if(a==='cfyes'){ const it=itemOf(sel.id); if(!it||bIsEq(it)) return; const r=bTry(()=>Sys.loot.dismantle(S,Sys.host,it),null); S.inv=S.inv.filter(x=>x.id!==it.id);
    bChanged(); bSnd('coin'); XB.sel=null; XB.cf=null; bToast('Desmontado: +'+bNum(r&&r.gold||0)+' moedas'+(r&&r.forge?' · +'+r.forge+' pedra'+(r.forge>1?'s':'')+' de forja':'')); render(); }
}
Panels.add('bag',{title:'Mochila',render:scrBag,click:bClick,
  tick(){ if(XB.sig&&bSig()!==XB.sig&&bOn()) render(); },
  onOpen(o){ XB.anim=true; XB.sel=null; XB.cf=null; XB.toast=''; XB.fcCache={}; if(o&&o.tab&&B_TABS.some(t=>t[0]===o.tab)) XB.tab=o.tab; },
  onClose(){ XB.sel=null; XB.cf=null; XB.toast=''; } });
window.BagUI={state:XB,list:bItemList,click:bClick,isEq:bIsEq,render:scrBag};   /* só para testes e para o Modo dono */
})();
