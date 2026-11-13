/* Eonbound — Sys.assets: CARREGAR SÓ A ARTE EM USO (PO: o APK tem 657 MB; meta < 150 MB no APK base, o resto em pacotes do Play / sob demanda).
   1) classify(caminho) → pacote: core · era:N · enemy:N · hero:<kael|kaia>:<fase 0-3> · gun:N · mount:<id> · pet:<sprite>:<0|1|2> · aura. FONTE ÚNICA da regra:
      o gerador do manifesto (tools/asset-manifest.js → assets/manifest.json, com bytes por pacote) usa esta mesma função.
   2) needed(S, host) → pacotes que o jogador precisa AGORA: core, a era atual e a PRÓXIMA (pré-carga), inimigos das duas, o herói (S.hero) na fase atual
      (Sys.phaseUp/Sys.level) e a próxima, a pistola das eras de arma que ele tem, a montaria e o pet EQUIPADOS (pet no estágio atual), as auras.
   3) plan(S, host, instalados[]) → {need, fetch (faltam), drop (podem sair do aparelho), bytes} com o manifesto; firstBoot(hero) = o APK base do jogador novo.
   A ENTREGA (Play Asset Delivery ou download do servidor + cache) é do engenheiro e do servidor: este módulo só diz O QUE e QUANDO. Sem DOM.
   CHAVE DESLIGADA (DATA.on=false): desligada, needed/plan devolvem {on:false} e o jogo segue carregando tudo como hoje. */
(function(root){
'use strict';
const DATA={
  on:false,
  // o que NÃO vai para o app (mesma regra da cópia do www: fontes brutas, pastas começadas por _, rascunhos)
  // referências de APROVAÇÃO das pastas new/ (grandes) e as guias ficam fora do APK; a Coleção usa só os *_ref_prev.png (pequenos).
  // FICAM no APK os _ref que as telas desenham: assets/pets/<espécie>_ref.png (1º estágio na tela de Pets) e assets/mounts/mount_<id>_ref.png (Códex).
  // assets/mobile = ícones da loja/lançador (vão no build nativo, não no jogo). EXCEÇÃO: o fundo da tela de carregamento
  // (splash_loading.webp e a reserva .jpg, a659e6d) é a 1ª coisa que o jogador vê: vai no core (pacote base). A PNG 1080x1920 fica só no Android.
  exclude:[/^assets\/(pets|mounts|anim\/equip)\/new\/.*_ref\.(png|webp)$/i,/^assets\/hero\/(guides|skins)\//,/^assets\/mobile\/(?!splash(\/splash_loading\.(webp|jpg))?$)/,/(^|\/)_/,/(^|\/)(src|raw[^/]*|rig)(\/|$)/,/^assets\/eras_novas\//,/\.bak[^/]*$/i,/^assets\/hero\/phases\//,/\.(psd|kra|mp4|webm|mov|bak|bak2|log)$/i,/\.bak[_a-z0-9]*$/i,/\.pre-[^/]*$/i],   // bg/v2/era5 ENTRA (cenário vivo 5-8 ligado); *.pre-* = rascunho da Arte
  preloadNextEra:true, preloadNextPhase:true,
  // pacotes que entram no APK base de TODO jogador novo (o resto: Play asset packs fast-follow/on-demand ou download)
  // os DOIS heróis na fase 0: a escolha Kael/Kaia é feita na criação, depois de instalar
  basePacks:()=>['core','era:0','era:1','enemy:0','enemy:1','hero:kael:0','hero:kaia:0'],   // aura saiu para o fast-follow (só item Lendário mostra; PLANO_PACOTES)
  // Play Asset Delivery: install-time = base; fast-follow = próxima fase do herói e eras 2-3; on-demand = o resto
  fastFollow:()=>['aura','era:2','era:3','enemy:2','enemy:3','gun:3'],   // PLANO_PACOTES: sem depender do herói (a Play não sabe o herói na instalação)
  // GRUPO DE ENTREGA por pacote (fonte única; o script da compilação lê do manifesto): base | fast | demand | none (fora do app)
  noneIds:['preview','retired'],
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const norm=p=>String(p||'').replace(/\\/g,'/').replace(/^\.?\//,'').replace(/\?.*$/,'');
const excluded=p=>DATA.exclude.some(r=>r.test(norm(p)));
/* pacote de um caminho (relativo à raiz do jogo) */
function classify(p0){ const p=norm(p0); let m;
  if(!p.startsWith('assets/')) return 'core';
  if(/^assets\/anim\/(look_preview|equip\/preview)\//.test(p)) return 'preview';   // prévias de arte (Modo dono / aprovação): fora do APK do jogador
  if((m=/^assets\/anim\/hyb\/(?:R|kaia[a-z_0-9]*|phase\d)\/(bow|boomerang)\//.exec(p))) return 'weapon:'+m[1];   // herói com arco/bumerangue: só quem tem a arma
  if((m=/^assets\/anim\/hyb\/(phase([123])|kaia_phase([123])|kaia|R)\//.exec(p))){
    if(/\/(pistol|gun)\/.*_era(\d)_/.test(p)) return 'gun:'+/_era(\d)_/.exec(p)[1];
    const hero=m[1].startsWith('kaia')?'kaia':'kael', ph=m[2]||m[3]||'0'; return ph==='0'?'hero:'+hero+':0':'retired'; }   // fases 1-3: sem uso (herói sem crescimento, skins adultas fora)
  if((m=/^assets\/anim\/hyb\/enemy\/era(\d)_/.exec(p))) return 'enemy:'+m[1];
  if((m=/^assets\/enemies\/era(\d)_/.exec(p))) return 'enemy:'+m[1];
  if((m=/^assets\/anim\/hyb\/kael_[a-z_]+_era(\d)_/.exec(p))) return 'hero:kael:0';
  if(/^assets\/anim\/mounts\/(?:kael|kaia)_[a-z]+_[a-z]+_\dstar\./.test(p)) return 'preview';   // folhas por estrela: o jogo faz a aura por CÓDIGO (mountfx MOUNT_AURA, aprovado v0.12.8); só a Prévia do Modo dono usa
  if((m=/^assets\/anim\/mounts\/(?:kael|kaia)_([a-z]+)_/.exec(p))) return 'mount:'+m[1];   // folha montada do Kael e da Kaia (Kaia lote 1: pônei e cavalo)
  if((m=/^assets\/(anim\/)?mounts\/(?:mount_)?([a-z]+)[_.]/.exec(p))) return 'mount:'+m[2];
  if((m=/^assets\/anim\/pets\/([a-z0-9]+_[a-z]+?)(_mid|_evo)?_(run|idle|atk\d)/.exec(p))) return 'pet:'+m[1]+':'+(m[2]==='_mid'?1:m[2]==='_evo'?2:0);
  if((m=/^assets\/map\/era(\d)\./.exec(p))) return 'era:'+m[1];
  if((m=/^assets\/icons\/slots\/era(\d)_[a-z]+_t[12]\.png$/.exec(p))) return 'era:'+m[1];   // arte da era no mapa (o mundo e o relógio ficam no core)
  if((m=/^assets\/anim\/skins\/([a-z0-9_]+?)(?:_nowing)?\//.exec(p))) return 'skin:'+m[1];   // a variante "sem asa" vai no MESMO pacote da skin   // skin fixa nova (corpo padrão): só quem tem a skin baixa
  if(/^assets\/anim\/aura\//.test(p)) return 'aura';
  if(/^assets\/anim\/fx\/(kaia_)?evolve_/.test(p)) return 'retired';   // evolução do herói aposentada (dono: o herói não cresce); fora do APK base
  if((m=/^assets\/anim\/ult\/(?:weapon\/)?([a-z]+)_(legend|legendary|mythic)\./.exec(p))) return 'ult:'+m[1];   // ultimate Lendária própria por família (só quem tem a arma)
  if((m=/^assets\/(bg|weapons|hero|icons|anim\/ult)\/era(\d)[_.]/.exec(p))) return 'era:'+m[2];
  if((m=/^assets\/bg\/v2\/era(\d)\//.exec(p))) return 'era:'+m[1];
  return 'core'; }

/* ---------------- o que o jogador precisa agora ---------------- */
const heroOf=S=>S&&S.hero==='kaia'?'kaia':'kael';
/* pasta do herói = a da SKIN FIXA equipada (decisão do dono: o herói não cresce; 0 padrão, 2 cavaleiro, 3 lendário) */
function phaseOf(S,host){ const A=SYS().appearance;
  try{ if(A&&A.sheets) return int0(A.sheets(S,host).stage); }catch(e){} return 0; }
function eraOf(S,host){ const P=SYS().phases; try{ if(P&&P.DATA&&P.DATA.on===true) return P.eraMax(S); }catch(e){} return int0(host&&host.eraMax&&host.eraMax()); }
const maxEra=()=>{ const T=SYS().stats; return T&&T.DATA?int0(T.DATA.maxEra):6; };
const gunEra=e=>e>=3&&e<=6;   // eras com pistola (armas de fogo)
function needed(S,host){ if(!ON()) return {on:false};
  const h=heroOf(S), ph=phaseOf(S,host), e=eraOf(S,host), top=maxEra(), out=new Set(['core','aura','hero:'+h+':'+ph]);
  for(const x of [e,DATA.preloadNextEra?e+1:e]) if(x<=top){ out.add('era:'+x); out.add('enemy:'+x); }
  if(DATA.preloadNextPhase&&ph<3&&!(SYS().phaseUp&&SYS().phaseUp.DATA&&SYS().phaseUp.DATA.retired===true)) out.add('hero:'+h+':'+(ph+1));
  // armas que ele tem: era de cada arma na mochila/equipada (a arte da arma é pequena; a pistola da era vai junto)
  const inv=Array.isArray(S&&S.inv)?S.inv:[];
  for(const it of inv) if(it&&it.slot==='weapon'){ const we=Number.isInteger(it.look)?it.look:int0(it.e); if(we<=top){ out.add('era:'+we); if(gunEra(we)) out.add('gun:'+we); } }
  if(gunEra(e)) out.add('gun:'+e);
  // montaria e pet EQUIPADOS (só eles; os outros baixam quando forem equipados)
  try{ const M=SYS().mount; if(M&&M.DATA&&M.DATA.on===true){ const eq=M.ensure(S).eq; if(eq) out.add('mount:'+eq); } }catch(e){}
  try{ const P=SYS().pet, b=P&&P.battleInfo?P.battleInfo(S,host):null; if(b&&b.draw&&b.draw.sprite){ out.add('pet:'+b.draw.sprite+':'+Math.max(0,int0(b.stage)-1)); } }catch(e){}
  return {on:true,packs:[...out].sort(),hero:h,phase:ph,era:e}; }

/* ---------------- manifesto e plano ---------------- */
let MAN=null;   // {v, packs:{id:{bytes, files}}} (assets/manifest.json): o jogo carrega e passa em setManifest
const setManifest=m=>{ MAN=m&&m.packs?m:null; return !!MAN; };
const packBytes=id=>MAN&&MAN.packs[id]?int0(MAN.packs[id].bytes):0;
const filesOf=id=>MAN&&MAN.packs[id]?MAN.packs[id].files.slice():[];
/* {on, need, fetch, drop, fetchBytes, keepBytes}: instalados = pacotes já no aparelho (APK base + baixados) */
function plan(S,host,installed){ const n=needed(S,host); if(!n.on) return {on:false}; const have=new Set(Array.isArray(installed)?installed:[]), base=new Set(DATA.basePacks(n.hero));
  const fetch=n.packs.filter(p=>!have.has(p)), drop=[...have].filter(p=>!base.has(p)&&!n.packs.includes(p));
  return {on:true,need:n.packs,fetch,drop,fetchBytes:fetch.reduce((t,p)=>t+packBytes(p),0),keepBytes:n.packs.reduce((t,p)=>t+packBytes(p),0)}; }
/* APK base do jogador novo (herói escolhido na criação; sem escolha, Kael): {packs, bytes, mb} */
function firstBoot(hero){ const h=hero==='kaia'?'kaia':'kael', packs=DATA.basePacks(h); const bytes=packs.reduce((t,p)=>t+packBytes(p),0); return {packs,bytes,mb:Math.round(bytes/1048576*10)/10}; }
/* pacote de um caminho pedido pelo jogo (para o carregador saber o que baixar antes de desenhar) */
const packOf=path=>classify(path);
/* RESOLVEDOR ÚNICO (decisão do PO: Play Asset Delivery; sugestão da fps-6f): o plugin nativo, ao terminar de baixar um pack fast-follow/on-demand,
   registra onde ele ficou (setPackPath(pacote, urlDaPasta), já convertida com Capacitor.convertFileSrc). url(caminhoOriginal) devolve o arquivo no
   pack baixado OU o caminho original (APK base, navegador, testes: tudo segue como hoje). isReady(caminho) diz se dá para desenhar já. */
const PATHS={};
function setPackPath(id,dir){ if(typeof id!=='string') return false; if(dir==null){ delete PATHS[id]; return true; } PATHS[id]=String(dir).replace(/\/+$/,'')+'/'; return true; }
function url(p0){ const p=norm(p0), d=PATHS[classify(p)]; return d?d+p:p0; }
let INST=null;   // lista de pacotes instalados vinda do plugin (EonPacks.status); null = só o setPackPath
const setInstalled=ids=>{ INST=Array.isArray(ids)?ids.filter(x=>typeof x==='string'):null; return INST?INST.length:0; };
const installed=()=>{ const base=DATA.basePacks(); return [...new Set(base.concat(Object.keys(PATHS),INST||[]))].sort(); };
const isReady=p=>{ const id=classify(p); return DATA.basePacks().includes(id)||!!PATHS[id]||!!(INST&&INST.includes(id))||!ON(); };   // desligado: tudo está no APK, como hoje

/* ---------------- PRÉ-CARGA DA CENA (P27, dono: a tela de carregamento espera TODAS as imagens da 1ª cena) ----------------
   sceneSet(S, host, opt) → {files:[caminhos .png/.webp/.json], groups:{hero, weapon, ult, mount, pet, wing, era, enemies, icons}, missing:[]}
   A lista vem do MANIFESTO (setManifest; assets/manifest.json, gerado por tools/asset-manifest.js), então só tem arquivo que existe.
   missing = caminho calculado que o manifesto não tem (manifesto velho ou arte que falta: o engenheiro pode pular ou cair no código).
   Herói: a pasta da skin equipada (Sys.appearance.sheets), corpo e máscaras, + as tintas só da era da ARTE da arma na mão (e a pistola dela);
   arma: assets/weapons/<chave>.png pela família (Sys.stats.weaponType/artEra) e raridade; ultimate: Sys.stats.ultOf(arma).sheet;
   montaria: assets/anim/mounts/<herói>_<id>_* (Kaia: só as que a Arte já fez; sem folha, vazio); pet: pacote pet:<sprite>:<estágio>; asa: wing_<tipo>_L/_R/.json;
   era: fundo assets/bg/v2/era<N>/ + assets/bg/era<N>.png; inimigos: pacote enemy:<N>; ícones: assets/ui e assets/icons. opt.era = era da cena
   (padrão: host.era() ou host.eraMax()). nextEraSet(S, host) = fundo + inimigos da era seguinte (pré-carga em segundo plano). */
const W_RKEY=['t0','raro','t1','mitico','t2','t2'], RNAME_F=['basico','raro','epico','mitico','lendario','lendario'];
const allFiles=()=>{ if(!MAN) return []; const out=[]; for(const id in MAN.packs) for(const f of MAN.packs[id].files||[]) out.push(f); return out; };
const isImg=p=>/\.(png|webp|jpg|json)$/i.test(p);
function equippedOf(S,host,slot){ try{ const e=host&&typeof host.equipped==='function'?host.equipped():null; if(e&&e[slot]) return e[slot]; }catch(e){}
  const id=S&&S.eq&&S.eq[slot]; return id!=null&&Array.isArray(S.inv)?S.inv.find(x=>x&&x.id===id)||null:null; }
function sceneEra(S,host,opt){ if(opt&&opt.era!=null) return int0(opt.era); try{ if(host&&typeof host.era==='function') return int0(host.era()); }catch(e){} return int0(host&&host.eraMax&&host.eraMax()); }
function eraFiles(all,e){ return all.filter(p=>p.startsWith('assets/bg/v2/era'+e+'/')||p==='assets/bg/era'+e+'.png'||p==='assets/bg/era'+e+'.webp'); }
function sceneSet(S,host,opt){ const all=allFiles(), has=new Set(all), T=SYS().stats, A=SYS().appearance, missing=[], G={hero:[],weapon:[],ult:[],mount:[],pet:[],wing:[],era:[],enemies:[],icons:[]};
  const add=(g,p)=>{ if(has.has(p)) G[g].push(p); else missing.push(p); }, addPrefix=(g,pre,filt)=>{ for(const p of all) if(p.startsWith(pre)&&isImg(p)&&!excluded(p)&&(!filt||filt(p))) G[g].push(p); };
  const e=sceneEra(S,host,opt), w=equippedOf(S,host,'weapon');
  // CORTE (engenheiro): só o que a CENA mostra. opt.full=true devolve tudo como antes (máscaras, todas as estrelas da montaria, atk2/atk3, cenário vivo)
  const full=!!(opt&&opt.full); let needMasks=full; try{ if(!full&&A&&A.layers) needMasks=A.layers(S,host).some(l=>l&&(l.source==='cos'||l.layer==='hat'||l.layer==='mask'||l.layer==='glasses')); }catch(x){}
  // arma: família e era da ARTE (nunca a do mapa)
  let artEra=w?int0(w.look!=null?w.look:w.e):0, wt=null, style='melee';
  try{ if(T&&w){ wt=T.weaponType(w); const W=T.DATA.weaponTypes[wt]; if(W&&W.artEra!=null) artEra=W.artEra; style=T.weaponStyle?T.weaponStyle(w):style; } }catch(x){}
  if(w){ const r=int0(w.r); if(wt==='bow'||wt==='boomerang') add('weapon','assets/weapons/'+wt+'_'+RNAME_F[r]+'.png'); else add('weapon','assets/weapons/era'+artEra+'_'+W_RKEY[r]+'.png'); }
  add('weapon','assets/weapons/meta.json');
  try{ const u=T&&w&&T.ultOf?T.ultOf(w):null; if(u&&u.sheet){ add('ult',u.sheet+'.png'); add('ult',u.sheet+'.json'); } }catch(x){}
  // herói (pasta da skin equipada): corpo e máscaras; tintas só da era da arte da arma; pistola só se a arma é de fogo
  let dir='assets/anim/hyb/'+(heroOf(S)==='kaia'?'kaia':'R')+'/'; try{ if(A&&A.sheets) dir=A.sheets(S,host).dir; }catch(x){}
  const tint=/_era(\d)_/; addPrefix('hero',dir,p=>{ const sub=p.slice(dir.length), sd=(/^([a-z]+)\//.exec(sub)||[])[1];   // subpastas de ARMA: pistol/gun (de fogo) e bow/boomerang (a família) só se for a arma na mão
    if(sd==='pistol'||sd==='gun') return style==='gun'&&(!tint.test(p)||+tint.exec(p)[1]===artEra); if(sd&&sd!=='masks') return sd===wt;
    if(sd==='masks'&&!needMasks) return false;   // máscaras só com chapéu/óculos/máscara visível
    if(tint.test(p)) return +tint.exec(p)[1]===artEra; return true; });
  // montaria equipada (folha do herói); das variantes de estrela (_<n>star) só a das estrelas atuais
  try{ const M=SYS().mount, mo=M&&M.ensure?M.ensure(S):null; if(mo&&mo.eq){ const st=int0(mo.owned&&mo.owned[mo.eq]&&mo.owned[mo.eq].stars)||1;
    addPrefix('mount','assets/anim/mounts/'+heroOf(S)+'_'+mo.eq+'_',p=>{ const m=/_(\d)star\./.exec(p); if(m&&!full) return +m[1]===st; return !tint.test(p)||+tint.exec(p)[1]===artEra; }); } }catch(x){}
  // pet equipado: pacote do sprite no estágio (sem os ataques extras atk2/atk3, que carregam depois)
  try{ const P=SYS().pet, b=P&&P.battleInfo?P.battleInfo(S,host):null, sp=b&&b.draw&&b.draw.sprite; if(sp&&MAN){ const pk=MAN.packs['pet:'+sp+':'+Math.max(0,int0(b.stage)-1)]; if(pk) for(const p of pk.files) if(full||!/_atk[23]\./.test(p)) G.pet.push(p); else{} ; if(!pk) missing.push('pet:'+sp); } }catch(x){}
  // asa equipada
  try{ const wi=equippedOf(S,host,'wing'), k=wi&&T&&T.wingOf?T.wingOf(wi):null; if(k){ add('wing','assets/anim/equip/wing_'+k+'_L.png'); add('wing','assets/anim/equip/wing_'+k+'_R.png'); add('wing','assets/anim/equip/wing_'+k+'.json'); } }catch(x){}
  // cenário e inimigos da era da cena; ícones
  G.era=full?eraFiles(all,e):eraFiles(all,e).filter(p=>!p.startsWith('assets/bg/v2/')); if(has.has('assets/bg/meta.json')) G.era.push('assets/bg/meta.json');   // camadas do cenário vivo (bg/v2): o EonScene carrega
  if(MAN&&MAN.packs['enemy:'+e]) G.enemies=MAN.packs['enemy:'+e].files.filter(isImg).slice(); if(has.has('assets/enemies/meta.json')) G.enemies.push('assets/enemies/meta.json');
  addPrefix('icons','assets/ui/'); addPrefix('icons','assets/icons/');
  const files=[...new Set(Object.values(G).flat())];
  return {on:!!MAN,era:e,files,groups:G,missing:[...new Set(missing)],count:files.length}; }
/* pré-carga em segundo plano da era seguinte (fundo + inimigos); vazio na última */
function nextEraSet(S,host,opt){ const all=allFiles(), e=sceneEra(S,host,opt)+1, top=SYS().stats&&SYS().stats.DATA?int0(SYS().stats.DATA.maxEra):6; if(e>top) return {era:e,files:[],groups:{era:[],enemies:[]}};
  const G={era:eraFiles(all,e),enemies:MAN&&MAN.packs['enemy:'+e]?MAN.packs['enemy:'+e].files.filter(isImg).slice():[]};
  return {era:e,files:[...G.era,...G.enemies],groups:G,count:G.era.length+G.enemies.length}; }
/* existe folha MONTADA deste herói nesta montaria? (fonte única para o desenho e a pré-carga) true/false pelo manifesto; null sem manifesto */
/* ÍCONE DA PEÇA POR NÍVEL DE RARIDADE (opção A da Arte, aprovada pelo PO): Básico/Raro = o ícone de hoje (t0), Épico/Mítico = _t1, Lendário/Divino = _t2.
   tierIcon('assets/icons/slots/era2_helmet.png', r) → 'assets/icons/slots/era2_helmet_t1.png' SE o arquivo estiver no manifesto; senão o de hoje
   (a Arte entrega era a era). Sem manifesto, ou com o pacote da era ainda não instalado (Play Asset Delivery), devolve o de hoje. Só peças (não arma, que já tem arte por raridade, nem asa). */
const TIER_OF_R=[0,0,1,1,2,2];
function tierIcon(url,r){ const u=String(url||''), t=TIER_OF_R[Math.max(0,Math.min(5,r|0))]; if(!t||!MAN||!/^assets\/icons\/slots\/era\d_(helmet|vest|gloves|boots|necklace)\.png$/.test(u)) return u;
  const cand=u.replace(/\.png$/,'_t'+t+'.png'); if(!tierIcon.set||tierIcon.man!==MAN){ tierIcon.set=new Set(Object.values(MAN.packs).flatMap(p=>p.files)); tierIcon.man=MAN; } return tierIcon.set.has(cand)&&isReady(cand)?cand:u; }
const mountedArt=(hero,id)=>{ if(!MAN) return null; const h=hero==='kaia'?'kaia':'kael', pk=MAN.packs['mount:'+id]; return !!(pk&&pk.files.some(p=>p==='assets/anim/mounts/'+h+'_'+id+'_idle_body.png'||p==='assets/anim/mounts/'+h+'_'+id+'_run_body.png')); };
/* (1) grupo de entrega e nome do asset pack do Play de um pacote */
const deliveryOf=id=>DATA.basePacks().includes(id)?'base':DATA.noneIds.includes(id)?'none':DATA.fastFollow().includes(id)?'fast':'demand';
/* asset pack do Play (agrupado: limite da Play é 100 e o PO aprovou ~28; o script do Android aceita vários pacotes no mesmo apack):
   base (APK) · era_N (era:N + enemy:N + gun:N) · pet_<espécie> (os 3 estágios) · ults_lendarias (todas as ult:*) · skins (todas as skin:*) · mount_<id> · weapon_<tipo> */
const apackOf=id=>{ const s=String(id); let m;
  if(DATA.basePacks().includes(s)) return 'base';
  if((m=/^(?:era|enemy|gun):(\d)$/.exec(s))) return 'era_'+m[1];
  if((m=/^pet:([a-z0-9_]+):\d$/.exec(s))) return 'pet_'+m[1].replace(/^pet_/,'');
  if(/^ult:/.test(s)) return 'ults_lendarias';
  if(/^skin:/.test(s)) return 'skins';
  return s.replace(/[^a-z0-9]+/gi,'_').toLowerCase(); };
const API={DATA,tierIcon,deliveryOf,apackOf,setInstalled,sceneSet,nextEraSet,mountedArt,classify,excluded,needed,setManifest,packBytes,filesOf,plan,firstBoot,packOf,setPackPath,url,installed,isReady};
root.Sys=root.Sys||{}; root.Sys.assets=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
