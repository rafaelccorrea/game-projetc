/* Testes das TELAS das conveniências do VIP (mochila, bloco "Automático" do Equipamento, forja automática). Carregado pelo smoke.js dentro do
   mesmo vm do jogo (não roda sozinho). Cada função devolve um texto curto ou LANÇA erro. O nível de VIP é escrito direto no save (S.sys.vip),
   sem Sys.vip.setLevel, para não disparar prêmios de nível; tudo é devolvido como estava no fim de cada teste.
   No smoke.js o relógio não anda (setTimeout não roda): o laço da forja automática só é exercitado no smoke_all.js (flushT). */
var VIPCONV_TESTS=(function(){
  function withVip(n,fn){ const s0=S.sys&&S.sys.vip, v0=S.vip, p0=S.set&&S.set.vipAuto?JSON.stringify(S.set.vipAuto):null; let out, err=null;
    try{ if(!S.sys) S.sys={}; S.sys.vip={level:n,active:n>=1,points:0}; out=fn(); }catch(e){ err=e; }
    if(s0===undefined) delete S.sys.vip; else S.sys.vip=s0; S.vip=v0; if(p0===null){ if(S.set) delete S.set.vipAuto; } else S.set.vipAuto=JSON.parse(p0);
    XG.auto=false; XG.autoMsg=''; XG.sel=null; XG.tw=null; XG.toast='';
    if(err) throw err; return out; }
  const gear=()=>{ XG.sel=null; XG.tw=null; XG.cf=null; view='gear'; render(); return V_TEST.innerHTML; };
  const bad=h=>{ if(/undefined|NaN|\[object/.test(h)) throw new Error('undefined/NaN no HTML: '+(h.match(/.{50}(undefined|NaN|\[object).{30}/)||[''])[0]); if(/R\$|comprar vip|preço/i.test(h)) throw new Error('texto de preço/comprar VIP na tela'); return h; };
  const click=(x,extra)=>gClick({dataset:Object.assign({x:x},extra||{})});
  const bagRow=()=>Sys.vip.convTable().find(x=>x.id==='bag');
  const need=id=>Sys.vip.conv(S,id).need;
  const T={};

  T['mochila: contador pelo bagMax e chip do próximo bônus']=function(){
    if(typeof bagMax!=='function') throw new Error('bagMax não carregou'); if(!xVipConvOn()) return 'chave convOn desligada: sem chip (comportamento de antes)';
    const vals=bagRow().values, out=[]; let first=-1, last=0; for(let i=0;i<vals.length;i++){ if(first<0&&vals[i]>0) first=i; if(vals[i]>vals[last]) last=i; }
    for(const lv of [0,first,last]) withVip(lv,function(){ const h=bad(gear()), want='Mochila '+S.inv.length+'/'+bagMax();
      if(bagMax()!==BAG_MAX+vals[lv]) throw new Error('bagMax '+bagMax()+' no VIP '+lv);
      if(h.indexOf(want)<0) throw new Error('VIP '+lv+': contador sem "'+want+'"');
      const nx=xBagNext(); let exp=null; for(let i=lv+1;i<vals.length;i++) if(vals[i]>vals[lv]){ exp='VIP '+i+': +'+vals[i]; break; }
      if((nx?nx.text:null)!==exp) throw new Error('VIP '+lv+': chip "'+(nx&&nx.text)+'", esperado "'+exp+'"');
      if(exp){ if(h.indexOf('data-x="bagvip"')<0||h.indexOf(exp)<0) throw new Error('VIP '+lv+': chip fora da tela'); XG.toast=''; click('bagvip'); if(String(XG.toast).indexOf('VIP '+nx.vip)<0||/R\$/.test(XG.toast)) throw new Error('toque no chip não explicou: '+XG.toast); }
      else if(h.indexOf('data-x="bagvip"')>=0) throw new Error('VIP '+lv+': chip sobrando no maior nível');
      out.push('VIP '+lv+': '+want.slice(8)+(exp?' ['+exp+']':' [sem chip]')); });
    return out.join(' · '); };

  T['mochila: loja recusa a compra pelo bagMax']=function(){
    return withVip(0,function(){ const inv0=S.inv, sh0=S.shop, g0=S.gold; let err=null, r='';
      try{ const base=inv0[0]; S.inv=[]; for(let i=0;i<bagMax();i++) S.inv.push(base);
        S.shop=Object.assign({},S.shop,{offers:[{slot:'weapon',r:0,e:0,price:1,sold:false}]}); S.gold=1e6; XH.tab='item'; XH.cf={kind:'item',i:0}; view='shop'; hClick({dataset:{x:'cfyes'}});
        if(S.shop.offers[0].sold||S.gold!==1e6) throw new Error('comprou com a mochila cheia ('+S.inv.length+'/'+bagMax()+')'); r='cheia em '+bagMax()+': recusou';
        S.sys.vip={level:bagRow().values.findIndex(v=>v>0),active:true,points:0}; if(!(S.inv.length<bagMax())) throw new Error('VIP não abriu espaço'); r+='; com VIP o limite vai a '+bagMax();
      }catch(e){ err=e; } S.inv=inv0; S.shop=sh0; S.gold=g0; XH.cf=null; if(err) throw err; return r; }); };

  T['automático: trancado mostra VIP n, explica e não liga']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn: bloco não existe';
    return withVip(0,function(){ const lt=Sys.vip.conv(S,'autoSell').lockText; let h=bad(gear());
      if(h.indexOf('data-x="auto"')<0) throw new Error('entrada Automático escondida para quem não tem VIP'); if(h.indexOf(lt)<0) throw new Error('entrada sem "'+lt+'"');
      click('auto'); h=bad(V_TEST.innerHTML); if(!XG.auto||h.indexOf('role="dialog" aria-label="Automático"')<0) throw new Error('não abriu');
      if(/autoEquip|Equipar o melhor sozinho/.test(h)) throw new Error('interruptor de equipar sozinho na tela (decisão do dono: não é de VIP)');
      for(const k of ['autoSell0','autoSell1']) if(h.indexOf('data-k="'+k+'"')<0) throw new Error('sem o interruptor '+k);
      if(h.indexOf('Desmanchar ao pegar: Básico')<0||h.indexOf('Desmanchar ao pegar: Raro')<0) throw new Error('nomes dos interruptores');
      const fuse=!!VipAuto.state(S).autoFuse.available; if((h.indexOf('data-k="autoFuse"')>=0)!==fuse) throw new Error('Fusão: interruptor '+(fuse?'faltando':'sobrando'));
      if(h.indexOf('itens novos e nunca toca no equipado')<0) throw new Error('sem a linha de ajuda'); if(h.indexOf('Ir à Loja')<0) throw new Error('sem Ir à Loja');
      click('autosw',{k:'autoSell0'}); const p=VipAuto.prefs(S); if(p.autoSell[0]||p.autoSell[1]) throw new Error('ligou sem VIP');
      if(String(XG.autoMsg).indexOf(lt)<0) throw new Error('recusa sem o texto: '+XG.autoMsg); h=bad(V_TEST.innerHTML); if(h.indexOf(esc2(XG.autoMsg))<0) throw new Error('aviso fora da tela');
      if(/aria-checked="true"/.test(h.slice(h.indexOf('aria-label="Automático"')))) throw new Error('interruptor aparece ligado');
      const msg=XG.autoMsg; click('autox'); if(XG.auto) throw new Error('não fechou'); return 'trancado com '+lt+'; aviso "'+msg.slice(0,70)+'"'; }); };

  T['automático: com o nível liga e desliga pelo VipAuto.setPref']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn';
    return withVip(need('autoSell'),function(){ gear(); click('auto'); let h=bad(V_TEST.innerHTML); if(h.indexOf('Trancado')>=0&&!VipAuto.state(S).autoFuse.available) throw new Error('ainda trancado no VIP '+need('autoSell'));
      if(h.indexOf('Ir à Loja')>=0) throw new Error('Ir à Loja sem nada trancado');
      click('autosw',{k:'autoSell0'}); let p=VipAuto.prefs(S); if(!p.autoSell[0]||p.autoSell[1]) throw new Error('Básico não ligou sozinho: '+JSON.stringify(p));
      h=bad(V_TEST.innerHTML); if(!/data-k="autoSell0" role="switch" aria-checked="true"/.test(h)||!/data-k="autoSell1" role="switch" aria-checked="false"/.test(h)) throw new Error('estado dos interruptores no HTML');
      click('autosw',{k:'autoSell1'}); p=VipAuto.prefs(S); if(!p.autoSell[0]||!p.autoSell[1]) throw new Error('Raro não ligou');
      click('autox'); h=bad(gear()); if(h.indexOf('2 ligados')<0) throw new Error('entrada não conta os ligados');
      click('auto'); click('autosw',{k:'autoSell0'}); click('autosw',{k:'autoSell1'}); p=VipAuto.prefs(S); if(p.autoSell[0]||p.autoSell[1]) throw new Error('não desligou');
      click('autosw',{k:'autoEquip'}); if(VipAuto.prefs(S).autoEquip) throw new Error('chave autoEquip aceita pela tela');
      return 'ligou Básico, Raro; contou 2 ligados; desligou'; }); };

  T['automático: Ir à Loja leva à Loja e o bloco fecha']=function(){
    if(!xVipConvOn()||!window.VipAuto) return 'sem VipAuto/convOn';
    /* o setView real do index não roda no DOM falso (app.style.setProperty): troca por um registrador só durante o toque */
    return withVip(0,function(){ gear(); click('auto'); const sv=setView; let got=null, err=null; setView=function(v){ got=v; }; try{ click('autoshop'); }catch(e){ err=e; } setView=sv; if(err) throw err;
      if(got!=='shop') throw new Error('foi para "'+got+'"'); if(XG.auto) throw new Error('bloco ficou aberto'); return 'setView(shop); bloco fechado'; }); };

  /* ---------- forja automática ---------- */
  function forgeEnv(vip,fn){ const L=Sys.level, iu=L&&L.isUnlocked, f0=JSON.stringify(Sys.forge.ensure(S)), g0=S.gold, x0={mode:XF.mode,slot:XF.slot,goal:XF.goal}, v0=view;
    return withVip(vip,function(){ let out, err=null; try{ if(L) L.isUnlocked=function(){ return true; }; fStop(); XF.mode='forge'; XF.slot='weapon'; XF.goal=null; XF.toast=''; view='forge'; S.gold=5e9;
        const o=Sys.forge.ensure(S); o.lv.weapon=0; o.pity.weapon=0; o.stones=5000; out=fn(o); }catch(e){ err=e; }
      fStop(); if(typeof flushT==='function') flushT(); if(L) L.isUnlocked=iu; S.sys.forge=JSON.parse(f0); S.gold=g0; XF.mode=x0.mode; XF.slot=x0.slot; XF.goal=x0.goal; XF.toast=''; view=v0; if(err) throw err; return out; }); }
  const fc=(x,extra)=>fClick({dataset:Object.assign({x:x},extra||{})});
  const runAll=()=>{ if(typeof flushT!=='function') return false; for(let i=0;i<80&&(XF.busy||(XF.auto&&XF.auto.run));i++) flushT(); return true; };

  T['forja automática: trancada mostra VIP n, explica e não forja']=function(){
    const cv=Sys.vip.conv(S,'autoForge'); if(!xVipConvOn()||!cv) return 'sem a conveniência';
    return forgeEnv(0,function(o){ render(); const h=bad(V_TEST.innerHTML), lt=Sys.vip.conv(S,'autoForge').lockText;
      if(h.indexOf('data-x="autogo"')<0) throw new Error('forja automática escondida'); if(h.indexOf(lt)<0) throw new Error('sem "'+lt+'"'); if(h.indexOf('data-x="goal"')>=0) throw new Error('seletor de alvo aparece trancado');
      const t0=o.tries, s0=o.stones; fc('autogo'); runAll(); if(o.tries!==t0||o.stones!==s0||XF.auto) throw new Error('forjou sem VIP');
      if(String(XF.toast).indexOf(lt)<0||/R\$/.test(XF.toast)) throw new Error('aviso: '+XF.toast); return 'trancada com '+lt+'; aviso "'+XF.toast.slice(0,50)+'"'; }); };

  T['forja automática: seletor de alvo respeita mínimo e teto']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ render(); let h=bad(V_TEST.innerHTML); if(h.indexOf('data-x="goal"')<0||h.indexOf('Forjar até +1')<0) throw new Error('sem seletor/botão (alvo inicial +1)');
      fc('goal',{d:'-1'}); if(fGoal('weapon')!==1) throw new Error('alvo abaixo do próximo nível'); const mx=fGoalMax(); for(let i=0;i<30;i++) fc('goal',{d:'1'});
      if(fGoal('weapon')!==mx) throw new Error('alvo '+fGoal('weapon')+' em vez do teto '+mx); h=bad(V_TEST.innerHTML); if(h.indexOf('Forjar até +'+mx)<0) throw new Error('botão sem o alvo novo');
      return 'alvo de +1 a +'+mx+' (teto da era/máximo)'; }); };

  T['forja automática: vai até o alvo, nunca passa, resumo confere']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ const goal=Math.min(5,fGoalMax()); render(); for(let i=1;i<goal;i++) fc('goal',{d:'1'}); if(fGoal('weapon')!==goal) throw new Error('alvo '+fGoal('weapon'));
      const t0=o.tries, s0=o.spent, g0=S.gold; fc('autogo'); const A=XF.auto; if(!A||!A.run||A.tries!==1) throw new Error('não começou: '+JSON.stringify(A));
      let h=bad(V_TEST.innerHTML); if(h.indexOf('data-x="autostop"')<0||h.indexOf('Forjando até +'+goal)<0) throw new Error('sem progresso/Parar');
      const lvMid=o.lv.weapon; fc('forge'); fc('slot',{slot:'armor'}); fc('mode',{m:'level'}); if(o.tries!==t0+1||XF.slot!=='weapon'||XF.mode!=='forge') throw new Error('toque valeu durante a automática');
      if(!runAll()) return 'sem relógio neste teste: 1º passo feito (nível '+lvMid+'), progresso e Parar na tela';
      if(A.run) throw new Error('não terminou'); if(o.lv.weapon!==goal) throw new Error('parou em +'+o.lv.weapon+' (alvo +'+goal+')'); if(A.why!=='goal'||A.to!==goal) throw new Error('motivo '+A.why);
      if(A.tries!==o.tries-t0||A.stones!==o.spent-s0||A.wins!==goal) throw new Error('resumo não bate: '+JSON.stringify(A)+' × '+(o.tries-t0)+' tentativas, '+(o.spent-s0)+' pedras');
      if(Math.abs((g0-S.gold)-A.gold)>0.5) throw new Error('ouro do resumo '+A.gold+' × gasto '+(g0-S.gold));
      h=bad(V_TEST.innerHTML); if(h.indexOf('id="f_autosum"')<0||h.indexOf('Chegou ao alvo')<0||h.indexOf('data-x="autostop"')>=0) throw new Error('resumo fora da tela');
      return '+0 → +'+goal+' em '+A.tries+' tentativas, '+A.wins+' acertos, '+A.stones+' pedras'; }); };

  T['forja automática: Parar interrompe; sem pedra para e avisa']=function(){
    if(!xVipConvOn()) return 'sem a conveniência';
    return forgeEnv(need('autoForge'),function(o){ const mx=fGoalMax(); if(mx<3) return 'teto baixo demais para o teste'; render(); for(let i=0;i<30;i++) fc('goal',{d:'1'});
      const t0=o.tries; fc('autogo'); fc('autostop'); const A=XF.auto; if(!A||A.run||A.why!=='stop') throw new Error('Parar não parou'); const clock=runAll();
      if(o.tries!==t0+1) throw new Error('tentou de novo depois do Parar: '+(o.tries-t0)); if(clock&&bad(V_TEST.innerHTML).indexOf('Parada por você')<0) throw new Error('resumo do Parar');
      /* pedras para UMA tentativa só: para por falta de pedra com 1 tentativa */
      fStop(); o.stones=Sys.forge.canTry(S,Sys.host,'weapon').stones; const t1=o.tries; fc('autogo'); const B=XF.auto; if(!clock) return 'Parar ok (sem relógio: falta de pedra só no smoke_all)';
      runAll(); if(o.tries!==t1+1||B.why!=='stones'||B.run) throw new Error('sem pedra: '+JSON.stringify(B)); if(bad(V_TEST.innerHTML).indexOf('faltaram pedras')<0) throw new Error('resumo sem o motivo');
      /* zero pedras: nem começa, aviso comum */
      fStop(); o.stones=0; XF.toast=''; fc('autogo'); if(XF.auto||o.tries!==t1+1) throw new Error('começou sem pedra'); if(String(XF.toast).indexOf('Pedras de Forja insuficientes')<0) throw new Error('aviso: '+XF.toast);
      return 'Parar: 1 tentativa; falta de pedra: parou com o motivo; zero pedras: aviso comum'; }); };
  return T; })();
