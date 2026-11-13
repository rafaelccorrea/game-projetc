'use strict';
/* ================= COLEÇÃO DE NOVIDADES (Pets, Montarias, Asas) — tela nova, nasce DESLIGADA (PANEL_ON.colecao) =================
   Pedido do PO (13/11): mostrar os 9 pets novos (+ os pets grátis do começo), as 10 montarias novas e as 8 asas novas, cada um com
   "Como obter" tirado da tabela aprovada pelo dono (docs/PROPOSTA_NOVOS_ITENS.md), que já mora nos módulos:
   pets = Sys.pet.DATA.pets (nw:true; src, hatchFrags; iniciais = starterIds), montarias = Sys.mount.DATA.mounts (nw:true), asas = Sys.stats.wingCatalog().
   NENHUMA regra aqui: só leitura. Posse = Sys.pet/mount.ensure(S).owned; "Disponível" = o módulo já liberou o item (live/avail); senão "Em breve".
   Asa não tem posse por modelo (é item de equipamento): mostra só Disponível / Em breve. Mecha: "Em breve" até as compras abrirem (a proposta é R$ 49,90).
   Arte: os *_ref_prev.png de assets/pets/new, assets/mounts/new e assets/anim/equip/new (~300 KB cada; carga preguiçosa e só da aba aberta).
   Sem emoji, sem botão sem ação, PT-BR. Pedido de ligação (Q-17): carregar este script, ligar PANEL_ON.colecao e um item no MENU. */
const XCL={tab:0};
const CL_TABS=['Pets','Montarias','Asas'];
const CL_ART={
  pets:{shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'},
  mounts:{raptor:'war_raptor',scorpion:'giant_scorpion',panther:'shadow_panther',hellhorse:'infernal_horse',unicorn:'war_unicorn',icewolf:'ice_wolf',phoenixm:'giant_phoenix',blackdragon:'black_dragon',celtiger:'celestial_tiger',mecha:'war_mecha'}
};
const clEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const clRar=r=>{ try{ return RAR[r]; }catch(e){ return null; } };
const CL_RC=['#b8b8b8','#5aa0ff','#c27bff','#ff5a7a','#ffc94a','#7ff6ff'];
const CL_RN=['Básico','Raro','Épico','Mítico','Lendário','Divino'];
const clRn=r=>{ const x=clRar(r); return (x&&x.n)||CL_RN[r]||''; };
const clRc=r=>{ const x=clRar(r); return (x&&x.c)||CL_RC[r]||'#c9b9a2'; };
function clImg(kind,id,name){
  let src='';
  if(kind==='pets'&&CL_ART.pets[id]) src='assets/pets/new/'+CL_ART.pets[id]+'_ref_prev.png';
  else if(kind==='mounts'&&CL_ART.mounts[id]) src='assets/mounts/new/'+CL_ART.mounts[id]+'_ref_prev.png';
  else if(kind==='wings') src='assets/anim/equip/new/wing_'+id+'_ref_prev.png';
  if(!src) return '<span aria-hidden="true" style="flex:none;width:84px;height:84px;border-radius:12px;background:#16110d;border:2px solid #4a3a2b;display:flex;align-items:center;justify-content:center;font-family:\'Lilita One\',sans-serif;font-size:30px;color:#6b5843">'+clEsc((name||'?').charAt(0))+'</span>';
  return '<img src="'+src+'" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'" style="flex:none;width:84px;height:84px;border-radius:12px;background:#16110d;border:2px solid #4a3a2b;object-fit:contain">';
}
function clState(own,live,extra){
  if(own) return {t:'Você tem',c:'#7ef08a'};
  if(live) return {t:'Disponível',c:'#ffe07a'};
  return {t:extra||'Em breve',c:'#c9b9a2'};
}
function clCard(kind,it){
  const st=clState(it.own,it.live,it.soonText), rc=clRc(it.r);
  const src=(it.src&&it.src.length)?it.src:[];
  const how=src.length?'<ul style="margin:0;padding:0 0 0 16px;display:flex;flex-direction:column;gap:2px;font-size:12px;font-weight:700;color:#e8dccb;line-height:1.3">'+src.map(s=>'<li>'+clEsc(s)+'</li>').join('')+'</ul>'
    :'<span style="font-size:12px;font-weight:700;color:#c9b9a2">Já faz parte do jogo desde o começo.</span>';
  const extra=it.frags?'<span style="font-size:11px;font-weight:800;color:#c9b9a2">Nasce com '+it.frags+' fragmentos.</span>':'';
  const era=it.minEra?'<span style="font-size:11px;font-weight:800;color:#c9b9a2">A partir da era '+it.minEra+'.</span>':'';
  return '<div role="group" aria-label="'+clEsc(it.name)+', '+clEsc(clRn(it.r))+', '+clEsc(st.t)+'" style="flex:none;display:flex;gap:10px;padding:10px;border-radius:14px;background:#1d1611;border:2px solid '+rc+'55;box-sizing:border-box">'
    +(it.noArt?'':clImg(kind,it.id,it.name))
    +'<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    +'<b style="font-family:\'Lilita One\',sans-serif;font-size:16px;line-height:1.1">'+clEsc(it.name)+'</b>'
    +'<span style="font-size:11px;font-weight:900;padding:2px 7px;border-radius:8px;background:'+rc+'33;color:'+rc+';border:1px solid '+rc+'">'+clEsc(clRn(it.r))+'</span></div>'
    +'<span style="font-size:12px;font-weight:900;color:'+st.c+'">'+clEsc(st.t)+'</span>'
    +(it.note?'<span style="font-size:12px;font-weight:700;color:#c9b9a2">'+clEsc(it.note)+'</span>':'')
    +'<span style="font-size:12px;font-weight:900;color:#c9b9a2">Como obter</span>'+how+extra+era+'</div></div>';
}
function clHead(t,sub){ return '<div style="flex:none;padding:6px 2px 0"><b style="font-family:\'Lilita One\',sans-serif;font-size:17px">'+clEsc(t)+'</b>'+(sub?'<div style="font-size:12px;font-weight:700;color:#c9b9a2;line-height:1.3">'+clEsc(sub)+'</div>':'')+'</div>'; }
function clPets(){
  const P=window.Sys&&Sys.pet; if(!P||!P.DATA||!P.DATA.pets) return null;
  let own={}; try{ own=P.ensure(S).owned||{}; }catch(e){}
  const starters=P.DATA.starterIds||[], list=P.DATA.pets, host=Sys.host||{};
  const live=p=>{ try{ return P.avail?!!P.avail(p,host):true; }catch(e){ return false; } };
  const st=list.filter(p=>starters.indexOf(p.id)>=0&&!p.removed).map(p=>({id:p.id,name:p.name,r:p.r,own:!!own[p.id],live:true,src:[],noArt:true}));
  const nw=list.filter(p=>p.nw).map(p=>({id:p.id,name:p.name,r:p.r,own:!!own[p.id],live:live(p),src:p.src,frags:p.hatchFrags,minEra:p.minEra,note:p.skill&&p.skill.note?'Habilidade: '+p.skill.note:''}));
  return clHead('Pets novos ('+nw.length+')','Todos pelo caminho indicado: nenhum sorteio pago.')+nw.map(x=>clCard('pets',x)).join('')
    +(st.length?clHead('Pets grátis do começo','Os pets que você já conhece continuam de graça.')+st.map(x=>clCard('pets',x)).join(''):'');
}
function clMounts(){
  const M=window.Sys&&Sys.mount; if(!M||!M.DATA||!M.DATA.mounts) return null;
  let own={}; try{ own=M.ensure(S).owned||{}; }catch(e){}
  const live=m=>{ try{ return M.live?!!M.live(m):!m.nw; }catch(e){ return false; } };
  const nw=M.DATA.mounts.filter(m=>m.nw).map(m=>({id:m.id,name:m.name,r:m.r,own:!!own[m.id],live:live(m),src:m.src,frags:m.hatchFrags,minEra:m.minEra,soonText:m.id==='mecha'?'Em breve (até as compras abrirem)':null}));
  return clHead('Montarias novas ('+nw.length+')','Fragmentos juntam até a montaria nascer; o que vem inteiro está indicado.')+nw.map(x=>clCard('mounts',x)).join('');
}
function clWings(){
  const T=window.Sys&&Sys.stats; if(!T||!T.wingCatalog) return null;
  const nw=T.wingCatalog().filter(w=>w.r!=null).map(w=>({id:w.id,name:w.name,r:w.r,own:false,live:!!w.live,src:w.src,note:w.rarest?'A asa mais rara do jogo.':''}));
  return clHead('Asas novas ('+nw.length+')','Cada asa é um item de equipamento; a força vem da raridade, da era e da Forja.')+nw.map(x=>clCard('wings',x)).join('');
}
/* imagens da aba aberta (o invólucro p_wait.js espera todas antes de desenhar) */
function clUrls(){ const u=[]; try{ if(XCL.tab===0){ const P=Sys.pet; if(P&&P.DATA) for(const p of P.DATA.pets) if(p.nw&&CL_ART.pets[p.id]) u.push('assets/pets/new/'+CL_ART.pets[p.id]+'_ref_prev.png'); }
    else if(XCL.tab===1){ const M=Sys.mount; if(M&&M.DATA) for(const m of M.DATA.mounts) if(m.nw&&CL_ART.mounts[m.id]) u.push('assets/mounts/new/'+CL_ART.mounts[m.id]+'_ref_prev.png'); }
    else { const T=Sys.stats; if(T&&T.wingCatalog) for(const w of T.wingCatalog()) if(w.r!=null) u.push('assets/anim/equip/new/wing_'+w.id+'_ref_prev.png'); } }catch(e){} return u; }
function scrColecao(){
  const d=xDims(520); const fn=[clPets,clMounts,clWings][XCL.tab]||clPets; let body=null;
  try{ body=fn(); }catch(e){ body=null; }
  const tabs=CL_TABS.map((t,i)=>'<button role="tab" aria-selected="'+(i===XCL.tab)+'" data-x="tab" data-i="'+i+'" style="flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid '+(i===XCL.tab?'#ffc94a':'#4a3a2b')+';background:'+(i===XCL.tab?'#3a2c1a':'#1d1611')+';color:'+(i===XCL.tab?'#ffe07a':'#c9b9a2')+';font-weight:900;font-size:14px">'+t+'</button>').join('');
  const inner=body==null?'<div role="alert" style="padding:28px 12px;text-align:center;font-weight:800;color:#c9b9a2">Esta lista ainda não está disponível.</div>':body;
  V.innerHTML=xWrap(d,'','<div role="tablist" aria-label="Coleção" style="flex:none;display:flex;gap:6px;padding:4px 2px 6px">'+tabs+'</div>'
    +'<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 8px">'+inner+'</div>'
    +'<div style="flex:none;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="back" style="width:100%;min-height:46px;border-radius:12px;border:2px solid #6b5843;background:#33271d;color:#f6ecdf;font-weight:900;font-size:15px">Voltar</button></div>');
}
function clClick(b){
  const a=b.dataset.x;
  if(a==='back'){ clSnd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(a==='tab'){ XCL.tab=parseInt(b.dataset.i,10)||0; clSnd('ui_tap'); render(); return; }
}
Panels.add('colecao',{title:'Coleção',render:function(){ if(typeof pwGate==='function'&&pwGate(clUrls())) return; return scrColecao.apply(this,arguments); },click:function(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return clClick.apply(this,arguments); },onOpen(){ XCL.tab=0; },onClose(){}});
