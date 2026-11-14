'use strict';
/* ================= CONJUNTO PvP DA ARENA (docs/LIGACOES_LOM_TELAS.md, seção 4) — NASCE DESLIGADO (PANEL_ON.arenaset = false) =================
   VISUAL: mock A votado pelo dono (docs/proto/v2/a/mocks/pvp_a.jpg): o herói no centro de uma arena redonda de pedra, "Magias da Arena" com os 3 círculos
   PREENCHIDOS (as magias do conjunto Arena do Grimório, com ícone e nome), a grade de equipamento com Pet e Montaria à direita, a linha da Brasa da Arena
   e os dois botões azuis. Ressalvas do dono: SEM a aba Loja; as magias aparecem de verdade.
   NÃO é uma tela nova da Arena: é o BLOCO da aba "Conjunto PvP", entregue como funções para o js/p_arena.js chamar (este arquivo não edita a Arena):
     window.PArenaSet = { on(), tab, html(), click(b), prize(rewards), urls(), actions }
   - on(): a aba aparece? (tela ligada + Sys.arenaSet ligado) · html(): o corpo da aba · click(b): trata os data-x "as-*" (devolve true se era dele);
   - prize(rw): a caixa "+1 Brasa" do resultado da luta ({img, v, lb} no formato do paPvPrize) ou null.
   Para conferir sem mexer na Arena, o bloco também abre sozinho como painel 'arenaset' (Panels.open('arenaset') / ?debug=1&painel=arenaset).
   NENHUMA regra e NENHUM número aqui. Tudo vem dos módulos: Sys.arenaSet.view / modsText / why (magias, modificadores, Brasa), Sys.loadouts.view / save
   (equipamento, pet e montaria do conjunto Arena) e Sys.arenaNet.snapshot (manda o retrato depois de salvar).
   SALVAR troca o conjunto guardado: DOIS TOQUES (o 1º arma, o 2º confirma). Nada à venda.
   ATENÇÃO: com o sistema desligado nada é lido (o view prepara o save): a aba nem aparece e o painel mostra o aviso e o Voltar.
   Chaves: PANEL_ON.arenaset (este bloco) e Sys.arenaSet.DATA.on (o sistema). O arquivo roda em escopo próprio. */
(function(){
const N='arenaset';
const AS_LEVEL_DEFAULT=28;   /* o conjunto mora dentro da Arena: usa o nível da Arena do jogo (FB_UNLOCK.arena); este número é só a reserva */
const AS_MSG_MS=3200;
/* ---------- ARTE: UMA constante. Peças pintadas do mock que não existem em assets/ ficam em CSS/SVG: o piso redondo de pedra (.as-ring), o ícone de pet,
   o de montaria e o da Brasa. Quando existirem em AS_ART_DIR: ring.png, pet.png, mount.png, brasa.png e empty.png (círculo de magia vazio), troque AS_ART_ON.
   O que JÁ existe em disco é usado: ícones das magias (assets/icons/grimoire/<id>.png) e das peças (assets/icons/slots/era<N>_<peça>.png). ---------- */
const AS_ART_ON=false, AS_ART_DIR='assets/arenaset/';
const AS_SPELL_DIR='assets/icons/grimoire/', AS_SLOT_DIR='assets/icons/slots/';
const AS_SPELLS=['ancestralFire','bronzePhalanx','cannonball','droneRain','gearSpin','ghostFog','infernalFlame','ionShield','judgeBlessing','knightCharge','lightLance','medKit','minotaurSpear','plasmaRay','rollingStone','royalBreath','steamBoiler','underChains'];
const AS_SLOT_FILE={weapon:'weapon',armor:'vest',hat:'helmet',gloves:'gloves',boots:'boots',necklace:'necklace',wing:'wings'};
const AS_SLOT_NAME={weapon:'Arma',armor:'Roupa',hat:'Elmo',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'};
const AS_BRASA_IMG='fogueira/fg_s1';   /* caixa "+1 Brasa" do resultado: o paPvPrize monta assets/ui/<img>.png; a Fogueira nível 1 serve até existir assets/ui/brasa.png */
const AS_SVG={
  pet:'<path d="M10 30c0-9 4-14 10-14s10 5 10 14z" fill="#c9a06a" stroke="#fff0d6" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 17l-2-8 7 4M28 17l2-8-7 4" fill="#c9a06a" stroke="#fff0d6" stroke-width="1.6" stroke-linejoin="round"/><circle cx="16.500" cy="23" r="1.5" fill="#2a1a06"/><circle cx="23.500" cy="23" r="1.5" fill="#2a1a06"/>',
  mount:'<path d="M7 22c4-8 22-8 26 0l-3 4H10z" fill="#a8702f" stroke="#ffe0b0" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 26v6M27 26v6" stroke="#ffe0b0" stroke-width="2.4" stroke-linecap="round"/><path d="M15 17c2-4 8-4 10 0" fill="none" stroke="#ffe0b0" stroke-width="1.6"/>',
  brasa:'<path d="M20 5c2 6 9 9 9 17a9 9 0 01-18 0c0-4 2-6 4-9 1 3 2 4 3 4 0-4 1-8 2-12z" fill="#ff7a2e" stroke="#ffd9a8" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 20c2 3 4 4 4 7a4 4 0 01-8 0c0-3 2-4 4-7z" fill="#ffd25e"/>',
  spell:'<circle cx="20" cy="20" r="9" fill="none" stroke="#8d96c0" stroke-width="2" stroke-dasharray="4 4"/>'};
function icoOf(kind){ if(!Object.prototype.hasOwnProperty.call(AS_SVG,kind)) kind='spell';
  if(AS_ART_ON) return '<img src="'+esc2(AS_ART_DIR+(kind==='spell'?'empty':kind)+'.png')+'" alt="">';
  return '<svg viewBox="0 0 40 40" aria-hidden="true">'+AS_SVG[kind]+'</svg>'; }
const spellIco=id=>AS_SPELLS.indexOf(id)>=0?'<img src="'+esc2(AS_SPELL_DIR+id+'.png')+'" alt="">':icoOf('spell');
const eraNow=()=>{ try{ if(typeof eraOf==='function') return Math.max(0,Math.min(8,eraOf(Math.max(1,S.stage|0))|0)); }catch(e){} return 0; };
const slotIco=slot=>AS_SLOT_FILE[slot]?'<img src="'+esc2(AS_SLOT_DIR+'era'+eraNow()+'_'+AS_SLOT_FILE[slot]+'.png')+'" alt="">':icoOf('spell');

/* ---------- leituras dos módulos ISOLADAS ---------- */
const AM=()=>(window.Sys&&Sys.arenaSet)||null;
const LM=()=>(window.Sys&&Sys.loadouts)||null;
const has=()=>{ const M=AM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.modsText==='function'&&typeof M.why==='function'); };
const isOn=()=>{ try{ return has()&&AM().DATA.on===true; }catch(e){ return false; } };
const panelOn=()=>{ try{ return !!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N)); }catch(e){ return false; } };
const host=()=>(window.Sys&&Sys.host)||null;
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const redraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const now=()=>Date.now();
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const nT=v=>{ try{ return typeof n0==='function'?n0(num(v)):String(Math.round(num(v))); }catch(e){ return String(Math.round(num(v))); } };
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
const why=r=>{ let t=''; try{ t=String(AM().why(r)||''); }catch(e){ t=''; } return t||'Não deu agora'; };
/* o Sys.loadouts não tem why(): os dois motivos do salvar ficam aqui */
const AS_WHY_SAVE={off:'Os conjuntos de equipamento ainda não abriram',mode:'Não deu agora'};
const viewNow=()=>{ try{ const v=AM().view(S,host()); return v&&v.on?v:null; }catch(e){ return null; } };
/* o conjunto Arena do Sys.loadouts com nomes: {saved, gear:[{slot, id, have, name}], pet:{name}, mount:{name}} ou null (módulo ausente/desligado) */
const setNow=()=>{ try{ const L=LM(); if(!L||!L.DATA||L.DATA.on!==true||typeof L.view!=='function') return null; const v=L.view(S,host()); return (v&&Array.isArray(v.modes)&&v.modes.find(m=>m.mode==='arena'))||null; }catch(e){ return null; } };
const lvlNow=()=>{ try{ const L=window.Sys&&Sys.level; if(L&&typeof L.level==='function') return num(L.level(S)); const h=host(); return h&&typeof h.level==='function'?num(h.level()):-1; }catch(e){ return -1; } };
const lvlNeed=()=>{ try{ if(typeof FB_UNLOCK!=='undefined'&&FB_UNLOCK&&num(FB_UNLOCK.arena)>0) return num(FB_UNLOCK.arena); }catch(e){} return AS_LEVEL_DEFAULT; };
const locked=()=>{ const l=lvlNow(); return l>=0&&l<lvlNeed(); };

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.as-root) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.as-root{--as-ink:#fff3d6;--as-mut:#b9c0de;--as-soft:#e9e4f5;--as-ttl:#ffd98a;--as-cave1:rgba(20,22,58,.86);--as-cave2:rgba(12,12,34,.92);--as-glow:rgba(120,110,60,.35);
  --as-ring:#b9bcc6;--as-ringin:#262a3c;--as-slot:#3a3d4c;--as-slotline:#8a8d9a;--as-stone1:#8f95a6;--as-stone2:#5d6274;--as-sand1:#d9b872;--as-sand2:#9a7a3e;
  --as-blue1:#6fa8e6;--as-blue2:#3f73b8;--as-bluesh:#274a7c;--as-blueink:#ffffff;--as-ok1:#9cf08f;--as-ok2:#3fae3c;--as-okink:#0d2410;--as-bad:#ffb3a8;--as-tag:#7fe07a;color:var(--as-ink)}
.as-root,.as-root *{box-sizing:border-box}
.as-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.as-root{flex:none;display:flex;flex-direction:column;gap:8px;padding:8px 10px 12px;border-radius:14px;background:radial-gradient(ellipse at 50% 46%,var(--as-glow),transparent 60%),linear-gradient(180deg,var(--as-cave1),var(--as-cave2));min-width:0}
.as-i{flex:none;display:inline-block;width:22px;height:22px;vertical-align:middle}
.as-i svg,.as-i img{display:block;width:100%;height:100%;object-fit:contain}
.as-stage{position:relative;height:150px;min-width:0}
.as-ring{position:absolute;left:50%;bottom:6px;width:230px;max-width:92%;height:84px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 50% 50%,var(--as-sand1),var(--as-sand2) 62%,var(--as-stone2) 64%,var(--as-stone1) 80%,var(--as-stone2));border:3px solid #2a2d3a;box-shadow:0 6px 0 rgba(0,0,0,.45)}
.as-ring.art{background:none;border:0;box-shadow:none}
.as-ring.art img{display:block;width:100%;height:100%;object-fit:contain}
.as-stage canvas{position:absolute;left:50%;bottom:30px;width:120px;height:118px;margin-left:-60px}
.as-h{margin:0;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:21px;line-height:1.15;color:var(--as-ttl);text-shadow:0 2px 0 rgba(0,0,0,.6);overflow-wrap:anywhere}
.as-tag{align-self:center;padding:2px 10px;border-radius:10px;background:rgba(127,224,122,.14);border:1px solid rgba(127,224,122,.45);font-size:11.5px;font-weight:900;color:var(--as-tag);text-align:center;overflow-wrap:anywhere}
.as-sps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.as-sp{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;min-width:0}
.as-spc{display:block;width:78px;max-width:100%;aspect-ratio:1;border-radius:50%;border:5px solid var(--as-ring);background:var(--as-ringin);overflow:hidden;box-shadow:0 3px 0 rgba(0,0,0,.45)}
.as-spc img,.as-spc svg{display:block;width:100%;height:100%;object-fit:cover}
.as-sp b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:13.5px;line-height:1.15;color:var(--as-ttl);overflow-wrap:anywhere;max-width:100%}
.as-sp small{font-size:10.5px;font-weight:800;line-height:1.3;color:var(--as-mut);overflow-wrap:anywhere;max-width:100%}
.as-sp.no b{color:var(--as-mut)}
.as-line{margin:0;text-align:center;font-size:12.5px;font-weight:900;line-height:1.35;color:var(--as-soft);overflow-wrap:anywhere}
.as-hr{height:2px;border-radius:1px;background:linear-gradient(90deg,transparent,rgba(255,217,138,.45),transparent)}
.as-gear{display:flex;gap:10px;align-items:flex-start;min-width:0}
.as-grid{flex:1;min-width:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.as-side{flex:none;width:72px;display:flex;flex-direction:column;gap:6px;min-width:0}
.as-side small{display:block;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-size:13px;color:var(--as-ttl)}
.as-sl{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;aspect-ratio:1;padding:5px;border-radius:12px;border:3px solid var(--as-slotline);background:var(--as-slot);box-shadow:0 3px 0 rgba(0,0,0,.45);text-align:center;min-width:0;overflow:hidden}
.as-sl img,.as-sl svg{display:block;width:74%;height:74%;object-fit:contain}
.as-sl.no{border-style:dashed;opacity:.55}
.as-sl.no img{filter:grayscale(1) brightness(.7)}
.as-sl i{font-style:normal;font-size:9.5px;font-weight:900;line-height:1.15;color:var(--as-soft);overflow-wrap:anywhere;max-width:100%}
.as-brasa{margin:0;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px 6px;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-size:17px;line-height:1.2;color:var(--as-ttl);overflow-wrap:anywhere}
.as-msg{min-height:36px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--as-ttl);overflow-wrap:anywhere}
.as-msg.bad{color:var(--as-bad)}
.as-acts{display:flex;flex-wrap:wrap;gap:10px}
.as-bt,.xs .as-bt{flex:1 1 128px;min-width:0;min-height:56px;border-radius:14px;border:2px solid var(--as-bluesh);background:linear-gradient(180deg,var(--as-blue1),var(--as-blue2));color:#ffffff;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;line-height:1.1;padding:4px 8px;text-align:center;overflow-wrap:anywhere;text-shadow:0 2px 0 rgba(0,0,0,.45);box-shadow:0 4px 0 var(--as-bluesh)}
.as-bt.b,.xs .as-bt.b{border-color:#1f6a1c;background:linear-gradient(180deg,var(--as-ok1),var(--as-ok2));color:#0d2410;text-shadow:none;box-shadow:0 4px 0 #1f6a1c}
.as-bt:active{transform:translateY(2px)}
.as-wrap{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.as-scroll{flex:1;min-height:0;padding:8px 10px 20px}
.as-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.as-off span{font-weight:800;font-size:14px;line-height:1.4;color:#efe3d0;overflow-wrap:anywhere}
.as-gold,.xs .as-gold{min-width:140px;min-height:48px;border-radius:14px;border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-weight:900;font-size:16px;box-shadow:0 3px 0 #9a5a10}
@media (prefers-reduced-motion:reduce){.as-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado do bloco (nada disto vai para o save) ---------- */
const X={arm:'',msg:'',bad:false,msgT:0,raf:0,t0:0,sig:''};
function say(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=now(); }

/* ---------- o herói na arena (canvas): o herói do jogo a pé, com a arma na mão (window.drawHeroFull), pés no piso de pedra ---------- */
const canHero=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
function loop(ts){ X.raf=0; const c=byId('as_hero'); if(!c||!canHero()){ X.t0=0; return; }
  try{ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||120, h=c.clientHeight||118;
    if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
    if(!X.t0) X.t0=ts; const x=c.getContext('2d'); if(x){ x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h); window.drawHeroFull(x,w/2,h-6,(h-12)/HS,{t:Math.max(0,(ts-X.t0)/1000),mount:false}); x.setTransform(dpr,0,0,dpr,0,0); } }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&canHero()&&byId('as_hero')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }

/* ---------- HTML do bloco (o corpo da aba "Conjunto PvP") ---------- */
function html(){ if(!isOn()) return ''; const v=viewNow(); if(!v) return ''; const M=AM(), set=setNow(), max=Math.max(1,M.DATA.maxSpells|0), sp=(v.spells||[]).slice(0,max);
  let h='<div class="as-root"><div class="as-stage"><span class="as-ring'+(AS_ART_ON?' art':'')+'">'+(AS_ART_ON?'<img src="'+esc2(AS_ART_DIR+'ring.png')+'" alt="">':'')+'</span><canvas id="as_hero" role="img" aria-label="Seu herói na arena"></canvas></div>';
  h+='<h3 class="as-h">Magias da Arena</h3>'+(v.fromFases?'<span class="as-tag">usando o conjunto de Fases</span>':'')+'<div class="as-sps">';
  for(let i=0;i<max;i++){ const s=sp[i];
    h+=s?'<div class="as-sp"><span class="as-spc">'+spellIco(s.id)+'</span><b>'+esc2(s.name||'Magia')+'</b><small>Nv '+nT(s.lv)+(s.text?' · '+esc2(s.text):'')+'</small></div>'
      :'<div class="as-sp no"><span class="as-spc">'+icoOf('spell')+'</span><b>Vazio</b><small>escolha no Grimório</small></div>'; }
  let mt=''; try{ mt=String(M.modsText(v.mods)||''); }catch(e){ mt=''; }
  h+='</div><p class="as-line">'+(mt?esc2(mt):'Sem magias no conjunto: a luta da arena fica igual à de hoje.')+'</p><div class="as-hr"></div>';
  /* equipamento do conjunto Arena (Sys.loadouts): peça salva = acesa, com o nome; não salva = apagada */
  const gear=set&&set.saved?set.gear:Object.keys(AS_SLOT_FILE).map(s=>({slot:s,id:null}));
  h+='<div class="as-gear"><div class="as-grid" role="list" aria-label="Equipamento do conjunto da Arena">'+gear.map(g=>{ const okk=g.id!=null&&g.have!==false, nm=AS_SLOT_NAME[g.slot]||'Peça';
      return '<div class="as-sl'+(okk?'':' no')+'" role="listitem" aria-label="'+esc2(nm+': '+(okk?(g.name||'salva'):g.id!=null?'você não tem mais esta peça':'nada salvo'))+'">'+slotIco(g.slot)+'<i>'+esc2(okk&&g.name?g.name:nm)+'</i></div>'; }).join('')+'</div>';
  const side=(k,lbl,o)=>'<div><small>'+lbl+'</small><div class="as-sl'+(o?'':' no')+'">'+icoOf(k)+'<i>'+esc2(o?(o.name||'salvo'):'nenhum')+'</i></div></div>';
  h+='<div class="as-side">'+side('pet','Pet',set&&set.saved?set.pet:null)+side('mount','Montaria',set&&set.saved?set.mount:null)+'</div></div>';
  h+='<p class="as-line">'+(!set?esc2(AS_WHY_SAVE.off)+': a luta usa o que você estiver vestindo.':set.saved?(num(set.missing)>0||gear.some(g=>g.id!=null&&g.have===false)?'Algumas peças salvas não estão mais com você: salve de novo.':'Equipamento da Arena salvo.'):'Nenhum equipamento salvo para a Arena: a luta usa o que você estiver vestindo.')+'</p>';
  if(v.brasa&&v.brasa.on) h+='<p class="as-brasa"><span class="as-i">'+icoOf('brasa')+'</span>Brasa da Arena hoje: '+nT(v.brasa.got)+'/'+nT(v.brasa.cap)+'</p>'+(num(v.brasa.left)<=0?'<p class="as-line">'+esc2(why('brasaCap'))+'.</p>':'<p class="as-line">1 Brasa por vitória na arena.</p>');
  h+='<div id="as_msg" class="as-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
  h+='<div class="as-acts"><button class="as-bt" data-x="as-edit">Editar magias</button>'+(X.arm==='save'?'<button class="as-bt b" data-x="as-saveok">Confirmar: salvar o que estou usando</button>':'<button class="as-bt" data-x="as-save">Salvar equipamento atual</button>')+'</div></div>';
  X.sig=sig(); try{ if(typeof setTimeout==='function') setTimeout(loopStart,0); }catch(e){}
  return h; }
function sig(){ try{ return JSON.stringify([S.sys&&S.sys.grimoire&&S.sys.grimoire.sets||null,S.sys&&S.sys.loadouts&&S.sys.loadouts.sets&&S.sys.loadouts.sets.arena||null,S.sys&&S.sys.bonfire&&S.sys.bonfire.ar||null,X.arm]); }catch(e){ return ''; } }

/* ---------- toques (data-x com o prefixo as-, para não bater com os da Arena) ---------- */
const ACT={
  'as-edit'(){ sfx('ui_tap'); X.arm=''; let ok=false; try{ ok=!!(window.Panels&&typeof Panels.open==='function'&&Panels.open('grim',{from:'arena',mode:'arena'})); }catch(e){ ok=false; }
    if(!ok){ say('O Grimório abre pelo Menu.',true); redraw(); } },
  /* 1º toque: arma. Nada é chamado */
  'as-save'(){ sfx('ui_tap'); const L=LM(); if(!L||!L.DATA||L.DATA.on!==true||typeof L.save!=='function'){ X.arm=''; say(AS_WHY_SAVE.off,true); return redraw(); }
    X.arm='save'; say('Toque em Confirmar: o conjunto da Arena passa a ser o que você veste agora.'); redraw(); },
  /* 2º toque: Sys.loadouts.save UMA vez e, se deu certo, o retrato novo vai para a arena online (Sys.arenaNet.snapshot) */
  'as-saveok'(){ if(X.arm!=='save'){ sfx('ui_tap'); say('Toque primeiro em Salvar equipamento atual.',true); return redraw(); } X.arm='';
    let r=null; try{ r=LM().save(S,'arena',host()); }catch(e){ r=null; }
    if(r&&r.ok){ sfx('ui_ok'); say('Equipamento da Arena salvo.'); try{ const A=window.Sys&&Sys.arenaNet; if(A&&typeof A.snapshot==='function') Promise.resolve(A.snapshot(S,host())).catch(()=>null); }catch(e){} }
    else { sfx('ui_tap'); say(AS_WHY_SAVE[r&&r.reason]||'Não deu agora',true); }
    redraw(); } };
/* devolve true quando o toque era deste bloco (a Arena não precisa tratar) */
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return false; if(!isOn()) return true; if(a!=='as-save'&&a!=='as-saveok') X.arm=''; ACT[a](b); return true; }
/* caixa "+N Brasa" do resultado da luta, no formato do paPvPrize do js/p_arena.js ({img, v, lb}); sem Brasa = null */
function prize(rw){ try{ const n=rw&&typeof rw==='object'?num(rw.brasas):0; if(!(n>0)) return null; return {img:AS_BRASA_IMG,v:'+'+nT(n),lb:n===1?'Brasa':'Brasas'}; }catch(e){ return null; } }
/* imagens que o bloco mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[]; if(!isOn()) return u; try{ const v=viewNow(); for(const s of (v&&v.spells)||[]) if(AS_SPELLS.indexOf(s.id)>=0) u.push(AS_SPELL_DIR+s.id+'.png'); for(const k in AS_SLOT_FILE) u.push(AS_SLOT_DIR+'era'+eraNow()+'_'+AS_SLOT_FILE[k]+'.png'); }catch(e){}
  if(AS_ART_ON) for(const k of ['ring','pet','mount','brasa','empty']) u.push(AS_ART_DIR+k+'.png'); return u; }
/* a aba aparece? tela ligada + sistema ligado */
const tabOn=()=>panelOn()&&isOn();
function tick(){ if(!isOn()) return; if(X.msg&&!X.arm&&now()-X.msgT>AS_MSG_MS){ X.msg=''; const el=byId('as_msg'); if(el){ el.innerHTML=''; } } if(X.sig&&byId('as_msg')&&sig()!==X.sig) redraw(); }
function reset(){ X.arm=''; X.msg=''; X.sig=''; }

/* ---------- PAINEL PRÓPRIO (para conferir o bloco sem mexer na Arena): aviso + Voltar quando desligado ou trancado ---------- */
const bg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.6,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
function gate(d,msg,role){ V.innerHTML=xWrap(d,'','<div class="as-wrap" style="background:'+bg()+'"><div class="as-off"><span role="'+(role||'alert')+'">'+esc2(msg)+'</span><button class="as-gold" data-x="back">Voltar</button></div></div>'); }
function draw(){ const d=xDims(240)||{};
  if(!has()){ loopStop(); return gate(d,'Conjunto PvP indisponível agora.'); }
  if(!isOn()){ loopStop(); return gate(d,why('off')+'.'); }
  if(locked()){ loopStop(); return gate(d,'O Conjunto PvP abre no nível '+nT(lvlNeed())+', junto com a Arena. Continue lutando para liberar.','status'); }
  const body=html(); if(!body){ loopStop(); return gate(d,'Conjunto PvP indisponível agora.'); }
  let y0=0; try{ const sc0=byId('as_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  V.innerHTML=xWrap(d,'','<div class="as-wrap" style="background:'+bg()+'"><div id="as_scroll" class="x-scroll as-scroll">'+body+'</div></div>');
  if(y0){ try{ const sc=byId('as_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  loopStart(); }
function pClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(a==='back'){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} return; }
  if(!isOn()||locked()) return; click(b); }

if(!('arenaset' in PANEL_ON)) PANEL_ON.arenaset=false;
const def=Panels.add(N,{title:'Conjunto PvP',actions:['back'].concat(Object.keys(ACT)),iconOf:icoOf,urls:urls,
  render(){ const u=urls(); try{ const b=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(b) u.push(b); }catch(e){}
    if(typeof pwGate==='function'){ if(pwGate(u)) return; } else if(typeof xGate==='function'&&xGate(u)) return; return draw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return pClick(b); },
  tick(){ tick(); },
  busy(){ return false; },
  onOpen(){ reset(); },
  onClose(){ reset(); loopStop(); } });
window.PArenaSet={X:X,def:def,tab:'Conjunto PvP',actions:Object.keys(ACT),on:tabOn,html:html,click:click,prize:prize,urls:urls,tick:tick,reset:reset,open(){ try{ return !!(window.Panels&&Panels.open(N)); }catch(e){ return false; } }};
})();
