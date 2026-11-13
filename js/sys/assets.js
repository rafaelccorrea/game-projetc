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
  exclude:[/(^|\/)_/,/(^|\/)(src|raw[^/]*|rig)(\/|$)/,/^assets\/map\//,/^assets\/eras_novas\//,/^assets\/bg\/v2\/era5\//,/^assets\/hero\/phases\//,/\.(psd|kra|mp4|webm|mov|bak|bak2|log)$/i],
  preloadNextEra:true, preloadNextPhase:true,
  // pacotes que entram no APK base de TODO jogador novo (o resto: Play asset packs fast-follow/on-demand ou download)
  // os DOIS heróis na fase 0: a escolha Kael/Kaia é feita na criação, depois de instalar
  basePacks:()=>['core','aura','era:0','era:1','enemy:0','enemy:1','hero:kael:0','hero:kaia:0'],
  // Play Asset Delivery: install-time = base; fast-follow = próxima fase do herói e eras 2-3; on-demand = o resto
  fastFollow:hero=>['hero:'+hero+':1','era:2','era:3','enemy:2','enemy:3'],
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
  if((m=/^assets\/anim\/hyb\/(phase([123])|kaia_phase([123])|kaia|R)\//.exec(p))){
    if(/\/(pistol|gun)\/.*_era(\d)_/.test(p)) return 'gun:'+/_era(\d)_/.exec(p)[1];
    const hero=m[1].startsWith('kaia')?'kaia':'kael', ph=m[2]||m[3]||'0'; return 'hero:'+hero+':'+ph; }
  if((m=/^assets\/anim\/hyb\/enemy\/era(\d)_/.exec(p))) return 'enemy:'+m[1];
  if((m=/^assets\/enemies\/era(\d)_/.exec(p))) return 'enemy:'+m[1];
  if((m=/^assets\/anim\/hyb\/kael_[a-z_]+_era(\d)_/.exec(p))) return 'hero:kael:0';
  if((m=/^assets\/anim\/mounts\/kael_([a-z]+)_/.exec(p))) return 'mount:'+m[1];
  if((m=/^assets\/(anim\/)?mounts\/(?:mount_)?([a-z]+)[_.]/.exec(p))) return 'mount:'+m[2];
  if((m=/^assets\/anim\/pets\/([a-z0-9]+_[a-z]+?)(_mid|_evo)?_(run|idle|atk\d)/.exec(p))) return 'pet:'+m[1]+':'+(m[2]==='_mid'?1:m[2]==='_evo'?2:0);
  if(/^assets\/anim\/aura\//.test(p)) return 'aura';
  if((m=/^assets\/(bg|weapons|hero|icons|anim\/ult)\/era(\d)[_.]/.exec(p))) return 'era:'+m[2];
  if((m=/^assets\/bg\/v2\/era(\d)\//.exec(p))) return 'era:'+m[1];
  return 'core'; }

/* ---------------- o que o jogador precisa agora ---------------- */
const heroOf=S=>S&&S.hero==='kaia'?'kaia':'kael';
function phaseOf(S,host){ const PU=SYS().phaseUp, L=SYS().level;
  try{ if(PU&&PU.DATA&&PU.DATA.on===true) return int0(PU.current(S)); if(L&&L.stage){ const g=L.stage(S,host); if(g&&g.on!==false) return int0(g.stage); } }catch(e){} return 0; }
function eraOf(S,host){ const P=SYS().phases; try{ if(P&&P.DATA&&P.DATA.on===true) return P.eraMax(S); }catch(e){} return int0(host&&host.eraMax&&host.eraMax()); }
const maxEra=()=>{ const T=SYS().stats; return T&&T.DATA?int0(T.DATA.maxEra):6; };
const gunEra=e=>e>=3&&e<=6;   // eras com pistola (armas de fogo)
function needed(S,host){ if(!ON()) return {on:false};
  const h=heroOf(S), ph=phaseOf(S,host), e=eraOf(S,host), top=maxEra(), out=new Set(['core','aura','hero:'+h+':'+ph]);
  for(const x of [e,DATA.preloadNextEra?e+1:e]) if(x<=top){ out.add('era:'+x); out.add('enemy:'+x); }
  if(DATA.preloadNextPhase&&ph<3) out.add('hero:'+h+':'+(ph+1));
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

const API={DATA,classify,excluded,needed,setManifest,packBytes,filesOf,plan,firstBoot,packOf};
root.Sys=root.Sys||{}; root.Sys.assets=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
